// engine.js — 게임 엔진
// 이 파일은 직접 수정하지 말 것

function realNameFor(id){
  const scripted=FACE_SCRIPTS[id];
  return scripted?.realName||scripted?.name||RES[id].name;
}
function realAgeFor(id){
  const scripted=FACE_SCRIPTS[id];
  return scripted?.realAge||RES[id].age;
}
function profileNameFor(id){
  return RES_STATE[id]?.nameKnown?realNameFor(id):'???';
}
function profileAgeFor(id){
  return RES_STATE[id]?.ageKnown?realAgeFor(id):'??세';
}
function unlockResidentInfo(id,info={}){
  if(!RES_STATE[id])return;
  if(info.name)RES_STATE[id].nameKnown=true;
  if(info.age)RES_STATE[id].ageKnown=true;
  if(curR===id)updateResidentProfile(id);
}
function updateResidentProfile(id){
  const r=RES[id],st=RES_STATE[id];
  document.getElementById('pi-room').textContent=r.room;
  document.getElementById('pi-name').textContent=profileNameFor(id);
  document.getElementById('pi-age').textContent=profileAgeFor(id);
  document.getElementById('pi-fav').textContent=r.favor+' / 100';
  document.getElementById('pi-fb').style.width=r.favor+'%';
  const avImg=document.getElementById('av-img');
  const avTxt=document.getElementById('av-txt');
  avImg.onerror=()=>{avImg.style.display='none';avTxt.style.display='block';};
  if(st?.met){
    avImg.src='캐릭터/'+id+'프로필.png';
    avImg.style.display='block';
    avTxt.style.display='none';
  }else{
    avImg.removeAttribute('src');
    avImg.style.display='none';
    avTxt.style.display='block';
  }
}

// ── 채팅 메시지 순차 큐 ──
const _chatQueues={};

function _getQueue(resId){
  if(!_chatQueues[resId]) _chatQueues[resId]={msgs:[],running:false,onDoneList:[]};
  return _chatQueues[resId];
}

function pushMsgsSeq(resId, msgs, onDone, intervalMs=800){
  const q=_getQueue(resId);
  msgs.forEach((m,i)=>{
    q.msgs.push({m, cb: i===msgs.length-1 ? onDone : null});
  });
  if(!q.running) _runQueue(resId, intervalMs);
}

// ── 비속어 필터 ──
function _runQueue(resId, intervalMs=800){
  const q=_getQueue(resId);
  if(!q.msgs.length){q.running=false;return;}
  q.running=true;
  const {m,cb}=q.msgs.shift();

  if(m.f==='s'||m.speaker==='경비'){
    const text=m.t||m.text||'';
    const box=document.getElementById('chat-choices');
    if(box&&curR===resId){
      box.innerHTML=`<button class="choice-btn player-line" onclick="confirmPlayerLine('${resId}','${text.replace(/'/g,"\\'")}',this)">${text}</button>`;
    }
    q._pendingLine={m,cb,resId};
    return;
  }

  chatH[resId].push(m);
  if(curR===resId) renderChat(resId);
  setTimeout(()=>{
    if(cb) cb();
    _runQueue(resId, intervalMs);
  }, intervalMs);
}

function confirmPlayerLine(resId, text, btnEl){
  const q=_getQueue(resId);
  if(!q._pendingLine) return;
  const {m,cb}=q._pendingLine;
  q._pendingLine=null;
  const box=document.getElementById('chat-choices');
  if(box) box.innerHTML='';
  chatH[resId].push(m);
  if(curR===resId) renderChat(resId);
  setTimeout(()=>{
    if(cb) cb();
    _runQueue(resId);
  }, 800);
}

// CLOCK
function tick(){
  const d=new Date(),h=String(d.getHours()).padStart(2,'0'),m=String(d.getMinutes()).padStart(2,'0'),s=String(d.getSeconds()).padStart(2,'0');
  document.getElementById('clk').innerHTML=`${h}:${m} <span class="blink">:</span> ${s}`;
  document.getElementById('face-clk').textContent=`${h}:${m}`;
  ['ct0','ct1','ct2','ct3'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=`${h}:${m}:${s}`;});
  const hc=document.getElementById('home-clock-big');
  if(hc)hc.textContent=`${h}:${m}:${s}`;
}
tick();setInterval(tick,1000);

// LOG + HOME LOG
const LQ=[];let LB=false;
const HOME_LOG=[];
function log(m){
  LQ.push(m);if(!LB)nextL();
  const d=new Date();
  HOME_LOG.unshift({time:String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'),txt:m});
  if(HOME_LOG.length>8)HOME_LOG.pop();
  renderHomeLog();
}
function nextL(){if(!LQ.length){LB=false;return;}LB=true;document.getElementById('blogmsg').innerHTML='<span class="lt2">■ '+LQ.shift()+'</span>';setTimeout(nextL,3500);}

function updateHome(){
  const ids=Object.keys(RES);
  const avg=Math.round(ids.reduce((s,k)=>s+RES[k].favor,0)/ids.length);
  const wdn=document.getElementById('w-day-num');
  if(wdn)wdn.textContent=currentDay;
  const wHapVal=document.getElementById('w-hap-val');
  const wHapFill=document.getElementById('w-hap-fill');
  if(wHapVal)wHapVal.textContent=avg+'%';
  if(wHapFill)wHapFill.style.width=avg+'%';
  
  const uc=CLIST.filter(c=>c.u).length;
  const hc=document.getElementById('hs-complaints');
  if(hc){hc.textContent=uc+'건';hc.className='hs-val '+(uc>0?'alert':'ok');}
  const hh=document.getElementById('hs-happiness');
  if(hh)hh.textContent=avg+'%';
  const hcl=document.getElementById('hs-clues');
  if(hcl){hcl.textContent=CLUES_COLLECTED.length+'개';hcl.className='hs-val '+(CLUES_COLLECTED.length>0?'alert':'ok');}
  const hbd=document.getElementById('hs-board');
  if(hbd)hbd.textContent=BOARD_POSTS.length+'건';
  const sub=document.getElementById('home-sub');
  if(sub)sub.textContent=uc>0?'미확인 민원 감지 — 즉시 확인':'시스템 온라인 — 이상 없음';
}
function renderHomeLog(){
  const el=document.getElementById('home-log-list');
  if(!el)return;
  el.innerHTML=HOME_LOG.map((l,i)=>`<div class="hl-item"><span class="hl-time">[${l.time}]</span><span class="hl-txt ${i===0?'new':''}">${l.txt}</span></div>`).join('');
}

function sw(t){
  SND.play('탭');
  closeCC();
  if(curR)closeRes();
  if(activeTab===t){
    activeTab=null;
    document.querySelectorAll('.tb').forEach(b=>b.classList.remove('act'));
    SND.stopCCTV();
    switchPanel('home',true);
    updateHome();
    return;
  }
  if(activeTab==='cctv'&&t!=='cctv') SND.stopCCTV();
  const animate=activeTab===null;
  activeTab=t;
  document.querySelectorAll('.tb').forEach((b,i)=>b.classList.toggle('act',TABS[i]===t));
  switchPanel(t,animate);
  if(t==='cctv') SND.playCCTV();
  if(t==='complaints')renderCL();
  if(t==='board'){document.getElementById('tnd-b').style.display='none';renderBoard();}
  if(t==='clues'){document.getElementById('tnd-clue').style.display='none';renderClues();}
}

function switchPanel(t,animate=true){
  const area=document.getElementById('parea');
  area.classList.toggle('no-panel-anim',!animate);
  document.querySelectorAll('#parea .pn').forEach(p=>{
    p.classList.remove('on','closing');
  });

  const target=document.getElementById('pn-'+t);
  if(target)target.classList.add('on');
  if(!animate)requestAnimationFrame(()=>area.classList.remove('no-panel-anim'));
}

function closeRes(){
  curR=null;
  document.querySelectorAll('.rb').forEach(b=>b.classList.remove('sel'));
  activeTab=null;
  document.querySelectorAll('.tb').forEach(b=>b.classList.remove('act'));
  switchPanel('home');
  updateHome();
}

function showFavorChange(delta, anchorEl){
  const c=document.getElementById('favor-center');
  if(c){
    const pos=delta>0;
    c.textContent=(pos?'▲ 호감도 +':'▼ 호감도 ')+Math.abs(delta);
    c.className='show '+(pos?'pos':'neg');
    if(c._t)clearTimeout(c._t);
    c._t=setTimeout(()=>{c.className='';},2000);
  }
}
function updateProfile(id){
  const r=RES[id];
  document.getElementById('pi-fav').textContent=r.favor+' / 100';
  document.getElementById('pi-fb').style.width=r.favor+'%';
}
function updateHappiness(){
  const ids=Object.keys(RES);
  const avg=Math.round(ids.reduce((s,k)=>s+RES[k].favor,0)/ids.length);
  document.getElementById('hap-fill').style.width=avg+'%';
  document.getElementById('hap-pct').textContent=avg+'%';
}

// ══ 단서 시스템 ══
function addClue(clueId,name,desc){
  if(CLUES_COLLECTED.find(c=>c.id===clueId))return;
  CLUES_COLLECTED.push({id:clueId,name,desc});
  log('[단서 획득] '+name);
  document.getElementById('tnd-clue').style.display='inline-block';
  showClueNotif(name);
}
function showClueNotif(name){
  const el=document.createElement('div');
  el.style.cssText='position:fixed;top:50px;right:20px;background:#fff;color:#000;font-size:11px;font-weight:bold;padding:10px 16px;z-index:9995;letter-spacing:1px;border:2px solid #000;animation:floatUp 2.5s ease-out forwards;';
  el.textContent='[ 단서 획득: '+name+' ]';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),2500);
}
function renderClues(){
  const list=document.getElementById('clue-list');
  if(!CLUES_COLLECTED.length){list.innerHTML='<div id="clue-empty">아직 수집된 단서가 없습니다.<br><br>빌라를 조사하세요.</div>';return;}
  list.innerHTML=CLUES_COLLECTED.map(c=>`
    <div class="clue-item">
      <div class="clue-id">${c.id}</div>
      <div class="clue-name">${c.name}</div>
      <div class="clue-desc">${c.desc}</div>
    </div>`).join('');
}

// ══ 다음날 버튼 — 엔딩 루트 시스템 ══
let _devEndingRoute = null;

const ENDING_ROUTE_PRESETS = {
  END_1: {
    favorAbsolute: {'101':55,'102':75,'201':70,'202':50,'301':55},
    flags: ['SIDE_NEUTRAL_D2','SIDE_NEUTRAL_D3','SIDE_NEUTRAL_D4','FINAL_SIDE_NEUTRAL',
            'CHAT_201_FOUND_DONE','CHAT_102_RESULT_DONE','MATSORYEON_MET',
            'NOTICED_201_SIGNAL_1','NOTICED_201_SIGNAL_2','SAVED_201'],
    addClues: [],
    neglectCount: 0,
  },
  END_2_A: {
    favorAbsolute: {'101':0,'102':0,'201':40,'202':35,'301':20},
    flags: ['SIDE_101_D2','SIDE_102_D3','SIDE_101_D4','FINAL_SIDE_101',
            'EVT_D4_006_NEGLECT','BAND_REVEALED','BAND_TRUTH_PARTIAL',
            'CHAT_201_FOUND_DONE','EVT_D2_001_DONE','MATSORYEON_MET',
            'EVT_D3_003_DONE'],
    addClues: [],
    neglectCount: 3,
  },
  END_2_B: {
    favorAbsolute: {'101':30,'102':40,'201':30,'202':35,'301':5},
    flags: ['BOARD_SOLVED_BAD','NEGLECT_301','MATSORYEON_MET'],
    addClues: [],
    neglectCount: 3,
  },
  END_2_C: {
    favorAbsolute: {'101':40,'102':50,'201':5,'202':35,'301':20},
    flags: ['IGNORED_201_SIGNAL_1','IGNORED_201_SIGNAL_2','ABANDONED_201'],
    addClues: [],
    neglectCount: 2,
  },
  END_3: {
    favorAbsolute: {'101':50,'102':55,'201':60,'202':75,'301':40},
    flags: ['HINT_202_WALL','EVT_D3_003_A','EVT_D4_004_TALKED','EVT_D4_005_DONE',
            'AGREED_WITH_202','D6_202_HINT_RECEIVED','NOTICED_201_SIGNAL_1',
            'NOTICED_201_SIGNAL_2','SAVED_201','LISTENED_WITH_301',
            'CHAT_201_FOUND_DONE','EVT_D2_001_DONE','MATSORYEON_MET',
            'CHAT_102_RESULT_DONE','BOARD_SOLVED_GOOD'],
    addClues: ['CLUE_001','CLUE_002','CLUE_003','CLUE_004'],
    neglectCount: 0,
  },
};

let _neglectCount = 0;

function selectEndingRoute(route){
  // 이미 루트가 고정된 경우 변경 불가
  if(_devEndingRoute){
    log('DEV — 루트는 이미 '+_devEndingRoute+'로 고정됐습니다.');
    document.getElementById('ending-menu').classList.remove('on');
    return;
  }
  _devEndingRoute = route;
  document.getElementById('ending-menu').classList.remove('on');
  const label = document.getElementById('day-ending-label');
  const goBtn = document.getElementById('day-go-btn');
  if(label){
    const names = {END_1:'E1', END_2_A:'E2A', END_2_B:'E2B', END_2_C:'E2C', END_3:'E3'};
    label.textContent = route ? (names[route]||route)+' [고정]' : '—';
  }
  if(goBtn) goBtn.style.display = route ? 'block' : 'none';
  document.querySelectorAll('.em-btn').forEach(b=>{
    b.classList.toggle('sel', b.dataset.route===route);
    b.disabled = true; // 루트 고정 후 버튼 전체 비활성화
    b.style.opacity = b.dataset.route===route ? '1' : '0.3';
  });
  log('DEV — 엔딩 루트 고정: '+(route||'자유 진행'));
}

function dayBtnClick(){
  const menu = document.getElementById('ending-menu');
  menu.classList.toggle('on');
  setTimeout(()=>{
    document.addEventListener('click', ()=>menu.classList.remove('on'), {once:true});
  }, 0);
}

function advanceDay(){
  if(_devEndingRoute){
    const preset = ENDING_ROUTE_PRESETS[_devEndingRoute];
    if(preset){
      if(preset.favorAbsolute){
        Object.entries(preset.favorAbsolute).forEach(([id,val])=>{
          if(RES[id]) RES[id].favor = val;
        });
      }
      (preset.flags||[]).forEach(f=>{ setFlag(f); DONE_EVENTS.add(f); });
      _neglectCount = Math.max(_neglectCount, preset.neglectCount||0);
      const clueData = {
        CLUE_001:{name:'CCTV 이상',desc:'타임스탬프 멈춤, 카메라 각도 변화.'},
        CLUE_002:{name:'고재엽 힌트',desc:'빌라 내부 구조 이상. 벽 두께 불균일.'},
        CLUE_003:{name:'벽 기계 소리',desc:'2층 복도 벽에서 규칙적인 기계 소리.'},
        CLUE_004:{name:'케이블 발견',desc:'쓰레기장 벽 하단에서 케이블 발견.'},
      };
      (preset.addClues||[]).forEach(id=>{
        if(!CLUES_COLLECTED.find(c=>c.id===id)&&clueData[id]){
          addClue(id, clueData[id].name, clueData[id].desc);
        }
      });
      updateHappiness();
      updateHome();
    }
  }

  showDayTransition(currentDay + 1, ()=>{
    currentDay++;
    document.getElementById('daydisp').textContent='DAY '+currentDay;
    document.getElementById('face-daydisp').textContent='DAY '+currentDay;
    const wdn=document.getElementById('w-day-num');
    if(wdn)wdn.textContent=currentDay;

    Object.keys(chatH).forEach(id=>{
      if(chatH[id].length>0) chatH[id].push({f:'day-divider',day:currentDay});
    });

    Object.keys(pendingChatChoice).forEach(k=>{ delete pendingChatChoice[k]; });

    renderCL();
    log('DAY '+currentDay+' 시작.');
    if(typeof ANT!=='undefined'&&ANT.resetDay)ANT.resetDay();

    // 1. 전날 이벤트를 먼저 정리하여 방치(Neglect) 플래그를 확정합니다.
    _autoCompleteDayEvents(currentDay-1);

    if(currentDay===6){
      const dayBtn=document.getElementById('day-btn');
      if(dayBtn){
        dayBtn.textContent='[ 일과 종료 (엔딩 진행) ]';
        dayBtn.onclick=()=>{ dayBtn.onclick=null; startEnding(); };
        dayBtn.style.display=''; 
      }
      const goBtn=document.getElementById('day-go-btn');
      if(goBtn) goBtn.style.display='none';
    }

    setTimeout(()=>{
      triggerEventsForDay(currentDay);
    }, 800);
  });
}

const _DC = {
  1:{
    '101':[
      {f:'r',t:'관리 좀 똑바로 하세요'},
      {f:'r',t:'제 앞집 시끄럽다니까요 사람 잠을 못 자게;'},
      {f:'s',t:'확인하겠습니다.'},
      {f:'r',t:'빨리요 ㅈ;ㅣ금당장'},
      {f:'r',t:'그리고 복도 담배꽁초도 좀. 내 거 아니에요'},
    ],
    '201_cctv':[  
      {f:'r',t:'ㅈ기'},{f:'r',t:'저기'},{f:'r',t:'저희집 뻐ㅗ삐가'},
      {f:'r',t:'뽀삐가 없러젺어요.'},{f:'r',t:'ㅇ오늟 아까 낮에 쓰레기 버히다가'},
      {f:'r',t:'아'},{f:'r',t:'어떡'},
      {f:'s',t:'뽀삐가 강아지인가요?'},
      {f:'r',t:'아'},{f:'r',t:'네'},
      {f:'r',t:'아무츤 뽀삐를 하루종일찾아다녂ㅆ느넫도 못찾았어요'},
      {f:'r',t:'울고있엉ㅅ지금..'},
      {f:'s',t:'우선 CCTV 로 계속 확인해드릴게요.'},
      {f:'r',t:'네'},{f:'r',t:'감사합니다...'},
    ],
    '201_2c':[  
      {f:'r',t:'ㅈ기'},{f:'r',t:'저기'},{f:'r',t:'저희집 뻐ㅗ삐가'},
      {f:'r',t:'뽀삐가 없러젺어요.'},{f:'r',t:'어떡'},
      {f:'s',t:'뽀삐가 강아지인가요?'},
      {f:'r',t:'아'},{f:'r',t:'네'},
      {f:'s',t:'같이 찾아봅시다.'},
      {f:'r',t:'아'},{f:'r',t:'정말요?'},{f:'r',t:'감사합니자ㅠ'},
      {f:'r',t:'죄송해요'},{f:'r',t:'제ㅏㄱ'},{f:'r',t:'못나가서 죄송합니다'},
    ],
    '102_b':[  
      {f:'r',t:'형'},{f:'r',t:'갔다왔어요 노래방'},{f:'r',t:'용돈 ㄱㅅ'},
      {f:'s',t:'네.'},{f:'r',t:'ㅎㅎ 형 좋은 사람이네'},{f:'r',t:'오디션 응원해줘요'},
      {f:'s',t:'응원합니다.'},{f:'r',t:'진심을 담아서요.'},{f:'r',t:'성의 존나없네'},
    ],
  },
  2:{
    '101':[
      {f:'r',t:'저기요'},{f:'r',t:'또 복도에 담배꽁초 있어요'},
      {f:'s',t:'확인하겠습니다.'},
      {f:'r',t:'빨리요'},{f:'r',t:'102호 그 새끼가 확실해요 진짜 아오'},
    ],
    '102':[
      {f:'r',t:'형'},{f:'r',t:'근데 3층에 씨씨티비 없어요?'},
      {f:'r',t:'저 3층 무서워서 확인하려고 봤는데 없던데'},
      {f:'s',t:'없어요. 예산이 부족해서요.'},
      {f:'r',t:'ㅋㅋㅋㅋㅋㅋ'},{f:'r',t:'레전드네 진짜'},
      {f:'r',t:'그럼 3층에 뭔 일 나도 모르겠네'},{f:'r',t:'하씨발'},
    ],
    '201_found':[  
      {f:'r',t:'경비원ㄴ님'},{f:'r',t:'뽀삐 찾았어여'},
      {f:'r',t:'쓰레기장 구석에 있었어요...'},{f:'r',t:'진짜 감사함니다 ㅠㅠ'},
      {f:'s',t:'다행이에요.'},{f:'r',t:'...'},{f:'r',t:'네.. 정말루 감사해요..'},
    ],
  },
  3:{
    '101':[
      {f:'r',t:'저기요'},{f:'r',t:'쓰레기장에 제 사진이 버려져 있어요'},
      {f:'r',t:'누가 찍어서 버린 거예요?'},
      {f:'s',t:'확인해볼게요.'},
      {f:'r',t:'빨리 좀요'},{f:'r',t:'진짜 소름이야 씨'},
    ],
    '102':[
      {f:'r',t:'형'},{f:'r',t:'저 오늘 오디션이에요'},{f:'r',t:'긴장돼서 진짜'},
      {f:'s',t:'잘 될 거예요.'},
      {f:'r',t:'ㅎㅎ 고마워요'},{f:'r',t:'갔다올게요'},
      {f:'r',t:'형'},{f:'r',t:'저 떨어졌어요 ㅠ'},{f:'r',t:'뭐 원래 이런 거잖아요 ㅋㅋ'},
      {f:'s',t:'다음엔 잘 될 거예요.'},
      {f:'r',t:'그쵸ㅋㅋ'},{f:'r',t:'형이 응원해줬잖아요'},{f:'r',t:'그거로 됐어요'},
    ],
    '202':[
      {f:'r',t:'경비원님.'},{f:'r',t:'사진 얘기 때문에 오셨죠?'},
      {f:'s',t:'이 사진 찍으셨어요?'},
      {f:'r',t:'찍긴 찍었어요. 근데 버린 건 제가 아니에요.'},
    ],
  },
  4:{
    '101':[
      {f:'r',t:'저기요'},{f:'r',t:'또 시작이네요'},
      {f:'s',t:'확인하겠습니다.'},
    ],
    '202':[
      {f:'r',t:'경비원님.'},{f:'r',t:'어제 얘기 이어서요.'},
      {f:'r',t:'벽에서 소리 난다는 거. 저도 들었어요.'},
      {f:'s',t:'무슨 소리요, 구체적으로.'},
      {f:'r',t:'기계 소리요. 주기적으로. 벽 안에서.'},
      {f:'r',t:'공사 공지는 없었는데.'},
    ],
  },
  5:{
    // E3 루트 — 고재엽 경고 + 선형이 OK
    '202_e3':[
      {f:'r',t:'이 빌라.'},
      {f:'r',t:'누군가 설계한 것 같아요.'},
      {f:'r',t:'일반 주거용이 아닌 것처럼.'},
      {f:'r',t:'벽 두께. 케이블. 소리 주기.'},
      {f:'s',t:'솔직히, 저도 이상하다고 생각해요.'},
      {f:'r',t:'그렇군요.'},
      {f:'r',t:'그럼 내일 잠깐 시간 되세요?'},
      {f:'r',t:'드릴 게 있어요.'},
    ],
    '201_e3':[
      {f:'r',t:'아무것도 아니에요'},
      {f:'s',t:'직접 찾아갈게요.'},
      {f:'r',t:'밥 드셨어요 오늘.'},
      {f:'r',t:'...아침에요.'},
      {f:'r',t:'먹어요.'},
    ],
    // E2A 루트 — 101↔102 결판
    '101_e2a':[
      {f:'r',t:'저기요'},
      {f:'r',t:'102호가요'},
      {f:'r',t:'복도에서 저한테 뭐라고 했어요'},
      {f:'r',t:'아 진짜 이 인간이'},
      {f:'s',t:'확인하겠습니다.'},
    ],
    '102_e2a':[
      {f:'r',t:'형'},
      {f:'r',t:'저 좀 심한 말 한 것 같아요'},
      {f:'r',t:'근데 걔가 먼저잖아요'},
      {f:'s',t:'먼저 사과하는 게 낫지 않아요?'},
      {f:'r',t:'......'},
      {f:'r',t:'근데 형이 그 말 하는 거 좀 이상하지 않아요?'},
    ],
    // 공통 — 벽소리 민원 채팅 기록
    '201_wall':[
      {f:'r',t:'저기요'},
      {f:'r',t:'어젯밤에도 소리 났어요'},
      {f:'r',t:'이번엔 엄청 컸어요'},
      {f:'s',t:'확인해볼게요.'},
    ],
    '102_wall':[
      {f:'r',t:'형'},
      {f:'r',t:'저 이상한 소리 듣는 건 아니죠?'},
      {f:'r',t:'규칙적으로 나는 게 더 무서워요ㅋㅋ'},
      {f:'s',t:'확인해볼게요.'},
    ],
  },
  6:{
    '202':[
      {f:'r',t:'드릴 게 있어요.'},
      {f:'r',t:'기록해온 거예요. 날짜별로.'},
      {f:'s',t:'무슨 뜻이에요?'},
      {f:'r',t:'모르겠어요. 조심하세요.'},
    ],
    // E2A — 어제 결판 여파
    '101_e2a':[
      {f:'r',t:'경비원님'},
      {f:'r',t:'어제 일 때문에 연락하는 건 아니고요'},
      {f:'r',t:'그냥요'},
      {f:'r',t:'......'},
      {f:'r',t:'별 거 아니에요'},
      {f:'s',t:'괜찮으세요?'},
      {f:'r',t:'......네'},
    ],
    '102_e2a':[
      {f:'r',t:'형'},
      {f:'r',t:'어제'},
      {f:'r',t:'저 좀 이상한 말 했죠'},
      {f:'s',t:'괜찮아요.'},
      {f:'r',t:'......'},
      {f:'r',t:'아뇨 형은 그냥 하는 말 알아요'},
    ],
  },
};

const _DAY_BOARD = {
  1:[{id:2,author:'???',tag:'',title:'경비원님 반가워요',
      preview:'저도 잘 부탁드려요.',
      body:'경비원님\n\n저도 잘 부탁드려요.\n\n...',day:1,pin:false}],
  2:[{id:3,author:'???',tag:'',title:'오늘 쓰레기장 가셨던 거예요',
      preview:'다음엔 제가 도와드릴 수 있는데.',
      body:'오늘 쓰레기장에 꽤 오래 계시던데요\n뭔 거 찾고 계신 건가요\n다음엔 제가 도와드릴 수 있는데\n\n...',day:2,pin:false}],
  3:[{id:4,author:'???',tag:'',title:'사진 얘기 들었어요',
      preview:'경비원님도 아셨겠네요.',
      body:'사진 얘기 들었어요\n경비원님도 아셨겠네요\n\n...',day:3,pin:false}],
  4:[{id:5,author:'???',tag:'',title:'오늘도 잘 보고 있어요',
      preview:'수고하세요.',
      body:'오늘도 잘 보고 있어요\n수고하세요\n\n...',day:4,pin:false}],
  5:[{id:6,author:'???',tag:'',title:'경비원님',
      preview:'알게 될 거예요.',
      body:'경비원님\n\n알게 될 거예요.\n\n...',day:5,pin:false}],
};

const _DAY_COMPLAINTS = {
  1:[{id:1,room:'101호',subj:'앞집 소음',body:'새벽에 시끄럽습니다.',time:'Day1',u:false}],
  2:[{id:2,room:'101호',subj:'복도 담배꽁초',body:'복도에 담배꽁초가 있습니다.',time:'Day2',u:false}],
  3:[{id:3,room:'101호',subj:'쓰레기장 사진',body:'제 사진이 버려져 있어요.',time:'Day3',u:false}],
  4:[{id:4,room:'101호',subj:'또 시작',body:'또 민원입니다.',time:'Day4',u:false}],
  5:[{id:5,room:'201호',subj:'벽 소리',body:'밤에 벽에서 소리가 나요.',time:'Day5',u:false},
     {id:6,room:'102호',subj:'벽 소리',body:'저도요. 이상해요.',time:'Day5',u:false}],
};

const _DAY_FLAGS = {
  1:['EVT_001_DONE','EVT_001_B_DONE','EVT_002_INTRO_DONE','CHAT_201_SEARCH_PROMISED',
     'CHAT_102_FIRST_DONE','CHAT_102_CHEER_DONE','CHAT_101_REPLIED','CHAT_101_DONE',
     'MSGS_SHOWN_EVT_002_CHAT','MSGS_SHOWN_CHAT_201_CHOICE','MSGS_SHOWN_CHAT_102_FIRST',
     'MSGS_SHOWN_CHAT_102_CHEER','CCTV_쓰레기장_CHECKED','CHAT_201_AFTER_CCTV'],
  2:['CHAT_102_CCTV_DONE','EVT_D2_COMPLAINT_REPLIED','WALL_SOUND_COUNT_1',
     'CHAT_201_FOUND_TRIGGER','CHAT_201_FOUND_DONE','MATSORYEON_SEEN_1',
     'MSGS_SHOWN_CHAT_201_FOUND','MSGS_SHOWN_CHAT_102_CCTV',
     'EVT_D2_001_DONE','EVT_D2_002_DONE','EVT_D2_003_DONE','EVT_D2_004_DONE',
     'EVT_D2_005_DONE','EVT_D2_006_DONE','EVT_D2_007_DONE','POLITICS_D2'],
  3:['EVT_D3_PHOTO_REPLIED','CHAT_102_AUDITION_SENT','CHAT_102_RESULT_TRIGGER',
     'CHAT_102_RESULT_DONE','EVT_D3_AUDITION_TRIGGER','HINT_101_102','MATSORYEON_MET',
     'MSGS_SHOWN_CHAT_102_AUDITION_DAY','MSGS_SHOWN_CHAT_102_RESULT','EVT_D3_005_DONE',
     'EVT_D3_001_DONE','EVT_D3_002_DONE','EVT_D3_003_DONE','EVT_D3_004_DONE',
     'EVT_D3_006_DONE','EVT_D3_007_DONE','EVT_D3_008_DONE','BAND_REVEALED','POLITICS_D3'],
  4:['EVT_D4_001_DONE','EVT_D4_002_DONE','EVT_D4_003_DONE','EVT_D4_004_DONE',
     'EVT_D4_005_DONE','EVT_D4_006_DONE','EVT_D4_007_DONE','BAND_TRUTH_PARTIAL',
     'BOARD_SOLVED_GOOD','CONFRONTED_202','EVT_D3_003_A'],
  5:['EVT_D5_001_DONE','EVT_D5_001_COMPLAINT_201','EVT_D5_001_COMPLAINT_102','EVT_D5_001_COMPLAINT_101',
     'EVT_D5_004_DONE','EVT_D5_007_DONE','EVT_D5_008_DONE','WALL_SOUND_COUNT_3',
     'BOARD_MYSTERY_FINAL','EVT_D5_BOARD',
     'MSGS_SHOWN_CHAT_D5_202_WARNING','MSGS_SHOWN_CHAT_201_SIGNAL3'],
  6:['EVT_D6_001_DONE'],
};

const _DAY_MET = {
  1:['101','102','202'],  
  2:['201','301','202'],
  3:['202','301'],
  4:['101','102','202'],
  5:['201','202'],
  6:['202'],
};

const _DAY_STATE = {
  1:{'101':null,'102':null,'201':'EVT_201_INIT','202':null,'301':null},
  2:{'101':null,'102':null,'201':null,'202':'EVT_202_DONE','301':'EVT_301_INIT'},
  3:{'101':null,'102':null,'202':'EVT_202_DONE','301':'EVT_301_DONE'},
  4:{'101':null,'102':null,'202':'EVT_202_DONE'},
  5:{'201':null,'202':'EVT_202_DONE'},
};

function _autoCompleteDayEvents(day){
  const route = _devEndingRoute;
  const dc = _DC[day]||{};

  // --- [수정] 방치(Neglect) 및 배드 엔딩 플래그 누적 시스템 ---
  // 1. 플레이어가 확인하지 않고 넘긴 민원이 있으면 방치 카운트 증가
  const unreadComplaints = CLIST.filter(c => c.u).length;
  if(unreadComplaints > 0) {
    _neglectCount += unreadComplaints;
  }
  
  // 2. 기획안 기반 필수 이벤트 무시에 따른 치명적 방치 플래그 세팅 및 호감도 대폭 하락
  if(day === 2 && !DONE_EVENTS.has('CHAT_201_FOUND_DONE')){
    setFlag('ABANDONED_201'); // 201호 강아지 실종 무시
    if(RES['201']) RES['201'].favor -= 50;
  }
  if(day === 4 && !DONE_EVENTS.has('EVT_D4_004_TALKED')){
    setFlag('EVT_D4_006_NEGLECT'); // 101/102호 밴드 갈등 무시
    if(RES['101']) RES['101'].favor -= 40;
    if(RES['102']) RES['102'].favor -= 40;
  }
  if(day === 5 && !DONE_EVENTS.has('LISTENED_WITH_301')){
    setFlag('NEGLECT_301'); // 301호 방치
    if(RES['301']) RES['301'].favor -= 40;
  }
  // -------------------------------------------------------------

  if(day===1){
    if(dc['101']) chatH['101'].push(...dc['101']);
    if(!route||route==='END_1'||route==='END_3'){
      if(dc['102_b']) chatH['102'].push(...dc['102_b']);
    }
    if(route==='END_2_C'){
      if(dc['201_2c']) chatH['201'].push(...dc['201_2c']);
    } else {
      if(dc['201_cctv']) chatH['201'].push(...dc['201_cctv']);
    }
  } else if(day===2){
    if(dc['101']) chatH['101'].push(...dc['101']);
    if(dc['102']) chatH['102'].push(...dc['102']);
    if(route!=='END_2_C'){
      if(dc['201_found']) chatH['201'].push(...dc['201_found']);
    }
  } else if(day===5){
    // 공통 — 벽소리 민원 채팅
    if(dc['201_wall']) chatH['201'].push(...dc['201_wall']);
    if(dc['102_wall']) chatH['102'].push(...dc['102_wall']);
    if(route==='END_3'){
      // E3 — 고재엽 경고 수락 + 선형이 방문
      if(dc['202_e3']) chatH['202'].push(...dc['202_e3']);
      if(dc['201_e3']) chatH['201'].push(...dc['201_e3']);
      // E3 전용 플래그
      ['AGREED_WITH_202','SAVED_201','LISTENED_WITH_301',
       'EVT_D5_002_DONE','EVT_D5_003_DONE','EVT_D5_005_DONE'].forEach(f=>{setFlag(f);DONE_EVENTS.add(f);});
    } else if(route==='END_2_A'){
      // E2A — 101↔102 결판
      if(dc['101_e2a']) chatH['101'].push(...dc['101_e2a']);
      if(dc['102_e2a']) chatH['102'].push(...dc['102_e2a']);
      // E2A 전용 플래그 (고재엽 관련 플래그는 절대 세팅 안 함)
      ['FINAL_SIDE_101','EVT_D5_004_DONE'].forEach(f=>{setFlag(f);DONE_EVENTS.add(f);});
    }
  } else if(day===6){
    const clues = CLUES_COLLECTED.length;
    const qualifiesForEnd3 = route === 'END_3' || clues >= 3 || (clues >= 2 && RES['202'].favor >= 70);
    if(qualifiesForEnd3 && dc['202']){
      chatH['202'].push(...dc['202']);
    }
    if(route === 'END_2_A'){
      if(dc['101_e2a']) chatH['101'].push(...dc['101_e2a']);
      if(dc['102_e2a']) chatH['102'].push(...dc['102_e2a']);
    }
  } else {
    Object.entries(dc).forEach(([resId, msgs])=>{
      if(msgs&&msgs.length) chatH[resId].push(...msgs);
    });
  }

  const complaints = _DAY_COMPLAINTS[day]||[];
  complaints.forEach(c=>{
    if(!CLIST.find(x=>x.id===c.id)) CLIST.push({...c});
  });

  (_DAY_MET[day]||[]).forEach(id=>{
    if(RES_STATE[id]) RES_STATE[id].met=true;
  });

  let flagsToSet = _DAY_FLAGS[day]||[];
  if(day === 6){
    const clues = CLUES_COLLECTED.length;
    const qualifiesForEnd3 = route === 'END_3' || clues >= 3 || (clues >= 2 && RES['202'].favor >= 70);
    if(!qualifiesForEnd3){
      flagsToSet = flagsToSet.filter(f => !f.includes('202') && f !== 'EVT_D6_001_DONE');
    }
  }
  flagsToSet.forEach(f=>{ setFlag(f); DONE_EVENTS.add(f); });

  if(route){
    const preset = ENDING_ROUTE_PRESETS[route];
    (preset?.flags||[]).forEach(f=>{ setFlag(f); DONE_EVENTS.add(f); });
  }

  (_DAY_BOARD[day]||[]).forEach(post=>{
    if(!BOARD_POSTS.find(p=>p.id===post.id)) BOARD_POSTS.push({...post});
  });
  if(route==='END_3'){
    const clueData={
      CLUE_001:{name:'CCTV 이상',desc:'타임스탬프 멈춤, 카메라 각도 변화.'},
      CLUE_002:{name:'고재엽 힌트',desc:'빌라 내부 구조 이상. 벽 두께 불균일.'},
      CLUE_003:{name:'벽 기계 소리',desc:'2층 복도 벽에서 규칙적인 기계 소리.'},
      CLUE_004:{name:'케이블 발견',desc:'쓰레기장 벽 하단에서 케이블 발견.'},
    };
    const cluesByDay={3:'CLUE_001',4:'CLUE_002',5:['CLUE_003','CLUE_004']};
    const toAdd=cluesByDay[day];
    if(toAdd){
      [].concat(toAdd).forEach(id=>{
        if(!CLUES_COLLECTED.find(c=>c.id===id)&&clueData[id])
          addClue(id,clueData[id].name,clueData[id].desc);
      });
    }
  }

  const stateMap=_DAY_STATE[day]||{};
  Object.entries(stateMap).forEach(([resId,state])=>{ RES_EVENT_STATE[resId]=state; });
  (DAY_SEQUENCE[day]||[]).forEach(evt=>{
    if(evt.type==='state_change'){
      (evt.changes||[]).forEach(c=>{
        if(c.resId) RES_EVENT_STATE[c.resId]=c.newState;
      });
    }
    DONE_EVENTS.add(evt.id);
  });

  Object.keys(pendingChatChoice).forEach(k=>delete pendingChatChoice[k]);

  renderCL();
  updateHappiness();
  updateHome();
  if(curR) renderChat(curR);

  log('DEV — Day '+day+' 완료 ('+(route||'자유')+'루트)');
}

// ════════════════════════════════════════
// 엔딩 시스템
// ════════════════════════════════════════
function calcEnding(){
  const route=_devEndingRoute;
  if(route) return route;

  // 1. 배드 엔딩 (주민이 파국에 치달은 경우 최우선)
  if(getFlag('ABANDONED_201')) return 'END_2_C';
  if((RES['101'].favor<=20||RES['102'].favor<=20)&&(getFlag('FINAL_SIDE_101')||getFlag('FINAL_SIDE_102')||getFlag('EVT_D4_006_NEGLECT'))) return 'END_2_A';
  if(RES['301'].favor<=20&&(_neglectCount>=2 || getFlag('NEGLECT_301'))) return 'END_2_B';

  // 2. 진실 엔딩 (조건 만족 + Day 6에 고재엽과 대화하여 플래그를 취득해야 함)
  const clues=CLUES_COLLECTED.length;
  if(clues>=2 && (clues>=3 || RES['202'].favor>=70)){
    if(getFlag('D6_202_HINT_RECEIVED')) return 'END_3';
  }

  // 3. 노멀 엔딩 (기본값)
  return 'END_1';
}

function startEnding(){
  _autoCompleteDayEvents(6);

  const route=calcEnding();
  log('엔딩: '+route);
  const fd=document.getElementById('fade');
  fd.classList.add('in');
  setTimeout(()=>{
    fd.classList.remove('in');
    _runEndingScene(route);
  },600);
}

const _ENDING_DATA={
  END_1:{
    title:'END_1',main:'빌라는 유지됩니다',credit:'',
    lines:[
      '(오늘도 순찰이다.),,',
      '(1층 복도. 101호 앞에 담배꽁초가 하나 있다.),,',
      '(치웠다.),,',
      '(2층. 102호에서 뭔가 흥얼거리는 소리가 들린다.),,',
      '(201호는 조용하다. 뽀삐 발소리만 들린다.),,',
      '(3층. 봉투 끄는 소리가 난다. 항상 이 시간이다.),,',
      '(경비실로 돌아왔다.),,',
      '(관리일지를 펼쳤다.),,',
      '("이상 없음."을 썼다.),,',
      '(뭐가 어떻게 돌아가는지는 모른다.),,',
      '(근데 나한테 주어진 일은 했다.),,',
      '(내일도 할 것이다.),,',
    ],
  },
  END_2_A:{
    title:'END_2_A',main:'오래된 불씨',credit:'',
    lines:[
      '(저녁. 1층 복도에서 소리가 났다.),,',
      '(이번엔 달랐다.),,',
      '(복도 끝에 두 사람이 있었다.),,',
      '(명성이 벽에 기대어 있었다. 서 있지 않았다.),,',
      '(염지혜가 그 앞에 서 있었다.),,',
      '염지혜: ...경비원님.',
      '염지혜: 저 어떡해요.',
      '(목소리가 작았다.),,',
      '(명성이 반응하지 않았다.),,',
      '(전화를 꺼냈다. 112를 눌렀다.),,',
      '(사이렌 소리가 났다.),,',
      '(그날 이후 빌라가 조용해졌다.),,',
      '(6일 동안 내가 할 수 있었던 게 있었을까.),,',
      '(모르겠다. 결국 모르는 채로 끝났다.),,',
    ],
  },
  END_2_B:{
    title:'END_2_B',main:'아무도 몰랐던 것',credit:'',
    lines:[
      '(3층. 봉투 끄는 소리가 안 난다.),,',
      '(노크했다. 아무 소리가 없다.),,',
      '(문이 잠겨 있지 않았다.),,',
      '(봉투들이 가득하다. 매소련의 수집품들이다.),,',
      '(매소련은 없다. 신발도 없다.),,',
      '(경비실로 돌아왔다. 게시판에 새 글이 있었다.),,',
      '글쓴이: ???',
      '제목: 잘 있어요',
      '내용: 경비원님. 저 괜찮아요. 걱정하지 마세요.',
      '(날짜가 없다. 언제 쓴 건지 모른다.),,',
      '(창을 닫았다.),,',
    ],
  },
  END_2_C:{
    title:'END_2_C',main:'가장 조용한 방에서',credit:'',noCredit:true,
    lines:[
      '(채팅이 안 왔다. 어제도 안 왔다.),,',
      '(노크했다.),,',
      '(뽀삐 소리가 났다. 짖는 게 아니라 긁는 소리.),,',
      '(한 번 더 노크했다. 대답이 없었다.),,',
      '(관리실 열쇠로 문을 열었다.),,',
      '!201문열림',
      '(뽀삐가 나왔다.),,',
      '(뽀삐는 괜찮았다.),,',
    ],
  },
  END_3:{
    title:'END_3',main:'빌라의 진실',
    credit:'행복빌라 관리 시스템\n오늘의 일지: 이상 없음.\n실험 종료.',
    lines:[
      '(어두운 방이다.),,',
      '(모니터가 여러 개 켜져 있다.),,',
      '(1층 복도. 2층 복도. 쓰레기장. 경비실.),,',
      '(경비실 화면 속에서 누군가 모니터를 보고 있다.),,',
      '(나다.),,',
      '(의자가 있다. 비어 있다. 방금까지 누가 있었던 것처럼.),,',
      '(키보드 위에 종이 한 장. "실험 종료." 날짜는 오늘이다.),,',
      '(나왔다. 복도였다. 창문이 없다.),,',
      '(밖으로 나왔다. 빌라가 보인다. 창문에 불이 켜져 있다.),,',
      '(한 번 더 들어갔다. 1층 복도. 담배꽁초 하나. 치웠다.),,',
      '(2층. 202호 문이 열렸다. 고재엽이 나왔다. 카메라를 들고 있다.),,',
      '!202',
      '고재엽: 좋은 하루예요.',
      '!x',
      '(그가 계단을 내려갔다.),,',
      '(그 말이 뭔지 모르겠다. 인사인지. 아는 척인지. 끝인사인지.),,',
      '(빌라를 나왔다. 뒤돌아보지 않았다.),,',
      '(빌라는 아직 거기 있다.),,',
      '(불이 켜져 있다. 항상 그랬던 것처럼.),,',
    ],
  },
};

function _runEndingScene(route){
  const data=_ENDING_DATA[route]||_ENDING_DATA['END_1'];
  
  // --- [신규 추가] 게임 내 UI를 그대로 활용하는 커스텀 엔딩 연출 ---
  const playCustomUI = (uiType, data, defaultBg, locTitle) => {
    const isFace = uiType === 'face';
    closeCC(); if(curR) closeRes(); switchPanel('home');
    
    // 배경 및 UI 초기화
    if (isFace) {
       const bgImg = document.getElementById('face-bg-img');
       if(bgImg) { bgImg.src = defaultBg; bgImg.style.visibility = 'visible'; }
       const cImg = document.getElementById('face-char-img');
       if(cImg) cImg.style.visibility = 'hidden';
       const locBox = document.getElementById('face-loc-box');
       if(locBox) locBox.style.display = 'flex';
       const locTxt = document.getElementById('face-loc-txt');
       if(locTxt) locTxt.textContent = locTitle;
       const fcName = document.getElementById('fc-name');
       if(fcName) fcName.textContent = '???';
       const fcRoom = document.getElementById('fc-room');
       if(fcRoom) fcRoom.textContent = locTitle;
       const fBack = document.getElementById('face-back');
       if(fBack) fBack.style.display = 'none'; // 돌아가기 버튼 강제 숨김
       document.getElementById('face-screen').classList.add('on');
       facePhase = 'ending';
    } else {
       const bgImg = document.getElementById('loc-bg-img');
       if(bgImg) { bgImg.src = defaultBg; bgImg.style.visibility = 'visible'; }
       const nameBox = document.getElementById('loc-namebox');
       if(nameBox) nameBox.textContent = '▣ ' + locTitle;
       const hdrTitle = document.getElementById('loc-hdr-title');
       if(hdrTitle) hdrTitle.textContent = '■ ' + locTitle;
       const sprites = document.getElementById('loc-sprites');
       if(sprites) sprites.innerHTML = '';
       const lBack = document.getElementById('loc-back');
       if(lBack) lBack.style.display = 'none'; // 돌아가기 버튼 강제 숨김
       document.getElementById('loc-screen').classList.add('on');
       locPhase = 'ending';
    }

    const textEl = document.getElementById(isFace ? 'face-dtext' : 'loc-dtext');
    const advEl = document.getElementById(isFace ? 'face-advance' : 'loc-advance');
    const nameEl = document.getElementById(isFace ? 'face-dname' : 'loc-dname');
    const choicesEl = document.getElementById(isFace ? 'face-choices' : 'loc-choices');

    if(textEl._typingTimer){ clearInterval(textEl._typingTimer); textEl._typingTimer = null; }

    let idx = 0;
    let endingAutoTimer = null;

    // 대사 출력 함수
    function next() {
      if(idx >= data.lines.length) {
        textEl.textContent = '';
        advEl.style.display = 'none';
        nameEl.style.display = 'none';
        
        // 엔딩 나레이션이 완전히 종료된 후 '처음으로' 버튼 출력
        let html = `<div style="text-align:center; padding:16px 0; animation: fadeIn 1s ease-in-out;">`;
        html += `<div style="font-size:10px;color:#888;letter-spacing:4px;margin-bottom:8px;">${data.title}</div>`;
        html += `<div style="font-size:18px;color:#fff;letter-spacing:3px;font-weight:bold;margin-bottom:20px;">${data.main}</div>`;
        if(data.credit && !data.noCredit) {
          html += `<div style="font-size:11px;color:#666;line-height:2.2;margin-bottom:24px;">${data.credit.replace(/\n/g,'<br>')}</div>`;
        }
        html += `<button onclick="location.reload()" style="font-family:'Courier New', Courier, monospace; font-size:12px; font-weight:bold; background:#fff; color:#000; border:2px solid #000; padding:8px 24px; cursor:pointer; letter-spacing:2px; box-shadow: 2px 2px 0 #888;">[ 처음으로 ]</button>`;
        html += `</div>`;
        
        choicesEl.innerHTML = html;
        return;
      }

      const raw = data.lines[idx++];

      // 연출 지시어 (!202, !201문열림 등) 처리
      if(raw.startsWith('!')) {
         const dirs = raw.trim().split(/\s+/);
         dirs.forEach(d => {
           if(isFace) {
               if(d === '!202') {
                 const cImg = document.getElementById('face-char-img');
                 if(cImg) { cImg.src = '캐릭터/202.png'; cImg.style.visibility = 'visible'; }
               } else if (d === '!x') {
                 const cImg = document.getElementById('face-char-img');
                 if(cImg) cImg.style.visibility = 'hidden';
               } else {
                 const cleanBg = d.slice(1);
                 const bgImg = document.getElementById('face-bg-img');
                 if(bgImg) { bgImg.src = '배경/' + cleanBg + '.png'; }
               }
           }
         });
         next();
         return;
      }

      const auto = raw.endsWith(',,');
      const text = raw.replace(/,,$/, '');

      let speaker = null;
      let speech = text;
      const cIdx = text.indexOf(': ');
      if(cIdx !== -1 && !text.startsWith('(')) {
         speaker = text.substring(0, cIdx);
         speech = text.substring(cIdx + 2);
      }

      if(speaker) {
         nameEl.textContent = speaker;
         nameEl.style.display = 'block';
         textEl.style.color = '#fff';
         textEl.style.fontStyle = 'normal';
      } else {
         nameEl.style.display = 'none';
         textEl.style.color = '#999';
         textEl.style.fontStyle = 'italic';
      }

      advEl.style.display = auto ? 'none' : 'block';
      choicesEl.innerHTML = '';

      typeText(textEl, speech, null, 22);
      
      if(auto) {
         endingAutoTimer = setTimeout(next, 2000);
      }
    }

    // 클릭/스페이스바 대응 로직
    window._endingNext = () => {
       if(textEl._typingTimer) {
          // 타이핑 중일 때 클릭 -> 즉시 완성
          clearInterval(textEl._typingTimer);
          textEl._typingTimer = null;
          const raw = data.lines[idx - 1] || '';
          let text = raw.replace(/,,$/, '');
          const cIdx = text.indexOf(': ');
          if(cIdx !== -1 && !text.startsWith('(')) text = text.substring(cIdx + 2);
          textEl.textContent = text;

          // 오토 대사일 경우 즉시 스킵 후, 짧은 대기시간 적용
          if(raw.endsWith(',,')) {
             clearTimeout(endingAutoTimer);
             endingAutoTimer = setTimeout(next, 1000);
          }
       } else {
          // 타이핑 완료 상태에서 클릭 -> 바로 다음으로
          clearTimeout(endingAutoTimer);
          next();
       }
    };

    next();
  };

  // 기존 검은 화면을 폐기하고, 루트별로 배경을 지정해 커스텀 UI 실행
  if(route === 'END_3') {
    playCustomUI('face', data, '배경/경비실.png', '경비실');
  } else if(route === 'END_2_A') {
    playCustomUI('loc', data, '배경/1F복도.png', '1층 복도');
  } else if(route === 'END_1') {
    playCustomUI('face', data, '배경/경비실.png', '경비실');
  } else if(route === 'END_2_B') {
    playCustomUI('face', data, '배경/301문닫힘.png', '301호 앞');
  } else if(route === 'END_2_C') {
    playCustomUI('face', data, '배경/201문닫힘.png', '201호 앞');
  }
}

function showDayTransition(nextDay, cb){
  const overlay = document.getElementById('day-transition');
  const txt = document.getElementById('day-transition-text');
  if(!overlay||!txt){if(cb)cb();return;}
  txt.innerHTML = `— 다음날 —<br>DAY ${nextDay}`;
  overlay.classList.add('in');
  setTimeout(()=>{
    overlay.style.transition='opacity .6s';
    overlay.style.opacity='0';
    setTimeout(()=>{
      overlay.classList.remove('in');
      overlay.style.opacity='';
      overlay.style.transition='';
      if(cb)cb();
    }, 650);
  }, 1400);
}

function renderBoard(){
  const list=document.getElementById('board-list');
  list.innerHTML=BOARD_POSTS.slice().reverse().map(p=>`
    <div class="bp ${p.pin?'pin':''}" onclick="openBoardPost(${p.id})">
      <div class="bpm"><span>${p.tag?`<span class="bptag">${p.tag}</span>`:''}${p.author}</span><span>Day ${p.day}</span></div>
      <div class="bptitle">${p.title}</div>
      <div class="bpprev">${p.preview}</div>
    </div>`).join('');
}
function openBoardPost(id){
  const p=BOARD_POSTS.find(x=>x.id===id);if(!p)return;
  document.getElementById('bm-meta').textContent=`${p.author}  ·  Day ${p.day}`;
  document.getElementById('bm-title').textContent=p.title;
  document.getElementById('bm-content').innerHTML=p.body.replace(/\n/g,'<br>');
  document.getElementById('board-modal').classList.add('on');
}
function closeBoardModal(){document.getElementById('board-modal').classList.remove('on');}

function triggerEventsForDay(day){
  const seq=DAY_SEQUENCE[day]||[];
  seq.forEach((evt,i)=>{
    if(DONE_EVENTS.has(evt.id))return;
    if(evt.trigger){
      const [type,dep]=evt.trigger.split(':');
      if(type==='after'&&!DONE_EVENTS.has(dep))return;
    }
    if(!evt.trigger){
      executeEvent(evt);
    }
  });
  // E2A Day5 — 1층 복도 방문 시 결판 씬이 뜨도록 state 세팅
  if(day===5 && _devEndingRoute==='END_2_A'){
    RES_EVENT_STATE['101']='EVT_D5_SHOWDOWN';
  }
}

function executeEvent(evt){
  if(DONE_EVENTS.has(evt.id))return;
  // requireFlag 체크 — 플래그 없으면 실행 안 함
  if(evt.requireFlag && !getFlag(evt.requireFlag)){DONE_EVENTS.add(evt.id);return;}
  // requireNotFlag 체크 — 플래그 있으면 실행 안 함
  if(evt.requireNotFlag && getFlag(evt.requireNotFlag)){DONE_EVENTS.add(evt.id);return;}
  // requireRoute 체크 — 루트가 다르면 실행 안 함
  if(evt.requireRoute && _devEndingRoute !== evt.requireRoute){DONE_EVENTS.add(evt.id);return;}
  
  if(currentDay === 6 && (evt.resId === '202' || (evt.type === 'chat' && evt.resId === '202'))){
    const clues = CLUES_COLLECTED.length;
    const qualifiesForEnd3 = _devEndingRoute === 'END_3' || clues >= 3 || (clues >= 2 && RES['202'].favor >= 70);
    if(!qualifiesForEnd3){
      DONE_EVENTS.add(evt.id); 
      return;
    }
  }

  if(evt.type!=='chat' && evt.type!=='face'){
    DONE_EVENTS.add(evt.id);
  }

  if(evt.type==='complaint'){
    const c=evt.complaint;
    if(!CLIST.find(x=>x.id===c.id)){
      CLIST.push({id:c.id, room:c.room, subj:c.subj, time:c.time,
                  body:c.lines.join('\n'), u:true,
                  lines:c.lines, resId:evt.resId});
      const tndC=document.getElementById('tnd-c');
      if(tndC)tndC.style.display='inline-block';
      SND.play('민원함');
      setTimeout(()=>log('새로운 민원이 접수됐습니다. ('+c.room+')'),300);

      if(evt.resId){
        markNewMsg(evt.resId);
        const replyEvtId=evt.id+'_REPLY';
        const replyChoices=evt.complaint.replyChoices||[];
        if(replyChoices.length){
          pendingChatChoice[evt.resId]={evtId:replyEvtId, choices:replyChoices};
          if(curR===evt.resId){
            renderChat(evt.resId);
            showChatChoices(evt.resId, replyChoices, replyEvtId);
          }
        }
      }
      renderCL();updateHome();
    }
    checkTriggers();

  } else if(evt.type==='chat'){
    const resId=evt.resId;
    pushMsgsSeq(resId, [...(evt.intro||[])], ()=>{
      pendingChatChoice[resId]={choices:evt.choices, evtId:evt.id};
      markNewMsg(resId);
      if(curR===resId){
        renderChat(resId);
        showChatChoices(resId, evt.choices, evt.id);
      }
    });
    log(RES[resId]?.room+' 에서 메시지가 왔습니다.');

  } else if(evt.type==='board'){
    if(!BOARD_POSTS.find(p=>p.id===evt.post.id)){
      BOARD_POSTS.push(evt.post);
      const tndB=document.getElementById('tnd-b');
      if(tndB)tndB.style.display='inline-block';
      setTimeout(()=>log('게시판에 새 글이 등록됐습니다.'),300);
      renderBoard();
    }
    checkTriggers();
    
  } else if(evt.type==='state_change'){
    (evt.changes||[]).forEach(c=>{
      if(c.resId&&c.newState!==undefined) RES_EVENT_STATE[c.resId]=c.newState;
    });
    checkTriggers();
    
  } else if(evt.type==='chat_push'){
    const resId=evt.resId;
    const step=(CHAT_SCRIPTS[resId]||[]).find(s=>s.id===evt.chatStepId);
    if(step){
      const msgs=step.msgs||[];
      markNewMsg(resId);
      log(RES[resId]?.room+' 에서 메시지가 왔습니다.');
      if(msgs.length){
        if(curR===resId){
          pushMsgsSeq(resId, [...msgs], ()=>{
            if(step.taps&&step.taps.length){
              pendingChatChoice[resId]={evtId:step.id,choices:step.taps};
              showChatChoices(resId,step.taps,step.id);
            }
          });
        } else {
          pendingChatChoice[resId]={evtId:step.id,choices:step.taps||[],pendingMsgs:[...msgs]};
        }
      } else if(step.taps){
        pendingChatChoice[resId]={evtId:step.id,choices:step.taps};
        if(curR===resId)showChatChoices(resId,step.taps,step.id);
      }
    }
    checkTriggers();
    
  } else if(evt.type==='flag_set'){
    const req=evt.requireFlag;
    if(!req||getFlag(req)){
      setFlag(evt.flagToSet);
      DONE_EVENTS.add(evt.id);
      if(evt.resId&&curR===evt.resId) loadChatScript(evt.resId);
    }
    checkTriggers();
    
  } else if(evt.type==='face'){
    const resId=evt.resId;
    if(evt.state) RES_EVENT_STATE[resId] = evt.state;
    setTimeout(()=>{
      if(typeof antHideFace==='function')antHideFace();
      openFace(resId);
    }, evt.delay || 500);
    DONE_EVENTS.add(evt.id); 
    checkTriggers();
  }
}

function checkTriggers(){
  const seq=DAY_SEQUENCE[currentDay]||[];
  seq.forEach(evt=>{
    if(DONE_EVENTS.has(evt.id))return;
    if(!evt.trigger)return;
    const [type,dep]=evt.trigger.split(':');
    if(type==='after'&&DONE_EVENTS.has(dep)){
      const delay=evt.delay||1200;
      setTimeout(()=>executeEvent(evt), delay);
    }
  });
}

const pendingChatChoice={};

function showChatChoices(resId, choices, evtId){
  const box=document.getElementById('chat-choices');
  if(!box)return;
  if(DONE_EVENTS.has(evtId)){box.innerHTML='';return;}
  box.innerHTML=(choices||[]).map((c,i)=>{
    const label=c.label||c;
    return`<button class="choice-btn" onclick="pickChatChoice('${resId}',${i},'${evtId}')">${label}</button>`;
  }).join('');
}

function pickChatChoice(resId, idx, evtId){
  if(DONE_EVENTS.has(evtId))return;

  let choice=null;
  const pend=pendingChatChoice[resId];
  if(pend&&pend.evtId===evtId){
    choice=pend.choices?.[idx];
  }
  if(!choice){
    for(const dayEvts of Object.values(DAY_SEQUENCE)){
      const e=dayEvts.find(e=>e.id===evtId);
      if(e&&e.choices){choice=e.choices[idx];break;}
    }
  }
  if(!choice){
    for(const scripts of Object.values(CHAT_SCRIPTS)){
      for(const step of scripts){
        if(step.id===evtId&&step.taps){choice=step.taps[idx];break;}
      }
      if(choice)break;
    }
  }
  if(!choice)return;

  DONE_EVENTS.add(evtId);
  const box=document.getElementById('chat-choices');
  if(box)box.innerHTML='';
  delete pendingChatChoice[resId];

  const myText=choice.sends||choice.label||'';
  chatH[resId].push({f:'s',t:myText});
  if(curR===resId)renderChat(resId);

  const rawMsgs=choice.lines||(choice.replyLines||choice.reply||[]);
  const followUp=choice.followUp||[];
  const allMsgs=[...rawMsgs, ...followUp];

  const afterAll=()=>{
    if(choice.favor){
      RES[resId].favor=Math.max(0,Math.min(100,RES[resId].favor+choice.favor));
      showFavorToast(choice.favor, false);
      if(curR===resId)updateProfile(resId);
      updateHappiness();updateHome();
    }
    if(choice.flag){
      setFlag(choice.flag);
      DONE_EVENTS.add(choice.flag);
      if(choice.flag==='EVT_002_INTRO_DONE') RES_EVENT_STATE['201']='EVT_201_INIT';
    }
    CLIST.filter(c=>c.resId===resId||c.room===RES[resId]?.room).forEach(c=>c.u=false);
    renderCL();updateHome();
    checkTriggers();
    
    if(choice.gotoLoc){
      setTimeout(()=>gotoLocation(choice.gotoLoc), 600);
      return;
    }
    if(choice._face){
      setTimeout(()=>{
        if(typeof antHideFace==='function')antHideFace();
        closeCC();
        if(curR)closeRes();
        activeTab=null;
        document.querySelectorAll('.tb').forEach(b=>b.classList.remove('act'));
        switchPanel('home');
        
        openFace(choice._face);
      }, 600);
      return;
    }

    if(curR===resId)loadChatScript(resId);
  };

  if(allMsgs.length){
    pushMsgsSeq(resId, allMsgs, afterAll);
  } else {
    afterAll();
  }
}

function loadChatScript(id){
  const scripts=CHAT_SCRIPTS[id];
  const box=document.getElementById('chat-choices');
  if(!box)return;

  const pending=pendingChatChoice[id];
  if(pending&&!DONE_EVENTS.has(pending.evtId)){
    if(!pending.pendingMsgs||!pending.pendingMsgs.length){
      showChatChoices(id,pending.choices,pending.evtId);
    }
    return;
  }

  if(!scripts||!scripts.length){box.innerHTML='';return;}

  for(const step of scripts){
    if(DONE_EVENTS.has(step.id))continue;
    if(getFlag('MSGS_SHOWN_'+step.id)){
      DONE_EVENTS.add(step.id); 
      continue;
    }
    if(step.requireFlag&&!getFlag(step.requireFlag))continue;
    if(step.requireDay&&currentDay<step.requireDay)continue;

    const shownKey='MSGS_SHOWN_'+step.id;
    setFlag(shownKey);
    if(step.msgs&&step.msgs.length){
      pushMsgsSeq(id, [...step.msgs], ()=>{
        if(curR===id)showChatChoices(id,step.taps,step.id);
        else {
          pendingChatChoice[id]={evtId:step.id,choices:step.taps||[]};
          markNewMsg(id);
        }
      });
    } else {
      if(step.taps&&step.taps.length) showChatChoices(id,step.taps,step.id);
      else box.innerHTML='';
    }
    return;
  }
  box.innerHTML=''; 
}

function selRes(id){
  curR=id;
  document.querySelectorAll('.rb').forEach(b=>b.classList.remove('sel'));
  ['301','202','201','102','101'].forEach((k,i)=>{if(k===id)document.querySelectorAll('.rb')[i].classList.add('sel');});
  newMsgFlags[id]=false;
  updateSidebarDots();
  const r=RES[id];
  updateResidentProfile(id);
  document.getElementById('chat-ttl').textContent='\u25a0 '+r.room;
  renderChat(id);

  const pend=pendingChatChoice[id];
  if(pend&&pend.pendingMsgs&&pend.pendingMsgs.length){
    const msgs=[...pend.pendingMsgs];
    delete pend.pendingMsgs;
    pushMsgsSeq(id, msgs, ()=>{
      if(pend.choices&&pend.choices.length){
        showChatChoices(id, pend.choices, pend.evtId);
      }
    });
  } else {
    const q=_getQueue(id);
    if(q._pendingLine){
      const text=q._pendingLine.m.t||q._pendingLine.m.text||'';
      const box=document.getElementById('chat-choices');
      if(box) box.innerHTML=`<button class="choice-btn player-line" onclick="confirmPlayerLine('${id}','${text.replace(/'/g,"\'")}',this)">${text}</button>`;
    } else {
      loadChatScript(id);
    }
  }

  activeTab=null;
  document.querySelectorAll('.tb').forEach(b=>b.classList.remove('act'));
  switchPanel('res');
  log(r.room+' 주민 정보 열람');
}

const newMsgFlags={};
function markNewMsg(resId){
  newMsgFlags[resId]=true;
  updateSidebarDots();
  if(curR!==resId) SND.play('채팅알람');
}
function updateSidebarDots(){
  ['301','202','201','102','101'].forEach((id,i)=>{
    const btn=document.querySelectorAll('.rb')[i];
    if(!btn)return;
    let dot=btn.querySelector('.rdot');
    if(newMsgFlags[id]){
      if(!dot){dot=document.createElement('span');dot.className='rdot';btn.appendChild(dot);}
    } else {
      if(dot)dot.remove();
    }
  });
}

function renderChat(id){
  const msgs=chatH[id]||[];
  const box=document.getElementById('chatbox');
  if(!box)return;

  const complaints=CLIST.filter(c=>c.resId===id||c.room===RES[id]?.room);

  let html='';
  if(complaints.length){
    complaints.forEach(c=>{
      html+=`<div class="cm-complaint">
        <div class="cm-complaint-tag">민원</div>
        <div class="cm-complaint-from">${c.room} · ${c.time}</div>
        ${(c.lines||c.body.split('\n')).filter(l=>l.trim()).map(l=>`<div class="cm-complaint-line">${l}</div>`).join('')}
      </div>`;
    });
  }

  if(!msgs.length&&!complaints.length){
    box.innerHTML='<div style="color:#222;font-size:11px;text-align:center;padding:20px;line-height:2;">대화 내역 없음</div>';
    return;
  }

  html+=msgs.map(m=>{
    if(m.f==='day-divider')return`<div class="cm-day-divider"><span>DAY ${m.day}</span></div>`;
    if(m.f==='sys')return`<div class="cm-sys">${m.t}</div>`;
    return`<div class="cm ${m.f==='r'?'r':'s'}">
      <div class="csdr">${m.f==='r'?RES[id]?.room||id:'경비원'}</div>
      <div class="cbbl">${m.t}</div>
    </div>`;
  }).join('');

  box.innerHTML=html;
  box.scrollTop=box.scrollHeight;
}

function repC(room){
  const k=Object.keys(RES).find(k=>RES[k].room===room);
  if(k){
    selRes(k);
    log('민원 답장 — '+room);
  }
}

function doSend(){
  if(!curR)return;
  const inp=document.getElementById('chin'),txt=inp.value.trim();
  if(!txt)return;
  inp.value='';
  chatH[curR].push({f:'s',t:txt});
  renderChat(curR);
  const r=RES[curR];
  const resp=r.freeResp[Math.floor(Math.random()*r.freeResp.length)];
  setTimeout(()=>{chatH[curR].push({f:'r',t:resp});renderChat(curR);},900);
}

document.getElementById('chin').addEventListener('keydown',e=>{if(e.key==='Enter')doSend();});

document.addEventListener('keydown', e=>{
  if(e.key!=='Enter'&&e.key!==' ')return;
  if(document.activeElement===document.getElementById('chin'))return;
  if(document.activeElement===document.getElementById('logta'))return;
  e.preventDefault();
  if(document.getElementById('face-screen').classList.contains('on')){
    advanceDialogue();
    return;
  }
  if(document.getElementById('loc-screen')?.classList.contains('on')){
    advanceLocDialogue();
    return;
  }
  if(document.getElementById('opening').style.display!=='none'&&
     document.getElementById('opening').style.opacity!=='0'){
    opAdvance();
    return;
  }
});

function renderCL(){
  const cl=document.getElementById('clist');
  const hdr=cl.querySelector('#clist-hdr')?.outerHTML||'<div id="clist-hdr" class="st-diag">▣ 받은 민원</div>';
  const bg=cl.querySelector('#clist-bg')?.outerHTML||'<div id="clist-bg" class="st-30"></div>';
  const items=CLIST.map(c=>`<div class="ci ${curC===c.id?'act':''}" onclick="selC(${c.id})"><div class="cifrom">${c.u?'<span class="ciudot"></span>':''}${c.room}</div><div class="cisubj">${c.subj}</div><div class="citime">${c.time}</div></div>`).join('');
  cl.innerHTML=bg+hdr+items;
  document.getElementById('tnd-c').style.display=CLIST.some(c=>c.u)?'inline-block':'none';
  updateHome();
}
function selC(id){
  curC=id;const c=CLIST.find(x=>x.id===id);c.u=false;renderCL();
  document.getElementById('cdet').innerHTML=`<div id="cdet-bg" style="position:absolute;inset:0;z-index:0;background-color:#000;background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.03) 0,rgba(255,255,255,.03) 1px,transparent 0,transparent 40px);pointer-events:none;"></div><div class="cd-wrap"><div class="cdh"><div class="cdfrom">${c.room} · ${c.time}</div><div class="cdsubj">${c.subj}</div></div><div class="cdbody">${c.body}</div><button class="repbtn" onclick="repC('${c.room}')">▶ 답장하기</button></div>`;
}
function bigCC(l){
  const name=l.split(' / ').pop();
  const img=document.getElementById('ccbig-img');
  if(img){
    img.style.visibility='visible';
    img.src='배경/CCTV/'+name+'.png';
  }
  document.getElementById('ccbig').classList.add('on');
  document.getElementById('ccbigtitle').textContent='■ '+l;
  log('CCTV 확대 — '+l);
  const gotoBox=document.getElementById('cc-goto-btns');
  if(gotoBox){
    const locMap={'1F 복도':'1F복도','2F 복도':'2F복도','쓰레기장':'쓰레기장','흡연실':'흡연실'};
    const locName=locMap[name];
    if(locName&&LOC_SCRIPTS[locName]){
      gotoBox.innerHTML='<button class="cc-goto" onclick="closeCC();setTimeout(()=>gotoLocation(\''+locName+'\'),300)">▶ 이동하기</button>';
    }else{
      gotoBox.innerHTML='';
    }
  }
  if(name==='쓰레기장'&&getFlag('EVT_002_CCTV')&&!getFlag('CCTV_쓰레기장_CHECKED')){
    setFlag('CCTV_쓰레기장_CHECKED');
    setTimeout(()=>{
      if(curR==='201'){
        loadChatScript('201');
      } else {
        pendingChatChoice['201']={evtId:'CHAT_201_AFTER_CCTV', choices:
          ((CHAT_SCRIPTS['201']||[]).find(s=>s.id==='CHAT_201_AFTER_CCTV')||{}).taps||[]};
        markNewMsg('201');
      }
    }, 800);
  }
}
function closeCC(){SND.stopCCTV();document.getElementById('ccbig').classList.remove('on');}

let saveT=null;
try{const s=localStorage.getItem('vlog');if(s)document.getElementById('logta').value=s;}catch(e){}
document.getElementById('logta').addEventListener('input',()=>{clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem('vlog',document.getElementById('logta').value);}catch(e){}const el=document.getElementById('log-saved');el.textContent='저장됨';el.style.color='#555';setTimeout(()=>el.textContent='',2000);},1000);});

// ── [수정] doVisit: 복잡한 팝업 블로킹 로직 제거 ──
// 이제 doVisit은 바로 대면(openFace) 화면으로 이동시킵니다.
// 문이 닫혔거나 인기척이 없는 섬뜩한 예감 등은 대면 화면 대화창 나레이션으로 자연스럽게 노출됩니다.
function doVisit(){
  if(!curR)return;
  const r=RES[curR];
  const resId=curR;

  const fd=document.getElementById('fade');
  document.getElementById('fademsg').textContent=r.room+' 앞으로 이동 중...';
  fd.classList.add('in');
  setTimeout(()=>{
    SND.playVisit(resId);
    openFace(resId);
    setTimeout(()=>fd.classList.remove('in'),200);
  },800);
  log(r.room+' 방문');
}

// ── [수정] openFace: 6일 차 부재 및 극단적 방치 상태를 대화창 나레이션으로 동적 구현 ──
// 문닫힘 배경화면이 출력된 후, 대화창 내부 텍스트로 섬뜩하거나 비어있는 묘사들이 자연스럽게 타건됩니다.
function openFace(resId){
  if(typeof antHideFace==='function')antHideFace();
  const r=RES[resId];
  if(!r){console.error('[openFace] RES에 없는 ID:',resId);return;}

  const visitState=RES_EVENT_STATE[resId];
  let customNoVisitMsg = null;

  if (resId === '201' && getFlag('ABANDONED_201') && currentDay >= 6) {
    customNoVisitMsg = '(노크했다. 뽀삐 짖는 소리조차 들리지 않는다. 섬뜩할 정도로 조용하다.)';
  } else if (resId === '301' && getFlag('NEGLECT_301') && currentDay >= 6) {
    customNoVisitMsg = '(노크해도 반응 없다. 항상 들리던 기괴한 혼잣말도 멈췄다.)';
  } else if ((resId === '101' || resId === '102') && getFlag('EVT_D4_006_NEGLECT') && currentDay >= 6) {
    customNoVisitMsg = '(안에서 아무런 인기척이 없다. 불길한 예감이 든다.)';
  } else if (visitState && visitState.endsWith('_NOVISIT')) {
    const noVisitMsgs = {
      '101': '(문을 두드렸다. 안에서 발소리가 멎는 게 들렸다. 그게 다였다.)',
      '201': '(노크했다. 아무 소리도 없다. 불은 켜져 있는 것 같다.)',
      '202': '(아무도 없는 것 같다. 나간 모양이다.)',
      '301': '(노크해도 반응 없다. 안에서 뭔가 끄는 소리만 들린다.)',
      '102': '(문 두드려도 대답이 없다. 이어폰 끼고 있는 건지.)',
    };
    customNoVisitMsg = noVisitMsgs[resId] || '(반응이 없다.)';
  }

  let scripted = null;
  if (customNoVisitMsg) {
    scripted = {
      bg: '배경/' + resId + '문닫힘.png',
      char: 'x',
      lines: [customNoVisitMsg],
      choices: null,
      choiceResults: null,
      onEnd: visitState
    };
  } else {
    const evtKey=RES_EVENT_STATE[resId];
    if(evtKey&&FACE_SCRIPTS[evtKey]){
      const candidate=FACE_SCRIPTS[evtKey];
      const flagOk=!candidate.requireFlag||getFlag(candidate.requireFlag);
      const dayOk=!candidate.requireDay||(currentDay>=candidate.requireDay);
      const routeOk=!candidate.requireRoute||(_devEndingRoute===candidate.requireRoute);
      // 복도/장소 씬은 doVisit(직접 방문)으로 열리면 안 됨 — loc이 호수와 다른 경우 폴백
      const isLocScene = candidate.loc && !candidate.loc.includes(resId+'호') && !candidate._forceOpen;
      if(flagOk&&dayOk&&routeOk&&!isLocScene) scripted=candidate;
    }
    if(!scripted) scripted=FACE_SCRIPTS['DEFAULT_VISIT_'+resId]||FACE_SCRIPTS['default'];
  }

  faceScript=JSON.parse(JSON.stringify(scripted));
  
  // --- [추가] 6일 차 고재엽 경비실 방문 시 배경 강제 지정 ---
  // (스크립트에 배경이 누락되었을 경우 투명해지며 오프닝 화면이 비치는 버그 방지)
  if (currentDay >= 6 && resId === '202') {
     faceScript.bg = '경비실.png';
     faceScript.loc = '경비실';
  }
  // --------------------------------------------------------

  faceScript.resId=resId;
  faceScript._endAfterLines=false;
  faceContinuation=null;
  RES_STATE[resId].met=true;
  if(curR===resId)updateResidentProfile(resId);
  faceLineIdx=0; facePhase='narrate';

  const bgImg=document.getElementById('face-bg-img');
  let defaultBg=faceScript.bg||'배경/'+resId+'문닫힘.png';
  if(faceScript.bg){
    let bgName = faceScript.bg.replace('.png', '');
    if(!bgName.includes('/')) defaultBg = '배경/' + bgName + '.png';
    else defaultBg = faceScript.bg;
  }
  if(bgImg){bgImg.style.visibility='visible';bgImg.src=defaultBg;}

  const charImg=document.getElementById('face-char-img');
  if(charImg){
    if(faceScript.char){
      if(faceScript.char === 'x') { charImg.style.visibility='hidden'; }
      else {
        charImg.style.visibility='visible';
        let cName = faceScript.char.replace('.png', '');
        if(!cName.includes('/')) cName = '캐릭터/' + cName + '.png';
        else cName = faceScript.char;
        charImg.src=cName;
      }
    } else {
      charImg.style.visibility='hidden';charImg.src='';
    }
  }

  const elMap={
    'fc-name':profileNameFor(resId),
    'fc-room':faceScript.room||r.room,
    'fc-fav':r.favor+' / 100',
    'fc-loc':faceScript.loc||r.room+' 앞',
    'face-daydisp':document.getElementById('daydisp')?.textContent||'DAY 1',
    'face-dname':'—'
  };
  Object.entries(elMap).forEach(([id,val])=>{
    const el=document.getElementById(id);if(el)el.textContent=val;
  });
  const favfill=document.getElementById('fc-favfill');
  if(favfill)favfill.style.width=r.favor+'%';
  const locBox=document.getElementById('face-loc-box');
  const locTxt=document.getElementById('face-loc-txt');
  if(locTxt)locTxt.textContent=faceScript.loc||r.room+' 앞';
  if(locBox)locBox.style.display='flex';
  document.getElementById('face-screen').classList.add('on');
  showFaceLine();
}

function changeExpr(resId,expr){
  const img=document.getElementById('face-char-img');
  if(!img)return;
  img.style.visibility='visible';
  img.src=expr?'캐릭터/'+resId+'-'+expr+'.png':'캐릭터/'+resId+'.png';
  img.onerror=()=>{};
}

function _activeLines(){return faceContinuation?faceContinuation.lines:faceScript.lines;}
function _activeChoices(){return faceContinuation?faceContinuation.choices:faceScript.choices;}
function _activeChoiceResults(){return faceContinuation?faceContinuation.choiceResults:faceScript.choiceResults;}

function showFaceLine(){
  const txt=document.getElementById('face-dtext');
  const adv=document.getElementById('face-advance');
  const ch=document.getElementById('face-choices');
  const dname=document.getElementById('face-dname');
  const lines=_activeLines();
  if(!txt||!adv||!ch)return;

  if(facePhase==='narrate'){
    if(faceLineIdx<lines.length){
      const line=lines[faceLineIdx];
      const raw=typeof line==='string'?line:(line.text||'');

      if(typeof line==='string'&&line.startsWith('!')){
        const directives=line.trim().split(/\s+/); 
        directives.forEach(d=>{
          if(!d.startsWith('!'))return;
          let fname=d.slice(1);
          if(!fname)return;

          fname = fname.replace('.png', '');
          const hasDoor=fname.includes('문') || fname.includes('배경') || fname === '경비실';
          if(hasDoor){
            const bgImg=document.getElementById('face-bg-img');
            if(bgImg){bgImg.style.visibility='visible';bgImg.src='배경/'+fname+'.png';}
            if(fname.includes('문닫힘')){
              const charImg=document.getElementById('face-char-img');
              if(charImg)charImg.style.visibility='hidden';
            }
            if(fname.includes('문열림')&&faceScript?.resId){
              const charImg=document.getElementById('face-char-img');
              if(charImg){charImg.style.visibility='visible';charImg.src='캐릭터/'+faceScript.resId+'.png';}
            }
          } else {
            const charImg=document.getElementById('face-char-img');
            if(charImg){
              if(fname==='x'){charImg.style.visibility='hidden';}
              else{charImg.style.visibility='visible';charImg.src='캐릭터/'+fname+'.png';charImg.onerror=()=>{};}
            }
          }
        });
        faceLineIdx++;
        showFaceLine();
        return;
      }

      const autoAdv=raw.endsWith(',,');
      const displayText=autoAdv?raw.slice(0,-2):raw;

      if(typeof line==='string'){
        if(dname)dname.textContent='—';
        txt.style.color='#999';
        txt.style.fontStyle='italic';
        typeText(txt, displayText, null, 18);
      } else {
        if(dname)dname.textContent=line.speaker||'???';
        txt.style.color='#eee';
        txt.style.fontStyle='normal';
        if(line.expr&&faceScript.resId)changeExpr(faceScript.resId,line.expr);
        typeText(txt, displayText, null, 18);
      }
      adv.style.display=autoAdv?'none':'block';
      ch.innerHTML='';

      if(autoAdv){
        setTimeout(()=>{faceLineIdx++;showFaceLine();},2000);
      }
    } else {
      const choices=_activeChoices();
      if(!choices||choices.length===0){_showFaceEnd();return;}
      facePhase='choice';
      if(dname)dname.textContent='';
      txt.textContent='';
      adv.style.display='none';
      ch.innerHTML=choices.map((c,i)=>
        `<button class="face-choice" onclick="pickFaceChoice(${i})">${c}</button>`
      ).join('');
    }
  }
}

function advanceDialogue(){
  // --- [수정] 대면 화면 클릭/엔터 시 엔딩 진행 로직으로 연결 ---
  if(facePhase === 'ending') { window._endingNext && window._endingNext(); return; }

  if(facePhase!=='narrate')return;
  const txt=document.getElementById('face-dtext');
  if(txt&&txt._typingTimer){
    clearInterval(txt._typingTimer);
    txt._typingTimer=null;
    const lines=_activeLines();
    const line=lines[faceLineIdx];
    if(line){
      const raw=typeof line==='string'?line:(line.text||'');
      txt.textContent=raw.endsWith(',,')?raw.slice(0,-2):raw;
    }
    return;
  }
  faceLineIdx++;
  if(faceLineIdx>=_activeLines().length&&faceScript._endAfterLines){
    _showFaceEnd();return;
  }
  showFaceLine();
}

function _showFaceEnd(){
  const ch=document.getElementById('face-choices');
  const txt=document.getElementById('face-dtext');
  const adv=document.getElementById('face-advance');
  if(adv)adv.style.display='none';
  if(txt)txt.textContent='';
  if(ch)ch.innerHTML='<button class="face-choice" onclick="closeFace()">← 경비실로 돌아가기</button>';
}

function pickFaceChoice(i){
  const ch=document.getElementById('face-choices');
  const adv=document.getElementById('face-advance');
  if(ch)ch.innerHTML='';
  if(adv)adv.style.display='none';
  const choices=_activeChoices();
  if(choices&&choices[i]&&typeof choices[i]==='string'&&choices[i].includes('돌아간다')){
    closeFace();return;
  }

  const results=_activeChoiceResults();
  const result=results?.[i];
  if(!result){_showFaceEnd();return;}

  const id=faceScript.resId;
  if(result.favor&&result.favor!==0){
    RES[id].favor=Math.max(0,Math.min(100,RES[id].favor+result.favor));
    const favEl=document.getElementById('fc-fav');
    const favFill=document.getElementById('fc-favfill');
    if(favEl)favEl.textContent=RES[id].favor+' / 100';
    if(favFill)favFill.style.width=RES[id].favor+'%';
    if(typeof showFavorToast==='function')showFavorToast(result.favor, true);
    showFavorChange(result.favor,document.getElementById('face-charcard'));
    updateHappiness();updateHome();
  }
  // 복수 캐릭터 호감도 변화 (_favorMap)
  if(result._favorMap){
    Object.entries(result._favorMap).forEach(([resId,delta])=>{
      if(RES[resId]&&delta!==0){
        RES[resId].favor=Math.max(0,Math.min(100,RES[resId].favor+delta));
      }
    });
    updateHappiness();updateHome();
  }
  if(result.flags)result.flags.forEach(f=>{setFlag(f);DONE_EVENTS.add(f);});
  if(result.unlocks){
    if(result.unlocks.name)unlockResidentInfo(id,{name:true});
    if(result.unlocks.age)unlockResidentInfo(id,{age:true});
  }

  if(result._thenEnding){
    closeFace();
    setTimeout(()=>{
      _devEndingRoute = result._thenEnding;
      startEnding();
    }, 600);
    return;
  }

  if(faceScript.onEnd){
    faceScript._nextState=faceScript.onEnd;
  }

  if(result.branch&&faceScript.continuations?.[result.branch]){
    const cont=JSON.parse(JSON.stringify(faceScript.continuations[result.branch]));
    if(result.lines&&result.lines.length>0){
      cont.lines=[...result.lines,...cont.lines];
    }
    faceContinuation=cont;
    faceLineIdx=0;facePhase='narrate';
    showFaceLine();
    return;
  }

  if(result.lines&&result.lines.length>0){
    faceContinuation={lines:result.lines,choices:null,choiceResults:null};
    faceScript._endAfterLines=true;
    faceLineIdx=0;facePhase='narrate';
    showFaceLine();
  } else {
    _showFaceEnd();
  }
}

function closeFace(){
  SND.stopVisit();
  if(typeof antShowFace==='function')antShowFace();
  if(faceScript?.resId){
    if(Object.prototype.hasOwnProperty.call(faceScript,'_nextState')){
      RES_EVENT_STATE[faceScript.resId]=faceScript._nextState; 
    } else if(faceScript.onEnd!==undefined){
      RES_EVENT_STATE[faceScript.resId]=faceScript.onEnd; 
    }
  }
  const fd=document.getElementById('fade');
  document.getElementById('fademsg').textContent='';
  fd.classList.add('in');
  setTimeout(()=>{
    document.getElementById('face-screen').classList.remove('on');
    document.getElementById('face-loc-box').style.display='none';
    faceScript=null;faceLineIdx=0;facePhase='narrate';faceContinuation=null;
    setTimeout(()=>{fd.classList.remove('in');checkTriggers();},100);
  },500);
}

(function(){
  const STORAGE_KEY='villa_widgets_v2';
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch(e){}

  function applyPos(el,d){
    el.style.left=d.x+'px';el.style.top=d.y+'px';
    el.style.width=d.w+'px';el.style.height=d.h+'px';
    el.style.zIndex=d.z||10;
    if(d.min)el.classList.add('minimized');
  }
  function saveAll(){
    const out={};
    document.querySelectorAll('.widget').forEach(w=>{
      out[w.id]={
        x:parseInt(w.style.left)||0,
        y:parseInt(w.style.top)||0,
        w:parseInt(w.style.width)||100,
        h:parseInt(w.style.height)||50,
        z:parseInt(w.style.zIndex)||10,
        min:w.classList.contains('minimized')
      };
    });
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(out));}catch(e){}
  }

  let zTop=20;

  document.querySelectorAll('.widget').forEach(w=>{
    if(saved[w.id])applyPos(w,saved[w.id]);
  });

  let dragging=null,dx=0,dy=0,ox=0,oy=0;
  document.querySelectorAll('.widget').forEach(w=>{
    const hdr=w.querySelector('.w-hdr');
    if(!hdr)return;
    hdr.addEventListener('mousedown',e=>{
      if(e.target.classList.contains('w-min'))return;
      dragging=w;
      dx=e.clientX;dy=e.clientY;
      ox=w.offsetLeft;oy=w.offsetTop;
      zTop++;w.style.zIndex=zTop;
      w.classList.add('dragging');
      clearSelection();
      e.preventDefault();
    });
  });

  let resizing=null,rsx=0,rsy=0,rw0=0,rh0=0;
  document.querySelectorAll('.widget').forEach(w=>{
    const rh=w.querySelector('.w-resize');
    if(!rh)return;
    rh.addEventListener('mousedown',e=>{
      resizing=w;
      rsx=e.clientX;rsy=e.clientY;
      rw0=w.offsetWidth;rh0=w.offsetHeight;
      e.stopPropagation();e.preventDefault();
    });
  });

  const canvas=document.getElementById('widget-canvas');
  const selBox=document.getElementById('w-select-box');
  let selecting=false,selSx=0,selSy=0;

  canvas.addEventListener('mousedown',e=>{
    if(e.target.closest('.widget'))return;
    selecting=true;
    const cr=canvas.getBoundingClientRect();
    selSx=e.clientX-cr.left;
    selSy=e.clientY-cr.top;
    selBox.style.left=selSx+'px';selBox.style.top=selSy+'px';
    selBox.style.width='0px';selBox.style.height='0px';
    selBox.style.display='block';
    clearSelection();
    e.preventDefault();
  });

  document.addEventListener('mousemove',e=>{
    if(dragging){
      const cr=canvas.getBoundingClientRect();
      let nx=ox+(e.clientX-dx);
      let ny=oy+(e.clientY-dy);
      nx=Math.max(0,Math.min(nx,cr.width-dragging.offsetWidth));
      ny=Math.max(0,Math.min(ny,cr.height-dragging.offsetHeight));
      dragging.style.left=nx+'px';dragging.style.top=ny+'px';
      return;
    }
    if(resizing){
      const nw=Math.max(80,rw0+(e.clientX-rsx));
      const nh=Math.max(28,rh0+(e.clientY-rsy));
      resizing.style.width=nw+'px';resizing.style.height=nh+'px';
      return;
    }
    if(selecting){
      const cr=canvas.getBoundingClientRect();
      const cx=e.clientX-cr.left;
      const cy=e.clientY-cr.top;
      const rx=Math.min(selSx,cx);
      const ry=Math.min(selSy,cy);
      const rw=Math.abs(cx-selSx);
      const rh=Math.abs(cy-selSy);
      selBox.style.left=rx+'px';selBox.style.top=ry+'px';
      selBox.style.width=rw+'px';selBox.style.height=rh+'px';
      document.querySelectorAll('.widget').forEach(w=>{
        const wr=w.getBoundingClientRect();
        const sr=selBox.getBoundingClientRect();
        const hit=!(wr.right<sr.left||wr.left>sr.right||wr.bottom<sr.top||wr.top>sr.bottom);
        w.classList.toggle('w-selected',hit);
      });
    }
  });

  document.addEventListener('mouseup',e=>{
    if(dragging){dragging.classList.remove('dragging');dragging=null;saveAll();}
    if(resizing){resizing=null;saveAll();}
    if(selecting){
      selecting=false;
      selBox.style.display='none';
      const any=document.querySelector('.widget.w-selected');
      if(!any)clearSelection();
    }
  });

  canvas.addEventListener('click',e=>{
    if(!e.target.closest('.widget'))clearSelection();
  });

  function clearSelection(){
    document.querySelectorAll('.widget.w-selected').forEach(w=>w.classList.remove('w-selected'));
  }

  window._widgetSaveAll=saveAll;
})();

function toggleMin(e,id){
  e.stopPropagation();
  const w=document.getElementById(id);
  if(!w)return;
  const isMin=w.classList.contains('minimized');
  if(isMin){
    const savedH=parseInt(w.dataset.prevH)||120;
    w.style.height=savedH+'px';
    w.classList.remove('minimized');
  }else{
    w.dataset.prevH=w.offsetHeight;
    w.classList.add('minimized');
  }
  if(window._widgetSaveAll)window._widgetSaveAll();
}

let locScript=null,locLineIdx=0,locPhase='narrate';

function gotoLocation(locName){
  closeCC();
  // E2A Day5 — 1층 복도 방문 시 결판 씬 인터셉트
  if(locName==='1F복도' && currentDay===5 && _devEndingRoute==='END_2_A'){
    if(!DONE_EVENTS.has('EVT_D5_SHOWDOWN_DONE')){
      RES_EVENT_STATE['101']='EVT_D5_SHOWDOWN';
      if(typeof antHideFace==='function') antHideFace();
      openFace('101');
      return;
    } else if(!DONE_EVENTS.has('EVT_D5_PRELUDE_DONE')){
      RES_EVENT_STATE['101']='EVT_D5_SHOWDOWN_PRELUDE';
      if(typeof antHideFace==='function') antHideFace();
      openFace('101');
      return;
    }
  }
  const script=LOC_SCRIPTS[locName];
  if(!script){console.warn('[gotoLocation] 없는 장소:',locName);return;}
  locScript={...script,locName};
  locLineIdx=0;locPhase='narrate';

  const bg=document.getElementById('loc-bg-img');
  bg.style.visibility='visible';
  let bgPath = script.bg.replace('.png', '');
  if(!bgPath.includes('/')) bgPath = '배경/' + bgPath + '.png';
  else bgPath = script.bg;
  bg.src = bgPath;

  document.getElementById('loc-namebox').textContent='▣ '+script.label;
  document.getElementById('loc-hdr-title').textContent='■ '+script.label;

  const sprites=document.getElementById('loc-sprites');
  sprites.innerHTML=script.chars.map(c=>{
    let cPath = c.img.replace('.png', '');
    if(!cPath.includes('/')) cPath = '캐릭터/' + cPath + '.png';
    else cPath = c.img;
    return `<img class="loc-sprite-img" src="${cPath}" onerror="this.style.visibility='hidden'" alt="">`;
  }).join('');

  document.getElementById('loc-dname').style.display='none';
  document.getElementById('loc-choices').innerHTML='';
  document.getElementById('loc-advance').style.display='none';

  document.getElementById('loc-screen').classList.add('on');
  showLocLine();
  log(script.label+' 이동');
}

function showLocLine(){
  const txt=document.getElementById('loc-dtext');
  const adv=document.getElementById('loc-advance');
  const ch=document.getElementById('loc-choices');
  const dname=document.getElementById('loc-dname');

  if(locPhase==='narrate'){
    if(locLineIdx<locScript.lines.length){
      const line=locScript.lines[locLineIdx];
      if(typeof line==='object'&&line.speaker){
        dname.textContent=line.speaker;
        dname.style.display='block';
        typeText(txt, line.text, null, 18);
      } else {
        dname.style.display='none';
        typeText(txt, typeof line==='string'?line:line.text, null, 18);
      }
      adv.style.display='block';
      ch.innerHTML='';
    } else {
      locPhase='choice';
      adv.style.display='none';
      if(locScript.choices&&locScript.choices.length){
        ch.innerHTML=locScript.choices.map((c,i)=>
          `<button class="loc-choice" onclick="pickLocChoice(${i})">${c}</button>`
        ).join('');
      } else {
        closeLoc();
      }
    }
  }
}

function advanceLocDialogue(){
  // --- [수정] 장소 화면 클릭/엔터 시 엔딩 진행 로직으로 연결 ---
  if(locPhase === 'ending') { window._endingNext && window._endingNext(); return; }

  if(locPhase!=='narrate')return;
  locLineIdx++;
  showLocLine();
}

function pickLocChoice(i){
  const resp=locScript.choiceResp?.[i];
  const ch=document.getElementById('loc-choices');
  const adv=document.getElementById('loc-advance');
  ch.innerHTML='';
  adv.style.display='none';
  if(resp){
    document.getElementById('loc-dtext').textContent=resp;
    locPhase='end';
    setTimeout(()=>closeLoc(),1200);
  } else {
    closeLoc();
  }
}

function closeLoc(){
  const fd=document.getElementById('fade');
  fd.classList.add('in');
  setTimeout(()=>{
    document.getElementById('loc-screen').classList.remove('on');
    locScript=null;locLineIdx=0;locPhase='narrate';
    setTimeout(()=>{
      fd.classList.remove('in');
      checkTriggers(); 
    },100);
  },400);
}

const ANT={
  el:null,ctx:null,toast:null,
  alive:true,clicks:0,
  x:0,y:0,angle:0,
  path:[],pathIdx:0,
  speed:2.2,
  wiggle:0,
  active:false,
  deadPersist:false,
  picked:false,
  raf:null,

  init(){
    this.el=document.getElementById('ant-el');
    this.ctx=document.getElementById('ant-ctx');
    this.toast=document.getElementById('ant-toast');
    if(!this.el)return;

    this.el.addEventListener('contextmenu',e=>{
      if(!this.alive&&this.deadPersist){
        e.preventDefault();
        e.stopPropagation();
        this.showCtx(e.clientX,e.clientY);
      }
    });
    this.el.addEventListener('click',e=>{
      if(this.deadPersist)return;
      if(!this.active||!this.alive)return;
      e.stopPropagation();
      this.clicks++;
      this.el.classList.add('hit');
      setTimeout(()=>this.el.classList.remove('hit'),120);
      if(this.clicks>=5)this.die();
    });
    document.addEventListener('click',()=>this.hideCtx());
    setTimeout(()=>this.spawn(),800);
  },

  spawn(){
    if(this.deadPersist||this.picked)return;
    if(document.getElementById('face-screen').classList.contains('on'))return;
    this.alive=true;this.clicks=0;this.active=true;
    this.el.classList.remove('dead','hit');
    const W=window.innerWidth,H=window.innerHeight;

    const side=Math.floor(Math.random()*4);
    if(side===0){this.x=Math.random()*W;this.y=-20;}        
    else if(side===1){this.x=W+20;this.y=Math.random()*H;}  
    else if(side===2){this.x=Math.random()*W;this.y=H+20;}  
    else{this.x=-20;this.y=Math.random()*H;}                

    this.path=this.genPath(this.x,this.y,W,H,side);
    this.pathIdx=0;this.wiggle=0;
    this.el.style.display='block';
    this.el.style.visibility='visible';
    this.setPos();
    if(this.raf)cancelAnimationFrame(this.raf);
    this.loop();
  },

  genPath(startX,startY,W,H,enterSide){
    const exitSide=(enterSide+1+Math.floor(Math.random()*3))%4; 
    let exitX,exitY;
    if(exitSide===0){exitX=Math.random()*W;exitY=-30;}
    else if(exitSide===1){exitX=W+30;exitY=Math.random()*H;}
    else if(exitSide===2){exitX=Math.random()*W;exitY=H+30;}
    else{exitX=-30;exitY=Math.random()*H;}

    const pts=[{x:startX,y:startY}];
    const steps=4+Math.floor(Math.random()*4);
    for(let i=1;i<=steps;i++){
      const t=i/(steps+1);
      const bx=startX+(exitX-startX)*t;
      const by=startY+(exitY-startY)*t;
      const spread=Math.min(W,H)*0.28;
      pts.push({
        x:bx+(Math.random()-.5)*spread*2,
        y:by+(Math.random()-.5)*spread*2
      });
    }
    pts.push({x:exitX,y:exitY});
    return pts;
  },

  loop(){
    if(!this.active)return;
    if(this.pathIdx>=this.path.length){
      this.active=false;
      this.el.style.display='none';
      return;
    }
    const t=this.path[this.pathIdx];
    const ddx=t.x-this.x,ddy=t.y-this.y;
    const dist=Math.sqrt(ddx*ddx+ddy*ddy);
    if(dist<this.speed+1){
      this.pathIdx++;
    }else{
      this.wiggle+=(Math.random()-.5)*0.18;
      this.wiggle*=0.82;
      const ang=Math.atan2(ddy,ddx)+this.wiggle;
      this.x+=Math.cos(ang)*this.speed;
      this.y+=Math.sin(ang)*this.speed;
      this.angle=ang*(180/Math.PI);
    }
    this.setPos();
    this.raf=requestAnimationFrame(()=>this.loop());
  },

  setPos(){
    this.el.style.left=(this.x-20)+'px';
    this.el.style.top=(this.y-20)+'px';
    this.el.style.transform=`rotate(${this.angle+90}deg)`;
  },

  die(){
    this.alive=false;this.deadPersist=true;
    cancelAnimationFrame(this.raf);this.raf=null;
    this.active=false;
    this.el.classList.add('dead');
    this.el.style.transform=`rotate(${this.angle+180}deg)`;
    this.el.style.left=(this.x-20)+'px';
    this.el.style.top=(this.y-20)+'px';
  },

  showCtx(cx,cy){
    this.ctx.style.left=cx+'px';this.ctx.style.top=cy+'px';
    this.ctx.classList.add('on');
  },
  hideCtx(){this.ctx&&this.ctx.classList.remove('on');},

  showToast(msg){
    this.toast.textContent=msg;
    this.toast.classList.add('show');
    setTimeout(()=>this.toast.classList.remove('show'),2800);
  },

  resetDay(){
    if(!this.deadPersist&&!this.picked){
      const delay=Math.random()*180000+60000;
      setTimeout(()=>this.spawn(),delay);
    }
  }
};

function antPick(){
  ANT.hideCtx();
  ANT.picked=true;ANT.deadPersist=false;
  ANT.el.style.display='none';
  window.ANT_PICKED=true;
  ANT.showToast('[살생] 죽은 개미를 주웠다.');
  log('[살생] 죽은 개미를 주웠다.');
}
function antLeave(){ANT.hideCtx();}

function antHideFace(){if(ANT.el&&ANT.active&&ANT.alive)ANT.el.style.visibility='hidden';}
function antShowFace(){setTimeout(()=>{if(ANT.el&&ANT.active&&ANT.alive)ANT.el.style.visibility='visible';},600);}

ANT.init();

const SND={
  bgm:null, bgmMuted:false, bgmVol:0.35,
  cctv:null,
  _visitBgm:{}, _curVisit:null,
  sfxMuted:false, sfxVol:0.8,
  _sfx:{},

  load(){
    this.bgm=new Audio('소리/브금.mp3');
    this.bgm.loop=true;
    this.bgm.volume=this.bgmVol;
    this.bgm.play().catch(()=>{});
    this.cctv=new Audio('소리/cctv.mp3');
    this.cctv.loop=true;
    this.cctv.volume=this.bgmMuted?0:this.bgmVol;
    ['101','102','201','202','301'].forEach(id=>{
      const a=new Audio('소리/'+id+'호.mp3');
      a.loop=true;
      a.volume=this.bgmMuted?0:this.bgmVol;
      this._visitBgm[id]=a;
    });
    ['클릭','선택지','호감도','탭','시작','채팅알람','민원함'].forEach(k=>{
      const a=new Audio('소리/'+k+'.mp3');
      a.preload='auto';
      this._sfx[k]=a;
    });
  },

  playCCTV(){
    if(!this.cctv)return;
    this.cctv.currentTime=0;
    this.cctv.volume=this.bgmMuted?0:this.bgmVol;
    this.cctv.play().catch(()=>{});
  },

  stopCCTV(){
    if(!this.cctv)return;
    this.cctv.pause();
    this.cctv.currentTime=0;
  },

  playVisit(resId){
    this.stopVisit();
    const a=this._visitBgm[resId];
    if(!a)return;
    a.currentTime=0;
    a.volume=this.bgmMuted?0:this.bgmVol;
    a.play().catch(()=>{});
    this._curVisit=resId;
  },

  stopVisit(){
    if(this._curVisit){
      const a=this._visitBgm[this._curVisit];
      if(a){a.pause();a.currentTime=0;}
      this._curVisit=null;
    }
  },

  play(key){
    if(this.sfxMuted)return;
    const src=this._sfx[key];
    if(!src)return;
    const a=src.cloneNode();
    a.volume=this.sfxVol;
    a.play().catch(()=>{});
  },

  setVol(type,v){
    const vol=v/100;
    if(type==='bgm'){
      this.bgmVol=vol;
      if(this.bgm)this.bgm.volume=this.bgmMuted?0:vol;
      if(this.cctv)this.cctv.volume=this.bgmMuted?0:vol;
      Object.values(this._visitBgm).forEach(a=>{a.volume=this.bgmMuted?0:vol;});
      document.getElementById('bgm-vol-val').textContent=v;
    } else {
      this.sfxVol=vol;
      document.getElementById('sfx-vol-val').textContent=v;
    }
  },

  mute(type){
    if(type==='bgm'){
      this.bgmMuted=!this.bgmMuted;
      if(this.bgm)this.bgm.volume=this.bgmMuted?0:this.bgmVol;
      if(this.cctv)this.cctv.volume=this.bgmMuted?0:this.bgmVol;
      Object.values(this._visitBgm).forEach(a=>{a.volume=this.bgmMuted?0:this.bgmVol;});
      const btn=document.getElementById('bgm-mute-btn');
      if(btn)btn.classList.toggle('muted',this.bgmMuted);
    } else {
      this.sfxMuted=!this.sfxMuted;
      const btn=document.getElementById('sfx-mute-btn');
      if(btn)btn.classList.toggle('muted',this.sfxMuted);
    }
  }
};

function setVol(type,v){SND.setVol(type,v);}
function toggleMute(type){SND.mute(type);}

function toggleSettings(){
  const p=document.getElementById('settings-panel');
  if(p)p.classList.toggle('on');
  if(p&&p.classList.contains('on')){
    setTimeout(()=>{
      const close=e=>{if(!p.contains(e.target)&&e.target.id!=='settings-btn'){p.classList.remove('on');document.removeEventListener('click',close);}};
      document.addEventListener('click',close);
    },50);
  }
}

let _favorToastTimer=null;
function showFavorToast(delta, isFace=false){
  showFavorChange(delta, null);
  SND.play('호감도');
  if(isFace){
    const log=document.getElementById('face-favor-log');
    if(log){
      const item=document.createElement('div');
      item.className='ffl-item '+(delta>0?'pos':'neg');
      const name=document.getElementById('fc-name')?.textContent||'???';
      item.innerHTML=`<span>${name}</span><span>${delta>0?'+':''}${delta}</span>`;
      log.appendChild(item);
      log.scrollTop=log.scrollHeight;
    }
  }
}

document.addEventListener('click',e=>{
  const btn=e.target.closest('button,.choice-btn,.face-choice,.rb,.tb,.cf,.bp,.ci');
  if(!btn)return;
  if(btn.classList.contains('choice-btn')||btn.classList.contains('face-choice')){
    SND.play('선택지');
  } else {
    SND.play('클릭');
  }
},{passive:true});

const OP_LINES=[
  '구청 행정직 공무원의 삶은 따분했다. 민원 처리, 행정 서류, 반복적인 업무.',
  '처음에는 안정적인 직장이라 생각했지만 시간이 지날수록 반복되는 민원과 업무에 지쳤다.',
  '결국 난 회의감에 직장을 그만두었다.',
  '퇴사 후 특별한 고민 없이 지내던 중 문 앞에 붙어있는 공고를 보게 됐다.',
  '행복 빌라 경비원 구함.  숙소 제공, 업무 간단.',
  '난 특별한 고민 없이 그 일을 하기로 결정했다.',
];
let opIdx=0;
let opDone=false;

function typeText(el, txt, cb, speed=32){
  if(!el)return;
  if(el._typingTimer){clearInterval(el._typingTimer);el._typingTimer=null;}
  el.textContent='';
  if(!txt){if(cb)cb();return;}
  let i=0;
  el._typingTimer=setInterval(()=>{
    el.textContent+=txt[i++];
    if(i>=txt.length){
      clearInterval(el._typingTimer);
      el._typingTimer=null;
      if(cb)cb();
    }
  }, speed);
}
function opTypeText(txt, cb){
  typeText(document.getElementById('op-text'), txt, cb, 18);
}

function opAdvance(){
  if(opDone)return;
  const el=document.getElementById('op-text');
  if(el&&el._typingTimer){
    clearInterval(el._typingTimer);
    el._typingTimer=null;
    el.textContent=OP_LINES[opIdx-1]||'';
    return;
  }
  if(opIdx<OP_LINES.length){
    opTypeText(OP_LINES[opIdx++], null);
  } else {
    opDone=true;
    const op=document.getElementById('opening');
    const adv=document.getElementById('op-advance');
    if(adv)adv.style.display='none';
    op.style.transition='opacity 1s ease';
    op.style.opacity='0';
    setTimeout(()=>{
      op.style.display='none';
      SND.load();
      setTimeout(()=>{
        const startSnd=SND._sfx['시작'];
        if(startSnd){const a=startSnd.cloneNode();a.volume=0.35;a.play().catch(()=>{});}
      }, 300);
      renderCL();
      renderBoard();
      updateHome();
      log('관리 시스템 온라인. 오늘의 일지를 시작하세요.');
      setTimeout(()=>triggerEventsForDay(1), 500);
    }, 1000);
  }
}

window.addEventListener('DOMContentLoaded', ()=>{
  const bg=document.getElementById('op-bg');
  setTimeout(()=>{
    if(bg)bg.classList.add('show');
  }, 600);
  setTimeout(()=>{
    opTypeText(OP_LINES[opIdx++], null);
  }, 1400);
  document.getElementById('opening').addEventListener('click', opAdvance);
});