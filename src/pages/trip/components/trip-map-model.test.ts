import { describe, expect, it } from "vitest";

import type { TripPlace } from "../../../places/model";
import { getInitialMapView } from "./trip-map-model";

const createPlace = (
    id: string,
    latitude: number,
    longitude: number,
): TripPlace => ({
    id,
    name: id,
    address: "",
    coordinates: { latitude, longitude },
    day: 1,
    order: 0,
    arrivalTime: null,
    memo: null,
    placeCost: { amount: 0, currency: "JPY" },
    inbound: {
        mode: null,
        durationMin: null,
        cost: null,
        isPassCovered: false,
    },
    fixedPosition: null,
});

describe("getInitialMapView", () => {
    it("fits the initial map to the active day's places", () => {
        const view = getInitialMapView("JP", [
            createPlace("요코하마", 35.4437, 139.638),
            createPlace("도쿄", 35.6762, 139.6503),
        ]);

        expect(view).toEqual({
            kind: "bounds",
            bounds: [
                [139.638, 35.4437],
                [139.6503, 35.6762],
            ],
            padding: 64,
            maxZoom: 14,
        });
    });

    it("starts directly at an already focused place", () => {
        expect(
            getInitialMapView(
                "JP",
                [createPlace("요코하마", 35.4437, 139.638)],
                undefined,
                { latitude: 35.5494, longitude: 139.7798 },
            ),
        ).toEqual({
            kind: "camera",
            center: [139.7798, 35.5494],
            zoom: 15,
        });
    });

    it("starts near the only active place", () => {
        expect(
            getInitialMapView("JP", [createPlace("센소지", 35.7148, 139.7967)]),
        ).toEqual({
            kind: "camera",
            center: [139.7967, 35.7148],
            zoom: 14,
        });
    });

    it("uses the arrival hub before falling back to the country view", () => {
        expect(
            getInitialMapView("JP", [], {
                latitude: 35.5494,
                longitude: 139.7798,
            }),
        ).toEqual({
            kind: "camera",
            center: [139.7798, 35.5494],
            zoom: 11,
        });

        expect(getInitialMapView("KR", [])).toEqual({
            kind: "camera",
            center: [127.8, 36.3],
            zoom: 5.4,
        });
    });
});
