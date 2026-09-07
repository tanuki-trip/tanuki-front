import { describe, expect, it } from "vitest";

import { createMockTripPlaces } from "./mock";

describe("createMockTripPlaces", () => {
    it("creates the four-day Yokohama and Shirakawago itinerary", () => {
        const places = createMockTripPlaces({
            currencyCode: "JPY",
            tripId: "japan-yokohama-shirakawago-tokyo",
        });

        expect(places).toHaveLength(57);
        expect(
            [1, 2, 3, 4].map(
                (day) => places.filter((place) => place.day === day).length,
            ),
        ).toEqual([21, 17, 12, 7]);
        expect(
            [1, 2, 3, 4].map((day) =>
                places
                    .filter((place) => place.day === day)
                    .map(({ order }) => order),
            ),
        ).toEqual([
            Array.from({ length: 21 }, (_, index) => index + 1),
            Array.from({ length: 17 }, (_, index) => index + 1),
            Array.from({ length: 12 }, (_, index) => index + 1),
            Array.from({ length: 7 }, (_, index) => index + 1),
        ]);
        expect(places.map(({ name }) => name)).toEqual(
            expect.arrayContaining([
                "외교관의 집",
                "오기마치 성터 전망대",
                "다이버시티 마마재 팝업",
                "구 후루카와 저택 가이드",
            ]),
        );
        expect(
            Object.fromEntries(
                places.map(({ inbound, name }) => [name, inbound.mode]),
            ),
        ).toMatchObject({
            게이세이우에노역: "train",
            "다이버시티 마마재 팝업": "train",
            "히로키야 롯폰기": "subway",
            "구 마에다 후작 저택": "train",
            "Age.3 HARAJUKU": "subway",
            "Cafe Quadrillion": "subway",
            고마고메역: "train",
        });
        expect(
            places.filter(({ memo }) => memo?.includes("까지 출발")),
        ).toHaveLength(55);
        expect(
            places
                .filter(({ placeCost }) => placeCost.category === "food")
                .every(({ memo }) => memo?.includes("음식점")),
        ).toBe(true);
        expect(
            Object.fromEntries(places.map(({ memo, name }) => [name, memo])),
        ).toMatchObject({
            "신파치식당 간다 북쪽 출구점": "음식점 · 10:10까지 출발",
            "구 마에다 후작 저택": "14:45까지 출발",
            "Cafe Quadrillion": "음식점 · 18:00까지 출발",
            "오카치마치 어반 호텔 복귀": null,
            "스시로 우에노점": "음식점 · 13:25까지 출발",
        });
    });

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
