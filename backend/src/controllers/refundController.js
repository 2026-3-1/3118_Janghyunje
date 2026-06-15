import pool from '../db/index.js'
import logger from '../utils/logger.js'

// GET /api/payments — 내 결제 내역 조회
export const getMyPayments = async (req, res, next) => {
  try {
    const student_id = req.user.id
    const [rows] = await pool.query(`
      SELECT
        a.id AS application_id,
        a.lecture_id,
        a.status,
        a.created_at AS paid_at,
        a.refunded_at,
        a.refund_reason,
        l.title AS lecture_title,
        l.game,
        l.price,
        l.original_price,
        u.nickname AS coach_nickname,
        COALESCE(prog.progress_percent, 0) AS progress_percent
      FROM applications a
      JOIN lectures l ON a.lecture_id = l.id
      JOIN users u    ON l.coach_id   = u.id
      LEFT JOIN (
        SELECT user_id, lecture_id,
               CASE
                 WHEN SUM(duration_sec) > 0
                 THEN LEAST(ROUND(SUM(LEAST(watched_sec, duration_sec)) / SUM(duration_sec) * 100), 100)
                 ELSE 0
               END AS progress_percent
        FROM content_progress
        WHERE user_id = ?
        GROUP BY user_id, lecture_id
      ) prog ON prog.lecture_id = a.lecture_id
      WHERE a.student_id = ? AND a.status IN ('approved', 'refunded')
      ORDER BY a.created_at DESC
    `, [student_id, student_id])

    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

// POST /api/payments/:applicationId/refund — 환불 요청
export const requestRefund = async (req, res, next) => {
  try {
    const student_id     = req.user.id
    const application_id = req.params.applicationId
    const { reason }     = req.body

    // 신청 정보 조회
    const [[app]] = await pool.query(`
      SELECT a.*, l.title AS lecture_title
      FROM applications a
      JOIN lectures l ON a.lecture_id = l.id
      WHERE a.id = ? AND a.student_id = ?
    `, [application_id, student_id])

    if (!app)
      return res.status(404).json({ success: false, message: '결제 내역을 찾을 수 없습니다.' })

    if (app.status === 'refunded')
      return res.status(409).json({ success: false, message: '이미 환불된 결제입니다.' })

    if (app.status !== 'approved')
      return res.status(400).json({ success: false, message: '환불 가능한 결제가 아닙니다.' })

    // 진도율 확인 — 30% 이상 시청하면 환불 불가
    const [[prog]] = await pool.query(`
      SELECT
        CASE
          WHEN SUM(duration_sec) > 0
          THEN LEAST(ROUND(SUM(LEAST(watched_sec, duration_sec)) / SUM(duration_sec) * 100), 100)
          ELSE 0
        END AS progress_percent
      FROM content_progress
      WHERE user_id = ? AND lecture_id = ?
    `, [student_id, app.lecture_id])

    const progress = prog?.progress_percent || 0

    if (progress >= 30) {
      return res.status(403).json({
        success: false,
        message: `수강 진도율이 ${progress}%로 30% 이상이므로 환불이 불가합니다.`,
        progress,
      })
    }

    // 환불 처리
    await pool.query(`
      UPDATE applications
      SET status = 'refunded', refunded_at = NOW(), refund_reason = ?
      WHERE id = ?
    `, [reason || '고객 요청 환불', application_id])

    logger.info(`[Refund] 환불 완료 — applicationId:${application_id}, studentId:${student_id}, progress:${progress}%`)

    res.json({
      success: true,
      message: '환불이 완료됐습니다.',
      data: { progress, refunded_at: new Date() }
    })
  } catch (err) { next(err) }
}

// GET /api/admin/refunds — 관리자 환불 내역 전체 조회
export const getAdminRefunds = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        a.id AS application_id,
        a.lecture_id,
        a.status,
        a.created_at AS paid_at,
        a.refunded_at,
        a.refund_reason,
        l.title AS lecture_title,
        l.price,
        u_s.nickname AS student_nickname,
        u_s.email    AS student_email,
        u_c.nickname AS coach_nickname
      FROM applications a
      JOIN lectures l ON a.lecture_id = l.id
      JOIN users u_s  ON a.student_id = u_s.id
      JOIN users u_c  ON l.coach_id   = u_c.id
      WHERE a.status = 'refunded'
      ORDER BY a.refunded_at DESC
    `)
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}
