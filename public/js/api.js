/* =====================================================================
   MILI-HUB — api.js
   Helper chung: gọi API kèm token, lưu/đọc thông tin đăng nhập,
   render thanh điều hướng dùng chung cho mọi trang.
   ===================================================================== */

const MH = {
  TOKEN_KEY: 'milihub_token',
  USER_KEY: 'milihub_user',

  getToken() { return localStorage.getItem(this.TOKEN_KEY); },
  getUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },
  isLoggedIn() { return !!this.getToken(); },
  isAdmin() {
    const u = this.getUser();
    return u && u.role === 'admin';
  },

  // Gọi API kèm Authorization header. Tự động redirect về trang đăng nhập nếu hết hạn.
  async api(path, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api${path}`, Object.assign({}, options, { headers }));

    if (res.status === 401) {
      this.clearSession();
      window.location.href = '/index.html';
      throw new Error('Phiên đăng nhập đã hết hạn.');
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Đã xảy ra lỗi.');
    }
    return data;
  },

  // Bắt buộc đăng nhập mới được xem trang
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '/index.html';
    }
  },

  // Đọc file ảnh thành base64 (dùng cho upload ảnh)
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Định dạng tiền VNĐ
  formatVND(value) {
    const n = Number(value || 0);
    return n.toLocaleString('vi-VN') + ' đ';
  },

  // Định dạng ngày giờ kiểu Việt Nam
  formatDateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  },

  // Vẽ thanh điều hướng dùng chung. `active` = tên trang hiện tại.
  renderNav(active) {
    const user = this.getUser();
    if (!user) return;

    const navEl = document.getElementById('mh-nav');
    if (!navEl) return;

    const links = [
      { key: 'dashboard', href: '/dashboard.html', label: 'Tổng quan' },
      { key: 'wiki', href: '/wiki.html', label: 'Danh bạ' },
      { key: 'operation', href: '/operation.html', label: 'Trực & Nội vụ' },
      { key: 'support', href: '/support.html', label: 'S.O.S Phòng' },
      { key: 'community', href: '/community.html', label: 'Cộng đồng' },
    ];

    navEl.innerHTML = links.map(l =>
      `<a href="${l.href}" class="${l.key === active ? 'active' : ''}">${l.label}</a>`
    ).join('');

    const userChip = document.getElementById('mh-user-chip');
    if (userChip) {
      const roleLabel = user.role === 'admin' ? 'BAN QUẢN LÝ' : `PHÒNG ${user.room_number || '—'}`;
      userChip.innerHTML = `
        <span>${user.full_name}</span>
        <span class="role-pill">${roleLabel}</span>
      `;
    }

    const logoutBtn = document.getElementById('mh-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.clearSession();
        window.location.href = '/index.html';
      });
    }
  }
};
