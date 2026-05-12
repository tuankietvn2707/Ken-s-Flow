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
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-sky-950/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "bg-white rounded-3xl shadow-xl w-full flex flex-col border border-sky-100 relative max-h-[90vh]",
              maxWidthClasses[maxWidth],
              className
            )}
          >
            {(title || description) && (
              <div className="p-6 pb-4 border-b border-sky-50 flex justify-between items-start">
                <div>
                  {title && <h2 className="text-xl font-bold text-sky-950">{title}</h2>}
                  {description && <p className="text-sm text-sky-700/70 mt-1">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 -mt-2 text-sky-400 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {!title && !description && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-sky-400 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            
            <div className="p-6 overflow-y-auto min-h-0">
              {children}
            </div>

            {footer && (
              <div className="p-6 pt-4 border-t border-sky-50 flex justify-end gap-3 rounded-b-3xl bg-sky-50/50">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
