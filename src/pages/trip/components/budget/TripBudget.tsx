import { ChevronDown, Pencil } from "lucide-react";
import { useMemo, useState } from "react";

import {
    getTripPlacesForDay,
    type TripInbound,
    type TripPlace,
    type TripPlaceCost,
} from "../../../../places/model";
import type { TripMember } from "../../../../trips/store";
import { TripDayBadges, type TripDayKey } from "../schedule/TripDayBadges";
import { BudgetEditorDialog } from "./BudgetEditorDialog";
import {
    getBudgetSummary,
    getInboundCostAmount,
    getMemberSettlements,
    getPlaceCostAmount,
    getSettlementTransfers,
} from "./budget-summary";
import styles from "./TripBudget.module.css";

type TripBudgetProps = {
    activeDay: TripDayKey;
    currencyCode: string;
    endDate: string;
    members: readonly TripMember[];
    onDayChange: (day: TripDayKey) => void;
    onInboundChange: (placeId: string, inbound: TripInbound) => void;
    onPlaceCostChange: (placeId: string, cost: TripPlaceCost) => void;
    onTotalBudgetChange: (amount: number) => void;
    places: readonly TripPlace[];
    startDate: string;
    totalBudgetAmount: number | null;
};

const categoryItems = [
    { key: "transport", label: "교통비" },
    { key: "food", label: "식비" },
    { key: "tourism", label: "관광비" },
    { key: "other", label: "기타" },
] as const;

const moneyFormatter = new Intl.NumberFormat("ko-KR");

function formatMoney(amount: number, currencyCode: string) {
    return `${moneyFormatter.format(amount)} ${currencyCode}`;
}

export function TripBudget({
    activeDay,
    currencyCode,
    endDate,
    members,
    onDayChange,
    onInboundChange,
    onPlaceCostChange,
    onTotalBudgetChange,
    places,
    startDate,
    totalBudgetAmount,
}: TripBudgetProps) {
    const [editor, setEditor] = useState<
        | { mode: "total" }
        | { mode: "place" | "transport"; placeId: string }
        | null
    >(null);
    const { summary, settlements, transfers } = useMemo(
        () => ({
            summary: getBudgetSummary(places, currencyCode),
            settlements: getMemberSettlements(places, members, currencyCode),
            transfers: getSettlementTransfers(places, members, currencyCode),
        }),
        [currencyCode, members, places],
    );
    const memberNameById = useMemo(
        () => new Map(members.map((member) => [member.id, member.name])),
        [members],
    );
    const remainingBudget =
        totalBudgetAmount === null ? null : totalBudgetAmount - summary.used;
    const activePlaces = getTripPlacesForDay(places, activeDay);
    const isBookmark = activeDay === "bookmark";
    const editingPlace =
        editor?.mode === "place" || editor?.mode === "transport"
            ? places.find((place) => place.id === editor.placeId)
            : null;

    return (
        <div className={styles.budget}>
            <section className={styles.summary} aria-label="예산 요약">
                <dl className={styles.totals}>
                    <div>
                        <dt>총 예산</dt>
                        <dd>
                            <button
                                className={styles.totalButton}
                                type="button"
                                aria-label={`총 예산 설정, 현재 ${
                                    totalBudgetAmount === null
                                        ? "미설정"
                                        : formatMoney(
                                              totalBudgetAmount,
                                              currencyCode,
                                          )
                                }`}
                                onClick={() => setEditor({ mode: "total" })}
                            >
                                {totalBudgetAmount === null
                                    ? "미설정"
                                    : formatMoney(
                                          totalBudgetAmount,
                                          currencyCode,
                                      )}
                            </button>
                        </dd>
                    </div>
                    <div className={styles.usedTotal}>
                        <dt>현재 사용한 금액</dt>
                        <dd>
                            <details className={styles.settlementDetails}>
                                <summary
                                    role="button"
                                    aria-label="개인별 정산 세부 보기"
                                >
                                    <span>
                                        {formatMoney(
                                            summary.used,
                                            currencyCode,
                                        )}
                                    </span>
                                    <ChevronDown aria-hidden="true" />
                                </summary>
                                <div
                                    className={styles.settlementMenu}
                                    role="group"
                                    aria-label="개인별 정산 금액"
                                >
                                    <p>개인별 부담액</p>
                                    <ul>
                                        {settlements.map((settlement) => {
                                            return (
                                                <li key={settlement.memberId}>
                                                    <span>
                                                        {memberNameById.get(
                                                            settlement.memberId,
                                                        ) ?? "알 수 없음"}
                                                    </span>
                                                    <strong>
                                                        {formatMoney(
                                                            settlement.amount,
                                                            currencyCode,
                                                        )}
                                                    </strong>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    <p className={styles.transferTitle}>
                                        정산 결과
                                    </p>
                                    {transfers.length > 0 ? (
                                        <ul>
                                            {transfers.map((transfer) => {
                                                return (
                                                    <li
                                                        key={`${transfer.fromMemberId}-${transfer.toMemberId}`}
                                                    >
                                                        <span>
                                                            {memberNameById.get(
                                                                transfer.fromMemberId,
                                                            ) ?? "알 수 없음"}
                                                            {" → "}
                                                            {memberNameById.get(
                                                                transfer.toMemberId,
                                                            ) ?? "알 수 없음"}
                                                        </span>
                                                        <strong>
                                                            {formatMoney(
                                                                transfer.amount,
                                                                currencyCode,
                                                            )}
                                                        </strong>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className={styles.emptyTransfer}>
                                            정산할 금액이 없습니다.
                                        </p>
                                    )}
                                </div>
                            </details>
                            {remainingBudget !== null ? (
                                <span
                                    className={styles.budgetStatus}
                                    data-over={
                                        remainingBudget < 0 ? "true" : undefined
                                    }
                                    aria-live="polite"
                                >
                                    {remainingBudget > 0
                                        ? `남은 예산 ${formatMoney(
                                              remainingBudget,
                                              currencyCode,
                                          )}`
                                        : remainingBudget === 0
                                          ? "예산을 모두 사용했어요"
                                          : `예산 초과 ${formatMoney(
                                                Math.abs(remainingBudget),
                                                currencyCode,
                                            )}`}
                                </span>
                            ) : null}
                        </dd>
                    </div>
                </dl>

                <dl className={styles.categories}>
                    {categoryItems.map(({ key, label }) => (
                        <div key={key}>
                            <dt>{label}</dt>
                            <dd>{formatMoney(summary[key], currencyCode)}</dd>
                        </div>
                    ))}
                </dl>
            </section>

            <div className={styles.dayNavigation}>
                <TripDayBadges
                    startDate={startDate}
                    endDate={endDate}
                    activeDay={activeDay}
                    onDayChange={onDayChange}
                />
            </div>

            <section
                className={styles.timeline}
                aria-label={
                    isBookmark ? "북마크 예산" : `${activeDay}일차 예산`
                }
            >
                {activePlaces.length === 0 ? (
                    <p className={styles.empty}>등록된 장소가 없습니다.</p>
                ) : (
                    <ol className={styles.list}>
                        {activePlaces.map((place, index) => {
                            const inboundCost = getInboundCostAmount(
                                place,
                                currencyCode,
                            );
                            const placeAmount = getPlaceCostAmount(
                                place,
                                currencyCode,
                            );

                            return (
                                <li key={place.id}>
                                    {index > 0 && !isBookmark ? (
                                        <div className={styles.movement}>
                                            <span aria-hidden="true" />
                                            <p>교통비</p>
                                            <strong>
                                                {formatMoney(
                                                    inboundCost,
                                                    currencyCode,
                                                )}
                                            </strong>
                                            <button
                                                className={styles.movementEdit}
                                                type="button"
                                                aria-label={`${place.name}까지 교통비 수정`}
                                                title="교통비 수정"
                                                disabled={
                                                    place.inbound.mode ===
                                                    "walk"
                                                }
                                                onClick={() =>
                                                    setEditor({
                                                        mode: "transport",
                                                        placeId: place.id,
                                                    })
                                                }
                                            >
                                                <Pencil aria-hidden="true" />
                                            </button>
                                        </div>
                                    ) : null}
                                    <article className={styles.card}>
                                        {isBookmark ? null : (
                                            <span
                                                className={styles.order}
                                                aria-label={`${index + 1}번째 장소`}
                                            >
                                                {index + 1}
                                            </span>
                                        )}
                                        <div className={styles.place}>
                                            <h3>{place.name}</h3>
                                            <p>{place.address}</p>
                                        </div>
                                        <button
                                            className={styles.amount}
                                            type="button"
                                            aria-label={`${place.name} 금액 수정, 현재 ${
                                                placeAmount > 0
                                                    ? formatMoney(
                                                          placeAmount,
                                                          currencyCode,
                                                      )
                                                    : "미입력"
                                            }`}
                                            onClick={() =>
                                                setEditor({
                                                    mode: "place",
                                                    placeId: place.id,
                                                })
                                            }
                                        >
                                            {placeAmount > 0
                                                ? formatMoney(
                                                      placeAmount,
                                                      currencyCode,
                                                  )
                                                : "미입력"}
                                        </button>
                                    </article>
                                </li>
                            );
                        })}
                    </ol>
                )}
            </section>

            {editor?.mode === "total" ? (
                <BudgetEditorDialog
                    amount={totalBudgetAmount}
                    currencyCode={currencyCode}
                    mode="total"
                    onClose={() => setEditor(null)}
                    onSave={(amount) => {
                        onTotalBudgetChange(amount);
                        setEditor(null);
                    }}
                />
            ) : null}

            {editor?.mode === "place" && editingPlace ? (
                <BudgetEditorDialog
                    currencyCode={currencyCode}
                    members={members}
                    mode="place"
                    place={editingPlace}
                    onClose={() => setEditor(null)}
                    onSave={(cost) => {
                        onPlaceCostChange(editingPlace.id, cost);
                        setEditor(null);
                    }}
                />
            ) : null}

            {editor?.mode === "transport" && editingPlace ? (
                <BudgetEditorDialog
                    currencyCode={currencyCode}
                    members={members}
                    mode="transport"
                    place={editingPlace}
                    onClose={() => setEditor(null)}
                    onSave={(inbound) => {
                        onInboundChange(editingPlace.id, inbound);
                        setEditor(null);
                    }}
                />
            ) : null}
        </div>
    );
}
