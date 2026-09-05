import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TripDayBadges } from "./TripDayBadges";

describe("TripDayBadges", () => {
    it("converts a vertical wheel gesture into horizontal scrolling", () => {
        render(
            <TripDayBadges
                startDate="2026-10-08"
                endDate="2026-10-12"
                activeDay={1}
                onDayChange={vi.fn()}
            />,
        );

        const group = screen.getByRole("group", { name: "일정 날짜" });
        const scroller = group.parentElement;

        if (!scroller) {
            throw new Error("일정 스크롤 영역을 찾지 못했습니다.");
        }

        Object.defineProperties(scroller, {
            scrollWidth: { configurable: true, value: 600 },
            clientWidth: { configurable: true, value: 300 },
        });

        fireEvent.wheel(scroller, { deltaY: 100 });

        expect(scroller.scrollLeft).toBe(100);
    });

    it("prevents native dragging on every badge", () => {
        render(
            <TripDayBadges
                startDate="2026-10-08"
                endDate="2026-10-09"
                activeDay={1}
                onDayChange={vi.fn()}
            />,
        );

        const badges = screen.getAllByRole("button");

        expect(badges).toHaveLength(3);
        badges.forEach((badge) => {
            expect(badge).toHaveAttribute("draggable", "false");
        });
    });

    it("scrolls horizontally by dragging with the primary mouse button", () => {
        render(
            <TripDayBadges
                startDate="2026-10-08"
                endDate="2026-10-12"
                activeDay={1}
                onDayChange={vi.fn()}
            />,
        );

        const group = screen.getByRole("group", { name: "일정 날짜" });
        const scroller = group.parentElement;

        if (!scroller) {
            throw new Error("일정 스크롤 영역을 찾지 못했습니다.");
        }

        Object.defineProperty(scroller, "setPointerCapture", {
            configurable: true,
            value: vi.fn(),
        });

        fireEvent.pointerDown(scroller, {
            button: 0,
            clientX: 200,
            pointerId: 1,
            pointerType: "mouse",
        });
        fireEvent.pointerMove(scroller, {
            clientX: 140,
            pointerId: 1,
            pointerType: "mouse",
        });

        expect(scroller.scrollLeft).toBe(60);
        expect(scroller).toHaveAttribute("data-dragging", "true");

        fireEvent.pointerUp(scroller, {
            clientX: 140,
            pointerId: 1,
            pointerType: "mouse",
        });

        expect(scroller).not.toHaveAttribute("data-dragging");
    });

    it("does not activate a badge after dragging it", () => {
        const onDayChange = vi.fn();

        render(
            <TripDayBadges
                startDate="2026-10-08"
                endDate="2026-10-12"
                activeDay={1}
                onDayChange={onDayChange}
            />,
        );

        const badge = screen.getByRole("button", {
            name: "2일차, 10월 9일 금요일",
        });
        const scroller = badge.closest("div[class]");

        if (!scroller) {
            throw new Error("일정 스크롤 영역을 찾지 못했습니다.");
        }

        Object.defineProperty(scroller, "setPointerCapture", {
            configurable: true,
            value: vi.fn(),
        });

        fireEvent.pointerDown(badge, {
            button: 0,
            clientX: 160,
            pointerId: 2,
            pointerType: "mouse",
        });
        fireEvent.pointerMove(scroller, {
            clientX: 100,
            pointerId: 2,
            pointerType: "mouse",
        });
        fireEvent.pointerUp(scroller, {
            clientX: 100,
            pointerId: 2,
            pointerType: "mouse",
        });
        fireEvent.click(badge);

        expect(onDayChange).not.toHaveBeenCalled();
    });
});
