import pool from '../db/index.js'
import { sendEnrollmentEmail } from '../utils/emailService.js'
import { notifyEnrollment } from '../utils/discordService.js'
import logger from '../utils/logger.js'

// POST /api/applications — 결제 완료 후 자동 승인
export const applyLecture = async (req, res, next) => {
  try {
    const { lecture_id, receipt_email } = req.body
    const student_id = req.user.id

    if (!lecture_id)
      return res.status(400).json({ success: false, message: '강의 ID가 누락됐습니다.' })

    const [[lecture]] = await pool.query(
      'SELECT coach_id, title, price FROM lectures WHERE id = ?',
      [lecture_id]
    )
    if (!lecture)
      return res.status(404).json({ success: false, message: '강의를 찾을 수 없습니다.' })
    if (lecture.coach_id === student_id)
      return res.status(403).json({ success: false, message: '본인이 등록한 강의는 신청할 수 없습니다.' })

    // 현재 수강 중인지만 체크 (approved 상태)
    const [[existing]] = await pool.query(
      "SELECT id FROM applications WHERE lecture_id = ? AND student_id = ? AND status = 'approved'",
      [lecture_id, student_id]
    )
    if (existing)
      return res.status(409).json({ success: false, message: '이미 수강 중인 강의입니다.' })

    // 새 row INSERT (환불 이력은 그대로 보존)
    const [result] = await pool.query(
      "INSERT INTO applications (lecture_id, student_id, status) VALUES (?, ?, 'approved')",
      [lecture_id, student_id]
    )
    const insertId = result.insertId

    // 학생 정보 조회
    const [[student]] = await pool.query(
      'SELECT email, nickname FROM users WHERE id = ?',
      [student_id]
    )

    const targetEmail = (receipt_email && receipt_email.trim()) ? receipt_email.trim() : student.email

    Promise.all([
      sendEnrollmentEmail({
        to:           targetEmail,
        nickname:     student.nickname,
        lectureTitle: lecture.title,
        price:        lecture.price,
      }),
      notifyEnrollment({
        studentNickname: student.nickname,
        lectureTitle:    lecture.title,
        price:           lecture.price,
      }),
    ]).catch(err => logger.error('[applyLecture] 알림 발송 실패', { error: err.message }))

    res.status(201).json({ success: true, data: { id: insertId } })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ success: false, message: '이미 수강 중인 강의입니다.' })
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

// GET /api/applications/lecture/:lectureId
export const getLectureStudents = async (req, res, next) => {
  try {
    const coach_id   = req.user.id
    const lecture_id = req.params.lectureId

    const [[lecture]] = await pool.query('SELECT coach_id FROM lectures WHERE id = ?', [lecture_id])
    if (!lecture)
      return res.status(404).json({ success: false, message: '강의를 찾을 수 없습니다.' })
    if (lecture.coach_id !== coach_id)
      return res.status(403).json({ success: false, message: '본인 강의의 수강자만 조회할 수 있습니다.' })

    const [rows] = await pool.query(`
      SELECT
        a.id AS application_id, a.status, a.created_at AS applied_at,
        u.id AS student_id, u.nickname AS student_nickname,
        u.tier AS student_tier, u.game AS student_game, u.email AS student_email,
        COALESCE(prog.completed_count, 0) AS completed_count,
        COALESCE(prog.total_count, 0)     AS total_count,
        COALESCE(prog.progress_percent, 0) AS progress_percent,
        CASE WHEN r.id IS NOT NULL THEN 1 ELSE 0 END AS has_review,
        COALESCE(r.rating, 0)   AS review_rating,
        CASE WHEN gr.id IS NOT NULL THEN 1 ELSE 0 END AS has_growth_report,
        gr.id AS growth_report_id
      FROM (
        SELECT MIN(id) AS id, student_id, lecture_id, status, created_at
        FROM applications
        WHERE lecture_id = ? AND status = 'approved'
        GROUP BY student_id
      ) a
      JOIN users u ON a.student_id = u.id
      LEFT JOIN (
        SELECT user_id,
               COUNT(*) AS total_count,
               SUM(completed) AS completed_count,
               CASE
                 WHEN SUM(duration_sec) > 0
                 THEN LEAST(ROUND(SUM(LEAST(watched_sec, duration_sec)) / SUM(duration_sec) * 100), 100)
                 ELSE ROUND(SUM(completed) / NULLIF(COUNT(*), 0) * 100)
               END AS progress_percent
        FROM content_progress
        WHERE lecture_id = ?
        GROUP BY user_id
      ) prog ON prog.user_id = u.id
      LEFT JOIN reviews r         ON r.lecture_id  = ? AND r.student_id  = u.id
      LEFT JOIN growth_reports gr ON gr.lecture_id = ? AND gr.student_id = u.id
      ORDER BY a.created_at ASC
    `, [lecture_id, lecture_id, lecture_id, lecture_id])

    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}
