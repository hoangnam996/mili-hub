MH.requireAuth();
MH.renderNav('dashboard');

const user = MH.getUser();
if (user) {
  document.getElementById('welcome-title').textContent = `Chào mừng, ${user.full_name}`;
}

// ===== Cập nhật hồ sơ cá nhân =====
const profileForm = document.getElementById('profile-form');
const profileAlert = document.getElementById('profile-alert');

function showProfileAlert(message, type = 'error') {
  profileAlert.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

(async () => {
  try {
    const me = await MH.api('/auth/me');
    document.getElementById('pf-room').value = me.room_number || '';
    document.getElementById('pf-phone').value = me.phone || '';
    document.getElementById('pf-company').value = me.company || '';
    document.getElementById('pf-platoon').value = me.platoon || '';
  } catch (err) {
    console.error(err);
  }
})();

profileForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    room_number: document.getElementById('pf-room').value.trim(),
    phone: document.getElementById('pf-phone').value.trim(),
    company: document.getElementById('pf-company').value.trim(),
    platoon: document.getElementById('pf-platoon').value.trim(),
  };

  const submitBtn = profileForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    await MH.api('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) });
    showProfileAlert('Đã lưu thay đổi. Đang đăng nhập lại để áp dụng thông tin mới...', 'success');
    setTimeout(() => {
      MH.clearSession();
      window.location.href = '/index.html';
    }, 1500);
  } catch (err) {
    showProfileAlert(err.message);
  } finally {
    submitBtn.disabled = false;
  }
});
