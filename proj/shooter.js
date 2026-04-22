// ── GAME STATE ──────────────────────────────────────────────────────────────
let playerHP = 100, kills = 0;
const targetKills = Math.floor(Math.random() * 11) + 15;
let isDead = false, gameWon = false;
let respawnsAllowed = 1;
let mathIndex = 0, answer = 0;
let damageCooldown = 0;
let locked = false;
let gameStarted = false;

const ENEMY_MAX_HP = 50;

// WEAPONS
const weapons = [
  { name: "ASSAULT RIFLE", dmgBody: 25, dmgHead: 35, fireDelay: 0.12, mag: 30, ammo: 30, reloadTime: 1.5, type: 'auto' },
  { name: "HEAVY PISTOL", dmgBody: 35, dmgHead: 45, fireDelay: 0.25, mag: 12, ammo: 12, reloadTime: 1.0, type: 'semi' },
  { name: "SNIPER RIFLE", dmgBody: 100, dmgHead: 150, fireDelay: 1.2, mag: 5, ammo: 5, reloadTime: 2.2, type: 'semi' }
];
let curWepIndex = 0;
let fireCooldown = 0;
let isReloading = false;
let reloadingTimer = 0;
let isMouseDown = false;
let isSniperADS = false;

document.getElementById('targetDisplay').innerText = targetKills;

function updateHUD() {
  document.getElementById('hpText').innerText = Math.max(0, playerHP);
  document.getElementById('hpBar').style.width = Math.max(0, playerHP) + '%';
  const w = weapons[curWepIndex];
  document.getElementById('weaponName').innerText = w.name;
  document.getElementById('ammoText').innerText = isReloading ? "--" : w.ammo;
  document.getElementById('ammoMax').innerText = w.mag;
}

// ── RENDERER ────────────────────────────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Light blue sky
scene.fog = new THREE.FogExp2(0x87ceeb, 0.022);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.3, 100);

// ── MANUAL POINTER LOCK + CAMERA LOOK ──────────────────────────────────────
let yaw = 0;
let pitch = 0;
const SENSITIVITY = 0.0020;
const MAX_PITCH = Math.PI / 2 - 0.01;
camera.rotation.order = 'YXZ';

const canvas = renderer.domElement;
function tryLock() {
  if (!isDead && !gameWon && !locked) canvas.requestPointerLock();
}
canvas.addEventListener('click', tryLock);
document.getElementById('instructions').addEventListener('click', tryLock);

document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  if (locked) gameStarted = true;
  if (!locked && isSniperADS) toggleADS(false);
  document.getElementById('instructions').style.display =
    (!locked && !isDead && !gameWon) ? 'flex' : 'none';
});

let mouseDX = 0, mouseDY = 0;
document.addEventListener('mousemove', (e) => {
  if (!locked || isDead || gameWon) return;
  const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const ce of events) {
    mouseDX += ce.movementX;
    mouseDY += ce.movementY;
  }
});

// ── INPUT (SHOOTING & WEAPONS) ──────────────────────────────────────────────
function toggleADS(state) {
  isSniperADS = state;
  camera.fov = state ? 20 : 70;
  camera.updateProjectionMatrix();
  document.getElementById('sniperScope').style.display = state ? 'block' : 'none';
  document.getElementById('crosshair').style.display = state ? 'none' : 'block';
  mouseDX *= state ? 0.3 : 3.33;
  mouseDY *= state ? 0.3 : 3.33;
}

document.addEventListener('mousedown', (e) => {
  if (!locked || isDead || gameWon) return;
  if (e.button === 2 && weapons[curWepIndex].name === "SNIPER RIFLE") {
    toggleADS(true);
  }
  if (e.button === 0) isMouseDown = true;
});

document.addEventListener('mouseup', (e) => {
  if (!locked || isDead || gameWon) return;
  if (e.button === 2 && isSniperADS) {
    toggleADS(false);
  }
  if (e.button === 0) isMouseDown = false;
});

document.addEventListener('keydown', (e) => {
  if (!locked || isDead || gameWon) return;
  if (e.key === 'r' || e.key === 'R') {
    startReload();
  }
  if (e.key >= '1' && e.key <= '3') {
    const idx = parseInt(e.key) - 1;
    if (idx !== curWepIndex) {
      curWepIndex = idx;
      if(isSniperADS) toggleADS(false);
      startReload(true); 
      updateHUD();
    }
  }
});

function startReload(cancel = false) {
  if (cancel) { isReloading = false; return; }
  const w = weapons[curWepIndex];
  if (w.ammo === w.mag || isReloading) return;
  isReloading = true;
  reloadingTimer = w.reloadTime;
  updateHUD();
}

// ── LIGHTING (Optimized) ──────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(20, 50, 30);
sun.castShadow = true;
sun.shadow.mapSize.width = 512;
sun.shadow.mapSize.height = 512;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 150;
const d = 100;
sun.shadow.camera.left = -d;
sun.shadow.camera.right = d;
sun.shadow.camera.top = d;
sun.shadow.camera.bottom = -d;
scene.add(sun);


// ── ENVIRONMENT ─────────────────────────────────────────────────────────────
// Procedural minimal grass canvas texture for extremely optimized footprint
const canvasTex = document.createElement('canvas');
canvasTex.width = 64;
canvasTex.height = 64;
const ctx = canvasTex.getContext('2d');
ctx.fillStyle = '#4a7c36'; // Base green
ctx.fillRect(0, 0, 64, 64);
for(let i=0; i<100; i++) {
  ctx.fillStyle = Math.random() > 0.5 ? '#538c3e' : '#3d6b2c';
  ctx.fillRect(Math.random()*64, Math.random()*64, 2, 2);
}
const grassTex = new THREE.CanvasTexture(canvasTex);
grassTex.wrapS = THREE.RepeatWrapping;
grassTex.wrapT = THREE.RepeatWrapping;
grassTex.repeat.set(20, 20);

// Single large low-poly ground plane
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200, 1, 1),
  new THREE.MeshLambertMaterial({ map: grassTex })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// ── 3D MODELS & ENVIRONMENT DECLARATIONS ──────────────────────────────────
const gltfLoader = new THREE.GLTFLoader();
const envColliders = [];   // invisible hitbox meshes (for bullet raycasting)
const envMeshes = [];      // parent visual models
const loadedModels = {};

// Pre-baked world-space collision rects — {cx, cz, hx, hz} (center + half-extents on XZ)
const collisionRects = [];

function bakeCollisionRect(hitMesh) {
    hitMesh.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(hitMesh);
    const c = box.getCenter(new THREE.Vector3());
    const s = box.getSize(new THREE.Vector3());
    collisionRects.push({ cx: c.x, cz: c.z, hx: s.x * 0.5, hz: s.z * 0.5 });
}

function setupModel(model, position, scale, rotation, type) {
    model.position.copy(position);
    model.scale.setScalar(scale);
    model.rotation.set(0,0,0);
    model.updateMatrixWorld(true);
    
    let box = new THREE.Box3().setFromObject(model);
    model.position.y -= box.min.y;
    model.updateMatrixWorld(true);
    box.setFromObject(model);
    
    const size = box.getSize(new THREE.Vector3());
    const worldCenter = box.getCenter(new THREE.Vector3());
    const localOffset = worldCenter.clone().sub(model.position).divideScalar(scale);
    
    let hitW = size.x / scale, hitH = size.y / scale, hitD = size.z / scale;
    if (type === 'tree') { hitW *= 0.15; hitD *= 0.15; }
    else if (type === 'fountain') { hitW *= 0.7; hitD *= 0.7; }
    else if (type === 'car') { hitW *= 0.95; hitD *= 0.95; }
    
    const hitGeo = new THREE.BoxGeometry(hitW, hitH, hitD);
    const hitMesh = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({visible: false}));
    hitMesh.position.copy(localOffset);
    model.add(hitMesh);
    
    if (rotation) model.rotation.set(rotation.x, rotation.y, rotation.z);
    
    model.traverse((child) => {
        if (child.isMesh && child !== hitMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    scene.add(model);
    
    envColliders.push(hitMesh);
    envMeshes.push(model);
    bakeCollisionRect(hitMesh);
}

function loadModel(url, position, scale, rotation, type) {
    if (loadedModels[url]) {
        setupModel(loadedModels[url].clone(true), position, scale, rotation, type);
        return;
    }
    gltfLoader.load(url, (gltf) => {
        loadedModels[url] = gltf.scene; 
        setupModel(gltf.scene.clone(true), position, scale, rotation, type);
    }, undefined, (error) => {
        console.error("Error loading model", url, error);
    });
}

function addProceduralCollider(parentMesh, hitMesh) {
    parentMesh.add(hitMesh);
    envColliders.push(hitMesh);
    envMeshes.push(parentMesh);
    hitMesh.updateMatrixWorld(true);
    bakeCollisionRect(hitMesh);
}

function initEnvironment() {
    loadModel('fountain.glb', new THREE.Vector3(0, 0, 0), 10, null, 'fountain');
    
    const housePositions = [
        new THREE.Vector3(30, 0, 30),
        new THREE.Vector3(-30, 0, 30),
        new THREE.Vector3(30, 0, -30),
        new THREE.Vector3(-30, 0, -30)
    ];
    housePositions.forEach(p => loadModel('house.glb', p, 3.5, new THREE.Vector3(0, Math.random() * Math.PI, 0), 'house'));
    
    const carPositions = [
        new THREE.Vector3(20, 0, 35),
        new THREE.Vector3(-20, 0, 35),
        new THREE.Vector3(20, 0, -35),
        new THREE.Vector3(-20, 0, -35),
        new THREE.Vector3(40, 0, 10),
        new THREE.Vector3(-40, 0, -10)
    ];
    carPositions.forEach(p => loadModel('car.glb', p, 2.5, new THREE.Vector3(0, Math.random() * Math.PI, 0), 'car'));
    
    for (let i = 0; i < 25; i++) {
        let x = (Math.random() - 0.5) * 120;
        let z = (Math.random() - 0.5) * 120;
        if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
        loadModel('tree.glb', new THREE.Vector3(x, 0, z), 6 + Math.random() * 4, new THREE.Vector3(0, Math.random() * Math.PI, 0), 'tree');
    }
    
    const rockGeo = new THREE.IcosahedronGeometry(1, 1);
    const rockMat = new THREE.MeshLambertMaterial({color: 0x888888});
    for (let i = 0; i < 15; i++) {
        let rock = new THREE.Mesh(rockGeo, rockMat);
        let s = 1 + Math.random() * 2;
        rock.scale.set(s, s * 0.7, s);
        rock.position.set((Math.random() - 0.5) * 120, s * 0.7, (Math.random() - 0.5) * 120); 
        rock.rotation.set(Math.random()*0.5, Math.random()*Math.PI, Math.random()*0.5);
        rock.castShadow = true; rock.receiveShadow = true;
        scene.add(rock);
        addProceduralCollider(rock, new THREE.Mesh(new THREE.BoxGeometry(2, 1.4, 2), new THREE.MeshBasicMaterial({visible:false})));
    }
    
    const barrelGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 16);
    const barrelMat = new THREE.MeshLambertMaterial({color: 0xb91c1c});
    for (let i = 0; i < 12; i++) {
        let barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set((Math.random() - 0.5) * 120, 0.6, (Math.random() - 0.5) * 120); 
        barrel.castShadow = true; barrel.receiveShadow = true;
        scene.add(barrel);
        addProceduralCollider(barrel, new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 1), new THREE.MeshBasicMaterial({visible:false})));
    }
}
initEnvironment();

// Fast 2D rect collision test (no allocations)
function hitTestXZ(px, pz, radius) {
    for (let i = 0, n = collisionRects.length; i < n; i++) {
        const r = collisionRects[i];
        const dx = Math.abs(px - r.cx) - r.hx;
        const dz = Math.abs(pz - r.cz) - r.hz;
        if (dx < radius && dz < radius) return true;
    }
    return false;
}

// ── SHARED ENEMY ASSETS ──────────────────────────────────────────────────────
const M = {
  vest  : new THREE.MeshBasicMaterial({color:0x78350f}),
  head  : new THREE.MeshBasicMaterial({color:0x451a03}),
  pants : new THREE.MeshBasicMaterial({color:0xb45309}),
  eyes  : new THREE.MeshBasicMaterial({color:0xfcd34d}),
  hb    : new THREE.MeshBasicMaterial({visible:false}),
  blood : new THREE.MeshBasicMaterial({color:0x7f0000}),
  gunMetal : new THREE.MeshBasicMaterial({color:0x333333}),
  gunWood  : new THREE.MeshBasicMaterial({color:0x5c3a1e}),
};
const G = {
  torso : new THREE.BoxGeometry(1.2,1.5,0.8),
  head  : new THREE.BoxGeometry(0.8,0.8,0.8),
  eyes  : new THREE.PlaneGeometry(0.5,0.2),
  leg   : new THREE.BoxGeometry(0.5,1.5,0.5),
  arm   : new THREE.BoxGeometry(0.4,1.4,0.4),
  blood : new THREE.BoxGeometry(0.15,0.15,0.15),
  gunBody   : new THREE.BoxGeometry(0.12, 0.12, 0.9),
  gunStock  : new THREE.BoxGeometry(0.1, 0.3, 0.15),
  gunBarrel : new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6),
};

// ── ENEMIES ─────────────────────────────────────────────────────────────────
const enemies  = [];
const hitBoxesHead = [];
const hitBoxesBody = [];
const MAX_ENEMIES = 10;

function spawnEnemy() {
  if (!gameStarted || isDead || gameWon || enemies.length >= MAX_ENEMIES) return;
  const g = new THREE.Group();

  const torso = new THREE.Mesh(G.torso, M.vest);  torso.position.y = 2.25; torso.castShadow = true; g.add(torso);
  const head  = new THREE.Mesh(G.head,  M.head);  head.position.y  = 3.4;  head.castShadow = true; g.add(head);
  const eyes  = new THREE.Mesh(G.eyes,  M.eyes);  eyes.position.set(0, 3.4, 0.41); g.add(eyes);
  const legL  = new THREE.Mesh(G.leg,   M.pants); legL.position.set(-0.35,0.75,0); legL.castShadow = true; g.add(legL);
  const legR  = new THREE.Mesh(G.leg,   M.pants); legR.position.set( 0.35,0.75,0); legR.castShadow = true; g.add(legR);
  const armL  = new THREE.Mesh(G.arm,   M.pants); armL.position.set(-0.8,2.2,0);   armL.castShadow = true; g.add(armL);
  const armR  = new THREE.Mesh(G.arm,   M.pants); armR.position.set(0.8,2.2,0.2);
  armR.rotation.x = -Math.PI/3; armR.castShadow = true; g.add(armR);

  // Gun in right hand
  const gunGroup = new THREE.Group();
  const gunBody = new THREE.Mesh(G.gunBody, M.gunMetal); gunGroup.add(gunBody);
  const gunStock = new THREE.Mesh(G.gunStock, M.gunWood); gunStock.position.set(0, -0.1, -0.4); gunGroup.add(gunStock);
  const gunBarrel = new THREE.Mesh(G.gunBarrel, M.gunMetal); gunBarrel.rotation.x = Math.PI/2; gunBarrel.position.set(0, 0, 0.6); gunGroup.add(gunBarrel);
  gunGroup.position.set(0, -0.5, 0.3);
  armR.add(gunGroup);

  // Minimalistic floating healthbar — added to scene, always faces camera
  const hpGeo = new THREE.PlaneGeometry(1.2, 0.15);
  const hpMat = new THREE.MeshBasicMaterial({color: 0x10b981, side: THREE.DoubleSide}); // Changed to Green
  const hpMesh = new THREE.Mesh(hpGeo, hpMat);
  scene.add(hpMesh);

  const a = Math.random() * Math.PI * 2;
  const d = 25 + Math.random() * 18;
  g.position.set(Math.cos(a)*d, 0, Math.sin(a)*d);
  scene.add(g);

  const hbHead = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), M.hb);
  const hbBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.8, 1.6), M.hb);
  scene.add(hbHead); scene.add(hbBody);
  hitBoxesHead.push(hbHead);
  hitBoxesBody.push(hbBody);

  enemies.push({ mesh:g, hbHead, hbBody, hpMesh, legL, legR, hp:ENEMY_MAX_HP,
    speed: 3 + Math.random()*2, wobble: Math.random()*10,
    fireCooldown: Math.random() * 2 + 1 
  });
}

setInterval(spawnEnemy, 2500);

// ── PROJECTILES & PARTICLES ───────────────────────────
M.dust = new THREE.MeshBasicMaterial({color: 0xaaaaaa});
const particlePool = [];
const POOL_SIZE = 60;
for (let i = 0; i < POOL_SIZE; i++) {
  const p = new THREE.Mesh(G.blood, M.blood);
  p.position.set(0, -10, 0); 
  p.visible = false; p.life = 0;
  scene.add(p);
  particlePool.push(p);
}

function spawnParticle(pos, type) {
  let spawned = 0;
  for (let i = 0; i < POOL_SIZE; i++) {
    const p = particlePool[i];
    if (p.life <= 0) {
      p.material = (type === 'dust') ? M.dust : M.blood;
      p.position.copy(pos);
      p.vx = (Math.random()-.5)*8; p.vy = Math.random()*6+2; p.vz = (Math.random()-.5)*8;
      p.life = 0.7;
      p.visible = true;
      p.scale.setScalar(type === 'dust' ? 0.3 : 0.7);
      spawned++;
      if (spawned >= (type === 'dust' ? 3 : 4)) break;
    }
  }
}

function spawnBlood(pos) { spawnParticle(pos, 'blood'); }

function spawnMuzzleFlash(pos) {
    const fGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const fMat = new THREE.MeshBasicMaterial({color:0xffaa00});
    const f = new THREE.Mesh(fGeo, fMat);
    f.position.copy(pos);
    scene.add(f);
    setTimeout(() => {
        scene.remove(f);
        fGeo.dispose();
        fMat.dispose();
    }, 50);
}

// ── MISSILE DROP SYSTEM ─────────────────────────────────────────────
const missileDrops = [];
const MISSILE_AOE = 18;
const SUPER_JUMP_VEL = 18;
let hasMissile = false;

// Shared geometry
const missileBodyGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8);
const missileNoseGeo = new THREE.ConeGeometry(0.18, 0.4, 8);
const missileFin1Geo = new THREE.BoxGeometry(0.5, 0.05, 0.15);
const missileFin2Geo = new THREE.BoxGeometry(0.15, 0.05, 0.5);
const missileBodyMat = new THREE.MeshBasicMaterial({color: 0x444444});
const missileNoseMat = new THREE.MeshBasicMaterial({color: 0xdd3333});
const missileFinMat  = new THREE.MeshBasicMaterial({color: 0x666666});
const missileGlowMat = new THREE.MeshBasicMaterial({color: 0xff4400, transparent: true, opacity: 0.3});

function spawnMissileDrop() {
    if (!gameStarted || isDead || gameWon || missileDrops.length >= 2) return;

    const group = new THREE.Group();
    const body = new THREE.Mesh(missileBodyGeo, missileBodyMat);
    body.rotation.x = Math.PI / 2; group.add(body);
    const nose = new THREE.Mesh(missileNoseGeo, missileNoseMat);
    nose.rotation.x = Math.PI / 2; nose.position.z = 0.8; group.add(nose);
    const fin1 = new THREE.Mesh(missileFin1Geo, missileFinMat);
    fin1.position.z = -0.5; group.add(fin1);
    const fin2 = new THREE.Mesh(missileFin2Geo, missileFinMat);
    fin2.position.z = -0.5; group.add(fin2);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 8), missileGlowMat);
    group.add(glow);

    let px, pz;
    for (let k = 0; k < 30; k++) {
        px = (Math.random() - 0.5) * 100;
        pz = (Math.random() - 0.5) * 100;
        if (!hitTestXZ(px, pz, 1.5)) break;
    }
    group.position.set(px, 2.0, pz);
    scene.add(group);

    missileDrops.push({ mesh: group, time: 0 });
    showMissileAlert();
}

function showMissileAlert() {
    const feed = document.getElementById('killFeed');
    const el = document.createElement('div');
    el.className = 'kill-popup';
    el.style.color = '#ff6b35';
    el.style.borderLeftColor = '#ff6b35';
    el.textContent = '⚠ MISSILE DROP — PRESS E TO PICK UP';
    feed.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function tryPickupMissile() {
    if (hasMissile || isDead || gameWon) return;
    const px = camera.position.x, pz = camera.position.z;
    for (let i = 0; i < missileDrops.length; i++) {
        const m = missileDrops[i];
        const dx = m.mesh.position.x - px, dz = m.mesh.position.z - pz;
        if (dx*dx + dz*dz < 16) { // within 4 units
            scene.remove(m.mesh);
            missileDrops.splice(i, 1);
            hasMissile = true;
            updateMissileHUD();
            showKillFeed('MISSILE ACQUIRED — CLICK TO FIRE');
            return;
        }
    }
}

function updateMissileHUD() {
    const el = document.getElementById('missileIndicator');
    el.style.display = hasMissile ? 'block' : 'none';
}

function fireMissile() {
    if (!hasMissile) return;
    hasMissile = false;
    updateMissileHUD();
    playExplosion();

    raycaster.setFromCamera(screenCenter, camera);
    
    // Find where the missile impacts
    const allTargets = [...hitBoxesHead, ...hitBoxesBody, ...envColliders];
    const hits = raycaster.intersectObjects(allTargets);
    let impactPos;
    if (hits.length > 0) {
        impactPos = hits[0].point;
    } else {
        // No hit — fire into the distance
        const dir = new THREE.Vector3();
        raycaster.ray.direction.normalize();
        impactPos = camera.position.clone().addScaledVector(raycaster.ray.direction, 60);
        impactPos.y = 0;
    }

    detonateAt(impactPos.x, impactPos.z);
}

function detonateAt(mx, mz) {
    // Explosion particles
    for (let i = 0; i < POOL_SIZE; i++) {
        const p = particlePool[i];
        if (p.life <= 0) {
            p.material = new THREE.MeshBasicMaterial({color: Math.random() > 0.5 ? 0xff6600 : 0xffaa00});
            p.position.set(mx, 1.5, mz);
            p.vx = (Math.random()-.5)*18; p.vy = Math.random()*12+4; p.vz = (Math.random()-.5)*18;
            p.life = 1.2; p.visible = true;
            p.scale.setScalar(0.8 + Math.random() * 0.5);
        }
    }

    // Expanding explosion sphere
    const expGeo = new THREE.SphereGeometry(1, 12, 12);
    const expMat = new THREE.MeshBasicMaterial({color: 0xff4400, transparent: true, opacity: 0.8});
    const expMesh = new THREE.Mesh(expGeo, expMat);
    expMesh.position.set(mx, 1.5, mz);
    scene.add(expMesh);
    let expT = 0;
    function expandExp() {
        expT += 0.03;
        expMesh.scale.setScalar(expT * MISSILE_AOE);
        expMat.opacity = Math.max(0, 0.8 - expT * 2);
        if (expT < 0.5) requestAnimationFrame(expandExp);
        else { scene.remove(expMesh); expGeo.dispose(); expMat.dispose(); }
    }
    expandExp();

    // AOE enemy kills
    let killCount = 0;
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const edx = e.mesh.position.x - mx, edz = e.mesh.position.z - mz;
        if (edx*edx + edz*edz < MISSILE_AOE * MISSILE_AOE) {
            scene.remove(e.hpMesh); e.hpMesh.geometry.dispose(); e.hpMesh.material.dispose();
            scene.remove(e.mesh); scene.remove(e.hbHead); scene.remove(e.hbBody);
            hitBoxesHead.splice(hitBoxesHead.indexOf(e.hbHead), 1);
            hitBoxesBody.splice(hitBoxesBody.indexOf(e.hbBody), 1);
            enemies.splice(i, 1);
            kills++; killCount++;
        }
    }

    if (killCount > 0) {
        document.getElementById('killsDisplay').innerText = kills;
        showKillFeed(killCount > 1 ? `MULTI-KILL x${killCount}` : 'EXPLOSIVE KILL');
        shakeIntensity = 1.0;
        if (kills >= targetKills) triggerWin();
    } else {
        // No enemies hit → super jump!
        const pdx = camera.position.x - mx, pdz = camera.position.z - mz;
        if (pdx*pdx + pdz*pdz < 40*40) {
            playerVY = SUPER_JUMP_VEL;
            isGrounded = false;
            shakeIntensity = 0.6;
            showKillFeed('ROCKET JUMP!');
        } else {
            shakeIntensity = 0.3;
            showKillFeed('MISSILE DETONATED');
        }
    }
}

function playExplosion() {
    if (!audioCtx) audioCtx = new window.AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination); o.type = 'sawtooth';
    o.frequency.setValueAtTime(80, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(15, audioCtx.currentTime + 0.6);
    g.gain.setValueAtTime(0.7, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    o.start(); o.stop(audioCtx.currentTime + 0.6);
    const o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain();
    o2.connect(g2); g2.connect(audioCtx.destination); o2.type = 'square';
    o2.frequency.setValueAtTime(800, audioCtx.currentTime);
    o2.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.15);
    g2.gain.setValueAtTime(0.4, audioCtx.currentTime);
    g2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    o2.start(); o2.stop(audioCtx.currentTime + 0.15);
}

setInterval(spawnMissileDrop, 15000);

// ── AUDIO ───────────────────────────────────────────────
let audioCtx;
function playShoot() {
  if (!audioCtx) audioCtx = new window.AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  o.type = 'sawtooth';
  
  if (weapons[curWepIndex].name === "SNIPER RIFLE") {
    o.frequency.setValueAtTime(150, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.2);
    g.gain.setValueAtTime(0.5, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    o.start(); o.stop(audioCtx.currentTime + 0.2);
  } else {
    o.frequency.setValueAtTime(280, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
    g.gain.setValueAtTime(0.3, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    o.start(); o.stop(audioCtx.currentTime + 0.1);
  }
}

function playEnemyShoot() {
  if (!audioCtx) audioCtx = new window.AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.connect(g); g.connect(audioCtx.destination);
  o.type = 'square';
  
  o.frequency.setValueAtTime(400, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
  g.gain.setValueAtTime(0.2, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  o.start(); o.stop(audioCtx.currentTime + 0.1);
}

// ── SHOOTING ───────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
raycaster.far = 100;
const screenCenter = new THREE.Vector2(0, 0);

function handleShoot() {
  // If carrying a missile, fire it instead of the gun
  if (hasMissile) {
      fireMissile();
      return;
  }
  
  const w = weapons[curWepIndex];
  w.ammo--;
  fireCooldown = w.fireDelay;
  if(w.type === 'semi') isMouseDown = false; 
  updateHUD();
  playShoot();

  const ch = document.getElementById('crosshair');
  ch.classList.add('shooting');
  setTimeout(()=>ch.classList.remove('shooting'), 100);
  
  raycaster.setFromCamera(screenCenter, camera);
  
  const headHits = raycaster.intersectObjects(hitBoxesHead);
  const bodyHits = raycaster.intersectObjects(hitBoxesBody);
  const envHits = raycaster.intersectObjects(envColliders);
  
  let closest = null;
  let hitType = '';
  
  if (envHits.length > 0) {
      closest = envHits[0];
      hitType = 'env';
  }
  
  if (bodyHits.length > 0 && (!closest || bodyHits[0].distance < closest.distance)) {
      closest = bodyHits[0];
      hitType = 'body';
  }
  
  if (headHits.length > 0 && (!closest || headHits[0].distance < closest.distance)) {
      closest = headHits[0];
      hitType = 'head';
  }
  
  if (closest) {
      if (hitType === 'head') {
          applyHit(closest.object, w.dmgHead, closest.point);
      } else if (hitType === 'body') {
          applyHit(closest.object, w.dmgBody, closest.point);
      } else if (hitType === 'env') {
          spawnParticle(closest.point, 'dust');
      }
  }
}

function applyHit(hbMesh, dmg, point) {
  const eObj = enemies.find(en => en.hbHead === hbMesh || en.hbBody === hbMesh);
  if (!eObj) return;
  eObj.hp -= dmg;
  spawnBlood(point);
  
  if (eObj.hp <= 0) {
    scene.remove(eObj.hpMesh); eObj.hpMesh.geometry.dispose(); eObj.hpMesh.material.dispose();
    scene.remove(eObj.mesh); scene.remove(eObj.hbHead); scene.remove(eObj.hbBody);
    enemies.splice(enemies.indexOf(eObj), 1);
    hitBoxesHead.splice(hitBoxesHead.indexOf(eObj.hbHead), 1);
    hitBoxesBody.splice(hitBoxesBody.indexOf(eObj.hbBody), 1);
    kills++;
    document.getElementById('killsDisplay').innerText = kills;
    showKillFeed(dmg >= 45 ? 'HEADSHOT' : 'ELIMINATED');
    if (kills >= targetKills) triggerWin();
  } else {
    eObj.hpMesh.scale.x = Math.max(0.01, eObj.hp / ENEMY_MAX_HP);
  }
}

function showKillFeed(text) {
  const feed = document.getElementById('killFeed');
  const el = document.createElement('div');
  el.className = 'kill-popup';
  el.textContent = text;
  feed.appendChild(el);
  setTimeout(() => el.remove(), 2100);
}

// ── DAMAGE CONTROLLER ───────────────────────────────────────────────────────
function takeDamage(amt, srcPos) {
  if (damageCooldown > 0) return;
  playerHP -= amt;
  updateHUD();
  
  const v = document.getElementById('vignette');
  v.classList.add('hit');
  setTimeout(() => v.classList.remove('hit'), 250);

  // Screen shake
  shakeIntensity = 0.4;
  
  if (srcPos) {
    const dx = srcPos.x - camera.position.x;
    const dz = srcPos.z - camera.position.z;
    const angleToEnemy = Math.atan2(-dx, -dz);
    let relAngle = angleToEnemy - yaw;
    
    while(relAngle > Math.PI) relAngle -= Math.PI*2;
    while(relAngle < -Math.PI) relAngle += Math.PI*2;
    
    let hitId = '';
    if(relAngle >= -Math.PI/4 && relAngle <= Math.PI/4) hitId = 'dmg-top';
    else if(relAngle > Math.PI/4 && relAngle < 3*Math.PI/4) hitId = 'dmg-left';
    else if(relAngle < -Math.PI/4 && relAngle > -3*Math.PI/4) hitId = 'dmg-right';
    else hitId = 'dmg-bottom';
    
    const indicator = document.getElementById(hitId);
    if(indicator) {
        indicator.classList.add('dmg-show');
        setTimeout(() => indicator.classList.remove('dmg-show'), 600);
    }
  }

  if (playerHP <= 0) respawnsAllowed > 0 ? triggerDeath() : gameOverFail();
}

// ── MATH HACKING ────────────────────────────────────────────────────────────
function genMath() {
  let q;
  if      (mathIndex===0){ const a=~~(Math.random()*15)+10, b=~~(Math.random()*15)+5; answer=a+b; q=`${a} + ${b} = ?`; }
  else if (mathIndex===1){ const a=~~(Math.random()*20)+15, b=~~(Math.random()*14)+1; answer=a-b; q=`${a} - ${b} = ?`; }
  else if (mathIndex===2){ const a=~~(Math.random()*11)+3, b=~~(Math.random()*11)+3; answer=a*b; q=`${a} × ${b} = ?`; }
  else                   { const b=~~(Math.random()*9)+3, c=~~(Math.random()*9)+3; answer=c; q=`${b*c} ÷ ${b} = ?`; }
  document.getElementById('q').innerText = q;
  const inp = document.getElementById('ans'); inp.value=''; inp.focus();
}

function triggerDeath() {
  isDead=true; document.exitPointerLock(); locked=false;
  if(isSniperADS) toggleADS(false);
  mathIndex=0; document.getElementById('prog').innerText='SEQUENCE 0 OF 4 COMPLETE';
  document.getElementById('mathUI').style.display='flex'; genMath();
}
function triggerWin() {
  gameWon=true; document.exitPointerLock(); locked=false;
  if(isSniperADS) toggleADS(false);
  document.getElementById('endTitle').innerText='COUNTER-TERRORISTS WIN';
  document.getElementById('endTitle').style.color='#10b981';
  document.getElementById('finalScore').innerText=kills;
  document.getElementById('endUI').style.display='flex';
}
function gameOverFail() {
  isDead=true; document.exitPointerLock(); locked=false;
  if(isSniperADS) toggleADS(false);
  document.getElementById('mathUI').style.display='none';
  document.getElementById('endTitle').innerText='TERRORISTS WIN';
  document.getElementById('endTitle').style.color='#ff4d4d';
  document.getElementById('finalScore').innerText=kills;
  document.getElementById('endUI').style.display='flex';
}

document.getElementById('ans').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const val = parseInt(e.target.value);
  if (val === answer) {
    e.target.style.borderColor='#10b981';
    mathIndex++;
    document.getElementById('prog').innerText=`SEQUENCE ${mathIndex} OF 4 COMPLETE`;
    setTimeout(() => {
      e.target.style.borderColor='#555';
      if (mathIndex >= 4) {
        playerHP=100; respawnsAllowed--;
        updateHUD();
        document.getElementById('mathUI').style.display='none';
        isDead=false;
        
        let sx = 0, sz = 55;
        for (let k = 0; k < 50; k++) {
            let tx = (Math.random() - 0.5) * 100, tz = (Math.random() - 0.5) * 100;
            if (!hitTestXZ(tx, tz, 1.0)) { sx = tx; sz = tz; break; }
        }
        camera.position.set(sx, 2, sz);
        
        yaw=0; pitch=0;
        camera.rotation.set(0,0,0,'YXZ');

        for (let e of enemies) {
            scene.remove(e.hpMesh); e.hpMesh.geometry.dispose(); e.hpMesh.material.dispose();
            scene.remove(e.mesh); scene.remove(e.hbHead); scene.remove(e.hbBody);
        }
        enemies.length = 0; hitBoxesHead.length = 0; hitBoxesBody.length = 0;

        canvas.requestPointerLock();
      } else genMath();
    }, 300);
  } else {
    e.target.style.borderColor='#ff4d4d';
    setTimeout(() => { e.target.style.borderColor='#555'; genMath(); }, 500);
  }
});

// ── PLAYER STATE ─────────────────────────────────────────────────────────────
let walkPhase = 0;
let playerVY = 0, isGrounded = true;
let isSliding = false, slideTimer = 0, slideDir = new THREE.Vector3();
const JUMP_VEL = 9, GRAVITY = 22, SLIDE_DURATION = 0.5, SLIDE_SPEED = 30, PLAYER_H = 2;
let stamina = 100, isSprinting = false;
let shakeIntensity = 0;

const keys = {};
document.addEventListener('keydown', e => {
  keys[e.code]=true;
  if (e.code === 'Space') e.preventDefault();
  if (e.code === 'KeyE' && locked && !isDead && !gameWon) tryPickupMissile();
});
document.addEventListener('keyup',   e => { keys[e.code]=false; });

camera.position.set(0, 2, 55);

// ── RESIZE ───────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── INIT HUD ─────────────────────────────────────────────────────────────────
updateHUD();

// ── GAME LOOP ────────────────────────────────────────────────────────────────
let prevTime = performance.now();
const fwd  = new THREE.Vector3();
const right = new THREE.Vector3();

function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  const dt  = Math.min((now - prevTime) / 1000, 0.05);
  prevTime  = now;

  if (damageCooldown > 0) damageCooldown -= dt;
  if (fireCooldown > 0) fireCooldown -= dt;

  if (isReloading) {
    reloadingTimer -= dt;
    if (reloadingTimer <= 0) {
      isReloading = false;
      weapons[curWepIndex].ammo = weapons[curWepIndex].mag;
      updateHUD();
    }
  } else if (isMouseDown && fireCooldown <= 0 && locked && !isDead && !gameWon) {
    const w = weapons[curWepIndex];
    if (w.ammo > 0) {
      handleShoot();
    } else {
      startReload();
    }
  }

  if (locked && !isDead && !gameWon && (mouseDX !== 0 || mouseDY !== 0)) {
    let sens = SENSITIVITY;
    if (isSniperADS) sens *= 0.3;
    yaw   -= mouseDX * sens;
    pitch -= mouseDY * sens;
    pitch  = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch));
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    mouseDX = 0; mouseDY = 0;
  }

  if (locked && !isDead && !gameWon) {
    let spd = 18 * dt;
    if (isSniperADS) spd *= 0.5;
    
    // Sprint
    isSprinting = keys['ShiftLeft'] || keys['ShiftRight'];
    if (isSprinting && stamina > 0 && !isSliding && isGrounded) {
        spd *= 1.6;
        stamina = Math.max(0, stamina - 40 * dt);
    } else {
        stamina = Math.min(100, stamina + 20 * dt);
        if (stamina < 5) isSprinting = false;
    }
    document.getElementById('staminaFill').style.width = stamina + '%';
    
    fwd.set(-Math.sin(yaw), 0, -Math.cos(yaw));
    right.set(Math.cos(yaw), 0, -Math.sin(yaw));

    // ── Jump ──
    if (keys['Space'] && isGrounded && !isSliding) {
        playerVY = JUMP_VEL;
        isGrounded = false;
    }

    // ── Slide (Ctrl or KeyC while moving forward on ground) ──
    if ((keys['ControlLeft'] || keys['ControlRight'] || keys['KeyC']) && isGrounded && !isSliding && (keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'])) {
        isSliding = true;
        slideTimer = SLIDE_DURATION;
        slideDir.copy(fwd);
    }

    let px0 = camera.position.x, pz0 = camera.position.z;
    
    let moved = false;
    if (isSliding) {
        let slideFrac = slideTimer / SLIDE_DURATION;
        let sSpd = SLIDE_SPEED * slideFrac * dt;
        camera.position.addScaledVector(slideDir, sSpd);
        slideTimer -= dt;
        moved = true;
        if (slideTimer <= 0) isSliding = false;
    } else {
        if (keys['KeyW']) { camera.position.addScaledVector(fwd, spd); moved = true; }
        if (keys['KeyS']) { camera.position.addScaledVector(fwd, -spd); moved = true; }
        if (keys['KeyD']) { camera.position.addScaledVector(right, spd); moved = true; }
        if (keys['KeyA']) { camera.position.addScaledVector(right, -spd); moved = true; }
    }
    
    // Fast pre-baked rect collision
    if (hitTestXZ(camera.position.x, camera.position.z, 0.8)) {
        camera.position.x = px0;
        camera.position.z = pz0;
        moved = false;
        if (isSliding) { isSliding = false; slideTimer = 0; }
    }

    camera.position.x = Math.max(-65, Math.min(65, camera.position.x));
    camera.position.z = Math.max(-65, Math.min(65, camera.position.z));
    
    // ── Vertical physics (jump + slide camera) ──
    let targetH = PLAYER_H;
    if (isSliding) targetH = 1.0;

    if (!isGrounded) {
        playerVY -= GRAVITY * dt;
        camera.position.y += playerVY * dt;
        if (camera.position.y <= targetH) {
            camera.position.y = targetH;
            playerVY = 0;
            isGrounded = true;
        }
    } else if (isSliding) {
        camera.position.y += (targetH - camera.position.y) * 15 * dt;
    } else {
        if (moved) {
            walkPhase += (isSprinting ? 18 : 12) * dt;
            camera.position.y = PLAYER_H + Math.sin(walkPhase) * (isSprinting ? 0.18 : 0.12);
        } else {
            camera.position.y += (PLAYER_H - camera.position.y) * 10 * dt;
        }
    }
    
    // ── Screen shake decay ──
    if (shakeIntensity > 0.01) {
        camera.position.x += (Math.random() - 0.5) * shakeIntensity;
        camera.position.y += (Math.random() - 0.5) * shakeIntensity * 0.5;
        shakeIntensity *= 0.85;
    } else {
        shakeIntensity = 0;
    }
  }

  if (!isDead && !gameWon) {
    const px = camera.position.x, pz = camera.position.z;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      let mx = e.mesh.position.x, mz = e.mesh.position.z;
      
      let sepX = 0, sepZ = 0;
      for (let j = 0; j < enemies.length; j++) {
        if (i === j) continue;
        const ox = enemies[j].mesh.position.x, oz = enemies[j].mesh.position.z;
        const dxO = mx - ox, dzO = mz - oz;
        const dist2O = dxO*dxO + dzO*dzO;
        if (dist2O < 4.0 && dist2O > 0.01) {
          sepX += dxO / dist2O;
          sepZ += dzO / dist2O;
        }
      }
      let prevMx = mx, prevMz = mz;

      mx += sepX * 6 * dt;
      mz += sepZ * 6 * dt;

      const dx = px - mx, dz = pz - mz;
      const dist2 = dx*dx + dz*dz;

      // Compute desired new position
      let newX = mx, newZ = mz;
      if (dist2 > 150) { 
        const inv = e.speed * dt / Math.sqrt(dist2);
        newX += dx*inv;
        newZ += dz*inv;
      } else if (dist2 < 80) { 
        const inv = e.speed * dt / Math.sqrt(dist2) * 0.5;
        newX -= dx*inv;
        newZ -= dz*inv;
      }

      // Wall-sliding collision: try full move, then X-only, then Z-only
      if (!hitTestXZ(newX, newZ, 0.8)) {
          e.mesh.position.x = newX;
          e.mesh.position.z = newZ;
      } else if (!hitTestXZ(newX, prevMz, 0.8)) {
          e.mesh.position.x = newX;
          e.mesh.position.z = prevMz;
      } else if (!hitTestXZ(prevMx, newZ, 0.8)) {
          e.mesh.position.x = prevMx;
          e.mesh.position.z = newZ;
      } else {
          // Fully stuck — add lateral nudge to escape
          e.mesh.position.x = prevMx + (Math.random() - 0.5) * 2 * dt;
          e.mesh.position.z = prevMz + (Math.random() - 0.5) * 2 * dt;
      }

      e.mesh.lookAt(px, 0, pz);
      e.hpMesh.position.set(e.mesh.position.x, 4.5, e.mesh.position.z);
      e.hpMesh.lookAt(camera.position.x, 4.5, camera.position.z);

      e.hbHead.position.set(e.mesh.position.x, 3.4, e.mesh.position.z);
      e.hbBody.position.set(e.mesh.position.x, 1.8, e.mesh.position.z);

      e.wobble += 10*dt;
      e.legL.rotation.x =  Math.sin(e.wobble)*0.4;
      e.legR.rotation.x = -Math.sin(e.wobble)*0.4;
      
      e.fireCooldown -= dt;
      if (e.fireCooldown <= 0) { 
         if(dist2 < 500) { 
            let canSee = true;
            
            // LOS Raycast — only if within shooting range
            const ePosX = e.mesh.position.x, ePosZ = e.mesh.position.z;
            const lDir = new THREE.Vector3(px - ePosX, -0.5, pz - ePosZ).normalize();
            raycaster.set(new THREE.Vector3(ePosX, 2.5, ePosZ), lDir);
            raycaster.far = Math.sqrt(dist2);
            let obsHits = raycaster.intersectObjects(envColliders);
            if (obsHits.length > 0) canSee = false;
            raycaster.far = 100;

            if (canSee) {
                playEnemyShoot();
                spawnMuzzleFlash(new THREE.Vector3(ePosX, 2.5, ePosZ));
                
                if (Math.random() < 0.70) {
                    takeDamage(15, {x: ePosX, y: 2.2, z: ePosZ});
                }
            }
         }
         e.fireCooldown = 1.0 + Math.random() * 1.5;
      }
    }
  }

  // Animate missile drops (bob + spin) + show pickup prompt
  const promptEl = document.getElementById('pickupPrompt');
  let showPrompt = false;
  for (let i = 0; i < missileDrops.length; i++) {
      const m = missileDrops[i];
      m.time += dt;
      m.mesh.position.y = 2.0 + Math.sin(m.time * 2.5) * 0.4;
      m.mesh.rotation.y += 1.5 * dt;
      // Check proximity for pickup prompt
      if (!hasMissile && locked && !isDead && !gameWon) {
          const dx = m.mesh.position.x - camera.position.x;
          const dz = m.mesh.position.z - camera.position.z;
          if (dx*dx + dz*dz < 16) showPrompt = true;
      }
  }
  promptEl.style.display = showPrompt ? 'block' : 'none';

  for (let i = 0; i < POOL_SIZE; i++) {
    const p = particlePool[i];
    if (p.life > 0) {
      p.position.x += p.vx * dt; p.position.y += p.vy * dt; p.position.z += p.vz * dt;
      p.vy -= 22 * dt; p.life -= dt;
      if (p.position.y < 0.05) { p.position.y = 0.05; p.vx = p.vy = p.vz = 0; }
      p.scale.setScalar(Math.max(p.life, 0.01));
      if (p.life <= 0) { p.visible = false; p.position.y = -10; }
    }
  }

  renderer.render(scene, camera);
}

loop();
