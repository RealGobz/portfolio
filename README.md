# GOBZ Portfolio

Static site: hero/offer page, a certifications page backed by Firestore, and
a hidden `/admin.html` you use to manage certs. No build step — plain
HTML/CSS/JS, deploys straight to GitHub Pages.

```
index.html          Home page — name + offer (hand-edit this directly)
certs.html           Public certifications page (read-only, pulls from Firestore)
admin.html            Your cert management panel (login-gated)
projects.html          Public projects page (read-only, pulls from Firestore)
admin-projects.html     Your project management panel (login-gated)
css/style.css         Shared design system (colors, type, nav, buttons)
css/home.css           Home page styles + node-graph signature animation
css/certs.css          Certs page styles (section index, cards, modal)
css/admin.css           Admin panel styles (login, list, side panel)
css/projects.css        Projects page styles (full project blocks, video embed)
css/admin-projects.css  Admin projects page additions (row list, tags)
js/firebase-config.js   ⚠️ You must fill this in — see Step 1
js/constants.js         The 6 cert sections, in order — edit here to rename/reorder
js/firestore-service.js Shared read/write functions used by all four pages
js/certs-page.js        Renders certs.html from Firestore data
js/admin-page.js        Powers the cert admin login + add/edit/delete panel
js/projects-page.js     Renders projects.html from Firestore data
js/admin-projects-page.js Powers the project admin login + add/edit/delete panel
assets/gobz-logo.png    Your logo
```

---

## Step 1 — Create your Firebase project (~10 minutes)

You don't need to write any code for this part, just click through the
console.

1. Go to https://console.firebase.google.com and click **Add project**.
   Name it whatever you like (e.g. `gobz-portfolio`). You can decline
   Google Analytics — you don't need it.
2. Once the project is created, click the **`</>`** (web) icon on the
   project overview page to register a web app. Give it a nickname (e.g.
   `gobz-site`). You do **not** need Firebase Hosting here since we're
   using GitHub Pages instead.
3. Firebase will show you a `firebaseConfig` object with your keys. Copy
   it, then open `js/firebase-config.js` in this project and replace the
   placeholder values with your real ones. This file is safe to commit
   publicly — these are identifiers, not secrets. Access control happens
   in Firestore rules (Step 3), not by hiding this file.
4. In the left sidebar, go to **Build → Firestore Database → Create
   database**. Choose **Production mode** and pick a region close to you.
   You don't need to create any collections manually — the admin panel
   creates the `certs` collection automatically the first time you add a
   cert.
5. In the left sidebar, go to **Build → Authentication → Get started**.
   Enable the **Email/Password** provider (first option in the list).
6. Still in Authentication, go to the **Users** tab → **Add user**. Enter
   the email and password you want to use to log into `/admin.html`. This
   is the *only* account that will ever exist — there's no public sign-up
   form anywhere on the site.

## Step 2 — Lock down Firestore with security rules

In the Firebase console: **Firestore Database → Rules**, replace the
default rules with this, then click **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /certs/{certId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /projects/{projectId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

This means: anyone visiting `certs.html` or `projects.html` can read the
list (no login needed), but only someone signed in through `/admin.html`
or `/admin-projects.html` — i.e. you — can create, edit, or delete an
entry. Since you're the only user in Authentication, this fully locks
writes to you. If you already published the rules from before this
update, just replace them with the version above (adds the `projects`
match block) and click **Publish** again — nothing else changes.

## Step 3 — Hosting cert images

The admin panel's "Image URL" field expects a direct link to an image
file. A couple of easy ways to get one:

- **This same GitHub repo** (simplest, recommended): create a folder
  like `assets/certs/` in the repo, upload your cert images there, and
  use the "raw" URL format:
  `https://raw.githubusercontent.com/<your-username>/<your-repo>/main/assets/certs/<filename>.png`
- **Any other public image host** works too, as long as it's a direct
  link ending in an image file (not a page that displays the image).

## Step 4 — Edit your hero section

Open `index.html` and look for the block marked `EDIT-ME SECTION` near
the top of the `<body>`. Your name, offer line, and description live
there in plain text/HTML — edit and re-deploy anytime, no database
involved for this part.

## Step 5 — Test locally before deploying

Because the pages use ES module imports, opening `index.html` directly
as a `file://` URL won't work — it needs to be served over HTTP. From
the project folder, run:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000` in your browser. `certs.html` will
show "No certifications added to this section yet" for every section
until you add some via `/admin.html`.

## Step 6 — Deploy to GitHub Pages

1. Create a new GitHub repository (public or private — Pages works with
   either on a paid plan; public repos get free Pages on any plan).
2. Push this entire folder to the repo:
   ```
   git init
   git add .
   git commit -m "Initial portfolio site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
3. In the repo on GitHub: **Settings → Pages** → under "Build and
   deployment," set Source to **Deploy from a branch**, branch `main`,
   folder `/ (root)` → **Save**.
4. GitHub gives you a URL like `https://<your-username>.github.io/<your-repo>/`
   within a minute or two. That's your live site.
5. Your admin panel lives at
   `https://<your-username>.github.io/<your-repo>/admin.html` — it isn't
   linked from anywhere public, but remember the real protection is the
   Firestore rule + login from Step 2, not the URL being unlisted.

## Day-to-day use

- **Change your name/offer**: edit the `EDIT-ME SECTION` in `index.html`,
  commit, push. Live in ~1 minute.
- **Add a cert**: go to `/admin.html`, sign in, click **+ Add
  Certification**, fill in section/name/image URL/description/issuer
  link, **Save**. Appears on `certs.html` immediately.
- **Edit or delete a cert**: on `/admin.html`, click any cert card to
  open the same panel pre-filled, change what you need, **Save** — or
  use **Delete** at the bottom.
- **Add a new cert section, or rename one**: edit the `CERT_SECTIONS`
  array in `js/constants.js`. Both the admin panel and public page read
  from this file, so they can't drift out of sync.

---

# ADD PROJECTS SECTION

This section documents the update that added a **Projects** section to the
site, on top of everything above. Read this if you're updating your
already-live portfolio with these changes.

## What's new

- **`projects.html`** — a public page, linked from the nav bar and from a
  home-page teaser section (same pattern as the certs teaser), plus a
  "View Projects" button in the hero. At the top of the page is a
  **"View all on GitHub ↗"** button that goes straight to
  `https://github.com/RealGobz`.

  Each project renders as a full block (not a small card like certs):
  - Project name as the heading
  - Description underneath
  - An embedded YouTube video, if you added one
  - A **"Try it live ↗"** button under the video, if you added a live link
  - A **"See on GitHub ↗"** button, if you added a repo link

  Any piece you didn't fill in for a project (video, live link, GitHub
  link) is simply left out — there's no "no video" placeholder or
  disabled-looking button.

- **`admin-projects.html`** — a separate admin page (not merged into
  `admin.html`) for managing projects, gated behind the same
  email/password sign-in as your certs admin. Each project is listed as a
  clickable row; click one to edit it or delete it, or use **"+ Add
  Project"** to create a new one. The form asks for:
  - Project name (required)
  - Description (required)
  - GitHub repo link (optional — hides the GitHub button if blank)
  - YouTube video URL (optional — any watch/youtu.be/shorts link works)
  - Live demo link (optional — hides the "Try it live" button if blank)

  `admin.html` and `admin-projects.html` now cross-link each other in
  their nav bars ("Manage Projects" / "Manage Certs") so you can jump
  between the two without going back to the public site.

- **New files**: `projects.html`, `admin-projects.html`,
  `css/projects.css`, `css/admin-projects.css`, `js/projects-page.js`,
  `js/admin-projects-page.js`.
- **Edited files**: `js/firestore-service.js` (added `fetchAllProjects`,
  `addProject`, `updateProject`, `deleteProject` — same pattern as the
  cert functions, new `projects` collection), `index.html` (nav link,
  hero button, home teaser section), `certs.html` (nav link), `admin.html`
  (nav cross-link).
- Projects live in a new Firestore collection called `projects` — this is
  separate from `certs`, created automatically the first time you add a
  project from `admin-projects.html`, exactly like `certs` was.

## How to update your live site

1. **No new Firebase project needed.** This reuses the same
   `js/firebase-config.js` and the same login you already set up for
   certs — one account manages both certs and projects.

2. **Update your Firestore security rules** so the new `projects`
   collection is covered. In the Firebase console: **Firestore Database →
   Rules**, replace what's there with the updated rules shown earlier in
   this README (the version with both `certs` and `projects` match
   blocks), then **Publish**. Until you do this, `admin-projects.html`
   will fail to save with a permissions error.

3. **Copy all the files in this update into your repo**, preserving the
   folder structure (`projects.html` and `admin-projects.html` at the
   root next to `index.html`; the two new CSS files into `css/`; the two
   new JS files into `js/`; and the edited `firestore-service.js`,
   `index.html`, `certs.html`, `admin.html` overwriting what's there).

4. **Test locally first** (same as Step 5 earlier in this README):
   ```
   python3 -m http.server 8000
   ```
   Visit `http://localhost:8000/projects.html` — it'll say "No projects
   added yet" until you add some. Visit
   `http://localhost:8000/admin-projects.html`, sign in with your
   existing admin account, and try adding a project.

5. **Commit and push**, same as before:
   ```
   git add .
   git commit -m "Add projects section"
   git push
   ```
   GitHub Pages will pick it up in a minute or two.

6. **Add your projects**: go to `/admin-projects.html`, sign in, click
   **+ Add Project**, fill in the fields, **Save**. It appears on
   `projects.html` immediately.

## A couple of judgment calls made building this

- **GitHub link, video, and live link are all optional** at the form
  level — only name and description are required — since you said to
  ask for them "if there were" one. In practice you'll usually fill in
  GitHub, since the public page's whole point is a repo link, but nothing
  stops you from publishing a project with just a name and description.
- **Project ordering** works the same way certs do internally: new
  projects go to the end of the list (`order` field, auto-incremented).
  There's no drag-and-drop reordering in the admin UI — if you want to
  reorder later, that'd be a small follow-up feature, not something in
  this update.
- **YouTube-only for video**: the form takes a YouTube URL and embeds it
  as an iframe. It does not accept uploaded video files or other hosts
  (Vimeo, etc.) — say the word if you want that added later.
