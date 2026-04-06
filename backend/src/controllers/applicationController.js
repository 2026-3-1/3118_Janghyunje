import pool from '../db/index.js'

// POST /api/applications  (P1: student_id body로 받음)
export const applyLecture = async (req, res, next) => {
  try {
    const { lecture_id, student_id } = req.body
    if (!lecture_id || !student_id)
      return res.status(400).json({ success: false, message: '필수 항목이 누락됐습니다.' })

    // 버그 수정: 코치가 본인 강의를 신청하는 것 차단
    const [lectures] = await pool.query('SELECT coach_id FROM lectures WHERE id = ?', [lecture_id])
    if (!lectures.length)
      return res.status(404).json({ success: false, message: '강의를 찾을 수 없습니다.' })
    if (lectures[0].coach_id === student_id)
      return res.status(403).json({ success: false, message: '본인이 등록한 강의는 신청할 수 없습니다.' })

    const [result] = await pool.query(
      'INSERT INTO applications (lecture_id, student_id) VALUES (?, ?)',
      [lecture_id, student_id]
    )
    res.status(201).json({ success: true, data: { id: result.insertId } })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ success: false, message: '이미 신청한 강의입니다.' })
    next(err)
  }
}

// GET /api/applications/student?student_id=1  (P2에서 req.user.id로 교체)
export const getStudentApplications = async (req, res, next) => {
  try {
    const { student_id } = req.query
    const [rows] = await pool.query(`
      SELECT a.*, l.title, l.game, l.price, l.original_price, l.target_tier,
             u.nickname AS coach_nickname, u.tier AS coach_tier
      FROM applications a
      JOIN lectures l ON a.lecture_id = l.id
      JOIN users u ON l.coach_id = u.id
      WHERE a.student_id = ?
      ORDER BY a.created_at DESC
    `, [student_id])
    res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
}

// GET /api/applications/coach?coach_id=1  (P2에서 req.user.id로 교체)
export const getCoachApplications = async (req, res, next) => {
  try {
    const { coach_id } = req.query
    const [rows] = await pool.query(`
      SELECT a.*, l.title, u.nickname AS student_nickname, u.tier AS student_tier
      FROM applications a
      JOIN lectures l ON a.lecture_id = l.id
      JOIN users u ON a.student_id = u.id
      WHERE l.coach_id = ?
      ORDER BY a.created_at DESC
    `, [coach_id])
    res.json({ success: true, data: rows })
  } catch (err) {
    next(err)
  }
}

// PUT /api/applications/:id/approve
export const approveApplication = async (req, res, next) => {
  try {
    await pool.query("UPDATE applications SET status='approved' WHERE id=?", [req.params.id])
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

// PUT /api/applications/:id/reject
export const rejectApplication = async (req, res, next) => {
  try {
    await pool.query("UPDATE applications SET status='rejected' WHERE id=?", [req.params.id])
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
