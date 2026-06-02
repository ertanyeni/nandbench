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
  'toolbar.exportVerilog': 'Verilog olarak dışa aktar…',
  'verilog.title': 'Verilog Dışa Aktar',
  'verilog.subtitle':
    'Geçerli sekme için sentezlenebilir Verilog modülü üret. İstersen herhangi bir dersin challenge spec\'inden testbench ekle — Icarus (iverilog) ile direkt çalışır.',
  'verilog.moduleName': 'Modül adı',
  'verilog.includeTb': 'Testbench ekle (birleşik .v)',
  'verilog.tbLessonSource': 'Testbench kaynağı (ders challenge\'ı)',
  'verilog.tbPickLesson': '— ders seç —',
  'verilog.tbHint':
    'Seçilen dersin challenge spec\'i olmalı. Testbench her doğruluk-tablosu vakasını çalıştırır ve pass/fail sayar.',
  'verilog.cancel': 'İptal',
  'verilog.download': 'İndir',
  /* Kısayol kartı */
  'toolbar.shortcuts': 'klavye kısayolları',
  'shortcuts.title': 'Klavye kısayolları',
  'shortcuts.subtitle': '? tuşuna basarak istediğin an aç. Mac\'te ⌘, diğer platformlarda Ctrl kullanılır.',
  'shortcuts.openCheatsheet': 'Bu kartı aç',
  'shortcuts.save': 'Kaydet (kütüphaneye de işler)',
  'shortcuts.quickOpen': 'Hızlı aç',
  'shortcuts.fitView': 'Görünüme sığdır',
  'shortcuts.restartTour': 'Karşılama turunu tekrarla',
  'shortcuts.undo': 'Geri al',
  'shortcuts.redo': 'Yinele',
  'shortcuts.deleteSel': 'Seçimi sil',
  'shortcuts.rotateSel': 'Seçimi döndür',
  'shortcuts.copy': 'Kopyala',
  'shortcuts.paste': 'Yapıştır',
  'shortcuts.duplicate': 'Seçimi çoğalt',
  'shortcuts.selectAll': 'Tümünü seç',
  'shortcuts.nudge': 'Seçimi dürt',
  'shortcuts.playPause': 'Simülasyon oynat / duraklat',
  'shortcuts.step': 'Tek adım',
  'shortcuts.newTab': 'Yeni sekme',
  'shortcuts.closeTab': 'Sekmeyi kapat',
  'shortcuts.group.general': 'Genel',
  'shortcuts.group.edit': 'Düzenleme',
  'shortcuts.group.sim': 'Simülasyon',
  'shortcuts.group.tabs': 'Sekmeler',
  /* Birleşik dışa aktarım */
  'toolbar.export.long': 'dışa aktar…',
  'toolbar.export.tooltip': 'Şema görseli, doğruluk tablosu, Verilog, analiz, dalga formu veya tam rapor',
  'export.title': 'Dışa aktar',
  'export.subtitle': 'Bir sekme seç ve teslim edilebilir dosyayı üret. Alttaki dosya adı tüm indirmeler için paylaşılır.',
  'export.fileBase': 'Dosya adı',
  'export.copy': 'Kopyala',
  'export.tab.schematic': 'Şema',
  'export.tab.truth': 'Doğruluk tablosu',
  'export.tab.verilog': 'Verilog',
  'export.tab.analysis': 'Analiz',
  'export.tab.waveform': 'Dalga formu',
  'export.tab.report': 'Tam rapor',
  'export.schematic.hint': 'PNG 2× piksel yoğunluğunda; SVG sınırsız ölçek, PDF\'lere temiz gömülür.',
  'export.schematic.downloadPng': 'PNG indir',
  'export.schematic.downloadSvg': 'SVG indir',
  'export.truth.hint': 'Tüm üst düzey giriş kombinasyonları gezilerek {rows} satır üretildi.',
  'export.truth.empty.noInputs': 'Üst düzey giriş yok — bir Input/Button bileşenine isim ver.',
  'export.truth.empty.noOutputs': 'Üst düzey çıkış yok — isimli bir Output/LED ekle.',
  'export.truth.tooLarge': '{rows} satır üretilecek — sınır {cap}. Giriş genişliklerini azaltıp tekrar dene.',
  'export.truth.error': 'Çıkarım başarısız: {message}',
  'export.truth.downloadMd': 'Markdown indir',
  'export.truth.downloadCsv': 'CSV indir',
  'export.analysis.hint': 'Kapı sayısı, üst düzey arayüz, kritik-yol derinliği (kapı-gecikme birimi) ve fan-out histogramı.',
  'export.waveform.hint': 'Waveform panelinin kayıtlı izlerini GTKWave/iverilog uyumlu VCD dosyası olarak indirir.',
  'export.waveform.downloadVcd': 'VCD indir',
  'export.report.hint': 'Tek Markdown dosyası: başlık, arayüz, doğruluk tablosu (kombinasyonel ise), analiz, Verilog modülü ve gömülü SVG şema.',
  'export.report.description': 'Açıklama (opsiyonel)',
  'export.report.descriptionPlaceholder': 'Bu devrenin ne yaptığına dair kısa not — raporun başına eklenir.',
  'export.report.download': 'Raporu indir (.md)',
  /* Bulut senkronu */
  'toolbar.cloud': 'bulut…',
  'toolbar.cloudTooltip': 'Buluta kaydet veya buluttan aç',
  'cloud.title': 'Bulut',
  'cloud.subtitle':
    'Bu devreyi gatecraft sunucusuna kaydet, başka bir tarayıcıdan da kaldığın yerden devam et. Paylaşım linkine sahip herkes görüntüleyebilir; düzenleme yalnızca senin ya da düzenleme tokenını bilen birine açıktır.',
  'cloud.signedInAs': '{email} olarak giriş yapıldı',
  'cloud.signOut': 'Çıkış',
  'cloud.anonymous': 'Anonim — kayıtların bu tarayıcıya bağlı kalır.',
  'cloud.signIn': 'E-posta ile giriş yap',
  'cloud.emailPlaceholder': 'sen@ornek.com',
  'cloud.sendLink': 'Giriş bağlantısı gönder',
  'cloud.linkSent': 'Kutunu kontrol et — bağlantı 15 dakika geçerli.',
  'cloud.saveCurrent': 'Bu devreyi buluta kaydet',
  'cloud.saveAgain': 'Bulut kopyasını güncelle',
  'cloud.lastSync': 'Son eşitleme: {when}',
  'cloud.public': 'Linki olan herkes görüntüleyebilir',
  'cloud.copyLink': 'Paylaşım linkini kopyala',
  'cloud.linkCopied': 'Link kopyalandı',
  'cloud.claim': 'Bu devreyi hesabıma bağla',
  'cloud.myCircuits': 'Devrelerim',
  'cloud.loadCircuit': 'Aç',
  'cloud.noCircuits': 'Henüz bulutta devren yok.',
  'cloud.unbind': 'Bulut bağlantısını kaldır (yerel sürüm kalsın)',
  'cloud.errorGeneric': 'Bulut isteği başarısız. API erişilebilir mi kontrol et.',
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
  'welcome.title': 'nandbench\'e hoş geldin',
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
  'welcome.cta.learnSub': '47 ders + 90 terimlik sözlük; tek bitten küçük bir CPU datapath\'e kadar. Nereden başlayacağını seç.',
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
  'lessons.backToEditor': 'Editöre dön',
  'lessons.markDone': 'Tamamlandı olarak işaretle',
  'lessons.markedDone': 'Tamamlandı',
  'lessons.markDoneHint': 'Dersi okuduğunda işaretle; challenge geçildiğinde otomatik işaretlenir.',
  'lessons.markedDoneHint': 'İşareti kaldırmak için tekrar tıkla.',
  'lessons.progressTooltip': '{done} / {total} ders tamamlandı',
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
  'glossary.subtitle': 'Sayısal mantıkta karşılaşacağın her terim — tek bir bitten sonlu durum makinelerine ve zamanlama analizine kadar.',
  'glossary.search': 'Ara…',
  'glossary.empty': 'Eşleşen terim yok.',
  'toolbar.glossary': 'sözlük',
  'toolbar.welcome': 'karşılama ekranını göster',
  'toolbar.glossaryTooltip': 'Sözlüğü aç',

  /* Sözlük kategori başlıkları */
  'glossary.cat.foundations': 'Temeller',
  'glossary.cat.gates': 'Kapılar ve Boole cebri',
  'glossary.cat.combinational': 'Kombinasyonel devreler',
  'glossary.cat.sequential': 'Ardışıl elemanlar',
  'glossary.cat.timing': 'Zamanlama',
  'glossary.cat.memory': 'Yazmaç ve bellek',
  'glossary.cat.fsm': 'Sonlu durum makineleri',
  'glossary.cat.tooling': 'gatecraft iç kavramları',

  /* --- Temeller --- */
  'glossary.term.bit.name': 'Bit',
  'glossary.term.bit.desc':
    'Tek bir ikili sinyal — 0 (düşük) ya da 1 (yüksek). Her sayısal sistemin atomu. gatecraft\'ta 1-bitlik teller ince çizilir; daha geniş buslar genişliğiyle orantılı kalınlıkta görünür.',
  'glossary.term.bus.name': 'Bus',
  'glossary.term.bus.desc':
    'Aynı anda birden çok bit taşıyan tel. Bileşenler portları için genişlik (örn. 4-bit, 8-bit) bildirir; derleyici sürücü ile alıcının uyumlu olmasını şart koşar.',
  'glossary.term.width.name': 'Genişlik',
  'glossary.term.width.desc':
    'Bir telin veya portun taşıdığı bit sayısı. Genişlik uyumsuzlukları derleme-zamanı tanısı tetikler — 4-bit bir bus Splitter olmadan 1-bitlik bir kapıya bağlanamaz.',
  'glossary.term.endian.name': 'Endian (sıralama)',
  'glossary.term.endian.desc':
    'Hangi bitin "ilk" sayılacağına dair konvansiyon. Little-endian 0. biti düşük adrese koyar; big-endian en anlamlı biti başa alır. gatecraft tamamen little-endian.',
  'glossary.term.signed.name': 'İşaretli sayı',
  'glossary.term.signed.desc':
    'En anlamlı biti büyüklük yerine işareti kodlayan ikili değer. Diğer bitler genelde ikinin tümleyeni kullanır, böylece toplama işareti olmayan sayılardakiyle aynı şekilde çalışır.',
  'glossary.term.twosComplement.name': 'İkinin tümleyeni',
  'glossary.term.twosComplement.desc':
    'İşaretli tamsayıların standart gösterimi: her biti tersle ve 1 ekle. Aynı toplayıcı donanımının hem pozitif hem negatif sayıları işlemesini sağlar.',
  'glossary.term.bcd.name': 'BCD (ikili kodlanmış ondalık)',
  'glossary.term.bcd.desc':
    'Her ondalık basamak (0–9) 4 bit ile kodlanır. Saf ikiliye göre yer harcar ama yedi-segment sürücü mantığını çok basit yapar.',
  'glossary.term.gray.name': 'Gray kodu',
  'glossary.term.gray.desc':
    'Ardışık değerlerin tam olarak bir bitte farklılaştığı ikili kodlama. Döner kodlayıcılarda ve asenkron FIFO\'larda geçici glitch\'leri önler.',
  'glossary.term.hex.name': 'Onaltılık',
  'glossary.term.hex.desc':
    '16 tabanlı gösterim (0–9, A–F). 4 bitlik grupları okumanın en pratik yolu — nibble başına bir hex basamağı. Inspector geniş busları varsayılan olarak hex gösterir.',
  'glossary.term.binary.name': 'İkili',
  'glossary.term.binary.desc':
    'İki tabanlı gösterim. Her tel sonunda bir 0/1 dizisine çözülür; "binary" aynı zamanda altta yatan sayı sisteminin kısa adıdır.',
  'glossary.term.overflow.name': 'Taşma',
  'glossary.term.overflow.desc':
    'Bir işlemin sonucunun bit genişliğine sığmaması — örn. 4-bit işaretsiz toplama 1111+0001. Toplayıcılar bir sonraki katmanın yakalayabilmesi için carry-out sunar.',
  'glossary.term.x.name': 'X (bilinmeyen)',
  'glossary.term.x.desc':
    'Simülatörün belirleyemediği bit — sürücüler çakışıyor ya da tanımsız bir giriş kapıya beslenmiş. Belirleyici bir kaynak temizleyene kadar mantıkta yayılır.',
  'glossary.term.z.name': 'Z (yüksek empedans)',
  'glossary.term.z.desc':
    'Hiç sürülmeyen bit. "Kapalı" durumdaki tri-state buffer\'lar ve boşta kalan çıkışlar Z\'dedir. Pull-up/pull-down direnci Z\'yi 1 veya 0\'a çekebilir.',

  /* --- Kapılar ve Boole cebri --- */
  'glossary.term.gate.name': 'Kapı',
  'glossary.term.gate.desc':
    'Boole mantığıyla giriş→çıkış eşleyen ilkel — VE, VEYA, DEĞİL, NAND, NOR, XOR, XNOR, tampon. Tüm kombinasyonel devreler kapılara ayrışır.',
  'glossary.term.inverter.name': 'Çevirici (NOT)',
  'glossary.term.inverter.desc':
    '1-girişli kapı; çıkışı girişinin mantıksal tümleyeni. Ucunda kabarcık olan üçgen olarak çizilir.',
  'glossary.term.buffer.name': 'Buffer (tampon)',
  'glossary.term.buffer.desc':
    'Mantıksal olarak pas-geç (out = in) ama gerçek dünyada yayılım gecikmesi ve sürüş gücü taşır. gatecraft\'ta çoğunlukla fan-out artırma ya da tri-state kapılama için kullanılır.',
  'glossary.term.and.name': 'AND (VE)',
  'glossary.term.and.desc':
    'Çıkış yalnızca tüm girişler 1 olduğunda 1\'dir. Boole: y = a · b. Seri iki AND, 3-girişli AND eder; gatecraft\'in yerleşik kapısı istenen sayıda girişi destekler.',
  'glossary.term.or.name': 'OR (VEYA)',
  'glossary.term.or.desc':
    'Çıkış en az bir giriş 1 iken 1\'dir. Boole: y = a + b. AND ile birleşince çarpımların toplamı formunu kurar.',
  'glossary.term.xor.name': 'XOR (özel veya)',
  'glossary.term.xor.desc':
    'Çıkış, 1 olan giriş sayısı tek olduğunda 1\'dir. "Kontrollü çevirici" gibi davranır ve yarı-toplayıcının toplam bitidir.',
  'glossary.term.nand.name': 'NAND',
  'glossary.term.nand.desc':
    'AND\'in çevricisi. Evrenseldir: yalnız NAND\'lerle her Boole fonksiyonu inşa edilebilir. CMOS\'ta ucuz ve hızlı; tarihi TTL çiplerin çoğu NAND merkezliydi.',
  'glossary.term.nor.name': 'NOR',
  'glossary.term.nor.desc':
    'OR\'un çevricisi. O da evrenseldir. Çapraz bağlı bir NOR çifti klasik SR-mandallıdır.',
  'glossary.term.xnor.name': 'XNOR',
  'glossary.term.xnor.desc':
    'XOR\'un çevricisi — girişler eşitse 1 verir. 1-bitlik eşitlik karşılaştırıcısı bir XNOR\'dur.',
  'glossary.term.universalGate.name': 'Evrensel kapı',
  'glossary.term.universalGate.desc':
    'Yalnız kendi kopyalarıyla her Boole fonksiyonunu üretebilen kapı. NAND ve NOR evrenseldir; AND, OR, NOT tek başlarına değildir.',
  'glossary.term.booleanAlgebra.name': 'Boole cebri',
  'glossary.term.booleanAlgebra.desc':
    'İki-değerli mantığın cebri. AND (·), OR (+), NOT (¯) işlemleri + yasalar (birleşme, dağılma, De Morgan) ifadeleri silikona inmeden sadeleştirmeni sağlar.',
  'glossary.term.demorgan.name': 'De Morgan kuralları',
  'glossary.term.demorgan.desc':
    'NOT(A·B) = NOT(A)+NOT(B) ve NOT(A+B) = NOT(A)·NOT(B). "Kabarcığı taşı" hilesi: AND-OR yapılarını yalnızca NAND ya da yalnızca NOR olan ağlara çevirir.',
  'glossary.term.sop.name': 'Çarpımlar toplamı (SOP)',
  'glossary.term.sop.desc':
    'Standart form: doğruluk tablosundaki her 1 satırı için bir AND terimini OR\'la. 2-seviyeli AND-OR (ya da eşdeğer NAND-NAND) ağına direkt eşlenir.',
  'glossary.term.pos.name': 'Toplamlar çarpımı (POS)',
  'glossary.term.pos.desc':
    'Standart form: doğruluk tablosundaki her 0 satırı için bir OR terimini AND\'le (girişler terslenmiş hâliyle). SOP\'un duali — 0 satırı az olduğunda daha az kapı çıkar.',
  'glossary.term.karnaugh.name': 'Karnaugh haritası (K-map)',
  'glossary.term.karnaugh.desc':
    'Bitişik hücrelerin tek bit farkıyla dizildiği doğruluk tablosu yerleşimi — minterm gruplarını görsel olarak en kısa örtmeye sarmak için. 4–5 değişkene kadar pratiktir.',
  'glossary.term.dontCare.name': 'Önemsiz (don\'t-care)',
  'glossary.term.dontCare.desc':
    'Çıkışın umursanmadığı doğruluk-tablo hücresi — genelde o girişin asla oluşmayacağı için. K-map küçültmesinde X\'i 0 ya da 1 olarak alıp grupları büyütebilirsin.',
  'glossary.term.minterm.name': 'Minterm',
  'glossary.term.minterm.desc':
    'Yalnız bir doğruluk-tablo satırında 1 olan çarpım terimi. SOP, mintermlerin disjonksiyonudur; her minterm bir satırı "isimlendirir."',
  'glossary.term.maxterm.name': 'Maxterm',
  'glossary.term.maxterm.desc':
    'Yalnız bir doğruluk-tablo satırında 0 olan toplam terimi. POS maxtermlerin konjonksiyonudur — minterm bakışının dualidir.',
  'glossary.term.literal.name': 'Literal',
  'glossary.term.literal.desc':
    'Bir değişken ya da tümleyeni (A veya A̅). İki-seviye küçültmede maliyet ölçütü literal sayımıdır.',
  'glossary.term.truthTable.name': 'Doğruluk tablosu',
  'glossary.term.truthTable.desc':
    'Bir mantık parçasının tüm giriş kombinasyonları ve beklenen çıkışları listesi. Challenge modu spec\'in tablo satırlarını tek tek koşarak devreni puanlar.',

  /* --- Kombinasyonel devreler --- */
  'glossary.term.combinational.name': 'Kombinasyonel mantık',
  'glossary.term.combinational.desc':
    'Çıkışı yalnızca mevcut girişlere bağlı, hafızası ve saati olmayan devre. Ardışıl mantığın karşıtıdır. Saf kombinasyonel tasarımların derlemesinde tick durumu yoktur.',
  'glossary.term.halfAdder.name': 'Yarı-toplayıcı',
  'glossary.term.halfAdder.desc':
    'İki giriş (a, b) → toplam (XOR) ve elde (AND). Her toplayıcının başlangıç bloğu; carry-in kabul etmez.',
  'glossary.term.fullAdder.name': 'Tam-toplayıcı',
  'glossary.term.fullAdder.desc':
    'Üç giriş (a, b, cin) → toplam ve carry-out. Lineer dizilerek ripple-carry toplayıcı oluşturur veya carry-lookahead ağlarını besler.',
  'glossary.term.rippleCarry.name': 'Ripple-carry toplayıcı',
  'glossary.term.rippleCarry.desc':
    'N tam-toplayıcının zincirlenmesi; her aşamanın carry-out\'u sonraki aşamanın carry-in\'ini sürer. Basit ama yavaş — gecikme genişlikle lineer büyür.',
  'glossary.term.carryLookahead.name': 'Carry-lookahead toplayıcı',
  'glossary.term.carryLookahead.desc':
    '"Generate" ve "propagate" sinyallerini önceden hesaplayıp her aşamanın carry-in\'ini paralel türetir — daha çok kapı karşılığında alt-lineer gecikme.',
  'glossary.term.subtractor.name': 'Çıkarıcı',
  'glossary.term.subtractor.desc':
    'a − b hesaplar. İkinin tümleyeninde, b\'yi tersleyip carry-in\'i 1\'e bağlayan bir toplayıcıdır — aynı donanım iki işi de yapar.',
  'glossary.term.comparator.name': 'Karşılaştırıcı',
  'glossary.term.comparator.desc':
    'İki değeri kıyaslar; eşit / küçük / büyük raporlar. İçinde XOR zinciri (eşitlik için) ve AND merdiveni (sıralama için) vardır.',
  'glossary.term.mux.name': 'Çoklayıcı (MUX)',
  'glossary.term.mux.desc':
    'log₂(N)-bitlik seçim sinyaline göre N veri girişinden birini seçer. Seçilen giriş çıkışa aktarılır; diğerleri yok sayılır.',
  'glossary.term.demux.name': 'De-çoklayıcı (DEMUX)',
  'glossary.term.demux.desc':
    'Tek veri girişi, seçim sinyaline göre N çıkıştan birine dağıtılır. MUX\'un tersi — yapı olarak veri hattıyla AND\'lenmiş bir decoder.',
  'glossary.term.decoder.name': 'Decoder',
  'glossary.term.decoder.desc':
    'n-bitlik ikili sayıyı one-hot\'a çevirir: 2ⁿ çıkıştan yalnız biri 1\'dir. Bellek adres çözümlemesi ve komut dağıtımı için kullanılır.',
  'glossary.term.encoder.name': 'Encoder',
  'glossary.term.encoder.desc':
    'Decoder\'ın tersi: one-hot girişten ikili indeksi üretir. Saf encoder tam olarak bir girişin yüksek olduğunu varsayar.',
  'glossary.term.priorityEncoder.name': 'Öncelikli encoder',
  'glossary.term.priorityEncoder.desc':
    'Birden çok aktif girişi tolere eden encoder; en yüksek öncelikliyi (genelde en yüksek indeksliyi) seçer. En az bir giriş yüksek iken "valid" bayrağı da verir.',
  'glossary.term.splitter.name': 'Splitter (ayırıcı)',
  'glossary.term.splitter.desc':
    'Geniş busu daha dar alt-buslara böler (örn. 8-bit\'i 4×2-bit) ya da tersini yapar. Saf meta-veri; derleyici onu görünmez kılar.',
  'glossary.term.tunnel.name': 'Tünel',
  'glossary.term.tunnel.desc':
    'Ad ile "sanal tel". Aynı etiketli tüm tüneller elektriksel olarak aynı net\'tir — uzak bağlantılarda kanvası temiz tutar.',
  'glossary.term.triState.name': 'Tri-state buffer',
  'glossary.term.triState.desc':
    'Enable hattı olan buffer. Aktifken çıkışı sürer; pasifken Z (yüksek empedans) verir. Birden çok sürücünün bir busu sırayla paylaşmasına izin verir.',
  'glossary.term.alu.name': 'Aritmetik-mantık birimi (ALU)',
  'glossary.term.alu.desc':
    'İki operand + opcode alır; seçilen aritmetik/mantıksal sonucu + bayraklar (carry, zero, negative, overflow) verir. Her CPU\'nun kombinasyonel kalbi.',

  /* --- Ardışıl elemanlar --- */
  'glossary.term.sequential.name': 'Ardışıl mantık',
  'glossary.term.sequential.desc':
    'Çıkışı yalnız mevcut girişlere değil geçmiş girişlere de bağlı; yani hafızası olan devre. Kombinasyonel ağı mandallı/flip-flop\'tan geçirerek elde edilir.',
  'glossary.term.latch.name': 'Mandallı (latch)',
  'glossary.term.latch.desc':
    'Seviye duyarlı 1-bit bellek hücresi: enable yüksek iken çıkış girişi takip eder; enable düşünce son değer tutulur. Flip-flop\'tan ucuz ama enable yüksek iken şeffaftır.',
  'glossary.term.flipFlop.name': 'Flip-flop',
  'glossary.term.flipFlop.desc':
    'Kenar duyarlı 1-bit bellek hücresi: girişini yalnız saat kenarında örnekler, başka anlarda ardışı görmezden gelir. Senkron tasarımın varsayılan yapı taşı.',
  'glossary.term.dFlipFlop.name': 'D flip-flop',
  'glossary.term.dFlipFlop.desc':
    'Her yükselen saat kenarında q := d. En yaygın flip-flop; yazmaçlar aynı saati paylaşan D-FF dizileridir.',
  'glossary.term.jkFlipFlop.name': 'JK flip-flop',
  'glossary.term.jkFlipFlop.desc':
    '"Evrensel" flip-flop. J=K=0 tut, J=1·K=0 set, J=0·K=1 reset, J=K=1 toggle. D-FF\'ler hücre kütüphanelerinde üstün gelmeden önce çok yaygındı.',
  'glossary.term.tFlipFlop.name': 'T flip-flop',
  'glossary.term.tFlipFlop.desc':
    'Toggle flip-flop: T=1 iken q saat kenarında devrilir; T=0 iken tutar. Ripple sayaçlarının yapı taşı — bir kademenin q\'su bir sonrakini saatler.',
  'glossary.term.srLatch.name': 'SR mandallı',
  'glossary.term.srLatch.desc':
    'Çapraz bağlı iki NOR (ya da NAND). S, q\'yu 1\'e set; R, 0\'a reset eder; S=R=1 yasaktır. En basit bellek hücresi.',
  'glossary.term.edge.name': 'Saat kenarı',
  'glossary.term.edge.desc':
    'Saatin değiştiği an — yükselen (0→1) ya da düşen (1→0). Kenar-tetiklemeli flip-flop\'lar girişlerini yalnız kenarda örnekler.',
  'glossary.term.clock.name': 'Saat (clock)',
  'glossary.term.clock.desc':
    'Ardışıl mantığı yöneten periyodik kare-dalga sinyal. Senkron bir tasarımdaki her flip-flop aynı saatin aynı kenarında örnekler.',
  'glossary.term.enable.name': 'Enable',
  'glossary.term.enable.desc':
    'Flip-flop\'un saat kenarında yeni veriyi yüklemesini gateler. Enable=0 eski değeri tutar; enable=1 yeniyi kilitler.',
  'glossary.term.reset.name': 'Reset',
  'glossary.term.reset.desc':
    'Flip-flop\'un çıkışını 0\'a zorlayan kontrol girişi. Senkron reset saat kenarını bekler; asenkron reset anında etki eder.',
  'glossary.term.preset.name': 'Preset',
  'glossary.term.preset.desc':
    'Reset\'in tümleyeni — çıkışı 1\'e zorlar. Reset ile birlikte, açılışta yazmaçları bilinen değere kurmak için kullanılır.',

  /* --- Zamanlama --- */
  'glossary.term.setupTime.name': 'Kurulum süresi (t_su)',
  'glossary.term.setupTime.desc':
    'Veri girişinin, örneklemenin güvenilir olması için saat kenarından ne kadar önce sabit kalması gerektiği. İhlal flip-flop\'u metastabil bırakabilir.',
  'glossary.term.holdTime.name': 'Tutma süresi (t_h)',
  'glossary.term.holdTime.desc':
    'Veri girişinin saat kenarından sonra ne kadar sabit kalması gerektiği. İhlal yine metastabiliteye ya da yanlış değerin saklanmasına yol açar.',
  'glossary.term.propagationDelay.name': 'Yayılım gecikmesi (t_pd)',
  'glossary.term.propagationDelay.desc':
    'Bir giriş geçişi ile karşılığı olan çıkış geçişi arasındaki süre. İki flip-flop arası en uzun kombinasyonel yol, izin verilen maksimum saat frekansını belirler.',
  'glossary.term.clockSkew.name': 'Saat kayması (clock skew)',
  'glossary.term.clockSkew.desc':
    'Aynı saat kenarının iki farklı flip-flop\'a varış zamanı farkı. Pozitif kayma yola süre ekler; negatif kayma kurulum/tutma ihlali yaratabilir.',
  'glossary.term.metastability.name': 'Metastabilite',
  'glossary.term.metastability.desc':
    'Bir flip-flop\'un kurulum/tutma ihlali sonrası 0 ile 1 arasında sınırsız süre takılı kalması. Asenkron girişlere senkronizör zinciri eklenerek tolere edilir.',
  'glossary.term.glitch.name': 'Glitch',
  'glossary.term.glitch.desc':
    'Genelde iki yolun farklı yayılım gecikmesinden doğan kısa süreli, istenmeyen sinyal sıçraması. Senkron tasarım yalnız saat kenarında örnekleyerek glitch\'leri tolere eder.',
  'glossary.term.hazard.name': 'Hazard',
  'glossary.term.hazard.desc':
    'Belirli giriş geçişlerinde glitch üreten koşul. Static-1 hazard kısaca 0\'a düşer; static-0 hazard kısa süreli 1; dinamik hazard birkaç kez salınır.',
  'glossary.term.oscillation.name': 'Salınım',
  'glossary.term.oscillation.desc':
    'Hiç oturmayan kombinasyonel geri besleme — engine\'in settle döngüsü tavanı aşar ve tanı verir. Yazmaç ile döngüyü kır veya mantığı yeniden düşün.',

  /* --- Yazmaç ve bellek --- */
  'glossary.term.register.name': 'Yazmaç',
  'glossary.term.register.desc':
    'Aynı saati paylaşan N flip-flop\'tan oluşan N-bit bellek hücresi. Bir sonraki etkin saat kenarına kadar değerini tutar.',
  'glossary.term.shiftRegister.name': 'Shift yazmacı',
  'glossary.term.shiftRegister.desc':
    'Her aşamanın çıkışı bir sonrakinin girişine bağlı flip-flop dizisi. Seri-paralel dönüşüm, gecikme hatları ve LFSR (sözde-rastgele dizi üreteci) gibi yerlerde kullanılır.',
  'glossary.term.counter.name': 'Sayaç',
  'glossary.term.counter.desc':
    'Her saat kenarında değerini artıran (ya da azaltan) yazmaç — toplayıcıyla beslenmiş bir yazmaç ya da T flip-flop zinciriyle (ripple) inşa edilir.',
  'glossary.term.ram.name': 'RAM (rastgele erişimli bellek)',
  'glossary.term.ram.desc':
    'N-bit adres busuyla erişilen okuma/yazma bellek dizisi. Senkron RAM adres + veri + write-enable\'ı saat kenarında örnekler; asenkron RAM sürekli yanıtlar.',
  'glossary.term.rom.name': 'ROM (salt-okunur bellek)',
  'glossary.term.rom.desc':
    'İçeriği tasarım zamanında sabitlenen bellek dizisi. Adres busunu sür, saklı veriyi oku — bakış tabloları ve microcode için ideal.',
  'glossary.term.addressDecode.name': 'Adres çözümleme',
  'glossary.term.addressDecode.desc':
    'Paylaşılan bir busta hangi bellek ya da çevre biriminin erişildiğini, adresin üst bitlerine bakarak seçen mantık.',
  'glossary.term.readWriteEnable.name': 'Okuma / yazma enable',
  'glossary.term.readWriteEnable.desc':
    'Belleğin kontrol hatları: read-enable veri çıkışını açar, write-enable saat kenarında veri girişini kilitler. Bir çevrim içinde genellikle birbirini dışlar.',

  /* --- Sonlu durum makineleri --- */
  'glossary.term.fsm.name': 'Sonlu durum makinesi (FSM)',
  'glossary.term.fsm.desc':
    'Sınırlı sayıda adlandırılmış durumu, durumlar arası geçiş kurallarını ve duruma (ve çoğu zaman girişe) bağlı çıkışları olan devre. Bir durum yazmacı + kombinasyonel sonraki-durum + çıkış mantığı olarak gerçeklenir.',
  'glossary.term.moore.name': 'Moore makinesi',
  'glossary.term.moore.desc':
    'Çıkışı yalnız mevcut duruma bağlı FSM. Girişe biraz daha geç tepki verir ama saatle hizalı, glitch\'siz çıkış üretir.',
  'glossary.term.mealy.name': 'Mealy makinesi',
  'glossary.term.mealy.desc':
    'Çıkışı hem duruma hem güncel girişe bağlı FSM. Moore\'dan bir saat çevrimi önde tepki verir ama çıkışlar saat kenarları arasında glitch\'leyebilir.',
  'glossary.term.stateTransition.name': 'Durum geçişi',
  'glossary.term.stateTransition.desc':
    'FSM\'i bir durumdan başka bir duruma, saat kenarında ve giriş koşullarıyla kayan kural. Tüm geçiş kümesi FSM\'in sözleşmesidir.',
  'glossary.term.stateDiagram.name': 'Durum diyagramı',
  'glossary.term.stateDiagram.desc':
    'FSM\'in grafiği — düğümler durumlar, kenarlar etiketli geçişlerdir. Ardışıl mantık tasarlarken uygulamadan önce çizilen standart çıktı.',

  /* --- gatecraft iç kavramları --- */
  'glossary.term.driver.name': 'Sürücü',
  'glossary.term.driver.desc':
    'Bir bileşenin çıkış portu net\'e değer iter. Bir net\'in 0, 1 ya da çok sürücüsü olabilir; çoğu uyuşmazsa tanı tetiklenir.',
  'glossary.term.sink.name': 'Alıcı',
  'glossary.term.sink.desc':
    'Bağlı olduğu net\'in değerini okuyan bileşen giriş portu. Bir net istenen sayıda alıcıyı maliyetsiz besleyebilir — fan-out simülatörde bedavadır.',
  'glossary.term.net.name': 'Net',
  'glossary.term.net.desc':
    'Kablo ile birbirine bağlı, elektriksel olarak aynı olan port kümesi. Her simülasyon adımında bir sinyale çözülür.',
  'glossary.term.netlist.name': 'Netlist',
  'glossary.term.netlist.desc':
    'Devrenin derlenmiş gösterimi — bileşenler, portlar ve net\'ler — simülatörün koştuğu yapı. Union-Find derleyici her düzenlemede yeniden kurar.',
  'glossary.term.snapshot.name': 'Anlık görüntü (snapshot)',
  'glossary.term.snapshot.desc':
    'Simülatörün her settle/tick\'te ürettiği, her net\'in mevcut değerinin salt-okunur görünümü. Renderer 60fps\'te en güncel snapshot\'tan çizer.',
  'glossary.term.diagnostic.name': 'Tanı',
  'glossary.term.diagnostic.desc':
    'Derleyici veya simülatörün ürettiği uyarı — genişlik-uyumsuz, çoklu-sürücü, salınım, boşta-giriş. "Canlı debug"u öldürücü özellik kılan şey.',
  'glossary.term.multiDriver.name': 'Çoklu-sürücü çakışması',
  'glossary.term.multiDriver.desc':
    'İki ya da daha çok sürücü aynı net\'e zıt değer iter. Simülatör X olarak çözer ve hemen tanı verir, çakışmayı anında görürsün.',
  'glossary.term.fanout.name': 'Fan-out',
  'glossary.term.fanout.desc':
    'Tek bir sürücünün beslediği alıcı sayısı. Inspector\'da port satırının yanındaki sayı budur. Gerçek silikonda fan-out bütçesi vardır; simülatörde yoktur.',
  'glossary.term.composite.name': 'Bileşik (Composite)',
  'glossary.term.composite.desc':
    'Tek blok olarak yeniden kullanılan kaydedilmiş devre. Bir kez kur, dilediğin yere bırak; engine derlerken düzleştirir, simülatör hiyerarşiyi görmez.',

  /* Ders figür altyazıları */
  'fig.bits.cap': 'Her sütun bir bit; ağırlığı 2ⁿ. 1 olan sütunları topla.',
  'fig.numberSystems.cap': 'Aynı değer, üç farklı gösterim: 2, 10, 16.',
  'fig.twosComplement.cap': 'İşaretleme: bütün bitleri tersle, sonra 1 ekle.',
  'fig.booleanAlgebra.cap': 'İfadeleri silikona inmeden sadeleştirmeni sağlayan özdeşlikler.',
  'fig.demorgan.cap': 'Kabarcıklar kapıların içinden "geçer"; AND, OR olur (ve tersi).',
  'fig.gates.cap': 'Her sayısal fonksiyon nihayetinde 1- ve 2-girişli kapılara ayrışır.',
  'fig.universalGates.cap': 'Tek başına NAND yeterli — her mantık fonksiyonunu yalnızca NAND ile kurabilirsin.',
  'fig.truthTable.cap': 'Tüm giriş kombinasyonları ve beklenen çıkışların tam sayımı.',
  'fig.sopPos.cap': 'SOP 1 satırlarını seçer, POS 0 satırlarını. Aynı devreye iki yol.',
  'fig.karnaugh.cap': 'Komşu hücreler tek bit farklı — 1\'leri grupla, minimal kapsayışı oku.',
  'fig.halfAdder.cap': 'Toplam XOR, elde AND — en ucuz 2-girişli toplayıcı.',
  'fig.fullAdder.cap': 'İki yarı-toplayıcı + carry\'lerde OR — carry-in\'i kabul eder.',
  'fig.rippleAdder.cap': 'Elde soldan sağa "akar"; gecikme bit sayısıyla lineer büyür.',
  'fig.subtractor.cap': 'b\'yi tersle, carry-in\'i 1 yap — toplayıcı artık a − b hesaplar.',
  'fig.comparator.cap': 'XOR\'lar eşitliği bit-bit kontrol eder; AND merdiveni sıralamayı çözer.',
  'fig.decoder.cap': 'n ikili giriş → 2ⁿ çıkıştan tam olarak biri yüksek.',
  'fig.encoder.cap': 'One-hot giriş, ikili indeks çıkış — decoder\'ın tersi.',
  'fig.mux.cap': 'sel veri girişlerinden birini seçer; diğerleri yok sayılır.',
  'fig.demux.cap': 'Tek giriş, sel\'e göre N çıkıştan birine yönlendirilir.',
  'fig.triState.cap': 'en=0 iken çıkış kopar (Z). Birden çok sürücünün tek busu paylaşmasını sağlar.',
  'fig.srLatch.cap': 'Çapraz bağlı NOR\'lar bir biti saklar. S set, R reset, S=R=1 yasak.',
  'fig.dLatch.cap': 'Enable yüksek iken Q, D\'yi takip eder; enable düşünce son değer tutulur.',
  'fig.dFlipFlop.cap': 'Her yükselen saat kenarında q := d — başka anlarda d\'yi yoksayar.',
  'fig.jkFlipFlop.cap': 'J/K kombinasyonu tutma, set, reset ve toggle\'ı tek elemanda kapsar.',
  'fig.tFlipFlop.cap': 'T=1 devirir, T=0 tutar — ripple sayaçlarının yapı taşı.',
  'fig.clock.cap': 'Kare dalga ardışıl mantığı yönetir; flip-flop\'lar yükselen kenarda örnekler.',
  'fig.timing.cap': 'Kenardan önce kurulum, sonra tutma penceresi — ihlal metastabilite riskidir.',
  'fig.register.cap': 'Aynı saati paylaşan N D flip-flop\'tan oluşan N-bit bellek.',
  'fig.shiftRegister.cap': 'Her aşama bir sonrakini besler; saat başına bir bit içeri kayar.',
  'fig.counter.cap': 'Yazmaç + toplayıcı, kendisine geri besler: her saat kenarında artar.',
  'fig.modNCounter.cap': 'Sayaç N\'e ulaştığında bir karşılaştırıcı resetler — periyodik 0…N−1 sayımı.',
  'fig.ringCounter.cap': 'Bir one-hot örüntü N flip-flop\'un etrafında her saat kenarında döner.',
  'fig.rom.cap': 'Adres içeri, sabit veri dışarı — donanıma basılmış bir bakış tablosu.',
  'fig.ram.cap': 'Rastgele erişimli oku/yaz belleği. WE saat kenarında yazmayı etkinleştirir.',
  'fig.addressDecode.cap': 'Üst bitler hangi yongayı seçer; alt bitler yonganın içindeki hücreyi.',
  'fig.fsmIntro.cap': 'Düğümler durumlar, kenarlar saat kenarında alınan geçişler.',
  'fig.fsmDesign.cap': 'Önce durum grafiğini çiz — durum ve çıkış denklemlerini sonra çıkar.',
  'fig.alu.cap': 'İki operand + opcode → sonuç ve bayraklar (carry, zero, negative, overflow).',
  'fig.registerFile.cap': 'İki oku portu + bir yaz portu; adresler hangi yazmacın okunacağını seçer.',
  'fig.datapath.cap': 'Yazmaçlar → ALU → writeback, hepsi saatli. Kontrol birimi kalan okları doldurur.',
  'fig.controlUnit.cap': 'Opcode içeri, onlarca küçük kontrol biti dışarı — CPU\'nun beyni.',
  'fig.hazards.cap': 'Yukarıda kalması gereken sinyalde anlık çukur — klasik static-1 hazard.',
  'fig.pipeline.cap': 'Beş aşama örtüşür: biri writeback yaparken dört tanesi havadadır.',
  'fig.tooling.cap': 'gatecraft\'ın kendisi: model + renderer ana thread\'de, engine Web Worker\'da.',

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
    'Sol kenardaki Dersler butonu 47 ders ve 90 terimlik sözlüğü açar. Turu istediğin zaman toolbar overflow menüsünden tekrar başlatabilirsin.',
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
