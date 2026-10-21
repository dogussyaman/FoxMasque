import type { Question } from '../questions';

const EVENTS = [
  ['Mezopotamya’da bilinen en eski yazı örnekleri', 'MÖ yaklaşık 3200', 'Uruk’ta ortaya çıkan çivi yazısının erken örnekleri', 'Uruk’taki çivi yazısı tabletleri, bilinen en eski yazılı belgeler arasında kabul edilir.'],
  ['Mısır’da Büyük Piramit’in inşa edildiği dönem', 'MÖ 26. yüzyıl', 'Gize’de Keops için yapılan anıtsal piramit', 'Keops Piramidi, Eski Krallık döneminde Gize’de inşa edildi.'],
  ['Hammurabi Kanunları’nın Babil’de düzenlenmesi', 'MÖ yaklaşık 1754', 'Babil kralı Hammurabi’nin yasa derlemesi', 'Hammurabi Kanunları, Mezopotamya’nın en tanınmış eski hukuk metinlerindendir.'],
  ['Hititler ile Mısır arasında Kadeş Antlaşması’nın imzalanması', 'MÖ yaklaşık 1259', 'iki büyük devlet arasında yapılan barış antlaşması', 'Kadeş Antlaşması, Hititler ile Mısır arasındaki çatışmaların ardından yapıldı.'],
  ['Roma’nın geleneksel kuruluş tarihi', 'MÖ 753', 'Romulus ile Remus anlatısına bağlanan şehir kuruluşu', 'Antik Roma geleneği, şehrin kuruluşunu MÖ 753 yılına tarihler.'],
  ['Pers Kralı Kyros’un Babil’i ele geçirmesi', 'MÖ 539', 'Yeni Babil Krallığı’nın Pers egemenliğine girmesi', 'Kyros’un Babil’i alması, Ahameniş Pers İmparatorluğu’nun genişlemesini hızlandırdı.'],
  ['Marathon Muharebesi’nin yapılması', 'MÖ 490', 'Atinalıların Pers ordusuna karşı kazandığı savaş', 'Marathon, Grek-Pers Savaşları sırasında Atina’nın önemli zaferlerinden biriydi.'],
  ['Salamis Deniz Muharebesi’nin yapılması', 'MÖ 480', 'Grek donanmasının Pers filosunu yenilgiye uğratması', 'Salamis’teki deniz zaferi, Perslerin Yunanistan’daki ilerleyişini durdurdu.'],
  ['Peloponez Savaşı’nın başlaması', 'MÖ 431', 'Atina ile Sparta arasındaki uzun savaşın başlangıcı', 'Peloponez Savaşı, Atina ve Sparta önderliğindeki ittifakları karşı karşıya getirdi.'],
  ['Büyük İskender’in Pers İmparatorluğu’na sefer açması', 'MÖ 334', 'Makedonya ordusunun Hellespontos’u geçmesi', 'Büyük İskender’in Asya seferi, Pers İmparatorluğu’nun yıkılmasıyla sonuçlandı.'],
  ['Gaugamela Muharebesi’nin yapılması', 'MÖ 331', 'İskender’in III. Darius’a karşı kazandığı belirleyici zafer', 'Gaugamela yenilgisi, Ahameniş Pers yönetiminin sonunu hazırladı.'],
  ['Ashoka’nın Kalinga Savaşı’nı yürütmesi', 'MÖ yaklaşık 261', 'Maurya hükümdarının Kalinga’yı ele geçirmesi', 'Kalinga Savaşı’nın ardından Ashoka’nın yönetiminde Budist öğretilerin etkisi arttı.'],
  ['Birinci Pön Savaşı’nın başlaması', 'MÖ 264', 'Roma ile Kartaca arasındaki ilk büyük savaş', 'Birinci Pön Savaşı, Roma ile Kartaca’nın Sicilya üzerindeki rekabetinden doğdu.'],
  ['Hannibal’in Alpleri aşarak İtalya’ya ilerlemesi', 'MÖ 218', 'Kartacalı komutanın İkinci Pön Savaşı’ndaki seferi', 'Hannibal, ordusu ve savaş filleriyle Alpleri aşarak Roma topraklarına girdi.'],
  ['Julius Caesar’ın Rubicon Nehri’ni geçmesi', 'MÖ 49', 'Roma’da iç savaşı başlatan askerî hamle', 'Caesar’ın Rubicon’u ordusuyla geçmesi, Roma Cumhuriyeti’nde iç savaşa yol açtı.'],
  ['Augustus’un Roma’da tek hâkim konumuna gelmesi', 'MÖ 27', 'Roma İmparatorluğu’nun başlangıcı kabul edilen dönem', 'Senato’nun Augustus unvanını verdiği MÖ 27, imparatorluk döneminin başlangıcı sayılır.'],
  ['Vezüv Yanardağı’nın Pompeii’yi kül altında bırakması', 'MS 79', 'Pompeii ve Herculaneum kentlerini etkileyen patlama', 'Vezüv’ün MS 79’daki patlaması, Pompeii’yi volkanik kül altında korudu.'],
  ['Milano Fermanı’nın ilan edilmesi', '313', 'Roma İmparatorluğu’nda Hristiyanlara ibadet özgürlüğü tanınması', 'Milano Fermanı, Hristiyanlığın Roma topraklarında serbestçe yaşanmasının önünü açtı.'],
  ['Konstantinopolis’in başkent olarak açılması', '330', 'Roma İmparatoru Konstantin’in yeni başkentini törenle açması', 'Konstantin, Byzantion’u yeniden kurarak şehri 330’da imparatorluk başkenti yaptı.'],
  ['Batı Roma İmparatorluğu’nun sona ermesi', '476', 'Romulus Augustulus’un tahttan indirilmesi', '476’da Romulus Augustulus’un tahttan indirilmesi, Batı Roma’nın sonu kabul edilir.'],
  ['Justinianus vebasının Konstantinopolis’e ulaşması', '541', 'Doğu Roma’yı etkileyen büyük salgının başlaması', '541’de başlayan salgın, Bizans nüfusunu ve ekonomisini ağır biçimde etkiledi.'],
  ['Hicret’in gerçekleşmesi', '622', 'Muhammed ve Müslümanların Mekke’den Medine’ye göçü', '622’deki Hicret, Hicrî takvimin başlangıç noktası olarak kabul edilir.'],
  ['Yermük Muharebesi’nin yapılması', '636', 'Bizans ile Raşidîn ordularının karşılaşması', 'Yermük zaferi, Bizans’ın Suriye üzerindeki hâkimiyetinin sona ermesini hızlandırdı.'],
  ['Talas Muharebesi’nin yapılması', '751', 'Abbâsî kuvvetleri ile Tang ordusunun karşılaşması', 'Talas Muharebesi, Orta Asya’daki güç dengelerini etkileyen önemli bir çatışmaydı.'],
  ['Şarlman’ın imparator ilan edilmesi', '800', 'Papa’nın Frank kralına Roma’da taç giydirmesi', 'Şarlman, 800 yılında Batı Roma İmparatoru unvanıyla taçlandırıldı.'],
  ['Vikinglerin Lindisfarne Manastırı’na saldırması', '793', 'Britanya’daki manastıra düzenlenen erken Viking akını', 'Lindisfarne baskını, Viking akınlarının Avrupa’daki başlangıç işaretlerinden biri sayılır.'],
  ['Hastings Muharebesi’nin yapılması', '1066', 'Normandiya Dükü William’ın İngiltere tahtını ele geçirmesi', 'William’ın Hastings zaferi, İngiltere’de Norman yönetimini başlattı.'],
  ['Birinci Haçlı Seferi’nin başlaması', '1096', 'Avrupa’dan Doğu Akdeniz’e yönelen ilk büyük Haçlı orduları', 'Birinci Haçlı Seferi, 1096’da Avrupa’dan doğuya hareket eden ordularla başladı.'],
  ['Cengiz Han’ın Moğol hükümdarı ilan edilmesi', '1206', 'Moğol boylarının kurultayda Temuçin’i han seçmesi', '1206 kurultayında Temuçin, Cengiz Han unvanını alarak Moğol boylarını birleştirdi.'],
  ['Magna Carta’nın mühürlenmesi', '1215', 'İngiltere Kralı John’un yetkilerini sınırlayan belge', 'Magna Carta, İngiltere’de kralın yetkilerinin hukukla sınırlandırılması tarihinde önemli bir adımdır.'],
  ['Moğol ordularının Bağdat’ı ele geçirmesi', '1258', 'Abbâsî başkentinin Hülagû Han’ın ordusuna düşmesi', 'Bağdat’ın düşmesi, Abbâsî halifeliğinin siyasi gücüne ağır bir darbe vurdu.'],
  ['Kara Veba’nın Avrupa’da yayılmaya başlaması', '1347', 'Akdeniz limanlarından kıtaya ulaşan büyük salgın', 'Kara Veba, 1347’den itibaren Avrupa nüfusunu ve toplumsal hayatı derinden etkiledi.'],
  ['Gutenberg İncili’nin basılması', '1450’lerin ortası', 'Avrupa’da hareketli metal harflerle basılan ilk büyük kitaplardan biri', 'Gutenberg’in matbaası, Avrupa’da kitap üretiminin yaygınlaşmasını sağladı.'],
  ['Konstantinopolis’in Osmanlılar tarafından alınması', '1453', 'Bizans başkentinin II. Mehmed’in ordusuna teslim olması', '1453’teki fetih, Bizans İmparatorluğu’nun sonunu getirdi ve dünya tarihinin dönüm noktalarından biri oldu.'],
  ['Kristof Kolomb’un Karayipler’e ulaşması', '1492', 'İspanya’dan batıya yapılan seferin Amerika kıtasına varması', 'Kolomb’un 1492 seferi, Avrupa ile Amerika arasındaki sürekli temas dönemini başlattı.'],
  ['Vasco da Gama’nın deniz yoluyla Hindistan’a ulaşması', '1498', 'Ümit Burnu çevresinden geçen Portekiz seferi', 'Vasco da Gama’nın seferi, Avrupa ile Hindistan arasında deniz ticaret yolunu açtı.'],
  ['Martin Luther’in 95 Tez’i yayımlaması', '1517', 'Reform hareketini başlatan kabul edilen Wittenberg metni', 'Luther’in 1517’deki çıkışı, Avrupa Reformu’nun başlangıcı olarak anılır.'],
  ['İspanyol Armadası’nın İngiltere seferi', '1588', 'İngiliz donanmasının İspanyol filosunu başarısızlığa uğratması', '1588’deki başarısız sefer, İspanya’nın deniz üstünlüğünün sarsılmasına katkı sağladı.'],
  ['Prag’da İkinci Defenestrasyon’un gerçekleşmesi', '1618', 'Bohemyalı soyluların imparatorluk görevlilerini pencereden atması', 'Prag’daki olay, Otuz Yıl Savaşı’nın başlamasına yol açan gelişmelerden biriydi.'],
  ['Vestfalya Barışı’nın imzalanması', '1648', 'Otuz Yıl Savaşı’nı sona erdiren antlaşmalar dizisi', 'Vestfalya düzeni, Avrupa’daki devletler arası ilişkilerin şekillenmesinde etkili oldu.'],
  ['İngiltere’de Şanlı Devrim’in gerçekleşmesi', '1688', 'II. James’in tahttan ayrılıp William ve Mary’nin tahta geçmesi', '1688 Devrimi, İngiltere’de parlamentonun gücünü pekiştiren süreci başlattı.'],
  ['Amerikan Bağımsızlık Bildirgesi’nin kabul edilmesi', '1776', 'On Üç Koloni’nin Britanya’dan bağımsızlığını ilan etmesi', '4 Temmuz 1776’da kabul edilen bildiri, Amerika Birleşik Devletleri’nin kuruluş sürecinde temel belgedir.'],
  ['Fransız Devrimi’nin başlaması', '1789', 'Bastille Baskını ile simgeleşen devrim süreci', '1789 Devrimi, Fransa’da monarşinin ve eski toplumsal düzenin dönüşümünü başlattı.'],
  ['Haiti Devrimi’nin başlaması', '1791', 'Saint-Domingue’de köleleştirilmiş insanların ayaklanması', '1791’de başlayan devrim, Haiti’nin bağımsızlığını ve köleliğin kaldırılmasını sağladı.'],
  ['Waterloo Muharebesi’nin yapılması', '1815', 'Napolyon’un son yenilgisiyle sonuçlanan savaş', 'Waterloo yenilgisi, Napolyon’un iktidarının kesin olarak sona ermesine yol açtı.'],
  ['Meiji Restorasyonu’nun başlaması', '1868', 'Japonya’da imparatorluk yönetiminin yeniden güç kazanması', 'Meiji dönemi, Japonya’nın hızlı siyasi, askerî ve sanayileşme reformlarıyla tanınır.'],
  ['Berlin Konferansı’nın toplanması', '1884–1885', 'Avrupalı güçlerin Afrika’daki sömürge rekabetini görüşmesi', 'Berlin Konferansı, Afrika’nın Avrupalı güçlerce paylaşılmasını hızlandırdı.'],
  ['Actium Deniz Muharebesi’nin yapılması', 'MÖ 31', 'Octavianus’un Marcus Antonius ve Kleopatra’nın donanmasını yenmesi', 'Actium zaferi, Octavianus’un Roma dünyasında tek güç haline gelmesinin önünü açtı.'],
  ['Birinci Afyon Savaşı’nın Nanking Antlaşması’yla sona ermesi', '1842', 'Qing Çin’i ile Britanya arasında antlaşma imzalanması', 'Nanking Antlaşması, Birinci Afyon Savaşı’nı bitirdi ve Hong Kong’un Britanya’ya bırakılmasını öngördü.'],
  ['Rus-Japon Savaşı’nın başlaması', '1904', 'Rusya ile Japonya’nın Kore ve Mançurya üzerindeki rekabetinin savaşa dönüşmesi', '1904’te başlayan savaş, Japonya’nın 1905’teki zaferiyle sonuçlandı.'],
] as const;

const PEOPLE = [
  ['Hammurabi', 'Babil’de kendi adıyla anılan yasa derlemesini hazırlatması', 'Hammurabi Kanunları, Babil hukuk tarihinin en tanınmış metinlerindendir.'],
  ['Hatşepsut', 'Mısır firavunluğu ve Punt ülkesine düzenlettiği ticaret seferi', 'Hatşepsut, Eski Mısır’ın kadın firavunlarından biri olarak uzun süre hüküm sürdü.'],
  ['II. Ramses', 'Kadeş Savaşı ve Mısır’ın anıtsal tapınaklarını yaptırması', 'II. Ramses, Yeni Krallık döneminin en uzun hüküm süren firavunlarındandı.'],
  ['Büyük Kyros', 'Ahameniş Pers İmparatorluğu’nu kurması', 'Kyros, Persleri birleştirerek antik dünyanın geniş imparatorluklarından birini kurdu.'],
  ['Perikles', 'Atina’nın Altın Çağı ve Parthenon’un inşası', 'Perikles döneminde Atina demokrasisi ve kültürü büyük gelişme gösterdi.'],
  ['Sokrates', 'Atina’da soru-cevap yöntemine dayalı felsefi tartışmaları', 'Sokrates’in düşünceleri, öğrencisi Platon’un eserleri aracılığıyla günümüze ulaştı.'],
  ['Platon', 'Atina’da Akademia adlı felsefe okulunu kurması', 'Platon’un Akademia’sı, Batı dünyasının ilk yüksek öğrenim kurumlarından biri sayılır.'],
  ['Aristoteles', 'mantık, doğa felsefesi ve siyaset üzerine eserleri', 'Aristoteles, antik dünyanın birçok bilim ve düşünce alanında etkili oldu.'],
  ['Büyük İskender', 'Makedonya’dan Mısır ve Hindistan’a uzanan fetihleri', 'İskender’in seferleri, Helenistik kültürün geniş bir coğrafyaya yayılmasını sağladı.'],
  ['Ashoka', 'Kalinga Savaşı sonrasında Budist öğretileri desteklemesi', 'Maurya hükümdarı Ashoka, yazıtları ve Budist misyonlarıyla tanınır.'],
  ['Hannibal Barca', 'İkinci Pön Savaşı’nda Alpleri aşarak İtalya’ya ilerlemesi', 'Kartacalı Hannibal, Roma’ya karşı yürüttüğü seferlerle askeri tarihte yer aldı.'],
  ['Julius Caesar', 'Galya seferleri ve Roma Cumhuriyeti’ndeki siyasi yükselişi', 'Caesar’ın Galya seferleri, Roma’nın Batı Avrupa’daki topraklarını genişletti.'],
  ['VII. Kleopatra', 'Ptolemaios Hanedanı’nın son hükümdarı olarak Mısır’ı yönetmesi', 'Kleopatra, Roma ile kurduğu siyasi ilişkilerle antik dünyanın öne çıkan hükümdarlarından oldu.'],
  ['Augustus', 'Roma’nın ilk imparatoru olarak uzun süreli bir yönetim dönemi kurması', 'Augustus, Roma’da iç savaşları sona erdirerek imparatorluk düzenini başlattı.'],
  ['I. Konstantin', 'Konstantinopolis’i Roma İmparatorluğu’nun yeni başkenti yapması', 'Konstantin, Byzantion’u yeniden kurup kendi adıyla anılan başkenti oluşturdu.'],
  ['Justinianus', 'Roma hukukunu Corpus Juris Civilis adıyla derletmesi', 'Justinianus’un hukuk derlemesi, sonraki Avrupa hukuk sistemlerini etkiledi.'],
  ['Muhammed', 'İslam dininin peygamberi olarak Medine’de ilk Müslüman toplumunu kurması', 'Hicret sonrasında Medine’de oluşan toplum, İslam tarihinin erken dönemini şekillendirdi.'],
  ['Şarlman', 'Frank Krallığı’nı genişletip 800’de imparator olarak taç giymesi', 'Şarlman’ın yönetimi, Batı Avrupa’daki Orta Çağ siyasetini etkiledi.'],
  ['Harun Reşid', 'Abbâsî Halifeliği’nin siyasi ve kültürel açıdan güçlü olduğu dönemde hüküm sürmesi', 'Harun Reşid dönemi, Bağdat merkezli Abbâsî kültürünün gelişmesiyle anılır.'],
  ['Büyük Alfred', 'Wessex’i Viking saldırılarına karşı savunması ve eğitim reformları', 'Alfred, İngiltere’de Vikinglere karşı direnişi örgütleyen Wessex kralıydı.'],
  ['I. William', '1066’da Hastings zaferinin ardından İngiltere kralı olması', 'Normandiya Dükü William’ın fethi, İngiltere’de Norman hanedanını başlattı.'],
  ['Selahaddin Eyyubi', '1187’de Kudüs’ü Haçlılardan geri alması', 'Selahaddin, Eyyubi Devleti’nin kurucusu ve Hıttin zaferinin komutanıydı.'],
  ['Cengiz Han', 'Moğol boylarını birleştirerek büyük bir imparatorluk kurması', 'Cengiz Han, 1206 kurultayında Moğol hükümdarı ilan edildi.'],
  ['Kubilay Han', 'Çin’de Yuan Hanedanı’nı kurup başkentini Hanbalık’a taşıması', 'Kubilay, Moğol İmparatorluğu’nun Çin’de hüküm süren Yuan kolunu kurdu.'],
  ['Marco Polo', 'Asya seyahatlerini Avrupa’da tanınan bir gezi anlatısında aktarması', 'Marco Polo’nun seyahatleri, Orta Çağ Avrupası’nda Asya bilgisine katkıda bulundu.'],
  ['İbn Battuta', 'Afrika, Asya ve Avrupa’yı kapsayan geniş seyahatlerini yazıya dökmesi', 'İbn Battuta’nın Rıhle adlı eseri, 14. yüzyıl coğrafyasına dair önemli bilgiler içerir.'],
  ['Jeanne d’Arc', 'Yüz Yıl Savaşları sırasında Fransız ordusuna moral ve önderlik sağlaması', 'Jeanne d’Arc, Orléans kuşatmasının kaldırılmasında simgesel rol oynadı.'],
  ['Johannes Gutenberg', 'Avrupa’da hareketli metal harfli matbaayı geliştirmesi', 'Gutenberg’in baskı tekniği, kitapların daha geniş kitlelere ulaşmasını sağladı.'],
  ['Leonardo da Vinci', 'Mona Lisa ve Son Akşam Yemeği tablolarını yapması', 'Leonardo, Rönesans döneminin ressam, mühendis ve bilim insanlarından biriydi.'],
  ['Michelangelo', 'Sistina Şapeli’nin tavan fresklerini ve Davut heykelini yapması', 'Michelangelo, Rönesans heykel ve resim sanatının başlıca ustalarındandır.'],
  ['Nicolaus Copernicus', 'Güneş merkezli evren modelini matematiksel olarak açıklaması', 'Copernicus’un modeli, Dünya’nın Güneş çevresinde döndüğünü savundu.'],
  ['Galileo Galilei', 'teleskop gözlemleriyle modern astronominin gelişimine katkı vermesi', 'Galileo’nun gözlemleri, Güneş merkezli sistem lehine kanıtlar sağladı.'],
  ['I. Elizabeth', 'İngiltere’yi İspanyol Armadası döneminde yönetmesi', 'I. Elizabeth dönemi, İngiliz deniz gücü ve edebiyatının yükselişiyle anılır.'],
  ['William Shakespeare', 'Hamlet ve Romeo ve Juliet gibi tiyatro eserlerini yazması', 'Shakespeare, İngiliz edebiyatının en etkili oyun yazarlarından biridir.'],
  ['Ekber Şah', 'Babür İmparatorluğu’nu genişletip yönetim kurumlarını güçlendirmesi', 'Ekber, Babür yönetimini Hindistan’da kalıcı bir imparatorluk haline getirdi.'],
  ['Tokugawa Ieyasu', 'Japonya’da Tokugawa şogunluğunu kurması', 'Sekigahara zaferinin ardından Ieyasu, Japonya’da uzun süren Tokugawa yönetimini başlattı.'],
  ['Büyük Petro', 'Rusya’nın yönetim ve ordusunu Avrupa örnekleriyle yenilemesi', 'I. Petro reformlarıyla Rusya’yı büyük bir Avrupa gücü haline getirmeye çalıştı.'],
  ['II. Katerina', 'Rus İmparatorluğu’nu genişletip Aydınlanma düşünürleriyle ilişki kurması', 'Katerina, 18. yüzyılda Rusya’nın topraklarını ve uluslararası etkisini artırdı.'],
  ['XIV. Louis', 'Versailles Sarayı’nı krallık yönetiminin merkezi haline getirmesi', 'XIV. Louis’nin merkeziyetçi yönetimi, Fransa’da mutlak monarşinin simgesi oldu.'],
  ['Isaac Newton', 'hareket yasaları ile evrensel kütle çekimini açıklaması', 'Newton’un Principia adlı eseri klasik fiziğin temel çalışmalarındandır.'],
  ['Voltaire', 'Aydınlanma döneminde dinî hoşgörü ve ifade özgürlüğünü savunması', 'Voltaire’in yazıları, Avrupa Aydınlanması’nın düşünsel tartışmalarını etkiledi.'],
  ['Jean-Jacques Rousseau', 'Toplum Sözleşmesi eserinde halk egemenliği düşüncesini işlemesi', 'Rousseau’nun siyaset felsefesi, Fransız Devrimi’nin düşünsel arka planını etkiledi.'],
  ['George Washington', 'Amerika Birleşik Devletleri’nin ilk başkanı olması', 'Washington, bağımsızlık savaşında başkomutanlık yaptıktan sonra ilk başkan seçildi.'],
  ['Thomas Jefferson', 'Amerikan Bağımsızlık Bildirgesi’nin başlıca yazarlarından olması', 'Jefferson, 1776 bildirgesinin hazırlanmasında önemli rol oynadı.'],
  ['Napolyon Bonapart', 'Fransız Medeni Kanunu’nu (Code civil) yürürlüğe koyması', 'Napolyon Kanunu, Avrupa ve başka bölgelerdeki medeni hukuk sistemlerini etkiledi.'],
  ['Toussaint Louverture', 'Haiti Devrimi’nde kölelik karşıtı güçlere önderlik etmesi', 'Louverture, Saint-Domingue’deki devrim ve bağımsızlık hareketinin önemli lideriydi.'],
  ['Simón Bolívar', 'Güney Amerika’daki İspanyol sömürgelerinin bağımsızlık mücadelelerine öncülük etmesi', 'Bolívar, Venezuela, Kolombiya ve başka bölgelerdeki bağımsızlık hareketlerinde rol aldı.'],
  ['Oda Nobunaga', 'Japonya’nın siyasi birliğini sağlamaya yönelik Sengoku dönemi seferleri', 'Nobunaga, 16. yüzyılda Japonya’nın birleşme sürecini başlatan daimyo’lardan biriydi.'],
  ['Mansa Musa', 'Mali İmparatorluğu’nun hükümdarı olarak 1324’te Mekke’ye hac yolculuğu yapması', 'Mansa Musa’nın hac ziyareti, Mali’nin zenginliğini Akdeniz dünyasında duyurdu.'],
  ['Zheng He', 'Ming Hanedanı adına Hint Okyanusu’na büyük deniz seferleri düzenlemesi', 'Zheng He’nin donanması, 15. yüzyılda Çin’in deniz ticaret ve diplomasi ağını genişletti.'],
] as const;

function difficultyFor(index: number): Question['difficulty'] {
  if (index < 15) return 'easy';
  if (index < 35) return 'medium';
  return 'hard';
}

const YEAR_QUESTIONS: readonly Question[] = EVENTS.map(
  ([event, year, , explanation], index) => ({
    id: `dt-${101 + index}`,
    categoryId: 'dunya-tarihi',
    prompt: `${event} hangi tarihte gerçekleşti?`,
    correctAnswer: year,
    difficulty: difficultyFor(index),
    explanation,
    status: 'approved',
  })
);

const EVENT_QUESTIONS: readonly Question[] = EVENTS.map(
  ([event, , clue, explanation], index) => ({
    id: `dt-${151 + index}`,
    categoryId: 'dunya-tarihi',
    prompt: `Tarih kitaplarında "${clue}" olarak anılan olay hangisidir?`,
    correctAnswer: event,
    difficulty: difficultyFor(index),
    explanation,
    status: 'approved',
  })
);

const PERSON_QUESTIONS: readonly Question[] = PEOPLE.map(
  ([person, contribution, explanation], index) => ({
    id: `dt-${201 + index}`,
    categoryId: 'dunya-tarihi',
    prompt: `${contribution} ile tarihe geçen kişi kimdir?`,
    correctAnswer: person,
    difficulty: difficultyFor(index),
    explanation,
    status: 'approved',
  })
);

export const DUNYA_TARIHI_PART2: readonly Question[] = [
  ...YEAR_QUESTIONS,
  ...EVENT_QUESTIONS,
  ...PERSON_QUESTIONS,
];
