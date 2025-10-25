# DreamWeavers — children's story generator

This is a small web app called "DreamWeavers" — create magical 600-word children's stories with a friendly UI, cover image generation, favorites, and a simple Google Sheets-backed backend via Google Apps Script.

Contents:
- `index.html` — frontend UI (vanilla JS, Tailwind)
- `styles.css` — tiny extra styles
- `script.js` — frontend logic
- `apps_script_Code.gs` — Google Apps Script backend to connect to Google Sheets, send signup emails, and call Gemini (if API key is set)

Overview
--------
Frontend is pure static and can be hosted on GitHub Pages or any static host. Backend is implemented as a Google Apps Script Web App which reads/writes a Google Sheet and uses `MailApp` to send emails and `UrlFetchApp` to call the Gemini API.

Why this architecture?
- Simple: no servers to manage (Google Apps Script + Sheets is free-tier friendly).
- Secure-ish: put the Gemini key into Apps Script Script Properties so it's not exposed in the client.

Setup steps
-----------
1. Prepare the Google Sheet
   - Create a new Google Sheet.
   - Rename (or add) two sheets (tabs) named `users` and `favorites`.
   - Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`).

2. Deploy the Apps Script backend
   - Open script.google.com and create a new project.
   - Copy the contents of `apps_script_Code.gs` into the script editor (create a file named `Code.gs`).
   - In the script editor, open `File -> Project properties -> Script properties` and add the following properties:
     - `SHEET_ID` = your Google Sheet ID (from step 1)
     - `GEMINI_API_KEY` = your Gemini API key (optional — without it, the script returns a simple fallback story)
     - `GEMINI_ENDPOINT` = optional endpoint for Gemini (default is set in the script)
   - Save, then choose `Deploy -> New deployment`.
   - Choose `Web app` type, give it a name, set "Execute as" to "Me", and "Who has access" to "Anyone" (or "Anyone with link"). Deploy and authorize the script; copy the Web App URL.

3. Configure the frontend
   - Edit `script.js` and set `CONFIG.APPS_SCRIPT_URL = '<YOUR_WEB_APP_URL>'`.
   - Save changes.

4. Host the frontend (free options)
   - Option A: GitHub Pages
     - Create a repository, push the files, enable GitHub Pages from the `main` branch root.
   - Option B: Netlify / Vercel (drag-and-drop static deploy works)

5. Gemini API notes
   - The Apps Script calls Gemini via UrlFetchApp with `Authorization: Bearer <GEMINI_API_KEY>`.
   - Ensure your Gemini API key and endpoint are correct for the Google Generative Models you have access to. You may need to adapt `apps_script_Code.gs` request format to match your exact Gemini API variant (some require different JSON fields or OAuth flows).

6. Pollinations image API
   - The frontend and backend construct a Pollinations URL like:
     `https://image.pollinations.ai/prompt/<prompt>`
   - Pollinations doesn't require a key for basic usage; the app uses it to generate a cover image URL.

Local run and testing
---------------------
- You can run the `index.html` locally in a browser (open file) for frontend-only testing. For full features, deploy the Apps Script and set `APPS_SCRIPT_URL`.

Security & limits
-----------------
- This is a demo-level auth system: passwords are hashed with SHA-256 and stored in the sheet. This is not production-grade. For production, use a proper authentication system (Firebase Auth, Auth0, etc.).
- Google Apps Script `MailApp` has daily quotas. Sending signup emails may be limited.
- Gemini API usage may incur costs and has rate limits.

Deployment suggestions
----------------------
- Frontend: GitHub Pages (free), Netlify (free tier), Vercel (free tier).
- Backend: Keep using Apps Script web app (free) or migrate to a small Node/Express app hosted on Render/Heroku/Railway if you need more control.

Next steps & improvements
-------------------------
- Improve authentication using Firebase Auth and store user records in Sheets or Firestore.
- Move Gemini calls server-side with a proper server (if you need higher throughput or better error handling).
- Add inline tests and input validation.

If you'd like, I can:
- Walk you through deploying the Apps Script and setting Script Properties.
- Adapt the Gemini call in `apps_script_Code.gs` to the exact Gemini API variant you have (paste the API docs or your key type).
- Add small UX polish like confetti when a story is saved.
