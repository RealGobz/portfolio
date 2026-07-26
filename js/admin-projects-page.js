import {
  fetchAllProjects,
  addProject,
  updateProject,
  deleteProject,
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

const listRoot = document.getElementById('admin-project-list');
const addProjectBtn = document.getElementById('add-project-btn');

const panelOverlay = document.getElementById('panel-overlay');
const panelTitle = document.getElementById('panel-title');
const panelClose = document.getElementById('panel-close');
const panelForm = document.getElementById('panel-form');
const fName = document.getElementById('f-name');
const fDescription = document.getElementById('f-description');
const fGithubLink = document.getElementById('f-github-link');
const fYoutubeUrl = document.getElementById('f-youtube-url');
const fLiveLink = document.getElementById('f-live-link');
const panelError = document.getElementById('panel-error');
const deleteBtn = document.getElementById('panel-delete-btn');
const toast = document.getElementById('toast');

// ---------- State ----------
let allProjects = [];
let editingId = null; // null = create mode

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function renderList() {
  if (allProjects.length === 0) {
    listRoot.innerHTML = `<p class="empty-state">No projects here yet. Use "+ Add Project" to create one.</p>`;
    return;
  }

  listRoot.innerHTML = allProjects.map((project) => `
    <div class="admin-project-row" data-id="${project.id}" tabindex="0">
      <div class="admin-project-row-name">${escapeHtml(project.name)}</div>
      ${project.description ? `<div class="admin-project-row-desc">${escapeHtml(project.description)}</div>` : ''}
      <div class="admin-project-row-meta">
        ${project.githubLink ? '<span class="tag">GitHub</span>' : ''}
        ${project.youtubeUrl ? '<span class="tag">Video</span>' : ''}
        ${project.liveLink ? '<span class="tag">Live demo</span>' : ''}
      </div>
    </div>
  `).join('');

  listRoot.querySelectorAll('.admin-project-row').forEach((row) => {
    row.addEventListener('click', () => {
      const project = allProjects.find((p) => p.id === row.dataset.id);
      if (project) openPanel(project);
    });
  });
}

// ---------- Side panel (add / edit) ----------
function openPanel(project) {
  panelError.textContent = '';
  if (project) {
    editingId = project.id;
    panelTitle.textContent = 'Edit Project';
    fName.value = project.name || '';
    fDescription.value = project.description || '';
    fGithubLink.value = project.githubLink || '';
    fYoutubeUrl.value = project.youtubeUrl || '';
    fLiveLink.value = project.liveLink || '';
    deleteBtn.style.display = 'inline-flex';
  } else {
    editingId = null;
    panelTitle.textContent = 'Add Project';
    fName.value = '';
    fDescription.value = '';
    fGithubLink.value = '';
    fYoutubeUrl.value = '';
    fLiveLink.value = '';
    deleteBtn.style.display = 'none';
  }
  panelOverlay.classList.add('open');
}

function closePanel() {
  panelOverlay.classList.remove('open');
}

panelClose.addEventListener('click', closePanel);
panelOverlay.addEventListener('click', (e) => {
  if (e.target === panelOverlay) closePanel();
});
addProjectBtn.addEventListener('click', () => openPanel(null));

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2200);
}

panelForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  panelError.textContent = '';

  const name = fName.value.trim();
  const description = fDescription.value.trim();
  const githubLink = fGithubLink.value.trim();
  const youtubeUrl = fYoutubeUrl.value.trim();
  const liveLink = fLiveLink.value.trim();

  if (!name || !description) {
    panelError.textContent = 'Project name and description are required.';
    return;
  }

  const submitBtn = panelForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    if (editingId) {
      await updateProject(editingId, { name, description, githubLink, youtubeUrl, liveLink });
      showToast('Project updated');
    } else {
      const order = allProjects.length;
      await addProject({ name, description, githubLink, youtubeUrl, liveLink, order });
      showToast('Project added');
    }
    closePanel();
    await loadProjects();
  } catch (err) {
    console.error(err);
    panelError.textContent = 'Something went wrong saving this project. Try again.';
  } finally {
    submitBtn.disabled = false;
  }
});

deleteBtn.addEventListener('click', async () => {
  if (!editingId) return;
  const project = allProjects.find((p) => p.id === editingId);
  const confirmed = window.confirm(`Delete "${project?.name || 'this project'}"? This can't be undone.`);
  if (!confirmed) return;

  try {
    await deleteProject(editingId);
    showToast('Project deleted');
    closePanel();
    await loadProjects();
  } catch (err) {
    console.error(err);
    panelError.textContent = "Couldn't delete this project. Try again.";
  }
});

// ---------- Data loading ----------
async function loadProjects() {
  allProjects = await fetchAllProjects();
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
    await loadProjects();
  } else {
    loginScreen.style.display = 'flex';
    dashboardScreen.style.display = 'none';
    loginPassword.value = '';
  }
});
