MH.requireAuth();
MH.renderNav('support');

const isAdmin = MH.isAdmin();
const user = MH.getUser();

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

const sosForm = document.getElementById('sos-form');
const sosRoom = document.getElementById('sos-room');
const sosPhoto = document.getElementById('sos-photo');
const sosPreview = document.getElementById('sos-preview');
const sosAlert = document.getElementById('sos-alert');
const sosSubmitBtn = document.getElementById('sos-submit-btn');
const sosListEl = document.getElementById('sos-list');
const sosListTitle = document.getElementById('sos-list-title');
const sosStatusFilter = document.getElementById('sos-status-filter');

if (user.room_number) sosRoom.value = user.room_number;

if (isAdmin) {
  document.getElementById('sos-submit-section').classList.add('hidden');
  sosListTitle.textContent = 'Tất cả báo cáo (Ban quản lý KTX)';
}

sosPhoto.addEventListener('change', () => {
  const file = sosPhoto.files[0];
  if (!file) { sosPreview.classList.remove('visible'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    sosPreview.src = reader.result;
    sosPreview.classList.add('visible');
  };
  reader.readAsDataURL(file);
});

sosStatusFilter.addEventListener('change', loadReports);

if (sosForm) {
  sosForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    sosAlert.innerHTML = '';
    sosSubmitBtn.disabled = true;
    sosSubmitBtn.textContent = 'Đang gửi...';

    try {
      let image_data = null;
      const file = sosPhoto.files[0];
      if (file) image_data = await MH.fileToBase64(file);

      const payload = {
        device: document.getElementById('sos-device').value.trim(),
        description: document.getElementById('sos-desc').value.trim(),
        room_number: sosRoom.value.trim(),
        image_data,
      };

      await MH.api('/support/reports', { method: 'POST', body: JSON.stringify(payload) });
      sosAlert.innerHTML = '<div class="alert alert-success">Đã gửi báo cáo. Ban quản lý sẽ xử lý sớm nhất.</div>';
      sosForm.reset();
      sosPreview.classList.remove('visible');
      if (user.room_number) sosRoom.value = user.room_number;
      loadReports();
    } catch (err) {
      sosAlert.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    } finally {
      sosSubmitBtn.disabled = false;
      sosSubmitBtn.textContent = 'Gửi báo cáo';
    }
  });
}

async function loadReports() {
  sosListEl.innerHTML = '<div class="empty-state">Đang tải...</div>';
  try {
    const status = sosStatusFilter.value;
    const query = status ? `?status=${status}` : '';
    const rows = await MH.api(`/support/reports${query}`);
    renderReports(rows);
  } catch (err) {
    sosListEl.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

const statusLabels = {
  pending: { pill: 'pill-pending', label: 'Đang chờ xử lý' },
  in_progress: { pill: 'pill-progress', label: 'Đang xử lý' },
  completed: { pill: 'pill-completed', label: 'Đã hoàn thành' },
};

function renderReports(rows) {
  if (rows.length === 0) {
    sosListEl.innerHTML = '<div class="empty-state">Chưa có báo cáo nào.</div>';
    return;
  }

  sosListEl.innerHTML = rows.map(r => {
    const info = statusLabels[r.status] || statusLabels.pending;
    const thumb = r.image_data ? `<img class="item-thumb" src="${r.image_data}" alt="Ảnh báo cáo">` : '';

    let actions = '';
    if (isAdmin && r.status === 'pending') {
      actions = `<button class="btn btn-outline btn-sm" onclick="startReport(${r.id})">Bắt đầu xử lý</button>
                 <button class="btn btn-gold btn-sm" onclick="completeReport(${r.id})">Hoàn thành</button>`;
    } else if (isAdmin && r.status === 'in_progress') {
      actions = `<button class="btn btn-gold btn-sm" onclick="completeReport(${r.id})">Hoàn thành</button>`;
    }

    return `
      <div class="item-row">
        ${thumb}
        <div class="item-main">
          <div class="item-title">${escapeHtml(r.device)} ${isAdmin ? `— Phòng ${escapeHtml(r.room_number)}` : ''}</div>
          <div class="item-meta">
            ${isAdmin ? `Người báo: ${escapeHtml(r.full_name)} · ` : `Phòng ${escapeHtml(r.room_number)} · `}
            Gửi lúc: ${MH.formatDateTime(r.created_at)}
            ${r.completed_at ? ` · Hoàn thành: ${MH.formatDateTime(r.completed_at)}` : ''}
          </div>
          ${r.description ? `<div class="item-desc">${escapeHtml(r.description)}</div>` : ''}
          <div class="mt-1"><span class="pill ${info.pill}">${info.label}</span></div>
        </div>
        ${actions ? `<div class="item-actions">${actions}</div>` : ''}
      </div>
    `;
  }).join('');
}

window.startReport = async (id) => {
  try {
    await MH.api(`/support/reports/${id}/start`, { method: 'PUT' });
    loadReports();
  } catch (err) {
    alert(err.message);
  }
};

window.completeReport = async (id) => {
  try {
    await MH.api(`/support/reports/${id}/complete`, { method: 'PUT' });
    loadReports();
  } catch (err) {
    alert(err.message);
  }
};

loadReports();
