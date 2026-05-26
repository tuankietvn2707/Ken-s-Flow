import React, { useEffect, useRef } from 'react';

export default function WaterSlimeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let blobs: Blob[] = [];

    class Blob {
      x: number;
      y: number;
      radius: number;
      life: number;
      decay: number;

      constructor(x: number, y: number, radius: number) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.life = 1.0;
        this.decay = 0.015 + Math.random() * 0.01;
      }

      update() {
        this.life -= this.decay;
        this.radius *= 0.98; // Shrink slightly
      }

      draw() {
        if (!ctx || this.life <= 0) return;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Ocean / Slime color
        // Using a solid color allows the SVG gooey filter to work perfectly
        ctx.fillStyle = '#38bdf8'; // light blue (Tailwind sky-400)
        ctx.fill();
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = blobs.length - 1; i >= 0; i--) {
        blobs[i].update();
        blobs[i].draw();
        
        if (blobs[i].life <= 0) {
          blobs.splice(i, 1);
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    let lastX = -1000;
    let lastY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Spawn more blobs if moving fast, to keep a continuous liquid trail
      if (dist > 5) {
        const steps = Math.min(Math.floor(dist / 5), 10);
        for (let i = 0; i < steps; i++) {
          const spawnX = lastX + (dx * i) / steps;
          const spawnY = lastY + (dy * i) / steps;
          
          // Randomize radius slightly for organic liquid look
          const radius = Math.random() * 15 + 25; 
          blobs.push(new Blob(spawnX, spawnY, radius));
        }
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };

    const handleResize = () => {
      init();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    init();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <svg className="hidden">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  
                      0 1 0 0 0  
                      0 0 1 0 0  
                      0 0 0 18 -7"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div 
        className="fixed inset-0 pointer-events-none z-[0] opacity-40 mix-blend-multiply"
        style={{ filter: 'url(#goo)' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
    </>
  );
}
