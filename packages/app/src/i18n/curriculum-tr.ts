/**
 * Müfredat içerikleri (TR) — curriculum-en.ts'in tam karşılığı. Her EN
 * key'inin TR çevirisi burada. i18n.test.ts TR'nin EN ile birebir
 * eşleştiğini kontrol eder; eksik anahtar bırakmak testi kırar.
 */
export const CURRICULUM_TR = {
  /* ----- Ünite başlıkları ----- */
  'unit.foundations.name': 'Temeller',
  'unit.foundations.summary': 'Bitler, sayı sistemleri ve mantığını kurduğun Boole cebri.',
  'unit.gates.name': 'Mantık kapıları',
  'unit.gates.summary': 'İlkel yapı taşları + doğruluk tablosu ve K-haritalarıyla sadeleştirme.',
  'unit.combinational.name': 'Kombinasyonel devreler',
  'unit.combinational.summary': 'Toplayıcı, çıkarıcı, çözücü, çoklayıcı — durumsuz mantık blokları.',
  'unit.sequential.name': 'Sıralı elemanlar',
  'unit.sequential.summary': 'Mandallar, flip-floplar ve mantığı belleğe çeviren zamanlama.',
  'unit.registers.name': 'Yazmaçlar ve sayaçlar',
  'unit.registers.summary': 'Yığılmış flip-floplar: paralel yazmaç, kaydırma yazmacı, sayaç.',
  'unit.memory.name': 'Bellek',
  'unit.memory.summary': 'ROM, RAM ve adresin saklama hücresine nasıl bağlandığı.',
  'unit.fsm.name': 'Sonlu durum makineleri',
  'unit.fsm.summary': 'Moore vs Mealy, durum diyagramları, ve bir spec\'ten FSM tasarlama tarifi.',
  'unit.datapath.name': 'Veri yolu ve kontrol',
  'unit.datapath.summary': 'ALU, yazmaç dosyası ve küçük bir CPU\'yu çalıştıran kablolama.',
  'unit.beyond.name': 'Temel ötesi',
  'unit.beyond.summary': 'Tehlikeler, pipeline sezgisi ve uygulamanın gerçek araçlarla bağlantısı.',

  /* ===== Ünite 1: Temeller ===== */
  'lesson.numberSystems.title': '1.2 Sayı sistemleri',
  'lesson.numberSystems.summary': 'İkilik, sekizlik, onaltılık — donanım neden ikinin kuvvetlerini sever.',
  'lesson.numberSystems.step1':
    'Pozisyonel sayı sistemi bir değeri "rakam × taban^konum" toplamı olarak yazar. Onluk taban 10\'dur çünkü on parmakla sayarız.',
  'lesson.numberSystems.step2':
    'Sayısal donanım taban 2 kullanır çünkü transistör güvenilir biçimde ya açık ya kapalıdır. Bitler doğru/yanlış\'a temiz eşlenir.',
  'lesson.numberSystems.step3':
    'Sekizlik (taban 8) ve onaltılık (taban 16) ikiliğin kısaltmasıdır: her sekizlik basamak 3 bit, her onaltılık basamak 4 bit içerir.',
  'lesson.numberSystems.step4':
    '11010110\'u onaltılığa çevir: nibble\'lara ayır → 1101 0110 → D6. Geri çevirmek için: D=1101, 6=0110 → 11010110.',
  'lesson.numberSystems.step5':
    'Constant bileşenini Inspector\'da aç, 0xD6, 0b11010110 ve 214 değerlerini dene. Üçü de aynı baytı kodlar.',

  'lesson.binaryArith.title': '1.3 İkilik aritmetik',
  'lesson.binaryArith.summary': 'Taban 2\'de toplama ve çıkarma — donanımın taklit edeceği işlemler.',
  'lesson.binaryArith.step1':
    'İkilik toplama onluktakiyle aynı kuralları kullanır: sütunları hizala, rakamları topla, sütun tabandan büyükse elde tut.',
  'lesson.binaryArith.step2':
    'Tek bit doğruluk tablosu: 0+0=0c0, 0+1=1c0, 1+0=1c0, 1+1=0c1. "c1" sonraki sütuna elde demektir.',
  'lesson.binaryArith.step3':
    'Çok bit toplama bunu her sütun için tekrarlar, eldeyi yayar. Donanımda bunun karşılığı ripple-carry toplayıcısıdır.',
  'lesson.binaryArith.step4':
    'Çıkarmada ödünç vardır — ama donanım ikinci devreye gerek duymaz: A − B = A + (−B), burada −B değerin ikiye tümleyenidir.',
  'lesson.binaryArith.step5':
    'İki 4-bit Constant ve bir Add bileşeni yerleştir. 0b0101 + 0b0011 ayarla, simüle et, çıkış busunda 0b1000 oku.',

  'lesson.twosComplement.title': '1.4 İkiye tümleyen',
  'lesson.twosComplement.summary': 'Tek toplayıcının çıkarmayı da yapmasını sağlayan işaretli kodlama.',
  'lesson.twosComplement.step1':
    'İkiye tümleyen, −N\'i W-bit genişlikte 2^W − N olarak temsil eder. Tüm bitleri ters çevirip 1 ekleyince aynı değeri elde edersin.',
  'lesson.twosComplement.step2':
    'En üst bit işaret göstergesi gibi davranır: 0 negatif değil, 1 negatif. Geri kalan bitler büyüklüğü kodlar.',
  'lesson.twosComplement.step3':
    'Toplama doğrudan çalışır: 0101 + 1100 = 0001 (5 + −4 = 1) carry-out atılır. Taşma, işaretler sonuçla uyuşmadığında olur.',
  'lesson.twosComplement.step4':
    '4-bit aralık −8…+7\'dir. W bit için aralık −2^(W−1) ile 2^(W−1) − 1 arasıdır — sıfır non-negatif tarafta yer kapladığı için asimetrik.',
  'lesson.twosComplement.step5':
    '4-bit toplayıcı kur, A=0010 (+2) ve B=1110 (−2) ver; toplam=0000 ve atılan carry-out=1 gözlemlersin.',

  'lesson.booleanAlgebra.title': '1.5 Boole cebri',
  'lesson.booleanAlgebra.summary': 'Kapı ağlarını sadeleştirmek için kullandığın cebir.',
  'lesson.booleanAlgebra.step1':
    'İki değer, üç işleç: AND (·), OR (+), NOT (¬). Özdeşlikler: x·1=x, x+0=x, x·x=x, x+x=x, x·0=0, x+1=1.',
  'lesson.booleanAlgebra.step2':
    'Tümleyen yasaları: x·¬x=0, x+¬x=1. Çift olumsuzlama: ¬¬x=x. Devrede çift NOT\'u eler.',
  'lesson.booleanAlgebra.step3':
    'Dağılma: x·(y+z) = x·y + x·z. Yutma: x·(x+y)=x. İkisi de şemayı çizmeden önce ifadeyi küçültür.',
  'lesson.booleanAlgebra.step4':
    'Örnek: x + ¬x·y\'yi sadeleştir. Dağıt: (x + ¬x)·(x + y) = 1·(x + y) = x + y. Bir kapı az.',
  'lesson.booleanAlgebra.step5':
    'Herhangi bir fonksiyonu yalnızca yukarıdaki kurallarla SOP (toplamlar çarpımı) yazarsan, AND/OR/NOT\'tan kuracak hazır bir tarifin olur.',

  'lesson.demorgan.title': '1.6 De Morgan yasaları',
  'lesson.demorgan.summary': 'Olumsuzlamaları AND/OR\'a it — kabarcık değiş tokuş hilesi.',
  'lesson.demorgan.step1':
    '¬(x·y) = ¬x + ¬y ve ¬(x+y) = ¬x·¬y. Olumsuzlama işleci değiştirir ve girişlere dağılır.',
  'lesson.demorgan.step2':
    'Görsel olarak: NAND, girişleri kabarcıklı bir OR\'a eşittir. NOR, girişleri kabarcıklı bir AND\'e eşittir.',
  'lesson.demorgan.step3':
    'Kapı bulurluğunu eşlemek için faydalı: elinde sadece NAND varsa her AND/OR/NOT\'u NAND zinciriyle yeniden kurabilirsin.',
  'lesson.demorgan.step4':
    'Canvas\'ta dene: x·y\'yi bir AND ile kur, sonra iki NOT ve bir NOR ile yeniden kur. Doğruluk tablolarını karşılaştır.',

  /* ===== Ünite 2: Kapılar ===== */
  'lesson.universalGates.title': '2.2 Evrensel kapılar',
  'lesson.universalGates.summary': 'Tek başına NAND (veya NOR) her devreyi kurabilir.',
  'lesson.universalGates.step1':
    'Evrensel kapı, her Boole fonksiyonunun ondan inşa edilebildiği kapıdır. NAND ve NOR ikisi de evrenseldir.',
  'lesson.universalGates.step2':
    'NAND\'dan NOT: her iki girişi de bağla — NAND(x, x) = ¬(x·x) = ¬x.',
  'lesson.universalGates.step3':
    'NAND\'dan AND: bir NAND, ardından bir NOT (ki o da girişleri bağlı bir NAND\'dır).',
  'lesson.universalGates.step4':
    'NAND\'dan OR: ¬(¬x·¬y) = x + y. Her girişi bir NAND\'la ters çevir, sonra ikisini bir NAND\'la birleştir.',
  'lesson.universalGates.step5':
    'Bu neden önemli? Üretici fab tek tip NAND hücresi seri üretebilir ve hâlâ tüm CPU\'ları kurabilir. Bu ekonomi evrensellikten gelir.',

  'lesson.truthTable.title': '2.3 Doğruluk tabloları',
  'lesson.truthTable.summary': 'Bir kombinasyonel devrenin eksiksiz tanımı.',
  'lesson.truthTable.step1':
    'Doğruluk tablosu olası tüm giriş örüntülerini bir sütunda, eşleşen çıkışı diğerinde listeler. N girişten 2^N satır çıkar.',
  'lesson.truthTable.step2':
    'Yukarıdan aşağı oku: her satır "girişler X ise çıkış Y olmalı" der. Devrenin işi bunu fiziksel olarak gerçekleştirmek.',
  'lesson.truthTable.step3':
    'Aynı doğruluk tablosuna sahip iki devre işlevsel olarak eşdeğerdir — kapı sayısı farklı olabilir, ama IO\'da aynı davranır.',
  'lesson.truthTable.step4':
    'Yeni bir kapıyı canvas\'a koy, tüm giriş kombinasyonlarını gez, doğruluk tablosunu yaz. Bu, ters mühendisliğin 101\'idir.',

  'lesson.sopPos.title': '2.4 Toplamlar çarpımı & çarpımlar toplamı',
  'lesson.sopPos.summary': 'Bir Boole fonksiyonunu yazmanın iki standart yolu.',
  'lesson.sopPos.step1':
    'SOP: çıkışın 1 olduğu her satır için bir AND-terimi, hepsini OR\'la birleştir. Her AND-terim bir "minterm"dir.',
  'lesson.sopPos.step2':
    'POS: çıkışın 0 olduğu her satır için bir OR-terimi, hepsini AND\'le birleştir. Her OR-terim bir "maxterm"dir.',
  'lesson.sopPos.step3':
    'Örnek: F(a,b) = a XOR b. Çıkış (0,1) ve (1,0) için 1. SOP: ¬a·b + a·¬b. POS: (a+b)·(¬a+¬b).',
  'lesson.sopPos.step4':
    'SOP iki katlı AND-OR ağına; POS iki katlı OR-AND ağına eşlenir. İkisi de doğru; hangisinin küçük olduğu fonksiyona bağlı.',
  'lesson.sopPos.step5':
    'Herhangi bir doğruluk tablosunu al, SOP ve POS biçimini yaz. Aynı mantığın iki hazır gerçekleştirimini elde ettin.',

  'lesson.karnaugh.title': '2.5 Karnaugh haritaları',
  'lesson.karnaugh.summary': '2-5 değişkenli fonksiyonları sadeleştiren görsel kısayol.',
  'lesson.karnaugh.step1':
    'K-haritası, komşu hücrelerin tam bir değişkende farklı olacağı biçimde yeniden düzenlenmiş doğruluk tablosudur (Gray kodu).',
  'lesson.karnaugh.step2':
    '1\'leri 1, 2, 4, 8\'lik dikdörtgenlere grupla. Büyük gruplar daha çok değişkeni eler.',
  'lesson.karnaugh.step3':
    'Her grup sadeleştirilmiş SOP\'ta bir AND-terimi olur. Terimleri OR\'larsın.',
  'lesson.karnaugh.step4':
    'Don\'t-care\'ler (tabloda X) daha büyük dikdörtgen yapmaya yardım ederse 1 olarak gruplanır, etmezse bırakılır.',
  'lesson.karnaugh.step5':
    'Örnek: F(a,b,c) ve F=1 için mintermler 1,3,5,7. K-haritası tek sütunda dört 1 gösterir → F = c, tek giriş.',
  'lesson.karnaugh.step6':
    '4 değişkenin ötesinde haritalar pratik değil — Quine–McCluskey ya da bir sentezleyici (Yosys, ABC) devreye girer.',

  /* ===== Ünite 3: Kombinasyonel ===== */
  'lesson.rippleAdder.title': '3.3 Ripple-carry toplayıcı',
  'lesson.rippleAdder.summary': 'N tam-toplayıcıyı zincirleyince N-bit sayıları toplarsın.',
  'lesson.rippleAdder.step1':
    '4-bit toplayıcı dört tam-toplayıcı arasında i\'nin carry-out\'unu i+1\'in carry-in\'ine bağlamaktan ibarettir.',
  'lesson.rippleAdder.step2':
    'En alttaki tam-toplayıcının Cin\'i genelde 0\'dır (ikiye tümleyen çıkarmada +1 katmak için 1 yapılır).',
  'lesson.rippleAdder.step3':
    'En kötü gecikme N × t(tam-toplayıcı)\'dır — elde her aşamada yayılır. Carry-lookahead toplayıcı bu yüzden var.',
  'lesson.rippleAdder.step4':
    'nandbench\'ta 4-bit ripple\'ı 4 tam-toplayıcı yerleştirerek veya genişlik=4 Adder ilkelini kullanarak kurabilirsin.',
  'lesson.rippleAdder.step5':
    'A=0011 ve B=0001 ver (3+1), simüle et; toplamın 0100 (4) ve carry-out\'un 0 olduğunu gör.',

  'lesson.subtractor.title': '3.4 Çıkarıcı',
  'lesson.subtractor.summary': 'Toplayıcıyı tekrar kullan: B\'yi tersle ve Cin=1 yap.',
  'lesson.subtractor.step1':
    'A − B = A + (−B) = A + (¬B + 1). "+1" en alt bite Cin=1 enjekte edilerek sağlanır.',
  'lesson.subtractor.step2':
    'Her B-girişine bir XOR yerleştir ve "sub" kontrol hattını ekle: sub=0 → toplayıcı, sub=1 → çıkarıcı.',
  'lesson.subtractor.step3':
    'Carry-out yorumu farklı: çıkarma modunda Cout=0 "ödünç oldu" demektir ve sonuç negatiftir.',
  'lesson.subtractor.step4':
    'Kur: 4-bit toplayıcı, dört XOR B girişinde, sub kontrolü tüm XOR\'lara ve Cin\'e. A=0100, B=0001, sub=1 → sonuç 0011 (3).',

  'lesson.comparator.title': '3.5 Karşılaştırıcı',
  'lesson.comparator.summary': 'İki sayı arasında eşit / küçük / büyük tespit et.',
  'lesson.comparator.step1':
    'Eşitlik: bit-bit XNOR, sonra tüm XNOR çıkışlarını AND\'le. Tek bir bit farklıysa AND 0\'a düşer.',
  'lesson.comparator.step2':
    'Büyüklük: A−B yap (veya özel hücre kullan). Sonucun işareti A<B (negatif) ya da A≥B (non-negatif) söyler.',
  'lesson.comparator.step3':
    'Aşamalama: küçük N-bit karşılaştırıcılar eşit/büyük/küçük sinyallerini geçirerek büyüklere zincirlenir.',
  'lesson.comparator.step4':
    'Comparator ilkelini kullan: A=0110 (6) ve B=1001 (9) ver, lt/eq/gt çıkışlarını gözle.',

  'lesson.decoder.title': '3.6 Çözücü',
  'lesson.decoder.summary': 'N-bit adresi 2^N\'lik 1-of-N seçim hattına çevirir.',
  'lesson.decoder.step1':
    '2-to-4 çözücüsü 2 girişe ve 4 çıkışa sahiptir. 0..3 giriş için tam bir çıkış 1 olur.',
  'lesson.decoder.step2':
    'İçeride: her giriş bitinin doğrudan ve olumsuzlanmış halini AND\'le. Her çıkış benzersiz bir minterm seçer.',
  'lesson.decoder.step3':
    'Enable hattı (E) her çıkışı kapatır — E=0 olduğunda tüm çıkışlar 0\'dır.',
  'lesson.decoder.step4':
    'Çözücüler her yerde: CPU\'da komut çözümü, bellekte adres çözümü, FSM\'de one-hot kodlama.',
  'lesson.decoder.step5':
    'Bir Decoder yerleştir, N=2 yap, girişleri 00→01→10→11 dolaş ve tek bir çıkış bitinin giriş değerini izlediğini gör.',

  'lesson.encoder.title': '3.7 Kodlayıcı & öncelikli kodlayıcı',
  'lesson.encoder.summary': 'Çözücünün tersi — one-hot\'ı ikilik indekse indirger.',
  'lesson.encoder.step1':
    '4-to-2 kodlayıcı 4 giriş hattı alır (one-hot varsayılır) ve hangi hattın yüksek olduğunu söyleyen 2-bit sayı verir.',
  'lesson.encoder.step2':
    'Birden fazla giriş 1 olabiliyorsa öncelikli kodlayıcı gerekir: en yüksek önceliğe sahip aktif girişin indeksini döner.',
  'lesson.encoder.step3':
    'Genelde "valid" çıkışı eklenir — yoksa "hiç giriş 1 değil" ile "giriş 0 yüksek" durumu ikisi de 00 görünür.',
  'lesson.encoder.step4':
    'Öncelikli kodlayıcılar kesme denetleyicilerinin kalbidir: bekleyen kesmelerden en yüksek öncelikliyi seçer.',

  'lesson.mux.title': '3.8 Çoklayıcı (MUX)',
  'lesson.mux.summary': 'N-to-1 veri seçici — devrenin if/else\'i.',
  'lesson.mux.step1':
    '2-to-1 MUX\'un veri girişleri A, B ve seçim biti S vardır. S=0 iken çıkış A; S=1 iken çıkış B.',
  'lesson.mux.step2':
    'Denklem: out = ¬S·A + S·B. Bir NOT, iki AND, bir OR ile veya MUX ilkeliyle kurarsın.',
  'lesson.mux.step3':
    '4-to-1 MUX 2 seçim bitiyle 4 veri hattından birini seçer. Seçim genişliği log₂(N)\'dir.',
  'lesson.mux.step4':
    'Geniş MUX\'lar yazmaç dosyasında hangi yazmacın okunacağını ve ALU\'nun add/sub/and/or sonucundan hangisini seçeceğini belirler.',
  'lesson.mux.step5':
    'MUX 2-to-1 şablonunu aç, S\'yi değiştirerek çıkışta A ile B arasında geçiş yap.',

  'lesson.demux.title': '3.9 Çoğullamayı çözücü (DEMUX)',
  'lesson.demux.summary': '1-to-N veri yönlendirici — devrenin switch\'i.',
  'lesson.demux.step1':
    'DEMUX bir veri girişi alır ve seçim bitlerine göre N çıkıştan birine yönlendirir.',
  'lesson.demux.step2':
    'Seçilmeyen çıkışlar 0\'dır. Bu yüzden DEMUX, veri hattının her çıkışla AND\'lendiği bir çözücüye çok benzer.',
  'lesson.demux.step3':
    'Kullanım yerleri: birden çok yazmaçtan birine yazma, seri bir akışı paralel kanallara yönlendirme.',
  'lesson.demux.step4':
    'Bir çözücü + bir 1-bit veri girişi + N AND = bir DEMUX. Ya da DEMUX ilkelini doğrudan kullan.',

  'lesson.triState.title': '3.10 Üç-durumlu tamponlar',
  'lesson.triState.summary': 'Üçüncü değer — Z — birden çok sürücünün tek teli paylaşmasını sağlar.',
  'lesson.triState.step1':
    'Üç-durumlu tamponun veri, enable ve çıkış pini vardır. enable=1 iken veri geçer; enable=0 iken çıkış Z (yüksek empedans) olur.',
  'lesson.triState.step2':
    'Z "sürmemek"tir — tel elektriksel olarak boş. Başka bir sürücü çakışmasız devreye girebilir.',
  'lesson.triState.step3':
    'Aynı nette iki non-Z sürücüsü X (bilinmeyen / çakışma) üretir — asistanın işaretlediği multi-driver tanısı tam budur.',
  'lesson.triState.step4':
    'Üç-durumlu tamponlar CPU veri yolu paylaşımıdır: okumada bellek, yazımda CPU sürer, diğer zamanlarda yol Z\'dedir.',

  /* ===== Ünite 4: Sıralı ===== */
  'lesson.srLatch.title': '4.1 SR mandalı',
  'lesson.srLatch.summary': 'En basit bellek hücresi — iki çapraz bağlı NOR kapısı.',
  'lesson.srLatch.step1':
    'Birbirine geri besleme yapan iki NOR kapısı SR mandalını oluşturur. Girişler S (set) ve R (reset); çıkışlar Q ve ¬Q.',
  'lesson.srLatch.step2':
    'S=1, R=0 → Q 1\'e kilitlenir. S=0, R=1 → Q 0\'a kilitlenir. S=0, R=0 → Q önceki değerini korur. İşte bellek.',
  'lesson.srLatch.step3':
    'S=R=1 yasak durumdur — her iki çıkış da 0\'a iner, Q/¬Q değişmezliği bozulur. Gerçek tasarımlar bundan kaçınır.',
  'lesson.srLatch.step4':
    'SR mandalı temeldir: bir çipteki her flip-flop ve yazmaç sonunda buna benzer geri besleme döngülerine indirgenir.',
  'lesson.srLatch.step5':
    'SR-mandalı şablonunu aç. S=1 darbele → Q=1. R=1 darbele → Q=0. Girişler 0\'a döndüğünde değerin nasıl korunduğunu gözle.',

  'lesson.dLatch.title': '4.2 D mandalı',
  'lesson.dLatch.summary': 'D\'yi etkinken kopyalayan saatli SR mandalı.',
  'lesson.dLatch.step1':
    'C clock girişi ekle ve S=D·C, R=¬D·C\'yi SR mandalına bağla. C=1 iken mandal D\'yi takip eder; C=0 iken tutar.',
  'lesson.dLatch.step2':
    'Bu, SR\'nin yasak durumunu ortadan kaldırır — bir anda yalnız S veya R\'den birini sürmüş olursun.',
  'lesson.dLatch.step3':
    'D mandalı "seviyeye duyarlıdır": C yüksek olduğu süre boyunca D\'yi kopyalar, sadece saat kenarında değil.',
  'lesson.dLatch.step4':
    'Çoğu tasarım kenar tetiklemeli D flip-flop tercih eder — saat çevriminde bir kez yakalama zamanlama analizini kolaylaştırır.',

  'lesson.dFlipFlop.title': '4.3 D flip-flop',
  'lesson.dFlipFlop.summary': 'Kenar-tetiklemeli depolama — senkron tasarımın iş gören parçası.',
  'lesson.dFlipFlop.step1':
    'D flip-flop, D\'yi saatin yükselen kenarında örnekler ve sonraki yükselen kenara kadar tutar.',
  'lesson.dFlipFlop.step2':
    'İç yapı: birbiri ardına iki D mandalı (master-slave), biri C=0\'da şeffaf, biri C=1\'de. Sonuç "kenar-tetiklemeli"dir.',
  'lesson.dFlipFlop.step3':
    'Setup süresi: D, kenardan önce stabil olmalı. Hold süresi: D kenardan sonra biraz daha stabil kalmalı. İhlalleri metastabil çıkış verir.',
  'lesson.dFlipFlop.step4':
    'W bit genişliğinde bir yazmaç, ortak saatli W D flip-floptan ibarettir.',
  'lesson.dFlipFlop.step5':
    'Bir D-flip-flop yerleştir, D\'yi bir girişe, CLK\'yı Clock ilkeline, Q\'yu bir LED\'e bağla. Q\'nun yalnız saat kenarlarında değiştiğini gör.',

  'lesson.jkFlipFlop.title': '4.4 JK flip-flop',
  'lesson.jkFlipFlop.summary': 'SR gibi ama yasak durum yerine toggle.',
  'lesson.jkFlipFlop.step1':
    'J, S gibi; K, R gibi davranır. Bonus: J=K=1 her saat kenarında çıkışı toggle eder (yasak durum yok).',
  'lesson.jkFlipFlop.step2':
    'Saat kenarında doğruluk tablosu: J=0 K=0 tut; J=0 K=1 sıfırla; J=1 K=0 bir yap; J=1 K=1 toggle.',
  'lesson.jkFlipFlop.step3':
    'JK sayıcılar için elverişlidir — J=K=1 bağla, her saatte ücretsiz toggle alırsın.',
  'lesson.jkFlipFlop.step4':
    'Modern FPGA kütüphaneleri çoğunlukla yalnız D flip-flop sunar; JK\'yı bir D + küçük bir MUX\'tan kolayca kurarsın.',

  'lesson.tFlipFlop.title': '4.5 T flip-flop',
  'lesson.tFlipFlop.summary': 'T=1 iken her saat kenarında toggle, T=0 iken tut.',
  'lesson.tFlipFlop.step1':
    'Tek giriş T artı bir saat. T=1 → Q kenarda dönüyor; T=0 → Q tutuyor.',
  'lesson.tFlipFlop.step2':
    'T flip-flop ripple sayıcı için en doğal yapı taşıdır: her Q sonraki saatı besler şekilde zincirle.',
  'lesson.tFlipFlop.step3':
    'Eşdeğer devre: D flip-flop\'a D = Q XOR T, veya JK\'ya J=K=T.',
  'lesson.tFlipFlop.step4':
    'İki T flip-flop ile 2-bit ripple sayıcı kur: ikisi de T=1, ilkinin saatı sistem saati, ikincisi ilkinin Q\'su.',

  'lesson.timing.title': '4.7 Zamanlama — setup, hold ve saat periyodu',
  'lesson.timing.summary': 'Flip-floplar ile kombinasyonel mantık arasındaki sayısal sözleşme.',
  'lesson.timing.step1':
    'Setup (t_su): D, saat kenarından t_su önce stabil olmalı. Hold (t_h): D kenardan sonra t_h boyunca stabil kalmalı.',
  'lesson.timing.step2':
    'Clock-to-Q (t_cq): kenardan sonra Q\'nun yeni değeri yansıtması ne kadar sürer.',
  'lesson.timing.step3':
    'İki flop arası kombinasyonel yol (T_clock − t_cq − t_su)\'dan kısa bitmeli. İhlal ederse tasarım hızda çalışmaz.',
  'lesson.timing.step4':
    'Gerçek çiplerde STA (static timing analysis) aracı her yolu yürür ve slack\'i raporlar. Sıfır altı slack = saat çok hızlı.',
  'lesson.timing.step5':
    'nandbench\'ın motoru olay tabanlıdır, gecikme doğru değil — yani gerçek zamanlama ihlalleri görmezsin. Ama kavramsal model hâlâ geçerli.',

  /* ===== Ünite 5: Yazmaçlar / sayaçlar ===== */
  'lesson.register.title': '5.1 Paralel-yüklü yazmaç',
  'lesson.register.summary': 'Ortak saat + enable arkasında W D flip-flop.',
  'lesson.register.step1':
    'Yazmaç W-bit sözcüğü saklar. Her yükselen saat kenarında, enable yüksekse, giriş busunu saklanan değere kilitler.',
  'lesson.register.step2':
    'Q çıkışları her zaman canlıdır. Yazmaç sonraki enable\'li kenara kadar değerini tutar.',
  'lesson.register.step3':
    'Reset (senkron veya asenkron) yazmacı talep üzerine temizler — tahmin edilebilir başlatma için önemlidir.',
  'lesson.register.step4':
    'Register ilkelini bırak, genişlik=4, 4-bit Constant\'ı D\'ye ve Clock\'u CLK\'ya bağla. Enable\'ı değiştir ve Q\'nun D\'yi bir saat sonra takip ettiğini gör.',

  'lesson.shiftRegister.title': '5.2 Kaydırma yazmacı',
  'lesson.shiftRegister.summary': 'Her saat bitleri yana taşıyan yazmaç.',
  'lesson.shiftRegister.step1':
    'N D flip-flop\'u her Q\'nun sonraki D\'yi beslediği şekilde zincirle. Veri her saatte bir pozisyon kayar.',
  'lesson.shiftRegister.step2':
    'IO biçimine göre 4 varyant: SISO, SIPO, PISO, PIPO (seri/paralel × giriş/çıkış).',
  'lesson.shiftRegister.step3':
    'Kullanım: paralel sözcüğü iletim için seri yapma (PISO), seri akışı paralele alma (SIPO).',
  'lesson.shiftRegister.step4':
    'Kaydırma yazmacı 2 ile çarpma/bölmeyi de yapar — sol kaydırma × 2, sağ kaydırma ÷ 2 (işaretsiz için).',
  'lesson.shiftRegister.step5':
    'Shift-register ilkelini yerleştir, dört saat boyunca seri-in=1010 ver; her Q\'nun bit zincirde ilerlerken yandığını gözle.',

  'lesson.modNCounter.title': '5.4 Modulo-N sayaç',
  'lesson.modNCounter.summary': 'İstediğin N\'de sıfırlayan sayaç.',
  'lesson.modNCounter.step1':
    'Düz ikilik sayaçlar 2^W\'de sıfırlanır. Mod-N sayaç N\'de sıfırlanır — saat bölücü, BCD basamağı, tur sayacı için.',
  'lesson.modNCounter.step2':
    'Tarif: sayaç çıkışını N−1\'le karşılaştır; eşitlikte bir sonraki saatte artırmak yerine senkron reset yap.',
  'lesson.modNCounter.step3':
    'Örnek mod-10: 4-bit sayaç + 1001 (9) tespit eden karşılaştırıcı; bir sonraki kenarda 1010 yerine 0\'a sıfırla.',
  'lesson.modNCounter.step4':
    'Canvas\'ta kur: Counter ilkeli (genişlik 4), Comparator 9 sabitine bağlı, comparator eq çıkışı sonraki saat sinyaliyle AND\'lenip sayacı temizler.',

  'lesson.ringCounter.title': '5.5 Halka & Johnson sayaçları',
  'lesson.ringCounter.summary': 'Döngüye bağlanmış kaydırma yazmacı — one-hot ya da burulu.',
  'lesson.ringCounter.step1':
    'Halka sayaç: son Q\'su ilk D\'yi besleyen N-bit kaydırma yazmacı. Desen sonsuza kadar yürür.',
  'lesson.ringCounter.step2':
    'Tek 1 (one-hot) ile başlatılır, N durumu döner. N olayı çözücü olmadan sıralamak için harika.',
  'lesson.ringCounter.step3':
    'Johnson sayaç: aynı fikir ama geri besleme ters çevrilmiş (son ¬Q → ilk D). N flip-floptan 2N durum üretir.',
  'lesson.ringCounter.step4':
    'Tradeoff: halka sayaç durumları israf eder (N vs 2^N) ama her durum zaten one-hot — çözücü gerekmez.',

  /* ===== Ünite 6: Bellek ===== */
  'lesson.rom.title': '6.1 ROM',
  'lesson.rom.summary': 'Kombinasyonel saklama — adres girer, veri çıkar.',
  'lesson.rom.step1':
    'A adres bitli, D veri bitli ROM\'un 2^A satırı vardır, her satır D bit genişliğindedir. Okuma kombinasyoneldir: adres değişir, veri izler.',
  'lesson.rom.step2':
    'İç yapı: adrese göre bir satır seçen çözücü; veri çıkışlarını süren sabit bağlantı dizisi (program).',
  'lesson.rom.step3':
    'ROM, arama tabloları için harikadır: trig değerleri, karakter glyph\'leri, CPU kontrol birimi mikrokodu, firmware boot kodu.',
  'lesson.rom.step4':
    'nandbench\'ta ROM ilkeli bir data parametresi sunar — tabloyu dolduran hex string. ROM-toy şablonunu aç.',
  'lesson.rom.step5':
    'Adresi bir sayaçla sür ve veri çıkışını bir 7-segment göstergeye bağla — anında karakter ROM demosu.',

  'lesson.ram.title': '6.2 RAM',
  'lesson.ram.summary': 'Yazılabilen saklama — saat tetiklemeli.',
  'lesson.ram.step1':
    'RAM\'in A adres biti, D veri biti, ayrıca write-enable (WE) ve saat vardır. Okuma kombinasyonel; yazma saat kenarında.',
  'lesson.ram.step2':
    'Her saklama hücresi temelde küçük bir D flip-floptur. Çözücüler hücreyi seçer, MUX\'lar okumayı, DEMUX\'lar yazmayı yönlendirir.',
  'lesson.ram.step3':
    'SRAM güç açıkken veri tutar; DRAM kapasitör kullanır ve refresh ister. Sayısal tasarımcı için arayüz aynıdır.',
  'lesson.ram.step4':
    'Canvas\'ta RAM ilkeli değer yazmana, adresi değiştirip yine yazmana, sonra geri okumana izin verir.',
  'lesson.ram.step5':
    'Dene: adres=0, veri=0xA, WE=1, saat. Sonra adres=1, veri=0xB, WE=1, saat. WE=0 ve adresi gez — 0xA sonra 0xB oku.',

  'lesson.addressDecoding.title': '6.3 Adres çözme',
  'lesson.addressDecoding.summary': 'Tek bir adres uzayı birden çok bellek + IO çipine nasıl bağlanır.',
  'lesson.addressDecoding.step1':
    'CPU\'nun adres yolu geniştir (16/32/64 bit); her çevre birimi küçük bir aralığa cevap verir. Adres çözücüler hangi çipin cevap vereceğini seçer.',
  'lesson.addressDecoding.step2':
    'Desen: yüksek adres bitlerini sabit bir kalıba karşılaştır; çipin chip-select hattı yalnız eşleşmede yüksek olur.',
  'lesson.addressDecoding.step3':
    'Chip-select düşükken cihazın veri çıkışı tri-state (Z) olur; böylece yol diğer cihazlara serbest kalır.',
  'lesson.addressDecoding.step4':
    'Modern SoC\'ler bunu tam bir ara bağlantıyla yapar (AXI, Wishbone), ama temel fikir hâlâ "yüksek bitleri çöz → hedefi aç".',

  /* ===== Ünite 7: FSM ===== */
  'lesson.fsmIntro.title': '7.1 Sonlu durum makineleri',
  'lesson.fsmIntro.summary': 'Sıralayıcılar, denetleyiciler, protokoller — hepsi alttan FSM.',
  'lesson.fsmIntro.step1':
    'Bir FSM\'in sonlu durumları, girişlerle tetiklenen geçişleri ve duruma (belki girişe) bağlı çıkışları vardır.',
  'lesson.fsmIntro.step2':
    'Donanım olarak: mevcut durumu saklayan bir yazmaç, (durum, girişler)\'den (sonraki-durum, çıkış) hesaplayan kombinasyonel mantık.',
  'lesson.fsmIntro.step3':
    'Yönlü graf olarak çizilir: düğümler durumlar, kenarlar koşul etiketli geçişler.',
  'lesson.fsmIntro.step4':
    'Sayısal tasarımda hemen her denetleyici FSM\'dir: trafik ışığı, otomat, UART alıcısı, CPU kontrol birimi.',
  'lesson.fsmIntro.step5':
    'FSM-toy şablonunu aç. Bir giriş, bir çıkış ve durum yazmacı olan 3-durumlu makine görürsün.',

  'lesson.mooreMealy.title': '7.2 Moore vs Mealy',
  'lesson.mooreMealy.summary': 'Çıkışları durum makinesine bağlamanın iki yolu.',
  'lesson.mooreMealy.step1':
    'Moore: çıkışlar yalnız mevcut duruma bağlıdır. Basit, glitch-free, bir ekstra saat çevrimi gecikmesi.',
  'lesson.mooreMealy.step2':
    'Mealy: çıkışlar mevcut durum VE mevcut girişe bağlıdır. Daha az durum, ama çıkışlar giriş değişimiyle glitch yapabilir.',
  'lesson.mooreMealy.step3':
    'Çizimde fark: Moore çıkışları durumların üzerinde, Mealy geçiş oklarının üzerindedir.',
  'lesson.mooreMealy.step4':
    'Pratikte sık karıştırılır — tahmin edilebilirlik için Moore taban, tek bir pipeline kazandıracak geçiş için Mealy override.',
  'lesson.mooreMealy.step5':
    '"101" arayan bir dizi tespit edicisi için ikisini de çiz. Moore ekstra durum ister; Mealy son geçişte çıkışı ateşler.',

  'lesson.fsmDesign.title': '7.3 Bir spec\'ten FSM tasarımı',
  'lesson.fsmDesign.summary': 'Tekrar edilebilir tarif — spec → durumlar → kablolar.',
  'lesson.fsmDesign.step1':
    '1. Gözlenebilir davranışları listele (giriş dizileri ve eşleşen çıkışlar).',
  'lesson.fsmDesign.step2':
    '2. Durumları tespit et — sistemin bulunabileceği her "durum" bir state\'tir. İsimlendir, diyagramı çiz, geçişleri etiketle.',
  'lesson.fsmDesign.step3':
    '3. Durum tablosunu kur: satırlar (durum, giriş), sütunlar (sonraki durum, çıkış).',
  'lesson.fsmDesign.step4':
    '4. Durumları bit kalıplarıyla kodla (ikilik, gray, one-hot — boyut ve zamanlamaya göre seç).',
  'lesson.fsmDesign.step5':
    '5. Kodlanmış tablodan sonraki-durum ve çıkış mantığını çıkar — küçük tablolar için K-haritası, büyükler için sentezleyici.',
  'lesson.fsmDesign.step6':
    '6. Kur: bir durum yazmacı + adım 5\'teki kombinasyonel bloklar. Her zaman bilinen bir başlangıç durumuna giden reset yolu ekle.',

  'lesson.stateEncoding.title': '7.4 Durum kodlaması',
  'lesson.stateEncoding.summary': 'Durumlarının silikona giydiği bit kalıbını seç.',
  'lesson.stateEncoding.step1':
    'İkilik kodlama: N durum için log₂(N) bit. En kompakt ama sonraki-durum mantığı karışabilir.',
  'lesson.stateEncoding.step2':
    'One-hot kodlama: N durum için N bit, daima bir tanesi yüksek. Daha çok flop, ama sonraki-durum ve çıkış denklemleri çok sadeleşir.',
  'lesson.stateEncoding.step3':
    'Gray kodlama: komşu durumlar bir bit fark eder. Durum yazmacı asenkron mantıkça okunduğunda glitch\'i azaltır.',
  'lesson.stateEncoding.step4':
    'FPGA\'ler flip-flop zengindir, bu yüzden orta durum sayısında (≤32) one-hot varsayılandır. ASIC\'ler alanı kısmak için yoğun ikiliğe yatkın.',

  /* ===== Ünite 8: Veri yolu ===== */
  'lesson.alu.title': '8.1 ALU — aritmetik mantık birimi',
  'lesson.alu.summary': 'İsteğe göre add / sub / and / or / xor yapan MUX\'lu blok.',
  'lesson.alu.step1':
    'ALU\'nun iki veri girişi (A, B), bir işlem seçimi (ALUop), bir sonuç çıkışı ve bayrakları (zero, carry, overflow) vardır.',
  'lesson.alu.step2':
    'İç yapı: her işlem paralel hesaplanır (adder, AND, OR, …). Bir çoklayıcı ALUop\'a göre doğru olanı seçer.',
  'lesson.alu.step3':
    'Toplama/çıkarma 3.4\'teki hile ile yapılır: B girişine XOR koy, koşullu olarak ters çevir; adder\'in Cin\'ini 1 yap (+1 ekle).',
  'lesson.alu.step4':
    'Modern ALU\'larda kaydırıcı da vardır (mantıksal, aritmetik, rotate). Hepsi ekstra ALUop bitleriyle seçilir.',
  'lesson.alu.step5':
    'ALU-skeleton şablonunu aç. A ve B sür, ALUop\'ı tüm değerlerinde tara, sonuç ve bayrakları oku.',

  'lesson.registerFile.title': '8.2 Yazmaç dosyası',
  'lesson.registerFile.summary': 'İki okuma ve bir yazma portuyla yazmaç dizisi.',
  'lesson.registerFile.step1':
    'Yazmaç dosyası N yazmaçtan birini (küçük CPU\'larda tipik 8/16/32) indekse göre adreslemene izin verir.',
  'lesson.registerFile.step2':
    'Okuma portları kombinasyoneldir: bir MUX hangi yazmacın Q\'sunun read busa süreceğini seçer. CPU\'lar genelde iki paralel okuma sunar.',
  'lesson.registerFile.step3':
    'Yazma portu saatlidir: adres hedefi seçer, write-enable + saat kenarı giriş verisini o yazmaca yazar.',
  'lesson.registerFile.step4':
    'Konvansiyon: yazmaç 0 sabit sıfırdır. Gerçek flop\'a gerek kalmadan "sıfırdan çıkar" hilesi için yer açar.',
  'lesson.registerFile.step5':
    'Register-file şablonunu aç, adres 3\'e değer yaz, sonra iki okuma portundan herhangi biriyle geri oku.',

  'lesson.datapathIntro.title': '8.3 Tek-çevrimli veri yolu',
  'lesson.datapathIntro.summary': 'PC → bellek → yazmaç dosyası → ALU → yazmaç dosyası, tek saatte.',
  'lesson.datapathIntro.step1':
    'Veri yolu birbirine bağlar: program sayacı (PC), komut belleği, yazmaç dosyası, ALU, veri belleği, write-back MUX.',
  'lesson.datapathIntro.step2':
    'Her saat çevriminde: komutu PC adresinden al, çöz, kaynak yazmaçları oku, ALU ile yürüt, gerekirse veri belleğini oku/yaz, yazmaç dosyasına geri yaz.',
  'lesson.datapathIntro.step3':
    'PC güncelleme: ardışık için PC+4, taken branch için PC+offset. Bir MUX branch sonucuna göre seçer.',
  'lesson.datapathIntro.step4':
    'Tek-çevrim kavramsal olarak basit ama yavaş — saat periyodu her aşamadaki en uzun yola eşittir. Bu yüzden pipeline icat oldu.',
  'lesson.datapathIntro.step5':
    'Kablolamadan önce kâğıt üstünde çiz; her MUX\'un kontrol sinyalini etiketle. Sonraki ders bunları üreten kontrol birimini açıklar.',

  'lesson.controlUnit.title': '8.4 Kontrol birimi',
  'lesson.controlUnit.summary': 'Komutu çöz, veri yolunun ihtiyaç duyduğu tüm kontrol sinyallerini üret.',
  'lesson.controlUnit.step1':
    'Kontrol birimi komut opcode\'unu (bazen function bitlerini) alır ve sinyal vektörü çıkarır: ALUop, RegWrite, MemRead, MemWrite, Branch, …',
  'lesson.controlUnit.step2':
    'Hardwired kontrol: opcode → sinyal vektörü bir ROM/PLA\'ya kodlanır. Hızlı ama katı; ISA değişince tablo yeniden kurulur.',
  'lesson.controlUnit.step3':
    'Mikrokodlu kontrol: opcode bir mikroprogram ROM\'unu indeksler ve birkaç mikro-komut üretir. Yavaş ama değişime açık.',
  'lesson.controlUnit.step4':
    'İkisi de nandbench\'ta ROM + sıralama için küçük bir FSM ile kurulabilir. ROM kontrol sözcük tablosunu tutar.',
  'lesson.controlUnit.step5':
    'Bunu önceki dersteki veri yoluna bağla — opcode in, kontrol sinyalleri out — küçük çalışan bir CPU\'n olur.',

  /* ===== Ünite 9: Ötesi ===== */
  'lesson.hazards.title': '9.1 Statik ve dinamik tehlikeler',
  'lesson.hazards.summary': 'Kombinasyonel çıkışın giriş değişiminde neden titrediği.',
  'lesson.hazards.step1':
    'Statik tehlike: giriş değişirken çıkışın stabil kalması gerekirken anlık olarak yanlış değere düşmesi.',
  'lesson.hazards.step2':
    'Eşitsiz kapı gecikmelerinden kaynaklanır — iki yol farklı zamanlarda sonuçlanır, aradaki fark glitch\'tir.',
  'lesson.hazards.step3':
    'Çözüm: geçişte çıkışı stabilize eden "consensus" / artıklı terim ekle. K-haritalarında bunlar üst üste binen gruplar olarak görünür.',
  'lesson.hazards.step4':
    'Senkron tasarım çoğunlukla glitch\'i yutar — çıkış yalnız saat kenarında örneklendiği için anlık glitch\'ler etkilemez.',

  'lesson.pipeline.title': '9.2 Pipeline temelleri',
  'lesson.pipeline.summary': 'Komutları üst üste bindir; saat hızını artırmadan throughput\'u yükselt.',
  'lesson.pipeline.step1':
    'Tek-çevrim veri yolunu aşamalara böl (IF, ID, EX, MEM, WB) ve aralara yazmaç koy. Her çevrimde her aşama farklı bir komutla uğraşır.',
  'lesson.pipeline.step2':
    'Komut başına gecikme aynı, ama eş zamanlı beş komut sırada olduğu için throughput ~5× yükselir.',
  'lesson.pipeline.step3':
    'Yeni sorunlar: veri tehlikeleri (sonraki komut, önceki henüz yazmadığı bir yazmacı okur), kontrol tehlikeleri (branch yönü fetch\'te bilinmiyor).',
  'lesson.pipeline.step4':
    'Çözümler: forwarding, branch tahmin, pipeline stall. Bu dersin kapsamı dışı ama FSM/datapath temeli üstüne kurulur.',

  'lesson.tooling.title': '9.3 Buradan sonra nereye?',
  'lesson.tooling.summary': 'Yosys, Icarus, FPGA — nandbench basamak taşıdır.',
  'lesson.tooling.step1':
    'nandbench yapısal Verilog netlist\'i ve self-checking testbench üretir (Toolbar → menü → Export). Herhangi bir Verilog simülatörüne yükle.',
  'lesson.tooling.step2':
    'Icarus Verilog (iverilog) testbench\'i komut satırından derleyip çalıştırır. Yosys aynı Verilog\'u FPGA\'ya hazır netlist\'e sentezler.',
  'lesson.tooling.step3':
    'Gerçek FPGA akışı için Lattice iCE40 + açık kaynak Yosys → nextpnr → icestorm zincirini dene. Ücretsiz, uçtan uca.',
  'lesson.tooling.step4':
    'Büyük resim: sayısal mantık mikromimarinin, sonra işletim sistemlerinin, sonra her gün kullandığın her şeyin temelidir. İşte zemin burada.',
} as const;
