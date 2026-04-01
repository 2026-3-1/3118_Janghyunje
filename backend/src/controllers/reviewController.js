import pool from '../db/index.js'

// GET /api/reviews/:lectureId
export const getReviews = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, u.nickname AS student_nickname, u.tier AS student_tier
      FROM reviews r
      JOIN users u ON r.student_id = u.id
      WHERE r.lecture_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.lectureId])
    res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
}

// POST /api/reviews  (P1: student_id body로 받음)
export const createReview = async (req, res, next) => {
  try {
    const { lecture_id, student_id, rating, comment } = req.body
    if (!lecture_id || !student_id || !rating)
      return res.status(400).json({ success: false, message: '필수 항목이 누락됐습니다.' })

    const [result] = await pool.query(
      'INSERT INTO reviews (lecture_id, student_id, rating, comment) VALUES (?, ?, ?, ?)',
      [lecture_id, student_id, rating, comment]
    )
    res.status(201).json({ success: true, data: { id: result.insertId } })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ success: false, message: '이미 리뷰를 작성했습니다.' })
    next(err)
  }
}
