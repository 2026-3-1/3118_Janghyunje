import logger from './logger.js'

// 플랫폼 공용 Webhook (관리자용 채널)
const PLATFORM_WEBHOOK = process.env.DISCORD_WEBHOOK_URL

const sendToWebhook = async (webhookUrl, payload) => {
  if (!webhookUrl) return false
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return true
  } catch (err) {
    logger.error('[Discord] Webhook 전송 실패', { error: err.message })
    return false
  }
}

// 플랫폼 공용 채널로 발송
const sendToplatform = (payload) => {
  if (!PLATFORM_WEBHOOK) {
    logger.warn('[Discord] DISCORD_WEBHOOK_URL 미설정 — 건너뜀')
    return Promise.resolve()
  }
  return sendToWebhook(PLATFORM_WEBHOOK, payload)
}

// ── 개인 Webhook 발송 (유저별) ────────────────────────────────────────
// 유저가 프로필에서 자신의 디스코드 Webhook URL을 등록하면 개인 DM처럼 알림 수신
export const sendPersonalDiscord = async (webhookUrl, embed) => {
  if (!webhookUrl) return
  await sendToWebhook(webhookUrl, { embeds: [embed] })
}

// Q&A 답변 — 질문자 개인 알림
export const notifyQnAReplyDiscord = async ({ webhookUrl, questionTitle, lectureTitle, coachNickname }) => {
  await sendPersonalDiscord(webhookUrl, {
    title: '💬 Q&A에 코치님의 답변이 달렸습니다',
    color: 0x06B6D4,
    fields: [
      { name: '질문',   value: questionTitle, inline: false },
      { name: '강의',   value: lectureTitle,  inline: true  },
      { name: '코치',   value: coachNickname, inline: true  },
    ],
    timestamp: new Date().toISOString(),
  })
}

// 성장 분석 — 학생 개인 알림
export const notifyGrowthReportDiscord = async ({ webhookUrl, reportTitle, lectureTitle, coachNickname }) => {
  await sendPersonalDiscord(webhookUrl, {
    title: '📊 새 성장 분석 리포트가 작성됐습니다',
    color: 0x8B5CF6,
    fields: [
      { name: '리포트',  value: reportTitle,   inline: false },
      { name: '강의',    value: lectureTitle,  inline: true  },
      { name: '코치',    value: coachNickname, inline: true  },
    ],
    timestamp: new Date().toISOString(),
  })
}

// 신규 강의 등록 — 팔로워 개인 알림
export const notifyNewLectureDiscord = async ({ webhookUrl, lectureTitle, coachNickname, price, game }) => {
  await sendPersonalDiscord(webhookUrl, {
    title: '📚 팔로우한 코치님의 새 강의가 등록됐습니다',
    color: 0x4F46E5,
    fields: [
      { name: '강의명',  value: lectureTitle,                          inline: false },
      { name: '코치',    value: coachNickname,                         inline: true  },
      { name: '게임',    value: game || '미설정',                      inline: true  },
      { name: '가격',    value: `${Number(price).toLocaleString()}원`, inline: true  },
    ],
    timestamp: new Date().toISOString(),
  })
}

// ── 플랫폼 공용 채널 알림 (관리자용) ─────────────────────────────────
export const notifyNewLecture = async ({ title, game, price, coachNickname, followerCount }) => {
  await sendToplatform({
    embeds: [{
      title: '📚 새 강의가 등록됐습니다',
      color: 0x4F46E5,
      fields: [
        { name: '강의명',   value: title,                                    inline: false },
        { name: '코치',     value: coachNickname,                            inline: true  },
        { name: '게임',     value: game || '미설정',                         inline: true  },
        { name: '가격',     value: `${Number(price).toLocaleString()}원`,    inline: true  },
        { name: '팔로워',   value: `${followerCount || 0}명`,                inline: true  },
      ],
      timestamp: new Date().toISOString(),
    }],
  })
}

export const notifyEnrollment = async ({ studentNickname, lectureTitle, price }) => {
  await sendToplatform({
    embeds: [{
      title: '💳 결제가 완료됐습니다',
      color: 0x22C55E,
      fields: [
        { name: '수강생', value: studentNickname,                         inline: true },
        { name: '강의',   value: lectureTitle,                           inline: true },
        { name: '금액',   value: `${Number(price).toLocaleString()}원`,  inline: true },
      ],
      timestamp: new Date().toISOString(),
    }],
  })
}

export const notifyNewUser = async ({ nickname, role, game }) => {
  await sendToplatform({
    embeds: [{
      title: '👤 새 회원이 가입했습니다',
      color: role === 'coach' ? 0xF59E0B : 0x10B981,
      fields: [
        { name: '닉네임', value: nickname,                                   inline: true },
        { name: '역할',   value: role === 'coach' ? '코치' : '학생',          inline: true },
        { name: '게임',   value: game || '미설정',                            inline: true },
      ],
      timestamp: new Date().toISOString(),
    }],
  })
}

export const notifyServerStart = async (port) => {
  await sendToplatform({
    embeds: [{
      title: '🚀 GCP 서버가 시작됐습니다',
      color: 0x4F46E5,
      fields: [
        { name: 'PORT', value: String(port),                       inline: true },
        { name: '시간', value: new Date().toLocaleString('ko-KR'), inline: true },
      ],
    }],
  })
}
