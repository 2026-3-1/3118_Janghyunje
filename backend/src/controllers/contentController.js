import pool from '../db/index.js'

// YouTube URL → embed URL 변환
const toEmbedUrl = (url) => {
  if (!url) return url
  if (url.includes('youtube.com/embed/')) return url
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/)
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`
  const watchMatch = url.match(/[?&]v=([^?&]+)/)
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`
  return url
}

// GET /api/lectures/:lectureId/contents
export const getContents = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM lecture_contents WHERE lecture_id = ? ORDER BY order_num ASC, id ASC',
      [req.params.lectureId]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

// GET /api/contents/:id
export const getContentById = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM lecture_contents WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ success: false, message: '콘텐츠를 찾을 수 없습니다.' })
    res.json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
}

// POST /api/lectures/:lectureId/contents — 코치 본인 강의에만 등록 가능
export const createContent = async (req, res, next) => {
  try {
    // 본인 강의 여부 확인
    const [lectures] = await pool.query('SELECT coach_id FROM lectures WHERE id = ?', [req.params.lectureId])
    if (!lectures.length)
      return res.status(404).json({ success: false, message: '강의를 찾을 수 없습니다.' })
    if (lectures[0].coach_id !== req.user.id)
      return res.status(403).json({ success: false, message: '본인 강의에만 콘텐츠를 등록할 수 있습니다.' })

    const { title, description, type, url, order_num } = req.body
    if (!title || !url) return res.status(400).json({ success: false, message: '제목과 URL은 필수입니다.' })

    const embedUrl = type === 'video' ? toEmbedUrl(url) : url
    const [result] = await pool.query(
      'INSERT INTO lecture_contents (lecture_id, title, description, type, url, order_num) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.lectureId, title, description || '', type || 'video', embedUrl, order_num || 0]
    )
    res.status(201).json({ success: true, data: { id: result.insertId } })
  } catch (err) { next(err) }
}

// PUT /api/contents/:id — 코치 본인 강의 콘텐츠만 수정
export const updateContent = async (req, res, next) => {
  try {
    const [contents] = await pool.query(
      'SELECT lc.id, l.coach_id FROM lecture_contents lc JOIN lectures l ON lc.lecture_id = l.id WHERE lc.id = ?',
      [req.params.id]
    )
    if (!contents.length)
      return res.status(404).json({ success: false, message: '콘텐츠를 찾을 수 없습니다.' })
    if (contents[0].coach_id !== req.user.id)
      return res.status(403).json({ success: false, message: '본인 강의 콘텐츠만 수정할 수 있습니다.' })

    const { title, description, type, url, order_num } = req.body
    const embedUrl = type === 'video' ? toEmbedUrl(url) : url
    await pool.query(
      'UPDATE lecture_contents SET title=?, description=?, type=?, url=?, order_num=? WHERE id=?',
      [title, description, type, embedUrl, order_num, req.params.id]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
}

// DELETE /api/contents/:id — 코치 본인 강의 콘텐츠만 삭제
export const deleteContent = async (req, res, next) => {
  try {
    const [contents] = await pool.query(
      'SELECT lc.id, l.coach_id FROM lecture_contents lc JOIN lectures l ON lc.lecture_id = l.id WHERE lc.id = ?',
      [req.params.id]
    )
    if (!contents.length)
      return res.status(404).json({ success: false, message: '콘텐츠를 찾을 수 없습니다.' })
    if (contents[0].coach_id !== req.user.id)
      return res.status(403).json({ success: false, message: '본인 강의 콘텐츠만 삭제할 수 있습니다.' })

    await pool.query('DELETE FROM lecture_contents WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) { next(err) }
}

// GET /api/contents/:id/comments
export const getComments = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, u.nickname, u.tier
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.content_id = ?
       ORDER BY c.created_at ASC`,
      [req.params.id]
    )
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

// POST /api/contents/:id/comments — P2: user_id를 JWT(req.user.id)에서 추출
export const createComment = async (req, res, next) => {
  try {
    const { comment } = req.body
    const user_id = req.user.id  // JWT에서 추출

    if (!comment?.trim())
      return res.status(400).json({ success: false, message: '내용을 입력해주세요.' })

    const [result] = await pool.query(
      'INSERT INTO comments (content_id, user_id, comment) VALUES (?, ?, ?)',
      [req.params.id, user_id, comment.trim()]
    )
    const [rows] = await pool.query(
      `SELECT c.*, u.nickname, u.tier FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?`,
      [result.insertId]
    )
    res.status(201).json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
}

// DELETE /api/comments/:id — 본인 댓글만 삭제 가능
export const deleteComment = async (req, res, next) => {
  try {
    const [comments] = await pool.query('SELECT user_id FROM comments WHERE id = ?', [req.params.id])
    if (!comments.length)
      return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' })
    if (comments[0].user_id !== req.user.id)
      return res.status(403).json({ success: false, message: '본인 댓글만 삭제할 수 있습니다.' })

    await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) { next(err) }
}
