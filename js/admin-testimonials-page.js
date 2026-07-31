import {
  fetchAllTestimonials,
  addTestimonial,
  updateTestimonial,
  deleteTestimonial,
  loginAdmin,
  logoutAdmin,
  watchAuthState
} from './firestore-service.js';

// ---------- DOM refs ----------
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');

const whoEmail = document.getElementById('who-email');
const logoutBtn = document.getElementById('logout-btn');

const listRoot = document.getElementById('admin-testimonial-list');
const addBtn = document.getElementById('add-testimonial-btn');

const panelOverlay = document.getElementById('panel-overlay');
const panelTitle = document.getElementById('panel-title');
const panelClose = document.getElementById('panel-close');
const panelForm = document.getElementById('panel-form');
const fName = document.getElementById('f-name');
const fQuote = document.getElementById('f-quote');
const fLink = document.getElementById('f-link');
const fImageUrl = document.getElementById('f-image-url');
const panelPreview = document.getElementById('panel-preview');
const panelError = document.getElementById('panel-error');
const deleteBtn = document.getElementById('panel-delete-btn');
const toast = document.getElementById('toast');

// ---------- State ----------
let allTestimonials = [];
let editingId = null; // null = create mode

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function renderList() {
  if (allTestimonials.length === 0) {
    listRoot.innerHTML = `<p class="empty-state">No social proof here yet. Use "+ Add Social Proof" to create one.</p>`;
    return;
  }

  listRoot.innerHTML = allTestimonials.map((t) => `
    <div class="admin-project-row" data-id="${t.id}" tabindex="0">
      <div class="admin-project-row-name">${escapeHtml(t.name)}</div>
      ${t.quote ? `<div class="admin-project-row-desc">${escapeHtml(t.quote)}</div>` : ''}
      <div class="admin-project-row-meta">
        ${t.link ? '<span class="tag">Link</span>' : ''}
        ${t.imageUrl ? '<span class="tag">Screenshot</span>' : ''}
      </div>
    </div>
  `).join('');

  listRoot.querySelectorAll('.admin-project-row').forEach((row) => {
    row.addEventListener('click', () => {
      const t = allTestimonials.find((item) => item.id === row.dataset.id);
      if (t) openPanel(t);
    });
  });
}

// ---------- Image preview ----------
function updatePreview() {
  const url = fImageUrl.value.trim();
  if (url) {
    panelPreview.innerHTML = `<img src="${escapeHtml(url)}" alt="Preview" onerror="this.parentElement.innerHTML='<span class=\\'placeholder\\'>Could not load image</span>'" />`;
  } else {
    panelPreview.innerHTML = '<span class="placeholder">Image preview appears here</span>';
  }
}

fImageUrl.addEventListener('input', updatePreview);

// ---------- Side panel (add / edit) ----------
function openPanel(testimonial) {
  panelError.textContent = '';
  if (testimonial) {
    editingId = testimonial.id;
    panelTitle.textContent = 'Edit Social Proof';
    fName.value = testimonial.name || '';
    fQuote.value = testimonial.quote || '';
    fLink.value = testimonial.link || '';
    fImageUrl.value = testimonial.imageUrl || '';
    deleteBtn.style.display = 'inline-flex';
  } else {
    editingId = null;
    panelTitle.textContent = 'Add Social Proof';
    fName.value = '';
    fQuote.value = '';
    fLink.value = '';
    fImageUrl.value = '';
    deleteBtn.style.display = 'none';
  }
  updatePreview();
  panelOverlay.classList.add('open');
}

function closePanel() {
  panelOverlay.classList.remove('open');
}

panelClose.addEventListener('click', closePanel);
panelOverlay.addEventListener('click', (e) => {
  if (e.target === panelOverlay) closePanel();
});
addBtn.addEventListener('click', () => openPanel(null));

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

panelForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  panelError.textContent = '';

  const name = fName.value.trim();
  const quote = fQuote.value.trim();
  const link = fLink.value.trim();
  const imageUrl = fImageUrl.value.trim();

  if (!name || !quote || !link) {
    panelError.textContent = 'Name, quote, and proof link are required.';
    return;
  }

  const submitBtn = panelForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    if (editingId) {
      await updateTestimonial(editingId, { name, quote, link, imageUrl });
      showToast('Social proof updated');
    } else {
      const order = allTestimonials.length;
      await addTestimonial({ name, quote, link, imageUrl, order });
      showToast('Social proof added');
    }
    closePanel();
    await loadTestimonials();
  } catch (err) {
    console.error(err);
    panelError.textContent = 'Something went wrong saving. Try again.';
  } finally {
    submitBtn.disabled = false;
  }
});

deleteBtn.addEventListener('click', async () => {
  if (!editingId) return;
  const t = allTestimonials.find((item) => item.id === editingId);
  const confirmed = window.confirm(`Delete "${t?.name || 'this testimonial'}"? This can't be undone.`);
  if (!confirmed) return;

  try {
    await deleteTestimonial(editingId);
    showToast('Social proof deleted');
    closePanel();
    await loadTestimonials();
  } catch (err) {
    console.error(err);
    panelError.textContent = "Couldn't delete. Try again.";
  }
});

// ---------- Data loading ----------
async function loadTestimonials() {
  allTestimonials = await fetchAllTestimonials();
  renderList();
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
    await loadTestimonials();
  } else {
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
    loginPassword.value = '';
  }
});
