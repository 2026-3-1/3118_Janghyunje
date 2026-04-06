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
    tags: [
      { name: '인증', description: '회원가입 / 로그인' },
      { name: '유저', description: '사용자 정보' },
      { name: '강의', description: '강의 CRUD / 검색' },
      { name: '수강신청', description: '신청 / 승인 / 거절' },
      { name: '리뷰', description: '리뷰 작성 / 조회' },
      { name: '콘텐츠', description: '강의 자료 / 댓글' },
      { name: '커뮤니티', description: '게시글 / 댓글' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'P2에서 JWT 토큰 입력 (현재 미사용)' },
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
        Post: {
          type: 'object',
          properties: {
            id:        { type: 'integer' },
            user_id:   { type: 'integer' },
            category:  { type: 'string', enum: ['question', 'tip'] },
            title:     { type: 'string' },
            content:   { type: 'string' },
            view_count:{ type: 'integer' },
            created_at:{ type: 'string', format: 'date-time' },
          },
        },
      },
    },
    paths: {
      // ── 인증 ──────────────────────────────────────────────────────────
      '/api/signup': {
        post: {
          tags: ['인증'], summary: '회원가입',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['email','password','nickname'],
              properties: {
                email:    { type: 'string', example: 'user@example.com' },
                password: { type: 'string', example: 'password123' },
                nickname: { type: 'string', example: 'GankMaster' },
                role:     { type: 'string', enum: ['student','coach'], default: 'student' },
                game:     { type: 'string', example: 'lol' },
                tier:     { type: 'string', example: 'gold' },
              },
            }}},
          },
          responses: { 201: { description: '회원가입 성공' }, 409: { description: '이미 사용 중인 이메일' } },
        },
      },
      '/api/login': {
        post: {
          tags: ['인증'], summary: '로그인',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['email','password'],
              properties: {
                email:    { type: 'string', example: 'user@example.com' },
                password: { type: 'string', example: 'password123' },
              },
            }}},
          },
          responses: { 200: { description: '로그인 성공' }, 401: { description: '이메일 또는 비밀번호 불일치' } },
        },
      },

      // ── 유저 ──────────────────────────────────────────────────────────
      '/api/users/{id}': {
        get: {
          tags: ['유저'], summary: '사용자 정보 조회',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '조회 성공' }, 404: { description: '유저 없음' } },
        },
        put: {
          tags: ['유저'], summary: '사용자 정보 수정',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object',
              properties: {
                nickname: { type: 'string' },
                game:     { type: 'string' },
                tier:     { type: 'string' },
              },
            }}},
          },
          responses: { 200: { description: '수정 성공' } },
        },
      },

      // ── 강의 ──────────────────────────────────────────────────────────
      '/api/lectures': {
        get: {
          tags: ['강의'], summary: '강의 목록 조회 (검색/필터)',
          parameters: [
            { in: 'query', name: 'game',      schema: { type: 'string' } },
            { in: 'query', name: 'tier',      schema: { type: 'string' } },
            { in: 'query', name: 'maxPrice',  schema: { type: 'integer' } },
            { in: 'query', name: 'keyword',   schema: { type: 'string' } },
            { in: 'query', name: 'coachType', schema: { type: 'string' } },
            { in: 'query', name: 'position',  schema: { type: 'string' } },
            { in: 'query', name: 'sort',      schema: { type: 'string', enum: ['ranking','rating','price_asc','price_desc','newest'] } },
          ],
          responses: { 200: { description: '강의 목록' } },
        },
        post: {
          tags: ['강의'], summary: '강의 등록',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['coach_id','title','game','price'],
              properties: {
                coach_id:       { type: 'integer' },
                title:          { type: 'string' },
                description:    { type: 'string' },
                game:           { type: 'string' },
                price:          { type: 'integer' },
                original_price: { type: 'integer' },
                target_tier:    { type: 'string' },
                position:       { type: 'string' },
                coach_type:     { type: 'string' },
              },
            }}},
          },
          responses: { 201: { description: '등록 성공' } },
        },
      },
      '/api/lectures/{id}': {
        get: {
          tags: ['강의'], summary: '강의 상세 조회',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '강의 상세' }, 404: { description: '강의 없음' } },
        },
        put: {
          tags: ['강의'], summary: '강의 수정',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Lecture' } } } },
          responses: { 200: { description: '수정 성공' } },
        },
        delete: {
          tags: ['강의'], summary: '강의 삭제',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '삭제 성공' } },
        },
      },

      // ── 수강신청 ──────────────────────────────────────────────────────
      '/api/applications': {
        post: {
          tags: ['수강신청'], summary: '수강 신청',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['lecture_id','student_id'],
              properties: { lecture_id: { type: 'integer' }, student_id: { type: 'integer' } },
            }}},
          },
          responses: { 201: { description: '신청 완료' }, 409: { description: '이미 신청한 강의' } },
        },
      },
      '/api/applications/student': {
        get: {
          tags: ['수강신청'], summary: '학생 신청 목록',
          parameters: [{ in: 'query', name: 'student_id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '신청 목록' } },
        },
      },
      '/api/applications/coach': {
        get: {
          tags: ['수강신청'], summary: '코치 신청 목록',
          parameters: [{ in: 'query', name: 'coach_id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '신청 목록' } },
        },
      },
      '/api/applications/{id}/approve': {
        put: {
          tags: ['수강신청'], summary: '수강 신청 승인',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '승인 완료' } },
        },
      },
      '/api/applications/{id}/reject': {
        put: {
          tags: ['수강신청'], summary: '수강 신청 거절',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '거절 완료' } },
        },
      },

      // ── 리뷰 ──────────────────────────────────────────────────────────
      '/api/reviews/{lectureId}': {
        get: {
          tags: ['리뷰'], summary: '강의 리뷰 목록',
          parameters: [{ in: 'path', name: 'lectureId', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '리뷰 목록' } },
        },
      },
      '/api/reviews': {
        post: {
          tags: ['리뷰'], summary: '리뷰 작성',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['lecture_id','student_id','rating'],
              properties: {
                lecture_id: { type: 'integer' },
                student_id: { type: 'integer' },
                rating:     { type: 'integer', minimum: 1, maximum: 5 },
                comment:    { type: 'string' },
              },
            }}},
          },
          responses: { 201: { description: '리뷰 작성 완료' }, 409: { description: '이미 리뷰 작성함' } },
        },
      },

      // ── 콘텐츠 ────────────────────────────────────────────────────────
      '/api/lectures/{lectureId}/contents': {
        get: {
          tags: ['콘텐츠'], summary: '강의 콘텐츠 목록',
          parameters: [{ in: 'path', name: 'lectureId', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '콘텐츠 목록' } },
        },
        post: {
          tags: ['콘텐츠'], summary: '강의 콘텐츠 등록',
          parameters: [{ in: 'path', name: 'lectureId', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object',
              properties: { title: { type: 'string' }, content: { type: 'string' }, user_id: { type: 'integer' } },
            }}},
          },
          responses: { 201: { description: '등록 성공' } },
        },
      },
      '/api/contents/{id}': {
        get:    { tags: ['콘텐츠'], summary: '콘텐츠 상세', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: '콘텐츠 상세' } } },
        put:    { tags: ['콘텐츠'], summary: '콘텐츠 수정', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: '수정 성공' } } },
        delete: { tags: ['콘텐츠'], summary: '콘텐츠 삭제', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: '삭제 성공' } } },
      },
      '/api/contents/{id}/comments': {
        get:  { tags: ['콘텐츠'], summary: '콘텐츠 댓글 목록', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: '댓글 목록' } } },
        post: { tags: ['콘텐츠'], summary: '콘텐츠 댓글 작성', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 201: { description: '작성 완료' } } },
      },
      '/api/comments/{id}': {
        delete: { tags: ['콘텐츠'], summary: '콘텐츠 댓글 삭제', parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }], responses: { 200: { description: '삭제 성공' } } },
      },

      // ── 커뮤니티 ──────────────────────────────────────────────────────
      '/api/posts': {
        get: {
          tags: ['커뮤니티'], summary: '게시글 목록',
          parameters: [
            { in: 'query', name: 'category', schema: { type: 'string', enum: ['question','tip'] } },
            { in: 'query', name: 'keyword',  schema: { type: 'string' } },
            { in: 'query', name: 'page',     schema: { type: 'integer', default: 1 } },
          ],
          responses: { 200: { description: '게시글 목록' } },
        },
        post: {
          tags: ['커뮤니티'], summary: '게시글 작성',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['user_id','title','content'],
              properties: {
                user_id:  { type: 'integer' },
                category: { type: 'string', enum: ['question','tip'], default: 'question' },
                title:    { type: 'string' },
                content:  { type: 'string' },
              },
            }}},
          },
          responses: { 201: { description: '작성 완료' } },
        },
      },
      '/api/posts/{id}': {
        get: {
          tags: ['커뮤니티'], summary: '게시글 상세 (댓글 포함)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '게시글 상세' }, 404: { description: '게시글 없음' } },
        },
        put: {
          tags: ['커뮤니티'], summary: '게시글 수정',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: { 'application/json': { schema: { type: 'object',
              properties: { title: { type: 'string' }, content: { type: 'string' }, category: { type: 'string' } },
            }}},
          },
          responses: { 200: { description: '수정 성공' } },
        },
        delete: {
          tags: ['커뮤니티'], summary: '게시글 삭제',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '삭제 성공' } },
        },
      },
      '/api/posts/{id}/comments': {
        post: {
          tags: ['커뮤니티'], summary: '게시글 댓글 작성',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['user_id','content'],
              properties: { user_id: { type: 'integer' }, content: { type: 'string' } },
            }}},
          },
          responses: { 201: { description: '댓글 작성 완료' } },
        },
      },
      '/api/post-comments/{id}': {
        delete: {
          tags: ['커뮤니티'], summary: '게시글 댓글 삭제',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: '삭제 성공' } },
        },
      },
    },
  },
  apis: [],  // paths를 직접 정의했으므로 파일 스캔 불필요
}

export default swaggerJsdoc(options)
