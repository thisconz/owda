import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ChemicalParser } from "../../engine/parser";

interface Props {
  formula: string;
}

// Data-driven theme based on CPK coloring and realistic atomic radii (in Ångströms)
const ELEMENT_THEME: Record<string, { color: number; radius: number; metalness: number }> = {
  H:  { color: 0xffffff, radius: 0.37, metalness: 0.1 },
  C:  { color: 0x333333, radius: 0.77, metalness: 0.2 },
  O:  { color: 0xff3333, radius: 0.73, metalness: 0.1 },
  N:  { color: 0x3366ff, radius: 0.75, metalness: 0.1 },
  S:  { color: 0xffff33, radius: 1.02, metalness: 0.3 },
  P:  { color: 0xff9900, radius: 1.06, metalness: 0.4 },
  Cl: { color: 0x33ff33, radius: 0.99, metalness: 0.2 },
  Fe: { color: 0xdd7733, radius: 1.26, metalness: 0.8 },
  default: { color: 0x56a099, radius: 0.70, metalness: 0.2 },
};

export const MolecularExplorer: React.FC<Props> = ({ formula }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(12, 8, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // --- Lighting (Laboratory Setup) ---
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2);
    keyLight.position.set(5, 10, 7);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xD4FF00, 50); // OWDA Signature Green Rim
    rimLight.position.set(-10, -5, -10);
    scene.add(rimLight);

    // --- Molecule Construction ---
    const moleculeData = ChemicalParser.parseFormula(formula);
    const elementsArray = Object.entries(moleculeData.counts).flatMap(([el, count]) => Array(count).fill(el));
    const atomCount = elementsArray.length;
    const layoutRadius = Math.max(2, Math.sqrt(atomCount) * 1.2);

    const atomGroup = new THREE.Group();
    const atoms: { mesh: THREE.Mesh; basePos: THREE.Vector3; element: string }[] = [];

    const disposables: {
      geometries: THREE.BufferGeometry[];
      materials: THREE.Material[];
    } = { geometries: [], materials: [] };

    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    disposables.geometries.push(sphereGeo);

    elementsArray.forEach((el, i) => {
      const theme = ELEMENT_THEME[el] ?? ELEMENT_THEME.default;
      const mat = new THREE.MeshPhysicalMaterial({
        color: theme.color,
        metalness: theme.metalness,
        roughness: 0.1,
        clearcoat: 1,
        emissive: theme.color,
        emissiveIntensity: 0.05,
      });
      disposables.materials.push(mat);

      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.scale.setScalar(theme.radius);
      
      // Fibonacci positioning
      const phi = Math.acos(1 - (2 * i) / (atomCount));
      const theta = Math.sqrt(atomCount * Math.PI) * phi;
      const pos = new THREE.Vector3(
        layoutRadius * Math.sin(phi) * Math.cos(theta),
        layoutRadius * Math.sin(phi) * Math.sin(theta),
        layoutRadius * Math.cos(phi)
      );

      mesh.position.copy(pos);
      atomGroup.add(mesh);
      atoms.push({ mesh, basePos: pos.clone(), element: el });
    });

    // --- Procedural Bonding ---
    const bondMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.8 });
    disposables.materials.push(bondMat);
    const bondGeo = new THREE.CylinderGeometry(0.12, 0.12, 1, 8);
    disposables.geometries.push(bondGeo);
    const bondMeshes: { mesh: THREE.Mesh; a: number; b: number }[] = [];

    // Simple distance-based heuristics for bonds
    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const dist = atoms[i].basePos.distanceTo(atoms[j].basePos);
        if (dist < layoutRadius * 1.1) { // Threshold for "connected" atoms
          const mesh = new THREE.Mesh(bondGeo, bondMat);
          atomGroup.add(mesh);
          bondMeshes.push({ mesh, a: i, b: j });
        }
      }
    }

    scene.add(atomGroup);

    // --- Background Field (Star-like particles) ---
    const pointsGeo = new THREE.BufferGeometry();
    disposables.geometries.push(pointsGeo);
    const pointsMat = new THREE.PointsMaterial({ color: 0x1A1A1A, size: 0.05, opacity: 0.2, transparent: true });
    disposables.materials.push(pointsMat);
    const coords = new Float32Array(300 * 3);
    for(let i=0; i<900; i++) coords[i] = (Math.random() - 0.5) * 50;
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(coords, 3));
    scene.add(new THREE.Points(pointsGeo, pointsMat));

    // --- Render Loop ---
    let raf: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const t = clock.getElapsedTime();
      
      // Gentle breathing/vibration effect
      atoms.forEach((a, i) => {
        a.mesh.position.y = a.basePos.y + Math.sin(t * 2 + i) * 0.05;
      });

      // Update Bonds
      bondMeshes.forEach(b => {
        const p1 = atoms[b.a].mesh.position;
        const p2 = atoms[b.b].mesh.position;
        const dir = new THREE.Vector3().subVectors(p2, p1);
        const len = dir.length();
        b.mesh.scale.set(1, len, 1);
        b.mesh.position.copy(p1).add(dir.multiplyScalar(0.5));
        b.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      });

      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(raf);
      controls.dispose();

      disposables.geometries.forEach((g) => g.dispose());
      disposables.materials.forEach((m) => m.dispose());
      
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [formula]);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#FDFCFB] relative overflow-hidden border-4 border-[#1A1A1A]">
      {/* Grid Overlay for "Digital Lab" feel */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-size-[40px_40px] bg-[linear-gradient(to_right,black_1px,transparent_1px),linear-gradient(to_bottom,black_1px,transparent_1px)]" />

      {/* Top HUD */}
      <div className="absolute top-8 left-8 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-3 bg-[#1A1A1A] text-white px-3 py-1 w-fit shadow-[4px_4px_0px_#D4FF00]">
          <span className="text-[10px] font-black tracking-widest uppercase">OWDA_Core // Molecule_Visualizer</span>
        </div>
        <div className="bg-white border-2 border-[#1A1A1A] p-4 shadow-[6px_6px_0px_#1A1A1A]">
          <h2 className="text-5xl font-black italic tracking-tighter text-[#1A1A1A] leading-none">
            {formula}
          </h2>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#ff4d4d]" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Stability: Stable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Energy: Low</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="absolute bottom-8 right-8 z-20 hidden md:flex flex-col gap-2 bg-white border-2 border-[#1A1A1A] p-4 shadow-[4px_4px_0px_#1A1A1A]">
        <span className="text-[9px] font-black uppercase mb-2 border-b border-[#1A1A1A]">Element_Key</span>
        {Object.entries(ELEMENT_THEME).filter(([k]) => k !== 'default').map(([el, theme]) => (
          <div key={el} className="flex items-center gap-3">
            <div className="w-3 h-3 border border-[#1A1A1A]" style={{ backgroundColor: `#${theme.color.toString(16)}` }} />
            <span className="text-[10px] font-bold">{el} — {theme.radius}Å</span>
          </div>
        ))}
      </div>
    </div>
  );
};