import { describe, expect, it } from "vitest";

import type { Trip } from "../trips/store";
import { getTransportHub } from "../trips/transport-hubs";
import { createEmptyTripInbound, type TripPlace } from "./model";
import {
    createTripEndpointPlaces,
    reconcileTripEndpointPlaces,
} from "./trip-endpoints";

function createPlace(id: string, day: number, order: number): TripPlace {
    return {
        id,
        name: id,
        address: `${id} address`,
        coordinates: { latitude: 35.68, longitude: 139.77 },
        day,
        order,
        arrivalTime: "10:00",
        memo: null,
        placeCost: { amount: 0, currency: "JPY" },
        inbound: createEmptyTripInbound(),
        fixedPosition: null,
    };
}

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

describe("reconcileTripEndpointPlaces", () => {
    it("preserves endpoint details when unrelated trip settings change", () => {
        const places = createTripEndpointPlaces(trip, 5).map((place) =>
            place.fixedPosition === "last"
                ? {
                      ...place,
                      arrivalTime: "14:30",
                      memo: "13:50까지 출발",
                      inbound: {
                          mode: "train" as const,
                          durationMin: 45,
                          cost: { amount: 1_500, currency: "JPY" },
                          isPassCovered: false,
                      },
                  }
                : place,
        );

        const result = reconcileTripEndpointPlaces(
            places,
            { ...trip, name: "이름만 변경" },
            5,
        );

        expect(
            result.find(({ fixedPosition }) => fixedPosition === "last"),
        ).toMatchObject({
            day: 5,
            arrivalTime: "14:30",
            memo: "13:50까지 출발",
            inbound: {
                mode: "train",
                durationMin: 45,
                cost: { amount: 1_500, currency: "JPY" },
            },
        });
    });

    it("resets endpoint transport when its day and predecessor change", () => {
        const places = [
            ...createTripEndpointPlaces(trip, 5).map((place) =>
                place.fixedPosition === "last"
                    ? {
                          ...place,
                          arrivalTime: "14:30",
                          memo: "13:50까지 출발",
                          inbound: {
                              mode: "train" as const,
                              durationMin: 45,
                              cost: { amount: 1_500, currency: "JPY" },
                              isPassCovered: false,
                          },
                      }
                    : place,
            ),
            createPlace("hotel", 5, 0),
        ];

        const result = reconcileTripEndpointPlaces(
            places,
            { ...trip, endDate: "2026-10-13" },
            6,
        );

        expect(
            result.find(({ fixedPosition }) => fixedPosition === "last"),
        ).toMatchObject({
            day: 6,
            arrivalTime: "14:30",
            memo: "13:50까지 출발",
            inbound: createEmptyTripInbound(),
        });
    });

    it("resets endpoint details when its hub changes", () => {
        const places = createTripEndpointPlaces(trip, 5).map((place) =>
            place.fixedPosition === "last"
                ? { ...place, memo: "기존 공항 메모" }
                : place,
        );

        const result = reconcileTripEndpointPlaces(
            places,
            { ...trip, departureHub: requireHub("jp-hnd") },
            5,
        );

        expect(
            result.find(({ fixedPosition }) => fixedPosition === "last"),
        ).toMatchObject({
            name: "하네다 공항",
            memo: null,
            inbound: createEmptyTripInbound(),
        });
    });

    it("replaces endpoints and moves places inside a shortened trip", () => {
        const updatedTrip = {
            ...trip,
            departureHub: undefined,
            endDate: "2026-10-09",
        };
        const places = [
            ...createTripEndpointPlaces(trip, 5),
            createPlace("late-place", 4, 0),
        ];

        const result = reconcileTripEndpointPlaces(places, updatedTrip, 2);
        const latePlace = result.find(({ id }) => id === "late-place");

        expect(
            result.some(({ fixedPosition }) => fixedPosition === "last"),
        ).toBe(false);
        expect(latePlace).toMatchObject({
            day: 2,
            order: 0,
            arrivalTime: null,
            inbound: createEmptyTripInbound(),
        });
    });

    it("keeps the original collection for an invalid day count", () => {
        const places = [createPlace("place", 1, 0)];

        expect(reconcileTripEndpointPlaces(places, trip, 0)).toBe(places);
    });
});
