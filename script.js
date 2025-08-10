// script.js - core app logic for PWA
document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function shuffle(a){ for (let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; }
  function formatTimeSecs(totalSecs){ const m=Math.floor(totalSecs/60); const s=totalSecs%60; return `${m}:${String(s).padStart(2,'0')}`; }

  // register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(e => console.warn('SW register failed', e));
  }

  // nodes
  const openLevelsBtn = $("#open-levels"), openBoosterBtn = $("#open-booster"), openHistoryBtn = $("#open-history");
  const historyModal = $("#history-modal"), closeHistoryBtn = $("#close-history"), exportCsvBtn = $("#export-csv");
  const levelGrid = $("#level-grid");

  const ageForm = $("#age-form"), ageInput = $("#age"), perQTimeInput = $("#per-question-time");
  const qText = $("#question"), answersWrap = $("#answers"), timerEl = $("#timer"), progressEl = $("#progress");
  const levelInd = $("#level-ind"), nextBtn = $("#next-btn"), cancelBtn = $("#cancel-btn");

  const iqValue = $("#iq-value"), iqDesc = $("#iq-desc"), correctCount = $("#correct-count"), timeUsedEl = $("#time-used"), levelReachedEl = $("#level-reached");
  const toBoosterBtn = $("#to-booster");

  const openMemory = $("#open-memory"), openMath = $("#open-math");
  const memGrid = $("#mem-grid"), memInstr = $("#mem-instr"), memLevelEl = $("#mem-level"), memScoreEl = $("#mem-score"), memBestEl = $("#mem-best"), memStartBtn = $("#mem-start");
  const mathTimerEl = $("#math-timer"), mathProb = $("#math-prob"), mathAns = $("#math-answer"), mathScoreEl = $("#math-score"), mathStreakEl = $("#math-streak"), mathStartBtn = $("#math-start");

  const HISTORY_KEY = "iq_demo_history_v2";
  const BOOST_KEY = "iq_trained_boost_v2";

  // level buttons
  let selectedLevel = 1;
  function buildLevelButtons(){
    levelGrid.innerHTML = "";
    for (let i=1;i<=5;i++){
      const b = document.createElement("button");
      b.className = "level-btn";
      b.textContent = i;
      b.addEventListener("click", () => {
        selectedLevel = i;
        show("age-screen");
        $("#age").focus();
      });
      levelGrid.appendChild(b);
    }
  }
  buildLevelButtons();

  // small question bank (50 sample q's)
  const svgExample = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='300' height='120'><rect width='300' height='120' fill='%23fff8e1'/><circle cx='40' cy='60' r='20' fill='%23ff6b6b'/><circle cx='120' cy='60' r='28' fill='%23f1c40f'/><circle cx='210' cy='60' r='36' fill='%233f69b6'/></svg>`)}`;

  const questionsByLevel = {
    1: [
      { type:'text', q:'Which number comes next? 1, 4, 9, 16, 25, ?', opts:['30','36','49','64'], ans:1 },
      { type:'text', q:'If all Bloops are Razzies and all Razzies are Loppies, are Bloops Loppies?', opts:['Yes','No','Uncertain','None'], ans:0 },
      { type:'text', q:'Which word does not belong? Apple, Banana, Carrot, Grape', opts:['Apple','Banana','Carrot','Grape'], ans:2 },
      { type:'text', q:'Complete the series: 2, 4, 6, 8, ?', opts:['9','10','11','12'], ans:1 },
      { type:'text', q:'What is 7 + 6?', opts:['12','13','14','15'], ans:1 },
      { type:'text', q:'Which shape continues pattern: ◯ ◯ ◯ ◯ ? (circle repeated)', opts:['◯','△','□','◇'], ans:0 },
      { type:'text', q:'Which object is used to look at stars?', opts:['Microscope','Telescope','Periscope','Stethoscope'], ans:1 },
      { type:'text', q:'Find odd one out: Car, Bus, Bicycle, River', opts:['Car','Bus','Bicycle','River'], ans:3 },
      { type:'text', q:'What comes after Tuesday?', opts:['Monday','Tuesday','Wednesday','Friday'], ans:2 },
      { type:'image', q:`<img src="${svgExample}" alt="three circles of increasing size" /> Which circle comes next in size?`, opts:['small','medium','large','extra large'], ans:2 }
    ],
    2: [
      { type:'text', q:'What is the next square number after 49?', opts:['56','64','72','81'], ans:1 },
      { type:'text', q:'If A > B and B > C, then A > C? (True/False)', opts:['True','False','Cannot say','Sometimes'], ans:0 },
      { type:'text', q:'Which word is a synonym of "quick"?', opts:['Slow','Rapid','Calm','Loud'], ans:1 },
      { type:'text', q:'Series: 5, 10, 20, 40, ? ', opts:['50','60','70','80'], ans:3 },
      { type:'text', q:'Which instrument measures temperature?', opts:['Barometer','Thermometer','Ammeter','Odometer'], ans:1 },
      { type:'text', q:'If 3x = 12, x = ?', opts:['2','3','4','6'], ans:2 },
      { type:'text', q:'Which is a prime number?', opts:['21','22','23','24'], ans:2 },
      { type:'text', q:'Complete: 1, 1, 2, 3, 5, 8, ?', opts:['11','12','13','14'], ans:2 },
      { type:'text', q:'Which tool is used to measure angles?', opts:['Ruler','Protractor','Compass','Scale'], ans:1 },
      { type:'text', q:'Which planet is known as the Red Planet?', opts:['Earth','Venus','Mars','Jupiter'], ans:2 }
    ],
    3: [
      { type:'text', q:'Find the missing number: 3, 6, 18, 72, ?', opts:['144','216','360','432'], ans:1 },
      { type:'text', q:'Which is an antonym of "ancient"?', opts:['Modern','Old','Historic','Past'], ans:0 },
      { type:'text', q:'If 5 workmen take 8 days, 10 workmen take how many days (same work)?', opts:['2','4','6','8'], ans:1 },
      { type:'text', q:'Which follows: AB, DE, GH, ? ', opts:['IJ','JK','KL','LM'], ans:0 },
      { type:'text', q:'Solve: 12 × 12 = ?', opts:['132','144','156','168'], ans:1 },
      { type:'text', q:'Which gas do plants take in?', opts:['Oxygen','Carbon Dioxide','Nitrogen','Hydrogen'], ans:1 },
      { type:'text', q:'If the code for CAT is DBU, what is the code for DOG?', opts:['EPH','EPI','FQH','EPG'], ans:0 },
      { type:'text', q:'What is the 10th letter of the alphabet?', opts:['J','K','L','M'], ans:0 },
      { type:'text', q:'Series: 2, 3, 5, 7, 11, ?', opts:['12','13','14','15'], ans:1 },
      { type:'text', q:'Which part pumps blood?', opts:['Lungs','Heart','Liver','Kidney'], ans:1 }
    ],
    4: [
      { type:'text', q:'Which completes pattern: 4, 9, 16, 25, ? ', opts:['30','36','49','64'], ans:2 },
      { type:'text', q:'If x/2 = 9, x = ?', opts:['16','18','20','22'], ans:1 },
      { type:'text', q:'Find odd one out: Iron, Silver, Gold, Oxygen', opts:['Iron','Silver','Gold','Oxygen'], ans:3 },
      { type:'text', q:'Which is a cubic number? ', opts:['27','28','30','32'], ans:0 },
      { type:'text', q:'Math: 7 × 8 ÷ 4 = ?', opts:['12','14','16','10'], ans:0 },
      { type:'text', q:'If today is Friday, 3 days after will be?', opts:['Sunday','Saturday','Monday','Wednesday'], ans:1 },
      { type:'text', q:'Which device is for measuring electric current?', opts:['Voltmeter','Ammeter','Thermometer','Speedometer'], ans:1 },
      { type:'text', q:'Which word means "to shorten"?', opts:['Expand','Abridge','Lengthen','Increase'], ans:1 },
      { type:'text', q:'Find next: 1, 2, 6, 24, ? (factorial)', opts:['120','110','96','144'], ans:0 },
      { type:'text', q:'Which is a natural satellite of Earth?', opts:['Mars','Sun','Moon','Venus'], ans:2 }
    ],
    5: [
      { type:'text', q:'What is 15% of 200?', opts:['20','25','30','35'], ans:2 },
      { type:'text', q:'Solve: 3^4 = ?', opts:['81','27','64','9'], ans:2 },
      { type:'text', q:'Find x: 2x + 5 = 17', opts:['5','6','7','8'], ans:2 },
      { type:'text', q:'If 2/3 of a number is 14, the number is?', opts:['18','20','21','24'], ans:2 },
      { type:'text', q:'Which is the smallest prime greater than 50?', opts:['51','53','59','61'], ans:1 },
      { type:'text', q:'Which is an isosceles triangle property?', opts:['All sides equal','Two sides equal','No equal sides','Right angle only'], ans:1 },
      { type:'text', q:'If a train travels 60 km in 1.5 hours, speed is?', opts:['30 km/h','40 km/h','45 km/h','60 km/h'], ans:2 },
      { type:'text', q:'Solve: (5+3)×(7-2) = ?', opts:['40','32','35','45'], ans:0 },
      { type:'text', q:'Which is a composite number?', opts:['13','17','19','21'], ans:3 },
      { type:'text', q:'Which number completes: 2, 5, 10, 17, 26, ?', opts:['35','37','40','47'], ans:0 }
    ]
  };

  // app state
  let testState = { qlist: [], idx: 0, score: 0, perQTime: 30, timerId: null, timeLeft: 0, startTS: 0, age: 25, selectedLevel: 1 };
  let memState = { level:1, seq:[], pos:0, score:0, showing:false };
  let mathState = { time:60, timer:null, score:0, streak:0, level:1, answer:null };

  // show/hide screens
  const screens = $$(".screen");
  function show(id){
    screens.forEach(s => s.classList.remove("active"));
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("active");
    const f = el.querySelector("button, input, [tabindex]");
    if (f) f.focus();
  }

  // nav and modal
  openLevelsBtn.addEventListener("click", () => show("level-screen"));
  openBoosterBtn.addEventListener("click", () => show("booster-screen"));
  openHistoryBtn.addEventListener("click", () => { renderHistory(); historyModal.hidden = false; });
  closeHistoryBtn.addEventListener("click", () => { historyModal.hidden = true; });
  exportCsvBtn.addEventListener("click", exportCSV);
  historyModal.addEventListener("click", (e) => { if (e.target === historyModal) historyModal.hidden = true; });
  document.querySelectorAll("[data-target]").forEach(btn => btn.addEventListener("click", () => show(btn.dataset.target)));

  // start flow
  ageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const age = Number(ageInput.value), perQ = Number(perQTimeInput.value);
    if (!age || age < 6 || age > 100){ alert("Enter valid age 6–100"); return; }
    if (!perQ || perQ < 5 || perQ > 120){ alert("Per-question seconds 5–120"); return; }
    testState.perQTime = perQ; testState.age = age; testState.selectedLevel = selectedLevel;
    startTest();
  });

  function startTest(){
    const pool = questionsByLevel[testState.selectedLevel] || questionsByLevel[1];
    testState.qlist = shuffle(pool.slice());
    testState.idx = 0; testState.score = 0; testState.startTS = Date.now();
    show("test-screen"); loadQuestion();
  }

  function loadQuestion(){
    if (testState.idx >= testState.qlist.length) return finishTest();
    const item = testState.qlist[testState.idx];
    if (item.type === 'image') qText.innerHTML = item.q; else qText.textContent = item.q;

    const mapping = item.opts.map((o,i) => ({o,i})).sort(()=>Math.random()-0.5);
    answersWrap.innerHTML = "";
    mapping.forEach(m => {
      const b = document.createElement("button");
      b.className = "answer-btn"; b.textContent = m.o; b.dataset.orig = m.i;
      b.addEventListener("click", () => handleAnswer(Number(b.dataset.orig), b));
      answersWrap.appendChild(b);
    });

    progressEl.style.width = `${Math.round((testState.idx / testState.qlist.length) * 100)}%`;
    levelInd.textContent = testState.selectedLevel;

    clearTestTimer();
    testState.timeLeft = testState.perQTime;
    timerEl.textContent = testState.timeLeft;
    nextBtn.disabled = true;
    testState.timerId = setInterval(() => {
      testState.timeLeft--; timerEl.textContent = testState.timeLeft;
      if (testState.timeLeft <= 0){ clearTestTimer(); onTimeout(); }
    }, 1000);
  }

  function handleAnswer(orig, btn){
    if (testState.timerId){ clearTestTimer(); }
    $$(".answer-btn", answersWrap).forEach(b => b.disabled = true);
    btn.setAttribute("aria-pressed","true");
    const item = testState.qlist[testState.idx];
    if (orig === item.ans) testState.score++;
    nextBtn.disabled = false;
  }

  function onTimeout(){ $$(".answer-btn", answersWrap).forEach(b => b.disabled = true); nextBtn.disabled = false; }

  nextBtn.addEventListener("click", () => {
    testState.idx++; clearTestTimer();
    if (testState.idx >= testState.qlist.length) return finishTest();
    loadQuestion();
  });

  cancelBtn.addEventListener("click", () => {
    if (!confirm("Cancel test? Progress will be lost.")) return;
    clearTestTimer(); show("home-screen");
  });

  function clearTestTimer(){ if (testState.timerId){ clearInterval(testState.timerId); testState.timerId = null; } }

  function finishTest(){
    clearTestTimer();
    const total = testState.qlist.length, correct = testState.score;
    const baseIQ = 100 + (correct * 10) - ((total - correct) * 2);
    const ageFactor = clamp(Math.round((testState.age - 25) / 2), -10, 20);
    const trainedBoost = parseFloat(localStorage.getItem(BOOST_KEY) || "0");
    const rawIQ = baseIQ + ageFactor + trainedBoost;
    const displayedIQ = clamp(Math.round(rawIQ * 100) / 100, 40, 180);

    iqValue.textContent = displayedIQ.toFixed(2);
    iqDesc.textContent = displayedIQ >= 130 ? "Very Superior Intelligence" : displayedIQ >= 120 ? "Superior Intelligence" : displayedIQ >= 110 ? "High Average" : displayedIQ >= 90 ? "Average" : "Below Average";
    correctCount.textContent = `${correct}/${total}`;
    const tSec = Math.round((Date.now() - testState.startTS) / 1000);
    timeUsedEl.textContent = formatTimeSecs(tSec);
    levelReachedEl.textContent = testState.selectedLevel;

    saveHistory({ date: new Date().toISOString(), iq: Number(displayedIQ.toFixed(2)), correct, total, timeUsed: tSec, level: testState.selectedLevel, age: testState.age, trainedBoost });
    show("result-screen");
  }

  function saveHistory(item){
    try {
      const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      arr.unshift(item);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 200)));
    } catch(e){ console.warn(e); }
  }

  function renderHistory(){
    const list = $("#history-list");
    const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    if (!arr.length){ list.innerHTML = "<div class='history-item'>No history yet. Take a test to generate records.</div>"; return; }
    list.innerHTML = arr.map(r => {
      const d = new Date(r.date).toLocaleString();
      return `<div class="history-item"><strong>IQ ${r.iq}</strong> — ${r.correct}/${r.total} — ${formatTimeSecs(r.timeUsed)} — L${r.level} — age ${r.age}<div class="muted">${d}</div></div>`;
    }).join("");
  }

  function exportCSV(){
    const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    if (!arr.length){ alert("No history to export."); return; }
    const rows = [["date","iq","correct","total","timeSeconds","level","age","trainedBoost"], ...arr.map(r => [r.date,r.iq,r.correct,r.total,r.timeUsed,r.level,r.age,(r.trainedBoost||0)])];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "iq_history.csv"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  // Try Booster from results
  $("#to-booster").addEventListener("click", () => { initMemGrid(); show("booster-screen"); });

  // MEMORY booster
  function initMemGrid(){
    memGrid.innerHTML = "";
    for (let i=0;i<16;i++){
      const cell = document.createElement("div");
      cell.className = "cell"; cell.dataset.index = i; cell.tabIndex = 0;
      cell.addEventListener("click", () => memCellClick(i));
      cell.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") memCellClick(i); });
      memGrid.appendChild(cell);
    }
    memLevelEl.textContent = memState.level || 1;
    memScoreEl.textContent = memState.score || 0;
    memBestEl.textContent = localStorage.getItem("mem_best_v2") || 0;
  }

  function memStart(){
    memState.seq = []; memState.pos = 0; memState.showing = true; memInstr.textContent = "Watch the highlighted cells...";
    const len = Math.min(12, memState.level + 2);
    while (memState.seq.length < len){ const r = Math.floor(Math.random() * 16); if (!memState.seq.includes(r)) memState.seq.push(r); }
    const cells = $$(".cell", memGrid);
    let t = 0;
    memState.seq.forEach(idx => { setTimeout(()=>{ cells[idx].classList.add("active"); setTimeout(()=>cells[idx].classList.remove("active"),700); }, t); t += 900; });
    setTimeout(()=>{ memState.showing = false; memInstr.textContent = "Now click the cells in the same order."; memState.pos = 0; }, t + 200);
  }

  function memCellClick(i){
    if (memState.showing) return;
    const expected = memState.seq[memState.pos];
    const el = memGrid.querySelector(`.cell[data-index="${i}"]`);
    if (!el) return;
    if (i === expected){
      el.classList.add("active"); setTimeout(()=>el.classList.remove("active"),300);
      memState.pos++;
      if (memState.pos === memState.seq.length){
        memState.score = (memState.score || 0) + (memState.level * 10);
        memScoreEl.textContent = memState.score;
        memInstr.textContent = "Correct! Level up available.";
        const prev = Number(localStorage.getItem("mem_best_v2") || 0);
        if (memState.score > prev){ localStorage.setItem("mem_best_v2", memState.score); memBestEl.textContent = memState.score; }
        memState.level++; memLevelEl.textContent = memState.level;
        setTimeout(()=> { applyTrainingFromBooster('memory', memState.score); }, 700);
      }
    } else {
      el.classList.add("wrong"); setTimeout(()=>el.classList.remove("wrong"),400);
      memInstr.textContent = "Incorrect — try again.";
      setTimeout(()=>memStart(), 900);
    }
  }

  memStartBtn.addEventListener("click", memStart);
  openMemory.addEventListener("click", () => { initMemGrid(); show("memory-screen"); });

  // MATH booster
  function resetMath(){ if (mathState.timer) clearInterval(mathState.timer); mathState = { time:60, timer:null, score:0, streak:0, level:1, answer:null }; mathScoreEl.textContent = mathState.score; mathStreakEl.textContent = mathState.streak; mathTimerEl.textContent = mathState.time; mathProb.textContent = "—"; mathAns.value = ""; mathAns.disabled = true; }

  function genMath(){ const ops = ["+","-","×","÷"]; const op = ops[Math.floor(Math.random()*ops.length)]; const level = mathState.level; let n1,n2,ans; if (op === "+"){ n1 = rand(10,20+level*5); n2 = rand(5,10+level*4); ans = n1+n2; } else if (op === "-"){ n1 = rand(15,30+level*5); n2 = rand(5,10+level*4); if (n2>n1) [n1,n2]=[n2,n1]; ans = n1-n2; } else if (op === "×"){ n1 = rand(2,8+level); n2 = rand(2,8+level); ans = n1*n2; } else { n2 = rand(2,8); ans = rand(2,8); n1 = n2*ans; } mathState.answer = ans; mathProb.textContent = `${n1} ${op} ${n2} = ?`; mathAns.value = ""; mathAns.focus(); }

  function rand(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

  mathStartBtn.addEventListener("click", () => {
    resetMath();
    mathAns.disabled = false;
    genMath();
    mathState.timer = setInterval(()=> {
      mathState.time--; mathTimerEl.textContent = mathState.time;
      if (mathState.time <= 0){ clearInterval(mathState.timer); mathState.timer = null; mathAns.disabled = true; alert(`Time's up! Math score: ${mathState.score}`); applyTrainingFromBooster('math', mathState.score); }
    }, 1000);
  });

  mathAns.addEventListener("keydown", (e) => {
    if (e.key === "Enter"){
      const v = Number(mathAns.value.trim());
      if (!Number.isFinite(v)){ mathAns.value = ""; return; }
      if (v === mathState.answer){ mathState.streak++; mathState.score += 10 + (mathState.streak * 2); if (mathState.streak % 5 === 0) mathState.level++; mathAns.style.background = "#d4edda"; setTimeout(()=>mathAns.style.background = "", 180); } else { mathState.streak = 0; mathAns.style.background = "#f8d7da"; setTimeout(()=>mathAns.style.background = "", 180); }
      mathScoreEl.textContent = mathState.score; mathStreakEl.textContent = mathState.streak; genMath();
    }
  });

  openMath.addEventListener("click", () => { resetMath(); show("math-screen"); });

  // training boost
  function applyTrainingFromBooster(type, sessionScore){
    const sessionMax = type === 'memory' ? 200 : 600;
    const sessionRatio = clamp(sessionScore / sessionMax, 0, 1);
    const sessionBoost = Math.round(sessionRatio * 10 * 100) / 100;
    const prev = parseFloat(localStorage.getItem(BOOST_KEY) || "0");
    const increment = Math.round(sessionBoost * 0.05 * 100) / 100;
    const next = Math.round((prev + increment) * 100) / 100;
    localStorage.setItem(BOOST_KEY, String(next));
    setTimeout(() => { alert(`Booster complete! Small training effect added: +${increment.toFixed(2)} IQ (total boost: ${next.toFixed(2)}).`); }, 200);
  }

  // boot
  function boot(){ buildLevelButtons(); initMemGrid(); resetMath(); show("home-screen"); }
  boot();
});
