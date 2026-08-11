const fs = require('fs');
let content = fs.readFileSync('artifacts/smovie-admin/app/index.tsx', 'utf8');

const missing = `
type WeeklyEp = any;
type ZipAsset = any;
type NotificationTab = any;
type ExtraCategory = any;
type ExtraAsset = any;

const fbError = '';
const LinearGradient = View;
const registerServiceWorker = () => {};
const clearBrowserCachesAndReload = () => {};
const getTmdbCertification = () => '';
const detectVideoMetadata = async (file: any) => ({});

async function tmdbById(id: string, type: string) { return {} as any; }
async function tmdbByTitle(title: string, type: string, year?: string) { return {} as any; }

import { onValue } from 'firebase/database';
`;

content = content.replace("function parseFileName(name: string) { return { title: name, year: '' }; }", "function parseFileName(name: string) { return { title: name, year: '', audioLangs: [], subtitles: [], quality: '' }; }");
content = content.replace("type TMDBItem = {", missing + "\ntype TMDBItem = {");

fs.writeFileSync('artifacts/smovie-admin/app/index.tsx', content);
