import { Router } from 'express'
import { signup, login, adminLogin, getUserById, updateUser } from '../controllers/authController.js'
import { getLectures, getMyLectures, getLectureById, createLecture, updateLecture, deleteLecture } from '../controllers/lectureController.js'
import { applyLecture, getStudentApplications, getCoachApplications, getLectureStudents } from '../controllers/applicationController.js'
import { getReviews, createReview } from '../controllers/reviewController.js'
import { getPosts, getPostById, createPost, updatePost, deletePost, createPostComment, deletePostComment } from '../controllers/communityController.js'
import { getContents, getContentById, createContent, updateContent, deleteContent, getComments, createComment, deleteComment } from '../controllers/contentController.js'
import { getCart, addToCart, removeFromCart, clearCart } from '../controllers/cartController.js'
import { saveProgress, getLectureProgress, getContentProgress } from '../controllers/progressController.js'
import { getMyReports, getReportById, getCoachReports, createReport, updateReport, deleteReport } from '../controllers/growthController.js'
import { getStats, getUsers, getUserDetail, deactivateUser, activateUser, getAdminLectures, updateLectureStatus, deleteAdminLecture, getAdminReviews, deleteAdminReview } from '../controllers/adminController.js'
import { getQnAPosts, createQnAPost, getQnAPostById, updateQnAPost, deleteQnAPost, createQnAComment, solveQnA, deleteQnAComment } from '../controllers/qnaController.js'
import { getFollowStatus, followCoach, unfollowCoach, getFollowers, getFollowingCoaches } from '../controllers/followController.js'
import { getQnANotifyInfo, getGrowthNotifyInfo, getLectureFollowerNotifyInfo } from '../controllers/notifyController.js'
import { getMyPayments, requestRefund, getAdminRefunds } from '../controllers/refundController.js'
import { authenticate, authorize } from '../middleware/errorHandler.js'
import { validateSignup, validateLogin, validateLecture, validateReview, validatePost, validateQnA } from '../middleware/validators.js'

const router = Router()

// ── 인증 ─────────────────────────────────────────────────────────────
router.post('/signup',       validateSignup, signup)
router.post('/login',        validateLogin,  login)
router.post('/admin/login',  adminLogin)          // 관리자 전용 로그인
router.get('/users/:id',  authenticate, getUserById)
router.put('/users/:id',  authenticate, updateUser)

// ── 강의 ─────────────────────────────────────────────────────────────
router.get('/lectures/my',     authenticate, authorize('coach'), getMyLectures)
router.get('/lectures',        getLectures)
router.get('/lectures/:id',    getLectureById)
router.post('/lectures',       authenticate, authorize('coach'), validateLecture, createLecture)
router.put('/lectures/:id',    authenticate, authorize('coach'), validateLecture, updateLecture)
router.delete('/lectures/:id', authenticate, authorize('coach'), deleteLecture)

// ── 수강 신청 ─────────────────────────────────────────────────────────
router.post('/applications',                   authenticate, authorize('student'), applyLecture)
router.get('/applications/student',            authenticate, authorize('student'), getStudentApplications)
router.get('/applications/coach',              authenticate, authorize('coach'),   getCoachApplications)
router.get('/applications/lecture/:lectureId', authenticate, authorize('coach'),   getLectureStudents)

// ── 리뷰 ─────────────────────────────────────────────────────────────
router.get('/reviews/:lectureId', getReviews)
router.post('/reviews',           authenticate, authorize('student'), validateReview, createReview)

// ── 장바구니 ─────────────────────────────────────────────────────────
router.get('/cart',               authenticate, getCart)
router.post('/cart',              authenticate, addToCart)
router.delete('/cart/:lectureId', authenticate, removeFromCart)
router.delete('/cart',            authenticate, clearCart)

// ── 진도율 ──────────────────────────────────────────────────────────
router.post('/progress',                              authenticate, saveProgress)
router.get('/progress/:lectureId',                    authenticate, getLectureProgress)
router.get('/progress/:lectureId/content/:contentId', authenticate, getContentProgress)

// ── 결제 내역 & 환불 ─────────────────────────────────────────────────
router.get('/payments',                              authenticate, authorize('student'), getMyPayments)
router.post('/payments/:applicationId/refund',       authenticate, authorize('student'), requestRefund)

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

// ── Q&A ──────────────────────────────────────────────────────────────
router.get('/lectures/:lectureId/qna',        authenticate, getQnAPosts)
router.post('/lectures/:lectureId/qna',       authenticate, validateQnA, createQnAPost)
router.get('/qna/:id',                        authenticate, getQnAPostById)
router.put('/qna/:id',                        authenticate, updateQnAPost)
router.delete('/qna/:id',                     authenticate, deleteQnAPost)
router.post('/qna/:id/comments',              authenticate, createQnAComment)
router.put('/qna/:postId/solve/:commentId',   authenticate, authorize('coach'), solveQnA)
router.delete('/qna-comments/:id',            authenticate, deleteQnAComment)

// ── 팔로우 ────────────────────────────────────────────────────────────
router.get('/coaches/:coachId/follow',     authenticate, getFollowStatus)
router.post('/coaches/:coachId/follow',    authenticate, authorize('student'), followCoach)
router.delete('/coaches/:coachId/follow',  authenticate, authorize('student'), unfollowCoach)
router.get('/coaches/:coachId/followers',  authenticate, getFollowers)
router.get('/follows/coaches',             authenticate, authorize('student'), getFollowingCoaches)

// ── 알림 정보 조회 ────────────────────────────────────────────────────
router.get('/notify/qna/:postId',                  authenticate, getQnANotifyInfo)
router.get('/notify/growth/:reportId',             authenticate, getGrowthNotifyInfo)
router.get('/notify/lecture/:lectureId/followers', authenticate, getLectureFollowerNotifyInfo)

// ── 관리자 ───────────────────────────────────────────────────────────
router.get('/admin/stats',                    authenticate, authorize('admin'), getStats)
router.get('/admin/users',                    authenticate, authorize('admin'), getUsers)
router.get('/admin/users/:id',                authenticate, authorize('admin'), getUserDetail)
router.put('/admin/users/:id/deactivate',     authenticate, authorize('admin'), deactivateUser)
router.put('/admin/users/:id/activate',       authenticate, authorize('admin'), activateUser)
router.get('/admin/lectures',                 authenticate, authorize('admin'), getAdminLectures)
router.put('/admin/lectures/:id/status',      authenticate, authorize('admin'), updateLectureStatus)
router.delete('/admin/lectures/:id',          authenticate, authorize('admin'), deleteAdminLecture)
router.get('/admin/reviews',                  authenticate, authorize('admin'), getAdminReviews)
router.delete('/admin/reviews/:id',           authenticate, authorize('admin'), deleteAdminReview)
router.get('/admin/refunds',                  authenticate, authorize('admin'), getAdminRefunds)

// ── 커뮤니티 ─────────────────────────────────────────────────────────
router.get('/posts',                getPosts)
router.get('/posts/:id',            getPostById)
router.post('/posts',               authenticate, validatePost, createPost)
router.put('/posts/:id',            authenticate, updatePost)
router.delete('/posts/:id',         authenticate, deletePost)
router.post('/posts/:id/comments',  authenticate, createPostComment)
router.delete('/post-comments/:id', authenticate, deletePostComment)

export default router
