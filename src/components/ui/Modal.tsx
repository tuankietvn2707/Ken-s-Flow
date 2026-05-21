import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  maxWidth = 'md',
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-sky-900/10 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[32px] w-full flex flex-col border border-white dark:border-slate-700/60 relative max-h-[90vh] shadow-[0_24px_64px_rgba(14,165,233,0.12)] ring-1 ring-sky-100 dark:ring-slate-700/50 object-contain z-10",
              maxWidthClasses[maxWidth],
              className
            )}
          >
            {(title || description) && (
              <div className="px-8 py-6 border-b border-sky-100/50 flex justify-between items-start bg-gradient-to-b from-white/60 to-transparent rounded-t-[32px]">
                <div>
                  {title && <h2 className="text-[22px] font-extrabold text-sky-950 dark:text-sky-50 tracking-tight">{title}</h2>}
                  {description && <p className="text-[15px] font-medium text-sky-700/70 mt-1.5">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 -mt-2 text-sky-400 hover:text-sky-600 hover:bg-white border border-transparent hover:border-sky-100 hover:shadow-sm rounded-2xl transition-all duration-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {!title && !description && (
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-sky-400 hover:text-sky-600 hover:bg-white border border-transparent hover:border-sky-100 hover:shadow-sm rounded-2xl transition-all duration-300 z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            <div className="px-8 py-6 overflow-y-auto min-h-0 bg-transparent flex-1 scrollbar-hide">
              {children}
            </div>

            {footer && (
              <div className="px-8 py-5 border-t border-sky-100/50 flex justify-end gap-3 rounded-b-[32px] bg-white/40 backdrop-blur-md">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
