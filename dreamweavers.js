// DreamWeavers - frontend logic (vanilla JS) - clean copy
const CONFIG = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxjL9QdUA9evLQweQoFw7j5re7g0EtHW3O5bH8k7zNNYCPoroaHqBqULmS48oaCuka4/exec',
  USE_BACKEND: true,
};

const protagonist = document.getElementById('protagonist');
const worldInput = document.getElementById('world');
const sidekickInput = document.getElementById('sidekick');
const themeInput = document.getElementById('theme');
const createBtn = document.getElementById('create-btn');
const loading = document.getElementById('loading');
const storyArea = document.getElementById('story-area');
const coverImg = document.getElementById('cover-img');
const storyTitle = document.getElementById('story-title');
const storyText = document.getElementById('story-text');
const moralBox = document.getElementById('moral');
const newStoryBtn = document.getElementById('new-story-btn');
const saveFavBtn = document.getElementById('save-fav-btn');

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signupBtn = document.getElementById('signup-btn');
const loginBtn = document.getElementById('login-btn');
const accountMsg = document.getElementById('account-msg');

const favoritesList = document.getElementById('favorites-list');
const clearFavBtn = document.getElementById('clear-fav');

let currentStory = null;

function getCurrentUser(){ try{ return JSON.parse(localStorage.getItem('dw_user')||'null'); }catch(e){ return null; } }

function updateAuthState(){ const user = getCurrentUser(); if(user){ accountMsg.textContent = 'Logged in as ' + user.email; saveFavBtn.disabled = false; } else { accountMsg.textContent = ''; saveFavBtn.disabled = true; } }

// password toggle
const togglePwdBtn = document.getElementById('toggle-pwd');
if(togglePwdBtn){ togglePwdBtn.addEventListener('click', ()=>{ if(passwordInput.type==='password'){ passwordInput.type='text'; togglePwdBtn.textContent='Hide'; } else { passwordInput.type='password'; togglePwdBtn.textContent='Show'; } }); }

function showLoading(show){ loading.classList.toggle('hidden', !show); }

function showStory(obj){
  currentStory = obj || {};
  console.log('showStory payload:', obj);
  if(obj && obj.cover) {
    coverImg.src = obj.cover;
    coverImg.style.display = '';
  } else {
    coverImg.style.display = 'none';
  }
  storyTitle.textContent = (obj && obj.title) ? obj.title : `${(obj && obj.name) || 'Friend'}'s Adventure`;
  // show backend warning if present
  const warnEl = document.getElementById('story-warning');
  if(warnEl) warnEl.textContent = (obj && obj.warning) ? String(obj.warning) : '';
  const textVal = (obj && obj.text) ? obj.text : '';
  if(!textVal){
    storyText.innerHTML = '<p class="text-gray-500">(No story text returned.)</p>';
  } else {
    storyText.innerHTML = textVal.split('\n\n').map(p=>`<p>${p}</p>`).join('');
  }
  moralBox.textContent = (obj && obj.moral) ? obj.moral : '(No moral provided)';
  // handle cover image load errors
  coverImg.onerror = function(){
    console.warn('Cover image failed to load:', coverImg.src);
    coverImg.style.display = 'none';
  };
  coverImg.onload = function(){ coverImg.style.display = ''; };
  storyArea.classList.remove('hidden');
}

async function postToBackend(obj){
  if(!CONFIG.APPS_SCRIPT_URL) throw new Error('APPS_SCRIPT_URL not set');
  const params = new URLSearchParams();
  for(const k in obj){
    const v = obj[k];
    params.append(k, (typeof v === 'object' && v !== null) ? JSON.stringify(v) : String(v));
  }
  const res = await fetch(CONFIG.APPS_SCRIPT_URL, { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, body: params.toString() });
  const raw = await res.text();
  let json = {};
  try{ json = JSON.parse(raw); }catch(e){ console.warn('Could not parse backend JSON, raw response:', raw); throw new Error('Invalid JSON from backend'); }
  if(json.error) throw new Error((json.error || 'Backend error') + (json.detail ? ': ' + json.detail : ''));
  return json;
}

async function generateStory(){
  const name = protagonist.value.trim() || 'Friend';
  const world = worldInput.value.trim() || 'Magical Castle';
  const sidekick = sidekickInput.value.trim() || 'Tiny Dragon 🐉';
  const theme = themeInput.value.trim() || 'Friendship 💕';
  showLoading(true); storyArea.classList.add('hidden'); createBtn.disabled = true;
  try{
    if(CONFIG.USE_BACKEND && CONFIG.APPS_SCRIPT_URL){
      const data = await postToBackend({ action:'generateStory', name, world, sidekick, theme });
      showStory(data);
    } else {
      const fake = { title:`${name} and the ${sidekick}`, text:`Once upon a time in ${world}, ${name} met ${sidekick}...\n\n(Replace with Gemini result)`, moral:'Be kind and brave.', cover:`https://image.pollinations.ai/prompt/${encodeURIComponent(`${name} ${world} ${sidekick} children book cover colorful`)}` };
      showStory(fake);
    }
  }catch(e){
    console.error('Generation error:', e);
    // show error inline
    storyArea.classList.remove('hidden');
    storyTitle.textContent = 'Error generating story';
    storyText.innerHTML = `<p class="text-red-600">${escapeHtml(e.message)}</p>`;
    accountMsg.textContent = '';
  } finally{ showLoading(false); createBtn.disabled = false; }
}

createBtn.addEventListener('click', generateStory);
newStoryBtn.addEventListener('click', ()=> storyArea.classList.add('hidden'));

saveFavBtn.addEventListener('click', async ()=>{
  if(!currentStory) return;
  const user = JSON.parse(localStorage.getItem('dw_user')||'null');
  if(!user){ accountMsg.textContent = 'Please sign up or log in to save favorites.'; emailInput.focus(); return; }
  // save locally
  const favs = JSON.parse(localStorage.getItem('dreamweavers_favs')||'[]');
  favs.unshift({ id: Date.now(), ...currentStory }); while(favs.length>5) favs.pop(); localStorage.setItem('dreamweavers_favs', JSON.stringify(favs)); renderFavorites();
  // sync to backend with user info
  if(CONFIG.USE_BACKEND && CONFIG.APPS_SCRIPT_URL) {
    try{ await postToBackend({ action:'saveFavorite', story: currentStory, user: user.email }); }catch(e){ console.warn('Could not sync favorite to backend', e); }
  }
  accountMsg.textContent = 'Saved to favorites.';
});

function renderFavorites(){ const favs = JSON.parse(localStorage.getItem('dreamweavers_favs')||'[]'); favoritesList.innerHTML = ''; for(const f of favs){ const el = document.createElement('div'); el.className = 'p-2 bg-white rounded-lg shadow-sm flex items-center gap-2'; el.innerHTML = `<div class="flex-1"><strong>${escapeHtml(f.title||'Untitled')}</strong><br/><small class="text-gray-500">${escapeHtml(f.moral||'')}</small></div><button class="view-btn bg-indigo-500 text-white rounded px-3 py-1">View</button>`; el.querySelector('.view-btn').addEventListener('click', ()=> showStory(f)); favoritesList.appendChild(el); } }

clearFavBtn.addEventListener('click', ()=>{
  if(!confirm('Clear all favorites?')) return;
  localStorage.removeItem('dreamweavers_favs'); renderFavorites();
  const user = getCurrentUser();
  if(CONFIG.USE_BACKEND && CONFIG.APPS_SCRIPT_URL && user) postToBackend({ action:'clearFavorites', user: user.email }).catch(()=>{});
});

signupBtn.addEventListener('click', async ()=>{
  const email = emailInput.value.trim(); const pwd = passwordInput.value;
  if(!email || !pwd){ accountMsg.textContent = 'Please enter email and password.'; return; }
  if(!CONFIG.APPS_SCRIPT_URL){ accountMsg.textContent = 'Set APPS_SCRIPT_URL in script.js before using signup/login.'; return; }
  try{
    const res = await postToBackend({ action:'signup', email, password: pwd });
    accountMsg.textContent = res.message || 'Signed up!';
    if(res.success){ localStorage.setItem('dw_user', JSON.stringify({ email })); updateAuthState(); }
  }catch(e){ accountMsg.textContent = 'Signup error: '+e.message; }
});

loginBtn.addEventListener('click', async ()=>{
  const email = emailInput.value.trim(); const pwd = passwordInput.value;
  if(!email || !pwd){ accountMsg.textContent = 'Please enter email and password.'; return; }
  if(!CONFIG.APPS_SCRIPT_URL){ accountMsg.textContent = 'Set APPS_SCRIPT_URL in script.js before using signup/login.'; return; }
  try{
    const res = await postToBackend({ action:'login', email, password: pwd });
    if(res.success){ localStorage.setItem('dw_user', JSON.stringify({ email })); accountMsg.textContent = 'Logged in as '+email; updateAuthState(); }
    else accountMsg.textContent = res.message || 'Login failed';
  }catch(e){ accountMsg.textContent = 'Login error: '+e.message; }
});

function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

async function loadFavoritesFromBackend(){
  const user = getCurrentUser();
  if(!user) return; // only load server-side favorites when logged in
  if(!CONFIG.APPS_SCRIPT_URL) return;
  try{
    const j = await postToBackend({ action:'getFavorites', user: user.email });
    if(Array.isArray(j.favorites) && j.favorites.length){ const local = JSON.parse(localStorage.getItem('dreamweavers_favs')||'[]'); const merged = [...j.favorites, ...local].slice(0,5); localStorage.setItem('dreamweavers_favs', JSON.stringify(merged)); renderFavorites(); }
  }catch(e){ console.warn('Could not fetch favorites from backend', e); }
}

// initialize UI state
updateAuthState();
renderFavorites();
loadFavoritesFromBackend();