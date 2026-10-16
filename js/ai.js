'use strict';
/* =========================================================
   AI 연결 (가챠 게임 메이커와 같은 방식)
   - 이야기 AI: Gemini / Claude / OpenAI 호환(OpenRouter 등). 키는 이 기기에만 저장.
   - 그림 AI: NovelAI. 기본 그림을 한 번 뽑아 사이트에 넣어 두는 용도.
   - 중계 서버: 브라우저가 직접 못 부르는 곳은 가챠 게임 메이커의 중계 서버(worker.js)를 거친다.
   ========================================================= */
const SET_KEY='typemoon-life-settings';
const AI_TYPES={gemini:'Gemini (AI Studio)',anthropic:'Claude API',openai:'OpenAI 호환 (OpenRouter 등)'};
const AI_DEFAULT_MODEL={gemini:'gemini-2.5-flash',anthropic:'claude-sonnet-5-5',openai:''};
const NAI_ENDPOINT='https://image.novelai.net/ai/generate-image';
const NAI_MODELS=[['nai-diffusion-4-5-full','V4.5 Full'],['nai-diffusion-4-5-curated','V4.5 Curated'],['nai-diffusion-5-full','V5 Full'],['nai-diffusion-4-full','V4 Full']];
function setDefaults(){return {ai:{type:'gemini',key:'',model:'',base:'https://openrouter.ai/api/v1'},aiOn:true,aiMax:4,epilogue:true,nai:{key:'',model:'nai-diffusion-4-5-full',style:'',neg:''},prompts:{},proxy:''};}
function loadSettings(){let s=null;try{s=JSON.parse(localStorage.getItem(SET_KEY)||'null');}catch(e){}const d=setDefaults();if(!s)return d;return Object.assign(d,s,{ai:Object.assign(d.ai,s.ai||{}),nai:Object.assign(d.nai,s.nai||{}),prompts:s.prompts||{}});}
let SET=loadSettings();
function saveSettings(){try{localStorage.setItem(SET_KEY,JSON.stringify(SET));}catch(e){}}
function aiValid(a){a=a||SET.ai;if(!a||!a.key)return false;if(a.type==='openai')return !!(a.base&&(a.model||'').trim());return a.type==='gemini'||a.type==='anthropic';}
function aiReady(){return !!SET.aiOn&&aiValid();}
function aiMax(){return clamp(+SET.aiMax||4,1,10);}

/* 가챠 게임 메이커에 넣어 둔 설정 가져오기(같은 사이트 주소라서 이 기기의 저장소를 같이 쓴다) */
function gachaSettings(){
  const out={ai:null,nai:null,proxy:''};
  try{
    const d=JSON.parse(localStorage.getItem('starfall-ai-profiles')||'null');
    if(d&&Array.isArray(d.list)){
      const ok=d.list.filter(p=>['gemini','anthropic','openai'].includes(p.type)&&aiValid({type:p.type,key:p.key,base:p.base,model:p.model}));
      const p=ok.find(x=>x.id===d.active)||ok[0];
      if(p)out.ai={type:p.type,key:p.key,model:p.quick||p.model||'',base:p.base||'',name:p.name||AI_TYPES[p.type]};
    }
  }catch(e){}
  try{
    const n=JSON.parse(localStorage.getItem('starfall-nai')||'null');
    if(n&&n.key){const st=(n.styles||[]).find(x=>x.id===n.styleId)||(n.styles||[])[0]||{};out.nai={key:n.key,model:n.model||'nai-diffusion-4-5-full',style:st.tags||'',neg:st.neg||n.neg||''};}
  }catch(e){}
  try{out.proxy=String(localStorage.getItem('ggm-proxy')||'').trim();}catch(e){}
  return out;
}

/* ---------------- 통신 ---------------- */
async function http(url,{method='GET',headers={},body,binary=false,timeout=120000}={}){
  const init={method,headers,body:body==null?undefined:JSON.stringify(body)};
  const ctl=typeof AbortController!=='undefined'?new AbortController():null;
  const tm=ctl?setTimeout(()=>ctl.abort(),timeout):null;
  if(ctl)init.signal=ctl.signal;
  const px=String(SET.proxy||'').trim().replace(/\/+$/,'');
  let res;
  try{res=await fetch(url,init);}
  catch(e){
    if(!px){clearTimeout(tm);throw {code:'network',message:'이 서비스가 브라우저 직접 연결을 막았을 수 있어요. 설정 → 연결에서 가챠 게임 메이커의 중계 서버 주소를 넣어 주세요.'};}
    try{res=await fetch(px+'/?u='+encodeURIComponent(url),init);}catch(e2){clearTimeout(tm);throw {code:'network',message:'중계 서버에 연결하지 못했어요.'};}
  }
  clearTimeout(tm);
  const out={status:res.status,headers:{}};
  res.headers.forEach((v,k)=>out.headers[k]=v);
  if(binary&&res.status<400)out.bytes=new Uint8Array(await res.arrayBuffer());
  else out.text=await res.text();
  return out;
}
function errOf(r){
  const t=(r.text||'').slice(0,300);
  if(r.status===401||r.status===403)return {code:'bad_key',message:'키가 맞지 않거나 권한이 없어요.'};
  if(r.status===402)return {code:'low_credit',message:'잔액이나 구독(Anlas)이 부족해요.'};
  if(r.status===429)return {code:'rate_limited',message:'요청이 너무 잦아요. 잠시 뒤 다시 해 주세요.'};
  return {code:'upstream_error',message:`HTTP ${r.status} ${t}`};
}
function parseLoose(text){
  const s=String(text||'').replace(/```(?:json)?/gi,'').trim();
  for(let i=0;i<s.length;i++){if(s[i]!=='{')continue;
    for(let j=s.length;j>i;j--){if(s[j-1]!=='}')continue;try{return JSON.parse(s.slice(i,j));}catch(e){}}
    break;}
  throw {code:'invalid_json',message:'AI 응답을 읽지 못했어요.'};
}
async function aiCall(prompt,maxTokens){
  const a=SET.ai;if(!aiValid(a))throw {code:'no_ai',message:'설정에서 이야기 AI 키를 넣어 주세요.'};
  const model=(a.model||AI_DEFAULT_MODEL[a.type]||'').trim();
  const P=prompt+'\n\n다른 설명이나 코드 블록 없이 JSON 하나만 출력한다.';
  const max=maxTokens||2000;
  if(a.type==='gemini'){
    const r=await http(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':a.key},
      body:{contents:[{role:'user',parts:[{text:P}]}],generationConfig:{maxOutputTokens:max*4,temperature:1,responseMimeType:'application/json'}}});
    if(r.status>=400)throw errOf(r);
    const j=JSON.parse(r.text);const c=(j.candidates||[])[0];if(!c)throw {code:'refused',message:'AI가 답하지 않았어요.'};
    return parseLoose(((c.content&&c.content.parts)||[]).filter(x=>!x.thought).map(x=>x.text||'').join(''));
  }
  if(a.type==='anthropic'){
    const r=await http('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':a.key,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body:{model,max_tokens:max,messages:[{role:'user',content:P}]}});
    if(r.status>=400)throw errOf(r);
    const j=JSON.parse(r.text);return parseLoose((j.content||[]).filter(b=>b.type==='text').map(b=>b.text).join(''));
  }
  const base=String(a.base).trim().replace(/\/+$/,'').replace(/\/chat\/completions$/i,'');
  const r=await http(base+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+a.key},body:{model,max_tokens:max,messages:[{role:'user',content:P}]}});
  if(r.status>=400)throw errOf(r);
  const j=JSON.parse(r.text);return parseLoose(((j.choices||[])[0]||{}).message?.content||'');
}

/* ---------------- AI 사건 ---------------- */
function lifeSummary(){
  const st=[];
  if(S.mage)st.push(`마술사(스승: ${S.teacher||'없음'}${S.academy?', 시계탑 '+RANK_FULL[S.curRank]:''})`);
  if(S.church)st.push('성당교회 대행자');if(S.apostle)st.push('사도(흡혈귀)');if(S.fugitive)st.push('봉인지정 도망자');
  if(!S.aware)st.push(S.wiped?'신비를 보았지만 기억을 잃은 일반인':'달빛 세계를 모르는 일반인');else if(!S.mage&&!S.church)st.push('신비를 알게 된 일반인');
  return [
    `이름 ${S.name}, ${S.gender==='m'?'남':'여'}, ${S.age}세, 지금 ${yearLabel(S.year)}년, ${S.country.n} ${S.city}에 산다.`,
    S.era==='ancient'?`신대·고대의 ${S.reg.n}. 명성 ${S.fame}. 업적: ${S.deeds.join(', ')||'없음'}${S.np?'. 보물 '+S.np:''}${S.king?'. 왕':''}.`:`이야기: ${{sn:'Fate/stay night (2004년 제5차 성배전쟁)',zero:'Fate/Zero (1994년 제4차 성배전쟁)',fgo:'Fate/Grand Order (칼데아'+(S.fgoRole?', 직책 '+S.fgoRole:'')+')'}[S.route]||'없음'}.`,
    S.servant?`함께 싸우는 서번트: ${S.servant.name} (${S.servant.cls}${S.servant.title?', '+S.servant.title:''}). ${S.servant.persona||''}`:'',
    `신뢰하는 사람: ${Object.entries(S.bonds||{}).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>charInfo(k).n+' '+v).join(', ')||'없음'}.`,
    `출생: ${S.famType}. 종족: ${byId(CY_RACE,S.race).n}. 마술회로 ${S.circuits}개(질 ${S.qual}). 속성 ${S.els.map(e=>EL_NAME[e]).join('·')}.`,
    `처지: ${st.join(', ')}. 직업: ${S.job||'없음'}. 결혼 ${S.married?'함':'안 함'}, 자녀 ${S.kids}명.`,
    `익힌 계통: ${S.depts.map(id=>byId(CY_DEPTS,id).n).join(', ')||'없음'}. 능력: ${S.abil.map(id=>byId(CY_ABIL,id).n).join(', ')||'없음'}. 마안: ${S.eye&&S.eyesKnown?S.eye.n:'없음'}.`,
    `건강 ${Math.round(S.health)}, 정신 ${Math.round(S.mental)}, 재산 ${Math.round(S.wealth)}, 행운 ${S.luck} (0~100). 억지력 ${fmtP(S.ap)}.`,
    `최근 기록: ${S.events.slice(-8).map(e=>`${yearLabel(e.y)}년 ${e.text}`).join(' / ')}`
  ].join('\n');
}
function aiEventPrompt(){
  return `너는 TYPE-MOON 세계관(Fate, 월희, 공의 경계, 마법사의 밤, 로드 엘멜로이 2세의 사건부)을 깊이 아는 텍스트 인생 게임의 이야기꾼이다.
아래 인물의 인생에 지금 찾아올 「운명을 바꿀 기회 사건」 하나를 만든다.

[인물]
${lifeSummary()}

[규칙]
- 인물의 처지와 나이, 시대, 장소에 맞는 사건. 일반인이면 신비를 처음 엿보는 일, 마술사면 연구·협회·의뢰·결투·유산, 대행자면 임무, 사도면 사냥과 도주 같은 식.
- 원작 인물이 나와도 된다. 인물의 성격과 말투는 원작에 맞춘다.
- 신대·고대라면 신화와 전설의 사건(괴물, 신, 전쟁, 왕위)으로 만들고 effects에 fame(명성 -20~30 정수)을 쓸 수 있다.
- 선택지는 2~3개. 각각 결과가 확실하지 않으면 chance를 0.2~0.9로 둔다. 위험한 선택일수록 보상이 크다.
- title은 12자 이내, body는 2~3문장 '-요' 체로 상황을 보여 준다. label은 12자 이내, sub는 20자 이내.
- 결과 text는 1~2문장, 과거형 평서문(-다)으로 쓴다. 인물을 '당신'이라 부르지 않고 주어 없이 쓴다.
- effects에는 아래 키만 쓴다. 필요 없는 키는 빼라.
  health/mental/wealth: -40~30 정수, ap(억지력): -2~3 정수, circuits: 0~20 정수,
  aware: true(신비를 알게 됨), mage: "스승 이름"(마술사가 됨), church: true(대행자가 됨),
  learn: 마술계통 이름(${CY_DEPTS.filter(d=>!d.side).map(d=>d.n).join(', ')} 중 하나),
  ability: 능력 이름(${CY_ABIL.filter(a=>a.id!=='solo').map(a=>a.n).join(', ')} 중 하나),
  move: 도시(${PLACES.map(p=>p.n).join(', ')} 중 하나), apostle: true(사도가 됨),
  die: true와 death: "사인"(죽음. 정말 무모한 선택의 실패에만).
- img는 다음 중 가장 어울리는 하나: ${IMGS.map(i=>i.id).join(', ')}

출력 형식:
{"title":"","body":"","img":"","options":[{"label":"","sub":"","chance":0.6,"success":{"text":"","effects":{}},"failure":{"text":"","effects":{}}}]}`;
}
function aiToPending(ev){
  if(!ev||!Array.isArray(ev.options)||!ev.options.length)throw {code:'invalid_json',message:'선택지가 없어요.'};
  const img=IMGS.some(i=>i.id===ev.img)?ev.img:'witness';
  const clean=o=>o&&typeof o==='object'?o:{};
  const T=(s,n)=>String(s||'').replace(/[<>]/g,'').slice(0,n);
  return {eyebrow:'운명의 갈림길',img,title:T(ev.title,30)||'운명의 갈림길',body:T(ev.body,400),ai:false,fromAi:true,
    options:ev.options.slice(0,3).map(o=>({label:T(o.label,30)||'선택',sub:T(o.sub,60),fn:()=>{
      fate(1,'운명의 선택');
      const p=clamp(+o.chance||1,.05,1);
      const win=chance(p),r=clean(win?o.success:o.failure);
      if(r.text)log(T(r.text,300),win?'moon':'risk',true);
      applyEffects(clean(r.effects),{dieText:T(r.text,300)});
    }}))};
}
async function aiMakeEvent(){return aiToPending(await aiCall(aiEventPrompt(),1500));}
/* 신뢰도 대화: 특이점에서 AI가 상대 인물의 대사와 선택지를 만든다 */
async function aiTalk(id,ctx){
  const c=charInfo(id);
  const r=await aiCall(`너는 TYPE-MOON 세계관의 미연시(연애·관계 시뮬레이션) 장면을 쓰는 작가다. 아래 인물과 주인공의 짧은 대화 장면 하나를 만든다.

[상대 인물] ${c.n}: ${c.s}
[현재 신뢰도] ${bond(id)}/100 (높을수록 친밀하다. 말투와 거리감에 반영한다)
[상황] ${ctx}
[주인공]
${lifeSummary()}

[규칙]
- situation: 장면 묘사 1~2문장, '-요' 체.
- line: 상대 인물의 대사 한두 문장. 원작 성격과 말투를 살린다. 큰따옴표로 감싼다.
- choices 3개: 주인공의 대답이나 행동(text, 20자 이내). 각각 상대의 반응(reply, 1~2문장, 대사면 큰따옴표)과 신뢰 변화(bond, -10~15 정수)를 붙인다.
- 좋은 선택이 늘 뻔하지 않게 한다. 인물의 성격에 진짜로 맞는 대답이 가장 크게 오른다.

출력 형식: {"situation":"","line":"","choices":[{"text":"","reply":"","bond":0}]}`,1200);
  const T=(x,n)=>String(x||'').replace(/[<>]/g,'').slice(0,n);
  if(!r||!Array.isArray(r.choices)||!r.choices.length)throw {code:'invalid_json',message:'대화를 만들지 못했어요.'};
  return {situation:T(r.situation,300),line:T(r.line,300),choices:r.choices.slice(0,3).map(x=>({text:T(x.text,40)||'……',reply:T(x.reply,300),bond:clamp(Math.round(+x.bond||0),-10,15)}))};
}
/* 인생 평가: 등급, 한 줄 평, 후일담 */
async function aiJudge(endTitle){
  const big=S.events.filter(e=>e.big||e.cat!=='life').slice(-60).map(e=>`${yearLabel(e.y)}년(${e.a}세) ${e.text}`).join('\n');
  const ach=(S.achNow||[]).map(id=>(ACH_ALL.find(a=>a[0]===id)||[])[1]).filter(Boolean).join(', ')||'없음';
  const r=await aiCall(`너는 TYPE-MOON 세계관의 인생 심사관이자 이야기꾼이다. 아래 한 사람의 일생을 보고 평가한다.
- grade: S, A, B, C, D, F 중 하나. 운명을 얼마나 개척했는지, 선택이 일관되고 아름다웠는지, 남긴 것이 무엇인지로 판단한다. 평범하지만 따뜻한 인생도 B 이상을 줄 수 있다.
- title: 이 인생을 부르는 짧은 이름(15자 이내).
- comment: 평가 이유 2~3문장, '-요' 체.
- epilogue: 이 인생을 회고하는 후일담 3~5문장, 과거형 평서문, 기록에 없는 큰 사건은 지어내지 않는다. 마지막은 달이나 밤의 여운으로.

이름 ${S.name}, ${yearLabel(S.birthYear)}년 ${S.country.n}에서 태어나 ${S.deathAge}세에 ${S.cause||'생을 마쳤다'}. 결말: ${endTitle}. 이번 생의 업적: ${ach}.
${lifeSummary()}
${big}

출력 형식: {"grade":"","title":"","comment":"","epilogue":""}`,1600);
  const g=String(r.grade||'').trim().toUpperCase().charAt(0);
  return {grade:'SABCDF'.includes(g)&&g?g:'B',title:String(r.title||'').slice(0,40),comment:String(r.comment||'').slice(0,600),epilogue:String(r.epilogue||'').slice(0,1200)};
}

/* ---------------- NovelAI ---------------- */
async function unzipFirst(u8){
  if(u8[0]===0x89&&u8[1]===0x50)return u8;
  const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);
  let e=u8.length-22;while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;
  if(e<0)throw {code:'nai_zip',message:'NovelAI 응답을 풀지 못했어요.'};
  const cd=dv.getUint32(e+16,true),method=dv.getUint16(cd+10,true),csize=dv.getUint32(cd+20,true),lho=dv.getUint32(cd+42,true);
  const st=lho+30+dv.getUint16(lho+26,true)+dv.getUint16(lho+28,true),data=u8.subarray(st,st+csize);
  if(method===0)return data;
  if(method===8&&typeof DecompressionStream!=='undefined')return new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
  throw {code:'nai_zip',message:'NovelAI 응답을 풀지 못했어요.'};
}
function imgPrompt(id){const it=byId(IMGS,id);return (SET.prompts[id]||it.p);}
async function naiGenerate(id,onTry){
  const c=SET.nai;if(!c.key)throw {code:'nai_nokey',message:'설정에서 NovelAI 키를 넣어 주세요.'};
  const model=c.model||'nai-diffusion-4-5-full';
  const input=[imgPrompt(id),c.style||IMG_STYLE,'very aesthetic, masterpiece, no text'].filter(Boolean).join(', ');
  const neg=[IMG_NEG,c.neg].filter(Boolean).join(', ');
  const seed=Math.floor(Math.random()*4294967295);
  const P={params_version:3,width:1216,height:832,scale:5,sampler:'k_euler_ancestral',steps:28,n_samples:1,ucPreset:0,qualityToggle:true,noise_schedule:'karras',cfg_rescale:0,
    negative_prompt:neg,seed,dynamic_thresholding:false,controlnet_strength:1,legacy:false,add_original_image:false,prefer_brownian:true,deliberate_euler_ancestral_bug:false,
    reference_image_multiple:[],reference_information_extracted_multiple:[],reference_strength_multiple:[],use_coords:false};
  if(/diffusion-(4|5)/.test(model)){
    P.v4_prompt={caption:{base_caption:input,char_captions:[]},use_coords:false,use_order:true};
    P.v4_negative_prompt={caption:{base_caption:neg,char_captions:[]},legacy_uc:false};
  }
  let last;
  for(let a=1;a<=3;a++){
    onTry&&onTry(a);
    const r=await http(NAI_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+String(c.key).trim()},body:{input,model,action:'generate',parameters:P},binary:true,timeout:150000});
    if(r.status<400&&r.bytes&&r.bytes.length){const png=await unzipFirst(r.bytes);return toWebp(new Blob([png],{type:'image/png'}));}
    last=/Concurrent generation is locked/i.test(r.text||'')?{code:'nai_locked',message:'NovelAI에서 다른 생성이 진행 중이에요.'}:errOf(r);
    if(!(r.status===429||r.status>=500||last.code==='nai_locked'))throw last;
    await new Promise(res=>setTimeout(res,2500*a));
  }
  throw last;
}
async function toWebp(blob){
  try{
    const bmp=await createImageBitmap(blob);
    const W=1024,H=Math.round(bmp.height*W/bmp.width);
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.getContext('2d').drawImage(bmp,0,0,W,H);
    const out=await new Promise(res=>cv.toBlob(res,'image/webp',.84));
    return out||blob;
  }catch(e){return blob;}
}

/* ---------------- 그림 저장소 ----------------
   1) 이 기기에서 만든 그림(IndexedDB) 2) 사이트에 넣어 둔 그림(img/<id>.webp) 3) 그림 자리 표시 */
const IDB_NAME='typemoon-life-img';
function idb(){return new Promise((res,rej)=>{const q=indexedDB.open(IDB_NAME,1);q.onupgradeneeded=()=>q.result.createObjectStore('img');q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
async function idbGet(id){try{const db=await idb();return await new Promise(res=>{const t=db.transaction('img').objectStore('img').get(id);t.onsuccess=()=>res(t.result||null);t.onerror=()=>res(null);});}catch(e){return null;}}
async function idbPut(id,blob){try{const db=await idb();await new Promise(res=>{const t=db.transaction('img','readwrite');t.objectStore('img').put(blob,id);t.oncomplete=res;t.onerror=res;});}catch(e){}}
async function idbDel(id){try{const db=await idb();await new Promise(res=>{const t=db.transaction('img','readwrite');id?t.objectStore('img').delete(id):t.objectStore('img').clear();t.oncomplete=res;t.onerror=res;});}catch(e){}}
let SITE_IMGS=new Set(),LOCAL_URL={};
async function loadImageIndex(){
  try{const r=await fetch('img/index.json',{cache:'no-cache'});if(r.ok){const j=await r.json();SITE_IMGS=new Set(Array.isArray(j)?j:j.images||[]);}}catch(e){}
  await Promise.all(IMGS.map(async it=>{const b=await idbGet(it.id);if(b)LOCAL_URL[it.id]=URL.createObjectURL(b);}));
}
function imgSrc(id){if(!id)return null;if(LOCAL_URL[id])return LOCAL_URL[id];if(SITE_IMGS.has(id))return 'img/'+id+'.webp';return null;}
function imgHTML(id,cls){
  const src=imgSrc(id),it=byId(IMGS,id);
  return src?`<img class="${cls||'scene'}" src="${src}" alt="${esc(it?it.n:'')}" loading="lazy">`:`<div class="${cls||'scene'} ph" data-ph="${esc(id||'')}" aria-hidden="true"><span>${esc(it?it.n:'')}</span></div>`;
}

/* ---------------- ZIP(무압축) ---------------- */
const CRC_T=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(u8){let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=CRC_T[(c^u8[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function makeZip(files){
  const enc=new TextEncoder(),parts=[],central=[];let off=0;
  files.forEach(f=>{
    const name=enc.encode(f.name),data=f.data,crc=crc32(data);
    const h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(8,0,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);
    parts.push(new Uint8Array(h.buffer),name,data);
    const c=new DataView(new ArrayBuffer(46));
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,off,true);
    central.push(new Uint8Array(c.buffer),name);
    off+=30+name.length+data.length;
  });
  const csize=central.reduce((s,p)=>s+p.length,0);
  const e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,csize,true);e.setUint32(16,off,true);
  return new Blob([...parts,...central,new Uint8Array(e.buffer)],{type:'application/zip'});
}
async function exportZip(){
  const files=[],ids=[];
  for(const it of IMGS){const b=await idbGet(it.id);if(b){files.push({name:'img/'+it.id+'.webp',data:new Uint8Array(await b.arrayBuffer())});ids.push(it.id);}}
  SITE_IMGS.forEach(id=>{if(!ids.includes(id))ids.push(id);});
  files.push({name:'img/index.json',data:new TextEncoder().encode(JSON.stringify(ids,null,0))});
  return {blob:makeZip(files),count:files.length-1};
}
