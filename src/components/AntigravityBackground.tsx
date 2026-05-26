import React, { useEffect, useRef } from 'react';

export default function AntigravityBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    // Config
    const PARTICLE_COUNT = 800; // Dense galactic field
    const MOUSE_RADIUS = 250;   // How far the mouse reveals particles
    const REPULSION_FORCE = 0.5; // Gentle push
    const RETURN_FORCE = 0.05; 
    const FRICTION = 0.9; 

    // Colors matching antigravity
    const colors = ['#1e3a8a', '#3730a3', '#4c1d95', '#831843', '#be123c', '#4285F4', '#EA4335'];

    let mouse = {
      x: -1000,
      y: -1000,
    };

    class Particle {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      vx: number;
      vy: number;
      color: string;
      baseLength: number;
      fixedAngle: number;
      opacity: number;

      constructor(x: number, y: number, centerX: number, centerY: number) {
        this.baseX = x;
        this.baseY = y;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.baseLength = Math.random() * 4 + 2; 
        
        // Dash always points outwards radially from center
        this.fixedAngle = Math.atan2(y - centerY, x - centerX);
        this.opacity = 0; // Start invisible
      }

      update() {
        // Distance from mouse
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let targetOpacity = 0;

        // Reveal and repel if near mouse
        if (distance < MOUSE_RADIUS) {
          // Closer to mouse = higher opacity
          targetOpacity = 1 - (distance / MOUSE_RADIUS);
          
          const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
          const angle = Math.atan2(dy, dx);
          
          this.vx -= Math.cos(angle) * force * REPULSION_FORCE;
          this.vy -= Math.sin(angle) * force * REPULSION_FORCE;
        }

        // Smooth opacity transition
        this.opacity += (targetOpacity - this.opacity) * 0.1;

        // Spring back to base position
        const dBaseX = this.baseX - this.x;
        const dBaseY = this.baseY - this.y;
        this.vx += dBaseX * RETURN_FORCE;
        this.vy += dBaseY * RETURN_FORCE;

        this.vx *= FRICTION;
        this.vy *= FRICTION;

        this.x += this.vx;
        this.y += this.vy;
      }

      draw() {
        if (!ctx || this.opacity < 0.01) return; // Don't draw invisible particles
        
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const length = this.baseLength + speed * 0.8;
        
        ctx.beginPath();
        const cosA = Math.cos(this.fixedAngle);
        const sinA = Math.sin(this.fixedAngle);
        
        ctx.moveTo(this.x - cosA * (length/2), this.y - sinA * (length/2));
        ctx.lineTo(this.x + cosA * (length/2), this.y + sinA * (length/2));
        
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = this.opacity; 
        ctx.stroke();
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Spiral / Vortex distribution
        const radius = Math.pow(Math.random(), 1.5) * (Math.max(canvas.width, canvas.height) / 1.2);
        // Add a twist to the angle based on radius to create a galactic spiral
        const angle = (Math.random() * Math.PI * 2) + (radius * 0.002);
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        particles.push(new Particle(x, y, centerX, centerY));
      }
    };

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleResize = () => {
      init();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    init();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[0] opacity-90"
    />
  );
}
