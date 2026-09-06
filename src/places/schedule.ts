import {
    createEmptyTripInbound,
    getTripPlacesForDay,
    isFixedTripPlace,
    type TripPlace,
} from "./model";

export type ScheduleDay = TripPlace["day"];
export type TripPlaceDetailsPatch = Partial<
    Pick<TripPlace, "arrivalTime" | "memo" | "placeCost">
>;

function normalizeDayOrder(places: readonly TripPlace[], day: ScheduleDay) {
    if (day === "bookmark") return places;

    const orderedIds = getTripPlacesForDay(places, day).map(
        (place) => place.id,
    );
    const orderById = new Map(
        orderedIds.map((placeId, index) => [placeId, index]),
    );

    return places.map((place) =>
        place.day === day
            ? { ...place, order: orderById.get(place.id) ?? null }
            : place,
    );
}

function getNextScheduledPlaceId(
    places: readonly TripPlace[],
    target: TripPlace,
) {
    if (target.day === "bookmark") {
        return null;
    }

    const dayPlaces = getTripPlacesForDay(places, target.day);
    const targetIndex = dayPlaces.findIndex((place) => place.id === target.id);

    return targetIndex >= 0 ? (dayPlaces[targetIndex + 1]?.id ?? null) : null;
}

function resetPlaceInbound(
    places: readonly TripPlace[],
    placeId: string | null,
) {
    if (!placeId) {
        return places;
    }

    return places.map((place) =>
        place.id === placeId
            ? { ...place, inbound: createEmptyTripInbound() }
            : place,
    );
}

export function updateTripPlaceDetails(
    places: readonly TripPlace[],
    placeId: string,
    patch: TripPlaceDetailsPatch,
) {
    return places.map((place) =>
        place.id === placeId ? { ...place, ...patch } : place,
    );
}

export function deleteTripPlace(places: readonly TripPlace[], placeId: string) {
    const target = places.find((place) => place.id === placeId);
    if (!target || isFixedTripPlace(target)) return places;

    const nextPlaceId = getNextScheduledPlaceId(places, target);
    const remainingPlaces = places.filter((place) => place.id !== placeId);

    return normalizeDayOrder(
        resetPlaceInbound(remainingPlaces, nextPlaceId),
        target.day,
    );
}

export function moveTripPlace(
    places: readonly TripPlace[],
    placeId: string,
    targetDay: ScheduleDay,
) {
    const target = places.find((place) => place.id === placeId);
    if (!target || isFixedTripPlace(target) || target.day === targetDay) {
        return places;
    }

    const sourceNextPlaceId = getNextScheduledPlaceId(places, target);
    const normalized = normalizeDayOrder(
        resetPlaceInbound(
            places.filter((place) => place.id !== placeId),
            sourceNextPlaceId,
        ),
        target.day,
    );
    const targetNextPlaceId =
        targetDay === "bookmark"
            ? null
            : (getTripPlacesForDay(normalized, targetDay).find(
                  (place) => place.fixedPosition === "last",
              )?.id ?? null);
    const preparedPlaces = resetPlaceInbound(normalized, targetNextPlaceId);
    const nextOrder = preparedPlaces.filter(
        (place) => place.day === targetDay,
    ).length;
    const moved: TripPlace = {
        ...target,
        day: targetDay,
        order: targetDay === "bookmark" ? null : nextOrder,
        arrivalTime: null,
        inbound: createEmptyTripInbound(),
    };

    return normalizeDayOrder([...preparedPlaces, moved], targetDay);
}
