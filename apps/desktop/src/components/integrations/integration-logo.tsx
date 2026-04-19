import { useTheme } from 'next-themes';

import type { MockIntegrationLogoKey } from '@/features/app-shell/mock-data';

import appleLogo from '@/assets/integration-logos/apple-dark.svg';
import googleLogo from '@/assets/integration-logos/google-color.svg';
import outlookLogo from '@/assets/integration-logos/ms-outlook.svg';
import notionLogo from '@/assets/integration-logos/notion-dark.svg';
import slackLogo from '@/assets/integration-logos/slack-color.svg';
import { cn } from '@/lib/utils';

const integrationLogoSources: Record<MockIntegrationLogoKey, string> = {
    apple: appleLogo,
    google: googleLogo,
    notion: notionLogo,
    outlook: outlookLogo,
    slack: slackLogo,
};

const themeAwareLogoKeys = new Set<MockIntegrationLogoKey>(['apple', 'notion']);

type IntegrationLogoProps = {
    className?: string;
    logoKey: MockIntegrationLogoKey;
    name: string;
};

export function IntegrationLogo({ className, logoKey, name }: IntegrationLogoProps) {
    const { forcedTheme, resolvedTheme, theme } = useTheme();
    const activeTheme = forcedTheme ?? resolvedTheme ?? theme;
    const variant = activeTheme === 'dark' ? 'dark' : 'light';
    const needsThemeTreatment = themeAwareLogoKeys.has(logoKey);

    return (
        <div
            className={cn(
                'flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-muted/40',
                className,
            )}
            data-logo-key={logoKey}
            data-testid={`integration-logo-${logoKey}`}
            data-theme-variant={variant}>
            <img
                alt={`${name} logo`}
                className={cn(
                    'size-5 object-contain select-none',
                    logoKey === 'outlook' && 'size-6',
                    needsThemeTreatment && variant === 'dark' && 'invert',
                )}
                draggable={false}
                src={integrationLogoSources[logoKey]}
            />
        </div>
    );
}
