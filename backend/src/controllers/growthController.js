import pool from '../db/index.js'
import { sendGrowthReportEmail } from '../utils/emailService.js'
import { notifyGrowthReport }   from '../utils/discordService.js'
import logger from '../utils/logger.js'

export const getMyReports = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT gr.*, l.title AS lecture_title, l.game, u.nickname AS coach_nickname
      FROM growth_reports gr
      JOIN lectures l ON gr.lecture_id = l.id
      JOIN users u    ON gr.coach_id   = u.id
      WHERE gr.student_id = ?
      ORDER BY gr.created_at DESC
    `, [req.user.id])
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

export const getReportById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT gr.*, l.title AS lecture_title, l.game,
             u.nickname AS coach_nickname, s.nickname AS student_nickname
      FROM growth_reports gr
      JOIN lectures l ON gr.lecture_id = l.id
      JOIN users u    ON gr.coach_id   = u.id
      JOIN users s    ON gr.student_id = s.id
      WHERE gr.id = ?
    `, [req.params.id])

    if (!rows.length)
      return res.status(404).json({ success: false, message: '분석 내용을 찾을 수 없습니다.' })

    const report = rows[0]
    if (req.user.id !== report.coach_id && req.user.id !== report.student_id)
      return res.status(403).json({ success: false, message: '열람 권한이 없습니다.' })

    res.json({ success: true, data: report })
  } catch (err) { next(err) }
}

export const getCoachReports = async (req, res, next) => {
  try {
    const { lecture_id } = req.query
    let sql = `
      SELECT gr.*, l.title AS lecture_title, l.game,
             s.nickname AS student_nickname, s.tier AS student_tier
      FROM growth_reports gr
      JOIN lectures l ON gr.lecture_id = l.id
      JOIN users s    ON gr.student_id = s.id
      WHERE gr.coach_id = ?
    `
    const params = [req.user.id]
    if (lecture_id) { sql += ' AND gr.lecture_id = ?'; params.push(lecture_id) }
    sql += ' ORDER BY gr.created_at DESC'

    const [rows] = await pool.query(sql, params)
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

export const createReport = async (req, res, next) => {
  try {
    const { lecture_id, student_id, title, content } = req.body
    const coach_id = req.user.id

    if (!lecture_id || !student_id || !title || !content)
      return res.status(400).json({ success: false, message: '필수 항목이 누락됐습니다.' })

    const [[lecture]] = await pool.query('SELECT coach_id, title AS lecture_title FROM lectures WHERE id = ?', [lecture_id])
    if (!lecture)
      return res.status(404).json({ success: false, message: '강의를 찾을 수 없습니다.' })
    if (lecture.coach_id !== coach_id)
      return res.status(403).json({ success: false, message: '본인 강의의 수강자에게만 작성할 수 있습니다.' })

    const [[app]] = await pool.query(
      "SELECT id FROM applications WHERE lecture_id = ? AND student_id = ? AND status = 'approved'",
      [lecture_id, student_id]
    )
    if (!app)
      return res.status(403).json({ success: false, message: '수강이 승인된 학생에게만 작성할 수 있습니다.' })

    // 기존 있으면 UPDATE, 없으면 INSERT
    const [[existing]] = await pool.query(
      'SELECT id FROM growth_reports WHERE lecture_id = ? AND student_id = ?',
      [lecture_id, student_id]
    )

    let reportId
    if (existing) {
      await pool.query(
        'UPDATE growth_reports SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, content, existing.id]
      )
      reportId = existing.id
    } else {
      const [result] = await pool.query(
        'INSERT INTO growth_reports (lecture_id, student_id, coach_id, title, content) VALUES (?, ?, ?, ?, ?)',
        [lecture_id, student_id, coach_id, title, content]
      )
      reportId = result.insertId
    }

    // 학생에게 이메일 + 디스코드 알림 (비동기)
    Promise.all([
      (async () => {
        const [[student]] = await pool.query('SELECT email, nickname FROM users WHERE id = ?', [student_id])
        const [[coach]]   = await pool.query('SELECT nickname FROM users WHERE id = ?', [coach_id])
        sendGrowthReportEmail({
          to:           student.email,
          nickname:     student.nickname,
          lectureTitle: lecture.lecture_title,
          reportTitle:  title,
        }).catch(err => logger.error('[createReport] 이메일 실패', { error: err.message }))
        notifyGrowthReport({
          coachNickname:   coach.nickname,
          studentNickname: student.nickname,
          lectureTitle:    lecture.lecture_title,
          reportTitle:     title,
        }).catch(() => {})
      })(),
    ]).catch(() => {})

    res.status(201).json({ success: true, data: { id: reportId } })
  } catch (err) { next(err) }
}

export const updateReport = async (req, res, next) => {
  try {
    const [[row]] = await pool.query('SELECT coach_id FROM growth_reports WHERE id = ?', [req.params.id])
    if (!row) return res.status(404).json({ success: false, message: '분석 내용을 찾을 수 없습니다.' })
    if (row.coach_id !== req.user.id) return res.status(403).json({ success: false, message: '본인이 작성한 분석만 수정할 수 있습니다.' })

    const { title, content } = req.body
    await pool.query('UPDATE growth_reports SET title = ?, content = ? WHERE id = ?', [title, content, req.params.id])
    res.json({ success: true })
  } catch (err) { next(err) }
}

export const deleteReport = async (req, res, next) => {
  try {
    const [[row]] = await pool.query('SELECT coach_id FROM growth_reports WHERE id = ?', [req.params.id])
    if (!row) return res.status(404).json({ success: false, message: '분석 내용을 찾을 수 없습니다.' })
    if (row.coach_id !== req.user.id) return res.status(403).json({ success: false, message: '본인이 작성한 분석만 삭제할 수 있습니다.' })

    await pool.query('DELETE FROM growth_reports WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) { next(err) }
}
