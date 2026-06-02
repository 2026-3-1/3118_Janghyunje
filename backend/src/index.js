import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './swagger.js'
import router from './routes/index.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import pool from './db/index.js'
import logger, { requestLogger } from './utils/logger.js'
import { startSchedulers } from './utils/scheduler.js'
import { notifyServerStart } from './utils/discordService.js'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3000

// ── CORS 먼저 ─────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── 보안 미들웨어 ─────────────────────────────────────────────────
try {
  const helmet = (await import('helmet')).default
  app.use(helmet({ contentSecurityPolicy: false }))
  logger.info('[Security] helmet 적용 완료')
} catch (e) {
  logger.warn('[Security] helmet 로드 실패 — npm install 필요')
}

try {
  const { rateLimit } = await import('express-rate-limit')
  app.use('/api/login', rateLimit({
    windowMs: 15 * 60 * 1000, max: 20,
    message: { success: false, message: '너무 많은 요청입니다. 15분 후 다시 시도해주세요.' },
    standardHeaders: true, legacyHeaders: false,
  }))
  app.use('/api', rateLimit({
    windowMs: 60 * 1000, max: 300,
    message: { success: false, message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
  }))
  logger.info('[Security] rate-limit 적용 완료')
} catch (e) {
  logger.warn('[Security] rate-limit 로드 실패 — npm install 필요')
}

// ── 구조화 로그 미들웨어 ──────────────────────────────────────────
app.use(requestLogger)

// ── Swagger ───────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// ── 헬스체크 ──────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  uptime: Math.floor(process.uptime()),
  timestamp: new Date().toISOString(),
  env: process.env.NODE_ENV || 'development',
}))

// ── API 라우터 ────────────────────────────────────────────────────
app.use('/api', router)

// ── 에러 핸들러 ───────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ── DB 연결 후 서버 시작 ──────────────────────────────────────────
pool.getConnection()
  .then(conn => {
    conn.release()
    logger.info('✅ MySQL 연결 성공')
    app.listen(PORT, async () => {
      logger.info(`🚀 서버 실행 중 → http://localhost:${PORT}`)
      // 스케줄러 시작
      startSchedulers()
      // 디스코드 서버 시작 알림
      await notifyServerStart(PORT)
    })
  })
  .catch(err => {
    logger.error('❌ MySQL 연결 실패', { error: err.message })
    process.exit(1)
  })
