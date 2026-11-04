import React, { useEffect, useRef } from 'react';

export const CinematicLabBackdrop: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Quantum particles & molecular lattice nodes
    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      glowColor: string;
    }

    const nodesCount = 45;
    const nodes: Node[] = [];
    // Deep royal blue, electric blue, gold, white palette (NO GREEN)
    const colorPalette = [
      { fill: '#38bdf8', glow: 'rgba(56, 189, 248, 0.5)' }, // Electric blue
      { fill: '#60a5fa', glow: 'rgba(96, 165, 250, 0.4)' }, // Royal blue
      { fill: '#fbbf24', glow: 'rgba(251, 191, 36, 0.5)' }, // Gold
      { fill: '#fef08a', glow: 'rgba(254, 240, 138, 0.4)' }, // Pale gold
      { fill: '#ffffff', glow: 'rgba(255, 255, 255, 0.6)' }, // Pure white
    ];

    for (let i = 0; i < nodesCount; i++) {
      const palette = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2.8 + 1.2,
        color: palette.fill,
        glowColor: palette.glow
      });
    }

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Deep Space-Navy Atmosphere with Radial Highlights
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#020617'); // Darkest slate/navy
      bgGradient.addColorStop(0.35, '#071530'); // Royal deep navy
      bgGradient.addColorStop(0.7, '#0a192f'); // Midnight laboratory
      bgGradient.addColorStop(1, '#020617');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. High-Tech Blueprint Matrix Grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 60;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Volumetric Laboratory Light Spotlights (Golden + Electric Blue)
      // Top right golden spotlight
      const goldSpotlight = ctx.createRadialGradient(width * 0.85, height * 0.2, 10, width * 0.85, height * 0.2, 450);
      goldSpotlight.addColorStop(0, 'rgba(245, 158, 11, 0.12)');
      goldSpotlight.addColorStop(0.5, 'rgba(245, 158, 11, 0.04)');
      goldSpotlight.addColorStop(1, 'transparent');
      ctx.fillStyle = goldSpotlight;
      ctx.fillRect(0, 0, width, height);

      // Left electric blue research spotlight
      const blueSpotlight = ctx.createRadialGradient(width * 0.15, height * 0.45, 10, width * 0.15, height * 0.45, 500);
      blueSpotlight.addColorStop(0, 'rgba(30, 64, 175, 0.22)');
      blueSpotlight.addColorStop(0.6, 'rgba(56, 189, 248, 0.06)');
      blueSpotlight.addColorStop(1, 'transparent');
      ctx.fillStyle = blueSpotlight;
      ctx.fillRect(0, 0, width, height);

      // Center bottom deep blue atmospheric glow
      const centerGlow = ctx.createRadialGradient(width * 0.5, height * 0.8, 10, width * 0.5, height * 0.8, 550);
      centerGlow.addColorStop(0, 'rgba(29, 78, 216, 0.15)');
      centerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);

      // 4. Rotating 3D Atomic Orbital Rings in the Background
      angle += 0.005;
      const ringCenterX = width * 0.78;
      const ringCenterY = height * 0.35;

      ctx.save();
      ctx.translate(ringCenterX, ringCenterY);

      // Atomic Ring 1
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, 160, 55, Math.PI / 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Atomic Ring 2
      ctx.beginPath();
      ctx.ellipse(0, 0, 160, 55, -Math.PI / 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Atomic Ring 3
      ctx.beginPath();
      ctx.ellipse(0, 0, 175, 45, Math.PI / 2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.15)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();

      // 5. Molecular Bonds & Floating Nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        // Draw connections (Chemical Bonds)
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.25;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Draw atom node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.glowColor;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Subtle vignette gradient to keep focus on text & falcon */}
      <div className="absolute inset-0 bg-radial-vignette from-transparent via-slate-950/20 to-slate-950/80 pointer-events-none" />
    </div>
  );
};
