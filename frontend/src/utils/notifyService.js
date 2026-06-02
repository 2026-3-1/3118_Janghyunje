import api from '../services/api'
import {
  sendQnAReplyEmail,
  sendGrowthReportEmail,
  sendNewLectureEmail,
} from './emailService'

// Q&A 답변 후 질문자에게 알림
export const notifyQnAReply = async (postId) => {
  try {
    const res = await api.get(`/notify/qna/${postId}`)
    const d = res.data.data
    if (!d.toEmail) return
    await sendQnAReplyEmail({
      toEmail:       d.toEmail,
      nickname:      d.nickname,
      lectureTitle:  d.lectureTitle,
      questionTitle: d.questionTitle,
    })
  } catch (err) {
    console.error('[Notify] Q&A 알림 실패:', err)
  }
}

// 성장 분석 작성 후 학생에게 알림
export const notifyGrowthReport = async (reportId) => {
  try {
    const res = await api.get(`/notify/growth/${reportId}`)
    const d = res.data.data
    if (!d.toEmail) return
    await sendGrowthReportEmail({
      toEmail:      d.toEmail,
      nickname:     d.nickname,
      lectureTitle: d.lectureTitle,
      reportTitle:  d.reportTitle,
    })
  } catch (err) {
    console.error('[Notify] 성장분석 알림 실패:', err)
  }
}

// 신규 강의 등록 후 팔로워들에게 알림
export const notifyNewLecture = async (lectureId) => {
  try {
    const res = await api.get(`/notify/lecture/${lectureId}/followers`)
    const d = res.data.data
    if (!d.followers?.length) return

    // 팔로워 개별 발송
    for (const follower of d.followers) {
      if (!follower.notification_email) continue
      sendNewLectureEmail({
        toEmail:       follower.notification_email,
        nickname:      follower.nickname,
        coachNickname: d.coachNickname,
        lectureTitle:  d.lectureTitle,
        price:         d.price,
      }).catch(() => {})
    }
    console.log(`[Notify] 신규 강의 알림 — 팔로워 ${d.followers.length}명`)
  } catch (err) {
    console.error('[Notify] 신규강의 알림 실패:', err)
  }
}
