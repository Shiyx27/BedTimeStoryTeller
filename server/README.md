DreamWeavers Server
====================

This small Express server proxies story and cover requests so your API keys stay on the server and are not exposed to the browser.

Setup
-----
1. Copy `.env.example` to `.env` and fill the values:

   - `GROQ_API_KEY` — your Groq API key (recommended)
   - `GROQ_ENDPOINT` — usually `https://api.groq.com/openai/v1/chat/completions`
   - (optional) `HF_TOKEN` and `HF_ENDPOINT` for Hugging Face fallback
   - `PORT` — port to listen on (defaults to 3000)

2. Install dependencies and start the server:

   ```powershell
   cd server
   npm install
   npm start
   ```

3. Open `index.html` from the project root in your browser, or host the client and server together.

Notes
-----
- The server will attempt Groq first (if `GROQ_API_KEY` is set), then Hugging Face if configured, and finally a local fallback story generator so the app remains functional offline.
- Cover images are proxied to Pollinations (no key required).
- For production, host the server on a secure endpoint (HTTPS) and set `SERVER_BASE` in the client if the server origin differs.

Security
--------
- Do not commit `.env` with real keys. Use environment variables on your host (e.g., Vercel/Heroku/Render/AWS) and deploy the server.

Troubleshooting
---------------
- If you get CORS errors when serving client from a different origin, either host the client via the same server or set `CORS` appropriately in `index.js`.
