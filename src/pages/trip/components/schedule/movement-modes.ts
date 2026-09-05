import {
    Bike,
    BusFront,
    CarFront,
    Footprints,
    Route,
    TrainFront,
    TramFront,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { InboundMode } from "../../../../places/model";

export type MovementModeOption = {
    icon: LucideIcon;
    label: string;
    value: InboundMode;
};

export const movementModeOptions: MovementModeOption[] = [
    { value: "walk", label: "도보", icon: Footprints },
    { value: "car", label: "자동차", icon: CarFront },
    { value: "bus", label: "버스", icon: BusFront },
    { value: "subway", label: "지하철", icon: TramFront },
    { value: "train", label: "기차", icon: TrainFront },
    { value: "bike", label: "자전거", icon: Bike },
    { value: "other", label: "기타", icon: Route },
];

export function getMovementModeOption(mode: InboundMode | null) {
    return (
        movementModeOptions.find((option) => option.value === mode) ??
        movementModeOptions[movementModeOptions.length - 1]!
    );
}
