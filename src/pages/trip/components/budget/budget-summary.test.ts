import { describe, expect, it } from "vitest";

import type { TripPlace } from "../../../../places/model";
import { deleteTripPlace } from "../../../../places/schedule";
import {
    getBudgetSummary,
    getMemberSettlements,
    getReferencedExpenseMemberIds,
    getSettlementTransfers,
    snapshotExpenseParticipants,
} from "./budget-summary";

function createPlace(
    id: string,
    amount: number,
    split?: TripPlace["placeCost"]["split"],
): TripPlace {
    return {
        id,
        name: id,
        address: "테스트 주소",
        coordinates: { latitude: 0, longitude: 0 },
        day: 1,
        order: 0,
        arrivalTime: null,
        memo: null,
        placeCost: { amount, currency: "KRW", split },
        inbound: {
            mode: null,
            durationMin: null,
            cost: null,
            isPassCovered: false,
        },
        fixedPosition: null,
    };
}

const members = [{ id: "owner" }, { id: "member-1" }, { id: "member-2" }];

describe("getMemberSettlements", () => {
    it("removes obsolete transport spending after a route changes", () => {
        const first = createPlace("first", 0);
        const removed = createPlace("removed", 0);
        const next = createPlace("next", 0);
        first.order = 0;
        removed.order = 1;
        next.order = 2;
        next.inbound = {
            mode: "subway",
            durationMin: 20,
            cost: { amount: 500, currency: "KRW" },
            isPassCovered: false,
        };

        const places = deleteTripPlace([first, removed, next], removed.id);

        expect(getBudgetSummary(places, "KRW").transport).toBe(0);
        expect(getMemberSettlements(places, members, "KRW")).toEqual([
            { memberId: "owner", amount: 0 },
            { memberId: "member-1", amount: 0 },
            { memberId: "member-2", amount: 0 },
        ]);
        expect(getSettlementTransfers(places, members, "KRW")).toEqual([]);
    });

    it("splits equal costs exactly and excludes selected members", () => {
        const places = [
            createPlace("equal", 10),
            createPlace("excluded", 6, {
                mode: "equal",
                excludedMemberIds: ["member-2"],
            }),
        ];

        expect(getMemberSettlements(places, members, "KRW")).toEqual([
            { memberId: "owner", amount: 7 },
            { memberId: "member-1", amount: 6 },
            { memberId: "member-2", amount: 3 },
        ]);
    });

    it("uses individual amounts and splits transport equally", () => {
        const first = createPlace("first", 0);
        const place = createPlace("individual", 12, {
            mode: "individual",
            memberAmounts: {
                owner: 2,
                "member-1": 4,
                "member-2": 6,
            },
        });
        place.inbound = {
            mode: "bus",
            durationMin: 20,
            cost: { amount: 5, currency: "KRW" },
            isPassCovered: false,
        };
        place.order = 1;

        expect(getMemberSettlements([first, place], members, "KRW")).toEqual([
            { memberId: "owner", amount: 4 },
            { memberId: "member-1", amount: 6 },
            { memberId: "member-2", amount: 7 },
        ]);
    });

    it("creates transfers from each member's burden and the recorded payer", () => {
        const place = createPlace("individual", 12, {
            mode: "individual",
            memberAmounts: {
                owner: 2,
                "member-1": 4,
                "member-2": 6,
            },
        });
        place.placeCost.payerId = "member-1";

        expect(getSettlementTransfers([place], members, "KRW")).toEqual([
            { fromMemberId: "owner", toMemberId: "member-1", amount: 2 },
            {
                fromMemberId: "member-2",
                toMemberId: "member-1",
                amount: 6,
            },
        ]);
    });

    it("defaults unassigned transport costs to the first member", () => {
        const first = createPlace("first", 0);
        const place = createPlace("transport", 0);
        place.inbound = {
            mode: "bus",
            durationMin: 20,
            cost: { amount: 6, currency: "KRW" },
            isPassCovered: false,
        };
        place.order = 1;

        expect(getSettlementTransfers([first, place], members, "KRW")).toEqual([
            { fromMemberId: "member-1", toMemberId: "owner", amount: 2 },
            { fromMemberId: "member-2", toMemberId: "owner", amount: 2 },
        ]);
    });

    it("uses the transport payer and split when they are recorded", () => {
        const first = createPlace("first", 0);
        const place = createPlace("transport", 0);
        place.inbound = {
            mode: "bus",
            durationMin: 20,
            cost: { amount: 9, currency: "KRW" },
            isPassCovered: false,
            payerId: "member-2",
            split: {
                mode: "equal",
                excludedMemberIds: ["member-2"],
            },
        };
        place.order = 1;

        expect(getMemberSettlements([first, place], members, "KRW")).toEqual([
            { memberId: "owner", amount: 5 },
            { memberId: "member-1", amount: 4 },
            { memberId: "member-2", amount: 0 },
        ]);
        expect(getSettlementTransfers([first, place], members, "KRW")).toEqual([
            { fromMemberId: "owner", toMemberId: "member-2", amount: 5 },
            {
                fromMemberId: "member-1",
                toMemberId: "member-2",
                amount: 4,
            },
        ]);
    });

    it("does not create transfers when everyone pays their own amount onsite", () => {
        const place = createPlace("onsite", 12, {
            mode: "individual",
            memberAmounts: {
                owner: 2,
                "member-1": 4,
                "member-2": 6,
            },
        });
        place.placeCost.paymentMode = "individual";

        expect(getMemberSettlements([place], members, "KRW")).toEqual([
            { memberId: "owner", amount: 2 },
            { memberId: "member-1", amount: 4 },
            { memberId: "member-2", amount: 6 },
        ]);
        expect(getSettlementTransfers([place], members, "KRW")).toEqual([]);
    });

    it("supports direct payment with an equal split and excluded members", () => {
        const place = createPlace("direct-equal", 10, {
            mode: "equal",
            excludedMemberIds: ["member-2"],
        });
        place.placeCost.paymentMode = "individual";

        expect(getMemberSettlements([place], members, "KRW")).toEqual([
            { memberId: "owner", amount: 5 },
            { memberId: "member-1", amount: 5 },
            { memberId: "member-2", amount: 0 },
        ]);
        expect(getSettlementTransfers([place], members, "KRW")).toEqual([]);
    });

    it("does not reinterpret an invalid individual split", () => {
        const place = createPlace("invalid-onsite", 10, {
            mode: "individual",
            memberAmounts: {
                owner: 4,
                "member-1": 2,
                "member-2": 3,
            },
        });
        place.placeCost.paymentMode = "individual";

        expect(getMemberSettlements([place], members, "KRW")).toEqual([
            { memberId: "owner", amount: 0 },
            { memberId: "member-1", amount: 0 },
            { memberId: "member-2", amount: 0 },
        ]);
        expect(getSettlementTransfers([place], members, "KRW")).toEqual([]);
    });

    it("keeps recorded participants when a member is added later", () => {
        const originalMembers = members.slice(0, 2);
        const equalPlace = createPlace("equal-snapshot", 10, {
            mode: "equal",
            excludedMemberIds: [],
            includedMemberIds: ["owner", "member-1"],
        });
        const individualPlace = createPlace("individual-snapshot", 6, {
            mode: "individual",
            memberAmounts: { owner: 2, "member-1": 4 },
        });
        individualPlace.order = 1;

        expect(
            getMemberSettlements(
                [equalPlace, individualPlace],
                originalMembers,
                "KRW",
            ),
        ).toEqual([
            { memberId: "owner", amount: 7 },
            { memberId: "member-1", amount: 9 },
        ]);
        expect(
            getMemberSettlements([equalPlace, individualPlace], members, "KRW"),
        ).toEqual([
            { memberId: "owner", amount: 7 },
            { memberId: "member-1", amount: 9 },
            { memberId: "member-2", amount: 0 },
        ]);
    });

    it("ignores transport costs without a visible inbound segment", () => {
        const first = createPlace("first", 0);
        const second = createPlace("second", 0);
        first.inbound = {
            mode: "train",
            durationMin: 30,
            cost: { amount: 1_000, currency: "KRW" },
            isPassCovered: false,
        };
        second.order = 1;
        second.inbound = {
            mode: "subway",
            durationMin: 20,
            cost: { amount: 500, currency: "KRW" },
            isPassCovered: false,
        };

        expect(getBudgetSummary([first, second], "KRW").transport).toBe(500);
    });

    it("snapshots legacy expense participants before members change", () => {
        const place = createPlace("legacy", 9);
        place.placeCost.payerId = "member-1";
        const [snapshottedPlace] = snapshotExpenseParticipants(
            [place],
            members,
        );

        expect(snapshottedPlace?.placeCost.split).toEqual({
            mode: "equal",
            excludedMemberIds: [],
            includedMemberIds: ["owner", "member-1", "member-2"],
        });
        expect(
            getReferencedExpenseMemberIds(
                snapshottedPlace ? [snapshottedPlace] : [],
                members,
                "KRW",
            ),
        ).toEqual(new Set(["owner", "member-1", "member-2"]));
    });

    it("does not assign an unknown payer's payment to the owner", () => {
        const place = createPlace("unknown-payer", 9, {
            mode: "equal",
            excludedMemberIds: [],
            includedMemberIds: ["owner", "member-1", "member-2"],
        });
        place.placeCost.payerId = "removed-member";

        expect(getSettlementTransfers([place], members, "KRW")).toEqual([]);
    });

    it("does not redistribute an equal split when a recorded member is missing", () => {
        const place = createPlace("missing-member", 9, {
            mode: "equal",
            excludedMemberIds: [],
            includedMemberIds: ["owner", "removed-member"],
        });

        expect(getMemberSettlements([place], members, "KRW")).toEqual([
            { memberId: "owner", amount: 0 },
            { memberId: "member-1", amount: 0 },
            { memberId: "member-2", amount: 0 },
        ]);
        expect(getSettlementTransfers([place], members, "KRW")).toEqual([]);
    });

    it("settles a four-person trip with mixed payers and split rules", () => {
        const travelMembers = [
            { id: "suyun" },
            { id: "minji" },
            { id: "junho" },
            { id: "yuna" },
        ];
        const sushi = createPlace("sushi", 12_000, {
            mode: "equal",
            excludedMemberIds: ["yuna"],
        });
        sushi.placeCost.payerId = "suyun";
        sushi.inbound = {
            mode: "walk",
            durationMin: 15,
            cost: { amount: 999, currency: "KRW" },
            isPassCovered: false,
        };

        const museum = createPlace("museum", 7_000, {
            mode: "individual",
            memberAmounts: {
                suyun: 1_000,
                minji: 2_000,
                junho: 0,
                yuna: 4_000,
            },
        });
        museum.placeCost.payerId = "minji";
        museum.inbound = {
            mode: "subway",
            durationMin: 25,
            cost: { amount: 1_001, currency: "KRW" },
            isPassCovered: false,
        };

        const cafe = createPlace("cafe", 5_000);
        cafe.placeCost.payerId = "junho";
        cafe.inbound = {
            mode: "bus",
            durationMin: 10,
            cost: { amount: 800, currency: "KRW" },
            isPassCovered: true,
        };

        const dinner = createPlace("dinner", 10_001, {
            mode: "equal",
            excludedMemberIds: ["suyun"],
        });
        dinner.placeCost.payerId = "yuna";
        const tripPlaces = [sushi, museum, cafe, dinner];

        expect(getMemberSettlements(tripPlaces, travelMembers, "KRW")).toEqual([
            { memberId: "suyun", amount: 6_501 },
            { memberId: "minji", amount: 10_834 },
            { memberId: "junho", amount: 8_834 },
            { memberId: "yuna", amount: 8_833 },
        ]);
        expect(
            getSettlementTransfers(tripPlaces, travelMembers, "KRW"),
        ).toEqual([
            { fromMemberId: "minji", toMemberId: "suyun", amount: 3_834 },
            { fromMemberId: "junho", toMemberId: "suyun", amount: 2_666 },
            { fromMemberId: "junho", toMemberId: "yuna", amount: 1_168 },
        ]);
    });
});
