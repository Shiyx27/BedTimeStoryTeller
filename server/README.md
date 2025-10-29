# DreamWeavers ✨ - Children's Story Generator

A magical web app that creates personalized children's stories with AI-generated content and beautiful cover images.

## Quick Start

1. Copy `.env.example` to `.env` and add your API keys:
```bash
cd server
copy .env.example .env
```

2. Install dependencies and start the server:
```bash
cd server
npm install
npm start
```

3. Open your browser:
```
http://localhost:3000
```

## Features

- ✨ AI-powered story generation
- 🎨 Beautiful cover image generation
- 💾 Local storage for saved stories
- 📱 Fully responsive design
- 🌈 Delightful animations and effects
- ♿ Accessibility focused
- 🔒 API keys securely stored on server

## Development

The app consists of:
- `server/` - Express.js backend that handles API requests
- `server/public/` - Static files served by Express
- Environment variables in `.env` for API keys

## Security

- API keys are kept secure on the server
- Client never sees the actual API keys
- All requests are proxied through the backend
- CORS protection enabled
- Rate limiting on API endpoints


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
