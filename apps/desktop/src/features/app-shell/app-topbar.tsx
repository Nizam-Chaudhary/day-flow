import { CalendarSyncIcon, Notification03Icon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { LoadingSwap } from '@/components/ui/loading-swap';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { searchMetadata } from '@/features/app-shell/mock-data';
import { NotificationsPopover } from '@/features/app-shell/notifications-popover';
import { useAppShellStore } from '@/stores/app-shell-store';

export function AppTopbar({
    onOpenQuickAdd,
    onSyncNow,
}: {
    onOpenQuickAdd: (type?: 'event' | 'task') => void;
    onSyncNow: () => Promise<void>;
}) {
    const isNotificationsOpen = useAppShellStore((state) => state.isNotificationsOpen);
    const isSyncInFlight = useAppShellStore((state) => state.isSyncInFlight);

    return (
        <header className='sticky top-0 z-40 border-b bg-background'>
            <div className='mx-auto flex w-full max-w-7xl items-center gap-2 px-4 py-3 sm:px-6 lg:px-8'>
                <SidebarTrigger aria-label='Toggle sidebar' className='shrink-0' variant='ghost' />

                <Button
                    aria-label='Open global search'
                    className='min-w-0 flex-1 justify-between'
                    variant='outline'
                    onClick={() => {
                        useAppShellStore.getState().setCommandPaletteOpen(true);
                    }}>
                    <span className='flex min-w-0 items-center gap-2 truncate'>
                        <HugeiconsIcon
                            data-icon='inline-start'
                            icon={searchMetadata.icon}
                            strokeWidth={2}
                        />
                        <span className='truncate text-left'>
                            <span className='hidden sm:inline'>{searchMetadata.title}</span>
                            <span className='sm:hidden'>Search</span>
                        </span>
                    </span>
                    <Kbd>Ctrl/⌘ K</Kbd>
                </Button>

                <Button
                    aria-label='Open quick add'
                    size='sm'
                    variant='outline'
                    onClick={() => {
                        onOpenQuickAdd('task');
                    }}>
                    <HugeiconsIcon data-icon='inline-start' icon={PlusSignIcon} strokeWidth={2} />
                    <span className='hidden sm:inline'>Quick add</span>
                </Button>

                <Button
                    aria-label='Sync now'
                    disabled={isSyncInFlight}
                    size='sm'
                    variant='outline'
                    onClick={() => {
                        void onSyncNow();
                    }}>
                    <HugeiconsIcon
                        data-icon='inline-start'
                        icon={CalendarSyncIcon}
                        strokeWidth={2}
                    />
                    <LoadingSwap isLoading={isSyncInFlight}>
                        <span className='hidden sm:inline'>Sync now</span>
                        <span className='sm:hidden'>Sync</span>
                    </LoadingSwap>
                </Button>

                <NotificationsPopover
                    open={isNotificationsOpen}
                    triggerIcon={Notification03Icon}
                    onOpenChange={(open) => {
                        useAppShellStore.getState().setNotificationsOpen(open);
                    }}
                />
            </div>
        </header>
    );
}
