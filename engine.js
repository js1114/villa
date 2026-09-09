// engine.js — 게임 엔진
// 이 파일은 직접 수정하지 말 것

// ══════════════════════════════════════════════════════════
//  ▣ 빌드 스위치 — 전시 나갈 때 이 한 줄만 true 로 바꾼다
// ══════════════════════════════════════════════════════════
//   false = 개발 빌드 : [루트 선택][다음날 →] 보임 · 무입력 자동리셋 없음 · 상단에 [DEV] 배지 표시
//   true  = 전시 빌드 : DEV 버튼 숨김 · 3분 무입력 시 자동리셋 · 배지 없음
//   ※ 전시 빌드에서도 Ctrl+Shift+D 를 누르면 DEV 버튼이 나온다 (심사·데모용)
const EXHIBIT_MODE = false;

function realNameFor(id){
  // FACE_SCRIPTS는 이벤트ID로 키가 잡혀있어(예: 'EVT_101_INIT') 입주민ID('101')로 직접
  // 조회되지 않는다 — 실명/실나이는 RES[id]에만 있으므로 거기서 가져온다.
  return RES[id]?.realName||RES[id]?.name;
}
function realAgeFor(id){
  return RES[id]?.realAge||RES[id]?.age;
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
    // 아직 얼굴을 모르는 상태 — "이미지 없음" 텍스트 대신 없는사람.png로 통일
    avImg.src='캐릭터/없는사람.png';
    avImg.style.display='block';
    avTxt.style.display='none';
  }
}

// ── 채팅 메시지 순차 큐 ──
const _chatQueues={};

function _getQueue(resId){
  if(!_chatQueues[resId]) _chatQueues[resId]={msgs:[],running:false,onDoneList:[]};
  return _chatQueues[resId];
}

// 채팅 메시지가 연달아 올 때 한 줄씩 나오는 간격. 너무 빠르다는 피드백으로 800→1400ms로 늘림.
const CHAT_MSG_INTERVAL=1400;

function pushMsgsSeq(resId, msgs, onDone, intervalMs=CHAT_MSG_INTERVAL){
  const q=_getQueue(resId);
  msgs.forEach((m,i)=>{
    q.msgs.push({m, cb: i===msgs.length-1 ? onDone : null});
  });
  if(!q.running) _runQueue(resId, intervalMs);
}

// ── 비속어 필터 ──
function _runQueue(resId, intervalMs=CHAT_MSG_INTERVAL){
  const q=_getQueue(resId);
  // 이 호실 메시지가 전부 나왔을 때만 대기 중인 선택지를 그린다.
  if(!q.msgs.length){q.running=false;_flushChatChoices(resId);return;}
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
  const _day=currentDay;
  setTimeout(()=>{
    // 날이 바뀌었으면 전날 채팅의 후속(선택지 표시 등)을 이어가지 않는다
    if(currentDay!==_day){ q.running=false; return; }
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
  const _day=currentDay;
  setTimeout(()=>{
    if(currentDay!==_day) return;
    if(cb) cb();
    _runQueue(resId);
  }, CHAT_MSG_INTERVAL);
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
  const avg=Math.round(avgFavor());   // 계산식은 avgFavor() 하나로 통일
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
  renderResList();
}
// 홈 화면 좌측 "주민 목록" — 이름/나이 공개 여부·호감도를 실시간 반영
// (기존엔 HTML에 ???/고정폭이 하드코딩돼 있어서 밝혀진 뒤에도 그대로 남는 버그가 있었음)
function renderResList(){
  const order=['301','202','201','102','101'];
  const btns=document.querySelectorAll('#reslist .rb');
  order.forEach((id,i)=>{
    const b=btns[i];
    const r=RES[id];
    if(!b||!r)return;
    const rm=b.querySelector('.rm');
    if(rm)rm.textContent=profileNameFor(id)+' / '+profileAgeFor(id);
    const rbf=b.querySelector('.rbf');
    if(rbf)rbf.style.width=r.favor+'%';
  });
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
  // 홈 버튼, 또는 같은 탭을 다시 누르면 홈으로 — 동일하게 처리
  if(t==='home'||activeTab===t){
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
  const _cbox=document.getElementById('chat-choices');
  if(_cbox) _cbox.innerHTML='';
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
  const avg=Math.round(avgFavor());   // 계산식은 avgFavor() 하나로 통일 (엔딩 판정과 동일 값 보장)
  document.getElementById('hap-fill').style.width=avg+'%';
  document.getElementById('hap-pct').textContent=avg+'%';
}

// ══ 단서 시스템 ══
// 단서 정의 — 이름/설명 한 곳에서만 관리한다.
const CLUE_DATA={
  CLUE_001:{name:'CCTV 이상',desc:'CCTV 타임스탬프가 멈춘 구간이 있음. 카메라 각도도 미세하게 달라짐.'},
  CLUE_002:{name:'고재엽 힌트',desc:'빌라 내부 구조가 이상함. 벽 두께가 균일하지 않음.'},
  CLUE_003:{name:'벽 기계 소리',desc:'2층 복도 벽에서 규칙적인 기계 소리(5초 간격). 옆 벽과 비교했을 때 비정상적으로 두꺼움.'},
  CLUE_004:{name:'케이블 발견',desc:'쓰레기장 벽 하단에서 케이블 발견. 당겼을 때 벽 내부로 이어짐. 팽팽함 — 살아 있는 배선.'},
};
// 단서 ID만 넘기면 알아서 등록. 스크립트(data.js)에서 쓰는 진입점.
function grantClue(clueId){
  const d=CLUE_DATA[clueId];
  if(!d)return;
  addClue(clueId,d.name,d.desc);
}

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
// 씬 진행으로(전시 루트 고정이 아니라) 엔딩에 도달했는지. true면 전시용 호감도 프리셋을 덮어쓰지 않는다.
let _endingFromScene = false;

const ENDING_ROUTE_PRESETS = {
  END_1: {
    favorAbsolute: {'101':55,'102':75,'201':70,'202':50,'301':55},
    flags: ['SIDE_NEUTRAL_D2','SIDE_NEUTRAL_D3','SIDE_NEUTRAL_D4','FINAL_SIDE_NEUTRAL',
            'CHAT_201_FOUND_DONE','CHAT_102_RESULT_DONE','MATSORYEON_MET',
            'NOTICED_201_SIGNAL_1','NOTICED_201_SIGNAL_2','SAVED_201',
            // 중재에 성공한 루트이므로 방치 판정이 붙으면 안 된다
            'EVT_D4_004_TALKED','LISTENED_WITH_301'],
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
    // 이 루트는 '301호를 놓친' 엔딩이다. 201호는 정상적으로 챙긴 상태여야
    // ABANDONED_201(=END_2_C)에 먼저 걸리지 않는다.
    flags: ['BOARD_SOLVED_BAD','NEGLECT_301','MATSORYEON_MET',
            'CHAT_201_FOUND_DONE','SAVED_201','EVT_D4_004_TALKED'],
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
  if(label){
    const names = {END_1:'E1', END_2_A:'E2A', END_2_B:'E2B', END_2_C:'E2C', END_3:'E3'};
    label.textContent = route ? (names[route]||route)+' [고정]' : '—';
  }
  document.querySelectorAll('.em-btn').forEach(b=>{
    b.classList.toggle('sel', b.dataset.route===route);
    b.disabled = true; // 루트 고정 후 버튼 전체 비활성화
    b.style.opacity = b.dataset.route===route ? '1' : '0.3';
  });
  log('DEV — 엔딩 루트 고정: '+(route||'자유 진행'));
}

// (Day별 진행 조건 없음 — day-btn은 언제든 다음날로 진행 가능)

// (checkDayComplete 제거됨 — day-btn은 조건 없이 항상 작동)

function toggleEndingMenu(){
  if(_devEndingRoute){
    log('DEV — 루트는 이미 '+_devEndingRoute+'로 고정됐습니다.');
    return;
  }
  const menu = document.getElementById('ending-menu');
  menu.classList.toggle('on');
  setTimeout(()=>{
    document.addEventListener('click', ()=>menu.classList.remove('on'), {once:true});
  }, 0);
}

function dayBtnClick(){
  // 조건 없이 항상 다음날로 진행 (DEV 루트가 고정된 경우엔 advanceDay가 프리셋을 적용)
  // DEV [다음날] 버튼으로 테스트할 땐 매번 그날의 아웃트로 나레이션(한 줄당 2초)까지
  // 다 보고 있으면 진행이 너무 느려지므로, 버튼으로 넘길 때만 나레이션을 생략한다.
  // (자동 진행 — checkDayAutoAdvance — 은 실제 플레이 경험이므로 그대로 나레이션을 보여준다.)
  advanceDay(true);
}

function advanceDay(skipNarration=false){
  if(_devEndingRoute && !_endingFromScene){
    const preset = ENDING_ROUTE_PRESETS[_devEndingRoute];
    if(preset){
      if(preset.favorAbsolute){
        Object.entries(preset.favorAbsolute).forEach(([id,val])=>{
          if(RES[id]) RES[id].favor = val;
        });
      }
      (preset.flags||[]).forEach(f=>{ setFlag(f); DONE_EVENTS.add(f); });
      _neglectCount = Math.max(_neglectCount, preset.neglectCount||0);
      const clueData = CLUE_DATA;
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

    // 전날 채팅을 먼저 정리해야 구분선이 올바른 위치에 들어간다.
    _settleChatFlowForDayEnd();

    Object.keys(chatH).forEach(id=>{
      if(chatH[id].length>0) chatH[id].push({f:'day-divider',day:currentDay});
    });

    renderCL();
    log('DAY '+currentDay+' 시작.');
    if(typeof ANT!=='undefined'&&ANT.resetDay)ANT.resetDay();

    // 1. 전날 이벤트를 먼저 정리하여 방치(Neglect) 플래그를 확정합니다.
    _autoCompleteDayEvents(currentDay-1);
    _snapChatBase();   // 새 하루 기준선
    Object.keys(_doorVisitedToday).forEach(k=>delete _doorVisitedToday[k]);   // 새 하루 방문 기록 초기화

    if(currentDay===6){
      const dayBtn=document.getElementById('day-btn');
      const goBtn=document.getElementById('day-go-btn');
      if(dayBtn) dayBtn.style.display='none';
      if(goBtn){
        goBtn.textContent='[ 일과 종료 (엔딩 진행) ]';
        goBtn.onclick=()=>{ goBtn.onclick=null; startEnding(); };
      }
    }

    setTimeout(()=>{
      triggerEventsForDay(currentDay);
    }, 800);
  }, skipNarration);
}

const _DC = {
  1:{
    '101':[
      {f:'r',t:'관리 좀 똑바로 하세요'},
      {f:'r',t:'제 옆집 시끄럽다니까요 사람 잠을 못 자게;'},
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
      {f:'s',t:'지금은 봉투가 터져있다거나 하는 특이한 사항은 없네요 계속 체크해 볼게요'},
      {f:'r',t:'네 감사해요'},
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
      {f:'r',t:'경비형'},{f:'r',t:'갔다왔어요 노래방'},{f:'r',t:'용돈 ㄱㅅ'},
      {f:'s',t:'네'},{f:'r',t:'ㅎㅎ 형 좋은 사람이네'},{f:'r',t:'오디션 응원해줘요'},
      {f:'s',t:'응원합니다'},{f:'r',t:'진심 담아서'},
      {f:'s',t:'진심으로 응원합니다'},{f:'r',t:'성의 존나없네'},
    ],
  },
  2:{
    // 노션 Day2 EVT_D2_004 민원 정본
    '101':[
      {f:'r',t:'저기요'},{f:'r',t:'복도에 담배꽁초가 또 있어요'},
      {f:'r',t:'제 거 아니에요 옆집이요'},{f:'r',t:'맨날 거기서 피고 버리던데'},
      {f:'r',t:'한두 번도 아니고 진짜'},{f:'r',t:'아니 밖에서 피우면 되잖아요'},
      {f:'r',t:'흡연실 있잖아요 저기 뒤에'},
      {f:'s',t:'확인하겠습니다.'},
      {f:'r',t:'네'},{f:'r',t:'근데 저번에도 확인한다고 하셨는데'},
      {f:'r',t:'...아니 뭐라는 건 아니고요'},{f:'r',t:'그냥요'},
    ],
    '102':[
      {f:'r',t:'형'},{f:'r',t:'근데 3층에 씨씨티비 없어요?'},
      {f:'r',t:'저 3층 무서워서 확인하려고 봤는데 없던데'},
      {f:'s',t:'없어요. 예산이 부족해서요.'},
      {f:'r',t:'ㅋㅋㅋㅋㅋㅋ'},{f:'r',t:'레전드네 진짜'},
      {f:'r',t:'그럼 3층에 뭔 일 나도 모르겠네'},{f:'r',t:'하씨발'},
    ],
    // 노션 Day2 EVT_D2_001 분기 B — 선형이가 혼자 찾음 (목줄 떡밥 포함)
    '201_found':[
      {f:'r',t:'경비원님'},{f:'r',t:'뽀삐 찾았어요'},
      {f:'r',t:'쓰레기장 구석에 있었어요'},{f:'r',t:'제가 늦게 나가서'},
      {f:'r',t:'근데 있었어요'},
      {f:'s',t:'다행이에요.'},
      {f:'r',t:'...'},{f:'r',t:'네 감사해요'},
      {f:'r',t:'근데 목줄이 없어졌어요'},{f:'r',t:'뭐 그건 나중에 사면 되고'},
    ],
    // 분기 A — 경비가 직접 찾아서 인계
    '201_handover':[
      {f:'s',t:'뽀삐 찾았어요. 쓰레기장에 있었어요.'},
      {f:'r',t:'아'},{f:'r',t:'진짜요'},{f:'r',t:'.....'},{f:'r',t:'감사해요'},
      {f:'s',t:'데리러 오실래요?'},
      {f:'r',t:'아'},{f:'r',t:'지금요?'},{f:'r',t:'...'},{f:'r',t:'네'},
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
    // 공통 — 오디션 1차 합격 (모든 루트)
    '102_audition':[
      {f:'r',t:'형형형형'},
      {f:'r',t:'저 붙었어요'},
      {f:'r',t:'1차요 1차'},
      {f:'r',t:'아 미쳤다 진짜'},
      {f:'s',t:'축하해요.'},
      {f:'r',t:'ㅎㅎ 감사해요'},
      {f:'r',t:'형한테 젤 먼저 알리는 거예요 사실'},
    ],
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
  2:[{id:3,author:'???',tag:'',title:'오늘 쓰레기장 가셨더라고요',
      preview:'저도 도와드릴 수 있는데.',
      body:'쓰레기장에 꽤 오래 계시던데요\n뭘 찾고 계신 건가요\n다음엔 제가 도와드릴 수 있는데\n저도 거기 자주 가거든요',day:2,pin:false}],
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
  1:[{id:1,room:'101호',subj:'옆집 소음',body:'새벽에 시끄럽습니다.',time:'Day1',u:false}],
  2:[{id:3,room:'101호',subj:'복도 담배꽁초',body:'복도에 담배꽁초가 또 있어요\n제 거 아니에요 옆집이요',time:'Day2 오전',u:false},
     {id:4,room:'201호',subj:'민원인데요',body:'밤에 벽에서 소리가 나요\n긁는 소리요',time:'Day2 밤',u:false}],
  // ★ id 는 DAY_SEQUENCE 의 실제 민원 id 와 반드시 같아야 한다.
  //   (CLIST 는 id 로 중복을 거른다 — 어긋나면 같은 민원이 두 번 쌓이거나 다른 날 민원을 덮어쓴다)
  3:[{id:5,room:'101호',subj:'이거 범죄 아니에요?',body:'쓰레기장에 제 사진이 있었어요\n누가 찍은 거예요',time:'Day3 오전',u:false},
     {id:12,room:'102호',subj:'벽 소리 (2차)',body:'형 벽에서 소리 나요',time:'Day3 야간',u:false}],
  4:[{id:11,room:'101호',subj:'복도에서 시비',body:'복도에서 시비가 붙었어요',time:'Day4 오전',u:false}],
  5:[{id:7,room:'201호',subj:'벽 소리 (3차)',body:'밤에 벽에서 소리가 나요.',time:'Day5',u:false},
     {id:8,room:'102호',subj:'벽 소리 (3차)',body:'저도요. 이상해요.',time:'Day5',u:false},
     {id:9,room:'101호',subj:'벽 소리 (3차)',body:'저도 들려요.',time:'Day5',u:false}],
};

const _DAY_FLAGS = {
  // ※ 2026-09-06 추가 — _isDayComplete(1)이 요구하는 문 방문 완료 플래그들이
  //   여기 없어서, DEV [다음날] 버튼으로 Day1을 건너뛰면 그 플래그들이 영영 안 서는데
  //   _DAY_STATE[1]은 202/101/301의 RES_EVENT_STATE를 null로 밀어버린다.
  //   결과: 202호 첫 대면(EVT_202_MET)이 사라지고, requireFlag:'EVT_202_MET'인
  //   CHAT_202_FIRST부터 고재엽 라인 전체(END_3 관문)가 통째로 죽었다.
  //   Day2의 EVT_301_SEEN처럼 스킵해도 서게 백필한다.
  1:['EVT_001_DONE','EVT_001_B_DONE','EVT_002_INTRO_DONE','CHAT_201_SEARCH_PROMISED',
     'EVT_101_INTRO_DONE','EVT_001_INTRO_DONE','EVT_201_FOLLOWUP_DONE',
     'EVT_202_MET','EVT_301_GLIMPSE_DONE','EVT_201_MET',
     'CHAT_102_FIRST_DONE','CHAT_102_CHEER1','CHAT_102_CHEER_DONE','CHAT_101_REPLIED','CHAT_101_DONE',
     'MSGS_SHOWN_EVT_002_CHAT','MSGS_SHOWN_CHAT_201_CHOICE','MSGS_SHOWN_CHAT_102_FIRST',
     'MSGS_SHOWN_CHAT_102_CHEER','CCTV_쓰레기장_CHECKED','CHAT_201_AFTER_CCTV',
     'HINT_101_102'],   // Day3 밴드 노출의 선행조건 — 스킵해도 서게 한다
  2:['CHAT_102_CCTV_DONE','CHAT_D2_101_REPLIED','CHAT_301_BOARD_DONE','WALL_SOUND_COUNT_1','D2_WALL_REPLIED',
     'CHAT_201_FOUND_TRIGGER','CHAT_201_FOUND_DONE','MATSORYEON_SEEN_1','EVT_301_SEEN',
     'MSGS_SHOWN_CHAT_201_FOUND','MSGS_SHOWN_CHAT_102_CCTV','MSGS_SHOWN_CHAT_D2_002_A',
     'MSGS_SHOWN_CHAT_D2_001_HANDOVER',
     'EVT_D2_001_DONE','EVT_D2_001_A_DONE','D2_POPPY_FOUND','D2_201_DOOR',
     'EVT_D2_002_DONE','D2_102_TALK1','D2_102_NERVOUS','AUDITION_D3',
     'EVT_D2_003_DONE','HINT_202_WALL','EVT_D2_004_DONE','SIDE_NEUTRAL_D2',
     'EVT_D2_005_DONE','EVT_D2_TIKI_001_DONE','HINT_101_102_D2',
     'EVT_D2_TIKI_002_DONE','EVT_D2_TIKI_003_DONE','D2_SAW_BAG',
     'EVT_D2_006_DONE','BOARD_COUNT_2','EVT_D2_007_DONE','POLITICS_D2'],
  3:['CHAT_D3_101_REPLIED','HINT_101_102','MATSORYEON_MET','AUDITION_RESULT_PENDING',
     'EVT_D3_001_DONE','EVT_D3_002_DONE','EVT_D3_003_DONE','EVT_D3_004_DONE','EVT_D3_005_DONE',
     'EVT_D3_006_DONE','EVT_D3_007_DONE','EVT_D3_008_DONE','EVT_D3_010_DONE',
     'EVT_D3_TIKI_001_DONE','EVT_D3_TIKI_002_DONE',
     'BAND_REVEALED','POLITICS_D3','BOARD_COUNT_3','WALL_SOUND_COUNT_2','HINT_301_BAG','D2_SAW_BAG',
     'MSGS_SHOWN_CHAT_D3_004_102','MSGS_SHOWN_CHAT_D3_004_201','MSGS_SHOWN_CHAT_D3_010_AUDITION',
     'MSGS_SHOWN_CHAT_D3_006_BAND','MSGS_SHOWN_CHAT_D3_009_SIGNAL1',
     // 2026-09-06 추가 — 선형이 신호 1차 탭이 안 답해진 채로 날이 넘어가면(위 MSGS_SHOWN
     // 백필로 스텝 자체는 닫히지만) IGNORED_201_SIGNAL_1이 안 서서 Day4 신호 2차
     // (CHAT_D4_008_SIGNAL2, requireFlag:'IGNORED_201_SIGNAL_1')가 통째로 안 열렸다.
     // "무슨 일 있어요?"라고 안 물어본 채 넘어간 것 = 무시한 것과 같은 의미라 IGNORED로 백필.
     'IGNORED_201_SIGNAL_1'],
  4:['EVT_D4_000_DONE','EVT_D4_001_DONE','EVT_D4_002_DONE','EVT_D4_003_DONE','EVT_D4_003_TALKED',
     'EVT_D4_004_DONE','EVT_D4_004_TALKED','EVT_D4_005_DONE','EVT_D4_006_DONE','EVT_D4_007_DONE',
     'EVT_D4_TIKI_001_DONE','EVT_D4_TIKI_002_DONE',
     // 2026-09-06 추가 — 같은 이유로 신호 2차 탭 미응답 시 IGNORED_201_SIGNAL_2 백필.
     // 이게 있어야 Day5 CHAT_201_SIGNAL3(신호 3차)가 정상적으로 열린다.
     'IGNORED_201_SIGNAL_2',
     'BAND_TRUTH_PARTIAL','BOARD_MYSTERY_CLOSED','LEASH_RECOVERED_MENTIONED',
     'BOARD_SOLVED_GOOD','CONFRONTED_202','EVT_D3_003_A',
     'MSGS_SHOWN_CHAT_D4_000_WAIT','MSGS_SHOWN_CHAT_D4_000_WAIT2','MSGS_SHOWN_CHAT_D4_003',
     'MSGS_SHOWN_CHAT_D4_007_LEASH','MSGS_SHOWN_CHAT_D4_008_SIGNAL2'],
  5:['EVT_D5_001_DONE','EVT_D5_001_COMPLAINT_201','EVT_D5_001_COMPLAINT_102','EVT_D5_001_COMPLAINT_101',
     'EVT_D5_004_DONE','EVT_D5_007_DONE','EVT_D5_008_DONE','WALL_SOUND_COUNT_3',
     'BOARD_MYSTERY_FINAL','EVT_D5_BOARD','AUDITION_ROUND1_PASSED',
     'MSGS_SHOWN_CHAT_D5_202_WARNING','MSGS_SHOWN_CHAT_201_SIGNAL3',
     'MSGS_SHOWN_CHAT_D5_102_AUDITION'],
  6:['EVT_D6_001_DONE','EVT_D6_002_DONE',
     'MSGS_SHOWN_CHAT_D6_102_AUDITION_FINAL','MSGS_SHOWN_CHAT_D6_201_MORNING'],
};

const _DAY_MET = {
  1:['101','102','202'],  
  2:['201','301','202'],
  3:['202','301'],
  4:['101','102','202'],
  5:['201','202'],
  6:['202'],
};

// ── 다음날버튼 축약기록 중복 방지 ──
// _DC는 "그날 대화를 못 본 사람"에게 기록을 채워주는 용도다.
// 이미 그 호실과 대화한 플레이어에게까지 밀어넣으면 같은 대사가 두 번 쌓인다.
// 그래서 '하루 시작 시점의 대화 길이'를 기억해두고, 늘어난 호실은 건너뛴다.
const _chatBaseAtDayStart = {};
function _chatCount(id){ return (chatH[id]||[]).filter(m=>m.f!=='day-divider').length; }
function _snapChatBase(){ Object.keys(chatH).forEach(id=>{ _chatBaseAtDayStart[id]=_chatCount(id); }); }
function _playedToday(id){ return _chatCount(id) > (_chatBaseAtDayStart[id]||0); }
function _pushDC(id, arr){
  if(!arr||!arr.length) return;
  if(_playedToday(id)) return;      // 이미 직접 대화함 → 축약본 넣지 않는다
  if(chatH[id]) chatH[id].push(...arr);
}

const _DAY_STATE = {
  1:{'101':null,'102':null,'201':'EVT_201_INIT','202':null,'301':null},
  2:{'101':null,'102':null,'201':null,'202':'EVT_202_DONE','301':'EVT_D2_005'},
  3:{'101':null,'102':null,'202':'EVT_202_DONE','301':'EVT_301_DONE'},
  4:{'101':null,'102':null,'202':'EVT_202_DONE'},
  5:{'201':null,'202':'EVT_202_DONE','301':'EVT_301_DONE'},
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
  
  // 2. 필수 이벤트 방치 판정.
  //    ★ 전제 — 그날 이벤트가 실제로 코드에 구현돼 있을 때만 방치로 친다.
  //    구현이 안 된 Day를 "방치했다"고 깎으면, 성실하게 플레이해도 호감도가 바닥나고
  //    엔딩이 배드로 고정된다. (Day4는 현재 DAY_SEQUENCE에 항목이 없다 = 콘텐츠 미이관 상태)
  const _dayImplemented = !!(typeof DAY_SEQUENCE!=='undefined' && DAY_SEQUENCE[day] && DAY_SEQUENCE[day].length);

  // 뽀삐 라인 자체가 시작되지도 않은 플레이어(Day1에 201호 채팅을 못 본 경우)는
  // 방치가 아니라 미도달이다. 시작한 사람만 방치로 친다.
  const _poppyLineStarted = getFlag('EVT_002_CCTV')||getFlag('EVT_002_SEARCH');
  if(_dayImplemented && day === 2 && _poppyLineStarted && !DONE_EVENTS.has('CHAT_201_FOUND_DONE')){
    // 노션 §09 기준: ABANDONED_201(=END_2_C 확정)은 Day5의 "(넘어간다)" 선택으로만 붙는다.
    // Day2 뽀삐 방치는 그 루트로 가는 누적 요소일 뿐이라 엔딩을 여기서 확정하지 않는다.
    setFlag('NEGLECT_201_D2');
    _neglectCount += 1;
    if(RES['201']) RES['201'].favor = Math.max(0, RES['201'].favor - 20);
  }
  if(_dayImplemented && day === 4 && !DONE_EVENTS.has('EVT_D4_004_TALKED')){
    setFlag('EVT_D4_006_NEGLECT'); // 101/102호 밴드 갈등 무시
    if(RES['101']) RES['101'].favor = Math.max(0, RES['101'].favor - 40);
    if(RES['102']) RES['102'].favor = Math.max(0, RES['102'].favor - 40);
  }
  // 매소련 벽 씬을 실제로 마주쳤는데 그냥 지나친 경우에만 방치로 친다.
  // (씬을 만나지도 못한 플레이어를 방치로 처벌하지 않는다)
  // 노션 END_2_B 조건은 "C_301 기복 최저점 + 방치"— 누적 방치지 한 번 안 들어준 게 아니다.
  // 예전엔 Day5 벽 씬에서 '(귀를 댄다)'를 안 고른 것 하나로 NEGLECT_301 + 호감도 -40 이
  // 걸렸고, END_2_B 판정이 '301 호감도 20 이하'라 다른 걸 아무리 잘해도 배드가 확정됐다.
  // → 매소련을 계속 밀어낸 경우(첫 대면도, 게시판 자백도 안 받은 경우)에만 방치로 친다.
  if(_dayImplemented && day === 5 && DONE_EVENTS.has('EVT_D5_007_DONE')
     && !DONE_EVENTS.has('LISTENED_WITH_301')){
    // 호감도만 깎는다. NEGLECT_301(=END_2_B 트리거)은 붙이지 않는다.
    // END_2_B 는 노션 기준 "D4 자백 냉담" 엔딩이라, 게시판 자백에 냉담했을 때
    // (BOARD_SOLVED_BAD) 붙는 게 맞다. 벽 씬 한 번 놓친 것으로 배드가 확정되면 안 된다.
    if(RES['301']) RES['301'].favor = Math.max(0, RES['301'].favor - 15);
  }
  // -------------------------------------------------------------

  if(day===1){
    _pushDC('101', dc['101']);
    if(!route||route==='END_1'||route==='END_3'){
      _pushDC('102', dc['102_b']);
    }
    if(route==='END_2_C'){
      _pushDC('201', dc['201_2c']);
    } else {
      _pushDC('201', dc['201_cctv']);
    }
  } else if(day===2){
    _pushDC('101', dc['101']);
    _pushDC('102', dc['102']);
    if(route!=='END_2_C'){
      // Day1에 '같이 찾아봅시다'를 골랐으면 분기 B(선형이가 혼자 찾음),
      // 아니면 분기 A(경비가 직접 찾아 인계).
      _pushDC('201', getFlag('EVT_002_SEARCH') ? dc['201_found'] : dc['201_handover']);
    }
  } else if(day===5){
    // 공통 — 벽소리 민원 채팅
    _pushDC('201', dc['201_wall']);
    _pushDC('102', dc['102_wall']);
    // 공통 — 오디션 1차 합격 (Day6 최종 합격 통보의 선행)
    _pushDC('102', dc['102_audition']);
    if(route==='END_3'){
      // E3 — 고재엽 경고 수락 + 선형이 방문
      _pushDC('202', dc['202_e3']);
      _pushDC('201', dc['201_e3']);
      // E3 전용 플래그
      ['AGREED_WITH_202','SAVED_201','LISTENED_WITH_301',
       'EVT_D5_002_DONE','EVT_D5_003_DONE','EVT_D5_005_DONE'].forEach(f=>{setFlag(f);DONE_EVENTS.add(f);});
    } else if(route==='END_2_A'){
      // E2A — 101↔102 결판
      _pushDC('101', dc['101_e2a']);
      _pushDC('102', dc['102_e2a']);
      // E2A 전용 플래그 (고재엽 관련 플래그는 절대 세팅 안 함)
      ['FINAL_SIDE_101','EVT_D5_004_DONE'].forEach(f=>{setFlag(f);DONE_EVENTS.add(f);});
    }
  } else if(day===6){
    const clues = CLUES_COLLECTED.length;
    const qualifiesForEnd3 = route === 'END_3' || clues >= 3 || (clues >= 2 && RES['202'].favor >= 70);
    if(qualifiesForEnd3){ _pushDC('202', dc['202']); }
    if(route === 'END_2_A'){
      _pushDC('101', dc['101_e2a']);
      _pushDC('102', dc['102_e2a']);
    }
  } else {
    // Day3·4 등 나머지 날. 여기도 이미 대화한 호실은 건너뛴다.
    Object.entries(dc).forEach(([resId, msgs])=>{
      _pushDC(resId, msgs);
    });
  }

  const complaints = _DAY_COMPLAINTS[day]||[];
  complaints.forEach(c=>{
    // 개발자용 "다음날" 스킵 — 이미 지난 일로 취급해 민원함/채팅 둘 다 곧바로 열람된 상태로 만든다.
    if(!CLIST.find(x=>x.id===c.id)) CLIST.push({...c, u:false, delivered:true});
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
    const clueData=CLUE_DATA;
    // CLUE_001(CCTV 이상)은 Day4 획득으로 통일 — 노션 CLUES 표 기준
    const cluesByDay={4:['CLUE_001','CLUE_002'],5:['CLUE_003','CLUE_004']};
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
    // 조건부 상태 전환(개미 씬 등)은 조건을 만족할 때만 적용한다.
    const condOk = (!evt.requireFlag||getFlag(evt.requireFlag))
                && (!evt.requireNotFlag||!getFlag(evt.requireNotFlag));
    if(evt.type==='state_change' && condOk){
      (evt.changes||[]).forEach(c=>{
        if(c.resId) RES_EVENT_STATE[c.resId]=c.newState;
      });
    }
    DONE_EVENTS.add(evt.id);
  });

  Object.keys(pendingChatChoice).forEach(k=>delete pendingChatChoice[k]);

  // DEV 루트를 고정했으면 프리셋 호감도가 최종값이다. (노션 '호감도 절대값 세팅' 규칙)
  // 방치 페널티가 뒤에 적용되면 전시용 수치가 설계와 어긋나므로 여기서 다시 덮어쓴다.
  // (예: END_1 루트인데 301호가 55 → 15로 떨어져 평균이 END_1 기준 아래로 내려가던 문제)
  // 전시용 호감도 고정값은 '루트 버튼으로 고정한 경우'에만 적용한다.
  // 자유 플레이로 END_3 씬을 끝까지 본 플레이어의 실제 수치를 덮어쓰면 안 된다.
  if(route && !_endingFromScene){
    const _preset = ENDING_ROUTE_PRESETS[route];
    if(_preset && _preset.favorAbsolute){
      Object.entries(_preset.favorAbsolute).forEach(([id,val])=>{
        if(RES[id]) RES[id].favor = val;
      });
    }
  }

  renderCL();
  updateHappiness();
  updateHome();
  if(curR) renderChat(curR);

  log('DEV — Day '+day+' 완료 ('+(route||'자유')+'루트)');
}

// ════════════════════════════════════════
// 엔딩 시스템
// ════════════════════════════════════════

// ══════════════════════════════════════════════════════════
// 화면 상태표 — 재방문 씬 선택 (data.js의 REVISIT / LOC_REVISIT)
// 이벤트가 없을 때 "(반응이 없다)"만 반복되지 않게, Day별·회차별로 다른 씬을 돌린다.
// ══════════════════════════════════════════════════════════
const VISIT_COUNT = {};   // 키: '101_2' (호실_Day) → 그 Day에 그 호실을 몇 번 눌렀나

// day 이하에서 가장 가까운 정의를 찾는다. (Day5가 비어 있으면 Day4 → Day3 … 순)
function _revisitTable(tbl, key, day){
  const byDay = tbl && tbl[key];
  if(!byDay) return null;
  for(let d=day; d>=1; d--){ if(byDay[d]) return byDay[d]; }
  return null;
}

function pickRevisit(resId){
  if(typeof REVISIT==='undefined') return null;
  const tiers=_revisitTable(REVISIT, resId, currentDay);
  if(!tiers||!tiers.length) return null;

  const k=resId+'_'+currentDay;
  VISIT_COUNT[k]=(VISIT_COUNT[k]||0)+1;
  const tier=tiers[Math.min(VISIT_COUNT[k]-1, tiers.length-1)];   // 마지막 칸이 3회차 이상을 다 받는다

  return {
    room: (RES[resId]?RES[resId].room:resId+'호'),
    loc:  resId+'호 앞',
    bg:   '배경/'+resId+'문닫힘.png',
    onEnd: null,
    lines: tier.slice(),
    choices:['(돌아간다)'],
    choiceResults:[{favor:0,flags:[],lines:[]}],
  };
}

// 장소(쓰레기장·흡연실·복도)도 같은 방식으로. LOC_SCRIPTS의 lines를 Day별로 갈아끼운다.
const LOC_VISIT_COUNT = {};
function pickLocLines(locName){
  if(typeof LOC_REVISIT==='undefined') return null;
  const tiers=_revisitTable(LOC_REVISIT, locName, currentDay);
  if(!tiers||!tiers.length) return null;
  const k=locName+'_'+currentDay;
  LOC_VISIT_COUNT[k]=(LOC_VISIT_COUNT[k]||0)+1;
  return tiers[Math.min(LOC_VISIT_COUNT[k]-1, tiers.length-1)].slice();
}

function calcEnding(){
  const route=_devEndingRoute;
  if(route) return route;

  // 판정 순서: 위에서부터, 걸리면 끝.
  // 엔딩마다 "결정적 순간" 하나 + 수치 하나로만 판정한다. (설계도 v2 / 6절)

  // 1. 배드 엔딩 — 주민이 파국에 치달은 경우 최우선.
  //    사람을 죽게 두고 진실만 알아낸 플레이는 진엔딩을 받지 않는다.
  if(getFlag('ABANDONED_201')) return 'END_2_C';                                   // D5 삭제된 메시지 방치
  if((RES['101'].favor<=20||RES['102'].favor<=20)
     &&(getFlag('FINAL_SIDE_101')||getFlag('FINAL_SIDE_102')||getFlag('EVT_D4_006_NEGLECT'))) return 'END_2_A'; // D5 결판에서 편들기
  // D4 자백 냉담. 임계 20 → 10:
  //  · 301호는 시작값이 20이라, 예전 기준으론 "아무것도 안 해도" 절반이 충족됐다.
  //  · _neglectCount 는 확인 안 한 민원 수로 매일 자동 누적돼서 6일이면 누구나 2를 넘는다.
  //    "의도적으로 방치했다"를 나타내지 못하므로 판정에서 뺀다.
  //  → 매소련을 명시적으로 밀어낸 선택(BOARD_SOLVED_BAD / NEGLECT_301)만 남긴다.
  if(RES['301'].favor<=10&&(getFlag('BOARD_SOLVED_BAD')||getFlag('NEGLECT_301'))) return 'END_2_B';

  // 2. 진실 엔딩 — 단서 + Day6에 고재엽에게 되물어야 열림.
  const clues=CLUES_COLLECTED.length;
  if(clues>=2 && (clues>=3 || RES['202'].favor>=70)){
    if(getFlag('D6_202_HINT_RECEIVED')) return 'END_3';
  }

  // 3. 평화 엔딩 — 조건부. 무난히 잘하고 아무것도 파헤치지 않은 경우에만.
  //    기준 40 — 실제 데이터 기준. 단서 2개 이하로 플레이할 때 얻을 수 있는
  //    호감도 평균의 이론상 상한이 52.2다. 기존 55(노션 표는 80)는 어떤 플레이로도
  //    넘을 수 없어 END_1 이 사실상 존재하지 않는 엔딩이었다.
  //    자동 시뮬(성실 플레이)이 37 → 40이면 "좀 더 신경 쓴 플레이"가 받는 자리가 된다.
  if(avgFavor()>=40 && clues<=2) return 'END_1';

  // 4. 기본값 — 이상하다는 건 알았는데 증명하지 못한 경우.
  return 'END_GRAY';
}

// 행복도(전체 호감도 평균). 엔딩 판정 및 UI에서 공용.
function avgFavor(){
  const ids=Object.keys(RES);
  if(!ids.length) return 0;
  return ids.reduce((s,k)=>s+RES[k].favor,0)/ids.length;
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
    title:'END_1',main:'빌라는 유지됩니다',
    credit:'행복빌라 관리 시스템\n오늘의 일지: 이상 없음.\n내일도 계속됩니다.',
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
    title:'END_2_B',main:'아무도 몰랐던 것',
    credit:'행복빌라 관리 시스템\n오늘의 일지: 결번.\n내일도 계속됩니다.',
    lines:[
      '(3층. 봉투 끄는 소리가 안 난다.),,',
      '(노크했다. 아무 소리가 없다.),,',
      '(문이 잠겨 있지 않았다.),,',
      '(봉투들이 가득하다. 매소련의 수집품들이다.),,',
      '(그중 하나에 가죽 끈이 삐져나와 있다.),,',
      '(뽀삐 목줄이다.),,',
      '(누구에게도 물어볼 수 없게 됐다.),,',
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
  END_GRAY:{
    title:'END_GRAY',main:'이상 없음',credit:'',
    lines:[
      '(저녁이다. 순찰을 돌았다.),,',
      '(1층 복도. 101호 앞에 담배꽁초 하나. 치웠다.),,',
      '(2층. 조용하다.),,',
      '(2층 복도 끝에서 잠깐 멈췄다.),,',
      '(벽에 손을 대봤다.),,',
      '(아무것도 없다.),,',
      '(3층. 봉투 끄는 소리가 난다. 항상 이 시간이다.),,',
      '(경비실로 돌아왔다.),,',
      '(관리일지를 펼쳤다.),,',
      '("이상 없음."까지 쓰고 멈췄다.),,',
      '(뭔가 이상하다는 건 안다.),,',
      '(근데 뭐가 이상한지를 못 쓰겠다.),,',
      '(한참 있다가 마침표를 찍었다.),,',
      '(일지를 닫았다.),,',
    ],
  },
};

function _runEndingScene(route){
  const data=_ENDING_DATA[route]||_ENDING_DATA['END_GRAY'];
  
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
        
        // 검은 화면으로 페이드 전환 후 엔딩 크레딧 표시
        const fd = document.getElementById('fade');
        fd.classList.add('in');
        setTimeout(()=>{
          // face-screen / loc-screen 닫고 검은 크레딧 오버레이 표시
          document.getElementById('face-screen').classList.remove('on');
          if(document.getElementById('loc-screen')) document.getElementById('loc-screen').classList.remove('on');

          // 기존 크레딧 오버레이 있으면 제거
          const old = document.getElementById('ending-credit-overlay');
          if(old) old.remove();

          const overlay = document.createElement('div');
          overlay.id = 'ending-credit-overlay';
          overlay.style.cssText = `
            position:fixed;inset:0;background:#000;z-index:9500;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            font-family:'Courier New',Courier,monospace;
            opacity:0;transition:opacity 1.2s ease;
          `;

          const imgName = data.title.toLowerCase().replace(/_/g,'-');

          overlay.innerHTML = `
            <div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:18px;transform:translateY(-24px);">
              <div style="font-size:10px;color:#444;letter-spacing:4px;">${data.title}</div>
              <div style="font-size:22px;color:#fff;font-weight:bold;letter-spacing:3px;">${data.main}</div>
              <img src="엔딩/${imgName}.png"
                onerror="this.style.display='none'"
                style="max-width:260px;max-height:180px;object-fit:contain;opacity:.85;border:1px solid #222;">
              ${data.credit && !data.noCredit ? `<div style="font-size:10px;color:#444;line-height:2.2;margin-top:4px;">${data.credit.replace(/\n/g,'<br>')}</div>` : ''}
            </div>
            <button onclick="exhReset()"
              style="position:fixed;right:28px;bottom:28px;
                font-family:'Courier New',Courier,monospace;
                font-size:11px;font-weight:bold;
                background:#000;color:#555;
                border:1px solid #333;
                padding:7px 18px;cursor:pointer;letter-spacing:2px;
                transition:color .15s,border-color .15s;"
              onmouseover="this.style.color='#fff';this.style.borderColor='#fff';"
              onmouseout="this.style.color='#555';this.style.borderColor='#333';">
              ↺ 처음으로
            </button>
          `;

          document.body.appendChild(overlay);
          fd.classList.remove('in');
          requestAnimationFrame(()=>{ overlay.style.opacity='1'; });
        }, 600);

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

      // 자동 진행(,,) 줄은 타이핑이 끝난 뒤에 정지시간을 두고 넘어간다.
      // (타이핑 시작과 동시에 타이머를 걸면 긴 대사일수록 다 읽을 시간이 없이 넘어가버림)
      typeText(textEl, speech, auto ? () => { endingAutoTimer = setTimeout(next, 1600); } : null, 22);
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

          // 오토 대사일 경우 즉시 스킵 후, 대기시간 적용 (대면 화면과 동일하게 1600ms)
          if(raw.endsWith(',,')) {
             clearTimeout(endingAutoTimer);
             endingAutoTimer = setTimeout(next, 1600);
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
  } else if(route === 'END_GRAY') {
    playCustomUI('loc', data, '배경/2F복도.png', '2층 복도');
  }
}

// 하루가 끝나고 다음날로 넘어가는 연출.
// DAY_OUTRO[끝나는 날]이 있으면, "DAY N" 카드가 뜨기 전에 그날을 닫는 짧은 나레이션을
// 한 줄씩(,,와 같은 2초 자동 진행) 먼저 보여준다 — 그냥 카드 한 장 넘기는 느낌이 아니라
// 그날 하루가 실제로 저물었다는 감각을 주기 위함.
function showDayTransition(nextDay, cb, skipNarration=false){
  const overlay = document.getElementById('day-transition');
  const txt = document.getElementById('day-transition-text');
  if(!overlay||!txt){if(cb)cb();return;}
  const endingDay = nextDay-1;
  // ※ 2026-09-06 — 아웃트로 줄에 루트 조건을 걸 수 있게 했다.
  //   예전엔 Day2 아웃트로가 "뽀삐를 찾아준 것"이라고 무조건 단정했는데, 뽀삐를
  //   선형이가 혼자 찾은 루트(EVT_D2_001_B_WAIT_DONE)에서는 경비가 찾아준 적이 없다.
  //   Day5의 "염지혜와의 결판"도 결판을 안 본 플레이어에게 그대로 떴다.
  //   문자열은 그대로 쓰고, 조건이 필요한 줄만 {t, ifFlag} / {t, ifNotFlag} 로 적는다.
  const _outroRaw = (typeof DAY_OUTRO!=='undefined' && DAY_OUTRO[endingDay]) ? DAY_OUTRO[endingDay] : [];
  const outro = _outroRaw.map(ln=>{
    if(typeof ln==='string') return ln;
    if(!ln||!ln.t) return null;
    if(ln.ifFlag && !getFlag(ln.ifFlag)) return null;
    if(ln.ifNotFlag && getFlag(ln.ifNotFlag)) return null;
    return ln.t;
  }).filter(Boolean);
  overlay.classList.add('in');

  const finishWithDayCard=()=>{
    txt.innerHTML = `— 다음날 —<br>DAY ${nextDay}`;
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
  };

  let i=0;
  const showOutroLine=()=>{
    if(i>=outro.length){ finishWithDayCard(); return; }
    txt.innerHTML = outro[i];
    i++;
    setTimeout(showOutroLine, 2000);
  };

  if(outro.length && !skipNarration){
    setTimeout(showOutroLine, 300); // 페이드인과 겹치지 않게 살짝 대기
  } else {
    finishWithDayCard();
  }
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
  // 익명(???) 글을 실제로 열어봤을 때만 매소련 채팅이 열린다.
  // (노션 Day1 [CHAT_301_IDLE1] 조건: CHAT_301_BOARD_DONE — 이 플래그를 아무도 안 세팅하고 있었다)
  if(p.author==='???'){
    setFlag('CHAT_301_BOARD_DONE'); DONE_EVENTS.add('CHAT_301_BOARD_DONE');
    if(typeof markNewMsg==='function') markNewMsg('301');
    if(curR==='301'&&typeof loadChatScript==='function') loadChatScript('301');
    if(typeof checkTriggers==='function') checkTriggers();
  }
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
      // delay가 적힌 이벤트는 그만큼 늦게 도착시킨다.
      // (이전엔 delay를 face 이벤트에서만 써서, 민원·채팅·게시판이 Day 시작에 한꺼번에 쏟아졌다)
      const wait=evt.delay||0;
      if(wait>0){
        const _day=day;
        setTimeout(()=>{ if(currentDay===_day) executeEvent(evt); }, wait);
      } else {
        executeEvent(evt);
      }
    }
  });
  // E2A Day5 — 1층 복도 이동 시 결판 씬이 열리도록 state만 세팅
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
      // 민원은 일단 민원함에만 들어간다. 채팅으로의 전달(답장 선택지 포함)은
      // 플레이어가 민원함에서 이 민원을 직접 클릭(selC)하는 순간에 이루어진다.
      // — 민원함을 실제로 써야만 대화가 오는 구조를 만들기 위함.
      CLIST.push({id:c.id, room:c.room, subj:c.subj, time:c.time,
                  body:c.lines.join('\n'), u:true,
                  lines:c.lines, resId:evt.resId,
                  delivered:false, replyEvtId:evt.id+'_REPLY',
                  replyChoices:evt.complaint.replyChoices||[]});
      const tndC=document.getElementById('tnd-c');
      if(tndC)tndC.style.display='inline-block';
      SND.play('민원함');
      setTimeout(()=>log('새로운 민원이 접수됐습니다. ('+c.room+')'),300);
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
    if(step&&step._requireFavorMax&&((RES[resId]?.favor||0) > step._requireFavorMax.max)){
      checkTriggers(); return;   // 조건 미충족 — 이 채팅은 보내지 않는다
    }
    // ※ 2026-09-06 수정 — chat_push가 스텝 자신의 requireFlag/requireDay를 통째로 무시했다.
    //   loadChatScript는 이 조건들을 지키는데 chat_push만 안 지켜서, 루트 조건이 안 맞는
    //   채팅이 강제로 배달됐다. 실제 사고: Day2에 명성이 "형이 준 돈으로 간 데"라고 하는데
    //   노래방비를 안 준 플레이어에게도 그대로 떴다(EVT_001_B_DONE 루트 전용 스텝인데
    //   EVT_D2_002_PUSH에 조건이 없었음). 조건 판정은 loadChatScript와 동일하게 맞춘다.
    if(step&&step.requireFlag&&!getFlag(step.requireFlag)){
      checkTriggers(); return;
    }
    if(step&&step.requireDay&&currentDay<step.requireDay){
      checkTriggers(); return;
    }
    // 같은 상대에게 아직 플레이어가 답 안 한 선택지(pendingChatChoice)가 남아있으면
    // 이 이벤트를 지금 밀어넣지 않고 잠시 뒤 다시 시도한다.
    // (예전엔 조건 없이 덮어써서, 플레이어가 선택지를 누르기 전에 다음 채팅이 밀고 들어와
    //  이전 선택지가 통째로 사라지는 문제가 있었다 — "클릭 안 했는데 다음 얘기로 넘어감" 버그)
    const _pend=pendingChatChoice[resId];
    const _pendUnanswered=_pend && _pend.choices && _pend.choices.length && !DONE_EVENTS.has(_pend.evtId);
    const _queueBusy=(()=>{ const q=_chatQueues[resId]; return q && (q.running||q._pendingLine); })();
    if(_pendUnanswered||_queueBusy){
      const _day=currentDay;
      setTimeout(()=>{ if(currentDay===_day) executeEvent(evt); }, 2000);
      return;
    }
    if(step){
      const msgs=step.msgs||[];
      // 배달을 시작한 시점에 '이미 내보낸 스텝'으로 찍는다.
      // 안 찍으면 다음 날 loadChatScript가 같은 스텝을 처음부터 다시 재생 → 채팅 중복.
      setFlag('MSGS_SHOWN_'+step.id);
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
      DONE_EVENTS.add(evt.flagToSet);   // after: 트리거가 flagToSet 값을 가리켜도 동작하도록
      if(evt.resId&&curR===evt.resId) loadChatScript(evt.resId);
    }
    checkTriggers();
    
  } else if(evt.type==='face'){
    const resId=evt.resId;
    if(evt.state) RES_EVENT_STATE[resId] = evt.state;
    const delay = evt.delay || 500;
    const _day = currentDay;
    // 예전엔 대면/CCTV 화면이 열려 있으면 그냥 포기했다. 그래서 연속 씬 체인
    // (Day6 END_3: 아침 씬 → 채팅 → 메모 전달)이 앞 씬이 안 닫혔다는 이유로 통째로 사라졌다.
    // 화면이 비워질 때까지 기다렸다가 연다. 상태 세팅도 열기 직전에 다시 해준다
    // (앞 씬의 closeFace 가 onEnd 로 덮어쓰기 때문).
    let _tries = 0;
    const _tryOpen = ()=>{
      if(currentDay !== _day) return;   // 날이 바뀌면 취소
      const fs = document.getElementById('face-screen');
      const cc = document.getElementById('ccbig');
      if((fs&&fs.classList.contains('on')) || (cc&&cc.classList.contains('on'))){
        if(++_tries < 90) setTimeout(_tryOpen, 1000);
        return;
      }
      if(evt.state) RES_EVENT_STATE[resId] = evt.state;
      if(typeof antHideFace==='function')antHideFace();
      openFace(resId);
    };
    setTimeout(_tryOpen, delay);
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
      const _day=currentDay;
      // 날이 바뀌면 취소 — 전날 후속 이벤트가 다음날로 새는 것 방지
      setTimeout(()=>{ if(currentDay===_day) executeEvent(evt); }, delay);
    }
  });
  checkDayAutoAdvance();
}

// ══════════════════════════════════════════════════════════
// Day 자동 진행 (다음날 버튼은 DEV/전시 테스트용으로 계속 남긴다 — 조건 없이 항상 작동)
// 그날의 "필수" 이벤트(민원 답장 등)를 다 처리하면, 별도 버튼 없이도 자동으로 다음날로 넘어간다.
// _autoCompleteDayEvents가 이미 "그날 못 본 내용은 요약으로 채워 넣는" 안전장치이므로,
// 여기서는 "그날의 핵심 줄기를 건드렸는가"만 확인하면 충분하다 — 나머지는 그 안전장치가 메운다.
// ※ 노션에는 원래 "다음날로 넘어가는 조건"이 명시돼 있지 않았다(엔딩 조건만 있음).
//    이 조건 목록은 이번에 새로 설계한 것 — 노션 화면상태표.md에도 같이 반영해 둔다.
// ══════════════════════════════════════════════════════════
let _dayAdvancing=false;
const _dayAutoAdvanced={};

// 그날 5개 호실(101/102/201/202/301) 문을 전부 한 번이라도 방문했는지 추적.
// openFace()에서 방문할 때마다 찍고, advanceDay()가 새 하루를 시작할 때 초기화한다.
// Cqjo 지적(2026-09-05): "모든 집은 다 두번씩 방문해봐야됨" — Day1처럼 방문에 고유
// 콘텐츠(이름 공개 등)가 있는 날은 그 콘텐츠 완료 플래그로 방문을 보장하지만,
// Day2~5는 날마다 어떤 집엔 그런 고유 콘텐츠가 아예 없다(예: Day5 102/202는
// 재방문해도 같은 반복 대사만 나옴 — 두 번 강제하면 콘텐츠 없는 클릭만 두 번 더
// 시키는 셈). 그래서 "적어도 한 번은 순찰하며 들여다봤는가"를 최소 바닥선으로 두고,
// 고유 콘텐츠가 있는 곳은 그 콘텐츠 완료 플래그를 추가로 요구한다.
const _doorVisitedToday={};
function _allResidentsVisitedToday(){
  return ['101','102','201','202','301'].every(id=>_doorVisitedToday[id]);
}

function _isDayComplete(day){
  switch(day){
    // Day1 — 2026-09-05 보강: 원래는 민원 답장 3건만 확인해서 문 방문을 하나도
    // 안 해도(채팅만으로) 하루가 끝나버렸다(Cqjo 재현: "뽀삐 같이 찾아봅시다"만 누르고
    // 다음날로 넘어감). 준비된 Day1 콘텐츠(101/102/201 두 번째 방문, 202/301 첫 방문)를
    // 전부 봐야 끝나도록 조건을 그 콘텐츠들이 완료될 때 세팅되는 플래그로 전부 확장.
    case 1: return !!(getFlag('CHAT_101_REPLIED') &&
                      getFlag('EVT_101_INTRO_DONE') &&   // 101호 두 번째 방문(이름 공개)
                      getFlag('EVT_001_INTRO_DONE') &&   // 102호 두 번째 방문(이름 공개)
                      getFlag('EVT_201_FOLLOWUP_DONE') && // 201호(선형) 두 번째 방문
                      getFlag('EVT_202_MET') &&          // 202호 첫 방문
                      getFlag('EVT_301_GLIMPSE_DONE') &&  // 301호 첫 방문(짧은 등장)
                      (getFlag('EVT_002_CCTV')||getFlag('EVT_002_SEARCH')));
    // Day2~5 — 2026-09-05 보강: 예전엔 그날의 민원 답장만 확인해서, 문 방문이나
    // 준비된 장소 이벤트를 하나도 안 거쳐도 다음날로 넘어갈 수 있었다. 각 날짜의
    // 실제 콘텐츠 체인 중, 선택지에 상관없이(어떤 걸 골라도) 도달 가능한 "완료"
    // 플래그만 골라 추가했다 — 특정 루트만 타는 플래그를 넣으면 그 루트를 안 밟은
    // 플레이어가 영원히 다음날로 못 넘어가므로 제외(예: Day4 밴드 진실은 호감도
    // 40 이상에서만 열려서 조건에서 뺐다). 여기에 모든 집 순찰 방문(1회 이상)을
    // 공통 바닥선으로 더한다.
    case 2: return !!(getFlag('CHAT_D2_101_REPLIED') && getFlag('D2_WALL_REPLIED') &&
                      getFlag('EVT_D2_004_DONE') &&        // 102호 방문(민원 후속)
                      getFlag('EVT_D2_TIKI_003_DONE') &&    // 301호 3층 진입 2단계
                      (getFlag('EVT_D2_001_A_DONE')||getFlag('EVT_D2_001_B_WAIT_DONE')) && // 201(선형) 뽀삐 후속 — 쓰레기장
                      _allResidentsVisitedToday());
    case 3: return !!(getFlag('CHAT_D3_101_REPLIED') &&
                      getFlag('BAND_REVEALED') &&          // 102호 — 밴드 관계 노출(채팅·방문 양쪽 다 이 플래그로 귀결)
                      getFlag('EVT_D3_003_DONE') &&         // 202호 — 쓰레기장 사진 심문
                      getFlag('EVT_D3_005_DONE') &&         // 301호 — 첫 대면
                      _allResidentsVisitedToday());
    case 4: return !!(getFlag('CHAT_D4_101_REPLIED') &&
                      getFlag('EVT_D4_005_DONE') &&         // 102호 — 101↔102 충돌 씬(항상 열림)
                      getFlag('EVT_D4_002_DONE') &&         // 301호 — 게시판 글 자백(항상 열림)
                      (getFlag('EVT_D4_003_DONE')||getFlag('EVT_D4_003_TALKED')) && // 202호 — 벽소리 상담(어느 선택지든)
                      _allResidentsVisitedToday());
    case 5: return !!(getFlag('EVT_D5_201_REPLIED') && getFlag('EVT_D5_102_REPLIED') && getFlag('EVT_D5_101_REPLIED') &&
                      getFlag('EVT_D5_002_DONE') &&         // 쓰레기장 — 케이블 단서
                      getFlag('EVT_D5_003_DONE') &&         // 2F복도 — 벽 두드림 단서
                      getFlag('EVT_D5_009_DONE') &&         // 301호 — 302호 빛/긁는 소리
                      getFlag('EVT_D5_004_DONE') &&         // 102호 — 오디션 1차 합격(모든 루트 공통)
                      _allResidentsVisitedToday());
    default: return false; // Day6은 [일과 종료] 버튼으로 엔딩 진행 — 자동 진행 대상 아님
  }
}

function checkDayAutoAdvance(){
  const day=currentDay;
  if(day<1||day>5) return;
  if(_dayAutoAdvanced[day]||_dayAdvancing) return;
  if(!_isDayComplete(day)) return;
  _dayAutoAdvanced[day]=true;
  _dayAdvancing=true;
  // 방금 뜬 대사/토스트/채팅 답장이 자연스럽게 끝날 시간을 준 뒤 넘어간다.
  setTimeout(()=>{
    _dayAdvancing=false;
    if(currentDay===day) advanceDay();
  }, 3500);
}

const pendingChatChoice={};

// Day 전환 시 채팅 흐름 정리.
// 아직 화면에 안 나온 메시지를 기록에 그대로 밀어넣고, 재생 큐를 비운다.
// 이걸 안 하면 (a) 안 나온 메시지가 통째로 사라지거나
//              (b) 다음 날 같은 채팅이 처음부터 다시 재생돼 중복으로 쌓인다.
function _settleChatFlowForDayEnd(){
  // ※ 2026-09-06 재수정 — 09-05에 "탭을 지우지 않는다"로 바꿨던 걸 되돌린다.
  //   그 수정의 전제("탭을 안 지우면 다음에 열었을 때 실제로 골라야 플래그가 선다")가
  //   102호 사례에서 틀렸다: CHAT_102_CHEER_DONE은 _DAY_FLAGS[1]에 이미 별도로
  //   백필되고 있어서, 탭을 안 지워도 플래그는 어차피 날짜가 바뀌는 순간 세팅된다.
  //   결과: EVT_D2_102_CCTV_PUSH(요구 플래그: CHAT_102_CHEER_DONE)가 Day2에
  //   정상 발동하는데, "진심으로 응원합니다" 탭은 안 지워진 채 화면에 그대로 남아있다가
  //   플레이어가 나중에 그 탭을 누르면 — CCTV 대화가 이미 다 끝난 뒤에 뜬금없이
  //   "성의 존나없네"가 나오고, 곧바로 Day2의 다음 채팅(오디션 전날 "형 자요?")까지
  //   이어져 버렸다. 실사고 재현(Cqjo 스크린샷) — 안 답한 탭이 사라지지 않고 남아있다가
  //   완전히 다른 시점에, 완전히 다른 대화 사이에 끼어들어 답해지는 게 근본 원인.
  //
  //   원칙(노션): "모든 이벤트/스크립트는 1회성. 조건 달성 → 1회 실행 → 이후
  //   DEFAULT_VISIT(반응없음)으로 돌려막기." 안 답한 채팅 탭도 같은 원칙을 따라야
  //   한다 — 그날이 지나면 그 탭은 사라지고, 그 탭이 세팅했어야 할 플래그는
  //   _DAY_FLAGS의 날짜별 백필 목록이 책임진다(이미 그렇게 설계돼 있다: Day1
  //   102호 응원 라인은 CHAT_102_FIRST_DONE/CHAT_102_CHEER1/CHAT_102_CHEER_DONE
  //   전부 _DAY_FLAGS[1]에 있다). 탭에 붙은 favor/flags를 여기서 임의로
  //   적용하지는 않는다 — 플레이어가 실제로 고르지 않은 선택지의 보상을
  //   대신 지급하는 건 또 다른 종류의 조작이기 때문이다.
  Object.keys(RES).forEach(id=>{
    const pend=pendingChatChoice[id];
    if(pend&&pend.pendingMsgs&&pend.pendingMsgs.length&&chatH[id]){
      pend.pendingMsgs.forEach(m=>chatH[id].push(m));
      delete pend.pendingMsgs;   // 이미 로그에 옮겼으니 다음에 또 밀어넣지 않는다
    }
    if(pend&&pend.evtId){
      DONE_EVENTS.add(pend.evtId);   // 1회성 — 그날이 지나면 이 탭은 닫힌다
      delete pendingChatChoice[id];
    }
    const q=_chatQueues[id];
    if(q){
      if(q._pendingLine){
        if(chatH[id]) chatH[id].push(q._pendingLine.m);
        q._pendingLine=null;
      }
      while(q.msgs.length){
        const it=q.msgs.shift();
        if(chatH[id]) chatH[id].push(it.m);
      }
      q.running=false;
    }
  });
  const box=document.getElementById('chat-choices');
  if(box) box.innerHTML='';
  if(curR) renderChat(curR);
}

// 선택지 버튼 실제 그리기. 여기까지 온 건 "지금 그려도 되는 상태"라는 뜻.
function _paintChatChoices(resId, choices, evtId){
  const box=document.getElementById('chat-choices');
  if(!box)return;
  box.innerHTML=(choices||[]).map((c,i)=>{
    const label=c.label||c;
    return`<button class="choice-btn" onclick="pickChatChoice('${resId}',${i},'${evtId}')">${label}</button>`;
  }).join('');
}

// 큐가 빈 뒤(=말이 다 끝난 뒤) 대기 중인 선택지를 꺼내 그린다.
function _flushChatChoices(resId){
  if(curR!==resId)return;
  const pend=pendingChatChoice[resId];
  if(!pend||!pend.choices||!pend.choices.length)return;
  if(pend.pendingMsgs&&pend.pendingMsgs.length)return;
  if(DONE_EVENTS.has(pend.evtId))return;
  const q=_getQueue(resId);
  if(q.msgs.length||q._pendingLine)return;
  _paintChatChoices(resId, pend.choices, pend.evtId);
}

// 선택지 표시 요청. 바로 그릴 수 있는 상황이 아니면 대기열에만 넣는다.
//  · 다른 호실을 보고 있을 때 그리면 → 남의 선택지가 겹쳐 보임
//  · 아직 말이 남아 있을 때 그리면 → 말 끝나기 전에 선택지가 튀어나옴
// 둘 다 여기서 막고, 조건이 갖춰지는 시점(_runQueue 종료 / selRes 진입)에 그린다.
function showChatChoices(resId, choices, evtId){
  const box=document.getElementById('chat-choices');
  if(!box)return;
  if(DONE_EVENTS.has(evtId)){ if(curR===resId)box.innerHTML=''; return; }

  if(curR!==resId){
    pendingChatChoice[resId]={evtId, choices:choices||[]};
    return;
  }
  const q=_getQueue(resId);
  if(q.msgs.length||q._pendingLine){
    pendingChatChoice[resId]={evtId, choices:choices||[]};
    return;
  }
  pendingChatChoice[resId]={evtId, choices:choices||[]};
  _paintChatChoices(resId, choices, evtId);
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

  let rawMsgs=choice.lines||(choice.replyLines||choice.reply||[]);
  // 일부 데이터 항목이 choice.lines 맨 앞에 방금 보낸 내 대사(myText)를 중복으로 다시 적어둔 경우가 있다.
  // 위에서 이미 chatH에 한 번 echo했으므로, 같은 내용이 lines[0]에도 있으면 버블 중복을 막기 위해 제거한다.
  if(rawMsgs.length && typeof rawMsgs[0]==='object' && rawMsgs[0].f==='s' && rawMsgs[0].t===myText){
    rawMsgs=rawMsgs.slice(1);
  }
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
    // 채팅 선택지도 복수 플래그/복수 캐릭터 호감도를 쓸 수 있게 한다.
    if(choice.flags)choice.flags.forEach(f=>{setFlag(f);DONE_EVENTS.add(f);});
    if(choice._favorMap){
      Object.entries(choice._favorMap).forEach(([rid,delta])=>{
        if(RES[rid]&&delta)RES[rid].favor=Math.max(0,Math.min(100,RES[rid].favor+delta));
      });
      updateHappiness();updateHome();
    }
    if(choice.clues)choice.clues.forEach(cid=>{ if(typeof grantClue==='function')grantClue(cid); });
    CLIST.filter(c=>c.resId===resId||c.room===RES[resId]?.room).forEach(c=>c.u=false);
    renderCL();updateHome();
    checkTriggers();
    
    if(choice.gotoLoc){
      setTimeout(()=>gotoLocation(choice.gotoLoc), 600);
      return;
    }
    if(choice._face){
      setTimeout(()=>{
        // 다른 탭이 열려있거나 face-screen이 이미 활성이면 취소
        if(activeTab && activeTab !== 'res') return;
        if(document.getElementById('face-screen')?.classList.contains('on')) return;
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

    // 이 선택지를 고르자마자 곧바로(0초 지연) 다음 채팅 스텝(전혀 다른 화제일 수 있음)이
    // 튀어나오던 문제 — Cqjo 지적: "형 자요? 로 시작하는 얘기가 바로 연달아 온다."
    // 방금 대화가 끝난 여운도 없이 다음 화제가 끼어들면 부자연스러워서, 다음 스텝을
    // 보여주기 전에 짧은 텀을 둔다. (같은 스텝 안의 후속 tap이 아니라, loadChatScript가
    // 찾아내는 '다음' 스텝이므로 — 새 화제로 넘어가는 지점에서만 발생하는 텀이다.)
    if(curR===resId) setTimeout(()=>{ if(curR===resId) loadChatScript(resId); }, 2200);
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
    // 호감도 상한 조건 — 방치 루트에서만 오는 신호 채팅용
    if(step._requireFavorMax&&((RES[step._requireFavorMax.id]?.favor||0) > step._requireFavorMax.max))continue;

    const shownKey='MSGS_SHOWN_'+step.id;
    setFlag(shownKey);
    box.innerHTML='';   // 새 대사가 나오기 전엔 이전 선택지를 남겨두지 않는다
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
  // 이전 호실 선택지가 남아 겹쳐 보이는 것 방지 — 들어올 때 무조건 비우고 시작한다.
  const _cbox=document.getElementById('chat-choices');
  if(_cbox) _cbox.innerHTML='';
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
  updateGlobalMsgAlert();
}

// 대면(face-screen)·장소(loc-screen) 화면은 전체화면 오버레이라 사이드바 알림 점이 가려진다.
// 그래서 어느 화면에 있든 항상 보이는 전역 배지를 따로 둔다 — 클릭하면 해당 채팅으로 바로 이동.
function updateGlobalMsgAlert(){
  const el=document.getElementById('global-msg-alert');
  if(!el)return;
  const pendingId=['301','202','201','102','101'].find(id=>newMsgFlags[id]);
  if(pendingId){
    const room=RES[pendingId]?RES[pendingId].room:pendingId+'호';
    const txt=document.getElementById('gma-text');
    if(txt)txt.textContent='새 메시지 — '+room;
    el.classList.add('on');
  } else {
    el.classList.remove('on');
  }
}

// 전역 알림 클릭 — 지금 대면/장소 화면 등 무엇이 열려있든 다 닫고 그 채팅으로 바로 이동한다.
function jumpToNewMsg(){
  const pendingId=['301','202','201','102','101'].find(id=>newMsgFlags[id]);
  if(!pendingId)return;
  const faceOpen=document.getElementById('face-screen')?.classList.contains('on');
  const locOpen=document.getElementById('loc-screen')?.classList.contains('on');
  if(faceOpen){
    closeFace();
    setTimeout(()=>selRes(pendingId), 750);
  } else if(locOpen){
    closeLoc();
    setTimeout(()=>selRes(pendingId), 550);
  } else {
    if(curR)closeRes();
    selRes(pendingId);
  }
}

function renderChat(id){
  const msgs=chatH[id]||[];
  const box=document.getElementById('chatbox');
  if(!box)return;

  // 민원함에서 아직 열어보지 않은(delivered=false) 민원은 채팅창에 노출되지 않는다.
  const complaints=CLIST.filter(c=>(c.resId===id||c.room===RES[id]?.room)&&c.delivered);

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
  const guideOv=document.getElementById('guide-overlay');
  if(guideOv&&guideOv.classList.contains('on')){ closeGuide(); return; }
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
  // 민원함에서 이 민원을 직접 열어본 순간, 비로소 채팅으로 전달된다.
  if(!c.delivered && c.resId){
    c.delivered=true;
    markNewMsg(c.resId);
    if(c.replyChoices && c.replyChoices.length){
      pendingChatChoice[c.resId]={evtId:c.replyEvtId, choices:c.replyChoices};
      if(curR===c.resId){
        renderChat(c.resId);
        showChatChoices(c.resId, c.replyChoices, c.replyEvtId);
      }
    }
  }
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
  renderCCHotspots(name);
  startCCHudClock();
  const gotoBox=document.getElementById('cc-goto-btns');
  if(gotoBox){
    const locMap={'1F 복도':'1F복도','2F 복도':'2F복도','쓰레기장':'쓰레기장','흡연실':'흡연실'};
    const locName=locMap[name];
    // ── Day4 CLUE_001 — 2F 복도 화면에서 멈춘 타임스탬프를 직접 클릭해야 열린다 (행동요구형)
    //    노션 EVT_D4_001: 새 UI 없이 클릭 한 번 + 단서 토스트로 끝낸다.
    if(currentDay===4 && name==='2F 복도' && !DONE_EVENTS.has('EVT_D4_001_DONE')){
      gotoBox.innerHTML='<button class="cc-goto" onclick="ccTimestampClick()">03:14:22</button>'
        + (locName&&LOC_SCRIPTS[locName]
            ? '<button class="cc-goto" onclick="closeCC();setTimeout(()=>gotoLocation(\''+locName+'\'),300)">▶ 이동하기</button>' : '');
      return;
    }
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
function closeCC(){SND.stopCCTV();document.getElementById('ccbig').classList.remove('on');stopCCHudClock();}

// CCTV 확대화면 구형 캠코더 표시(HUD) — 우측 상단 타임코드가 실제로 흘러가는 것처럼 1초마다 증가.
// 카메라 열 때마다 임의 지점(과거 녹화본을 보는 듯한 느낌)에서 다시 시작.
let _cchudSec=0, _cchudTimer=null;
function startCCHudClock(){
  stopCCHudClock();
  _cchudSec=Math.floor(Math.random()*400)+30;
  _updateCCHudClock();
  _cchudTimer=setInterval(()=>{_cchudSec++;_updateCCHudClock();}, 1000);
}
function stopCCHudClock(){
  if(_cchudTimer){clearInterval(_cchudTimer);_cchudTimer=null;}
}
function _updateCCHudClock(){
  const el=document.getElementById('cchud-time');
  if(!el)return;
  const h=String(Math.floor(_cchudSec/3600)).padStart(2,'0');
  const m=String(Math.floor((_cchudSec%3600)/60)).padStart(2,'0');
  const s=String(_cchudSec%60).padStart(2,'0');
  el.textContent=h+':'+m+':'+s;
}

// CCTV 확대 화면 위 조사 지점(문/문고리/초인종/센서 등) — CC_HOTSPOTS(data.js)의
// 좌표(원본 이미지 1672×941 기준)를 SVG polygon으로 그려서 마우스 오버 시 초록 테두리,
// 클릭 시 화면 중앙에 문구를 띄운다. 카메라 화면을 바꿀 때마다(bigCC) 다시 그린다.
function renderCCHotspots(camName){
  const layer=document.getElementById('cc-hotspot-layer');
  if(!layer)return;
  const spots=(typeof CC_HOTSPOTS!=='undefined'&&CC_HOTSPOTS[camName])||[];
  layer.innerHTML=spots.map(s=>{
    const d=s.points.map(p=>p.join(',')).join(' ');
    return `<polygon class="cc-hotspot" points="${d}" data-id="${s.id}" onclick="ccInspect('${s.id}')"><title>${s.label}</title></polygon>`;
  }).join('');
  layer._camName=camName;
}
function ccInspect(spotId){
  const camName=document.getElementById('cc-hotspot-layer')?._camName;
  const spots=(typeof CC_HOTSPOTS!=='undefined'&&CC_HOTSPOTS[camName])||[];
  const spot=spots.find(s=>s.id===spotId);
  if(!spot)return;
  SND.play('탭');
  showCenterNote(spot.msg||'아무 이상 없다.');
  log('CCTV 조사 — '+(spot.label||spotId));
}
// 화면 중앙 박스 문구 — 호감도 변화(#favor-center)와 같은 디자인을 그대로 재사용.
// CCTV 조사 반응 외에, 나중에 단서 획득 등 다른 중앙 알림에도 그대로 쓸 수 있게 범용으로 뺌.
function showCenterNote(text){
  const c=document.getElementById('cc-note');
  if(!c)return;
  c.textContent=text;
  c.classList.add('show');
  if(c._t)clearTimeout(c._t);
  c._t=setTimeout(()=>{c.classList.remove('show');}, 1600);
}

let saveT=null;
try{const s=localStorage.getItem('vlog');if(s)document.getElementById('logta').value=s;}catch(e){}
document.getElementById('logta').addEventListener('input',()=>{clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem('vlog',document.getElementById('logta').value);}catch(e){}const el=document.getElementById('log-saved');el.textContent='저장됨';el.style.color='#555';setTimeout(()=>el.textContent='',2000);},1000);});

// ── [수정] doVisit: 복잡한 팝업 블로킹 로직 제거 ──
// 이제 doVisit은 바로 대면(openFace) 화면으로 이동시킵니다.
// 문이 닫혔거나 인기척이 없는 섬뜩한 예감 등은 대면 화면 대화창 나레이션으로 자연스럽게 노출됩니다.
let _visitingFace=false;
function doVisit(){
  if(!curR||_visitingFace||_closingFace)return; // 이동 연출 중 연타로 openFace 중복 호출 방지
  _visitingFace=true;
  const r=RES[curR];
  const resId=curR;

  const fd=document.getElementById('fade');
  document.getElementById('fademsg').textContent=r.room+' 앞으로 이동 중...';
  fd.classList.add('in');
  setTimeout(()=>{
    SND.playVisit(resId);
    openFace(resId);
    setTimeout(()=>{fd.classList.remove('in');_visitingFace=false;},200);
  },800);
  log(r.room+' 방문');
}

// ── [수정] openFace: 6일 차 부재 및 극단적 방치 상태를 대화창 나레이션으로 동적 구현 ──
// 문닫힘 배경화면이 출력된 후, 대화창 내부 텍스트로 섬뜩하거나 비어있는 묘사들이 자연스럽게 타건됩니다.
function openFace(resId){
  if(typeof antHideFace==='function')antHideFace();
  const r=RES[resId];
  if(!r){console.error('[openFace] RES에 없는 ID:',resId);return;}
  if(typeof _doorVisitedToday!=='undefined') _doorVisitedToday[resId]=true;   // 그날 순찰 방문 기록(Day 자동 진행 조건용)

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
      // 호감도 조건 (노션 Day4의 "C_202 호감도 30 이상" 같은 조건부 씬용)
      const favorOk=!candidate._requireFavor||
                    ((RES[candidate._requireFavor.id]?.favor||0) >= candidate._requireFavor.min);
      // 복도/장소 씬(_hideCharPanel)은 loc 체크 건너뜀. 그 외 씬만 loc 체크로 doVisit 폴백 처리.
      const isLocScene = !candidate._hideCharPanel && candidate.loc && !candidate.loc.includes(resId+'호') && !candidate._forceOpen;
      if(flagOk&&dayOk&&routeOk&&favorOk&&!isLocScene){
        scripted=candidate;
        // 호감도가 기준 미만이면 대체 씬으로 (예: 게시판 자백의 냉담 버전)
        if(candidate._altIfFavorBelow){
          const a=candidate._altIfFavorBelow;
          if((RES[a.id]?.favor||0) < a.min && FACE_SCRIPTS[a.use]) scripted=FACE_SCRIPTS[a.use];
        }
      }
    }
    if(!scripted) scripted=pickRevisit(resId)||FACE_SCRIPTS['DEFAULT_VISIT_'+resId]||FACE_SCRIPTS['default'];
  }

  faceScript=JSON.parse(JSON.stringify(scripted));

  faceScript.resId=resId;
  faceScript._endAfterLines=false;
  faceContinuation=null;
  // met(얼굴 확인)은 여기서 무조건 세우지 않는다 — 실제로 스크립트 안에서
  // 캐릭터 이미지 디렉티브(!101 / !101문열림 등, !x 제외)를 만났을 때만 세운다.
  // (showFaceLine 참고). 문이 안 열리는/반응 없는 방문(재방문 실패, DEFAULT_VISIT,
  // customNoVisitMsg)에서는 캐릭터가 안 나오므로 met 이 세워지면 안 된다.
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
    // 아직 얼굴을 실제로 마주치지 않은 상태(met=false)에서는 "[ RESIDENT ]" placeholder
    // 대신 없는사람.png를 채워 넣는다. 얼굴이 뜨는 디렉티브(!101/!101문열림 등)를 만나면
    // showFaceLine의 _markFaceMet 처리로 실제 얼굴로 교체된다.
    const metNow = !!RES_STATE[resId]?.met;
    if(faceScript.char){
      if(faceScript.char === 'x') {
        if(metNow){ charImg.style.visibility='hidden'; }
        else { charImg.style.visibility='visible'; charImg.src='캐릭터/없는사람.png'; }
      }
      else {
        charImg.style.visibility='visible';
        let cName = faceScript.char.replace('.png', '');
        if(!cName.includes('/')) cName = '캐릭터/' + cName + '.png';
        else cName = faceScript.char;
        charImg.src=cName;
      }
    } else {
      if(metNow){ charImg.style.visibility='hidden';charImg.src=''; }
      else { charImg.style.visibility='visible'; charImg.src='캐릭터/없는사람.png'; }
    }
  }

  const elMap={
    'fc-name': faceScript._hideCharPanel ? '—' : profileNameFor(resId),
    'fc-room': faceScript._hideCharPanel ? (faceScript.loc||'') : (faceScript.room||r.room),
    'fc-fav':  faceScript._hideCharPanel ? '' : (r.favor+' / 100'),
    'fc-loc':faceScript.loc||r.room+' 앞',
    'face-daydisp':document.getElementById('daydisp')?.textContent||'DAY 1',
    'face-dname':'—'
  };
  Object.entries(elMap).forEach(([id,val])=>{
    const el=document.getElementById(id);if(el)el.textContent=val;
  });
  const favfill=document.getElementById('fc-favfill');
  if(favfill)favfill.style.width= faceScript._hideCharPanel ? '0%' : r.favor+'%';
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

// 스크립트 진행 중 실제로 캐릭터 이미지가 화면에 뜨는 순간에만 호출.
// "얼굴을 실제로 마주쳤을 때"만 met/이름을 공개하기 위한 지점.
// 대사창 화자 이름 표시. 아직 이름을 모르는(nameKnown=false) 캐릭터의 실명이
// speaker로 그대로 찍혀 있으면 "???"로 가려서, 스크립트 안에서 실제로 이름이
// 밝혀지는 순간(unlocks.name)까지는 대사창에서도 이름이 새지 않게 한다.
function _displaySpeaker(speaker, resId){
  if(!speaker) return '???';
  if(resId && RES_STATE[resId] && !RES_STATE[resId].nameKnown){
    const real = realNameFor(resId);
    if(speaker===real) return RES[resId]?.room||'???';
  }
  return speaker;
}

function _markFaceMet(resId){
  if(!RES_STATE[resId] || RES_STATE[resId].met) return;
  RES_STATE[resId].met=true;
  if(curR===resId) updateResidentProfile(resId);
}

// 대면 화면이 닫힌 직후 남은 타이머가 들어와도 터지지 않게 방어.
function _activeLines(){return (faceContinuation?faceContinuation.lines:(faceScript&&faceScript.lines))||[];}
function _activeChoices(){return (faceContinuation?faceContinuation.choices:(faceScript&&faceScript.choices))||null;}
function _activeChoiceResults(){return (faceContinuation?faceContinuation.choiceResults:(faceScript&&faceScript.choiceResults))||null;}

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
              _markFaceMet(faceScript.resId);
            }
          } else {
            const charImg=document.getElementById('face-char-img');
            if(charImg){
              if(fname==='x'){charImg.style.visibility='hidden';}
              else{
                charImg.style.visibility='visible';charImg.src='캐릭터/'+fname+'.png';charImg.onerror=()=>{};
                if(faceScript?.resId) _markFaceMet(faceScript.resId);
              }
            }
          }
        });
        faceLineIdx++;
        showFaceLine();
        return;
      }

      const autoAdv=raw.endsWith(',,');
      const displayText=autoAdv?raw.slice(0,-2):raw;
      // 이 줄을 표시하는 시점에 토큰을 새로 발급. 아래 예약되는 자동진행 타이머는
      // 실행 시점에 이 토큰이 아직 최신인지 확인해서, 그 사이 다른 경로(수동 클릭 등)로
      // 이미 넘어갔으면 조용히 무시한다 — 안 그러면 한 줄을 몰래 건너뛰는 버그가 생긴다.
      const _myLineToken=++_faceLineToken;

      // 경비(플레이어) 대사는 지문처럼 자동으로 타이핑되는 게 아니라, 항상 대사창 아래
      // 선택지 자리에 한 줄짜리 버튼으로만 뜨고, 플레이어가 그걸 직접 클릭해야 말한다.
      // (선택지 두 개 중 고르는 실제 분기 선택과는 다름 — 그냥 "이 대사를 내가 클릭해서 진행"하는 용도.)
      // facePhase를 'choice'로 바꿔서 advanceDialogue()의 클릭/엔터로 이 줄을 건너뛰지
      // 못하게 막는다 — 반드시 버튼을 눌러야만 다음으로 넘어간다.
      if(typeof line==='object' && line.speaker==='경비'){
        facePhase='choice';
        if(dname)dname.textContent='';
        txt.textContent='';
        adv.style.display='none';
        ch.innerHTML=`<button class="face-choice" onclick="_confirmGuardLine()">${displayText}</button>`;
        return;
      }

      // 자동 진행(,,) 줄은 타이핑 애니메이션이 다 끝난 "뒤"에 정지 시간을 두고 넘어가야 한다.
      // 예전엔 타이핑 시작과 동시에 고정 2000ms 타이머를 걸어서, 긴 대사일수록
      // 타이핑이 끝난 뒤 실제로 읽을 수 있는 여유 시간이 거의 없이 바로 넘어가버렸다.
      const autoAdvCb=autoAdv?()=>{
        setTimeout(()=>{
          if(_faceLineToken!==_myLineToken)return; // 그 사이 이미 다른 경로로 넘어갔으면 무시
          faceLineIdx++;showFaceLine();
        },1600);
      }:null;

      if(typeof line==='string'){
        if(dname)dname.textContent='—';
        txt.style.color='#999';
        txt.style.fontStyle='italic';
        typeText(txt, displayText, autoAdvCb, 18);
      } else {
        // 이 대사 줄에서 이름/나이가 실제로 언급되는 경우, 그 즉시 프로필에도 반영한다.
        // (예: 고재엽이 "고재엽이라고 합니다"라고 말하는 줄 자체에 unlockName:true 지정)
        if(line.unlockName||line.unlockAge){
          const targetId=line.unlockResId||faceScript.resId;
          if(targetId)unlockResidentInfo(targetId,{name:!!line.unlockName,age:!!line.unlockAge});
        }
        if(dname)dname.textContent=_displaySpeaker(line.speaker,faceScript.resId);
        txt.style.color='#eee';
        txt.style.fontStyle='normal';
        if(line.expr&&faceScript.resId)changeExpr(faceScript.resId,line.expr);
        typeText(txt, displayText, autoAdvCb, 18);
      }
      adv.style.display=autoAdv?'none':'block';
      ch.innerHTML='';
    } else {
      const choices=_activeChoices();
      if(!choices||choices.length===0){_showFaceEnd();return;}
      // '(돌아간다)' 계열 선택지는 별도 버튼으로 보여주지 않는다 — 종료 버튼은
      // 항상 "(경비실로 돌아간다)" 하나로 통일한다. 그 선택지가 유일했다면
      // 고를 것도 없이 그 결과를 그대로 적용하고 곧장 종료 버튼으로 넘어간다.
      const realIdxs=choices.map((c,i)=>i).filter(i=>!(typeof choices[i]==='string'&&choices[i].includes('돌아간다')));
      if(realIdxs.length===0){
        pickFaceChoice(choices.findIndex(c=>typeof c==='string'&&c.includes('돌아간다')));
        return;
      }
      facePhase='choice';
      if(dname)dname.textContent='';
      txt.textContent='';
      adv.style.display='none';
      ch.innerHTML=realIdxs.map(i=>
        `<button class="face-choice" onclick="pickFaceChoice(${i})">${choices[i]}</button>`
      ).join('');
    }
  }
}

// 경비 대사 버튼을 클릭해서 "말하기"를 확정한 순간. 그 뒤부터는 다른 대사 줄과
// 동일하게 타이핑 → (자동진행이면 대기 후 진행 / 아니면 클릭해서 다음 줄로) 흐름을 그대로 탄다.
function _confirmGuardLine(){
  if(facePhase!=='choice'||!faceScript||_closingFace)return;
  const txt=document.getElementById('face-dtext');
  const adv=document.getElementById('face-advance');
  const ch=document.getElementById('face-choices');
  const dname=document.getElementById('face-dname');
  const lines=_activeLines();
  const line=lines[faceLineIdx];
  if(!line||typeof line!=='object'||line.speaker!=='경비')return;
  facePhase='narrate'; // 버튼을 눌러 확정한 순간부터는 일반 대사 줄과 동일한 진행 흐름으로 복귀
  _faceLineToken++; // 이 줄을 확정하는 순간도 "다음으로 넘어감"이므로 이전에 예약된 타이머는 전부 무효화
  const _myLineToken=_faceLineToken;
  const raw=line.text||'';
  const autoAdv=raw.endsWith(',,');
  const displayText=autoAdv?raw.slice(0,-2):raw;
  const autoAdvCb=autoAdv?()=>{
    setTimeout(()=>{
      if(_faceLineToken!==_myLineToken)return;
      faceLineIdx++;showFaceLine();
    },1600);
  }:null;
  if(ch)ch.innerHTML='';
  if(dname)dname.textContent=_displaySpeaker(line.speaker,faceScript.resId);
  txt.style.color='#eee';
  txt.style.fontStyle='normal';
  if(line.expr&&faceScript.resId)changeExpr(faceScript.resId,line.expr);
  if(adv)adv.style.display=autoAdv?'none':'block';
  typeText(txt, displayText, autoAdvCb, 18);
}

function advanceDialogue(){
  // --- [수정] 대면 화면 클릭/엔터 시 엔딩 진행 로직으로 연결 ---
  if(facePhase === 'ending') { window._endingNext && window._endingNext(); return; }

  if(facePhase!=='narrate')return;
  if(!faceScript||_closingFace)return; // 대면이 닫히는 중(fade 애니메이션 중)의 중복 클릭 무시
  const txt=document.getElementById('face-dtext');
  if(txt&&txt._typingTimer){
    clearInterval(txt._typingTimer);
    txt._typingTimer=null;
    const lines=_activeLines();
    const line=lines[faceLineIdx];
    if(line){
      const raw=typeof line==='string'?line:(line.text||'');
      txt.textContent=raw.endsWith(',,')?raw.slice(0,-2):raw;
      // 타이핑 중 클릭으로 스킵한 경우, typeText의 완료 콜백(cb)이 실행될 기회를
      // 놓치므로 자동진행(,,) 줄이라면 여기서 직접 같은 정지시간을 걸어준다.
      // (안 걸어주면 자동진행 줄인데 넘어갈 방법이 없어 멈춰버림)
      if(raw.endsWith(',,')){
        const _myLineToken=_faceLineToken; // 이 시점의 토큰을 그대로 재사용(새 줄이 아니라 같은 줄의 대기시간이므로)
        setTimeout(()=>{
          if(_faceLineToken!==_myLineToken)return;
          faceLineIdx++;showFaceLine();
        },1600);
      }
    }
    return;
  }
  // 여기부터는 "이미 다 타이핑된 줄을 클릭해서 다음으로 넘어가는" 경로다.
  // 이 줄에 대해 예약돼있을 수 있는 자동진행 타이머(,, 줄이었을 경우)를 무효화한다 —
  // 안 그러면 그 타이머가 나중에 또 한 번 faceLineIdx를 증가시켜서 뒤에 나온 줄을
  // 조용히 하나 건너뛰게 된다(경비 대사 버튼이 눌러도 반응 없는 것처럼 보였던 원인).
  _faceLineToken++;
  faceLineIdx++;
  if(faceLineIdx>=_activeLines().length&&faceScript._endAfterLines){
    _showFaceEnd();return;
  }
  showFaceLine();
}

function _showFaceEnd(){
  // 선택지를 고른 뒤 후속 대사(result.lines)까지 다 나온 시점 = 이 대면은 끝났다는 뜻.
  // (선택지 자체가 남아있는 경우는 여기로 오지 않고 showFaceLine의 선택지 렌더링으로 감.)
  // 항상 "(경비실로 돌아간다)" 버튼 하나만 뜨고, 그 버튼 클릭 한 번으로 종료된다.
  const ch=document.getElementById('face-choices');
  const txt=document.getElementById('face-dtext');
  const dname=document.getElementById('face-dname');
  const adv=document.getElementById('face-advance');
  facePhase='choice';
  if(adv)adv.style.display='none';
  if(txt)txt.textContent='';
  if(dname)dname.textContent='';
  if(ch)ch.innerHTML='<button class="face-choice" onclick="closeFace()">(경비실로 돌아간다)</button>';
}

function pickFaceChoice(i){
  if(!faceScript||_closingFace)return; // 대면이 닫히는 중의 중복 클릭 무시
  const ch=document.getElementById('face-choices');
  const adv=document.getElementById('face-advance');
  if(ch)ch.innerHTML='';
  if(adv)adv.style.display='none';
  const choices=_activeChoices();
  const results=_activeChoiceResults();
  const result=results?.[i];
  // 결과(choiceResults)가 없는 선택지는 그대로 대면을 종료한다.
  // (예전엔 '돌아간다' 문자열로만 판별해서, 그 외 문구의 결과없는 선택지가 이중 클릭으로 남았었다.
  //  지금은 _showFaceEnd() 자체가 항상 자동 종료라 문구 판별이 필요 없다.)
  if(!result){
    _showFaceEnd();return;
  }

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
  // 방치 선택 — END_2_B 판정에 쓰이는 카운터
  if(result._neglect)_neglectCount += 1;
  // 선택지 결과로 단서 획득 (정상 플레이에서 단서를 얻는 유일한 경로)
  if(result.clues)result.clues.forEach(cid=>{ if(typeof grantClue==='function')grantClue(cid); });
  if(result.unlocks){
    if(result.unlocks.name)unlockResidentInfo(id,{name:true});
    if(result.unlocks.age)unlockResidentInfo(id,{age:true});
  }

  if(result._thenEnding){
    closeFace();
    setTimeout(()=>{
      _endingFromScene = true;      // 플레이어가 실제로 그 씬을 끝까지 본 경우
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

  // '(돌아간다)' 계열 선택지는 여운 지문 없이 곧바로 "(경비실로 돌아간다)" 버튼으로 간다.
  // (돌아간다를 누른다는 것 자체가 이미 대면을 끝내겠다는 의사이므로, 그 뒤에 추가 지문을
  //  더 보여주고 나서야 종료 버튼이 뜨는 구조는 어색하다는 사용자 피드백 반영.)
  const isReturnChoice = typeof choices?.[i]==='string' && choices[i].includes('돌아간다');
  if(!isReturnChoice && result.lines&&result.lines.length>0){
    faceContinuation={lines:result.lines,choices:null,choiceResults:null};
    faceScript._endAfterLines=true;
    faceLineIdx=0;facePhase='narrate';
    showFaceLine();
  } else {
    _showFaceEnd();
  }
}

function closeFace(){
  // closeFace는 fade 연출이 끝나기까지 500~600ms가 걸리는데, 그 사이 facePhase/faceScript가
  // 아직 살아있어서 사용자가 한 번 더 클릭하면 advanceDialogue → _showFaceEnd → closeFace가
  // 다시 실행돼 fade가 중첩되어 두 번 나오는 것처럼 보였다. 진행 중엔 재진입을 막는다.
  if(_closingFace)return;
  _closingFace=true;
  SND.stopVisit();
  // Day3 — 매소련 첫 대면 직후, 3층 계단에서 염지혜와 마주치는 씬으로 이어진다.
  // (3층은 CCTV가 없어 장소 이동 경로가 없다. 301호 방문이 유일한 3층 진입이다.)
  let _chain=null;
  if(currentDay===3 && faceScript && faceScript.resId==='301'
     && DONE_EVENTS.has('EVT_D3_005_DONE') && !DONE_EVENTS.has('EVT_D3_TIKI_002_DONE')
     && typeof FACE_SCRIPTS!=='undefined' && FACE_SCRIPTS['EVT_D3_TIKI_002']){
    _chain='EVT_D3_TIKI_002';
  }
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
    _closingFace=false;
    setTimeout(()=>{
      fd.classList.remove('in');
      checkTriggers();
      if(_chain) setTimeout(()=>{ if(currentDay===3) _openLocScene('101', _chain); }, 500);
    },100);
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
// 대면 화면 상태. 원래 선언 없이 openFace에서 처음 대입되고 있어서,
// 대면을 한 번도 안 연 상태에서 closeFace 등이 불리면 ReferenceError로 터졌다.
let faceScript=null, faceLineIdx=0, facePhase='narrate', faceContinuation=null;
// closeFace() 재진입 방지 플래그. fade 연출(500~600ms) 도중 중복 클릭으로
// closeFace가 두 번 실행되어 화면 전환이 겹쳐 보이는 문제 방지용.
let _closingFace=false;
// 자동진행(,,) 줄이 타이핑 완료 후 예약해두는 "잠시 후 다음 줄로" 타이머가, 그 사이
// 플레이어가 클릭으로 먼저 넘어가버린 뒤에도 그대로 살아있다가 나중에 또 한 번
// faceLineIdx를 증가시켜서 줄을 하나씩 건너뛰게 만드는 버그가 있었다(경비 대사가
// "안 넘어가는" 것처럼 보인 진짜 원인 — 사실은 뒤에서 조용히 한 줄 건너뛰어서 인덱스가
// 어긋난 상태였음). showFaceLine이 줄을 하나 보여줄 때마다 이 토큰을 새로 발급하고,
// 예약된 타이머는 실행 시점에 자기가 예약될 때의 토큰과 지금 토큰이 같은지 확인해서
// 다르면(그 사이 다른 경로로 이미 넘어갔으면) 아무것도 안 하고 조용히 무시한다.
let _faceLineToken=0;

// 복도·쓰레기장 같은 장소 씬은 화면 구조상 호실 슬롯을 빌려 쓴다.
// 그냥 덮어쓰면 그 호실 고유 씬(예: 301호 첫 대면)이 지워져 영영 안 나온다.
// 원래 값을 기억했다가 씬이 끝나면 되돌린다.
function _openLocScene(resId, stateKey){
  const prev = RES_EVENT_STATE[resId];
  const sc = FACE_SCRIPTS[stateKey];
  if(!sc) return;
  // 이 씬이 끝나면 호실 상태를 원래대로 돌려놓도록 onEnd 를 지정한다.
  // openFace 가 스크립트를 복사해 가므로, 복사 직후 원본은 되돌린다.
  const savedOnEnd = sc.onEnd;
  sc.onEnd = (prev===undefined ? null : prev);
  RES_EVENT_STATE[resId]=stateKey;
  if(typeof antHideFace==='function') antHideFace();
  openFace(resId);
  sc.onEnd = savedOnEnd;
}

function gotoLocation(locName){
  closeCC();
  // ※ 2026-09-06 추가 — "그날 그 장소에 실제로 갔다"를 남긴다.
  //   게시판의 익명 글쓴이가 "오늘 쓰레기장 가셨더라고요"처럼 그날 행적을 짚는데,
  //   예전엔 방문 여부와 무관하게 시간만 되면 글이 올라와서, 가보기도 전에 누가
  //   내 행적을 읊는 글이 먼저 떠 있었다. 실제로 다녀온 뒤에만 올라오게 하는 트리거.
  //   ※ 아래 씬 인터셉트들이 return으로 빠져나가므로 반드시 그보다 먼저 세운다
  //     (Day2 쓰레기장 뽀삐 씬이 대표적인 인터셉트다).
  const _visitKey='VISITED_'+locName+'_D'+currentDay;
  if(!DONE_EVENTS.has(_visitKey)){
    setFlag(_visitKey);
    DONE_EVENTS.add(_visitKey);
    setTimeout(()=>{ if(typeof checkTriggers==='function') checkTriggers(); }, 0);
  }
  // E2A Day5 — 1층 복도 이동 시 결판 씬 인터셉트
  if(locName==='1F복도' && currentDay===5 && _devEndingRoute==='END_2_A'){
    if(!DONE_EVENTS.has('EVT_D5_SHOWDOWN_DONE')){
      _openLocScene('101','EVT_D5_SHOWDOWN');
      return;
    } else if(!DONE_EVENTS.has('EVT_D5_PRELUDE_DONE')){
      _openLocScene('101','EVT_D5_SHOWDOWN_PRELUDE');
      return;
    }
  }
  // ── Day1 순찰/복도 씬 인터셉트 ──
  // Day1 보완: 101호 민원 답장(CHAT_101_REPLIED, "복도 담배꽁초도 좀") 이후 1F복도 방문 시 1회
  if(currentDay===1){
    if(locName==='1F복도' && getFlag('CHAT_101_REPLIED')
       && !DONE_EVENTS.has('EVT_D1_HALLWAY_CIGAR_DONE') && FACE_SCRIPTS['EVT_D1_HALLWAY_CIGAR']){
      _openLocScene('101','EVT_D1_HALLWAY_CIGAR');
      return;
    }
  }
  // ── Day2 순찰/복도 씬 인터셉트 ──
  // 노션 Day2 진행순서: ② 뽀삐 발견(쓰레기장) ④ 2F 고재엽 → ⑤ 2F 재진입 티키타카
  //                    ⑥ 1F 명성×염지혜 (담배꽁초 중재 이후)
  if(currentDay===2){
    // 쓰레기장 — Day1 선택으로 분기. CCTV 루트는 직접 발견, 같이찾기 루트는 허탕.
    if(locName==='쓰레기장'){
      if(getFlag('EVT_002_CCTV') && !DONE_EVENTS.has('EVT_D2_001_A_DONE') && FACE_SCRIPTS['EVT_D2_001_A']){
        _openLocScene('201','EVT_D2_001_A');
        return;
      }
      if(getFlag('EVT_002_SEARCH') && !DONE_EVENTS.has('EVT_D2_001_B_WAIT_DONE') && FACE_SCRIPTS['EVT_D2_001_B']){
        _openLocScene('201','EVT_D2_001_B');
        return;
      }
    }
    // 2층 복도 — 첫 진입은 고재엽, 그 다음 진입은 선형이×고재엽
    if(locName==='2F복도'){
      if(!DONE_EVENTS.has('EVT_D2_003_DONE') && FACE_SCRIPTS['EVT_D2_003']){
        _openLocScene('202','EVT_D2_003');
        return;
      }
      if(!DONE_EVENTS.has('EVT_D2_TIKI_002_DONE') && FACE_SCRIPTS['EVT_D2_TIKI_002']){
        _openLocScene('201','EVT_D2_TIKI_002');
        return;
      }
    }
    // 1층 복도 — 담배꽁초 중재를 끝낸 뒤에만
    if(locName==='1F복도' && DONE_EVENTS.has('EVT_D2_004_DONE')
       && !DONE_EVENTS.has('EVT_D2_TIKI_001_DONE') && FACE_SCRIPTS['EVT_D2_TIKI_001']){
      _openLocScene('101','EVT_D2_TIKI_001');
      return;
    }
  }

  // ── Day3 순찰/복도 씬 인터셉트 ──
  if(currentDay===3){
    // 쓰레기장 — 버려진 사진 세 장 (사진 민원을 받은 뒤)
    if(locName==='쓰레기장' && getFlag('CHAT_D3_101_REPLIED')
       && !DONE_EVENTS.has('EVT_D3_002_DONE') && FACE_SCRIPTS['EVT_D3_002_PHOTO']){
      _openLocScene('301','EVT_D3_002_PHOTO');
      return;
    }
    // 2층 복도 — 명성 × 고재엽 (고재엽 심문 이후)
    if(locName==='2F복도' && getFlag('EVT_D3_003_DONE')
       && !DONE_EVENTS.has('EVT_D3_TIKI_001_DONE') && FACE_SCRIPTS['EVT_D3_TIKI_001']){
      _openLocScene('102','EVT_D3_TIKI_001');
      return;
    }
    // 3층 계단 — 염지혜 × 매소련 (매소련 첫 대면 이후). 3층엔 CCTV가 없어
    // 이동 경로가 없으므로 301호 방문 직후 이어지게 openFaceAfter 로 붙인다.
  }

  // ── Day4 복도 티키타카 인터셉트 ──
  if(currentDay===4){
    if(locName==='2F복도' && !DONE_EVENTS.has('EVT_D4_TIKI_001_DONE') && FACE_SCRIPTS['EVT_D4_TIKI_001']){
      _openLocScene('201','EVT_D4_TIKI_001');
      return;
    }
    if(locName==='1F복도' && getFlag('EVT_D4_003_DONE')
       && !DONE_EVENTS.has('EVT_D4_TIKI_002_DONE') && FACE_SCRIPTS['EVT_D4_TIKI_002']){
      _openLocScene('101','EVT_D4_TIKI_002');
      return;
    }
  }

  // ── Day5 순찰 씬 인터셉트 ──
  // 노션 Day5 진행순서: ② 순찰(쓰레기장 케이블 / 2F 벽 조사) … ⑦ 매소련 벽 귀 대기
  // 씬을 정의만 해두면 아무도 호출하지 않아 게임에 안 나온다. 여기서 장소 이동에 물린다.
  if(currentDay===5){
    // 쓰레기장 — 케이블 (CLUE_004)
    if(locName==='쓰레기장' && !DONE_EVENTS.has('EVT_D5_002_DONE') && FACE_SCRIPTS['EVT_D5_002_CABLE']){
      _openLocScene('301','EVT_D5_002_CABLE');
      return;
    }
    // 2층 복도 — 첫 방문은 벽 조사(CLUE_003), 그 다음 방문에 매소련 씬
    if(locName==='2F복도' && !DONE_EVENTS.has('EVT_D5_003_DONE') && FACE_SCRIPTS['EVT_D5_003_WALLCHECK']){
      _openLocScene('301','EVT_D5_003_WALLCHECK');
      return;
    }
    if(locName==='2F복도' && !DONE_EVENTS.has('EVT_D5_007_DONE') && FACE_SCRIPTS['EVT_D5_301_WALL']){
      DONE_EVENTS.add('EVT_D5_007_DONE');
      _openLocScene('301','EVT_D5_301_WALL');
      return;
    }
  }
  const script=LOC_SCRIPTS[locName];
  if(!script){console.warn('[gotoLocation] 없는 장소:',locName);return;}
  locScript={...script,locName};
  // 화면 상태표 — Day별·회차별 나레이션으로 교체 (정의가 없으면 LOC_SCRIPTS 원본 유지)
  const revLines=pickLocLines(locName);
  if(revLines) locScript.lines=revLines;
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

// CCTV 타임스탬프 클릭 — CLUE_001
function ccTimestampClick(){
  if(DONE_EVENTS.has('EVT_D4_001_DONE'))return;
  setFlag('EVT_D4_001_DONE'); DONE_EVENTS.add('EVT_D4_001_DONE');
  if(typeof grantClue==='function') grantClue('CLUE_001');
  log('CCTV 타임스탬프가 03:14:22에서 멈춰 있었다.');
  const gotoBox=document.getElementById('cc-goto-btns');
  if(gotoBox){
    gotoBox.innerHTML='<button class="cc-goto" onclick="closeCC();setTimeout(()=>gotoLocation(\'2F복도\'),300)">▶ 이동하기</button>';
  }
  if(typeof checkTriggers==='function') checkTriggers();
}

function antPick(){
  ANT.hideCtx();
  ANT.picked=true;ANT.deadPersist=false;
  ANT.el.style.display='none';
  window.ANT_PICKED=true;
  setFlag('ANT_PICKED'); DONE_EVENTS.add('ANT_PICKED');
  // 개미를 주웠으면 202호 대면에서 EVT_D4_009 가 열린다 (노션 Day4)
  if(currentDay>=4 && !DONE_EVENTS.has('EVT_D4_009_DONE')) RES_EVENT_STATE['202']='EVT_D4_009_ANT';
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

  // 로비 화면(게임 시작 전)에서도 버튼 호버/클릭음이 나야 하는데,
  // load()는 오프닝이 끝나야 호출됨(브금을 게임 시작 전에 틀지 않기 위해).
  // 그래서 호버·클릭음 2개만 따로 미리 로드해둔다.
  preloadCore(){
    ['탭','클릭'].forEach(k=>{
      if(this._sfx[k])return;
      const a=new Audio('소리/'+k+'.mp3');
      a.preload='auto';
      this._sfx[k]=a;
    });
  },

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
SND.preloadCore();

function setVol(type,v){SND.setVol(type,v);}
function toggleMute(type){SND.mute(type);}

function toggleSettings(){
  const p=document.getElementById('settings-panel');
  if(p)p.classList.toggle('on');
  if(p&&p.classList.contains('on')){
    setTimeout(()=>{
      const close=e=>{if(!p.contains(e.target)&&e.target.id!=='settings-btn'&&e.target.id!=='lobby-btn-set'){p.classList.remove('on');document.removeEventListener('click',close);}};
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
  '퇴사 후 특별한 계획 없이 지내던 중 문 앞에 붙어있는 공고를 보게 됐다.',
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
    log('오프닝 완료. 게임 시작.');
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
      showFirstTimeGuide();
      setTimeout(()=>triggerEventsForDay(1), 5000);
    }, 1000);
  }
}

// ── 최초 조작 안내 팝업 (관리 시스템 화면 최초 진입 시 1회) ──
function showFirstTimeGuide(){
  const ov=document.getElementById('guide-overlay');
  if(ov) ov.classList.add('on');
}
function closeGuide(){
  const ov=document.getElementById('guide-overlay');
  if(ov) ov.classList.remove('on');
}

// ── 로비 시작 화면 ──
// 세이브/로드는 아직 구현 전 — 로비 "이어하기" 버튼은 안내만 띄운다.
let _lobbyToastT=null;
function lobbyComingSoon(){
  const t=document.getElementById('lobby-toast');
  if(!t)return;
  t.textContent='■ 준비 중인 기능입니다';
  t.classList.add('show');
  if(_lobbyToastT)clearTimeout(_lobbyToastT);
  _lobbyToastT=setTimeout(()=>{ t.classList.remove('show'); _lobbyToastT=null; }, 1800);
}

function startGame(){
  const lobby=document.getElementById('lobby');
  const gameScreen=document.getElementById('G');

  // 로비 숨김 (애니메이션)
  lobby.classList.add('hidden');

  // 게임 화면 표시
  setTimeout(()=>{
    if(gameScreen)gameScreen.style.display='';

    // 오프닝 화면 표시 및 초기화
    const opBg=document.getElementById('op-bg');
    const opening=document.getElementById('opening');
    if(opening){
      opening.style.display='flex';
      setTimeout(()=>{
        if(opBg)opBg.classList.add('show');
      }, 600);
      setTimeout(()=>{
        opTypeText(OP_LINES[opIdx++], null);
      }, 1400);
      opening.addEventListener('click', opAdvance);
    }
  }, 400);
}

window.addEventListener('DOMContentLoaded', ()=>{
  // 페이지 로드 시 로비 표시 (기본값)
  const lobby=document.getElementById('lobby');
  const gameScreen=document.getElementById('G');
  if(gameScreen)gameScreen.style.display='none';
  if(lobby)lobby.classList.remove('hidden');
});

// ══════════════════════════════════════════════════════════
// 전시 모드 — 리셋 / 무입력 자동 복귀 / DEV 컨트롤 숨김
// 설계도 v2 / 10절. 전시장 컴퓨터 1대에서 여러 사람이 번갈아 플레이하는 상황 대응.
// ※ EXHIBIT_MODE 는 이 파일 맨 위에 있다. 아래 두 개는 타이밍 값만.
// ══════════════════════════════════════════════════════════
const EXHIBIT_IDLE_MS = 180000;  // 3분 무입력 → 경고 표시  (개발 빌드에선 동작 안 함)
const EXHIBIT_WARN_MS = 20000;   // 경고 후 20초 → 자동 리셋

// 이 게임이 쓰는 localStorage 키 전부. 리셋 시 같이 비운다.
// (안 비우면 이전 방문자의 관리일지 메모와 창 배치가 다음 사람에게 그대로 남는다.)
const EXHIBIT_STORAGE_KEYS = ['vlog', 'villa_widgets_v2'];

function exhClearStorage(){
  EXHIBIT_STORAGE_KEYS.forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
}
function exhReset(){
  exhClearStorage();
  location.reload();
}

// ── 상단 [처음으로] — 오클릭 방지용 2단 확인 ──
let _exhArmT = null;
function exhResetClick(){
  const b = document.getElementById('exh-reset');
  if(!b){ exhReset(); return; }
  if(_exhArmT){ clearTimeout(_exhArmT); _exhArmT=null; exhReset(); return; }
  b.classList.add('armed');
  b.textContent = '한 번 더 = 초기화';
  _exhArmT = setTimeout(()=>{
    _exhArmT = null;
    b.classList.remove('armed');
    b.textContent = '↺ 처음으로';
  }, 3000);
}

// ── 무입력 자동 복귀 ──
let _exhIdleT = null, _exhWarnT = null, _exhCountT = null;

function _exhOpeningVisible(){
  const op = document.getElementById('opening');
  if(!op) return false;
  return op.style.display !== 'none' && op.style.opacity !== '0';
}
function _exhHideWarn(){
  if(_exhWarnT){ clearTimeout(_exhWarnT); _exhWarnT=null; }
  if(_exhCountT){ clearInterval(_exhCountT); _exhCountT=null; }
  const w = document.getElementById('exh-idle');
  if(w) w.classList.remove('on');
}
function _exhShowWarn(){
  const w = document.getElementById('exh-idle');
  const n = document.getElementById('exh-idle-n');
  if(!w){ exhReset(); return; }
  let left = Math.ceil(EXHIBIT_WARN_MS/1000);
  if(n) n.textContent = left;
  w.classList.add('on');
  _exhCountT = setInterval(()=>{
    left--;
    if(n) n.textContent = Math.max(0,left);
  }, 1000);
  _exhWarnT = setTimeout(exhReset, EXHIBIT_WARN_MS);
}
function exhPoke(){
  if(!EXHIBIT_MODE) return;
  _exhHideWarn();
  if(_exhIdleT) clearTimeout(_exhIdleT);
  _exhIdleT = setTimeout(_exhIdleFire, EXHIBIT_IDLE_MS);
}
function _exhIdleFire(){
  // 오프닝 화면이면 이미 처음 상태라 리셋할 게 없다. 그냥 타이머만 다시 건다.
  // (여기서 return 만 하면 타이머가 영영 안 걸려서, 오프닝 넘긴 뒤 자리를 떠도 리셋이 안 된다.)
  if(_exhOpeningVisible()){
    _exhIdleT = setTimeout(_exhIdleFire, EXHIBIT_IDLE_MS);
    return;
  }
  _exhShowWarn();
}

// ── DEV 컨트롤(루트 선택 / 다음날) 표시 토글 ──
let _exhDevShown = false;
function exhToggleDev(force){
  _exhDevShown = (typeof force === 'boolean') ? force : !_exhDevShown;
  const wrap = document.getElementById('day-btn-wrap');
  if(wrap) wrap.style.display = _exhDevShown ? '' : 'none';
  const menu = document.getElementById('ending-menu');
  if(menu && !_exhDevShown) menu.classList.remove('on');
  if(typeof log === 'function') log('DEV 컨트롤 ' + (_exhDevShown ? '표시' : '숨김') + ' (Ctrl+Shift+D)');
}

window.addEventListener('DOMContentLoaded', ()=>{
  const badge = document.getElementById('exh-badge');

  if(!EXHIBIT_MODE){
    // ── 개발 빌드 ── DEV 버튼 그대로 두고, 자동리셋도 끈다.
    _exhDevShown = true;
    if(badge) badge.style.display = 'inline-block';   // 전시 전에 스위치 깜빡한 걸 눈으로 잡으려고
    return;
  }

  // ── 전시 빌드 ──
  if(badge) badge.style.display = 'none';
  exhToggleDev(false);
  ['click','keydown','mousemove','wheel','touchstart'].forEach(ev=>{
    document.addEventListener(ev, exhPoke, {passive:true});
  });
  exhPoke();
});

// Ctrl+Shift+D — 심사·데모용 DEV 컨트롤 토글 (전시 모드에서도 항상 동작)
document.addEventListener('keydown', e=>{
  if(e.ctrlKey && e.shiftKey && (e.key==='D' || e.key==='d')){
    e.preventDefault();
    exhToggleDev();
  }
});
