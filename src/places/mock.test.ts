import { describe, expect, it } from "vitest";

import { createMockTripPlaces } from "./mock";

describe("createMockTripPlaces", () => {
    it("creates three first-day places for the built-in Korea trip", () => {
        const places = createMockTripPlaces({
            currencyCode: "KRW",
            tripId: "korea-jeju",
        });

        expect(places).toHaveLength(3);
        expect(places.map(({ day, order }) => ({ day, order }))).toEqual([
            { day: 1, order: 1 },
            { day: 1, order: 2 },
            { day: 1, order: 3 },
        ]);
        expect(places.map(({ placeCost }) => placeCost.category)).toEqual([
            "food",
            "tourism",
            "other",
        ]);
    });

    it("does not add mock places to user-created trips", () => {
        expect(
            createMockTripPlaces({
                currencyCode: "JPY",
                tripId: "trip-user-created",
            }),
        ).toEqual([]);
    });
});
