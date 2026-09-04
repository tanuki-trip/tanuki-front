import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RootPage } from ".";

describe("RootPage", () => {
    it("shows the mock trips", () => {
        const { container } = render(<RootPage />);

        expect(
            screen.getByRole("heading", { name: "여행 리스트" }),
        ).toBeInTheDocument();

        const tripList = screen.getByRole("list", { name: "여행 목록" });
        expect(within(tripList).getAllByRole("article")).toHaveLength(3);

        for (const trip of [
            { name: "도쿄 4박 5일", country: "일본" },
            { name: "상하이 주말 여행", country: "중국" },
            { name: "다낭 가족 여행", country: "베트남" },
        ]) {
            const card = within(tripList).getByRole("article", {
                name: trip.name,
            });

            expect(within(card).getByText(trip.country)).toBeInTheDocument();
        }

        expect(
            screen.queryByText("아직 생성된 여행이 없습니다."),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "여행 추가하기" }),
        ).toBeEnabled();

        const tokyoCard = within(tripList).getByRole("article", {
            name: "도쿄 4박 5일",
        });
        expect(within(tokyoCard).getByText("26.10.08")).toBeInTheDocument();
        expect(within(tokyoCard).getByText("12")).toBeInTheDocument();
        expect(within(tokyoCard).getByText("2명")).toBeInTheDocument();
        const coverImages =
            container.querySelectorAll<HTMLImageElement>('img[alt=""]');
        expect(coverImages).toHaveLength(3);
        expect(coverImages[0]).toHaveAttribute("loading", "eager");
        expect(coverImages[0]).toHaveAttribute("fetchpriority", "high");
        expect(coverImages[1]).toHaveAttribute("loading", "lazy");
    });

    it("edits a trip from the trip menu", async () => {
        const user = userEvent.setup();
        render(<RootPage />);

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
        render(<RootPage />);

        await user.click(
            screen.getByRole("button", {
                name: "상하이 주말 여행 메뉴 열기",
            }),
        );
        await user.click(
            within(
                screen.getByRole("menu", { name: "상하이 주말 여행 관리" }),
            ).getByRole("menuitem", { name: "삭제" }),
        );

        const deleteDialog = screen.getByRole("dialog", {
            name: "여행을 삭제할까요?",
        });
        await user.click(
            within(deleteDialog).getByRole("button", { name: "삭제" }),
        );

        expect(
            screen.queryByRole("article", { name: "상하이 주말 여행" }),
        ).not.toBeInTheDocument();
        expect(
            within(
                screen.getByRole("list", { name: "여행 목록" }),
            ).getAllByRole("article"),
        ).toHaveLength(2);
    });

    it("closes the trip menu from outside or with Escape", async () => {
        const user = userEvent.setup();
        render(<RootPage />);

        const menuButton = screen.getByRole("button", {
            name: "도쿄 4박 5일 메뉴 열기",
        });

        await user.click(menuButton);
        expect(
            screen.getByRole("menu", { name: "도쿄 4박 5일 관리" }),
        ).toBeInTheDocument();

        await user.click(screen.getByRole("heading", { name: "여행 리스트" }));
        expect(screen.queryByRole("menu")).not.toBeInTheDocument();

        await user.click(menuButton);
        await user.keyboard("{Escape}");

        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
        expect(menuButton).toHaveFocus();
    });

    it("restores focus after closing a dialog from the backdrop", async () => {
        const user = userEvent.setup();
        render(<RootPage />);

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

    it("shows the empty state after deleting every trip", async () => {
        const user = userEvent.setup();
        render(<RootPage />);

        for (const tripName of [
            "도쿄 4박 5일",
            "상하이 주말 여행",
            "다낭 가족 여행",
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
});
