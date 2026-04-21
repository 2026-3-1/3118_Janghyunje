import pool from '../db/index.js'

// GET /api/lectures — 공개 강의 목록 (전체)
export const getLectures = async (req, res, next) => {
  try {
    const { game, tier, maxPrice, keyword, coachType, position, sort } = req.query

    let sql = `
      SELECT
        l.*,
        u.nickname AS coach_nickname,
        u.tier     AS coach_tier,
        COALESCE(AVG(r.rating), 0)  AS rating,
        COUNT(DISTINCT r.id)         AS review_count,
        COUNT(DISTINCT a.id)         AS enroll_count
      FROM lectures l
      JOIN users u ON l.coach_id = u.id
      LEFT JOIN reviews r ON r.lecture_id = l.id
      LEFT JOIN applications a ON a.lecture_id = l.id AND a.status = 'approved'
      WHERE l.status = 'active'
    `
    const params = []

    if (game && game !== 'all') { sql += ' AND l.game = ?';        params.push(game) }
    if (tier && tier !== 'all') { sql += ' AND l.target_tier = ?'; params.push(tier) }
    if (maxPrice)               { sql += ' AND l.price <= ?';      params.push(Number(maxPrice)) }
    if (coachType && coachType !== 'all') { sql += ' AND l.coach_type = ?'; params.push(coachType) }
    if (position  && position  !== 'all') { sql += ' AND l.position = ?';   params.push(position) }
    if (keyword) {
      sql += ' AND (l.title LIKE ? OR u.nickname LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    sql += ' GROUP BY l.id, u.nickname, u.tier'

    const sortMap = {
      rating:     ' ORDER BY rating DESC',
      price_asc:  ' ORDER BY l.price ASC',
      price_desc: ' ORDER BY l.price DESC',
      newest:     ' ORDER BY l.created_at DESC',
      ranking:    ' ORDER BY enroll_count DESC',
    }
    sql += sortMap[sort] || sortMap.ranking

    const [rows] = await pool.query(sql, params)
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

// GET /api/lectures/my — 코치 본인 강의 목록 (JWT에서 coach_id 추출)
export const getMyLectures = async (req, res, next) => {
  try {
    const coach_id = req.user.id
    const [rows] = await pool.query(`
      SELECT
        l.*,
        COALESCE(AVG(r.rating), 0) AS rating,
        COUNT(DISTINCT r.id)        AS review_count,
        COUNT(DISTINCT a.id)        AS enroll_count
      FROM lectures l
      LEFT JOIN reviews r ON r.lecture_id = l.id
      LEFT JOIN applications a ON a.lecture_id = l.id AND a.status = 'approved'
      WHERE l.coach_id = ?
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `, [coach_id])
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

// GET /api/lectures/:id
export const getLectureById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        l.*,
        u.nickname AS coach_nickname,
        u.tier     AS coach_tier,
        COALESCE(AVG(r.rating), 0) AS rating,
        COUNT(DISTINCT r.id)        AS review_count,
        COUNT(DISTINCT a.id)        AS enroll_count
      FROM lectures l
      JOIN users u ON l.coach_id = u.id
      LEFT JOIN reviews r ON r.lecture_id = l.id
      LEFT JOIN applications a ON a.lecture_id = l.id AND a.status = 'approved'
      WHERE l.id = ?
      GROUP BY l.id, u.nickname, u.tier
    `, [req.params.id])

    if (!rows.length) return res.status(404).json({ success: false, message: '강의를 찾을 수 없습니다.' })
    res.json({ success: true, data: rows[0] })
  } catch (err) { next(err) }
}

// POST /api/lectures
export const createLecture = async (req, res, next) => {
  try {
    const { title, description, game, price, original_price, target_tier, position, coach_type } = req.body
    const coach_id = req.user.id

    if (!title || !game || price == null)
      return res.status(400).json({ success: false, message: '필수 항목이 누락됐습니다.' })

    const [result] = await pool.query(
      `INSERT INTO lectures (coach_id, title, description, game, price, original_price, target_tier, position, coach_type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [coach_id, title, description, game, price, original_price || null, target_tier, position, coach_type]
    )
    res.status(201).json({ success: true, data: { id: result.insertId } })
  } catch (err) { next(err) }
}

// PUT /api/lectures/:id
export const updateLecture = async (req, res, next) => {
  try {
    const [lectures] = await pool.query('SELECT coach_id FROM lectures WHERE id = ?', [req.params.id])
    if (!lectures.length)
      return res.status(404).json({ success: false, message: '강의를 찾을 수 없습니다.' })
    if (lectures[0].coach_id !== req.user.id)
      return res.status(403).json({ success: false, message: '본인 강의만 수정할 수 있습니다.' })

    const { title, description, price, original_price, target_tier, position, status } = req.body
    await pool.query(
      `UPDATE lectures SET title=?, description=?, price=?, original_price=?, target_tier=?, position=?, status=? WHERE id=?`,
      [title, description, price, original_price || null, target_tier, position, status || 'active', req.params.id]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
}

// DELETE /api/lectures/:id
export const deleteLecture = async (req, res, next) => {
  try {
    const [lectures] = await pool.query('SELECT coach_id FROM lectures WHERE id = ?', [req.params.id])
    if (!lectures.length)
      return res.status(404).json({ success: false, message: '강의를 찾을 수 없습니다.' })
    if (lectures[0].coach_id !== req.user.id)
      return res.status(403).json({ success: false, message: '본인 강의만 삭제할 수 있습니다.' })

    await pool.query('DELETE FROM lectures WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) { next(err) }
}
