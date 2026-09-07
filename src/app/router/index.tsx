import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { NotFoundPage } from "../../pages/not-found";
import { TripPage } from "../../pages/trip";

import { RequireAuth } from "./RequireAuth";
import { TripMapPreloader } from "./TripMapPreloader";
import styles from "./style.module.css";

const Onboarding = lazy(async () => ({
    default: (await import("../../onboarding/Onboarding")).Onboarding,
}));
const RootPage = lazy(async () => ({
    default: (await import("../../pages/root")).RootPage,
}));
const CreateTripPage = lazy(async () => ({
    default: (await import("../../pages/trips/new")).CreateTripPage,
}));

function RouteLoading() {
    return (
        <main className={styles.pending} aria-busy="true">
            <span role="status">페이지 불러오는 중</span>
        </main>
    );
}

export function AppRouter() {
    return (
        <BrowserRouter>
            <TripMapPreloader />
            <Suspense fallback={<RouteLoading />}>
                <Routes>
                    <Route
                        element={<RequireAuth guestFallback={<Onboarding />} />}
                    >
                        <Route path="/" element={<RootPage />} />
                    </Route>
                    <Route element={<RequireAuth />}>
                        <Route path="/trip/:tripId" element={<TripPage />} />
                        <Route path="/trips/new" element={<CreateTripPage />} />
                    </Route>
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}
