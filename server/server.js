// DreamWeavers Server
// Securely handles API requests and serves static files

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');
const app = express();

// Load environment variables
dotenv.config();

// Basic Configuration
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV === 'development';

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(cors()); // In production, configure with specific origins
app.use(express.json({ limit: '1mb' }));
app.use(limiter);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Story generation endpoint
app.post('/api/story', async (req, res) => {
  try {
    const userInput = req.body || {};
    const prompt = buildPrompt(userInput);

    // Try GROQ if configured
    if (process.env.GROQ_API_KEY) {
      try {
        const story = await generateWithGroq(prompt);
        return res.json({ text: story });
      } catch (e) {
        console.warn('GROQ generation failed:', e.message);
        // Continue to fallback
      }
    }

    // Try Hugging Face if configured
    if (process.env.HF_TOKEN) {
      try {
        const story = await generateWithHuggingFace(prompt);
        return res.json({ text: story });
      } catch (e) {
        console.warn('HuggingFace generation failed:', e.message);
      }
    }

    // Final fallback: local generator
    const fallback = generateLocalStory(userInput);
    return res.json({ text: fallback });

  } catch (err) {
    console.error('Story generation error:', err);
    res.status(500).json({ 
      error: 'Failed to generate story',
      details: isDev ? err.message : undefined
    });
  }
});

// Cover image endpoint
app.post('/api/cover', async (req, res) => {
  try {
    const prompt = (req.body && req.body.prompt) 
      ? req.body.prompt 
      : 'Cute children\'s book illustration';
    
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true`;
    return res.json({ url });
  } catch (e) {
    console.error('Cover generation error:', e);
    res.status(500).json({ 
      error: 'Failed to generate cover',
      details: isDev ? e.message : undefined
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    env: isDev ? 'development' : 'production',
    timestamp: new Date().toISOString()
  });
});

// Story generation helper functions
function buildPrompt({ userName, userWorld, mood = 'adventure' }) {
  const prompts = {
    adventure: `Create an exciting 600-word children's adventure story where ${userName} discovers incredible secrets and overcomes challenges in ${userWorld}. Include magic, friendship, and courage. The story should have:
1. A mysterious discovery or magical event that starts the adventure
2. A friendly magical companion who helps ${userName}
3. An interesting challenge or puzzle to solve
4. A moment where ${userName}'s creativity or kindness makes a difference
5. A satisfying ending with a positive message`,
    whimsical: `Create a charming 600-word children's story full of wonder and whimsy, following ${userName}'s magical day in ${userWorld}. Include:
1. Delightful magical creatures or talking objects
2. Unexpected transformations or enchantments
3. Playful situations and gentle humor
4. A touch of mischief that leads to learning
5. A heartwarming conclusion about imagination or friendship`,
    mysterious: `Create an intriguing 600-word children's mystery story where ${userName} uncovers secrets in ${userWorld}. Include:
1. A puzzling situation or magical mystery
2. Hidden clues and magical hints
3. A clever magical helper or wise friend
4. A surprising but satisfying discovery
5. A meaningful lesson about curiosity and wisdom`
  };

  return `You are a master storyteller for children ages 5-10. Write an enchanting story that's engaging, age-appropriate, and meaningful.

${prompts[mood] || prompts.adventure}

Format your response EXACTLY like this:
TITLE: [A creative, captivating title]

STORY:
[Your 600-word story in well-structured paragraphs. Use vivid descriptions, engaging dialogue, and proper pacing. Make the story flow naturally with a clear beginning, middle, and end.]

MORAL:
[A thoughtful moral lesson in 1-2 sentences that fits the story naturally]

Writing guidelines:
- Maintain a consistent, engaging narrative voice
- Use age-appropriate language and concepts
- Create memorable characters and vivid scenes
- Include dialogue that moves the story forward
- End with hope and inspiration`;
}

async function generateWithGroq(prompt) {
  const body = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { 
        role: 'system', 
        content: 'You are a creative children\'s story writer. Write magical, heartwarming stories for ages 5-10.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.8,
    max_tokens: 1500
  };

  const resp = await axios.post(
    process.env.GROQ_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions',
    body,
    {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  if (resp.data?.choices?.[0]?.message?.content) {
    return resp.data.choices[0].message.content;
  }
  throw new Error('Unexpected GROQ response format');
}

async function generateWithHuggingFace(prompt) {
  const payload = {
    inputs: prompt,
    parameters: {
      max_new_tokens: 1500,
      temperature: 0.8,
      return_full_text: false
    }
  };

  const resp = await axios.post(
    process.env.HF_ENDPOINT,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  const data = resp.data;
  if (data?.generated_text) return data.generated_text;
  if (Array.isArray(data) && data[0]?.generated_text) return data[0].generated_text;
  throw new Error('Unexpected HuggingFace response format');
}

function generateLocalStory({ userName = 'Friend', userWorld = 'a magical place', userSidekick = 'a kind companion', userTheme = 'friendship' }) {
  const paragraphs = [
    `${userName} lived in ${userWorld}, where small wonders hummed in the air and ${userSidekick} kept them company.`,
    `One day, ${userName} and ${userSidekick} discovered a glowing path that seemed to lead to adventure. The air sparkled with possibility, and ${userName}'s heart danced with excitement.`,
    `Together, they learned about ${userTheme} in ways they never expected. Every step brought new magic, every moment held a lesson, and every smile they shared made their bond stronger.`,
    `At the heart of their journey, they found that the greatest treasure wasn't gold or jewels - it was the warmth of helping others and the joy of true friendship.`,
    `As the sun set on their adventure, ${userName} and ${userSidekick} knew they'd always remember this magical day, and the precious gift of having each other to share it with.`
  ];

  const story = paragraphs.join('\n\n');
  return `TITLE: ${userName}'s Magical Day\n\nSTORY:\n${story}\n\nMORAL:\nThe greatest magic of all lives in our hearts, and grows stronger when we share it with others.`;
}

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: isDev ? err.message : undefined
  });
});

// Start server
/*app.listen(PORT, () => {
  console.log(`
🌟 DreamWeavers server running!
🚀 URL: http://localhost:${PORT}
🔒 Mode: ${isDev ? 'development' : 'production'}
✨ Static files: ${path.join(__dirname, 'public')}
  `);
});*/

module.exports = app;