import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { MouseEvent, PointerEvent as ReactPointerEvent } from "react";

import { isFixedTripPlace, type TripPlace } from "../../../../places/model";

type PointerDragState = {
    activationTimer: number | null;
    dragging: boolean;
    pointerId: number;
    pointerType: string;
    sourceElement: HTMLElement;
    sourceId: string;
    startX: number;
    startY: number;
    targetElement: HTMLElement | null;
    targetId: string | null;
    touchCancelListener: (() => void) | null;
    touchEndListener: (() => void) | null;
    touchMoveListener: ((event: TouchEvent) => void) | null;
};

type UseTimelineReorderOptions = {
    isBookmark: boolean;
    onPlaceSelect?: (placeId: string) => void;
    onReorder: (sourceId: string, targetId: string) => void;
    places: readonly TripPlace[];
};

const DRAG_THRESHOLD_PX = 6;
const LONG_PRESS_DELAY_MS = 350;
const TOUCH_MOVE_TOLERANCE_PX = 8;

function findCardAtPoint(
    source: HTMLElement,
    clientX: number,
    clientY: number,
) {
    const cards = source
        .closest("ol")
        ?.querySelectorAll<HTMLElement>("[data-place-id]");

    return Array.from(cards ?? []).find((card) => {
        if (card === source || card.dataset.fixed === "true") {
            return false;
        }

        const bounds = card.getBoundingClientRect();

        return (
            clientX >= bounds.left &&
            clientX <= bounds.right &&
            clientY >= bounds.top &&
            clientY <= bounds.bottom
        );
    });
}

function updateDragPosition(
    pointerDrag: PointerDragState,
    clientX: number,
    clientY: number,
) {
    pointerDrag.sourceElement.style.setProperty(
        "--drag-x",
        `${clientX - pointerDrag.startX}px`,
    );
    pointerDrag.sourceElement.style.setProperty(
        "--drag-y",
        `${clientY - pointerDrag.startY}px`,
    );
}

function updateDropTarget(
    pointerDrag: PointerDragState,
    clientX: number,
    clientY: number,
) {
    const targetElement =
        findCardAtPoint(pointerDrag.sourceElement, clientX, clientY) ?? null;
    const nextTarget =
        targetElement === pointerDrag.sourceElement ? null : targetElement;

    if (pointerDrag.targetElement === nextTarget) {
        return;
    }

    if (pointerDrag.targetElement) {
        delete pointerDrag.targetElement.dataset.dropTarget;
    }

    if (nextTarget) {
        nextTarget.dataset.dropTarget = "true";
    }

    pointerDrag.targetElement = nextTarget;
    pointerDrag.targetId = nextTarget?.dataset.placeId ?? null;
}

export function useTimelineReorder({
    isBookmark,
    onPlaceSelect,
    onReorder,
    places,
}: UseTimelineReorderOptions) {
    const timelineRef = useRef<HTMLElement | null>(null);
    const pointerDragRef = useRef<PointerDragState | null>(null);
    const suppressPlaceSelectionRef = useRef(false);
    const previousCardPositionsRef = useRef<Map<string, DOMRect> | null>(null);
    const settleAnimationsRef = useRef<Animation[]>([]);

    useLayoutEffect(() => {
        const previousCardPositions = previousCardPositionsRef.current;
        previousCardPositionsRef.current = null;

        settleAnimationsRef.current.forEach((animation) => animation.cancel());
        settleAnimationsRef.current = [];

        if (
            !previousCardPositions ||
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ) {
            return;
        }

        const cards =
            timelineRef.current?.querySelectorAll<HTMLElement>(
                "[data-place-id]",
            ) ?? [];

        settleAnimationsRef.current = Array.from(cards).flatMap((card) => {
            const placeId = card.dataset.placeId;
            const previousBounds = placeId
                ? previousCardPositions.get(placeId)
                : null;

            if (!previousBounds || typeof card.animate !== "function") {
                return [];
            }

            const currentBounds = card.getBoundingClientRect();
            const deltaX = previousBounds.left - currentBounds.left;
            const deltaY = previousBounds.top - currentBounds.top;

            if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
                return [];
            }

            return [
                card.animate(
                    [
                        {
                            transform: `translate3d(${deltaX}px, ${deltaY}px, 0)`,
                        },
                        { transform: "translate3d(0, 0, 0)" },
                    ],
                    {
                        duration: 180,
                        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
                    },
                ),
            ];
        });
    }, [places]);

    const finishPointerDrag = useCallback(
        (shouldReorder: boolean) => {
            const pointerDrag = pointerDragRef.current;

            if (!pointerDrag) {
                return;
            }

            const canReorder = Boolean(
                shouldReorder &&
                pointerDrag.dragging &&
                pointerDrag.targetId &&
                pointerDrag.targetId !== pointerDrag.sourceId,
            );

            if (canReorder) {
                const cards =
                    timelineRef.current?.querySelectorAll<HTMLElement>(
                        "[data-place-id]",
                    ) ?? [];
                previousCardPositionsRef.current = new Map(
                    Array.from(cards).flatMap((card) => {
                        const placeId = card.dataset.placeId;

                        return placeId
                            ? [[placeId, card.getBoundingClientRect()]]
                            : [];
                    }),
                );
            }

            pointerDragRef.current = null;
            if (pointerDrag.activationTimer !== null) {
                window.clearTimeout(pointerDrag.activationTimer);
            }
            if (pointerDrag.touchMoveListener) {
                document.removeEventListener(
                    "touchmove",
                    pointerDrag.touchMoveListener,
                );
            }
            if (pointerDrag.touchEndListener) {
                document.removeEventListener(
                    "touchend",
                    pointerDrag.touchEndListener,
                );
            }
            if (pointerDrag.touchCancelListener) {
                document.removeEventListener(
                    "touchcancel",
                    pointerDrag.touchCancelListener,
                );
            }
            delete pointerDrag.sourceElement.dataset.dragging;
            pointerDrag.sourceElement.style.removeProperty("--drag-x");
            pointerDrag.sourceElement.style.removeProperty("--drag-y");
            if (pointerDrag.targetElement) {
                delete pointerDrag.targetElement.dataset.dropTarget;
            }

            if (
                pointerDrag.sourceElement.hasPointerCapture?.(
                    pointerDrag.pointerId,
                )
            ) {
                pointerDrag.sourceElement.releasePointerCapture(
                    pointerDrag.pointerId,
                );
            }

            if (canReorder && pointerDrag.targetId) {
                onReorder(pointerDrag.sourceId, pointerDrag.targetId);
            }
        },
        [onReorder],
    );

    useEffect(() => {
        const cancelPointerDrag = () => finishPointerDrag(false);

        window.addEventListener("blur", cancelPointerDrag);
        return () => {
            window.removeEventListener("blur", cancelPointerDrag);
            cancelPointerDrag();
        };
    }, [finishPointerDrag]);

    function handlePointerDown(
        event: ReactPointerEvent<HTMLElement>,
        placeId: string,
    ) {
        const target = event.target as HTMLElement;
        const place = places.find(({ id }) => id === placeId);
        const interactiveTarget = target.closest(
            "button, summary, input, textarea, select, a, label",
        );

        if (
            isBookmark ||
            !place ||
            isFixedTripPlace(place) ||
            pointerDragRef.current !== null ||
            !["mouse", "touch"].includes(event.pointerType) ||
            event.button !== 0 ||
            (interactiveTarget &&
                !interactiveTarget.matches("[data-place-focus]"))
        ) {
            return;
        }

        suppressPlaceSelectionRef.current = false;
        previousCardPositionsRef.current = null;
        settleAnimationsRef.current.forEach((animation) => animation.cancel());
        settleAnimationsRef.current = [];

        const pointerDrag: PointerDragState = {
            activationTimer: null,
            dragging: false,
            pointerId: event.pointerId,
            pointerType: event.pointerType,
            sourceElement: event.currentTarget,
            sourceId: placeId,
            startX: event.clientX,
            startY: event.clientY,
            targetElement: null,
            targetId: null,
            touchCancelListener: null,
            touchEndListener: null,
            touchMoveListener: null,
        };
        pointerDragRef.current = pointerDrag;

        if (event.pointerType === "mouse") {
            event.currentTarget.setPointerCapture?.(event.pointerId);
            return;
        }

        pointerDrag.touchMoveListener = (touchEvent) => {
            if (pointerDragRef.current !== pointerDrag) {
                return;
            }

            const touch = touchEvent.touches[0];

            if (!touch) {
                return;
            }

            if (!pointerDrag.dragging) {
                const distance = Math.hypot(
                    touch.clientX - pointerDrag.startX,
                    touch.clientY - pointerDrag.startY,
                );

                if (distance >= TOUCH_MOVE_TOLERANCE_PX) {
                    finishPointerDrag(false);
                }
                return;
            }

            touchEvent.preventDefault();
            updateDragPosition(pointerDrag, touch.clientX, touch.clientY);
            updateDropTarget(pointerDrag, touch.clientX, touch.clientY);
        };
        pointerDrag.touchEndListener = () => finishPointerDrag(true);
        pointerDrag.touchCancelListener = () => finishPointerDrag(false);
        document.addEventListener("touchmove", pointerDrag.touchMoveListener, {
            passive: false,
        });
        document.addEventListener("touchend", pointerDrag.touchEndListener);
        document.addEventListener(
            "touchcancel",
            pointerDrag.touchCancelListener,
        );

        pointerDrag.activationTimer = window.setTimeout(() => {
            const currentPointerDrag = pointerDragRef.current;

            if (
                currentPointerDrag !== pointerDrag ||
                currentPointerDrag.dragging
            ) {
                return;
            }

            currentPointerDrag.activationTimer = null;
            currentPointerDrag.dragging = true;
            suppressPlaceSelectionRef.current = true;
            currentPointerDrag.sourceElement.dataset.dragging = "true";
        }, LONG_PRESS_DELAY_MS);
    }

    function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
        const pointerDrag = pointerDragRef.current;

        if (!pointerDrag || pointerDrag.pointerId !== event.pointerId) {
            return;
        }

        if (!pointerDrag.dragging) {
            const distance = Math.hypot(
                event.clientX - pointerDrag.startX,
                event.clientY - pointerDrag.startY,
            );

            if (pointerDrag.pointerType === "touch") {
                return;
            }

            if (distance < DRAG_THRESHOLD_PX) {
                return;
            }

            pointerDrag.dragging = true;
            suppressPlaceSelectionRef.current = true;
            pointerDrag.sourceElement.dataset.dragging = "true";
        }

        event.preventDefault();
        updateDragPosition(pointerDrag, event.clientX, event.clientY);
        updateDropTarget(pointerDrag, event.clientX, event.clientY);
    }

    function handlePointerUp(event: ReactPointerEvent<HTMLElement>) {
        if (pointerDragRef.current?.pointerId !== event.pointerId) {
            return;
        }

        if (pointerDragRef.current.dragging) {
            event.preventDefault();
        }
        finishPointerDrag(true);
    }

    function handlePointerCancel(event: ReactPointerEvent<HTMLElement>) {
        if (pointerDragRef.current?.pointerId === event.pointerId) {
            finishPointerDrag(false);
        }
    }

    function handleContextMenu(event: MouseEvent<HTMLElement>) {
        if (pointerDragRef.current?.pointerType === "touch") {
            event.preventDefault();
        }
    }

    function handlePlaceSelect(
        event: MouseEvent<HTMLElement>,
        placeId: string,
    ) {
        const interactiveTarget = (event.target as HTMLElement).closest(
            "button:not([data-place-focus]), summary, input, textarea, select, a, label",
        );

        if (interactiveTarget) {
            return;
        }

        if (suppressPlaceSelectionRef.current) {
            suppressPlaceSelectionRef.current = false;
            event.preventDefault();
            return;
        }

        onPlaceSelect?.(placeId);
    }

    return {
        handleContextMenu,
        handlePlaceSelect,
        handlePointerCancel,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        timelineRef,
    };
}
