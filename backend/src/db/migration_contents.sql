USE game_coaching_platform;

-- 강의 콘텐츠 (영상/자료)
CREATE TABLE IF NOT EXISTS lecture_contents (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  lecture_id  INT NOT NULL,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  type        ENUM('video', 'material') NOT NULL DEFAULT 'video',
  url         VARCHAR(500) NOT NULL,
  order_num   INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- 댓글
CREATE TABLE IF NOT EXISTS comments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  content_id  INT NOT NULL,
  user_id     INT NOT NULL,
  comment     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (content_id) REFERENCES lecture_contents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE
);
