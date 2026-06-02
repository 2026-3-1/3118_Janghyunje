import pool from '../db/index.js'

// GET /api/admin/stats
export const getStats = async (req, res, next) => {
  try {
    const [[users]]    = await pool.query("SELECT COUNT(*) AS total, SUM(role='student') AS students, SUM(role='coach') AS coaches FROM users WHERE is_active=1")
    const [[lectures]] = await pool.query("SELECT COUNT(*) AS total, SUM(status='active') AS active FROM lectures")
    const [[apps]]     = await pool.query("SELECT COUNT(*) AS total FROM applications WHERE status='approved'")
    const [[reviews]]  = await pool.query("SELECT COUNT(*) AS total, ROUND(AVG(rating),2) AS avg_rating FROM reviews")
    const [gameStats]  = await pool.query("SELECT game, COUNT(*) AS count FROM lectures WHERE status='active' GROUP BY game ORDER BY count DESC")
    const [todayUsers] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE DATE(created_at) = CURDATE()")
    const [weekUsers]  = await pool.query("SELECT COUNT(*) AS count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")

    res.json({
      success: true,
      data: {
        users:       { total: users.total, students: users.students, coaches: users.coaches },
        lectures:    { total: lectures.total, active: lectures.active },
        enrollments: { total: apps.total },
        reviews:     { total: reviews.total, avg_rating: reviews.avg_rating },
        today_signups: todayUsers[0].count,
        week_signups:  weekUsers[0].count,
        game_stats:    gameStats,
      }
    })
  } catch (err) { next(err) }
}

// GET /api/admin/users
export const getUsers = async (req, res, next) => {
  try {
    const { keyword, role, page = 1 } = req.query
    const limit  = 20
    const offset = (Number(page) - 1) * limit
    const params = []
    let where    = 'WHERE 1=1'

    if (keyword) { where += ' AND (u.nickname LIKE ? OR u.email LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
    if (role)    { where += ' AND u.role = ?'; params.push(role) }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users u ${where}`, params)
    const [rows] = await pool.query(`
      SELECT u.id, u.email, u.nickname, u.role, u.game, u.tier, u.is_active, u.created_at,
             COUNT(DISTINCT a.id) AS enroll_count,
             COUNT(DISTINCT l.id) AS lecture_count
      FROM users u
      LEFT JOIN applications a ON a.student_id = u.id AND a.status='approved'
      LEFT JOIN lectures l ON l.coach_id = u.id
      ${where}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset])

    res.json({ success: true, data: rows, total, page: Number(page), totalPages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
}

// GET /api/admin/users/:id
export const getUserDetail = async (req, res, next) => {
  try {
    const [[user]] = await pool.query(
      'SELECT id, email, nickname, role, game, tier, is_active, created_at FROM users WHERE id = ?',
      [req.params.id]
    )
    if (!user) return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' })

    const [lectures]  = await pool.query('SELECT id, title, game, status FROM lectures WHERE coach_id = ?', [req.params.id])
    const [enrollments] = await pool.query(`
      SELECT a.id, a.status, l.title, l.game FROM applications a
      JOIN lectures l ON a.lecture_id = l.id WHERE a.student_id = ?
    `, [req.params.id])

    res.json({ success: true, data: { ...user, lectures, enrollments } })
  } catch (err) { next(err) }
}

// PUT /api/admin/users/:id/deactivate
export const deactivateUser = async (req, res, next) => {
  try {
    await pool.query('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id])
    res.json({ success: true, message: '회원이 비활성화됐습니다.' })
  } catch (err) { next(err) }
}

// PUT /api/admin/users/:id/activate
export const activateUser = async (req, res, next) => {
  try {
    await pool.query('UPDATE users SET is_active = 1 WHERE id = ?', [req.params.id])
    res.json({ success: true, message: '회원이 활성화됐습니다.' })
  } catch (err) { next(err) }
}

// GET /api/admin/lectures
export const getAdminLectures = async (req, res, next) => {
  try {
    const { keyword, game, status, page = 1 } = req.query
    const limit  = 20
    const offset = (Number(page) - 1) * limit
    const params = []
    let where    = 'WHERE 1=1'

    if (keyword) { where += ' AND (l.title LIKE ? OR u.nickname LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }
    if (game)    { where += ' AND l.game = ?'; params.push(game) }
    if (status)  { where += ' AND l.status = ?'; params.push(status) }

    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM lectures l JOIN users u ON l.coach_id=u.id ${where}`, params)
    const [rows] = await pool.query(`
      SELECT l.*, u.nickname AS coach_nickname,
             COUNT(DISTINCT a.id) AS enroll_count,
             ROUND(COALESCE(AVG(r.rating),0),1) AS avg_rating,
             COUNT(DISTINCT r.id) AS review_count
      FROM lectures l
      JOIN users u ON l.coach_id = u.id
      LEFT JOIN applications a ON a.lecture_id = l.id AND a.status='approved'
      LEFT JOIN reviews r ON r.lecture_id = l.id
      ${where}
      GROUP BY l.id, u.nickname
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset])

    res.json({ success: true, data: rows, total, page: Number(page), totalPages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
}

// PUT /api/admin/lectures/:id/status
export const updateLectureStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['active','inactive'].includes(status))
      return res.status(400).json({ success: false, message: '유효하지 않은 상태입니다.' })
    await pool.query('UPDATE lectures SET status = ? WHERE id = ?', [status, req.params.id])
    res.json({ success: true, message: `강의가 ${status === 'active' ? '활성화' : '비활성화'}됐습니다.` })
  } catch (err) { next(err) }
}

// DELETE /api/admin/lectures/:id
export const deleteAdminLecture = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM lectures WHERE id = ?', [req.params.id])
    res.json({ success: true, message: '강의가 삭제됐습니다.' })
  } catch (err) { next(err) }
}

// GET /api/admin/reviews
export const getAdminReviews = async (req, res, next) => {
  try {
    const { page = 1 } = req.query
    const limit  = 20
    const offset = (Number(page) - 1) * limit

    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM reviews')
    const [rows] = await pool.query(`
      SELECT r.*, u.nickname AS student_nickname, l.title AS lecture_title
      FROM reviews r
      JOIN users u ON r.student_id = u.id
      JOIN lectures l ON r.lecture_id = l.id
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset])

    res.json({ success: true, data: rows, total, page: Number(page), totalPages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
}

// DELETE /api/admin/reviews/:id
export const deleteAdminReview = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id])
    res.json({ success: true, message: '리뷰가 삭제됐습니다.' })
  } catch (err) { next(err) }
}
