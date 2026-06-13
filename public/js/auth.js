// Nếu đã đăng nhập rồi -> chuyển thẳng vào dashboard
if (MH.isLoggedIn()) {
  window.location.href = '/dashboard.html';
}

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const alertBox = document.getElementById('alert-box');

function showAlert(message, type = 'error') {
  alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}
function clearAlert() { alertBox.innerHTML = ''; }

tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  formLogin.classList.remove('hidden');
  formRegister.classList.add('hidden');
  clearAlert();
});

tabRegister.addEventListener('click', () => {
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  formRegister.classList.remove('hidden');
  formLogin.classList.add('hidden');
  clearAlert();
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
