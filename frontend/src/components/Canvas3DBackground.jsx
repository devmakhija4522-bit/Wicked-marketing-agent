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

    // The renderer projects objects with a perspective multiplier of (300/z),
    // roughly 2x, so their distance from center on screen is ~2x their raw
    // x/y offset from center. To land an object at a specific *final* screen
    // position near the edges (clear of the centered glass dashboard cards),
    // back-solve the input x/y from the desired projected fraction.
    // The renderer projects objects with a perspective multiplier of (300/z),
    // roughly 2x, so their distance from center on screen is ~2x their raw
    // x/y offset from center. To land an object at a specific *final* screen
    // position near the edges (clear of the centered glass dashboard cards),
    // back-solve the input x/y from the desired projected fraction.
    const atEdge = (targetFracX, targetFracY, z) => ({
      x: width / 2 + (targetFracX * width - width / 2) * (z / 300),
      y: height / 2 + (targetFracY * height - height / 2) * (z / 300)
    });

    // Sleek, Compact 3D Marketing & Content Objects — framed around outer
    // screen margins so they never overlap or collide with dashboard cards.
    const TECH_OBJECTS = [
      { type: 'instagram', ...atEdge(0.02, 0.05, 150), z: 150, spin: 0.008, color: '#e1306c', baseScale: 0.62 },
      { type: 'camera', ...atEdge(0.015, 0.50, 160), z: 160, spin: -0.009, color: '#6366f1', baseScale: 0.60 },
      { type: 'keyboard', ...atEdge(0.02, 0.95, 170), z: 170, spin: 0.006, color: '#8b5cf6', baseScale: 0.62 },
      { type: 'meta', ...atEdge(0.97, 0.06, 140), z: 140, spin: -0.007, color: '#0668e1', baseScale: 0.62 },
      { type: 'phone', ...atEdge(0.97, 0.48, 150), z: 150, spin: 0.007, color: '#0ea5e9', baseScale: 0.60 },
      { type: 'meta', ...atEdge(0.97, 0.94, 160), z: 160, spin: -0.008, color: '#0668e1', baseScale: 0.60 }
    ];

    // Soft, crisp alpha so objects act as elegant background accents
    const OBJECT_ALPHA = 0.65;

    // Background Particle Grid Matrix
    const NUM_NODES = Math.min(Math.floor(width / 16), 70);
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

      const size = 42 * scale;

      ctx.shadowColor = color;
      ctx.shadowBlur = 8 * scale;

      // Rounded Square Outer Frame
      ctx.beginPath();
      ctx.roundRect(-size / 2, -size / 2, size, size, 12 * scale);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5 * scale;
      ctx.fill();
      ctx.stroke();

      // Camera Lens Circle
      ctx.beginPath();
      ctx.arc(0, 0, 11 * scale, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 * scale;
      ctx.stroke();

      // Flash Dot
      ctx.beginPath();
      ctx.arc(10 * scale, -10 * scale, 2.5 * scale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.restore();
    };

    // Helper: Draw 3D Meta Ads Infinity Object
    const drawMeta3D = (x, y, scale, color) => {
      ctx.save();
      ctx.translate(x, y);

      const size = 44 * scale;

      ctx.shadowColor = color;
      ctx.shadowBlur = 8 * scale;

      // Badge Card
      ctx.beginPath();
      ctx.roundRect(-size / 2 - 6 * scale, -size / 2 + 4 * scale, size + 12 * scale, size - 8 * scale, 10 * scale);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5 * scale;
      ctx.fill();
      ctx.stroke();

      // Meta Infinity Loop Symbol
      ctx.beginPath();
      ctx.ellipse(-9 * scale, 0, 9 * scale, 6 * scale, 0, 0, Math.PI * 2);
      ctx.ellipse(9 * scale, 0, 9 * scale, 6 * scale, 0, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.2 * scale;
      ctx.stroke();

      ctx.restore();
    };

    // Helper: Draw 3D Camera Object
    const drawCamera3D = (x, y, scale, color) => {
      ctx.save();
      ctx.translate(x, y);

      const w = 52 * scale;
      const h = 34 * scale;
      
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 * scale;

      // Camera Body Box
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 8 * scale);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5 * scale;
      ctx.fill();
      ctx.stroke();

      // Viewfinder
      ctx.beginPath();
      ctx.roundRect(-9 * scale, -h / 2 - 6 * scale, 18 * scale, 6 * scale, 3 * scale);
      ctx.fillStyle = color;
      ctx.fill();

      // Lens Circle
      ctx.beginPath();
      ctx.arc(0, 1.5 * scale, 12 * scale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 1.5 * scale, 6.5 * scale, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();
    };

    // Helper: Draw 3D Smartphone Object
    const drawPhone3D = (x, y, scale, color) => {
      ctx.save();
      ctx.translate(x, y);

      const w = 32 * scale;
      const h = 58 * scale;

      ctx.shadowColor = color;
      ctx.shadowBlur = 8 * scale;

      // Phone Body
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 9 * scale);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5 * scale;
      ctx.fill();
      ctx.stroke();

      // Screen Lines
      ctx.beginPath();
      ctx.roundRect(-w / 2 + 3 * scale, -h / 2 + 4 * scale, w - 6 * scale, h - 8 * scale, 6 * scale);
      ctx.fillStyle = `${color}18`;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-w / 4, -h / 4);
      ctx.lineTo(w / 4, -h / 4);
      ctx.moveTo(-w / 4, 0);
      ctx.lineTo(w / 6, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 * scale;
      ctx.stroke();

      ctx.restore();
    };

    // Helper: Draw 3D Keyboard Object
    const drawKeyboard3D = (x, y, scale, color) => {
      ctx.save();
      ctx.translate(x, y);

      const w = 66 * scale;
      const h = 26 * scale;

      ctx.shadowColor = color;
      ctx.shadowBlur = 8 * scale;

      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 6 * scale);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5 * scale;
      ctx.fill();
      ctx.stroke();

      // Keycaps grid
      const rows = 3;
      const cols = 7;
      const kw = 6.5 * scale;
      const kh = 5 * scale;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const kx = -w / 2 + 6.5 * scale + c * (kw + 1.5 * scale);
          const ky = -h / 2 + 4.5 * scale + r * (kh + 1.5 * scale);
          ctx.beginPath();
          ctx.roundRect(kx, ky, kw, kh, 1.5 * scale);
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

      const offsetX = (mouse.x - width / 2) * 0.02;
      const offsetY = (mouse.y - height / 2) * 0.02;

      // Ambient Glow Orbs
      const glow1X = width * 0.35 + Math.sin(step * 0.4) * 80 + offsetX;
      const glow1Y = height * 0.4 + Math.cos(step * 0.4) * 60 + offsetY;
      const grad1 = ctx.createRadialGradient(glow1X, glow1Y, 0, glow1X, glow1Y, 500);
      grad1.addColorStop(0, 'rgba(99, 102, 241, 0.07)');
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const glow2X = width * 0.65 + Math.cos(step * 0.4) * 90 - offsetX;
      const glow2Y = height * 0.6 + Math.sin(step * 0.4) * 70 - offsetY;
      const grad2 = ctx.createRadialGradient(glow2X, glow2Y, 0, glow2X, glow2Y, 550);
      grad2.addColorStop(0, 'rgba(14, 165, 233, 0.07)');
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

      // Render Compact 3D Marketing Objects Floating Around Outer Margins
      TECH_OBJECTS.forEach((obj) => {
        const floatY = Math.sin(step * 1.2 + obj.z) * 8;
        const scale = (300 / obj.z) * obj.baseScale;

        const projX = (obj.x - width / 2) * (300 / obj.z) + width / 2 + offsetX * (380 / obj.z);
        const projY = (obj.y + floatY - height / 2) * (300 / obj.z) + height / 2 + offsetY * (380 / obj.z);

        ctx.save();
        ctx.globalAlpha = OBJECT_ALPHA;

        if (obj.type === 'instagram') drawInstagram3D(projX, projY, scale, obj.color);
        else if (obj.type === 'meta') drawMeta3D(projX, projY, scale, obj.color);
        else if (obj.type === 'camera') drawCamera3D(projX, projY, scale, obj.color);
        else if (obj.type === 'phone') drawPhone3D(projX, projY, scale, obj.color);
        else if (obj.type === 'keyboard') drawKeyboard3D(projX, projY, scale, obj.color);

        ctx.restore();
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
