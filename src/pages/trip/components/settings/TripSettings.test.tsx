import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { initialTrips } from "../../../../trips/store";
import { TripSettings } from "./TripSettings";

const noExpenseMembers = new Set<string>();

describe("TripSettings", () => {
    it("shows the editable values collected during trip creation", () => {
        render(
            <TripSettings
                expenseMemberIds={noExpenseMembers}
                mapStyleId="positron"
                onMapStyleSave={vi.fn()}
                trip={initialTrips[0]}
                onSave={vi.fn()}
            />,
        );

        expect(screen.getByLabelText("여행 이름")).toHaveValue("도쿄 4박 5일");
        expect(screen.queryByLabelText("국가")).not.toBeInTheDocument();
        expect(screen.getByText("일본 · JPY")).toBeVisible();
        expect(screen.getByLabelText("출발일")).toHaveValue("2026-10-08");
        expect(screen.getByLabelText("도착일")).toHaveValue("2026-10-12");
        expect(screen.getByLabelText("당일치기예요")).not.toBeChecked();
        expect(screen.getByLabelText("본인 이름")).toHaveValue("나");
        expect(screen.getByLabelText("동행 1 이름")).toHaveValue("민지");
        expect(screen.getByLabelText("가는 교통수단")).toHaveValue("flight");
        expect(screen.getByLabelText("여행지 공항·항구")).toHaveValue("jp-hnd");
        expect(screen.getByLabelText("돌아오는 편이 달라요")).not.toBeChecked();
        expect(screen.getByLabelText("지도 스타일")).toHaveValue("positron");
    });

    it("edits members and saves a different return route", async () => {
        const user = userEvent.setup();
        const onMapStyleSave = vi.fn();
        const onSave = vi.fn();

        render(
            <TripSettings
                expenseMemberIds={noExpenseMembers}
                mapStyleId="positron"
                onMapStyleSave={onMapStyleSave}
                trip={initialTrips[0]}
                onSave={onSave}
            />,
        );

        const nameInput = screen.getByLabelText("여행 이름");
        await user.clear(nameInput);
        await user.type(nameInput, "도쿄 미식 여행");
        const companionInput = screen.getByLabelText("동행 1 이름");
        await user.clear(companionInput);
        await user.type(companionInput, "수진");
        await user.click(screen.getByLabelText("돌아오는 편이 달라요"));
        await user.selectOptions(
            screen.getByLabelText("돌아오는 교통수단"),
            "ship",
        );
        await user.selectOptions(
            screen.getByLabelText("돌아오는 공항·항구"),
            "jp-hakata-port",
        );
        await user.selectOptions(screen.getByLabelText("지도 스타일"), "dark");
        await user.click(screen.getByRole("button", { name: "설정 저장" }));

        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "도쿄 미식 여행",
                members: [
                    expect.objectContaining({ name: "나" }),
                    expect.objectContaining({ name: "수진" }),
                ],
                returnTransportType: "ship",
                departureHub: expect.objectContaining({
                    id: "jp-hakata-port",
                }),
            }),
        );
        expect(onSave.mock.calls[0][0]).not.toHaveProperty("mapStyle");
        expect(onMapStyleSave).toHaveBeenCalledWith("dark");
        expect(screen.getByText("여행 설정을 저장했습니다.")).toBeVisible();
    });

    it("keeps both dates together when the trip becomes a day trip", async () => {
        const user = userEvent.setup();
        const onSave = vi.fn();

        render(
            <TripSettings
                expenseMemberIds={noExpenseMembers}
                mapStyleId="positron"
                onMapStyleSave={vi.fn()}
                trip={initialTrips[0]}
                onSave={onSave}
            />,
        );

        await user.click(screen.getByLabelText("당일치기예요"));

        expect(screen.getByLabelText("도착일")).toBeDisabled();
        expect(screen.getByLabelText("도착일")).toHaveValue("2026-10-08");

        await user.click(screen.getByRole("button", { name: "설정 저장" }));

        expect(onSave).toHaveBeenCalledWith(
            expect.objectContaining({
                startDate: "2026-10-08",
                endDate: "2026-10-08",
            }),
        );
    });

    it("blocks removing a member referenced by budget entries", async () => {
        const user = userEvent.setup();

        render(
            <TripSettings
                expenseMemberIds={new Set(["japan-member-1"])}
                mapStyleId="positron"
                onMapStyleSave={vi.fn()}
                trip={initialTrips[0]}
                onSave={vi.fn()}
            />,
        );

        await user.click(screen.getByRole("button", { name: "민지 삭제" }));

        expect(screen.getByLabelText("동행 1 이름")).toHaveValue("민지");
        expect(
            screen.getByText(
                "예산 내역에 포함된 동행은 삭제할 수 없습니다. 민지의 정산 정보를 먼저 수정해 주세요.",
            ),
        ).toBeVisible();
    });

    it("removes a member who is not referenced by budget entries", async () => {
        const user = userEvent.setup();

        render(
            <TripSettings
                expenseMemberIds={noExpenseMembers}
                mapStyleId="positron"
                onMapStyleSave={vi.fn()}
                trip={initialTrips[0]}
                onSave={vi.fn()}
            />,
        );

        await user.click(screen.getByRole("button", { name: "민지 삭제" }));

        expect(screen.queryByLabelText("동행 1 이름")).not.toBeInTheDocument();
    });
});
