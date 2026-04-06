USE game_coaching_platform;

-- 커뮤니티 게시글
CREATE TABLE IF NOT EXISTS posts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  category   ENUM('question', 'tip') NOT NULL DEFAULT 'question',
  title      VARCHAR(255) NOT NULL,
  content    TEXT NOT NULL,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 커뮤니티 댓글
CREATE TABLE IF NOT EXISTS post_comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT NOT NULL,
  user_id    INT NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
