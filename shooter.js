// import * as THREE from 'three'; // Removed to bypass CORS on local file double-click

// ── GAME STATE ──────────────────────────────────────────────────────────────
let lives = 2, kills = 0;
const targetKills = Math.floor(Math.random() * 11) + 15; // Between 15 and 25 inclusive
let isDead = false, gameWon = false;
let respawnsAllowed = 1;
let mathIndex = 0, answer = 0;
let damageCooldown = 0;
let locked = false; // pointer lock active?

document.getElementById('targetDisplay').innerText = targetKills;

// ── RENDERER ────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);                    // always 1:1, no supersampling
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xccb997);
scene.fog = new THREE.FogExp2(0xccb997, 0.022);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.3, 100);

// ── MANUAL POINTER LOCK + CAMERA LOOK ──────────────────────────────────────
// Using raw Euler angles updated directly on mousemove — zero latency.
let yaw = 0;
  let pitch = 0;
const SENSITIVITY = 0.0020;
const MAX_PITCH = Math.PI / 2 - 0.01;

// Set rotation order ONCE here — setting it every frame triggers expensive matrix recalcs
camera.rotation.order = 'YXZ';

const canvas = renderer.domElement;
// Allow click anywhere on page to start
function tryLock() {
  if (!isDead && !gameWon && !locked) canvas.requestPointerLock();
}
canvas.addEventListener('click', tryLock);
document.getElementById('instructions').addEventListener('click', tryLock);

document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  document.getElementById('instructions').style.display =
    (!locked && !isDead && !gameWon) ? 'flex' : 'none';
});

// Accumulate raw mouse deltas — use getCoalescedEvents() to recover all
// intermediate samples Chrome discards when batching mousemove events
let mouseDX = 0, mouseDY = 0;

document.addEventListener('mousemove', (e) => {
  if (!locked || isDead || gameWon) return;
  // getCoalescedEvents recovers every raw hardware sample in this batch
  const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const ce of events) {
    mouseDX += ce.movementX;
    mouseDY += ce.movementY;
  }
});

// ── LIGHTING ────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 0.5);
sun.position.set(-10, 30, 10);
scene.add(sun);

// ── ENVIRONMENT ─────────────────────────────────────────────────────────────
// All MeshBasicMaterial — zero per-fragment lighting cost
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(140, 140),
  new THREE.MeshBasicMaterial({ color: 0xa99b79 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const BOX_GEO = new THREE.BoxGeometry(4,4,4);
const BOX_MAT = new THREE.MeshBasicMaterial({color:0x8a7b5d});
for (let i = 0; i < 12; i++) {
  const b = new THREE.Mesh(BOX_GEO, BOX_MAT);
  b.position.set((Math.random()-.5)*80, 2, (Math.random()-.5)*80);
  if (Math.hypot(b.position.x, b.position.z) > 12) scene.add(b);
}

// ── SHARED ENEMY ASSETS (created once, referenced by all instances) ─────────
const M = {
  vest  : new THREE.MeshBasicMaterial({color:0x78350f}),
  head  : new THREE.MeshBasicMaterial({color:0x451a03}),
  pants : new THREE.MeshBasicMaterial({color:0xb45309}),
  eyes  : new THREE.MeshBasicMaterial({color:0xfcd34d}),
  hb    : new THREE.MeshBasicMaterial({visible:false}),
  blood : new THREE.MeshBasicMaterial({color:0x7f0000}),
};
const G = {
  torso : new THREE.BoxGeometry(1.2,1.5,0.8),
  head  : new THREE.BoxGeometry(0.8,0.8,0.8),
  eyes  : new THREE.PlaneGeometry(0.5,0.2),
  leg   : new THREE.BoxGeometry(0.5,1.5,0.5),
  arm   : new THREE.BoxGeometry(0.4,1.4,0.4),
  hb    : new THREE.BoxGeometry(1.5,4,1.5),
  blood : new THREE.BoxGeometry(0.15,0.15,0.15),
};

// ── ENEMIES ─────────────────────────────────────────────────────────────────
const enemies  = [];
const hitBoxes = [];
const MAX_ENEMIES = 10;

function spawnEnemy() {
  if (isDead || gameWon || enemies.length >= MAX_ENEMIES) return;
  const g = new THREE.Group();

  const torso = new THREE.Mesh(G.torso, M.vest);  torso.position.y = 2.25; g.add(torso);
  const head  = new THREE.Mesh(G.head,  M.head);  head.position.y  = 3.4;  g.add(head);
  const eyes  = new THREE.Mesh(G.eyes,  M.eyes);  eyes.position.set(0, 3.4, 0.41); g.add(eyes);
  const legL  = new THREE.Mesh(G.leg,   M.pants); legL.position.set(-0.35,0.75,0); g.add(legL);
  const legR  = new THREE.Mesh(G.leg,   M.pants); legR.position.set( 0.35,0.75,0); g.add(legR);
  const armL  = new THREE.Mesh(G.arm,   M.pants); armL.position.set(-0.8,2.2,0);   g.add(armL);
  const armR  = new THREE.Mesh(G.arm,   M.pants); armR.position.set(0.8,2.2,0.2);
  armR.rotation.x = -Math.PI/3; g.add(armR);

  const a = Math.random() * Math.PI * 2;
  const d = 25 + Math.random() * 18;
  g.position.set(Math.cos(a)*d, 0, Math.sin(a)*d);
  scene.add(g);

  const hb = new THREE.Mesh(G.hb, M.hb);
  hb.position.set(g.position.x, 2, g.position.z);
  scene.add(hb);
  hitBoxes.push(hb);

  enemies.push({ mesh:g, hb, legL, legR, hp:3,
    speed: 3 + Math.random()*1.5, wobble: Math.random()*10 });
}

setInterval(spawnEnemy, 2500);

// ── PARTICLE OBJECT POOL (Memory Optimization) ──────────────────────────────
const particlePool = [];
const POOL_SIZE = 40;

// Pre-allocate all particles at startup to prevent garbage collection stutters
for (let i = 0; i < POOL_SIZE; i++) {
  const p = new THREE.Mesh(G.blood, M.blood);
  p.position.set(0, -10, 0); // Hide underground
  p.visible = false;
  p.life = 0;
  scene.add(p);
  particlePool.push(p);
}

function spawnBlood(pos) {
  let spawned = 0;
  for (let i = 0; i < POOL_SIZE; i++) {
    const p = particlePool[i];
    if (p.life <= 0) {
      p.position.copy(pos);
      p.vx = (Math.random()-.5)*8; p.vy = Math.random()*6+2; p.vz = (Math.random()-.5)*8;
      p.life = 0.7;
      p.visible = true;
      p.scale.setScalar(0.7);
      spawned++;
      if (spawned >= 4) break;
    }
  }
}

// ── SHOOTING ────────────────────────────────────────────────────────────────
let audioCtx;
function playShoot() {
  if (!audioCtx) audioCtx = new window.AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(280, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.08);
  g.gain.setValueAtTime(0.25, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
  o.start(); o.stop(audioCtx.currentTime + 0.08);
}

const raycaster = new THREE.Raycaster();
raycaster.far = 100;
const screenCenter = new THREE.Vector2(0, 0);

document.addEventListener('mousedown', (e) => {
  if (!locked || isDead || gameWon || e.button !== 0) return;
  playShoot();
  raycaster.setFromCamera(screenCenter, camera);
  const hits = raycaster.intersectObjects(hitBoxes);
  if (!hits.length) return;
  const hb   = hits[0].object;
  const eObj = enemies.find(en => en.hb === hb);
  if (!eObj) return;
  eObj.hp--;
  spawnBlood(hits[0].point);
  if (eObj.hp <= 0) {
    scene.remove(eObj.mesh); scene.remove(eObj.hb);
    enemies.splice(enemies.indexOf(eObj), 1);
    hitBoxes.splice(hitBoxes.indexOf(hb), 1);
    kills++;
    document.getElementById('killsDisplay').innerText = kills;
    if (kills >= targetKills) triggerWin();
  }
});

// ── DAMAGE ──────────────────────────────────────────────────────────────────
function takeDamage() {
  if (damageCooldown > 0) return;
  damageCooldown = 1.2;
  lives--;
  document.getElementById('livesDisplay').innerText = lives;
  const v = document.getElementById('vignette');
  v.classList.add('hit');
  setTimeout(() => v.classList.remove('hit'), 250);

  for (let i = enemies.length - 1; i >= 0; i--) {
    const dx = enemies[i].mesh.position.x - camera.position.x;
    const dz = enemies[i].mesh.position.z - camera.position.z;
    if (dx*dx + dz*dz < 144) {
      scene.remove(enemies[i].mesh); scene.remove(enemies[i].hb);
      hitBoxes.splice(hitBoxes.indexOf(enemies[i].hb), 1);
      enemies.splice(i, 1);
    }
  }
  if (lives <= 0) respawnsAllowed > 0 ? triggerDeath() : gameOverFail();
}

// ── MATH ────────────────────────────────────────────────────────────────────
function genMath() {
  let q;
  if      (mathIndex===0){ const a=~~(Math.random()*20)+1, b=~~(Math.random()*20)+1; answer=a+b; q=`${a} + ${b} = ?`; }
  else if (mathIndex===1){ const a=~~(Math.random()*15)+15, b=~~(Math.random()*14)+1; answer=a-b; q=`${a} - ${b} = ?`; }
  else if (mathIndex===2){ const a=~~(Math.random()*11)+2, b=~~(Math.random()*11)+2; answer=a*b; q=`${a} × ${b} = ?`; }
  else                   { const b=~~(Math.random()*9)+2, c=~~(Math.random()*9)+2; answer=c; q=`${b*c} ÷ ${b} = ?`; }
  document.getElementById('q').innerText = q;
  const inp = document.getElementById('ans'); inp.value=''; inp.focus();
}

function triggerDeath() {
  isDead=true; document.exitPointerLock(); locked=false;
  mathIndex=0; document.getElementById('prog').innerText='0 / 4 Sequences';
  document.getElementById('mathUI').style.display='flex'; genMath();
}
function triggerWin() {
  gameWon=true; document.exitPointerLock(); locked=false;
  document.getElementById('endTitle').innerText='COUNTER-TERRORISTS WIN';
  document.getElementById('endTitle').style.color='#10b981';
  document.getElementById('finalScore').innerText=kills;
  document.getElementById('endUI').style.display='flex';
}
function gameOverFail() {
  document.getElementById('mathUI').style.display='none';
  document.getElementById('endTitle').innerText='TERRORISTS WIN';
  document.getElementById('endTitle').style.color='#d93d3d';
  document.getElementById('finalScore').innerText=kills;
  document.getElementById('endUI').style.display='flex';
}

document.getElementById('ans').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const val = parseInt(e.target.value);
  if (val === answer) {
    e.target.style.borderColor='#10b981';
    mathIndex++;
    document.getElementById('prog').innerText=`${mathIndex} / 4 Sequences`;
    setTimeout(() => {
      e.target.style.borderColor='#555';
      if (mathIndex >= 4) {
        lives=2; respawnsAllowed--;
        document.getElementById('livesDisplay').innerText=lives;
        document.getElementById('mathUI').style.display='none';
        isDead=false;
        camera.position.set(0,2,0); yaw=0; pitch=0;
        camera.rotation.set(0,0,0,'YXZ');
        canvas.requestPointerLock();
      } else genMath();
    }, 300);
  } else {
    e.target.style.borderColor='#ff4d4d';
    setTimeout(() => { e.target.style.borderColor='#555'; genMath(); }, 500);
  }
});

// ── PLAYER STATE ─────────────────────────────────────────────────────────────
const keys = {};
document.addEventListener('keydown', e => { keys[e.code]=true; });
document.addEventListener('keyup',   e => { keys[e.code]=false; });

camera.position.set(0, 2, 5);

// ── RESIZE ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── GAME LOOP ────────────────────────────────────────────────────────────────
let prevTime = performance.now();

// Forward vector (reused, no allocation in loop)
const fwd  = new THREE.Vector3();
const right = new THREE.Vector3();

function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  const dt  = Math.min((now - prevTime) / 1000, 0.05);
  prevTime  = now;

  if (damageCooldown > 0) damageCooldown -= dt;

  // ── Apply all accumulated mouse samples this frame ──
  if (locked && !isDead && !gameWon && (mouseDX !== 0 || mouseDY !== 0)) {
    yaw   -= mouseDX * SENSITIVITY;
    pitch -= mouseDY * SENSITIVITY;
    pitch  = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch));
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    mouseDX = 0;
    mouseDY = 0;
  }

  // ── Movement (direction derived from raw yaw, independent of camera pitch) ──
  if (locked && !isDead && !gameWon) {
    const spd = 18 * dt;
    fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));

    if (keys['KeyW']) camera.position.addScaledVector(fwd, spd);
    if (keys['KeyS']) camera.position.addScaledVector(fwd, -spd);
    if (keys['KeyD']) camera.position.addScaledVector(right, spd);
    if (keys['KeyA']) camera.position.addScaledVector(right, -spd);
    camera.position.y = 2; // keep on ground
  }

  // ── Enemy AI (With Flocking / Separation) ──────────────────────────────────
  if (!isDead && !gameWon) {
    const px = camera.position.x, pz = camera.position.z;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      let mx = e.mesh.position.x, mz = e.mesh.position.z;
      
      // 1. Separation (Flocking) - slightly push away from other enemies
      let sepX = 0, sepZ = 0;
      for (let j = 0; j < enemies.length; j++) {
        if (i === j) continue;
        const ox = enemies[j].mesh.position.x, oz = enemies[j].mesh.position.z;
        const dxO = mx - ox, dzO = mz - oz;
        const dist2O = dxO*dxO + dzO*dzO;
        if (dist2O < 3.0 && dist2O > 0.01) { // If closer than ~1.7 meters
          sepX += dxO / dist2O;
          sepZ += dzO / dist2O;
        }
      }
      mx += sepX * 6 * dt; // Apply separation force
      mz += sepZ * 6 * dt;

      // 2. Seek Player
      const dx = px - mx, dz = pz - mz;
      const dist2 = dx*dx + dz*dz;

      e.mesh.position.x = mx;
      e.mesh.position.z = mz;
      e.mesh.lookAt(px, 0, pz);

      if (dist2 > 6.25) {                    // > 2.5 metres
        const inv = e.speed * dt / Math.sqrt(dist2);
        e.mesh.position.x += dx*inv;
        e.mesh.position.z += dz*inv;
      } else {
        takeDamage();
      }

      e.hb.position.x = e.mesh.position.x;
      e.hb.position.z = e.mesh.position.z;
      e.hb.position.y = 2;

      e.wobble += 10*dt;
      e.legL.rotation.x =  Math.sin(e.wobble)*0.4;
      e.legR.rotation.x = -Math.sin(e.wobble)*0.4;
    }
  }

  // ── Particle Pool Update ──────────────────────────────────────────────────
  for (let i = 0; i < POOL_SIZE; i++) {
    const p = particlePool[i];
    if (p.life > 0) {
      p.position.x += p.vx * dt;
      p.position.y += p.vy * dt;
      p.position.z += p.vz * dt;
      p.vy -= 22 * dt;
      p.life -= dt;
      
      if (p.position.y < 0.05) { p.position.y = 0.05; p.vx = p.vy = p.vz = 0; }
      
      p.scale.setScalar(Math.max(p.life, 0.01));
      
      if (p.life <= 0) { 
        p.visible = false; // Hide and return to pool
        p.position.y = -10;
      }
    }
  }

  renderer.render(scene, camera);
}

loop();
