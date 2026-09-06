import { supportedCountries, type CountryCode } from "./countries";
import type { HubTransportType } from "./transport";

export type TransportHubKind = "airport" | "port";

export type TransportHub = {
    id: string;
    countryCode: CountryCode;
    kind: TransportHubKind;
    code: string;
    name: string;
    region: string;
    aliases: readonly string[];
    coordinates: {
        latitude: number;
        longitude: number;
    };
};

type HubSeed = readonly [
    id: string,
    kind: TransportHubKind,
    code: string,
    name: string,
    region: string,
    longitude: number,
    latitude: number,
    aliases?: readonly string[],
];

const hubSeeds: Record<CountryCode, readonly HubSeed[]> = {
    KR: [
        [
            "kr-icn",
            "airport",
            "ICN",
            "인천국제공항",
            "인천",
            126.4505,
            37.4692,
            ["서울", "수도권", "seoul", "incheon"],
        ],
        [
            "kr-gmp",
            "airport",
            "GMP",
            "김포국제공항",
            "서울",
            126.791,
            37.5583,
            ["김포", "수도권", "seoul"],
        ],
        [
            "kr-cju",
            "airport",
            "CJU",
            "제주국제공항",
            "제주",
            126.493,
            33.5104,
            ["제주도", "jeju"],
        ],
        [
            "kr-pus",
            "airport",
            "PUS",
            "김해국제공항",
            "부산",
            128.9382,
            35.1795,
            ["김해", "경남", "busan"],
        ],
        [
            "kr-tae",
            "airport",
            "TAE",
            "대구국제공항",
            "대구",
            128.6379,
            35.8941,
            ["경북", "daegu"],
        ],
        [
            "kr-cjj",
            "airport",
            "CJJ",
            "청주국제공항",
            "청주",
            127.4987,
            36.7166,
            ["대전", "충청", "cheongju"],
        ],
        [
            "kr-kwj",
            "airport",
            "KWJ",
            "광주공항",
            "광주",
            126.8089,
            35.1264,
            ["전남", "gwangju"],
        ],
        [
            "kr-rsu",
            "airport",
            "RSU",
            "여수공항",
            "여수",
            127.6169,
            34.8423,
            ["순천", "전남", "yeosu"],
        ],
        [
            "kr-yny",
            "airport",
            "YNY",
            "양양국제공항",
            "양양",
            128.6692,
            38.0613,
            ["속초", "강원", "yangyang"],
        ],
        [
            "kr-incheon-port",
            "port",
            "INCHEON",
            "인천항",
            "인천",
            126.6033,
            37.4522,
            ["서울", "수도권", "incheon"],
        ],
        [
            "kr-busan-port",
            "port",
            "BUSAN",
            "부산항",
            "부산",
            129.0403,
            35.1038,
            ["경남", "busan"],
        ],
        [
            "kr-jeju-port",
            "port",
            "JEJU",
            "제주항",
            "제주",
            126.5339,
            33.5186,
            ["제주도", "jeju"],
        ],
        [
            "kr-mokpo-port",
            "port",
            "MOKPO",
            "목포항",
            "목포",
            126.3817,
            34.7833,
            ["전남", "mokpo"],
        ],
        [
            "kr-sokcho-port",
            "port",
            "SOKCHO",
            "속초항",
            "속초",
            128.5942,
            38.2084,
            ["강원", "sokcho"],
        ],
        [
            "kr-pohang-port",
            "port",
            "POHANG",
            "포항항",
            "포항",
            129.3917,
            36.0417,
            ["경북", "pohang"],
        ],
    ],
    JP: [
        [
            "jp-hnd",
            "airport",
            "HND",
            "하네다 공항",
            "도쿄",
            139.7798,
            35.5494,
            ["동경", "tokyo"],
        ],
        [
            "jp-nrt",
            "airport",
            "NRT",
            "나리타 국제공항",
            "도쿄",
            140.3929,
            35.772,
            ["나리타", "치바", "동경", "tokyo"],
        ],
        [
            "jp-kix",
            "airport",
            "KIX",
            "간사이 국제공항",
            "오사카",
            135.244,
            34.4347,
            ["교토", "고베", "간사이", "osaka", "kyoto"],
        ],
        [
            "jp-itm",
            "airport",
            "ITM",
            "오사카 국제공항",
            "오사카",
            135.4382,
            34.7855,
            ["이타미", "교토", "고베", "osaka", "kyoto"],
        ],
        [
            "jp-fuk",
            "airport",
            "FUK",
            "후쿠오카 공항",
            "후쿠오카",
            130.451,
            33.5859,
            ["하카타", "규슈", "fukuoka"],
        ],
        [
            "jp-cts",
            "airport",
            "CTS",
            "신치토세 공항",
            "삿포로",
            141.6923,
            42.7752,
            ["홋카이도", "치토세", "sapporo"],
        ],
        [
            "jp-oka",
            "airport",
            "OKA",
            "나하 공항",
            "오키나와",
            127.6459,
            26.1958,
            ["나하", "okinawa"],
        ],
        [
            "jp-ngo",
            "airport",
            "NGO",
            "주부 국제공항",
            "나고야",
            136.8054,
            34.8584,
            ["아이치", "nagoya"],
        ],
        [
            "jp-hij",
            "airport",
            "HIJ",
            "히로시마 공항",
            "히로시마",
            132.9194,
            34.4361,
            ["hiroshima"],
        ],
        [
            "jp-hakata-port",
            "port",
            "HAKATA",
            "하카타항",
            "후쿠오카",
            130.401,
            33.606,
            ["하카타", "규슈", "fukuoka"],
        ],
        [
            "jp-osaka-port",
            "port",
            "OSAKA",
            "오사카항",
            "오사카",
            135.433,
            34.65,
            ["간사이", "osaka"],
        ],
        [
            "jp-shimonoseki-port",
            "port",
            "SHIMONOSEKI",
            "시모노세키항",
            "시모노세키",
            130.933,
            33.95,
            ["야마구치", "shimonoseki"],
        ],
        [
            "jp-kobe-port",
            "port",
            "KOBE",
            "고베항",
            "고베",
            135.1955,
            34.6825,
            ["오사카", "간사이", "kobe"],
        ],
        [
            "jp-yokohama-port",
            "port",
            "YOKOHAMA",
            "요코하마항",
            "요코하마",
            139.6488,
            35.4516,
            ["도쿄", "가나가와", "yokohama"],
        ],
        [
            "jp-sakaiminato-port",
            "port",
            "SAKAIMINATO",
            "사카이미나토항",
            "돗토리",
            133.247,
            35.545,
            ["요나고", "sakaiminato"],
        ],
    ],
};

export const transportHubs: readonly TransportHub[] =
    supportedCountries.flatMap(({ code: countryCode }) =>
        hubSeeds[countryCode].map(
            ([id, kind, code, name, region, longitude, latitude, aliases]) => ({
                id,
                countryCode,
                kind,
                code,
                name,
                region,
                aliases: aliases ?? [],
                coordinates: { latitude, longitude },
            }),
        ),
    );

function normalizeSearchText(value: string) {
    return value.toLocaleLowerCase("ko-KR").replace(/[\s-]+/g, "");
}

export function getTransportHub(hubId: string) {
    return transportHubs.find(({ id }) => id === hubId);
}

export function getTransportHubs(
    countryCode: CountryCode,
    transportType: HubTransportType,
) {
    const kind: TransportHubKind =
        transportType === "flight" ? "airport" : "port";

    return transportHubs.filter(
        (hub) => hub.countryCode === countryCode && hub.kind === kind,
    );
}

export function findTransportHub(
    countryCode: CountryCode,
    transportType: HubTransportType,
    hubId: string | null | undefined,
) {
    if (!hubId) {
        return undefined;
    }

    return getTransportHubs(countryCode, transportType).find(
        (hub) => hub.id === hubId,
    );
}

export function searchTransportHubs(
    countryCode: CountryCode,
    transportType: HubTransportType,
    query: string,
) {
    const hubs = getTransportHubs(countryCode, transportType);
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) {
        return hubs.slice(0, 6);
    }

    return hubs.filter((hub) =>
        [hub.region, hub.name, hub.code, ...hub.aliases].some((value) =>
            normalizeSearchText(value).includes(normalizedQuery),
        ),
    );
}
