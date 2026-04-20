import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import { Spinner } from './spinner';

export const LoaderVariants = cva('grid place-items-center', {
    variants: {
        variant: {
            page: 'h-screen w-full overflow-hidden',
            container: 'h-full min-h-full w-full',
            overlay: 'absolute inset-0',
        },
    },
    defaultVariants: {
        variant: 'container',
    },
});

export type LoaderProps = VariantProps<typeof LoaderVariants> & {
    className?: string;
};

export function PageLoader({ className }: React.ComponentProps<'div'>) {
    return (
        <div
            className={cn(
                'absolute inset-0 flex items-center justify-center bg-background',
                className,
            )}>
            <style>{`
        @keyframes beat {
          0%, 80%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          40% {
            transform: scale(1.4);
            opacity: 1;
          }
        }
      `}</style>
            <div className='flex flex-col items-center gap-4'>
                <div className='flex gap-3'>
                    {[0, 1, 2].map((i) => (
                        <span
                            className='inline-block h-4 w-4 rounded-full bg-primary'
                            key={i}
                            style={{
                                animation: `beat 0.8s infinite cubic-bezier(.36,.07,.19,.97) both`,
                                animationDelay: `${i * 0.15}s`,
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function Loader({ variant, className }: LoaderProps) {
    return (
        <div className={cn(LoaderVariants({ variant }), className)}>
            {variant === 'page' ? <PageLoader /> : <Spinner />}
        </div>
    );
}
