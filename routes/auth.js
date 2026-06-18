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

    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, role, company, platoon, room_number, phone)
       VALUES ($1, $2, $3, 'student', $4, $5, $6, $7)
       RETURNING id, username, full_name, role, company, platoon, room_number, phone`,
      [username, hash, full_name, company || null, platoon || null, room_number || null, phone || null]
    );

    const user = result.rows[0];
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

// POST /api/auth/forgot-password - Quên mật khẩu: xác minh username + SĐT rồi đặt mật khẩu mới
router.post('/forgot-password', async (req, res) => {
  try {
    const { username, phone, new_password } = req.body;

    if (!username || !phone || !new_password) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tên đăng nhập, số điện thoại và mật khẩu mới.' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    }

    const result = await pool.query(
      'SELECT id, phone FROM users WHERE username = $1',
      [username.trim()]
    );

    const genericError = 'Tên đăng nhập hoặc số điện thoại không khớp với hồ sơ đã đăng ký.';

    if (result.rows.length === 0) {
      return res.status(400).json({ error: genericError });
    }

    const user = result.rows[0];
    const storedPhone = (user.phone || '').trim();
    const inputPhone = phone.trim();

    if (!storedPhone || storedPhone !== inputPhone) {
      return res.status(400).json({ error: genericError });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id]);

    res.json({ success: true, message: 'Đã đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi đặt lại mật khẩu.' });
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

module.exports = router;
