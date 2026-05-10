import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ChemicalParser } from '../../engine/parser';

interface Props {
  formula: string;
}

const ELEMENT_THEME: Record<string, { color: number; emissive: number; radius: number }> = {
  H: { color: 0xffffff, emissive: 0x444444, radius: 0.35 },
  C: { color: 0x1a1a1a, emissive: 0x000000, radius: 0.6 },
  O: { color: 0xff3333, emissive: 0x440000, radius: 0.6 },
  N: { color: 0x3333ff, emissive: 0x000044, radius: 0.65 },
  S: { color: 0xffcc00, emissive: 0x443300, radius: 0.7 },
  P: { color: 0xff9900, emissive: 0x442200, radius: 0.7 },
  default: { color: 0x56a099, emissive: 0x112222, radius: 0.6 }
};

export const MolecularExplorer: React.FC<Props> = ({ formula }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. SCENE SETUP
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(10, 5, 10);

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: "high-performance" 
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows for lab feel
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;

    // 2. LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.SpotLight(0xffffff, 100);
    mainLight.position.set(10, 15, 10);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(2048, 2048);
    scene.add(mainLight);

    const rimLight = new THREE.PointLight(0x56a099, 50);
    rimLight.position.set(-10, -5, -10);
    scene.add(rimLight);

    // 3. CONSTRUCTION
    const moleculeGroup = new THREE.Group();
    const moleculeData = ChemicalParser.parseFormula(formula);
    
    // Flatten counts into individual elements
    const elementsArray = Object.entries(moleculeData.counts).flatMap(([el, count]) => 
      Array(count).fill(el)
    );

    const atoms: any[] = [];
    const bonds: any[] = [];
    const sphereGeo = new THREE.SphereGeometry(1, 64, 64); // High poly for clearcoat effect
    const cylinderGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 12);

    elementsArray.forEach((element, i) => {
      const theme = ELEMENT_THEME[element] || ELEMENT_THEME.default;
      
      const material = new THREE.MeshPhysicalMaterial({ 
        color: theme.color,
        emissive: theme.emissive,
        emissiveIntensity: 0.2,
        roughness: 0.15,
        metalness: 0.4,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        reflectivity: 1.0
      });

      const atom = new THREE.Mesh(sphereGeo, material);
      atom.scale.setScalar(theme.radius);
      atom.castShadow = true;
      atom.receiveShadow = true;
      
      // Fibonacci layout
      const phi = Math.acos(-1 + (2 * i) / elementsArray.length);
      const theta = Math.sqrt(elementsArray.length * Math.PI) * phi;
      const dist = 2.2;
      
      atom.position.set(
        dist * Math.cos(theta) * Math.sin(phi),
        dist * Math.sin(theta) * Math.sin(phi),
        dist * Math.cos(phi)
      );

      moleculeGroup.add(atom);
      atoms.push({ 
        mesh: atom, 
        basePos: atom.position.clone(), 
        offset: Math.random() * Math.PI * 2 
      });
    });

    // Bond Generation
    const bondMat = new THREE.MeshPhysicalMaterial({ 
      color: 0x444444, 
      metalness: 0.9, 
      roughness: 0.1,
      transparent: true,
      opacity: 0.8
    });

    for (let i = 0; i < atoms.length; i++) {
      for (let j = i + 1; j < atoms.length; j++) {
        const d = atoms[i].basePos.distanceTo(atoms[j].basePos);
        // Only connect if within reasonable bonding distance
        if (d < 3.5) {
          const bond = new THREE.Mesh(cylinderGeo, bondMat);
          moleculeGroup.add(bond);
          bonds.push({ mesh: bond, a: i, b: j });
        }
      }
    }

    // Auto-center the group
    const box = new THREE.Box3().setFromObject(moleculeGroup);
    const center = box.getCenter(new THREE.Vector3());
    moleculeGroup.position.sub(center);
    scene.add(moleculeGroup);

    // 4. ANIMATION
    const clock = new THREE.Clock();
    const animate = () => {
      const requestID = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Thermal Jitter & Floating
      moleculeGroup.rotation.y += 0.001;
      
      atoms.forEach(atom => {
        const vShift = Math.sin(time * 4 + atom.offset) * 0.015;
        atom.mesh.position.y = atom.basePos.y + vShift;
      });

      // Update Bonds
      bonds.forEach(bond => {
        const p1 = atoms[bond.a].mesh.position;
        const p2 = atoms[bond.b].mesh.position;
        const dir = p2.clone().sub(p1);
        const len = dir.length();
        
        bond.mesh.scale.set(1, len, 1);
        bond.mesh.position.copy(p1).add(dir.multiplyScalar(0.5));
        bond.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      sphereGeo.dispose();
      cylinderGeo.dispose();
      scene.clear();
    };
  }, [formula]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-linear-to-b from-[#050510] to-[#0a0a1f] relative group rounded-2xl overflow-hidden"
    >
      <div className="absolute top-6 left-6 z-10 pointer-events-none select-none">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-owda-teal animate-pulse" />
            <span className="text-[10px] font-mono text-owda-teal/80 tracking-[.4em] uppercase">Spectral_View</span>
          </div>
          <h3 className="text-3xl font-black text-white tracking-tighter uppercase italic drop-shadow-2xl">
            {formula}
          </h3>
        </div>
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
        <div className="px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full">
            <span className="text-[10px] font-mono text-owda-snow/60 uppercase tracking-widest flex items-center gap-4">
                <span>Rotate</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>Zoom</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span>Interact</span>
            </span>
        </div>
      </div>
    </div>
  );
};