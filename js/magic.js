'use strict';
/* =========================================================
   마술과 마법
   - 마술: 영지에 새긴 마술기반, 영창(소절), 신대와 인대의 깊이, 신비의 은닉, 연명, 마술각인
   - 동양의 사상마술(나선관)과 일본의 신의 파편, 초능력
   - 봉인지정: 마법에 한 걸음 못 미치는 「마법사의 업」을 지녔을 때만
   - 마법: 제2·제3·제5법은 계승으로, 제6법은 근원에 닿은 채 돌아와서
   ========================================================= */
const MAGICS={
  1:{n:'제1마법',t:'상세 불명',d:'무에서 유를 만드는 마법으로 짐작돼요. 마법사 유미나는 죽었고, 얻을 길은 없어요.'},
  2:{n:'제2마법',t:'평행세계의 운영',d:'무수한 평행세계를 보고, 건너고, 거기서 마력을 끌어와요. 보석옹 젤레치의 마법.'},
  3:{n:'제3마법',t:'혼의 물질화',d:'혼을 물질로 만들어 늙지 않고, 무진장한 마력을 얻어요. 하늘의 잔, 아인츠베른의 비원.'},
  4:{n:'제4마법',t:'정의 불명',d:'현존하는 마법사들이 「확실히 있다」고만 말하는 마법. 사용자는 모습을 감췄어요.'},
  5:{n:'제5마법',t:'마법·청',d:'우주의 끝을 앞당긴 대가로 시간과 결과를 다뤄요. 아오자키 가문이 이어 온 마법.'},
  6:{n:'제6법',t:'마지막 자리',d:'다섯 자리가 찬 세상에 남은 작은 여백. 「모든 사람의 행복」일지도 모른다고 해요.'}
};
function gainMagic(k,text){
  const M=MAGICS[k];
  S.magic=k;S.mage=true;S.aware=true;S.rootP=100;addAp(5);
  S.long=true;S.endYear=Math.max(S.endYear||0,S.year+ri(80,300));S.health=100;S.ill=null;
  unlock('magic_'+k);unlock('magician');fate(10,`${M.n} 획득`);
  log(text,'moon',true);
  log(`${M.n} 「${M.t}」을(를) 손에 넣었다. 그날부터 세계는 억지력으로 당신을 밀어내려 했다.`,'grail',true);
  scene('end_root');
  major({kind:'gold',img:'end_root',eyebrow:'마법',title:`${M.n} · ${M.t}`,body:M.d+' 마법사는 늙지 않고 정해진 죽음에 저항하지만, 억지력의 압박은 평생 따라와요.'});
}
function magicPower(){
  let p=S.magic?(S.magic===6?3:2.2):0;
  if(S.heir&&S.crestGen)p+=Math.min(S.crestGen/30,1.2);
  if(S.ley&&!(S.world==='extra'&&S.year>=1970))p+=S.ley.home===S.city?S.ley.str*.25:S.ley.str*.08;
  if(S.era==='ancient'&&S.mage)p+=.6;
  return p;
}
/* 영창: 소절이 길수록 깊어지지만 영혼은 10소절까지. 신대의 마술은 한 소절로 그보다 깊다 */
function chantMod(){return .7+({E:-.2,D:-.1,C:0,B:.15,A:.3}[S.qual]||0)+(S.abil.includes('fastcast')?.3:0)+(S.era==='ancient'?.8:0);}

/* ---------------- 신비의 은닉 ----------------
   눈에 띄는 마술을 쓸수록 쌓인다. 2010년 뒤로는 누구나 카메라를 들고 있어 더 빨리 쌓인다 */
const EXPOSE={marble:8,god:8,true:8,dragon:8,kaleido:6,golem:5,lantern:4,gandr:3,seventh:3,insect:2,possess:4,m2:10,m3:6,m5:12,m6:12};
function exposeAdd(n){if(!S.mage&&!S.church&&!S.apostle)return;let v=n*(S.year>=2010?1.5:1);if(n>=5&&S.fb.includes('kmagic'))v*=2;S.expose=Math.min(100,(S.expose||0)+v);}

/* ---------------- 봉인지정 ----------------
   한 대에 한정된 「마법사의 업」을 지녔을 때만 비의재시국이 움직인다 */
const SEAL_ABIL={marble:'고유결계',truelang:'통일언어',solo:'단독현현',carrier:'전승보균자'};
const SEAL_DET={puppeteer:'완전한 인형 육체',araya:'공간을 끊는 결계',phantom:'천 년 급 환수',tensen:'천선',gantai:'신의 파편'};
function sealReason(){
  const a=S.abil.find(id=>SEAL_ABIL[id]);if(a)return SEAL_ABIL[a];
  const d=S.details.find(id=>SEAL_DET[id]);if(d)return SEAL_DET[d];
  if(S.eye&&['jewel','rainbow'].includes(S.eye.id))return S.eye.n;
  if(S.origin==='root'&&S.originKnown)return '근원과 이어진 몸';
  if(S.sealGift)return '근원에서 가져온 업';
  return '';
}

/* ---------------- 싸움에 덧붙는 수 ---------------- */
TACTICS.unshift(
  {id:'m6',has:()=>S.magic===6,n:'제6법을 펼친다',m:f=>3,t:'아직 이름도 없는 마법이 세계를 다시 썼다.'},
  {id:'m5',has:()=>S.magic===5,n:'시간을 접는다',c:{mental:8},m:f=>2.8,t:'5분을 지웠다. 상대가 쓰러진 결과만이 남았다. 우주 어딘가에 그만큼의 부채가 쌓였다.'},
  {id:'m2',has:()=>S.magic===2,n:'평행세계에서 마력을 끌어온다',m:f=>2.6,t:'무수한 세계의 공기에서 마력이 쏟아져 들어왔다.'},
  {id:'m3',has:()=>S.magic===3,n:'물질화된 혼의 마력을 푼다',m:f=>2.3,t:'썩지 않는 혼에서 마르지 않는 마력이 솟았다.'}
);
TACTICS.push(
  {id:'gantai',has:()=>S.details.includes('gantai'),n:'신의 파편에서 권능을 끌어낸다',c:{mp:25},m:f=>1.4,t:'결과를 먼저 정하고, 주문으로 그것을 넓혔다. 시계탑이 보면 사기라고 할 마술이었다.'},
  {id:'tensen',has:()=>S.details.includes('tensen'),n:'세계와 하나가 된다',c:{mental:6},m:f=>1.3,t:'잠시 자신이 어디까지인지 알 수 없었다. 바람도 땅도 당신이었다.'},
  {id:'kenmon',has:()=>S.details.includes('kenmon'),n:'사상반의 특권영역에 접속한다',c:{mp:20},m:f=>1.1,t:'건문이 빛나며, 신대의 선인들이 남긴 술식이 내려왔다.'},
  {id:'esp',has:()=>S.abil.includes('esp'),n:'초능력을 쓴다',c:{hp:4,mental:3},m:f=>1.1,t:'뇌 속의 다른 채널을 돌렸다. 마력은 들지 않았지만 머리가 깨질 듯 아팠다.'},
  {id:'pathlink',has:()=>S.details.includes('pathlink'),n:'동료들과 회로를 잇는다',m:f=>1,t:'여러 사람의 회로가 하나로 이어지며 자연이 응답했다.'},
  {id:'eastern',has:()=>S.depts.includes('eastern'),n:'사상마술을 펼친다',c:{mp:15},m:f=>.7,t:'사상반에서 빌린 술식이 그릇에 그림을 그리듯 세계를 속였다.'},
  {id:'kami',has:()=>S.depts.includes('kami'),n:'신님의 권능을 빌린다',c:{mp:15},m:f=>.7,t:'조직이 모시는 신의 파편이 응답했다.'}
);

/* ---------------- 사건 ---------------- */
const ASIA=['중국','한국','인도','인도네시아','파키스탄','방글라데시','베트남','이란','태국','미얀마','이라크','아프가니스탄','말레이시아','사우디아라비아','튀르키예','필리핀'];
EVENTS.push(
  /* 마술기반: 영지를 지키고, 빼앗고, 새긴다 */
  {id:'ley_war',repeat:true,w:()=>S.mage&&S.ley&&S.age>=22&&S.age<=75&&S.year-(S.lastLey||-99)>=10&&!S.long?.7:0,make:()=>{S.lastLey=S.year;const rec=3+S.ley.str*.5;
    return {eyebrow:'마술기반',img:'witness',title:'영지를 노리는 자',body:`이웃 영지의 마술사가 당신 가문의 영맥을 노리고 있어요. 영지를 잃은 가문은 쇠퇴할 뿐이에요. (영지 등급 ${S.ley.str})`,options:[
      ...fightOpts({foe:'magus',rec},[['영지에서 맞받아친다','마술기반 위에서 싸워요',S.ley.home===S.city?.5:0]],m=>{chosen();if(chance(odds(rec,m))){S.ley.str=Math.min(3,S.ley.str+(chance(.3)?1:0));logx('침입자를 물리쳤다. 오히려 상대의 영맥 일부가 당신 쪽으로 넘어왔다.',{mental:6,rootP:2},'moon',true);}
        else if(chance(.5)){S.ley=null;logx('영지를 빼앗겼다. 마술기반이 새겨진 땅을 잃은 마술은 영맥을 경유해야만 겨우 닿는다.',{mental:-15,wealth:-15},'risk',true);}else{hurt(20);log('간신히 영지를 지켰지만 크게 다쳤다.','risk');}}),
      opt('협회에 중재를 청한다','재산 10',()=>logx('시계탑의 중재로 일이 정리되었다. 비싼 대가였다.',{wealth:-10},'moon'),S.wealth<10)]};}},
  {id:'ley_claim',w:()=>S.mage&&!S.ley&&S.age>=20&&S.age<=60&&!(S.world==='extra'&&S.year>=1970)?.6:0,make:()=>({eyebrow:'마술기반',img:'research',title:'주인 없는 영맥',body:'좋은 영맥이 흐르는 땅은 거의 다른 가문이 차지했어요. 그런데 주인이 약해진 땅을 하나 찾았어요. 그 땅의 풍문과 신앙을 내 마술에 맞게 바꾸면 마술기반을 새길 수 있어요.',options:[
    ...fightOpts({foe:'magus',rec:3.5},[['주인을 꺾고 차지한다','빠르지만 위험해요',0]],m=>{chosen();if(chance(odds(3.5,m))){S.ley={str:1,home:S.city};logx('땅의 주인을 꺾고 마술기반을 새겼다. 이제 이곳의 풍문은 당신 편이다.',{rootP:3,mental:5},'joy',true);}else{hurt(18);log('주인에게 쫓겨났다.','risk');}}),
    opt('긴 시간을 들여 기반을 새긴다','재산 15 · 소문과 괴담을 퍼뜨려요',()=>{chosen();S.ley={str:1,home:S.city};logx('몇 년에 걸쳐 동네의 괴담과 민간신앙을 바꿔 놓았다. "그 집 주인은 불을 다룬다더라."',{wealth:-15},'moon',true);},S.wealth<15),
    opt('자기 몸에만 기반을 품는다','영지 없이 버텨요',()=>log('땅 대신 자신 안에 마술기반을 품기로 했다. 매번 세계를 속여야 하는, 고된 방식이다.','moon'))]})},
  /* 은닉 위반 */
  {id:'expose',repeat:true,w:()=>(S.expose||0)>=40&&S.year-(S.lastExpose||-99)>=3?100:0,make:()=>{S.lastExpose=S.year;const hard=S.expose>=70;
    if(hard)return {eyebrow:'신비의 은닉',img:'sealing',title:'은닉 위반',body:'당신의 마술이 너무 많은 사람의 눈에 띄었어요. 널리 알려진 신비는 힘을 잃고, 협회는 이것을 사형급 범죄로 다뤄요. 집행자가 왔어요.',options:[
      ...fightOpts({foe:'magus',rec:5},[['맞서 싸운다','지면 끝이에요',0]],m=>{chosen();if(chance(odds(5,m))){S.fugitive=true;S.expose=20;log('집행자를 물리쳤다. 이제 협회의 수배자다.','risk',true);}else die('신비의 은닉 위반','협회는 신비를 퍼뜨린 마술사를 용서하지 않았다.');}),
      opt('모든 것을 넘기고 기억 조작에 협조한다','재산 25 · 계위가 떨어져요',()=>{S.expose=0;S.curRank=Math.max(0,S.curRank-1);logx('목격자들의 기억을 지우는 비용을 댔다. 법정과의 기록에 이름이 남았다.',{wealth:-25,mental:-8},'risk');})]};
    return {eyebrow:'신비의 은닉',img:'clocktower',title:'법정과의 경고',body:`목격자가 늘고 있어요(은닉 위험 ${Math.round(S.expose)}). 시계탑 법정과가 경고장을 보냈어요. 이대로라면 집행자가 올 거예요.`,options:[
      opt('정보 조작 비용을 낸다','재산 10',()=>{S.expose=Math.max(0,S.expose-35);logx('법정과가 신문 기사 몇 줄과 목격자 몇 명의 기억을 지웠다.',{wealth:-10},'moon');},S.wealth<10),
      opt('조용히 지낸다','몇 년간 마술을 아껴요',()=>{S.expose=Math.max(0,S.expose-20);logx('한동안 공방 밖에서는 마술을 쓰지 않았다.',{rootP:-3},'moon');}),
      opt('무시한다','다음은 집행자예요',()=>{S.expose+=10;log('경고장을 벽난로에 던졌다.','risk');})]};}},
  /* 연명: 노화를 늦추거나, 몸을 갈아치우거나. 200년을 넘기면 혼이 썩는다 */
  {id:'longevity',w:()=>S.mage&&!S.long&&!S.apostle&&S.age>=60&&S.age<=85&&S.year>S.lastJY?1.5:0,make:()=>{const swap=S.abil.includes('insect')||S.details.includes('puppeteer')||S.depts.includes('create');
    return {eyebrow:'연명',img:'research',title:'끝나지 않은 연구',body:'몸이 늙어 가요. 연구는 아직 끝나지 않았어요. 노화를 늦추는 마술로는 백 년 남짓이 한계고, 몸을 갈아치워도 이백 년을 넘으면 혼이 썩기 시작해요.',options:[
      opt('노화를 늦추는 마술을 건다','마력 40 · 수명이 늘어나요',()=>{chosen();S.slowAge=true;S.leBonus+=15;S.wormBody=true;logx('몸의 시간을 조금씩 늦추는 술식을 새겼다.',{mental:4},'moon',true);},S.mp<40),
      opt('몸을 갈아치운다',swap?'충술·인형·창조 · 사람에서 멀어져요':'충술, 색위의 인형사, 창조 계통 중 하나가 필요해요',()=>{chosen();S.long=true;S.longMage=true;S.endYear=S.birthYear+ri(150,200);S.ill=null;logx(S.abil.includes('insect')?'몸을 벌레로 갈아 끼우기 시작했다. 거울을 보지 않게 되었다.':'새로 만든 몸으로 의식을 옮겼다. 옛 몸은 공방 구석에 앉혀 두었다.',{mental:-20,health:40},'risk',true);},!swap),
      opt('사람의 수명을 받아들인다','',()=>logx('남은 시간을 받아들이기로 했다.',{mental:6},'joy'))]};}},
  /* 나선관: 동양의 마술협회 */
  {id:'rasen',w:()=>S.mage&&!S.academy&&ASIA.includes(S.country.n)&&S.age>=15&&S.age<=26?4:0,make:()=>({eyebrow:'나선관',img:'research',title:'동쪽의 마술협회',body:'서양에 시계탑이 있다면, 동양에는 나선관이 있어요. 지구와 융합한 거대한 예장 「사상반」에 접속해 마술을 빌려 쓰는 곳. 회원제 도서관 같은 곳이에요.',options:[
    opt('나선관에 들어간다','사상마술을 배워요',()=>{chosen();S.academy='나선관';fate(2,'나선관 입문');learnDept('eastern','스승에게서 사상건문을 이어받았다.');}),
    opt('시계탑을 노린다','서양으로 가요',()=>log('나선관의 초대를 거절했다.','moon'))]})},
  /* 일본의 토착 마술 조직 */
  {id:'kami_org',w:()=>S.country.n==='일본'&&(S.mage||S.aware&&S.circuits>=3)&&!S.depts.includes('kami')&&S.age>=15&&S.age<=35&&!S.church?1.5:0,make:()=>({eyebrow:'일본 마술',img:'era_japan',title:'신님을 공유하는 사람들',body:'겉으로는 야쿠자처럼 사는 조직이 당신을 불렀어요. 그들은 신의 파편을 모두가 나눠 섬기고, 회로를 서로 이어 마술을 써요. 근원은 포기했지만, 결과만큼은 확실한 마술이에요.',options:[
    opt('조직에 들어간다','일본 마술을 배워요',()=>{chosen();becomeMage(S.teacher||'토착 마술 조직');learnDept('kami','조직이 섬기는 신의 파편에 처음 닿았다.');fx({wealth:5});}),
    opt('거리를 둔다','',()=>log('조직의 명함을 서랍 깊숙이 넣었다.','moon'))]})},
  /* 초능력: 채널을 다루는 법 */
  {id:'esp_ch',w:()=>S.abil.includes('esp')&&S.age>=8&&S.age<=20&&!S.espDone?6:0,make:()=>{S.espDone=true;return {eyebrow:'초능력',img:'latent',title:'뇌 속의 다른 채널',body:'평범한 사람의 채널과 이능의 채널이 따로 있어요. 둘을 마음대로 바꾸지 못하면 세상은 당신을 이상한 사람이라 불러요.',options:[
    opt('채널을 바꾸는 법을 익힌다','시간이 걸리지만 안전해요',()=>{chosen();logx('스위치를 켜고 끄듯 이능을 다루게 되었다.',{mental:6},'joy');}),
    opt('이능의 채널에 머문다','힘은 세지지만',()=>{chosen();S.jexp+=.4;logx('이능의 채널을 켜 둔 채 살았다. 사람들이 당신을 피하기 시작했다.',{mental:-15},'risk',true);})]};}},
  /* 신대의 마술과 맺는 계약(인대에서) */
  {id:'divine_pact',w:()=>S.mage&&S.era!=='ancient'&&!S.pactDone&&S.age>=20&&S.age<=60&&(S.depts.includes('arch')||S.depts.includes('lore'))?.5:0,make:()=>{S.pactDone=true;return {eyebrow:'신대의 마술',img:'era_ancient',title:'방황해의 환수',body:'신대의 신비가 남은 곳에서 한 환수가 계약을 제안해요. 인대의 마술이 평면이라면 신대의 마술은 입체예요. 하지만 인간의 회로가 그것을 견딜까요?',options:[
    opt('계약한다','신대의 마술을 써요 · 회로가 비명을 질러요',()=>{chosen();S.jexp+=1;logx('한 소절로 열 소절을 넘는 마술을 썼다. 회로가 타들어 가는 소리가 들렸다.',{hp:-25,health:-10,rootP:8},'moon',true);if(chance(.3)){S.circuits=Math.max(3,Math.round(S.circuits*.7));log('계약이 끊긴 뒤, 회로 일부가 다시는 열리지 않았다.','risk');}}),
    opt('거절한다','',()=>log('환수는 아쉬운 듯 안개 속으로 사라졌다.','moon'))]};}},
  /* 제2마법: 보석옹의 후계 */
  {id:'zel_heir',w:()=>!S.magic&&S.done.includes('zelretch')&&S.items.includes('zelretch')&&S.age<=75?1.2:0,make:()=>({eyebrow:'마법',img:'end_root',title:'보석옹의 마지막 시험',body:'젤레치가 별이 가득한 방으로 당신을 불렀어요. 방 한가운데 나무 의자가 떠 있어요. 저 의자에 앉아 평행세계를 운영할 수 있다면, 그의 마법을 이어받을 수 있어요. 대부분의 제자는 여기서 폐인이 됐어요.',options:[
    ...fightOpts({foe:'counter',rec:8},[['의자에 앉는다','제2마법의 계승',0]],m=>{chosen();if(chance(odds(8,m))){gainMagic(2,'의자에 앉는 순간 무수한 세계가 한꺼번에 보였다. 정신이 부서지지 않은 채로 다시 일어섰다.');}
      else if(chance(.4))die('평행세계의 틈','무수한 세계 사이에서 자신이 누구였는지 잊어버렸다.');else logx('무심코 우주 하나를 멸망시키는 경험을 했다. 한 달 동안 구토가 멈추지 않았다.',{mental:-30},'risk',true);}),
    opt('사양한다','지금의 삶이 좋아요',()=>log('노인은 껄껄 웃으며 "현명하군"이라고 말했다.','moon'))]})},
  /* 제5마법: 아오자키 방계 */
  {id:'aozaki',w:()=>S.aozaki&&!S.magic&&S.age>=16&&S.age<=20?100:0,make:()=>{S.aozaki=false;return {eyebrow:'아오자키',img:'jr_misaki',title:'조부의 선택',body:'아오자키 가문의 조부가 마법의 후계자를 고르려 해요. 마법은 한 사람에게만 넘어가요. 선택받지 못한 형제자매는 평생 그 사실을 안고 살아요.',options:[
    ...fightOpts({foe:'counter',rec:3},[['후계자의 시험을 받는다','제5마법의 계승',0]],m=>{chosen();if(chance(odds(3,m)))gainMagic(5,'조부는 오래 당신을 보다가 고개를 끄덕였다. 첫 수업은 무심코 우주를 멸망시키는 것이었다.');else logx('마법은 다른 형제에게 넘어갔다. 그 뒤로 집안의 공기가 조금 달라졌다.',{mental:-20,rootP:10},'risk',true);}),
    opt('후계를 사양한다','마법 대신 자유를',()=>logx('후계를 사양하고 집을 떠났다.',{mental:5},'moon'))]};}}
);
/* 깨끗한 성배로 제3마법을: 호문쿨루스나 하늘의 드레스가 있으면 */
const _grailChoice=grailChoice;
grailChoice=function(war){
  _grailChoice(war);
  const p=S.pending;
  if(p&&p.title==='만능의 소원기'&&!S.magic&&(S.race==='homun'||S.items.includes('dress')))
    p.options.unshift(...fightOpts({foe:'counter',rec:4.5,core:S.race==='homun'?.8:0,noTac:true},[['제3마법을 일으킨다','하늘의 잔 · 실패하면 혼이 성배에 녹아요',0]],m=>{chosen();
      if(chance(odds(4.5,m)))gainMagic(3,'성배의 중추에 손을 댔다. 혼이 무게를 갖는 감각이 온몸을 채웠다.');
      else if(chance(.4))die('성배의 중추','혼이 물질이 되기 전에 성배 속으로 녹아내렸다.');
      else logx('기적의 문턱에서 튕겨 나왔다. 성배는 빛을 잃었다.',{hp:-30,mental:-15},'risk',true);}));
};
/* 아오자키 방계로 태어나기: 월희 세계선의 일본 마술사 가문에서 드물게 */
const _eraSetup=eraSetup;
eraSetup=function(P){
  _eraSetup(P);
  if(S.worldPick==='tsuki'&&S.country.n==='일본'&&S.birth==='magus'&&chance(S.city==='미사키 마을'?.2:.04)){S.aozaki=true;S.famType='아오자키 가문';log('마법사의 피를 이은 아오자키 가문의 아이로 태어났다. 이 집안에는 다섯 번째 마법이 있다.','moon',true);}
};
