const fs = require('fs');
let content = fs.readFileSync('artifacts/smovie-admin/app/index.tsx', 'utf8');

const missing = `
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDatabase, ref as dbRef, set as dbSet } from 'firebase/database';
import { hasDatabaseUrl } from '../src/firebase';

type TmdbItem = TMDBItem; 
type BrowserFileAsset = any;
type LibraryItem = any;
type VideoUploadItem = any;
type VideoAsset = any;

const TMDB_API_KEY = API_KEY;
const PERMANENT_API_KEY = 'secret';
const APP_OWNER = 'admin';

const NETFLIX_CATEGORIES = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary', 'Animation', 'Family'];
const AUDIO_CHIPS = ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi'];
const SUBTITLE_CHIPS = ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi'];

function formatReleaseDate(dateStr: string) { return dateStr; }
function getReleaseDate(item: any) { return item?.release_date || item?.first_air_date || ''; }
function fmtBytes(bytes: number) { return bytes + ' B'; }

function toggleChip(arr: any[], item: any) {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
}

const JSZip = class {};
const zipAssetKind = (meta: any) => 'video';

function notifyPublished(title?: string) {}
function requestBrowserNotifications() {}
function parseFileName(name: string) { return { title: name, year: '' }; }

async function tmdbDetails(id: number, type: string) { return {} as any; }
async function pickMultipleVideos() { return { assets: [] }; }
async function pickMultipleFiles() { return { assets: [] }; }
async function pickMultipleImages() { return { assets: [] }; }

function FieldLabel({ children, style }: any) { return <Text style={[{ color: MUTED2, fontSize:10, fontWeight:'800', marginTop:14, marginBottom:6 }, style]}>{children}</Text>; }
function WebFileInput({ label, subLabel, accept, multiple, onPick }: any) { 
  return <TouchableOpacity style={{borderWidth:1, borderColor:BORDER2, padding:12, borderRadius:8}} onPress={() => onPick({assets:[]})}><Text style={{color:WHITE}}>{label}</Text></TouchableOpacity>; 
}
function VideoUploadCard({ item, onRemove }: any) { 
  return <View style={{padding:8, backgroundColor:CARD, marginBottom:8}}><Text style={{color:WHITE}}>{item?.file?.name || 'Video'}</Text></View>; 
}
function NotificationDetailsModal({ item, onClose }: any) { return null; }
function ExtrasModal({ item, onClose }: any) { return null; }
`;

content = content.replace("const TMDB_BASE = 'https://api.themoviedb.org/3';", "const TMDB_BASE = 'https://api.themoviedb.org/3';" + missing);
fs.writeFileSync('artifacts/smovie-admin/app/index.tsx', content);
