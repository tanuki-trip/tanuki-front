import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

import type { InboundMode } from "../../../../places/mock";
import { getMovementModeOption, movementModeOptions } from "./movement-modes";
import styles from "./MovementModeSelect.module.css";

type MovementModeSelectProps = {
    labelId: string;
    onChange: (mode: InboundMode) => void;
    value: InboundMode;
};

export function MovementModeSelect({
    labelId,
    onChange,
    value,
}: MovementModeSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const listboxId = useId();
    const selected = getMovementModeOption(value);
    const SelectedIcon = selected.icon;
    const selectedIndex = movementModeOptions.findIndex(
        (option) => option.value === value,
    );

    useEffect(() => {
        if (!isOpen) return;

        optionRefs.current[selectedIndex]?.focus();

        function handleOutsidePointer(event: PointerEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("pointerdown", handleOutsidePointer);
        return () => {
            document.removeEventListener("pointerdown", handleOutsidePointer);
        };
    }, [isOpen, selectedIndex]);

    function closeAndFocusTrigger() {
        setIsOpen(false);
        triggerRef.current?.focus();
    }

    function moveOptionFocus(currentIndex: number, offset: number) {
        const nextIndex =
            (currentIndex + offset + movementModeOptions.length) %
            movementModeOptions.length;
        optionRefs.current[nextIndex]?.focus();
    }

    function handleOptionKeyDown(
        event: KeyboardEvent<HTMLButtonElement>,
        index: number,
    ) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            moveOptionFocus(index, 1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveOptionFocus(index, -1);
        } else if (event.key === "Home") {
            event.preventDefault();
            optionRefs.current[0]?.focus();
        } else if (event.key === "End") {
            event.preventDefault();
            optionRefs.current[movementModeOptions.length - 1]?.focus();
        } else if (event.key === "Escape") {
            event.preventDefault();
            closeAndFocusTrigger();
        }
    }

    return (
        <div className={styles.root} ref={rootRef}>
            <button
                className={styles.trigger}
                ref={triggerRef}
                type="button"
                role="combobox"
                aria-controls={listboxId}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-labelledby={labelId}
                onClick={() => setIsOpen((current) => !current)}
                onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                        event.preventDefault();
                        setIsOpen(true);
                    }
                }}
            >
                <span className={styles.triggerValue}>
                    <SelectedIcon aria-hidden="true" />
                    <span>{selected.label}</span>
                </span>
                <ChevronDown aria-hidden="true" />
            </button>

            {isOpen ? (
                <div className={styles.listbox} id={listboxId} role="listbox">
                    {movementModeOptions.map((option, index) => {
                        const Icon = option.icon;
                        const isSelected = option.value === value;

                        return (
                            <button
                                className={`${styles.option} ${isSelected ? styles.selectedOption : ""}`}
                                key={option.value}
                                ref={(element) => {
                                    optionRefs.current[index] = element;
                                }}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                tabIndex={isSelected ? 0 : -1}
                                onClick={() => {
                                    onChange(option.value);
                                    closeAndFocusTrigger();
                                }}
                                onKeyDown={(event) =>
                                    handleOptionKeyDown(event, index)
                                }
                            >
                                <Icon aria-hidden="true" />
                                <span>{option.label}</span>
                                {isSelected ? (
                                    <Check
                                        className={styles.check}
                                        aria-hidden="true"
                                    />
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}
