import { X } from "lucide-react";
import { useId, useState } from "react";
import type { FormEvent } from "react";

import type { TripPlace } from "../../../../places/model";
import type {
    ScheduleDay,
    TripPlaceDetailsPatch,
} from "../../../../places/schedule";
import styles from "../TripEditorDialog.module.css";
import { useTripDialog } from "../useTripDialog";

export type PlaceMenuAction = "arrival" | "memo" | "move" | "delete";

const dialogLabels: Record<PlaceMenuAction, { submit: string; title: string }> =
    {
        arrival: { title: "도착시간 수정", submit: "저장" },
        memo: { title: "메모 수정", submit: "저장" },
        move: { title: "일정 이동", submit: "이동" },
        delete: { title: "일정 삭제", submit: "삭제" },
    };

type PlaceActionDialogProps = {
    action: PlaceMenuAction;
    dayCount: number;
    onClose: () => void;
    onDelete: (placeId: string) => void;
    onMove: (placeId: string, day: ScheduleDay) => void;
    onUpdate: (placeId: string, patch: TripPlaceDetailsPatch) => void;
    place: TripPlace;
};

export function PlaceActionDialog({
    action,
    dayCount,
    onClose,
    onDelete,
    onMove,
    onUpdate,
    place,
}: PlaceActionDialogProps) {
    const dialogRef = useTripDialog();
    const titleId = useId();
    const arrivalId = useId();
    const memoId = useId();
    const availableDays: ScheduleDay[] = [
        ...Array.from({ length: dayCount }, (_, index) => index + 1),
        "bookmark" as const,
    ].filter((day) => day !== place.day);
    const [arrivalTime, setArrivalTime] = useState(place.arrivalTime ?? "");
    const [memo, setMemo] = useState(place.memo ?? "");
    const [targetDay, setTargetDay] = useState<ScheduleDay>(
        availableDays[0] ?? "bookmark",
    );
    const labels = dialogLabels[action];

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (action === "arrival") {
            onUpdate(place.id, { arrivalTime });
        } else if (action === "memo") {
            onUpdate(place.id, { memo: memo.trim() || null });
        } else if (action === "move") {
            onMove(place.id, targetDay);
        } else {
            onDelete(place.id);
        }
        onClose();
    }

    return (
        <dialog
            className={styles.dialog}
            ref={dialogRef}
            aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
        >
            <form className={styles.form} onSubmit={handleSubmit}>
                <header className={styles.header}>
                    <div>
                        <h2 id={titleId}>{labels.title}</h2>
                        <p>{place.name}</p>
                    </div>
                    <button
                        className={styles.closeButton}
                        type="button"
                        aria-label="닫기"
                        onClick={onClose}
                    >
                        <X aria-hidden="true" />
                    </button>
                </header>

                {action === "arrival" ? (
                    <div className={styles.field}>
                        <label htmlFor={arrivalId}>도착시간</label>
                        <input
                            id={arrivalId}
                            data-autofocus
                            type="time"
                            required
                            value={arrivalTime}
                            onChange={(event) =>
                                setArrivalTime(event.target.value)
                            }
                        />
                    </div>
                ) : null}

                {action === "memo" ? (
                    <div className={styles.field}>
                        <label htmlFor={memoId}>메모</label>
                        <textarea
                            id={memoId}
                            data-autofocus
                            maxLength={500}
                            rows={5}
                            placeholder="메모 없음"
                            value={memo}
                            onChange={(event) => setMemo(event.target.value)}
                        />
                    </div>
                ) : null}

                {action === "move" ? (
                    <fieldset className={styles.dayFieldset}>
                        <legend>이동할 날짜</legend>
                        <div className={styles.dayOptions}>
                            {availableDays.map((day, index) => (
                                <label
                                    className={`${styles.dayOption} ${targetDay === day ? styles.selectedDay : ""}`}
                                    key={day}
                                >
                                    <input
                                        data-autofocus={
                                            index === 0 ? "" : undefined
                                        }
                                        type="radio"
                                        name="target-day"
                                        value={day}
                                        checked={targetDay === day}
                                        onChange={() => setTargetDay(day)}
                                    />
                                    <span>
                                        {day === "bookmark"
                                            ? "북마크"
                                            : `${day}일차`}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                ) : null}

                {action === "delete" ? (
                    <p className={styles.confirmText}>
                        이 장소를 일정에서 삭제할까요? 삭제한 일정은 되돌릴 수
                        없습니다.
                    </p>
                ) : null}

                <footer className={styles.actions}>
                    <button
                        type="button"
                        data-autofocus={action === "delete" ? "" : undefined}
                        onClick={onClose}
                    >
                        취소
                    </button>
                    <button
                        className={
                            action === "delete"
                                ? styles.dangerButton
                                : styles.saveButton
                        }
                        type="submit"
                    >
                        {labels.submit}
                    </button>
                </footer>
            </form>
        </dialog>
    );
}
