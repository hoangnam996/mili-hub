require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const wikiRoutes = require('./routes/wiki');
const operationRoutes = require('./routes/operation');
const supportRoutes = require('./routes/support');
const communityRoutes = require('./routes/community');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

// Whitelist origin được phép gọi API (chặn CSRF / cross-origin data theft từ site lạ)
const allowedOrigins = ['https://mili-hub.onrender.com'];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000');
}

app.use(cors({
  origin(origin, callback) {
    // Không có Origin (gọi từ curl/Postman/server-to-server) -> cho qua
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('CORS: Origin không được phép truy cập.'));
  }
}));

// Cho phép nhận JSON body lớn (vì có ảnh base64)
app.use(express.json({ limit: '12mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/operation', operationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/stats', statsRoutes);

// Health check (Render dùng để kiểm tra service còn sống)
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', message: err.message });
  }
});

// Phục vụ frontend tĩnh
app.use(express.static(path.join(__dirname, 'public')));

// Fallback: mọi route không khớp -> trả về index.html (SPA-style routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler chung
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Đã xảy ra lỗi không mong muốn trên server.' });
});

app.listen(PORT, () => {
  console.log(`MILI-HUB server đang chạy tại cổng ${PORT}`);
});
