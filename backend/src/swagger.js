import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Game Coaching Platform API',
      version: '1.0.0',
      description: '게임 코칭 플랫폼 API 명세서',
    },
    servers: [
      { url: 'http://localhost:3000', description: '개발 서버' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'P2에서 JWT 토큰 입력 (현재 미사용)',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id:         { type: 'integer', example: 1 },
            email:      { type: 'string',  example: 'user@example.com' },
            nickname:   { type: 'string',  example: 'GankMaster' },
            role:       { type: 'string',  enum: ['student', 'coach'] },
            game:       { type: 'string',  example: 'lol' },
            tier:       { type: 'string',  example: 'grandmaster' },
            created_at: { type: 'string',  format: 'date-time' },
          },
        },
        Lecture: {
          type: 'object',
          properties: {
            id:             { type: 'integer', example: 1 },
            coach_id:       { type: 'integer', example: 2 },
            title:          { type: 'string',  example: '챌린저 정글 로테이션 완벽 정리' },
            description:    { type: 'string' },
            game:           { type: 'string',  example: 'lol' },
            price:          { type: 'integer', example: 25000 },
            original_price: { type: 'integer', example: 30000, nullable: true },
            target_tier:    { type: 'string',  example: 'platinum' },
            position:       { type: 'string',  example: 'jungle' },
            coach_type:     { type: 'string',  example: 'pro' },
            status:         { type: 'string',  enum: ['active', 'inactive'] },
            created_at:     { type: 'string',  format: 'date-time' },
          },
        },
        Application: {
          type: 'object',
          properties: {
            id:         { type: 'integer' },
            lecture_id: { type: 'integer' },
            student_id: { type: 'integer' },
            status:     { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id:         { type: 'integer' },
            lecture_id: { type: 'integer' },
            student_id: { type: 'integer' },
            rating:     { type: 'integer', minimum: 1, maximum: 5 },
            comment:    { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data:    { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string',  example: '오류 메시지' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
}

export default swaggerJsdoc(options)
