import type { TripPlace } from "./mock";

export type ScheduleDay = number | "bookmark";
export type TripPlaceDetailsPatch = Partial<
    Pick<TripPlace, "arrivalTime" | "memo">
>;

const emptyInbound = {
    mode: null,
    durationMin: null,
    cost: null,
    isPassCovered: false,
} as const;

function normalizeDayOrder(places: TripPlace[], day: ScheduleDay) {
    if (day === "bookmark") return places;

    const orderedIds = places
        .filter((place) => place.day === day)
        .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
        .map((place) => place.id);
    const orderById = new Map(
        orderedIds.map((placeId, index) => [placeId, index]),
    );

    return places.map((place) =>
        place.day === day
            ? { ...place, order: orderById.get(place.id) ?? null }
            : place,
    );
}

export function updateTripPlaceDetails(
    places: TripPlace[],
    placeId: string,
    patch: TripPlaceDetailsPatch,
) {
    return places.map((place) =>
        place.id === placeId ? { ...place, ...patch } : place,
    );
}

export function deleteTripPlace(places: TripPlace[], placeId: string) {
    const target = places.find((place) => place.id === placeId);
    if (!target) return places;

    return normalizeDayOrder(
        places.filter((place) => place.id !== placeId),
        target.day,
    );
}

export function moveTripPlace(
    places: TripPlace[],
    placeId: string,
    targetDay: ScheduleDay,
) {
    const target = places.find((place) => place.id === placeId);
    if (!target || target.day === targetDay) return places;

    const normalized = normalizeDayOrder(
        places.filter((place) => place.id !== placeId),
        target.day,
    );
    const nextOrder = normalized.filter(
        (place) => place.day === targetDay,
    ).length;
    const moved: TripPlace = {
        ...target,
        day: targetDay,
        order: targetDay === "bookmark" ? null : nextOrder,
        arrivalTime: null,
        inbound: emptyInbound,
    };

    return [...normalized, moved];
}
