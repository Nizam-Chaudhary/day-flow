import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { runMockAction } from '@/components/app-shell/mock-actions';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { LoadingSwap } from '@/components/ui/loading-swap';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAppShellStore } from '@/stores/app-shell-store';

type QuickAddType = 'event' | 'task';

export function QuickAddDialog({ initialType = 'task' }: { initialType?: QuickAddType }) {
    const isQuickAddOpen = useAppShellStore((state) => state.isQuickAddOpen);
    const selectedDate = useAppShellStore((state) => state.selectedDate);
    const [isSaving, setIsSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [type, setType] = useState<QuickAddType>(initialType);
    const [date, setDate] = useState(selectedDate);
    const [time, setTime] = useState('09:00');
    const [reminder, setReminder] = useState('15 minutes before');
    const setQuickAddOpen = (open: boolean) => {
        useAppShellStore.getState().setQuickAddOpen(open);
    };

    useEffect(() => {
        if (isQuickAddOpen) {
            setType(initialType);
            setDate(selectedDate);
        }
    }, [initialType, isQuickAddOpen, selectedDate]);

    const resetForm = () => {
        setTitle('');
        setType(initialType);
        setDate(selectedDate);
        setTime('09:00');
        setReminder('15 minutes before');
    };

    const handleOpenChange = (open: boolean) => {
        setQuickAddOpen(open);

        if (!open) {
            resetForm();
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            return;
        }

        setIsSaving(true);

        const promise = runMockAction(
            type === 'task' ? 'Prototype task captured.' : 'Prototype event captured.',
        );

        void toast.promise(promise, {
            error: 'Quick add failed.',
            loading: 'Saving quick add...',
            success: (message) => {
                handleOpenChange(false);
                return message;
            },
        });

        try {
            await promise;
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isQuickAddOpen} onOpenChange={handleOpenChange}>
            <DialogContent className='sm:max-w-lg'>
                <DialogHeader>
                    <DialogTitle>Quick add</DialogTitle>
                    <DialogDescription>
                        Capture the next task or event without leaving the current page.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleSave();
                    }}>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor='quick-add-title'>Title</FieldLabel>
                            <FieldContent>
                                <Input
                                    id='quick-add-title'
                                    value={title}
                                    onChange={(event) => {
                                        setTitle(event.currentTarget.value);
                                    }}
                                />
                                <FieldDescription>
                                    Start with a short verb or meeting name.
                                </FieldDescription>
                            </FieldContent>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor='quick-add-type'>Type</FieldLabel>
                            <FieldContent>
                                <ToggleGroup
                                    aria-label='Quick add type'
                                    id='quick-add-type'
                                    variant='outline'>
                                    <ToggleGroupItem
                                        value='task'
                                        pressed={type === 'task'}
                                        onPressedChange={(pressed) => {
                                            if (pressed) {
                                                setType('task');
                                            }
                                        }}>
                                        Task
                                    </ToggleGroupItem>
                                    <ToggleGroupItem
                                        value='event'
                                        pressed={type === 'event'}
                                        onPressedChange={(pressed) => {
                                            if (pressed) {
                                                setType('event');
                                            }
                                        }}>
                                        Event
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </FieldContent>
                        </Field>

                        <div className='grid gap-4 sm:grid-cols-2'>
                            <Field>
                                <FieldLabel htmlFor='quick-add-date'>Date</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id='quick-add-date'
                                        type='date'
                                        value={date}
                                        onChange={(event) => {
                                            setDate(event.currentTarget.value);
                                        }}
                                    />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor='quick-add-time'>Time</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id='quick-add-time'
                                        type='time'
                                        value={time}
                                        onChange={(event) => {
                                            setTime(event.currentTarget.value);
                                        }}
                                    />
                                </FieldContent>
                            </Field>
                        </div>

                        <Field>
                            <FieldLabel htmlFor='quick-add-reminder'>Reminder</FieldLabel>
                            <FieldContent>
                                <Select
                                    value={reminder}
                                    onValueChange={(value) => {
                                        if (!value) {
                                            return;
                                        }

                                        setReminder(value);
                                    }}>
                                    <SelectTrigger className='w-full' id='quick-add-reminder'>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value='None'>None</SelectItem>
                                            <SelectItem value='At start time'>
                                                At start time
                                            </SelectItem>
                                            <SelectItem value='15 minutes before'>
                                                15 minutes before
                                            </SelectItem>
                                            <SelectItem value='30 minutes before'>
                                                30 minutes before
                                            </SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </FieldContent>
                        </Field>
                    </FieldGroup>
                </form>

                <DialogFooter>
                    <Button
                        type='button'
                        variant='outline'
                        onClick={() => {
                            handleOpenChange(false);
                        }}>
                        Cancel
                    </Button>
                    <Button
                        aria-label='Save quick add'
                        disabled={isSaving || !title.trim()}
                        onClick={() => void handleSave()}>
                        <LoadingSwap isLoading={isSaving}>
                            <span>Save</span>
                        </LoadingSwap>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
