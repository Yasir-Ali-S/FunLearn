# Web Application Portfolio Hub

Welcome to my interactive Web Application Portfolio. This project demonstrates my ability to build **highly optimized, zero-dependency** front-end applications that bridge the gap between heavy 3D WebGL computation and clean, responsive DOM structures. 

This repository contains two primary modules connected by a localized Application Hub. To run the project, simply open `index.html` in your web browser.

---

## 1. Application Hub (`index.html`)

A premium, interactive landing page designed to act as the primary routing layer for the portfolio modules.

- **Design System:** Implements modern glassmorphism (backdrop-filters) and ambient radial blur animations using pure CSS.
- **3D Interactions:** Features a custom Vanilla JS 3D-tilt event listener mapped to `mousemove` deltas to create a dynamic depth effect on the selection cards without the overhead of heavy 3D libraries.
- **Separation of Concerns:** Cleanly separated `index.html`, `landing.css`, and `landing.js`.

---

## 2. Module 1: CS:GO Math Shooter 3D (`shooter.html`)

A fully playable 3D First-Person Shooter engine built entirely in Vanilla JS using Three.js as the WebGL rendering layer. It incorporates logic-driven mechanics where dying "plants a bomb" that demands solving procedural math equations to defuse and respawn.

### ⚙️ Engine Architecture & Optimizations:
- **Zero-Latency Input Mapping:** Standard browser PointerLock buffered inputs can cause heavy lag spikes during fast movements. The engine bypasses this by tracking raw hardware mouse deltas from `getCoalescedEvents()`, resulting in completely native, zero-latency camera rotation.
- **Particle Object Pooling (Memory Optimization):** Creates 40 cached particle geometries on initialization, bypassing Javascript's Garbage Collector. When an enemy is shot, the engine recycles the memory coordinates instead of instantiating new objects—eliminating micro-stuttering.
- **Enemy Flocking AI:** Includes basic Boids algorithmic separation. Enemies actively cast proximity checks on each other and apply separation vectors so the horde dynamically spreads out rather than artificially merging into the same coordinates.
- **Draw Call Reduction:** Employs shared materials (`MeshBasicMaterial`) across every single rendered enemy entity to heavily restrict GPU draw calls, maintaining 60FPS on integrated graphics.
- **Audio Routing:** Utilizes the native Web Audio API (OscillatorNode and GainNode) to procedurally synthesize sound effects rather than relying on external asset loading.

---

## 3. Module 2: Chemistry Ionic Displacement Lab (`ion/`)

An interactive educational module demonstrating state-management and DOM manipulation without the use of frameworks like React or Vue.

- **State Management:** Uses Vanilla JS to manage the state of multiple simultaneous chemical equations, sequentially unlocking next steps based on user interaction.
- **SVG Animation:** Custom SVG path transitions simulating the swapping of ionic bonds natively.
- **Data-Driven Architecture:** The questions and formula models are strictly separated into structured JSON configurations, keeping the controller script extremely clean.

---

## Quick Start
1. Navigate to the root folder.
2. Double-click `index.html` to open the Application Hub.
3. No build steps (Webpack/NPM), `localhost` servers, or dependency installations are required. The environment has been strictly engineered to bypass standard `file:///` CORS protocol restrictions for ease of review.
