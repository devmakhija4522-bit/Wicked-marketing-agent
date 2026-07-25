import { useEffect, useRef } from 'react';
import './Canvas3DBackground.css';

export default function Canvas3DBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse Parallax State
    const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };
    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Mid-Sized 3D Marketing & Content Objects Floating in the CENTER / MIDDLE Area
    const TECH_OBJECTS = [
      { type: 'instagram', x: width * 0.32, y: height * 0.28, z: 150, spin: 0.008, color: '#e1306c', baseScale: 1.4 },
      { type: 'meta', x: width * 0.68, y: height * 0.26, z: 140, spin: -0.007, color: '#0668e1', baseScale: 1.4 },
      { type: 'camera', x: width * 0.26, y: height * 0.58, z: 160, spin: -0.009, color: '#6366f1', baseScale: 1.35 },
      { type: 'phone', x: width * 0.74, y: height * 0.56, z: 150, spin: 0.007, color: '#0ea5e9', baseScale: 1.35 },
      { type: 'keyboard', x: width * 0.42, y: height * 0.72, z: 170, spin: 0.006, color: '#8b5cf6', baseScale: 1.4 },
      { type: 'meta', x: width * 0.58, y: height * 0.75, z: 160, spin: -0.008, color: '#0668e1', baseScale: 1.35 },
      { type: 'instagram', x: width * 0.5, y: height * 0.38, z: 130, spin: 0.009, color: '#e1306c', baseScale: 1.4 }
    ];

    // Background Particle Grid Matrix
    const NUM_NODES = Math.min(Math.floor(width / 12), 100);
    const nodes = Array.from({ length: NUM_NODES }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      z: Math.random() * 400 + 100,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2.5 + 1.2,
      color: Math.random() > 0.5 ? 'rgba(99, 102, 241,' : 'rgba(14, 165, 233,'
    }));

    let step = 0;

    // Helper: Draw 3D Instagram Badge Object
    const drawInstagram3D = (x, y, scale, color) => {
      ctx.save();
      ctx.translate(x, y);

      const size = 56 * scale;

      ctx.shadowColor = color;
      ctx.shadowBlur = 18 * scale;

      // Rounded Square Outer Frame
      ctx.beginPath();
      ctx.roundRect(-size / 2, -size / 2, size, size, 16 * scale);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 * scale;
      ctx.fill();
      ctx.stroke();

      // Camera Lens Circle
      ctx.beginPath();
      ctx.arc(0, 0, 15 * scale, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5 * scale;
      ctx.stroke();

      // Flash Dot
      ctx.beginPath();
      ctx.arc(14 * scale, -14 * scale, 3.5 * scale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.restore();
    };

    // Helper: Draw 3D Meta Ads Infinity Object
    const drawMeta3D = (x, y, scale, color) => {
      ctx.save();
      ctx.translate(x, y);

      const size = 60 * scale;

      ctx.shadowColor = color;
      ctx.shadowBlur = 18 * scale;

      // Badge Card
      ctx.beginPath();
      ctx.roundRect(-size / 2 - 8 * scale, -size / 2 + 6 * scale, size + 16 * scale, size - 12 * scale, 14 * scale);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 * scale;
      ctx.fill();
      ctx.stroke();

      // Meta Infinity Loop Symbol
      ctx.beginPath();
      ctx.ellipse(-12 * scale, 0, 12 * scale, 8 * scale, 0, 0, Math.PI * 2);
      ctx.ellipse(12 * scale, 0, 12 * scale, 8 * scale, 0, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 * scale;
      ctx.stroke();

      ctx.restore();
    };

    // Helper: Draw 3D Camera Object
    const drawCamera3D = (x, y, scale, color) => {
      ctx.save();
      ctx.translate(x, y);

      const w = 70 * scale;
      const h = 46 * scale;
      
      ctx.shadowColor = color;
      ctx.shadowBlur = 18 * scale;

      // Camera Body Box
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 10 * scale);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 * scale;
      ctx.fill();
      ctx.stroke();

      // Viewfinder
      ctx.beginPath();
      ctx.roundRect(-12 * scale, -h / 2 - 8 * scale, 24 * scale, 8 * scale, 4 * scale);
      ctx.fillStyle = color;
      ctx.fill();

      // Lens Circle
      ctx.beginPath();
      ctx.arc(0, 2 * scale, 16 * scale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 2 * scale, 9 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();
    };

    // Helper: Draw 3D Smartphone Object
    const drawPhone3D = (x, y, scale, color) => {
      ctx.save();
      ctx.translate(x, y);

      const w = 42 * scale;
      const h = 78 * scale;

      ctx.shadowColor = color;
      ctx.shadowBlur = 18 * scale;

      // Phone Body
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 12 * scale);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 * scale;
      ctx.fill();
      ctx.stroke();

      // Screen Lines
      ctx.beginPath();
      ctx.roundRect(-w / 2 + 4 * scale, -h / 2 + 6 * scale, w - 8 * scale, h - 12 * scale, 8 * scale);
      ctx.fillStyle = `${color}18`;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-w / 4, -h / 4);
      ctx.lineTo(w / 4, -h / 4);
      ctx.moveTo(-w / 4, 0);
      ctx.lineTo(w / 6, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5 * scale;
      ctx.stroke();

      ctx.restore();
    };

    // Helper: Draw 3D Keyboard Object
    const drawKeyboard3D = (x, y, scale, color) => {
      ctx.save();
      ctx.translate(x, y);

      const w = 90 * scale;
      const h = 36 * scale;

      ctx.shadowColor = color;
      ctx.shadowBlur = 18 * scale;

      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 8 * scale);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 * scale;
      ctx.fill();
      ctx.stroke();

      // Keycaps grid
      const rows = 3;
      const cols = 7;
      const kw = 9 * scale;
      const kh = 7 * scale;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const kx = -w / 2 + 9 * scale + c * (kw + 2 * scale);
          const ky = -h / 2 + 6 * scale + r * (kh + 2 * scale);
          ctx.beginPath();
          ctx.roundRect(kx, ky, kw, kh, 2 * scale);
          ctx.fillStyle = `${color}35`;
          ctx.fill();
        }
      }

      ctx.restore();
    };

    const render = () => {
      step += 0.015;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const offsetX = (mouse.x - width / 2) * 0.04;
      const offsetY = (mouse.y - height / 2) * 0.04;

      // Ambient Glow Orbs
      const glow1X = width * 0.35 + Math.sin(step * 0.4) * 80 + offsetX;
      const glow1Y = height * 0.4 + Math.cos(step * 0.4) * 60 + offsetY;
      const grad1 = ctx.createRadialGradient(glow1X, glow1Y, 0, glow1X, glow1Y, 500);
      grad1.addColorStop(0, 'rgba(99, 102, 241, 0.1)');
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const glow2X = width * 0.65 + Math.cos(step * 0.4) * 90 - offsetX;
      const glow2Y = height * 0.6 + Math.sin(step * 0.4) * 70 - offsetY;
      const grad2 = ctx.createRadialGradient(glow2X, glow2Y, 0, glow2X, glow2Y, 550);
      grad2.addColorStop(0, 'rgba(14, 165, 233, 0.1)');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // Background Nodes
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < -30) n.x = width + 30;
        if (n.x > width + 30) n.x = -30;
        if (n.y < -30) n.y = height + 30;
        if (n.y > height + 30) n.y = -30;

        const scale = 300 / n.z;
        const projX = (n.x - width / 2) * scale + width / 2 + offsetX * (350 / n.z);
        const projY = (n.y - height / 2) * scale + height / 2 + offsetY * (350 / n.z);

        ctx.beginPath();
        ctx.arc(projX, projY, n.size * scale, 0, Math.PI * 2);
        ctx.fillStyle = `${n.color} 0.4)`;
        ctx.fill();
      });

      // Render Mid-Sized 3D Marketing Objects Floating in the CENTER
      TECH_OBJECTS.forEach((obj) => {
        const floatY = Math.sin(step * 1.4 + obj.z) * 14;
        const scale = (300 / obj.z) * obj.baseScale;

        const projX = (obj.x - width / 2) * (300 / obj.z) + width / 2 + offsetX * (380 / obj.z);
        const projY = (obj.y + floatY - height / 2) * (300 / obj.z) + height / 2 + offsetY * (380 / obj.z);

        if (obj.type === 'instagram') drawInstagram3D(projX, projY, scale, obj.color);
        else if (obj.type === 'meta') drawMeta3D(projX, projY, scale, obj.color);
        else if (obj.type === 'camera') drawCamera3D(projX, projY, scale, obj.color);
        else if (obj.type === 'phone') drawPhone3D(projX, projY, scale, obj.color);
        else if (obj.type === 'keyboard') drawKeyboard3D(projX, projY, scale, obj.color);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="canvas-3d-wrapper">
      <canvas ref={canvasRef} className="canvas-3d-element" />
      <div className="canvas-3d-grid-overlay" />
    </div>
  );
}
