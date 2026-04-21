-- P2 Migration: cart / progress / growth_reports

-- 1. Cart
CREATE TABLE IF NOT EXISTS cart_items (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  user_id    INT NOT NULL,
  lecture_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_cart (user_id, lecture_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
);

-- 2. Video progress (resume playback)
CREATE TABLE IF NOT EXISTS content_progress (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  user_id      INT NOT NULL,
  content_id   INT NOT NULL,
  lecture_id   INT NOT NULL,
  watched_sec  INT DEFAULT 0,
  duration_sec INT DEFAULT 0,
  completed    TINYINT(1) DEFAULT 0,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_progress (user_id, content_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)            ON DELETE CASCADE,
  FOREIGN KEY (content_id) REFERENCES lecture_contents(id) ON DELETE CASCADE,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id)         ON DELETE CASCADE
);

-- 3. Growth reports (written by coach, read by student)
CREATE TABLE IF NOT EXISTS growth_reports (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  lecture_id  INT NOT NULL,
  student_id  INT NOT NULL,
  coach_id    INT NOT NULL,
  title       VARCHAR(200) NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (coach_id)   REFERENCES users(id)    ON DELETE CASCADE
);
