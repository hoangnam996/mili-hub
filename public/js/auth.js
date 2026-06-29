if (MH.isLoggedIn()) {
  window.location.href = '/dashboard.html';
}

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const formForgot = document.getElementById('form-forgot');
const linkForgotPassword = document.getElementById('link-forgot-password');
const linkBackToLogin = document.getElementById('link-back-to-login');
const alertBox = document.getElementById('alert-box');

function showAlert(message, type = 'error') {
  alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}
function clearAlert() { alertBox.innerHTML = ''; }

function showForm(target) {
  const forms = { login: formLogin, register: formRegister, forgot: formForgot };
  Object.entries(forms).forEach(([key, form]) => {
    form.classList.toggle('hidden', key !== target);
  });
  tabLogin.classList.toggle('active', target !== 'register');
  tabRegister.classList.toggle('active', target === 'register');
  clearAlert();
}

tabLogin.addEventListener('click', () => showForm('login'));
tabRegister.addEventListener('click', () => showForm('register'));
linkForgotPassword.addEventListener('click', (e) => {
  e.preventDefault();
  showForm('forgot');
});
linkBackToLogin.addEventListener('click', (e) => {
  e.preventDefault();
  showForm('login');
});

formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const submitBtn = formLogin.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    const data = await MH.api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    MH.setSession(data.token, data.user);
    window.location.href = '/dashboard.html';
  } catch (err) {
    showAlert(err.message);
  } finally {
    submitBtn.disabled = false;
  }
});

formRegister.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();
  const payload = {
    full_name: document.getElementById('reg-fullname').value.trim(),
    username: document.getElementById('reg-username').value.trim(),
    password: document.getElementById('reg-password').value,
    company: document.getElementById('reg-company').value.trim(),
    platoon: document.getElementById('reg-platoon').value.trim(),
    room_number: document.getElementById('reg-room').value.trim(),
    phone: document.getElementById('reg-phone').value.trim(),
  };
  const submitBtn = formRegister.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    const data = await MH.api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    MH.setSession(data.token, data.user);
    window.location.href = '/dashboard.html';
  } catch (err) {
    showAlert(err.message);
  } finally {
    submitBtn.disabled = false;
  }
});

formForgot.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAlert();
  const username = document.getElementById('forgot-username').value.trim();
  const phone = document.getElementById('forgot-phone').value.trim();
  const newPassword = document.getElementById('forgot-new-password').value;
  const confirmPassword = document.getElementById('forgot-confirm-password').value;

  if (newPassword !== confirmPassword) {
    showAlert('Mật khẩu mới và mật khẩu nhập lại không khớp.');
    return;
  }
  if (newPassword.length < 6) {
    showAlert('Mật khẩu mới phải có ít nhất 6 ký tự.');
    return;
  }

  const submitBtn = formForgot.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    const data = await MH.api('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ username, phone, new_password: newPassword })
    });
    formForgot.reset();
    showForm('login');
    showAlert(data.message || 'Đã đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.', 'success');
  } catch (err) {
    showAlert(err.message);
  } finally {
    submitBtn.disabled = false;
  }
});

// ===== Đăng nhập demo (cho giáo viên/khách xem nhanh) =====
const btnDemoStudent = document.getElementById('btn-demo-student');
const btnDemoAdmin = document.getElementById('btn-demo-admin');

async function loginDemo(username, password) {
  clearAlert();
  try {
    const data = await MH.api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    MH.setSession(data.token, data.user);
    window.location.href = '/dashboard.html';
  } catch (err) {
    showAlert(err.message);
  }
}

if (btnDemoStudent) btnDemoStudent.addEventListener('click', () => loginDemo('demo_student', 'demo123'));
if (btnDemoAdmin) btnDemoAdmin.addEventListener('click', () => loginDemo('demo_admin', 'demo123'));
