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

app.use(express.json({ limit: '12mb' }));
app.use(cors());

app.use('/api/auth', authRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/operation', operationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', message: err.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Đã xảy ra lỗi không mong muốn trên server.' });
});

app.listen(PORT, () => {
  console.log(`MILI-HUB server đang chạy tại cổng ${PORT}`);
});
