MH.requireAuth();
MH.renderNav('stats');

(async () => {
  if (!MH.isAdmin()) {
    document.querySelector('.page-main').innerHTML = '<div class="card"><p>Chỉ Ban quản lý mới được xem trang này.</p></div>';
    return;
  }
  try {
    const data = await MH.api('/stats/overview');
    const values = document.querySelectorAll('#kpi-grid .kpi-value');
    values[0].textContent = data.total_users;
    values[1].textContent = data.total_sessions;
    values[2].textContent = data.sessions_today;
    values[3].textContent = data.avg_session_minutes;
    values[4].textContent = data.active_last_5_minutes;
  } catch (err) {
    console.error(err);
    alert('Không tải được dữ liệu thống kê: ' + err.message);
  }
})();
