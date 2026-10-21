import type { Question } from '../questions';

const COUNTRIES = [
  ['Sri Lanka', 'Sri Jayawardenepura Kotte', 'Asya', 'Sri Lanka rupisi'],
  ['Maldivler', 'Malé', 'Asya', 'Rufiyaa'],
  ['Afganistan', 'Kabil', 'Asya', 'Afgani'],
  ['İran', 'Tahran', 'Asya', 'İran riyali'],
  ['Irak', 'Bağdat', 'Asya', 'Irak dinarı'],
  ['Suudi Arabistan', 'Riyad', 'Asya', 'Suudi riyali'],
  ['Birleşik Arap Emirlikleri', 'Abu Dabi', 'Asya', 'Dirhem'],
  ['Katar', 'Doha', 'Asya', 'Katar riyali'],
  ['Umman', 'Maskat', 'Asya', 'Umman riyali'],
  ['Ürdün', 'Amman', 'Asya', 'Ürdün dinarı'],
  ['Lübnan', 'Beyrut', 'Asya', 'Lübnan lirası'],
  ['Tayland', 'Bangkok', 'Asya', 'Baht'],
  ['Vietnam', 'Hanoi', 'Asya', 'Dong'],
  ['Kamboçya', 'Phnom Penh', 'Asya', 'Riel'],
  ['Laos', 'Viyentiyan', 'Asya', 'Kip'],
  ['Myanmar', 'Naypyidaw', 'Asya', 'Kyat'],
  ['Malezya', 'Kuala Lumpur', 'Asya', 'Ringgit'],
  ['Singapur', 'Singapur', 'Asya', 'Singapur doları'],
  ['Filipinler', 'Manila', 'Asya', 'Filipin pesosu'],
  ['Moğolistan', 'Ulan Batur', 'Asya', 'Tögrög'],
  ['Özbekistan', 'Taşkent', 'Asya', 'Som'],
  ['Kırgızistan', 'Bişkek', 'Asya', 'Som'],
  ['Tacikistan', 'Duşanbe', 'Asya', 'Somoni'],
  ['Türkmenistan', 'Aşkabat', 'Asya', 'Manat'],
  ['Mısır', 'Kahire', 'Afrika', 'Mısır lirası'],
  ['Etiyopya', 'Addis Ababa', 'Afrika', 'Birr'],
  ['Kenya', 'Nairobi', 'Afrika', 'Kenya şilini'],
  ['Tanzanya', 'Dodoma', 'Afrika', 'Tanzanya şilini'],
  ['Uganda', 'Kampala', 'Afrika', 'Uganda şilini'],
  ['Nijerya', 'Abuja', 'Afrika', 'Naira'],
  ['Gana', 'Akra', 'Afrika', 'Cedi'],
  ['Senegal', 'Dakar', 'Afrika', 'Batı Afrika CFA frangı'],
  ['Fas', 'Rabat', 'Afrika', 'Fas dirhemi'],
  ['Cezayir', 'Cezayir', 'Afrika', 'Cezayir dinarı'],
  ['Tunus', 'Tunus', 'Afrika', 'Tunus dinarı'],
  ['Libya', 'Trablus', 'Afrika', 'Libya dinarı'],
  ['Botsvana', 'Gaborone', 'Afrika', 'Pula'],
  ['Namibya', 'Windhoek', 'Afrika', 'Namibya doları'],
  ['Zambiya', 'Lusaka', 'Afrika', 'Kwacha'],
  ['Mozambik', 'Maputo', 'Afrika', 'Metical'],
  ['Madagaskar', 'Antananarivo', 'Afrika', 'Ariary'],
  ['Mauritius', 'Port Louis', 'Afrika', 'Mauritius rupisi'],
  ['Amerika Birleşik Devletleri', 'Washington, DC', 'Kuzey Amerika', 'ABD doları'],
  ['Kanada', 'Ottawa', 'Kuzey Amerika', 'Kanada doları'],
  ['Meksika', 'Meksiko', 'Kuzey Amerika', 'Meksika pesosu'],
  ['Küba', 'Havana', 'Kuzey Amerika', 'Küba pesosu'],
  ['Jamaika', 'Kingston', 'Kuzey Amerika', 'Jamaika doları'],
  ['Brezilya', 'Brasília', 'Güney Amerika', 'Real'],
  ['Şili', 'Santiago', 'Güney Amerika', 'Şili pesosu'],
  ['Peru', 'Lima', 'Güney Amerika', 'Sol'],
] as const;

function difficultyFor(index: number): Question['difficulty'] {
  if (index < 15) return 'easy';
  if (index < 35) return 'medium';
  return 'hard';
}

export const COGRAFYA_PART3: readonly Question[] = COUNTRIES.flatMap(
  ([country, capital, continent, currency], index) => {
    const difficulty = difficultyFor(index);
    const baseId = 251 + index;

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
