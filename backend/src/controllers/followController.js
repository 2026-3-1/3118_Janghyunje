import pool from '../db/index.js'
import logger from '../utils/logger.js'

// GET /api/coaches/:coachId/follow — 팔로우 여부 확인
export const getFollowStatus = async (req, res, next) => {
  try {
    const student_id = req.user.id
    const coach_id   = req.params.coachId

    const [[row]] = await pool.query(
      'SELECT id FROM coach_follows WHERE student_id = ? AND coach_id = ?',
      [student_id, coach_id]
    )
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM coach_follows WHERE coach_id = ?',
      [coach_id]
    )

    res.json({ success: true, data: { is_following: !!row, follower_count: count } })
  } catch (err) { next(err) }
}

// POST /api/coaches/:coachId/follow — 팔로우
export const followCoach = async (req, res, next) => {
  try {
    const student_id = req.user.id
    const coach_id   = Number(req.params.coachId)

    if (student_id === coach_id)
      return res.status(400).json({ success: false, message: '본인을 팔로우할 수 없습니다.' })

    const [[coach]] = await pool.query(
      "SELECT id, nickname, role FROM users WHERE id = ? AND role = 'coach'",
      [coach_id]
    )
    if (!coach)
      return res.status(404).json({ success: false, message: '코치를 찾을 수 없습니다.' })

    await pool.query(
      'INSERT IGNORE INTO coach_follows (student_id, coach_id) VALUES (?, ?)',
      [student_id, coach_id]
    )

    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM coach_follows WHERE coach_id = ?',
      [coach_id]
    )

    res.json({ success: true, data: { is_following: true, follower_count: count } })
  } catch (err) { next(err) }
}

// DELETE /api/coaches/:coachId/follow — 언팔로우
export const unfollowCoach = async (req, res, next) => {
  try {
    const student_id = req.user.id
    const coach_id   = req.params.coachId

    await pool.query(
      'DELETE FROM coach_follows WHERE student_id = ? AND coach_id = ?',
      [student_id, coach_id]
    )

    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM coach_follows WHERE coach_id = ?',
      [coach_id]
    )

    res.json({ success: true, data: { is_following: false, follower_count: count } })
  } catch (err) { next(err) }
}

// GET /api/coaches/:coachId/followers — 팔로워 목록 (코치용)
export const getFollowers = async (req, res, next) => {
  try {
    const coach_id = req.params.coachId

    const [rows] = await pool.query(`
      SELECT u.id, u.nickname, u.game, u.tier, f.created_at AS followed_at
      FROM coach_follows f
      JOIN users u ON f.student_id = u.id
      WHERE f.coach_id = ?
      ORDER BY f.created_at DESC
    `, [coach_id])

    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

// GET /api/follows/coaches — 내가 팔로우한 코치 목록 (학생용)
export const getFollowingCoaches = async (req, res, next) => {
  try {
    const student_id = req.user.id

    const [rows] = await pool.query(`
      SELECT u.id, u.nickname, u.game, u.tier,
             f.created_at AS followed_at,
             COUNT(DISTINCT l.id) AS lecture_count,
             ROUND(COALESCE(AVG(r.rating), 0), 1) AS avg_rating
      FROM coach_follows f
      JOIN users u ON f.coach_id = u.id
      LEFT JOIN lectures l ON l.coach_id = u.id AND l.status = 'active'
      LEFT JOIN reviews r ON r.lecture_id = l.id
      WHERE f.student_id = ?
      GROUP BY u.id, u.nickname, u.game, u.tier, f.created_at
      ORDER BY f.created_at DESC
    `, [student_id])

    res.json({ success: true, data: rows })
  } catch (err) { next(err) }
}

// 강의 등록 시 팔로워들에게 알림 발송 (lectureController에서 호출)
export const notifyFollowersNewLecture = async (coachId, lectureId, lectureTitle, price, coachNickname) => {
  try {
    const [followers] = await pool.query(`
      SELECT u.id, u.email, u.nickname
      FROM coach_follows f
      JOIN users u ON f.student_id = u.id
      WHERE f.coach_id = ?
    `, [coachId])

    if (followers.length === 0) return

    const { sendNewLectureEmail } = await import('../utils/emailService.js')
    const { notifyNewLecture }    = await import('../utils/discordService.js')

    // 이메일: 각 팔로워에게 개별 발송
    for (const follower of followers) {
      sendNewLectureEmail({
        to:            follower.email,
        nickname:      follower.nickname,
        coachNickname,
        lectureTitle,
        lectureId,
        price,
      }).catch(err => logger.error('[Follow] 이메일 발송 실패', { error: err.message }))
    }

    // 디스코드: 한 번만 발송
    notifyNewLecture({
      title:         lectureTitle,
      game:          '',
      price,
      coachNickname,
      coachId,
      followerCount: followers.length,
    }).catch(() => {})

    logger.info(`[Follow] 신규 강의 알림 발송 — 팔로워 ${followers.length}명`)
  } catch (err) {
    logger.error('[Follow] 팔로워 알림 실패', { error: err.message })
  }
}
