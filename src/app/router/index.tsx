import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Onboarding } from "../../onboarding/Onboarding";
import { NotFoundPage } from "../../pages/not-found";
import { RootPage } from "../../pages/root";

import { RequireAuth } from "./RequireAuth";

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<RequireAuth guestFallback={<Onboarding />} />}>
                    <Route path="/" element={<RootPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
