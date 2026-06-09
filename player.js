const THEME_KEY = '_jbp_theme';
const TWITCH_PARENT = 'jackbox-player.6static.com,localhost';

let currentStreamUrl = null;

function detectStream(url) {
  if (!url) return 'none';
  try {
    const u = new URL(url);
    const h = u.hostname.replace(/^www\./, '');
    if (h === 'youtube.com' || h === 'youtu.be') return 'youtube';
    if (h === 'twitch.tv') return 'twitch';
    const p = u.pathname.toLowerCase();
    if (p.endsWith('.m3u8') || p.includes('/hls/')) return 'hls';
    if (p.endsWith('.mp4') || p.endsWith('.webm') || p.endsWith('.ogg')) return 'video';
    return 'unknown';
  } catch {
    return 'none';
  }
}

function extractYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0];
    if (u.pathname.startsWith('/live/')) return u.pathname.split('/')[2];
    return u.searchParams.get('v');
  } catch {
    return null;
  }
}

function makeIframe(src, allow) {
  const el = document.createElement('iframe');
  el.src = src;
  el.allow = allow;
  el.referrerPolicy = 'no-referrer-when-downgrade';
  return el;
}

function createYouTubeEmbed(url) {
  const id = extractYouTubeId(url);
  if (!id) return placeholder('Could not extract YouTube video ID.');
  return makeIframe(
    `https://www.youtube.com/embed/${id}?autoplay=1`,
    'autoplay; fullscreen; picture-in-picture'
  );
}

function createTwitchEmbed(url) {
  try {
    const channel = new URL(url).pathname.split('/').filter(Boolean)[0];
    return makeIframe(
      `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${TWITCH_PARENT}`,
      'autoplay; fullscreen'
    );
  } catch {
    return placeholder('Could not parse Twitch channel URL.');
  }
}

function createHlsEmbed(url) {
  const video = document.createElement('video');
  video.autoplay = true;
  video.controls = true;
  video.style.cssText = 'width:100%;height:100%';

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari native HLS
    video.src = url;
  } else {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    script.onload = () => {
      if (window.Hls && Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
      }
    };
    document.head.appendChild(script);
  }
  return video;
}

function createVideoEmbed(url) {
  const video = document.createElement('video');
  video.autoplay = true;
  video.controls = true;
  video.src = url;
  video.style.cssText = 'width:100%;height:100%';
  return video;
}

function placeholder(msg) {
  const div = document.createElement('div');
  div.className = 'stream-placeholder';
  div.textContent = msg;
  return div;
}

function loadStream(url) {
  currentStreamUrl = url || null;
  const pane = document.getElementById('stream-pane');
  pane.innerHTML = '';

  if (!currentStreamUrl) {
    pane.appendChild(placeholder('Paste a stream URL above and press Go.'));
    return;
  }

  const type = detectStream(currentStreamUrl);
  let el;
  if (type === 'youtube') el = createYouTubeEmbed(currentStreamUrl);
  else if (type === 'twitch') el = createTwitchEmbed(currentStreamUrl);
  else if (type === 'hls') el = createHlsEmbed(currentStreamUrl);
  else if (type === 'video') el = createVideoEmbed(currentStreamUrl);
  else {
    // Unknown — attempt as generic video; show error if it fails
    el = createVideoEmbed(currentStreamUrl);
    el.addEventListener('error', () => {
      pane.innerHTML = '';
      pane.appendChild(placeholder('Could not load stream. Unsupported or inaccessible URL.'));
    });
  }
  pane.appendChild(el);
}

function showCode(code) {
  if (!code) return;
  const display = document.getElementById('room-code-display');
  const copyBtn = document.getElementById('copy-btn');
  display.textContent = `Room: ${code}`;
  display.classList.remove('hidden');
  copyBtn.classList.remove('hidden');
}

function applyTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  const preferLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const useLight = stored ? stored === 'light' : preferLight;
  document.body.classList.toggle('light', useLight);
  syncThemeBtn(useLight);
}

function syncThemeBtn(isLight) {
  const btn = document.getElementById('theme-btn');
  btn.textContent = isLight ? '\u{1F319}' : '☀️';
  btn.title = isLight ? 'Switch to dark mode' : 'Switch to light mode';
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem(THEME_KEY, isLight ? 'light' : 'dark');
  syncThemeBtn(isLight);
}

function swapH() {
  document.getElementById('container').classList.toggle('swapped-h');
}

function swapV() {
  document.getElementById('container').classList.toggle('swapped-v');
}

function bindSwipe() {
  let startX = 0, startY = 0;
  const container = document.getElementById('container');

  container.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  container.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) swapH();
  }, { passive: true });
}

function bindStreamInput() {
  const input = document.getElementById('stream-input');
  const goBtn = document.getElementById('stream-go-btn');

  function applyStream() {
    const url = input.value.trim();
    loadStream(url || null);
    const params = new URLSearchParams(location.search);
    if (url) params.set('stream', url);
    else params.delete('stream');
    const qs = params.toString();
    history.replaceState(null, '', qs ? `${location.pathname}?${qs}` : location.pathname);
  }

  goBtn.addEventListener('click', applyStream);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') applyStream(); });
}

function bindControls(code) {
  document.getElementById('copy-btn').addEventListener('click', () => {
    if (code) navigator.clipboard.writeText(code).catch(() => { });
  });

  document.getElementById('swap-h-btn').addEventListener('click', swapH);
  document.getElementById('swap-v-btn').addEventListener('click', swapV);
  document.getElementById('reload-btn').addEventListener('click', () => loadStream(currentStreamUrl));
  document.getElementById('theme-btn').addEventListener('click', toggleTheme);

  const overlay = document.getElementById('help-overlay');
  document.getElementById('help-btn').addEventListener('click', () => overlay.classList.remove('hidden'));
  document.getElementById('help-close-btn').addEventListener('click', () => overlay.classList.add('hidden'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') overlay.classList.add('hidden'); });
}

function init() {
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const streamUrl = params.get('stream');

  applyTheme();
  showCode(code);

  if (streamUrl) {
    document.getElementById('stream-input').value = streamUrl;
  }

  loadStream(streamUrl);
  bindControls(code);
  bindStreamInput();
  bindSwipe();
}

init();
