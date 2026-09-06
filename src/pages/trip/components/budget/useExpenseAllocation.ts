import { useState } from "react";

import {
    isValidTripCostAmount,
    type TripCostPaymentMode,
    type TripCostSplit,
} from "../../../../places/model";
import type { TripMember } from "../../../../trips/store";

type ExpenseAllocationSource = {
    paymentMode?: TripCostPaymentMode;
    payerId?: string;
    split?: TripCostSplit;
};

type ExpenseAllocation = {
    paymentMode?: TripCostPaymentMode;
    payerId?: string;
    split: TripCostSplit;
};

type ExpenseAllocationDraft = {
    excludedMemberIds: string[];
    isEqualSplit: boolean;
    memberAmounts: Record<string, string>;
    payerSelection: string;
};

export const individualPayerValue = "__individual_payment__";

function createEqualMemberAmountInputs(
    members: readonly TripMember[],
    excludedMemberIds: readonly string[],
    amount: string,
) {
    const parsedAmount = Number(amount);

    if (amount === "" || !isValidTripCostAmount(parsedAmount)) {
        return Object.fromEntries(members.map((member) => [member.id, ""]));
    }

    const includedMembers = members.filter(
        (member) => !excludedMemberIds.includes(member.id),
    );
    const splitMembers = includedMembers.length > 0 ? includedMembers : members;

    if (splitMembers.length === 0) {
        return {};
    }

    const baseAmount = Math.floor(parsedAmount / splitMembers.length);
    const remainder = parsedAmount % splitMembers.length;
    const splitIndexes = new Map(
        splitMembers.map((member, index) => [member.id, index]),
    );

    return Object.fromEntries(
        members.map((member) => {
            const splitIndex = splitIndexes.get(member.id);
            const memberAmount =
                splitIndex === undefined
                    ? 0
                    : baseAmount + (splitIndex < remainder ? 1 : 0);

            return [member.id, String(memberAmount)];
        }),
    );
}

function createInitialDraft(
    members: readonly TripMember[],
    expense?: ExpenseAllocationSource | null,
): ExpenseAllocationDraft {
    const knownMemberIds = new Set(members.map((member) => member.id));
    const initialSplit = expense?.split;
    const payerSelection =
        expense?.paymentMode === "individual"
            ? individualPayerValue
            : expense?.payerId && knownMemberIds.has(expense.payerId)
              ? expense.payerId
              : (members[0]?.id ?? "");

    return {
        excludedMemberIds:
            initialSplit?.mode === "equal"
                ? initialSplit.excludedMemberIds.filter((memberId) =>
                      knownMemberIds.has(memberId),
                  )
                : [],
        isEqualSplit: initialSplit?.mode !== "individual",
        memberAmounts: Object.fromEntries(
            members.map((member) => [
                member.id,
                initialSplit?.mode === "individual"
                    ? String(initialSplit.memberAmounts[member.id] ?? "")
                    : "",
            ]),
        ),
        payerSelection,
    };
}

export function useExpenseAllocation(
    members: readonly TripMember[],
    expense?: ExpenseAllocationSource | null,
) {
    const [draft, setDraft] = useState(() =>
        createInitialDraft(members, expense),
    );
    const includedMemberCount = members.filter(
        (member) => !draft.excludedMemberIds.includes(member.id),
    ).length;
    const individualAmountsAreValid = members.every((member) => {
        const value = draft.memberAmounts[member.id];

        return value !== "" && isValidTripCostAmount(Number(value));
    });
    const individualTotal = members.reduce(
        (total, member) =>
            total + (Number(draft.memberAmounts[member.id]) || 0),
        0,
    );

    function getAllocation(amount: number): ExpenseAllocation | null {
        if (
            (draft.isEqualSplit && includedMemberCount === 0) ||
            (!draft.isEqualSplit &&
                (!individualAmountsAreValid || individualTotal !== amount))
        ) {
            return null;
        }

        const split: TripCostSplit = draft.isEqualSplit
            ? {
                  mode: "equal",
                  excludedMemberIds: draft.excludedMemberIds,
              }
            : {
                  mode: "individual",
                  memberAmounts: Object.fromEntries(
                      members.map((member) => [
                          member.id,
                          Number(draft.memberAmounts[member.id]),
                      ]),
                  ),
              };

        return {
            ...(draft.payerSelection === individualPayerValue
                ? { paymentMode: "individual" as const }
                : draft.payerSelection
                  ? { payerId: draft.payerSelection }
                  : {}),
            split,
        };
    }

    function setEqualSplit(isEqualSplit: boolean, amount: string) {
        setDraft((current) => ({
            ...current,
            isEqualSplit,
            memberAmounts: isEqualSplit
                ? current.memberAmounts
                : createEqualMemberAmountInputs(
                      members,
                      current.excludedMemberIds,
                      amount,
                  ),
        }));
    }

    function setMemberExcluded(memberId: string, isExcluded: boolean) {
        setDraft((current) => ({
            ...current,
            excludedMemberIds: isExcluded
                ? [...current.excludedMemberIds, memberId]
                : current.excludedMemberIds.filter(
                      (candidateId) => candidateId !== memberId,
                  ),
        }));
    }

    function setMemberAmount(memberId: string, amount: string) {
        setDraft((current) => ({
            ...current,
            memberAmounts: {
                ...current.memberAmounts,
                [memberId]: amount,
            },
        }));
    }

    function setPayerSelection(payerSelection: string) {
        setDraft((current) => ({ ...current, payerSelection }));
    }

    return {
        draft,
        getAllocation,
        includedMemberCount,
        individualTotal,
        individualAmountsAreValid,
        setEqualSplit,
        setMemberAmount,
        setMemberExcluded,
        setPayerSelection,
    };
}

export type ExpenseAllocationController = ReturnType<
    typeof useExpenseAllocation
>;
