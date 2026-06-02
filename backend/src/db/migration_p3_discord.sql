-- 유저 디스코드 Webhook URL 컬럼 추가
ALTER TABLE users ADD COLUMN discord_webhook_url VARCHAR(500) DEFAULT NULL;
