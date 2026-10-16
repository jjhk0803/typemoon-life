'use strict';
/* =========================================================
   타입문 인생게임 · 인생 엔진
   - FATE(운명력)로 다음 생을 설계하고, 고르지 않은 칸은 실제 확률로 정해진다.
   - 인생 도중 기회 사건이 오면 선택지로 운명을 바꾼다.
   ========================================================= */
const byId=(arr,id)=>arr.find(x=>x.id===id);
function fmtP(v){const r=Math.round(v*100)/100;return Number.isInteger(r)?String(r):r.toFixed(2).replace(/0$/,'');}

/* ---------------- 프로필(FATE, 도감) ---------------- */
const PROFILE_KEY='typemoon-life-profile';
function loadProfile(){
  let p=null;try{p=JSON.parse(localStorage.getItem(PROFILE_KEY)||'null');}catch(e){}
  return Object.assign({fate:0,lives:0,endings:{},history:[],totalFate:0},p||{});
}
let PROFILE=loadProfile();
function saveProfile(){try{localStorage.setItem(PROFILE_KEY,JSON.stringify(PROFILE));}catch(e){}}

/* ---------------- 다음 생 설계 ---------------- */
function planBlank(){return {origin:'plain',race:null,birth:null,place:null,talent:null,elMode:null,els:[],depts:[],details:[],abil:[],eye:null,items:[],fb:[],jr:[],rankUp:false};}
function planEls(P){
  if(!P.elMode)return null;
  if(P.elMode==='void')return['허'];
  if(P.elMode==='avg')return['지','수','화','풍','공'];
  return P.els.slice(0,byId(CY_ELMODE,P.elMode).need);
}
function deptCost(P,d){
  if(P.origin==='root')return 0;
  const e=planEls(P);
  const base=e&&d.els&&d.els.length&&d.els.some(x=>e.includes(x))?FATE_COST.deptHalf:FATE_COST.dept;
  return base+(d.cp||0)*2;
}
function abilCost(P,a){
  const o=a.o;
  if(o.free&&o.free.every(x=>P.depts.includes(x)))return 0;
  if(o.cheap&&P.details.includes(o.cheap[0]))return o.cheap[1]*3;
  return (o.mp||1)*3;
}
function eyeCost(P,e){return e.art&&P.details.includes('artieye')?0:e.mp*3;}
function itemCost(P,it){const o=it.o;if(o.cheapDept&&P.depts.includes(o.cheapDept[0]))return o.cheapDept[1]*2;if(o.cheapRace&&P.race===o.cheapRace[0])return o.cheapRace[1]*2;return o.cp*2;}
function itemAp(P,it){const o=it.o;if(o.apDept&&P.depts.includes(o.apDept[0]))return o.apDept[1];return o.ap||0;}
function jrCost(P,j){if(j.id==='dismantle'&&P.jr.includes('hgw4')&&P.jr.includes('hgw5'))return 0;return j.fp?j.fp*3:2;}
function planApNoJr(P){return planCalc(Object.assign({},P,{jr:[]})).ap;}
function planJrReq(P,j){
  if(j.req==='puppeteer'&&!P.details.includes('puppeteer'))return '세부 항목 「색위의 인형사」가 필요해요.';
  if(j.req==='create'&&!P.depts.includes('create'))return '마술계통 「창조」가 필요해요.';
  if(j.req==='arch'&&(!P.depts.includes('arch')||!P.jr.includes('chaos')))return '마술계통 「고고학」과 행적 「사도: 교수 추적」이 필요해요.';
  if(j.req==='vamp'&&P.race!=='vamp')return '종족 「흡혈귀·사도」를 골라야 해요.';
  if(j.req==='root'&&P.origin!=='root')return '기원 「근원접속자」가 필요해요.';
  if(j.req==='aplow'&&planApNoJr(P)>=5)return '억지력이 5 미만이어야 해요.';
  return '';
}
function planFbReq(P,f){
  const o=f.o;
  if(o.noEye&&P.eye)return '마안과 함께 고를 수 없어요.';
  if(o.noAbil&&P.abil.includes(o.noAbil))return '마력노심과 함께 고를 수 없어요.';
  if(o.race&&P.race!==o.race)return '종족 「혼혈」을 골라야 해요.';
  if(o.dept&&!P.depts.includes(o.dept))return `마술계통 「${byId(CY_DEPTS,o.dept).n}」이 필요해요.`;
  if(o.notBirth&&(P.birth===o.notBirth||!P.birth))return '출생을 마술사 가문 쪽으로 골라야 해요.';
  if(o.item&&!P.items.includes(o.item))return '카레이도 스틱이 필요해요.';
  if(o.cp&&!['noble','lord','magus','user'].includes(P.birth))return '재산이 있는 집안이어야 해요.';
  return '';
}
function rankFrom(nEl,nd,ndt,na){
  let r=0;
  if(nd>=1)r=1;
  if(nEl+nd+ndt+na>=5&&nd>=1)r=2;
  if(nEl+nd+ndt+na>=7&&nd>=1&&ndt>=1)r=3;
  if(nEl>=2&&na>=2)r=Math.max(r,4);
  const rp=nEl+nd+ndt+na;
  if(rp>=9&&nd>=2&&ndt>=2&&na>=1)r=Math.max(r,5);
  if(rp>=11&&nd>=3&&ndt>=2&&na>=1)r=Math.max(r,6);
  if(rp>=16&&nd>=4&&ndt>=3&&na>=2)r=7;
  return r;
}
function planCalc(P){
  const root=P.origin==='root';
  let cost=FATE_COST.origin[P.origin]||0,refund=0;
  const gains=[];
  const race=P.race?byId(CY_RACE,P.race):null,birth=P.birth?byId(CY_BIRTH,P.birth):null;
  if(race){cost+=FATE_COST.race[race.id];gains.push(race.ap||0);}
  if(birth){cost+=FATE_COST.birth[birth.id];gains.push(birth.ap||0);}
  if(P.place)cost+=byId(PLACES,P.place).cost;
  if(P.talent)cost+=FATE_COST.talent[P.talent];
  if(P.elMode&&!root)cost+=FATE_COST.elMode[P.elMode];
  P.depts.forEach(id=>{const d=byId(CY_DEPTS,id);cost+=deptCost(P,d);gains.push(d.ap||0);});
  P.details.forEach(id=>{const d=CY_DET[id];cost+=root?0:FATE_COST.detail;gains.push(d.o.ap||0);});
  P.abil.forEach(id=>{const a=byId(CY_ABIL,id);cost+=abilCost(P,a);gains.push(a.o.ap||0);});
  if(P.eye){const e=byId(CY_EYE,P.eye);cost+=eyeCost(P,e);gains.push(e.ap||0);}
  P.items.forEach(id=>{const it=byId(CY_ITEMS,id);cost+=itemCost(P,it);gains.push(itemAp(P,it));});
  P.fb.forEach(id=>{const f=byId(CY_FB,id);refund+=FATE_COST.fbRefund;gains.push(f.o.ap!==undefined?f.o.ap:-1);});
  P.jr.forEach(id=>{cost+=jrCost(P,CY_JRMAP[id]);});
  if(P.rankUp)cost+=FATE_COST.rankUp;
  let ap=root?5:0;gains.forEach(g=>{ap+=g>0&&root?g*2:g;});
  const els=planEls(P);
  const nEl=els?els.length:1,na=P.abil.length+(P.eye?1:0);
  let rank=rankFrom(nEl,P.depts.length,P.details.length,na);
  if(P.rankUp&&rank>=1)rank=Math.min(7,rank+1);
  const errs=[];
  if(P.elMode){const em=byId(CY_ELMODE,P.elMode);if(em.need&&P.els.length<em.need)errs.push(`마술속성을 ${em.need}개 골라 주세요.`);}
  P.details.forEach(id=>{const d=CY_DET[id];if(!P.depts.includes(d.dept))errs.push(`세부 항목 「${d.n}」은(는) 해당 계통이 필요해요.`);});
  P.jr.forEach(id=>{const why=planJrReq(P,CY_JRMAP[id]);if(why)errs.push(`행적 「${CY_JRMAP[id].n}」: ${why}`);});
  P.fb.forEach(id=>{const f=byId(CY_FB,id);const why=planFbReq(P,f);if(why)errs.push(`피드백 「${f.n}」: ${why}`);});
  P.abil.forEach(id=>{const a=byId(CY_ABIL,id);if(a.o.notRace&&a.o.notRace===P.race)errs.push(`「${a.n}」은(는) 이 종족으로 고를 수 없어요.`);});
  if(root&&P.items.length)errs.push('근원접속자는 마술예장을 고를 수 없어요.');
  if(P.rankUp&&!P.depts.length)errs.push('계위를 올리려면 마술계통이 하나 이상 있어야 해요.');
  const total=Math.max(0,cost-refund);
  return {cost:total,raw:cost,refund,ap,rank,errs,noRank:P.fb.includes('home')};
}
function prunePlan(P){
  P.details=P.details.filter(d=>P.depts.includes(CY_DET[d].dept));
  if(P.origin==='root')P.items=[];
  for(let k=0;k<3;k++){
    P.fb=P.fb.filter(id=>!planFbReq(P,byId(CY_FB,id)));
    P.jr=P.jr.filter(id=>!planJrReq(P,CY_JRMAP[id]));
  }
  P.abil=P.abil.filter(id=>byId(CY_ABIL,id).o.notRace!==P.race);
  if(P.elMode){const em=byId(CY_ELMODE,P.elMode);P.els=P.els.filter(e=>em.pool.includes(e)).slice(0,em.need);}else P.els=[];
  if(!P.depts.length)P.rankUp=false;
}

/* ---------------- 상태와 기록 ---------------- */
let S=null;
let logSink=null;
function log(text,cat,big){
  const e={y:S.year,a:S.age,text,cat:cat||'life',big:!!big,ai:!!S.aiTag};
  S.events.push(e);
  if(logSink)logSink(e);
}
const majorQueue=[];
function major(m){majorQueue.push(m);}
function addRar(label,p){S.rar.push({label,p});}
function fate(n,why){if(n)S.fate.push({n,why});}
function makeName(nm,g){
  const p=NAMES[nm]||NAMES.en;
  const giv=pick(g==='m'?p.m:p.f),fam=pick(p.fam);
  if(p.tight)return fam+giv;
  return p.fg?fam+' '+giv:giv+' '+fam;
}
function scene(id){S.img=id;}
function addAp(v){if(!v)return;S.ap+=v>0&&S.origin==='root'?v*2:v;}
function rankTarget(){
  if(S.noRank)return 0;
  const na=S.abil.length+(S.eye?1:0);
  let r=rankFrom(S.els.length,S.depts.length,S.details.length,na);
  if(r>=1)r=Math.min(7,r+S.rankBonus);
  return r;
}
function learnDept(id,why){
  if(S.depts.includes(id))return false;
  const d=byId(CY_DEPTS,id);S.depts.push(id);addAp(d.ap||0);
  log(`마술계통 「${d.n}」을(를) 익혔다.${why?' '+why:''}`,'moon');fate(1,`계통 「${d.n}」`);
  return true;
}
function learnDetail(id){
  if(S.details.includes(id))return false;
  const d=CY_DET[id];S.details.push(id);addAp(d.o.ap||0);
  if(d.o.cp)S.wealth+=d.o.cp*5;
  log(`세부 항목 「${d.n}」을(를) 익혔다.`,'moon');fate(1,`세부 「${d.n}」`);
  return true;
}
function gainAbility(id,free){
  if(S.abil.includes(id))return false;
  const a=byId(CY_ABIL,id);S.abil.push(id);
  if(free)S.freeAbil.push(id);else addAp(a.o.ap||0);
  log(`능력 「${a.n}」을(를) 얻었다.${free?' 억지력은 움직이지 않았다.':''}`,'joy',true);fate(1,`능력 「${a.n}」`);
  return true;
}
function randomAbility(free){
  const pool=CY_ABIL.filter(a=>a.id!=='solo'&&!S.abil.includes(a.id)&&!(a.o.notRace&&a.o.notRace===S.race));
  if(!pool.length){S.jexp+=.3;log('이미 많은 것을 익혔다. 대신 실력이 한층 깊어졌다.','joy');return;}
  gainAbility(pick(pool).id,free);
}
function deptsForMe(n){
  const mine=CY_DEPTS.filter(d=>!S.depts.includes(d.id)&&!d.side);
  const fit=mine.filter(d=>d.els===null||!d.els.length||d.els.some(e=>S.els.includes(e)));
  const pool=(fit.length>=n?fit:mine).slice().sort(()=>R()-.5);
  return pool.slice(0,n);
}
function becomeMage(teacher){
  if(S.mage)return;
  S.mage=true;S.aware=true;S.teacher=teacher;
  if(S.circuits<3)S.circuits=ri(3,8);
  fate(3,'마술사가 됨');
}
function becomeAware(){if(!S.aware){S.aware=true;fate(2,'달빛 세계를 앎');}}
function becomeChurch(){
  if(S.church)return;
  S.church=true;S.aware=true;fate(3,'성당교회 대행자');
  learnDept('eighth','교회에서 흑건 던지는 법부터 배웠다.');
}
function becomeApostle(text){
  S.apostle=true;S.apostleAge=S.age;S.aware=true;S.long=true;S.endYear=S.year+ri(40,160);
  addRar('사도가 됨',.03);fate(5,'사도가 됨');
  log(text,'moon',true);scene('birth_inhuman');
  major({kind:'gold',img:'birth_inhuman',eyebrow:'죽음을 잊다',title:'사도가 되었다',body:'늙지도 죽지도 않는 몸. 대신 성당교회의 매장기관이 당신의 이름을 명부에 적었다.'});
}
function power(){
  let p=rankTarget()*.6+Math.max(0,S.curRank)*.3;
  S.abil.forEach(id=>{p+=.3+(byId(CY_ABIL,id).o.pw||0);});
  if(S.eye)p+=.2+(byId(CY_EYE,S.eye.id).pw||0);
  S.items.forEach(id=>{p+=byId(CY_ITEMS,id).o.pw||0;});
  p+={human:0,vamp:1,homun:.3,half:.6,dragon:2,true:2.5}[S.race]||0;
  if(S.apostle&&S.race==='human')p+=1;
  p+=Math.min(S.depts.length,5)*.15+S.jexp+(S.luck-50)/120+Math.min(S.circuits,100)/60;
  if(S.fb.includes('careless'))p-=.3;
  if(S.fb.includes('legs'))p-=.3;
  if(S.fb.includes('wrongorigin'))p-=.5;
  if(!S.mage&&!S.church)p-=1;
  return p;
}
function odds(rec,mod){return clamp(1/(1+Math.exp(-(power()+(mod||0)-rec)*1.1)),.05,.97);}
function hasConcept(){return (S.eye&&S.eye.id==='rainbow')||S.items.some(id=>byId(CY_ITEMS,id).o.concept);}

/* ---------------- 태어나기 ---------------- */
function pickCountryFor(P){
  const C=n=>COUNTRIES.find(c=>c.n===n);
  const w=list=>C(wpick(list,x=>x[1])[0]);
  if(P.race==='true')return w([['핀란드',5],['독일',3],['루마니아',2]]);
  if(P.race==='dragon')return w([['영국',6],['독일',2],['중국',2]]);
  if(P.race==='homun')return w([['독일',8],['이집트',1],['일본',1]]);
  if(P.race==='vamp'&&chance(.35))return C('루마니아');
  if(P.birth==='lord'||P.birth==='noble')return chance(.6)?C('영국'):w([['독일',3],['프랑스',3],['이탈리아',2],['핀란드',1],['루마니아',1]]);
  if(P.birth==='magus')return w([['영국',30],['독일',15],['일본',15],['이탈리아',10],['프랑스',10],['이집트',5],['미국',10],['러시아',5]]);
  if(P.birth==='church')return w([['이탈리아',35],['프랑스',15],['스페인',15],['필리핀',10],['폴란드',10],['브라질',15]]);
  if(P.birth==='user')return w([['미국',50],['일본',20],['영국',10],['독일',20]]);
  return null;
}
function lifeBirthYear(P){
  const ys=P.jr.map(id=>CY_JRMAP[id]).filter(j=>j.year||j.minYear).map(j=>j.year||j.minYear);
  if(!ys.length)return ri(1950,2004);
  const mn=Math.min(...ys),mx=Math.max(...ys);
  let by=mn-ri(19,27);
  const longLived=['vamp','true','dragon'].includes(P.race);
  if(!longLived&&mx-by>62)by=mx-62;
  if(mn-by<15)by=mn-15;
  return clamp(by,1900,2008);
}
function scheduleJourneys(P,birthYear){
  const list=[],used=new Set();
  const put=(id,year)=>{while(used.has(year))year++;used.add(year);list.push({id,year,st:'plan',bought:true});};
  P.jr.filter(id=>CY_JRMAP[id].year).forEach(id=>put(id,CY_JRMAP[id].year));
  let lesserN=0;
  P.jr.forEach(id=>{
    const j=CY_JRMAP[id];
    if(j.year||j.last||j.after)return;
    if(j.minYear){put(id,Math.max(j.minYear,birthYear+18)+lesserN*ri(1,3)+ri(0,4));lesserN++;return;}
    if(j.age)put(id,birthYear+ri(j.age[0],j.age[1]));
  });
  P.jr.forEach(id=>{const j=CY_JRMAP[id];if(j.after){const a=list.find(x=>x.id===j.after);put(id,(a?a.year:birthYear+30)+ri(1,4));}});
  list.sort((a,b)=>a.year-b.year);
  if(P.jr.includes('fortnia')){const lastY=list.length?list[list.length-1].year:birthYear+40;put('fortnia',Math.max(lastY+ri(2,6),birthYear+45));}
  list.sort((a,b)=>a.year-b.year);
  return list;
}
const EL_RANDOM=[['지',22],['수',22],['화',22],['풍',22],['공',7],['허',.35],['double',4],['triple',.3],['avg',.04]];
function newLife(P,seed){
  rng=mulberry32(seed);
  const calc=planCalc(P);
  const root=P.origin==='root';
  const g=chance(.5)?'m':'f';
  S={seed,plan:JSON.parse(JSON.stringify(P)),gender:g,age:0,alive:true,finished:false,events:[],rar:[],fate:[],
    health:clamp(Math.round(72+gauss()*11),25,100),mental:clamp(Math.round(62+gauss()*14),15,100),luck:ri(1,100),
    wealth:0,edu:'none',job:null,married:false,kids:0,parents:2,retired:false,mil:false,leBonus:0,
    origin:P.origin,race:P.race||'human',birth:'plain',famType:'평범한 가정',crestGen:0,heir:false,
    circuits:0,qual:'E',els:[],originWord:root?'근원':pick(ORIGINS),originKnown:root,eye:null,eyesKnown:false,
    aware:false,wiped:false,mage:false,teacher:null,church:false,burial:false,academy:null,faction:null,curRank:0,rankBonus:P.rankUp?1:0,noRank:calc.noRank,
    depts:P.depts.slice(),details:P.details.slice(),abil:P.abil.slice(),freeAbil:[],items:[],itemAt:[],fb:P.fb.slice(),
    ap:calc.ap,apostle:false,apostleAge:0,ancestor:false,sealed:false,fugitive:false,sealDone:false,root:false,
    warCount:0,grailWin:false,servant:null,seals:0,jexp:0,used:{},lastResearch:0,pending:null,deadEnd:null,deadText:'',fortnia:false,
    aiCount:0,img:'birth_plain',color:null,done:[],halfAwake:false,sensed:false};
  // 나라와 도시
  const place=P.place?byId(PLACES,P.place):null;
  let country=place?COUNTRIES.find(c=>c.n===place.c):pickCountryFor(P);
  if(!country){country=wpick(COUNTRIES,x=>x.w);addRar(country.n+'에서 태어남',country.w/W_TOTAL);}
  S.country=country;
  if(place&&place.city)S.city=place.city;
  else if(country.n==='일본'&&!place){
    const r=R();
    S.city=r<1/800?'후유키 시':r<1/800+1/1000?'미사키 마을':r<1/800+1/1000+1/900?'미후네 시':pick(country.cities);
    if(S.city!==country.cities.find(x=>x===S.city))addRar(S.city+'에서 태어남',1/900);
  } else S.city=!place&&!P.birth&&chance(clamp((80-country.le)/40,.1,.6))?'시골 마을':pick(country.cities);
  S.name=makeName(country.nm,g);
  // 출생
  let birth=P.birth;
  if(!birth){
    let mr=country.uk?1/6000:country.eu?1/20000:country.n==='일본'?1/50000:country.n==='이집트'?1/60000:country.n==='미국'?1/80000:1/400000;
    if(S.city==='후유키 시')mr*=40;
    if(chance(mr)){const r=R();birth=r<.05?'lord':r<.25?'noble':'magus';addRar('마술사 가문에 태어남',mr);}
    else if(country.cath&&chance(1/30000)){birth='church';addRar('교회에서 자람',1/30000);}
    else birth='plain';
  }
  S.birth=birth;
  S.famType=byId(CY_BIRTH,birth).n;
  S.crestGen={plain:0,magus:ri(3,7),noble:ri(12,20),lord:ri(28,40),church:0,user:ri(1,3)}[birth];
  S.heir=['magus','noble','lord'].includes(birth)&&(P.birth?true:chance(.6));
  S.wealth=clamp(Math.round({plain:(country.le-50)*1.3,magus:55,noble:72,lord:86,church:30,user:62}[birth]+gauss()*12+(S.city==='시골 마을'?-10:0)),2,98);
  if(P.fb.includes('waste'))S.wealth=clamp(S.wealth-25,2,98);
  // 종족
  if(!P.race&&country.n==='일본'&&chance(1/150000)){S.race='half';addRar('인외의 피를 이은 혼혈',1/150000);}
  // 마술회로
  const magusFam=['magus','noble','lord','user'].includes(birth);
  if(P.talent){const t=byId(TALENTS,P.talent);S.circuits=ri(t.lo,t.hi);S.qual=t.q;}
  else if(magusFam||root||P.race&&P.race!=='human'){
    S.circuits=clamp(Math.round(30+gauss()*12)+(birth==='lord'?10:birth==='noble'?5:0),8,70);
    if(chance(1/40)){S.circuits=ri(60,100);addRar('천재적인 마술회로',1/40);}
    S.qual=wpick(QUAL,q=>({E:5,D:15,C:40,B:30,A:10})[q]);
  } else {
    const r=R();
    if(r<.9)S.circuits=ri(0,2);
    else if(r<.995)S.circuits=ri(3,15);
    else{S.circuits=ri(16,45);addRar('일반인치고 많은 마술회로',.005);}
    S.qual=wpick(QUAL,q=>({E:40,D:30,C:20,B:8,A:2})[q]);
  }
  if(S.race==='dragon'||S.race==='true')S.circuits=Math.max(S.circuits,80);
  // 속성
  const els=planEls(P);
  if(els)S.els=els;
  else{
    const e=wpick(EL_RANDOM,x=>x[1])[0];
    const four=['지','수','화','풍'];
    if(e==='double')S.els=four.sort(()=>R()-.5).slice(0,2);
    else if(e==='triple')S.els=['지','수','화','풍','공'].sort(()=>R()-.5).slice(0,3);
    else if(e==='avg')S.els=['지','수','화','풍','공'];
    else S.els=[e];
    if(S.circuits>=3&&['허','triple','avg'].includes(e))addRar(e==='허'?'허수 속성':e==='avg'?'애버리지 원':'3중 속성',(EL_RANDOM.find(x=>x[0]===e)[1])/100);
  }
  // 마안
  if(P.eye){const e=byId(CY_EYE,P.eye);S.eye={id:e.id,n:e.n+' 마안',g:e.g};S.eyesKnown=true;}
  else{
    const er=magusFam?1/150:1/80000;
    if(chance(er)){const e=wpick(CY_EYE,x=>({noble:40,color:30,gold:20,jewel:8,rainbow:.05})[x.id]);S.eye={id:e.id,n:e.n+' 마안',g:e.g};addRar(e.n+' 마안',er);if(magusFam)S.eyesKnown=true;}
  }
  // 신분
  S.mage=magusFam||root||P.depts.length>0||['dragon','true'].includes(S.race);
  S.church=birth==='church';
  if(S.church&&!S.depts.includes('eighth'))S.depts.push('eighth');
  S.aware=S.mage||S.church||S.race!=='human'&&S.race!=='half';
  if(S.mage)S.teacher=magusFam?'가문':root?'근원':'독학';
  // 예장은 인생 도중에 손에 들어온다
  S.itemAt=P.items.map(id=>({id,age:ri(14,40)}));
  // 시기
  S.birthYear=lifeBirthYear(P);S.year=S.birthYear;
  S.sched=scheduleJourneys(P,S.birthYear);
  S.lastJY=S.sched.length?S.sched[S.sched.length-1].year:0;
  S.long=['vamp','true','dragon'].includes(S.race);
  if(S.long)S.endYear=Math.max(S.lastJY,S.birthYear+40)+ri(30,140);
  if(S.race==='homun')S.lifespan=Math.max(ri(28,42),S.lastJY-S.birthYear+2);
  if(S.sched.some(j=>['hgw4','hgw5'].includes(j.id))&&country.n==='일본'&&!place)S.city='후유키 시';
  // 첫 기록
  const where=S.city==='시골 마을'?country.n+'의 시골 마을':country.n+' '+S.city;
  if(root)log(`근원에서 빠져나와 새 몸으로 태어났다. ${where}, ${g==='m'?'남자':'여자'}아이. 이름은 ${S.name}.`,'moon',true);
  else log(`${where}에서 ${g==='m'?'남자':'여자'}아이로 태어났다. 이름은 ${S.name}.`,'life',true);
  log({plain:pick(['평범한 가정이다. 부모는 아이에게 마술이라는 말을 들려줄 일이 없을 것이다.','작고 시끄러운 집이다. 달빛 세계와는 아무 관계가 없다.','평범한 부모, 평범한 첫울음. 이 세상 대부분의 아이가 그렇듯이.']),
    magus:`${S.crestGen}대째 이어진 마술사 가문. 집 지하에는 공방이 있다.`,
    noble:`${S.crestGen}대를 이어 온 시계탑의 귀족 가문. 아이가 태어난 날, 가문 문장이 새로 걸렸다.`,
    lord:'시계탑 한 학과를 다스리는 로드의 가문. 천 년의 무게가 요람 위에 내려앉았다.',
    church:'교회의 고아원에서 자랐다. 신부들은 아이의 손에 일찍 흑건을 쥐여 줄 것이다.',
    user:'과학과 마술을 함께 쓰는 집안. 근원보다는 쓸모를 좇는 사람들이다.'}[birth],birth==='plain'?'life':'moon');
  const rl={vamp:'심장은 뛰지만 몸은 늙지 않는다. 피의 맛을 알게 되는 건 시간문제다.',homun:'만들어진 몸. 정해진 수명이 몸 안에서 째깍거린다.',half:'핏속에 사람이 아닌 것이 섞여 있다는 사실은 아직 아무도 말해 주지 않았다.',dragon:'숨을 쉴 때마다 마력이 넘친다. 이 몸은 용의 것이다.',true:'별이 빚은 흡혈종, 진조로 깨어났다.'}[S.race];
  if(rl)log(rl,'moon');
  if(S.eye&&!S.eyesKnown)log('이 아이의 눈에는 남들과 다른 것이 비친다. 하지만 그게 이상한 일이라는 걸 아직 모른다.','moon');
  if(S.sched.length)log(`정해 둔 행적: ${S.sched.map(j=>CY_JRMAP[j.id].n+'('+j.year+')').join(', ')}. 태어나는 순간 잊어버렸다.`,'moon');
  scene({plain:'birth_plain',magus:'birth_magus',noble:'birth_noble',lord:'birth_noble',church:'birth_church',user:'birth_magus'}[birth]);
  if(['vamp','true','dragon','homun'].includes(S.race))scene('birth_inhuman');
}

/* ---------------- 한 해 ---------------- */
function step(){
  S.age++;S.year++;
  if(!S.long&&!S.apostle){
    if(S.age>45)S.health-=R()*(S.age>75?2.6:S.age>60?1.6:.9);
    if(S.age>18&&S.age<45)S.health+=R()*.6;
  } else S.health=Math.max(S.health,80);
  S.health=clamp(S.health,1,100);S.mental=clamp(S.mental,1,100);S.wealth=clamp(S.wealth,0,100);
  worldNews();
  lifeStage();
  if(!S.alive)return;
  S.itemAt.forEach(x=>{if(x.age===S.age&&!S.items.includes(x.id)){S.items.push(x.id);log(`마술예장 「${byId(CY_ITEMS,x.id).n}」을(를) 손에 넣었다.`,'joy');}});
  const j=S.sched.find(x=>x.year===S.year&&x.st==='plan');
  if(j){runJourney(j);return;}
  if(S.apostle){apostleYear();if(!S.alive||S.pending)return;}
  promote();
  if(!opportunity())flavor();
  if(S.pending||!S.alive)return;
  if(chance(.42))mundane();
  lifeDeath();
}
function die(cause,text,cat){
  if(!S.alive)return;
  S.alive=false;S.cause=cause;S.deathAge=S.age;
  log(text||`${cause}(으)로 세상을 떠났다.`,cat||'death',true);
}
function lifeDeath(){
  if(!S.alive||S.year<=S.lastJY)return;
  if(S.long){
    if(S.year>=S.endYear){S.alive=false;S.deathAge=S.age;S.cause='여정의 끝';log('긴 세월이 흘렀다. 이 세상에서 해야 할 일은 모두 끝났다.','death',true);}
    return;
  }
  if(S.race==='homun'&&S.age>=S.lifespan){die('수명','만들어진 몸이 수명을 다했다. 조용히 눈을 감았다.');return;}
  const L=S.country.le+S.leBonus+(S.wealth-50)*.08;
  const b=.085,A=Math.LN2*b/(Math.exp(b*(L+4))-1);
  let h=A*Math.exp(b*S.age);
  const imr=clamp((82-S.country.le)*.004,.002,.12);
  if(S.age===1)h+=imr;else if(S.age<=5)h+=imr*.15;
  h*=1+Math.max(0,55-S.health)/30;
  if(chance(Math.min(.9,h))){
    let cause;
    if(S.age<=5)cause=pick(S.country.le<70?['감염병','영양실조','폐렴']:['선천적인 병','갑작스러운 열병','사고']);
    else if(S.age<40)cause=pick(['교통사고','감염병','사고','갑작스러운 병']);
    else if(S.age<70)cause=pick(['심장질환','암','뇌졸중','교통사고','간질환']);
    else cause=pick(['노환','폐렴','심부전','암','노환']);
    die(cause,{노환:'가족이 지켜보는 가운데 조용히 눈을 감았다. 노환이었다.',폐렴:'겨울을 넘기지 못했다. 폐렴이었다.'}[cause]);
  }
}
function worldNews(){
  const y=S.year,a=S.age;
  if(y===1969&&a>=6&&chance(.6))log('텔레비전에서 인류가 달에 내리는 장면을 보았다. 그날 밤 달이 유난히 가까워 보였다.');
  if(y===1989&&S.country.eu&&a>=8&&chance(.5))log('베를린 장벽이 무너졌다는 소식을 들었다.');
  if(y===2000&&a>=6&&chance(.5))log('새천년을 맞았다. 세상은 끝나지 않았다.');
  if(y===2020&&a>=1){
    log('세계적인 감염병이 돌았다. 한동안 집 밖에 거의 나가지 못했다.','risk');
    if(!S.long&&!S.apostle&&a>70&&S.year>S.lastJY&&chance(.02))die('감염병','감염병을 이겨 내지 못했다.');
  }
}
function eduP(){return clamp((S.country.le-45)/35,.15,.98);}
const JOBS={
  none:['농부','어부','공사장 노동자','시장 상인','운전사','공장 노동자','가사 도우미','목수'],
  primary:['농부','공장 노동자','시장 상인','운전사','재봉사','목수','건설 노동자'],
  secondary:['사무원','판매원','요리사','정비공','경찰관','간호조무사','미용사','군인','택배 기사'],
  univ:['교사','엔지니어','회사원','의사','변호사','연구원','공무원','기자','건축가','디자이너','약사']
};
function lifeStage(){
  const a=S.age;
  if(S.apostle&&a-S.apostleAge>0)return;
  if(a===7){
    if(S.church||S.mage&&S.birth!=='plain'){S.edu='primary';}
    else if(chance(eduP())){S.edu='primary';log(pick(['초등학교에 입학했다.','학교에 다니기 시작했다. 가방이 몸보다 컸다.']));}
    else log('학교 대신 집안일과 바깥일을 도왔다.');
  }
  if(a===13&&S.edu==='primary'){
    if(chance(eduP()*.9+(S.wealth-50)/200)){S.edu='secondary';if(!S.mage)log('중학교에 진학했다.');}
    else log('학교를 그만두고 일을 시작했다.');
  }
  if(S.country.n==='한국'&&S.gender==='m'&&a===20&&!S.mil&&!S.mage){S.mil=true;log('병역 의무로 입대했다. 달이 밝은 초소 근무가 기억에 남았다.');}
  if(!S.job&&!S.mage&&!S.church&&a>=(S.edu==='univ'?23:S.edu==='secondary'?19:15)&&a<=30&&chance(.6)){
    S.job=pick(JOBS[S.edu]);S.wealth+={none:-6,primary:-3,secondary:3,univ:10}[S.edu]+ri(-3,6);
    log(`${S.job}(으)로 일하기 시작했다.`);
  }
  if(!S.married&&a>=22&&a<=50&&chance(a<35?.1:.035)){
    S.married=true;log(S.mage&&S.heir?'가문을 잇기 위해 다른 마술사 가문과 혼인했다.':pick(['결혼했다.','오래 사귄 사람과 결혼했다.','늦은 밤 고백을 받고, 이듬해 결혼했다.']),'joy');
  }
  if(S.married&&a<=43&&S.kids<5&&chance(S.kids===0?.22:.12)){S.kids++;log(S.kids===1?'첫아이가 태어났다.':`${S.kids}째 아이가 태어났다.`,'joy');}
  if(S.parents>0&&a>=30&&chance(.035+(a>50?.04:0))){S.parents--;log(S.parents===1?pick(['아버지가 세상을 떠났다.','어머니가 세상을 떠났다.']):'남은 부모님마저 세상을 떠났다.');S.mental-=6;}
  if(S.job&&!S.retired&&a>=60&&chance(.2)){S.retired=true;log('일을 그만두고 은퇴했다.');}
}
const MUNDANE=[
  {w:s=>s.age<7?3:0,run:()=>log(pick(['첫걸음을 뗐다.','처음 한 말은 "엄마"였다.','높은 열이 났다가 겨우 나았다.','밤하늘의 달을 오래 올려다보곤 했다.','처음으로 그림책을 끝까지 읽었다.']))},
  {w:s=>s.age>=7&&s.age<13?3:0,run:()=>log(pick(['단짝 친구가 생겼다.','글짓기 대회에서 상을 받았다.','나무에서 떨어져 팔이 부러졌다.','여름방학 내내 곤충을 모았다.','이사를 가서 전학했다.']))},
  {w:s=>s.age>=13&&s.age<20?3:0,run:()=>log(pick(['첫사랑을 했다.','시험을 망쳐 크게 혼났다.','밴드를 만들었다가 석 달 만에 해체했다.','친구와 밤새 미래 이야기를 했다.','운동부에서 주전이 되었다.','처음으로 아르바이트를 했다.']))},
  {w:s=>s.age>=20&&s.age<60?4:0,run:()=>{
    const e=pick([['승진했다.','joy',5],['직장을 옮겼다.','life',2],['일자리를 잃었다.','risk',-10],['새로운 동네로 이사했다.','life',0],['오래 꿈꾸던 긴 여행을 떠났다.','joy',-3],['고양이를 키우기 시작했다.','joy',0],['큰 빚을 졌다.','risk',-15],['투자로 꽤 큰돈을 벌었다.','joy',14],['취미로 시작한 요리에 빠졌다.','life',0],['복권 4등에 당첨됐다.','joy',3]]);
    if(S.mage&&e[0].includes('직장'))return;
    S.wealth+=e[2];log(e[0],e[1]);}},
  {w:s=>s.age>=30?2:0,run:()=>{S.health-=ri(8,20);log(pick(['큰 병에 걸렸지만 치료를 받고 회복했다.','수술을 받았다.','오랫동안 앓아누웠다.','사고로 크게 다쳤다.']),'risk');}},
  {w:s=>s.age>=55?3:0,run:()=>{if(S.kids&&chance(.5)){log('손주가 태어났다.','joy');return;}log(pick(['정원을 가꾸는 재미에 빠졌다.','오랜 친구의 장례식에 다녀왔다.','고향을 다시 찾아갔다.','젊은 시절 사진을 오래 들여다보았다.']));}}
];
function mundane(){const e=wpick(MUNDANE,x=>x.w(S));if(e.w(S)>0)e.run();}

/* ---------------- 계위 승진과 일상의 신비 ---------------- */
function promote(){
  if(S.noRank||!S.academy)return;
  const t=rankTarget();
  if(S.curRank===0&&t>=1){S.curRank=1;log(`계위 「${RANK_FULL[1]}」을(를) 받았다.`,'moon');return;}
  if(S.curRank<t&&S.age>=19&&(chance(.16)||S.age>=50)){
    S.curRank++;fate(S.curRank>=5?2:1,`계위 「${RANK_FULL[S.curRank]}」`);
    log(`계위가 「${RANK_FULL[S.curRank]}」(으)로 올랐다.`,S.curRank>=5?'joy':'moon',S.curRank>=5);
    if(S.curRank===7)major({kind:'gold',img:'clocktower',eyebrow:'시계탑',title:'그랜드(관위)',body:'시계탑의 긴 역사에서도 손에 꼽는 전설의 계위에 올랐다.'});
  }
}
function flavor(){
  const a=S.age;
  if(a===4&&S.mage&&S.birth!=='plain')log({magus:'마술 수련이 시작됐다. 몸 안의 회로를 여는 감각을 배웠다.',noble:'가정교사들이 붙었다. 하루의 절반은 마술, 나머지는 예법이었다.',lord:'로드의 후계자로서 교육이 시작됐다. 실수는 허락되지 않았다.',user:'첫 장난감은 마력을 재는 기계였다.'}[S.birth]||'마술 수련이 시작됐다.','moon');
  if(a===5&&S.church)log('성경 대신 흑건을 쥐는 법부터 배웠다.','moon');
  if(a===9&&S.heir){S.health-=6;log(S.fb.includes('last')?'마술각인을 이식받았다. 이것을 물려줄 다음 대는 없다. 당신이 마지막 후계자다.':`${S.crestGen}대의 마술각인을 이식받았다. 몇 주 동안 열이 내리지 않았다.`,'moon',true);}
  if(a===8&&S.mage&&S.birth==='plain'&&S.teacher==='독학'&&S.depts.length)log('어느 날 몸 안에서 뜨거운 것이 흘렀다. 떠돌이 마술사가 그걸 알아보고 제자로 삼았다.','moon',true);
  if(S.noRank&&a===24&&S.mage)log('실력은 충분했지만 어떤 자리도 얻지 못했다. 집에 틀어박혀 연구를 이어 갔다.','moon');
  if(a>=12&&S.abil.length&&chance(.12))log(`「${byId(CY_ABIL,pick(S.abil)).n}」을(를) ${pick(['처음으로 제대로 써 보았다','밤새 갈고닦았다','실전에서 썼다','몰래 시험해 보았다'])}.`,'moon');
  if(S.fb.length&&a>=10&&chance(.06)){
    const f=pick(S.fb);
    const t={legs:'휠체어 바퀴가 또 계단 앞에서 멈췄다.',dark:'어둠 속에서 소리로 세상을 그렸다.',small:'마나가 모자라 술식이 중간에 꺼졌다.',careless:'상대를 얕보다 큰코다칠 뻔했다.',numb:'남들이 우는 장면에서 우는 연기를 했다.',pacifist:'싸움을 피하려고 먼 길을 돌아갔다.',worldly:'근원보다 좋은 혼처와 명예가 먼저 눈에 들어왔다.',depend:'스승의 연락이 끊기자 불안해서 잠을 못 잤다.',home:'오늘도 집 밖에 나가지 않았다.',headache:'두통이 찾아왔다. 하루 종일 날이 서 있었다.',crimson:'피가 끓어올라 잠시 기억이 끊겼다.',waste:'또 쓸데없는 골동품을 샀다. 빚 독촉장이 쌓였다.',dual:'카드를 미리 만들어 두지 않아 손을 쓰지 못했다.',last:'친척들이 후계자 이야기를 꺼낼 때마다 숨이 막혔다.',knight:'모르는 사람을 돕다가 일에 휘말렸다.',kmagic:'마술이 쓸데없이 화려해서 또 협회의 경고를 받았다.',wrongorigin:'마술을 쓴 뒤 피를 토했다.',redshadow:'뒤돌아보면 붉은 그림자가 서 있다. 오늘은 조금 가까워졌다.'}[f];
    log(t,f==='wrongorigin'||f==='crimson'?'risk':'life');if(f==='waste')S.wealth-=5;
  }
  if(S.mage&&a>=15&&chance(.2))log(pick(['새로운 술식을 완성했다. 논문은 동료들에게 무시당했다.','공방의 결계를 다시 짰다.','라이벌 마술사와 결투했다. 무승부였다.','오래된 마도서를 해독했다.','실패한 실험이 공방 절반을 날려 버렸다.','근원에 관한 가설을 하나 세웠다.']),'moon');
  if(S.church&&a>=16&&a<=55&&chance(.22))log(pick(['이단 마술사를 처단하는 임무에 나섰다.','사도의 권속을 정화했다.','성유물을 회수했다.','마술협회와 신경전을 벌였다.']),'moon');
  if(S.church&&a>=18&&a<=55&&S.year>S.lastJY&&chance(S.burial?.02:.012))die('임무 중 전사',pick(['사도와 싸우다 쓰러졌다.','이단 마술사의 함정에 빠졌다.','임무에서 돌아오지 못했다. 동료들이 흑건 한 자루를 묻었다.']));
  if(S.mage&&a>=15&&S.year>S.lastJY&&chance(.003)){if(chance(.4))die('마술 실험 사고','통제를 잃은 술식이 공방째로 삼켰다.');else{S.health-=25;log('실험 사고로 마술회로 일부가 타 버렸다.','risk');}}
  if(S.race==='half'&&S.halfAwake&&a>=14&&chance(.05))log('피가 날뛰어 머리카락이 붉게 물들었다. 한동안 사람을 피했다.','risk');
}
function apostleYear(){
  S.health=100;
  if(chance(.45))log(pick(['이름과 얼굴을 바꾸고 다른 나라로 옮겼다.','오래된 성의 지하에서 한 해를 잠들었다.','피를 마셨다. 오늘 밤의 뉴스에 실종자가 한 명 늘었다.','흡혈충동을 억누르려 애썼다. 실패했다.','교회 대행자의 추적을 따돌렸다.','권속을 하나 만들었다.']),'moon');
  if(S.race==='human'&&S.year>S.lastJY&&chance(S.ancestor?.008:.03))die('매장기관',pick(['검은 법의를 입은 대행자가 찾아왔다. 흑건이 몸을 꿰뚫었고, 몸은 재가 되어 흩어졌다.','아침 해가 뜰 때까지 도망치지 못했다. 몸이 햇빛 속에서 재가 되었다.']));
}

/* ---------------- 기회 사건 ----------------
   w(): 무게(0이면 안 일어남, 100 이상이면 꼭 일어남), make(): 선택지 */
function opt(label,sub,fn,disabled){return {label,sub,fn,disabled};}
function chosen(){fate(1,'운명의 선택');}
function offerMentor(kind){
  const K=kind||wpick([['wander',40],['lecturer',S.age<=30?22:0],['oldman',14],['priest',S.country.cath?16:6],['puppeteer',4]],x=>x[1])[0];
  const M={
    wander:{img:'mentor',title:'떠돌이 마술사',body:'낡은 코트를 입은 마술사가 당신의 회로를 알아봤어요. "기억을 지우는 대신, 제자가 될 생각은 없나?"'},
    lecturer:{img:'clocktower',title:'검은 장발의 강사',body:'시계탑에서 온 찌푸린 얼굴의 강사가 한숨을 쉬어요. "재능은 평범하지만, 가르치는 보람은 있겠군. 시계탑으로 오겠나?"'},
    oldman:{img:'mentor_old',title:'벌레를 부리는 노인',body:'지팡이를 짚은 노인이 웃어요. 어둠 속에서 무언가가 꿈틀거려요. "빨리 강해지고 싶다면 이 몸이 가르쳐 주지. 대가는 조금 아플 뿐이야."'},
    priest:{img:'birth_church',title:'교회의 신부',body:'검은 법의를 입은 신부가 손을 내밀어요. "그 힘을 이단을 처단하는 데 쓰지 않겠나?"'},
    puppeteer:{img:'jr_city',title:'안경 쓴 붉은 머리의 인형사',body:'폐건물 2층, 안경을 쓴 여성이 담배를 끄며 말해요. "재밌는 걸 갖고 있네. 잠깐 내 공방 일을 도와볼래?"'}
  }[K];
  S.pending={eyebrow:'스승',img:M.img,title:M.title,body:M.body,options:[
    opt('제자가 된다','새로운 인생이 시작돼요',()=>{
      chosen();
      if(K==='priest'){becomeChurch();log('신부를 따라 교회에 들어갔다. 표면의 교회가 아니라 이단을 사냥하는 쪽이었다.','moon',true);return;}
      becomeMage({wander:'떠돌이 마술사',lecturer:'시계탑 강사',oldman:'벌레를 부리는 노인',puppeteer:'관위의 인형사'}[K]);
      if(K==='wander'){log('떠돌이 마술사의 제자가 되었다. 1대째 마술사의 길이다.','moon',true);const d=deptsForMe(1)[0];if(d)learnDept(d.id);}
      if(K==='lecturer'){log('강사를 따라 런던으로 건너갔다. 그는 무서울 만큼 정확하게 당신의 재능을 꿰뚫어 보았다.','moon',true);S.academy='시계탑';fate(2,'시계탑 입학');const d=deptsForMe(1)[0];if(d)learnDept(d.id);if(chance(.5))learnDept('modern');S.jexp+=.3;}
      if(K==='oldman'){log('노인의 지하실에서 수련이 시작됐다. 몸 안을 무언가가 기어 다녔다.','risk',true);S.health-=20;S.mental-=20;addAp(1);gainAbility('insect',true);S.circuits+=10;if(chance(.12)){die('벌레의 식사','어느 날 지하실에서 나오지 못했다. 노인은 다음 제자를 찾으러 나갔다.');}}
      if(K==='puppeteer'){log('인형사의 공방에서 일하며 마술을 배웠다. 그녀는 가르쳐 주는 법이 없었다. 훔쳐 배워야 했다.','moon',true);learnDept('create');if(chance(.4))learnDetail('puppeteer');}
    }),
    opt('거절한다','지금의 삶을 지켜요',()=>{
      if(K==='oldman'){log('노인의 제안을 거절했다. 등 뒤에서 벌레 소리가 오래 따라왔다.','risk');S.mental-=5;return;}
      if(!S.mage&&chance(.5)){S.wiped=true;S.aware=false;log('정중하게 거절했다. 다음 날 그 일을 기억하지 못했다.','moon');return;}
      log('제안을 거절했다. 언젠가 다른 기회가 올지도 모른다.','moon');S.used.mentor=0;
    }),
    opt('대가를 묻는다','조건을 들어 봐요',()=>{
      chosen();
      const cost={wander:'평생 신비를 숨기는 것',lecturer:'끝없는 과제와 논문',oldman:'당신의 몸',priest:'당신의 신앙',puppeteer:'공방의 잡일 전부'}[K];
      log(`"대가는 ${cost}이다." 스승이 될 사람이 말했다.`,'moon');
      S.pending=null;offerMentor(K);S.pending.options.pop();
    })
  ]};
}
function offerChurch(why){
  S.pending={eyebrow:'성당교회',img:'executor',title:'대행자의 권유',body:(why||'흑건을 든 수녀가 당신을 내려다봐요.')+' "주님의 칼이 되겠습니까? 아니면 오늘 밤을 잊겠습니까?"',options:[
    opt('대행자가 된다','이단과 사도를 사냥해요',()=>{chosen();becomeChurch();log('교회의 대행자가 되었다. 손에 처음 쥔 흑건은 생각보다 가벼웠다.','moon',true);}),
    opt('잊는다','평범한 삶으로 돌아가요',()=>{S.wiped=true;S.aware=false;log('수녀가 이마에 손을 얹었다. 그날 밤의 기억은 흐릿해졌다.','moon');}),
    opt('조건부로 협력한다','정보만 주고받아요',()=>{chosen();becomeAware();log('교회의 협력자가 되었다. 가끔 밤에 연락이 온다.','moon');if(S.circuits>=10&&chance(.3)){becomeChurch();}})
  ]};
}
const EVENTS=[
  {id:'path18',w:()=>S.age===18&&!S.mage&&!S.church&&S.edu==='secondary'?100:0,make:()=>({eyebrow:'열여덟',img:'birth_plain',title:'어른이 되는 해',body:'학교를 마칠 때가 됐어요. 어떤 길을 갈까요?',options:[
    opt('대학에 간다','공부를 이어 가요',()=>{if(chance(Math.pow(eduP(),2)*.8+(S.wealth-50)/150+.15)){S.edu='univ';S.wealth-=4;log(pick(['대학에 합격했다.','고향을 떠나 대학에 들어갔다.']),'joy');}else log('대학에 떨어졌다. 일을 하기로 했다.','risk');}),
    opt('바로 일을 시작한다','돈을 먼저 벌어요',()=>{S.job=pick(JOBS.secondary);S.wealth+=6;log(`${S.job}(으)로 일하기 시작했다.`);}),
    opt('세상을 보러 떠난다','어디로 갈지는 모르지만',()=>{chosen();log('배낭 하나를 메고 길을 떠났다.','joy');S.used.travel=0;S.wanderer=true;})
  ]})},
  {id:'witness',w:()=>S.aware||S.age<8||S.age>65?0:(S.city==='후유키 시'||S.city==='미사키 마을'||S.city==='미후네 시'?5:1.2),make:()=>({eyebrow:'목격',img:'witness',title:'자정의 골목',body:pick(['늦은 밤 골목에서 빛나는 마법진을 보았어요. 누군가 낮게 주문을 외우고 있어요.','공원에서 두 사람이 보이지 않는 무기로 싸우고 있어요. 칼날이 부딪힐 때마다 불꽃이 튀어요.','폐건물 옥상에 사람이 아닌 무언가가 서 있어요. 그것이 이쪽을 돌아봤어요.']),options:[
    opt('숨어서 지켜본다','들키지만 않으면',()=>{chosen();
      if(chance(.4+S.luck/400)){becomeAware();log('끝까지 들키지 않았다. 그날부터 밤이 다르게 보였다.','moon',true);}
      else if(S.circuits>=3){log('발밑의 결계를 밟았다. 마술사가 당신을 내려다봤다. "……회로가 있군."','moon',true);becomeAware();offerMentor();}
      else{S.wiped=true;log('누군가 뒤에서 어깨를 두드렸다. 다음 날 아무것도 기억나지 않았다.','moon');}}),
    opt('다가가 말을 건다','위험하지만 확실해요',()=>{chosen();
      const r=R();
      if(r<.14){die('신비의 은닉','목격자는 남기지 않는다. 그것이 마술사의 규칙이었다.');}
      else if(r<.5){S.wiped=true;log('마술사는 귀찮다는 듯 손가락을 튕겼다. 다음 날 아무것도 기억나지 않았다.','moon');}
      else{becomeAware();log('마술사가 흥미롭다는 눈으로 당신을 봤다.','moon',true);if(S.circuits>=3)offerMentor();else if(S.country.cath&&chance(.4))offerChurch('그 자리에 교회의 대행자가 나타났다.');}}),
    opt('못 본 척 돌아선다','아무 일도 없었어요',()=>{log('발걸음을 돌렸다. 가끔 그 밤이 꿈에 나온다.');S.mental-=3;})
  ]})},
  {id:'latent',w:()=>S.circuits>=3&&!S.mage&&!S.church&&S.age>=10&&S.age<=35?2:0,make:()=>({eyebrow:'잠든 회로',img:'latent',title:'몸 안을 흐르는 열',body:'가끔 등줄기를 타고 뜨거운 것이 흘러요. 손끝에서 작은 불꽃이 튄 적도 있어요. 이건 뭘까요?',options:[
    opt('정체를 파고든다','오컬트 책방부터',()=>{chosen();S.sensed=true;
      const r=R();
      if(r<.45){log('수상한 책방 주인이 당신을 오래 쳐다봤다.','moon',true);becomeAware();offerMentor();}
      else if(r<.8){becomeMage('독학');log('낡은 마도서를 손에 넣고 혼자 마술을 익혔다.','moon',true);const d=deptsForMe(1)[0];if(d)learnDept(d.id);}
      else{S.health-=25;becomeAware();log('제멋대로 회로를 열다가 쓰러졌다. 몸 안이 타는 것 같았다.','risk',true);}}),
    opt('병원에 간다','의학으로 설명할 수 있을지도',()=>{log('의사는 이상이 없다고 했다. 열은 가끔 계속됐다.');S.sensed=true;}),
    opt('잊고 산다','평범한 게 제일이에요',()=>{log('신경 쓰지 않기로 했다. 열은 조금씩 잦아들었다.');})
  ]})},
  {id:'mentor',w:()=>S.aware&&!S.mage&&!S.church&&S.age>=10&&S.age<=45?2.5:0,make:()=>{offerMentor();return S.pending;}},
  {id:'bitten',w:()=>S.apostle||S.long||S.age<12?0:(S.city==='미사키 마을'&&S.year>=1996&&S.year<=2001?6:.45),make:()=>({eyebrow:'습격',img:'apostle',title:'창백한 얼굴',body:'밤길에서 창백한 얼굴의 남자와 눈이 마주쳤어요. 붉은 눈이 웃어요. 목덜미에 차가운 손가락이 닿아요.',options:[
    opt('맞서 싸운다','가진 힘을 다해요',()=>{chosen();becomeAware();
      if(chance(odds(2.5))){log('온 힘을 다해 사도를 밀쳐 냈다. 그것은 아침 해를 피해 달아났다.','moon',true);fate(2,'사도를 물리침');}
      else if(chance(.5)){log('쓰러지기 직전, 흑건이 사도를 꿰뚫었다.','moon',true);offerChurch('흑건을 던진 수녀가 다가왔다.');}
      else die('사도의 습격','다음 날 아침, 뉴스는 이것을 "연쇄 엽기 살인"이라고 불렀다.');}),
    opt('피를 받아들인다','죽지 않는 몸이 될지도',()=>{chosen();
      const p=clamp(.06+S.circuits/180+(S.luck-50)/300+(S.race==='half'?.2:0),.04,.55);
      if(chance(p))becomeApostle('물린 뒤 죽지 않고 깨어났다. 햇빛이 아프다. 목이 마르다. 피가 마시고 싶다.');
      else die('사도의 습격','몸은 버티지 못했다. 당신은 사도의 「구울」이 되어 거리를 헤맸다.');}),
    opt('도망치며 기도한다','누군가 들어 주기를',()=>{becomeAware();
      const r=R();
      if(r<.5){log('골목 끝에서 검은 법의를 입은 사람이 나타났다.','moon',true);offerChurch('흑건이 사도를 벽에 꿰어 놓았다.');}
      else if(r<.8)log('정신을 차려 보니 병원이었다. 흰 옷의 수녀가 "운이 좋았네요"라고 말하고 사라졌다.','moon');
      else die('사도의 습격','달아나지 못했다.');})
  ]})},
  {id:'church',w:()=>S.aware&&!S.church&&!S.mage&&S.country.cath&&S.circuits>=5&&S.age>=12&&S.age<=30?1:0,make:()=>{offerChurch();return S.pending;}},
  {id:'eyes',w:()=>S.eye&&!S.eyesKnown&&S.age>=5&&S.age<=25?6:0,make:()=>({eyebrow:'마안',img:'eyes',title:'남들과 다른 눈',body:`보지 말아야 할 것이 보여요. 의사도 부모도 이해하지 못해요. 훗날 이것을 「${S.eye.n}」이라고 부른다는 걸 알게 돼요.`,options:[
    opt('숨기고 산다','아무도 모르게',()=>{S.eyesKnown=true;log('눈의 비밀을 숨기고 살기로 했다.','moon');}),
    opt('힘을 시험해 본다','어디까지 할 수 있을까',()=>{chosen();S.eyesKnown=true;becomeAware();
      if(['jewel','rainbow'].includes(S.eye.id)){S.health-=15;log('눈이 불타는 것 같았다. 세상이 다른 모습으로 보였다.','risk',true);}
      else log('시선 하나로 남을 움직일 수 있었다. 겁이 났다.','moon',true);
      if(chance(.5)){log('그 소문을 듣고 누군가 찾아왔다.','moon');S.circuits>=3?offerMentor():offerChurch('교회는 마안을 그냥 두지 않았다.');}}),
    opt('봉인구를 찾는다','안경 하나로 세상이 조용해진다면',()=>{S.eyesKnown=true;becomeAware();S.mental+=10;log('어느 노인이 준 안경을 쓰자 세상이 조용해졌다.','moon',true);})
  ]})},
  {id:'halfblood',w:()=>S.race==='half'&&!S.halfAwake&&S.age>=14&&S.age<=22?8:0,make:()=>({eyebrow:'핏줄',img:'halfblood',title:'깨어나는 피',body:'어느 밤, 핏속의 무언가가 깨어났어요. 머리카락이 붉게 물들고 손끝이 쇠처럼 단단해져요.',options:[
    opt('억누른다','사람으로 남아요',()=>{S.halfAwake=true;S.mental-=8;becomeAware();log('이를 악물고 피를 눌렀다. 머리카락은 다시 검어졌다.','moon',true);}),
    opt('받아들인다','이 힘도 나예요',()=>{chosen();S.halfAwake=true;becomeAware();
      if(chance(.22))die('반전 충동','인외의 피에 삼켜졌다. 가문의 어른이 조용히 일을 처리했다.');
      else{S.jexp+=.8;log('붉은 머리카락이 바람에 날렸다. 몸 안에서 짐승이 웃었다.','moon',true);fate(2,'혼혈의 각성');}}),
    opt('가문의 어른을 찾는다','이 피의 정체를 알아요',()=>{chosen();S.halfAwake=true;becomeAware();log('가문의 어른이 오래된 이야기를 들려주었다. 인간이 아닌 것과 피를 섞은 조상의 이야기를.','moon',true);if(chance(.5))gainAbility('mindeye',true);})
  ]})},
  {id:'clocktower',w:()=>S.mage&&!S.academy&&!S.noRank&&S.age>=16&&S.age<=24?(S.age>=17?6:2):0,make:()=>({eyebrow:'시계탑',img:'clocktower',title:'런던에서 온 편지',body:'마술협회 시계탑의 입학 안내장이 왔어요. 마술사의 길을 걷는다면 피할 수 없는 곳이에요.',options:[
    opt('실력으로 시험을 본다','자신 있어요',()=>{chosen();if(chance(odds(1))){enterClock('시험에 붙었다.');}else{log('시험에 떨어졌다. 다음 해를 노리기로 했다.','risk');S.used.clocktower=0;}}),
    opt('가문의 연줄을 쓴다','돈과 이름으로',()=>{if(S.wealth>=55||['noble','lord'].includes(S.birth)){S.wealth-=8;enterClock('가문의 이름으로 입학했다.');}else{log('내세울 연줄이 없었다. 혼자 연구를 이어 가기로 했다.','moon');}},S.wealth<55&&!['noble','lord'].includes(S.birth)),
    opt('가지 않는다','혼자 길을 찾아요',()=>{log('시계탑에는 가지 않고 혼자 연구를 이어 갔다.','moon');})
  ]})},
  {id:'research',repeat:true,w:()=>S.mage&&S.age>=18&&S.age<=70&&S.year-S.lastResearch>=3?(S.academy?3:1.5):0,make:()=>{
    S.lastResearch=S.year;
    const ds=deptsForMe(2),myDet=S.depts.flatMap(d=>byId(CY_DEPTS,d).det.map(x=>x[0])).filter(id=>!S.details.includes(id));
    const options=ds.map(d=>opt(`「${d.n}」을(를) 공부한다`,d.d,()=>{chosen();learnDept(d.id);}));
    if(myDet.length){const id=pick(myDet);options.push(opt(`「${CY_DET[id].n}」을(를) 파고든다`,CY_DET[id].d,()=>{chosen();if(chance(odds(1.5,.5)))learnDetail(id);else log('연구는 벽에 부딪혔다.','risk');}));}
    options.push(opt('새로운 능력을 개발한다','억지력의 눈길을 끌 수도 있어요',()=>{chosen();if(chance(.6))randomAbility(false);else{S.health-=10;log('실험이 실패해 몸을 다쳤다.','risk');}}));
    return {eyebrow:'연구',img:'research',title:'다음 연구 주제',body:'공방의 촛불 아래서 다음에 파고들 주제를 정해요.',options};
  }},
  {id:'faction',w:()=>S.academy==='시계탑'&&!S.faction&&S.age>=18?2:0,make:()=>({eyebrow:'시계탑 정치',img:'clocktower',title:'파벌의 권유',body:'시계탑은 세 파벌로 나뉘어 있어요. 어느 쪽에 설지 정해야 해요.',options:[
    opt('귀족주의파','혈통과 전통의 편',()=>{chosen();S.faction='귀족주의';S.rankBonus+=S.birth==='plain'?0:1;log('귀족주의파에 들어갔다.','moon');}),
    opt('민주주의파','재능 있는 신참의 편',()=>{chosen();S.faction='민주주의';S.jexp+=.3;S.wealth-=5;log('민주주의파에 들어갔다. 돈은 모자랐지만 동료가 생겼다.','moon');}),
    opt('중립주의파','어느 쪽도 아닌',()=>{S.faction='중립주의';log('중립을 지켰다. 아무도 당신을 신경 쓰지 않았다.','moon');})
  ]})},
  {id:'seal',w:()=>(S.abil.some(id=>!S.freeAbil.includes(id)&&(byId(CY_ABIL,id).o.ap||0)>0)||S.eye&&['jewel','rainbow'].includes(S.eye.id)||S.originKnown&&S.mage)&&S.mage&&!S.sealDone&&S.age>=25&&S.age<=60?.8:0,make:()=>{S.sealDone=true;return {eyebrow:'봉인지정',img:'sealing',title:'집행자가 온다',body:'비의재시국의 지표가 당신을 가리켰어요. 봉인지정은 보호 명령이라는 이름의 영구 보존이에요.',options:[
    opt('공방을 버리고 달아난다','계속 쫓기며 살아요',()=>{chosen();S.fugitive=true;log('공방을 불태우고 이름을 버린 채 달아났다.','risk',true);}),
    opt('집행자와 맞서 싸운다','이기면 자유, 지면 끝이에요',()=>{chosen();if(chance(odds(5))){S.fugitive=true;fate(2,'집행자를 물리침');log('집행자들을 물리쳤다. 그래도 협회의 추적은 끝나지 않는다.','risk',true);}else{S.deadEnd='봉인지정 집행자';S.deadText='집행자들을 이기지 못했다. 회로와 각인은 표본 병 속에 보존되었다.';die('봉인지정 집행자',S.deadText);}}),
    opt('봉인지정을 받아들인다','여기서 인생이 끝나요',()=>{S.sealed=true;S.alive=false;S.deathAge=S.age;S.cause='봉인지정';log('저항하지 않았다. 시계탑은 당신을 표본으로 영원히 보존했다.','death',true);})
  ]};}},
  {id:'grail',w:()=>{
    if(S.warCount||S.apostle)return 0;
    const war=S.year===1994?'hgw4':S.year===2004?'hgw5':null;
    if(war&&S.city==='후유키 시'&&S.age>=14&&S.age<=70&&S.circuits>=3&&!S.sched.some(j=>j.id===war))return chance(S.mage?.55:.12)?100:0;
    return 0;},make:()=>{
    const war=S.year===1994?'hgw4':'hgw5';
    return {eyebrow:'영주',img:'summon',title:'손등의 붉은 문양',body:`오른손 등에 세 획의 붉은 문양이 떠올랐어요. ${S.year===1994?'제4차':'제5차'} 성배전쟁의 영주예요. 만능의 소원기를 두고 일곱 마스터가 싸워요.`,options:[
      opt('서번트를 소환한다','성배전쟁에 참전해요',()=>{chosen();becomeAware();const j={id:war,year:S.year,st:'plan'};S.sched.push(j);runJourney(j);}),
      opt('교회에 영주를 맡긴다','싸우지 않아요',()=>{becomeAware();log('감독관이 있는 교회에 가서 영주를 맡겼다. 신부는 아쉽다는 듯 웃었다.','grail');})
    ]};}},
  {id:'fire',w:()=>S.year===1994&&S.city==='후유키 시'&&!S.warCount&&!S.apostle?100:0,make:()=>({eyebrow:'1994년 후유키',img:'grail_fire',title:'불타는 신도',body:'하늘에 뚫린 구멍에서 검은 진흙이 쏟아지고, 신도가 불타고 있어요.',options:[
    opt(S.age<=15?'부모님을 찾는다':'사람들을 구하러 간다','불길 속으로',()=>{chosen();
      if(chance(.12)){die('후유키 대화재','불길 속에서 빠져나오지 못했다. 후유키 대화재의 사망자 명단에 이름이 올랐다.');return;}
      if(S.age<=15){S.parents=0;log('모든 것을 잃었다. 쓰러진 아이를 낯선 남자가 안아 올리며 울었다. "살아 있어 줘서 고마워."','moon',true);
        if(chance(.5)){becomeMage('마법사라 자칭한 남자');log('남자는 "나는 마법사야"라고 말했다. 그에게서 마술을 배우기 시작했다.','moon');gainAbility('proj',true);}}
      else{log('두 사람을 끌어냈다. 팔에 남은 화상은 평생 갔다.','moon',true);S.health-=10;S.mental+=5;fate(2,'사람을 구함');}}),
    opt('도망친다','살아남는 게 먼저',()=>{log('불길을 등지고 달렸다. 그날의 비명은 오래 남았다.','risk');S.mental-=10;}),
    opt('하늘의 구멍을 올려다본다','저것은 무엇인가',()=>{chosen();becomeAware();S.mental-=15;log('하늘의 구멍을 똑바로 보았다. 그 너머에서 무언가가 이쪽을 보고 있었다.','moon',true);if(S.circuits>=3&&chance(.3))gainAbility('pureeye',true);})
  ]})},
  {id:'invite',repeat:true,w:()=>inviteList().length?(S.mage||S.church?2.5:1):0,make:()=>{
    const J=pick(inviteList());
    return {eyebrow:`${J.src} · 추천 ${RANK_FULL[J.rec]}`,img:JR_IMG[J.id]||'research',title:`초대: ${J.n}`,body:J.intro.split('.')[0]+'. 이 사건에 뛰어들까요?',options:[
      opt('뛰어든다','운명을 시험해요',()=>{chosen();const j={id:J.id,year:S.year,st:'plan'};S.sched.push(j);runJourney(j);}),
      opt('거절한다','이번에는 지나쳐요',()=>{S.done.push('skip:'+J.id);log(`「${J.n}」에 얽히지 않기로 했다.`,'moon');})
    ]};}},
  {id:'travel',w:()=>S.age>=19&&S.age<=50&&(S.wanderer?4:.6)&&!S.apostle?(S.wanderer?4:.6):0,make:()=>{
    S.wanderer=false;
    const dest=PLACES.filter(p=>p.id!=='japan'&&(S.city!==(p.city||'')&&!(p.c===S.country.n&&!p.city))).sort(()=>R()-.5).slice(0,3);
    return {eyebrow:'떠날 기회',img:'travel',title:'먼 곳에서 온 제안',body:'유학, 발령, 혹은 그냥 마음이 끌려서. 어딘가로 떠날 수 있어요.',options:[
      ...dest.map(p=>opt(`${p.n}(으)로 간다`,p.d,()=>{chosen();moveTo(p);})),
      opt('여기 남는다','익숙한 곳이 좋아요',()=>{log('떠나지 않기로 했다.');})
    ]};}},
  {id:'origin',w:()=>!S.originKnown&&S.age>=15&&(S.mage||S.aware)?.3:0,make:()=>({eyebrow:'기원',img:'end_root',title:'자신의 근원',body:`명상 중에 자신의 기원이 「${S.originWord}」이라는 걸 보았어요. 그 말이 당신을 끌어당겨요.`,options:[
    opt('기원을 받아들인다','힘을 얻지만 성격이 끌려가요',()=>{chosen();S.originKnown=true;S.mental-=8;randomAbility(true);log(`기원 「${S.originWord}」을(를) 받아들였다. 그날부터 조금씩 다른 사람이 되어 갔다.`,'moon',true);}),
    opt('외면한다','나는 나로 남아요',()=>{S.originKnown=true;log('기원을 외면했다. 가끔 그 말이 꿈에 나온다.','moon');})
  ]})},
  {id:'heir',w:()=>S.mage&&S.heir&&S.kids>0&&S.age>=45&&S.age<=65?2:0,make:()=>({eyebrow:'계승',img:'birth_magus',title:'마술각인을 물려줄 때',body:`${S.crestGen}대를 이어 온 각인을 아이에게 넘길 때가 됐어요. 각인을 넘기면 당신의 마술은 약해져요.`,options:[
    opt('아이에게 물려준다','가문은 이어져요',()=>{chosen();fate(2,'각인 계승');S.mental+=8;log(`아이에게 마술각인을 넘겼다. ${S.crestGen+1}대째가 시작된다.`,'moon',true);}),
    opt('아직 넘기지 않는다','근원은 내가 닿아요',()=>{log('각인을 넘기지 않았다. 아이는 원망하는 눈으로 당신을 보았다.','moon');S.used.heir=0;S.heirWait=(S.heirWait||0)+1;if(S.heirWait>2)S.used.heir=1;})
  ]})},
  {id:'root',w:()=>S.mage&&!S.root&&!S.rootTried&&S.curRank>=5&&S.age>=40?1.2:0,make:()=>({eyebrow:'근원',img:'end_root',title:'소용돌이로 가는 길',body:'수십 년의 연구 끝에, 근원으로 가는 길의 윤곽이 보여요. 억지력은 그 길을 걷는 자를 가만두지 않아요.',options:[
    opt('도전한다','모든 마술사의 비원',()=>{chosen();S.rootTried=true;
      if(chance(odds(8)*(S.ap>=5?.6:1))){S.root=true;S.alive=false;S.cause='근원 도달';S.deathAge=S.age;log('공방의 마법진이 빛을 삼켰다. 소용돌이 너머를 보았다. 그 뒤로 당신을 본 사람은 없다.','death',true);}
      else if(chance(.4)){S.deadEnd='근원 도전';S.deadText='억지력의 수호자가 나타났다. 붉은 외투의 그림자가 마지막으로 본 것이었다.';die('억지력의 수호자',S.deadText);}
      else{addAp(2);S.health-=20;log('문턱에서 튕겨 나왔다. 억지력의 눈길이 당신에게 머물렀다.','risk',true);}}),
    opt('아직은 때가 아니다','준비를 더 해요',()=>{S.used.root=0;S.rootWait=(S.rootWait||0)+1;if(S.rootWait>2)S.rootTried=true;log('길을 덮어 두었다.','moon');})
  ]})}
];
function enterClock(t){
  S.academy='시계탑';fate(2,'시계탑 입학');
  log(`런던의 시계탑에 입학했다. ${t}`,'moon',true);scene('clocktower');
  const ds=deptsForMe(3);
  S.pending={eyebrow:'시계탑',img:'clocktower',title:'소속 학과',body:'어느 학과에서 공부할지 골라요.',options:ds.map(d=>opt(d.n,d.d,()=>{learnDept(d.id,'학과에 배정되었다.');}))};
}
function moveTo(p){
  S.country=COUNTRIES.find(c=>c.n===p.c);S.city=p.city||pick(S.country.cities);
  log(`${p.n}(으)로 삶의 터전을 옮겼다.`,'joy',true);scene(p.id==='fuyuki'?'grail_war':p.id==='london'?'clocktower':p.id==='misaki'?'jr_misaki':p.id==='mifune'?'jr_city':'travel');
}
function inviteList(){
  if(!S.aware)return[];
  return CY_JR.filter(J=>{
    if(S.sched.some(j=>j.id===J.id&&!J.multi)||S.done.includes('skip:'+J.id))return false;
    if(J.last||J.req==='root')return false;
    if(J.year&&S.year!==J.year)return false;
    if(J.minYear&&S.year<J.minYear)return false;
    if(J.age&&(S.age<J.age[0]||S.age>J.age[1]))return false;
    if(!J.year&&!J.minYear&&!J.age&&!J.after)return false;
    if(J.after&&!S.done.includes(J.after))return false;
    if(J.req==='puppeteer'&&!S.details.includes('puppeteer'))return false;
    if(J.req==='create'&&!S.depts.includes('create'))return false;
    if(J.req==='arch'&&(!S.depts.includes('arch')||!S.done.includes('chaos')))return false;
    if(J.req==='vamp'&&!(S.race==='vamp'||S.apostle))return false;
    if(J.req==='aplow'&&S.ap>=5)return false;
    if(!S.mage&&!S.church&&J.rec>2)return false;
    if(S.age<15)return false;
    return S.curRank>=J.rec-2||!S.academy&&J.rec<=3;
  });
}
function opportunity(){
  const list=EVENTS.map(e=>({e,w:(S.used[e.id]&&!e.repeat)?0:e.w()})).filter(x=>x.w>0);
  const forced=list.filter(x=>x.w>=100);
  let x=null;
  if(forced.length)x=forced[0];
  else{
    const rate=.05+(S.aware?.035:0)+(S.mage||S.church?.03:0);
    if(!list.length||!chance(rate))return false;
    if(typeof aiReady==='function'&&aiReady()&&S.aiCount<aiMax()&&S.age>=8&&chance(.45)){S.aiCount++;S.pending={ai:true};return true;}
    x=wpick(list,y=>y.w);
  }
  S.used[x.e.id]=(S.used[x.e.id]||0)+1;
  const p=x.e.make();
  if(p&&p!==S.pending)S.pending=p;
  if(S.pending&&S.pending.img)scene(S.pending.img);
  return true;
}

/* ---------------- 행적 ---------------- */
function rollServant(boost){
  const cls=wpick(CLASSES,c=>c[1])[0];
  const sv=wpick(SERVANTS[cls],s=>({1:10,2:22,3:30,4:20,5:8})[s[1]]*(boost&&s[1]>=4?3:1));
  const tier=sv[1];
  const pr=()=>['E','E','D','C','B','A','A+'][clamp(tier+ri(-1,1),0,6)];
  return {cls,name:sv[0],tier,params:{근력:pr(),내구:pr(),민첩:pr(),마력:pr(),행운:pr(),보구:tier===5&&chance(.4)?'EX':pr()}};
}
function runJourney(j){
  const J=CY_JRMAP[j.id];
  log(`행적 「${J.n}」(${J.src})이(가) 시작됐다.`,J.war?'grail':'moon',true);
  scene(JR_IMG[J.id]||'research');
  let sv=null;
  if(J.war){
    sv=rollServant(S.wealth>=60||['lord','noble'].includes(S.birth));S.servant=sv;S.seals=3;S.warCount++;fate(2,'성배전쟁 참전');
    log(`오른손 등에 영주가 새겨졌다. 소환에 응한 것은 ${sv.cls}, 진명 「${sv.name}」. ${'★'.repeat(sv.tier)}${'☆'.repeat(5-sv.tier)}`,'grail',true);
    major({kind:'summon',sv,war:J.n,img:'summon'});
  }
  const pw=power()+(sv?(sv.tier-3)*.7:0)-(J.need==='concept'&&!hasConcept()?2:0);
  const gap=pw-J.rec;
  const hint=J.deadly===0?'':gap>=1?'당신에게는 쉬운 일이에요.':gap>=0?'해볼 만해요.':gap>=-1.5?'버거운 상대예요.':'추천 계위에 한참 못 미쳐요. 목숨이 걸렸어요.';
  S.pending={eyebrow:`${J.src} · 추천 ${RANK_FULL[J.rec]}`,img:JR_IMG[J.id]||'research',title:J.n,body:J.intro+(hint?' '+hint:''),tone:J.war?'summon':'',
    options:J.ch.map((c,i)=>opt(c[0],c[1],()=>resolveJourney(j,J,i,sv)))};
}
function resolveJourney(j,J,i,sv){
  const c=J.ch[i];
  log(c[2],J.war?'grail':'moon');
  let mod=(sv?(sv.tier-3)*.7:0)+c[3];
  if(J.need==='concept'&&!hasConcept())mod-=2;
  if(sv&&S.seals>0&&power()+mod<J.rec){S.seals--;mod+=.6;log(`영주 1획을 사용했다. "${pick(['이겨라','보구를 해방해','물러서지 마'])}!"`,'grail');}
  const p=J.deadly===0?1:odds(J.rec,mod);
  S.done.push(J.id);
  if(chance(p)){
    j.st='ok';S.jexp+=.3;S.mental+=4;fate(3,`행적 「${J.n}」`);
    log(J.win,'joy',true);
    if(sv){if(J.id!=='apoc'){S.grailWin=true;fate(4,'성배전쟁 승리');}S.servantSurvived=true;log(`${sv.name}이(가) 마지막으로 웃으며 사라졌다.`,'grail');S.servant=null;}
    giveReward(J);
  } else {
    const dp=clamp(.3+(J.rec-power()-mod)*.12,.08,.85)*(J.deadly===undefined?1:J.deadly);
    if(sv)S.servant=null;
    if(chance(dp)){j.st='dead';S.deadEnd=J.n;S.deadText=J.die;die(J.n,J.die);}
    else{j.st='fail';fate(1,`행적 「${J.n}」 생존`);S.health-=18;S.mental-=10;log(J.lose,'risk',true);if(J.r.t==='academy'&&!S.academy)S.academy='시계탑';}
  }
}
function giveReward(J){
  const r=J.r;
  if(r.t==='academy'){S.academy='시계탑';}
  else if(r.t==='cp'){S.wealth+=10*r.n;log('돈과 연줄이 늘었다.','joy');}
  else if(r.t==='kp'){
    const pool=S.depts.flatMap(d=>byId(CY_DEPTS,d).det.map(x=>x[0])).filter(id=>!S.details.includes(id));
    if(pool.length)learnDetail(pick(pool));else{const d=deptsForMe(1)[0];if(d)learnDept(d.id);else S.jexp+=.3;}
  }
  else if(r.t==='detail'){learnDetail(r.id);}
  else if(r.t==='item'){if(!S.items.includes(r.id)){S.items.push(r.id);log(`마술예장 「${byId(CY_ITEMS,r.id).n}」을(를) 받았다.`,'joy');}}
  else if(r.t==='ability'){randomAbility(true);}
  else if(r.t==='rank'){
    if(rankTarget()>=7){S.color=pick(COLORS);log(`관위를 넘어 「${S.color}」의 색(色) 칭호를 받았다.`,'joy',true);}
    else{S.rankBonus++;if(!S.academy)S.academy='시계탑';S.curRank=Math.max(S.curRank,rankTarget());log(`그 공으로 계위가 「${RANK_FULL[S.curRank]}」이(가) 되었다.`,'joy',true);}
  }
  else if(r.t==='ancestor'){S.ancestor=true;S.apostle=true;randomAbility(true);}
  else if(r.t==='fortnia'){S.fortnia=true;}
  else if(r.t==='pick'){
    const lab={kp:['새 세부 항목','배운 것을 깊게 파고들어요'],cp:['돈과 연줄','재산이 크게 늘어요'],ability:['능력 하나','억지력 없이 능력을 하나 얻어요']};
    S.pending={eyebrow:J.n+' · 보상',img:JR_IMG[J.id],title:'보상을 고르세요',body:'',options:r.o.map(k=>opt(lab[k][0],lab[k][1],()=>giveReward({r:k==='ability'?{t:'ability'}:{t:k,n:1}})))};
  }
}

/* ---------------- AI 사건 적용 ----------------
   AI가 만든 사건은 아래 효과만 쓸 수 있다(게임이 깨지지 않게). */
const AI_EFFECT_KEYS=['health','mental','wealth','ap','aware','mage','church','circuits','learn','detail','ability','rank','apostle','die','death','move'];
function applyEffects(e,ctx){
  if(!e||typeof e!=='object')return;
  const n=(v,lo,hi)=>clamp(Math.round(+v||0),lo,hi);
  if(e.health)S.health+=n(e.health,-40,30);
  if(e.mental)S.mental+=n(e.mental,-40,30);
  if(e.wealth)S.wealth+=n(e.wealth,-40,40);
  if(e.ap)addAp(n(e.ap,-2,3));
  if(e.circuits)S.circuits=Math.max(0,S.circuits+n(e.circuits,0,20));
  if(e.aware)becomeAware();
  if(e.mage)becomeMage(typeof e.mage==='string'?e.mage.slice(0,20):'AI가 만난 스승');
  if(e.church)becomeChurch();
  if(e.learn){const d=CY_DEPTS.find(x=>x.n===String(e.learn).replace(/과$/,'')||x.id===e.learn);if(d){becomeMage(S.teacher||'독학');learnDept(d.id);}}
  if(e.detail){const d=Object.values(CY_DET).find(x=>x.n===e.detail||x.id===e.detail);if(d)learnDetail(d.id);}
  if(e.ability){const a=CY_ABIL.find(x=>x.n===e.ability||x.id===e.ability);if(a&&a.id!=='solo')gainAbility(a.id,true);}
  if(e.rank&&S.academy){S.rankBonus++;}
  if(e.move){const p=PLACES.find(x=>x.n===e.move||x.id===e.move||x.city===e.move);if(p)moveTo(p);}
  if(e.apostle&&!S.apostle&&!S.long)becomeApostle('어둠 속에서 다시 눈을 떴다. 몸이 더 이상 늙지 않는다.');
  if(e.die&&S.year>S.lastJY&&!S.long)die(String(e.death||'운명').slice(0,20),ctx&&ctx.dieText||'그것이 마지막이었다.');
}

/* ---------------- 결말 ---------------- */
const LIFE_ENDINGS=ENDINGS.filter(e=>['normal','short','century','wiped','aware','eyes','executor','burial','master','grail','apostle','ancestor','sealed','root'].includes(e[0]));
const ENDING_FATE={normal:0,short:0,century:2,wiped:1,aware:2,eyes:2,executor:3,burial:5,master:3,grail:6,apostle:5,ancestor:8,sealed:3,root:12,cy_true1:4,cy_true2:8,cy_true3:6,cy_norm1:4,cy_norm2:4,cy_norm3:6,cy_beast1:10,cy_beast2:10,cy_beast3:10,cy_dead:1};
function lifeEndingKey(){
  if(S.deadEnd)return 'cy_dead';
  if(S.root)return 'root';
  if(S.apostle)return S.ancestor?'ancestor':'apostle';
  if(S.sealed)return 'sealed';
  if(S.mage)return null; // 최후의 선택으로
  if(S.church)return S.burial?'burial':'executor';
  if(S.grailWin)return 'grail';
  if(S.warCount)return 'master';
  if(S.eye&&S.eyesKnown)return 'eyes';
  if(S.aware)return 'aware';
  if(S.wiped)return 'wiped';
  if(S.deathAge<5)return 'short';
  if(S.deathAge>=100)return 'century';
  return 'normal';
}
function endOptions(){
  const ap=S.ap,grand=S.curRank>=7||rankTarget()>=7&&S.academy;
  const apAbil=S.abil.some(id=>!S.freeAbil.includes(id)&&(byId(CY_ABIL,id).o.ap||0)>0)||(S.eye&&(byId(CY_EYE,S.eye.id).ap||0)>0);
  return [
    {id:'cy_true1',g:'True End',ok:ap<5,cond:'억지력 5 미만'},
    {id:'cy_true2',g:'True End',ok:ap<5&&grand,cond:'억지력 5 미만 · 그랜드(관위)'},
    {id:'cy_true3',g:'True End',ok:ap<5&&S.wealth>=80,cond:`억지력 5 미만 · 재산 80 이상 (지금 ${Math.round(S.wealth)})`},
    {id:'cy_norm1',g:'Normal End',ok:ap>=5,cond:'억지력 5 이상'},
    {id:'cy_norm2',g:'Normal End',ok:ap>=5&&(apAbil||S.fugitive),cond:'억지력 5 이상 · 억지력을 얻는 능력이나 봉인지정'},
    {id:'cy_norm3',g:'Normal End',ok:ap>=5&&grand,cond:'억지력 5 이상 · 그랜드(관위)'},
    {id:'beast',g:'??? End',ok:ap>=10&&S.abil.includes('solo')&&!S.fb.includes('redshadow')&&S.fortnia,cond:'？？？'}
  ];
}
function endingInfo(key){return LIFE_ENDINGS.concat(CY_ENDINGS).find(e=>e[0]===key);}
function settleFate(key){
  const years=Math.floor(S.deathAge/10);
  if(years)fate(years,`${S.deathAge}년의 삶`);
  fate(ENDING_FATE[key]||0,'결말');
  const first=!PROFILE.endings[key];
  if(first)fate(5,'처음 본 결말');
  const total=S.fate.reduce((s,x)=>s+x.n,0);
  PROFILE.fate=Math.round((PROFILE.fate+total)*10)/10;
  PROFILE.totalFate=(PROFILE.totalFate||0)+total;
  PROFILE.lives++;
  PROFILE.endings[key]=(PROFILE.endings[key]||0)+1;
  PROFILE.history.unshift({name:S.name,c:S.country.n,y:S.birthYear,a:S.deathAge,k:key,f:total});
  PROFILE.history=PROFILE.history.slice(0,12);
  saveProfile();
  return {total,first};
}
function rarityOneIn(){let lg=0;S.rar.forEach(r=>lg+=Math.log10(r.p));return Math.pow(10,-lg);}
function fmtBig(n){
  if(!isFinite(n))return '∞';
  const units=[[1e16,'경'],[1e12,'조'],[1e8,'억'],[1e4,'만']];
  if(n>=1e20)return n.toExponential(1).replace('e+','×10^');
  for(const [v,u] of units)if(n>=v){const x=n/v;return (x>=100?Math.round(x):Math.round(x*10)/10).toLocaleString('ko-KR')+u;}
  return Math.max(1,Math.round(n)).toLocaleString('ko-KR');
}
