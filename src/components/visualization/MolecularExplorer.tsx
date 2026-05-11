import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ChemicalParser } from '../../engine/parser';

interface Props {
  formula: string;
}

const ELEMENT_THEME: Record<string, { color: number; emissive: number; radius: number }> = {
  H:  { color: 0xeeeeee, emissive: 0x222222, radius: 0.31 },
  C:  { color: 0x333333, emissive: 0x000000, radius: 0.77 },
  O:  { color: 0xdd2222, emissive: 0x330000, radius: 0.73 },
  N:  { color: 0x2244ee, emissive: 0x000022, radius: 0.75 },
  S:  { color: 0xddcc00, emissive: 0x333200, radius: 1.02 },
  P:  { color: 0xff9900, emissive: 0x442200, radius: 1.06 },
  Cl: { color: 0x22cc44, emissive: 0x002200, radius: 0.99 },
  Na: { color: 0xaa88ff, emissive: 0x110022, radius: 1.86 },
  K:  { color: 0xcc88ff, emissive: 0x110033, radius: 2.27 },
  Ca: { color: 0xbbbbaa, emissive: 0x111100, radius: 1.97 },
  Fe: { color: 0xcc6633, emissive: 0x221100, radius: 1.26 },
  default: { color: 0x56a099, emissive: 0x112222, radius: 0.80 },
};

/**
 * Position atoms using a Fibonacci sphere layout (evenly distributed).
 * Scales radius with atom count so the molecule stays comfortably in view.
 */
function fibonacciSphere(n: number, index: number, radius: number): THREE.Vector3 {
  if (n === 1) return new THREE.Vector3(0, 0, 0);
  const phi   = Math.acos(1 - (2 * index) / (n - 1));
  const theta = Math.sqrt(n * Math.PI) * phi;
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi)
  );
}

export const MolecularExplorer: React.FC<Props> = ({ formula }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Setup ──────────────────────────────────────────────────────────────
    const width  = container.clientWidth;
    const height = container.clientHeight;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(8, 4, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping    = true;
    controls.dampingFactor    = 0.05;
    controls.autoRotate       = true;
    controls.autoRotateSpeed  = 0.2;
    controls.minDistance      = 3;
    controls.maxDistance      = 30;

    // ── Lighting ───────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const sun = new THREE.SpotLight(0xffffff, 120);
    sun.position.set(10, 15, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);

    const rim = new THREE.PointLight(0x56a099, 60);
    rim.position.set(-10, -5, -10);
    scene.add(rim);

    const fill = new THREE.PointLight(0x313280, 30);
    fill.position.set(5, -10, 5);
    scene.add(fill);

    // ── Build Molecule ─────────────────────────────────────────────────────
    const group        = new THREE.Group();
    const moleculeData = ChemicalParser.parseFormula(formula);

    // Flatten element counts into an ordered array
    const elementsArray: string[] = Object.entries(moleculeData.counts).flatMap(
      ([el, count]) => Array(count).fill(el)
    );

    const atomCount = elementsArray.length;
    const layoutRadius = Math.max(1.5, atomCount * 0.45);

    const sphereGeo   = new THREE.SphereGeometry(1, 48, 48);
    const cylinderGeo = new THREE.CylinderGeometry(0.08, 0.08, 1, 12);

    // ── Atoms ──────────────────────────────────────────────────────────────
    const atoms: { mesh: THREE.Mesh; basePos: THREE.Vector3; phase: number }[] = [];

    elementsArray.forEach((element, i) => {
      const theme = ELEMENT_THEME[element] ?? ELEMENT_THEME.default;

      const material = new THREE.MeshPhysicalMaterial({
        color:              theme.color,
        emissive:           theme.emissive,
        emissiveIntensity:  0.15,
        roughness:          0.2,
        metalness:          0.35,
        clearcoat:          1.0,
        clearcoatRoughness: 0.1,
        reflectivity:       1.0,
      });

      const mesh = new THREE.Mesh(sphereGeo, material);
      mesh.scale.setScalar(theme.radius * 0.5);
      mesh.castShadow    = true;
      mesh.receiveShadow = true;

      const pos = fibonacciSphere(atomCount, i, layoutRadius);
      mesh.position.copy(pos);
      group.add(mesh);
      atoms.push({ mesh, basePos: pos.clone(), phase: Math.random() * Math.PI * 2 });
    });

    // ── Bonds ──────────────────────────────────────────────────────────────
    const bondMat = new THREE.MeshPhysicalMaterial({
      color:       0x555566,
      metalness:   0.9,
      roughness:   0.1,
      transparent: true,
      opacity:     0.75,
    });

    const BOND_THRESHOLD = layoutRadius < 3 ? 3.0 : layoutRadius * 0.9;

    const bonds: { mesh: THREE.Mesh; a: number; b: number }[] = [];
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const dist = atoms[i].basePos.distanceTo(atoms[j].basePos);
        if (dist < BOND_THRESHOLD) {
          const bond = new THREE.Mesh(cylinderGeo, bondMat);
          group.add(bond);
          bonds.push({ mesh: bond, a: i, b: j });
        }
      }
    }

    // Center group
    const box    = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    group.position.sub(center);
    scene.add(group);

    // ── Glow Particle Halo ─────────────────────────────────────────────────
    const particleCount = 80;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const r     = layoutRadius * 1.8 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x56a099, size: 0.06, transparent: true, opacity: 0.4 });
    scene.add(new THREE.Points(particleGeo, particleMat));

    // ── Animation ──────────────────────────────────────────────────────────
    const clock    = new THREE.Clock();
    let   rafId    = -1;
    const tmpDir   = new THREE.Vector3();
    const tmpUp    = new THREE.Vector3(0, 1, 0);

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Thermal jitter
      atoms.forEach((atom) => {
        atom.mesh.position.y = atom.basePos.y + Math.sin(t * 3 + atom.phase) * 0.025;
      });

      // Update bonds to track atom positions
      bonds.forEach((bond) => {
        const p1 = atoms[bond.a].mesh.position;
        const p2 = atoms[bond.b].mesh.position;
        tmpDir.subVectors(p2, p1);
        const len = tmpDir.length();
        bond.mesh.scale.set(1, len, 1);
        bond.mesh.position.addVectors(p1, tmpDir.multiplyScalar(0.5));
        bond.mesh.quaternion.setFromUnitVectors(tmpUp, tmpDir.normalize());
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // ── Resize ────────────────────────────────────────────────────────────
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── CLEANUP (memory leak fix) ─────────────────────────────────────────
    return () => {
      // Cancel animation frame FIRST to stop rendering
      cancelAnimationFrame(rafId);

      window.removeEventListener('resize', onResize);
      controls.dispose();

      // Dispose all geometries & materials
      sphereGeo.dispose();
      cylinderGeo.dispose();
      bondMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      atoms.forEach((a) => (a.mesh.material as THREE.Material).dispose());

      renderer.dispose();

      // Remove canvas from DOM
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      scene.clear();
    };
  }, [formula]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-linear-to-b from-[#050510] to-[#0a0a1f] relative group rounded-2xl overflow-hidden"
    >
      {/* HUD Overlay */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none select-none">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-owda-teal animate-pulse" />
            <span className="text-[10px] font-mono text-owda-teal/80 tracking-[.4em] uppercase">
              Spectral_View
            </span>
          </div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic drop-shadow-2xl">
            {formula}
          </h3>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
        <div className="px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
          <span className="text-[10px] font-mono text-owda-snow/60 uppercase tracking-widest flex items-center gap-4">
            <span>Drag to Rotate</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>Scroll to Zoom</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>Right-drag to Pan</span>
          </span>
        </div>
      </div>
    </div>
  );
};