import nodemailer from 'nodemailer'
import logger from './logger.js'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const sendMail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.warn('[Email] EMAIL_USER/PASS 미설정 — 건너뜀')
    return
  }
  try {
    await transporter.sendMail({
      from: `"GCP 게임코칭플랫폼" <${process.env.EMAIL_USER}>`,
      to, subject, html,
    })
    logger.info(`[Email] 발송 완료 → ${to} | ${subject}`)
  } catch (err) {
    logger.error(`[Email] 발송 실패 → ${to}`, { error: err.message })
  }
}

// 공통 이메일 레이아웃
const layout = (content) => `
  <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
    <div style="background: #4F46E5; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 22px;">🎮 GCP 게임코칭플랫폼</h1>
    </div>
    <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e5;">
      ${content}
      <p style="color: #999; font-size: 12px; margin-top: 24px;">본 메일은 발신 전용입니다.</p>
    </div>
  </div>
`

const btn = (href, label) =>
  `<a href="${href}" style="display:inline-block;background:#4F46E5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px;">${label}</a>`

const card = (rows) =>
  `<div style="background:white;border:1px solid #e5e5e5;border-radius:8px;padding:16px;margin:16px 0;">
    ${rows.map(([k, v]) => `<p style="margin:0 0 6px;"><span style="color:#666;font-size:13px;">${k}</span><br/><strong>${v}</strong></p>`).join('')}
  </div>`

// 1. 결제 완료
export const sendEnrollmentEmail = async ({ to, nickname, lectureTitle, price }) => {
  await sendMail({
    to,
    subject: `[GCP] "${lectureTitle}" 수강 신청이 완료됐습니다`,
    html: layout(`
      <p style="font-size:16px;">안녕하세요, <strong>${nickname}</strong>님!</p>
      <p>아래 강의 수강 신청이 완료됐습니다.</p>
      ${card([['강의명', lectureTitle], ['결제 금액', `${Number(price).toLocaleString()}원`]])}
      ${btn(`${BASE_URL}/mypage`, '내 수강 목록 보기')}
    `),
  })
}

// 2. Q&A 답변 알림 (학생에게)
export const sendQnAReplyEmail = async ({ to, nickname, lectureTitle, questionTitle, lectureId, postId }) => {
  await sendMail({
    to,
    subject: `[GCP] Q&A 답변이 달렸습니다 — "${questionTitle}"`,
    html: layout(`
      <p style="font-size:16px;">안녕하세요, <strong>${nickname}</strong>님!</p>
      <p><strong>${lectureTitle}</strong> 강의 Q&A에 코치님의 답변이 달렸습니다.</p>
      ${card([['질문 제목', questionTitle]])}
      ${btn(`${BASE_URL}/lectures/${lectureId}/qna/${postId}`, '답변 확인하기')}
    `),
  })
}

// 3. 성장 분석 알림 (학생에게)
export const sendGrowthReportEmail = async ({ to, nickname, lectureTitle, reportTitle }) => {
  await sendMail({
    to,
    subject: `[GCP] 새 성장 분석 리포트가 도착했습니다`,
    html: layout(`
      <p style="font-size:16px;">안녕하세요, <strong>${nickname}</strong>님!</p>
      <p>코치님이 새 성장 분석 리포트를 작성했습니다.</p>
      ${card([['강의', lectureTitle], ['리포트 제목', reportTitle]])}
      ${btn(`${BASE_URL}/growth`, '성장 분석 보기')}
    `),
  })
}

// 4. 팔로우한 코치 신규 강의 알림 (팔로워 학생들에게)
export const sendNewLectureEmail = async ({ to, nickname, coachNickname, lectureTitle, lectureId, price }) => {
  await sendMail({
    to,
    subject: `[GCP] ${coachNickname} 코치님의 새 강의가 등록됐습니다`,
    html: layout(`
      <p style="font-size:16px;">안녕하세요, <strong>${nickname}</strong>님!</p>
      <p>팔로우하신 <strong>${coachNickname}</strong> 코치님의 새 강의가 등록됐습니다.</p>
      ${card([
        ['강의명', lectureTitle],
        ['가격', `${Number(price).toLocaleString()}원`],
        ['코치', coachNickname],
      ])}
      ${btn(`${BASE_URL}/lectures/${lectureId}`, '강의 보러가기')}
    `),
  })
}
