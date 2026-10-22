(() => {
'use strict';

/* ---------- Icônes ---------- */
const I = {
  chevDown:'<path d="M6 9l6 6 6-6"/>', chevUp:'<path d="M6 15l6-6 6 6"/>',
  grid:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 4v16M4 12h16"/>',
  undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>',
  redo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 000 11H13"/>',
  pen:'<path d="M4 20l4.2-1L19 8.2 15.8 5 5 15.8 4 20z"/><path d="M13.5 7.3l3.2 3.2"/>',
  line:'<path d="M5 19L19 5"/>',
  dim:'<path d="M3 14h18M6 11l-3 3 3 3M18 11l3 3-3 3M3 9v10M21 9v10"/><path d="M10 8h4" stroke-width="1.6"/>',
  arrow:'<path d="M5 19L19 5M10 5h9v9"/>',
  rect:'<rect x="3.5" y="6" width="17" height="12" rx="1"/>', circle:'<circle cx="12" cy="12" r="8.5"/>',
  hole:'<circle cx="12" cy="12" r="6"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5" stroke-width="1.4"/>',
  triangle:'<path d="M12 4l9 16H3z"/>', diamond:'<path d="M12 3l9 9-9 9-9-9z"/>',
  cube:'<path d="M4 9h11v11H4zM4 9l5-5h11v11l-5 5M15 9l5-5"/>',
  sphere:'<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12c0 1.9 3.8 3.3 8.5 3.3s8.5-1.4 8.5-3.3"/><path d="M20.5 12c0-1.9-3.8-3.3-8.5-3.3S3.5 10.1 3.5 12" stroke-dasharray="2 2.2"/>',
  text:'<path d="M5 7V5h14v2M12 5v14M9 19h6"/>',
  move:'<path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/>',
  fileNew:'<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M12 11v6M9 14h6"/>',
  folder:'<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
  download:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
  share:'<path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 012-2h8"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  file:'<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5"/>'
};
const svg = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
document.querySelectorAll('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', svg(I[el.dataset.icon])));

const SHAPES = [
  {id:'line',label:'Ligne'},{id:'dim',label:'Cote'},{id:'arrow',label:'Flèche'},{id:'rect',label:'Rectangle',short:'Rect.'},
  {id:'circle',label:'Cercle'},{id:'hole',label:'Trou'},{id:'triangle',label:'Triangle'},{id:'diamond',label:'Losange'},
  {id:'cube',label:'Cube'},{id:'sphere',label:'Sphère'}
];
const COLORS = [
  ['#1c2230','Noir'],['#667085','Gris'],['#d92d20','Rouge'],['#f97316','Orange'],['#eab308','Jaune'],
  ['#16a34a','Vert'],['#2563eb','Bleu'],['#7c3aed','Violet'],['#92400e','Brun'],['#ffffff','Blanc (efface)']
];
const WIDTHS = [[2,'Fin'],[4,'Moyen'],[8,'Épais']];
const GRID = 20, CUR = 'plans.current', PREFS = 'plans.prefs';
const DEVICE = /iPhone/.test(navigator.userAgent) ? 'cet iPhone' : /iPad/.test(navigator.userAgent) ? 'cet iPad' : 'cet appareil';

/* ---------- État ---------- */
const $ = id => document.getElementById(id);
const cv = $('board'), ctx = cv.getContext('2d'), mctx = document.createElement('canvas').getContext('2d');
let W = innerWidth, H = innerHeight, DPR = 1;
const view = {x:W/2, y:H/2, s:1};
let objs = [], hist = [], fut = [], draft = null, action = null, gesture = null, textAt = null;
const S = {tool:'pen', shape:'line', color:COLORS[0][0], width:4, grid:false, sel:null};
let doc = null, lastSaved = null, saveTimer = null, saveOk = true, shapeTipShown = false;
const pointers = new Map();

/* ---------- Stockage ---------- */
// Les dessins vont dans IndexedDB (les photos importées dépassent vite la limite de localStorage).
// localStorage ne garde que l'identifiant du dessin ouvert et les réglages des outils.
const LS = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } },
  set(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch(e){ return false; } }
};
const DB = (() => {
  let conn;
  const open = () => conn || (conn = new Promise((res, rej) => {
    const r = indexedDB.open('plans', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('docs', {keyPath:'id'});
    r.onsuccess = () => res(r.result);
    r.onerror = () => { conn = null; rej(r.error); };
  }));
  const run = async (mode, fn) => {
    const db = await open();
    return new Promise((res, rej) => {
      const t = db.transaction('docs', mode), req = fn(t.objectStore('docs'));
      t.oncomplete = () => res(req.result);
      t.onerror = t.onabort = () => rej(t.error);
    });
  };
  return {
    get: id => run('readonly', s => s.get(id)),
    all: () => run('readonly', s => s.getAll()),
    put: d => run('readwrite', s => s.put(d)),
    del: id => run('readwrite', s => s.delete(id))
  };
})();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

const ser = list => JSON.stringify(list, (k,v) => k === '_img' ? undefined : v);
const deser = s => JSON.parse(s).map(hydrate);
function hydrate(o){
  if (o.t === 'image' && !o._img){ const im = new Image(); im.onload = render; im.src = o.src; o._img = im; }
  return o;
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const defaultName = () => 'Plan du ' + new Date().toLocaleDateString('fr-CA',{day:'numeric',month:'short'});
const fmtTime = ts => new Date(ts).toLocaleTimeString('fr-CA',{hour:'2-digit',minute:'2-digit'});
const fmtDate = ts => new Date(ts).toDateString() === new Date().toDateString()
  ? 'Aujourd’hui, ' + fmtTime(ts)
  : new Date(ts).toLocaleDateString('fr-CA',{day:'numeric',month:'short'});
const esc = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function scheduleSave(){ clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 400); }
// force : enregistrer même un dessin vide jamais enregistré (ex. après un renommage)
function saveNow(force){
  clearTimeout(saveTimer);
  if (!doc || (!objs.length && !doc.stored && !force)) return Promise.resolve(true);
  const rec = {id:doc.id, name:doc.name, created:doc.created, updated:Date.now(), objs:JSON.parse(ser(objs)), thumb:thumbOf(objs)};
  doc.stored = true;
  LS.set(CUR, doc.id);
  return DB.put(rec).then(() => { lastSaved = rec.updated; saveOk = true; updateStatus(); return true; }, () => {
    saveOk = false; updateStatus();
    toast('Espace de stockage plein — exportez puis supprimez d’anciens dessins.');
    return false;
  });
}
function updateStatus(){
  const el = $('saveStatus');
  el.classList.toggle('warn', !saveOk);
  el.textContent = !saveOk ? 'Non enregistré — stockage plein'
    : lastSaved ? `Enregistré sur ${DEVICE} à ${fmtTime(lastSaved)}` : `Enregistré automatiquement sur ${DEVICE}`;
  $('docName').textContent = doc ? doc.name : '';
}
function openDoc(d, stored = true){
  doc = {id:d.id, name:d.name, created:d.created || Date.now(), stored};
  objs = (d.objs || []).map(o => hydrate({...o}));
  hist = []; fut = []; S.sel = null; lastSaved = stored ? d.updated || null : null;
  if (stored) LS.set(CUR, doc.id);
  fitView(); updateUI(); updateStatus(); render();
}
function newDoc(){ openDoc({id:uid(), name:defaultName(), objs:[]}, false); }

/* ---------- Géométrie ---------- */
const toWorld = (x,y) => ({x:(x - view.x) / view.s, y:(y - view.y) / view.s});
const font = size => `600 ${size}px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif`;
function bbox(o){
  let l,t,r,b;
  if (o.pts){ l = r = o.pts[0][0]; t = b = o.pts[0][1];
    for (const [x,y] of o.pts){ if(x<l)l=x; if(x>r)r=x; if(y<t)t=y; if(y>b)b=y; } }
  else if (o.t === 'text'){ mctx.font = font(o.size); const ls = o.text.split('\n');
    l = o.x1; t = o.y1; r = l + Math.max(...ls.map(s => mctx.measureText(s).width)); b = t + ls.length * o.size * 1.25; }
  else { l = Math.min(o.x1,o.x2); r = Math.max(o.x1,o.x2); t = Math.min(o.y1,o.y2); b = Math.max(o.y1,o.y2); }
  const m = (o.w || 0) / 2 + (o.t === 'arrow' ? 6 : o.t === 'dim' ? 26 : o.t === 'hole' ? (r - l) * .3 : 0);
  return {l:l-m, t:t-m, r:r+m, b:b+m};
}
function union(list){
  const u = {l:Infinity,t:Infinity,r:-Infinity,b:-Infinity};
  for (const o of list){ const b = bbox(o); u.l=Math.min(u.l,b.l); u.t=Math.min(u.t,b.t); u.r=Math.max(u.r,b.r); u.b=Math.max(u.b,b.b); }
  return u;
}
function distSeg(p,x1,y1,x2,y2){
  const dx = x2-x1, dy = y2-y1, L = dx*dx + dy*dy;
  let k = L ? ((p.x-x1)*dx + (p.y-y1)*dy) / L : 0; k = Math.max(0, Math.min(1, k));
  return Math.hypot(p.x - (x1 + k*dx), p.y - (y1 + k*dy));
}
function hitTest(p){
  const tol = 14 / view.s;
  for (let i = objs.length - 1; i >= 0; i--){
    const o = objs[i], w = (o.w || 0) / 2 + tol;
    if (o.pts){
      if (o.pts.length === 1 && Math.hypot(p.x-o.pts[0][0], p.y-o.pts[0][1]) < w) return o;
      for (let j = 1; j < o.pts.length; j++) if (distSeg(p, ...o.pts[j-1], ...o.pts[j]) < w) return o;
    } else if (o.t === 'line' || o.t === 'arrow' || o.t === 'dim'){
      if (distSeg(p, o.x1, o.y1, o.x2, o.y2) < w) return o;
    } else { const b = bbox(o); if (p.x > b.l-tol && p.x < b.r+tol && p.y > b.t-tol && p.y < b.b+tol) return o; }
  }
  return null;
}
function translate(o,dx,dy){
  if (o.pts) o.pts.forEach(pt => { pt[0] += dx; pt[1] += dy; });
  o.x1 += dx; o.y1 += dy; if (o.x2 != null){ o.x2 += dx; o.y2 += dy; }
}
const snap = p => S.grid ? {x:Math.round(p.x/GRID)*GRID, y:Math.round(p.y/GRID)*GRID} : p;

/* ---------- Rendu ---------- */
function drawObj(c,o){
  c.save();
  c.strokeStyle = c.fillStyle = o.c; c.lineWidth = o.w; c.lineCap = 'round'; c.lineJoin = 'round';
  const l = Math.min(o.x1,o.x2), t = Math.min(o.y1,o.y2), w = Math.abs(o.x2-o.x1), h = Math.abs(o.y2-o.y1);
  const P = pts => { c.beginPath(); c.moveTo(...pts[0]); pts.slice(1).forEach(q => c.lineTo(...q)); };
  switch (o.t){
    case 'pen': {                                             // lissé par des quadratiques passant par les milieux
      const p = o.pts; c.beginPath(); c.moveTo(p[0][0], p[0][1]);
      if (p.length === 1) c.lineTo(p[0][0] + .01, p[0][1]);
      else { for (let i = 1; i < p.length - 1; i++) c.quadraticCurveTo(p[i][0], p[i][1], (p[i][0]+p[i+1][0])/2, (p[i][1]+p[i+1][1])/2);
             c.lineTo(...p[p.length-1]); }
      c.stroke(); break; }
    case 'line': P([[o.x1,o.y1],[o.x2,o.y2]]); c.stroke(); break;
    case 'arrow': {
      P([[o.x1,o.y1],[o.x2,o.y2]]); c.stroke();
      const a = Math.atan2(o.y2-o.y1, o.x2-o.x1), len = 10 + o.w * 2.5, sp = .45;
      P([[o.x2 - len*Math.cos(a-sp), o.y2 - len*Math.sin(a-sp)], [o.x2,o.y2], [o.x2 - len*Math.cos(a+sp), o.y2 - len*Math.sin(a+sp)]]); c.stroke(); break; }
    case 'dim': {                                             // cote : flèches aux deux bouts + valeur
      const a = Math.atan2(o.y2-o.y1, o.x2-o.x1), nx = -Math.sin(a), ny = Math.cos(a), len = 9 + o.w * 2, sp = .42, e = 10;
      P([[o.x1,o.y1],[o.x2,o.y2]]); c.stroke();
      for (const [x,y,d] of [[o.x1,o.y1,1],[o.x2,o.y2,-1]]){
        const b = a + (d < 0 ? Math.PI : 0);
        P([[x + len*Math.cos(b-sp), y + len*Math.sin(b-sp)], [x,y], [x + len*Math.cos(b+sp), y + len*Math.sin(b+sp)]]); c.stroke();
        P([[x - nx*e, y - ny*e], [x + nx*e, y + ny*e]]); c.stroke();
      }
      if (o.label){
        const fs = o.size || 15;
        let ang = a; if (ang > Math.PI/2 || ang < -Math.PI/2) ang += Math.PI;   // texte jamais à l'envers
        c.translate((o.x1+o.x2)/2, (o.y1+o.y2)/2); c.rotate(ang);
        c.font = font(fs); c.textAlign = 'center'; c.textBaseline = 'bottom';
        const tw = c.measureText(o.label).width;
        c.fillStyle = '#fff'; c.fillRect(-tw/2 - 4, -fs - 6, tw + 8, fs + 2);
        c.fillStyle = o.c; c.fillText(o.label, 0, -5);
      }
      break; }
    case 'hole': {                                            // trou : cercle + axes en trait mixte
      const cx = l+w/2, cy = t+h/2, ext = w * .3;
      c.beginPath(); c.ellipse(cx, cy, w/2, h/2, 0, 0, Math.PI*2); c.stroke();
      c.lineWidth = Math.max(1, o.w * .45); c.setLineDash([o.w*3, o.w*1.2, o.w*.6, o.w*1.2]);
      P([[cx, t-ext],[cx, t+h+ext]]); c.stroke(); P([[l-ext, cy],[l+w+ext, cy]]); c.stroke(); break; }
    case 'rect': c.strokeRect(l,t,w,h); break;
    case 'circle': c.beginPath(); c.ellipse(l+w/2, t+h/2, w/2, h/2, 0, 0, Math.PI*2); c.stroke(); break;
    case 'triangle': P([[l+w/2,t],[l+w,t+h],[l,t+h]]); c.closePath(); c.stroke(); break;
    case 'diamond': P([[l+w/2,t],[l+w,t+h/2],[l+w/2,t+h],[l,t+h/2]]); c.closePath(); c.stroke(); break;
    case 'cube': {                                            // projection oblique, arêtes cachées en pointillé
      const d = Math.min(w,h) * .32;
      c.strokeRect(l, t+d, w-d, h-d);
      P([[l,t+d],[l+d,t],[l+w,t],[l+w,t+h-d],[l+w-d,t+h]]); c.stroke();
      P([[l+w-d,t+d],[l+w,t]]); c.stroke();
      c.setLineDash([o.w*2, o.w*2.2]); c.globalAlpha = .55;
      P([[l+d,t],[l+d,t+h-d],[l+w,t+h-d]]); c.stroke(); P([[l+d,t+h-d],[l,t+h]]); c.stroke();
      break; }
    case 'sphere': {
      const cx = l+w/2, cy = t+h/2;
      c.beginPath(); c.ellipse(cx, cy, w/2, h/2, 0, 0, Math.PI*2); c.stroke();
      c.beginPath(); c.ellipse(cx, cy, w/2, h*.14, 0, 0, Math.PI); c.stroke();
      c.setLineDash([o.w*2, o.w*2.2]); c.globalAlpha = .55;
      c.beginPath(); c.ellipse(cx, cy, w/2, h*.14, 0, Math.PI, Math.PI*2); c.stroke(); break; }
    case 'text':
      c.font = font(o.size); c.textBaseline = 'top';
      o.text.split('\n').forEach((s,i) => c.fillText(s, o.x1, o.y1 + i * o.size * 1.25 + o.size * .1)); break;
    case 'image':
      if (o._img && o._img.complete && o._img.naturalWidth) c.drawImage(o._img, l, t, w, h);
      else { c.strokeStyle = '#d0d5dd'; c.lineWidth = 1; c.strokeRect(l,t,w,h); } break;
  }
  c.restore();
}
function drawGrid(){
  const step = GRID * view.s; if (step < 5) return;
  const i0 = Math.floor(-view.x/step), i1 = Math.ceil((W-view.x)/step), j0 = Math.floor(-view.y/step), j1 = Math.ceil((H-view.y)/step);
  ctx.lineWidth = 1;
  for (const major of [false, true]){
    ctx.strokeStyle = major ? '#c9d3e0' : '#e8edf3'; ctx.beginPath();
    for (let i = i0; i <= i1; i++) if ((i % 5 === 0) === major){ const x = Math.round(view.x + i*step) + .5; ctx.moveTo(x,0); ctx.lineTo(x,H); }
    for (let j = j0; j <= j1; j++) if ((j % 5 === 0) === major){ const y = Math.round(view.y + j*step) + .5; ctx.moveTo(0,y); ctx.lineTo(W,y); }
    ctx.stroke();
  }
}
function render(){
  ctx.setTransform(DPR,0,0,DPR,0,0); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,W,H);
  if (S.grid) drawGrid();
  ctx.setTransform(DPR*view.s, 0, 0, DPR*view.s, DPR*view.x, DPR*view.y);
  objs.forEach(o => drawObj(ctx,o));
  if (draft) drawObj(ctx, draft);
  const bar = $('selBar');
  if (S.sel && objs.includes(S.sel)){
    const b = bbox(S.sel), m = 6 / view.s;
    ctx.save(); ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1.5 / view.s; ctx.setLineDash([6/view.s, 4/view.s]);
    ctx.strokeRect(b.l-m, b.t-m, b.r-b.l+2*m, b.b-b.t+2*m); ctx.restore();
    const sx = (b.l+b.r)/2*view.s + view.x; let sy = (b.t-m)*view.s + view.y - 56;
    if (sy < 76) sy = (b.b+m)*view.s + view.y + 12;
    bar.style.left = Math.max(130, Math.min(W-130, sx)) + 'px'; bar.style.top = Math.min(H-170, Math.max(76, sy)) + 'px';
    bar.hidden = !!action;
  } else { S.sel = null; bar.hidden = true; }
  $('hint').hidden = !doc || objs.length > 0 || !!draft;
}
function renderTo(list, w, h, pad){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0,0,w,h);
  if (!list.length) return c;
  const b = union(list), s = Math.min((w-2*pad)/Math.max(b.r-b.l,1), (h-2*pad)/Math.max(b.b-b.t,1));
  x.setTransform(s, 0, 0, s, w/2 - (b.l+b.r)/2*s, h/2 - (b.t+b.b)/2*s);
  list.forEach(o => drawObj(x,o));
  return c;
}
const thumbOf = list => renderTo(list, 320, 240, 18).toDataURL('image/jpeg', .72);
function fitView(){
  if (!objs.length){ view.s = 1; view.x = W/2; view.y = H/2; return; }
  const b = union(objs), top = 80, bottom = 112, aw = W - 40, ah = H - top - bottom;
  view.s = Math.max(.25, Math.min(aw/(b.r-b.l), ah/(b.b-b.t), 1.6));
  view.x = W/2 - (b.l+b.r)/2*view.s; view.y = top + ah/2 - (b.t+b.b)/2*view.s;
}
function resize(){
  // garde le même point du dessin au centre de l'écran (rotation de l'iPhone)
  const c = toWorld(W/2, H/2);
  DPR = Math.min(devicePixelRatio || 1, 3); W = innerWidth; H = innerHeight;
  view.x = W/2 - c.x*view.s; view.y = H/2 - c.y*view.s;
  cv.width = Math.round(W*DPR); cv.height = Math.round(H*DPR); render();
}

/* ---------- Historique ---------- */
function snapshot(){ hist.push(ser(objs)); if (hist.length > 100) hist.shift(); fut = []; }
function changed(){ updateUI(); render(); scheduleSave(); }
function undo(){ if (!hist.length) return; fut.push(ser(objs)); objs = deser(hist.pop()); S.sel = null; changed(); }
function redo(){ if (!fut.length) return; hist.push(ser(objs)); objs = deser(fut.pop()); S.sel = null; changed(); }

/* ---------- Pointeurs sur la zone de dessin ---------- */
function anyOverlayOpen(){ return !$('menu').hidden || !$('popShapes').hidden || !$('popColors').hidden; }
cv.addEventListener('pointerdown', e => {
  if (anyOverlayOpen()){ closeOverlays(); return; }
  cv.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (pointers.size === 2){                           // deux doigts : zoom / déplacement de la vue
    if (action && action.moved){ hist.length && undoSilently(); }
    draft = null; action = null;
    const [a,b] = [...pointers.values()];
    gesture = {d:Math.hypot(a.x-b.x, a.y-b.y) || 1, m:{x:(a.x+b.x)/2, y:(a.y+b.y)/2}, v:{...view}};
    render(); return;
  }
  if (pointers.size > 2 || gesture) return;
  const p = toWorld(e.clientX, e.clientY);
  const base = {c:S.color, w:S.width};
  if (S.tool === 'pen'){ draft = {t:'pen', ...base, pts:[[p.x,p.y]]}; action = 'draw'; }
  else if (S.tool === 'shape'){ const s = snap(p); draft = {t:S.shape, ...base, x1:s.x, y1:s.y, x2:s.x, y2:s.y}; action = 'draw'; }
  else if (S.tool === 'text'){ textAt = p; action = 'text'; }
  else if (S.tool === 'move'){
    const hit = hitTest(p);
    if (hit){ S.sel = hit; action = {k:'drag', last:p, moved:false}; }
    else { S.sel = null; action = {k:'pan', sx:e.clientX, sy:e.clientY, vx:view.x, vy:view.y}; }
  }
  render();
});
// un déplacement interrompu par un 2e doigt est annulé, sans laisser d'entrée « rétablir »
function undoSilently(){ objs = deser(hist.pop()); S.sel = null; updateUI(); }
cv.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (gesture && pointers.size >= 2){
    const [a,b] = [...pointers.values()], d = Math.hypot(a.x-b.x, a.y-b.y), m = {x:(a.x+b.x)/2, y:(a.y+b.y)/2}, g = gesture;
    view.s = Math.max(.2, Math.min(8, g.v.s * d / g.d));
    const wx = (g.m.x - g.v.x) / g.v.s, wy = (g.m.y - g.v.y) / g.v.s;
    view.x = m.x - wx*view.s; view.y = m.y - wy*view.s;
    showZoom(); render(); return;
  }
  if (!action) return;
  const p = toWorld(e.clientX, e.clientY);
  if (action === 'draw' && draft.t === 'pen'){
    const q = draft.pts[draft.pts.length-1];
    if (Math.hypot(p.x-q[0], p.y-q[1]) * view.s > 1.5) draft.pts.push([p.x,p.y]);
  } else if (action === 'draw'){
    let s = snap(p);
    if (draft.t === 'circle' || draft.t === 'sphere' || draft.t === 'hole'){   // garder rond
      const dx = s.x-draft.x1, dy = s.y-draft.y1, n = Math.max(Math.abs(dx), Math.abs(dy));
      s = {x:draft.x1 + Math.sign(dx||1)*n, y:draft.y1 + Math.sign(dy||1)*n};
    } else if ((draft.t === 'line' || draft.t === 'arrow' || draft.t === 'dim') && !S.grid){   // redresse à 0/45/90°
      const dx = s.x-draft.x1, dy = s.y-draft.y1, a = Math.atan2(dy,dx), st = Math.PI/4, sa = Math.round(a/st)*st, L = Math.hypot(dx,dy);
      if (Math.abs(a-sa) < .09) s = {x:draft.x1 + Math.cos(sa)*L, y:draft.y1 + Math.sin(sa)*L};
    }
    draft.x2 = s.x; draft.y2 = s.y;
  } else if (action.k === 'drag'){
    if (!action.moved){ snapshot(); action.moved = true; }
    translate(S.sel, p.x-action.last.x, p.y-action.last.y); action.last = p;
  } else if (action.k === 'pan'){
    view.x = action.vx + e.clientX - action.sx; view.y = action.vy + e.clientY - action.sy;
  }
  render();
});
function endPointer(e){
  if (!pointers.delete(e.pointerId)) return;
  if (gesture){ if (!pointers.size) gesture = null; render(); return; }
  if (action === 'draw' && draft){
    const big = draft.pts ? true : Math.max(Math.abs(draft.x2-draft.x1), Math.abs(draft.y2-draft.y1)) * view.s > 4;
    if (big && e.type === 'pointerup'){ const o = draft; snapshot(); objs.push(o); draft = null; changed(); if (o.t === 'dim') askDim(o, true); }
    draft = null;
  } else if (action === 'text' && e.type === 'pointerup'){
    const hit = hitTest(textAt), p = textAt;
    action = null;
    if (hit && hit.t === 'text') editText(hit); else if (hit && hit.t === 'dim') askDim(hit); else addText(p);
  } else if (action && action.moved){ changed(); }
  action = null; render();
}
cv.addEventListener('pointerup', endPointer);
cv.addEventListener('pointercancel', endPointer);
cv.addEventListener('wheel', e => {                       // sur ordinateur : molette = zoom
  e.preventDefault();
  const f = Math.exp(-e.deltaY * (e.ctrlKey ? .01 : .0015)), s = Math.max(.2, Math.min(8, view.s * f));
  const w = toWorld(e.clientX, e.clientY); view.s = s; view.x = e.clientX - w.x*s; view.y = e.clientY - w.y*s;
  showZoom(); render();
}, {passive:false});
// Safari : empêcher le zoom de la page elle-même
['gesturestart','gesturechange','gestureend'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));
let zoomTimer;
function showZoom(){
  const z = $('zoomPill'); z.textContent = Math.round(view.s*100) + ' %'; z.hidden = false;
  clearTimeout(zoomTimer); zoomTimer = setTimeout(() => z.hidden = true, 2500);
}
$('zoomPill').addEventListener('click', () => { fitView(); render(); $('zoomPill').hidden = true; });

/* ---------- Texte et cotes ---------- */
const textSize = () => ({2:16, 4:22, 8:32})[S.width] || 22;
const dimSize = () => ({2:15, 4:18, 8:24})[S.width] || 18;
async function addText(p){
  const v = await ask({title:'Ajouter du texte', ok:'Ajouter', multiline:true});
  if (!v) return;
  const size = textSize();
  snapshot(); objs.push({t:'text', c:S.color, w:0, size, text:v, x1:p.x, y1:p.y - size/2}); changed();
}
async function editText(o){
  const v = await ask({title:'Modifier le texte', value:o.text, ok:'Enregistrer', multiline:true});
  if (v == null) return;
  snapshot(); if (v) o.text = v; else objs.splice(objs.indexOf(o), 1); changed();
}
async function askDim(o, fresh){
  const v = await ask({title:'Valeur de la cote', value:o.label || '', ok:fresh ? 'Ajouter' : 'Enregistrer',
                       help:'Ex. : 120 mm, 4 1/2 po, Ø 12'});
  if (v == null) return;
  if (!fresh) snapshot();
  o.label = v; o.size = dimSize(); changed();
}
// Dialogue : résout avec le texte saisi, ou null si annulé.
// En multiligne, « retour » ajoute une ligne (seul moyen sur iPhone) ; sinon il valide.
function ask({title, value = '', ok, help = '', multiline = false}){
  return new Promise(res => {
    const d = $('dlg'), inp = $('dlgInput'), f = $('dlgForm');
    $('dlgTitle').textContent = title; $('dlgOk').textContent = ok; inp.value = value;
    $('dlgHelp').textContent = help; $('dlgHelp').hidden = !help;
    inp.rows = multiline ? 3 : 1;
    inp.enterKeyHint = multiline ? 'enter' : 'done';
    d.hidden = false; inp.focus(); inp.setSelectionRange(value.length, value.length);
    const done = v => { d.hidden = true; f.onsubmit = null; $('dlgCancel').onclick = null; d.onpointerdown = null; inp.onkeydown = null; inp.blur(); res(v); };
    f.onsubmit = ev => { ev.preventDefault(); done(inp.value.trim()); };
    inp.onkeydown = ev => {
      if (ev.key === 'Enter' && (!multiline || ev.ctrlKey || ev.metaKey)){ ev.preventDefault(); f.requestSubmit(); }
      if (ev.key === 'Escape') done(null);
    };
    $('dlgCancel').onclick = () => done(null);
    d.onpointerdown = ev => { if (ev.target === d) done(null); };
  });
}

/* ---------- Barre d'outils ---------- */
function savePrefs(){ LS.set(PREFS, {tool:S.tool === 'move' ? 'pen' : S.tool, shape:S.shape, color:S.color, width:S.width, grid:S.grid}); }
function setTool(t){ S.tool = t; if (t !== 'move') S.sel = null; updateUI(); render(); }
document.querySelectorAll('.tool[data-tool]').forEach(b => {
  if (b.id === 'toolShape') return;
  b.addEventListener('click', () => { closeOverlays(); setTool(b.dataset.tool); });
});
const shapeBtn = $('toolShape'); let lpTimer, lpFired = false;
shapeBtn.addEventListener('pointerdown', () => {
  lpFired = false;
  lpTimer = setTimeout(() => { lpFired = true; setTool('shape'); openPop('popShapes'); navigator.vibrate && navigator.vibrate(10); }, 450);
});
['pointerup','pointerleave','pointercancel'].forEach(ev => shapeBtn.addEventListener(ev, () => clearTimeout(lpTimer)));
shapeBtn.addEventListener('contextmenu', e => e.preventDefault());
shapeBtn.addEventListener('click', () => {
  if (lpFired){ lpFired = false; return; }
  if (S.tool === 'shape') togglePop('popShapes');
  else {
    closeOverlays(); setTool('shape');
    if (!shapeTipShown){ shapeTipShown = true; toast('Astuce : maintenez ce bouton enfoncé pour choisir une autre forme (cote, trou, rectangle…).'); }
  }
});
$('shapeGrid').innerHTML = SHAPES.map(s => `<button data-shape="${s.id}" aria-pressed="false">${svg(I[s.id])}${s.label}</button>`).join('');
$('shapeGrid').addEventListener('click', e => { const b = e.target.closest('[data-shape]'); if (!b) return; S.shape = b.dataset.shape; setTool('shape'); closeOverlays(); });
$('toolColor').addEventListener('click', () => togglePop('popColors'));
$('colorGrid').innerHTML = COLORS.map(([c,n]) => `<button data-color="${c}" aria-label="${n}" title="${n}" aria-pressed="false" style="background:${c}"></button>`).join('');
$('colorGrid').addEventListener('click', e => { const b = e.target.closest('[data-color]'); if (!b) return; S.color = b.dataset.color; recolorSel(); updateUI(); });
$('widthGrid').innerHTML = WIDTHS.map(([w,n]) => `<button data-width="${w}" aria-pressed="false"><i style="height:${Math.max(2,w)}px"></i>${n}</button>`).join('');
$('widthGrid').addEventListener('click', e => { const b = e.target.closest('[data-width]'); if (!b) return; S.width = +b.dataset.width; updateUI(); });
function recolorSel(){ if (S.tool === 'move' && S.sel){ snapshot(); S.sel.c = S.color; changed(); } }

$('btnGrid').addEventListener('click', () => {
  S.grid = !S.grid; updateUI(); render();
  toast(S.grid ? 'Quadrillage activé — les formes s’alignent sur la grille' : 'Quadrillage désactivé');
});
$('btnUndo').addEventListener('click', undo);
$('btnRedo').addEventListener('click', redo);
$('btnDel').addEventListener('click', () => { if (!S.sel) return; snapshot(); objs.splice(objs.indexOf(S.sel), 1); S.sel = null; changed(); });
$('btnDup').addEventListener('click', () => {
  if (!S.sel) return; snapshot();
  const c = hydrate(JSON.parse(ser([S.sel]))[0]); translate(c, 20, 20); objs.push(c); S.sel = c; changed();
});
addEventListener('keydown', e => {
  if (!$('dlg').hidden) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){ e.preventDefault(); e.shiftKey ? redo() : undo(); }
  if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel) $('btnDel').click();
  if (e.key === 'Escape'){ closeOverlays(); closeSheets(); }
});

function updateUI(){
  document.querySelectorAll('.tool[data-tool]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tool === S.tool));
  const sh = SHAPES.find(s => s.id === S.shape);
  $('shapeIco').innerHTML = svg(I[sh.id]); $('shapeLbl').textContent = sh.short || sh.label;
  document.querySelectorAll('[data-shape]').forEach(b => b.setAttribute('aria-pressed', b.dataset.shape === S.shape));
  document.querySelectorAll('[data-color]').forEach(b => b.setAttribute('aria-pressed', b.dataset.color === S.color));
  document.querySelectorAll('[data-width]').forEach(b => {
    b.setAttribute('aria-pressed', +b.dataset.width === S.width);
    b.querySelector('i').style.background = S.color === '#ffffff' ? '#98a2b3' : S.color;
  });
  $('colorIco').style.background = S.color;
  $('btnGrid').setAttribute('aria-pressed', S.grid);
  $('btnUndo').disabled = !hist.length; $('btnRedo').disabled = !fut.length;
  savePrefs();
}

/* ---------- Menu, popovers, feuilles ---------- */
function openPop(id){ closeOverlays(); $(id).hidden = false; }
function togglePop(id){ const was = !$(id).hidden; closeOverlays(); if (!was) $(id).hidden = false; }
function closeOverlays(){
  ['popShapes','popColors','menu'].forEach(id => $(id).hidden = true);
  $('btnMenu').hidden = false; $('btnMenu').setAttribute('aria-expanded', 'false');
}
function openMenu(){ closeOverlays(); updateStatus(); $('menu').hidden = false; $('btnMenu').hidden = true; $('btnMenu').setAttribute('aria-expanded','true'); }
$('btnMenu').addEventListener('click', openMenu);
$('btnMenuClose').addEventListener('click', closeOverlays);
$('btnRename').addEventListener('click', async () => {
  const v = await ask({title:'Nom du dessin', value:doc.name, ok:'Renommer'});
  if (v){ doc.name = v.replace(/\s+/g,' '); updateStatus(); saveNow(true); }
});
$('menu').addEventListener('click', e => {
  const act = e.target.closest('[data-act]'); if (!act) return;
  closeOverlays();
  ({new:actNew, list:openList, import:() => $('fileIn').click(), export:() => openSheet('sheetExport')})[act.dataset.act]();
});
function openSheet(id){ closeOverlays(); $('scrim').hidden = false; $(id).hidden = false; }
function closeSheets(){ $('scrim').hidden = true; ['sheetList','sheetExport'].forEach(id => $(id).hidden = true); }
$('scrim').addEventListener('click', closeSheets);
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeSheets));

async function actNew(){
  const had = objs.length;
  await saveNow();
  newDoc();
  if (had) toast('Nouveau dessin — le précédent est gardé dans « Mes dessins ».');
}

/* Mes dessins */
let listed = [];
async function openList(){
  await saveNow();
  try { listed = (await DB.all()).sort((a,b) => b.updated - a.updated); }
  catch(err){ listed = []; toast('Impossible de lire les dessins enregistrés.'); }
  $('cards').innerHTML = listed.length ? listed.map(d => `
    <div class="card${doc && d.id === doc.id ? ' current' : ''}">
      <button class="card-open" data-open="${d.id}"><img src="${d.thumb}" alt=""><span class="card-name">${esc(d.name)}</span>
        <span class="card-date">${doc && d.id === doc.id ? 'Ouvert maintenant' : fmtDate(d.updated)}</span></button>
      <button class="card-del" data-del="${d.id}" aria-label="Supprimer ${esc(d.name)}">${svg(I.trash)}</button>
    </div>`).join('') : '<p class="empty">Aucun dessin enregistré pour l’instant.</p>';
  if ($('sheetList').hidden) openSheet('sheetList');
}
$('cards').addEventListener('click', async e => {
  const o = e.target.closest('[data-open]'), d = e.target.closest('[data-del]');
  if (o){
    const found = listed.find(x => x.id === o.dataset.open);
    if (found){ if (found.id !== doc.id){ await saveNow(); openDoc(found); } closeSheets(); }
  }
  if (d){
    const found = listed.find(x => x.id === d.dataset.del);
    if (!found || !confirm(`Supprimer « ${found.name} » ? Cette action est définitive.`)) return;
    await DB.del(found.id).catch(() => {});
    if (doc && found.id === doc.id){ doc.stored = false; objs = []; newDoc(); }
    openList();
  }
});

/* Exporter */
// La feuille de partage d'iOS exige un geste de l'utilisateur : le fichier est donc préparé de façon synchrone.
function share(blob, name){
  const file = new File([blob], name, {type:blob.type});
  if (navigator.canShare && navigator.canShare({files:[file]}))
    return navigator.share({files:[file], title:doc.name}).catch(() => {});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function dataUrlToBlob(url){
  const [head, b64] = url.split(','), bin = atob(b64), buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return new Blob([buf], {type:head.slice(5, head.indexOf(';'))});
}
const safeName = () => (doc.name || 'plan').replace(/[\\/:*?"<>|]+/g, '-');
$('expPng').addEventListener('click', () => {
  if (!objs.length){ toast('Le dessin est vide.'); return; }
  const b = union(objs), bw = b.r-b.l, bh = b.b-b.t, s = Math.min(2, 4000/bw, 4000/bh);
  const png = renderTo(objs, Math.round(bw*s + 80), Math.round(bh*s + 80), 40).toDataURL('image/png');
  closeSheets();
  share(dataUrlToBlob(png), safeName() + '.png');
});
$('expPlan').addEventListener('click', () => {
  closeSheets();
  share(new Blob([JSON.stringify({app:'plans', version:1, name:doc.name, objs:JSON.parse(ser(objs))})], {type:'application/json'}), safeName() + '.plan.json');
});

/* Importer */
$('fileIn').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  if (/json$/i.test(f.name) || f.type.includes('json')){
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data.objs)) throw new Error('format');
      await saveNow();
      openDoc({id:uid(), name:data.name || f.name.replace(/\.plan\.json$|\.json$/i,''), objs:data.objs}, false);
      saveNow(true);
      toast('Dessin importé.');
    } catch(err){ toast('Ce fichier n’est pas un dessin valide.'); }
    return;
  }
  const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); });
  const im = new Image();
  im.onerror = () => toast('Cette image ne peut pas être ouverte.');
  im.onload = () => {
    // réduite à 1600 px puis placée en arrière-plan, pour décalquer une photo de plan
    const max = 1600, k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
    c.width = Math.round(im.width*k); c.height = Math.round(im.height*k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    const src = c.toDataURL('image/jpeg', .82), tl = toWorld(20, 90), vw = (W-40)/view.s, vh = (H-210)/view.s;
    const sc = Math.min(vw/c.width, vh/c.height), w = c.width*sc, h = c.height*sc;
    const o = hydrate({t:'image', src, w:0, c:'#000', x1:tl.x + (vw-w)/2, y1:tl.y + (vh-h)/2, x2:tl.x + (vw+w)/2, y2:tl.y + (vh+h)/2});
    snapshot(); objs.unshift(o); changed();
    toast('Image importée en arrière-plan — dessinez par-dessus, ou « Déplacer » pour la bouger.');
  };
  im.src = url;
});

let toastTimer;
function toast(msg){ const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.hidden = true, 3200); }

/* ---------- Démarrage ---------- */
const prefs = LS.get(PREFS);
if (prefs){
  if (['pen','shape','text'].includes(prefs.tool)) S.tool = prefs.tool;
  if (SHAPES.some(s => s.id === prefs.shape)) S.shape = prefs.shape;
  if (COLORS.some(([c]) => c === prefs.color)) S.color = prefs.color;
  if (WIDTHS.some(([w]) => w === prefs.width)) S.width = prefs.width;
  S.grid = !!prefs.grid;
}
addEventListener('resize', resize);
updateUI(); resize();
(async () => {
  let cur = null;
  try { const id = LS.get(CUR); if (id) cur = await DB.get(id); } catch(err){ /* IndexedDB indisponible : on dessine quand même */ }
  cur ? openDoc(cur) : newDoc();
})();
addEventListener('pagehide', () => saveNow());
document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });

/* ---------- PWA : hors-ligne ---------- */
if ('serviceWorker' in navigator && location.protocol !== 'file:'){
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
