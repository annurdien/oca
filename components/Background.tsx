import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Background: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    // Deep fog for depth, matching the deepSpace color
    scene.fog = new THREE.FogExp2(0x030508, 0.015);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 30);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // --- Dynamic Grid Floor ---
    // Custom grid logic for infinite scrolling effect
    const gridCount = 40;
    const gridWidth = 200;
    const gridDepth = 200;
    const gridGeometry = new THREE.BufferGeometry();
    const gridPoints = [];
    
    // Create lines along Z
    for (let x = 0; x <= gridCount; x++) {
        const xPos = (x / gridCount) * gridWidth - (gridWidth / 2);
        gridPoints.push(xPos, 0, -gridDepth / 2);
        gridPoints.push(xPos, 0, gridDepth / 2);
    }
    // Create lines along X
    for (let z = 0; z <= gridCount; z++) {
        const zPos = (z / gridCount) * gridDepth - (gridDepth / 2);
        gridPoints.push(-gridWidth / 2, 0, zPos);
        gridPoints.push(gridWidth / 2, 0, zPos);
    }
    
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(gridPoints, 3));
    const gridMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00f3ff, 
        transparent: true, 
        opacity: 0.3 // Increased visibility
    });
    const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
    grid.position.y = -10;
    scene.add(grid);

    // --- Floating Particles (Data Motes) ---
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 150;
        const y = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 150;
        
        particlePositions[i * 3] = x;
        particlePositions[i * 3 + 1] = y;
        particlePositions[i * 3 + 2] = z;
        
        particleSpeeds[i] = 0.02 + Math.random() * 0.03;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
        color: 0x00f3ff,
        size: 0.4, // Slightly larger
        transparent: true,
        opacity: 0.8, // More opaque
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // --- Interaction State ---
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
       mouseX = (event.clientX / window.innerWidth) * 2 - 1;
       mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- Animation Loop ---
    let time = 0;
    const spacing = gridDepth / gridCount;
    
    const animate = () => {
      time += 0.005;

      // Animate Grid (Infinite Scroll effect)
      grid.position.z = (time * 15) % spacing; 
      
      // Animate Particles
      const positions = particles.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < particleCount; i++) {
          // Move particles upwards slowly
          positions[i * 3 + 1] += particleSpeeds[i];
          
          // Reset if too high
          if (positions[i * 3 + 1] > 40) {
              positions[i * 3 + 1] = -40;
          }
          
          // Subtle sine wave drift on X
          positions[i * 3] += Math.sin(time + positions[i * 3 + 1]) * 0.02;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      
      // Pulse particle opacity
      particlesMaterial.opacity = 0.5 + Math.sin(time * 1.5) * 0.2;

      // Smooth Camera Parallax
      const targetCamX = mouseX * 3;
      const targetCamY = 5 + (mouseY * 2);
      
      camera.position.x += (targetCamX - camera.position.x) * 0.03;
      camera.position.y += (targetCamY - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // --- Resize Handler ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // --- Cleanup ---
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      
      gridGeometry.dispose();
      gridMaterial.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, []); 

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 -z-10 bg-deepSpace"
      style={{
          background: 'radial-gradient(circle at 50% 50%, #0a101f 0%, #000000 100%)' 
      }}
    >
        {/* Subtle Overlay for Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
        {/* Gradient vignette at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-deepSpace to-transparent opacity-80 pointer-events-none"></div>
    </div>
  );
};

export default Background;