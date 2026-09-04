import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import type { Trip } from "../../../trips/store";
import styles from "./TripDialog.module.css";

export type TripDialogView = "edit" | "delete";

type TripDialogProps = {
    trip: Trip;
    view: TripDialogView;
    onClose: () => void;
    onSave: (name: string) => void;
    onDelete: () => void;
};

export function TripDialog({
    trip,
    view,
    onClose,
    onSave,
    onDelete,
}: TripDialogProps) {
    const [editName, setEditName] = useState(trip.name);
    const modalRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
                return;
            }

            if (event.key !== "Tab") {
                return;
            }

            const focusableElements = Array.from(
                modalRef.current?.querySelectorAll<HTMLElement>(
                    "button:not([disabled]), input:not([disabled])",
                ) ?? [],
            );
            const firstElement = focusableElements.at(0);
            const lastElement = focusableElements.at(-1);

            if (!firstElement || !lastElement) {
                return;
            }

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement === lastElement
            ) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [onClose]);

    const saveTripName = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedName = editName.trim();
        if (trimmedName) {
            onSave(trimmedName);
        }
    };

    return (
        <div
            className={styles.modalBackdrop}
            role="presentation"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    event.preventDefault();
                    onClose();
                }
            }}
        >
            <section
                className={styles.modal}
                ref={modalRef}
                role="dialog"
                aria-labelledby="trip-dialog-title"
                aria-modal="true"
            >
                <button
                    className={styles.closeButton}
                    type="button"
                    aria-label="닫기"
                    onClick={onClose}
                >
                    <X aria-hidden="true" />
                </button>

                {view === "edit" ? (
                    <form onSubmit={saveTripName}>
                        <h2
                            className={styles.modalTitle}
                            id="trip-dialog-title"
                        >
                            여행 이름 수정
                        </h2>
                        <label
                            className={styles.fieldLabel}
                            htmlFor="trip-name"
                        >
                            여행 이름
                        </label>
                        <input
                            className={styles.textInput}
                            id="trip-name"
                            value={editName}
                            autoFocus
                            required
                            onChange={(event) =>
                                setEditName(event.target.value)
                            }
                        />
                        <div className={styles.buttonRow}>
                            <button
                                className={styles.secondaryButton}
                                type="button"
                                onClick={onClose}
                            >
                                취소
                            </button>
                            <button
                                className={styles.primaryButton}
                                type="submit"
                                disabled={!editName.trim()}
                            >
                                저장
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <h2
                            className={styles.modalTitle}
                            id="trip-dialog-title"
                        >
                            여행을 삭제할까요?
                        </h2>
                        <p className={styles.modalDescription}>
                            ‘{trip.name}’을 목록에서 삭제합니다.
                        </p>
                        <div className={styles.buttonRow}>
                            <button
                                className={styles.secondaryButton}
                                type="button"
                                autoFocus
                                onClick={onClose}
                            >
                                취소
                            </button>
                            <button
                                className={styles.primaryButton}
                                type="button"
                                onClick={onDelete}
                            >
                                삭제
                            </button>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
