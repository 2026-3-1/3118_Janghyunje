import pool from '../db/index.js'

// GET /api/cart — 내 장바구니 목록
export const getCart = async (req, res, next) => {
  try {
    const user_id = req.user.id
    const [rows] = await pool.query(`
      SELECT
        ci.id AS cart_item_id,
        l.id, l.title, l.game, l.price, l.original_price,
        l.target_tier, l.coach_type, l.status,
        u.nickname AS coach_nickname, u.tier AS coach_tier,
        COALESCE(AVG(r.rating), 0) AS rating,
        COUNT(DISTINCT r.id)        AS review_count,
        ci.created_at AS added_at
      FROM cart_items ci
      JOIN lectures l ON ci.lecture_id = l.id
      JOIN users u    ON l.coach_id = u.id
      LEFT JOIN reviews r ON r.lecture_id = l.id
      WHERE ci.user_id = ?
      GROUP BY ci.id, l.id, u.nickname, u.tier
      ORDER BY ci.created_at DESC
    `, [user_id])
    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

// POST /api/cart — 장바구니 추가
export const addToCart = async (req, res, next) => {
  try {
    const { lecture_id } = req.body
    const user_id = req.user.id

    if (!lecture_id)
      return res.status(400).json({ success: false, message: '강의 ID가 필요합니다.' })

    // 본인 강의 담기 방지
    const [lectures] = await pool.query('SELECT coach_id FROM lectures WHERE id = ?', [lecture_id])
    if (!lectures.length)
      return res.status(404).json({ success: false, message: '강의를 찾을 수 없습니다.' })
    if (lectures[0].coach_id === user_id)
      return res.status(403).json({ success: false, message: '본인 강의는 장바구니에 담을 수 없습니다.' })

    // 이미 수강 신청한 강의 담기 방지
    const [apps] = await pool.query(
      "SELECT id FROM applications WHERE lecture_id = ? AND student_id = ? AND status != 'rejected'",
      [lecture_id, user_id]
    )
    if (apps.length)
      return res.status(409).json({ success: false, message: '이미 수강 신청한 강의입니다.' })

    await pool.query(
      'INSERT INTO cart_items (user_id, lecture_id) VALUES (?, ?)',
      [user_id, lecture_id]
    )
    res.status(201).json({ success: true, message: '장바구니에 추가했습니다.' })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ success: false, message: '이미 장바구니에 담긴 강의입니다.' })
    next(err)
  }
}

// DELETE /api/cart/:lectureId — 장바구니 삭제
export const removeFromCart = async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM cart_items WHERE user_id = ? AND lecture_id = ?',
      [req.user.id, req.params.lectureId]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
}

// DELETE /api/cart — 장바구니 전체 비우기
export const clearCart = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id])
    res.json({ success: true })
  } catch (err) { next(err) }
}
