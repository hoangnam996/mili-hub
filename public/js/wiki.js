MH.requireAuth();
MH.renderNav('wiki');

const listEl = document.getElementById('officer-list');
const filterInput = document.getElementById('filter-company');
const adminSection = document.getElementById('admin-section');
const officerForm = document.getElementById('officer-form');
const officerAlert = document.getElementById('officer-alert');

if (MH.isAdmin()) {
  adminSection.classList.remove('hidden');
}

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
      ${MH.isAdmin() ? `<div class="item-actions"><button class="btn btn-danger btn-sm" data-id="${o.id}" onclick="deleteOfficer(${o.id})">Xoá</button></div>` : ''}
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
      await MH.api('/wiki/officers', { method: 'POST', body: JSON.stringify(payload) });
      officerForm.reset();
      officerAlert.innerHTML = '<div class="alert alert-success">Đã thêm vào danh bạ.</div>';
      loadOfficers();
    } catch (err) {
      officerAlert.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  });
}

loadOfficers();
