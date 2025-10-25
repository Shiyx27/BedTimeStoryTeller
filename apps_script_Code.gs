/**
 * Google Apps Script backend for DreamWeavers
 * - POST JSON or application/x-www-form-urlencoded with field `action`.
 * - Actions: ping, signup, login, generateStory, saveFavorite, getFavorites, clearFavorites
 */

function doGet(e){
  return contentJSON({ ok: true, message: 'DreamWeavers Apps Script is running' });
}

function doPost(e){
  // Accept JSON bodies or form-encoded requests (e.parameter)
  var body = {};
  try {
    body = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}');
  } catch(err) {
    body = {};
    if(e.parameter){
      for(var k in e.parameter){
        try{ body[k] = JSON.parse(e.parameter[k]); }catch(_){ body[k] = e.parameter[k]; }
      }
    }
  }

  var action = body.action;
  try{
    Logger.log('doPost action: %s | body: %s', action, JSON.stringify(body));
    switch(action){
      case 'ping': return contentJSON({ ok:true, message:'pong' });
      case 'signup': return contentJSON(signup(body.email, body.password));
      case 'login': return contentJSON(login(body.email, body.password));
      case 'generateStory': return contentJSON(generateStoryHandler({ name: body.name, world: body.world, sidekick: body.sidekick, theme: body.theme }));
      case 'saveFavorite': return contentJSON(saveFavorite(typeof body.story === 'string' ? JSON.parse(body.story) : (body.story||{}), body.user));
      case 'getFavorites': return contentJSON(getFavorites(body.user));
      case 'clearFavorites': return contentJSON(clearFavorites(body.user));
      default: return contentJSON({ error:'unknown action' });
    }
  }catch(err){ Logger.log('doPost error: %s', err.stack || err.message); return contentJSON({ error: err.message }); }
}

function contentJSON(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet(){
  var ssId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if(!ssId) throw new Error('Please set SHEET_ID in Script Properties');
  return SpreadsheetApp.openById(ssId);
}

function ensureSheets(){
  var ss = getSheet();
  if(!ss.getSheetByName('users')) ss.insertSheet('users');
  if(!ss.getSheetByName('favorites')) ss.insertSheet('favorites');
}

function signup(email, password){
  if(!email || !password) return { success:false, message:'Missing fields' };
  ensureSheets();
  var ss = getSheet();
  var users = ss.getSheetByName('users');
  var rows = [];
  try{ rows = users.getDataRange().getValues(); }catch(_){ rows = []; }
  for(var i=0;i<rows.length;i++){ if(rows[i][0]==email) return { success:false, message:'Email already exists' }; }
  var hashBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  var hash = hashBytes.map(function(b){ return ('0'+(b&0xFF).toString(16)).slice(-2); }).join('');
  users.appendRow([email, hash, new Date()]);
  try{ MailApp.sendEmail(email, 'Welcome to DreamWeavers!', 'Thanks for signing up for DreamWeavers!'); }catch(_){ }
  return { success:true, message:'Signed up (welcome email sent if allowed)' };
}

function login(email, password){
  if(!email || !password) return { success:false, message:'Missing fields' };
  var ss = getSheet(); var users = ss.getSheetByName('users'); var rows = [];
  try{ rows = users.getDataRange().getValues(); }catch(_){ rows = []; }
  var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password).map(function(b){ return ('0'+(b&0xFF).toString(16)).slice(-2); }).join('');
  for(var i=0;i<rows.length;i++){ if(rows[i][0]==email && rows[i][1]==hash) return { success:true, message:'Logged in' }; }
  return { success:false, message:'Invalid credentials' };
}

function generateStoryHandler(opts){
  var name = opts.name || 'Friend';
  var world = opts.world || 'Magical Castle';
  var sidekick = opts.sidekick || 'Tiny Dragon';
  var theme = opts.theme || 'Friendship';
  var prompt = 'Write a ~600-word children\'s story for ages 4-9 about ' + name + ' in ' + world + ' with a sidekick ' + sidekick + '. Theme: ' + theme + ". Use short paragraphs, playful language, include a catchy title and a one-sentence moral at the end. Output JSON with keys: title, text, moral.";

  var apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  var endpoint = PropertiesService.getScriptProperties().getProperty('GEMINI_ENDPOINT') || 'https://generativeai.googleapis.com/v1alpha2/models/text-bison-001:generate';
  if(!apiKey){
    var fakeText = 'Once upon a time in ' + world + ', ' + name + ' had a small adventure with ' + sidekick + '.\n\n(Story generation key not set. Set GEMINI_API_KEY in Script Properties.)';
    var cover = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(name + ' ' + world + ' ' + sidekick + ' children book cover colorful');
    return { title: name + "'s " + world + ' Adventure', text: fakeText, moral: 'Be kind and curious.', cover: cover };
  }

  var payload = { prompt: prompt, maxOutputTokens: 1024 };
  // Prefer explicit GEMINI_API_KEY (if you set one), otherwise attempt to call with the script's OAuth token
  var authToken = apiKey || ScriptApp.getOAuthToken();
  var options = { method:'post', contentType:'application/json', payload: JSON.stringify(payload), headers: { Authorization: 'Bearer ' + authToken }, muteHttpExceptions: true };
  var response = UrlFetchApp.fetch(endpoint, options);
  var code = response.getResponseCode();
  var respText = response.getContentText();
  if(code>=400){
    // Return a graceful fallback story and include a short warning so the frontend can show it
    var detail = respText || ('HTTP ' + code);
    var short = detail.length > 400 ? detail.slice(0,400) + '...' : detail;
    var coverFallback = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(name + ' ' + world + ' ' + sidekick + ' children book cover colorful');
    var fallbackText = 'Once upon a time in ' + world + ', ' + name + " had a small adventure with " + sidekick + '.\n\n(Generation API request failed — returned HTTP ' + code + '. Using a short fallback story.)';
    var warningMsg = 'Generation API failed: HTTP ' + code + '. ' + short;
    if(code === 401){
      warningMsg += ' (Authentication failed — set a valid GEMINI_API_KEY in Script Properties or configure the Apps Script project to use the Google Cloud project with the Generative AI API enabled and grant the script OAuth access.)';
    }
    return { title: name + "'s " + world + ' Adventure', text: fallbackText, moral: 'Be kind and curious.', cover: coverFallback, warning: warningMsg };
  }
  var parsed = {};
  try{ parsed = JSON.parse(respText); }catch(e){ parsed = { text: respText }; }

  var generated = '';
  if(parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) generated = parsed.candidates[0].content;
  else if(parsed.output && parsed.output[0] && parsed.output[0].content) generated = parsed.output[0].content;
  else if(parsed.text) generated = parsed.text;
  else generated = respText;

  var title=''; var text=''; var moral='';
  try{ var j = JSON.parse(generated); title = j.title||''; text = j.text||j.story||''; moral = j.moral||''; }catch(e){ var parts = generated.split('\n\n'); title = parts[0]||(name + "'s Adventure"); text = parts.slice(1, parts.length-1).join('\n\n') || generated; moral = parts[parts.length-1] || ''; }
  var cover = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(name + ' ' + world + ' ' + sidekick + ' children book cover colorful');
  return { title: title, text: text, moral: moral, cover: cover };
}

function saveFavorite(story, user){
  ensureSheets();
  var ss = getSheet(); var fav = ss.getSheetByName('favorites'); var now = new Date();
  // store: timestamp, user, title, moral, text, cover
  fav.appendRow([now, user||'', story.title||'', story.moral||'', story.text||'', story.cover||'']);
  return { success:true };
}

function getFavorites(user){
  try{
    ensureSheets(); var fav = getSheet().getSheetByName('favorites'); var data = fav.getDataRange().getValues() || [];
    // filter by user when provided
    if(user){ data = data.filter(function(r){ return (r[1] || '') === user; }); }
    data = data.slice(0).reverse().slice(0,5);
    var out = data.map(function(r){ return { date: r[0], user: r[1], title: r[2], moral: r[3], text: r[4], cover: r[5] }; });
    return { favorites: out };
  }catch(e){ return { favorites: [] }; }
}

function clearFavorites(user){
  try{
    var ss = getSheet(); var fav = ss.getSheetByName('favorites');
    if(!user){ fav.clear(); return { success:true }; }
    // remove rows for the user while preserving others
    var data = fav.getDataRange().getValues(); var keep = [];
    for(var i=0;i<data.length;i++){ if((data[i][1]||'') !== user) keep.push(data[i]); }
    fav.clear();
    if(keep.length) fav.getRange(1,1,keep.length, keep[0].length).setValues(keep);
    return { success:true };
  }catch(e){ return { success:false }; }
}