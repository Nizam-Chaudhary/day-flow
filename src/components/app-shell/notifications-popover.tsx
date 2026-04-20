import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { useNavigate } from '@tanstack/react-router';

import { shellNotifications } from '@/components/app-shell/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function NotificationsPopover({
    open,
    onOpenChange,
    triggerIcon,
}: {
    onOpenChange: (open: boolean) => void;
    open: boolean;
    triggerIcon: IconSvgElement;
}) {
    const navigate = useNavigate();
    const unreadCount = shellNotifications.filter((item) => item.unread).length;

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger
                aria-label='Open notifications'
                render={<Button variant='outline' size='sm' />}>
                <HugeiconsIcon data-icon='inline-start' icon={triggerIcon} strokeWidth={2} />
                <span className='hidden sm:inline'>Notifications</span>
                <Badge variant='secondary'>{unreadCount}</Badge>
            </PopoverTrigger>
            <PopoverContent align='end' className='w-[min(26rem,calc(100vw-2rem))] gap-0 p-0'>
                <PopoverHeader className='gap-2 border-b px-4 py-4'>
                    <div className='flex items-center justify-between gap-3'>
                        <PopoverTitle>Notifications</PopoverTitle>
                        <Badge variant='outline'>{unreadCount} unread</Badge>
                    </div>
                    <PopoverDescription>
                        Keep follow-ups visible without breaking focus.
                    </PopoverDescription>
                </PopoverHeader>
                <div className='flex flex-col'>
                    {shellNotifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={cn(
                                'flex flex-col gap-1 border-b px-4 py-3 last:border-b-0',
                                notification.unread ? 'bg-primary/5' : '',
                            )}>
                            <div className='flex items-start justify-between gap-3'>
                                <p className='font-medium'>{notification.title}</p>
                                {notification.unread ? (
                                    <span className='mt-1 size-2 shrink-0 rounded-full bg-primary' />
                                ) : null}
                            </div>
                            <p className='text-sm leading-6 text-muted-foreground'>
                                {notification.body}
                            </p>
                        </div>
                    ))}
                </div>
                <div className='flex items-center justify-end border-t px-4 py-3'>
                    <Button
                        variant='ghost'
                        onClick={() => {
                            onOpenChange(false);
                            void navigate({ to: '/reminders' });
                        }}>
                        Review reminders
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
