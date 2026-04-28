import pool from '../db/index.js'

// GET /api/growth/reports — 수강자: 나의 성장 분석 목록 조회
export const getMyReports = async (req, res, next) => {
  try {
    const student_id = req.user.id
    const [rows] = await pool.query(`
      SELECT gr.*, l.title AS lecture_title, l.game, u.nickname AS coach_nickname
      FROM growth_reports gr
      JOIN lectures l ON gr.lecture_id = l.id
      JOIN users u    ON gr.coach_id   = u.id
      WHERE gr.student_id = ?
      ORDER BY gr.created_at DESC
    `, [student_id])
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

// GET /api/growth/reports/:id — 단건 조회 (코치 또는 해당 수강자만)
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

// GET /api/growth/coach/reports — 코치: 내가 작성한 목록
export const getCoachReports = async (req, res, next) => {
  try {
    const coach_id = req.user.id
    const { lecture_id } = req.query

    let sql = `
      SELECT gr.*, l.title AS lecture_title, l.game,
             s.nickname AS student_nickname, s.tier AS student_tier
      FROM growth_reports gr
      JOIN lectures l ON gr.lecture_id = l.id
      JOIN users s    ON gr.student_id = s.id
      WHERE gr.coach_id = ?
    `
    const params = [coach_id]
    if (lecture_id) { sql += ' AND gr.lecture_id = ?'; params.push(lecture_id) }
    sql += ' ORDER BY gr.created_at DESC'

    const [rows] = await pool.query(sql, params)
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

// POST /api/growth/reports — 코치: 성장 분석 작성 (같은 학생에게 재작성 시 UPDATE)
export const createReport = async (req, res, next) => {
  try {
    const { lecture_id, student_id, title, content } = req.body
    const coach_id = req.user.id

    if (!lecture_id || !student_id || !title || !content)
      return res.status(400).json({ success: false, message: '필수 항목이 누락됐습니다.' })

    // 본인 강의인지 확인
    const [lectures] = await pool.query('SELECT coach_id FROM lectures WHERE id = ?', [lecture_id])
    if (!lectures.length)
      return res.status(404).json({ success: false, message: '강의를 찾을 수 없습니다.' })
    if (lectures[0].coach_id !== coach_id)
      return res.status(403).json({ success: false, message: '본인 강의의 수강자에게만 작성할 수 있습니다.' })

    // 수강 승인 여부 확인
    const [apps] = await pool.query(
      "SELECT id FROM applications WHERE lecture_id = ? AND student_id = ? AND status = 'approved'",
      [lecture_id, student_id]
    )
    if (!apps.length)
      return res.status(403).json({ success: false, message: '수강이 승인된 학생에게만 작성할 수 있습니다.' })

    // 이미 존재하면 UPDATE, 없으면 INSERT (중복 방지)
    const [existing] = await pool.query(
      'SELECT id FROM growth_reports WHERE lecture_id = ? AND student_id = ?',
      [lecture_id, student_id]
    )

    if (existing.length) {
      await pool.query(
        'UPDATE growth_reports SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, content, existing[0].id]
      )
      res.json({ success: true, data: { id: existing[0].id } })
    } else {
      const [result] = await pool.query(
        'INSERT INTO growth_reports (lecture_id, student_id, coach_id, title, content) VALUES (?, ?, ?, ?, ?)',
        [lecture_id, student_id, coach_id, title, content]
      )
      res.status(201).json({ success: true, data: { id: result.insertId } })
    }
  } catch (err) { next(err) }
}

// PUT /api/growth/reports/:id — 코치: 수정
export const updateReport = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT coach_id FROM growth_reports WHERE id = ?', [req.params.id])
    if (!rows.length)
      return res.status(404).json({ success: false, message: '분석 내용을 찾을 수 없습니다.' })
    if (rows[0].coach_id !== req.user.id)
      return res.status(403).json({ success: false, message: '본인이 작성한 분석만 수정할 수 있습니다.' })

    const { title, content } = req.body
    await pool.query(
      'UPDATE growth_reports SET title = ?, content = ? WHERE id = ?',
      [title, content, req.params.id]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
}

// DELETE /api/growth/reports/:id — 코치: 삭제
export const deleteReport = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT coach_id FROM growth_reports WHERE id = ?', [req.params.id])
    if (!rows.length)
      return res.status(404).json({ success: false, message: '분석 내용을 찾을 수 없습니다.' })
    if (rows[0].coach_id !== req.user.id)
      return res.status(403).json({ success: false, message: '본인이 작성한 분석만 삭제할 수 있습니다.' })

    await pool.query('DELETE FROM growth_reports WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) { next(err) }
}
