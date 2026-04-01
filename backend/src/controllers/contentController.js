import pool from '../db/index.js'

// YouTube URL → embed URL 변환
const toEmbedUrl = (url) => {
  if (!url) return url
  // 이미 embed URL이면 그대로
  if (url.includes('youtube.com/embed/')) return url
  // youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/)
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`
  // youtube.com/watch?v=VIDEO_ID
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

// POST /api/lectures/:lectureId/contents
export const createContent = async (req, res, next) => {
  try {
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

// PUT /api/contents/:id
export const updateContent = async (req, res, next) => {
  try {
    const { title, description, type, url, order_num } = req.body
    const embedUrl = type === 'video' ? toEmbedUrl(url) : url
    await pool.query(
      'UPDATE lecture_contents SET title=?, description=?, type=?, url=?, order_num=? WHERE id=?',
      [title, description, type, embedUrl, order_num, req.params.id]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
}

// DELETE /api/contents/:id
export const deleteContent = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM lecture_contents WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) { next(err) }
}

// ── 댓글 ──────────────────────────────────────────────────────────────

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

// POST /api/contents/:id/comments
export const createComment = async (req, res, next) => {
  try {
    const { user_id, comment } = req.body
    if (!user_id || !comment?.trim())
      return res.status(400).json({ success: false, message: '내용을 입력해주세요.' })
    const [result] = await pool.query(
      'INSERT INTO comments (content_id, user_id, comment) VALUES (?, ?, ?)',
      [req.params.id, user_id, comment.trim()]
    )
    // 방금 작성한 댓글 + 유저 정보 반환
    const [rows] = await pool.query(
      `SELECT c.*, u.nickname, u.tier FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?`,
      [result.insertId]
    )
    res.status(201).json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
}

// DELETE /api/comments/:id
export const deleteComment = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) { next(err) }
}
