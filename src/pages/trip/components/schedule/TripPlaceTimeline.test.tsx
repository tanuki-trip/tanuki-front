import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { TripPlace } from "../../../../places/mock";
import { TripPlaceTimeline } from "./TripPlaceTimeline";
import styles from "./TripPlaceTimeline.module.css";

const places: TripPlace[] = [
    {
        id: "place-1",
        name: "센소지",
        address: "2-3-1 Asakusa, Taito City",
        coordinates: { latitude: 35.7148, longitude: 139.7967 },
        day: 1,
        order: 0,
        arrivalTime: "09:00",
        memo: null,
        placeCost: { amount: 500, currency: "JPY" },
        inbound: {
            mode: null,
            durationMin: null,
            cost: null,
            isPassCovered: false,
        },
    },
    {
        id: "place-2",
        name: "호텔 니혼바시",
        address: "2 Chome Nihonbashi, Chuo City",
        coordinates: { latitude: 35.683, longitude: 139.773 },
        day: 1,
        order: 1,
        arrivalTime: "19:00",
        memo: null,
        placeCost: { amount: 12_000, currency: "JPY" },
        inbound: {
            mode: "subway",
            durationMin: 24,
            cost: { amount: 180, currency: "JPY" },
            isPassCovered: false,
        },
    },
];

describe("TripPlaceTimeline", () => {
    it("renders the planned place fields and inbound segment", () => {
        render(
            <TripPlaceTimeline
                activeDay={1}
                dayCount={5}
                onDeletePlace={vi.fn()}
                onMovePlace={vi.fn()}
                onReorder={vi.fn()}
                onUpdateInbound={vi.fn()}
                onUpdatePlace={vi.fn()}
                places={places}
            />,
        );

        expect(
            screen.getByRole("region", { name: "1일차 장소" }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("heading", { name: "1일차" }),
        ).not.toBeInTheDocument();
        expect(screen.queryByText("2개 장소")).not.toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "센소지" }),
        ).toBeInTheDocument();
        expect(screen.getByText("09:00")).toBeInTheDocument();
        expect(screen.queryByText("관광지")).not.toBeInTheDocument();
        expect(screen.queryByText("예산")).not.toBeInTheDocument();
        expect(screen.queryByText("장소비")).not.toBeInTheDocument();
        expect(screen.queryByText("500 JPY")).not.toBeInTheDocument();
        const movement = screen.getByLabelText("이동: 지하철, 24분, 180 JPY");
        expect(movement).toBeInTheDocument();
        expect(movement.querySelector("svg")).toBeInTheDocument();
        expect(
            screen.getByRole("button", {
                name: "호텔 니혼바시까지 이동방법 수정",
            }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "센소지 일정 수정" }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", {
                name: "호텔 니혼바시 일정 메뉴",
            }),
        ).toBeInTheDocument();
    });

    it("selects a map pin from the place card and keyboard focus button", async () => {
        const user = userEvent.setup();
        const onPlaceSelect = vi.fn();

        render(
            <TripPlaceTimeline
                activeDay={1}
                dayCount={5}
                onDeletePlace={vi.fn()}
                onMovePlace={vi.fn()}
                onPlaceSelect={onPlaceSelect}
                onReorder={vi.fn()}
                onUpdateInbound={vi.fn()}
                onUpdatePlace={vi.fn()}
                places={places}
                selectedPlaceId="place-1"
            />,
        );

        const card = screen
            .getByRole("heading", { name: "센소지" })
            .closest("article");
        const focusButton = screen.getByRole("button", {
            name: "지도에서 센소지 보기",
        });

        if (!card) {
            throw new Error("일정 카드를 찾지 못했습니다.");
        }

        expect(card).toHaveAttribute("data-selected", "true");
        expect(focusButton).toHaveAttribute("aria-pressed", "true");

        await user.click(card);
        focusButton.focus();
        await user.keyboard("{Enter}");

        expect(onPlaceSelect).toHaveBeenNthCalledWith(1, "place-1");
        expect(onPlaceSelect).toHaveBeenNthCalledWith(2, "place-1");
    });

    it("opens the requested schedule action menu", async () => {
        const user = userEvent.setup();

        render(
            <TripPlaceTimeline
                activeDay={1}
                dayCount={5}
                onDeletePlace={vi.fn()}
                onMovePlace={vi.fn()}
                onReorder={vi.fn()}
                onUpdateInbound={vi.fn()}
                onUpdatePlace={vi.fn()}
                places={places}
            />,
        );

        const menuButton = screen.getByRole("button", {
            name: "센소지 일정 메뉴",
        });
        await user.click(menuButton);

        const menu = menuButton.closest("details");

        if (!menu) {
            throw new Error("일정 드롭다운 메뉴를 찾지 못했습니다.");
        }

        const menuScope = within(menu);
        expect(
            menuScope.getByRole("button", { name: "도착시간 수정" }),
        ).toBeInTheDocument();
        expect(
            menuScope.getByRole("button", { name: "메모 수정" }),
        ).toBeInTheDocument();
        expect(
            menuScope.getByRole("button", { name: "일정 이동" }),
        ).toBeInTheDocument();
        expect(
            menuScope.getByRole("button", { name: "일정 삭제" }),
        ).toBeInTheDocument();
        expect(
            menuScope.queryByRole("button", { name: "위로 이동" }),
        ).not.toBeInTheDocument();
        expect(
            menuScope.queryByRole("button", { name: "아래로 이동" }),
        ).not.toBeInTheDocument();
        expect(menuScope.queryByText("예산 수정")).not.toBeInTheDocument();
    });

    it("updates a place arrival time from the schedule menu", async () => {
        const user = userEvent.setup();
        const onUpdatePlace = vi.fn();

        render(
            <TripPlaceTimeline
                activeDay={1}
                dayCount={5}
                onDeletePlace={vi.fn()}
                onMovePlace={vi.fn()}
                onReorder={vi.fn()}
                onUpdateInbound={vi.fn()}
                onUpdatePlace={onUpdatePlace}
                places={places}
            />,
        );

        const menuButton = screen.getByRole("button", {
            name: "호텔 니혼바시 일정 메뉴",
        });
        await user.click(menuButton);
        await user.click(
            within(menuButton.closest("details")!).getByRole("button", {
                name: "도착시간 수정",
            }),
        );
        const dialog = screen.getByRole("dialog", {
            name: "도착시간 수정",
        });
        fireEvent.change(within(dialog).getByLabelText("도착시간"), {
            target: { value: "13:20" },
        });
        await user.click(within(dialog).getByRole("button", { name: "저장" }));

        expect(onUpdatePlace).toHaveBeenCalledWith("place-2", {
            arrivalTime: "13:20",
        });
        expect(menuButton).toHaveFocus();
    });

    it("updates a place memo from the schedule menu", async () => {
        const user = userEvent.setup();
        const onUpdatePlace = vi.fn();

        render(
            <TripPlaceTimeline
                activeDay={1}
                dayCount={5}
                onDeletePlace={vi.fn()}
                onMovePlace={vi.fn()}
                onReorder={vi.fn()}
                onUpdateInbound={vi.fn()}
                onUpdatePlace={onUpdatePlace}
                places={places}
            />,
        );

        const menuButton = screen.getByRole("button", {
            name: "호텔 니혼바시 일정 메뉴",
        });
        await user.click(menuButton);
        await user.click(
            within(menuButton.closest("details")!).getByRole("button", {
                name: "메모 수정",
            }),
        );
        const dialog = screen.getByRole("dialog", { name: "메모 수정" });
        await user.type(within(dialog).getByLabelText("메모"), "예약 확인");
        await user.click(within(dialog).getByRole("button", { name: "저장" }));

        expect(onUpdatePlace).toHaveBeenCalledWith("place-2", {
            memo: "예약 확인",
        });
    });

    it("moves a place to another day from the schedule menu", async () => {
        const user = userEvent.setup();
        const onMovePlace = vi.fn();

        render(
            <TripPlaceTimeline
                activeDay={1}
                dayCount={5}
                onDeletePlace={vi.fn()}
                onMovePlace={onMovePlace}
                onReorder={vi.fn()}
                onUpdateInbound={vi.fn()}
                onUpdatePlace={vi.fn()}
                places={places}
            />,
        );

        const menuButton = screen.getByRole("button", {
            name: "호텔 니혼바시 일정 메뉴",
        });
        await user.click(menuButton);
        await user.click(
            within(menuButton.closest("details")!).getByRole("button", {
                name: "일정 이동",
            }),
        );
        const dialog = screen.getByRole("dialog", { name: "일정 이동" });
        await user.click(within(dialog).getByRole("radio", { name: "2일차" }));
        await user.click(within(dialog).getByRole("button", { name: "이동" }));

        expect(onMovePlace).toHaveBeenCalledWith("place-2", 2);
    });

    it("confirms schedule deletion before deleting a place", async () => {
        const user = userEvent.setup();
        const onDeletePlace = vi.fn();

        render(
            <TripPlaceTimeline
                activeDay={1}
                dayCount={5}
                onDeletePlace={onDeletePlace}
                onMovePlace={vi.fn()}
                onReorder={vi.fn()}
                onUpdateInbound={vi.fn()}
                onUpdatePlace={vi.fn()}
                places={places}
            />,
        );

        const menuButton = screen.getByRole("button", {
            name: "호텔 니혼바시 일정 메뉴",
        });
        await user.click(menuButton);
        await user.click(
            within(menuButton.closest("details")!).getByRole("button", {
                name: "일정 삭제",
            }),
        );
        const dialog = screen.getByRole("dialog", { name: "일정 삭제" });

        expect(onDeletePlace).not.toHaveBeenCalled();
        await user.click(within(dialog).getByRole("button", { name: "삭제" }));
        expect(onDeletePlace).toHaveBeenCalledWith("place-2");
    });

    it("reorders with pointer events without entering native browser drag mode", () => {
        const onReorder = vi.fn();
        const onPlaceSelect = vi.fn();

        render(
            <TripPlaceTimeline
                activeDay={1}
                dayCount={5}
                onDeletePlace={vi.fn()}
                onMovePlace={vi.fn()}
                onPlaceSelect={onPlaceSelect}
                onReorder={onReorder}
                onUpdateInbound={vi.fn()}
                onUpdatePlace={vi.fn()}
                places={places}
            />,
        );

        const firstCard = screen
            .getByRole("heading", { name: "센소지" })
            .closest("article");
        const secondCard = screen
            .getByRole("heading", { name: "호텔 니혼바시" })
            .closest("article");

        if (!firstCard || !secondCard) {
            throw new Error("일정 카드를 찾지 못했습니다.");
        }

        firstCard.getBoundingClientRect = vi.fn(() =>
            DOMRect.fromRect({ x: 0, y: 0, width: 300, height: 60 }),
        );
        secondCard.getBoundingClientRect = vi.fn(() =>
            DOMRect.fromRect({ x: 0, y: 70, width: 300, height: 60 }),
        );
        Object.defineProperties(firstCard, {
            hasPointerCapture: { value: vi.fn(() => true) },
            releasePointerCapture: { value: vi.fn() },
            setPointerCapture: { value: vi.fn() },
        });

        expect(firstCard).not.toHaveAttribute("draggable");
        fireEvent.pointerDown(firstCard, {
            button: 0,
            clientX: 20,
            clientY: 20,
            pointerId: 1,
            pointerType: "mouse",
        });
        fireEvent.pointerMove(firstCard, {
            clientX: 20,
            clientY: 90,
            pointerId: 1,
            pointerType: "mouse",
        });

        expect(firstCard.style.getPropertyValue("--drag-x")).toBe("0px");
        expect(firstCard.style.getPropertyValue("--drag-y")).toBe("70px");
        expect(secondCard).toHaveAttribute("data-drop-target", "true");

        fireEvent.pointerUp(firstCard, {
            clientX: 20,
            clientY: 90,
            pointerId: 1,
            pointerType: "mouse",
        });

        expect(onReorder).toHaveBeenCalledWith("place-1", "place-2");
        expect(firstCard).not.toHaveAttribute("data-dragging");
        expect(secondCard).not.toHaveAttribute("data-drop-target");
        expect(firstCard.style.getPropertyValue("--drag-x")).toBe("");
        expect(firstCard.style.getPropertyValue("--drag-y")).toBe("");

        fireEvent.click(firstCard);
        expect(onPlaceSelect).not.toHaveBeenCalled();

        fireEvent.click(firstCard);
        expect(onPlaceSelect).toHaveBeenCalledWith("place-1");
    });

    it("clears pointer drag state when the browser cancels the gesture", () => {
        const onReorder = vi.fn();

        render(
            <TripPlaceTimeline
                activeDay={1}
                dayCount={5}
                onDeletePlace={vi.fn()}
                onMovePlace={vi.fn()}
                onReorder={onReorder}
                onUpdateInbound={vi.fn()}
                onUpdatePlace={vi.fn()}
                places={places}
            />,
        );

        const firstCard = screen
            .getByRole("heading", { name: "센소지" })
            .closest("article");
        const secondCard = screen
            .getByRole("heading", { name: "호텔 니혼바시" })
            .closest("article");

        if (!firstCard || !secondCard) {
            throw new Error("일정 카드를 찾지 못했습니다.");
        }

        firstCard.getBoundingClientRect = vi.fn(() =>
            DOMRect.fromRect({ x: 0, y: 0, width: 300, height: 60 }),
        );
        secondCard.getBoundingClientRect = vi.fn(() =>
            DOMRect.fromRect({ x: 0, y: 70, width: 300, height: 60 }),
        );
        Object.defineProperties(firstCard, {
            hasPointerCapture: { value: vi.fn(() => true) },
            releasePointerCapture: { value: vi.fn() },
            setPointerCapture: { value: vi.fn() },
        });

        fireEvent.pointerDown(firstCard, {
            button: 0,
            clientX: 20,
            clientY: 20,
            pointerId: 1,
            pointerType: "mouse",
        });
        fireEvent.pointerMove(firstCard, {
            clientX: 20,
            clientY: 90,
            pointerId: 1,
            pointerType: "mouse",
        });
        fireEvent.pointerCancel(firstCard, {
            pointerId: 1,
            pointerType: "mouse",
        });

        expect(onReorder).not.toHaveBeenCalled();
        expect(firstCard).not.toHaveAttribute("data-dragging");
        expect(secondCard).not.toHaveAttribute("data-drop-target");
    });

    it("reorders by touch only after a long press", () => {
        vi.useFakeTimers();
        const onReorder = vi.fn();

        try {
            render(
                <TripPlaceTimeline
                    activeDay={1}
                    dayCount={5}
                    onDeletePlace={vi.fn()}
                    onMovePlace={vi.fn()}
                    onReorder={onReorder}
                    onUpdateInbound={vi.fn()}
                    onUpdatePlace={vi.fn()}
                    places={places}
                />,
            );

            const firstCard = screen
                .getByRole("heading", { name: "센소지" })
                .closest("article");
            const secondCard = screen
                .getByRole("heading", { name: "호텔 니혼바시" })
                .closest("article");

            if (!firstCard || !secondCard) {
                throw new Error("일정 카드를 찾지 못했습니다.");
            }

            firstCard.getBoundingClientRect = vi.fn(() =>
                DOMRect.fromRect({ x: 0, y: 0, width: 300, height: 60 }),
            );
            secondCard.getBoundingClientRect = vi.fn(() =>
                DOMRect.fromRect({ x: 0, y: 70, width: 300, height: 60 }),
            );
            Object.defineProperties(firstCard, {
                hasPointerCapture: { value: vi.fn(() => true) },
                releasePointerCapture: { value: vi.fn() },
                setPointerCapture: { value: vi.fn() },
            });

            fireEvent.pointerDown(firstCard, {
                button: 0,
                clientX: 20,
                clientY: 20,
                pointerId: 2,
                pointerType: "touch",
            });
            act(() => vi.advanceTimersByTime(349));
            expect(firstCard).not.toHaveAttribute("data-dragging");

            act(() => vi.advanceTimersByTime(1));
            expect(firstCard).toHaveAttribute("data-dragging", "true");
            fireEvent.touchMove(document, {
                touches: [{ clientX: 20, clientY: 90 }],
            });

            expect(firstCard.style.getPropertyValue("--drag-x")).toBe("0px");
            expect(firstCard.style.getPropertyValue("--drag-y")).toBe("70px");
            expect(secondCard).toHaveAttribute("data-drop-target", "true");

            fireEvent.touchEnd(document, {
                changedTouches: [{ clientX: 20, clientY: 90 }],
                touches: [],
            });

            expect(onReorder).toHaveBeenCalledWith("place-1", "place-2");
            expect(firstCard).not.toHaveAttribute("data-dragging");
            expect(secondCard).not.toHaveAttribute("data-drop-target");
            expect(firstCard.style.getPropertyValue("--drag-x")).toBe("");
            expect(firstCard.style.getPropertyValue("--drag-y")).toBe("");
        } finally {
            vi.useRealTimers();
        }
    });

    it("keeps touch scrolling when the finger moves before the long press", () => {
        vi.useFakeTimers();
        const onReorder = vi.fn();

        try {
            render(
                <TripPlaceTimeline
                    activeDay={1}
                    dayCount={5}
                    onDeletePlace={vi.fn()}
                    onMovePlace={vi.fn()}
                    onReorder={onReorder}
                    onUpdateInbound={vi.fn()}
                    onUpdatePlace={vi.fn()}
                    places={places}
                />,
            );

            const firstCard = screen
                .getByRole("heading", { name: "센소지" })
                .closest("article");

            if (!firstCard) {
                throw new Error("일정 카드를 찾지 못했습니다.");
            }

            fireEvent.pointerDown(firstCard, {
                button: 0,
                clientX: 20,
                clientY: 20,
                pointerId: 3,
                pointerType: "touch",
            });
            fireEvent.touchMove(document, {
                touches: [{ clientX: 20, clientY: 32 }],
            });
            act(() => vi.advanceTimersByTime(500));

            expect(firstCard).not.toHaveAttribute("data-dragging");
            expect(onReorder).not.toHaveBeenCalled();
        } finally {
            vi.useRealTimers();
        }
    });

    it("adds spacing between bookmarked place cards", () => {
        const bookmarks = places.map((place) => ({
            ...place,
            day: "bookmark" as const,
            order: null,
            arrivalTime: null,
            inbound: {
                mode: null,
                durationMin: null,
                cost: null,
                isPassCovered: false,
            },
        }));

        render(
            <TripPlaceTimeline
                activeDay="bookmark"
                dayCount={5}
                onDeletePlace={vi.fn()}
                onMovePlace={vi.fn()}
                onReorder={vi.fn()}
                onUpdateInbound={vi.fn()}
                onUpdatePlace={vi.fn()}
                places={bookmarks}
            />,
        );

        expect(screen.getByRole("list")).toHaveClass(styles.bookmarkList);
    });

    it("edits a movement and removes cost when walking is selected", async () => {
        const user = userEvent.setup();
        const onUpdateInbound = vi.fn();

        render(
            <TripPlaceTimeline
                activeDay={1}
                dayCount={5}
                onDeletePlace={vi.fn()}
                onMovePlace={vi.fn()}
                onReorder={vi.fn()}
                onUpdateInbound={onUpdateInbound}
                onUpdatePlace={vi.fn()}
                places={places}
            />,
        );

        await user.click(
            screen.getByRole("button", {
                name: "호텔 니혼바시까지 이동방법 수정",
            }),
        );

        expect(
            screen.getByRole("dialog", { name: "이동방법 수정" }),
        ).toBeInTheDocument();
        const modeSelect = screen.getByRole("combobox", {
            name: "이동방법",
        });
        expect(modeSelect).toHaveFocus();
        expect(modeSelect.querySelector("svg")).toBeInTheDocument();
        await user.click(modeSelect);
        const walkOption = screen.getByRole("option", { name: "도보" });
        expect(walkOption.querySelector("svg")).toBeInTheDocument();
        await user.click(walkOption);
        const durationInput = screen.getByLabelText("예상 소요시간");
        await user.clear(durationInput);
        await user.type(durationInput, "30");

        expect(screen.getByLabelText("교통비 (JPY)")).toBeDisabled();
        expect(screen.getByLabelText("패스권이에요")).toBeDisabled();
        await user.click(screen.getByRole("button", { name: "저장" }));

        expect(onUpdateInbound).toHaveBeenCalledWith("place-2", {
            mode: "walk",
            durationMin: 30,
            cost: null,
            isPassCovered: false,
        });
    });

    it("supports keyboard navigation in the movement dropdown", async () => {
        const user = userEvent.setup();

        render(
            <TripPlaceTimeline
                activeDay={1}
                dayCount={5}
                onDeletePlace={vi.fn()}
                onMovePlace={vi.fn()}
                onReorder={vi.fn()}
                onUpdateInbound={vi.fn()}
                onUpdatePlace={vi.fn()}
                places={places}
            />,
        );

        await user.click(
            screen.getByRole("button", {
                name: "호텔 니혼바시까지 이동방법 수정",
            }),
        );
        const modeSelect = screen.getByRole("combobox", {
            name: "이동방법",
        });
        await user.keyboard("{ArrowDown}");

        expect(screen.getByRole("listbox")).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "지하철" })).toHaveFocus();
        await user.keyboard("{ArrowDown}{Enter}");

        expect(modeSelect).toHaveTextContent("기차");
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
        expect(modeSelect).toHaveFocus();
    });

    it("stores a pass-covered movement without a separate fare", async () => {
        const user = userEvent.setup();
        const onUpdateInbound = vi.fn();

        render(
            <TripPlaceTimeline
                activeDay={1}
                dayCount={5}
                onDeletePlace={vi.fn()}
                onMovePlace={vi.fn()}
                onReorder={vi.fn()}
                onUpdateInbound={onUpdateInbound}
                onUpdatePlace={vi.fn()}
                places={places}
            />,
        );

        await user.click(
            screen.getByRole("button", {
                name: "호텔 니혼바시까지 이동방법 수정",
            }),
        );
        await user.click(screen.getByLabelText("패스권이에요"));

        expect(screen.getByLabelText("교통비 (JPY)")).toBeDisabled();
        await user.click(screen.getByRole("button", { name: "저장" }));

        expect(onUpdateInbound).toHaveBeenCalledWith("place-2", {
            mode: "subway",
            durationMin: 24,
            cost: null,
            isPassCovered: true,
        });
    });

    it("stores a manually entered transport fare", async () => {
        const user = userEvent.setup();
        const onUpdateInbound = vi.fn();

        render(
            <TripPlaceTimeline
                activeDay={1}
                dayCount={5}
                onDeletePlace={vi.fn()}
                onMovePlace={vi.fn()}
                onReorder={vi.fn()}
                onUpdateInbound={onUpdateInbound}
                onUpdatePlace={vi.fn()}
                places={places}
            />,
        );

        await user.click(
            screen.getByRole("button", {
                name: "호텔 니혼바시까지 이동방법 수정",
            }),
        );
        const costInput = screen.getByLabelText("교통비 (JPY)");
        await user.clear(costInput);
        await user.type(costInput, "250");
        await user.click(screen.getByRole("button", { name: "저장" }));

        expect(onUpdateInbound).toHaveBeenCalledWith("place-2", {
            mode: "subway",
            durationMin: 24,
            cost: { amount: 250, currency: "JPY" },
            isPassCovered: false,
        });
    });
});
