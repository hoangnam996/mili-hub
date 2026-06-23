const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/wiki/officers - Lấy danh bạ Ban chỉ huy (có thể lọc theo đại đội)
router.get('/officers', requireAuth, async (req, res) => {
  try {
    const { company } = req.query;
    let result;
    if (company) {
      result = await pool.query(
        'SELECT * FROM officers WHERE company ILIKE $1 ORDER BY company, platoon, full_name',
        [`%${company}%`]
      );
    } else {
      result = await pool.query('SELECT * FROM officers ORDER BY company, platoon, full_name');
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi tải danh bạ.' });
  }
});

// POST /api/wiki/officers - Thêm thông tin thầy/cô (chỉ admin)
router.post('/officers', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { full_name, position, phone, company, platoon, building, note } = req.body;
    if (!full_name || !position) {
      return res.status(400).json({ error: 'Vui lòng nhập họ tên và chức vụ.' });
    }
    const result = await pool.query(
      `INSERT INTO officers (full_name, position, phone, company, platoon, building, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [full_name, position, phone || null, company || null, platoon || null, building || null, note || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi thêm thông tin.' });
  }
});

// PUT /api/wiki/officers/:id - Sửa thông tin (chỉ admin)
router.put('/officers/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { full_name, position, phone, company, platoon, building, note } = req.body;
    if (!full_name || !position) {
      return res.status(400).json({ error: 'Vui lòng nhập họ tên và chức vụ.' });
    }
    const result = await pool.query(
      `UPDATE officers SET full_name=$1, position=$2, phone=$3, company=$4, platoon=$5, building=$6, note=$7
       WHERE id=$8 RETURNING *`,
      [full_name, position, phone || null, company || null, platoon || null, building || null, note || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy cán bộ cần sửa.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi sửa thông tin.' });
  }
});

// DELETE /api/wiki/officers/:id - Xoá thông tin (chỉ admin)
router.delete('/officers/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM officers WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy cán bộ cần xoá.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi xoá.' });
  }
});

module.exports = router;
