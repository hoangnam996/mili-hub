const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register - Đăng ký tài khoản sinh viên mới
router.post('/register', async (req, res) => {
  try {
    const { username, password, full_name, company, platoon, room_number, phone } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu và họ tên.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }
    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Vui lòng nhập số điện thoại gồm đúng 10 số.' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role, company, platoon, room_number, phone)
       VALUES ($1, $2, $3, 'student', $4, $5, $6, $7)
       RETURNING id, username, full_name, role, company, platoon, room_number, phone`,
      [username, hash, full_name, company || null, platoon || null, room_number || null, phone]
    );

    const user = result.rows[0];

    // Ghi nhận lượt truy cập đầu tiên (đăng ký = bắt đầu 1 phiên đăng nhập)
    await pool.query('INSERT INTO login_sessions (user_id) VALUES ($1)', [user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, full_name: user.full_name, role: user.role, room_number: user.room_number, company: user.company, platoon: user.platoon },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi đăng ký.' });
  }
});

// POST /api/auth/login - Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
    }

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }

    // Ghi nhận lượt đăng nhập mới (phục vụ thống kê truy cập)
    await pool.query('INSERT INTO login_sessions (user_id) VALUES ($1)', [user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, full_name: user.full_name, role: user.role, room_number: user.room_number, company: user.company, platoon: user.platoon },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete user.password_hash;
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập.' });
  }
});

// GET /api/auth/me - Lấy thông tin người dùng hiện tại
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, full_name, role, company, platoon, room_number, phone FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server.' });
  }
});

// PUT /api/auth/profile - Cập nhật hồ sơ cá nhân (số phòng, SĐT, đại đội, trung đội)
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { room_number, phone, company, platoon } = req.body;

    if (phone && !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Số điện thoại phải gồm đúng 10 số.' });
    }

    const result = await pool.query(
      `UPDATE users SET
         room_number = COALESCE($1, room_number),
         phone = COALESCE($2, phone),
         company = COALESCE($3, company),
         platoon = COALESCE($4, platoon)
       WHERE id = $5
       RETURNING id, username, full_name, role, company, platoon, room_number, phone`,
      [room_number || null, phone || null, company || null, platoon || null, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }

    res.json({
      user: result.rows[0],
      message: 'Cập nhật hồ sơ thành công. Vui lòng đăng nhập lại để áp dụng đầy đủ thông tin mới.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi cập nhật hồ sơ.' });
  }
});

module.exports = router;
