export type QuestionId = string;

export interface Question {
  id: QuestionId;
  categoryId: import('./categories').CategoryId;
  prompt: string;
  correctAnswer?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  subcategory?: string;
  explanation?: string;
  sourceUrl?: string;
  status?: 'draft' | 'approved' | 'archived';
}

export const QUESTIONS: readonly Question[] = [
  // Genel Kültür
  {
    id: 'gk-1',
    categoryId: 'genel-kultur',
    prompt: 'Türkiye Cumhuriyeti hangi yıl ilan edildi?',
    correctAnswer: "1923",
    explanation: '29 Ekim 1923’te Cumhuriyet ilan edildi.',
  },
  {
    id: 'gk-2',
    categoryId: 'genel-kultur',
    prompt: 'Dünya’nın en büyük okyanusu hangisidir?',
    correctAnswer: "Büyük Okyanus",
    explanation: 'Büyük (Pasifik) Okyanusu en büyük okyanustur.',
  },
  {
    id: 'gk-3',
    categoryId: 'genel-kultur',
    prompt: 'İnsan vücudunda kaç kemik bulunur?',
    correctAnswer: "206",
    explanation: 'Yetişkin bir insanda 206 kemik vardır.',
  },
  {
    id: 'gk-4',
    categoryId: 'genel-kultur',
    prompt: '“Suç ve Ceza” romanının yazarı kimdir?',
    correctAnswer: "Dostoyevski",
    explanation: 'Fyodor Dostoyevski tarafından yazılmıştır.',
  },
  {
    id: 'gk-5',
    categoryId: 'genel-kultur',
    prompt: 'Işık hızı yaklaşık olarak nedir?',
    correctAnswer: "300.000 km/s",
    explanation: 'Işık boşlukta ~300.000 km/s hızla yayılır.',
  },

  // Hayvanlar Alemi
  {
    id: 'hy-1',
    categoryId: 'hayvanlar-alem',
    prompt: 'Bir grup flamingoya ne denir?',
    correctAnswer: "Flamboyans",
    explanation: 'Flamingo topluluklarına “flamboyans” denir.',
  },
  {
    id: 'hy-2',
    categoryId: 'hayvanlar-alem',
    prompt: 'Kalan kaç pandanın nesli tehlikededir; pandasanın dil rengi?',
    correctAnswer: "Pembe",
    explanation: 'Pandanın dili pembemsi kırmızıdır.',
  },
  {
    id: 'hy-3',
    categoryId: 'hayvanlar-alem',
    prompt: 'Bir salyangoz kaç dişe sahip olabilir?',
    correctAnswer: "Yaklaşık 25.000",
    explanation: 'Bazı salyangoz türlerinde ~25.000 diş bulunur.',
  },
  {
    id: 'hy-4',
    categoryId: 'hayvanlar-alem',
    prompt: 'Hangi hayvan parmak izine sahiptir?',
    correctAnswer: "Kozyağı (koala)",
    explanation: 'Koalaların parmak izi insanlarınkine çok benzer.',
  },
  {
    id: 'hy-5',
    categoryId: 'hayvanlar-alem',
    prompt: 'Balina bir ...',
    correctAnswer: "Memelidir",
    explanation: 'Balinalar memeli hayvanlardır.',
  },

  // Film ve Dizi
  {
    id: 'fm-1',
    categoryId: 'film-ve-dizi',
    prompt: '“Esaret” (Parasite) hangi ülkenin filmidir?',
    correctAnswer: "Güney Kore",
    explanation: 'Bong Joon-ho’nun Güney Kore filmidir.',
  },
  {
    id: 'fm-2',
    categoryId: 'film-ve-dizi',
    prompt: '“Breaking Bad” hangi karakterin etrafında döner?',
    correctAnswer: "Walter White",
    explanation: 'Walter White’ın dönüşümünü anlatır.',
  },
  {
    id: 'fm-3',
    categoryId: 'film-ve-dizi',
    prompt: '“Yüzüklerin Efendisi” hangi yazardan uyarlanmıştır?',
    correctAnswer: "J.R.R. Tolkien",
    explanation: 'J.R.R. Tolkien’in eserinden uyarlanmıştır.',
  },
  {
    id: 'fm-4',
    categoryId: 'film-ve-dizi',
    prompt: '“La La Land” müzikalinde başrol kadın oyuncu kimdir?',
    correctAnswer: "Emma Stone",
    explanation: 'Emma Stone Mia rolünü oynamıştır.',
  },
  {
    id: 'fm-5',
    categoryId: 'film-ve-dizi',
    prompt: '“Dark” dizisi hangi ülkede geçer?',
    correctAnswer: "Almanya",
    explanation: 'Alman yapımı bir bilim kurgu dizisidir.',
  },

  // Osmanlı Dönemi
  {
    id: 'os-1',
    categoryId: 'osmanli-donemi',
    prompt: 'İstanbul hangi yıl fethedilmiştir?',
    correctAnswer: "1453",
    explanation: 'Fatih Sultan Mehmet 29 Mayıs 1453’te İstanbul’u fethetti.',
  },
  {
    id: 'os-2',
    categoryId: 'osmanli-donemi',
    prompt: 'Osmanlı Devleti’nin kurucusu ve ilk padişahı kimdir?',
    correctAnswer: "Osman Bey",
    explanation: 'Osman Bey beyliği kurarak ilk hükümdar olmuştur.',
  },
  {
    id: 'os-3',
    categoryId: 'osmanli-donemi',
    prompt: 'En uzun süre tahtta kalan Osmanlı padişahı hangisidir?',
    correctAnswer: "Kanuni Sultan Süleyman",
    explanation: 'Kanuni Sultan Süleyman 46 yıl boyunca tahtta kalmıştır.',
  },
  {
    id: 'os-4',
    categoryId: 'osmanli-donemi',
    prompt: 'Mimar Sinan’ın “Ustalık eserim” dediği şaheser hangisidir?',
    correctAnswer: "Selimiye Camii",
    explanation: 'Edirne’deki Selimiye Camii Mimar Sinan’ın ustalık eseridir.',
  },
  {
    id: 'os-5',
    categoryId: 'osmanli-donemi',
    prompt: 'Osmanlı’da donanma komutanına verilen unvan hangisidir?',
    correctAnswer: "Kaptan-ı Derya",
    explanation: 'Kaptan-ı Derya Osmanlı deniz kuvvetlerinin başkomutanıydı.',
  },

  // Dünya Tarihi
  {
    id: 'dt-1',
    categoryId: 'dunya-tarihi',
    prompt: 'Antik Dünyanın 7 Harikasından günümüze ulaşan tek eser hangisidir?',
    correctAnswer: "Keops Piramidi",
    explanation: 'Gize’deki Keops Piramidi günümüze sağlam kalan tek antik harikadır.',
  },
  {
    id: 'dt-2',
    categoryId: 'dunya-tarihi',
    prompt: 'Rönesans hareketi ilk olarak hangi ülkede başlamıştır?',
    correctAnswer: "İtalya",
    explanation: 'Rönesans 14. yüzyılda İtalya’nın Floransa kentinde doğmuştur.',
  },
  {
    id: 'dt-3',
    categoryId: 'dunya-tarihi',
    prompt: 'Fransız İhtilali hangi yılda patlak vermiştir?',
    correctAnswer: "1789",
    explanation: 'Bastille Baskını ile 1789 yılında başlamıştır.',
  },
  {
    id: 'dt-4',
    categoryId: 'dunya-tarihi',
    prompt: 'Tarihte bilinen ilk yazılı barış antlaşması hangisidir?',
    correctAnswer: "Kadeş Antlaşması",
    explanation: 'Hititler ile Mısırlılar arasında M.Ö. 1280 civarında imzalanmıştır.',
  },
  {
    id: 'dt-5',
    categoryId: 'dunya-tarihi',
    prompt: 'Magna Carta Libertatum hangi ülkede ve yılda ilan edilmiştir?',
    correctAnswer: "İngiltere - 1215",
    explanation: 'Kral John 1215 yılında İngiltere’de Magna Carta’yı mühürlemiştir.',
  },

  // Coğrafya
  {
    id: 'cg-1',
    categoryId: 'cografya',
    prompt: 'Dünyanın en yüksek zirvesi Everest hangi sıradağlardadır?',
    correctAnswer: "Himalaya Dağları",
    explanation: 'Everest Tepesi Nepal-Tibet sınırındaki Himalayalar’da yer alır.',
  },
  {
    id: 'cg-2',
    categoryId: 'cografya',
    prompt: 'Dünyanın en uzun nehri kabul edilen Nil nehri hangi kıtadadır?',
    correctAnswer: "Afrika",
    explanation: 'Nil Nehri Afrika kıtasının doğu ve kuzeyinde akar.',
  },
  {
    id: 'cg-3',
    categoryId: 'cografya',
    prompt: 'Yüzölçümü bakımından dünyanın en büyük ülkesi hangisidir?',
    correctAnswer: "Rusya",
    explanation: 'Rusya 17 milyon km² aşkın yüzölçümüyle dünyanın en büyüğüdür.',
  },
  {
    id: 'cg-4',
    categoryId: 'cografya',
    prompt: 'Dünyanın en kurak çölü sayılan Atacama Çölü hangi ülkededir?',
    correctAnswer: "Şili",
    explanation: 'Atacama Çölü Güney Amerika’da Şili sınırları içindedir.',
  },
  {
    id: 'cg-5',
    categoryId: 'cografya',
    prompt: 'Hem Asya hem de Avrupa kıtasında toprağı bulunan Boğaziçi kenti hangisidir?',
    correctAnswer: "İstanbul",
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
  seed = 1,
  excludedQuestionIds: readonly QuestionId[] = []
): Question[] {
  const excluded = new Set(excludedQuestionIds);
  const pool = QUESTIONS.filter((q) =>
    categoryIds.includes(q.categoryId) && !excluded.has(q.id)
  );
  if (pool.length < count) {
    throw new Error(`Seçilen kategorilerde daha önce görülmemiş ${count} tur için yeterli soru yok.`);
  }
  // Deterministic shuffle with a seed so demo games are stable per round.
  const arr = [...pool];
  let s = seed * 9301 + 49297;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}
