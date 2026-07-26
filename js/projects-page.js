import { fetchAllProjects } from './firestore-service.js';

const listRoot = document.getElementById('project-list');

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/**
 * Pull a YouTube video ID out of any common URL shape:
 * watch?v=ID, youtu.be/ID, /embed/ID, /shorts/ID.
 * Returns null if the string isn't a recognizable YouTube URL.
 */
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/
  ];
  for (const re of patterns) {
    const match = url.match(re);
    if (match) return match[1];
  }
  return null;
}

function renderSkeleton() {
  listRoot.innerHTML = Array.from({ length: 3 }).map(() => `
    <div class="project-skeleton">
      <div class="skel-line skel-title"></div>
      <div class="skel-line skel-desc"></div>
      <div class="skel-line skel-desc"></div>
    </div>
  `).join('');
}

function projectMarkup(project) {
  const videoId = extractYouTubeId(project.youtubeUrl);

  const mediaBlock = videoId ? `
    <div class="project-media">
      <div class="project-video">
        <iframe
          src="https://www.youtube.com/embed/${videoId}"
          title="${escapeHtml(project.name)} demo video"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      </div>
      ${project.liveLink ? `
        <div class="project-live-link">
          <a href="${escapeHtml(project.liveLink)}" target="_blank" rel="noopener" class="btn btn-ghost">Try it live ↗</a>
        </div>
      ` : ''}
    </div>
  ` : (project.liveLink ? `
    <div class="project-media">
      <div class="project-live-link">
        <a href="${escapeHtml(project.liveLink)}" target="_blank" rel="noopener" class="btn btn-ghost">Try it live ↗</a>
      </div>
    </div>
  ` : '');

  const githubBtn = project.githubLink ? `
    <a href="${escapeHtml(project.githubLink)}" target="_blank" rel="noopener" class="btn btn-solid">See on GitHub ↗</a>
  ` : '';

  return `
    <article class="project-block">
      <h2 class="project-name">${escapeHtml(project.name)}</h2>
      ${project.description ? `<p class="project-desc">${escapeHtml(project.description)}</p>` : ''}
      ${mediaBlock}
      <div class="project-actions">
        ${githubBtn}
      </div>
    </article>
  `;
}

function renderProjects(projects) {
  if (projects.length === 0) {
    listRoot.innerHTML = `<p class="project-empty">No projects added yet.</p>`;
    return;
  }
  listRoot.innerHTML = projects.map(projectMarkup).join('');
}

async function init() {
  renderSkeleton();
  try {
    const projects = await fetchAllProjects();
    renderProjects(projects);
  } catch (err) {
    console.error('Failed to load projects:', err);
    listRoot.innerHTML = `<p class="project-empty">Couldn't load projects right now. Check your connection and try again.</p>`;
  }
}

init();
