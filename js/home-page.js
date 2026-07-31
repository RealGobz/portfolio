// ============================================================================
// Home page — loads testimonials from Firestore and renders them as social
// proof cards above the contact section.
// ============================================================================

import { fetchAllTestimonials } from './firestore-service.js';

const grid = document.getElementById('social-proof-grid');

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

async function loadTestimonials() {
  try {
    const testimonials = await fetchAllTestimonials();

    if (testimonials.length === 0) {
      // Hide the entire section if there are no testimonials
      const section = document.getElementById('social-proof');
      if (section) section.style.display = 'none';
      return;
    }

    grid.innerHTML = testimonials.map((t) => `
      <a href="${escapeHtml(t.link)}" target="_blank" rel="noopener" class="proof-card" id="proof-card-${t.id}">
        <div class="proof-card-header">
          <div class="proof-card-avatar">${escapeHtml((t.name || '?')[0].toUpperCase())}</div>
          <div class="proof-card-name">${escapeHtml(t.name)}</div>
        </div>
        <blockquote class="proof-card-quote">"${escapeHtml(t.quote)}"</blockquote>
        ${t.imageUrl ? `
          <div class="proof-card-screenshot">
            <img src="${escapeHtml(t.imageUrl)}" alt="Screenshot of testimonial from ${escapeHtml(t.name)}" loading="lazy" />
          </div>
        ` : ''}
        <div class="proof-card-link">
          <span>View proof ↗</span>
        </div>
      </a>
    `).join('');
  } catch (err) {
    console.error('Failed to load testimonials:', err);
  }
}

loadTestimonials();
