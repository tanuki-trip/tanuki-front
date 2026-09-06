import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import type { TripPlace } from "../../../../places/model";
import { TripBudget } from "./TripBudget";

const members = [
    { id: "owner", name: "나" },
    { id: "member-1", name: "민지" },
];

const places: TripPlace[] = [
    {
        id: "station",
        name: "도쿄역",
        address: "도쿄도 지요다구",
        coordinates: { latitude: 35.6812, longitude: 139.7671 },
        day: 1,
        order: 0,
        arrivalTime: "09:00",
        memo: null,
        placeCost: { amount: 3_000, currency: "JPY", category: "food" },
        inbound: {
            mode: null,
            durationMin: null,
            cost: null,
            isPassCovered: false,
        },
        fixedPosition: null,
    },
    {
        id: "tower",
        name: "도쿄 타워",
        address: "도쿄도 미나토구",
        coordinates: { latitude: 35.6586, longitude: 139.7454 },
        day: 1,
        order: 1,
        arrivalTime: "11:00",
        memo: null,
        placeCost: {
            amount: 5_000,
            currency: "JPY",
            category: "tourism",
        },
        inbound: {
            mode: "subway",
            durationMin: 20,
            cost: { amount: 500, currency: "JPY" },
            isPassCovered: false,
        },
        fixedPosition: null,
    },
    {
        id: "bookmark",
        name: "후보 장소",
        address: "도쿄도",
        coordinates: { latitude: 35.6, longitude: 139.7 },
        day: "bookmark",
        order: null,
        arrivalTime: null,
        memo: null,
        placeCost: { amount: 7_000, currency: "JPY" },
        inbound: {
            mode: "bus",
            durationMin: 15,
            cost: { amount: 300, currency: "JPY" },
            isPassCovered: false,
        },
        fixedPosition: null,
    },
];

describe("TripBudget", () => {
    it("summarizes scheduled place and transport costs", async () => {
        const user = userEvent.setup();

        render(
            <TripBudget
                activeDay={1}
                currencyCode="JPY"
                endDate="2026-10-09"
                members={members}
                onDayChange={vi.fn()}
                onInboundChange={vi.fn()}
                onPlaceCostChange={vi.fn()}
                onTotalBudgetChange={vi.fn()}
                places={places}
                startDate="2026-10-08"
                totalBudgetAmount={20_000}
            />,
        );

        const summary = screen.getByRole("region", { name: "예산 요약" });
        expect(within(summary).getByText("20,000 JPY")).toBeVisible();
        expect(within(summary).getByText("8,500 JPY")).toBeVisible();
        expect(within(summary).getByText("500 JPY")).toBeVisible();
        expect(within(summary).getByText("3,000 JPY")).toBeVisible();
        expect(within(summary).getByText("5,000 JPY")).toBeVisible();
        expect(within(summary).getByText("남은 예산 11,500 JPY")).toBeVisible();
        expect(
            within(summary).getByRole("group", {
                name: "개인별 정산 금액",
            }),
        ).not.toBeVisible();
        await user.click(
            within(summary).getByRole("button", {
                name: "개인별 정산 세부 보기",
            }),
        );
        const settlements = within(summary).getByRole("group", {
            name: "개인별 정산 금액",
        });
        expect(within(settlements).getByText("나")).toBeVisible();
        expect(within(settlements).getByText("민지")).toBeVisible();
        expect(within(settlements).getAllByText("4,250 JPY")).toHaveLength(3);
        expect(within(settlements).getByText("민지 → 나")).toBeVisible();

        const timeline = screen.getByRole("region", { name: "1일차 예산" });
        expect(within(timeline).getByText("도쿄역")).toBeVisible();
        expect(within(timeline).getByText("도쿄 타워")).toBeVisible();
        expect(within(timeline).queryByText("09:00")).not.toBeInTheDocument();
        expect(within(timeline).getByText("3,000 JPY")).toBeVisible();
    });

    it("keeps the shared day navigation interactive", async () => {
        const user = userEvent.setup();
        const onDayChange = vi.fn();

        render(
            <TripBudget
                activeDay={1}
                currencyCode="JPY"
                endDate="2026-10-09"
                members={members}
                onDayChange={onDayChange}
                onInboundChange={vi.fn()}
                onPlaceCostChange={vi.fn()}
                onTotalBudgetChange={vi.fn()}
                places={places}
                startDate="2026-10-08"
                totalBudgetAmount={null}
            />,
        );

        await user.click(
            screen.getByRole("button", {
                name: "2일차, 10월 9일 금요일",
            }),
        );

        expect(onDayChange).toHaveBeenCalledWith(2);
    });

    it("edits the total budget and a scheduled place cost", async () => {
        const user = userEvent.setup();

        function BudgetHarness() {
            const [currentPlaces, setCurrentPlaces] = useState(places);
            const [totalBudgetAmount, setTotalBudgetAmount] = useState<
                number | null
            >(null);

            return (
                <TripBudget
                    activeDay={1}
                    currencyCode="JPY"
                    endDate="2026-10-09"
                    members={members}
                    onDayChange={vi.fn()}
                    onInboundChange={vi.fn()}
                    onPlaceCostChange={(placeId, cost) =>
                        setCurrentPlaces((current) =>
                            current.map((place) =>
                                place.id === placeId
                                    ? { ...place, placeCost: cost }
                                    : place,
                            ),
                        )
                    }
                    onTotalBudgetChange={setTotalBudgetAmount}
                    places={currentPlaces}
                    startDate="2026-10-08"
                    totalBudgetAmount={totalBudgetAmount}
                />
            );
        }

        render(<BudgetHarness />);

        await user.click(
            screen.getByRole("button", {
                name: "총 예산 설정, 현재 미설정",
            }),
        );
        let dialog = screen.getByRole("dialog", { name: "총 예산 설정" });
        await user.type(
            within(dialog).getByLabelText("총 예산 (JPY)"),
            "20000",
        );
        await user.click(within(dialog).getByRole("button", { name: "저장" }));

        expect(
            screen.getByRole("button", {
                name: "총 예산 설정, 현재 20,000 JPY",
            }),
        ).toBeVisible();

        await user.click(
            screen.getByRole("button", { name: /도쿄역 금액 수정/ }),
        );
        dialog = screen.getByRole("dialog", { name: "일정 금액 수정" });
        await user.click(within(dialog).getByRole("radio", { name: "관광비" }));
        const placeAmountInput =
            within(dialog).getByLabelText("총 사용 금액 (JPY)");
        await user.clear(placeAmountInput);
        await user.type(placeAmountInput, "4500");

        await user.click(
            within(dialog).getByRole("checkbox", { name: "N빵이에요" }),
        );
        const ownerAmountInput = within(dialog).getByRole("spinbutton", {
            name: "나 금액",
        });
        const memberAmountInput = within(dialog).getByRole("spinbutton", {
            name: "민지 금액",
        });
        expect(ownerAmountInput).toHaveValue(2_250);
        expect(memberAmountInput).toHaveValue(2_250);
        expect(within(dialog).getByRole("radio", { name: "나" })).toBeChecked();

        await user.clear(ownerAmountInput);
        await user.type(ownerAmountInput, "2000");
        await user.clear(memberAmountInput);
        await user.type(memberAmountInput, "2000");
        await user.click(within(dialog).getByRole("button", { name: "저장" }));

        expect(within(dialog).getByRole("alert")).toHaveTextContent(
            "합계 4,000 / 총 사용 금액 4,500 JPY · 금액이 일치하지 않습니다.",
        );
        expect(
            screen.getByRole("dialog", { name: "일정 금액 수정" }),
        ).toBeVisible();

        await user.clear(memberAmountInput);
        await user.type(memberAmountInput, "2500");
        await user.click(within(dialog).getByRole("button", { name: "저장" }));

        expect(
            screen.getByRole("button", {
                name: "도쿄역 금액 수정, 현재 4,500 JPY",
            }),
        ).toBeVisible();
        const summary = screen.getByRole("region", { name: "예산 요약" });
        expect(within(summary).getByText("10,000 JPY")).toBeVisible();
        expect(within(summary).getByText("9,500 JPY")).toBeVisible();
        await user.click(
            within(summary).getByRole("button", {
                name: "개인별 정산 세부 보기",
            }),
        );
        const settlements = within(summary).getByRole("group", {
            name: "개인별 정산 금액",
        });
        expect(within(settlements).getByText("4,750 JPY")).toBeVisible();
        expect(within(settlements).getAllByText("5,250 JPY")).toHaveLength(2);
        expect(within(settlements).getByText("민지 → 나")).toBeVisible();
    });

    it("stores excluded members for an equal split", async () => {
        const user = userEvent.setup();
        const onPlaceCostChange = vi.fn();

        render(
            <TripBudget
                activeDay={1}
                currencyCode="JPY"
                endDate="2026-10-09"
                members={members}
                onDayChange={vi.fn()}
                onInboundChange={vi.fn()}
                onPlaceCostChange={onPlaceCostChange}
                onTotalBudgetChange={vi.fn()}
                places={places}
                startDate="2026-10-08"
                totalBudgetAmount={null}
            />,
        );

        await user.click(
            screen.getByRole("button", { name: /도쿄역 금액 수정/ }),
        );
        const dialog = screen.getByRole("dialog", {
            name: "일정 금액 수정",
        });
        await user.click(
            within(dialog).getByRole("checkbox", { name: "민지 제외" }),
        );
        await user.click(within(dialog).getByRole("radio", { name: "민지" }));
        await user.click(within(dialog).getByRole("button", { name: "저장" }));

        expect(onPlaceCostChange).toHaveBeenCalledWith(
            "station",
            expect.objectContaining({
                payerId: "member-1",
                split: {
                    mode: "equal",
                    excludedMemberIds: ["member-1"],
                },
            }),
        );
    });

    it("selects each-person payment independently from individual amounts", async () => {
        const user = userEvent.setup();
        const onPlaceCostChange = vi.fn();

        render(
            <TripBudget
                activeDay={1}
                currencyCode="JPY"
                endDate="2026-10-09"
                members={members}
                onDayChange={vi.fn()}
                onInboundChange={vi.fn()}
                onPlaceCostChange={onPlaceCostChange}
                onTotalBudgetChange={vi.fn()}
                places={places}
                startDate="2026-10-08"
                totalBudgetAmount={null}
            />,
        );

        await user.click(
            screen.getByRole("button", { name: /도쿄역 금액 수정/ }),
        );
        const dialog = screen.getByRole("dialog", { name: "일정 금액 수정" });
        await user.click(
            within(dialog).getByRole("checkbox", { name: "N빵이에요" }),
        );
        const individualAmounts = within(dialog).getByRole("group", {
            name: "개인별 금액",
        });
        expect(
            within(dialog).queryByText("각자 현장에서 결제했어요"),
        ).not.toBeInTheDocument();
        const ownerAmountInput = within(individualAmounts).getByRole(
            "spinbutton",
            { name: "나 금액" },
        );
        const memberAmountInput = within(individualAmounts).getByRole(
            "spinbutton",
            { name: "민지 금액" },
        );
        expect(ownerAmountInput).toHaveValue(1_500);
        expect(memberAmountInput).toHaveValue(1_500);

        await user.clear(ownerAmountInput);
        await user.type(ownerAmountInput, "1000");
        await user.clear(memberAmountInput);
        await user.type(memberAmountInput, "2000");
        const payerOptions = within(dialog).getByRole("group", {
            name: "결제자",
        });
        await user.click(
            within(payerOptions).getByRole("radio", { name: "각자 계산" }),
        );
        expect(
            within(payerOptions).getByRole("radio", { name: "각자 계산" }),
        ).toBeChecked();
        await user.click(within(dialog).getByRole("button", { name: "저장" }));

        expect(onPlaceCostChange).toHaveBeenCalledWith(
            "station",
            expect.objectContaining({
                amount: 3_000,
                paymentMode: "individual",
                split: {
                    mode: "individual",
                    memberAmounts: { owner: 1_000, "member-1": 2_000 },
                },
            }),
        );
        expect(onPlaceCostChange.mock.calls[0]?.[1]).not.toHaveProperty(
            "payerId",
        );
    });

    it("prefills individual amounts with an exact equal split", async () => {
        const user = userEvent.setup();

        render(
            <TripBudget
                activeDay={1}
                currencyCode="JPY"
                endDate="2026-10-09"
                members={members}
                onDayChange={vi.fn()}
                onInboundChange={vi.fn()}
                onPlaceCostChange={vi.fn()}
                onTotalBudgetChange={vi.fn()}
                places={places}
                startDate="2026-10-08"
                totalBudgetAmount={null}
            />,
        );

        await user.click(
            screen.getByRole("button", { name: /도쿄역 금액 수정/ }),
        );
        const dialog = screen.getByRole("dialog", { name: "일정 금액 수정" });
        const amountInput = within(dialog).getByLabelText("총 사용 금액 (JPY)");
        await user.clear(amountInput);
        await user.type(amountInput, "3001");
        await user.click(
            within(dialog).getByRole("checkbox", { name: "N빵이에요" }),
        );

        expect(
            within(dialog).getByRole("spinbutton", { name: "나 금액" }),
        ).toHaveValue(1_501);
        expect(
            within(dialog).getByRole("spinbutton", { name: "민지 금액" }),
        ).toHaveValue(1_500);
        expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
    });

    it("edits transport cost, payer, and split from the budget timeline", async () => {
        const user = userEvent.setup();
        const onInboundChange = vi.fn();

        render(
            <TripBudget
                activeDay={1}
                currencyCode="JPY"
                endDate="2026-10-09"
                members={members}
                onDayChange={vi.fn()}
                onInboundChange={onInboundChange}
                onPlaceCostChange={vi.fn()}
                onTotalBudgetChange={vi.fn()}
                places={places}
                startDate="2026-10-08"
                totalBudgetAmount={null}
            />,
        );

        await user.click(
            screen.getByRole("button", {
                name: "도쿄 타워까지 교통비 수정",
            }),
        );
        const dialog = screen.getByRole("dialog", { name: "교통비 수정" });
        expect(
            within(dialog).queryByRole("combobox", { name: "이동방법" }),
        ).not.toBeInTheDocument();
        expect(
            within(dialog).queryByLabelText("예상 소요시간"),
        ).not.toBeInTheDocument();

        const costInput = within(dialog).getByLabelText("교통비 (JPY)");
        await user.clear(costInput);
        await user.type(costInput, "650");
        await user.click(within(dialog).getByRole("radio", { name: "민지" }));
        await user.click(
            within(dialog).getByRole("checkbox", { name: "나 제외" }),
        );
        await user.click(within(dialog).getByRole("button", { name: "저장" }));

        expect(onInboundChange).toHaveBeenCalledWith("tower", {
            mode: "subway",
            durationMin: 20,
            cost: { amount: 650, currency: "JPY" },
            isPassCovered: false,
            payerId: "member-1",
            split: {
                mode: "equal",
                excludedMemberIds: ["owner"],
            },
        });
    });

    it("marks transport as pass-covered without a separate fare", async () => {
        const user = userEvent.setup();
        const onInboundChange = vi.fn();

        render(
            <TripBudget
                activeDay={1}
                currencyCode="JPY"
                endDate="2026-10-09"
                members={members}
                onDayChange={vi.fn()}
                onInboundChange={onInboundChange}
                onPlaceCostChange={vi.fn()}
                onTotalBudgetChange={vi.fn()}
                places={places}
                startDate="2026-10-08"
                totalBudgetAmount={null}
            />,
        );

        await user.click(
            screen.getByRole("button", {
                name: "도쿄 타워까지 교통비 수정",
            }),
        );
        const dialog = screen.getByRole("dialog", { name: "교통비 수정" });
        await user.click(within(dialog).getByLabelText("패스권이에요"));

        expect(within(dialog).getByLabelText("교통비 (JPY)")).toBeDisabled();
        expect(
            within(dialog).queryByRole("group", { name: "결제자" }),
        ).not.toBeInTheDocument();
        await user.click(within(dialog).getByRole("button", { name: "저장" }));

        expect(onInboundChange).toHaveBeenCalledWith("tower", {
            mode: "subway",
            durationMin: 20,
            cost: null,
            isPassCovered: true,
        });
    });

    it("allows a pass-covered transport segment to use a fare again", async () => {
        const user = userEvent.setup();
        const onInboundChange = vi.fn();
        const passCoveredPlaces = places.map((place) =>
            place.id === "tower"
                ? {
                      ...place,
                      inbound: {
                          ...place.inbound,
                          cost: null,
                          isPassCovered: true,
                      },
                  }
                : place,
        );

        render(
            <TripBudget
                activeDay={1}
                currencyCode="JPY"
                endDate="2026-10-09"
                members={members}
                onDayChange={vi.fn()}
                onInboundChange={onInboundChange}
                onPlaceCostChange={vi.fn()}
                onTotalBudgetChange={vi.fn()}
                places={passCoveredPlaces}
                startDate="2026-10-08"
                totalBudgetAmount={null}
            />,
        );

        await user.click(
            screen.getByRole("button", {
                name: "도쿄 타워까지 교통비 수정",
            }),
        );
        const dialog = screen.getByRole("dialog", { name: "교통비 수정" });
        const passCheckbox = within(dialog).getByLabelText("패스권이에요");
        const costInput = within(dialog).getByLabelText("교통비 (JPY)");
        expect(costInput).toBeDisabled();
        expect(costInput).toHaveValue(null);

        await user.click(passCheckbox);
        await user.type(costInput, "300");
        await user.click(within(dialog).getByRole("button", { name: "저장" }));

        expect(onInboundChange).toHaveBeenCalledWith("tower", {
            mode: "subway",
            durationMin: 20,
            cost: { amount: 300, currency: "JPY" },
            isPassCovered: false,
            payerId: "owner",
            split: { mode: "equal", excludedMemberIds: [] },
        });
    });

    it("shows the exceeded amount when spending is over the total budget", () => {
        render(
            <TripBudget
                activeDay={1}
                currencyCode="JPY"
                endDate="2026-10-09"
                members={members}
                onDayChange={vi.fn()}
                onInboundChange={vi.fn()}
                onPlaceCostChange={vi.fn()}
                onTotalBudgetChange={vi.fn()}
                places={places}
                startDate="2026-10-08"
                totalBudgetAmount={5_000}
            />,
        );

        expect(screen.getByText("예산 초과 3,500 JPY")).toBeVisible();
    });
});
