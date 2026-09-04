import { describe, expect, it } from "vitest";

import {
    formatCompactTripPeriod,
    formatTripDuration,
    getTripDayCount,
    parseTripDate,
    toTripDateString,
} from "./trip-form";

describe("trip creation date helpers", () => {
    it("calculates calendar days across month and year boundaries", () => {
        expect(getTripDayCount("2026-12-30", "2027-01-03")).toBe(5);
        expect(getTripDayCount("2028-02-28", "2028-02-29")).toBe(2);
    });

    it("rejects invalid or reversed ranges", () => {
        expect(getTripDayCount("2026-12-30", "2026-12-29")).toBeNull();
        expect(getTripDayCount("invalid", "2026-12-30")).toBeNull();
        expect(getTripDayCount("2026-02-30", "2026-03-02")).toBeNull();
    });

    it("counts a same-day trip as one calendar day", () => {
        expect(getTripDayCount("2026-09-05", "2026-09-05")).toBe(1);
    });

    it("converts calendar dates without a timezone shift", () => {
        const date = parseTripDate("2026-09-05");

        expect(date).not.toBeNull();
        expect(toTripDateString(date!)).toBe("2026-09-05");
    });

    it("formats a compact date range without repeating shared parts", () => {
        expect(formatCompactTripPeriod("2026-09-05", "2026-09-06")).toBe(
            "2026. 9. 5. – 6.",
        );
        expect(formatCompactTripPeriod("2026-09-30", "2026-10-02")).toBe(
            "2026. 9. 30. – 10. 2.",
        );
        expect(formatCompactTripPeriod("2026-12-30", "2027-01-03")).toBe(
            "2026. 12. 30. – 2027. 1. 3.",
        );
        expect(formatCompactTripPeriod("2026-09-05", "2026-09-05")).toBe(
            "2026. 9. 5.",
        );
    });

    it("formats the duration without assuming a stay count", () => {
        expect(formatTripDuration(1)).toBe("당일치기");
        expect(formatTripDuration(5)).toBe("총 5일");
    });
});
