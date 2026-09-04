import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { useAuthStore } from "../../../auth/store";
import { initialTrips, useTripStore } from "../../../trips/store";
import { CreateTripPage } from ".";
import { formatCompactTripPeriod, toTripDateString } from "./trip-form";

const initialAuthState = useAuthStore.getState();
const displayedMonth = new Date();
const rangeStart = new Date(
    displayedMonth.getFullYear(),
    displayedMonth.getMonth(),
    5,
);
const rangeEnd = new Date(
    displayedMonth.getFullYear(),
    displayedMonth.getMonth(),
    9,
);
const dayTripDate = new Date(
    displayedMonth.getFullYear(),
    displayedMonth.getMonth(),
    14,
);

function getDayButtonName(date: Date) {
    return new RegExp(
        `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`,
    );
}

function renderCreateTripPage() {
    return render(
        <MemoryRouter initialEntries={["/trips/new"]}>
            <Routes>
                <Route path="/trips/new" element={<CreateTripPage />} />
                <Route path="/" element={<p>여행 목록으로 이동</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

function setupUser() {
    return userEvent.setup();
}

afterEach(() => {
    useAuthStore.setState(initialAuthState, true);
    useTripStore.setState({ trips: initialTrips });
});

describe("CreateTripPage", () => {
    it("filters the country list by Korean or English name", async () => {
        const user = setupUser();
        renderCreateTripPage();

        const searchInput = screen.getByRole("searchbox", {
            name: "국가 검색",
        });

        expect(screen.getAllByRole("radio")).toHaveLength(3);

        await user.type(searchInput, "viet");

        expect(screen.getByRole("radio", { name: /베트남/ })).toBeVisible();
        expect(
            screen.queryByRole("radio", { name: /일본/ }),
        ).not.toBeInTheDocument();

        await user.clear(searchInput);
        await user.type(searchInput, "없는 나라");

        expect(screen.getByText("검색 결과가 없습니다.")).toBeVisible();
    });

    it("creates a trip from the step-by-step form", async () => {
        const user = setupUser();
        useAuthStore.setState({
            status: "authenticated",
            user: {
                id: "user-1",
                displayName: "서윤",
                email: "test@example.com",
                photoUrl: null,
            },
        });
        renderCreateTripPage();

        const nextButton = screen.getByRole("button", { name: "다음" });
        expect(nextButton).toBeDisabled();

        await user.click(screen.getByRole("radio", { name: /일본/ }));
        await user.click(nextButton);

        expect(
            screen.getByRole("heading", { name: "언제 떠나나요?" }),
        ).toHaveFocus();
        expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
        const durationStatus = screen.getByRole("status", {
            name: "여행 기간 요약",
        });
        expect(durationStatus).toBeEmptyDOMElement();

        await user.click(
            screen.getByRole("button", {
                name: getDayButtonName(rangeStart),
            }),
        );
        expect(screen.getByText("이제 도착일을 선택해주세요.")).toBeVisible();
        await user.click(
            screen.getByRole("button", { name: getDayButtonName(rangeEnd) }),
        );
        expect(durationStatus).toHaveTextContent("총 5일");
        await user.click(screen.getByRole("button", { name: "다음" }));

        expect(
            screen.getByRole("heading", { name: "누구와 함께 가나요?" }),
        ).toBeInTheDocument();
        expect(screen.getByText("서윤")).toBeInTheDocument();
        await user.type(screen.getByLabelText("동행 이름"), "민지");
        await user.click(screen.getByRole("button", { name: "추가" }));
        await user.click(screen.getByRole("button", { name: "다음" }));

        await user.click(screen.getByRole("radio", { name: "비행기" }));
        await user.click(screen.getByRole("button", { name: "다음" }));

        await user.type(screen.getByLabelText("편명 또는 예약번호"), "KE703");
        await user.click(screen.getByRole("button", { name: "다음" }));

        expect(
            screen.getByRole("heading", { name: "여행 준비가 끝났어요" }),
        ).toBeInTheDocument();
        expect(screen.getByText("일본 여행")).toBeInTheDocument();
        expect(screen.getByText("2명")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "여행 만들기" }));

        expect(screen.getByText("여행 목록으로 이동")).toBeInTheDocument();
        const createdTrip = useTripStore.getState().trips[0];

        expect(createdTrip).toMatchObject({
            name: "일본 여행",
            countryCode: "JP",
            currencyCode: "JPY",
            startDate: toTripDateString(rangeStart),
            endDate: toTripDateString(rangeEnd),
            transportType: "flight",
            transportRef: "KE703",
            members: [{ name: "서윤" }, { name: "민지" }],
        });
        expect(createdTrip).not.toHaveProperty("memberNames");
    });

    it("creates a day trip while allowing optional steps to be skipped", async () => {
        const user = setupUser();
        renderCreateTripPage();

        await user.click(screen.getByRole("radio", { name: /베트남/ }));
        await user.click(screen.getByRole("button", { name: "다음" }));
        await user.click(
            screen.getByRole("checkbox", { name: "당일치기예요" }),
        );
        await user.click(
            screen.getByRole("button", {
                name: getDayButtonName(dayTripDate),
            }),
        );
        expect(screen.getByText("당일치기")).toBeVisible();
        await user.click(screen.getByRole("button", { name: "다음" }));
        await user.click(screen.getByRole("button", { name: "다음" }));
        await user.click(screen.getByRole("radio", { name: "배" }));
        await user.click(screen.getByRole("button", { name: "다음" }));
        await user.click(screen.getByRole("button", { name: "다음" }));
        await user.click(screen.getByRole("button", { name: "여행 만들기" }));

        expect(useTripStore.getState().trips[0]).toMatchObject({
            countryCode: "VN",
            startDate: toTripDateString(dayTripDate),
            endDate: toTripDateString(dayTripDate),
            transportType: "ship",
            members: [{ name: "나" }],
        });
        expect(useTripStore.getState().trips[0].transportRef).toBeUndefined();
    });

    it("keeps the draft when going back and discards it when cancelled", async () => {
        const user = setupUser();
        renderCreateTripPage();

        await user.click(screen.getByRole("radio", { name: /중국/ }));
        await user.click(screen.getByRole("button", { name: "다음" }));
        await user.click(
            screen.getByRole("button", {
                name: getDayButtonName(rangeStart),
            }),
        );
        await user.click(screen.getByRole("button", { name: "이전" }));

        expect(screen.getByRole("radio", { name: /중국/ })).toBeChecked();
        await user.click(screen.getByRole("button", { name: "다음" }));
        expect(
            screen.getByText(
                formatCompactTripPeriod(
                    toTripDateString(rangeStart),
                    toTripDateString(rangeStart),
                ),
            ),
        ).toBeVisible();
        await user.click(screen.getByRole("link", { name: "여행 생성 취소" }));

        expect(screen.getByText("여행 목록으로 이동")).toBeInTheDocument();
        expect(useTripStore.getState().trips).toHaveLength(initialTrips.length);
    });
});
