import { useId } from "react";

import { MAX_TRIP_COST_AMOUNT } from "../../../../places/model";
import type { TripMember } from "../../../../trips/store";
import styles from "./BudgetEditorDialog.module.css";
import {
    individualPayerValue,
    type ExpenseAllocationController,
} from "./useExpenseAllocation";

type ExpenseAllocationFieldsProps = {
    amount: string;
    amountInputId: string;
    amountLabel: string;
    controller: ExpenseAllocationController;
    currencyCode: string;
    members: readonly TripMember[];
};

export function ExpenseAllocationFields({
    amount,
    amountInputId,
    amountLabel,
    controller,
    currencyCode,
    members,
}: ExpenseAllocationFieldsProps) {
    const payerLabelId = useId();
    const { draft } = controller;
    const parsedAmount = Number(amount);
    const individualTotalMatches =
        controller.individualAmountsAreValid &&
        controller.individualTotal === parsedAmount;

    return (
        <>
            {members.length > 0 ? (
                <fieldset
                    className={styles.payerFieldset}
                    aria-labelledby={payerLabelId}
                >
                    <div className={styles.payerHeader}>
                        <span id={payerLabelId}>결제자</span>
                        <label
                            className={styles.individualPayerOption}
                            data-selected={
                                draft.payerSelection === individualPayerValue
                                    ? "true"
                                    : undefined
                            }
                        >
                            <input
                                type="radio"
                                name="budget-payer"
                                value={individualPayerValue}
                                checked={
                                    draft.payerSelection ===
                                    individualPayerValue
                                }
                                onChange={() =>
                                    controller.setPayerSelection(
                                        individualPayerValue,
                                    )
                                }
                            />
                            <span>각자 계산</span>
                        </label>
                    </div>
                    <div className={styles.payerOptions}>
                        {members.map((member) => (
                            <label
                                className={styles.payerOption}
                                data-selected={
                                    draft.payerSelection === member.id
                                        ? "true"
                                        : undefined
                                }
                                key={member.id}
                            >
                                <input
                                    type="radio"
                                    name="budget-payer"
                                    value={member.id}
                                    checked={draft.payerSelection === member.id}
                                    onChange={() =>
                                        controller.setPayerSelection(member.id)
                                    }
                                />
                                <span>{member.name}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
            ) : null}

            <label className={styles.splitToggle}>
                <input
                    type="checkbox"
                    checked={draft.isEqualSplit}
                    onChange={(event) =>
                        controller.setEqualSplit(event.target.checked, amount)
                    }
                />
                <span>N빵이에요</span>
            </label>

            {draft.isEqualSplit ? (
                <fieldset className={styles.memberFieldset}>
                    <legend>제외 인원</legend>
                    <div className={styles.memberOptions}>
                        {members.map((member) => {
                            const isExcluded = draft.excludedMemberIds.includes(
                                member.id,
                            );
                            const cannotExclude =
                                !isExcluded &&
                                controller.includedMemberCount === 1;

                            return (
                                <label
                                    className={styles.memberOption}
                                    data-excluded={
                                        isExcluded ? "true" : undefined
                                    }
                                    key={member.id}
                                >
                                    <input
                                        type="checkbox"
                                        aria-label={`${member.name} 제외`}
                                        checked={isExcluded}
                                        disabled={cannotExclude}
                                        onChange={(event) =>
                                            controller.setMemberExcluded(
                                                member.id,
                                                event.target.checked,
                                            )
                                        }
                                    />
                                    <span>{member.name}</span>
                                    <small>
                                        {isExcluded ? "제외" : "포함"}
                                    </small>
                                </label>
                            );
                        })}
                    </div>
                </fieldset>
            ) : (
                <fieldset className={styles.memberFieldset}>
                    <legend>개인별 금액</legend>
                    <div className={styles.memberAmounts}>
                        {members.map((member) => {
                            const memberAmountId = `${amountInputId}-${member.id}`;

                            return (
                                <label
                                    className={styles.memberAmount}
                                    htmlFor={memberAmountId}
                                    key={member.id}
                                >
                                    <span>{member.name}</span>
                                    <span className={styles.amountInput}>
                                        <input
                                            id={memberAmountId}
                                            aria-label={`${member.name} 금액`}
                                            type="number"
                                            min="0"
                                            max={MAX_TRIP_COST_AMOUNT}
                                            step="1"
                                            required
                                            inputMode="numeric"
                                            placeholder="0"
                                            value={
                                                draft.memberAmounts[
                                                    member.id
                                                ] ?? ""
                                            }
                                            onChange={(event) =>
                                                controller.setMemberAmount(
                                                    member.id,
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <span>{currencyCode}</span>
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                    <p
                        className={styles.splitSummary}
                        data-invalid={
                            amount !== "" && !individualTotalMatches
                                ? "true"
                                : undefined
                        }
                        role={
                            amount !== "" && !individualTotalMatches
                                ? "alert"
                                : undefined
                        }
                    >
                        합계{" "}
                        {controller.individualTotal.toLocaleString("ko-KR")} /{" "}
                        {amountLabel}{" "}
                        {amount === ""
                            ? "0"
                            : parsedAmount.toLocaleString("ko-KR")}{" "}
                        {currencyCode}
                        {amount !== "" && !individualTotalMatches
                            ? " · 금액이 일치하지 않습니다."
                            : ""}
                    </p>
                </fieldset>
            )}
        </>
    );
}
