import * as THREE from 'three';
import { Game } from '../types/emulator';
import { emulatorAudio } from './audioSynthesizer';

export interface GameEngineState {
  score: number;
  health: number;
  speed: number;
  lap: number;
  specialMeter: number;
  gameStatusText: string;
}

export interface EngineInputState {
  stickX: number; // -1 to 1
  stickY: number; // -1 to 1
  cStickX: number;
  cStickY: number;
  btnA: boolean;
  btnB: boolean;
  btnX: boolean;
  btnY: boolean;
  btnStart: boolean;
  btnL: number; // 0 to 1
  btnR: number; // 0 to 1
  btnZ: boolean;
  dpadUp: boolean;
  dpadDown: boolean;
  dpadLeft: boolean;
  dpadRight: boolean;
  // Wii specific
  pointerX: number; // 0 to 100
  pointerY: number; // 0 to 100
  shake: boolean;
  nunchukStickX: number;
  nunchukStickY: number;
  nunchukC: boolean;
  nunchukZ: boolean;
}

export class ThreeEmulatorRenderer {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private animationFrameId: number | null = null;
  private game: Game;
  private state: GameEngineState;
  private onStateUpdate?: (state: GameEngineState) => void;

  // Game specific objects
  private gameObjects: THREE.Object3D[] = [];
  private playerMesh: THREE.Object3D | null = null;
  private clock: THREE.Clock;
  private speedFactor: number = 1.0;
  private isPaused: boolean = false;

  constructor(canvas: HTMLCanvasElement, game: Game, onStateUpdate?: (state: GameEngineState) => void) {
    this.canvas = canvas;
    this.game = game;
    this.onStateUpdate = onStateUpdate;
    this.clock = new THREE.Clock();

    this.state = {
      score: 0,
      health: 100,
      speed: 0,
      lap: 1,
      specialMeter: 50,
      gameStatusText: 'SYSTEM READY',
    };

    // Initialize Three.js renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.setSize(canvas.clientWidth || 854, canvas.clientHeight || 480, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, (canvas.clientWidth || 854) / (canvas.clientHeight || 480), 0.1, 1000);

    this.initGameScene();
    this.startLoop();
  }

  public setSpeedFactor(factor: number) {
    this.speedFactor = factor;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public resize(width: number, height: number) {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public captureScreenshot(): string {
    return this.canvas.toDataURL('image/jpeg', 0.85);
  }

  private initGameScene() {
    this.scene.clear();
    this.gameObjects = [];

    if (this.game.id === 'game_cosmic_drift') {
      this.initCosmicDriftScene();
    } else if (this.game.id === 'game_mythic_blade') {
      this.initMythicBladeScene();
    } else if (this.game.id === 'game_island_adventure') {
      this.initIslandSportsScene();
    } else if (this.game.id === 'game_stadium_brawl') {
      this.initStadiumBrawlScene();
    } else {
      this.initCustomDiscScene();
    }
  }

  // --- GAME 1: COSMIC DRIFT RACERS (WII) ---
  private trackCurve: THREE.CatmullRomCurve3 | null = null;
  private kartProgress = 0;
  private kartBoost = 0;

  private initCosmicDriftScene() {
    this.scene.background = new THREE.Color(0x060814);
    this.scene.fog = new THREE.FogExp2(0x060814, 0.015);

    // Starfield background
    const starGeo = new THREE.BufferGeometry();
    const starCount = 600;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 400;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 1.5, transparent: true, opacity: 0.8 });
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);

    // Ambient & directional light
    const amb = new THREE.AmbientLight(0x223355, 1.2);
    this.scene.add(amb);
    const dirLight = new THREE.DirectionalLight(0x00f0ff, 2.5);
    dirLight.position.set(20, 40, 20);
    this.scene.add(dirLight);

    // Glowing speedway track
    const trackPoints: THREE.Vector3[] = [];
    const radius = 60;
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const x = Math.sin(angle) * (radius + Math.sin(angle * 3) * 15);
      const z = Math.cos(angle) * (radius + Math.cos(angle * 2) * 20);
      const y = Math.sin(angle * 4) * 8;
      trackPoints.push(new THREE.Vector3(x, y, z));
    }
    this.trackCurve = new THREE.CatmullRomCurve3(trackPoints, true);

    const tubeGeo = new THREE.TubeGeometry(this.trackCurve, 120, 4.5, 12, true);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: false,
    });
    const trackMesh = new THREE.Mesh(tubeGeo, tubeMat);
    this.scene.add(trackMesh);

    // Neon edge rails
    const railMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
    const railGeo = new THREE.TubeGeometry(this.trackCurve, 120, 4.7, 6, true);
    const railMesh = new THREE.Mesh(railGeo, railMat);
    this.scene.add(railMesh);

    // Kart Player
    const kartGroup = new THREE.Group();
    // Body
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.6, 3.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.9, roughness: 0.2 });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.4;
    kartGroup.add(bodyMesh);

    // Spoiler
    const spoilerGeo = new THREE.BoxGeometry(2.0, 0.1, 0.6);
    const spoilerMat = new THREE.MeshStandardMaterial({ color: 0xec4899, metalness: 0.5 });
    const spoiler = new THREE.Mesh(spoilerGeo, spoilerMat);
    spoiler.position.set(0, 1.0, -1.3);
    kartGroup.add(spoiler);

    // Neon exhaust lights
    const exhaustGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 8);
    const exhaustMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const exhaustL = new THREE.Mesh(exhaustGeo, exhaustMat);
    exhaustL.rotation.x = Math.PI / 2;
    exhaustL.position.set(-0.6, 0.4, -1.6);
    const exhaustR = exhaustL.clone();
    exhaustR.position.x = 0.6;
    kartGroup.add(exhaustL);
    kartGroup.add(exhaustR);

    this.scene.add(kartGroup);
    this.playerMesh = kartGroup;
  }

  // --- GAME 2: MYTHIC BLADE (GAMECUBE) ---
  private heroSlashTimer = 0;
  private swordMesh: THREE.Mesh | null = null;
  private wolfGroup: THREE.Group | null = null;
  private enemies: THREE.Mesh[] = [];

  private initMythicBladeScene() {
    this.scene.background = new THREE.Color(0x0c0a1a);
    this.scene.fog = new THREE.Fog(0x0c0a1a, 15, 60);

    const ambLight = new THREE.AmbientLight(0x4c1d95, 1.0);
    this.scene.add(ambLight);

    const moonLight = new THREE.DirectionalLight(0xa5b4fc, 1.8);
    moonLight.position.set(10, 30, 10);
    this.scene.add(moonLight);

    // Stone courtyard floor
    const floorGeo = new THREE.PlaneGeometry(80, 80, 20, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);

    // Ruined Castle Pillars
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const px = Math.cos(angle) * 18;
      const pz = Math.sin(angle) * 18;
      const pillarGeo = new THREE.CylinderGeometry(1.2, 1.4, 10, 10);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.9 });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(px, 5, pz);
      this.scene.add(pillar);

      // Torch on each pillar
      const torchLight = new THREE.PointLight(0xf59e0b, 1.2, 8);
      torchLight.position.set(px, 6, pz + 0.5);
      this.scene.add(torchLight);
    }

    // Hero Character
    const heroGroup = new THREE.Group();
    // Tunic Body
    const heroBodyGeo = new THREE.CylinderGeometry(0.5, 0.6, 2.0, 8);
    const heroBodyMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    const heroBody = new THREE.Mesh(heroBodyGeo, heroBodyMat);
    heroBody.position.y = 1.0;
    heroGroup.add(heroBody);

    // Head
    const headGeo = new THREE.SphereGeometry(0.4, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfde047 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 2.2;
    heroGroup.add(head);

    // Glowing Master Blade
    const bladeGeo = new THREE.BoxGeometry(0.12, 2.4, 0.3);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.8,
      metalness: 1.0,
      roughness: 0.1,
    });
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(0.8, 1.8, 0.4);
    blade.rotation.z = -0.3;
    heroGroup.add(blade);
    this.swordMesh = blade;

    this.scene.add(heroGroup);
    this.playerMesh = heroGroup;

    // Wolf Companion
    const wolf = new THREE.Group();
    const wolfBodyGeo = new THREE.BoxGeometry(1.0, 0.8, 2.2);
    const wolfBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const wolfBody = new THREE.Mesh(wolfBodyGeo, wolfBodyMat);
    wolfBody.position.y = 0.6;
    wolf.add(wolfBody);
    wolf.position.set(-2.5, 0, 1.5);
    this.scene.add(wolf);
    this.wolfGroup = wolf;

    // Shadow Enemies
    for (let e = 0; e < 3; e++) {
      const enemyGeo = new THREE.DodecahedronGeometry(0.8);
      const enemyMat = new THREE.MeshStandardMaterial({ color: 0x831843, emissive: 0x4c0519 });
      const enemy = new THREE.Mesh(enemyGeo, enemyMat);
      enemy.position.set(Math.sin(e * 2) * 8, 1, Math.cos(e * 2) * 8 + 4);
      this.scene.add(enemy);
      this.enemies.push(enemy);
    }

    this.camera.position.set(0, 5, -8);
    this.camera.lookAt(0, 2, 0);
  }

  // --- GAME 3: ISLAND ADVENTURE SPORTS (WII) ---
  private targets: THREE.Group[] = [];
  private arrowMesh: THREE.Mesh | null = null;
  private arrowFlying = false;
  private arrowVelocity = new THREE.Vector3();

  private initIslandSportsScene() {
    this.scene.background = new THREE.Color(0x38bdf8);
    this.scene.fog = new THREE.Fog(0x38bdf8, 30, 120);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 2.0);
    sunLight.position.set(20, 50, 30);
    this.scene.add(sunLight);
    const amb = new THREE.AmbientLight(0xbae6fd, 1.0);
    this.scene.add(amb);

    // Ocean & Beach Grass
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Tropical Targets
    const targetDistances = [15, 25, 35];
    targetDistances.forEach((dist, idx) => {
      const tGroup = new THREE.Group();
      // Outer ring (white)
      const ring1 = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.2, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      ring1.rotation.x = Math.PI / 2;
      tGroup.add(ring1);
      // Red ring
      const ring2 = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.22, 16), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      ring2.rotation.x = Math.PI / 2;
      tGroup.add(ring2);
      // Bullseye (gold)
      const ring3 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.24, 16), new THREE.MeshStandardMaterial({ color: 0xfacc15 }));
      ring3.rotation.x = Math.PI / 2;
      tGroup.add(ring3);

      tGroup.position.set((idx - 1) * 8, 2.5, dist);
      this.scene.add(tGroup);
      this.targets.push(tGroup);
    });

    // Bow in first person view
    const bowGroup = new THREE.Group();
    const bowGeo = new THREE.TorusGeometry(1.2, 0.08, 8, 24, Math.PI);
    const bowMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const bow = new THREE.Mesh(bowGeo, bowMat);
    bow.rotation.y = Math.PI / 2;
    bowGroup.add(bow);
    bowGroup.position.set(0, 1.8, 2);
    this.scene.add(bowGroup);
    this.playerMesh = bowGroup;

    // Arrow
    const arrowGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 8);
    const arrowMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
    this.arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    this.arrowMesh.rotation.x = Math.PI / 2;
    this.arrowMesh.position.set(0, 1.8, 2);
    this.scene.add(this.arrowMesh);

    this.camera.position.set(0, 2.2, 0);
    this.camera.lookAt(0, 2.5, 20);
  }

  // --- GAME 4: STADIUM BRAWL (GAMECUBE) ---
  private brawler1: THREE.Group | null = null;
  private brawler2: THREE.Group | null = null;
  private brawler1Damage = 18;
  private brawler2Damage = 42;

  private initStadiumBrawlScene() {
    this.scene.background = new THREE.Color(0x090d16);

    // Floodlights
    const spot1 = new THREE.SpotLight(0x00f0ff, 4, 40, Math.PI / 4, 0.5);
    spot1.position.set(-15, 20, 10);
    this.scene.add(spot1);

    const spot2 = new THREE.SpotLight(0xa855f7, 4, 40, Math.PI / 4, 0.5);
    spot2.position.set(15, 20, 10);
    this.scene.add(spot2);

    // Floating Battle Stage Platform
    const stageGeo = new THREE.BoxGeometry(16, 1.5, 8);
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.set(0, -1, 0);
    this.scene.add(stage);

    // Neon edge trim
    const edgeGeo = new THREE.BoxGeometry(16.2, 0.2, 8.2);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.set(0, -0.3, 0);
    this.scene.add(edge);

    // Fighter 1 (Heroic Brawler)
    const f1 = new THREE.Group();
    const f1Body = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.8), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
    f1Body.position.y = 1;
    f1.add(f1Body);
    f1.position.set(-3, 0, 0);
    this.scene.add(f1);
    this.brawler1 = f1;

    // Fighter 2 (Demon Rival)
    const f2 = new THREE.Group();
    const f2Body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.9), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    f2Body.position.y = 1.1;
    f2.add(f2Body);
    f2.position.set(3, 0, 0);
    this.scene.add(f2);
    this.brawler2 = f2;

    this.playerMesh = f1;
    this.camera.position.set(0, 3, 14);
    this.camera.lookAt(0, 1, 0);
  }

  // --- GENERIC / USER IMPORTED ISO RUNNER ---
  private discMesh: THREE.Mesh | null = null;
  private ppcCycles = 0;

  private initCustomDiscScene() {
    this.scene.background = new THREE.Color(0x050711);

    const amb = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(amb);
    const point = new THREE.PointLight(0x00f0ff, 3, 20);
    point.position.set(5, 5, 5);
    this.scene.add(point);

    // Holographic spinning Disc
    const discGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.1, 48);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.9,
      roughness: 0.1,
      wireframe: false,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = Math.PI / 4;
    this.scene.add(disc);
    this.discMesh = disc;

    // Outer gyro rings
    const ringGeo = new THREE.TorusGeometry(4.5, 0.08, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    this.scene.add(ring);

    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);
  }

  // Update loop
  public updateWithInput(input: EngineInputState) {
    if (this.isPaused) return;
    const delta = this.clock.getDelta() * this.speedFactor;

    // Handle specific game mechanics
    if (this.game.id === 'game_cosmic_drift' && this.trackCurve && this.playerMesh) {
      // Speed & steering
      const accel = input.btnA ? 0.35 : 0.1;
      this.kartBoost = Math.max(0, this.kartBoost - delta * 0.5);
      if (input.btnB || input.shake) {
        this.kartBoost = 0.4;
        emulatorAudio.playActionSound('boost');
      }

      this.kartProgress += (accel + this.kartBoost) * delta * 0.15;
      if (this.kartProgress > 1) {
        this.kartProgress -= 1;
        this.state.lap += 1;
        this.state.score += 1000;
        emulatorAudio.playActionSound('score');
      }

      const pointOnTrack = this.trackCurve.getPointAt(this.kartProgress % 1);
      const lookAhead = this.trackCurve.getPointAt((this.kartProgress + 0.02) % 1);

      // Lateral steering offset
      const steer = (input.stickX || (input.nunchukStickX || 0)) * 2.5;
      this.playerMesh.position.copy(pointOnTrack);
      this.playerMesh.position.x += steer;
      this.playerMesh.lookAt(lookAhead);

      // Camera chases kart
      const camOffset = new THREE.Vector3(0, 3.5, -7).applyQuaternion(this.playerMesh.quaternion);
      this.camera.position.copy(this.playerMesh.position).add(camOffset);
      this.camera.lookAt(this.playerMesh.position.clone().add(new THREE.Vector3(0, 1, 0)));

      this.state.speed = Math.round((accel + this.kartBoost) * 220);
      this.state.gameStatusText = `LAP ${this.state.lap}/3 · ${this.state.speed} KM/H`;
    } else if (this.game.id === 'game_mythic_blade' && this.playerMesh) {
      // Hero movement
      const moveX = (input.stickX || 0) * 8 * delta;
      const moveZ = (input.stickY || 0) * 8 * delta;
      this.playerMesh.position.x += moveX;
      this.playerMesh.position.z -= moveZ;

      if (input.btnA || input.btnX) {
        this.heroSlashTimer = 0.25;
        emulatorAudio.playActionSound('slash');
        // Check hit with enemies
        this.enemies.forEach((enemy) => {
          if (enemy.position.distanceTo(this.playerMesh!.position) < 3.0) {
            enemy.position.x += (Math.random() - 0.5) * 4;
            this.state.score += 250;
            emulatorAudio.playActionSound('hit');
          }
        });
      }

      if (this.heroSlashTimer > 0) {
        this.heroSlashTimer -= delta;
        if (this.swordMesh) {
          this.swordMesh.rotation.x = Math.sin(this.heroSlashTimer * 20) * 2.5;
        }
      }

      // Wolf follows hero
      if (this.wolfGroup) {
        this.wolfGroup.position.lerp(this.playerMesh.position.clone().add(new THREE.Vector3(-2, 0, 1.5)), 0.1);
      }

      // Camera tracking
      this.camera.position.set(this.playerMesh.position.x, this.playerMesh.position.y + 6, this.playerMesh.position.z - 9);
      this.camera.lookAt(this.playerMesh.position.x, this.playerMesh.position.y + 1.5, this.playerMesh.position.z);
      this.state.gameStatusText = `RUINS OF HYRULE · SCORE: ${this.state.score}`;
    } else if (this.game.id === 'game_island_adventure') {
      // IR Pointer aiming
      const targetAimX = ((input.pointerX || 50) - 50) / 50 * 6;
      const targetAimY = -((input.pointerY || 50) - 50) / 50 * 3 + 2.5;

      if (this.arrowMesh && !this.arrowFlying) {
        this.arrowMesh.position.set(targetAimX * 0.2, targetAimY * 0.2 + 1.8, 2);
        this.arrowMesh.lookAt(targetAimX, targetAimY, 25);
      }

      if ((input.btnA || input.btnB) && !this.arrowFlying) {
        this.arrowFlying = true;
        this.arrowVelocity.set(targetAimX * 0.05, (targetAimY - 2.2) * 0.05, 1.8);
        emulatorAudio.playActionSound('slash');
      }

      if (this.arrowFlying && this.arrowMesh) {
        this.arrowMesh.position.add(this.arrowVelocity);
        this.arrowVelocity.y -= 0.02 * delta * 60; // gravity

        // Check target hit
        this.targets.forEach((t) => {
          if (this.arrowMesh && Math.abs(this.arrowMesh.position.z - t.position.z) < 1.0) {
            const dist = Math.hypot(this.arrowMesh.position.x - t.position.x, this.arrowMesh.position.y - t.position.y);
            if (dist < 2.0) {
              const pts = dist < 0.6 ? 10 : dist < 1.3 ? 8 : 5;
              this.state.score += pts;
              this.state.gameStatusText = `BULLSEYE! +${pts} PTS`;
              emulatorAudio.playActionSound('score');
              this.resetArrow();
            }
          }
        });

        if (this.arrowMesh && this.arrowMesh.position.z > 40) {
          this.resetArrow();
        }
      }
    } else if (this.game.id === 'game_stadium_brawl' && this.brawler1 && this.brawler2) {
      // Brawl fighter controls
      if (input.btnA || input.btnB) {
        this.brawler2Damage += 4;
        emulatorAudio.playActionSound('hit');
        this.brawler2.position.x += 0.4;
        this.state.score += 50;
      }
      this.brawler1.position.x += (input.stickX || 0) * delta * 6;
      // Keep in stage
      this.brawler1.position.x = Math.max(-7, Math.min(7, this.brawler1.position.x));
      this.state.gameStatusText = `P1: ${this.brawler1Damage}% · CPU: ${this.brawler2Damage}%`;
    } else if (this.discMesh) {
      // Custom ISO runner
      this.discMesh.rotation.y += delta * 2;
      this.ppcCycles += Math.round(729000000 * delta);
      this.state.gameStatusText = `DOLPHIN PPC: ${(this.ppcCycles / 1000000).toFixed(1)}M CYCLES`;
    }

    if (this.onStateUpdate) {
      this.onStateUpdate(this.state);
    }
  }

  private resetArrow() {
    this.arrowFlying = false;
    if (this.arrowMesh) {
      this.arrowMesh.position.set(0, 1.8, 2);
    }
  }

  private startLoop() {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer.dispose();
  }
}
