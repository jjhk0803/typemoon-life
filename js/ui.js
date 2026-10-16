'use strict';
/* =========================================================
   화면: 다음 생 준비(FATE 설계) → 인생 → 결말 → 다시 준비
   ========================================================= */
const $=id=>document.getElementById(id);
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);}
const logEl=$('log');
let timer=null,speed=1,running=false,paused=false,skipping=false,lastScene='';
function toast(t){const el=$('toast');el.textContent=t;el.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>el.hidden=true,3200);}
function newSeed(){try{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0];}catch(e){return Math.floor(Math.random()*4294967296);}}
function renderFate(){$('fateN').textContent=fmtP(PROFILE.fate);}

/* ---------------- 다음 생 준비 ---------------- */
const PLAN_KEY='typemoon-life-plan';
function loadPlan(){try{const d=JSON.parse(localStorage.getItem(PLAN_KEY)||'null');if(d&&Array.isArray(d.depts))return Object.assign(planBlank(),d);}catch(e){}return planBlank();}
let PL=loadPlan(),pStep=0;
function savePlan(){try{localStorage.setItem(PLAN_KEY,JSON.stringify(PL));}catch(e){}}
const PSTEPS=[
  {k:'era',n:'시대·세계선',h:'언제, 어느 세계선에 태어날지 정해요. 고르지 않으면 1950~2004년 사이 어딘가, 세계선도 운명이 정해요.'},
  {k:'birth',n:'출생',h:'어떤 몸으로, 어떤 집에, 어디서 태어날지 정해요. 고르지 않은 칸은 실제 확률대로 운명이 정해요.'},
  {k:'talent',n:'재능',h:'마술회로와 마술속성, 마안. 고르지 않으면 대부분 회로가 거의 없는 평범한 사람으로 태어나요.'},
  {k:'dept',n:'마술계통',h:'태어날 때부터 배우고 시작할 계통과 세부 항목. 인생 도중 스승을 만나 배울 수도 있어요. 계통 속성이 마술속성과 맞으면 반값이에요.'},
  {k:'abil',n:'능력',h:'능력은 대부분 FATE 3. 어떤 계통 둘을 함께 고르면 무료가 되는 능력도 있어요. 억지력이 붙는 능력은 결말에 영향을 줘요.'},
  {k:'item',n:'예장·피드백',h:'마술예장은 인생 도중에 손에 들어와요. 피드백(단점)을 고르면 FATE를 2씩 돌려받고 억지력이 줄어요.'},
  {k:'jr',n:'행적',h:'인생에서 꼭 겪을 사건을 미리 정해요. 정해 둔 행적이 오기 전에는 죽지 않아요. 정하지 않아도 인생 도중 초대가 올 수 있어요.'},
  {k:'check',n:'확인',h:'설계를 확인하고 태어나요. 남은 FATE는 다음 생으로 이월돼요.'}
];
function chip(cls,t){return `<span class="chip ${cls}">${t}</span>`;}
function costChip(v){return v?chip('fp','FATE '+fmtP(v)):chip('free','무료');}
function apChip(v){if(!v)return '';const g=v>0&&PL.origin==='root'?v*2:v;return chip(g>0?'ap':'good',`억지력 ${g>0?'+':'−'}${fmtP(Math.abs(g))}`);}
function optCard(o){
  return `<button type="button" class="opt${o.rand?' fate-rand':''}" data-k="${o.k}" data-id="${esc(o.id)}" aria-pressed="${o.on?'true':'false'}"${o.why&&!o.on?' disabled':''}>
    <span class="on">${esc(o.n)}${o.tag?`<i>${esc(o.tag)}</i>`:''}</span>
    ${o.chips?`<span class="chips">${o.chips}</span>`:''}
    <span class="od2">${esc(o.d)}</span>
    ${o.why&&!o.on?`<span class="why">${esc(o.why)}</span>`:''}
  </button>`;
}
function slot(title,sub,cards){return `<div class="ogroup"><div class="slot-h"><h4>${title}</h4>${sub?`<small>${sub}</small>`:''}</div><div class="ogrid">${cards}</div></div>`;}
function renderPrepBar(){
  const c=planCalc(PL),left=PROFILE.fate-c.cost;
  $('pBar').innerHTML=`<span class="pt fate">보유 FATE <b>${fmtP(PROFILE.fate)}</b></span><span class="pt cost">이번 생에 쓸 FATE <b>${fmtP(c.cost)}</b></span><span class="pt fate${left<0?' neg':''}">남는 FATE <b>${fmtP(left)}</b></span>`
    +`<span class="pt ap">억지력 <b>${fmtP(c.ap)}</b></span><span class="pt rk">계위 목표 <b>${c.noRank?'자택연구원':c.rank?RANK_FULL[c.rank]:'없음'}</b></span>`;
  return {c,left};
}
function renderPrep(){
  renderFate();
  const {c,left}=renderPrepBar();
  $('firstBox').hidden=PROFILE.lives>0;
  $('pSteps').innerHTML=PSTEPS.map((s,i)=>`<button type="button" data-i="${i}"${i===pStep?' aria-current="step"':''} class="${i<pStep?'done':''}">${i+1}. ${s.n}</button>`).join('');
  const st=PSTEPS[pStep];
  $('pHead').innerHTML=`<div class="eyebrow">${pStep+1} / ${PSTEPS.length}</div><h2>${st.n}</h2><p>${esc(st.h)}</p>`;
  const root=PL.origin==='root';
  let h='';
  const rnd=(k,on,d)=>optCard({k,id:'',n:'운명에 맡긴다',d:d||'실제 확률대로 정해져요.',on,rand:true,chips:chip('free','무료')});
  if(st.k==='era'){
    h+=slot('시대','',rnd('era',!PL.era,'1950~2004년 사이 어딘가. 지금까지의 인생.')+ERAS.map(e=>optCard({k:'era',id:e.id,n:e.n,d:e.d,on:PL.era===e.id,chips:costChip(e.cost)})).join(''));
    if(PL.era==='ancient')h+=slot('지역','어느 나라의 영웅이 될까',rnd('region',!PL.region,'신화와 전설의 땅 중 한 곳.')+REGIONS.map(r=>optCard({k:'region',id:r.id,n:r.n,d:`${r.title}. ${r.war}, ${r.monster[0]}.`,on:PL.region===r.id,chips:costChip(2)})).join(''));
    else h+=slot('세계선','인리를 긍정하는 세계들',rnd('world',!PL.world,'세계선마다 일어나는 사건이 달라요.')+WORLDS.map(w=>optCard({k:'world',id:w.id,n:w.n,d:w.d,on:PL.world===w.id,chips:costChip(w.cost)})).join(''));
  } else if(st.k==='birth'){
    h+=slot('기원','',CY_ORIGIN.map(o=>optCard({k:'origin',id:o.id,n:o.n,d:o.id==='root'?'근원과 이어진 채 태어나요. 마술속성·계통·세부 항목이 무료가 돼요. 대신 마술예장을 고를 수 없고, 억지력이 5에서 시작하며 이후 얻는 억지력이 두 배가 돼요.':'평범하게 다시 태어나요.',on:PL.origin===o.id,chips:costChip(FATE_COST.origin[o.id])+(o.id==='root'?chip('ap','억지력 5에서 시작'):'')})).join(''));
    h+=slot('종족','고르지 않으면 거의 확실히 인간',rnd('race',!PL.race,'거의 확실히 인간. 일본이라면 아주 드물게 혼혈.')+CY_RACE.map(r=>optCard({k:'race',id:r.id,n:r.n,d:r.d,on:PL.race===r.id,chips:costChip(FATE_COST.race[r.id])+apChip(r.ap)})).join(''));
    h+=slot('출생','고르지 않으면 대부분 평범한 가정',rnd('birth',!PL.birth,'나라별 실제 확률. 마술사 가문은 수만~수십만분의 1.')+CY_BIRTH.map(r=>optCard({k:'birth',id:r.id,n:r.n,d:r.d,on:PL.birth===r.id,chips:costChip(FATE_COST.birth[r.id])+apChip(r.ap)})).join(''));
    h+=slot('출생지','고르지 않으면 세계 인구 비율대로',rnd('place',!PL.place,'인도와 중국이 3분의 1이 넘어요.')+PLACES.map(p=>optCard({k:'place',id:p.id,n:p.n,d:p.d,on:PL.place===p.id,chips:costChip(p.cost)})).join(''));
  } else if(st.k==='talent'){
    h+=slot('마술회로','',rnd('talent',!PL.talent,'90%는 회로가 거의 없어요. 마술사 가문이면 평균 30개쯤.')+TALENTS.map(t=>optCard({k:'talent',id:t.id,n:t.n,d:t.d,on:PL.talent===t.id,chips:costChip(FATE_COST.talent[t.id])})).join(''));
    h+=slot('마술속성','',rnd('elmode',!PL.elMode,'대부분 지·수·화·풍 중 하나. 아주 드물게 허수나 애버리지 원.')+CY_ELMODE.map(m=>optCard({k:'elmode',id:m.id,n:m.n,d:m.d,on:PL.elMode===m.id,chips:costChip(root?0:FATE_COST.elMode[m.id])})).join(''));
    if(PL.elMode){const em=byId(CY_ELMODE,PL.elMode);if(em.need)h+=`<div class="ogroup"><div class="slot-h"><h4>속성 ${em.need}개 고르기 (${PL.els.length}/${em.need})</h4></div><div class="elchips">${em.pool.map(e=>{const on=PL.els.includes(e);return `<button type="button" data-el="${e}" aria-pressed="${on}"${!on&&PL.els.length>=em.need?' disabled':''}>${EL_NAME[e]}</button>`;}).join('')}</div></div>`;}
    h+=slot('마안','하나만',optCard({k:'eye',id:'',n:'운명에 맡긴다',d:'8만 명에 1명꼴로 마안을 타고나요.',on:!PL.eye,rand:true,chips:chip('free','무료')})+CY_EYE.map(e=>optCard({k:'eye',id:e.id,n:e.n+' 마안',d:e.d,on:PL.eye===e.id,chips:costChip(eyeCost(PL,e))+apChip(e.ap),why:PL.fb.includes('dark')?'영원한 어둠과 함께 고를 수 없어요.':''})).join(''));
  } else if(st.k==='dept'){
    const mk=list=>list.map(d=>{
      const on=PL.depts.includes(d.id);
      const els=d.els===null?'속성 무관':d.els.length?d.els.map(e=>EL_NAME[e]).join('·'):'속성 없음';
      let card=optCard({k:'dept',id:d.id,n:d.n,tag:els,d:d.d,on,chips:costChip(deptCost(PL,d))+apChip(d.ap)});
      if(on)card+=d.det.map(x=>{const dd=CY_DET[x[0]];return optCard({k:'detail',id:dd.id,n:'└ '+dd.n,d:dd.d,on:PL.details.includes(dd.id),chips:costChip(root?0:FATE_COST.detail)+apChip(dd.o.ap)});}).join('');
      return card;}).join('');
    h+=slot('시계탑 12학과','',mk(CY_DEPTS.filter(d=>!d.side)))+slot('외전','',mk(CY_DEPTS.filter(d=>d.side)));
  } else if(st.k==='abil'){
    h+=slot('능력','',CY_ABIL.map(a=>{const on=PL.abil.includes(a.id);let why=a.o.notRace&&a.o.notRace===PL.race?'이 종족으로는 고를 수 없어요.':'';if(a.id==='core'&&PL.fb.includes('small'))why='작은 그릇과 함께 고를 수 없어요.';
      return optCard({k:'abil',id:a.id,n:a.n,d:a.d,on,why,chips:costChip(abilCost(PL,a))+apChip(a.o.ap)+(a.o.free&&abilCost(PL,a)?chip('','무료 조건: '+a.o.free.map(x=>byId(CY_DEPTS,x).n).join('+')):'')});}).join(''));
  } else if(st.k==='item'){
    h+=slot('마술예장','인생 도중에 손에 들어와요',CY_ITEMS.map(it=>optCard({k:'item',id:it.id,n:it.n,d:it.d,on:PL.items.includes(it.id),chips:costChip(itemCost(PL,it))+apChip(itemAp(PL,it)),why:root?'근원접속자는 예장을 고를 수 없어요.':''})).join(''));
    h+=slot('피드백','하나에 FATE 2씩 돌려받아요',CY_FB.map(f=>{const ap=f.o.ap!==undefined?f.o.ap:-1;return optCard({k:'fb',id:f.id,n:f.n,d:f.d,on:PL.fb.includes(f.id),chips:chip('fp','FATE +2')+apChip(ap),why:planFbReq(PL,f)});}).join(''));
  } else if(st.k==='jr'){
    h+=slot('행적','정해 둔 행적은 꼭 일어나요',CY_JR.map(j=>{
      const cnt=PL.jr.filter(x=>x===j.id).length,on=cnt>0;
      const when=j.year?`${j.year}년`:j.minYear?`${j.minYear}년 이후`:j.age?`${j.age[0]}~${j.age[1]}세`:j.last?'여정의 끝':j.after?'교수 추적 이후':'';
      let card=optCard({k:'jr',id:j.id,n:j.n,tag:j.src,d:j.intro.length>110?j.intro.slice(0,108)+'…':j.intro,on,why:planJrReq(PL,j),chips:costChip(jrCost(PL,j))+chip('','추천 '+RANK_FULL[j.rec])+chip('',when)+(j.war?chip('ap','서번트 소환'):'')});
      if(j.multi&&on)card=`<div class="optwrap">${card}<div class="counter" data-multi="${j.id}"><button type="button" data-d="-1" aria-label="한 번 빼기">−</button><b>${cnt}회</b><button type="button" data-d="1" aria-label="한 번 더">+</button></div></div>`;
      return card;}).join(''));
  } else {
    const nm=(arr,ids)=>ids.map(i=>byId(arr,i).n).join(', ')||'없음';
    const R_=x=>x?x:'<span class="unk">운명에 맡김</span>';
    h+=`<div class="ogrid">${optCard({k:'rankup',id:'up',n:'계위 한 단계 올리기',d:'태어날 때 정해지는 계위 목표를 한 단계 올려요.',on:PL.rankUp,chips:costChip(FATE_COST.rankUp),why:!PL.depts.length?'마술계통이 하나 이상 있어야 해요.':''})}</div>
    <div class="sheetbox"><dl>
      <dt>시대 · 세계선</dt><dd>${R_(PL.era&&byId(ERAS,PL.era).n)} · ${PL.era==='ancient'?R_(PL.region&&byId(REGIONS,PL.region).n):R_(PL.world&&byId(WORLDS,PL.world).n)}</dd>
      <dt>기원 · 종족</dt><dd>${byId(CY_ORIGIN,PL.origin).n} · ${R_(PL.race&&byId(CY_RACE,PL.race).n)}</dd>
      <dt>출생 · 출생지</dt><dd>${R_(PL.birth&&byId(CY_BIRTH,PL.birth).n)} · ${R_(PL.place&&byId(PLACES,PL.place).n)}</dd>
      <dt>마술회로</dt><dd>${R_(PL.talent&&byId(TALENTS,PL.talent).n)}</dd>
      <dt>마술속성</dt><dd>${PL.elMode?byId(CY_ELMODE,PL.elMode).n+' ('+(planEls(PL)||[]).map(e=>EL_NAME[e]).join(', ')+')':R_('')}</dd>
      <dt>마술계통</dt><dd>${nm(CY_DEPTS,PL.depts)}</dd>
      <dt>세부 항목</dt><dd>${PL.details.map(i=>CY_DET[i].n).join(', ')||'없음'}</dd>
      <dt>능력 · 마안</dt><dd>${[...PL.abil.map(i=>byId(CY_ABIL,i).n),PL.eye?byId(CY_EYE,PL.eye).n+' 마안':null].filter(Boolean).join(', ')||'없음'}</dd>
      <dt>마술예장</dt><dd>${nm(CY_ITEMS,PL.items)}</dd>
      <dt>피드백</dt><dd>${nm(CY_FB,PL.fb)}</dd>
      <dt>행적</dt><dd>${PL.jr.map(i=>CY_JRMAP[i].n).join(', ')||'없음. 인생 도중 초대를 기다려요.'}</dd>
      <dt>FATE</dt><dd>${fmtP(c.cost)} 사용 → ${fmtP(left)} 남음</dd>
    </dl>${c.errs.length?`<ul class="errs">${c.errs.map(e=>`<li>${esc(e)}</li>`).join('')}</ul>`:''}</div>`;
  }
  $('pBody').innerHTML=h;
  $('pPrev').disabled=pStep===0;
  $('pNext').hidden=pStep===PSTEPS.length-1;
  const block=c.errs.length?c.errs[0]:left<0?`FATE가 ${fmtP(-left)} 모자라요.`:'';
  $('pGo').disabled=!!block;$('pGoNote').textContent=block||`FATE ${fmtP(c.cost)}을(를) 쓰고 태어나요.`;
  savePlan();
}
function toggleArr(arr,id){const i=arr.indexOf(id);if(i>=0)arr.splice(i,1);else arr.push(id);}
function onPrepClick(ev){
  const st=ev.target.closest('#pSteps button');if(st){pStep=+st.dataset.i;renderPrep();$('prep').scrollIntoView({block:'start'});return;}
  const el=ev.target.closest('[data-el]');if(el&&!el.disabled){toggleArr(PL.els,el.dataset.el);renderPrep();return;}
  const mc=ev.target.closest('.counter button');if(mc){const id=mc.parentElement.dataset.multi;if(+mc.dataset.d>0)PL.jr.push(id);else{const i=PL.jr.indexOf(id);if(i>=0)PL.jr.splice(i,1);}prunePlan(PL);renderPrep();return;}
  const o=ev.target.closest('.opt');if(!o||o.disabled)return;
  const k=o.dataset.k,id=o.dataset.id||null;
  if(k==='origin')PL.origin=id;
  else if(k==='era'){PL.era=id;if(id!=='ancient')PL.region=null;else PL.world=null;}
  else if(k==='region')PL.region=id;
  else if(k==='world')PL.world=id;
  else if(k==='race')PL.race=id;
  else if(k==='birth')PL.birth=id;
  else if(k==='place')PL.place=id;
  else if(k==='talent')PL.talent=id;
  else if(k==='elmode'){PL.elMode=id;if(id){const em=byId(CY_ELMODE,id);PL.els=PL.els.filter(e=>em.pool.includes(e)).slice(0,em.need);if(em.need&&!PL.els.length)PL.els=[em.pool[0]];}}
  else if(k==='eye')PL.eye=id;
  else if(k==='dept')toggleArr(PL.depts,id);
  else if(k==='detail')toggleArr(PL.details,id);
  else if(k==='abil')toggleArr(PL.abil,id);
  else if(k==='item')toggleArr(PL.items,id);
  else if(k==='fb')toggleArr(PL.fb,id);
  else if(k==='jr'){if(PL.jr.includes(id))PL.jr=PL.jr.filter(x=>x!==id);else PL.jr.push(id);}
  else if(k==='rankup')PL.rankUp=!PL.rankUp;
  prunePlan(PL);renderPrep();
}

/* ---------------- 인생 화면 ---------------- */
function renderEntry(e){
  const li=document.createElement('li');
  li.className=e.cat+(e.big?' big':'');
  li.innerHTML=`<span class="y">${yearLabel(e.y)}</span><span class="a">${e.a}세</span><span class="t">${e.ai?'<span class="ai-tag">AI</span>':''}${esc(e.text)}</span>`;
  (renderEntry.target||logEl).appendChild(li);
}
function scrollLog(){if(getComputedStyle(logEl).maxHeight!=='none')logEl.scrollTop=logEl.scrollHeight;}
function setGauge(id,nid,v){$(id).style.width=clamp(v,0,100)+'%';$(nid).textContent=Math.round(clamp(v,0,100));}
function unk(t){return `<span class="unk">${t}</span>`;}
function render(){
  if(!S)return;
  $('vAge').innerHTML=`${S.age}<small>세</small>`;
  $('vYear').innerHTML=`${yearLabel(S.year)}년<br>${S.alive?'살아 있음':'세상을 떠남'}`;
  $('vName').textContent=S.name;
  $('vSub').textContent=`${S.gender==='m'?'남':'여'} · ${yearLabel(S.birthYear)}년생 · ${S.country.n} · ${S.city}`;
  $('vWorld').innerHTML=S.era==='ancient'?`<span class="od">${esc(S.reg.n)}</span> · 명성 ${Math.round(S.fame)}`:S.world?esc(byId(WORLDS,S.world).n):unk('-');
  const bl=Object.entries(S.bonds||{}).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,6);
  $('vBonds').innerHTML=bl.length?bl.map(([k,v])=>`<li><span>${esc(charInfo(k).n)}</span><span class="bondbar"><i style="width:${v}%"></i></span><b>${v}</b></li>`).join(''):'<li><span class="unk">아직 없음</span></li>';
  $('vFam').innerHTML=S.crestGen>0?`${esc(S.famType)} <span class="od">${S.crestGen}대째</span>${S.heir?' · 후계자':''}`:esc(S.famType);
  $('vRace').innerHTML=S.race==='human'?unk('인간'):`<span class="od">${esc(S.era==='ancient'&&S.race==='half'?'반신':byId(CY_RACE,S.race).n)}</span>`;
  const knows=S.mage||S.church||S.sensed||S.aware&&S.circuits>=3;
  $('vCirc').innerHTML=S.circuits<3?(S.mage?`${S.circuits}개`:unk('거의 없음')):(knows?`<span class="od">${S.circuits}개</span> · 질 ${S.qual}`:unk('잠들어 있음'));
  $('vElem').innerHTML=(S.mage||S.church)?`<span class="od">${esc(S.els.map(e=>EL_NAME[e]).join('·'))}</span>`:unk('-');
  $('vOrig').innerHTML=S.originKnown?`<span class="od">「${esc(S.originWord)}」</span>`:unk('???');
  $('vEyes').innerHTML=S.eye?(S.eyesKnown?`<span class="od">${esc(S.eye.n)}</span>`:unk('???')):unk('없음');
  let aff='없음';
  if(S.ancestor)aff='사도 27조';else if(S.apostle)aff='사도';else if(S.fugitive)aff='봉인지정 도망자';else if(S.church)aff=S.burial?'매장기관':'성당교회 대행자';else if(S.academy)aff=`시계탑${S.faction?' · '+S.faction+'파':''}`;else if(S.mage)aff='프리랜서 마술사';else if(S.aware)aff='신비를 아는 일반인';
  $('vAff').innerHTML=aff==='없음'?unk('없음'):`<span class="od">${esc(aff)}</span>`;
  $('vSkill').innerHTML=S.depts.length||S.abil.length?esc([...S.depts.map(id=>byId(CY_DEPTS,id).n),...S.details.map(id=>CY_DET[id].n),...S.abil.map(id=>byId(CY_ABIL,id).n)].join(', ')):unk(S.job?S.job+(S.retired?' (은퇴)':''):'-');
  setGauge('gH','nH',S.health);setGauge('gM','nM',S.mental);setGauge('gW','nW',S.wealth);setGauge('gL','nL',S.luck);
  $('vRank').textContent=S.noRank?'자택연구원':S.academy?RANK_FULL[S.curRank]+(S.curRank<rankTarget()?` → ${RANK_FULL[rankTarget()]}`:'')+(S.color?` · ${S.color}`:''):(S.mage?'시계탑 밖':'-');
  $('vAP').textContent=fmtP(S.ap)+(S.ap>=10?' · 위험':S.ap>=5?' · 높음':'');
  $('vFate').textContent='+'+fmtP(S.fate.reduce((s,x)=>s+x.n,0));
  $('vSeals').hidden=!S.warCount;
  if(S.warCount){$('vSealN').textContent=S.seals;['s1','s2','s3'].forEach((id,i)=>$(id).classList.toggle('used',i>=S.seals));$('vServ').textContent=S.servant?`${S.servant.cls} · ${S.servant.name}`:(S.grailWin?'성배전쟁 승리':'서번트 없음');}
  const lab={plan:'예정',ok:'완료',fail:'실패',dead:'사망'};
  const rows=[...S.sched.map(j=>`<li class="${j.st}"><span>${esc(CY_JRMAP[j.id].n)}</span><span>${j.year} · ${lab[j.st]}</span></li>`),...(S.story||[]).slice(-10).map(x=>`<li class="${x.st}"><span>${esc(x.n)}</span><span>${lab[x.st]}</span></li>`)];
  $('vJr').innerHTML=rows.length?rows.join(''):'<li><span class="unk">아직 없음</span><span></span></li>';
  if(S.img!==lastScene){lastScene=S.img;$('scene').innerHTML=imgHTML(S.img);}
}
function showModal(m){
  const sh=$('sheet');
  if(m.kind==='summon'){
    const sv=m.sv;sh.className='sheet summon';
    sh.innerHTML=`${imgSrc('summon')?imgHTML('summon'):`<svg class="circle" viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56"/><circle cx="60" cy="60" r="44"/><path d="M60 4 L108 88 L12 88 Z"/><path d="M60 116 L12 32 L108 32 Z"/></svg>`}
      <div class="eyebrow">${esc(m.war)} · 서번트 소환</div><div class="cls">${CLS_EN[sv.cls]}</div>
      <h3 id="mTitle">${esc(sv.name)}</h3><div class="stars" aria-label="${sv.tier}성">${'★'.repeat(sv.tier)}${'☆'.repeat(5-sv.tier)}</div>
      <div class="params">${Object.entries(sv.params).map(([k,v])=>`<div>${k}<b>${v}</b></div>`).join('')}</div>
      <p>"묻겠다. 그대가 나의 마스터인가?"</p><button class="btn primary" type="button" id="mOk">계약한다</button>`;
  } else {
    sh.className='sheet '+(m.kind==='summon2'?'summon':'gold');
    sh.innerHTML=`${m.img?imgHTML(m.img):''}<div class="eyebrow">${esc(m.eyebrow||'')}</div><h3 id="mTitle">${esc(m.title)}</h3><p>${esc(m.body||'')}</p><button class="btn primary" type="button" id="mOk">계속</button>`;
  }
  $('modal').hidden=false;$('mOk').focus();
  $('mOk').onclick=()=>{$('modal').hidden=true;drain();};
}
function showChoice(p){
  const sh=$('sheet');
  sh.className='sheet choice'+(p.tone?' '+p.tone:'');
  sh.innerHTML=`${p.img?imgHTML(p.img):''}<div class="eyebrow">${p.fromAi?'<span class="ai-tag">AI</span>':''}${esc(p.eyebrow||'선택')}</div><h3 id="mTitle">${esc(p.title)}</h3>${p.body?`<p>${esc(p.body)}</p>`:''}
    <div class="opts">${p.options.map((o,i)=>`<button type="button" class="optbtn" data-i="${i}"${o.disabled?' disabled':''}><b>${esc(o.label)}</b>${o.sub?`<span>${esc(o.sub)}</span>`:''}</button>`).join('')}</div>`;
  $('modal').hidden=false;
  const first=sh.querySelector('.optbtn:not([disabled])');if(first)first.focus();
  sh.querySelectorAll('.optbtn').forEach(b=>b.onclick=()=>{
    const o=p.options[+b.dataset.i];if(o.disabled)return;
    $('modal').hidden=true;
    if(S.pending===p)S.pending=null;
    S.aiTag=!!p.fromAi;
    try{o.fn();}finally{S.aiTag=false;}
    render();scrollLog();drain();
  });
}
function showTalk(p){
  const c=charInfo(p.char),sc=p.scene,sh=$('sheet');
  sh.className='sheet choice talk';
  sh.innerHTML=`${p.img?imgHTML(p.img,'scene portrait'):''}<div class="eyebrow">${p.fromAi?'<span class="ai-tag">AI</span>':''}대화 · 신뢰 ${bond(p.char)}</div><h3 id="mTitle">${esc(c.n)}</h3>
    <p class="situ">${esc(sc.situation)}</p><p class="line">${esc(sc.line)}</p>
    <div class="opts">${sc.choices.map((o,i)=>`<button type="button" class="optbtn" data-i="${i}"><b>${esc(o.text)}</b></button>`).join('')}</div>`;
  $('modal').hidden=false;
  const f=sh.querySelector('.optbtn');if(f)f.focus();
  sh.querySelectorAll('.optbtn').forEach(b=>b.onclick=()=>{
    const ch=sc.choices[+b.dataset.i];
    if(S.pending===p)S.pending=null;
    const n=talkChoose(p,ch);render();scrollLog();
    sh.innerHTML=`${p.img?imgHTML(p.img,'scene portrait'):''}<div class="eyebrow">대화</div><h3>${esc(c.n)}</h3><p class="line">${esc(ch.reply)}</p>
      <p class="bondchg ${n>0?'up':n<0?'down':''}">신뢰 ${n>0?'+':''}${n} · 지금 ${bond(p.char)}</p><button class="btn primary" type="button" id="mOk">계속</button>`;
    $('mOk').focus();
    $('mOk').onclick=()=>{$('modal').hidden=true;if(p.next)p.next();render();scrollLog();drain();};
  });
}
function showLoading(t){
  const sh=$('sheet');sh.className='sheet choice';
  sh.innerHTML=`<div class="loading"><span class="spin" aria-hidden="true"></span><span>${esc(t)}</span></div>`;
  $('modal').hidden=false;
}
let aiBusy=false;
function drain(){
  if(!S)return;
  if(majorQueue.length){
    if($('autoPause').checked&&!skipping){showModal(majorQueue.shift());return;}
    majorQueue.length=0;
  }
  if(S.pending&&S.pending.ai){
    if(aiBusy)return;
    aiBusy=true;showLoading('운명이 새로운 갈림길을 만들고 있어요…');
    aiMakeEvent().then(p=>{aiBusy=false;S.pending=p;scene(p.img);render();drain();})
      .catch(e=>{aiBusy=false;$('modal').hidden=true;S.pending=null;toast('AI 사건을 만들지 못해 기본 사건으로 대신했어요'+(e&&e.message?': '+e.message:''));builtinOpportunity();render();drain();});
    return;
  }
  if(S.pending&&S.pending.talk){
    const p=S.pending;
    if(p.ai&&!p.aiDone){
      if(aiBusy)return;aiBusy=true;showLoading(`${charInfo(p.char).n}과(와)의 장면을 쓰고 있어요…`);
      aiTalk(p.char,p.ctx).then(sc=>{aiBusy=false;p.scene=sc;p.fromAi=true;p.aiDone=true;showTalk(p);}).catch(e=>{aiBusy=false;p.aiDone=true;toast('AI 대화를 만들지 못해 기본 대화로 대신했어요');showTalk(p);});
      return;
    }
    showTalk(p);return;
  }
  if(S.pending){showChoice(S.pending);return;}
  if(!S.alive&&!S.finished&&!S.endingChoice){finish();return;}
  if(running&&!paused&&S.alive)schedule();
}
function builtinOpportunity(){
  const list=EVENTS.map(e=>({e,w:(S.used[e.id]&&!e.repeat)?0:e.w()})).filter(x=>x.w>0&&x.w<100);
  if(!list.length)return;
  const x=wpick(list,y=>y.w);S.used[x.e.id]=(S.used[x.e.id]||0)+1;
  const p=x.e.make();if(p&&p!==S.pending)S.pending=p;if(S.pending&&S.pending.img)scene(S.pending.img);
}
function schedule(){clearTimeout(timer);timer=setTimeout(tick,Math.round(700/speed));}
function tick(){
  if(!running||paused||S.pending||!$('modal').hidden)return;
  step();render();scrollLog();drain();
}
function showScreen(which){
  $('prep').hidden=which!=='prep';$('game').hidden=which!=='game';
  window.scrollTo({top:0});
}
function startLife(P){
  const c=planCalc(P);
  if(c.errs.length||c.cost>PROFILE.fate){toast(c.errs[0]||'FATE가 모자라요.');return;}
  PROFILE.fate=Math.round((PROFILE.fate-c.cost)*10)/10;saveProfile();renderFate();
  clearTimeout(timer);showScreen('game');
  logEl.innerHTML='';$('endBox').innerHTML='';lastScene='';
  majorQueue.length=0;$('modal').hidden=true;
  logSink=null;
  newLife(P,newSeed());
  S.events.forEach(renderEntry);logSink=renderEntry;
  if(c.cost)log(`FATE ${fmtP(c.cost)}을(를) 써서 운명을 바꾸고 태어났다.`,'moon');
  running=true;paused=false;skipping=false;
  $('bPause').disabled=false;$('bSkip').disabled=false;$('bPause').textContent='일시정지';
  render();drain();
}
function skipToChoice(){
  if(!running||!S||!S.alive)return;
  skipping=true;clearTimeout(timer);$('modal').hidden=true;majorQueue.length=0;
  const frag=document.createDocumentFragment();
  renderEntry.target=frag;
  let g=0;
  while(S.alive&&!S.pending&&g++<1500){step();majorQueue.length=0;}
  renderEntry.target=null;logEl.appendChild(frag);skipping=false;
  render();scrollLog();drain();
}

/* ---------------- 결말 ---------------- */
const LIFE_END_TEXT={
  normal:'달빛 세계를 모른 채, 평범하게 웃고 울다 갔다. 80억 명의 대부분이 그렇듯이. 그것도 충분히 좋은 인생이었다.',
  short:'세상을 제대로 보기도 전에 떠났다. 다음 생에는 조금 더 오래 머물 수 있기를.',
  century:'백 년을 넘게 살았다. 많은 사람을 떠나보냈고, 많은 달을 보았다.',
  wiped:'분명 무언가를 보았다. 하지만 그 기억은 누군가의 손에 지워졌다. 가끔 이유 없이 달이 무서웠다.',
  aware:'신비가 있다는 것을 알고도 살아남았다. 그 비밀을 끝까지 아무에게도 말하지 않았다.',
  eyes:'태어날 때부터 남들과 다른 것을 보았다. 그 눈과 함께, 그 눈을 숨기며 살았다.',
  executor:'주님의 칼로 살았다. 흑건을 던진 밤의 수만큼 이단이 사라졌다.',
  burial:'교회가 가진 가장 날카로운 칼이었다. 그 이름은 어떤 기록에도 남지 않는다.',
  master:'영주를 받고 영령과 함께 싸웠다. 성배에는 닿지 못했지만, 그 며칠은 평생 잊히지 않았다.',
  grail:'만능의 소원기를 손에 쥐었다. 그것이 정말 소원을 이루어 주었는지는 당신만이 안다.',
  apostle:'피를 마시며 시간을 건넜다. 아침 해를 마지막으로 본 것이 언제였는지 기억나지 않는다.',
  ancestor:'사도 27조의 이름 하나가 되었다. 교회와 협회가 당신의 이름을 두려워하며 불렀다.',
  sealed:'봉인지정을 받아들였다. 당신의 재능은 유리병 속에서 영원히 보존된다.',
  root:'모든 마술사의 비원, 근원의 소용돌이에 닿았다. 그 너머에서 돌아온 사람은 없다.'
};
function finish(){
  if(S.finished||S.endingChoice)return;
  running=false;clearTimeout(timer);
  const key=lifeEndingKey();
  if(key){showEnd(key);return;}
  S.endingChoice=true;
  log('어느덧 시간이 찾아왔다. 근원과 세상을 잇는 통로의 끝이 눈앞에 있다.','moon',true);
  render();scrollLog();
  endChoice();drain();
}
function endChoice(){
  S.pending={eyebrow:'결말',img:'end_root',title:'최후의 선택',body:'마술사로 살아온 지금까지의 선택이 당신에게 걸맞은 결말을 열어 두었어요. 하나를 고르세요.',options:endOptions().map(o=>{
    const e=o.id==='beast'?null:endingInfo(o.id);
    return {label:o.ok?`${o.g} · ${o.id==='beast'?'？？？':e[1]}`:`${o.g} · 잠김`,sub:o.ok?'':o.cond,disabled:!o.ok,fn:()=>{o.id==='beast'?beastChain():showEnd(o.id);}};
  })};
}
function beastChain(){
  S.pending={eyebrow:'??? End',tone:'beast',img:'end_beast',title:'정말로?',body:'정말 그 결말을 원해? 돌아가고 싶다면 지금이 마지막 기회야. 네 모든 선택의 책임은 네가 지게 될 테니까.',options:[
    {label:'그 결말을 원한다',sub:'새로운 인류악의 탄생',fn:()=>{
      log('사실 처음 근원에 닿은 순간부터 알고 있었다. 자신의 기원이 인류를 멸망시키는 악, 비스트의 조각이라는 것을.','grail',true);
      S.pending={eyebrow:'인류악 현현 · 형태',tone:'beast',img:'end_beast',title:'어떤 모습으로 현현할까요',body:'',options:BEAST_FORM.map(f=>({label:f[1],sub:f[2],fn:()=>{S.beastForm=f[1];S.beastPow=[];beastPow();}}))};
    }},
    {label:'돌아간다',sub:'다른 결말을 고를래요',fn:()=>endChoice()}
  ]};
}
function beastPow(){
  const left=BEAST_POW.filter(p=>!S.beastPow.includes(p[1]));
  const opts=left.map(p=>({label:p[1],sub:p[2],fn:()=>{S.beastPow.push(p[1]);if(S.beastPow.length<2)beastPow();else beastFinal();}}));
  if(S.beastPow.length)opts.push({label:'이걸로 충분하다',sub:'',fn:beastFinal});
  S.pending={eyebrow:`짐승의 권능 · ${S.beastPow.length+1}번째`,tone:'beast',img:'end_beast',title:'권능을 고르세요',body:'단독현현(진)과 자기개조 EX는 이미 몸에 새겨졌어요. 두 개까지 더 고를 수 있어요.',options:opts};
}
function beastFinal(){
  log(`「선택의 짐승」이 ${S.beastForm}(으)로 현현했다. 권능: 단독현현(진), 자기개조 EX${S.beastPow.length?', '+S.beastPow.join(', '):''}.`,'grail',true);
  S.pending={eyebrow:'최후의 결말',tone:'beast',img:'end_beast',title:'세상의 끝, 혹은 당신의 끝',body:'결말은 하나만 고를 수 있어요.',options:['cy_beast1','cy_beast2','cy_beast3'].map(id=>{const e=endingInfo(id);return {label:e[1],sub:e[2],fn:()=>showEnd(id)};})};
}
function showEnd(key){
  S.alive=false;S.finished=true;running=false;S.pending=null;
  if(!S.deathAge)S.deathAge=S.age;
  const e=endingInfo(key);
  const group=key.startsWith('cy_true')?'True End':key.startsWith('cy_norm')?'Normal End':key.startsWith('cy_beast')?'Beast End':key==='cy_dead'?'Dead End':'결말';
  const title=key==='cy_dead'?`${S.deadEnd}에서 쓰러졌다`:e[1];
  const text=key==='cy_dead'?S.deadText:CY_END_TEXT[key]||LIFE_END_TEXT[key]||e[2];
  const {total,first}=settleFate(key);
  const grouped={};S.fate.forEach(f=>{grouped[f.why]=(grouped[f.why]||0)+f.n;});
  const rows=Object.entries(grouped).sort((a,b)=>b[1]-a[1]);
  const oneIn=rarityOneIn();
  $('endBox').innerHTML=`<div class="ending" role="region" aria-label="결말">
    ${imgHTML(END_IMG[key]||'end_life')}
    <div class="eyebrow">${esc(group)} · ${S.deathAge}세${first?' · 처음 본 결말':''}</div>
    <h3>${esc(title)}</h3>
    <p class="etext">${esc(text)}</p>
    ${(S.achNow||[]).length?`<div class="eyebrow" style="color:var(--gold)">이번 생의 업적</div><ul class="achlist">${S.achNow.map(id=>ACH_ALL.find(a=>a[0]===id)).filter(Boolean).map(a=>`<li>${esc(a[1])}</li>`).join('')}</ul>`:''}
    <div id="judge"></div>
    ${oneIn>1.5?`<div class="rar-sub">태어난 조건만 보면 ${fmtBig(oneIn)}분의 1의 인생이었어요.</div>`:''}
    <div class="eyebrow" style="color:var(--fate)">이번 생에 얻은 FATE</div>
    <ul class="fatelist">${rows.map(([w,n])=>`<li><span>${esc(w)}</span><b>+${fmtP(n)}</b></li>`).join('')}<li class="sum"><span>합계 · 보유 FATE ${fmtP(PROFILE.fate)}</span><b>+${fmtP(total)}</b></li></ul>
    <div class="row">
      <button class="btn primary" type="button" id="bNextLife">다음 생 준비</button>
      <button class="btn" type="button" id="bSame">같은 설계로 바로 태어나기</button>
    </div>
  </div>`;
  $('bNextLife').onclick=()=>{showScreen('prep');pStep=0;renderPrep();};
  $('bSame').onclick=()=>startLife(PL);
  $('bPause').disabled=true;$('bSkip').disabled=true;
  renderFate();renderDex();render();
  S.endTitle=title;renderJudge(SET.epilogue&&aiValid());
  $('endBox').scrollIntoView({behavior:'smooth',block:'nearest'});
}

/* ---------------- AI 평가 ---------------- */
const GRADE_FATE={S:5,A:3,B:2,C:1,D:0,F:0};
function renderJudge(auto){
  const box=$('judge');if(!box||!S)return;
  if(S.judge){const j=S.judge;box.innerHTML=`<div class="judge"><div class="grade g${j.grade}">${j.grade}</div><div><div class="eyebrow"><span class="ai-tag">AI</span>인생 평가${GRADE_FATE[j.grade]?` · FATE +${GRADE_FATE[j.grade]}`:''}</div><h4>${esc(j.title)}</h4><p>${esc(j.comment)}</p></div></div>${j.epilogue?`<p class="epi">${esc(j.epilogue)}</p>`:''}`;return;}
  if(S.judging){box.innerHTML='<p class="epi wait">AI가 이 인생을 평가하고 있어요…</p>';return;}
  if(aiValid()){
    if(auto){runJudge();return;}
    box.innerHTML=`<div class="askjudge"><span>AI에게 이 인생의 평가를 받아 볼까요?</span><button class="btn primary sm" type="button" id="bJudge">평가받기</button></div>`;$('bJudge').onclick=runJudge;return;
  }
  if(S.judgeNo){box.innerHTML='';return;}
  box.innerHTML=`<div class="askjudge"><span>AI를 통해 엔딩을 평가받으시겠습니까?</span><button class="btn primary sm" type="button" id="bJudgeSet">AI 연결하기</button><button class="btn sm" type="button" id="bJudgeNo">괜찮아요</button></div>`;
  $('bJudgeSet').onclick=()=>{S.judgeWait=true;openSettings('ai');};
  $('bJudgeNo').onclick=()=>{S.judgeNo=true;renderJudge();};
}
function runJudge(){
  if(S.judging||S.judge)return;S.judging=true;renderJudge();
  const me=S;
  aiJudge(S.endTitle||'').then(j=>{
    me.judging=false;me.judge=j;
    const b=GRADE_FATE[j.grade]||0;
    if(b){PROFILE.fate=Math.round((PROFILE.fate+b)*10)/10;PROFILE.totalFate=(PROFILE.totalFate||0)+b;}
    if(PROFILE.history[0])PROFILE.history[0].g=j.grade;
    saveProfile();renderFate();renderDex();if(S===me)renderJudge();
  }).catch(e=>{me.judging=false;if(S===me){$('judge').innerHTML=`<div class="askjudge"><span>평가를 받지 못했어요. ${esc(e&&e.message||'')}</span><button class="btn sm" type="button" id="bJudge">다시 시도</button></div>`;$('bJudge').onclick=runJudge;}});
}

/* ---------------- 도감 ---------------- */
function renderDex(){
  const st=PROFILE,all=LIFE_ENDINGS.concat(CY_ENDINGS);
  const got=all.filter(e=>st.endings[e[0]]).length;
  $('dexSub').textContent=`${st.lives}번 태어났고, 결말 ${all.length}개 중 ${got}개를 봤어요. 지금까지 모은 FATE ${fmtP(st.totalFate||0)}.`;
  const item=e=>{const n=st.endings[e[0]];return n?`<div class="dex-item got"><b>${esc(e[1])}</b><span>${esc(e[2])}</span> <span class="n">×${n}</span></div>`:`<div class="dex-item locked"><b>？？？</b><span>${esc(e[2])}</span></div>`;};
  const A=st.ach||{},gotA=ACH_ALL.filter(a=>A[a[0]]).length;
  const aitem=a=>A[a[0]]?`<div class="dex-item got"><b>${esc(a[1])}</b><span>${esc(a[2])}</span></div>`:`<div class="dex-item locked"><b>？？？</b><span>${esc(a[2])}</span></div>`;
  const sp=st.spirits||[];
  $('dex').innerHTML=`<h3 class="dex-h">인생의 결말</h3><div class="dex-grid">${LIFE_ENDINGS.map(item).join('')}</div><h3 class="dex-h">마술사의 결말</h3><div class="dex-grid">${CY_ENDINGS.map(item).join('')}</div>
    <h3 class="dex-h">업적 · ${gotA}/${ACH_ALL.length}</h3>${ACH.map(g=>`<div class="ach-g">${esc(g[1])}</div><div class="dex-grid">${g[2].map(aitem).join('')}</div>`).join('')}
    ${sp.length?`<h3 class="dex-h">영령의 좌에 오른 전생</h3><div class="dex-grid">${sp.map(x=>`<div class="dex-item got"><b>${esc(x.name)}</b><span>${esc(x.epithet)} · ${esc(x.cls)} ${'★'.repeat(x.tier)}</span></div>`).join('')}</div><p class="dex-sub">현대의 성배전쟁에서 전생의 당신이 소환될 수 있어요.</p>`:''}`;
  $('recent').innerHTML=st.history.length?`최근 인생<ol>${st.history.map(l=>{const e=all.find(x=>x[0]===l.k);return `<li>${esc(l.name)} · ${esc(l.c)} ${yearLabel(l.y)}년생 · ${l.a}세 · ${esc(e?e[1]:'')}${l.g?' · 평가 '+l.g:''} · FATE +${fmtP(l.f)}</li>`;}).join('')}</ol>`:'';
}

/* ---------------- 설정 ---------------- */
let setTab='ai',studioStop=false,studioBusy=false;
function openSettings(tab){setTab=tab||setTab;$('setModal').hidden=false;renderSettings();}
function renderSettings(){
  const tabs=[['ai','이야기 AI'],['nai','그림 AI'],['studio','기본 그림 공방'],['net','연결'],['data','기록']];
  const g=gachaSettings();
  let h=`<div class="tabs" role="tablist">${tabs.map(t=>`<button type="button" role="tab" data-tab="${t[0]}" aria-selected="${setTab===t[0]}">${t[1]}</button>`).join('')}</div>`;
  if(setTab==='ai'){
    const a=SET.ai;
    h+=`<div class="form">
      <p class="help">AI를 연결하면 인생 도중 정해진 사건 대신 AI가 그 인생에 맞춘 새 사건과 선택지를 만들어요(한 생에 최대 ${aiMax()}번). 인생이 끝나면 후일담도 써 줘요. 키는 이 기기에만 저장돼요.</p>
      ${g.ai?`<div class="row"><button class="btn" type="button" data-act="impAi">가챠 게임 메이커의 AI 설정 가져오기</button><span class="help">${esc(g.ai.name)} · ${esc(g.ai.model||'기본 모델')}</span></div>`:''}
      <label>AI 종류<select id="sAiType">${Object.entries(AI_TYPES).map(([k,v])=>`<option value="${k}"${a.type===k?' selected':''}>${v}</option>`).join('')}</select></label>
      ${a.type==='openai'?`<label>API 주소<input type="text" id="sAiBase" value="${esc(a.base)}" placeholder="https://openrouter.ai/api/v1"></label>`:''}
      <label>API 키<input type="password" id="sAiKey" value="${esc(a.key)}" autocomplete="off"></label>
      <label>모델 이름<input type="text" id="sAiModel" value="${esc(a.model)}" placeholder="${esc(AI_DEFAULT_MODEL[a.type]||'예: deepseek/deepseek-chat-v3.1')}"></label>
      <p class="help">${a.type==='gemini'?'Google AI Studio(aistudio.google.com/apikey)에서 무료로 받을 수 있어요.':a.type==='anthropic'?'Anthropic Console에서 받아요(유료).':'OpenRouter, DeepSeek 같은 OpenAI 방식 API예요. 모델 이름은 그 서비스에 나온 이름 그대로 써요.'}</p>
      <label class="check"><input type="checkbox" id="sAiOn"${SET.aiOn?' checked':''}> 인생 도중 AI 사건 쓰기</label>
      <label>한 생에 AI 사건 최대 횟수<input type="number" id="sAiMax" min="1" max="10" value="${aiMax()}"></label>
      <label class="check"><input type="checkbox" id="sEpi"${SET.epilogue?' checked':''}> 결말에 AI 평가와 후일담 받기</label>
      <div class="row"><button class="btn primary" type="button" data-act="saveAi">저장</button><button class="btn" type="button" data-act="testAi">연결 시험</button><span id="aiTest" class="help"></span></div>
    </div>`;
  } else if(setTab==='nai'){
    const n=SET.nai;
    h+=`<div class="form">
      <p class="help">NovelAI로 기본 그림을 뽑아요. 그림은 한 번만 뽑아 사이트에 넣어 두는 방식이라, 게임을 할 때마다 그리지 않아요. 뽑기는 「기본 그림 공방」 탭에서 해요.</p>
      ${g.nai?`<div class="row"><button class="btn" type="button" data-act="impNai">가챠 게임 메이커의 NovelAI 설정 가져오기</button></div>`:''}
      <label>NovelAI 토큰<input type="password" id="sNaiKey" value="${esc(n.key)}" autocomplete="off"></label>
      <p class="help">novelai.net 로그인 → 설정(톱니) → Account → Get Persistent API Token</p>
      <label>모델<select id="sNaiModel">${NAI_MODELS.map(m=>`<option value="${m[0]}"${n.model===m[0]?' selected':''}>${m[1]}</option>`).join('')}</select></label>
      <label>그림체 태그 (비우면 기본)<textarea id="sNaiStyle" placeholder="${esc(IMG_STYLE)}">${esc(n.style)}</textarea></label>
      <label>추가로 빼고 싶은 태그<textarea id="sNaiNeg" placeholder="예: 3d, photo">${esc(n.neg)}</textarea></label>
      <div class="row"><button class="btn primary" type="button" data-act="saveNai">저장</button></div>
    </div>`;
  } else if(setTab==='studio'){
    const loc=IMGS.filter(i=>LOCAL_URL[i.id]).length,site=IMGS.filter(i=>SITE_IMGS.has(i.id)).length;
    h+=`<p class="help">기본 그림 ${IMGS.length}장. 사이트에 들어 있는 그림 ${site}장, 이 기기에서 뽑은 그림 ${loc}장. 뽑은 그림은 이 기기에서 바로 쓰여요. 모두에게 보이게 하려면 ZIP으로 내려받아 저장소의 typemoon-life 폴더에 풀어 올리거나(img 폴더째), 대화창에 올려 주세요.</p>
    <div class="studio-bar" style="margin-top:10px">
      <button class="btn primary" type="button" data-act="genMissing"${studioBusy?' disabled':''}>빠진 그림 모두 뽑기</button>
      <button class="btn" type="button" data-act="genStop"${studioBusy?'':' disabled'}>멈추기</button>
      <button class="btn" type="button" data-act="zip"${loc?'':' disabled'}>ZIP으로 내려받기</button>
      <button class="btn" type="button" data-act="clearLocal"${loc?'':' disabled'}>이 기기 그림 지우기</button>
      <span id="studioMsg" class="help"></span>
    </div>
    <div class="studio">${IMGS.map(it=>`<div class="sitem" data-id="${it.id}">
      ${imgHTML(it.id)}
      <div class="top"><b>${esc(it.n)}</b><span class="${LOCAL_URL[it.id]?'local':SITE_IMGS.has(it.id)?'site':''}">${LOCAL_URL[it.id]?'이 기기':SITE_IMGS.has(it.id)?'사이트':'없음'}</span></div>
      <textarea data-prompt="${it.id}" aria-label="${esc(it.n)} 프롬프트">${esc(imgPrompt(it.id))}</textarea>
      <div class="btns"><button class="btn sm" type="button" data-gen="${it.id}"${studioBusy?' disabled':''}>${LOCAL_URL[it.id]||SITE_IMGS.has(it.id)?'다시 뽑기':'뽑기'}</button>${LOCAL_URL[it.id]?`<button class="btn sm" type="button" data-del="${it.id}">지우기</button>`:''}</div>
    </div>`).join('')}</div>`;
  } else if(setTab==='net'){
    h+=`<div class="form">
      <p class="help">NovelAI처럼 브라우저 직접 연결을 막는 서비스는 중계 서버를 거쳐야 할 수 있어요. 가챠 게임 메이커에서 쓰는 중계 서버(Cloudflare Workers의 worker.js)를 그대로 쓰면 돼요. 같은 jjhk0803.github.io 주소라서 따로 고칠 것이 없어요.</p>
      ${g.proxy?`<div class="row"><button class="btn" type="button" data-act="impPx">가챠 게임 메이커의 중계 서버 가져오기</button><span class="help">${esc(g.proxy)}</span></div>`:''}
      <label>중계 서버 주소<input type="text" id="sPx" value="${esc(SET.proxy)}" placeholder="https://내-이름.workers.dev"></label>
      <div class="row"><button class="btn primary" type="button" data-act="savePx">저장</button></div>
    </div>`;
  } else {
    h+=`<div class="form">
      <p class="help">보유 FATE ${fmtP(PROFILE.fate)} · ${PROFILE.lives}번의 인생. 기록은 이 기기의 브라우저에만 있어요.</p>
      <div class="row"><button class="btn" type="button" data-act="wipe">${setTab==='data'&&renderSettings._arm?'정말 지울까요? 한 번 더 누르세요':'FATE와 기록 모두 지우기'}</button></div>
    </div>`;
  }
  $('setBody').innerHTML=h;
}
async function genOne(id){
  const msg=$('studioMsg');
  try{
    const blob=await naiGenerate(id,a=>{if(msg)msg.textContent=`「${byId(IMGS,id).n}」 그리는 중${a>1?` (재시도 ${a})`:''}…`;});
    await idbPut(id,blob);if(LOCAL_URL[id])URL.revokeObjectURL(LOCAL_URL[id]);LOCAL_URL[id]=URL.createObjectURL(blob);
    return true;
  }catch(e){toast(e&&e.message||'그림을 뽑지 못했어요.');return false;}
}
async function onSettingsClick(ev){
  const t=ev.target.closest('[data-tab]');if(t){setTab=t.dataset.tab;renderSettings._arm=false;renderSettings();return;}
  const gen=ev.target.closest('[data-gen]');
  if(gen&&!studioBusy){studioBusy=true;renderSettings();await genOne(gen.dataset.gen);studioBusy=false;renderSettings();refreshImages();return;}
  const del=ev.target.closest('[data-del]');
  if(del){await idbDel(del.dataset.del);URL.revokeObjectURL(LOCAL_URL[del.dataset.del]);delete LOCAL_URL[del.dataset.del];renderSettings();refreshImages();return;}
  const b=ev.target.closest('[data-act]');if(!b)return;
  const act=b.dataset.act,g=gachaSettings();
  if(act==='impAi'&&g.ai){SET.ai={type:g.ai.type,key:g.ai.key,model:g.ai.model,base:g.ai.base||SET.ai.base};saveSettings();toast('AI 설정을 가져왔어요');renderSettings();}
  if(act==='impNai'&&g.nai){SET.nai=Object.assign(SET.nai,g.nai);saveSettings();toast('NovelAI 설정을 가져왔어요');renderSettings();}
  if(act==='impPx'){SET.proxy=g.proxy;saveSettings();toast('중계 서버 주소를 가져왔어요');renderSettings();}
  if(act==='saveAi'||act==='testAi'){
    const ty=$('sAiType').value;
    SET.ai={type:ty,key:$('sAiKey').value.trim(),model:$('sAiModel').value.trim(),base:$('sAiBase')?$('sAiBase').value.trim():SET.ai.base};
    SET.aiOn=$('sAiOn').checked;SET.aiMax=clamp(+$('sAiMax').value||4,1,10);SET.epilogue=$('sEpi').checked;saveSettings();
    if(act==='saveAi'){toast('저장했어요');renderSettings();return;}
    $('aiTest').textContent='시험 중…';$('aiTest').className='help';
    try{const r=await aiCall('TYPE-MOON 세계관의 한 줄 인사를 만든다. 출력 형식: {"text":""}',200);$('aiTest').textContent='연결됐어요: '+String(r.text||'').slice(0,60);$('aiTest').className='help ok';}
    catch(e){$('aiTest').textContent=(e&&e.message)||'연결하지 못했어요.';$('aiTest').className='help bad';}
  }
  if(act==='saveNai'){SET.nai={key:$('sNaiKey').value.trim(),model:$('sNaiModel').value,style:$('sNaiStyle').value.trim(),neg:$('sNaiNeg').value.trim()};saveSettings();toast('저장했어요');}
  if(act==='savePx'){SET.proxy=$('sPx').value.trim();saveSettings();toast('저장했어요');}
  if(act==='genMissing'&&!studioBusy){
    if(!SET.nai.key){toast('그림 AI 탭에서 NovelAI 토큰을 먼저 넣어 주세요.');return;}
    studioBusy=true;studioStop=false;renderSettings();
    const todo=IMGS.filter(i=>!LOCAL_URL[i.id]&&!SITE_IMGS.has(i.id));let n=0;
    for(const it of todo){if(studioStop)break;if(await genOne(it.id))n++;else break;renderSettings();}
    studioBusy=false;renderSettings();refreshImages();toast(`${n}장을 뽑았어요`);
  }
  if(act==='genStop'){studioStop=true;toast('지금 그리는 그림까지만 뽑고 멈춰요');}
  if(act==='zip'){
    const {blob,count}=await exportZip();
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='typemoon-life-img.zip';document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);toast(`그림 ${count}장을 ZIP으로 내려받았어요`);
  }
  if(act==='clearLocal'){await idbDel(null);Object.values(LOCAL_URL).forEach(u=>URL.revokeObjectURL(u));LOCAL_URL={};renderSettings();refreshImages();}
  if(act==='wipe'){
    if(!renderSettings._arm){renderSettings._arm=true;renderSettings();return;}
    renderSettings._arm=false;PROFILE={fate:0,lives:0,endings:{},history:[],totalFate:0};saveProfile();PL=planBlank();savePlan();
    renderFate();renderDex();renderPrep();renderSettings();toast('기록을 모두 지웠어요');
  }
}
function onSettingsInput(ev){
  const ta=ev.target.closest('[data-prompt]');if(!ta)return;
  const id=ta.dataset.prompt,v=ta.value.trim(),def=byId(IMGS,id).p;
  if(!v||v===def)delete SET.prompts[id];else SET.prompts[id]=v;saveSettings();
}
function refreshImages(){
  $('heroArt').innerHTML=imgSrc('title')?imgHTML('title'):'';
  lastScene='';if(S)render();
}

/* ---------------- 연결 ---------------- */
$('pBody').addEventListener('click',onPrepClick);
$('pSteps').addEventListener('click',onPrepClick);
$('pPrev').onclick=()=>{if(pStep>0){pStep--;renderPrep();$('prep').scrollIntoView({block:'start'});}};
$('pNext').onclick=()=>{if(pStep<PSTEPS.length-1){pStep++;renderPrep();$('prep').scrollIntoView({block:'start'});}};
$('pReset').onclick=()=>{PL=planBlank();pStep=0;renderPrep();};
$('pGo').onclick=()=>startLife(PL);
$('firstGo').onclick=()=>{PL=planBlank();startLife(PL);};
$('bPrep').onclick=()=>{clearTimeout(timer);running=false;$('modal').hidden=true;showScreen('prep');renderPrep();};
$('bPause').onclick=()=>{if(!running)return;paused=!paused;$('bPause').textContent=paused?'계속':'일시정지';if(!paused&&$('modal').hidden)schedule();};
$('bSkip').onclick=skipToChoice;
document.querySelectorAll('.speed button').forEach(b=>b.onclick=()=>{speed=+b.dataset.s;document.querySelectorAll('.speed button').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));if(running&&!paused&&$('modal').hidden&&S&&!S.pending)schedule();});
$('bSettings').onclick=()=>openSettings();
$('setClose').onclick=()=>{$('setModal').hidden=true;if(S&&S.finished&&!S.judge)renderJudge(!!S.judgeWait);};
$('setBody').addEventListener('click',onSettingsClick);
$('setBody').addEventListener('input',onSettingsInput);
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!$('setModal').hidden)$('setModal').hidden=true;});
renderFate();renderPrep();renderDex();
loadImageIndex().then(refreshImages);
