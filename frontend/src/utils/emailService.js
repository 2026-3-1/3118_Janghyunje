// EmailJS 프론트엔드 이메일 서비스
const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

const loadEmailJS = () => {
  return new Promise((resolve, reject) => {
    if (window.emailjs) { resolve(window.emailjs); return }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js'
    script.onload = () => { window.emailjs.init(EMAILJS_PUBLIC_KEY); resolve(window.emailjs) }
    script.onerror = reject
    document.head.appendChild(script)
  })
}

const send = async ({ toEmail, subject, nickname, message }) => {
  if (!toEmail) return false
  try {
    const emailjs = await loadEmailJS()
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email:      toEmail,
      nickname:      nickname || '',
      lecture_title: subject || '',
      price:         message || '',
    })
    console.log('[Email] 발송 완료 →', toEmail)
    return true
  } catch (err) {
    console.error('[Email] 발송 실패:', err)
    return false
  }
}

export const sendEnrollmentEmail = async ({ toEmail, nickname, lectureTitle, price }) => {
  return send({ toEmail, nickname, subject: `"${lectureTitle}" 수강 신청 완료`, message: `결제 금액: ${Number(price).toLocaleString()}원` })
}

export const sendQnAReplyEmail = async ({ toEmail, nickname, lectureTitle, questionTitle }) => {
  return send({ toEmail, nickname, subject: `[Q&A 답변] ${questionTitle}`, message: `강의 "${lectureTitle}"에 코치님의 답변이 달렸습니다.` })
}

export const sendGrowthReportEmail = async ({ toEmail, nickname, lectureTitle, reportTitle }) => {
  return send({ toEmail, nickname, subject: `[성장분석] ${reportTitle}`, message: `강의 "${lectureTitle}"의 성장 분석 리포트가 작성됐습니다.` })
}

export const sendNewLectureEmail = async ({ toEmail, nickname, coachNickname, lectureTitle, price }) => {
  return send({ toEmail, nickname, subject: `[새 강의] ${coachNickname} 코치님의 강의가 등록됐습니다`, message: `강의명: ${lectureTitle} | 가격: ${Number(price).toLocaleString()}원` })
}
