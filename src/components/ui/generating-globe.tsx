import React, { useEffect, useRef } from 'react';
import { RefreshCcw } from 'lucide-react';

interface GeneratingGlobeProps {
  statusText?: string;
  subText?: string;
  accentColor?: 'orange' | 'cyan' | 'red';
  className?: string;
}

export const GeneratingGlobe: React.FC<GeneratingGlobeProps> = ({
  statusText = "GENERATING & SYNTHESIZING FORMAL LOGIC RAG...",
  subText = "Executing multi-agent SMT formal audit & zero-knowledge retrieval",
  accentColor = 'orange',
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = 240);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = 240;
      }
    };

    window.addEventListener('resize', handleResize);

    // 3D Globe Parameters
    const globeRadius = Math.min(width, height) * 0.38;
    const centerX = width / 2;
    const centerY = height / 2;

    // Generate 3D Globe Points (Latitude & Longitude Grid)
    const points: { x: number; y: number; z: number; size: number; alpha: number }[] = [];
    const numLats = 18;
    const numLons = 28;

    for (let i = 0; i <= numLats; i++) {
      const lat = (Math.PI * i) / numLats - Math.PI / 2;
      for (let j = 0; j < numLons; j++) {
        const lon = (2 * Math.PI * j) / numLons;
        const x = globeRadius * Math.cos(lat) * Math.cos(lon);
        const y = globeRadius * Math.sin(lat);
        const z = globeRadius * Math.cos(lat) * Math.sin(lon);
        points.push({ x, y, z, size: Math.random() * 1.6 + 1, alpha: Math.random() * 0.6 + 0.4 });
      }
    }

    // Satellites in orbit
    const satellites = [
      { angle: 0, speed: 0.02, tilt: 0.4, dist: globeRadius * 1.35, color: '#f97316' },
      { angle: Math.PI, speed: -0.015, tilt: -0.5, dist: globeRadius * 1.45, color: '#38bdf8' },
      { angle: Math.PI / 2, speed: 0.025, tilt: 0.2, dist: globeRadius * 1.25, color: '#10b981' },
    ];

    let rotationY = 0;
    let scanLineY = -globeRadius;
    let scanDirection = 1;

    // Color definitions
    const primaryColor = accentColor === 'red' ? '#ef4444' : accentColor === 'cyan' ? '#06b6d4' : '#f97316';
    const glowColor = accentColor === 'red' ? 'rgba(239, 68, 68, 0.4)' : accentColor === 'cyan' ? 'rgba(6, 182, 212, 0.4)' : 'rgba(249, 115, 22, 0.4)';

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render Outer Holographic Atmosphere Glow
      const bgGlow = ctx.createRadialGradient(centerX, centerY, globeRadius * 0.4, centerX, centerY, globeRadius * 1.6);
      bgGlow.addColorStop(0, glowColor);
      bgGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, globeRadius * 1.6, 0, Math.PI * 2);
      ctx.fill();

      // Render Globe Wireframe & Points
      rotationY += 0.008;

      const cosRot = Math.cos(rotationY);
      const sinRot = Math.sin(rotationY);

      // Draw Orbit Paths
      satellites.forEach(sat => {
        ctx.beginPath();
        ctx.strokeStyle = sat.color + '40';
        ctx.lineWidth = 1;
        for (let a = 0; a <= Math.PI * 2; a += 0.1) {
          const ox = sat.dist * Math.cos(a);
          const oy = sat.dist * Math.sin(a) * Math.sin(sat.tilt);
          const oz = sat.dist * Math.sin(a) * Math.cos(sat.tilt);

          // Rotate
          const rx = ox * cosRot - oz * sinRot;
          const rz = ox * sinRot + oz * cosRot;
          const scale = 300 / (300 - rz);

          const projX = centerX + rx * scale;
          const projY = centerY + oy * scale;

          if (a === 0) ctx.moveTo(projX, projY);
          else ctx.lineTo(projX, projY);
        }
        ctx.stroke();
      });

      // Sort points by Z for depth rendering
      const projectedPoints = points.map(pt => {
        // Rotate around Y axis
        const rx = pt.x * cosRot - pt.z * sinRot;
        const rz = pt.x * sinRot + pt.z * cosRot;
        // Perspective projection
        const scale = 300 / (300 - rz);
        return {
          projX: centerX + rx * scale,
          projY: centerY + pt.y * scale,
          z: rz,
          alpha: (rz + globeRadius) / (globeRadius * 2), // Fade back points
          size: pt.size * scale
        };
      });

      projectedPoints.sort((a, b) => a.z - b.z);

      // Render Globe Particles
      projectedPoints.forEach(pt => {
        if (pt.alpha <= 0.05) return;

        ctx.fillStyle = primaryColor;
        ctx.globalAlpha = Math.max(0.1, pt.alpha * 0.85);
        ctx.beginPath();
        ctx.arc(pt.projX, pt.projY, Math.max(0.8, pt.size), 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1.0;

      // Draw Orbiting Satellites & Beam Rays
      satellites.forEach(sat => {
        sat.angle += sat.speed;
        const ox = sat.dist * Math.cos(sat.angle);
        const oy = sat.dist * Math.sin(sat.angle) * Math.sin(sat.tilt);
        const oz = sat.dist * Math.sin(sat.angle) * Math.cos(sat.tilt);

        const rx = ox * cosRot - oz * sinRot;
        const rz = ox * sinRot + oz * cosRot;
        const scale = 300 / (300 - rz);

        const projX = centerX + rx * scale;
        const projY = centerY + oy * scale;

        // Satellite Glow
        ctx.fillStyle = sat.color;
        ctx.shadowColor = sat.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(projX, projY, 4.5 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Beam from satellite to center
        ctx.strokeStyle = sat.color + '70';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(projX, projY);
        ctx.lineTo(centerX, centerY);
        ctx.stroke();

        ctx.shadowBlur = 0;
      });

      // Animated Holographic Radar Scan Line
      scanLineY += scanDirection * 1.5;
      if (scanLineY > globeRadius || scanLineY < -globeRadius) {
        scanDirection *= -1;
      }

      ctx.strokeStyle = primaryColor;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 14;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const scanWidth = Math.sqrt(Math.max(0, globeRadius * globeRadius - scanLineY * scanLineY));
      ctx.moveTo(centerX - scanWidth, centerY + scanLineY);
      ctx.lineTo(centerX + scanWidth, centerY + scanLineY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [accentColor]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/20 bg-black/85 backdrop-blur-2xl p-2 shadow-2xl ${className}`}>
      {/* 3D Canvas Container */}
      <div className="relative w-full h-[240px] flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-black via-zinc-950 to-black border border-white/10">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        
        {/* Futuristic HUD Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />

        {/* Top Floating HUD Metrics */}
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[10px] font-mono text-zinc-300 pointer-events-none">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/70 border border-white/20 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-white uppercase tracking-wider text-[9px]">ISRO MULTI-AGENT SWARM ACTIVE</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-zinc-400 text-[9px]">
            <span>LAT: 13.062°N</span>
            <span>LON: 80.229°E</span>
            <span className="text-orange-400 font-bold">ALT: 540KM</span>
          </div>
        </div>

        {/* Center / Bottom Generating Status Text */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-white pointer-events-none">
          <div className="flex items-center gap-3">
            <RefreshCcw className="w-5 h-5 text-orange-400 animate-spin shrink-0" />
            <div>
              <p className="font-mono font-extrabold uppercase text-xs tracking-wider text-orange-300 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]">
                {statusText}
              </p>
              <p className="text-[10px] font-mono text-zinc-300 mt-0.5 font-medium">
                {subText}
              </p>
            </div>
          </div>

          <div className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/50 text-orange-200 font-mono text-[9px] font-bold uppercase tracking-wider shadow-lg">
            SMT Formal Verification
          </div>
        </div>
      </div>
    </div>
  );
};
