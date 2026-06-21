MH.requireAuth();
MH.renderNav('community');

const user = MH.getUser();
const isAdmin = MH.isAdmin();

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

/* ===================== TABS ===================== */
const tabBtns = document.querySelectorAll('.tab-btn');
const panels = {
  market: document.getElementById('panel-market'),
  lostfound: document.getElementById('panel-lostfound'),
};
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    Object.values(panels).forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    panels[btn.dataset.tab].classList.add('active');
  });
});

/* ===================== MILI-MARKET ===================== */

const marketForm = document.getElementById('market-form');
const marketAlert = document.getElementById('market-alert');
const marketPhoto = document.getElementById('m-photo');
const marketPreview = document.getElementById('m-preview');
const marketList = document.getElementById('market-list');
const marketStatusFilter = document.getElementById('m-status-filter');

marketPhoto.addEventListener('change', () => {
  const file = marketPhoto.files[0];
  if (!file) { marketPreview.classList.remove('visible'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    marketPreview.src = reader.result;
    marketPreview.classList.add('visible');
  };
  reader.readAsDataURL(file);
});

marketStatusFilter.addEventListener('change', loadMarket);

const marketPrice = document.getElementById('m-price');
marketPrice.addEventListener('input', () => {
  const digits = marketPrice.value.replace(/\D/g, '');
  marketPrice.value = digits ? Number(digits).toLocaleString('vi-VN') : '';
});

marketForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  marketAlert.innerHTML = '';
  const submitBtn = marketForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    let image_data = null;
    const file = marketPhoto.files[0];
    if (file) image_data = await MH.fileToBase64(file);

    const payload = {
      title: document.getElementById('m-title').value.trim(),
      price: Number(document.getElementById('m-price').value.replace(/\D/g, '')) || 0,
      description: document.getElementById('m-desc').value.trim(),
      contact: document.getElementById('m-contact').value.trim(),
      image_data,
    };

    await MH.api('/community/market', { method: 'POST', body: JSON.stringify(payload) });
    marketAlert.innerHTML = '<div class="alert alert-success">Đã đăng bài thanh lý.</div>';
    marketForm.reset();
    marketPreview.classList.remove('visible');
    loadMarket();
  } catch (err) {
    marketAlert.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  } finally {
    submitBtn.disabled = false;
  }
});

async function loadMarket() {
  marketList.innerHTML = '<div class="empty-state">Đang tải...</div>';
  try {
    const status = marketStatusFilter.value;
    const query = status ? `?status=${status}` : '';
    const rows = await MH.api(`/community/market${query}`);
    renderMarket(rows);
  } catch (err) {
    marketList.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

function renderMarket(rows) {
  if (rows.length === 0) {
    marketList.innerHTML = '<div class="empty-state">Chưa có bài thanh lý nào.</div>';
    return;
  }

  marketList.innerHTML = rows.map(r => {
    const pillClass = r.status === 'sold' ? 'pill-sold' : 'pill-available';
    const pillLabel = r.status === 'sold' ? 'Đã bán' : 'Còn hàng';
    const thumb = r.image_data ? `<img class="item-thumb" src="${r.image_data}" alt="Ảnh thanh lý">` : '';
    const canManage = r.user_id === user.id || isAdmin;

    let actions = '';
    if (canManage) {
      const toggleLabel = r.status === 'sold' ? 'Đánh dấu còn hàng' : 'Đánh dấu đã bán';
      const toggleStatus = r.status === 'sold' ? 'available' : 'sold';
      actions = `
        <div class="item-actions">
          <button class="btn btn-outline btn-sm" onclick="toggleMarketStatus(${r.id}, '${toggleStatus}')">${toggleLabel}</button>
          <button class="btn btn-danger btn-sm" onclick="deleteMarketListing(${r.id})">Xoá</button>
        </div>
      `;
    }

    return `
      <div class="item-row">
        ${thumb}
        <div class="item-main">
          <div class="item-title">${escapeHtml(r.title)} ${r.price > 0 ? `— ${MH.formatVND(r.price)}` : '— Miễn phí'}</div>
          <div class="item-meta">
            Người đăng: ${escapeHtml(r.full_name)}${r.seller_room ? ` (Phòng ${escapeHtml(r.seller_room)})` : ''}
            ${r.contact ? ` · Liên hệ: ${escapeHtml(r.contact)}` : ''} · ${MH.formatDateTime(r.created_at)}
          </div>
          ${r.description ? `<div class="item-desc">${escapeHtml(r.description)}</div>` : ''}
          <div class="mt-1"><span class="pill ${pillClass}">${pillLabel}</span></div>
        </div>
        ${actions}
      </div>
    `;
  }).join('');
}

window.toggleMarketStatus = async (id, status) => {
  try {
    await MH.api(`/community/market/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
    loadMarket();
  } catch (err) {
    alert(err.message);
  }
};

window.deleteMarketListing = async (id) => {
  if (!confirm('Xoá bài đăng này?')) return;
  try {
    await MH.api(`/community/market/${id}`, { method: 'DELETE' });
    loadMarket();
  } catch (err) {
    alert(err.message);
  }
};

/* ===================== LOST & FOUND ===================== */

const lfForm = document.getElementById('lf-form');
const lfAlert = document.getElementById('lf-alert');
const lfPhoto = document.getElementById('lf-photo');
const lfPreview = document.getElementById('lf-preview');
const lfList = document.getElementById('lf-list');
const lfTypeFilter = document.getElementById('lf-type-filter');
const lfRoom = document.getElementById('lf-room');

if (user.room_number) lfRoom.value = user.room_number;

lfPhoto.addEventListener('change', () => {
  const file = lfPhoto.files[0];
  if (!file) { lfPreview.classList.remove('visible'); return; }
  const reader = new FileReader();
  reader.onload = () => {
    lfPreview.src = reader.result;
    lfPreview.classList.add('visible');
  };
  reader.readAsDataURL(file);
});

lfTypeFilter.addEventListener('change', loadLostFound);

lfForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  lfAlert.innerHTML = '';
  const submitBtn = lfForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    let image_data = null;
    const file = lfPhoto.files[0];
    if (file) image_data = await MH.fileToBase64(file);

    const payload = {
      item_type: document.getElementById('lf-type').value,
      item_name: document.getElementById('lf-name').value.trim(),
      description: document.getElementById('lf-desc').value.trim(),
      room_number: lfRoom.value.trim(),
      image_data,
    };

    await MH.api('/community/lost-found', { method: 'POST', body: JSON.stringify(payload) });
    lfAlert.innerHTML = '<div class="alert alert-success">Đã đăng tin.</div>';
    lfForm.reset();
    if (user.room_number) lfRoom.value = user.room_number;
    lfPreview.classList.remove('visible');
    loadLostFound();
  } catch (err) {
    lfAlert.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  } finally {
    submitBtn.disabled = false;
  }
});

async function loadLostFound() {
  lfList.innerHTML = '<div class="empty-state">Đang tải...</div>';
  try {
    const params = new URLSearchParams();
    params.set('status', 'open');
    if (lfTypeFilter.value) params.set('item_type', lfTypeFilter.value);
    const rows = await MH.api(`/community/lost-found?${params.toString()}`);
    renderLostFound(rows);
  } catch (err) {
    lfList.innerHTML = `<div class="empty-state">${err.message}</div>`;
  }
}

function renderLostFound(rows) {
  if (rows.length === 0) {
    lfList.innerHTML = '<div class="empty-state">Chưa có tin thất lạc nào đang mở.</div>';
    return;
  }

  lfList.innerHTML = rows.map(r => {
    const typeLabel = r.item_type === 'lost' ? 'Đang bị mất' : 'Nhặt được — đang giữ';
    const typeClass = r.item_type === 'lost' ? 'pill-pending' : 'pill-open';
    const thumb = r.image_data ? `<img class="item-thumb" src="${r.image_data}" alt="Ảnh đồ vật">` : '';
    const canResolve = r.user_id === user.id || isAdmin;

    return `
      <div class="item-row">
        ${thumb}
        <div class="item-main">
          <div class="item-title">${escapeHtml(r.item_name)}</div>
          <div class="item-meta">
            ${escapeHtml(r.full_name)}${r.room_number ? ` · Phòng ${escapeHtml(r.room_number)}` : ''}
            ${r.contact_phone ? ` · SĐT: ${escapeHtml(r.contact_phone)}` : ''} · ${MH.formatDateTime(r.created_at)}
          </div>
          ${r.description ? `<div class="item-desc">${escapeHtml(r.description)}</div>` : ''}
          <div class="mt-1"><span class="pill ${typeClass}">${typeLabel}</span></div>
        </div>
        ${canResolve ? `
          <div class="item-actions">
            <button class="btn btn-outline btn-sm" onclick="resolveLostFound(${r.id})">Đã tìm lại / Đã trả</button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

window.resolveLostFound = async (id) => {
  try {
    await MH.api(`/community/lost-found/${id}/resolve`, { method: 'PUT' });
    loadLostFound();
  } catch (err) {
    alert(err.message);
  }
};

/* ===================== INIT ===================== */
loadMarket();
loadLostFound();
