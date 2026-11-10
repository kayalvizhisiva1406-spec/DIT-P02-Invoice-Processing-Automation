import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface Invoice3DCanvasProps {
  activeStage?: number; // 0 to 7
  isProcessing?: boolean;
  totalRecords?: number;
  validRate?: number;
}

const WORKFLOW_STAGES = [
  'UPLOAD',
  'READ',
  'EXTRACT',
  'VALIDATE',
  'DUPLICATE CHECK',
  'EXCEPTION DETECTION',
  'RECONCILIATION',
  'REPORT GENERATION',
];

export const Invoice3DCanvas: React.FC<Invoice3DCanvasProps> = ({
  activeStage = 3,
  isProcessing = false,
  totalRecords = 100,
  validRate = 92,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'perspective' | 'front' | 'top'>('perspective');
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);

  const stateRef = useRef({
    activeStage,
    isProcessing,
    speedMultiplier,
    cameraMode,
    wireframeMode,
  });

  useEffect(() => {
    stateRef.current = {
      activeStage,
      isProcessing,
      speedMultiplier,
      cameraMode,
      wireframeMode,
    };
  }, [activeStage, isProcessing, speedMultiplier, cameraMode, wireframeMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // Setup Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080a14);
    scene.fog = new THREE.FogExp2(0x080a14, 0.035);

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 420;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 7.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment map using PMREM
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting: Warm Key + Cool Fill + Rim + Cyan Accents
    const ambientLight = new THREE.AmbientLight(0x1e1b4b, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xa78bfa, 2.5); // Violet key
    keyLight.position.set(4, 8, 5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x06b6d4, 1.8); // Cyan fill
    fillLight.position.set(-5, 4, -3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0x818cf8, 3, 15);
    rimLight.position.set(0, 5, -4);
    scene.add(rimLight);

    // Procedural Texture for Invoice Document
    const createInvoiceTexture = () => {
      const cv = document.createElement('canvas');
      cv.width = 512;
      cv.height = 680;
      const ctx = cv.getContext('2d')!;

      // Paper background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 680);

      // Top brand banner
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(30, 30, 452, 65);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('INVOICE INTELLIGENCE 360', 50, 70);

      // Meta header details
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.fillText('INV-2026-9042 | APEX CLOUD CORP', 45, 125);
      ctx.fillText('DATE: 2026-11-08 | DUE: NET 30', 45, 145);

      // Divider line
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(40, 160, 432, 2);

      // Table lines
      for (let y = 190; y < 460; y += 38) {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(45, y, 422, 26);
        ctx.fillStyle = '#334155';
        ctx.fillRect(55, y + 8, 120, 10);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(240, y + 8, 40, 10);
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(390, y + 8, 65, 10);
      }

      // Total summary section
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(280, 490, 190, 80);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('VERIFIED TOTAL', 300, 520);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('$18,450.00', 300, 552);

      // Security stamp / QR procedural badge
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(50, 500, 110, 50);
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('AI VALIDATED', 60, 532);

      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    };

    const invoiceTex = createInvoiceTexture();

    // 1. Composite 3D Hero Invoice (3-part Group)
    const invoiceGroup = new THREE.Group();

    // Part A: Main Paper Plane with realistic thickness and bevel
    const paperGeo = new THREE.BoxGeometry(2.3, 3.1, 0.04);
    const paperMat = new THREE.MeshStandardMaterial({
      map: invoiceTex,
      roughness: 0.35,
      metalness: 0.08,
      color: 0xffffff,
    });
    const paperMesh = new THREE.Mesh(paperGeo, paperMat);
    paperMesh.castShadow = !isSoftwareGl;
    paperMesh.receiveShadow = !isSoftwareGl;
    invoiceGroup.add(paperMesh);

    // Part B: Holographic Security Border Frame
    const frameGeo = new THREE.BoxGeometry(2.36, 3.16, 0.02);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0x4c1d95,
      emissiveIntensity: 0.4,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.z = -0.025;
    invoiceGroup.add(frameMesh);

    // Part C: Floating Scanning Laser Beam
    const laserGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.5, 16);
    laserGeo.rotateZ(Math.PI / 2);
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.85,
    });
    const laserBeam = new THREE.Mesh(laserGeo, laserMat);
    laserBeam.position.set(0, 0, 0.06);
    invoiceGroup.add(laserBeam);

    // Part D: Laser glow plane
    const glowGeo = new THREE.PlaneGeometry(2.4, 0.2);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const glowPlane = new THREE.Mesh(glowGeo, glowMat);
    glowPlane.position.set(0, 0, 0.05);
    invoiceGroup.add(glowPlane);

    invoiceGroup.position.set(-1.8, 1.2, 0.5);
    scene.add(invoiceGroup);

    // 2. Ground Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d')!;
    const gradient = sCtx.createRadialGradient(64, 64, 10, 64, 64, 60);
    gradient.addColorStop(0, 'rgba(0,0,0,0.6)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    sCtx.fillStyle = gradient;
    sCtx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(-1.8, -0.4, 0.5);
    scene.add(shadowMesh);

    // 3. 3D Workflow Nodes System
    const workflowGroup = new THREE.Group();
    const nodeCount = 8;
    const nodeMeshes: THREE.Mesh[] = [];
    const nodeConnectors: THREE.Line[] = [];

    const nodeSpacing = 0.65;
    const startX = 0.5;

    for (let i = 0; i < nodeCount; i++) {
      const x = startX + (i % 4) * nodeSpacing;
      const z = (Math.floor(i / 4) * 0.9) - 0.4;
      const y = 0.8 + (i % 2 === 0 ? 0.15 : -0.15);

      // Outer Pillar / Ring
      const nodeGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.4, 16);
      const isCurrent = i === activeStage;
      const isPassed = i < activeStage;

      const nodeMat = new THREE.MeshStandardMaterial({
        color: isCurrent ? 0x06b6d4 : isPassed ? 0x10b981 : 0x475569,
        roughness: 0.25,
        metalness: 0.85,
        emissive: isCurrent ? 0x0891b2 : isPassed ? 0x065f46 : 0x1e293b,
        emissiveIntensity: isCurrent ? 0.9 : 0.4,
      });

      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(x, y, z);
      nodeMesh.castShadow = !isSoftwareGl;
      workflowGroup.add(nodeMesh);
      nodeMeshes.push(nodeMesh);

      // Floating Orb atop each node
      const orbGeo = new THREE.SphereGeometry(0.1, 16, 16);
      const orbMat = new THREE.MeshBasicMaterial({
        color: isCurrent ? 0x38bdf8 : isPassed ? 0x34d399 : 0x94a3b8,
      });
      const orbMesh = new THREE.Mesh(orbGeo, orbMat);
      orbMesh.position.set(x, y + 0.32, z);
      workflowGroup.add(orbMesh);
    }

    // Connectors between nodes
    for (let i = 0; i < nodeCount - 1; i++) {
      const p1 = nodeMeshes[i].position;
      const p2 = nodeMeshes[i + 1].position;
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(p1.x, p1.y + 0.3, p1.z),
        new THREE.Vector3(p2.x, p2.y + 0.3, p2.z),
      ]);
      const lineMat = new THREE.LineBasicMaterial({
        color: i < activeStage ? 0x10b981 : 0x3b82f6,
        transparent: true,
        opacity: 0.6,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      workflowGroup.add(line);
      nodeConnectors.push(line);
    }

    scene.add(workflowGroup);

    // 4. Background Particle Constellation
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount; p++) {
      particlePositions[p * 3] = (Math.random() - 0.5) * 16;
      particlePositions[p * 3 + 1] = Math.random() * 8 - 1;
      particlePositions[p * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x818cf8,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Mouse movement interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    container.addEventListener('mousemove', handlePointerMove);

    // Animation Loop
    let clock = new THREE.Clock();
    let frameId = 0;

    function renderLoop() {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime() * stateRef.current.speedMultiplier;

      // Floating gentle motion of Hero Invoice
      invoiceGroup.position.y = 1.2 + Math.sin(time * 1.5) * 0.12;

      // Mouse interactive tilt
      targetRotX = mouseY * 0.25;
      targetRotY = mouseX * 0.35;
      invoiceGroup.rotation.x = THREE.MathUtils.damp(invoiceGroup.rotation.x, targetRotX, 4, delta);
      invoiceGroup.rotation.y = THREE.MathUtils.damp(invoiceGroup.rotation.y, targetRotY - 0.2, 4, delta);

      // Animated Laser Scan up and down paper
      const scanPos = Math.sin(time * 2.2) * 1.35;
      laserBeam.position.y = scanPos;
      glowPlane.position.y = scanPos;

      // Rotate particles subtly
      particles.rotation.y = time * 0.03;

      // Animate workflow active nodes
      const curStage = stateRef.current.activeStage;
      nodeMeshes.forEach((mesh, idx) => {
        if (idx === curStage) {
          mesh.scale.setScalar(1 + Math.sin(time * 4) * 0.08);
        } else {
          mesh.scale.setScalar(1);
        }
      });

      // Camera preset interpolation
      const mode = stateRef.current.cameraMode;
      let targetCamX = 0;
      let targetCamY = 3.2;
      let targetCamZ = 7.5;

      if (mode === 'front') {
        targetCamX = -0.5;
        targetCamY = 1.5;
        targetCamZ = 6.0;
      } else if (mode === 'top') {
        targetCamX = 0;
        targetCamY = 8.0;
        targetCamZ = 2.5;
      }

      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 3, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 3, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 3, delta);
      camera.lookAt(0, 1.2, 0);

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(renderLoop);
    }

    frameId = requestAnimationFrame(renderLoop);

    // Handle resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handlePointerMove);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      paperGeo.dispose();
      paperMat.dispose();
      laserGeo.dispose();
      laserMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] md:h-[450px] rounded-2xl overflow-hidden border border-purple-900/30 bg-gradient-to-b from-[#0b0f19] to-[#07080e] shadow-2xl">
      {/* 3D WebGL Canvas isolated mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Spec & Live Node Badge */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        <div className="px-3 py-1 rounded-full bg-slate-900/80 border border-purple-500/30 text-xs font-mono text-purple-300 flex items-center gap-1.5 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          3D ENGINE: 120 FPS
        </div>
        <div className="px-3 py-1 rounded-full bg-slate-900/80 border border-cyan-500/30 text-xs font-mono text-cyan-300 backdrop-blur-md">
          STAGE: {WORKFLOW_STAGES[activeStage]}
        </div>
        <div className="px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-xs font-mono text-slate-300 backdrop-blur-md">
          RECORDS: {totalRecords} | VALID: {validRate}%
        </div>
      </div>

      {/* Quick Stage Indicator at Top Right */}
      <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400">
        {WORKFLOW_STAGES.map((s, idx) => (
          <span
            key={s}
            className={`px-1.5 py-0.5 rounded ${
              idx === activeStage
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : idx < activeStage
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-slate-500'
            }`}
          >
            {idx + 1}
          </span>
        ))}
      </div>

      {/* Sleek Bottom Control Dock per Three.js skill */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ${
          isCollapsed ? 'translate-y-[calc(100%-24px)]' : 'translate-y-0'
        } max-w-[94%] w-auto`}
      >
        <div className="flex flex-col items-center">
          {/* Collapse/Expand Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="px-3 py-0.5 mb-1 text-[11px] font-mono rounded-t-md bg-slate-800/90 text-slate-300 border-t border-x border-slate-700 hover:text-white transition-colors"
          >
            {isCollapsed ? '▴ Show 3D Controls' : '▾ Hide 3D Controls'}
          </button>

          {/* Unified Horizontal Dock */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/90 border border-purple-500/30 shadow-xl backdrop-blur-md text-xs font-medium text-slate-300">
            {/* Camera Views */}
            <div className="flex items-center gap-1 border-r border-slate-700/60 pr-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">View:</span>
              <button
                onClick={() => setCameraMode('perspective')}
                className={`px-2 py-1 rounded text-xs ${
                  cameraMode === 'perspective' ? 'bg-purple-600 text-white font-bold' : 'hover:bg-slate-800'
                }`}
              >
                3D Angle
              </button>
              <button
                onClick={() => setCameraMode('front')}
                className={`px-2 py-1 rounded text-xs ${
                  cameraMode === 'front' ? 'bg-purple-600 text-white font-bold' : 'hover:bg-slate-800'
                }`}
              >
                Scanner
              </button>
              <button
                onClick={() => setCameraMode('top')}
                className={`px-2 py-1 rounded text-xs ${
                  cameraMode === 'top' ? 'bg-purple-600 text-white font-bold' : 'hover:bg-slate-800'
                }`}
              >
                Top Pipeline
              </button>
            </div>

            {/* Speed Control */}
            <div className="flex items-center gap-1.5 border-r border-slate-700/60 pr-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Speed:</span>
              {[0.5, 1.0, 2.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setSpeedMultiplier(spd)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                    speedMultiplier === spd ? 'bg-cyan-500 text-slate-950 font-bold' : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Stage Direct Picker */}
            <div className="hidden md:flex items-center gap-1 text-[11px] font-mono text-purple-300">
              <span>Interactive Workflow Chamber</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
