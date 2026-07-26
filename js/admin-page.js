import {
  fetchAllCerts,
  addCert,
  updateCert,
  deleteCert,
  loginAdmin,
  logoutAdmin,
  watchAuthState
} from './firestore-service.js';
import { CERT_SECTIONS, sectionLabel } from './constants.js';

// ---------- DOM refs ----------
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');

const whoEmail = document.getElementById('who-email');
const logoutBtn = document.getElementById('logout-btn');

const tabsRoot = document.getElementById('admin-tabs');
const gridRoot = document.getElementById('admin-grid');
const addCertBtn = document.getElementById('add-cert-btn');

const panelOverlay = document.getElementById('panel-overlay');
const panelTitle = document.getElementById('panel-title');
const panelClose = document.getElementById('panel-close');
const panelForm = document.getElementById('panel-form');
const fSection = document.getElementById('f-section');
const fName = document.getElementById('f-name');
const fImageUrl = document.getElementById('f-image-url');
const fDescription = document.getElementById('f-description');
const fIssuerLink = document.getElementById('f-issuer-link');
const previewWrap = document.getElementById('panel-preview');
const panelError = document.getElementById('panel-error');
const deleteBtn = document.getElementById('panel-delete-btn');
const toast = document.getElementById('toast');

// ---------- State ----------
let allCerts = [];
let activeTab = 'all';
let editingId = null; // null = create mode

// ---------- Init static UI ----------
fSection.innerHTML = CERT_SECTIONS.map((s) => `<option value="${s.id}">${s.label}</option>`).join('');

function buildTabs() {
  const counts = { all: allCerts.length };
  CERT_SECTIONS.forEach((s) => {
    counts[s.id] = allCerts.filter((c) => c.section === s.id).length;
  });

  const tabs = [{ id: 'all', label: 'All' }, ...CERT_SECTIONS];
  tabsRoot.innerHTML = tabs.map((t) => `
    <button class="admin-tab ${t.id === activeTab ? 'active' : ''}" data-tab="${t.id}">
      ${t.label}<span class="count">${counts[t.id] ?? 0}</span>
    </button>
  `).join('');

  tabsRoot.querySelectorAll('.admin-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      buildTabs();
      renderGrid();
    });
  });
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function renderGrid() {
  const items = activeTab === 'all' ? allCerts : allCerts.filter((c) => c.section === activeTab);

  if (items.length === 0) {
    gridRoot.innerHTML = `<p class="empty-state">No certifications here yet. Use "+ Add Certification" to create one.</p>`;
    return;
  }

  gridRoot.innerHTML = items.map((cert) => `
    <div class="cert-card" data-id="${cert.id}">
      <div class="cert-card-image">
        <img src="${escapeHtml(cert.imageUrl)}" alt="${escapeHtml(cert.name)}" loading="lazy" />
      </div>
      <div class="cert-card-name">${escapeHtml(cert.name)}</div>
      <div class="cert-card-admin-meta">
        <span class="section-badge">${escapeHtml(sectionLabel(cert.section))}</span>
      </div>
    </div>
  `).join('');

  gridRoot.querySelectorAll('.cert-card').forEach((card) => {
    card.addEventListener('click', () => {
      const cert = allCerts.find((c) => c.id === card.dataset.id);
      if (cert) openPanel(cert);
    });
  });
}

// ---------- Side panel (add / edit) ----------
function openPanel(cert) {
  panelError.textContent = '';
  if (cert) {
    editingId = cert.id;
    panelTitle.textContent = 'Edit Certification';
    fSection.value = cert.section;
    fName.value = cert.name || '';
    fImageUrl.value = cert.imageUrl || '';
    fDescription.value = cert.description || '';
    fIssuerLink.value = cert.issuerLink || '';
    deleteBtn.style.display = 'inline-flex';
  } else {
    editingId = null;
    panelTitle.textContent = 'Add Certification';
    fSection.value = activeTab !== 'all' ? activeTab : CERT_SECTIONS[0].id;
    fName.value = '';
    fImageUrl.value = '';
    fDescription.value = '';
    fIssuerLink.value = '';
    deleteBtn.style.display = 'none';
  }
  updatePreview();
  panelOverlay.classList.add('open');
}

function closePanel() {
  panelOverlay.classList.remove('open');
}

function updatePreview() {
  const url = fImageUrl.value.trim();
  if (url) {
    previewWrap.innerHTML = `<img src="${escapeHtml(url)}" alt="Preview" onerror="this.style.display='none'" />`;
  } else {
    previewWrap.innerHTML = `<span class="placeholder">Image preview appears here</span>`;
  }
}

fImageUrl.addEventListener('input', updatePreview);
panelClose.addEventListener('click', closePanel);
panelOverlay.addEventListener('click', (e) => {
  if (e.target === panelOverlay) closePanel();
});
addCertBtn.addEventListener('click', () => openPanel(null));

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

panelForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  panelError.textContent = '';

  const name = fName.value.trim();
  const imageUrl = fImageUrl.value.trim();
  const issuerLink = fIssuerLink.value.trim();
  const section = fSection.value;
  const description = fDescription.value.trim();

  if (!name || !imageUrl || !issuerLink) {
    panelError.textContent = 'Name, image URL, and issuer link are required.';
    return;
  }

  const submitBtn = panelForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    if (editingId) {
      await updateCert(editingId, { section, name, imageUrl, description, issuerLink });
      showToast('Certification updated');
    } else {
      const order = allCerts.filter((c) => c.section === section).length;
      await addCert({ section, name, imageUrl, description, issuerLink, order });
      showToast('Certification added');
    }
    closePanel();
    await loadCerts();
  } catch (err) {
    console.error(err);
    panelError.textContent = 'Something went wrong saving this certification. Try again.';
  } finally {
    submitBtn.disabled = false;
  }
});

deleteBtn.addEventListener('click', async () => {
  if (!editingId) return;
  const cert = allCerts.find((c) => c.id === editingId);
  const confirmed = window.confirm(`Delete "${cert?.name || 'this certification'}"? This can't be undone.`);
  if (!confirmed) return;

  try {
    await deleteCert(editingId);
    showToast('Certification deleted');
    closePanel();
    await loadCerts();
  } catch (err) {
    console.error(err);
    panelError.textContent = "Couldn't delete this certification. Try again.";
  }
});

// ---------- Data loading ----------
async function loadCerts() {
  allCerts = await fetchAllCerts();
  buildTabs();
  renderGrid();
}

// ---------- Auth ----------
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    await loginAdmin(loginEmail.value.trim(), loginPassword.value);
  } catch (err) {
    loginError.textContent = 'Sign-in failed. Check your email and password.';
  } finally {
    submitBtn.disabled = false;
  }
});

logoutBtn.addEventListener('click', () => logoutAdmin());

watchAuthState(async (user) => {
  if (user) {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'block';
    whoEmail.textContent = user.email;
    await loadCerts();
  } else {
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
    loginPassword.value = '';
  }
});
