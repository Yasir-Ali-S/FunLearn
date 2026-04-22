# Web Application Portfolio Hub

Welcome to my interactive Web Application Portfolio. This project demonstrates my ability to build **highly optimized, zero-dependency** front-end applications that bridge the gap between heavy 3D WebGL computation and clean, responsive DOM structures.

This repository contains three primary modules connected by a localized Application Hub.

---

## 1. Application Hub (`index.html`)

A premium, interactive landing page designed to act as the primary routing layer for the portfolio modules.

- **Design System:** Implements modern glassmorphism (backdrop-filters) and ambient radial blur animations using pure CSS.
- **3D Interactions:** Features a custom Vanilla JS 3D-tilt event listener mapped to `mousemove` deltas to create a dynamic depth effect on the selection cards without the overhead of heavy 3D libraries.
- **Separation of Concerns:** Cleanly separated `index.html`, `landing.css`, and `landing.js`.

---

## 2. Module 1: CS:GO Math Shooter 3D (`shooter.html`)

A fully playable 3D First-Person Shooter engine built entirely in Vanilla JS using Three.js as the WebGL rendering layer. It incorporates logic-driven mechanics where dying "plants a bomb" that demands solving procedural math equations to defuse and respawn.

### 🎮 Gameplay Features:
- **3 Weapon Arsenal:** Assault Rifle (auto), Heavy Pistol (semi), and Sniper Rifle (scoped) — switch with `1`, `2`, `3`.
- **Advanced Movement:** Sprint (Shift), Jump (Space), and Slide (Ctrl/C) mechanics with stamina management.
- **Missile System:** Collect missile drops around the map, fire for AOE explosive kills or use for rocket jumping.
- **3D Environment:** Fully loaded with custom GLB models — houses, cars, trees, a central fountain, rocks, and barrels providing tactical cover.
- **Directional Damage Indicators:** On-screen markers showing the direction of incoming fire.

### ⚙️ Engine Architecture & Optimizations:
- **Zero-Latency Input Mapping:** Bypasses standard browser PointerLock buffering by tracking raw hardware mouse deltas from `getCoalescedEvents()`, resulting in completely native, zero-latency camera rotation.
- **Pre-Baked Collision Rects:** 3D model hitboxes are flattened into XZ axis-aligned rectangles at load time, enabling O(n) collision checks with zero per-frame allocations.
- **Particle Object Pooling (Memory Optimization):** Creates 60 cached particle geometries on initialization, bypassing Javascript's Garbage Collector. When an enemy is shot, the engine recycles the memory coordinates instead of instantiating new objects — eliminating micro-stuttering.
- **GLB Model Caching & Cloning:** Each unique `.glb` asset is loaded once and instanced via `clone(true)`, dramatically reducing network requests and GPU memory.
- **Enemy Flocking AI:** Includes Boids-inspired separation. Enemies actively cast proximity checks on each other and apply separation vectors so the horde dynamically spreads out rather than artificially merging into the same coordinates.
- **Line-of-Sight Raycasting:** Enemies verify line-of-sight through environment colliders before firing, enabling cover-based tactical gameplay.
- **Draw Call Reduction:** Employs shared materials (`MeshBasicMaterial`) across all enemy entities to restrict GPU draw calls, maintaining 60FPS on integrated graphics.
- **Audio Routing:** Utilizes the native Web Audio API (OscillatorNode and GainNode) to procedurally synthesize all sound effects (gunshots, explosions) without external asset loading.

### 📁 3D Assets:
| File | Description |
|------|-------------|
| `car.glb` | Vehicle models used as cover objects |
| `house.glb` | Building structures at map corners |
| `tree.glb` | Scattered trees throughout the map |
| `fountain.glb` | Central map fountain landmark |

---

## 3. Module 2: Mariomatics Adventure (`MarioMatics/`)

A 3D math-driven arcade shooter built with Three.js featuring custom Mario-themed GLB models. Players blast through Koopa enemies with fireballs while solving math equations to maintain power-ups and survive.

- **Custom 3D Assets:** Loaded Mario, Koopa Troopa, and Fireball GLB models.
- **Math Combat System:** Solve equations to keep power-ups active during gameplay.
- **3-Life System:** Includes invulnerability frames and respawn mechanics.
- **Procedural Audio:** Custom synthesizer-based sound effects for an authentic arcade feel.
- **Dynamic Environment:** Procedural 3D decorations with dynamic lighting and screen shake feedback.

---

## 4. Module 3: Chemistry Ionic Displacement Lab (`ion/`)

An interactive educational module demonstrating state-management and DOM manipulation without the use of frameworks like React or Vue.

- **State Management:** Uses Vanilla JS to manage the state of multiple simultaneous chemical equations, sequentially unlocking next steps based on user interaction.
- **SVG Animation:** Custom SVG path transitions simulating the swapping of ionic bonds natively.
- **Data-Driven Architecture:** The questions and formula models are strictly separated into structured JSON configurations, keeping the controller script extremely clean.

---

## Quick Start

```bash
# Start the local server
node serve.js
```

Then open `http://localhost:3000/` in your browser to access the Application Hub.

### Controls (CS:GO Math Shooter)
| Key | Action |
|-----|--------|
| W A S D | Move |
| Mouse | Look |
| Left Click | Shoot |
| Right Click | Scope (Sniper) |
| Shift | Sprint |
| Space | Jump |
| Ctrl / C | Slide |
| 1, 2, 3 | Switch Weapon |
| R | Reload |
| E | Pick Up Missile |

---

## Project Structure

```
proj/
├── index.html          # Application Hub landing page
├── landing.css         # Landing page styles
├── landing.js          # Landing page 3D card tilt interactions
├── serve.js            # Local static file server
├── shooter.html        # CS:GO Math Shooter 3D
├── shooter.css         # Shooter HUD & UI styles
├── shooter.js          # Shooter game engine (Three.js)
├── car.glb             # 3D car model
├── fountain.glb        # 3D fountain model
├── house.glb           # 3D house model
├── tree.glb            # 3D tree model
├── MarioMatics/        # Mariomatics Adventure module
│   ├── index.html
│   ├── game.js
│   ├── questions.js
│   ├── style.css
│   ├── mario_obj.glb
│   ├── koopa_troopa_super_mario_bros.glb
│   └── fireball_from_super_mario_bros.glb
├── ion/                # Chemistry Ionic Displacement Lab
│   └── ion/
│       └── coverage/
│           └── index.html
└── README.md
```
