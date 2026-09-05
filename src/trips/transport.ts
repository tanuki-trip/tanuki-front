export type HubTransportType = "flight" | "ship";
export type TransportType = HubTransportType | "other";

export const transportLabels = {
    flight: "비행기",
    ship: "배",
    other: "기타",
} as const satisfies Record<TransportType, string>;

export function isHubTransportType(
    transportType: TransportType | null | undefined,
): transportType is HubTransportType {
    return transportType === "flight" || transportType === "ship";
}
