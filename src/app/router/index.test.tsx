import { render, screen } from "@testing-library/react";
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
