import { describe, expect, it } from "vitest";

import { supportedCountries } from "./countries";
import {
    findTransportHub,
    getTransportHubs,
    searchTransportHubs,
    transportHubs,
} from "./transport-hubs";

describe("transport hubs", () => {
    it("provides multiple airports and ports for every supported country", () => {
        for (const country of supportedCountries) {
            expect(
                getTransportHubs(country.code, "flight").length,
            ).toBeGreaterThan(1);
            expect(
                getTransportHubs(country.code, "ship").length,
            ).toBeGreaterThan(1);
        }
    });

    it("uses a unique id for every hub", () => {
        expect(new Set(transportHubs.map(({ id }) => id)).size).toBe(
            transportHubs.length,
        );

        for (const hub of transportHubs) {
            expect(hub.region).not.toBe("");
            expect(hub.coordinates.longitude).toBeGreaterThanOrEqual(-180);
            expect(hub.coordinates.longitude).toBeLessThanOrEqual(180);
            expect(hub.coordinates.latitude).toBeGreaterThanOrEqual(-90);
            expect(hub.coordinates.latitude).toBeLessThanOrEqual(90);
        }
    });

    it("finds nearby hubs by region, alias, and code", () => {
        expect(
            searchTransportHubs("JP", "flight", "도쿄").map(({ code }) => code),
        ).toEqual(["HND", "NRT"]);
        expect(
            searchTransportHubs("JP", "flight", "kyoto").map(
                ({ code }) => code,
            ),
        ).toEqual(["KIX", "ITM"]);
        expect(searchTransportHubs("JP", "flight", "FUK")[0]?.name).toBe(
            "후쿠오카 공항",
        );
    });

    it("rejects a selected hub from another country or transport type", () => {
        expect(findTransportHub("JP", "flight", "jp-fuk")?.code).toBe("FUK");
        expect(findTransportHub("JP", "ship", "jp-fuk")).toBeUndefined();
        expect(findTransportHub("VN", "flight", "jp-fuk")).toBeUndefined();
    });
});
