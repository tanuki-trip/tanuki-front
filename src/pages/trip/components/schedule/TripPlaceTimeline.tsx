import {
    CalendarSync,
    Clock3,
    EllipsisVertical,
    LockKeyhole,
    Pencil,
    StickyNote,
    Trash2,
} from "lucide-react";
import { useState } from "react";
import type { MouseEvent, PointerEvent as ReactPointerEvent } from "react";

import type { TripInbound, TripPlace } from "../../../../places/model";
import type {
    ScheduleDay,
    TripPlaceDetailsPatch,
} from "../../../../places/schedule";
import { MovementEditorDialog } from "./MovementEditorDialog";
import { getMovementModeOption } from "./movement-modes";
import { PlaceActionDialog, type PlaceMenuAction } from "./PlaceActionDialog";
import type { TripDayKey } from "./TripDayBadges";
import styles from "./TripPlaceTimeline.module.css";
import { useTimelineReorder } from "./useTimelineReorder";

const moneyFormatter = new Intl.NumberFormat("ko-KR");

function formatMoney(amount: number, currency: string) {
    return `${moneyFormatter.format(amount)} ${currency}`;
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
    const isFixed = place.fixedPosition !== null;

    return (
        <article
            className={`${styles.card} ${!isBookmark && !isFixed ? styles.reorderableCard : ""} ${isFixed ? styles.fixedCard : ""}`}
            data-fixed={isFixed ? "true" : undefined}
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
                    {isFixed ? (
                        <span className={styles.fixedLabel}>
                            <LockKeyhole aria-hidden="true" />
                            {place.fixedPosition === "first"
                                ? "첫 일정으로 고정"
                                : "마지막 일정으로 고정"}
                        </span>
                    ) : null}
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
                            {isFixed ? null : (
                                <>
                                    <button
                                        type="button"
                                        onClick={(event) =>
                                            onMenuAction(event, "move")
                                        }
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
                                </>
                            )}
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
    places: readonly TripPlace[];
    selectedPlaceId?: string | null;
};

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
    const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
    const [placeAction, setPlaceAction] = useState<{
        action: PlaceMenuAction;
        placeId: string;
    } | null>(null);
    const editingPlace = places.find((place) => place.id === editingPlaceId);
    const actionPlace = places.find(
        (place) => place.id === placeAction?.placeId,
    );
    const {
        handleContextMenu,
        handlePlaceSelect,
        handlePointerCancel,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        timelineRef,
    } = useTimelineReorder({
        isBookmark,
        onPlaceSelect,
        onReorder,
        places,
    });

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
