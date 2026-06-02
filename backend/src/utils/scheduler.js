import cron from 'node-cron'
import pool from '../db/index.js'
import logger from './logger.js'
import { notifyServerStart } from './discordService.js'

export const startSchedulers = () => {

  // 1. 매일 자정 — 30일 이상 된 장바구니 항목 정리
  cron.schedule('0 0 * * *', async () => {
    try {
      const [result] = await pool.query(
        'DELETE FROM cart_items WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)'
      )
      logger.info(`[Scheduler] 만료 장바구니 정리 완료 — ${result.affectedRows}건 삭제`)
    } catch (err) {
      logger.error('[Scheduler] 장바구니 정리 실패', { error: err.message })
    }
  }, { timezone: 'Asia/Seoul' })

  // 2. 매일 새벽 3시 — 수강생 없는 오래된 강의 비활성화
  cron.schedule('0 3 * * *', async () => {
    try {
      const [result] = await pool.query(`
        UPDATE lectures SET status = 'inactive'
        WHERE status = 'active'
          AND created_at < DATE_SUB(NOW(), INTERVAL 365 DAY)
          AND id NOT IN (
            SELECT DISTINCT lecture_id FROM applications WHERE status = 'approved'
          )
      `)
      if (result.affectedRows > 0)
        logger.info(`[Scheduler] 오래된 빈 강의 비활성화 — ${result.affectedRows}건`)
    } catch (err) {
      logger.error('[Scheduler] 강의 정리 실패', { error: err.message })
    }
  }, { timezone: 'Asia/Seoul' })

  // 3. 매주 월요일 오전 9시 — 주간 통계 로그 + 디스코드 알림
  cron.schedule('0 9 * * 1', async () => {
    try {
      const [[stats]] = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM users    WHERE created_at  >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS new_users,
          (SELECT COUNT(*) FROM lectures WHERE created_at  >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS new_lectures,
          (SELECT COUNT(*) FROM applications WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND status='approved') AS new_enrollments,
          (SELECT COUNT(*) FROM reviews  WHERE created_at  >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS new_reviews,
          (SELECT COUNT(*) FROM users    WHERE is_active = 1) AS total_users,
          (SELECT COUNT(*) FROM lectures WHERE status = 'active') AS total_lectures
      `)
      logger.info('[Scheduler] 주간 통계', {
        신규가입:  stats.new_users,
        신규강의:  stats.new_lectures,
        신규수강:  stats.new_enrollments,
        신규리뷰:  stats.new_reviews,
        전체회원:  stats.total_users,
        활성강의:  stats.total_lectures,
      })

      // 디스코드로 주간 통계 발송
      const { send } = await import('./discordService.js')
      // discordService의 내부 send 대신 직접 fetch
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '📈 GCP 주간 통계',
              color: 0x4F46E5,
              fields: [
                { name: '신규 가입',  value: `${stats.new_users}명`,        inline: true },
                { name: '신규 강의',  value: `${stats.new_lectures}개`,     inline: true },
                { name: '신규 수강',  value: `${stats.new_enrollments}건`,  inline: true },
                { name: '신규 리뷰',  value: `${stats.new_reviews}개`,      inline: true },
                { name: '전체 회원',  value: `${stats.total_users}명`,      inline: true },
                { name: '활성 강의',  value: `${stats.total_lectures}개`,   inline: true },
              ],
              timestamp: new Date().toISOString(),
            }],
          }),
        }).catch(() => {})
      }
    } catch (err) {
      logger.error('[Scheduler] 주간 통계 실패', { error: err.message })
    }
  }, { timezone: 'Asia/Seoul' })

  logger.info('[Scheduler] 스케줄러 시작 완료 (자정:장바구니정리 / 3시:강의정리 / 월9시:주간통계)')
}
