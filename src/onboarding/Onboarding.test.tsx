import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "../auth/store";

import { Onboarding } from "./Onboarding";

const initialAuthState = useAuthStore.getState();

afterEach(() => {
    useAuthStore.setState(initialAuthState, true);
});

describe("Onboarding", () => {
    it("moves through every step and starts Google sign-in", async () => {
        const user = userEvent.setup();
        const signInWithGoogle = vi.fn().mockResolvedValue(undefined);
        useAuthStore.setState({
            status: "guest",
            isSigningIn: false,
            authError: null,
            signInWithGoogle,
        });

        render(<Onboarding />);

        expect(
            screen.getByRole("heading", {
                name: "가고 싶은 곳을 지도에서 찾아보세요.",
            }),
        ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "다음" }));
        expect(
            screen.getByRole("heading", {
                name: "고른 장소를 원하는 순서로 이어보세요.",
            }),
        ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "다음" }));
        expect(
            screen.getByRole("heading", {
                name: "교통비부터 현지 예산까지 한눈에 관리하세요.",
            }),
        ).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "다음" }));
        expect(
            screen.getByRole("heading", {
                name: "여러 명이 함께 여행을 계획하고 관리하세요.",
            }),
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("button", { name: "Google로 계속하기" }),
        );

        expect(signInWithGoogle).toHaveBeenCalledOnce();
    });

    it("disables sign-in and announces an auth error", async () => {
        const user = userEvent.setup();
        useAuthStore.setState({
            status: "guest",
            isSigningIn: true,
            authError: "로그인 오류",
        });

        render(<Onboarding />);

        for (let step = 0; step < 3; step += 1) {
            await user.click(screen.getByRole("button", { name: "다음" }));
        }

        expect(
            screen.getByRole("button", { name: "Google 로그인 중…" }),
        ).toBeDisabled();
        expect(screen.getByRole("alert")).toHaveTextContent("로그인 오류");
    });
});
