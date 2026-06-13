const { Pool } = require('pg');

// Render cung cấp biến DATABASE_URL khi bạn tạo PostgreSQL database.
// Khi chạy trên Render, kết nối cần SSL nên ta bật ssl: { rejectUnauthorized: false }
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')
    ? { rejectUnauthorized: false }
    : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false)
});

pool.on('error', (err) => {
  console.error('Lỗi không mong muốn từ PostgreSQL pool:', err);
});

module.exports = pool;
