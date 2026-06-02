import pool from '../db/index.js'
import { sendQnAReplyEmail } from '../utils/emailService.js'
import logger from '../utils/logger.js'

// Q&A 접근 권한 확인 (수강 승인된 학생 OR 코치 본인)
const checkQnAAccess = async (lectureId, userId) => {
  const [[lecture]] = await pool.query('SELECT coach_id FROM lectures WHERE id = ?', [lectureId])
  if (!lecture) return false
  if (lecture.coach_id === userId) return true
  const [[app]] = await pool.query(
    "SELECT id FROM applications WHERE lecture_id = ? AND student_id = ? AND status = 'approved'",
    [lectureId, userId]
  )
  return !!app
}

// GET /api/lectures/:lectureId/qna
export const getQnAPosts = async (req, res, next) => {
  try {
    const { lectureId } = req.params
    const { page = 1, solved } = req.query
    const limit  = 15
    const offset = (Number(page) - 1) * limit

    const hasAccess = await checkQnAAccess(lectureId, req.user.id)
    if (!hasAccess) return res.status(403).json({ success: false, message: '수강 중인 강의의 Q&A만 볼 수 있습니다.' })

    let where = 'WHERE p.lecture_id = ?'
    const params = [lectureId]
    if (solved !== undefined) { where += ' AND p.is_solved = ?'; params.push(Number(solved)) }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM qna_posts p ${where}`, params)
    const [rows] = await pool.query(`
      SELECT p.*, u.nickname AS author_nickname, u.role AS author_role,
             COUNT(DISTINCT c.id) AS comment_count
      FROM qna_posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN qna_comments c ON c.post_id = p.id
      ${where}
      GROUP BY p.id, u.nickname, u.role
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset])

    res.json({ success: true, data: rows, total, page: Number(page), totalPages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
}

// POST /api/lectures/:lectureId/qna
export const createQnAPost = async (req, res, next) => {
  try {
    const { lectureId } = req.params
    const { title, content } = req.body
    if (!title?.trim() || !content?.trim())
      return res.status(400).json({ success: false, message: '제목과 내용을 입력해주세요.' })

    const hasAccess = await checkQnAAccess(lectureId, req.user.id)
    if (!hasAccess) return res.status(403).json({ success: false, message: '수강 중인 강의에만 질문할 수 있습니다.' })

    const [result] = await pool.query(
      'INSERT INTO qna_posts (lecture_id, user_id, title, content) VALUES (?, ?, ?, ?)',
      [lectureId, req.user.id, title.trim(), content.trim()]
    )
    res.status(201).json({ success: true, data: { id: result.insertId } })
  } catch (err) { next(err) }
}

// GET /api/qna/:id
export const getQnAPostById = async (req, res, next) => {
  try {
    const [[post]] = await pool.query(`
      SELECT p.*, u.nickname AS author_nickname, u.role AS author_role
      FROM qna_posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?
    `, [req.params.id])
    if (!post) return res.status(404).json({ success: false, message: 'Q&A를 찾을 수 없습니다.' })

    const hasAccess = await checkQnAAccess(post.lecture_id, req.user.id)
    if (!hasAccess) return res.status(403).json({ success: false, message: '접근 권한이 없습니다.' })

    await pool.query('UPDATE qna_posts SET view_count = view_count + 1 WHERE id = ?', [req.params.id])

    const [comments] = await pool.query(`
      SELECT c.*, u.nickname AS author_nickname, u.role AS author_role
      FROM qna_comments c JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? ORDER BY c.is_answer DESC, c.created_at ASC
    `, [req.params.id])

    res.json({ success: true, data: { ...post, comments } })
  } catch (err) { next(err) }
}

// PUT /api/qna/:id
export const updateQnAPost = async (req, res, next) => {
  try {
    const [[post]] = await pool.query('SELECT user_id FROM qna_posts WHERE id = ?', [req.params.id])
    if (!post) return res.status(404).json({ success: false, message: 'Q&A를 찾을 수 없습니다.' })
    if (post.user_id !== req.user.id) return res.status(403).json({ success: false, message: '본인 글만 수정할 수 있습니다.' })
    const { title, content } = req.body
    await pool.query('UPDATE qna_posts SET title = ?, content = ? WHERE id = ?', [title, content, req.params.id])
    res.json({ success: true, message: '수정됐습니다.' })
  } catch (err) { next(err) }
}

// DELETE /api/qna/:id
export const deleteQnAPost = async (req, res, next) => {
  try {
    const [[post]] = await pool.query('SELECT user_id, lecture_id FROM qna_posts WHERE id = ?', [req.params.id])
    if (!post) return res.status(404).json({ success: false, message: 'Q&A를 찾을 수 없습니다.' })
    const [[lecture]] = await pool.query('SELECT coach_id FROM lectures WHERE id = ?', [post.lecture_id])
    if (post.user_id !== req.user.id && lecture.coach_id !== req.user.id)
      return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' })
    await pool.query('DELETE FROM qna_posts WHERE id = ?', [req.params.id])
    res.json({ success: true, message: '삭제됐습니다.' })
  } catch (err) { next(err) }
}

// POST /api/qna/:id/comments
export const createQnAComment = async (req, res, next) => {
  try {
    const [[post]] = await pool.query(
      'SELECT p.lecture_id, p.title, p.user_id, l.title AS lecture_title FROM qna_posts p JOIN lectures l ON p.lecture_id = l.id WHERE p.id = ?',
      [req.params.id]
    )
    if (!post) return res.status(404).json({ success: false, message: 'Q&A를 찾을 수 없습니다.' })

    const hasAccess = await checkQnAAccess(post.lecture_id, req.user.id)
    if (!hasAccess) return res.status(403).json({ success: false, message: '접근 권한이 없습니다.' })

    const { content } = req.body
    if (!content?.trim()) return res.status(400).json({ success: false, message: '내용을 입력해주세요.' })

    const [result] = await pool.query(
      'INSERT INTO qna_comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, content.trim()]
    )

    const [[newComment]] = await pool.query(`
      SELECT c.*, u.nickname AS author_nickname, u.role AS author_role
      FROM qna_comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?
    `, [result.insertId])

    // 코치가 답변 달면 질문 작성자에게 이메일 알림 (비동기)
    if (req.user.role === 'coach' && post.user_id !== req.user.id) {
      const [[questioner]] = await pool.query('SELECT email, nickname FROM users WHERE id = ?', [post.user_id])
      sendQnAReplyEmail({
        to:           questioner.email,
        nickname:     questioner.nickname,
        lectureTitle: post.lecture_title,
        questionTitle: post.title,
        lectureId:    post.lecture_id,
        postId:       req.params.id,
      }).catch(err => logger.error('[createQnAComment] 이메일 발송 실패', { error: err.message }))
    }

    res.status(201).json({ success: true, data: newComment })
  } catch (err) { next(err) }
}

// PUT /api/qna/:postId/solve/:commentId
export const solveQnA = async (req, res, next) => {
  try {
    const [[post]] = await pool.query('SELECT lecture_id FROM qna_posts WHERE id = ?', [req.params.postId])
    if (!post) return res.status(404).json({ success: false, message: 'Q&A를 찾을 수 없습니다.' })
    const [[lecture]] = await pool.query('SELECT coach_id FROM lectures WHERE id = ?', [post.lecture_id])
    if (lecture.coach_id !== req.user.id)
      return res.status(403).json({ success: false, message: '코치만 답변을 채택할 수 있습니다.' })

    await pool.query('UPDATE qna_comments SET is_answer = 0 WHERE post_id = ?', [req.params.postId])
    await pool.query('UPDATE qna_comments SET is_answer = 1 WHERE id = ? AND post_id = ?',
      [req.params.commentId, req.params.postId])
    await pool.query('UPDATE qna_posts SET is_solved = 1 WHERE id = ?', [req.params.postId])
    res.json({ success: true, message: '답변이 채택됐습니다.' })
  } catch (err) { next(err) }
}

// DELETE /api/qna-comments/:id
export const deleteQnAComment = async (req, res, next) => {
  try {
    const [[comment]] = await pool.query('SELECT user_id FROM qna_comments WHERE id = ?', [req.params.id])
    if (!comment) return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' })
    if (comment.user_id !== req.user.id)
      return res.status(403).json({ success: false, message: '본인 댓글만 삭제할 수 있습니다.' })
    await pool.query('DELETE FROM qna_comments WHERE id = ?', [req.params.id])
    res.json({ success: true, message: '삭제됐습니다.' })
  } catch (err) { next(err) }
}
