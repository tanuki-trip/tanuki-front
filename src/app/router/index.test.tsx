import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { useAuthStore } from "../../auth/store";

import { AppRouter } from ".";

const initialAuthState = useAuthStore.getState();

afterEach(() => {
    useAuthStore.setState(initialAuthState, true);
    window.history.replaceState({}, "", "/");
});

describe("AppRouter", () => {
    it("renders onboarding at the root for guests", () => {
        useAuthStore.setState({ status: "guest", user: null });
        window.history.replaceState({}, "", "/");

        render(<AppRouter />);

        expect(
            screen.getByRole("heading", {
                name: "가고 싶은 곳을 지도에서 찾아보세요.",
            }),
        ).toBeInTheDocument();
    });

    it("renders the trip wizard for authenticated users", () => {
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

        expect(
            screen.getByRole("heading", { name: "어디로 떠나나요?" }),
        ).toBeInTheDocument();
    });

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

        await user.click(
            screen.getByRole("link", {
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
        expect(screen.getAllByRole("article").length).toBeGreaterThanOrEqual(3);
        expect(screen.getAllByRole("article").length).toBeLessThanOrEqual(5);
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

    it("redirects guests away from the trip wizard", () => {
        useAuthStore.setState({ status: "guest", user: null });
        window.history.replaceState({}, "", "/trips/new");

        render(<AppRouter />);

        expect(
            screen.getByRole("heading", {
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
