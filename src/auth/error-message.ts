function hasStringCode(error: unknown): error is { code: string } {
    return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
    );
}

export function getGoogleSignInErrorMessage(error: unknown) {
    const code = hasStringCode(error) ? error.code : "";

    switch (code) {
        case "auth/popup-closed-by-user":
        case "auth/cancelled-popup-request":
            return null;
        case "auth/configuration-not-found":
            return "Google 로그인 설정이 아직 완료되지 않았습니다.";
        case "auth/popup-blocked":
            return "브라우저에서 로그인 팝업을 허용해 주세요.";
        case "auth/network-request-failed":
            return "네트워크 연결을 확인하고 다시 시도해 주세요.";
        case "auth/unauthorized-domain":
            return "현재 주소가 Google 로그인 허용 도메인에 등록되지 않았습니다.";
        case "auth/operation-not-allowed":
            return "Firebase에서 Google 로그인 제공자를 활성화해 주세요.";
        default:
            return "Google 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    }
}

export function getGoogleSignOutErrorMessage(error: unknown) {
    const code = hasStringCode(error) ? error.code : "";

    if (code === "auth/network-request-failed") {
        return "네트워크 연결을 확인하고 다시 시도해 주세요.";
    }

    return "로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.";
}
