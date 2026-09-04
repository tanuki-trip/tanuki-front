import { describe, expect, it } from "vitest";

import { formatCompactEndDate, formatCompactStartDate } from "./trip";

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
