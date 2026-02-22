import { Storage } from "./storage.js";
import { canEnter, applyEffects } from "./engine.js";

const SAVE_KEY = "cthulhu_nataniel_save_v1";

const $ = (q)=>document.querySelector(q);
const $mapWrap = $("#mapWrap");
const $map = $("#map");
const $hotspots = $("#hotspots");
const $title = $("#title");
const $text = $("#text");
const $actions = $("#actions");
const $hp = $("#hp");
const $time = $("#time");

let world, state;
let showHotspotMap = false;
let editorMode = false;

// editor state
let isDown = false;
let start = null;
let boxEl = null;
let badgeEl = null;

async function init(){
  world = await fetch("src/content/world.json").then(r=>r.json());

  const loaded = Storage.load(SAVE_KEY);
  state = loaded?.state ?? structuredClone(world.state);

  renderStatus();
  renderHotspots();
  show("Clique une pièce.");
  bindFooter();
  bindEditor();
}

function bindFooter(){
  $("#btnSave").onclick = ()=> Storage.save(SAVE_KEY, { state });

  $("#btnLoad").onclick = ()=>{
    const loaded = Storage.load(SAVE_KEY);
    if(loaded?.state){
      state = loaded.state;
      renderStatus();
      renderHotspots();
      show("Partie chargée. Clique une pièce.");
    }
    // Plein écran carte
const btnMap = document.querySelector("#btnMap");
if(btnMap){
  btnMap.onclick = ()=>{
    document.body.classList.toggle("mapOnly");
    btnMap.textContent = document.body.classList.contains("mapOnly") ? "Retour" : "Plein écran";
  };
}
  };

  $("#btnReset").onclick = ()=>{
    state = structuredClone(world.state);
    Storage.clear(SAVE_KEY);
    renderStatus();
    renderHotspots();
    show("Reset effectué. Clique une pièce.");
  };

  // Toggle carte / carte hotspots
  $("#btnGrid").onclick = ()=>{
    showHotspotMap = !showHotspotMap;
    $map.src = showHotspotMap ? "assets/plan_hotspots.png" : "assets/plan1.png";
  };

  // Mode édition
  const btnEdit = $("#btnEdit");
  if(btnEdit){
    btnEdit.onclick = ()=>{
      editorMode = !editorMode;
      document.body.classList.toggle("editorOn", editorMode);
      show(editorMode ? "MODE ÉDITION: glisse ton doigt pour dessiner un rectangle.\nTu copies le JSON affiché." : "Clique une pièce.");
      if(!editorMode) cleanupEditorUI();
    };
  }
}

function renderStatus(){
  $hp.textContent = `PV: ${state.hp}/20`;
  $time.textContent = `Temps: ${state.time} min`;
}

function renderHotspots(){
  $hotspots.innerHTML = "";

  world.hotspots.forEach(h => {
    const node = world.nodes[h.id];
    const btn = document.createElement("button");
    btn.className = "hotspot";
    btn.style.left = h.x + "%";
    btn.style.top = h.y + "%";
    btn.style.width = h.w + "%";
    btn.style.height = h.h + "%";
    btn.title = node?.title ?? `Zone ${h.id}`;

    const locked = node && !canEnter(node, state);
    if(locked) btn.classList.add("locked");

    btn.onclick = () => {
      if(editorMode) return;
      if(!node) return;
      if(!canEnter(node, state)){
        showLocked(node);
        return;
      }
      showNode(h.id);
    };

    $hotspots.appendChild(btn);
  });
}

function show(message){
  $title.textContent = "Carte";
  $text.textContent = message;
  $actions.innerHTML = "";
  renderStatus();
}

function showLocked(node){
  $title.textContent = node.title;
  $text.textContent = node.lockedText ?? "Accès verrouillé.";
  $actions.innerHTML = "";
  addAction("Retour carte", ()=>show("Clique une pièce."));
  renderStatus();
}

function showNode(id, extra=null){
  const node = world.nodes[id];
  $title.textContent = node.title;
  $text.textContent = node.text + (extra ? "\n\n" + extra : "");
  $actions.innerHTML = "";

  node.actions.forEach(a=>{
    addAction(a.label, ()=>{
      if(a.goto){
        show("Clique une pièce.");
        return;
      }
      if(a.effects) applyEffects(a.effects, state);
      renderStatus();
      renderHotspots();
      showNode(id, a.result ?? null);
      Storage.save(SAVE_KEY, { state }); // autosave
    });
  });
}

function addAction(label, fn){
  const b = document.createElement("button");
  b.className = "btn";
  b.textContent = "➤ " + label;
  b.onclick = fn;
  $actions.appendChild(b);
}

/* =========================
   EDITOR (draw rectangle -> %)
   ========================= */
function bindEditor(){
  // touch + mouse support
  $mapWrap.addEventListener("mousedown", onDown);
  $mapWrap.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);

  $mapWrap.addEventListener("touchstart", onDown, { passive:false });
  $mapWrap.addEventListener("touchmove", onMove, { passive:false });
  window.addEventListener("touchend", onUp);
}

function getPoint(evt){
  const t = evt.touches?.[0] || evt.changedTouches?.[0];
  const clientX = t ? t.clientX : evt.clientX;
  const clientY = t ? t.clientY : evt.clientY;

  const rect = $map.getBoundingClientRect();
  // clamp inside image
  const x = Math.max(rect.left, Math.min(clientX, rect.right));
  const y = Math.max(rect.top, Math.min(clientY, rect.bottom));
  return { x, y, rect };
}

function onDown(evt){
  if(!editorMode) return;
  evt.preventDefault();
  isDown = true;
  const p = getPoint(evt);
  start = p;

  if(!boxEl){
    boxEl = document.createElement("div");
    boxEl.className = "drawBox";
    $mapWrap.appendChild(boxEl);
  }
  if(!badgeEl){
    badgeEl = document.createElement("div");
    badgeEl.className = "coordBadge";
    $mapWrap.appendChild(badgeEl);
  }
  updateBox(p, p); // init
}

function onMove(evt){
  if(!editorMode || !isDown) return;
  evt.preventDefault();
  const p = getPoint(evt);
  updateBox(start, p);
}

function onUp(){
  if(!editorMode) return;
  isDown = false;
}

function updateBox(a, b){
  const rect = a.rect; // same image rect
  const x1 = Math.min(a.x, b.x);
  const y1 = Math.min(a.y, b.y);
  const x2 = Math.max(a.x, b.x);
  const y2 = Math.max(a.y, b.y);

  // draw relative to mapWrap
  const wrapRect = $mapWrap.getBoundingClientRect();
  boxEl.style.left = (x1 - wrapRect.left + $mapWrap.scrollLeft) + "px";
  boxEl.style.top = (y1 - wrapRect.top + $mapWrap.scrollTop) + "px";
  boxEl.style.width = (x2 - x1) + "px";
  boxEl.style.height = (y2 - y1) + "px";

  // convert to %
  const px = ((x1 - rect.left) / rect.width) * 100;
  const py = ((y1 - rect.top) / rect.height) * 100;
  const pw = ((x2 - x1) / rect.width) * 100;
  const ph = ((y2 - y1) / rect.height) * 100;

  const data = {
    id: "XX",
    x: round2(px),
    y: round2(py),
    w: round2(pw),
    h: round2(ph)
  };

  badgeEl.innerHTML =
    `Hotspot % (remplace id):<br><code>${JSON.stringify(data)}</code>`;
}

function round2(n){ return Math.round(n * 100) / 100; }

function cleanupEditorUI(){
  if(boxEl){ boxEl.remove(); boxEl = null; }
  if(badgeEl){ badgeEl.remove(); badgeEl = null; }
}

init();
