/* Uova – cottura perfetta e freschezza */
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const fmt1 = n => n.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const mmss = s => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/* ---------- Forma dell'uovo (punta a -x, parte larga a +x) ---------- */
function eggPath(L, W, n = 72) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = (L / 2) * Math.cos(t);
    const y = (W / 2) * Math.sin(t) * (1 + 0.13 * Math.cos(t));
    d += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
  }
  return d + 'Z';
}
// stessa forma ma verticale con la punta in alto
function eggPathVertical(L, W, n = 72) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = (L / 2) * Math.cos(t);
    const y = (W / 2) * Math.sin(t) * (1 + 0.13 * Math.cos(t));
    d += (i ? 'L' : 'M') + y.toFixed(2) + ' ' + x.toFixed(2);
  }
  return d + 'Z';
}

function setRangeFill(input) {
  const p = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty('--p', p + '%');
}

/* =========================================================
   COTTURA
   ========================================================= */
const cook = { done: 80, weight: 58, temp: 5, alt: 0, seconds: 0 };

const DONENESS = [
  { max: 65, key: 'coque', name: 'Alla coque', desc: 'albume appena rappreso, tuorlo liquido' },
  { max: 73, key: 'barzotto', name: 'Barzotto', desc: 'albume sodo, tuorlo cremoso' },
  { max: 82, key: 'sodo', name: 'Sodo', desc: 'tuorlo compatto e ancora morbido' },
  { max: 99, key: 'sodo', name: 'Sodo ben cotto', desc: 'tuorlo asciutto e friabile' },
];
const doneness = t => DONENESS.find(d => t <= d.max);

function sizeClass(w) {
  if (w < 53) return 'S';
  if (w < 63) return 'M';
  if (w < 73) return 'L';
  return 'XL';
}
const boilingPoint = alt => 100 - alt / 300; // ~1 °C ogni 300 m

/* Modello di Charles D. H. Williams (trasmissione del calore in un uovo):
   t[min] = 0,451 · M^(2/3) · ln( 0,76 · (T_uovo − T_acqua) / (T_tuorlo − T_acqua) ) */
function cookingSeconds({ done, weight, temp, alt }) {
  const tw = boilingPoint(alt);
  if (done >= tw - 0.5) return null;
  const ratio = 0.76 * (temp - tw) / (done - tw);
  if (ratio <= 1) return 60;
  return 0.451 * Math.pow(weight, 2 / 3) * Math.log(ratio) * 60;
}

function drawCookEgg() {
  const svg = $('#cookEgg');
  const s = Math.cbrt(cook.weight / 58);
  const L = 168 * s, W = L * 0.76;
  const cx = 110, cy = 118;
  const liquid = Math.pow(clamp((76 - cook.done) / 14, 0, 1), 0.8); // frazione di tuorlo ancora liquido
  const yolkR = W * 0.3, ycy = cy + L * 0.07;
  const soft = clamp((68 - cook.done) / 6, 0, 1); // albume vicino al tuorlo ancora traslucido
  const over = clamp((cook.done - 82) / 2, 0, 1); // anello verdastro
  const setCol = cook.done > 80 ? '#F6D879' : '#F9C846';
  const f = (liquid * 100).toFixed(1), f2 = Math.min(100, liquid * 100 + 12).toFixed(1);
  svg.innerHTML = `
    <defs>
      <radialGradient id="yolkG" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#F08A0C"/>
        <stop offset="${f}%" stop-color="#F39A1A"/>
        <stop offset="${f2}%" stop-color="${setCol}"/>
        <stop offset="100%" stop-color="${setCol}"/>
      </radialGradient>
      <radialGradient id="whiteG" cx="45%" cy="40%" r="65%">
        <stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#F4EEE2"/>
      </radialGradient>
      <radialGradient id="softG"><stop offset="55%" stop-color="#F3E9D2" stop-opacity=".9"/><stop offset="100%" stop-color="#F3E9D2" stop-opacity="0"/></radialGradient>
    </defs>
    <ellipse cx="${cx}" cy="${cy + L / 2 + 6}" rx="${W * 0.45}" ry="7" fill="#7A5230" opacity=".13"/>
    <g transform="translate(${cx} ${cy})">
      <path d="${eggPathVertical(L + 8, W + 8)}" fill="#E8C49A"/>
      <path d="${eggPathVertical(L, W)}" fill="url(#whiteG)"/>
      ${soft > 0 ? `<circle cx="0" cy="${ycy - cy}" r="${yolkR * (1.25 + 0.25 * soft)}" fill="url(#softG)" opacity="${soft}"/>` : ''}
      ${over > 0 ? `<circle cx="0" cy="${ycy - cy}" r="${yolkR + 2.5}" fill="#9AA35E" opacity="${0.8 * over}"/>` : ''}
      <circle cx="0" cy="${ycy - cy}" r="${yolkR}" fill="url(#yolkG)"/>
      ${liquid > 0.25 ? `<ellipse cx="${-yolkR * 0.3}" cy="${ycy - cy - yolkR * 0.35}" rx="${yolkR * 0.28 * liquid}" ry="${yolkR * 0.14 * liquid}" fill="#fff" opacity=".55"/>` : ''}
      ${liquid > 0.6 ? `<path d="M${yolkR * 0.15} ${ycy - cy + yolkR * 0.95} q 4 ${10 * liquid} 0 ${18 * liquid} q -4 -6 0 ${-18 * liquid}" fill="#F08A0C" opacity=".9"/>` : ''}
    </g>`;
}

function drawThermo() {
  const t = cook.temp;
  const h = lerp(6, 56, (t - 2) / 26);
  const col = t < 12 ? '#5AA7D6' : t < 20 ? '#E8B04A' : '#E8791C';
  $('#thermo').innerHTML = `
    <rect x="10" y="4" width="10" height="66" rx="5" fill="#fff" stroke="#D9C4A3" stroke-width="2"/>
    <circle cx="15" cy="76" r="10" fill="${col}" stroke="#D9C4A3" stroke-width="2"/>
    <rect x="12.5" y="${70 - h}" width="5" height="${h + 4}" rx="2.5" fill="${col}"/>`;
}

function drawMountain() {
  const a = cook.alt / 4000;
  const y = 84 - a * 74, x = 20 + (84 - y) / 76 * 130;
  $('#mountain').innerHTML = `
    <defs><linearGradient id="mtG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9A27E"/><stop offset="1" stop-color="#8FA86E"/></linearGradient></defs>
    <path d="M190 84 L240 40 L295 84Z" fill="#D8C3A5" opacity=".6"/>
    <path d="M10 84 L150 8 L285 84Z" fill="url(#mtG)"/>
    <path d="M128 20 L150 8 L172 20 L162 24 L150 18 L138 25Z" fill="#fff"/>
    <line x1="0" y1="85" x2="300" y2="85" stroke="#9FD3E6" stroke-width="3"/>
    <line x1="${x}" y1="${y}" x2="${x}" y2="${y - 22}" stroke="#4A3426" stroke-width="2"/>
    <path d="M${x} ${y - 22} l16 5 l-16 5z" fill="#E8791C"/>
    <circle cx="${x}" cy="${y}" r="3.5" fill="#4A3426"/>`;
}

const RECIPES = {
  coque: [
    ['🥖', 'Con i soldatini', 'Bastoncini di pane tostato e imburrato da intingere nel tuorlo, con un pizzico di sale.'],
    ['🌿', 'Con gli asparagi', 'Asparagi lessati al posto del pane: si intingono nel tuorlo come grissini.'],
    ['🧀', 'Parmigiano e pepe', 'Una grattata di parmigiano e pepe nero sopra il tuorlo appena aperto.'],
  ],
  barzotto: [
    ['🍜', 'Marinato per ramen', 'Sgusciato e lasciato qualche ora in salsa di soia, mirin e acqua: poi a metà sul brodo.'],
    ['🥑', 'Sul toast', 'Pane tostato, avocado schiacciato con limone, uovo tagliato a metà e peperoncino.'],
    ['🥗', 'Nell\'insalata tiepida', 'Con patate, fagiolini e un filo d\'olio: il tuorlo cremoso fa da condimento.'],
  ],
  sodo: [
    ['🥚', 'Uova ripiene', 'Tuorli schiacciati con maionese, senape e un po\' di tonno, rimessi negli albumi.'],
    ['🌱', 'Con salsa verde', 'A spicchi con salsa di prezzemolo, capperi, acciuga e olio: un classico piemontese.'],
    ['🥔', 'Insalata di patate', 'Patate, uova sode a spicchi, cipollotto, olive e un\'emulsione di olio e aceto.'],
  ],
};

function updateCook() {
  const sec = cookingSeconds(cook);
  const d = doneness(cook.done);
  cook.seconds = sec || 0;
  $('#cookTime').textContent = sec ? mmss(sec) : '--:--';
  $('#cookName').textContent = `${d.name}: ${d.desc}`;
  const warn = $('#cookWarn');
  if (!sec) {
    warn.hidden = false;
    warn.textContent = `A ${cook.alt} m l'acqua bolle a circa ${fmt1(boilingPoint(cook.alt))} °C: non basta per questo grado di cottura.`;
  } else if (sec > 15 * 60) {
    warn.hidden = false;
    warn.textContent = 'Tempo molto lungo: in alta quota conviene una pentola a pressione.';
  } else warn.hidden = true;
  $('#startTimer').disabled = !sec;

  $('#doneVal').textContent = `${d.name} · ${cook.done} °C`;
  $('#sizeVal').textContent = `${sizeClass(cook.weight)} · ${cook.weight} g`;
  $('#tempVal').textContent = `${cook.temp} °C`;
  $('#altVal').textContent = `${cook.alt.toLocaleString('it-IT')} m`;
  $('#boilNote').textContent = `L'acqua bolle a circa ${fmt1(boilingPoint(cook.alt))} °C${cook.alt >= 500 ? ': più si sale, più serve tempo.' : '.'}`;

  $$('#donePresets button').forEach(b => b.classList.toggle('on', doneness(+b.dataset.done).name === d.name));
  $$('#sizePresets button').forEach(b => b.classList.toggle('on', b.textContent === sizeClass(cook.weight)));
  $$('#tempPresets button').forEach(b => b.classList.toggle('on', Math.abs(+b.dataset.t - cook.temp) <= 3));

  drawCookEgg(); drawThermo(); drawMountain();

  const list = RECIPES[d.key];
  $('#recipeIntro').textContent = `Idee per l'uovo ${d.name.toLowerCase()}:`;
  $('#recipes').innerHTML = list.map(([ico, t, p]) => `<div class="recipe"><span class="ico" aria-hidden="true">${ico}</span><div><b>${t}</b><p>${p}</p></div></div>`).join('');
}

function bindRange(id, key) {
  const el = $('#' + id);
  el.value = cook[key];
  setRangeFill(el);
  el.addEventListener('input', () => { cook[key] = +el.value; setRangeFill(el); updateCook(); });
}
function setCook(key, v) { cook[key] = v; const el = $({ done: '#done', weight: '#weight', temp: '#temp', alt: '#alt' }[key]); el.value = v; setRangeFill(el); updateCook(); }

bindRange('done', 'done'); bindRange('weight', 'weight'); bindRange('temp', 'temp'); bindRange('alt', 'alt');
$$('#donePresets button').forEach(b => b.addEventListener('click', () => setCook('done', +b.dataset.done)));
$$('#sizePresets button').forEach(b => b.addEventListener('click', () => setCook('weight', +b.dataset.w)));
$$('#tempPresets button').forEach(b => b.addEventListener('click', () => setCook('temp', +b.dataset.t)));

/* ---------- Timer ---------- */
const timer = { total: 0, endAt: 0, left: 0, paused: false, iv: null, audio: null, beepIv: null, wake: null, key: 'sodo' };

function drawPot(progress) {
  const R = 118, C = 2 * Math.PI * R;
  $('#pot').innerHTML = `
    <circle cx="130" cy="130" r="${R}" fill="none" stroke="#F1E2C8" stroke-width="10"/>
    <circle id="ring" cx="130" cy="130" r="${R}" fill="none" stroke="#E8791C" stroke-width="10" stroke-linecap="round"
      stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - progress)}" transform="rotate(-90 130 130)"/>
    <g id="steam" stroke="#D9C4A3" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8">
      <path d="M105 70 q-8 -12 0 -24 q8 -12 0 -24"><animate attributeName="opacity" values=".2;.9;.2" dur="2.2s" repeatCount="indefinite"/></path>
      <path d="M130 66 q-8 -12 0 -24 q8 -12 0 -24"><animate attributeName="opacity" values=".9;.2;.9" dur="2.2s" repeatCount="indefinite"/></path>
      <path d="M155 70 q-8 -12 0 -24 q8 -12 0 -24"><animate attributeName="opacity" values=".3;.8;.3" dur="1.8s" repeatCount="indefinite"/></path>
    </g>
    <rect x="58" y="96" width="144" height="94" rx="18" fill="#B9B2AA"/>
    <rect x="40" y="104" width="24" height="10" rx="5" fill="#8F877E"/>
    <rect x="196" y="104" width="24" height="10" rx="5" fill="#8F877E"/>
    <rect x="64" y="112" width="132" height="72" rx="14" fill="#BFE3EE"/>
    <g>
      <animateTransform attributeName="transform" type="translate" values="0 0; 0 -4; 0 0" dur="1.4s" repeatCount="indefinite"/>
      <g transform="translate(130 146) rotate(-14)"><path d="${eggPath(46, 35)}" fill="#F2DDBE" stroke="#D9B98F" stroke-width="2"/></g>
    </g>
    ${[80, 104, 158, 180].map((x, i) => `<circle cx="${x}" cy="176" r="4" fill="#fff" opacity=".8"><animate attributeName="cy" values="178;118" dur="${1.2 + i * 0.3}s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="${1.2 + i * 0.3}s" repeatCount="indefinite"/></circle>`).join('')}
    <rect x="50" y="88" width="160" height="12" rx="6" fill="#8F877E"/>`;
}
function updateRing(progress) {
  const ring = $('#ring'); if (!ring) return;
  const C = 2 * Math.PI * 118;
  ring.setAttribute('stroke-dashoffset', C * (1 - progress));
}

function beep() {
  const ctx = timer.audio; if (!ctx) return;
  [0, 0.25, 0.5].forEach(dt => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime + dt);
    g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + dt + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dt + 0.2);
    o.connect(g).connect(ctx.destination);
    o.start(ctx.currentTime + dt); o.stop(ctx.currentTime + dt + 0.22);
  });
}

function timerTick() {
  if (timer.paused) return;
  timer.left = (timer.endAt - Date.now()) / 1000;
  $('#timerLeft').textContent = mmss(Math.ceil(Math.max(0, timer.left)));
  updateRing(clamp(1 - timer.left / timer.total, 0, 1));
  if (timer.left <= 0) timerDone();
}

function timerDone() {
  clearInterval(timer.iv); timer.iv = null;
  $('#timer').classList.add('done');
  $('#timerTitle').textContent = 'Pronto!';
  $('#timerMsg').textContent = timer.key === 'coque'
    ? 'Scolalo e servilo subito nel portauovo.'
    : 'Scolalo e passalo subito in acqua e ghiaccio per 2–3 minuti.';
  $('#timerPause').hidden = true;
  $('#steam') && $('#steam').setAttribute('opacity', '0');
  beep(); timer.beepIv = setInterval(beep, 1500);
  if (navigator.vibrate) navigator.vibrate([400, 200, 400, 200, 400]);
  if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
    navigator.serviceWorker?.ready.then(r => r.showNotification('Uova', { body: 'L\'uovo è pronto!', icon: './icons/icon-192.png', tag: 'uova-timer', vibrate: [300, 100, 300] })).catch(() => {});
  }
}

async function startTimer() {
  const d = doneness(cook.done);
  timer.key = d.key;
  timer.total = Math.round(cook.seconds);
  timer.endAt = Date.now() + timer.total * 1000;
  timer.paused = false;
  try { timer.audio = timer.audio || new (window.AudioContext || window.webkitAudioContext)(); await timer.audio.resume(); } catch { timer.audio = null; }
  try { if ('wakeLock' in navigator) timer.wake = await navigator.wakeLock.request('screen'); } catch { timer.wake = null; }
  if ('Notification' in window && Notification.permission === 'default') { Notification.requestPermission().catch(() => {}); }

  $('#timer').hidden = false;
  $('#timer').classList.remove('done');
  $('#timerTitle').textContent = `Uovo ${d.name.toLowerCase()}`;
  $('#timerMsg').textContent = 'Uovo nell\'acqua che bolle: il tempo scorre.';
  $('#timerPause').hidden = false;
  $('#timerPause').textContent = 'Pausa';
  drawPot(0);
  timerTick();
  timer.iv = setInterval(timerTick, 250);
}

function stopTimer() {
  clearInterval(timer.iv); clearInterval(timer.beepIv);
  timer.iv = timer.beepIv = null;
  if (timer.wake) { timer.wake.release().catch(() => {}); timer.wake = null; }
  if (navigator.vibrate) navigator.vibrate(0);
  $('#timer').hidden = true;
}

$('#startTimer').addEventListener('click', startTimer);
$('#timerStop').addEventListener('click', stopTimer);
$('#timerPause').addEventListener('click', () => {
  if (!timer.paused) {
    timer.paused = true; timer.left = (timer.endAt - Date.now()) / 1000;
    $('#timerPause').textContent = 'Riprendi'; $('#timerMsg').textContent = 'In pausa';
  } else {
    timer.paused = false; timer.endAt = Date.now() + timer.left * 1000;
    $('#timerPause').textContent = 'Pausa'; $('#timerMsg').textContent = 'Uovo nell\'acqua che bolle: il tempo scorre.';
  }
});
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && timer.iv) {
    timerTick();
    try { if ('wakeLock' in navigator && !timer.wake) timer.wake = await navigator.wakeLock.request('screen'); } catch {}
  }
});

/* =========================================================
   FRESCHEZZA
   ========================================================= */
const fresh = { days: 3, realDays: 3, storage: 'frigo', entered: false };
const AMBIENT_FACTOR = 2.5; // a temperatura ambiente l'uovo invecchia circa 2–3 volte più in fretta

const STAGES = [
  { maxE: 7, ref: 3, label: 'Sdraiato', cls: 'v-ok', title: 'Freschissimo',
    text: 'Resta sdraiato sul fondo: la camera d\'aria è minima. Perfetto alla coque, in camicia o crudo nelle ricette.' },
  { maxE: 14, ref: 10, label: 'Inclinato', cls: 'v-ok', title: 'Fresco',
    text: 'Si solleva appena dalla parte larga. Ottimo per tutto, ed è l\'età ideale per le uova sode: si sgusciano bene.' },
  { maxE: 21, ref: 17, label: 'A 45°', cls: 'v-mid', title: 'Ancora buono',
    text: 'La parte larga punta verso l\'alto. Preferisci cotture complete: sodo, frittate, torte.' },
  { maxE: 35, ref: 27, label: 'In piedi', cls: 'v-mid', title: 'Da consumare presto',
    text: 'Sta in piedi sulla punta: ha perso parecchia acqua. Usalo subito e ben cotto, e annusalo quando lo rompi.' },
  { maxE: Infinity, ref: 42, label: 'Galleggia', cls: 'v-bad', title: 'Meglio non mangiarlo',
    text: 'Galleggia: la camera d\'aria è molto grande e l\'uovo è vecchio. Buttalo senza romperlo in cucina.' },
];

const today = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; };
const addDays = (d, n) => new Date(d.getTime() + n * 864e5);
const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const longDate = d => d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

/* riferimento alla data di scadenza (deposizione + 28 giorni) */
function bbInfo() {
  const left = 28 - fresh.realDays;
  const dateText = longDate(addDays(today(), left));
  let status, cls, advice = '';
  if (left > 1) status = `mancano ${left} giorni`;
  else if (left === 1) status = 'scade domani';
  else if (left === 0) status = 'scade oggi';
  else status = `scaduto da ${-left === 1 ? '1 giorno' : -left + ' giorni'}`;
  cls = left >= 7 ? 'ok' : left >= 0 ? 'mid' : 'bad';
  if (left < 0) advice = ' Superata la data, usalo solo se supera il test e l\'odore è normale, ben cotto e al più presto.';
  else if (left < 7) advice = ' Usalo nei prossimi giorni, preferibilmente ben cotto.';
  if (fresh.storage === 'ambiente') advice += ' Fuori dal frigo invecchia più in fretta di quanto dice la data.';
  return { left, dateText, status, cls, advice };
}

const effAge = () => fresh.days * (fresh.storage === 'ambiente' ? AMBIENT_FACTOR : 1);
const stageOf = e => STAGES.findIndex(s => e < s.maxE);
const airMM = e => clamp(2 + 0.3 * e, 2, 16); // altezza indicativa della camera d'aria

/* uovo nel bicchiere: restituisce il markup per un bicchiere di dimensioni date */
function glassMarkup(e, { w = 260, h = 300, labels = true, id = 'g' } = {}) {
  const sx = w / 260, sy = h / 300;
  const top = 20 * sy, bot = 285 * sy, water = 78 * sy;
  const gl = [40 * sx, top, 220 * sx, top, 202 * sx, bot, 58 * sx, bot];
  const L = 92 * sx, W = 70 * sx;
  const angle = e <= 4 ? 0 : Math.min(90, ((e - 4) / 24) * 90);
  const th = angle * Math.PI / 180;
  const ext = Math.sqrt((L / 2 * Math.sin(th)) ** 2 + (W / 2 * Math.cos(th)) ** 2);
  const rise = clamp((e - 35) / 7, 0, 1);
  const yBottom = bot - 3 * sy - ext;
  const yFloat = water + ext * 0.62;
  const cy = lerp(yBottom, yFloat, rise);
  const cx = 130 * sx;
  const a = airMM(e) * 1.55 * sx;
  const path = eggPath(L, W);
  return `
    <defs>
      <clipPath id="${id}-glass"><path d="M${gl[0]} ${gl[1]} L${gl[2]} ${gl[3]} L${gl[4]} ${gl[5]} L${gl[6]} ${gl[7]}Z"/></clipPath>
      <clipPath id="${id}-egg"><path d="${path}"/></clipPath>
      <linearGradient id="${id}-shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6E0C0"/><stop offset="1" stop-color="#DDB78A"/></linearGradient>
    </defs>
    <g clip-path="url(#${id}-glass)">
      <rect x="0" y="${water}" width="${w}" height="${h}" fill="#CFEAF2"/>
    </g>
    <g transform="translate(${cx} ${cy}) rotate(${-angle})">
      <path d="${path}" fill="url(#${id}-shell)" stroke="#C99D6B" stroke-width="${1.5 * sx}"/>
      <g clip-path="url(#${id}-egg)">
        <ellipse cx="${L / 2}" cy="0" rx="${a}" ry="${W * 0.48}" fill="#FFFFFF" opacity=".75"/>
        <ellipse cx="${L / 2}" cy="0" rx="${a}" ry="${W * 0.48}" fill="none" stroke="#7FB6CC" stroke-width="${1.5 * sx}" stroke-dasharray="${4 * sx} ${3 * sx}"/>
      </g>
      <ellipse cx="${-L * 0.12}" cy="${-W * 0.22}" rx="${L * 0.16}" ry="${W * 0.07}" fill="#fff" opacity=".45"/>
    </g>
    <g clip-path="url(#${id}-glass)">
      <rect x="0" y="${water}" width="${w}" height="${h}" fill="#7EC3DA" opacity=".18"/>
      <line x1="0" y1="${water}" x2="${w}" y2="${water}" stroke="#6FB5CF" stroke-width="${2.5 * sx}"/>
    </g>
    <path d="M${gl[0]} ${gl[1]} L${gl[6]} ${gl[7]} Q${130 * sx} ${bot + 8 * sy} ${gl[4]} ${gl[5]} L${gl[2]} ${gl[3]}" fill="none" stroke="#A9C9D4" stroke-width="${4 * sx}" stroke-linejoin="round"/>
    <path d="M${52 * sx} ${40 * sy} L${66 * sx} ${250 * sy}" stroke="#fff" stroke-width="${5 * sx}" stroke-linecap="round" opacity=".7"/>
    ${labels ? airLabel(cx, cy, angle, L, a) : ''}`;
}
function airLabel(cx, cy, angle, L, a) {
  const th = -angle * Math.PI / 180;
  const px = cx + Math.cos(th) * (L / 2 - a / 2), py = cy + Math.sin(th) * (L / 2 - a / 2);
  const lx = 236, ly = Math.max(40, py - 40);
  return `<line x1="${px}" y1="${py}" x2="${lx - 4}" y2="${ly + 4}" stroke="#4A3426" stroke-width="1.5"/>
    <circle cx="${px}" cy="${py}" r="3" fill="#4A3426"/>
    <text x="${lx}" y="${ly}" text-anchor="end" font-size="12" font-weight="700" fill="#4A3426" font-family="inherit">camera d'aria</text>`;
}

function drawPlate(e) {
  const k = clamp(e / 42, 0, 1);
  const ox = 70 + 55 * k, oy = 24 + 14 * k;      // albume sottile (si allarga)
  const ix = 46 - 8 * k, iy = 18 - 6 * k;        // albume denso (si appiattisce)
  const yr = 22 + 5 * k, yh = 19 - 10 * k;       // tuorlo: alto se fresco, piatto se vecchio
  const wob = k * 10;
  $('#plate').innerHTML = `
    <defs><radialGradient id="pYolk" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FFC24A"/><stop offset="1" stop-color="#E8791C"/></radialGradient></defs>
    <ellipse cx="150" cy="96" rx="142" ry="46" fill="#E9DCC8"/>
    <ellipse cx="150" cy="92" rx="138" ry="43" fill="#FFFFFF" stroke="#E2D2BA" stroke-width="2"/>
    <ellipse cx="150" cy="92" rx="104" ry="31" fill="none" stroke="#F1E6D4" stroke-width="2"/>
    <path d="M${150 - ox} 92 C ${150 - ox} ${92 - oy - wob} ${150 + ox * 0.6} ${92 - oy} ${150 + ox} ${92 + wob * 0.3} C ${150 + ox} ${92 + oy} ${150 - ox * 0.5} ${92 + oy + wob * 0.5} ${150 - ox} 92Z" fill="#F4F1E8" stroke="#E6DFCF" stroke-width="1.5" opacity=".95"/>
    <ellipse cx="148" cy="92" rx="${ix}" ry="${iy}" fill="#ECE6D6" opacity="${0.95 - 0.6 * k}"/>
    <ellipse cx="148" cy="${92 - yh * 0.25}" rx="${yr}" ry="${Math.max(9, yh)}" fill="url(#pYolk)"/>
    <ellipse cx="${142 - yr * 0.2}" cy="${92 - yh * 0.7}" rx="${yr * 0.35}" ry="${Math.max(2, yh * 0.22)}" fill="#fff" opacity=".55"/>
    <text x="20" y="18" font-size="12" font-weight="700" fill="#8A6F5C" font-family="inherit">${k < 0.35 ? 'tuorlo alto, albume compatto' : k < 0.7 ? 'tuorlo più basso, albume che si allarga' : 'tuorlo piatto, albume acquoso'}</text>`;
  $('#plateNote').textContent = k < 0.35 ? 'Così si presenta un uovo fresco.' : k < 0.7 ? 'Uovo di qualche settimana: va bene cotto.' : 'Uovo vecchio: se l\'odore è sgradevole, buttalo.';
}

function updateFresh() {
  const e = effAge();
  const st = stageOf(e);
  const s = STAGES[st];
  $('#glass').innerHTML = glassMarkup(e, { id: 'main' });
  $('#verdict').className = 'verdict ' + s.cls;
  const bb = bbInfo();
  $('#verdict').innerHTML = `<b>${s.title}</b><p>${s.text}</p><p class="bb"><b class="pkg-status ${bb.cls}" style="display:inline;font-size:inherit">${fresh.entered ? 'Scadenza' : 'Scadenza stimata'}: ${bb.dateText}</b> · ${bb.status}.${bb.advice}</p>`;
  const note = $('#pkgNote');
  note.className = 'pkg-status ' + (fresh.entered ? bb.cls : '');
  note.textContent = fresh.entered
    ? `Deposto circa ${fresh.realDays === 1 ? '1 giorno' : fresh.realDays + ' giorni'} fa · ${bb.left > 1 ? bb.status + ' alla scadenza' : bb.status}.${fresh.realDays <= 9 ? ' È ancora nel periodo «extra».' : ''}`
    : `Data non inserita: uso i giorni impostati più sotto (scadenza stimata ${bb.dateText}).`;
  $('#daysVal').textContent = fresh.days === 1 ? '1 giorno' : `${fresh.days} giorni`;
  const mm = airMM(e);
  $('#airVal').textContent = `≈ ${fmt1(mm)} mm`;
  $('#airBar').style.width = (mm / 16 * 100) + '%';
  $$('#storage button').forEach(b => b.classList.toggle('on', b.dataset.s === fresh.storage));
  $$('#positions button').forEach((b, i) => b.classList.toggle('on', i === st));
  drawPlate(e);
}

function setDays(d, fromDate = false) {
  fresh.realDays = Math.round(d);
  fresh.days = clamp(fresh.realDays, 0, 50);
  if (!fromDate) {
    fresh.entered = false;
    $('#bestBefore').value = '';
  }
  const el = $('#days'); el.value = fresh.days; setRangeFill(el);
  updateFresh();
}

// pulsanti "cosa vedi nel bicchiere"
$('#positions').innerHTML = STAGES.map((s, i) =>
  `<button type="button" aria-label="${s.label}"><svg viewBox="0 0 80 92" aria-hidden="true">${glassMarkup(s.ref, { w: 80, h: 92, labels: false, id: 'p' + i })}</svg>${s.label}</button>`).join('');
$$('#positions button').forEach((b, i) => b.addEventListener('click', () => {
  const factor = fresh.storage === 'ambiente' ? AMBIENT_FACTOR : 1;
  setDays(STAGES[i].ref / factor);
  $('#glass').scrollIntoView({ behavior: 'smooth', block: 'center' });
}));

$('#days').addEventListener('input', e => setDays(+e.target.value));
$$('#storage button').forEach(b => b.addEventListener('click', () => { fresh.storage = b.dataset.s; updateFresh(); }));

$('#bestBefore').addEventListener('change', e => {
  if (!e.target.value) { setDays(fresh.days); return; }
  const bb = new Date(e.target.value + 'T12:00:00');
  const days = Math.round((today() - addDays(bb, -28)) / 864e5);
  if (days < 0) {
    const note = $('#pkgNote');
    note.className = 'pkg-status bad';
    note.textContent = 'La data è più lontana di 28 giorni da oggi: controlla di averla inserita bene.';
    return;
  }
  fresh.entered = true;
  setDays(days, true);
});

/* =========================================================
   NAVIGAZIONE, INSTALLAZIONE, SERVICE WORKER
   ========================================================= */
$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x => { x.classList.toggle('active', x === t); x.toggleAttribute('aria-current', x === t); });
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + t.dataset.view));
  window.scrollTo({ top: 0 });
}));
$$('[data-close]').forEach(b => b.addEventListener('click', () => { $('#' + b.dataset.close).hidden = true; }));

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; $('#installBtn').hidden = false; });
$('#installBtn').addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice.catch(() => {});
  deferredPrompt = null; $('#installBtn').hidden = true;
});
window.addEventListener('appinstalled', () => { $('#installBtn').hidden = true; });

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
if (isIOS && !standalone) {
  let seen = false;
  try { seen = sessionStorage.getItem('iosHint') === '1'; sessionStorage.setItem('iosHint', '1'); } catch {}
  if (!seen) $('#iosHint').hidden = false;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      const showUpdate = w => {
        $('#updateBanner').hidden = false;
        $('#updateBtn').onclick = () => w.postMessage({ type: 'SKIP_WAITING' });
      };
      if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w && w.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdate(w);
        });
      });
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading) return; reloading = true; location.reload();
      });
    } catch (err) { console.warn('Service worker non registrato', err); }
  });
}

/* avvio */
updateCook();
setDays(fresh.days);
