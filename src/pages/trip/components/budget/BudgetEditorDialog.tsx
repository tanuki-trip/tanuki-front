import {
    CircleEllipsis,
    Landmark,
    Utensils,
    X,
    type LucideIcon,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
    isValidTripCostAmount,
    MAX_TRIP_COST_AMOUNT,
    type TripCostCategory,
    type TripInbound,
    type TripPlace,
    type TripPlaceCost,
} from "../../../../places/model";
import type { TripMember } from "../../../../trips/store";
import dialogStyles from "../schedule/MovementEditorDialog.module.css";
import styles from "./BudgetEditorDialog.module.css";
import { ExpenseAllocationFields } from "./ExpenseAllocationFields";
import { useExpenseAllocation } from "./useExpenseAllocation";

type TotalBudgetEditorProps = {
    amount: number | null;
    mode: "total";
    onSave: (amount: number) => void;
};

type PlaceCostEditorProps = {
    members: readonly TripMember[];
    mode: "place";
    onSave: (cost: TripPlaceCost) => void;
    place: TripPlace;
};

type TransportCostEditorProps = {
    members: readonly TripMember[];
    mode: "transport";
    onSave: (inbound: TripInbound) => void;
    place: TripPlace;
};

type BudgetEditorDialogProps = {
    currencyCode: string;
    onClose: () => void;
} & (TotalBudgetEditorProps | PlaceCostEditorProps | TransportCostEditorProps);

const categoryOptions: Array<{
    icon: LucideIcon;
    label: string;
    value: TripCostCategory;
}> = [
    { value: "food", label: "식비", icon: Utensils },
    { value: "tourism", label: "관광비", icon: Landmark },
    { value: "other", label: "기타", icon: CircleEllipsis },
];

export function BudgetEditorDialog(props: BudgetEditorDialogProps) {
    const { currencyCode, onClose } = props;
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const amountId = useId();
    const isPlaceEditor = props.mode === "place";
    const isTransportEditor = props.mode === "transport";
    const isExpenseEditor = props.mode !== "total";
    const members = isExpenseEditor ? props.members : [];
    const expense = isPlaceEditor
        ? props.place.placeCost
        : isTransportEditor
          ? props.place.inbound
          : null;
    const initialAmount = isPlaceEditor
        ? props.place.placeCost.amount
        : isTransportEditor
          ? props.place.inbound.cost?.amount
          : props.amount;
    const [amount, setAmount] = useState(
        initialAmount == null || initialAmount === 0
            ? ""
            : String(initialAmount),
    );
    const [category, setCategory] = useState<TripCostCategory>(
        isPlaceEditor ? (props.place.placeCost.category ?? "other") : "other",
    );
    const [isPassCovered, setIsPassCovered] = useState(
        isTransportEditor ? props.place.inbound.isPassCovered : false,
    );
    const allocationController = useExpenseAllocation(members, expense);

    useEffect(() => {
        const dialog = dialogRef.current;
        const previousFocus = document.activeElement as HTMLElement | null;

        if (!dialog) return;

        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.open = true;
        dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();

        return () => {
            if (dialog.open && typeof dialog.close === "function") {
                dialog.close();
            }
            previousFocus?.focus();
        };
    }, []);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const nextAmount = Number(amount);
        if (!isValidTripCostAmount(nextAmount)) {
            return;
        }

        if (props.mode === "total") {
            props.onSave(nextAmount);
            return;
        }

        if (props.mode === "transport" && isPassCovered) {
            props.onSave({
                mode: props.place.inbound.mode,
                durationMin: props.place.inbound.durationMin,
                cost: null,
                isPassCovered: true,
            });
            return;
        }

        if (isExpenseEditor) {
            const allocation = allocationController.getAllocation(nextAmount);

            if (!allocation) {
                return;
            }

            if (props.mode === "place") {
                props.onSave({
                    amount: nextAmount,
                    currency: currencyCode,
                    category,
                    ...allocation,
                });
            } else {
                props.onSave({
                    mode: props.place.inbound.mode,
                    durationMin: props.place.inbound.durationMin,
                    cost: { amount: nextAmount, currency: currencyCode },
                    isPassCovered: false,
                    ...allocation,
                });
            }
        }
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
                        <h2 id={titleId}>
                            {isPlaceEditor
                                ? "일정 금액 수정"
                                : isTransportEditor
                                  ? "교통비 수정"
                                  : "총 예산 설정"}
                        </h2>
                        <p>
                            {props.mode === "total"
                                ? `${currencyCode} 기준`
                                : isTransportEditor
                                  ? `${props.place.name}까지 이동`
                                  : props.place.name}
                        </p>
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

                {isPlaceEditor ? (
                    <fieldset className={styles.categoryFieldset}>
                        <legend>분류</legend>
                        <div className={styles.categoryOptions}>
                            {categoryOptions.map((option) => {
                                const Icon = option.icon;

                                return (
                                    <label
                                        className={styles.categoryOption}
                                        data-selected={
                                            category === option.value
                                                ? "true"
                                                : undefined
                                        }
                                        key={option.value}
                                    >
                                        <input
                                            type="radio"
                                            name="budget-category"
                                            value={option.value}
                                            checked={category === option.value}
                                            onChange={() =>
                                                setCategory(option.value)
                                            }
                                        />
                                        <Icon aria-hidden="true" />
                                        <span>{option.label}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>
                ) : null}

                <div className={dialogStyles.field}>
                    <label htmlFor={amountId}>
                        {isPlaceEditor
                            ? "총 사용 금액"
                            : isTransportEditor
                              ? "교통비"
                              : "총 예산"}{" "}
                        ({currencyCode})
                    </label>
                    <input
                        id={amountId}
                        data-autofocus={
                            isTransportEditor && isPassCovered
                                ? undefined
                                : "true"
                        }
                        type="number"
                        min="0"
                        max={MAX_TRIP_COST_AMOUNT}
                        step="1"
                        required
                        disabled={isTransportEditor && isPassCovered}
                        inputMode="numeric"
                        placeholder="0"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                    />
                </div>

                {isTransportEditor ? (
                    <label className={dialogStyles.checkbox}>
                        <input
                            data-autofocus={isPassCovered ? "true" : undefined}
                            type="checkbox"
                            checked={isPassCovered}
                            onChange={(event) =>
                                setIsPassCovered(event.target.checked)
                            }
                        />
                        <span>패스권이에요</span>
                    </label>
                ) : null}

                {isExpenseEditor && !isPassCovered ? (
                    <ExpenseAllocationFields
                        amount={amount}
                        amountInputId={amountId}
                        amountLabel={
                            isTransportEditor ? "교통비" : "총 사용 금액"
                        }
                        controller={allocationController}
                        currencyCode={currencyCode}
                        members={members}
                    />
                ) : null}

                <footer className={dialogStyles.actions}>
                    <button type="button" onClick={onClose}>
                        취소
                    </button>
                    <button className={dialogStyles.saveButton} type="submit">
                        저장
                    </button>
                </footer>
            </form>
        </dialog>
    );
}
