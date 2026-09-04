import { useEffect, type PropsWithChildren } from "react";

import { useAuthStore } from "./store";

export function AuthBootstrap({ children }: PropsWithChildren) {
    const startAuthObserver = useAuthStore((state) => state.startAuthObserver);

    useEffect(() => startAuthObserver(), [startAuthObserver]);

    return children;
}
