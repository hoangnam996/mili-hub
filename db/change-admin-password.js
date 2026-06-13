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
      console.log(Không tìm thấy tài khoản '${username}'.);
    } else {
      console.log(Đã đổi mật khẩu cho '${username}' thành công.);
    }
  } catch (err) {
    console.error('Lỗi:', err);
  } finally {
    await pool.end();
  }
}
changePassword();
