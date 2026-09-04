import { describe, expect, it } from "vitest";

import {
    formatCompactEndDate,
    formatCompactStartDate,
    getDaysUntilTrip,
    getTripSections,
} from "./trip";

describe("trip date formatting", () => {
    it("formats the start date with a two-digit year", () => {
        expect(formatCompactStartDate("2026-10-08")).toBe("26.10.08");
    });

    it("shortens an end date based on the shared date parts", () => {
        expect(formatCompactEndDate("2026-10-08", "2026-10-12")).toBe("12");
        expect(formatCompactEndDate("2026-10-28", "2026-11-02")).toBe("11.02");
        expect(formatCompactEndDate("2026-12-30", "2027-01-02")).toBe(
            "27.01.02",
        );
    });
});

describe("trip sections", () => {
    const today = new Date(2026, 8, 4);
    const trips = [
        { id: "past", startDate: "2026-08-01" },
        { id: "later", startDate: "2026-10-10" },
        { id: "next", startDate: "2026-09-05" },
    ];

    it("calculates a date-only countdown", () => {
        expect(getDaysUntilTrip("2026-09-04", today)).toBe(0);
        expect(getDaysUntilTrip("2026-10-08", today)).toBe(34);
    });

    it("selects the closest future trip and sorts the rest", () => {
        const sections = getTripSections(trips, today);

        expect(sections.upcomingTrip?.id).toBe("next");
        expect(sections.otherTrips.map((trip) => trip.id)).toEqual([
            "past",
            "later",
        ]);
    });

    it("keeps every trip in the list when no future trip exists", () => {
        const sections = getTripSections(trips, new Date(2027, 0, 1));

        expect(sections.upcomingTrip).toBeUndefined();
        expect(sections.otherTrips.map((trip) => trip.id)).toEqual([
            "past",
            "next",
            "later",
        ]);
    });
});
