export function canEnter(node, state){
  if(!node.requires) return true;
  return node.requires.every(req => getPath(state, req) === true);
}

export function applyEffects(effects, state){
  if(!effects) return;

  for(const [k,v] of Object.entries(effects)){
    if(k === "time:+") state.time += v;
    else if(k === "hp:+") state.hp = clamp(state.hp + v, 0, 20);
    else if(k === "inv:+") state.inv.push(v);
    else if(k.includes(".")) setPath(state, k, v);
    else state[k] = v;
  }
}

function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }

function getPath(obj, path){
  const p = path.split(".");
  let cur = obj;
  for(const part of p){ if(cur == null) return undefined; cur = cur[part]; }
  return cur;
}

function setPath(obj, path, value){
  const p = path.split(".");
  let cur = obj;
  for(let i=0;i<p.length-1;i++){
    const part = p[i];
    cur[part] ??= {};
    cur = cur[part];
  }
  cur[p.at(-1)] = value;
}
