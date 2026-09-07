import { X } from "lucide-react";
import { useId, useState, type FormEvent } from "react";

import type { PlaceSearchResult } from "../../../../places/search";
import type { ScheduleDay } from "../../../../places/schedule";
import dialogStyles from "../TripEditorDialog.module.css";
import { useTripDialog } from "../useTripDialog";
import styles from "./SearchPlaceDayDialog.module.css";

type SearchPlaceDayDialogProps = {
    dayCount: number;
    defaultDay: ScheduleDay;
    onClose: () => void;
    onConfirm: (day: ScheduleDay) => void;
    place: PlaceSearchResult;
};

export function SearchPlaceDayDialog({
    dayCount,
    defaultDay,
    onClose,
    onConfirm,
    place,
}: SearchPlaceDayDialogProps) {
    const dialogRef = useTripDialog();
    const titleId = useId();
    const days: ScheduleDay[] = [
        ...Array.from({ length: dayCount }, (_, index) => index + 1),
        "bookmark",
    ];
    const [targetDay, setTargetDay] = useState<ScheduleDay>(
        days.includes(defaultDay) ? defaultDay : 1,
    );

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onConfirm(targetDay);
    }

    return (
        <dialog
            className={dialogStyles.dialog}
            ref={dialogRef}
            aria-labelledby={titleId}
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
        >
            <form className={dialogStyles.form} onSubmit={handleSubmit}>
                <header className={dialogStyles.header}>
                    <div>
                        <h2 id={titleId}>일정에 추가</h2>
                        <p>{place.name}</p>
                    </div>
                    <button
                        className={dialogStyles.closeButton}
                        type="button"
                        aria-label="닫기"
                        onClick={onClose}
                    >
                        <X aria-hidden="true" />
                    </button>
                </header>

                <fieldset className={styles.fieldset}>
                    <legend>추가할 날짜</legend>
                    <div className={styles.options}>
                        {days.map((day) => (
                            <label className={styles.option} key={day}>
                                <input
                                    data-autofocus={
                                        targetDay === day ? "" : undefined
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

                <footer className={styles.actions}>
                    <button type="button" onClick={onClose}>
                        취소
                    </button>
                    <button className={styles.addButton} type="submit">
                        추가
                    </button>
                </footer>
            </form>
        </dialog>
    );
}
