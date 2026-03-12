#!/usr/bin/env node
/**
 * Download Quran Data for Local Storage
 *
 * Run this script once to download all Quran data from the AlQuran Cloud API
 * and save it as local JSON files. This allows the app to work completely
 * offline without depending on the external API.
 *
 * Usage: node download-data.js
 *
 * This will create:
 *   data/surahs.json          — Surah list metadata (114 surahs)
 *   data/editions/<edition>/   — One folder per edition
 *     1.json ... 114.json     — Per-surah verse data
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://api.alquran.cloud/v1';

// Editions to download — Arabic texts + all translations + all reciters
const EDITIONS = [
    // Arabic text
    'quran-uthmani',
    'quran-tajweed',
    // Translations
    'en.sahih',
    'en.asad',
    'en.yusufali',
    'en.pickthall',
    'en.hilali',
    // Reciters (for audio URLs)
    'ar.alafasy',
    'ar.husary',
    'ar.minshawi',
    'ar.abdurrahmaansudais',
    'ar.abdulbasitmurattal',
    'ar.shaaborheem',
];

const DATA_DIR = path.join(__dirname, 'data');

function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (json.code === 200 && json.data) {
                        resolve(json.data);
                    } else {
                        reject(new Error(`API error: ${json.code} - ${json.status}`));
                    }
                } catch (e) {
                    reject(new Error(`Parse error: ${e.message}`));
                }
            });
            res.on('error', reject);
        }).on('error', reject);
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function downloadSurahList() {
    console.log('Downloading surah list...');
    const surahs = await fetchJSON(`${API_BASE}/surah`);
    const outPath = path.join(DATA_DIR, 'surahs.json');
    fs.writeFileSync(outPath, JSON.stringify(surahs, null, 2), 'utf8');
    console.log(`  Saved ${surahs.length} surahs to data/surahs.json`);
    return surahs;
}

async function downloadEdition(edition) {
    const editionDir = path.join(DATA_DIR, 'editions', edition);
    fs.mkdirSync(editionDir, { recursive: true });

    console.log(`\nDownloading edition: ${edition}`);

    for (let surahNum = 1; surahNum <= 114; surahNum++) {
        const outPath = path.join(editionDir, `${surahNum}.json`);

        // Skip if already downloaded
        if (fs.existsSync(outPath)) {
            continue;
        }

        try {
            const data = await fetchJSON(`${API_BASE}/surah/${surahNum}/${edition}`);
            fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
            process.stdout.write(`  Surah ${surahNum}/114\r`);
        } catch (err) {
            console.error(`  Error on surah ${surahNum}: ${err.message}`);
            // Retry once after a delay
            await sleep(2000);
            try {
                const data = await fetchJSON(`${API_BASE}/surah/${surahNum}/${edition}`);
                fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
            } catch (retryErr) {
                console.error(`  Retry failed for surah ${surahNum}: ${retryErr.message}`);
            }
        }

        // Rate limit: small delay between requests
        await sleep(100);
    }
    console.log(`  Done: ${edition} (114 surahs)`);
}

async function main() {
    console.log('=== Quran Data Downloader ===\n');

    // Create data directory
    fs.mkdirSync(DATA_DIR, { recursive: true });

    // Download surah list
    await downloadSurahList();

    // Download each edition
    for (const edition of EDITIONS) {
        await downloadEdition(edition);
    }

    console.log('\n=== Download complete! ===');
    console.log('The app will now use local data files instead of the API.');
    console.log('Commit the data/ folder to your repository to include it on GitHub.');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
