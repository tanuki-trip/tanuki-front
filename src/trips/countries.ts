export const supportedCountries = [
    {
        code: "KR",
        name: "한국",
        englishName: "South Korea",
        currencyCode: "KRW",
        currencyName: "원",
    },
    {
        code: "JP",
        name: "일본",
        englishName: "Japan",
        currencyCode: "JPY",
        currencyName: "엔",
    },
    {
        code: "VN",
        name: "베트남",
        englishName: "Vietnam",
        currencyCode: "VND",
        currencyName: "동",
    },
    {
        code: "CN",
        name: "중국",
        englishName: "China",
        currencyCode: "CNY",
        currencyName: "위안",
    },
    {
        code: "TH",
        name: "태국",
        englishName: "Thailand",
        currencyCode: "THB",
        currencyName: "바트",
    },
    {
        code: "US",
        name: "미국",
        englishName: "United States",
        currencyCode: "USD",
        currencyName: "달러",
    },
] as const;

export type Country = (typeof supportedCountries)[number];
export type CountryCode = (typeof supportedCountries)[number]["code"];

export function getCountry(countryCode: CountryCode): Country {
    const country = supportedCountries.find(({ code }) => code === countryCode);

    if (!country) {
        throw new Error(`Unsupported country code: ${countryCode}`);
    }

    return country;
}
