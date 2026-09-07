import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "../../auth/store";
import { initialTrips, useTripStore } from "../../trips/store";
import { RootPage } from ".";

const initialAuthState = useAuthStore.getState();
const mockToday = new Date(2026, 8, 4);
const initialWindowInnerWidth = window.innerWidth;
const initialDocumentClientWidth = Object.getOwnPropertyDescriptor(
    document.documentElement,
    "clientWidth",
);

function renderRootPage() {
    return render(
        <MemoryRouter>
            <RootPage today={mockToday} />
        </MemoryRouter>,
    );
}

beforeEach(() => {
    useAuthStore.setState({
        status: "authenticated",
        user: {
            id: "user-1",
            displayName: "테스트 사용자",
            email: "test@example.com",
            photoUrl: "https://lh3.googleusercontent.com/a/test-profile",
        },
        authError: null,
        isSigningOut: false,
    });
});

afterEach(() => {
    useTripStore.setState({ trips: initialTrips });
    useAuthStore.setState(initialAuthState, true);
    Object.defineProperty(window, "innerWidth", {
        configurable: true,
        value: initialWindowInnerWidth,
    });
    if (initialDocumentClientWidth) {
        Object.defineProperty(
            document.documentElement,
            "clientWidth",
            initialDocumentClientWidth,
        );
    } else {
        Reflect.deleteProperty(document.documentElement, "clientWidth");
    }
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
});

describe("RootPage", () => {
    it("shows the mock trips", () => {
        const { container } = renderRootPage();

        expect(screen.getByRole("link", { name: "tanuki 홈" })).toHaveAttribute(
            "href",
            "/",
        );
        const accountButton = screen.getByRole("button", {
            name: "테스트 사용자 계정 메뉴",
        });
        expect(accountButton.querySelector("img")).toHaveAttribute(
            "src",
            "https://lh3.googleusercontent.com/a/test-profile",
        );
        expect(
            screen.getByRole("heading", { name: "다가오는 여행" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "다른 여행" }),
        ).toBeInTheDocument();

        const tripList = screen.getByRole("list", {
            name: "다른 여행 목록",
        });
        expect(within(tripList).getAllByRole("article")).toHaveLength(2);
        expect(screen.getAllByRole("article")).toHaveLength(3);

        for (const trip of [
            {
                id: "japan-yokohama-shirakawago-tokyo",
                name: "요코하마·히나미자와·도쿄 3박 4일",
                country: "일본",
            },
            { id: "japan-tokyo", name: "도쿄 4박 5일", country: "일본" },
            {
                id: "korea-jeju",
                name: "제주도 주말 여행",
                country: "한국",
            },
        ]) {
            const card = screen.getByRole("article", {
                name: trip.name,
            });

            expect(within(card).getByText(trip.country)).toBeInTheDocument();
            expect(
                within(card).getByRole("link", {
                    name: `${trip.name} 여행 열기`,
                }),
            ).toHaveAttribute("href", `/trip/${trip.id}`);
        }

        expect(
            screen.queryByText("아직 생성된 여행이 없습니다."),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("link", { name: "여행 추가하기" }),
        ).toHaveAttribute("href", "/trips/new");
        expect(screen.getByText("D-4")).toHaveAccessibleName("4일 후 출발");

        const yokohamaCard = screen.getByRole("article", {
            name: "요코하마·히나미자와·도쿄 3박 4일",
        });
        expect(within(yokohamaCard).getByText("1명")).toBeInTheDocument();

        const tokyoCard = screen.getByRole("article", {
            name: "도쿄 4박 5일",
        });
        expect(within(tokyoCard).getByText("26.10.08")).toBeInTheDocument();
        expect(within(tokyoCard).getByText("12")).toBeInTheDocument();
        expect(within(tokyoCard).getByText("2명")).toBeInTheDocument();
        const coverImages =
            container.querySelectorAll<HTMLImageElement>('main img[alt=""]');
        expect(coverImages).toHaveLength(3);
        expect(coverImages[0]).toHaveAttribute("loading", "eager");
        expect(coverImages[0]).toHaveAttribute("fetchpriority", "high");
        expect(coverImages[1]).toHaveAttribute("loading", "lazy");
        expect(coverImages[2]).toHaveAttribute("loading", "lazy");
    });

    it("edits a trip from the trip menu", async () => {
        const user = userEvent.setup();
        renderRootPage();

        await user.click(
            screen.getByRole("button", {
                name: "도쿄 4박 5일 메뉴 열기",
            }),
        );

        const actionsMenu = screen.getByRole("menu", {
            name: "도쿄 4박 5일 관리",
        });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        await user.click(
            within(actionsMenu).getByRole("menuitem", { name: "이름 수정" }),
        );

        const nameInput = screen.getByRole("textbox", { name: "여행 이름" });
        await user.clear(nameInput);
        await user.type(nameInput, "도쿄 맛집 여행");
        await user.click(screen.getByRole("button", { name: "저장" }));

        expect(
            screen.getByRole("article", { name: "도쿄 맛집 여행" }),
        ).toBeInTheDocument();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("deletes a trip after confirmation", async () => {
        const user = userEvent.setup();
        renderRootPage();

        await user.click(
            screen.getByRole("button", {
                name: "제주도 주말 여행 메뉴 열기",
            }),
        );
        await user.click(
            within(
                screen.getByRole("menu", { name: "제주도 주말 여행 관리" }),
            ).getByRole("menuitem", { name: "삭제" }),
        );

        const deleteDialog = screen.getByRole("dialog", {
            name: "여행을 삭제할까요?",
        });
        await user.click(
            within(deleteDialog).getByRole("button", { name: "삭제" }),
        );

        expect(
            screen.queryByRole("article", { name: "제주도 주말 여행" }),
        ).not.toBeInTheDocument();
        expect(screen.getAllByRole("article")).toHaveLength(2);
    });

    it("closes the trip menu from outside or with Escape", async () => {
        const user = userEvent.setup();
        renderRootPage();

        const menuButton = screen.getByRole("button", {
            name: "도쿄 4박 5일 메뉴 열기",
        });

        await user.click(menuButton);
        expect(
            screen.getByRole("menu", { name: "도쿄 4박 5일 관리" }),
        ).toBeInTheDocument();

        await user.click(
            screen.getByRole("heading", { name: "다가오는 여행" }),
        );
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();

        await user.click(menuButton);
        await user.keyboard("{Escape}");

        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
        expect(menuButton).toHaveFocus();
    });

    it("restores focus after closing a dialog from the backdrop", async () => {
        const user = userEvent.setup();
        renderRootPage();

        const menuButton = screen.getByRole("button", {
            name: "도쿄 4박 5일 메뉴 열기",
        });
        await user.click(menuButton);
        await user.click(
            within(
                screen.getByRole("menu", { name: "도쿄 4박 5일 관리" }),
            ).getByRole("menuitem", { name: "이름 수정" }),
        );

        const dialog = screen.getByRole("dialog", {
            name: "여행 이름 수정",
        });
        const backdrop = dialog.parentElement;

        expect(backdrop).not.toBeNull();
        await user.click(backdrop!);

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(menuButton).toHaveFocus();
    });

    it("preserves the page width while a dialog locks scrolling", async () => {
        const user = userEvent.setup();
        Object.defineProperty(window, "innerWidth", {
            configurable: true,
            value: 1200,
        });
        Object.defineProperty(document.documentElement, "clientWidth", {
            configurable: true,
            value: 1185,
        });
        renderRootPage();

        await user.click(
            screen.getByRole("button", {
                name: "도쿄 4박 5일 메뉴 열기",
            }),
        );
        await user.click(
            within(
                screen.getByRole("menu", { name: "도쿄 4박 5일 관리" }),
            ).getByRole("menuitem", { name: "이름 수정" }),
        );

        expect(document.body.style.overflow).toBe("hidden");
        expect(document.body.style.paddingRight).toBe("15px");

        await user.click(screen.getByRole("button", { name: "닫기" }));

        expect(document.body.style.overflow).toBe("");
        expect(document.body.style.paddingRight).toBe("");
    });

    it("shows the empty state after deleting every trip", async () => {
        const user = userEvent.setup();
        renderRootPage();

        for (const tripName of [
            "요코하마·히나미자와·도쿄 3박 4일",
            "도쿄 4박 5일",
            "제주도 주말 여행",
        ]) {
            await user.click(
                screen.getByRole("button", {
                    name: `${tripName} 메뉴 열기`,
                }),
            );
            await user.click(
                within(
                    screen.getByRole("menu", { name: `${tripName} 관리` }),
                ).getByRole("menuitem", { name: "삭제" }),
            );
            await user.click(
                within(
                    screen.getByRole("dialog", {
                        name: "여행을 삭제할까요?",
                    }),
                ).getByRole("button", { name: "삭제" }),
            );
        }

        expect(
            screen.getByText("아직 생성된 여행이 없습니다."),
        ).toBeInTheDocument();
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("opens the account menu and requests sign-out", async () => {
        const user = userEvent.setup();
        const signOut = vi.fn(async () => undefined);
        useAuthStore.setState({ signOut });
        renderRootPage();

        const accountButton = screen.getByRole("button", {
            name: "테스트 사용자 계정 메뉴",
        });
        await user.click(accountButton);

        expect(screen.getByText("test@example.com")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "로그아웃" }));

        expect(signOut).toHaveBeenCalledOnce();
    });

    it("does not load a profile image from an unsafe URL", () => {
        useAuthStore.setState({
            user: {
                id: "user-1",
                displayName: "테스트 사용자",
                email: "test@example.com",
                photoUrl: "javascript:alert(1)",
            },
        });
        renderRootPage();

        const accountButton = screen.getByRole("button", {
            name: "테스트 사용자 계정 메뉴",
        });
        expect(accountButton.querySelector("img")).toBeNull();
    });

    it("falls back to the default avatar when the profile image fails", () => {
        renderRootPage();

        const accountButton = screen.getByRole("button", {
            name: "테스트 사용자 계정 메뉴",
        });
        const profileImage = accountButton.querySelector("img");

        expect(profileImage).not.toBeNull();
        fireEvent.error(profileImage!);

        expect(accountButton.querySelector("img")).toBeNull();
    });

    it("falls back to a regular list when every trip has ended", () => {
        render(
            <MemoryRouter>
                <RootPage today={new Date(2028, 0, 1)} />
            </MemoryRouter>,
        );

        expect(
            screen.getByRole("heading", { name: "여행 리스트" }),
        ).toBeInTheDocument();
        expect(
            within(
                screen.getByRole("list", { name: "여행 목록" }),
            ).getAllByRole("article"),
        ).toHaveLength(3);
        expect(screen.queryByText(/^D-/)).not.toBeInTheDocument();
    });
});
