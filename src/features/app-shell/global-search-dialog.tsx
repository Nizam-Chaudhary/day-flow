import { Calendar01Icon, Note01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useNavigate } from "@tanstack/react-router";
import { useShallow } from "zustand/react/shallow";

import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";
import { quickActionSearchItems, searchNavItems } from "@/features/app-shell/mock-data";
import { useAppShellStore } from "@/stores/app-shell-store";

export function GlobalSearchDialog({
    onOpenQuickAdd,
    onSyncNow,
}: {
    onOpenQuickAdd: (type?: "event" | "task") => void;
    onSyncNow: () => Promise<void>;
}) {
    const navigate = useNavigate();
    const { isCommandPaletteOpen, setCommandPaletteOpen } = useAppShellStore(
        useShallow((state) => ({
            isCommandPaletteOpen: state.isCommandPaletteOpen,
            setCommandPaletteOpen: state.setCommandPaletteOpen,
        })),
    );

    return (
        <CommandDialog
            description="Search routes and execute quick planner actions."
            open={isCommandPaletteOpen}
            title="Global search"
            onOpenChange={setCommandPaletteOpen}
        >
            <Command>
                <CommandInput placeholder="Search routes, actions, or areas..." />
                <CommandList>
                    <CommandEmpty>No matching routes or actions.</CommandEmpty>
                    <CommandGroup heading="Navigate">
                        {searchNavItems.map((item) => (
                            <CommandItem
                                key={item.to}
                                value={`${item.label} ${item.description}`}
                                onSelect={() => {
                                    setCommandPaletteOpen(false);
                                    void navigate({ to: item.to });
                                }}
                            >
                                <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                                <div className="flex flex-col gap-0.5">
                                    <span>{item.label}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {item.description}
                                    </span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                    <CommandSeparator />
                    <CommandGroup heading="Quick actions">
                        {quickActionSearchItems.map((item) => (
                            <CommandItem
                                key={item.id}
                                value={item.label}
                                onSelect={() => {
                                    setCommandPaletteOpen(false);

                                    if (item.id === "add-task") {
                                        onOpenQuickAdd("task");
                                        return;
                                    }

                                    if (item.id === "add-event") {
                                        onOpenQuickAdd("event");
                                        return;
                                    }

                                    if (item.id === "quick-note") {
                                        void navigate({ to: "/notes" });
                                        return;
                                    }

                                    void onSyncNow();
                                }}
                            >
                                <HugeiconsIcon
                                    icon={
                                        item.id === "add-event"
                                            ? Calendar01Icon
                                            : item.id === "quick-note"
                                              ? Note01Icon
                                              : item.id === "add-task"
                                                ? PlusSignIcon
                                                : item.icon
                                    }
                                    strokeWidth={2}
                                />
                                <span>{item.label}</span>
                                <CommandShortcut>{item.shortcut}</CommandShortcut>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </Command>
        </CommandDialog>
    );
}
