import { describe, expect, it } from "vitest";

import type { TripPlace } from "./model";
import {
    deleteTripPlace,
    moveTripPlace,
    updateTripPlaceDetails,
} from "./schedule";

function createPlace(
    id: string,
    day: number,
    order: number,
    fixedPosition: TripPlace["fixedPosition"] = null,
): TripPlace {
    return {
        id,
        name: id,
        address: `${id} address`,
        coordinates: { latitude: 35.68, longitude: 139.77 },
        day,
        order,
        arrivalTime: "09:00",
        memo: null,
        placeCost: { amount: 1000, currency: "JPY" },
        inbound: {
            mode: order === 0 ? null : "walk",
            durationMin: order === 0 ? null : 10,
            cost: null,
            isPassCovered: false,
        },
        fixedPosition,
    };
}

function setPaidInbound(place: TripPlace, amount: number) {
    place.inbound = {
        mode: "bus",
        durationMin: 20,
        cost: { amount, currency: "JPY" },
        isPassCovered: false,
        payerId: "owner",
        split: { mode: "equal", excludedMemberIds: [] },
    };
}

describe("trip place schedule actions", () => {
    it("updates only the requested schedule fields", () => {
        const places = [createPlace("a", 1, 0), createPlace("b", 1, 1)];
        const result = updateTripPlaceDetails(places, "b", {
            arrivalTime: "13:20",
            memo: "점심 예약",
        });

        expect(result[1]).toMatchObject({
            arrivalTime: "13:20",
            memo: "점심 예약",
        });
        expect(result[0]).toBe(places[0]);
    });

    it("deletes a place and closes the remaining order gap", () => {
        const places = [
            createPlace("a", 1, 0),
            createPlace("b", 1, 1),
            createPlace("c", 1, 2),
        ];
        const result = deleteTripPlace(places, "b");

        expect(result.map((place) => place.id)).toEqual(["a", "c"]);
        expect(result.map((place) => place.order)).toEqual([0, 1]);
        expect(result[1]?.inbound).toEqual({
            mode: null,
            durationMin: null,
            cost: null,
            isPassCovered: false,
        });
    });

    it("clears all finance fields from a route changed by deletion", () => {
        const places = [
            createPlace("a", 1, 0),
            createPlace("b", 1, 1),
            createPlace("c", 1, 2),
        ];
        setPaidInbound(places[2], 700);

        const result = deleteTripPlace(places, "b");

        expect(result.find((place) => place.id === "c")?.inbound).toEqual({
            mode: null,
            durationMin: null,
            cost: null,
            isPassCovered: false,
        });
    });

    it("moves a place to the end of another day and resets route fields", () => {
        const places = [
            createPlace("a", 1, 0),
            createPlace("b", 1, 1),
            createPlace("c", 2, 0),
        ];
        const result = moveTripPlace(places, "a", 2);
        const moved = result.find((place) => place.id === "a");

        expect(result.find((place) => place.id === "b")?.order).toBe(0);
        expect(moved).toMatchObject({
            day: 2,
            order: 1,
            arrivalTime: null,
            inbound: {
                mode: null,
                durationMin: null,
                cost: null,
                isPassCovered: false,
            },
        });
    });

    it("clears changed source and destination route segments when moving", () => {
        const sourceFirst = createPlace("source-first", 1, 0);
        const moving = createPlace("moving", 1, 1);
        const sourceNext = createPlace("source-next", 1, 2);
        const targetFirst = createPlace("target-first", 2, 0, "first");
        const targetLast = createPlace("target-last", 2, 1, "last");
        setPaidInbound(sourceNext, 700);
        setPaidInbound(targetLast, 900);

        const result = moveTripPlace(
            [sourceFirst, moving, sourceNext, targetFirst, targetLast],
            moving.id,
            2,
        );

        expect(
            result.find((place) => place.id === sourceNext.id)?.inbound,
        ).toEqual({
            mode: null,
            durationMin: null,
            cost: null,
            isPassCovered: false,
        });
        expect(
            result.find((place) => place.id === targetLast.id)?.inbound,
        ).toEqual({
            mode: null,
            durationMin: null,
            cost: null,
            isPassCovered: false,
        });
    });

    it("does not delete or move a fixed endpoint", () => {
        const fixedPlace = createPlace("arrival", 1, 0, "first");
        const places = [fixedPlace, createPlace("normal", 1, 1)];

        expect(deleteTripPlace(places, fixedPlace.id)).toBe(places);
        expect(moveTripPlace(places, fixedPlace.id, 2)).toBe(places);
    });

    it("inserts a moved place between fixed endpoints", () => {
        const places = [
            createPlace("moving", 1, 0),
            createPlace("arrival", 2, 3, "first"),
            createPlace("normal", 2, 0),
            createPlace("departure", 2, 1, "last"),
        ];
        const result = moveTripPlace(places, "moving", 2)
            .filter(({ day }) => day === 2)
            .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));

        expect(result.map(({ id }) => id)).toEqual([
            "arrival",
            "normal",
            "moving",
            "departure",
        ]);
    });
});
