import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const firebaseAuth = vi.hoisted(() => ({
    closeFirebaseSession: vi.fn<() => Promise<void>>(),
}));

vi.mock("./firebase-auth", () => ({
    closeFirebaseSession: firebaseAuth.closeFirebaseSession,
    isFirebaseConfigured: () => true,
    observeFirebaseAuth: () => () => undefined,
    openGoogleSignIn: vi.fn(),
}));

import { useAuthStore } from "./store";

const initialAuthState = useAuthStore.getState();

beforeEach(() => {
    firebaseAuth.closeFirebaseSession.mockReset();
    firebaseAuth.closeFirebaseSession.mockResolvedValue();
    useAuthStore.setState(initialAuthState, true);
});

afterEach(() => {
    useAuthStore.setState(initialAuthState, true);
});

describe("auth sign-out", () => {
    it("prevents duplicate sign-out requests", async () => {
        let finishSignOut: () => void = () => undefined;
        const pendingSignOut = new Promise<void>((resolve) => {
            finishSignOut = resolve;
        });
        firebaseAuth.closeFirebaseSession.mockReturnValue(pendingSignOut);

        const firstRequest = useAuthStore.getState().signOut();
        const secondRequest = useAuthStore.getState().signOut();

        expect(firebaseAuth.closeFirebaseSession).toHaveBeenCalledOnce();
        expect(useAuthStore.getState().isSigningOut).toBe(true);

        finishSignOut();
        await Promise.all([firstRequest, secondRequest]);

        expect(useAuthStore.getState().isSigningOut).toBe(false);
    });

    it("keeps a safe error message when sign-out fails", async () => {
        firebaseAuth.closeFirebaseSession.mockRejectedValue(
            new Error("private provider detail"),
        );

        await useAuthStore.getState().signOut();

        expect(useAuthStore.getState().authError).toBe(
            "로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        );
        expect(useAuthStore.getState().isSigningOut).toBe(false);
    });
});
