import { describe, expect, it } from "vitest";

import {
    getGoogleSignInErrorMessage,
    getGoogleSignOutErrorMessage,
} from "./error-message";

const ignoredErrors = [
    "auth/popup-closed-by-user",
    "auth/cancelled-popup-request",
];

const errorMessages = [
    ["auth/popup-blocked", "브라우저에서 로그인 팝업을 허용해 주세요."],
    [
        "auth/network-request-failed",
        "네트워크 연결을 확인하고 다시 시도해 주세요.",
    ],
    [
        "auth/unauthorized-domain",
        "현재 주소가 Google 로그인 허용 도메인에 등록되지 않았습니다.",
    ],
    [
        "auth/operation-not-allowed",
        "Firebase에서 Google 로그인 제공자를 활성화해 주세요.",
    ],
    [
        "auth/configuration-not-found",
        "Google 로그인 설정이 아직 완료되지 않았습니다.",
    ],
] as const;

describe("getGoogleSignInErrorMessage", () => {
    it.each(ignoredErrors)("ignores %s", (code) => {
        expect(getGoogleSignInErrorMessage({ code })).toBeNull();
    });

    it.each(errorMessages)("maps %s", (code, message) => {
        expect(getGoogleSignInErrorMessage({ code })).toBe(message);
    });

    it("does not expose unknown provider errors", () => {
        expect(
            getGoogleSignInErrorMessage(new Error("private provider detail")),
        ).toBe("Google 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    });
});

describe("getGoogleSignOutErrorMessage", () => {
    it("maps a network failure", () => {
        expect(
            getGoogleSignOutErrorMessage({
                code: "auth/network-request-failed",
            }),
        ).toBe("네트워크 연결을 확인하고 다시 시도해 주세요.");
    });

    it("does not expose unknown provider errors", () => {
        expect(
            getGoogleSignOutErrorMessage(new Error("private provider detail")),
        ).toBe("로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    });
});
