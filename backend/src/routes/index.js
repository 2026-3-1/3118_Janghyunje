import { Router } from 'express'
import { signup, login, getUserById, updateUser } from '../controllers/authController.js'
import { getLectures, getMyLectures, getLectureById, createLecture, updateLecture, deleteLecture } from '../controllers/lectureController.js'
import { applyLecture, getStudentApplications, getCoachApplications, approveApplication, rejectApplication, getLectureStudents } from '../controllers/applicationController.js'
import { getReviews, createReview } from '../controllers/reviewController.js'
import { getPosts, getPostById, createPost, updatePost, deletePost, createPostComment, deletePostComment } from '../controllers/communityController.js'
import { getContents, getContentById, createContent, updateContent, deleteContent, getComments, createComment, deleteComment } from '../controllers/contentController.js'
import { getCart, addToCart, removeFromCart, clearCart } from '../controllers/cartController.js'
import { saveProgress, getLectureProgress, getContentProgress } from '../controllers/progressController.js'
import { getMyReports, getReportById, getCoachReports, createReport, updateReport, deleteReport } from '../controllers/growthController.js'
import { authenticate, authorize } from '../middleware/errorHandler.js'

const router = Router()

// ── 인증 (공개) ──────────────────────────────────────────────────────
router.post('/signup', signup)
router.post('/login',  login)

// ── 유저 ─────────────────────────────────────────────────────────────
router.get('/users/:id',  authenticate, getUserById)
router.put('/users/:id',  authenticate, updateUser)

// ── 강의 ─────────────────────────────────────────────────────────────
router.get('/lectures/my',     authenticate, authorize('coach'), getMyLectures)  // 반드시 /:id 보다 위에 있어야 함
router.get('/lectures',        getLectures)
router.get('/lectures/:id',    getLectureById)
router.post('/lectures',       authenticate, authorize('coach'), createLecture)
router.put('/lectures/:id',    authenticate, authorize('coach'), updateLecture)
router.delete('/lectures/:id', authenticate, authorize('coach'), deleteLecture)

// ── 수강 신청 ─────────────────────────────────────────────────────────
router.post('/applications',                    authenticate, authorize('student'), applyLecture)
router.get('/applications/student',             authenticate, authorize('student'), getStudentApplications)
router.get('/applications/coach',               authenticate, authorize('coach'),   getCoachApplications)
router.get('/applications/lecture/:lectureId',  authenticate, authorize('coach'),   getLectureStudents)
router.put('/applications/:id/approve',         authenticate, authorize('coach'),   approveApplication)
router.put('/applications/:id/reject',          authenticate, authorize('coach'),   rejectApplication)

// ── 리뷰 ─────────────────────────────────────────────────────────────
router.get('/reviews/:lectureId', getReviews)
router.post('/reviews',           authenticate, authorize('student'), createReview)

// ── 장바구니 ─────────────────────────────────────────────────────────
router.get('/cart',               authenticate, getCart)
router.post('/cart',              authenticate, addToCart)
router.delete('/cart/:lectureId', authenticate, removeFromCart)
router.delete('/cart',            authenticate, clearCart)

// ── 진도율 ──────────────────────────────────────────────────────────
router.post('/progress',                              authenticate, saveProgress)
router.get('/progress/:lectureId',                    authenticate, getLectureProgress)
router.get('/progress/:lectureId/content/:contentId', authenticate, getContentProgress)

// ── 성장 분석 ─────────────────────────────────────────────────────────
router.get('/growth/reports',        authenticate, authorize('student'), getMyReports)
router.get('/growth/coach/reports',  authenticate, authorize('coach'),   getCoachReports)
router.get('/growth/reports/:id',    authenticate, getReportById)
router.post('/growth/reports',       authenticate, authorize('coach'),   createReport)
router.put('/growth/reports/:id',    authenticate, authorize('coach'),   updateReport)
router.delete('/growth/reports/:id', authenticate, authorize('coach'),   deleteReport)

// ── 강의 콘텐츠 / 댓글 ───────────────────────────────────────────────
router.get('/lectures/:lectureId/contents',  authenticate, getContents)
router.post('/lectures/:lectureId/contents', authenticate, authorize('coach'), createContent)
router.get('/contents/:id',                  authenticate, getContentById)
router.put('/contents/:id',                  authenticate, authorize('coach'), updateContent)
router.delete('/contents/:id',               authenticate, authorize('coach'), deleteContent)
router.get('/contents/:id/comments',         authenticate, getComments)
router.post('/contents/:id/comments',        authenticate, createComment)
router.delete('/comments/:id',               authenticate, deleteComment)

// ── 커뮤니티 ─────────────────────────────────────────────────────────
router.get('/posts',                getPosts)
router.get('/posts/:id',            getPostById)
router.post('/posts',               authenticate, createPost)
router.put('/posts/:id',            authenticate, updatePost)
router.delete('/posts/:id',         authenticate, deletePost)
router.post('/posts/:id/comments',  authenticate, createPostComment)
router.delete('/post-comments/:id', authenticate, deletePostComment)

export default router
