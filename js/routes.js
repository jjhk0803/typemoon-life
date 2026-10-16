'use strict';
/* =========================================================
   시대 루트: 신대·고대 / Fate/Zero / Fate/stay night / 칼데아
   신뢰도 대화(미연시 방식)와 업적
   ========================================================= */
const ERA_YEARS={zero:[1966,1972],sn:[1986,1988],fgo:[1993,1997]};
function yearLabel(y){return y<=0?'BC'+(1-y):String(y);}

/* ---------------- 신뢰도 ---------------- */
function charInfo(id){
  if(CHARS[id]||PARTNERS[id])return CHARS[id]||PARTNERS[id];
  if(String(id).startsWith('sv:')){const x=SERVANT_DB.find(v=>v.n===id.slice(3));if(x)return {n:x.n,s:`${x.c}의 서번트. ${x.t}. ${x.r} 출신, ${x.al}. 보구 「${x.np}」. ${x.p}`};}
  if(String(id).startsWith('m:')){const x=MAJOR.find(v=>v.n===id.slice(2));if(x)return {n:x.n.replace(/\(.*\)$/,''),s:x.s};}
  return {n:String(id).replace(/^(sv|m):/,''),s:''};
}
/* 주요 인물과의 만남(도감에 모인다) */
function meetMajor(name){PROFILE.met=PROFILE.met||{};if(!PROFILE.met[name]){PROFILE.met[name]=1;saveProfile();}}
function rival(tag){
  const pool=MAJOR.filter(m=>m.w===tag&&!(S.rivals||[]).includes(m.n));
  if(!pool.length)return null;
  const m=pick(pool);S.rivals=(S.rivals||[]).concat(m.n);meetMajor(m.n);
  return m.n.replace(/\(.*\)$/,'');
}
function stageTalker(def,i){return i===1&&S.servant&&!S.servant.past?'sv:'+S.servant.name:def;}
function bond(id){return S.bonds&&S.bonds[id]||0;}
function addBond(id,n){
  S.bonds=S.bonds||{};
  S.bonds[id]=clamp((S.bonds[id]||0)+n,0,100);
  PROFILE.bondMax=PROFILE.bondMax||{};
  if(S.bonds[id]>(PROFILE.bondMax[id]||0))PROFILE.bondMax[id]=S.bonds[id];
}
function meet(id){
  S.bonds=S.bonds||{};
  if(S.bonds[id]==null){const carry=Math.floor(((PROFILE.bondMax||{})[id]||0)*.3);S.bonds[id]=carry;if(carry>=5)log(`${charInfo(id).n}을(를) 처음 만났는데, 어딘가 낯익었다.`,'moon');}
}
const GENERIC_SC=[
  ['특이점의 밤. {n}이(가) 모닥불 곁에 앉아 있어요.','"이 싸움이 끝나면, 당신은 무엇을 하고 싶나요?"',[['미래의 꿈을 이야기한다','{n}이(가) 조용히 웃었다.',10],['지금 싸움에 집중하자고 한다','"그렇군요. 믿음직하네요."',6],['{n}의 지난 이야기를 묻는다','{n}은(는) 오래된 이야기를 들려주었다.',12]]],
  ['폐허 사이로 바람이 불어요. {n}이(가) 먼 곳을 보고 있어요.','"여기까지 와 줘서 고마워요. 솔직히 혼자였다면 무서웠을 거예요."',[['곁에 서서 같은 곳을 본다','{n}이(가) 어깨의 힘을 조금 뺐다.',10],['함께라서 다행이라고 말한다','"……네. 저도요."',12],['다음 작전을 이야기한다','"좋아요. 해 봐요."',5]]]
];
/* 대화: 끝나면 next()를 부른다 */
function talk(id,ctx,next){
  meet(id);
  const c=charInfo(id),pool=(CHARS[id]&&CHARS[id].sc)||GENERIC_SC;
  S.talkUsed=S.talkUsed||{};
  const used=S.talkUsed[id]||[];
  let i=pool.findIndex((x,k)=>!used.includes(k));if(i<0)i=ri(0,pool.length-1);
  S.talkUsed[id]=used.concat(i);
  const sc=pool[i],f=t=>String(t).replace(/\{n\}/g,c.n);
  S.pending={talk:true,char:id,ctx,ai:typeof aiReady==='function'&&aiReady(),next,img:CHARS[id]?CHARS[id].img:null,
    scene:{situation:f(sc[0]),line:f(sc[1]),choices:sc[2].map(x=>({text:f(x[0]),reply:f(x[1]),bond:x[2]}))}};
}
function talkChoose(p,choice){
  const n=clamp(Math.round(+choice.bond||0),-10,15);
  addBond(p.char,n);
  S.aiTag=!!p.fromAi;
  log(`${charInfo(p.char).n}: ${choice.reply}`,'joy');
  S.aiTag=false;
  if(n>=8)fate(.5,'깊어진 신뢰');
  return n;
}

/* ---------------- 업적 ---------------- */
function unlock(id){
  const a=ACH_ALL.find(x=>x[0]===id);if(!a)return;
  S.achNow=S.achNow||[];if(S.achNow.includes(id))return;
  S.achNow.push(id);
  PROFILE.ach=PROFILE.ach||{};
  const first=!PROFILE.ach[id];
  PROFILE.ach[id]=(PROFILE.ach[id]||0)+1;saveProfile();
  if(first)fate(a[3],`업적 「${a[1]}」`);
  log(`업적 달성: 「${a[1]}」`,'joy',true);
}
function story(n,st){S.story=S.story||[];const e=S.story.find(x=>x.n===n);if(e)e.st=st;else S.story.push({n,st});}

/* ---------------- 시대별 출생 ---------------- */
const REGION_COUNTRY={greece:'이탈리아',mesopotamia:'이라크',celt:'영국',britain:'영국',japan:'일본',india:'인도',norse:'핀란드',china:'중국',egypt:'이집트',persia:'이란',rome:'이탈리아'};
function eraSetup(P){
  S.era=P.era||'modern';
  S.bonds={};S.story=[];S.achNow=[];
  if(P.era!=='ancient'){
    let cand=WORLDS.filter(w=>!P.world||w.id===P.world);
    if(P.era==='sn'||P.era==='zero')cand=cand.filter(w=>['sn','fake'].includes(w.id));
    if(P.era==='fgo')cand=cand.filter(w=>w.id==='fgo');
    P.jr.forEach(id=>{const a=JR_WORLD[id];if(a){const c2=cand.filter(w=>a.includes(w.id));if(c2.length)cand=c2;}});
    if(!P.world&&!P.era){
      if(S.city==='미사키 마을'&&cand.some(w=>w.id==='tsuki'))cand=cand.filter(w=>w.id==='tsuki');
      if(S.city==='미후네 시')cand=cand.filter(w=>w.id==='kara').length?cand.filter(w=>w.id==='kara'):cand;
      if(!cand.length)cand=WORLDS;
    }
    S.world=wpick(cand.length?cand:WORLDS,w=>w.w).id;
    if(P.world||P.era)log(`이 인생의 세계선: ${byId(WORLDS,S.world).n}.`,'moon');
  }
  if(P.era==='sn'&&!P.place){S.country=COUNTRIES.find(c=>c.n==='일본');S.city='후유키 시';S.name=makeName('jp',S.gender);}
  if(P.era==='ancient')ancientInit(P);
  // 무작위 출생이라도 시기와 장소가 맞으면 그 이야기에 들어간다
  const snW=['sn','fake'].includes(S.world);
  if(S.era==='sn'||(S.era==='modern'&&snW&&S.birthYear>=1985&&S.birthYear<=1988&&S.city==='후유키 시'))S.route='sn';
  else if(S.era==='zero'||(S.era==='modern'&&snW&&S.birthYear>=1962&&S.birthYear<=1972&&S.mage&&chance(.4)))S.route='zero';
  else if(S.era==='fgo'||(S.era==='modern'&&S.world==='fgo'&&S.birthYear>=1990&&S.birthYear<=1997&&(S.mage||S.circuits>=3)&&chance(.5)))S.route='fgo';
  else S.route=null;
}

/* ---------------- 신대·고대 ---------------- */
function ancientInit(P){
  const reg=P.region?byId(REGIONS,P.region):pick(REGIONS);
  S.region=reg.id;S.reg=reg;
  S.birthYear=ri(reg.year[0],reg.year[1]);S.year=S.birthYear;
  S.country={n:reg.n,le:44,cities:[],nm:null,eu:false};
  S.city=pick(['왕도','변경의 마을','항구 도시','산기슭의 마을','신전 도시']);
  S.name=pick(S.gender==='m'?reg.m:reg.f);
  S.famType={plain:'평민',magus:'주술사의 가문',noble:'귀족',lord:'왕족',church:'사제의 가문',user:'대장장이의 가문'}[S.birth];
  S.crestGen=0;S.heir=false;
  S.aware=true;S.fame=S.birth==='lord'?15:S.birth==='noble'?8:0;S.deeds=[];S.np=null;S.king=false;S.fameMult=1;S.clsW={};S.monsterN=0;S.warN=0;
  S.sched=[];S.lastJY=0;S.items=[];S.itemAt=[];
  S.events.length=0;S.rar=[];
  if(S.race==='half')S.fame+=10;
  log(`${yearLabel(S.year)}년, ${reg.n}의 ${S.city}에서 ${S.gender==='m'?'남자':'여자'}아이로 태어났다. 이름은 ${S.name}. 아직 신비가 살아 숨 쉬는 시대다.`,'moon',true);
  log({plain:'평범한 농부의 집이다. 밤마다 할머니가 영웅들의 이야기를 들려주었다.',magus:'주술사의 집이다. 아이는 걷기도 전에 별의 이름을 배웠다.',noble:'이름 있는 귀족의 집이다.',lord:'왕의 피를 이은 아이. 태어난 날 신관이 길한 징조를 읽었다.',church:'신전을 지키는 사제의 집이다.',user:'대장장이의 집이다. 망치 소리를 자장가 삼아 자랐다.'}[S.birth],'life');
  if(S.race==='half')log(`어머니가 말하지 않은 비밀이 있었다. 이 아이의 아버지는 ${reg.god} 중 하나였다. 반신(半神)이다.`,'moon',true);
  scene(reg.id==='japan'?'era_japan':reg.id==='britain'?'era_britain':'era_ancient');
}
function clsAdd(o){Object.entries(o).forEach(([k,v])=>S.clsW[k]=(S.clsW[k]||0)+v);}
function addFame(n,deed){S.fame+=Math.round(n*(n>0?S.fameMult:1));if(deed){S.deeds.push(deed);fate(1,'영웅의 업적');}}
const NP_NAMES={greece:'신이 내린 청동의 창',mesopotamia:'신전에 바쳐진 점토판의 검',celt:'바다의 짐승 뼈로 만든 창',britain:'호수에서 건져 올린 검',japan:'신사에 봉납된 명검',india:'신궁 간디바를 닮은 활',norse:'난쟁이가 벼린 마검',china:'용을 새긴 방천화극',egypt:'태양의 원반',persia:'신의 화살',rome:'황금 독수리의 군기'};
const ANC_EVENTS=[
  {id:'a_mentor',w:()=>S.age>=8&&S.age<=20?3:0,make:()=>({eyebrow:'스승',img:'era_ancient',title:S.reg.mentor,body:`${S.reg.mentor}이(가) 당신의 눈을 오래 들여다봐요. "가르칠 만한 아이로구나."`,options:[
    opt('무예를 배운다','창과 활, 몸 쓰는 법',()=>{chosen();S.jexp+=.6;addFame(5);clsAdd({랜서:2,아처:2});log(`${S.reg.mentor} 밑에서 무예를 익혔다. 손바닥이 몇 번이고 찢어졌다.`,'moon',true);if(chance(.5))gainAbility(pick(['mindeye','fastcast']),true);}),
    opt('신비를 배운다','별과 신들의 언어',()=>{chosen();S.mage=true;if(S.circuits<10)S.circuits=ri(10,25);clsAdd({캐스터:3});const d=deptsForMe(1)[0];if(d)learnDept(d.id,'신대의 마술이다.');log('신대의 마술을 배웠다. 현대의 마술사가 들으면 기절할 만한 것들이었다.','moon',true);}),
    opt('거절한다','내 길은 내가 찾아요',()=>{log('스승의 손을 뿌리쳤다.');})]})},
  {id:'a_monster',repeat:true,w:()=>S.age>=15&&S.age<=55&&S.monsterN<3?2.5:0,make:()=>{const m=pick(S.reg.monster);return {eyebrow:'괴물',img:'hero_battle',title:m,body:`${m}이(가) 마을을 덮쳤어요. 사람들이 당신을 바라봐요.`,options:[
    opt('정면으로 맞선다','이기면 이름이 남아요',()=>{chosen();S.monsterN++;if(chance(odds(2.2+S.monsterN*.6))){addFame(18,m+' 퇴치');clsAdd({세이버:1,랜서:1,버서커:1});log(`${m}을(를) 쓰러뜨렸다. 사람들이 그 이름을 노래로 불렀다.`,'joy',true);}else if(chance(.5)){die('괴물과의 싸움',`${m}에게 쓰러졌다.`);}else{S.health-=25;log('간신히 살아남았다. 흉터가 평생 남았다.','risk',true);}}),
    opt('지혜로 꾀어낸다','함정과 속임수',()=>{chosen();S.monsterN++;if(chance(.35+S.luck/250)){addFame(12,m+'를 꾀어 물리침');clsAdd({어새신:2,캐스터:1});log(`꾀를 써서 ${m}을(를) 물리쳤다.`,'joy',true);}else{S.health-=15;log('꾀가 들통났다. 겨우 달아났다.','risk');}}),
    opt('다른 영웅을 기다린다','내 몫이 아니에요',()=>{S.fame-=3;log('다른 누군가가 괴물을 물리쳤다. 그 이름은 당신의 것이 아니었다.');})]};}},
  {id:'a_war',repeat:true,w:()=>S.age>=16&&S.age<=48&&S.warN<2?1.8:0,make:()=>({eyebrow:'전쟁',img:'hero_battle',title:S.reg.war,body:`${S.reg.war}이(가) 시작됐어요. 나라가 전사를 부르고 있어요.`,options:[
    opt('선봉에 선다','가장 위험하고 가장 빛나는 자리',()=>{chosen();S.warN++;if(chance(odds(2.8))){addFame(25,S.reg.war+'의 선봉');clsAdd({세이버:2,라이더:2});log('선봉에서 적진을 꿰뚫었다. 적들이 그 이름을 두려워하게 되었다.','joy',true);}else if(chance(.55))die(S.reg.war,'적진 한가운데서 쓰러졌다. 시신은 방패에 실려 돌아왔다.');else{S.health-=30;log('살아남았지만 다리를 절게 되었다.','risk',true);}}),
    opt('군사로 참여한다','머리로 싸워요',()=>{chosen();S.warN++;if(chance(odds(2))){addFame(12,S.reg.war+'의 책략');clsAdd({캐스터:2,라이더:1});log('책략으로 아군을 승리로 이끌었다.','joy',true);}else log('작전은 실패했지만 살아 돌아왔다.','risk');}),
    opt('참전하지 않는다','살아남는 것도 용기',()=>{S.fame-=5;S.leBonus+=2;log('전쟁에 나가지 않았다. 손가락질도 받았다.');})]})},
  {id:'a_oracle',w:()=>S.age>=10&&S.age<=25?2:0,make:()=>({eyebrow:'신탁',img:'era_ancient',title:'두 갈래의 운명',body:'신탁소의 무녀가 말해요. "짧고 찬란한 생인가, 길고 평온한 생인가. 둘 중 하나만 고를 수 있다."',options:[
    opt('짧고 찬란한 생','이름은 영원히 남아요',()=>{chosen();S.glory=true;S.fameMult=1.6;S.leBonus-=14;log('찬란한 운명을 골랐다. 무녀가 눈을 감았다.','moon',true);}),
    opt('길고 평온한 생','오래 사랑하며 살아요',()=>{S.fameMult=.6;S.leBonus+=14;log('평온한 운명을 골랐다.','moon');}),
    opt('신탁을 비웃는다','운명은 내가 정해요',()=>{chosen();S.health-=10;addFame(6);clsAdd({어벤저:1,버서커:1});log('신탁을 비웃었다. 그날 밤 이유 없는 열이 났다.','risk');})]})},
  {id:'a_treasure',w:()=>S.age>=16&&S.age<=50&&S.fame>=10&&!S.np?1.6:0,make:()=>{const t=NP_NAMES[S.region];return {eyebrow:'보물',img:'era_ancient',title:t,body:`전설 속의 「${t}」이(가) 잠든 곳을 알아냈어요. 시련을 넘은 자만이 손에 쥘 수 있대요.`,options:[
    opt('시련에 도전한다','손에 넣으면 훗날의 보구가 돼요',()=>{chosen();if(chance(odds(2.8))){S.np=t;addFame(12,t+' 획득');log(`「${t}」을(를) 손에 넣었다. 이것은 훗날 보구가 될 것이다.`,'joy',true);}else{S.health-=20;log('시련에 실패했다.','risk');}}),
    opt('신에게 돌려보낸다','욕심을 버려요',()=>{S.luck=Math.min(100,S.luck+12);log('보물을 신전에 바쳤다. 신들이 그것을 기억했다.','moon');})]};}},
  {id:'a_god',w:()=>S.age>=12?1:0,make:()=>({eyebrow:'신',img:'era_ancient',title:`${S.reg.god}의 시선`,body:`${S.reg.god}이(가) 당신을 내려다봐요. 시련이냐, 총애냐, 아니면 반역이냐.`,options:[
    opt('시련을 받아들인다','신의 시험',()=>{chosen();if(chance(odds(3.2))){addFame(20,'신의 시련 극복');log('신의 시련을 넘었다. 하늘에서 천둥이 축복처럼 울렸다.','joy',true);}else{S.health-=25;log('시련에 꺾였다. 신은 냉담했다.','risk',true);if(chance(.25))die('신의 저주','신의 저주가 끝내 몸을 갉아먹었다.');}}),
    opt('신을 거역한다','신에게 등을 돌려요',()=>{chosen();addFame(15,'신에게 맞섬');addAp(1);clsAdd({어벤저:2,버서커:1});log('신을 거역했다. 사람들은 두려워하면서도 그 이름을 입에 올렸다.','risk',true);}),
    opt('몸을 낮춘다','조용히 지나가요',()=>{log('신의 시선은 다른 곳으로 옮겨 갔다.');})]})},
  {id:'a_king',w:()=>S.age>=25&&S.age<=55&&S.fame>=40&&!S.king?2:0,make:()=>({eyebrow:'왕좌',img:'era_ancient',title:'왕관의 무게',body:'사람들이 당신을 왕으로 추대하려 해요.',options:[
    opt('왕이 된다','나라를 짊어져요',()=>{chosen();S.king=true;addFame(20,'왕위에 오름');S.wealth=90;clsAdd({라이더:2,세이버:1});log('왕관을 썼다. 무거웠다.','joy',true);}),
    opt('사양한다','칼을 든 채로 살아요',()=>{addFame(5);log('왕관을 사양했다. 사람들은 그 겸손을 칭송했다.');})]})},
  {id:'a_love',w:()=>S.age>=18&&S.age<=35&&!S.married?1.4:0,make:()=>({eyebrow:'인연',img:'era_ancient',title:'운명의 사람',body:'축제의 밤, 한 사람과 눈이 마주쳤어요.',options:[
    opt('평생을 함께한다','',()=>{S.married=true;S.mental+=10;log('그 사람과 혼인했다.','joy');}),
    opt('길을 떠난다','영웅에게 머물 곳은 없어요',()=>{addFame(4);S.mental-=5;log('그 사람을 두고 길을 떠났다.');})]})},
  {id:'a_betray',w:()=>S.fame>=45&&S.age>=25?1:0,make:()=>({eyebrow:'비극',img:'hero_battle',title:'배신',body:'가장 믿던 사람이 당신을 팔아넘겼어요. 적들이 몰려와요.',options:[
    opt('복수한다','피로 갚아요',()=>{chosen();clsAdd({어벤저:3,버서커:1});if(chance(.3))die('배신','복수의 끝에서 함께 쓰러졌다.');else{addFame(10,'배신자를 벌함');log('배신자를 벌했다. 그 뒤로 웃는 일이 줄었다.','risk',true);}}),
    opt('용서한다','같은 사람이 되지 않아요',()=>{addFame(8,'배신자를 용서함');S.mental+=8;log('배신자를 용서했다. 사람들은 그것을 오래 이야기했다.','moon',true);}),
    opt('달아난다','살아야 다음이 있어요',()=>{S.fame-=8;log('나라를 떠나 몸을 숨겼다.','risk');})]})},
  {id:'a_edo',w:()=>S.region==='japan'&&S.year>=1650&&S.year<=1652&&S.age>=15&&S.age<=60&&!S.used.a_edo?100:0,make:()=>{worldArc('edo');return S.pending;}},
  {id:'a_immortal',w:()=>S.age>=35&&(S.circuits>=10||S.fame>=35)&&!S.apostle?1.2:0,make:()=>({eyebrow:'불멸',img:'birth_inhuman',title:'시대를 건너는 길',body:'이 몸은 곧 늙어 죽어요. 하지만 시대를 건너는 방법이 둘 있어요. 피를 마시는 자들과 계약하거나, 마법에 닿거나.',options:[
    opt('흡혈종과 계약한다','사도가 되어 현대까지',()=>{chosen();if(chance(.55))ancientTransit('apostle');else die('사도화 실패','몸이 피를 견디지 못했다.');}),
    opt('마법을 탐구한다','기적에 닿을 수 있다면',()=>{chosen();const p=clamp((power()-5)/12,.02,.3);if(S.mage&&chance(p))ancientTransit('magician');else{addAp(1);S.health-=20;log('기적의 문턱에서 튕겨 나왔다.','risk',true);}},!S.mage),
    opt('인간으로 죽는다','이름만 남기면 충분해요',()=>{addFame(5);log('불멸을 거절했다. 남은 날을 사람들과 보냈다.','moon');})]})}
];
function ancientOpportunity(){
  const list=ANC_EVENTS.map(e=>({e,w:(S.used[e.id]&&!e.repeat)?0:e.w()})).filter(x=>x.w>0);
  const forced=list.find(x=>x.w>=100);
  if(forced){S.used[forced.e.id]=1;S.pending=forced.e.make();if(S.pending&&S.pending.img)scene(S.pending.img);return true;}
  if(S.age<8||!list.length||!chance(.17))return false;
  if(typeof aiReady==='function'&&aiReady()&&S.aiCount<aiMax()&&chance(.4)){S.aiCount++;S.pending={ai:true};return true;}
  const x=wpick(list,y=>y.w);S.used[x.e.id]=(S.used[x.e.id]||0)+1;
  S.pending=x.e.make();if(S.pending.img)scene(S.pending.img);
  return true;
}
function ancientStep(){
  S.age++;S.year++;if(S.year===0)S.year=1;
  if(['vamp','true','dragon'].includes(S.race)&&S.age>=60&&!S.transited){ancientTransit(S.race==='vamp'?'apostle':'inhuman');return;}
  if(S.age>35)S.health-=R()*(S.age>55?2.5:1.2);
  S.health=clamp(S.health,1,100);S.mental=clamp(S.mental,1,100);S.wealth=clamp(S.wealth,0,100);
  if(S.age===16&&!S.married)log(pick(['성인식을 치렀다.','처음으로 칼을 쥐었다.','처음으로 사냥에 나섰다.']));
  if(ancientOpportunity())return;
  if(chance(.25))log(pick(['풍년이 들었다.','이웃 마을과 다툼이 있었다.','긴 가뭄이 들었다.','신전에 제물을 바쳤다.','여행자에게서 먼 나라 이야기를 들었다.','역병이 돌았다.','큰 축제가 열렸다.']));
  const L=44+S.leBonus+(S.race==='half'?10:0);
  const b=.085,A=Math.LN2*b/(Math.exp(b*(L+4))-1);
  let h=A*Math.exp(b*S.age);if(S.age===1)h+=.15;else if(S.age<=5)h+=.02;
  h*=1+Math.max(0,55-S.health)/30;
  if(chance(Math.min(.9,h)))die(pick(['병','상처','노환','역병']),S.age>50?'긴 생을 마치고 눈을 감았다.':'병을 이기지 못했다.');
}
function ancientTransit(kind){
  const reg=S.reg;
  S.transited=true;
  if(kind==='inhuman')log('인간이 아닌 몸은 늙지 않았다. 사람들이 하나둘 먼저 떠나갔다.','moon',true);
  else if(kind==='apostle'){log('피를 마시는 자와 계약했다. 심장이 멈췄고, 다시 뛰지 않았다. 그래도 몸은 움직였다.','moon',true);S.apostle=true;S.apostleAge=S.age;unlock('ancient_apostle');}
  else{log('그날, 세상의 법칙 하나가 손안에서 뒤집혔다. 기적에 닿았다. 시간은 더 이상 당신을 붙잡지 못한다.','moon',true);S.magician=true;S.mage=true;unlock('magician');S.endKey='magician';}
  const y=ri(1990,2010);
  log(`그리고 ${y-S.year}년의 시간이 흘렀다.`,'moon',true);
  S.era='modern';S.year=y;S.age=y-S.birthYear;
  S.country=COUNTRIES.find(c=>c.n===REGION_COUNTRY[reg.id])||pick(COUNTRIES);S.city=pick(S.country.cities);
  S.long=true;S.endYear=y+ri(12,40);S.health=100;
  log(`현대의 ${S.country.n} ${S.city}. 아무도 당신이 ${reg.n}의 영웅이었다는 것을 모른다.`,'moon',true);
  scene(kind==='magician'?'end_root':'birth_inhuman');
  major({kind:'gold',img:kind==='apostle'?'birth_inhuman':'end_root',eyebrow:'시대를 건너다',title:kind==='apostle'?'수천 년의 밤':'마법사',body:kind==='apostle'?'사도가 되어 현대에 닿았어요. 매장기관이 당신의 오래된 이름을 찾고 있어요.':'마법에 닿아 현대에 닿았어요. 협회는 아직 당신의 존재를 모릅니다.'});
}
function ancientJudge(){
  const reg=S.reg;
  const legend=5+S.fame+S.deeds.length*6+(S.np?12:0)+(S.king?10:0)+(S.race==='half'?10:0)+S.depts.length*2;
  if(legend<60){log(`이름은 몇 세대 동안 노래로 불리다 잊혔다. (전설 ${legend}/60)`,'death');return 'ancient_death';}
  const w=Object.assign({},reg.cls);Object.entries(S.clsW).forEach(([k,v])=>w[k]=(w[k]||0)+v*2);
  const cls=wpick(Object.keys(w),k=>w[k]);
  const tier=clamp(1+Math.floor((legend-60)/35),1,5);
  const ep=S.king?'왕':S.deeds.some(d=>d.includes('퇴치'))?'괴물 사냥꾼':S.deeds.some(d=>d.includes('선봉'))?'전장의 영웅':S.mage?'현자':'영웅';
  PROFILE.spirits=PROFILE.spirits||[];
  PROFILE.spirits.unshift({name:S.name,region:reg.n,cls,tier,epithet:`${reg.n}의 ${ep}`,np:S.np});
  PROFILE.spirits=PROFILE.spirits.slice(0,20);saveProfile();
  unlock('spirit_'+reg.id);
  log(`죽은 뒤, 그 이름은 전설이 되어 영령의 좌에 새겨졌다. 클래스 적성 ${cls}, ${'★'.repeat(tier)}. 언젠가 먼 미래의 성배전쟁에서 소환될지도 모른다.`,'moon',true);
  scene('throne');
  return 'spirit';
}

/* ---------------- Fate/stay night ---------------- */
const SN_ROUTES={
  fate:{n:'Fate',who:'세이버와 시로',talks:['saber','shirou','saber'],stages:[['버서커의 습격',2.5,'눈 내리는 밤, 거인 버서커가 길을 막았어요.'],['류도사의 캐스터',3,'산문의 아사신과 마녀 캐스터가 기다리는 류도사.'],['황금의 영령',3.5,'10년 전의 전쟁에서 남은 황금의 왕이 모습을 드러냈어요.']]},
  ubw:{n:'Unlimited Blade Works',who:'린과 아처',talks:['rin','archer','rin'],stages:[['캐스터의 계략',2.5,'캐스터가 마을 사람들의 생기를 빨아들이고 있어요.'],['아처의 배신',3,'붉은 궁병이 린을 떠나 적이 되었어요.'],['무한의 검제',3.5,'아인츠베른 성. 끝없는 검의 언덕 위의 결전.']]},
  hf:{n:"Heaven's Feel",who:'사쿠라',talks:['sakura','illya','sakura'],stages:[['그림자의 습격',3,'밤마다 사람이 사라져요. 검은 그림자가 도시를 삼키고 있어요.'],['검게 물든 세이버',3.5,'더럽혀진 기사왕이 앞을 막았어요.'],['대성배의 동굴',4.5,'류도사 지하, 대성배 앞에 사쿠라가 서 있어요.']]}
};
function snWar(){
  S.snActive=true;story('제5차 성배전쟁','plan');
  scene('grail_war');
  const canSummon=S.mage||S.circuits>=3;
  S.pending={eyebrow:'2004년 · 후유키',img:'grail_war',title:'그날 밤, 교정에서',body:'늦은 밤의 학교. 운동장에서 붉은 궁병과 푸른 창병이 부딪치고 있어요. 제5차 성배전쟁이 시작됐어요.',options:[
    opt('자신의 서번트를 소환한다',canSummon?'마스터로 참전해요':'마술회로가 필요해요',()=>{chosen();S.snMaster=true;S.warCount++;S.seals=3;const sv=rollServant(S.wealth>=60);S.servant=sv;fate(2,'성배전쟁 참전');log(`창고 바닥의 마법진이 빛났다. 소환에 응한 것은 ${sv.cls}, 진명 「${sv.name}」.`,'grail',true);major({kind:'summon',sv,war:'제5차 성배전쟁',img:'summon'});snPickRoute();},!canSummon),
    opt('시로를 따라간다','에미야를 내버려 둘 수 없어요',()=>{chosen();meet('shirou');addBond('shirou',8);meet('saber');log('시로를 따라 달렸다. 그날 밤 창고에서 푸른 기사가 나타나는 것을 보았다.','grail',true);snPickRoute();}),
    opt('토오사카에게 알린다','이건 그녀의 일이에요',()=>{chosen();meet('rin');addBond('rin',8);log('토오사카 린을 찾아갔다. "……너, 봤구나." 그녀가 한숨을 쉬었다.','grail',true);snPickRoute();}),
    opt('못 본 척 집에 간다','휘말리고 싶지 않아요',()=>{if(chance(.4)){log('집으로 돌아갔다. 그 겨울, 도시에서 무슨 일이 있었는지 끝내 몰랐다.','life');S.snActive=false;story('제5차 성배전쟁','fail');}else{log('돌아서는 순간, 창병의 눈이 이쪽을 향했다.','risk',true);becomeAware();snPickRoute();}})
  ]};
}
function snPickRoute(){
  ['saber','rin','sakura'].forEach(meet);
  const h=bond('sakura');const need=20;
  S.pending={eyebrow:'갈림길',img:'grail_war',title:'누구의 곁에 설까요',body:'이 전쟁이 어떻게 끝날지는 당신이 누구의 곁에 서느냐에 달렸어요.',options:[
    opt(`세이버와 시로 (Fate)`,`세이버 신뢰 ${bond('saber')} · 시로 신뢰 ${bond('shirou')}`,()=>{chosen();snStage('fate',0);}),
    opt(`린과 아처 (Unlimited Blade Works)`,`린 신뢰 ${bond('rin')}`,()=>{chosen();snStage('ubw',0);}),
    opt(`사쿠라 (Heaven's Feel)`,h>=need?`사쿠라 신뢰 ${h}`:`사쿠라와의 신뢰가 더 필요해요 (${h}/${need})`,()=>{chosen();snStage('hf',0);},h<need)
  ]};
}
function snStage(rt,i){
  const R_=SN_ROUTES[rt];S.snRoute=rt;
  if(i>=3){snEnd(rt);return;}
  const st=R_.stages[i],partner=stageTalker(R_.talks[i],i);const rv=rival('sn');
  story(`${R_.n} · ${st[0]}`,'plan');
  if(rv)log(`이 밤의 상대: ${rv}.`,'grail');
  talk(partner,`제5차 성배전쟁 ${R_.n} 루트 ${i+1}단계 「${st[0]}」 직전. ${st[2]}${rv?' 상대 마스터는 '+rv+'.':''}`,()=>{
    const hero=rt==='fate'?'saber':rt==='ubw'?'rin':'sakura';
    const base=(S.snMaster?.6:0)+(S.servant?(S.servant.tier-3)*.5+bond('sv:'+S.servant.name)/80:0)+bond(hero)/50;
    S.pending={eyebrow:`${R_.n} · ${i+1}/3`,img:'grail_war',title:st[0],body:st[2]+(rv?` 상대는 ${rv}.`:''),options:[
      opt('정면으로 맞선다','힘으로',()=>snResolve(rt,i,base)),
      opt(`${charInfo(hero).n}을(를) 믿고 맡긴다`,`신뢰 ${bond(hero)}`,()=>snResolve(rt,i,base+bond(hero)/40)),
      opt('함정을 파고 기다린다','신중하게',()=>snResolve(rt,i,base+.3))
    ]};
  });
}
function snResolve(rt,i,mod){
  chosen();
  const R_=SN_ROUTES[rt],st=R_.stages[i];
  if(S.servant&&S.seals>0&&power()+mod<st[1]){S.seals--;mod+=.6;log('영주 1획을 사용했다.','grail');}
  if(chance(odds(st[1],mod))){story(`${R_.n} · ${st[0]}`,'ok');log(`「${st[0]}」을(를) 넘었다.`,'grail',true);fate(2,`${R_.n} ${i+1}단계`);snStage(rt,i+1);return;}
  story(`${R_.n} · ${st[0]}`,'fail');
  S.snFail=(S.snFail||0)+1;
  if(chance(rt==='hf'?.5:.35)){S.deadEnd=`${R_.n} · ${st[0]}`;S.deadText=rt==='hf'?'검은 그림자가 발밑에서 솟아올랐다. 마지막으로 본 것은 사쿠라의 울 것 같은 얼굴이었다.':'그 밤을 넘기지 못했다.';die('제5차 성배전쟁',S.deadText);return;}
  if(S.snFail>=2){log('전쟁은 당신 없이 끝났다. 어떤 결말이었는지는 소문으로만 들었다.','risk',true);S.snActive=false;return;}
  S.health-=20;log('크게 다쳤지만 살아남았다. 싸움은 계속된다.','risk',true);snStage(rt,i+1);
}
function snEnd(rt){
  S.snActive=false;story('제5차 성배전쟁','ok');
  if(rt==='fate'){
    unlock('sn_fate_true');log('세이버는 성배를 부수고, 아침 햇살 속에서 원래의 시대로 돌아갔다. 시로는 그녀를 잊지 않고 살아가기로 했다.','grail',true);
    if(bond('saber')>=40){unlock('sn_fate_le');log('아득한 시간이 흐른 뒤, 아발론의 낙원에서 두 사람이 다시 만났다고 한다.','grail',true);}
  } else if(rt==='ubw'){
    unlock('sn_ubw_true');log('미래의 자신을 넘어선 시로는 린과 함께 런던의 시계탑으로 떠났다.','grail',true);
    if(bond('saber')>=20&&bond('rin')>=40){unlock('sn_ubw_good');log('그리고 사라진 줄 알았던 세이버가 남아, 세 사람의 시끄러운 일상이 시작되었다.','grail',true);}
    if(S.mage&&!S.academy&&bond('rin')>=50){S.academy='시계탑';log('린의 권유로 함께 런던의 시계탑에 들어갔다.','moon',true);}
  } else {
    if(bond('sakura')>=50&&bond('illya')>=12){unlock('sn_hf_true');log('이리야가 제3마법으로 시로의 혼을 붙잡았다. 인형의 몸으로 돌아온 시로와 사쿠라는 벚꽃 아래서 봄을 맞았다.','grail',true);}
    else{unlock('sn_hf_normal');log('시로는 사쿠라를 구하고 돌아오지 않았다. 사쿠라는 그 집에서 오래도록 그를 기다렸다.','grail',true);}
  }
  scene('homurahara');
  major({kind:'gold',img:'homurahara',eyebrow:'제5차 성배전쟁',title:`${SN_ROUTES[rt].n} 루트를 지켜보았다`,body:'전쟁은 끝났어요. 당신의 인생은 계속돼요.'});
}

/* ---------------- Fate/Zero ---------------- */
function zeroWar(){
  S.zeroActive=true;story('제4차 성배전쟁','plan');
  const canSummon=S.mage||S.circuits>=3;
  S.pending={eyebrow:'1994년 · 후유키',img:'grail_war',title:'제4차 성배전쟁',body:'일곱 명의 마스터가 후유키에 모였어요. 당신은 어떻게 이 전쟁에 들어갈까요?',options:[
    opt('마스터로 참전한다',canSummon?'서번트를 소환해요':'마술회로가 필요해요',()=>{chosen();S.zeroSide='master';S.warCount++;S.seals=3;const sv=rollServant(S.wealth>=60||['lord','noble'].includes(S.birth));S.servant=sv;fate(2,'성배전쟁 참전');log(`소환에 응한 것은 ${sv.cls}, 진명 「${sv.name}」.`,'grail',true);major({kind:'summon',sv,war:'제4차 성배전쟁',img:'summon'});zeroStage(0);},!canSummon),
    opt('아인츠베른 진영에 고용된다','에미야 키리츠구의 곁에서',()=>{chosen();S.zeroSide='einz';meet('kiritsugu');meet('irisviel');addBond('irisviel',6);log('아인츠베른 진영의 일원이 되었다. 검은 코트의 남자는 당신을 거의 쳐다보지 않았다.','grail',true);zeroStage(0);}),
    opt('웨이버와 함께한다','겁쟁이 소년과 정복왕',()=>{chosen();S.zeroSide='rider';meet('waver');meet('iskandar');addBond('waver',6);log('맥켄지 노부부의 집에서 투덜대는 소년과 거구의 왕을 만났다.','grail',true);zeroStage(0);}),
    opt('교회의 감독을 돕는다','중립의 자리에서',()=>{S.zeroSide='church';meet('kirei');log('교회의 감독관 일을 도왔다. 신부의 아들이 당신을 흥미롭게 바라보았다.','grail',true);zeroStage(0);})
  ]};
}
const ZERO_ST=[['창고가의 첫 격돌',2.5,'항구의 창고가. 세이버와 랜서의 결투에 서번트들이 몰려들어요.'],['성배 문답',3,'왕들이 술잔을 나누며 왕도를 논하는 밤.'],['시민회관의 결전',3.5,'성배가 강림하는 시민회관. 마지막 싸움.']];
function zeroStage(i){
  if(i>=3){zeroEnd();return;}
  const st=ZERO_ST[i];
  const rv=rival('zero');if(rv)log(`이 밤의 상대: ${rv}.`,'grail');
  const partner0={master:['waver','iskandar','irisviel'],einz:['irisviel','kiritsugu','irisviel'],rider:['waver','iskandar','waver'],church:['kirei','kirei','kiritsugu']}[S.zeroSide][i];const partner=stageTalker(partner0,i);
  story(`Zero · ${st[0]}`,'plan');
  talk(partner,`제4차 성배전쟁 ${i+1}단계 「${st[0]}」. ${st[2]}${rv?' 상대 마스터는 '+rv+'.':''}`,()=>{
    const base=(S.servant?(S.servant.tier-3)*.5:0)+bond(partner)/50;
    S.pending={eyebrow:`Fate/Zero · ${i+1}/3`,img:'grail_war',title:st[0],body:st[2]+(rv?` 상대는 ${rv}.`:''),options:[
      opt('정면으로 맞선다','',()=>zeroResolve(i,base)),
      opt(`${charInfo(partner).n}을(를) 믿는다`,`신뢰 ${bond(partner)}`,()=>zeroResolve(i,base+bond(partner)/40)),
      opt('그림자 속에서 움직인다','마술사 살해자의 방식',()=>zeroResolve(i,base+.3))
    ]};
  });
}
function zeroResolve(i,mod){
  chosen();const st=ZERO_ST[i];
  if(S.servant&&S.seals>0&&power()+mod<st[1]){S.seals--;mod+=.6;log('영주 1획을 사용했다.','grail');}
  if(chance(odds(st[1],mod))){story(`Zero · ${st[0]}`,'ok');log(`「${st[0]}」을(를) 넘었다.`,'grail',true);fate(2,`Zero ${i+1}단계`);zeroStage(i+1);return;}
  story(`Zero · ${st[0]}`,'fail');
  if(chance(.4)){S.deadEnd=`Zero · ${st[0]}`;S.deadText='마술사들의 전쟁은 자비가 없었다.';die('제4차 성배전쟁',S.deadText);return;}
  S.health-=20;log('크게 다쳤지만 살아남았다.','risk',true);zeroStage(i+1);
}
function zeroEnd(){
  S.zeroActive=false;story('제4차 성배전쟁','ok');
  if(S.zeroSide==='einz'&&bond('kiritsugu')>=22&&bond('irisviel')>=30){
    S.pending={eyebrow:'시민회관',img:'grail_fire',title:'성배의 정체',body:'당신은 알아챘어요. 성배는 「이 세상의 모든 악」으로 더럽혀져 있어요. 키리츠구가 그것을 파괴하면, 쏟아진 진흙이 도시를 불태울 거예요.',options:[
      opt('키리츠구에게 진실을 알리고 함께 막는다','아무도 본 적 없는 결말 (매우 어려움)',()=>{chosen();if(chance(odds(6,bond('kiritsugu')/50))){unlock('zero_fire');S.noFire=true;log('진흙이 쏟아지기 전에 대성배의 구멍을 닫았다. 그날 밤 후유키에 불은 내리지 않았다.','grail',true);major({kind:'gold',img:'end_peace',eyebrow:'Fate/Zero',title:'대화재 저지',body:'아무도 본 적 없는 결말에 닿았어요.'});}else{unlock('zero_grail');log('막지 못했다. 성배가 부서지고, 신도에 불이 내렸다.','grail',true);S.health-=20;}}),
      opt('키리츠구의 선택을 지켜본다','',()=>{unlock('zero_grail');log('키리츠구는 세이버에게 성배를 파괴하라고 명했다. 그날 밤 신도에 불이 내렸다.','grail',true);})
    ]};return;
  }
  if(S.zeroSide==='rider'&&bond('iskandar')>=18&&bond('waver')>=28){unlock('zero_rider');log('정복왕의 마지막 돌격을 웨이버와 함께 지켜보았다. "살아남아라, 그리고 나의 이야기를 전해라."','grail',true);addBond('waver',10);return;}
  unlock('zero_grail');log('전쟁의 끝, 성배는 파괴되고 신도에 불이 내렸다.','grail',true);
}

/* ---------------- 칼데아 ---------------- */
function fgoRecruit(){
  const mageOk=S.mage,elite=S.mage&&(S.circuits>=40||rankTarget()>=3),aide=['lord','noble'].includes(S.birth)&&S.mage&&rankTarget()>=4;
  scene('chaldea');
  S.pending={eyebrow:'2015년',img:'chaldea',title:'인리계속보장기관 피니스 칼데아',body:'남극의 설산에 숨은 기관에서 연락이 왔어요. 100년 뒤의 인류의 미래를 지키는 곳이에요.',options:[
    opt('A팀 마스터 후보',elite?'선발된 정예 마스터':'명문 마술사의 재능이 필요해요',()=>fgoJoin('a'),!elite),
    opt('마스터 후보 (일반 공모)','레이시프트 적성만 있으면 돼요',()=>fgoJoin('master')),
    opt('시스템 운용 마술사',mageOk?'칼데아를 지탱하는 마술사':'마술사여야 해요',()=>fgoJoin('magus'),!mageOk),
    opt('스태프','관제, 의료, 기술',()=>fgoJoin('staff')),
    opt('소장 보좌',aide?'아니무스피아 가문의 곁에서':'귀족 가문 출신, 높은 계위가 필요해요',()=>fgoJoin('aide'),!aide),
    opt('거절한다','',()=>{S.route=null;log('칼데아의 제안을 거절했다.');})
  ]};
}
function fgoJoin(role){
  chosen();S.fgoRole=role;S.city='칼데아 (남극)';S.fgoActive=true;fate(2,'칼데아 입소');
  log({a:'A팀의 마스터 후보로 칼데아에 들어갔다. 다른 A팀 멤버들은 하나같이 괴물 같은 재능이었다.',master:'일반 공모 마스터 후보로 칼데아에 들어갔다. 48명 중 하나였다.',magus:'시스템 운용 마술사로 칼데아에 들어갔다. 지하의 거대한 장치들이 낮게 울렸다.',staff:'스태프로 칼데아에 들어갔다.',aide:'소장 보좌로 칼데아에 들어갔다. 소장은 당신을 경계하는 눈으로 보았다.'}[role],'moon',true);
  story('칼데아 입소','ok');
  const first=role==='aide'?'olga':role==='staff'?'romani':'mash';
  talk(first,'2015년, 칼데아에 막 들어온 날.',()=>{});
}
function fgoBomb(){
  const r=S.fgoRole,isM=r==='a'||r==='master';
  scene('chaldea');
  const opts=isM?[
    opt('브리핑에 제시간에 간다','성실하게',()=>{if(r==='a'){S.fgoFrozen=true;S.fgoActive=false;log('관제실이 폭발했다. 마지막으로 본 것은 붉은 경보등이었다. 몸이 코피 속에서 얼어붙었다.','risk',true);story('레프의 폭탄','fail');}else{S.fgoActive=false;S.health-=30;log('폭발에 휘말려 중상을 입었다. 냉동 보존된 채 이야기는 당신 없이 흘러갔다.','risk',true);story('레프의 폭탄','fail');}}),
    opt('늦잠을 잔다','어젯밤 너무 늦게 잤어요',()=>{chosen();S.fgoMaster=true;unlock('fgo_lastmaster');log('늦잠을 잤다. 그 덕분에 살아남았다. 남은 마스터는 단 둘이었다.','moon',true);story('레프의 폭탄','ok');}),
    opt('관제실로 달려간다','누군가 아직 거기 있어요',()=>{chosen();meet('mash');if(chance(.15)){S.deadEnd='레프의 폭탄';S.deadText='불길 속에서 빠져나오지 못했다.';die('레프의 폭탄',S.deadText);return;}S.fgoMaster=true;addBond('mash',15);log('잔해 아래 깔린 마슈의 손을 잡았다. "선배……" 그 순간 레이시프트가 시작됐다.','moon',true);story('레프의 폭탄','ok');})
  ]:[
    opt('관제를 지킨다','시스템을 살려요',()=>{chosen();meet('romani');addBond('romani',10);log('불길 속에서도 관제 콘솔을 지켰다. 로마니가 "고마워"라고 짧게 말했다.','moon',true);story('레프의 폭탄','ok');}),
    opt('소장 곁으로 간다','소장님이 위험해요',()=>{chosen();meet('olga');addBond('olga',12);log('소장을 찾아 달렸지만, 그녀는 이미 레이시프트에 휘말린 뒤였다.','moon',true);story('레프의 폭탄','ok');}),
    opt('의무실로 부상자를 옮긴다','한 명이라도 더',()=>{chosen();meet('romani');addBond('romani',8);S.health-=10;log('부상자들을 의무실로 옮겼다. 손이 피투성이가 되었다.','moon',true);story('레프의 폭탄','ok');})
  ];
  opts.forEach(o=>{const f=o.fn;o.fn=()=>{f();if(S.alive&&S.fgoActive&&!S.pending){S.fgoYearDone=S.year;fgoYear();}};});
  S.pending={eyebrow:'2016년 · 칼데아',img:'chaldea',title:'레프의 폭탄',body:'첫 레이시프트 실험 직전, 관제실이 폭발했어요. 인류의 미래가 불타기 시작했어요.',options:opts};
}
function rosterBonus(){return (S.roster||[]).map(s=>s.tier).sort((a,b)=>b-a).slice(0,4).reduce((s,t)=>s+t*.12,0);}
function fgoPower(){
  const exp=Math.min(S.fgoExp||0,3);
  if(S.fgoMaster)return power()+rosterBonus()+bond('mash')/60+exp;
  const r=S.fgoRole;
  const contrib=r==='magus'?rankTarget()*.35+S.abil.length*.15:r==='aide'||S.fgoDirector?rankTarget()*.4+.5:.8;
  return 3.2+contrib+(bond('romani')+bond('davinci')+bond('mash'))/150+exp;
}
function fgoYear(){
  const list=FGO_CH.filter(c=>c.y===S.year&&!(S.fgoClear||[]).includes(c.id));
  fgoChain(list,0);
}
function fgoChain(list,i){
  if(i>=list.length||!S.alive||!S.fgoActive)return;
  const c=list[i];
  scene(c.part===2?'lostbelt':'singularity');
  story(c.n,'plan');
  talk(c.p,`칼데아. ${c.n} 직전. ${c.intro}`,()=>{
    S.pending={eyebrow:`Fate/Grand Order · ${c.part===1.5?'1.5':c.part}부 · 추천 전력 ${c.rec}`,img:c.part===2?'lostbelt':'singularity',title:c.n,body:c.intro+` (지금 전력 ${fmtP(fgoPower())})`,options:[
      opt('정면으로 돌파한다','서번트들의 힘을 믿어요',()=>fgoResolve(list,i,0)),
      opt(`${charInfo(c.p).n}과(와) 손잡는다`,`신뢰 ${bond(c.p)}`,()=>fgoResolve(list,i,bond(c.p)/40)),
      opt('신중하게 정보를 모은다','느리지만 확실해요',()=>fgoResolve(list,i,.3))
    ]};
  });
}
function fgoResolve(list,i,mod){
  chosen();const c=list[i];
  const p=clamp(1/(1+Math.exp(-(fgoPower()+mod-c.rec)*1.1)),.04,.97);
  if(chance(p)){
    S.fgoClear=(S.fgoClear||[]).concat(c.id);S.fgoExp=(S.fgoExp||0)+.25;
    story(c.n,'ok');log(`${c.n} 수복.`,'joy',true);unlock('fgo_'+c.id);
    if(c.id==='f'){log('올가마리 소장은 돌아오지 못했다.','risk');if(S.fgoRole==='aide'){S.fgoDirector=true;unlock('fgo_director');log('비어 버린 소장의 자리를 당신이 이어받았다.','moon',true);}}
    if(c.id==='fin'){S.fgoDone=true;log(bond('romani')>=70?'로마니 아키만은 모든 것을 걸고 마술왕을 끝냈다. 마지막에 그는 당신에게 웃어 보였다.':'로마니 아키만은 돌아오지 않았다. 인리는 수복되었다.','grail',true);major({kind:'gold',img:'end_peace',eyebrow:'Fate/Grand Order',title:'인리수복',body:'인류의 미래를 되찾았어요. 하지만 이야기는 아직 끝나지 않았어요.'});}
    if(S.fgoMaster){const sv=rollServant(true);S.roster=(S.roster||[]).concat(sv);log(`새 서번트가 소환에 응했다. ${sv.cls} 「${sv.name}」 ${'★'.repeat(sv.tier)}`,'grail');if(sv.tier>=4)major({kind:'summon',sv,war:'칼데아 소환',img:'summon'});}
    fgoChain(list,i+1);return;
  }
  story(c.n,'fail');
  if(S.fgoMaster){
    if(chance(.5)){S.deadEnd=c.n;S.deadText='레이시프트 너머에서 돌아오지 못했다. 칼데아의 관제실에 긴 경보음이 울렸다.';die(c.n,S.deadText);return;}
    S.fgoRetry=(S.fgoRetry||0)+1;
    if(S.fgoRetry>=3){fgoFall(c);return;}
    S.health-=20;log('간신히 귀환했다. 다시 도전해야 한다.','risk',true);fgoChain(list,i);return;
  }
  fgoFall(c);
}
function fgoFall(c){
  S.endKey='incineration';S.fgoActive=false;
  log(`${c.n}에서 칼데아는 무너졌다. 인류사는 불타 버렸다.`,'death',true);
  scene('singularity');
  S.alive=false;S.deathAge=S.age;S.cause='인리 소각';
}
function fgoCrypter(){
  scene('lostbelt');
  S.pending={eyebrow:'2017년',img:'lostbelt',title:'이성의 신의 목소리',body:'얼어붙어 있던 의식이 깨어났어요. 하늘 너머의 신이 말해요. "세계를 다시 칠하라. 너의 이문대를 키워라."',options:[
    opt('크립터가 된다','칼데아와 적이 돼요',()=>{chosen();S.crypter=true;const lb=pick(FGO_CH.filter(c=>c.id.startsWith('l')));log(`크립터로 깨어났다. 맡은 곳은 「${lb.n}」.`,'risk',true);story('크립터','plan');
      S.pending={eyebrow:'크립터',img:'lostbelt',title:'칼데아가 온다',body:'마지막 마스터와 그 서번트들이 당신의 이문대에 도착했어요.',options:[
        opt('맞서 싸운다','이문대를 지켜요',()=>{chosen();if(chance(odds(9))){unlock('fgo_crypter');S.endKey='crypter';story('크립터','ok');log('칼데아를 물리쳤다. 이문대의 하늘 아래, 당신은 왕이었다. 오래가지는 않았지만.','grail',true);S.alive=false;S.deathAge=S.age;S.cause='이문대와 함께';}else{story('크립터','fail');S.deadEnd='크립터';S.deadText='이문대는 지워지고, 당신도 함께 사라졌다.';die('크립터',S.deadText);}}),
        opt('칼데아에 협력한다','이성의 신을 배신해요',()=>{chosen();meet('mash');addBond('mash',10);S.crypter=false;S.fgoActive=true;S.fgoRole='magus';log('칼데아의 편에 섰다. 이성의 신의 저주가 등에 새겨졌다.','moon',true);story('크립터','ok');})
      ]};}),
    opt('거부한다','',()=>{S.deadEnd='이성의 신';S.deadText='신의 제안을 거부했다. 몸은 다시는 깨어나지 않았다.';die('이성의 신',S.deadText);})
  ]};
}

/* ---------------- 루트 사건(기회 사건 목록에 더한다) ---------------- */
EVENTS.unshift(
  {id:'sn_school',w:()=>S.route==='sn'&&S.age>=15&&S.year>=2001&&S.year<=2003?100:0,make:()=>({eyebrow:'호무라바라 학원',img:'homurahara',title:'새 학기',body:'후유키의 호무라바라 학원. 같은 학년에 에미야 시로와 토오사카 린, 한 학년 아래에 마토 사쿠라가 있어요. 어떤 학교생활을 할까요?',options:[
    opt('궁도부에 들어간다','사쿠라와 함께',()=>{chosen();meet('sakura');meet('shirou');addBond('sakura',10);addBond('shirou',4);log('궁도부에 들어갔다. 사쿠라가 수줍게 인사했다.','joy');}),
    opt('학생회 잡일을 돕는다','시로와 함께',()=>{chosen();meet('shirou');addBond('shirou',10);log('학생회실의 고장 난 물건을 고치는 시로를 돕기 시작했다.','joy');}),
    opt('성적으로 승부한다','토오사카를 이겨 봐요',()=>{chosen();meet('rin');addBond('rin',10);log('시험 성적표 앞에서 토오사카 린과 눈이 마주쳤다.','joy');})]})},
  {id:'sn_talk',repeat:true,w:()=>S.route==='sn'&&S.year>=2002&&S.year<=2003&&(S.snTalks||0)<3?6:0,make:()=>{S.snTalks=(S.snTalks||0)+1;const id=pick(['shirou','rin','sakura','sakura','illya']);talk(id,`${S.year}년, 제5차 성배전쟁이 시작되기 전의 평범한 날들.`,()=>{});return S.pending;}},
  {id:'sn_war',w:()=>S.route==='sn'&&S.year===2004&&S.age>=14&&!S.apostle?100:0,make:()=>{snWar();return S.pending;}},
  {id:'zero_hook',w:()=>S.route==='zero'&&S.year===1993&&S.age>=18&&!S.apostle?100:0,make:()=>({eyebrow:'1993년',img:'grail_war',title:'극동의 의식',body:S.mage?'시계탑에서 소문을 들었어요. 내년 일본 후유키에서 만능의 소원기를 두고 마술사들이 싸운대요.':'일본 후유키로의 출장 제안이 왔어요. 그 도시에서 이상한 일이 벌어질 거라는 예감이 들어요.',options:[
    opt('후유키로 간다','',()=>{chosen();S.zeroGo=true;if(S.country.n!=='일본'){S.country=COUNTRIES.find(c=>c.n==='일본');}S.city='후유키 시';log('후유키로 건너갔다.','moon',true);}),
    opt('가지 않는다','',()=>{S.route=null;log('가지 않았다. 이듬해 그 도시에 큰불이 났다는 뉴스를 보았다.');})]})},
  {id:'zero_war',w:()=>S.route==='zero'&&S.zeroGo&&S.year===1994&&!S.apostle?100:0,make:()=>{zeroWar();return S.pending;}},
  {id:'fgo_recruit',w:()=>S.route==='fgo'&&S.year===2015&&S.age>=17&&!S.fgoRole?100:0,make:()=>{fgoRecruit();return S.pending;}},
  {id:'fgo_bomb',w:()=>S.fgoRole&&S.fgoActive&&S.year===2016&&!S.fgoBombDone?100:0,make:()=>{S.fgoBombDone=true;fgoBomb();return S.pending;}},
  {id:'fgo_year',repeat:true,w:()=>S.fgoActive&&S.fgoBombDone&&S.year>=2016&&S.year<=2024&&S.fgoYearDone!==S.year&&FGO_CH.some(c=>c.y===S.year)?100:0,make:()=>{S.fgoYearDone=S.year;fgoYear();return S.pending;}},
  {id:'fgo_crypter',w:()=>S.fgoFrozen&&S.year===2017&&!S.crypterDone?100:0,make:()=>{S.crypterDone=true;fgoCrypter();return S.pending;}}
);

/* ---------------- 다른 세계선의 짧은 이야기 ---------------- */
function worldArc(k){
  const A=WORLD_ARCS[k];
  const wn=(byId(WORLDS,k)||{n:A.n}).n;
  S.pending={eyebrow:wn,img:k==='extra'?'singularity':'grail_war',title:A.n,body:k==='extra'?'꿈속에서 낯선 학교의 교복을 입고 있었어요. 영자 컴퓨터 위에서 성배를 건 싸움이 시작돼요.':`${A.city}에서 성배전쟁이 시작돼요. 손등이 뜨거워져요.`,options:[
    opt('참가한다','서번트와 함께',()=>{chosen();S.warCount++;S.seals=3;const sv=rollServant(S.wealth>=60);S.servant=sv;fate(2,'성배전쟁 참전');log(`${A.n}에 참가했다. 소환에 응한 것은 ${sv.cls}, 진명 「${sv.name}」.`,'grail',true);major({kind:'summon',sv,war:A.n,img:'summon'});worldStage(k,0);}),
    opt('거절한다','',()=>{log(`${A.n}에 얽히지 않았다.`);})
  ]};
}
function worldStage(k,i){
  const A=WORLD_ARCS[k];
  if(i>=3){unlock(A.ach);story(A.n,'ok');log(`${A.n}을(를) 끝까지 살아남았다.`,'grail',true);major({kind:'gold',img:'grail_war',eyebrow:(byId(WORLDS,k)||{n:A.n}).n,title:A.n,body:'전쟁은 끝났어요. 당신의 인생은 계속돼요.'});return;}
  const st=A.st[i];story(`${A.n} · ${st[0]}`,'plan');
  const rv=A.tag?rival(A.tag):null;if(rv)log(`이 싸움의 상대: ${rv}.`,'grail');
  talk(stageTalker(A.p,i),`${A.n} ${i+1}단계 「${st[0]}」. ${st[2]}${rv?' 상대 마스터는 '+rv+'.':''}`,()=>{
    const base=(S.servant?(S.servant.tier-3)*.5:0)+bond(A.p)/50;
    S.pending={eyebrow:`${A.n} · ${i+1}/3`,img:'grail_war',title:st[0],body:st[2],options:[
      opt('정면으로 맞선다','',()=>worldResolve(k,i,base)),
      opt(`${charInfo(A.p).n}을(를) 믿는다`,`신뢰 ${bond(A.p)}`,()=>worldResolve(k,i,base+bond(A.p)/40)),
      opt('신중하게 움직인다','',()=>worldResolve(k,i,base+.3))]};
  });
}
function worldResolve(k,i,mod){
  chosen();const A=WORLD_ARCS[k],st=A.st[i];
  if(S.servant&&S.seals>0&&power()+mod<st[1]){S.seals--;mod+=.6;log('영주 1획을 사용했다.','grail');}
  if(chance(odds(st[1],mod))){story(`${A.n} · ${st[0]}`,'ok');fate(2,`${A.n} ${i+1}단계`);worldStage(k,i+1);return;}
  story(`${A.n} · ${st[0]}`,'fail');
  if(chance(.45)){S.deadEnd=`${A.n} · ${st[0]}`;S.deadText=k==='extra'?'패배한 마스터의 데이터는 지워진다. 현실의 몸도 함께 멈췄다.':'그 밤을 넘기지 못했다.';die(A.n,S.deadText);return;}
  S.health-=20;log('크게 다쳤지만 살아남았다. 전쟁은 당신을 남겨 두고 끝났다.','risk',true);S.servant=null;
}
EVENTS.unshift({id:'world_arc',w:()=>{const A=WORLD_ARCS[S.world];return A&&S.year===A.year&&S.age>=14&&S.age<=75&&(S.mage||S.circuits>=3||S.world==='extra')&&!S.apostle?100:0;},make:()=>{worldArc(S.world);return S.pending;}});
