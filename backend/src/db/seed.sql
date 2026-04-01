USE game_coaching_platform;

-- ── 유저 (코치 5명 + 학생 10명) ──────────────────────────────────────
-- 비밀번호 모두 'test1234' (bcrypt 해시)
INSERT INTO users (email, password, nickname, role, game, tier) VALUES
('coach1@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uQAfT0W4e', 'GankMaster',   'coach', 'lol',          'grandmaster'),
('coach2@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uQAfT0W4e', 'AimGod_KR',    'coach', 'valorant',     'radiant'),
('coach3@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uQAfT0W4e', 'TankWall',     'coach', 'overwatch2',   'grandmaster'),
('coach4@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uQAfT0W4e', 'MetaReader',   'coach', 'tft',          'master'),
('coach5@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uQAfT0W4e', 'CSKing',       'coach', 'lol',          'diamond'),
('student1@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uQAfT0W4e', '정글러지망생', 'student', 'lol',       'gold'),
('student2@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uQAfT0W4e', '에메랄드도전', 'student', 'lol',       'platinum'),
('student3@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uQAfT0W4e', 'val_newbie',  'student', 'valorant',  'silver'),
('student4@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uQAfT0W4e', 'OW탱커희망',  'student', 'overwatch2', 'gold'),
('student5@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uQAfT0W4e', 'tft고수될거', 'student', 'tft',       'silver'),
('student6@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uQAfT0W4e', '미드장인꿈나무','student','lol',      'silver'),
('student7@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uQAfT0W4e', '배그생존왕',  'student', 'battleground','bronze'),
('student8@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uQAfT0W4e', '발로상위권가자','student','valorant', 'gold'),
('student9@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uQAfT0W4e', '롤원딜지망',  'student', 'lol',       'bronze'),
('student10@test.com','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uQAfT0W4e', '챌린저가즈아','student', 'lol',       'iron');

-- ── 강의 (10개) ──────────────────────────────────────────────────────
-- coach_id: GankMaster=1, AimGod=2, TankWall=3, MetaReader=4, CSKing=5
INSERT INTO lectures (coach_id, title, description, game, price, original_price, target_tier, position, coach_type, status) VALUES
(1, '챌린저 달성까지 정글 로테이션 완벽 정리',
 '현재 시즌 정글 동선과 오브젝트 타이밍을 체계적으로 알려드립니다. 플래티넘~에메랄드 구간 탈출을 목표로 집중 코칭합니다.',
 'lol', 25000, 30000, 'platinum', 'jungle', 'pro', 'active'),

(1, '정글 입문부터 다이아까지 — 시즌 동선 완전 정복',
 '정글을 처음 시작하는 분부터 다이아를 목표로 하는 분까지. 기본 동선부터 응용 플레이까지 단계적으로 알려드립니다.',
 'lol', 20000, NULL, 'silver', 'jungle', 'pro', 'active'),

(2, '발로란트 에임 교정 — 크로스헤어 포지셔닝부터',
 '에임이 좋아도 크로스헤어가 잘못된 위치에 있으면 의미가 없습니다. 기초부터 다시 잡아드립니다.',
 'valorant', 30000, NULL, 'silver', NULL, 'pro', 'active'),

(2, '발로란트 레디언트 코치의 실전 운영 강의',
 '에임보다 운영이 먼저입니다. 맵 리딩, 경제 관리, 팀 전술을 실전 영상과 함께 분석합니다.',
 'valorant', 35000, 40000, 'gold', NULL, 'pro', 'active'),

(3, '오버워치 탱커 포지셔닝 마스터 클래스',
 '탱커로 팀을 이끄는 방법. 공간 창출, 자원 관리, 궁극기 타이밍을 집중 코칭합니다.',
 'overwatch2', 20000, NULL, 'gold', NULL, 'coach', 'active'),

(3, '오버워치 2 힐러 강의 — 생존과 힐 우선순위',
 '힐러는 죽으면 안 됩니다. 생존 포지셔닝과 팀원별 힐 우선순위를 체계적으로 알려드립니다.',
 'overwatch2', 18000, 22000, 'silver', NULL, 'coach', 'active'),

(4, 'TFT 현 메타 덱 완전 분석 — 다이아 최단 루트',
 '이번 패치 최강 덱 TOP5와 증강 선택 우선순위를 정리해드립니다.',
 'tft', 18000, NULL, 'gold', NULL, 'pro', 'active'),

(4, 'TFT 아이템 조합과 배치 전략 핵심 정리',
 '좋은 덱을 가져도 아이템과 배치가 틀리면 집니다. 아이템 우선순위와 최적 배치를 알려드립니다.',
 'tft', 15000, 18000, 'silver', NULL, 'pro', 'active'),

(5, '롤 미드 CS 10분 200 — 웨이브 매니지먼트 완성',
 'CS는 모든 것의 기본입니다. 10분에 200CS 찍는 파밍 패턴과 웨이브 매니지먼트를 알려드립니다.',
 'lol', 20000, NULL, 'silver', 'mid', 'pro', 'active'),

(5, '롤 미드 라이너 킬 압박 — 솔로킬 만드는 법',
 '웨이브 정리 후 어떻게 킬을 만드는지, 상대방을 압박하는 법을 실전 클립과 함께 분석합니다.',
 'lol', 22000, 25000, 'gold', 'mid', 'pro', 'active');

-- ── 수강 신청 (20개) ─────────────────────────────────────────────────
-- student_id: 6~15번 (student1~10)
INSERT INTO applications (lecture_id, student_id, status) VALUES
(1, 6,  'approved'),
(1, 7,  'approved'),
(1, 9,  'pending'),
(1, 14, 'approved'),
(2, 6,  'approved'),
(2, 11, 'pending'),
(2, 15, 'rejected'),
(3, 8,  'approved'),
(3, 13, 'approved'),
(3, 12, 'pending'),
(4, 8,  'approved'),
(4, 13, 'pending'),
(5, 9,  'approved'),
(5, 10, 'approved'),
(6, 10, 'pending'),
(7, 10, 'approved'),
(7, 11, 'approved'),
(8, 11, 'pending'),
(9, 12, 'approved'),
(10, 6, 'pending');

-- ── 리뷰 (15개) ──────────────────────────────────────────────────────
INSERT INTO reviews (lecture_id, student_id, rating, comment) VALUES
(1, 6,  5, '진짜 명강의입니다. 동선 설명이 너무 이해하기 쉽게 되어 있어서 바로 써먹을 수 있었어요. 2주만에 에메랄드 달성했습니다!'),
(1, 7,  5, '수강 후 2주만에 에메랄드 달성했습니다. 정글 동선이 이렇게 중요한지 몰랐어요. 강추!!'),
(1, 14, 4, '설명이 친절하고 핵심을 잘 짚어줍니다. 다음 강의도 들을 예정입니다.'),
(2, 6,  5, '입문자도 이해하기 쉽게 설명해주셔서 좋았어요. 동선 잡는 게 훨씬 편해졌습니다.'),
(3, 8,  5, '크로스헤어 포지셔닝만 고쳤는데 KDA가 확 올랐어요. 강사님이 설명을 진짜 잘 하세요.'),
(3, 13, 5, '발로란트 시작한 지 얼마 안 됐는데 기초를 확실히 잡아준 느낌입니다. 너무 좋아요!'),
(4, 8,  4, '운영 측면에서 많이 배웠습니다. 경제 관리를 이렇게 신경 써야 하는지 몰랐네요.'),
(5, 9,  5, '탱커 포지셔닝이 이렇게 중요한 줄 몰랐어요. 팀원들한테 칭찬받기 시작했습니다.'),
(5, 10, 4, '궁극기 타이밍 설명이 특히 좋았어요. 실전에서 바로 적용할 수 있었습니다.'),
(7, 10, 5, '메타 덱 설명이 정말 상세합니다. 증강 선택 기준을 이렇게 명확히 알려주는 강의는 처음이에요.'),
(7, 11, 5, 'TFT 골드에서 플래티넘으로 올라갔어요! 아이템 우선순위 정리가 특히 도움이 많이 됐습니다.'),
(8, 11, 4, '배치 전략을 이렇게 체계적으로 배운 건 처음이에요. 강의 퀄리티가 높습니다.'),
(9, 12, 5, 'CS 200 목표 달성했습니다!! 웨이브 매니지먼트 개념을 제대로 이해했어요.'),
(10, 6, 4, '솔로킬 만드는 패턴을 배웠는데 실전에서 써먹기 좋네요. 다음 강의도 기대됩니다.'),
(4, 13, 5, '레디언트 코치님의 운영법은 차원이 달랐습니다. 맵 리딩 능력이 많이 늘었어요.');
