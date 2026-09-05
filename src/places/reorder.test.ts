import { describe, expect, it } from "vitest";

import type { TripPlace } from "./model";
import { reorderDayPlaces } from "./reorder";

function createPlace(
    id: string,
    order: number,
    arrivalTime: string,
    fixedPosition: TripPlace["fixedPosition"] = null,
): TripPlace {
    return {
        id,
        name: id,
        address: `${id} address`,
        coordinates: { latitude: 35.68, longitude: 139.77 },
        day: 1,
        order,
        arrivalTime,
        memo: null,
        placeCost: { amount: 1000, currency: "JPY" },
        inbound: {
            mode: order === 0 ? null : order === 1 ? "walk" : "bus",
            durationMin: order === 0 ? null : order * 10,
            cost: null,
            isPassCovered: false,
        },
        fixedPosition,
    };
}

describe("reorderDayPlaces", () => {
    it("moves a place while keeping arrival times attached to their slots", () => {
        const places = [
            createPlace("place-a", 0, "09:00"),
            createPlace("place-b", 1, "11:30"),
            createPlace("place-c", 2, "14:00"),
        ];

        const result = reorderDayPlaces(places, 1, "place-c", "place-a")
            .filter((place) => place.day === 1)
            .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));

        expect(result.map((place) => place.id)).toEqual([
            "place-c",
            "place-a",
            "place-b",
        ]);
        expect(result.map((place) => place.arrivalTime)).toEqual([
            "09:00",
            "11:30",
            "14:00",
        ]);
        expect(result.map((place) => place.inbound.mode)).toEqual([
            null,
            "walk",
            "bus",
        ]);
        expect(places.map((place) => place.id)).toEqual([
            "place-a",
            "place-b",
            "place-c",
        ]);
    });

    it("does not reorder bookmarks", () => {
        const places = [createPlace("place-a", 0, "09:00")];

        expect(reorderDayPlaces(places, "bookmark", "place-a", "place-b")).toBe(
            places,
        );
    });

    it("does not reorder a fixed endpoint", () => {
        const places = [
            createPlace("arrival", 0, "09:00", "first"),
            createPlace("place-a", 1, "10:00"),
        ];

        expect(reorderDayPlaces(places, 1, "arrival", "place-a")).toBe(places);
        expect(reorderDayPlaces(places, 1, "place-a", "arrival")).toBe(places);
    });
});
