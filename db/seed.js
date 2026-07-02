// Script khởi tạo database: tạo bảng + tài khoản admin mẫu + dữ liệu mẫu
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seed() {
  try {
    console.log('Đang tạo các bảng dữ liệu...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✔ Đã tạo bảng xong.');

    // Tạo tài khoản admin mẫu nếu chưa có
    const adminCheck = await pool.query("SELECT id FROM users WHERE username = 'admin'");
    if (adminCheck.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query(
        `INSERT INTO users (username, password_hash, full_name, role, company, platoon, room_number, phone)
         VALUES ('admin', $1, 'Ban Quản Lý KTX', 'admin', NULL, NULL, NULL, '0900000000')`,
        [hash]
      );
      console.log('✔ Đã tạo tài khoản admin mẫu -> username: admin / password: admin123');
    } else {
      console.log('- Tài khoản admin đã tồn tại, bỏ qua.');
    }

    // Tạo tài khoản demo cho giáo viên/khách xem nhanh (không cần đăng ký)
    const demoStudentCheck = await pool.query("SELECT id FROM users WHERE username = 'demo_student'");
    if (demoStudentCheck.rows.length === 0) {
      const demoHash = await bcrypt.hash('demo123', 10);
      await pool.query(
        `INSERT INTO users (username, password_hash, full_name, role, company, platoon, room_number, phone)
         VALUES ('demo_student', $1, 'Sinh Viên Demo', 'student', '1', '75DCTT21', 'A1-204', '0900000001')`,
        [demoHash]
      );
      console.log('✔ Đã tạo tài khoản demo sinh viên -> username: demo_student / password: demo123');
    } else {
      console.log('- Tài khoản demo_student đã tồn tại, bỏ qua.');
    }

    const demoAdminCheck = await pool.query("SELECT id FROM users WHERE username = 'demo_admin'");
    if (demoAdminCheck.rows.length === 0) {
      const demoAdminHash = await bcrypt.hash('demo123', 10);
      await pool.query(
        `INSERT INTO users (username, password_hash, full_name, role, company, platoon, room_number, phone)
         VALUES ('demo_admin', $1, 'Ban Quản Lý KTX', 'admin', NULL, NULL, NULL, '0900000002')`,
        [demoAdminHash]
      );
      console.log('✔ Đã tạo tài khoản demo ban quản lý -> username: demo_admin / password: demo123');
    } else {
      console.log('- Tài khoản demo_admin đã tồn tại, bỏ qua.');
    }

    // Thêm vài thông tin Ban chỉ huy mẫu nếu bảng officers còn rỗng
    const officerCheck = await pool.query('SELECT id FROM officers');
    if (officerCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO officers (full_name, position, phone, company, platoon, building, note) VALUES
        ('Thầy Nguyễn Văn A', 'Đại đội trưởng', '0901111111', 'Đại đội 1', NULL, 'Nhà A1', 'Phụ trách chung Đại đội 1'),
        ('Cô Trần Thị B', 'Chính trị viên', '0902222222', 'Đại đội 1', 'Trung đội 1', 'Nhà A1', 'Liên hệ khi cần hỗ trợ tâm lý, đời sống'),
        ('Thầy Lê Văn C', 'Đại đội trưởng', '0903333333', 'Đại đội 2', NULL, 'Nhà A2', 'Phụ trách chung Đại đội 2')
      `);
      console.log('✔ Đã thêm dữ liệu danh bạ Ban chỉ huy mẫu.');
    }

    console.log('\nHoàn tất khởi tạo cơ sở dữ liệu MILI-HUB.');
    process.exit(0);
  } catch (err) {
    console.error('Lỗi khi khởi tạo database:', err);
    process.exit(1);
  }
}

seed();
