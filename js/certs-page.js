import { fetchAllCerts, groupBySection } from './firestore-service.js';
import { CERT_SECTIONS } from './constants.js';

const sectionsRoot = document.getElementById('cert-sections');
const indexRoot = document.getElementById('section-index');

const modalOverlay = document.getElementById('cert-modal');
const modalImage = document.getElementById('modal-image');
const modalName = document.getElementById('modal-name');
const modalSectionTag = document.getElementById('modal-section-tag');
const modalDesc = document.getElementById('modal-desc');
const modalLink = document.getElementById('modal-link');
const modalCloseBtn = document.getElementById('modal-close');

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/** Build the section index nav + one skeleton-filled section per CERT_SECTIONS entry. */
function renderSkeleton() {
  indexRoot.innerHTML = CERT_SECTIONS.map((s, i) => `
    <a href="#${s.id}"><span class="idx">${String(i + 1).padStart(2, '0')}</span>${escapeHtml(s.label)}</a>
  `).join('');

  sectionsRoot.innerHTML = CERT_SECTIONS.map((s) => `
    <section class="cert-section" id="${s.id}">
      <div class="wrap">
        <div class="cert-section-head">
          <p class="eyebrow">${escapeHtml(s.label)}</p>
          <h2>${escapeHtml(s.label)}</h2>
          <p class="cert-section-note">${escapeHtml(s.note)}</p>
        </div>
        <div class="cert-grid" id="grid-${s.id}">
          ${Array.from({ length: 3 }).map(() => '<div class="cert-skeleton"></div>').join('')}
        </div>
      </div>
    </section>
  `).join('');
}

function cardMarkup(cert) {
  return `
    <button class="cert-card" data-id="${cert.id}" aria-haspopup="dialog">
      <div class="cert-card-image">
        <img src="${escapeHtml(cert.imageUrl)}" alt="${escapeHtml(cert.name)}" loading="lazy" />
      </div>
      <div class="cert-card-name">${escapeHtml(cert.name)}</div>
    </button>
  `;
}

function renderCerts(certs) {
  const grouped = groupBySection(certs);

  CERT_SECTIONS.forEach((s) => {
    const grid = document.getElementById(`grid-${s.id}`);
    const items = grouped[s.id] || [];
    if (items.length === 0) {
      grid.innerHTML = `<p class="cert-empty">No certifications added to this section yet.</p>`;
      return;
    }
    grid.innerHTML = items.map(cardMarkup).join('');
  });

  // Wire up click handlers after render
  document.querySelectorAll('.cert-card').forEach((card) => {
    card.addEventListener('click', () => {
      const cert = certs.find((c) => c.id === card.dataset.id);
      if (cert) openModal(cert);
    });
  });
}

function openModal(cert) {
  modalImage.src = cert.imageUrl || '';
  modalImage.alt = cert.name || '';
  modalName.textContent = cert.name || '';
  modalSectionTag.textContent = CERT_SECTIONS.find((s) => s.id === cert.section)?.label || cert.section;

  if (cert.description) {
    modalDesc.textContent = cert.description;
    modalDesc.classList.remove('empty');
  } else {
    modalDesc.textContent = 'No description provided for this certification.';
    modalDesc.classList.add('empty');
  }

  if (cert.issuerLink) {
    modalLink.href = cert.issuerLink;
    modalLink.style.display = 'inline-flex';
  } else {
    modalLink.style.display = 'none';
  }

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  modalCloseBtn.focus();
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
});

// Active nav highlight on scroll
const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const link = indexRoot.querySelector(`a[href="#${entry.target.id}"]`);
      if (!link) return;
      if (entry.isIntersecting) {
        indexRoot.querySelectorAll('a').forEach((a) => a.classList.remove('active'));
        link.classList.add('active');
      }
    });
  },
  { rootMargin: '-40% 0px -50% 0px' }
);

async function init() {
  renderSkeleton();
  CERT_SECTIONS.forEach((s) => {
    const el = document.getElementById(s.id);
    if (el) sectionObserver.observe(el);
  });

  try {
    const certs = await fetchAllCerts();
    renderCerts(certs);
  } catch (err) {
    console.error('Failed to load certifications:', err);
    sectionsRoot.innerHTML = `
      <div class="wrap" style="padding: 60px 0;">
        <p class="cert-empty">Couldn't load certifications right now. Check your connection and try again.</p>
      </div>
    `;
  }
}

init();
