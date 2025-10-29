// ===================================================================
// !!! CRITICAL: UPDATE THIS URL WHEN YOU DEPLOY !!!
// ===================================================================
// This is the public URL of your Vercel app.
// It's needed for Twitter, LinkedIn, etc. to create share links.
// Example: 'https://dreamweavers.vercel.app'
// ===================================================================
const DEPLOYED_URL = 'https://YOUR_APP_NAME.vercel.app';
// ===================================================================

// Configuration
const CONFIG = {
  STORY_ENDPOINT: '/api/story',
  STORAGE_KEYS: {
    NAME: 'dw_name',
    STORIES: 'dw_stories',
    THEME: 'dw_theme',
    FONT_SIZE: 'dw_font_size'
  },
  MAX_STORIES: 10,
  TYPEWRITER_SPEED_MS: 20,
  THEMES: [
    { name: 'light', icon: '☀️' },
    { name: 'dark', icon: '🌙' },
    { name: 'evening', icon: '🌆' },
    { name: 'fairy', icon: '🧚' },
    { name: 'underwater', icon: '🌊' }
  ],
  FONT_SIZES: ['small', 'medium', 'large'],
  MAGIC_WORDS: ['magic', 'magical', 'wonder', 'wonderful', 'enchanted', 'sparkle', 'dream', 'gleam', 'glow', 'glowing', 'fairy', 'dragon', 'wizard', 'spell', 'potion'],
  DICTIONARY: {
    'adventure': 'An exciting and unusual journey or experience.',
    'mysterious': 'Something that is hard to understand or explain; a secret.',
    'kingdom': 'A country or land ruled by a king or queen.',
    'ancient': 'Something that is very, very old.',
    'companion': 'A friend who is with you or travels with you.',
    'quest': 'A long search for something important.',
    'discover': 'To find something new or that was hidden.',
    'courageous': 'To be brave, even when you are scared.',
    'whisper': 'To speak very quietly, using your breath.',
    'feast': 'A very large and special meal with lots of food.'
  }
};

// Storage utilities
const saveToStorage = (k, v) => {
  try {
    localStorage.setItem(k, v);
  } catch (e) {
    console.warn('save failed', e);
  }
};
const loadFromStorage = (k) => {
  try {
    return localStorage.getItem(k);
  } catch (e) {
    return null;
  }
};

// Modal helpers
let _lastFocused = null;
const showModal = (id) => {
  const m = document.getElementById(id);
  if (!m) return;
  _lastFocused = document.activeElement;
  m.classList.add('active');
  document.body.style.overflow = 'hidden';
  const focusable = m.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable) focusable.focus();
};
const hideModal = (id) => {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('active');
  document.body.style.overflow = 'auto';
  try {
    if (_lastFocused) _lastFocused.focus();
  } catch (e) {}
};

// Debounce helper
const debounce = (fn, wait = 250) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
};

// --- REMOVED: tsParticles init ---

// --- NEW: Stardust Cursor Trail ---
function initStardustTrail() {
  const trailContainer = document.getElementById('stardust-trail');
  if (!trailContainer) return;
  
  let lastPos = { x: 0, y: 0 };
  let isMoving = false;
  
  window.addEventListener('pointermove', (e) => {
    if (Math.abs(e.clientX - lastPos.x) < 5 && Math.abs(e.clientY - lastPos.y) < 5) {
      isMoving = false;
      return;
    }
    isMoving = true;
    lastPos = { x: e.clientX, y: e.clientY };

    const star = document.createElement('div');
    star.className = 'stardust';
    const size = Math.random() * 5 + 2; // 2px to 7px
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${e.clientX}px`;
    star.style.top = `${e.clientY}px`;
    
    trailContainer.appendChild(star);
    
    setTimeout(() => {
      star.remove();
    }, 800); // Match animation duration
  });
}

// --- NEW: 3D Tilt Effect for Buttons ---
function initTiltEffect() {
  const tiltElements = document.querySelectorAll('[data-tilt]');
  tiltElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const rotateY = (x / rect.width) * 20; // Max 10deg rotation
      const rotateX = (y / rect.height) * -20; // Max -10deg rotation
      
      el.style.transition = 'transform 0.1s ease-out';
      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
      el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
  });
}


// --- Simple WebAudio sound effects ---
const AudioSFX = {
  ctx: null,
  init() {
    if (!this.ctx)
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  },
  playTone(freq = 440, duration = 0.11, type = 'sine') {
    try {
      this.init();
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 0.01);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start();
      o.stop(this.ctx.currentTime + duration);
      g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
    } catch (e) { /* ignore */ }
  },
  click() { this.playTone(880, 0.08, 'sine'); },
  success() { this.playTone(520, 0.26, 'sawtooth'); },
  pop() { this.playTone(660, 0.12, 'triangle'); },
};

function attachSfx(el, type = 'click') {
  if (!el) return;
  el.addEventListener(
    'pointerdown',
    () => {
      try {
        if (type === 'success') AudioSFX.success();
        else if (type === 'pop') AudioSFX.pop();
        else AudioSFX.click();
      } catch (e) {}
    },
    { passive: true }
  );
}

// Fallback story generator
function fallbackLocalStory({ userName, userWorld }) {
  const title = `${userName} in the ${userWorld}`;
  const story = `${userName} had a gentle adventure in ${userWorld}. It was full of wonder, small challenges, kind friends, and a warm ending.`;
  return { title, story };
}

// API functions
async function fetchStory(userInput) {
  try {
    const res = await fetch(CONFIG.STORY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userInput),
    });
    if (!res.ok) throw new Error('server');
    const json = await res.json();
    if (json && json.text) return parseApiText(json.text);
    throw new Error('bad');
  } catch (e) {
    const f = fallbackLocalStory(userInput);
    return f;
  }
}

function parseApiText(text) {
  const result = { title: 'A Magical Story', story: text, moral: '' };
  try {
    const titleMatch = text.match(/TITLE:\s*(.*)/i);
    if (titleMatch) result.title = titleMatch[1].trim();
    const storyMatch = text.match(/STORY:\s*([\s\S]*?)(?:\n\nMORAL:|$)/i);
    if (storyMatch) result.story = storyMatch[1].trim();
    const moralMatch = text.match(/MORAL:\s*([\s\S]*$)/i);
    if (moralMatch) result.moral = moralMatch[1].trim();
  } catch (e) { result.story = text; }
  return result;
}

// Storage functions
function saveStory(obj) {
  try {
    const raw = loadFromStorage(CONFIG.STORAGE_KEYS.STORIES);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift(obj);
    if (arr.length > CONFIG.MAX_STORIES) {
      arr.splice(CONFIG.MAX_STORIES);
    }
    saveToStorage(CONFIG.STORAGE_KEYS.STORIES, JSON.stringify(arr));
  } catch (e) { console.warn('saveStory failed', e); }
}

function attachImageToLastSaved(url) {
  try {
    const raw = loadFromStorage(CONFIG.STORAGE_KEYS.STORIES);
    const arr = raw ? JSON.parse(raw) : [];
    if (arr.length === 0) return;
    arr[0].image = url;
    saveToStorage(CONFIG.STORAGE_KEYS.STORIES, JSON.stringify(arr));
  } catch (e) { console.warn('attachImage failed', e); }
}

// Display story stats (part 1 of display)
function displayStory(obj) {
  const titleEl = document.getElementById('storyTitle');
  const moralEl = document.querySelector('.moral');
  const statsEl = document.getElementById('storyStats');

  titleEl.textContent = obj.title;
  moralEl.textContent = obj.moral || '';

  const story = obj.story || '';
  const wordCount = story.split(' ').filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const magicalWords = story.toLowerCase().match(new RegExp(CONFIG.MAGIC_WORDS.join('|'), 'gi'))?.length || 0;
  
  statsEl.innerHTML = `
    <div class="stat-item">
      <div class="value">${wordCount}</div>
      <div class="label">Words</div>
    </div>
    <div class="stat-item">
      <div class="value">~${readingTime} min</div>
      <div class="label">Reading Time</div>
    </div>
    <div class="stat-item">
      <div class="value">✨ ${magicalWords}</div>
      <div class="label">Magical Words</div>
    </div>
  `;

  const disp = document.getElementById('storyDisplay');
  disp.classList.remove('hidden');
  disp.style.display = 'block';

  try {
    const card = disp;
    card.classList.add('enter');
    setTimeout(() => card.classList.remove('enter'), 600);
  } catch (e) {}

  disp.scrollIntoView({ behavior: 'smooth' });
  
  const storySnippet = story.split(' ').slice(0, 100).join(' ');
  autoGenerateImage(storySnippet || obj.title || 'Cute children book illustration');

  return story;
}

// "Magic Typewriter" function (part 2 of display)
async function animateStoryText(storyText) {
  const bodyEl = document.getElementById('storyBody');
  bodyEl.innerHTML = '';
  let wordSpans = [];

  const paragraphs = storyText.split('\n\n');
  
  paragraphs.forEach(pText => {
    const pEl = document.createElement('p');
    const words = pText.split(' ');
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      const span = document.createElement('span');
      span.className = 'story-word';
      span.textContent = word + ' ';
      
      if (CONFIG.DICTIONARY[cleanWord]) {
        span.classList.add('dictionary-word');
        span.dataset.word = cleanWord;
      }
      else if (CONFIG.MAGIC_WORDS.includes(cleanWord)) {
        span.classList.add('magic-word');
      }
      
      pEl.appendChild(span);
      wordSpans.push(span);
    });
    bodyEl.appendChild(pEl);
  });

  let delay = 0;
  wordSpans.forEach(span => {
    setTimeout(() => {
      span.style.opacity = '1';
      span.style.transform = 'none';
    }, delay);
    delay += CONFIG.TYPEWRITER_SPEED_MS;
  });

  return new Promise(resolve => {
    setTimeout(resolve, delay);
  });
}


// Auto image generation
async function autoGenerateImage(storySnippet) {
  const imgEl = document.getElementById('storyImage');
  const genBtn = document.getElementById('generateImageBtn');
  const prompt = `${storySnippet} — whimsical children book illustration, colorful, soft, kid-friendly, high detail, vibrant colors, fantasy art style`;

  if (genBtn) {
    genBtn.disabled = true;
    genBtn.textContent = 'Generating Image...';
  }
  imgEl.classList.add('hidden'); 

  try {
    const resp = await fetch('/api/cover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const j = await resp.json();

    if (j && j.url) {
      imgEl.src = j.url;
      imgEl.classList.remove('hidden');
      try {
        attachImageToLastSaved(j.url);
      } catch (e) { console.warn('Failed to attach image to story:', e); }
    }
  } catch (e) {
    console.warn('Image generation failed:', e);
  } finally {
    if (genBtn) {
      genBtn.disabled = false;
      genBtn.textContent = '🎨 Re-Generate Image';
    }
  }
}

// Past stories modal
function viewPastStories() {
  showModal('pastModal');
  const content = document.getElementById('pastContent');
  content.innerHTML = '';
  const arr = JSON.parse(
    loadFromStorage(CONFIG.STORAGE_KEYS.STORIES) || '[]'
  );
  if (arr.length === 0) {
    content.innerHTML =
      '<div style="text-align:center;color:var(--text-muted);padding:24px">No stories yet</div>';
    return;
  }
  arr.forEach((s) => {
    const d = document.createElement('div');
    d.innerHTML = `<strong>${
      s.title
    }</strong><div style="font-size:12px;color:var(--text-muted);">${new Date(
      s.timestamp
    ).toLocaleString()}</div>`;
    d.addEventListener('click', () => {
      hideModal('pastModal');
      const storyText = displayStory(s);
      animateStoryText(storyText);
    });
    content.appendChild(d);
  });
}

function closePastStories() {
  hideModal('pastModal');
}

// --- Main App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('storyForm');
  const nameInput = document.getElementById('userName');
  const worldCustom = document.getElementById('customWorld');
  const customMood = document.getElementById('customMood');

  // === Theme Toggle Logic ===
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = themeToggle.querySelector('span');
  let currentThemeIndex = CONFIG.THEMES.findIndex(t => t.name === (loadFromStorage(CONFIG.STORAGE_KEYS.THEME) || 'light'));
  if (currentThemeIndex === -1) currentThemeIndex = 0;
  
  const setTheme = (index) => {
    const theme = CONFIG.THEMES[index];
    document.body.dataset.theme = theme.name;
    themeIcon.textContent = theme.icon;
    saveToStorage(CONFIG.STORAGE_KEYS.THEME, theme.name);
  };
  
  setTheme(currentThemeIndex);

  themeToggle.addEventListener('click', () => {
    currentThemeIndex = (currentThemeIndex + 1) % CONFIG.THEMES.length;
    setTheme(currentThemeIndex);
    AudioSFX.pop();
  });
  
  // === Font Size Toggle Logic ===
  const fontToggleBtn = document.getElementById('fontToggleBtn');
  let currentFontIndex = CONFIG.FONT_SIZES.findIndex(s => s === (loadFromStorage(CONFIG.STORAGE_KEYS.FONT_SIZE) || 'medium'));
  if (currentFontIndex === -1) currentFontIndex = 1;

  const setFontSize = (index) => {
    const size = CONFIG.FONT_SIZES[index];
    document.body.dataset.fontSize = size;
    saveToStorage(CONFIG.STORAGE_KEYS.FONT_SIZE, size);
  };

  setFontSize(currentFontIndex);

  fontToggleBtn.addEventListener('click', () => {
    currentFontIndex = (currentFontIndex + 1) % CONFIG.FONT_SIZES.length;
    setFontSize(currentFontIndex);
    AudioSFX.pop();
  });
  
  // === Load Saved Name ===
  const n = loadFromStorage(CONFIG.STORAGE_KEYS.NAME);
  if (n) nameInput.value = n;

  // === Hero Buttons ===
  const heroCreate = document.getElementById('heroCreate');
  const heroExplore = document.getElementById('heroExplore');
  if (heroCreate)
    heroCreate.addEventListener('click', () => {
      nameInput.focus();
      const formTop = form.offsetTop || 0;
      window.scrollTo({ top: formTop - 60, behavior: 'smooth' });
    });
  if (heroExplore)
    heroExplore.addEventListener('click', () => {
      viewPastStories();
    });

  attachSfx(heroCreate, 'click');
  attachSfx(heroExplore, 'click');

  // === Auto-save name ===
  nameInput.addEventListener(
    'input',
    debounce((e) => saveToStorage(CONFIG.STORAGE_KEYS.NAME, e.target.value), 300)
  );

  // === Show/hide custom inputs ===
  form.addEventListener('change', (e) => {
    if (e.target.name === 'userWorld') {
      worldCustom.classList.toggle('hidden', e.target.value !== 'custom');
      if (e.target.value === 'custom') worldCustom.focus();
    }
    if (e.target.name === 'userMood') {
      customMood.classList.toggle('hidden', e.target.value !== 'custom');
      if (e.target.value === 'custom') customMood.focus();
    }
  });

  // === Story Generation ===
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const userName = (nameInput.value || '').trim();
    if (!userName) {
      alert('Please enter a name');
      return;
    }

    const worldRadio = document.querySelector('input[name="userWorld"]:checked');
    const userWorld =
      worldRadio && worldRadio.value === 'custom'
        ? worldCustom.value || 'a magical place'
        : (worldRadio ? worldRadio.value : 'Enchanted Forest');

    const moodRadio = document.querySelector('input[name="userMood"]:checked');
    const userMood =
      moodRadio && moodRadio.value === 'custom'
        ? customMood.value || 'adventure'
        : (moodRadio ? moodRadio.value : 'adventure');

    const input = { userName, userWorld, mood: userMood };
    
    // Show skeleton loading
    const disp = document.getElementById('storyDisplay');
    const titleEl = document.getElementById('storyTitle');
    const bodyEl = document.getElementById('storyBody');
    const moralEl = document.querySelector('.moral');
    const imgEl = document.getElementById('storyImage');
    const statsEl = document.getElementById('storyStats');
    
    disp.classList.remove('hidden');
    disp.style.display = 'block';
    imgEl.classList.add('hidden');
    moralEl.textContent = '';
    titleEl.innerHTML = '<div class="skeleton title"></div>';
    bodyEl.innerHTML = `
      <div class="skeleton line"></div>
      <div class="skeleton line"></div>
      <div class="skeleton line"></div>
    `;
    statsEl.innerHTML = `
      <div class="stat-item"><div class="skeleton value"></div><div class="skeleton label"></div></div>
      <div class="stat-item"><div class="skeleton value"></div><div class="skeleton label"></div></div>
      <div class="stat-item"><div class="skeleton value"></div><div class="skeleton label"></div></div>
    `;
    
    disp.scrollIntoView({ behavior: 'smooth' });

    const res = await fetchStory(input);
    const payload = {
      title: res.title,
      story: res.story,
      moral: res.moral || '',
      timestamp: new Date().toISOString(),
    };
    saveStory(payload);
    
    const storyText = displayStory(payload);
    await animateStoryText(storyText);

    try {
      if (window.confetti)
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } catch (e) {}
  });

  // Image generation button
  const genImgBtn = document.getElementById('generateImageBtn');
  if (genImgBtn) {
    genImgBtn.addEventListener('click', async () => {
      const storyText = document.getElementById('storyBody').textContent.split(' ').slice(0, 100).join(' ');
      autoGenerateImage(storyText || 'Cute children book illustration');
      attachSfx(genImgBtn, 'pop');
    });
  }
  
  // === Dual Parallax Hero Effect ===
  const p1 = document.getElementById('parallax-1');
  const p2 = document.getElementById('parallax-2');
  function handleParallax(ev) {
    if (!p1 || !p2) return;
    try {
      const bounds = document.body.getBoundingClientRect();
      const x = (ev.clientX - bounds.left) / bounds.width - 0.5;
      const y = (ev.clientY - bounds.top) / bounds.height - 0.5;
      p1.style.transform = `translate(${x * 30}px, ${y * 20}px)`;
      p2.style.transform = `translate(${x * -15}px, ${y * -10}px)`;
    } catch (e) {}
  }
  window.addEventListener('pointermove', handleParallax);

  // Story action buttons
  const shareBtn = document.getElementById('shareStoryBtn');
  const newBtn = document.getElementById('newStoryBtn');
  const regenBtn = document.getElementById('regenerateBtn');
  
  if (shareBtn)
    shareBtn.addEventListener('click', () => showModal('shareModal'));
    
  // Favorite toggle
  const favBtn = document.getElementById('favoriteBtn');
  const showToast = (msg) => {
    let t = document.getElementById('dw-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'dw-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    t.style.transform = 'translateY(0)';
    clearTimeout(t._hide);
    t._hide = setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(10px)';
    }, 2500);
  };
  
  if (favBtn) {
    favBtn.addEventListener('click', () => {
      const title = document.getElementById('storyTitle').textContent || '';
      if (!title) return showToast('No story to favorite yet');
      const raw = loadFromStorage('dw_favorites') || '[]';
      const arr = JSON.parse(raw);
      const idx = arr.indexOf(title);
      let msg = '';
      if (idx === -1) {
        arr.push(title);
        msg = 'Added to favorites ⭐';
        favBtn.classList.add('active');
      } else {
        arr.splice(idx, 1);
        msg = 'Removed from favorites';
        favBtn.classList.remove('active');
      }
      saveToStorage('dw_favorites', JSON.stringify(arr));
      showToast(msg);
      try {
        if (window.confetti)
          confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      } catch (e) {}
      attachSfx(favBtn, 'success');
    });
  }

  // === Dictionary Click Listener ===
  const storyBody = document.getElementById('storyBody');
  storyBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('dictionary-word')) {
      const word = e.target.dataset.word;
      const definition = CONFIG.DICTIONARY[word];
      if (definition) {
        document.getElementById('dictionaryWord').textContent = word;
        document.getElementById('dictionaryDefinition').textContent = definition;
        showModal('dictionaryModal');
      }
    }
  });

  // Read aloud
  const readBtn = document.getElementById('readAloudBtn');
  let synthUtter = null;
  if (readBtn) {
    readBtn.addEventListener('click', () => {
      const bodyEl = document.getElementById('storyBody');
      if (!bodyEl || !bodyEl.textContent.trim())
        return showToast('No story yet');
      if (!window.speechSynthesis)
        return showToast('Read-aloud not supported in this browser');
      
      if (synthUtter && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        return;
      }
      
      const title = document.getElementById('storyTitle').textContent || '';
      const moral = (document.querySelector('.moral') || {}).textContent || '';
      const spans = Array.from(
        document.querySelectorAll('#storyBody .story-word')
      );
      const text = title + ' ' + spans.map(s => s.textContent).join(' ') + ' ' + moral;

      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.pitch = 1.05;
      u.lang = 'en-US';

      const clearHighlights = () =>
        spans.forEach((s) => s.classList.remove('highlight'));

      let currentWordIndex = -1;

      u.onboundary = (ev) => {
        if (ev.name !== 'word') return;
        try {
          const charIndex = ev.charIndex || 0;
          let cum = title.length + 1;
          for (let i = 0; i < spans.length; i++) {
            const wordLength = spans[i].textContent.length;
            if (charIndex >= cum && charIndex < cum + wordLength) {
              if (currentWordIndex !== i) {
                clearHighlights();
                spans[i].classList.add('highlight');
                currentWordIndex = i;
                
                if(i % 10 === 0) { // Auto-scroll
                  spans[i].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                  });
                }
              }
              break;
            }
            cum += wordLength;
          }
        } catch (e) { /* ignore */ }
      };

      u.onstart = () => { readBtn.textContent = '⏹️'; readBtn.classList.add('active'); };
      u.onend = () => {
        readBtn.textContent = '🔊';
        readBtn.classList.remove('active');
        clearHighlights();
        synthUtter = null;
      };
      u.onerror = () => {
        readBtn.textContent = '🔊';
        readBtn.classList.remove('active');
        clearHighlights();
        synthUtter = null;
      };
      
      synthUtter = u;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    });
  }

  // === CRITICAL FIX: Share modal actions ===
  document.querySelectorAll('.share-btn').forEach((b) => {
    b.addEventListener('click', async (e) => {
      
      if (DEPLOYED_URL === 'https://YOUR_APP_NAME.vercel.app' && b.dataset.platform !== 'copy' && b.dataset.platform !== 'email' && b.dataset.platform !== 'whatsapp') {
          alert('CRITICAL: Please update the `DEPLOYED_URL` constant in app.js with your Vercel URL first!');
          return;
      }

      const platform = b.dataset.platform;
      const title = document.getElementById('storyTitle').textContent || 'A Magical Story';
      const body = document.getElementById('storyBody').innerText || 'I created a story!';
      
      const fullText = `${title}\n\n${body}`;
      const summary = body.slice(0, 150) + '...';

      if (b.classList.contains('copy-link')) {
        try {
          await navigator.clipboard.writeText(fullText);
          showToast('Story copied to clipboard');
        } catch (e) { showToast('Copy failed'); }
        hideModal('shareModal');
        return;
      }
      
      let url = '';
      
      if (platform === 'twitter') {
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title + ':\n' + summary)}&url=${encodeURIComponent(DEPLOYED_URL)}`;
      }
      if (platform === 'facebook') {
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(DEPLOYED_URL)}&quote=${encodeURIComponent(title)}`;
      }
      if (platform === 'linkedin') {
        url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(DEPLOYED_URL)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`;
      }
      if (platform === 'whatsapp') {
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText + '\n\nRead more at: ' + DEPLOYED_URL)}`;
      }
      if (platform === 'email') {
        url = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('I created a magical story with DreamWeavers!\n\n' + fullText + '\n\nRead it online:\n' + DEPLOYED_URL)}`;
        window.location.href = url;
        hideModal('shareModal');
        return;
      }

      if (url) { window.open(url, '_blank', 'noopener,noreferrer'); }
      hideModal('shareModal');
    });
    attachSfx(b, 'click');
  });

  // PDF download
  document.querySelectorAll('.download-pdf').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) return showToast('PDF library missing');
        const title =
          document.getElementById('storyTitle').textContent || 'My Story';
        const body = Array.from(
          document.querySelectorAll('#storyBody p')
        )
          .map((p) => p.innerText)
          .join('\n\n');
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const margin = 40;
        
        doc.setFillColor(250, 250, 255);
        doc.rect(
          0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F'
        );
        doc.setFontSize(34);
        doc.setTextColor(58, 47, 107);
        doc.text(title, doc.internal.pageSize.getWidth() / 2, 160, {
          align: 'center',
        });
        doc.setFontSize(14);
        const author = (document.getElementById('userName') || {}).value || '';
        if (author)
          doc.text(
            `by ${author}`, doc.internal.pageSize.getWidth() / 2, 200, { align: 'center' }
          );
        doc.setFontSize(10);
        doc.setTextColor(110, 118, 130);
        doc.text(
          new Date().toLocaleString(), doc.internal.pageSize.getWidth() / 2, 228, { align: 'center' }
        );
        doc.addPage();
        
        let storyTextY = 80;
        const imgEl = document.getElementById('storyImage');
        if (imgEl && imgEl.src && !imgEl.classList.contains('hidden')) {
          try {
             const resp = await fetch(imgEl.src);
             const blob = await resp.blob();
             const dataUrl = await new Promise((resolve, reject) => {
               const r = new FileReader();
               r.onload = () => resolve(r.result);
               r.onerror = reject;
               r.readAsDataURL(blob);
             });
            
            const imgProps = doc.getImageProperties(dataUrl);
            const pdfWidth = doc.internal.pageSize.getWidth() - margin * 2;
            const ratio = imgProps.width / imgProps.height;
            const imgHeight = Math.min(pdfWidth / ratio, 320);
            doc.addImage(
              dataUrl, imgProps.format || 'JPEG', margin, 40, pdfWidth, imgHeight
            );
            storyTextY = 60 + imgHeight;
          } catch (e) {
            console.warn('PDF image error:', e);
          }
        } 
        
        doc.setFontSize(14);
        doc.setTextColor(28, 32, 51);
        const lines = doc.splitTextToSize(
          body, doc.internal.pageSize.getWidth() - margin * 2
        );
        doc.text(lines, margin, storyTextY);
        
        doc.save(`${title.replace(/[^a-z0-9]+/gi, '_')}.pdf`);
        showToast('PDF downloaded');
      } catch (e) {
        console.warn('pdf err', e);
        showToast('PDF generation failed');
      }
      attachSfx(btn, 'success');
    });
  });

  // Onboarding
  const seen = loadFromStorage('dw_seen_onboard');
  const onboard = document.getElementById('onboard');
  if (!seen && onboard) {
    onboard.classList.remove('hidden');
    onboard.classList.add('active');
  }
  const closeOnboardActions = () => {
    onboard.classList.remove('active');
    saveToStorage('dw_seen_onboard', '1');
    setTimeout(() => onboard.classList.add('hidden'), 300);
  };
  document.getElementById('closeOnboard')?.addEventListener('click', closeOnboardActions);
  document.getElementById('gotItBtn')?.addEventListener('click', closeOnboardActions);
  
  // Footer buttons
  if (newBtn)
    newBtn.addEventListener('click', () => {
      document.getElementById('storyDisplay').style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      form.scrollIntoView({ behavior: 'smooth' });
    });
  if (regenBtn)
    regenBtn.addEventListener('click', () => form.requestSubmit());

  // Init particles and audio
  try { initStardustTrail(); } catch (e) {} // NEW
  try { initTiltEffect(); } catch (e) {} // NEW
  try { AudioSFX.init(); } catch (e) {}

  // Attach final SFX
  attachSfx(document.querySelector('.btn-submit'), 'click');
  attachSfx(document.getElementById('readAloudBtn'), 'click');
  attachSfx(document.getElementById('favoriteBtn'), 'pop');
  attachSfx(document.getElementById('generateImageBtn'), 'pop');
  attachSfx(document.getElementById('fontToggleBtn'), 'pop');

  // Accessibility: close modals with ESC
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      document
        .querySelectorAll('.modal.active')
        .forEach((m) => hideModal(m.id));
      document.body.style.overflow = 'auto';
    }
  });

  // Close modal buttons
  document
    .querySelectorAll('.close-modal')
    .forEach((b) =>
      b.addEventListener('click', () =>
        hideModal(b.closest('.modal').id)
      )
    );

  document
    .getElementById('closePastBtn')
    .addEventListener('click', closePastStories);
});
