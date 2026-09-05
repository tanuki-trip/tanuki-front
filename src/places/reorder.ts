import type { TripPlace } from "./mock";

export function reorderDayPlaces(
    places: TripPlace[],
    day: number | "bookmark",
    sourceId: string,
    targetId: string,
) {
    if (day === "bookmark" || sourceId === targetId) {
        return places;
    }

    const dayPlaces = places
        .filter((place) => place.day === day)
        .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
    const sourceIndex = dayPlaces.findIndex((place) => place.id === sourceId);
    const targetIndex = dayPlaces.findIndex((place) => place.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
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
                inbound: scheduleSlots[index]?.inbound ?? {
                    mode: null,
                    durationMin: null,
                    cost: null,
                    isPassCovered: false,
                },
                order: index,
            },
        ]),
    );

    return places.map((place) => {
        const update = updates.get(place.id);
        return update ? { ...place, ...update } : place;
    });
}
