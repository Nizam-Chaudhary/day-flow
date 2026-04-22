import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { Tick02Icon, UnfoldMoreIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useId, useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type MultiSelectOption = {
    value: string;
    label: ReactNode;
    disabled?: boolean;
};

export function MultiSelect({
    options,
    value,
    defaultValue,
    onValueChange,
    placeholder,
    disabled = false,
    className,
    triggerClassName,
    contentClassName,
    emptyText = 'No options available',
    id,
    'aria-label': ariaLabel,
}: {
    options: MultiSelectOption[];
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    triggerClassName?: string;
    contentClassName?: string;
    emptyText?: string;
    id?: string;
    'aria-label'?: string;
}) {
    const [open, setOpen] = useState(false);
    const [internalValue, setInternalValue] = useState<string[]>(defaultValue ?? []);
    const popupId = useId();

    const isControlled = value !== undefined;
    const selectedValues = useMemo(
        () => normalizeSelectedValues(isControlled ? (value ?? []) : internalValue, options),
        [internalValue, isControlled, options, value],
    );
    const selectedValueSet = useMemo(() => new Set(selectedValues), [selectedValues]);

    const triggerLabel = useMemo(() => {
        const labels = options
            .filter((option) => selectedValueSet.has(option.value))
            .map((option) => getOptionText(option.label))
            .filter((label): label is string => label.length > 0);

        return labels.join(', ');
    }, [options, selectedValueSet]);

    function setSelectedValues(nextValue: string[]) {
        const normalizedNextValue = normalizeSelectedValues(nextValue, options);

        if (!isControlled) {
            setInternalValue(normalizedNextValue);
        }

        onValueChange?.(normalizedNextValue);
    }

    function toggleValue(nextValue: string) {
        if (selectedValueSet.has(nextValue)) {
            setSelectedValues(selectedValues.filter((valueEntry) => valueEntry !== nextValue));
            return;
        }

        setSelectedValues([...selectedValues, nextValue]);
    }

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
            <PopoverPrimitive.Trigger
                render={
                    <Button
                        aria-label={ariaLabel}
                        aria-controls={popupId}
                        aria-expanded={open}
                        className={cn(
                            "flex h-8 w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                            className,
                            triggerClassName,
                        )}
                        disabled={disabled}
                        id={id}
                        role='combobox'
                        type='button'
                        variant='outline'
                    />
                }>
                <span
                    className={cn(
                        'min-w-0 flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap',
                        triggerLabel.length === 0 && 'text-muted-foreground',
                    )}>
                    {triggerLabel.length > 0 ? triggerLabel : placeholder}
                </span>
                <HugeiconsIcon
                    icon={UnfoldMoreIcon}
                    strokeWidth={2}
                    className='pointer-events-none size-4 text-muted-foreground'
                />
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Positioner
                    align='center'
                    alignOffset={0}
                    side='bottom'
                    sideOffset={4}
                    className='isolate z-50'>
                    <PopoverPrimitive.Popup
                        id={popupId}
                        data-slot='multi-select-content'
                        initialFocus={false}
                        className={cn(
                            'relative isolate z-50 min-w-36 origin-(--transform-origin) overflow-hidden rounded-lg bg-popover/70 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
                            contentClassName,
                        )}>
                        <div
                            aria-multiselectable='true'
                            className='no-scrollbar max-h-[min(calc(--spacing(72)---spacing(2)),calc(100vh---spacing(4)))] overflow-y-auto overscroll-contain p-1'
                            role='listbox'>
                            {options.length === 0 ? (
                                <div className='px-2 py-2 text-sm text-muted-foreground'>
                                    {emptyText}
                                </div>
                            ) : null}
                            {options.map((option) => {
                                const isSelected = selectedValueSet.has(option.value);

                                return (
                                    <button
                                        key={option.value}
                                        aria-disabled={option.disabled || undefined}
                                        aria-selected={isSelected}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-md py-1.5 pr-2 pl-2 text-left text-sm transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
                                            isSelected && 'bg-accent/60 text-accent-foreground',
                                        )}
                                        disabled={option.disabled}
                                        onClick={() => toggleValue(option.value)}
                                        role='option'
                                        type='button'>
                                        <span className='min-w-0 flex-1 truncate'>
                                            {option.label}
                                        </span>
                                        <span className='flex size-4 shrink-0 items-center justify-center'>
                                            <HugeiconsIcon
                                                icon={Tick02Icon}
                                                strokeWidth={2}
                                                className={cn(
                                                    'pointer-events-none size-4',
                                                    isSelected ? 'opacity-100' : 'opacity-0',
                                                )}
                                            />
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </PopoverPrimitive.Popup>
                </PopoverPrimitive.Positioner>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    );
}

function normalizeSelectedValues(values: string[], options: MultiSelectOption[]) {
    const optionValueSet = new Set(options.map((option) => option.value));
    const uniqueSelectedValues = new Set(values);

    return options
        .map((option) => option.value)
        .filter(
            (optionValue) =>
                optionValueSet.has(optionValue) && uniqueSelectedValues.has(optionValue),
        );
}

function getOptionText(label: ReactNode) {
    if (typeof label === 'string' || typeof label === 'number') {
        return String(label);
    }

    return '';
}
