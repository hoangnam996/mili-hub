-- ============================================
-- MILI-HUB Database Schema
-- ============================================

-- Bảng người dùng (sinh viên + ban quản lý/admin)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student', -- 'student' | 'admin'
    company VARCHAR(50),       -- Đại đội
    platoon VARCHAR(50),       -- Trung đội
    room_number VARCHAR(20),
    phone VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Phân hệ 1: Military Wiki - Danh bạ Ban chỉ huy
CREATE TABLE IF NOT EXISTS officers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,   -- Chức vụ
    phone VARCHAR(20),
    company VARCHAR(50),              -- Đại đội phụ trách
    platoon VARCHAR(50),              -- Trung đội phụ trách
    building VARCHAR(50),             -- Khu nhà
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Phân hệ 2: Mili-Operation - Lịch trực
CREATE TABLE IF NOT EXISTS duty_schedules (
    id SERIAL PRIMARY KEY,
    duty_date DATE NOT NULL,
    duty_type VARCHAR(30) NOT NULL,   -- 'truc_com' | 'gac_dem' | 'khac'
    room_number VARCHAR(20) NOT NULL,
    assignee_names TEXT,              -- danh sách tên người trực (text tự do)
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Phân hệ 2: Mili-Operation - Chấm điểm nội vụ (Anti-Fake Timestamp)
CREATE TABLE IF NOT EXISTS inspections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_number VARCHAR(20) NOT NULL,
    image_data TEXT NOT NULL,         -- base64 ảnh chụp
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    captured_at TIMESTAMP NOT NULL DEFAULT NOW(), -- dấu thời gian server (không thể chỉnh sửa)
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'scored'
    score INTEGER,
    scored_by INTEGER REFERENCES users(id),
    scored_at TIMESTAMP
);

-- Phân hệ 3: Mili-Support - Báo cáo hỏng hóc (SOS Room)
CREATE TABLE IF NOT EXISTS sos_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_number VARCHAR(20) NOT NULL,
    device VARCHAR(100) NOT NULL,     -- Thiết bị bị hỏng
    description TEXT,
    image_data TEXT,                  -- base64 ảnh (tuỳ chọn)
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'completed'
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Phân hệ 4: Mili-Community - Sàn thanh lý (Mili-Market)
CREATE TABLE IF NOT EXISTS market_listings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(12, 0) DEFAULT 0,
    image_data TEXT,
    contact VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'available', -- 'available' | 'sold'
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Phân hệ 4: Mili-Community - Hộp tìm đồ thất lạc (Lost & Found)
CREATE TABLE IF NOT EXISTS lost_found (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type VARCHAR(10) NOT NULL,   -- 'lost' | 'found'
    item_name VARCHAR(150) NOT NULL,
    description TEXT,
    image_data TEXT,
    room_number VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open' | 'resolved'
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tài khoản admin mẫu (mật khẩu: admin123 -> được tạo qua seed.js, không insert thẳng hash ở đây)
