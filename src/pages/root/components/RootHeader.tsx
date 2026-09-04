import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, PawPrint, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuthStore } from "../../../auth/store";
import styles from "./RootHeader.module.css";

function getGoogleProfileImageUrl(photoUrl: string | null | undefined) {
    if (!photoUrl) {
        return null;
    }

    try {
        const url = new URL(photoUrl);
        const isGoogleImageHost =
            url.hostname === "googleusercontent.com" ||
            url.hostname.endsWith(".googleusercontent.com");

        return url.protocol === "https:" && isGoogleImageHost
            ? url.toString()
            : null;
    } catch {
        return null;
    }
}

export function RootHeader() {
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [failedProfileImageUrl, setFailedProfileImageUrl] = useState<
        string | null
    >(null);
    const accountRef = useRef<HTMLDivElement | null>(null);
    const accountTriggerRef = useRef<HTMLButtonElement | null>(null);
    const user = useAuthStore((state) => state.user);
    const isSigningOut = useAuthStore((state) => state.isSigningOut);
    const authError = useAuthStore((state) => state.authError);
    const signOut = useAuthStore((state) => state.signOut);
    const accountName = user?.displayName?.trim() || "사용자";
    const profileImageUrl = getGoogleProfileImageUrl(user?.photoUrl);
    const showProfileImage =
        profileImageUrl !== null && profileImageUrl !== failedProfileImageUrl;

    useEffect(() => {
        if (!isAccountOpen) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (!accountRef.current?.contains(event.target as Node)) {
                setIsAccountOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsAccountOpen(false);
                accountTriggerRef.current?.focus();
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isAccountOpen]);

    return (
        <header className={styles.header}>
            <div className={styles.inner}>
                <Link className={styles.wordmark} to="/" aria-label="tanuki 홈">
                    <PawPrint className={styles.brandIcon} aria-hidden="true" />
                    <span>tanuki</span>
                </Link>

                <div
                    className={styles.account}
                    ref={accountRef}
                    onBlur={(event) => {
                        if (
                            !event.currentTarget.contains(event.relatedTarget)
                        ) {
                            setIsAccountOpen(false);
                        }
                    }}
                >
                    <button
                        className={styles.accountButton}
                        ref={accountTriggerRef}
                        type="button"
                        aria-controls="root-account-popover"
                        aria-expanded={isAccountOpen}
                        aria-label={`${accountName} 계정 메뉴`}
                        onClick={() => setIsAccountOpen((isOpen) => !isOpen)}
                    >
                        <span className={styles.avatar} aria-hidden="true">
                            {showProfileImage ? (
                                <img
                                    className={styles.profileImage}
                                    src={profileImageUrl}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                    onError={() =>
                                        setFailedProfileImageUrl(
                                            profileImageUrl,
                                        )
                                    }
                                />
                            ) : (
                                <UserRound />
                            )}
                        </span>
                        <ChevronDown
                            aria-hidden="true"
                            className={isAccountOpen ? styles.chevronOpen : ""}
                        />
                    </button>

                    {isAccountOpen ? (
                        <div
                            className={styles.popover}
                            id="root-account-popover"
                        >
                            <div className={styles.accountInfo}>
                                <strong>{accountName}</strong>
                                {user?.email ? <span>{user.email}</span> : null}
                            </div>
                            <button
                                className={styles.signOutButton}
                                type="button"
                                aria-busy={isSigningOut}
                                disabled={isSigningOut}
                                onClick={() => void signOut()}
                            >
                                <LogOut aria-hidden="true" />
                                {isSigningOut ? "로그아웃 중…" : "로그아웃"}
                            </button>
                            {authError ? (
                                <p className={styles.error} role="alert">
                                    {authError}
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
        </header>
    );
}
