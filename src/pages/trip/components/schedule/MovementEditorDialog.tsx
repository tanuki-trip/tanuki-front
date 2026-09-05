import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";

import type {
    InboundMode,
    TripInbound,
    TripPlace,
} from "../../../../places/model";
import { MovementModeSelect } from "./MovementModeSelect";
import styles from "./MovementEditorDialog.module.css";

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
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const modeLabelId = useId();
    const durationId = useId();
    const costId = useId();
    const currencyCode =
        place.inbound.cost?.currency ?? place.placeCost.currency;
    const [mode, setMode] = useState<InboundMode>(place.inbound.mode ?? "walk");
    const [duration, setDuration] = useState(
        place.inbound.durationMin?.toString() ?? "",
    );
    const [cost, setCost] = useState(
        place.inbound.cost?.amount.toString() ?? "",
    );
    const [isPassCovered, setIsPassCovered] = useState(
        place.inbound.isPassCovered,
    );
    const hasNoSeparateCost = mode === "walk" || isPassCovered;

    useEffect(() => {
        const dialog = dialogRef.current;
        const previousFocus = document.activeElement as HTMLElement | null;

        if (!dialog) return;

        if (typeof dialog.showModal === "function") {
            dialog.showModal();
        } else {
            dialog.open = true;
        }
        dialog.querySelector<HTMLElement>("[role='combobox']")?.focus();

        return () => {
            if (dialog.open && typeof dialog.close === "function") {
                dialog.close();
            }
            previousFocus?.focus();
        };
    }, []);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        onSave({
            mode,
            durationMin: Number(duration),
            cost:
                hasNoSeparateCost || cost === ""
                    ? null
                    : { amount: Number(cost), currency: currencyCode },
            isPassCovered: mode === "walk" ? false : isPassCovered,
        });
    }

    function handleModeChange(nextMode: InboundMode) {
        setMode(nextMode);
        if (nextMode === "walk") {
            setCost("");
            setIsPassCovered(false);
        }
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

                <div className={styles.field}>
                    <label htmlFor={costId}>교통비 ({currencyCode})</label>
                    <input
                        id={costId}
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        placeholder={hasNoSeparateCost ? "별도 비용 없음" : "0"}
                        disabled={hasNoSeparateCost}
                        value={hasNoSeparateCost ? "" : cost}
                        onChange={(event) => setCost(event.target.value)}
                    />
                </div>

                <label className={styles.checkbox}>
                    <input
                        type="checkbox"
                        checked={isPassCovered}
                        disabled={mode === "walk"}
                        onChange={(event) => {
                            setIsPassCovered(event.target.checked);
                            if (event.target.checked) setCost("");
                        }}
                    />
                    <span>패스권이에요</span>
                </label>

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
