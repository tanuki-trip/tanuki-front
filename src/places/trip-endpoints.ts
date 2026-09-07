import type { Trip } from "../trips/store";
import type { TransportHub } from "../trips/transport-hubs";
import {
    createEmptyTripInbound,
    getTripPlacesForDay,
    type FixedSchedulePosition,
    type TripPlace,
} from "./model";

function createEndpointPlace({
    trip,
    hub,
    day,
    order,
    fixedPosition,
}: {
    trip: Trip;
    hub: TransportHub;
    day: number;
    order: number;
    fixedPosition: FixedSchedulePosition;
}): TripPlace {
    return {
        id: `endpoint-${trip.id}-${fixedPosition}`,
        name: hub.name,
        address: `${hub.region} · ${hub.code}`,
        coordinates: hub.coordinates,
        day,
        order,
        arrivalTime: null,
        memo: null,
        placeCost: {
            amount: 0,
            currency: trip.currencyCode,
        },
        inbound: createEmptyTripInbound(),
        fixedPosition,
    };
}

function hasSameEndpointLocation(current: TripPlace, next: TripPlace) {
    return (
        current.fixedPosition === next.fixedPosition &&
        current.name === next.name &&
        current.address === next.address &&
        current.coordinates.latitude === next.coordinates.latitude &&
        current.coordinates.longitude === next.coordinates.longitude
    );
}

function getPreviousPlaceId(places: readonly TripPlace[], target: TripPlace) {
    if (typeof target.day !== "number") {
        return null;
    }

    const dayPlaces = getTripPlacesForDay(places, target.day);
    const targetIndex = dayPlaces.findIndex((place) => place.id === target.id);

    return targetIndex > 0 ? (dayPlaces[targetIndex - 1]?.id ?? null) : null;
}

function preserveEndpointDetails(
    next: TripPlace,
    currentEndpoints: readonly TripPlace[],
    currentPlaces: readonly TripPlace[],
    nextPlaces: readonly TripPlace[],
) {
    const current = currentEndpoints.find((place) =>
        hasSameEndpointLocation(place, next),
    );

    if (!current) {
        return next;
    }

    const routeIsUnchanged =
        current.day === next.day &&
        getPreviousPlaceId(currentPlaces, current) ===
            getPreviousPlaceId(nextPlaces, next);

    return {
        ...next,
        arrivalTime: current.arrivalTime,
        inbound: routeIsUnchanged ? current.inbound : createEmptyTripInbound(),
        memo: current.memo,
        placeCost: current.placeCost,
    } satisfies TripPlace;
}

export function createTripEndpointPlaces(trip: Trip, dayCount: number) {
    if (!Number.isSafeInteger(dayCount) || dayCount < 1) {
        return [];
    }

    const places: TripPlace[] = [];

    if (trip.arrivalHub) {
        places.push(
            createEndpointPlace({
                trip,
                hub: trip.arrivalHub,
                day: 1,
                order: 0,
                fixedPosition: "first",
            }),
        );
    }

    if (trip.departureHub) {
        places.push(
            createEndpointPlace({
                trip,
                hub: trip.departureHub,
                day: dayCount,
                order: dayCount === 1 && trip.arrivalHub ? 1 : 0,
                fixedPosition: "last",
            }),
        );
    }

    return places;
}

export function reconcileTripEndpointPlaces(
    places: readonly TripPlace[],
    trip: Trip,
    dayCount: number,
) {
    if (!Number.isSafeInteger(dayCount) || dayCount < 1) {
        return places;
    }

    const currentEndpoints = places.filter(
        (place) => place.fixedPosition !== null,
    );
    const ordinaryPlaces = places
        .filter((place) => place.fixedPosition === null)
        .map((place) => {
            if (typeof place.day !== "number" || place.day <= dayCount) {
                return place;
            }

            return {
                ...place,
                day: dayCount,
                order: null,
                arrivalTime: null,
                inbound: createEmptyTripInbound(),
            } satisfies TripPlace;
        });
    const createdEndpoints = createTripEndpointPlaces(trip, dayCount);
    const nextPlacesWithoutDetails = [...createdEndpoints, ...ordinaryPlaces];
    const nextEndpoints = createdEndpoints.map((endpoint) =>
        preserveEndpointDetails(
            endpoint,
            currentEndpoints,
            places,
            nextPlacesWithoutDetails,
        ),
    );
    const nextPlaces = [...nextEndpoints, ...ordinaryPlaces];
    const orderById = new Map<string, number>();

    for (let day = 1; day <= dayCount; day += 1) {
        getTripPlacesForDay(nextPlaces, day).forEach((place, index) => {
            orderById.set(place.id, index);
        });
    }

    return nextPlaces.map((place) =>
        typeof place.day === "number"
            ? { ...place, order: orderById.get(place.id) ?? null }
            : place,
    );
}
