import { create } from "zustand";

import type { User } from "firebase/auth";

import { getGoogleSignInErrorMessage } from "./error-message";
import {
    isFirebaseConfigured,
    observeFirebaseAuth,
    openGoogleSignIn,
} from "./firebase-auth";

export type AuthStatus = "checking" | "guest" | "authenticated";

type AuthUser = {
    id: string;
    displayName: string | null;
    email: string | null;
    photoUrl: string | null;
};

type AuthState = {
    status: AuthStatus;
    user: AuthUser | null;
    isSigningIn: boolean;
    authError: string | null;
    startAuthObserver: () => () => void;
    signInWithGoogle: () => Promise<void>;
};

function toAuthUser(user: User): AuthUser {
    return {
        id: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoUrl: user.photoURL,
    };
}

export const useAuthStore = create<AuthState>()((set, get) => ({
    status: isFirebaseConfigured() ? "checking" : "guest",
    user: null,
    isSigningIn: false,
    authError: null,
    startAuthObserver: () =>
        observeFirebaseAuth(
            (user) => {
                set({
                    status: user ? "authenticated" : "guest",
                    user: user ? toAuthUser(user) : null,
                    authError: null,
                });
            },
            (error) => {
                set({
                    status: "guest",
                    user: null,
                    authError: getGoogleSignInErrorMessage(error),
                });
            },
        ),
    signInWithGoogle: async () => {
        if (get().isSigningIn) return;

        set({ isSigningIn: true, authError: null });

        try {
            await openGoogleSignIn();
        } catch (error) {
            set({ authError: getGoogleSignInErrorMessage(error) });
        } finally {
            set({ isSigningIn: false });
        }
    },
}));
