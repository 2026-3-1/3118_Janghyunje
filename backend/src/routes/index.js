import { Router } from 'express'
import { signup, login, getUserById, updateUser } from '../controllers/authController.js'
import { getLectures, getLectureById, createLecture, updateLecture, deleteLecture } from '../controllers/lectureController.js'
import { applyLecture, getStudentApplications, getCoachApplications, approveApplication, rejectApplication } from '../controllers/applicationController.js'
import { getReviews, createReview } from '../controllers/reviewController.js'
import { getPosts, getPostById, createPost, updatePost, deletePost, createPostComment, deletePostComment } from '../controllers/communityController.js'

const router = Router()

router.post('/signup', signup)
router.post('/login', login)
router.get('/users/:id', getUserById)
router.put('/users/:id', updateUser)

router.get('/lectures',        getLectures)
router.post('/lectures',       createLecture)
router.get('/lectures/:id',    getLectureById)
router.put('/lectures/:id',    updateLecture)
router.delete('/lectures/:id', deleteLecture)

router.post('/applications',              applyLecture)
router.get('/applications/student',       getStudentApplications)
router.get('/applications/coach',         getCoachApplications)
router.put('/applications/:id/approve',   approveApplication)
router.put('/applications/:id/reject',    rejectApplication)

router.get('/reviews/:lectureId', getReviews)
router.post('/reviews',           createReview)

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

// ── 커뮤니티 ─────────────────────────────────────────────────────────
router.get('/posts',                  getPosts)
router.post('/posts',                 createPost)
router.get('/posts/:id',              getPostById)
router.put('/posts/:id',              updatePost)
router.delete('/posts/:id',           deletePost)
router.post('/posts/:id/comments',    createPostComment)
router.delete('/post-comments/:id',   deletePostComment)

export default router
