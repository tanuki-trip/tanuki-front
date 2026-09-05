import { describe, expect, it } from "vitest";

import type { Trip } from "../trips/store";
import { getTransportHub } from "../trips/transport-hubs";
import { createTripEndpointPlaces } from "./trip-endpoints";

function requireHub(hubId: string) {
    const hub = getTransportHub(hubId);

    if (!hub) {
        throw new Error(`Missing test transport hub: ${hubId}`);
    }

    return hub;
}

const trip: Trip = {
    id: "trip-japan",
    name: "일본 여행",
    country: "일본",
    countryCode: "JP",
    currencyCode: "JPY",
    startDate: "2026-10-08",
    endDate: "2026-10-12",
    members: [{ id: "owner", name: "나" }],
    transportType: "flight",
    returnTransportType: "flight",
    arrivalHub: requireHub("jp-fuk"),
    departureHub: requireHub("jp-kix"),
};

describe("createTripEndpointPlaces", () => {
    it("creates only the fixed destination arrival and departure places", () => {
        const places = createTripEndpointPlaces(trip, 5);

        expect(places).toHaveLength(2);
        expect(places[0]).toMatchObject({
            name: "후쿠오카 공항",
            address: "후쿠오카 · FUK",
            day: 1,
            order: 0,
            fixedPosition: "first",
        });
        expect(places[1]).toMatchObject({
            name: "간사이 국제공항",
            address: "오사카 · KIX",
            day: 5,
            order: 0,
            fixedPosition: "last",
        });
        expect(places.some(({ day }) => day === "bookmark")).toBe(false);
    });

    it("keeps both endpoints at the edges of a day trip", () => {
        const places = createTripEndpointPlaces(trip, 1);

        expect(
            places.map(({ fixedPosition, order }) => ({
                fixedPosition,
                order,
            })),
        ).toEqual([
            { fixedPosition: "first", order: 0 },
            { fixedPosition: "last", order: 1 },
        ]);
    });

    it("creates an empty schedule when no destination hubs were selected", () => {
        expect(
            createTripEndpointPlaces(
                {
                    ...trip,
                    transportType: "other",
                    returnTransportType: undefined,
                    arrivalHub: undefined,
                    departureHub: undefined,
                },
                5,
            ),
        ).toEqual([]);
    });
});
