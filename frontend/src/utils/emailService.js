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

const send = async ({ toEmail, nickname, lectureTitle, price, message }) => {
  if (!toEmail) return false
  try {
    const emailjs = await loadEmailJS()
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email:      toEmail,
      nickname:      nickname || '',
      lecture_title: lectureTitle || '',
      price:         price || '',
      message:       message || '',
    })
    console.log('[Email] 발송 완료 →', toEmail)
    return true
  } catch (err) {
    console.error('[Email] 발송 실패:', err)
    return false
  }
}

// 결제 완료
export const sendEnrollmentEmail = async ({ toEmail, nickname, lectureTitle, price }) => {
  return send({
    toEmail,
    nickname,
    lectureTitle,
    price: `${Number(price).toLocaleString()}원`,
    message: '결제가 정상 처리됐습니다. 지금 바로 수강을 시작해보세요!',
  })
}

// Q&A 답변
export const sendQnAReplyEmail = async ({ toEmail, nickname, lectureTitle, questionTitle }) => {
  return send({
    toEmail,
    nickname,
    lectureTitle,
    price: '',
    message: `Q&A 질문 "${questionTitle}"에 코치님의 답변이 달렸습니다.`,
  })
}

// 성장 분석
export const sendGrowthReportEmail = async ({ toEmail, nickname, lectureTitle, reportTitle }) => {
  return send({
    toEmail,
    nickname,
    lectureTitle,
    price: '',
    message: `성장 분석 리포트 "${reportTitle}"가 작성됐습니다.`,
  })
}

// 신규 강의 알림
export const sendNewLectureEmail = async ({ toEmail, nickname, coachNickname, lectureTitle, price }) => {
  return send({
    toEmail,
    nickname,
    lectureTitle,
    price: `${Number(price).toLocaleString()}원`,
    message: `${coachNickname} 코치님의 새 강의가 등록됐습니다.`,
  })
}
