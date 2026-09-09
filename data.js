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
  '101':{room:'101호',name:'???',realName:'염지혜',realAge:'27세',age:'??세',favor:10,
    freeResp:['?','ㅗ','어쩌라고']},
};

const FLAGS={};
function setFlag(k,v=true){
  FLAGS[k]=v;
}
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
const TABS=['home','complaints','board','cctv','log','clues'];
let activeTab=null;

// ─── RES_EVENT_STATE ───
// 각 캐릭터의 현재 대면 이벤트 키.
// null → DEFAULT_VISIT으로 폴백
const RES_EVENT_STATE={
  '101':'EVT_101_INIT',   // 첫방문 1회 → EVT_101_INTRO(이름 공개, 1회) → EVT_101_REVISIT(고정)
  '102':'EVT_001_INIT',   // 첫방문 1회 → EVT_001_INTRO(이름 공개, 1회) → EVT_001_DONE(고정)
  '201':null,             // EVT_002_INTRO_DONE 후 EVT_201_INIT로 전환
  '202':'EVT_202_INIT',   // 첫방문 1회 → EVT_202_DONE
  '301':'EVT_301_DAY1_GLIMPSE', // Day1 짧은 등장(1회) → Day2에 EVT_D2_301_INIT가 EVT_D2_005로 강제 전환
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
    // Day3 — 3층 계단에서 매소련을 두고 온 뒤 오는 채팅
    {id:'CHAT_D3_101_AFTER_STAIR', requireFlag:'EVT_D3_TIKI_002_B', requireDay:3,
     msgs:[
       {f:'r',t:'거기 계속 있었어요?'},
       {f:'r',t:'그 사람 이상한 사람이에요'},
       {f:'r',t:'그냥... 조심하세요'},
     ],
     taps:[{
       label:'네. 조심할게요.',
       reply:[{f:'r',t:'네'}],
       favor:+1, flag:'CHAT_D3_101_AFTER_DONE'},
     ]},
  ],

  '102':[
    // 노래방비 준 루트만
    {id:'CHAT_102_FIRST', requireFlag:'EVT_001_B_DONE',
     msgs:[
       {f:'r',t:'경비형'},
       {f:'r',t:'갔다왔어요 노래방'},
       {f:'r',t:'용돈 ㄱㅅ'},
     ],
     taps:[{
       label:'네',
       reply:[
         {f:'r',t:'ㅎㅎ 형 좋은 사람이네'},
         {f:'r',t:'오디션 응원해줘요'},
       ],
       favor:0, flag:'CHAT_102_FIRST_DONE',
     }]},
    // 노션 [CHAT_102] — 응원 선택지는 2단이다. 한 번 응원하면 명성이 되받고,
    // 다시 응원해야 "성의 존나없네"가 나오면서 C_102 +2.
    {id:'CHAT_102_CHEER', requireFlag:'CHAT_102_FIRST_DONE',
     msgs:[],
     taps:[{
       label:'응원합니다',
       reply:[
         {f:'r',t:'진심 담아서'},
       ],
       favor:0, flag:'CHAT_102_CHEER1',
     }]},
    {id:'CHAT_102_CHEER2', requireFlag:'CHAT_102_CHEER1',
     msgs:[],
     taps:[{
       label:'진심으로 응원합니다',
       reply:[
         {f:'r',t:'성의 존나없네'},
       ],
       favor:+2, flag:'CHAT_102_CHEER_DONE',
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
    // (CHAT_102_AUDITION_DAY / CHAT_102_RESULT / CHAT_102_IDLE1 삭제 —
    //  노션 Day2 지시 "기존 '저 떨어졌어요'를 삭제하고 새로 씀". 정본은
    //  Day3 오디션 → Day5 1차 합격 → Day6 최종 합격이라 '떨어졌어요'와 정면충돌했다.
    //  세 스텝 모두 세팅되지 않는 플래그를 물고 있어 실제로 뜬 적도 없다.)
    // Day2 — 오디션 전날. 긴장 → 딴소리 → 진지 → 농담으로 도망 (스텝 3개로 분할)
    {id:'CHAT_D2_002_A', requireFlag:'EVT_001_B_DONE', requireDay:2,
     msgs:[
       {f:'r',t:'형'},
       {f:'r',t:'자요?'},
       {f:'r',t:'안 자죠'},
       {f:'r',t:'아 그 노래방 있잖아요'},
       {f:'r',t:'형이 준 돈으로 간 데'},
       {f:'r',t:'거기 사장님이 저 알아봐요 이제'},
       {f:'r',t:'3일 연속 갔거든요 \u314b\u314b'},
       {f:'r',t:'근데 어제는 그냥 서비스로 30분 더 주더라고요'},
       {f:'r',t:'웃기지 않아요'},
       {f:'r',t:'노래를 잘해서 준 건지 불쌍해서 준 건지 모르겠어요'},
     ],
     taps:[
       {label:'잘해서겠죠.',
        reply:[{f:'r',t:'\u314b\u314b\u314b'},{f:'r',t:'형 그런 말도 할 줄 아네'}],
        favor:+3, flag:'D2_102_TALK1'},
       {label:'둘 다일 수도 있죠.',
        reply:[{f:'r',t:'\u314b\u314b\u314b\u314b\u314b\u314b'},{f:'r',t:'아 씨 웃겨'},{f:'r',t:'형 은근 말 잘하네요'}],
        favor:+5, flag:'D2_102_TALK1'},
       {label:'모르겠네요.',
        reply:[{f:'r',t:'\u3147\u3147'},{f:'r',t:'저도요'}],
        favor:0, flag:'D2_102_TALK1'},
     ]},
    // Day2 — 노래방비를 안 준 루트(EVT_001_A_DONE)의 오디션 전날.
    // *Claude 설계: 예전엔 이 루트에 명성 채팅이 통째로 없었다. 그런데 EVT_D2_002_PUSH가
    // 조건 없이 CHAT_D2_002_A를 강제로 밀어넣어서, 돈을 안 준 플레이어에게도 명성이
    // "형이 준 돈으로 간 데"라고 말했다. 엔진 쪽에서 강제 배달을 막았으므로(chat_push가
    // 스텝 조건을 지키게 수정) 이 루트는 완전한 침묵이 된다 — 그래서 이 루트 전용 스텝을 쓴다.
    // 톤: 고마울 게 없는 사이. 먼저 연락은 하되 용건이 있는 척하고, 결국 오디션 얘기로 샌다.
    // D2_102_TALK1을 세워서 뒤의 CHAT_D2_002_B(오디션 전날, 루트 공용)로 그대로 이어진다.
    {id:'CHAT_D2_002_A_ALT', requireFlag:'EVT_001_A_DONE', requireDay:2,
     msgs:[
       {f:'r',t:'형'},
       {f:'r',t:'아니 경비원님'},
       {f:'r',t:'저 어제 집에서 노래 안 했는데'},
       {f:'r',t:'민원 또 들어왔어요?'},
     ],
     taps:[
       {label:'아뇨. 안 들어왔어요.',
        reply:[
          {f:'r',t:'거봐'},
          {f:'r',t:'ㅋㅋ'},
          {f:'r',t:'그럼 됐어요'},
          {f:'r',t:'아 근데 어디서 연습하냐고는 안 물어보시네'},
        ],
        favor:+2, flag:'D2_102_TALK1'},
       {label:'확인해봤는데 없었어요.',
        reply:[
          {f:'r',t:'확인까지 했어요?'},
          {f:'r',t:'ㅇㅇ'},
          {f:'r',t:'경비 열심히 하시네'},
          {f:'r',t:'저 요즘 계단에서 해요 연습'},
          {f:'r',t:'거긴 민원 안 들어오죠?'},
        ],
        favor:+3, flag:'D2_102_TALK1'},
     ]},
    {id:'CHAT_D2_002_B', requireFlag:'D2_102_TALK1', requireDay:2,
     msgs:[
       {f:'r',t:'근데 형'},
       {f:'r',t:'저 내일이에요'},
       {f:'r',t:'오디션'},
     ],
     taps:[
       {label:'긴장돼요?',
        reply:[
          {f:'r',t:'아뇨'},{f:'r',t:'아니 좀'},{f:'r',t:'아니 많이요'},
          {f:'r',t:'이번이 마지막이라 생각하고 있어서'},
          {f:'sa',t:'마지막이요?'},
          {f:'r',t:'나이가 있잖아요 이 바닥은'},
          {f:'r',t:'스물일곱이면 늦은 거예요 진짜로'},
          {f:'r',t:'어차피 안 될 거 알면서 하는 거긴 한데'},
        ],
        favor:+3, flag:'D2_102_NERVOUS'},
       {label:'잘 될 거예요.',
        reply:[{f:'r',t:'그쵸'},{f:'r',t:'그럴 거예요 아마'},{f:'r',t:'아마'}],
        favor:+2, flag:'D2_102_TALK2'},
       {label:'목 관리 잘 하세요.',
        reply:[
          {f:'r',t:'\u314b\u314b 형 진짜'},
          {f:'r',t:'그것만 신경쓰시네'},
          {f:'r',t:'근데 맞아요 저 목이 좀 그래서'},
          {f:'r',t:'예전에 수술했거든요 성대'},
          {f:'sa',t:'성대요?'},
          {f:'r',t:'결절이요. 뭐 별 거 아니고.'},
          {f:'r',t:'지금은 괜찮아요. 높은 거만 안 지르면.'},
        ],
        favor:+4, flag:'D2_102_THROAT'},
     ]},
    {id:'CHAT_D2_002_C', requireFlag:'EVT_001_B_DONE', requireDay:2,
     msgs:[
       {f:'r',t:'아무튼'},
       {f:'r',t:'형 내일 뭐해요'},
     ],
     taps:[
       {label:'일해요.',
        reply:[{f:'r',t:'아 맞다 경비지'},{f:'r',t:'\u314b\u314b\u314b 미안'},{f:'r',t:'잘게요'},{f:'r',t:'내일 봐요'}],
        favor:+1, flag:'AUDITION_D3', flags:['EVT_D2_002_DONE']},
       {label:'응원할게요.',
        reply:[
          {f:'r',t:'ㅋㅋ 뭘 또 응원까지'},{f:'r',t:'아 근데 진짜 잘돼야 되는데'},
          {f:'r',t:'아 몰라 딴생각하면 더 떨려'},
          {f:'r',t:'잘게요'},{f:'r',t:'내일 봐요'},
        ],
        favor:+5, flag:'D2_102_CHEERED', flags:['EVT_D2_002_DONE','AUDITION_D3']},
     ]},
    // A루트(노래방비 안 준)의 마무리 비트. C가 EVT_001_B_DONE 전용이라 A루트는
    // 오디션 전날 대화가 중간에 끊겨 있었다(EVT_D2_002_DONE/AUDITION_D3도 안 섬).
    // *Claude 설계: 같은 3단 구조를 유지하되, 고마울 게 없는 사이라 마지막까지 툭툭 던진다.
    {id:'CHAT_D2_002_C_ALT', requireFlag:'EVT_001_A_DONE', requireDay:2,
     msgs:[
       {f:'r',t:'아무튼'},
       {f:'r',t:'내일 시끄러우면 미안해요 미리'},
       {f:'r',t:'아침에 나갈 거라'},
     ],
     taps:[
       {label:'조용히만 나가주시면 됩니다.',
        reply:[
          {f:'r',t:'ㅋㅋ 알겠어요'},
          {f:'r',t:'진짜 융통성 없다'},
          {f:'r',t:'잘게요'},
        ],
        favor:+1, flag:'AUDITION_D3', flags:['EVT_D2_002_DONE']},
       {label:'잘 보고 오세요.',
        reply:[
          {f:'r',t:'뭘 잘 봐요'},
          {f:'r',t:'...아 오디션이요'},
          {f:'r',t:'그걸 기억하고 있었네'},
          {f:'r',t:'잘게요'},
        ],
        favor:+4, flag:'D2_102_CHEERED', flags:['EVT_D2_002_DONE','AUDITION_D3']},
     ]},
    // Day3 — 사진 사건에 대한 명성의 반응
    {id:'CHAT_D3_004_102', requireDay:3,
     msgs:[
       {f:'r',t:'형 근데 202호 아저씨 아닌가요'},
       {f:'r',t:'걔 카메라 맨날 들고 다니잖아요'},
       {f:'r',t:'딱 봐도 걔인데'},
     ],
     taps:[
       {label:'아직 단정 짓기 어려워요.',
        reply:[{f:'r',t:'에이 뻔하잖아요'},{f:'r',t:'뭐 알겠어요'}],
        favor:+1, flag:'NEUTRAL_PHOTO', _favorMap:{'202':+1}},
       {label:'저도 좀 이상하다고 생각해요.',
        reply:[{f:'r',t:'그죠?? 형도 그렇죠'},{f:'r',t:'\u3363\u3145 이상한 사람이에요 그 사람'}],
        favor:+3, flag:'SIDE_AGAINST_202', _favorMap:{'202':-2}},
     ]},
    // Day3 — 밴드 관계 노출 (채팅 루트). BAND_REVEALED 가 Day4 밴드 진실의 선행조건.
    {id:'CHAT_D3_006_BAND', requireFlag:'HINT_101_102', requireDay:3,
     msgs:[
       {f:'r',t:'근데 형 101호 지혜가 뭐라고 했어요?'},
     ],
     taps:[{
       label:'아는 사이예요?',
       reply:[
         {f:'r',t:'어 아 아뇨'},
         {f:'r',t:'그냥요'},
         {f:'sa',t:'이름 아시는 것 같던데요.'},
         {f:'r',t:'...옛날에 잠깐.'},
         {f:'r',t:'됐어요 신경 쓰지 마세요'},
       ],
       favor:0, flag:'BAND_REVEALED'},
     ]},
    // Day3 — 오디션 당일. 결과는 다음 주(AUDITION_RESULT_PENDING → Day4 대기 채팅으로)
    {id:'CHAT_D3_010_AUDITION', requireDay:3,
     msgs:[
       {f:'r',t:'형 저 나가요'},
       {f:'r',t:'지금 준비하고 있어요'},
       {f:'r',t:'갔다올게요'},
       {f:'r',t:'다녀왔어요'},
       {f:'r',t:'그랭저랭이에요 뭐'},
       {f:'r',t:'결과는 다음 주에 나온대요'},
     ],
     taps:[
       {label:'어땦어요?',
        reply:[
          {f:'r',t:'몰라요 진짜'},
          {f:'r',t:'근데 후회는 없어요'},
          {f:'r',t:'오랜만에 후련하네요'},
        ],
        favor:+2, flag:'AUDITION_RESULT_PENDING'},
       {label:'고생했어요.',
        reply:[
          {f:'r',t:'\u314e\u314e 감사요'},
          {f:'r',t:'형이 그런 말 해주니까 이상하게 뮉클하네'},
          {f:'r',t:'아 오글거려 이거 취소'},
        ],
        favor:+4, flag:'AUDITION_RESULT_PENDING'},
     ]},
    // Day4 — 오디션 결과 대기. 명성이 처음으로 진짜 자기 얘기를 하는 자리.
    {id:'CHAT_D4_000_WAIT', requireDay:4,
     msgs:[
       {f:'r',t:'형'},
       {f:'r',t:'결과 언제 나온다 그랬죠'},
       {f:'r',t:'다음주랬나'},
       {f:'r',t:'아 몰라요 신경 안 쓸래요'},
       {f:'r',t:'근데 있잖아요'},
       {f:'r',t:'어제 대기실에서 완전 웃긴 애 봤거든요'},
       {f:'r',t:'기타 줄을 대기실에서 갈고 있는 거예요'},
       {f:'r',t:'아니 그걸 왜 지금 하냐고'},
       {f:'r',t:'저는 그런 애 아니거든요? 참고로'},
       {f:'r',t:'저는 하루 전날 다 끝내놔요'},
     ],
     taps:[{
       label:'준비를 잘 하시나 봐요.',
       reply:[
         {f:'r',t:'\u314b\u314b 그런 편이죠'},
         {f:'r',t:'사실 어제 새벽까지 목 풀었어요'},
         {f:'r',t:'근데 그거 형한테 말한 적 없죠'},
         {f:'r',t:'방금 처음 말한 듯'},
         {f:'r',t:'아무튼 순서 됐는데'},
         {f:'r',t:'손이 좀 떨리더라고요 진짜로'},
         {f:'r',t:'근데 부른 순간 안 떨렸어요 신기하게'},
         {f:'r',t:'노래할 때만 그래요 원래'},
         {f:'sa',t:'그런 얘기 처음 듣네요.'},
         {f:'r',t:'그쵸 저도 처음 하는 얘기예요'},
         {f:'r',t:'이상하게 형한테는 이런 말이 나오네'},
       ],
       favor:+2, flag:'EVT_D4_000_TALKED'},
     ]},
    {id:'CHAT_D4_000_WAIT2', requireFlag:'EVT_D4_000_TALKED', requireDay:4,
     msgs:[],
     taps:[
       {label:'왜요?',
        reply:[
          {f:'r',t:'몰라요'},
          {f:'r',t:'형은 아무 반응 안 할 것 같아서? \u314b\u314b'},
          {f:'r',t:'칭찬도 안 하고 걱정도 안 할 거 같고'},
          {f:'r',t:'그게 편해요'},
          {f:'r',t:'아무튼 결과는 다음 주래요'},
          {f:'r',t:'신경 안 쓸 거예요 저는'},
        ],
        favor:+3, flag:'EVT_D4_000_DONE'},
       {label:'잘 하셨을 거예요.',
        reply:[
          {f:'r',t:'아 왜 자꾸 그런 말 해요'},
          {f:'r',t:'그런 말 하지 말라니까'},
          {f:'r',t:'아무튼 결과는 다음 주래요'},
          {f:'r',t:'신경 안 쓸 거예요 저는'},
        ],
        favor:+4, flag:'EVT_D4_000_DONE'},
     ]},
    // Day5 — 오디션 1차 합격 (모든 루트 공통). 같은 날 저녁 결판과 대비되는 배치.
    {id:'CHAT_D5_102_AUDITION', requireDay:5,
     msgs:[
       {f:'r',t:'형형형형'},
       {f:'r',t:'저 붙었어요'},
       {f:'r',t:'1차요 1차'},
       {f:'r',t:'아 미쳤다 진짜'},
       {f:'r',t:'손이 아직도 떨려요 보세요'},
       {f:'r',t:'아니 근데 이거 웃긴 게'},
       {f:'r',t:'결과 문자 왔을 때 저 화장실이었거든요'},
       {f:'r',t:'그것도 하필 응가 중이었는데'},
       {f:'r',t:'그 상태로 소리질러서 옆집 놀랐을 듯ㅋㅋㅋ'},
     ],
     taps:[
       {label:'축하해요.',
        reply:[
          {f:'r',t:'ㅎㅎ 감사해요'},
          {f:'r',t:'형한테 젤 먼저 알리는 거예요 사실'},
          {f:'r',t:'아 이거 말하면 오글거리니까 취소'},
        ],
        favor:+3, flag:'EVT_D5_004_DONE'},
       {label:'2차는 언제예요?',
        reply:[
          {f:'r',t:'다음 주요'},
          {f:'r',t:'이번엔 진짜 목 조심해야지'},
          {f:'r',t:'형 나 그날 목소리 안 나오면 죽여주세요 진짜'},
          {f:'r',t:'아니 죽이지 마시고 그냥 응원만'},
        ],
        favor:+4, flag:'EVT_D5_004_DONE'},
     ]},
    // Day6 아침 — 오디션 최종 합격 통보. Day5 1차 합격(AUDITION_ROUND1_PASSED)을 본 경우에만.
    // 노션은 E2A 루트 기준으로 적혀 있지만, 자유 플레이에서도 1차를 봤으면 최종도 와야 자연스러워
    // 루트 잠금 없이 플래그 조건으로만 건다.
    {id:'CHAT_D6_102_AUDITION_FINAL', requireFlag:'AUDITION_ROUND1_PASSED', requireDay:6,
     msgs:[
       {f:'r',t:'형형형형형형'},
       {f:'r',t:'저 최종 합격이요'},
       {f:'r',t:'최종이요 진짜 최종'},
       {f:'r',t:'아 미쳤다 진짜 미쳤다'},
       {f:'r',t:'이거 실화예요?'},
       {f:'r',t:'저 오늘 하루종일 이 기분일 것 같아요'},
       {f:'r',t:'형한테 젤 먼저 말하는 거예요 진짜로'},
     ],
     taps:[
       {label:'축하해요, 정말로.',
        reply:[
          {f:'r',t:'ㅎㅎㅎ 감사해요 진짜'},
          {f:'r',t:'아 오늘 뭔가 다 잘될 것 같아요'},
        ],
        favor:+3, flag:'EVT_D6_AUDITION_FINAL_DONE'},
       {label:'고생 많았어요.',
        reply:[
          {f:'r',t:'...'},
          {f:'r',t:'형 그런 말 하면 저 진짜 눈물 날 것 같은데'},
          {f:'r',t:'아 취소 취소 웃긴 얘기나 해요'},
        ],
        favor:+4, flag:'EVT_D6_AUDITION_FINAL_DONE'},
     ]},
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
         {f:'sa',t:'자세히 말씀해보세요'},
         {f:'r',t:'그니까제가 오늘 낮레 2시쯤에'},
         {f:'r',t:'쓰레기버리러나가서 삐릏안고있었는데 갑자시'},
         {f:'r',t:'그 3층에'},
         {f:'r',t:'어떤여자분 있거든요 엄청 무서운분인데'},
         {f:'sa',t:'3층에 사시는 분이요?'},
         {f:'r',t:'네 진짜무서워요 그분'},
         {f:'sa',t:'왜요?'},
         {f:'r',t:'맨날저희ㅡ층내려와서'},
         {f:'r',t:'관찰하시고'},
         {f:'r',t:'무슨이상한 쓰레기봋우'},
         {f:'r',t:'봉투 끌고다니고 모르겠어요 약간 조현병그런거'},
         {f:'r',t:'있으센거강는데 ㅠ'},
         {f:'sa',t:'그렇군요'},
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
          {f:'sa',t:'우선 쓰레기장부터 뒤져볼까요.'},
          {f:'r',t:'네'},
        ],
        favor:+6, flag:'EVT_002_SEARCH',
        gotoLoc:'쓰레기장'},
     ]},
    {id:'CHAT_201_AFTER_CCTV', requireFlag:'CCTV_쓰레기장_CHECKED',
     msgs:[],
     taps:[{
       label:'지금은 봉투가 터져있다거나 하는 특이한 사항은 없네요 계속 체크해 볼게요',
       reply:[{f:'r',t:'네 감사해요'}],
       favor:+3, flag:'CHAT_201_SEARCH_PROMISED',
     }]},
    // Day2 분기 B — 쓰레기장에서 기다렸는데 선형이가 안 나왔다.
    // 이유는 끝까지 설명하지 않는다. (노션 EVT_D2_001 분기 B)
    {id:'CHAT_201_AFTER_SEARCH', requireFlag:'EVT_D2_001_B_WAIT_DONE',
     msgs:[
       {f:'r',t:'죄송해요'},
       {f:'r',t:'못나갔어요'},
       {f:'r',t:'죄,죄송합니다'},
       {f:'sa',t:'왜 안 오셨어요?'},
       {f:'r',t:'...'},
     ],
     taps:[
       {label:'괜찮아요. 혹시 뽀삐는요?',
        reply:[{f:'r',t:'아직요'},{f:'r',t:'..'},{f:'r',t:'죄송해요'}],
        favor:+2, flag:'CHAT_201_SEARCH_PROMISED'},
       {label:'연락하면 나오셔야죠.',
        reply:[{f:'r',t:'죄송합니다'},{f:'r',t:'..'},{f:'r',t:'진짜 죄송합니다'}],
        favor:-2, flag:'CHAT_201_SEARCH_PROMISED'},
       {label:'(아무 말도 안 한다.)',
        reply:[],
        favor:0, flag:'CHAT_201_SEARCH_PROMISED'},
     ]},
    // 뽀삐 찾음 — CHAT_201_SEARCH_PROMISED 완료 후 자동 도착 (Day2 EVT로 트리거)
    {id:'CHAT_201_FOUND', requireFlag:'CHAT_201_FOUND_TRIGGER',
     msgs:[
       {f:'r',t:'경비원님'},
       {f:'r',t:'뽀삐 찾았어요'},
       {f:'r',t:'쓰레기장 구석에 있었어요'},
       {f:'r',t:'제가 늦게 나가서'},
       {f:'r',t:'근데 있었어요'},
     ],
     taps:[{
       label:'다행이에요.',
       // ★ 목줄 떡밥 — Day4 회수. 분기 A는 나레이션 한 줄로 심는다.
       reply:[{f:'r',t:'...'},{f:'r',t:'네 감사해요'},
              {f:'r',t:'근데 목줄이 없어졌어요'},{f:'r',t:'뭐 그건 나중에 사면 되고'}],
       favor:+4, flag:'CHAT_201_FOUND_DONE', flags:['EVT_D2_001_DONE'],
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
    // Day2 — 뽀삐를 찾아준 뒤 인계 (CCTV 루트에서 쓰레기장 씬 이후)
    {id:'CHAT_D2_001_HANDOVER', requireFlag:'D2_POPPY_FOUND', requireDay:2,
     msgs:[
       {f:'sa',t:'뽀삐 찾았어요. 쓰레기장에 있었어요.'},
       {f:'r',t:'아'},
       {f:'r',t:'진짜요'},
       {f:'r',t:'.....'},
       {f:'r',t:'감사해요'},
     ],
     taps:[
       {label:'데리러 오실래요?',
        reply:[
          {f:'r',t:'아'},{f:'r',t:'지금요?'},{f:'r',t:'...'},{f:'r',t:'네'},
        ],
        favor:+5, flag:'CHAT_201_FOUND_DONE', flags:['EVT_D2_001_DONE']},
       {label:'제가 데려다 드릴게요.',
        lines:[{f:'s',t:'제가 데려다 드릴게요.'},
               {f:'r',t:'아'},{f:'r',t:'아니에요 제가'},{f:'r',t:'아'},{f:'r',t:'...네'},{f:'r',t:'감사합니다'}],
        favor:+7, flag:'D2_201_DOOR', flags:['EVT_D2_001_DONE','CHAT_201_FOUND_DONE'], _face:'201'},
     ]},
    // Day3 — 사진 사건에 대한 선형이 반응
    {id:'CHAT_D3_004_201', requireDay:3,
     msgs:[
       {f:'r',t:'저기요'},
       {f:'r',t:'사진이요'},
       {f:'r',t:'저도 있었다고요?'},
       {f:'r',t:'무서운데요'},
     ],
     taps:[{
       label:'지금 조사 중이에요.',
       reply:[{f:'r',t:'네...'},{f:'r',t:'빨리 해주세요 무서워요'}],
       favor:+1, flag:'EVT_D3_004_DONE'},
     ]},
    // Day3 — 선형이 신호 1차. 호감도가 낮을 때만 온다(END_2_C 복선의 첫 신호).
    {id:'CHAT_D3_009_SIGNAL1', requireDay:3,
     _requireFavorMax:{id:'201', max:10},
     msgs:[
       {f:'r',t:'아 아무것도 아니에요'},
       {f:'r',t:'그냥요'},
       {f:'r',t:'손이 좀 어'},
       {f:'r',t:'아뇨 됐어요'},
     ],
     taps:[
       {label:'무슨 일 있어요?',
        reply:[
          {f:'r',t:'아니에요 아니에요'},
          {f:'r',t:'그냥 긁혔어요'},
          {f:'r',t:'감사해요'},
        ],
        favor:+3, flag:'NOTICED_201_SIGNAL_1'},
       {label:'(넘어간다)',
        reply:[],
        favor:0, flag:'IGNORED_201_SIGNAL_1'},
     ]},
    // Day4 — 목줄 회수. 뽀삐 얘기가 나오면 문장이 길어지는 스위치.
    {id:'CHAT_D4_007_LEASH', requireDay:4,
     msgs:[
       {f:'r',t:'저기요'},
       {f:'r',t:'별건 아닌데'},
       {f:'r',t:'뽀삐 목줄이 없어졌어요'},
       {f:'r',t:'찾을 때 빠졌나봐요'},
       {f:'r',t:'뭐 그건 나중에 사면 되고'},
       {f:'r',t:'근데 뽀삐가 자꾸 그쪽으로 가서'},
       {f:'r',t:'목줄 있던 자리요'},
       {f:'r',t:'계속 냄새 맡고 있어요'},
       {f:'r',t:'이상하죠'},
       {f:'r',t:'그냥 말씀드리는 거예요'},
     ],
     taps:[
       {label:'새로 하나 사드릴까요?',
        reply:[
          {f:'r',t:'아'},
          {f:'r',t:'아니에요 제가 살게요'},
          {f:'r',t:'마음만요 감사해요'},
          {f:'r',t:'이것 좀 보세요 계속 이래요\u314b'},
        ],
        favor:+4, flag:'EVT_D4_007_DONE'},
       {label:'혹시 3층 매소련 씨 봉투 속에서 못 보셨어요?',
        reply:[
          {f:'r',t:'네?'},
          {f:'r',t:'...거기까진 모르겠어요'},
          {f:'r',t:'설마요'},
          {f:'r',t:'근데 왜 그렇게 생각하세요?'},
        ],
        favor:+2, flag:'LEASH_SUSPECT_301'},
       {label:'(그냥 넘어간다)',
        reply:[{f:'r',t:'네...'}],
        favor:0, flag:'EVT_D4_007_DONE'},
     ]},
    // Day4 — 선형이 신호 2차. 1차를 무시한 루트에서만.
    {id:'CHAT_D4_008_SIGNAL2', requireFlag:'IGNORED_201_SIGNAL_1', requireDay:4,
     msgs:[
       {f:'r',t:'경비원님'},
       {f:'r',t:'저 요즘 좀 그래요'},
       {f:'r',t:'아 아니에요 별거 아니에요'},
       {f:'r',t:'뽀삐가 잘 안먹어서 그런가봐요'},
       {f:'r',t:'저 때문인가'},
       {f:'r',t:'아니 그냥요'},
     ],
     taps:[
       {label:'직접 가볼게요.',
        lines:[{f:'s',t:'직접 가볼게요.'}],
        favor:+5, flag:'NOTICED_201_SIGNAL_2', _face:'201'},
       {label:'(넘어간다)',
        reply:[],
        favor:0, flag:'IGNORED_201_SIGNAL_2'},
     ]},
    // Day6 아침 — 뽀삐가 경비실 쪽으로 가려 함 (E1/E3 루트, SAVED_201)
    {id:'CHAT_D6_201_MORNING', requireFlag:'SAVED_201', requireDay:6,
     msgs:[
       {f:'r',t:'안녕하세요'},
       {f:'r',t:'뽀삐가요'},
       {f:'r',t:'아침에 경비실 쪽으로 계속 가려고 해요'},
       {f:'r',t:'꼬리 흔들면서'},
       {f:'r',t:'ㅎㅎ...'},
     ],
     taps:[
       {label:'데려와요.',
        reply:[
          {f:'r',t:'아'},
          {f:'r',t:'진짜요?'},
          {f:'r',t:'잠깐만요'},
          {f:'r',t:'뽀삐 데리고 갈게요'},
        ],
        favor:+2, flag:'CHAT_D6_201_MORNING_DONE'},
       {label:'나중에 봐요.',
        reply:[
          {f:'r',t:'아 넵'},
          {f:'r',t:'ㅎㅎ'},
        ],
        favor:0, flag:'CHAT_D6_201_MORNING_DONE'},
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
    // HINT_202_SUSPICIOUS 는 어디서도 세팅되지 않던 유령 플래그였다.
    // Day2 EVT_D2_003 의 '뭐 하고 계셨어요?'(HINT_202_WALL)에 연결한다.
    {id:'CHAT_202_SUSPICIOUS', requireFlag:'HINT_202_WALL', requireDay:3,
     msgs:[{f:'r',t:'경비원님'},{f:'r',t:'이 빌라'},{f:'r',t:'좀 이상하지 않아요?'}],
     taps:[
       {label:'무슨 뜻이에요?',reply:[{f:'r',t:'...'},{f:'r',t:'벽에서 소리 난 적 있어요?'},{f:'r',t:'기계 소리.'}],favor:+3,flag:'CHAT_202_HINT1'},
       {label:'딱히 모르겠어요.',reply:[{f:'r',t:'그래요.'},{f:'r',t:'...그냥 해본 말이에요.'}],flag:'CHAT_202_HINT1'},
     ]},
    // Day5 — 고재엽 직접 경고 (EVT_D4_005_DONE 이후)
    {id:'CHAT_D5_202_WARNING', requireFlag:'EVT_D4_004_DONE', requireDay:5,
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
    // Day4 — 고재엽이 먼저 연락. EVT_D4_003_TALKED 가 EVT_D4_004(CLUE_002)의 선행조건.
    {id:'CHAT_D4_003', requireDay:4,
     msgs:[
       {f:'r',t:'경비원님.'},
       {f:'r',t:'지금 시간 괜찮으세요.'},
     ],
     taps:[
       {label:'네, 말씀하세요.',
        reply:[
          {f:'r',t:'어제 얘기 이어서 드리고 싶은 게 있어요.'},
          {f:'r',t:'벽에서 소리 나는 거 저도 들었어요.'},
          {f:'r',t:'처음부터요. 입주 첫날부터.'},
          {f:'r',t:'사실 처음엔 녹음도 해뒀어요. 습관이라.'},
          {f:'r',t:'근데 다시 들어보니까 큰 도움은 안 되더라고요. 그냥 소리라서.'},
          {f:'r',t:'공사 공지는 없었거든요.'},
        ],
        favor:+1, flag:'EVT_D4_003_DONE'},
       {label:'무슨 소리예요, 구체적으로.',
        reply:[
          {f:'r',t:'기계 소리요.'},
          {f:'r',t:'주기적이에요. 5초 간격으로.'},
          {f:'r',t:'세봤어요. 몇 번.'},
          {f:'r',t:'배관 소리가 아니에요. 너무 일정해요.'},
          {f:'r',t:'벽 안에서 나는 것 같아요.'},
          {f:'r',t:'공사 공지 본 적 있으세요?'},
          {f:'sa',t:'...없어요.'},
          {f:'r',t:'그렇죠.'},
        ],
        favor:+4, flag:'EVT_D4_003_TALKED'},
       {label:'나중에 얘기해요.',
        reply:[
          {f:'r',t:'알겠어요. 시간 되면 말씀해요.'},
          {f:'r',t:'급한 건 아니에요. 몇 달째 그러고 있으니까.'},
        ],
        favor:0, flag:'EVT_D4_003_DONE'},
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
// DAY_OUTRO — 그날이 끝날 때(다음날로 넘어가는 연출 중) 짧게 보여주는 마무리 나레이션.
// 노션에 원래 없던 것 — 그날 하루를 닫는 감각을 주려고 이번에 새로 설계해 넣었다.
// 캐릭터 대사 없음, 전부 경비원 관찰/행동 나레이션. "감정 설명 금지, 사실만" 원칙 유지.
// Day6은 다음날로 안 넘어가고 [일과 종료]로 바로 엔딩(startEnding)이라 대상 아님.
// ═══════════════════════════════════════
const DAY_OUTRO={
  1:[
    '관리일지를 펼쳤다.',
    '오늘 만난 사람들 이름을 적었다.',
    '\'이상 없음.\'이라고 적었다.',
    '불을 끄고 경비실을 나섰다.',
  ],
  2:[
    '관리일지에 오늘 있었던 일을 적었다.',
    // 뽀삐를 실제로 찾아준 건 A루트(직접 찾음)뿐이다. B루트는 선형이가 혼자 찾았다.
    {t:'뽀삐를 찾아준 것. 담배꽁초를 중재한 것.', ifFlag:'D2_POPPY_FOUND'},
    {t:'뽀삐가 돌아온 것. 담배꽁초를 중재한 것.', ifNotFlag:'D2_POPPY_FOUND'},
    '다 적고 나니 두 줄이 남았다.',
    '아무것도 마저 쓰지 않았다.',
  ],
  3:[
    '쓰레기장 사진이 계속 눈에 밟혔다.',
    '누가 찍었는지는 아직 모른다.',
    '관리일지에는 \'조사 중\'이라고만 적었다.',
    '불을 끄기 전에 창밖을 한 번 더 봤다.',
  ],
  4:[
    '게시판 글쓴이가 밝혀졌다.',
    '사건 하나가 끝났다.',
    '관리일지를 덮기 전에, 벽 쪽을 한 번 쳐다봤다.',
    '이유는 스스로도 몰랐다.',
  ],
  5:[
    '하루 안에 너무 많은 일이 있었다.',
    // 결판(EVT_D5_SHOWDOWN)은 자동 진행 조건에 없다 — 안 본 채로 날이 끝날 수 있다.
    {t:'명성의 오디션. 염지혜와의 결판. 벽 너머의 소리.', ifFlag:'EVT_D5_SHOWDOWN_DONE'},
    {t:'명성의 오디션. 벽 너머의 소리.', ifNotFlag:'EVT_D5_SHOWDOWN_DONE'},
    '관리일지 칸이 오늘따라 좁아 보였다.',
    '다 쓰지 못하고 덮었다.',
  ],
};

// ═══════════════════════════════════════
// DAY_SEQUENCE
// ═══════════════════════════════════════
const DAY_SEQUENCE={
  1:[
    {id:'EVT_001_COMPLAINT', type:'complaint', resId:'101',
     complaint:{
       id:1, room:'101호', subj:'옆집 소음', time:'Day1 새벽',
       lines:['관리 좀 똑바로 하세요','제 옆집 시끄럽다니까요 사람 잠을 못 자게;','새벽 두 시에 노래한다고요 민원을 몇 번을 넣었는데'],
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
    // ── 오전: 담배꽁초 민원 (노션 EVT_D2_004 전반부) ──
    {id:'EVT_D2_004_COMPLAINT', type:'complaint', resId:'101',
     trigger:null, delay:1500,
     complaint:{
       id:3, room:'101호', subj:'복도 담배꽁초', time:'Day2 오전',
       lines:['저기요','복도에 담배꽁초가 또 있어요','제 거 아니에요 옆집이요',
              '맨날 거기서 피고 버리던데','한두 번도 아니고 진짜',
              '아니 밖에서 피우면 되잖아요','흡연실 있잖아요 저기 뒤에'],
       resId:'101',
       replyChoices:[{
         label:'확인하겠습니다.',
         reply:[{f:'r',t:'네'},{f:'r',t:'근데 저번에도 확인한다고 하셨는데'},
                {f:'r',t:'...아니 뭐라는 건 아니고요'},{f:'r',t:'그냥요'}],
         favor:0, flag:'CHAT_D2_101_REPLIED',
       }],
     },
    },
    // 민원에 답장하면 102호 대면(중재)이 열린다
    {id:'EVT_D2_004_STATE', type:'state_change',
     trigger:'after:CHAT_D2_101_REPLIED', delay:800,
     changes:[{resId:'102', newState:'EVT_D2_004'}]},

    // ── 3층 첫 진입 씬 (301호 방문이 유일한 3F 경로) ──
    {id:'EVT_D2_301_INIT', type:'state_change',
     changes:[{resId:'301', newState:'EVT_D2_005'}]},

    // ── 분기 B(같이 찾기 루트) 전용: 선형이가 나중에 혼자 찾았다는 연락 ──
    // 코멘트(CHAT_201_FOUND 옆)에 명시된 의도: "CHAT_201_SEARCH_PROMISED 완료 후 자동 도착".
    // 예전엔 EVT_D2_001_B_WAIT_DONE(쓰레기장에서 기다리다 허탕치고 나온 시점)에 물려 있어서,
    // 플레이어가 사과 채팅(CHAT_201_AFTER_SEARCH)을 읽기도 전에 "뽀삐 찾았어요"가 뜰 수 있었다.
    // → 사과 채팅을 실제로 다 읽고 답한 시점(CHAT_201_SEARCH_PROMISED)으로 트리거를 옮기고,
    //   "다시 나가서 찾아봤다"는 시간 경과를 느끼도록 delay도 늘림.
    {id:'EVT_D2_PPEOPI_FOUND', type:'flag_set',
     trigger:'after:CHAT_201_SEARCH_PROMISED',
     delay:15000,
     flagToSet:'CHAT_201_FOUND_TRIGGER',
     requireFlag:'EVT_002_SEARCH',
    },

    // ── EVT_D2_002 명성 오디션 전날 (노래방비 루트) ──
    // 루트별로 갈라진다. 예전엔 조건 없이 CHAT_D2_002_A(노래방비 준 루트 전용)만
    // 밀어넣어서, 돈을 안 준 플레이어에게도 "형이 준 돈으로 간 데"가 그대로 떴다.
    {id:'EVT_D2_002_PUSH', type:'chat_push', resId:'102',
     trigger:null, delay:6000, chatStepId:'CHAT_D2_002_A',
     requireFlag:'EVT_001_B_DONE'},
    {id:'EVT_D2_002_PUSH_ALT', type:'chat_push', resId:'102',
     trigger:null, delay:6000, chatStepId:'CHAT_D2_002_A_ALT',
     requireFlag:'EVT_001_A_DONE'},
    {id:'EVT_D2_102_CCTV_PUSH', type:'chat_push', resId:'102',
     trigger:'after:CHAT_102_CHEER_DONE',
     chatStepId:'CHAT_102_CCTV',
    },

    // ── 야간: EVT_D2_006 게시판 두 번째 글 ──
    // 트리거 교체: 담배꽁초 민원 답장(CHAT_D2_101_REPLIED) → 실제 쓰레기장 방문.
    // 예전엔 민원에 답만 하면 9초 뒤 "오늘 쓰레기장 가셨더라고요"가 올라와서,
    // 쓰레기장에 가보기도 전에 누가 내 행적을 읊는 글이 먼저 떠 있었다.
    {id:'EVT_D2_BOARD', type:'board', trigger:'after:VISITED_쓰레기장_D2', delay:9000,
     post:{id:3,author:'???',tag:'',title:'오늘 쓰레기장 가셨더라고요',
           preview:'저도 도와드릴 수 있는데.',
           body:'쓰레기장에 꽤 오래 계시던데요\n뭘 찾고 계신 건가요\n다음엔 제가 도와드릴 수 있는데\n저도 거기 자주 가거든요',
           day:2,pin:false}},
    {id:'EVT_D2_BOARD_FLAG', type:'flag_set', trigger:'after:EVT_D2_BOARD',
     delay:500, flagToSet:'BOARD_COUNT_2'},

    // ── 야간: EVT_D2_007 벽 소리 민원 1차 ──
    {id:'EVT_D2_WALL_COMPLAINT', type:'complaint', resId:'201',
     trigger:'after:EVT_D2_BOARD',
     delay:5000,
     complaint:{
       id:4, room:'201호', subj:'민원인데요', time:'Day2 밤',
       lines:['저기요','민원인데요','밤에 벽에서 소리가 나요','긁는 소리요','무서워서요','동물인가요'],
       resId:'201',
       replyChoices:[
         {label:'확인해볼게요.',
          reply:[{f:'r',t:'네'},{f:'r',t:'감사합니다'},{f:'r',t:'뽀삐도 계속 그쪽 보고 짖어요'}],
          favor:+2, flag:'D2_WALL_REPLIED'},
         {label:'배관 소리일 겁니다.',
          reply:[{f:'r',t:'아'},{f:'r',t:'그런가요'},{f:'r',t:'네...'}],
          favor:0, flag:'D2_WALL_REPLIED'},
       ],
     },
    },
    {id:'EVT_D2_007_FLAG', type:'flag_set', trigger:'after:D2_WALL_REPLIED',
     delay:500, flagToSet:'WALL_SOUND_COUNT_1'},

    // 뽀삐 인계 — 채팅에서 "제가 데려다 드릴게요"(D2_201_DOOR)를 고르면 곧장 문 앞으로 간다.
    // *Claude 설계: 원래 _face:'201'만 있고 전용 씬이 없어 일반 재방문 필러로 빠졌던 것을 채움.
    // delay는 600ms 뒤 openFace가 실행되기 전에 반드시 끝나야 하므로 짧게 잡는다(100ms).
    {id:'EVT_D2_201_HANDOVER_STATE', type:'state_change',
     trigger:'after:D2_201_DOOR', delay:100,
     changes:[{resId:'201', newState:'EVT_D2_201_HANDOVER'}]},
  ],

  3:[
    // 오전 — 사진 민원 (노션 EVT_D3_001). 이전엔 노래방 루트에만 걸려 있어
    // 노래방비를 안 준 플레이어는 Day3 메인 라인 자체가 안 열렸다. 조건 제거.
    {id:'EVT_D3_PHOTO_COMPLAINT', type:'complaint', resId:'101',
     trigger:null, delay:1500,
     complaint:{
       id:5, room:'101호', subj:'이거 범죄 아니에요?', time:'Day3 오전',
       lines:['저기요','쓰레기장에 제 사진이 있었어요','누가 찍은 거예요','몰래 찍어서 거기다 버린 거잖아요','이거 범죄 아니에요?','그 카메라 들고 다니는 사람 짓 아니에요?'],
       resId:'101',
       replyChoices:[{
         label:'확인해보겠습니다.',
         reply:[{f:'r',t:'빨리요.'}],
         favor:0, flag:'CHAT_D3_101_REPLIED',
       }],
     },
    },
    // 사진 사건에 대한 주민 반응 (명성 / 선형)
    {id:'EVT_D3_004_102_PUSH', type:'chat_push', resId:'102',
     trigger:null, delay:3000, chatStepId:'CHAT_D3_004_102'},
    {id:'EVT_D3_004_201_PUSH', type:'chat_push', resId:'201',
     trigger:null, delay:4500, chatStepId:'CHAT_D3_004_201'},
    // 오후 — 오디션 당일
    {id:'EVT_D3_010_PUSH', type:'chat_push', resId:'102',
     trigger:null, delay:6000, chatStepId:'CHAT_D3_010_AUDITION'},
    // 301호 첫 대면 상태 (3층 방문 시)
    {id:'EVT_D3_005_STATE', type:'state_change', trigger:null,
     changes:[{resId:'301', newState:'EVT_D3_005'}]},
    // 사진을 본 뒤 202호를 방문하면 심문 씬
    {id:'EVT_D3_003_STATE', type:'state_change',
     trigger:'after:EVT_D3_002_DONE',
     changes:[{resId:'202', newState:'EVT_D3_003'}]},
    // 야간 — 벽 소리 2차 민원
    {id:'EVT_D3_007_COMPLAINT', type:'complaint', resId:'102',
     trigger:null, delay:8000,
     complaint:{
       id:12, room:'102호', subj:'벽 소리 (2차)', time:'Day3 야간',
       lines:['형','저 이상한 소리 듣는 건 아니죠?','벽에서 소리 나요','규칙적으로','좀 무서운데 쓰고 나니까 무서워 보이네ㅋㅋ','아무튼 한번 봐줘요'],
       resId:'102',
       replyChoices:[{
         label:'확인해볼게요.',
         reply:[{f:'r',t:'ㅇㅇ 부탁해요'}],
         favor:+1, flag:'EVT_D3_007_DONE',
       }],
     },
    },
    {id:'EVT_D3_007_FLAG', type:'flag_set', trigger:null,
     flagToSet:'WALL_SOUND_COUNT_2'},
    // 야간 — 게시판 세 번째 글
    // "202호에 다녀오셨더라고요 / 사진 때문에 가신 거죠?" — 실제로 202호 사진 심문
    // (EVT_D3_003, Day3 자동진행 조건에 포함돼 있어 모든 플레이어가 거친다)을 마친 뒤에만.
    // 예전엔 Day3 시작 9초 만에 무조건 올라와서, 가본 적도 없는데 다녀왔다고 했다.
    {id:'EVT_D3_BOARD', type:'board', trigger:'after:EVT_D3_003_DONE', delay:9000,
     post:{id:13,author:'???',tag:'',title:'202호에 다녀오셨더라고요',
           preview:'사진 때문에 가신 거죠?',
           body:'사진 때문에 가신 거죠?\n202호 분은 나쁜 사람은 아니에요\n다만 이 빌라에서 제일 오래 버틸 것 같기도 해요\n경비원님은 어떻게 보세요',
           day:3,pin:false}},
    {id:'EVT_D3_BOARD_FLAG', type:'flag_set', trigger:'after:EVT_D3_BOARD',
     flagToSet:'BOARD_COUNT_3'},
    // 조건부 — 선형이 신호 1차 (호감도 낮을 때만 스텝 조건으로 걸린다)
    {id:'EVT_D3_009_PUSH', type:'chat_push', resId:'201',
     trigger:null, delay:7000, chatStepId:'CHAT_D3_009_SIGNAL1'},
    // 밴드 관계 노출 (채팅 루트)
    // 밴드 관계 대면 루트. 채팅 루트(EVT_D3_006_PUSH)와 별개로,
    // Day1 복선을 본 플레이어가 102호를 직접 찾아가면 열린다.
    {id:'EVT_D3_006_STATE', type:'state_change', requireFlag:'HINT_101_102',
     trigger:null, delay:2000,
     changes:[{resId:'102', newState:'EVT_D3_006'}]},
    {id:'EVT_D3_006_PUSH', type:'chat_push', resId:'102',
     trigger:null, delay:10000, chatStepId:'CHAT_D3_006_BAND',
     requireFlag:'HINT_101_102'},
  ],

  4:[
    // 개미를 언제 주웠든(Day1~3 포함) Day4가 되면 202호 대면이 개미 씬으로 열린다.
    // antPick() 만으로는 Day4 이전에 주운 플레이어를 놓친다.
    {id:'EVT_D4_ANT_STATE', type:'state_change', requireFlag:'ANT_PICKED',
     trigger:null, delay:1000,
     changes:[{resId:'202', newState:'EVT_D4_009_ANT'}]},

    // 오전 — 오디션 결과 대기 채팅
    {id:'EVT_D4_000_PUSH', type:'chat_push', resId:'102',
     trigger:null, delay:1500, chatStepId:'CHAT_D4_000_WAIT'},
    // 오전 — 101↔102 2차 충돌 민원
    {id:'EVT_D4_005_COMPLAINT', type:'complaint', resId:'101',
     trigger:null, delay:3000,
     complaint:{
       id:11, room:'101호', subj:'복도에서 시비', time:'Day4 오전',
       lines:['저기요','102호가요','복도에서 저한테 뭐라고 했어요','저 진짜 참을 만큼 참았거든요','이 사람 진짜 왜 이래요'],
       resId:'101',
       replyChoices:[{
         label:'확인하겠습니다.',
         reply:[{f:'r',t:'빨리요 진짜'},{f:'r',t:'저 오늘 잠도 못 잤어요 이것 때문에'}],
         favor:0, flag:'CHAT_D4_101_REPLIED',
       }],
     },
    },
    // 102호 대면 충돌 씬. 민원 답장 여부와 무관하게 Day4엔 항상 열어둔다
    // (답장 후 트리거로 걸면 답장 직후 바로 방문했을 때 아직 세팅이 안 돼 씬을 놓친다)
    {id:'EVT_D4_005_STATE', type:'state_change', trigger:null,
     changes:[{resId:'102', newState:'EVT_D4_005'}]},
    // 301호 게시판 자백 (방문 시)
    {id:'EVT_D4_002_STATE', type:'state_change', trigger:null,
     changes:[{resId:'301', newState:'EVT_D4_002'}]},
    // 고재엽이 먼저 연락
    {id:'EVT_D4_003_PUSH', type:'chat_push', resId:'202',
     trigger:null, delay:5000, chatStepId:'CHAT_D4_003'},
    // 캐물었으면 202호 대면에서 벽 확인 (CLUE_002)
    {id:'EVT_D4_004_STATE', type:'state_change',
     trigger:'after:EVT_D4_003_TALKED',
     changes:[{resId:'202', newState:'EVT_D4_004'}]},
    // 게시판 네 번째 글
    // 밴드 진실 (호감도 40 이상인 쪽에서만 열린다 — _requireFavor 로 걸러짐).
    // 102호는 2차 충돌 씬이 끝난 뒤에 걸어야 그 씬을 덮어쓰지 않는다.
    {id:'EVT_D4_006_102_STATE', type:'state_change', requireFlag:'BAND_REVEALED',
     trigger:'after:EVT_D4_005_DONE', delay:1200,
     changes:[{resId:'102', newState:'EVT_D4_006_102'}]},
    {id:'EVT_D4_006_101_STATE', type:'state_change', requireFlag:'BAND_REVEALED',
     trigger:null, delay:2500,
     changes:[{resId:'101', newState:'EVT_D4_006_101'}]},
    // "2층에 오래 계시더라고요" — 2층에서 벌어지는 Day4 본 씬(102호 앞 충돌 중재,
    // EVT_D4_005)을 실제로 본 뒤에만. 예전엔 Day4 시작 6초 만에 무조건 올라왔다.
    {id:'EVT_D4_BOARD', type:'board', trigger:'after:EVT_D4_005_DONE', delay:6000,
     post:{id:11,author:'???',tag:'',title:'오늘도 잘 보고 있어요',
           preview:'오늘도 수고하셨어요.',
           body:'경비원님\n\n오늘도 수고하셨어요.\n\n2층에 오래 계시더라고요.',
           day:4,pin:false}},
    // 야간 — 목줄 회수
    {id:'EVT_D4_007_PUSH', type:'chat_push', resId:'201',
     trigger:null, delay:8000, chatStepId:'CHAT_D4_007_LEASH'},
    // 조건부 — 선형이 신호 2차 (1차를 무시한 경우만)
    {id:'EVT_D4_008_PUSH', type:'chat_push', resId:'201',
     trigger:null, delay:9500, chatStepId:'CHAT_D4_008_SIGNAL2',
     requireFlag:'IGNORED_201_SIGNAL_1'},
    // 신호 2차에서 "직접 가볼게요"(NOTICED_201_SIGNAL_2)를 고르면 곧장 문 앞으로 간다.
    // *Claude 설계: 원래 전용 씬이 없어 일반 필러로 빠졌던 것을 채움. delay는 600ms 뒤
    // openFace 실행 전에 끝나야 하므로 짧게 잡는다(100ms).
    {id:'EVT_D4_201_CHECKIN_STATE', type:'state_change',
     trigger:'after:NOTICED_201_SIGNAL_2', delay:100,
     changes:[{resId:'201', newState:'EVT_D4_201_CHECKIN'}]},
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
     // 노션은 requireRoute:'END_3'로 적혀 있으나, 루트는 DEV 고정 시에만 존재해서
     // 자유 플레이에선 이 채팅이 영영 안 뜨고 END_3 진입이 막힌다.
     // 실질 조건인 "Day4에 벽을 직접 확인했다"로 대체한다.
     requireFlag:'EVT_D4_004_DONE',
    },
    // 오디션 1차 합격 채팅 — 오후. 모든 루트 공통.
    {id:'EVT_D5_004_AUDITION_PUSH', type:'chat_push', resId:'102',
     trigger:null, delay:7000,
     chatStepId:'CHAT_D5_102_AUDITION',
    },
    // 선택지 응답 후 1차 합격 플래그 세팅 (Day6 최종 합격 통보의 선행 조건)
    {id:'EVT_D5_004_FLAG', type:'flag_set',
     trigger:'after:EVT_D5_004_DONE',
     flagToSet:'AUDITION_ROUND1_PASSED',
    },
    // 302호 심기 — Day5 첫 301호 방문 시 3층 순찰 비트로 삽입
    {id:'EVT_D5_009_STATE', type:'state_change', trigger:null,
     changes:[{resId:'301', newState:'EVT_D5_009'}]},
    // 게시판 마지막 글
    // 선형이 신호를 두 번 넘긴 플레이어가 201호를 직접 찾아가면 열린다.
    // 이 씬이 SAVED_201 을 준다 — END_2_C 를 피하는 마지막 자리인데 아무도 안 열고 있었다.
    {id:'EVT_D5_201_VISIT_STATE', type:'state_change', requireFlag:'IGNORED_201_SIGNAL_2',
     trigger:null, delay:3000,
     changes:[{resId:'201', newState:'EVT_D5_201_VISIT'}]},
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
    // 낮 자유 방문 — 각 호실 마지막 대화 상태로 전환 (EVT_D6_002)
    {id:'EVT_D6_002_STATE', type:'state_change', trigger:null,
     changes:[{resId:'101', newState:'EVT_D6_002_101'},
              {resId:'102', newState:'EVT_D6_002_102'},
              {resId:'201', newState:'EVT_D6_002_201'},
              {resId:'301', newState:'EVT_D6_002_301'}]},
    // 아침 — 오디션 최종 합격 통보 (Day5 1차 합격을 본 경우)
    {id:'EVT_D6_AUDITION_FINAL_PUSH', type:'chat_push', resId:'102',
     trigger:null, delay:2500,
     chatStepId:'CHAT_D6_102_AUDITION_FINAL',
     requireFlag:'AUDITION_ROUND1_PASSED',
    },
    // E1/E3 — 아침, 뽀삐가 경비실 쪽으로 가려 함 (SAVED_201 루트)
    {id:'EVT_D6_201_MORNING_PUSH', type:'chat_push', resId:'201',
     trigger:null, delay:1000,
     chatStepId:'CHAT_D6_201_MORNING',
     requireFlag:'SAVED_201',
    },
    // E2A — 어제 결판 여파. 101/102 채팅 자동 도착
    {id:'EVT_D6_101_E2A_PUSH', type:'chat_push', resId:'101',
     trigger:null, delay:1500,
     chatStepId:'CHAT_D6_101_E2A',
     requireFlag:'EVT_D5_SHOWDOWN_DONE',
    },
    {id:'EVT_D6_102_E2A_PUSH', type:'chat_push', resId:'102',
     trigger:'after:EVT_D6_101_E2A_PUSH',
     delay:4000,
     chatStepId:'CHAT_D6_102_E2A',
     requireFlag:'EVT_D5_SHOWDOWN_DONE',
    },
    // E2A — 채팅 이후 1층 복도 결판 후속 씬 자동 오픈
    {id:'EVT_D6_E2A_AFTERMATH', type:'face', resId:'101',
     trigger:'after:EVT_D6_102_E2A_PUSH',
     state:'EVT_D6_AFTERMATH',
     delay:6000,
     requireFlag:'EVT_D5_SHOWDOWN_DONE',
    },
    // E3 — Day6 시작 → 경비실 대기 씬 → 고재엽 채팅 도착
    // 노션은 requireRoute:'END_3'로 적혀 있으나, 루트는 DEV 고정 시에만 존재한다.
    // 자유 플레이에서 END_3 로 가는 실제 조건은 Day5에 고재엽 편에 선 것(AGREED_WITH_202)이고,
    // 단서 자격은 executeEvent 의 Day6 202 게이트가 따로 검사한다.
    {id:'EVT_D6_E3_OPENING', type:'face', resId:'202',
     trigger:null, delay:1000,
     state:'EVT_D6_MORNING',
     requireFlag:'AGREED_WITH_202',
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
    // 폴더 조사 완료(END_3_FOLDER_READ 플래그) 후 → 관찰실 씬 강제 오픈.
    // *Claude 설계: Day5에 302호 문 밑 빛을 본 적 있으면(SEEN_302_LIGHT) "그 방이 여기였다"를
    // 알아채는 나레이션이 한 줄 더 붙은 변형 씬으로 대신 연다. 엔딩 판정(calcEnding/
    // END_3_SEEN/_thenEnding)은 완전히 그대로이고, 연출 나레이션만 추가된 것.
    {id:'EVT_D6_OBSROOM_OPEN_302', type:'face', resId:'202',
     trigger:'after:END_3_FOLDER_READ',
     requireFlag:'SEEN_302_LIGHT',
     state:'EVT_D6_OBSROOM_302SEEN',
     delay:1500,
    },
    {id:'EVT_D6_OBSROOM_OPEN', type:'face', resId:'202',
     trigger:'after:END_3_FOLDER_READ',
     requireNotFlag:'SEEN_302_LIGHT',
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
  // Day1 보완 — 매소련(301호) 짧은 등장. 대사 없음(나레이션만), 1회성.
  // Day2에서 EVT_D2_301_INIT(state_change)이 무조건 EVT_D2_005로 덮어쓰므로 이후 흐름과 충돌 없음.
  'EVT_301_DAY1_GLIMPSE':{
    room:'301호', loc:'301호 앞',
    onEnd:null,
    lines:[
      '(3층이다. 처음 올라와 본다.)',
      '(301호 앞. 문 아래 틈으로 옅은 냄새가 새어 나온다.)',
      '(안에서 뭔가 부스럭거리는 소리가 난다. 봉투 끄는 소리 같기도 하다.)',
      '(노크했다.)',
      '(소리가 뚝 멎었다.)',
      '(그러고는 아무 반응도 없다.)',
    ],
    choices:['(돌아간다)'],
    choiceResults:[{favor:0,flags:['EVT_301_GLIMPSE_DONE'],lines:[]}],
  },

  'EVT_101_INIT':{
    room:'101호', loc:'101호 앞',
    onEnd:'EVT_101_INTRO',
    lines:[
      '(1층 복도다. 오늘이 첫 출근이다.),,',
      '(101호 앞에 섰다.),,',
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
    choiceResults:[{favor:0,flags:[],lines:[
      '(복도에 그대로 서 있었다.),,',
      '(안에서 다시 인기척이 없다.)',
      '(돌아섰다.)',
    ]}],
  },
  // 101호 두 번째 방문 — REVISIT(고정)으로 들어가기 전, 딱 한 번만 이름을 밝히고 지나간다.
  'EVT_101_INTRO':{
    room:'101호', loc:'101호 앞',
    onEnd:'EVT_101_REVISIT',
    lines:[
      '!101문열림 !101',
      {speaker:'염지혜',text:'...또요.'},
      {speaker:'염지혜',text:'뭐예요.'},
    ],
    choices:['순찰 중이에요. 별 일 없으시죠?'],
    choiceResults:[{favor:0,flags:['EVT_101_INTRO_DONE'],lines:[
      {speaker:'염지혜',text:'... 근데 어쩌라고요?'},
      {speaker:'염지혜',text:'그런 일로 찾아오지 마세요.'},
      {speaker:'경비',text:'저, 성함이라도 여쭤봐도 될까요? 서류에 남겨야 해서요.'},
      {speaker:'염지혜',text:'염지혜요.',unlockName:true},
      '!101문닫힘 !101x',
    ]}],
  },
  'EVT_101_REVISIT':{
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
    onEnd:'EVT_001_INTRO',
    lines:[
      '(101호에서 몇 걸음 거리다.),,',
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
      {speaker:'경비',text:'어쨌든 밤 10시 이후는 소음 금지가 규정입니다.'},
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
          // EVT_001_A_DONE — 노래방비를 안 준 루트를 가리키는 플래그.
          // 예전엔 두 루트가 똑같은 플래그만 세워서 "안 준 루트"를 조건으로 걸 수가 없었다.
          {favor:-2,flags:['EVT_001_DONE','EVT_001_A_DONE','HINT_101_102'],lines:[
            {speaker:'경비',text:'아무튼 협조 부탁드립니다.'},
            '!102짜증',
            {speaker:'명성',text:'융통성이 없으시네. 나이도 어려보이는데.'},
            {speaker:'명성',text:'이틀 뒤까지만 참으라 그래요. 쟤 말곤 아무도 민원 안 넣었잖아요.'},
            '(맞는 말이긴 하다. 과거 기록을 봐도 101호 말곤 관련 민원이 없었다.)',
            {speaker:'경비',text:'다같이 사는 공간이니까요.'},
            {speaker:'명성',text:'하아...... 예, 예.'},
            '!102문닫힘 !102x',
            '(복도로 나왔다.),,',
            '(101호 문이 조금 열려 있었다. 안까지 다 들렸다는 뜻이다.)',
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
            {speaker:'명성',text:'이 작은 빌라에 볼 업무가 뭐 있다고. 암튼 감사해요. 수고하세요 빠이.'},
            '(쾅)',
            '!102문닫힘 !102x',
            '(복도로 나왔다.),,',
            '(101호 문은 닫혀 있었다. 조용하다.)',
          ]},
        ],
      }
    },
  },
  // 102호 두 번째 방문 — EVT_001_DONE(고정)으로 들어가기 전, 딱 한 번만 이름을 밝히고 지나간다.
  'EVT_001_INTRO':{
    requireFlag:'EVT_001_DONE',
    room:'102호', loc:'102호 앞',
    onEnd:'EVT_001_DONE',
    lines:[
      '!102문열림 !102',
      {speaker:'명성',text:'오 형.'},
      {speaker:'명성',text:'왜요?'},
    ],
    choices:['순찰 중이에요. 별 일 없으시죠?'],
    choiceResults:[{favor:+1,flags:['EVT_001_INTRO_DONE'],lines:[
      '!102웃음',
      {speaker:'명성',text:'네. 저 연습 중이었어서. 형도 수고요.'},
      {speaker:'경비',text:'참, 통성명을 아직 못 했네요. 이름이?'},
      {speaker:'명성',text:'아 맞다. 명성이요.',unlockName:true},
      '!102문닫힘 !102x',
    ]}],
  },
  'EVT_001_DONE':{
    requireFlag:'EVT_001_DONE',
    room:'102호', loc:'102호 앞',
    onEnd:null,
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
    onEnd:'EVT_201_DAY1_FOLLOWUP',
    lines:[
      '(2층으로 올라왔다.),,',
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
      '(복도에 혼자 남았다.),,',
      '(문 밑 그림자가 움직였다. 아직 그 자리에 서 있다는 뜻이다.)',
    ]}],
  },
  // Day1 보완 — 첫 거절 이후 바로 재방문 로테이션으로 빠지면 밋밋해서,
  // 재방문 한 번은 짧은 진행(그림자가 물러남)을 한 단계 더 끼워넣는다. 신규 대사 없음(나레이션만).
  'EVT_201_DAY1_FOLLOWUP':{
    requireFlag:'EVT_201_MET',
    room:'201호', loc:'201호 앞',
    onEnd:null,
    lines:[
      '(다시 201호 앞이다.)',
      '(문 밑 그림자가 아직 그 자리에 있다.)',
      '(똑똑똑),,',
      '(그림자가 움찔했다.),,',
      '(그리고 조용히 물러났다.)',
    ],
    choices:['(돌아간다)'],
    choiceResults:[{favor:0,flags:['EVT_201_FOLLOWUP_DONE'],lines:[]}],
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
    // favor +1 → 0. onEnd가 자기 자신이라 무한 반복되는 씬인데 호감도를 계속 줘서,
    // 201호 문만 계속 클릭하면 호감도를 100까지 펌핑할 수 있었다(엔딩 판정에 직결).
    choiceResults:[{favor:0,flags:[],lines:[
      {speaker:'201호',text:'...네.'},
    ]}],
  },

  // Day2 — 뽀삐 인계를 직접 하기로 한 경우(D2_201_DOOR). 채팅에서 "제가 데려다 드릴게요"를
  // 고르면 곧장 여기로 온다. 예전엔 전용 씬이 없어 일반 재방문 필러로 빠졌었다.
  // *Claude 설계: 채팅에서 이미 "감사해요"까지 나눈 뒤라 대사를 반복하지 않고 전부
  // 나레이션으로 처리. 소매가 손등까지 내려와 있는 디테일은 Day5 EVT_D5_201_VISIT의
  // "소매가 내려와 있다"를 미리 심어두는 복선 — 이 시점엔 그냥 스쳐 지나가는 묘사일 뿐이다.
  'EVT_D2_201_HANDOVER':{
    requireFlag:'D2_201_DOOR',
    room:'201호', loc:'201호 앞',
    onEnd:null,
    lines:[
      '(뽀삐를 안고 201호 앞에 섰다.)',
      '(노크했다.)',
      '!201문열림 !201',
      '(문이 조금 열렸다. 쇠사슬은 여전히 걸려 있다.)',
      '(눈이 뽀삐부터 봤다.)',
      '(손이 문틈으로 나왔다. 소매가 손등까지 내려와 있다.)',
      '(조심스럽게 뽀삐를 받아 안았다.)',
      '(뽀삐가 낑낑거리며 얼굴을 부볐다.)',
      '(그제야 표정이 조금 풀렸다.),,',
      '!201문닫힘 !201x',
      '(문이 닫혔다.)',
    ],
    choices:['(돌아간다)'],
    choiceResults:[{favor:0, flags:['EVT_D2_201_HANDOVER_DONE'], lines:[]}],
  },

  // Day4 — 신호 2차에서 "직접 가볼게요"를 고른 경우(NOTICED_201_SIGNAL_2).
  // *Claude 설계: 원래 전용 씬이 없어 문을 열어도 일반 필러만 나왔다. 1차 신호를
  // 무시했다가(IGNORED_201_SIGNAL_1) 2차에서라도 직접 확인하러 온 것 — Day5의 마지막
  // 기회(EVT_D5_201_VISIT)와 사실상 같은 개입이라, 여기서도 SAVED_201을 준다. 2차에서
  // 챙긴 사람이 3차까지 방치한 사람보다 못한 보상(사실상 무보상)을 받는 건 이상하다.
  // Day6 EVT_D6_002_201 / CHAT_D6_201_MORNING이 이미 requireFlag:'SAVED_201'로
  // 범용 게이팅돼 있어 별도 배선 없이 그대로 연결된다.
  'EVT_D4_201_CHECKIN':{
    requireFlag:'NOTICED_201_SIGNAL_2',
    room:'201호', loc:'201호 앞',
    onEnd:null,
    lines:[
      '(201호 앞에 섰다.)',
      '(노크했다.)',
      '!201문열림 !201',
      '(문이 조금 열렸다. 쇠사슬은 그대로다.)',
      '(눈이 마주치자 바로 시선을 피했다.)',
      '(소매가 유난히 길다. 손등까지 다 덮여 있다.)',
      {speaker:'경비',text:'뽀삐 밥 안 먹는다길래 걱정돼서요.'},
      {speaker:'201호',text:'...괜찮아요.'},
      '(잠깐 침묵.),,',
      {speaker:'경비',text:'선형 씨는요.'},
      '(대답이 없다.),,',
      {speaker:'201호',text:'...저도 괜찮아요.'},
      '(거짓말인 걸 알 수 있었다.)',
      '(그래도 지금은 그 이상 캐물을 수 없었다.)',
      {speaker:'경비',text:'뭐든 필요하면 문 두드려요. 아무 때나.'},
      '(고개를 아주 작게 끄덕였다.)',
      '!201문닫힘 !201x',
      '(문이 닫혔다.),,',
      '(마음이 편하지 않았다.)',
    ],
    choices:['(돌아간다)'],
    choiceResults:[{favor:+3, flags:['EVT_D4_201_CHECKIN_DONE','SAVED_201'], lines:[]}],
  },

  'EVT_202_INIT':{
    room:'202호', loc:'202호 앞',
    onEnd:'EVT_202_DONE',
    lines:[
      '(2층 복도 끝. 202호 앞이다.),,',
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
      {speaker:'고재엽',text:'아무튼, 반가워요. 고재엽이라고 합니다.',unlockName:true},
      '(카메라 렌즈 뚜껑을 여닫으며 얘기했다. 손을 가만히 안 둔다.)',
      '(그는 나에게 손을 내밀었다. 난 그 손을 맞잡아 악수했다.)',
      {speaker:'경비',text:'아, 네. 앞으로 잘 부탁드립니다.'},
      {speaker:'고재엽',text:'보다시피 나가던 길이라서요. 이만 실례할게요. 다음에 보면 인사해요.'},
      '!202문닫힘 !202x',
    ],
    choices:['(돌아간다)'],
    choiceResults:[{favor:+5,flags:['EVT_202_MET'],lines:[
      '(복도를 다시 걸었다.),,',
      '(202호 문 앞에 삼각대가 하나 접혀 세워져 있다.)',
    ]}],
  },
  'EVT_202_DONE':{
    requireFlag:'EVT_202_MET',
    room:'202호', loc:'202호 앞',
    onEnd:null,
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
        {speaker:'고재엽',text:'아, 아직 통성명 안 하셨겠구나. 201호 사는 친구.',unlockName:true,unlockResId:'201'},
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

  // (EVT_301_INIT 삭제 — 노션 Day2 EVT_D2_005 는 선택지도 대사도 없다. 그 씬으로 대체됨)
  // Day5 — 3층 순찰 중 302호 문 아래 빛 (1회성). 끝나면 EVT_301_DONE으로 복귀.
  'EVT_D5_009':{
    requireDay:5,
    room:'301호', loc:'301호 앞',
    bg:'배경/301문닫힘.png',
    onEnd:'EVT_301_DONE',
    lines:[
      '(3층. 302호 문 앞을 지났다.)',
      '(문 아래로 빛이 새어나온다.)',
      '(빈집이라고 들었는데.)',
      '(신경 쓸 일은 아니었다.),,',
      '(301호 앞에 섰다.)',
      '(긁는 소리가 난다.)',
      '(문이 아니라 안쪽 벽이다.)',
      '(똑똑똑),,',
      '(긁는 소리는 멈추지 않았다.)',
    ],
    choices:['(돌아간다)'],
    choiceResults:[{favor:0,flags:['EVT_D5_009_DONE','SEEN_302_LIGHT'],lines:[]}],
  },
  'EVT_301_DONE':{
    requireFlag:'EVT_301_SEEN',
    room:'301호', loc:'301호 앞',
    onEnd:null,
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
    _forceOpen:true,   // 경비실/컴퓨터/관찰실 씬 — 호실 슬롯을 빌려 쓰므로 장소씬 판정에 걸리면 안 된다
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
    _forceOpen:true,   // 경비실/컴퓨터/관찰실 씬 — 호실 슬롯을 빌려 쓰므로 장소씬 판정에 걸리면 안 된다
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
        '(주민행동기록_102.txt)',
        '(주민행동기록_201.txt)',
        '(주민행동기록_202.txt)',
        '(주민행동기록_301.txt)',
        '(사건기록.txt)',
        '(갈등기록.txt)',
        '(경비원.txt),,',
        '(하나씩 열었다.),,',
        '(염지혜. 27세. 전직 밴드 보컬. 가족 관계 단절. 월세 미납 이력 2회.)',
        '(감정 기복 빈도: 높음. 갈등 유발 가능성: 높음.),,',
        '(명성. 27세. 밴드 활동 이력. 성대결절 수술 이력.)',
        '(사회적 친화력: 높음. 갈등 완화 기여도: 높음.)',
        '(비고: "환경 안정 기여도 높음."),,',
        '(김선형. 24세.)',
        '(히키코모리 성향. 불안장애 추정. 자해 이력 미확인.)',
        '(사회적 고립 심화 패턴.),,',
        '(고재엽. 31세. 프리랜서 사진작가. 사회적 고립 경향. 독립적.)',
        '(이상 감지 시도 횟수: 복수.)',
        '(비고: 주의 요망. 내부 구조 인지 가능성 있음.),,',
        '(매소련. 나이 미상. 수집벽. 환경 이상 감지 빈도: 높음.)',
        '(비고: 관찰 대상 중 이상 감지 속도 최상위.),,',
        '(사건기록. 소음 분쟁. 소형 동물 실종. 익명 게시판 게시.)',
        '(내가 6일 동안 한 일이 전부 여기 있다.),,',
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
    _forceOpen:true,   // 경비실/컴퓨터/관찰실 씬 — 호실 슬롯을 빌려 쓰므로 장소씬 판정에 걸리면 안 된다
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
      '(나가는 문이 있었다.)',
      '(문을 열었다.)',
      '(복도였다. 3층이었다.),,',
      '(뒤돌아봤다.)',
      '(방금 나온 문에 번호가 붙어 있다.)',
      '(\"302\"),,',
    ],
    choices:['(계속)'],
    choiceResults:[
      {flags:['END_3_SEEN'],lines:[],_thenEnding:'END_3'},
    ],
  },

  // Day5에 302호 문 밑 빛을 본 적 있는 경우(SEEN_302_LIGHT)의 관찰실 씬 변형.
  // *Claude 설계: EVT_D5_009에서 심어놓고 아무 데서도 회수하지 않던 떡밥의 결말.
  // "빈집인 줄 알았던 302호가 사실 이 관찰실이었다"는 연결 나레이션 두 줄만 추가.
  // 그 외 내용(대사·선택지·choiceResults·_thenEnding·END_3_SEEN)은 EVT_D6_OBSROOM과
  // 완전히 동일 — 엔딩 판정 로직은 절대 건드리지 않는다.
  'EVT_D6_OBSROOM_302SEEN':{
    requireDay:6,
    _forceOpen:true,
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
      '(나가는 문이 있었다.)',
      '(문을 열었다.)',
      '(복도였다. 3층이었다.),,',
      '(뒤돌아봤다.)',
      '(방금 나온 문에 번호가 붙어 있다.)',
      '(\"302\"),,',
      '(예전에 이 문 밑으로 빛이 새어나온 적이 있었다.)',
      '(빈집이라고 들었어서, 그냥 넘어갔었다.)',
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


  // ══════════════════════════════════════
  // Day2 대면 씬  (노션 Day2 정본 이식)
  // ══════════════════════════════════════

  // ── EVT_D2_004 101↔102 담배꽁초 중재 (102호 앞) ──
  // 씬 6단: 진입 / 잡담 / 본론 / 선택지 / 반응 / 여운
  'EVT_D2_004':{
    requireDay:2,
    requireFlag:'CHAT_D2_101_REPLIED',
    room:'102호', loc:'102호 앞',
    bg:'배경/102문닫힘.png',
    onEnd:null,
    lines:[
      '!102문닫힘',
      '(102호 앞이다.)',
      '(오늘은 노래가 안 들린다.)',
      '(문 아래로 기타 소리만 샌다.),,',
      '(쾅쾅쾅)',
      '(기타가 멎었다.)',
      '!102문열림 !102',
      '(문이 열렸다. 명성이 그냥 서 있다.)',
      '(어제보다 표정이 없다.)',
      {speaker:'명성',text:'어 형.'},
      {speaker:'경비',text:'안녕하세요.'},
      {speaker:'명성',text:'노래 안 했는데요 저.'},
      {speaker:'경비',text:'압니다.'},
      {speaker:'명성',text:'그쵸? 약속했잖아요.'},
      '(손가락으로 자기 목을 가리켰다.)',
      {speaker:'명성',text:'그리고 지금 목 아껴야 돼서.'},
      {speaker:'경비',text:'오디션이요?'},
      {speaker:'명성',text:'내일이에요.'},
      {speaker:'경비',text:'아, 내일이요.'},
      {speaker:'명성',text:'형 왜 그렇게 놀래요.'},
      {speaker:'경비',text:'안 놀랐는데요.'},
      {speaker:'명성',text:'놀랐는데.'},
      {speaker:'경비',text:'다름이 아니라, 복도 담배꽁초 얘기인데요.'},
      {speaker:'명성',text:'아.'},
      {speaker:'명성',text:'제 거예요.'},
      {speaker:'경비',text:'......'},
      {speaker:'명성',text:'피고 싶으면 나가서 피라고요?'},
      {speaker:'경비',text:'흡연구역이 있으니까요.'},
      {speaker:'명성',text:'......'},
      {speaker:'명성',text:'알겠어요.'},
      '(그런데 안 들어간다.)',
      {speaker:'명성',text:'근데 형.'},
      {speaker:'명성',text:'그거 누가 얘기했어요?'},
      {speaker:'경비',text:'말씀드리기 어렵습니다.'},
      {speaker:'명성',text:'ㅋ'},
      {speaker:'명성',text:'뻔한데 뭐.'},
    ],
    choices:[
      '101호 분이 많이 불편해하시더라고요.',
      '규정상 복도 흡연은 안 됩니다.',
      '앞으로 주의해 주시면 됩니다.',
      '(관여하지 않는다)',
    ],
    choiceResults:[
      {favor:-3, _favorMap:{'101':+5}, flags:['SIDE_101_D2','EVT_D2_004_DONE'], lines:[
        {speaker:'명성',text:'알겠다고요.'},
        '!102짜증',
        {speaker:'명성',text:'불편한 거 많으시네 그분.'},
        {speaker:'경비',text:'명성 씨.'},
        {speaker:'명성',text:'아 예. 죄송합니다.'},
        '(문이 닫혔다.)',
        '!102문닫힘 !102x',
        '(복도로 나왔다.)',
        '(101호 앞에 꽁초가 하나 있었다.)',
        '(102호 앞에는 없었다.),,',
        '(치웠다.)',
      ]},
      {favor:+4, flags:['SIDE_102_D2','EVT_D2_004_DONE'], lines:[
        {speaker:'명성',text:'네 알아요. 죄송해요.'},
        {speaker:'명성',text:'규정이면 어쩔 수 없죠.'},
        '(잠깐 웃었다.)',
        {speaker:'명성',text:'형 그런 식으로 말하는 거 좋네요.'},
        {speaker:'경비',text:'뭐가요.'},
        {speaker:'명성',text:'사람 얘기 안 하고 규정 얘기 하는 거.'},
        {speaker:'명성',text:'편하잖아요 그게.'},
        '!102문닫힘 !102x',
        '(복도로 나왔다.)',
        '(101호 앞에 꽁초가 하나 있었다.)',
        '(102호 앞에는 없었다.),,',
        '(치웠다.)',
      ]},
      {favor:+2, _favorMap:{'101':+2}, flags:['SIDE_NEUTRAL_D2','EVT_D2_004_DONE'], lines:[
        {speaker:'명성',text:'예.'},
        {speaker:'명성',text:'예예.'},
        '(문이 닫혔다.)',
        '!102문닫힘 !102x',
        '(복도로 나왔다.)',
        '(101호 앞에 꽁초가 하나 있었다.)',
        '(102호 앞에는 없었다.),,',
        '(치웠다.)',
      ]},
      {favor:0, _neglect:true, flags:['EVT_D2_004_NEGLECT','EVT_D2_004_DONE'], lines:[
        '(뭐라고 할까 생각하다 그냥 돌아왔다.)',
        '!102문닫힘 !102x',
        '(복도로 나왔다.)',
        '(101호 앞에 꽁초가 하나 있었다.)',
        '(102호 앞에는 없었다.),,',
        '(치웠다.)',
      ]},
    ],
  },

  // ── EVT_D2_001 분기 A — 쓰레기장에서 뽀삐 발견 (CCTV 루트) ──
  'EVT_D2_001_A':{
    requireDay:2,
    _forceOpen:true,
    room:'쓰레기장', loc:'쓰레기장',
    bg:'배경/쓰레기장.png', char:'x',
    onEnd:null,
    lines:[
      '(쓰레기장이다.)',
      '(어제보다 봉투가 늘어 있다. 수거일이 내일이라 그렇다.),,',
      '(뭔가 움직였다.)',
      '(봉투 뒤다.),,',
      '(개다.)',
      '(흰색. 작다. 생각보다 훨씬 작다.),,',
      {speaker:'경비',text:'뽀삐?'},
      '(고개를 들었다.)',
      '(듣긴 들은 것 같다.)',
      '(움직이지는 않는다.),,',
    ],
    choices:['(손을 뻗는다.)','(앉아서 기다린다.)'],
    choiceResults:[
      {favor:0, branch:'wait', flags:['D2_POPPY_FOUND','EVT_D2_001_A_DONE'], lines:[
        '(손을 내밀었다.)',
        '(뽀삐가 물러났다.)',
        '(봉투 사이로 더 깊이 들어갔다.),,',
        '(조급하게 굴면 안 되는 거였다.)',
      ]},
      {favor:0, branch:'wait', flags:['D2_POPPY_FOUND','EVT_D2_001_A_DONE'], lines:[]},
    ],
    continuations:{
      wait:{
        lines:[
          '(그냥 앉았다.)',
          '(쓰레기장 바닥이다. 별로 앉고 싶은 자리는 아니었다.),,',
          '(아무것도 안 했다.)',
          '(핸드폰도 안 봤다.),,',
          '(5분쯤 지났다.),,',
          '(뽀삐가 봉투 밖으로 코를 내밀었다.),,',
          '(또 5분.),,',
          '(내 신발 냄새를 맡았다.)',
          '(한참 맡았다.),,',
          '(그리고 다리 사이로 들어왔다.)',
          '(생각보다 가벼웠다.),,',
          '(목줄은 없었다.)',
        ],
        choices:null, choiceResults:null,
      },
    },
  },

  // ── EVT_D2_001 분기 B — 쓰레기장에서 기다렸지만 선형이가 안 나온다 ──
  'EVT_D2_001_B':{
    requireDay:2,
    _forceOpen:true,
    room:'쓰레기장', loc:'쓰레기장',
    bg:'배경/쓰레기장.png', char:'x',
    onEnd:null,
    lines:[
      '(쓰레기장 앞에서 기다렸다.),,',
      '(5분.),,',
      '(10분.),,',
      '(201호는 나오지 않았다.)',
      '(혼자 주변을 둘러봤다.)',
      '(봉투를 몇 개 들춰봤다.)',
      '(없었다.),,',
      '(돌아가자.)',
    ],
    choices:['(돌아간다)'],
    choiceResults:[{favor:0, flags:['EVT_D2_001_B_WAIT_DONE'], lines:[]}],
  },

  // ── EVT_D2_003 고재엽 복도 마주침 (2F복도) ──
  'EVT_D2_003':{
    requireDay:2,
    _forceOpen:true,
    room:'2층 복도', loc:'2F복도',
    bg:'배경/2F복도.png',
    onEnd:null,
    lines:[
      '(2층 복도다.)',
      '(복도 끝에 사람이 서 있다.),,',
      '(202호 앞이 아니다. 그냥 벽 앞이다.),,',
      '(발소리를 듣고 돌아봤다.)',
      '!202',
      {speaker:'고재엽',text:'아, 경비원님.'},
      {speaker:'고재엽',text:'순찰이에요?'},
      {speaker:'경비',text:'네. 2층 쪽 돌고 있어서요.'},
      {speaker:'고재엽',text:'그렇군요.'},
      {speaker:'고재엽',text:'어제 인사드리고 처음이네요.'},
      {speaker:'경비',text:'그러네요.'},
      {speaker:'고재엽',text:'적응은 좀 되세요?'},
      {speaker:'경비',text:'아직 이틀째라서요.'},
      {speaker:'고재엽',text:'그렇죠.'},
      '(카메라를 목에 걸고 있다. 오늘도.)',
      {speaker:'고재엽',text:'여기 조용하죠.'},
      {speaker:'경비',text:'조용한가요.'},
      {speaker:'고재엽',text:'밤엔 조용해요.'},
    ],
    choices:['뭐 하고 계셨어요?','사진 찍으러 나가세요?','(그냥 지나친다)'],
    choiceResults:[
      {favor:+2, flags:['HINT_202_WALL','EVT_D2_003_DONE'], lines:[
        {speaker:'고재엽',text:'별 거 아니에요.'},
        {speaker:'고재엽',text:'그냥 서 있었어요.'},
        '(대답이 짧다.)',
        '(더 설명하지 않는다.),,',
        {speaker:'경비',text:'아, 네.'},
        {speaker:'고재엽',text:'수고하세요.'},
        '(지나쳐서 몇 걸음 갔다.),,',
        '(돌아봤다.)',
        '(고재엽은 아직 그 자리에 있었다.)',
        '(이번엔 벽을 안 보고 있었다.),,',
      ]},
      {favor:+1, flags:['EVT_D2_003_DONE'], lines:[
        {speaker:'고재엽',text:'나중에요.'},
        {speaker:'고재엽',text:'지금은 빛이 안 좋아서.'},
        {speaker:'경비',text:'아, 네.'},
        {speaker:'고재엽',text:'수고하세요.'},
        '(지나쳐서 몇 걸음 갔다.),,',
        '(돌아봤다.)',
        '(고재엽은 아직 그 자리에 있었다.)',
        '(이번엔 벽을 안 보고 있었다.),,',
      ]},
      {favor:0, flags:['EVT_D2_003_DONE'], lines:[
        {speaker:'고재엽',text:'수고하세요.'},
        '(지나쳐서 몇 걸음 갔다.),,',
        '(돌아봤다.)',
        '(고재엽은 아직 그 자리에 있었다.)',
        '(이번엔 벽을 안 보고 있었다.),,',
      ]},
    ],
  },

  // ── EVT_D2_TIKI_002 선형이 × 고재엽 (2F복도 재진입) ──
  'EVT_D2_TIKI_002':{
    requireDay:2,
    _forceOpen:true,
    room:'2층 복도', loc:'2F복도',
    bg:'배경/2F복도.png',
    onEnd:null,
    lines:[
      '(2층 복도다.),,',
      '(201호 문이 열렸다.)',
      '(선형이가 봉투를 들고 나왔다.),,',
      '(202호 문도 열렸다.)',
      '(고재엽이었다.),,',
      '(두 사람이 복도에서 마주쳤다.)',
      '(선형이가 멈췄다.)',
      '!202',
      {speaker:'고재엽',text:'선형 씨.'},
      {speaker:'고재엽',text:'쓰레기 버리러 나왔어요?'},
      '!201',
      '(선형이가 봉투를 꼭 쥐었다.)',
      {speaker:'김선형',text:'...네.'},
      {speaker:'고재엽',text:'뽀삐는 찾았다면서요. 다행이네요.'},
      {speaker:'김선형',text:'네... 감사해요.'},
      '(눈을 안 마주친다.)',
      {speaker:'고재엽',text:'어제 많이 걱정했죠.'},
      {speaker:'김선형',text:'...네.'},
      {speaker:'고재엽',text:'밤에 계속 왔다갔다 하시던데.'},
      {speaker:'김선형',text:'......'},
      '(선형이가 봉투를 반대쪽 손으로 바꿔 들었다.)',
      '(고재엽이 나를 봤다.)',
      {speaker:'고재엽',text:'경비원님도 순찰이에요?'},
    ],
    choices:['(선형이한테 말 건다)','(고재엽한테 말 건다)','(아무 말 안 한다)'],
    choiceResults:[
      {favor:+4, flags:['EVT_D2_TIKI_002_DONE'], lines:[
        {speaker:'경비',text:'선형 씨, 별일 없으시죠?'},
        '(선형이가 나를 봤다.)',
        '(조금 풀렸다.)',
        {speaker:'김선형',text:'아 네.'},
        {speaker:'김선형',text:'뽀삐가 오늘 밥 다 먹었어요.'},
        {speaker:'김선형',text:'어제는 안 먹었는데.'},
        {speaker:'경비',text:'다행이네요.'},
        {speaker:'김선형',text:'네.'},
        '(봉투를 들고 계단으로 내려갔다.)',
        '!201x',
        {speaker:'고재엽',text:'선형 씨가 저렇게 말 많은 건 처음 봐요.'},
        {speaker:'경비',text:'......'},
        {speaker:'고재엽',text:'좋은 일이죠.'},
        '!202x',
        '(복도에 혼자 남았다.),,',
        '(201호 문 앞에 사료 봉투가 하나 놓여 있다.)',
        '(뜯지 않은 새 거다.),,',
      ]},
      {favor:-1, _favorMap:{'202':+2}, flags:['EVT_D2_TIKI_002_DONE'], lines:[
        {speaker:'경비',text:'네. 2층 쪽 봐야 해서요.'},
        {speaker:'고재엽',text:'그렇군요. 수고하세요.'},
        '(그 틈에 선형이가 계단으로 빠져나갔다.)',
        '!201x',
        '(거의 뛰다시피 갔다.)',
        {speaker:'고재엽',text:'......'},
        {speaker:'고재엽',text:'제가 뭘 잘못했나요.'},
        {speaker:'경비',text:'아뇨.'},
        {speaker:'고재엽',text:'그렇겠죠.'},
        '!202x',
        '(복도에 혼자 남았다.),,',
        '(201호 문 앞에 사료 봉투가 하나 놓여 있다.)',
        '(뜯지 않은 새 거다.),,',
      ]},
      {favor:0, flags:['EVT_D2_TIKI_002_DONE'], lines:[
        '(둘 다 나를 보다가 각자 갔다.),,',
        '(선형이가 먼저 내려갔다.)',
        '!201x',
        '(고재엽은 문 앞에 조금 더 서 있었다.)',
        '!202x',
        '(복도에 혼자 남았다.),,',
        '(201호 문 앞에 사료 봉투가 하나 놓여 있다.)',
        '(뜯지 않은 새 거다.),,',
      ]},
    ],
  },

  // Day1 보완 — 1층 복도 담배꽁초 조사(행동형 선택지). CHAT_101_REPLIED(101호 민원 답장) 이후 1회.
  'EVT_D1_HALLWAY_CIGAR':{
    requireDay:1,
    _forceOpen:true,
    room:'1층 복도', loc:'1F복도',
    bg:'배경/1F복도.png',
    onEnd:null,
    lines:[
      '(1층 복도다.)',
      '(101호 문 앞에 담배꽁초가 몇 개 떨어져 있다.)',
      '(방금 민원으로 들었던 그 얘기다.)',
    ],
    choices:['주워서 치운다','그냥 둔다'],
    choiceResults:[
      {favor:0,flags:['EVT_D1_CIGAR_CLEANED','EVT_D1_HALLWAY_CIGAR_DONE'],lines:['(손으로 주워 담았다.)','(별거 아닌 일인데 괜히 뿌듯하다.)']},
      {favor:0,flags:['EVT_D1_CIGAR_LEFT','EVT_D1_HALLWAY_CIGAR_DONE'],lines:['(그냥 지나쳤다.)','(내 일은 아니다.)']},
    ],
  },

  // ── EVT_D2_TIKI_001 명성 × 염지혜 (1F복도) ──
  'EVT_D2_TIKI_001':{
    requireDay:2,
    _forceOpen:true,
    room:'1층 복도', loc:'1F복도',
    bg:'배경/1F복도.png',
    onEnd:null,
    lines:[
      '(1층 복도로 나왔다.)',
      '(두 사람이 있다.),,',
      '!101 !102',
      '(마주쳐서 서 있다.)',
      '(아무도 안 비켜준다.),,',
      '(염지혜가 먼저 지나치려 했다.)',
      {speaker:'명성',text:'야.'},
      '(염지혜가 멈췄다.)',
      {speaker:'염지혜',text:'......'},
      {speaker:'명성',text:'담배 얘기 한 거 너지?'},
      {speaker:'염지혜',text:'모르는 소리 하지 마요.'},
      {speaker:'명성',text:'복도에 사는 사람이 넷인데.'},
      {speaker:'염지혜',text:'그래서요?'},
      {speaker:'명성',text:'아 씨발 진짜.'},
      '(둘 다 나를 봤다.)',
      {speaker:'염지혜',text:'어. 경비원님.'},
      {speaker:'명성',text:'형 왔네.'},
      '(동시에 말했다. 서로 다른 말로.)',
    ],
    choices:[
      '(명성한테) 복도에서 이러시면 안 되죠.',
      '(염지혜한테) 그냥 넘어가 주시면 안 될까요.',
      '두 분 다 들어가세요.',
      '(그냥 지나간다)',
    ],
    choiceResults:[
      {favor:-2, _favorMap:{'102':+2}, flags:['EVT_D2_TIKI_001_DONE','HINT_101_102_D2'], lines:[
        {speaker:'명성',text:'알아요 알아. 죄송합니다.'},
        '!102',
        {speaker:'명성',text:'근데 형.'},
        {speaker:'명성',text:'저 아직 아무것도 안 했는데요.'},
        {speaker:'경비',text:'......'},
        '(염지혜가 콧방귀를 뀌고 지나갔다.)',
        '!101x',
        {speaker:'명성',text:'봐요. 저래요 맨날.'},
        '!102x',
        '(복도가 조용해졌다.),,',
        '(101호랑 102호는 마주 보고 있다.)',
        '(문이 세 걸음 거리다.),,',
      ]},
      {favor:+2, _favorMap:{'102':-2}, flags:['EVT_D2_TIKI_001_DONE','HINT_101_102_D2'], lines:[
        {speaker:'염지혜',text:'제가 왜요.'},
        {speaker:'경비',text:'......'},
        {speaker:'염지혜',text:'제가 왜 넘어가야 되는데요.'},
        '(말이 빨라졌다.)',
        {speaker:'염지혜',text:'저는 그냥 자고 싶고 냄새 안 맡고 싶은 건데'},
        {speaker:'염지혜',text:'그게 그렇게 큰 요구예요?'},
        {speaker:'경비',text:'아뇨.'},
        {speaker:'염지혜',text:'그럼 됐어요.'},
        '(들어갔다.)',
        '!101x',
        {speaker:'명성',text:'하.'},
        '!102x',
        '(복도가 조용해졌다.),,',
        '(101호랑 102호는 마주 보고 있다.)',
        '(문이 세 걸음 거리다.),,',
      ]},
      {favor:+1, _favorMap:{'102':+1}, flags:['EVT_D2_TIKI_001_DONE','HINT_101_102_D2'], lines:[
        '(둘이 나를 봤다.)',
        '(명성이 먼저 돌아섰다.)',
        {speaker:'명성',text:'예.'},
        '!102x',
        '(염지혜도 들어갔다. 아무 말 없이.)',
        '!101x',
        '(복도가 조용해졌다.),,',
        '(101호랑 102호는 마주 보고 있다.)',
        '(문이 세 걸음 거리다.),,',
      ]},
      {favor:0, _neglect:true, flags:['EVT_D2_TIKI_001_DONE','HINT_101_102_D2'], lines:[
        '(지나쳤다.)',
        {speaker:'명성',text:'(등 뒤에서) 융통성 없는 건 둘 다네.'},
        {speaker:'염지혜',text:'뭐랬냐?'},
        '(복도가 조용해졌다.),,',
        '(101호랑 102호는 마주 보고 있다.)',
        '(문이 세 걸음 거리다.),,',
      ]},
    ],
  },

  // ── EVT_D2_005 3층에서 뭔가 봄 (선택지 없음 / 매소련 대사 없음) ──
  'EVT_D2_005':{
    requireDay:2,
    _forceOpen:true,
    room:'3층 복도', loc:'3F복도',
    bg:'배경/3F복도.png', char:'x',
    onEnd:'EVT_D2_TIKI_003',
    lines:[
      '(계단을 올라갔다.)',
      '(3층은 처음이다.),,',
      '(복도 끝에 누군가 있었다.)',
      '(등만 보인다.),,',
      '(봉투를 끌고 있었다.)',
      '(바닥에 끌리는 소리가 났다.),,',
      '(이쪽을 보지 않았다.)',
      '(301호 문이 열렸다.)',
      '(들어갔다.)',
      '(문이 닫혔다.),,',
      '(복도에 냄새가 남았다.)',
    ],
    choices:['(내려간다)'],
    choiceResults:[{favor:0, flags:['EVT_D2_005_DONE','MATSORYEON_SEEN_1','EVT_301_SEEN'], lines:[]}],
  },

  // ── EVT_D2_TIKI_003 3층 봉투 (3F 재방문) ──
  'EVT_D2_TIKI_003':{
    requireFlag:'EVT_D2_005_DONE',
    _forceOpen:true,
    room:'3층 복도', loc:'3F복도',
    bg:'배경/3F복도.png', char:'x',
    onEnd:'EVT_301_DONE',
    lines:[
      '(다시 3층이다.),,',
      '(복도 가운데에 봉투가 하나 떨어져 있다.)',
      '(아까 끌던 것 중 하나인 것 같다.),,',
    ],
    choices:['(들여다본다.)','(301호 앞에 놔둔다.)','(그냥 내려간다.)'],
    choiceResults:[
      {favor:0, flags:['D2_SAW_BAG','EVT_D2_TIKI_003_DONE'], lines:[
        '(묶여 있지 않았다.)',
        '(안이 보였다.),,',
        '(플라스틱 뚜껑. 단추. 빨래집게.)',
        '(전선 조각. 길이가 다 다르다.)',
        '(누가 봐도 쓰레기다.),,',
        '(그런데 종류별로 나뉘어 있었다.)',
      ]},
      {favor:+3, flags:['EVT_D2_TIKI_003_DONE'], lines:[
        '(봉투를 301호 문 앞으로 옮겼다.),,',
        '(안에서 소리가 멎었다.),,',
        '(기다렸다.)',
        '(문은 안 열렸다.),,',
        '(내려왔다.)',
      ]},
      {favor:0, flags:['EVT_D2_TIKI_003_DONE'], lines:[]},
    ],
  },

  // ── Day5 — 매소련 벽에 귀 대기 씬 (2F복도)
  // ══════════════════════════════════════
  // Day3 대면 씬
  // ══════════════════════════════════════

  // ── EVT_D3_002 쓰레기장 사진 확인 (사진 3장을 한 장씩) ──
  'EVT_D3_002_PHOTO':{
    requireDay:3,
    _forceOpen:true,
    room:'쓰레기장', loc:'쓰레기장',
    bg:'배경/쓰레기장.png', char:'x',
    onEnd:null,
    lines:[
      '(쓰레기장이다.)',
      '(구석에 사진 몇 장이 흩어져 있다.)',
      '(바람에 밀려 벽 쪽에 붙어 있었다.),,',
      '(주웠다.)',
      '(흑백이다. 필름 카메라로 찍은 것 같다.)',
      '(가장자리가 살짝 그을려 있다. 현상소 마크.),,',
      '(첫 번째 장.)',
      '(101호 복도다.)',
      '(염지혜다. 담배를 피우고 있다. 옆모습.)',
      '(밤인 것 같다. 복도등이 꺼져 있다.),,',
      '(뒷면에 날짜가 적혀 있었다. 손글씨로.)',
      '(두 번째 장.)',
      '(계단이다.)',
      '(명성이다. 이어폰을 끼고 계단을 오르고 있다.)',
      '(뭔가 흥얼거리는 입 모양이다.),,',
      '(뒷면에도 날짜.)',
      '(세 번째 장.)',
      '(201호 문 앞이다.)',
      '(선형이다. 문을 아주 조금 열고 복도를 내다보고 있다.)',
      '(표정까지 다 보인다.),,',
      '(문틈이 그렇게 넓지 않았을 텐데.)',
      '(이 각도로, 이만큼 가까이서 찍으려면 복도 반대편에 서 있어야 한다.)',
      '(반대편엔 벽뿐이다.),,',
    ],
    choices:['(사진을 챙긴다)','(그냥 두고 간다)'],
    choiceResults:[
      {favor:0, flags:['EVT_D3_002_DONE','EVT_D3_002_PHOTO'], lines:[
        '(세 장 다 챙겼다.)',
        '(쓰레기장을 나왔다.),,',
        '(누가 이걸 여기다 뒀는지는 알 수 없다.)',
        '(버린 건지, 두고 간 건지도.)',
      ]},
      {favor:0, flags:['EVT_D3_002_DONE','EVT_D3_002_SKIP'], lines:[
        '(사진을 원래 자리에 뒀다.)',
        '(쓰레기장을 나왔다.),,',
        '(누가 이걸 여기다 뒀는지는 알 수 없다.)',
        '(버린 건지, 두고 간 건지도.)',
      ]},
    ],
  },

  // ── EVT_D3_003 고재엽한테 물어본다 ──
  'EVT_D3_003':{
    requireDay:3,
    requireFlag:'EVT_D3_002_DONE',
    room:'202호', loc:'202호 앞',
    bg:'배경/202문닫힘.png',
    onEnd:'EVT_202_DONE',
    lines:[
      '!202문열림 !202',
      '(노크하자 바로 열렸다. 카메라가 목에 걸려 있다.)',
      {speaker:'고재엽',text:'사진 때문에 오셨죠?'},
      {speaker:'경비',text:'아셨어요?'},
      {speaker:'고재엽',text:'민원 들어왔을 것 같아서요.'},
    ],
    choices:['이 사진 찍으셨어요?','쓰레기장 사진 보셨어요?'],
    choiceResults:[
      {favor:+1, flags:['EVT_D3_003_DONE','CONFRONTED_202','EVT_D3_003_A'], lines:[
        {speaker:'고재엽',text:'...네. 찍었어요.'},
        {speaker:'고재엽',text:'근데 버린 건 저 아니에요.'},
        {speaker:'경비',text:'그러면 누가요?'},
        {speaker:'고재엽',text:'모르겠어요. 현상해서 방에 뒀는데.'},
        {speaker:'고재엽',text:'며칠 전에 몇 장 없어진 것도 있었어요. 신경 안 썼는데.'},
        '(잠깐 말을 멈췄다.)',
        {speaker:'고재엽',text:'경비원님. 이 빌라.'},
        {speaker:'경비',text:'네?'},
        {speaker:'고재엽',text:'...아뇨. 나중에 얘기해요.'},
        '!202문닫힘 !202x',
        '(문이 닫혔다.),,',
        '(방에서 없어진 사진. 쓰레기장에 나타난 사진.)',
        '(그 사이에 누가 있었는지는 아직 모른다.)',
      ]},
      {favor:0, flags:['EVT_D3_003_DONE','MENTIONED_202'], lines:[
        {speaker:'고재엽',text:'알고 있어요. 제 사진이 맞는데 거기 버린 건 저 아니에요.'},
        {speaker:'고재엽',text:'저도 이상하다고 생각해요.'},
        '!202문닫힘 !202x',
        '(문이 닫혔다.),,',
        '(방에서 없어진 사진. 쓰레기장에 나타난 사진.)',
        '(그 사이에 누가 있었는지는 아직 모른다.)',
      ]},
    ],
  },

  // ── EVT_D3_005 매소련 첫 대면 ──
  'EVT_D3_005':{
    requireDay:3,
    _altIfFavorBelow:{id:'301', min:20, use:'EVT_D3_005_LOW'},
    room:'301호', loc:'301호 앞',
    bg:'배경/301문닫힘.png',
    onEnd:'EVT_301_DONE',
    lines:[
      '(301호 문이 반쯤 열려 있다.)',
      '(안에서 뭔가를 끌어당기는 소리가 들린다.),,',
      '(노크했다.)',
      '!301문열림 !301',
      '(문이 열렸다. 처음으로 얼굴을 제대로 봤다.)',
      {speaker:'매소련',text:'으하. 경비원님이요.'},
      {speaker:'경비',text:'안녕하세요. 이번에 새로 온 경비예요.'},
      {speaker:'매소련',text:'알아요. 알고 있어요. 봤어요.'},
      {speaker:'경비',text:'...보셨다고요?'},
      {speaker:'매소련',text:'맨날 봐요. 순찰 도시잖아요.'},
      {speaker:'매소련',text:'월. 화. 수. 시간도 똑같고.'},
      {speaker:'경비',text:'......그런가요.'},
      {speaker:'매소련',text:'그런가요 그런가요.'},
    ],
    choices:['게시판 글 쓰신 거 맞죠?','뭘 들고 계세요?','별 일 없으시죠?'],
    choiceResults:[
      {favor:+2, flags:['EVT_D3_005_DONE','MATSORYEON_MET'], lines:[
        {speaker:'매소련',text:'으하하하하하.'},
        {speaker:'매소련',text:'경비원님 눈치 있어요.'},
        {speaker:'매소련',text:'맞아요 맞아 제가 썼어요.'},
        {speaker:'매소련',text:'근데 거짓말은 안 했어요. 하나도.'},
        '!301문닫힘 !301x',
        '(문이 닫혔다.)',
        '(안에서 다시 끄는 소리가 시작됐다.),,',
        '(방금 그 말버릇 — 뭐든 두 번씩 말한다는 걸 그제야 알아챘다.)',
      ]},
      {favor:+2, flags:['EVT_D3_005_DONE','MATSORYEON_MET','HINT_301_BAG','D2_SAW_BAG'], lines:[
        {speaker:'매소련',text:'이요? 이거요?'},
        '(봉투를 들어 보인다. 안에 여러 개 들어 있다.)',
        '(플라스틱 조각. 단추. 그리고—)',
        '(가죽 끈 같은 게 하나 있었다.),,',
        {speaker:'매소련',text:'주운 거예요. 여러 개.'},
        {speaker:'경비',text:'......아, 네.'},
        {speaker:'매소련',text:'버린 사람 잘못이지 주운 사람 잘못이에요?'},
        '!301문닫힘 !301x',
        '(문이 닫혔다.)',
        '(안에서 다시 끄는 소리가 시작됐다.),,',
        '(방금 그 말버릇 — 뭐든 두 번씩 말한다는 걸 그제야 알아챘다.)',
      ]},
      {favor:+1, flags:['EVT_D3_005_DONE','MATSORYEON_MET'], lines:[
        {speaker:'매소련',text:'있어요.'},
        {speaker:'경비',text:'네?'},
        {speaker:'매소련',text:'농담이에요 으하하.'},
        {speaker:'매소련',text:'없어요 없어. 맨날 똑같아요.'},
        '!301문닫힘 !301x',
        '(문이 닫혔다.)',
        '(안에서 다시 끄는 소리가 시작됐다.),,',
        '(방금 그 말버릇 — 뭐든 두 번씩 말한다는 걸 그제야 알아챘다.)',
      ]},
    ],
  },
  // 호감도 20 미만 — 게시판 글을 물으면 부인하고 문을 닫는다
  'EVT_D3_005_LOW':{
    requireDay:3,
    room:'301호', loc:'301호 앞',
    bg:'배경/301문닫힘.png',
    onEnd:'EVT_301_DONE',
    lines:[
      '(301호 문이 반쯤 열려 있다.)',
      '(안에서 뭔가를 끌어당기는 소리가 들린다.),,',
      '(노크했다.)',
      '!301문열림 !301',
      '(문이 열렸다. 처음으로 얼굴을 제대로 봤다.)',
      {speaker:'매소련',text:'으하. 경비원님이요.'},
      {speaker:'경비',text:'안녕하세요. 이번에 새로 온 경비예요.'},
      {speaker:'매소련',text:'알아요. 알고 있어요. 봤어요.'},
      {speaker:'매소련',text:'맨날 봐요. 순찰 도시잖아요.'},
      {speaker:'매소련',text:'월. 화. 수. 시간도 똑같고.'},
    ],
    choices:['게시판 글 쓰신 거 맞죠?','뭘 들고 계세요?'],
    choiceResults:[
      {favor:-3, flags:['EVT_D3_005_DONE','MATSORYEON_MET'], lines:[
        {speaker:'매소련',text:'아니에요.'},
        {speaker:'매소련',text:'제가 왜요.'},
        '!301문닫힘 !301x',
        '(문이 닫혔다.),,',
      ]},
      {favor:+2, flags:['EVT_D3_005_DONE','MATSORYEON_MET','HINT_301_BAG','D2_SAW_BAG'], lines:[
        {speaker:'매소련',text:'이요? 이거요?'},
        '(봉투를 들어 보인다. 안에 여러 개 들어 있다.)',
        '(플라스틱 조각. 단추. 그리고—)',
        '(가죽 끈 같은 게 하나 있었다.),,',
        {speaker:'매소련',text:'주운 거예요. 여러 개.'},
        {speaker:'매소련',text:'버린 사람 잘못이지 주운 사람 잘못이에요?'},
        '!301문닫힘 !301x',
        '(문이 닫혔다.),,',
      ]},
    ],
  },

  // ── EVT_D3_006 밴드 관계 노출 (대면 루트) ──
  'EVT_D3_006':{
    requireDay:3,
    requireFlag:'HINT_101_102',
    room:'102호', loc:'102호 앞',
    bg:'배경/102문닫힘.png',
    onEnd:null,
    lines:[
      '!102문열림 !102',
      {speaker:'경비',text:'혹시 101호 분이랑 아는 사이세요?'},
      '(명성이 잠깐 굳었다.)',
      {speaker:'명성',text:'...어떻게 알아요?'},
      {speaker:'경비',text:'두 분 대화 보니까 좀 그래서요.'},
      {speaker:'명성',text:'......'},
      {speaker:'명성',text:'같은 밴드였어요. 옛날에.'},
      {speaker:'명성',text:'걔가 나갔어요. 갑자기.'},
    ],
    choices:['이유가요?'],
    choiceResults:[{favor:0, flags:['EVT_D3_006_DONE','BAND_REVEALED'], lines:[
      {speaker:'명성',text:'몰라요.'},
      '(창밖을 봤다.)',
      {speaker:'명성',text:'제가 잘못한 게 있는지도 모르고.'},
      {speaker:'명성',text:'근데 연락을 끊어버리니까. 어떻게 알아요.'},
      {speaker:'경비',text:'......'},
      {speaker:'명성',text:'왜요. 뭐 알아내려고요?'},
      {speaker:'경비',text:'아뇨.'},
      {speaker:'명성',text:'그럼 됐어요.'},
      '!102문닫힘 !102x',
    ]}],
  },

  // ── EVT_D3_TIKI_001 명성 × 고재엽 — 2층 복도 ──
  'EVT_D3_TIKI_001':{
    requireDay:3,
    requireFlag:'EVT_D3_003_DONE',
    _forceOpen:true,
    _hideCharPanel:true,
    room:'2층 복도', loc:'2층 복도',
    bg:'배경/2F복도.png', char:'x',
    onEnd:null,
    lines:[
      '(2층 복도. 명성이 걸어오다 202호 앞에서 멈췄다.)',
      '(고재엽이 막 나오는 참이었다.),,',
      '!102 !202',
      {speaker:'명성',text:'...아.'},
      {speaker:'고재엽',text:'명성 씨. 어디 가요?'},
      {speaker:'명성',text:'그냥요.'},
      {speaker:'고재엽',text:'사진 얘기 때문에 불편하죠?'},
      {speaker:'명성',text:'...별로요.'},
      {speaker:'고재엽',text:'저도 황당해요. 제 사진인데 거기 있으니까.'},
      {speaker:'명성',text:'근데 찍은 건 맞잖아요.'},
      {speaker:'고재엽',text:'맞아요. 찍은 건 맞아요.'},
      '(나를 봤다.)',
      {speaker:'고재엽',text:'경비원님도 조사 중이시죠?'},
    ],
    choices:['저도 여쭤볼 게 있었는데요.','사진 얘기 잠깐 해도 될까요?','(아무 말 않고 지나간다)'],
    choiceResults:[
      {favor:0, _favorMap:{'102':+2,'202':-1}, flags:['EVT_D3_TIKI_001_DONE'], lines:[
        {speaker:'명성',text:'어? 아 네.'},
        {speaker:'고재엽',text:'물론이죠. 말씀하세요.'},
        '!102x !202x',
      ]},
      {favor:0, _favorMap:{'202':+1}, flags:['EVT_D3_TIKI_001_DONE'], lines:[
        {speaker:'명성',text:'저도 그거 말하려고 했는데.'},
        {speaker:'고재엽',text:'들어와요. 셋이 얘기해요.'},
        '!102x !202x',
      ]},
      {favor:0, flags:['EVT_D3_TIKI_001_DONE'], lines:[
        {speaker:'명성',text:'뭐야.'},
        {speaker:'고재엽',text:'바쁘신가봐요.'},
        '!102x !202x',
      ]},
    ],
  },

  // ── EVT_D3_TIKI_002 염지혜 × 매소련 — 3층 계단 ──
  'EVT_D3_TIKI_002':{
    requireDay:3,
    requireFlag:'EVT_D3_005_DONE',
    _forceOpen:true,
    _hideCharPanel:true,
    room:'3층 계단', loc:'3층 계단',
    bg:'배경/3F복도.png', char:'x',
    onEnd:null,
    lines:[
      '(계단을 내려오다 멈췄다.)',
      '(아래 층계참에 두 사람이 있다.),,',
      '!101',
      '(염지혜가 3층 계단 앞에 서 있다.)',
      '(뭘 하러 온 건지는 모르겠다.)',
      '!301',
      '(매소련이 복도 끝에서 이쪽을 보고 있다.),,',
      '(염지혜가 한 발 물러났다.)',
      '(다시 한 발.)',
      '(계단 난간을 잡았다.)',
      {speaker:'매소련',text:'아 경비원님도 있네요. 으하하.'},
      {speaker:'매소련',text:'마침 잘 왔어요 마침.'},
      '!101',
      '(염지혜가 나를 봤다.)',
      '(평소랑 다르다. 목소리가 한 톤 낮다.)',
      {speaker:'염지혜',text:'......경비원님.'},
      {speaker:'염지혜',text:'저 사람 원래 여기 있어요?'},
      {speaker:'경비',text:'3층 사시니까요.'},
      {speaker:'염지혜',text:'......그렇구나.'},
      {speaker:'매소련',text:'무섭죠. 처음엔 다 그래요.'},
      {speaker:'매소련',text:'저도 그랬어요. 처음엔.'},
    ],
    choices:['(염지혜한테 다가간다)','(매소련한테 다가간다)'],
    choiceResults:[
      {favor:0, _favorMap:{'101':+3}, flags:['EVT_D3_TIKI_002_DONE'], lines:[
        {speaker:'경비',text:'내려가시죠.'},
        '(염지혜가 바로 따라왔다. 평소보다 빨리.)',
        '(계단을 내려오면서 조용히 말했다.)',
        {speaker:'염지혜',text:'저 사람 진짜 이상해요.'},
        {speaker:'염지혜',text:'무슨 말인지는 모르겠는데 자꾸 아는 척을 해요.'},
        {speaker:'염지혜',text:'......아니에요. 아무것도 아니에요.'},
        '!101x !301x',
        '(3층 복도가 다시 조용해졌다.),,',
        '(염지혜가 이렇게 흔들리는 건 처음 봤다.)',
      ]},
      {favor:0, _favorMap:{'301':+1}, flags:['EVT_D3_TIKI_002_DONE','EVT_D3_TIKI_002_B'], lines:[
        '(염지혜가 그 틈에 계단을 내려갔다. 뒤도 안 돌아보고.)',
        '!101x',
        {speaker:'매소련',text:'경비원님 물어볼 거 있어요?'},
        {speaker:'경비',text:'아뇨. 그냥 지나가다가.'},
        {speaker:'매소련',text:'그렇구나 그렇구나.'},
        '(매소련이 웃으며 문을 닫았다.)',
        '!301문닫힘 !301x',
        '(3층 복도가 다시 조용해졌다.),,',
        '(염지혜가 이렇게 흔들리는 건 처음 봤다.)',
      ]},
    ],
  },

  // ══════════════════════════════════════
  // Day4 대면 씬
  // ══════════════════════════════════════

  // ── EVT_D4_002 게시판 작성자 자백 (301호). 호감도 30 기준으로 갈린다 ──
  'EVT_D4_002':{
    requireDay:4,
    _altIfFavorBelow:{id:'301', min:30, use:'EVT_D4_002_BAD'},
    room:'301호', loc:'301호 앞',
    bg:'배경/301문닫힘.png',
    onEnd:null,
    lines:[
      '(요즘 CCTV에 봉투를 끄는 사람이 3층으로 올라가는 게 자주 잡혔다.)',
      '(화질이 나빠서 얼굴은 안 보였다. 그래도 짐작은 갔다.),,',
      '(노크했다.)',
      '(안에서 부스럭거리는 소리가 났다. 뭔가를 급하게 치우는 소리 같았다.)',
      '!301문열림 !301',
      '(문이 열렸다. 뒤로 방 안이 살짝 보였다.)',
      '(선반에 뭔가가 줄지어 놓여 있다. 색깔별로. 크기순으로.)',
      '(자세히 보기도 전에 매소련이 몸으로 문을 반쯤 가렸다.)',
      {speaker:'매소련',text:'어 경비원님이네요 경비원님.'},
      {speaker:'경비',text:'안녕하세요.'},
      {speaker:'매소련',text:'요즘 자주 오시네요 자주.'},
      {speaker:'경비',text:'...그런가요.'},
      {speaker:'매소련',text:'그런가요 그런가요.'},
      {speaker:'경비',text:'뭐 정리하고 계셨어요?'},
      {speaker:'매소련',text:'정리요? 아니요.'},
      {speaker:'매소련',text:'그냥, 두는 거예요. 정리는 아니에요.'},
    ],
    choices:['게시판 글, 쓰신 거 맞죠?'],
    choiceResults:[{favor:+5, flags:['EVT_D4_002_DONE','BOARD_SOLVED_GOOD','BOARD_MYSTERY_CLOSED'], lines:[
      {speaker:'매소련',text:'으하하하하하.'},
      {speaker:'매소련',text:'맞아요 맞아요 제가 썼어요.'},
      {speaker:'매소련',text:'진작 물어볼 줄 알았어요. 진작.'},
      {speaker:'경비',text:'왜 쓰신 거예요?'},
      {speaker:'매소련',text:'경비원님이 좋아서요.'},
      {speaker:'매소련',text:'매일 돌아다니고 뭔가 찾는 것 같고.'},
      {speaker:'매소련',text:'저도 그러거든요. 저도.'},
      {speaker:'매소련',text:'근데 저는 하나도 못 찾았어요. 경비원님은 찾으실 것 같아요.'},
      {speaker:'경비',text:'...뭘 찾고 계셨는데요?'},
      {speaker:'매소련',text:'그거요.'},
      {speaker:'매소련',text:'그거 있잖아요.'},
      {speaker:'매소련',text:'몰라요. 저도 몰라요. 근데 찾으면 알 것 같아요.'},
      {speaker:'경비',text:'......감사합니다? 아마도.'},
      {speaker:'매소련',text:'아마도 아마도. 으하하.'},
      '!301문닫힘 !301x',
      '(문이 닫혔다.),,',
      '(선반 위에 뭐가 있었는지 결국 못 봤다.)',
      '(색깔별로, 크기순으로. 그것만 눈에 남았다.),,',
      '(게시판 미스터리는 이걸로 끝났다.)',
      '(근데 끝났다는 느낌이 안 든다.)',
    ]}],
  },
  'EVT_D4_002_BAD':{
    requireDay:4,
    room:'301호', loc:'301호 앞',
    bg:'배경/301문닫힘.png',
    onEnd:null,
    lines:[
      '(요즘 CCTV에 봉투를 끄는 사람이 3층으로 올라가는 게 자주 잡혔다.)',
      '(화질이 나빠서 얼굴은 안 보였다. 그래도 짐작은 갔다.),,',
      '(노크했다.)',
      '(안에서 부스럭거리는 소리가 났다. 뭔가를 급하게 치우는 소리 같았다.)',
      '!301문열림 !301',
      '(문이 열렸다. 뒤로 방 안이 살짝 보였다.)',
      '(선반에 뭔가가 줄지어 놓여 있다. 색깔별로. 크기순으로.)',
      '(자세히 보기도 전에 매소련이 몸으로 문을 반쯤 가렸다.)',
      {speaker:'매소련',text:'어 경비원님이네요 경비원님.'},
      {speaker:'경비',text:'안녕하세요.'},
      {speaker:'매소련',text:'요즘 자주 오시네요 자주.'},
      {speaker:'경비',text:'뭐 정리하고 계셨어요?'},
      {speaker:'매소련',text:'정리요? 아니요.'},
      {speaker:'매소련',text:'그냥, 두는 거예요. 정리는 아니에요.'},
    ],
    choices:['게시판 글, 쓰신 거 맞죠?'],
    choiceResults:[{favor:-2, flags:['EVT_D4_002_DONE','BOARD_SOLVED_BAD','BOARD_MYSTERY_CLOSED'], lines:[
      {speaker:'매소련',text:'...맞아요.'},
      {speaker:'경비',text:'왜요?'},
      {speaker:'매소련',text:'경비원님이 뭘 하는 사람인지 모르겠어서요.'},
      {speaker:'매소련',text:'그냥 관리하는 사람이 맞는 건지.'},
      {speaker:'매소련',text:'여기 전 경비원님도 이상했거든요.'},
      {speaker:'경비',text:'전 경비원이요?'},
      {speaker:'매소련',text:'일주일 만에 나갔잖아요. 일주일.'},
      {speaker:'매소련',text:'그것도 이상하죠. 이상하지 않아요?'},
      {speaker:'매소련',text:'경비원님도 곧 그렇게 되지 않을까요.'},
      {speaker:'경비',text:'......그럴 수도 있겠네요.'},
      {speaker:'매소련',text:'그쵸 그쵸.'},
      '(문이 조금 더 닫혔다. 안이 안 보이게.)',
      '!301문닫힘 !301x',
      '(문이 닫혔다.),,',
      '(선반 위에 뭐가 있었는지 결국 못 봤다.)',
      '(색깔별로, 크기순으로. 그것만 눈에 남았다.),,',
      '(게시판 미스터리는 이걸로 끝났다.)',
      '(근데 끝났다는 느낌이 안 든다.)',
    ]}],
  },

  // ── EVT_D4_004_LOW — 호감도 30 미만일 때의 대체 씬 ──
  // *Claude 설계: 벽 얘기를 꺼내놓고 찾아왔는데 아직 이 사람을 집 안에 들일 만큼은
  // 믿지 않는다. 단서(CLUE_002)는 안 주되, "왜 아무 일도 안 일어났는지"는 알려준다.
  // 여지는 남긴다 — Day5 이후 호감도가 오르면 고재엽 쪽에서 먼저 연락이 온다.
  'EVT_D4_004_LOW':{
    room:'202호', loc:'202호 앞',
    bg:'배경/202문닫힘.png',
    onEnd:'EVT_202_DONE',
    lines:[
      '(노크했다.)',
      '!202문열림 !202',
      '(문이 손바닥만큼만 열렸다. 안쪽은 어둡다.)',
      '(시큼한 약품 냄새가 그 틈으로 샜다.)',
      {speaker:'경비',text:'아까 말씀하신 벽이요. 그거 좀 보려고 왔는데요.'},
      {speaker:'고재엽',text:'...아.'},
      '(문틈이 더 열리지는 않았다.),,',
      {speaker:'고재엽',text:'오늘은 좀 그러네요.'},
      {speaker:'경비',text:'제가 뭘 잘못했나요.'},
      {speaker:'고재엽',text:'아뇨.'},
      {speaker:'고재엽',text:'그냥 아직 잘 모르겠어서요. 경비원님을.'},
      {speaker:'경비',text:'......'},
      {speaker:'고재엽',text:'먼저 얘기 꺼낸 건 저니까, 나중에 제가 다시 말씀드릴게요.'},
      '!202문닫힘 !202x',
      '(문이 닫혔다.),,',
      '(벽은 못 봤다.)',
    ],
    choices:['(돌아간다)'],
    choiceResults:[{favor:+1, flags:['EVT_D4_004_LOW_DONE'], lines:[]}],
  },

  // ── EVT_D4_004 고재엽 힌트 — 벽 직접 확인 (CLUE_002) ──
  'EVT_D4_004':{
    requireDay:4,
    requireFlag:'EVT_D4_003_TALKED',
    // _requireFavor → _altIfFavorBelow 로 교체.
    // openFace는 _requireFavor가 걸리면 씬 자체를 버리고 일반 필러로 떨어뜨린다.
    // 그래서 호감도 30 미만이면 "벽 확인하러 오겠다"고 답해놓고 202호 문 앞에 가도
    // 아무 일도 안 일어났다(CLUE_002의 유일한 획득처인데 설명조차 없이 사라짐).
    // EVT_D3_005 / EVT_D4_002 와 같은 방식으로 저호감도 대체 씬을 붙인다.
    _altIfFavorBelow:{id:'202', min:30, use:'EVT_D4_004_LOW'},
    room:'202호', loc:'202호 앞',
    bg:'배경/202문닫힘.png',
    onEnd:'EVT_202_DONE',
    lines:[
      '!202문열림 !202',
      '(문이 열리자 시큼한 약품 냄새가 났다.)',
      '(현상액 냄새다. 방 안쪽에 빨랫줄처럼 뭔가 매달려 있다. 사진들이다.)',
      {speaker:'고재엽',text:'들어오세요. 어차피 볼 거 다 볼 텐데.'},
      {speaker:'경비',text:'이게 다 사진이에요?'},
      {speaker:'고재엽',text:'네. 요즘 건 못 걸어놨어요. 자리가 없어서.'},
      {speaker:'경비',text:'다 뭘 찍으신 거예요?'},
      {speaker:'고재엽',text:'죽은 거요. 대부분.'},
      {speaker:'경비',text:'......'},
      {speaker:'고재엽',text:'안 죽은 것도 있어요. 걱정 마세요.'},
      {speaker:'고재엽',text:'직접 얘기하기 좀 그렇지만.'},
      {speaker:'고재엽',text:'경비원님은 믿을 것 같아서요.'},
      {speaker:'고재엽',text:'이 빌라 들어왔을 때부터 이상하다고 느꼈어요.'},
      '(그는 벽으로 걸어가 손바닥을 댔다.)',
      {speaker:'고재엽',text:'여기요. 두드려 보세요.'},
    ],
    choices:['두드려본다.','그만 돌아간다.'],
    choiceResults:[
      {favor:+3, flags:['EVT_D4_004_DONE'], clues:['CLUE_002'], lines:[
        '(시키는 대로 두드렸다.)',
        '(소리가 이상했다. 안이 빈 것 같았다.)',
        {speaker:'고재엽',text:'반대쪽 벽도 해보세요.'},
        '(반대쪽은 소리가 달랐다. 꽉 찬 소리.)',
        {speaker:'고재엽',text:'벽 두께가 어딘가 달라요.'},
        {speaker:'고재엽',text:'구조를 좀 공부했거든요. 사진 때문에. 건물 구조요.'},
        {speaker:'고재엽',text:'여기는 일반 주거용처럼 안 느껴져요.'},
        {speaker:'경비',text:'......그럼 뭐일 것 같으세요?'},
        {speaker:'고재엽',text:'그 이상은 저도 몰라요.'},
        '(문을 나서면서 다시 그 냄새를 맡았다.)',
        '(현상액 냄새가 아니라 다른 냄새 같기도 했다. 확실친 않다.)',
        '!202문닫힘 !202x',
      ]},
      {favor:0, flags:['EVT_D4_004_DONE'], lines:[
        {speaker:'고재엽',text:'그러세요. 급한 건 아니니까.'},
        '!202문닫힘 !202x',
      ]},
    ],
  },

  // ── EVT_D4_005 101↔102 2차 충돌 ──
  'EVT_D4_005':{
    requireDay:4,
    room:'102호', loc:'102호 앞',
    bg:'배경/102문닫힘.png',
    onEnd:null,
    lines:[
      '!102문닫힘',
      '(102호 앞이다.)',
      '(오늘은 아무 소리도 안 들린다. 노래도, 기타도.),,',
      '(노크했다.)',
      '!102문열림 !102',
      '(명성이 문 열면서 경비 보고 한숨 쉰다.)',
      '(눈 밑이 좀 부었다. 어제 늦게까지 뭔가 한 모양이다.)',
      {speaker:'명성',text:'또 신고했죠?'},
      {speaker:'경비',text:'아직 뭐라고 말씀 안 드렸는데요.'},
      {speaker:'명성',text:'뻔하잖아요.'},
      {speaker:'명성',text:'형 얼굴에 다 쓰여 있어요.'},
      {speaker:'경비',text:'그런 얼굴 아닌데요.'},
      {speaker:'명성',text:'있어요. "또 왔네" 하는 얼굴.'},
      {speaker:'경비',text:'......'},
      {speaker:'명성',text:'아 됐고, 들어오실래요? 서서 얘기하기 뭐하네.'},
      {speaker:'경비',text:'무슨 일이에요.'},
      {speaker:'명성',text:'그냥 지나가다 한 마디 했는데.'},
      {speaker:'경비',text:'뭐라고 하셨어요?'},
      {speaker:'명성',text:'...나가라고 했어요. 여기서.'},
      {speaker:'경비',text:'......'},
      {speaker:'명성',text:'제가 먼저 사과해야 할 거 알아요.'},
      {speaker:'명성',text:'근데 걔가 먼저예요. 몇 년 전부터.'},
      {speaker:'명성',text:'어제도 복도에서 마주쳤는데 저 보고 코웃음 치더라고요.'},
      {speaker:'명성',text:'그거 보니까 갑자기 옛날 생각나서 욱했어요.'},
      {speaker:'명성',text:'경비원님은 그거 모르잖아요. 그 표정이 뭔지.'},
    ],
    choices:['101호 분 입장에서도 한번 생각해 봐요.','먼저 사과하는 게 낫겠죠.','둘 다 이러면 안 되잖아요.','(관여하지 않는다)'],
    choiceResults:[
      {favor:-3, _favorMap:{'101':+4}, flags:['EVT_D4_005_DONE','SIDE_101_D4','EVT_D4_004_TALKED'], lines:[
        {speaker:'명성',text:'...알겠어요.'},
        '!102짜증',
        {speaker:'명성',text:'근데 형이 그 말 하는 거 좀 이상하지 않아요?'},
        {speaker:'명성',text:'한쪽 얘기만 들은 거잖아요.'},
        {speaker:'명성',text:'형도 걔 표정 봤으면 그 말 못 할걸요.'},
        '!102문닫힘 !102x',
        '(복도로 나왔다.),,',
        '(101호 문이 조금 열려 있었다. 안까지 들렸다는 뜻이다.)',
        '(2년 전에도 이랬을까.)',
      ]},
      {favor:+4, _favorMap:{'101':-3}, flags:['EVT_D4_005_DONE','SIDE_102_D4','EVT_D4_004_TALKED'], lines:[
        {speaker:'명성',text:'...뭐 그렇긴 한데.'},
        {speaker:'명성',text:'형도 알죠? 제 사정이 있다는 거.'},
        {speaker:'명성',text:'알겠어요. 사과, 할게요. 언젠가는.'},
        '!102문닫힘 !102x',
        '(복도로 나왔다.),,',
        '(101호 문이 조금 열려 있었다. 안까지 들렸다는 뜻이다.)',
        '(2년 전에도 이랬을까.)',
      ]},
      {favor:+2, _favorMap:{'101':+2}, flags:['EVT_D4_005_DONE','SIDE_NEUTRAL_D4','EVT_D4_004_TALKED'], lines:[
        {speaker:'명성',text:'하. 그거야 알죠.'},
        {speaker:'명성',text:'그게 안 돼서 문제지.'},
        {speaker:'명성',text:'형은 참 편하게 말하네요. 그런 말은.'},
        '!102문닫힘 !102x',
        '(복도로 나왔다.),,',
        '(101호 문이 조금 열려 있었다. 안까지 들렸다는 뜻이다.)',
        '(둘 다 그 얘기를 할 때마다 "몇 년 전부터"라고만 한다. 몇 년인지는 아무도 정확히 안 센다.)',
      ]},
      {favor:0, flags:['EVT_D4_005_DONE','EVT_D4_006_NEGLECT'], lines:[
        '(뭐라 해야 할지 몰라서 돌아왔다.)',
        '!102문닫힘 !102x',
      ]},
    ],
  },

  // ── EVT_D4_006 밴드 진실 (두 버전). 각각 독립 트리거 ──
  'EVT_D4_006_102':{
    requireDay:4,
    requireFlag:'BAND_REVEALED',
    _requireFavor:{id:'102', min:40},
    room:'102호', loc:'102호 앞',
    bg:'배경/102문닫힘.png',
    onEnd:null,
    lines:[
      '!102문열림 !102',
      '(연습장 위에 놓인 기타가 눈에 들어왔다.)',
      '(줄이 두 개 끊어져 있다. 오래 방치된 것 같다.)',
      '(벽에 색 바랜 공연 포스터가 하나 붙어 있다. "합주실 B동"이라고 작게 도장이 찍혀 있다.)',
      {speaker:'명성',text:'밴드 얘기요?'},
      {speaker:'명성',text:'누구한테 들었어요?'},
      {speaker:'경비',text:'여기저기서요.'},
      {speaker:'명성',text:'ㅋ 소문 빠르네 여기.'},
      '(기타를 힐끗 봤다가 다시 나를 봤다.)',
      {speaker:'명성',text:'저거 줄 갈아야 되는데 계속 미루고 있어요.'},
      '(잠깐 창밖을 봤다.)',
      {speaker:'명성',text:'걔가 나간 거예요. 제가 내보낸 게 아니라.'},
      {speaker:'명성',text:'어느 날 갑자기 연락이 끊겼어요.'},
      {speaker:'명성',text:'마지막 합주가 목요일이었거든요. 그건 기억나요.'},
      {speaker:'명성',text:'그다음 주 화요일에 단톡방에서 나갔어요.'},
      {speaker:'명성',text:'이유도 없이. 그냥.'},
    ],
    choices:['짐작 가는 거 없어요?'],
    choiceResults:[{favor:+2, flags:['EVT_D4_006_DONE','BAND_TRUTH_PARTIAL'], lines:[
      {speaker:'명성',text:'있는데.'},
      {speaker:'명성',text:'근데 그게 맞는지 모르겠어요.'},
      {speaker:'명성',text:'저 그날 많이 마셨거든요. 마지막 합주 뒤풀이요.'},
      {speaker:'명성',text:'뭐라고 했는지 저도 다는 기억 안 나요.'},
      {speaker:'명성',text:'근데 노래 하나는 기억나요. 그날 마지막으로 부른 거.'},
      {speaker:'명성',text:'"짐"이라고, 저희가 만든 곡이었는데.'},
      {speaker:'명성',text:'그 제목이 좀 그렇긴 하죠 지금 생각하면.'},
      {speaker:'경비',text:'......'},
      {speaker:'명성',text:'나중에 들었는데 저 때문이라고.'},
      {speaker:'명성',text:'제가 뭘 했는지는 지금도 몰라요.'},
      {speaker:'명성',text:'알고 싶지도 않아요. 사실.'},
      '(쓸쓸한 것 같기도 하고 화가 난 것 같기도 하다.)',
      '(기억이 안 난다는 말과 알고 싶지 않다는 말은 다른 말이다.)',
      '(근데 명성은 그 둘을 똑같이 쓴다.)',
      '(포스터 속 넷 중 한 명이 도려내진 것처럼 흐릿하게 접혀 있었다.)',
      '!102문닫힘 !102x',
    ]}],
  },
  'EVT_D4_006_101':{
    requireDay:4,
    requireFlag:'BAND_REVEALED',
    _requireFavor:{id:'101', min:40},
    room:'101호', loc:'101호 앞',
    bg:'배경/101문닫힘.png',
    onEnd:null,
    lines:[
      '!101문열림 !101',
      '(오늘은 담배 냄새가 안 난다.)',
      '(끊은 건 아니고, 창문을 열어둔 것 같다.)',
      '(방 한쪽에 케이스에 든 뭔가가 세워져 있다. 악기 케이스처럼 보인다.)',
      {speaker:'염지혜',text:'그 얘기 어디서 들었어요?'},
      {speaker:'경비',text:'대화하다 보니까요.'},
      {speaker:'염지혜',text:'......그렇구나.'},
      '(내 시선이 케이스로 가는 걸 봤다.)',
      {speaker:'염지혜',text:'베이스예요.'},
      {speaker:'염지혜',text:'안 쳐요. 오래됐어요.'},
      '(잠깐 멈췄다.)',
      {speaker:'염지혜',text:'나간 게 아니에요.'},
      {speaker:'염지혜',text:'쫓겨난 거예요.'},
      {speaker:'경비',text:'명성 씨가요?'},
      {speaker:'염지혜',text:'아뇨. 저요.'},
      {speaker:'경비',text:'......'},
      {speaker:'염지혜',text:'그날 일 기억 못 한대요. 지금도.'},
      {speaker:'염지혜',text:'편하겠죠. 그럼.'},
      {speaker:'염지혜',text:'저는 토씨 하나까지 다 기억나는데.'},
    ],
    choices:['무슨 일이었는데요.'],
    choiceResults:[{favor:+2, flags:['EVT_D4_006_DONE','BAND_TRUTH_PARTIAL'], lines:[
      '(말이 끊겼다.)',
      {speaker:'염지혜',text:'......마지막 합주 끝나고 술자리에서요.'},
      {speaker:'염지혜',text:'별 얘기 아니었어요. 취해서 하는 말이 다 그렇죠.'},
      {speaker:'염지혜',text:'근데 저는 그 말을 아직도 기억해요.'},
      {speaker:'염지혜',text:'됐어요. 오래된 얘기예요.'},
      {speaker:'경비',text:'그래도—'},
      {speaker:'염지혜',text:'됐다고요.'},
      '!101문닫힘 !101x',
      '(문이 닫혔다.)',
      '(말투는 끝까지 똑같이 딱딱했다. 근데 그 말을 하고 나서 창밖을 오래 봤다.)',
      '("토씨 하나까지"라는 말이 걸린다.)',
      '(베이스 케이스에 먼지가 두껍게 앉아 있었다. 오래 안 열어본 게 아니라, 열 수 없는 것처럼 보였다.)',
      '(둘 중 누가 진짜 기억하는 건지는 아직 모른다.)',
    ]}],
  },

  // ── EVT_D4_009 개미 이벤트 ──
  'EVT_D4_009_ANT':{
    requireDay:4,
    requireFlag:'ANT_PICKED',
    room:'202호', loc:'202호 앞',
    bg:'배경/202문닫힘.png',
    onEnd:'EVT_202_DONE',
    lines:[
      '!202문열림 !202',
      '(주머니에서 뭔가 떨어졌다.)',
      '(휴지 뭉치. 개미가 싸여 있다.),,',
      '(문 너머로 저번에 봤던 빨랫줄 사진들이 다시 눈에 들어왔다. 오늘은 한 장이 더 늘어 있다.)',
      '(고재엽이 내려다본다.)',
      {speaker:'고재엽',text:'이게 뭐예요.'},
      {speaker:'경비',text:'아, 죽은 개미예요. 버리려고.'},
      '(잠시 본다.)',
      {speaker:'고재엽',text:'줘요.'},
    ],
    choices:['(건넨다.)'],
    choiceResults:[{favor:+5, flags:['EVT_D4_009_DONE','ANT_GIVEN'], lines:[
      '(받아서 자세히 본다.)',
      {speaker:'고재엽',text:'고마워요.'},
      '!202문닫힘 !202x',
    ]}],
  },

  // ── EVT_D4_TIKI_001 명성 × 선형이 — 2층 복도 ──
  'EVT_D4_TIKI_001':{
    requireDay:4,
    _forceOpen:true,
    _hideCharPanel:true,
    room:'2층 복도', loc:'2층 복도',
    bg:'배경/2F복도.png', char:'x',
    onEnd:null,
    lines:[
      '(2층 복도. 선형이가 문 앞에 서 있었다.)',
      '(발밑에 쭈그려 앉아 뽀삐한테 신발끈을 임시 목줄로 묶어주고 있다.)',
      '(명성이 계단에서 올라왔다.),,',
      '!102 !201',
      {speaker:'명성',text:'어 안녕하세요.'},
      {speaker:'김선형',text:'...안녕하세요.'},
      {speaker:'명성',text:'뭐해요? 목줄이 왜 그래요?'},
      {speaker:'김선형',text:'아, 그게, 잃어버려서.'},
      {speaker:'명성',text:'아ㅋㅋ 그거 신발끈 아니에요?'},
      {speaker:'김선형',text:'...네 맞아요.'},
      {speaker:'명성',text:'강아지 찾았다고요? 좋겠다.'},
      {speaker:'김선형',text:'...네.'},
      {speaker:'명성',text:'이름이 뭐예요?'},
      {speaker:'김선형',text:'뽀삐요.'},
      {speaker:'명성',text:'뽀삐ㅋㅋㅋ 귀엽다. 볼 수 있어요?'},
      '(뽀삐가 명성 쪽으로 코를 내밀었다. 짖지는 않았다.)',
      {speaker:'김선형',text:'...안 짖네요. 원래 낯가리는데.'},
      {speaker:'명성',text:'저 동물들이 좋아해요. 이상하게.'},
      {speaker:'명성',text:'아 맞다 낯가린다고요 강아지.'},
      {speaker:'명성',text:'알겠어요. 나중에.'},
      '(나를 봤다.)',
      {speaker:'명성',text:'형도 있었네. 뭐해요?'},
    ],
    choices:['뭐 하고 계세요.','(그냥 지나간다)'],
    choiceResults:[
      {favor:0, _favorMap:{'102':+1}, flags:['EVT_D4_TIKI_001_DONE'], lines:[
        {speaker:'명성',text:'그냥 올라가는 중이었는데.'},
        '(선형이가 경비 보고 짧게 인사하고 뽀삐 안고 들어갔다.)',
        '!102x !201x',
      ]},
      {favor:0, flags:['EVT_D4_TIKI_001_DONE'], lines:[
        '(명성이 경비 등 뒤로 한마디 했다.)',
        {speaker:'명성',text:'되게 바빠 보인다.'},
        '!102x !201x',
      ]},
    ],
  },

  // ── EVT_D4_TIKI_002 염지혜 × 고재엽 — 1층 복도 ──
  'EVT_D4_TIKI_002':{
    requireDay:4,
    requireFlag:'EVT_D4_003_DONE',
    _forceOpen:true,
    _hideCharPanel:true,
    room:'1층 복도', loc:'1층 복도',
    bg:'배경/1F복도.png', char:'x',
    onEnd:null,
    lines:[
      '(1층 복도.)',
      '(염지혜가 101호 문 열고 나오다 고재엽이랑 마주쳤다.),,',
      '!101 !202',
      '(둘이 잠깐 봤다.)',
      '(염지혜가 반사적으로 담뱃갑을 주머니에 넣었다. 필 생각이었던 모양이다.)',
      {speaker:'고재엽',text:'안녕하세요.'},
      {speaker:'염지혜',text:'...네.'},
      {speaker:'고재엽',text:'사진 건은 정말 죄송해요. 제 부주의였어요.'},
      '(염지혜가 나를 봤다가 다시 고재엽을 봤다.)',
      {speaker:'염지혜',text:'...뭐, 알겠어요.'},
      {speaker:'고재엽',text:'감사해요. 이해해주셔서.'},
      '(나를 봤다.)',
      {speaker:'고재엽',text:'경비원님도 오셨네요. 순찰이세요?'},
      {speaker:'염지혜',text:'담배 얘기 처리는 됐어요?'},
      {speaker:'고재엽',text:'담배요?'},
      '(염지혜는 고재엽한테는 말 안 하고 경비 쪽만 봤다.)',
      '(고재엽은 표정 변화 없이 계속 서 있다.)',
    ],
    choices:['(고재엽 쪽 말 받아줌)','(염지혜 쪽 말 받아줌)','(아무 말 안 함)'],
    choiceResults:[
      {favor:0, _favorMap:{'202':+2,'101':-1}, flags:['EVT_D4_TIKI_002_DONE'], lines:[
        {speaker:'고재엽',text:'뭔가 있었나요?'},
        '(염지혜가 기분 나빠하며 들어갔다.)',
        '(고재엽이 그 뒷모습을 눈으로 좇았다. 문이 닫힐 때까지.)',
        '!101x !202x',
      ]},
      {favor:0, _favorMap:{'101':+2,'202':-1}, flags:['EVT_D4_TIKI_002_DONE'], lines:[
        {speaker:'경비',text:'네. 처리했어요.'},
        {speaker:'고재엽',text:'그렇군요.'},
        '(염지혜가 그 틈에 들어갔다.)',
        '!101x !202x',
      ]},
      {favor:0, flags:['EVT_D4_TIKI_002_DONE'], lines:[
        '(둘 다 경비 보다가 각자 가던 길 갔다.)',
        '!101x !202x',
      ]},
    ],
  },

  // ── Day5 EVT_D5_002 — 쓰레기장 케이블 (CLUE_004) ──
  'EVT_D5_002_CABLE':{
    requireDay:5,
    _forceOpen:true,
    room:'쓰레기장', loc:'쓰레기장',
    bg:'배경/쓰레기장.png', char:'x',
    onEnd:null,
    lines:[
      '(쓰레기장 구석. 벽 하단부에 뭔가 끼어 있다.),,',
      '(케이블이다. 회색. 굵다.)',
      '(봉투 사이에 반쯤 묻혀 있다.)',
      '(인터넷 선처럼 보인다.)',
    ],
    choices:['당겨본다.','그냥 둔다.'],
    choiceResults:[
      {favor:0, flags:['EVT_D5_002_DONE'], clues:['CLUE_004'], lines:[
        '(당겨봤다. 벽 안쪽에서 이어진다. 느슨하지 않다. 팽팽하다.)',
        '(어디로 이어지는지는 벽 반대편이라 안 보인다.),,',
      ]},
      {favor:0, flags:['EVT_D5_002_DONE'], lines:[
        '(봉투를 다시 덮었다.)',
        '(신경 쓸 일은 아니라고 생각했다.)',
      ]},
    ],
  },

  // ── Day5 EVT_D5_003 — 2층 복도 벽 소리 직접 조사 (CLUE_003) ──
  'EVT_D5_003_WALLCHECK':{
    requireDay:5,
    _forceOpen:true,
    room:'2층 복도', loc:'2층 복도',
    bg:'배경/2F복도.png', char:'x',
    onEnd:null,
    lines:[
      '(복도에 귀를 댔다.),,',
      '(소리가 난다. 기계 소리다. 5초 간격으로.)',
      '(하나, 둘, 셋, 넷, 다섯 — 딱.)',
      '(다시 하나, 둘, 셋, 넷, 다섯 — 딱.)',
      '(배관 소리가 아니다. 너무 규칙적이다. 배관은 이렇게 정확하지 않다.)',
    ],
    choices:['벽을 두드려본다','그냥 돌아간다'],
    choiceResults:[
      {favor:0, flags:['EVT_D5_003_DONE'], clues:['CLUE_003'], lines:[
        '(주먹으로 두드렸다. 울림이 없다.)',
        '(옆 칸 — 202호 쪽 벽을 같은 힘으로 두드려봤다. 그쪽은 울린다.)',
        '(여기만 두껍다. 여기만.),,',
      ]},
      {favor:0, flags:['EVT_D5_003_DONE'], lines:[
        '(소리를 등지고 걸었다.)',
        '(몇 걸음 가서도 계속 들렸다.)',
      ]},
    ],
  },

  'EVT_D5_301_WALL':{
    requireDay:5,
    _forceOpen:true,   // 복도 씬이라 loc 검사에 걸려 스킵되던 것을 강제 오픈
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
    requireFlag:'EVT_D5_SHOWDOWN_DONE',
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
  // ── Day6 낮 — 각 호실 마지막 대화 (EVT_D6_002). 호실당 1회, 끝나면 재방문 씬으로 복귀 ──
  'EVT_D6_002_101':{
    requireDay:6,
    room:'101호', loc:'101호 앞',
    bg:'배경/101문닫힘.png',
    onEnd:null,
    lines:[
      '!101문닫힘',
      '(노크했다.)',
      '(바로 열렸다. 기다리고 있었던 것 같다.)',
      '!101문열림 !101',
      {speaker:'염지혜',text:'왔어요?'},
      {speaker:'경비',text:'별일 없으시죠.'},
      '(잠깐 복도를 봤다.)',
      {speaker:'염지혜',text:'경비원님은, 존재 자체가 짜증나는 사람 있어요?'},
    ],
    choices:['있죠.','일은 일이니까요.'],
    choiceResults:[
      {favor:+3,flags:['EVT_D6_002_DONE'],lines:[
        '(염지혜가 웃었다. 뜻밖이었다.)',
        {speaker:'염지혜',text:'다행이다. 저만 그런 게 아니구나.'},
        '!101문닫힘 !101x',
        '(문이 닫히고 나서도 그 웃음이 이상하게 마음에 남았다.)',
      ]},
      {favor:0,flags:['EVT_D6_002_DONE'],lines:[
        {speaker:'염지혜',text:'역시 경비원이다.'},
        '!101문닫힘 !101x',
        '(사무적인 답이었는데, 사무적인 걸 원한 것 같기도 했다.)',
      ]},
    ],
  },
  'EVT_D6_002_102':{
    requireDay:6,
    room:'102호', loc:'102호 앞',
    bg:'배경/102문닫힘.png',
    onEnd:null,
    lines:[
      '!102문닫힘',
      '(노크하자 금방 열렸다.)',
      '!102문열림 !102',
      {speaker:'명성',text:'어 형.'},
      {speaker:'경비',text:'뭐 해요?'},
      {speaker:'명성',text:'그냥요. 유튜브 보다가.'},
      {speaker:'경비',text:'노래는요?'},
      {speaker:'명성',text:'집에선 안 불러요 이제.'},
      '(잠깐 웃는 것 같다.)',
      {speaker:'명성',text:'근데 형은 왜요. 볼 일 있어요?'},
      {speaker:'경비',text:'아뇨. 그냥 돌아다니다가요.'},
      {speaker:'명성',text:'그래요?'},
      '(잠깐 복도를 내다봤다.)',
      {speaker:'명성',text:'형 오래 할 것 같아요? 여기.'},
      {speaker:'경비',text:'모르겠어요.'},
      {speaker:'명성',text:'그렇겠다.'},
    ],
    choices:['왜요?','이만 가볼게요.'],
    choiceResults:[
      {favor:+2,flags:['EVT_D6_002_DONE'],lines:[
        {speaker:'명성',text:'그냥요. 별로 안 오래 있을 것 같아서.'},
        {speaker:'명성',text:'여기 사람들이 다들 그렇더라고요.'},
        '(웃음. 근데 뭔 뜻인지는 모름.)',
        '!102문닫힘 !102x',
        '(그 말이 내내 걸렸다. "다들 그렇더라고요.")',
      ]},
      {favor:0,flags:['EVT_D6_002_DONE'],lines:[
        {speaker:'명성',text:'네. 수고요.'},
        '!102문닫힘 !102x',
      ]},
    ],
  },
  'EVT_D6_002_201':{
    requireDay:6,
    requireFlag:'SAVED_201',
    room:'201호', loc:'201호 앞',
    bg:'배경/201문닫힘.png',
    onEnd:null,
    lines:[
      '(노크했다. 뽀삐가 문 너머에서 발소리를 냈다.),,',
      '(한참 있다가 문이 조금 열렸다.)',
      '!201문열림 !201',
      {speaker:'김선형',text:'...경비원님.'},
      {speaker:'경비',text:'별일 없어요?'},
      {speaker:'김선형',text:'네.'},
      '(뽀삐가 발 사이로 얼굴을 내밀었다.)',
    ],
    choices:['뽀삐 인사하러 왔어요.','밥 먹었어요?'],
    choiceResults:[
      {favor:+3,flags:['EVT_D6_002_DONE'],lines:[
        {speaker:'김선형',text:'아.'},
        '(잠깐 뽀삐를 보다가.)',
        {speaker:'김선형',text:'뽀삐야. 경비원님이야.'},
        '(뽀삐가 꼬리를 흔들었다.)',
        {speaker:'김선형',text:'...좋아하나봐요.'},
        {speaker:'경비',text:'선형 씨도 잘 지내요.'},
        {speaker:'김선형',text:'...네.'},
        '!201문닫힘 !201x',
        '(마지막으로 본 얼굴치고는, 조금 웃고 있었다.)',
      ]},
      {favor:+1,flags:['EVT_D6_002_DONE'],lines:[
        {speaker:'김선형',text:'아 네. 아까.'},
        '!201문닫힘 !201x',
      ]},
    ],
  },
  'EVT_D6_002_301':{
    requireDay:6,
    room:'301호', loc:'301호 앞',
    bg:'배경/301문닫힘.png',
    onEnd:null,
    lines:[
      '(노크했다.)',
      '(반응이 없다.),,',
      '(한 번 더.)',
      {speaker:'매소련',text:'으하하.'},
      {speaker:'매소련',text:'경비원님?'},
      {speaker:'경비',text:'네. 별일 없으세요?'},
      {speaker:'매소련',text:'있어요'},
      {speaker:'경비',text:'......뭐가요?'},
      {speaker:'매소련',text:'오늘은 소리가 안 나요'},
      {speaker:'매소련',text:'신기하죠?'},
      {speaker:'경비',text:'......네.'},
      {speaker:'매소련',text:'저만 알아챘어요. 경비원님은요?'},
    ],
    choices:['저도 그러네요.','(적당히 마무리하고 간다)'],
    choiceResults:[
      {favor:+2,flags:['EVT_D6_002_DONE'],lines:[
        {speaker:'매소련',text:'그죠그죠ㅋㅋㅋㅋ'},
        {speaker:'매소련',text:'오늘 뭔가 있나봐요'},
        '(문 사이로 보이는 봉투 더미가 오늘따라 유독 많아 보였다.)',
      ]},
      {favor:0,flags:['EVT_D6_002_DONE'],lines:[
        {speaker:'매소련',text:'에이. 재미없게.'},
      ]},
    ],
  },

  'EVT_D6_MORNING':{
    requireDay:6,
    requireFlag:'AGREED_WITH_202',
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
// CC_HOTSPOTS — CCTV 확대 화면(bigCC)에서 클릭 가능한 조사 지점
// 좌표는 원본 배경 이미지(1672×941) 픽셀 기준. 카메라 이름(bigCC의 name)으로 키를 잡는다.
// msg는 클릭 시 화면 중앙에 뜨는 문구. 나중에 단서 지급(addClue 등)을 추가할 땐
// 여기에 flag/clue 필드를 얹으면 됨 — 지금은 "이상 없음" 조사 반응만 구현.
// *Claude 메모: "천장에 연결된 저것"은 정확한 명칭이 없어서 일단 "센서"로 라벨링함.
// 실제로 부르는 이름 있으면(감지기/안테나/인터폰 중계기 등) 알려주면 라벨만 교체.
// ═══════════════════════════════════════
const CC_HOTSPOTS={
  '1F 복도':[
    {id:'102_door', label:'문',
     points:[[1531,40],[1452,60],[1302,138],[1294,160],[1280,940],[1534,940],[1521,66]],
     msg:'아무 이상 없다.'},
    {id:'102_knob', label:'문고리',
     points:[[1444,596],[1442,600],[1442,616],[1445,625],[1461,635],[1469,637],[1473,643],[1489,650],[1495,650],[1498,648],[1503,640],[1505,627],[1505,600],[1499,594],[1490,591],[1477,591],[1470,595]],
     msg:'아무 이상 없다.'},
    {id:'102_bell', label:'초인종',
     points:[[1207,506],[1204,508],[1204,520],[1206,523],[1206,585],[1208,587],[1212,587],[1221,591],[1238,605],[1244,605],[1247,598],[1253,592],[1253,513],[1251,510],[1246,508],[1237,510],[1224,510],[1213,506]],
     msg:'아무 이상 없다.'},
    {id:'102_sensor', label:'센서',
     points:[[1160,16],[1127,16],[1117,26],[1115,205],[1095,211],[1084,236],[1084,350],[1102,357],[1119,389],[1136,378],[1152,354],[1166,353],[1170,347],[1173,202],[1167,199],[1166,138],[1160,106]],
     msg:'아무 이상 없다.'},
  ],
  // *Claude 메모: 2F 복도(201호 문 앞)에는 1F 같은 천장 센서가 없음. 대신 계량기함/설비함으로 대체.
  // 실제 명칭 있으면(전기계량기/가스계량기/우편함 등) 알려주면 라벨만 교체.
  '2F 복도':[
    {id:'201_door', label:'문',
     points:[[1404,210],[1291,227],[1223,253],[1216,888],[1279,940],[1412,940],[1402,610],[1386,610],[1381,630],[1361,634],[1354,596],[1331,581],[1351,557],[1397,558]],
     msg:'아무 이상 없다.'},
    {id:'201_knob', label:'문고리',
     points:[[1340,565],[1336,569],[1336,585],[1341,592],[1355,592],[1358,594],[1359,628],[1380,627],[1382,621],[1385,597],[1385,574],[1381,561],[1358,560]],
     msg:'아무 이상 없다.'},
    {id:'201_meter', label:'계량기',
     points:[[1103,24],[1084,26],[1078,48],[1057,62],[1067,188],[1041,192],[1044,292],[1048,300],[1060,303],[1064,325],[1071,333],[1088,333],[1097,311],[1114,308],[1115,183],[1103,183],[1099,178],[1104,111]],
     msg:'아무 이상 없다.'},
    {id:'201_utilitybox', label:'설비함',
     points:[[1471,559],[1453,572],[1453,834],[1470,839],[1476,848],[1531,877],[1580,896],[1597,896],[1601,768],[1596,582],[1500,558]],
     msg:'아무 이상 없다.'},
  ],
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
// ═══════════════════════════════════════════════════════════════
// REVISIT — 이벤트가 없을 때 나오는 재방문 씬 (화면 상태표)
// ═══════════════════════════════════════════════════════════════
// 구조: REVISIT[호실][Day] = [1회차, 2회차, 3회차이상]
//   · 해당 Day에 진행할 이벤트가 없을 때만 나온다.
//   · 문이 안 열려도 매번 다른 정보를 준다. "(반응이 없다)"만 반복되면 빌라가 죽어 보인다.
//   · Day가 비어 있으면 아래 Day를 거슬러 올라가며 찾고, 그것도 없으면 DEFAULT_VISIT_xxx로 폴백.
// 문체 원칙: 담담하게. "이상하다" 같은 판단 금지. 보이는 것과 들리는 것만.
// ═══════════════════════════════════════════════════════════════
const REVISIT = {

  // ─── 101호 염지혜 — 담배 / 통화 / TV ───
  '101': {
    1: [
      ['!101x','(복도 끝에서 담배 냄새가 넘어온다.)','(똑똑똑),,','(반응이 없다.)'],
      ['!101x','(똑똑똑),,','(안에서 인기척이 났다가 멎었다.)'],
      ['!101x','(똑똑똑),,','(반응이 없다.)'],
    ],
    2: [
      ['!101x','(문 너머로 통화하는 소리가 들린다.)','(무슨 말인지는 안 들린다. 톤만 들린다.)','(똑똑똑),,','(소리가 멎었다. 그게 다였다.)'],
      ['!101x','(문 앞에 꽁초가 하나 더 늘어 있다.)','(치웠다.)','(똑똑똑),,','(반응이 없다.)'],
      ['!101x','(똑똑똑),,','(반응이 없다.)'],
    ],
    3: [
      ['!101x','(똑똑똑),,','(...),,','(신발이 있다. 안에 있다는 뜻이다.)','(한 번 더 두드리지는 않았다.)'],
      ['!101x','(문 앞에 꽁초가 세 개.)','(아까는 두 개였다.)','(치웠다.)'],
      ['!101x','(똑똑똑),,','(반응이 없다.)'],
    ],
    4: [
      ['!101x','(TV 소리가 크다.)','(똑똑똑),,','(볼륨이 더 커졌다.)'],
      ['!101x','(여전히 TV 소리.)','(같은 채널인 것 같다.)','(돌아갔다.)'],
      ['!101x','(똑똑똑),,','(반응이 없다.)'],
    ],
    5: [
      ['!101x','(문 앞에 꽁초가 여러 개.)','(전부 반쯤 피우다 비벼 끈 것들이다.)','(똑똑똑),,','(반응이 없다.)'],
      ['!101x','(아무 소리도 안 난다.)','(TV도 꺼져 있다.)','(똑똑똑),,','(반응이 없다.)'],
      ['!101x','(똑똑똑),,','(반응이 없다.)'],
    ],
    6: [
      ['!101x','(조용하다.)','(똑똑똑),,','(반응이 없다.)'],
      ['!101x','(문 앞이 깨끗하다.)','(오늘은 꽁초가 없다.)'],
      ['!101x','(똑똑똑),,','(반응이 없다.)'],
    ],
  },

  // ─── 102호 명성 — 노래 / 기타 / 오디션 ───
  '102': {
    1: [
      ['(시끄러운 노래소리가 들린다.)','(똑똑똑),,','(반응이 없다.)'],
      ['(노래가 계속된다.)','(같은 구간을 세 번째 부르고 있다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    2: [
      ['(오늘은 노래가 안 들린다.)','(기타 소리만 난다.)','(똑똑똑),,','(기타가 멎었다가 다시 시작됐다.)'],
      ['(기타 소리가 계속된다.)','(코드를 잡다 자꾸 틀린다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    3: [
      ['(아무 소리도 안 난다.)','(똑똑똑),,','(반응이 없다.)','(오늘 오디션이라고 했었다.)'],
      ['(신발이 없다.)','(아직 안 들어온 모양이다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    4: [
      ['(노래가 들린다. 작게.)','(같은 구간만 반복하고 있다.)','(똑똑똑),,','(멎었다.)','(잠시 뒤 다시 시작됐다.)'],
      ['(여전히 같은 구간이다.)','(잘 안 되는 부분인 것 같다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    5: [
      ['(안에서 통화하는 소리가 난다.)','(웃는다.)','(똑똑똑),,','(소리가 잠깐 작아졌다가 다시 커졌다.)'],
      ['(통화가 아직 안 끝났다.)','(오늘은 방해하지 않는 게 낫겠다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    6: [
      ['(조용하다.)','(똑똑똑),,','(반응이 없다.)'],
      ['(집에서 노래 안 부른다고 했었다.)','(약속은 지키고 있는 모양이다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
  },

  // ─── 201호 김선형 — 뽀삐 / 정적 / 불빛 ───
  '201': {
    1: [
      ['(똑똑똑),,','(반응이 없다.)'],
      ['(똑똑똑),,','(안에서 뭔가 바닥에 끌리는 소리가 잠깐 났다.)','(그게 다였다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    2: [
      ['(문 안쪽에서 발소리가 난다. 작다.)','(뽀삐인 것 같다.)','(똑똑똑),,','(발소리가 문 앞까지 왔다가 돌아갔다.)'],
      ['(뽀삐가 문 아래를 킁킁거린다.)','(사람 소리는 안 난다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    3: [
      ['(문 아래 틈으로 그림자가 보인다.)','(똑똑똑),,','(그림자가 물러났다.)','(문은 열리지 않았다.)'],
      ['(그림자는 이제 없다.)','(똑똑똑),,','(반응이 없다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    4: [
      ['(뽀삐가 문을 긁는다.)','(똑똑똑),,','(긁는 소리가 멎었다.)','(누가 안아 올린 것 같다.)'],
      ['(안은 조용하다.)','(똑똑똑),,','(반응이 없다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    5: [
      ['(문 아래가 어둡다.)','(불이 꺼져 있다.)','(똑똑똑),,','(반응이 없다.)'],
      ['(뽀삐 소리도 안 난다.)','(자고 있는 건지도 모른다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    6: [
      ['(똑똑똑),,','(반응이 없다.)'],
      ['(문 앞에 뭔가 놓여 있다.)','(사료 봉투다. 뜯지 않은 채로.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
  },

  // ─── 202호 고재엽 — 부재 / 암실 / 필름 ───
  '202': {
    1: [
      ['(똑똑똑),,','(반응이 없다.)'],
      ['(나간 모양이다.)','(문 앞이 깨끗하다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    2: [
      ['(문 앞에 종이봉투가 놓여 있다.)','(현상소 이름이 찍혀 있다.)','(똑똑똑),,','(반응이 없다.)'],
      ['(봉투는 그대로다.)','(아직 안 들어온 것 같다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    3: [
      ['(문틈으로 냄새가 난다. 시큼하다.)','(약품 냄새 같다.)','(똑똑똑),,','(반응이 없다.)'],
      ['(냄새가 아까보다 옅다.)','(환기를 한 모양이다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    4: [
      ['(문 아래로 붉은 빛이 샌다.)','(똑똑똑),,','(빛이 꺼졌다.)','(그리고 다시 켜졌다.)'],
      ['(빛은 아직 켜져 있다.)','(방해하지 않는 게 낫겠다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    5: [
      ['(똑똑똑),,','(반응이 없다.)','(카메라를 들고 나가는 걸 아까 봤다.)'],
      ['(문 앞에 필름통이 하나 떨어져 있다.)','(비어 있다.)','(그대로 뒀다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    6: [
      ['(똑똑똑),,','(반응이 없다.)'],
      ['(오늘은 카메라를 안 들고 있었다.)','(그게 좀 걸린다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
  },

  // ─── 301호 매소련 — 악취 / 봉투 / 벽 ───
  '301': {
    1: [
      ['(문 너머로 악취가 풍긴다.)','(인기척은 들리지만 반응이 없다.)'],
      ['(똑똑똑),,','(안에서 웃는 소리가 잠깐 났다.)','(문은 열리지 않았다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    2: [
      ['(안에서 뭔가 끄는 소리가 난다.)','(봉투 같다.)','(똑똑똑),,','(소리가 멎었다.)'],
      ['(다시 끄는 소리가 시작됐다.)','(아까랑 같은 리듬이다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    3: [
      ['(안에서 뭔가 세는 소리가 난다.)','(숫자를 말하고 있다.)','(스물셋. 스물넷. 스물셋.)','(똑똑똑),,','(세는 소리가 멎었다.)'],
      ['(다시 세기 시작했다.)','(하나부터다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    4: [
      ['(문 앞에 섰는데 안에서도 발소리가 멈췄다.)','(문 바로 뒤인 것 같다.)','(똑똑똑),,','(움직이지 않는다.)'],
      ['(아직 거기 있다.)','(똑똑똑),,','(반응이 없다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    5: [
      ['(긁는 소리가 난다.)','(문이 아니라 안쪽 벽이다.)','(똑똑똑),,','(긁는 소리는 멈추지 않았다.)'],
      ['(여전히 긁고 있다.)','(일정한 간격이다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
    6: [
      ['(조용하다.)','(악취도 덜하다.)','(똑똑똑),,','(반응이 없다.)'],
      ['(문틈에 봉투 조각이 끼어 있다.)','(빼내지 않았다.)'],
      ['(똑똑똑),,','(반응이 없다.)'],
    ],
  },
};

// ─── 장소 재방문 (CCTV 전체화면 → 이동) ───
// 구조: LOC_REVISIT[장소][Day] = [1회차, 2회차이상]
const LOC_REVISIT = {
  '쓰레기장': {
    1: [['(쓰레기장이다. 분리수거 봉투들이 흐트러져 있다.)','(냄새가 좀 난다.)'],
        ['(아까랑 같다.)','(달라진 건 없다.)']],
    2: [['(봉투 몇 개가 터져 있다.)','(누가 뒤진 것 같다.)'],
        ['(터진 봉투는 그대로다.)']],
    3: [['(오늘은 정리가 되어 있다.)','(누가 치운 모양이다.)'],
        ['(더 볼 건 없다.)']],
    4: [['(구석에 종이 뭉치가 있다.)','(젖어서 뭔지 알아볼 수 없다.)'],
        ['(그대로 뒀다.)']],
    5: [['(냄새가 평소보다 덜하다.)','(수거차가 다녀간 모양이다.)'],
        ['(벽 하단부가 눈에 들어온다.)','(아까는 안 보였던 것 같다.)']],
    6: [['(비어 있다.)','(봉투가 하나도 없다.)'],
        ['(수거일이 아닌데.)']],
  },
  '흡연실': {
    1: [['(흡연구역이다. 재떨이가 가득 차 있다.)','(환기가 전혀 안 되는 것 같다.)'],
        ['(아무도 없다.)']],
    2: [['(재떨이를 비웠다.)','(내 일이니까.)'],
        ['(벌써 두 개비가 들어와 있다.)']],
    3: [['(꽁초가 한쪽에만 몰려 있다.)','(같은 사람이 같은 자리에서 피운다는 뜻이다.)'],
        ['(아무도 없다.)']],
    4: [['(누가 방금 있었다.)','(재떨이에서 아직 연기가 난다.)'],
        ['(연기는 멎었다.)']],
    5: [['(꽁초가 평소의 두 배다.)','(어제 누가 오래 있었던 모양이다.)'],
        ['(아무도 없다.)']],
    6: [['(깨끗하다.)','(오늘은 아무도 안 온 것 같다.)'],
        ['(아무도 없다.)']],
  },
  '1F복도': {
    1: [['(1층 복도다.)','(조용하다.)'],
        ['(아무도 없다.)']],
    2: [['(101호 앞에 꽁초가 있다.)','(치웠다.)'],
        ['(복도는 조용하다.)']],
    3: [['(형광등 하나가 깜빡인다.)','(교체 신청을 해야겠다.)'],
        ['(아무도 없다.)']],
    4: [['(깜빡이던 형광등이 꺼져 있다.)','(신청은 아직 안 했다.)'],
        ['(어둡다.)']],
    5: [['(복도 끝이 어둡다.)','(발소리가 울린다.)','(내 발소리다.)'],
        ['(아무도 없다.)']],
    6: [['(101호 앞에 꽁초 하나.)','(치웠다. 몇 번째인지 모르겠다.)'],
        ['(조용하다.)']],
  },
  '2F복도': {
    1: [['(2층 복도다.)','(아무도 없다.)'],
        ['(조용하다.)']],
    2: [['(201호 앞에 사료 봉투가 놓여 있다.)','(배달인 것 같다.)'],
        ['(봉투는 그대로다.)']],
    3: [['(202호 문 앞에 종이봉투.)','(어제도 있었다.)'],
        ['(아무도 없다.)']],
    4: [['(복도 벽에 손자국이 있다.)','(누가 짚고 지나간 것 같다.)'],
        ['(높이가 좀 낮다.)']],
    5: [['(복도가 평소보다 조용하다.)','(그런데 조용한 게 아니다.)','(뭔가 소리가 나는데 너무 작아서 안 들린다.)'],
        ['(귀를 대보면 알 것 같다.)']],
    6: [['(2층 복도다.)','(아무도 없다.)'],
        ['(조용하다.)']],
  },
};
