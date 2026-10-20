export type QuestionId = string;

export interface Question {
  id: QuestionId;
  categoryId: import('./categories').CategoryId;
  prompt: string;
  options: readonly string[];
  correctIndex: number;
  correctAnswer?: string;
  defaultDecoys?: readonly string[];
  explanation: string;
}

export const QUESTIONS: readonly Question[] = [
  // Genel Kültür
  {
    id: 'gk-1',
    categoryId: 'genel-kultur',
    prompt: 'Türkiye Cumhuriyeti hangi yıl ilan edildi?',
    options: ['1920', '1923', '1925', '1930'],
    correctIndex: 1,
    explanation: '29 Ekim 1923’te Cumhuriyet ilan edildi.',
  },
  {
    id: 'gk-2',
    categoryId: 'genel-kultur',
    prompt: 'Dünya’nın en büyük okyanusu hangisidir?',
    options: ['Atlas Okyanusu', 'Hint Okyanusu', 'Büyük Okyanus', 'Arktik Okyanus'],
    correctIndex: 2,
    explanation: 'Büyük (Pasifik) Okyanusu en büyük okyanustur.',
  },
  {
    id: 'gk-3',
    categoryId: 'genel-kultur',
    prompt: 'İnsan vücudunda kaç kemik bulunur?',
    options: ['196', '206', '216', '226'],
    correctIndex: 1,
    explanation: 'Yetişkin bir insanda 206 kemik vardır.',
  },
  {
    id: 'gk-4',
    categoryId: 'genel-kultur',
    prompt: '“Suç ve Ceza” romanının yazarı kimdir?',
    options: ['Tolstoy', 'Dostoyevski', 'Çehov', 'Gogol'],
    correctIndex: 1,
    explanation: 'Fyodor Dostoyevski tarafından yazılmıştır.',
  },
  {
    id: 'gk-5',
    categoryId: 'genel-kultur',
    prompt: 'Işık hızı yaklaşık olarak nedir?',
    options: ['300.000 km/s', '150.000 km/s', '30.000 km/s', '1.000.000 km/s'],
    correctIndex: 0,
    explanation: 'Işık boşlukta ~300.000 km/s hızla yayılır.',
  },

  // Hayvanlar Alemi
  {
    id: 'hy-1',
    categoryId: 'hayvanlar-alem',
    prompt: 'Bir grup flamingoya ne denir?',
    options: ['Sürü', 'Koloni', 'Yığın', 'Flamboyans'],
    correctIndex: 3,
    explanation: 'Flamingo topluluklarına “flamboyans” denir.',
  },
  {
    id: 'hy-2',
    categoryId: 'hayvanlar-alem',
    prompt: 'Kalan kaç pandanın nesli tehlikededir; pandasanın dil rengi?',
    options: ['Pembe', 'Mavi', 'Mor', 'Yeşil'],
    correctIndex: 0,
    explanation: 'Pandanın dili pembemsi kırmızıdır.',
  },
  {
    id: 'hy-3',
    categoryId: 'hayvanlar-alem',
    prompt: 'Bir salyangoz kaç dişe sahip olabilir?',
    options: ['Hiç dişi yoktur', 'Yaklaşık 100', 'Yaklaşık 10.000', 'Yaklaşık 25.000'],
    correctIndex: 3,
    explanation: 'Bazı salyangoz türlerinde ~25.000 diş bulunur.',
  },
  {
    id: 'hy-4',
    categoryId: 'hayvanlar-alem',
    prompt: 'Hangi hayvan parmak izine sahiptir?',
    options: ['Maymun', 'Kozyağı (koala)', 'Kanguru', 'Timsah'],
    correctIndex: 1,
    explanation: 'Koalaların parmak izi insanlarınkine çok benzer.',
  },
  {
    id: 'hy-5',
    categoryId: 'hayvanlar-alem',
    prompt: 'Balina bir ...',
    options: ['Balıktır', 'Memelidir', 'Sürüngendir', 'Amfibyandır'],
    correctIndex: 1,
    explanation: 'Balinalar memeli hayvanlardır.',
  },

  // Film ve Dizi
  {
    id: 'fm-1',
    categoryId: 'film-ve-dizi',
    prompt: '“Esaret” (Parasite) hangi ülkenin filmidir?',
    options: ['Japonya', 'Güney Kore', 'Çin', 'Tayvan'],
    correctIndex: 1,
    explanation: 'Bong Joon-ho’nun Güney Kore filmidir.',
  },
  {
    id: 'fm-2',
    categoryId: 'film-ve-dizi',
    prompt: '“Breaking Bad” hangi karakterin etrafında döner?',
    options: ['Walter White', 'Don Draper', 'Rick Grimes', 'Marty Byrde'],
    correctIndex: 0,
    explanation: 'Walter White’ın dönüşümünü anlatır.',
  },
  {
    id: 'fm-3',
    categoryId: 'film-ve-dizi',
    prompt: '“Yüzüklerin Efendisi” hangi yazardan uyarlanmıştır?',
    options: ['C.S. Lewis', 'J.R.R. Tolkien', 'George R.R. Martin', 'Brandon Sanderson'],
    correctIndex: 1,
    explanation: 'J.R.R. Tolkien’in eserinden uyarlanmıştır.',
  },
  {
    id: 'fm-4',
    categoryId: 'film-ve-dizi',
    prompt: '“La La Land” müzikalinde başrol kadın oyuncu kimdir?',
    options: ['Natalie Portman', 'Emma Stone', 'Anne Hathaway', 'Scarlett Johansson'],
    correctIndex: 1,
    explanation: 'Emma Stone Mia rolünü oynamıştır.',
  },
  {
    id: 'fm-5',
    categoryId: 'film-ve-dizi',
    prompt: '“Dark” dizisi hangi ülkede geçer?',
    options: ['Almanya', 'Avusturya', 'Danimarka', 'İsveç'],
    correctIndex: 0,
    explanation: 'Alman yapımı bir bilim kurgu dizisidir.',
  },

  // Osmanlı Dönemi
  {
    id: 'os-1',
    categoryId: 'osmanli-donemi',
    prompt: 'İstanbul hangi yıl fethedilmiştir?',
    options: ['1451', '1453', '1455', '1461'],
    correctIndex: 1,
    explanation: 'Fatih Sultan Mehmet 29 Mayıs 1453’te İstanbul’u fethetti.',
  },
  {
    id: 'os-2',
    categoryId: 'osmanli-donemi',
    prompt: 'Osmanlı Devleti’nin kurucusu ve ilk padişahı kimdir?',
    options: ['Ertuğrul Gazi', 'Osman Bey', 'Orhan Bey', 'I. Murad'],
    correctIndex: 1,
    explanation: 'Osman Bey beyliği kurarak ilk hükümdar olmuştur.',
  },
  {
    id: 'os-3',
    categoryId: 'osmanli-donemi',
    prompt: 'En uzun süre tahtta kalan Osmanlı padişahı hangisidir?',
    options: ['Fatih Sultan Mehmet', 'Kanuni Sultan Süleyman', 'Yavuz Sultan Selim', 'II. Abdülhamid'],
    correctIndex: 1,
    explanation: 'Kanuni Sultan Süleyman 46 yıl boyunca tahtta kalmıştır.',
  },
  {
    id: 'os-4',
    categoryId: 'osmanli-donemi',
    prompt: 'Mimar Sinan’ın “Ustalık eserim” dediği şaheser hangisidir?',
    options: ['Süleymaniye Camii', 'Selimiye Camii', 'Şehzade Camii', 'Sultanahmet Camii'],
    correctIndex: 1,
    explanation: 'Edirne’deki Selimiye Camii Mimar Sinan’ın ustalık eseridir.',
  },
  {
    id: 'os-5',
    categoryId: 'osmanli-donemi',
    prompt: 'Osmanlı’da donanma komutanına verilen unvan hangisidir?',
    options: ['Kazasker', 'Kaptan-ı Derya', 'Vezir-i Azam', 'Defterdar'],
    correctIndex: 1,
    explanation: 'Kaptan-ı Derya Osmanlı deniz kuvvetlerinin başkomutanıydı.',
  },

  // Dünya Tarihi
  {
    id: 'dt-1',
    categoryId: 'dunya-tarihi',
    prompt: 'Antik Dünyanın 7 Harikasından günümüze ulaşan tek eser hangisidir?',
    options: ['Babil’in Asma Bahçeleri', 'Keops Piramidi', 'İskenderiye Feneri', 'Rodos Heykeli'],
    correctIndex: 1,
    explanation: 'Gize’deki Keops Piramidi günümüze sağlam kalan tek antik harikadır.',
  },
  {
    id: 'dt-2',
    categoryId: 'dunya-tarihi',
    prompt: 'Rönesans hareketi ilk olarak hangi ülkede başlamıştır?',
    options: ['Fransa', 'İtalya', 'İngiltere', 'Almanya'],
    correctIndex: 1,
    explanation: 'Rönesans 14. yüzyılda İtalya’nın Floransa kentinde doğmuştur.',
  },
  {
    id: 'dt-3',
    categoryId: 'dunya-tarihi',
    prompt: 'Fransız İhtilali hangi yılda patlak vermiştir?',
    options: ['1776', '1789', '1804', '1815'],
    correctIndex: 1,
    explanation: 'Bastille Baskını ile 1789 yılında başlamıştır.',
  },
  {
    id: 'dt-4',
    categoryId: 'dunya-tarihi',
    prompt: 'Tarihte bilinen ilk yazılı barış antlaşması hangisidir?',
    options: ['Kadeş Antlaşması', 'Vestfalya Antlaşması', 'Versailles Antlaşması', 'Lozan Antlaşması'],
    correctIndex: 0,
    explanation: 'Hititler ile Mısırlılar arasında M.Ö. 1280 civarında imzalanmıştır.',
  },
  {
    id: 'dt-5',
    categoryId: 'dunya-tarihi',
    prompt: 'Magna Carta Libertatum hangi ülkede ve yılda ilan edilmiştir?',
    options: ['Fransa - 1302', 'İngiltere - 1215', 'İspanya - 1492', 'Roma - 1189'],
    correctIndex: 1,
    explanation: 'Kral John 1215 yılında İngiltere’de Magna Carta’yı mühürlemiştir.',
  },

  // Coğrafya
  {
    id: 'cg-1',
    categoryId: 'cografya',
    prompt: 'Dünyanın en yüksek zirvesi Everest hangi sıradağlardadır?',
    options: ['And Dağları', 'Himalaya Dağları', 'Alpler', 'Kayalık Dağları'],
    correctIndex: 1,
    explanation: 'Everest Tepesi Nepal-Tibet sınırındaki Himalayalar’da yer alır.',
  },
  {
    id: 'cg-2',
    categoryId: 'cografya',
    prompt: 'Dünyanın en uzun nehri kabul edilen Nil nehri hangi kıtadadır?',
    options: ['Asya', 'Afrika', 'Güney Amerika', 'Avrupa'],
    correctIndex: 1,
    explanation: 'Nil Nehri Afrika kıtasının doğu ve kuzeyinde akar.',
  },
  {
    id: 'cg-3',
    categoryId: 'cografya',
    prompt: 'Yüzölçümü bakımından dünyanın en büyük ülkesi hangisidir?',
    options: ['Kanada', 'Rusya', 'Çin', 'Amerika Birleşik Devletleri'],
    correctIndex: 1,
    explanation: 'Rusya 17 milyon km² aşkın yüzölçümüyle dünyanın en büyüğüdür.',
  },
  {
    id: 'cg-4',
    categoryId: 'cografya',
    prompt: 'Dünyanın en kurak çölü sayılan Atacama Çölü hangi ülkededir?',
    options: ['Mısır', 'Şili', 'Avustralya', 'Moğolistan'],
    correctIndex: 1,
    explanation: 'Atacama Çölü Güney Amerika’da Şili sınırları içindedir.',
  },
  {
    id: 'cg-5',
    categoryId: 'cografya',
    prompt: 'Hem Asya hem de Avrupa kıtasında toprağı bulunan Boğaziçi kenti hangisidir?',
    options: ['Kahire', 'İstanbul', 'Atina', 'Roma'],
    correctIndex: 1,
    explanation: 'İstanbul iki kıtayı birbirine bağlayan eşsiz bir metropoldür.',
  },
] as const;

export function questionsForCategory(
  categoryId: import('./categories').CategoryId
): Question[] {
  return QUESTIONS.filter((q) => q.categoryId === categoryId);
}

export function pickQuestions(
  categoryIds: readonly import('./categories').CategoryId[],
  count: number,
  seed = 1
): Question[] {
  const pool = QUESTIONS.filter((q) => categoryIds.includes(q.categoryId));
  // Deterministic shuffle with a seed so demo games are stable per round.
  const arr = [...pool];
  let s = seed * 9301 + 49297;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(count, arr.length));
}
