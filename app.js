/* ============================================
   Quran Companion — Ramadan Edition
   Main Application
   ============================================ */

(function () {
    'use strict';

    // ==========================================
    // API & Constants
    // ==========================================
    const API_BASE = 'https://api.alquran.cloud/v1';
    const AUDIO_CDN = 'https://cdn.islamic.network/quran/audio/128';

    // Arabic-Indic numerals
    const ARABIC_NUMERALS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

    function toArabicNumber(num) {
        return String(num).split('').map(d => ARABIC_NUMERALS[+d]).join('');
    }

    // Juz to Surah mapping for Ramadan plan (approximate: 1 Juz per day)
    const JUZ_DATA = [
        { juz: 1, start: '1:1', end: '2:141', label: 'Al-Fatiha — Al-Baqarah 141' },
        { juz: 2, start: '2:142', end: '2:252', label: 'Al-Baqarah 142-252' },
        { juz: 3, start: '2:253', end: '3:92', label: 'Al-Baqarah 253 — Ali Imran 92' },
        { juz: 4, start: '3:93', end: '4:23', label: 'Ali Imran 93 — An-Nisa 23' },
        { juz: 5, start: '4:24', end: '4:147', label: 'An-Nisa 24-147' },
        { juz: 6, start: '4:148', end: '5:81', label: 'An-Nisa 148 — Al-Maidah 81' },
        { juz: 7, start: '5:82', end: '6:110', label: "Al-Maidah 82 — Al-An'am 110" },
        { juz: 8, start: '6:111', end: '7:87', label: "Al-An'am 111 — Al-A'raf 87" },
        { juz: 9, start: '7:88', end: '8:40', label: "Al-A'raf 88 — Al-Anfal 40" },
        { juz: 10, start: '8:41', end: '9:92', label: 'Al-Anfal 41 — At-Tawbah 92' },
        { juz: 11, start: '9:93', end: '11:5', label: 'At-Tawbah 93 — Hud 5' },
        { juz: 12, start: '11:6', end: '12:52', label: 'Hud 6 — Yusuf 52' },
        { juz: 13, start: '12:53', end: '14:52', label: 'Yusuf 53 — Ibrahim 52' },
        { juz: 14, start: '15:1', end: '16:128', label: 'Al-Hijr — An-Nahl 128' },
        { juz: 15, start: '17:1', end: '18:74', label: 'Al-Isra — Al-Kahf 74' },
        { juz: 16, start: '18:75', end: '20:135', label: 'Al-Kahf 75 — Ta-Ha 135' },
        { juz: 17, start: '21:1', end: '22:78', label: 'Al-Anbiya — Al-Hajj 78' },
        { juz: 18, start: '23:1', end: '25:20', label: "Al-Mu'minun — Al-Furqan 20" },
        { juz: 19, start: '25:21', end: '27:55', label: 'Al-Furqan 21 — An-Naml 55' },
        { juz: 20, start: '27:56', end: '29:45', label: "An-Naml 56 — Al-'Ankabut 45" },
        { juz: 21, start: '29:46', end: '33:30', label: "Al-'Ankabut 46 — Al-Ahzab 30" },
        { juz: 22, start: '33:31', end: '36:27', label: 'Al-Ahzab 31 — Ya-Sin 27' },
        { juz: 23, start: '36:28', end: '39:31', label: 'Ya-Sin 28 — Az-Zumar 31' },
        { juz: 24, start: '39:32', end: '41:46', label: 'Az-Zumar 32 — Fussilat 46' },
        { juz: 25, start: '41:47', end: '45:37', label: 'Fussilat 47 — Al-Jathiyah 37' },
        { juz: 26, start: '46:1', end: '51:30', label: 'Al-Ahqaf — Adh-Dhariyat 30' },
        { juz: 27, start: '51:31', end: '57:29', label: 'Adh-Dhariyat 31 — Al-Hadid 29' },
        { juz: 28, start: '58:1', end: '66:12', label: 'Al-Mujadila — At-Tahrim 12' },
        { juz: 29, start: '67:1', end: '77:50', label: 'Al-Mulk — Al-Mursalat 50' },
        { juz: 30, start: '78:1', end: '114:6', label: "An-Naba' — An-Nas" },
    ];

    // ==========================================
    // Juz Utility Functions
    // ==========================================

    function parseRef(ref) {
        const [surah, verse] = ref.split(':').map(Number);
        return { surah, verse };
    }

    function getJuzForSurah(surahNumber) {
        const juzIndices = [];
        for (let i = 0; i < JUZ_DATA.length; i++) {
            const start = parseRef(JUZ_DATA[i].start);
            const end = parseRef(JUZ_DATA[i].end);
            if (surahNumber >= start.surah && surahNumber <= end.surah) {
                juzIndices.push(i);
            }
        }
        return juzIndices;
    }

    function getSurahsInJuz(juzIndex) {
        const juz = JUZ_DATA[juzIndex];
        const start = parseRef(juz.start);
        const end = parseRef(juz.end);
        const surahs = [];
        for (let s = start.surah; s <= end.surah; s++) {
            surahs.push(s);
        }
        return surahs;
    }

    function calculateJuzProgress(juzIndex) {
        const surahs = getSurahsInJuz(juzIndex);
        let readCount = 0;
        for (const s of surahs) {
            if (state.readingProgress[s]) readCount++;
        }
        return surahs.length > 0 ? Math.round((readCount / surahs.length) * 100) : 0;
    }

    function getTodaysJuz() {
        const info = getRamadanInfo();
        if (info.status === 'during') {
            return info.dayOf - 1;
        }
        for (let i = 0; i < 30; i++) {
            if (!state.ramadanPlan.completedDays.includes(i)) return i;
        }
        return 0;
    }

    function getNextUnreadInJuz(juzIndex) {
        const surahs = getSurahsInJuz(juzIndex);
        for (const s of surahs) {
            if (!state.readingProgress[s]) return s;
        }
        return surahs[0];
    }

    // Ramadan dates (approximate Gregorian start/end for each year)
    const RAMADAN_DATES = [
        { start: new Date(2025, 1, 28), end: new Date(2025, 2, 30) },
        { start: new Date(2026, 1, 17), end: new Date(2026, 2, 19) },
        { start: new Date(2027, 1, 7),  end: new Date(2027, 2, 9) },
        { start: new Date(2028, 0, 27), end: new Date(2028, 1, 25) },
        { start: new Date(2029, 0, 16), end: new Date(2029, 1, 14) },
        { start: new Date(2030, 0, 5),  end: new Date(2030, 1, 3) },
    ];

    // ==========================================
    // Internationalization (i18n)
    // ==========================================
    const STRINGS = {
        en: {
            // Header & Nav
            appName: 'Quran Companion',
            home: 'Home',
            search: 'Search',
            bookmarks: 'Bookmarks',
            ramadanPlan: 'Ramadan Plan',
            settings: 'Settings',
            toggleTheme: 'Toggle Theme',
            searchPlaceholder: 'Search surahs...',
            // Hero
            greeting_morning: 'Good Morning',
            greeting_afternoon: 'Good Afternoon',
            greeting_evening: 'Good Evening',
            greeting_default: 'Assalamu Alaikum',
            complete: 'Complete',
            surahs: 'Surahs',
            saved: 'Saved',
            streak: 'Streak',
            continueLabel: 'Continue:',
            verse: 'Verse',
            ramadanDay: 'Day',
            dLeft: 'd left',
            dToRamadan: 'd to Ramadan',
            // Daily Goals
            dailyGoals: 'Daily Goals',
            recitation: 'Recitation',
            listening: 'Listening',
            min: 'min',
            // Surah List
            allSurahs: 'All Surahs',
            all: 'All',
            meccan: 'Meccan',
            medinan: 'Medinan',
            verses: 'verses',
            // Reader
            reciter: 'Reciter',
            translation: 'Translation',
            fontSize: 'Font Size',
            tajweed: 'Tajweed',
            colors: 'Colors',
            ghunnah: 'Ghunnah',
            ikhfa: 'Ikhfa',
            idgham: 'Idgham',
            iqlab: 'Iqlab',
            qalqalah: 'Qalqalah',
            madd: 'Madd',
            silent: 'Silent',
            recite: 'Recite',
            listen: 'Listen',
            startPause: 'Start/Pause',
            previousSurah: 'Previous Surah',
            nextSurah: 'Next Surah',
            play: 'Play',
            save: 'Save',
            savedBtn: 'Saved',
            copy: 'Copy',
            bookmark: 'Bookmark',
            // Bookmarks
            yourSavedVerses: 'Your saved verses',
            noBookmarks: 'No bookmarks yet',
            noBookmarksHint: 'Tap the bookmark icon on any verse to save it here',
            // Ramadan
            ramadanKhatmaPlan: 'Ramadan Khatma Plan',
            completeQuran30: 'Complete the entire Quran in 30 days',
            juzDone: 'Juz Done',
            pagesToday: 'Pages Today',
            daysLeft: 'Days Left',
            juz: 'Juz',
            // Settings
            customizeExperience: 'Customize your experience',
            language: 'Language',
            languageDesc: 'Switch between English and Arabic',
            darkMode: 'Dark Mode',
            darkModeDesc: 'Switch between light and dark theme',
            showTranslation: 'Show Translation',
            showTranslationDesc: 'Display English translation below Arabic',
            autoScroll: 'Auto-scroll',
            autoScrollDesc: 'Scroll to current verse during playback',
            verseNumbersArabic: 'Verse Numbers (Arabic)',
            verseNumbersDesc: 'Show verse numbers in Arabic-Indic numerals',
            resetProgress: 'Reset Progress',
            resetProgressDesc: 'Clear all reading progress and bookmarks',
            resetAll: 'Reset All',
            // Audio
            previousVerse: 'Previous Verse',
            playPause: 'Play/Pause',
            nextVerse: 'Next Verse',
            repeatVerse: 'Repeat Verse',
            closePlayer: 'Close Player',
            // Toasts & Messages
            bookmarkRemoved: 'Bookmark removed',
            verseBookmarked: 'Verse bookmarked',
            verseCopied: 'Verse copied',
            failedCopy: 'Failed to copy',
            goalComplete: 'Complete!',
            reciteGoalComplete: 'Recitation goal complete!',
            listenGoalComplete: 'Listening goal complete!',
            repeatOn: 'Repeat on',
            repeatOff: 'Repeat off',
            appInstalled: 'App installed!',
            loadingSurah: 'Loading surah...',
            failedLoadSurah: 'Failed to load surah. Please check your connection and try again.',
            failedLoadData: 'Failed to load Quran data. Please check your internet connection.',
            retry: 'Retry',
            confirmReset: 'Are you sure you want to reset all progress, bookmarks, and settings?',
            installApp: 'Install Quran Companion',
            installDesc: 'Add to home screen for the full experience',
            install: 'Install',
            // Loading
            loadingTitle: 'Quran Companion',
            loadingSubtitle: 'Ramadan Edition',
            // Ramadan Countdown
            ramadanBeginsIn: 'Ramadan begins in',
            day_s: 'day',
            days_s: 'days',
            ramadanMubarak: 'Ramadan Mubarak!',
            remaining: 'remaining',
            // Ramadan Auto-tracking
            juzCompleted: 'Juz {n} completed!',
            todaysReading: "Today's Reading",
            startReading: 'Start Reading',
            continueJuz: 'Continue',
            readProgress: 'read',
            milestone10: 'One third done! 10 Juz completed!',
            milestoneHalfway: 'Halfway there! 15 Juz completed!',
            milestone20: 'Two thirds done! 20 Juz completed!',
            milestoneComplete: 'Masha Allah! Quran Khatma complete!',
            milestoneDismiss: 'Continue',
            todaysJuz: "Today's Juz",
            suggested: 'Next',
            ofJuz: 'of Juz',
            autoCompleted: 'Auto-completed',
        },
        ar: {
            // Header & Nav
            appName: 'رفيق القرآن',
            home: 'الرئيسية',
            search: 'بحث',
            bookmarks: 'المحفوظات',
            ramadanPlan: 'خطة رمضان',
            settings: 'الإعدادات',
            toggleTheme: 'تبديل المظهر',
            searchPlaceholder: 'ابحث عن سورة...',
            // Hero
            greeting_morning: 'صباح الخير',
            greeting_afternoon: 'مساء الخير',
            greeting_evening: 'مساء الخير',
            greeting_default: 'السلام عليكم',
            complete: 'مكتمل',
            surahs: 'سور',
            saved: 'محفوظ',
            streak: 'متتالي',
            continueLabel: 'أكمل:',
            verse: 'آية',
            ramadanDay: 'يوم',
            dLeft: 'يوم متبقي',
            dToRamadan: 'يوم لرمضان',
            // Daily Goals
            dailyGoals: 'الأهداف اليومية',
            recitation: 'التلاوة',
            listening: 'الاستماع',
            min: 'دقيقة',
            // Surah List
            allSurahs: 'جميع السور',
            all: 'الكل',
            meccan: 'مكية',
            medinan: 'مدنية',
            verses: 'آيات',
            // Reader
            reciter: 'القارئ',
            translation: 'الترجمة',
            fontSize: 'حجم الخط',
            tajweed: 'تجويد',
            colors: 'ألوان',
            ghunnah: 'غنة',
            ikhfa: 'إخفاء',
            idgham: 'إدغام',
            iqlab: 'إقلاب',
            qalqalah: 'قلقلة',
            madd: 'مد',
            silent: 'صامت',
            recite: 'تلاوة',
            listen: 'استماع',
            startPause: 'تشغيل/إيقاف',
            previousSurah: 'السورة السابقة',
            nextSurah: 'السورة التالية',
            play: 'تشغيل',
            save: 'حفظ',
            savedBtn: 'محفوظ',
            copy: 'نسخ',
            bookmark: 'حفظ',
            // Bookmarks
            yourSavedVerses: 'آياتك المحفوظة',
            noBookmarks: 'لا توجد محفوظات',
            noBookmarksHint: 'اضغط على أيقونة الحفظ في أي آية لحفظها هنا',
            // Ramadan
            ramadanKhatmaPlan: 'خطة ختم القرآن في رمضان',
            completeQuran30: 'أكمل القرآن الكريم في ٣٠ يومًا',
            juzDone: 'جزء مكتمل',
            pagesToday: 'صفحات اليوم',
            daysLeft: 'أيام متبقية',
            juz: 'جزء',
            // Settings
            customizeExperience: 'خصّص تجربتك',
            language: 'اللغة',
            languageDesc: 'التبديل بين العربية والإنجليزية',
            darkMode: 'الوضع الداكن',
            darkModeDesc: 'التبديل بين المظهر الفاتح والداكن',
            showTranslation: 'إظهار الترجمة',
            showTranslationDesc: 'عرض الترجمة الإنجليزية أسفل النص العربي',
            autoScroll: 'التمرير التلقائي',
            autoScrollDesc: 'التمرير للآية الحالية أثناء التشغيل',
            verseNumbersArabic: 'أرقام الآيات (عربية)',
            verseNumbersDesc: 'عرض أرقام الآيات بالأرقام العربية',
            resetProgress: 'إعادة تعيين التقدم',
            resetProgressDesc: 'مسح جميع بيانات القراءة والمحفوظات',
            resetAll: 'إعادة تعيين الكل',
            // Audio
            previousVerse: 'الآية السابقة',
            playPause: 'تشغيل/إيقاف',
            nextVerse: 'الآية التالية',
            repeatVerse: 'تكرار الآية',
            closePlayer: 'إغلاق المشغل',
            // Toasts & Messages
            bookmarkRemoved: 'تم إزالة المحفوظة',
            verseBookmarked: 'تم حفظ الآية',
            verseCopied: 'تم نسخ الآية',
            failedCopy: 'فشل النسخ',
            goalComplete: 'مكتمل!',
            reciteGoalComplete: 'اكتمل هدف التلاوة!',
            listenGoalComplete: 'اكتمل هدف الاستماع!',
            repeatOn: 'التكرار مفعّل',
            repeatOff: 'التكرار متوقف',
            appInstalled: 'تم تثبيت التطبيق!',
            loadingSurah: 'جاري تحميل السورة...',
            failedLoadSurah: 'فشل تحميل السورة. يرجى التحقق من الاتصال والمحاولة مرة أخرى.',
            failedLoadData: 'فشل تحميل بيانات القرآن. يرجى التحقق من اتصال الإنترنت.',
            retry: 'إعادة المحاولة',
            confirmReset: 'هل أنت متأكد من إعادة تعيين جميع البيانات والمحفوظات والإعدادات؟',
            installApp: 'تثبيت رفيق القرآن',
            installDesc: 'أضف للشاشة الرئيسية للتجربة الكاملة',
            install: 'تثبيت',
            // Loading
            loadingTitle: 'رفيق القرآن',
            loadingSubtitle: 'إصدار رمضان',
            // Ramadan Countdown
            ramadanBeginsIn: 'رمضان يبدأ بعد',
            day_s: 'يوم',
            days_s: 'أيام',
            ramadanMubarak: 'رمضان مبارك!',
            remaining: 'متبقي',
            // Ramadan Auto-tracking
            juzCompleted: 'تم إكمال الجزء {n}!',
            todaysReading: 'قراءة اليوم',
            startReading: 'ابدأ القراءة',
            continueJuz: 'أكمل',
            readProgress: 'مقروء',
            milestone10: 'ثلث القرآن! ١٠ أجزاء مكتملة!',
            milestoneHalfway: 'نصف الطريق! ١٥ جزءًا مكتملاً!',
            milestone20: 'ثلثا القرآن! ٢٠ جزءًا مكتملاً!',
            milestoneComplete: 'ما شاء الله! اكتملت ختمة القرآن!',
            milestoneDismiss: 'متابعة',
            todaysJuz: 'جزء اليوم',
            suggested: 'التالي',
            ofJuz: 'من الجزء',
            autoCompleted: 'مكتمل تلقائيًا',
        },
    };

    // Translation helper
    function t(key) {
        const lang = state.settings.language || 'en';
        return STRINGS[lang]?.[key] || STRINGS.en[key] || key;
    }

    // Apply language: update dir, translate data-i18n elements, re-render dynamic content
    function applyLanguage() {
        const lang = state.settings.language || 'en';
        const isRTL = lang === 'ar';
        document.documentElement.lang = lang;
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';

        // Translate static elements with data-i18n attributes
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = t(el.dataset.i18n);
        });
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            el.title = t(el.dataset.i18nTitle);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            el.placeholder = t(el.dataset.i18nPlaceholder);
        });

        // Update language selector value
        const langSelect = $('#setting-language');
        if (langSelect) langSelect.value = lang;
    }

    // ==========================================
    // State
    // ==========================================
    const state = {
        surahs: [],
        currentSurah: null,
        currentVerses: { arabic: [], translation: [], audio: [] },
        currentView: 'home',
        filter: 'all',
        bookmarks: JSON.parse(localStorage.getItem('qc_bookmarks') || '[]'),
        readingProgress: JSON.parse(localStorage.getItem('qc_progress') || '{}'),
        ramadanPlan: JSON.parse(localStorage.getItem('qc_ramadan') || '{"completedDays":[]}'),
        streak: JSON.parse(localStorage.getItem('qc_streak') || '{"count":0,"lastDate":null}'),
        settings: JSON.parse(localStorage.getItem('qc_settings') || '{}'),
        audioState: { playing: false, currentIndex: 0, repeat: false },
        fontSize: parseInt(localStorage.getItem('qc_fontsize') || '28'),
        goals: JSON.parse(localStorage.getItem('qc_goals') || '{"reciteMinutes":30,"listenMinutes":15}'),
        timerData: JSON.parse(localStorage.getItem('qc_timers') || '{"reciteRemaining":null,"listenRemaining":null,"date":null}'),
    };

    // Default settings
    state.settings = {
        darkMode: false,
        showTranslation: true,
        autoScroll: true,
        arabicNumbers: true,
        tajweed: false,
        language: 'en',
        reciter: 'ar.alafasy',
        translation: 'en.sahih',
        ...state.settings,
    };

    // ==========================================
    // DOM References
    // ==========================================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const dom = {
        loadingScreen: $('#loading-screen'),
        app: $('#app'),
        searchBar: $('#search-bar'),
        searchInput: $('#search-input'),
        surahList: $('#surah-list'),
        heroStats: $('#hero-stats'),
        heroGreeting: $('#hero-greeting'),
        heroRamadanBadge: $('#hero-ramadan-badge'),
        heroDailyVerse: $('#hero-daily-verse'),
        heroContinue: $('#hero-continue'),
        heroProgressCircle: $('#progress-circle'),
        heroProgressPct: $('#progress-pct'),
        continueReading: $('#continue-reading'),
        versesContainer: $('#verses-container'),
        readerBismillah: $('#reader-bismillah'),
        readerSurahName: $('#reader-surah-name'),
        readerSurahMeta: $('#reader-surah-meta'),
        bookmarksList: $('#bookmarks-list'),
        bookmarksEmpty: $('#bookmarks-empty'),
        ramadanDays: $('#ramadan-days'),
        progressRingFill: $('#progress-ring-fill'),
        progressPercent: $('#progress-percent'),
        statJuzDone: $('#stat-juz-done'),
        statPagesToday: $('#stat-pages-today'),
        statDaysLeft: $('#stat-days-left'),
        audioPlayer: $('#audio-player'),
        audioProgress: $('#audio-progress'),
        audioVerseInfo: $('#audio-verse-info'),
        fontSizeDisplay: $('#font-size-display'),
        selectReciter: $('#select-reciter'),
        selectTranslation: $('#select-translation'),
    };

    let audioEl = new Audio();
    audioEl.preload = 'auto';

    // Timer intervals
    let reciteInterval = null;
    let listenInterval = null;

    // ==========================================
    // API Layer
    // ==========================================
    async function fetchAPI(endpoint) {
        const res = await fetch(`${API_BASE}${endpoint}`);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        return data.data;
    }

    async function loadSurahList() {
        if (state.surahs.length) return state.surahs;
        state.surahs = await fetchAPI('/surah');
        return state.surahs;
    }

    async function loadSurah(number, reciter, translation) {
        const arabicEdition = state.settings.tajweed ? 'quran-tajweed' : 'quran-uthmani';
        const editions = `${arabicEdition},${translation},${reciter}`;
        const data = await fetchAPI(`/surah/${number}/editions/${editions}`);
        return {
            arabic: data[0],
            translation: data[1],
            audio: data[2],
        };
    }

    // ==========================================
    // Rendering
    // ==========================================

    function renderSurahList(filter = 'all', search = '') {
        const surahs = state.surahs.filter(s => {
            const matchFilter = filter === 'all' ||
                (filter === 'meccan' && s.revelationType === 'Meccan') ||
                (filter === 'medinan' && s.revelationType === 'Medinan');
            const matchSearch = !search ||
                s.englishName.toLowerCase().includes(search) ||
                s.englishNameTranslation.toLowerCase().includes(search) ||
                s.name.includes(search) ||
                String(s.number).includes(search);
            return matchFilter && matchSearch;
        });

        const todaysJuz = getTodaysJuz();
        const todaysSurahs = getSurahsInJuz(todaysJuz);
        const info = getRamadanInfo();
        const juzLabel = info.status === 'during' ? t('todaysJuz') : t('suggested');

        dom.surahList.innerHTML = surahs.map(s => {
            const isInTodaysJuz = todaysSurahs.includes(s.number);
            const isRead = state.readingProgress[s.number];
            return `
                <div class="surah-card ${isInTodaysJuz ? 'todays-juz' : ''}" data-surah="${s.number}">
                    <div class="surah-number">${s.number}</div>
                    <div class="surah-info">
                        <div class="surah-name-en">
                            ${s.englishName}
                            ${isInTodaysJuz ? `<span class="surah-juz-badge">${juzLabel}</span>` : ''}
                        </div>
                        <div class="surah-meta">${s.englishNameTranslation} · ${s.numberOfAyahs} ${t('verses')} · ${s.revelationType === 'Meccan' ? t('meccan') : t('medinan')}${isRead && isInTodaysJuz ? ' · &#10003;' : ''}</div>
                    </div>
                    <div class="surah-name-ar">${s.name}</div>
                </div>
            `;
        }).join('');

        // Click handlers
        dom.surahList.querySelectorAll('.surah-card').forEach(card => {
            card.addEventListener('click', () => {
                openSurah(parseInt(card.dataset.surah));
            });
        });
    }

    function renderHero() {
        renderHeroGreeting();
        renderHeroRamadanBadge();
        renderHeroDailyVerse();
        renderHeroContinue();
        renderHeroProgress();
        renderHeroStats();
    }

    function renderHeroGreeting() {
        const hour = new Date().getHours();
        let key;
        if (hour < 5) key = 'greeting_default';
        else if (hour < 12) key = 'greeting_morning';
        else if (hour < 17) key = 'greeting_afternoon';
        else if (hour < 21) key = 'greeting_evening';
        else key = 'greeting_default';
        dom.heroGreeting.textContent = t(key);
    }

    function renderHeroRamadanBadge() {
        const info = getRamadanInfo();
        if (info.status === 'during') {
            dom.heroRamadanBadge.classList.add('visible');
            dom.heroRamadanBadge.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                ${t('ramadanDay')} ${info.dayOf} · ${info.daysLeft} ${t('dLeft')}
            `;
        } else if (info.status === 'before' && info.daysUntil <= 30) {
            dom.heroRamadanBadge.classList.add('visible');
            dom.heroRamadanBadge.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                ${info.daysUntil} ${t('dToRamadan')}
            `;
        }
    }

    function renderHeroDailyVerse() {
        // Pick a verse based on today's date for consistency
        const DAILY_VERSES = [
            { text: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', ref: 'Ash-Sharh 94:5', translation: 'For indeed, with hardship comes ease.' },
            { text: 'وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُۥ', ref: 'At-Talaq 65:3', translation: 'Whoever relies upon Allah, He is sufficient for him.' },
            { text: 'وَٱذْكُرُوٓا۟ ٱللَّهَ كَثِيرًا لَّعَلَّكُمْ تُفْلِحُونَ', ref: 'Al-Jumu\'ah 62:10', translation: 'Remember Allah often so that you may succeed.' },
            { text: 'رَبِّ ٱشْرَحْ لِى صَدْرِى', ref: 'Ta-Ha 20:25', translation: 'My Lord, expand for me my chest.' },
            { text: 'إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ', ref: 'Al-Baqarah 2:153', translation: 'Indeed, Allah is with the patient.' },
            { text: 'وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰٓ', ref: 'Ad-Duha 93:5', translation: 'And your Lord is going to give you, and you will be satisfied.' },
            { text: 'رَبَّنَآ ءَاتِنَا فِى ٱلدُّنْيَا حَسَنَةً وَفِى ٱلْـَٔاخِرَةِ حَسَنَةً', ref: 'Al-Baqarah 2:201', translation: 'Our Lord, give us good in this world and good in the Hereafter.' },
            { text: 'وَنُنَزِّلُ مِنَ ٱلْقُرْءَانِ مَا هُوَ شِفَآءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ', ref: 'Al-Isra 17:82', translation: 'We send down the Quran as a healing and mercy for the believers.' },
            { text: 'فَٱذْكُرُونِىٓ أَذْكُرْكُمْ', ref: 'Al-Baqarah 2:152', translation: 'Remember Me, and I will remember you.' },
            { text: 'وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ', ref: 'Al-Hadid 57:4', translation: 'He is with you wherever you are.' },
            { text: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ', ref: 'Al-Ikhlas 112:1', translation: 'Say: He is Allah, the One.' },
            { text: 'أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ', ref: 'Ar-Ra\'d 13:28', translation: 'Verily, in the remembrance of Allah do hearts find rest.' },
            { text: 'وَقُل رَّبِّ زِدْنِى عِلْمًا', ref: 'Ta-Ha 20:114', translation: 'And say: My Lord, increase me in knowledge.' },
            { text: 'إِنَّ رَحْمَتَ ٱللَّهِ قَرِيبٌ مِّنَ ٱلْمُحْسِنِينَ', ref: 'Al-A\'raf 7:56', translation: 'Indeed, the mercy of Allah is near to the doers of good.' },
        ];
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const verse = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
        const isAr = (state.settings.language || 'en') === 'ar';
        dom.heroDailyVerse.innerHTML = `
            <div class="hero-verse-text">${verse.text}</div>
            <div class="hero-verse-ref">${isAr ? verse.ref : verse.translation + ' — ' + verse.ref}</div>
        `;
    }

    function renderHeroContinue() {
        const last = localStorage.getItem('qc_last_read');
        if (!last) {
            dom.heroContinue.innerHTML = '';
            return;
        }
        const { surahNumber, surahName, surahNameAr, verse } = JSON.parse(last);
        dom.heroContinue.innerHTML = `
            <button class="hero-continue-btn" id="hero-continue-btn">
                <div class="hero-continue-icon">${surahNameAr ? surahNameAr.charAt(0) : '📖'}</div>
                <div class="hero-continue-text">
                    <div class="hero-continue-title">${t('continueLabel')} ${surahName}</div>
                    <div class="hero-continue-sub">${t('verse')} ${verse}</div>
                </div>
                <div class="hero-continue-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
            </button>
        `;
        $('#hero-continue-btn').onclick = () => openSurah(surahNumber, verse);
    }

    function renderHeroProgress() {
        const totalRead = Object.keys(state.readingProgress).length;
        const pct = Math.round((totalRead / 114) * 100);
        const circumference = 2 * Math.PI * 34; // r=34
        const offset = circumference - (pct / 100) * circumference;
        dom.heroProgressCircle.style.strokeDashoffset = offset;
        dom.heroProgressPct.textContent = pct + '%';
    }

    function renderHeroStats() {
        const totalRead = Object.keys(state.readingProgress).length;
        updateStreak();
        dom.heroStats.innerHTML = `
            <div class="hero-stat">
                <div class="hero-stat-icon">📖</div>
                <div class="hero-stat-value">${totalRead}</div>
                <div class="hero-stat-label">${t('surahs')}</div>
            </div>
            <div class="hero-stat">
                <div class="hero-stat-icon">🔖</div>
                <div class="hero-stat-value">${state.bookmarks.length}</div>
                <div class="hero-stat-label">${t('saved')}</div>
            </div>
            <div class="hero-stat">
                <div class="hero-stat-icon">🔥</div>
                <div class="hero-stat-value">${state.streak.count}</div>
                <div class="hero-stat-label">${t('streak')}</div>
            </div>
        `;
    }

    function renderContinueReading() {
        // Continue reading is now rendered inside the hero box
        renderHeroContinue();
    }

    function renderStreak() {
        updateStreak();
        // Streak is now displayed as a stat in the hero box
        renderHeroStats();
    }

    // Strip diacritics and normalize Arabic text for comparison
    function stripDiacritics(str) {
        return str
            .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0640]/g, '')
            .replace(/\u0671/g, '\u0627'); // alef wasla → regular alef
    }

    // Strip HTML tags (for tajweed text processing)
    function stripHTML(str) {
        return str.replace(/<[^>]+>/g, '');
    }

    // Parse tajweed bracket notation from the API into HTML <tajweed> elements.
    // The AlQuran Cloud quran-tajweed edition returns nested brackets like:
    //   [h:9421[ٱ]  [n[ـٰ]  [q[ق]
    // Pass 1: replace [letter identifiers with opening <tajweed> tags
    // Pass 2: replace remaining [ with "> and ] with </tajweed>
    function parseTajweedText(text) {
        const tagMap = {
            'h': 'ham_wasl',
            's': 'silent',
            'l': 'laam_shamsiyah',
            'n': 'madda_normal',
            'p': 'madda_permissible',
            'm': 'madda_necessary',
            'q': 'qalqalah',
            'o': 'madda_obligatory',
            'c': 'ikhafa_shafawi',
            'f': 'ikhafa',
            'w': 'idghaam_shafawi',
            'i': 'iqlab',
            'a': 'idghaam_ghunnah',
            'u': 'idghaam_no_ghunnah',
            'd': 'idghaam_mutajanisayn',
            'b': 'idghaam_mutaqaribayn',
            'g': 'ghunnah',
        };

        // Pass 1: Replace [letter identifiers with <tajweed> opening tags.
        // e.g. [h:9421[ٱ] → <tajweed class="ham_wasl" data-tajweed=":9421[ٱ]
        let result = text;
        for (const [letter, className] of Object.entries(tagMap)) {
            const re = new RegExp('\\[' + letter, 'g');
            result = result.replace(re, '<tajweed class="' + className + '" data-tajweed="');
        }

        // Pass 2: Replace remaining [ with "> and ] with </tajweed>
        // This closes the data-tajweed attribute and wraps the content.
        // e.g. <tajweed class="ham_wasl" data-tajweed=":9421[ٱ]
        //    → <tajweed class="ham_wasl" data-tajweed=":9421">ٱ</tajweed>
        result = result.replace(/\[/g, '">');
        result = result.replace(/\]/g, '</tajweed>');

        return result;
    }

    // Strip Bismillah from text that may contain HTML (tajweed)
    function stripBismillahFromText(text, hasTags) {
        const plain = hasTags ? stripHTML(text) : text;
        const base = stripDiacritics(plain);
        const idx = base.indexOf('الرحيم');
        if (idx === -1) return text;

        // Find end of الرحيم in stripped-diacritics plain text
        const endInBase = idx + 'الرحيم'.length;

        // Map base position → plain text position
        let basePos = 0;
        let plainPos = 0;
        while (basePos < endInBase && plainPos < plain.length) {
            if (stripDiacritics(plain[plainPos]) === '') {
                plainPos++;
            } else {
                basePos++;
                plainPos++;
            }
        }
        // Skip trailing diacritics
        while (plainPos < plain.length && stripDiacritics(plain[plainPos]) === '') plainPos++;

        if (!hasTags) return text.substring(plainPos).trim();

        // Map plain text position → original HTML position (skip over tags)
        let pCount = 0;
        let htmlPos = 0;
        let inTag = false;
        while (pCount < plainPos && htmlPos < text.length) {
            if (text[htmlPos] === '<') {
                inTag = true;
                htmlPos++;
            } else if (inTag) {
                if (text[htmlPos] === '>') inTag = false;
                htmlPos++;
            } else {
                pCount++;
                htmlPos++;
            }
        }
        // Skip any trailing closing tags
        while (htmlPos < text.length && text[htmlPos] === '<') {
            const end = text.indexOf('>', htmlPos);
            if (end !== -1 && text[htmlPos + 1] === '/') {
                htmlPos = end + 1;
            } else {
                break;
            }
        }
        return text.substring(htmlPos).trim();
    }

    function renderVerses() {
        const { arabic, translation, audio } = state.currentVerses;
        const showTranslation = state.settings.showTranslation;
        const useArabicNums = state.settings.arabicNumbers;
        const isTajweed = state.settings.tajweed;
        const surahNum = state.currentSurah ? state.currentSurah.number : 0;
        const showDecorativeBismillah = surahNum !== 1 && surahNum !== 9;

        dom.versesContainer.innerHTML = arabic.ayahs.map((ayah, i) => {
            const verseNum = useArabicNums ? toArabicNumber(ayah.numberInSurah) : ayah.numberInSurah;
            const isBookmarked = state.bookmarks.some(b => b.number === ayah.number);
            const translationText = translation.ayahs[i] ? translation.ayahs[i].text : '';

            // Parse tajweed bracket notation into HTML, then strip Bismillah
            let verseText = isTajweed ? parseTajweedText(ayah.text) : ayah.text;
            if (i === 0 && showDecorativeBismillah) {
                verseText = stripBismillahFromText(verseText, isTajweed);
            }
            const arabicContent = isTajweed
                ? `${verseText} <span class="verse-number">﴿${verseNum}﴾</span>`
                : `${verseText} <span class="verse-number">﴿${verseNum}﴾</span>`;

            return `
                <div class="verse" data-index="${i}" data-verse-number="${ayah.number}" data-verse-in-surah="${ayah.numberInSurah}">
                    <div class="verse-arabic" style="font-size: ${state.fontSize}px">
                        ${arabicContent}
                    </div>
                    ${showTranslation ? `<div class="verse-translation">${ayah.numberInSurah}. ${translationText}</div>` : ''}
                    <div class="verse-actions">
                        <button class="verse-action-btn btn-play-verse" data-index="${i}" title="${t('play')}">
                            <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            ${t('play')}
                        </button>
                        <button class="verse-action-btn btn-bookmark-verse ${isBookmarked ? 'bookmarked' : ''}" data-number="${ayah.number}" data-index="${i}" title="${t('bookmark')}">
                            <svg viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                            ${isBookmarked ? t('savedBtn') : t('save')}
                        </button>
                        <button class="verse-action-btn btn-copy-verse" data-index="${i}" title="${t('copy')}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                            ${t('copy')}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Attach verse event listeners
        dom.versesContainer.querySelectorAll('.btn-play-verse').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                playVerse(parseInt(btn.dataset.index));
            });
        });

        dom.versesContainer.querySelectorAll('.btn-bookmark-verse').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleBookmark(parseInt(btn.dataset.index));
            });
        });

        dom.versesContainer.querySelectorAll('.btn-copy-verse').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyVerse(parseInt(btn.dataset.index));
            });
        });
    }

    function renderBookmarks() {
        if (state.bookmarks.length === 0) {
            dom.bookmarksList.classList.add('hidden');
            dom.bookmarksEmpty.classList.remove('hidden');
            return;
        }
        dom.bookmarksList.classList.remove('hidden');
        dom.bookmarksEmpty.classList.add('hidden');

        dom.bookmarksList.innerHTML = state.bookmarks.map((bm, i) => `
            <div class="bookmark-card" data-surah="${bm.surahNumber}" data-verse="${bm.verseInSurah}">
                <div class="bookmark-header">
                    <span class="bookmark-surah">${bm.surahName} ${bm.verseInSurah}</span>
                    <button class="bookmark-remove" data-index="${i}" title="Remove">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <div class="bookmark-arabic">${bm.arabic}</div>
                <div class="bookmark-translation">${bm.translation}</div>
            </div>
        `).join('');

        dom.bookmarksList.querySelectorAll('.bookmark-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.bookmark-remove')) return;
                openSurah(parseInt(card.dataset.surah), parseInt(card.dataset.verse));
            });
        });

        dom.bookmarksList.querySelectorAll('.bookmark-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.index);
                state.bookmarks.splice(idx, 1);
                saveBookmarks();
                renderBookmarks();
                showToast(t('bookmarkRemoved'));
            });
        });
    }

    function renderRamadanPlan() {
        const completed = state.ramadanPlan.completedDays || [];
        if (!state.ramadanPlan.juzProgress) state.ramadanPlan.juzProgress = {};
        const totalDone = completed.length;
        const percent = Math.round((totalDone / 30) * 100);

        // Update ring
        const circumference = 2 * Math.PI * 52;
        const offset = circumference - (percent / 100) * circumference;
        dom.progressRingFill.style.strokeDashoffset = offset;
        dom.progressPercent.textContent = percent;
        dom.statJuzDone.textContent = totalDone;
        dom.statDaysLeft.textContent = 30 - totalDone;

        // Today's reading estimate
        const todayIdx = getTodaysJuz();
        const todayProgress = calculateJuzProgress(todayIdx);
        dom.statPagesToday.textContent = todayProgress + '%';

        const info = getRamadanInfo();
        const currentJuz = getTodaysJuz();

        dom.ramadanDays.innerHTML = JUZ_DATA.map((juz, i) => {
            const isDone = completed.includes(i);
            const progress = state.ramadanPlan.juzProgress[i] || calculateJuzProgress(i);
            const isToday = i === currentJuz;
            const hasProgress = progress > 0 && !isDone;

            return `
                <div class="day-card ${isDone ? 'completed' : ''} ${isToday ? 'today' : ''} ${hasProgress ? 'in-progress' : ''}" data-day="${i}">
                    <div class="day-number">${i + 1}</div>
                    <div class="day-info">
                        <div class="day-juz-row">
                            <span class="day-juz">${t('juz')} ${juz.juz}</span>
                            ${isToday ? `<span class="day-today-badge">${info.status === 'during' ? t('todaysReading') : t('suggested')}</span>` : ''}
                        </div>
                        <div class="day-range">${juz.label}</div>
                        <div class="day-progress-bar">
                            <div class="day-progress-fill ${isDone ? 'done' : ''}" style="width: ${isDone ? 100 : progress}%"></div>
                        </div>
                    </div>
                    <div class="day-actions">
                        <button class="day-read-btn" data-day="${i}" title="${isDone ? t('startReading') : progress > 0 ? t('continueJuz') : t('startReading')}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
                        </button>
                        <button class="day-check-btn ${isDone ? 'checked' : ''}" data-day="${i}" title="${isDone ? 'Mark incomplete' : 'Mark complete'}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Read button opens the Juz for reading
        dom.ramadanDays.querySelectorAll('.day-read-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openJuzReading(parseInt(btn.dataset.day));
            });
        });

        // Check button toggles manual completion
        dom.ramadanDays.querySelectorAll('.day-check-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleRamadanDay(parseInt(btn.dataset.day));
            });
        });

        // Card body also opens reading
        dom.ramadanDays.querySelectorAll('.day-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.day-read-btn') || e.target.closest('.day-check-btn')) return;
                openJuzReading(parseInt(card.dataset.day));
            });
        });
    }

    // ==========================================
    // Navigation
    // ==========================================

    function showView(viewName) {
        $$('.view').forEach(v => v.classList.add('hidden'));
        $(`#view-${viewName}`).classList.remove('hidden');
        state.currentView = viewName;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Stop recite timer when leaving reader
        if (viewName !== 'reader') {
            stopReciteTimer();
        }

        // Render view-specific content
        if (viewName === 'home') {
            renderHero();
            renderRamadanCountdown();
            updateGoalDisplays();
        } else if (viewName === 'reader') {
            showTimerBar();
        } else if (viewName === 'bookmarks') {
            renderBookmarks();
        } else if (viewName === 'ramadan') {
            renderRamadanPlan();
        }
    }

    async function openSurah(number, scrollToVerse = null) {
        showView('reader');

        // Show loading state
        dom.versesContainer.innerHTML = `
            <div style="text-align:center;padding:3rem;color:var(--text-tertiary);">
                <p>${t('loadingSurah')}</p>
            </div>
        `;

        const surah = state.surahs.find(s => s.number === number);
        state.currentSurah = surah;

        dom.readerSurahName.textContent = `${surah.englishName} — ${surah.name}`;
        dom.readerSurahMeta.textContent = `${surah.englishNameTranslation} · ${surah.numberOfAyahs} verses · ${surah.revelationType}`;

        // Hide bismillah for At-Tawbah (9) and Al-Fatiha (1, it's in the text)
        dom.readerBismillah.classList.toggle('hidden', number === 9 || number === 1);

        // Nav buttons
        $('#btn-prev-surah').disabled = number <= 1;
        $('#btn-next-surah').disabled = number >= 114;

        try {
            const data = await loadSurah(number, state.settings.reciter, state.settings.translation);
            state.currentVerses = data;
            renderVerses();

            // Track reading
            state.readingProgress[number] = true;
            localStorage.setItem('qc_progress', JSON.stringify(state.readingProgress));

            // Auto-track Ramadan plan progress
            checkAndUpdateRamadanProgress(number);

            // Show Ramadan banner in reader
            renderReaderRamadanBanner(number);

            // Save last read
            localStorage.setItem('qc_last_read', JSON.stringify({
                surahNumber: number,
                surahName: surah.englishName,
                surahNameAr: surah.name,
                verse: scrollToVerse || 1,
            }));

            // Update streak
            recordReading();

            // Scroll to specific verse
            if (scrollToVerse) {
                setTimeout(() => {
                    const verseEl = dom.versesContainer.querySelector(`[data-verse-in-surah="${scrollToVerse}"]`);
                    if (verseEl) {
                        verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        verseEl.classList.add('playing');
                        setTimeout(() => verseEl.classList.remove('playing'), 2000);
                    }
                }, 100);
            }
        } catch (err) {
            dom.versesContainer.innerHTML = `
                <div style="text-align:center;padding:3rem;color:var(--danger);">
                    <p>${t('failedLoadSurah')}</p>
                    <button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1rem;border:1px solid;border-radius:8px;cursor:pointer;background:transparent;color:inherit;">${t('retry')}</button>
                </div>
            `;
        }
    }

    // ==========================================
    // Audio Player
    // ==========================================

    function playVerse(index) {
        const audioData = state.currentVerses.audio;
        if (!audioData || !audioData.ayahs[index]) return;

        state.audioState.currentIndex = index;
        state.audioState.playing = true;

        const ayah = audioData.ayahs[index];
        audioEl.src = ayah.audio;
        audioEl.play();

        // Show player
        dom.audioPlayer.classList.remove('hidden');

        // Update info
        const surahName = state.currentSurah.englishName;
        dom.audioVerseInfo.textContent = `${surahName} — Verse ${ayah.numberInSurah}`;

        // Update icons
        updatePlayPauseIcon(true);

        // Highlight verse
        highlightVerse(index);

        // Start listening timer
        startListenTimer();
        const lt = $('#listen-timer');
        if (lt && state.timerData.listenRemaining > 0) lt.classList.remove('hidden');
        const bar = $('#reader-timer-bar');
        if (bar) bar.classList.remove('hidden');
    }

    function togglePlayPause() {
        if (audioEl.paused) {
            audioEl.play();
            state.audioState.playing = true;
            updatePlayPauseIcon(true);
            startListenTimer();
        } else {
            audioEl.pause();
            state.audioState.playing = false;
            updatePlayPauseIcon(false);
            stopListenTimer();
        }
    }

    function updatePlayPauseIcon(playing) {
        $('#icon-play').classList.toggle('hidden', playing);
        $('#icon-pause').classList.toggle('hidden', !playing);
    }

    function playNext() {
        const next = state.audioState.currentIndex + 1;
        if (next < state.currentVerses.audio.ayahs.length) {
            playVerse(next);
        } else {
            stopAudio();
        }
    }

    function playPrev() {
        const prev = state.audioState.currentIndex - 1;
        if (prev >= 0) {
            playVerse(prev);
        }
    }

    function stopAudio() {
        audioEl.pause();
        audioEl.src = '';
        state.audioState.playing = false;
        dom.audioPlayer.classList.add('hidden');
        updatePlayPauseIcon(false);
        clearHighlights();
        stopListenTimer();
    }

    function highlightVerse(index) {
        clearHighlights();
        const verse = dom.versesContainer.querySelector(`[data-index="${index}"]`);
        if (verse) {
            verse.classList.add('playing');
            if (state.settings.autoScroll) {
                verse.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    function clearHighlights() {
        dom.versesContainer.querySelectorAll('.verse.playing').forEach(v => v.classList.remove('playing'));
    }

    // Audio events
    audioEl.addEventListener('timeupdate', () => {
        if (audioEl.duration) {
            const pct = (audioEl.currentTime / audioEl.duration) * 100;
            dom.audioProgress.style.width = pct + '%';
        }
    });

    audioEl.addEventListener('ended', () => {
        if (state.audioState.repeat) {
            audioEl.currentTime = 0;
            audioEl.play();
        } else {
            playNext();
        }
    });

    // Progress bar click-to-seek
    $('.audio-progress-bar').addEventListener('click', (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        if (audioEl.duration) {
            audioEl.currentTime = pct * audioEl.duration;
        }
    });

    // ==========================================
    // Bookmarks
    // ==========================================

    function toggleBookmark(index) {
        const arabic = state.currentVerses.arabic.ayahs[index];
        const trans = state.currentVerses.translation.ayahs[index];
        const existing = state.bookmarks.findIndex(b => b.number === arabic.number);

        if (existing >= 0) {
            state.bookmarks.splice(existing, 1);
            showToast(t('bookmarkRemoved'));
        } else {
            state.bookmarks.push({
                number: arabic.number,
                surahNumber: state.currentSurah.number,
                surahName: state.currentSurah.englishName,
                verseInSurah: arabic.numberInSurah,
                arabic: state.settings.tajweed ? stripHTML(parseTajweedText(arabic.text)) : arabic.text,
                translation: trans.text,
            });
            showToast(t('verseBookmarked'));
        }
        saveBookmarks();
        renderVerses();
    }

    function saveBookmarks() {
        localStorage.setItem('qc_bookmarks', JSON.stringify(state.bookmarks));
    }

    // ==========================================
    // Copy
    // ==========================================

    function copyVerse(index) {
        const arabic = state.currentVerses.arabic.ayahs[index];
        const trans = state.currentVerses.translation.ayahs[index];
        const arabicText = state.settings.tajweed ? stripHTML(parseTajweedText(arabic.text)) : arabic.text;
        const text = `${arabicText}\n\n${trans.text}\n\n— ${state.currentSurah.englishName} ${arabic.numberInSurah}`;

        navigator.clipboard.writeText(text).then(() => {
            showToast(t('verseCopied'));
        }).catch(() => {
            showToast(t('failedCopy'));
        });
    }

    // ==========================================
    // Streak & Reading Tracking
    // ==========================================

    function getToday() {
        return new Date().toISOString().split('T')[0];
    }

    function updateStreak() {
        const today = getToday();
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (state.streak.lastDate === today) {
            // Already counted today
            return;
        }

        if (state.streak.lastDate === yesterday) {
            // Streak continues (will be incremented on reading)
        } else if (state.streak.lastDate !== today) {
            // Streak broken (unless they read today)
            if (state.streak.lastDate && state.streak.lastDate !== yesterday) {
                state.streak.count = 0;
            }
        }
    }

    function recordReading() {
        const today = getToday();
        if (state.streak.lastDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            if (state.streak.lastDate === yesterday || state.streak.count === 0) {
                state.streak.count += 1;
            } else {
                state.streak.count = 1;
            }
            state.streak.lastDate = today;
            localStorage.setItem('qc_streak', JSON.stringify(state.streak));
        }
    }

    // ==========================================
    // Ramadan Plan
    // ==========================================

    function toggleRamadanDay(day) {
        const completed = state.ramadanPlan.completedDays;
        const idx = completed.indexOf(day);
        if (idx >= 0) {
            completed.splice(idx, 1);
        } else {
            completed.push(day);
        }
        localStorage.setItem('qc_ramadan', JSON.stringify(state.ramadanPlan));
        renderRamadanPlan();
    }

    function checkAndUpdateRamadanProgress(surahNumber) {
        const juzIndices = getJuzForSurah(surahNumber);
        let newCompletions = [];

        if (!state.ramadanPlan.juzProgress) {
            state.ramadanPlan.juzProgress = {};
        }

        for (const juzIdx of juzIndices) {
            const progress = calculateJuzProgress(juzIdx);
            state.ramadanPlan.juzProgress[juzIdx] = progress;

            if (progress >= 100 && !state.ramadanPlan.completedDays.includes(juzIdx)) {
                state.ramadanPlan.completedDays.push(juzIdx);
                newCompletions.push(juzIdx + 1);
            }
        }

        localStorage.setItem('qc_ramadan', JSON.stringify(state.ramadanPlan));

        for (const juzNum of newCompletions) {
            showToast(t('juzCompleted').replace('{n}', juzNum));
        }

        if (newCompletions.length > 0) {
            checkMilestones();
        }
    }

    function checkMilestones() {
        const completed = state.ramadanPlan.completedDays.length;
        const milestones = { 10: 'milestone10', 15: 'milestoneHalfway', 20: 'milestone20', 30: 'milestoneComplete' };
        if (milestones[completed]) {
            setTimeout(() => showMilestone(t(milestones[completed])), 800);
        }
    }

    function showMilestone(message) {
        document.querySelectorAll('.milestone-overlay').forEach(m => m.remove());
        const overlay = document.createElement('div');
        overlay.className = 'milestone-overlay';
        overlay.innerHTML = `
            <div class="milestone-card">
                <div class="milestone-stars">&#9733; &#9733; &#9733;</div>
                <div class="milestone-message">${message}</div>
                <button class="milestone-btn">${t('milestoneDismiss')}</button>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('.milestone-btn').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 6000);
    }

    function renderReaderRamadanBanner(surahNumber) {
        const banner = $('#reader-ramadan-banner');
        if (!banner) return;

        const juzIndices = getJuzForSurah(surahNumber);
        if (juzIndices.length === 0) {
            banner.classList.add('hidden');
            return;
        }

        const juzIdx = juzIndices[0];
        const juz = JUZ_DATA[juzIdx];
        if (!state.ramadanPlan.juzProgress) state.ramadanPlan.juzProgress = {};
        const progress = state.ramadanPlan.juzProgress[juzIdx] || calculateJuzProgress(juzIdx);
        const isCompleted = state.ramadanPlan.completedDays.includes(juzIdx);
        const todaysJuz = getTodaysJuz();
        const isToday = juzIdx === todaysJuz;

        banner.classList.remove('hidden');
        banner.innerHTML = `
            <div class="ramadan-banner-content">
                <div class="ramadan-banner-left">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.7"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                    <span class="ramadan-banner-juz">${t('juz')} ${juz.juz}</span>
                    ${isToday ? `<span class="ramadan-banner-today">${t('todaysReading')}</span>` : ''}
                    ${isCompleted ? `<span class="ramadan-banner-done">&#10003;</span>` : ''}
                </div>
                <div class="ramadan-banner-right">
                    <div class="ramadan-banner-bar">
                        <div class="ramadan-banner-fill ${isCompleted ? 'completed' : ''}" style="width: ${progress}%"></div>
                    </div>
                    <span class="ramadan-banner-pct">${progress}%</span>
                </div>
            </div>
        `;
    }

    function openJuzReading(juzIndex) {
        const nextSurah = getNextUnreadInJuz(juzIndex);
        openSurah(nextSurah);
    }

    // ==========================================
    // Settings & Theme
    // ==========================================

    function applyTheme(dark) {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        $('#icon-sun').classList.toggle('hidden', dark);
        $('#icon-moon').classList.toggle('hidden', !dark);
        state.settings.darkMode = dark;
        saveSettings();
    }

    function saveSettings() {
        localStorage.setItem('qc_settings', JSON.stringify(state.settings));
    }

    function updateFontSize(delta) {
        state.fontSize = Math.max(18, Math.min(48, state.fontSize + delta));
        localStorage.setItem('qc_fontsize', String(state.fontSize));
        dom.fontSizeDisplay.textContent = state.fontSize;

        // Update existing verses
        dom.versesContainer.querySelectorAll('.verse-arabic').forEach(el => {
            el.style.fontSize = state.fontSize + 'px';
        });
    }

    // ==========================================
    // Toast
    // ==========================================

    function showToast(message) {
        // Remove existing
        document.querySelectorAll('.toast').forEach(t => t.remove());

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 2500);
    }

    // ==========================================
    // Ramadan Countdown
    // ==========================================

    function getRamadanInfo() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const ramadan of RAMADAN_DATES) {
            const start = new Date(ramadan.start);
            const end = new Date(ramadan.end);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            if (today >= start && today <= end) {
                const dayOf = Math.floor((today - start) / 86400000) + 1;
                const daysLeft = Math.ceil((end - today) / 86400000);
                return { status: 'during', dayOf, daysLeft };
            }

            if (today < start) {
                const daysUntil = Math.ceil((start - today) / 86400000);
                return { status: 'before', daysUntil };
            }
        }
        return { status: 'unknown' };
    }

    function renderRamadanCountdown() {
        const el = $('#ramadan-countdown');
        const info = getRamadanInfo();

        if (info.status === 'before') {
            el.classList.remove('hidden');
            el.innerHTML = `
                <div class="countdown-card countdown-before">
                    <div class="countdown-moon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                    </div>
                    <div class="countdown-text">
                        <div class="countdown-label">Ramadan begins in</div>
                        <div class="countdown-value">${info.daysUntil} day${info.daysUntil !== 1 ? 's' : ''}</div>
                    </div>
                </div>
            `;
        } else if (info.status === 'during') {
            el.classList.remove('hidden');
            el.innerHTML = `
                <div class="countdown-card countdown-during">
                    <div class="countdown-moon active">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
                    </div>
                    <div class="countdown-text">
                        <div class="countdown-label">Ramadan Mubarak! Day ${info.dayOf}</div>
                        <div class="countdown-value">${info.daysLeft} day${info.daysLeft !== 1 ? 's' : ''} remaining</div>
                    </div>
                </div>
            `;
        } else {
            el.classList.add('hidden');
        }
    }

    // ==========================================
    // Daily Goals & Timers
    // ==========================================

    function saveGoals() {
        localStorage.setItem('qc_goals', JSON.stringify(state.goals));
    }

    function saveTimers() {
        localStorage.setItem('qc_timers', JSON.stringify(state.timerData));
    }

    function initTimers() {
        const today = getToday();
        if (state.timerData.date !== today) {
            state.timerData = {
                reciteRemaining: state.goals.reciteMinutes * 60,
                listenRemaining: state.goals.listenMinutes * 60,
                date: today,
            };
            saveTimers();
        }
    }

    function formatTimer(seconds) {
        const s = Math.max(0, seconds);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${String(sec).padStart(2, '0')}`;
    }

    function updateReciteDisplay() {
        const el = $('#recite-timer-display');
        if (el) el.textContent = formatTimer(state.timerData.reciteRemaining);
        const homeEl = $('#recite-remaining-home');
        if (homeEl) {
            if (state.timerData.reciteRemaining <= 0) {
                homeEl.textContent = 'Complete!';
                homeEl.classList.add('goal-complete');
            } else {
                homeEl.textContent = formatTimer(state.timerData.reciteRemaining) + ' left';
                homeEl.classList.remove('goal-complete');
            }
        }
    }

    function updateListenDisplay() {
        const el = $('#listen-timer-display');
        if (el) el.textContent = formatTimer(state.timerData.listenRemaining);
        const homeEl = $('#listen-remaining-home');
        if (homeEl) {
            if (state.timerData.listenRemaining <= 0) {
                homeEl.textContent = 'Complete!';
                homeEl.classList.add('goal-complete');
            } else {
                homeEl.textContent = formatTimer(state.timerData.listenRemaining) + ' left';
                homeEl.classList.remove('goal-complete');
            }
        }
    }

    function startReciteTimer() {
        if (reciteInterval || state.timerData.reciteRemaining <= 0) return;
        reciteInterval = setInterval(() => {
            state.timerData.reciteRemaining--;
            updateReciteDisplay();
            if (state.timerData.reciteRemaining <= 0) {
                stopReciteTimer();
                showToast(t('reciteGoalComplete'));
            }
            if (state.timerData.reciteRemaining % 10 === 0) saveTimers();
        }, 1000);
        $('#recite-play-icon').classList.add('hidden');
        $('#recite-pause-icon').classList.remove('hidden');
    }

    function stopReciteTimer() {
        if (reciteInterval) {
            clearInterval(reciteInterval);
            reciteInterval = null;
        }
        saveTimers();
        const playIcon = $('#recite-play-icon');
        const pauseIcon = $('#recite-pause-icon');
        if (playIcon) playIcon.classList.remove('hidden');
        if (pauseIcon) pauseIcon.classList.add('hidden');
    }

    function startListenTimer() {
        if (listenInterval || state.timerData.listenRemaining <= 0) return;
        listenInterval = setInterval(() => {
            state.timerData.listenRemaining--;
            updateListenDisplay();
            if (state.timerData.listenRemaining <= 0) {
                stopListenTimer();
                showToast(t('listenGoalComplete'));
            }
            if (state.timerData.listenRemaining % 10 === 0) saveTimers();
        }, 1000);
    }

    function stopListenTimer() {
        if (listenInterval) {
            clearInterval(listenInterval);
            listenInterval = null;
        }
        saveTimers();
    }

    function showTimerBar() {
        const bar = $('#reader-timer-bar');
        const recite = $('#recite-timer');
        const listen = $('#listen-timer');
        if (!bar) return;

        const hasRecite = state.timerData.reciteRemaining > 0;
        const hasListen = state.timerData.listenRemaining > 0;

        recite.classList.toggle('hidden', !hasRecite);
        listen.classList.toggle('hidden', !hasListen);
        bar.classList.toggle('hidden', !hasRecite && !hasListen);

        updateReciteDisplay();
        updateListenDisplay();
    }

    function updateGoalDisplays() {
        const rd = $('#recite-target-display');
        const ld = $('#listen-target-display');
        if (rd) rd.textContent = state.goals.reciteMinutes;
        if (ld) ld.textContent = state.goals.listenMinutes;
        updateReciteDisplay();
        updateListenDisplay();
    }

    function adjustGoal(type, delta) {
        const key = type === 'recite' ? 'reciteMinutes' : 'listenMinutes';
        state.goals[key] = Math.max(5, Math.min(120, state.goals[key] + delta));
        saveGoals();

        // Also update today's remaining if increasing
        const remKey = type === 'recite' ? 'reciteRemaining' : 'listenRemaining';
        state.timerData[remKey] = state.goals[key] * 60;
        saveTimers();

        updateGoalDisplays();
    }

    // ==========================================
    // Event Listeners
    // ==========================================

    function setupEvents() {
        // Navigation
        $('#btn-home').addEventListener('click', () => showView('home'));
        $('#btn-bookmarks').addEventListener('click', () => showView('bookmarks'));
        $('#btn-ramadan').addEventListener('click', () => showView('ramadan'));
        $('#btn-settings').addEventListener('click', () => showView('settings'));

        // Search
        $('#btn-search-toggle').addEventListener('click', () => {
            dom.searchBar.classList.toggle('hidden');
            if (!dom.searchBar.classList.contains('hidden')) {
                dom.searchInput.focus();
            }
        });

        $('#btn-search-close').addEventListener('click', () => {
            dom.searchBar.classList.add('hidden');
            dom.searchInput.value = '';
            renderSurahList(state.filter);
        });

        dom.searchInput.addEventListener('input', (e) => {
            renderSurahList(state.filter, e.target.value.toLowerCase());
        });

        // Filter tabs
        $$('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                $$('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                state.filter = tab.dataset.filter;
                renderSurahList(state.filter, dom.searchInput.value.toLowerCase());
            });
        });

        // Theme toggle
        $('#btn-theme').addEventListener('click', () => {
            applyTheme(!state.settings.darkMode);
            $('#setting-dark-mode').checked = state.settings.darkMode;
        });

        // Reader
        $('#btn-back').addEventListener('click', () => {
            showView('home');
        });

        $('#btn-prev-surah').addEventListener('click', () => {
            if (state.currentSurah && state.currentSurah.number > 1) {
                stopAudio();
                openSurah(state.currentSurah.number - 1);
            }
        });

        $('#btn-next-surah').addEventListener('click', () => {
            if (state.currentSurah && state.currentSurah.number < 114) {
                stopAudio();
                openSurah(state.currentSurah.number + 1);
            }
        });

        // Reciter & Translation change
        dom.selectReciter.addEventListener('change', (e) => {
            state.settings.reciter = e.target.value;
            saveSettings();
            if (state.currentSurah) {
                stopAudio();
                openSurah(state.currentSurah.number);
            }
        });

        dom.selectTranslation.addEventListener('change', (e) => {
            state.settings.translation = e.target.value;
            saveSettings();
            if (state.currentSurah) {
                openSurah(state.currentSurah.number);
            }
        });

        // Font size
        $('#btn-font-decrease').addEventListener('click', () => updateFontSize(-2));
        $('#btn-font-increase').addEventListener('click', () => updateFontSize(2));

        // Tajweed toggle
        $('#btn-tajweed').addEventListener('click', () => {
            state.settings.tajweed = !state.settings.tajweed;
            saveSettings();
            $('#btn-tajweed').classList.toggle('active', state.settings.tajweed);
            $('#tajweed-legend').classList.toggle('hidden', !state.settings.tajweed);
            // Reload current surah with tajweed edition
            if (state.currentSurah) {
                stopAudio();
                openSurah(state.currentSurah.number);
            }
        });

        // Audio controls
        $('#btn-audio-play').addEventListener('click', togglePlayPause);
        $('#btn-audio-next').addEventListener('click', playNext);
        $('#btn-audio-prev').addEventListener('click', playPrev);
        $('#btn-audio-close').addEventListener('click', stopAudio);

        $('#btn-audio-repeat').addEventListener('click', () => {
            state.audioState.repeat = !state.audioState.repeat;
            $('#btn-audio-repeat').classList.toggle('active', state.audioState.repeat);
            showToast(state.audioState.repeat ? t('repeatOn') : t('repeatOff'));
        });

        // Bookmark surah button in reader
        $('#btn-bookmark-surah').addEventListener('click', () => {
            if (!state.currentSurah) return;
            // Bookmark verse 1 of current surah as a quick-access
            if (state.currentVerses.arabic.ayahs.length > 0) {
                toggleBookmark(0);
            }
        });

        // Settings toggles
        $('#setting-language').addEventListener('change', (e) => {
            state.settings.language = e.target.value;
            saveSettings();
            applyLanguage();
            // Re-render dynamic content in current view
            if (state.currentView === 'home') renderHero();
            if (state.currentView === 'reader' && state.currentSurah) renderVerses();
            if (state.currentView === 'bookmarks') renderBookmarks();
        });

        $('#setting-dark-mode').addEventListener('change', (e) => {
            applyTheme(e.target.checked);
        });

        $('#setting-translation').addEventListener('change', (e) => {
            state.settings.showTranslation = e.target.checked;
            saveSettings();
            if (state.currentSurah) renderVerses();
        });

        $('#setting-autoscroll').addEventListener('change', (e) => {
            state.settings.autoScroll = e.target.checked;
            saveSettings();
        });

        $('#setting-arabic-numbers').addEventListener('change', (e) => {
            state.settings.arabicNumbers = e.target.checked;
            saveSettings();
            if (state.currentSurah) renderVerses();
        });

        $('#btn-reset').addEventListener('click', () => {
            if (confirm(t('confirmReset'))) {
                localStorage.removeItem('qc_bookmarks');
                localStorage.removeItem('qc_progress');
                localStorage.removeItem('qc_ramadan');
                localStorage.removeItem('qc_streak');
                localStorage.removeItem('qc_settings');
                localStorage.removeItem('qc_last_read');
                localStorage.removeItem('qc_fontsize');
                localStorage.removeItem('qc_goals');
                localStorage.removeItem('qc_timers');
                location.reload();
            }
        });

        // Goal adjusters
        $('#btn-recite-up').addEventListener('click', () => adjustGoal('recite', 5));
        $('#btn-recite-down').addEventListener('click', () => adjustGoal('recite', -5));
        $('#btn-listen-up').addEventListener('click', () => adjustGoal('listen', 5));
        $('#btn-listen-down').addEventListener('click', () => adjustGoal('listen', -5));

        // Recite timer toggle
        $('#btn-recite-toggle').addEventListener('click', () => {
            if (reciteInterval) {
                stopReciteTimer();
            } else {
                startReciteTimer();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

            if (e.key === ' ' && state.currentView === 'reader') {
                e.preventDefault();
                togglePlayPause();
            }
            if (e.key === 'ArrowRight' && state.currentView === 'reader') {
                playNext();
            }
            if (e.key === 'ArrowLeft' && state.currentView === 'reader') {
                playPrev();
            }
            if (e.key === 'Escape') {
                if (!dom.searchBar.classList.contains('hidden')) {
                    dom.searchBar.classList.add('hidden');
                    dom.searchInput.value = '';
                    renderSurahList(state.filter);
                } else if (state.currentView !== 'home') {
                    showView('home');
                }
            }
        });
    }

    // ==========================================
    // Init
    // ==========================================

    async function init() {
        // Apply saved settings
        applyTheme(state.settings.darkMode);
        applyLanguage();
        $('#setting-dark-mode').checked = state.settings.darkMode;
        $('#setting-translation').checked = state.settings.showTranslation;
        $('#setting-autoscroll').checked = state.settings.autoScroll;
        $('#setting-arabic-numbers').checked = state.settings.arabicNumbers;
        $('#setting-language').value = state.settings.language || 'en';
        dom.selectReciter.value = state.settings.reciter;
        dom.selectTranslation.value = state.settings.translation;
        dom.fontSizeDisplay.textContent = state.fontSize;

        // Tajweed state
        $('#btn-tajweed').classList.toggle('active', state.settings.tajweed);
        $('#tajweed-legend').classList.toggle('hidden', !state.settings.tajweed);

        initTimers();
        setupEvents();

        try {
            await loadSurahList();
            renderSurahList();
            renderHero();
            renderRamadanCountdown();
            updateGoalDisplays();
        } catch (err) {
            dom.surahList.innerHTML = `
                <div style="text-align:center;padding:2rem;color:var(--danger);">
                    <p>${t('failedLoadData')}</p>
                    <button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1rem;border:1px solid;border-radius:8px;cursor:pointer;background:transparent;color:inherit;">${t('retry')}</button>
                </div>
            `;
        }

        // Hide loading screen
        setTimeout(() => {
            dom.loadingScreen.classList.add('fade-out');
            dom.app.classList.remove('hidden');
            setTimeout(() => dom.loadingScreen.remove(), 500);
            handleHashRoute();
        }, 1600);
    }

    // ==========================================
    // PWA — Service Worker & Install Prompt
    // ==========================================

    let deferredInstallPrompt = null;

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch(() => {});
        }
    }

    // Capture the install prompt for later use
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        showInstallBanner();
    });

    function showInstallBanner() {
        // Don't show if already in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches) return;
        if (navigator.standalone) return;

        // Remove existing
        document.querySelectorAll('.install-banner').forEach(b => b.remove());

        const banner = document.createElement('div');
        banner.className = 'install-banner';
        banner.innerHTML = `
            <div class="install-banner-text">
                <strong>Install Quran Companion</strong>
                <span>Add to home screen for the full experience</span>
            </div>
            <button class="install-banner-btn" id="btn-install">Install</button>
            <button class="install-banner-close" id="btn-install-dismiss">&times;</button>
        `;
        document.body.appendChild(banner);

        document.getElementById('btn-install').addEventListener('click', async () => {
            if (deferredInstallPrompt) {
                deferredInstallPrompt.prompt();
                const { outcome } = await deferredInstallPrompt.userChoice;
                if (outcome === 'accepted') {
                    showToast(t('appInstalled'));
                }
                deferredInstallPrompt = null;
            }
            banner.remove();
        });

        document.getElementById('btn-install-dismiss').addEventListener('click', () => {
            banner.remove();
        });
    }

    // Handle URL hash for shortcuts
    function handleHashRoute() {
        const hash = location.hash.replace('#', '');
        if (hash === 'bookmarks') showView('bookmarks');
        else if (hash === 'ramadan') showView('ramadan');
    }

    window.addEventListener('hashchange', handleHashRoute);

    // Start the app
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { init(); registerServiceWorker(); });
    } else {
        init();
        registerServiceWorker();
    }
})();
