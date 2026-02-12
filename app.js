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
            // Sunnah Tasks
            sunnahTasks: 'Daily Sunnah',
            sunnahTasksDesc: 'Recommended daily Quran readings from the Sunnah',
            sunnahCompleted: 'Completed today',
            sunnahPending: 'Tap to read',
            sunnahReward: 'Masha Allah!',
            sunnahRewardSub: 'You completed a Sunnah reading!',
            sunnahDone: 'Done',
            sunnahReadNow: 'Read Now',
            sunnahAllDone: 'All Sunnah tasks completed today!',
            sunnahTask_baqarahLast2: 'Last 2 Ayahs of Al-Baqarah',
            sunnahTask_baqarahLast2Desc: 'Whoever recites them at night, they will suffice him',
            sunnahTask_kahf: 'Surah Al-Kahf (Friday)',
            sunnahTask_kahfDesc: 'A light between two Fridays',
            sunnahTask_mulk: 'Surah Al-Mulk',
            sunnahTask_mulkDesc: 'Protection from the punishment of the grave',
            sunnahTask_ikhlas3: 'Surah Al-Ikhlas 3 times',
            sunnahTask_ikhlas3Desc: 'Equal to reciting the entire Quran',
            sunnahTask_muawwidhat: 'Al-Falaq & An-Nas',
            sunnahTask_muawwidhatDesc: 'Morning and evening protection',
            sunnahTask_sajdah: 'Surah As-Sajdah',
            sunnahTask_sajdahDesc: 'Recited by the Prophet before sleeping',
            sunnahTask_ayatulKursi: 'Ayatul Kursi (Al-Baqarah 255)',
            sunnahTask_ayatulKursiDesc: 'Greatest verse — protection until morning',
            // New UI/UX strings
            offlineMessage: 'You are offline. Some features may be unavailable.',
            searchBookmarks: 'Search bookmarks...',
            sortNewest: 'Newest First',
            sortOldest: 'Oldest First',
            sortSurah: 'By Surah',
            shareProgress: 'Share Progress',
            shareProgressText: 'I completed {n}/30 Juz ({p}%) of the Quran this Ramadan!',
            verseNotes: 'Verse Notes',
            notesPlaceholder: 'Write your personal reflections...',
            saveNote: 'Save Note',
            deleteNote: 'Delete',
            cancel: 'Cancel',
            confirmResetLong: 'This will permanently delete all your reading progress, bookmarks, notes, and settings. This action cannot be undone.',
            notesSaved: 'Note saved',
            notesDeleted: 'Note deleted',
            verseShared: 'Verse shared',
            readingStats: 'Reading Stats',
            versesRead: 'Verses Read',
            timeSpent: 'Min Read',
            dayStreak: 'Day Streak',
            thisWeek: 'This Week',
            hoverVerseHint: 'Hover any verse for actions',
            tapVerseHint: 'Tap any verse for actions',
            share: 'Share',
            note: 'Note',
            keyboardShortcuts: 'Shortcuts: Space=Play, B=Bookmark, N=Note, ←→=Navigate',
            // Leaderboard / Community
            leaderboard: 'Community',
            leaderboardDesc: 'See how you compare — all anonymous, all for Allah',
            leaderboardLoading: 'Connecting...',
            leaderboardOfflineHint: 'Leaderboard requires an internet connection',
            myRank: 'Your Rank',
            outOf: 'out of',
            readers: 'readers',
            top10Today: "Today's Top Readers",
            versesToday: 'verses today',
            minutesToday: 'min listened',
            totalVerses: 'Total Verses',
            totalListening: 'Listening',
            noActivity: 'No activity yet today — start reading!',
            leaderboardUpdated: 'Leaderboard updated',
            you: 'You',
            rank: 'Rank',
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
            // Sunnah Tasks
            sunnahTasks: 'السنن اليومية',
            sunnahTasksDesc: 'قراءات قرآنية يومية مستحبة من السنة',
            sunnahCompleted: 'مكتمل اليوم',
            sunnahPending: 'اضغط للقراءة',
            sunnahReward: 'ما شاء الله!',
            sunnahRewardSub: 'أكملت قراءة سنة!',
            sunnahDone: 'تم',
            sunnahReadNow: 'اقرأ الآن',
            sunnahAllDone: 'أكملت جميع سنن اليوم!',
            sunnahTask_baqarahLast2: 'آخر آيتين من البقرة',
            sunnahTask_baqarahLast2Desc: 'من قرأهما في ليلة كفتاه',
            sunnahTask_kahf: 'سورة الكهف (الجمعة)',
            sunnahTask_kahfDesc: 'نور بين الجمعتين',
            sunnahTask_mulk: 'سورة الملك',
            sunnahTask_mulkDesc: 'تمنع من عذاب القبر',
            sunnahTask_ikhlas3: 'سورة الإخلاص ٣ مرات',
            sunnahTask_ikhlas3Desc: 'تعدل قراءة القرآن كاملاً',
            sunnahTask_muawwidhat: 'الفلق والناس',
            sunnahTask_muawwidhatDesc: 'حماية الصباح والمساء',
            sunnahTask_sajdah: 'سورة السجدة',
            sunnahTask_sajdahDesc: 'كان النبي ﷺ يقرأها قبل النوم',
            sunnahTask_ayatulKursi: 'آية الكرسي (البقرة ٢٥٥)',
            sunnahTask_ayatulKursiDesc: 'أعظم آية — حماية حتى الصباح',
            // New UI/UX strings
            offlineMessage: 'أنت غير متصل بالإنترنت. بعض الميزات قد لا تكون متاحة.',
            searchBookmarks: 'ابحث في المحفوظات...',
            sortNewest: 'الأحدث أولاً',
            sortOldest: 'الأقدم أولاً',
            sortSurah: 'حسب السورة',
            shareProgress: 'شارك تقدمك',
            shareProgressText: 'أكملت {n}/30 جزء ({p}%) من القرآن في رمضان!',
            verseNotes: 'ملاحظات الآية',
            notesPlaceholder: 'اكتب تأملاتك الشخصية...',
            saveNote: 'حفظ الملاحظة',
            deleteNote: 'حذف',
            cancel: 'إلغاء',
            confirmResetLong: 'سيتم حذف جميع بيانات القراءة والمحفوظات والملاحظات والإعدادات نهائياً. لا يمكن التراجع عن هذا الإجراء.',
            notesSaved: 'تم حفظ الملاحظة',
            notesDeleted: 'تم حذف الملاحظة',
            verseShared: 'تمت المشاركة',
            readingStats: 'إحصائيات القراءة',
            versesRead: 'آيات مقروءة',
            timeSpent: 'دقيقة قراءة',
            dayStreak: 'أيام متتالية',
            thisWeek: 'هذا الأسبوع',
            hoverVerseHint: 'حرّك المؤشر على أي آية لرؤية الخيارات',
            tapVerseHint: 'اضغط على أي آية لرؤية الخيارات',
            share: 'مشاركة',
            note: 'ملاحظة',
            keyboardShortcuts: 'اختصارات: مسافة=تشغيل، B=حفظ، N=ملاحظة، ←→=تنقل',
            // Leaderboard / Community
            leaderboard: 'المجتمع',
            leaderboardDesc: 'قارن تقدمك — الكل مجهول، الكل لله',
            leaderboardLoading: 'جاري الاتصال...',
            leaderboardOfflineHint: 'لوحة المتصدرين تتطلب اتصالاً بالإنترنت',
            myRank: 'ترتيبك',
            outOf: 'من',
            readers: 'قارئ',
            top10Today: 'أفضل القراء اليوم',
            versesToday: 'آية اليوم',
            minutesToday: 'دقيقة استماع',
            totalVerses: 'إجمالي الآيات',
            totalListening: 'الاستماع',
            noActivity: 'لا نشاط حتى الآن — ابدأ القراءة!',
            leaderboardUpdated: 'تم تحديث لوحة المتصدرين',
            you: 'أنت',
            rank: 'الترتيب',
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
        versePositions: JSON.parse(localStorage.getItem('qc_verse_positions') || '{}'),
        ramadanPlan: JSON.parse(localStorage.getItem('qc_ramadan') || '{"completedDays":[]}'),
        streak: JSON.parse(localStorage.getItem('qc_streak') || '{"count":0,"lastDate":null}'),
        settings: JSON.parse(localStorage.getItem('qc_settings') || '{}'),
        activeSunnahTask: null,
        audioState: { playing: false, currentIndex: 0, repeat: false },
        fontSize: parseInt(localStorage.getItem('qc_fontsize') || '28'),
        goals: JSON.parse(localStorage.getItem('qc_goals') || '{"reciteMinutes":30,"listenMinutes":15}'),
        timerData: JSON.parse(localStorage.getItem('qc_timers') || '{"reciteRemaining":null,"listenRemaining":null,"date":null}'),
        notes: JSON.parse(localStorage.getItem('qc_notes') || '{}'),
        readingHistory: JSON.parse(localStorage.getItem('qc_reading_history') || '{}'),
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
    // Firebase — Anonymous Leaderboard
    // ==========================================
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyPlaceholder-ReplaceWithYourKey",
        authDomain: "quran-companion-ramadan.firebaseapp.com",
        projectId: "quran-companion-ramadan",
        storageBucket: "quran-companion-ramadan.appspot.com",
        messagingSenderId: "000000000000",
        appId: "1:000000000000:web:placeholder"
    };

    let fb = { app: null, auth: null, db: null, uid: null, ready: false };

    function initFirebase() {
        if (typeof firebase === 'undefined') return;
        try {
            fb.app = firebase.initializeApp(FIREBASE_CONFIG);
            fb.auth = firebase.auth();
            fb.db = firebase.firestore();
            // Enable offline persistence
            fb.db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
            // Anonymous sign-in
            fb.auth.signInAnonymously().then(cred => {
                fb.uid = cred.user.uid;
                fb.ready = true;
                // Sync local stats to Firestore on sign-in
                syncStatsToFirestore();
            }).catch(() => {
                fb.ready = false;
            });
        } catch (e) {
            fb.ready = false;
        }
    }

    function syncStatsToFirestore() {
        if (!fb.ready || !fb.db || !fb.uid) return;
        const today = getToday();
        const todayData = state.readingHistory[today] || { versesRead: 0, minutesRead: 0 };
        const totalVersesRead = Object.values(state.readingHistory).reduce((sum, d) => sum + (d.versesRead || 0), 0);
        const totalMinutesListened = Object.values(state.readingHistory).reduce((sum, d) => sum + (d.minutesRead || 0), 0);

        fb.db.collection('daily_stats').doc(fb.uid).set({
            date: today,
            versesToday: todayData.versesRead || 0,
            minutesToday: todayData.minutesRead || 0,
            totalVerses: totalVersesRead,
            totalMinutes: totalMinutesListened,
            streak: state.streak.count || 0,
            surahsRead: Object.keys(state.readingProgress).length,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true }).catch(() => {});
    }

    async function fetchLeaderboard() {
        if (!fb.ready || !fb.db) return { entries: [], myRank: null, total: 0 };
        const today = getToday();

        try {
            const snapshot = await fb.db.collection('daily_stats')
                .where('date', '==', today)
                .orderBy('versesToday', 'desc')
                .limit(100)
                .get();

            const entries = [];
            let myRank = null;
            let myIndex = -1;

            snapshot.forEach(doc => {
                const data = doc.data();
                entries.push({
                    id: doc.id,
                    versesToday: data.versesToday || 0,
                    minutesToday: data.minutesToday || 0,
                    totalVerses: data.totalVerses || 0,
                    streak: data.streak || 0,
                    isMe: doc.id === fb.uid,
                });
            });

            // Find my rank
            for (let i = 0; i < entries.length; i++) {
                if (entries[i].isMe) {
                    myIndex = i;
                    myRank = i + 1;
                    break;
                }
            }

            return {
                entries: entries.slice(0, 10),
                myRank,
                myEntry: myIndex >= 0 ? entries[myIndex] : null,
                total: entries.length,
            };
        } catch (e) {
            return { entries: [], myRank: null, total: 0 };
        }
    }

    function renderLeaderboard(data) {
        const listEl = $('#leaderboard-list');
        const myRankEl = $('#leaderboard-my-rank');
        const emptyEl = $('#leaderboard-empty');

        if (!listEl) return;

        if (!data || (!data.entries.length && !data.myEntry)) {
            listEl.innerHTML = '';
            myRankEl.innerHTML = '';
            emptyEl.classList.remove('hidden');
            return;
        }

        emptyEl.classList.add('hidden');

        // My rank card
        if (data.myEntry) {
            myRankEl.innerHTML = `
                <div class="lb-my-card">
                    <div class="lb-my-rank-circle">
                        <span class="lb-my-rank-num">${data.myRank ? '#' + data.myRank : '—'}</span>
                    </div>
                    <div class="lb-my-info">
                        <div class="lb-my-title">${t('myRank')}</div>
                        <div class="lb-my-subtitle">${data.myRank ? data.myRank + ' ' + t('outOf') + ' ' + data.total + ' ' + t('readers') : t('noActivity')}</div>
                    </div>
                    <div class="lb-my-stats">
                        <div class="lb-my-stat">
                            <span class="lb-my-stat-value">${data.myEntry.versesToday}</span>
                            <span class="lb-my-stat-label">${t('versesToday')}</span>
                        </div>
                        <div class="lb-my-stat">
                            <span class="lb-my-stat-value">${data.myEntry.minutesToday}</span>
                            <span class="lb-my-stat-label">${t('minutesToday')}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            myRankEl.innerHTML = `
                <div class="lb-my-card lb-no-activity">
                    <div class="lb-my-rank-circle">
                        <span class="lb-my-rank-num">—</span>
                    </div>
                    <div class="lb-my-info">
                        <div class="lb-my-title">${t('myRank')}</div>
                        <div class="lb-my-subtitle">${t('noActivity')}</div>
                    </div>
                </div>
            `;
        }

        // Top 10 list
        let html = `<h3 class="lb-section-title">${t('top10Today')}</h3>`;
        html += '<div class="lb-entries">';

        data.entries.forEach((entry, i) => {
            const rank = i + 1;
            const isMe = entry.isMe;
            const medalClass = rank === 1 ? 'lb-gold' : rank === 2 ? 'lb-silver' : rank === 3 ? 'lb-bronze' : '';

            html += `
                <div class="lb-entry ${isMe ? 'lb-entry-me' : ''} ${medalClass}">
                    <div class="lb-rank">
                        ${rank <= 3 ? `<span class="lb-medal">${rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>` : `<span class="lb-rank-num">${rank}</span>`}
                    </div>
                    <div class="lb-bar-area">
                        <div class="lb-bar-track">
                            <div class="lb-bar-fill" style="width: ${data.entries[0].versesToday > 0 ? Math.max(4, (entry.versesToday / data.entries[0].versesToday) * 100) : 4}%"></div>
                        </div>
                        <div class="lb-entry-stats">
                            <span class="lb-verses">${entry.versesToday} ${t('versesToday')}</span>
                            ${isMe ? `<span class="lb-you-badge">${t('you')}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        listEl.innerHTML = html;
    }

    async function loadAndRenderLeaderboard() {
        const listEl = $('#leaderboard-list');
        const emptyEl = $('#leaderboard-empty');
        const myRankEl = $('#leaderboard-my-rank');

        if (!fb.ready) {
            if (listEl) listEl.innerHTML = '';
            if (myRankEl) myRankEl.innerHTML = '';
            if (emptyEl) emptyEl.classList.remove('hidden');
            return;
        }

        // Show loading state
        if (listEl) {
            listEl.innerHTML = `
                <div class="lb-loading">
                    <div class="skeleton skeleton-line" style="width:100%;height:48px;margin-bottom:8px"></div>
                    <div class="skeleton skeleton-line" style="width:95%;height:48px;margin-bottom:8px"></div>
                    <div class="skeleton skeleton-line" style="width:88%;height:48px;margin-bottom:8px"></div>
                </div>
            `;
        }

        const data = await fetchLeaderboard();
        renderLeaderboard(data);
    }

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

    // ==========================================
    // Verse Position Tracking
    // ==========================================

    let currentVisibleVerse = 1;
    let verseObserver = null;
    let savePositionTimer = null;

    function setupVerseTracking() {
        if (verseObserver) verseObserver.disconnect();

        const verses = dom.versesContainer.querySelectorAll('.verse');
        if (verses.length === 0) return;

        verseObserver = new IntersectionObserver((entries) => {
            let topVerse = null;
            let topY = Infinity;
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    const rect = entry.boundingClientRect;
                    if (rect.top < topY) {
                        topY = rect.top;
                        topVerse = entry.target;
                    }
                }
            }
            if (topVerse) {
                const num = parseInt(topVerse.dataset.verseInSurah);
                if (num && num !== currentVisibleVerse) {
                    currentVisibleVerse = num;
                    debouncedSavePosition();
                }
            }
        }, {
            root: null,
            rootMargin: '-10% 0px -70% 0px',
            threshold: 0
        });

        verses.forEach(v => verseObserver.observe(v));
    }

    function debouncedSavePosition() {
        if (savePositionTimer) clearTimeout(savePositionTimer);
        savePositionTimer = setTimeout(() => {
            saveReadingPosition();
            // Check sunnah task completion when user scrolls to target verses
            if (state.currentSurah) {
                checkSunnahCompletion(state.currentSurah.number);
            }
        }, 1000);
    }

    function saveReadingPosition() {
        if (!state.currentSurah) return;
        const number = state.currentSurah.number;

        state.versePositions[number] = currentVisibleVerse;
        localStorage.setItem('qc_verse_positions', JSON.stringify(state.versePositions));

        localStorage.setItem('qc_last_read', JSON.stringify({
            surahNumber: number,
            surahName: state.currentSurah.englishName,
            surahNameAr: state.currentSurah.name,
            verse: currentVisibleVerse,
        }));
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

            const noteKey = `${surahNum}:${ayah.numberInSurah}`;
            const hasNote = !!state.notes[noteKey];

            return `
                <div class="verse" data-index="${i}" data-verse-number="${ayah.number}" data-verse-in-surah="${ayah.numberInSurah}">
                    <div class="verse-arabic" style="font-size: ${state.fontSize}px">
                        ${arabicContent}
                    </div>
                    ${showTranslation ? `<div class="verse-translation">${ayah.numberInSurah}. ${translationText}</div>` : ''}
                    <span class="verse-ref-tag">${surahNum}:${ayah.numberInSurah}</span>
                    ${hasNote ? `<div class="verse-note-indicator" data-surah="${surahNum}" data-verse="${ayah.numberInSurah}"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8" fill="none" stroke="currentColor" stroke-width="2"/></svg> ${t('note')}</div>` : ''}
                    <div class="verse-actions">
                        <button class="verse-action-btn btn-play-verse" data-index="${i}" title="${t('play')}" aria-label="Play verse ${ayah.numberInSurah}">
                            <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            ${t('play')}
                        </button>
                        <button class="verse-action-btn btn-bookmark-verse ${isBookmarked ? 'bookmarked' : ''}" data-number="${ayah.number}" data-index="${i}" title="${t('bookmark')}" aria-label="${isBookmarked ? 'Remove bookmark' : 'Bookmark verse'}">
                            <svg viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                            ${isBookmarked ? t('savedBtn') : t('save')}
                        </button>
                        <button class="verse-action-btn btn-copy-verse" data-index="${i}" title="${t('copy')}" aria-label="Copy verse">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                            ${t('copy')}
                        </button>
                        <button class="verse-action-btn btn-share-verse" data-index="${i}" title="${t('share')}" aria-label="Share verse">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                            ${t('share')}
                        </button>
                        <button class="verse-action-btn btn-note-verse" data-index="${i}" data-surah="${surahNum}" data-verse="${ayah.numberInSurah}" title="${t('note')}" aria-label="Add note">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            ${t('note')}
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

        dom.versesContainer.querySelectorAll('.btn-share-verse').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                shareVerse(parseInt(btn.dataset.index));
            });
        });

        dom.versesContainer.querySelectorAll('.btn-note-verse').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openNoteModal(parseInt(btn.dataset.surah), parseInt(btn.dataset.verse));
            });
        });

        dom.versesContainer.querySelectorAll('.verse-note-indicator').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                openNoteModal(parseInt(el.dataset.surah), parseInt(el.dataset.verse));
            });
        });

        // Track reading activity for statistics
        trackReadingActivity();
    }

    function renderBookmarks(searchQuery, sortBy) {
        const controls = $('#bookmark-controls');
        if (state.bookmarks.length === 0) {
            dom.bookmarksList.classList.add('hidden');
            dom.bookmarksEmpty.classList.remove('hidden');
            if (controls) controls.classList.add('hidden');
            return;
        }
        dom.bookmarksList.classList.remove('hidden');
        dom.bookmarksEmpty.classList.add('hidden');
        if (controls) controls.classList.remove('hidden');

        // Filter by search
        const query = (searchQuery || '').toLowerCase();
        let filtered = state.bookmarks.map((bm, i) => ({ ...bm, originalIndex: i }));
        if (query) {
            filtered = filtered.filter(bm =>
                bm.surahName.toLowerCase().includes(query) ||
                bm.translation.toLowerCase().includes(query) ||
                bm.arabic.includes(query) ||
                String(bm.surahNumber).includes(query) ||
                String(bm.verseInSurah).includes(query)
            );
        }

        // Sort
        const sort = sortBy || 'newest';
        if (sort === 'oldest') {
            filtered = [...filtered].reverse();
        } else if (sort === 'surah') {
            filtered.sort((a, b) => a.surahNumber - b.surahNumber || a.verseInSurah - b.verseInSurah);
        }

        dom.bookmarksList.innerHTML = filtered.map(bm => `
            <div class="bookmark-card" data-surah="${bm.surahNumber}" data-verse="${bm.verseInSurah}">
                <div class="bookmark-header">
                    <span class="bookmark-surah">${bm.surahName} ${bm.surahNumber}:${bm.verseInSurah}</span>
                    <button class="bookmark-remove" data-index="${bm.originalIndex}" title="Remove" aria-label="Remove bookmark">
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
        const viewEl = $(`#view-${viewName}`);
        viewEl.classList.remove('hidden');
        viewEl.classList.add('view-enter');
        setTimeout(() => viewEl.classList.remove('view-enter'), 350);
        state.currentView = viewName;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Update active indicators (header)
        $$('.header-right .icon-btn').forEach(btn => btn.removeAttribute('data-active'));
        if (viewName === 'bookmarks') $('#btn-bookmarks').setAttribute('data-active', 'true');
        else if (viewName === 'ramadan') $('#btn-ramadan').setAttribute('data-active', 'true');
        else if (viewName === 'leaderboard') $('#btn-leaderboard').setAttribute('data-active', 'true');
        else if (viewName === 'settings') $('#btn-settings').setAttribute('data-active', 'true');

        // Update bottom nav
        updateBottomNav(viewName);

        // Stop recite timer when leaving reader
        if (viewName !== 'reader') {
            stopReciteTimer();
        }

        // Show/hide keyboard hints
        const kbHint = $('#keyboard-hint');
        if (kbHint) kbHint.style.display = viewName === 'reader' ? '' : 'none';

        // Render view-specific content
        if (viewName === 'home') {
            renderHero();
            renderRamadanCountdown();
            renderSunnahTasks();
            updateGoalDisplays();
            renderReadingStats();
        } else if (viewName === 'reader') {
            showTimerBar();
        } else if (viewName === 'bookmarks') {
            renderBookmarks();
        } else if (viewName === 'ramadan') {
            renderRamadanPlan();
        } else if (viewName === 'leaderboard') {
            loadAndRenderLeaderboard();
        }
    }

    function updateBottomNav(viewName) {
        $$('.bottom-nav-item').forEach(item => {
            const isActive = item.dataset.view === viewName ||
                (item.dataset.view === 'home' && viewName === 'reader');
            item.classList.toggle('active', isActive);
        });
    }

    async function openSurah(number, scrollToVerse = null) {
        showView('reader');

        // Show loading skeleton
        dom.versesContainer.innerHTML = Array.from({ length: 8 }, () => `
            <div class="skeleton-verse">
                <div class="skeleton skeleton-line long"></div>
                <div class="skeleton skeleton-line medium"></div>
                <div class="skeleton skeleton-line short"></div>
            </div>
        `).join('');

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

            // Determine which verse to resume from
            const targetVerse = scrollToVerse || state.versePositions[number] || null;

            // Save last read
            currentVisibleVerse = targetVerse || 1;
            localStorage.setItem('qc_last_read', JSON.stringify({
                surahNumber: number,
                surahName: surah.englishName,
                surahNameAr: surah.name,
                verse: currentVisibleVerse,
            }));

            // Setup verse position tracking
            setupVerseTracking();

            // Check Sunnah task completion for whole-surah tasks
            checkSunnahCompletion(number);

            // Update streak
            recordReading();

            // Scroll to saved/target verse
            if (targetVerse && targetVerse > 1) {
                setTimeout(() => {
                    const verseEl = dom.versesContainer.querySelector(`[data-verse-in-surah="${targetVerse}"]`);
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
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5" style="margin-bottom:1rem"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p style="font-weight:600;margin-bottom:0.5rem">${t('failedLoadSurah')}</p>
                    <p style="font-size:0.78rem;color:var(--text-tertiary);margin-bottom:1rem">${navigator.onLine ? '' : t('offlineMessage')}</p>
                    <button onclick="location.reload()" style="padding:0.6rem 1.5rem;border:1.5px solid var(--accent);border-radius:var(--radius-md);cursor:pointer;background:transparent;color:var(--accent);font-weight:600;font-family:var(--font-ui);font-size:0.88rem">${t('retry')}</button>
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
    // Sunnah Tasks
    // ==========================================

    const SUNNAH_TASKS = [
        {
            id: 'baqarahLast2',
            nameKey: 'sunnahTask_baqarahLast2',
            descKey: 'sunnahTask_baqarahLast2Desc',
            icon: '🌙',
            surah: 2,
            startVerse: 285,
            endVerse: 286,
            daily: true,
        },
        {
            id: 'ayatulKursi',
            nameKey: 'sunnahTask_ayatulKursi',
            descKey: 'sunnahTask_ayatulKursiDesc',
            icon: '🛡️',
            surah: 2,
            startVerse: 255,
            endVerse: 255,
            daily: true,
        },
        {
            id: 'mulk',
            nameKey: 'sunnahTask_mulk',
            descKey: 'sunnahTask_mulkDesc',
            icon: '📖',
            surah: 67,
            startVerse: null,
            endVerse: null,
            daily: true,
        },
        {
            id: 'ikhlas3',
            nameKey: 'sunnahTask_ikhlas3',
            descKey: 'sunnahTask_ikhlas3Desc',
            icon: '✨',
            surah: 112,
            startVerse: null,
            endVerse: null,
            daily: true,
        },
        {
            id: 'muawwidhat',
            nameKey: 'sunnahTask_muawwidhat',
            descKey: 'sunnahTask_muawwidhatDesc',
            icon: '🤲',
            surah: 113,
            startVerse: null,
            endVerse: null,
            daily: true,
            extraSurah: 114,
        },
        {
            id: 'sajdah',
            nameKey: 'sunnahTask_sajdah',
            descKey: 'sunnahTask_sajdahDesc',
            icon: '🕌',
            surah: 32,
            startVerse: null,
            endVerse: null,
            daily: true,
        },
        {
            id: 'kahf',
            nameKey: 'sunnahTask_kahf',
            descKey: 'sunnahTask_kahfDesc',
            icon: '🕋',
            surah: 18,
            startVerse: null,
            endVerse: null,
            daily: false,
            dayOfWeek: 5, // Friday
        },
    ];

    function getSunnahState() {
        const today = getToday();
        const saved = JSON.parse(localStorage.getItem('qc_sunnah') || '{}');
        if (saved.date !== today) {
            return { date: today, completed: {} };
        }
        return saved;
    }

    function saveSunnahState(sunnahState) {
        localStorage.setItem('qc_sunnah', JSON.stringify(sunnahState));
    }

    function getTodaysSunnahTasks() {
        const dayOfWeek = new Date().getDay();
        return SUNNAH_TASKS.filter(task => {
            if (task.daily) return true;
            if (task.dayOfWeek !== undefined) return dayOfWeek === task.dayOfWeek;
            return false;
        });
    }

    function renderSunnahTasks() {
        const container = $('#sunnah-tasks-container');
        if (!container) return;

        const tasks = getTodaysSunnahTasks();
        const sunnahState = getSunnahState();
        const completedCount = tasks.filter(t => sunnahState.completed[t.id]).length;
        const allDone = completedCount === tasks.length;

        container.innerHTML = `
            <div class="sunnah-header">
                <div class="sunnah-header-left">
                    <h2 class="section-title">${t('sunnahTasks')}</h2>
                    <p class="sunnah-subtitle">${t('sunnahTasksDesc')}</p>
                </div>
                <div class="sunnah-counter">${completedCount}/${tasks.length}</div>
            </div>
            ${allDone ? `<div class="sunnah-all-done"><span class="sunnah-all-done-icon">🎉</span> ${t('sunnahAllDone')}</div>` : ''}
            <div class="sunnah-tasks-list">
                ${tasks.map(task => {
                    const isDone = !!sunnahState.completed[task.id];
                    return `
                        <div class="sunnah-task ${isDone ? 'completed' : ''}" data-task-id="${task.id}">
                            <div class="sunnah-task-icon">${task.icon}</div>
                            <div class="sunnah-task-info">
                                <div class="sunnah-task-name">${t(task.nameKey)}</div>
                                <div class="sunnah-task-desc">${t(task.descKey)}</div>
                            </div>
                            <div class="sunnah-task-action">
                                ${isDone
                                    ? `<span class="sunnah-done-badge">${t('sunnahDone')} ✓</span>`
                                    : `<button class="sunnah-read-btn" data-task-id="${task.id}">${t('sunnahReadNow')}</button>`
                                }
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Attach click handlers
        container.querySelectorAll('.sunnah-read-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openSunnahTask(btn.dataset.taskId);
            });
        });

        container.querySelectorAll('.sunnah-task:not(.completed)').forEach(card => {
            card.addEventListener('click', () => {
                openSunnahTask(card.dataset.taskId);
            });
        });
    }

    function openSunnahTask(taskId) {
        const task = SUNNAH_TASKS.find(t => t.id === taskId);
        if (!task) return;

        // Store which sunnah task we are reading so we can detect completion
        state.activeSunnahTask = taskId;

        openSurah(task.surah, task.startVerse || 1);
    }

    function checkSunnahCompletion(surahNumber) {
        if (!state.activeSunnahTask) return;

        const task = SUNNAH_TASKS.find(t => t.id === state.activeSunnahTask);
        if (!task) return;

        // Check if the user opened the right surah
        const matchesSurah = task.surah === surahNumber || task.extraSurah === surahNumber;
        if (!matchesSurah) return;

        // For tasks with specific verses, check if the user scrolled to them
        if (task.startVerse && task.endVerse) {
            if (currentVisibleVerse < task.startVerse) return;
        }

        // Mark as completed
        const sunnahState = getSunnahState();
        if (!sunnahState.completed[task.id]) {
            sunnahState.completed[task.id] = true;
            saveSunnahState(sunnahState);
            showSunnahReward(task);
            state.activeSunnahTask = null;
        }
    }

    function showSunnahReward(task) {
        document.querySelectorAll('.sunnah-reward-overlay').forEach(m => m.remove());
        const overlay = document.createElement('div');
        overlay.className = 'sunnah-reward-overlay';
        overlay.innerHTML = `
            <div class="sunnah-reward-card">
                <div class="sunnah-reward-glow"></div>
                <div class="sunnah-reward-icon">${task.icon}</div>
                <div class="sunnah-reward-stars">&#9733; &#9733; &#9733;</div>
                <div class="sunnah-reward-title">${t('sunnahReward')}</div>
                <div class="sunnah-reward-sub">${t('sunnahRewardSub')}</div>
                <div class="sunnah-reward-task">${t(task.nameKey)}</div>
                <button class="sunnah-reward-btn">${t('milestoneDismiss')}</button>
            </div>
        `;
        document.body.appendChild(overlay);
        overlay.querySelector('.sunnah-reward-btn').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 6000);
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
            // Track listening minutes for leaderboard
            if (state.timerData.listenRemaining % 60 === 0) {
                const today = getToday();
                if (!state.readingHistory[today]) state.readingHistory[today] = { versesRead: 0, minutesRead: 0 };
                state.readingHistory[today].minutesRead = (state.readingHistory[today].minutesRead || 0) + 1;
                localStorage.setItem('qc_reading_history', JSON.stringify(state.readingHistory));
                syncStatsToFirestore();
            }
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
        $('#btn-home').addEventListener('click', () => {
            saveReadingPosition();
            showView('home');
        });
        $('#btn-bookmarks').addEventListener('click', () => showView('bookmarks'));
        $('#btn-ramadan').addEventListener('click', () => showView('ramadan'));
        $('#btn-leaderboard').addEventListener('click', () => showView('leaderboard'));
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
            saveReadingPosition();
            showView('home');
        });

        $('#btn-prev-surah').addEventListener('click', () => {
            if (state.currentSurah && state.currentSurah.number > 1) {
                saveReadingPosition();
                stopAudio();
                openSurah(state.currentSurah.number - 1);
            }
        });

        $('#btn-next-surah').addEventListener('click', () => {
            if (state.currentSurah && state.currentSurah.number < 114) {
                saveReadingPosition();
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

        // Reset button opens confirmation modal
        $('#btn-reset').addEventListener('click', () => {
            $('#reset-modal').classList.remove('hidden');
        });

        $('#btn-reset-cancel').addEventListener('click', () => {
            $('#reset-modal').classList.add('hidden');
        });

        $('#btn-reset-confirm').addEventListener('click', () => {
            localStorage.removeItem('qc_bookmarks');
            localStorage.removeItem('qc_progress');
            localStorage.removeItem('qc_ramadan');
            localStorage.removeItem('qc_streak');
            localStorage.removeItem('qc_settings');
            localStorage.removeItem('qc_last_read');
            localStorage.removeItem('qc_verse_positions');
            localStorage.removeItem('qc_fontsize');
            localStorage.removeItem('qc_goals');
            localStorage.removeItem('qc_timers');
            localStorage.removeItem('qc_sunnah');
            localStorage.removeItem('qc_notes');
            localStorage.removeItem('qc_reading_history');
            // Clear Firebase leaderboard data
            if (fb.ready && fb.db && fb.uid) {
                fb.db.collection('daily_stats').doc(fb.uid).delete().catch(() => {});
            }
            location.reload();
        });

        // Close modal when clicking overlay
        $('#reset-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.currentTarget.classList.add('hidden');
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

        // Enhanced keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === ' ' && state.currentView === 'reader') {
                e.preventDefault();
                togglePlayPause();
            }
            if (e.key === 'ArrowRight' && state.currentView === 'reader') {
                if (e.shiftKey) {
                    // Shift+Right = next surah
                    if (state.currentSurah && state.currentSurah.number < 114) {
                        saveReadingPosition();
                        stopAudio();
                        openSurah(state.currentSurah.number + 1);
                    }
                } else {
                    playNext();
                }
            }
            if (e.key === 'ArrowLeft' && state.currentView === 'reader') {
                if (e.shiftKey) {
                    // Shift+Left = previous surah
                    if (state.currentSurah && state.currentSurah.number > 1) {
                        saveReadingPosition();
                        stopAudio();
                        openSurah(state.currentSurah.number - 1);
                    }
                } else {
                    playPrev();
                }
            }
            // B = bookmark current visible verse
            if (e.key === 'b' && state.currentView === 'reader' && state.currentVerses.arabic.ayahs) {
                const idx = currentVisibleVerse ? currentVisibleVerse - 1 : 0;
                if (idx >= 0 && idx < state.currentVerses.arabic.ayahs.length) {
                    toggleBookmark(idx);
                }
            }
            // N = open notes for current visible verse
            if (e.key === 'n' && state.currentView === 'reader' && state.currentSurah) {
                openNoteModal(state.currentSurah.number, currentVisibleVerse || 1);
            }
            if (e.key === 'Escape') {
                // Close modals first
                const resetModal = $('#reset-modal');
                const notesModal = $('#notes-modal');
                if (!resetModal.classList.contains('hidden')) {
                    resetModal.classList.add('hidden');
                    return;
                }
                if (!notesModal.classList.contains('hidden')) {
                    notesModal.classList.add('hidden');
                    return;
                }
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
    // Verse Sharing (Web Share API)
    // ==========================================

    function shareVerse(index) {
        const arabic = state.currentVerses.arabic.ayahs[index];
        const trans = state.currentVerses.translation.ayahs[index];
        const arabicText = state.settings.tajweed ? stripHTML(parseTajweedText(arabic.text)) : arabic.text;
        const surahName = state.currentSurah.englishName;
        const ref = `${surahName} ${state.currentSurah.number}:${arabic.numberInSurah}`;
        const text = `${arabicText}\n\n${trans.text}\n\n— ${ref}`;

        if (navigator.share) {
            navigator.share({ title: ref, text: text }).catch(() => {});
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
                showToast(t('verseCopied'));
            }).catch(() => {
                showToast(t('failedCopy'));
            });
        }
    }

    // ==========================================
    // Personal Notes
    // ==========================================

    function openNoteModal(surahNum, verseNum) {
        const modal = $('#notes-modal');
        const textarea = $('#notes-textarea');
        const verseRef = $('#notes-verse-ref');
        const surah = state.surahs.find(s => s.number === surahNum);
        const surahName = surah ? surah.englishName : `Surah ${surahNum}`;

        verseRef.textContent = `${surahName} ${surahNum}:${verseNum}`;
        const noteKey = `${surahNum}:${verseNum}`;
        textarea.value = state.notes[noteKey] || '';
        modal.classList.remove('hidden');

        // Store context for save/delete
        modal.dataset.noteKey = noteKey;

        setTimeout(() => textarea.focus(), 100);
    }

    function saveNote() {
        const modal = $('#notes-modal');
        const textarea = $('#notes-textarea');
        const noteKey = modal.dataset.noteKey;
        const text = textarea.value.trim();

        if (text) {
            state.notes[noteKey] = text;
            showToast(t('notesSaved'));
        } else {
            delete state.notes[noteKey];
        }
        localStorage.setItem('qc_notes', JSON.stringify(state.notes));
        modal.classList.add('hidden');
        if (state.currentSurah) renderVerses();
    }

    function deleteNote() {
        const modal = $('#notes-modal');
        const noteKey = modal.dataset.noteKey;
        delete state.notes[noteKey];
        localStorage.setItem('qc_notes', JSON.stringify(state.notes));
        modal.classList.add('hidden');
        showToast(t('notesDeleted'));
        if (state.currentSurah) renderVerses();
    }

    // ==========================================
    // Reading Statistics
    // ==========================================

    function trackReadingActivity() {
        const today = getToday();
        if (!state.readingHistory[today]) {
            state.readingHistory[today] = { versesRead: 0, minutesRead: 0 };
        }
        // Count verses read in current surah
        if (state.currentVerses.arabic && state.currentVerses.arabic.ayahs) {
            state.readingHistory[today].versesRead += state.currentVerses.arabic.ayahs.length;
        }
        localStorage.setItem('qc_reading_history', JSON.stringify(state.readingHistory));
        // Sync to Firestore for leaderboard
        syncStatsToFirestore();
    }

    function renderReadingStats() {
        const container = $('#reading-stats-container');
        if (!container) return;

        const today = getToday();
        const todayData = state.readingHistory[today] || { versesRead: 0, minutesRead: 0 };
        const totalSurahs = Object.keys(state.readingProgress).length;
        const streakCount = state.streak.count;

        // Build week chart
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const now = new Date();
        const weekData = [];
        let maxVerses = 1;
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const data = state.readingHistory[key] || { versesRead: 0 };
            weekData.push({ day: days[d.getDay()], verses: data.versesRead, key });
            if (data.versesRead > maxVerses) maxVerses = data.versesRead;
        }

        container.innerHTML = `
            <div class="sunnah-header">
                <div class="sunnah-header-left">
                    <h2 class="section-title">${t('readingStats')}</h2>
                </div>
            </div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-card-value">${totalSurahs}</div>
                    <div class="stat-card-label">${t('surahs')}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${todayData.versesRead}</div>
                    <div class="stat-card-label">${t('versesRead')}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${streakCount}</div>
                    <div class="stat-card-label">${t('dayStreak')}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-value">${Object.keys(state.notes).length}</div>
                    <div class="stat-card-label">${t('note')}s</div>
                </div>
            </div>
            <div class="stats-chart">
                <div class="stats-chart-title">${t('thisWeek')}</div>
                <div class="stats-week-chart">
                    ${weekData.map(d => {
                        const height = Math.max(2, (d.verses / maxVerses) * 48);
                        return `
                            <div class="stats-day-bar">
                                <div class="stats-day-fill" style="height:${height}px"></div>
                                <span class="stats-day-label">${d.day}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // ==========================================
    // Ramadan Progress Sharing
    // ==========================================

    function shareRamadanProgress() {
        const completed = state.ramadanPlan.completedDays.length;
        const percent = Math.round((completed / 30) * 100);
        const text = t('shareProgressText').replace('{n}', completed).replace('{p}', percent);

        if (navigator.share) {
            navigator.share({ title: 'Ramadan Progress', text: text }).catch(() => {});
        } else {
            navigator.clipboard.writeText(text).then(() => {
                showToast(t('verseCopied'));
            }).catch(() => {});
        }
    }

    // ==========================================
    // Offline Detection
    // ==========================================

    function setupOfflineDetection() {
        const banner = $('#offline-banner');
        function updateOnlineStatus() {
            if (navigator.onLine) {
                banner.classList.add('hidden');
            } else {
                banner.classList.remove('hidden');
            }
        }
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();
    }

    // ==========================================
    // Bottom Navigation
    // ==========================================

    function setupBottomNav() {
        $$('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                if (view === 'home') {
                    saveReadingPosition();
                }
                showView(view);
            });
        });
    }

    // ==========================================
    // Swipe Gestures (Reader)
    // ==========================================

    function setupSwipeGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        let swiping = false;

        document.addEventListener('touchstart', (e) => {
            if (state.currentView !== 'reader') return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            swiping = true;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!swiping || state.currentView !== 'reader') return;
            swiping = false;
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;

            // Only count horizontal swipes (min 80px, max 45deg vertical)
            if (Math.abs(diffX) > 80 && Math.abs(diffY) < Math.abs(diffX) * 0.7) {
                if (diffX > 0) {
                    // Swipe right = previous surah
                    if (state.currentSurah && state.currentSurah.number > 1) {
                        saveReadingPosition();
                        stopAudio();
                        dom.versesContainer.classList.add('surah-transition-prev');
                        setTimeout(() => dom.versesContainer.classList.remove('surah-transition-prev'), 300);
                        openSurah(state.currentSurah.number - 1);
                    }
                } else {
                    // Swipe left = next surah
                    if (state.currentSurah && state.currentSurah.number < 114) {
                        saveReadingPosition();
                        stopAudio();
                        dom.versesContainer.classList.add('surah-transition');
                        setTimeout(() => dom.versesContainer.classList.remove('surah-transition'), 300);
                        openSurah(state.currentSurah.number + 1);
                    }
                }
            }
        }, { passive: true });
    }

    // ==========================================
    // Verse Actions Discoverability
    // ==========================================

    function showVerseActionsHint() {
        if (localStorage.getItem('qc_verse_hint_shown')) return;
        localStorage.setItem('qc_verse_hint_shown', 'true');

        const isMobile = window.innerWidth <= 600;
        const hint = document.createElement('div');
        hint.className = 'verse-actions-hint';
        hint.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> ${isMobile ? t('tapVerseHint') : t('hoverVerseHint')}`;
        document.body.appendChild(hint);
        setTimeout(() => hint.remove(), 5000);
    }

    // ==========================================
    // Bookmark Controls (Search/Sort)
    // ==========================================

    function setupBookmarkControls() {
        const searchInput = $('#bookmark-search');
        const sortSelect = $('#bookmark-sort');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                renderBookmarks(searchInput.value, sortSelect ? sortSelect.value : 'newest');
            });
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                renderBookmarks(searchInput ? searchInput.value : '', sortSelect.value);
            });
        }
    }

    // ==========================================
    // Notes Modal Events
    // ==========================================

    function setupNotesModal() {
        $('#btn-notes-save').addEventListener('click', saveNote);
        $('#btn-notes-delete').addEventListener('click', deleteNote);
        $('#btn-notes-close').addEventListener('click', () => {
            $('#notes-modal').classList.add('hidden');
        });
        $('#notes-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.currentTarget.classList.add('hidden');
            }
        });
    }

    // ==========================================
    // Keyboard Shortcuts Hint
    // ==========================================

    function createKeyboardHint() {
        if (window.innerWidth <= 600) return;
        const existing = $('#keyboard-hint');
        if (existing) return;

        const hint = document.createElement('div');
        hint.id = 'keyboard-hint';
        hint.className = 'keyboard-hint';
        hint.innerHTML = `<kbd>Space</kbd> Play &nbsp; <kbd>B</kbd> Bookmark &nbsp; <kbd>N</kbd> Note &nbsp; <kbd>Shift</kbd>+<kbd>←→</kbd> Surah`;
        hint.style.display = 'none';
        document.body.appendChild(hint);

        // Auto-hide after 8 seconds on first show
        if (!localStorage.getItem('qc_kb_hint_seen')) {
            setTimeout(() => {
                if (hint.style.display !== 'none') {
                    localStorage.setItem('qc_kb_hint_seen', 'true');
                    setTimeout(() => hint.remove(), 8000);
                }
            }, 3000);
        }
    }

    // ==========================================
    // Loading Skeletons for Surah List
    // ==========================================

    function showSurahListSkeletons() {
        dom.surahList.innerHTML = Array.from({ length: 10 }, () => `
            <div class="skeleton-surah-card">
                <div class="skeleton skeleton-circle"></div>
                <div class="skeleton-lines">
                    <div class="skeleton skeleton-line medium"></div>
                    <div class="skeleton skeleton-line short"></div>
                </div>
            </div>
        `).join('');
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

        // Initialize Firebase for anonymous leaderboard
        initFirebase();

        // Setup new features
        setupBottomNav();
        setupOfflineDetection();
        setupSwipeGestures();
        setupBookmarkControls();
        setupNotesModal();
        createKeyboardHint();

        // Ramadan share button
        const shareBtn = $('#btn-share-progress');
        if (shareBtn) {
            shareBtn.addEventListener('click', shareRamadanProgress);
        }

        // Show surah list skeletons while loading
        showSurahListSkeletons();

        try {
            await loadSurahList();
            renderSurahList();
            renderHero();
            renderRamadanCountdown();
            renderSunnahTasks();
            updateGoalDisplays();
            renderReadingStats();
        } catch (err) {
            dom.surahList.innerHTML = `
                <div style="text-align:center;padding:2rem;color:var(--danger);">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5" style="margin-bottom:0.75rem"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p style="font-weight:600">${t('failedLoadData')}</p>
                    <p style="font-size:0.78rem;color:var(--text-tertiary);margin:0.5rem 0 1rem">${!navigator.onLine ? t('offlineMessage') : ''}</p>
                    <button onclick="location.reload()" style="padding:0.6rem 1.5rem;border:1.5px solid var(--accent);border-radius:var(--radius-md);cursor:pointer;background:transparent;color:var(--accent);font-weight:600;font-family:var(--font-ui);font-size:0.88rem">${t('retry')}</button>
                </div>
            `;
        }

        // Hide loading screen
        setTimeout(() => {
            dom.loadingScreen.classList.add('fade-out');
            dom.app.classList.remove('hidden');
            setTimeout(() => dom.loadingScreen.remove(), 500);
            handleHashRoute();

            // Show verse actions hint on first visit (delayed)
            setTimeout(() => showVerseActionsHint(), 2000);
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
        else if (hash === 'leaderboard') showView('leaderboard');
    }

    window.addEventListener('hashchange', handleHashRoute);

    // Save reading position when leaving/minimizing the app
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') saveReadingPosition();
    });
    window.addEventListener('beforeunload', saveReadingPosition);

    // Start the app
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { init(); registerServiceWorker(); });
    } else {
        init();
        registerServiceWorker();
    }
})();
