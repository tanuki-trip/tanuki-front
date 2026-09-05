import { describe, expect, it } from "vitest";

import { createMockTripPlaces } from "./mock";

const input = {
    countryCode: "JP" as const,
    currencyCode: "JPY",
    dayCount: 5,
    tripId: "japan-tokyo",
};

describe("createMockTripPlaces", () => {
    it("creates three to five ordered places for every trip day", () => {
        const places = createMockTripPlaces(input);

        for (let day = 1; day <= input.dayCount; day += 1) {
            const dayPlaces = places.filter((place) => place.day === day);

            expect(dayPlaces.length).toBeGreaterThanOrEqual(3);
            expect(dayPlaces.length).toBeLessThanOrEqual(5);
            expect(dayPlaces.map((place) => place.order)).toEqual(
                dayPlaces.map((_, index) => index),
            );
            dayPlaces.forEach((place) => {
                expect(place.memo).toBeNull();
                expect(place).not.toHaveProperty("type");
                expect(place.coordinates.longitude).toBeGreaterThanOrEqual(
                    -180,
                );
                expect(place.coordinates.longitude).toBeLessThanOrEqual(180);
                expect(place.coordinates.latitude).toBeGreaterThanOrEqual(-90);
                expect(place.coordinates.latitude).toBeLessThanOrEqual(90);
            });
        }
    });

    it("keeps generated data stable and strips schedule fields from bookmarks", () => {
        const places = createMockTripPlaces(input);
        const bookmarks = places.filter((place) => place.day === "bookmark");

        expect(createMockTripPlaces(input)).toEqual(places);
        expect(bookmarks.length).toBeGreaterThanOrEqual(3);
        bookmarks.forEach((bookmark) => {
            expect(bookmark.order).toBeNull();
            expect(bookmark.arrivalTime).toBeNull();
            expect(bookmark.inbound).toEqual({
                mode: null,
                durationMin: null,
                cost: null,
                isPassCovered: false,
            });
        });
    });

    it("does not create a transport cost for walking segments", () => {
        const walkingSegments = createMockTripPlaces(input).filter(
            (place) => place.inbound.mode === "walk",
        );

        expect(walkingSegments.length).toBeGreaterThan(0);
        walkingSegments.forEach((place) => {
            expect(place.inbound.cost).toBeNull();
        });
    });
});
