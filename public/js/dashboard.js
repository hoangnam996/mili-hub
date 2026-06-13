MH.requireAuth();
MH.renderNav('dashboard');

const user = MH.getUser();
if (user) {
  document.getElementById('welcome-title').textContent = `Chào mừng, ${user.full_name}`;
}
