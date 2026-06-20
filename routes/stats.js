const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// GET /api/stats/overview - Thống kê truy cập tổng quan (chỉ admin)
router.get('/overview', requireAuth, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const totalSessions = await pool.query('SELECT COUNT(*) FROM login_sessions');
    const sessionsToday = await pool.query(
      `SELECT COUNT(*) FROM login_sessions WHERE login_at::date = CURRENT_DATE`
    );
    const avgDuration = await pool.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (last_activity_at - login_at))) AS avg_seconds FROM login_sessions`
    );
    const activeNow = await pool.query(
      `SELECT COUNT(*) FROM login_sessions WHERE last_activity_at > NOW() - INTERVAL '5 minutes'`
    );

    const avgSeconds = Number(avgDuration.rows[0].avg_seconds) || 0;

    res.json({
      total_users: Number(totalUsers.rows[0].count),
      total_sessions: Number(totalSessions.rows[0].count),
      sessions_today: Number(sessionsToday.rows[0].count),
      avg_session_minutes: Math.round((avgSeconds / 60) * 10) / 10,
      active_last_5_minutes: Number(activeNow.rows[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server khi tải thống kê.' });
  }
});

module.exports = router;
