/* =====================================================================
   COURSE DATA - AZERBAIJANI
   Mirrors data.js. COURSE_AZ is allowed to be PARTIAL: mergeCourse in
   app.js overlays whatever is here onto the English base, so any
   not-yet-translated field/module falls back to English instead of
   crashing or rendering blank (see AGENTS.md's i18n section).
   ===================================================================== */

const COURSE_META_AZ = {
  title: "Hardcore Go və Paylanmış Sistemlər Mühəndisliyi",
  subtitle: "Başlanğıc Əsaslardan - Senior / Staff / Principal Səviyyəsinə",
  tagline:
    "Idiomatik Go yazmaqla başlayın - horutinlər, kanallar, xətalar, testlər - sonra runtime-ın və avadanlığın dərinliyinə enin, və Go 1.24–1.26 üzərində xarici asılılıqsız, postkvant təhlükəsiz Distributed Financial Ledger qurun.",
  target: "go 1.26 (CI vasitəsilə ciddi tələb olunur)",
  capstone: "Distributed Financial Ledger",
  ledgerRoadmap: {
  "f4": {
    "title": "Ledger komanda pipeline-ı",
    "body": "Transfer əmrlərini qəbul edən, doğrulama işini fan-out edən və ləğv altında təmiz şəkildə söndürülən, məhdud goroutine/channel pipeline-ı qurun."
  },
  "m19": {
    "title": "Hot-account LRU cache",
    "body": "İstifadədə olan hesab balanslarını yaddaşda saxlayan O(1) LRU cache-i, üstəlik transfer zəncirlərini doğrulamaq üçün istifadə olunan BFS-tərzi asılılıq gəzintisini əlavə edin."
  },
  "f5": {
    "title": "Sorğu lifecycle-ı və xəta müqaviləsi",
    "body": "Hər ledger sorğusunun bir sahibi və bir müşahidə oluna bilən uğursuzluq yolu olması üçün context ötürülməsini, bükülmüş domain xətalarını və package sərhədlərini müəyyən edin."
  },
  "f3": {
    "title": "İnvariant test poliqonu (harness)",
    "body": "Sistem paylanmış olmazdan əvvəl ledger invariant-larını cədvəl testləri, subtest-lər, fuzz halları və test double-ları ilə bərkidin."
  },
  "f1": {
    "title": "Davamlı throughput üçün yaddaş büdcəsi",
    "body": "Uzunmüddətli yük altında ledger ingestion-un proqnozlaşdırıla bilən qalması üçün GC və ayırma disiplinini qurun."
  },
  "f2": {
    "title": "Real bottleneck-lər üçün profilləşdirmə dövrü",
    "body": "Ledger CPU, heap və goroutine xərclərinin həqiqətən hardan gəldiyini sübut edən pprof iş axınlarını əlavə edin."
  },
  "m1": {
    "title": "HTTP API və məhdudlaşdırılmış IO sərhədi",
    "body": "Xarici asılılıqsız ledger API-ni ortaya çıxarın və fayl girişini təhlükəsiz, audit edilə bilən kökün daxilində saxlayın."
  },
  "m2": {
    "title": "Wire formatı və hot yaddaş-daxili indekslər",
    "body": "Hesablar, köçürmələr və idempotensiya axtarışları üçün JSON/hadisə serializasiyasını və cache-dostu map-ları dizayn edin."
  },
  "m5": {
    "title": "Tip-təhlükəsiz persistensiya qapısı",
    "body": "Ledger yazı yolu üçün kompilyasiya-yoxlanılan SQL girişi və tranzaksiya sərhədləri yaradın."
  },
  "m17": {
    "title": "Postgres həqiqət mənbəyi",
    "body": "Ledger invariantlarını sxem constraint-ləri, idempotensiya açarları, outbox yazıları, indekslər, onlayn miqrasiyalar və vacuum intizamı ilə qoruyun."
  },
  "m13": {
    "title": "Paralel vəziyyət koordinasiyası",
    "body": "Hesab keşləri, ardıcıllaşdırma, metriklər və goroutine-lərarası mülkiyyət üçün atomikləri, mutex-ləri, ya da kanalları seçin."
  },
  "m4": {
    "title": "Deterministik konkurentlik testləri",
    "body": "Zamanlama, yenidən-cəhd və yarış-həssas ledger axınlarını idarə olunan zaman və sabit benchmark-larla reproduksiya edilə bilən edin."
  },
  "m3": {
    "title": "Həyat dövrü təmizlənməsi və interning",
    "body": "Resurslara təmizləmə bağla, təkrarlanan identifikatorları intern et və runtime həyat dövrlərinin ledger yaddaşını sızdırmasının qarşısını al."
  },
  "m7": {
    "title": "Canlı diaqnostika və sızma kriminalistikası",
    "body": "İstehsalat ledger insidentləri üçün flight recording, tetiklənə bilən dump-lar və goroutine sızma yoxlamaları əlavə et."
  },
  "m10": {
    "title": "Cache-friendly ledger düzülüşü",
    "body": "Balansların, ardıcıllıq nömrələrinin və audit yazılarının CPU keşlərindən səmərəli keçməsi üçün isti struct-ları və slice-ları formalaşdır."
  },
  "m11": {
    "title": "Branch-şüurlu isti yol",
    "body": "Validasiya, balans yoxlamaları və serialization dövrlərində proqnozlaşdırıla bilməyən branch-ləri və asılılıq zəncirlərini azalt."
  },
  "m12": {
    "title": "Planlayıcı-şüurlu worker ölçüləndirməsi",
    "body": "Ledger-in gecikmə və throughput hədəfləri üçün goroutine fan-out-unu, netpoll davranışını və GOMAXPROCS gözləntilərini tənzimlə."
  },
  "m8": {
    "title": "SIMD partiyaları və gizli təmizlənmə",
    "body": "Vektorlaşdırmanın kömək etdiyi yerdə ledger yazılarını partiya şəklində doğrula və istifadədən sonra həssas açar materialını təmizlə."
  },
  "m6": {
    "title": "Postkvant servis sərhədi",
    "body": "Ledger-in servislərarası kommunikasiyasını hibrid ML-KEM müdafiələri və sərt protokol uyğunluğu ilə möhkəmləndirin."
  },
  "m9": {
    "title": "İstehsalat rollout-u və idarəçilik",
    "body": "Ledger-i konteynerə-həssas runtime parametrləri və ADR-dəstəkli istehsalat nəzarətləri ilə paketləyin, deploy edin, refaktor edin və idarə edin."
  },
  "m14": {
    "title": "Observability müqaviləsi",
    "body": "Loglar, metrikalar, trace-lər və SLO-ları elə instrumentasiya edin ki, hər ledger köçürməsi təxminsiz izah edilə bilsin."
  },
  "m15": {
    "title": "Dayanıqlı paylanmış icra",
    "body": "Ledger asılılıqları ətrafında retry-lər, idempotentlik, circuit breaker-lər, backpressure və graceful degradation əlavə edin."
  },
  "m16": {
    "title": "Redis koordinasiyası və cache-aside",
    "body": "Redis-i qəsdən istifadə edin: cache-aside oxumalar, paylanmış lock-lar və etibarsızlaşdırma, onu ledger-in həqiqət mənbəyinə çevirmədən."
  },
  "m20": {
    "title": "Replikasiya olunmuş, sharding edilmiş ledger",
    "body": "Bir node-un çökməsi köçürmələri heç vaxt dayandırmasın deyə tranzaksiya jurnalını lider seçimi ilə node-lar arasında replika edin və ledger üfüqi miqyaslansın deyə hesabları consistent hashing ilə shard edin."
  },
  "m18": {
    "title": "SRE əməliyyat modeli",
    "body": "SLO-ları, alert-ləri, on-call-u, RCA-nı, toil avtomatlaşdırmasını və platforma nəzərdən keçirmə standartlarını təyin edin ki, ledger etibarlı istehsalat servisi kimi işlədilsin."
  }
},
};

const PARTS_AZ = [
  { id: "part-0", label: "Hissə 1", title: "İdiomatik Go Yazmaq", level: "Başlanğıc", modules: ["f4", "f5", "f3", "m19"] },
  { id: "part-1", label: "Hissə 2", title: "Go Runtime-ı", level: "Başlanğıc → Orta", modules: ["f1", "f2"] },
  { id: "part-2", label: "Hissə 3", title: "Real Sistemlər Qurmaq", level: "Orta → Senior", modules: ["m1", "m2", "m5", "m17"] },
  { id: "part-3", label: "Hissə 4", title: "Qabaqcıl Konkurentlik və Korrektlik", level: "Senior", modules: ["m13", "m4", "m3", "m7"] },
  { id: "part-4", label: "Hissə 5", title: "Kapotun Altında - Avadanlıqla Dostluq", level: "Staff · Dərin Arxitektura", modules: ["m10", "m11", "m12", "m8"] },
  { id: "part-5", label: "Hissə 6", title: "Paylanmış Sistemlər və Production", level: "Staff / Principal", modules: ["m6", "m14", "m15", "m16", "m20", "m9", "m18"] },
];

const VERIFICATION_AZ = [
  ["Go Mühiti Hədəfi", "go 1.26 - CI yoxlamaları ilə ciddi tələb olunur"],
  ["Linting Sistemi", "xüsusi qayda dəstləri ilə golangci-lint"],
  ["Konkurentlik Qaydası", "Açıq lifecycle nəzarəti və ya errgroup olmadan sıfır çılpaq `go` açar sözü"],
  ["Yaddaş Məhdudiyyəti", "Sıfır idarə olunmayan uzunmüddətli pointer; runtime.AddCleanup-un ciddi istifadəsi"],
  ["Təhlükəsizlik Tələbi", "CGO-nun tam istisnası; bütün TLS yolları üçün hibrid ML-KEM PQC konfiqurasiyası"],
];

const MODULES_AZ = [
  {
    "id": "f4",
    "title": "Goroutine-lər, Channel-lar və Konkurentlik Naxışları",
    "short": "Goroutine-lər və Channel-lar",
    "level": "Başlanğıc → Orta",
    "summary": "Goroutine-lər ucuz, konkurent işləyən funksiyalardır; channel-lar isə onlar arasında məlumatı təhlükəsiz ötürən tipləşdirilmiş borulardır. select, worker pool, fan-in/fan-out və context ləğvini mənimsəyin.",
    "plain": "Goroutine - konkurent işləyən funksiyadır: arxa planda bir tapşırıq başlatmaq kimidir, amma o qədər ucuzdur ki, minlərlə, hətta milyonlarla ədədini paralel işə sala bilərsiniz. Channel-lar tipləşdirilmiş borulardır: bir goroutine dəyəri içəri qoyur, digəri onu çıxarır, sinxronizasiyanı isə Go öz üzərinə götürür - ötürmə üçün heç bir lock lazım olmur. Go-nun devizi budur: 'Yaddaşı paylaşaraq ünsiyyət qurma; ünsiyyət quraraq yaddaşı paylaş.'",
    "animation": {
      "title": "Worker Pool: Fan-Out / Fan-In",
      "blurb": "Tapşırıqlar bir channel-da növbəyə düzülür, bir neçə worker goroutine onları paralel şəkildə çəkib (fan-out) emal edir və nəticələri tək bir channel-a geri göndərir (fan-in)."
    },
    "animations": [
      {
        "title": "go və WaitGroup ilə Goroutine Başlatmaq",
        "blurb": "main funksiyasının `go` ilə altı yüngül goroutine başlatdığını, onların paralel işlədiyini və davam etməzdən əvvəl `sync.WaitGroup` ilə hamısının bitməsinin gözlənildiyini izləyin."
      },
      {
        "title": "Channel-lar: Əl Sıxma, Buferlənmə və select",
        "blurb": "Buferlənməmiş göndərmənin alıcı hazır olana qədər necə bloklandığını, buferlənmiş channel-ın dolana qədər partlayışları necə uddurduğunu və `select`-in hansı channel əvvəl hazır olarsa onunla necə davam etdiyini görün."
      },
      {
        "title": "Worker Pool: Fan-Out / Fan-In",
        "blurb": "Tapşırıqlar bir channel-da növbəyə düzülür, bir neçə worker goroutine onları paralel şəkildə çəkib (fan-out) emal edir və nəticələri tək bir channel-a geri göndərir (fan-in)."
      }
    ],
    "videos": [
      {
        "title": "Go Concurrency Patterns",
        "speaker": "Rob Pike · Google I/O 2012",
        "url": "https://www.youtube.com/watch?v=f6kdp27TYZs",
        "blurb": "Goroutine-ləri, channel-ları, select-i və bu modulun üzərində qurulduğu worker-pool/fan-in naxışını təqdim edən orijinal məruzə - birbaşa Go-nun həmmüəllifindən."
      },
      {
        "title": "Concurrency Is Not Parallelism",
        "speaker": "Rob Pike · Heroku Waza 2012",
        "url": "https://vimeo.com/49718712",
        "blurb": "Bu modulun açılış cümləsinin arxasında duran fikir: proqramı müstəqil, bir-biri ilə ünsiyyət quran hissələr kimi qurmaq 'neçə nüvədən istifadə edə bilərəm' sualından tamam fərqli bir sualdır - və adətən əvvəlcə soruşulmalı olan daha faydalı sualdır."
      },
      {
        "title": "Go's Trace Tooling and Concurrency",
        "speaker": "Bill Kennedy (Ardan Labs) · GopherCon 2025",
        "url": "https://www.youtube.com/watch?v=Gqo0oCfZSjg",
        "blurb": "Eyni fikirlərə müasir (2025) baxış: Bill Kennedy canlı olaraq bir proqram yazır, konkurentlik qatları əlavə edir və yük altında goroutine-lərin və channel-ların dəqiq nə etdiyini göstərmək üçün Go-nun trace alətindən istifadə edir."
      }
    ],
    "concepts": [
      {
        "title": "Goroutine-lər: demək olar ki, pulsuz konkurentlik",
        "body": "İstənilən çağırışın qarşısına `go` qoysanız, o konkurent işləyir. Goroutine təxminən 2 KB-lıq kiçik bir stack ilə başlayır və lazım olduqca böyüyür, ona görə də minlərləsini işə salmaq normaldır. Amma hər goroutine-in bir sahibi və dayanmaq yolu olmalıdır - sahibsiz qalan goroutine yaddaş sızmasıdır."
      },
      {
        "title": "Channel-lar: tipləşdirilmiş, sinxronlaşdırılmış borular",
        "body": "Buferlənməmiş channel bir görüş nöqtəsidir: göndərən alıcı hazır olana qədər bloklanır (mükəmməl sinxronizasiya). Buferlənmiş channel isə onları öz tutumuna qədər ayırır. Göndərən channel-ı 'artıq dəyər yoxdur' siqnalı vermək üçün bir dəfə bağlayır; alıcılar isə onun üzərində range edə bilər."
      },
      {
        "title": "select: bir çox şeyi gözləmək",
        "body": "select bir neçə channel əməliyyatından biri icra oluna bilənə qədər bloklanır. Bloklamayan cəhd üçün default əlavə edin, ya da timeout üçün time.After case-i. Bu, işi, ləğvi və timeout-u bir yerdə birləşdirmə üsuludur."
      },
      {
        "title": "Worker pool naxışı (fan-out / fan-in)",
        "body": "Fan-out: hamısı bir jobs channel-ından oxuyan N sayda worker başladın, beləliklə iş onlar arasında yayılır. Fan-in: hər worker bir results channel-ına yazır, nəticələri birləşdirir. Bu, konkurentliyi N ilə məhdudlaşdırır - production-da ən çox rastlaşılan konkurentlik formasıdır."
      },
      {
        "title": "context ilə təmiz dayanma",
        "body": "context.Context goroutine ağacına dayanmağı necə deyəcəyinizdir - timeout, cancel və ya client-in bağlantını kəsməsi. ctx-i birinci arqument kimi ötürün, ctx.Done() üzərində select edin və sızma olmadan təmiz bir shutdown yolunuz olsun."
      }
    ],
    "ai": {
      "title": "AI repetitorla daha sürətli öyrənin",
      "body": "Bir LLM-dən konkurent kod parçasını məhz sızmalar, deadlock-lar və çatışmayan ləğv (cancellation) baxımından nəzərdən keçirməsini xahiş edin - üç klassik bug.",
      "prompt": "Bu Go konkurentlik kodunu goroutine sızmaları, deadlock-lar, data race-lər və çatışmayan context ləğvi baxımından nəzərdən keçir: <paste>. Hər problem üçün onun necə üzə çıxdığını izah et və minimal düzəlişi göstər. Go 1.22+ loop-dəyişən semantikasını nəzərə al."
    },
    "practice": {
      "title": "Özünüz sınayın",
      "body": "Worker pool qurun və onun düzgünlüyünü sübut edin.",
      "steps": [
        "Worker pool yazın: bir jobs channel, 4 worker, bir results channel; 20 tapşırıq göndərin.",
        "Onu race detector altında işə salın: go run -race main.go",
        "context.WithTimeout əlavə edin və worker-lərin ctx.Done() üzərində çıxmasını təmin edin.",
        "Sızma yaradın (heç kimin bağlamadığı channel üzərində bloklanan bir worker), sonra onu goroutine profili ilə tutun."
      ]
    },
    "pitfalls": [
      "Goroutine sızdırmaq: heç kimin bağlamayacağı channel üzərində əbədi bloklanan bir goroutine başlatmaq. Hər goroutine-ə həmişə bir dayanma yolu verin (bağlama və ya context).",
      "Channel-ı alıcı tərəfdən bağlamaq, ya da onu iki dəfə bağlamaq - hər ikisi panik yaradır. Bağlamağın sahibi göndərəndir, o da yalnız bir dəfə bağlayır.",
      "Paylaşılan bir sayğacı qorumaq üçün channel-lara əl atmaq - sync.Mutex və ya atomic daha sadədir. Channel-lar mülkiyyəti ötürür; mutex-lər isə vəziyyəti qoruyur."
    ],
    "takeaways": [
      "Buferlənməmiş channel-lar sinxronlaşdırır; buferlənmiş channel-lar isə istehsalçı və istehlakçının sürətini ayırır.",
      "Hər goroutine-in bir sahibi və dayanma yolu olmalıdır - adətən bu, context vasitəsilə olur.",
      "Məlumatı/mülkiyyəti ötürmək üçün channel-lardan, paylaşılan vəziyyəti qorumaq üçün isə mutex/atomic-dən istifadə edin."
    ],
    "checklist": [
      "Goroutine başlada və sync.WaitGroup ilə gözləyə bilirsiniz.",
      "Buferlənməmiş və buferlənmiş channel-lar arasındakı fərqi və kimin onları bağladığını başa düşürsünüz.",
      "Fan-out/fan-in ilə worker pool qurmusunuz.",
      "Hər uzunmüddətli goroutine-ə context ləğvini calaşdırırsınız."
    ]
  },
  {
    "id": "f5",
    "title": "Xətalar, Context və Layihə Strukturu",
    "short": "Xətalar və Context",
    "level": "Başlanğıc → Orta",
    "summary": "Go xətaları açıq şəkildə idarə etdiyiniz dəyərlər kimi görür. Onları %w ilə bükün, errors.Is/As ilə yoxlayın, context ilə deadline-ları ötürün və layihəni idiomatik şəkildə strukturlaşdırın.",
    "plain": "Go-da exception yoxdur. Uğursuz ola bilən funksiya bir error dəyəri qaytarır, siz də onu məhz baş verdiyi yerdə yoxlayırsınız. Xətanın orijinal səbəbini call stack boyu daşıyarkən saxlamaq üçün onu 'bükürsünüz' (wrap) - sonradan errors.Is və errors.As ilə yoxlaya biləcəyiniz bir zəncir qurursunuz. Ayrıca, context bütün sorğunu bir anda dayandıra bilmək üçün ləğvi və deadline-ları funksiya və API sərhədləri boyu daşıyır.",
    "animation": {
      "title": "Context Ləğv Ağacı",
      "blurb": "Bir sorğu goroutine-lər arasında context ağacı qurur. Kökdə timeout işə düşdükdə ləğv hər budağa yayılır və hər goroutine dayanır."
    },
    "videos": [
      {
        "title": "GopherCon 2018: How Do You Structure Your Go Apps",
        "speaker": "Kat Zien · GopherCon 2018",
        "url": "https://www.youtube.com/watch?v=oL6JBUk6tj0",
        "blurb": "Real bir Go servisi üçün flat, tipə görə qruplaşdırılmış və domain-driven layout-ları nəzərdən keçirir - bu modulun cmd/ + internal/ tövsiyəsinin qısaltdığı konkret qərar."
      },
      {
        "title": "GopherCon 2020: Working with Errors",
        "speaker": "Jonathan Amsterdam · GopherCon 2020",
        "url": "https://www.youtube.com/watch?v=IKoSsJFdRtI",
        "blurb": "Go 1.13 error-wrapping təklifinin həmmüəllifi olan mühəndis tərəfindən təqdim olunur - bu modulun öyrətdiyi errors.Is, errors.As və %w-nin məhz özü."
      },
      {
        "title": "The context package internals",
        "speaker": "Damiano Petrungaro · GopherCon UK 2023",
        "url": "https://www.youtube.com/watch?v=mfgBhGu5pco",
        "blurb": "context-in real ağac/channel əsaslı implementasiyasını açır, bunun da bu modulun təsvir etdiyi kimi ləğvin və deadline-ların niyə belə yayıldığını göstərir."
      }
    ],
    "concepts": [
      {
        "title": "Xətalar dəyərlərdir",
        "body": "Bu idiom hər yerdədir: funksiya (nəticə, error) qaytarır, siz də err != nil-i dərhal yoxlayırsınız. Çağıranların branch edəcəyi şərtlər üçün (məsələn, 'tapılmadı') errors.New ilə sentinel xətalar müəyyən edin."
      },
      {
        "title": "%w ilə bükmək, Is / As ilə yoxlamaq",
        "body": "fmt.Errorf və %w işarəsi ilə bükmək orijinal xətanı əlçatan saxlamaqla kontekst (harada/nə) əlavə edir. errors.Is zəncirin istənilən yerində konkret bir sentinel axtarır; errors.As isə konkret bir xəta tipini çıxarır."
      },
      {
        "title": "context: ləğv və deadline-lar",
        "body": "cancel funksiyası və ya timeout ilə törəmə context yaradın, onu I/O edən hər çağırışa birinci arqument kimi ötürün və resursları buraxmaq üçün həmişə defer cancel() edin. Valideyn context-i ləğv etmək hər övladı da ləğv edir."
      },
      {
        "title": "Fərdi xəta tipləri",
        "body": "Çağıranların strukturlaşdırılmış detallara ehtiyacı olduqda (sahə adı, HTTP status) bir xəta tipi müəyyən edin. Error() string tətbiq edin, istəyə görə isə errors.Is/As ilə düzgün işləməsi üçün Unwrap() əlavə edin."
      },
      {
        "title": "İdiomatik layihə strukturu",
        "body": "Ehtiyac yaranana qədər strukturu sadə saxlayın. cmd/<app> giriş nöqtələrini (main package-ləri) saxlayır; internal/ yalnız öz module-unuzun import edə biləcəyi kodu saxlayır (compile-time sərhəd); package-ləri nə təqdim etdiklərinə görə adlandırın, cəfəngiyat 'utils' package-indən qaçının."
      }
    ],
    "ai": {
      "title": "AI repetitorla daha sürətli öyrənin",
      "body": "Bir LLM-dən xəta idarəetmənizi itirilmiş kontekst, context istifadənizi isə klassik səhvlər baxımından audit etməsini xahiş edin.",
      "prompt": "Bu Go kodunun xəta idarəetməsini və context istifadəsini audit et: <paste>. %w əvəzinə %v istifadə edilən (zənciri itirən), context-i struct-da saxlayan, ya da context.WithValue-nu tələb olunan parametr üçün istifadə edən hər yeri işarələ. Hər biri üçün idiomatik düzəlişi göstər."
    },
    "practice": {
      "title": "Özünüz sınayın",
      "body": "Yoxlaya biləcəyiniz bir xəta zənciri qurun.",
      "steps": [
        "Bir sentinel xəta müəyyən edin və onu iki qat yuxarıda fmt.Errorf(\"...: %w\", err) ilə bükün.",
        "Ən yuxarıda errors.Is(err, ErrYour) ilə branch edin və onun zəncir boyu uyğun gəldiyini təsdiqləyin.",
        "Yavaş bir çağırış ətrafına context.WithTimeout(50ms) əlavə edin və ctx.Err() == context.DeadlineExceeded-i müşahidə edin.",
        "Kiçik bir proqramı cmd/ + internal/ şəklində yenidən təşkil edin və internal sərhədin tətbiq olunduğunu təsdiqləyin."
      ]
    },
    "pitfalls": [
      "%w əvəzinə %v ilə bükmək - gözəl bir string alırsınız, amma səbəbi errors.Is/As etmə imkanını itirirsiniz.",
      "context.Context-i birinci arqument kimi ötürmək əvəzinə struct sahəsində saxlamaq - bu, ləğvi pozur və lifecycle-ları qarışdırır.",
      "Tələb olunan parametrlər üçün context.WithValue istifadə etmək - o, sorğu-əhatəli metadata (trace ID-lər) üçündür, arqument torbası üçün deyil."
    ],
    "takeaways": [
      "Yuxarı gedərkən %w ilə bükün; sərhəddə errors.Is/As ilə yoxlayın.",
      "context ləğv və deadline-lar üçündür - onu həmişə ötürün, heç vaxt saxlamayın.",
      "internal/ module-unuzun API sərhədini compile-time-da tətbiq edir."
    ],
    "checklist": [
      "Xətaları %w ilə bükür və errors.Is/As ilə yoxlayırsınız.",
      "context-i birinci arqument kimi ötürür və defer cancel() edirsiniz.",
      "Error() və Unwrap() ilə fərdi xəta tipi yazmısınız.",
      "cmd/ və internal/-i düzgün strukturlaşdıra bilirsiniz."
    ]
  },
  {
    "id": "f3",
    "title": "Go-da Test Yazmaq",
    "short": "Test Yazmaq",
    "level": "Başlanğıc",
    "summary": "Go testi birbaşa toolchain-ə daxildir. Cədvəl əsaslı (table-driven) testlər və subtest-lər yazın, coverage ölçün, girişləri fuzz edin və sadə interface-lərlə test double-ları qurun - heç bir framework lazım deyil.",
    "plain": "Go-da test yazmaq heç bir sehr tələb etmir və üçüncü tərəf framework-ə ehtiyac duymur. Testləri kodunuzun yanında _test.go ilə bitən fayllara qoyursunuz, Test ilə başlayan funksiyalar yazırsınız və `go test` işə salırsınız. Standart kitabxana sizə hər şeyi verir: subtest-lər, benchmark-lar, fuzzing və coverage. Ən idiomatik tərz 'cədvəl əsaslı test'dir - eyni məntiqdən keçirilən bir siyahı hal (case).",
    "animation": {
      "title": "Cədvəl Əsaslı Test İşlədicisi",
      "blurb": "`go test` hər halı subtest kimi işlətdikcə bir cədvəl case-i izləyin: giriş funksiyadan keçir, nəticə want ilə müqayisə olunur və hər sətir yaşıllaşır."
    },
    "videos": [
      {
        "title": "GopherCon 2017: Advanced Testing with Go",
        "speaker": "Mitchell Hashimoto · GopherCon 2017",
        "url": "https://www.youtube.com/watch?v=8hQG7QlcLBk",
        "blurb": "HashiCorp-un real sistemlər üçün cədvəl əsaslı subtest-lərə və test fixture-larına yanaşması - bu modulun test bölməsinin qurulduğu məhz həmin naxış."
      },
      {
        "title": "GopherCon 2022: Fuzz Testing Made Easy",
        "speaker": "Katie Hockman · GopherCon 2022",
        "url": "https://www.youtube.com/watch?v=7KWPiRq3ZYI",
        "blurb": "Go 1.18-də go test-in native fuzzing dəstəyini buraxan Go komandasının fuzzing rəhbəri tərəfindən öyrədilir - bu modulun əhatə etdiyi eyni funksiya."
      },
      {
        "title": "Go Testing By Example",
        "speaker": "Russ Cox · GopherCon Australia 2023",
        "url": "https://www.youtube.com/watch?v=X4rxi9jStLo",
        "blurb": "Go-nun texniki rəhbəri go test toolchain-i real standart kitabxana nümunələri üzərindən izah edir, birbaşa mənbədən idiomatik cədvəl əsaslı test strukturunu gücləndirir."
      }
    ],
    "concepts": [
      {
        "title": "Ən sadə mümkün test",
        "body": "Test *testing.T qəbul edən TestXxx adlı bir funksiyadır. Uğursuzluğu bildirib davam etmək üçün t.Errorf, bu testi dərhal dayandırmaq üçün isə t.Fatalf istifadə edin. Uğursuzluğun özünü izah etməsi üçün həmişə got və want-i çap edin."
      },
      {
        "title": "Subtest-lərlə cədvəl əsaslı testlər",
        "body": "Hallarınızı struct-ların bir slice-ında sadalayın və hər birini t.Run ilə işlədərək adlandırılmış subtest kimi göstərin. Yeni hal əlavə etmək bir sətirdir, uğursuzluq isə dəqiq hal adını göstərir."
      },
      {
        "title": "Helper-lər, paralellik, cleanup",
        "body": "t.Helper() uğursuzluqların helper-də yox, çağıranda göstərilməsini təmin edir. t.Parallel() sürət üçün halları paralel işlədir. t.Cleanup() test bitdikdə işə düşən teardown qeyd edir - helper-lər arasında defer-dən daha təmizdir."
      },
      {
        "title": "Coverage və fuzzing",
        "body": "Coverage testlərinizin hansı sətirləri işlətdiyini göstərir. Fuzzing (Go 1.18-dən bəri daxili) sizin heç ağlınıza gəlməyəcək crash-lər və sərhəd halları tapmaq üçün təsadüfi girişlər yaradır - kodunuzu sındıran istənilən girişi avtomatik saxlayır."
      },
      {
        "title": "Interface-lərlə test double-ları (mock framework olmadan)",
        "body": "Go-nun gizli silahı: konkret tip əvəzinə interface qəbul edin. Testlərdə isə kiçik bir fake implementasiya ötürürsünüz. Nə mock kitabxanası, nə kod generasiyası - sadəcə interface-i ödəyən bir struct."
      }
    ],
    "ai": {
      "title": "AI repetitorla daha sürətli öyrənin",
      "body": "Çətin bir funksiya üçün bir LLM-dən ətraflı bir hal cədvəli yaratmasını xahiş edin - sonra hansı sərhəd hallarını gözdən qaçıracağınızı nəzərdən keçirin.",
      "prompt": "Bu funksiya üçün idiomatik bir Go cədvəl əsaslı test yaz: <paste func>. Təsviri adlarla subtest-lərdən istifadə et, sərhəd və xəta hallarını əhatə et, got-u want-lə çap et. Heç bir üçüncü tərəf assertion kitabxanası istifadə etmə."
    },
    "practice": {
      "title": "Özünüz sınayın",
      "body": "Gündəlik test vərdişini qurun.",
      "steps": [
        "Bir funksiyanın yanına _test.go faylı əlavə edin və t.Run ilə bir cədvəl əsaslı TestXxx yazın.",
        "Gündəlik əmri işə salın: go test -race -cover ./...",
        "Coverage xəritəsini açın: go test -coverprofile=cov.out ./... && go tool cover -html=cov.out",
        "Giriş parse edən istənilən funksiya üçün FuzzXxx əlavə edin və go test -fuzz-i 30 saniyə işə salın."
      ]
    },
    "pitfalls": [
      "Zaman və ya map ehtiva edən struct-ları == və ya reflect.DeepEqual ilə müqayisə edib qərarsız (flaky) uğursuzluqlar almaq - sahələri müqayisə edin, ya da google/go-cmp-in cmp.Diff-indən istifadə edin.",
      "Başladılmış bir goroutine daxilindən t.Fatal çağırmaq - o, yalnız testin öz goroutine-ində işləyir. Xətanı bir channel üzərindən geri göndərin və testdə Fatal edin.",
      "t.Parallel() subtest-ləri arasında vəziyyət paylaşmaq (ya da, Go 1.22-dən əvvəl, loop dəyişənini tutmaq) ki, hallar bir-birinə mane olsun."
    ],
    "takeaways": [
      "Cədvəl əsaslı testlər + t.Run oxunaqlı, izolə olunmuş halları dəqiq uğursuzluq mesajları ilə verir.",
      "`go test -race -cover` gün boyu işlətdiyiniz əmrdir.",
      "Framework yox, kiçik interface-lər və fake-lərlə mock edin."
    ],
    "checklist": [
      "Adlandırılmış subtest-lərlə cədvəl əsaslı test yaza bilirsiniz.",
      "t.Helper, t.Cleanup və t.Parallel-i yerində istifadə edirsiniz.",
      "HTML coverage hesabatı yarada və oxuya bilirsiniz.",
      "Ən azı bir fuzz hədəfi və bir interface əsaslı fake yazmısınız."
    ]
  },
  {
    "id": "m19",
    "title": "Go-da Müsahibə Data Strukturları və Alqoritmləri",
    "short": "Müsahibə DS və Alqoritmlər",
    "level": "Başlanğıc → Orta",
    "summary": "Hər coding müsahibəsinin yoxladığı strukturlar - slice-lar, map-lər, heap-lər, ağaclar və qraflar - Go-nun onları həqiqətən necə implementasiya etdiyi şəkildə izah olunur: böyümə qaydaları, bucket düzülüşü, sift əməliyyatları, BFS/DFS mexanikası və hansını nə vaxt seçmək.",
    "plain": "Müsahibələr eyni bir neçə sualı təkrar-təkrar soruşur: hashmap həqiqətən necə işləyir, append nə üçün bəzən yavaşdır, bu ağacı gəz, ən qısa yolu tap. Düzgün cavablar əzbərlənmiş trivia deyil - onlar maşının nə etdiyini bilməkdən gəlir. Slice - backing array-ə işarə edən kiçik bir başlıqdır. Map - hash bitlərinə görə seçilən səkkiz yerlik bucket-lərdir. Heap - slice-a yastılanmış bir ağacdır. BFS sadəcə bir növbədir (queue); DFS sadəcə bir stack-dir. Bu modul Go-da bu şəkillərin hər birini qurur ki, müsahibə cavabı sizin gördüyünüz hərəkət edən bir şeyin təsviri olsun.",
    "animation": {
      "title": "BFS: Dalğa və Növbə",
      "blurb": "Breadth-first search-in bir qrafda səviyyə-səviyyə necə yayıldığını izləyin - node-lar növbəyə daxil olur, dəqiq bir dəfə ziyarət olunur, hədəfə ilk çatan an isə EN QISA YOLDUR."
    },
    "animations": [
      {
        "title": "BFS: Dalğa və Növbə",
        "blurb": "Breadth-first search-in bir qrafda səviyyə-səviyyə necə yayıldığını izləyin - node-lar növbəyə daxil olur, dəqiq bir dəfə ziyarət olunur, hədəfə ilk çatan an isə EN QISA YOLDUR."
      },
      {
        "title": "LRU Cache: Map + Linked List",
        "blurb": "Get və Put node-ları map-in birbaşa onlara tullandığı ikiqat bağlı siyahının önünə köçürür - tutum bitəndə isə tail O(1)-də çıxarılır."
      },
      {
        "title": "Go Map-in İçində: Bucket-lər və Böyümə",
        "blurb": "Bir açarı hashing vasitəsilə izləyin: aşağı bitlər bucket-i seçir, tophash bayt-ları skanı qısaldır, bucket-lər dolduqda isə bütün cədvəl böyüyür və evakuasiya olunur."
      },
      {
        "title": "Slice Böyüməsi və Slice-dakı Heap",
        "blurb": "append-in tutumun bitdiyini görüb yenidən ayrıldığını, sonra isə adi bir slice-ın içində yaşayan binar heap-i izləyin - parent və child sadəcə indeks arifmetikasıdır, sift-up və sift-down qaydanı bərpa edir."
      }
    ],
    "videos": [
      {
        "title": "GopherCon 2016: Inside the Map Implementation",
        "speaker": "Keith Randall · GopherCon 2016",
        "url": "https://www.youtube.com/watch?v=Tl7mi9QmLns",
        "blurb": "Go komandasının bir mühəndisi map-in bucket-lərini və tophash bayt-ını birbaşa runtime mənbəyindən araşdırır - bu modulun sizi əsaslandırmağa çağırdığı klassik daxili detallar."
      },
      {
        "title": "dotGo 2016 - Slices: Performance through cache-friendliness",
        "speaker": "Damian Gryski · dotGo 2016",
        "url": "https://www.youtube.com/watch?v=jEG4Qyo_4Bc",
        "blurb": "Slice-ın başlığının, backing array-inin və böyümə strategiyasının niyə önəmli olduğunu izah edir - bu modulun slice böyüməsi və aliasing müzakirəsinin əsaslandığı mexaniki şəkil."
      },
      {
        "title": "Faster Go Maps With Swiss Tables",
        "speaker": "Michael Pratt · GopherCon EU 2025",
        "url": "https://www.youtube.com/watch?v=aqtIM5AK9t4",
        "blurb": "Bu modulun izah etdiyi bucket-və-tophash dizaynının müasir varisi, birbaşa onu quran Go runtime mühəndisindən."
      }
    ],
    "concepts": [
      {
        "title": "Slice-lar: array üzərində başlıq",
        "body": "Slice üç sözdür: backing array-ə bir pointer, bir uzunluq (length) və bir tutum (capacity). append amortized O(1)-dir, çünki böyümə backing array-i ikiqat (sonra ~1.25×) artırır - amma cap-i keçən istənilən append hər şeyi kopyalayır və köhnə array-i TƏRK EDİR, elə buna görə bir backing array-i paylaşan iki slice, biri böyüdükdən sonra bir-birinin yazılarını görməyi dayandırır. Müsahibə verənlər bu sualı sevir, çünki o, slice istifadə edənlərlə slice-ı anlayanları ayırır."
      },
      {
        "title": "Map-lər: hash, bucket, tophash",
        "body": "Go map-i açarı hash edir, hansı bucket-i (2^B bucket-dən birini) seçmək üçün hash-in AŞAĞI bitlərindən istifadə edir, hər bucket isə səkkiz açar/dəyər cütünə qədər, üstəlik səkkiz bir baytlıq 'tophash' dəyərinə (hash-in YUXARI bitləri) qədər saxlayır. Axtarış əvvəlcə səkkiz tophash baytını skan edir - bir cache line - və yalnız tophash uyğun gəldikdə tam açarları müqayisə edir. Orta yük bucket başına ~6.5 cütü keçdikdə cədvəl ikiqat böyüyür və girişlər tədricən evakuasiya olunur. Bu evakuasiya həm də iterasiya sırasının qəsdən təsadüfiləşdirilməsinin səbəbidir: kod heç vaxt ona bağlı olmamalıdır."
      },
      {
        "title": "Heap-lər: slice-a yastılanmış ağac",
        "body": "Binar heap saf indeks riyaziyyatı ilə bir slice-da saxlanılan tam bir ağacdır: i-nin övladları 2i+1 və 2i+2-də, valideyni isə (i-1)/2-də yaşayır. Push əlavə edir və sift-up edir; Pop 0-cı indeksi götürür, son elementi kökə köçürür və sift-down edir. Hər ikisi O(log n)-dir, üstdəki isə həmişə minimum (və ya maksimum)dur. Bu, 'k ən böyüyü', 'k sıralanmış siyahını birləşdirmək' və hər priority queue üçün MƏHZ bu strukturdur - container/heap isə sadəcə öz slice-ınız üzərində eyni beş metodu istəyir."
      },
      {
        "title": "Ağac gəzintiləri: BFS növbədir, DFS stack-dir",
        "body": "Hər ağac/qraf gəzinti sualı bir seçimə düşür: növbə yoxsa stack. Breadth-first bir növbə istifadə edir və node-ları səviyyə-səviyyə ziyarət edir - məhz buna görə BFS bir node-a İLK dəfə çatanda bu ən qısa yol vasitəsilə olur (çəkisiz qraflarda). Depth-first isə bir stack istifadə edir - adətən rekursiya vasitəsilə call stack özü - və geri qayıtmazdan əvvəl dibə enir; 'yol varmı' sualının, ağac rekursiyasının və topoloji sıralamanın skeletidir. Əgər müsahibəni aparan 'ən qısa' və ya 'ən yaxın' deyirsə, bu söz BFS deməkdir."
      },
      {
        "title": "Qraflar: adjacency list, visited set, və hansı nə vaxt",
        "body": "Qrafı gerçəkdən sıx olmadıqca map[node][]node (adjacency list) kimi təmsil edin - list O(V+E) yaddaş tutur və BFS/DFS-in O(V+E) zamanda işləməsinə imkan verir, matrix isə nə qədər seyrək olsa da O(V²) tutur. Qraf müsahibələrini uğursuz edən tək səhv visited set-i unutmaqdır: onunla hər node bir dəfə emal olunur; onsuz isə istənilən dövrə (cycle) əbədi dövr edir. Kodladıqca mürəkkəbliyi ucadan deyin - bu, adətən növbəti sual olur."
      }
    ],
    "ai": {
      "title": "AI repetitorla daha sürətli öyrənin",
      "body": "Müsahibə dövrünün özünü təkrarlayın: bir LLM-dən müsahibəçi rolunu oynamasını, follow-up suallarını (mürəkkəblik, tradeoff-lar, miqyasda nə pozulur) sormasını və bir strukturun şifahi izahınızı Go-nun həqiqətən etdiyi ilə müqayisə edərək qiymətləndirməsini istəyin.",
      "prompt": "Bir Go coding müsahibəçisi kimi çıxış et. Mənə container/list istifadə etmədən LRU cache implementasiya etməyi tapşır. Həllimdən sonra follow-up-larla məni sorğula: hər əməliyyatın mürəkkəbliyi, konkurent giriş ilə nə dəyişir, Go-nun map-i böyümə altında necə davranır, və nə vaxt heap-dən istifadə edərdim. Go daxili detalları haqqında etdiyim yanlış hər iddianı işarələ."
    },
    "practice": {
      "title": "Özünüz sınayın",
      "body": "Müsahibə əzələləri yenidən oxumaqla yox, yenidən implementasiya etməklə böyüyür.",
      "steps": [
        "İzahlı nümunədəki LRU cache-i yaddaşdan yenidən implementasiya edin, sonra dərs versiyası ilə müqayisə edin.",
        "map[int][]int üzərində BFS ən qısa yol yazın və kağız üzərində çəkdiyiniz kiçik bir qrafda hər node-a olan məsafəni yoxlayın.",
        "Adi bir []int üzərində siftUp/siftDown implementasiya edin və onlarla 20 təsadüfi ədədi heap-sort edin.",
        "1-ci konsepsiyadakı slice-aliasing kod parçasının nəticəsini işə salmazdan əvvəl proqnozlaşdırın - sonra işə salın."
      ]
    },
    "pitfalls": [
      "Qraf gəzintisində visited set-i unutmaq - qraf bir dövrəyə sahib olan kimi klassik sonsuz dövr.",
      "append-in heç vaxt datanı köçürmədiyini düşünmək: iki slice yalnız biri cap-i keçən bir append edənə qədər backing array-i paylaşır, sonra yazılar səssizcə ayrılır.",
      "Map iterasiya sırasına güvənmək (qəsdən təsadüfiləşdirilib) və ya bir map-i sinxronizasiya olmadan bir neçə goroutine-dən oxumaq - hər ikisi sadəcə müsahibə trivia-sı deyil, real production bug-larıdır."
    ],
    "takeaways": [
      "Slice = pointer+len+cap başlığı; böyümə köhnə array-i kopyalayır və tərk edir.",
      "Map = aşağı bitlərlə hash → bucket; tophash skanı; ~6.5 yük əmsalında böyüyür; iterasiya sırası qəsdən təsadüfidir.",
      "Heap = slice-da tam ağac, O(log n) sift əməliyyatları, ekstremal elementin O(1) peek-i.",
      "BFS(növbə) çəkisiz qraflarda ən qısa yolları tapır; DFS(stack) əlçatanlıq və struktur suallarına cavab verir."
    ],
    "checklist": [
      "Slice böyüməsini və aliasing tələsini konkret bir kod nümunəsi ilə izah edə bilirsiniz.",
      "Bir açarı Go map axtarışı boyu izləyə bilirsiniz: hash bitləri, bucket, tophash, böyümə.",
      "Yaddaşdan adi bir slice üzərində min-heap-in siftUp/siftDown-unu implementasiya edə bilirsiniz.",
      "Bir adjacency list üzərində BFS və DFS yaza və onların O(V+E) mürəkkəbliyini ifadə edə bilirsiniz.",
      "map ilə əl ilə yazılmış ikiqat bağlı siyahıdan O(1) LRU cache qura bilirsiniz."
    ]
  },
  {
    "id": "f1",
    "title": "Go-nun Zibil Yığanı Necə İşləyir",
    "short": "Zibil Yığan (GC)",
    "level": "Başlanğıc",
    "summary": "Avtomatik yaddaş idarəetməsini sirdən çıxarın: konkurent üç-rəngli mark-and-sweep collector, GOGC və GOMEMLIMIT-in həqiqətən nə etdiyi və GC yükünü necə azaltmaq olar.",
    "plain": "Zibil yığanı (garbage collector, GC) yaddaş üçün avtomatik bir dozorçu kimi düşünün. C kimi bir dildə ayırdığınız hər şeyi əl ilə free() etməlisiniz. Go-da isə sadəcə bir dəyəri istifadə etməyi dayandırırsınız, GC də proqramınız işləməyə davam edərkən onu sizin üçün geri alır. Bunu təkrar-təkrar bir sual verərək edir: 'indi mütləq canlı olan hər şeydən başlayaraq (qlobal dəyişənlər və goroutine stack-ləri), pointer-ləri izləyərək hələ hansı obyektlərə çata bilirəm?' Artıq çata bilmədiyi hər şey zibildir və onun yaddaşı geri qaytarılır.",
    "animation": {
      "title": "Üç-Rəngli Mark & Sweep",
      "blurb": "Collector-un root-lardan başladığını, əlçatan obyektləri əvvəl boz sonra qara boyadığını və qalan hər şeyi ağ olaraq süpürdüyünü izləyin - bütün bunlar proqram işləməyə davam edərkən baş verir."
    },
    "videos": [
      {
        "title": "GopherCon 2015: Go GC: Solving the Latency Problem",
        "speaker": "Rick Hudson · GopherCon 2015",
        "url": "https://www.youtube.com/watch?v=aiv1JOfMjm0",
        "blurb": "Konkurent collector-u quran Go komandası mühəndisi onun niyə əvvəldən üç-rəngli və konkurent olduğunu izah edir - bu modulun açıldığı dizayn."
      },
      {
        "title": "GopherCon Europe 2022: Respecting Memory Limits In Go",
        "speaker": "Michael Knyszek · GopherCon Europe 2022",
        "url": "https://www.youtube.com/watch?v=07wduWyWx8M",
        "blurb": "GOMEMLIMIT-i tətbiq edən runtime mühəndisindən, bu modulun yaddaş-tavanı tənzimləmə düymələrinin birbaşa mənbəyi olan dərinlikli bir baxış."
      },
      {
        "title": "GopherCon 2025: Advancing Go Garbage Collection with Green Tea",
        "speaker": "Michael Knyszek · GopherCon 2025",
        "url": "https://www.youtube.com/watch?v=gPJkM95KpKo",
        "blurb": "Go-nun konkurent collector-unun CPU yükünü azaltmaq üçün necə inkişaf etməyə davam etdiyini göstərir - bu modulun izah etdiyi GC-nin növbəti hara doğru getdiyinə bir baxış."
      }
    ],
    "concepts": [
      {
        "title": "Şəkillərlə üç-rəngli mark & sweep",
        "body": "GC zehnən hər obyekti ağ (hələ görülməyib), boz (əlçatandır, amma pointer-ləri hələ skan olunmayıb) və ya qara (əlçatan və tam skan olunub) rənglər. O root-ları boz edir, sonra boz olanları qara etməyə davam edir - yolda övladlarını boz edərək. Heç bir boz obyekt qalmadıqda, hələ ağ olan hər şey əlçatmazdır və süpürülür (azad edilir)."
      },
      {
        "title": "O konkurent işləyir (çox kiçik fasilələr)",
        "body": "Go-nun GC-si goroutine-lərinizlə eyni anda işləyir, ona görə 'stop-the-world' fasilələri adətən millisaniyədən azdır. Kodunuz skan zamanı pointer-ləri dəyişə bildiyi üçün, write barrier səssizcə yeni pointer-ləri qeyd edir ki, collector heç vaxt canlı bir obyektin izini itirməsin."
      },
      {
        "title": "GOGC - sürət/yaddaş düyməsi",
        "body": "GOGC (default 100) növbəti collection-a qədər heap-in nə qədər böyüyə biləcəyini idarə edir. 100 'növbəti collection-dan əvvəl canlı heap-in ikiqat böyüməsinə icazə ver' deməkdir. Onu artırsanız daha az collection üçün daha çox yaddaş xərcləyirsiniz (daha yüksək throughput); azaltsanız daha çox CPU bahasına daha az yaddaş istifadə edirsiniz."
      },
      {
        "title": "GOMEMLIMIT - yumşaq yaddaş tavanı",
        "body": "GOMEMLIMIT (Go 1.19+) runtime-a ümumi bir yaddaş büdcəsi bildirir. Ona yaxınlaşdıqca GC daha aqressiv işləyir, bu da konteynerlərdə qorxulu out-of-memory (OOM) öldürülməsinin qarşısını alır. Bu yumşaq bir limitdir: runtime onun altında qalmaq üçün əlindən gələni edəcək."
      },
      {
        "title": "GC işini müşahidə etmək və azaltmaq",
        "body": "Tənzimləmədən əvvəl ölçün: GODEBUG=gctrace=1 hər cycle üçün bir sətir çap edir, runtime.ReadMemStats / runtime/metrics package-i isə dashboard-lar üçün canlı rəqəmlər təqdim edir. Ən ucuz GC işi heç vaxt etmədiyiniz ayırmadır - buferləri yenidən istifadə edin, mümkün olduqda pointer əvəzinə dəyər (value) seçin, slice-ları tutumla əvvəlcədən ayırın."
      }
    ],
    "ai": {
      "title": "AI repetitorla daha sürətli öyrənin",
      "body": "Real bir gctrace sətirini bir LLM-ə yapışdırın və hər sahəni deşifr etməsini istəyin, sonra GOGC-ni ikiqat artırsanız rəqəmlərin necə dəyişəcəyini proqnozlaşdırmasını xahiş edin.",
      "prompt": "Bu Go servisimdən bir GODEBUG=gctrace=1 sətri: <paste>. Hər sahəni izah et (cycle nömrəsi, %CPU, üç fasilə/mərhələ vaxtı, heap ölçüləri). Sonra GOGC=200 qoysam nələrin dəyişəcəyini de, və bunun nə vaxt pis fikir olacağını."
    },
    "practice": {
      "title": "Özünüz sınayın",
      "body": "Collector-un istənilən kiçik Go proqramında necə işlədiyinə baxın.",
      "steps": [
        "Çoxlu qısaömürlü slice ayıran bir dövr yazın, sonra işə salın: GODEBUG=gctrace=1 go run main.go",
        "GOGC=400 go run main.go ilə yenidən işə salın və daha az, daha böyük GC sətirlərinə diqqət edin.",
        "debug.SetMemoryLimit(50<<20) əlavə edin və GC-nin tavana yaxınlaşdıqca daha aqressiv olduğuna baxın.",
        "HeapInuse və NumGC-ni görmək üçün əvvəl və sonra runtime.ReadMemStats çap edin."
      ]
    },
    "pitfalls": [
      "'Ehtiyat üçün' production-da runtime.GC() çağırmaq - o, əlavə stop-the-world işi məcbur edir və demək olar ki, həmişə throughput-a zərər verir.",
      "Yaddaşa qənaət etmək üçün GOGC-ni çox aşağı salmaq, sonra CPU-nun daimi collection-lardan tıxandığına təəccüblənmək.",
      "Konteynerlərdə GOMEMLIMIT-i nəzərə almamaq və GC-yə yaddaşı əvvəlcə geri almağa icazə vermək əvəzinə orkestratorun OOM-öldürməsinə məruz qalmaq."
    ],
    "takeaways": [
      "GC konkurentdir: fasilələr çox kiçikdir - throughput (collection-a xərclənən CPU) əsl xərcdir.",
      "GOGC yaddaşı CPU ilə dəyişir; GOMEMLIMIT isə ümumi yaddaşa yumşaq bir tavan qoyur.",
      "Ən sürətli collection heç vaxt etmədiyiniz ayırmadır - buferləri yenidən istifadə edin və əvvəlcədən ayırın."
    ],
    "checklist": [
      "Ağ/boz/qara-nı və write barrier-ə niyə ehtiyac olduğunu izah edə bilirsiniz.",
      "GOGC=100-ün nə demək olduğunu və onu necə dəyişməyi bilirsiniz (env + debug.SetGCPercent).",
      "İstənilən konteynerləşdirilmiş servis üçün GOMEMLIMIT qoyursunuz.",
      "Real GC davranışını müşahidə etmək üçün gctrace və ReadMemStats istifadə etmisiniz."
    ]
  },
  {
    "id": "f2",
    "title": "pprof ilə Profilləşdirmə",
    "short": "Profilləşdirmə (pprof)",
    "level": "Başlanğıc",
    "summary": "Proqramınızın harada yavaş olduğunu təxmin etməyi dayandırın. CPU, heap, goroutine və mutex profilləri toplayın, sonra onları go tool pprof və flame graph-larla oxuyun.",
    "plain": "Profiler proqramınız üçün bir fitness tracker-dir. Nəyin yavaş olduğunu düşünərək koda baxmaq əvəzinə, pprof işləyən proqramı saniyədə dəfələrlə sample edir və sizə dəqiq hansı funksiyaların CPU yandırdığını, ya da yaddaş tutduğunu deyir. Sonra təxmin əvəzinə real hotspot-u optimallaşdırırsınız - çox vaxt hotspot gözlədiyinizdən tamam başqa bir yerdə çıxır.",
    "animation": {
      "title": "CPU Sampling → Flame Graph",
      "blurb": "Sampler-in işləyən call stack-i saniyədə ~100 dəfə necə şəkillədiyini görün, bu sample-ların bir flame graph-a necə yığıldığına baxın və ən enli qutunu - hotspot-unuzu - tapın."
    },
    "animations": [
      {
        "title": "CPU Sampling → Flame Graph",
        "blurb": "Sampler-in işləyən call stack-i saniyədə ~100 dəfə necə şəkillədiyini görün, bu sample-ların bir flame graph-a necə yığıldığına baxın və ən enli qutunu - hotspot-unuzu - tapın."
      },
      {
        "title": "Düzgün pprof Profilini Seçmək",
        "blurb": "Simptomu profilə uyğunlaşdırın: yanan cycle-lar üçün CPU, yaddaş təzyiqi üçün heap, sızmalar üçün goroutine, gözləmə üçün isə block/mutex."
      },
      {
        "title": "Profilləşdir → Düzəlt → Yenidən Profilləşdir",
        "blurb": "Production optimallaşdırma dövrünü gəzin: yavaş yolu təkrarlayın, sübut toplayın, bir hotspot-u dəyişin və graph-ın həqiqətən düzləşdiyini təsdiqləyin."
      }
    ],
    "videos": [
      {
        "title": "GopherCon 2019: Two Go Programs, Three Different Profiling Techniques",
        "speaker": "Dave Cheney · GopherCon 2019",
        "url": "https://www.youtube.com/watch?v=nok0aYiGiYA",
        "blurb": "Dave Cheney canlı olaraq go tool pprof ilə CPU və yaddaş profilləşdirməsi yazır, sonra execution tracer-ə keçir - bu modulun öyrətdiyi məhz top/list/web iş axını."
      },
      {
        "title": "GopherCon 2021: Go Profiling and Observability from Scratch",
        "speaker": "Felix Geisendörfer · GopherCon 2021",
        "url": "https://www.youtube.com/watch?v=7hg4T2Qqowk",
        "blurb": "Go-nun CPU, heap, goroutine, mutex və block profiler-larını başdan sona gəzir, bu da bu modulun profile-types bölməsi ilə birbaşa üst-üstə düşür."
      }
    ],
    "concepts": [
      {
        "title": "Profil tipləri",
        "body": "Fərqli profillər fərqli suallara cavab verir. CPU: vaxt harada xərclənir? Heap: yaddaşı nə tutur/ayırır? Goroutine: neçə goroutine var və harada ilişib qalıblar (sızmalar üçün əladır)? Block & mutex: goroutine-lər sinxronizasiya üçün harada gözləyir?"
      },
      {
        "title": "Canlı bir serverdən toplamaq (net/http/pprof)",
        "body": "Ən asan yol: net/http/pprof-u yan-effekti üçün import edin, o da default mux-a debug endpoint-lər qeyd edir. Sonra işləyən proses-dən 30 saniyəlik bir CPU profili çəkin - heç bir yenidən deploy lazım deyil."
      },
      {
        "title": "Test və benchmark-lardan toplamaq",
        "body": "Bir server-ə ehtiyac yoxdur. go test profilləri birbaşa fayllara yazır, bu da bir benchmark altında konkret bir funksiyanı optimallaşdırmaq üçün mükəmməldir."
      },
      {
        "title": "go tool pprof-u idarə etmək",
        "body": "pprof daxilində top ən ağır funksiyaları göstərir, list <func> mənbəyi sətir-sətir annotasiya edir, web / -http isə brauzerdə interaktiv bir graph və flame graph açır. Flame graph adətən başladığınız yerdir."
      },
      {
        "title": "Bir flame graph oxumaq",
        "body": "Hər qutu bir funksiyadır; birbaşa üstündəki qutu onun çağıranının içindədir. Enlilik vaxta (ya da ayırmalara) mütənasibdir - ona görə ən enli qutular hotspot-lardır. Hündür-amma-dar stack-lər əslində çox bahalı olmayan dərin çağırış zəncirləridir. Hündürlüyü yox, enliliyi optimallaşdırın."
      }
    ],
    "ai": {
      "title": "AI repetitorla daha sürətli öyrənin",
      "body": "Mətn profilini (go tool pprof -top) export edin və bir LLM-in şübhəliləri sıralamasına və ən yuxarı frame-lər üçün konkret düzəlişlər təklif etməsinə icazə verin.",
      "prompt": "Bu, `go tool pprof -top cpu.out` əmrinin çıxışıdır: <paste>. İlk 3 hotspot-u müəyyən et, hər funksiyanın çox güman ki, nə etdiyini sadə dillə izah et və hər biri üçün konkret Go optimallaşdırmaları (ayırma azaltması, alqoritm, keşləmə) təklif et - tradeoff-larla birlikdə."
    },
    "practice": {
      "title": "Özünüz sınayın",
      "body": "Beş dəqiqədə başdan sona bir benchmark-ı profilləşdirin.",
      "steps": [
        "Yavaş bir funksiya yazın (məsələn, dövrdə += ilə string qurmaq) və onun üçün bir benchmark.",
        "İşə salın: go test -bench=. -cpuprofile cpu.out",
        "Flame graph-ı açın: go tool pprof -http=:8080 cpu.out",
        "Ən enli qutunu tapın, həmin funksiyanı yenidən yazın (məsələn, strings.Builder) və təsdiqləmək üçün yenidən profilləşdirin."
      ]
    },
    "pitfalls": [
      "race detector (-race) ilə, ya da heç bir optimallaşdırma olmadan qurulmuş bir binary-ni profilləşdirmək - rəqəmlər təhrif olunur. Normal bir build-i profilləşdirin.",
      "Flame graph-da hündür, dar bir stack-in ardınca getmək - hündürlük çağırış dərinliyidir, xərc yox. Ən enli qutuları optimallaşdırın.",
      "net/http/pprof-u ictimai bir portda açıq buraxmaq - o, daxili detalları sızdırır. Onu localhost-a ya da yalnız-admin bir listener-ə bağlayın."
    ],
    "takeaways": [
      "Əvvəlcə ölçün: profil çıxarın, ən enli qutunu tapın, onu optimallaşdırın, sonra yenidən ölçün.",
      "Sürət üçün CPU profili, yaddaş üçün heap profili, sızmalar üçün goroutine profili.",
      "Vaxtın hara getdiyini görməyin ən sürətli yolu web flame graph-dır (`-http`)."
    ],
    "checklist": [
      "Həm bir benchmark-dan, həm də canlı bir server-dən CPU profili toplaya bilirsiniz.",
      "top, list və -http flame graph ilə rahatsınız.",
      "Bir flame graph oxuya bilirsiniz: enlilik = xərc, yığılma = çağırış yuvalanması.",
      "Hansı profil tipinin hansı suala cavab verdiyini bilirsiniz."
    ]
  },
  {
    "id": "m1",
    "title": "Sıfır-Asılılıqlı Şəbəkə Marşrutlaşdırması və Məhdudlaşdırılmış IO",
    "short": "Marşrutlaşdırma və Məhdud IO",
    "level": "Orta Səviyyə",
    "summary": "gin/chi-dən imtina edib doğma net/http ServeMux-a keçin, path dəyişənlərini təhlükəsiz şəkildə çıxarın və os.Root ilə fayl sistemi girişini sandbox-a salaraq path-traversal bağlarını syscall səviyyəsində kökündən kəsin.",
    "plain": "Router - veb serverin gələn URL-i hansı funksiyanın emal edəcəyinə qərar verən hissəsidir. İllərlə hamı bunun üçün gin və ya chi kimi kitabxanalara müraciət edirdi. Go 1.22-dən bəri standart kitabxananın öz router-i metodları uyğunlaşdıra və URL dəyişənlərini tuta bilir, ona görə də bu asılılığı tamamilə silmək olar. Ayrıca, os.Root bir qovluğun ətrafındakı təhlükəsizlik hasarıdır: fayl oxunuşları fiziki olaraq onun hüdudlarından çıxa bilməz, bu da 'path traversal' hücumlarının bütöv bir sinfini dayandırır.",
    "animation": {
      "title": "Mux Trie və IO Sandbox",
      "blurb": "Router-in daxili radix trie üzərində gələn URL-i necə uyğunlaşdırdığını izləyin, eyni zamanda bir IO çağırışı fiziki olaraq öz os.Root sərhədindən çıxa bilmir."
    },
    "videos": [
      {
        "title": "GopherCon Europe 2024: HTTP Routing Enhancements",
        "speaker": "Jonathan Amsterdam · GopherCon Europe 2024",
        "url": "https://www.youtube.com/watch?v=4VSyrJI09K0",
        "blurb": "Bu funksiyanı dizayn edən Go komandası mühəndisi Go 1.22-nin ServeMux metod uyğunlaşdırmasını və wildcard/PathValue marşrutlaşdırmasını izah edir - modulun açılış mövzusu."
      }
    ],
    "concepts": [
      {
        "title": "http.ServeMux ilə doğma pattern uyğunlaşdırması",
        "body": "Go 1.22 standart ServeMux-u əsl router-ə çevirdi: metod uyğunlaşdırması, wildcard seqmentləri və üstünlük qaydaları daxili quruludur. Artıq maliyyə gateway-inin marşrutlaşdırılması üçün üçüncü tərəf asılılıq vergisi ödəmirsiniz."
      },
      {
        "title": "r.PathValue ilə təmiz path dəyişənləri",
        "body": "Pattern-də tutulan wildcard-lar r.PathValue ilə çıxarılır - nə regexp, nə context əl ilə daşınması, nə də allocation-ağır router vəziyyəti. Uyğunlaşmayan metod avtomatik olaraq düzgün Allow başlığı ilə 405 qaytarır."
      },
      {
        "title": "os.Root ilə qovluqla məhdudlaşdırılmış IO",
        "body": "os.Root (Go 1.24) bir qovluq açır və ondan kənara çıxan hər hansı əməliyyatı rədd edir - simlink qaçışları və ../ traversal daxil olmaqla. Konfiqurasiya yükləyiciləri və lokal-saxlama oxuyucuları yoxlama ilə deyil, quruluşla traversal-a qarşı toxunulmaz olur."
      },
      {
        "title": "go.mod tool direktivi ilə inkişaf alətləri",
        "body": "Go 1.24 birinci dərəcəli `tool` direktivlərini əlavə etdi. İcra olunan inkişaf alətlərini (sqlc, golangci-lint, protoc plugin-ləri) birbaşa go.mod-da elan edin və onları `go tool` ilə işə salın. Köhnə tools.go blank-import hiyləsi artıq lazım deyil."
      }
    ],
    "ai": {
      "title": "AI-İş Axını İnteqrasiyası",
      "body": "Cursor / Claude-a açıq Go struktur spesifikasiyaları ilə sorğu verərək köhnə gin/chi marşrutlarını dəqiq HTTP status kodlarını və middleware sırasını qoruyaraq doğma ServeMux konfiqurasiyalarına çevirin.",
      "prompt": "Refactor this gin router group into a Go 1.22+ http.ServeMux. Preserve every status code, keep GET/POST method matching explicit, replace c.Param(\"id\") with r.PathValue(\"id\"), and return 405 with an Allow header for method mismatches. Output only the rewritten handler + mux wiring."
    },
    "practice": {
      "title": "Özün sınayın",
      "body": "Doğma router qurun, sonra onun fayl girişini həbs edin.",
      "steps": [
        "Ən azı 3 marşrutu metod+wildcard pattern-ləri ilə (GET /x/{id}, POST /x) istifadə edən http.NewServeMux qurun və r.PathValue-nin wildcard-ı düzgün çıxardığını təsdiqləyin.",
        "Mövcud path-də təyin olunmamış metodu çağırın və ServeMux-un avtomatik olaraq düzgün Allow başlığı ilə 405 qaytardığını təsdiqləyin.",
        "os.OpenRoot ilə bir qovluğu əhatələyin və onun üzərindən \"../../etc/passwd\" oxumağa çalışın - qaçmaq əvəzinə xəta verdiyini təsdiqləyin.",
        "go.mod-a real bir inkişaf aləti üçün (məsələn, golangci-lint) tool direktivi əlavə edin və onu `go tool` ilə işə salın."
      ]
    },
    "pitfalls": [
      "Köhnə catch-all davranışını güman etmək: \"/\" kimi pattern artıq hər şeyi uyğunlaşdırmır - ServeMux indi ən-uzun-pattern-qazanır prinsipini istifadə edir.",
      "Path-ləri os.Root əvəzinə sətir yoxlamaları ilə (strings.Contains(p, \"..\")) yoxlamaq - fərqli simlink və encoding hiylələri əl yoxlamalarından sızır.",
      "Pattern-də metodu unutmaq (\"/x\" əvəzinə \"GET /x\" yazmaq) və hər verb-in eyni handler-ə düşməsinə təəccüblənmək."
    ],
    "takeaways": [
      "Go 1.22+ ServeMux metod + wildcard marşrutlaşdırmasını edir - əksər tətbiqlər router asılılığından imtina edə bilər.",
      "r.PathValue aydınlıq və allocation baxımından regexp router-lərdən üstündür.",
      "os.Root traversal hücumlarını yoxlama ilə deyil, quruluşla mümkünsüz edir."
    ],
    "checklist": [
      "Bütün marşrutlar net/http ServeMux ilə xidmət edilir - gin/chi/echo import-u yoxdur.",
      "Path dəyişənləri r.PathValue vasitəsilə, heç vaxt regexp ilə oxunur.",
      "Hər fayl sistemi oxunuşu os.Root həbsindən keçir.",
      "İnkişaf alətləri go.mod tool direktivi ilə elan olunub."
    ]
  },
  {
    "id": "m2",
    "title": "Yüksək-Performanslı Serializasiya və Yaddaş Geometriyası",
    "short": "Serializasiya və Yaddaş",
    "level": "Orta Səviyyə",
    "summary": "Ağır reflection JSON-dan encoding/json/v2 + streaming jsontext-ə keçin, opsional sahələri new(expr) ilə birbaşa ayırın və Go 1.24-ün Swiss-Table map-larının niyə cache miss-ləri aradan qaldırdığını anlayın.",
    "plain": "Serializasiya - yaddaşdakı struct-larınızı şəbəkə üzərindən göndərmək üçün bayt-lara (JSON kimi) çevirmək və geri qaytarmaqdır. Klassik encoding/json reflection istifadə edir, bu çevik, amma hot path-lərdə yavaşdır. Yeni json/v2 və streaming token API-si bunu xeyli sürətləndirir. Ayrıca, Go 1.24 daxili map tipini 'Swiss Table' düzülüşü ilə sakitcə yenidən qurdu, bu da bir dəfəyə çoxlu slot yoxlayaraq lookup-un daha az cache line-a toxunmasını təmin edir.",
    "animation": {
      "title": "Swiss Table və Köhnə Map Müqayisəsi",
      "blurb": "Yan-yana lookup izi: köhnə map bucket-ləri bir-bir yoxlayır, Swiss Table isə 8-slotluq qrupu hash edib bütün control bayt-larını bir dəfəyə yoxlayır."
    },
    "videos": [
      {
        "title": "Faster Go Maps With Swiss Tables",
        "speaker": "Michael Pratt · GopherCon EU 2025",
        "url": "https://www.youtube.com/watch?v=aqtIM5AK9t4",
        "blurb": "Bu dəyişikliyin arxasında duran Go komandası mühəndisi Go 1.24-ün daxili map-i Swiss Table-larla necə və niyə yenidən qurduğunu izah edir - modulun əsas yaddaş-geometriyası mövzusu."
      },
      {
        "title": "GopherCon 2023: The Future of JSON in Go",
        "speaker": "Joe Tsai · GopherCon 2023",
        "url": "https://www.youtube.com/watch?v=avilmOcHKHE",
        "blurb": "encoding/json/v2-nin dizayneri v1-də nəyin problemli olduğunu və yeni API-nin, jsontext streaming token-lərinin bunu necə həll etdiyini göstərir."
      },
      {
        "title": "GopherCon 2025: Understanding Escape Analysis to Speed Up Your Code",
        "speaker": "Bill Kennedy (Ardan Labs) · GopherCon 2025",
        "url": "https://www.youtube.com/watch?v=FUm0pfgWehI",
        "blurb": "Slice-ların və struct-ların stack-də qalıb-qalmadığını, yoxsa heap-ə çıxdığını görmək üçün escape-analysis kompilyator çıxışının necə oxunacağını göstərir - modulun stack-allocation bölməsi."
      }
    ],
    "concepts": [
      {
        "title": "encoding/json/v2 və streaming token-lər",
        "body": "json/v2 çağırış-başına reflection modelini daha sürətli, opsiya-idarəli enkoder və aşağı-səviyyəli jsontext token axını ilə əvəz edir. Milyonlarla payload göndərən ledger üçün streaming token-lər bütün sənədi yaddaşda qurmaqdan qaçır."
      },
      {
        "title": "new(expr) ilə birbaşa pointer ayrılması",
        "body": "new(expr) forması bir ifadədə literal dəyərə pointer ayırmağa imkan verir - nil-in 'yoxdur' mənasını verdiyi opsional JSON/Protobuf sahələri üçün mükəmməldir. Atılası lokal dəyişənlərə ehtiyac yoxdur."
      },
      {
        "title": "Swiss Table-lar: cache-dostu map-lar",
        "body": "Go 1.24 daxili map-i Swiss Table kimi yenidən qurdu. Yazılar 8-lik qruplarda, hər slot üçün yığcam control bayt ilə yaşayır; qrupun control bayt-ları SIMD-tərzi paralellik ilə skan edilir, ona görə lookup adətən bucket overflow pointer-lərini izləmək əvəzinə bir cache line-a toxunur."
      },
      {
        "title": "Slice backing store-ların stack-də ayrılması",
        "body": "Kompilyator getdikcə daha çox kiçik, qaçmayan slice-ların backing array-ini stack-də saxlaya biləcəyini sübut edir. Hot serializasiya bufferlərində escape analysis sıfır heap təzyiqi və keçici encode bufferləri üçün heç bir GC işi demək olur."
      }
    ],
    "ai": {
      "title": "AI-İş Axını İnteqrasiyası",
      "body": "Hot path-lərdə reflection-əsaslı json.Marshal çağırışlarını işarələyən və json/v2 token axınlarını avtomatik tövsiyə edən xüsusi golangci-lint qaydaları quraşdırın.",
      "prompt": "Write a golangci-lint custom rule (ruleguard/gorules) that flags json.Marshal/json.Unmarshal usage inside any function whose name matches /Encode|Serialize|hot/ and suggests the encoding/json/v2 MarshalWrite + jsontext.Encoder equivalent."
    },
    "practice": {
      "title": "Özün sınayın",
      "body": "Reflection-əsaslı JSON, new(expr) və Swiss Table-ların əsl fərqini hiss edin.",
      "steps": [
        "Eyni struct üçün json.Marshal-ı jsontext streaming enkoderi ilə benchmark edin və `go test -bench=. -benchmem` ilə ns/op və allocs/op-u müqayisə edin.",
        "Opsional *int64 sahəni birbaşa new(expr) ilə təyin edin və sıfır-dəyər halının hələ də omitted kimi marshal olunduğunu təsdiqləyin.",
        "1 milyon yazılı map[string]int64 qurun və təsadüfi-key lookup-larını benchmark edin - əvvəlki Go versiyalarından heç bir API dəyişikliyi yoxdur, yalnız daxili Swiss Table düzülüşü fərqlidir.",
        "Kiçik bir encode funksiyasını `-gcflags='-m'` ilə kompilyasiya edin və qaçmayan bufferin stack-də qaldığını təsdiqləyin."
      ]
    },
    "pitfalls": [
      "Hot path-də JSON parse etmək üçün map[string]any-ə müraciət etmək - bu ağır allocate edir və json/v2-nin bütün mənasını puça çıxarır.",
      "Swiss Table-ların semantikanı dəyişdiyini güman etmək - map iterasiya sırası yenə də randomizedir; ona güvənməyin.",
      "Stack bufferinə alias edən slice qaytarmaq - onu qaçmağa buraxmazdan əvvəl klonlayın (slices.Clone)."
    ],
    "takeaways": [
      "json/v2 + jsontext yüksək-buraxılış yoludur; reflection json isə rahatlıq yoludur.",
      "Swiss-Table map-lar lookup başına bir cache line-a toxunmaqla qazanır - key-lər və dəyərlər locality-dən faydalanır.",
      "Bufferin əsl olaraq stack-də qaldığını təsdiqləmək üçün -gcflags='-m' istifadə edin."
    ],
    "checklist": [
      "Hot encode/decode yolları reflection deyil, encoding/json/v2 istifadə edir.",
      "Opsional sahələr new(expr) ilə ayrılıb.",
      "Map-ağır kod Swiss-Table cache locality-si üçün nəzərdən keçirilib.",
      "Escape analysis keçici bufferlərin stack-də qaldığını təsdiqləyir."
    ]
  },
  {
    "id": "m5",
    "title": "Tip-Təhlükəsiz Persistensiya Qatları və Performans Testləri",
    "short": "Tip-Təhlükəsiz Persistensiya",
    "level": "Senior",
    "summary": "sqlc ilə xam SQL-dən kompilyasiya-yoxlanılan DB kodu yaradın, pgxpool-u istehsalat üçün tənzimləyin və Go 1.26-nın errors.AsType-i ilə Postgres xəta kodlarını uyğunlaşdırın.",
    "plain": "Verilənlər bazası ilə danışmaq bir çox bağların gizləndiyi yerdir. sqlc adi SQL yazmağa və ondan tip-təhlükəsiz Go funksiyaları yaratmağa imkan verir - beləliklə, səhv yazılmış sütun runtime-da yox, kompilyasiya zamanı uğursuz olur, saat 3-də deyil. pgxpool Postgres bağlantılarının hovuzunu səmərəli idarə edir. Sətir-səviyyəli kilidləmə isə eyni hesaba toxunan iki köçürmənin yük altında düzgün qalmasını təmin edir.",
    "animation": {
      "title": "SQL Tranzaksiya Dövrü",
      "blurb": "Bir ledger yazısını Go funksiyasından pgx batch-inə qədər izləyin, iki tranzaksiya yük altında rəqabət apararkən sətir-səviyyəli kilidləri vizuallaşdırın."
    },
    "videos": [
      {
        "title": "PGX Top to Bottom",
        "speaker": "Jack Christensen (author of pgx) · Golang Estonia",
        "url": "https://www.youtube.com/watch?v=sXMSWhcHCf8",
        "blurb": "pgx müəllifi driver-in arxitekturasını, o cümlədən pgxpool və tranzaksiya idarəçiliyini birbaşa mənbədən izah edir - modulun bağlantı-hovuzu və pgx.Tx məzmunu."
      },
      {
        "title": "Go & PostgreSQL",
        "speaker": "Pavlo Golub · FOSDEM 2023",
        "url": "https://www.youtube.com/watch?v=eC_XRGBqQN0",
        "blurb": "pgx ilə Postgres-ə qarşı möhkəm, yaxşı test edilmiş Go tətbiqi qurmaq haqqında FOSDEM PostgreSQL-devroom nitqi, modulun persistensiya-qatı məzmununu gücləndirir."
      },
      {
        "title": "Generate CRUD Golang code from SQL | Compare db/sql, gorm, sqlc & sqlx",
        "speaker": "TECH SCHOOL",
        "url": "https://www.youtube.com/watch?v=prh0hTyI1sU",
        "blurb": "sqlc ilə xam SQL-dən tip-təhlükəsiz Go kodu yaratmağı göstərir və onu db/sql, gorm və sqlx ilə müqayisə edir - modulun açıldığı alət."
      }
    ],
    "concepts": [
      {
        "title": "sqlc ilə kompilyasiya-yoxlanılan sorğular",
        "body": "sqlc əsl SQL-inizi və sxeminizi oxuyur, sonra tiplənmiş Go metodları yaradır. Səhv yazılmış sütun və ya yanlış arqument tipi kod-yaratma zamanı uğursuz olur, istehsalatda saat 3-də yox. Nə ORM, nə runtime reflection."
      },
      {
        "title": "İstehsalat pgxpool tənzimlənməsi",
        "body": "pgxpool həqiqi limitlər tələb edir: DB-yə uyğun ölçülmüş MaxConns, yük balanslaşdırıcıları ətrafında yenidən dövriyyə etmək üçün MaxConnLifetime, və müştəri bağlantını kəsdikdə uçuşdakı sorğunu təmiz ləğv edən context-bilikli sorğular."
      },
      {
        "title": "errors.AsType ilə tiplənmiş xətalar",
        "body": "Go 1.26-nın errors.AsType[T]-i generic, allocation-free errors.As-dir: *pgconn.PgError-u tutun və SQLSTATE-ini var-and-assert rəqsi olmadan oxuyun. Unikal pozuntuları və serializasiya uğursuzluqlarını dəqiq idarə edin."
      }
    ],
    "ai": {
      "title": "AI-İş Axını İnteqrasiyası",
      "body": "Agent-i yavaş-sorğu loglarına yönəldərək sxem/indeks dəyişiklikləri təklif edin və sqlc-yaradılmış data qatını yenidən yaradın.",
      "prompt": "Here are pg_stat_statements rows for the 10 slowest queries plus the schema. Propose covering indexes and query rewrites, output the modified SQL files in sqlc format, and list the exact sqlc generate command and the migration order."
    },
    "practice": {
      "title": "Özün sınayın",
      "body": "Sorğunu Postgres-ə çatmazdan əvvəl kompilyasiya zamanı sındırın.",
      "steps": [
        "Bir sqlc sorğusu yazın (məsələn, hesabı debit etmək) və səhv yazılmış sütun adının runtime-da deyil, `sqlc generate`-də uğursuz olduğunu təsdiqləyin.",
        "Açıq MaxConns/MaxConnLifetime ilə pgxpool konfiqurasiya edin, sonra sorğu ortasında context-i ləğv edin və sorğunun sonuna qədər işləmək əvəzinə dayandığını təsdiqləyin.",
        "Lokal Postgres-ə qarşı real unique_violation tetikləyin və onu errors.AsType[*pgconn.PgError] ilə dəqiq tutun.",
        "Eyni iki hesabda iki paralel debit/credit tranzaksiyası işlədin və SELECT ... FOR UPDATE-in onları rəqabət əvəzinə ardıcıllaşdırdığını təsdiqləyin."
      ]
    },
    "pitfalls": [
      "MaxConns-u Postgres-in idarə edə biləcəyindən çox yüksək təyin etmək - bağlantılar pulsuz deyil; tətbiqə deyil, verilənlər bazasına uyğun ölçüləndirin.",
      "Kod yollarında iki hesab sətrini uyğunsuz kilid sırası ilə yeniləmək - deadlock belə yaranır. Sətirləri həmişə sabit sırada kilidləyin.",
      "40001 serialization_failure-i yenidən cəhd etmək əvəzinə ümumi xəta kimi udmaq."
    ],
    "takeaways": [
      "sqlc SQL səhvlərini runtime-dan kompilyasiya zamanına köçürür.",
      "Bağlantı hovuzu istehsalat üçün açıq ölçüləndirmə və ömür müddəti tələb edir.",
      "Sətir kilidləri + sabit kilid sırası rəqabət altında double-entry yazılarını düzgün saxlayır."
    ],
    "checklist": [
      "Bütün DB girişi sqlc-yaradılıb - Go-da əl ilə yazılmış SQL sətri yoxdur.",
      "pgxpool açıq Max/Min conns və ömür müddətləri ilə ölçüləndirilib.",
      "Postgres xətaları errors.AsType + SQLSTATE ilə uyğunlaşdırılır.",
      "Double-entry yazıları tranzaksiya daxilində sətir-səviyyəli kilidlərdən istifadə edir."
    ]
  },
  {
    "id": "m17",
    "title": "PostgreSQL Əsasları və İstehsalat Tələləri",
    "short": "Postgres Tələləri",
    "level": "Senior",
    "summary": "Ledger invariantlarını qoruyan Postgres sxemləri dizayn edin, sorğu planlarını oxuyun, təhlükəsiz indekslər və miqrasiyalar qurun, kilidlər, vacuum, bloat və bağlantı təzyiqi ətrafında istehsalat tələlərindən qaçın.",
    "plain": "Postgres sadəcə sətirlərin yaşadığı yer deyil. O, sizin korrektlik sərhədinizin bir hissəsidir. Constraint-lər mümkünsüz vəziyyətləri rədd edir, indekslər sorğunun ani, yoxsa fəlakətli olacağına qərar verir, tranzaksiyalar hansı paralel yazıların qanuni olduğuna qərar verir, vacuum isə dünənki iş yükünün sabahkı latency sıçrayışına çevrilib-çevrilməyəcəyinə qərar verir. Verilənlər bazasını passiv saxlama qutusu kimi deyil, istehsalat alt-sistemi kimi rəftar edin.",
    "animation": {
      "title": "Ledger Sxemi və Constraint-lər",
      "blurb": "Bir köçürmənin hesablar, ledger yazıları, idempotensiya açarları və outbox boyunca hərəkətini izləyin ki, verilənlər bazası mümkünsüz vəziyyətləri Go onları göndərməzdən əvvəl rədd etsin."
    },
    "animations": [
      {
        "title": "Sxem Constraint-ləri, İdempotensiya və Outbox",
        "blurb": "CHECK, UNIQUE, foreign key-lər və outbox yazısının Postgres-i ledger-in son müdafiə xəttinə necə çevirdiyini görün."
      },
      {
        "title": "Sorğu Planlayıcısı, Kompozit İndekslər və EXPLAIN",
        "blurb": "Bir ledger-tarixçəsi sorğusunu ardıcıl skandan kompozit örtücü indeksə qədər izləyin, sonra onu EXPLAIN ANALYZE BUFFERS ilə təsdiqləyin."
      },
      {
        "title": "Kilidlər, Onlayn Miqrasiyalar və Vacuum Bloat-ı",
        "blurb": "İstehsalat tələlərini vizuallaşdırın: ağır DDL kilidləri, ölü tuple-ları sancan uzun tranzaksiyalar, yazıları hərəkətdə saxlayan batch backfill-lər."
      }
    ],
    "videos": [
      {
        "title": "Explaining the Postgres Query Optimizer",
        "speaker": "Bruce Momjian (PostgreSQL core team) · Citus Con 2022",
        "url": "https://www.youtube.com/watch?v=wLpcVM9qxV0",
        "blurb": "PostgreSQL core developer planlayıcının SQL-i icra planına necə çevirdiyini izah edir - EXPLAIN (ANALYZE, BUFFERS) çıxışını oxumağın altında duran zehni model."
      },
      {
        "title": "PGConf India 2024 - MVCC Unmasked",
        "speaker": "Bruce Momjian (PostgreSQL core team) · PGConf India 2024",
        "url": "https://www.youtube.com/watch?v=KSAy0QjHTN4",
        "blurb": "Postgres-in MVCC saxlama modelinin ölü tuple-ları necə yaratdığını izah edir - modulun vacuum/bloat bölməsinin dəqiq daxili işləyişi."
      },
      {
        "title": "PostgreSQL performance tips you have never seen before",
        "speaker": "Hans-Jürgen Schönig (Cybertec) · Citus Con 2023",
        "url": "https://www.youtube.com/watch?v=m8ogrogKjXo",
        "blurb": "İstehsalat Postgres-dən real performans sıxmaq üçün, o cümlədən partial və kompozit indekslər daxil olmaqla, az tanınan indeksləmə və sorğu-tənzimləmə hiylələrinin dərin toplusu."
      }
    ],
    "concepts": [
      {
        "title": "Sxem invariantları qorusun",
        "body": "Ledger sxemi hətta problemli servis deploy edilsə belə mümkünsüz pul vəziyyətlərini rədd etməlidir. Lokal həqiqətlər üçün CHECK constraint-lərdən, mülkiyyət üçün foreign key-lərdən, idempotensiya üçün UNIQUE constraint-lərdən və ledger mutasiyası ilə eyni tranzaksiyada yazılan outbox cədvəlindən istifadə edin."
      },
      {
        "title": "İndekslər sorğu formaları ilə müqavilədir",
        "body": "Sütunları sorğunuzun filtrlədiyi, sıraladığı və səhifələdiyi ardıcıllıqla indeksləyin. Bir hesabın son ledger yazıları üçün sorğu `(account_id, posted_at DESC)` istəyir, üç əlaqəsiz tək-sütunlu indeks yox. INCLUDE proyeksiya edilən sütunları örtə bilər, amma yalnız EXPLAIN planlayıcının onu həqiqətən istifadə etdiyini deyir."
      },
      {
        "title": "Miqrasiyalar expand-contract olmalıdır",
        "body": "Təhlükəsiz istehsalat miqrasiyası əvvəlcə sxemi geriyə-uyğun şəkildə genişləndirir, məhdud batch-lərdə backfill edir, sonra hər köhnə binary getdikdən sonra daraldır. Tək-atımlı yenidənyazmalardan və hot cədvəllərdə ağır kilidlərdən qaçın."
      },
      {
        "title": "İzolyasiya, kilidlər və deadlock-lar dizayn girişləridir",
        "body": "Postgres-in defolt izolyasiya səviyyəsi, Read Committed (hər ifadə yalnız həmin ifadə başlamazdan əvvəl commit olunmuş sətirləri görür), çox-sətirli biznes invariantlarını sehrli şəkildə təhlükəsiz etmir - iki paralel köçürmə hər biri köhnəlmiş balansı oxuyub ikisi də davam edə bilər. Köçürmələr üçün təsirlənən hesabları sabit sırada kilidləyin, tranzaksiyaları qısa saxlayın və serializasiya uğursuzluqlarını yenidən cəhd edin. Kilid sırası biznes dizaynıdır, sonradan düşünülən şey deyil."
      },
      {
        "title": "Vacuum, bloat və uzun tranzaksiyalar",
        "body": "Postgres UPDATE/DELETE zamanı sətri yerində üzərinə yazmır - MVCC (Multi-Version Concurrency Control) altında köhnə versiyanı saxlayır, ona görə paralel oxuyucular yazıçıları heç vaxt bloklamadan sabit snapshot görür. Bu güclüdür, amma uzunmüddətli tranzaksiya köhnə versiyaları yerində sanca bilər və onları təmizləyən arxa-plan prosesi olan vacuum-un bunu etməsinin qarşısını ala bilər. Bloat insidenta çevrilməzdən əvvəl boşda-tranzaksiyada sessiyaları, ölü tuple-ları və yavaş ifadələri izləyin."
      }
    ],
    "ai": {
      "title": "AI-İş Axını İnteqrasiyası",
      "body": "Agent-i verilənlər bazası-baxış tərəfdaşı kimi istifadə edin: ona sxem, miqrasiyalar, pg_stat_statements, EXPLAIN çıxışı və dəqiq trafik nümunəsini verin, sonra konkret indeks və miqrasiya risklərini soruşun.",
      "prompt": "Review this Postgres schema and migration plan for a financial ledger. Identify invariant gaps, missing constraints, unsafe DDL locks, indexes that do not match the query shapes, long-transaction/vacuum risks, and the exact EXPLAIN ANALYZE BUFFERS evidence you would require before approving it."
    },
    "practice": {
      "title": "Özün sınayın",
      "body": "Sxemi Go kodunuz işə düşməzdən əvvəl pis vəziyyətləri rədd etsin.",
      "steps": [
        "CHECK/UNIQUE/foreign-key constraint-ləri ilə accounts/transfers/outbox cədvəllərini yaradın, sonra mənfi balans əlavə etməyə çalışın və Postgres-in özünün onu rədd etdiyini təsdiqləyin.",
        "Filtrlənmiş+sıralanmış sorğuda uyğun kompozit indeks əlavə etməzdən əvvəl və sonra EXPLAIN (ANALYZE, BUFFERS) işlədin və planları müqayisə edin.",
        "İki psql sessiyası açın, hər birində eyni iki hesabı fərqli sıralarda kilidləyin və real deadlock reproduksiya edin - sonra sabit sırada kilidləməklə düzəldin.",
        "Tranzaksiya başladın, boşda buraxın və eyni cədvəldə başqa sessiyadan paralel yenilədikcə pg_stat_user_tables-da n_dead_tup-un artdığını izləyin."
      ]
    },
    "pitfalls": [
      "Hot cədvələ NOT NULL, defolt dəyərlər və ya yenidən yazılan sütunları alacağı kiliddi ölçmədən bir böyük miqrasiya kimi əlavə etmək.",
      "Sütunları bir-bir indeksləmək əvəzinə WHERE, ORDER BY, səhifələmə və proyeksiya edilən sütunlara uyğun kompozit indekslər qurmaq.",
      "Sessiyaları tranzaksiyada boşda buraxmaq, bu köhnə sətir versiyalarını sancır və normal MVCC dövriyyəsini cədvəl bloat-ına çevirə bilər.",
      "Read Committed-in hər biznes anomaliyasını qarşısını aldığını güman etmək. Almır; yenə də açıq kilidlərə, constraint-lərə, ya da yenidən-cəhdlərlə SERIALIZABLE-a ehtiyacınız var.",
      "Hər servisin böyük hovuz açmasına icazə vermək. Çox sayda bağlantı verilənlər bazasının özündə yaddaş, rəqabət və failover ağrısını artırır."
    ],
    "takeaways": [
      "Postgres korrektlik sərhədinin bir hissəsidir, sadəcə saxlama deyil.",
      "Constraint-lər və idempotensiya açarları pis deploy-lar və təkrarlanan sorğular üçün istehsalat təhlükəsizlik relsləridir.",
      "Sorğu performansı formadan başlayır: filtrlər, sıralama sırası, səhifələmə və qaytarılan sütunlar.",
      "Onlayn miqrasiyalar tək-atımlı DDL deyil, expand/backfill/contract hadisələridir.",
      "Vacuum və kilid davranışı insident olmazdan əvvəl müşahidə edilə bilməlidir."
    ],
    "checklist": [
      "Ledger invariantları CHECK, foreign key-lər, UNIQUE idempotensiya açarları və tranzaksional outbox yazıları ilə təmsil olunub.",
      "Hər hot sorğunun EXPLAIN (ANALYZE, BUFFERS) sübutu və formasına uyğun indeksi var.",
      "Miqrasiyalar expand/backfill/contract-a əməl edir və hot yollarda uzun eksklüziv kilidlərdən qaçır.",
      "Tranzaksiyalar sətirləri sabit sırada kilidləyir və SQLSTATE 40001 / 40P01-i təhlükəsiz yenidən cəhd edir.",
      "Dashboard-lar uzun tranzaksiyaları, ölü tuple-ları, autovacuum-u, yavaş sorğuları və bağlantı hovuzu doyğunluğunu izləyir."
    ]
  },
  {
    "id": "m13",
    "title": "Atomiklər vs Mutex-lər vs Kanallar",
    "short": "Sinxronizasiya",
    "level": "Senior",
    "summary": "Go goroutine-lərinin koordinasiya etdiyi üç yol - lock-free atomiklər, mutex-lər və kanallar - hər birinin memory model vasitəsilə əslində nəyi zəmanət etdiyi, nisbi dəyəri və hansını nə vaxt seçəcəyinizə dair aydın qərar bələdçisi.",
    "plain": "İki goroutine eyni datayla işləyəndə, sinxronizasiyaya ehtiyacınız var - onsuz data race olur, nəticə zamanlamadan asılı olur və proqram sadəcə sınmışdır (kompilyator/CPU isə oxuma-yazmalarınızı yenidən sıralamaqda sərbəstdir). Go sizə üç alət verir. Atomiklər ən yüngülü: bir sözü yeniləmək üçün tək maşın instruksiyası, kilid yoxdur. Mutex daha mürəkkəb vəziyyəti qorumaq üçün kritik seksiya ətrafında götürdüyünüz kiliddir. Kanallar isə datanın mülkiyyətini bir goroutine-dən digərinə ötürür, kimin ona toxunmaq hüququ olduğunu koordinasiya edir. Onlar bir-birini əvəz etmir - hər biri fərqli problem formasına uyğun gəlir - və bu modul düzgün seçim etmək və altında duran zəmanətləri anlamaqdır.",
    "animation": {
      "title": "Atomic CAS vs Mutex vs Kanal Ötürməsi",
      "blurb": "Üç zolaq, rəqabət altında eyni iş: lock-free atomic compare-and-swap, kritik seksiyanı ardıcıllaşdıran mutex, və dəyəri istehsalçıdan istehlakçıya ötürən kanal."
    },
    "videos": [
      {
        "title": "\"go test -race\" Under the Hood",
        "speaker": "Kavya Joshi · Strange Loop",
        "url": "https://www.youtube.com/watch?v=5erqWdlhQLA",
        "blurb": "Keçmiş Go runtime mühəndisi race detector-un happens-before yaddaş zəmanətini necə modelləşdirdiyini izah edir - modulun data-race bölməsinin tələb etdiyi nəzəri əsas."
      },
      {
        "title": "GopherCon 2017: Understanding Channels",
        "speaker": "Kavya Joshi · GopherCon 2017",
        "url": "https://www.youtube.com/watch?v=KBZlN0izeiY",
        "blurb": "Kanalların datanın mülkiyyətini dəqiq necə ötürdüyünü göstərmək üçün kanal daxilinə enir - modulun qərar çərçivəsinin üçüncü ayağı."
      },
      {
        "title": "GopherCon 2018: Rethinking Classical Concurrency Patterns",
        "speaker": "Bryan C. Mills (Go team) · GopherCon 2018",
        "url": "https://www.youtube.com/watch?v=5zXAHh5tJqQ",
        "blurb": "Go komandası mühəndisi klassik mutex/semaphore nümunələrini goroutine-və-kanal idiomları kimi yenidən çərçivələyir, modulun 'hansı primitivi nə vaxt' bələdçisinə birbaşa təsir edir."
      }
    ],
    "concepts": [
      {
        "title": "Data race və memory model (happens-before)",
        "body": "Data race - iki goroutine-in ən azı biri yazma olmaqla, aralarında sinxronizasiya olmadan eyni yaddaşa paralel müraciət etməsidir. Nəticə qeyri-müəyyəndir - sadəcə 'səhv rəqəm' deyil, həqiqətən spesifikasiya olunmamış davranış, çünki kompilyator və CPU əməliyyatları yenidən sıralaya bilər (M11 modulu). Go memory modeli 'happens-before'-u müəyyən edir: sinxronizasiya əməliyyatları (kanal göndər/qəbul, mutex Lock/Unlock, atomic) bir goroutine-in yazılarını digərinə görünən edən sıralama yaradır. Hər düzgün paralel proqram bu sıralama zəmanətləri üzərində qurulub. Həmişə `-race` ilə test edin."
      },
      {
        "title": "Atomiklər: tək sözə lock-free yeniləmələr",
        "body": "`sync/atomic` (tiplənmiş `atomic.Int64`, `atomic.Bool`, `atomic.Pointer[T]` istifadə edin) bir maşın sözü üzərində CPU instruksiyası ilə bölünməz oxu-dəyiş-yaz əməliyyatı icra edir - kilid yoxdur, bloklama yoxdur, heç bir goroutine gözləmir. Ən sürətli primitivdir, sayğaclar, bayraqlar və tək dəyərin lock-free dəyişdirilməsi üçün idealdır. Əsas quruculuq bloku compare-and-swap-dır (CAS): 'X-i yalnız hələ də old-a bərabərdirsə new-ə təyin et', uğur qazanana qədər dövr edir. Limit: atomiklər YALNIZ BİR sözü qoruyur. İnvariantınız iki əlaqəli dəyişənə yayıldığı an, atomic onları uyğun saxlaya bilməz - mutex lazımdır."
      },
      {
        "title": "Mutex: kritik seksiya ətrafında kilid",
        "body": "`sync.Mutex` kritik seksiyanı qoruyur: eyni anda yalnız bir goroutine kilidə sahibdir, ona görə daxildəki çox-addımlı yeniləmə digər goroutine-lərə görə atomik görünür. Bu, invariantın bir neçə sahəyə yayıldığı halda (map plus onun ölçüsü, balans plus jurnal) düzgün alətdir - məhz atomiklərin edə bilmədiyi şey. `sync.RWMutex` çoxlu paralel oxuyucuya VƏ YA bir yazıçıya icazə verir, oxu-üstün vəziyyət üçün qazancdır. Qayda: kritik seksiyaları QISA saxlayın (kilid altında IO yoxdur), Lock-u həmişə `defer Unlock` ilə cütləyin və mutex daxil olan struct-ı heç vaxt kopyalamayın."
      },
      {
        "title": "Kanallar: mülkiyyəti ötürür, işi koordinasiya edir",
        "body": "Kanal datanı daşımaqdan çox şey edir - o, MÜLKİYYƏTİ daşıyır. 'Yaddaşı paylaşaraq ünsiyyət qurmayın; ünsiyyət qurmaqla yaddaşı paylaşın': iki goroutine-in də toxunduğu dəyəri kilidləmək əvəzinə, dəyəri kanal vasitəsilə ötürün ki, eyni anda yalnız bir goroutine ona sahib olsun, paylaşılan vəziyyəti tamamilə aradan qaldıraraq. Kanallar pipeline-lar, fan-out/fan-in worker hovuzları, tamamlanmanı və ya ləğvi siqnallaşdırmaq, backpressure tətbiq etmək (dolu buferli kanal sürətli istehsalçını bloklayır) üçün parlayır. Onlar mutex-dən əməliyyat başına daha bahalıdır, ona görə onları koordinasiya və data axını üçün istifadə edin - sayğac ətrafında fantaziy kilid kimi yox."
      },
      {
        "title": "Qərar bələdçisi: hansını və nə vaxt",
        "body": "Zövqə görə deyil, PROBLEMİN FORMASINA görə seçin. Bir sayğac və ya bayraq, ya da tək dəyərin hot-swap edilməsi → atomic (ən sürətli, lock-free). Bir neçə sahəyə yayılan invariant, ya da oxu-üstün paylaşılan vəziyyət → mutex (oxular üstünlük təşkil edərsə RWMutex). Goroutine-lər arasında data ötürmək, pipeline-lar, worker hovuzları, ləğv, ya da backpressure → kanallar. İkisi də uyğun gələndə, ən sadə düzgün olanı seçin: sayğac ətrafında mutex kağız kanal rəqsindən daha aydındır; atomic sayğac sadəcə sayğac olduqda mutex-dən üstündür. Optimallaşdırmazdan əvvəl rəqabəti ölçün - və hər seçim yenə də doğrulama üçün `-race` tələb edir."
      }
    ],
    "ai": {
      "title": "AI müəllimlə daha sürətli öyrənin",
      "body": "Paylaşılan vəziyyəti təsvir edin və LLM-ə hansı primitivin uyğun gəldiyini müzakirə etməyə buraxın - sonra onun məntiqini yuxarıdakı qaydalarla yoxlayın.",
      "prompt": "I have this shared state accessed by multiple goroutines in Go: <describe the fields and who reads/writes them>. Recommend atomic vs sync.Mutex/RWMutex vs channel, explain the happens-before guarantee that makes it correct, point out any data race, and show the idiomatic implementation. Note the trade-offs if I picked a different primitive."
    },
    "practice": {
      "title": "Özün sınayın",
      "body": "Eyni sayğacı üç yolla qurun və fərqi hiss edin.",
      "steps": [
        "100 goroutine-dən sinxronizasiyasız paylaşılan sayğacı artırın, -race ilə işlədin və hem race raport etdiyini, hem də səhv cəm verdiyini müşahidə edin.",
        "Onu əvvəlcə atomic.Int64.Add ilə, sonra sync.Mutex ilə, sonra artırmaları tək sahib goroutine-ə kanal vasitəsilə göndərərək düzəldin.",
        "Üç variantı da rəqabət altında `go test -bench` və `-cpu=1,4,8` ilə benchmark edin - atomiklərin harada qazandığını, kanalların harada baha başa gəldiyini qeyd edin.",
        "RWMutex ilə oxu-üstün keş qurun və RLock buraxılışını sadə Mutex ilə müqayisə edin."
      ]
    },
    "pitfalls": [
      "İki sahəyə yayılan invariantı qorumaq üçün hər sahə üçün ayrı atomic istifadə etmək - hər yeniləmə atomikdir, amma cüt yenə də uyğunsuz müşahidə oluna bilər; mutex istifadə edin.",
      "IO və ya kanal əməliyyatı boyunca mutex saxlamaq, qısa kritik seksiyanı rəqabət darboğazına (ya da deadlock-a) çevirmək.",
      "Sayğac ətrafında ümumi-məqsədli kilid kimi kanallara müraciət etmək - bu atomic və ya mutex-dən yavaş və az aydındır."
    ],
    "takeaways": [
      "Sinxronizasiya opsional deyil: sinxronizasiya olunmamış paylaşılan yazı data race və qeyri-müəyyən davranışdır - həmişə `-race` işlədin.",
      "Atomiklər tək sözü lock-free qoruyur; mutex-lər çox-sahəli invariantları qoruyur; kanallar mülkiyyəti ötürür və koordinasiya edir.",
      "Problemin formasına görə seçin və ən sadə düzgün primitivi üstün tutun; optimallaşdırmazdan əvvəl rəqabəti ölçün."
    ],
    "checklist": [
      "Data race-i müəyyən edə və hər primitivin verdiyi happens-before kənarını adlandıra bilirsiniz.",
      "Atomic-in kifayət etmədiyi və mutex-in tələb olunduğu halı bilirsiniz.",
      "Sayğacı atomic, mutex və kanal ilə tətbiq edə və mübadilələri izah edə bilirsiniz.",
      "Defolt olaraq hər paralel testi -race ilə işlədirsiniz."
    ]
  },
  {
    "id": "m4",
    "title": "Flake-Free Konkurentlik və Deterministik Testləşdirmə",
    "short": "Deterministik Testləşdirmə",
    "level": "Senior",
    "summary": "testing/synctest-in idarə olunan zaman qabarcıqları ilə time.Sleep-ə əsaslanan flaky testləri öldürün, testing.B.Loop ilə proqnozlaşdırıla bilən benchmark-lar yazın.",
    "plain": "Konkurentlik testləri 'flaky' olması ilə məşhurdur - lokalda keçir, CI-də təsadüfi uğursuz olur, çünki goroutine-lərin bitməsini gözləmək üçün time.Sleep-ə güvənirlər. testing/synctest bunu 'qabarcıq' daxilində testə saxta saat verməklə düzəldir: hər goroutine bloklandıqda virtual zaman ani və deterministik şəkildə irəli sıçrayır, ona görə də yarışacaq heç nə qalmır.",
    "animation": {
      "title": "Synctest Saat Qabarcığı",
      "blurb": "Paralel rutinlər saxta saatı olan izolə edilmiş qabarcıq daxilində işləyir. Hər rutin bloklandıqda zaman təmiz irəli sıçrayır - yuxu yoxdur, flake yoxdur."
    },
    "videos": [
      {
        "title": "Testing Time (and other asynchronous code)",
        "speaker": "Damien Neil (Go team) · GopherCon EU 2025",
        "url": "https://www.youtube.com/watch?v=oIC3zhTAOsY",
        "blurb": "testing/synctest-in arxasında duran Go komandası mühəndisi saxta-saat qabarcığını, synctest.Wait-i və avtomatik deadlock aşkarlanmasını izah edir - modulun əsas mövzusu."
      },
      {
        "title": "GopherCon UK 2021: Deadlocks: The Dark Side of Concurrency",
        "speaker": "Nick Craig-Wood · GopherCon UK 2021",
        "url": "https://www.youtube.com/watch?v=9j0oQkqzhAE",
        "blurb": "Goroutine deadlock-larının praktikada tutmağın niyə çətin olduğunu izah edir - synctest-in avtomatik deadlock aşkarlanmasının həll etmək üçün dizayn edildiyi məhz problem nöqtəsi."
      }
    ],
    "concepts": [
      {
        "title": "synctest.Run ilə izolə edilmiş zaman",
        "body": "testing/synctest (Go 1.25-də stabil) goroutine ağacını saxta saatı olan 'qabarcıq' daxilində işlədir. time.Sleep, timer-lər və ticker-lər virtualdır: bütün qabarcıqlanmış goroutine-lər bloklandıqda, saxta saat növbəti timer-ə ani və deterministik şəkildə sıçrayır."
      },
      {
        "title": "synctest.Wait ilə sabit vəziyyətə çatmaq",
        "body": "synctest.Wait qabarcıqdakı hər digər goroutine davamlı bloklanana qədər çağıranı bloklayır. Bu, 'yat 100ms və uman ki, planlaşdırıldı' nümunələrini durğunluq üzərində dəqiq baryerlə əvəz edir."
      },
      {
        "title": "testing.B.Loop ilə proqnozlaşdırıla bilən benchmark-lar",
        "body": "b.Loop() (Go 1.24) for i := 0; i < b.N nümunəsini əvəz edir. O, benchmark edilən dəyərləri dead-code elimination-a qarşı canlı saxlayır və setup-u bir dəfə işlədir, sabit, kompilyator-dostu iterasiya sayları verir."
      }
    ],
    "ai": {
      "title": "AI-İş Axını İnteqrasiyası",
      "body": "time.Sleep-ə söykənən flaky inteqrasiya testlərini deterministik synctest qabarcıqlarına refactor etmək üçün LLM istifadə edin.",
      "prompt": "Convert this integration test from time.Sleep-based synchronization to testing/synctest. Wrap the body in synctest.Test, replace each 'sleep then assert' with synctest.Wait, and keep all original assertions. Explain any sleep you could not mechanically remove."
    },
    "practice": {
      "title": "Özün sınayın",
      "body": "Flaky yuxu-əsaslı testi deterministik testə çevirin və sürət fərqini hiss edin.",
      "steps": [
        "time.Sleep(5*time.Second) edən goroutine yaradan test yazın və real yuxu istifadə edərək nəticəni təsdiqləyin - testin nə qədər vaxt apardığını ölçün.",
        "Eyni testi synctest.Test daxilində yenidən yazın və onun saniyələr yox, millisaniyələr ərzində keçdiyini təsdiqləyin.",
        "Təsdiqinizdən əvvəl yuxu əvəzinə synctest.Wait() əlavə edin və onun qabarcıqdakı hər goroutine sancılana qədər bloklandığını təsdiqləyin.",
        "`for i := 0; i < b.N` benchmark-ı `for b.Loop()`-a çevirin və benchmark nəticəsinin təkrar işlərdə sabit olduğunu təsdiqləyin."
      ]
    },
    "pitfalls": [
      "Synctest qabarcığı daxilində real I/O (şəbəkə, disk) etmək - yalnız saxta saat virtuallaşdırılıb; real bloklama yenə də bloklayır. Qabarcıqları yaddaş-daxili konkurentliklə saxlayın.",
      "Synctest-in orada kömək edəcəyini düşünərək istehsalat kodunda time.Sleep-i əvəz etmək - bu yalnız test alətidir.",
      "Hələ də `for i := 0; i < b.N` döngüləri yazmaq - onlar dead-code elimination ilə asanlıqla səhv gedir; b.Loop() istifadə edin."
    ],
    "takeaways": [
      "synctest konkurentlik testlərinə deterministik virtual saat verir - yuxu yoxdur, flake yoxdur.",
      "synctest.Wait dəqiq 'hər kəs sancılıb' baryeridir.",
      "b.Loop() müasir, ayaq-tələsi-olmayan benchmark döngüsüdür."
    ],
    "checklist": [
      "Testlərdə time.Sleep yoxdur - konkurentlik synctest vasitəsilə test olunur.",
      "Sabit vəziyyəti təsdiqləmək üçün synctest.Wait istifadə olunur.",
      "Benchmark-lar əl ilə b.N döngüləri yox, b.Loop() istifadə edir.",
      "CI sıfır flake ilə race detector işlədir."
    ]
  },
  {
    "id": "m3",
    "title": "Obyekt Həyat Dövrləri, Interning və Runtime Daxili Mexanizmləri",
    "short": "Həyat Dövrləri və Interning",
    "level": "Senior",
    "summary": "Etibarsız finalizer-ləri proqnozlaşdırıla bilən runtime.AddCleanup ilə əvəz edin, unique interning paketi ilə yaddaşı sıxlaşdırın və planlayıcının (scheduler) preemption, netpoller və kilidsiz icra yollarını öyrənin.",
    "plain": "Bir obyekt yığılmaq üzrə olanda bəzən təmizləmə işi görmək lazım gəlir - fayl deskriptorunu bağlamaq, handle-i azad etmək. Köhnə alət (finalizer-lər) etibarsız idi. runtime.AddCleanup bunun müasir, proqnozlaşdırıla bilən əvəzidir. \"Interning\" isə ayrı bir yaddaş hiyləsidir: əgər milyonlarla hesab eyni \"USD\" sətrini saxlayırsa, siz sadəcə bir nüsxə saxlayıb hamısını ona işarə etdirə bilərsiniz. Bu modul həmçinin goroutine-lərinizi işə salan planlayıcının (scheduler) içinə nəzər salır.",
    "animation": {
      "title": "Təmizləmə Ardıcıllığı",
      "blurb": "Bir obyekt əlçatmaz olur; GC onun AddCleanup handler-ini deterministik şəkildə işə salır - valideyn span-ın yığılmasını gecikdirmədən."
    },
    "videos": [
      {
        "title": "GopherCon 2018: The Scheduler Saga",
        "speaker": "Kavya Joshi · GopherCon 2018",
        "url": "https://www.youtube.com/watch?v=YHRO5WQGh0k",
        "blurb": "Go runtime planlayıcısının (scheduler) daxili mexanizmlərinə həsr olunmuş əsaslı dərinləşmə - bu modulun runtime-daxili yarısı (AddCleanup/unique/weak API-ləri yalnız Go 1.23-1.24-də çıxdığı üçün onlara xüsusi həsr olunmuş konfrans çıxışı hələ yoxdur)."
      }
    ],
    "concepts": [
      {
        "title": "runtime.AddCleanup ilə deterministik təmizləmə",
        "body": "runtime.SetFinalizer kövrəkdir: obyektləri dirildir, qeyri-müəyyən ardıcıllıqla işləyir və yığılmanı bloklayır. runtime.AddCleanup (Go 1.24) obyekt həqiqətən əlçatmaz olduqdan sonra bir dəfə işləyən, dirilmə və dövr tələsi olmayan təmizləmə əlavə edir."
      },
      {
        "title": "unique paketi ilə dəyərlərin intern edilməsi",
        "body": "Ledger-in milyonlarla sətri eyni valyuta kodlarını və status sətirlərini təkrarlayır. unique.Make bərabər dəyərləri bir paylaşılan handle-ə kanonikləşdirir, yaddaşı sıxlaşdırır və sətir müqayisəsini bayt-bayt yoxlamadan işarəçi müqayisəsinə çevirir."
      },
      {
        "title": "Runtime planlayıcısının (scheduler) içində",
        "body": "G-M-P modeli goroutine-ləri (G) prosessorlar (P) vasitəsilə OS thread-lərinə (M) multipleksləşdirir. Asinxron preemption-u (planlayıcı sıx dövrləri kəsə bilir), netpoller oyanışlarını (IO-da bloklanmış goroutine-lər gözləmək əvəzinə park edilir) və P-lər arasında kilidsiz run-queue oğurluqlarını başa düşün."
      }
    ],
    "ai": {
      "title": "AI İş Axını İnteqrasiyası",
      "body": "İşarəçi dövrlərini yoxlamaq və valideyn obyekti heç vaxt tələyə salmayan, dəyəri yalnız dəyər kimi capture edən yaddaş-təhlükəsiz runtime.AddCleanup strukturları yaratmaq üçün LLM kod sintezindən istifadə edin.",
      "prompt": "Bu struct qrafını runtime.AddCleanup təhlükəsizliyi baxımından yoxla. Təmizlənən obyekti özü capture edən (valideynə özünə-istinad sızması yaradan) hər hansı cleanup closure-unu qeyd et və onu yalnız primitiv resurs handle-ini dəyər kimi capture edəcək şəkildə yenidən yaz."
    },
    "practice": {
      "title": "Özün sına",
      "body": "Bir cleanup-un tam bir dəfə işə düşdüyünü izlə, sonra interning-in yaddaş qazancını ölç.",
      "steps": [
        "Bir struct-a runtime.AddCleanup əlavə et, ona olan hər istinadı burax, runtime.GC()-i məcbur et və cleanup-un tam bir dəfə işə düşdüyünü təsdiqlə.",
        "unique.Make ilə 1000 təkrarlanan sətri intern et və yaddaşı (və ya işarəçi identikliyini) eyni sətrin 1000 ayrıca ayrılmış nüsxəsi ilə müqayisə et.",
        "CPU-yönümlü bir `for {}` goroutine-i digərlərinin yanında başlat və onların proqram donmaq əvəzinə hələ də planlaşdırıldığını (asinxron preemption) təsdiqlə.",
        "Qəsdən valideyn struct-ı bir AddCleanup closure-u daxilində capture et və artan yaddaş profili vasitəsilə onun heç vaxt yığılmadığını təsdiqlə - bu modulun xəbərdarlıq etdiyi məhz həmin sızmadır."
      ]
    },
    "pitfalls": [
      "AddCleanup closure-unda obyektin özünü capture etmək - bu, obyekti əbədi əlçatan saxlayır, yəni qaçmağa çalışdığın həmin sızma. Ham handle-i dəyər kimi capture et.",
      "Cleanup-ları dərhal və ya mütləq işə düşəcək kimi görmək - onlar yığılmadan sonra işə düşür, bu isə söndürmə zamanı heç vaxt ola bilər. Onları əsas bağlanma yolun kimi deyil, ehtiyat mexanizmi kimi istifadə et.",
      "Nadir təkrarlanan, sərhədsiz dəyərləri intern etmək - qlobal cədvəl sadəcə böyüyür. Valyuta kodları kimi yüksək-kardinallıqlı-amma-təkrarlanan dəyərləri intern et."
    ],
    "takeaways": [
      "SetFinalizer əvəzinə runtime.AddCleanup-a üstünlük ver - bir dəfə, proqnozlaşdırıla bilən, dirilmə yoxdur.",
      "unique.Make təkrarlanan sətirləri paylaşılan, işarəçi ilə müqayisə edilə bilən handle-ə sıxlaşdırır.",
      "G-M-P-i başa düşmək bloklanan I/O-nun niyə thread israf etmədiyini izah edir."
    ],
    "checklist": [
      "Sıfır runtime.SetFinalizer - bütün təmizləmə runtime.AddCleanup vasitəsilə.",
      "Cleanup-lar resurs handle-lərini dəyər kimi capture edir, heç vaxt valideyni yox.",
      "Təkrarlanan metadata sətirləri unique.Make ilə intern edilib.",
      "G-M-P-i, asinxron preemption-u və netpoller oyanışlarını izah edə bilir."
    ]
  },
  {
    "id": "m7",
    "title": "Canlı Diaqnostika, Profilləşdirmə və Kriminalistika",
    "short": "Diaqnostika və Kriminalistika",
    "level": "Staff",
    "summary": "FlightRecorder ilə davamlı in-memory trace saxla, siqnal zamanı diaqnostik vəziyyəti dump et və goroutine-sızma analizatoru ilə deadlock/sızmaları avtomatik izlə.",
    "plain": "İstehsalatda insident baş verəndə ən pis hiss \"kaş qeyd edirdim\" hissidir. FlightRecorder həmişə, ucuz şəkildə, yaddaşda son bir neçə saniyəlik ətraflı icra tarixçəsini saxlayır - beləliklə gecikmə sıçrayışı olanda və ya proses çökəndə, uğursuzluğa qədər olan pəncərəni dump edirsən. Goroutine-sızma analizatoru isə avtomatik olaraq bir goroutine-in niyə ilişib qaldığını göstərir.",
    "animation": {
      "title": "Sızma Kriminalistika Qrafı",
      "blurb": "Bloklanmış bir istehsalat goroutine-i; sızma analizatoru channel qrafını geriyə - işə düşməmiş bir channel və ya çatışmayan context deadline-ına qədər - izləyir."
    },
    "videos": [
      {
        "title": "GopherCon 2017: An Introduction to \"go tool trace\"",
        "speaker": "Rhys Hiltner · GopherCon 2017",
        "url": "https://www.youtube.com/watch?v=V74JnrGTwKA",
        "blurb": "go tool trace haqqında əsas çıxış - FlightRecorder snapshot-larının qurulduğu icra-trace zaman xəttinin necə oxunacağını addım-addım göstərir."
      },
      {
        "title": "GopherCon 2021: Go Profiling and Observability from Scratch",
        "speaker": "Felix Geisendörfer · GopherCon 2021",
        "url": "https://www.youtube.com/watch?v=7hg4T2Qqowk",
        "blurb": "Go-nun bütün diaqnostika alət qutusunu - profilləşdiricilər və runtime tracer-i - əhatə edir. Bu, bu modulun threshold ilə işə düşən dump-lar ətrafında qurduğu eyni istehsalat-kriminalistikası düşüncəsidir."
      }
    ],
    "concepts": [
      {
        "title": "FlightRecorder ilə həmişə-aktiv tracing",
        "body": "trace.FlightRecorder (Go 1.25) yaddaşda son icra hadisələrinin sərhədli ring buffer-ini demək olar ki, sıfır dəyərlə saxlayır. Sən trace yazmaq üçün yalnız maraqlı bir şey baş verəndə pul ödəyirsən - beləliklə çöküşdən *əvvəlki* pəncərəni tuturuşan, loglaşdırma ilə yenidən deploy etdikdən sonrakını yox."
      },
      {
        "title": "Threshold ilə işə düşən diaqnostik dump-lar",
        "body": "Recorder-i SLO alarmlarına və panic handler-lərinə bağla. p99 gecikmə bir xətti keçəndə və ya proses çökəndə, kök səbəbin uğursuzluq anında tutulması üçün trace-i, heap profilini və goroutine dump-ını atomik şəkildə birlikdə yaz."
      },
      {
        "title": "Avtomatik sızma aşkarlanması",
        "body": "Goroutine-sızma analizatoru park edilmiş goroutine-ləri araşdırır və hər bir blokadanı öz səbəbinə - göndərəni olmayan channel, heç vaxt sıfıra çatmayan WaitGroup, çatışmayan context deadline-ı - qədər izləyir. Bu, saatlarla log qazmasını avtomatik yaradılan hesabata çevirir."
      }
    ],
    "ai": {
      "title": "AI İş Axını İnteqrasiyası",
      "body": "p99 gecikmə reqressiyalarının kök səbəbini lokallaşdırmaq üçün FlightRecorder trace pəncərələrini diaqnostik agentə ver.",
      "prompt": "p99 gecikmə sıçrayışı ətrafında tutulmuş bu runtime/trace flight recording-i analiz et. Üstün olan bloklama hadisələrini, kritik yoldakı goroutine-ləri və səbəbin GC, kilid mübahisəsi, yoxsa syscall dayanması olduğunu müəyyən et. Sıralanmış kök-səbəb fərziyyələri siyahısı çıxar."
    },
    "practice": {
      "title": "Özün sına",
      "body": "Süni bir uğursuzluqdan əvvəlki saniyələri tut - sonra bir sızmanı avtomatik ov.",
      "steps": [
        "Bir trace.FlightRecorder başlat, bir az yük çalışdır, sonra əl ilə bir dump işə sal və onu `go tool trace` ilə aç.",
        "Dump-ın yalnız süni gecikmə həddi keçildikdə işə düşdüyünü təmin et və normal trafikin heç vaxt yazma tetiklemədiyini təsdiqlə.",
        "Qəsdən bir goroutine sızdır (heç kimin bağlamadığı bir channel-da blokla) və onu bir testdə goroutine-sızma yoxlaması ilə tut.",
        "Sərhədli bir FlightRecorder-in overhead-ini eyni yük altında davamlı tam tracing saxlamaqla müqayisə et."
      ]
    },
    "pitfalls": [
      "\"Ehtiyat üçün\" tam davamlı trace açmaq - bu bahalıdır. FlightRecorder-in sərhədli ring buffer-i ucuz, həmişə-aktiv seçimdir.",
      "Hər kiçik sıçrayışda diaqnostika dump etmək - fayllar altında boğulacaqsan. Dump-ları həqiqi SLO pozuntularına və cooldown-a bağla.",
      "Testlərdə sızma yoxlamaları olmadan göndərmək, sonra goroutine artımını yalnız istehsalatda kəşf etmək."
    ],
    "takeaways": [
      "FlightRecorder uğursuzluqdan əvvəlki anları ucuz və davamlı şəkildə tutur.",
      "Dump-ları əl ilə deyil, SLO alarmlarından və panic handler-lərindən tetiklə.",
      "Onları erkən yaxalamaq üçün test sərhədlərində sıfır goroutine sızmasını təsdiqlə."
    ],
    "checklist": [
      "FlightRecorder sərhədli buffer ilə davamlı işləyir.",
      "SLO alarmları + panic handler-lər atomik trace dump-larını tetikləyir.",
      "Testlər sərhədlərdə sıfır goroutine sızmasını təsdiqləyir.",
      "Hər context-in deadline-ı və ya açıq cancel yolu var."
    ]
  },
  {
    "id": "m10",
    "title": "CPU Keşləri və Yaddaş İyerarxiyası",
    "short": "Keşlər və Yaddaş",
    "level": "Dərin Arxitektura",
    "summary": "Eyni Go kodu yaddaş düzülüşündən asılı olaraq niyə 10 dəfə daha sürətli və ya daha yavaş işləyə bilər: keş iyerarxiyası, 64-baytlıq cache line, spatial/temporal lokallıq və paralel sayğacları səssizcə öldürən false sharing tələsi.",
    "plain": "CPU-n demək olar ki, heç vaxt hesablama üçün gözləmir - yaddaş üçün gözləyir. Artıq ən sürətli çip-üstü keşdə (L1) oturan bir dəyəri oxumaq təxminən bir nanosaniyə çəkir; eyni dəyəri əsas yaddaşdan (RAM) oxumaq isə təxminən 100 dəfə uzun çəkir. CPU bu boşluğu kiçik, sürətli keşlərdən ibarət bir iyerarxiya ilə gizlədir və heç vaxt tək bir bayt daşımır - hər dəfə bütöv bir 64-baytlıq \"cache line\" daşıyır. Bunu başa düşəndən sonra Go performans məsləhətlərinin çoxu (linked list yox, slice istifadə et, isti sahələri birlikdə saxla, işarəçi qovmaqdan çəkin) folklor olmaqdan çıxıb aydın olur. Bu modul yaddaş sisteminin həqiqətən necə işlədiyinə uyğun kod yazmaqla bağlıdır.",
    "animation": {
      "title": "Yaddaş İyerarxiyası və Bir Cache Line Doldurulması",
      "blurb": "Bir yaddaş oxumasını iyerarxiya boyunca izlə - L1 miss, L2 miss, L3 miss, sonra RAM-dan çəkilən tam 64-baytlıq xətt - və növbəti bir neçə oxumanın niyə birdən pulsuz olduğunu gör."
    },
    "videos": [
      {
        "title": "How CPU Memory & Caches Work",
        "speaker": "Computerphile",
        "url": "https://www.youtube.com/watch?v=SAk-6gVkio0",
        "blurb": "Çox-səviyyəli keş iyerarxiyasının və hər səviyyənin niyə mövcud olduğunun aydın izahı - bu modulun açıldığı gecikmə-pilləsi intuisiyası."
      },
      {
        "title": "dotGo 2016 - Slices: Performance through cache-friendliness",
        "speaker": "Damian Gryski · dotGo 2016",
        "url": "https://www.youtube.com/watch?v=jEG4Qyo_4Bc",
        "blurb": "Spatial lokallıq və cache-line-a-uyğun struct/slice düzülüşünün Go-ya xas müalicəsi - bu modulun Go mühəndisləri üçün hədəflədiyi praktiki \"bəs nə üçün\" cavabı."
      }
    ],
    "concepts": [
      {
        "title": "İyerarxiya: kiçik-və-sürətlidən böyük-və-yavaşa",
        "body": "Yaddaş bir piramida kimi təşkil olunub. Registrlər (bir neçə yüz bayt) ALU-nu sıfır dövrdə qidalandırır. Onların altında L1 (~32-64 KB, ~1 ns), L2 (~256 KB-2 MB, ~4 ns) və paylaşılan L3 (bir neçə MB, ~10-40 ns) yerləşir. Çipin altında RAM (~100 ns), sonra isə saxlama (mikrosaniyələrdən millisaniyələrə) durur. Hər aşağı səviyyə təxminən bir tərtib böyüyür və yavaşıyır. CPU-n bütün işi ehtiyac duyduğu datanı zirvəyə yaxın saxlamaqdır - sənin işin isə ona bunu mümkün edən giriş nümunələri verməkdir."
      },
      {
        "title": "Sən heç vaxt bir bayt yükləmirsən - 64-baytlıq bir xətt yükləyirsən",
        "body": "Keşlər cache line adlanan sabit ölçülü bloklarla işləyir, demək olar ki, həmişə 64 bayt (Apple Silicon-da 128). Tək bir int-ə toxun, CPU onu ehtiva edən bütöv 64-baytlıq xətti L1-ə çəkir. Bu, bu modulun ən vacib faktıdır: yaddaşda bir-birinə yaxın olan oxumalar xətt isindikdən sonra demək olar ki, pulsuzdur, yaddaş boyu səpələnmiş oxumalar isə hər biri yeni bir miss-in dəyərini ödəyir. Bir []int64 xəttə səkkiz dəyər sığdırır; bir []*T isə hər element üçün təsadüfi ünvana işarəçi qovmasına məcbur edir."
      },
      {
        "title": "Lokallıq: iki növ və niyə slice-lar udur",
        "body": "Keşlər iki nümunəyə mərc edir. Temporal lokallıq: bu yaxınlarda istifadə etdiyin data tezliklə yenidən lazım olacaq (buna görə saxlanılır). Spatial lokallıq: indicə istifadə etdiyinin yanındakı data tezliklə lazım olacaq (buna görə hardware prefetcher növbəti xətləri qabaqcadan axıdır). Ardıcıl olaraq bir bitişik []T üzərində gəzmək hər ikisini maksimuma çatdırır - bu da kiçik-orta N üçün massiv/slice-ın niyə tez-tez \"nəzəri baxımdan daha sürətli\" ağac və ya map-i üstələdiyini izah edir. Yaddaş sırasında iterasiya et: sıra-əsaslı 2D slice üçün xarici dövrdə sətirlər, daxili dövrdə sütunlar olsun, heç vaxt əksinə."
      },
      {
        "title": "False sharing: bir cache line-da gizlənən bug",
        "body": "Keşlər nüvələr arasında koherent saxlanılır: bir nüvə bir xətti yazanda, digər hər nüvənin həmin xəttin nüsxəsi etibarsızlaşdırılır. Əgər iki goroutine iki nüvədə eyni 64-baytlıq xəttdə oturan İKİ FƏRQLİ dəyişəni döyəcləyirsə, xətt nüvələrin heç vaxt eyni dataya toxunmamasına baxmayaraq, onların keşləri arasında pinq-ponq oynayır. Bu \"false sharing\" paralel bir sayğacı tək-thread-li versiyasından belə YAVAŞ edə bilər. Həll padding-dir: isti sahələri ayrı xətlərə itələ."
      },
      {
        "title": "Struct düzülüşü: padding, alignment və sahə sırası",
        "body": "Kompilyator sahələri hizalayır və hər sahəni öz təbii sərhədinə oturtmaq üçün görünməz padding əlavə edir. Sahələri pis sıralasan struct deşiklərlə şişər; onları böyükdən-kiçiyə sıralasan isə kiçilər - hər cache line-a və hər allocation-a daha çox obyekt sığar. Ölçmək üçün `unsafe.Sizeof` istifadə et, əl ilə `//go:packed`-tərzi düzülüşə isə yalnız profiler isti bir struct-un ölçüsünün önəmli olduğunu göstərəndə əl at. Kiçik isti struct-lar = xətt başına daha çoxu = daha az miss."
      }
    ],
    "ai": {
      "title": "AI repetitorla daha sürətli öyrən",
      "body": "İsti bir struct-u və ya yavaş bir dövrü yapışdır və benchmark etməzdən əvvəl LLM-ə onun keş davranışı haqqında düşünməyə icazə ver.",
      "prompt": "Bu Go struct-ı və onun bir slice-ını gəzən dövrü budur: <yapışdır>. 64-baytlıq cache line-lar fərz edərək, struct-un padding ilə ölçüsünü, bir xəttə neçəsinin sığdığını və giriş nümunəmin cache-friendly olub-olmadığını qiymətləndir. Sahə sırasını dəyişməyi və ya düzülüş dəyişikliyi təklif et və gözlənilən təsiri cache miss-lərinə izah et."
    },
    "practice": {
      "title": "Özün sına",
      "body": "Keşi iki kiçik benchmark ilə hiss et.",
      "steps": [
        "10M elementli bir []int64-ün cəmini eyni uzunluqda bir []*int64 ilə müqayisə et - işarəçi versiyası saf keş miss-lərindən dolayı çox daha yavaşdır.",
        "2D grid cəmini iki cür yaz (sıra-əsaslı və sütun-əsaslı daxili dövr) və `go test -bench` ilə müqayisə et.",
        "False-sharing sayğacları struct-ını qur, sonra padding-li versiyasını; ikisini paralel goroutine-lərlə benchmark et və padding-in qazandığını gör.",
        "Bir struct üçün unsafe.Sizeof çap et, sahələrini böyükdən-kiçiyə yenidən sırala və kiçildiyini təsdiqlə."
      ]
    },
    "pitfalls": [
      "Kiçik N üçün \"daha sürətli\" data strukturu (ağac, linked list, map) seçmək və hər node bir cache miss olduğu üçün adi bir slice-a uduzmaq.",
      "İsti, tez-tez yazılan bir struct-ı goroutine-lər arasında padding olmadan paylaşmaq - false sharing bütün paralel sürət qazancını silə bilər.",
      "2D struktur üzərində yanlış (sütun-əsaslı) sırada iterasiya etmək və yavaşlığı alqoritmdə günahlandırmaq."
    ],
    "takeaways": [
      "Əksər isti dövrlər yaddaş-bağlıdır: düzülüş və giriş nümunəsi ağıllı arifmetikadan üstündür.",
      "CPU 64-baytlıq cache line-lar daşıyır, heç vaxt tək bayt yox - ardıcıl, bitişik giriş demək olar ki, pulsuzdur.",
      "False sharing paralel sayğacları səssizcə öldürür; isti, ayrı-ayrı yazılan sahələri öz cache line-larına padding et."
    ],
    "checklist": [
      "Gecikmə formasını əzbərdən deyə bilir: L1 ~1 ns qarşı RAM ~100 ns və bunun niyə önəmli olduğu.",
      "Bir cache line-ın ~64 bayt olduğunu və bunun slice-lar qarşı işarəçi qovma üçün nə demək olduğunu bilir.",
      "False sharing-i tapıb padding ilə düzəldə bilir.",
      "İsti struct-ları kompakt saxlamaq üçün unsafe.Sizeof və sahə sırasını istifadə edir."
    ]
  },
  {
    "id": "m11",
    "title": "CPU-nun İçində: Pipeline-lar və Branch Prediction",
    "short": "Pipeline və Budaqlanmalar",
    "level": "Dərin Arxitektura",
    "summary": "Müasir bir nüvə təlimatları pipeline-da necə üst-üstə salır, budaqların hansı tərəfə gedəcəyini necə təxmin edir və işi sırasız necə işlədir - və isti dövrdə tək bir proqnozlaşdırıla bilməyən `if`-in niyə ətrafındakı arifmetikadan daha bahalı ola biləcəyi.",
    "plain": "CPU bir təlimatı bitirmədən növbətini başlatmır. Montaj xətti kimi mərhələləri var - fetch, decode, execute, write-back - və hər biri fərqli mərhələdə olan onlarla təlimatı eyni anda havada saxlayır. Bu, CPU bir branch-ə (bir `if`, bir dövr şərti) rast gələnə və hələ hansı tərəfə gedəcəyini bilməyənə qədər gözəl işləyir. Dayanmaq əvəzinə, CPU TƏXMİN edir, spekulyativ olaraq irəli işləyir və yanlış təxmin etsə işi atır. Yanlış təxmin ~15-20 dövrlük boşaldılmış pipeline-a mal olur. Beləliklə təəccüblü dərs budur: sıx bir dövrdə proqnozlaşdırıla bilən bir branch demək olar ki, pulsuzdur, proqnozlaşdırıla bilməyən isə işləmə vaxtına hakim ola bilər - bəzən eyni dövrü datanı əvvəlcədən sıralamaqla bir neçə dəfə sürətləndirmək olur.",
    "animation": {
      "title": "Pipeline və Bir Branch Misprediction",
      "blurb": "Təlimatların beş üst-üstə düşən mərhələdən necə axdığını izlə, sonra bir branch-ə rast gəl: CPU spekulyasiya edir, yanlış təxmin edir və pipeline-ı boşaldır - itirilmiş dövrlərin görünən bir qabarcığı."
    },
    "videos": [
      {
        "title": "How Branch Prediction Works in CPUs",
        "speaker": "Computerphile (Matt Godbolt)",
        "url": "https://www.youtube.com/watch?v=nczJ58WvtYo",
        "blurb": "Branch prediction-u və misprediction cəzasını əsaslardan izah edir - bu modulun \"sıralanmış data budaqlı bir dövrü sürətləndirir\" nümayişinin arxasındakı dəqiq mexanizm."
      },
      {
        "title": "How CPUs do Out Of Order Operations",
        "speaker": "Computerphile (Matt Godbolt)",
        "url": "https://www.youtube.com/watch?v=jNC9LPc3BI0",
        "blurb": "Out-of-order icranı və təlimat-səviyyəli paralelliyi əhatə edir - bu modulun ILP/müstəqil accumulator müzakirəsinin hardware tərəfindəki qarşılığı."
      },
      {
        "title": "GopherCon 2020: Common Patterns for Bounds Check Elimination",
        "speaker": "Agniva De Sarker · GopherCon 2020",
        "url": "https://www.youtube.com/watch?v=5toTS6kSWHA",
        "blurb": "Kompilyatorun inlining-inin və bounds-check elimination-ının branch-ağır kodla necə qarşılıqlı əlaqədə olduğuna Go-ya xas baxış - CPU nəzəriyyəsini Go mühəndislərinin nəzarət etdiyi şeylərə bağlayır."
      }
    ],
    "concepts": [
      {
        "title": "Pipeline: təlimatlar montaj xətti kimi üst-üstə düşür",
        "body": "Klassik bir pipeline hər təlimatı mərhələlərə bölür - Fetch, Decode, Execute, Memory, Write-back. Təlimat 1 icra olunarkən, təlimat 2 decode olunur və təlimat 3 fetch edilir. İdeal halda nüvə hər biri end-to-end bir neçə dövr çəksə də dövr başına bir təlimat retire edir. Real nüvələr daha dərindir (15-20 mərhələ) və SUPERSKALARDIR (bir neçə pipeline yan-yana), dövr başına bir neçə təlimat retire edir. Tələ budur: sabit axını pozan hər şey - yanlış branch təxmini, cache miss, data asılılığı - boş mərhələ \"qabarcıqları\" buraxır."
      },
      {
        "title": "Branch-lər: CPU heç vaxt dayanmasın deyə təxmin edir",
        "body": "Nüvə şərti bir branch-ə çatanda, şərt tez-tez hələ hesablanmayıb - amma dayanmaq bütün pipeline-ı israf edərdi. Beləliklə bir branch predictor tarixçəyə əsasən (bu dövr branch-i son 1000 dəfə götürüldü → yenə götür) təxmin edir və nüvə proqnozlaşdırılan yol boyu spekulyativ icra edir. Təxmin doğru olsa, sıfır dəyər. Yanlış olsa, spekulyativ icra edilmiş hər təlimat atılmalı və pipeline düzgün hədəfdən yenidən doldurulmalıdır - təxminən 15-20 dövrlük misprediction cəzası. Predictor-lar müntəzəm nümunələrdə çox yaxşıdır (tez-tez >95%) və təsadüfi olanlarda köməksizdir."
      },
      {
        "title": "Klassik nümayiş: sıralama predictor-u açır",
        "body": "Məşhur nəticə: yalnız bir hədddən yuxarı elementləri cəmləmək eyni instruksiya dəsti və element sayı ilə SIRALANMIŞ datada qarışdırılmış eyni datadan dramatik dərəcədə daha sürətli işləyir. Niyə? Sıralanmış datada `if v >= threshold` branch-i əvvəl yalan-yalan-…-yalan sonra doğru-doğru-…-doğru gedir: predictor-un dərhal yaxaladığı uzun proqnozlaşdırıla bilən silsilələr. Qarışdırılmış datada isə təsadüfi çevrilir və daim yanlış təxmin edir. Eyni Big-O, eyni arifmetika, dəfələrlə fərqli divar vaxtı - hamısı branch prediction-dan. Önəmli olduqda düzəliş: işi budaqsız et (hər iki tərəfi hesabla) və ya budaqların proqnozlaşdırıla bilən olması üçün datanı düzənlə."
      },
      {
        "title": "Out-of-order və ILP: boşluqları müstəqil işlə doldurmaq",
        "body": "Müasir nüvələr sırasız icra edir: bir təlimat yaddaşdan yavaş bir yükləməni gözlərkən, nüvə növbəti təlimatlar pəncərəsinə baxır və nəticəyə asılı olmayan hər hansı birini işlədir. Bu, təlimat-səviyyəli paralellikdir (ILP) və uzun asılılıq zəncirlərinin niyə zərərli olduğunu izah edir - hər addım əvvəlkinin nəticəsinə ehtiyac duyursa, nüvə üst-üstə salmaq üçün müstəqil iş tapa bilmir. Bir reduksiyanı bir neçə müstəqil accumulator-a bölmək nüvəyə üst-üstə sala biləcəyi paralel zəncirlər verir, tez-tez təlimat sayında dəyişiklik olmadan bir cəm və ya hash dövrünü sürətləndirir."
      },
      {
        "title": "Bunun Go-ya bağlantısı: inlining, bounds check-lər və yaddaş modeli",
        "body": "Nadir hallarda assembly yazırsan, amma pipeline-ı kompilyator vasitəsilə idarə edirsən. Inlining (`-gcflags=-m`) çağırış overhead-ini aradan qaldırır və nüvəyə üst-üstə sala biləcəyi daha çox təlimat açır. Aradan qaldırılmış bounds check-lər hər indeks üçün gizli bir branch-i silir. Performansı gücləndirən eyni spekulyasiya tam olaraq Go yaddaş modelinin niyə mövcud olduğunun səbəbidir: nüvələr yenidən sıralayır və spekulyasiya etdiyi üçün, iki goroutine yaddaş əməliyyatlarının sırası barədə razılaşmaq üçün açıq sinxronizasiyaya (atomics, mutex-lər, channel-lar - M13 modulu) ehtiyac duyur. Hardware yenidən sıralaması \"mənim maşınımda işlədi\" növü yarışların səbəbidir."
      }
    ],
    "ai": {
      "title": "AI repetitorla daha sürətli öyrən",
      "body": "Bir isti branch-i budaqsız etməyə çalışmazdan əvvəl LLM-in onun proqnozlaşdırıla bilən olub-olmadığı barədə düşünməsinə icazə ver.",
      "prompt": "Bu, data-ya bağlı `if`-i olan isti bir Go dövrüdür: <yapışdır>. Data paylanmama görə bir branch predictor-un bunu yaxşı, yoxsa pis idarə edəcəyini izah et, misprediction dəyərini qiymətləndir və budaqsız bir yenidən yazma göstər. Qazancı benchmark və perf sayğacları ilə necə təsdiqləyəcəyimi de."
    },
    "practice": {
      "title": "Özün sına",
      "body": "Məşhur branch-prediction nəticəsini təkrarla.",
      "steps": [
        "Böyük bir []uint8-i təsadüfi dəyərlərlə doldur; yalnız >= 128 olanları cəmlə və vaxtını ölç.",
        "Eyni datanı sort.Slice et, eyni cəmi çalışdır və müqayisə et - sıralanmış olan dramatik dərəcədə sürətlidir.",
        "Cəmi budaqsız yenidən yaz (məs. 0/1 mask ilə vurma) və sıradan asılı olmadan sürətli olduğunu təsdiqlə.",
        "Böyük bir int64 cəmində dörd müstəqil accumulator sına və ILP sürət qazancını ölç."
      ]
    },
    "pitfalls": [
      "İsti dövrdəki proqnozlaşdırıla bilməyən bir branch-in əsl xərc olduğu halda işləmə vaxtının arifmetikaya hakim olduğunu güman etmək.",
      "\"Sürət üçün\" hər yerdə budaqsız kod yazmaq - bu oxunaqlığa zərər verir və yalnız branch həqiqətən proqnozlaşdırıla bilməyən və isti olduqda kömək edir.",
      "Bir uzun asılılıq zənciri (tək bir accumulator, işarəçi gəzintisi) qurub nüvənin sırasız icra mühərrikini müstəqil işdən məhrum etmək."
    ],
    "takeaways": [
      "Nüvələr pipeline-da bir çox təlimatı üst-üstə salır; onu dayandıran yanlış təxmin edilmiş branch-lər və cache miss-lərdir.",
      "Proqnozlaşdırıla bilən bir branch demək olar ki, pulsuzdur; isti dövrdə proqnozlaşdırıla bilməyən biri hər dəfə ~15-20 dövrə mal ola bilər.",
      "Hardware spekulyasiyası və yenidən sıralaması tam olaraq goroutine-lərin niyə açıq sinxronizasiyaya ehtiyac duyduğunun səbəbidir."
    ],
    "checklist": [
      "Pipeline mərhələlərini və misprediction-un niyə pipeline-ı boşaltdığını izah edə bilir.",
      "Sıralanmış datanın niyə eyni dövrü bir neçə dəfə sürətləndirə biləcəyini başa düşür.",
      "Bir asılılıq zəncirini ILP üçün müstəqil accumulator-lara necə böləcəyini bilir.",
      "Hardware yenidən sıralamasını M13-dəki yaddaş-modeli primitivlərinə olan ehtiyaca bağlayır."
    ]
  },
  {
    "id": "m12",
    "title": "Planlayıcıya Yaxından Baxış: G-M-P, Netpoller və Preemption",
    "short": "Go Planlayıcısı (Scheduler)",
    "level": "Dərin Arxitektura",
    "summary": "Go milyon goroutine-i bir ovuc OS thread-i üzərində necə işlədir: G-M-P modeli, P-başına run queue-lar və work stealing, bloklanan I/O-nu ucuz edən netpoller, syscall handoff-u və asinxron preemption.",
    "plain": "Goroutine-lər OS thread-i deyil - onlar dəfələrlə ucuzdur və Go runtime-ının çoxlu goroutine-i kiçik sayda thread üzərinə xəritələyən öz planlayıcısı (scheduler) var. Bu \"G-M-P\" maşınını başa düşmək başqa cür sehr kimi hiss olunan şeyləri izah edir: niyə 100,000 goroutine başlada bilirsən, niyə bloklanan bir şəbəkə oxuması bir thread-i yandırmır, niyə sıx bir CPU dövrü artıq bütün proqramı dondurmur və niyə GOMAXPROCS həqiqi paralelliyi idarə edən dial-dır. Bu, runtime-ın sənin adından işlədiyi bir şeydir - onun necə işlədiyini bilmək isə gecikmə, throughput və goroutine-lərin heç vaxt yenidən işə düşə bilmədiyi zaman baş verən sızmalar barədə düşünməyə imkan verir.",
    "animation": {
      "title": "G-M-P Planlaşdırma və Work Stealing",
      "blurb": "Loji prosessorlara (P) növbəyə qoyulmuş, OS thread-ləri (M) tərəfindən işlədilən goroutine-lər (G). Bir P-nin quruyub qonşu məşğul P-dən iş OĞURLAMASINI (steal) və bloklanan bir syscall-ın öz P-sini təzə bir thread-ə verməsini izlə."
    },
    "videos": [
      {
        "title": "GopherCon 2018: The Scheduler Saga",
        "speaker": "Kavya Joshi · GopherCon 2018",
        "url": "https://www.youtube.com/watch?v=YHRO5WQGh0k",
        "blurb": "G-M-P modelinin dizaynına və tarixinə, o cümlədən syscall-ların P-ləri necə handoff etdiyinə əsaslı dərinləşmə - bu modulun arxitektura bölməsinin qurulduğu təməl."
      },
      {
        "title": "GopherCon 2021: Queues, Fairness, and The Go Scheduler",
        "speaker": "Madhav Jivrajani · GopherCon 2021",
        "url": "https://www.youtube.com/watch?v=wQpC99Xu1U4",
        "blurb": "Xüsusilə P-başına run queue-lara və work-stealing ədalətliliyinə fokuslanır - bu modulun əsas GMP mənzərəsindən kənarda əhatə etdiyi planlaşdırma-mexanikası detalı."
      },
      {
        "title": "GopherCon 2020: Pardon the Interruption: Loop Preemption in Go 1.14",
        "speaker": "Austin Clements (Go team) · GopherCon 2020",
        "url": "https://www.youtube.com/watch?v=1I1WmeSjRSw",
        "blurb": "Onu quran Go runtime mühəndisindən, Go 1.14-də tətbiq olunan asinxron preemption-un birbaşa izahı - tam olaraq bu modulun preemption mövzusu."
      }
    ],
    "concepts": [
      {
        "title": "G, M və P: üç oyunçu",
        "body": "Üç varlıq əməkdaşlıq edir. G bir goroutine-dir: ~2 KB böyüyə bilən stack-i və proqram sayğacı olan kiçik bir struct - minlərlə yaratmaq ucuzdur. M bir maşındır, yəni kodu həqiqətən icra edən real bir OS thread-i. P bir prosessordur: hazır goroutine-lərin yerli növbəsinə sahib olan planlaşdırma konteksti; P sayı GOMAXPROCS-a bərabərdir. Hər şeyi işlədən qayda: Go kodu işlətmək üçün bir M mütləq bir P tutmalıdır. Beləliklə, nə qədər G və ya M olsa da, ən çoxu GOMAXPROCS sayda goroutine həqiqətən paralel işləyir."
      },
      {
        "title": "Run queue-lar və work stealing: hər P-ni məşğul saxlamaq",
        "body": "Hər P-nin öz yerli run queue-su var (~256 goroutine-lik sürətli, demək olar ki, kilidsiz bir ring), üstəlik overflow üçün bir qlobal növbə var. `go f()` çağıranda, yeni G adətən cari P-nin yerli növbəsinə düşür - qlobal kilid yoxdur, əla cache lokallığı. Bir P yerli növbəsini boşaldanda boşda qalmır: təsadüfi seçilmiş bir qurban P-dən goroutine-lərin yarısını oğurlayır (work stealing) və arabir qlobal növbəni və netpoller-i yoxlayır. Work stealing mərkəzi bir darboğaz olmadan bütün nüvələri qidalandırılmış saxlayan mexanizmdir, hətta iş qeyri-bərabər yaradılanda belə."
      },
      {
        "title": "Netpoller: 100 min bloklanmış bağlantının niyə ucuz olduğu",
        "body": "Go-nun şəbəkələşməsinin arxasındakı hiylə budur. Bir goroutine data olmayan bir socket üzərində bloklanan bir oxuma edəndə, runtime OS thread-i BLOKLAMIR. Goroutine-i park edir və socket-i OS hadisə sistemi ilə (Linux-da epoll, BSD/macOS-da kqueue, Windows-da IOCP) qeydiyyatdan keçirir - netpoller. M başqa goroutine-ləri işlətmək üçün azad olunur. OS sonradan socket-in oxunmağa hazır olduğunu bildirəndə, netpoller park edilmiş goroutine-i oyadır və o yenidən planlaşdırılır. Beləliklə, 100,000 boş bağlantısı olan bir server ~100,000 ucuz goroutine tələb edir, 100,000 thread yox - runtime-ın həll etdiyi C10k problemi."
      },
      {
        "title": "Syscall-lar: digərlərinin işləməyə davam etməsi üçün P-ni handoff etmək",
        "body": "Netpoller-in idarə edə bilmədiyi bloklanan bir syscall - disk oxuması, DNS axtarışı, bir cgo çağırışı - fərqlidir: o həqiqətən öz müddəti boyu OS thread-ini bloklayır. Bunun bütöv bir P-nin goroutine-lərini dayandırmasının qarşısını almaq üçün runtime bloklanmış M-in P-sini ayırır və onu başqa bir M-ə verir (birini spin edərək və ya park edilmiş birini yenidən istifadə edərək) ki, qalan goroutine-lər başqa bir thread-də işləməyə davam etsin. Syscall qayıdanda, orijinal M bir P yenidən əldə etməyə çalışır; heç biri boş deyilsə, onun goroutine-i qlobal növbəyə düşür. Buna görə M sayı GOMAXPROCS-u keçə bilər."
      },
      {
        "title": "Preemption: heç bir goroutine bir nüvəni inhisara ala bilməz",
        "body": "Erkən Go yalnız funksiya çağırışlarında goroutine-lər arasında keçid edə bilirdi (kooperativ preemption), buna görə çağırışı olmayan sıx bir dövr - `for {}` - həmin P-dəki hər digər goroutine-i ac saxlaya, hətta GC-ni belə dayandıra bilirdi. Go 1.14-dən bəri runtime ASİNXRON preemption istifadə edir: fon monitoru (sysmon) ~10 ms-dən çox işləyən bir goroutine-i görüb thread-ə bir siqnal göndərir, bu da onu təhlükəsiz bir preemption nöqtəsində kəsir və planlayıcının başqa bir şey işlətməsinə icazə verir. Buna görə CPU-yönümlü bir goroutine artıq proqramını dondurmur və STW mərhələlərinin həqiqətən sürətlə dünyanı dayandıra bilməsinin səbəbi budur."
      }
    ],
    "ai": {
      "title": "AI repetitorla daha sürətli öyrən",
      "body": "Bir schedtrace dump-ını LLM-ə ver və onun yükün altında planlayıcının nə etdiyini izah etməsinə icazə ver.",
      "prompt": "Bu, servisim yük altındaykən GODEBUG=schedtrace=1000 çıxışıdır: <yapışdır>. Hər sahəni (runqueue, boş P-lər, thread-lər, steal sayları) izah et, CPU-bağlı, syscall-bağlı, yoxsa ac qaldığımı de, hansı GOMAXPROCS və ya kod dəyişikliyinin kömək edəcəyini söylə."
    },
    "practice": {
      "title": "Özün sına",
      "body": "Yerləşdirilmiş tracing ilə planlayıcını izlə.",
      "steps": [
        "İstənilən konkurrent proqramı GODEBUG=schedtrace=1000 ilə çalışdır və saniyəlik Ps/Ms/run-queue rəqəmlərini oxu.",
        "Bir fan-out-dan əvvəl və sonra runtime.NumGoroutine()-i çap et ki, yaradılan və geri qazanılan goroutine-ləri görəsən.",
        "CPU-yönümlü paralel bir işdə runtime.GOMAXPROCS(1) təyin et və throughput-un bir nüvəyə çökdüyünü izlə.",
        "Hər biri bir channel üzərində bloklanan 100,000 goroutine başlat, NumGoroutine-i təsdiqlə, sonra onların çıxması üçün bağla."
      ]
    },
    "pitfalls": [
      "Hər goroutine-in bir OS thread-i olduğunu güman edib pool-ları qorxudan CPU sayına görə ölçmək - goroutine-lər ucuzdur; netpoller bloklanmanı idarə edir.",
      "Goroutine sızdırmaq: netpoller-də və ya bir channel-da əbədi park edilmiş bir G heç vaxt geri qazanılmır və öz stack-ini saxlayır (bax M7).",
      "Bir konteynerdə GOMAXPROCS-u əl ilə təyin etmək, Go 1.25-in cgroup kvotasını oxumasına icazə vermək əvəzinə (bax M9), sonra throttling altında əziyyət çəkmək."
    ],
    "takeaways": [
      "G-M-P çoxlu goroutine-i az sayda thread-ə xəritələyir; paralellik GOMAXPROCS (P sayı) ilə məhdudlaşır.",
      "P-başına run queue-lar üstəgəl work stealing bir qlobal kilid olmadan yükü balanslaşdırır.",
      "Netpoller bloklanan-görünüşlü I/O-nu ucuz edir; syscall handoff və asinxron preemption hər P-ni məhsuldar saxlayır."
    ],
    "checklist": [
      "G, M, P-ni müəyyən edə bilir və \"bir M-in Go kodu işlətmək üçün bir P tutmalı olduğu\" invariantını ifadə edə bilir.",
      "Work stealing-i və yerli run queue-ların niyə sürətli olduğunu izah edir.",
      "Netpoller-in 100k bloklanmış bağlantını necə ucuz goroutine-ə çevirdiyini izah edir.",
      "Asinxron preemption-un niyə mövcud olduğunu və sysmon-un nə etdiyini bilir."
    ]
  },
  {
    "id": "m8",
    "title": "Hardware Sürətləndirmə və Yaddaş Təmizlənməsi",
    "short": "SIMD və Təhlükəsiz Yaddaş",
    "level": "Principal",
    "summary": "simd/archsimd ilə isti riyaziyyatı vektorlaşdır, runtime/secret ilə gizli açarları yaddaşdan təmizlə və Green Tea GC-nin spatial-lokallıq span skan etməsini başa düş.",
    "plain": "Müasir CPU-lar eyni əməliyyatı bir çox rəqəm üzərində eyni anda yerinə yetirə bilər - bu SIMD-dir (Single Instruction, Multiple Data). Bir bloğun hər baytını checksum edən bir dövr üçün, təlimat başına bir bayt əvəzinə 16 bayt emal etmək böyük bir sürət qazancıdır. Ayrıca, yaddaşda qalan gizli açarlar crash dump-lara sıza bilər; runtime/secret onları təmizləyir. \"Green Tea\" isə daha yaxşı cache lokallığı üçün zibil yığanın (garbage collector) eksperimental yenidən dizaynıdır.",
    "animation": {
      "title": "SIMD Emalı və Green Tea GC",
      "blurb": "Skalyar bir dövr dövr başına bir element çeynəyir, SIMD zolağı isə eyni anda 8-16-nı emal edir; yanında, Green Tea GC bitişik 8 KiB span-ları paralel olaraq süpürür."
    },
    "videos": [
      {
        "title": "GopherCon 2024: Parquet, Go, and Unreasonable Amounts of SIMD",
        "speaker": "Achille Roussel · GopherCon 2024",
        "url": "https://www.youtube.com/watch?v=nY6D_zEiHnU",
        "blurb": "Bir istehsalat Go kitabxanasının böyük qazanclar üçün vektorlaşdırılmış, SIMD-sürətləndirilmiş kodlaşdırmaya necə əsaslandığını göstərir - archsimd-in vektor tiplərinin real iş yüklərində niyə önəmli olduğunu birbaşa motivasiya edir."
      },
      {
        "title": "GopherCon 2025: Advancing Go Garbage Collection with Green Tea",
        "speaker": "Michael Knyszek (Go team) · GopherCon 2025",
        "url": "https://www.youtube.com/watch?v=gPJkM95KpKo",
        "blurb": "Eksperimental Green Tea GC-nin arxasındakı Go komanda mühəndisi onun səhifə-səviyyəli, cache-friendly işarələmə alqoritmini izah edir - bu modulun əhatə etdiyi tam olaraq bu collector-dur."
      }
    ],
    "concepts": [
      {
        "title": "simd/archsimd ilə vektor zolaqları",
        "body": "Eksperimental simd/archsimd paketi CPU vektor tiplərini (Int8x16, Float64x8) təqdim edir. Hər baytı toxunan bir checksum və ya validasiya dövrü təlimat başına bütöv bir zolaq emal edə bilər - tez-tez skalyar Go-dan bir tərtib daha sürətli."
      },
      {
        "title": "runtime/secret ilə yaddaş təmizlənməsi",
        "body": "Deşifrə edilmiş açarlar RAM-da qalır və core dump-lara və swap-a sızır. runtime/secret gizli baytları köçürülə bilməyən heap-dən kənarda saxlanılan bir buffer-də tutur və istifadədən sonra sıfırlanmasına zəmanət verir, bir açarın bərpa edilə bilən qalması pəncərəsini minimuma endirir."
      },
      {
        "title": "Green Tea zibil yığan (garbage collector)",
        "body": "Green Tea (GOEXPERIMENT=greenteagc) GC-ni spatial lokallıq ətrafında yenidən qurur: obyektlərə tək-tək baxıb heapı gəzmək əvəzinə, yaddaşı bitişik 8 KiB span-larla skan edir, bu da böyük heap-lərdə cache davranışını və paralel skan throughput-unu dramatik dərəcədə yaxşılaşdırır."
      }
    ],
    "ai": {
      "title": "AI İş Axını İnteqrasiyası",
      "body": "Skalyar array alqoritmlərini skalyar fallback-lı vektorlaşdırılmış simd/archsimd bloklarına refaktor etmək üçün ixtisaslaşmış agentlərdən istifadə et.",
      "prompt": "Bu skalyar checksum dövrünü simd/archsimd istifadə edərək vektorlaşdır. İterasiya başına 16 bayt emal et, 16-nın qatı olmayan quyruğu skalyar qalıq dövrü ilə idarə et və intrinsic-ləri olmayan arxitekturalar üçün bir build-tag fallback saxla. Hər ikisini müqayisə edən bir benchmark əlavə et."
    },
    "practice": {
      "title": "Özün sına",
      "body": "İsti bir dövrü vektorlaşdır, sonra gizli bir açarın istifadəsindən uzun ömürlü olmadığından əmin ol.",
      "steps": [
        "Skalyar bir bayt-checksum dövrünü bir dəfəyə 16 bayt emal edən simd/archsimd versiyası ilə benchmark et.",
        "Quyruq üçün (uzunluq 16-nın qatı olmayan) skalyar qalıq dövrü əlavə et və vektorlaşdırılmış versiyanın tək ədədli girişdə hələ də düzgün checksum verdiyini təsdiqlə.",
        "Saxta bir açarı adi bir []byte-da saxla, prosesin yaddaşını dump et və açar baytlarının hələ də orada durduğunu tap - sonra bunu runtime/secret ilə təkrarla və Destroy-un onları həqiqətən sıfırladığını təsdiqlə.",
        "GOEXPERIMENT=greenteagc ilə qur və GC pause/throughput-u böyük-heap-li bir iş yükündə default collector-la benchmark et."
      ]
    },
    "pitfalls": [
      "Skalyar fallback olmadan vektorlaşdırmaq - binarın həmin təlimatları olmayan CPU-larda/arxitekturalarda işləməməsinə səbəb olur. Həmişə bir quyruq/qalıq yol saxla.",
      "Profilləşdirmədən əvvəl əl ilə SIMD yazmaq - yalnız profiler-in isti olduğunu sübut etdiyi bir dövrü vektorlaşdır.",
      "Deşifrə edilmiş açarları adi []byte-da saxlamaq - onlar core dump-larda və swap-da sağ qalır. runtime/secret və Destroy istifadə et."
    ],
    "takeaways": [
      "SIMD element-başına dövrləri zolaq-başına dövrlərə çevirir - isti riyaziyyatda böyük qazanclar.",
      "runtime/secret bir açarın yaddaşda bərpa edilə bilən qalma pəncərəsini minimuma endirir.",
      "Green Tea obyekt-qrafı gəzintisini cache-friendly span süpürmələri ilə əvəz edir."
    ],
    "checklist": [
      "İsti validasiya dövrü simd/archsimd + skalyar fallback ilə vektorlaşdırılıb.",
      "Bütün açar materialı runtime/secret buffer-lərində saxlanılır və məhv edilir.",
      "Green Tea GC qiymətləndirilib və default-a qarşı benchmark edilib.",
      "İstifadədən sonra heç bir gizli bayt əlçatan deyil (core dump-larda təsdiqlənib)."
    ]
  },
  {
    "id": "m6",
    "title": "Postkvant Mikroservis Müdafiələri və Protokolları",
    "short": "Postkvant Müdafiə",
    "level": "Staff",
    "summary": "gRPC + Protobuf-u sərt geriyə uyğunluqla qurun, nəql qatını hibrid ML-KEM / HPKE ilə 'indi topla, sonra deşifrə et' hücumlarına qarşı möhkəmləndirin və dəyişməzlikləri özünə istinad edən generiklərlə kodlaşdırın.",
    "plain": "Servislər bir-biri ilə şəbəkə üzərindən danışır və bu trafik məxfi qalmalıdır - hətta gələcəkdə peyda olacaq kvant kompüterlərinə qarşı da. Təhdid 'indi topla, sonra deşifrə et' adlanır: hücumçu bu gün şifrələnmiş trafiki yazıb saxlayır və kvant kompüterləri klassik kriptoqrafiyanı sındıra bildiyi gün onu deşifrə edir. Hibrid postkvant açar mübadiləsi (bugünkü X25519-u kvanta davamlı ML-KEM ilə birləşdirərək) buna qarşı indidən müdafiə yaradır.",
    "animation": {
      "title": "Kriptoqrafik Qəfəs (Lattice)",
      "blurb": "Klassik TLS əl sıxma prosesini hibrid ML-KEM mübadiləsi ilə yan-yana qoyun - gələcəkdəki kvant hücumçunun niyə tutduğu bir açarı sındıra bildiyini, amma qəfəslə qorunan digərini sındıra bilmədiyini görün."
    },
    "videos": [
      {
        "title": "GopherCon 2025: The Go Cryptography State of the Union",
        "speaker": "Filippo Valsorda (Go crypto maintainer) · GopherCon 2025",
        "url": "https://www.youtube.com/watch?v=YnyeAQblUyA",
        "blurb": "Standart kitabxana üçün crypto/mlkem-i implementasiya edən mühəndis tərəfindən təqdim olunur və bu modulun ML-KEM/HPKE məzmununun əsasında duran postkvant işi əhatə edir."
      },
      {
        "title": "Post Quantum Cryptography",
        "speaker": "Computerphile (Mike Pound)",
        "url": "https://www.youtube.com/watch?v=_MoRcYLN-7U",
        "blurb": "Kvant kompüterlərinin indiki açıq açar kriptoqrafiyasını niyə sındırdığını yaxşı izah edən video - bu modulun başladığı 'indi topla, sonra deşifrə et' təhdid modeli."
      }
    ],
    "concepts": [
      {
        "title": "Sərt geriyə uyğunluqla gRPC + Protobuf",
        "body": "Node-lararası ledger trafiki gRPC üzərində işləyir. Burada intizam sxem təkamülüdür: sahə nömrələrini heç vaxt yenidən istifadə etməyin, yalnız opsional sahələr əlavə edin və wire uyğunluğunu CI-də yoxlayın ki, v2 node klasterin ortasında heç vaxt v1 həmyoldaşını sındırmasın."
      },
      {
        "title": "crypto/mlkem + crypto/hpke ilə hibrid PQC",
        "body": "'İndi topla, sonra deşifrə et' hücumçusu bugünkü trafiki gələcəkdəki kvant kompüteri ilə sındırmaq üçün yazır. Hibrid açar mübadiləsi klassik X25519-u ML-KEM-768 ilə birləşdirir, ona görə sessiya yalnız HƏR İKİSİ sındırılarsa təhlükəyə düşür. crypto/mlkem sizə xam ortaq sirri verir; crypto/hpke (RFC 9180) isə KEM-i hazır, autentifikasiya olunmuş şifrələməyə çevirən üst qatdır - açar mübadiləsini açar-törətmə funksiyası və AEAD şifri ilə tək bir Seal/Open API-nin arxasında birləşdirir, ona görə KDF-i və şifri özünüz əl ilə birləşdirmək lazım gəlmir."
      },
      {
        "title": "Özünə istinad edən generic məhdudiyyətlər",
        "body": "Bu naxış olmadan, Peers() []Node metodu müxtəlif node implementasiyalarının qarışığını qaytara bilər və hər dəfə üzərində metod çağırdığınızda runtime tip assersiyası tələb edər. type Node[T Node[T]] yazmaq - 'maraqla təkrarlanan' adlanır, çünki tip öz məhdudiyyəti daxilində özünə istinad edir - kompilyatora deyir ki, 'T özü Node[T]-i ödəməlidir', bu da T qaytaran hər metodu hər yerdə EYNİ konkret tipi qaytarmağa məcbur edir. Beləliklə LedgerNode.Peers() sübut olunmuş şəkildə []*LedgerNode-dur, heç vaxt qarışıq yığın deyil, sıfır runtime yoxlaması ilə."
      }
    ],
    "ai": {
      "title": "AI-İş Axını İnteqrasiyası",
      "body": "Protobuf sxemlərini təkmilləşdirmək və birləşmədən əvvəl ayrı repozitoriyalar arasında geriyə uyğunluğu yoxlamaq üçün kod-generasiya agentlərindən istifadə edin.",
      "prompt": "Proto sxem v1-i (repo A) və təklif olunan v2-ni nəzərə alaraq, wire-uyğunluğunu yoxlayın: yenidən istifadə edilmiş/dəyişdirilmiş sahə nömrələrini və ya tip dəyişikliklərini qeyd edin, yeni sahələrin opsional olduğunu təsdiqləyin və buf breaking-change hesabatı ilə təhlükəsiz miqrasiya diff-i yaradın."
    },
    "practice": {
      "title": "Özünüz sınayın",
      "body": "Real hibrid açar mübadiləsi işə salın və qəsdən Protobuf uyğunluğunu pozun.",
      "steps": [
        "ML-KEM-768 açar cütü yaradın, encapsulate/decapsulate edin və hər iki tərəfin eyni ortaq sirrə çatdığını təsdiqləyin.",
        ".proto mesajına yeni opsional sahə əlavə edin, yenidən generasiya edin və köhnə generasiya olunmuş müştərinin yeni serverdən gələn mesajları hələ də deşifrə edə bildiyini təsdiqləyin.",
        "Qəsdən ləğv edilmiş sahə nömrəsini yenidən istifadə edin və müştərinin səhv sahəni səssizcə necə yanlış oxuduğunu müşahidə edin - məhz 'reserved'-in qarşısını almaq üçün mövcud olduğu bug.",
        "İki fərqli konkret node tipi üçün type Node[T Node[T]]-i implementasiya edin və kompilyatorun onları tək konkret T tələb olunan yerdə qarışdırmağı rədd etdiyini təsdiqləyin."
      ]
    },
    "pitfalls": [
      "Ləğv edilmiş Protobuf sahə nömrəsini yenidən istifadə etmək - köhnə və yeni node-lar baytları səssizcə yanlış şərh edəcək. Onu həmişə 'reserved' edin.",
      "Hibrid əvəzinə tam postkvanta keçmək - PQC alqoritmləri daha yenidir; hibrid klassik təhlükəsizliyi ehtiyat kimi saxlayır.",
      "TLS-in 'bunu özü həll edəcəyini' güman etmək - hibrid açar-mübadilə qrupunu açıq şəkildə seçməlisiniz; standart parametrlər hələ də yalnız klassik ola bilər."
    ],
    "takeaways": [
      "Protobuf uyğunluğu intizamdır: opsional sahələr əlavə edin, nömrələri heç vaxt yenidən istifadə etməyin.",
      "Hibrid X25519 + ML-KEM bu gün 'indi topla, sonra deşifrə et' hücumlarına qarşı müdafiə edir.",
      "Özünə istinad edən generiklər topologiya dəyişməzliklərini tip yoxlayıcısına ötürür."
    ],
    "checklist": [
      "Node-lararası çağırışlar rezerv edilmiş/heç vaxt yenidən istifadə olunmayan sahə nömrələri ilə gRPC üzərində işləyir.",
      "Nəql qatı hibrid X25519 + ML-KEM açar mübadiləsindən istifadə edir.",
      "Topologiya dəyişməzlikləri özünə istinad edən generiklərlə kodlaşdırılıb.",
      "buf breaking yoxlamaları hər sxem dəyişikliyini CI-də bloklayır."
    ]
  },
  {
    "id": "m9",
    "title": "İstehsalat İdarəçiliyi və Avtomatlaşdırılmış Refaktorinq",
    "short": "İdarəçilik və Rollout",
    "level": "Principal",
    "summary": "GOMAXPROCS-u cgroup-a həssas edin, möhkəmləndirilmiş scratch/distroless image-lar göndərin, go fix + //go:fix ilə flot miqyaslı refaktorinqləri avtomatlaşdırın və qərarları ADR-lərdə qeyd edin.",
    "plain": "Go-nu konteynerlərdə işlətmək və onu təhlükəsiz şəkildə rollout etmək ayrıca bacarıqdır. Go 1.25 artıq konteynerin CPU limitini oxuyur ki, 4 nüvəli pod-da 128 thread yaratmasın. 'Distroless' image sadəcə sizin binary-ni göndərir - kiçik və hücuma qarşı çətindir. go fix köhnəlmiş API-ləri bütün kod bazası boyu avtomatik yenidən yaza bilər. Və ADR-lər böyük qərarı niyə verdiyinizi qeyd edən qısa qeydlərdir ki, növbəti mühəndis təxmin etmək məcburiyyətində qalmasın.",
    "animation": {
      "title": "Konteyner Rollout",
      "blurb": "Rolling update zamanı runtime readiness probe-larını izləyir, yeni instansiyalar sağlam olduqca trafiki onlara yumşaq şəkildə keçirir və köhnələri boşaldır."
    },
    "videos": [
      {
        "title": "GopherCon 2025: Analysis and Transformation Tools for Go Codebase Modernization",
        "speaker": "Alan Donovan (Go team) · GopherCon 2025",
        "url": "https://www.youtube.com/watch?v=_VePjjjV9JU",
        "blurb": "Go alətlər komandasının rəhbəri tərəfindən təqdim olunur - bu modulun öyrətdiyi go fix və //go:fix əsaslı flot miqyaslı refaktorinqlərin birbaşa mənbəyi."
      },
      {
        "title": "Containers From Scratch",
        "speaker": "Liz Rice · GOTO 2018",
        "url": "https://www.youtube.com/watch?v=8fi7uSYlOdc",
        "blurb": "Namespace-lər və cgroup-lardan başlayaraq canlı şəkildə konteyner qurur - bu modulun möhkəmləndirilmiş distroless/scratch image-larının işləməsini təmin edən əsas mexanikanı verir."
      },
      {
        "title": "Facilitating Software Architecture",
        "speaker": "Andrew Harmel-Law & Sonya Natanzon · GOTO 2024",
        "url": "https://www.youtube.com/watch?v=YpFR8qzwYSA",
        "blurb": "Komandaların arxitektura qərarlarını necə sənədləşdirdiyini və miqyaslandırdığını əhatə edir - bu modulun Architecture Decision Records mövzusu."
      }
    ],
    "concepts": [
      {
        "title": "cgroup-a həssas GOMAXPROCS",
        "body": "Go 1.25 cgroup CPU bant genişliyi limitini oxuyur və GOMAXPROCS-u host-un nüvə sayı əvəzinə konteynerin real kvotasına uyğunlaşdırır. Artıq 4 nüvə ilə məhdudlaşdırılmış pod 128 P yaradıb CFS throttling altında əzilmir."
      },
      {
        "title": "Möhkəmləndirilmiş scratch / distroless image-lar",
        "body": "Statik, CGO-suz Go binary-si heç bir ƏS-ə ehtiyac duymur. Multi-stage build-lər tam alət dəstinə malik image-də kompilyasiya edir, sonra tək binary-ni scratch və ya distroless-ə köçürür - bir neçə MB, shell yoxdur, paket meneceri yoxdur, minimal CVE səthi."
      },
      {
        "title": "go fix + //go:fix ilə flot miqyaslı refaktorinqlər",
        "body": "Yenilənmiş go fix mühərriki və //go:fix inline direktivləri kitabxana müəlliflərinə maşınla tətbiq edilə bilən miqrasiyalar göndərməyə imkan verir. Köhnəlmiş API-ni işarələyin və hər istehlakçı bir əmrlə repozitoriyalar boyu avtomatik yenidən yazıla bilər."
      },
      {
        "title": "Architecture Decision Records",
        "body": "ADR-lər qərarın NİYƏ verildiyini qeyd edən qısa, yalnız-əlavə edilə bilən qeydlərdir: kontekst, seçimlər, qərar, nəticələr. Onlar tayfa biliyini (və Slack yazışmalarını) növbəti mühəndis üçün davamlı, nəzərdən keçirilə bilən tarixə çevirir."
      }
    ],
    "ai": {
      "title": "AI-İş Axını İnteqrasiyası",
      "body": "Tarixi Slack yazışmalarından və daxili mühəndislik sənədlərindən dəqiq ADR eskizlərini avtomatik tərtib etmək üçün istifadə edin.",
      "prompt": "Bu Slack yazışmaları və dizayn sənədi çıxarışlarından Context / Decision / Consequences formatında ADR tərtib edin. Müzakirə olunmuş real seçimləri, seçilmiş variantı, qaldırılmış kompromisləri çıxarın və hələ həll olunmamış hər şeyi açıq sual kimi qeyd edin."
    },
    "practice": {
      "title": "Özünüz sınayın",
      "body": "GOMAXPROCS-un konteynerin real CPU kvotasını necə izlədiyini izləyin, sonra möhkəmləndirilmiş image göndərin.",
      "steps": [
        "--cpus=2 konteynerində Go proqramı işlədin və runtime.GOMAXPROCS(0)-ın host-un nüvə sayı deyil, 2 qaytardığını təsdiqləyin.",
        "distroless/static ilə bitən multi-stage Dockerfile qurun və son image-də shell olmadığını təsdiqləyin (docker run ... sh uğursuz olur).",
        "Kiçik kitabxanada bir funksiyanı //go:fix inline işarələyin, sonra çağıranda go fix ./... işlədin və çağırış yerinin avtomatik yenidən yazıldığını təsdiqləyin.",
        "Bu kursda əvvəllər verdiyiniz bir qərar üçün real ADR (Context/Decision/Consequences) yazın."
      ]
    },
    "pitfalls": [
      "Konteynerdə GOMAXPROCS-u hardkod etmək - cgroup-a həssas standartın real CPU kvotasına uyğunlaşmasına icazə verin, əks halda throttling altında əzilərsiniz.",
      "Distroless/scratch image kifayət edəndə tam Linux baza image-i göndərmək - bu lazımsız CVE və ölçü yüküdür.",
      "Readiness probe-lar olmadan update rollout etmək - trafik hazır olmayan pod-lara dəyir və sorğular itir."
    ],
    "takeaways": [
      "GOMAXPROCS-u (və GOMEMLIMIT-i) host-a deyil, konteynerə uyğun ölçüləndirməyə Go-ya icazə verin.",
      "Distroless/scratch image-lar həm ölçünü, həm də hücum səthini kiçildir.",
      "//go:fix köhnəlmələri bir-əmrlik, flot miqyaslı miqrasiyalara çevirir."
    ],
    "checklist": [
      "GOMAXPROCS + GOMEMLIMIT konteynerin cgroup limitlərinə hörmət edir.",
      "İstehsalat image-i scratch/distroless, qeyri-root, CGO-suzdur.",
      "Köhnəlmələr avtomiqrasiya üçün //go:fix direktivləri ilə göndərilir.",
      "Böyük infrastruktur qərarları ADR kimi qeydə alınır."
    ]
  },
  {
    "id": "m14",
    "title": "Observability: Loglar, Metrikalar və Trace-lər",
    "short": "Observability",
    "level": "İstehsalat",
    "summary": "İşləyən sistemin özünü izah etməsini təmin etmək: slog ilə strukturlaşdırılmış loglama, sizi çağıran RED/USE metrikaları və bir sorğunu servislər arasında izləyən paylanmış trace-lər - üç sütun və onların necə birləşdiyi.",
    "plain": "İstehsalatda saniyədə minlərlə sorğunu emal edən servisə debugger qoşa bilməzsiniz. Bunun əvəzinə sistem nə etdiyini davamlı və ucuz şəkildə sizə deməlidir. Bu observability-dir və üç tamamlayıcı siqnala əsaslanır. Loglar diskret hadisələrin zaman möhürlü qeydləridir. Metrikalar zaman üzrə ucuz rəqəmsal aqreqatlardır (sorğu tezliyi, xəta tezliyi, gecikmə) - dashboard-larınızın və alertlərinizin izlədiyi şeydir. Trace-lər bir sorğunu servislər arasında hoppanarkən izləyir və vaxtın əslində hara getdiyini göstərir. Heç biri tək başına kifayət etmir: metrikalar NƏYİNSƏ səhv olduğunu deyir, trace-lər HARADA olduğunu deyir, loglar isə NİYƏ olduğunu deyir. Bu modul üçünü də Go servisinə idiomatik yolla qoşur.",
    "animation": {
      "title": "Üç Sütun Boyu Bir Sorğu",
      "blurb": "Bir sorğu üç servisdən keçir. Onun iç-içə span-lardan ibarət trace yaratdığını, gecikmə/xəta metrikalarını artırdığını və strukturlaşdırılmış log sətirləri buraxdığını izləyin - və trace ID-nin bunları necə bir-birinə bağladığını görün."
    },
    "videos": [
      {
        "title": "GopherCon 2023: Structured Logging for the Standard Library",
        "speaker": "Jonathan Amsterdam (Go team) · GopherCon 2023",
        "url": "https://www.youtube.com/watch?v=rJfvv_c9mYU",
        "blurb": "log/slog-un dizayneri onun API-sini və performans dizaynını izah edir - bu modulun strukturlaşdırılmış loglama sütunu ilə birbaşa uyğun gəlir."
      },
      {
        "title": "OpenTelemetry for Dummies: Instrumenting Go Apps",
        "speaker": "Ricardo Ferreira · GopherCon Europe 2021",
        "url": "https://www.youtube.com/watch?v=NLXABIZ1gUQ",
        "blurb": "Go servislərinin OpenTelemetry span-ları və context ötürülməsi ilə necə instrumentasiya olunduğunu praktiki şəkildə göstərir - bu modulun paylanmış trace sütununu əhatə edir."
      },
      {
        "title": "The RED Method: How To Instrument Your Services",
        "speaker": "Tom Wilkie (Kausal) · CNCF",
        "url": "https://www.youtube.com/watch?v=TJLpYXbnfQ4",
        "blurb": "RED metodunu ortaya qoyan mühəndisdən bu modulun metrikalar sütunu üçün istifadə etdiyi Rate/Errors/Duration çərçivəsini əhatə edən mövzu."
      }
    ],
    "concepts": [
      {
        "title": "Üç sütun və hər birinin cavablandırdığı sual",
        "body": "Loglar, metrikalar və trace-lər rəqib deyil - fərqli suallara cavab verirlər və üçünü də istəyirsiniz. Metrikalar ucuz və davamlı şəkildə 'nəsə səhvdirmi, nə qədər pisdir?' sualına cavab verir (onlar aqreqatdır, ona görə xərc trafiklə böyümür). Trace-lər servis sərhədləri arasında 'sorğu yolunun harasında vaxt/xəta baş verdi?' sualına cavab verir. Loglar 'bu bir hadisədə tam olaraq nə baş verdi?' sualına tam təfərrüatla cavab verir. Yetkin iş axını: alert bir METRİKADA işə düşür, yavaş sorğunun TRACE-ini açıb günahkar servisi tapırsınız, sonra dəqiq səbəb üçün onun LOGLARINI oxuyursunuz. Trace ID-ni hər log sətrinə və metrika etiketinə həkk edərək onları korrelyasiya edin."
      },
      {
        "title": "log/slog ilə strukturlaşdırılmış loglama",
        "body": "Sadə mətn logları (log.Printf(\"user %s failed: %v\", id, err)) miqyasda axtarıla bilməzdir. log/slog (Go 1.21-dən standart) strukturlaşdırılmış açar/dəyər qeydləri yayımlayır - istehsalatda JSON - ki, log sistemi indeksləyib süzgəcdən keçirə bilsin. İnterpolyasiya edilmiş sətirlər əvəzinə açar/dəyər atributlarını loqlayın; səviyyələr təyin edin (Debug/Info/Warn/Error); və sorğu-əhatəli sahələri logger.With(...) ilə bir dəfə əlavə edin ki, həmin sorğudakı hər sətir onları daşısın. İstehsalatda JSON handler, development-də insan-oxuya bilən handler istifadə edin. Qlobal əvəzinə logger-i ötürün (və ya context-dən sorğu-əhatəli olanı çıxarın)."
      },
      {
        "title": "Metrikalar: sayğaclar, göstəricilər, histogramlar & RED/USE",
        "body": "Metrikalar ucuzdur çünki aqreqasiya edir: yalnız artan sayğac (sorğular, xətalar), həm artan həm azalan göstərici (aktiv sorğular, növbə dərinliyi) və paylanmanı vedrələyən histogram (gecikmə) ki, p50/p95/p99 hesablaya biləsiniz. İki çərçivə NƏYİ ölçmək lazım olduğunu deyir: sorğu-əsaslı servislər üçün RED - Rate, Errors, Duration; resurslar üçün USE - Utilization, Saturation, Errors. Onları Prometheus-un scrape etməsi üçün /metrics endpoint-ində göstərin. Aşağıdakı əsas qayda: metrikanı heç vaxt hüdudsuz dəyərlə etiketləməyin."
      },
      {
        "title": "Paylanmış trace: span-lar və context ötürülməsi",
        "body": "Trace span-lardan ibarət ağacdır - hər span başlanğıcı, müddəti və atributları olan bir vaxtlı əməliyyatdır (HTTP handler, DB sorğusu, RPC). Kök span bütün sorğunu əhatə edir; uşaq span-lar onun altında yuvalanır, ona görə trace milisaniyələrin servislər arasında əslən hara getdiyini hərfi mənada göstərir. Sehr CONTEXT ÖTÜRÜLMƏSİNDƏdir: trace ID və cari span ID context.Context içində gəzir və gedən sorğu başlıqlarına (W3C traceparent) yeridilir, ona görə növbəti servis EYNİ trace-i davam etdirir. Bu, F5 modulunun context-i hər şeyin ilk arqumenti olmasında israrının məhz səbəbidir - trace-i o daşıyır."
      },
      {
        "title": "Kardinallıq, seçmə (sampling) və xərc: istehsalat reallıqları",
        "body": "Observability-nin nəzarət etməli olduğunuz xərci var. KARDİNALLIQ öldürücüdür: hüdudsuz dəyərlərə malik metrika etiketi (istifadəçi ID-si, sorğu ID-si, ID-lərlə xam URL) milyonlarla zaman seriyasına partlayır və metrika backend-inizi çökdürə bilər - etiketləri kiçik, hüdudlu dəstlərlə saxlayın (route şablonu, status kodu, metod). Trace-lər seçilir (miqyasda hər span-ı saxlaya bilməzsiniz) - kök-əsaslı (kökdə qərar) və ya quyruq-əsaslı (yavaş/xətalıları saxla); həmişə seçin, amma maraqlı trace-ləri saxlayın. Loglar həcmdə ən bahalısıdır - düzgün səviyyədə loqlayın, sıx dövrlərdə loqlamaqdan çəkinin və sorğu başına log sətrindən çox seçilmiş-trace + metrikaya üstünlük verin."
      }
    ],
    "ai": {
      "title": "AI müəllimi ilə daha sürətli öyrənin",
      "body": "LLM-ə konkret endpoint üçün siqnalları dizayn etdirin, sonra kardinallıq üçün stress-test edin.",
      "prompt": "Bu Go HTTP handler-i üçün: <yapışdırın>, hüdudlu etiket dəstləri ilə RED metrikalarını, loqlanacaq slog sahələrini və yaradılacaq trace span-larını təklif edin. Sonra öz metrika etiketlərinizi kardinallıq riski üçün nəzərdən keçirin və hüdudsuz olanı işarələyin. slog və OpenTelemetry quraşdırma kodunu göstərin."
    },
    "practice": {
      "title": "Özünüz sınayın",
      "body": "Kiçik HTTP servisini başdan sona instrumentasiya edin.",
      "steps": [
        "log.Printf-i slog JSON handler ilə əvəz edin və açar/dəyər atributlarını, o cümlədən logger.With ilə trace_id-ni loqlayın.",
        "requests_total sayğacı və request_duration histogramı əlavə edin; /metrics göstərin və onu lokal Prometheus ilə scrape edin.",
        "Handler-i OpenTelemetry span-ına bükün, saxta DB çağırışı ətrafında uşaq span əlavə edin və trace-ə baxın.",
        "Qəsdən yüksək kardinallıqlı etiket əlavə edin, seriya sayının partladığını izləyin, sonra onu hüdudlu etiketə düzəldin."
      ]
    },
    "pitfalls": [
      "Metrikaları hüdudsuz dəyərlərlə (istifadəçi/sorğu ID-ləri, xam yollar) etiketləmək - metrika backend-ini çökdürə biləcək kardinallıq partlayışı.",
      "Strukturlaşdırılmamış sətirləri loqlamaq və ya sıx dövrlər daxilində loqlamaq - istehsalat həcmində axtarılmaz və dağıdıcı dərəcədə bahalı.",
      "Span-ları başlatmaq, amma context-i atmaq (ctx-i aşağı ötürməmək), ona görə uşaq əməliyyatlar fərqli trace-də və ya heç birində bitir."
    ],
    "takeaways": [
      "Üç sütunun hamısını istifadə edin: metrikalar sınıb-sınmadığını, trace-lər harada olduğunu, loglar niyə olduğunu deyir - onları trace ID ilə korrelyasiya edin.",
      "Strukturlaşdırılmış slog + RED/USE metrikaları + context ilə ötürülən span-lar idiomatik Go yığınıdır.",
      "Xərci qəsdən idarə edin: hüdudlu metrika etiketləri, seçilmiş trace-lər, səviyyə intizamlı loglar."
    ],
    "checklist": [
      "Üç sütunun hər birinin hansı sualı cavabladığını və onları necə korrelyasiya etməyi bilirəm.",
      "Sorğu-əhatəli atributlarla strukturlaşdırılmış slog qeydləri yayımlayıram, istehsalatda JSON.",
      "Hüdudlu etiketlərlə RED metrikaları təyin edir və histogramdan p99 oxuyuram.",
      "Span-ların bir sorğular-arası trace-də yuvalanması üçün context-i ötürürəm və kardinallığı/seçməni idarə edirəm."
    ]
  },
  {
    "id": "m15",
    "title": "Dayanıqlılıq: Timeout-lar, Retry-lər, Circuit Breaker-lər və Load Shedding",
    "short": "Dayanıqlılıq",
    "level": "İstehsalat",
    "summary": "Paylanmış sistemin qismən uğursuzluğu gücləndirmək əvəzinə necə sağ qaldığı: hər çağırışda deadline, backoff və jitter ilə retry-lər, circuit breaker-lər, rate limiting, load shedding və hüdudlu-növbə backpressure-u.",
    "plain": "Tək proqramda uğursuzluq adətən stack trace-də oxuya biləcəyiniz bir çökmədir. Paylanmış sistemdə uğursuzluqlar QİSMƏNDİR və yoluxucudur: bir yavaş asılılıq onu çağıranları yavaşladır, bu da onların bağlantılarını və goroutine-lərini tükəndirir, bu da ONLARIN çağıranlarını yavaşladır - bir zəifləyən node-dan bütün sistemi endirən kaskad. Dayanıqlılıq mühəndisliyi qismən uğursuzluğun tama çevrilməsinin qarşısını alan naxışlar toplusudur: hər şeyə deadline qoyun, keçici xətaları diqqətlə retry edin (özünüzə DDoS etmədən), açıq-aydın işləməyən servisi çağırmağı dayandırın və xidmət edə bilmədiyiniz yükü yıxılmaq əvəzinə atın. Bu naxışlar bir titrəyiş ilə kəsinti arasındakı fərqdir.",
    "animation": {
      "title": "Circuit Breaker Vəziyyət Maşını",
      "blurb": "Downstream servis uğursuz olub bərpa olduqca breaker-in Closed → Open → Half-Open arasında necə keçdiyini izləyin: uğursuzluqlar onu açır, soyuma dövrü bir probun keçməsinə icazə verir və uğur onu yenidən bağlayır."
    },
    "videos": [
      {
        "title": "GopherCon 2015: Go kit: A Standard Library for Distributed Programming",
        "speaker": "Peter Bourgon · GopherCon 2015",
        "url": "https://www.youtube.com/watch?v=1AjaZi4QuGo",
        "blurb": "Go kit-in daxili circuit-breaker və rate-limiter middleware-ini təqdim edir və bu modulun circuit-breaker və load-shedding naxışlarını idiomatik Go-da köklüdür."
      },
      {
        "title": "AWS re:Invent 2024 - Try again: The tools and techniques behind resilient systems",
        "speaker": "Marc Brooker (AWS) · AWS re:Invent 2024",
        "url": "https://www.youtube.com/watch?v=rvHd4Y76-fs",
        "blurb": "Nüfuzlu sistem mühəndisinin hiper-miqyasda retry-lər, eksponensial backoff/jitter və circuit breaker-lərə dərin baxışı - bu modulun əsas dayanıqlılıq alət dəsti."
      }
    ],
    "concepts": [
      {
        "title": "Hər yerdə deadline-lar: dayanıqlılığın təməli",
        "body": "Birinci qayda: heç bir çağırış əbədi gözləmir. Hər şəbəkə əməliyyatı context.WithTimeout vasitəsilə timeout alır və bu context bütün çağırış zənciri boyu ötürülür (F5 modulu), ona görə sorğunun deadline-ı keçdikdə, onun üçün icrada olan hər downstream çağırış birdən ləğv edilir. Deadline-lar olmadan bir ilişmiş asılılıq goroutine-ləri və bağlantıları server tükənənə qədər saxlayır - klassik kaskad. Sorğu büdcəsi (məsələn, cəmi 2 saniyə) hop-lar arasında bölünür və hər hop ctx.Err()-i yoxlayır."
      },
      {
        "title": "Retry-lər: backoff, jitter və idempotentlik",
        "body": "Keçici uğursuzluqlar (qırılmış bağlantı, 503, M5-dən serializasiya konflikti) retry etməyə dəyər - amma sadəlövhcəsinə yox. Üç qayda. EKSPONENSİAL BACKOFF: 100 ms, 200 ms, 400 ms gözləyin... ki, zəifləyən servisi döyəcləməyəsiniz. JITTER: hər gecikməni rastgələləşdirin, yoxsa minlərlə müştəri sinxron şəkildə retry edib qalxmaqda olan servisi yenidən yıxan 'thundering herd' yaradır. İDEMPOTENTLİK: yalnız təkrarlanması təhlükəsiz olan əməliyyatları retry edin (təkrarlanan ödəniş idempotentlik açarı daşımalıdır, əks halda ikiqat pul çıxarırsınız). Və cəhd sayını məhdudlaşdırın - retry-lər yükü çoxaldır, ona görə hüdudsuz retry fırtınası özünüzə etdiyiniz DDoS-dur."
      },
      {
        "title": "Circuit breaker-lər: artıq işləməyəni çağırmağı dayandırmaq",
        "body": "Həqiqətən çökmüş servisi retry etmək sadəcə vaxt itirir və yük artırır. Circuit breaker asılılığı bükən vəziyyət maşınıdır. CLOSED: çağırışlar normal axır, o, uğursuzluq tezliyini izləyir. Uğursuzluqlar həddi keçdikdə OPEN-ə keçir: hər çağırış soyuma dövrü ərzində DƏRHAL uğursuz olur - timeout gözləmədən, asılılığa bərpa üçün yer verərək. Soyuma dövründən sonra HALF-OPEN-ə keçir və bir neçə prob çağırışına icazə verir; uğur olsa yenidən bağlanır, uğursuz olsa yenidən açılır. Bu 'sürətli uğursuz ol' davranışı bir ölü asılılığın bütün goroutine-lərinizi və bağlantılarınızı tükətməsinin qarşısını alır."
      },
      {
        "title": "Rate limiting & load shedding: özünüzü və başqalarını qoruyun",
        "body": "İki klapan sistemə nə qədər işin daxil olduğunu məhdudlaşdırır. RATE LIMITER (token bucket - golang.org/x/time/rate) qəbul etdiyiniz və ya göndərdiyiniz saniyədəki sorğu sayını məhdudlaşdırır, partlayışları hamarlayır və downstream-i həddindən artıq yükdən qoruyur. LOAD SHEDDING onun daha sərt qardaşıdır: artıq doymuş olduqda (növbə dolu, gecikmə SLO-nu keçib), bitirə bilmədiyiniz işi qəbul etmək əvəzinə artıq sorğuları dərhal 429/503 ilə rədd edirsiniz. Qəribədir ki, yük atmaq sistemi AYAQDA SAXLAYIR: həddindən artıq yük altında hər şeyi qəbul edən server sürünməyə qədər yavaşlayır və HEÇ KİMƏ xidmət etmir, 20%-i atan isə digər 80%-ə tam sürətlə xidmət edir."
      },
      {
        "title": "Backpressure: geri itələyən hüdudlu növbələr",
        "body": "Ən dərin dayanıqlılıq fikri backpressure-dur: istehlakçı ayaqlaşa bilmədikdə, sistem hüdudsuz buferləmək əvəzinə İSTEHSALÇINI YAVAŞLATMALIDIR. Hüdudsuz növbə (və ya channel) həddindən artıq yük altında sadəcə yaddaş tükənənə qədər böyüyür və proses OOM tərəfindən öldürülür - ötürmə problemini çökməyə çevirir. HÜDUDLU buferli channel pulsuz backpressure verir: doluduqda, göndərişlər blok olur, bu da yavaşlığı istehsalçıya geri ötürür ki, o, daha çox qəbul etməyi dayandırsın. Deadline-larla birləşdirilərsə, yavaş yol təmiz şəkildə timeout edir. Hər növbəni hüdudlayın; 'növbə dolu'nu böyümə deyil, atma siqnalı kimi qəbul edin."
      }
    ],
    "ai": {
      "title": "AI müəllimi ilə daha sürətli öyrənin",
      "body": "LLM-ə kövrək çağırış yolu verin və dayanıqlılıq naxışlarını düzgün sırayla qatlatdırın.",
      "prompt": "Bu, kövrək downstream servisi çağıran Go funksiyasıdır: <yapışdırın>. Dayanıqlılıq naxışlarını düzgün sırayla əlavə edin - context deadline, eksponensial backoff + jitter ilə məhdudlaşdırılmış retry-lər, circuit breaker və fallback - və hər qatın hansı uğursuzluqları həll etdiyini izah edin. Retry etmək təhlükəsiz olmayan idempotent-olmayan əməliyyatı işarələyin."
    },
    "practice": {
      "title": "Özünüz sınayın",
      "body": "Kövrək müştərini addım-addım möhkəmləndirin.",
      "steps": [
        "HTTP çağırışını context.WithTimeout-a bükün və onun deadline-da dayandığını (və ləğvi ötürdüyünü) təsdiqləyin.",
        "Eksponensial backoff + tam jitter ilə məhdudlaşdırılmış retry-lər əlavə edin; kövrək server simulyasiya edin və gecikmələrin necə böyüdüyünü izləyin.",
        "Circuit breaker əlavə edin (məsələn, sony/gobreaker) və OPEN olduqda çağırışların dərhal uğursuz olduğunu, sonra HALF-OPEN vasitəsilə bərpa olduğunu təsdiqləyin.",
        "Handler-in qarşısına rate.Limiter qoyun və yük testi edin: həddindən artıq yük altında çökmək əvəzinə 429 qaytardığını təsdiqləyin."
      ]
    },
    "pitfalls": [
      "Backoff, jitter və ya limit olmadan retry etmək - qısa downstream titrəyişini özünə-vurulmuş thundering-herd DDoS-a çevirmək.",
      "İdempotentlik açarı olmadan idempotent-olmayan əməliyyatları (ödənişlər, göndərmələr) retry etmək, təkrarlara səbəb olur.",
      "Həddindən artıq yükün OOM çökməsinə çevrilməsi üçün hüdudsuz channel/növbələr istifadə etmək, təmiz backpressure və atma əvəzinə."
    ],
    "takeaways": [
      "Hər xarici çağırışa context deadline qoyun; ötürülmə sorğunun bütün icrada olan işini birdən ləğv edir.",
      "Yalnız keçici, idempotent əməliyyatları retry edin - məhdudlaşdırılmış, eksponensial backoff VƏ jitter ilə.",
      "Doyma altında sürətlə uğursuz olun (circuit breaker) və yük atın; hüdudlu növbələr OOM əvəzinə backpressure verir."
    ],
    "checklist": [
      "Hər gedən çağırışın deadline-ı var və context ləğvinə hörmət edir.",
      "Retry-lər məhdudlaşdırılmış, jitter-li, eksponensial və yalnız idempotent əməliyyatlardadır.",
      "Circuit breaker məlum-çökmüş asılılıq üçün sürətlə uğursuz olur və half-open probları ilə bərpa olur.",
      "Növbələr hüdudludur; sistem doyma altında böyümək və ya çökmək əvəzinə yük atır (429/503)."
    ]
  },
  {
    "id": "m16",
    "title": "Redis: Keşləmə, Rate Limiting və Paylanmış Lock-lar",
    "short": "Redis",
    "level": "İstehsalat",
    "summary": "Redis tək-thread-li, yaddaşda-verilənlər-strukturu serveri kimi: onu real verilənlər bazasının yanında təhlükəsiz saxlayan cache-aside naxışı və eyni serveri pulsuz paylanmış lock-a və rate limiter-ə çevirən atomik əmrlər (SETNX, INCR).",
    "plain": "Redis-i real qeydləri saxlayan sənəd şkafının yanında duran kiçik lövhə kimi düşünün. Lövhəni oxumaq demək olar ki, anındadır; şkafı eşələmək yavaşdır. Ona görə əvvəlcə lövhəyə baxırsınız - oradadır (HIT), işiniz bitdi. Orada deyil (MISS), şkafa gedirsiniz, cavabı tapırsınız və getməzdən əvvəl onu lövhəyə yazırsınız, üstünə '60 saniyəyə sil' yapışqan kağızı ilə - ki, heç kim köhnəlmiş yazıya əbədi etibar etməsin. Redis-i sadəcə 'sürətli lövhə'dən çox edən əyilmə isə budur ki, lövhəyə yalnız bir katib toxunur və o katib hər dəfə bir sorğunu başdan-sona işləyir, heç vaxt ikisini birdən. Bu o deməkdir ki, 'yalnız yer hələ boşdursa yaz' kimi bir təlimat avtomatik ədalətlidir - beş nəfər eyni anda bunu qışqırsa belə, katib hələ də onları bir-bir emal edir, ona görə onlardan tam olaraq biri uğur qazanır. Bu tək xüsusiyyət - bir katibin bir vaxtda bir əmri işləməsi - sürətli keşi işləyən paylanmış lock-a və işləyən rate limiter-ə çevirən şeydir, üstəlik heç bir əlavə koordinasiya tələb etmədən.",
    "animation": {
      "title": "Cache-Aside Həyat Dövrü və Atomik Lock",
      "blurb": "Bir oxumanın miss-dən real verilənlər bazasına düşdüyünü, TTL ilə keşləndiyini, demək olar ki, anında hit kimi qayıtdığını, bitib yenidən miss olduğunu izləyin - sonra SETNX-in beş yarışan müştəridən dəqiq birinə lock qazandırmasına baxın."
    },
    "videos": [
      {
        "title": "Rate limiting with Redis: An essential guide",
        "speaker": "Redis (official)",
        "url": "https://www.youtube.com/watch?v=YV4ePyW3DO8",
        "blurb": "Birbaşa Redis-in öz mühəndislərindən, INCR və TTL ilə atomik rate limiter qurmağı izah edir - bu modulun öyrətdiyi dəqiq mexanizm."
      },
      {
        "title": "System Design: Why is single-threaded Redis so fast?",
        "speaker": "ByteByteGo (Alex Xu)",
        "url": "https://www.youtube.com/watch?v=5TRFpFBccQM",
        "blurb": "SETNX-əsaslı lock-ları və INCR-əsaslı sayğacları heç bir əlavə koordinasiya olmadan atomik edən tək-thread-li, yaddaş-daxili event-loop arxitekturasını izah edir."
      },
      {
        "title": "How Distributed Lock works ft Redis | System Design",
        "speaker": "ByteMonk",
        "url": "https://www.youtube.com/watch?v=qY4MfWv01pI",
        "blurb": "SET NX-i atomik paylanmış mutex kimi istifadə etməyi, o cümlədən bu modulun paylanmış-lock bölməsinin əhatə etdiyi çökmə/bitmə tələlərini izah edir."
      }
    ],
    "concepts": [
      {
        "title": "Redis əslində nədir: bir katibi olan yaddaş-daxili anbar",
        "body": "Redis verilənlər dəstini yaddaşda saxlayır (diskdə yox, baxmayaraq ki, bərpa üçün diskə persist edə BİLƏR), ona görə oxuma və yazmalar disk-əsaslı verilənlər bazasının tələb etdiyi milisaniyələr əvəzinə mikrosaniyələrlə ölçülür. İnsanları təəccübləndirən hissə: Redis əmr icrası üçün tək-thread-lidir - bir event loop əmrləri bir-bir, başdan-sona işləyir, Go proqramınız onu eyni anda çoxlu goroutine-dən çağırsa belə. Bu tək-thread-li nüvə ətrafında dolaşılmalı məhdudiyyət deyil; hər bir əmrin heç bir əlavə lock olmadan atomik olmasının səbəbidir - bu modulun qalanının birbaşa söykəndiyi xüsusiyyət."
      },
      {
        "title": "Cache-aside: Redis mənbənin YANINDA durur, onun ƏVƏZİNƏ yox",
        "body": "Cache-aside naxışında, tətbiq kodunuz əvvəlcə Redis-i yoxlayır. HIT-də birbaşa Redis-dən qaytarır və real verilənlər bazasına heç toxunmur. MISS-də (Go müştərisi bunu redis.Nil sentinel xətası kimi göstərir), real mənbəyi sorğulayır, nəticəni TTL ilə Redis-ə yazır və qaytarır. Vacib olan odur ki, Redis heç vaxt verilənlərin YEGANƏ nüsxəsi deyil - verilənlər bazası hələ də etibarlı mənbədir, ona görə keşi tamamilə itirmək təhlükəsizdir (yenidən başlama, bitmə, flushall) - növbəti miss-də sadəcə yenidən doldurulur."
      },
      {
        "title": "TTL və etibarsızlaşdırma: keşin bir az səhv olmasına icazə verilir",
        "body": "TTL keşlənmiş dəyərin nə qədər köhnəlmiş ola biləcəyini dəqiq məhdudlaşdırır - onu 60 saniyəyə qoysanız, qəsdən qəbul etmiş olursunuz ki, dəyər real vəziyyətdən 60 saniyəyə qədər geri qala bilər. Bu adətən aldığınız sürət üçün yaxşı kompromisdir. Bu, yaxşı olmadıqda (qiymət indicə dəyişib və dərhal düzgün olmalıdır), açıq şəkildə etibarsızlaşdırın: mənbə yeniləndiyi an açarı silin, TTL-in ona çatmasını gözləmək əvəzinə. İki texnika birləşir - TTL heç kimin açıq şəkildə etibarsızlaşdırmadığı açarlar üçün təhlükəsizlik torudur, açıq silmə isə önəmli olanlar üçün sürətli yoldur."
      },
      {
        "title": "Pulsuz atomiklik: paylanmış lock kimi SETNX",
        "body": "SET key value NX ('mövcud olmadıqda təyin et') ya açarı yaradıb uğur qaytarır, ya da açıq artıq varsa heç nə etmir və uğursuzluq qaytarır. Bütün yoxla-və-yaz Redis-in tək-thread-li event loop-unda BİR əmr kimi baş verdiyi üçün, 'yoxla' ilə 'yaz' arasında ikinci çağıranın sürüşə biləcəyi boşluq yoxdur - bu, sizin öz Go kodunuzda sadəlövh if GET key == nil { SET key } konstruksiyasının məhz malik olduğu yarışdır. Bu, SETNX-i (TTL ilə, ki, çökmüş sahib hər şeyi əbədi kilidlə tutmasın) istənilən sayda proses və ya maşın arasında düzgün paylanmış lock edir, tək bir Redis instansiyasından başqa heç nə istifadə etmədən."
      },
      {
        "title": "Atomik sayğaclar: rate limiter kimi INCR",
        "body": "Eyni tək-thread-li təminat INCR-i konkurentlik altında saymaq üçün təhlükəsiz edir: bir gediş-gəlişdə atomik şəkildə bir əlavə edir və yeni cəmi qaytarır, ona görə iki eyni-anlı çağıran heç vaxt hər ikisi '2' oxuyub hər ikisi '3' yaza bilməz, səssizcə bir artımı itirmədən. Sabit-pəncərəli rate limiter sadəcə INCR üstəgəl pəncərədəki ilk hit-də bir dəfə təyin olunan EXPIRE-dır: həmin pəncərə daxilində limitinizi keçən sayı rədd edirsiniz, açıq bitəndə isə bütün sayğac özünü sıfırlayır."
      }
    ],
    "ai": {
      "title": "AI müəllimi ilə daha sürətli öyrənin",
      "body": "LLM-ə sadəlövh GET-sonra-SET sayğacı və ya lock-u verin, dəqiq yarışı göstərsin, sonra onu atomik şəkildə yenidən qursun.",
      "prompt": "Bu, dəyəri GET ilə yoxlayan, onu Go-da dəyişdirən və SET ilə geri yazan Go funksiyasıdır: <yapışdırın>. İki konkurent çağıranın necə yarışıb bir yeniləməni itirə biləcəyini dəqiq göstərin, sonra onu Redis-in atomik INCR-i (sayğac üçün) və ya SETNX-i (lock üçün) istifadə edərək yenidən yazın ki, yarış sadəcə az ehtimallı deyil, struktur olaraq mümkünsüz olsun."
    },
    "practice": {
      "title": "Özünüz sınayın",
      "body": "Cache-aside naxışını, sonra lock-u, sonra limiter-i qurun və sındırın.",
      "steps": [
        "go-redis-i lokal Redis-ə yönləndirin, cache-aside Get/Set işlədin və soyuq miss-in keşi doldurduğunu, isti oxumanın 'yavaş' mənbənizi tamamilə atladığını təsdiqləyin.",
        "Qısa TTL qoyun, onu keçirin və növbəti oxumanın təmiz miss olduğunu təsdiqləyin - sonra açıq Del-on-write etibarsızlaşdırma əlavə edin və onun TTL-i qabaqladığını təsdiqləyin.",
        "Eyni SETNX açarında 5+ goroutine yarışdırın və bunu bir neçə dəfə işlədin: hər dəfə dəqiq birinin uğur qazandığını təsdiqləyin, hansının qazandığı dəyişsə də.",
        "INCR + EXPIRE limiterini qurun, bir pəncərə daxilində limitdən çox sorğu göndərin və artığın səssizcə buraxılmaq əvəzinə rədd edildiyini təsdiqləyin."
      ]
    },
    "pitfalls": [
      "Redis-i keş əvəzinə həqiqət sistemi kimi rəftar etmək - o bitirilsə, silinsə və ya yenidən başladılsa, yalnız Redis-də yaşayan hər şey sadəcə yox olur.",
      "Tətbiq kodunda sayğac və ya lock üçün atomik-olmayan GET-sonra-SET etmək - məhz SETNX və INCR-in mümkünsüz etmək üçün mövcud olduğu yoxla-sonra-hərəkət et yarışı.",
      "Cache stampede: bir çox açarın eyni anda bitməsi (və ya bir çox isti açarın bitməsi) real verilənlər bazasına birdən eyni-anlı miss-lər burğusu göndərir.",
      "SETNX ilə lock əldə etmək, amma onun TTL-ini unutmaq - buraxmadan əvvəl çökən sahib lock-u əbədi kimə də əlçatmaz halda ilişik saxlayır."
    ],
    "takeaways": [
      "Cache-aside: əvvəlcə Redis-i yoxlayın, miss-də real mənbəyə düşün, TTL ilə yenidən doldurun.",
      "Redis əmr icrası üçün tək-thread-lidir, ona görə SETNX və INCR hər çağıran üçün atomikdir - bu sizə sıfır əlavə sinxronlaşdırma ilə paylanmış lock və rate limiter verir.",
      "Keşlənmiş dəyər TTL-inə qədər səhv ola bilər; keşin həmişə düzgün olduğunu güman etmək əvəzinə qəsdən bu köhnəlmə pəncərəsi üçün dizayn edin."
    ],
    "checklist": [
      "Hər keşlənmiş açarın ya açıq TTL-i, ya da yazmada açıq etibarsızlaşdırma yolu var.",
      "Keş miss-ləri real mənbəyə təmiz şəkildə düşür və qaytarmazdan əvvəl keşi yenidən doldurur.",
      "Lock-lar və sayğaclar SETNX/INCR istifadə edir - heç vaxt ayrıca GET-sonra-SET yox.",
      "Hər lock açarı öz TTL-ini daşıyır, ona görə çökmüş sahib resursu əbədi kilidləyə bilməz."
    ]
  },
  {
    "id": "m20",
    "title": "Paylanmış Konsensus, Replikasiya və Sharding",
    "short": "Konsensus və Sharding",
    "level": "Staff",
    "summary": "Niyə sadəcə iki verilənlər bazası işlədib razılaşmalarını gözləyə bilməzsiniz: rastgələləşdirilmiş timeout-larla lider seçimi, hər node-un eyni əmrlər ardıcıllığına çatması üçün jurnalın replikasiyası, verilənləri tam qarışdırmadan sharding etmək üçün consistent hashing və bütün sistemi tənzimlənə bilən edən kvorum riyaziyyatı.",
    "plain": "Üç katibin eyni jurnalın nüsxəsini üç fərqli otaqda saxladığını, aralarında etibarsız intercom olduğunu təsəvvür edin. Sadəcə 'kim əvvəl yazsa, uduzur' qaydasına icazə versəniz, bir anlıq bir-birini eşitməyən iki katib eyni anda fərqli şeylər yazmağa başlaya bilər - indi üç jurnal razılaşmır və heç kim hansının doğru olduğunu deyə bilmir. Həll daha yaxşı intercom deyil; bir qaydadır: katib yalnız katiblərin ƏKSƏRİYYƏTİ ucadan razılaşdıqdan sonra yazmağa başlaya bilər ki, bu katib (və yalnız bu katib) indi məsuliyyət daşıyır. Bu razılaşma - əksəriyyət, hamısı yox, sadəcə biri yox - lider seçimi, jurnal replikasiyası və sharding-in altında duran tək fikirdir. Əksəriyyətə həmişə çatmaq mümkündür, hətta bir otaq susanda da, və əksəriyyət heç vaxt iki otaqda eyni anda formalaşa bilməz - məhz buna görə jurnal heç vaxt iki razılaşmayan versiyada bitmir.",
    "animation": {
      "title": "Lider Seçimi və Jurnal Replikasiyası",
      "blurb": "Üç node-un xoşbəxtcə heartbeat göndərdiyini, birinin rastgələləşdirilmiş seçim timeout-undan sonra susduğunu, namizədin əksəriyyətdən səs topladığını, lider olduğunu və jurnal qeydini təhlükəsiz commit olana qədər replika etdiyini izləyin."
    },
    "videos": [
      {
        "title": "Lecture 4: Primary-Backup Replication",
        "speaker": "MIT 6.824: Distributed Systems",
        "url": "https://www.youtube.com/watch?v=M_teob23ZzY",
        "blurb": "VMware FT-ni case study kimi istifadə edərək sadəlövh primary/backup replikasiyanın şəbəkə bölünmələri altında niyə sındığını göstərir - bu modulun başladığı split-brain motivasiyası."
      },
      {
        "title": "Lecture 7: Fault Tolerance: Raft (2)",
        "speaker": "MIT 6.824: Distributed Systems",
        "url": "https://www.youtube.com/watch?v=4r8Mz3MMivY",
        "blurb": "Rastgələləşdirilmiş timeout-lar/term-lər vasitəsilə Raft lider seçiminin və jurnal qeydlərinin əksəriyyət təsdiqi ilə necə 'committed' olduğunun qızıl-standart izahı."
      },
      {
        "title": "GopherCon 2023: Build Your Own Distributed System Using Go",
        "speaker": "Philip O'Toole · GopherCon 2023",
        "url": "https://www.youtube.com/watch?v=8XbxQ1Epi5w",
        "blurb": "Raft-əsaslı açar-dəyər anbarının Go-ya xas, praktiki qurulması - bu modulun konsensus/replikasiya nəzəriyyəsini real Go kodunda köklüdür."
      }
    ],
    "concepts": [
      {
        "title": "Problem: niyə iki verilənlər bazası sadəcə 'razılaşa' bilməz",
        "body": "Sadəlövh 'əl ilə failover-lı primary' dizaynı şəbəkə bölünənə qədər yaxşı görünür: primary hələ də işləyir, sadəcə ona çata bilmirsiniz, ona görə operator (və ya skript) backup-ı da primary edir. İndi iki node özünü səlahiyyətli hesab edir, hər ikisi yazma qəbul edir və bölünmə sağalan kimi razılaşmayan iki tarixiniz olur - split brain. Həll daha ağıllı sağlamlıq yoxlaması deyil; kimsə lider kimi hərəkət etməzdən əvvəl klasterin ƏKSƏRİYYƏTİNİN razılaşmasını tələb etməkdir, çünki şəbəkə bölünməsi azlığı əksəriyyətdən təcrid edə bilər, amma eyni node dəstindən eyni anda iki əksəriyyət yarada bilməz."
      },
      {
        "title": "Lider seçimi: heartbeat-lər, term-lər və rastgələləşdirilmiş timeout-lar",
        "body": "Hər node yalnız artan 'term' rəqəmini izləyir. Lider dövri heartbeat-lər göndərir; follower-lər onları eşitdiyi müddətcə follower qalır. Follower öz seçim timeout-u ərzində heç nə eşitməzsə, liderin getdiyini fərz edir, term-i artırır, namizədə çevrilir və hamıdan səs istəyir. Timeout hər node üçün rastgələləşdirilir ki, node-lar eyni anda hamısı namizədə çevrilib hər dövrdə səsi bölməsin - bir node-un taymeri demək olar ki, həmişə əvvəl işə düşür və digərləri başlamazdan əvvəl ona əksəriyyət üçün təmiz şans verir."
      },
      {
        "title": "Jurnal replikasiyası: əmrlərin sıralı ardıcıllığında razılaşmaq",
        "body": "Seçildikdən sonra lider yeni əmrləri qəbul etməyə icazəli yeganə node-dur. Hər əmr liderin lokal əlavə etdiyi jurnal qeydinə çevrilir, sonra hər follower-ə AppendEntries vasitəsilə göndərilir. Qeyd - tətbiq üçün təhlükəsiz, müştəriyə bildirmək üçün təhlükəsiz - node-ların ƏKSƏRİYYƏTİ (lider daxil) onu davamlı saxladığı an 'committed' olur, liderin lokal yazdığı an yox, hər follower-in onu aldığı an da yox. Bu fərq önəmlidir: lider heç vaxt yavaş və ya əlçatmaz azlığı gözləmir, ona görə klaster bir node ləngiyəndə və ya çökəndə də irəliləməyə davam edir."
      },
      {
        "title": "Consistent hashing: tam qarışdırma olmadan sharding",
        "body": "Sadə hash(key) % N N dəyişənə qədər yaxşı görünür: bir node əlavə etmək və ya çıxarmaq demək olar ki, hər açarın % N nəticəsini dəyişir və demək olar ki, tam verilənlər yenidən qarışdırılmasına məcbur edir. Consistent hashing həm node-ları, həm açarları eyni ədədi fəzaya hash edərək bir üzük üzərinə yerləşdirir; açar öz mövqeyindən saat əqrəbi istiqamətində tapılan ilk node-a məxsus olur. Node çıxarmaq yalnız ona işarə edən açarları yenidən xəritələyir - bütün üzüyü yox. Real sistemlər həmçinin 'virtual node'lar əlavə edir (fiziki node başına çoxlu üzük mövqeyi) ki, məsuliyyət boşluğun yanında təsadüfən oturan real node-a bərabərsiz hissə tökülmək əvəzinə bərabər paylansın."
      },
      {
        "title": "Kvorumlar: əksəriyyət oxu/yazıları və tənzimlənə bilən konsistentlik kompromisi",
        "body": "'Əksəriyyət'i üç rəqəmlə ümumiləşdirin: N cəmi replika, W yazını təsdiq etməli replika sayı, R oxunun müraciət etməli olduğu replika sayı. W + R > N olduqda, hər mümkün oxu kvorumu və hər mümkün yazı kvorumu ən azı bir replikada üst-üstə düşməyə zəmanətlidir - ona görə oxu ən son commit olunan yazını heç vaxt tamamilə ötürə bilməz. W və ya R-i bu sərhəddən aşağı endirsəniz, bu təminat bahasına daha sürətli, daha ucuz əməliyyatlar alırsınız: oxu ən yenisini heç vaxt soruşmamış replikaya düşdüyü üçün bir az köhnəlmiş dəyər qaytara bilər. Heç bir seçim 'səhv' deyil - bu bir tənzimləyicidir və istehsalat sistemləri onu harada təyin etdiklərini dəqiq sənədləşdirir."
      }
    ],
    "ai": {
      "title": "AI-İş Axını İnteqrasiyası",
      "body": "LLM-ə lider-seçimi izini verin və konkret node-un niyə qazandığını izah etdirin və ya simulyasiya edilmiş bölünmənin nəticəsini proqnozlaşdırın.",
      "prompt": "Bu, 5-node klasterdən 2 saniyə ərzində RequestVote/AppendEntries RPC-lərinin, term-lər və verilmiş səslərlə jurnalıdır: <yapışdırın>. Konkret node-un öz term-i üçün niyə lider olduğunu, əvvəlki hər hansı term-də bölünmüş səs baş verib-vermədiyini və bu izdən dərhal sonra {1,2} node-ları {3,4,5}-dən şəbəkə tərəfindən bölünsə nə baş verəcəyini addım-addım izah edin."
    },
    "practice": {
      "title": "Özünüz sınayın",
      "body": "Lider-seçim proqramını dəfələrlə işlədin və qalibin dəyişməsinə baxmayaraq təminatın necə saxlandığını izləyin.",
      "steps": [
        "Nümunə proqramı (go run .) beş dəfə ardıcıl işlədin və hər dəfə hansı node-un qazandığını qeyd edin - əvvəlcədən proqnozlaşdırıla bilməməlidir, amma həmişə dəqiq bir qalib olmalıdır.",
        "Onu go run -race altında yenidən işlədin və konkurent RequestVote/AppendEntries goroutine-lərinə baxmayaraq sıfır data race olduğunu təsdiqləyin.",
        "Klaster ölçüsünü 3-dən 5-ə dəyişin və əksəriyyət həddini (n/2+1) yeniləyin ki, əksəriyyət indi 2 yox, 3 təsdiq tələb etsin.",
        "Üç saxta node ID-ni və üç saxta açarı ədədi üzük üzərinə əl ilə (və ya kiçik skriptlə) hash edin, bir node çıxarın və yalnız ona işarə edən açarların yeni qonşusuna keçdiyini təsdiqləyin."
      ]
    },
    "pitfalls": [
      "Real kvorum-əsaslı seçim əvəzinə 'əl ilə failover-lı primary' qurmaq - şəbəkə bölünməsi hər iki tərəfi özünü primary hesab etməyə vadar edir və indi iki 'lider' ziddiyyətli yazma qəbul edir.",
      "Jurnal qeydini lider lokal yazan kimi təhlükəsiz hesab etmək - o yalnız ƏKSƏRİYYƏT replika onu davamlı saxladıqda committed olur, replika etmədən çökən lider heç kimin almadığı işi itirə bilər.",
      "W və R-i W + R <= N olacaq şəkildə seçib sonra oxuların köhnəlmiş verilən qaytardığına təəccüblənmək - bu bug deyil, məhz konfiqurasiya etdiyiniz konsistentlik kompromisidir.",
      "Açarları consistent hashing əvəzinə sadə hash(key) % N ilə hashlemək - bir node əlavə etmək və ya çıxarmaq yalnız ona yaxın olanları yox, demək olar ki, hər açarı qarışdırır."
    ],
    "takeaways": [
      "Konsensus N müstəqil node-u tək replika olunmuş jurnala çevirir, hər dəfə bir qeyd, rastgələləşdirilmiş-timeout lider seçimi ilə ki, heç bir tək node uğursuzluq nöqtəsi olmasın.",
      "'Committed' o deməkdir ki, əksəriyyət onu davamlı saxlayır - lider onu lokal yazdığı demək deyil və hər replikanın hələ ona sahib olduğu demək deyil.",
      "Consistent hashing və virtual node-lar klasterin bir node ilə böyüməsinə/kiçilməsinə bütün açar fəzasını qarışdırmadan imkan verir, W + R > N isə gecikməni oxu konsistentliyi ilə mübadilə edən tənzimləyicidir."
    ],
    "checklist": [
      "Lider seçimi rastgələləşdirilmiş timeout-lar və term-başı əksəriyyət səsləri istifadə edir - heç vaxt sabit 'kim əvvəl ayaqdadırsa' primary yox.",
      "Yazma yalnız replikaların əksəriyyəti onu təsdiqlədikdə davamlı hesab edilir, təkcə lider yox.",
      "Sharding consistent hashing (virtual node-larla) istifadə edir, ona görə node əlavə etmək və ya çıxarmaq açarların kiçik, hüdudlu hissəsini yenidən xəritələyir.",
      "Oxu/yazı kvorum ölçüləri (W, R, N) qəsdən, sənədləşdirilmiş seçimdir - standart parametrlərin təsadüfü deyil."
    ]
  },
  {
    "id": "m18",
    "title": "SRE: SLO-lar, Observability, İnsidentlər və Platforma Etibarlılığı",
    "short": "SRE və Müsahibəyə Hazırlıq",
    "level": "İstehsalat",
    "summary": "SRE vakansiyasını mühəndislik bacarığına çevirin: SLI/SLO/error budget-ləri təyin edin, faydalı dashboard-lar və alert-lər qurun, OpenTelemetry + Prometheus/Thanos + Tempo + Loki işlədin, on-call/RCA aparın, toil-u avtomatlaşdırın və Kubernetes/OpenShift etibarlılığı haqqında mühakimə yürüdün.",
    "plain": "SRE istehsalat sistemlərini qəsdən etibarlı etmək fənnidir. Sadəcə 'dashboard-lara baxmırsınız' - istifadəçilər üçün etibarlılığın nə demək olduğunu təyin edirsiniz (SLI/SLO-lar), yalnız istifadəçilər zərər çəkəndə və ya error budget yandıqda alert edirsiniz, debug etməni qısaldan telemetriya toplayırsınız, insidentləri aydın komanda strukturu ilə idarə edirsiniz və təkrarlanan əl işini avtomatlaşdırma ilə aradan qaldırırsınız. Müsahibədə ən güclü cavablar alətləri nəticələrə bağlayır: Prometheus məqsəd deyil - aşağı aşkarlama vaxtı, aşağı bərpa vaxtı və daha təhlükəsiz release-lər məqsəddir.",
    "animation": {
      "title": "SLO Error Budget və Burn Rate",
      "blurb": "99.9% əlçatanlıq SLO-sunun error budget-ə necə çevrildiyini izləyin, sonra yavaş burn və sürətli burn alert-lərinin necə çox fərqli əməliyyat cavabları verdiyinə baxın."
    },
    "animations": [
      {
        "title": "SLO Error Budget və Burn Rate",
        "blurb": "99.9% əlçatanlıq SLO-sunun error budget-ə necə çevrildiyini izləyin, sonra yavaş burn və sürətli burn alert-lərinin necə çox fərqli əməliyyat cavabları verdiyinə baxın."
      },
      {
        "title": "OpenTelemetry → Prometheus/Thanos + Tempo + Loki",
        "blurb": "Bir sorğunun metrikaya, trace-ə və loglara necə çevrildiyini izləyin, sonra Prometheus, Thanos, Tempo və Loki-nin əməliyyat yığınında haraya uyğun gəldiyinə baxın."
      },
      {
        "title": "On-call, RCA və Toil Avtomatlaşdırması",
        "blurb": "Alert-dən triaj-a, mitigasiyaya, kök səbəb analizinə və avtomatlaşdırma backlog-una keçin - insidentləri etibarlılıq təkmilləşdirmələrinə çevirən dövr."
      }
    ],
    "videos": [
      {
        "title": "SREcon21 - Food for Thought: What Restaurants Can Teach Us about Reliability",
        "speaker": "Alex Hidalgo (author, \"Implementing Service Level Objectives\") · USENIX SREcon21",
        "url": "https://www.youtube.com/watch?v=qDfPrl4l31w",
        "blurb": "Sahənin aparıcı SLO müəllifindən SLI/SLO/error-budget düşüncəsini əlçatan şəkildə çərçivələyən - bu modulun etibarlılıq riyaziyyatının əsasında duran video."
      },
      {
        "title": "SREcon21 - Evolution of Incident Management at Slack",
        "speaker": "Brent Chapman (Slack) · USENIX SREcon21",
        "url": "https://www.youtube.com/watch?v=FYYTglQoS3w",
        "blurb": "Slack-in real incident-commander/comms-lead/ops-lead rol strukturunu və günahsız postmortem mədəniyyətini təfərrüatlandırır - bu modulun insident-cavab bölməsi."
      },
      {
        "title": "OpenTelemetry Is the Kubernetes of Observability",
        "speaker": "Chris Aniszczyk (CNCF CTO) · The Linux Foundation",
        "url": "https://www.youtube.com/watch?v=d7d6JN0J3SQ",
        "blurb": "OpenTelemetry-nin niyə Prometheus/Thanos/Tempo/Loki-tipli yığınları qidalandıran standart instrumentasiya qatına çevrildiyini izah edir - bu modulun alət bazası."
      }
    ],
    "concepts": [
      {
        "title": "SLI, SLO və error budget",
        "body": "SLI istifadəçi təcrübəsinin ölçülən siqnalıdır: əlçatanlıq, uğurlu sorğular, hədd altında gecikmə, növbənin tazəliyi. SLO həmin siqnal üçün hədəfdir, məsələn 30 gün ərzində köçürmələrin 99.9%-inin uğurlu olması. Error budget icazə verilən uğursuzluqdur: 99.9% SLO üçün 0.1%. Güclü SRE işi buradan başlayır, çünki alert-lər, release qapıları və etibarlılıq investisiyaları obyektiv olur. Büdcə sağlamdırsa - göndərin. Sürətlə yanırsa - riskli release-ləri dondurun və mitigasiya edin."
      },
      {
        "title": "Önəmli olan dashboard-lar və alert-lər",
        "body": "Yaxşı dashboard əməliyyat sualına cavab verir: istifadəçilər təsirlənibmi, darboğaz haradadır və nə dəyişib? Servislər üçün RED istifadə edin: Rate, Errors, Duration. İnfrastruktur üçün USE istifadə edin: Utilization, Saturation, Errors. Alert-lər hərəkət ediləbilən olmalı və SLO burn-ə və ya sərt doymaya bağlı olmalıdır, hər səs-küylü simptoma yox. Müsahibələrdə, CPU 80%-də page etməyin niyə zəif, 'checkout SLO-su 5 dəqiqə ərzində 14x yanır'da page etməyin niyə güclü olduğunu izah edin: bu istifadəçi təsiri və təcililiyə xəritələnir."
      },
      {
        "title": "OpenTelemetry və Grafana/Prometheus yığını",
        "body": "OpenTelemetry instrumentasiya və nəqliyyatdır: trace-ləri, metrikaları və logları tətbiq sərhədində standartlaşdırır. Prometheus metrikaları scrape edir; Thanos Prometheus verilənlərini klasterlər arası və uzun saxlama müddəti ilə saxlayır və sorğulayır; Tempo trace-ləri ucuz saxlayır; Loki log etiketlərini indeksləyir və log mətnini sıxılmış saxlayır. Məqsəd korrelyasiyadır: alert metrikada işə düşür, yavaş sorğu üçün trace açırsınız, sonra eyni trace ID ilə loglara keçirsiniz."
      },
      {
        "title": "On-call və insident komandası",
        "body": "Strukturlu on-call bir proses, saat 3-də istehsalatı qəhrəmancasına düzəldən bir şəxs deyil. Yaxşı insidentin rolları var: incident commander koordinasiya edir, operations lead mitigasiya edir, communications lead maraqlı tərəfləri yeniləyir, scribe timeline-ı qeyd edir. Birinci məqsəd mükəmməl kök səbəb deyil, mitigasiyadır. Sistem sabitləşdikdən sonra günahsız postmortem aparın: təsir, timeline, töhfə verən amillər, nəyin aşkarladığı, nəyin cavabı gecikdirdiyi və sahibli konkret follow-up hərəkətlər."
      },
      {
        "title": "Toil avtomatlaşdırması",
        "body": "Toil əl ilə, təkrarlanan, avtomatlaşdırıla bilən işdir ki, servislə birlikdə böyüyür: ilişmiş pod-ları yenidən başlatmaq, eyni diaqnostikanı toplamaq, eyni növbələri yenidən ölçüləndirmək, eyni yoxlama siyahısını əl ilə işlətmək. SRE stil üçün avtomatlaşdırmır; əməliyyat yükünü və dəyişkənliyi azaltmaq üçün avtomatlaşdırır. Ən yaxşı namizədlər toil mənbəyini adlandıra, ölçə, kiçik skript və ya controller yaza, qoruyucular əlavə edə və avtomatlaşdırmanın insidentləri və ya sərf olunan dəqiqələri azaltdığını sübut edə bilər."
      },
      {
        "title": "Kubernetes/OpenShift etibarlılıq nəzərdən keçirməsi",
        "body": "Kubernetes və ya OpenShift üçün etibarlılıq nəzərdən keçirməsi prob-lara, resurs sorğu/limitlərinə, HPA siqnallarına, pod disruption budget-lərinə, rollout strategiyasına, şəbəkə siyasətlərinə, servis/yük balanslaşdırıcı davranışına, saxlama siniflərinə, verilənlər bazası asılılıqlarına və secret idarəçiliyinə baxmaq deməkdir. OpenShift platforma konvensiyaları əlavə edir: Route-lar, SecurityContextConstraint-lər, inteqrasiya olunmuş registry/build-lər və daha sərt standartlar. Müsahibə cavabları bu tənzimləyiciləri uğursuzluq rejimlərinə bağlamalıdır: pis readiness soyuq pod-lara trafik göndərir; PDB-nin olmaması node drain-i downtime-a çevirir; yanlış limitlər throttling yaradır."
      },
      {
        "title": "Linux və şəbəkə problemlərinin həlli",
        "body": "SRE müsahibələri tez-tez sistemli debug-u sınayır. Simptomlardan başlayıb yığın aşağı hərəkət edin: DNS həlli, TCP bağlantısı, TLS əl sıxma, HTTP status, yük balanslaşdırıcı, pod endpoint-ləri, tətbiq logları, verilənlər bazası gecikməsi, node təzyiqi. Linux-da əsas sübutları bilin: soketlər üçün ss, DNS üçün dig, HTTP/TLS üçün curl -v, sistem logları üçün journalctl, CPU üçün top/pidstat, disk üçün iostat, paketlər lazım olduqda tcpdump. Bacarıq fərziyyələri sürətlə formalaşdırıb aradan qaldırmaqdır."
      }
    ],
    "ai": {
      "title": "AI-İş Axını İnteqrasiyası",
      "body": "Assistenti SRE müsahibə məşqçisi kimi istifadə edin: ona iş elanı verib SLO, alerting, insident və Kubernetes problem-həll ssenariləri yaratmasını istəyin, sonra cavablarınızı konkret siqnallara qarşı qiymətləndirin.",
      "prompt": "Böyük SRE müsahibəçisi kimi çıxış edin. Bu vakansiyaya əsaslanaraq mənə bir dəfə bir ssenari verin: SLI/SLO, Prometheus/Thanos, OpenTelemetry, Tempo/Loki, Kubernetes/OpenShift, Linux şəbəkəçiliyi, on-call, RCA və toil avtomatlaşdırması. Hər cavabdan sonra onu düzgünlük, əməliyyat mühakiməsi və kommunikasiyaya görə qiymətləndirin, sonra daha güclü cavabı göstərin."
    },
    "practice": {
      "title": "Özünüz sınayın",
      "body": "SLO-nu rəqəmə çevirin, sonra onu qəsdən pozun və alert məntiqinin necə cavab verdiyinə baxın.",
      "steps": [
        "Bir endpoint seçin, onun SLI-sini təyin edin (məsələn uğur/cəmi), 99.9% SLO qoyun və 1,000,000 sorğu üçün error budget-i əl ilə hesablayın.",
        "Bu moduldan burn-rate ifadəsini yazın və onu iki ssenari üçün hesablayın: 5 dəqiqədə 14x burn və 6 saatda 2x burn - hər biri üçün page ya ticket qərar verin.",
        "Log sətrinə və span-a trace_id əlavə edin və saxta bir sorğunu başdan-sona əl ilə izləyin: metrika işarələyir, trace yavaş hop-u göstərir, log hadisəni izah edir.",
        "'daha çox araşdır' yox, sahibli, son tarixli və konkret etibarlılıq nəticəli bir real postmortem hərəkət maddəsi yazın."
      ]
    },
    "pitfalls": [
      "SLO-ları infrastruktur simptomlarından, istifadəçiyə görünən davranış əvəzinə təyin etmək.",
      "Heç bir hərəkət və ya istifadəçi təsiri olmayan səs-küylü metrikalarda page etmək.",
      "Trace-lərin, logların və metrikaların fərqli ID-lər istifadə etməsinə icazə vermək ki, korrelyasiya əl ilə olsun.",
      "Postmortem-ləri etibarlılıq öyrənmə alətləri əvəzinə günahlandırma sənədləri kimi rəftar etmək.",
      "Toil-u qoruyucular, audit logları və ya geri qaytarma yolları olmadan avtomatlaşdırmaq.",
      "Kubernetes əsaslarını nəzərə almamaq: readiness, sorğu/limitlər, PDB-lər, rollout parametrləri və endpoint sağlamlığı."
    ],
    "takeaways": [
      "SRE istifadəçiyə görünən etibarlılıqla başlayır: SLI, SLO və error budget.",
      "Metrikalar sizi page edir, trace-lər yavaş hop-u tapır, loglar hadisəni izah edir - üçünü də korrelyasiya edin.",
      "İnsidentlər rollar tələb edir, əvvəlcə mitigasiya, sonra günahsız RCA və sahibli follow-up-lar.",
      "Toil avtomatlaşdırması istehsalat mühəndisliyidir: təkrar işi azaldır və cavabı sabit edir.",
      "Güclü müsahibə cavabları alətləri buzzword-lara deyil, etibarlılıq nəticələrinə bağlayır."
    ],
    "checklist": [
      "Mikroservis üçün SLI/SLO dizayn edə və error-budget burn-ü hesablaya bilirəm.",
      "RED/USE dashboard qura və page-ediləcək alert-ləri ticket-lərdən ayıra bilirəm.",
      "OpenTelemetry, Prometheus/Thanos, Tempo və Loki-ni bir sorğu-debug iş axınında izah edə bilirəm.",
      "İnsidenti alert-dən mitigasiyaya, RCA-ya və hərəkət maddələrinə qədər idarə edə bilirəm.",
      "Kubernetes/OpenShift deployment etibarlılığını nəzərdən keçirə və Linux/şəbəkə simptomlarını debug edə bilirəm.",
      "Toil-u müəyyən edə və ölçülə bilən faydalı təhlükəsiz avtomatlaşdırma təklif edə bilirəm."
    ]
  }
];

const GLOSSARY_AZ = {
  "f4": [
    [
      "Goroutine",
      "Yüngül, runtime tərəfindən planlaşdırılan konkurent funksiya (~2 KB başlanğıc stack)."
    ],
    [
      "Channel",
      "Goroutine-lər arasında dəyər ötürmək üçün tipləşdirilmiş, sinxronlaşdırılmış boru."
    ],
    [
      "Buferlənməmiş / buferlənmiş",
      "Görüş nöqtəsi (cütləşənə qədər bloklanma) və N dəyərə qədər tutma."
    ],
    [
      "select",
      "Bir neçə channel əməliyyatını gözləmək; hansı əvvəl hazır olarsa o davam edir."
    ],
    [
      "Fan-out / fan-in",
      "İşi N worker arasında yaymaq / onların nəticələrini bir channel-da birləşdirmək."
    ],
    [
      "Goroutine sızması",
      "Heç vaxt geri alınmayan, əbədi bloklanmış qalan goroutine."
    ]
  ],
  "f5": [
    [
      "error",
      "if err != nil ilə yoxlanılan, uğursuzluğu bildirmək üçün qaytarılan dəyər."
    ],
    [
      "Bükmə (%w)",
      "Zəncirin yoxlanıla bilən qalması üçün səbəbi yeni bir xətanın içinə yerləşdirmək."
    ],
    [
      "errors.Is / As",
      "Xəta zəncirini bir sentinel dəyər / konkret bir tip üçün axtarmaq."
    ],
    [
      "Sentinel xəta",
      "Çağıranların müqayisə etdiyi əvvəlcədən müəyyən edilmiş xəta dəyəri."
    ],
    [
      "context.Context",
      "Çağırışlar boyu ləğvi, deadline-ları və sorğu-əhatəli dəyərləri daşıyır."
    ],
    [
      "internal/",
      "Yalnız öz module-unuzun import edə biləcəyi package-ləri saxlayan qovluq."
    ]
  ],
  "f3": [
    [
      "Cədvəl əsaslı test",
      "Eyni məntiqdən keçirilən, hər biri subtest olan hallar siyahısı."
    ],
    [
      "Subtest (t.Run)",
      "Öz pass/fail-i olan adlandırılmış, izolə olunmuş övlad test."
    ],
    [
      "Coverage",
      "Testlərinizin işlətdiyi kod sətirlərinin payı."
    ],
    [
      "Fuzzing",
      "Crash-lər və sərhəd halları axtaran avtomatik yaradılmış təsadüfi girişlər."
    ],
    [
      "t.Helper()",
      "Bir funksiyanı helper kimi işarələyir, ona görə uğursuzluqlar çağıranda göstərilir."
    ],
    [
      "Golden file",
      "Testin qarşı müqayisə etdiyi qeydə alınmış 'gözlənilən nəticə' faylı."
    ]
  ],
  "m19": [
    [
      "Slice başlığı",
      "Slice-ın həqiqətən olduğu üç söz - pointer, uzunluq, tutum."
    ],
    [
      "Bucket / tophash",
      "Map-in 8 yerlik hüceyrəsi; tophash baytları açar müqayisəsini qısaldır."
    ],
    [
      "Yük əmsalı",
      "Bucket başına orta giriş sayı; Go map-ləri ~6.5-dən sonra böyüyür."
    ],
    [
      "Binar heap",
      "Slice-da tam bir ağac; i-nin övladları 2i+1 və 2i+2-də."
    ],
    [
      "BFS / DFS",
      "Növbə ilə gəzinti (səviyyə sırası, ən qısa yollar) stack ilə gəzintiyə (dərinlik üzrə) qarşı."
    ],
    [
      "Adjacency list",
      "Node → qonşular map-i kimi qraf; O(V+E) yaddaş və gəzinti."
    ]
  ],
  "f1": [
    [
      "Mark & sweep",
      "Hər əlçatan (canlı) obyekti tap, sonra qalanların hamısını azad et."
    ],
    [
      "Üç-rəngli",
      "Ağ = toxunulmayıb, boz = əlçatandır-amma-skan olunmayıb, qara = skan olunub. Sonda ağ olan zibildir."
    ],
    [
      "Write barrier",
      "Konkurent mark-ın canlı obyektin izini heç vaxt itirməməsi üçün pointer yazılarında kiçik uçot."
    ],
    [
      "GOGC",
      "Növbəti GC-dən əvvəl heap böyümə hədəfi (default 100 = canlı heap-in ikiqat böyüməsinə icazə ver)."
    ],
    [
      "GOMEMLIMIT",
      "Yumşaq ümumi-yaddaş tavanı; OOM-dan qaçmaq üçün ona yaxınlaşdıqca GC daha çox çalışır."
    ],
    [
      "Stop-the-world",
      "Bütün goroutine-lərin dayandığı qısa fasilələr - Go-da millisaniyədən az."
    ]
  ],
  "f2": [
    [
      "Profil",
      "Bir proqramın bir resursu (CPU, yaddaş…) harada xərclədiyinin statistik nümunəsi."
    ],
    [
      "Flame graph",
      "Enliliyi vaxt/resursları, yığılması isə çağırış yuvalanmasını göstərən yığılmış bar-lar."
    ],
    [
      "net/http/pprof",
      "Canlı bir serverdə /debug/pprof/* endpoint-lərini açan boş-import package."
    ],
    [
      "Sampling",
      "Hər çağırışı instrument etmək əvəzinə işləyən stack-i saniyədə dəfələrlə qeydə almaq."
    ],
    [
      "inuse vs alloc",
      "Heap-profil görünüşləri: hazırda tutulan yaddaş və indiyə qədər ayrılmış cəmi yaddaş."
    ]
  ],
  "m1": [
    [
      "ServeMux",
      "Go-nun standart-kitabxana HTTP sorğu router-i."
    ],
    [
      "Pattern",
      "'GET /api/v1/ledger/{id}' kimi metod + path şablonu."
    ],
    [
      "Wildcard / PathValue",
      "r.PathValue(name) ilə oxunan {name} path seqmenti."
    ],
    [
      "Radix trie",
      "Mux-un gələn path-ları qarşı yoxladığı prefiks-ağac."
    ],
    [
      "os.Root",
      "Ondan kənara çıxan hər hansı girişi rədd edən qovluq handle-i."
    ],
    [
      "Path traversal",
      "Nəzərdə tutulan qovluqdan kənar faylları oxumaq üçün ../ istifadə edən hücum."
    ]
  ],
  "m2": [
    [
      "Serializasiya",
      "Yaddaşdakı dəyərləri bayt-lara (məsələn, JSON) çevirmək və geri."
    ],
    [
      "Reflection",
      "Runtime tip yoxlaması - çevik, amma nisbətən yavaş."
    ],
    [
      "jsontext",
      "encoding/json/v2-də aşağı-səviyyəli streaming JSON token API-si."
    ],
    [
      "Swiss Table",
      "8 slot-un tag-larını bir dəfəyə yoxlayan cache-dostu map düzülüşü."
    ],
    [
      "Control byte",
      "Swiss Table-ın SIMD-tərzi müqayisə etdiyi slot-başına 1-baytlıq tag."
    ],
    [
      "Escape analysis",
      "Kompilyatorun bir dəyərin stack-də, yoxsa heap-də yaşayacağına qərar verməsi."
    ]
  ],
  "m4": [
    [
      "Flaky test",
      "İşlər arasında qeyri-deterministik şəkildə keçən və ya uğursuz olan test."
    ],
    [
      "synctest qabarcığı",
      "Saxta saatda işləyən izolə edilmiş goroutine qrupu."
    ],
    [
      "Virtual saat",
      "Hər goroutine bloklandıqda irəli sıçrayan simulyasiya edilmiş zaman."
    ],
    [
      "synctest.Wait",
      "Qabarcıqlanmış hər goroutine sancıldıqdan sonra qayıdan baryer."
    ],
    [
      "b.Loop()",
      "for i := 0; i < b.N-i əvəz edən müasir benchmark döngüsü."
    ],
    [
      "Davamlı bloklanmış",
      "Xarici giriş olmadan davam edə bilməyəcək şəkildə bloklanmış."
    ]
  ],
  "m5": [
    [
      "sqlc",
      "Build zamanı xam SQL + sxemdən tip-təhlükəsiz Go yaradır."
    ],
    [
      "pgxpool",
      "Ömür müddətləri və limitləri olan idarə olunan Postgres bağlantı hovuzu."
    ],
    [
      "Sətir-səviyyəli kilid",
      "SELECT … FOR UPDATE - bütün cədvəli yox, spesifik sətirləri kilidləyir."
    ],
    [
      "Double-entry",
      "Hər köçürmə bir hesabı debit, digərini eyni məbləğdə credit edir."
    ],
    [
      "SQLSTATE",
      "Postgres-in 5-simvollu xəta kodu (məsələn, 23505 = unique_violation)."
    ],
    [
      "40001",
      "serialization_failure - yenidən cəhd edilməli olan rəqabət konflikti."
    ]
  ],
  "m17": [
    [
      "MVCC",
      "Postgres-in snapshot modeli: yazıçılar yeni sətir versiyaları yaradır, oxuyucular isə köhnə ardıcıl görünüşü görməyə davam edir."
    ],
    [
      "Bloat",
      "Vacuum-un hələ təmizləmədiyi ölü sətir versiyaları, cədvəl və indeks ölçüsünü artırır."
    ],
    [
      "EXPLAIN ANALYZE BUFFERS",
      "Sorğunu işlədir və real vaxtla birlikdə shared/local/temp buffer istifadəsini göstərir."
    ],
    [
      "Kompozit indeks",
      "Sorğunun filtrlərinə, sıralamasına və səhifələməsinə uyğun sıralanmış çox-sütunlu indeks."
    ],
    [
      "CREATE INDEX CONCURRENTLY",
      "Normal oxu/yazıları bloklamadan indeks qurur, əvəzində daha çox vaxt və məhdudiyyət tələb edir."
    ],
    [
      "Outbox nümunəsi",
      "Biznes sətrini və nəşr edilə bilən hadisəni eyni tranzaksiyada yazın, sonra asinxron şəkildə ötürün."
    ]
  ],
  "m13": [
    [
      "Data race",
      "Ən azı biri yazma olmaqla yaddaşa paralel sinxronlaşdırılmamış giriş - qeyri-müəyyən davranış."
    ],
    [
      "happens-before",
      "Go memory modelinin sinxronlaşdırılmış əməliyyatlar arasında verdiyi sıralama zəmanəti."
    ],
    [
      "CAS (compare-and-swap)",
      "Atomic 'X-i yalnız hələ də old-a bərabərdirsə new-ə təyin et', uğur qazanana qədər dövr edir."
    ],
    [
      "Kritik seksiya",
      "Mutex ilə qorunan, eyni anda yalnız bir goroutine-in icra etdiyi kod."
    ],
    [
      "RWMutex",
      "Çoxlu paralel oxuyucuya, ya da bir yazıçıya icazə verən, heç vaxt ikisinə birdən yox, kilid."
    ],
    [
      "Mülkiyyət ötürülməsi",
      "Dəyəri kanal vasitəsilə ötürərək eyni anda yalnız bir goroutine-in ona sahib olması."
    ]
  ],
  "m3": [
    [
      "Finalizer",
      "Köhnə, etibarsız yığılma-öncəsi callback - ondan çəkin."
    ],
    [
      "runtime.AddCleanup",
      "Obyekt əlçatmaz olduqdan sonra işə düşən müasir, bir-dəfəlik təmizləmə."
    ],
    [
      "Interning",
      "Bərabər dəyərləri bir paylaşılan nüsxəyə dedublikasiya etmək (unique.Make)."
    ],
    [
      "Zəif göstərici (weak pointer)",
      "Hədəfini canlı saxlamayan bir istinad (weak paketi)."
    ],
    [
      "G-M-P",
      "Goroutine / OS-thread (M) / prosessor (P) planlaşdırma modeli."
    ],
    [
      "Netpoller",
      "I/O-da bloklanan goroutine-ləri park edir ki, heç bir OS thread-i boş yerə fırlanmasın."
    ]
  ],
  "m7": [
    [
      "FlightRecorder",
      "Həmişə-aktiv, son trace hadisələrinin yaddaşdakı sərhədli buffer-i."
    ],
    [
      "Execution trace",
      "Goroutine-lərin, GC-nin, syscall-ların və planlaşdırmanın zaman xətti (go tool trace)."
    ],
    [
      "Goroutine dump",
      "Hər goroutine-in cari stack-inin bir snapshot-u."
    ],
    [
      "p99 gecikmə",
      "Sorğuların 99%-nin ötdüyü gecikmə - yavaş quyruq."
    ],
    [
      "Goroutine sızması",
      "Əbədi ilişib qalan və heç vaxt geri qazanılmayan bir goroutine."
    ],
    [
      "Gözləmə səbəbi",
      "Goroutine dump-ındakı park edilmə vəziyyəti etiketi (chan receive, select, IO wait) üstəgəl nə qədər gözlədiyi."
    ]
  ],
  "m8": [
    [
      "SIMD",
      "Bir dəfəyə bir dəyər vektoru üzərində işləyən tək bir təlimat."
    ],
    [
      "Vektor zolağı (vector lane)",
      "Bir SIMD registrində bir element yeri."
    ],
    [
      "Skalyar fallback",
      "Vektor yolu olmayan CPU-lar/arxitekturalar üçün adi bir dövr."
    ],
    [
      "runtime/secret",
      "Gizinləri sıfırlayan və köçürülə bilən heap-dən kənar qalan bir buffer."
    ],
    [
      "Green Tea GC",
      "Bitişik 8 KiB span-ları skan edən eksperimental collector."
    ],
    [
      "Bounds-check elimination",
      "Kompilyatorun doğruluğu sübut edilə bilən slice indeks yoxlamalarını silməsi."
    ]
  ],
  "m10": [
    [
      "Cache line",
      "RAM ilə keş arasında tək vahid kimi daşınan 64-baytlıq (Apple Silicon-da 128) blok."
    ],
    [
      "L1 / L2 / L3",
      "Registrlərlə RAM arasında yerləşən, tədricən böyüyən, yavaşıyan çip-üstü keşlər."
    ],
    [
      "Temporal lokallıq",
      "Bu yaxınlarda istifadə edilən data, çox güman, tezliklə yenidən istifadə olunacaq - buna görə keşlər onu saxlayır."
    ],
    [
      "Spatial lokallıq",
      "İndicə istifadə edilənin yanındakı data, çox güman, tezliklə lazım olacaq - prefetcher-lər bunu istifadə edir."
    ],
    [
      "False sharing",
      "Bir cache line üzərindəki müstəqil dəyişənlərin lazımsız cross-core etibarsızlaşdırmaya səbəb olması."
    ],
    [
      "Struct padding",
      "Hər sahəni öz təbii sərhədinə hizalayan, kompilyator tərəfindən əlavə edilən doldurucu baytlar."
    ]
  ],
  "m11": [
    [
      "Pipeline",
      "Üst-üstə düşən təlimat mərhələləri (fetch/decode/execute/…) belə ki, dövr başına ~1 təlimat retire olunur."
    ],
    [
      "Branch predictor",
      "Pipeline heç vaxt dayanmasın deyə bir branch-in nəticəsini təxmin edən hardware."
    ],
    [
      "Misprediction cəzası",
      "Yanlış təxmindən sonra boşaltma və yenidən doldurmaya sərf edilən ~15-20 itirilmiş dövr."
    ],
    [
      "Spekulyativ icra",
      "Branch həqiqətən həll olunmazdan əvvəl proqnozlaşdırılan yol boyu təlimatları icra etmək."
    ],
    [
      "Sırasız icra (out-of-order execution) / ILP",
      "Biri yavaş bir nəticəni gözləyərkən müstəqil təlimatları qabaqcadan işlətmək."
    ],
    [
      "Budaqsız kod (branchless code)",
      "Misprediction ediləcək branch olmasın deyə data-ya bağlı bir if-i arifmetika ilə əvəz etmək."
    ]
  ],
  "m12": [
    [
      "G-M-P",
      "Go-nun planlaşdırma modeli: Goroutine, (OS thread-i) Machine, (loji) Processor."
    ],
    [
      "Work stealing",
      "Boş bir P məşğul bir P-nin yerli run queue-sundan goroutine-lərin yarısını götürür."
    ],
    [
      "Netpoller",
      "Bloklanan I/O-da goroutine-ləri pulsuz park edən OS hadisə mexanizmi (epoll/kqueue/IOCP)."
    ],
    [
      "Syscall handoff",
      "Bloklanmış bir M-in P-sini ayırıb başqa bir M-ə vermək ki, digər goroutine-lər işləməyə davam etsin."
    ],
    [
      "Asinxron preemption",
      "Go 1.14-dən bəri sysmon-un çox uzun işləyən bir goroutine-i siqnalla kəsməsi."
    ],
    [
      "sysmon",
      "Öz P-si olmayan, runtime-ın fon monitoru thread-i."
    ]
  ],
  "m6": [
    [
      "gRPC",
      "HTTP/2 üzərində Protobuf mesajları daşıyan RPC framework-ü."
    ],
    [
      "Protobuf",
      "Yığcam, sxemlə təyin olunan binar serializasiya."
    ],
    [
      "ML-KEM",
      "NIST-in postkvant açar-inkapsulyasiya mexanizmi (qəfəs-əsaslı)."
    ],
    [
      "Hibrid KEM",
      "Klassik + postkvant birləşməsi; hər İKİSİ sındırılmadıqca təhlükəsizdir."
    ],
    [
      "Harvest-now-decrypt-later",
      "Bu gün şifrmətni gələcək kvant kompüteri ilə deşifrə etmək üçün yazmaq."
    ],
    [
      "Sahə nömrəsi",
      "Sahəni identifikasiya edən Protobuf teqi - ləğv edilmişi heç vaxt yenidən istifadə etməyin."
    ]
  ],
  "m9": [
    [
      "GOMAXPROCS",
      "Neçə ƏS thread-inin eyni anda Go kodu işlədə biləcəyi."
    ],
    [
      "cgroup",
      "Konteynerə tətbiq olunan Linux nüvəsi resurs limitləri."
    ],
    [
      "Distroless / scratch",
      "Az və ya heç ƏS-i olmayan minimal baza image-lər."
    ],
    [
      "go fix / //go:fix",
      "Repozitoriya boyu köhnəlmiş çağırış yerlərini avtomatik yenidən yazan alət dəsti."
    ],
    [
      "ADR",
      "Architecture Decision Record - qərarın niyə verildiyi haqqında qısa qeyd."
    ],
    [
      "Readiness probe",
      "Yük balanslaşdırıcıya pod-un trafik qəbul edə biləcəyini deyən sağlamlıq yoxlaması."
    ]
  ],
  "m14": [
    [
      "Strukturlaşdırılmış loglama",
      "İnterpolyasiya edilmiş mətn sətirləri əvəzinə açar/dəyər log qeydləri (məsələn slog vasitəsilə)."
    ],
    [
      "RED metrikaları",
      "Rate, Errors, Duration - sorğu-əsaslı servisi instrumentasiya etmək üçün çərçivə."
    ],
    [
      "USE metrikaları",
      "Utilization, Saturation, Errors - resursu instrumentasiya etmək üçün çərçivə."
    ],
    [
      "Span",
      "Trace-də başlanğıcı, müddəti və atributları olan bir vaxtlı əməliyyat."
    ],
    [
      "Context ötürülməsi",
      "Trace/span ID-nin context.Context və gedən sorğu başlıqları vasitəsilə daşınması."
    ],
    [
      "Kardinallıq",
      "Metrikanın yaratdığı fərqli etiket kombinasiyalarının sayı; hüdudsuz etiketlər onu partladır."
    ]
  ],
  "m15": [
    [
      "Deadline",
      "context.WithTimeout ilə bağlanmış, çağırışın nə qədər işləyə biləcəyinə hədd."
    ],
    [
      "Eksponensial backoff",
      "Ardıcıl retry-lər arasındakı gözləmə müddətinin artırılması."
    ],
    [
      "Jitter",
      "Bir çox müştərinin sinxron retry etməməsi üçün retry gecikmələrinin rastgələləşdirilməsi."
    ],
    [
      "Circuit breaker",
      "Məlum-çökmüş asılılığa qarşı sürətlə uğursuz olan closed/open/half-open vəziyyət maşını."
    ],
    [
      "Load shedding",
      "Doyma altında artıq sorğuları əbədi növbəyə qoymaq əvəzinə rədd etmək."
    ],
    [
      "Backpressure",
      "Hüdudsuz buferləmə əvəzinə hüdudlu növbə vasitəsilə yavaşlığı istehsalçıya geri ötürmək."
    ]
  ],
  "m16": [
    [
      "Cache-aside",
      "Əvvəlcə keşi yoxlayın; miss-də real mənbəni oxuyun və qaytarmazdan əvvəl keşi doldurun."
    ],
    [
      "TTL",
      "Time-to-live - açığın Redis tərəfindən avtomatik bitirilməzdən əvvəl nə qədər yaşadığı."
    ],
    [
      "redis.Nil",
      "go-redis-in mövcud olmayan açar üçün GET-də qaytardığı sentinel xəta - bu bir keş miss-idir, uğursuzluq yox."
    ],
    [
      "SETNX",
      "'Mövcud olmadıqda təyin et' - paylanmış lock-un tikinti bloku olan atomik yalnız-yaratma yazısı."
    ],
    [
      "INCR",
      "Yarışsız sayğac və ya rate limiter-in tikinti bloku olan atomik artır-və-qaytar."
    ],
    [
      "Cache stampede",
      "Kütləvi bitmədən (və ya bir isti açarın bitməsindən) qaynaqlanan eyni-anlı miss-lər burğusunun real verilənlər bazasına birdən çırpması."
    ]
  ],
  "m20": [
    [
      "Lider seçimi",
      "Klasterdəki bir node-un müəyyən term üçün yeni yazıları qəbul edib sıralamağa icazəli yeganə node kimi seçilməsi prosesi."
    ],
    [
      "Term / epoxa",
      "Monoton artan sayğac, bir liderin hakimiyyətini identifikasiya edir; daha yüksək term həmişə qalib gəlir və hər node-a köhnəlmiş liderdən imtina etməyi bildirir."
    ],
    [
      "Split brain",
      "Adətən şəbəkə bölünməsindən sonra iki node-un eyni anda özünü lider hesab etməsi - məhz kvorum-əsaslı seçimin qarşısını almaq üçün mövcud olduğu uğursuzluq rejimi."
    ],
    [
      "Jurnal replikasiyası",
      "Liderin sıralı əmrlər ardıcıllığının follower node-lara kopyalanması ki, hər replika sonda eyni əməliyyatları eyni sırada tətbiq etsin."
    ],
    [
      "Kvorum",
      "Yazının və ya seçimin etibarlı sayılmazdan əvvəl razılaşmalı olduğu minimal node sayı (əksəriyyət, N/2+1)."
    ],
    [
      "Consistent hashing",
      "Həm node-ları, həm açarları üzük üzərinə xəritələyən hash sxemi ki, bir node əlavə etmək və ya çıxarmaq bütün keyspace-i yox, yalnız ona yaxın açarları yenidən xəritələsin."
    ]
  ],
  "m18": [
    [
      "SLI",
      "İstifadəçiyə görünən etibarlılığın ölçülən göstəricisi, məsələn uğurlu sorğular və ya hədd altında gecikmə."
    ],
    [
      "SLO",
      "Bir pəncərə üzrə SLI üçün hədəf, məsələn 30 gün ərzində köçürmələrin 99.9%-inin uğurlu olması."
    ],
    [
      "Error budget",
      "SLO-dan irəli gələn icazə verilən uğursuzluq; onu tez xərcləmək əməliyyat hərəkəti tələb edir."
    ],
    [
      "Burn rate",
      "Servisin error budget-ini icazə verilən templə müqayisədə nə qədər sürətlə xərclədiyi."
    ],
    [
      "Toil",
      "Servislə birlikdə böyüyən əl ilə, təkrarlanan, avtomatlaşdırıla bilən əməliyyat işi."
    ],
    [
      "Postmortem / RCA",
      "Təsirin, timeline-ın, töhfə verən amillərin və sahibli follow-up hərəkətlərin günahsız təhlili."
    ]
  ]
};

const ASSIGNMENTS_AZ = {
  "m19": [
    {
      "type": "mcq",
      "prompt": "b := append(a, x) a-nın tutumunu keçdi. İndi nə doğrudur?",
      "options": [
        "a və b bir backing array-i paylaşır",
        "b yeni bir array-ə işarə edir; a-ya yazılar artıq b-yə təsir etmir",
        "a etibarsızlaşdı və istifadə edilməməlidir",
        "append həmişə kopyalayır, tutumdan asılı olmayaraq"
      ],
      "answer": 1,
      "explain": "Böyümə YENİ bir backing array ayırır və kopyalayır - köhnə array (və a) toxunulmaz qalır, amma ayrılır. Tutum daxilində olsaydılar, hələ də paylaşacaqdılar."
    },
    {
      "type": "blank",
      "prompt": "Slice-da saxlanılan binar heap-də i indeksinin valideyni ____ indeksindədir (tam ədəd bölməsi):",
      "code": "p := (i - 1) / ____",
      "accept": [
        "2"
      ],
      "explain": "(i-1)/2 - 2i+1 və 2i+2-dəki övladların əksi. Bu indeks riyaziyyatı bir ağacı slice-da saxlamağın bütün hiyləsidir."
    },
    {
      "type": "predict",
      "prompt": "BFS ÇƏKİSİZ bir qrafda A node-undan işə düşür və T node-una ilk dəfə dərinlik 3-də çatır. Daha qısa hər hansı A→T yolu ola bilərmi? (bəli/xeyr)",
      "accept": [
        "xeyr"
      ],
      "explain": "BFS ciddi şəkildə səviyyə-səviyyə araşdırır: hər hansı dərinlik-3 node-dan əvvəl bütün dərinlik-1 və dərinlik-2 node-ları ziyarət olunub, ona görə daha qısa bir yol T-ni daha əvvəl tapardı."
    }
  ],
  "f1": [
    {
      "type": "mcq",
      "prompt": "Mark mərhələsinin sonunda, AĞ bir obyekt nəyi təmsil edir?",
      "options": [
        "Əlçatandır və tam skan olunub",
        "Əlçatandır amma hələ skan olunmayıb",
        "Əlçatmazdır - süpürüləcək",
        "Yaddaşda əbədi sancılıb"
      ],
      "answer": 2,
      "explain": "Ağ = root-lardan heç vaxt çatılmayıb, ona görə zibildir və süpürülür. Boz = əlçatandır amma hələ skan olunmayıb; qara = skan olunub."
    },
    {
      "type": "blank",
      "prompt": "Runtime-da 512 MiB yumşaq yaddaş limiti qoyun. Boşluğu doldurun:",
      "code": "debug.____(512 << 20)",
      "accept": [
        "SetMemoryLimit"
      ],
      "explain": "debug.SetMemoryLimit(512<<20) kodda GOMEMLIMIT-i qoyur; heap tavana yaxınlaşdıqca GC daha aqressiv olur."
    },
    {
      "type": "code",
      "prompt": "runtime/debug istifadə edərək hər GC-dən əvvəl heap-in ~2× böyüməsinə icazə verən bir sətir yazın - yəni default GOGC-ni ikiqat artırın.",
      "starter": "// runtime/debug is already imported\n",
      "checks": [
        {
          "has": "SetGCPercent",
          "msg": "Call debug.SetGCPercent"
        },
        {
          "has": "200",
          "msg": "Pass 200 (double the default of 100)"
        }
      ],
      "explain": "debug.SetGCPercent(200) GOGC=200-ün proqram daxilindəki formasıdır: daha az collection, daha çox yaddaş istifadəsi."
    }
  ],
  "f2": [
    {
      "type": "mcq",
      "prompt": "Ən çox CPU yandıran funksiyaları tapmaq istəyirsiniz. Hansı profili toplayırsınız?",
      "options": [
        "goroutine",
        "cpu",
        "heap",
        "mutex"
      ],
      "answer": 1,
      "explain": "CPU profili işləyən stack-i sample edərək vaxtın harada xərcləndiyini göstərir. heap = yaddaş, goroutine = sızmalar, mutex = lock ziddiyyəti."
    },
    {
      "type": "blank",
      "prompt": "/debug/pprof endpoint-lərini bu package-i yan-effekti üçün import edərək açın:",
      "code": "import _ \"____\"",
      "accept": [
        "net/http/pprof"
      ],
      "explain": "net/http/pprof-un boş importu debug handler-lərini default mux-da qeydə alır."
    },
    {
      "type": "code",
      "prompt": "cpu.out üçün interaktiv flame-graph web UI-ni 8080 portunda açan əmri yazın.",
      "starter": "",
      "checks": [
        {
          "has": "go tool pprof",
          "msg": "Use go tool pprof"
        },
        {
          "has": "-http",
          "msg": "Use the -http web UI flag"
        },
        {
          "has": "cpu.out",
          "msg": "Point it at cpu.out"
        }
      ],
      "explain": "go tool pprof -http=:8080 cpu.out - flame graph-ı görməyin ən sürətli yolu."
    }
  ],
  "f3": [
    {
      "type": "mcq",
      "prompt": "Hansı metod uğursuzluğu bildirir, amma testin qalan hissəsinin işləməsinə icazə verir?",
      "options": [
        "t.Fatal",
        "t.Error",
        "t.Skip",
        "t.Log"
      ],
      "answer": 1,
      "explain": "t.Error/t.Errorf uğursuzluğu qeyd edir və davam edir; t.Fatal/t.Fatalf isə cari testi dərhal dayandırır."
    },
    {
      "type": "blank",
      "prompt": "Hər cədvəl halını adlandırılmış, izolə edilmiş subtest kimi işlədin. Boşluğu doldurun:",
      "code": "t.____(c.name, func(t *testing.T) { /* ... */ })",
      "accept": [
        "Run"
      ],
      "explain": "t.Run(name, fn) bir subtest yaradır - uğursuzluqlar dəqiq hal adını göstərir."
    },
    {
      "type": "code",
      "prompt": "Bütün testləri race detector və coverage ilə işlədən gündəlik əmri yazın.",
      "starter": "",
      "checks": [
        {
          "has": "go test",
          "msg": "Use go test"
        },
        {
          "has": "-race",
          "msg": "Enable the race detector with -race"
        },
        {
          "has": "-cover",
          "msg": "Enable coverage with -cover"
        }
      ],
      "explain": "go test -race -cover ./... - onu daim işlədin."
    }
  ],
  "f4": [
    {
      "type": "mcq",
      "prompt": "Buferlənməmiş channel üzərində göndərmə nə vaxta qədər bloklanır:",
      "options": [
        "bufer dolana qədər",
        "alıcı qəbul etməyə hazır olana qədər",
        "channel bağlanana qədər",
        "GC işə düşənə qədər"
      ],
      "answer": 1,
      "explain": "Buferlənməmiş channel-lar görüş nöqtəsidir: göndərmə yalnız alıcı hazır olduqda tamamlanır. Buferlənmiş channel-lar isə yalnız dolduqda bloklanır."
    },
    {
      "type": "predict",
      "prompt": "Bu nə çap edir?",
      "code": "ch := make(chan int, 2)\nch <- 1\nch <- 2\nfmt.Println(len(ch), cap(ch))",
      "accept": [
        "2 2"
      ],
      "explain": "İki dəyər (len 2) tutumu 2 olan bir channel-da buferlənir → çap olunur: 2 2."
    },
    {
      "type": "code",
      "prompt": "`jobs` channel-ı üzərində range edən 3 worker goroutine başladın.",
      "starter": "jobs := make(chan int)\n// start 3 workers here\n",
      "checks": [
        {
          "has": "go func",
          "msg": "Spawn goroutines with go func"
        },
        {
          "has": "range jobs",
          "msg": "Each worker should range over jobs"
        }
      ],
      "explain": "for w := 0; w < 3; w++ { go func() { for j := range jobs { process(j) } }() } - klassik fan-out."
    }
  ],
  "f5": [
    {
      "type": "mcq",
      "prompt": "errors.Is / errors.As-in sonradan onu unwrap edə bilməsi üçün hansı fmt işarəsi bir xətanı bükür?",
      "options": [
        "%v",
        "%w",
        "%s",
        "%e"
      ],
      "answer": 1,
      "explain": "%w bükür və zənciri qoruyur; %v/%s isə yalnız mətni formatlayır və səbəbi itirir."
    },
    {
      "type": "predict",
      "prompt": "Bu nə çap edir?",
      "code": "var ErrNF = errors.New(\"not found\")\ne := fmt.Errorf(\"load: %w\", ErrNF)\nfmt.Println(errors.Is(e, ErrNF))",
      "accept": [
        "true"
      ],
      "explain": "%w ErrNF-i bükdüyü üçün, errors.Is onu zəncirdə tapır → true."
    },
    {
      "type": "blank",
      "prompt": "Timeout context-inin resurslarını həmişə buraxın. Boşluğu doldurun:",
      "code": "ctx, cancel := context.WithTimeout(ctx, 3*time.Second)\ndefer ____()",
      "accept": [
        "cancel"
      ],
      "explain": "defer cancel() - timeout heç vaxt işə düşməsə belə, taymeri buraxır və övladlara siqnal verir, bu tələb olunur."
    }
  ],
  "m1": [
    {
      "type": "mcq",
      "prompt": "İki pattern uyğun gələ biləndə, Go 1.22+ ServeMux hansını seçir:",
      "options": [
        "ilk qeydiyyatdan keçəni",
        "ən uzun (ən spesifik) uyğun pattern-i",
        "əlifba sırasını",
        "təsadüfi birini"
      ],
      "answer": 1,
      "explain": "Üstünlük ən-spesifik-qazanır prinsipidir, ona görə /ledger/{id}/audit /ledger/{id}-ni üstələyir."
    },
    {
      "type": "blank",
      "prompt": "Pattern tərəfindən tutulan {id} wildcard-ı oxuyun. Boşluğu doldurun:",
      "code": "id := r.____(\"id\")",
      "accept": [
        "PathValue"
      ],
      "explain": "r.PathValue(\"id\") wildcard seqmentini qaytarır - nə regexp, nə allocation."
    },
    {
      "type": "code",
      "prompt": "mux-da GET /api/v1/ledger/{id} üçün getEntry-i qeydiyyatdan keçirin - üçüncü tərəf router yoxdur.",
      "starter": "mux := http.NewServeMux()\n",
      "checks": [
        {
          "has": "HandleFunc",
          "msg": "mux.HandleFunc istifadə edin"
        },
        {
          "has": "GET /api/v1/ledger/{id}",
          "msg": "Metod + path uyğunlaşdırın: GET /api/v1/ledger/{id}"
        },
        {
          "not": "gin",
          "msg": "gin import-u yoxdur"
        },
        {
          "not": "chi",
          "msg": "chi import-u yoxdur"
        }
      ],
      "explain": "mux.HandleFunc(\"GET /api/v1/ledger/{id}\", getEntry)"
    }
  ],
  "m2": [
    {
      "type": "mcq",
      "prompt": "Swiss-Table map lookup-ları əsasən niyə daha sürətlidir:",
      "options": [
        "key-i hash etməkdən qaçırlar",
        "8 slotun control bayt-larını bir cache line daxilində paralel yoxlayırlar",
        "yazıları sıralı saxlayırlar",
        "heç vaxt resize olunmurlar"
      ],
      "answer": 1,
      "explain": "8 control bayt-dan ibarət qrup bir cache line-a sığır və SIMD-tərzi müqayisə edilir, ona görə lookup adətən bir cache line-a toxunur."
    },
    {
      "type": "blank",
      "prompt": "Bir ifadədə 25-i göstərən *int64 ayırın (Go-nun new(expr)). Boşluğu doldurun:",
      "code": "fee := ____(int64(25))",
      "accept": [
        "new"
      ],
      "explain": "new(int64(25)) birbaşa bir *int64 ayırır və qaytarır - opsional sahələr üçün əlverişlidir."
    },
    {
      "type": "code",
      "prompt": "Kompilyatorun escape-analysis qərarlarını çap edən `go build` komandasını yazın.",
      "starter": "",
      "checks": [
        {
          "has": "go build",
          "msg": "go build istifadə edin"
        },
        {
          "has": "-gcflags",
          "msg": "-gcflags ilə kompilyator flaq-larını ötürün"
        },
        {
          "has": "-m",
          "msg": "-m ilə escape analysis çıxışını aktivləşdirin"
        }
      ],
      "explain": "go build -gcflags='-m' ./... - 'does not escape' axtarın."
    }
  ],
  "m4": [
    {
      "type": "mcq",
      "prompt": "Synctest qabarcığı daxilində time.Sleep(5 * time.Second):",
      "options": [
        "həqiqətən 5 saniyə bloklayır",
        "bütün goroutine-lər bloklandıqdan sonra saxta saatı ani irəli aparır",
        "tamamilə görməzdən gəlinir",
        "panik edir"
      ],
      "answer": 1,
      "explain": "Qabarcıq saatı virtualdır: hər goroutine bloklandıqda zaman növbəti timer-ə ani və deterministik şəkildə sıçrayır."
    },
    {
      "type": "blank",
      "prompt": "Testi qabarcıqdakı hər digər goroutine sancılana qədər bloklayın. Boşluğu doldurun:",
      "code": "synctest.____()",
      "accept": [
        "Wait"
      ],
      "explain": "synctest.Wait() 'hər kəs davamlı bloklanıb' üçün dəqiq baryerdir - 'yat və uman'-ı əvəz edir."
    },
    {
      "type": "code",
      "prompt": "Müasir benchmark döngüsünün başlıq sətrini yazın (b.N mühasibatlığı yoxdur).",
      "starter": "func BenchmarkValidate(b *testing.B) {\n    // your loop here\n}",
      "checks": [
        {
          "has": "b.Loop()",
          "msg": "for b.Loop() istifadə edin"
        }
      ],
      "explain": "for b.Loop() { ... } - dəyərləri canlı saxlayır və setup-u bir dəfə işlədir."
    }
  ],
  "m5": [
    {
      "type": "mcq",
      "prompt": "sqlc-nin əsas faydası SQL səhvlərini haradan hara köçürməsidir:",
      "options": [
        "kompilyasiya zamanından runtime-a",
        "runtime-dan kompilyasiya zamanına",
        "müştəridən serverə",
        "yalnız loglara"
      ],
      "answer": 1,
      "explain": "sqlc SQL-inizdən + sxemdən tiplənmiş Go yaradır, ona görə səhv sütun və ya tip kod-yaratma zamanı uğursuz olur, istehsalatda yox."
    },
    {
      "type": "mcq",
      "prompt": "SQLSTATE '40001' (serialization_failure) olan Postgres xətası necə idarə edilməlidir:",
      "options": [
        "görməzdən gəlinməli",
        "yenidən cəhd edilməli (tranzaksiyanı yenidən işlətmək)",
        "həmişə HTTP 500 kimi qaytarılmalı",
        "loglanıb atılmalı"
      ],
      "answer": 1,
      "explain": "40001 tranzaksiyanın serializasiya yarışını uduzduğunu bildirir; düzgün cavab onu yenidən cəhd etməkdir."
    },
    {
      "type": "blank",
      "prompt": "Tiplənmiş *pgconn.PgError-u var-and-assert rəqsi olmadan uyğunlaşdırın (Go 1.26). Boşluğu doldurun:",
      "code": "if pgErr, ok := errors.____[*pgconn.PgError](err); ok {",
      "accept": [
        "AsType"
      ],
      "explain": "errors.AsType[*pgconn.PgError](err) generic, allocation-free errors.As-dır."
    }
  ],
  "m17": [
    {
      "type": "mcq",
      "prompt": "Hot cədvəldə, istehsalat trafiki üçün indeks əlavə etməyin daha təhlükəsiz defolt yolu:",
      "options": [
        "sorğu formasını təsdiqlədikdən sonra CREATE INDEX CONCURRENTLY",
        "pik trafik zamanı uzun tranzaksiya daxilində CREATE INDEX",
        "üç əlaqəsiz tək-sütunlu indeks əlavə etmək",
        "indekslər həmişə istifadə olunduğu üçün EXPLAIN-i keçmək"
      ],
      "answer": 0,
      "explain": "CONCURRENTLY indeks qurularkən normal yazıları bloklamağın qarşısını alır. Yenə də sorğu formasını doğrulayıb EXPLAIN ilə təsdiqləyirsiniz."
    },
    {
      "type": "mcq",
      "prompt": "`WHERE account_id = $1 ORDER BY posted_at DESC LIMIT 50` üçün adətən ən yaxşı uyğun indeks:",
      "options": [
        "(posted_at)",
        "(account_id, posted_at DESC)",
        "(amount_cents)",
        "(direction, amount_cents)"
      ],
      "answer": 1,
      "explain": "Bərabərlik filtri əvvəl gəlir, sonra sıralama/səhifələmə açarı. Bu Postgres-ə bir hesabın son sətirlərinə indeks sırası ilə keçməyə imkan verir."
    },
    {
      "type": "blank",
      "prompt": "Real icranı və buffer fəaliyyətini göstərən Postgres opsiyasını doldurun:",
      "code": "EXPLAIN (ANALYZE, ____) SELECT ...",
      "accept": [
        "BUFFERS"
      ],
      "explain": "BUFFERS shared/local/temp buferlərdən nə qədər iş gəldiyini göstərir, bu tez-tez yaxşı plan ilə gizli IO problemi arasındakı fərqdir."
    },
    {
      "type": "code",
      "prompt": "Köçürmə yenidən-cəhdlərini unikal açarla idempotent edən SQL əlavə edin.",
      "starter": "CREATE TABLE transfers (\n    id uuid PRIMARY KEY,\n    idempotency_key text NOT NULL\n);\n",
      "checks": [
        {
          "has": "UNIQUE",
          "msg": "İdempotensiya açarını unikal edin"
        },
        {
          "has": "idempotency_key",
          "msg": "idempotency_key sütununu istifadə edin"
        }
      ],
      "explain": "idempotency_key üzərində UNIQUE constraint təkrar sorğunun dublikat köçürmə yaratmaq əvəzinə orijinal nəticəni qaytarmasına imkan verir."
    },
    {
      "type": "mcq",
      "prompt": "Uzun müddət `idle in transaction` qalan sessiya əsasən niyə təhlükəlidir:",
      "options": [
        "köhnə sətir versiyalarını sancır və vacuum təmizlənməsinin qarşısını ala bilər",
        "SELECT-i qeyri-mümkün edir",
        "WAL-i söndürür",
        "avtomatik olaraq indeksləri atır"
      ],
      "answer": 0,
      "explain": "Köhnə tranzaksiyaların saxladığı MVCC snapshot-ları ölü tuple-ları görünən saxlaya bilər, ona görə vacuum onları təmizləyə bilmir və bloat artır."
    }
  ],
  "m13": [
    {
      "type": "mcq",
      "prompt": "atomic.Int64 nə vaxt kifayət etmir (mutex lazımdır):",
      "options": [
        "sadəcə tək sayğaca ehtiyacınız olduqda",
        "invariant birgə uyğun qalmalı iki və ya daha çox əlaqəli sahəyə yayıldıqda",
        "lock-free yeniləmələrə ehtiyacınız olduqda",
        "tək pointer dəyişdirdikdə"
      ],
      "answer": 1,
      "explain": "Atomiklər dəqiq bir sözü qoruyur; korrektlik iki sahənin razılaşmasından asılı olduğu an, hər ikisi ətrafında mutex lazımdır."
    },
    {
      "type": "mcq",
      "prompt": "Kanallar əsasən nə üçün düzgün alətdir:",
      "options": [
        "xam sürət üçün hər mutex-i əvəz etmək",
        "datanın mülkiyyətini ötürmək və goroutine-ləri koordinasiya etmək",
        "-race işlətmək ehtiyacından qaçmaq",
        "tək paylaşılan sayğacı qorumaq"
      ],
      "answer": 1,
      "explain": "Kanallar datanı (və onun mülkiyyətini) goroutine-lər arasında ötürməkdə parlayır - pipeline-lar, fan-out/fan-in, siqnallaşdırma - sadə vəziyyət üçün daha sürətli kilid kimi yox."
    },
    {
      "type": "blank",
      "prompt": "Testləri data-race detektoru aktiv olaraq işlədin. Boşluğu doldurun:",
      "code": "go test -____ ./...",
      "accept": [
        "race"
      ],
      "explain": "go test -race yaddaş girişlərini instrumentləşdirir və hər hansı sinxronlaşdırılmamış paralel girişi raport edir."
    }
  ],
  "m3": [
    {
      "type": "mcq",
      "prompt": "Niyə bir runtime.AddCleanup closure-u təmizlədiyi obyekti capture ETMƏMƏLİDİR?",
      "options": [
        "çox erkən işə düşərdi",
        "obyekti əbədi əlçatan saxlayır - qaçmağa çalışdığın həmin sızma",
        "cleanup-lar arqument qəbul edə bilməz",
        "kompilyasiya zamanı panic edir"
      ],
      "answer": 1,
      "explain": "Obyekti capture etmək onu əlçatan edir, buna görə heç vaxt yığılmır və cleanup heç vaxt işə düşmür. Bunun əvəzinə ham handle-i (fd) dəyər kimi capture et."
    },
    {
      "type": "blank",
      "prompt": "Təkrarlanan bir sətri paylaşılan, müqayisə edilə bilən handle-ə intern et. Boşluğu doldur:",
      "code": "usd := unique.____(\"USD\")",
      "accept": [
        "Make"
      ],
      "explain": "unique.Make(\"USD\") bir Handle[string] qaytarır; bərabər dəyərlər bir nüsxəni paylaşır və işarəçi ilə müqayisə olunur."
    },
    {
      "type": "mcq",
      "prompt": "runtime.SetFinalizer ilə müqayisədə runtime.AddCleanup:",
      "options": [
        "obyekti dirildə bilər",
        "bir dəfə işə düşür və obyekti heç vaxt dirildmir",
        "yığılmanı tam bir GC dövrü qədər gecikdirir",
        "istifadədən çıxarılıb"
      ],
      "answer": 1,
      "explain": "AddCleanup obyekt həqiqətən əlçatmaz olduqdan sonra dirilmə olmadan tam bir dəfə işə düşür - finalizer-lərdən qəti şəkildə üstündür."
    }
  ],
  "m7": [
    {
      "type": "mcq",
      "prompt": "FlightRecorder həmişə-aktiv saxlamaq üçün ucuzdur, çünki o:",
      "options": [
        "hər hadisəni birbaşa diskə yazır",
        "yaddaşda sərhədli bir ring buffer saxlayır, yalnız tələb olunanda yazılır",
        "gündə bir dəfə nümunə götürür",
        "işlədikdə GC-ni deaktiv edir"
      ],
      "answer": 1,
      "explain": "Yaddaşda kiçik bir dövrləyici pəncərə saxlayır; yalnız maraqlı bir şey baş verəndə bir trace-i serialize etmək üçün pul ödəyirsən."
    },
    {
      "type": "mcq",
      "prompt": "Mümkün göndərəni olmadan <-ch üzərində əbədi park edilmiş bir goroutine:",
      "options": [
        "tam-proqram deadlock-udur",
        "goroutine sızmasıdır",
        "kompilyasiya xətasıdır",
        "data yarışıdır"
      ],
      "answer": 1,
      "explain": "Digər goroutine-lər işləməyə davam edir, amma bu heç vaxt çıxmır və yaddaşı heç vaxt azad olunmur - analizatorun izləyə biləcəyi bir sızma."
    },
    {
      "type": "blank",
      "prompt": "Bütün goroutine stack-lərini bir fayla dump et. Boşluğu doldur:",
      "code": "pprof.Lookup(\"____\").WriteTo(f, 2)",
      "accept": [
        "goroutine"
      ],
      "explain": "pprof.Lookup(\"goroutine\").WriteTo(f, 2) hər goroutine-in stack-ini yazır (debug səviyyəsi 2)."
    }
  ],
  "m8": [
    {
      "type": "mcq",
      "prompt": "Niyə bir simd/archsimd dövrünün yanında skalyar fallback saxlamalısan?",
      "options": [
        "skalyar yol daha sürətlidir",
        "hər CPU-da/arxitekturada vektor təlimatları yoxdur",
        "yaddaşa qənaət etmək üçün",
        "sadəcə üslub üçün"
      ],
      "answer": 1,
      "explain": "Vektor intrinsic-ləri arxitekturaya xasdır; skalyar bir qalıq/fallback yolu binarı hər yerdə düzgün saxlayır (və zolaq-sayının-qatı-olmayan quyruğu idarə edir)."
    },
    {
      "type": "mcq",
      "prompt": "runtime/secret bir açarı yaddaşda necə qoruyur?",
      "options": [
        "onu yerində şifrələyərək",
        "istifadədən sonra buffer-i sıfırlayaraq və köçürülə bilən heap-dən kənar saxlayaraq",
        "yoxlamaq üçün onu çap edərək",
        "onu GC-yə verərək"
      ],
      "answer": 1,
      "explain": "Bu, məruzə qalma pəncərəsini minimuma endirir: açar Destroy-da təmizlənir və heç vaxt köçürülə bilən heap ətrafında surətlənmir (buna görə core dump-larda qalmır)."
    },
    {
      "type": "blank",
      "prompt": "Build zamanı Green Tea GC-ni aktiv et. Boşluğu doldur:",
      "code": "GOEXPERIMENT=____ go build ./...",
      "accept": [
        "greenteagc"
      ],
      "explain": "GOEXPERIMENT=greenteagc span-əsaslı collector-u aktiv edir - kod dəyişikliyi tələb olunmur."
    }
  ],
  "m10": [
    {
      "type": "mcq",
      "prompt": "L1 keşdən oxumaq əsas yaddaşla (RAM) müqayisədə təxminən:",
      "options": [
        "~2× sürətlidir",
        "~10× sürətlidir",
        "~100× sürətlidir",
        "~10,000× sürətlidir"
      ],
      "answer": 2,
      "explain": "L1 ~1 ns, RAM ~100 ns-dir - təxminən iki tərtib fərq, keş-şüurlu kodun arxasındakı mərkəzi fakt."
    },
    {
      "type": "mcq",
      "prompt": "False sharing nə zaman baş verir:",
      "options": [
        "iki goroutine bir mutex paylaşır",
        "iki müstəqil-yazılan dəyişən eyni cache line üzərində oturur",
        "bir slice L3 keşin ölçüsünü aşır",
        "GC kodunla eyni vaxtda işləyir"
      ],
      "answer": 1,
      "explain": "Dəyişənlər məntiqi olaraq əlaqəsiz olsa da, hər hansı biri yazıldıqda xətt nüvələrin keşləri arasında pinq-ponq oynayır və paralel throughput-u öldürür."
    },
    {
      "type": "blank",
      "prompt": "Bir struct-un padding daxil in-memory ölçüsünü ölç. Boşluğu doldur:",
      "code": "unsafe.____(Bad{})",
      "accept": [
        "Sizeof"
      ],
      "explain": "unsafe.Sizeof kompilyator tərəfindən əlavə edilmiş alignment padding-i daxil olmaqla bayt ölçüsünü bildirir."
    }
  ],
  "m11": [
    {
      "type": "mcq",
      "prompt": "Müasir bir nüvədə bir branch misprediction təxminən neçəyə başa gəlir:",
      "options": [
        "0 dövr - pulsuzdur",
        "~1 dövr",
        "pipeline-ı boşaltmaq və yenidən doldurmaq üçün ~15-20 dövr",
        "~10,000 dövr"
      ],
      "answer": 2,
      "explain": "Yanlış yol boyu spekulyativ icra edilmiş hər təlimat atılır və pipeline düzgün hədəfdən yenidən doldurulmalıdır."
    },
    {
      "type": "mcq",
      "prompt": "Niyə yalnız bir hədddən yuxarı dəyərləri cəmləmək SIRALANMIŞ datada qarışdırılmış eyni datadan daha sürətli işləyir?",
      "options": [
        "sıralanmış data keşdə daha yaxşı sıxılır",
        "branch predictor doğru/yalanın uzun proqnozlaşdırıla bilən silsilələrini yaxalayır",
        "CPU avtomatik olaraq daha sürətli işləməyə başlayır",
        "qarışdırılmış data daha çox cache miss yaradır, branch-lə əlaqəsizdir"
      ],
      "answer": 1,
      "explain": "Sıralanmış data if-i predictor-un dərhal öyrəndiyi uzun silsilələrə çevirir; qarışdırılmış data isə təsadüfi çevrilir və daim yanlış təxmin edir - eyni təlimatlar, çox fərqli divar vaxtı."
    },
    {
      "type": "blank",
      "prompt": "Kompilyatorun hansı bounds check-ləri aradan qaldırdığını araşdır. Boşluğu doldur:",
      "code": "go build -gcflags='-d=ssa/check_bce/debug=____'",
      "accept": [
        "1"
      ],
      "explain": "debug=1 təyin etmək kompilyatorun hansı bounds check-ləri təhlükəsiz sübut edib sildiyini çap etməsini təmin edir."
    }
  ],
  "m12": [
    {
      "type": "mcq",
      "prompt": "G-M-P modelində real paralelliyi məhdudlaşdıran invariant:",
      "options": [
        "#G, GOMAXPROCS-dan az və ya bərabər olmalıdır",
        "Go kodu işlətmək üçün bir M mütləq bir P tutmalıdır",
        "#M həmişə #P-yə bərabərdir",
        "GOMAXPROCS yalnız fiziki nüvələri sayır, heç vaxt loji olanları yox"
      ],
      "answer": 1,
      "explain": "Bir M-in Go kodu icra etmək üçün bir P-ə ehtiyacı olduğu üçün, nə qədər G və ya M olsa da, ən çoxu GOMAXPROCS sayda goroutine həqiqətən paralel işləyir."
    },
    {
      "type": "mcq",
      "prompt": "Bir goroutine data hazır olmadan netpoller-dəstəkli bir socket oxuması üzərində bloklananda:",
      "options": [
        "onun OS thread-i də bloklanır, bir M-i israf edir",
        "goroutine park edilir və onun M-i digər goroutine-ləri işlətmək üçün azad olunur",
        "proqram panic edir",
        "GOMAXPROCS avtomatik olaraq bir artır"
      ],
      "answer": 1,
      "explain": "Netpoller socket-i OS hadisə sistemi ilə qeydiyyatdan keçirir və G-ni park edir; M isə bloklanmaq əvəzinə digər hazır goroutine-ləri işlədir."
    },
    {
      "type": "blank",
      "prompt": "Saniyəlik planlayıcı statistikasını (Ps, Ms, run-queue uzunluqları, steal-lər) çap et. Boşluğu doldur:",
      "code": "GODEBUG=____=1000 ./app",
      "accept": [
        "schedtrace"
      ],
      "explain": "GODEBUG=schedtrace=1000 hər 1000 ms-də planlayıcı daxili məlumatlarını loglayır, aclıq və ya mübahisəni diaqnoz etmək üçün faydalıdır."
    }
  ],
  "m6": [
    {
      "type": "mcq",
      "prompt": "'İndi topla, sonra deşifrə et' hücumları nə ilə məğlub edilir:",
      "options": [
        "daha böyük RSA açarları",
        "hibrid klassik + ML-KEM açar mübadiləsi",
        "TLS-i söndürmək",
        "daha sürətli CPU-lar"
      ],
      "answer": 1,
      "explain": "Hibrid açar mübadiləsi yalnız HƏR İKİSİ - X25519 və ML-KEM - sındırılarsa təhlükəyə düşür, ona görə yazılmış trafik gələcək kvant kompüterinə qarşı davamlı qalır."
    },
    {
      "type": "mcq",
      "prompt": "Protobuf mesajını təkmilləşdirərkən heç vaxt bunu ETMƏMƏLİSİNİZ:",
      "options": [
        "yeni opsional sahə əlavə etmək",
        "ləğv edilmiş sahə nömrəsini yenidən istifadə etmək",
        "tamam yeni mesaj tipi əlavə etmək",
        "Go versiyasını qaldırmaq"
      ],
      "answer": 1,
      "explain": "Sahə nömrəsini yenidən istifadə etmək köhnə və yeni node-ları eyni baytları yanlış oxumağa vadar edir. Ləğv edilmiş nömrələri 'reserved' edin."
    },
    {
      "type": "blank",
      "prompt": "crypto/mlkem ilə ML-KEM-768 dekapsulyasiya açarı yaradın. Boşluğu doldurun:",
      "code": "dk, _ := mlkem.____()",
      "accept": [
        "GenerateKey768"
      ],
      "explain": "mlkem.GenerateKey768() dekapsulyasiya açarı qaytarır; onun EncapsulationKey()-i həmyoldaşlara yayımlanır."
    }
  ],
  "m9": [
    {
      "type": "mcq",
      "prompt": "4 CPU-ya məhdudlaşdırılmış pod-da, Go 1.25 GOMAXPROCS-u nəyə təyin edir:",
      "options": [
        "host-un cəmi nüvə sayına",
        "4-ə - cgroup CPU kvotası",
        "1-ə",
        "128-ə"
      ],
      "answer": 1,
      "explain": "Go 1.25 cgroup limitini oxuyur ki, GOMAXPROCS real kvotaya uyğun gəlsin, CFS throttling-dən qaçınaraq."
    },
    {
      "type": "mcq",
      "prompt": "Möhkəmləndirilmiş distroless / scratch son image göndərmək sizə nə verir:",
      "options": [
        "debug üçün tam shell",
        "kiçik ölçü və çox daha kiçik hücum səthi",
        "daha sürətli kompilyasiya",
        "daha çox CVE"
      ],
      "answer": 1,
      "explain": "Statik Go binary-si ƏS-ə ehtiyac duymur - shell yoxdur, paket meneceri yoxdur, minimal CVE səthi, bir neçə MB."
    },
    {
      "type": "blank",
      "prompt": "//go:fix ilə işarələnmiş köhnəlmiş çağırış yerlərini repozitoriya boyu avtomatik yenidən yazın. Boşluğu doldurun:",
      "code": "go ____ ./...",
      "accept": [
        "fix"
      ],
      "explain": "go fix ./... //go:fix ilə elan edilmiş maşınla-tətbiq-oluna-bilən miqrasiyaları tətbiq edir."
    }
  ],
  "m14": [
    {
      "type": "mcq",
      "prompt": "Çoxservisli sorğuda vaxtın və ya xətanın HARADA baş verdiyini hansı sütun deyir:",
      "options": [
        "loglar",
        "metrikalar",
        "trace-lər",
        "heç biri - debugger lazımdır"
      ],
      "answer": 2,
      "explain": "Trace-in iç-içə span-ları servis sərhədləri boyu vaxtın dəqiq hansı hop-a getdiyini göstərir."
    },
    {
      "type": "mcq",
      "prompt": "Metrika kardinallıq partlayışının ən çox səbəbi:",
      "options": [
        "çox sayda sayğac istifadə etmək",
        "metrikanı istifadəçi ID-si kimi hüdudsuz dəyərlə etiketləmək",
        "sayğac əvəzinə histogram istifadə etmək",
        "metrikaları Prometheus-a ixrac etmək"
      ],
      "answer": 1,
      "explain": "Hər fərqli etiket kombinasiyası öz zaman seriyasına çevrilir; hüdudsuz etiket (user_id, ID-li sorğu yolu) milyonlarla seriya yarada və backend-i çökdürə bilər."
    },
    {
      "type": "blank",
      "prompt": "Go-nun standart strukturlaşdırılmış-loglama paketini import edin. Boşluğu doldurun:",
      "code": "import \"log/____\"",
      "accept": [
        "slog"
      ],
      "explain": "log/slog (Go 1.21-dən standart) interpolyasiya edilmiş sətirlər əvəzinə strukturlaşdırılmış açar/dəyər qeydləri yayımlayır."
    }
  ],
  "m15": [
    {
      "type": "mcq",
      "prompt": "Retry-lər arasında eksponensial backoff-a niyə jitter əlavə edilir:",
      "options": [
        "log çıxışını daha oxunaqlı etmək üçün",
        "servisə eyni anda dəyən sinxron 'thundering herd' retry-lərdən qaçmaq üçün",
        "CPU taktını yavaşlatmaq üçün",
        "race detector-u razı salmaq üçün"
      ],
      "answer": 1,
      "explain": "Jitter olmadan, eyni anda uğursuz olan bir çox müştəri sinxron retry edərək bərpa olan servisi yenidən yıxan sinxron partlayışlar yaradır."
    },
    {
      "type": "mcq",
      "prompt": "Circuit breaker OPEN olduğu müddətdə, bükülü asılılığa çağırışlar:",
      "options": [
        "normal keçir",
        "timeout gözləmədən dərhal uğursuz olur, asılılığa bərpa üçün yer verir",
        "keş istifadə edərək həmişə uğur qazanır",
        "timeout-larını ikiqat edib yenidən cəhd edir"
      ],
      "answer": 1,
      "explain": "Soyuma dövründə sürətlə uğursuz olmaq bütün məqsəddir: bu, artıq çökmüş olduğu məlum olan asılılığa vaxt və yük itirməyin qarşısını alır."
    },
    {
      "type": "blank",
      "prompt": "Token-bucket rate limiter təmin edən paketi import edin. Boşluğu doldurun:",
      "code": "import \"golang.org/x/time/____\"",
      "accept": [
        "rate"
      ],
      "explain": "golang.org/x/time/rate saniyədəki sorğuları məhdudlaşdırmaq üçün istifadə olunan token-bucket limiteri rate.NewLimiter-i təmin edir."
    }
  ],
  "m16": [
    {
      "type": "mcq",
      "prompt": "go-redis-də mövcud olmayan açar üçün GET nə qaytarır:",
      "options": [
        "nil *redis.Client",
        "nil xəta ilə boş sətir",
        "sentinel xəta redis.Nil",
        "panik"
      ],
      "answer": 2,
      "explain": "go-redis çatışmayan açığı sentinel xəta redis.Nil kimi göstərir, onu errors.Is(err, redis.Nil) ilə yoxlayırsınız - bu MƏHZ keş-miss siqnalıdır, xüsusi işlənməli uğursuzluq yox."
    },
    {
      "type": "mcq",
      "prompt": "Niyə `SET key val NX` heç bir əlavə lock olmadan bir çox konkurent çağıran arasında paylanmış lock kimi təhlükəsizdir:",
      "options": [
        "Redis əmri uğur qazanana qədər təkrarlayır",
        "Redis əmrləri tək thread-də bir-bir işlədir, ona görə yoxla-və-yaz bir bölünməz addımdır",
        "Go müştərisi göndərmədən əvvəl öz mutex-ini əlavə edir",
        "NX əmri iki dəfə sürətli işlədir"
      ],
      "answer": 1,
      "explain": "Redis əmrləri bir-bir işlətdiyi üçün, 'açıq boşdurmu' ilə 'onu yaz' arasında ikinci çağıranın sürüşə biləcəyi pəncərə yoxdur - bütün əməliyyat pulsuz atomikdir."
    },
    {
      "type": "blank",
      "prompt": "Bir gediş-gəlişdə sayğacı artıran və yeni dəyərini qaytaran atomik əmri doldurun:",
      "code": "count, err := rdb.____(ctx, \"ratelimit:ip:1.2.3.4\").Result()",
      "accept": [
        "Incr"
      ],
      "explain": "rdb.Incr atomik şəkildə 1 əlavə edir və yeni cəmi qaytarır - iki konkurent çağıran heç vaxt köhnə dəyəri oxuyub bir-birinin artımının üstünə yaza bilməz."
    }
  ],
  "m20": [
    {
      "type": "mcq",
      "prompt": "5-node klasterdə əksəriyyət kvorumu istifadə edərkən, yazının commit hesab edilməsi üçün neçə node onu təsdiqləməlidir:",
      "options": [
        "İstənilən 1 node",
        "3 node (əksəriyyət)",
        "Bütün 5 node",
        "Dəqiq 2 node"
      ],
      "answer": 1,
      "explain": "5-in əksəriyyəti 3-dür - istənilən iki əksəriyyətin ən azı bir node-da üst-üstə düşməsini təmin edən ən kiçik kvorum, klasteri uğursuzluqlar altında konsistent saxlayan da məhz budur."
    },
    {
      "type": "mcq",
      "prompt": "Hər node niyə sabit əvəzinə RASTGƏLƏLƏŞDİRİLMİŞ seçim timeout-u istifadə edir:",
      "options": [
        "CPU qənaət etmək üçün",
        "node-ların hamısının eyni anda vaxtı bitib səsi dəfələrlə bölməməsi üçün",
        "Go-nun time paketi bunu tələb etdiyi üçün",
        "demo animasiyasını daha gözəl göstərmək üçün"
      ],
      "answer": 1,
      "explain": "Bütün node-ların timeout-u eyni olsaydı, çoxu eyni anda namizədə çevrilər, hər term səsi bölər və heç vaxt lider seçilməzdi. Timeout-ları rastgələləşdirmək bir node-un demək olar ki, həmişə əvvəl vaxtının bitməsi deməkdir."
    },
    {
      "type": "blank",
      "prompt": "N replika, W tələb olunan yazı təsdiqi və R tələb olunan oxu təsdiqi verildikdə, oxunun ən son commit olunan yazı ilə həmişə üst-üstə düşməsini təmin edən kvorum bərabərsizliyini doldurun:",
      "code": "W + R > ____",
      "accept": [
        "N"
      ],
      "explain": "W + R > N istənilən yazı kvorumunun və istənilən oxu kvorumunun ən azı bir ortaq replikaya sahib olmasını təmin edir, ona görə oxu ən son yazını heç vaxt tamamilə ötürə bilməz."
    }
  ],
  "m18": [
    {
      "type": "mcq",
      "prompt": "Yaxşı SLI ilk növbədə nəyi ölçməlidir:",
      "options": [
        "bir node-da CPU istifadəsi",
        "uğur nisbəti və ya sorğu gecikməsi kimi istifadəçiyə görünən servis davranışı",
        "neçə dashboard olduğu",
        "gündə neçə alert işə düşdüyü"
      ],
      "answer": 1,
      "explain": "SLI-lər istifadəçi təcrübəsini əks etdirməlidir. CPU problemi izah edə bilər, amma uğur nisbəti və gecikmə istifadəçilərin zərər çəkib-çəkmədiyini deyir."
    },
    {
      "type": "mcq",
      "prompt": "Sürətli-burn alert nə üçün faydalıdır:",
      "options": [
        "hər kiçik xətada page edir",
        "servisin error budget-ini icazə verilən templə müqayisədə çox daha sürətlə xərclədiyini göstərir",
        "insident review-u əvəz edir",
        "Kubernetes-in sındığını sübut edir"
      ],
      "answer": 1,
      "explain": "Burn rate alert təcililiyini SLO riskinə bağlayır. Qısa pəncərədə yüksək burn heç nə dəyişməsə büdcənin tez tükənəcəyi deməkdir."
    },
    {
      "type": "blank",
      "prompt": "Bu vakansiyada üstünlük verilən standart telemetriya çərçivəsi Open____-dur.",
      "code": "Open____",
      "accept": [
        "Telemetry"
      ],
      "explain": "OpenTelemetry trace-lərin, metrikaların və logların instrumentasiyasını və ixracını standartlaşdırır."
    },
    {
      "type": "mcq",
      "prompt": "Sadalanan Grafana yığınında trace-lər üçün əsasən hansı alət istifadə olunur:",
      "options": [
        "Prometheus",
        "Thanos",
        "Tempo",
        "Loki"
      ],
      "answer": 2,
      "explain": "Tempo trace-ləri saxlayır. Prometheus/Thanos metrikaları, Loki isə logları idarə edir."
    },
    {
      "type": "code",
      "prompt": "Sahibi və ölçülə bilən nəticəsi olan kiçik bir on-call postmortem hərəkət maddəsi yazın.",
      "starter": "Action item:\n",
      "checks": [
        {
          "has": "owner",
          "msg": "Name an owner"
        },
        {
          "has": "due",
          "msg": "Include a due date or deadline"
        },
        {
          "re": "SLO|alert|dashboard|runbook|automation|toil",
          "msg": "Tie it to a reliability outcome"
        }
      ],
      "explain": "Faydalı postmortem hərəkəti sahib, son tarix və ölçülə bilən etibarlılıq nəticəsinə malikdir - sadəcə 'daha çox araşdır' yox."
    }
  ]
};

window.COURSE_AZ = {
  COURSE_META: COURSE_META_AZ,
  PARTS: PARTS_AZ,
  VERIFICATION: VERIFICATION_AZ,
  MODULES: MODULES_AZ,
  GLOSSARY: GLOSSARY_AZ,
  ASSIGNMENTS: ASSIGNMENTS_AZ,
};
