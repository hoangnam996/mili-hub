require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function changePassword() {
  const username = process.argv[2];
  const newPassword = process.argv[3];
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id, username',
      [hash, username]
    );
    if (result.rows.length === 0) {
      console.log('Khong tim thay tai khoan: ' + username);
    } else {
      console.log('Da doi mat khau cho tai khoan ' + username + ' thanh cong.');
    }
  } catch (err) {
    console.error('Loi:', err);
  } finally {
    await pool.end();
  }
}
changePassword();
