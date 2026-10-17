'use strict';
/* =========================================================
   Fate/stay night
   - 호무라바라의 나날(2001~2003): 궁도부, 에미야 가의 저녁, 신지, 린의 비밀, 눈 속의 소녀
   - 제5차 성배전쟁(2004): Fate / Unlimited Blade Works / Heaven's Feel, 그리고 홀로 성배를 노리는 길
   - 쓰러지면 「타이거 도장」의 힌트, 살아남으면 되풀이되는 나흘(2005)
   ========================================================= */
Object.assign(CHARS,{
  taiga:{n:'후지무라 타이가',img:'ch_taiga',s:'호무라바라 학원의 영어 교사이자 궁도부 고문. 별명 「후유키의 호랑이」. 에미야 가에 밥을 먹으러 오는 시끄럽고 다정한 어른. 호랑이라고 부르면 화낸다. 밝고 요란한 말투.',sc:[
    ['궁도장. 타이가 선생님이 죽도를 휘두르며 부원들을 다그치고 있어요.','"자자, 집중! 활은 마음으로 쏘는 거야! ……어머, 너 오늘도 왔구나?"',[['열심히 하겠다고 한다','"좋아 좋아! 그런 학생 정말 좋아해!"',10],['호랑이라고 부른다','"호랑이라고 부르지 마아아!" 죽도가 날아왔다.',4],['간식을 건넨다','"……너 정말 좋은 애구나." 선생님이 진지하게 감동했다.',12]]],
    ['에미야 가의 저녁. 타이가가 밥그릇을 내밀고 있어요.','"시로~ 한 공기 더! 아, 너도 같이 먹을래?"',[['같이 먹는다','시끄럽고 따뜻한 저녁이었다.',12],['설거지를 돕는다','"착하다 착해. 시로한테도 좀 배우라고 해야지."',8],['선생님은 왜 여기서 밥을 먹냐고 묻는다','"키리츠구 씨한테 시로를 부탁받았거든." 선생님은 잠깐 먼 곳을 봤다.',10]]]]},
  shinji:{n:'마토 신지',img:'ch_shinji',s:'사쿠라의 오빠. 마토 가문의 장남이지만 마술회로가 없다. 자존심이 강하고 비뚤어졌으며 열등감이 깊다. 빈정대는 말투.',sc:[
    ['복도. 신지가 거만하게 앞을 막아요.','"너, 요즘 사쿠라랑 자주 어울린다며? 분수를 알라고."',[['맞받아친다','"……흥, 재미없는 녀석." 신지는 혀를 차고 지나갔다.',2],['신지를 치켜세운다','"뭐, 뭐야. 당연한 걸 말하고 있어." 신지는 묘하게 기뻐했다.',10],['사쿠라에게 잘해 주라고 한다','신지의 얼굴이 일그러졌다. "네가 뭘 알아."',0]]]]},
  rider:{n:'라이더',img:'ch_rider',s:'제5차 성배전쟁의 라이더. 진명 메두사. 안대로 석화의 마안을 가린 장신의 여성. 말수가 적고 담담하며, 진짜 마스터인 사쿠라를 아낀다. 정중하고 짧은 말투.',sc:[
    ['마토 저택 근처의 밤. 안대를 한 여자가 가로등 위에 서 있어요.','"……당신이 사쿠라가 말한 사람이군요."',[['사쿠라를 지키겠다고 한다','"그렇다면, 저도 당신을 적으로 대하지 않겠습니다."',14],['정체를 묻는다','"말할 필요는 없습니다."',3],['키가 크다고 말한다','"……신경 쓰고 있으니 말하지 마세요." 라이더가 고개를 돌렸다.',8]]]]},
  lancer:{n:'랜서',img:'ch_lancer',s:'제5차 성배전쟁의 랜서. 진명 쿠 훌린. 아일랜드의 대영웅. 호쾌하고 싸움을 즐기며 틈만 나면 낚시를 한다. 거친 반말과 농담.',sc:[
    ['항구의 방파제. 푸른 머리의 남자가 낚싯대를 드리우고 있어요.','"뭐야, 꼬마. 오늘은 싸울 기분 아니야. 고기나 낚자."',[['옆에 앉아 낚시를 한다','"하하, 너 꽤 마음에 드는데."',12],['왜 싸우냐고 묻는다','"강한 놈하고 싸우고 싶어서. 그게 다야."',8],['도망친다','"쳇, 겁쟁이."',0]]]]}
});
IMGS.push(...[
  ['ch_taiga','후지무라 타이가','fujimura taiga, 1girl, brown short hair, green striped shirt, tiger strap, bamboo sword, cheerful, upper body'],
  ['ch_shinji','마토 신지','matou shinji, 1boy, wavy blue hair, school uniform, smug expression, upper body'],
  ['ch_rider','라이더','medusa (fate), rider (fate), 1girl, very long purple hair, blindfold, black dress, tall, upper body, night'],
  ['ch_lancer','랜서','cu chulainn (fate), lancer (fate), 1boy, blue hair, ponytail, red eyes, blue bodysuit, red spear, grin, upper body']
].map(a=>({id:a[0],n:a[1],p:a[2]})));
ACH[0][2].push(
  ['sn_solo','홀로 쥔 성배','제5차 성배전쟁을 혼자 끝까지 이겼다.',10],
  ['sn_illya','눈의 소녀를 구하다','아인츠베른 성에서 이리야를 구했다.',8],
  ['sn_hf_bad','정의의 편','그림자의 정체를 알고도 사쿠라를 베었다.',4],
  ['sn_hollow','되풀이되는 나흘','전쟁이 끝난 뒤의 나흘을 끝까지 되풀이했다.',8],
  ['tiger_dojo','타이거 도장 개근','제5차 성배전쟁에서 세 번 쓰러지고 도장에 불려 갔다.',3]
);
ACH_ALL.push(...ACH[0][2].slice(-5));

/* 루트별 다섯 밤. rec는 서번트 싸움 기준(warOdds), hint는 쓰러졌을 때 타이거 도장의 한마디 */
const SN={
  fate:{n:'Fate',hero:'saber',st:[
    {n:'교정의 창',rec:2.6,foe:'servant',vs:'랜서',talk:'saber',d:'붉은 창이 달빛을 갈라요. 푸른 창병 랜서가 목격자를 지우러 쫓아와요.',hint:'랜서는 목격자를 살려 두지 않아. 처음부터 혼자 다니지 마!'},
    {n:'눈길의 거인',rec:3.6,foe:'servant',vs:'버서커',talk:'illya',special:'illya',d:'눈 내리는 언덕길. 하얀 소녀가 웃어요. "죽여, 버서커." 잿빛 거인이 울부짖어요.',hint:'버서커는 열두 번 죽여야 쓰러져. 이리야와 친해지면 싸우지 않아도 되는 밤도 와!'},
    {n:'산문의 검객',rec:3.2,foe:'servant',vs:'아사신',talk:'saber',d:'류도사의 산문. 긴 칼을 든 사무라이가 세 갈래의 칼날을 한꺼번에 휘둘러요.',hint:'츠바메가에시는 피할 수 없어. 정면 말고 다른 수를 찾아!'},
    {n:'마녀의 신전',rec:3.4,foe:'magus',vs:'캐스터',talk:'shirou',d:'산 위의 절. 마녀 캐스터와 그 마스터인 무뚝뚝한 교사가 기다려요.',hint:'캐스터의 신전에서 마술 대결은 손해야. 마스터를 노려!'},
    {n:'황금의 왕',rec:4.4,foe:'servant',vs:'길가메시',talk:'saber',special:'mana',d:'10년 전 전쟁에서 남은 황금의 영웅왕. 하늘을 메운 보물의 비가 쏟아져요.',hint:'세이버와의 신뢰가 모자라면 황금의 왕은 넘을 수 없어. 대화를 소홀히 하지 마!'}]},
  ubw:{n:'Unlimited Blade Works',hero:'rin',st:[
    {n:'학교의 결계',rec:2.6,foe:'servant',vs:'라이더',talk:'rin',special:'shinji',d:'학교 전체를 녹이는 붉은 결계. 신지와 라이더의 짓이에요.',hint:'라이더보다 신지를 먼저! 린은 결계의 기점을 알고 있어.'},
    {n:'빼앗긴 검',rec:3.2,foe:'magus',vs:'캐스터',talk:'rin',d:'캐스터가 계약을 끊는 단검으로 세이버를 빼앗았어요.',hint:'캐스터의 단검은 계약을 끊어. 서번트만 앞세우지 마!'},
    {n:'붉은 궁병의 질문',rec:3.4,foe:'servant',vs:'아처',talk:'archer',special:'ideal',d:'아처가 린을 떠나 칼을 겨눠요. "그 이상은 결국 너를 죽인다."',hint:'아처의 질문에 거짓으로 답하지 마!'},
    {n:'아인츠베른 성',rec:3.6,foe:'servant',vs:'버서커와 길가메시',talk:'illya',special:'saveIllya',d:'숲속의 성. 황금의 왕이 버서커를 몰아붙이고 있어요. 이리야가 위험해요.',hint:'이리야를 구하면 결말이 달라져!'},
    {n:'무한의 검제',rec:4.2,foe:'servant',vs:'길가메시',talk:'rin',d:'끝없는 검이 꽂힌 언덕. 가짜가 진짜를 넘어서는 싸움.',hint:'린과의 신뢰가 없으면 마지막 언덕에서 쓰러져.'}]},
  hf:{n:"Heaven's Feel",hero:'sakura',st:[
    {n:'그림자',rec:3,foe:'monster',vs:'검은 그림자',talk:'sakura',d:'밤마다 사람이 사라져요. 검은 그림자가 서번트까지 삼키고 있어요.',hint:'그림자에 닿으면 끝이야. 밤에 혼자 다니지 마!'},
    {n:'벌레의 노인',rec:3.4,foe:'servant',vs:'진 아사신',talk:'rider',d:'마토 조켄이 불러낸 해골 가면의 암살자가 심장을 노려요.',hint:'진 아사신은 심장을 빼앗아. 정면 대결은 피해!'},
    {n:'검게 물든 기사왕',rec:4,foe:'servant',vs:'세이버 얼터',talk:'sakura',d:'그림자에 삼켜진 세이버가 검은 갑옷을 입고 길을 막아요.',hint:'검은 세이버의 마력은 끝이 없어. 라이더와 손을 잡아!'},
    {n:'사쿠라의 진실',rec:0,special:'sakura',talk:'sakura',d:'그림자의 정체는 사쿠라였어요. 감독관 코토미네는 그녀를 죽여야 한다고 말해요.',hint:'사쿠라를 믿어 주는 사람이 없으면 아무도 돌아오지 못해.'},
    {n:'대성배의 동굴',rec:4.6,foe:'servant',vs:'검게 물든 사쿠라',talk:'illya',d:'류도사 지하의 대공동. 검게 물든 사쿠라와 열려 가는 대성배.',hint:'이리야와의 신뢰가 트루 엔딩의 열쇠야.'}]},
  solo:{n:'단독 참전',hero:null,st:[
    {n:'첫 교전',rec:2.8,foe:'servant',vs:'랜서',d:'항구에서 랜서와 마주쳤어요. 정찰이라기엔 살기가 짙어요.',hint:'혼자 싸우면 모두가 적이야. 서두르지 마!'},
    {n:'학교의 결계',rec:3.1,foe:'magus',vs:'라이더와 신지',d:'학교에 피를 빠는 결계가 쳐졌어요.',hint:'라이더의 마스터는 마술사가 아니야. 마스터를 노려!'},
    {n:'류도사 공략',rec:3.5,foe:'magus',vs:'캐스터와 아사신',d:'산 위의 요새. 마녀와 문지기가 버티고 있어요.',hint:'산문은 정면으로 넘을 수 없어.'},
    {n:'아인츠베른의 숲',rec:4,foe:'servant',vs:'버서커',d:'숲속 성의 거인. 열두 번 죽여야 쓰러져요.',hint:'버서커는 같은 공격에 두 번 죽지 않아.'},
    {n:'교회 지하',rec:4.5,foe:'servant',vs:'길가메시',special:'kirei',d:'감독관의 교회 지하에 숨겨진 여덟 번째 서번트, 황금의 왕.',hint:'감독관을 믿지 마!'}]}
};
function snCore(rt){
  const R_=SN[rt];
  return (S.snMaster?.5:0)+(S.servant?(S.servant.tier-3)*.8+bond('sv:'+S.servant.name)/60:0)+(R_.hero?bond(R_.hero)/60:0);
}
function snWar(){
  S.snActive=true;story('제5차 성배전쟁','plan');scene('grail_war');
  const can=S.mage||S.circuits>=3;
  S.pending={eyebrow:'2004년 2월 · 후유키',img:'grail_war',title:'그날 밤, 교정에서',body:'늦은 밤의 학교. 운동장에서 붉은 궁병과 푸른 창병이 부딪치고 있어요. 일곱 명의 마스터와 일곱 서번트, 제5차 성배전쟁이 시작됐어요.',options:[
    opt('자신의 서번트를 소환한다',can?'마스터로 참전해요':'마술회로가 필요해요',()=>{chosen();S.snMaster=true;S.warCount++;S.seals=3;const sv=rollServant(S.wealth>=60);S.servant=sv;fate(2,'성배전쟁 참전');
      log(`창고 바닥에 그린 마법진이 빛났다. 소환에 응한 것은 ${sv.cls}, 진명 「${sv.name}」. 원래 누군가의 자리였을 일곱 번째 자리를 당신이 차지했다.`,'grail',true);major({kind:'summon',sv,war:'제5차 성배전쟁',img:'summon'});snAlly();},!can),
    opt('시로를 따라간다','에미야를 내버려 둘 수 없어요',()=>{chosen();meet('shirou');addBond('shirou',8);meet('saber');log('시로를 따라 달렸다. 그날 밤 창고에서 푸른 기사가 나타나는 것을 보았다.','grail',true);snPickRoute();}),
    opt('토오사카에게 알린다','이건 그녀의 일이에요',()=>{chosen();meet('rin');addBond('rin',8);log('토오사카 린을 찾아갔다. "……너, 봤구나." 그녀가 한숨을 쉬었다.','grail',true);snPickRoute();}),
    opt('못 본 척 집에 간다','휘말리고 싶지 않아요',()=>{if(chance(.4)){log('집으로 돌아갔다. 그 겨울, 도시에서 무슨 일이 있었는지 끝내 몰랐다.','life');S.snActive=false;story('제5차 성배전쟁','fail');}else{log('돌아서는 순간, 창병의 붉은 눈이 이쪽을 향했다.','risk',true);becomeAware();snPickRoute();}})
  ]};
}
/* 마스터가 됐다면: 누구와 손잡을까 */
function snAlly(){
  ['saber','rin','sakura'].forEach(meet);
  const h=bond('sakura');
  S.pending={eyebrow:'동맹',img:'grail_war',title:'누구와 손잡을까요',body:'일곱 마스터 중 몇은 같은 학교에 있어요. 혼자 싸울지, 손잡을지 정해요.',options:[
    opt('시로와 세이버와 손잡는다 (Fate)',`세이버 신뢰 ${bond('saber')} · 시로 신뢰 ${bond('shirou')}`,()=>{chosen();snStage('fate',0);}),
    opt('린과 아처와 손잡는다 (Unlimited Blade Works)',`린 신뢰 ${bond('rin')}`,()=>{chosen();snStage('ubw',0);}),
    opt("사쿠라를 지킨다 (Heaven's Feel)",h>=20?`사쿠라 신뢰 ${h}`:`사쿠라와의 신뢰가 더 필요해요 (${h}/20)`,()=>{chosen();snStage('hf',0);},h<20),
    opt('홀로 성배를 노린다','모두가 적 · 이기면 성배는 당신의 것',()=>{chosen();log('누구와도 손잡지 않기로 했다. 성배는 하나뿐이다.','grail',true);snStage('solo',0);})
  ]};
}
function snPickRoute(){
  ['saber','rin','sakura'].forEach(meet);
  const h=bond('sakura');
  S.pending={eyebrow:'갈림길',img:'grail_war',title:'누구의 곁에 설까요',body:'이 전쟁이 어떻게 끝날지는 당신이 누구의 곁에 서느냐에 달렸어요.',options:[
    opt('세이버와 시로 (Fate)',`세이버 신뢰 ${bond('saber')} · 시로 신뢰 ${bond('shirou')}`,()=>{chosen();snStage('fate',0);}),
    opt('린과 아처 (Unlimited Blade Works)',`린 신뢰 ${bond('rin')}`,()=>{chosen();snStage('ubw',0);}),
    opt("사쿠라 (Heaven's Feel)",h>=20?`사쿠라 신뢰 ${h}`:`사쿠라와의 신뢰가 더 필요해요 (${h}/20)`,()=>{chosen();snStage('hf',0);},h<20)
  ]};
}
function snStage(rt,i){
  const R_=SN[rt];S.snRoute=rt;
  if(i>=R_.st.length){snEnd(rt);return;}
  const st=R_.st[i];
  story(`${R_.n} · ${st.n}`,'plan');
  if(st.special==='sakura'){snSakura(i);return;}
  const go=()=>snFight(rt,i);
  const who=st.talk?stageTalker(st.talk,i):(S.servant?'sv:'+S.servant.name:null);
  if(who)talk(who,`제5차 성배전쟁 ${R_.n} ${i+1}/${R_.st.length} 「${st.n}」 직전. ${st.d} 상대는 ${st.vs}.`,go);else go();
}
function snFight(rt,i){
  const R_=SN[rt],st=R_.st[i];let core=snCore(rt),pre='';
  if(st.special==='mana'){if(bond('saber')>=35){core+=.4;pre=' 세이버와 마음이 이어져 있어요.';}else{core-=.6;pre=' 세이버의 마력이 바닥나 있어요.';}}
  if(st.special==='kirei'&&S.kireiWary){core+=.4;pre=' 감독관을 처음부터 의심해 두었어요.';}
  if(st.special==='ideal'){snIdeal(rt,i);return;}
  const base=[['정면으로 맞선다','힘으로',0]];
  if(R_.hero)base.push([`${charInfo(R_.hero).n}을(를) 믿고 맡긴다`,`신뢰 ${bond(R_.hero)}`,bond(R_.hero)/35]);
  base.push(['함정을 파고 기다린다','신중하게',.3]);
  if(st.special==='shinji'&&(S.shinjiFriend||bond('shinji')>=15))base.push(['신지를 설득한다',`신지 신뢰 ${bond('shinji')}`,.8]);
  const extra=[];
  if(st.special==='illya'&&bond('illya')>=15)extra.push(opt('이리야와 이야기한다',`이리야 신뢰 ${bond('illya')} · 싸우지 않아요`,()=>{chosen();addBond('illya',10);log('"……이상한 사람." 이리야는 버서커를 물리고 눈 속으로 돌아갔다. 오늘 밤은 싸우지 않아도 됐다.','grail',true);story(`${R_.n} · ${st.n}`,'ok');snStage(rt,i+1);}));
  if(st.special==='saveIllya')extra.push(...fightOpts({foe:'servant',rec:st.rec+.5,core,war:true,noTac:true},[['이리야를 구하러 뛰어든다','더 위험하지만 결말이 달라져요',0]],m=>{S.illyaTry=true;snResolve(rt,i,m);}));
  S.pending={eyebrow:`${R_.n} · ${i+1}/${R_.st.length}`,img:'grail_war',title:st.n,body:`${st.d} 상대는 ${st.vs}.${pre}${S.servant&&S.seals?` 영주 ${S.seals}획이 남아 있어요. 위기 때 자동으로 써요.`:''}`,
    options:[...extra,...fightOpts({foe:st.foe,rec:st.rec,core,war:true},base,m=>snResolve(rt,i,m))]};
}
/* UBW: 아처의 질문 */
function snIdeal(rt,i){
  const R_=SN[rt],st=R_.st[i];
  S.pending={eyebrow:`${R_.n} · ${i+1}/${R_.st.length}`,img:'grail_war',title:st.n,body:'아처가 묻어요. "남을 구하겠다는 이상. 그것이 빌린 것이라는 걸 알고도 붙잡겠나?"',options:[
    opt('빌린 것이라도 아름다운 이상이라고 답한다','물러서지 않아요',()=>{addBond('archer',10);addBond('rin',6);log('"……그런가. 그렇다면 그 답을 증명해 봐라."','grail',true);snFightAfterIdeal(rt,i,.5);}),
    opt('이상 따위 버리겠다고 답한다','현실을 택해요',()=>{addBond('archer',-5);log('아처는 실망한 듯 웃었다. "그렇다면 너는 여기서 끝이다."','grail');snFightAfterIdeal(rt,i,-.4);}),
    opt('린을 지키는 게 먼저라고 답한다','지금 곁의 사람을',()=>{addBond('rin',12);log('린의 얼굴이 붉어졌다. 아처는 짧게 웃었다.','grail',true);snFightAfterIdeal(rt,i,.2);})
  ]};
}
function snFightAfterIdeal(rt,i,bonus){
  const R_=SN[rt],st=R_.st[i],core=snCore(rt)+bonus;
  S.pending={eyebrow:`${R_.n} · ${i+1}/${R_.st.length}`,img:'grail_war',title:st.n,body:`${st.d} 상대는 ${st.vs}.`,options:fightOpts({foe:st.foe,rec:st.rec,core,war:true},[['정면으로 맞선다','답을 증명해요',0],['린과 함께 싸운다',`신뢰 ${bond('rin')}`,bond('rin')/35]],m=>snResolve(rt,i,m))};
}
/* HF: 사쿠라의 진실 */
function snSakura(i){
  const R_=SN.hf;
  S.pending={eyebrow:`${R_.n} · ${i+1}/${R_.st.length}`,img:'grail_fire',title:'사쿠라의 진실',body:'그림자의 정체는 사쿠라였어요. 감독관 코토미네는 그녀를 죽여야 한다고 말해요. 사쿠라는 울면서 "저를 죽여 주세요"라고 해요.',options:[
    opt('사쿠라를 지킨다','정의의 편을 그만둬요',()=>{chosen();S.hfProtect=true;addBond('sakura',15);log('"나는 사쿠라의 편이다." 그 한마디로 정의의 편이기를 그만두었다.','grail',true);story(`${R_.n} · 사쿠라의 진실`,'ok');snStage('hf',i+1);}),
    opt('이리야에게 도움을 청한다','다른 길을 찾아요',()=>{chosen();addBond('illya',12);addBond('sakura',6);log('이리야가 조용히 고개를 끄덕였다. "언니로서, 할 수 있는 일을 할게."','grail',true);story(`${R_.n} · 사쿠라의 진실`,'ok');snStage('hf',i+1);}),
    opt('사쿠라를 벤다','도시를 지키기 위해',()=>{chosen();unlock('sn_hf_bad');endWar();S.snActive=false;story(`${R_.n} · 사쿠라의 진실`,'fail');logx('칼끝이 떨렸다. 사쿠라는 마지막에 웃었다. 그 뒤로 당신은 웃지 않았다. BAD END · 정의의 편.',{mental:-40},'death',true);major({kind:'gold',img:'grail_fire',eyebrow:"Heaven's Feel",title:'정의의 편',body:'도시는 지켜졌어요. 당신이 지키고 싶었던 것만 빼고.'});})
  ]};
}
function snResolve(rt,i,mod){
  chosen();
  const R_=SN[rt],st=R_.st[i];
  if(S.servant&&S.seals>0&&warOdds(st.rec,mod)<.5){S.seals--;mod+=.6;log(`영주 1획을 사용했다. "${pick(['이겨라','보구를 해방해','물러서지 마'])}!"`,'grail');}
  if(chance(warOdds(st.rec,mod))){
    story(`${R_.n} · ${st.n}`,'ok');log(`「${st.n}」, ${st.vs}을(를) 넘었다.`,'grail',true);fate(2,`${R_.n} ${i+1}단계`);
    if(st.special==='saveIllya'&&S.illyaTry){S.illyaSaved=true;unlock('sn_illya');addBond('illya',15);log('쓰러지는 거인의 그림자 아래서 이리야의 손을 붙잡고 성을 빠져나왔다.','grail',true);}
    snStage(rt,i+1);return;
  }
  story(`${R_.n} · ${st.n}`,'fail');
  S.snFail=(S.snFail||0)+1;
  if(chance((rt==='hf'?.5:rt==='solo'?.45:.35)*(S.snMaster?1:.5))){
    S.deadEnd=`${R_.n} · ${st.n}`;S.deadText=rt==='hf'?'검은 그림자가 발밑에서 솟아올랐다. 마지막으로 본 것은 사쿠라의 울 것 같은 얼굴이었다.':`${st.vs}을(를) 넘지 못했다. 그 밤은 끝나지 않았다.`;
    PROFILE.snDead=(PROFILE.snDead||0)+1;saveProfile();
    die('제5차 성배전쟁',S.deadText);
    if(!S.alive){log(`DEAD END · 타이거 도장: "${st.hint}"`,'death');if(PROFILE.snDead>=3)unlock('tiger_dojo');return;}
  }
  if(S.snFail>=2){log(`전쟁은 당신 없이 끝났다. 어떤 결말이었는지는 소문으로만 들었다. (도장의 한마디: "${st.hint}")`,'risk',true);S.snActive=false;endWar();return;}
  hurt(20);log('크게 다쳤지만 살아남았다. 싸움은 계속된다.','risk',true);snStage(rt,i+1);
}
function snEnd(rt){
  S.snActive=false;S.snDone=true;story('제5차 성배전쟁','ok');
  if(rt==='solo'){
    unlock('sn_solo');S.grailWin=true;fate(4,'성배전쟁 승리');endWar();S.grailQ='hgw5';
    log('마지막 서번트가 쓰러졌다. 류도사 지하에서 대성배가 열리기 시작했다.','grail',true);
    major({kind:'gold',img:'grail_war',eyebrow:'제5차 성배전쟁',title:'홀로 쥔 성배',body:'일곱 명 중 마지막 한 사람이 되었어요. 하지만 후유키의 성배는……'});return;
  }
  log('후유키의 성배는 「이 세상 모든 악」에 물들어 있었다. 이것으로는 누구도 근원에 닿을 수 없다. 성배는 부서져야 했다.','grail');
  endWar();
  if(rt==='fate'){
    unlock('sn_fate_true');log('세이버는 성배를 부수고, 아침 햇살 속에서 원래의 시대로 돌아갔다. 시로는 그녀를 잊지 않고 살아가기로 했다.','grail',true);
    if(bond('saber')>=45){unlock('sn_fate_le');log('아득한 시간이 흐른 뒤, 아발론의 낙원에서 두 사람이 다시 만났다고 한다.','grail',true);}
  } else if(rt==='ubw'){
    unlock('sn_ubw_true');log('미래의 자신을 넘어선 시로는 린과 함께 런던의 시계탑으로 떠났다.','grail',true);
    if(bond('saber')>=20&&bond('rin')>=45&&S.illyaSaved){unlock('sn_ubw_good');log('그리고 사라진 줄 알았던 세이버가 남아, 시끄러운 일상이 시작되었다. 구해 낸 이리야도 가끔 놀러 왔다.','grail',true);}
    if(S.mage&&!S.academy&&bond('rin')>=50){S.academy='시계탑';log('린의 권유로 함께 런던의 시계탑에 들어갔다.','moon',true);}
  } else {
    if(S.hfProtect&&bond('sakura')>=55&&bond('illya')>=20){unlock('sn_hf_true');log('이리야가 제3마법으로 시로의 혼을 붙잡았다. 인형의 몸으로 돌아온 시로와 사쿠라는 벚꽃 아래서 봄을 맞았다.','grail',true);}
    else{unlock('sn_hf_normal');log('시로는 사쿠라를 구하고 돌아오지 않았다. 사쿠라는 그 집에서 오래도록 그를 기다렸다.','grail',true);}
  }
  scene('homurahara');
  major({kind:'gold',img:'homurahara',eyebrow:'제5차 성배전쟁',title:`${SN[rt].n} 루트를 끝까지 지켜보았다`,body:'전쟁은 끝났어요. 당신의 인생은 계속돼요.'});
}

/* ---------------- 호무라바라의 나날과 그 뒤 ----------------
   2001~2003년에는 한 해에 학교 장면이 두 번까지 더 일어난다 */
function snExtraScene(){
  if(S.route!=='sn'||S.year<2001||S.year>2003||S.pending||!S.alive)return false;
  if(S.snSceneYear!==S.year){S.snSceneYear=S.year;S.snSceneN=0;}
  if(S.snSceneN>=2)return false;
  const list=EVENTS.filter(e=>e.id.startsWith('sn_')&&e.id!=='sn_war'&&e.id!=='sn_hollow'&&(!S.used[e.id]||e.repeat)).map(e=>({e,w:e.w()})).filter(x=>x.w>0);
  if(!list.length)return false;
  S.snSceneN++;
  const x=wpick(list,y=>y.w);S.used[x.e.id]=(S.used[x.e.id]||0)+1;
  const p=x.e.make();if(p&&p!==S.pending)S.pending=p;if(S.pending&&S.pending.img)scene(S.pending.img);
  return !!S.pending;
}
const snYear=(a,b)=>S.route==='sn'&&S.year>=a&&S.year<=b&&!S.apostle&&S.alive;
EVENTS.unshift(
  {id:'sn_school',w:()=>snYear(2001,2003)&&S.age>=14?100:0,make:()=>({eyebrow:'호무라바라 학원',img:'homurahara',title:'새 학기',body:'후유키의 호무라바라 학원. 같은 학년에 에미야 시로와 토오사카 린, 한 학년 아래에 마토 사쿠라가 있어요. 어떤 학교생활을 할까요?',options:[
    opt('궁도부에 들어간다','사쿠라, 신지, 타이가 선생님',()=>{chosen();meet('sakura');meet('shinji');meet('taiga');addBond('sakura',10);addBond('taiga',6);log('궁도부에 들어갔다. 사쿠라가 수줍게 인사했고, 신지는 거만하게 고개만 까딱였다.','joy');}),
    opt('학생회 잡일을 돕는다','시로와 함께',()=>{chosen();meet('shirou');addBond('shirou',10);log('학생회실의 고장 난 난로를 고치는 시로를 돕기 시작했다.','joy');}),
    opt('성적으로 승부한다','토오사카를 이겨 봐요',()=>{chosen();meet('rin');addBond('rin',10);log('시험 성적표 앞에서 토오사카 린과 눈이 마주쳤다.','joy');})]})},
  {id:'sn_talk',repeat:true,w:()=>snYear(2002,2003)&&(S.snTalks||0)<4?6:0,make:()=>{S.snTalks=(S.snTalks||0)+1;const id=pick(['shirou','rin','sakura','sakura','taiga','illya']);talk(id,`${S.year}년, 제5차 성배전쟁이 시작되기 전의 평범한 날들.`,()=>{});return S.pending;}},
  {id:'sn_dinner',w:()=>snYear(2002,2003)?(S.year===2002?100:3):0,make:()=>({eyebrow:'에미야 가',img:'homurahara',title:'저녁 식탁',body:'시로의 집 거실. 사쿠라가 국을 데우고, 타이가 선생님이 밥그릇을 들고 기다려요. "같이 먹고 가."',options:[
    opt('같이 저녁을 먹는다','',()=>{meet('taiga');addBond('shirou',6);addBond('sakura',6);addBond('taiga',8);logx('시끄럽고 따뜻한 저녁이었다. 이 집에는 늘 누군가 있었다.',{mental:8},'joy');}),
    opt('사쿠라와 부엌에 선다','',()=>{addBond('sakura',12);logx('사쿠라와 나란히 무를 썰었다. 그녀는 오늘 처음으로 소리 내어 웃었다.',{mental:5},'joy');}),
    opt('창고를 구경한다','시로가 밤마다 뭘 하는지',()=>{addBond('shirou',8);becomeAware();log('창고 안에는 시로가 만든 엉성한 강화 마술의 흔적이 가득했다. 그는 그것을 "단련"이라고 불렀다.','moon',true);})]})},
  {id:'sn_shinji',w:()=>snYear(2002,2003)&&bond('sakura')>=8?5:0,make:()=>({eyebrow:'마토 신지',img:'homurahara',title:'궁도장 뒤에서',body:'신지가 사쿠라에게 소리치고 있어요. 사쿠라는 고개를 숙인 채 아무 말도 하지 않아요.',options:[
    opt('사쿠라의 편을 든다','신지와 사이가 틀어져요',()=>{meet('shinji');addBond('sakura',12);addBond('shinji',-5);log('신지를 막아섰다. 그는 "기억해 둬"라고 내뱉고 떠났다. 사쿠라가 작게 고맙다고 했다.','joy');}),
    opt('신지를 따로 불러 이야기한다','그의 열등감을 들어 봐요',()=>{meet('shinji');addBond('shinji',14);S.shinjiFriend=true;log('신지는 처음으로 속내를 털어놓았다. "마토의 장남인데, 나만 회로가 없어."','moon',true);}),
    opt('모른 척한다','',()=>{addBond('sakura',-4);logx('발걸음을 돌렸다. 뒤에서 사쿠라가 우는 소리가 들린 것 같았다.',{mental:-4},'risk');})]})},
  {id:'sn_rin',w:()=>snYear(2003,2003)&&(S.aware||S.circuits>=3)?100:0,make:()=>({eyebrow:'토오사카 린',img:'homurahara',title:'옥상의 보석',body:'방과 후 옥상. 린이 보석을 손에 쥐고 무언가를 중얼거리고 있어요. 그녀가 당신을 봤어요.',options:[
    opt('못 본 척 내려간다','',()=>{meet('rin');log('계단을 내려가는 등 뒤로 "……다행이네"라는 목소리가 들렸다.','moon');}),
    opt('마술사냐고 묻는다',S.mage?'같은 쪽 사람이에요':'위험할 수도 있어요',()=>{chosen();meet('rin');becomeAware();if(S.mage){addBond('rin',14);log('"……너도? 이 도시의 관리자로서 말해 두는데, 내년 겨울엔 조심해."','moon',true);}else{addBond('rin',6);log('린은 한숨을 쉬고 손가락을 들었다. "……기억은 남겨 둘게. 대신 아무한테도 말하지 마."','moon',true);}}),
    opt('보석이 예쁘다고 말한다','',()=>{meet('rin');addBond('rin',8);log('"……이건 장신구가 아니거든." 린은 그래도 조금 기분이 좋아 보였다.','joy');})]})},
  {id:'sn_kirei',w:()=>snYear(2003,2003)&&S.mage?3:0,make:()=>({eyebrow:'언덕 위의 교회',img:'birth_church',title:'감독관',body:'언덕 위 교회의 신부가 당신을 불렀어요. "이 도시의 마술사라면 알아 두는 게 좋겠지. 내년, 성배가 다시 사람을 고를 것이다."',options:[
    opt('정중하게 듣는다','',()=>{meet('kirei');log('신부의 목소리는 이상할 만큼 상냥했다.','moon');}),
    opt('신부를 의심한다','눈빛이 마음에 안 들어요',()=>{meet('kirei');S.kireiWary=true;log('웃는 얼굴 뒤에 아무것도 없는 사람 같았다. 그날 밤 교회의 위치를 따로 적어 두었다.','moon',true);})]})},
  {id:'sn_illya',w:()=>snYear(2003,2003)&&S.age>=14?5:0,make:()=>({eyebrow:'겨울',img:'homurahara',title:'눈 속의 하얀 소녀',body:'첫눈이 내린 밤, 붉은 눈의 하얀 소녀가 길가에 서 있어요. "있잖아, 오빠(언니). 빨리 소환하지 않으면 죽어 버려."',options:[
    opt('같이 눈사람을 만든다','',()=>{meet('illya');addBond('illya',14);log('소녀는 눈사람에 「버서커」라는 이름을 붙이고 웃었다.','joy',true);}),
    opt('이름을 묻는다','',()=>{meet('illya');addBond('illya',8);log('"이리야스필 폰 아인츠베른. 이리야라고 불러도 돼." 소녀는 그렇게 말하고 눈 속으로 사라졌다.','moon',true);}),
    opt('집에 데려다주겠다고 한다','',()=>{meet('illya');addBond('illya',6);log('"성까지는 멀어. 그래도 고마워." 소녀는 숲 쪽으로 걸어갔다.','moon');})]})},
  {id:'sn_war',w:()=>snYear(2004,2004)&&S.age>=14?100:0,make:()=>{snWar();return S.pending;}},
  {id:'sn_hollow',w:()=>S.snDone&&S.year===2005&&S.alive&&!S.apostle?100:0,make:()=>({eyebrow:'2005년 · 후유키',img:'homurahara',title:'되풀이되는 나흘',body:'전쟁이 끝난 지 반년. 그런데 같은 나흘이 몇 번이고 되풀이돼요. 죽었어야 할 사람들이 아무렇지 않게 웃고 있어요. 이 나흘의 끝에는 무엇이 있을까요?',options:[
    opt('나흘의 끝을 확인한다','이 꿈을 끝내요',()=>{chosen();unlock('sn_hollow');addBond('rin',5);addBond('sakura',5);addBond('saber',5);logx('나흘을 몇 번이고 넘어 마침내 끝에 닿았다. 꿈을 꾸던 누군가가 고맙다고 말한 것 같았다.',{mental:12},'moon',true);}),
    opt('되풀이되는 일상을 즐긴다','이대로도 좋아요',()=>{logx('같은 축제, 같은 저녁, 같은 웃음. 언젠가 끝난다는 걸 알면서도 즐거웠다.',{mental:15},'joy');})]})}
);
