MH.requireAuth();
MH.renderNav('wiki');

const listEl = document.getElementById('officer-list');
const filterInput = document.getElementById('filter-company');
const adminSection = document.getElementById('admin-section');
const officerForm = document.getElementById('officer-form');
const officerAlert = document.getElementById('officer-alert');
const sectionTitle = document.getElementById('of-section-title');
const submitBtn = document.getElementById('of-submit-btn');
const cancelBtn = document.getElementById('of-cancel-btn');

if (MH.isAdmin()) {
  adminSection.classList.remove('hidden');
}

let officersCache = [];
let editingId = null;

let debounceTimer;
filterInput.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadOfficers, 300);
});

async function loadOfficers() {
  const company = filterInput.value.trim();
  listEl.innerHTML = '<div class="empty-state">Đang tải danh bạ...</div>';
  try {
    const query = company ? `?company=${encodeURIComponent(company)}` : '';
    const officers = await MH.api(`/wiki/officers${query}`);
    officersCache = officers;
    renderOfficers(officers);
  } catch (err) {
    listEl.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

function renderOfficers(officers) {
  if (officers.length === 0) {
    listEl.innerHTML = '<div class="empty-state">Chưa có thông tin nào trong danh bạ. Vui lòng thử lại sau hoặc liên hệ Ban quản lý.</div>';
    return;
  }

  listEl.innerHTML = officers.map(o => `
    <div class="item-row">
      <div class="item-main">
        <div class="item-title">${escapeHtml(o.full_name)} — ${escapeHtml(o.position)}</div>
        <div class="item-meta">
          ${o.company ? `Đại đội: ${escapeHtml(o.company)}` : ''}
          ${o.platoon ? ` · Trung đội: ${escapeHtml(o.platoon)}` : ''}
          ${o.building ? ` · Khu nhà: ${escapeHtml(o.building)}` : ''}
          ${o.phone ? ` · SĐT: ${escapeHtml(o.phone)}` : ''}
        </div>
        ${o.note ? `<div class="item-desc">${escapeHtml(o.note)}</div>` : ''}
      </div>
      ${MH.isAdmin() ? `<div class="item-actions">
        <button class="btn btn-outline btn-sm" data-id="${o.id}" onclick="editOfficer(${o.id})">Sửa</button>
        <button class="btn btn-danger btn-sm" data-id="${o.id}" onclick="deleteOfficer(${o.id})">Xoá</button>
      </div>` : ''}
    </div>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

window.deleteOfficer = async (id) => {
  if (!confirm('Xoá thông tin này khỏi danh bạ?')) return;
  try {
    await MH.api(`/wiki/officers/${id}`, { method: 'DELETE' });
    loadOfficers();
  } catch (err) {
    alert(err.message);
  }
};

window.editOfficer = (id) => {
  const officer = officersCache.find(o => o.id === id);
  if (!officer) return;

  document.getElementById('of-name').value = officer.full_name || '';
  document.getElementById('of-position').value = officer.position || '';
  document.getElementById('of-phone').value = officer.phone || '';
  document.getElementById('of-company').value = officer.company || '';
  document.getElementById('of-platoon').value = officer.platoon || '';
  document.getElementById('of-building').value = officer.building || '';
  document.getElementById('of-note').value = officer.note || '';

  editingId = id;
  sectionTitle.textContent = 'Sửa thông tin (Ban quản lý)';
  submitBtn.textContent = 'Lưu thay đổi';
  cancelBtn.classList.remove('hidden');
  officerAlert.innerHTML = '';
  officerForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

function resetFormToAddMode() {
  editingId = null;
  officerForm.reset();
  sectionTitle.textContent = 'Thêm thông tin (Ban quản lý)';
  submitBtn.textContent = 'Thêm vào danh bạ';
  cancelBtn.classList.add('hidden');
}

if (cancelBtn) {
  cancelBtn.addEventListener('click', resetFormToAddMode);
}

if (officerForm) {
  officerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    officerAlert.innerHTML = '';

    const payload = {
      full_name: document.getElementById('of-name').value.trim(),
      position: document.getElementById('of-position').value.trim(),
      phone: document.getElementById('of-phone').value.trim(),
      company: document.getElementById('of-company').value.trim(),
      platoon: document.getElementById('of-platoon').value.trim(),
      building: document.getElementById('of-building').value.trim(),
      note: document.getElementById('of-note').value.trim(),
    };

    try {
      if (editingId) {
        await MH.api(`/wiki/officers/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        officerAlert.innerHTML = '<div class="alert alert-success">Đã lưu thay đổi.</div>';
        resetFormToAddMode();
      } else {
        await MH.api('/wiki/officers', { method: 'POST', body: JSON.stringify(payload) });
        officerForm.reset();
        officerAlert.innerHTML = '<div class="alert alert-success">Đã thêm vào danh bạ.</div>';
      }
      loadOfficers();
    } catch (err) {
      officerAlert.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  });
}

loadOfficers();
