import type {
    TripCostPaymentMode,
    TripCostSplit,
    TripPlace,
} from "../../../../places/model";

export type BudgetSummary = {
    food: number;
    other: number;
    tourism: number;
    transport: number;
    used: number;
};

export type MemberSettlement = {
    amount: number;
    memberId: string;
};

export type SettlementTransfer = {
    amount: number;
    fromMemberId: string;
    toMemberId: string;
};

type SettlementMember = {
    id: string;
};

type ExpenseCategory = Exclude<keyof BudgetSummary, "used">;

type TripExpense = {
    amount: number;
    category: ExpenseCategory;
    paymentMode?: TripCostPaymentMode;
    payerId?: string;
    split?: TripCostSplit;
};

function getAmount(amount: number) {
    return Number.isSafeInteger(amount) && amount > 0 ? amount : 0;
}

export function getPlaceCostAmount(place: TripPlace, currencyCode: string) {
    return place.placeCost.currency === currencyCode
        ? getAmount(place.placeCost.amount)
        : 0;
}

export function getInboundCostAmount(place: TripPlace, currencyCode: string) {
    const inboundCost = place.inbound.cost;

    return place.inbound.mode !== "walk" &&
        !place.inbound.isPassCovered &&
        inboundCost?.currency === currencyCode
        ? getAmount(inboundCost.amount)
        : 0;
}

function getTripExpenses(places: readonly TripPlace[], currencyCode: string) {
    const expenses: TripExpense[] = [];

    for (const place of places) {
        if (place.day === "bookmark") {
            continue;
        }

        const placeAmount = getPlaceCostAmount(place, currencyCode);
        if (placeAmount > 0) {
            expenses.push({
                amount: placeAmount,
                category: place.placeCost.category ?? "other",
                paymentMode: place.placeCost.paymentMode,
                payerId: place.placeCost.payerId,
                split: place.placeCost.split,
            });
        }

        const inboundAmount = getInboundCostAmount(place, currencyCode);
        if (inboundAmount > 0) {
            expenses.push({
                amount: inboundAmount,
                category: "transport",
                paymentMode: place.inbound.paymentMode,
                payerId: place.inbound.payerId,
                split: place.inbound.split,
            });
        }
    }

    return expenses;
}

function addEqualShares(
    totals: Map<string, number>,
    memberIds: readonly string[],
    amount: number,
) {
    if (memberIds.length === 0 || amount === 0) {
        return;
    }

    const baseShare = Math.floor(amount / memberIds.length);
    const remainder = amount % memberIds.length;

    memberIds.forEach((memberId, index) => {
        totals.set(
            memberId,
            (totals.get(memberId) ?? 0) +
                baseShare +
                (index < remainder ? 1 : 0),
        );
    });
}

function getIndividualAmounts(
    memberIds: readonly string[],
    amount: number,
    split?: TripCostSplit,
) {
    if (split?.mode !== "individual") {
        return null;
    }

    const amounts = memberIds.map((memberId) => {
        const memberAmount = split.memberAmounts[memberId];

        return Number.isSafeInteger(memberAmount) && memberAmount >= 0
            ? memberAmount
            : null;
    });
    const assignedTotal = amounts.reduce<number>(
        (total, memberAmount) => total + (memberAmount ?? 0),
        0,
    );

    return amounts.every(
        (memberAmount): memberAmount is number => memberAmount !== null,
    ) && assignedTotal === amount
        ? amounts
        : null;
}

function addSplitShares(
    totals: Map<string, number>,
    memberIds: readonly string[],
    amount: number,
    split?: TripCostSplit,
) {
    const individualAmounts = getIndividualAmounts(memberIds, amount, split);

    if (individualAmounts) {
        memberIds.forEach((memberId, index) => {
            totals.set(
                memberId,
                (totals.get(memberId) ?? 0) + individualAmounts[index],
            );
        });
        return;
    }

    const includedMemberIds =
        split?.mode === "equal"
            ? memberIds.filter(
                  (memberId) => !split.excludedMemberIds.includes(memberId),
              )
            : memberIds;

    addEqualShares(
        totals,
        includedMemberIds.length > 0 ? includedMemberIds : memberIds,
        amount,
    );
}

function addPayments(
    totals: Map<string, number>,
    memberIds: readonly string[],
    amount: number,
    paymentMode: TripCostPaymentMode | undefined,
    payerId: string | undefined,
    split: TripCostSplit | undefined,
    defaultPayerId: string,
) {
    if (paymentMode === "individual") {
        const directPayments = new Map(
            memberIds.map((memberId) => [memberId, 0]),
        );
        addSplitShares(directPayments, memberIds, amount, split);
        memberIds.forEach((memberId) => {
            totals.set(
                memberId,
                (totals.get(memberId) ?? 0) +
                    (directPayments.get(memberId) ?? 0),
            );
        });
        return;
    }

    const resolvedPayerId = totals.has(payerId ?? "")
        ? (payerId ?? defaultPayerId)
        : defaultPayerId;

    totals.set(resolvedPayerId, (totals.get(resolvedPayerId) ?? 0) + amount);
}

export function getBudgetSummary(
    places: readonly TripPlace[],
    currencyCode: string,
): BudgetSummary {
    const summary: BudgetSummary = {
        food: 0,
        other: 0,
        tourism: 0,
        transport: 0,
        used: 0,
    };

    for (const expense of getTripExpenses(places, currencyCode)) {
        summary[expense.category] += expense.amount;
    }

    summary.used =
        summary.transport + summary.food + summary.tourism + summary.other;

    return summary;
}

function getMemberSettlementsFromExpenses(
    expenses: readonly TripExpense[],
    memberIds: readonly string[],
) {
    const totals = new Map(memberIds.map((memberId) => [memberId, 0]));

    for (const expense of expenses) {
        addSplitShares(totals, memberIds, expense.amount, expense.split);
    }

    return memberIds.map((memberId) => ({
        memberId,
        amount: totals.get(memberId) ?? 0,
    }));
}

export function getMemberSettlements(
    places: readonly TripPlace[],
    members: readonly SettlementMember[],
    currencyCode: string,
): MemberSettlement[] {
    const memberIds = members.map((member) => member.id);

    return getMemberSettlementsFromExpenses(
        getTripExpenses(places, currencyCode),
        memberIds,
    );
}

export function getSettlementTransfers(
    places: readonly TripPlace[],
    members: readonly SettlementMember[],
    currencyCode: string,
): SettlementTransfer[] {
    const memberIds = members.map((member) => member.id);
    const defaultPayerId = memberIds[0];

    if (!defaultPayerId) {
        return [];
    }

    const expenses = getTripExpenses(places, currencyCode);
    const paidTotals = new Map(memberIds.map((memberId) => [memberId, 0]));

    for (const expense of expenses) {
        addPayments(
            paidTotals,
            memberIds,
            expense.amount,
            expense.paymentMode,
            expense.payerId,
            expense.split,
            defaultPayerId,
        );
    }

    const obligations = new Map(
        getMemberSettlementsFromExpenses(expenses, memberIds).map(
            (settlement) => [settlement.memberId, settlement.amount],
        ),
    );
    const creditors = memberIds
        .map((memberId) => ({
            memberId,
            amount:
                (paidTotals.get(memberId) ?? 0) -
                (obligations.get(memberId) ?? 0),
        }))
        .filter((balance) => balance.amount > 0);
    const debtors = memberIds
        .map((memberId) => ({
            memberId,
            amount:
                (obligations.get(memberId) ?? 0) -
                (paidTotals.get(memberId) ?? 0),
        }))
        .filter((balance) => balance.amount > 0);
    const transfers: SettlementTransfer[] = [];
    let creditorIndex = 0;
    let debtorIndex = 0;

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
        const creditor = creditors[creditorIndex];
        const debtor = debtors[debtorIndex];
        const amount = Math.min(creditor.amount, debtor.amount);

        transfers.push({
            amount,
            fromMemberId: debtor.memberId,
            toMemberId: creditor.memberId,
        });
        creditor.amount -= amount;
        debtor.amount -= amount;

        if (creditor.amount === 0) {
            creditorIndex += 1;
        }
        if (debtor.amount === 0) {
            debtorIndex += 1;
        }
    }

    return transfers;
}
