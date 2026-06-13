const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/* ===================== LỊCH TRỰC ===================== */

// GET /api/operation/schedules - Lấy lịch trực (lọc theo ngày/phòng nếu có)
router.get('/schedules', requireAuth, async (req, res) => {
  try {
    const { date, room_number } = req.query;
    let query = 'SELECT * FROM duty_schedules WHERE 1=1';
    const params = [];
    if (date) { params.push(date); query += ` AND duty_date = $${params.length}`; }
    if (room_number) { params.push(room_number); query += ` AND room_number = $${params.length}`; }
    query += ' ORDER BY duty_date DESC, room_number ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi tải lịch trực.' });
  }
});

// POST /api/operation/schedules - Tạo lịch trực mới (chỉ admin)
router.post('/schedules', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { duty_date, duty_type, room_number, assignee_names, note } = req.body;
    if (!duty_date || !duty_type || !room_number) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ ngày, loại trực và số phòng.' });
    }
    const result = await pool.query(
      `INSERT INTO duty_schedules (duty_date, duty_type, room_number, assignee_names, note)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [duty_date, duty_type, room_number, assignee_names || null, note || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi tạo lịch trực.' });
  }
});

// DELETE /api/operation/schedules/:id - Xoá lịch trực (chỉ admin)
router.delete('/schedules/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM duty_schedules WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi xoá.' });
  }
});

/* ===================== CHẤM ĐIỂM NỘI VỤ ===================== */

// POST /api/operation/inspections - Sinh viên nộp ảnh chấm điểm nội vụ
router.post('/inspections', requireAuth, async (req, res) => {
  try {
    const { image_data, latitude, longitude, room_number } = req.body;
    if (!image_data) {
      return res.status(400).json({ error: 'Vui lòng chụp ảnh kiểm tra nội vụ.' });
    }
    const room = room_number || req.user.room_number;
    if (!room) {
      return res.status(400).json({ error: 'Tài khoản chưa có số phòng. Vui lòng cập nhật hồ sơ.' });
    }

    // captured_at được server tự gán = NOW(), sinh viên không thể chỉnh sửa -> chống fake timestamp
    const result = await pool.query(
      `INSERT INTO inspections (user_id, room_number, image_data, latitude, longitude)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, room_number, latitude, longitude, captured_at, status, score`,
      [req.user.id, room, image_data, latitude || null, longitude || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi nộp ảnh kiểm tra.' });
  }
});

// GET /api/operation/inspections - Danh sách bài chấm điểm
// Sinh viên: chỉ thấy bài của mình. Admin: thấy tất cả (có thể lọc theo status).
router.get('/inspections', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let query, params;

    if (req.user.role === 'admin') {
      query = `SELECT i.*, u.full_name, u.username
               FROM inspections i JOIN users u ON u.id = i.user_id WHERE 1=1`;
      params = [];
      if (status) { params.push(status); query += ` AND i.status = $${params.length}`; }
      query += ' ORDER BY i.captured_at DESC';
    } else {
      query = `SELECT i.id, i.room_number, i.image_data, i.latitude, i.longitude,
                      i.captured_at, i.status, i.score
               FROM inspections i WHERE i.user_id = $1 ORDER BY i.captured_at DESC`;
      params = [req.user.id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi tải danh sách kiểm tra.' });
  }
});

// PUT /api/operation/inspections/:id/score - Admin chấm điểm
router.put('/inspections/:id/score', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { score } = req.body;
    if (score === undefined || score === null || isNaN(Number(score))) {
      return res.status(400).json({ error: 'Vui lòng nhập điểm hợp lệ.' });
    }
    const result = await pool.query(
      `UPDATE inspections SET score = $1, status = 'scored', scored_by = $2, scored_at = NOW()
       WHERE id = $3 RETURNING id, room_number, status, score, scored_at`,
      [Number(score), req.user.id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy bài kiểm tra.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi chấm điểm.' });
  }
});

module.exports = router;
