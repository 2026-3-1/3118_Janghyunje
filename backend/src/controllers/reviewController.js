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
  } catch (err) { next(err) }
}

// POST /api/reviews — 수강 승인 + 60% 이상 수강 시에만 작성 가능
export const createReview = async (req, res, next) => {
  try {
    const { lecture_id, rating, comment } = req.body
    const student_id = req.user.id

    if (!lecture_id || !rating)
      return res.status(400).json({ success: false, message: '필수 항목이 누락됐습니다.' })

    // 수강 승인 확인
    const [apps] = await pool.query(
      "SELECT id FROM applications WHERE lecture_id = ? AND student_id = ? AND status = 'approved'",
      [lecture_id, student_id]
    )
    if (!apps.length)
      return res.status(403).json({ success: false, message: '수강이 승인된 강의에만 리뷰를 작성할 수 있습니다.' })

    // 진도율 60% 이상 확인
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM lecture_contents WHERE lecture_id = ?',
      [lecture_id]
    )
    if (total > 0) {
      const [[{ done }]] = await pool.query(
        'SELECT COUNT(*) AS done FROM content_progress WHERE user_id = ? AND lecture_id = ? AND completed = 1',
        [student_id, lecture_id]
      )
      const percent = Math.round((done / total) * 100)
      if (percent < 60)
        return res.status(403).json({
          success: false,
          message: `강의를 60% 이상 수강해야 리뷰를 작성할 수 있습니다. (현재 ${percent}%)`,
          code: 'PROGRESS_REQUIRED',
          percent,
        })
    }

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
