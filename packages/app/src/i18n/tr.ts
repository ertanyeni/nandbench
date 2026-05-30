import type { EnKey } from './en.js';

/**
 * Turkish translations. Every EN key must have a TR counterpart (enforced
 * via the `Record<EnKey, string>` constraint). Missing keys would fail
 * typecheck — see test/i18n.test.ts for runtime coverage.
 */
import { CURRICULUM_TR } from './curriculum-tr.js';

export const TR: Record<EnKey, string> = {
  ...CURRICULUM_TR,
  /* Toolbar */
  'toolbar.undo': 'Geri al (⌘Z)',
  'toolbar.redo': 'Yinele (⇧⌘Z)',
  'toolbar.zoomOut': 'Uzaklaş',
  'toolbar.zoomIn': 'Yakınlaş',
  'toolbar.resetView': 'Görünümü sıfırla',
  'toolbar.play': 'Oynat (Boşluk)',
  'toolbar.pause': 'Duraklat (Boşluk)',
  'toolbar.step': 'Tek adım',
  'toolbar.resetSim': 'Sıfırla',
  'toolbar.reset': 'sıfırla',
  'toolbar.resetLong': 'Görünümü Sığdır',
  'toolbar.assistantLong': 'AI Asistan',
  'toolbar.lessonsLong': 'Dersler',
  'toolbar.newCircuitLong': 'Yeni Devre',
  'toolbar.componentsLong': 'Bileşenler',
  'toolbar.saveAsComposite': 'Geçerli devreyi bileşik olarak kaydet',
  'toolbar.saveLabel': 'kaydet⋯',
  'toolbar.export': 'dışa aktar',
  'toolbar.exportTooltip': 'JSON olarak indir',
  'toolbar.import': 'içe aktar',
  'toolbar.importTooltip': 'JSON dosyası yükle',
  'toolbar.newCircuit': 'yeni',
  'toolbar.newCircuitTooltip': 'Şablondan yeni devre başlat',
  'toolbar.tickRate': 'Tick hızı',
  'toolbar.localeTooltip': 'Dil',

  /* Palette */
  'palette.title': 'Bileşenler',
  'palette.categories.wiring': 'Kablolama',
  'palette.categories.gates': 'Kapılar',
  'palette.categories.plexers': 'Çoklayıcılar',
  'palette.categories.arithmetic': 'Aritmetik',
  'palette.categories.memory': 'Bellek',
  'palette.categories.io': 'G/Ç',
  'palette.categories.library': 'Kütüphane',
  'palette.instructions':
    'Bir öğeye tıkla, sonra canvas\'a tıklayarak yerleştir. Bir pin\'e tıkla, sonra başka bir pin\'e tıklayarak kabloyu tamamla. Esc iptal eder.',
  'palette.suggestion.tooltip': 'Önerilen sonraki adım',
  'palette.libraryDeleteConfirm': '"{name}" kütüphaneden silinsin mi?',
  'palette.libraryEmptyHint':
    'Henüz kayıtlı bileşen yok.\nSekmeyi kaydet → buraya düşer.',

  /* Palette hints */
  'hint.input': 'Giriş pini',
  'hint.output': 'Çıkış probu',
  'hint.constant': 'Sabit kaynak',
  'hint.clock': 'Saat kaynağı',
  'hint.splitter': 'Bus → alt-buslar',
  'hint.tunnel': 'Adlı sanal tel',
  'hint.not': 'Çevirici',
  'hint.buffer': 'Tampon',
  'hint.and': '2-girişli VE',
  'hint.or': '2-girişli VEYA',
  'hint.nand': '2-girişli NAND',
  'hint.nor': '2-girişli NOR',
  'hint.xor': '2-girişli XOR',
  'hint.xnor': '2-girişli XNOR',
  'hint.mux': '2:1 çoklayıcı',
  'hint.demux': '1:2 çoğullayıcı',
  'hint.decoder': '2→4 tek-sıcak',
  'hint.adder': '1-bit toplayıcı + elde',
  'hint.subtractor': '1-bit çıkarıcı',
  'hint.comparator': '1-bit karşılaştırıcı',
  'hint.register': 'Kenar tetiklemeli yazmaç',
  'hint.counter': 'Yukarı sayaç',
  'hint.shiftRegister': 'Kaydırma yazmacı',
  'hint.button': 'Basma butonu',
  'hint.led': 'Gösterge lambası',
  'hint.sevenSeg': '7-segment ekran',
  'hint.probe': 'Salt-okunur gösterge',
  'hint.power': 'Sabit yüksek kaynak',
  'hint.ground': 'Sabit düşük kaynak',
  'hint.bitExtender': 'Sıfır/bir/işaret genişletme',
  'hint.oddParity': 'Tüm girişlerin XOR\'u',
  'hint.evenParity': 'Tüm girişlerin XNOR\'u',
  'hint.controlledBuffer': 'Üç-durumlu tampon',
  'hint.controlledInverter': 'Üç-durumlu çevirici',
  'hint.priorityEncoder': 'En yüksek-set indis',
  'hint.bitSelector': 'Bus\'tan bit[sel] oku',
  'hint.multiplier': 'N×N → 2N sonuç',
  'hint.divider': 'Bölüm + kalan',
  'hint.negator': "İki\'nin tümleyenli -in",
  'hint.absolute': 'Mutlak değer',
  'hint.minMax': 'min(a,b) ve max(a,b)',
  'hint.shifter': 'Bidayet kaydırıcı L/R',
  'hint.bitAdder': '1 bit sayısı',
  'hint.bitFinder': 'En düşük/yüksek set biti',
  'hint.pullResistor': 'Pull-up / pull-down kaynağı',
  'hint.por': 'Açılışta sıfırlama darbesi',
  'hint.exponentiator': 'Modüler a^b',
  'hint.squareRoot': 'Tamsayı √in (taban)',
  'hint.ram': 'Senkron oku/yaz bellek',
  'hint.rom': 'Salt-okunur veri tablosu',
  'hint.dFlipFlop': 'D flip-flop (kenar→q:=d)',
  'hint.tFlipFlop': 'T flip-flop (kenarda toggle)',
  'hint.jkFlipFlop': 'JK flip-flop (evrensel)',
  'hint.srFlipFlop': 'SR flip-flop (set/reset)',

  /* Tabs */
  'tabs.newShort': 'Yeni',
  'tabs.newTooltip': 'Yeni sekme (⌘T)',
  'tabs.closeTooltip': 'Sekmeyi kapat (⌘W)',
  'tabs.publishTooltip': 'Bu sekmeyi kütüphaneye bileşen olarak ekle — diğer sekmelere hazır bileşen gibi sürükleyip bırakırsın',
  'tabs.publishLabel': 'Bileşene Çevir',
  'tabs.closeConfirm': '"{name}" kapatılsın mı? Geri-al geçmişi silinecek.',
  'tabs.closeConfirmDirty': '"{name}" kapatılsın mı? Kaydedilmemiş değişiklikler ve geçmiş silinecek.',
  'tabs.closeConfirmLibrary': '"{name}" kapatılsın mı? Düzenlemeler kütüphaneye senkronize olur, geçmiş silinir.',
  'tabs.overflowTooltip': 'Tüm sekmeler',

  /* Folder persistence */
  'toolbar.folderSave': 'klasöre kaydet',
  'toolbar.folderSaveTooltip': 'Projeyi JSON dosyaları içeren bir klasör olarak kaydet',
  'toolbar.folderOpen': 'klasör aç',
  'toolbar.folderOpenTooltip': 'Bir proje klasörünü aç',
  'toolbar.moreTooltip': 'Daha fazla',
  'toolbar.menuSearchPlaceholder': 'Eylem ara…',
  'toolbar.menuNoMatch': 'Eşleşen eylem yok.',
  'quickopen.title': 'Hızlı aç',
  'quickopen.placeholder': 'Bileşen yerleştir, ders aç, eylem çalıştır…',
  'quickopen.empty': 'Eşleşme yok.',
  'quickopen.libraryHint': 'kayıtlı alt-devre',
  'quickopen.lessonHint': 'dersleri aç',
  'quickopen.actionHint': 'eylem',
  'toolbar.exportVerilog': 'Verilog olarak dışa aktar',
  'toolbar.publishTab': 'sekmeyi bileşene çevir',
  'toolbar.publishedToast': '"{name}" kütüphaneye yayınlandı (id {id}…). Diğer sekmeler artık palette\'in Library bölümünden kullanabilir; buradaki düzenlemeler otomatik senkronize olur.',
  'toolbar.llmSettings': 'AI sağlayıcı…',
  'llm.title': 'AI sağlayıcı (opsiyonel)',
  'llm.subtitle': 'Kendi LLM\'ini bağla. Endpoint, token ve model tarayıcında kalır — gatecraft hiç görmez. Kapalıyken varsayılan kural tabanlı asistan çalışmaya devam eder.',
  'llm.endpoint': 'Endpoint URL',
  'llm.token': 'Bearer token',
  'llm.model': 'Model adı',
  'llm.disable': 'Devre dışı bırak',
  'llm.cancel': 'İptal',
  'llm.save': 'Kaydet',
  'assistant.action.askLlm': '✦ LLM\'e sor',
  'assistant.action.askLlmLoading': '✦ Düşünüyor…',
  'toolbar.colorModeDefault': 'varsayılan renkler',
  'toolbar.colorModeDeuteranopia': 'renk-körü paleti',
  'toolbar.snapEnable': 'snap-to-grid aç',
  'toolbar.snapDisable': 'snap-to-grid kapat',
  'toolbar.waveform': 'dalga formu',
  'toolbar.history': 'geçmiş',
  'history.title': 'Geçmiş',
  'history.subtitle': 'Zaman çizgisinde herhangi bir noktaya atlamak için tıkla.',
  'history.past': 'geçmiş',
  'history.future': 'gelecek',
  'history.now': 'şu an buradasın',
  'contextMenu.deleteWires': '{n} kabloyu sil',
  'contextMenu.deleteComponents': '{n} bileşeni sil',
  'waveform.title': 'Dalga formu',
  'waveform.empty': 'Çıkışlarını izlemek için bir bileşen seç',
  'waveform.signals': 'sinyal',
  'waveform.clear': 'temizle',
  'waveform.refresh': 'tarihçeyi al',
  'waveform.refreshTooltip': 'Simülatörün son 512 tick\'ini çek',
  'toolbar.components': 'bileşenler',
  'toolbar.componentsTooltip': 'Bileşenler panelini aç / kapat',
  'palette.searchPlaceholder': 'Bileşen ara…',

  /* Inspector */
  'inspector.noEditableParams': 'Bu tür için düzenlenebilir parametre yok.',
  'inspector.multiSelected': '{n} bileşen seçili',
  'inspector.multiSelectedHint':
    'Çoklu seçim düzenleme henüz desteklenmiyor — tek bir bileşen seç.',
  'inspector.driveValue': 'Sürülen değer',
  'inspector.driveValueMultiBit': 'Sürülen değer ({width}-bit)',
  'inspector.driveValueHigh': '1 (yüksek) — çevirmek için tıkla',
  'inspector.driveValueLow': '0 (düşük) — çevirmek için tıkla',
  'inspector.driveValuePlaceholder': '0xA veya 42',
  'inspector.liveValues': 'Anlık değerler',
  'inspector.internalState': 'İç durum',
  'inspector.connections': 'Bağlantılar',
  'inspector.noConnections': 'Bağlı kablo yok.',
  'inspector.connectionClickHint': 'Diğer ucu canvas\'ta odaklamak için tıkla',
  'inspector.tab.live': 'Canlı',
  'inspector.tab.params': 'Parametre',
  'inspector.tab.connections': 'Bağlantılar',
  'inspector.labelField': 'Görünen etiket',
  'inspector.labelPlaceholder': 'ör. ALUOp, addr_lo, ready',
  'inspector.noLabelParamsHint': 'Başka düzenlenebilir parametre yok.',
  'inspector.fanout': '{n} fan-out',
  'inspector.stateUnavailable': 'Durum henüz oluşmadı — simülasyonu başlat veya adımla.',
  'inspector.fieldErrors.empty': 'Boş',
  'inspector.fieldErrors.badLiteral': 'Geçersiz değer',
  'inspector.fieldErrors.notNumber': 'Sayı değil',
  'inspector.fieldErrors.min': 'En az {min}',
  'inspector.fieldErrors.max': 'En çok {max}',
  'inspector.fieldErrors.options': 'Şunlardan biri olmalı: {options}',
  'inspector.fieldErrors.literal': 'Geçersiz değer (decimal veya 0xHEX kullan)',

  /* Param labels */
  'param.width': 'Genişlik (bit)',
  'param.inputs': 'Girişler',
  'param.outputs': 'Çıkışlar',
  'param.selectBits': 'Seçim bitleri',
  'param.value': 'Değer (decimal veya 0xHEX)',
  'param.fanout': 'Dallanma',
  'param.label': 'Etiket',
  'param.signed': 'İşaretli',
  'param.direction': 'Yön',
  'param.color': 'Renk',
  'param.name': 'Ad',
  'param.inWidth': 'Giriş genişliği',
  'param.outWidth': 'Çıkış genişliği',
  'param.extendMode': 'Genişletme modu',
  'param.group': 'Grup',
  'param.arithmetic': 'Aritmetik',
  'param.addrBits': 'Adres biti',
  'param.romData': 'Veri (boşlukla ayrılmış hex)',
  'inspector.memorySection': 'Bellek',
  'inspector.memoryPageInfo': '{from}–{to} / {total}',
  'inspector.compositeSection': 'Bileşik kaynağı',
  'inspector.compositeEdit': 'Sekmede düzenle',
  'inspector.compositeMissing': 'Kütüphane kaydı eksik — bileşik düzenlenemiyor.',
  'diagnostics.target.compositeCycle': 'Bileşik döngüsü',
  'diagnostics.detail.compositeCycle': 'Bir bileşik kendine atıf yapıyor: {chain}',
  'diagnostics.target.compositeDepth': 'Bileşik çok derin',
  'diagnostics.detail.compositeDepth': '{depth} iç içe seviye sınırı aşıyor',

  /* ---------------- Asistan (kural tabanlı) ---------------- */
  'assistant.title': 'Asistan',
  'assistant.subtitle': 'Devrene göre eğitici ipuçları.',
  'assistant.empty': 'Şu an önerecek bir şey yok — kurmaya devam et.',
  'toolbar.assistant': 'asistan',
  'toolbar.assistantTooltip': 'Kural tabanlı asistanı aç',
  'toolbar.assistantTooltipWithDiag': 'Asistan: {n} yeni tanı — okumak için tıkla',
  'assistant.close': 'Kapat',
  'assistant.section.onboarding': 'Başlangıç',
  'assistant.section.nextStep': 'Sonraki adım',
  'assistant.section.diagnostic': 'Tanılar',
  'assistant.section.pattern': 'Desen',
  'assistant.section.concept': 'Kavram',
  'assistant.section.quality': 'İyileştirme',
  'assistant.curriculum.next.title': 'Devam: {lesson}',
  'assistant.curriculum.next.body':
    'Kaldığın yerden devam et. Lessons paneli açtığın kısa rehberleri kaydeder; tüm merdiveni tek bakışta görürsün.',
  'assistant.curriculum.graduated.title': 'Tüm dersleri tamamladın 🎉',
  'assistant.curriculum.graduated.body':
    'Kendi devreni kurma zamanı. Lessons ötesi şablonları dene (FSM oyuncağı, register file, ALU iskeleti), ya da gözde alt-devreni kütüphaneye kaydet ve yeniden kullan.',

  /* CTA\'lar */
  'assistant.action.openGlossary': 'Sözlüğü aç',
  'assistant.action.openGlossaryZ': 'Z nedir?',
  'assistant.action.openLesson': 'Dersi aç',
  'assistant.action.openLessons': 'Dersleri aç',
  'assistant.action.openTemplate': 'Şablonu aç',
  'assistant.action.openLessonClock': 'Ders: saat ve yazmaç',
  'assistant.action.openHalfAdder': 'Yarım toplayıcı aç',
  'assistant.action.startTour': 'Turu başlat',
  'assistant.action.placeAnd': 'AND yerleştir',
  'assistant.action.placeOr': 'OR yerleştir',
  'assistant.action.placeNot': 'NOT yerleştir',
  'assistant.action.placeInput': 'IN yerleştir',
  'assistant.action.placeButton': 'BTN yerleştir',
  'assistant.action.placeOutput': 'OUT yerleştir',
  'assistant.action.placeLed': 'LED yerleştir',
  'assistant.action.placeConstant': 'CONST yerleştir',
  'assistant.action.placeTunnel': 'Tünel yerleştir',
  'assistant.action.placeSevenSeg': '7-SEG yerleştir',
  'assistant.action.placeSplitter': 'SPLIT yerleştir',
  'assistant.action.placeRegister': 'Yazmaç yerleştir',
  'assistant.action.placeControlledBuffer': 'Tri-state buffer yerleştir',

  /* Onboarding + next-step */
  'assistant.next.empty.title': 'Hoş geldin — istediğin yerden başla',
  'assistant.next.empty.body':
    'Boş bir canvas korkutucu olabilir. Üç hızlı seçenek: editörü öğrenmek için 5-adımlık turu başlat, ders kütüphanesine göz at, ya da yarım toplayıcı şablonunu açıp tersine mühendislik yap.',
  'assistant.next.inputOnly.title': 'Girişlerin var — şimdi bir kapıyla birleştir',
  'assistant.next.inputOnly.body':
    'Tek başına bir giriş sadece kabloyu sürer. Bir mantık kapısı (AND / OR / NOT) ekle ve girişlerini ona bağla — anlamlı sonuç üretmeye başla.',
  'assistant.next.needsInput.title': 'Kapın bir giriş bekliyor',
  'assistant.next.needsInput.body':
    'Kapılar bir yerden gelen bitlerle çalışır. Bir IN pini (tıklamayla geçiş), BTN (anlık) veya CONST (sabit değer) yerleştir ve kapı girişine bağla.',
  'assistant.next.needsOutput.title': 'Sonucu görebilmek için bir prob ekle',
  'assistant.next.needsOutput.body':
    'Çalıştırabilirsin ama OUT pini ya da LED olmadan sonucu göremezsin. Canvas\'a yerleştir, kapı çıkışından kablola ve Play\'e bas.',
  'assistant.next.noWires.title': 'Bileşenler yerleşti, kablo yok',
  'assistant.next.noWires.body':
    'Bir pin\'e tıkla kabloyu başlat, başka bir pin\'e tıkla bitir. Bağlantılar tamamlanınca sol alttaki Inspector canlı değerleri gösterir.',
  'assistant.next.readyToRun.title': 'Temiz görünüyor — Play\'e bas',
  'assistant.next.readyToRun.body':
    'Devren tanı vermeden derleniyor, giriş ve çıkışlar bağlı. Toolbar\'da ▶ tuşuna bas ve sinyallerin yayılışını izle.',

  /* Tanı kartları */
  'assistant.diag.widthMismatch.title': 'Genişlik uyumsuzluğu ({n})',
  'assistant.diag.widthMismatch.body':
    'Bir kablo farklı bit genişliklerindeki iki portu birleştiriyor. Engine sessizce kesip uzatmaz — her net tek bir genişliğe sahiptir. Bileşen parametrelerini iki tarafı eşitleyecek şekilde ayarla ya da dar tarafı genişletmek için bir EXT (bit-extender) ekle.',
  'assistant.diag.multiDriver.title': 'Çoklu-sürücü çakışması ({n})',
  'assistant.diag.multiDriver.body':
    'İki ya da daha fazla çıkış aynı net\'e değer itiyor. Çözüm kuralı: hem 0 hem 1 ile sürülen bit X olur. Klasik çözüm: bir multiplexer (MUX) sürücüyü seçer, ya da bir tri-state buffer (CBUF) seçilmeyen sürücüleri Z yaparak çakışmayı önler.',
  'assistant.diag.oscillation.title': 'Kombinasyonel salınım',
  'assistant.diag.oscillation.body':
    'Bir sinyal bellek elemanı olmadan kendisine geri besleniyor; simulator değerleri sürekli çeviriyor ve durulmuyor. Gerçek devreler güç tüketir ve öngörülemez davranır. Döngüyü bir yazmaç ya da flip-flop ile kır — geri besleme yolu saat kenarından geçsin.',
  'assistant.diag.floatingInput.title': 'Boşta giriş ({n})',
  'assistant.diag.floatingInput.body':
    'Bir giriş portu kimsenin sürmediği bir net\'e bağlı — değeri Z (yüksek empedans). Z okuyan kapılar X üretir. Net\'i bir IN pini, CONST ya da başka bir bileşen çıkışıyla sür.',
  'assistant.diag.compositeCycle.title': 'Bileşik referans döngüsü',
  'assistant.diag.compositeCycle.body':
    'Kaydedilmiş bir bileşik doğrudan veya zincir üzerinden kendisine atıfta bulunuyor. Engine sonsuz devreyi düzleştirmeyi reddediyor. Zincirdeki bileşiklerden birini düzenle ve kendi-referansını kaldır.',
  'assistant.diag.compositeDepth.title': 'Bileşik iç içe çok derin',
  'assistant.diag.compositeDepth.body':
    'Bileşikler 32 seviyeden daha fazla iç içe — genelde hata. Bazı ara katmanları sadeleştir, ya da derinde gömülü bloğu üst seviyede tek bir bileşik olarak sakla.',
  'assistant.diag.reassure.title': '{n} tanı — hepsi hata değil',
  'assistant.diag.reassure.body':
    'Tanılar gatecraft\'ın canlı geri bildirimidir. Yarı kurulu devrelerde doğal olarak boşta giriş görürsün. Hızla düzeltilmesi gerekenler çoklu-sürücü ve salınımdır — bunlar gerçek çelişkilerdir.',

  /* Desen kartları */
  'assistant.pattern.halfAdder.title': 'Yarım toplayıcıya benziyor',
  'assistant.pattern.halfAdder.body':
    'İki tek-bit girişe XOR + AND klasik yarım toplayıcı yapısıdır. Sum = A XOR B; Carry = A AND B. Şablonu açarak kablolamanı referansla karşılaştır ve doğruluk tablosunu tamamla: 00→00, 01→10, 10→10, 11→01.',
  'assistant.pattern.fullAdder.title': 'Tam toplayıcıya benziyor',
  'assistant.pattern.fullAdder.body':
    'İki XOR, iki AND ve bir OR tam toplayıcıdır: carry-in kabul ederek çok-bit toplama için üst üste konabilir. Her sütun = yarım_toplayıcı(a, b) + yarım_toplayıcı(s1, cin); iki elde OR\'lanır.',
  'assistant.pattern.srLatch.title': 'SR mandalına benziyor',
  'assistant.pattern.srLatch.body':
    'Bir çift çapraz bağlı NOR (ya da NAND) kapısı SR mandalıdır — temel 1-bit bellek hücresi. S=1 Q\'yu set eder, R=1 reset eder, S=R=1 geçersizdir. Her kapının çıkışını diğerinin girişine bağla, döngüyü kapat.',
  'assistant.pattern.clockRegister.title': 'Saat + yazmaç — sequential bölge',
  'assistant.pattern.clockRegister.body':
    'Saat bir saklama elemanıyla birleşince durum yaratır — devren artık tick\'ler arası hatırlayabilir. Yükselen-kenar semantiğine dikkat: yazmaç `d`yi yalnızca saatin 0→1 geçişinde kilitler.',
  'assistant.pattern.counterDisplay.title': 'Sayaç + bus → LED\'ler',
  'assistant.pattern.counterDisplay.body':
    'Sayaç geniş bir bus üretir, ayırıcı bunu tek tek bitlere böler, her bit bir LED\'i sürer — anında ikili gösterge. Hz kaydırıcısını yavaşlat ve sayımın artışını izle.',
  'assistant.pattern.rippleCarry.title': '{n} toplayıcı — ripple-carry zinciri',
  'assistant.pattern.rippleCarry.body':
    'Sırayla birkaç 1-bit toplayıcı ripple-carry adder demektir: her carry-out sonraki sütunun carry-in\'ini besler. Eğitsel açıdan mükemmel ama yayılma gecikmesine dikkat — N-bit toplama N gate delay sürer. Hızlı alternatifler: carry-lookahead, carry-select.',
  'assistant.pattern.fsm.title': 'Sonlu durum makinesine benziyor',
  'assistant.pattern.fsm.body':
    'İki ya da daha çok flip-flop\'a multiplexer (ya da kombinasyonel mantık) beslemesi Moore/Mealy FSM yapar. Durumları flip-flop bitleri olarak kodla, sonraki durumu girişe göre bir mux ile yönlendir. Çıkışlar yalnız durumun fonksiyonu ise Moore, durum + giriş ise Mealy.',
  'assistant.pattern.alu.title': 'ALU iskeleti',
  'assistant.pattern.alu.body':
    'Toplama/çıkarma + işlemi seçen bir mux + dallanma bayrakları için bir karşılaştırıcı — bir ALU\'nun belkemiği. Gerçek tasarımlar mantıksal işlemler (AND/OR/XOR), kaydırıcı ve overflow tespiti ekler ama bu başlangıç noktası.',
  'assistant.pattern.decoderDisplay.title': 'Decoder + 7-segment',
  'assistant.pattern.decoderDisplay.body':
    'Decoder ikili girişi one-hot vektöre eşler; 7-segment karşılık gelen rakamı gösterir. Klasik "ikiliden ondalığa" yemek tarifi devresi. Bir sayaç decoder\'a beslersen 0–9 sayma elde edersin.',
  'assistant.pattern.edgeDetector.title': 'Kenar dedektörü',
  'assistant.pattern.edgeDetector.body':
    'Flip-flop sinyali bir tick geciktirir; gecikmiş ve canlı sürümlerin XOR\'u, giriş her değiştiğinde bir-tick darbe üretir. Buton debounce, senkronizatör ve saat alanı geçişlerinin yapı taşı.',

  /* Kalite iyileştirme */
  'assistant.quality.highFanout.title': '{n}× dallanma — Tunnel dene',
  'assistant.quality.highFanout.body':
    'Çok sayıda alıcıya dallanan bir sürücü görsel olarak hızla karmaşıklaşır. Tunnel "adlı sanal kablo" — aynı etiketli her tunnel elektriksel olarak tek net. Bir küçük adlandırılmış çapayla karmaşayı temizle.',
  'assistant.quality.ledCluster.title': '{n} LED — belki 7-segment + decoder?',
  'assistant.quality.ledCluster.body':
    'Yan yana çok LED genelde tek bir 7-segment rakamı ya da hex gösterge ister. Ayırıcı bitleri açar, decoder değeri segmentlere eşler. Daha temiz şema, aynı bilgi.',
  'assistant.quality.repeated.title': '{n}× {kind} — composite çıkar',
  'assistant.quality.repeated.body':
    'Aynı ilkelın çok kez tekrarı yeniden-kullanılabilir bir yapıya işaret eder. Bloğu seç, toolbar\'dan "kütüphaneye kaydet", sonra her yere bir instance olarak bırak — tek kaynak, çok kullanım.',
  'assistant.quality.compositeReuse.title': '{n} kullanılmayan kütüphane öğesi',
  'assistant.quality.compositeReuse.body':
    'Kütüphanene "{name}" gibi devreler kaydettin ama bu sekmede kullanılmıyor. Palette\'in Library bölümünden çek ya da library listesinden yeni tab\'da düzenlemek için aç.',

  /* Kavram kartları */
  'assistant.concept.and.title': 'AND — ikisi de 1 olmalı',
  'assistant.concept.and.body':
    'AND yalnızca *her* giriş 1 ise 1 verir. 2 giriş doğruluk tablosu: 00→0, 01→0, 10→0, 11→1. "Tüm koşullar geçerli" mantığının temeli.',
  'assistant.concept.or.title': 'OR — biri yeter',
  'assistant.concept.or.body':
    'OR *herhangi bir* giriş 1 ise 1 verir. "Şu ya da bu" anlamı için. Tablo: 00→0, 01→1, 10→1, 11→1.',
  'assistant.concept.not.title': 'NOT — biti çevir',
  'assistant.concept.not.body':
    'Çevirici. 0 → 1, 1 → 0. X ve Z bitleri tanımsız kalır. Gerçekten ihtiyacın olan tek giriş kapısıdır.',
  'assistant.concept.xor.title': 'XOR — tek parite',
  'assistant.concept.xor.body':
    'XOR *tek* sayıda giriş 1 olduğunda yanar. İki giriş için "tam olarak biri". İkili toplamanın (sum bit) ve parite-tabanlı hata tespitinin temeli.',
  'assistant.concept.nand.title': 'NAND — evrensel kapı',
  'assistant.concept.nand.body':
    'NAND, çıkışı ters çevrilmiş AND\'dir. Önemli özelliği: yalnızca NAND ile *her* boolean fonksiyonu kurabilirsin — evrensel kapı. Gerçek çipler sıklıkla NAND\'ı temel hücre yapar.',
  'assistant.concept.splitter.title': 'Splitter — bus\'u dilimle',
  'assistant.concept.splitter.body':
    'Splitter N-bit bus\'u alıp her biti (ya da bit grubunu) kendi pininde sunar. Sayaçtan LED\'leri sürmek ya da bir belleğin adresini parçalamak için.',
  'assistant.concept.tunnel.title': 'Tunnel — adlı sanal kablo',
  'assistant.concept.tunnel.body':
    'Aynı etikete sahip iki tunnel elektriksel olarak aynı net\'tir. Uzun mesafeli bağlantıları sadeleştir — global saat, reset, ortak veri bus\'ları.',
  'assistant.concept.bitExtender.title': 'Bit extender — daha geniş bus\'a doldur',
  'assistant.concept.bitExtender.body':
    'N-bit girişi M bite genişletir; 0, 1 ya da işaret bitiyle doldurur. Küçük aritmetik blok ile geniş yazmaç arasındaki klasik tutkal.',
  'assistant.concept.mux.title': 'MUX — N\'den birini seç',
  'assistant.concept.mux.body':
    'Bir çoklayıcı `select` sinyaline göre veri girişlerinden tam birini çıkışa yönlendirir. Sayısal mantığın "anahtar"ı. ALU\'lardan bellek bus arbiter\'larına her yerde.',
  'assistant.concept.decoder.title': 'Decoder — ikiliden one-hot',
  'assistant.concept.decoder.body':
    'N→2^N decoder ikili bir sayıyı one-hot vektöre çevirir: yalnızca seçilen çıkış 1, gerisi 0. Belleğin adres çözücüsü ve 7-segment\'in tetikleyicisi.',
  'assistant.concept.priorityEncoder.title': 'Priority encoder — en yüksek 1\'i bul',
  'assistant.concept.priorityEncoder.body':
    '2^N giriş verildiğinde, en yüksek indexli 1 olan girişin ikili indeksini verir. Decoder\'ın duali. Kesme denetleyici ve floating-point normalize\'da kullanılır.',
  'assistant.concept.adder.title': 'Adder — uzun toplamanın bir sütunu',
  'assistant.concept.adder.body':
    '1-bit tam toplayıcı a + b + carry-in\'den sum ve carry-out hesaplar. N tanesini zincirleyince N-bit toplama. Carry\'nin yayılması ders kitabındaki "propagation delay" örneğidir.',
  'assistant.concept.multiplier.title': 'Multiplier — N×N → 2N',
  'assistant.concept.multiplier.body':
    'Kombinasyonel çarpıcı: tam 2N-bit çarpımı lo + hi olarak verir. Gerçek CPU\'lar pipeline\'lar; burada atomik, böylece kullanım pattern\'leriyle deneyebilirsin.',
  'assistant.concept.shifter.title': 'Shifter — barrel L/R',
  'assistant.concept.shifter.body':
    'Girişi çalışma-zamanı seçilen miktarda kaydırır. Mantıksal sağ kaydırma 0 ile doldurur; aritmetik sağ kaydırma işaret bitini kopyalar. 2 üssü ile hızlı çarp/böl temeli.',
  'assistant.concept.register.title': 'Register — değeri hatırla',
  'assistant.concept.register.body':
    'Yazmaç saklı değerini saat kenarları arası tutar. Yükselen kenarda enabled\'sa veri girişini kilitler. N yazmaç + adder = sayaç.',
  'assistant.concept.counter.title': 'Counter — otomatik sayım',
  'assistant.concept.counter.body':
    'Sayaç, her saat kenarında saklı değeri mod 2^N artıran N zincirlenmiş yazmaçtır. Enable ile durdur, reset ile sıfırla, carry-out ile büyük sayaçlar zincirle.',
  'assistant.concept.ram.title': 'RAM — adreslenebilir oku/yaz',
  'assistant.concept.ram.body':
    'Senkron RAM `2^addrBits` kelimeyi `width` bit olarak saklar. Yazmalar `we` yüksekken yükselen kenarda; okumalar asenkron + `oe` ile gated. Bir CPU\'nun yazmaç dosyası ve cache\'i de aynı taşı kullanır.',
  'assistant.concept.rom.title': 'ROM — programlı arama tablosu',
  'assistant.concept.rom.body':
    'ROM sabit tablo: verilen adresteki değeri döndürür. Microcode, karakter üretici, küçük sabit tablo için. Donanımda üretimde yakılır; burada data param\'ını edit edersin.',
  'assistant.concept.dFlipFlop.title': 'D flip-flop — tek-bit yazmaç',
  'assistant.concept.dFlipFlop.body':
    'Yükselen saat kenarında `d`yi `q`ya yakalar. Mümkün olan en küçük durum elemanı. İki D arka arkaya = edge-triggered shift register.',
  'assistant.concept.jkFlipFlop.title': 'JK flip-flop — evrensel',
  'assistant.concept.jkFlipFlop.body':
    'Tut (J=K=0), reset (K=1), set (J=1), toggle (J=K=1). Tek flip-flop tüm temel durum geçişlerini kapsar — ders kitabı "evrensel" flip-flop.',
  'assistant.concept.clock.title': 'Clock — kalp atışı',
  'assistant.concept.clock.body':
    'Kare dalga üretici. Her yükselen kenar yazmaç/sayaç/flip-flop\'u bir adım ilerletir. Hz kaydırıcısıyla yavaşlatıp her geçişi incele.',
  'assistant.concept.controlledBuffer.title': 'Tri-state buffer — opt-in sürücü',
  'assistant.concept.controlledBuffer.body':
    '`en` 1 olduğunda `in`\'i `out`\'a geçirir. 0 olduğunda net\'i bırakır (Z verir). Birden fazla tri-state buffer aynı bus\'u paylaşabilir — biri aktif olduğu sürece. Çoklu-sürücü probleminin klasik çözümü.',

  /* Status bar */
  'statusBar.idle': 'boşta',
  'statusBar.saved': 'Kaydedildi ✓',
  'statusBar.publishedToast': '"{name}" artık bir bileşen — palette\'in Kütüphane bölümünde',
  'statusBar.publishedDismiss': 'Kapat',
  'statusBar.zoom': 'yakınlaştırma {n}%',
  'statusBar.pan': 'kaydırma {x}, {y}',
  'statusBar.noSelection': 'seçim yok',
  'statusBar.selectedSingle': 'seçili: {kind} ({id})',
  'statusBar.selectedMulti': 'seçili: {n} bileşen',
  'statusBar.noDiagnostics': '0 tanı',
  'statusBar.toolMarquee': 'kutu seçim',
  'statusBar.toolPlace': '{kind} yerleştir',
  'statusBar.toolWire': '{comp}:{port} kablosu',
  'statusBar.toolMove': '{n} taşı',
  'statusBar.suggestion': 'Öneri: {kinds}',

  /* Diagnostics */
  'diagnostics.title': 'Tanılar ({n})',
  'diagnostics.empty': 'Tanı yok',
  'diagnostics.kinds.widthMismatch': 'genişlik-uyumsuz',
  'diagnostics.kinds.floatingInput': 'boşta-giriş',
  'diagnostics.kinds.multiDriver': 'çoklu-sürücü',
  'diagnostics.kinds.oscillation': 'salınım',
  'diagnostics.target.widthMismatch': '{port}',
  'diagnostics.target.floatingInput': '{port}',
  'diagnostics.target.multiDriver': '{net} net\'inde {n} sürücü',
  'diagnostics.target.oscillation': '{n} net',
  'diagnostics.detail.widthMismatch':
    'Port {got}-bit fakat net {expected}-bit. Bir tarafı eşitle.',
  'diagnostics.detail.floatingInput':
    'Bu girişe sürücü bağlı değil. Yüksek empedans olarak kalır, akış gate\'leri X okur.',
  'diagnostics.detail.multiDriver':
    'İki veya daha fazla çıkış aynı tele zıt değer sürüyor. Tri-state buffer ekle veya tek sürücü seç.',
  'diagnostics.detail.oscillation':
    'Kombinasyonel geri besleme oturmuyor. Döngüye yazmaç/saat ekle veya döngüyü çıkar.',

  /* Templates */
  'templates.pickTitle': 'Yeni devre — şablon seç',
  'templates.pickSubtitle':
    'Boş başla veya etiketli bir eğitici devreye atla.',
  'templates.cancel': 'Vazgeç',
  'templates.confirmOverwrite':
    'Mevcut devre yerine yüklensin mi? Kaydedilmemiş değişiklikler kaybolur.',
  'templates.empty.name': 'Boş',
  'templates.empty.description': 'Boş bir tuval. Sıfırdan kur.',
  'templates.halfAdder.name': 'Yarım toplayıcı',
  'templates.halfAdder.description': 'A ve B etiketli iki girişiyle XOR + VE.',
  'templates.fullAdder.name': 'Tam toplayıcı',
  'templates.fullAdder.description': 'İki yarım toplayıcı + carry-in.',
  'templates.srLatch.name': 'SR mandalı',
  'templates.jkFlipFlop.name': 'JK flip-flop',
  'templates.jkFlipFlop.description': 'J + K düğmeleri JK flip-flop\'u sürer. Toggle, set, reset ve hold Q / Q̄\'da görünür.',
  'templates.srLatch.description': 'Çapraz bağlı NOR — 1-bit bellek hücresi.',
  'templates.mux2to1.name': '2:1 MUX',
  'templates.mux2to1.description': '`sel` ile iki girişten birini çıkışa yönlendirir.',
  'templates.counterLed.name': 'Sayaç + LED\'ler',
  'templates.counterLed.description': '4-bit sayaç, saat ile sürülür, 4 LED\'e ayrılır.',
  'templates.clockBlink.name': 'Saat yanıp sönmesi',
  'templates.clockBlink.description': 'Saat → yazmaç → LED, her tick\'te değişir.',
  'templates.hexDisplay.name': 'Hex rakam ekranı',
  'templates.hexDisplay.description': 'Dört giriş anahtarı 7-segment\'i sürüyor.',
  'templates.aluSkeleton.name': 'ALU iskeleti',
  'templates.aluSkeleton.description':
    '4-bit toplama ve bit OR yan yana — seçim biti yazarak birini al.',
  'templates.registerFile.name': 'İki yazmaçlık dosya',
  'templates.registerFile.description':
    'İki yazmaç + decoder — 1-bit adres hangisinin saatleneceğini seçer.',
  'templates.fsmToy.name': 'FSM oyuncağı',
  'templates.fsmToy.description':
    'Çapraz bağlı NOR mandallarıyla iki durum arasında butonla geç.',
  'templates.romToy.name': 'ROM oyuncağı',
  'templates.romToy.description': '2-bit adres dört sabit çıkıştan birini açar.',

  /* Welcome / first-run */
  'welcome.title': 'gatecraft\'a hoş geldin',
  'welcome.subtitle':
    'Canlı sayısal devre tasarım ortamı. Kapıları canvas\'a sürükle, bağla, sinyallerin yayılışını izle.',
  'welcome.layout.activity': 'Etkinlik çubuğu — asistan, dersler, sözlük, geçmiş, dalga formuna hızlı erişim.',
  'welcome.layout.palette': 'Bileşenler — editöre sürükle. Üstteki Kütüphane bölümünde kayıtlı alt-devrelerin.',
  'welcome.layout.editor': 'Sekmeli editör — her sekme bir devre. Sekmeyi bileşene çevirip tekrar kullanırsın.',
  'welcome.layout.inspector': 'Inspector — bir bileşen seçtiğinde belirir. Canlı değerler, parametreler, bağlantılar.',
  'welcome.shortcut.quickopen': 'Hızlı aç',
  'welcome.shortcut.save': 'Kaydet → Kütüphaneye ekler',
  'welcome.shortcut.fit': 'Görünüme sığdır',
  'welcome.shortcut.tour': 'Tur tekrar başlat',
  'welcome.shortcut.rotate': 'Seçili\'yi döndür',
  'welcome.cta.learn': 'Öğrenmeye başla',
  'welcome.cta.learnSub': 'Tek bir bit\'ten çalışan bir sayaca uzanan 6 kısa derste adım adım ilerle.',
  'welcome.cta.templates': 'Şablon aç',
  'welcome.cta.templatesSub': 'Hazır devrelere göz at — yarım toplayıcı, SR mandalı, 4-bit sayaç, …',
  'welcome.cta.empty': 'Boş başla',
  'welcome.cta.emptySub': 'Kendim keşfedeceğim.',
  'welcome.skipNext': 'Bunu bir daha gösterme',

  /* Lessons */
  'lessons.title': 'Dersler',
  'lessons.subtitle': 'Kavram → küçük örnek → canvas\'ta dene.',
  'lessons.openTemplate': 'Şablonu aç',
  'lessons.next': 'Sonraki ders',
  'lessons.previous': 'Önceki',
  'lessons.close': 'Kapat',
  'lessons.help.title': 'Yardım ve dersler',
  'lessons.completedShort': 'tamamlandı',
  'lessons.tab.sample': 'Örnek',
  'lessons.tab.workspace': 'Çalışma',
  'lessons.sample.hint': 'Bu dersle gelen devrenin salt-okunur önizlemesi.',
  'lessons.sample.none': 'Bu dersin canvas örneği yok — yalnız kavram.',
  'lessons.workspace.hint':
    'Ders şablonunu canlı editöre yükle, kendi başına bağla, sonra buraya geri dön.',
  'lessons.workspace.openCta': 'Şablonu editöre yükle',
  'lessons.workspace.noTemplate': 'Bu derste yüklenecek şablon yok — saf kavram.',
  'lessons.workspace.blank': 'Boş başla',
  'toolbar.lessons': 'dersler',
  'toolbar.lessonsTooltip': 'Ders kütüphanesini aç',

  /* Individual lessons */
  'lesson.bits.title': '1. Bitler — sayısal mantığın alfabesi',
  'lesson.bits.summary': 'Devreler neden 0 ve 1 ile konuşur.',
  'lesson.bits.step1':
    'Bir sayısal devrenin içindeki her şey bir bittir — 0 (düşük) ya da 1 (yüksek) seviyesinde olan tek bir tel.',
  'lesson.bits.step2':
    'Canvas\'ta: mavi kablo sürülmemiş (Z), gri 0, yeşil 1, kırmızı X (bilinmeyen / çakışma).',
  'lesson.bits.step3':
    'Yarım toplayıcı şablonunu aç, bir IN pinine tıkla, kablonun griden yeşile geçişini izle. Bu, bir bitin durum değiştirmesidir.',

  'lesson.gates.title': '2. Kapılar — bitleri birleştirmek',
  'lesson.gates.summary': 'VE, VEYA, DEĞİL ve dostları bitleri kararlara çevirir.',
  'lesson.gates.step1':
    'VE (AND) her girişi 1 olduğunda 1 verir. VEYA (OR) herhangi bir giriş 1 ise 1 verir. DEĞİL (NOT) tek girişini çevirir.',
  'lesson.gates.step2':
    'NAND ve NOR, VE/VEYA\'nın çıkışında negasyon balonu vardır. XOR tek sayıda giriş 1 ise yanar — ikili toplamanın kalbidir.',
  'lesson.gates.step3':
    'Palette\'ten AND ekle, iki IN pinini girişlerine bağla, çıkışına OUT bağla. Girişleri değiştirip doğruluk tablosunu canlı gör.',
  'lesson.gates.step4':
    'Ekstra: XOR(A, B, C) ne olmalı — "tek parite" ile eşleşiyor mu? 3-girişli sürümü kur ve doğrula.',

  'lesson.halfAdder.title': '3. Yarım toplayıcı',
  'lesson.halfAdder.summary': 'XOR + VE = en basit bir-bit toplayıcı.',
  'lesson.halfAdder.step1':
    'A ve B bitlerini topladığında toplam (S) ve elde (C) bitleri çıkar. S = A XOR B; C = A VE B.',
  'lesson.halfAdder.step2':
    'Yarım toplayıcı şablonunu aç. A ve B\'nin hem XOR\'a hem AND\'e dağıldığını gör.',
  'lesson.halfAdder.step3':
    'A ve B\'yi dört kombinasyonla değiştir. Doğruluk tablosunu doğrula: 0+0=0c0, 0+1=1c0, 1+0=1c0, 1+1=0c1.',
  'lesson.halfAdder.step4':
    'Sağdaki Örnek sekmesinde standart yarım toplayıcıyı incele, ardından Çalışma sekmesine geçip kendi kopyanı kur.',

  'lesson.fullAdder.title': '4. Tam toplayıcı',
  'lesson.fullAdder.summary': 'İki yarım toplayıcı + VEYA = uzun toplamanın bir sütunu.',
  'lesson.fullAdder.step1':
    'Tam toplayıcı bir carry-in (Cin) kabul eder; üst üste koyup çok-bit sayıları toplayabilirsin.',
  'lesson.fullAdder.step2':
    'Tam toplayıcı şablonunu aç. Aslında iki yarım toplayıcının elde bitlerini birleştiren bir VEYA olduğunu fark et.',
  'lesson.fullAdder.step3':
    'A=1, B=1, Cin=1 yap. Sum 1 olmalı (1+1+1 = 11 binary, alt bit 1). Carry-out 1.',
  'lesson.fullAdder.step4':
    'Artık herhangi bir genişlik için yapı taşın var — N tanesini zincirle, N-bit ripple toplayıcı olur (sonraki ünite).',

  'lesson.clock.title': '5. Saat ve yazmaç — belleği eklemek',
  'lesson.clock.summary': 'Saat, kombinasyonel mantığı durum makinesine çevirir.',
  'lesson.clock.step1':
    'Yazmaç değer saklar. Her saat kenarında, enable yüksekse, veri girişini saklı değere kilitler.',
  'lesson.clock.step2':
    'Saat ilkelesi her tick\'te 0/1 arasında değişir. Yazmaca takınca bir-bit yanıp sönen yapı oluşur.',
  'lesson.clock.step3':
    'Saat yanıp sönmesi şablonunu aç, Play\'e bas, LED\'in her tick\'te değiştiğini izle. Hz kaydırıcısını yavaşlat.',
  'lesson.clock.step4':
    'D flip-flop\'lu yazmaç + saat, her senkron tasarımın temelidir. Buradan sonra her şey bunun üstüne kurulur.',

  'lesson.counter.title': '6. Sayaç + gösterge',
  'lesson.counter.summary': 'Yazmaçları üst üste koy → sayaç; ayırıcı ekranı besler.',
  'lesson.counter.step1':
    'Sayaç temelde zincirlenmiş N yazmaçtan oluşan bir ikili sayıcıdır. Counter primitifi bunu hazır verir.',
  'lesson.counter.step2':
    'Ayırıcı bus\'u tek tek bitlere böler — her bit için bir LED ile ikili gösterge elde edersin.',
  'lesson.counter.step3':
    'Sayaç + LED\'ler şablonunu aç, Play\'e bas. Dört LED 0→15 sayar. Aktif kablolardaki yeşil noktaları izle.',
  'lesson.counter.step4':
    'Çalışırken Reset düğmesine bas (Toolbar). Durum anında 0\'a iner — senkron reset bu kadar.',

  /* Glossary */
  'glossary.title': 'Sözlük',
  'glossary.subtitle': 'Uygulamada geçen terimlerin kısa tanımları.',
  'glossary.search': 'Ara…',
  'glossary.empty': 'Eşleşen terim yok.',
  'toolbar.glossary': 'sözlük',
  'toolbar.glossaryTooltip': 'Sözlüğü aç',
  'glossary.term.bit.name': 'Bit',
  'glossary.term.bit.desc':
    'Tek bir ikili sinyal: 0 (düşük) ya da 1 (yüksek). Uygulamadaki her tel bir veya birden çok bit taşır.',
  'glossary.term.bus.name': 'Bus',
  'glossary.term.bus.desc':
    'Aynı anda birden çok bit taşıyan tel. Genişlik bileşene göre ayarlanır (örn. 4-bit, 8-bit).',
  'glossary.term.gate.name': 'Kapı',
  'glossary.term.gate.desc':
    'Boole mantığıyla giriş→çıkış eşleyen ilkel — VE, VEYA, DEĞİL, NAND, NOR, XOR, XNOR, tampon.',
  'glossary.term.driver.name': 'Sürücü',
  'glossary.term.driver.desc':
    'Bir bileşenin çıkış portu net\'e değer iter. Bir net\'in 0, 1 veya birden çok sürücüsü olabilir.',
  'glossary.term.sink.name': 'Alıcı',
  'glossary.term.sink.desc':
    'Bağlı olduğu net\'in değerini okuyan bileşen giriş portu.',
  'glossary.term.net.name': 'Net',
  'glossary.term.net.desc':
    'Kablo ile birbirine bağlı, elektriksel olarak aynı olan port kümesi. Her net\'in bir çözülmüş değeri vardır.',
  'glossary.term.x.name': 'X (bilinmeyen)',
  'glossary.term.x.desc':
    'Simülatörün belirleyemediği bit — birden çok sürücü çakışıyor veya tanımsız bir girişle beslenmiş kapı.',
  'glossary.term.z.name': 'Z (yüksek empedans)',
  'glossary.term.z.desc':
    'Hiç sürülmeyen bit. Tri-state buffer\'lar ve sürücüsüz kablolar Z\'de durur.',
  'glossary.term.fanout.name': 'Fan-out',
  'glossary.term.fanout.desc':
    'Tek bir sürücünün beslediği alıcı sayısı. Inspector\'da port satırının yanındaki sayı budur.',
  'glossary.term.multiDriver.name': 'Çoklu-sürücü çakışması',
  'glossary.term.multiDriver.desc':
    'İki veya daha fazla sürücü aynı net\'e zıt değer iter. Simülatör X olarak çözer ve tanı verir.',
  'glossary.term.oscillation.name': 'Salınım',
  'glossary.term.oscillation.desc':
    'Hiç oturmayan kombinasyonel geri besleme. Yazmaç ile döngüyü kır veya mantığı düşün.',
  'glossary.term.edge.name': 'Saat kenarı',
  'glossary.term.edge.desc':
    'Saatin 0\'dan 1\'e geçtiği an (yükselen kenar). Yazmaçlar bu kenarda girişlerini kilitler.',
  'glossary.term.register.name': 'Yazmaç',
  'glossary.term.register.desc':
    '1-bit (veya N-bit) bellek hücresi. Bir sonraki etkin saat kenarına kadar değerini tutar.',
  'glossary.term.mux.name': 'Çoklayıcı (MUX)',
  'glossary.term.mux.desc':
    'Seçim sinyaline göre N girişten birini seçer. Seçilen giriş çıkışa aktarılır.',
  'glossary.term.splitter.name': 'Ayırıcı',
  'glossary.term.splitter.desc':
    'Geniş bus\'u daha dar alt-buslara böler (örn. 8-bit bus\'u 4×2-bit dilimlere).',
  'glossary.term.tunnel.name': 'Tünel',
  'glossary.term.tunnel.desc':
    'Ad ile "sanal tel". Aynı etikete sahip tüm tüneller elektriksel olarak aynı net\'tir.',
  'glossary.term.composite.name': 'Bileşik (Composite)',
  'glossary.term.composite.desc':
    'Tek blok olarak yeniden kullanılan kaydedilmiş devre. Bir kez kur, dilediğin yere bırak; engine derlerken düzleştirir.',
  'glossary.term.netlist.name': 'Netlist',
  'glossary.term.netlist.desc':
    'Devrenin derlenmiş gösterimi — bileşenler, portlar ve net\'ler — simülatörün koştuğu yapı.',
  'glossary.term.snapshot.name': 'Anlık görüntü (snapshot)',
  'glossary.term.snapshot.desc':
    'Simülatörün her settle/tick\'te ürettiği, her net\'in mevcut değerinin salt-okunur görünümü.',
  'glossary.term.diagnostic.name': 'Tanı',
  'glossary.term.diagnostic.desc':
    'Derleyici veya simülatör tarafından üretilen uyarı — genişlik-uyumsuz, çoklu-sürücü, salınım, boşta-giriş.',
  'glossary.term.truthTable.name': 'Doğruluk tablosu',
  'glossary.term.truthTable.desc':
    'Bir mantık parçasının tüm giriş kombinasyonları ve beklenen çıkışları listesi. Challenge modu devreni bununla puanlar.',

  /* Challenge mode */
  'challenge.title': 'Pratik (Challenge)',
  'challenge.run': 'Devremi kontrol et',
  'challenge.pass': 'Tüm vakalar geçti ✓',
  'challenge.fail': '{n} vaka başarısız',
  'challenge.failDetail': 'Girişler {inputs} → beklenen {expected}, gelen {got}',
  'challenge.error': 'Puanlanamadı: {message}',
  'challenge.missing': 'Bu derste challenge yok.',
  'challenge.expected': 'Beklenen',
  'challenge.actual': 'Gelen',
  'challenge.case': 'Vaka {n}',
  'challenge.downloadTb': 'tb.v',
  'challenge.downloadTbTooltip': 'Tüm doğruluk tablosu vakalarını süren Verilog testbench\'i indir',

  /* Tour */
  'tour.start': 'Tura başla',
  'tour.skip': 'Atla',
  'tour.next': 'Sonraki',
  'tour.done': 'Tamam',
  'tour.step1.title': 'Bileşenler burada',
  'tour.step1.body':
    'Sağdaki palette tüm ilkeleri içerir. Birine tıklayarak "yerleştir" moduna gir.',
  'tour.step2.title': 'Bir kapı yerleştir',
  'tour.step2.body':
    'Palette\'te "AND"e tıkla, sonra canvas\'ta herhangi bir yere tıkla. Bir AND kapısı belirir.',
  'tour.step3.title': 'İncele ve bağla',
  'tour.step3.body':
    'Bir pin\'e tıkla → kablo başlat, başka bir pin\'e tıkla → bağla. Sol alttaki Inspector canlı değerleri gösterir.',
  'tour.step4.title': 'Simülasyonu çalıştır',
  'tour.step4.body':
    'Toolbar\'da Play\'e bas. Tıkladığın girişler 0↔1 arasında geçiş yapar, alt akış kabloları yanar.',
  'tour.step5.title': 'Yardım?',
  'tour.step5.body':
    '"? dersler" butonu 6 kısa ders + bir sözlük açar. Turu oradan tekrar başlatabilirsin.',
  'welcome.cta.tour': 'Turu başlat',
  'welcome.cta.tourSub':
    'Canvas, palette ve simülasyonu nasıl koşturursun — 5 adımlık rehber.',

  /* Kind help */
  'kindHelp.input.title': 'Giriş pini',
  'kindHelp.input.description':
    'Sürülen kaynak — canvas\'ta tıklanınca 0/1 arasında geçiş yapar. Devreye dış uyarı verir.',
  'kindHelp.output.title': 'Çıkış probu',
  'kindHelp.output.description':
    'Pasif alıcı — net\'in değerini gözlemler. Renderer bağlı kabloyu mevcut değere göre renklendirir.',
  'kindHelp.constant.title': 'Sabit',
  'kindHelp.constant.description':
    'Sabit bir literal sürer. Değer decimal (42) veya hex (0xA) yazılabilir.',
  'kindHelp.clock.title': 'Saat',
  'kindHelp.clock.description':
    'Serbest çalışan 1-bit osilatör — her tick\'te durum değiştirir. Yazmaç/sayaç saat girişlerine bağlanır.',
  'kindHelp.splitter.title': 'Ayırıcı',
  'kindHelp.splitter.description':
    'Geniş bus\'u N eşit alt-busa böler. Ters yönde birleştirme yol haritasında.',
  'kindHelp.tunnel.title': 'Tünel',
  'kindHelp.tunnel.description':
    'Adlı sanal tel. Aynı etiket (ve genişlik) ile tüneller elektriksel olarak aynı net — diyagramı temizlemek için.',
  'kindHelp.and.title': 'VE',
  'kindHelp.and.description':
    'Tüm girişler 1 olduğunda çıkış 1, aksi 0. Herhangi bir X bit çıkışı X yapar.',
  'kindHelp.or.title': 'VEYA',
  'kindHelp.or.description':
    'Herhangi bir giriş 1 ise çıkış 1, aksi 0. 1 X\'i bastırır; 0 + X = X.',
  'kindHelp.nand.title': 'NAND',
  'kindHelp.nand.description':
    'Çıkışı ters çevrilmiş VE. Evrensel kapı — sadece NAND ile her mantık kurulabilir.',
  'kindHelp.nor.title': 'NOR',
  'kindHelp.nor.description':
    'Çıkışı ters çevrilmiş VEYA. Yine evrensel — kendisiyle birleştirip her şey kurulur.',
  'kindHelp.xor.title': 'XOR',
  'kindHelp.xor.description':
    'Çıkış 1 ancak ve ancak tek sayıda giriş 1 ise. İki bitin carry\'siz toplamı.',
  'kindHelp.xnor.title': 'XNOR',
  'kindHelp.xnor.description': 'Çıkışı ters XOR — eşitlik dedektörü.',
  'kindHelp.not.title': 'NOT (çevirici)',
  'kindHelp.not.description':
    'Her giriş bitini çevirir. ~X = X (bilinmeyenin tersini de bilemeyiz).',
  'kindHelp.buffer.title': 'Tampon',
  'kindHelp.buffer.description':
    'Kimlik kapısı. Aynı değer, gerçek silikonda biraz gecikmeli — fan-out izolasyonu için.',
  'kindHelp.mux.title': 'Çoklayıcı',
  'kindHelp.mux.description':
    '`sel`\'in ikili değeriyle N girişten birini seçer. sel X/Z ise çıkış X.',
  'kindHelp.demux.title': 'Çoğullayıcı',
  'kindHelp.demux.description':
    '`sel` ile tek `in`\'i N çıkıştan birine yönlendirir. Seçilmeyenler yüksek empedans (Z).',
  'kindHelp.decoder.title': 'Decoder',
  'kindHelp.decoder.description':
    'Tek-sıcak: yalnızca `sel`\'in indeksindeki çıkış 1; gerisi 0. Adres çözmek için.',
  'kindHelp.adder.title': 'İkili toplayıcı',
  'kindHelp.adder.description':
    'a + b + cin → s (toplam) + cout (carry-out). 2^width modülünde sarar.',
  'kindHelp.subtractor.title': 'İkili çıkarıcı',
  'kindHelp.subtractor.description':
    'a − b − bin → d (fark) + bout (borrow-out, taşma olduğunda).',
  'kindHelp.comparator.title': 'Karşılaştırıcı',
  'kindHelp.comparator.description':
    'a ve b\'yi karşılaştırıp `lt`, `eq`, `gt`\'den birini 1 yapar. İşaretli iki\'nin tümleyeni için `signed` aç.',
  'kindHelp.register.title': 'Kenar tetiklemeli yazmaç',
  'kindHelp.register.description':
    'Her saat kenarında, `en` yüksekse `d` mandallanır. Aksi tutulur. `q` daima durumu yansıtır.',
  'kindHelp.counter.title': 'Yukarı sayaç',
  'kindHelp.counter.description':
    '`en` yüksekken her saat kenarında artar; `rst` 0\'a temizler. `co` q maks\'a ulaşınca yükselir.',
  'kindHelp.shiftRegister.title': 'Kaydırma yazmacı',
  'kindHelp.shiftRegister.description':
    'Her etkin saat kenarında seri bir bit kaydırır; paralel içeriği `q` üstünde gösterir.',
  'kindHelp.button.title': 'Basma butonu',
  'kindHelp.button.description':
    'Giriş pini gibi ama görsel olarak ayrı. Canvas\'ta tıkla. Default değer 0 (pulled-low).',
  'kindHelp.led.title': 'LED',
  'kindHelp.led.description':
    'Girişi 1 olduğunda yanan lamba. Pasif alıcı — renderer net\'in değerini okur.',
  'kindHelp.sevenSeg.title': '7-segment ekran',
  'kindHelp.sevenSeg.description':
    'Sekiz ayrı 1-bit segment girişi (a..g + dp). Her birini sür, ilgili segment yanar.',
};
