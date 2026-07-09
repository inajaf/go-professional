/* =====================================================================
   DEEP-DIVE LESSONS + WORKED EXAMPLES - AZERBAIJANI
   Mirrors lessons.js. Merged onto window.COURSE_AZ; any module not yet
   present here falls back to the English lesson/example (see mergeCourse
   in app.js), so this fills in incrementally without breaking the page.
   ===================================================================== */
window.COURSE_AZ = window.COURSE_AZ || {};
window.COURSE_AZ.LESSONS = {
  "f1": [
    {
      "h": "Go-da niyə ümumiyyətlə zibil yığıcısı var",
      "p": "C və ya C++ kimi dillərdə yaddaşı özünüz ayırırsınız və onu `free`/`delete` ilə geri qaytarmaq da sizin öhdəliyinizdir. Səhv etsəniz, üç klassik bugla üzləşirsiniz: *use-after-free* (artıq qaytarılmış yaddaşa toxunmaq), *double-free* (eyni bloku iki dəfə qaytarmaq) və ya *leak* - sızma (heç vaxt qaytarmamaq). Bu buglar çöküşlərin və təhlükəsizlik dəliklərinin böyük mənbəyidir. Go isə şüurlu bir mübadilə edir: yaddaşı sizin əvəzinizə avtomatik idarə edir, ona görə demək olar ki, heç vaxt `free` yazmırsınız - əvəzində arxa fonda işləyən yığıcıya bir az CPU vaxtı sərf olunur. Aylarla işləyən server proqramları üçün bu mübadilə demək olar ki, həmişə dəyər."
    },
    {
      "h": "GC-nin daim verdiyi tək sual",
      "p": "Yığıcının bütün işi bir suala cavab verməkdir: *proqram hansı obyektlərə hələ də çata bilir?* O, kök (root) dəstindən başlayır - hər goroutine-in stack-i və paket səviyyəli (qlobal) dəyişənlər - və pointer-ləri izləyir. Çata bildiyi hər şey canlıdır və saxlanılır; çata bilmədiyi hər şey zibildir və onun yaddaşı geri qaytarılır.\n\nBu tək fikir Go-da ən çox rast gəlinən yaddaş sızmasını izah edir: 'işi bitmiş' obyektlərə pointer saxlayan uzunömürlü map və ya slice. Bu konteyner çatılan olduğu müddətcə, onun işarə etdiyi hər şey də çatılan olur, ona görə GC onu heç vaxt azad edə bilmir. Düzəliş free çağırmaq deyil - istinadı buraxmaqdır (map-dəki elementi silmək, yenidən slice etmək, nil-ə bərabərləmək)."
    },
    {
      "h": "Konkurrent yığma Go-nun niyə axıcı hiss olunmasının səbəbidir",
      "p": "Erkən zibil yığıcıları 'dünyanı dayandırırdı' (stop-the-world): bütün thread-ləri dondurur, bütün yaddaşı gəzir, sonra davam edirdilər. Böyük heap-də bu yüzlərlə millisaniyəlik fasilələr demək idi - aşağı gecikmə tələb edən API üçün ölümcül. Go-nun yığıcısı isə goroutine-lərinizlə yanaşı *konkurrent* işləyir. Yenə də iki stop-the-world anı var (mark fazasının əvvəlində və sonunda), amma onlar çox kiçikdir - adətən bir millisaniyədən xeyli azdır. Go-nun gecikməyə həssas şəbəkə servisləri üçün güclü seçim olmasının səbəbi budur."
    },
    {
      "h": "Pacer: GC saata görə deyil, böyüməyə görə işləyir",
      "p": "Tez-tez rast gəlinən yanlış fikir GC-nin taymerlə işləməsidir. Əslində belə deyil. Hər yığmadan sonra runtime nə qədər yaddaşın canlı olduğunu qeyd edir və hədəf qoyur: heap `GOGC` faiz qədər böyüdükdə növbəti sikli işə sal. Standart `GOGC=100` dəyəri 'canlı heap ikiqat artanda yenidən yığ' deməkdir. *Pacer* konkurrent mark mərhələsini elə planlaşdırmağa çalışan nəzarətçidir ki, o, heap məhz həmin hədəfə çatanda bitsin - nə çox erkən (boşuna CPU sərfi), nə də çox gec (heap-in hədəfi aşması)."
    },
    {
      "h": "İki tənzimləyici və onlara nə vaxt toxunmalı",
      "p": "Proqramların doxsan faizinin heç vaxt GC-ni tənzimləməyə ehtiyacı olmur. Ehtiyac olanda isə iki dəstək var. `GOGC` yaddaşı CPU-ya dəyişir: onu artırsanız (məsələn 200, 400) - boş RAM-ı olan və daha az yığma istəyən batch/throughput tapşırıqları üçün - heap böyüyür, amma GC daha az tez-tez işləyir. `GOMEMLIMIT` isə ümumi yaddaşa yumşaq tavan qoyur - konteynerlərdə vacibdir, çünki limitə yaxınlaşdıqca GC-ni daha sərt işləməyə məcbur edir, əvəzinə nüvənin (kernel) prosesi OOM ilə öldürməsinə imkan vermir. Anti-pattern-lər: `GOGC`-ni çox aşağı qoymaq (CPU sıçrayışları) və hot path-də `runtime.GC()`-ni əl ilə çağırmaq."
    },
    {
      "h": "Ən ucuz yığma - qaçdığınız allokasiyadır",
      "p": "Performans üçün praktik mental model belədir: GC-nin CPU xərci təxminən nə qədər allokasiya etdiyinizlə mütənasibdir. Ona görə ən böyük qazanclar demək olar ki, heç vaxt yığıcını tənzimləməkdən yox, daha az allokasiya etməkdən gəlir. Bufferləri təkrar istifadə edin (qısaömürlülər üçün `sync.Pool`), məna kəsb etdiyi yerdə pointer əvəzinə dəyər (value) tiplərə üstünlük verin, slice və map-ləri tutum (capacity) ipucu ilə əvvəlcədən ayırın və sıx dövrlərin içində dəyərləri təsadüfən interfeys-lərə 'box' etməkdən çəkinin. Optimallaşdırmadan əvvəl allokasiyaların əslində haradan gəldiyini tapmaq üçün heap profilinin `alloc_space` görünüşündən istifadə edin."
    },
    {
      "h": "Bunu necə izləmək olar",
      "p": "Təxmin etməyə ehtiyac yoxdur. `GODEBUG=gctrace=1 ./app` hər sikl üçün fasilə vaxtları və heap ölçüləri ilə bir sətir çap edir. `runtime.ReadMemStats` və strukturlaşdırılmış `runtime/metrics` paketi dashboard-lar üçün canlı rəqəmlər verir. Heap profili isə (Modul F2) məhz hansı çağırış nöqtələrinin allokasiya etdiyini göstərir. Əvvəlcə ölçün, sonra ümumiyyətlə tənzimləməyə dəyib-dəymədiyinə qərar verin."
    }
  ],
  "f2": [
    {
      "h": "Niyə optimallaşdırmazdan əvvəl ölçmək lazımdır",
      "p": "Proqramçının performans haqqında intuisiyası tarixən yanlış çıxır. 'Yavaş olduğunu bildiyiniz' funksiya çox vaxt ucuz olur, real xərc isə darıxdırıcı bir yerdə gizlənir - logger, JSON marshal, milyon dəfə işləyən dövr içindəki lazımsız allokasiya. Ölçmədən optimallaşdırmaq o deməkdir ki, siz heç vaxt darboğaz olmamış kodu sürətləndirməyə bir gün sərf edirsiniz. Profiler təxminçiliyi aradan qaldırır: sizə məlumatlarla vaxtın və yaddaşın əslində haraya getdiyini deyir."
    },
    {
      "h": "Sampling profiler-lər necə işləyir",
      "p": "Go-nun CPU profiler-i hər funksiya çağırışını instrument etmir (bu yavaş olar və nəticəni təhrif edər). Əvəzinə o *sample* götürür: saniyədə təxminən 100 dəfə proqramı kəsir və hazırkı çağırış stack-ini qeyd edir. 30 saniyə işə salsanız, təxminən 3000 stack görüntünüz olur. Sample-ların 40%-də görünən funksiya statistik olaraq CPU-nun ~40%-ini istifadə edib. Daha çox sample = daha çox əminlik, ona görə də təmsiledici bir iş yükünü mənalı müddət ərzində profilə edirsiniz."
    },
    {
      "h": "Sualınıza cavab verən profili seçin",
      "p": "Fərqli profillər fərqli suallara cavab verir və səhv birini istifadə etmək vaxt itkisidir. 'Nə taktları yandırır' sualı üçün *CPU* profilindən istifadə edin. Yaddaş üçün *heap* profilindən istifadə edin - və onun iki görünüşünü bilin: `inuse_space` (hazırda saxlanılan, sızma/şişkinliyi tapmaq üçün) və `alloc_space` (indiyə qədər allokasiya edilmiş hər şey, GC təzyiqini tapmaq üçün). Sızmaları və ilişib qalmış goroutine-ləri tapmaq üçün *goroutine* profilindən istifadə edin. Goroutine-lərin bir-birini gözlədiyi ziddiyyəti (contention) tapmaq üçün *block* və *mutex* profillərindən istifadə edin."
    },
    {
      "h": "Toplamağın iki yolu, oxumağın bir aləti",
      "p": "Toplamağın iki yolu var. İşləyən bir servis üçün `net/http/pprof`-u blank-import edin, o özü `/debug/pprof/*` endpoint-lərini qeydə alır - yenidən deploy etmədən canlı profil çəkə bilirsiniz (onu yalnız admin girişli porta bağlayın). Konkret bir funksiya üçün isə `go test`-ə benchmark altında `-cpuprofile`/`-memprofile` ilə profilləri fayla yazdırın. Hər iki halda nəticəni eyni alətlə oxuyursunuz - `go tool pprof`."
    },
    {
      "h": "Flame graph-ı aldanmadan oxumaq",
      "p": "Flame graph vaxtın haraya getdiyini görməyin ən sürətli yoludur, amma onu səhv oxumaq asandır. Hər qutu bir funksiyadır; bir qutunun digərinin *üstündə* oturması onun həmin funksiya tərəfindən çağırıldığı deməkdir. Vacib xüsusiyyət ENDir: o, vaxtla (və ya allokasiyalarla) mütənasibdir. Ona görə *ən enli* qutuları, xüsusən yuxarıdakı enli yarpaqları optimallaşdırırsınız. Hündür, nazik qüllə demək olar ki, heç nəyə başa gəlməyən dərin bir çağırış zəncirini göstərir - ona məhəl qoymayın. Yeni başlayanlar çox vaxt hündürlüyün, ekspertlər isə enin dalınca gedir."
    },
    {
      "h": "Təkrarlanan bir iş axını",
      "p": "Bunları istənilən gün işə sala biləcəyiniz bir dövrəyə birləşdirin: (1) yavaş yolu benchmark və ya yük testi altında təkrarlayın; (2) CPU profili toplayın; (3) flame graph-ı `go tool pprof -http=:8080` ilə açın; (4) ən enli yarpağı tapın və mənbəyini `list` ilə oxuyun; (5) bir dəyişiklik edin; (6) həqiqətən kömək etdiyini təsdiqləmək üçün yenidən profil çıxarın. Profil düz (flat) olanda dayanın - artıq dalınca gedəcək tək bir hotspot qalmayıb."
    }
  ],
  "f3": [
    {
      "h": "Test etmək dilin bir hissəsidir, kitabxana yox",
      "p": "Bir çox dil test etməni makroslarla və sehrlə dolu üçüncü tərəf framework-ü ilə əlavə edir. Go isə onu birbaşa toolchain-in içinə qurur. Testləri, sınadıqları kodun yanında `_test.go` ilə bitən fayllara qoyursunuz, `TestXxx(t *testing.T)` adlı funksiyalar yazırsınız və `go test` işə salırsınız. Öyrənməli framework, annotasiya, ayrıca runner yoxdur. Bu az mərasim (ceremony) qəsdəndir: testləri yazmaq nə qədər asandırsa, bir o qədər çox test yazılır."
    },
    {
      "h": "Table-driven test: Go-nun fərqləndirici üslubu",
      "p": "İdiomatik Go testi *table-driven*-dir (cədvəl əsaslı). Hər hal üçün test gövdəsini copy-paste etmək əvəzinə, halları struct-ların slice-ında toplayır və üzərində dövr edərək, hər birini `t.Run` ilə işə salırsınız - beləcə o adlandırılmış subtest-ə çevrilir. Yeni bir hal əlavə etmək bir sətirlik işdir. Bir hal uğursuz olanda çıxış tam olaraq hansının olduğunu adlandırır. Bu pattern üç haldan üç yüz hala qədər genişlənə bilir, test oxunmaz hala düşmədən, və sizi girişlər və gözlənilən çıxışlar baxımından düşünməyə sövq edir."
    },
    {
      "h": "Uğursuzluqları debug edilə bilən edin",
      "p": "Yaxşı bir test uğursuzluğu debugger açmadan nəyin səhv getdiyini deyir. Həmişə həm got, həm də want-i çap edin: `t.Errorf(\"Add(2,3) = %d, want %d\", got, want)`. Uğursuzluğu qeyd edib davam etmək üçün `t.Errorf`-dan istifadə edin (beləcə bütün uğursuz halları görürsünüz), davam etmək mənasız olanda isə (məsələn, setup addımı uğursuz olub) `t.Fatalf`-dan istifadə edin. Helper funksiyaları `t.Helper()` ilə işarələyin ki, uğursuzluq helper-in dərinliyinə deyil, onu çağıran test sətrinə işarə etsin."
    },
    {
      "h": "Mocking framework-siz mock etmək",
      "p": "Go-nun test edilə bilənlik üçün gizli silahı interface-dir. Konkret bir tipdən (real verilənlər bazası, real saat, real şəbəkə) asılı olmaq əvəzinə kodunuzu kiçik bir interface-dən asılı edin, testlərdə isə onu ödəyən kiçik saxta (fake) struct ötürün. Nə mocking kitabxanası, nə kod generasiyası - sadəcə lazım olan metodları olan bir struct. Bu testləri sürətli və deterministik saxlayır, üstəlik dizaynınızı zəif bağlılığa (loose coupling) doğru sıxışdırır."
    },
    {
      "h": "Coverage və fuzzing: pulsuz təhlükəsizlik şəbəkələri",
      "p": "İki daxili alət əllə yazılmış halların gözdən qaçırdığını tutur. *Coverage* (`go test -cover`, sonra `go tool cover -html`) testlərinizin əslində hansı sətirləri işə saldığını göstərir - test edilməmiş xəta budağını aşkarlamaq üçün əladır. *Fuzzing* (`func FuzzXxx(f *testing.F)`) avtomatik olaraq təsadüfi girişlər yaradır və çöküşə səbəb olan və ya assertion-u pozan hər hansı girişi saxlayır; onu etibarsız girişi parse edən istənilən şeyə yönləndirin və heç vaxt ağlınıza gəlməyəcək edge case-ləri tapmasına imkan verin."
    },
    {
      "h": "Gündəlik komanda",
      "p": "Bir komandanı yadda saxlayın: `go test -race -cover ./...`. `-race` race detector-u aktivləşdirir, o da data race-ləri (iki goroutine-in sinxronizasiya olmadan eyni yaddaşa toxunması) tutur - konkurrent dildə testin ən dəyərli xüsusiyyəti. `-cover` isə nəyin test edildiyi barədə sizi dürüst saxlayır. Onu hər commit-dən əvvəl işə salın və CI-a bağlayın."
    }
  ],
  "f4": [
    {
      "h": "Concurrency struktur haqqındadır, sürət haqqında yox",
      "p": "Tez-tez rast gəlinən qarışıqlıq: concurrency parallelism ilə eyni şey deyil. Parallelism eyni anda bir neçə CPU nüvəsində iş görməkdir. Concurrency isə proqramı bacardıqda irəliləyə bilən müstəqil fəaliyyətlər kimi *strukturlaşdırmaqdır* - çoxlu bağlantını idarə etmək, bir neçə timeout-u gözləmək, mərhələləri pipeline etmək. Go-nun goroutine-ləri və kanalları bu struktur üçün alətlərdir; runtime isə sonra onu əlinizdə olan istənilən sayda nüvəyə xəritələyir. Siz concurrency-ni dizayn edirsiniz; parallelism-i isə runtime həll edir."
    },
    {
      "h": "Goroutine-lər ucuzdur, amma pulsuz deyil",
      "p": "Bir goroutine təxminən 2 KB-lıq stack ilə başlayır və tələbata görə böyüyür, ona görə minlərlə goroutine işə salmaq normaldır, milyon işə salmaq isə mümkündür. Amma 'işə salmaq ucuzdur' - 'unutmaq pulsuzdur' demək deyil. İşə saldığınız hər goroutine-in nə vaxt dayanmalı olduğunu bilən bir sahibi olmalıdır. Heç kimin heç vaxt göndərmə etmədiyi bir kanalda əbədi bloklanan goroutine *leak*-dir (sızmadır): o öz stack-ini və istinad etdiyi hər şeyi saxlayır, GC isə onu heç vaxt geri qaytara bilmir. Qayda: heç vaxt necə bitəcəyini bilmədən goroutine işə salmayın."
    },
    {
      "h": "Kanallar: sinxronlaşdır ya da ayır",
      "p": "Kanal tipləndirilmiş bir borudur, buferlənməsi isə onun mənasını dəyişir. *Buffersiz* kanal bir rendezvous-dur (görüş nöqtəsi): göndərən alıcı hazır olana qədər bloklanır, beləcə həm dəyəri ötürür, həm də iki goroutine-i məhz həmin anda sinxronlaşdırır. *Buferli* kanal (tutumu N) göndərənə bloklanmazdan əvvəl N dəyərə qədər irəli getməyə imkan verir - o, istehsalçı ilə istehlakçının sürətlərini ayırır. Buferli və ya buffersiz seçimi - əl sıxma (handshake) ilə növbə (queue) arasında seçimdir."
    },
    {
      "h": "Panic-lərin qarşısını alan sahiblik qaydaları",
      "p": "İki sadə sahiblik qaydası kanal buglarının əksəriyyətini aradan qaldırır. Birincisi, kanalı *göndərən* bağlayır - heç vaxt alıcı yox - və məhz bir dəfə bağlayır; iki dəfə bağlamaq, və ya bağlı kanala göndərmə etmək panic verir. Bağlamaq 'daha dəyər yoxdur' siqnalı verir, bu da `for v := range ch` dövrünün təmiz bitməsinə imkan yaradır. İkincisi, goroutine-lər arasında ötürülməyən paylaşılan dəyişkən vəziyyət üçün kanal əvəzinə `sync.Mutex` və ya `sync/atomic`-ə əl atın. Şüar 'ünsiyyət qurmaqla yaddaşı paylaşın'dır, amma sayğac ətrafında mutex daha sadə və düzgündür - doğru aləti seçin."
    },
    {
      "h": "select, context və təmiz söndürmə",
      "p": "`select` bir goroutine-ə eyni anda bir neçə kanal əməliyyatını gözləməyə imkan verir - nəticələr kanalını `ctx.Done()` kanalı və `time.After` timeout-u ilə birləşdirin, hazır olan birinci qazanır. Ləğvetmə (cancellation) və timeout-ları belə qurursunuz. Goroutine ağacına dayanmağı bildirmənin standart yolu `context.Context`-dir: onu aşağı ötürün, hər goroutine `ctx.Done()` üzərində `select` etsin, tək bir `cancel()` (və ya timeout) isə bütün ağacı açıb-bağlasın. Context-siz uzun müddət işləyən goroutine baş verməyi gözləyən bir sızmadır."
    },
    {
      "h": "Worker pool: iş atı pattern",
      "p": "Daim əl atacağınız pattern worker pool-dur. *Fan-out*: hamısı bir `jobs` kanalından oxuyan sabit sayda N worker goroutine işə salın, beləcə iş onlar arasında yayılır və concurrency N ilə məhdudlaşır (bu da aşağı axın sistemlərini həddindən artıq yüklənmədən qoruyur). *Fan-in*: hər worker bir ortaq `results` kanalına yazır, çıxışlarını tək bir kollektor üçün birləşdirir. İş qalmayanda `jobs`-u bağlayın, worker-lər isə boşalıb çıxsın. Məhdud, sadə, və real Go concurrency-nin əksəriyyətinin əsası."
    }
  ],
  "f5": [
    {
      "h": "Xətalar dəyərdir və bu kod yazma tərzinizi dəyişir",
      "p": "Go-da exception yoxdur. Uğursuz ola bilən funksiya son nəticə kimi `error` qaytarır, siz də onu dərhal `if err != nil` ilə emal edirsiniz. Try/catch-dən gəldikdə bu çərənli görünür, amma əslində bu bir xüsusiyyətdir: hər uğursuzluq yolu baş verdiyi yerdə, sırayla, stack boyu görünməz sıçrayışlar olmadan görünür. Tutulmamış exception-ın səssizcə stack-i açması kimi təsadüfən bir xətanı gözardı edə bilməzsiniz - kompilyator və `errcheck` linter-ləri emal edilməmiş xətaları gözə çarpdırır."
    },
    {
      "h": "Yuxarı qalxarkən sarın, sərhəddə yoxlayın",
      "p": "Xəta çağırış stack-i boyu yuxarı qalxarkən əsl səbəbi itirmədən kontekst (biz nə edirdik?) əlavə etmək istəyirsiniz. Bu, sarmadır (wrapping): `fmt.Errorf(\"charge account %s: %w\", id, err)`. `%w` verb-i açardır - sarılmış xətanı çatılan saxlayır, ona görə çağıran tərəf onu yenə də yoxlaya bilir. Yuxarıda (məsələn, HTTP handler-də) *açırsınız* (unwrap): `errors.Is(err, ErrNotFound)` zəncirin istənilən yerində məlum bir sentinel-i yoxlayır, `errors.As(err, &target)` isə sahələrini oxumaq üçün konkret bir xəta tipini çıxarır. Aşağıda sarın, yuxarıda yoxlayın."
    },
    {
      "h": "Xəta tiplərinizi dizayn etmək",
      "p": "Üç alət demək olar ki, hər şeyi əhatə edir. *Sentinel xətalar* (`var ErrNotFound = errors.New(\"not found\")`) - çağıranların `errors.Is` ilə budaqlandığı əvvəlcədən müəyyən edilmiş dəyərlərdir. *Sarılmış xətalar* `%w` ilə kontekst əlavə edir. *Özəl xəta tipləri* strukturlaşdırılmış məlumat daşıyır - `Error() string`-i tətbiq edin və `errors.Is/As` ilə yaxşı işləsinlər deyə `Unwrap() error` əlavə edin. Yaxşı bir qayda: çağıranların hərəkət etdiyi şərtlər üçün sentinel qaytarın, qalan hər şeyi isə tək bir log sətrindən debug etməyə kifayət edəcək kontekstlə sarın."
    },
    {
      "h": "Context: yayılan ləğvetmə və deadline-lar",
      "p": "`context.Context` bölüşdürülmüş sistemlər problemini həll edir: müştəri bağlantını kəsəndə və ya request timeout olanda, həmin request üzərində işləyən hər goroutine və aşağı axın çağırışı dayanmalıdır ki, heç kimin istəmədiyi nəticəyə CPU və bağlantı boşa xərclənməsin. Timeout və ya cancel funksiyası ilə törəmə context yaradırsınız, onu toxunduğu hər şeyə *birinci arqument* kimi ötürürsünüz və həmişə `defer cancel()` edirsiniz. Valideynin ləğvi bütün övladlarını da ləğv edir. Ən böyük günahlar: context-i struct sahəsində saxlamaq (request-əsaslı yaşam müddətini pozur) və `context.WithValue`-nu ümumi arqument çantası kimi istifadə etmək (o, trace ID kimi request-əsaslı metadata üçündür, parametrlər üçün yox)."
    },
    {
      "h": "Layihə strukturu: miqyaslanan struktur",
      "p": "Go layihələri ehtiyac olmayana qədər sadə (flat) qalır. İki konvensiya əsas işi görür. `cmd/<app>/main.go` yeganə işi bağlantı qurmaq olan giriş nöqtələrini saxlayır - konfiqi parse etmək, asılılıqları qurmaq, serveri işə salmaq. `internal/` isə yalnız *sizin modulunuzun* import edə biləcəyi paketləri saxlayır - kompilyator tərəfindən təmin olunan real bir sərhəd, başqa komandaların (və ya gələcəkdəki sizin) daxili detallardan asılı olmasının qarşısını alır. Paketləri təmin etdikləri imkana görə adlandırın (`ledger`, `postgres`), arxitektura qatına görə yox (`models`, `utils`); `utils` adlı paket kohesiyanın öldüyü yerdir."
    }
  ],
  "m19": [
    {
      "h": "Niyə müsahibələr işdə heç kimin tətbiq etmədiyi strukturları soruşur",
      "p": "Ehtimal ki, production-da heç vaxt öz əlinizlə hashmap yazmayacaqsınız - Go-nun `map`-i onsuz da orada. Müsahibələr yenə də soruşur, çünki bu strukturlar performans söhbətlərinin ortaq lüğətidir: 'bu O(n²)-dir, set istifadə et', 'bura heap lazımdır, dövr içində sort yox', 'BFS, çünki bizə ən yaxını lazımdır'. Bir strukturu hissələrindən yenidən qura bilən namizəd, eyni zamanda onun xərcini də proqnozlaşdıra bilir - xərci proqnozlaşdırmaq isə əsl işdir. Bu modul əksər screening-lərdə rast gəlinən dəsti əhatə edir: slice və map (çünki rezümenizdə Go yazılıb), heap-lər, ağac gəzintiləri, qraflar - və LRU keşi, ən çox tapşırılan dizayn tapşırığı."
    },
    {
      "h": "Slice header: beş müsahibə sualını izah edən üç söz",
      "p": "Bir şəkli mənimsəyin: slice arxa massivə işarə edən `{pointer, len, cap}`-dır. Hər şey bundan çıxır. Slice ötürmək niyə ucuzdur? Elementləri yox, üç sözü kopyalayırsınız. Funksiya niyə slice-ımın elementlərini dəyişə bilir? Kopya eyni massivə işarə edir. İki slice-ım append-dən sonra niyə ayrıldı? Böyümə onlardan biri üçün YENİ massiv ayırdı - digəri isə hələ də köhnəsinə işarə edir. `make([]T, 0, n)` ilə niyə əvvəlcədən ayırmalı? Çünki böyümə indiyə qədər olan hər şeyin kopyasıdır, əvvəlcədən məlum olan n isə sıfır kopya deməkdir. Bu şəkli müsahibədə səsli deyin - əlavə suallar özləri cavablanacaq."
    },
    {
      "h": "Map-in içində: bucket-lər, tophash, tədrici böyümə",
      "p": "Go-nun map-i bucket-lərdən ibarət hash cədvəlidir, hər bucket səkkizə qədər key/value cütü saxlayır. Açarın hash-i bölünür: AŞAĞI bitlər bucket-i seçir (cədvəl ölçüsünün ikinin qüvvəti olmasının səbəbi budur - aşağı bitləri seçmək maskadır, bölmə yox), YUXARI səkkiz bit isə bir baytlıq `tophash` möhürləri kimi saxlanılır. Axtarış real bir açara toxunmazdan əvvəl səkkiz tophash baytını - tək bir cache line-ı - skan edir, ona görə uyğunsuzluqların əksəriyyəti demək olar ki, pulsuzdur. Yük əmsalı (load factor) ~6.5-i keçdikdə cədvəl ikiqat artır, elementlər isə toxunuldıqca *tədricən* yeni bucket-lərinə köçür, xərci dünyanı dondurmaq əvəzinə yayır. İki production səviyyəli nəticə: iterasiya sırası təsadüfidir (heç vaxt ona güvənməyin), konkurrent yazmalar isə keçib gedə biləcəyiniz data race deyil, ölümcül xətadır (mutex və ya sync.Map istifadə edin)."
    },
    {
      "h": "Heap-lər: slice-də yaşayan ağac",
      "p": "Binary heap yalnız bir vədi saxlayır: hər valideyn öz uşaqlarından ≤-dir (min-heap). Bu zəif sıralama minimumu həmişə bilmək üçün tam kifayətdir - o, 0 indeksindədir - eyni zamanda saxlamaq ucuz qalır. Zəriflik saxlanmada gizlidir: tam bir ağaca pointer lazım deyil, çünki indeks riyaziyyatının ÖZÜ strukturdur (`i-nin uşaqları: 2i+1, 2i+2; valideyni: (i-1)/2`). Push slice-a əlavə edib yuxarı süzür (sift up); Pop son elementi kökə yerləşdirib aşağı süzür (sift down); hər ikisi hündürlüyü log n olan bir yolu gəzir. Müsahibələr 'k ən böyük', 'top N', 'k sıralanmış axını birləşdir' və ya 'prioritetə görə emal et' eşidəndə heap-lərə əl atır - dəfələrlə ekstremum elementi lazım olan, amma tam sort heç vaxt lazım olmayan hər yerdə."
    },
    {
      "h": "BFS və DFS: bir alqoritm, iki konteyner",
      "p": "Kodu kənara qoysanız, iki gəzinti eyni dövrdür: konteynerdən bir node çıxar, ziyarət edilmiş kimi işarələ, ziyarət edilməmiş qonşularını içəri qoy. Hər şeyə konteyner qərar verir. Növbə (FIFO) breadth-first verir: node-lar aşkar edildiyi sıra ilə emal olunur, axtarış dalğa kimi, səviyyə-səviyyə genişlənir - hədəfə ilk toxunduğunuz an isə oraya ən az kənarlı yolla çatmısınız deməkdir. Stack (LIFO, çox vaxt rekursiya vasitəsilə çağırış stack-i) depth-first verir: bir budaq boyu dibə qədər dal, geri qayıt, təkrarla - 'yol varmı', tsikl (cycle) aşkarlanması, və alt ağacın öz qardaşlarından əvvəl bitməli olduğu hər yer (topoloji sıralama) üçün təbii formadır. Ziyarət edilmişlər çoxluğu (visited set) bir optimallaşdırma deyil - o olmadan qrafdakı ilk tsikl sonsuz dövrə çevrilir."
    },
    {
      "h": "LRU keşi: bu sualın niyə heç vaxt ölmədiyi",
      "p": "'O(1) Get və Put ilə sabit ölçülü, ən az son zamanlarda istifadə edilən elementi çıxaran bir keş dizayn et' sualı yaşamağa davam edir, çünki o, əzbərçiliyi yox, kompozisiyanı yoxlayır. Bir struktur O(1) axtarış verir (map), digəri isə O(1) yenidən sıralama və çıxarma verir (ikitərəfli bağlı siyahı); heç biri tək başına kifayət etmir, hiylə isə map-in pointer-ləri siyahının İÇİNƏ saxlaması, onları qaynaqlamasıdır. Hər əməliyyat bir ovuc pointer hərəkətidir: toxunmaq = unlink + push-front; çıxarmaq = quyruğu unlink etmək. Praktik nümunə onu əllə yazılmış bir siyahı ilə qurur - müsahibə aparanlar məhz pointer cərrahlığını bacarıb-bacarmadığınızı görmək üçün `container/list`-i qadağan edirlər. Sentinel head/tail node-ları peşəkar hərəkətdir: onlarla 'boş siyahı' və 'tək node' xüsusi hal olmaqdan çıxır."
    }
  ],
  "m1": [
    {
      "h": "Router əslində nə edir",
      "p": "Hər HTTP server hər sorğu üçün bir sualı cavablandırmalıdır: bu metod və path üçün hansı funksiya işləməlidir? Bu uyğunlaşdırmaya routing deyilir. İllərlə Go developer-ləri üçüncü tərəf router-lərinə (gin, chi, echo) müraciət edirdi, çünki standart `http.ServeMux` yalnız path prefikslərini uyğunlaşdıra bilirdi - metod uyğunlaşdırması yox, path dəyişənləri yox. Go 1.22-dən bəri bu boşluq bağlanıb: standart mux `GET /api/v1/ledger/{id}` pattern-lərini birbaşa uyğunlaşdırır, ona görə əksər servislər asılılığı və onunla gələn dolayı yolu silə bilər."
    },
    {
      "h": "Mux necə uyğunlaşdırır: radix trie",
      "p": "Daxildə mux marşrutları *radix trie*-də saxlayır - hər node-un path seqmenti olduğu, ona görə paylaşılan prefikslərin node-ları paylaşdığı ağac. Sorğunun uyğunlaşdırılması ağacı seqment-seqment gəzir, bu sürətlidir və çoxlu marşrutlara miqyaslanır. Praktikada iki qayda vacibdir. Metod və path birlikdə uyğunlaşdırılır, ona görə `GET /x` və `POST /x` fərqli marşrutlardır. Və üstünlük *ən-spesifik-qazanır*dır: `/ledger/{id}/audit` `/ledger/{id}`-ni üstələyir, literal seqment wildcard-ı üstələyir - ona görə marşrutları diqqətli sırada qeydiyyatdan keçirmək lazım deyil."
    },
    {
      "h": "Path dəyişənləri və regexp router-lərin sonu",
      "p": "Pattern-də `{id}` seqmenti wildcard-dır; handler-də onu `r.PathValue(\"id\")` ilə oxuyursunuz. Nə müntəzəm ifadələr, nə router-özəl `Context`, nə allocation-ağır uyğunlaşdırma obyektləri. Path uyğun gəldikdə, amma metod yox, mux avtomatik olaraq düzgün `Allow` başlığı ilə `405 Method Not Allowed` cavab verir - əvvəllər kitabxanadan aldığınız davranış, indi daxili."
    },
    {
      "h": "os.Root: path traversal-ı ehtimalsız yox, mümkünsüz etmək",
      "p": "Server istifadəçi girişinə əsaslanaraq fayl oxuduğu hər an - konfiqurasiya adı, yükləmə açarı, şablon - *path traversal* riski daşıyır: hücumçu nəzərdə tutulan qovluqdan qaçmaq üçün `../../etc/passwd` (ya da hiyləgər simlink) göndərir. Köhnə müdafiə `..`-i rədd edən sətir yoxlamaları idi, amma hücumçular encoding və linklərdə tükənməz yaradıcıdır, ona görə yoxlama uduzan oyundur. `os.Root` (Go 1.24) bunu çevirir: bir qovluğu bir dəfə açırsınız, o handle vasitəsilə hər əməliyyat syscall səviyyəsində fiziki olaraq ona məhdudlaşdırılır. Qaçış cəhdi xəta qaytarır. Siz *yoxlamağı* dayandırıb pis şeyi *mümkünsüz* etməyə başlayırsınız."
    },
    {
      "h": "Bu ledger-ə necə uyğun gəlir",
      "p": "Kapstonda bu modul ön qapını qurur: tranzaksiyaları qəbul edən ictimai REST gateway, sıfır üçüncü-tərəf marşrutlaşdırma import-u ilə, və `os.Root` altında həbs edilmiş konfiqurasiya/saxlama yükləyicisi. Bu bünövrəni asılılıqsız və traversal-a-toxunulmaz etmək sonrakı hər modulda özünü doğruldur - təhlükəsizləşdirmək, audit etmək və yeniləmək üçün daha az hərəkət edən hissə."
    }
  ],
  "m2": [
    {
      "h": "Serializasiya server-lərin gözlənilməz vaxt xərclədiyi yerdir",
      "p": "Şəbəkə servisi daim iki şey edir: teldən gələn bayt-ları Go dəyərlərinə çevirmək, sonra Go dəyərlərini yenidən bayt-lara çevirmək. Bu serializasiyadır, yüksək buraxılışda tez-tez CPU profilində üst sətirdir. Defolt `encoding/json` heyrətamiz dərəcədə rahatdır - istənilən tipi idarə etmək üçün reflection istifadə edir - amma reflection-un hər çağırışda ödənilən dəyəri var. Milyonlarla payload göndərən ledger üçün bu dəyər iki server ilə iyirmi server arasındakı fərqdir."
    },
    {
      "h": "json/v2 və streaming token-lər",
      "p": "`encoding/json/v2` asan yüksək-səviyyəli API-ni saxlayır, amma daha sürətli və xeyli daha konfiqurasiya edilə bilər, üstəlik aşağı-səviyyəli streaming qat, `jsontext`, JSON-u bir dəfəyə bir token buraxır və ya qəbul edir. Streaming vacibdir, çünki bütün sənədi (ya da aralıq `map[string]any`-i) yaddaşda qurmaqdan qaçır - token-ləri birbaşa bağlantıya yazır, birbaşa oradan oxuyursunuz. Böyük ya da yüksək-həcmli payload-lar üçün bu həm sürətli, həm zibil yığıcısına dramatik dərəcədə yüngüldür."
    },
    {
      "h": "Yaddaş geometriyası: niyə düzülüş performansdır",
      "p": "Müasir CPU-lar hesab deyil, yaddaş darboğazlıdır. L1 keşdə olan bayt-ı gətirmək ~1 nanosaniyədir; əsas yaddaşdan gətirmək ~100× yavaşdır. Beləliklə performans əsasən *cache locality*-dir - növbəti lazım olan datanı bir-birinə yaxın saxlamaq. Bu, modulun qalanının prizmasıdır: Swiss-Table map-lar lookup başına bir cache line-a toxunmaqla qazanır, stack allocation isə qısa-ömürlü datanı heap-dən tamamilə kənarda saxlamaqla qazanır."
    },
    {
      "h": "Swiss Table-lar: eyni map, sakitcə yenidən qurulub",
      "p": "Go 1.24 daxili `map`-i heç bir API dəyişikliyi olmadan *Swiss Table* kimi yenidən qurdu. Köhnə map toqquşmalarda bucket-overflow pointer-lərini izləyərək yaddaş boyunca səpələnirdi. Swiss Table yazıları 8-lik qruplarda, hər slot üçün yığcam bir-baytlıq tag ilə saxlayır; lookup qrupa hash edir, onun 8 control bayt-ını (bir cache line) yükləyir, hamısını SIMD-tərzi instruksiyalarla paralel müqayisə edir, adətən tək yaddaş girişi ilə cavab tapır. Siz heç nə dəyişmədiniz, map-lərinizsə sürətlənib yüngülləşib."
    },
    {
      "h": "Stack vs heap, və niyə diqqət etməlisiniz",
      "p": "Hər dəyər ya goroutine-in stack-ində (ucuz: funksiya qayıtdıqda avtomatik azad olunur, sıfır GC iştirakı), ya da heap-də (GC tərəfindən idarə olunur) yaşayır. Kompilyator qərar vermək üçün *escape analysis* işlədir: əgər dəyərin funksiyadan kənara çıxmadığını sübut edə bilirsə, o stack-də qalır. Heç vaxt qaçmayan keçici encode buffer GC-yə heç nə başa gəlmir. Qərarları `go build -gcflags='-m'` ilə görə və 'does not escape' axtara bilərsiniz - hot path tənzimlərkən praktik vərdiş."
    }
  ],
  "m5": [
    {
      "h": "Verilənlər bazası korrektliyin çətinləşdiyi yerdir",
      "p": "Stateless tətbiq kodu haqqında düşünmək asandır; paralel yazıçıları olan verilənlər bazasını işə qatan an, konsistensiya haqqında əsrlik çətinliklə qazanılmış ideaları miras alırsınız. Maliyyə ledger-i üçün risklər ən yüksəkdir - pul heç vaxt yarış ilə yaradılmamalı ya da məhv edilməməlidir. Bu modul o persistensiya qatını Go-da hər ikisini - paralellik altında düzgün, yük altında sürətli - qurmaqdır."
    },
    {
      "h": "sqlc: SQL xətalarını kompilyasiya zamanına köçürün",
      "p": "Xam SQL sətirlərindən (sürətli, amma səhv yazılmış sütun runtime-da partladır) ağır ORM-ə (rahat, amma sorğuları gizlədir və runtime-da reflect edir) qədər bir spektr var. `sqlc` şirin nöqtədə oturur: siz əsl SQL yazırsınız, o isə sorğularınızdan plus sxemdən tip-təhlükəsiz Go funksiyaları yaradır. Səhv sütun adı ya da arqument tipi indi kod-yaratma zamanı uğursuz olur, istehsalatda saat 3-də yox. SQL üzərində tam nəzarəti saxlayır, kompilyasiya-zamanı təhlükəsizlik qazanırsınız - ORM sehri yoxdur."
    },
    {
      "h": "Bağlantı hovuzları opsional deyil",
      "p": "Postgres bağlantısı açmaq bahalıdır, verilənlər bazası eyni anda yalnız müəyyən sayda idarə edə bilər, ona görə heç vaxt sorğu-başına bir açmırsınız - hovuz paylaşırsınız. `pgxpool` real konfiqurasiya tələb edir: verilənlər bazasının idarə edə biləcəyinə ölçülmüş `MaxConns` (daha çox yaxşı deyil - hər bağlantı serverə yaddaş başa gəlir), yük balanslaşdırıcıları və failover-lar ətrafında yenidən dövriyyə üçün `MaxConnLifetime`, və müştəri əlaqəni kəsdikdə uçuşdakı sorğunun heç kim üçün davam etmək əvəzinə serverdə ləğv edildiyi context-bilikli sorğular."
    },
    {
      "h": "Sətir-səviyyəli kilidlər və double-entry invariantı",
      "p": "Ledger-in ürəyi *double-entry*dir: hər köçürmə bir hesabı debit, digərini eyni məbləğdə credit edir, ona görə cəm heç vaxt dəyişmir. Paralellik altında, eyni hesaba toxunan iki köçürmə yarışa girə bilər. Həll *sətir-səviyyəli kilid*dir: `SELECT ... FOR UPDATE` yalnız dəyişdirdiyiniz sətirləri (bütün cədvəli yox) kilidləyir, ona görə eyni hesaba toxunan ikinci tranzaksiya birincinin commit etməsini gözləyir. İncə, amma kritik qayda: bir neçə sətri həmişə sabit sırada kilidləyin, yoxsa eyni cütü əks sıralarda kilidləyən iki tranzaksiya deadlock-a düşəcək."
    },
    {
      "h": "Konflikt gözləyin, və yenidən cəhd edin",
      "p": "Serializable izolyasiya altında verilənlər bazası yarışı uduzan tranzaksiyanı *rədd* edə bilər, SQLSTATE `40001` (serialization_failure) qaytararaq. Bu bağ deyil - verilənlər bazası invariantınızı qoruyur - düzgün cavab bütün tranzaksiyanı yenidən cəhd etməkdir. Go 1.26-nın `errors.AsType[*pgconn.PgError]`-i dəqiq SQLSTATE-i təmiz uyğunlaşdırmağa və budaqlanmağa imkan verir: `40001`-i yenidən cəhd et, `23505`-i (unique_violation) dublikat kimi göstər, və s. Yenidən-cəhd edilə bilən uğursuzluqlar üçün dizayn etmək ledger-i həm düzgün, həm rəqabət altında əlçatan edən şeydir."
    }
  ],
  "m17": [
    {
      "h": "Postgres korrektlik mühərrikidir",
      "p": "Tətbiq kodunun bir an üçün səhv olmasına icazə verilir; istehsalat datası yox. Maliyyə ledger-i yalnız Go handler-lərinin hər qaydanı xatırlamasına güvənməməlidir. Postgres domenin bir hissəsini birbaşa tətbiq edə bilər: `CHECK (amount_cents > 0)`, foreign key-lər, unikal idempotensiya açarları və tranzaksional outbox yazıları. Bu constraint-lər bürokratiya deyil. Onlar pis deploy, dublikat sorğu, ya da yenidən-cəhd fırtınası verilənlər bazasına çatanda son müdafiə xəttidir."
    },
    {
      "h": "Constraint-lər tətbiq-yalnız vədlərdən üstündür",
      "p": "Əgər invariant lokal və zamansızdırsa, onu sxemdə saxlayın. Hesab balansı mənfi ola bilməz; köçürmə məbləği sıfır ola bilməz; idempotensiya açarı fərqli köçürmə üçün təkrar istifadə oluna bilməz. Go kodu yenə də yaxşı xətalar üçün erkən doğrulayır, amma son cavabı verilənlər bazası verir. Ümumi qayda: korlanmış data sonradan əl ilə təmizlənməyə məcbur edirsə, qaydanı datanın yazıldığı yerdə kodlaşdırın."
    },
    {
      "h": "İndekslər sorğu formalarına əməl edir",
      "p": "İstehsalat indeksi 'sütun üzərində indeks' deyil. O, sorğu forması ilə müqavilədir: əvvəl bərabərlik filtrləri, sonra aralıq/sıralama sütunları, sonra heap fetch-lərindən qaçmağa imkan verən opsional daxil edilən sütunlar. `WHERE account_id = $1 ORDER BY posted_at DESC LIMIT 50` üçün forma `(account_id, posted_at DESC)`-dir. Üç tək-sütunlu indeks nadir hallarda təsəvvür etdiyiniz plana çevrilir. Planlayıcının yolu istifadə etdiyini sübut etmək və sorğunun hələ də IO yandırıb-yandırmadığını görmək üçün `EXPLAIN (ANALYZE, BUFFERS)` istifadə edin."
    },
    {
      "h": "Miqrasiyalar istehsalat hadisələridir",
      "p": "Sxem dəyişikliyi ən böyük cədvəlinizə ən pis vaxtda işləyən koddur. Təhlükəsiz miqrasiyalar expand/backfill/contract istifadə edir: əvvəl nullable ya da uyğun struktur əlavə edin, hər iki forması oxuya bilən kod deploy edin, məhdud batch-lərdə backfill edin, sonra köhnə binary-lər getdikdən sonra sərt constraint-ləri tətbiq edin. Hot cədvəllərdə, `CREATE INDEX CONCURRENTLY`-i üstün tutun və göndərmədən əvvəl kilid davranışını test edin. Staging-də ani olan miqrasiya real datada yenə də kilid insidenti ola bilər."
    },
    {
      "h": "Kilidlər və izolyasiya dizaynın bir hissəsidir",
      "p": "Read Committed praktik defoltdur, hər biznes invariantının təhlükəsiz olduğunun sübutu deyil. Çox-sətirli invariantlar açıq strategiya tələb edir: sabit sırada sətir kilidləri, yarışlar üçün unikal constraint-lər, ya da bütün-tranzaksiya yenidən-cəhdləri ilə SERIALIZABLE. Deadlock-lar təsadüfi pis şans deyil; adətən eyni kilidləri fərqli sıralarda götürən iki kod yoludur. Sıranı bir dəfə dizayn edin və hər yolun ona əməl etməsini təmin edin."
    },
    {
      "h": "Vacuum arxa-plan sehri deyil",
      "p": "Postgres MVCC oxuyucuların yazıçılar davam edərkən sabit snapshot görə bilməsi üçün köhnə sətir versiyalarını saxlayır. Vacuum sonradan ölü versiyaları geri qaytarır, amma uzun tranzaksiya köhnə snapshot-ları sanca və təmizlənməni dayandıra bilər. Normal yeniləmələr beləcə bloat-a, daha böyük indekslərə, yavaş skanlara və nəhayət təcili baxım işlərinə çevrilir. Uzun tranzaksiyaları, ölü tuple-ları, autovacuum fəaliyyətini, yavaş planları və bağlantı sayını birinci-dərəcəli istehsalat siqnalları kimi izləyin."
    }
  ],
  "m13": [
    {
      "h": "Niyə 'mənim maşınımda işlədi' konkurentliyi yalandır",
      "p": "*Data race* - ən azı biri yazma olmaqla, aralarında sinxronizasiya olmadan eyni yaddaşa eyni anda müraciət edən iki goroutine-dir. Başlayanlar ən pis halın 'bir az səhv rəqəm' olduğunu güman edir. Əslində daha pisdir: race *qeyri-müəyyən davranışdır*. Kompilyator və CPU yaddaş əməliyyatlarını yenidən sıralaya və keşləyə bilər (M11 modulu), ona görə yarışlı proqram mümkünsüz görünən nəticələr verə bilər, çökə bilər, ya da aylarla işləyirmiş kimi görünüb sonra istehsalatda fərqli zamanlamada uğursuz ola bilər. Burada 'əsasən yaxşıdır' yoxdur - yarışlı kod hələ uğursuz *olmamış* sınmış koddur. Go bu bağların gözə görünməz olduğu üçün məhz race detektoru (`-race`) göndərir."
    },
    {
      "h": "Happens-before: paylaşmağı təhlükəsiz edən müqavilə",
      "p": "Go *memory model*i bir goroutine-in yazısının digərinin oxusuna nə vaxt görünəcəyini *happens-before* münasibəti vasitəsilə müəyyən edir. Hər sinxronizasiya primitivinin məqsədi belə bir kənar yaratmaqdır: kanal göndərməsi müvafiq qəbuldan əvvəl baş verir; mutex `Unlock`-u növbəti `Lock`-dan əvvəl baş verir; atomic saxlama onu müşahidə edən atomic yükləmədən əvvəl baş verir. İki goroutine arasında bu kənarlardan biri olmadan, heç biri o birinin yazılarını görəcəyinə *heç bir zəmanət yoxdur*, nöqtə. Ona görə primitiv seçmək stil məsələsi deyil - proqramınızın korrektliyini əslində müəyyən edən sıralamanı qurmaqdır."
    },
    {
      "h": "Atomiklər: yüngül çəki, kəskin limitlə",
      "p": "Atomic əməliyyat (`atomic.Int64.Add`, `CompareAndSwap`, `atomic.Pointer[T].Store`) *bir maşın sözünü* bölünməz şəkildə oxuyan-dəyişən-yazan tək hardware instruksiyasıdır - kilid yoxdur, bloklama yoxdur, heç bir goroutine gözləmir. Onlar ən sürətli alətdir və sayğaclar, bayraqlar, tək dəyərin hot-swap edilməsi üçün mükəmməldir. Gücü eyni zamanda limitidir: atomiklər dəqiq *bir sözü* qoruyur. İnvariantınız iki əlaqəli dəyişənə - balans və onun tranzaksiya jurnalı, map və onun uzunluğu - yayıldığı an, heç bir tək-söz atomic ardıcıllığı cütü paralellik altında uyğun saxlaya bilməz. Məhz bu sərhəddə mutex-ə keçməlisiniz."
    },
    {
      "h": "Mutex-lər: dəyişəni yox, invariantı qorumaq",
      "p": "`sync.Mutex` *kritik seksiyanı* qoruyur: bir goroutine kilidi tutarkən heç biri girə bilməz, ona görə daxildəki çox-addımlı yeniləmə digərləri tərəfindən tək bölünməz dəyişiklik kimi görünür. Bu, bir neçə sahəni qarşılıqlı uyğun saxlamağa imkan verir - atomiklərin edə bilmədiyi şey. `sync.RWMutex` bunu oxu-üstün data üçün təkmilləşdirir, çoxlu paralel oxuyucuya ya da bir yazıçıya icazə verir. İntizam kiçik, amma sərtdir: panik kilidi tutulu qoymasın deyə hər `Lock`-u `defer Unlock` ilə cütləyin; seksiyanı qısa saxlayın və daxildə heç vaxt IO etməyin ya da kanalda bloklamayın; mutex daxil olan dəyəri heç vaxt kopyalamayın. Real Go-da paylaşılan dəyişkən vəziyyətin çoxu mutex-i və bir neçə sahəsi olan struct-dır - darıxdırıcı, düzgün, kifayət qədər sürətli."
    },
    {
      "h": "Kanallar: problemi elə dizayn edin ki, kilidləyəcək heç nə qalmasın",
      "p": "Kanallar fərqli səviyyədə işləyir: *mülkiyyəti* ötürürlər. 'Yaddaşı paylaşaraq ünsiyyət qurmayın; ünsiyyət qurmaqla yaddaşı paylaşın' şüarı belə deməkdir: iki goroutine-in paylaşılan dəyəri kilidləməsi əvəzinə, dəyəri kanal vasitəsilə ötürün ki, hər hansı anda yalnız bir goroutine ona sahib olsun - paylaşılan vəziyyət, onu kilidləmə ehtiyacı ilə birgə, sadəcə yox olur. Kanallar pipeline-lar, fan-out/fan-in worker hovuzları, tamamlanmanı ya da ləğvi siqnallaşdırmaq (çoxlu gözləyiciyə yayım üçün kanalı bağlamaq), backpressure tətbiq etmək (dolu buferli kanal həddindən artıq sürətli istehsalçını bloklayır) üçün doğru alətdir. Əməliyyat başına mutex-dən baha başa gəlirlər, ona görə əks-nümunə onları sayğac ətrafında mürəkkəb kilid kimi istifadə etməkdir."
    },
    {
      "h": "Yaxşı seçim: problemin forması qərar verir",
      "p": "Aləti modaya deyil, datanın strukturuna uyğunlaşdırın. Əgər tək sayğac, bayraq, ya da atomic dəyişdirdiyiniz pointerdirsə - *atomic* istifadə edin. Əgər bir neçə sahə birlikdə dəyişməlidirsə, ya da oxu-üstün paylaşılan vəziyyətdirsə - *mutex* (ya da RWMutex) istifadə edin. Əgər goroutine-lər arasında data ötürürsünüzsə, pipeline qurursunuzsa, siqnallaşdırırsınızsa, ya da backpressure tətbiq edirsinizsə - *kanal* istifadə edin. Birdən çoxu işləyəndə, ən sadə düzgün olanı seçin: iki sahə ətrafında mutex hiyləgər kanal rəqsindən daha aydındır; atomic sayğac o *yalnız* sayğac olduqda mutex-dən yaxşıdır. Nə seçsəniz seçin, testləri `-race` ilə işlədin - detektor heç vaxt yorulmayan yeganə rəyçidir."
    }
  ],
  "m4": [
    {
      "h": "Niyə paralel testlər flaky olur",
      "p": "Test *flaky* olur, nə vaxt ki, qeyri-deterministik keçib-uğursuz olur - lokalda yaşıl, CI-də qırmızı, yenidən işlədəndə yaşıl. Paralel kodda adi günahkar zamanlamadır: test goroutine başladır, sonra o vaxta qədər bitəcəyini umaraq `time.Sleep(100 * time.Millisecond)` edir. Yüklü CI maşınında 100ms kifayət etmir, ona görə uğursuz olur; 500ms-ə qaldırsanız suite sürünür. Sinxronlaşdırmaq üçün yatmaq təxmindir, təxmin isə testləri flaky edən şeydir."
    },
    {
      "h": "synctest: saxta saatlı qabarcıq",
      "p": "`testing/synctest` (Go 1.25-də stabil) təxmini aradan qaldırır. Goroutine-lərinizi virtual saatı olan *qabarcıq* daxilində işlədir. Qabarcıq daxilində, `time.Sleep`, timer-lər və ticker-lər simulyasiya edilir: qabarcıqdakı hər goroutine bloklandıqda, saxta saat növbəti planlaşdırılmış timer-ə ani sıçrayır. `time.Sleep(5 * time.Second)` real vaxtın mikrosaniyələrində qayıdır, amma kod beş saniyə keçdiyinə inanır - ona görə zaman-asılı məntiq sıfır real gözləmə və sıfır flakiness ilə deterministik test edilir."
    },
    {
      "h": "synctest.Wait: sabitləşmiş dünyada təsdiqləmə",
      "p": "Saxta saatın yoldaşı `synctest.Wait`-dır, qabarcıqdakı hər *digər* goroutine davamlı bloklanana qədər bloklayır - yəni sistem sabit vəziyyətə çatıb və xarici giriş olmadan başqa heç nə baş verməyəcək. Bu, 'yat və uman ki, planlaşdırıldı'-nı dəqiq baryerlə əvəz edir: durğunluğu gözləyin, sonra təsdiqləyin. Bonus olaraq, əgər qabarcıqda hər şey heç bir timer atəş etmədən davamlı bloklanıbsa, bu deadlock-dır, synctest testi tam timeout-u gözləmədən dərhal uğursuz edir."
    },
    {
      "h": "Güvəniləcək benchmark-lar: b.Loop()",
      "p": "Korrektliyin əks üzü ölçmədir, benchmark-ların da öz ayaq tələsi var. Klassik `for i := 0; i < b.N; i++` döngüsünü zərif şəkildə səhv etmək asandır: kompilyator nəticəsini görməzdən gəldiyiniz işi silə bilər (dead-code elimination), kodun əslindən sürətli görünməsinə səbəb olur. Go 1.24-ün `for b.Loop()`-u bunu düzəldir - benchmark edilən dəyərləri avtomatik canlı saxlayır və setup-u bir dəfə işlədir, əl mühasibatlığı olmadan sabit, dürüst rəqəmlər verir."
    },
    {
      "h": "İntizam olaraq determinizm",
      "p": "Daha dərin dərs budur: *determinizm dizayn məqsədidir*, təsadüf deyil. Divar-saatı zamanından, real şəbəkə gecikməsindən, ya da goroutine planlaşdırma sırasından asılı olan testlər sonda flake edəcək. synctest zamanı virtuallaşdırır; interfeys-lər (F3 modulu) saatı və şəbəkəni virtuallaşdırır; race detektoru qalanını tutur. Tam deterministik suite - deploy-ları qapıya qoymaq üçün əslində güvənə biləcəyiniz suite-dir, testlərin bütün mənası budur."
    }
  ],
  "m3": [
    {
      "h": "Həyat dövrləri: obyekt öləndə iş görmək",
      "p": "Əksər hallarda GC-nin yaddaşı səssizcə geri qaytarması dəqiq istədiyiniz şeydir. Amma bəzən obyekt GC-nin anlamadığı bir resursa sahib olur - OS fayl deskriptoru, C handle-i, kilid - və bu resurs obyekt yox olanda azad edilməlidir. Köhnə alət, `runtime.SetFinalizer`, məşhur şəkildə etibarsız idi: o, finalizasiya zamanı obyekti *diriltə* bilirdi, qeyri-müəyyən ardıcıllıqla işləyirdi və yığılmanı əlavə bir GC dövrü qədər gecikdirirdi. Həll etdiyindən daha çox bug yaradırdı."
    },
    {
      "h": "runtime.AddCleanup, doğru yol",
      "p": "Go 1.24-ün `runtime.AddCleanup`-ı finalizer-ləri proqnozlaşdırıla bilən bir şeylə əvəz edir: obyekt həqiqətən əlçatmaz olduqdan sonra, dirilmə olmadan, tam bir dəfə işə düşən bir cleanup. Kritik intizam odur ki, cleanup nəyi *capture* edir. Əgər cleanup closure-u təmizlədiyi obyekti capture edirsə, obyekt əbədi əlçatan qalır - məhz qarşısını almağa çalışdığınız sızma. Yalnız primitiv resurs handle-ini (fd, bir int) dəyər kimi capture edin, heç vaxt valideyn struct-ı yox. Cleanup-ları əsas bağlama yolu deyil, ehtiyat mexanizmi kimi düşünün; mümkün olduqda açıq `Close()` / `defer` hələ də daha yaxşıdır."
    },
    {
      "h": "Interning: milyon sətir beş sətri bölüşəndə",
      "p": "Milyonlarla hesabı olan bir ledger hər birində valyuta kodunu saxlayır - amma cəmi bir ovuc fərqli valyuta var. 'USD'-ni milyon dəfə saxlamaq meqabaytları hədər edir. *Interning* `unique` paketi vasitəsilə bərabər dəyərləri bir paylaşılan nüsxəyə kanonikləşdirir: `unique.Make(\"USD\")` 8 bayt olan, bir paylaşılan bazis sətrinə işarə edən və - bonus olaraq - bayt-bayt yox, pointer ilə müqayisə olunan bir `Handle[string]` qaytarır. Valyutalar, statuslar və etiket açarları kimi yüksək-təkrarlanan, aşağı-kardinallıqlı dəyərləri intern edin; hüdudsuz unikal sətirləri intern etməyin, yoxsa qlobal cədvəl sadəcə böyüyər."
    },
    {
      "h": "Zəif göstəricilər: yaddaş təzyiqinə hörmət edən keşlər",
      "p": "Bəzən bir obyekti *hələ ətrafdadırsa* xatırlamaq istəyirsiniz, amma heç vaxt onun canlı qalmasının səbəbi olmaq istəmirsiniz - keş klassik nümunədir. Keşdəki adi bir pointer hədəfini əbədi canlı saxlayır, keşi sızmaya çevirir. `weak` paketi (Go 1.24) yığılmanın qarşısını almayan bir istinad verir; onu geri oxuyursunuz və ya obyekti alırsınız, ya da GC onu yığıbsa `nil` alırsınız. Bu, yaddaş təzyiqi altında avtomatik kiçilən keşlər qurmağa imkan verir."
    },
    {
      "h": "Planlayıcıya (G-M-P) bir baxış",
      "p": "Go-nun niyə miqyaslandığını başa düşmək performans haqqında düşünməyə kömək edir. Runtime çoxlu goroutine-i (G) loji prosessorlar (P, sayı = GOMAXPROCS) vasitəsilə az sayda OS thread-inə (M) multipleksləşdirir. Bir goroutine I/O-da bloklananda, runtime onu *netpoller*-də park edir və thread-ini digər goroutine-ləri işlətmək üçün azad edir - beləliklə 100 min boş bağlantını idarə edən bir server 100 min thread-ə ehtiyac duymur. *Asinxron preemption* runtime-a sıx bir CPU dövrünü belə kəsməyə imkan verir ki, o, hər şeyi ac saxlaya bilməsin. Buna görə idiomatik Go konkurrentliyi həm yazması sadə, həm işləməsi effektivdir."
    }
  ],
  "m7": [
    {
      "h": "Observability əlavə etmək üçün ən pis vaxt insident zamanıdır",
      "p": "Production uğursuzluqları tez-tez keçicidir: bir gecikmə sıçrayışı, qısa bir deadlock, yalnız müəyyən bir yük altında görünən bir sızma. SSH ilə girib baxana qədər, an artıq keçib olur - klassik cavab, 'daha çox logging əlavə et və yenidən deploy et', sistemi dəyişir və bug-ı təkrarlamaya bilməz. Bu modulun məqsədi bir uğursuzluqdan *dərhal əvvəl nə baş verdiyini* davamlı və ucuz şəkildə tutmaqdır ki, ikinci hadisəni gözləmək əvəzinə ilk baş verməni diaqnoz edə biləsiniz."
    },
    {
      "h": "FlightRecorder: həmişə-aktiv, tələb-üzrə-ödə",
      "p": "`runtime/trace`-in FlightRecorder-i yaddaşda son icra hadisələrinin məhdud bir ring buferini demək olar ki, sıfır xərclə saxlayır - təyyarənin qara qutusu kimi, həmişə qeyd edir, amma yalnız son bir neçə saniyəni. Bir trace-i diskə yazmağın xərcini yalnız *maraqlı bir şey baş verəndə* ödəyirsiniz: bir gecikmə alarmı işə düşəndə, bir panic handler işləyəndə, bir sağlamlıq yoxlaması uğursuz olanda. Nəticə davamlı trace-nin overhead-i olmadan, uğursuzluğa aparan pəncərənin, uğursuzluq anında tutulmasıdır."
    },
    {
      "h": "SLO-larda tetiklə, tam mənzərəni tut",
      "p": "Recorder-i artıq izlədiyiniz şeylərə bağlayın. p99 gecikmə SLO-nuzu keçəndə, ya da bir panic geri sarılanda, üç şeyi atomik şəkildə birlikdə dump edin: flight trace (nə icra olundu), bir goroutine profili (kim harada ilişib qaldı) və bir heap profili (yaddaş necə görünürdü). Dump-ları bir cooldown-un arxasında saxlayın ki, çırpınan bir alarm sizi fayllar altında basdırmasın. İndi bir insident qeyri-müəyyən bir log sətri əvəzinə tam, korrelyasiya edilmiş bir snapshot buraxır."
    },
    {
      "h": "Trace-i oxumaq: go tool trace",
      "p": "Bir trace faylı `go tool trace`-də hər goroutine-in, GC dövrünün, syscall-ın və planlayıcı hadisəsinin interaktiv bir zaman xətti kimi açılır. Bu, '50ms-lik bu sorğu niyə 50ms çəkdi' sualının mikroskopudur: vaxtın GC-yə, kilid mübahisəsinə, yavaş bir syscall-a, yoxsa bir kanalda gözləyən bir goroutine-ə getdiyini görə bilərsiniz. Loglar sizə *nə* baş verdiyini deyir; bir trace sizə *vaxtın hara getdiyini* göstərir."
    },
    {
      "h": "Goroutine dump: ən sürətli ilk addım",
      "p": "Hər hansı bir fantaziya alətdən əvvəl, sadə goroutine dump-ını bilin: bir Go prosesinə SIGQUIT göndərin (və ya pprof-un `/debug/pprof/goroutine?debug=2`-ni fetch edin) və o, hər goroutine-i tam stack-i, *gözləmə səbəbi* və - kritik şəkildə - *nə qədər müddətdir* gözlədiyi ilə çap edir. Millisaniyələrdə cavab verməli olan bir iş yükündə `goroutine 42 [chan receive, 5 minutes]` kimi bir sətir özünü elan edən bir sızmadır. Dump-ları əvvəlcə gözləmə səbəbinə və müddətinə görə skan edin; bu, hər hansı bir asılma araşdırmasında ən sürətli triage addımıdır və heç bir hazırlıq olmadan istənilən Go binary-də işləyir."
    },
    {
      "h": "Sızmalar: log qazmasından yaradılmış hesabata",
      "p": "Əbədi bloklanan bir goroutine - göndərəni olmayan bir kanalda, heç vaxt sıfıra çatmayan bir `WaitGroup`-da, deadline-ı olmayan bir context-də - sızmadır: heç vaxt çıxmır, öz stack-ini və istinadlarını saxlayır. Tarixən bunları saatlarla goroutine dump-larına baxaraq tapırdınız. Goroutine-sızma analizatoru hər bloklanmış goroutine-i avtomatik olaraq kök səbəbinə qədər izləyir və reqressiyaları göndərilmədən əvvəl tutmaq üçün test sərhədlərində 'heç bir goroutine sızmadı' iddiasını edə bilərsiniz. Hər context-ə həmişə bir deadline verməklə birləşdirilərsə, bu, bütöv bir production sirri sinfini rutin bir yoxlamaya çevirir."
    }
  ],
  "m8": [
    {
      "h": "Hardware sympathy: maşına qarşı yox, onunla işləmək",
      "p": "Performansın ən yüksək səviyyəsində, CPU-ya abstrakt bir təlimat-icraçısı kimi baxmağı dayandırıb, hardware-in həqiqətən necə işlədiyinə uyğun kod yazmağa başlayırsınız - 'mexaniki simpatiya'. Bu modul bunun üç üzüdür: təlimat başına daha çox iş görmək üçün CPU-nun vektor bölmələrindən istifadə etmək, sirləri yaddaş dump-larından kənar saxlamaq və cache lokallığı ətrafında yenidən dizayn edilmiş bir Garbage Collector. Bunların heç biri gündəlik kod deyil, amma onların mövcud olduğunu - və nə vaxt dəyərə dəydiyini - bilmək senior-u principal-dan ayıran şeydir."
    },
    {
      "h": "SIMD-ə əl atmazdan əvvəl skalyar dövrü optimallaşdırın",
      "p": "Ekzotik texnikalardan əvvəl, adi dövrü sürətli edin, çünki kompilyator sizin tərəfinizdədir. Bir slice üzərində (indeksləmə əvəzinə) range etmək ona indekslərin sərhəd daxilində olduğunu sübut etməyə və iterasiya-başına *bounds check*-ləri silməyə imkan verir. İsti funksiyaları kiçik saxlamaq ona onları *inline* etməyə imkan verir, çağırış overhead-ini silərək. Hər ikisini `go build -gcflags='-m'` (inlining/escape) və `-gcflags='-d=ssa/check_bce/debug=1'` (qalan bounds check-lər) ilə görə bilərsiniz. Tez-tez bu tək başına boşluğun çoxunu bağlayır - və SIMD-dən fərqli olaraq portativdir."
    },
    {
      "h": "SIMD: bir təlimat, çoxlu dəyər",
      "p": "Skalyar bir dövr iterasiya başına bir element emal edir. Bir CPU-nun *SIMD* (Single Instruction, Multiple Data) bölmələri bir əməliyyatı bütöv bir vektora - 16 bayt, 8 float - eyni anda tətbiq edə bilər. Bir bloğun hər baytına toxunan bir dövr üçün (bir checksum, bir doğrulama keçidi), bu tez-tez böyüklük dərəcəsi sürət qazancıdır. Eksperimental `simd/archsimd` paketi bu vektor tiplərini Go-da açır. Tələ budur: vektor təlimatları arxitekturaya xasdır, ona görə həmişə quyruq elementləri və intrinsic-ləri olmayan CPU-lar üçün bir *skalyar fallback* saxlayırsınız. Yalnız profiler-in isti olduğunu sübut etdiyi bir dövrü vektorlaşdırın."
    },
    {
      "h": "Sirlər öz istifadəsindən uzun yaşamamalıdır",
      "p": "Adi bir `[]byte`-də oturan deşifrə edilmiş bir açar bir öhdəlikdir: RAM-da qalır, hərəkət edən Garbage Collector tərəfindən ətrafa köçürülür və - ehtiyac duyduğunuzdan çox sonra - bir core dump-da bitə bilər və ya diskə swap edilə bilər. `runtime/secret` həssas bayt-ları hərəkət edən heap-dən kənarda qalan və `Destroy`-da sıfırlanması təmin edilən bir buferdə saxlayır, bir açarın bərpa edilə biləcəyi pəncərəni minimuma endirərək. Bu maruz qalma pəncərəsini minimuma endirmək açar materialını idarə edən hər şey üçün əsas müdafiə vərdişidir."
    },
    {
      "h": "Green Tea: cache lokallığı üçün qurulmuş bir GC",
      "p": "Eksperimental Green Tea Garbage Collector (`GOEXPERIMENT=greenteagc`) Swiss Table-larla eyni 'yaddaş darboğazdır' reallığını əks etdirir. Obyektləri bir-bir işarələyib heap boyu pointer-ləri qovmaq (səpələnmiş, cache-dostu olmayan) əvəzinə, yaddaşı bitişik 8 KiB *span*-larda skan edir - CPU-nun yaxşı prefetch etdiyi və nüvələr arasında təmiz paralelləşən ardıcıl giriş. Böyük heap-lərdə bu, GC CPU-sunu əhəmiyyətli dərəcədə kəsə bilər. Həmişəki kimi: bir eksperimenti qəbul etməzdən əvvəl default-a qarşı qiymətləndirin və benchmark edin."
    }
  ],
  "m10": [
    {
      "h": "Yaddaş divarı: CPU-nuz ac qalır, tənbəllik etmir",
      "p": "On illər boyu CPU sürəti yaddaş sürətindən qat-qat sürətli artdı, mühəndislərin *yaddaş divarı* adlandırdığı bir boşluq açaraq. Bugünkü nəticə: müasir bir nüvə əsas yaddaşdan tək bir dəyəri gətirmək üçün lazım olan vaxtda onlarla arifmetik əməliyyat yerinə yetirə bilər. Beləliklə isti kodun əksəriyyətində darboğaz riyaziyyat deyil - *data gözləməkdir*. Bu, performans işini tamamilə yenidən çərçivələyir. Təlimatları saymaq əvəzinə, datanızın harada yaşadığını və necə hərəkət etdiyini düşünürsünüz. Bir cache hit (~1 ns) ilə RAM-a bir cache miss (~100 ns) arasında, eyni təlimatda 100× fərq var."
    },
    {
      "h": "Hardware bir istədiyinizdə niyə 64 bayt daşıyır",
      "p": "Tək bir `int64` oxuyanda, CPU 8 bayt gətirmir - onu ehtiva edən bütöv 64-baytlıq *cache line*-ı L1-ə gətirir. Bu, *spatial lokallıq* üzərinə bir mərcdir: hardware fərz edir ki, əgər bu bayta ehtiyacınız vardısa, tezliklə onun qonşularına da ehtiyacınız olacaq. Bu mərc bitişik datanın niyə sürətli olduğunun bünövrəsidir. Bir `[]int64` bir xəttə səkkiz dəyər sığdırır, ona görə bir miss növbəti yeddi oxumanı pulsuz isindirir. Bir `[]*Thing` isə heap boyu səpələnmiş obyektlərə pointer-lər saxlayır, ona görə hər element təsadüfi bir ünvana təzə bir fetch-dir - alqoritm eyni görünə bilər, amma biri axır, o biri isə büdrəyir."
    },
    {
      "h": "Lokallıq bir vərdişdir, hiylə deyil",
      "p": "İki nümunə cache hit qazandırır. *Temporal* lokallıq: data hələ isti olarkən onu yenidən istifadə edin (çoxlu keçid etmək əvəzinə bir dəyəri tam emal edib sonra irəli keçin). *Spatial* lokallıq: birlikdə istifadə edəcəyiniz datanı fiziki olaraq birlikdə saxlayın və onu sırayla gəzin ki, hardware prefetcher-i sizin qabağınıza keçə bilsin. Praktik qaydalar bundan birbaşa çıxır: kiçikdən-orta N üçün linked strukturlar əvəzinə slice/massiv-lərə üstünlük verin; onları iterasiya edərkən pointer-slice-ları yox, dəyər-struct-ları saxlayın; və 2D bir grid üçün, yaddaş sırasında dövr edin (sətirlər xarici, sütunlar daxili). Eyni ümumi iş, sadəcə düzülüşə hörmət etməklə bir neçə dəfə daha sürətli işləyə bilər."
    },
    {
      "h": "False sharing: sıfır paylaşılan data belə sizə bahaya başa gələndə",
      "p": "Cache koherentliyi hər nüvənin yaddaş görüntüsünü ardıcıl saxlayır: bir nüvə bir cache line yazanda, hardware həmin xətti hər digər nüvənin keşində etibarsızlaşdırır. İndi iki goroutine-i iki nüvədə təsəvvür edin, hər biri *öz* sayğacını yeniləyir - amma bu iki sayğac eyni 64-baytlıq xəttdə oturmuş olur. Onlar heç vaxt eyni dəyişənə toxunmasalar da, bir nüvənin hər yazısı digər nüvənin xətt nüsxəsini vurur, o da yenidən gətirilməli olur. Xətt keşlər arasında pinq-ponq oynayır və 'paralel' sayğaclarınız tək bir thread-dən daha yavaş işləyə bilər. Bu *false sharing*-dir və mənbədə görünməzdir - həll isti sahələri padding etməkdir ki, hər biri ayrı bir xəttə sahib olsun."
    },
    {
      "h": "Düzülüşü ölçmək, təxmin etməmək",
      "p": "Fərziyyə etməyə ehtiyacınız yoxdur. `unsafe.Sizeof` bir struct-un padding daxil real ölçüsünü göstərir, ona görə sahələri böyükdən-kiçiyə yenidən sıralayaraq onu kiçildə bilərsiniz. Bir heap və ya CPU profili (F2 modulu) üstəgəl isti bir funksiyanın *yaddaş-bağlı* olduğunu anlamaq sizi düzülüş problemlərinə yönləndirir. Və həqiqətən performans-kritik bir yol üçün, hardware perf sayğacları (cache-miss dərəcəsi) ümumiyyətlə yaddaşa bağlı olub-olmadığınızı təsdiqləyir. İntizam kursun qalanını əks etdirir: əvvəlcə ölç, sonra düzülüşü dəyiş, sonra yenidən ölç - əksər hallarda bitişik bir slice və ağlabatan sıralanmış bir struct kifayət edir."
    }
  ],
  "m11": [
    {
      "h": "Çipin içindəki montaj xətti",
      "p": "Bir CPU bir təlimatı tamamilə bitirmədən növbətini başlatmır. Onları *pipeline*-layır: bir zavod xətti kimi, hər təlimat mərhələlərdən keçir - fetch, decode, execute, memory, write-back - və bir təlimat icra olunarkən, növbəti decode olunur, üçüncüsü isə fetch edilir. Dolu bir pipeline ilə nüvə, hər biri end-to-end bir neçə dövr çəksə də, dövr başına təxminən bir təlimat retire edir. Real nüvələr daha da irəli gedir: *superskalar*-dırlar (bir neçə pipeline yan-yana) və 15-20 mərhələ dərinliyindədirlər, dövr başına bir neçə təlimat retire edirlər. Bütün bu throughput xətti dolu saxlamaqdan asılıdır - və onu boşaldan şeylər bu modulun mövzusudur."
    },
    {
      "h": "Branch-lər CPU-nu qumar oynamağa məcbur edir",
      "p": "Hər `if`, dövr şərti və funksiya qaytarması bir *branch*-dir və branch-lər bir pipeline üçün problemdir: nüvə növbəti təlimatı gətirməli olduğu anda, tez-tez branch-in hansı tərəfə gedəcəyini hələ hesablamayıb. Bilənə qədər dayanmaq bütöv pipeline-ı israf edərdi. Ona görə bunun əvəzinə *branch predictor* - həmin branch-in tarixçəsindən istifadə edərək - təxmin edir və nüvə proqnozlaşdırılan yol boyunca spekulyativ işləyir. Doğru təxmin etsə (predictor-lar müntəzəm nümunələrdə 95%-i keçir) heç bir xərc yoxdur. Yanlış təxmin etsə, nüvə spekulyativ etdiyi hər şeyi atmalı və pipeline-ı düzgün ünvandan yenidən doldurmalıdır: təxminən 15-20 dövrlük bir *misprediction cəzası*."
    },
    {
      "h": "Sıralamaq eyni dövrü niyə daha sürətli işlədə bilər",
      "p": "Kanonik nümayiş: böyük bir massiv götürüb yalnız bir hədddən yuxarı elementləri cəmləyin. Bunu *sıralanmış* massivdə, sonra *qarışdırılmış* bir nüsxədə işlədin - eyni təlimatlar, eyni element sayı - və sıralanmış versiya bir neçə dəfə daha sürətli ola bilər. Səbəb tamamilə branch prediction-dır. Sıralanmış datada `if v >= threshold` şərti uzun bir yalan seriyasından sonra uzun bir doğru seriyasıdır: tamamilə proqnozlaşdırıla bilən. Qarışdırılmış datada isə qeyri-proqnozlaşdırıla bilən şəkildə dəyişir, ona görə predictor təxminən yarı vaxt yanılır və hər miss bir pipeline boşalması bahasına başa gəlir. Eyni Big-O, eyni riyaziyyat, çox fərqli divar vaxtı - sürəti təkcə alqoritmin yox, hardware-in qərar verdiyinin canlı bir dərsi."
    },
    {
      "h": "Sırasız icra dayanmaları gizlədir",
      "p": "Nüvələr həm də *sırasız*-dırlar: bir təlimat yavaş bir yaddaş yükləməsini gözləyərkən dayananda, nüvə növbəti təlimatlar pəncərəsini skan edir və girişləri artıq mövcud olan hər hansı birini işlədir, sonra nəticələri proqram sırasında commit edir. Bu *təlimat-səviyyəli paralellik* uzun asılılıq zəncirlərinin niyə zərərli olduğunu izah edir - əgər hər addım əvvəlkinin nəticəsinə ehtiyac duyursa, üst-üstə salınacaq müstəqil iş yoxdur və nüvə hər dayanmada boş qalır. Go-dakı praktik lever: bir reduksiyanı bir neçə müstəqil akkumulyatora bölün (dörd dəyişənə cəmləyin, sonda birləşdirin). Eyni təlimat sayı, amma indi nüvənin üst-üstə salacağı paralel zəncirləri var və bir cəm və ya hash dövrü nəzərəçarpacaq dərəcədə sürətlənir."
    },
    {
      "h": "Hardware-i Go-dan idarə etmək",
      "p": "Nadir hallarda assembly yazırsınız, amma bütün bunları adi Go və kompilyator vasitəsilə idarə edirsiniz. Kiçik isti bir funksiyanı *inline* etmək çağırış overhead-ini silir və sırasız icra mühərrikinə üst-üstə salmaq üçün daha çox təlimat verir - bunu `-gcflags=-m` ilə yoxlayın. *Bounds-check elimination* hər slice indeksində gizli bir branch-i silir - indeksləmə əvəzinə range etmək kompilyatora təhlükəsizliyi sübut etməyə kömək edir. Və daha dərin bir əlaqə var: tək bir nüvəni sürətli edən eyni spekulyasiya və yenidən sıralama, *çoxlu* goroutine-in niyə açıq sinxronizasiyaya ehtiyac duyduğunun səbəbidir. Hardware oxu və yazıları yenidən sıralaya biləcəyi üçün, iki goroutine növbəti modulun atomic-ləri, mutex-ləri və kanalları olmadan sıra üzərində razılığa gələ bilməz - branch prediction-un əmisi oğlu olan yaddaş yenidən sıralaması data race-lərin kökündədir."
    }
  ],
  "m12": [
    {
      "h": "Goroutine-lər thread deyil və bu hər şeyi dəyişir",
      "p": "Bir OS thread-i ağır bir obyektdir: böyük, sabit bir stack (tez-tez 1-8 MB), və thread-lər arasında keçid kernel-dən bir səyahət deməkdir. Onlardan minlərləsini saxlaya bilərsiniz, milyonlarla yox. Bir goroutine runtime-ın öz abstraksiyasıdır: tələb üzrə böyüyən ~2 KB-lıq bir stack-i olan kiçik bir struct, tamamilə istifadəçi məkanında planlaşdırılır. Birini yaratmaq bir funksiya çağırışıdır, syscall deyil. Buna görə idiomatik Go bağlantı başına, sorğu başına, iş başına ikinci bir düşüncə olmadan bir goroutine başladır - və buna görə bir Go serveri bir ovuc thread üzərində yüz minlərlə konkurrent bağlantı saxlaya bilir. Planlayıcı bunu ucuz edən mexanizmdir."
    },
    {
      "h": "G, M və P - və onları bir-birinə bağlayan tək qayda",
      "p": "Runtime üç şeyi jonglyor edir. Bir *G* bir goroutine-dir (iş). Bir *M* bir OS thread-idir (bir nüvədə həqiqətən işləyən şey). Bir *P* bir prosessordur: işlədilə bilən goroutine-lərin lokal növbəsi olan bir planlaşdırma konteksti, və dəqiq `GOMAXPROCS` sayda mövcuddur. Bütöv sistemi anlaşıqlı edən invariant: *Go kodu işlətmək üçün, bir M mütləq bir P tutmalıdır*. Yalnız `GOMAXPROCS` sayda P olduğu üçün, ən çoxu o qədər goroutine həqiqətən paralel işləyir - neçə goroutine başlatdığınızdan və ya neçə thread mövcud olduğundan asılı olmayaraq. P-lər paralelliyin əsl vahididir; G-lər sadəcə bir P gözləyən işdir."
    },
    {
      "h": "Lokal növbələr və work stealing",
      "p": "Əgər hər `go` operatoru işi növbəyə qoymaq üçün qlobal bir kilid tutmalı olsaydı, planlayıcı çox-nüvəli bir maşında bir darboğaz olardı. Ona görə hər P öz *lokal* run queue-sunu saxlayır - sürətli, demək olar ki, kilidsiz bir ring - və `go f()` cari P-nin lokal növbəsinə itələyir, bu həm kilidsiz, həm cache-dostudur. Lokal növbələrin riski balanssızlıqdır: bir P işdə boğularkən digəri boş qalır. Runtime bunu *work stealing* ilə düzəldir: park olunmazdan əvvəl boş bir P, təsadüfi seçilmiş məşğul bir P-dən goroutine-lərin yarısını oğurlayır (və dövri olaraq qlobal növbəni və netpoller-i yoxlayır). Nəticə hot path-də mərkəzi bir koordinator olmadan avtomatik yük balanslamasıdır."
    },
    {
      "h": "Netpoller: ucuz I/O-nun arxasındakı sirr",
      "p": "Bu, Go-nun sadə bloklayıcı-üslublu şəbəkələşməsini effektiv edən hissədir. Bir goroutine hazır datası olmayan bir socket-də `Read` çağıranda, runtime OS thread-ini BLOKLAMIR. Goroutine-i park edir, fayl deskriptorunu əməliyyat sisteminin hadisə mexanizmi ilə - Linux-da *epoll*, macOS/BSD-də *kqueue*, Windows-da IOCP - qeydiyyatdan keçirir və M-i digər goroutine-ləri işlətmək üçün azad edir. OS sonradan socket-in oxunmağa hazır olduğunu bildirəndə, netpoller park edilmiş goroutine-i yenidən planlaşdırılmaq üçün oyadır. Beləliklə siz sadə, sinxron kod yazırsınız, runtime isə onu səssizcə altında hadisə-yönümlü I/O-ya çevirir. Bu, C10k probleminin cavabıdır: 100,000 boş bağlantı 100,000 ucuz goroutine-ə başa gəlir, 100,000 thread-ə yox."
    },
    {
      "h": "Syscall-lar və preemption: hər P-ni məhsuldar saxlamaq",
      "p": "Bəzi bloklama netpoller tərəfindən idarə edilə bilməz - bir disk oxuması, bir DNS axtarışı, bir cgo çağırışı həqiqətən OS thread-ini bloklayır. Runtime-ın cavabı *handoff*-dur: bloklanmış M-in P-sini ayırır və onu başqa bir thread-ə verir ki, qalan goroutine-lər işləməyə davam etsin; buna görə `GOMAXPROCS`-dan daha çox OS thread-i görə bilərsiniz. Ədalətin digər yarısı *preemption*-dır. Əvvəlcə Go yalnız funksiya çağırışlarında goroutine-lər arasında keçid edə bilirdi, ona görə çağırışı olmayan sıx bir `for {}` dövrü bir P-ni inhisara ala, hətta Garbage Collector-ı belə dayandıra bilirdi. Go 1.14-dən bəri, bir fon monitoru thread-i (*sysmon*) çox uzun (~10 ms) işləmiş bir goroutine-i aşkarlayır və onu təhlükəsiz şəkildə preempt etmək üçün thread-inə bir siqnal göndərir. Birlikdə, handoff və asinxron preemption heç bir tək goroutine-in - bloklanmış olsun, məşğul olsun - digərlərini ac saxlaya bilməməsini təmin edir."
    }
  ],
  "m6": [
    {
      "h": "Servislər arası danışıq və bu trafikə olan təhdid",
      "p": "Sistem birdən çox maşını əhatə edən kimi, servislər şəbəkə üzərindən danışmalıdır - və bu trafik məxfi və versiyalar arasında uyğun qalmalıdır. Bu modul hər ikisini əhatə edir: səmərəli, təkamül edə bilən servislərarası çağırışlar üçün gRPC + Protobuf, və hələ tam mövcud olmayan, amma gələn bir təhdidə qarşı trafiki məxfi saxlamaq üçün postkvant kriptoqrafiya."
    },
    {
      "h": "gRPC və Protobuf: təkamül edən müqavilələr",
      "p": "gRPC HTTP/2 üzərində *Protobuf* mesajları daşıyan RPC-lər işlədir - sxemlə təyin olunan yığcam binar format. Sxem müstəqil deploy olunan servislər arasında müqavilədir, ona görə intizam *geriyə uyğunluqdur*: yeni opsional sahələr əlavə edə bilərsiniz, amma ləğv edilmiş sahə nömrəsini heç vaxt yenidən istifadə edə və ya sahə tipini dəyişə bilməzsiniz, əks halda köhnə node və yeni node eyni baytları səssizcə yanlış şərh edəcək. Ləğv edilmiş nömrələri `reserved` edin və hər sxem dəyişikliyini CI-də breaking-change yoxlaması ilə bloklayın ki, v2 node rollout ortasında v1 həmyoldaşını heç vaxt sındırmasın."
    },
    {
      "h": "İndi topla, sonra deşifrə et",
      "p": "Postkvant kriptoqrafiyanı bu gün doğrulayan təhdid budur. Səbirli hücumçu şifrələnmiş trafikinizi *indi* yazıb sadəcə saxlayır, klassik açar mübadiləsini (RSA, X25519 kimi elliptik əyriləri - hamısı Shor alqoritminə düşür) sındıra biləcək qədər güclü gələcək kvant kompüteri gözləyir. Uzun rəf ömrü olan verilənlər üçün - maliyyə qeydləri, sağlamlıq verilənləri - 'illərcə yaxşı olacağıq' səhv çərçivədir: trafik bu gün toplanır və sonra deşifrə edilir. Müdafiə kvant kompüteri mövcud olmazdan əvvəl deploy edilməlidir."
    },
    {
      "h": "Hibrid açar mübadiləsi: kəmər və şalvar bağı",
      "p": "Cavab *hibrid* açar mübadiləsidir: klassik alqoritmi (X25519) postkvant alqoritmi ilə (NIST tərəfindən `crypto/mlkem` kimi standartlaşdırılan qəfəs-əsaslı sxem ML-KEM) birləşdirin. Sessiya açarı hər ikisindən törədilir, ona görə hücumçu onu bərpa etmək üçün *hər ikisini* sındırmalıdır. Bu, PQC alqoritmlərinin yeniliyini hedcinq edir - ML-KEM-də qüsur çıxsa, hələ də klassik təhlükəsizliyiniz var, əksinə də doğrudur. Go-da bunu `tls.Config`-də `X25519MLKEM768` qrupuna üstünlük verməklə aktivləşdirirsiniz; onun seçilməsi üçün hər iki tərəf onu dəstəkləməlidir."
    },
    {
      "h": "Dəyişməzlikləri tip sistemində kodlaşdırmaq",
      "p": "Staff səviyyəsində düzgünlüyü kompilyatora itələyirsiniz. Özünə istinad edən generic məhdudiyyət `type Node[T Node[T]] interface { ... }` bir metoda interfeys əvəzinə *konkret* implementasiya edən tipi qaytarmağa imkan verir - beləliklə əks halda runtime assersiyaları olacaq klaster-topologiya qaydaları kompilyasiya-vaxtı təminatlarına çevrilir. Runtime-da yoxlanan daha az dəyişməz o deməkdir ki, istehsalat sizi daha az sürpriz gözləyir."
    }
  ],
  "m9": [
    {
      "h": "İşləyən binary-dən idarə edilə bilən sistemə",
      "p": "Laptop-unuzda işləyən kod komandanın saat 3-də sorğu itirmədən deploy edib miqyaslandıra və yükseldə biləcəyi servisdən çox uzaqdır. Bu modul o son mildir: Go-nu konteynerlərdə yaxşı davranmağa vadar etmək, kiçik və hücuma qarşı çətin image-lər göndərmək, böyük miqyaslı kod dəyişikliklərini avtomatlaşdırmaq və qərarları qeyd etmək ki, növbəti mühəndis təxmin etməsin. Principal mühəndislər ağıllılıq qədər idarə edilə bilənliklə də qiymətləndirilir."
    },
    {
      "h": "Runtime-a konteynerin real limitlərini gördürmək",
      "p": "Pod Linux *cgroup*-ları ilə deyək 4 CPU və 512 MB-a məhdudlaşdırılır - amma tarixən Go runtime-ı *host*-un 128 nüvəsini görüb GOMAXPROCS-u 128-ə təyin edir, həddindən artıq çox thread yaradıb nüvənin CPU throttling-i altında əzilirdi. Go 1.25 cgroup CPU kvotasını oxuyur və GOMAXPROCS-u avtomatik uyğunlaşdırır. Onu yaddaş limitinə təyin olunmuş `GOMEMLIMIT` ilə cütləşdirin ki, GC OOM-öldürülməzdən əvvəl tavana yaxınlaşdıqca daha çox işləsin. Dərs: konteynerləşdirilmiş runtime host-un yox, konteynerin limitlərinə hörmət etməlidir."
    },
    {
      "h": "Möhkəmləndirilmiş image-lər: yalnız binary-ni göndərin, başqa heç nə yox",
      "p": "Statik bağlanmış, CGO-suz Go binary-si işləmək üçün ƏS-ə ehtiyac duymur. Ona görə istehsalat image-i mahiyyətcə yalnız həmin binary-ni ehtiva etməlidir. Multi-stage Docker build tam alət dəsti olan image-də kompilyasiya edir, sonra tək binary-ni `scratch`-ə (boş) və ya `distroless` bazasına köçürür - bir neçə meqabayt, shell yoxdur, paket meneceri yoxdur, ona görə kiçik CVE səthi və hücumçunun keçə biləcəyi heç nə yoxdur. Qeyri-root istifadəçi kimi işlədin. Kiçik və darıxdırıcı istehsalatda tam olaraq istədiyiniz şeydir."
    },
    {
      "h": "Qəhrəmanlıq olmadan flot boyu kod dəyişikliyi",
      "p": "Bir çox komandanın istifadə etdiyi kitabxanaları saxladıqda, API-ni köhnəlmiş elan etmək ağrılıdır - yüz PR aça bilməzsiniz. Yenilənmiş `go fix` mühərriki və `//go:fix` inline direktivləri sizə *maşınla-tətbiq-oluna-bilən* miqrasiyalar göndərməyə imkan verir: köhnə API-ni işarələyin, hər istehlakçı isə çağırış yerlərini təhlükəsiz avtomatik yenidən yazmaq üçün `go fix ./...` işlədir. Bu, koordinasiya qarabasırısını bir-əmrlik yüksəldiyə çevirir və böyük Go kod bazalarının köhnəlmiş çağırışları əbədi toplamaq əvəzinə cari qalmasının səbəbidir."
    },
    {
      "h": "Nəyi deyil, niyəni qeyd edin",
      "p": "Son intizam təşkilatidir. *Architecture Decision Record* kontekst, nəzərdən keçirilən seçimlər, qərar və nəticələri qeyd edən qısa, yalnız-əlavə edilə bilən qeyddir - məsələn, '30 illik ledger verilənlərinə indi-topla-sonra-deşifrə-et təhdidinə görə node-lararası nəql üçün hibrid ML-KEM seçdik'. Altı ay sonra kimsə 'əl sıxma niyə daha yavaşdır?' soruşanda, cavab kiminsə yaddaşında yox, ADR-dədir. Kod *nəyi* göstərir; ADR-lər *niyəni* qoruyur."
    },
    {
      "h": "Rolling update-lər: sıfır atılmış sorğu ilə yüksəltmə",
      "p": "Bunu bir araya gətirərək, deploy istifadəçilər üçün görünməz olmalıdır. Kubernetes *rolling update* edir: yeni versiya pod başladır, ona trafik göndərməzdən əvvəl onun *readiness probe*-unun keçməsini gözləyir, sonra köhnə pod-u boşaldır (yeni sorğuları dayandırır, icrada olanların bitməsinə icazə verir) və pod-pod bunu təkrarlayır. Sağlamlıq və readiness prob-ları bunu təhlükəsiz edən müqavilədir. Onları qurun, 'deploy' isə qorxulu söz olmaqdan çıxsın."
    }
  ],
  "m14": [
    {
      "h": "İstehsalata debugger qoşa bilməzsiniz",
      "p": "Laptop-unuzda breakpoint qoyub addım-addım keçirsiniz. İstehsalatda saniyədə minlərlə sorğunu emal edən servis var; onu dayandıra bilməzsiniz və bug bir saat əvvəl 200 milisaniyə davam etmiş ola bilər. Ona görə sistemin özü nə etdiyinin dəlilini davamlı yaymalıdır. Bu *observability*-dir: yeni kod göndərmədən sistemin daxili vəziyyətini onun yaydığı siqnallardan anlaya bilməyiniz xüsusiyyəti. Məqsəd problemin *ilk* baş verməsini artıq toplanmış verilənlərdən diaqnoz etməkdir - loqlama əlavə edib yenidən baş verməsini gözləmək deyil."
    },
    {
      "h": "Üç siqnal, üç sual",
      "p": "Observability üç tamamlayıcı siqnala əsaslanır və səhv onları əvəzedilə bilən hesab etməkdir. *Metrikalar* zaman üzrə ucuz rəqəmsal aqreqatlardır - sorğu tezliyi, xəta tezliyi, gecikmə faizləri - və aqreqat olduqları üçün xərcləri trafiklə böyümür; onlar *'nəsə səhvdirmi, nə qədər pisdir?'* sualına cavab verir və alert-lərinizin izlədiyi budur. *Trace-lər* bir sorğunu servis sərhədləri boyu vaxtlı span-lar ağacı kimi izləyir; onlar *'vaxt və ya xəta harada baş verdi?'* sualına cavab verir. *Loglar* fərdi hadisələrin təfərrüatlı qeydləridir; onlar *'bu konkret halda tam olaraq nə baş verdi?'* sualına cavab verir. Onları birləşdirən iş axını: metrika alert-i işə düşür, günahkar servisi tapmaq üçün yavaş sorğunun trace-ini açırsınız, sonra dəqiq səbəb üçün həmin servisin loglarını oxuyursunuz."
    },
    {
      "h": "Strukturlaşdırılmış loglama: maşının oxuya biləcəyi mətn",
      "p": "`log.Printf(\"user %s failed: %v\", id, err)` kimi sətir bir developer üçün yaxşıdır, miqyasda isə faydasızdır - sərbəst mətni etibarlı şəkildə süzgəcdən keçirə və ya aqreqasiya edə bilməzsiniz. Go-nun standart `log/slog`-u *strukturlaşdırılmış* qeydlər yayımlayır: log backend-inin indeksləyib sorğulaya biləcəyi açar/dəyər atributları, istehsalatda JSON kimi göstərilir. Vacib olan vərdişlər: interpolyasiya edilmiş sətirlər yox, atributlar loqlayın; hər sətirdə səviyyə təyin edin; sorğu-əhatəli sahələri `logger.With(...)` ilə bir dəfə bağlayın ki, sonrakı hər sətir trace ID-ni və route-u daşısın; development-də insan-oxuya bilən handler, istehsalatda JSON istifadə edin. Logları gündəlik yox, sorğulana bilən verilən kimi rəftar edin."
    },
    {
      "h": "Metrikalar: düzgün dörd rəqəmi ölçmək",
      "p": "Metrikalar üç formada gəlir: yalnız artan *sayğaclar* (sorğular, xətalar), hər iki istiqamətə hərəkət edən *göstəricilər* (icrada olan sorğular, növbə dərinliyi) və p50/p95/p99 gecikməsini oxuya bilməniz üçün paylanmanı vedrələyən *histogramlar* - və istifadəçilərin əslən hiss etdiyi quyruq, p99-dur. İki çərçivə NƏYİ ölçmək lazım olduğunu deyir ki, dashboard-larda boğulmayasınız: sorğu-əsaslı servislər üçün *RED* (Rate, Errors, Duration) və resurslar üçün *USE* (Utilization, Saturation, Errors). Onları `/metrics` endpoint-ində göstərin və Prometheus-un scrape etməsinə icazə verin. Bunu münasib saxlayan intizam növbəti bölmənin mövzusudur: hüdudlu etiket kardinallığı."
    },
    {
      "h": "Trace-lər və başdan bəri ötürdüyünüz context",
      "p": "Trace *span*-lar ağacıdır; hər span bir əməliyyatı ölçür - HTTP handler, verilənlər bazası sorğusu, gedən RPC - və valideyni altında yuvalanır, ona görə trace hərfi mənada sorğunun milisaniyələrinin servislər boyu hara getdiyini göstərir. Bunu proses sərhədləri boyu işlədən şey *context ötürülməsidir*: trace və span ID-ləri `context.Context` içində gəzir və gedən sorğu başlıqlarına (W3C `traceparent` başlığı) yeridilir, ona görə növbəti servis yeni trace başlatmır, *eyni* trace-i davam etdirir. Bu, kursun F5 modulundan bəri `context.Context`-in hər şeyin ilk arqumenti olmasında israr etməsinin daha dərin səbəbidir - paylanmış sorğunu tək, oxuna bilən hekayəyə tikən sap odur."
    },
    {
      "h": "Hesab çatır: kardinallıq, seçmə (sampling) və həcm",
      "p": "Observability pulsuz deyil və uğursuzluq rejimi özünə-vurulmuşdur. Ən kəskin kənar *kardinallıqdır*: hüdudsuz dəyərlərə malik metrika etiketi - istifadəçi ID-ləri, sorğu ID-ləri, daxilində ID olan xam URL-lər - milyonlarla fərqli zaman seriyasına partlayır və sizi xilas etməli olan metrika backend-ini çökdürə bilər. Etiketləri kiçik, hüdudlu dəstlərlə saxlayın: konkret yol yox, *route şablonu* `/ledger/{id}`; mesaj yox, status kodu. Trace-lər *seçilir*, çünki miqyasda hər span-ı saxlamaq mümkün deyil - kiçik faiz üstəgəl bütün yavaş və ya xətalı olanları saxlayın. Loglar isə, həcmdə ən bahalı siqnal, səviyyə intizamı tələb edir və sıx dövr daxilində loqlamaqdan heç vaxt uzaqlaşmaz. Yaxşı observability nə *qeyd etdiyiniz* qədər nə qeyd *etmədiyinizlə* bağlıdır."
    }
  ],
  "m15": [
    {
      "h": "Paylanmış sistemlərdə uğursuzluq qismən və yoluxucudur",
      "p": "Tək proqram adətən təmiz uğursuz olur: çökür və stack trace-i oxuyursunuz. Paylanmış sistem *qismən* uğursuz olur - bir node yavaşlayır, bir asılılıq xəta verməyə başlayır - və təhlükə odur ki, qismən uğursuzluq *yayılır*. Yavaş verilənlər bazası onu çağıranları yavaşladır; yavaş çağıranlar bağlantıları və goroutine-ləri daha uzun saxlayır; bu onların hovuzlarını tükəndirir, ona görə *onların* çağıranları yavaşlayır; və dalğa bir zəifləyən komponentin bütün sistemi endirənə qədər yayılır. Dayanıqlılıq mühəndisliyi qismən uğursuzluğu qismən saxlayan naxışlar toplusudur. Heç biri uğursuzluğun qarşısını almır - onlar *gücləndirmənin* qarşısını alır."
    },
    {
      "h": "Deadline-lar: hər şeyin asılı olduğu naxış",
      "p": "Təməl qayda budur ki, *heç nə əbədi gözləmir*. Hər şəbəkə çağırışı `context.WithTimeout` vasitəsilə timeout alır və həmin context bütün çağırış zənciri boyu ötürüldüyü üçün, sorğunun deadline-ı keçdikdə, onun üzərində işləyən hər icrada olan downstream çağırış birlikdə ləğv edilir. Bunu atlasanız, bir ilişmiş asılılıq server tükənənə qədər goroutine-ləri və bağlantıları səssizcə saxlayır - yuxarıdakı dəqiq kaskad. Sorğuya *büdcə* verirsiniz (deyək iki saniyə), onu hop-lar boyu xərcləyirsiniz və bitəndə sürətlə uğursuz olursunuz. Bu moduldakı hər digər naxış deadline-ların artıq mövcud olduğunu fərz edir; onlar olmadan, retry-lər və breaker-lər sadəcə daha çox ilişmiş gözləyici yığır."
    },
    {
      "h": "Düzgün retry-lər və özünüzü yıxa biləcəyiniz sürü",
      "p": "Keçici uğursuzluqlar - qırılmış bağlantı, 503, serializasiya konflikti - retry etməyə dəyər, amma sadəlövh retry dövrü təhlükəlidir. Üç intizam bunu təhlükəsiz edir. *Eksponensial backoff*: 100 ms, sonra 200, sonra 400 gözləyin, ki, artıq zəifləyən servisi döyəcləməyi dayandırasınız. *Jitter*: hər gecikməni rastgələləşdirin, əks halda eyni anda uğursuz olan minlərlə müştəri mükəmməl sinxronda retry edir - bərpa olan servisi birbaşa yenidən yıxan bir *thundering herd*. *İdempotentlik*: yalnız təkrarlanması təhlükəsiz olan əməliyyatları retry edin; idempotentlik açarı olmadan retry edilmiş ödəniş müştəriyə ikiqat pul çıxarır. Və həmişə cəhdləri *məhdudlaşdırın*: retry-lər yükü çoxaldır, ona görə hüdudsuz retry fırtınası özünüzə etdiyiniz xidmət-rədd hücumudur."
    },
    {
      "h": "Circuit breaker-lər: cəhd etməyi nə vaxt dayandırmağı bilmək",
      "p": "Həqiqətən *çökmüş* asılılığı retry etmək sadəcə vaxt itirir və artıq az yükə ehtiyacı olan sistemə yük əlavə edir. *Circuit breaker* asılılığın ətrafına bükülü kiçik vəziyyət maşınıdır. *Bağlı* olduqda, çağırışlar keçir və o uğursuzluqları sayır. Uğursuzluqlar həddi keçdikdə *açığa* keçir və indi hər çağırış soyuma dövrü ərzində *dərhal* uğursuz olur - timeout gözləmədən - bu həm sizin goroutine-lərinizi qoruyur, həm də asılılığa nəfəs almaq üçün yer verir. Soyuma dövründən sonra *yarı-açığa* keçir və bir neçə prob çağırışına icazə verir: uğur olsa bağlanır, uğursuz olsa yenidən açılır. Əsas davranış *sürətlə uğursuz olmaqdır*: açıq breaker yavaş, resurs-tükədən uğursuzluğu ani, ucuza çevirir, tez-tez keşlənmiş və ya deqradasiya edilmiş fallback ilə cütləşir."
    },
    {
      "h": "Hər şeyə xidmət edə bilmədikdə: yıxılmayın, yük atın",
      "p": "İki klapan sistemə nə qədər işin daxil olduğunu idarə edir. *Rate limiter* (token bucket) saniyədə sorğuları məhdudlaşdırır, partlayışları hamarlayır və downstream-i əzilməkdən qoruyur. *Load shedding* onun kobud, vacib qardaşıdır: artıq doyduğunuzda - növbə dolu, gecikmə SLO-nu keçib - bitirə bilmədiyiniz işi qəbul etmək əvəzinə artığı dərhal 429 və ya 503 ilə rədd edirsiniz. Bu səhv görünür, amma ayaqda qalmaqla yıxılmaq arasındakı fərqdir: həddindən artıq yük altında hər şeyi qəbul edən server heç *kimə* xidmət etməyə qədər yavaşlayır, iyirmi faizi atan isə digər səksəni tam sürətlə xidmət edir. Sürətlə xeyr demək bir xüsusiyyətdir."
    },
    {
      "h": "Backpressure: növbənin geri itələməsinə icazə vermək",
      "p": "Buradakı ən dərin fikir *backpressure*-dur: istehlakçı ayaqlaşa bilmədikdə, düzgün cavab *istehsalçını* yavaşlatmaqdır, hüdudsuz buferləmək yox. Davamlı həddindən artıq yük altında hüdudsuz növbə və ya channel sadəcə yaddaş tükənənə qədər böyüyür və proses OOM tərəfindən öldürülür - ötürmə problemini çökməyə çevirir. *Hüdudlu* buferli channel pulsuz backpressure verir: doluduqda, göndərişlər blok olur (və ya `select` default ilə atıla bilər) və bu blok istehsalçıya geri yavaşlıq ötürür ki, daha çox qəbul etməyi dayandırsın. Hər növbəni hüdudlayın, 'növbə dolu'nu böyümə əvəzinə atma siqnalı kimi rəftar edin və onu deadline-larla birləşdirin ki, yavaş yol asmaq əvəzinə təmiz timeout etsin. Geri itələyən sistem öz ən pis gününü yaşayan sistemdir."
    }
  ],
  "m16": [
    {
      "h": "Konsept: Redis sürətlidir çünki yaddaşdadır, proqnozlaşdırıla bilər çünki tək-thread-lidir",
      "p": "İki fakt bu modulun demək olar ki, hər şeyini izah edir. Birincisi, Redis işlək verilənlər dəstini RAM-da saxlayır, ona görə oxuma və ya yazma mikrosaniyələrlə ölçülən yaddaş girişidir, milisaniyələrlə ölçülən disk axtarışı yox. İkincisi, daha az aşkar olanı, tək Redis instansiyası əmrləri BİR-BİR tək thread-də işlədir - Go proqramınız onu min goroutine-dən eyni anda çağıra bilər, amma Redis-in özü hələ də bu çağırışları ardıcıl işləyir, hər biri növbətindən əvvəl tam bitir. Bu ikinci fakt ətrafında dolaşılmalı darboğaz deyil; hər fərdi Redis əmrinin sizin tərəfinizdən heç bir lock tələb etmədən *atomik* olmasının səbəbidir. Buradan sonra hər şey - keşləmə, lock-lar, rate limitlər - əslən həmin tək təminatı fərqli şəkillərdə istifadə etməkdir."
    },
    {
      "h": "Necə işləyir: cache-aside oxu yolu",
      "p": "Cache-aside tətbiqlərin Redis-i istifadə etməsinin standart yoludur. Oxuda, əvvəlcə Redis-dən açığı istəyirsiniz. Oradadırsa (HIT), onu dərhal qaytarırsınız və real verilənlər bazasına heç toxunmursunuz. Orada deyilsə (MISS - go-redis bunu çökmə deyil, sentinel xəta `redis.Nil` kimi bildirir), real mənbəyə düşürsünüz, cavabı yavaş yolla alırsınız və qaytarmazdan əvvəl onu vaxt-yaşama müddəti ilə Redis-ə yazırsınız. Eyni açığın növbəti oxuyucusu HIT alır. Redis heç vaxt verilənlərin YEGANƏ nüsxəsini saxlamadığı üçün, keşi tamamilə itirmək həmişə təhlükəsizdir - yenidən başlama, bitmə, əl ilə flush - növbəti oxuma sadəcə verilənlər bazasından bir-bir yenidən doldurur."
    },
    {
      "h": "TTL niyə: keşin qəsdən BİR AZ səhv olmasına icazə verilir",
      "p": "60 saniyəlik TTL qoymaq açıq qərardır ki, keşlənmiş dəyər real dəyərdən 60 saniyəyə qədər geri qala bilər, əvəzində hər oxumada real verilənlər bazasına dəyməmək sürətini alırsınız. Bu kompromis adətən yaxşıdır. Olmadıqda - qiymət indicə dəyişib və növbəti oxuma tam dəqiq olmalıdır - TTL-i gözləmək əvəzinə açığı yazmada dərhal etibarsızlaşdırın: mənbə dəyişən an onu silin, ona görə növbəti oxuyucu təmiz miss alır və yeni dəyərlə yenidən doldurur. TTL heç kimin xatırlamadığı açarların altındakı təhlükəsizlik torudur; açıq silmə isə əsl önəm daşıyan bir neçəsi üçün sürətli yoldur."
    },
    {
      "h": "SETNX niyə paylanmış lock-dur, sadəcə süslü yazma yox",
      "p": "`SET key value NX` 'yalnız açıq mövcud deyilsə yaz' deməkdir və BİR bölünməz əmr kimi uğur ya uğursuzluqla nəticələnir. Bu vacibdir, çünki əl ilə qurulan lock - 'açığı oxu, boşdursa adımı ora yaz' - oxumaqla yazmaq arasında boşluq buraxır ki, iki çağıran hər ikisi onu boş görüb hər ikisi lock aldığını düşünə bilər. Redis-in tək-thread-li icrası bu boşluğu tamamilə bağlayır: SETNX-in ortasında heç bir başqa əmr işləyə bilmədiyi üçün, yoxlama və yazma bir atomik addım kimi baş verir, ona görə eyni anda eyni açığa yarışan beş çağıranla, dəqiq biri uğur qazanır - hər dəfə, sadəcə adətən yox. Lock-a həmişə öz TTL-ini də verin ki, onu tutarkən çökən çağıran resursu əbədi kilidləməsin."
    },
    {
      "h": "INCR niyə rate limiter-dir, sadəcə süslü sayğac yox",
      "p": "SETNX-i lock kimi təhlükəsiz edən eyni təminat INCR-i sayğac kimi təhlükəsiz edir: bir atomik şəkildə bir əlavə edir və yeni cəmi bir gediş-gəlişdə geri verir, ona görə iki eyni-anlı çağıran heç vaxt hər ikisi eyni köhnə dəyəri oxuyub hər ikisi eyni yeni dəyəri yaza bilməz, səssizcə bir artımı itirmədən. Sabit-pəncərəli rate limiter INCR üstəgəl pəncərənin ilk hit-ində bir dəfə çağırılan bir EXPIRE-dan başqa heç nə deyildir: sayğac həmin pəncərə daxilində limitinizi keçdikdə rədd edirsiniz; pəncərənin TTL-i bitdikdə isə bütün sayğac sadəcə yox olaraq özünü sıfırlayır."
    },
    {
      "h": "Qaçınılmalı uğursuzluq rejimi: Redis-in verilənlər bazası yox, keş olduğunu unutmaq",
      "p": "Bu modulun hər tələsi eyni kök səhvdən qaynaqlanır: Redis-i əslində olduğundan daha davamlı, daha səlahiyyətli, ya da daha koordinasiyalı hesab etmək. Yalnız Redis-də yaşamış verilənlər flush və ya bitmə zamanı yox olur - bu həqiqətən zərər verərsə, real verilənlər bazasına aiddir, Redis isə yalnız birdəfəlik nüsxə saxlamalıdır. Bir çox açığın birlikdə bitməsi (və ya bir çox isti açığın bitməsi) real verilənlər bazasına birdən eyni-anlı miss-lər burğusu göndərə bilər - bunu qatlanmış TTL-lərlə və ya yenidən doldurma ətrafında lock ilə qorumağa dəyər. Və əl ilə GET-sonra-SET ilə qurulan lock və ya sayğac, SETNX və ya INCR əvəzinə, o atomik əmrlərin aradan qaldırmaq üçün mövcud olduğu dəqiq yarışı səssizcə geri gətirir."
    }
  ],
  "m20": [
    {
      "h": "Konsept: klaster qəsdən özünün azlığını itirməyə davam gətirməlidir",
      "p": "Tək verilənlər bazası tərif etibarilə tək uğursuzluq nöqtəsidir - o tək maşını itirin, verilənləri, ya da ən azı əlçatanlığı, o geri gələnə qədər itirirsiniz. Verilənləri bir neçə node-a replika etmək əlçatanlığı düzəldir, amma yeni problem yaradır: indi bir neçə node həqiqətin nə olduğuna görə razılaşmaya bilər. Paylanmış konsensus N müstəqil node-u qəsdən tək etibarlı node kimi davranmağa vadar etmək fənnidir, hər hansı bir azlığın istənilən anda çöküb, yavaşlayıb və ya şəbəkə tərəfindən kəsilməsinə baxmayaraq. Qalan node-lar sadəcə əksəriyyət olmalıdır - bu tələb bu modulun qalanının üzərində qurulduğu şeydir."
    },
    {
      "h": "Necə işləyir: heartbeat-lər, term-lər və lider olmaq üçün rastgələləşdirilmiş yarış",
      "p": "Dəqiq bir node müəyyən 'term' - yalnız artan rəqəm - üçün lider seçilir, ona görə istənilən iki liderlik iddiası həmişə müqayisə edilə bilər və daha yüksək term qalib gəlir. Lider heartbeat-lər göndərir; follower-lər onları eşitdiyi müddətcə heç nə baş vermir - onlar sadəcə izləməyə davam edir. Follower-in öz rastgələləşdirilmiş seçim timeout-u heartbeat olmadan keçən an, liderin getdiyini fərz edir, term-i artırır, namizədə çevrilir və klasterin qalanından səs istəyir. Hər node-un timeout-unu rastgələləşdirmək (hər yerdə bir sabit dəyər istifadə etmək əvəzinə) seçimlərin daim üç-tərəfli bölünməsinin qarşısını alan detaldır: rastgələləşdirilmiş taymerlərlə, bir node-un saatı etibarlı şəkildə əvvəl işə düşür və adətən başqa node hətta cəhd etməyə başlamazdan əvvəl bütün term-i qazanır."
    },
    {
      "h": "Niyə işləyir: jurnal replikasiyası və 'committed'-in mənası",
      "p": "Seçildikdən sonra, lider müştərilərdən yeni əmrləri qəbul etməyə icazəli yeganə node-dur. Hər əmr liderin jurnalında qeydə çevrilir; lider sonra həmin qeydi AppendEntries çağırışı vasitəsilə hər follower-ə replika edir. Ən vacib detal budur: qeyd - tətbiq üçün təhlükəsiz, müştəriyə 'bəli, bu baş verdi' demək üçün təhlükəsiz - node-ların ƏKSƏRİYYƏTİ (lider daxil) onu davamlı saxladığı an 'committed' olur. Lider onu lokal yazdığı an yox (bu sadəcə bir node-dur), və hər tək follower-in ona sahib olduğu an da yox (bu, çökmüş node-u əbədi gözləmək demək ola bilər). Əksəriyyət klasterin azlığı yavaş, əlçatmaz, ya da tamamilə çökmüş olsa belə real irəliləyiş etməyə davam etməsinə imkan verən dəqiq həddir."
    },
    {
      "h": "Şəbəkə bölünməsi niyə iki lider yaratmır",
      "p": "5-node klasteri şəbəkəni kəsərək 2 node-luq və 3 node-luq qrupa bölün - hər iki qrup hələ də işləməyə davam etməyə çalışır. 2-tərəf nə qədər çalışsa da heç vaxt əksəriyyət (5-dən 3) toplaya bilməz - ona görə yeni lider seçə bilmir və yeni yazı commit edə bilmir; sadəcə dayanır, bu təhlükəsizdir, hərçənd narahatedicidir. 3-tərəf öz içində əksəriyyət toplaya BİLƏR, ona görə lider seçir və normal şəkildə yeni qeydlər commit etməyə davam edir. Bölünmə sağalanda, 2-tərəfdəki köhnəlmiş lider (əgər varsa, aşağı term-də) 3-tərəfdən daha yüksək term-i eşidir və dərhal geri çəkilir, onun follower-ləri isə buraxdıqları committed qeydləri tutur. Heç nə hər iki tərəfdən eyni anda qəbul edilmədi, ona görə heç nəyin barışdırılmasına ehtiyac yoxdur - iki canlı 'liderin' hər ikisi sonradan ziddiyyət yarada biləcək yazma qəbul edə biləcəyi sadəlövh primary/backup dizaynından fərqli olaraq."
    },
    {
      "h": "Sharding necə işləyir: consistent hashing və virtual node-lar",
      "p": "Konsensus tək replika olunmuş jurnalı düzgün saxlayır; sharding isə hər hansı bir qrupun hər şeyi saxlamaq (və ya xidmət etmək) məcburiyyətində qalmaması üçün ümumi keyspace-i bir neçə belə qrupa bölmək qərarıdır. Consistent hashing həm node ID-lərini, həm açarları eyni ədədi üzük üzərinə xəritələyir və açar öz mövqeyindən saat əqrəbi istiqamətində ilk çatdığı node-a məxsus olur. Sadə hash(key) % N-dən üstünlük N dəyişən an ortaya çıxır: bir node çıxarmaq yalnız ona işarə edən açarları yenidən xəritələyir, onları yeni saat-əqrəbi qonşusuna verir, digər hər açar isə tam olduğu yerdə qalır. İstehsalat sistemləri həmçinin hər fiziki node-a üzükdə çoxlu mövqe verir ('virtual node-lar') ki, gedən node-un boşaltdığı açarlar boşluğun yanında təsadüfən oturan tək node-a yığılmaq əvəzinə klasterin qalanına bərabər paylansın."
    },
    {
      "h": "Kvorumlar: sürət ilə konsistentlik arasındakı tənzimləyici",
      "p": "'Əksəriyyəti' üç rəqəmə ümumiləşdirin: N cəmi replika, W yazını təsdiqləməli replika sayı və R oxunun müraciət etməli olduğu replika sayı. W + R > N qaydası istənilən yazı kvorumunun və istənilən oxu kvorumunun riyazi olaraq ən azı bir node-da üst-üstə düşməyə məcbur olduğunu təmin edir - ona görə oxu, hansı R node-a müraciət etsə də, ən son commit olunan yazını heç vaxt tamamilə ötürə bilməz. W və ya R-i bu sərhəddən aşağı endirin, oxu/yazmalar sürətlənir və ucuzlaşır, bu təminatın dürüst bahasına: oxu ən son yazını hələ eşitməmiş replikalara tamamilə düşə bilər. Heç bir parametr mücərrəd şəkildə 'düzgün' deyil - bu gecikmə ilə konsistentlik arasında qəsdən bir kompromisdir və istehsalat sistemi ona təsadüfən düşmək əvəzinə sənədləşdirməlidir."
    },
    {
      "h": "Qaçınılmalı uğursuzluq rejimi: bunlardan hər hansını pulsuz hesab etmək",
      "p": "Buradakı hər texnika konkret bir təminat üçün müəyyən gecikmə və ya mühəndislik mürəkkəbliyi mübadilə edir, tələlərin hamısı isə bunu unutmaqdan qaynaqlanır. 'Əl ilə failover-lı primary' bölünmə hər iki tərəfi özünü primary hesab etməyə vadar edən ana qədər real lider seçimindən sadə görünür - mürəkkəblik yox olmadı, sadəcə saat 3-də bir insidentə köçdü. Qeydi lider onu lokal yazan kimi 'committed' adlandırmaq, o lider replika etmədən çökənə qədər yaxşı görünür, o zaman heç kimin heç vaxt almadığı işi səssizcə itirir. Və sürət üçün W + R <= N seçmək tamamilə etibarlı seçimdir - bir şərtlə ki, hamı downstream-də oxuların köhnəlmiş ola biləcəyini bilsin, bunu istehsalatda kəşf etmək əvəzinə."
    }
  ],
  "m18": [
    {
      "h": "Vakansiyanı əməliyyat modeli kimi oxuyun",
      "p": "Bu SRE vakansiyası sadəcə alət adlarını bilən kimsə istəmir. O, bir əməliyyat dövrü təsvir edir: etibarlılığı SLI və SLO-larla təyin edin, sistemi elə instrumentasiya edin ki, reallıq görünsün, yalnız hərəkət lazım olanda alert edin, insidentləri xaos olmadan idarə edin, kök səbəbləri tapın, avtomatlaşdırma ilə toil-i aradan qaldırın və etibarlılıq problemləri deploy olunmazdan əvvəl mühəndislik komandalarına təsir edin. Buna görə düzgün müsahibə cavabı adətən istifadəçi səyahətindən başlayır, sonra alətləri nəticələrə bağlayır: aşağı aşkarlama vaxtı, aşağı bərpa vaxtı, təhlükəsiz deploy-lar və daha az təkrarlanan əl işi."
    },
    {
      "h": "SLI, SLO və error budget müsahibə cavabı",
      "p": "Mikroservis üçün istifadəçiyə görünən davranışa uyğun SLI-lər seçin: uğurlu sorğuların cəmi sorğulara nisbəti, hədd altında p95 və ya p99 gecikmə, növbə tazəliyi, davamlı yazma uğuru, ya da background işin tamamlanma vaxtı. Sonra pəncərə üzrə SLO qoyun: məsələn, 30 gün ərzində ledger köçürmələrinin 99.9%-inin uğurlu olması. Error budget icazə verdiyiniz uğursuzluqdur: 0.1%. Güclü namizəd bu büdcənin release riskini necə idarə etdiyini izah edir. Büdcə sağlamdırsa, göndərə bilərsiniz. Burn rate yüksəkdirsə, riskli dəyişiklikləri dayandırırsınız və mitigasiya edirsiniz. Bu, etibarlılığı fikirdən mühəndislik nəzarətinə çevirir."
    },
    {
      "h": "Önəmli olan dashboard-lar və alert-lər",
      "p": "Dashboard bütün metrikaları topladığınızı sübut etmək yox, bir əməliyyat sualına cavab verməlidir. Sorğu-əsaslı servislər üçün RED istifadə edin: Rate, Errors, Duration. Resurslar üçün USE istifadə edin: Utilization, Saturation, Errors. Üst dashboard əvvəlcə istifadəçi təsirini göstərməlidir: SLO uyğunluğu, error-budget burn-ü, trafik, xəta tezliyi və gecikmə faizləri. İnfrastruktur panelləri bundan aşağıda səbəbləri izah edir. Alert-lər hərəkət ediləbilən olmalı və təcililiyə bağlı olmalıdır. Sürətli-burn SLO alert-i on-call mühəndisini page edir, çünki istifadəçi təsiri sürətlə böyüyür; yavaş burn ticket aça bilər. Yalnız CPU-da page etmək zəifdir, əgər o doymaya və aydın hərəkətə xəritələnmirsə."
    },
    {
      "h": "Telemetriya yığını: OpenTelemetry, Prometheus/Thanos, Tempo və Loki",
      "p": "OpenTelemetry tətbiq sərhədinə aiddir: handler-ləri, müştəriləri, növbələri və verilənlər bazası çağırışlarını bir dəfə instrumentasiya edin, sonra collector vasitəsilə trace-ləri, metrikaları və logları ixrac edin. Prometheus metrikaları scrape edir və alert-ləri qiymətləndirir; Thanos uzun saxlama müddəti, dublikat aradan qaldırma və klasterlər-arası sorğulama verir; Tempo trace-ləri saxlayır; Loki logları indeksləşdirilmiş etiketlərlə saxlayır. Alət siyahısından çox iş axını önəmlidir: SLO burn alert-i metrikadan başlayır, bağlı trace hansı hop-un yavaş olduğunu göstərir, eyni trace ID-li loglar isə konkret hadisəni izah edir. Etiketləri hüdudlu saxlayın, xüsusilə xam URL-lər və ya istifadəçi ID-ləri əvəzinə route şablonları."
    },
    {
      "h": "İnsident cavabı və on-call",
      "p": "Strukturlu on-call bir prosesdir. İnsident zamanı, rolları ayırın: incident commander koordinasiya edir, operations lead mitigasiya edir, communications lead maraqlı tərəfləri yeniləyir, scribe timeline-ı qeydə alır. Birinci məqsəd mükəmməl kök səbəb deyil, mitigasiyadır. Servis sabitləşdikdən sonra günahsız RCA aparın: təsir, timeline, aşkarlama yolu, töhfə verən texniki və proses amilləri, sahibi və son tarixi olan hərəkət maddələri. Güclü müsahibə cavabları həm insanlardan, həm sistemlərdən bəhs edir, çünki əksər insidentlər kod, deployment, monitorinq, proses və kommunikasiya boşluqlarının kombinasiyasıdır."
    },
    {
      "h": "Toil avtomatlaşdırması və platforma nəzərdən keçirməsi",
      "p": "Toil servislə birlikdə miqyaslanan əl ilə, təkrarlanan, avtomatlaşdırıla bilən işdir: eyni diaqnostikanı toplamaq, eyni pod-u yenidən başlatmaq, eyni növbəni yenidən ölçüləndirmək, ya da hər gecə eyni yoxlama siyahısını izləmək. Yaxşı SRE işi toil-i müəyyən edir, ölçür, təhlükəsiz hissəsini avtomatlaşdırır, qoruyucular əlavə edir və avtomatlaşdırmanın insidentləri, ya da sərf olunan dəqiqələri azaldıb-azaltmadığını ölçür. Platforma nəzərdən keçirməsi profilaktik tərəfdir: kod nəzərdən keçirməsi və arxitektura nəzərdən keçirməsi istehsalat səhvi öyrənmədən əvvəl readiness prob-larını, resurs sorğularını, rollout strategiyasını, PDB-ləri, HPA siqnallarını, yük balanslaşdırıcı davranışını, verilənlər anbarı uğursuzluq rejimlərini, secret-ləri və şəbəkə siyasətlərini yoxlamalıdır."
    },
    {
      "h": "Linux, şəbəkə, Kubernetes və OpenShift problem-həlli",
      "p": "Problem-həlli sistemli olmalıdır. Simptomdan başlayıb yığın aşağı hərəkət edin: DNS həlli, TCP bağlantısı, TLS əl sıxma, HTTP status, yük balanslaşdırıcı, servis endpoint-ləri, pod readiness-i, tətbiq logları, verilənlər bazası gecikməsi və node təzyiqi. Sübut alətlərini bilin: `dig`, `curl -v`, `ss`, `journalctl`, `top`, `pidstat`, `iostat`, `tcpdump`, üstəgəl `kubectl get/describe/logs/events`. OpenShift üçün, həmçinin Route-ları, SecurityContextConstraint-ləri və platformanın daha sərt standartlarını anlayın. Müsahibələrdə, əvvəlcə nəyi yoxlayacağınızı və hər nəticənin nəyi sübut edəcəyini və ya aradan qaldıracağını deyin."
    }
  ]
};
window.COURSE_AZ.WORKED_EXAMPLES = {
  "f1": {
    "title": "GOGC-in real yığma prosesini necə idarə etdiyinə baxın",
    "intro": "Qəsdən allokasiya edən kiçik bir proqram - məqsəd pacer-in və GOGC-nin nə vaxt yığma aparacağına necə qərar verdiyini görməkdir, təxmin etmək yox.",
    "steps": [
      {
        "title": "GC-nin görə biləcəyi bir şey allokasiya edin",
        "concept": "Nəyisə tənzimləməzdən əvvəl bizə heap-ə real təzyiq göstərən bir proqram lazımdır - daim üzərinə append etdiyimiz byte buffer-lərdən ibarət slice.",
        "why": "Demək olar ki, heç allokasiya etməyən bir proqramda GC-nin davranışını müşahidə edə bilməzsiniz - pacer-in reaksiya verməsi üçün real heap böyüməsi olmalıdır."
      },
      {
        "title": "Runtime-dan öz haqqında hesabat istəyin",
        "concept": "runtime.ReadMemStats sizə pacer-in özünün istifadə etdiyi canlı rəqəmləri verir: heap ölçüsü və tamamlanmış GC sikllərinin sayı.",
        "why": "Real rəqəmləri oxumaq təxmin etməyin yerini tutur - indi heap-in nə qədər böyüdüyünü və yığıcının faktiki neçə dəfə işlədiyini dəqiq görə bilərsiniz."
      },
      {
        "title": "GOGC-ni azaldın və sikllərin çoxaldığına baxın",
        "concept": "GOGC=100 (standart dəyər) 'canlı heap ikiqat artanda yenidən yığ' deməkdir. Eyni proqramı GOGC=20 ilə işə salsanız, yığıcı çox daha tez-tez işə düşür.",
        "why": "EYNİ proqramın müxtəlif GOGC dəyərləri altında az və ya çox tez-tez yığması, 'GOGC CPU-nu yaddaşa dəyişir' fikrini abstrakt deyil, konkret edir."
      },
      {
        "title": "Baş verən hər sikli izləyin",
        "concept": "GODEBUG=gctrace=1 runtime-ı hər GC sikli üçün bir sətir çap etməyə vadar edir - fasilə vaxtı, heap-in əvvəl/sonrakı ölçüsü və nəyin onu tetiklədiyi.",
        "why": "Bu, dashboard-ların çəkdiyi eyni məlumatdır, sadəcə xam formada - bir sətir gctrace çıxışını oxumağı öyrəndikdən sonra real monitorinq alətindəki GC qrafikləri artıq gurultu kimi görünməyi dayandırır."
      }
    ]
  },
  "f2": {
    "title": "Hot loop-u profilə edin və darboğazı tapın",
    "intro": "Qəsdən yavaş bir funksiyası olan proqram - real `go tool pprof` ilə profilə edilir və oxunur, vaxtın haraya getdiyini təxmin etmədən.",
    "steps": [
      {
        "title": "Hot path-ı CPU profilinə sarın",
        "concept": "pprof.StartCPUProfile sample toplamağa başlayır; StopCPUProfile (defer ilə çağırılır) main qayıdanda qeydə alınmış sample-ları fayla yazır.",
        "why": "Artıq başa düşdüyünüz kodu (məlum-yavaş nested loop) əvvəlcə profilə etmək, hələ anlamadığınız kodu ünvanlamazdan öncə həmin alətə etibar etməyi öyrənməyin yoludur."
      },
      {
        "title": "İşə salın, sonra profili oxuyun",
        "concept": "go run cpu.prof yaradır; go tool pprof -top isə onu oxuyub funksiyaları sərf olunan vaxta görə sıralayır.",
        "why": "Bu, dashboard-ların çəkdiyi məhz eyni məlumatdır, sadəcə mətn formasında - bu cədvəli oxumağı bacardıqdan sonra flame graph elə həmin rəqəmlərin şəklindən başqa bir şey deyil."
      },
      {
        "title": "flat vs cum: hansı sütunun dalınca getmək lazımdır",
        "concept": "flat - həmin funksiyanın öz kodunda sərf olunan vaxtdır; cum isə onun çağırdığı hər şeyi də əhatə edir. main.slow-un flat vaxtı elə dövrün özüdür - burada həqiqətən optimallaşdırmağa dəyən şey.",
        "why": "Yalnız cum%-ə görə optimallaşdırmaq sizi real hotspot-u çağıran wrapper funksiyaları 'düzəltməyə' aparır - flat% isə həqiqətən taktları yandıran koda işarə edir."
      }
    ]
  },
  "f3": {
    "title": "Sıfırdan table-driven test qurun",
    "intro": "Bir funksiya və bir test halından başlayın, sonra onu idiomatik table-driven formaya böyüdün - `go test -v -cover` ilə təsdiqlənmiş.",
    "steps": [
      {
        "title": "Test olunan funksiya",
        "concept": "Hələ heç nə xüsusi deyil - sadəcə əminlik istədiyimiz adi bir funksiya.",
        "why": "Testlər adi funksiyalara qarşı yazılır - Go-da qoşulmalı xüsusi bir interface və ya baza sinfi yoxdur."
      },
      {
        "title": "Test funksiyaları yığını yox, hallar cədvəli",
        "concept": "Hər hal bir sətirdir: girişlər üstəgəl gözlənilən nəticə. t.Run hər sətri öz adlandırılmış subtest-inə çevirir.",
        "why": "4-cü ssenari əlavə etmək indi slice-a bir sətirlik əlavədir - copy-paste edilmiş test funksiyası yoxdur, və uğursuz hal özünü dəqiq adlandırır (məsələn, TestAdd/negatives)."
      },
      {
        "title": "Race detection və coverage ilə işə salın",
        "concept": "go test -v -cover ./... hər subtest-i işə salır və həmin testlərin kodun nə qədərini faktiki işə saldığını bildirir.",
        "why": "Coverage burada göstəriş üçün bir rəqəm deyil - 1 sətirlik funksiyada 100% asan haldır; real kodda test edilməmiş xəta budağını tutan da məhz eyni -cover bayrağıdır."
      }
    ]
  },
  "f4": {
    "title": "İki kanaldan worker pool qurun",
    "intro": "Tam bir fan-out/fan-in pool: jobs daxil olur, kvadratlaşdırılmış nəticələr çıxır, üç worker yükü paylaşır.",
    "steps": [
      {
        "title": "Ortaq kanaldan oxuyan tək bir worker",
        "concept": "Worker sadəcə kanal bağlanana qədər onun üzərində range edən və gələn hər şey üçün eyni işi görən bir funksiyadır.",
        "why": "Worker başqa neçə worker olduğunu nə bilir, nə də vecinə deyil - sonradan onları N-ə qədər fan-out etməyi elə buna görə asanlaşdırır."
      },
      {
        "title": "Üçünü işə salın, bir jobs kanalını paylaşdırın",
        "concept": "Üç goroutine hamısı worker()-i EYNİ kanalda çağırır - kimin hansı işi alacağına kanalın özü qərar verir.",
        "why": "jobs-u bağlamaq hər worker-in `range jobs` dövrünün təbii şəkildə bitməsinə imkan verir - results-u bağlamazdan əvvəl bütün worker-ləri gözləmək isə results-un təhlükəsiz boşaldılmasını təmin edir."
      },
      {
        "title": "İşə salın",
        "concept": "1²+2²+3²+4²+5²+6² = 91 - pool-un, üç goroutine job çəkmək üçün yarışsa belə, düzgün cəmi hesabladığını təsdiqləyin.",
        "why": "HANSI worker-in HANSI işi görəcəyi deterministik olmasa da, nəticə deterministikdir (həmişə 91) - fan-out/fan-in-in sizə vəd etdiyi xüsusiyyət də elə budur."
      }
    ]
  },
  "f5": {
    "title": "Bir context ilə goroutine ağacını ləğv edin",
    "intro": "100ms-lik deadline ilə yarışan iki goroutine - hər ikisi tetiklənən anda EYNİ ləğvetməni müşahidə edir.",
    "steps": [
      {
        "title": "Context-i real işlə yarışdıran worker",
        "concept": "ctx.Done() ilə real iş (burada time.After ilə simulyasiya olunub) arasında select - hansı əvvəl baş verirsə, qalib gəlir.",
        "why": "Bu, ləğv oluna bilən hər goroutine-in olmalı olduğu formadır: heç vaxt sadəcə işin üzərində bloklanmır, həmişə eyni zamanda ctx.Done()-u da izləyir."
      },
      {
        "title": "Qısa deadline, iki worker",
        "concept": "context.WithTimeout 100ms sonra özünü ləğv edən bir context yaradır - hər iki goroutine-in gördüyü 5 saniyəlik 'iş'dən xeyli tez.",
        "why": "Hər iki goroutine EYNİ ctx-dən törəyir, ona görə bir timeout hər ikisini ləğv edir - ləğvetmə ağaclarını işlədən pattern məhz bu bir-context-çoxlu-goroutine yanaşmasıdır."
      },
      {
        "title": "İşə salın: hər ikisi eyni ləğvetməni görür",
        "concept": "Heç bir goroutine 5 saniyəyə yaxın belə gözləmir - hər ikisi deadline-dan millisaniyələr sonra çıxır.",
        "why": "Real bir request handler sadə time.Sleep əvəzinə bu pattern-i istifadə etsəydi, yuxarı axından gələn bir timeout onun işə saldığı hər goroutine-i ləğv edərdi - sızma yox, gözləmə yox."
      }
    ]
  },
  "m19": {
    "title": "Müsahibə LRU keşini qurun: O(1) Get və Put",
    "intro": "Klassik dizayn tapşırığı, müsahibələrin tələb etdiyi şəkildə qurulub: axtarış üçün bir map, sonuncu istifadə sırası üçün əllə yazılmış ikitərəfli bağlı siyahıya qaynaqlanıb - container/list-ə icazə yoxdur.",
    "steps": [
      {
        "title": "Struktur: bağlı siyahıya işarə edən map",
        "concept": "Map O(1)-də 'K açarı haradadır' sualına cavab verir; siyahı isə sonuncu istifadə sırasını saxlayır ki, çıxarılacaq qurban həmişə quyruqda olsun. Sentinel head/tail node-ları siyahının heç vaxt boş olmadığı deməkdir - nil yoxlaması yoxdur, xüsusi hal yoxdur.",
        "why": "Map-də *node pointer-ləri saxlamaq iki struktur arasındaki qaynaqdır: map-in tullanışı birbaşa siyahı node-una düşür, ona görə heç vaxt siyahı skan olunmur. Node öz açarını saxlayır ki, çıxarma zamanı map elementini əks axtarış olmadan silmək mümkün olsun."
      },
      {
        "title": "Pointer cərrahiyyəsi: unlink və pushFront",
        "concept": "Hər keş əməliyyatı bu iki hərəkətə endirilir. unlink node-u harada olursa-olsun oradan kəsir; pushFront isə onu head sentinel-dən dərhal sonra yenidən əlavə edir, beləcə ən son istifadə edilən edir.",
        "why": "Bu, müsahibə aparanların diqqətlə izlədiyi hissədir - əməliyyat başına dörd pointer yazması, düzgün sırada. Sentinel-lər sayəsində siyahıda bir node, çoxlu node və ya heç bir node olanda eyni kod işləyir: n.prev və n.next həmişə mövcuddur."
      },
      {
        "title": "Get və Put: iki hərəkəti birləşdirin",
        "concept": "Get = map axtarışı + önə köçürmə. Put = yerində yeniləmə, ya da əlavə etmə - keş dolu olanda tail sentinel-dən əvvəlki node-u çıxarmaq.",
        "why": "İşi sayın: bir map əməliyyatı üstəgəl sabit sayda pointer yazması - həm Get, həm də Put üçün O(1), bütün tələb elə budur. Çıxarılacaq qurban da O(1)-də tapılır, çünki siyahı onu daim quyruqda saxlayır."
      },
      {
        "title": "Çıxarma sırasını sübut edin",
        "concept": "Tutumu 2 olan bir keş: 1 açarına Get ilə toxunmaq onu çıxarılmaqdan xilas etməlidir, ona görə sonrakı Put(3) 1 əvəzinə 2 açarını çıxarır.",
        "why": "Ortadakı sətir sübutdur: 2 açarı yox olub (false), 1 açarı isə sağ qalıb - Get sonuncu istifadə siyahısını yenidən sıraladı, müsahibə aparanın ilk yoxlayacağı davranış məhz budur. Get node-ları köçürməsəydi, bu test 1-i çıxarardı və keş LRU yox, FIFO olardı."
      }
    ]
  },
  "m1": {
    "title": "Wildcard-ı marşrutlaşdırın, sonra fayl sistemini həbs edin",
    "intro": "{id} wildcard-ı olan real ServeMux marşrutu, üstəlik fiziki olaraq öz qovluğundan qaça bilməyən os.Root sandbox-ı.",
    "steps": [
      {
        "title": "Tiplənmiş wildcard ilə marşrut qeydiyyatdan keçirin",
        "concept": "Pattern-də {id} həmin path seqmentini tutur; r.PathValue(\"id\") onu handler-də geri oxuyur.",
        "why": "httptest.NewRequest + NewRecorder əsl port bağlamadan real marşrutlaşdırma məntiqini işə salmağa imkan verir - standart kitabxananın öz testlərinin istifadə etdiyi eyni hiylə."
      },
      {
        "title": "İşə salın",
        "concept": "Wildcard seqmenti '42' PathValue vasitəsilə cavab body-sinə axır.",
        "why": "Real verilənlər bazası məntiqi əlavə etməzdən əvvəl wildcard tutulmasının izolyasiyada işlədiyini təsdiqləmək, marşrutlaşdırma bağlarının və biznes-məntiq bağlarının eyni anda debug edilməsinin qarşısını alır."
      },
      {
        "title": "Qovluq həbsi açın",
        "concept": "os.OpenRoot bir qovluğa hüdudlanmış *os.Root qaytarır - o handle vasitəsilə açdığınız hər path həmin köklə nisbi həll olunur, ondan heç vaxt çıxa bilməz.",
        "why": "Handler yalnız *os.Root saxladıqda (heç vaxt xam path sətri yox), unudulası heç bir sərhəd yoxlaması qalmır - tip özü həbsi tətbiq edir."
      },
      {
        "title": "Qaçış cəhdi rədd edilir",
        "concept": "EYNİ kökdən ../../etc/passwd açmağı xahiş etmək data/ xaricindəki faylı oxumur - xəta qaytarır.",
        "why": "Bu struktur təhlükəsizlikdir, gələcək refactor-un təsadüfən silə biləcəyi runtime yoxlaması deyil - os.Root traversal-ı data/ xaricindəki hər hansı path-a heç bir syscall toxunmadan rədd edir."
      }
    ]
  },
  "m2": {
    "title": "Map lookup-un dəyərini birbaşa ölçün",
    "intro": "Əksər Go proqramlarının onsuz da yazdığı map[string]float64 lookup-u - benchmark edilib, ona görə 'Swiss Table-lar sürətlidir' iddia yox, rəqəm olur.",
    "steps": [
      {
        "title": "Adi map və comma-ok idiomu",
        "concept": "Map-i indeksləmək miss zamanı sıfır dəyər qaytarır; ikinci qayıdış dəyəri key-in həqiqətən mövcud olub-olmadığını bildirir.",
        "why": "Bu kod köhnə map ilə Go 1.24+ Swiss Table implementasiyası arasında heç dəyişməyib - sürətlənmə eyni sintaksisin arxasında pulsuzdur."
      },
      {
        "title": "Lookup-u benchmark edin",
        "concept": "testing.B-nin b.N döngüsü map artıq qurulduqdan sonra tək map oxunuşunu izolyasiyada vaxtlaşdırır.",
        "why": "b.ResetTimer() setup döngüsünü ölçmədən çıxarır - LOOKUP-u vaxtlaşdırmaq istəyirsiniz, map qurmağa xərclənən vaxtı yox."
      },
      {
        "title": "İşə salın",
        "concept": "1000-yazılı map-da tək lookup, table daxildə necə düzülsə də, bir neçə nanosaniyə başa gəlir.",
        "why": "Bu, Go 1.24 Swiss Table-lara keçəndə örtük altında yaxşılaşan rəqəmdir - eyni benchmark kodu, eyni map tipi, lookup başına daha az cache miss."
      }
    ]
  },
  "m5": {
    "title": "Sətir-səviyyəli kilidləməni mutex ilə modelləşdirin",
    "intro": "SELECT ... FOR UPDATE-in nə verdiyini əks etdirən sadələşdirilmiş yaddaş-daxili ledger - burada əsl Postgres yoxdur, amma istisna prinsipi eynidir və bu sıfır asılılıqla işləyir.",
    "steps": [
      {
        "title": "İki balansa birlikdə toxunan köçürmə",
        "concept": "Kilidlə, köçürmənin hər iki ayağını dəyişdir, açın - kilid real tranzaksiyanın götürəcəyi sətir-səviyyəli kilidin əvəzinə keçir.",
        "why": "Debit və credit hər ikisi EYNİ kilid tutularkən baş verir, ona görə heç bir digər köçürmə heç vaxt yarımçıq bitmiş yeniləməni müşahidə edə bilməz - real tranzaksiyanın sətir kilidinin zəmanət etdiyi tam olaraq budur."
      },
      {
        "title": "İki köçürməni paralel işlədin",
        "concept": "İki goroutine eyni anda əks istiqamətlərdə köçürmə atır.",
        "why": "Kilid olmadan, bu dərslik data race-dir: eyni map yazılarını oxuyub-sonra-yazan iki goroutine yeniləməni tamamilə itirə bilər."
      },
      {
        "title": "İşə salın: invariant qorunur",
        "concept": "A: 500−100+50=450, B: 300+100−50=350, və CƏM heç vaxt dəyişmir, interleaving-dən asılı olmayaraq.",
        "why": "Σ(balances) paralel giriş altında sabit qalması double-entry köçürmələrinin bütün mənasıdır - bu, əsl PostgreSQL sətir kilidinin qoruduğu eyni invariantdır."
      }
    ]
  },
  "m17": {
    "title": "Postgres-ə toxunmazdan əvvəl idempotent ledger yazılarını modelləşdirin",
    "intro": "Postgres sxeminin tətbiq etməli olduğu eyni təhlükəsizlik relslərinin asılılıqsız Go modeli: müsbət məbləğlər, tanınan hesablar, unikal idempotensiya açarları, tək atomic double-entry köçürmə.",
    "steps": [
      {
        "title": "Saxlama sərhədini müəyyən edin",
        "concept": "Store balansları plus idempotensiya map-ini saxlayır. Postgres-də bunlar accounts sətirləri plus transfers üzərində UNIQUE idempotency_key olur.",
        "why": "Bu, verilənlər bazası sərhədinin ən kiçik faydalı modelidir: qorunan dəyişkən vəziyyət və yenidən-cəhdləri təhlükəsiz edən unikallıq çoxluğu."
      },
      {
        "title": "Bir köçürməni atomik tətbiq edin",
        "concept": "Lokal constraint-ləri doğrulayın, idempotensiya açarı ilə deduplikasiya edin, sonra bir kilid tutularkən hər iki balansı dəyişdirin.",
        "why": "Mutex bir verilənlər bazası tranzaksiyasının əvəzinə keçir. İdempotensiya map-i UNIQUE(idempotency_key)-in əvəzinə keçir. Hər ikisi lazımdır: atomiklik balansları qoruyur, unikallıq yenidən-cəhdləri qoruyur."
      },
      {
        "title": "İşə salın: dublikat sorğular ikiqat ödəniş etmir",
        "concept": "İkinci çağırış eyni idempotensiya açarını istifadə edir. İlk köçürmə ID-sini qaytarır və balansları dəyişməz saxlayır.",
        "why": "Çıxış təkrarın ikinci pul hərəkəti yox, birinci nəticənin oxusu olduğunu sübut edir. Postgres-də eyni ideya tranzaksiya plus UNIQUE idempotensiya açarı ilə tətbiq olunur."
      },
      {
        "title": "Gözlənilən çıxış",
        "concept": "Bir köçürmə yaradılır, təkrar eyni identikliyi qaytarır, ümumi balans sabit qalır.",
        "why": "Bu, əsl sxemin HTTP təkrarları, müştəri timeout-ları, worker yenidən başlamaları və tranzaksiya yenidən-cəhdləri altında qorumalı olduğu davranışdır."
      }
    ]
  },
  "m13": {
    "title": "Eyni sayğacı üç yolla qurun",
    "intro": "Əvvəlcə naiv versiyanın -race ilə sınmış olduğunu sübut edin, sonra onu üç fərqli yolla düzəldin - atomic, mutex, kanal - hamısı race-free təsdiqlənib.",
    "steps": [
      {
        "title": "Sınmış versiya",
        "concept": "1000 goroutine-dən heç bir sinxronizasiya olmadan paylaşılan dəyişən üzərində n2++.",
        "why": "Race detektoru bunu tutur, hətta bəzən şansla 'düzgün' rəqəmi çap etsə belə - race bu işin nəticəni korlayıb-korlamamasından asılı olmayaraq bağdır."
      },
      {
        "title": "atomic.Int64 ilə düzəldin",
        "concept": "counter.Add(1) tək bölünməz CPU əməliyyatıdır - heç bir goroutine digərini gözləmək üçün bloklanmır.",
        "why": "Bu, hələ də düzgün olan ən ucuz düzəlişdir - paylaşılan vəziyyət həqiqətən sadəcə sayğac olduqda ona müraciət edin."
      },
      {
        "title": "sync.Mutex ilə düzəldin",
        "concept": "Artırma ətrafında Lock, bitəndə Unlock - eyni anda yalnız bir goroutine total-a toxunur.",
        "why": "Mutex bare sayğac üçün atomic-dən baha başa gəlir, amma invariant birdən çox sahəyə yayıldığı an düzgün (və yeganə düzgün) seçimdir."
      },
      {
        "title": "Kanal ilə düzəldin",
        "concept": "Hər goroutine paylaşılan kanala 1 göndərir; tək toplayıcı goroutine gələn hər şeyi cəmləyir.",
        "why": "Burada heç bir goroutine paylaşılan dəyişənə heç toxunmur - kanal hər '1'-in mülkiyyətini dəqiq bir qəbul edənə ötürür, ona görə yarışacaq heç nə qalmır."
      }
    ]
  },
  "m4": {
    "title": "5-saniyəlik testi ani işlədin",
    "intro": "5 saniyə QABARCIQ zamanı yatan, amma real vaxtın millisaniyələrində bitən əsl testing/synctest testi.",
    "steps": [
      {
        "title": "Testi synctest qabarcığı daxilində işlədin",
        "concept": "synctest.Test funksiyanı öz saxta saatı olan izolə edilmiş qabarcıqda işlədir; daxildəki hər şey, o cümlədən başlatdığı goroutine-lər, o qabarcıqda yaşayır.",
        "why": "Qabarcıq daxilində time.Sleep əslində gözləmir - hər goroutine davamlı bloklandıqdan sonra qabarcığın saatı düz növbəti timer-ə sıçrayır."
      },
      {
        "title": "İşə salın",
        "concept": "go test demək olar sıfır real müddət raport edir, testin öz logladığı 'elapsed' isə tam 5 saniyə qabarcıq zamanı göstərir.",
        "why": "Öz kodu 5 tam saniyə ölçən test üçün 0.00s - bütün mahiyyət budur: heç bir real divar-saatı gözləməsi olmadan deterministik timer davranışı, həqiqi time.Sleep-əsaslı testin riskə atacağı CI flakiness-i də yoxdur."
      },
      {
        "title": "'Yat və uman'-ı synctest.Wait ilə əvəz edin",
        "concept": "Klassik flaky nümunə ləğv-sonra-100ms-yat-sonra-təsdiqlədir. synctest.Wait dəqiq versiyadır: qabarcıqdakı hər digər goroutine davamlı bloklandıqda dəqiq qayıdır - yəni worker tam reaksiya verib.",
        "why": "Wait-in NƏ ETMƏDİYİNƏ diqqət edin: saxta saatı irəli aparmır, yalnız durğunluğu gözləyir. Bunu başqa goroutine-in etdiyiniz şeyə reaksiya olaraq yenilədiyi vəziyyəti təsdiqləmək üçün istifadə edin - ixtiyari yuxu yoxdur, təsdiq ilə reaksiya arasında yarış yoxdur."
      },
      {
        "title": "İtirilmiş siqnal əbədi yox, sürətlə uğursuz olur",
        "concept": "Qabarcıqdakı hər goroutine davamlı bloklanıbsa və heç bir timer heç vaxt atəş edə bilmirsə, bu deadlock-dır - qabarcıq CI timeout-una qədər asılmaq əvəzinə testi dərhal uğursuz edir.",
        "why": "Qabarcıqdan kənarda bu test tam test timeout-u qədər asılıb nəhəng oxunmaz stack dump verərdi. Qabarcıq daxilində runtime heç nəyin goroutine-i heç vaxt oyatmayacağını SÜBUT edə bilir, ona görə 'hər kəs hər kəsi gözləyir' bağları ilk işdə deterministik şəkildə üzə çıxır."
      }
    ]
  },
  "m3": {
    "title": "runtime.AddCleanup-un tam bir dəfə işə düşməsini izlə",
    "intro": "Garbage Collector-un onun əlçatmaz olduğunu sübut etdiyi an cleanup-ı bir mesaj çap edən saxta bağlantı - nə finalizer, nə dirilmə.",
    "steps": [
      {
        "title": "Obyekt yaradılanda bir cleanup əlavə et",
        "concept": "runtime.AddCleanup ptr əlçatmaz olduqdan SONRA işə düşəcək bir funksiya qeydiyyatdan keçirir. O, fd-ni dəyər kimi capture edir, *Conn-un özünü yox.",
        "why": "fd-ni (c-ni yox) dəyər kimi capture etmək o deməkdir ki, cleanup c-nin özü yox olduqdan sonra belə təhlükəsiz işləyə bilər - dereference ediləcək heç nə qalmır."
      },
      {
        "title": "İstifadə et, sonra scope-dan çıxmasına icazə ver",
        "concept": "Yaratma və istifadəni öz funksiyalarının içinə qoy ki, həmin funksiya qayıtdıqdan sonra *Conn-un heç bir əlçatan istinadı qalmasın.",
        "why": "main-də (və ya uzun-ömürlü bir closure-da) oturan bir istinad obyekti qeyri-müəyyən müddətə əlçatan saxlayardı - cleanup yalnız heç nə ona çata bilmədikdə işə düşür."
      },
      {
        "title": "Bir GC keçidini məcbur et və cleanup goroutine-inə işləmək üçün vaxt ver",
        "concept": "Cleanup-lar obyekt öldükdən müəyyən vaxt sonra ayrı bir goroutine-də işləyir - runtime.GC() bu 'müəyyən vaxt'ı demo üçün indi baş verdirir.",
        "why": "Production kodunda heç vaxt runtime.GC()-i belə əl ilə çağırmazdınız - o, yalnız burada, əks halda gec-tez baş verəcək bir cleanup-ı qısa bir demoda müşahidə edilə bilən etmək üçündür."
      },
      {
        "title": "İşlət",
        "concept": "Cleanup mesajı 'using conn' ilə 'done' arasında görünür - obyekt öldükdən sonra tam bir dəfə işlədiyinin sübutu.",
        "why": "Bunu SetFinalizer ilə müqayisə et, o, bunu bütöv bir əlavə GC dövrü qədər gecikdirə bilərdi və ya obyekt 'dirildilsə' onu keçə bilərdi - AddCleanup sizə bu uğursuzluq rejimlərindən heç birini vermir."
      }
    ]
  },
  "m7": {
    "title": "NumGoroutine ilə bir goroutine sızmasını tut",
    "intro": "Heç kimin göndərmədiyi bir kanalda əbədi bloklanmış beş goroutine - sızma analizatorunun düşündüyü kimi, əvvəl və sonra sayılmış.",
    "steps": [
      {
        "title": "Mümkün göndərəni olmayan bir goroutine",
        "concept": "Goroutine <-ch üzərində bloklanır, amma ch lokaldır və başqa heç nə onun üzərində göndərmək üçün bir istinad saxlamır.",
        "why": "Bu, heç bir görünən xəta olmadan kompilyasiya olunur və işləyir - sızmalar təbiətcə səssizdir, məhz buna görə onları saymağın bir yoluna ehtiyacınız var."
      },
      {
        "title": "Əvvəl və sonra goroutine-ləri say",
        "concept": "runtime.NumGoroutine() hazırda, sızmış olsun-olmasın, dəqiq neçə goroutine mövcud olduğunu bildirir.",
        "why": "Real bir servisdə runtime/metrics və ya expvar vasitəsilə export edilən eyni bu rəqəm, 'goroutine sayı artmaqda davam edir' üzərindəki bir dashboard alarmının izlədiyi şeydir."
      },
      {
        "title": "İşlət",
        "concept": "Tam 5 goroutine ilişib qalır - hər leaky() çağırışı üçün bir dənə, heç vaxt geri qazanılmır.",
        "why": "Hər sızmış goroutine prosesin ömrü boyu öz stack-ini və capture etdiyi hər şeyi saxlayır - beş bir maraqlı haldır, beş min isə bir insidentdir."
      }
    ]
  },
  "m8": {
    "title": "Müstəqil akkumulyatorların bir cəmi necə sürətləndirdiyini ölç",
    "intro": "Eyni massiv iki yolla cəmlənir - bir asılılıq zənciri vs dörd müstəqil zəncir - 'təlimat-səviyyəli paralellik'i bir şüar əvəzinə real bir rəqəm etmək üçün benchmark edilib.",
    "steps": [
      {
        "title": "Tək-akkumulyator baza xətti",
        "concept": "Hər += əvvəlkinin bitməsindən asılıdır - CPU-nun qabağa qaça bilmədiyi, tək, qırılmaz bir asılılıq zənciri.",
        "why": "Bu, bir cəm yazmağın açıq-aşkar yoludur - və məhz CPU-nun sırasız icra mühərrikini müstəqil işdən ac saxlayan formadır."
      },
      {
        "title": "Dörd müstəqil akkumulyator",
        "concept": "İşi bir-birindən asılı olmayan dörd zəncirə böl, sonra sonda dörd qismi cəmi topla.",
        "why": "Dörd zəncirin bir-birindən asılılığı yoxdur, ona görə nüvə növbətini başlatmazdan əvvəl hərəsinin bitməsini gözləmək əvəzinə eyni anda bir neçə toplama əməliyyatını havada saxlaya bilər."
      },
      {
        "title": "İkisini də eyni data üzərində benchmark et",
        "concept": "testing.B hər versiyanı 1,000,000-elementlik bir slice üzərində vaxtlayır, setup isə b.ResetTimer ilə istisna edilir.",
        "why": "EYNİ arifmetikadan, prinsipcə eyni təlimat sayından ~2.6× daha sürətli - 'yaddaş-bağlı və ILP-bağlı kod ağıllı alqoritmləri döyür' bir ölçü olaraq belə görünür."
      }
    ]
  },
  "m10": {
    "title": "Bitişik yaddaşı pointer qovmasına qarşı benchmark et",
    "intro": "Tam eyni cəm, dəyərlərin slice-ı ilə pointer-lərin slice-ı üzərindən hesablanır - müqayisə dürüst olsun deyə pointer-lər qarışdırılaraq ölçülür.",
    "steps": [
      {
        "title": "Bitişik bir slice-ı cəmlə",
        "concept": "Sadə bir []int64 - hər dəyər bir yaddaş blokunda arxa-arxaya oturur.",
        "why": "Bunu sırayla gəzmək məhz bir cache line doldurmasının nəzərdə tutulduğu giriş nümunəsidir: bir miss gələcək bir neçə dəyərlik oxumanı isindirir."
      },
      {
        "title": "Eyni dəyərləri pointer-lər vasitəsilə cəmlə",
        "concept": "Eyni cəm, eyni riyaziyyat - amma indi hər dəyər öz heap ünvanında yaşayır və biz pointer sırasını qarışdırırıq ki, lokallıq gizli şəkildə geri sızmasın.",
        "why": "Qarışdırmaq önəmlidir: bir bump allocator heap ünvanlarını aldadıcı şəkildə ardıcıl bir sırada verə bilər, bu da uzun-ömürlü bir proqramda pointer qovmasının real xərcini az göstərərdi."
      },
      {
        "title": "İkisini də benchmark et",
        "concept": "go test -bench=. hər iki versiyanı 2,000,000 int64 üzərində vaxtlayır.",
        "why": "YALNIZ düzülüşdən ~1.7× yavaş - eyni CPU, eyni riyaziyyat, eyni cəm. Bu, 'linked strukturlar yox, slice istifadə et' arqumentinin tamamının bir fikir əvəzinə bir ölçü olaraq görünüşüdür."
      }
    ]
  },
  "m11": {
    "title": "Bir branch-i proqnozlaşdırıla bilən et və sürətlənməni izlə",
    "intro": "Bir dövr, bir hədddən yuxarı dəyərləri cəmləyir - əvvəlcə qarışdırılmış datada, sonra ƏVVƏLCƏ sıralanmış EYNİ datada işlədilir.",
    "steps": [
      {
        "title": "Dataya-asılı branch olan dövr",
        "concept": "`v >= threshold`-un doğru olub-olmaması tamamilə datadan asılıdır - kompilyatorun əvvəlcədən bilməsinin heç bir yolu yoxdur.",
        "why": "Bu tamamilə adi koddur - heç nəyi bir performans tələsinə oxşamır, məhz buna görə branch misprediction insanları təəccübləndirir."
      },
      {
        "title": "Onu təsadüfi datada benchmark et",
        "concept": "1,000,000 təsadüfi bayt, hədd 128 - branch heç bir müəyyən nümunə olmadan təxminən 50/50 dəyişir.",
        "why": "50/50 proqnozlaşdırıla bilməyən bir branch bir branch predictor üçün ən pis haldır - təxmindən yaxşı heç nə edə bilmir, ona görə vaxtın təxminən yarısında yanılır."
      },
      {
        "title": "EYNİ datanı sırala, yenidən benchmark et",
        "concept": "sort.Slice sumAbove-un nəyi hesabladığını dəyişmir - branch nəticələrinin gəldiyi SIRAnı dəyişir.",
        "why": "EYNİ təlimatlar və eyni Big-O ilə ~1.6× daha sürətli - sıralanmış data branch-i predictor-un demək olar ki, dərhal öyrəndiyi uzun yalan…yalan…doğru…doğru seriyalarına çevirir."
      }
    ]
  },
  "m12": {
    "title": "100,000 goroutine başlat və onların gəlib-getdiyini izlə",
    "intro": "GOMAXPROCS, NumGoroutine və goroutine-lərin həqiqətən altı rəqəmli sayda başlada biləcək qədər ucuz olduğunu sübut edən bir fan-out.",
    "steps": [
      {
        "title": "Başlanğıc rəqəmləri yoxla",
        "concept": "GOMAXPROCS(0) cari parametri (dəyişdirmədən) oxuyur; NumGoroutine() canlı sayı bildirir - başlanğıcda cəmi 1 (main).",
        "why": "GOMAXPROCS P sayıdır - neçə goroutine-in həqiqətən paralel işlədiyinin sərt tavanı - halbuki NumGoroutine BÜTÜN goroutine-ləri sayır, işləyən və ya park edilmiş."
      },
      {
        "title": "Dərhal park olunan 100,000 goroutine başlat",
        "concept": "Hər biri <-release üzərində bloklanır - yaratmaq ucuzdur, CPU-nu yandırmaq əvəzinə park olunub.",
        "why": "100,000 OS thread-i əksər sistemləri tükəndirərdi; 100,000 park edilmiş goroutine isə demək olar ki, hiss olunmur, çünki park edilmiş bir goroutine kiçik bir stack-ə başa gəlir, kernel thread-inə yox."
      },
      {
        "title": "Onları buraxın və geri qazanıldıqlarını təsdiqləyin",
        "concept": "release-i bağlamaq onların hamısını eyni anda blokdan çıxarır; wg.Wait() hamısının həqiqətən çıxdığını təsdiqləyir.",
        "why": "Tam olaraq 1 goroutine-ə qayıdır - heç nə sızmayıb, çünki hamısının oyandırılmaq üçün bir yolu vardı. Bunu M7-nin leaky() nümunəsi ilə müqayisə edin, orada məhz bu çatışmır."
      }
    ]
  },
  "m6": {
    "title": "Real postkvant açar mübadiləsi işlədin",
    "intro": "Go-nun crypto/mlkem paketi ML-KEM-768-i real şəkildə implementasiya edir - açar cütü yaradın, encapsulate/decapsulate edin və onu klassik X25519 ilə birləşdirin.",
    "steps": [
      {
        "title": "ML-KEM-768 açar cütü yaradın",
        "concept": "GenerateKey768 dekapsulyasiya açarı qaytarır; EncapsulationKey() ondan açıq yarını törədir.",
        "why": "Klassik Diffie-Hellman-dan fərqli olaraq, KEM-lərin bu asimmetrik forması var - bir tərəf açar cütü yaradır, digər tərəf isə ortaq sirri müzakirə etmək əvəzinə YARATMAQ üçün açıq yarını istifadə edir."
      },
      {
        "title": "Ortaq sirri encapsulate və decapsulate edin",
        "concept": "Alice-in Encapsulate() metodu ortaq sirr VƏ şifrmətn yaradır; Bob-un Decapsulate(şifrmətn) metodu öz məxfi açarından eyni sirri bərpa edir.",
        "why": "Yalnız DEKAPSULYASİYA açarına sahib olan şəxs şifrmətndən sirri bərpa edə bilər - şifrmətni (və açıq açarı) görən dinləyici, kvant kompüteri ilə belə, bunu bacarmaz."
      },
      {
        "title": "Hibrid açar üçün X25519 ilə birləşdirin",
        "concept": "ML-KEM mübadiləsi ilə yanaşı klassik ECDH mübadiləsi işlədin, sonra hər iki sirri bir sessiya açarına hash edin.",
        "why": "Hər iki sirri qarışdırmaq o deməkdir ki, sessiyanı sındırmaq HƏR İKİ problemi - diskret loqarifm VƏ qəfəs çətinliyini - sındırmağı tələb edir, bu da məhz hibrid postkvant TLS-dəki 'hibrid'dir."
      }
    ]
  },
  "m9": {
    "title": "Real readiness probe qurun",
    "intro": "Background isinmə bitənə qədər uğursuz olan real HTTP handler - httptest ilə hər iki vəziyyəti görmək üçün iki dəfə probланmışdır.",
    "steps": [
      {
        "title": "Readiness bayrağını yoxlayan handler",
        "concept": "atomic.Bool hər probda oxunur; false olduğu müddətcə, handler sağlamlığa bənzəmək əvəzinə 503 qaytarır.",
        "why": "Real readiness yoxlaması REAL vəziyyəti (DB bağlıdır, keşlər isindir) əks etdirməlidir - burada atomic.Bool sizin real isinmə şərtiniz üçün yer tutucudur."
      },
      {
        "title": "Onu çevirən background isinmə",
        "concept": "warmUp öz goroutine-ində işləyir və yalnız qurulum işi bitdikdə serveri hazır kimi işarələyir.",
        "why": "Bunu goroutine-də etmək o deməkdir ki, proses dərhal bağlantı qəbul etməyə başlaya bilər - o, sadəcə isinmə bitənə qədər 'hazır deyil' deyə dürüst cavab verir."
      },
      {
        "title": "İsinmədən əvvəl və sonra problayın",
        "concept": "httptest.NewServer real (lokal) HTTP server işə salır ki, http.Get deploy olunmuş pod-a qarşı olduğu kimi dəqiq davransın.",
        "why": "Bu 503-sonra-200 ardıcıllığı məhz Kubernetes readiness probe-unun real rollout zamanı gördüyüdür - yeni pod-un yoxlama çevrilənə qədər heç bir trafik almamasının səbəbi budur."
      }
    ]
  },
  "m14": {
    "title": "Strukturlaşdırılmış loglar və sorğu-əhatəli logger yayımlayın",
    "intro": "log/slog With ilə bir dəfə bağlanan paylaşılan sahələrlə real JSON log sətirləri yaradır - üstəgəl minimal RED-tərzi sayğac.",
    "steps": [
      {
        "title": "JSON strukturlaşdırılmış logger",
        "concept": "slog.NewJSONHandler hər log çağırışını interpolyasiya edilmiş sətir yox, açıq açar/dəyər sahələri olan bir JSON obyektinə çevirir.",
        "why": "JSON sətri log boru kəmərinin indeksləyib süzgəcdən keçirə biləcəyi şeydir (level, port, ...) - \"server started on 8080\" kimi formatlanmış sətir isə sadəcə grep ediləcək mətndir."
      },
      {
        "title": "Sorğu-əhatəli sahələri bir dəfə bağlayın",
        "concept": "logger.With(...) həmin sahələri hər sonrakı çağırışın əvvəlinə əlavə edən yeni logger qaytarır - onu sorğu başına bir dəfə bağlayın, hər log sətrində yox.",
        "why": "Bu sorğudan gələn hər sətir indi avtomatik trace_id daşıyır - bu, konkret sorğudan hər log sətrini çəkmək üçün grep edəcəyiniz sahədir."
      },
      {
        "title": "Minimal RED-tərzi metrika sayğacı",
        "concept": "cəmi sorğular və cəmi xətalar üçün atomik sayğaclar - real metrika kitabxanasının izlədiyinin ən sadə mümkün versiyası.",
        "why": "Bu, RED-in Rate və Errors hissəsinin ən sadə mümkün formasıdır - real implementasiya atomic.Int64-ü Prometheus sayğacı ilə əvəz edir, amma izlədiyiniz şeyin forması dəyişmir."
      }
    ]
  },
  "m15": {
    "title": "Backoff ilə retry edin, sonra circuit breaker əlavə edin",
    "intro": "İki dəfə uğursuz olub sonra uğur qazanan çağırış - təhlükəsiz retry edilir - ardınca həqiqətən çökmüş asılılığı çağırmağı dayandırmağı öyrənən breaker.",
    "steps": [
      {
        "title": "Kövrək çağırış və məhdudlaşdırılmış retry dövrü",
        "concept": "withRetry yalnız sentinel errTransient-də retry edir, eksponensial backoff + jitter ilə gözləyir və 5 cəhddən sonra, ya da context ləğv olunarsa təslim olur.",
        "why": "Retry dövrü daxilində ctx.Done()-u yoxlamaq o deməkdir ki, sorğu-səviyyəli deadline retry-ləri hələ də qısaldır - backoff və deadline-lar bir-biri ilə mübarizə etmək əvəzinə birləşir."
      },
      {
        "title": "İki dəfə uğursuz olan çağırışa qarşı işlədin",
        "concept": "flakyCall 0 və 1 cəhdlərində uğursuz olur, 2 cəhdində uğur qazanır - withRetry çağıranın heç nə bilmədən bərpa olmalıdır.",
        "why": "ÇAĞIRANIN baxış nöqtəsindən bu sadəcə uğur qazandı - məqsəd budur: keçici uğursuzluqlar işi soruşan üçün görünməz olmalıdır, xəta kimi ötürülmək yox."
      },
      {
        "title": "Əmin olduqdan sonra sürətlə uğursuz olan circuit breaker",
        "concept": "`threshold` ardıcıl uğursuzluqdan sonra, Call `cooldown` ərzində dərhal errOpen qaytarır - fn()-ə heç bir çağırış olmadan - soyuma müddəti bitənə qədər.",
        "why": "3-cü çağırış fn()-i heç çağırmadı - bu 'sürətlə uğursuz ol' xüsusiyyətidir: breaker asılılığın çökmüş olduğuna əmin olan kimi, artıq uğursuz olacağını gözlədiyi çağırışa vaxt və yük itirməyi dayandırır."
      }
    ]
  },
  "m16": {
    "title": "Sadə Get/Set-dən keşə, lock-a və rate limiter-ə",
    "intro": "Real Redis-ə qarşı dörd kiçik, real proqram: TTL ilə ən sadə mümkün yazma, tam cache-aside gediş-gəliş, bir lock üçün yarışan beş goroutine və 6-cı sorğunu rədd edən atomik sayğac.",
    "steps": [
      {
        "title": "Addım 1 - Konsept: hər dəyər öz bitmə vaxtını daşıya bilər",
        "concept": "Redis müştərisi sadəcə bağlantıdır. Set üçüncü arqument kimi TTL alır - o vaxt keçdikdən sonra, Redis açığı özü silir, başqa heç nə lazım deyil.",
        "why": "İlkin default olaraq TTL bağlamaq - hər hansı real keşləmə naxışından əvvəl, elə burada - o deməkdir ki, heç kimin təmizləməyi xatırlamadığı açar hələ də əbədi yaşaya bilmir. Bu bütün modulda ən ucuz təhlükəsizlik torudur."
      },
      {
        "title": "Addım 2 - Necə işləyir: başdan sona cache-aside",
        "concept": "getPrice əvvəlcə Redis-i yoxlayır. redis.Nil (çökmə yox) miss deməkdir, ona görə qəsdən yavaş 'verilənlər bazası' çağırışına düşür, nəticəni keşləyir və qaytarır - eyni açıq üçün ikinci çağırış yavaş yolu tamamilə atlayır.",
        "why": "errors.Is(err, redis.Nil)-i konkret olaraq yoxlamaq - sadəcə \"err != nil\" əvəzinə - normal keş miss-in Redis kəsintisi kimi rəftar edilməsinin qarşısını alan şeydir. Bunlar çox fərqli iki problemdir və bu sətir onları ayırır."
      },
      {
        "title": "Addım 3 - Niyə yarışsızdır: beş çağıran, bir SETNX, bir qalib",
        "concept": "Beş goroutine eyni anda EYNİ açıqda SetNX çağırır. Redis-in tək-thread-li icrası, goroutine-lərin necə planlaşdırıldığından asılı olmayaraq, dəqiq birinin ok == true almasını təmin edir.",
        "why": "Bunu bir neçə dəfə işlədib fərqli qalib görmək bug deyil, elə məqsəddir: bu, nəticənin həqiqi yarış olduğunu sübut edir, hər dəfə yalnız bir qalibi zəmanət edən şeyin isə şans yox, Redis-in atomikliyi olduğunu göstərir."
      },
      {
        "title": "Addım 4 - Niyə yarışsızdır: INCR rate limiter-ə çevrilir",
        "concept": "allow açar-üzrə sayğacı atomik şəkildə artırır; pəncərədəki İLK artım eyni zamanda həmin açığın bitmə vaxtını da təyin edir, ona görə sayğac pəncərə keçdikdən sonra özünü sıfırlayır.",
        "why": "Bu, lock əvəzinə saymanın SETNX ilə eyni atomikliyidir - Incr-in bir gediş-gəlişi iki eyni-anlı sorğunun hər ikisi count=2 oxuyub hər ikisi count=3 yazmasının, bu da səssizcə bir artıq sorğu buraxacaqdı, qarşısını alan şeydir."
      }
    ]
  },
  "m20": {
    "title": "Heartbeat-lər və rastgələləşdirilmiş timeout-larla lider seçimini simulyasiya edin",
    "intro": "Kiçik, tam, asılılıqsız Go proqramı: üç yaddaş-daxili node rastgələləşdirilmiş seçim timeout-ları ilə yarışır, ilk işə düşən namizədə çevrilir və əksəriyyət səsi qazanır, sonra yeni lider bir jurnal qeydini hər iki follower-ə replika edir və əksəriyyət - hamısı yox - onu təsdiqləyən an commit edir.",
    "steps": [
      {
        "title": "Addım 1 - Konsept: hər node öz rastgələləşdirilmiş seçim timeout-unu seçir",
        "concept": "electionTimeout sabit aralıqda rastgələ müddət qaytarır. Üç node hər biri birini alır; hansı timeout ƏN KİÇİKDİRSƏ, hansı node-un əvvəl vaxtının bitib namizədə çevrildiyini müəyyən edir.",
        "why": "Timeout-u hər node üçün rastgələləşdirmək - hər yerdə bir sabit dəyər istifadə etmək əvəzinə - üç node-un eyni anda hamısı namizədə çevrilib səsi dəfələrlə bölməsinin qarşısını alan şeydir. Bir node-un taymeri etibarlı şəkildə əvvəl işə düşür."
      },
      {
        "title": "Addım 2 - Necə işləyir: namizəd konkurent şəkildə səs istəyir",
        "concept": "requestVote bir follower-in səsini verib-verməyəcəyinə qərar verməsini simulyasiya edir, hər follower üçün goroutine kimi işlədilir - məhz real səs sorğularının şəbəkə üzərində bir az fərqli vaxtlarda çatacağı kimi. Namizəd özünü üstəgəl verilmiş hər səsi sayır.",
        "why": "Hər RequestVote-u konkurent göndərmək (hər follower üçün bir goroutine) real klasterin səsləri şəbəkə üzərində paralel topladığını əks etdirir - namizəd node 1-ə soruşmazdan əvvəl node 0-ın bitməsini gözləmir."
      },
      {
        "title": "Addım 3 - Niyə işləyir: əksəriyyət təsdiqləyən an commit edin, hamısı deyil",
        "concept": "Namizəd əksəriyyət səs topladığı kimi lider olur və bir jurnal qeydini eyni şəkildə - konkurent olaraq - replika edir, amma özü daxil olmaqla əksəriyyət təsdiqi əldə edən kimi saymağı dayandırır.",
        "why": "Dövr şərti 'i < n-1 && acked < majority' bütün məqsəddir: əksəriyyətə çatan an cavabları oxumağı (və proqramı davam etdirməyi) dayandırır, ona görə bir yavaş və ya əlçatmaz follower klasterin irəliləməsini heç vaxt blok edə bilməz."
      },
      {
        "title": "Addım 4 - Proqnoz: bir neçə dəfə işlədin - fərqli node qazanır, amma təminat qalır",
        "concept": "Tam proqramı (go run .) `go run -race` altında beş dəfə ardıcıl işlədin və hər dəfə kimin lider olduğunu müqayisə edin.",
        "why": "Bu, Redis modulundakı SETNX ilə eyni dərsdir, yığının bir mərtəbə yuxarısında: hansı node-un yarışı qazanacağı heç vaxt zəmanətli deyil və heç vaxt olmamalıdır - amma onlardan dəqiq birinin qazanması, hər dəfə, alqoritmin verdiyi əsl təminatdır."
      }
    ]
  },
  "m18": {
    "title": "Go-da SLO büdcəsini və burn rate-i hesablayın",
    "intro": "Servis SLO-sunu on-call mühəndisinin hərəkət edə biləcəyi rəqəmlərə çevirən kiçik standart-kitabxana proqramı: əlçatanlıq, icazə verilən pis hadisələr, burn rate və cavab səviyyəsi.",
    "steps": [
      {
        "title": "Dövri SLO pəncərəsini modelləşdirin",
        "concept": "Pəncərəyə cəmi hadisələr, pis hadisələr və SLO hədəfi lazımdır. Qalan hər şey bu üç faktdan törəyir.",
        "why": "SRE cavabını əsaslı saxlamağın yolu budur: dashboard ekran görüntüsündən və ya infrastruktur simptomundan yox, ölçülən istifadəçiyə-görünən hadisə axınından başlamaq."
      },
      {
        "title": "Əlçatanlığı və error budget-i hesablayın",
        "concept": "Əlçatanlıq yaxşı hadisələrin cəmi hadisələrə bölünməsidir. Error budget cəmi hadisələrin icazə verilən uğursuzluq payına vurulmasıdır.",
        "why": "99.9% kimi SLO hədəfi yalnız cari pəncərədə neçə pis hadisəyə icazə verildiyini deyə bildikdə əməliyyat mənası qazanır."
      },
      {
        "title": "Büdcə xərcini hərəkətə çevirin",
        "concept": "Burn rate real pis hadisələri icazə verilən pis hadisələrlə müqayisə edir. Aşağı burn büdcə istifadəsidir; yüksək burn əməliyyat riskidir.",
        "why": "Bu, səs-küylü alert ilə faydalı alert arasındakı müsahibə fərqidir: page servisin istifadəçiyə-görünən etibarlılığı nə qədər sürətlə yandırdığına bağlıdır."
      },
      {
        "title": "Hesablamanı işlədin",
        "concept": "Bir milyon köçürmə cəhdi, 2500 uğursuzluq və 99.9% SLO servisin pəncərədə 2.5 büdcə xərclədiyi deməkdir.",
        "why": "Bu cavab müsahibə lövhəsi üçün kifayət qədər yığcamdır, amma əsl SRE mühakiməsini ehtiva edir: etibarlılıq ölçülür, büdcələnir və hərəkətə bağlanır."
      }
    ]
  }
};
