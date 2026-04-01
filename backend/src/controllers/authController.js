import pool from '../db/index.js'
import bcrypt from 'bcrypt'
// import jwt from 'jsonwebtoken'  // P2에서 주석 해제

// POST /api/signup
export const signup = async (req, res, next) => {
  try {
    const { email, password, nickname, role, game, tier } = req.body
    if (!email || !password || !nickname)
      return res.status(400).json({ success: false, message: '필수 항목이 누락됐습니다.' })

    // 이메일 중복 체크
    const [emailExist] = await pool.query('SELECT id FROM users WHERE email = ?', [email])
    if (emailExist.length)
      return res.status(409).json({ success: false, code: 'EMAIL_DUPLICATE', message: '이미 회원가입이 되어있는 이메일입니다.' })

    // 닉네임 중복 체크
    const [nicknameExist] = await pool.query('SELECT id FROM users WHERE nickname = ?', [nickname])
    if (nicknameExist.length)
      return res.status(409).json({ success: false, code: 'NICKNAME_DUPLICATE', message: '이미 존재하는 아이디입니다.' })

    const hashed = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO users (email, password, nickname, role, game, tier) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashed, nickname, role || 'student', game || null, tier || null]
    )
    res.status(201).json({ success: true, data: { id: result.insertId } })
  } catch (err) {
    next(err)
  }
}

// POST /api/login
// P1: 유저 정보만 반환
// P2: jwt.sign()으로 토큰 발급으로 교체
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ success: false, message: '이메일과 비밀번호를 입력해주세요.' })

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email])
    if (!rows.length)
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' })

    const user = rows[0]
    const match = await bcrypt.compare(password, user.password)
    if (!match)
      return res.status(401).json({ success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' })

    // P1: 유저 정보 반환 (비밀번호 제외)
    const { password: _, ...safeUser } = user
    res.json({ success: true, data: safeUser })

    // P2에서 아래로 교체:
    // const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN })
    // res.json({ success: true, data: { token, user: safeUser } })
  } catch (err) {
    next(err)
  }
}

// GET /api/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, nickname, role, game, tier, created_at FROM users WHERE id = ?',
      [req.params.id]
    )
    if (!rows.length)
      return res.status(404).json({ success: false, message: '유저를 찾을 수 없습니다.' })
    res.json({ success: true, data: rows[0] })
  } catch (err) {
    next(err)
  }
}

// PUT /api/users/:id
export const updateUser = async (req, res, next) => {
  try {
    const { nickname, game, tier, password } = req.body

    if (password) {
      const hashed = await bcrypt.hash(password, 10)
      await pool.query(
        'UPDATE users SET nickname=?, game=?, tier=?, password=? WHERE id=?',
        [nickname, game, tier, hashed, req.params.id]
      )
    } else {
      await pool.query(
        'UPDATE users SET nickname=?, game=?, tier=? WHERE id=?',
        [nickname, game, tier, req.params.id]
      )
    }
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
