import { useEffect, useRef } from "react";

export function useTripDialog(autoFocusSelector = "[data-autofocus]") {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        const previousFocus =
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;

        if (!dialog) {
            return;
        }

        if (typeof dialog.showModal === "function") {
            dialog.showModal();
        } else {
            dialog.open = true;
        }
        dialog.querySelector<HTMLElement>(autoFocusSelector)?.focus();

        return () => {
            if (dialog.open && typeof dialog.close === "function") {
                dialog.close();
            }
            if (previousFocus?.isConnected) {
                previousFocus.focus();
            }
        };
    }, [autoFocusSelector]);

    return dialogRef;
}
