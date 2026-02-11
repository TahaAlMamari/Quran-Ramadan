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
    };

    // Default settings
    state.settings = {
        darkMode: false,
        showTranslation: true,
        autoScroll: true,
        arabicNumbers: true,
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
        continueReading: $('#continue-reading'),
        continueCard: $('#continue-card'),
        streakCount: $('#streak-count'),
        streakFlame: $('#streak-flame'),
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
        const editions = `quran-uthmani,${translation},${reciter}`;
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

        dom.surahList.innerHTML = surahs.map(s => `
            <div class="surah-card" data-surah="${s.number}">
                <div class="surah-number">${s.number}</div>
                <div class="surah-info">
                    <div class="surah-name-en">${s.englishName}</div>
                    <div class="surah-meta">${s.englishNameTranslation} · ${s.numberOfAyahs} verses · ${s.revelationType}</div>
                </div>
                <div class="surah-name-ar">${s.name}</div>
            </div>
        `).join('');

        // Click handlers
        dom.surahList.querySelectorAll('.surah-card').forEach(card => {
            card.addEventListener('click', () => {
                openSurah(parseInt(card.dataset.surah));
            });
        });
    }

    function renderHeroStats() {
        const totalRead = Object.keys(state.readingProgress).length;
        dom.heroStats.innerHTML = `
            <div class="hero-stat">
                <div class="hero-stat-value">${totalRead}</div>
                <div class="hero-stat-label">Surahs Read</div>
            </div>
            <div class="hero-stat">
                <div class="hero-stat-value">${state.bookmarks.length}</div>
                <div class="hero-stat-label">Bookmarks</div>
            </div>
            <div class="hero-stat">
                <div class="hero-stat-value">${state.streak.count}</div>
                <div class="hero-stat-label">Day Streak</div>
            </div>
        `;
    }

    function renderContinueReading() {
        const last = localStorage.getItem('qc_last_read');
        if (!last) {
            dom.continueReading.classList.add('hidden');
            return;
        }
        const { surahNumber, surahName, surahNameAr, verse } = JSON.parse(last);
        dom.continueReading.classList.remove('hidden');
        dom.continueCard.innerHTML = `
            <div class="card-icon">${surahNameAr ? surahNameAr.charAt(0) : '📖'}</div>
            <div class="card-text">
                <div class="card-title">${surahName}</div>
                <div class="card-subtitle">Verse ${verse} · Tap to continue</div>
            </div>
            <div class="card-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
        `;
        dom.continueCard.onclick = () => openSurah(surahNumber, verse);
    }

    function renderStreak() {
        updateStreak();
        dom.streakCount.textContent = state.streak.count;
        if (state.streak.count > 0) {
            dom.streakFlame.classList.add('active');
        } else {
            dom.streakFlame.classList.remove('active');
        }
    }

    function renderVerses() {
        const { arabic, translation, audio } = state.currentVerses;
        const showTranslation = state.settings.showTranslation;
        const useArabicNums = state.settings.arabicNumbers;

        dom.versesContainer.innerHTML = arabic.ayahs.map((ayah, i) => {
            const verseNum = useArabicNums ? toArabicNumber(ayah.numberInSurah) : ayah.numberInSurah;
            const isBookmarked = state.bookmarks.some(b => b.number === ayah.number);
            const translationText = translation.ayahs[i] ? translation.ayahs[i].text : '';

            return `
                <div class="verse" data-index="${i}" data-verse-number="${ayah.number}" data-verse-in-surah="${ayah.numberInSurah}">
                    <div class="verse-arabic" style="font-size: ${state.fontSize}px">
                        ${ayah.text} <span class="verse-number">﴿${verseNum}﴾</span>
                    </div>
                    ${showTranslation ? `<div class="verse-translation">${ayah.numberInSurah}. ${translationText}</div>` : ''}
                    <div class="verse-actions">
                        <button class="verse-action-btn btn-play-verse" data-index="${i}" title="Play">
                            <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                            Play
                        </button>
                        <button class="verse-action-btn btn-bookmark-verse ${isBookmarked ? 'bookmarked' : ''}" data-number="${ayah.number}" data-index="${i}" title="Bookmark">
                            <svg viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
                            ${isBookmarked ? 'Saved' : 'Save'}
                        </button>
                        <button class="verse-action-btn btn-copy-verse" data-index="${i}" title="Copy">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                            Copy
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
                showToast('Bookmark removed');
            });
        });
    }

    function renderRamadanPlan() {
        const completed = state.ramadanPlan.completedDays || [];
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
        const todayIdx = completed.length;
        dom.statPagesToday.textContent = todayIdx < 30 ? '~20' : '0';

        dom.ramadanDays.innerHTML = JUZ_DATA.map((juz, i) => {
            const isDone = completed.includes(i);
            return `
                <div class="day-card ${isDone ? 'completed' : ''}" data-day="${i}">
                    <div class="day-number">${i + 1}</div>
                    <div class="day-info">
                        <div class="day-juz">Juz ${juz.juz}</div>
                        <div class="day-range">${juz.label}</div>
                    </div>
                    <div class="day-check">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                </div>
            `;
        }).join('');

        dom.ramadanDays.querySelectorAll('.day-card').forEach(card => {
            card.addEventListener('click', () => {
                const day = parseInt(card.dataset.day);
                toggleRamadanDay(day);
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

        // Render view-specific content
        if (viewName === 'home') {
            renderHeroStats();
            renderContinueReading();
            renderStreak();
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
                <p>Loading surah...</p>
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
                    <p>Failed to load surah. Please check your connection and try again.</p>
                    <button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1rem;border:1px solid;border-radius:8px;cursor:pointer;background:transparent;color:inherit;">Retry</button>
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
    }

    function togglePlayPause() {
        if (audioEl.paused) {
            audioEl.play();
            state.audioState.playing = true;
            updatePlayPauseIcon(true);
        } else {
            audioEl.pause();
            state.audioState.playing = false;
            updatePlayPauseIcon(false);
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
            showToast('Bookmark removed');
        } else {
            state.bookmarks.push({
                number: arabic.number,
                surahNumber: state.currentSurah.number,
                surahName: state.currentSurah.englishName,
                verseInSurah: arabic.numberInSurah,
                arabic: arabic.text,
                translation: trans.text,
            });
            showToast('Verse bookmarked');
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
        const text = `${arabic.text}\n\n${trans.text}\n\n— ${state.currentSurah.englishName} ${arabic.numberInSurah}`;

        navigator.clipboard.writeText(text).then(() => {
            showToast('Verse copied');
        }).catch(() => {
            showToast('Failed to copy');
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

        // Audio controls
        $('#btn-audio-play').addEventListener('click', togglePlayPause);
        $('#btn-audio-next').addEventListener('click', playNext);
        $('#btn-audio-prev').addEventListener('click', playPrev);
        $('#btn-audio-close').addEventListener('click', stopAudio);

        $('#btn-audio-repeat').addEventListener('click', () => {
            state.audioState.repeat = !state.audioState.repeat;
            $('#btn-audio-repeat').classList.toggle('active', state.audioState.repeat);
            showToast(state.audioState.repeat ? 'Repeat on' : 'Repeat off');
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
            if (confirm('Are you sure you want to reset all progress, bookmarks, and settings?')) {
                localStorage.removeItem('qc_bookmarks');
                localStorage.removeItem('qc_progress');
                localStorage.removeItem('qc_ramadan');
                localStorage.removeItem('qc_streak');
                localStorage.removeItem('qc_settings');
                localStorage.removeItem('qc_last_read');
                localStorage.removeItem('qc_fontsize');
                location.reload();
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
        $('#setting-dark-mode').checked = state.settings.darkMode;
        $('#setting-translation').checked = state.settings.showTranslation;
        $('#setting-autoscroll').checked = state.settings.autoScroll;
        $('#setting-arabic-numbers').checked = state.settings.arabicNumbers;
        dom.selectReciter.value = state.settings.reciter;
        dom.selectTranslation.value = state.settings.translation;
        dom.fontSizeDisplay.textContent = state.fontSize;

        setupEvents();

        try {
            await loadSurahList();
            renderSurahList();
            renderHeroStats();
            renderContinueReading();
            renderStreak();
        } catch (err) {
            dom.surahList.innerHTML = `
                <div style="text-align:center;padding:2rem;color:var(--danger);">
                    <p>Failed to load Quran data. Please check your internet connection.</p>
                    <button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1rem;border:1px solid;border-radius:8px;cursor:pointer;background:transparent;color:inherit;">Retry</button>
                </div>
            `;
        }

        // Hide loading screen
        setTimeout(() => {
            dom.loadingScreen.classList.add('fade-out');
            dom.app.classList.remove('hidden');
            setTimeout(() => dom.loadingScreen.remove(), 500);
        }, 1600);
    }

    // Start the app
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
