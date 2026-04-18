import type { CSSProperties } from 'react';

import { useTheme } from 'next-themes';

import dayFlowMarkDark from '@/assets/brand/day-flow-dark.svg';
import dayFlowMarkLight from '@/assets/brand/day-flow-light.svg';
import { cn } from '@/lib/utils';

export type DayFlowLogoProps = {
    className?: string;
    kind?: 'mark';
    label?: string;
    size?: number | string;
};

const logoSources = {
    // lockup: {
    //     dark: dayFlowLockupDark,
    //     light: dayFlowLockupLight,
    // },
    mark: {
        dark: dayFlowMarkDark,
        light: dayFlowMarkLight,
    },
} as const;

export function DayFlowLogo({ className, kind = 'mark', label, size }: DayFlowLogoProps) {
    const { forcedTheme, resolvedTheme, theme } = useTheme();
    const activeTheme = forcedTheme ?? resolvedTheme ?? theme;
    const variant = activeTheme === 'light' ? 'dark' : 'light';
    const src = logoSources[kind][variant];
    const style = getLogoStyle(kind, size);

    return (
        <img
            alt={label ?? ''}
            aria-hidden={label ? undefined : true}
            className={cn(
                'object-contain select-none',
                kind === 'mark' ? 'size-7' : 'h-auto w-36',
                className,
            )}
            data-kind={kind}
            data-variant={variant}
            draggable={false}
            src={src}
            style={style}
        />
    );
}

function getLogoStyle(
    kind: DayFlowLogoProps['kind'],
    size: DayFlowLogoProps['size'],
): CSSProperties | undefined {
    if (!size) {
        return undefined;
    }

    if (kind === 'mark') {
        return {
            height: size,
            width: size,
        };
    }

    return {
        width: size,
    };
}
