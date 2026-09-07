import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "../../auth/store";
import { searchPlaces } from "../../places/search";
import { initialTrips, useTripStore } from "../../trips/store";
import { getStoredTripMapStyle } from "../../trips/map-style";

import { AppRouter } from ".";

vi.mock("../../places/search", async (importOriginal) => {
    const original =
        await importOriginal<typeof import("../../places/search")>();

    return {
        ...original,
        searchPlaces: vi.fn(),
    };
});

vi.mock("./TripMapPreloader", () => ({
    TripMapPreloader: () => null,
}));

const mockedSearchPlaces = vi.mocked(searchPlaces);

const initialAuthState = useAuthStore.getState();

afterEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState(initialAuthState, true);
    useTripStore.setState({ trips: initialTrips });
    window.localStorage.clear();
    window.history.replaceState({}, "", "/");
});

describe("AppRouter", () => {
    it("renders onboarding at the root for guests", async () => {
        useAuthStore.setState({ status: "guest", user: null });
        window.history.replaceState({}, "", "/");

        render(<AppRouter />);
        await vi.dynamicImportSettled();

        expect(
            await screen.findByRole("heading", {
                name: "가고 싶은 곳을 지도에서 찾아보세요.",
            }),
        ).toBeInTheDocument();
    });

    it("adds a searched place to the selected day and its budget", async () => {
        const user = userEvent.setup();
        mockedSearchPlaces.mockResolvedValue([
            {
                id: "way-123",
                name: "도쿄 타워",
                address: "도쿄도 미나토구 시바코엔 4-2-8",
                coordinates: { latitude: 35.6586, longitude: 139.7454 },
            },
        ]);
        useAuthStore.setState({
            status: "authenticated",
            user: {
                id: "user-1",
                displayName: "테스트 사용자",
                email: "test@example.com",
                photoUrl: null,
            },
        });
        window.history.replaceState({}, "", "/trip/japan-tokyo");

        render(<AppRouter />);

        await user.click(
            screen.getByRole("button", {
                name: "3일차, 10월 10일 토요일",
            }),
        );
        await user.click(screen.getByRole("button", { name: "장소 검색" }));
        await user.type(
            await screen.findByRole("searchbox", {
                name: "장소명 또는 주소",
            }),
            "도쿄 타워",
        );
        await user.click(screen.getByRole("button", { name: "검색" }));
        await user.click(
            await screen.findByRole("button", {
                name: "도쿄 타워 일정에 추가",
            }),
        );
        const addDialog = screen.getByRole("dialog", { name: "일정에 추가" });
        await user.click(
            within(addDialog).getByRole("radio", { name: "2일차" }),
        );
        await user.click(
            within(addDialog).getByRole("button", { name: "추가" }),
        );

        expect(screen.getByRole("button", { name: "일정" })).toHaveAttribute(
            "aria-pressed",
            "true",
        );
        const schedule = screen.getByRole("region", { name: "2일차 장소" });
        expect(within(schedule).getByText("도쿄 타워")).toBeVisible();
        expect(
            within(schedule).getByRole("button", {
                name: "지도에서 도쿄 타워 보기",
            }),
        ).toHaveAttribute("aria-pressed", "true");
        expect(
            within(schedule).getByRole("button", {
                name: "지도에서 도쿄 타워 보기",
            }),
        ).toHaveFocus();

        await user.click(screen.getByRole("button", { name: "예산" }));

        const budget = await screen.findByRole("region", {
            name: "2일차 예산",
        });
        expect(
            within(budget).getByRole("button", {
                name: "도쿄 타워 금액 수정, 현재 미입력",
            }),
        ).toBeVisible();
    });

    it("updates the values collected during trip creation from settings", async () => {
        const user = userEvent.setup();
        useAuthStore.setState({
            status: "authenticated",
            user: {
                id: "user-1",
                displayName: "테스트 사용자",
                email: "test@example.com",
                photoUrl: null,
            },
        });
        window.history.replaceState({}, "", "/trip/japan-tokyo");

        render(<AppRouter />);

        await user.click(screen.getByRole("button", { name: "설정" }));
        const nameInput = await screen.findByLabelText("여행 이름");
        await user.clear(nameInput);
        await user.type(nameInput, "도쿄 가을 여행");
        await user.selectOptions(screen.getByLabelText("지도 스타일"), "dark");
        await user.click(screen.getByRole("button", { name: "설정 저장" }));

        expect(
            screen.getByRole("heading", { level: 1, name: "도쿄 가을 여행" }),
        ).toBeInTheDocument();
        expect(
            useTripStore
                .getState()
                .trips.find(({ id }) => id === "japan-tokyo"),
        ).toEqual(
            expect.objectContaining({
                name: "도쿄 가을 여행",
            }),
        );
        expect(
            useTripStore
                .getState()
                .trips.find(({ id }) => id === "japan-tokyo"),
        ).not.toHaveProperty("mapStyle");
        expect(getStoredTripMapStyle("japan-tokyo")).toBe("dark");
        expect(screen.getByText("여행 설정을 저장했습니다.")).toBeVisible();
    });

    it("opens the seeded solo itinerary across all four days", async () => {
        const user = userEvent.setup();
        useAuthStore.setState({
            status: "authenticated",
            user: {
                id: "user-1",
                displayName: "테스트 사용자",
                email: "test@example.com",
                photoUrl: null,
            },
        });
        window.history.replaceState(
            {},
            "",
            "/trip/japan-yokohama-shirakawago-tokyo",
        );

        render(<AppRouter />);

        expect(
            screen.getByRole("heading", {
                level: 1,
                name: "요코하마·히나미자와·도쿄 3박 4일",
            }),
        ).toBeInTheDocument();
        expect(
            within(
                screen.getByRole("region", { name: "1일차 장소" }),
            ).getByText("YCAT 1st Lobby"),
        ).toBeVisible();

        await user.click(
            screen.getByRole("button", { name: "2일차, 9월 9일 수요일" }),
        );
        expect(
            within(
                screen.getByRole("region", { name: "2일차 장소" }),
            ).getByText("오기마치 성터 전망대"),
        ).toBeVisible();

        await user.click(
            screen.getByRole("button", { name: "3일차, 9월 10일 목요일" }),
        );
        expect(
            within(
                screen.getByRole("region", { name: "3일차 장소" }),
            ).getByText("Cafe Quadrillion"),
        ).toBeVisible();
        expect(
            within(
                screen.getByRole("region", { name: "3일차 장소" }),
            ).getByText("음식점 · 18:00까지 출발"),
        ).toBeVisible();

        await user.click(
            screen.getByRole("button", { name: "4일차, 9월 11일 금요일" }),
        );
        expect(
            within(
                screen.getByRole("region", { name: "4일차 장소" }),
            ).getByText("구 후루카와 저택 가이드"),
        ).toBeVisible();
        const dayFourTimeline = screen.getByRole("region", {
            name: "4일차 장소",
        });
        expect(
            within(dayFourTimeline)
                .getByLabelText("8번째 장소")
                .closest("article"),
        ).toHaveTextContent("나리타 국제공항");
    });

    it("renders the trip wizard for authenticated users", async () => {
        useAuthStore.setState({
            status: "authenticated",
            user: {
                id: "user-1",
                displayName: "테스트 사용자",
                email: "test@example.com",
                photoUrl: null,
            },
        });
        window.history.replaceState({}, "", "/trips/new");

        render(<AppRouter />);
        await vi.dynamicImportSettled();

        expect(
            await screen.findByRole("heading", {
                name: "여행 이름을 정해주세요",
            }),
        ).toBeInTheDocument();
    }, 10_000);

    it("opens the selected trip from the trip list", async () => {
        const user = userEvent.setup();
        useAuthStore.setState({
            status: "authenticated",
            user: {
                id: "user-1",
                displayName: "테스트 사용자",
                email: "test@example.com",
                photoUrl: null,
            },
        });
        window.history.replaceState({}, "", "/");

        render(<AppRouter />);
        await vi.dynamicImportSettled();

        await user.click(
            await screen.findByRole("link", {
                name: "도쿄 4박 5일 여행 열기",
            }),
        );

        expect(window.location.pathname).toBe("/trip/japan-tokyo");
        expect(
            screen.getByRole("heading", {
                level: 1,
                name: "도쿄 4박 5일",
            }),
        ).toBeInTheDocument();
        const mapRegion = screen.getByRole("region", {
            name: "일본 여행 지도",
        });
        expect(mapRegion).toBeInTheDocument();
        expect(
            screen.getByRole("navigation", { name: "여행 메뉴" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("complementary", { name: "일정 관리" }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("heading", { name: "일정 관리" }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("group", { name: "일정 날짜" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", {
                name: "1일차, 10월 8일 목요일",
            }),
        ).toHaveAttribute("aria-pressed", "true");
        expect(
            screen.getByRole("button", {
                name: "5일차, 10월 12일 월요일",
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "북마크, 날짜 미정" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("region", { name: "1일차 장소" }),
        ).toBeInTheDocument();
        expect(screen.getAllByRole("article")).toHaveLength(4);
        expect(screen.getByText("첫 일정으로 고정")).toBeVisible();
        expect(
            screen.getByRole("button", {
                name: "지도에서 하네다 공항 보기",
            }),
        ).toHaveAttribute("aria-pressed", "true");
        expect(screen.getByRole("button", { name: "일정" })).toHaveAttribute(
            "aria-pressed",
            "true",
        );
        expect(
            screen.getByRole("link", { name: "여행 목록으로" }),
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", {
                name: "3일차, 10월 10일 토요일",
            }),
        );
        expect(
            screen.getByRole("button", {
                name: "3일차, 10월 10일 토요일",
            }),
        ).toHaveAttribute("aria-pressed", "true");
        expect(
            screen.getByRole("region", { name: "3일차 장소" }),
        ).toBeInTheDocument();
        expect(screen.getByText("등록된 장소가 없습니다.")).toBeVisible();

        await user.click(screen.getByRole("button", { name: "장소 검색" }));

        expect(window.location.pathname).toBe("/trip/japan-tokyo");
        expect(
            screen.getByRole("complementary", { name: "장소 검색" }),
        ).toBeInTheDocument();
        expect(screen.getByRole("region", { name: "일본 여행 지도" })).toBe(
            mapRegion,
        );
        expect(
            screen.getByRole("button", { name: "장소 검색" }),
        ).toHaveAttribute("aria-pressed", "true");

        await user.click(screen.getByRole("button", { name: "일정" }));
        expect(
            screen.getByRole("button", {
                name: "3일차, 10월 10일 토요일",
            }),
        ).toHaveAttribute("aria-pressed", "true");

        await user.click(screen.getByRole("button", { name: "예산" }));
        expect(
            screen.getByRole("complementary", { name: "예산" }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole("heading", { name: "예산" }),
        ).not.toBeInTheDocument();
        expect(
            await screen.findByRole("region", { name: "예산 요약" }),
        ).toBeInTheDocument();
        expect(screen.getByText("현재 사용한 금액")).toBeVisible();
        expect(
            screen.getByRole("region", { name: "3일차 예산" }),
        ).toBeInTheDocument();
        expect(screen.getByRole("region", { name: "일본 여행 지도" })).toBe(
            mapRegion,
        );

        await user.click(screen.getByRole("button", { name: "설정" }));
        expect(
            screen.getByRole("complementary", { name: "설정" }),
        ).toBeInTheDocument();
        expect(screen.getByRole("region", { name: "일본 여행 지도" })).toBe(
            mapRegion,
        );
    });

    it("renders 404 for an unknown trip id", () => {
        useAuthStore.setState({
            status: "authenticated",
            user: {
                id: "user-1",
                displayName: "테스트 사용자",
                email: "test@example.com",
                photoUrl: null,
            },
        });
        window.history.replaceState({}, "", "/trip/missing");

        render(<AppRouter />);

        expect(
            screen.getByRole("heading", {
                name: "페이지를 찾을 수 없습니다.",
            }),
        ).toBeInTheDocument();
    });

    it("redirects guests away from the trip wizard", async () => {
        useAuthStore.setState({ status: "guest", user: null });
        window.history.replaceState({}, "", "/trips/new");

        render(<AppRouter />);
        await vi.dynamicImportSettled();

        expect(
            await screen.findByRole("heading", {
                name: "가고 싶은 곳을 지도에서 찾아보세요.",
            }),
        ).toBeInTheDocument();
        expect(window.location.pathname).toBe("/");
    });

    it.each(["/login", "/missing"])("renders 404 at %s", (path) => {
        window.history.replaceState({}, "", path);

        render(<AppRouter />);

        expect(
            screen.getByRole("heading", { name: "페이지를 찾을 수 없습니다." }),
        ).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "홈으로" })).toHaveAttribute(
            "href",
            "/",
        );
    });
});
