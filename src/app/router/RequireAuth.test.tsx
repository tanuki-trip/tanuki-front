import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { useAuthStore, type AuthStatus } from "../../auth/store";

import { RequireAuth } from "./RequireAuth";

const initialAuthState = useAuthStore.getState();

function renderGuard(status: AuthStatus, guestFallback?: React.ReactNode) {
    useAuthStore.setState({ status, user: null });

    return render(
        <MemoryRouter initialEntries={["/private"]}>
            <Routes>
                <Route element={<RequireAuth guestFallback={guestFallback} />}>
                    <Route path="/private" element={<h1>비공개 화면</h1>} />
                </Route>
                <Route path="/" element={<h1>홈</h1>} />
            </Routes>
        </MemoryRouter>,
    );
}

afterEach(() => {
    useAuthStore.setState(initialAuthState, true);
});

describe("RequireAuth", () => {
    it("waits for the auth observer", () => {
        renderGuard("checking");

        expect(screen.getByLabelText("로그인 상태 확인 중")).toHaveAttribute(
            "aria-busy",
            "true",
        );
    });

    it("renders the guest fallback", () => {
        renderGuard("guest", <p>온보딩</p>);

        expect(screen.getByText("온보딩")).toBeInTheDocument();
    });

    it("redirects guests when no fallback is provided", async () => {
        renderGuard("guest");

        expect(
            await screen.findByRole("heading", { name: "홈" }),
        ).toBeInTheDocument();
    });

    it("renders protected routes for authenticated users", () => {
        renderGuard("authenticated");

        expect(
            screen.getByRole("heading", { name: "비공개 화면" }),
        ).toBeInTheDocument();
    });
});
