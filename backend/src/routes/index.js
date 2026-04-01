import { Router } from 'express'
import { signup, login, getUserById, updateUser } from '../controllers/authController.js'
import { getLectures, getLectureById, createLecture, updateLecture, deleteLecture } from '../controllers/lectureController.js'
import { applyLecture, getStudentApplications, getCoachApplications, approveApplication, rejectApplication } from '../controllers/applicationController.js'
import { getReviews, createReview } from '../controllers/reviewController.js'

const router = Router()

/**
 * @swagger
 * /api/signup:
 *   post:
 *     tags: [인증]
 *     summary: 회원가입
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, nickname]
 *             properties:
 *               email:    { type: string, example: user@example.com }
 *               password: { type: string, example: password123 }
 *               nickname: { type: string, example: GankMaster }
 *               role:     { type: string, enum: [student, coach], default: student }
 *               game:     { type: string, example: lol }
 *               tier:     { type: string, example: gold }
 *     responses:
 *       201: { description: 회원가입 성공 }
 *       409: { description: 이미 사용 중인 이메일 }
 */
router.post('/signup', signup)

/**
 * @swagger
 * /api/login:
 *   post:
 *     tags: [인증]
 *     summary: 로그인
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: user@example.com }
 *               password: { type: string, example: password123 }
 *     responses:
 *       200: { description: 로그인 성공 }
 *       401: { description: 이메일 또는 비밀번호 불일치 }
 */
router.post('/login', login)

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [유저]
 *     summary: 사용자 정보 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: 조회 성공 }
 *       404: { description: 유저 없음 }
 *   put:
 *     tags: [유저]
 *     summary: 사용자 정보 수정
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname: { type: string }
 *               game:     { type: string }
 *               tier:     { type: string }
 *     responses:
 *       200: { description: 수정 성공 }
 */
router.get('/users/:id', getUserById)
router.put('/users/:id', updateUser)

/**
 * @swagger
 * /api/lectures:
 *   get:
 *     tags: [강의]
 *     summary: 강의 목록 조회 (검색/필터 포함)
 *     parameters:
 *       - { in: query, name: game,      schema: { type: string } }
 *       - { in: query, name: tier,      schema: { type: string } }
 *       - { in: query, name: maxPrice,  schema: { type: integer } }
 *       - { in: query, name: keyword,   schema: { type: string } }
 *       - { in: query, name: coachType, schema: { type: string } }
 *       - { in: query, name: position,  schema: { type: string } }
 *       - { in: query, name: sort,      schema: { type: string, enum: [ranking, rating, price_asc, price_desc, newest] } }
 *     responses:
 *       200: { description: 강의 목록 }
 *   post:
 *     tags: [강의]
 *     summary: 강의 등록
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [coach_id, title, game, price]
 *             properties:
 *               coach_id:       { type: integer }
 *               title:          { type: string }
 *               description:    { type: string }
 *               game:           { type: string }
 *               price:          { type: integer }
 *               original_price: { type: integer }
 *               target_tier:    { type: string }
 *               position:       { type: string }
 *               coach_type:     { type: string }
 *     responses:
 *       201: { description: 등록 성공 }
 */
router.get('/lectures',    getLectures)
router.post('/lectures',   createLecture)

/**
 * @swagger
 * /api/lectures/{id}:
 *   get:
 *     tags: [강의]
 *     summary: 강의 상세 조회
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: 강의 상세 }
 *       404: { description: 강의 없음 }
 *   put:
 *     tags: [강의]
 *     summary: 강의 수정
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Lecture' }
 *     responses:
 *       200: { description: 수정 성공 }
 *   delete:
 *     tags: [강의]
 *     summary: 강의 삭제
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: 삭제 성공 }
 */
router.get('/lectures/:id',    getLectureById)
router.put('/lectures/:id',    updateLecture)
router.delete('/lectures/:id', deleteLecture)

/**
 * @swagger
 * /api/applications:
 *   post:
 *     tags: [수강신청]
 *     summary: 수강 신청
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lecture_id, student_id]
 *             properties:
 *               lecture_id: { type: integer }
 *               student_id: { type: integer }
 *     responses:
 *       201: { description: 신청 완료 }
 *       409: { description: 이미 신청한 강의 }
 */
router.post('/applications', applyLecture)

/**
 * @swagger
 * /api/applications/student:
 *   get:
 *     tags: [수강신청]
 *     summary: 학생 신청 목록 조회
 *     parameters:
 *       - { in: query, name: student_id, required: true, schema: { type: integer }, description: P2에서 JWT로 대체 예정 }
 *     responses:
 *       200: { description: 신청 목록 }
 */
router.get('/applications/student', getStudentApplications)

/**
 * @swagger
 * /api/applications/coach:
 *   get:
 *     tags: [수강신청]
 *     summary: 코치 신청 목록 조회
 *     parameters:
 *       - { in: query, name: coach_id, required: true, schema: { type: integer }, description: P2에서 JWT로 대체 예정 }
 *     responses:
 *       200: { description: 신청 목록 }
 */
router.get('/applications/coach', getCoachApplications)

/**
 * @swagger
 * /api/applications/{id}/approve:
 *   put:
 *     tags: [수강신청]
 *     summary: 수강 신청 승인
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: 승인 완료 }
 */
router.put('/applications/:id/approve', approveApplication)

/**
 * @swagger
 * /api/applications/{id}/reject:
 *   put:
 *     tags: [수강신청]
 *     summary: 수강 신청 거절
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: 거절 완료 }
 */
router.put('/applications/:id/reject', rejectApplication)

/**
 * @swagger
 * /api/reviews/{lectureId}:
 *   get:
 *     tags: [리뷰]
 *     summary: 강의 리뷰 목록 조회
 *     parameters:
 *       - { in: path, name: lectureId, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: 리뷰 목록 }
 */
router.get('/reviews/:lectureId', getReviews)

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     tags: [리뷰]
 *     summary: 리뷰 작성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lecture_id, student_id, rating]
 *             properties:
 *               lecture_id: { type: integer }
 *               student_id: { type: integer }
 *               rating:     { type: integer, minimum: 1, maximum: 5 }
 *               comment:    { type: string }
 *     responses:
 *       201: { description: 리뷰 작성 완료 }
 *       409: { description: 이미 리뷰 작성함 }
 */
router.post('/reviews', createReview)

// ── 강의 콘텐츠 / 댓글 ────────────────────────────────────────────────
import { getContents, getContentById, createContent, updateContent, deleteContent, getComments, createComment, deleteComment } from '../controllers/contentController.js'

router.get('/lectures/:lectureId/contents',  getContents)
router.post('/lectures/:lectureId/contents', createContent)
router.get('/contents/:id',                  getContentById)
router.put('/contents/:id',                  updateContent)
router.delete('/contents/:id',               deleteContent)
router.get('/contents/:id/comments',         getComments)
router.post('/contents/:id/comments',        createComment)
router.delete('/comments/:id',               deleteComment)

export default router
