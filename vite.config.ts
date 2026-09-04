import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const authPopupHeaders = {
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
};

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        headers: authPopupHeaders,
    },
    preview: {
        headers: authPopupHeaders,
    },
    test: {
        environment: "jsdom",
        setupFiles: "./src/test/setup.ts",
    },
    build: {
        // OneDrive can lock generated files while Vite empties this directory.
        emptyOutDir: false,
    },
});
