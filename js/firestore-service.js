// ============================================================================
// Shared Firebase service. Both certs.html (read-only) and admin.html
// (read + write) import from this file so there's one place that talks to
// Firestore.
// ============================================================================

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js';
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js';

import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const CERTS_COLLECTION = 'certs';
const PROJECTS_COLLECTION = 'projects';

/**
 * Fetch every cert, ordered by section then display order.
 * Sorting by "order" happens client-side on purpose: Firestore requires a
 * manually-created composite index for multi-field orderBy() queries, which
 * is an unnecessary setup step for a small cert list like this.
 */
export async function fetchAllCerts() {
  const q = query(collection(db, CERTS_COLLECTION), orderBy('section'));
  const snap = await getDocs(q);
  const certs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  certs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return certs;
}

/** Group a flat cert array by section id, e.g. { agentic: [...], professional: [...] } */
export function groupBySection(certs) {
  return certs.reduce((acc, cert) => {
    (acc[cert.section] = acc[cert.section] || []).push(cert);
    return acc;
  }, {});
}

/** Add a new cert document. */
export async function addCert({ section, name, imageUrl, description, issuerLink, order }) {
  return addDoc(collection(db, CERTS_COLLECTION), {
    section,
    name,
    imageUrl,
    description: description || '',
    issuerLink,
    order: Number.isFinite(order) ? order : 0,
    createdAt: serverTimestamp()
  });
}

/** Update an existing cert document by id. */
export async function updateCert(id, fields) {
  return updateDoc(doc(db, CERTS_COLLECTION, id), fields);
}

/** Delete a cert document by id. */
export async function deleteCert(id) {
  return deleteDoc(doc(db, CERTS_COLLECTION, id));
}

// ============================================================================
// Projects — same collection/document pattern as certs above, kept separate
// on purpose (own page, own admin page) since a project's shape (github/demo/
// video links) is different from a cert's (image/issuer link).
// ============================================================================

/**
 * Fetch every project, ordered by display order.
 * Sorting is done client-side, same reasoning as fetchAllCerts() above.
 */
export async function fetchAllProjects() {
  const snap = await getDocs(collection(db, PROJECTS_COLLECTION));
  const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  projects.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return projects;
}

/** Add a new project document. */
export async function addProject({ name, description, githubLink, youtubeUrl, liveLink, order }) {
  return addDoc(collection(db, PROJECTS_COLLECTION), {
    name,
    description: description || '',
    githubLink: githubLink || '',
    youtubeUrl: youtubeUrl || '',
    liveLink: liveLink || '',
    order: Number.isFinite(order) ? order : 0,
    createdAt: serverTimestamp()
  });
}

/** Update an existing project document by id. */
export async function updateProject(id, fields) {
  return updateDoc(doc(db, PROJECTS_COLLECTION, id), fields);
}

/** Delete a project document by id. */
export async function deleteProject(id) {
  return deleteDoc(doc(db, PROJECTS_COLLECTION, id));
}

// ============================================================================
// Testimonials (Social Proof) — same pattern as projects. Each doc stores a
// name, quote, proof link (usually LinkedIn), and an optional screenshot URL.
// ============================================================================

const TESTIMONIALS_COLLECTION = 'testimonials';

/**
 * Fetch every testimonial, ordered by display order.
 */
export async function fetchAllTestimonials() {
  const snap = await getDocs(collection(db, TESTIMONIALS_COLLECTION));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return items;
}

/** Add a new testimonial document. */
export async function addTestimonial({ name, quote, link, imageUrl, order }) {
  return addDoc(collection(db, TESTIMONIALS_COLLECTION), {
    name,
    quote: quote || '',
    link: link || '',
    imageUrl: imageUrl || '',
    order: Number.isFinite(order) ? order : 0,
    createdAt: serverTimestamp()
  });
}

/** Update an existing testimonial document by id. */
export async function updateTestimonial(id, fields) {
  return updateDoc(doc(db, TESTIMONIALS_COLLECTION, id), fields);
}

/** Delete a testimonial document by id. */
export async function deleteTestimonial(id) {
  return deleteDoc(doc(db, TESTIMONIALS_COLLECTION, id));
}

/** Auth helpers */
export function loginAdmin(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function logoutAdmin() {
  return signOut(auth);
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}
