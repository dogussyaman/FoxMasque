import type { Question } from '../questions';

const EVENTS = [
  ['Arşidük Franz Ferdinand’ın Saraybosna’da öldürülmesi', '1914', 'Avusturya-Macaristan veliahdının suikasta uğraması', 'Saraybosna suikastı, Birinci Dünya Savaşı’nın başlamasına yol açan gelişmelerin başında geldi.'],
  ['Rusya’da Bolşevik Devrimi’nin gerçekleşmesi', '1917', 'Bolşeviklerin Geçici Hükûmeti devirerek iktidarı alması', 'Ekim Devrimi, Rusya’da Bolşevik yönetimini ve daha sonra Sovyetler Birliği’ni doğurdu.'],
  ['Versailles Antlaşması’nın imzalanması', '1919', 'Birinci Dünya Savaşı sonrasında Almanya ile yapılan barış antlaşması', 'Versailles Antlaşması, savaş sonrası Avrupa düzenini ve Almanya’nın yükümlülüklerini belirledi.'],
  ['Wall Street Borsası’nın çöküşü ve Büyük Buhran’ın başlangıcı', '1929', 'New York borsasında büyük düşüşlerin yaşanması', '1929’daki borsa çöküşü, dünya çapında uzun süreli ekonomik bunalıma dönüştü.'],
  ['Gandhi’nin Tuz Yürüyüşü’nü başlatması', '1930', 'Britanya’nın tuz vergisini protesto eden kitlesel yürüyüş', 'Tuz Yürüyüşü, Hindistan bağımsızlık hareketinin şiddetsiz direniş simgelerindendir.'],
  ['Adolf Hitler’in Almanya Şansölyesi olması', '1933', 'Nazi Partisi liderinin hükûmet başına getirilmesi', 'Hitler’in 1933’te şansölye olması, Almanya’da Nazi diktatörlüğünün kurulmasını başlattı.'],
  ['İspanya İç Savaşı’nın başlaması', '1936', 'Cumhuriyetçiler ile milliyetçilerin karşı karşıya gelmesi', 'İspanya İç Savaşı, 1936–1939 arasında ülkeyi ve Avrupa siyasetini etkiledi.'],
  ['İkinci Dünya Savaşı’nın Avrupa’da başlaması', '1939', 'Almanya’nın Polonya’yı işgal etmesi', 'Almanya’nın 1 Eylül 1939’da Polonya’yı işgali, Britanya ve Fransa’nın savaş ilanına yol açtı.'],
  ['Japonya’nın Pearl Harbor’a saldırması', '1941', 'ABD’nin Hawaii’deki deniz üssüne düzenlenen hava saldırısı', 'Pearl Harbor saldırısının ardından ABD, İkinci Dünya Savaşı’na katıldı.'],
  ['Normandiya Çıkarması’nın yapılması', '1944', 'Müttefik kuvvetlerin Fransa kıyılarına çıkarma yapması', '6 Haziran 1944’teki D-Day harekâtı, Batı Avrupa’nın işgalden kurtarılmasını hızlandırdı.'],
  ['İkinci Dünya Savaşı’nın sona ermesi', '1945', 'Japonya’nın teslim olmasıyla küresel savaşın bitmesi', 'Japonya’nın Eylül 1945’te teslim olması, İkinci Dünya Savaşı’nı sona erdirdi.'],
  ['Birleşmiş Milletler’in kurulması', '1945', 'Uluslararası barış ve iş birliği örgütünün faaliyete geçmesi', 'Birleşmiş Milletler Şartı 1945’te yürürlüğe girdi ve örgüt kuruldu.'],
  ['Hindistan’ın Britanya’dan bağımsızlığını kazanması', '1947', 'Britanya Hindistanı’nın Hindistan ve Pakistan olarak bölünmesi', 'Hindistan 1947’de bağımsız oldu; aynı süreçte Pakistan da ayrı bir devlet olarak kuruldu.'],
  ['Çin Halk Cumhuriyeti’nin ilan edilmesi', '1949', 'Mao Zedong’un Pekin’de yeni devleti ilan etmesi', 'Mao Zedong, 1 Ekim 1949’da Çin Halk Cumhuriyeti’ni ilan etti.'],
  ['Kuzey Atlantik Antlaşması Örgütü’nün kurulması', '1949', 'NATO’nun kurucu antlaşmasının yürürlüğe girmesi', 'NATO, 1949’da kolektif savunma amacıyla kurulan askerî ittifaktır.'],
  ['Kore Savaşı’nın başlaması', '1950', 'Kuzey Kore birliklerinin 38. paraleli geçerek güneye ilerlemesi', 'Kore Savaşı, 1950’de başladı ve 1953’te ateşkesle durdu.'],
  ['Bandung Konferansı’nın düzenlenmesi', '1955', 'Asya ve Afrika ülkelerinin sömürgecilik sonrası iş birliğini görüşmesi', 'Bandung Konferansı, bağlantısızlık hareketinin gelişmesinde etkili oldu.'],
  ['Varşova Paktı’nın imzalanması', '1955', 'Sovyetler Birliği ve Doğu Avrupa müttefiklerinin askerî ittifak kurması', 'Varşova Paktı, Soğuk Savaş’ta NATO’ya karşı kurulan Doğu Bloku ittifakıydı.'],
  ['Süveyş Krizi’nin başlaması', '1956', 'Mısır’ın Süveyş Kanalı’nı millîleştirmesinin ardından yaşanan askerî müdahale', '1956 Süveyş Krizi, Mısır’ın kanal üzerindeki egemenliğini korumasıyla sonuçlandı.'],
  ['Macar Ayaklanması’nın başlaması', '1956', 'Macarların Sovyet etkisine karşı başlattığı halk hareketi', 'Sovyet ordusu, 1956’daki Macar Ayaklanması’nı güç kullanarak bastırdı.'],
  ['Sputnik 1’in uzaya gönderilmesi', '1957', 'Dünya yörüngesine çıkan ilk yapay uydunun fırlatılması', 'Sovyetler Birliği’nin Sputnik 1’i fırlatması, uzay yarışını başlattı.'],
  ['Küba Devrimi’nin başarıya ulaşması', '1959', 'Fulgencio Batista yönetiminin devrilmesi', 'Fidel Castro öncülüğündeki güçler 1959’da Küba’da iktidarı ele geçirdi.'],
  ['Berlin Duvarı’nın inşa edilmeye başlanması', '1961', 'Doğu Berlin ile Batı Berlin arasındaki sınırın kapatılması', 'Berlin Duvarı, Soğuk Savaş’ın ve Almanya’nın bölünmesinin simgesi haline geldi.'],
  ['Küba Füze Krizi’nin yaşanması', '1962', 'ABD ile Sovyetler Birliği’nin nükleer savaş eşiğine gelmesi', '1962’deki kriz, Soğuk Savaş’ın en tehlikeli nükleer gerilimlerinden biriydi.'],
  ['ABD’de Medeni Haklar Yasası’nın kabul edilmesi', '1964', 'Irk ayrımcılığını ve kamusal alandaki ayrımcı uygulamaları yasaklayan yasa', 'Medeni Haklar Yasası, ABD’de eşitlik mücadelesinin önemli kazanımlarından oldu.'],
  ['Çin’de Kültür Devrimi’nin başlatılması', '1966', 'Mao Zedong’un siyasi ve toplumsal kampanyayı ilan etmesi', 'Kültür Devrimi, Çin’de eğitim, kültür ve yönetim kurumlarını derinden etkiledi.'],
  ['Altı Gün Savaşı’nın yapılması', '1967', 'İsrail ile Mısır, Ürdün ve Suriye güçlerinin karşılaşması', 'Haziran 1967’deki savaş, Orta Doğu’nun sınır ve siyaset dengelerini değiştirdi.'],
  ['Apollo 11’in Ay’a inişi', '1969', 'Neil Armstrong ve Buzz Aldrin’in Ay yüzeyine ulaşması', 'Apollo 11, insanları ilk kez Ay yüzeyine indiren uzay görevi oldu.'],
  ['Bangladeş’in bağımsızlığını kazanması', '1971', 'Doğu Pakistan’ın bağımsız devlet olarak ortaya çıkması', '1971’deki savaşın sonunda Bangladeş bağımsızlığını kazandı.'],
  ['Watergate skandalıyla bağlantılı Demokratik Parti merkezine girilmesi', '1972', 'Washington’daki Watergate binasında hırsızlık olayının yaşanması', 'Watergate soruşturması, ABD Başkanı Richard Nixon’ın 1974’te istifasına yol açtı.'],
  ['Saygon’un düşmesi ve Vietnam Savaşı’nın sona ermesi', '1975', 'Kuzey Vietnam kuvvetlerinin Güney Vietnam başkentine girmesi', '30 Nisan 1975’te Saygon’un düşmesi, Vietnam Savaşı’nın sonunu simgeledi.'],
  ['İran Devrimi’nin gerçekleşmesi', '1979', 'Şah yönetiminin sona ermesi ve İslam Cumhuriyeti’nin kurulması', '1979 Devrimi, İran’da monarşiyi sona erdirerek yeni bir siyasi düzen kurdu.'],
  ['Sovyet-Afgan Savaşı’nın başlaması', '1979', 'Sovyet birliklerinin Afganistan’a girmesi', 'Sovyet müdahalesi, Afganistan’da uzun süreli bir savaş ve uluslararası gerilim başlattı.'],
  ['Polonya’da Dayanışma (Solidarność) sendikasının kurulması', '1980', 'Gdańsk Tersanesi’nde bağımsız işçi hareketinin örgütlenmesi', 'Dayanışma hareketi, Polonya’da komünist yönetimin sona ermesinde etkili oldu.'],
  ['Falkland Savaşı’nın başlaması', '1982', 'Arjantin ile Birleşik Krallık’ın adalar üzerindeki savaşı', 'Falkland Savaşı, 1982’de Arjantin’in adaları işgal etmesiyle başladı.'],
  ['Berlin Duvarı’nın açılması', '1989', 'Doğu Almanya’nın sınır geçişlerine izin vermesi', '9 Kasım 1989’da geçişlerin açılması, Almanya’nın birleşmesine giden yolu hızlandırdı.'],
  ['Tiananmen Meydanı protestolarının bastırılması', '1989', 'Pekin’deki öğrenci ve yurttaş gösterilerine askerî müdahale', '1989’daki müdahale, Çin’in yakın tarihindeki önemli siyasi olaylardan biridir.'],
  ['Almanya’nın yeniden birleşmesi', '1990', 'Doğu Almanya’nın Federal Almanya’ya katılması', '3 Ekim 1990’da birleşen Almanya, Avrupa’nın siyasi yapısını değiştirdi.'],
  ['Sovyetler Birliği’nin dağılması', '1991', 'Birlik cumhuriyetlerinin bağımsız devletlere dönüşmesi', 'Sovyetler Birliği 1991’de sona erdi ve Soğuk Savaş dönemi kapandı.'],
  ['Güney Afrika’da ilk çok ırklı genel seçimin yapılması', '1994', 'Nelson Mandela’nın devlet başkanı seçildiği seçim', '1994 seçimleri, apartheid yönetiminin sona ermesini ve demokratik geçişi sağladı.'],
  ['Hong Kong’un Çin’e devredilmesi', '1997', 'Birleşik Krallık yönetimindeki bölgenin Çin’e geçmesi', 'Hong Kong, 1 Temmuz 1997’de Çin’e devredildi.'],
  ['Euro’nun kaydi para olarak kullanılmaya başlanması', '1999', 'Avrupa Birliği ülkelerinin ortak para birimini hesaplarda kullanması', 'Euro 1999’da kaydi para olarak, banknot ve madeni para biçiminde ise 2002’de dolaşıma girdi.'],
  ['11 Eylül saldırılarının gerçekleşmesi', '2001', 'ABD’de Dünya Ticaret Merkezi ve Pentagon’un hedef alınması', '11 Eylül 2001 saldırıları, ABD’nin dış politikasında ve küresel güvenlikte büyük değişikliklere yol açtı.'],
  ['ABD öncülüğündeki Irak işgalinin başlaması', '2003', 'Irak’a yönelik askerî harekâtın başlatılması', '2003’teki işgal, Irak’ta Saddam Hüseyin yönetimini sona erdirdi.'],
  ['Hint Okyanusu depremi ve tsunamisinin yaşanması', '2004', 'Güney ve Güneydoğu Asya kıyılarını etkileyen büyük doğal afet', '26 Aralık 2004’teki tsunami, birçok ülkede ağır can ve mal kaybına yol açtı.'],
  ['Küresel finans krizinin dünya ekonomisini sarsması', '2008', 'ABD’de konut kredisi piyasasından yayılan ekonomik kriz', '2008 finans krizi, bankacılık ve istihdam üzerinde dünya çapında etkiler yarattı.'],
  ['Arap Baharı protestolarının başlaması', '2010', 'Tunus’ta başlayıp başka ülkelere yayılan halk hareketleri', 'Arap Baharı, 2010 sonundan itibaren Orta Doğu ve Kuzey Afrika’daki yönetimleri etkiledi.'],
  ['Paris İklim Anlaşması’nın kabul edilmesi', '2015', 'İklim değişikliğiyle mücadele için ülkelerin ortak anlaşmaya varması', 'Paris Anlaşması, küresel sıcaklık artışını sınırlamak için ülkelerin hedefler belirlemesini öngördü.'],
  ['Birleşik Krallık’ta Brexit referandumunun yapılması', '2016', 'Seçmenlerin Avrupa Birliği’nden ayrılma yönünde oy kullanması', '2016 referandumu, Birleşik Krallık’ın Avrupa Birliği’nden ayrılma sürecini başlattı.'],
  ['Dünya Sağlık Örgütü’nün COVID-19’u pandemi olarak nitelemesi', '2020', 'Yeni koronavirüs salgınının küresel pandemi ilan edilmesi', 'DSÖ, COVID-19 salgınını 11 Mart 2020’de pandemi olarak niteledi.'],
] as const;

const PEOPLE = [
  ['Charles Darwin', 'Türlerin Kökeni eserinde doğal seçilim yoluyla evrim kuramını açıklaması', 'Darwin’in 1859 tarihli eseri, biyolojide evrim düşüncesinin gelişmesini etkiledi.'],
  ['Abraham Lincoln', 'ABD İç Savaşı sırasında Köleliği Kaldırma Bildirgesi’ni yayımlaması', 'Lincoln’ün 1863 tarihli bildirgesi, isyancı eyaletlerde köleleştirilmiş insanları özgür ilan etti.'],
  ['Otto von Bismarck', 'Prusya önderliğinde Alman siyasi birliğini sağlaması', 'Bismarck’ın diplomasisi ve savaşları, 1871’de Alman İmparatorluğu’nun kurulmasını sağladı.'],
  ['Giuseppe Garibaldi', 'İtalya’nın birleşmesi sırasında Kırmızı Gömlekliler’e önderlik etmesi', 'Garibaldi’nin 1860 Sicilya seferi, İtalya’nın birleşme sürecini hızlandırdı.'],
  ['Florence Nightingale', 'Kırım Savaşı’nda hastane bakımını ve modern hemşirelik anlayışını geliştirmesi', 'Nightingale, sağlık hizmetlerinde hijyen ve istatistik kullanımının öncülerindendi.'],
  ['Karl Marx', 'Friedrich Engels ile Komünist Manifesto’yu yazması', 'Marx’ın düşünceleri, 19. ve 20. yüzyıl sosyalist hareketlerini etkiledi.'],
  ['Marie Curie', 'radyoaktivite araştırmalarıyla Nobel Ödülü kazanan ilk kadın olması', 'Curie, fizik ve kimya dallarında Nobel Ödülü alan ilk kişidir.'],
  ['Albert Einstein', 'özel ve genel görelilik kuramlarını geliştirmesi', 'Einstein’ın görelilik kuramları, modern fiziğin temelini değiştirdi.'],
  ['Mahatma Gandhi', 'Hindistan’ın bağımsızlık mücadelesinde şiddetsiz direnişi savunması', 'Gandhi’nin sivil itaatsizlik yaklaşımı, Hindistan’daki bağımsızlık hareketini etkiledi.'],
  ['Vladimir Lenin', '1917 Bolşevik Devrimi sonrasında Sovyet Rusya’nın ilk hükûmetine önderlik etmesi', 'Lenin, Bolşeviklerin iktidarı ele geçirmesinin ardından yeni yönetimin başına geçti.'],
  ['Joseph Stalin', 'Sovyetler Birliği’ni 1920’lerin sonundan 1953’e kadar yönetmesi', 'Stalin dönemi, hızlı sanayileşme ve ağır siyasi baskılarla şekillendi.'],
  ['Winston Churchill', 'İkinci Dünya Savaşı’nın büyük bölümünde Birleşik Krallık başbakanlığı yapması', 'Churchill, savaş sırasında Britanya’nın Nazi Almanyası’na karşı direnişinin önde gelen ismiydi.'],
  ['Franklin D. Roosevelt', 'Büyük Buhran döneminde New Deal programını uygulaması', 'Roosevelt’in New Deal politikaları, ABD’de ekonomik toparlanma ve kamu reformlarını hedefledi.'],
  ['Adolf Hitler', 'Nazi Partisi diktatörlüğünün lideri olarak Avrupa’da savaşı başlatması', 'Hitler’in yayılmacı politikaları ve Polonya’yı işgali, İkinci Dünya Savaşı’nı başlattı.'],
  ['Nelson Mandela', 'apartheid karşıtı mücadele ve Güney Afrika’nın demokratik geçişine öncülük etmesi', 'Mandela, 1994’te Güney Afrika’nın demokratik seçimle göreve gelen ilk siyah devlet başkanı oldu.'],
  ['Martin Luther King Jr.', 'ABD’de sivil haklar hareketinde şiddetsiz direnişi savunması', 'King, 1963 Washington Yürüyüşü’ndeki konuşmasıyla da tanınır.'],
  ['Mao Zedong', '1949’da Çin Halk Cumhuriyeti’ni ilan etmesi', 'Mao, Çin Komünist Partisi’nin lideri olarak yeni devletin kuruluşunu ilan etti.'],
  ['Ho Chi Minh', 'Vietnam’ın bağımsızlık hareketine ve Kuzey Vietnam yönetimine önderlik etmesi', 'Ho Chi Minh, Vietnam’ın Fransa’dan bağımsızlık mücadelesinin simge isimlerindendir.'],
  ['Fidel Castro', '1959 Küba Devrimi sonrasında ülkenin yönetimini üstlenmesi', 'Castro, Batista yönetiminin devrilmesinin ardından Küba’da uzun süre iktidarda kaldı.'],
  ['Che Guevara', 'Küba Devrimi’nde gerilla komutanı ve devrimci olarak rol alması', 'Guevara, Küba Devrimi’nin ardından Latin Amerika’daki devrimci hareketlerle özdeşleşti.'],
  ['Cemal Abdünnasır', 'Süveyş Kanalı’nı 1956’da millîleştirmesi', 'Nasır’ın kanal kararı, Süveyş Krizi’ni başlatan gelişme oldu.'],
  ['Cevahirlal Nehru', 'bağımsız Hindistan’ın ilk başbakanı olması', 'Nehru, 1947’den 1964’e kadar Hindistan hükûmetine başkanlık etti.'],
  ['İndira Gandhi', 'Hindistan’ın ilk kadın başbakanı olarak görev yapması', 'İndira Gandhi, 1966’da başbakan olan ilk kadın ve Hindistan’ın ilk kadın hükûmet başkanıydı.'],
  ['Rosa Parks', 'Montgomery’de otobüste yerini beyaz bir yolcuya vermeyi reddetmesi', 'Parks’ın 1955’teki tutuklanması, Montgomery otobüs boykotunu tetikledi.'],
  ['Malcolm X', 'ABD’de siyahların hakları ve öz savunması üzerine yaptığı konuşmalar', 'Malcolm X, 1960’larda sivil haklar mücadelesinin etkili konuşmacılarından biriydi.'],
  ['Mihail Gorbaçov', 'Sovyetler Birliği’nde glasnost ve perestroyka reformlarını başlatması', 'Gorbaçov’un reformları, Sovyet sisteminin dönüşümünü ve Soğuk Savaş’ın sonunu etkiledi.'],
  ['Lech Wałęsa', 'Polonya’daki Dayanışma işçi hareketine önderlik etmesi', 'Wałęsa, 1980’de kurulan Dayanışma hareketinin lideri ve daha sonra Polonya cumhurbaşkanıydı.'],
  ['Charles de Gaulle', 'Özgür Fransa hareketine önderlik edip Beşinci Cumhuriyet’i kurması', 'De Gaulle, İkinci Dünya Savaşı’nda Fransız direnişini örgütledi ve 1958’de cumhurbaşkanı oldu.'],
  ['Deng Xiaoping', 'Çin’de piyasa odaklı ekonomik reformları başlatması', 'Deng’in reformları, 1970’lerin sonundan itibaren Çin ekonomisinin dönüşümünü sağladı.'],
  ['Golda Meir', 'İsrail’in ilk kadın başbakanlarından biri olarak 1969’da göreve gelmesi', 'Meir, İsrail’in başbakanlığını 1969–1974 yılları arasında yürüttü.'],
  ['Benazir Bhutto', 'Pakistan’da seçilmiş hükûmetin başına geçen ilk kadın olması', 'Bhutto, 1988’de başbakanlığa gelerek Müslüman çoğunluklu bir ülkede bu görevi üstlenen ilk kadın oldu.'],
  ['Pablo Picasso', 'Kübizm akımının gelişmesine Georges Braque ile birlikte öncülük etmesi', 'Picasso’nun Les Demoiselles d’Avignon tablosu, modern sanatın dönüm noktalarından sayılır.'],
  ['Frida Kahlo', 'otoportreleri ve Meksika kültüründen beslenen resimleriyle tanınması', 'Kahlo’nun eserleri, kişisel deneyimleri ve Meksika sanat geleneklerini bir araya getirdi.'],
  ['Roald Amundsen', 'Güney Kutbu’na ulaşan ilk seferi yönetmesi', 'Amundsen’in Norveç seferi, 14 Aralık 1911’de Güney Kutbu’na ulaştı.'],
  ['Ernest Shackleton', 'Endurance seferinde mürettebatını Antarktika’da hayatta tutması', 'Shackleton’ın 1914–1916 seferi, geminin batmasına rağmen tüm mürettebatın kurtarılmasıyla anılır.'],
  ['Yuri Gagarin', 'uzaya çıkan ilk insan olması', 'Sovyet kozmonot Gagarin, 12 Nisan 1961’de Vostok 1 ile Dünya yörüngesine çıktı.'],
  ['Neil Armstrong', 'Ay yüzeyine ayak basan ilk insan olması', 'Armstrong, Apollo 11 görevi sırasında 20 Temmuz 1969’da Ay’a indi.'],
  ['Buzz Aldrin', 'Ay yüzeyinde yürüyen ikinci insan olması', 'Aldrin, Apollo 11 astronotu olarak Armstrong’dan kısa süre sonra Ay’a çıktı.'],
  ['Katherine Johnson', 'NASA’nın ilk insanlı uzay uçuşları için yörünge hesaplamaları yapması', 'Johnson’ın matematiksel hesaplamaları, Mercury ve Apollo görevlerinde kullanıldı.'],
  ['Alan Turing', 'İkinci Dünya Savaşı sırasında Enigma şifrelerinin çözülmesine katkı sağlaması', 'Turing’in çalışmaları, Bletchley Park’taki şifre çözme faaliyetlerinde önemli rol oynadı.'],
  ['Niels Bohr', 'atomun kuantum modelini geliştirmesi', 'Bohr’un atom modeli, elektronların belirli enerji düzeylerinde bulunduğunu açıkladı.'],
  ['Rachel Carson', 'Silent Spring kitabıyla çevre hareketinin büyümesine katkı sağlaması', 'Carson’ın 1962 tarihli kitabı, pestisitlerin çevre ve canlılar üzerindeki etkilerine dikkat çekti.'],
  ['Jonas Salk', 'çocuk felci hastalığına karşı ilk etkili aşıyı geliştiren ekibe liderlik etmesi', 'Salk’ın inaktif çocuk felci aşısı 1955’te güvenli ve etkili ilan edildi.'],
  ['Alexander Fleming', 'penisilini keşfetmesi', 'Fleming, 1928’de penisilinin antibakteriyel etkisini fark etti.'],
  ['Max Planck', 'kuantum kuramının temelini oluşturan enerji kuantaları fikrini ortaya koyması', 'Planck’ın 1900’deki çalışması kuantum fiziğinin başlangıcı kabul edilir.'],
  ['Edwin Hubble', 'uzak galaksilerin varlığını ve evrenin genişlediğine dair kanıtları ortaya koyması', 'Hubble’ın gözlemleri, Samanyolu dışındaki galaksilerin ve genişleyen evren fikrinin anlaşılmasını sağladı.'],
  ['Tim Berners-Lee', 'World Wide Web’in temel teknolojilerini geliştirmesi', 'Berners-Lee, 1989’da CERN’de web’in ilk önerisini hazırladı.'],
  ['Wangari Maathai', 'Kenya’da Yeşil Kuşak Hareketi’ni kurması', 'Maathai’nin hareketi, ağaçlandırmayı kadınların güçlenmesiyle birleştirdi.'],
  ['Desmond Tutu', 'Güney Afrika’da apartheid karşıtı mücadeleyi yürütmesi', 'Tutu, apartheid’e karşı barışçıl kampanyalarıyla 1984 Nobel Barış Ödülü’nü kazandı.'],
  ['Malala Yousafzai', 'kız çocuklarının eğitim hakkı için uluslararası kampanya yürütmesi', 'Malala, 2014’te Nobel Barış Ödülü’nü alan en genç kişi oldu.'],
] as const;

function difficultyFor(index: number): Question['difficulty'] {
  if (index < 15) return 'easy';
  if (index < 35) return 'medium';
  return 'hard';
}

const YEAR_QUESTIONS: readonly Question[] = EVENTS.map(
  ([event, year, , explanation], index) => ({
    id: `dt-${251 + index}`,
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
    id: `dt-${301 + index}`,
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
    id: `dt-${351 + index}`,
    categoryId: 'dunya-tarihi',
    prompt: `${contribution} ile tarihe geçen kişi kimdir?`,
    correctAnswer: person,
    difficulty: difficultyFor(index),
    explanation,
    status: 'approved',
  })
);

export const DUNYA_TARIHI_PART3: readonly Question[] = [
  ...YEAR_QUESTIONS,
  ...EVENT_QUESTIONS,
  ...PERSON_QUESTIONS,
];
