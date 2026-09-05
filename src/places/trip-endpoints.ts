import type { Trip } from "../trips/store";
import type { TransportHub } from "../trips/transport-hubs";
import {
    createEmptyTripInbound,
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
