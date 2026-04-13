/* ══════════════════════════
   SLIDE ENGINE
══════════════════════════ */

const TOTAL_SLIDES = 12;
let currentSlide = 0;

function updateProgress() {
  const pct = ((currentSlide + 1) / TOTAL_SLIDES) * 100;
  const bar = document.getElementById('progressBar');
  const counter = document.getElementById('slideCounter');
  if (bar) bar.style.width = pct + '%';
  if (counter) counter.textContent = `${currentSlide + 1} / ${TOTAL_SLIDES}`;
}

function goToSlide(n) {
  const slides = document.querySelectorAll('.slide');
  const cur = slides[currentSlide];
  const nxt = slides[n];
  if (!nxt || !cur) return;

  cur.classList.remove('active');
  cur.classList.add('exit');
  setTimeout(() => cur.classList.remove('exit'), 700);

  nxt.classList.add('active');
  currentSlide = n;

  updateProgress();
  onSlideEnter(n);
}

function nextSlide() {
  if (currentSlide < TOTAL_SLIDES - 1) goToSlide(currentSlide + 1);
}
function prevSlide() {
  if (currentSlide > 0) goToSlide(currentSlide - 1);
}

/* ══════════════════════════
   SLIDE ENTER HOOKS
══════════════════════════ */

function onSlideEnter(n) {
  if (n === 2) initDDDiagram();
  if (n === 3) initIonStage(1);
  if (n === 4) initIonStage(2);
  if (n === 5) initIonStage(3);
  if (n === 6) initIonStage(4);
  if (n === 7) initIonStage(5);
  if (n === 10) initQuiz();
}

/* ══════════════════════════
   DD DIAGRAM
══════════════════════════ */

function initDDDiagram() {
  setTimeout(() => {
    const p1 = document.getElementById('swapPath1');
    const p2 = document.getElementById('swapPath2');
    if (!p1 || !p2) return;

    p1.setAttribute('d', 'M 20,8 C 60,50 130,-10 170,32');
    p2.setAttribute('d', 'M 170,8 C 130,50 60,-10 20,32');

    setTimeout(() => {
      p1.classList.add('animate');
      p2.classList.add('animate');
    }, 350);
  }, 250);
}

/* ══════════════════════════
   ION STAGE
══════════════════════════ */

const eqState = {};

function initIonStage(eqNum) {
  eqState[eqNum] = 0;

  const eq = EQUATIONS[eqNum - 1];
  const stage = document.getElementById(`ionStage${eqNum}`);
  if (!stage || !eq) return;

  // Reset buttons
  for (let s = 1; s <= 4; s++) {
    const prefix = eqNum === 1 ? '' : `e${eqNum}`;
    const btn = document.getElementById(`${prefix}step${s}Btn`);
    if (!btn) continue;
    btn.classList.remove('done');
    if (s === 1) {
      btn.classList.remove('disabled');
      btn.style.pointerEvents = 'auto';
    } else {
      btn.classList.add('disabled');
    }
  }

  const expEl = document.getElementById(`eq${eqNum}Exp`);
  if (expEl) expEl.innerHTML = '<p>Click <strong>Step 1</strong> to begin the ion exchange animation.</p>';

  const nextBtn = document.getElementById(`eq${eqNum}Next`);
  if (nextBtn) { nextBtn.style.opacity = '0.4'; nextBtn.style.pointerEvents = 'none'; }

  stage.innerHTML = '';
  const canvas = document.createElement('div');
  canvas.className = 'ion-canvas';
  canvas.id = `canvas${eqNum}`;
  stage.appendChild(canvas);

  renderReactants(eqNum, canvas, eq);
}

function renderReactants(eqNum, canvas, eq) {
  canvas.innerHTML = '';

  const row = document.createElement('div');
  row.className = 'ion-row';

  row.appendChild(mkCompound(eq.reactant1.cat, eq.reactant1.an, `r1c-${eqNum}`, `r1a-${eqNum}`));

  const plus = document.createElement('div');
  plus.className = 'ion-plus';
  plus.textContent = '+';
  row.appendChild(plus);

  row.appendChild(mkCompound(eq.reactant2.cat, eq.reactant2.an, `r2c-${eqNum}`, `r2a-${eqNum}`));

  const arr = document.createElement('div');
  arr.className = 'ion-arrow';
  arr.textContent = '→';
  row.appendChild(arr);

  const pHolder = document.createElement('div');
  pHolder.className = 'ion-row';
  pHolder.id = `products-row-${eqNum}`;
  pHolder.innerHTML = '<span style="color:var(--muted);font-family:\'DM Mono\',monospace;font-size:18px">?</span>';
  row.appendChild(pHolder);

  canvas.appendChild(row);

  const balRow = document.createElement('div');
  balRow.id = `balanced-row-${eqNum}`;
  balRow.style.display = 'none';
  canvas.appendChild(balRow);
}

function mkCompound(catText, anText, catId, anId) {
  const wrap = document.createElement('div');
  wrap.className = 'ion-compound';

  const cat = document.createElement('div');
  cat.className = 'ion-token cat';
  cat.id = catId;
  cat.textContent = catText;

  const an = document.createElement('div');
  an.className = 'ion-token an';
  an.id = anId;
  an.textContent = anText;

  wrap.appendChild(cat);
  wrap.appendChild(an);
  return wrap;
}

/* ══════════════════════════
   EQUATIONS
══════════════════════════ */

const EQUATIONS = [
  {
    reactant1: { cat: "Pb²⁺", an: "Br⁻" },
    reactant2: { cat: "Na⁺", an: "SO₄²⁻" },
    product1:  { cat: "PbSO₄", an: "" },
    product2:  { cat: "NaBr", an: "" },
    steps: [
      "Identify the ions in both compounds — Pb²⁺ and Br⁻ from PbBr₂, Na⁺ and SO₄²⁻ from Na₂SO₄.",
      "Swap anion partners — Pb²⁺ takes SO₄²⁻, and Na⁺ takes Br⁻.",
      "Write the new products: PbSO₄ (insoluble ↓) and NaBr (soluble).",
      "Balanced equation: PbBr₂ + Na₂SO₄ → PbSO₄↓ + 2NaBr"
    ],
    balanced: "PbBr₂ + Na₂SO₄ → PbSO₄↓ + 2NaBr"
  },
  {
    reactant1: { cat: "Ag⁺", an: "NO₃⁻" },
    reactant2: { cat: "K⁺", an: "Cl⁻" },
    product1:  { cat: "AgCl", an: "" },
    product2:  { cat: "KNO₃", an: "" },
    steps: [
      "Identify the ions — Ag⁺ and NO₃⁻ from AgNO₃, K⁺ and Cl⁻ from KCl.",
      "Swap anion partners — Ag⁺ takes Cl⁻, K⁺ takes NO₃⁻.",
      "Write the new products: AgCl (insoluble ↓) and KNO₃ (soluble).",
      "Balanced equation: AgNO₃ + KCl → AgCl↓ + KNO₃"
    ],
    balanced: "AgNO₃ + KCl → AgCl↓ + KNO₃"
  },
  {
    reactant1: { cat: "Ba²⁺", an: "Cl⁻" },
    reactant2: { cat: "Na⁺", an: "SO₄²⁻" },
    product1:  { cat: "BaSO₄", an: "" },
    product2:  { cat: "NaCl", an: "" },
    steps: [
      "Identify the ions — Ba²⁺ and Cl⁻ from BaCl₂, Na⁺ and SO₄²⁻ from Na₂SO₄.",
      "Swap anion partners — Ba²⁺ takes SO₄²⁻, Na⁺ takes Cl⁻.",
      "Write the new products: BaSO₄ (insoluble ↓) and NaCl (soluble).",
      "Balanced equation: BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl"
    ],
    balanced: "BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl"
  },
  {
    reactant1: { cat: "Cu²⁺", an: "SO₄²⁻" },
    reactant2: { cat: "Na⁺", an: "OH⁻" },
    product1:  { cat: "Cu(OH)₂", an: "" },
    product2:  { cat: "Na₂SO₄", an: "" },
    steps: [
      "Identify the ions — Cu²⁺ and SO₄²⁻ from CuSO₄, Na⁺ and OH⁻ from NaOH.",
      "Swap anion partners — Cu²⁺ takes OH⁻, Na⁺ takes SO₄²⁻.",
      "Write the new products: Cu(OH)₂ (insoluble blue ↓) and Na₂SO₄ (soluble).",
      "Balanced equation: CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄"
    ],
    balanced: "CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄"
  },
  {
    reactant1: { cat: "Pb²⁺", an: "NO₃⁻" },
    reactant2: { cat: "K⁺", an: "I⁻" },
    product1:  { cat: "PbI₂", an: "" },
    product2:  { cat: "KNO₃", an: "" },
    steps: [
      "Identify the ions — Pb²⁺ and NO₃⁻ from Pb(NO₃)₂, K⁺ and I⁻ from KI.",
      "Swap anion partners — Pb²⁺ takes I⁻, K⁺ takes NO₃⁻.",
      "Write the new products: PbI₂ (bright yellow ↓) and KNO₃ (soluble).",
      "Balanced equation: Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃"
    ],
    balanced: "Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃"
  }
];

/* ══════════════════════════
   STEP LOGIC
══════════════════════════ */

function runStep(eqNum, step) {
  const eq = EQUATIONS[eqNum - 1];
  if (!eq) return;

  const prefix = eqNum === 1 ? '' : `e${eqNum}`;
  const btn = document.getElementById(`${prefix}step${step}Btn`);
  if (btn) { btn.classList.add('done'); btn.classList.add('disabled'); }

  const exp = document.getElementById(`eq${eqNum}Exp`);
  if (exp) exp.innerHTML = `<p>${eq.steps[step - 1]}</p>`;

  if (step < 4) {
    const next = document.getElementById(`${prefix}step${step + 1}Btn`);
    if (next) next.classList.remove('disabled');
  }

  if (step === 1) stepHighlight(eqNum);
  if (step === 2) stepSwap(eqNum);
  if (step === 3) stepProducts(eqNum, eq);
  if (step === 4) stepBalance(eqNum, eq);
}

function stepHighlight(eqNum) {
  ['r1c', 'r1a', 'r2c', 'r2a'].forEach((base, i) => {
    setTimeout(() => {
      const el = document.getElementById(`${base}-${eqNum}`);
      if (el) {
        el.classList.add('highlight');
        setTimeout(() => el.classList.remove('highlight'), 900);
      }
    }, i * 200);
  });
}

function stepSwap(eqNum) {
  const r1a = document.getElementById(`r1a-${eqNum}`);
  const r2a = document.getElementById(`r2a-${eqNum}`);
  if (!r1a || !r2a) return;

  const rect1 = r1a.getBoundingClientRect();
  const rect2 = r2a.getBoundingClientRect();
  const dx = rect2.left - rect1.left;

  r1a.style.transition = '0.6s';
  r2a.style.transition = '0.6s';
  r1a.style.transform = `translate(${dx}px,-32px)`;
  r2a.style.transform = `translate(${-dx}px,-32px)`;

  setTimeout(() => {
    const tmp = r1a.textContent;
    r1a.textContent = r2a.textContent;
    r2a.textContent = tmp;
    r1a.style.transform = '';
    r2a.style.transform = '';
  }, 750);
}

function stepProducts(eqNum, eq) {
  const pRow = document.getElementById(`products-row-${eqNum}`);
  if (!pRow) return;
  pRow.innerHTML = '';

  pRow.appendChild(mkCompound(eq.product1.cat, eq.product1.an, `p1c-${eqNum}`, `p1a-${eqNum}`));

  const plus = document.createElement('div');
  plus.textContent = '+';
  plus.className = 'ion-plus';
  pRow.appendChild(plus);

  pRow.appendChild(mkCompound(eq.product2.cat, eq.product2.an, `p2c-${eqNum}`, `p2a-${eqNum}`));
}

function stepBalance(eqNum, eq) {
  const bal = document.getElementById(`balanced-row-${eqNum}`);
  if (!bal) return;

  bal.style.display = 'block';
  bal.innerHTML = `<div class="balanced-eq">${eq.balanced}</div>`;

  const nextBtn = document.getElementById(`eq${eqNum}Next`);
  if (nextBtn) { nextBtn.style.opacity = '1'; nextBtn.style.pointerEvents = 'auto'; }
}

/* ══════════════════════════
   QUIZ
══════════════════════════ */

const QUESTIONS = [
  {
    q: "What is a cation?",
    options: ["A negatively charged ion", "A positively charged ion", "A neutral atom", "A gas molecule"],
    answer: 1
  },
  {
    q: "In a double displacement reaction, what happens?",
    options: ["Electrons are lost", "Ions swap partners", "Atoms disappear", "Only metals react"],
    answer: 1
  },
  {
    q: "What drives a precipitation reaction?",
    options: ["Gas formation", "Light emission", "Insoluble solid formation", "Sound energy"],
    answer: 2
  },
  {
    q: "Which is an example of a gas-forming reaction?",
    options: ["NaCl + KNO₃", "Na₂CO₃ + HCl", "AgNO₃ + KCl", "BaCl₂ + NaCl"],
    answer: 1
  },
  {
    q: "What is the general formula for double displacement?",
    options: ["A + B → AB", "AB → A + B", "AB + CD → AD + CB", "A → B → C"],
    answer: 2
  }
];

let quizIndex = 0;
let score = 0;

function initQuiz() {
  quizIndex = 0;
  score = 0;
  renderQuestion();
}

function renderQuestion() {
  const wrap = document.getElementById('quizWrap');
  const q = QUESTIONS[quizIndex];
  if (!wrap || !q) return;

  wrap.innerHTML = `
    <div class="quiz-q-container">
      <div class="q-header">
        <div class="q-num">${quizIndex + 1}</div>
        <div class="q-text">${q.q}</div>
      </div>
      <div class="q-options">
        ${q.options.map((opt, i) => `
          <button class="q-option" onclick="selectAnswer(${i})">
            <div class="opt-letter">${String.fromCharCode(65 + i)}</div>
            ${opt}
          </button>
        `).join('')}
      </div>
      <div class="q-nav">
        <button class="btn-ghost" onclick="prevQ()">← Prev</button>
        <button class="btn-next" onclick="nextQ()">Next →</button>
      </div>
    </div>
  `;
}

function selectAnswer(i) {
  const q = QUESTIONS[quizIndex];
  const buttons = document.querySelectorAll('.q-option');
  buttons.forEach((b, idx) => {
    b.classList.add('answered');
    if (idx === q.answer) b.classList.add('correct');
    if (idx === i && i !== q.answer) b.classList.add('wrong');
  });
  if (i === q.answer) score++;
}

function nextQ() {
  if (quizIndex < QUESTIONS.length - 1) {
    quizIndex++;
    renderQuestion();
  } else {
    showResult();
  }
}

function prevQ() {
  if (quizIndex > 0) {
    quizIndex--;
    renderQuestion();
  }
}

function showResult() {
  goToSlide(11);
  const scoreEl = document.getElementById('resultScore');
  const orb = document.getElementById('resultOrb');
  const msgEl = document.getElementById('resultMsg');
  const subEl = document.getElementById('resultSub');

  if (scoreEl) scoreEl.textContent = `${score}/${QUESTIONS.length}`;

  const pct = (score / QUESTIONS.length) * 100;
  if (orb) orb.style.setProperty('--pct', pct + '%');

  if (msgEl) {
    if (pct === 100) msgEl.textContent = 'Perfect score!';
    else if (pct >= 60) msgEl.textContent = 'Well done!';
    else msgEl.textContent = 'Keep practising!';
  }
  if (subEl) {
    subEl.textContent = pct >= 80
      ? 'You have a solid grasp of ionic double displacement reactions.'
      : 'Review the tutorial slides and try again to strengthen your understanding.';
  }
}

function restartQuiz() {
  goToSlide(10);
}

/* ══════════════════════════
   INIT
══════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const first = document.querySelector('.slide[data-slide="0"]');
  if (first) first.classList.add('active');
  updateProgress();
});

window.runStep   = runStep;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.goToSlide = goToSlide;
window.restartQuiz = restartQuiz;