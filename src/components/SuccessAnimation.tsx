import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

interface Props {
  isVisible: boolean;
  onComplete: () => void;
}

export default function SuccessAnimation({ isVisible, onComplete }: Props) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  // Generate random particles
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    angle: (Math.PI * 2 * i) / 30 + Math.random() * 0.2,
    distance: 60 + Math.random() * 100,
    size: 4 + Math.random() * 8,
    color: ['#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'][Math.floor(Math.random() * 5)],
    delay: Math.random() * 0.2
  }));

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"
          />

          <div className="relative">
            {/* The main checkmark circle */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative z-10 w-24 h-24 bg-gradient-to-tr from-emerald-400 to-teal-300 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.4)]"
            >
              <motion.div
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              >
                <Check className="w-12 h-12 text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>

            {/* Confetti particles */}
            {showConfetti && particles.map(p => (
              <motion.div
                key={p.id}
                className="absolute top-1/2 left-1/2 rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  marginLeft: -p.size / 2,
                  marginTop: -p.size / 2,
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(p.angle) * p.distance,
                  y: Math.sin(p.angle) * p.distance,
                  scale: 1,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                  delay: p.delay,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
