const express = require('express');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/* ===================== MILI-MARKET (Sàn thanh lý) ===================== */

// GET /api/community/market - Danh sách bài thanh lý (mặc định: còn hàng)
router.get('/market', requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `SELECT m.*, u.full_name, u.room_number AS seller_room
                  FROM market_listings m JOIN users u ON u.id = m.user_id WHERE 1=1`;
    const params = [];
    if (status) { params.push(status); query += ` AND m.status = $${params.length}`; }
    query += ' ORDER BY m.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi tải sàn thanh lý.' });
  }
});

// POST /api/community/market - Đăng bài thanh lý
router.post('/market', requireAuth, async (req, res) => {
  try {
    const { title, description, price, image_data, contact } = req.body;
    if (!title) return res.status(400).json({ error: 'Vui lòng nhập tên đồ cần thanh lý.' });
    if (!contact || !/^[0-9]{10}$/.test(contact)) {
      return res.status(400).json({ error: 'Vui lòng nhập số điện thoại liên hệ gồm đúng 10 số.' });
    }
    const result = await pool.query(
      `INSERT INTO market_listings (user_id, title, description, price, image_data, contact)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, title, description || null, price || 0, image_data || null, contact || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi đăng bài.' });
  }
});

// PUT /api/community/market/:id/status - Đổi trạng thái (đã bán / còn hàng) - chỉ chủ bài
router.put('/market/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body; // 'available' | 'sold'
    if (!['available', 'sold'].includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
    }
    const check = await pool.query('SELECT user_id FROM market_listings WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy bài đăng.' });
    if (check.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bạn không có quyền sửa bài này.' });
    }
    const result = await pool.query(
      'UPDATE market_listings SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi cập nhật.' });
  }
});

// DELETE /api/community/market/:id - Xoá bài đăng - chỉ chủ bài hoặc admin
router.delete('/market/:id', requireAuth, async (req, res) => {
  try {
    const check = await pool.query('SELECT user_id FROM market_listings WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy bài đăng.' });
    if (check.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bạn không có quyền xoá bài này.' });
    }
    await pool.query('DELETE FROM market_listings WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi xoá.' });
  }
});

/* ===================== LOST & FOUND ===================== */

// GET /api/community/lost-found - Danh sách đồ thất lạc / nhặt được
router.get('/lost-found', requireAuth, async (req, res) => {
  try {
    const { item_type, status } = req.query;
    let query = `SELECT l.*, u.full_name, u.phone AS contact_phone
                  FROM lost_found l JOIN users u ON u.id = l.user_id WHERE 1=1`;
    const params = [];
    if (item_type) { params.push(item_type); query += ` AND l.item_type = $${params.length}`; }
    if (status) { params.push(status); query += ` AND l.status = $${params.length}`; }
    query += ' ORDER BY l.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi tải danh sách đồ thất lạc.' });
  }
});

// POST /api/community/lost-found - Đăng tin tìm/nhặt được đồ
router.post('/lost-found', requireAuth, async (req, res) => {
  try {
    const { item_type, item_name, description, image_data, room_number } = req.body;
    if (!['lost', 'found'].includes(item_type)) {
      return res.status(400).json({ error: 'Loại tin phải là "lost" hoặc "found".' });
    }
    if (!item_name) return res.status(400).json({ error: 'Vui lòng nhập tên đồ vật.' });

    const result = await pool.query(
      `INSERT INTO lost_found (user_id, item_type, item_name, description, image_data, room_number)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, item_type, item_name, description || null, image_data || null, room_number || req.user.room_number]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi đăng tin.' });
  }
});

// PUT /api/community/lost-found/:id/resolve - Đánh dấu đã tìm thấy / đã trả
router.put('/lost-found/:id/resolve', requireAuth, async (req, res) => {
  try {
    const check = await pool.query('SELECT user_id FROM lost_found WHERE id = $1', [req.params.id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy tin.' });
    if (check.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Bạn không có quyền sửa tin này.' });
    }
    const result = await pool.query(
      "UPDATE lost_found SET status = 'resolved' WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi cập nhật.' });
  }
});

module.exports = router;
