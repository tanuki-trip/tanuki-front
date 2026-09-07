import { afterEach, describe, expect, it } from "vitest";

import {
    defaultMapStyleId,
    getStoredTripMapStyle,
    storeTripMapStyle,
} from "./map-style";

afterEach(() => {
    window.localStorage.clear();
});

describe("trip map style storage", () => {
    it("stores map styles separately for each trip", () => {
        expect(storeTripMapStyle("trip-japan", "dark")).toBe(true);
        expect(storeTripMapStyle("trip-korea", "bright")).toBe(true);

        expect(getStoredTripMapStyle("trip-japan")).toBe("dark");
        expect(getStoredTripMapStyle("trip-korea")).toBe("bright");
    });

    it("falls back safely when a stored value is missing or invalid", () => {
        window.localStorage.setItem(
            "tanuki:trip-map-style:v1:trip-japan",
            "unsupported",
        );

        expect(getStoredTripMapStyle("trip-japan")).toBe(defaultMapStyleId);
        expect(getStoredTripMapStyle("trip-korea")).toBe(defaultMapStyleId);
    });
});
