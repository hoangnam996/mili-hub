MH.requireAuth();
MH.renderNav('operation');

const isAdmin = MH.isAdmin();

/* ===================== TABS ===================== */
const tabBtns = document.querySelectorAll('.tab-btn');
const panels = {
  schedule: document.getElementById('panel-schedule'),
  inspection: document.getElementById('panel-inspection'),
};
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    Object.values(panels).forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    panels[btn.dataset.tab].classList.add('active');
  });
});

const DUTY_LABELS = { truc_com: 'Trực cơm', gac_dem: 'Gác đêm', khac: 'Khác' };

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

/* ===================== LỊCH TRỰC ===================== */

const scheduleAdminSection = document.getElementById('schedule-admin-section');
const scheduleForm = document.getElementById('schedule-form');
const scheduleAlert = document.getElementById('schedule-alert');
const scheduleTbody = document.getElementById('schedule-tbody');
const filterDate = document.getElementById('filter-date');
const filterRoom = document.getElementById('filter-room');

if (isAdmin) scheduleAdminSection.classList.remove('hidden');

let scheduleDebounce;
[filterDate, filterRoom].forEach(el => el.addEventListener('input', () => {
  clearTimeout(scheduleDebounce);
  scheduleDebounce = setTimeout(loadSchedules, 300);
}));

async function loadSchedules() {
  scheduleTbody.innerHTML = '<tr><td colspan="6" class="empty-state">Đang tải lịch trực...</td></tr>';
  try {
    const params = new URLSearchParams();
    if (filterDate.value) params.set('date', filterDate.value);
    if (filterRoom.value.trim()) params.set('room_number', filterRoom.value.trim());
    const query = params.toString() ? `?${params.toString()}` : '';
    const rows = await MH.api(`/operation/schedules${query}`);
    renderSchedules(rows);
  } catch (err) {
    scheduleTbody.innerHTML = `<tr><td colspan="6" class="empty-state">${err.message}</td></tr>`;
  }
}

function renderSchedules(rows) {
  if (rows.length === 0) {
    scheduleTbody.innerHTML = '<tr><td colspan="6" class="empty-state">Chưa có lịch trực nào.</td></tr>';
    return;
  }
  scheduleTbody.innerHTML = rows.map(r => `
    <tr>
      <td class="mono">${new Date(r.duty_date).toLocaleDateString('vi-VN')}</td>
      <td>${DUTY_LABELS[r.duty_type] || escapeHtml(r.duty_type)}</td>
      <td class="mono">${escapeHtml(r.room_number)}</td>
      <td>${escapeHtml(r.assignee_names || '—')}</td>
      <td>${escapeHtml(r.note || '—')}</td>
      <td>${isAdmin ? `<button class="btn btn-danger btn-sm" onclick="deleteSchedule(${r.id})">Xoá</button>` : ''}</td>
    </tr>
  `).join('');
}

window.deleteSchedule = async (id) => {
  if (!confirm('Xoá lịch trực này?')) return;
  try {
    await MH.api(`/operation/schedules/${id}`, { method: 'DELETE' });
    loadSchedules();
  } catch (err) {
    alert(err.message);
  }
};

if (scheduleForm) {
  scheduleForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    scheduleAlert.innerHTML = '';
    const payload = {
      duty_date: document.getElementById('sch-date').value,
      duty_type: document.getElementById('sch-type').value,
      room_number: document.getElementById('sch-room').value.trim(),
      assignee_names: document.getElementById('sch-assignees').value.trim(),
      note: document.getElementById('sch-note').value.trim(),
    };
    try {
      await MH.api('/operation/schedules', { method: 'POST', body: JSON.stringify(payload) });
      scheduleForm.reset();
      scheduleAlert.innerHTML = '<div class="alert alert-success">Đã tạo lịch trực.</div>';
      loadSchedules();
    } catch (err) {
      scheduleAlert.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  });
}

/* ===================== CHẤM ĐIỂM NỘI VỤ ===================== */

const insp_form = document.getElementById('inspection-form');
const insp_photo = document.getElementById('insp-photo');
const insp_preview = document.getElementById('insp-preview');
const insp_room = document.getElementById('insp-room');
const insp_alert = document.getElementById('inspection-alert');
const insp_submitBtn = document.getElementById('insp-submit-btn');
const geoStatus = document.getElementById('geo-status');
const insp_listEl = document.getElementById('inspection-list');
const insp_listTitle = document.getElementById('inspection-list-title');

const user = MH.getUser();
if (user.room_number) insp_room.value = user.room_number;

if (isAdmin) {
  document.getElementById('inspection-submit-section').classList.add('hidden');
  insp_listTitle.textContent = 'Danh sách bài chấm điểm (Ban thi đua)';
}

let currentCoords = null;
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      currentCoords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      geoStatus.textContent = `Đã xác định vị trí GPS (độ chính xác ~${Math.round(pos.coords.accuracy)}m).`;
    },
    () => {
      geoStatus.textContent = 'Không thể lấy vị trí GPS. Bài kiểm tra vẫn được gửi kèm dấu thời gian.';
    }
  );
} else {
  geoStatus.textContent = 'Thiết bị không hỗ trợ GPS. Bài kiểm tra vẫn được gửi kèm dấu thời gian.';
}

insp_photo.addEventListener('change', () => {
  const file = insp_photo.files[0];
  if (!file) { insp_preview.classList.remove('visible'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    insp_preview.src = reader.result;
    insp_preview.classList.add('visible');
  };
  reader.readAsDataURL(file);
});

if (insp_form) {
  insp_form.addEventListener('submit', async (e) => {
    e.preventDefault();
    insp_alert.innerHTML = '';
    const file = insp_photo.files[0];
    if (!file) {
      insp_alert.innerHTML = '<div class="alert alert-error">Vui lòng chọn ảnh.</div>';
      return;
    }

    insp_submitBtn.disabled = true;
    insp_submitBtn.textContent = 'Đang gửi...';
    try {
      const image_data = await MH.fileToBase64(file);
      const payload = {
        image_data,
        room_number: insp_room.value.trim(),
        latitude: currentCoords ? currentCoords.latitude : null,
        longitude: currentCoords ? currentCoords.longitude : null,
      };
      await MH.api('/operation/inspections', { method: 'POST', body: JSON.stringify(payload) });
      insp_alert.innerHTML = '<div class="alert alert-success">Đã gửi bài kiểm tra nội vụ.</div>';
      insp_form.reset();
      insp_preview.classList.remove('visible');
      if (user.room_number) insp_room.value = user.room_number;
      loadInspections();
    } catch (err) {
      insp_alert.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    } finally {
      insp_submitBtn.disabled = false;
      insp_submitBtn.textContent = 'Gửi bài kiểm tra';
    }
  });
}

async function loadInspections() {
  insp_listEl.innerHTML = '<div class="empty-state">Đang tải...</div>';
  try {
    const query = isAdmin ? '?status=pending' : '';
    const rows = await MH.api(`/operation/inspections${query}`);
    renderInspections(rows);
  } catch (err) {
    insp_listEl.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

function renderInspections(rows) {
  if (rows.length === 0) {
    insp_listEl.innerHTML = `<div class="empty-state">${isAdmin ? 'Không có bài chờ chấm điểm.' : 'Chưa có bài kiểm tra nào được gửi.'}</div>`;
    return;
  }

  insp_listEl.innerHTML = rows.map(r => {
    const pillClass = r.status === 'scored' ? 'pill-scored' : 'pill-pending';
    const pillLabel = r.status === 'scored' ? `Đã chấm: ${r.score} điểm` : 'Chờ chấm';
    const locText = (r.latitude && r.longitude) ? `${r.latitude.toFixed(5)}, ${r.longitude.toFixed(5)}` : 'Không có GPS';

    return `
      <div class="item-row">
        <img class="item-thumb" src="${r.image_data}" alt="Ảnh nội vụ">
        <div class="item-main">
          <div class="item-title">${isAdmin ? `${escapeHtml(r.full_name)} — ` : ''}Phòng ${escapeHtml(r.room_number)}</div>
          <div class="item-meta">Thời gian: ${MH.formatDateTime(r.captured_at)} · GPS: ${locText}</div>
          <div class="mt-1"><span class="pill ${pillClass}">${pillLabel}</span></div>
          ${isAdmin && r.status === 'pending' ? `
            <div class="field-row mt-1" style="align-items: flex-end;">
              <div class="field" style="max-width: 120px; margin-bottom:0;">
                <input type="number" min="0" max="10" placeholder="Điểm" id="score-${r.id}">
              </div>
              <button class="btn btn-gold btn-sm" onclick="submitScore(${r.id})">Chấm điểm</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

window.submitScore = async (id) => {
  const input = document.getElementById(`score-${id}`);
  const score = input.value;
  if (score === '' || isNaN(Number(score))) {
    alert('Vui lòng nhập điểm hợp lệ.');
    return;
  }
  try {
    await MH.api(`/operation/inspections/${id}/score`, { method: 'PUT', body: JSON.stringify({ score: Number(score) }) });
    loadInspections();
  } catch (err) {
    alert(err.message);
  }
};

/* ===================== INIT ===================== */
loadSchedules();
loadInspections();
