import pool from '../db/index.js'

// POST /api/progress — 진도 저장 (영상 이어보기)
export const saveProgress = async (req, res, next) => {
  try {
    const { content_id, lecture_id, watched_sec, duration_sec } = req.body
    const user_id = req.user.id

    if (!content_id || !lecture_id)
      return res.status(400).json({ success: false, message: '필수 항목 누락' })

    // 98% 이상 시청 시 완료 처리
    const completed = duration_sec > 0 && (watched_sec / duration_sec) >= 0.98 ? 1 : 0

    await pool.query(`
      INSERT INTO content_progress (user_id, content_id, lecture_id, watched_sec, duration_sec, completed)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        watched_sec  = GREATEST(watched_sec, VALUES(watched_sec)),
        duration_sec = VALUES(duration_sec),
        completed    = GREATEST(completed, VALUES(completed)),
        updated_at   = CURRENT_TIMESTAMP
    `, [user_id, content_id, lecture_id, watched_sec || 0, duration_sec || 0, completed])

    res.json({ success: true, data: { completed } })
  } catch (err) { next(err) }
}

// GET /api/progress/:lectureId — 강의 전체 진도율 조회 (실제 시청 시간 기반)
export const getLectureProgress = async (req, res, next) => {
  try {
    const user_id    = req.user.id
    const lecture_id = req.params.lectureId

    // 전체 콘텐츠 수 & 완료 수
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM lecture_contents WHERE lecture_id = ?',
      [lecture_id]
    )
    const [[{ done }]] = await pool.query(
      'SELECT COUNT(*) AS done FROM content_progress WHERE user_id = ? AND lecture_id = ? AND completed = 1',
      [user_id, lecture_id]
    )

    // 콘텐츠별 진도
    const [items] = await pool.query(`
      SELECT lc.id AS content_id, lc.title,
             COALESCE(cp.watched_sec, 0)  AS watched_sec,
             COALESCE(cp.duration_sec, 0) AS duration_sec,
             COALESCE(cp.completed, 0)    AS completed
      FROM lecture_contents lc
      LEFT JOIN content_progress cp
        ON cp.content_id = lc.id AND cp.user_id = ?
      WHERE lc.lecture_id = ?
      ORDER BY lc.order_num ASC, lc.id ASC
    `, [user_id, lecture_id])

    // 실제 시청 시간 기반 진도율 계산
    // duration_sec 이 있는 콘텐츠만 계산에 포함
    const totalDuration  = items.reduce((s, i) => s + Number(i.duration_sec), 0)
    const totalWatched   = items.reduce((s, i) => s + Math.min(Number(i.watched_sec), Number(i.duration_sec) || Number(i.watched_sec)), 0)

    // 시간 기반 퍼센트 (duration 정보 없으면 완료 수 기반으로 fallback)
    const timePercent = totalDuration > 0
      ? Math.min(Math.round((totalWatched / totalDuration) * 100), 100)
      : total > 0 ? Math.round((done / total) * 100) : 0

    // 총 시청 시간 포맷 (분:초)
    const formatTime = (sec) => {
      const m = Math.floor(sec / 60)
      const s = Math.floor(sec % 60)
      return m > 0 ? `${m}분 ${s}초` : `${s}초`
    }

    res.json({
      success: true,
      data: {
        total,
        done,
        percent:        timePercent,
        can_review:     timePercent >= 60,
        total_duration: totalDuration,
        total_watched:  totalWatched,
        total_duration_fmt: formatTime(totalDuration),
        total_watched_fmt:  formatTime(totalWatched),
        items,
      }
    })
  } catch (err) { next(err) }
}

// GET /api/progress/:lectureId/content/:contentId — 단일 콘텐츠 진도 조회 (이어보기)
export const getContentProgress = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM content_progress WHERE user_id = ? AND content_id = ?',
      [req.user.id, req.params.contentId]
    )
    res.json({ success: true, data: rows[0] || null })
  } catch (err) { next(err) }
}
