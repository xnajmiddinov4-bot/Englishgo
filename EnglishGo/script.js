(function(){
  "use strict";

  /* ---------- helpers ---------- */
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  function toast(msg){
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(()=>t.classList.remove('show'), 2400);
  }
  function loadState(){
    try{ return JSON.parse(localStorage.getItem('eb_state')) || {}; }catch(e){ return {}; }
  }
  function saveState(s){
    try{ localStorage.setItem('eb_state', JSON.stringify(s)); }catch(e){}
  }
  let state = Object.assign({streak:0,lastVisit:null,mastered:0,bestQuiz:0,sessions:0}, loadState());

  function bumpStreak(){
    const today = new Date().toDateString();
    if(state.lastVisit !== today){
      const y = new Date(Date.now()-86400000).toDateString();
      state.streak = (state.lastVisit === y) ? state.streak + 1 : 1;
      state.lastVisit = today;
      saveState(state);
    }
  }
  bumpStreak();

  function renderStats(){
    $('#statStreak').textContent = state.streak;
    $('#statMastered').textContent = state.mastered;
    $('#statQuiz').textContent = state.bestQuiz + '%';
    $('#statSessions').textContent = state.sessions;
  }
  renderStats();

  /* ---------- nav ---------- */
  const menuToggle = $('#menuToggle'), mobileMenu = $('#mobileMenu');
  menuToggle.addEventListener('click', ()=>{
    menuToggle.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
  $$('.mobile-menu a').forEach(a=>a.addEventListener('click', ()=>{
    menuToggle.classList.remove('open'); mobileMenu.classList.remove('open');
  }));

  /* ---------- hero meter ---------- */
  window.addEventListener('load', ()=>{
    setTimeout(()=>{ $('#meterFill').style.width = '82%'; $('#meterPct').textContent = '82%'; }, 500);
  });

  /* ---------- tabs ---------- */
  $$('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      $$('.tab-btn').forEach(b=>b.classList.remove('active'));
      $$('.panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      $('#panel-' + btn.dataset.tab).classList.add('active');
    });
  });

  /* ---------- flashcards ---------- */
  const deck = [
    {word:'resilient', pos:'adjective', def:'Able to recover quickly from difficulties; tough.', ex:'"She stayed resilient through the whole exam season."'},
    {word:'procrastinate', pos:'verb', def:'To delay doing something that should be done now.', ex:'"He always procrastinates before deadlines."'},
    {word:'ambiguous', pos:'adjective', def:'Open to more than one interpretation; unclear.', ex:'"The instructions were ambiguous, so we asked again."'},
    {word:'thorough', pos:'adjective', def:'Complete, with attention to every detail.', ex:'"She did a thorough review before submitting."'},
    {word:'overwhelmed', pos:'adjective', def:'Having more than you can handle emotionally or mentally.', ex:'"I felt overwhelmed by the new workload."'},
    {word:'candid', pos:'adjective', def:'Honest and direct, even about difficult things.', ex:'"He gave me candid feedback on my essay."'},
    {word:'versatile', pos:'adjective', def:'Able to adapt to many different functions or situations.', ex:'"She is a versatile speaker, comfortable in any setting."'},
    {word:'inevitable', pos:'adjective', def:'Certain to happen; unavoidable.', ex:'"Change felt inevitable after the merger."'}
  ];
  let cardIdx = 0, masteredSession = 0;

  function paintCard(){
    const c = deck[cardIdx];
    $('#cardWord').textContent = c.word;
    $('#cardPos').textContent = c.pos;
    $('#cardDef').textContent = c.def;
    $('#cardEx').textContent = c.ex;
    $('#flipCard').classList.remove('flipped');
    $('#deckProgress').textContent = `Card ${cardIdx+1} of ${deck.length} · ${masteredSession} mastered this session`;
  }
  paintCard();

  $('#flipCard').addEventListener('click', ()=> $('#flipCard').classList.toggle('flipped'));

  function nextCard(mastered){
    if(mastered){ masteredSession++; state.mastered++; saveState(state); renderStats(); toast('Ajoyib — o‘zlashtirilgan deb belgilandi ✓'); }
    cardIdx = (cardIdx + 1) % deck.length;
    paintCard();
  }
  $('#knewYes').addEventListener('click', ()=> nextCard(true));
  $('#knewNo').addEventListener('click', ()=> nextCard(false));
  $('#shuffleCard').addEventListener('click', ()=>{ cardIdx = Math.floor(Math.random()*deck.length); paintCard(); });

  /* ---------- quiz ---------- */
  const questions = [
    {q:'She ___ to the gym every morning before work.', opts:['go','goes','going','gone'], a:1},
    {q:'Which sentence uses the correct past tense?', opts:['I buyed a new phone.', 'I bought a new phone.', 'I buy a new phone yesterday.', 'I have buy a phone.'], a:1},
    {q:'"Ambiguous" most nearly means:', opts:['perfectly clear', 'open to more than one meaning', 'very loud', 'extremely fast'], a:1},
    {q:'Choose the correctly punctuated sentence.', opts:["Its a great day, isn't it?", "It's a great day, isn't it?", "Its' a great day isn't it", "It's a great day isnt it?"], a:1},
    {q:'By next year, I ___ here for a decade.', opts:['will work', 'will have worked', 'work', 'am working'], a:1}
  ];
  let qi = 0, score = 0, answered = false;

  function renderQuiz(){
    const box = $('#quizBox');
    if(qi >= questions.length){
      const pct = Math.round((score/questions.length)*100);
      if(pct > state.bestQuiz){ state.bestQuiz = pct; }
      state.sessions++;
      saveState(state); renderStats();
      box.innerHTML = `
        <div class="quiz-done">
          <div class="score">${pct}%</div>
          <p style="margin-top:10px;color:var(--ink-soft)">You got ${score} of ${questions.length} correct.</p>
          <button class="btn btn-amber" id="retryQuiz" style="margin-top:24px;">Try again</button>
        </div>`;
      $('#retryQuiz').addEventListener('click', ()=>{ qi=0; score=0; renderQuiz(); });
      return;
    }
    const item = questions[qi];
    answered = false;
    box.innerHTML = `
      <div class="q-count">Question ${qi+1} of ${questions.length}</div>
      <div class="q-text">${item.q}</div>
      <div class="q-opts">${item.opts.map((o,i)=>`<button class="q-opt" data-i="${i}">${o}</button>`).join('')}</div>
      <div class="q-footer">
        <span class="streak-pill">🔥 ${state.streak}-day streak</span>
        <span style="font-size:13.5px;color:var(--ink-soft)">Score: ${score}/${qi}</span>
      </div>`;
    $$('.q-opt').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(answered) return;
        answered = true;
        const i = Number(btn.dataset.i);
        $$('.q-opt').forEach(b=>b.disabled = true);
        if(i === item.a){ btn.classList.add('correct'); score++; }
        else{
          btn.classList.add('incorrect');
          $$('.q-opt')[item.a].classList.add('correct');
        }
        setTimeout(()=>{ qi++; renderQuiz(); }, 900);
      });
    });
  }
  renderQuiz();

  /* ---------- email capture ---------- */
  $('#emailForm').addEventListener('submit', e=>{
    e.preventDefault();
    const email = $('#emailInput').value.trim();
    if(!email) return;
    let list = [];
    try{ list = JSON.parse(localStorage.getItem('eb_signups')) || []; }catch(err){}
    list.push({email, at: Date.now()});
    try{ localStorage.setItem('eb_signups', JSON.stringify(list)); }catch(err){}
    $('#emailInput').value = '';
    toast("You're on the list — check your inbox soon.");
  });
})();

/* ================= LEARNING APP ================= */
(function(){
"use strict";
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
function toast(msg){const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'),2400);}
function beep(ok){ if(!S.sound) return; try{ const ctx=new (window.AudioContext||window.webkitAudioContext)(); const o=ctx.createOscillator(), g=ctx.createGain(); o.frequency.value= ok?880:220; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(.08,ctx.currentTime); o.start(); o.stop(ctx.currentTime+.12);}catch(e){} }

const VOCAB=[
 {w:'journey',uz:'sayohat',ex:'Our journey across the country took three days.'},
 {w:'courage',uz:'jasorat',ex:'It took courage to speak in front of everyone.'},
 {w:'opportunity',uz:'imkoniyat',ex:'This job is a great opportunity for you.'},
 {w:'patience',uz:'sabr',ex:'Learning a language requires patience.'},
 {w:'achieve',uz:'erishmoq',ex:'She worked hard to achieve her goals.'},
 {w:'improve',uz:'yaxshilamoq',ex:'I want to improve my English speaking.'},
 {w:'decision',uz:'qaror',ex:'He made a quick decision to leave.'},
 {w:'success',uz:'muvaffaqiyat',ex:'Success comes from consistent effort.'},
 {w:'challenge',uz:'qiyinchilik',ex:'Every challenge makes you stronger.'},
 {w:'confidence',uz:'ishonch',ex:'Practice builds confidence over time.'}
];
const GRAMMAR=[
 {q:"She ___ to school every day.",opts:['go','goes','going','gone'],a:1},
 {q:"I ___ my homework yesterday.",opts:['finish','finishes','finished','finishing'],a:2},
 {q:"They ___ watching TV right now.",opts:['is','am','are','be'],a:2},
 {q:"If it rains, I ___ stay home.",opts:['will','would','was','did'],a:0},
 {q:"This is the book ___ I told you about.",opts:['who','which','whose','when'],a:1}
];
const ACHIEVEMENTS=[
 {id:'first_lesson',title:'Birinchi mashq',em:'📘',check:s=>s.lessonsCompleted>=1},
 {id:'xp100',title:'100 XP',em:'⭐',check:s=>s.xp>=100},
 {id:'xp500',title:'500 XP',em:'🏆',check:s=>s.xp>=500},
 {id:'perfect',title:'Mukammal test',em:'🎯',check:s=>s.hadPerfectQuiz},
 {id:'streak7',title:'7 kunlik streak',em:'🔥',check:s=>s.streak>=7}
];
const LEVEL_LABEL={beginner:'Boshlang‘ich',elementary:'Elementary',intermediate:'O‘rta',advanced:'Yuqori'};

function defaultState(){return {onboarded:false,level:'',focus:'',dailyTime:'',xp:0,streak:0,lastActive:null,lessonsCompleted:0,wordsKnown:[],quizAccHistory:[],hadPerfectQuiz:false,dailyClaimedDate:null,theme:'dark',sound:true};}
function load(){ try{ return Object.assign(defaultState(), JSON.parse(localStorage.getItem('eb_app'))||{}); }catch(e){ return defaultState(); } }
let S = load();
function save(){ try{ localStorage.setItem('eb_app', JSON.stringify(S)); }catch(e){} updateTop(); }

function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

function bumpStreak(){
  const today=new Date().toDateString();
  if(S.lastActive!==today){
    const y=new Date(Date.now()-86400000).toDateString();
    S.streak = (S.lastActive===y) ? S.streak+1 : 1;
    S.lastActive=today; save();
  }
}

function updateTop(){
  $('#xpChip').textContent = S.xp+' XP';
  $('#streakChip').textContent = '🔥 '+S.streak;
  const ov=$('#appOverlay');
  ov.classList.toggle('light', S.theme==='light');
}

function setActivePill(name){ $$('.pill').forEach(p=>p.classList.toggle('active', p.dataset.screen===name)); }
function body(html){ if(typeof stopActiveRecognition==='function') stopActiveRecognition(); $('#appBody').innerHTML = html; $('#appBody').scrollTop=0; window.scrollTo(0,0); }

/* ---- ONBOARDING ---- */
const OB_STEPS=[
 {key:'level', q:'Ingliz tili darajangiz qanday?', opts:[['beginner','Boshlang‘ich'],['elementary','Boshlang‘ich+ '],['intermediate','O‘rta'],['advanced','Yuqori']]},
 {key:'focus', q:'Nimani yaxshilamoqchisiz?', opts:[['vocabulary','So‘z boyligi'],['grammar','Grammatika'],['speaking','Speaking'],['listening','Listening']]},
 {key:'dailyTime', q:'Har kuni qancha vaqt o‘qiy olasiz?', opts:[['5','5 daqiqa'],['10','10 daqiqa'],['20','20 daqiqa'],['30','30 daqiqa']]}
];
function screenOnboarding(step){
  $('#appPills').innerHTML='';
  const s=OB_STEPS[step-1];
  body(`
    <div class="onb-dots">${OB_STEPS.map((_,i)=>`<i class="${i<step?'on':''}"></i>`).join('')}</div>
    <h2>${s.q}</h2>
    <p class="subtle">Step ${step} of ${OB_STEPS.length} — this shapes your personal curriculum.</p>
    ${s.opts.map(o=>`<button class="onb-opt" data-v="${o[0]}">${o[1]}</button>`).join('')}
  `);
  $$('.onb-opt').forEach(btn=>btn.addEventListener('click', ()=>{
    S[s.key]=btn.dataset.v; save();
    btn.classList.add('picked');
    setTimeout(()=>{
      if(step<OB_STEPS.length) screenOnboarding(step+1);
      else { S.onboarded=true; save(); toast('Tayyor! O‘rganishni boshlang 🎉'); screenDashboard(); }
    },350);
  }));
}

/* ---- DASHBOARD ---- */
function screenDashboard(){
  setActivePill('dashboard');
  const goalPct = Math.min(100, Math.round((S.wordsKnown.length/VOCAB.length)*100));
  const claimedToday = S.dailyClaimedDate===new Date().toDateString();
  const dq = VOCAB[Math.floor(Math.random()*VOCAB.length)];
  const distract = shuffle(VOCAB.filter(v=>v.w!==dq.w)).slice(0,3).map(v=>v.uz);
  const opts = shuffle([dq.uz,...distract]);
  body(`
    <h2>Welcome back</h2>
    <p class="subtle">${LEVEL_LABEL[S.level]||'O‘quvchi'} · focusing on ${S.focus||'English'} · ${S.dailyTime||10} min/day goal</p>
    <div class="dash-grid">
      <div class="dash-stat"><b>${LEVEL_LABEL[S.level]||'—'}</b><span>LEVEL</span></div>
      <div class="dash-stat"><b>${S.xp}</b><span>XP</span></div>
      <div class="dash-stat"><b>${S.streak}</b><span>DAY STREAK</span></div>
      <div class="dash-stat"><b>${S.wordsKnown.length}/${VOCAB.length}</b><span>WORDS</span></div>
    </div>
    <div class="progress-track"><div class="progress-fill" style="width:${goalPct}%"></div></div>
    <button class="big-cta" id="continueLearnBtn">Continue Learning →</button>
    <div class="challenge-card" id="challengeCard">
      <b>Today's Challenge</b>
      ${claimedToday ? '<p class="subtle" style="margin-top:8px;">Claimed for today ✓ — come back tomorrow.</p>' : `
      <p style="margin:10px 0;">What does "<b>${dq.w}</b>" mean?</p>
      <div class="q-opts">${opts.map(o=>`<button class="q-opt" data-v="${o}">${o}</button>`).join('')}</div>`}
    </div>
  `);
  $('#continueLearnBtn').addEventListener('click', ()=>screenLesson(0));
  if(!claimedToday){
    $$('#challengeCard .q-opt').forEach(btn=>btn.addEventListener('click', ()=>{
      $$('#challengeCard .q-opt').forEach(b=>b.disabled=true);
      const ok = btn.dataset.v===dq.uz;
      btn.classList.add(ok?'correct':'incorrect');
      beep(ok);
      if(ok){ S.xp+=20; } 
      S.dailyClaimedDate=new Date().toDateString(); save();
      setTimeout(()=>{ toast(ok?'To‘g‘ri! +20 XP':'Yaxshi urinish — ertaga yana davom etamiz.'); screenDashboard(); },700);
    }));
  }
}

/* ---- LESSON (vocabulary) ---- */
function screenLesson(i){
  setActivePill('vocabulary');
  if(i>=VOCAB.length){ startQuizFlow(); return; }
  const v=VOCAB[i], known=S.wordsKnown.includes(v.w);
  body(`
    <h2>Vocabulary</h2>
    <p class="subtle">Word ${i+1} of ${VOCAB.length} ${known?'· already known':''}</p>
    <div class="word-card">
      <h3>${v.w}</h3>
      <div class="uz">${v.uz}</div>
      <p class="ex">"${v.ex}"</p>
      <button class="icon-btn" id="pronBtn" style="margin-top:18px;" title="Pronounce">🔊</button>
    </div>
    <div class="word-actions">
      <button class="btn btn-ghost" id="prevWordBtn" ${i===0?'disabled':''}>← Back</button>
      <button class="btn btn-ghost" id="againBtn">Practice again</button>
      <button class="btn btn-amber" id="knowBtn">I know this ✓</button>
    </div>
  `);
  $('#pronBtn').addEventListener('click', ()=>{
    if('speechSynthesis' in window){ const u=new SpeechSynthesisUtterance(v.w); u.lang='en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u); }
    else toast('Bu brauzerda ovozli o‘qish ishlamaydi.');
  });
  $('#prevWordBtn').addEventListener('click', ()=>screenLesson(Math.max(0,i-1)));
  $('#againBtn').addEventListener('click', ()=>screenLesson(i+1));
  $('#knowBtn').addEventListener('click', ()=>{
    if(!S.wordsKnown.includes(v.w)){ S.wordsKnown.push(v.w); save(); }
    screenLesson(i+1);
  });
}

/* ---- generic quiz runner ---- */
function runQuiz(questions, opts){
  let qi=0, score=0, answered=false;
  function render(){
    if(qi>=questions.length){ opts.onDone(score, questions.length); return; }
    const item=questions[qi]; answered=false;
    body(`
      <h2>${opts.title}</h2>
      <div class="q-count">Question ${qi+1} of ${questions.length}</div>
      <div class="q-text">${item.q}</div>
      <div class="q-opts">${item.opts.map((o,idx)=>`<button class="q-opt" data-i="${idx}">${o}</button>`).join('')}</div>
      <div class="q-footer"><span></span><span style="font-size:13px;opacity:.7">Score: ${score}/${qi}</span></div>
    `);
    $$('.q-opt').forEach(btn=>btn.addEventListener('click', ()=>{
      if(answered) return; answered=true;
      const idx=Number(btn.dataset.i); const ok=idx===item.a;
      $$('.q-opt').forEach(b=>b.disabled=true);
      if(ok){ btn.classList.add('correct'); score++; } else { btn.classList.add('incorrect'); $$('.q-opt')[item.a].classList.add('correct'); }
      beep(ok);
      setTimeout(()=>{ qi++; render(); },850);
    }));
  }
  render();
}
function buildVocabQuiz(){
  return shuffle(VOCAB).map(v=>{
    const distract = shuffle(VOCAB.filter(x=>x.w!==v.w)).slice(0,3).map(x=>x.uz);
    const opts = shuffle([v.uz,...distract]);
    return {q:`What does "${v.w}" mean?`, opts, a:opts.indexOf(v.uz)};
  });
}
function startQuizFlow(){
  setActivePill('vocabulary');
  runQuiz(buildVocabQuiz(), {title:'So‘z boyligi testi', onDone:(score,total)=>{
    const xpEarned=score*10;
    S.xp+=xpEarned; S.lessonsCompleted++; const pct=Math.round((score/total)*100);
    S.quizAccHistory.push(pct); if(score===total) S.hadPerfectQuiz=true;
    save(); screenResult(score,total,xpEarned);
  }});
}
function startGrammarFlow(){
  setActivePill('grammar');
  runQuiz(GRAMMAR, {title:'Grammatika mashqi', onDone:(score,total)=>{
    const xpEarned=score*10; S.xp+=xpEarned; S.lessonsCompleted++;
    const pct=Math.round((score/total)*100); S.quizAccHistory.push(pct);
    if(score===total) S.hadPerfectQuiz=true;
    save(); screenResult(score,total,xpEarned);
  }});
}
function screenResult(score,total,xpEarned){
  const acc=Math.round((score/total)*100);
  body(`
    <div class="quiz-done">
      <div style="font-size:40px;">🎉</div>
      <h2 style="margin-top:10px;">Lesson Complete!</h2>
      <div class="score">${score}/${total}</div>
      <p class="subtle">Accuracy ${acc}% · +${xpEarned} XP earned · Total XP: ${S.xp}</p>
      <button class="btn btn-amber" id="resContinue" style="margin-top:14px;">Continue Learning</button>
    </div>
  `);
  $('#resContinue').addEventListener('click', ()=>screenDashboard());
}

/* ---- SPEAKING ---- */
const SPEAK_CHALLENGES=[
  'I usually play football after school.',
  'She enjoys reading books in the evening.',
  'We are planning a trip next summer.',
  'He always arrives early for meetings.',
  'They have lived in this city for years.',
  'I would like a cup of coffee, please.'
];
let speakIdx=0;
let activeRecognition=null;   // holds the single in-flight SpeechRecognition instance (bug fix: prevents overlapping sessions)
let recognitionRunning=false;

function stopActiveRecognition(){
  if(activeRecognition){
    try{ activeRecognition.onresult=null; activeRecognition.onerror=null; activeRecognition.onend=null; activeRecognition.stop(); }catch(e){}
    activeRecognition=null;
  }
  recognitionRunning=false;
}

function computeAccuracy(target, heard){
  const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g,'').split(' ').filter(Boolean);
  const tW = norm(target), hW = norm(heard);
  if(tW.length===0) return 0;
  // count how many target words appear in the heard words (order-independent, each match consumed once)
  const pool = hW.slice();
  let matches=0;
  tW.forEach(w=>{ const i=pool.indexOf(w); if(i!==-1){ matches++; pool.splice(i,1); } });
  return Math.max(0, Math.min(100, Math.round((matches/tW.length)*100)));
}

function speakFeedback(acc){
  if(acc>=85) return '🎉 Ajoyib!';
  if(acc>=60) return '👍 Yaxshi! Talaffuzni yanada yaxshilang.';
  return '💪 Yana urinib ko‘ring!';
}

function screenSpeaking(){
  setActivePill('speaking');
  stopActiveRecognition();
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const target = SPEAK_CHALLENGES[speakIdx];
  const secure = window.isSecureContext || location.protocol==='file:';

  if(!SR){
    body(`
      <h2>Speaking Practice</h2>
      <div class="challenge-card">
        <b>Bu brauzerda ovozli aniqlash ishlamaydi.</b>
        <p class="subtle" style="margin-top:8px;">Google Chrome yoki Microsoft Edge brauzeridan foydalaning.</p>
      </div>
    `);
    return;
  }

  body(`
    <h2>Speaking Practice</h2>
    <p class="subtle">Say this sentence:</p>
    <div class="word-card"><p class="ex" style="font-size:19px;">"${target}"</p></div>
    ${secure ? '' : '<p class="subtle" style="color:#E8A33D;">Sayt internetga joylanganda mikrofon uchun HTTPS kerak bo‘ladi.</p>'}
    <div class="mic-status" id="micStatus">🎤 Ready to speak</div>
    <div class="word-actions">
      <button class="btn btn-amber big-cta" id="micBtn" style="max-width:300px;">🎤 Start Speaking</button>
    </div>
    <div class="mic-indicator" id="micIndicator" style="display:none;"><span class="mic-dot"></span><span>Speak now…</span></div>
    <div id="speakError"></div>
    <div id="speakResult"></div>
    <div class="word-actions" id="speakActions" style="display:none;">
      <button class="btn btn-ghost" id="tryAgainBtn">🔄 Try Again</button>
      <button class="btn btn-amber" id="nextChallengeBtn">➡️ Next Challenge</button>
    </div>
  `);

  const micBtn=$('#micBtn'), micStatus=$('#micStatus'), micIndicator=$('#micIndicator'),
        speakResult=$('#speakResult'), speakError=$('#speakError'), speakActions=$('#speakActions');

  function setIdle(){
    micBtn.textContent='🎤 Gapirishni boshlash';
    micBtn.classList.remove('listening');
    micBtn.disabled=false;
    micStatus.textContent='🎤 Gapirishga tayyor';
    micIndicator.style.display='none';
  }

  function showError(msg){
    speakError.innerHTML=`<div class="challenge-card" style="border-color:#D9534F;background:rgba(217,83,79,.1);"><b>${msg}</b></div>`;
  }

  micBtn.addEventListener('click', ()=>{
    // Bug fix: always stop any previous session before starting a new one
    stopActiveRecognition();
    speakError.innerHTML='';

    const rec = new SR();
    activeRecognition = rec;
    rec.lang='en-US';
    rec.interimResults=false;
    rec.maxAlternatives=1;

    rec.onstart=()=>{
      recognitionRunning=true;
      micBtn.textContent='🔴 Tinglanmoqda...';
      micBtn.classList.add('listening');
      micStatus.textContent='🔴 Tinglanmoqda...';
      micIndicator.style.display='flex';
    };

    rec.onresult=(e)=>{
      const heard = e.results[0][0].transcript;
      micStatus.textContent='✅ Speech detected';
      const acc = computeAccuracy(target, heard);
      speakResult.innerHTML=`
        <div class="challenge-card">
          <p><b>You said:</b><br>"${heard}"</p>
          <p style="margin-top:10px;"><b>Target:</b><br>"${target}"</p>
          <div class="progress-track"><div class="progress-fill" style="width:${acc}%"></div></div>
          <p style="margin-top:4px;"><b>Accuracy</b><br><span style="font-family:var(--serif);font-size:30px;">${acc}%</span></p>
          <p style="margin-top:10px;font-weight:700;">${speakFeedback(acc)}</p>
        </div>`;
      speakActions.style.display='flex';
    };

    rec.onerror=(e)=>{
      recognitionRunning=false;
      if(e.error==='not-allowed' || e.error==='permission-denied' || e.error==='service-not-allowed'){
        showError('Microphone access is blocked.<br>Brauzer sozlamalaridan mikrofon ruxsatini bering va qayta urinib ko‘ring.');
      } else if(e.error==='no-speech'){
        showError('Ovoz aniqlanmadi — mikrofon tomon aniqroq gapirib qayta urinib ko‘ring.');
      } else if(e.error==='audio-capture'){
        showError('Mikrofon topilmadi. Mikrofonni ulang va qayta urinib ko‘ring.');
      } else if(e.error==='network'){
        showError('Tarmoq xatosi yuz berdi. Internetni tekshirib qayta urinib ko‘ring.');
      } else {
        showError('Ovozli aniqlashda xatolik yuz berdi. Qayta urinib ko‘ring.');
      }
      setIdle();
    };

    rec.onend=()=>{
      recognitionRunning=false;
      activeRecognition=null;
      if(micBtn.textContent!=='🎤 Gapirishni boshlash'){ micBtn.textContent='🎤 Gapirishni boshlash'; micBtn.classList.remove('listening'); }
      if(micStatus.textContent==='🔴 Tinglanmoqda...'){ micStatus.textContent='🎤 Gapirishga tayyor'; }
      micIndicator.style.display='none';
      micBtn.disabled=false;
    };

    try{
      micBtn.disabled=true;
      rec.start();
    }catch(err){
      recognitionRunning=false;
      activeRecognition=null;
      showError('Mikrofonni ishga tushirib bo‘lmadi. Qayta urinib ko‘ring.');
      setIdle();
    }
  });

  $('#tryAgainBtn').addEventListener('click', ()=>{
    speakResult.innerHTML=''; speakError.innerHTML=''; speakActions.style.display='none'; setIdle();
  });
  $('#nextChallengeBtn').addEventListener('click', ()=>{
    speakIdx = (speakIdx+1) % SPEAK_CHALLENGES.length;
    screenSpeaking();
  });
}

/* ---- PROGRESS ---- */
function screenProgress(){
  setActivePill('progress');
  const avgAcc = S.quizAccHistory.length ? Math.round(S.quizAccHistory.reduce((a,b)=>a+b,0)/S.quizAccHistory.length) : 0;
  body(`
    <h2>Your Progress</h2>
    <div class="dash-grid">
      <div class="dash-stat"><b>${S.xp}</b><span>TOTAL XP</span></div>
      <div class="dash-stat"><b>${S.lessonsCompleted}</b><span>LESSONS</span></div>
      <div class="dash-stat"><b>${avgAcc}%</b><span>QUIZ ACCURACY</span></div>
      <div class="dash-stat"><b>${S.streak}</b><span>STREAK</span></div>
    </div>
    <p class="subtle">Vocabulary learned (${S.wordsKnown.length}/${VOCAB.length})</p>
    <div class="progress-track"><div class="progress-fill" style="width:${Math.round((S.wordsKnown.length/VOCAB.length)*100)}%"></div></div>
  `);
}

/* ---- ACHIEVEMENTS ---- */
function screenAchievements(){
  setActivePill('achievements');
  body(`
    <h2>Achievements</h2>
    <p class="subtle">Unlocked automatically as you learn.</p>
    <div class="ach-grid">
      ${ACHIEVEMENTS.map(a=>{ const u=a.check(S); return `<div class="ach ${u?'unlocked':''}"><div class="em">${a.em}</div><b>${a.title}</b></div>`; }).join('')}
    </div>
  `);
}

/* ---- PROFILE ---- */
function screenProfile(){
  setActivePill('profile');
  body(`
    <h2>Profil</h2>
    <div class="owner-mini">Sayt menejeri va yaratuvchisi: <b>Xorun Najmiddinov</b></div>
    <div class="word-card" style="margin-bottom:20px;">
      <div class="uz" style="font-family:var(--serif);font-size:26px;color:inherit;">${LEVEL_LABEL[S.level]||'O‘quvchi'}</div>
      <p class="subtle" style="margin-top:8px;">Focus: ${S.focus||'—'} · Daily goal: ${S.dailyTime||10} min</p>
    </div>
    <p class="subtle">Want to change your level or focus?</p>
    <button class="btn btn-ghost" id="redoOnb">Redo onboarding</button>
  `);
  $('#redoOnb').addEventListener('click', ()=>screenOnboarding(1));
}

/* ---- SETTINGS ---- */
function screenSettings(){
  setActivePill('settings');
  body(`
    <h2>Settings</h2>
    <div class="setting-row"><span>Dark mode</span><div class="switch ${S.theme==='dark'?'on':''}" id="themeSwitch"><i></i></div></div>
    <div class="setting-row"><span>Sound effects</span><div class="switch ${S.sound?'on':''}" id="soundSwitch"><i></i></div></div>
    <div class="setting-row"><span>Reset all progress</span><button class="btn btn-ghost" id="resetBtn">Reset</button></div>
  `);
  $('#themeSwitch').addEventListener('click', ()=>{ S.theme = S.theme==='dark'?'light':'dark'; save(); screenSettings(); });
  $('#soundSwitch').addEventListener('click', ()=>{ S.sound=!S.sound; save(); screenSettings(); });
  $('#resetBtn').addEventListener('click', ()=>{
    if(confirm('Barcha natijalarni tozalamoqchimisiz? Bu amalni bekor qilib bo‘lmaydi.')){
      S=defaultState(); save(); toast('Natijalar tozalandi.'); screenOnboarding(1);
    }
  });
}

/* ---- NAV / OPEN / CLOSE ---- */
const PILLS=[['dashboard','Bosh sahifa',screenDashboard],['vocabulary','So‘z boyligi',()=>screenLesson(0)],['grammar','Grammatika',startGrammarFlow],['speaking','Speaking',screenSpeaking],['progress','Progress',screenProgress],['achievements','Yutuqlar',screenAchievements],['profile','Profil',screenProfile],['settings','Sozlamalar',screenSettings]];
function renderPills(){
  $('#appPills').innerHTML = PILLS.map(p=>`<button class="pill" data-screen="${p[0]}">${p[1]}</button>`).join('');
  PILLS.forEach(p=>{ $(`.pill[data-screen="${p[0]}"]`).addEventListener('click', p[2]); });
}
function openApp(){
  $('#appOverlay').classList.add('open');
  document.body.style.overflow='hidden';
  renderPills();
  bumpStreak();
  updateTop();
  if(!S.onboarded) screenOnboarding(1); else screenDashboard();
}
function closeApp(){ stopActiveRecognition(); $('#appOverlay').classList.remove('open'); document.body.style.overflow=''; }
$('#startLearningBtn').addEventListener('click', openApp);
$('#navStartBtn').addEventListener('click', openApp);
$('#navLoginBtn').addEventListener('click', openApp);
$('#mobileStartLink').addEventListener('click', (e)=>{ e.preventDefault(); openApp(); menuToggle.classList.remove('open'); mobileMenu.classList.remove('open'); });
$('#closeAppBtn').addEventListener('click', closeApp);
updateTop();
})();