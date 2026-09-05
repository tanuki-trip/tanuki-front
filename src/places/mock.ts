import type { CountryCode } from "../trips/countries";

export type InboundMode =
    "walk" | "car" | "bus" | "subway" | "train" | "bike" | "other";

export type TripInbound = {
    mode: InboundMode | null;
    durationMin: number | null;
    cost: {
        amount: number;
        currency: string;
    } | null;
    isPassCovered: boolean;
};

export type TripPlace = {
    id: string;
    name: string;
    address: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    day: number | "bookmark";
    order: number | null;
    arrivalTime: string | null;
    memo: string | null;
    placeCost: {
        amount: number;
        currency: string;
    };
    inbound: TripInbound;
};

type PlaceSeed = readonly [
    name: string,
    address: string,
    longitude?: number,
    latitude?: number,
];

const placeSeeds: Partial<Record<CountryCode, readonly PlaceSeed[]>> = {
    JP: [
        ["센소지", "2-3-1 Asakusa, Taito City", 139.7967, 35.7148],
        ["도쿄 스카이트리", "1-1-2 Oshiage, Sumida City", 139.8107, 35.7101],
        ["쓰키지 장외시장", "4 Chome Tsukiji, Chuo City", 139.7708, 35.6655],
        [
            "teamLab Borderless",
            "Azabudai Hills, Minato City",
            139.7407,
            35.6603,
        ],
        ["시부야 스카이", "2-24-12 Shibuya, Shibuya City", 139.7021, 35.6584],
        ["블루보틀 기요스미", "1-4-8 Hirano, Koto City", 139.8006, 35.6816],
        [
            "메이지 신궁",
            "1-1 Yoyogikamizonocho, Shibuya City",
            139.6993,
            35.6764,
        ],
        ["호텔 니혼바시", "2 Chome Nihonbashi, Chuo City", 139.773, 35.683],
    ],
    CN: [
        ["와이탄", "Zhongshan East 1st Road, Huangpu", 121.4904, 31.2415],
        ["예원", "279 Yuyuan Old Street, Huangpu", 121.492, 31.2272],
        ["난징동루", "Nanjing East Road, Huangpu", 121.4823, 31.2383],
        ["동방명주", "1 Century Avenue, Pudong", 121.4998, 31.2397],
        ["신텐디", "Lane 181 Taicang Road, Huangpu", 121.4748, 31.2185],
        ["티엔즈팡", "Taikang Road, Huangpu", 121.4682, 31.2089],
        ["상하이 카페", "Huaihai Middle Road, Huangpu", 121.466, 31.22],
        ["푸둥 리버사이드 호텔", "Pudong Avenue, Pudong", 121.52, 31.24],
    ],
    VN: [
        ["미케 비치", "Vo Nguyen Giap, Son Tra", 108.247, 16.061],
        ["바나힐", "Hoa Vang, Da Nang", 107.996, 15.996],
        ["한시장", "119 Tran Phu, Hai Chau", 108.223, 16.068],
        ["다낭 핑크성당", "156 Tran Phu, Hai Chau", 108.223, 16.067],
        ["용다리", "Nguyen Van Linh, Hai Chau", 108.227, 16.061],
        ["마담란", "4 Bach Dang, Hai Chau", 108.223, 16.074],
        ["콩카페 다낭", "96 Bach Dang, Hai Chau", 108.223, 16.069],
        ["미케 리조트", "Pham Van Dong, Son Tra", 108.244, 16.072],
    ],
};

const fallbackSeeds: readonly PlaceSeed[] = [
    ["중앙 광장", "City Center"],
    ["시립 박물관", "Museum District"],
    ["올드타운 산책로", "Old Town"],
    ["현지 맛집", "Main Street"],
    ["리버사이드 카페", "Riverside Road"],
    ["전통시장", "Market Street"],
    ["시내 전망대", "Hill Road"],
    ["센트럴 호텔", "Central Avenue"],
];

const arrivalTimes = ["09:00", "11:30", "14:00", "16:30", "19:00"];
const inboundModes: InboundMode[] = ["walk", "subway", "bus", "train"];
const unitByCurrency: Record<string, number> = {
    CNY: 20,
    JPY: 500,
    KRW: 5000,
    THB: 100,
    USD: 10,
    VND: 100_000,
};

const fallbackCenters: Record<
    CountryCode,
    [longitude: number, latitude: number]
> = {
    JP: [139.7671, 35.6812],
    VN: [108.2208, 16.0678],
    CN: [121.4737, 31.2304],
    TH: [100.5018, 13.7563],
    US: [-74.006, 40.7128],
};

function hashText(value: string) {
    return Array.from(value).reduce(
        (hash, character) =>
            Math.imul(hash ^ character.charCodeAt(0), 16_777_619),
        2_166_136_261,
    );
}

function createRandom(seed: string) {
    let value = hashText(seed) >>> 0;

    return () => {
        value = (Math.imul(value, 1_664_525) + 1_013_904_223) >>> 0;
        return value / 4_294_967_296;
    };
}

function shuffle<T>(items: readonly T[], random: () => number) {
    const result = [...items];

    for (let index = result.length - 1; index > 0; index -= 1) {
        const targetIndex = Math.floor(random() * (index + 1));
        const item = result[index];
        result[index] = result[targetIndex];
        result[targetIndex] = item;
    }

    return result;
}

function createPlacesForDay({
    countryCode,
    currencyCode,
    day,
    tripId,
}: {
    countryCode: CountryCode;
    currencyCode: string;
    day: number | "bookmark";
    tripId: string;
}) {
    const random = createRandom(`${tripId}:${day}`);
    const seeds = shuffle(placeSeeds[countryCode] ?? fallbackSeeds, random);
    const count = 3 + Math.floor(random() * 3);
    const unit = unitByCurrency[currencyCode] ?? 10;

    return seeds.slice(0, count).map<TripPlace>((seed, index) => {
        const [name, address, seedLongitude, seedLatitude] = seed;
        const isBookmark = day === "bookmark";
        const [fallbackLongitude, fallbackLatitude] =
            fallbackCenters[countryCode];

        return {
            id: `mock-${tripId}-${day}-${index}`,
            name,
            address,
            coordinates: {
                longitude:
                    seedLongitude ??
                    fallbackLongitude + (random() - 0.5) * 0.12,
                latitude:
                    seedLatitude ?? fallbackLatitude + (random() - 0.5) * 0.12,
            },
            day,
            order: isBookmark ? null : index,
            arrivalTime: isBookmark ? null : arrivalTimes[index],
            memo: null,
            placeCost: {
                amount: (1 + Math.floor(random() * 6)) * unit,
                currency: currencyCode,
            },
            inbound:
                isBookmark || index === 0
                    ? {
                          mode: null,
                          durationMin: null,
                          cost: null,
                          isPassCovered: false,
                      }
                    : {
                          mode: inboundModes[(index - 1) % inboundModes.length],
                          durationMin: 10 + Math.floor(random() * 31),
                          cost:
                              inboundModes[
                                  (index - 1) % inboundModes.length
                              ] === "walk"
                                  ? null
                                  : {
                                        amount: Math.max(
                                            1,
                                            Math.round(unit / 3),
                                        ),
                                        currency: currencyCode,
                                    },
                          isPassCovered: false,
                      },
        };
    });
}

export function createMockTripPlaces({
    countryCode,
    currencyCode,
    dayCount,
    tripId,
}: {
    countryCode: CountryCode;
    currencyCode: string;
    dayCount: number;
    tripId: string;
}) {
    const days = Array.from({ length: dayCount }, (_, index) => index + 1);

    return [...days, "bookmark" as const].flatMap((day) =>
        createPlacesForDay({ countryCode, currencyCode, day, tripId }),
    );
}
