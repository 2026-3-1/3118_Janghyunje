import { body, param, query, validationResult } from 'express-validator'

// 검증 결과 처리 미들웨어
export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    })
  }
  next()
}

// 회원가입 검증
export const validateSignup = [
  body('email')
    .trim()
    .isEmail().withMessage('올바른 이메일 형식을 입력해주세요.')
    .isLength({ max: 255 }).withMessage('이메일이 너무 깁니다.'),
  body('password')
    .isLength({ min: 4, max: 100 }).withMessage('비밀번호는 4자 이상 100자 이하여야 합니다.'),
  body('nickname')
    .trim()
    .notEmpty().withMessage('닉네임을 입력해주세요.')
    .isLength({ min: 2, max: 20 }).withMessage('닉네임은 2~20자여야 합니다.')
    .matches(/^[가-힣a-zA-Z0-9_]+$/).withMessage('닉네임에는 한글, 영문, 숫자, _만 사용 가능합니다.'),
  body('role')
    .isIn(['student', 'coach']).withMessage('역할은 student 또는 coach여야 합니다.'),
  validate,
]

// 로그인 검증
export const validateLogin = [
  body('email').trim().isEmail().withMessage('올바른 이메일 형식을 입력해주세요.'),
  body('password').notEmpty().withMessage('비밀번호를 입력해주세요.'),
  validate,
]

// 강의 등록 검증
export const validateLecture = [
  body('title')
    .trim()
    .notEmpty().withMessage('강의 제목을 입력해주세요.')
    .isLength({ max: 255 }).withMessage('강의 제목은 255자 이하여야 합니다.')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('강의 설명은 5000자 이하여야 합니다.'),
  body('game')
    .isIn(['lol', 'valorant', 'tft', 'battleground', 'overwatch2', 'starcraft2'])
    .withMessage('올바른 게임을 선택해주세요.'),
  body('price')
    .isInt({ min: 0, max: 10000000 }).withMessage('가격은 0 이상 1000만원 이하여야 합니다.'),
  body('original_price')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 10000000 }).withMessage('원가는 0 이상 1000만원 이하여야 합니다.'),
  validate,
]

// 리뷰 작성 검증
export const validateReview = [
  body('lecture_id').isInt({ min: 1 }).withMessage('올바른 강의 ID를 입력해주세요.'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('별점은 1~5 사이여야 합니다.'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('후기는 1000자 이하여야 합니다.'),
  validate,
]

// 게시글 작성 검증
export const validatePost = [
  body('title')
    .trim()
    .notEmpty().withMessage('제목을 입력해주세요.')
    .isLength({ max: 255 }).withMessage('제목은 255자 이하여야 합니다.')
    .escape(),
  body('content')
    .trim()
    .notEmpty().withMessage('내용을 입력해주세요.')
    .isLength({ max: 10000 }).withMessage('내용은 10000자 이하여야 합니다.'),
  body('category')
    .isIn(['question', 'tip']).withMessage('카테고리는 question 또는 tip이어야 합니다.'),
  validate,
]

// Q&A 작성 검증
export const validateQnA = [
  body('title')
    .trim()
    .notEmpty().withMessage('질문 제목을 입력해주세요.')
    .isLength({ max: 255 }).withMessage('제목은 255자 이하여야 합니다.')
    .escape(),
  body('content')
    .trim()
    .notEmpty().withMessage('질문 내용을 입력해주세요.')
    .isLength({ max: 5000 }).withMessage('내용은 5000자 이하여야 합니다.'),
  validate,
]

// ID 파라미터 검증
export const validateId = [
  param('id').isInt({ min: 1 }).withMessage('올바른 ID를 입력해주세요.'),
  validate,
]
