// Configuration
const CONFIG = {
  STORY_ENDPOINT: '/api/story',
  STORAGE_KEYS: {
    NAME: 'dw_name',
    STORIES: 'dw_stories'
  },
  MAX_STORIES: 10
};

// Storage utilities
const saveToStorage = (k,v) => {
  try {
    localStorage.setItem(k,v);
  } catch(e) {
    console.warn('save failed',e);
  }
};

const loadFromStorage = (k) => {
  try {
    return localStorage.getItem(k);
  } catch(e) {
    return null;
  }
};

// Modal helpers
const showModal = (id) => {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('active');
  document.body.style.overflow = 'hidden';
};

const hideModal = (id) => {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('active');
  document.body.style.overflow = 'auto';
};

// Debounce helper
const debounce = (fn, wait=250) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this,args), wait);
  };
};

// Simple fallback story generator (safeguard)
function fallbackLocalStory({userName, userWorld}) {
  const title = `${userName} in the ${userWorld}`;
  const story = `${userName} had a gentle adventure in ${userWorld}. It was full of wonder, small challenges, kind friends, and a warm ending.`;
  return { title, story };
}

// API functions
async function fetchStory(userInput) {
  try {
    const res = await fetch(CONFIG.STORY_ENDPOINT, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(userInput)
    });
    if (!res.ok) throw new Error('server');
    const json = await res.json();
    if (json && json.text) return parseApiText(json.text);
    throw new Error('bad');
  } catch(e) {
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
  } catch(e) {
    console.warn('saveStory failed',e);
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
  parts.forEach(paragraph => {
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
  disp.scrollIntoView({behavior:'smooth'});
  // fire confetti for extra delight
  try { if (window.confetti) confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } }); } catch(e){}
  // Auto-generate image
  autoGenerateImage(obj.title || obj.story || 'Cute children book illustration');
}

// Auto image generation helper (can be called after story created)
async function autoGenerateImage(titlePrompt){
  const imgEl = document.getElementById('storyImage');
  const genBtn = document.getElementById('generateImageBtn');
  const prompt = titlePrompt ? `${titlePrompt} — whimsical children book illustration, colorful, soft, kid-friendly` : 'Cute children book illustration';
  if (genBtn) { genBtn.disabled = true; genBtn.textContent = 'Generating image...'; }
  try{
    const resp = await fetch('/api/cover', { method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ prompt }) });
    const j = await resp.json();
    if (j && j.url){ imgEl.src = j.url; imgEl.classList.remove('hidden'); }
  } catch(e){ console.warn('auto image failed', e); }
  finally{ if (genBtn) { genBtn.disabled = false; genBtn.textContent = '🎨 Generate Story Image'; } }
}

// Past stories modal
function viewPastStories() {
  showModal('pastModal');
  const content = document.getElementById('pastContent');
  content.innerHTML = '';
  const arr = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.STORIES) || '[]');
  if (arr.length === 0) {
    content.innerHTML = '<div style="text-align:center;color:#ddd;padding:24px">No stories yet</div>';
    return;
  }
  arr.forEach(s => {
    const d = document.createElement('div');
    d.style.padding = '8px 0';
    d.style.borderBottom = '1px solid rgba(255,255,255,0.04)';
    d.innerHTML = `<strong>${s.title}</strong><div style="font-size:12px;color:#ccc">${new Date(s.timestamp).toLocaleString()}</div>`;
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
  const worldSel = document.getElementById('userWorld');
  const worldCustom = document.getElementById('userWorldCustom');

  // Load saved name
  const n = loadFromStorage(CONFIG.STORAGE_KEYS.NAME);
  if (n) nameInput.value = n;

  // Auto-save name changes
  nameInput.addEventListener('input', debounce(e => 
    saveToStorage(CONFIG.STORAGE_KEYS.NAME, e.target.value), 300
  ));

  // Show/hide custom world input
  worldSel.addEventListener('change', (e) => {
    // value for custom option is 'Custom' in the select
    if (e.target.value === 'Custom') {
      worldCustom.classList.remove('hidden');
    } else {
      worldCustom.classList.add('hidden');
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
    const userWorld = (worldSel.value === 'Custom')
      ? (worldCustom.value || 'a magical place')
      : worldSel.value;
    // get selected mood if present
    const moodEl = document.querySelector('input[name="mood"]:checked');
    const mood = moodEl ? moodEl.value : 'adventure';

    const input = { userName, userWorld, mood };
    // show loading
    document.getElementById('storyBody').innerHTML = '';
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.textContent = 'Weaving your story...';
    document.getElementById('storyBody').appendChild(loading);

    const res = await fetchStory(input);

    const payload = {
      title: res.title,
      story: res.story,
      moral: res.moral || '',
      timestamp: new Date().toISOString()
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
      const prompt = title ? `${title} — whimsical children book illustration` : 'Cute children book illustration';
      genImgBtn.disabled = true;
      genImgBtn.textContent = 'Generating image...';
      try {
        const resp = await fetch('/api/cover', {
          method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ prompt })
        });
        const j = await resp.json();
        if (j && j.url) {
          imgEl.src = j.url;
          imgEl.classList.remove('hidden');
        } else {
          alert('Image generation failed');
        }
      } catch (e) {
        console.warn('cover error', e);
        alert('Image generation failed');
      } finally {
        genImgBtn.disabled = false;
        genImgBtn.textContent = '🎨 Generate Story Image';
      }
    });
  }

  // Save/share/new/regenerate buttons
  const saveBtn = document.getElementById('saveStoryBtn');
  const shareBtn = document.getElementById('shareStoryBtn');
  const newBtn = document.getElementById('newStoryBtn');
  const regenBtn = document.getElementById('regenerateBtn');
  if (saveBtn) saveBtn.addEventListener('click', () => alert('Story saved to your collection!'));
  if (shareBtn) shareBtn.addEventListener('click', () => showModal('shareModal'));
  // Favorite toggle
  const favBtn = document.getElementById('favoriteBtn');
  const showToast = (msg) => {
    let t = document.getElementById('dw-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'dw-toast';
      t.style.position = 'fixed';
      t.style.right = '20px';
      t.style.bottom = '20px';
      t.style.padding = '12px 16px';
      t.style.background = 'rgba(0,0,0,0.8)';
      t.style.color = 'white';
      t.style.borderRadius = '12px';
      t.style.zIndex = 2000;
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._hide);
    t._hide = setTimeout(()=>{ t.style.opacity = '0'; }, 2500);
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
      if (idx === -1) { arr.push(title); msg = 'Added to favorites ⭐'; favBtn.classList.add('active'); }
      else { arr.splice(idx,1); msg = 'Removed from favorites'; favBtn.classList.remove('active'); }
      localStorage.setItem('dw_favorites', JSON.stringify(arr));
      showToast(msg);
      try{ if (window.confetti) confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } }); }catch(e){}
    });
  }

  // Read aloud
  const readBtn = document.getElementById('readAloudBtn');
  let synthUtter = null;
  if (readBtn) {
    readBtn.addEventListener('click', () => {
      const bodyEl = document.getElementById('storyBody');
      if (!bodyEl || !bodyEl.textContent.trim()) return showToast('No story yet');
      if (!window.speechSynthesis) return showToast('Read-aloud not supported in this browser');
      // if active, cancel
      if (synthUtter && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        synthUtter = null;
        readBtn.textContent = '🔊 Read Aloud';
        return;
      }
      // build text and map sentences
      const title = document.getElementById('storyTitle').textContent || '';
      const moral = (document.querySelector('.moral')||{}).textContent || '';
      // collect sentences DOM spans
      const spans = Array.from(document.querySelectorAll('#storyBody .sentence'));
      const sentences = spans.map(s=>s.textContent.trim());
      const text = [title].concat(sentences).concat([moral]).filter(Boolean).join(' ');

      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.pitch = 1.05;
      u.lang = 'en-US';

      // helper to clear highlights
      const clearHighlights = () => spans.forEach(s => s.classList.remove('highlight'));

      let currentIndex = -1;

      // Try using onboundary to find char position and map to sentence
      if ('onboundary' in SpeechSynthesisUtterance.prototype) {
        u.onboundary = (ev) => {
          try{
            const charIndex = ev.charIndex || 0;
            // map charIndex to sentence by cumulative length
            let cum = 0;
            for (let i=0;i<sentences.length;i++){
              cum += sentences[i].length + 1; // space
              if (charIndex <= cum){
                if (currentIndex !== i){ clearHighlights(); spans[i].classList.add('highlight'); currentIndex = i; }
                break;
              }
            }
          }catch(e){ /* ignore */ }
        };
      } else {
        // fallback: highlight sentences sequentially using timers
        let idx = 0;
        const timers = [];
        u.onstart = () => {
          const baseDelay = 0;
          sentences.forEach((s, i) => {
            const dur = Math.max(800, s.length * 60); // ms per sentence
            const t = setTimeout(()=>{ clearHighlights(); if (spans[i]) spans[i].classList.add('highlight'); }, baseDelay + timers.reduce((a,b)=>a+b,0) );
            timers.push(dur);
          });
        };
        u.onend = () => { clearHighlights(); };
      }

      u.onend = () => { readBtn.textContent = '🔊 Read Aloud'; clearHighlights(); };
      synthUtter = u;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      readBtn.textContent = '⏹️ Stop';
    });
  }

  // Share modal actions: copy link (copy story text), tweet
  document.querySelectorAll('.share-btn').forEach(b => {
    b.addEventListener('click', async (e) => {
      const platform = b.dataset.platform;
      const title = document.getElementById('storyTitle').textContent || '';
      const body = document.getElementById('storyBody').innerText || '';
      const text = `${title}\n\n${body}`.slice(0,240);
      if (b.classList.contains('copy-link')) {
        try { await navigator.clipboard.writeText(text); showToast('Story copied to clipboard'); }
        catch(e){ showToast('Copy failed'); }
        return;
      }
      if (platform === 'twitter') {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(url,'_blank');
        return;
      }
      if (platform === 'facebook') {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}&quote=${encodeURIComponent(title)}`;
        window.open(url,'_blank');
        return;
      }
    });
  });

  // PDF download (uses jspdf UMD)
  document.querySelectorAll('.download-pdf').forEach(btn => {
    btn.addEventListener('click', () => {
      try{
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) return showToast('PDF library missing');
        const title = document.getElementById('storyTitle').textContent || 'My Story';
        const body = Array.from(document.querySelectorAll('#storyBody p')).map(p=>p.innerText).join('\n\n');
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const margin = 40;
        doc.setFontSize(20);
        doc.text(title, margin, 60);
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(body, 520);
        doc.text(lines, margin, 100);
        doc.save(`${title.replace(/[^a-z0-9]+/gi,'_')}.pdf`);
        showToast('PDF downloaded');
      }catch(e){ console.warn('pdf err',e); showToast('PDF generation failed'); }
    });
  });

  // Onboarding: show once
  const seen = localStorage.getItem('dw_seen_onboard');
  const onboard = document.getElementById('onboard');
  if (!seen && onboard) { onboard.classList.remove('hidden'); onboard.classList.add('active'); }
  const closeOnboard = document.getElementById('closeOnboard');
  const gotItBtn = document.getElementById('gotItBtn');
  if (closeOnboard) closeOnboard.addEventListener('click', () => { onboard.classList.add('hidden'); onboard.classList.remove('active'); localStorage.setItem('dw_seen_onboard','1'); });
  if (gotItBtn) gotItBtn.addEventListener('click', () => { onboard.classList.add('hidden'); onboard.classList.remove('active'); localStorage.setItem('dw_seen_onboard','1'); });
  if (newBtn) newBtn.addEventListener('click', () => { document.getElementById('storyDisplay').style.display = 'none'; window.scrollTo({top:0,behavior:'smooth'}); });
  if (regenBtn) regenBtn.addEventListener('click', () => form.requestSubmit());

  // Close share modal buttons
  document.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', () => { hideModal('shareModal'); }));

  // Modal triggers
  document.getElementById('viewPastBtn').addEventListener('click', viewPastStories);
  document.getElementById('closePastBtn').addEventListener('click', closePastStories);
});