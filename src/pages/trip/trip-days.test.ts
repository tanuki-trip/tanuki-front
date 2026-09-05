import { describe, expect, it } from "vitest";

import { getTripDays } from "./trip-days";

describe("getTripDays", () => {
    it("creates inclusive day badges from the trip period", () => {
        expect(getTripDays("2026-10-08", "2026-10-12")).toEqual([
            {
                day: 1,
                date: "2026-10-08",
                dateLabel: "10.08 (목)",
                accessibleLabel: "1일차, 10월 8일 목요일",
            },
            {
                day: 2,
                date: "2026-10-09",
                dateLabel: "10.09 (금)",
                accessibleLabel: "2일차, 10월 9일 금요일",
            },
            {
                day: 3,
                date: "2026-10-10",
                dateLabel: "10.10 (토)",
                accessibleLabel: "3일차, 10월 10일 토요일",
            },
            {
                day: 4,
                date: "2026-10-11",
                dateLabel: "10.11 (일)",
                accessibleLabel: "4일차, 10월 11일 일요일",
            },
            {
                day: 5,
                date: "2026-10-12",
                dateLabel: "10.12 (월)",
                accessibleLabel: "5일차, 10월 12일 월요일",
            },
        ]);
    });

    it("returns no days for an invalid period", () => {
        expect(getTripDays("2026-02-30", "2026-03-02")).toEqual([]);
        expect(getTripDays("2026-10-12", "2026-10-08")).toEqual([]);
    });
});
