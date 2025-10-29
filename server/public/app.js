// Configuration
const CONFIG = {
  STORY_ENDPOINT: '/api/story',
  STORAGE_KEYS: {
    NAME: 'dw_name',
    STORIES: 'dw_stories',
  },
  MAX_STORIES: 10,
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

// Modal helpers with focus management
let _lastFocused = null;
const showModal = (id) => {
  const m = document.getElementById(id);
  if (!m) return;
  _lastFocused = document.activeElement;
  m.classList.add('active');
  document.body.style.overflow = 'hidden';
  // focus first focusable element inside modal
  const focusable = m.querySelector(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (focusable) {
    focusable.focus();
  }
};

const hideModal = (id) => {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('active');
  document.body.style.overflow = 'auto';
  // return focus
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

// --- Particles & visual delight (tsParticles) ---
async function initParticles() {
  try {
    if (!window.tsParticles) return;
    await tsParticles.load('particles', {
      fpsLimit: 30,
      background: { color: { value: 'transparent' } },
      particles: {
        number: { value: 22, density: { enable: true, area: 800 } },
        color: { value: ['#FFD1DC', '#A8EDEa', '#FFD98E', '#C6B8FF'] },
        shape: { type: 'circle' },
        opacity: { value: 0.85, random: true },
        size: { value: { min: 6, max: 18 }, random: true },
        move: {
          enable: true,
          speed: 0.6,
          direction: 'none',
          outMode: 'bounce',
        },
      },
      interactivity: {
        detectsOn: 'window',
        events: { onHover: { enable: false }, onClick: { enable: false } },
      },
      detectRetina: true,
    });
  } catch (e) {
    console.warn('particles init failed', e);
  }
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
    } catch (e) {
      /* ignore */
    }
  },
  click() {
    this.playTone(880, 0.08, 'sine');
  },
  success() {
    this.playTone(520, 0.26, 'sawtooth');
  },
  pop() {
    this.playTone(660, 0.12, 'triangle');
  },
};

// small helper to attach tiny click sound to element
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

// Simple fallback story generator (safeguard)
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
  // Expecting format:
  // TITLE: ...\n\nSTORY:\n...\n\nMORAL:\n...
  const result = { title: 'A Magical Story', story: text, moral: '' };
  try {
    const titleMatch = text.match(/TITLE:\s*(.*)/i);
    if (titleMatch) result.title = titleMatch[1].trim();

    const storyMatch = text.match(/STORY:\s*([\s\S]*?)(?:\n\nMORAL:|$)/i);
    if (storyMatch) result.story = storyMatch[1].trim();

    const moralMatch = text.match(/MORAL:\s*([\s\S]*$)/i);
    if (moralMatch) result.moral = moralMatch[1].trim();
  } catch (e) {
    // fallback to raw text
    result.story = text;
  }
  return result;
}

// Storage functions
function saveStory(obj) {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.STORIES);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift(obj);
    if (arr.length > CONFIG.MAX_STORIES) {
      arr.splice(CONFIG.MAX_STORIES);
    }
    localStorage.setItem(CONFIG.STORAGE_KEYS.STORIES, JSON.stringify(arr));
  } catch (e) {
    console.warn('saveStory failed', e);
  }
}

// Update last saved story to include generated image url (if any)
function attachImageToLastSaved(url) {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.STORIES);
    const arr = raw ? JSON.parse(raw) : [];
    if (arr.length === 0) return;
    // Attach to the most recent story (index 0)
    arr[0].image = url;
    localStorage.setItem(CONFIG.STORAGE_KEYS.STORIES, JSON.stringify(arr));
  } catch (e) {
    console.warn('attachImage failed', e);
  }
}

// Display utilities
function displayStory(obj) {
  const titleEl = document.getElementById('storyTitle');
  const bodyEl = document.getElementById('storyBody');
  const moralEl = document.querySelector('.moral');
  titleEl.textContent = obj.title;
  // render paragraphs
  bodyEl.innerHTML = '';
  const parts = (obj.story || '').split('\n\n');
  // For read-along highlight, split paragraphs into sentences and wrap
  parts.forEach((paragraph) => {
    const pEl = document.createElement('p');
    const sentences = paragraph.match(/[^.!?]+[.!?]*/g) || [paragraph];
    sentences.forEach((s, idx) => {
      const span = document.createElement('span');
      span.className = 'sentence';
      span.dataset.index = idx;
      span.textContent = s.trim() + ' ';
      pEl.appendChild(span);
    });
    bodyEl.appendChild(pEl);
  });
  if (moralEl) moralEl.textContent = obj.moral || '';
  const disp = document.getElementById('storyDisplay');
  disp.classList.remove('hidden');
  disp.style.display = 'block';
  // animate card entrance for delight
  try {
    const card = disp;
    card.classList.add('enter');
    setTimeout(() => card.classList.remove('enter'), 600);
  } catch (e) {}
  disp.scrollIntoView({ behavior: 'smooth' });
  // fire confetti for extra delight
  try {
    if (window.confetti)
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  } catch (e) {}
  // Auto-generate image
  autoGenerateImage(obj.title || obj.story || 'Cute children book illustration');
}

// Auto image generation helper (can be called after story created)
async function autoGenerateImage(titlePrompt) {
  const imgEl = document.getElementById('storyImage');
  const genBtn = document.getElementById('generateImageBtn');
  const prompt = titlePrompt
    ? `${titlePrompt} — whimsical children book illustration, colorful, soft, kid-friendly, high detail, vibrant colors, fantasy art style`
    : 'Cute children book illustration, vibrant colors, fantasy art style';

  if (genBtn) {
    genBtn.disabled = true;
    genBtn.textContent = 'Generating image...';
  }

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

      // Attach image to the most recently saved story for richer exports and favorites
      try {
        attachImageToLastSaved(j.url);
      } catch (e) {
        console.warn('Failed to attach image to story:', e);
      }
    }
  } catch (e) {
    console.warn('Image generation failed:', e);
  } finally {
    if (genBtn) {
      genBtn.disabled = false;
      genBtn.textContent = '🎨 Generate Story Image';
    }
  }
}

// Past stories modal
function viewPastStories() {
  showModal('pastModal');
  const content = document.getElementById('pastContent');
  content.innerHTML = '';
  const arr = JSON.parse(
    localStorage.getItem(CONFIG.STORAGE_KEYS.STORIES) || '[]'
  );
  if (arr.length === 0) {
    content.innerHTML =
      '<div style="text-align:center;color:#aaa;padding:24px">No stories yet</div>';
    return;
  }
  arr.forEach((s) => {
    const d = document.createElement('div');
    d.innerHTML = `<strong>${
      s.title
    }</strong><div style="font-size:12px;color:#ccc">${new Date(
      s.timestamp
    ).toLocaleString()}</div>`;
    d.addEventListener('click', () => {
      hideModal('pastModal');
      displayStory(s);
    });
    content.appendChild(d);
  });
}

function closePastStories() {
  hideModal('pastModal');
}

// Form handling
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('storyForm');
  const nameInput = document.getElementById('userName');
  const worldCustom = document.getElementById('customWorld');
  const customMood = document.getElementById('customMood');

  // Load saved name
  const n = loadFromStorage(CONFIG.STORAGE_KEYS.NAME);
  if (n) nameInput.value = n;

  // Hero CTA buttons
  const heroCreate = document.getElementById('heroCreate');
  const heroExplore = document.getElementById('heroExplore');
  if (heroCreate)
    heroCreate.addEventListener('click', () => {
      // focus form name and scroll into view
      nameInput.focus();
      const formTop = form.offsetTop || 0;
      window.scrollTo({ top: formTop - 20, behavior: 'smooth' });
    });
  if (heroExplore)
    heroExplore.addEventListener('click', () => {
      viewPastStories();
    });

  // attach small sfx to hero buttons
  attachSfx(heroCreate, 'click');
  attachSfx(heroExplore, 'click');

  // Auto-save name changes
  nameInput.addEventListener(
    'input',
    debounce((e) => saveToStorage(CONFIG.STORAGE_KEYS.NAME, e.target.value), 300)
  );

  // === NEW: Show/hide custom world/mood input ===
  form.addEventListener('change', (e) => {
    if (e.target.name === 'userWorld') {
      if (e.target.value === 'custom') {
        worldCustom.classList.remove('hidden');
        worldCustom.focus();
      } else {
        worldCustom.classList.add('hidden');
      }
    }
    if (e.target.name === 'userMood') {
      if (e.target.value === 'custom') {
        customMood.classList.remove('hidden');
        customMood.focus();
      } else {
        customMood.classList.add('hidden');
      }
    }
  });

  // Story generation
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const userName = (nameInput.value || '').trim();
    if (!userName) {
      alert('Please enter a name');
      return;
    }

    // === UPDATED: Get world value from radio buttons ===
    const worldRadio = document.querySelector('input[name="userWorld"]:checked');
    const userWorld =
      worldRadio && worldRadio.value === 'custom'
        ? worldCustom.value || 'a magical place'
        : (worldRadio ? worldRadio.value : 'Enchanted Forest'); // Default

    // === UPDATED: Get mood value from radio buttons ===
    const moodRadio = document.querySelector('input[name="userMood"]:checked');
    const userMood =
      moodRadio && moodRadio.value === 'custom'
        ? customMood.value || 'adventure'
        : (moodRadio ? moodRadio.value : 'adventure'); // Default

    const input = { userName, userWorld, mood: userMood };
    
    // show skeleton loading
    const disp = document.getElementById('storyDisplay');
    const titleEl = document.getElementById('storyTitle');
    const bodyEl = document.getElementById('storyBody');
    const moralEl = document.querySelector('.moral');
    const imgEl = document.getElementById('storyImage');
    
    disp.classList.remove('hidden');
    disp.style.display = 'block';
    imgEl.classList.add('hidden'); // Hide old image
    moralEl.textContent = '';
    titleEl.textContent = '';

    bodyEl.innerHTML = '';
    const sTitle = document.createElement('div');
    sTitle.className = 'skeleton title';
    const s1 = document.createElement('div');
    s1.className = 'skeleton line';
    const s2 = document.createElement('div');
    s2.className = 'skeleton line';
    const s3 = document.createElement('div');
    s3.className = 'skeleton line';
    bodyEl.appendChild(sTitle);
    bodyEl.appendChild(s1);
    bodyEl.appendChild(s2);
    bodyEl.appendChild(s3);
    
    disp.scrollIntoView({ behavior: 'smooth' });

    const res = await fetchStory(input);

    const payload = {
      title: res.title,
      story: res.story,
      moral: res.moral || '',
      timestamp: new Date().toISOString(),
    };
    saveStory(payload);
    displayStory(payload);
  });

  // Image generation: call server /api/cover
  const genImgBtn = document.getElementById('generateImageBtn');
  const imgEl = document.getElementById('storyImage');

  if (genImgBtn) {
    genImgBtn.addEventListener('click', async () => {
      // Use story title as prompt if available
      const title = document.getElementById('storyTitle').textContent || '';
      autoGenerateImage(title);
      attachSfx(genImgBtn, 'pop');
    });
  }

  // Save/share/new/regenerate buttons
  const saveBtn = document.getElementById('saveStoryBtn');
  const shareBtn = document.getElementById('shareStoryBtn');
  const newBtn = document.getElementById('newStoryBtn');
  const regenBtn = document.getElementById('regenerateBtn');
  
  // Note: saveBtn is now the PDF download button, handled below
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
      // toggle favorite in storage: store list of titles
      const raw = localStorage.getItem('dw_favorites') || '[]';
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
      localStorage.setItem('dw_favorites', JSON.stringify(arr));
      showToast(msg);
      try {
        if (window.confetti)
          confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      } catch (e) {}
      attachSfx(favBtn, 'success');
    });
  }

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
      // if active, cancel
      if (synthUtter && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        return;
      }
      // build text and map sentences
      const title = document.getElementById('storyTitle').textContent || '';
      const moral =
        (document.querySelector('.moral') || {}).textContent || '';
      // collect sentences DOM spans
      const spans = Array.from(
        document.querySelectorAll('#storyBody .sentence')
      );
      const sentences = spans.map((s) => s.textContent.trim());
      const text = [title].concat(sentences).concat([moral]).filter(Boolean).join(' ');

      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.pitch = 1.05;
      u.lang = 'en-US';

      // helper to clear highlights
      const clearHighlights = () =>
        spans.forEach((s) => s.classList.remove('highlight'));

      let currentIndex = -1;

      // Try using onboundary to find char position and map to sentence
      if ('onboundary' in SpeechSynthesisUtterance.prototype) {
        u.onboundary = (ev) => {
          try {
            const charIndex = ev.charIndex || 0;
            // map charIndex to sentence by cumulative length
            let cum = 0;
            for (let i = 0; i < sentences.length; i++) {
              cum += sentences[i].length + 1; // space
              if (charIndex <= cum) {
                if (currentIndex !== i) {
                  clearHighlights();
                  spans[i].classList.add('highlight');
                  currentIndex = i;
                }
                break;
              }
            }
          } catch (e) {
            /* ignore */
          }
        };
      } else {
        // fallback: highlight sentences sequentially using timers
        let idx = 0;
        const timers = [];
        u.onstart = () => {
          const baseDelay = 0;
          sentences.forEach((s, i) => {
            const dur = Math.max(800, s.length * 60); // ms per sentence
            const t = setTimeout(() => {
              clearHighlights();
              if (spans[i]) spans[i].classList.add('highlight');
            }, baseDelay + timers.reduce((a, b) => a + b, 0));
            timers.push(dur);
          });
        };
        u.onend = () => {
          clearHighlights();
        };
      }

      u.onstart = () => { readBtn.textContent = '⏹️'; };
      u.onend = () => {
        readBtn.textContent = '🔊';
        clearHighlights();
        synthUtter = null;
      };
      u.onerror = () => {
        readBtn.textContent = '🔊';
        clearHighlights();
        synthUtter = null;
      };
      
      synthUtter = u;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    });
  }

  // === UPDATED: Share modal actions ===
  document.querySelectorAll('.share-btn').forEach((b) => {
    b.addEventListener('click', async (e) => {
      const platform = b.dataset.platform;
      const title = document.getElementById('storyTitle').textContent || '';
      const body = document.getElementById('storyBody').innerText || '';
      const storyUrl = location.href;
      
      // Full text for copy, email, whatsapp
      const fullText = `${title}\n\n${body}`;
      // Shorter text for platforms with limits
      const summary = body.slice(0, 150) + '...';

      if (b.classList.contains('copy-link')) {
        try {
          await navigator.clipboard.writeText(fullText);
          showToast('Story copied to clipboard');
        } catch (e) {
          showToast('Copy failed');
        }
        hideModal('shareModal');
        return;
      }
      
      let url = '';
      
      if (platform === 'twitter') {
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title + ':\n' + summary)}&url=${encodeURIComponent(storyUrl)}`;
      }
      
      if (platform === 'facebook') {
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storyUrl)}&quote=${encodeURIComponent(title)}`;
      }
      
      if (platform === 'linkedin') {
        url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(storyUrl)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`;
      }
      
      if (platform === 'whatsapp') {
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText + '\n\nRead more at: ' + storyUrl)}`;
      }
      
      if (platform === 'email') {
        url = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent('I created a magical story with DreamWeavers!\n\n' + fullText + '\n\nRead it online:\n' + storyUrl)}`;
        // No window.open for mailto, just set location
        window.location.href = url;
        hideModal('shareModal');
        return;
      }

      if (url) {
        window.open(url, '_blank');
      }
      hideModal('shareModal');
    });
    // attach sfx to share buttons
    attachSfx(b, 'click');
  });

  // PDF download (uses jspdf UMD)
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
        // Title page
        doc.setFillColor(250, 250, 255);
        doc.rect(
          0,
          0,
          doc.internal.pageSize.getWidth(),
          doc.internal.pageSize.getHeight(),
          'F'
        );
        doc.setFontSize(34);
        doc.setTextColor(58, 47, 107);
        doc.text(title, doc.internal.pageSize.getWidth() / 2, 160, {
          align: 'center',
        });
        doc.setFontSize(14);
        const author =
          (document.getElementById('userName') || {}).value || '';
        if (author)
          doc.text(
            `by ${author}`,
            doc.internal.pageSize.getWidth() / 2,
            200,
            { align: 'center' }
          );
        doc.setFontSize(10);
        doc.setTextColor(110, 118, 130);
        doc.text(
          new Date().toLocaleString(),
          doc.internal.pageSize.getWidth() / 2,
          228,
          { align: 'center' }
        );
        // try to add a hero image on second page
        doc.addPage();
        const imgEl = document.getElementById('storyImage');
        if (imgEl && imgEl.src && !imgEl.classList.contains('hidden')) {
          try {
            // Re-fetch image to get Data URL (avoids CORS taint)
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
              dataUrl,
              imgProps.format || 'JPEG',
              margin,
              40,
              pdfWidth,
              imgHeight
            );
            // caption
            doc.setFontSize(12);
            doc.setTextColor(88, 96, 120);
            doc.text(
              (document.getElementById('storyTitle') || {}).textContent || '',
              margin + 6,
              50 + imgHeight
            );
            // story text after image
            doc.addPage();
            doc.setFontSize(14);
            doc.setTextColor(28, 32, 51);
            const lines = doc.splitTextToSize(
              body,
              doc.internal.pageSize.getWidth() - margin * 2
            );
            doc.text(lines, margin, 80);
          } catch (e) {
            console.warn('PDF image error:', e);
            // fallback to standard single-page text
            doc.setFontSize(14);
            const lines = doc.splitTextToSize(
              body,
              doc.internal.pageSize.getWidth() - margin * 2
            );
            doc.text(lines, margin, 80);
          }
        } else {
          // no image: put story on page 2
          doc.setFontSize(14);
          const lines = doc.splitTextToSize(
            body,
            doc.internal.pageSize.getWidth() - margin * 2
          );
          doc.text(lines, margin, 80);
        }
        doc.save(`${title.replace(/[^a-z0, -9]+/gi, '_')}.pdf`);
        showToast('PDF downloaded');
      } catch (e) {
        console.warn('pdf err', e);
        showToast('PDF generation failed');
      }
      attachSfx(btn, 'success');
    });
  });

  // Onboarding: show once
  const seen = localStorage.getItem('dw_seen_onboard');
  const onboard = document.getElementById('onboard');
  if (!seen && onboard) {
    onboard.classList.remove('hidden');
    onboard.classList.add('active');
  }
  const closeOnboard = document.getElementById('closeOnboard');
  const gotItBtn = document.getElementById('gotItBtn');
  const closeOnboardActions = () => {
    onboard.classList.remove('active');
    localStorage.setItem('dw_seen_onboard', '1');
    setTimeout(() => onboard.classList.add('hidden'), 300);
  };
  if (closeOnboard)
    closeOnboard.addEventListener('click', closeOnboardActions);
  if (gotItBtn) gotItBtn.addEventListener('click', closeOnboardActions);
  
  if (newBtn)
    newBtn.addEventListener('click', () => {
      document.getElementById('storyDisplay').style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      form.scrollIntoView({ behavior: 'smooth' });
    });
  if (regenBtn)
    regenBtn.addEventListener('click', () => form.requestSubmit());

  // initialize particles and audio
  try {
    initParticles();
  } catch (e) {}
  try {
    AudioSFX.init();
  } catch (e) {}

  // attach sfx to common interactive elements
  attachSfx(document.querySelector('.btn-submit'), 'click');
  attachSfx(document.getElementById('readAloudBtn'), 'click');
  attachSfx(document.getElementById('favoriteBtn'), 'pop');
  attachSfx(document.getElementById('generateImageBtn'), 'pop');

  // keyboard accessibility: close modals with ESC
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      document
        .querySelectorAll('.modal.active')
        .forEach((m) => hideModal(m.id));
      document.body.style.overflow = 'auto';
    }
  });

  // Close share modal buttons
  document
    .querySelectorAll('.close-modal')
    .forEach((b) =>
      b.addEventListener('click', () =>
        hideModal(b.closest('.modal').id)
      )
    );

  // Modal triggers (using the heroExplore button now)
  // document.getElementById('viewPastBtn').addEventListener('click', viewPastStories);
  document
    .getElementById('closePastBtn')
    .addEventListener('click', closePastStories);
});