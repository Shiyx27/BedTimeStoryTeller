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