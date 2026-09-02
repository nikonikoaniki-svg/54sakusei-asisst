
const state={materials:[],materialGroups:[],candidates:null,generalHints:null,support:null,last:{}};
const $=id=>document.getElementById(id);

const pick=(arr,last=null)=>{
  if(!arr||!arr.length)return "";
  let v=arr[Math.floor(Math.random()*arr.length)],n=0;
  while(v===last&&arr.length>1&&n<15){v=arr[Math.floor(Math.random()*arr.length)];n++}
  return v;
};

function flattenMaterials(data){
  const items=[];
  const groups=[];
  for(const c of data.categories||[]){
    groups.push({category:c.category,items:c.items||[]});
    for(const item of c.items||[])items.push({category:c.category,value:item});
  }
  return {items,groups};
}

function poolFromCandidates(name){
  const map={event:"events",trouble:"troubles",ending:"endings"};
  return (state.candidates?.datasets?.[map[name]]||[]).flatMap(x=>x.items||[]);
}

function getHintPool(tag){
  return state.generalHints?.[tag] || [];
}

function replaceTokens(s){
  const t1=$("theme1").value.trim()||"テーマ①";
  const t2=$("theme2").value.trim()||"テーマ②";
  return s.replaceAll("①",t1).replaceAll("②",t2);
}

function randomTheme1(){
  const item=pick(state.materials,state.last.theme1);
  $("theme1").value=item.value;
  state.last.theme1=item;
  update();
}

function randomTheme2(){
  const t1=$("theme1").value.trim();
  let pool=state.materials;

  // If theme1 came from materials, avoid same category when possible
  if(state.last.theme1?.category){
    const alt=state.materials.filter(x=>x.category!==state.last.theme1.category);
    if(alt.length)pool=alt;
  }else if(t1){
    // Best-effort: find category of manually entered theme1 if exact match exists
    const match=state.materials.find(x=>x.value===t1);
    if(match){
      const alt=state.materials.filter(x=>x.category!==match.category);
      if(alt.length)pool=alt;
    }
  }

  const item=pick(pool,state.last.theme2);
  $("theme2").value=item.value;
  state.last.theme2=item;
  update();
}

function randomCandidate(kind){
  const pool=poolFromCandidates(kind);
  const v=pick(pool,state.last[kind]);
  $(kind).value=v;
  state.last[kind]=v;
  update();
}

function randomAction(){
  const pool=state.support?.actions||[];
  const v=pick(pool,state.last.action);
  $("action").value=v;
  state.last.action=v;
  update();
}

function showHint(tag,boxId,textId){
  const pool=getHintPool(tag);
  if(!pool.length)return;
  const item=pick(pool,state.last[`hint_${tag}`]);
  state.last[`hint_${tag}`]=item;
  $(textId).textContent=replaceTokens(item);
  $(boxId).classList.remove("hide");
}

function val(id){return $(id).value.trim();}

function update(){
  const t1=val("theme1"),t2=val("theme2");
  $("resultThemes").textContent=[t1,t2].filter(Boolean).join(" × ")||"—";
  $("resultEvent").textContent=val("event")||"—";
  $("resultTrouble").textContent=val("trouble")||"—";
  $("resultAction").textContent=val("action")||"—";
  $("resultEnding").textContent=val("ending")||"—";

  const parts=[];
  if(t1||t2)parts.push(`テーマは${[t1,t2].filter(Boolean).join(" × ")}。`);
  if(val("event"))parts.push(`${val("event")}。`);
  if(val("trouble"))parts.push(`${val("trouble")}。`);
  if(val("action"))parts.push(`そこで、${val("action")}。`);
  if(val("ending"))parts.push(`最後に、${val("ending")}。`);

  $("resultPillar").textContent=parts.length?parts.join(""):"テーマを入れると、ここに物語の柱が育っていきます。";
}

function resetAll(){
  ["theme1","theme2","event","trouble","action","ending"].forEach(id=>$(id).value="");
  ["hintBoxEvent","hintBoxTrouble","hintBoxAction","hintBoxEnding"].forEach(id=>$(id).classList.add("hide"));
  update();
  scrollTo({top:0,behavior:"smooth"});
}

function copyResult(){
  const text=[
    "🌱 54字の種ができました",
    `テーマ：${$("resultThemes").textContent}`,
    `出来事：${$("resultEvent").textContent}`,
    `展開：${$("resultTrouble").textContent}`,
    `行動：${$("resultAction").textContent}`,
    `最後：${$("resultEnding").textContent}`,
    "",
    `物語の柱：${$("resultPillar").textContent}`
  ].join("\n");

  navigator.clipboard.writeText(text).then(()=>{
    $("copyStatus").textContent="コピーしました。";
    setTimeout(()=>$("copyStatus").textContent="",1600);
  });
}

async function init(){
  const [materialsData,candidates,generalHints,support]=await Promise.all([
    fetch("materials.json").then(r=>r.json()),
    fetch("candidates.json").then(r=>r.json()),
    fetch("general_hints.json").then(r=>r.json()),
    fetch("story_support.json").then(r=>r.json())
  ]);

  const flattened=flattenMaterials(materialsData);
  state.materials=flattened.items;
  state.materialGroups=flattened.groups;
  state.candidates=candidates;
  state.generalHints=generalHints;
  state.support=support;

  document.querySelectorAll("input,textarea").forEach(x=>x.addEventListener("input",update));

  $("randomTheme1").onclick=randomTheme1;
  $("randomTheme2").onclick=randomTheme2;
  $("clearTheme2").onclick=()=>{$("theme2").value="";update()};

  $("randomEvent").onclick=()=>randomCandidate("event");
  $("randomTrouble").onclick=()=>randomCandidate("trouble");
  $("randomAction").onclick=randomAction;
  $("randomEnding").onclick=()=>randomCandidate("ending");

  $("hintEvent").onclick=()=>showHint("出来事","hintBoxEvent","hintTextEvent");
  $("hintTrouble").onclick=()=>showHint("展開","hintBoxTrouble","hintTextTrouble");
  $("hintAction").onclick=()=>showHint("行動","hintBoxAction","hintTextAction");
  $("hintEnding").onclick=()=>showHint("オチ","hintBoxEnding","hintTextEnding");

  document.querySelectorAll("[data-next-hint]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const tag=btn.dataset.nextHint;
      const parent=btn.closest(".hint");
      showHint(tag,parent.id,parent.querySelector("p").id);
    });
  });

  $("copyResult").onclick=copyResult;
  $("resetAll").onclick=resetAll;
  update();
}

init();
