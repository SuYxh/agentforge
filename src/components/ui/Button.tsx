import { forwardRef, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 ease-liquid',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.96]',
          {
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-5 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          {
            'bg-primary text-white shadow-glass-sm hover:shadow-glass hover:scale-[1.02] hover:brightness-110 focus:ring-primary':
              variant === 'primary',
            'bg-card border border-border text-foreground hover:bg-accent focus:ring-border':
              variant === 'secondary',
            'bg-transparent text-foreground hover:bg-white/20 dark:hover:bg-white/8 focus:ring-border':
              variant === 'ghost',
            'bg-destructive text-white shadow-glass-sm hover:shadow-glass hover:brightness-110 focus:ring-destructive':
              variant === 'danger',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
