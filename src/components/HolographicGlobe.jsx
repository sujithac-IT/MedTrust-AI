import { useEffect, useRef } from 'react';

export default function HolographicGlobe({ width = '100%', height = '100%' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let w = (canvas.width = canvas.parentElement.offsetWidth || 800);
    let h = (canvas.height = canvas.parentElement.offsetHeight || 600);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      w = canvas.width = canvas.parentElement.offsetWidth || 800;
      h = canvas.height = canvas.parentElement.offsetHeight || 600;
    };
    window.addEventListener('resize', handleResize);

    // Particle Sphere Setup
    const particles = [];
    const numParticles = 380;
    const radius = Math.min(w, h) * 0.32;

    for (let i = 0; i < numParticles; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      particles.push({
        x: radius * Math.sin(theta) * Math.cos(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(theta),
        size: Math.random() * 2 + 1,
        pulse: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.03
      });
    }

    let angleX = 0.002;
    let angleY = 0.005;
    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.02;

      const centerX = w / 2;
      const centerY = h / 2;

      // Draw Glowing Fluid Inner & Outer Orb Gradients (Matching Reference TechMediz Orb)
      const outerGlow = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius * 1.4);
      outerGlow.addColorStop(0, 'rgba(0, 184, 148, 0.4)');
      outerGlow.addColorStop(0.4, 'rgba(15, 76, 129, 0.35)');
      outerGlow.addColorStop(0.7, 'rgba(93, 173, 226, 0.15)');
      outerGlow.addColorStop(1, 'rgba(15, 23, 42, 0)');

      ctx.save();
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Fluid Dynamic Wavy Rings inside Orb
      ctx.strokeStyle = 'rgba(93, 173, 226, 0.25)';
      ctx.lineWidth = 1.5;
      for (let r = 0.4; r <= 1.1; r += 0.25) {
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.1) {
          const wave = Math.sin(a * 4 + time + r * 2) * 6;
          const currentR = radius * r + wave;
          const px = centerX + Math.cos(a) * currentR;
          const py = centerY + Math.sin(a) * currentR;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Rotate and Project 3D Particles
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      const projected = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Rotation around Y
        let x1 = p.x * cosY - p.z * sinY;
        let z1 = p.z * cosY + p.x * sinY;

        // Rotation around X
        let y1 = p.y * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.y * sinX;

        p.x = x1;
        p.y = y1;
        p.z = z2;

        // Perspective Projection
        const scale = 400 / (400 + z2);
        const projX = centerX + x1 * scale;
        const projY = centerY + y1 * scale;
        const alpha = Math.max(0.1, (z2 + radius) / (2 * radius));

        projected.push({ x: projX, y: projY, z: z2, scale, alpha, p });

        // Draw particle
        p.pulse += p.speed;
        const currentSize = p.size * (1 + Math.sin(p.pulse) * 0.3) * scale;

        ctx.fillStyle = z2 > 0 ? `rgba(0, 184, 148, ${alpha})` : `rgba(93, 173, 226, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(projX, projY, currentSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Dynamic Connecting Lines for Holographic Network Effect
      ctx.lineWidth = 0.5;
      for (let i = 0; i < projected.length; i += 4) {
        for (let j = i + 1; j < projected.length; j += 12) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 65) {
            const lineAlpha = (1 - dist / 65) * 0.25 * projected[i].alpha;
            ctx.strokeStyle = `rgba(93, 173, 226, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ width, height, position: 'relative', overflow: 'hidden', pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}
