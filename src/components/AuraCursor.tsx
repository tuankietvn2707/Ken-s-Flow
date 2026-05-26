import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export default function AuraCursor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  // Mouse position values
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  // Outer ring physics (smooth, slightly elastic)
  const ringSpringConfig = { damping: 25, stiffness: 400, mass: 0.1 };
  const smoothX = useSpring(cursorX, ringSpringConfig);
  const smoothY = useSpring(cursorY, ringSpringConfig);

  // Inner dot physics (instant follow)
  const dotSpringConfig = { damping: 50, stiffness: 2000, mass: 0.05 };
  const dotX = useSpring(cursorX, dotSpringConfig);
  const dotY = useSpring(cursorY, dotSpringConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      // Check if hovering over clickable elements
      const target = e.target as HTMLElement;
      const isClickable = 
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') !== null ||
        target.closest('a') !== null ||
        window.getComputedStyle(target).cursor === 'pointer';
        
      setIsHovering(!!isClickable);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [cursorX, cursorY, isVisible]);

  // Disable on touch devices
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  if (isTouchDevice) return null;

  // Sizes based on interaction states
  const ringSize = isHovering ? 64 : isClicking ? 24 : 40;
  const dotSize = isHovering ? 0 : isClicking ? 12 : 8; // Hide dot when hovering to focus on ring
  const ringOpacity = isHovering ? 1 : 0.6;

  return (
    <>
      {/* Outer Rotating Gradient Ring */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9998] flex items-center justify-center mix-blend-difference"
        style={{
          x: smoothX,
          y: smoothY,
          width: ringSize,
          height: ringSize,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          scale: isVisible ? 1 : 0,
          opacity: isVisible ? ringOpacity : 0,
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 300, mass: 0.5 }}
      >
        <div className="absolute inset-0 rounded-full border-[1.5px] border-white/80 opacity-50"></div>
        {/* Animated glowing border segment */}
        <motion.div 
          className="absolute inset-0 rounded-full border-t-2 border-r-2 border-transparent border-t-sky-400 border-r-indigo-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        {/* Inner subtle glow when hovering */}
        <motion.div 
          className="absolute inset-0 rounded-full bg-white/10 blur-md"
          animate={{ opacity: isHovering ? 1 : 0, scale: isHovering ? 1.2 : 0.8 }}
        />
      </motion.div>
      
      {/* Inner Glowing Core (Instant follow) */}
      <motion.div
        className="fixed top-0 left-0 bg-white rounded-full pointer-events-none z-[10000] mix-blend-difference"
        style={{
          x: dotX,
          y: dotY,
          width: dotSize,
          height: dotSize,
          translateX: '-50%',
          translateY: '-50%',
          boxShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(56,189,248,0.6)'
        }}
        animate={{
          scale: isVisible && !isHovering ? 1 : 0,
          opacity: isVisible && !isHovering ? 1 : 0,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
      />
    </>
  );
}
