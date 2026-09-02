
const state={themes:[],protagonists:[],candidates:null,hints:null,support:null,last:{}};
const $=id=>document.getElementById(id);
const pick=(arr,last=null)=>{
  if(!arr||!arr.length)return "";
  let v=arr[Math.floor(Math.random()*arr.length)],n=0;
  while(v===last&&arr.length>1&&n<15){v=arr[Math.floor(Math.random()*arr.length)];n++}
  return v;
};
const flatProtagonists=data=>(data.categories||[]).flatMap(x=>x.items||[]);
const poolFromCandidates=name=>{
  const map={event:"events",trouble:"troubles",ending:"endings"};
  return (state.candidates?.datasets?.[map[name]]||[]).flatMap(x=>x.items||[]);
};

function themes(){
  return {t1:$("theme1").value.trim(),t2:$("theme2").value.trim()};
}
function randomTheme(id){
  const v=pick(state.themes,state.last[id]);
  $(id).value=v;state.last[id]=v;update();
}
function themeRelatedProtagonists(){
  const {t1,t2}=themes();
  const p=[];
  if(t1)p.push(t1);
  if(t2)p.push(t2);
  if(t1){
    p.push(`${t1}を探している人`,`${t1}を研究する人`,`${t1}を守る人`,`${t1}を待つ人`,`${t1}を失った人`,`${t1}を見つけた人`);
  }
  if(t2){
    p.push(`${t2}を探している人`,`${t2}を研究する人`,`${t2}を隠している人`,`${t2}を知っている人`);
  }
  // useful special combinations
  const transformWords=["分身","影","夢","記憶","秘密","未来","過去","幽霊","ロボット"];
  if(t1&&t2&&transformWords.includes(t2)){
    const map={
      "分身":`${t1}の分身`,
      "影":`${t1}の影`,
      "夢":`${t1}の夢`,
      "記憶":`${t1}の記憶`,
      "秘密":`${t1}の秘密を知る人`,
      "未来":`未来の${t1}`,
      "過去":`過去の${t1}`,
      "幽霊":`${t1}の幽霊`,
      "ロボット":`${t1}型ロボット`
    };
    p.push(map[t2]);
  }
  return [...new Set(p.filter(Boolean))];
}
function randomRelatedProtagonist(){
  const pool=themeRelatedProtagonists();
  if(!pool.length){randomFreeProtagonist();return;}
  const v=pick(pool,state.last.relatedProtagonist);
  $("protagonist").value=v;state.last.relatedProtagonist=v;update();
}
function randomFreeProtagonist(){
  const v=pick(state.protagonists,state.last.protagonist);
  $("protagonist").value=v;state.last.protagonist=v;update();
}
function randomCandidate(kind){
  const pool=poolFromCandidates(kind);
  const v=pick(pool,state.last[kind]);
  $(kind).value=v;state.last[kind]=v;update();
}
function randomSupport(kind){
  const pool=state.support?.[kind==="desire"?"desires":"actions"]||[];
  const v=pick(pool,state.last[kind]);
  $(kind).value=v;state.last[kind]=v;update();
}
function getHintPool(tag){
  const mode=$("theme2").value.trim()?"two_word":"one_word";
  const out=[];
  for(const c of state.hints?.categories||[]){
    for(const item of c[mode]||[])if((item.tags||[]).includes(tag))out.push(item);
  }
  return out;
}
function replaceTokens(s){
  const {t1,t2}=themes();
  return s.replaceAll("①",t1||"テーマ①").replaceAll("②",t2||"テーマ②");
}
function showHint(tag,boxId,textId){
  const pool=getHintPool(tag); if(!pool.length)return;
  const item=pick(pool,state.last[`hint_${tag}`]);
  state.last[`hint_${tag}`]=item;
  $(textId).textContent=replaceTokens(item.template);
  $(boxId).classList.remove("hide");
}
function val(id){return $(id).value.trim();}
function update(){
  const {t1,t2}=themes();
  $("resultThemes").textContent=[t1,t2].filter(Boolean).join(" × ")||"—";
  $("resultProtagonist").textContent=val("protagonist")||"—";
  $("resultDesire").textContent=val("desire")||"—";
  $("resultEvent").textContent=val("event")||"—";
  $("resultTrouble").textContent=val("trouble")||"—";
  $("resultAction").textContent=val("action")||"—";
  $("resultEnding").textContent=val("ending")||"—";

  const parts=[];
  if(t1||t2)parts.push(`テーマは${[t1,t2].filter(Boolean).join(" × ")}。`);
  if(val("protagonist"))parts.push(`主人公は${val("protagonist")}。`);
  if(val("desire"))parts.push(`${val("protagonist")||"主人公"}は、${val("desire")}。`);
  if(val("event"))parts.push(`ところが、${val("event")}。`);
  if(val("trouble"))parts.push(`${val("trouble")}。`);
  if(val("action"))parts.push(`そこで、${val("protagonist")||"主人公"}は${val("action")}。`);
  if(val("ending"))parts.push(`最後に、${val("ending")}。`);
  $("resultPillar").textContent=parts.length?parts.join(""):"テーマを入れると、ここに物語の柱が育っていきます。";
}
function resetAll(){
  ["theme1","theme2","protagonist","desire","event","trouble","action","ending"].forEach(id=>$(id).value="");
  ["hintBoxProtagonist","hintBoxDesire","hintBoxEvent","hintBoxTrouble","hintBoxAction","hintBoxEnding"].forEach(id=>$(id).classList.add("hide"));
  update();scrollTo({top:0,behavior:"smooth"});
}
function copyResult(){
  const text=[
    "🌱 54字の種ができました",
    `テーマ：${$("resultThemes").textContent}`,
    `主人公：${$("resultProtagonist").textContent}`,
    `願い・目的：${$("resultDesire").textContent}`,
    `出来事：${$("resultEvent").textContent}`,
    `障害・困りごと：${$("resultTrouble").textContent}`,
    `主人公の行動：${$("resultAction").textContent}`,
    `最後：${$("resultEnding").textContent}`,
    "",
    `物語の柱：${$("resultPillar").textContent}`
  ].join("\\n");
  navigator.clipboard.writeText(text).then(()=>{
    $("copyStatus").textContent="コピーしました。";
    setTimeout(()=>$("copyStatus").textContent="",1600);
  });
}
async function init(){
  const [themesData,protagonists,candidates,hints,support]=await Promise.all([
    fetch("themes.json").then(r=>r.json()),
    fetch("protagonists.json").then(r=>r.json()),
    fetch("candidates.json").then(r=>r.json()),
    fetch("hints.json").then(r=>r.json()),
    fetch("story_support.json").then(r=>r.json())
  ]);
  state.themes=themesData.themes||[];
  state.protagonists=flatProtagonists(protagonists);
  state.candidates=candidates; state.hints=hints; state.support=support;

  document.querySelectorAll("input,textarea").forEach(x=>x.addEventListener("input",update));
  document.querySelectorAll("[data-random-theme]").forEach(b=>b.addEventListener("click",()=>randomTheme(b.dataset.randomTheme)));
  $("clearTheme2").onclick=()=>{$("theme2").value="";update()};
  $("useTheme1").onclick=()=>{if(val("theme1")){$("protagonist").value=val("theme1");update()}};
  $("useTheme2").onclick=()=>{if(val("theme2")){$("protagonist").value=val("theme2");update()}};
  $("randomRelatedProtagonist").onclick=randomRelatedProtagonist;
  $("randomFreeProtagonist").onclick=randomFreeProtagonist;

  $("randomDesire").onclick=()=>randomSupport("desire");
  $("randomEvent").onclick=()=>randomCandidate("event");
  $("randomTrouble").onclick=()=>randomCandidate("trouble");
  $("randomAction").onclick=()=>randomSupport("action");
  $("randomEnding").onclick=()=>randomCandidate("ending");

  $("hintProtagonist").onclick=()=>showHint("主人公","hintBoxProtagonist","hintTextProtagonist");
  $("hintDesire").onclick=()=>showHint("展開","hintBoxDesire","hintTextDesire");
  $("hintEvent").onclick=()=>showHint("出来事","hintBoxEvent","hintTextEvent");
  $("hintTrouble").onclick=()=>showHint("展開","hintBoxTrouble","hintTextTrouble");
  $("hintAction").onclick=()=>showHint("展開","hintBoxAction","hintTextAction");
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
