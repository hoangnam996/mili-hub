const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/support/reports - Danh sách báo cáo hỏng hóc
// Sinh viên: chỉ thấy báo cáo của mình. Admin (Ban quản lý): thấy tất cả.
router.get('/reports', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let query, params;

    if (req.user.role === 'admin') {
      query = `SELECT r.*, u.full_name, u.username
               FROM sos_reports r JOIN users u ON u.id = r.user_id WHERE 1=1`;
      params = [];
      if (status) { params.push(status); query += ` AND r.status = $${params.length}`; }
      query += ' ORDER BY r.created_at DESC';
    } else {
      query = 'SELECT * FROM sos_reports WHERE user_id = $1 ORDER BY created_at DESC';
      params = [req.user.id];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi tải danh sách báo cáo.' });
  }
});

// POST /api/support/reports - Sinh viên gửi báo cáo hỏng hóc (1-Click S.O.S)
router.post('/reports', requireAuth, async (req, res) => {
  try {
    const { device, description, image_data, room_number } = req.body;
    if (!device) {
      return res.status(400).json({ error: 'Vui lòng cho biết thiết bị bị hỏng.' });
    }
    const room = room_number || req.user.room_number;
    if (!room) {
      return res.status(400).json({ error: 'Tài khoản chưa có số phòng. Vui lòng cập nhật hồ sơ.' });
    }

    const result = await pool.query(
      `INSERT INTO sos_reports (user_id, room_number, device, description, image_data)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.user.id, room, device, description || null, image_data || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi gửi báo cáo.' });
  }
});

// PUT /api/support/reports/:id/complete - Ban quản lý đánh dấu hoàn thành
router.put('/reports/:id/complete', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE sos_reports SET status = 'completed', completed_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy báo cáo.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi cập nhật.' });
  }
});

module.exports = router;
