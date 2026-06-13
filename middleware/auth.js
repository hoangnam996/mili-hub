const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mili-hub-dev-secret-change-me';

// Xác thực người dùng đã đăng nhập (mọi role)
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Thiếu token xác thực. Vui lòng đăng nhập lại.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, username, full_name, role, room_number, company, platoon }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
}

// Chỉ cho phép admin / ban quản lý / ban thi đua
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bạn không có quyền thực hiện hành động này.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, JWT_SECRET };
