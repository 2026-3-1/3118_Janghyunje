CREATE DATABASE IF NOT EXISTS game_coaching_platform
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE game_coaching_platform;

-- 유저
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  nickname   VARCHAR(100) NOT NULL,
  role       ENUM('student', 'coach') NOT NULL DEFAULT 'student',
  game       VARCHAR(50),
  tier       VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 강의
CREATE TABLE IF NOT EXISTS lectures (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  coach_id      INT NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  game          VARCHAR(50) NOT NULL,
  price         INT NOT NULL DEFAULT 0,
  original_price INT,
  target_tier   VARCHAR(50),
  position      VARCHAR(50),
  coach_type    VARCHAR(50),
  status        ENUM('active', 'inactive') DEFAULT 'active',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 수강 신청
CREATE TABLE IF NOT EXISTS applications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  lecture_id INT NOT NULL,
  student_id INT NOT NULL,
  status     ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_application (lecture_id, student_id),
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 리뷰
CREATE TABLE IF NOT EXISTS reviews (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  lecture_id INT NOT NULL,
  student_id INT NOT NULL,
  rating     TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_review (lecture_id, student_id),
  FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);
