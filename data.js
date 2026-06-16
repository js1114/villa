// data.js — 게임 데이터
// ※ 이 파일은 villa_site.html 보다 먼저 로드되어야 함

// ═══════════════════════════════════════
// RES
// ═══════════════════════════════════════
const RES={
  '301':{room:'301호',name:'???',realName:'매소련',age:'??세',favor:20,
    freeResp:['ㅁ','(응답 없음)','ㅁㅎㅣㅏㅡㅠㅁㅇㄹㅑ,휴ㅜㅂㄷㅁㅈ머']},
  '202':{room:'202호',name:'???',realName:'고재엽',realAge:'31세',age:'??세',favor:40,
    freeResp:['그렇군요.','흥미롭네요.','나중에 얘기하죠.']},
  '201':{room:'201호',name:'???',realName:'김선형',realAge:'24세',age:'??세',favor:0,
    freeResp:['...','ㅠㅠ...','(응답 없음)']},
  '102':{room:'102호',name:'???',realName:'명성',realAge:'27세',age:'??세',favor:20,
    freeResp:['ㅇㅇ','헐ㅋㅋ','저도 앎']},
  '101':{room:'101호',name:'???',realName:'염지혜',realAge:'27세',age:'??세',favor:0,
    freeResp:['?','ㅗ','어쩌라고']},
};

const FLAGS={};
function setFlag(k,v=true){FLAGS[k]=v;}
function getFlag(k){return FLAGS[k]||false;}

const CLIST=[];
let BOARD_POSTS=[
  {id:1,author:'경비원',tag:'공지',title:'입주민 분리수거 안내',
   preview:'쓰레기장 외 장소에 무단 투기 시 경고 조치합니다.',
   body:'빌라 내 쓰레기는 반드시 지정된 쓰레기장에 분리수거 규정에 따라 버려주시기 바랍니다.\n\n위반 시 경고 후 관리사무소에 보고됩니다.',
   day:1,pin:true},
];
const CLUES_COLLECTED=[];
const RES_STATE={};
Object.keys(RES).forEach(k=>{RES_STATE[k]={met:false,nameKnown:false,ageKnown:false};});
let curR=null,curC=null,currentDay=1;
const chatH={};Object.keys(RES).forEach(k=>{chatH[k]=[];});
const TABS=['complaints','board','cctv','log','clues'];
let activeTab=null;

// ─── RES_EVENT_STATE ───
// 각 캐릭터의 현재 대면 이벤트 키.
// null → DEFAULT_VISIT으로 폴백
const RES_EVENT_STATE={
  '101':'EVT_101_INIT',   // 첫방문 1회 → null
  '102':'EVT_001_INIT',   // EVT_001 전
  '201':null,             // EVT_002_INTRO_DONE 후 EVT_201_INIT로 전환
  '202':'EVT_202_INIT',   // 첫방문 1회 → EVT_202_DONE
  '301':null,             // Day2에 EVT_301_INIT로 전환
};

// ═══════════════════════════════════════
// CHAT_SCRIPTS
// ═══════════════════════════════════════
const CHAT_SCRIPTS={

  '101':[
    // 민원 답장(확인하겠습니다) + followUp 끝난 후 자동 로드
    {id:'CHAT_101_AFTER', requireFlag:'CHAT_101_REPLIED',
     msgs:[],
     taps:[{
       label:'알겠습니다.',
       reply:[{f:'r',t:'...'},{f:'r',t:'됐어요.'}],
       flag:'CHAT_101_DONE',
     }]},
    {id:'CHAT_101_IDLE1', requireFlag:'CHAT_101_DONE', requireDay:2,
     msgs:[],
     taps:[{label:'별일 없으세요?',reply:[{f:'r',t:'...'},{f:'r',t:'왜요.'}]}]},
    // Day6 E2A — 어제 결판 이후 여파
    {id:'CHAT_D6_101_E2A', requireFlag:'EVT_D5_SHOWDOWN_DONE', requireDay:6,
     msgs:[
       {f:'r',t:'경비원님'},
       {f:'r',t:'어제 일 때문에 연락하는 건 아니고요'},
       {f:'r',t:'그냥요'},
       {f:'r',t:'......'},
       {f:'r',t:'별 거 아니에요'},
     ],
     taps:[
       {label:'괜찮으세요?',
        reply:[{f:'r',t:'......네'},{f:'r',t:'경비원님은요'}],
        favor:+2, flag:'CHAT_D6_101_E2A_DONE'},
       {label:'(그냥 넘어간다)',
        reply:[],
        flag:'CHAT_D6_101_E2A_DONE'},
     ]},
  ],

  '102':[
    // 노래방비 준 루트만
    {id:'CHAT_102_FIRST', requireFlag:'EVT_001_B_DONE',
     msgs:[
       {f:'r',t:'형'},
       {f:'r',t:'갔다왔어요 노래방'},
       {f:'r',t:'용돈 ㄱㅅ'},
     ],
     taps:[{
       label:'네.',
       reply:[
         {f:'r',t:'ㅎㅎ 형 좋은 사람이네'},
         {f:'r',t:'오디션 응원해줘요'},
       ],
       favor:+2, flag:'CHAT_102_FIRST_DONE',
     }]},
    {id:'CHAT_102_CHEER', requireFlag:'CHAT_102_FIRST_DONE',
     msgs:[],
     taps:[{
       label:'응원합니다.',
       reply:[
         {f:'r',t:'진심을 담아서요.'},
         {f:'r',t:'성의 존나없네'},
       ],
       favor:0, flag:'CHAT_102_CHEER_DONE',
     }]},
    // 3층 CCTV 없음 — Day2 이후, 노래방 루트만
    {id:'CHAT_102_CCTV', requireFlag:'CHAT_102_CHEER_DONE', requireDay:2,
     msgs:[
       {f:'r',t:'형'},
       {f:'r',t:'근데 3층에 씨씨티비 없어요?'},
       {f:'r',t:'저 3층 무서워서 확인하려고 봤는데 없던데'},
     ],
     taps:[{
       label:'없어요. 예산이 부족해서요.',
       reply:[
         {f:'r',t:'ㅋㅋㅋㅋㅋㅋ'},
         {f:'r',t:'레전드네 진짜'},
         {f:'r',t:'그럼 3층에 뭔 일 나도 모르겠네'},
         {f:'r',t:'하씨발'},
       ],
       flag:'CHAT_102_CCTV_DONE',
     }]},
    // 오디션 Day3 — EVT로 트리거됨
    {id:'CHAT_102_AUDITION_DAY', requireFlag:'CHAT_102_AUDITION_TRIGGER', requireDay:3,
     msgs:[{f:'r',t:'형'},{f:'r',t:'저 오늘 오디션이에요'},{f:'r',t:'긴장돼서 진짜'}],
     taps:[{
       label:'잘 될 거예요.',
       reply:[{f:'r',t:'ㅎㅎ 고마워요'},{f:'r',t:'갔다올게요'}],
       favor:+2, flag:'CHAT_102_AUDITION_SENT',
     }]},
    // 결과 — 오디션 당일 저녁 EVT 트리거
    {id:'CHAT_102_RESULT', requireFlag:'CHAT_102_RESULT_TRIGGER',
     msgs:[{f:'r',t:'형'},{f:'r',t:'저 떨어졌어요 ㅠ'},{f:'r',t:'뭐 원래 이런 거잖아요 ㅋㅋ'}],
     taps:[
       {label:'수고했어요.',
        reply:[{f:'r',t:'ㅎ 고마워요'},{f:'r',t:'다음엔 되겠죠 뭐'}],
        favor:+2, flag:'CHAT_102_RESULT_DONE'},
       {label:'다음엔 잘 될 거예요.',
        reply:[{f:'r',t:'그쵸ㅋㅋ'},{f:'r',t:'형이 응원해줬잖아요'},{f:'r',t:'그거로 됐어요'}],
        favor:+3, flag:'CHAT_102_RESULT_DONE'},
     ]},
    {id:'CHAT_102_IDLE1', requireFlag:'CHAT_102_RESULT_DONE',
     msgs:[],
     taps:[{label:'요즘 어때요?',reply:[{f:'r',t:'그냥요'},{f:'r',t:'다음 오디션 준비 중이에요'}]}]},
    // Day6 E2A — 어제 결판 이후 여파
    {id:'CHAT_D6_102_E2A', requireFlag:'EVT_D5_SHOWDOWN_DONE', requireDay:6,
     msgs:[
       {f:'r',t:'형'},
       {f:'r',t:'어제'},
       {f:'r',t:'저 좀 이상한 말 했죠'},
     ],
     taps:[
       {label:'괜찮아요.',
        reply:[{f:'r',t:'......'},{f:'r',t:'아뇨 형은 그냥 하는 말 알아요'},{f:'r',t:'근데'}],
        favor:+2, flag:'CHAT_D6_102_E2A_DONE'},
       {label:'무슨 말이요.',
        reply:[{f:'r',t:'......그냥요'},{f:'r',t:'됐어요'}],
        favor:0, flag:'CHAT_D6_102_E2A_DONE'},
     ]},
  ],

  '201':[
    // EVT_001(102호 대면) 완료 후 자동 도착
    // *채팅 도착 알림(초록불+소리) → 채팅방 입장 시 메시지 순차 출력 → 마지막 메시지 끝나면 선택지
    {id:'EVT_002_CHAT', requireFlag:'EVT_001_DONE',
     msgs:[
       {f:'r',t:'ㅈ기'},
       {f:'r',t:'저기'},
       {f:'r',t:'저희집 뻐ㅗ삐가'},
       {f:'r',t:'뽀삐가 없러젺어요.'},
       {f:'r',t:'ㅇ오늟 아까 낮에 쓰레기 버히다가'},
       {f:'r',t:'아'},
       {f:'r',t:'어떡'},
     ],
     taps:[{
       label:'뽀삐가 강아지인가요?',
       reply:[
         {f:'r',t:'아'},
         {f:'r',t:'네'},
         {f:'r',t:'그니까제가 오늘 낮레 2시쯤에'},
         {f:'r',t:'쓰레기버리러나가서 삐릏안고있었는데 갑자시'},
         {f:'r',t:'그 3층에'},
         {f:'r',t:'어떤여자분 있거든요 엄청 무서운분인데'},
         {f:'r',t:'네 진짜무서워요 그분'},
         {f:'r',t:'맨날저희ㅡ층내려와서'},
         {f:'r',t:'관찰하시고'},
         {f:'r',t:'무슨이상한 쓰레기봋우'},
         {f:'r',t:'봉투 끌고다니고 모르겠어요 약간 조현병그런거'},
         {f:'r',t:'있으센거강는데 ㅠ'},
         {f:'r',t:'아무츤 뽀삐를 하루종일찾아다녂ㅆ느넫도 못찾았어요'},
         {f:'r',t:'울고있엉ㅅ지금..'},
       ],
       flag:'EVT_002_INTRO_DONE',
     }]},
    {id:'CHAT_201_CHOICE', requireFlag:'EVT_002_INTRO_DONE',
     msgs:[],
     taps:[
       {label:'우선 CCTV 로 계속 확인해드릴게요.',
        lines:[
          {f:'s',t:'우선 CCTV 로 계속 확인해드릴게요.'},
          {f:'r',t:'네'},
          {f:'r',t:'감사합니다...'},
        ],
        favor:+3, flag:'EVT_002_CCTV'},
       {label:'같이 찾아봅시다.',
        lines:[
          {f:'s',t:'같이 찾아봅시다.'},
          {f:'r',t:'아'},
          {f:'r',t:'정말요?'},
          {f:'r',t:'감사합니자ㅠ'},
          {f:'s',t:'우선 쓰레기장부터 뒤져볼까요.'},
          {f:'r',t:'네'},
        ],
        favor:+5, flag:'EVT_002_SEARCH',
        gotoLoc:'쓰레기장'},
     ]},
    {id:'CHAT_201_AFTER_CCTV', requireFlag:'CCTV_쓰레기장_CHECKED',
     msgs:[],
     taps:[{
       label:'지금은 특이한 사항은 없네요 계속 체크해 볼게요.',
       reply:[{f:'r',t:'네 감사해요'}],
       favor:+2, flag:'CHAT_201_SEARCH_PROMISED',
     }]},
    {id:'CHAT_201_AFTER_SEARCH', requireFlag:'EVT_002_SEARCH',
     msgs:[
       {f:'r',t:'죄송해요'},
       {f:'r',t:'제ㅏㄱ'},
       {f:'r',t:'못나가서 죄송합니다'},
     ],
     taps:[{
       label:'왜 안오셨어요? 일 생기셨나요.',
       reply:[{f:'r',t:'...'},{f:'r',t:'네'}],
       favor:+2, flag:'CHAT_201_SEARCH_PROMISED',
     }]},
    // 뽀삐 찾음 — CHAT_201_SEARCH_PROMISED 완료 후 자동 도착 (Day2 EVT로 트리거)
    {id:'CHAT_201_FOUND', requireFlag:'CHAT_201_FOUND_TRIGGER',
     msgs:[
       {f:'r',t:'경비원님'},
       {f:'r',t:'뽀삐 찾았어요'},
       {f:'r',t:'쓰레기장 구석에 있었어요...'},
       {f:'r',t:'감사합니다'},
     ],
     taps:[{
       label:'다행이에요.',
       reply:[{f:'r',t:'...'},{f:'r',t:'네. 정말 감사해요..'}],
       favor:+3, flag:'CHAT_201_FOUND_DONE',
     }]},
    {id:'CHAT_201_IDLE1', requireFlag:'CHAT_201_FOUND_DONE',
     msgs:[],
     taps:[{label:'뽀삐 잘 있어요?',reply:[{f:'r',t:'네...'},{f:'r',t:'잘 있어요'}]}]},
    // Day5 — 선형이 신호 3차 (IGNORED_201_SIGNAL_2 루트)
    {id:'CHAT_201_SIGNAL3', requireFlag:'IGNORED_201_SIGNAL_2', requireDay:5,
     msgs:[
       {f:'r',t:'(삭제된 메시지입니다.)'},
       {f:'r',t:'아무것도 아니에요'},
     ],
     taps:[
       {label:'직접 찾아갈게요.',
        lines:[
          {f:'s',t:'직접 찾아갈게요.'},
        ],
        flag:'SAVED_201', _face:'201'},
       {label:'(넘어간다.)',
        reply:[],
        flag:'ABANDONED_201'},
     ]},
  ],

  '202':[
    {id:'CHAT_202_FIRST', requireFlag:'EVT_202_MET',
     msgs:[{f:'r',t:'경비원님'},{f:'r',t:'오늘도 수고하세요'}],
     taps:[{label:'감사합니다.',reply:[],flag:'CHAT_202_FIRST_DONE'}]},
    {id:'CHAT_202_IDLE1', requireFlag:'CHAT_202_FIRST_DONE',
     msgs:[],
     taps:[{label:'오늘 어디 나가세요?',
            reply:[
              {f:'r',t:'사진 찍으러요.'},
              {f:'r',t:'옥상에 죽은 비둘기가 있더라고요.'},
              {f:'r',t:'좋은 피사체예요.'},
            ]}]},
    {id:'CHAT_202_SUSPICIOUS', requireFlag:'HINT_202_SUSPICIOUS', requireDay:2,
     msgs:[{f:'r',t:'경비원님'},{f:'r',t:'이 빌라'},{f:'r',t:'좀 이상하지 않아요?'}],
     taps:[
       {label:'무슨 뜻이에요?',reply:[{f:'r',t:'...'},{f:'r',t:'벽에서 소리 난 적 있어요?'},{f:'r',t:'기계 소리.'}],favor:+3,flag:'CHAT_202_HINT1'},
       {label:'딱히 모르겠어요.',reply:[{f:'r',t:'그래요.'},{f:'r',t:'...그냥 해본 말이에요.'}],flag:'CHAT_202_HINT1'},
     ]},
    // Day5 — 고재엽 직접 경고 (EVT_D4_005_DONE 이후)
    {id:'CHAT_D5_202_WARNING', requireFlag:'EVT_D4_005_DONE', requireDay:5,
     msgs:[
       {f:'r',t:'경비원님'},
       {f:'r',t:'어제 말씀드린 거 하루 더 생각해봤어요.'},
       {f:'r',t:'이 빌라.'},
       {f:'r',t:'누군가 설계한 것 같아요.'},
       {f:'r',t:'일반 주거용이 아닌 것처럼.'},
       {f:'r',t:'벽 두께. 케이블. 소리 주기.'},
       {f:'r',t:'다 연결되는 것 같거든요.'},
       {f:'r',t:'확신은 없어요. 그냥 저만의 생각이에요.'},
     ],
     taps:[
       {label:'솔직히, 저도 이상하다고 생각해요.',
        reply:[
          {f:'r',t:'그렇군요.'},
          {f:'r',t:'그럼 내일 잠깐 시간 되세요?'},
          {f:'r',t:'드릴 게 있어요.'},
          {f:'r',t:'경비실로 가도 될까요.'},
        ],
        favor:+5, flag:'AGREED_WITH_202'},
       {label:'아직 확신하기 어렵죠.',
        reply:[
          {f:'r',t:'물론이죠.'},
          {f:'r',t:'저도 확신은 없어요.'},
          {f:'r',t:'그냥 조심하세요. 그 말이에요.'},
        ],
        favor:+2, flag:'EVT_D5_005_DONE'},
     ]},
    // Day 6 시연용 핵심 스텝
    {id:'CHAT_D6_202', requireFlag:'AGREED_WITH_202', requireDay:6,
     msgs:[
       {f:'r',t:'경비원님'},
       {f:'r',t:'오늘 시간 괜찮아요?'},
       {f:'r',t:'경비실로 가도 괜찮을지.'},
     ],
     taps:[{
       label:'네. 오세요.',
       reply:[{f:'r',t:'지금 갑니다.'}],
       flag:'D6_202_COMING'
     }]},
  ],

  '301':[
    {id:'CHAT_301_FIRST', requireFlag:'EVT_301_SEEN',
     msgs:[],
     taps:[{label:'안녕하세요. 새로 온 경비원입니다.',reply:[],flag:'CHAT_301_MSG_SENT'}]},
    {id:'CHAT_301_IDLE1', requireFlag:'CHAT_301_BOARD_DONE',
     msgs:[
       {f:'r',t:'경비원님'},
       {f:'r',t:'저요???'},
       {f:'r',t:'나 않했아요'},
     ],
     taps:[{label:'뭘요?',reply:[{f:'r',t:'ㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋㅋ'}],flag:'CHAT_301_FIRST_DONE'}]},
  ],
};

// ═══════════════════════════════════════
// DAY_SEQUENCE
// ═══════════════════════════════════════
const DAY_SEQUENCE={
  1:[
    {id:'EVT_001_COMPLAINT', type:'complaint', resId:'101',
     complaint:{
       id:1, room:'101호', subj:'앞집 소음', time:'Day1 새벽',
       lines:['관리 좀 똑바로 하세요','제 앞집 시끄럽다니까요 사람 잠을 못 자게;','새벽 두 시에 노래한다고요 민원을 몇 번을 넣었는데'],
       replyChoices:[{
         label:'확인하겠습니다.',
         reply:[
           {f:'r',t:'빨리요 ㅈ;ㅣ금당장'},
           {f:'r',t:'그리고 복도 담배꽁초도 좀. 내 거 아니에요'},
           {f:'r',t:'옆집'},
         ],
         followUp:[
           {f:'r',t:'아 그리고요'},
           {f:'r',t:'저 위에 윗집이요'},
           {f:'r',t:'밤마다 쿵쿵 소리 나는데'},
           {f:'r',t:'그것도 좀'},
         ],
         favor:0, flag:'CHAT_101_REPLIED',
       }],
     },
    },
    {id:'EVT_002_PUSH', type:'chat_push', resId:'201',
     trigger:'after:EVT_001_DONE',
     chatStepId:'EVT_002_CHAT',
    },
    {id:'EVT_003_BOARD', type:'board', trigger:'after:EVT_002_INTRO_DONE',
     post:{id:2,author:'???',tag:'',title:'경비원님 반가워요',
           preview:'저도 잘 부탁드려요.',
           body:'경비원님\n\n저도 잘 부탁드려요.\n\n...',
           day:1,pin:false}},
  ],

  2:[
    {id:'EVT_D2_301_INIT', type:'state_change',
     changes:[{resId:'301', newState:'EVT_301_INIT'}]},
    {id:'EVT_D2_PPEOPI_FOUND', type:'flag_set',
     trigger:'after:EVT_D2_301_INIT',
     delay:3000,
     flagToSet:'CHAT_201_FOUND_TRIGGER',
     requireFlag:'CHAT_201_SEARCH_PROMISED',
    },
    {id:'EVT_D2_102_CCTV_PUSH', type:'chat_push', resId:'102',
     trigger:'after:CHAT_102_CHEER_DONE',
     chatStepId:'CHAT_102_CCTV',
    },
    {id:'EVT_D2_COMPLAINT', type:'complaint', resId:'102',
     trigger:'after:EVT_D2_301_INIT',
     delay:8000,
     complaint:{
       id:3, room:'101호', subj:'복도 담배꽁초',time:'Day2',
       lines:['저기요','또 복도에 담배꽁초 있어요','몇 번을 치워도 계속 생겨요 진짜'],
       resId:'102',
       replyChoices:[{
         label:'확인하겠습니다.',
         reply:[{f:'r',t:'빨리요'},{f:'r',t:'102호 그 사람이 확실해요'}],
         favor:0, flag:'EVT_D2_COMPLAINT_REPLIED',
       }],
     },
    },
    {id:'EVT_D2_BOARD', type:'board', trigger:'after:EVT_D2_COMPLAINT_REPLIED',
     post:{id:3,author:'???',tag:'',title:'오늘 쓰레기장 가셨던 거예요',
           preview:'저도 도와드릴 수 있는데.',
           body:'오늘 쓰레기장에 꽤 오래 계시던데요\n뭔 거 찾고 계신 건가요\n다음엔 제가 도와드릴 수 있는데\n\n...',
           day:2,pin:false}},
    {id:'EVT_D2_WALL_COMPLAINT', type:'complaint', resId:'201',
     trigger:'after:EVT_D2_BOARD',
     delay:5000,
     complaint:{
       id:4, room:'201호', subj:'벽 소리',time:'Day2 밤',
       lines:['저기요','민원인데요','밤에 벽에서 소리가 나요','긁는 소리요','무서워서요','동물인가요'],
       resId:null,
     },
    },
  ],

  3:[
    {id:'EVT_D3_AUDITION_TRIGGER', type:'flag_set',
     trigger:null,
     flagToSet:'CHAT_102_AUDITION_TRIGGER',
     requireFlag:'CHAT_102_CHEER_DONE',
    },
    {id:'EVT_D3_PHOTO_COMPLAINT', type:'complaint', resId:'101',
     trigger:'after:EVT_D3_AUDITION_TRIGGER',
     delay:6000,
     complaint:{
       id:5, room:'101호', subj:'쓰레기장 사진',time:'Day3',
       lines:['저기요','쓰레기장에 제 사진이 버려져 있어요','누가 찍어서 버린 거예요?','202호 그 사람 아니에요?'],
       replyChoices:[{
         label:'확인해볼게요.',
         reply:[{f:'r',t:'빨리 좀요'},{f:'r',t:'진짜 소름이야 씨'}],
         favor:0, flag:'EVT_D3_PHOTO_REPLIED',
       }],
     },
    },
    {id:'EVT_D3_RESULT_TRIGGER', type:'flag_set',
     trigger:'after:CHAT_102_AUDITION_SENT',
     delay:10000,
     flagToSet:'CHAT_102_RESULT_TRIGGER',
    },
  ],

  5:[
    // Day5 시작 — 벽 소리 민원 3개 동시 도착
    {id:'EVT_D5_001_COMPLAINT_201', type:'complaint', resId:'201',
     trigger:null, delay:1000,
     complaint:{
       id:7, room:'201호', subj:'벽 소리 (3차)', time:'Day5',
       lines:['저기요','어젯밤에도 소리 났어요','이번엔 엄청 컸어요','무서워서 뽀삐 꼭 안고 있었어요'],
       resId:'201',
       replyChoices:[{
         label:'확인해볼게요.',
         reply:[{f:'r',t:'네...'},{f:'r',t:'빨리 좀요'}],
         favor:+1, flag:'EVT_D5_201_REPLIED',
       }],
     },
    },
    {id:'EVT_D5_001_COMPLAINT_102', type:'complaint', resId:'102',
     trigger:null, delay:2500,
     complaint:{
       id:8, room:'102호', subj:'벽 소리 (3차)', time:'Day5',
       lines:['형','저 이상한 소리 듣는 건 아니죠?','규칙적으로 나는 게 더 무서워요ㅋㅋ','한번 봐줘요'],
       resId:'102',
       replyChoices:[{
         label:'확인해볼게요.',
         reply:[{f:'r',t:'ㅇㅇ 부탁해요'},{f:'r',t:'근데 뭐가 있겠음? ㅋㅋ 없겠지'}],
         favor:+1, flag:'EVT_D5_102_REPLIED',
       }],
     },
    },
    {id:'EVT_D5_001_COMPLAINT_101', type:'complaint', resId:'101',
     trigger:null, delay:4000,
     complaint:{
       id:9, room:'101호', subj:'벽 소리 (3차)', time:'Day5',
       lines:['저기요','이거 집 문제 아니에요?','벽에서 소리 나는데 관리 측에서 확인 좀 해야 하는 거 아니에요','이상해요 진짜'],
       resId:'101',
       replyChoices:[{
         label:'확인하겠습니다.',
         reply:[{f:'r',t:'빨리 좀요'},{f:'r',t:'진짜 기가 막혀서'}],
         favor:0, flag:'EVT_D5_101_REPLIED',
       }],
     },
    },
    // 고재엽 경고 채팅 — E3 루트 + EVT_D4_005_DONE 있을 때만
    {id:'EVT_D5_202_WARNING_PUSH', type:'chat_push', resId:'202',
     trigger:null, delay:6000,
     chatStepId:'CHAT_D5_202_WARNING',
     requireFlag:'EVT_D4_005_DONE',
     requireRoute:'END_3',
    },
    // 게시판 마지막 글
    {id:'EVT_D5_BOARD', type:'board', trigger:null, delay:8000,
     post:{id:6,author:'???',tag:'',title:'경비원님도 알게 될 거예요',
           preview:'알게 될 거예요.',
           body:'사실 저도 처음엔 그냥 빌라인 줄 알았어요\n근데 여기 있다 보면\n뭔가 이상하다는 걸 알게 돼요\n경비원님도 알게 될 거예요\n아마 곧이요',
           day:5, pin:false}},
    // 선형이 신호 3차 — IGNORED_201_SIGNAL_2 있을 때만
    {id:'EVT_D5_201_SIGNAL3', type:'chat_push', resId:'201',
     trigger:'after:EVT_D5_001_COMPLAINT_201',
     delay:5000,
     chatStepId:'CHAT_201_SIGNAL3',
     requireFlag:'IGNORED_201_SIGNAL_2',
    },
  ],

  // ─────────────────────────────────────────
  // DAY 6 - 시연을 위한 매끄러운 진행 (얼굴 강제 전환 적용)
  // ─────────────────────────────────────────
  6:[
    // E2A — 어제 결판 여파. 101/102 채팅 자동 도착
    {id:'EVT_D6_101_E2A_PUSH', type:'chat_push', resId:'101',
     trigger:null, delay:1500,
     chatStepId:'CHAT_D6_101_E2A',
     requireRoute:'END_2_A',
    },
    {id:'EVT_D6_102_E2A_PUSH', type:'chat_push', resId:'102',
     trigger:'after:EVT_D6_101_E2A_PUSH',
     delay:4000,
     chatStepId:'CHAT_D6_102_E2A',
     requireRoute:'END_2_A',
    },
    // E2A — 채팅 이후 1층 복도 결판 후속 씬 자동 오픈
    {id:'EVT_D6_E2A_AFTERMATH', type:'face', resId:'101',
     trigger:'after:EVT_D6_102_E2A_PUSH',
     state:'EVT_D6_AFTERMATH',
     delay:6000,
     requireRoute:'END_2_A',
    },
    // E3 — Day6 시작 → 경비실 대기 씬 → 고재엽 채팅 도착
    {id:'EVT_D6_E3_OPENING', type:'face', resId:'202',
     trigger:null, delay:1000,
     state:'EVT_D6_MORNING',
     requireRoute:'END_3',
    },
    // E3 — 고재엽 채팅 도착 (대기 씬 이후)
    {id:'EVT_D6_202_CHAT', type:'chat_push', resId:'202',
     requireFlag:'AGREED_WITH_202',
     trigger:'after:EVT_D6_E3_OPENING',
     delay:3000,
     chatStepId:'CHAT_D6_202',
    },
    // 채팅에서 "네. 오세요." 응답(D6_202_COMING 플래그) 후 → 경비실 대면 (EVT_D6_001) 강제 오픈
    {id:'EVT_D6_202_VISIT', type:'face', resId:'202',
     trigger:'after:D6_202_COMING',
     state:'EVT_D6_001',
     delay:1500,
    },
    // 대면 완료(D6_MEMO_RECEIVED 플래그) 후 → 폴더 조사 이벤트 강제 오픈
    {id:'EVT_D6_FOLDER_OPEN', type:'face', resId:'202', 
     trigger:'after:D6_MEMO_RECEIVED',
     state:'EVT_D6_FOLDER',
     delay:1500,
    },
    // 폴더 조사 완료(END_3_FOLDER_READ 플래그) 후 → 관찰실 씬 강제 오픈
    {id:'EVT_D6_OBSROOM_OPEN', type:'face', resId:'202',
     trigger:'after:END_3_FOLDER_READ',
     state:'EVT_D6_OBSROOM',
     delay:1500,
    }
  ],
};

const DONE_EVENTS=new Set();

// ═══════════════════════════════════════
// FACE_SCRIPTS
// ═══════════════════════════════════════
const FACE_SCRIPTS={

  'DEFAULT_VISIT_101':{
    room:'101호', loc:'101호 앞',
    lines:['!101x','(똑똑똑),,','(반응이 없다.)'],
    choices:['(돌아간다)'],
    choiceResults:[{favor:0,flags:[],lines:[]}],
  },
  'DEFAULT_VISIT_102':{
    room:'102호', loc:'102호 앞',
    lines:['(시끄러운 노래소리가 들린다.)','(똑똑똑),,','(반응이 없다.)'],
    choices:['(돌아간다)'],
    choiceResults:[{favor:0,flags:[],lines:[]}],
  },
  'DEFAULT_VISIT_201':{
    room:'201호', loc:'201호 앞',
    lines:['(똑똑똑),,','(반응이 없다.)'],
    choices:['(돌아간다)'],
    choiceResults:[{favor:0,flags:[],lines:[]}],
  },
  'DEFAULT_VISIT_202':{
    room:'202호', loc:'202호 앞',
    lines:['(똑똑똑),,','(반응이 없다.)'],
    choices:['(돌아간다)'],
    choiceResults:[{favor:0,flags:[],lines:[]}],
  },
  'DEFAULT_VISIT_301':{
    room:'301호', loc:'301호 앞',
    lines:['(문 너머로 악취가 풍긴다.)','(인기척은 들리지만 반응이 없다.)'],
    choices:['(돌아간다)'],
    choiceResults:[{favor:0,flags:[],lines:[]}],
  },

  'EVT_101_INIT':{
    room:'101호', loc:'101호 앞',
    onEnd:null,
    lines:[
      '(복도 끝에서 담배 냄새가 은은히 넘어온다.),,',
      '(똑똑똑),,',
      '(...),,',
      '!101문열림 !101',
      {speaker:'염지혜',text:'뭐예요.'},
      {speaker:'경비',text:'새로 온 경비입니다. 인사 드리러 왔어요.'},
      '!101문닫힘 !101x',
      '(쾅!)',
      '(문을 닫고 들어가버렸다.)',
    ],
    choices:['(돌아간다)'],
    choiceResults:[{favor:0,flags:[],lines:[]}],
  },
  'EVT_101_REVISIT':{
    requireFlag:'EVT_001_DONE',
    room:'101호', loc:'101호 앞',
    onEnd:null,
    lines:[
      '!101문열림 !101',
      {speaker:'염지혜',text:'...또요.'},
      {speaker:'염지혜',text:'뭐예요.'},
    ],
    choices:['순찰 중이에요. 별 일 없으시죠?'],
    choiceResults:[{favor:0,flags:[],lines:[
      {speaker:'염지혜',text:'... 근데 어쩌라고요?'},
      {speaker:'염지혜',text:'그런 일로 찾아오지 마세요.'},
      '!101문닫힘 !101x',
    ]}],
  },

  'EVT_001_INIT':{
    room:'102호', loc:'102호 앞',
    onEnd:'EVT_001_DONE',
    lines:[
      '(102호 앞에 섰다. 문틈으로 소리가 새어나온다.)',
      '(Smells Like Teen Spirit — 너바나. 따라 부르는 남자 목소리. 성대가 좀 간 것 같다.)',
      '(쾅쾅쾅)',
      '(문을 두드렸다. 반응이 없어 세게 두드렸더니 노래가 멎는다.)',
      {speaker:'명성',text:'누구세요.'},
      {speaker:'경비',text:'경비실입니다.'},
      {speaker:'명성',text:'......'},
      {speaker:'명성',text:'잠시만요.'},
      {speaker:'명성',text:'아 씨.'},
      '!102문열림 !102',
      '(잠시 후 문이 열렸다. 나를 보더니 아 하고 입을 반쯤 벌렸다. 딱히 놀란 것 같지도 않다.)',
      {speaker:'명성',text:'어. 새로 왔다던 경비원?'},
      '(그는 나를 위아래로 훑어봤다.)',
      {speaker:'명성',text:'생각보다 젊네. 왜요.'},
    ],
    choices:['소음 민원이 들어와서요, 노래 부르신다고. 야간엔 자제 부탁드립니다.'],
    choiceResults:[{favor:0,flags:['EVT_001_STARTED'],lines:[
      '(그가 복도 끝쪽을 힐끔 봤다. 101호 방향이다.)',
      {speaker:'명성',text:'쟤가 신고한 거죠?'},
      {speaker:'경비',text:'네?'},
      {speaker:'명성',text:'101호요.'},
      {speaker:'경비',text:'상세 내용은 말씀드리기 어렵네요.'},
      {speaker:'명성',text:'뻔한데 뭐.'},
      {speaker:'경비',text:'두 분 아시는 사이예요?'},
      {speaker:'명성',text:'예. 쟤가 저 존나 싫어하거든요.'},
      {speaker:'경비',text:'그럼 신고자분이 거짓신고를 했다는 말씀인가요?'},
      {speaker:'명성',text:'노래를 하긴 했으.'},
      {speaker:'경비',text:'......'},
      {speaker:'경비',text:'어쨌든 새벽 10시 이후는 소음 금지가 규정입니다.'},
      {speaker:'명성',text:'제가 곧 오디션이라 연습을 하긴 해야 하는데.'},
      {speaker:'경비',text:'연습실 빌려서 하시면 되잖아요.'},
      {speaker:'명성',text:'제가 그지새끼라.'},
      {speaker:'경비',text:'노래방이라도 가세요 그럼.'},
      {speaker:'명성',text:'그것도 돈 들잖아.'},
      {speaker:'경비',text:'......'},
      '(이 짧은 대화를 통해 난 그가 말이 안 통하는 타입이라는 걸 알게 되었다.)',
      {speaker:'경비',text:'곧이 언젠데요?'},
      {speaker:'명성',text:'오디션? 이틀 뒤요. 왜요 응원 오시게요?'},
      {speaker:'경비',text:'아뇨. 소음이 언제 끝날지 알아야 저도 대처를 하니까요.'},
      {speaker:'명성',text:'보러 오세요.'},
    ],branch:'CONT_001'}],
    continuations:{
      'CONT_001':{
        lines:[],
        choices:['(무시한다.)','(노래방 비를 준다.)'],
        choiceResults:[
          {favor:-2,flags:['EVT_001_DONE','HINT_101_102'],lines:[
            {speaker:'경비',text:'아무튼 협조 부탁드립니다.'},
            '!102짜증',
            {speaker:'명성',text:'융통성이 없으시네. 나이도 어려보이는데.'},
            {speaker:'명성',text:'이틀 뒤까지만 참으라 그래요. 쟤 말곤 아무도 민원 안 넣었잖아요.'},
            '(맞는 말이긴 하다. 과거 기록을 봐도 101호 말곤 관련 민원이 없었다.)',
            {speaker:'경비',text:'다같이 사는 공간이니까요.'},
            {speaker:'명성',text:'하아...... 예, 예.'},
            '!102문닫힘 !102x',
          ]},
          {favor:+4,flags:['EVT_001_DONE','EVT_001_B_DONE','HINT_101_102'],lines:[
            '(지갑에서 오만원짜리 한 장을 꺼내 내밀었다.)',
            {speaker:'명성',text:'엥?'},
            {speaker:'경비',text:'노래방 이틀 치. 이거면 충분하시죠.'},
            {speaker:'명성',text:'아뇨?'},
            {speaker:'경비',text:'......'},
            '(난 망설였다. 솔직히 전 직장에서 나온 후 좀 쪼달렸기 때문에 지갑이 얇았다.)',
            '(오만원짜리 한 장을 더 꺼냈다. 그래, 나보다 동생같아 보이니까.)',
            '(그가 손 뻗는 동시에 돈을 내 쪽으로 휙 채어왔다.)',
            {speaker:'경비',text:'집에서 노래 안 부른다고 약속하시면요.'},
            '!102웃음',
            {speaker:'명성',text:'아 진짜 약속 존나 다 걸고 엄마 걸고 약속.'},
            {speaker:'경비',text:'어머님을 왜 걸죠.'},
            {speaker:'명성',text:'엄마 없어서요.'},
            {speaker:'경비',text:'......'},
            {speaker:'명성',text:'안 웃긴데요.'},
            {speaker:'명성',text:'형이라고 불러도 되죠? 몇 살?'},
            {speaker:'경비',text:'스물 여덟입니다.'},
            {speaker:'명성',text:'전 스물 일곱요. 한 살 차이네. 말 놓으세요.'},
            {speaker:'경비',text:'아닙니다. 그럼 전 이만. 업무를 마저 봐야 해서.'},
            {speaker:'명성',text:'좆만한 빌라에 볼 업무가 뭐 있다고. 암튼 감사해요. 수고하세요 빠이.'},
            '(쾅)',
            '!102문닫힘 !102x',
          ]},
        ],
      }
    },
  },
  'EVT_001_DONE':{
    requireFlag:'EVT_001_DONE',
    room:'102호', loc:'102호 앞',
    onEnd:'EVT_001_DONE',
    lines:[
      '!102문열림 !102',
      {speaker:'명성',text:'오 형.'},
      {speaker:'명성',text:'왜요?'},
    ],
    choices:['순찰 중이에요. 별 일 없으시죠?'],
    choiceResults:[{favor:+1,flags:[],lines:[
      '!102웃음',
      {speaker:'명성',text:'네. 저 연습 중이었어서. 형도 수고요.'},
      '!102문닫힘 !102x',
    ]}],
  },

  'EVT_201_INIT':{
    requireFlag:'EVT_002_INTRO_DONE',
    room:'201호', loc:'201호 앞',
    onEnd:null,
    lines:[
      '(201호 앞에 섰다.)',
      '(노크했다. 뭔가 바닥을 끄는 소리가 잠깐 났다.)',
      '!201문열림 !201',
      '(문이 조금 열렸다. 쇠사슬 잠금이 걸린 채. 눈만 보인다. 눈 밑이 좀 퀭하다.)',
      {speaker:'201호',text:'...누구세요...?'},
    ],
    choices:['안녕하세요. 뽀삐 찾는 거 도와드리려고요.'],
    choiceResults:[{favor:+5,flags:['EVT_201_MET'],lines:[
      {speaker:'201호',text:'아... 경비원님...?,,'},
      {speaker:'201호',text:'......'},
      {speaker:'201호',text:'혹시...,,'},
      {speaker:'201호',text:'아 아니에요... 죄송한데 그냥 가주세요.'},
      '(빠르게 문이 닫혔다.)',
      '!201문닫힘 !201x',
    ]}],
  },
  'EVT_201_DONE':{
    requireFlag:'EVT_201_MET',
    room:'201호', loc:'201호 앞',
    onEnd:'EVT_201_DONE',
    lines:[
      '!201문열림 !201',
      {speaker:'201호',text:'......'},
    ],
    choices:['별일 없으세요?'],
    choiceResults:[{favor:+1,flags:[],lines:[
      {speaker:'201호',text:'...네.'},
    ]}],
  },

  'EVT_202_INIT':{
    room:'202호', loc:'202호 앞',
    onEnd:'EVT_202_DONE',
    lines:[
      '(노크하자마자 문이 열렸다. 나가려던 참이었나 보다.)',
      '!202문열림 !202',
      '(카메라를 목에 걸고 있다. 나를 보는 순간 렌즈를 잠깐 들었다가 내렸다.)',
      {speaker:'고재엽',text:'누구시죠?'},
      {speaker:'경비',text:'새로 온 경비원입니다. 인사드리러 왔어요.'},
      {speaker:'고재엽',text:'아, 반가워요. 생각보다 일찍 오셨네요.'},
      {speaker:'경비',text:'네?'},
      {speaker:'고재엽',text:'전 경비원님 관두신지 얼마 안 됐거든요.'},
      {speaker:'경비',text:'언제 나가셨는데요?'},
      {speaker:'고재엽',text:'일주일 전쯤. 경비원이라는 게 이렇게 빨리 구해지는 거였군요?'},
      {speaker:'고재엽',text:'아무튼, 반가워요. 고재엽이라고 합니다.'},
      '(그는 나에게 손을 내밀었다. 난 그 손을 맞잡아 악수했다.)',
      {speaker:'경비',text:'아, 네. 앞으로 잘 부탁드립니다.'},
      {speaker:'고재엽',text:'보다시피 나가던 길이라서요. 이만 실례할게요. 다음에 보면 인사해요.'},
      '!202문닫힘 !202x',
    ],
    choices:['(돌아간다)'],
    choiceResults:[{favor:+5,flags:['EVT_202_MET'],lines:[]}],
  },
  'EVT_202_DONE':{
    requireFlag:'EVT_202_MET',
    room:'202호', loc:'202호 앞',
    onEnd:'EVT_202_DONE',
    lines:[
      '(똑똑똑)',
      '!202문열림 !202',
      {speaker:'고재엽',text:'경비원님.'},
      {speaker:'경비',text:'안녕하세요.'},
      {speaker:'고재엽',text:'무슨 일로?'},
      {speaker:'경비',text:'그냥 순찰 돌고 있습니다. 별 일 없으시죠?'},
      {speaker:'고재엽',text:'그럼요. 굳이 찾아와 주시고 기쁘네. 경비원님도 일 없죠? 뭐 도와줄 거 있어요?'},
    ],
    choices:['빌라에 대해 물어본다.','주민에 대해 물어본다.'],
    choiceResults:[
      {favor:+2,flags:[],lines:[
        {speaker:'경비',text:'제가 전달받은 정보가 거의 없어서요. 빌라에 알아야 할 일이나 불편한 점은 없습니까?'},
        {speaker:'고재엽',text:'알아야 할 것이라... 있죠. 우리 빌라는 미스터리가 좀 많거든요.'},
        {speaker:'경비',text:'미스터리라는 게 어떤?'},
        {speaker:'고재엽',text:'그거야 일 하다보면 알게 되실 거고. 정신 바짝 차리고 다니라는 거예요.'},
        {speaker:'경비',text:'......'},
        {speaker:'고재엽',text:'하하하. 농담. 우리 층 복도 끝에 누수가 살짝 있더라고. 시간 되시면 한 번 보세요.'},
        {speaker:'경비',text:'아, 감사합니다.'},
        '!202문닫힘 !202x',
      ]},
      {favor:+3,flags:['HINT_202_KNOWS_201'],lines:[
        {speaker:'경비',text:'혹시 3층에 사시는 분 아세요?'},
        {speaker:'고재엽',text:'301호 분이요? 누가 민원이라도 넣었나요?'},
        {speaker:'경비',text:'그건 아닌데, 누가 무섭다고 하시더라고요. 저도 301호 분을 아직 못뵈서.'},
        {speaker:'고재엽',text:'하하하. 선형이가 그랬죠?'},
        {speaker:'경비',text:'선형이요?'},
        {speaker:'고재엽',text:'아, 아직 통성명 안 하셨겠구나. 201호 사는 친구.'},
        '(201호라면 강아지 잃어버린 사람?)',
        {speaker:'경비',text:'두 분 아시는 사이신가 봐요.'},
        {speaker:'고재엽',text:'아는 사이는 아니고 제가 일방적으로 친한 척 하는 사이죠.'},
        {speaker:'고재엽',text:'선형이가 숫기가 없잖아요. 수줍음 많고.'},
        '(확실히 그랬지. 찾으러 나오지 않은 것도 부끄러움이 많아서인가? 내가 불편해서?)',
        {speaker:'고재엽',text:'우리 빌라 분들이 좀 독특하죠. 그래도 나쁜 사람들은 아니에요.'},
        {speaker:'경비',text:'말씀 감사합니다.'},
        {speaker:'고재엽',text:'성실하시네. 쉬엄쉬엄해요.'},
        '!202문닫힘 !202x',
      ]},
    ],
  },

  'EVT_301_INIT':{
    requireDay:2,
    room:'301호', loc:'3층 복도',
    onEnd:'EVT_301_DONE',
    lines:[
      '(3층 복도 끝에 누군가 있다. 봉투를 잔뜩 들고 있다.)',
      '(눈이 마주쳤다. 꽤 오래 봤다.)',
      {speaker:'???',text:'...'},
    ],
    choices:['안녕하세요.'],
    choiceResults:[{favor:+3,flags:['EVT_301_SEEN'],lines:[
      {speaker:'???',text:'으하하.'},
      '(봉투들이 복도를 쓸며 끌렸다.)',
    ]}],
  },
  'EVT_301_DONE':{
    requireFlag:'EVT_301_SEEN',
    room:'301호', loc:'301호 앞',
    onEnd:'EVT_301_DONE',
    lines:[
      '(문 너머로 뭔가 끄는 소리가 들린다.)',
      '(멎는다.)',
    ],
    choices:['(돌아간다)'],
    choiceResults:[{favor:0,flags:[],lines:[]}],
  },

  // ══════════════════════════════════════
  // Day6 연속 씬 (시연용)
  // ══════════════════════════════════════

  'EVT_D6_001':{
    requireDay:6,
    requireFlag:'AGREED_WITH_202',
    requireNotFlag:'EVT_D6_001_DONE',
    room:'경비실', loc:'경비실',
    bg:'배경/오프닝.png', // 깨짐 방지용 어두운 배경 재사용
    char:'x',
    onEnd:null,
    lines:[
      '(노크 소리가 났다.)',
      '(경비실에 노크를 하는 사람은 없다. 보통은 채팅을 한다.),,',
      '(고재엽이었다. 카메라가 없다.),,',
      {speaker:'고재엽',text:'들어가도 될까요?'},
      {speaker:'경비',text:'네. 여세요.'},
      '(들어오면서 경비실을 한 번 둘러봤다. 모니터. CCTV 화면. 관리 장부.)',
      {speaker:'고재엽',text:'생각보다 작네요.'},
      {speaker:'경비',text:'처음 오시죠.'},
      {speaker:'고재엽',text:'네. 올 일이 없었으니까요.'},
      '(접힌 종이를 테이블 위에 올려놨다.)',
      {speaker:'고재엽',text:'이거 드리려고요.'},
      {speaker:'경비',text:'뭔데요?'},
      {speaker:'고재엽',text:'제가 기록한 거예요. 한 달치.'},
      {speaker:'고재엽',text:'날짜. 시각. 소리 난 위치. CCTV 끊긴 구간. 케이블.'},
      '(잠깐 멈췄다.)',
      {speaker:'고재엽',text:'전 경비원도 일주일 만에 나갔어요.'},
      {speaker:'고재엽',text:'근데 경비원님은 이렇게 빨리 구해졌잖아요.'},
      {speaker:'고재엽',text:'신기하지 않아요?'},
      '(그 말만 했다. 더 설명하지 않았다.)',
    ],
    choices:['무슨 뜻이에요, 그게.','(그냥 받아든다.)'],
    choiceResults:[
      {favor:+3,flags:['D6_202_HINT_RECEIVED','EVT_D6_001_DONE','D6_MEMO_RECEIVED'],lines:[
        {speaker:'고재엽',text:'모르겠어요. 진짜로.'},
        {speaker:'고재엽',text:'조심하세요. 그거예요.'},
        {speaker:'고재엽',text:'메모 아래 줄 마지막 보세요.'},
        '(나갔다.)',
        '(종이를 펼쳤다. 날짜. 시각. 소리. CCTV. 케이블.)',
        '(맨 아래 줄. 다른 필체로.)',
        '(\"C드라이브. 숨김 폴더.\"),,',
      ]},
      {favor:+1,flags:['EVT_D6_001_DONE','D6_MEMO_RECEIVED'],lines:[
        {speaker:'고재엽',text:'필요하면 쓰세요. 아님 말고요.'},
        '(나갔다.)',
        '(종이를 펼쳤다. 날짜. 시각. 소리. CCTV. 케이블.)',
        '(맨 아래 줄.)',
        '(\"C드라이브. 숨김 폴더.\"),,',
      ]},
    ],
  },

  'EVT_D6_FOLDER':{
    requireDay:6,
    requireFlag:'D6_MEMO_RECEIVED',
    requireNotFlag:'END_3_SEEN',
    room:'경비실', loc:'컴퓨터 앞',
    bg:'배경/오프닝.png', char:'x',
    onEnd:null,
    lines:[
      '(저녁. 경비실.)',
      '(고재엽이 준 메모를 다시 펼쳤다.),,',
      '(날짜. 시각. 벽 소리. CCTV 끊김. 케이블.)',
      '(맨 아래 줄.)',
      '(\"C드라이브. 숨김 폴더.\"),,',
      '(컴퓨터를 켰다. C드라이브. 숨김 항목 표시.)',
      '(기다렸다.),,',
      '(있다.)',
      '(VILLA_OBS.),,',
      '(마우스를 갖다 댔다.)',
    ],
    choices:['열어본다.','오늘은 그냥 넘긴다.'],
    choiceResults:[
      {flags:['D6_FOLDER_FOUND','END_3_FOLDER_READ'],lines:[
        '(비밀번호 입력창이 떴다.)',
        '(여섯 자리.),,',
        '(힌트: CCTV 끊긴 시각 → 03-14 / 벽소리 주기 → 05 / 케이블 → 27)',
        '(031427),,',
        '(깜빡이다가. 열렸다.),,',
        '(폴더가 열렸다. 파일 목록이 나왔다.),,',
        '(주민행동기록_101.txt)',
        '(주민행동기록_202.txt)',
        '(사건기록.txt)',
        '(경비원.txt),,',
        '(마우스가 경비원.txt 위에 있었다.)',
        '(잠깐 멈췄다.),,',
        '(클릭했다.),,',
        '(내 이름.)',
        '(구청 퇴사일. 빌라 지원일. 채용일.)',
        '(관찰 시작일이 채용일이랑 같았다.),,',
        '(비고: \"갈등 중재 성향 우세. 실험 환경 유지 기여도 높음.\"),,',
        '(피관찰자 인지 여부: 미인지.),,',
        '(처음부터였다.)',
        '(채용 첫날부터 기록이 시작됐다.),,',
      ]},
      {flags:[],lines:[
        '(닫았다.),,',
      ]},
    ],
  },

  'EVT_D6_OBSROOM':{
    requireDay:6,
    requireFlag:'END_3_FOLDER_READ',
    requireNotFlag:'END_3_SEEN',
    room:'관찰실', loc:'관찰실',
    bg:'배경/오프닝.png', char:'x',
    onEnd:null,
    lines:[
      '(어두운 방이다.)',
      '(모니터가 여러 개 켜져 있다.),,',
      '(1층 복도. 2층 복도. 쓰레기장. 흡연실. 경비실.),,',
      '(경비실 화면 속에서 누군가 모니터를 보고 있다.)',
      '(나다.),,',
      '(의자가 있다. 비어 있다.)',
      '(방금까지 누가 앉아 있었던 것처럼 살짝 당겨져 있다.),,',
      '(키보드 위에 종이가 한 장 있다.)',
      '(집어들었다.),,',
      '(\"실험 종료.\")',
      '(날짜. 오늘이다.),,',
    ],
    choices:['(계속)'],
    choiceResults:[
      {flags:['END_3_SEEN'],lines:[],_thenEnding:'END_3'},
    ],
  },

  // ── Day5 — 전조 씬: 결판 전 복도 마주침 (결판 완료 후 재방문용)
  'EVT_D5_SHOWDOWN_PRELUDE':{
    requireDay:5,
    room:'1층 복도', loc:'1층 복도',
    bg:'배경/1F복도.png', char:'x',
    onEnd:'EVT_D5_SHOWDOWN_PRELUDE',
    _hideCharPanel:true,
    lines:[
      '(복도 끝에 두 사람이 있다.)',
      '(마주 보고 서 있다. 아무 소리도 안 난다.),,',
      '!102',
      '(명성이 먼저 지나치려 했다.)',
      '!101',
      '(염지혜가 막았다. 직접적으로는 아니고 그냥 서 있어서.)',
      '(나를 봤다.)',
      {speaker:'염지혜',text:'어. 경비원님.'},
      {speaker:'명성',text:'형 왔네.'},
      '(둘이 동시에 말했다. 서로 다른 말로.)',
    ],
    choices:['(염지혜 쪽 간다)','(명성 쪽 간다)','(가운데 선다)'],
    choiceResults:[
      {favor:0, flags:['EVT_D5_PRELUDE_DONE'], lines:[
        '(염지혜는 명성을 한 번 보고 그냥 지나쳤다. 완전한 무시였다.)',
        '!102',
        {speaker:'명성',text:'싸가지 보소.'},
        {speaker:'경비',text:'가봐야 되는 거 아니에요?'},
        {speaker:'명성',text:'아뇨 걍 무시하면 돼요. 저러는 거 한두 번도 아니고.'},
        '!102x',
      ], _favorMap:{'101':+1}},
      {favor:0, flags:['EVT_D5_PRELUDE_DONE'], lines:[
        {speaker:'명성',text:'형 잘 됐다. 나 좀 살려줘.'},
        '(염지혜는 코웃음을 치고 101호 쪽으로 걸어갔다.)',
        '!101x',
        {speaker:'명성',text:'저거 봐요. 저러는 거예요 맨날.'},
        {speaker:'경비',text:'무슨 일인데요.'},
        {speaker:'명성',text:'아 그냥요. 복도에서 마주치기만 해도 저래요.'},
        {speaker:'명성',text:'형은 이상하다고 생각 안 해요? 같은 빌라에 사는데.'},
        '!102x',
      ], _favorMap:{'102':+1}},
      {favor:0, flags:['EVT_D5_PRELUDE_DONE'], lines:[
        '(둘 다 경비를 보다가 각자 가던 길로 갔다.)',
        '!101x !102x',
      ]},
    ],
  },

  // ── Day5 — 결판 씬: 101↔102 밴드 얘기 전체 폭발 (1층 복도 첫 방문)
  'EVT_D5_SHOWDOWN':{
    requireDay:5,
    room:'1층 복도', loc:'1층 복도',
    bg:'배경/1F복도.png', char:'x',
    onEnd:'EVT_D5_SHOWDOWN_PRELUDE',
    _hideCharPanel:true,
    lines:[
      '(복도에서 소리가 났다. 경비실까지 들릴 정도다.),,',
      '!101 !102',
      '(내려갔다.),,',
      '(두 사람이 마주쳐 있다. 아직 몸은 안 붙었는데 공기가 이미 틀렸다.)',
      {speaker:'명성',text:'야.'},
      {speaker:'염지혜',text:'......'},
      {speaker:'명성',text:'들어.'},
      {speaker:'염지혜',text:'할 말 없어.'},
      {speaker:'명성',text:'나는 있거든.'},
      '(염지혜가 돌아서려 했다.)',
      {speaker:'명성',text:'잠깐.'},
      {speaker:'명성',text:'왜 나갔어.'},
      '(멈췄다.)',
      {speaker:'명성',text:'그때. 왜 아무 말도 없이 나갔냐고.'},
      {speaker:'염지혜',text:'......지금 그걸 왜.'},
      {speaker:'명성',text:'알아야지. 몇 년이 지났는데 나는 아직도 이유를 모르잖아.'},
      {speaker:'염지혜',text:'몰라? 진짜로?'},
      {speaker:'명성',text:'응. 진짜로 모르겠어. 그래서 묻는 거야.'},
      {speaker:'염지혜',text:'(코웃음)'},
      {speaker:'명성',text:'웃어? 뭐가 웃겨.'},
      {speaker:'염지혜',text:'기억도 못 하면서. 뻔뻔하다 진짜.'},
      {speaker:'명성',text:'뭘 기억 못 해. 무슨 얘기야.'},
      {speaker:'염지혜',text:'오디션 전날 밤.'},
      {speaker:'명성',text:'......'},
      {speaker:'염지혜',text:'기억 안 나?'},
      {speaker:'명성',text:'오디션 전날이면 우리 같이 연습하고 헤어졌잖아.'},
      {speaker:'염지혜',text:'맞아. 헤어지기 직전에.'},
      {speaker:'염지혜',text:'네가 나한테 뭐라고 했는지.'},
      {speaker:'명성',text:'......뭐라고 했는데.'},
      {speaker:'염지혜',text:'넌 재능이 없다고.'},
      '(멈췄다.)',
      {speaker:'염지혜',text:'솔직히 짐이라고.'},
      {speaker:'염지혜',text:'잘라낼까 생각 중이라고.'},
      {speaker:'명성',text:'......'},
      {speaker:'명성',text:'내가 그런 말을?'},
      {speaker:'염지혜',text:'술 먹고 했지. 그러니까 기억도 못 하지.'},
      {speaker:'명성',text:'나 그때 술 먹은 것도 기억 안 나는데.'},
      {speaker:'염지혜',text:'당연히 기억 못 하지. 걔는 기억을 못 하니까.'},
      {speaker:'명성',text:'야 그게 진짜야? 내가 진짜 그런 말을 했어?'},
      {speaker:'염지혜',text:'그래서 내가 거짓말하는 거야?'},
      {speaker:'명성',text:'아니 그게 아니라 나는 정말로 그 상황이 기억이 안 난다고.'},
      {speaker:'염지혜',text:'기억이 안 나. 기억이 안 나. 그 말이 얼마나 편한 말인 줄 알아?'},
      {speaker:'염지혜',text:'나는 기억해. 하나도 빠짐없이.'},
      '(목소리가 낮아졌다.)',
      {speaker:'염지혜',text:'네가 뭐라고 했는지. 어떤 표정이었는지. 몇 시였는지.'},
      {speaker:'명성',text:'......'},
      {speaker:'염지혜',text:'그날 집에 가서 울었어.'},
      {speaker:'염지혜',text:'네가 한 말 때문에 운 게 아니야.'},
      {speaker:'염지혜',text:'저 사람이랑 계속 하면 나는 못 버티겠다 싶어서 울었어.'},
      {speaker:'명성',text:'그럼 왜 말을 안 했어. 그 자리에서 바로.'},
      {speaker:'염지혜',text:'말을 했어.'},
      {speaker:'명성',text:'......'},
      {speaker:'염지혜',text:'두 달 동안 했어. 싫다고. 힘들다고.'},
      {speaker:'염지혜',text:'근데 넌 들은 척도 안 했잖아.'},
      {speaker:'명성',text:'나는 그런 소리 들은 기억이 없어.'},
      {speaker:'염지혜',text:'(날카롭게) 그러니까. 기억이 없으니까.'},
      {speaker:'명성',text:'야 그게 내 잘못이야? 말을 제대로 했어야지.'},
      {speaker:'염지혜',text:'(웃음)'},
      {speaker:'명성',text:'왜 또 웃어.'},
      {speaker:'염지혜',text:'제대로 말을 해야지.'},
      {speaker:'염지혜',text:'2년을 버텨온 사람한테 할 말이 그거야.'},
      {speaker:'명성',text:'나는 진짜 몰랐어. 그 사실은 진짜야.'},
      {speaker:'염지혜',text:'알아. 몰랐을 거야.'},
      {speaker:'염지혜',text:'그래서 더 열 받아.'},
      '(잠깐 침묵.)',
      {speaker:'명성',text:'미안해.'},
      {speaker:'염지혜',text:'......'},
      {speaker:'명성',text:'그때 내가 한 말. 기억은 못 해도. 그런 말을 했다면. 미안해.'},
      '(염지혜가 명성을 봤다.)',
      {speaker:'염지혜',text:'지금 그 말 하면 다 되는 줄 알아?'},
      {speaker:'명성',text:'다 된다는 게 아니야.'},
      {speaker:'염지혜',text:'그럼 왜.'},
      {speaker:'명성',text:'그냥. 미안하니까.'},
      {speaker:'염지혜',text:'......'},
      '(뭔가 터질 것 같았다.)',
      {speaker:'염지혜',text:'진짜로. 죽여버리고 싶었어.'},
      '(멈췄다.)',
      {speaker:'염지혜',text:'그때도. 지금도.'},
      {speaker:'명성',text:'......'},
      {speaker:'염지혜',text:'같은 빌라에 사는 줄 알았을 때. 진짜 미칠 것 같았어.'},
      {speaker:'염지혜',text:'칼 들고 가서 찔러버릴까 생각했어.'},
      {speaker:'명성',text:'(작게) 야.'},
      {speaker:'염지혜',text:'그 정도야. 알아?'},
      {speaker:'염지혜',text:'근데 못 한 거야. 무서워서가 아니라.'},
      {speaker:'염지혜',text:'걔가 그렇게 당할 인간인지 모르겠어서.'},
      {speaker:'염지혜',text:'아직도 모르겠어.'},
      '(긴 침묵.)',
      {speaker:'염지혜',text:'경비원님 왔네요.'},
      '(나를 봤다. 둘 다.)',
    ],
    choices:['(염지혜 쪽 선다)','(명성 쪽 선다)','(강하게 중재한다)'],
    choiceResults:[
      {favor:0, flags:['FINAL_SIDE_101','EVT_D5_SHOWDOWN_DONE'], lines:[
        {speaker:'경비',text:'명성 씨.'},
        {speaker:'명성',text:'......'},
        {speaker:'경비',text:'복도에서 이러시면 안 돼요.'},
        '(명성이 경비를 봤다. 한 박자 늦게.)',
        {speaker:'명성',text:'......알겠어요.'},
        '(계단 쪽으로 걸어갔다. 빠르지 않게.)',
        '!102x',
        '(염지혜가 경비를 봤다. 아까랑 다른 얼굴이었다.)',
        {speaker:'염지혜',text:'......고마워요.'},
        '!101문닫힘 !101x',
      ], _favorMap:{'101':+5,'102':-5}},
      {favor:0, flags:['FINAL_SIDE_102','EVT_D5_SHOWDOWN_DONE'], lines:[
        {speaker:'경비',text:'101호 분도.'},
        {speaker:'경비',text:'같이 얘기 좀 해주시면 안 될까요.'},
        '(염지혜가 경비를 봤다.)',
        {speaker:'염지혜',text:'제가 왜요.'},
        '(들어갔다. 문이 닫혔다.)',
        '!101문닫힘 !101x',
        {speaker:'명성',text:'......봐요. 저러는 거예요.'},
        '(목소리가 좀 달랐다.)',
        '!102문닫힘 !102x',
      ], _favorMap:{'101':-5,'102':+5}},
      {favor:0, flags:['FINAL_SIDE_NEUTRAL','EVT_D5_SHOWDOWN_DONE'], lines:[
        {speaker:'경비',text:'두 분 다.'},
        {speaker:'경비',text:'일단 들어가세요.'},
        '(둘이 경비를 봤다.)',
        '(명성이 먼저 돌아섰다.)',
        {speaker:'명성',text:'......예.'},
        '!102x',
        '(염지혜도 돌아섰다. 아무 말 없이.)',
        '!101문닫힘 !101x',
        '(복도가 조용해졌다.)',
        '(뭔가 끝난 것 같기도 하고 아닌 것 같기도 했다.)',
      ], _favorMap:{'101':+2,'102':+2}},
    ],
  },

  // ── Day5 — 선형이 신호 3차 대면 (SAVED_201 루트)
  'EVT_D5_201_VISIT':{
    requireFlag:'IGNORED_201_SIGNAL_2',
    room:'201호', loc:'201호 앞',
    onEnd:'EVT_201_DONE',
    lines:[
      '!201문닫힘',
      '(노크했다. 한참 뒤에 문이 열렸다.)',
      '!201문열림 !201',
      '(얼굴이 창백하다. 소매가 내려와 있다.)',
      '(경비를 보고 아무 말도 안 한다.)',
      {speaker:'경비',text:'밥 드셨어요 오늘.'},
      {speaker:'201호',text:'...아침에요.'},
      {speaker:'경비',text:'저녁은요.'},
      {speaker:'201호',text:'...아직.'},
      {speaker:'경비',text:'먹어요.'},
      '(잠깐 있다가 고개를 끄덕였다.)',
      '(문이 닫혔다.)',
      '!201문닫힘 !201x',
    ],
    choices:['(돌아간다)'],
    choiceResults:[{favor:+5, flags:['SAVED_201'], lines:[]}],
  },

  // ── Day5 — 매소련 벽에 귀 대기 씬 (2F복도)
  'EVT_D5_301_WALL':{
    requireDay:5,
    room:'2층 복도', loc:'2층 복도',
    bg:'배경/2F복도.png', char:'x',
    onEnd:null,
    lines:[
      '(계단 꺾이는 부분. 매소련이 벽에 귀를 대고 서 있다.)',
      '(눈을 감고 있다.),,',
      '(발소리를 듣더니 눈을 뜬다.),,',
      {speaker:'매소련',text:'경비원님. 들려요?'},
      {speaker:'경비',text:'뭐가요.'},
      {speaker:'매소련',text:'거기 귀 대봐요. 빨리.'},
    ],
    choices:['(귀를 댄다.)','(그냥 지나친다.)'],
    choiceResults:[
      {favor:+2, flags:['LISTENED_WITH_301'], lines:[
        '(귀를 댔다.)',
        '(들린다. 기계 소리. 5초 간격.)',
        {speaker:'매소련',text:'항상 들려요. 저 처음 왔을 때부터.'},
        {speaker:'매소련',text:'경비원님은요?'},
        {speaker:'경비',text:'...얼마 안 됐어요.'},
        {speaker:'매소련',text:'그렇구나.'},
        '(다시 벽에 귀를 댄다.)',
        '(더 말하지 않는다.)',
      ]},
      {favor:0, flags:[], lines:[]},
    ],
  },

  // ── Day6 E2A — 결판 여파 씬 (1층 복도, 명성 혼자)
  'EVT_D6_AFTERMATH':{
    requireDay:6,
    requireRoute:'END_2_A',
    room:'1층 복도', loc:'1층 복도',
    bg:'배경/1F복도.png', char:'x',
    onEnd:null,
    _hideCharPanel:true,
    lines:[
      '(1층 복도.),,',
      '(계단 맨 아래 칸에 명성이 앉아 있다.)',
      '(기타 케이스를 옆에 세워뒀다.),,',
      '!102',
      '(발소리 듣고 올려봤다.)',
      {speaker:'명성',text:'어. 형.'},
      {speaker:'경비',text:'거기서 뭐 해요.'},
      {speaker:'명성',text:'그냥요. 방에 있기가 좀 그래서.'},
      '(잠깐 침묵.)',
      {speaker:'명성',text:'형.'},
      {speaker:'경비',text:'네.'},
      {speaker:'명성',text:'걔가 진짜로 그런 말 들었을 것 같아요?'},
      {speaker:'경비',text:'......'},
      {speaker:'명성',text:'제가 한 말인데 기억이 안 나는 게 맞는 건지.'},
      {speaker:'명성',text:'술 먹으면 그런 말 할 사람이 나인지.'},
      '(모르겠다는 표정이었다. 진짜로.)',
      {speaker:'명성',text:'형은 어떻게 생각해요.'},
    ],
    choices:['그럴 수도 있어요.','모르겠어요.','(말 없이 옆에 앉는다)'],
    choiceResults:[
      {favor:0, flags:['EVT_D6_AFTERMATH_DONE'], lines:[
        {speaker:'명성',text:'......그렇죠.'},
        {speaker:'명성',text:'그럼 나쁜 새끼네 저.'},
        {speaker:'경비',text:'그건 모르죠.'},
        {speaker:'명성',text:'뭐가 모르냐고요.'},
        {speaker:'경비',text:'기억 못 하는 사람이 나쁜 사람인지 아닌지.'},
        '(명성이 경비를 봤다.)',
        {speaker:'명성',text:'......됐어요. 고마워요.'},
        '(일어섰다. 기타 케이스 들었다.)',
        '!102x',
      ], _favorMap:{'102':+3}},
      {favor:0, flags:['EVT_D6_AFTERMATH_DONE'], lines:[
        {speaker:'명성',text:'......그렇죠.'},
        {speaker:'명성',text:'뭐 됐어요.'},
        '(일어섰다. 기타 케이스 들었다.)',
        '!102x',
      ], _favorMap:{'102':+1}},
      {favor:0, flags:['EVT_D6_AFTERMATH_DONE'], lines:[
        '(앉았다.)',
        '(아무 말 없이 잠깐 앉아 있었다.)',
        {speaker:'명성',text:'......형 되게 이상한 경비원이에요.'},
        {speaker:'명성',text:'근데 좋아요.'},
        '(일어섰다. 기타 케이스 들었다.)',
        '!102x',
      ], _favorMap:{'102':+5}},
    ],
  },

  // ── Day6 E3 — 아침 경비실 대기 씬
  'EVT_D6_MORNING':{
    requireDay:6,
    requireRoute:'END_3',
    _forceOpen:true,
    room:'경비실', loc:'경비실',
    bg:'배경/오프닝.png', char:'x',
    onEnd:null,
    lines:[
      '(아침이다.),,',
      '(어젯밤 게시판 마지막 글이 계속 생각났다.),,',
      '(\"경비원님도 알게 될 거예요.\"),,',
      '(경비실 모니터를 켰다. CCTV 화면. 1층 복도. 2층 복도. 쓰레기장.),,',
      '(조용하다. 항상 조용하다.),,',
      '(고재엽이 오겠다고 했다.)',
      '(뭘 갖고 오는지는 몰랐다.),,',
      '(창밖을 봤다. 빌라가 보인다.)',
      '(불이 켜진 창이 두 개.)',
      '(오늘로 6일째다.),,',
    ],
    choices:['(기다린다)'],
    choiceResults:[
      {favor:0, flags:['EVT_D6_MORNING_DONE'], lines:[]},
    ],
  },

  default:{
    room:'??? 호', loc:'??? 앞',
    lines:['(반응이 없다.)'],
    choices:['(돌아간다)'],
    choiceResults:[{favor:0,lines:[],flags:[]}],
  },
};

// ═══════════════════════════════════════
// LOC_SCRIPTS
// ═══════════════════════════════════════
const LOC_SCRIPTS={
  '쓰레기장':{
    label:'쓰레기장', bg:'배경/쓰레기장.png',
    chars:[],
    lines:['(쓰레기장이다. 분리수거 봉투들이 흐트러져 있다.)','(냄새가 좀 난다.)'],
    choices:['(돌아간다)'], choiceResp:[''],
  },
  '흡연실':{
    label:'흡연실', bg:'배경/흡연실.png',
    chars:[],
    lines:['(흡연구역이다. 재떨이가 가득 차 있다.)','(환기가 전혀 안 되는 것 같다.)'],
    choices:['(그냥 돌아간다)'], choiceResp:[''],
  },
  '1F복도':{
    label:'1층 복도', bg:'배경/1F복도.png',
    chars:[],
    lines:['(1층 복도다.)','(조용하다.)'],
    choices:['(돌아간다)'], choiceResp:[''],
  },
  '2F복도':{
    label:'2층 복도', bg:'배경/2F복도.png',
    chars:[],
    lines:['(2층 복도다.)','(아무도 없다.)'],
    choices:['(돌아간다)'], choiceResp:[''],
  },
};    