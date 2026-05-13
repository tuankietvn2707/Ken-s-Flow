import React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-[16px] font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-[0_4px_16px_rgba(14,165,233,0.3)] hover:shadow-[0_8px_24px_rgba(14,165,233,0.4)]',
        danger: 'bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 shadow-[0_4px_16px_rgba(244,63,94,0.3)] hover:shadow-[0_8px_24px_rgba(244,63,94,0.4)]',
        success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_24px_rgba(16,185,129,0.4)]',
        outline: 'border border-sky-200 bg-white/60 hover:bg-white text-sky-900 shadow-sm backdrop-blur-sm',
        secondary: 'bg-sky-100/80 text-sky-900 hover:bg-sky-200 backdrop-blur-sm',
        ghost: 'hover:bg-sky-50 hover:text-sky-900 text-slate-600',
        link: 'text-sky-600 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2.5 text-[15px]',
        sm: 'h-9 rounded-[12px] px-3 text-sm',
        lg: 'h-12 rounded-[20px] px-8 text-[15px]',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
