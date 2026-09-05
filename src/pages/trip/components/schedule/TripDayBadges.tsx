import { useRef } from "react";
import type {
    MouseEvent as ReactMouseEvent,
    PointerEvent as ReactPointerEvent,
    WheelEvent,
} from "react";
import { Bookmark } from "lucide-react";

import { getTripDays } from "../../trip-days";
import styles from "./TripDayBadges.module.css";

export type TripDayKey = number | "bookmark";

type TripDayBadgesProps = {
    startDate: string;
    endDate: string;
    activeDay: TripDayKey;
    onDayChange: (day: TripDayKey) => void;
};

type PointerDrag = {
    pointerId: number;
    startScrollLeft: number;
    startX: number;
    dragged: boolean;
};

const dragThreshold = 4;

function handleWheel(event: WheelEvent<HTMLDivElement>) {
    const scroller = event.currentTarget;
    const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
            ? event.deltaX
            : event.deltaY;

    if (delta === 0) {
        return;
    }

    const maximumScrollLeft = scroller.scrollWidth - scroller.clientWidth;
    const canScroll =
        (delta < 0 && scroller.scrollLeft > 0) ||
        (delta > 0 && scroller.scrollLeft < maximumScrollLeft);

    if (!canScroll) {
        return;
    }

    scroller.scrollLeft = Math.min(
        Math.max(scroller.scrollLeft + delta, 0),
        maximumScrollLeft,
    );
    event.preventDefault();
}

export function TripDayBadges({
    startDate,
    endDate,
    activeDay,
    onDayChange,
}: TripDayBadgesProps) {
    const pointerDragRef = useRef<PointerDrag | null>(null);
    const suppressClickRef = useRef(false);
    const days = getTripDays(startDate, endDate);

    function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
        if (event.pointerType !== "mouse" || event.button !== 0) {
            return;
        }

        suppressClickRef.current = false;
        pointerDragRef.current = {
            pointerId: event.pointerId,
            startScrollLeft: event.currentTarget.scrollLeft,
            startX: event.clientX,
            dragged: false,
        };
    }

    function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
        const drag = pointerDragRef.current;

        if (!drag || drag.pointerId !== event.pointerId) {
            return;
        }

        const distance = event.clientX - drag.startX;

        if (!drag.dragged && Math.abs(distance) < dragThreshold) {
            return;
        }

        if (!drag.dragged) {
            drag.dragged = true;
            event.currentTarget.dataset.dragging = "true";
            event.currentTarget.setPointerCapture?.(event.pointerId);
        }

        event.currentTarget.scrollLeft = drag.startScrollLeft - distance;
        event.preventDefault();
    }

    function finishPointerDrag(event: ReactPointerEvent<HTMLDivElement>) {
        const drag = pointerDragRef.current;

        if (!drag || drag.pointerId !== event.pointerId) {
            return;
        }

        if (drag.dragged) {
            suppressClickRef.current = true;
        }

        delete event.currentTarget.dataset.dragging;
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        pointerDragRef.current = null;
    }

    function handleClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
        if (!suppressClickRef.current) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        suppressClickRef.current = false;
    }

    if (days.length === 0) {
        return (
            <p className={styles.invalid}>여행 날짜를 확인할 수 없습니다.</p>
        );
    }

    return (
        <div
            className={styles.scroller}
            onClickCapture={handleClickCapture}
            onPointerCancel={finishPointerDrag}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishPointerDrag}
            onWheel={handleWheel}
        >
            <div className={styles.badges} role="group" aria-label="일정 날짜">
                {days.map((day) => {
                    const isActive = activeDay === day.day;

                    return (
                        <button
                            className={`${styles.badge} ${isActive ? styles.activeBadge : ""}`}
                            key={day.date}
                            type="button"
                            draggable={false}
                            aria-label={day.accessibleLabel}
                            aria-pressed={isActive}
                            onClick={() => onDayChange(day.day)}
                        >
                            <strong>{day.day}일차</strong>
                            <time dateTime={day.date}>{day.dateLabel}</time>
                        </button>
                    );
                })}

                <button
                    className={`${styles.badge} ${activeDay === "bookmark" ? styles.activeBadge : ""}`}
                    type="button"
                    draggable={false}
                    aria-label="북마크, 날짜 미정"
                    aria-pressed={activeDay === "bookmark"}
                    onClick={() => onDayChange("bookmark")}
                >
                    <span className={styles.bookmarkLabel}>
                        <Bookmark aria-hidden="true" />
                        <strong>북마크</strong>
                    </span>
                    <span>날짜 미정</span>
                </button>
            </div>
        </div>
    );
}
