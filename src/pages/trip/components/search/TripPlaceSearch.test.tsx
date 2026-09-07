import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchPlaces } from "../../../../places/search";
import { TripPlaceSearch } from "./TripPlaceSearch";

vi.mock("../../../../places/search", async (importOriginal) => {
    const original =
        await importOriginal<typeof import("../../../../places/search")>();

    return {
        ...original,
        searchPlaces: vi.fn(),
    };
});

const mockedSearchPlaces = vi.mocked(searchPlaces);

describe("TripPlaceSearch", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("waits for an explicit submission before searching", async () => {
        const user = userEvent.setup();
        const onPlaceAdd = vi.fn();
        const onPlaceSelect = vi.fn();
        mockedSearchPlaces.mockResolvedValue([
            {
                id: "way-173154847",
                name: "센소지",
                address: "다이토구, 도쿄도, 일본",
                coordinates: {
                    latitude: 35.7134032,
                    longitude: 139.7955265,
                },
            },
        ]);

        render(
            <TripPlaceSearch
                countryCode="JP"
                countryName="일본"
                dayCount={3}
                defaultDay={3}
                onPlaceAdd={onPlaceAdd}
                onPlaceSelect={onPlaceSelect}
                searchCenter={{ latitude: 35.5494, longitude: 139.7798 }}
                searchRegion="도쿄"
            />,
        );

        const input = screen.getByRole("searchbox", {
            name: "장소명 또는 주소",
        });
        expect(input).toHaveAccessibleDescription("검색 우선 지역 · 도쿄");
        await user.type(input, "센소지");

        expect(mockedSearchPlaces).not.toHaveBeenCalled();

        await user.click(screen.getByRole("button", { name: "검색" }));

        expect(mockedSearchPlaces).toHaveBeenCalledTimes(1);
        expect(mockedSearchPlaces).toHaveBeenCalledWith("센소지", "JP", {
            center: { latitude: 35.5494, longitude: 139.7798 },
            region: "도쿄",
            signal: expect.any(AbortSignal),
        });
        expect(await screen.findByText("센소지")).toBeInTheDocument();
        expect(screen.getByText("다이토구, 도쿄도, 일본")).toBeInTheDocument();
        expect(screen.getByRole("status")).toHaveTextContent(
            "‘센소지’ 검색 결과 1개",
        );

        await user.click(
            screen.getByRole("button", { name: "지도에서 센소지 보기" }),
        );

        expect(onPlaceSelect).toHaveBeenLastCalledWith(
            expect.objectContaining({ id: "way-173154847" }),
        );

        const addButton = screen.getByRole("button", {
            name: "센소지 일정에 추가",
        });
        await user.click(addButton);

        const dialog = screen.getByRole("dialog", { name: "일정에 추가" });
        expect(screen.getByRole("radio", { name: "3일차" })).toBeChecked();
        await user.click(screen.getByRole("radio", { name: "북마크" }));
        await user.click(screen.getByRole("button", { name: "추가" }));

        expect(onPlaceAdd).toHaveBeenCalledWith(
            expect.objectContaining({ id: "way-173154847" }),
            "bookmark",
        );
        expect(dialog).not.toBeInTheDocument();
        expect(addButton).toHaveFocus();
    });

    it("shows an empty result without changing the search scope", async () => {
        const user = userEvent.setup();
        mockedSearchPlaces.mockResolvedValue([]);

        render(
            <TripPlaceSearch
                countryCode="KR"
                countryName="한국"
                dayCount={3}
                defaultDay={1}
                onPlaceAdd={vi.fn()}
                onPlaceSelect={vi.fn()}
            />,
        );

        await user.type(
            screen.getByRole("searchbox", { name: "장소명 또는 주소" }),
            "없는 장소",
        );
        await user.click(screen.getByRole("button", { name: "검색" }));

        expect(
            await screen.findByText(
                "‘없는 장소’의 정확한 검색 결과가 없어요. 건물명이나 가까운 명소로 검색해 보세요.",
            ),
        ).toBeInTheDocument();
        expect(screen.getByText("검색 우선 지역 · 한국")).toBeInTheDocument();
    });
});
