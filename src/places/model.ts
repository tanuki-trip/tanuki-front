export type InboundMode =
    "walk" | "car" | "bus" | "subway" | "train" | "bike" | "other";

export const MAX_TRIP_COST_AMOUNT = 999_999_999_999;

export function isValidTripCostAmount(amount: number) {
    return (
        Number.isSafeInteger(amount) &&
        amount >= 0 &&
        amount <= MAX_TRIP_COST_AMOUNT
    );
}

export type TripCostSplit =
    | {
          mode: "equal";
          excludedMemberIds: string[];
          includedMemberIds?: string[];
      }
    | {
          mode: "individual";
          memberAmounts: Record<string, number>;
      };

export type TripCostPaymentMode = "single" | "individual";

export type TripInbound = {
    mode: InboundMode | null;
    durationMin: number | null;
    cost: {
        amount: number;
        currency: string;
    } | null;
    isPassCovered: boolean;
    paymentMode?: TripCostPaymentMode;
    payerId?: string;
    split?: TripCostSplit;
};

export type FixedSchedulePosition = "first" | "last";
export type TripCostCategory = "food" | "tourism" | "other";

export type TripPlaceCost = {
    amount: number;
    currency: string;
    category?: TripCostCategory;
    paymentMode?: TripCostPaymentMode;
    payerId?: string;
    split?: TripCostSplit;
};

export type TripPlace = {
    id: string;
    name: string;
    address: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    day: number | "bookmark";
    order: number | null;
    arrivalTime: string | null;
    memo: string | null;
    placeCost: TripPlaceCost;
    inbound: TripInbound;
    fixedPosition: FixedSchedulePosition | null;
};

const fixedPositionRank: Record<FixedSchedulePosition, number> = {
    first: 0,
    last: 2,
};

export function createEmptyTripInbound(): TripInbound {
    return {
        mode: null,
        durationMin: null,
        cost: null,
        isPassCovered: false,
    };
}

export function compareTripPlaceOrder(left: TripPlace, right: TripPlace) {
    const leftRank = left.fixedPosition
        ? fixedPositionRank[left.fixedPosition]
        : 1;
    const rightRank = right.fixedPosition
        ? fixedPositionRank[right.fixedPosition]
        : 1;

    return (
        leftRank - rightRank ||
        (left.order ?? Number.MAX_SAFE_INTEGER) -
            (right.order ?? Number.MAX_SAFE_INTEGER)
    );
}

export function getTripPlacesForDay(
    places: readonly TripPlace[],
    day: TripPlace["day"],
) {
    return places
        .filter((place) => place.day === day)
        .sort(compareTripPlaceOrder);
}

export function isFixedTripPlace(place: TripPlace) {
    return place.fixedPosition !== null;
}
