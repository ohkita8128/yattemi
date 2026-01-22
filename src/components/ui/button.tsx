import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0',
        destructive:
          'bg-red-500 text-white hover:bg-red-600',
        outline:
          'border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300',
        secondary:
          'bg-gray-100 text-gray-900 hover:bg-gray-200',
        ghost: 'hover:bg-gray-100 hover:text-gray-900',
        link: 'text-orange-500 underline-offset-4 hover:underline',
        teach:
          'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5',
        learn:
          'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 rounded-lg px-4',
        lg: 'h-12 rounded-xl px-8 text-base',
        xl: 'h-14 rounded-2xl px-10 text-lg',
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
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// リンクスタイルのボタン用コンポーネント
export interface LinkButtonProps extends VariantProps<typeof buttonVariants> {
  href: string;
  className?: string;
  children: React.ReactNode;
}

function LinkButton({ href, variant, size, className, children }: LinkButtonProps) {
  return (
    <a
      href={href}
      className={cn(buttonVariants({ variant, size, className }))}
    >
      {children}
    </a>
  );
}

export { Button, LinkButton, buttonVariants };
