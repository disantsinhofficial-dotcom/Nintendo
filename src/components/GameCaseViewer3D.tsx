import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Game } from '../types/emulator';
import { X, Rotate3d, Disc, Play } from 'lucide-react';

interface GameCaseViewer3DProps {
  game: Game;
  onClose: () => void;
  onLaunch: (game: Game) => void;
}

export const GameCaseViewer3D: React.FC<GameCaseViewer3DProps> = ({ game, onClose, onLaunch }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const amb = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(amb);
    const dirLight = new THREE.DirectionalLight(0x00f0ff, 2.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xa855f7, 2.0);
    backLight.position.set(-5, -5, -5);
    scene.add(backLight);

    // Create Game Case Group
    const caseGroup = new THREE.Group();
    scene.add(caseGroup);

    // Texture Loader
    const textureLoader = new THREE.TextureLoader();
    const coverTex = textureLoader.load(game.coverImage);

    // Box Dimensions (Standard Wii / GameCube keep case ratio)
    const caseWidth = 2.8;
    const caseHeight = 3.9;
    const caseDepth = 0.32;

    const caseColor = game.platform === 'wii' ? 0xf8fafc : 0x1e1b4b;

    // Materials: [Right, Left (Spine), Top, Bottom, Front, Back]
    const materials = [
      new THREE.MeshStandardMaterial({ color: caseColor, roughness: 0.3 }), // Right edge
      new THREE.MeshStandardMaterial({ color: caseColor, roughness: 0.3 }), // Left edge (Spine)
      new THREE.MeshStandardMaterial({ color: caseColor, roughness: 0.3 }), // Top edge
      new THREE.MeshStandardMaterial({ color: caseColor, roughness: 0.3 }), // Bottom edge
      new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.2 }), // Front cover
      new THREE.MeshStandardMaterial({ color: caseColor, roughness: 0.3 }), // Back cover
    ];

    const boxGeo = new THREE.BoxGeometry(caseWidth, caseHeight, caseDepth);
    const boxMesh = new THREE.Mesh(boxGeo, materials);
    caseGroup.add(boxMesh);

    // Mini 3D Optical Disc inside / behind case
    const discGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.02, 32);
    const discMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.1,
    });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.rotation.x = Math.PI / 2;
    disc.position.set(1.4, 0, 0.05);
    caseGroup.add(disc);

    // Mouse drag interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      caseGroup.rotation.y += deltaX * 0.01;
      caseGroup.rotation.x += deltaY * 0.01;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      caseGroup.rotation.y += deltaX * 0.01;
      caseGroup.rotation.x += deltaY * 0.01;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };
    const onTouchEnd = () => {
      isDragging = false;
    };

    dom.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDragging) {
        caseGroup.rotation.y += 0.006;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      if (mountRef.current?.contains(dom)) {
        mountRef.current.removeChild(dom);
      }
    };
  }, [game]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Rotate3d className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">3D Disc Case Inspection</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3D Viewport */}
        <div ref={mountRef} className="w-full h-80 relative cursor-grab active:cursor-grabbing bg-radial from-slate-900 to-slate-950 flex items-center justify-center">
          <div className="absolute bottom-3 left-4 text-[11px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800 pointer-events-none">
            Drag to rotate 360° · Front, spine & optical disc
          </div>
        </div>

        {/* Info & Launch */}
        <div className="p-5 border-t border-slate-800 space-y-3 bg-slate-950/40">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-white">{game.title}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span className="font-mono text-cyan-400 font-bold">{game.gameId}</span>
                <span>·</span>
                <span className="uppercase">{game.platform}</span>
                <span>·</span>
                <span>{game.region}</span>
                <span>·</span>
                <span>{game.sizeFormatted}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
              {game.compatibilityRating}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                onClose();
                onLaunch(game);
              }}
              className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-[0.99] transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Boot Game in Dolphin Core</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
