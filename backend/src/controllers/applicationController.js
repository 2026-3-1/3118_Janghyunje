import pool from '../db/index.js'

// POST /api/applications
export const applyLecture = async (req, res, next) => {
  try {
    const { lecture_id } = req.body
    const student_id = req.user.id

    if (!lecture_id)
      return res.status(400).json({ success: false, message: '강의 ID가 누락됐습니다.' })

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

// GET /api/applications/student
export const getStudentApplications = async (req, res, next) => {
  try {
    const student_id = req.user.id
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
  } catch (err) { next(err) }
}

// GET /api/applications/coach
export const getCoachApplications = async (req, res, next) => {
  try {
    const coach_id = req.user.id
    const [rows] = await pool.query(`
      SELECT a.*, l.title, l.id AS lecture_id,
             u.nickname AS student_nickname, u.tier AS student_tier, u.id AS student_user_id
      FROM applications a
      JOIN lectures l ON a.lecture_id = l.id
      JOIN users u ON a.student_id = u.id
      WHERE l.coach_id = ?
      ORDER BY a.created_at DESC
    `, [coach_id])
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

// GET /api/applications/lecture/:lectureId — 특정 강의의 승인된 수강자 목록 (코치용)
export const getLectureStudents = async (req, res, next) => {
  try {
    const coach_id   = req.user.id
    const lecture_id = req.params.lectureId

    // 본인 강의인지 확인
    const [lectures] = await pool.query('SELECT coach_id FROM lectures WHERE id = ?', [lecture_id])
    if (!lectures.length)
      return res.status(404).json({ success: false, message: '강의를 찾을 수 없습니다.' })
    if (lectures[0].coach_id !== coach_id)
      return res.status(403).json({ success: false, message: '본인 강의의 수강자만 조회할 수 있습니다.' })

    const [rows] = await pool.query(`
      SELECT
        a.id AS application_id, a.status, a.created_at AS applied_at,
        u.id AS student_id, u.nickname AS student_nickname,
        u.tier AS student_tier, u.game AS student_game, u.email AS student_email,
        -- 진도율
        COALESCE(prog.done, 0)  AS completed_count,
        COALESCE(prog.total, 0) AS total_count,
        COALESCE(ROUND(prog.done / NULLIF(prog.total, 0) * 100), 0) AS progress_percent,
        -- 리뷰 작성 여부
        CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END AS has_review,
        COALESCE(r.rating, 0)   AS review_rating,
        -- 성장 분석 작성 여부
        CASE WHEN gr.id IS NOT NULL THEN 1 ELSE 0 END AS has_growth_report,
        gr.id AS growth_report_id
      FROM applications a
      JOIN users u ON a.student_id = u.id
      LEFT JOIN (
        SELECT lecture_id, user_id,
               SUM(completed) AS done,
               COUNT(*)       AS total
        FROM content_progress
        WHERE lecture_id = ?
        GROUP BY user_id
      ) prog ON prog.user_id = u.id
      LEFT JOIN reviews r ON r.lecture_id = ? AND r.student_id = u.id
      LEFT JOIN growth_reports gr ON gr.lecture_id = ? AND gr.student_id = u.id
      WHERE a.lecture_id = ? AND a.status = 'approved'
      ORDER BY a.created_at ASC
    `, [lecture_id, lecture_id, lecture_id, lecture_id])

    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

// PUT /api/applications/:id/approve
export const approveApplication = async (req, res, next) => {
  try {
    const [apps] = await pool.query(
      'SELECT l.coach_id FROM applications a JOIN lectures l ON a.lecture_id = l.id WHERE a.id = ?',
      [req.params.id]
    )
    if (!apps.length)
      return res.status(404).json({ success: false, message: '신청 내역을 찾을 수 없습니다.' })
    if (apps[0].coach_id !== req.user.id)
      return res.status(403).json({ success: false, message: '본인 강의의 신청만 처리할 수 있습니다.' })

    await pool.query("UPDATE applications SET status='approved' WHERE id=?", [req.params.id])
    res.json({ success: true })
  } catch (err) { next(err) }
}

// PUT /api/applications/:id/reject
export const rejectApplication = async (req, res, next) => {
  try {
    const [apps] = await pool.query(
      'SELECT l.coach_id FROM applications a JOIN lectures l ON a.lecture_id = l.id WHERE a.id = ?',
      [req.params.id]
    )
    if (!apps.length)
      return res.status(404).json({ success: false, message: '신청 내역을 찾을 수 없습니다.' })
    if (apps[0].coach_id !== req.user.id)
      return res.status(403).json({ success: false, message: '본인 강의의 신청만 처리할 수 있습니다.' })

    await pool.query("UPDATE applications SET status='rejected' WHERE id=?", [req.params.id])
    res.json({ success: true })
  } catch (err) { next(err) }
}
