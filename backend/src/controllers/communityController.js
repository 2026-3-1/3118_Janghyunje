import pool from '../db/index.js'

// GET /api/posts?category=&keyword=&page=
export const getPosts = async (req, res, next) => {
  try {
    const { category, keyword, page = 1 } = req.query
    const limit = 15
    const offset = (page - 1) * limit
    const conditions = []
    const params = []

    if (category) { conditions.push('p.category = ?'); params.push(category) }
    if (keyword)  { conditions.push('(p.title LIKE ? OR p.content LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`) }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM posts p ${where}`, params
    )
    const [rows] = await pool.query(
      `SELECT p.*, u.nickname, u.role,
              (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) AS comment_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )
    res.json({ success: true, data: rows, total, page: Number(page), totalPages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
}

// GET /api/posts/:id
export const getPostById = async (req, res, next) => {
  try {
    await pool.query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [req.params.id])
    const [[post]] = await pool.query(
      `SELECT p.*, u.nickname, u.role
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [req.params.id]
    )
    if (!post) return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' })

    const [comments] = await pool.query(
      `SELECT pc.*, u.nickname, u.role
       FROM post_comments pc JOIN users u ON pc.user_id = u.id
       WHERE pc.post_id = ?
       ORDER BY pc.created_at ASC`,
      [req.params.id]
    )
    res.json({ success: true, data: { ...post, comments } })
  } catch (err) { next(err) }
}

// POST /api/posts — P2: user_id를 JWT(req.user.id)에서 추출
export const createPost = async (req, res, next) => {
  try {
    const { category, title, content } = req.body
    const user_id = req.user.id  // JWT에서 추출

    if (!title || !content)
      return res.status(400).json({ success: false, message: '필수 항목이 누락됐습니다.' })

    const [result] = await pool.query(
      'INSERT INTO posts (user_id, category, title, content) VALUES (?, ?, ?, ?)',
      [user_id, category || 'question', title, content]
    )
    res.status(201).json({ success: true, data: { id: result.insertId } })
  } catch (err) { next(err) }
}

// PUT /api/posts/:id — 본인 게시글만 수정 가능
export const updatePost = async (req, res, next) => {
  try {
    const [posts] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [req.params.id])
    if (!posts.length)
      return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' })
    if (posts[0].user_id !== req.user.id)
      return res.status(403).json({ success: false, message: '본인 게시글만 수정할 수 있습니다.' })

    const { title, content, category } = req.body
    await pool.query(
      'UPDATE posts SET title = ?, content = ?, category = ? WHERE id = ?',
      [title, content, category, req.params.id]
    )
    res.json({ success: true })
  } catch (err) { next(err) }
}

// DELETE /api/posts/:id — 본인 게시글만 삭제 가능
export const deletePost = async (req, res, next) => {
  try {
    const [posts] = await pool.query('SELECT user_id FROM posts WHERE id = ?', [req.params.id])
    if (!posts.length)
      return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' })
    if (posts[0].user_id !== req.user.id)
      return res.status(403).json({ success: false, message: '본인 게시글만 삭제할 수 있습니다.' })

    await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) { next(err) }
}

// POST /api/posts/:id/comments — P2: user_id를 JWT(req.user.id)에서 추출
export const createPostComment = async (req, res, next) => {
  try {
    const { content } = req.body
    const user_id = req.user.id  // JWT에서 추출

    if (!content)
      return res.status(400).json({ success: false, message: '내용을 입력해주세요.' })

    const [result] = await pool.query(
      'INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.id, user_id, content]
    )
    res.status(201).json({ success: true, data: { id: result.insertId } })
  } catch (err) { next(err) }
}

// DELETE /api/post-comments/:id — 본인 댓글만 삭제 가능
export const deletePostComment = async (req, res, next) => {
  try {
    const [comments] = await pool.query('SELECT user_id FROM post_comments WHERE id = ?', [req.params.id])
    if (!comments.length)
      return res.status(404).json({ success: false, message: '댓글을 찾을 수 없습니다.' })
    if (comments[0].user_id !== req.user.id)
      return res.status(403).json({ success: false, message: '본인 댓글만 삭제할 수 있습니다.' })

    await pool.query('DELETE FROM post_comments WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) { next(err) }
}
