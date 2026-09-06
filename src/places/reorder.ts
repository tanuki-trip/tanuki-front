import {
    createEmptyTripInbound,
    getTripPlacesForDay,
    isFixedTripPlace,
    type TripPlace,
} from "./model";

export function reorderDayPlaces(
    places: readonly TripPlace[],
    day: number | "bookmark",
    sourceId: string,
    targetId: string,
) {
    if (day === "bookmark" || sourceId === targetId) {
        return places;
    }

    const dayPlaces = getTripPlacesForDay(places, day);
    const sourceIndex = dayPlaces.findIndex((place) => place.id === sourceId);
    const targetIndex = dayPlaces.findIndex((place) => place.id === targetId);
    const sourcePlace = dayPlaces[sourceIndex];
    const targetPlace = dayPlaces[targetIndex];

    if (
        sourceIndex === -1 ||
        targetIndex === -1 ||
        !sourcePlace ||
        !targetPlace ||
        isFixedTripPlace(sourcePlace) ||
        isFixedTripPlace(targetPlace)
    ) {
        return places;
    }

    const scheduleSlots = dayPlaces.map((place) => ({
        arrivalTime: place.arrivalTime,
        inbound: place.inbound,
    }));
    const reordered = [...dayPlaces];
    const [source] = reordered.splice(sourceIndex, 1);

    if (!source) {
        return places;
    }

    reordered.splice(targetIndex, 0, source);

    const updates = new Map(
        reordered.map((place, index) => [
            place.id,
            {
                arrivalTime: scheduleSlots[index]?.arrivalTime ?? null,
                inbound:
                    scheduleSlots[index]?.inbound ?? createEmptyTripInbound(),
                order: index,
            },
        ]),
    );

    return places.map((place) => {
        const update = updates.get(place.id);
        return update ? { ...place, ...update } : place;
    });
}
