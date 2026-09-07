import { X } from "lucide-react";
import { useId, useState } from "react";
import type { FormEvent } from "react";

import type {
    InboundMode,
    TripInbound,
    TripPlace,
} from "../../../../places/model";
import { useTripDialog } from "../useTripDialog";
import styles from "../TripEditorDialog.module.css";
import { MovementModeSelect } from "./MovementModeSelect";

type MovementEditorDialogProps = {
    onClose: () => void;
    onSave: (inbound: TripInbound) => void;
    place: TripPlace;
};

export function MovementEditorDialog({
    onClose,
    onSave,
    place,
}: MovementEditorDialogProps) {
    const dialogRef = useTripDialog("[role='combobox']");
    const titleId = useId();
    const modeLabelId = useId();
    const durationId = useId();
    const [mode, setMode] = useState<InboundMode>(place.inbound.mode ?? "walk");
    const [duration, setDuration] = useState(
        place.inbound.durationMin?.toString() ?? "",
    );

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (mode === "walk") {
            onSave({
                mode,
                durationMin: Number(duration),
                cost: null,
                isPassCovered: false,
            });
            return;
        }

        onSave({
            ...place.inbound,
            mode,
            durationMin: Number(duration),
        });
    }

    function handleModeChange(nextMode: InboundMode) {
        setMode(nextMode);
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
                        <h2 id={titleId}>이동방법 수정</h2>
                        <p>{place.name}까지 이동</p>
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

                <div className={styles.field}>
                    <span id={modeLabelId}>이동방법</span>
                    <MovementModeSelect
                        labelId={modeLabelId}
                        value={mode}
                        onChange={handleModeChange}
                    />
                </div>

                <div className={styles.field}>
                    <label htmlFor={durationId}>예상 소요시간</label>
                    <span className={styles.inputWithUnit}>
                        <input
                            id={durationId}
                            type="number"
                            min="1"
                            max="1440"
                            required
                            inputMode="numeric"
                            value={duration}
                            onChange={(event) =>
                                setDuration(event.target.value)
                            }
                        />
                        <span>분</span>
                    </span>
                </div>
                <p className={styles.helper}>
                    경로 데이터가 없어 현재는 직접 입력해 주세요.
                </p>

                <footer className={styles.actions}>
                    <button type="button" onClick={onClose}>
                        취소
                    </button>
                    <button className={styles.saveButton} type="submit">
                        저장
                    </button>
                </footer>
            </form>
        </dialog>
    );
}
