import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './swagger.js'
import router from './routes/index.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import pool from './db/index.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Swagger UI → http://localhost:3000/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// 헬스체크
app.get('/health', (req, res) => res.json({ status: 'ok' }))

// API 라우터
app.use('/api', router)

// 404 + 에러 핸들러
app.use(notFound)
app.use(errorHandler)

// DB 연결 확인 후 서버 시작
pool.getConnection()
  .then(conn => {
    conn.release()
    console.log('✅ MySQL 연결 성공')
    app.listen(PORT, () => console.log(`🚀 서버 실행 중 → http://localhost:${PORT}`))
  })
  .catch(err => {
    console.error('❌ MySQL 연결 실패:', err.message)
    process.exit(1)
  })
