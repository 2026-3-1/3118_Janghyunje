import pool from '../db/index.js'
import logger from '../utils/logger.js'
import {
  notifyQnAReplyDiscord,
  notifyGrowthReportDiscord,
  notifyNewLectureDiscord,
} from '../utils/discordService.js'

// GET /api/notify/qna/:postId — Q&A 답변 시 질문자 알림 정보 조회 + 디스코드 발송
export const getQnANotifyInfo = async (req, res, next) => {
  try {
    const [[post]] = await pool.query(`
      SELECT p.user_id, p.title AS question_title, p.lecture_id,
             l.title AS lecture_title,
             u.nickname, u.notification_email, u.discord_webhook_url,
             coach.nickname AS coach_nickname
      FROM qna_posts p
      JOIN lectures l   ON p.lecture_id = l.id
      JOIN users u      ON p.user_id    = u.id
      JOIN users coach  ON l.coach_id   = coach.id
      WHERE p.id = ?
    `, [req.params.postId])

    if (!post) return res.status(404).json({ success: false })

    // 디스코드 개인 알림 (Webhook URL 있으면 발송)
    if (post.discord_webhook_url) {
      notifyQnAReplyDiscord({
        webhookUrl:    post.discord_webhook_url,
        questionTitle: post.question_title,
        lectureTitle:  post.lecture_title,
        coachNickname: post.coach_nickname,
      }).catch(err => logger.error('[Notify] 디스코드 Q&A 알림 실패', { error: err.message }))
    }

    res.json({
      success: true,
      data: {
        toEmail:       post.notification_email,
        nickname:      post.nickname,
        lectureTitle:  post.lecture_title,
        questionTitle: post.question_title,
        lectureId:     post.lecture_id,
        postId:        req.params.postId,
      }
    })
  } catch (err) { next(err) }
}

// GET /api/notify/growth/:reportId — 성장분석 알림 + 디스코드 발송
export const getGrowthNotifyInfo = async (req, res, next) => {
  try {
    const [[report]] = await pool.query(`
      SELECT gr.student_id, gr.title AS report_title,
             l.title AS lecture_title,
             u.nickname, u.notification_email, u.discord_webhook_url,
             coach.nickname AS coach_nickname
      FROM growth_reports gr
      JOIN lectures l   ON gr.lecture_id = l.id
      JOIN users u      ON gr.student_id = u.id
      JOIN users coach  ON gr.coach_id   = coach.id
      WHERE gr.id = ?
    `, [req.params.reportId])

    if (!report) return res.status(404).json({ success: false })

    // 디스코드 개인 알림
    if (report.discord_webhook_url) {
      notifyGrowthReportDiscord({
        webhookUrl:    report.discord_webhook_url,
        reportTitle:   report.report_title,
        lectureTitle:  report.lecture_title,
        coachNickname: report.coach_nickname,
      }).catch(err => logger.error('[Notify] 디스코드 성장분석 알림 실패', { error: err.message }))
    }

    res.json({
      success: true,
      data: {
        toEmail:      report.notification_email,
        nickname:     report.nickname,
        lectureTitle: report.lecture_title,
        reportTitle:  report.report_title,
      }
    })
  } catch (err) { next(err) }
}

// GET /api/notify/lecture/:lectureId/followers — 신규 강의 팔로워 알림 + 디스코드 발송
export const getLectureFollowerNotifyInfo = async (req, res, next) => {
  try {
    const [[lecture]] = await pool.query(
      'SELECT title, price, coach_id, game FROM lectures WHERE id = ?',
      [req.params.lectureId]
    )
    if (!lecture) return res.status(404).json({ success: false })

    const [[coach]] = await pool.query('SELECT nickname FROM users WHERE id = ?', [lecture.coach_id])

    // notification_email 또는 discord_webhook_url 있는 팔로워
    const [followers] = await pool.query(`
      SELECT u.nickname, u.notification_email, u.discord_webhook_url
      FROM coach_follows f
      JOIN users u ON f.student_id = u.id
      WHERE f.coach_id = ?
        AND (
          (u.notification_email IS NOT NULL AND u.notification_email != '')
          OR
          (u.discord_webhook_url IS NOT NULL AND u.discord_webhook_url != '')
        )
    `, [lecture.coach_id])

    // 디스코드 개인 알림 발송
    for (const follower of followers) {
      if (follower.discord_webhook_url) {
        notifyNewLectureDiscord({
          webhookUrl:    follower.discord_webhook_url,
          lectureTitle:  lecture.title,
          coachNickname: coach.nickname,
          price:         lecture.price,
          game:          lecture.game,
        }).catch(() => {})
      }
    }

    res.json({
      success: true,
      data: {
        lectureTitle:  lecture.title,
        price:         lecture.price,
        coachNickname: coach.nickname,
        followers: followers.filter(f => f.notification_email),
      }
    })
  } catch (err) { next(err) }
}
