import {
    ArrowRight,
    CircleDollarSign,
    MapPinned,
    Route,
    UsersRound,
} from "lucide-react";
import { useState } from "react";

import { useAuthStore } from "../auth/store";

import "./onboarding.css";

const onboardingSteps = [
    {
        description: "가고 싶은 곳을 지도에서 찾아보세요.",
        icon: MapPinned,
        motion: "search",
    },
    {
        description: "고른 장소를 원하는 순서로 이어보세요.",
        icon: Route,
        motion: "route",
    },
    {
        description: "교통비부터 현지 예산까지 한눈에 관리하세요.",
        icon: CircleDollarSign,
        motion: "budget",
    },
    {
        description: "여러 명이 함께 여행을 계획하고 관리하세요.",
        icon: UsersRound,
        motion: "group",
    },
] as const;

function GoogleLogo() {
    return (
        <svg
            aria-hidden="true"
            className="onboarding__google-logo"
            viewBox="0 0 24 24"
        >
            <path
                fill="#4285f4"
                d="M21.35 12.18c0-.64-.06-1.25-.16-1.84H12v3.48h5.25a4.49 4.49 0 0 1-1.95 2.95v2.26h3.16c1.85-1.7 2.89-4.22 2.89-6.85Z"
            />
            <path
                fill="#34a853"
                d="M12 21.72c2.64 0 4.86-.88 6.48-2.38l-3.16-2.26c-.88.59-2 .94-3.32.94-2.55 0-4.7-1.72-5.48-4.03H3.25v2.33A9.78 9.78 0 0 0 12 21.72Z"
            />
            <path
                fill="#fbbc05"
                d="M6.52 13.99a5.88 5.88 0 0 1 0-3.76V7.9H3.25A9.78 9.78 0 0 0 2.22 12c0 1.58.38 3.07 1.03 4.32l3.27-2.33Z"
            />
            <path
                fill="#ea4335"
                d="M12 6.2c1.44 0 2.72.49 3.74 1.46l2.81-2.81A9.42 9.42 0 0 0 12 2.28 9.78 9.78 0 0 0 3.25 7.9l3.27 2.33C7.3 7.92 9.45 6.2 12 6.2Z"
            />
        </svg>
    );
}

export function Onboarding() {
    const [stepIndex, setStepIndex] = useState(0);
    const authError = useAuthStore((state) => state.authError);
    const isSigningIn = useAuthStore((state) => state.isSigningIn);
    const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
    const step = onboardingSteps[stepIndex];
    const isLastStep = stepIndex === onboardingSteps.length - 1;
    const Icon = step.icon;

    function handleNext() {
        if (isLastStep) {
            void signInWithGoogle();
            return;
        }

        setStepIndex((currentStep) => currentStep + 1);
    }

    return (
        <main className="onboarding">
            <section className="onboarding__content" aria-live="polite">
                <div
                    className={`onboarding__visual onboarding__visual--${step.motion}`}
                    aria-hidden="true"
                >
                    <Icon className="onboarding__icon" strokeWidth={1.45} />
                </div>

                <div className="onboarding__copy">
                    <h1
                        className="onboarding__description"
                        key={step.description}
                    >
                        {step.description}
                    </h1>

                    <div className="onboarding__progress" aria-hidden="true">
                        {onboardingSteps.map((item, index) => (
                            <span
                                className={
                                    index === stepIndex
                                        ? "onboarding__dot onboarding__dot--active"
                                        : "onboarding__dot"
                                }
                                key={item.description}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <button
                className={
                    isLastStep
                        ? "onboarding__next onboarding__next--google"
                        : "onboarding__next"
                }
                aria-busy={isLastStep && isSigningIn}
                aria-describedby={
                    isLastStep && authError ? "google-auth-error" : undefined
                }
                disabled={isLastStep && isSigningIn}
                type="button"
                onClick={handleNext}
            >
                {isLastStep && (
                    <span className="onboarding__google-logo-box">
                        <GoogleLogo />
                    </span>
                )}
                <span>
                    {isLastStep
                        ? isSigningIn
                            ? "Google 로그인 중…"
                            : "Google로 계속하기"
                        : "다음"}
                </span>
                {!isLastStep && (
                    <ArrowRight
                        aria-hidden="true"
                        className="onboarding__next-arrow"
                        size={20}
                        strokeWidth={1.8}
                    />
                )}
            </button>

            {isLastStep && authError && (
                <p
                    className="onboarding__auth-error"
                    id="google-auth-error"
                    role="alert"
                >
                    {authError}
                </p>
            )}
        </main>
    );
}
