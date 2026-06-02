-- P3 마이그레이션
-- 실행: mysql -u root -p game_coaching_platform < backend/src/db/migration_p3.sql

-- 1. users 테이블 admin 역할 + is_active 추가
ALTER TABLE users MODIFY COLUMN role ENUM('student','coach','admin') NOT NULL DEFAULT 'student';
ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE users ADD INDEX idx_role (role);
ALTER TABLE users ADD INDEX idx_is_active (is_active);

-- 2. 강의 인덱스
ALTER TABLE lectures ADD INDEX idx_game (game);
ALTER TABLE lectures ADD INDEX idx_status (status);
ALTER TABLE lectures ADD INDEX idx_price (price);
ALTER TABLE lectures ADD INDEX idx_coach_id_status (coach_id, status);

-- 3. 수강 신청 인덱스
ALTER TABLE applications ADD INDEX idx_student_id (student_id);
ALTER TABLE applications ADD INDEX idx_lecture_status (lecture_id, status);

-- 4. 진도율 인덱스
ALTER TABLE content_progress ADD INDEX idx_user_lecture (user_id, lecture_id);

-- 5. 리뷰 인덱스
ALTER TABLE reviews ADD INDEX idx_lecture_id (lecture_id);

-- 6. Q&A 게시판
CREATE TABLE IF NOT EXISTS qna_posts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  lecture_id INT NOT NULL,
  user_id    INT NOT NULL,
  title      VARCHAR(255) NOT NULL,
  content    TEXT NOT NULL,
  is_solved  TINYINT(1) NOT NULL DEFAULT 0,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS qna_comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT NOT NULL,
  user_id    INT NOT NULL,
  content    TEXT NOT NULL,
  is_answer  TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES qna_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)     ON DELETE CASCADE
);

-- 7. 코치 팔로우
CREATE TABLE IF NOT EXISTS coach_follows (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,             -- 팔로우하는 학생
  coach_id   INT NOT NULL,             -- 팔로우 대상 코치
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_follow (student_id, coach_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (coach_id)   REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE qna_posts    ADD INDEX IF NOT EXISTS idx_lecture_id (lecture_id);
ALTER TABLE qna_posts    ADD INDEX IF NOT EXISTS idx_user_id (user_id);
ALTER TABLE coach_follows ADD INDEX IF NOT EXISTS idx_coach_id (coach_id);
ALTER TABLE coach_follows ADD INDEX IF NOT EXISTS idx_student_id (student_id);
