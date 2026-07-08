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
