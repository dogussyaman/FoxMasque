export type QuestionId = string;

export interface Question {
  id: QuestionId;
  categoryId: import('./categories').CategoryId;
  prompt: string;
  options: readonly string[];
  correctIndex: number;
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

  // Moda ve Stil
  {
    id: 'md-1',
    categoryId: 'moda-ve-stil',
    prompt: '“Louboutin” markasının ikonik özelliği nedir?',
    options: ['Kırmızı taban', 'Mavi loga', 'Altın çıt', 'Yeşil kurdele'],
    correctIndex: 0,
    explanation: 'Christian Louboutin ayakkabıları kırmızı tabanıyla tanınır.',
  },
  {
    id: 'md-2',
    categoryId: 'moda-ve-stil',
    prompt: '“Bikini” adını hangisinden alır?',
    options: ['Bir çiçek', 'Bir ada', 'Bir şarkıcı', 'Bir İtalyan şehri'],
    correctIndex: 1,
    explanation: 'Bikini Atolü’ndeki nükleer testlere atıfla adlandırılmıştır.',
  },
  {
    id: 'md-3',
    categoryId: 'moda-ve-stil',
    prompt: 'Hangisi bir düğün elbisesi stilidir?',
    options: ['Sahara', 'Bolero', 'A-line', 'Trench'],
    correctIndex: 2,
    explanation: 'A-line, klasik gelinlik kesimlerinden biridir.',
  },
  {
    id: 'md-4',
    categoryId: 'moda-ve-stil',
    prompt: '“Haute Couture” ne demektir?',
    options: ['Hazır giyim', 'El yapımı yüksek terzi', 'Sokak modası', 'İkinci el'],
    correctIndex: 1,
    explanation: 'Fransızcada “yüksek terzilik / diktim” anlamına gelir.',
  },
  {
    id: 'md-5',
    categoryId: 'moda-ve-stil',
    prompt: 'Gucci hangi ülkede doğdu?',
    options: ['Fransa', 'ABD', 'İtalya', 'İngiltere'],
    correctIndex: 2,
    explanation: 'Gucci, 1921’de Floransa’da kuruldu.',
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

  // Müzik
  {
    id: 'mz-1',
    categoryId: 'muzik',
    prompt: 'Tarkan’ın “Şımarık” şarkısı hangi yılda büyük hit oldu?',
    options: ['1995', '1997', '2001', '2003'],
    correctIndex: 1,
    explanation: '1997’de dünya çapında popüler oldu.',
  },
  {
    id: 'mz-2',
    categoryId: 'muzik',
    prompt: 'Beatles’ın kaç üyesi vardı?',
    options: ['3', '4', '5', '6'],
    correctIndex: 1,
    explanation: 'John, Paul, George ve Ringo olmak üzere 4 üye.',
  },
  {
    id: 'mz-3',
    categoryId: 'muzik',
    prompt: 'Bir piyanoda kaç tuş vardır?',
    options: ['76', '88', '96', '100'],
    correctIndex: 1,
    explanation: 'Standart piyanoda 88 tuş bulunur.',
  },
  {
    id: 'mz-4',
    categoryId: 'muzik',
    prompt: '“Billie Jean” hangi sanatçıya aittir?',
    options: ['Prince', 'Michael Jackson', 'Madonna', 'David Bowie'],
    correctIndex: 1,
    explanation: 'Michael Jackson’ın ikonik şarkısıdır.',
  },
  {
    id: 'mz-5',
    categoryId: 'muzik',
    prompt: 'Eurovision 2003’ü kim kazandı?',
    options: ['Sertab Erener', 'Marina', ' Helena Paparizou', 'Loreen'],
    correctIndex: 0,
    explanation: 'Sertab Erener “Everyway That I Can” ile kazandı.',
  },

  // Yemek ve Leizzet
  {
    id: 'yk-1',
    categoryId: 'yemek-ve-lezzet',
    prompt: '“Mantı” hangi mutfağın özgün yemeği kabul edilir?',
    options: ['Türk', 'Çin', 'Meksika', 'Fransız'],
    correctIndex: 0,
    explanation: 'Mantı Türk mutfağının sevilen yemeklerinden biridir.',
  },
  {
    id: 'yk-2',
    categoryId: 'yemek-ve-lezzet',
    prompt: 'İtalyan “risotto” hangi pirinçle yapılır?',
    options: ['Basmati', 'Arborio', 'Jasmine', 'Yasemin'],
    correctIndex: 1,
    explanation: 'Arborio pirinci kremamsı dokusuyla bilinir.',
  },
  {
    id: 'yk-3',
    categoryId: 'yemek-ve-lezzet',
    prompt: '“Sushi” temelde hangi malzemeyle yapılır?',
    options: ['Noodle', 'Pirinç ve balık', 'Et ve lavaş', 'Peynir'],
    correctIndex: 1,
    explanation: 'Sushi, pirinç ve genelde balık/deniz ürünüyle hazırlanır.',
  },
  {
    id: 'yk-4',
    categoryId: 'yemek-ve-lezzet',
    prompt: 'Türk kahvesinin UNESCO listesine alınma yılı?',
    options: ['2010', '2013', '2015', '2018'],
    correctIndex: 1,
    explanation: '2013’te UNESCO kültürel miras listesine alındı.',
  },
  {
    id: 'yk-5',
    categoryId: 'yemek-ve-lezzet',
    prompt: '“Baklava” hamuru kaç kat açılır klasik tarifte?',
    options: ['10-20', '20-30', '40-50', '60-70'],
    correctIndex: 2,
    explanation: 'Klasik baklavada 40-50 civarı kat bulunur.',
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
