import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Onboarding } from "../../onboarding/Onboarding";
import { NotFoundPage } from "../../pages/not-found";
import { RootPage } from "../../pages/root";
import { CreateTripPage } from "../../pages/trips/new";

import { RequireAuth } from "./RequireAuth";

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<RequireAuth guestFallback={<Onboarding />} />}>
                    <Route path="/" element={<RootPage />} />
                </Route>
                <Route element={<RequireAuth />}>
                    <Route path="/trips/new" element={<CreateTripPage />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
