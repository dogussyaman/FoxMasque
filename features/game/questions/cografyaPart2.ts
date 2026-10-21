import type { Question } from '../questions';

const COUNTRIES = [
  ['Fransa', 'Paris', 'Avrupa', 'Euro'],
  ['Almanya', 'Berlin', 'Avrupa', 'Euro'],
  ['İtalya', 'Roma', 'Avrupa', 'Euro'],
  ['İspanya', 'Madrid', 'Avrupa', 'Euro'],
  ['Portekiz', 'Lizbon', 'Avrupa', 'Euro'],
  ['Birleşik Krallık', 'Londra', 'Avrupa', 'İngiliz sterlini'],
  ['İrlanda', 'Dublin', 'Avrupa', 'Euro'],
  ['Hollanda', 'Amsterdam', 'Avrupa', 'Euro'],
  ['Belçika', 'Brüksel', 'Avrupa', 'Euro'],
  ['İsviçre', 'Bern', 'Avrupa', 'İsviçre frangı'],
  ['Avusturya', 'Viyana', 'Avrupa', 'Euro'],
  ['Polonya', 'Varşova', 'Avrupa', 'Zloti'],
  ['Çekya', 'Prag', 'Avrupa', 'Çek korunası'],
  ['Macaristan', 'Budapeşte', 'Avrupa', 'Forint'],
  ['Yunanistan', 'Atina', 'Avrupa', 'Euro'],
  ['Norveç', 'Oslo', 'Avrupa', 'Norveç kronu'],
  ['İsveç', 'Stockholm', 'Avrupa', 'İsveç kronu'],
  ['Danimarka', 'Kopenhag', 'Avrupa', 'Danimarka kronu'],
  ['Finlandiya', 'Helsinki', 'Avrupa', 'Euro'],
  ['İzlanda', 'Reykjavik', 'Avrupa', 'İzlanda kronu'],
  ['Romanya', 'Bükreş', 'Avrupa', 'Rumen leyi'],
  ['Bulgaristan', 'Sofya', 'Avrupa', 'Euro'],
  ['Ukrayna', 'Kyiv', 'Avrupa', 'Grivna'],
  ['Rusya', 'Moskova', 'Avrupa ve Asya', 'Rus rublesi'],
  ['Türkiye', 'Ankara', 'Avrupa ve Asya', 'Türk lirası'],
  ['Sırbistan', 'Belgrad', 'Avrupa', 'Sırp dinarı'],
  ['Hırvatistan', 'Zagreb', 'Avrupa', 'Euro'],
  ['Slovenya', 'Ljubljana', 'Avrupa', 'Euro'],
  ['Slovakya', 'Bratislava', 'Avrupa', 'Euro'],
  ['Estonya', 'Tallinn', 'Avrupa', 'Euro'],
  ['Letonya', 'Riga', 'Avrupa', 'Euro'],
  ['Litvanya', 'Vilnius', 'Avrupa', 'Euro'],
  ['Lüksemburg', 'Lüksemburg', 'Avrupa', 'Euro'],
  ['Malta', 'Valletta', 'Avrupa', 'Euro'],
  ['Kıbrıs Cumhuriyeti', 'Lefkoşa', 'Asya', 'Euro'],
  ['Arnavutluk', 'Tiran', 'Avrupa', 'Lek'],
  ['Bosna-Hersek', 'Saraybosna', 'Avrupa', 'Konvertibl mark'],
  ['Kuzey Makedonya', 'Üsküp', 'Avrupa', 'Makedon denarı'],
  ['Karadağ', 'Podgorica', 'Avrupa', 'Euro'],
  ['Gürcistan', 'Tiflis', 'Asya', 'Lari'],
  ['Ermenistan', 'Erivan', 'Asya', 'Dram'],
  ['Azerbaycan', 'Bakü', 'Asya', 'Manat'],
  ['Kazakistan', 'Astana', 'Asya', 'Tenge'],
  ['Japonya', 'Tokyo', 'Asya', 'Yen'],
  ['Çin', 'Pekin', 'Asya', 'Renminbi (yuan)'],
  ['Güney Kore', 'Seul', 'Asya', 'Güney Kore wonu'],
  ['Hindistan', 'Yeni Delhi', 'Asya', 'Hindistan rupisi'],
  ['Pakistan', 'İslamabad', 'Asya', 'Pakistan rupisi'],
  ['Bangladeş', 'Dakka', 'Asya', 'Taka'],
  ['Nepal', 'Katmandu', 'Asya', 'Nepal rupisi'],
] as const;

function difficultyFor(index: number): Question['difficulty'] {
  if (index < 15) return 'easy';
  if (index < 35) return 'medium';
  return 'hard';
}

export const COGRAFYA_PART2: readonly Question[] = COUNTRIES.flatMap(
  ([country, capital, continent, currency], index) => {
    const difficulty = difficultyFor(index);
    const baseId = 101 + index;

    return [
      {
        id: `cg-${baseId}`,
        categoryId: 'cografya',
        prompt: `${country} devletinin başkenti hangi şehirdir?`,
        correctAnswer: capital,
        difficulty,
        explanation: `${capital}, ${country} devletinin başkentidir.`,
        status: 'approved',
      },
      {
        id: `cg-${baseId + 50}`,
        categoryId: 'cografya',
        prompt: `${country} hangi kıta ya da kıtalarda yer alır?`,
        correctAnswer: continent,
        difficulty,
        explanation: `${country}, ${continent} kıtasında ya da kıtalarında yer alır.`,
        status: 'approved',
      },
      {
        id: `cg-${baseId + 100}`,
        categoryId: 'cografya',
        prompt: `${country} ülkesinin para birimi nedir?`,
        correctAnswer: currency,
        difficulty,
        explanation: `${currency}, ${country} ülkesinin resmî para birimidir.`,
        status: 'approved',
      },
    ];
  }
);
