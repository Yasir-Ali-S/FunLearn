import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ═══════════════════════════════════════════════════════════════
// SHOOTEMATICS 3D — Core Game Engine (Refined)
// ═══════════════════════════════════════════════════════════════

// ── UI Elements ──────────────────────────────────────────────
const overlays = {
  menu: document.getElementById('menu-overlay'),
  gameover: document.getElementById('gameover-overlay')
};
const btns = {
  start: document.getElementById('start-btn'),
  restart: document.getElementById('restart-btn')
};
const stats = {
  score: document.getElementById('final-score'),
  round: document.getElementById('final-round'),
  combo: document.getElementById('final-combo'),
  accuracy: document.getElementById('final-accuracy')
};

// Update button text while loading
btns.start.querySelector('.btn-text').innerText = "LOADING MODELS...";
btns.start.disabled = true;

// Create DOM elements for HUD
const hudContainer = document.createElement('div');
hudContainer.style.position = 'absolute';
hudContainer.style.inset = '0';
hudContainer.style.pointerEvents = 'none';
hudContainer.style.zIndex = '50';
document.getElementById('game-container').appendChild(hudContainer);

const statsDiv = document.createElement('div');
statsDiv.style.position = 'absolute';
statsDiv.style.top = '20px';
statsDiv.style.left = '20px';
statsDiv.style.color = '#fff';
statsDiv.style.fontFamily = '"Press Start 2P", cursive';
statsDiv.style.fontWeight = '400';
statsDiv.style.fontSize = '16px';
statsDiv.style.textShadow = '2px 2px 0 #000';
hudContainer.appendChild(statsDiv);

const questionDiv = document.createElement('div');
questionDiv.style.position = 'absolute';
questionDiv.style.top = '40px';
questionDiv.style.width = '100%';
questionDiv.style.textAlign = 'center';
questionDiv.style.color = '#fff';
questionDiv.style.fontFamily = '"Press Start 2P", cursive';
questionDiv.style.fontWeight = '400';
questionDiv.style.fontSize = '24px';
questionDiv.style.textShadow = '4px 4px 0 #000';
questionDiv.style.lineHeight = '1.5';
hudContainer.appendChild(questionDiv);

// ── Game State ───────────────────────────────────────────────
let GAME_STATE = 'LOADING'; // LOADING, MENU, PLAYING, GAMEOVER
let lastTime = 0;
let keys = {};

const NUM_BLOCKS = 4;
let GAME_SPEED_BASE = 25; // Z-units per second
const GAME_WIDTH = 60; // Play area width

let gameTime = 0;
let score = 0;
let round = 1;
let combo = 0;
let maxCombo = 0;
let shotsFired = 0;
let shotsHit = 0;
let lives = 3;
let invulnerableTimer = 0;
let starPowerTimer = 0;

let currentQuestionText = "";

let cameraShake = 0;

// ── Audio Engine (Synthesizer) ───────────────────────────────
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const AudioEngine = {
  playTone(freq, type, duration, vol=0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  },
  
  shoot() {
    this.playTone(600, 'square', 0.1, 0.05);
    setTimeout(() => this.playTone(400, 'square', 0.1, 0.05), 50);
  },
  
  coin() {
    this.playTone(987.77, 'sine', 0.1, 0.1); // B5
    setTimeout(() => this.playTone(1318.51, 'sine', 0.4, 0.1), 100); // E6
  },
  
  buzz() {
    this.playTone(150, 'sawtooth', 0.3, 0.15);
    setTimeout(() => this.playTone(100, 'sawtooth', 0.4, 0.15), 100);
  },
  
  starPower() {
    // Arpeggio
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 'sine', 0.2, 0.08), i * 50);
    });
  },
  
  gameOver() {
    const notes = [300, 250, 200, 150];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 'square', 0.3, 0.1), i * 200);
    });
  }
};

// ── Three.js Setup ───────────────────────────────────────────
const container = document.getElementById('game-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#5c94fc'); // Mario Sky Blue
scene.fog = new THREE.FogExp2('#5c94fc', 0.008);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
// Positioned higher up, looking slightly forward
camera.position.set(0, 60, 50);
camera.lookAt(0, 0, -10);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.domElement.id = 'gameCanvas'; // Critical: ensures CSS styles apply
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// Enable shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Replace any existing canvas with the new one
const existingCanvas = document.getElementById('gameCanvas');
if (existingCanvas) {
  container.replaceChild(renderer.domElement, existingCanvas);
} else {
  container.insertBefore(renderer.domElement, container.firstChild);
}


// Lighting - crucial for models to be visible
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444477, 0.8);
hemiLight.position.set(0, 100, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(20, 80, 20);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -100;
scene.add(dirLight);

// Grass Grid floor
const gridHelper = new THREE.GridHelper(300, 60, 0x43b047, 0x2d8030);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });

btns.start.addEventListener('click', startGame);
btns.restart.addEventListener('click', startGame);

// ── Asset Loading & Utilities ────────────────────────────────
const models = { mario: null, fireball: null, koopa: null };
const loader = new GLTFLoader();

// Normalizes a model's size so it fits perfectly in our world
function normalizeModel(modelGroup, targetSize) {
  const box = new THREE.Box3().setFromObject(modelGroup);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = targetSize / maxDim;
  modelGroup.scale.set(scale, scale, scale);
  
  // Center it
  const center = new THREE.Vector3();
  box.getCenter(center);
  modelGroup.position.x = -center.x * scale;
  modelGroup.position.y = -center.y * scale;
  modelGroup.position.z = -center.z * scale;

  // Wrap in a parent group so position/rotation can be applied cleanly
  const wrapper = new THREE.Group();
  wrapper.add(modelGroup);
  return wrapper;
}

async function loadModels() {
  try {
    const [marioData, fireballData, koopaData] = await Promise.all([
      loader.loadAsync('mario_obj.glb'),
      loader.loadAsync('fireball_from_super_mario_bros.glb'),
      loader.loadAsync('koopa_troopa_super_mario_bros.glb')
    ]);

    // Setup models and ensure shadows
    const applyShadows = (group) => {
      group.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    };

    applyShadows(marioData.scene);
    applyShadows(fireballData.scene);
    applyShadows(koopaData.scene);

    // Normalize sizes: Mario (width ~10), Fireball (width ~3), Koopa (width ~10)
    models.mario = normalizeModel(marioData.scene, 10);
    // Mario might need rotation depending on original model (let's assume it needs to face -Z)
    models.mario.rotation.y = Math.PI; 
    
    models.fireball = normalizeModel(fireballData.scene, 3);
    
    models.koopa = normalizeModel(koopaData.scene, 10);
    // Koopa needs to face +Z
    models.koopa.rotation.y = 0; 

    GAME_STATE = 'MENU';
    btns.start.querySelector('.btn-text').innerText = "LAUNCH MISSION";
    btns.start.disabled = false;
    
    requestAnimationFrame(loop);
  } catch (e) {
    console.error("Failed to load models:", e);
    btns.start.querySelector('.btn-text').innerText = "LOAD ERROR";
  }
}

loadModels();

function createCrispTextSprite(text, color = '#ffffff') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // High contrast background box
  context.fillStyle = 'rgba(0,0,0,0.7)';
  context.beginPath();
  context.roundRect(20, 20, 472, 216, 40);
  context.fill();
  context.strokeStyle = color;
  context.lineWidth = 10;
  context.strokeRect(20, 20, 472, 216);

  context.font = '80px "Press Start 2P", cursive';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 10);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  
  const spriteMaterial = new THREE.SpriteMaterial({ 
    map: texture, 
    transparent: true,
    depthTest: false // Ensure text renders ON TOP of the turtle shell
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(12, 6, 1);
  return sprite;
}

// ── Classes ──────────────────────────────────────────────────

class Player3D {
  constructor() {
    this.mesh = models.mario.clone();
    scene.add(this.mesh);
    
    this.width = 8;
    this.depth = 8;
    
    // Position player near bottom
    this.mesh.position.set(0, 0, 20);
    
    this.speed = 45; // units per sec
    this.cooldown = 0;
    this.cooldownMax = 0.2;
  }

  update(dt) {
    if (keys['ArrowLeft'] || keys['KeyA']) {
      this.mesh.position.x -= this.speed * dt;
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
      this.mesh.position.x += this.speed * dt;
    }
    
    // Clamp to play area
    const halfW = GAME_WIDTH / 2;
    this.mesh.position.x = Math.max(-halfW + this.width/2, Math.min(halfW - this.width/2, this.mesh.position.x));

    if (this.cooldown > 0) this.cooldown -= dt;

    if (keys['Space'] && this.cooldown <= 0) {
      this.shoot();
    }
    
    // Subtle breathing animation
    this.mesh.position.y = Math.sin(gameTime * 5) * 0.5;
    
    // Invulnerability flashing
    if (invulnerableTimer > 0) {
      // Toggle visibility rapidly
      this.mesh.visible = Math.floor(gameTime * 10) % 2 === 0;
    } else {
      this.mesh.visible = true;
    }
    
    // Star Power visual effect
    if (starPowerTimer > 0) {
      const hue = (gameTime * 2) % 1;
      const color = new THREE.Color().setHSL(hue, 1, 0.5);
      // We can't easily tint the GLTF materials without traversing them,
      // so we use a huge glowing light attached to player instead, or particles.
      particles.emit(this.mesh.position.x, this.mesh.position.y + 5, this.mesh.position.z, color.getHex(), 2);
    }
  }

  shoot() {
    bullets.push(new Bullet3D(this.mesh.position.x, 3, this.mesh.position.z - 4));
    this.cooldown = this.cooldownMax;
    shotsFired++;
    AudioEngine.shoot();
    cameraShake = 0.1;
  }

  destroy() {
    scene.remove(this.mesh);
  }
}

class Bullet3D {
  constructor(x, y, z) {
    this.mesh = models.fireball.clone();
    this.mesh.position.set(x, y, z);
    scene.add(this.mesh);
    
    this.radius = 2;
    this.speed = 100;
    this.active = true;
    this.startY = y;
    
    // Add PointLight to Fireball for dynamic floor glow
    this.light = new THREE.PointLight(0xff6600, 2, 20);
    this.light.position.set(0,0,0);
    this.mesh.add(this.light);
  }

  update(dt) {
    this.mesh.position.z -= this.speed * dt;
    
    // Spin fireball rapidly
    this.mesh.rotation.x -= dt * 15;
    this.mesh.rotation.z -= dt * 5;
    
    // Bounce effect
    this.mesh.position.y = this.startY + Math.abs(Math.sin(gameTime * 20)) * 4;
    
    if (this.mesh.position.z < -100) this.destroy();
  }

  destroy() {
    this.active = false;
    scene.remove(this.mesh);
  }
}

class BlockRow3D {
  constructor(zPos, qData) {
    this.z = zPos;
    this.speed = GAME_SPEED_BASE + round * 2.0;
    this.passed = false;
    this.active = true;
    this.blocks = [];
    
    this.group = new THREE.Group();
    this.group.position.z = this.z;
    scene.add(this.group);
    
    // Set global question text
    currentQuestionText = qData.text;
    
    const totalW = GAME_WIDTH;
    const spacing = totalW / NUM_BLOCKS;
    const startX = -totalW/2 + spacing/2;
    
    for(let i=0; i<NUM_BLOCKS; i++) {
      const koopaMesh = models.koopa.clone();
      const xPos = startX + i * spacing;
      
      koopaMesh.position.set(xPos, 0, 0);
      this.group.add(koopaMesh);
      
      // Floating number sprite
      const numSprite = createCrispTextSprite(qData.blocks[i].value.toString(), '#ffffff');
      // Float high enough above the turtle so it's clearly seen
      numSprite.position.set(xPos, 12, 0); 
      this.group.add(numSprite);
      
      this.blocks.push({
        mesh: koopaMesh,
        sprite: numSprite,
        x: xPos,
        width: 8,
        depth: 8,
        value: qData.blocks[i].value,
        isCorrect: qData.blocks[i].isCorrect,
        destroyed: false,
        flashTimer: 0,
        recoil: 0
      });
    }
  }

  update(dt) {
    this.z += this.speed * dt;
    this.group.position.z = this.z;
    
    if (!this.passed && this.z > player.mesh.position.z + 5) {
      this.passed = true;
      round++;
      score += 100 + combo * 10;
      spawnRow();
    }
    
    if (this.z > 50) this.destroy();
    
    // Subtle waddle animation for Koopas
    this.blocks.forEach(b => {
      if(b.destroyed) return;
      b.mesh.rotation.z = Math.sin(gameTime * 8 + b.x) * 0.1;
      b.mesh.position.y = Math.abs(Math.sin(gameTime * 10 + b.x)) * 1.5;
      
      if (b.recoil > 0) {
        b.recoil -= dt;
        b.mesh.position.z += b.recoil * 10; // pushed back
        b.mesh.rotation.x = -b.recoil * 2; // tilt back
      } else {
        b.mesh.rotation.x = 0;
      }
      
      if (b.flashTimer > 0) {
        b.flashTimer -= dt;
        if (b.flashTimer <= 0) {
          b.sprite.material = createCrispTextSprite(b.value.toString(), '#ffffff').material;
        }
      }
    });
  }

  flashRed(blockIndex) {
    const b = this.blocks[blockIndex];
    b.flashTimer = 0.5;
    b.sprite.material = createCrispTextSprite(b.value.toString(), '#ff3344').material;
  }

  destroyBlock(blockIndex) {
    const b = this.blocks[blockIndex];
    b.destroyed = true;
    this.group.remove(b.mesh);
    this.group.remove(b.sprite);
  }

  destroy() {
    this.active = false;
    scene.remove(this.group);
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
    const geometry = new THREE.BufferGeometry();
    const count = 1000; // Large pool
    
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    
    this.points = new THREE.Points(geometry, material);
    scene.add(this.points);
  }
  
  emit(x, y, z, colorHex, count = 30) {
    const color = new THREE.Color(colorHex);
    for(let i=0; i<count; i++) {
      this.particles.push({
        x: x, y: y, z: z,
        vx: (Math.random() - 0.5) * 40,
        vy: (Math.random() - 0.5) * 40 + 10,
        vz: (Math.random() - 0.5) * 40,
        life: 1.0,
        r: color.r, g: color.g, b: color.b
      });
    }
  }
  
  update(dt) {
    let positions = this.points.geometry.attributes.position.array;
    let colors = this.points.geometry.attributes.color.array;
    let index = 0;
    
    for(let i=this.particles.length-1; i>=0; i--) {
      let p = this.particles[i];
      p.life -= dt * 1.2;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 20 * dt; // Gravity
      
      positions[index*3] = p.x;
      positions[index*3+1] = p.y;
      positions[index*3+2] = p.z;
      
      colors[index*3] = p.r * p.life;
      colors[index*3+1] = p.g * p.life;
      colors[index*3+2] = p.b * p.life;
      
      index++;
    }
    
    this.points.geometry.setDrawRange(0, index);
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
}

class SceneryManager {
  constructor() {
    this.group = new THREE.Group();
    scene.add(this.group);
    
    // Cloud Material
    this.cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    this.pipeMat = new THREE.MeshLambertMaterial({ color: 0x00aa00 });
    
    this.objects = [];
    
    // Initial population
    for(let i=0; i<10; i++) {
      this.spawnCloud(Math.random() * -200);
      this.spawnPipe(Math.random() * -200);
    }
  }
  
  spawnCloud(zPos) {
    const cloud = new THREE.Group();
    // Build a fluffy cloud from 3-4 spheres
    const numSpheres = Math.floor(Math.random() * 2) + 3;
    for(let i=0; i<numSpheres; i++) {
      const geo = new THREE.SphereGeometry(Math.random() * 4 + 4, 16, 16);
      const mesh = new THREE.Mesh(geo, this.cloudMat);
      mesh.position.set((Math.random()-0.5)*10, (Math.random()-0.5)*4, (Math.random()-0.5)*5);
      cloud.add(mesh);
    }
    
    // Position far out on X, high up on Y
    const side = Math.random() > 0.5 ? 1 : -1;
    cloud.position.set(side * (Math.random() * 40 + 60), Math.random() * 20 + 30, zPos);
    this.group.add(cloud);
    this.objects.push({ mesh: cloud, type: 'cloud' });
  }
  
  spawnPipe(zPos) {
    const geo = new THREE.CylinderGeometry(4, 4, 15, 16);
    const mesh = new THREE.Mesh(geo, this.pipeMat);
    
    const side = Math.random() > 0.5 ? 1 : -1;
    mesh.position.set(side * (Math.random() * 20 + 40), 7.5, zPos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    this.group.add(mesh);
    this.objects.push({ mesh: mesh, type: 'pipe' });
  }
  
  update(dt) {
    for(let i = this.objects.length - 1; i >= 0; i--) {
      let obj = this.objects[i];
      obj.mesh.position.z += dt * GAME_SPEED_BASE;
      
      // If passed behind camera, recycle it
      if (obj.mesh.position.z > 50) {
        if (obj.type === 'cloud') {
          obj.mesh.position.z = -200 - Math.random() * 50;
        } else {
          obj.mesh.position.z = -200 - Math.random() * 50;
        }
      }
    }
  }
}

// ── Game Objects ─────────────────────────────────────────────
let player;
let bullets = [];
let blockRows = [];
let particles;
let scenery;

// ── Functions ────────────────────────────────────────────────

function spawnRow() {
  const qData = QuestionGenerator.generate(round, NUM_BLOCKS);
  const startZ = -120; // Spawn far in the distance
  blockRows.push(new BlockRow3D(startZ, qData));
}

function startGame() {
  if (!models.mario) return; 
  
  GAME_STATE = 'PLAYING';
  overlays.menu.classList.add('hidden');
  overlays.gameover.classList.add('hidden');
  
  score = 0;
  round = 1;
  combo = 0;
  maxCombo = 0;
  shotsFired = 0;
  shotsHit = 0;
  lives = 3;
  invulnerableTimer = 0;
  
  if (player) player.destroy();
  blockRows.forEach(r => r.destroy());
  bullets.forEach(b => b.destroy());
  
  player = new Player3D();
  bullets = [];
  blockRows = [];
  
  if(!particles) particles = new ParticleSystem();
  particles.particles = [];
  
  if(!scenery) scenery = new SceneryManager();
  
  spawnRow();
}

function gameOver() {
  GAME_STATE = 'GAMEOVER';
  questionDiv.innerHTML = '';
  
  stats.score.innerText = score;
  stats.round.innerText = round;
  stats.combo.innerText = maxCombo;
  stats.accuracy.innerText = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) + '%' : '0%';
  
  overlays.gameover.classList.remove('hidden');
}

function checkCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    let b = bullets[i];
    let hit = false;
    
    for (let r of blockRows) {
      if (hit) break;
      if (b.mesh.position.z < r.z + 5 && b.mesh.position.z > r.z - 5) {
        for (let j = 0; j < r.blocks.length; j++) {
          let blk = r.blocks[j];
          if (blk.destroyed) continue;
          
          if (b.mesh.position.x > blk.x - blk.width/2 && b.mesh.position.x < blk.x + blk.width/2) {
            hit = true;
            b.destroy();
            
            if (blk.isCorrect) {
              r.destroyBlock(j);
              particles.emit(blk.x, 5, r.z, 0x00ff00, 40);
              AudioEngine.coin();
              score += 50 * (1 + combo*0.5);
              combo++;
              
              if (combo === 10) {
                starPowerTimer = 5.0; // 5 seconds of star power
                AudioEngine.starPower();
                particles.emit(player.mesh.position.x, player.mesh.position.y, player.mesh.position.z, 0xffffff, 100);
              }
              
              if (combo > maxCombo) maxCombo = combo;
              shotsHit++;
            } else {
              // If in Star Power, destroy block anyway and don't lose combo
              if (starPowerTimer > 0) {
                r.destroyBlock(j);
                particles.emit(blk.x, 5, r.z, 0x00ff00, 40);
                AudioEngine.coin();
                score += 10;
              } else {
                r.flashRed(j);
                combo = 0;
                AudioEngine.buzz();
                cameraShake = 0.5;
                // Physical recoil
                blk.recoil = 0.3;
                particles.emit(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z, 0xff3344, 20);
              }
            }
            break;
          }
        }
      }
    }
  }
  
  if (!player) return;
  const px = player.mesh.position.x;
  const pz = player.mesh.position.z;
  const pw = player.width/2;
  const pd = player.depth/2;
  
  for (let r of blockRows) {
    if (pz - pd < r.z + 4 && pz + pd > r.z - 4) {
      for (let blk of r.blocks) {
        if (blk.destroyed) continue;
        if (px + pw > blk.x - blk.width/2 && px - pw < blk.x + blk.width/2) {
          if (invulnerableTimer <= 0) {
            lives--;
            particles.emit(px, 5, pz, 0xff0000, 50);
            if (lives <= 0) {
              AudioEngine.gameOver();
              player.destroy();
              gameOver();
              return;
            } else {
              invulnerableTimer = 2.0; // 2 seconds of invulnerability
              combo = 0;
            }
          }
        }
      }
    }
  }
}

function updateHUD() {
  if (GAME_STATE !== 'PLAYING') {
    statsDiv.innerHTML = '';
    questionDiv.innerHTML = '';
    return;
  }
  
  let html = `SCORE: ${Math.floor(score)}<br>ROUND: ${round}<br>LIVES: ${'❤️'.repeat(Math.max(0, lives))}`;
  if (combo > 1) html += `<br><br><span style="color:#fbd000">COMBO x${combo}</span>`;
  statsDiv.innerHTML = html;
  
  questionDiv.innerHTML = currentQuestionText;
}

function update(dt) {
  // Scroll floor grid
  gridHelper.position.z = (gridHelper.position.z + dt * GAME_SPEED_BASE) % 10;
  gameTime += dt;
  if (invulnerableTimer > 0) invulnerableTimer -= dt;
  if (starPowerTimer > 0) starPowerTimer -= dt;
  
  if (GAME_STATE !== 'PLAYING') return;

  if (player) player.update(dt);
  if (scenery) scenery.update(dt);
  
  bullets.forEach(b => b.update(dt));
  bullets = bullets.filter(b => b.active);
  
  blockRows.forEach(r => r.update(dt));
  blockRows = blockRows.filter(r => r.active);
  
  if(particles) particles.update(dt);
  
  checkCollisions();
  updateHUD();
}

function loop(timestamp) {
  let dt = (timestamp - lastTime) / 1000;
  if (dt > 0.1) dt = 0.1;
  lastTime = timestamp;
  
  if (GAME_STATE !== 'LOADING') {
    update(dt);
    
    // Apply camera shake
    if (cameraShake > 0) {
      camera.position.x = (Math.random() - 0.5) * cameraShake * 2;
      camera.position.y = 60 + (Math.random() - 0.5) * cameraShake * 2;
      cameraShake -= dt * 2;
      if (cameraShake < 0) {
        cameraShake = 0;
        camera.position.x = 0;
        camera.position.y = 60;
      }
    }
    
    renderer.render(scene, camera);
  }
  
  requestAnimationFrame(loop);
}
