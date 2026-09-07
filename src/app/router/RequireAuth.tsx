import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "../../auth/store";

import styles from "./style.module.css";

type RequireAuthProps = {
    guestFallback?: ReactNode;
};

export function RequireAuth({
    guestFallback = <Navigate to="/" replace />,
}: RequireAuthProps) {
    const status = useAuthStore((state) => state.status);

    if (status === "checking") {
        return (
            <main
                aria-busy="true"
                aria-label="로그인 상태 확인 중"
                className={styles.pending}
            >
                <span role="status">여행을 준비하고 있어요.</span>
            </main>
        );
    }

    return status === "authenticated" ? <Outlet /> : guestFallback;
}
