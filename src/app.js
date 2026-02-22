import { Storage } from "./storage.js";
import { canEnter, applyEffects } from "./engine.js";

const SAVE_KEY = "cthulhu_nataniel_save_v1";

const $ = (q)=>document.querySelector(q);
const $hotspots = $("#hotspots");
const $title = $("#title");
const $text = $("#text");
const $actions = $("#actions");
const $hp = $("#hp");
const $time = $("#time");
const $map = document.querySelector("#map");
let showHotspotMap = false;

let world, state;

async function init(){
  world = await fetch("src/content/world.json").then(r=>r.json());

  const loaded = Storage.load(SAVE_KEY);
  state = loaded?.state ?? structuredClone(world.state);

  renderStatus();
  renderHotspots();
  show("Clique une pièce.");
  bindFooter();
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
  };
  $("#btnReset").onclick = ()=>{
    state = structuredClone(world.state);
    Storage.clear(SAVE_KEY);
    renderStatus();
    renderHotspots();
    show("Reset effectué. Clique une pièce.");
  };
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

init();
