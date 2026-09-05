import {
    CalendarSync,
    Clock3,
    EllipsisVertical,
    Pencil,
    StickyNote,
    Trash2,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import type { MouseEvent, PointerEvent as ReactPointerEvent } from "react";

import type { TripInbound, TripPlace } from "../../../../places/mock";
import type {
    ScheduleDay,
    TripPlaceDetailsPatch,
} from "../../../../places/schedule";
import { MovementEditorDialog } from "./MovementEditorDialog";
import { getMovementModeOption } from "./movement-modes";
import { PlaceActionDialog, type PlaceMenuAction } from "./PlaceActionDialog";
import type { TripDayKey } from "./TripDayBadges";
import styles from "./TripPlaceTimeline.module.css";

function formatMoney(amount: number, currency: string) {
    return `${new Intl.NumberFormat("ko-KR").format(amount)} ${currency}`;
}

function MovementSegment({
    onEdit,
    place,
}: {
    onEdit: () => void;
    place: TripPlace;
}) {
    const mode = place.inbound.mode;
    const modeOption = getMovementModeOption(mode);
    const ModeIcon = modeOption.icon;
    const parts = [
        mode ? modeOption.label : null,
        place.inbound.durationMin ? `${place.inbound.durationMin}분` : null,
        place.inbound.isPassCovered
            ? "패스권"
            : mode !== "walk" && place.inbound.cost
              ? formatMoney(
                    place.inbound.cost.amount,
                    place.inbound.cost.currency,
                )
              : null,
    ].filter(Boolean);
    const description = parts.join(" · ");

    return (
        <div
            className={styles.segment}
            aria-label={`이동: ${parts.join(", ")}`}
        >
            <span aria-hidden="true" />
            <div className={styles.segmentContent}>
                <ModeIcon aria-hidden="true" />
                <p>{description || "이동정보 없음"}</p>
            </div>
            <button
                className={styles.segmentEdit}
                type="button"
                aria-label={`${place.name}까지 이동방법 수정`}
                title="이동방법 수정"
                onClick={onEdit}
            >
                <Pencil aria-hidden="true" />
            </button>
        </div>
    );
}

function PlaceCard({
    index,
    isBookmark,
    isSelected,
    onContextMenu,
    onMenuAction,
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onSelect,
    place,
}: {
    index: number;
    isBookmark: boolean;
    isSelected: boolean;
    onContextMenu: (event: MouseEvent<HTMLElement>) => void;
    onMenuAction: (
        event: MouseEvent<HTMLButtonElement>,
        action: PlaceMenuAction,
    ) => void;
    onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerDown: (
        event: ReactPointerEvent<HTMLElement>,
        placeId: string,
    ) => void;
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
    onSelect: (event: MouseEvent<HTMLElement>, placeId: string) => void;
    place: TripPlace;
}) {
    return (
        <article
            className={`${styles.card} ${isBookmark ? "" : styles.reorderableCard}`}
            data-place-id={place.id}
            data-selected={isSelected ? "true" : undefined}
            onClick={(event) => onSelect(event, place.id)}
            onContextMenu={onContextMenu}
            onLostPointerCapture={onPointerCancel}
            onPointerCancel={onPointerCancel}
            onPointerDown={(event) => onPointerDown(event, place.id)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
        >
            <header className={styles.cardHeader}>
                {isBookmark ? null : (
                    <span
                        className={styles.order}
                        aria-label={`${index + 1}번째 장소`}
                    >
                        {index + 1}
                    </span>
                )}
                <div className={styles.placeHeading}>
                    <h3>
                        <button
                            className={styles.placeHeadingButton}
                            type="button"
                            aria-label={`지도에서 ${place.name} 보기`}
                            aria-pressed={isSelected}
                            data-place-focus="true"
                        >
                            {place.name}
                        </button>
                    </h3>
                    <p className={styles.address}>{place.address}</p>
                </div>
                <div className={styles.cardTools}>
                    {place.arrivalTime ? (
                        <time dateTime={place.arrivalTime}>
                            {place.arrivalTime}
                        </time>
                    ) : null}
                    <details className={styles.menu}>
                        <summary
                            role="button"
                            aria-label={`${place.name} 일정 메뉴`}
                            aria-haspopup="menu"
                            title="일정 메뉴"
                        >
                            <EllipsisVertical aria-hidden="true" />
                        </summary>
                        <div className={styles.menuPanel}>
                            <button
                                type="button"
                                disabled={isBookmark}
                                onClick={(event) =>
                                    onMenuAction(event, "arrival")
                                }
                            >
                                <Clock3 aria-hidden="true" />
                                도착시간 수정
                            </button>
                            <button
                                type="button"
                                onClick={(event) => onMenuAction(event, "memo")}
                            >
                                <StickyNote aria-hidden="true" />
                                메모 수정
                            </button>
                            <button
                                type="button"
                                onClick={(event) => onMenuAction(event, "move")}
                            >
                                <CalendarSync aria-hidden="true" />
                                일정 이동
                            </button>
                            <button
                                className={styles.dangerMenuItem}
                                type="button"
                                onClick={(event) =>
                                    onMenuAction(event, "delete")
                                }
                            >
                                <Trash2 aria-hidden="true" />
                                일정 삭제
                            </button>
                        </div>
                    </details>
                </div>
            </header>

            {place.memo ? <p className={styles.memo}>{place.memo}</p> : null}
        </article>
    );
}

type TripPlaceTimelineProps = {
    activeDay: TripDayKey;
    dayCount: number;
    onDeletePlace: (placeId: string) => void;
    onMovePlace: (placeId: string, day: ScheduleDay) => void;
    onPlaceSelect?: (placeId: string) => void;
    onReorder: (sourceId: string, targetId: string) => void;
    onUpdateInbound: (placeId: string, inbound: TripInbound) => void;
    onUpdatePlace: (placeId: string, patch: TripPlaceDetailsPatch) => void;
    places: TripPlace[];
    selectedPlaceId?: string | null;
};

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
        if (card === source) {
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

export function TripPlaceTimeline({
    activeDay,
    dayCount,
    onDeletePlace,
    onMovePlace,
    onPlaceSelect,
    onReorder,
    onUpdateInbound,
    onUpdatePlace,
    places,
    selectedPlaceId = null,
}: TripPlaceTimelineProps) {
    const isBookmark = activeDay === "bookmark";
    const timelineRef = useRef<HTMLElement | null>(null);
    const pointerDragRef = useRef<PointerDragState | null>(null);
    const suppressPlaceSelectionRef = useRef(false);
    const previousCardPositionsRef = useRef<Map<string, DOMRect> | null>(null);
    const settleAnimationsRef = useRef<Animation[]>([]);
    const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
    const [placeAction, setPlaceAction] = useState<{
        action: PlaceMenuAction;
        placeId: string;
    } | null>(null);
    const editingPlace = places.find((place) => place.id === editingPlaceId);
    const actionPlace = places.find(
        (place) => place.id === placeAction?.placeId,
    );

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
        const interactiveTarget = target.closest(
            "button, summary, input, textarea, select, a, label",
        );

        if (
            isBookmark ||
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

    function handleMenuAction(
        event: MouseEvent<HTMLButtonElement>,
        placeId: string,
        action: PlaceMenuAction,
    ) {
        const menu = event.currentTarget.closest("details");
        menu?.removeAttribute("open");
        menu?.querySelector<HTMLElement>("summary")?.focus();
        setPlaceAction({ action, placeId });
    }
    return (
        <>
            <section
                ref={timelineRef}
                className={styles.timeline}
                aria-label={
                    isBookmark ? "북마크 장소" : `${activeDay}일차 장소`
                }
            >
                {places.length === 0 ? (
                    <p className={styles.empty}>등록된 장소가 없습니다.</p>
                ) : (
                    <ol
                        className={`${styles.list} ${isBookmark ? styles.bookmarkList : ""}`}
                    >
                        {places.map((place, index) => (
                            <li key={place.id}>
                                {index > 0 && !isBookmark ? (
                                    <MovementSegment
                                        place={place}
                                        onEdit={() =>
                                            setEditingPlaceId(place.id)
                                        }
                                    />
                                ) : null}
                                <PlaceCard
                                    index={index}
                                    isBookmark={isBookmark}
                                    isSelected={selectedPlaceId === place.id}
                                    onContextMenu={handleContextMenu}
                                    onMenuAction={(event, action) =>
                                        handleMenuAction(
                                            event,
                                            place.id,
                                            action,
                                        )
                                    }
                                    onPointerCancel={handlePointerCancel}
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onSelect={handlePlaceSelect}
                                    place={place}
                                />
                            </li>
                        ))}
                    </ol>
                )}
            </section>

            {editingPlace ? (
                <MovementEditorDialog
                    key={editingPlace.id}
                    place={editingPlace}
                    onClose={() => setEditingPlaceId(null)}
                    onSave={(inbound) => {
                        onUpdateInbound(editingPlace.id, inbound);
                        setEditingPlaceId(null);
                    }}
                />
            ) : null}

            {placeAction && actionPlace ? (
                <PlaceActionDialog
                    key={`${placeAction.action}-${actionPlace.id}`}
                    action={placeAction.action}
                    dayCount={dayCount}
                    place={actionPlace}
                    onClose={() => setPlaceAction(null)}
                    onDelete={onDeletePlace}
                    onMove={onMovePlace}
                    onUpdate={onUpdatePlace}
                />
            ) : null}
        </>
    );
}
