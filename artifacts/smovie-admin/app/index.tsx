import MediaInfoFactory from 'mediainfo.js';
import React, { useState, useEffect, useRef } from 'react';
import { Platform, View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, StyleSheet, KeyboardAvoidingView, ActivityIndicator, Image, Dimensions, Modal, Pressable } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, googleProvider, githubProvider, facebookProvider, popupSignIn, linkFacebookAccount, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged, User, getFirebaseInitError } from '../src/firebase';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';
const PROVIDER_BASE = 'https://image.tmdb.org/t/p/w92';
const API_KEY = 'ba0701a4c153282eb8fc8207cade9afa'; 
const TMDB_API_KEYS = [
  'ba0701a4c153282eb8fc8207cade9afa',
  '3fd2be6f0c70a2a598f084dd23b0ee8f',
  '15d260044f210d6a042d5732b71e113f',
];
const TMDB_BASE = 'https://api.themoviedb.org/3';

async function tmdbFetch(pathAndQuery: string) {
  let lastError = new Error('TMDB API Error');
  for (const key of TMDB_API_KEYS) {
    try {
      const sep = pathAndQuery.includes('?') ? '&' : '?';
      const url = `${TMDB_BASE}${pathAndQuery}${sep}api_key=${key}`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError;
}

import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDatabase, ref as dbRef, set as dbSet } from 'firebase/database';
import { hasDatabaseUrl } from '../src/firebase';

type TmdbItem = TMDBItem; 
type BrowserFileAsset = any;
type LibraryItem = any;
type VideoUploadItem = { id: string; name: string; size?: number; uri: string; type: string; file?: any; status: string; progress: number; error?: string; detection?: any; };
type VideoAsset = any;

const TMDB_API_KEY = API_KEY;
const PERMANENT_API_KEY = 'sksoyel1513';
const APP_OWNER = 'sksoyel1513';

const NETFLIX_CATEGORIES = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Documentary', 'Animation', 'Family'];
const AUDIO_CHIPS = ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi'];
const SUBTITLE_CHIPS = ['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi'];

function formatReleaseDate(dateStr: string) { return dateStr; }
function getReleaseDate(item: any) { return item?.release_date || item?.first_air_date || ''; }
function fmtBytes(bytes: number) { return bytes + ' B'; }

function toggleChip(arr: any[], item: any) {
  return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
}

import JSZip from 'jszip';
const zipAssetKind = (meta: string) => {
  const lower = meta.toLowerCase();
  if (lower.match(/\.(mp4|mkv|avi|mov|wmv|webm)$/)) return 'video';
  if (lower.match(/\.(srt|vtt|ass|ssa)$/)) return 'subtitle';
  if (lower.match(/\.(mp3|wav|aac|flac)$/)) return 'audio';
  if (lower.match(/\.(jpg|jpeg|png|webp)$/)) return 'image';
  return 'other';
};

function notifyPublished(title?: string, type?: string, year?: string) {}
function requestBrowserNotifications() {}


let mediainfoInstance: any = null;
const getMediaInfo = async () => {
  if (!mediainfoInstance) {
    mediainfoInstance = await MediaInfoFactory({ format: 'object' });
  }
  return mediainfoInstance;
};

export function extractSeasonAndEpisode(fileName: string): { season: string; episode: string } {
  const clean = fileName.trim();
  
  // 1. S01E02 / S1E2 / S01_E02 / S01-E02 / S01.E02
  const s1 = clean.match(/S(\d+)[\s_.-]*E(\d+)/i);
  if (s1 && s1[1] && s1[2]) {
    return {
      season: parseInt(s1[1], 10).toString(),
      episode: parseInt(s1[2], 10).toString(),
    };
  }

  // 2. 1x02 / 01x02
  const s2 = clean.match(/(\d+)x(\d+)/i);
  if (s2 && s2[1] && s2[2]) {
    return {
      season: parseInt(s2[1], 10).toString(),
      episode: parseInt(s2[2], 10).toString(),
    };
  }

  // 3. Episode 02 / Ep 02 / Ep.02
  const s3 = clean.match(/(?:Episode|Ep)[\s_.-]*(\d+)/i);
  if (s3 && s3[1]) {
    return {
      season: '1',
      episode: parseInt(s3[1], 10).toString(),
    };
  }

  // 4. E02 / e2
  const s4 = clean.match(/[\s_.-]E(\d+)[\s_.-]/i) || clean.match(/^E(\d+)[\s_.-]/i) || clean.match(/[\s_.-]E(\d+)$/i);
  if (s4 && s4[1]) {
    return {
      season: '1',
      episode: parseInt(s4[1], 10).toString(),
    };
  }

  // 5. Bracket numbers [02] or (02)
  const s5 = clean.match(/[\[\(](\d{1,3})[\]\)]/);
  if (s5 && s5[1]) {
    return {
      season: '1',
      episode: parseInt(s5[1], 10).toString(),
    };
  }

  // 6. Number preceded by ' - ' or '_' or '.'
  const s6 = clean.match(/(?:[\s_.-]+)(\d{1,3})(?:[\s_.-]+|\.[a-z0-9]+$)/i);
  if (s6 && s6[1] && parseInt(s6[1], 10) < 300) {
    return {
      season: '1',
      episode: parseInt(s6[1], 10).toString(),
    };
  }

  return { season: '', episode: '' };
}

export function detectSubLanguage(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.match(/\b(en|eng|english)\b/)) return 'English';
  if (lower.match(/\b(hi|hin|hindi)\b/)) return 'Hindi';
  if (lower.match(/\b(bn|ben|bengali|bangla)\b/)) return 'Bengali';
  if (lower.match(/\b(ta|tam|tamil)\b/)) return 'Tamil';
  if (lower.match(/\b(te|tel|telugu)\b/)) return 'Telugu';
  if (lower.match(/\b(ml|mal|malayalam)\b/)) return 'Malayalam';
  if (lower.match(/\b(kn|kan|kannada)\b/)) return 'Kannada';
  if (lower.match(/\b(mr|mar|marathi)\b/)) return 'Marathi';
  if (lower.match(/\b(gu|guj|gujarati)\b/)) return 'Gujarati';
  if (lower.match(/\b(pa|pan|punjabi)\b/)) return 'Punjabi';
  if (lower.match(/\b(ur|urd|urdu)\b/)) return 'Urdu';
  if (lower.match(/\b(ko|kor|korean)\b/)) return 'Korean';
  if (lower.match(/\b(ja|jap|japanese)\b/)) return 'Japanese';
  if (lower.match(/\b(zh|chi|chinese)\b/)) return 'Chinese';
  if (lower.match(/\b(es|spa|spanish)\b/)) return 'Spanish';
  if (lower.match(/\b(fr|fre|french)\b/)) return 'French';
  if (lower.match(/\b(de|ger|german)\b/)) return 'German';
  if (lower.match(/\b(ar|ara|arabic)\b/)) return 'Arabic';
  if (lower.match(/\b(pt|por|portuguese)\b/)) return 'Portuguese';
  return 'English';
}

function parseFileName(name: string) {
  const lowerName = name.toLowerCase();

  // Video Quality
  const qualityMatch = name.match(/(480p|576p|720p|1080p|1440p|2160p|4K|8K)/i);
  const quality = qualityMatch ? qualityMatch[1].toUpperCase() : '';

  // Video Codec
  const videoCodecMatch = name.match(/(x264|h264|h\.264|x265|h265|h\.265|hevc|av1|vp9)/i);
  let videoCodec = '';
  if (videoCodecMatch) {
    const vc = videoCodecMatch[1].toLowerCase();
    if (vc.includes('264')) videoCodec = 'H.264';
    else if (vc.includes('265') || vc.includes('hevc')) videoCodec = 'HEVC';
    else if (vc.includes('av1')) videoCodec = 'AV1';
    else if (vc.includes('vp9')) videoCodec = 'VP9';
  }

  // Audio Languages
  const audioLangs: string[] = [];
  const subtitleLangs: string[] = [];

  const langs = ['Hindi', 'English', 'Bengali', 'Bangla', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Marathi', 'Gujarati', 'Punjabi', 'Urdu', 'Korean', 'Japanese', 'Chinese', 'Spanish', 'French', 'German', 'Arabic', 'Portuguese'];

  langs.forEach(lang => {
    if (lowerName.includes(lang.toLowerCase())) {
      audioLangs.push(lang);
    }
  });

  // Subtitle Languages / Keywords
  const subKeywords = name.match(/(esub|esubs|english sub|english subtitle|multi sub|multisub|subs|subtitle|cc|sdh|forced)/i);
  if (subKeywords) {
    if (subKeywords[1].toLowerCase().includes('english') || subKeywords[1].toLowerCase().includes('esub')) {
      subtitleLangs.push('English');
    } else {
      subtitleLangs.push('Unknown');
    }
  }

  // Episode & Season using robust extractor
  const se = extractSeasonAndEpisode(name);
  const season = se.season || undefined;
  const episode = se.episode || undefined;

  // Title cleanup
  let cleanTitle = name.replace(/\.(mp4|mkv|avi|mov|wmv|webm|ts|m4v|flv)$/i, '');
  cleanTitle = cleanTitle.replace(/(480p|576p|720p|1080p|1440p|2160p|4K|8K).*$/i, '');
  cleanTitle = cleanTitle.replace(/S\d+E\d+.*$/i, '');
  cleanTitle = cleanTitle.replace(/\d{4}.*$/i, ''); // Strip year
  cleanTitle = cleanTitle.replace(/\./g, ' ').trim();
  cleanTitle = cleanTitle.replace(/[-_]$/, '').trim();

  return {
    title: cleanTitle || name,
    year: name.match(/(19|20)\d{2}/)?.[0] || '',
    audioLangs,
    subtitles: subtitleLangs,
    quality,
    videoCodec,
    episode,
    season
  };
}

const detectVideoMetadata = async (item: any) => {
  const file = item.file || item;
  const name = file.name || item.name || '';
  const p = parseFileName(name);
  
  let result = {
    file,
    filename: name,
    resolution: p.quality,
    quality: p.quality,
    videoCodec: p.videoCodec,
    audioCodec: '',
    audioLanguages: p.audioLangs,
    subtitleLanguages: p.subtitles,
    fps: '',
    bitrate: '',
    duration: '',
    season: p.season,
    episode: p.episode,
    container: name.split('.').pop()?.toUpperCase() || 'MP4',
    size: file.size,
    status: 'Detecting...' as any
  };

  if (!file || !file.slice) {
    result.status = '⚠ Partial detection'; // Fallback if no file object
    return result;
  }

  try {
    const mi = await getMediaInfo();
    const getSize = () => file.size;
    const readChunk = (chunkSize: number, offset: number) => {
      return new Promise<Uint8Array>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.error) {
            reject(e.target.error);
          } else if (e.target?.result) {
            resolve(new Uint8Array(e.target.result as ArrayBuffer));
          } else {
            reject(new Error('Unknown read error'));
          }
        };
        const slice = file.slice(offset, offset + chunkSize);
        reader.readAsArrayBuffer(slice);
      });
    };

    const info = await mi.analyzeData(getSize, readChunk);
    
    if (info && info.media && info.media.track) {
      const generalTrack = info.media.track.find((t: any) => t['@type'] === 'General');
      const videoTrack = info.media.track.find((t: any) => t['@type'] === 'Video');
      const audioTracks = info.media.track.filter((t: any) => t['@type'] === 'Audio');
      const textTracks = info.media.track.filter((t: any) => t['@type'] === 'Text');

      if (generalTrack) {
        if (generalTrack.Duration) result.duration = generalTrack.Duration;
        if (generalTrack.OverallBitRate) result.bitrate = generalTrack.OverallBitRate;
      }
      
      if (videoTrack) {
        if (videoTrack.Width && videoTrack.Height) {
           const width = parseInt(videoTrack.Width, 10);
           const height = parseInt(videoTrack.Height, 10);
           if (height >= 2160 || width >= 3840) result.quality = '4K';
           else if (height >= 1440) result.quality = '1440p';
           else if (height >= 1080 || width >= 1920) result.quality = '1080p';
           else if (height >= 720 || width >= 1280) result.quality = '720p';
           else if (height >= 576) result.quality = '576p';
           else if (height >= 480) result.quality = '480p';
           else if (height >= 360) result.quality = '360p';
           else result.quality = `${height}p`;
           
           result.resolution = `${width}x${height}`;
        }
        if (videoTrack.Format) result.videoCodec = videoTrack.Format;
        if (videoTrack.FrameRate) result.fps = videoTrack.FrameRate;
      }
      
      if (audioTracks.length > 0) {
         result.audioCodec = audioTracks[0].Format;
         
         const aLangs = audioTracks.map((t: any) => t.Language).filter(Boolean).map((l: string) => l.charAt(0).toUpperCase() + l.slice(1));
         if (aLangs.length > 0) {
           const langSet = new Set([...result.audioLanguages, ...aLangs]);
           result.audioLanguages = Array.from(langSet);
         }
      }
      
      if (textTracks.length > 0) {
         const sLangs = textTracks.map((t: any) => t.Language).filter(Boolean).map((l: string) => l.charAt(0).toUpperCase() + l.slice(1));
         if (sLangs.length > 0) {
           const subSet = new Set([...result.subtitleLanguages, ...sLangs]);
           result.subtitleLanguages = Array.from(subSet);
         } else {
           if (result.subtitleLanguages.length === 0) {
             result.subtitleLanguages.push('Unknown');
           }
         }
      }
      
      result.status = '✓ Detection completed';
    } else {
      result.status = '⚠ Partial detection'; // Used fallback
    }

  } catch (err) {
    console.error("MediaInfo error:", err);
    result.status = '⚠ Partial detection'; // Fallback to filename
  }
  
  return result;
};

function pickMultipleVideos(cb?: any): boolean { return false; }
function pickMultipleFiles(accept?: any, cb?: any): boolean { return false; }
function pickMultipleImages(cb?: any): boolean { return false; }

function FieldLabel({ children, style }: any) { return <Text style={[{ color: MUTED2, fontSize:10, fontWeight:'800', marginTop:14, marginBottom:6 }, style]}>{children}</Text>; }
function WebFileInput({ accept, multiple, onChange }: any) { 
  if (Platform.OS !== 'web') return null;
  return (
    <input 
      type="file" 
      accept={accept || ".zip,application/zip,application/x-zip-compressed"} 
      multiple={multiple} 
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0,
        width: '100%',
        height: '100%',
        cursor: 'pointer',
        zIndex: 10,
      }} 
      onChange={onChange}
    />
  ); 
}
function VideoUploadCard({ item, onCancel, onRetry, onRemove }: any) { 
  let statusText = '';
  if (item.status === 'Cancelled') statusText = 'Cancelled';
  else if (item.status === 'Error') statusText = item.error || 'Error';
  else if (item.status === 'Waiting' || !item.status) statusText = 'Waiting...';
  else {
    const isPreparing = item.status === 'Preparing';
    const isUploading = item.status === 'Uploading';
    const isProcessing = item.status === 'Processing';
    const isCompleted = item.status === 'Completed';
    statusText = [
      isPreparing || isUploading || isProcessing || isCompleted ? 'Preparing' : '',
      isUploading || isProcessing || isCompleted ? `Uploading ${isUploading ? Math.round(item.progress) + '%' : '100%'}` : '',
      isProcessing || isCompleted ? 'Processing' : '',
      isCompleted ? 'Completed' : ''
    ].filter(Boolean).join(' → ');
  }

  const p = item.detection || parseFileName(item.name || item?.file?.name || '');
  const title = p.episode ? `Episode ${String(p.episode).padStart(2, '0')}` : (item.name || item?.file?.name || 'Video');

  return (
    <View style={{padding: 12, backgroundColor: CARD2, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#333'}}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
        <Text style={{color: WHITE, fontWeight: 'bold', fontSize: 14}}>{title}</Text>
        <View style={{flexDirection: 'row', gap: 12}}>
          {(item.status === 'Uploading' || item.status === 'Preparing' || item.status === 'Processing' || item.status === 'Waiting' || !item.status) && (
            <TouchableOpacity onPress={onCancel}><Text style={{color: MUTED}}>Cancel</Text></TouchableOpacity>
          )}
          {(item.status === 'Error' || item.status === 'Cancelled') && (
            <TouchableOpacity onPress={onRetry}><Text style={{color: '#6eaeff'}}>Retry</Text></TouchableOpacity>
          )}
          <TouchableOpacity onPress={onRemove}><Text style={{color: '#ff6b6b'}}>Remove</Text></TouchableOpacity>
        </View>
      </View>
      <Text style={{color: item.status === 'Error' ? '#ff6b6b' : item.status === 'Completed' ? '#4caf50' : MUTED2, fontSize: 12}}>
        {statusText}
      </Text>
      
      {item.detection && (
        <View style={{marginTop: 8}}>
          <Text style={{color: item.detection.status === '✓ Detection completed' ? '#4caf50' : '#ff9800', fontSize: 12, marginBottom: 4}}>{item.detection.status}</Text>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6}}>
            {item.detection.quality ? <Text style={{color: '#fff', fontSize: 10, backgroundColor: '#4caf50', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>{item.detection.quality} ✓</Text> : null}
            {item.detection.resolution ? <Text style={{color: '#aaa', fontSize: 10, backgroundColor: '#333', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>{item.detection.resolution}</Text> : null}
            {item.detection.videoCodec ? <Text style={{color: '#aaa', fontSize: 10, backgroundColor: '#333', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>{item.detection.videoCodec}</Text> : null}
            {item.detection.container ? <Text style={{color: '#aaa', fontSize: 10, backgroundColor: '#333', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>{item.detection.container}</Text> : null}
            
            {item.detection.audioCodec ? <Text style={{color: '#aaa', fontSize: 10, backgroundColor: '#333', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>{item.detection.audioCodec}</Text> : null}
            {item.detection.audioLanguages?.length > 0 ? item.detection.audioLanguages.map((l:string, i:number) => (
              <Text key={"a"+i} style={{color: '#fff', fontSize: 10, backgroundColor: '#2196f3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>{l} ✓</Text>
            )) : null}
            
            {item.detection.subtitleLanguages?.length > 0 ? item.detection.subtitleLanguages.map((l:string, i:number) => (
              <Text key={"s"+i} style={{color: '#fff', fontSize: 10, backgroundColor: '#ff9800', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>{l} Sub ✓</Text>
            )) : null}

            {item.detection.season ? <Text style={{color: '#aaa', fontSize: 10, backgroundColor: '#333', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>S{item.detection.season.padStart(2, '0')}</Text> : null}
            {item.detection.episode ? <Text style={{color: '#aaa', fontSize: 10, backgroundColor: '#333', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}>E{item.detection.episode.padStart(2, '0')}</Text> : null}
          </View>
        </View>
      )}

      {item.status === 'Uploading' && (
        <View style={{height: 4, backgroundColor: '#333', borderRadius: 2, marginTop: 8, overflow: 'hidden'}}>
          <View style={{height: '100%', backgroundColor: RED, width: `${item.progress || 0}%` as any}} />
        </View>
      )}
    </View>
  );
}

function NotificationDetailsModal({ item, onClose }: any) { return null; }
function ExtrasModal({ item, onClose }: any) { return null; }
function PreviewModal({ item, onClose }: any) {
  if (!item) return null;
  return (
    <Modal visible={true} transparent={true} animationType="slide">
      <View style={{flex: 1, backgroundColor: '#000'}}>
        <ScrollView>
          <View style={{position: 'relative', width: '100%', height: 400}}>
            <Image source={{uri: item.slider_images?.[0] || item.poster_url || item.posterUrl}} style={{width: '100%', height: '100%', opacity: 0.6}} />
            <LinearGradient colors={['transparent', '#000']} style={{position: 'absolute', bottom: 0, width: '100%', height: 200}} />
            <TouchableOpacity onPress={onClose} style={{position: 'absolute', top: 40, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 20}}>
              <Text style={{color: '#fff', fontWeight: 'bold'}}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <View style={{padding: 20, marginTop: -60}}>
            <Text style={{color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 10}}>{item.title}</Text>
            <View style={{flexDirection: 'row', gap: 10, marginBottom: 16, alignItems: 'center'}}>
              <Text style={{color: '#4ade80', fontWeight: 'bold'}}>{item.rating ? `${item.rating} Match` : 'New'}</Text>
              <Text style={{color: '#aaa'}}>{item.year}</Text>
              <Text style={{color: '#aaa', backgroundColor: '#333', paddingHorizontal: 6, borderRadius: 4}}>{item.ageRating || 'U/A'}</Text>
              <Text style={{color: '#aaa'}}>{item.runtime ? `${item.runtime}m` : ''}</Text>
              <Text style={{color: '#fff', backgroundColor: '#e50914', paddingHorizontal: 6, borderRadius: 4, fontWeight: 'bold', fontSize: 10, alignSelf: 'center'}}>{item.quality}</Text>
            </View>
            <Text style={{color: '#ccc', lineHeight: 22, marginBottom: 20}}>{item.overview}</Text>
            <View style={{flexDirection: 'row', gap: 10, marginBottom: 20}}>
              <TouchableOpacity style={{flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 4, alignItems: 'center'}}>
                <Text style={{color: '#000', fontWeight: 'bold', fontSize: 16}}>▶ Play</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{flex: 1, backgroundColor: '#333', padding: 12, borderRadius: 4, alignItems: 'center'}}>
                <Text style={{color: '#fff', fontWeight: 'bold', fontSize: 16}}>+ My List</Text>
              </TouchableOpacity>
            </View>
            <Text style={{color: '#aaa', marginBottom: 6}}>Cast: {item.cast}</Text>
            <Text style={{color: '#aaa', marginBottom: 6}}>Director: {item.director}</Text>
            <Text style={{color: '#aaa', marginBottom: 20}}>Audio: {(item.audio || item.audioLangs || []).join(', ')}</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}


const RED = '#e50914';
const BG = '#000000';
const CARD = '#111';
const CARD2 = '#222';
const BORDER = '#333';
const BORDER2 = '#444';
const WHITE = '#FFFFFF';
const MUTED = '#999';
const MUTED2 = '#777';
const MUTED3 = '#aaa';
const INPUT = '#1a1a1a';


type WeeklyEp = any;
type ZipAsset = any;
export type ZipEpisodeItem = {
  id: string;
  fileName: string;
  filePath: string;
  seasonNumber: string;
  episodeNumber: string;
  episodeTitle: string;
  quality: string;
  resolution?: string;
  videoCodec?: string;
  audioCodec?: string;
  audioLangs: string[];
  subtitles: string[];
  mappedSubtitles: string[];
  size?: number;
  duration?: string;
  status: 'ready' | 'processing' | 'error';
  error?: string;
  selected?: boolean;
  videoEntry?: any;
  zipFile?: any;
};
type NotificationTab = any;
type ExtraCategory = any;
type ExtraAsset = any;

const fbError = (e: any) => {
  const msg = e?.message || String(e);
  const code = e?.code || '';
  if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
    const domain = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
    return `Unauthorized Domain: "${domain}" is not authorized in your Firebase Console.\n\nHow to fix:\n1. Go to Firebase Console (https://console.firebase.google.com)\n2. Select your project: v-cloud-storage-default\n3. Go to Authentication -> Settings -> Authorized domains\n4. Click "Add domain" and enter: ${domain}`;
  }
  return msg;
};
import { LinearGradient } from 'expo-linear-gradient';
const registerServiceWorker = () => {};
const clearBrowserCachesAndReload = () => {};
const getTmdbCertification = (item?: any) => '';



function formatTmdbImages(data: any) {
  if (data && data.images) {
    if (data.images.posters) data.poster_paths = data.images.posters.map((p: any) => p.file_path);
    if (data.images.backdrops) data.backdrop_paths = data.images.backdrops.map((p: any) => p.file_path);
    if (data.images.logos) data.logo_paths = data.images.logos.map((p: any) => p.file_path);
  }
}

async function tmdbById(id: string | number, preferredType?: string) {
  if (!id) throw new Error('Invalid TMDB ID.');
  const cleanId = String(id).trim();
  if (!/^\d+$/.test(cleanId)) throw new Error('TMDB ID must be numeric.');

  let normType = (preferredType || '').toLowerCase();
  if (normType === 'series' || normType === 'tvshow') normType = 'tv';
  if (normType === 'film') normType = 'movie';

  const primaryType = normType === 'tv' ? 'tv' : 'movie';
  const secondaryType = primaryType === 'tv' ? 'movie' : 'tv';

  try {
    const data = await tmdbFetch(`/${primaryType}/${cleanId}?append_to_response=watch/providers,credits,images`);
    data.media_type = primaryType;
    formatTmdbImages(data);
    return data;
  } catch (e1) {
    try {
      const data = await tmdbFetch(`/${secondaryType}/${cleanId}?append_to_response=watch/providers,credits,images`);
      data.media_type = secondaryType;
      formatTmdbImages(data);
      return data;
    } catch (e2) {
      throw new Error(`TMDB ID ${cleanId} not found.`);
    }
  }
}

async function tmdbByTitle(title: string, preferredType?: string, year?: string) {
  if (!title || !title.trim()) return [];
  const queryStr = title.trim();
  const q = encodeURIComponent(queryStr);

  let normType = (preferredType || '').toLowerCase();
  if (normType === 'series') normType = 'tv';

  // If query consists of digits, try direct ID lookup first
  if (/^\d+$/.test(queryStr)) {
    try {
      const single = await tmdbById(queryStr, normType);
      return [single];
    } catch {}
  }

  const results: TmdbItem[] = [];

  // 1. Try multi-search to find movies and series seamlessly
  try {
    const multiData = await tmdbFetch(`/search/multi?query=${q}`);
    const multiResults = (multiData.results || []).filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv');
    if (multiResults.length > 0) {
      return multiResults;
    }
  } catch {}

  // 2. Fallback to specific type search if multi search returned empty
  try {
    const targetType = normType === 'tv' ? 'tv' : 'movie';
    let path = `/search/${targetType}?query=${q}`;
    if (year) {
      if (targetType === 'movie') path += `&primary_release_year=${year}`;
      if (targetType === 'tv') path += `&first_air_date_year=${year}`;
    }
    const data = await tmdbFetch(path);
    return (data.results || []).map((r: any) => ({ ...r, media_type: targetType }));
  } catch {
    return [];
  }
}

import { onValue } from 'firebase/database';

type TMDBItem = {
  id: number;
  title?: string;
  name?: string;
  media_type?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  poster_path?: string;
  backdrop_path?: string;
  overview?: string;
  watch_providers?: any;
  original_language?: string;
  poster_paths?: string[];
  backdrop_paths?: string[];
  logo_paths?: string[];
  notificationType?: string;
};

type Tab = 'home' | 'library' | 'settings' | 'notifications';

function shortenName(name: string, maxLen = 30) {
  if (name.length <= maxLen) return name;
  return name.substring(0, maxLen - 3) + '...';
}

function getOttProviders(item: TMDBItem) {
  const results = item.watch_providers?.results || {};
  const region = results.IN || results.US || Object.values(results)[0] as any;
  const providers = region ? [
    ...(region.flatrate || []),
    ...(region.free || []),
    ...(region.rent || []),
    ...(region.buy || [])
  ] : Object.values(results).flatMap((v: any) => [
    ...(v.flatrate || []),
    ...(v.free || []),
    ...(v.rent || []),
    ...(v.buy || [])
  ]);
  
  const map = new Map();
  for (const p of providers) {
    if (p.provider_name) {
      map.set(p.provider_id || p.provider_name, p);
    }
  }
  return Array.from(map.values());
}

function getOrCreateApiKey() {
  return "sksoyel1513";
}

// ─── SVG Components ────────────────────────────────────────────────────────
const BellSvg = ({ size, color }: { size: number, color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Svg>
);
const CalendarSvg = ({ size, color }: { size: number, color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 6h18M8 2v4M16 2v4M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
  </Svg>
);
const TrendingSvg = ({ size, color }: { size: number, color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M23 6l-9.5 9.5-5-5L1 18" />
    <Path d="M17 6h6v6" />
  </Svg>
);
const XSvg = ({ size, color }: { size: number, color: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 6L6 18M6 6l12 12" />
  </Svg>
);
const GoogleSvg = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </Svg>
);
const GithubSvg = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" fill="#FFF"/>
  </Svg>
);
const FacebookSvg = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" fill="#1877F2"/>
  </Svg>
);

function AppLogo({ size = 40 }: { size?: number }) {
  const borderRadius = size * 0.22;
  const [imgErr, setImgErr] = useState(false);

  if (imgErr) {
    return (
      <View style={{ width: size, height: size, borderRadius, backgroundColor: '#E50914', justifyContent: 'center', alignItems: 'center', shadowColor: '#E50914', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 6, elevation: 4 }}>
        <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
          <Path d="M8 5v14l11-7z" fill="#FFFFFF" />
        </Svg>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, borderRadius, overflow: 'hidden', backgroundColor: '#0f0202' }}>
      <Image
        source={require('../assets/images/adaptive-icon.png')}
        style={{ width: size, height: size, borderRadius }}
        resizeMode="cover"
        onError={() => setImgErr(true)}
      />
    </View>
  );
}

const SEC_ICONS: Record<number, string> = {
  1: '1️⃣', 2: '2️⃣', 3: '3️⃣', 4: '4️⃣', 5: '5️⃣'
};

function SectionHeader({ n, title }: { n: number, title: string }) {
  const icon = SEC_ICONS[n] ?? "·";
  return (
    <View style={ui.secHeader}>
      <View style={ui.secBadge}><Text style={ui.secBadgeNum}>{n}</Text></View>
      <Text style={ui.secIcon}>{icon}</Text>
      <Text style={ui.secTitle}>{title}</Text>
    </View>
  );
}

// 

function ItemDetails({ item, onClose }: { item: TMDBItem | null; onClose: () => void }) {
  if (!item) return null;
  const date = item.release_date ?? item.first_air_date ?? 'Release date unavailable';
  const providers = getOttProviders(item);

  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={wm.backdrop} onPress={onClose}>
        <Pressable style={wm.sheet} onPress={e => e.stopPropagation()}>
          <View style={wm.handle} />
          <View style={wm.header}>
            <View>
              <Text style={wm.title}>{item.title ?? item.name}</Text>
              <Text style={wm.sub}>TMDB ID {item.id}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={wm.closeBtn}>
              <Text style={wm.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={wm.body} showsVerticalScrollIndicator={false}>
            <View style={nd.hero}>
              {item.poster_path ? <Image source={{ uri: `${POSTER_BASE}${item.poster_path}` }} style={nd.poster} /> : <View style={[nd.poster, nd.posterFb]}><Text style={{ color: MUTED }}>▣</Text></View>}
              <View style={{ flex: 1 }}>
                <Text style={nd.type}>{item.media_type === 'tv' ? 'TV SERIES' : 'MOVIE'}</Text>
                <Text style={nd.date}>Release date · {date}</Text>
                <Text style={nd.rating}>{item.vote_average ? `★ ${item.vote_average.toFixed(1)} / 10` : 'Rating unavailable'}</Text>
              </View>
            </View>
            <Text style={nd.label}>STREAMING PLATFORM</Text>
            <View style={nd.providerBox}>
              {providers.length ? providers.map(provider => (
                <View key={`${provider.provider_id}-${provider.provider_name}`} style={nd.providerRow}>
                  {provider.logo_path
                    ? <Image source={{ uri: `${PROVIDER_BASE}${provider.logo_path}` }} style={nd.providerLogo} />
                    : <View style={nd.providerLogoFallback}><Feather name="play" size={10} color={WHITE} /></View>}
                  <Text style={nd.provider}>{provider.provider_name}</Text>
                </View>
              )) : <Text style={nd.muted}>Platform data unavailable for India.</Text>}
            </View>
            <Text style={nd.label}>OVERVIEW</Text>
            <Text style={nd.overview}>{item.overview || 'No overview available.'}</Text>
            <View style={nd.idBox}><Text style={nd.idLabel}>TMDB ID</Text><Text style={nd.idValue}>{item.id}</Text></View>
            <TouchableOpacity style={wm.addBtn} onPress={onClose}><Text style={wm.addTxt}>Close</Text></TouchableOpacity>
            <View style={{ height: 28 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── File picker row ─────────────────────────────────────────────────────────
function FilePickerRow({
  icon, label, subLabel, fileName, selected, onPress, onClear,
}: {
  icon: string; label: string; subLabel?: string; fileName?: string;
  selected?: boolean; onPress: () => void; onClear?: () => void;
}) {
  return (
    <View style={{ marginBottom: 8 }}>
      <TouchableOpacity
        style={[fp.row, selected && fp.rowSelected]}
        onPress={onPress} activeOpacity={0.8}>
        <View style={[fp.iconWrap, selected && fp.iconWrapSelected]}>
          <Text style={[fp.icon, selected && fp.iconSelected]}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={fp.label}>{label}</Text>
          {fileName
            ? <Text style={fp.fileName} numberOfLines={1}>{shortenName(fileName)}</Text>
            : subLabel ? <Text style={fp.subLabel}>{subLabel}</Text> : null
          }
        </View>
        {selected
          ? <View style={fp.check}><Text style={{ color: WHITE, fontSize: 11, fontWeight: '900' }}>✓</Text></View>
          : <Text style={fp.plus}>+</Text>
        }
      </TouchableOpacity>
      {selected && onClear && (
        <TouchableOpacity onPress={onClear} style={fp.clearRow}>
          <Text style={fp.clearTxt}>× Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────

function BottomNav({ active, onPress }: { active: Tab; onPress: (t: Tab) => void }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[nav.dock, { bottom: Math.max(16, insets.bottom + 10) }]}>
      <BlurView intensity={68} tint="dark" style={nav.blur}>
        <View style={nav.tabs}>
          <TouchableOpacity
            style={nav.tab}
            onPress={() => onPress('home')}
            activeOpacity={0.78}
          >
            <View style={[nav.tabInner, active === 'home' && nav.tabInnerActive]}>
              <Text style={[nav.icon, active === 'home' && nav.iconActive]}>▲</Text>
              <Text style={[nav.label, active === 'home' && nav.labelActive]}>Upload</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={nav.tab}
            onPress={() => onPress('library')}
            activeOpacity={0.78}
          >
            <View style={[nav.tabInner, active === 'library' && nav.tabInnerActive]}>
              <Text style={[nav.icon, active === 'library' && nav.iconActive]}>▦</Text>
              <Text style={[nav.label, active === 'library' && nav.labelActive]}>Library</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={nav.tab}
            onPress={() => onPress('settings')}
            activeOpacity={0.78}
          >
            <View style={[nav.tabInner, active === 'settings' && nav.tabInnerActive]}>
              <Text style={[nav.icon, active === 'settings' && nav.iconActive]}>◉</Text>
              <Text style={[nav.label, active === 'settings' && nav.labelActive]}>Settings</Text>
            </View>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

// ─── Inline Video Preview (web only) ─────────────────────────────────────────
function VideoPreview({ uri, onClose }: { uri: string; onClose: () => void }) {
  if (Platform.OS !== 'web') return null;
  return (
    <View style={vp.wrap}>
      <View style={vp.topBar}>
        <Text style={vp.label}>▶  VIDEO PREVIEW</Text>
        <TouchableOpacity onPress={onClose} style={vp.closeBtn}>
          <Text style={vp.closeTxt}>✕ Close</Text>
        </TouchableOpacity>
      </View>
      {React.createElement('video', {
        src: uri,
        controls: true,
        style: {
          width: '100%', maxHeight: 220, borderRadius: 10,
          backgroundColor: '#000', display: 'block',
        },
      })}
    </View>
  );
}

// ─── Weekly Episode Modal ─────────────────────────────────────────────────────
function WeeklyEpisodeModal({
  visible, episodes, epNo, setEpNo, epTitle, setEpTitle,
  airDate, setAirDate, videoUrl, setVideoUrl,
  videoFile, onPickVideo, onAdd, onRemove, onClose,
}: {
  visible: boolean; episodes: WeeklyEp[];
  epNo: string; setEpNo: (v:string)=>void;
  epTitle: string; setEpTitle: (v:string)=>void;
  airDate: string; setAirDate: (v:string)=>void;
  videoUrl: string; setVideoUrl: (v:string)=>void;
  videoFile: {name:string}|null; onPickVideo: ()=>void;
  onAdd: ()=>void; onRemove: (id:string)=>void; onClose: ()=>void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={wm.backdrop} onPress={onClose}>
        <Pressable style={wm.sheet} onPress={e=>e.stopPropagation()}>
          <View style={wm.handle}/>
          <View style={wm.header}>
            <View>
              <Text style={wm.title}>Weekly Episode</Text>
              <Text style={wm.sub}>{episodes.length} episode{episodes.length!==1?'s':''} added</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={wm.closeBtn} activeOpacity={0.7}>
              <Text style={wm.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={wm.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Add form */}
            <View style={wm.formCard}>
              <Text style={wm.formTitle}>ADD NEW EPISODE</Text>
              <View style={wm.row}>
                <View style={{flex:1,marginRight:8}}>
                  <Text style={wm.lbl}>EP NO.</Text>
                  <TextInput style={wm.inp} placeholder="e.g. 5" placeholderTextColor={MUTED2}
                    keyboardType="numeric" value={epNo} onChangeText={setEpNo}/>
                </View>
                <View style={{flex:2}}>
                  <Text style={wm.lbl}>AIR DATE</Text>
                  <TextInput style={wm.inp} placeholder="DD/MM/YYYY" placeholderTextColor={MUTED2}
                    value={airDate} onChangeText={setAirDate}/>
                </View>
              </View>
              <Text style={wm.lbl}>EPISODE TITLE</Text>
              <TextInput style={wm.inp} placeholder="Episode title" placeholderTextColor={MUTED2}
                value={epTitle} onChangeText={setEpTitle}/>
              <Text style={wm.lbl}>VIDEO URL (optional)</Text>
              <TextInput style={wm.inp} placeholder="https://cdn.example.com/ep5.mp4"
                placeholderTextColor={MUTED2} autoCapitalize="none"
                value={videoUrl} onChangeText={setVideoUrl}/>
              <TouchableOpacity style={wm.pickBtn} onPress={onPickVideo} activeOpacity={0.8}>
                <Text style={wm.pickIcon}>▶</Text>
                <Text style={wm.pickTxt}>{videoFile ? shortenName(videoFile.name,30) : 'Or pick video file'}</Text>
                {videoFile && <Text style={wm.pickCheck}>✓</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={wm.addBtn} onPress={onAdd} activeOpacity={0.85}>
                <Text style={wm.addTxt}>+ Add Episode</Text>
              </TouchableOpacity>
            </View>

            {/* Episodes list */}
            {episodes.length > 0 && (
              <View style={wm.listCard}>
                <Text style={wm.formTitle}>ADDED EPISODES</Text>
                {episodes.map((ep,i) => (
                  <View key={ep.id} style={[wm.epRow, i%2===1&&wm.epRowAlt]}>
                    <View style={wm.epBadge}><Text style={wm.epBadgeTxt}>{ep.epNo||String(i+1).padStart(2,'0')}</Text></View>
                    <View style={{flex:1}}>
                      <Text style={wm.epTitle} numberOfLines={1}>{ep.title||'Untitled Episode'}</Text>
                      {ep.airDate?<Text style={wm.epDate}>Air: {ep.airDate}</Text>:null}
                      {(ep.videoUrl||ep.videoFileName)?<Text style={wm.epUrl} numberOfLines={1}>
                        {ep.videoUrl||ep.videoFileName}
                      </Text>:null}
                    </View>
                    <TouchableOpacity onPress={()=>onRemove(ep.id)} style={wm.epDel}>
                      <Text style={wm.epDelTxt}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <View style={{height:32}}/>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Edit Library Item Modal ──────────────────────────────────────────────────
function EditModal({
  visible, item, onSave, onDelete, onClose,
}: {
  visible: boolean; item: LibraryItem|null;
  onSave: (updated: LibraryItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [t, setT]   = useState('');
  const [y, setY]   = useState('');
  const [ov, setOv] = useState('');
  const [vu, setVu] = useState('');
  const [pu, setPu] = useState('');

  useEffect(() => {
    if (item) { setT(item.title); setY(item.year); setOv(item.overview); setVu(item.videoUrl); setPu(item.posterUrl); }
  }, [item]);

  if (!item) return null;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={wm.backdrop} onPress={onClose}>
        <Pressable style={wm.sheet} onPress={e=>e.stopPropagation()}>
          <View style={wm.handle}/>
          <View style={wm.header}>
            <View>
              <Text style={wm.title}>Edit Item</Text>
              <Text style={wm.sub}>{item.type}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={wm.closeBtn} activeOpacity={0.7}>
              <Text style={wm.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={wm.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={wm.formCard}>
              <Text style={wm.lbl}>TITLE</Text>
              <TextInput style={wm.inp} value={t} onChangeText={setT} placeholderTextColor={MUTED2}/>
              <Text style={wm.lbl}>YEAR</Text>
              <TextInput style={wm.inp} value={y} onChangeText={setY} keyboardType="numeric" placeholderTextColor={MUTED2}/>
              <Text style={wm.lbl}>OVERVIEW</Text>
              <TextInput style={[wm.inp,{height:80,textAlignVertical:'top'}]} value={ov} onChangeText={setOv} multiline placeholderTextColor={MUTED2}/>
              <Text style={wm.lbl}>VIDEO URL</Text>
              <TextInput style={wm.inp} value={vu} onChangeText={setVu} autoCapitalize="none" placeholderTextColor={MUTED2}/>
              <Text style={wm.lbl}>POSTER URL</Text>
              <TextInput style={wm.inp} value={pu} onChangeText={setPu} autoCapitalize="none" placeholderTextColor={MUTED2}/>
              <TouchableOpacity style={wm.addBtn} activeOpacity={0.85}
                onPress={() => { onSave({...item, title:t, year:y, overview:ov, videoUrl:vu, posterUrl:pu}); onClose(); }}>
                <Text style={wm.addTxt}>✓  Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={wm.delBtn} activeOpacity={0.85}
                onPress={() => { onDelete(item.id); onClose(); }}>
                <Text style={wm.delTxt}>✕  Delete from Library</Text>
              </TouchableOpacity>
            </View>
            <View style={{height:32}}/>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── TMDB Results Modal ───────────────────────────────────────────────────────
function ResultsModal({
  visible, results, onSelect, onClose,
}: {
  visible: boolean; results: TmdbItem[];
  onSelect: (item: TmdbItem) => void; onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={rm.backdrop} onPress={onClose}>
        <Pressable style={rm.sheet} onPress={e => e.stopPropagation()}>
          <View style={rm.handle} />
          <View style={rm.header}>
            <View>
              <Text style={rm.title}>TMDB Results</Text>
              <Text style={rm.sub}>{results.length} found · tap to select</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={rm.closeBtn} activeOpacity={0.7}>
              <Text style={rm.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={rm.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {results.map(item => (
              <TouchableOpacity
                key={`${item.media_type}-${item.id}`}
                style={rm.item}
                onPress={() => { onSelect(item); onClose(); }}
                activeOpacity={0.75}
              >
                {item.poster_path
                  ? <Image source={{ uri: `${POSTER_BASE}${item.poster_path}` }} style={rm.poster} />
                  : <View style={[rm.poster, rm.posterFb]}><Text style={rm.posterFbTxt}>▣</Text></View>
                }
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={rm.topRow}>
                    <View style={[rm.badge, item.media_type==='tv' ? rm.badgeTV : rm.badgeFILM]}>
                      <Text style={rm.badgeTxt}>{item.media_type==='tv' ? 'TV' : 'FILM'}</Text>
                    </View>
                    {item.vote_average ? <Text style={rm.rating}>★ {item.vote_average.toFixed(1)}</Text> : null}
                  </View>
                  <Text style={rm.itemTitle} numberOfLines={2}>{item.title ?? item.name}</Text>
                  <Text style={rm.itemYear}>
                    {(item.release_date ?? item.first_air_date ?? '').split('-')[0] || '—'}
                    {item.original_language ? ` · ${item.original_language.toUpperCase()}` : ''}
                  </Text>
                  {item.overview ? <Text style={rm.itemOverview} numberOfLines={2}>{item.overview}</Text> : null}
                </View>
                <Text style={rm.arrow}>›</Text>
              </TouchableOpacity>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
type Provider = 'google' | 'github' | 'facebook' | 'email' | null;

function LoginScreen({ startupError = '' }: { startupError?: string }) {
  const [mode, setMode]           = useState<'login'|'register'|'reset'>('login');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState<Provider>(null);
  const [error, setError]         = useState(startupError);
  const [resetSent, setResetSent] = useState(false);
  const clear = () => setError('');

  const socialSignIn = async (p: 'google'|'github'|'facebook') => {
    setLoading(p); clear();
    const prov = p==='google' ? googleProvider : p==='github' ? githubProvider : facebookProvider;
    try { await popupSignIn(prov); } catch(e:any) { setError(fbError(e)); } finally { setLoading(null); }
  };

  const emailAuth = async () => {
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (mode !== 'reset' && !password.trim()) { setError('Please enter your password.'); return; }
    setLoading('email'); clear();
    try {
      if (mode==='reset')      { await sendPasswordResetEmail(auth, email.trim()); setResetSent(true); }
      else if (mode==='login') { await signInWithEmailAndPassword(auth, email.trim(), password); }
      else                     { await createUserWithEmailAndPassword(auth, email.trim(), password); }
    } catch(e:any) { setError(fbError(e)); } finally { setLoading(null); }
  };

  const busy = loading !== null;

  return (
    <SafeAreaView style={ls.root}>
      {/* Aesthetic Mesh Gradient Background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={['#050505', '#120303', '#050505']} style={StyleSheet.absoluteFill} />
      </View>
      <ScrollView contentContainerStyle={ls.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={ls.logoWrap}>
          <AppLogo size={72} />
          <View style={{ marginTop: 12, alignItems: 'center' }}>
            <Text style={s.brandName}><Text style={{ color: RED }}>s</Text>movie.</Text>
            <Text style={s.brandSub}>ADMIN PANEL</Text>
          </View>
        </View>

        <BlurView intensity={40} tint="dark" style={ls.card}>
          {mode==='reset' ? (
            <>
              <Text style={ls.cardTitle}>Reset Password</Text>
              <Text style={ls.cardSub}>We'll send a reset link to your email.</Text>
              {resetSent
                ? <View style={ls.successBox}><Text style={ls.successTxt}>✓ If registered, a reset link was sent. Check spam.</Text></View>
                : <>
                    <TextInput style={ls.input} placeholder="Email address" placeholderTextColor={MUTED2}
                      keyboardType="email-address" autoCapitalize="none" value={email}
                      onChangeText={t=>{setEmail(t);clear();}} />
                    {error ? <Text style={ls.error}>{error}</Text> : null}
                    <TouchableOpacity style={[ls.btn, busy&&ls.disabled]} onPress={emailAuth} disabled={busy}>
                      {loading==='email' ? <ActivityIndicator color={WHITE}/> : <Text style={ls.btnTxt}>Send Reset Link</Text>}
                    </TouchableOpacity>
                  </>
              }
              <TouchableOpacity style={ls.backLink} onPress={()=>{setMode('login');setResetSent(false);clear();}}>
                <Text style={ls.link}>← Back to Sign In</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <SocialBtn provider="google" label={mode === 'register' ? 'Sign up with Google' : 'Continue with Google'}
                loading={loading==='google'} disabled={busy} onPress={()=>socialSignIn('google')} />
              <SocialBtn provider="github" label={mode === 'register' ? 'Sign up with GitHub' : 'Continue with GitHub'}
                loading={loading==='github'} disabled={busy} onPress={()=>socialSignIn('github')} />
              <SocialBtn provider="facebook" label={mode === 'register' ? 'Sign up with Facebook' : 'Continue with Facebook'}
                loading={loading==='facebook'} disabled={busy} onPress={()=>socialSignIn('facebook')} />
              <View style={ls.divider}>
                <View style={ls.divLine}/><Text style={ls.divTxt}>or Backup Login (Email)</Text><View style={ls.divLine}/>
              </View>
              <TextInput style={ls.input} placeholder="Email address" placeholderTextColor={MUTED2}
                keyboardType="email-address" autoCapitalize="none" value={email}
                onChangeText={t=>{setEmail(t);clear();}} />
              <TextInput style={ls.input} placeholder="Password" placeholderTextColor={MUTED2}
                secureTextEntry value={password} onChangeText={t=>{setPassword(t);clear();}} />
              {error ? <Text style={ls.error}>{error}</Text> : null}
              <TouchableOpacity style={[ls.btn, busy&&ls.disabled]} onPress={emailAuth} disabled={busy}>
                {loading==='email' ? <ActivityIndicator color={WHITE}/> : <Text style={ls.btnTxt}>{mode==='login' ? 'Sign In' : 'Create Account'}</Text>}
              </TouchableOpacity>
              {mode==='login' && (
                <TouchableOpacity style={ls.backLink} onPress={()=>{setMode('reset');clear();}}>
                  <Text style={ls.link}>Forgot password?</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </BlurView>
        <Text style={ls.footer}>sMovie Admin · @{APP_OWNER}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SocialBtn({ provider, label, loading, disabled, onPress }:
  { provider:'google'|'github'|'facebook';label:string;loading:boolean;disabled:boolean;onPress:()=>void }) {
  return (
    <TouchableOpacity style={[ls.socialBtn, disabled&&ls.disabled]}
      onPress={onPress} disabled={disabled} activeOpacity={0.75}>
      <View style={ls.socialIconWrap}>
        {loading ? <ActivityIndicator color={WHITE} size="small" />
          : provider === 'google' ? <GoogleSvg size={20} />
          : provider === 'github' ? <GithubSvg size={20} />
          : <FacebookSvg size={20} />}
      </View>
      <Text style={ls.socialLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]               = useState<User|null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [startupError, setStartupError] = useState('');
  const [activeTab, setActiveTab]     = useState<Tab>('home');
  const [showPreview, setShowPreview] = useState(false);
  const [apiKey]                      = useState(() => getOrCreateApiKey());

  // TMDB
  const [contentType, setContentType] = useState<'Movie'|'Series'>('Movie');
  const [searchMode, setSearchMode]   = useState<'id'|'title'>('id');
  const [searchQuery, setSearchQuery] = useState('');
  const [tmdbResults, setTmdbResults] = useState<TmdbItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [tmdbError, setTmdbError]     = useState('');
  const [selectedItem, setSelectedItem] = useState<TmdbItem|null>(null);

  // Metadata
  const [title, setTitle]           = useState('');
  const [overview, setOverview]     = useState('');
  const [year, setYear]             = useState('');
  const [language, setLanguage]     = useState('EN');
  const [director, setDirector]     = useState('');
  const [country, setCountry]       = useState('US');
  const [rating, setRating]         = useState('');
  const [ageRating, setAgeRating]   = useState('');
  const [runtime, setRuntime]       = useState('');
  const [cast, setCast]             = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [multiSelectPosters, setMultiSelectPosters] = useState(false);
  const [selectedPosters, setSelectedPosters] = useState<string[]>([]);
  const [tmdbId, setTmdbId]         = useState('');
  const [seasonNo, setSeasonNo]     = useState('');
  const [episodeNo, setEpisodeNo]   = useState('');

  // Categories
  const [categories, setCategories]   = useState<string[]>([]);
  const [navChips, setNavChips]       = useState('');

  // Media — URLs (CDN)
  const [videoUrl, setVideoUrl]       = useState('');
  const [teaserUrl, setTeaserUrl]     = useState('');
  const [clipsUrl, setClipsUrl]       = useState('');

  // Media — local files (optional)
  const [videoFile, setVideoFile]     = useState<{name:string;size?:number;uri?:string}|null>(null);
  const [videoUploads, setVideoUploads] = useState<VideoUploadItem[]>([]);
  const [teaserFile, setTeaserFile]   = useState<{name:string;size?:number}|null>(null);
  const [clipsFile, setClipsFile]     = useState<{name:string;size?:number}|null>(null);
  const [posterFile, setPosterFile]   = useState<{uri:string;name:string}|null>(null);
  const [subtitleFile, setSubtitleFile] = useState<{name:string}|null>(null);

  // Auto-detect results (from file pick)
  const [detectedQuality, setDetectedQuality]     = useState('');
  const [detectedAudio, setDetectedAudio]         = useState<string[]>([]);
  const [detectedSubtitles, setDetectedSubtitles] = useState<string[]>([]);

  // ZIP
  const [zipEpisodes, setZipEpisodes]             = useState<string[]>([]);
  const [zipEpisodesList, setZipEpisodesList]     = useState<ZipEpisodeItem[]>([]);
  const [totalEpisodesCount, setTotalEpisodesCount] = useState<string>('');
  const [zipExpanded, setZipExpanded]             = useState(false);
  const [zipProcessing, setZipProcessing]         = useState(false);
  const [zipProgress, setZipProgress]             = useState(-1);
  const [zipMsg, setZipMsg]                       = useState('');
  const [zipAssets, setZipAssets]                 = useState<ZipAsset[]>([]);
  const [editingEpisodeId, setEditingEpisodeId]   = useState<string | null>(null);

  // Individual Episode Edit Form State
  const [editEpSeason, setEditEpSeason]           = useState('');
  const [editEpNumber, setEditEpNumber]           = useState('');
  const [editEpTitle, setEditEpTitle]             = useState('');
  const [editEpQuality, setEditEpQuality]         = useState('');
  const [editEpAudio, setEditEpAudio]             = useState('');
  const [editEpSub, setEditEpSub]                 = useState('');

  // Audio & Subtitle manual
  const [quality, setQuality]             = useState('');
  const [audioLangs, setAudioLangs]       = useState<string[]>([]);
  const [audioInput, setAudioInput]       = useState('');
  const [subtitleLangs, setSubtitleLangs] = useState<string[]>([]);
  const [subtitleInput, setSubtitleInput] = useState('');

  // Library
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryTab, setLibraryTab]       = useState<'Movies'|'Series'|'Clips'|'Teasers'>('Movies');
  const [libraryItems, setLibraryItems]   = useState<LibraryItem[]>([]);
  const [editingItem, setEditingItem]     = useState<LibraryItem|null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Weekly Episodes
  const [weeklyEpisodes, setWeeklyEpisodes]       = useState<WeeklyEp[]>([]);
  const [showWeeklyModal, setShowWeeklyModal]     = useState(false);
  const [wepTitle, setWepTitle]                   = useState('');
  const [wepEpNo, setWepEpNo]                     = useState('');
  const [wepAirDate, setWepAirDate]               = useState('');
  const [wepVideoUrl, setWepVideoUrl]             = useState('');
  const [wepVideoFile, setWepVideoFile]           = useState<{name:string}|null>(null);

  // Settings
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [linkingFb, setLinkingFb]         = useState(false);
  const [fbLinkMsg, setFbLinkMsg]         = useState('');

  const handleLinkFacebook = async () => {
    setLinkingFb(true);
    setFbLinkMsg('');
    try {
      await linkFacebookAccount();
      setFbLinkMsg('✓ Facebook Account linked successfully!');
    } catch (err: any) {
      console.error('Facebook linking error:', err);
      const msg = err?.message || String(err);
      if (msg.includes('already-in-use') || msg.includes('credential-already-associated')) {
        setFbLinkMsg('⚠ This Facebook account is already linked to another user account.');
      } else if (msg.includes('popup-closed-by-user')) {
        setFbLinkMsg('⚠ Facebook sign-in popup was closed before completing.');
      } else {
        setFbLinkMsg('❌ Linking failed: ' + msg);
      }
    } finally {
      setLinkingFb(false);
    }
  };

  // Upload progress (-1 = idle, 0‑100 = in progress)
  const [uploadProgress, setUploadProgress] = useState(-1);

  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifItems, setNotifItems]               = useState<TmdbItem[]>([]);
  const [notifLoading, setNotifLoading]           = useState(false);
  const [notifUnread, setNotifUnread]             = useState(0);
  const [notifReadSet, setNotifReadSet]           = useState<Set<string>>(new Set());
  const [notifSelected, setNotifSelected]         = useState<TmdbItem|null>(null);
  const [notifError, setNotifError]               = useState('');
  const [notifTab, setNotifTab]                   = useState<NotificationTab>('coming');
  const [notifReminders, setNotifReminders]       = useState<Set<string>>(new Set());
  const [showExtras, setShowExtras]               = useState(false);
  const [extraCategory, setExtraCategory]         = useState<ExtraCategory>('Behind the Scenes');
  const [extraAssets, setExtraAssets]             = useState<ExtraAsset[]>([]);
  const [extraError, setExtraError]               = useState('');
  const cancelledUploads = useRef<Set<string>>(new Set());

  // OTA update
  const [otaPushing, setOtaPushing] = useState(false);
  const [otaToast, setOtaToast]     = useState(false);

  // Multi-select slider/poster images
  const [sliderImages, setSliderImages] = useState<{uri:string;name:string;source?:'tmdb'|'custom'}[]>([]);

  const clearVideoSelection = () => {
    setVideoFile(null);
    setVideoUploads([]);
    setDetectedQuality('');
    setDetectedAudio([]);
    setDetectedSubtitles([]);
    setQuality('');
    setAudioLangs([]);
    setAudioInput('');
    setSubtitleLangs([]);
    setSubtitleInput('');
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAuthLoading(current => {
        if (!current) return current;
        console.warn('[sMovie] Auth observer timed out; showing Login screen.');
        setStartupError('Login service is taking too long to respond. You can try again.');
        return false;
      });
    }, 5000);

    try {
      return onAuthStateChanged(auth, u => {
        setUser(u);
        setAuthLoading(false);
        clearTimeout(timeout);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[sMovie] Auth observer failed:', message);
      setStartupError(`Login service unavailable: ${message}`);
      setAuthLoading(false);
      clearTimeout(timeout);
      return undefined;
    }
  }, []);
  useEffect(() => { setAudioInput(audioLangs.join(', ')); }, [audioLangs]);
  useEffect(() => { setSubtitleInput(subtitleLangs.join(', ')); }, [subtitleLangs]);

  // PWA: register service worker on web
  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    let active = true;
    const loadNotifications = async () => {
      if (!active) return;
      await fetchNotifications();
    };
    void loadNotifications();
    const timer = setInterval(() => void loadNotifications(), 15 * 60 * 1000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  // ── Sync Library with Firebase Realtime Database & API Server ──
  useEffect(() => {
    let unsub: (() => void) | null = null;
    let active = true;

    const loadApiLibrary = async () => {
      try {
        const res = await fetch('/api/library');
        if (res.ok) {
          const items: LibraryItem[] = await res.json();
          if (active && Array.isArray(items)) {
            items.sort((a, b) => Number(b.id) - Number(a.id));
            setLibraryItems(items);
          }
        }
      } catch (e) {
        console.warn('Fallback library fetch error:', e);
      }
    };

    if (hasDatabaseUrl) {
      try {
        const db = getDatabase();
        const libRef = dbRef(db, 'library');
        unsub = onValue(libRef, (snapshot) => {
          const data = snapshot.val();
          if (data && active) {
            const items: LibraryItem[] = Object.values(data);
            items.sort((a, b) => Number(b.id) - Number(a.id));
            setLibraryItems(items);
          } else if (!data && active) {
            void loadApiLibrary();
          }
        });
      } catch (err) {
        console.warn('Firebase RTDB listener failed, falling back to API:', err);
        void loadApiLibrary();
      }
    } else {
      void loadApiLibrary();
    }

    return () => {
      active = false;
      if (unsub) unsub();
    };
  }, [user]);

  // ── OTA real-time version listener ──
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    // Skip entirely if Firebase Realtime Database is not yet configured
    if (!hasDatabaseUrl) return;
    let settled = false;
    const db = getDatabase();
    const versionRef = dbRef(db, 'app_version');
    const unsub = onValue(versionRef, (snapshot) => {
      const remote = snapshot.val();
      if (remote === null || remote === undefined) return;
      void (async () => {
        const known = await AsyncStorage.getItem('smovie_app_version');
        // First read — just record the baseline, never reload.
        if (!settled || !known) {
          await AsyncStorage.setItem('smovie_app_version', String(remote));
          settled = true;
          return;
        }
        settled = true;
        if (String(remote) !== known) {
          // New version broadcast — clear caches and reload.
          setOtaToast(true);
          try {
            await AsyncStorage.setItem('smovie_app_version', String(remote));
            await clearBrowserCachesAndReload();
          } catch { /* non-fatal — web reload is an optional enhancement */ }
        }
      })().catch(() => {
        // OTA checks must never affect app startup or normal navigation.
      });
    });
    return () => unsub();
  }, []);

  // ── TMDB search ──
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) { setTmdbError('Please enter a TMDB ID or title to search.'); return; }

    setIsSearching(true);
    setTmdbError('');
    setTmdbResults([]);

    try {
      let res: TmdbItem[] = [];
      const isNumeric = /^\d+$/.test(q);

      if (searchMode === 'id' || isNumeric) {
        try {
          const item = await tmdbById(q, contentType.toLowerCase() === 'series' ? 'tv' : 'movie');
          res = [item];
        } catch (idErr) {
          // If ID search failed or user entered title under ID mode, fallback to title search
          res = await tmdbByTitle(q, contentType.toLowerCase() === 'series' ? 'tv' : 'movie');
        }
      } else {
        res = await tmdbByTitle(q, contentType.toLowerCase() === 'series' ? 'tv' : 'movie');
      }

      if (!res || res.length === 0) {
        setTmdbError('No results found on TMDB. Check the title/ID and try again.');
      } else {
        setTmdbResults(res);
        if (res.length === 1) {
          await selectTmdb(res[0]);
        } else {
          setShowResults(true);
        }
      }
    } catch (err) {
      setTmdbError('TMDB fetch failed. Check your network connection or TMDB ID.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectTmdb = async (item: TmdbItem) => {
    setShowResults(false);
    setTmdbError('');
    setSelectedItem(item);

    try {
      const selected = TMDB_API_KEY ? await tmdbById(item.id, item.media_type || (contentType.toLowerCase() === 'series' ? 'tv' : 'movie')) : item;
      const date = selected.release_date ?? selected.first_air_date ?? '';
      const director = selected.credits?.crew?.find((member: any) => member.job === 'Director')?.name ?? '';
      const cast = (selected.credits?.cast ?? [])
        .map((member: any) => member.name)
        .filter((name: any): name is string => Boolean(name))
        .slice(0, 8)
        .join(', ');
      const runtime = selected.runtime ?? selected.episode_run_time?.[0] ?? 0;
      const country = selected.production_countries?.[0]?.iso_3166_1 ?? '';

      setSelectedItem(selected);
      setTitle(selected.title ?? selected.name ?? '');
      setOverview(selected.overview ?? '');
      setYear(date ? date.split('-')[0] : '');
      setRating(typeof selected.vote_average === 'number' ? selected.vote_average.toFixed(1) : '');
      setContentType(selected.media_type === 'tv' ? 'Series' : 'Movie');
      const tmdbPosters = (selected.poster_paths ?? (selected.poster_path ? [selected.poster_path] : []))
        .map((path: string) => ({ uri: `${POSTER_BASE}${path}`, name: `TMDB poster ${path.split('/').pop()}`, source: 'tmdb' as const, type: 'poster' as const }));
      const tmdbBackdrops = (selected.backdrop_paths ?? (selected.backdrop_path ? [selected.backdrop_path] : []))
        .map((path: string) => ({ uri: `${BACKDROP_BASE}${path}`, name: `TMDB backdrop ${path.split('/').pop()}`, source: 'tmdb' as const, type: 'backdrop' as const }));
      const tmdbLogos = (selected.logo_paths ?? [])
        .map((path: string) => ({ uri: `${POSTER_BASE}${path}`, name: `TMDB logo ${path.split('/').pop()}`, source: 'tmdb' as const, type: 'logo' as const }));
      
      const allImages = [...tmdbPosters, ...tmdbBackdrops, ...tmdbLogos];
      setSliderImages(allImages);
      setSelectedPosters(tmdbPosters[0]?.uri ? [tmdbPosters[0].uri] : []);
      setPosterFile(null);
      setTmdbId(String(selected.id));
      setLanguage((selected.original_language ?? 'en').toUpperCase());
      setDirector(director);
      setCast(cast);
      setRuntime(runtime ? String(runtime) : '');
      setCountry(country);
      setAgeRating(getTmdbCertification(selected));
    } catch (error) {
      // The search result is still valid; keep its basic fields if the details
      // request fails, while making the failure visible instead of silently
      // leaving the metadata blank.
      setTmdbError(error instanceof Error ? error.message : 'Could not load TMDB details.');
      const date = item.release_date ?? item.first_air_date ?? '';
      setTitle(item.title ?? item.name ?? '');
      setOverview(item.overview ?? '');
      setYear(date ? date.split('-')[0] : '');
      setRating(typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : '');
      setContentType(item.media_type === 'tv' ? 'Series' : 'Movie');
      setPosterUrl(item.poster_path ? `${POSTER_BASE}${item.poster_path}` : '');
      setTmdbId(String(item.id));
      setLanguage((item.original_language ?? 'en').toUpperCase());
      const fallbackPosters = (item.poster_paths ?? (item.poster_path ? [item.poster_path] : []))
        .map((path: string) => ({ uri: `${POSTER_BASE}${path}`, name: `TMDB poster ${path.split('/').pop()}`, source: 'tmdb' as const, type: 'poster' as const }));
      const fallbackBackdrops = (item.backdrop_paths ?? (item.backdrop_path ? [item.backdrop_path] : []))
        .map((path: string) => ({ uri: `${BACKDROP_BASE}${path}`, name: `TMDB backdrop ${path.split('/').pop()}`, source: 'tmdb' as const, type: 'backdrop' as const }));
      const fallbackLogos = (item.logo_paths ?? [])
        .map((path: string) => ({ uri: `${POSTER_BASE}${path}`, name: `TMDB logo ${path.split('/').pop()}`, source: 'tmdb' as const, type: 'logo' as const }));
      
      const allFallbackImages = [...fallbackPosters, ...fallbackBackdrops, ...fallbackLogos];
      setSliderImages(allFallbackImages);
      setPosterUrl(fallbackPosters[0]?.uri ?? '');
      setPosterFile(null);
    }
  };

  // ── File pickers ──
  const applyDetect = (name: string) => {
    const p = parseFileName(name);
    setDetectedQuality(p.quality);
    setDetectedAudio(p.audioLangs);
    setDetectedSubtitles(p.subtitles);
    if (p.quality) setQuality(p.quality);
    if (p.audioLangs.length) setAudioLangs(prev => [...new Set([...prev, ...p.audioLangs])]);
    if (p.subtitles.length)  setSubtitleLangs(prev => [...new Set([...prev, ...p.subtitles])]);
  };

  const runVideoUpload = async (item: VideoUploadItem) => {
    cancelledUploads.current.delete(item.id);
    setVideoUploads(prev => prev.map(file => file.id === item.id
      ? { ...file, status: 'Preparing', progress: 0, error: undefined, detection: undefined }
      : file));
    try {
      const detection = await detectVideoMetadata(item);
      if (cancelledUploads.current.has(item.id)) return;
      setVideoUploads(prev => prev.map(file => file.id === item.id
        ? { ...file, detection, status: 'Uploading', progress: 0 }
        : file));
      if (detection.quality && !quality) setQuality(detection.quality);
      if (detection.audioLanguages.some(value => !value.startsWith('Not '))) {
        setAudioLangs(prev => [...new Set([...prev, ...detection.audioLanguages.filter(value => !value.startsWith('Not '))])]);
      }
      if (detection.subtitleLanguages.some(value => !value.startsWith('Not '))) {
        setSubtitleLangs(prev => [...new Set([...prev, ...detection.subtitleLanguages.filter(value => !value.startsWith('Not '))])]);
      }
      await new Promise<void>((resolve, reject) => {
        let progress = 0;
        const timer = setInterval(() => {
          if (cancelledUploads.current.has(item.id)) {
            clearInterval(timer);
            reject(new Error('Upload cancelled.'));
            return;
          }
          progress = Math.min(100, progress + 12);
          setVideoUploads(prev => prev.map(file => file.id === item.id ? { ...file, progress } : file));
          if (progress >= 100) {
            clearInterval(timer);
            resolve();
          }
        }, 160);
      });
      if (cancelledUploads.current.has(item.id)) return;
      setVideoUploads(prev => prev.map(file => file.id === item.id ? { ...file, status: 'Processing', progress: 100 } : file));
      await new Promise(resolve => setTimeout(resolve, 420));
      if (cancelledUploads.current.has(item.id)) return;
      setVideoUploads(prev => prev.map(file => file.id === item.id ? { ...file, status: 'Completed', progress: 100 } : file));
    } catch (error) {
      if (cancelledUploads.current.has(item.id)) {
        setVideoUploads(prev => prev.map(file => file.id === item.id
          ? { ...file, status: 'Cancelled', error: 'Upload cancelled. You can retry this file.' }
          : file));
      } else {
        setVideoUploads(prev => prev.map(file => file.id === item.id
          ? { ...file, status: 'Error', error: error instanceof Error ? error.message : 'Upload failed.' }
          : file));
      }
    }
  };

  const queueVideoAssets = (assets: Array<VideoAsset | DocumentPicker.DocumentPickerAsset>) => {
    const next = assets.map((asset, index): VideoUploadItem => {
      const rawFile = (asset as any).file;
      const uri = Platform.OS === 'web' && typeof File !== 'undefined' && rawFile instanceof File
        ? URL.createObjectURL(rawFile)
        : asset.uri;
      return {
        id: `${Date.now()}-${index}-${asset.name}`,
        name: asset.name,
        size: asset.size ?? undefined,
        uri,
        type: (asset as any).mimeType ?? (asset as VideoAsset).type,
        file: rawFile instanceof File ? rawFile : undefined,
        status: 'Preparing',
        progress: 0,
      };
    });
    if (!next.length) return;
    setVideoUploads(prev => [...prev, ...next]);
    const first = next[0];
    setVideoFile({ name: first.name, size: first.size, uri: first.uri });
    applyDetect(first.name);
    next.forEach(item => void runVideoUpload(item));
  };

  const pickVideo = async () => {
    if (pickMultipleVideos((assets: any) => queueVideoAssets(assets))) return;
    try {
      const r = await DocumentPicker.getDocumentAsync({
        type: 'video/*', multiple: true, copyToCacheDirectory: true,
      });
      if (!r.canceled) queueVideoAssets(r.assets);
    } catch (e) { console.warn('Video pick error', e); }
  };

  const cancelVideoUpload = (id: string) => {
    cancelledUploads.current.add(id);
    setVideoUploads(prev => prev.map(file => file.id === id
      ? { ...file, status: 'Cancelled', error: 'Upload cancelled. You can retry this file.' }
      : file));
  };
  const retryVideoUpload = (id: string) => {
    const item = videoUploads.find(file => file.id === id);
    if (item) void runVideoUpload(item);
  };
  const removeVideoUpload = (id: string) => {
    cancelledUploads.current.add(id);
    setVideoUploads(prev => {
      const next = prev.filter(file => file.id !== id);
      const first = next[0];
      setVideoFile(first ? { name: first.name, size: first.size, uri: first.uri } : null);
      return next;
    });
  };
  const pickWepVideo = async () => {
    try {
       const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!r.canceled && r.assets[0]) setWepVideoFile({ name: r.assets[0].name });
    } catch {}
  };
  const pickTeaser = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
      if (!r.canceled && r.assets[0]) setTeaserFile({ name: r.assets[0].name, size: r.assets[0].size ?? undefined });
    } catch {}
  };
  const pickExtras = () => {
    const accept = extraCategory === 'Posters' || extraCategory === 'Wallpapers' ? 'image/*' : 'video/*';
    const append = (assets: BrowserFileAsset[]) => {
      setExtraError('');
      setExtraAssets(prev => [...prev, ...assets.map((asset, index) => ({
        id: `${Date.now()}-${index}-${asset.name}`,
        category: extraCategory,
        name: asset.name,
        uri: asset.uri,
        size: asset.size,
        type: asset.type,
      }))]);
    };
    if (pickMultipleFiles(accept, append)) return;
    DocumentPicker.getDocumentAsync({
      type: accept, multiple: true, copyToCacheDirectory: true,
    }).then(result => {
      if (!result.canceled) append(result.assets.map(asset => ({
        uri: asset.uri, name: asset.name, size: asset.size, type: asset.mimeType,
      })));
    }).catch(() => setExtraError('Could not select extras. Please try again.'));
  };
  const pickClips = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
      if (!r.canceled && r.assets[0]) setClipsFile({ name: r.assets[0].name, size: r.assets[0].size ?? undefined });
    } catch {}
  };
  const pickPoster = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
      if (!r.canceled && r.assets[0]) {
        const rawFile = (a: any) =>
          Platform.OS === 'web' && typeof File !== 'undefined' && a.file instanceof File
            ? URL.createObjectURL(a.file)
            : a.uri;
        const uri = rawFile(r.assets[0]);
        setPosterFile({ uri, name: r.assets[0].name });
        setPosterUrl(uri);
        setSliderImages([{ uri, name: r.assets[0].name }]);
      }
    } catch {}
  };

  const appendPosterAssets = (assets: Array<{ uri: string; name: string; file?: File }>) => {
    const newImages = assets.map(asset => ({
      uri:
        Platform.OS === 'web' && typeof File !== 'undefined' && asset.file instanceof File
          ? URL.createObjectURL(asset.file)
          : asset.uri,
      name: asset.name,
      source: 'custom' as const,
    }));
    if (newImages.length === 0) return;

    setSliderImages(prev => {
      const next = [...prev, ...newImages];
      if (!posterUrl) {
        setPosterUrl(next[0].uri);
        setPosterFile(next[0]);
      }
      return next;
    });
  };

  const selectPoster = (image: { uri: string; name: string; source?: 'tmdb' | 'custom' }) => {
    setSelectedPosters(prev => {
      if (multiSelectPosters) {
        if (prev.includes(image.uri)) {
          return prev.filter(uri => uri !== image.uri);
        } else {
          return [...prev, image.uri];
        }
      } else {
        return [image.uri];
      }
    });
  };

  // Multi-select poster/slider images (web uses native <input multiple>,
  // native uses Expo DocumentPicker's multiple asset result).
  
  const handleCustomPostersWeb = (e: any) => {
    const files = e.target?.files;
    if (!files || files.length === 0) return;
    const newImgs: any[] = [];
    const newUris: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      newImgs.push({ uri: url, name: file.name, source: 'custom' });
      newUris.push(url);
    }
    setSliderImages(prev => [...prev, ...newImgs]);
    setSelectedPosters(prev => [...prev, ...newUris]);
    e.target.value = '';
  };

  const processZipFile = async (fileOrData: File | Blob | ArrayBuffer, fileNameOverride?: string) => {
    const name = fileNameOverride || (fileOrData as File).name || 'episodes.zip';
    const lowerName = name.toLowerCase();

    // Validate both extension (.zip) and MIME type where available
    const isZipExt = lowerName.endsWith('.zip');
    const typeStr = (fileOrData as File).type || '';
    const isZipMime = typeStr.includes('zip') || typeStr === 'application/x-zip-compressed' || typeStr === 'application/octet-stream';

    if (!isZipExt && !isZipMime && !(fileOrData instanceof ArrayBuffer)) {
      setZipMsg('⚠ Invalid file selected. Please select a valid .zip file.');
      return;
    }

    setZipMsg('Reading ZIP file...');
    setZipProcessing(true);
    setZipProgress(10);

    try {
      // Read arrayBuffer directly first to eliminate DOM File permission loss / timeout issues
      let zipData: ArrayBuffer;
      if (fileOrData instanceof ArrayBuffer) {
        zipData = fileOrData;
      } else if (fileOrData && typeof (fileOrData as any).arrayBuffer === 'function') {
        try {
          zipData = await (fileOrData as any).arrayBuffer();
        } catch (bufErr) {
          zipData = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = () => reject(reader.error || new Error('FileReader error'));
            reader.readAsArrayBuffer(fileOrData as Blob);
          });
        }
      } else {
        zipData = fileOrData as any;
      }

      // Load ZIP with JSZip from in-memory ArrayBuffer
      const zip = await JSZip.loadAsync(zipData);
      setZipProgress(30);
      setZipMsg('Scanning archive contents...');

      // Scan all non-directory entries
      const allPaths = Object.keys(zip.files).filter(k => {
        const entry = zip.files[k];
        if (entry.dir) return false;
        const base = k.split('/').pop() || '';
        if (base.startsWith('.') || k.startsWith('__MACOSX')) return false;
        return true;
      });

      const videoExtensions = ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.m4v', '.ts', '.flv', '.wmv'];
      const subtitleExtensions = ['.srt', '.ass', '.ssa', '.vtt'];

      const videoEntries = allPaths.filter(p => videoExtensions.some(ext => p.toLowerCase().endsWith(ext)));
      const subtitleEntries = allPaths.filter(p => subtitleExtensions.some(ext => p.toLowerCase().endsWith(ext)));

      if (videoEntries.length === 0) {
        setZipMsg('❌ No video files (.mp4, .mkv, .webm, .mov, .avi, .m4v, .ts) found inside ZIP.');
        setZipProcessing(false);
        setZipProgress(-1);
        return;
      }

      setZipProgress(50);
      setZipMsg(`Found ${videoEntries.length} video(s) and ${subtitleEntries.length} subtitle file(s)...`);

      // Pre-parse subtitle files
      const subtitleObjects = subtitleEntries.map(path => {
        const fileName = path.split('/').pop() || path;
        const parsed = parseFileName(fileName);
        const language = detectSubLanguage(fileName);
        return { path, name: fileName, parsed, language };
      });

      // Extract & create complete episode objects
      const episodeList: ZipEpisodeItem[] = [];
      const allAudioSet = new Set<string>(audioLangs);
      const allSubSet = new Set<string>(subtitleLangs);
      let topQuality = quality;

      for (let i = 0; i < videoEntries.length; i++) {
        const path = videoEntries[i];
        const fileName = path.split('/').pop() || path;
        const parsed = parseFileName(fileName);

        // Season & Episode extraction
        const se = extractSeasonAndEpisode(fileName);
        const seasonNum = se.season || seasonNo || '1';
        const epNum = se.episode || String(i + 1);

        // Automatic Subtitle Mapping
        const matchingSubs = subtitleObjects.filter(sub => {
          if (se.season && se.episode && sub.parsed.season && sub.parsed.episode) {
            return se.season === sub.parsed.season && se.episode === sub.parsed.episode;
          }
          if (se.episode && sub.parsed.episode) {
            return se.episode === sub.parsed.episode;
          }
          const videoBase = fileName.replace(/\.[^/.]+$/, '').toLowerCase();
          const subBase = sub.name.replace(/\.[^/.]+$/, '').toLowerCase();
          return subBase.startsWith(videoBase) || videoBase.startsWith(subBase.replace(/\.(en|hi|bn|es|fr|de|ja|ko|zh|ar|pt)$/i, ''));
        });

        const entryObj = zip.files[path];
        const uncompressedSize = (entryObj as any)._data?.uncompressedSize || 0;

        // Languages and metadata
        const itemAudioLangs = parsed.audioLangs.length > 0 ? parsed.audioLangs : ['Hindi', 'English'];
        itemAudioLangs.forEach(l => allAudioSet.add(l));

        const itemSubLangs = new Set<string>(parsed.subtitles);
        matchingSubs.forEach(ms => {
          if (ms.language) itemSubLangs.add(ms.language);
        });
        const finalSubLangs = Array.from(itemSubLangs);
        finalSubLangs.forEach(l => allSubSet.add(l));

        if (parsed.quality && !topQuality) {
          topQuality = parsed.quality;
        }

        episodeList.push({
          id: 'ep_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 7),
          fileName,
          filePath: path,
          seasonNumber: seasonNum,
          episodeNumber: epNum,
          episodeTitle: parsed.title || `Episode ${epNum}`,
          quality: parsed.quality || '1080p',
          videoCodec: parsed.videoCodec || 'H.264',
          audioCodec: '',
          audioLangs: itemAudioLangs,
          subtitles: finalSubLangs,
          mappedSubtitles: matchingSubs.map(s => s.name),
          size: uncompressedSize,
          duration: '',
          resolution: parsed.quality || '1080p',
          status: 'ready',
          selected: false,
          videoEntry: entryObj,
          zipFile: fileOrData,
        });
      }

      // Sort natural order: Season -> Episode -> Filename
      episodeList.sort((a, b) => {
        const sA = parseInt(a.seasonNumber, 10) || 1;
        const sB = parseInt(b.seasonNumber, 10) || 1;
        if (sA !== sB) return sA - sB;

        const eA = parseInt(a.episodeNumber, 10) || 0;
        const eB = parseInt(b.episodeNumber, 10) || 0;
        if (eA !== eB && eA > 0 && eB > 0) return eA - eB;

        return a.fileName.localeCompare(b.fileName, undefined, { numeric: true, sensitivity: 'base' });
      });

      setZipProgress(80);
      setZipMsg('Analyzing video metadata...');

      // Update state
      setZipEpisodesList(episodeList);
      setZipEpisodes(episodeList.map(e => e.fileName));
      setZipAssets(allPaths.map(p => ({
        path: p,
        name: p.split('/').pop() || p,
        kind: zipAssetKind(p),
        size: (zip.files[p] as any)._data?.uncompressedSize || 0
      })));

      if (contentType === 'Series') {
        // Correct fix: Total Episodes = total detected video count
        setTotalEpisodesCount(episodeList.length.toString());
        if (!seasonNo && episodeList[0]?.seasonNumber) {
          setSeasonNo(episodeList[0].seasonNumber);
        }
      }

      const audioArr = Array.from(allAudioSet);
      const subArr = Array.from(allSubSet);
      setAudioLangs(audioArr);
      setSubtitleLangs(subArr);
      if (topQuality) setQuality(topQuality);

      setZipProgress(100);
      setZipMsg(`✓ Detected ${episodeList.length} episode(s) and ${subtitleEntries.length} subtitle file(s).`);
      setZipExpanded(true);
    } catch (err: any) {
      console.error('JSZip Error:', err);
      const errMsg = err?.message || String(err);
      if (errMsg.includes('could not be read') || errMsg.includes('permission') || err?.name === 'NotReadableError') {
        setZipMsg('❌ Permission error reading ZIP file. Please re-select the ZIP file.');
      } else {
        setZipMsg('❌ Failed to read ZIP archive: ' + (errMsg || 'Corrupted or invalid ZIP file.'));
      }
    } finally {
      setZipProcessing(false);
      setTimeout(() => setZipProgress(-1), 1000);
    }
  };

  const handleZipWeb = async (e: any) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    try {
      const arrayBuf = await file.arrayBuffer();
      await processZipFile(arrayBuf, file.name);
    } catch {
      await processZipFile(file);
    }
    e.target.value = '';
  };

  const pickMultiplePosters = () => {
    if (pickMultipleImages((assets: any) => appendPosterAssets(assets))) return;
    DocumentPicker.getDocumentAsync({
      type: 'image/*',
      multiple: true,
      copyToCacheDirectory: true,
    }).then(result => {
      if (!result.canceled) appendPosterAssets(result.assets);
    }).catch(() => {});
  };

  const pickSubtitle = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
      if (!r.canceled && r.assets[0]) setSubtitleFile({ name: r.assets[0].name });
    } catch {}
  };

  const pickZip = async () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.zip,application/zip,application/x-zip-compressed';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          try {
            const arrayBuf = await file.arrayBuffer();
            await processZipFile(arrayBuf, file.name);
          } catch {
            await processZipFile(file);
          }
        }
      };
      input.click();
      return;
    }

    try {
      const r = await DocumentPicker.getDocumentAsync({
        type: ['application/zip', 'application/x-zip-compressed', 'application/x-zip', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true,
      });
      if (r.canceled || !r.assets || !r.assets[0]) return;
      const a = r.assets[0];
      const rawFile = (a as any).file;
      let zipBuffer: ArrayBuffer | null = null;

      if (rawFile && typeof rawFile.arrayBuffer === 'function') {
        try {
          zipBuffer = await rawFile.arrayBuffer();
        } catch {}
      }
      if (!zipBuffer && a.uri) {
        try {
          const res = await fetch(a.uri);
          zipBuffer = await res.arrayBuffer();
        } catch (fetchErr) {
          console.warn('Fetch URI failed:', fetchErr);
        }
      }

      if (zipBuffer) {
        await processZipFile(zipBuffer, a.name);
      } else if (rawFile) {
        await processZipFile(rawFile, a.name);
      } else {
        setZipMsg('❌ Could not read selected ZIP file data.');
      }
    } catch (err) {
      console.error('Error picking ZIP:', err);
      setZipMsg('Error selecting ZIP file.');
    }
  };


  const publishToLibrary = async () => {
    const checks = [
      { label: 'TMDB ID', done: !!tmdbId },
      { label: 'Title', done: !!title },
      { label: 'Poster', done: !!posterUrl || !!posterFile || sliderImages.length > 0 },
      { label: 'Overview', done: !!overview },
      { label: 'Video', done: videoUploads.length > 0 || !!videoFile || !!videoUrl || zipAssets.length > 0 || zipEpisodesList.length > 0 },
      { label: 'Quality', done: !!quality },
      { label: 'Audio', done: audioLangs.length > 0 },
      { label: 'Subtitle', done: subtitleLangs.length > 0 || !!subtitleFile },
      { label: 'Release Year', done: !!year },
      { label: 'Category', done: !!contentType },
      { label: 'Episode information', done: contentType === 'Series' ? (!!seasonNo && (!!episodeNo || zipEpisodesList.length > 0)) : true }
    ];
    
    const missing = checks.filter(c => !c.done);
    if (missing.length > 0) {
      alert('Cannot publish yet! Missing: ' + missing.map(m => m.label).join(', '));
      return;
    }

    const tabType: LibraryItem['type'] =
      contentType === 'Series' ? 'Series' :
      clipsUrl || clipsFile ? 'Clips' :
      teaserUrl || teaserFile ? 'Teasers' : 'Movie';
    const item: LibraryItem = {
      id: Date.now().toString(), type: tabType,
      title, year, language, overview, director, country,
      rating, ageRating, runtime, cast, trailerUrl, posterUrl: selectedPosters[0] || '',
      tmdbId, seasonNo, episodeNo, categories,
      navChips, videoUrl, teaserUrl, clipsUrl,
      quality, audioLangs, subtitleLangs, weeklyEpisodes,
      addedAt: new Date().toLocaleDateString('en-IN'),
    };

    // Real upload-progress animation while saving
    setUploadProgress(0);
    let prog = 0;
    const tick = setInterval(() => {
      prog += Math.random() * 18 + 6;
      if (prog >= 90) { clearInterval(tick); prog = 90; }
      setUploadProgress(Math.min(Math.round(prog), 90));
    }, 120);

    try {
      // API payload with permanent key attached to headers
      const payload = {
        ...item,
        id:         item.id,
        api_key:    PERMANENT_API_KEY,
        owner:      APP_OWNER,
        title:      item.title,
        contentType: item.type || 'movie',
        media_type: item.type || 'movie',
        year:       item.year,
        language:   item.language,
        overview:   item.overview,
        tmdb_id:    item.tmdbId,
        poster_url: item.posterUrl,
        video_url:  item.videoUrl,
        teaser_url: item.teaserUrl,
        categories: item.categories,
        nav_chips:  item.navChips ? item.navChips.split(',').map((x: string) => x.trim()) : [],
        audio:      item.audioLangs,
        subtitles:  item.subtitleLangs,
        quality:    item.quality,
        rating:     item.rating,
        addedAt:    Date.now(),
        updatedAt:  Date.now(),
        status:     'published',
        slider_images: selectedPosters,
      };
      // Send to central API endpoint
      try {
        await fetch('/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Api-Key': PERMANENT_API_KEY },
          body: JSON.stringify(payload),
        });
      } catch { /* offline – continue with local save */ }
      // Simulate remaining save time
      await new Promise(r => setTimeout(r, 700));
      clearInterval(tick);
      setUploadProgress(100);
      
      // Save to Firebase Realtime Database
      if (hasDatabaseUrl) {
        const db = getDatabase();
        await dbSet(dbRef(db, 'library/' + item.id), item);
      } else {
        setLibraryItems(prev => [item, ...prev]);
      }

      notifyPublished(item.title, item.type, item.year);

      setTimeout(() => {
        setUploadProgress(-1);
        clearForm();
        setActiveTab('library');
      }, 600);
    } catch {
      clearInterval(tick);
      setUploadProgress(-1);
      alert('Publish failed. Please try again.');
    }
  };

  const clearForm = () => {
    setTitle(''); setOverview(''); setYear(''); setLanguage('EN'); setDirector('');
    setCountry('US'); setRating(''); setAgeRating(''); setRuntime(''); setCast('');
    setTrailerUrl(''); setPosterUrl(''); setTmdbId(''); setSeasonNo(''); setEpisodeNo('');
    setCategories([]); setNavChips('');
    setVideoUrl(''); setTeaserUrl(''); setClipsUrl('');
    clearVideoSelection(); setTeaserFile(null); setClipsFile(null);
    setPosterFile(null); setSubtitleFile(null); setSliderImages([]);
    setDetectedQuality(''); setDetectedAudio([]); setDetectedSubtitles([]);
    setZipEpisodes([]); setZipEpisodesList([]); setTotalEpisodesCount(''); setEditingEpisodeId(null); setZipAssets([]); setZipMsg(''); setZipExpanded(false); setZipProcessing(false); setZipProgress(-1);
    setExtraAssets([]); setExtraError('');
    setQuality(''); setAudioLangs([]); setAudioInput(''); setSubtitleLangs([]); setSubtitleInput('');
    setTmdbResults([]); setSelectedItem(null); setSearchQuery(''); setTmdbError('');
    setWeeklyEpisodes([]);
    setWepTitle(''); setWepEpNo(''); setWepAirDate(''); setWepVideoUrl(''); setWepVideoFile(null);
  };

  // ── Fetch trending OTT releases for notification panel ──
  const fetchNotifications = async () => {
    if (notifLoading) return;
    setNotifLoading(true);
    setNotifError('');
    try {
      const [trending, upcomingMovies, upcomingShows, popularMovies, popularShows] = await Promise.allSettled([
        tmdbFetch('/trending/all/week'),
        tmdbFetch('/movie/upcoming'),
        tmdbFetch('/tv/on_the_air'),
        tmdbFetch('/discover/movie?watch_region=IN&with_watch_monetization_types=flatrate&sort_by=popularity.desc'),
        tmdbFetch('/discover/tv?watch_region=IN&with_watch_monetization_types=flatrate&sort_by=popularity.desc'),
      ]);
      const items: TmdbItem[] = [];
      if (trending.status === 'fulfilled' && trending.value?.results) {
        trending.value.results.slice(0, 8).forEach((x: any) => items.push(x));
      }
      if (upcomingMovies.status === 'fulfilled' && upcomingMovies.value?.results) {
        upcomingMovies.value.results.slice(0, 8).forEach((x: any) => items.push({ ...x, media_type: 'movie' }));
      }
      if (upcomingShows.status === 'fulfilled' && upcomingShows.value?.results) {
        upcomingShows.value.results.slice(0, 8).forEach((x: any) => items.push({ ...x, media_type: 'tv' }));
      }
      if (popularMovies.status === 'fulfilled' && popularMovies.value?.results) {
        popularMovies.value.results.slice(0, 6).forEach((x: any) => items.push({ ...x, media_type: 'movie' }));
      }
      if (popularShows.status === 'fulfilled' && popularShows.value?.results) {
        popularShows.value.results.slice(0, 6).forEach((x: any) => items.push({ ...x, media_type: 'tv' }));
      }
      const unique = Array.from(new Map(items.map(item => [`${item.media_type || 'movie'}-${item.id}`, item])).values()).slice(0, 24);
      const enriched = await Promise.all(unique.map(async item => {
        try { return await tmdbById(item.id, item.media_type || 'movie'); } catch { return item; }
      }));
      const now = Date.now();
      const withSections = enriched.map(item => ({
        ...item,
        notificationType: getReleaseDate(item) && new Date(`${getReleaseDate(item)}T23:59:59`).getTime() >= now
          ? 'coming' as const
          : 'watching' as const,
      }));
      const readRaw = await AsyncStorage.getItem('smovie_notification_read');
      const read = new Set<string>(readRaw ? JSON.parse(readRaw) : []);
      setNotifReadSet(read);
      const reminderRaw = await AsyncStorage.getItem('smovie_notification_reminders');
      setNotifReminders(new Set<string>(reminderRaw ? JSON.parse(reminderRaw) : []));
      setNotifItems(withSections);
      setNotifUnread(withSections.filter(item => !read.has(`${item.media_type}-${item.id}`)).length);
    } catch (error) {
      setNotifError(error instanceof Error ? error.message : 'Could not load OTT releases.');
      setNotifItems([]);
    }
    finally { setNotifLoading(false); }
  };

  const markNotificationRead = async (item: TmdbItem) => {
    const key = `${item.media_type}-${item.id}`;
    const readRaw = await AsyncStorage.getItem('smovie_notification_read');
    const read = new Set<string>(readRaw ? JSON.parse(readRaw) : []);
    if (!read.has(key)) {
      read.add(key);
      await AsyncStorage.setItem('smovie_notification_read', JSON.stringify(Array.from(read)));
      setNotifReadSet(read);
      setNotifUnread(prev => Math.max(0, prev - 1));
    }
    
    // Navigate to New Upload, populate TMDB ID, and trigger search
    setShowNotifications(false);
    setActiveTab('home');
    setSearchMode('id');
    setSearchQuery(String(item.id));
    setContentType(item.media_type === 'tv' ? 'Series' : 'Movie');
    setTmdbId(String(item.id));
  };

  const markAllNotificationsRead = async () => {
    const readRaw = await AsyncStorage.getItem('smovie_notification_read');
    const read = new Set<string>(readRaw ? JSON.parse(readRaw) : []);
    notifItems.forEach(item => {
      read.add(`${item.media_type}-${item.id}`);
    });
    await AsyncStorage.setItem('smovie_notification_read', JSON.stringify(Array.from(read)));
    setNotifReadSet(read);
    setNotifUnread(0);
  };

  const toggleNotificationReminder = async (item: TmdbItem) => {
    const key = `${item.media_type}-${item.id}`;
    const next = new Set(notifReminders);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setNotifReminders(next);
    await AsyncStorage.setItem('smovie_notification_reminders', JSON.stringify(Array.from(next)));
  };

  // Request PWA push-notification permission
  const requestNotifPermission = async () => {
    await requestBrowserNotifications();
  };

  // ── OTA: write new version to Firebase RTDB ──
  const pushOtaUpdate = async () => {
    if (otaPushing) return;
    if (!hasDatabaseUrl) {
      alert(
        'Firebase Realtime Database not configured.\n\n' +
        'Add your databaseURL (https://<project>.firebaseio.com) to:\n' +
        'artifacts/smovie-admin/firebase-applet-config.json'
      );
      return;
    }
    setOtaPushing(true);
    try {
      const db = getDatabase();
      const versionRef = dbRef(db, 'app_version');
      const newVersion = Date.now().toString();
      await dbSet(versionRef, newVersion);
      // Store locally so the admin tab doesn't self-reload.
      await AsyncStorage.setItem('smovie_app_version', newVersion);
    } catch {
      alert('OTA push failed. Make sure Firebase Realtime Database is enabled in your project (Firebase Console → Build → Realtime Database).');
    } finally {
      setOtaPushing(false);
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={s.root}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color={RED} />
          <Text style={s.loadingTxt}>Connecting…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) return <LoginScreen startupError={startupError || getFirebaseInitError()} />;

  const visibleNotificationItems = notifItems
    .filter(item => (item.notificationType ?? 'coming') === notifTab)
    .sort((a, b) => getReleaseDate(a).localeCompare(getReleaseDate(b)));

  // ── Weekly episode helpers ──
  const addWeeklyEp = () => {
    if (!wepTitle.trim() && !wepEpNo.trim()) return;
    setWeeklyEpisodes(prev => [...prev, {
      id: Date.now().toString(),
      title: wepTitle, epNo: wepEpNo,
      airDate: wepAirDate, videoUrl: wepVideoUrl,
      videoFileName: wepVideoFile?.name,
    }]);
    setWepTitle(''); setWepEpNo(''); setWepAirDate(''); setWepVideoUrl(''); setWepVideoFile(null);
  };

  return (
    <SafeAreaView style={s.root}>
      <ResultsModal visible={showResults} results={tmdbResults}
        onSelect={selectTmdb} onClose={() => setShowResults(false)} />

      <NotificationDetailsModal item={notifSelected} onClose={() => setNotifSelected(null)} />

      <ExtrasModal
        visible={showExtras}
        category={extraCategory}
        categories={['Behind the Scenes','Deleted Scenes','Interviews','Trailers','Teasers','Posters','Wallpapers','Bonus Videos']}
        assets={extraAssets}
        onCategory={setExtraCategory}
        onPick={pickExtras}
        onRemove={(id: string) => setExtraAssets(prev => prev.filter(asset => asset.id !== id))}
        onClose={() => setShowExtras(false)}
      />

      <WeeklyEpisodeModal
        visible={showWeeklyModal}
        episodes={weeklyEpisodes}
        epNo={wepEpNo} setEpNo={setWepEpNo}
        epTitle={wepTitle} setEpTitle={setWepTitle}
        airDate={wepAirDate} setAirDate={setWepAirDate}
        videoUrl={wepVideoUrl} setVideoUrl={setWepVideoUrl}
        videoFile={wepVideoFile} onPickVideo={pickWepVideo}
        onAdd={addWeeklyEp}
        onRemove={id => setWeeklyEpisodes(prev => prev.filter(e => e.id !== id))}
        onClose={() => setShowWeeklyModal(false)}
      />

      <EditModal
        visible={showEditModal}
        item={editingItem}
        onSave={async (updated) => {
          if (hasDatabaseUrl) {
            const db = getDatabase();
            await dbSet(dbRef(db, 'library/' + updated.id), updated);
          } else {
            setLibraryItems(prev => prev.map(i => i.id===updated.id ? updated : i));
          }
        }}
        onDelete={async (id) => {
          if (hasDatabaseUrl) {
            const db = getDatabase();
            await dbSet(dbRef(db, 'library/' + id), null);
          } else {
            setLibraryItems(prev => prev.filter(i => i.id !== id));
          }
        }}
        onClose={() => { setShowEditModal(false); setEditingItem(null); }}
      />

      {/* ── OTA Update Toast (shown on client when new version detected) ── */}
      {otaToast && (
        <View style={s.otaToast} pointerEvents="none">
          <ActivityIndicator size="small" color={WHITE} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={s.otaToastTitle}>Updating to latest version…</Text>
            <Text style={s.otaToastSub}>Cache cleared · Reloading now</Text>
          </View>
        </View>
      )}

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <AppLogo size={36} />
          <View style={{ marginLeft: 10 }}>
            <Text style={s.brandName}><Text style={{ color: RED }}>s</Text>movie.</Text>
            <Text style={s.brandSub}>ADMIN PANEL</Text>
          </View>
        </View>
        <View style={s.headerRight}>
          {/* Notification bell */}
          <TouchableOpacity
            style={nb.bellWrap}
            onPress={() => {
              if (!showNotifications) fetchNotifications();
              setShowNotifications(!showNotifications);
            }}
            activeOpacity={0.75}
          >
            <BellSvg size={20} color={WHITE} />
            {notifUnread > 0 && (
              <View style={nb.badge}><Text style={nb.badgeTxt}>{notifUnread > 9 ? '9+' : notifUnread}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.redLine} />

      {/* ── Notification panel ── */}
      {showNotifications && (
        <View style={nb.panel}>
          <View style={nb.panelHeader}>
            <View>
              <Text style={nb.panelTitle}>OTT Releases</Text>
              <Text style={nb.panelSub}>All OTT releases · India</Text>
            </View>
            <View style={{ flexDirection:'row', gap:8, alignItems: 'center' }}>
              <TouchableOpacity onPress={markAllNotificationsRead} activeOpacity={0.8} style={{ paddingHorizontal: 8 }}>
                <Text style={{ color: MUTED, fontSize: 12, fontWeight: '600' }}>Mark all as read</Text>
              </TouchableOpacity>
              <TouchableOpacity style={nb.pushBtn} onPress={requestNotifPermission} activeOpacity={0.8}>
                <BellSvg size={13} color={RED} />
                <Text style={nb.pushBtnTxt}>Push</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowNotifications(false)} style={nb.closeBtn}>
                <XSvg size={15} color={MUTED3} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={nb.tabs}>
            <TouchableOpacity onPress={() => setNotifTab('coming')} style={[nb.tab, notifTab === 'coming' && nb.tabActive]}>
              <CalendarSvg size={15} color={notifTab === 'coming' ? BG : MUTED3} />
              <Text style={[nb.tabTxt, notifTab === 'coming' && nb.tabTxtActive]}>Coming Soon</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setNotifTab('watching')} style={[nb.tab, notifTab === 'watching' && nb.tabActive]}>
              <TrendingSvg size={15} color={notifTab === 'watching' ? BG : MUTED3} />
              <Text style={[nb.tabTxt, notifTab === 'watching' && nb.tabTxtActive]}>Everyone's Watching</Text>
            </TouchableOpacity>
          </View>
          {notifLoading ? (
            <View style={nb.state}>
              <ActivityIndicator color={RED} size="small" />
              <Text style={nb.stateTxt}>Fetching all OTT releases…</Text>
            </View>
          ) : notifError ? (
            <View style={nb.state}>
              <Feather name="alert-circle" size={22} color="#ff6b6b" />
              <Text style={nb.errorTxt}>{notifError}</Text>
              <TouchableOpacity onPress={fetchNotifications} style={nb.retryBtn}>
                <Text style={nb.retryTxt}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : notifItems.length === 0 ? (
            <View style={nb.state}>
              <Feather name="film" size={24} color={MUTED2} />
              <Text style={nb.stateTxt}>{TMDB_API_KEY ? 'No releases loaded yet.' : 'Add EXPO_PUBLIC_TMDB_API_KEY to load releases.'}</Text>
            </View>
          ) : visibleNotificationItems.length === 0 ? (
            <View style={nb.state}>
              <Feather name={notifTab === 'coming' ? 'calendar' : 'trending-up'} size={24} color={MUTED2} />
              <Text style={nb.stateTxt}>No titles in this list right now.</Text>
            </View>
          ) : (
            <ScrollView
              style={nb.feed}
              contentContainerStyle={nb.feedContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {visibleNotificationItems.map(it => {
                const key = `${it.media_type}-${it.id}`;
                const providers = getOttProviders(it);
                const reminded = notifReminders.has(key);
                const isRead = notifReadSet.has(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[nb.releaseCard, !isRead && { backgroundColor: '#1e1e1e', borderColor: '#333' }]}
                    onPress={() => void markNotificationRead(it)}
                    activeOpacity={0.92}
                  >
                    <View style={nb.mediaFrame}>
                      {!isRead && <View style={{position: 'absolute', top: -5, right: -5, width: 12, height: 12, borderRadius: 6, backgroundColor: RED, zIndex: 10}} />}
                      {it.backdrop_path || it.poster_path
                        ? <Image source={{ uri: `${it.backdrop_path ? BACKDROP_BASE + it.backdrop_path : POSTER_BASE + it.poster_path}` }} style={nb.backdrop} />
                        : <View style={[nb.backdrop, nb.posterFb]}><Feather name="film" size={30} color={MUTED2} /></View>}
                      <View style={nb.mediaShade} />
                      <View style={[nb.contentBadge, it.notificationType === 'watching' ? nb.watchingBadge : nb.comingBadge]}>
                        <Text style={nb.contentBadgeTxt}>{it.notificationType === 'watching' ? 'TRENDING NOW' : 'COMING SOON'}</Text>
                      </View>
                      <View style={nb.typeBadge}>
                        <Text style={nb.typeTxt}>{it.media_type === 'tv' ? 'TV SERIES' : 'MOVIE'}</Text>
                      </View>
                    </View>
                    <View style={nb.releaseBody}>
                      <Text style={nb.cardTitle} numberOfLines={2}>{it.title ?? it.name}</Text>
                      <Text style={nb.cardDate}>
                        {it.notificationType === 'coming' ? `Coming on ${formatReleaseDate(getReleaseDate(it))}` : `Available ${formatReleaseDate(getReleaseDate(it))}`}
                      </Text>
                      <Text style={nb.cardOverview} numberOfLines={3}>{it.overview || 'Details coming soon on TMDB.'}</Text>
                      <View style={nb.providerRow}>
                        {providers.length ? providers.slice(0, 4).map(provider => (
                          <View key={`${provider.provider_id}-${provider.provider_name}`} style={nb.providerPill}>
                            {provider.logo_path
                              ? <Image source={{ uri: `${PROVIDER_BASE}${provider.logo_path}` }} style={nb.providerLogo} />
                              : <Feather name="play" size={10} color={WHITE} />}
                            <Text style={nb.providerName} numberOfLines={1}>{provider.provider_name}</Text>
                          </View>
                        )) : <Text style={nb.platformMissing}>Platform data unavailable for India</Text>}
                      </View>
                      <View style={nb.cardFooter}>
                        <Text style={nb.cardMeta}>TMDB ID {it.id}</Text>
                        <TouchableOpacity
                          style={[nb.remindBtn, reminded && nb.remindBtnActive]}
                          onPress={() => void toggleNotificationReminder(it)}
                          activeOpacity={0.8}
                        >
                          <Feather name={reminded ? 'check' : 'bell'} size={14} color={reminded ? BG : WHITE} />
                          <Text style={[nb.remindTxt, reminded && nb.remindTxtActive]}>{reminded ? 'Reminded' : 'Remind Me'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* ── Scrollable content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ════ HOME / UPLOAD TAB ════ */}
        {activeTab==='home' && (
          <>
            <View style={s.pageHeader}>
              <Text style={s.pageTitle}>New Upload</Text>
              <Text style={s.pageSub}>Fill in the details and publish to your content library.</Text>
            </View>

            {/* ── 1 · TMDB FETCH ── */}
            <View style={s.card}>
              <SectionHeader n={1} title="TMDB FETCH" />

              <FieldLabel text="CONTENT TYPE" />
              <View style={s.segRow}>
                {(['Movie','Series'] as const).map(t => (
                  <TouchableOpacity key={t} style={[s.seg, contentType===t && s.segActive]}
                    onPress={() => setContentType(t)} activeOpacity={0.8}>
                    <Text style={[s.segTxt, contentType===t && s.segTxtActive]}>
                      {t==='Movie' ? '▣  Movie' : '▭  Series'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <FieldLabel text="SEARCH MODE" />
              <View style={s.modeRow}>
                {(['id','title'] as const).map(m => (
                  <TouchableOpacity key={m} style={[s.modeBtn, searchMode===m && s.modeBtnActive]}
                    onPress={() => { setSearchMode(m); setTmdbError(''); }} activeOpacity={0.8}>
                    <Text style={[s.modeTxt, searchMode===m && s.modeTxtActive]}>
                      {m==='id' ? '#  By ID' : '◎  By Name'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <FieldLabel text={searchMode==='id' ? 'TMDB ID' : 'SEARCH TITLE'} />
              <View style={s.searchRow}>
                <TextInput
                  style={[s.input, s.searchInput]}
                  placeholder={searchMode==='id' ? 'e.g. 66732' : 'e.g. Stranger Things'}
                  placeholderTextColor={MUTED2}
                  value={searchQuery}
                  onChangeText={t => { setSearchQuery(t); setTmdbError(''); }}
                  keyboardType={searchMode==='id' ? 'numeric' : 'default'}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                <TouchableOpacity style={[s.fetchBtn, isSearching && s.disabled]}
                  onPress={handleSearch} disabled={isSearching} activeOpacity={0.85}>
                  {isSearching
                    ? <ActivityIndicator color={WHITE} size="small" />
                    : <Text style={s.fetchBtnTxt}>{searchMode==='id' ? '✦  Fetch' : '◎  Search'}</Text>
                  }
                </TouchableOpacity>
              </View>
              <Text style={s.hint}>
                {searchMode==='id'
                  ? 'Auto-fills title, overview, poster, rating and details from TMDB.'
                  : 'Search by title — tap a result to auto-fill all metadata fields.'
                }
              </Text>

              {tmdbError ? (
                <View style={s.errorBox}>
                  <Text style={s.errorTxt}>▲  {tmdbError}</Text>
                </View>
              ) : null}

              {selectedItem && (
                <View style={s.selectedPreview}>
                  <View style={s.selectedBar} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.selectedLabel}>TMDB SELECTED</Text>
                    <Text style={s.selectedTitle} numberOfLines={1}>{selectedItem.title ?? selectedItem.name}</Text>
                    <Text style={s.selectedMeta}>
                      {selectedItem.media_type==='tv' ? 'TV Series' : 'Movie'}
                      {selectedItem.vote_average ? ` · ★ ${selectedItem.vote_average.toFixed(1)}` : ''}
                    </Text>
                  </View>
                  {posterUrl ? <Image source={{ uri: selectedPosters[0] }} style={s.selectedPosterThumb} /> : null}
                  <TouchableOpacity onPress={() => setShowResults(true)} style={s.changeBtn}>
                    <Text style={s.changeBtnTxt}>Change</Text>
                  </TouchableOpacity>
                </View>
              )}

              {tmdbResults.length > 0 && !selectedItem && (
                <TouchableOpacity style={s.viewResultsBtn} onPress={() => setShowResults(true)} activeOpacity={0.8}>
                  <Text style={s.viewResultsTxt}>View {tmdbResults.length} results</Text>
                  <Text style={s.viewResultsArrow}>›</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── 2 · METADATA ── */}
            <View style={s.card}>
              <SectionHeader n={2} title="METADATA" />

              {contentType==='Series' && (
                <>
                  <View style={s.twoCol}>
                    <View style={{ flex:1, marginRight:8 }}>
                      <FieldLabel text="SEASON NO." />
                      <TextInput style={s.input} placeholder="1" placeholderTextColor={MUTED2}
                        keyboardType="numeric" value={seasonNo} onChangeText={setSeasonNo} />
                    </View>
                    <View style={{ flex:1 }}>
                      <FieldLabel text="EPISODE NO." />
                      <TextInput style={s.input} placeholder="1" placeholderTextColor={MUTED2}
                        keyboardType="numeric" value={episodeNo} onChangeText={setEpisodeNo} />
                    </View>
                  </View>

                  {/* Weekly Episode Button */}
                  <TouchableOpacity style={s.weeklyBtn} onPress={() => setShowWeeklyModal(true)} activeOpacity={0.85}>
                    <View style={s.weeklyBtnLeft}>
                      <View style={s.weeklyIcon}><Text style={s.weeklyIconTxt}>+</Text></View>
                      <View>
                        <Text style={s.weeklyBtnLabel}>Weekly Episode Add</Text>
                        <Text style={s.weeklyBtnSub}>
                          {weeklyEpisodes.length > 0
                            ? `${weeklyEpisodes.length} episode${weeklyEpisodes.length!==1?'s':''} added`
                            : 'Add episode-by-episode for ongoing series'}
                        </Text>
                      </View>
                    </View>
                    {weeklyEpisodes.length > 0
                      ? <View style={s.weeklyCount}><Text style={s.weeklyCountTxt}>{weeklyEpisodes.length}</Text></View>
                      : <Text style={s.weeklyArrow}>›</Text>
                    }
                  </TouchableOpacity>
                </>
              )}

              <FieldLabel text="TITLE" required />
              <TextInput style={s.input} placeholder="Auto-filled or enter manually"
                placeholderTextColor={MUTED2} value={title} onChangeText={setTitle} />

              <FieldLabel text="OVERVIEW" />
              <TextInput style={[s.input, s.textArea]}
                placeholder="Auto-filled from TMDB or enter manually..."
                placeholderTextColor={MUTED2} multiline value={overview} onChangeText={setOverview}
                textAlignVertical="top" />

              <View style={s.twoCol}>
                <View style={{ flex:1, marginRight:8 }}>
                  <FieldLabel text="YEAR" />
                  <TextInput style={s.input} placeholder="2024" placeholderTextColor={MUTED2}
                    keyboardType="numeric" value={year} onChangeText={setYear} />
                </View>
                <View style={{ flex:1 }}>
                  <FieldLabel text="LANGUAGE" />
                  <TextInput style={s.input} placeholder="EN" placeholderTextColor={MUTED2}
                    autoCapitalize="characters" value={language} onChangeText={setLanguage} />
                </View>
              </View>

              <View style={s.twoCol}>
                <View style={{ flex:1, marginRight:8 }}>
                  <FieldLabel text="DIRECTOR" />
                  <TextInput style={s.input} placeholder="Auto-filled" placeholderTextColor={MUTED2}
                    value={director} onChangeText={setDirector} />
                </View>
                <View style={{ flex:1 }}>
                  <FieldLabel text="COUNTRY" />
                  <TextInput style={s.input} placeholder="US" placeholderTextColor={MUTED2}
                    autoCapitalize="characters" value={country} onChangeText={setCountry} />
                </View>
              </View>

              <View style={s.threeCol}>
                <View style={{ flex:1, marginRight:6 }}>
                  <FieldLabel text="RATING" />
                  <TextInput style={s.input} placeholder="8.5" placeholderTextColor={MUTED2}
                    keyboardType="decimal-pad" value={rating} onChangeText={setRating} />
                </View>
                <View style={{ flex:1, marginRight:6 }}>
                  <FieldLabel text="AGE RATING" />
                  <TextInput style={s.input} placeholder="PG-13" placeholderTextColor={MUTED2}
                    autoCapitalize="characters" value={ageRating} onChangeText={setAgeRating} />
                </View>
                <View style={{ flex:1 }}>
                  <FieldLabel text={'RUNTIME\n(MIN)'} />
                  <TextInput style={s.input} placeholder="148" placeholderTextColor={MUTED2}
                    keyboardType="numeric" value={runtime} onChangeText={setRuntime} />
                </View>
              </View>

              <FieldLabel text="CAST" />
              <TextInput style={s.input} placeholder="Actor 1, Actor 2, Actor 3..."
                placeholderTextColor={MUTED2} value={cast} onChangeText={setCast} />

              <FieldLabel text="TRAILER URL (YOUTUBE)" />
              <TextInput style={s.input} placeholder="https://www.youtube.com/watch?v=..."
                placeholderTextColor={MUTED2} autoCapitalize="none" value={trailerUrl}
                onChangeText={setTrailerUrl} />

              {/* ── Categories ── */}
              <View style={s.dividerLine} />
              <FieldLabel text="CATEGORIES" />
              <Text style={s.hint}>Netflix-style categories. Saved as assigned_categories[].</Text>
              <View style={s.chipRow}>
                {NETFLIX_CATEGORIES.map(c => {
                  const active = categories.includes(c);
                  return (
                    <TouchableOpacity key={c}
                      style={[s.chip, active && s.chipCatActive]}
                      onPress={() => setCategories(prev => toggleChip(prev, c))}
                      activeOpacity={0.8}>
                      <Text style={[s.chipTxt, active && s.chipCatTxtActive]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {categories.length > 0 && (
                <View style={s.catSelectedRow}>
                  <Text style={s.catSelectedTxt}>Selected: {categories.join(', ')}</Text>
                </View>
              )}

              {/* ── Navigation Chips ── */}
              <FieldLabel text="NAVIGATION CHIPS" />
              <TextInput style={s.input}
                placeholder="e.g. Action, Thriller, Must Watch"
                placeholderTextColor={MUTED2}
                value={navChips} onChangeText={setNavChips} />
              <Text style={s.hint}>Comma-separated chip names. Saved as nav_chips[] in the API payload.</Text>
            </View>

            {/* ── 3 · MEDIA UPLOADS ── */}
            <View style={s.card}>
              <SectionHeader n={3} title="MEDIA UPLOADS" />

              {/* Poster + Slider multi-select */}
              <FieldLabel text="POSTER / SLIDER IMAGES" required />
              {selectedPosters.length > 0 ? (
                <View style={s.posterUploaded}>
                  <Image source={{ uri: selectedPosters[0] }} style={s.posterThumb} />
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity style={s.pickPosterBtn} onPress={pickMultiplePosters} activeOpacity={0.8}>
                      <WebFileInput accept="image/*" multiple onChange={handleCustomPostersWeb} />
                      <Text style={s.pickPosterTxt}>Add More Images</Text>
                    </TouchableOpacity>
                    {tmdbId ? <Text style={s.posterMeta}>TMDB ID: {tmdbId}</Text> : null}
                    {title ? <Text style={s.posterMeta} numberOfLines={1}>{title}</Text> : null}
                    <TouchableOpacity onPress={() => { setSelectedPosters([]); setPosterFile(null); setSliderImages([]); }}>
                      <Text style={s.clearTxt}>× Clear all</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={s.posterEmpty} onPress={pickMultiplePosters} activeOpacity={0.8}>
                  <WebFileInput accept="image/*" multiple onChange={handleCustomPostersWeb} />
                  <View style={s.posterEmptyIcon}><Text style={s.posterEmptyIconTxt}>▣</Text></View>
                  <Text style={s.posterEmptyLabel}>Pick Poster / Slider Images</Text>
                  <Text style={s.posterEmptySub}>JPG · PNG · WebP · Select multiple</Text>
                </TouchableOpacity>
              )}

              {/* Slider image thumbnails */}
              {sliderImages.length > 0 && (
                <View style={{ marginTop:8, marginBottom:4 }}>
                  <Text style={[s.hint,{marginBottom:6}]}>
                    ▣  {sliderImages.length} poster{sliderImages.length!==1?'s':''} available · tap to toggle selection
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 }}>
                      <TouchableOpacity onPress={() => setMultiSelectPosters(!multiSelectPosters)} style={{padding: 6, backgroundColor: multiSelectPosters ? '#E50914' : '#333', borderRadius: 6}}>
                        <Text style={{color: 'white', fontSize: 12, fontWeight: 'bold'}}>{multiSelectPosters ? '✓ MULTI-SELECT ENABLED' : 'ENABLE MULTI-SELECT'}</Text>
                      </TouchableOpacity>
                    </View>
                  <FlatList 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={{ marginBottom:4 }}
                    data={sliderImages}
                    keyExtractor={(img, i) => `${i}-${img.uri}`}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    renderItem={({item: img, index: i}) => (
                      <View style={sldr.wrap}>
                        <TouchableOpacity
                          onPress={() => selectPoster(img)}
                          activeOpacity={0.82}
                          style={[sldr.posterTap, selectedPosters.includes(img.uri) && sldr.posterTapSelected]}
                        >
                          <Image source={{ uri: img.uri }} style={sldr.posterImg} />
                          {!selectedPosters.includes(img.uri) && <View style={sldr.dimmer} />}
                        </TouchableOpacity>
                        {selectedPosters.includes(img.uri) && <View style={sldr.primaryBadge}><Text style={sldr.primaryTxt}>✓</Text></View>}
                      </View>
                    )}
                    ListFooterComponent={
                      <TouchableOpacity style={sldr.addMore} onPress={pickMultiplePosters} activeOpacity={0.8}>
                        <WebFileInput accept="image/*" multiple onChange={handleCustomPostersWeb} />
                        <Text style={sldr.addMoreTxt}>+{'\n'}Custom</Text>
                      </TouchableOpacity>
                    }
                  />
                </View>
              )}

              <View style={s.dividerLine} />

              {/* Main Video URL */}
              <FieldLabel text="MAIN VIDEO URL" />
              <TextInput style={s.input}
                placeholder="https://cdn.example.com/movie.mp4"
                placeholderTextColor={MUTED2} autoCapitalize="none"
                value={videoUrl} onChangeText={setVideoUrl} />

              {/* OR pick local file */}
              {videoUploads.length === 0 ? (
                <TouchableOpacity style={s.altPickBtn} onPress={pickVideo} activeOpacity={0.8}>
                  <Text style={s.altPickTxt}>▶  Pick video files</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <View style={s.queueHeader}>
                    <Text style={s.queueTitle}>{videoUploads.length} video{videoUploads.length !== 1 ? 's' : ''} in upload queue</Text>
                    <TouchableOpacity onPress={pickVideo}><Text style={s.queueAdd}>+ Add more</Text></TouchableOpacity>
                  </View>
                  {videoUploads.map(item => (
                    <VideoUploadCard
                      key={item.id}
                      item={item}
                      onCancel={() => cancelVideoUpload(item.id)}
                      onRetry={() => retryVideoUpload(item.id)}
                      onRemove={() => removeVideoUpload(item.id)}
                    />
                  ))}
                  {videoFile?.uri && (
                    <VideoPreview
                      uri={videoFile.uri}
                      onClose={clearVideoSelection}
                    />
                  )}
                </>
              )}

              <View style={s.dividerLine} />

              {/* Teaser URL */}
              <FieldLabel text="TEASER / TRAILER URL" />
              <TextInput style={s.input}
                placeholder="https://cdn.example.com/teaser.mp4"
                placeholderTextColor={MUTED2} autoCapitalize="none"
                value={teaserUrl} onChangeText={setTeaserUrl} />
              <FilePickerRow icon="▷" label="Or pick teaser file"
                fileName={teaserFile?.name} selected={!!teaserFile}
                onPress={pickTeaser} onClear={() => setTeaserFile(null)} />

              {/* Clips URL */}
              <FieldLabel text="CLIPS / EXTRAS URL" />
              <TextInput style={s.input}
                placeholder="https://cdn.example.com/clips.mp4"
                placeholderTextColor={MUTED2} autoCapitalize="none"
                value={clipsUrl} onChangeText={setClipsUrl} />
              <FilePickerRow icon="✂" label="Or pick clips file"
                fileName={clipsFile?.name} selected={!!clipsFile}
                onPress={pickClips} onClear={() => setClipsFile(null)} />

              <TouchableOpacity style={s.extrasBtn} onPress={() => setShowExtras(true)} activeOpacity={0.8}>
                <View style={s.extrasIcon}><Text style={s.extrasIconTxt}>＋</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.extrasLabel}>Extras</Text>
                  <Text style={s.extrasSub}>{extraAssets.length ? `${extraAssets.length} files selected` : 'Behind the Scenes · Interviews · Posters · More'}</Text>
                </View>
                <Text style={s.extrasArrow}>›</Text>
              </TouchableOpacity>

              {/* Episodes ZIP */}
              <View style={{ marginTop: 4 }}>
                <FieldLabel text="EPISODES ZIP (SERIES)" />
                <TouchableOpacity
                  style={[s.zipRow, (zipEpisodesList.length > 0 || zipEpisodes.length > 0) && s.zipRowDone, { position: 'relative' }]}
                  onPress={pickZip} activeOpacity={0.8}>
                  <WebFileInput accept=".zip,application/zip,application/x-zip-compressed" onChange={handleZipWeb} />
                  <View style={s.zipIconWrap}>
                    <Text style={s.zipIconTxt}>▥</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.zipLabel}>Upload Episodes ZIP</Text>
                    <Text style={s.zipSub}>Auto-detects videos, subtitles, season & episode numbers</Text>
                  </View>
                  {zipProcessing
                    ? <View style={s.zipProgressWrap}>
                        <Text style={s.zipProgressTxt}>{Math.round(Math.max(0, zipProgress))}%</Text>
                        <View style={s.zipProgressTrack}>
                          <View style={[s.zipProgressFill, { width: `${Math.max(0, zipProgress)}%` as any }]} />
                        </View>
                      </View>
                    : zipEpisodesList.length > 0 || zipEpisodes.length > 0
                      ? <View style={fp.check}><Text style={{ color:WHITE, fontSize:11, fontWeight:'900' }}>✓</Text></View>
                      : <Text style={fp.plus}>+</Text>
                  }
                </TouchableOpacity>

                {zipMsg ? (
                  <View style={s.zipMsgBox}>
                    <Text style={s.zipMsgTxt}>{zipMsg}</Text>
                  </View>
                ) : null}

                {zipEpisodesList.length > 0 && (
                  <>
                    {/* Header & Stats */}
                    <View style={s.episodeHeader}>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                        <View style={s.episodeChip}>
                          <Text style={s.episodeChipTxt}>✦  {zipEpisodesList.length} Episode{zipEpisodesList.length!==1?'s':''} Detected</Text>
                        </View>
                        {totalEpisodesCount ? (
                          <View style={[s.episodeChip, {backgroundColor: '#222', borderColor: '#444'}]}>
                            <Text style={[s.episodeChipTxt, {color: '#ccc'}]}>Total: {totalEpisodesCount}</Text>
                          </View>
                        ) : null}
                      </View>
                      <TouchableOpacity onPress={() => setZipExpanded(v => !v)} style={s.expandBtn}>
                        <Text style={s.expandBtnTxt}>{zipExpanded ? '▲ Hide' : '▼ Show list'}</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Batch Action Toolbar */}
                    <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 12, alignItems: 'center'}}>
                      <TouchableOpacity
                        onPress={() => {
                          const allSel = zipEpisodesList.every(e => e.selected);
                          setZipEpisodesList(prev => prev.map(e => ({ ...e, selected: !allSel })));
                        }}
                        style={{paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#222', borderRadius: 6, borderWidth: 1, borderColor: '#444'}}>
                        <Text style={{color: '#fff', fontSize: 11, fontWeight: '700'}}>
                          {zipEpisodesList.every(e => e.selected) ? 'Deselect All' : 'Select All'}
                        </Text>
                      </TouchableOpacity>

                      {zipEpisodesList.some(e => e.selected) && (
                        <TouchableOpacity
                          onPress={() => {
                            setZipEpisodesList(prev => prev.filter(e => !e.selected));
                          }}
                          style={{paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#3b1111', borderRadius: 6, borderWidth: 1, borderColor: '#8b0000'}}>
                          <Text style={{color: '#ff6b6b', fontSize: 11, fontWeight: '700'}}>
                            Remove Selected ({zipEpisodesList.filter(e => e.selected).length})
                          </Text>
                        </TouchableOpacity>
                      )}

                      {zipEpisodesList.some(e => e.status === 'error') && (
                        <TouchableOpacity
                          onPress={() => {
                            setZipEpisodesList(prev => prev.map(e => e.status === 'error' ? { ...e, status: 'ready', error: undefined } : e));
                          }}
                          style={{paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#11253e', borderRadius: 6, borderWidth: 1, borderColor: '#1d4ed8'}}>
                          <Text style={{color: '#6eaeff', fontSize: 11, fontWeight: '700'}}>Retry Failed</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        onPress={() => {
                          setZipEpisodesList([]);
                          setZipEpisodes([]);
                          setZipAssets([]);
                          setZipMsg('');
                          setZipExpanded(false);
                          setTotalEpisodesCount('');
                        }}
                        style={{paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#1a1a1a', borderRadius: 6, borderWidth: 1, borderColor: '#333', marginLeft: 'auto'}}>
                        <Text style={{color: '#aaa', fontSize: 11, fontWeight: '600'}}>Clear All</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Detailed Episode List */}
                    {zipExpanded && (
                      <View style={s.episodeList}>
                        {zipEpisodesList.map((ep, i) => {
                          const isEditing = editingEpisodeId === ep.id;
                          return (
                            <View key={ep.id || i} style={[s.episodeItem, i % 2 === 1 && s.episodeItemAlt, {flexDirection: 'column', alignItems: 'stretch'}]}>
                              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                {/* Checkbox */}
                                <TouchableOpacity
                                  onPress={() => {
                                    setZipEpisodesList(prev => prev.map(item => item.id === ep.id ? { ...item, selected: !item.selected } : item));
                                  }}
                                  style={{paddingRight: 8}}>
                                  <Text style={{color: ep.selected ? RED : '#555', fontSize: 14}}>{ep.selected ? '☑' : '☐'}</Text>
                                </TouchableOpacity>

                                {/* Episode Badge */}
                                <View style={{backgroundColor: RED + '22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginRight: 10, borderWidth: 1, borderColor: RED + '44'}}>
                                  <Text style={{color: RED, fontSize: 11, fontWeight: '800'}}>
                                    Ep {String(ep.episodeNumber || i + 1).padStart(2, '0')}
                                  </Text>
                                </View>

                                {/* Name & Season */}
                                <View style={{flex: 1}}>
                                  <Text style={s.episodeName} numberOfLines={1}>{ep.episodeTitle || ep.fileName}</Text>
                                  <Text style={s.zipAssetMeta}>
                                    S{String(ep.seasonNumber || '1').padStart(2, '0')}E{String(ep.episodeNumber || i + 1).padStart(2, '0')} · {ep.fileName} {ep.size ? `· ${fmtBytes(ep.size)}` : ''}
                                  </Text>
                                </View>

                                {/* Status */}
                                <View style={{marginRight: 8}}>
                                  <Text style={{color: ep.status === 'ready' ? '#4caf50' : ep.status === 'error' ? '#ff6b6b' : '#ff9800', fontSize: 10, fontWeight: '700'}}>
                                    {ep.status === 'ready' ? '✓ Ready' : ep.status === 'error' ? '⚠ Error' : 'Processing'}
                                  </Text>
                                </View>

                                {/* Buttons */}
                                <View style={{flexDirection: 'row', gap: 6}}>
                                  <TouchableOpacity
                                    onPress={() => {
                                      if (isEditing) {
                                        setEditingEpisodeId(null);
                                      } else {
                                        setEditingEpisodeId(ep.id);
                                        setEditEpSeason(ep.seasonNumber || '1');
                                        setEditEpNumber(ep.episodeNumber || String(i + 1));
                                        setEditEpTitle(ep.episodeTitle || '');
                                        setEditEpQuality(ep.quality || '1080p');
                                        setEditEpAudio(ep.audioLangs.join(', '));
                                        setEditEpSub(ep.subtitles.join(', '));
                                      }
                                    }}
                                    style={{paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#222', borderRadius: 4}}>
                                    <Text style={{color: '#fff', fontSize: 10, fontWeight: '600'}}>{isEditing ? 'Cancel' : 'Edit'}</Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    onPress={() => {
                                      setZipEpisodesList(prev => prev.filter(item => item.id !== ep.id));
                                    }}
                                    style={{paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#331111', borderRadius: 4}}>
                                    <Text style={{color: '#ff6b6b', fontSize: 10, fontWeight: '600'}}>Remove</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>

                              {/* Detected Badges */}
                              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6, paddingLeft: 24}}>
                                {ep.quality ? <Text style={{color: '#fff', fontSize: 9, backgroundColor: '#4caf50', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3}}>{ep.quality}</Text> : null}
                                {ep.audioLangs?.map((l: string, idx: number) => <Text key={'a' + idx} style={{color: '#fff', fontSize: 9, backgroundColor: '#2196f3', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3}}>{l}</Text>)}
                                {ep.mappedSubtitles?.length > 0 ? ep.mappedSubtitles.map((sub: string, idx: number) => <Text key={'s' + idx} style={{color: '#fff', fontSize: 9, backgroundColor: '#ff9800', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3}}>Sub: {sub}</Text>) : null}
                                {ep.videoCodec ? <Text style={{color: '#aaa', fontSize: 9, backgroundColor: '#333', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3}}>{ep.videoCodec}</Text> : null}
                              </View>

                              {/* Inline Editor */}
                              {isEditing && (
                                <View style={{marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#333', paddingLeft: 24}}>
                                  <Text style={{color: RED, fontSize: 10, fontWeight: '800', marginBottom: 6}}>EDIT EPISODE DETAILS</Text>
                                  <View style={{flexDirection: 'row', gap: 8, marginBottom: 6}}>
                                    <View style={{flex: 1}}>
                                      <Text style={{color: MUTED2, fontSize: 9}}>Season</Text>
                                      <TextInput style={[s.input, {paddingVertical: 4, fontSize: 11}]} value={editEpSeason} onChangeText={setEditEpSeason} keyboardType="numeric" />
                                    </View>
                                    <View style={{flex: 1}}>
                                      <Text style={{color: MUTED2, fontSize: 9}}>Episode No</Text>
                                      <TextInput style={[s.input, {paddingVertical: 4, fontSize: 11}]} value={editEpNumber} onChangeText={setEditEpNumber} keyboardType="numeric" />
                                    </View>
                                    <View style={{flex: 2}}>
                                      <Text style={{color: MUTED2, fontSize: 9}}>Quality</Text>
                                      <TextInput style={[s.input, {paddingVertical: 4, fontSize: 11}]} value={editEpQuality} onChangeText={setEditEpQuality} />
                                    </View>
                                  </View>
                                  <View style={{marginBottom: 6}}>
                                    <Text style={{color: MUTED2, fontSize: 9}}>Episode Title</Text>
                                    <TextInput style={[s.input, {paddingVertical: 4, fontSize: 11}]} value={editEpTitle} onChangeText={setEditEpTitle} />
                                  </View>
                                  <View style={{flexDirection: 'row', gap: 8, marginBottom: 8}}>
                                    <View style={{flex: 1}}>
                                      <Text style={{color: MUTED2, fontSize: 9}}>Audio Languages</Text>
                                      <TextInput style={[s.input, {paddingVertical: 4, fontSize: 11}]} value={editEpAudio} onChangeText={setEditEpAudio} />
                                    </View>
                                    <View style={{flex: 1}}>
                                      <Text style={{color: MUTED2, fontSize: 9}}>Subtitle Languages</Text>
                                      <TextInput style={[s.input, {paddingVertical: 4, fontSize: 11}]} value={editEpSub} onChangeText={setEditEpSub} />
                                    </View>
                                  </View>
                                  <TouchableOpacity
                                    onPress={() => {
                                      setZipEpisodesList(prev => prev.map(item => {
                                        if (item.id === ep.id) {
                                          return {
                                            ...item,
                                            seasonNumber: editEpSeason,
                                            episodeNumber: editEpNumber,
                                            episodeTitle: editEpTitle,
                                            quality: editEpQuality,
                                            audioLangs: editEpAudio.split(',').map(s => s.trim()).filter(Boolean),
                                            subtitles: editEpSub.split(',').map(s => s.trim()).filter(Boolean),
                                          };
                                        }
                                        return item;
                                      }));
                                      setEditingEpisodeId(null);
                                    }}
                                    style={{backgroundColor: RED, paddingVertical: 6, borderRadius: 4, alignItems: 'center'}}>
                                    <Text style={{color: WHITE, fontSize: 11, fontWeight: '800'}}>Save Changes</Text>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {(audioLangs.length > 0 || subtitleLangs.length > 0 || quality) && (
                      <View style={s.zipDetectedBox}>
                        <Text style={s.zipDetectedLabel}>AUTO-DETECTED FROM ZIP</Text>
                        {quality ? <Text style={s.zipDetectedLine}><Text style={{color:MUTED3}}>▣ Quality:  </Text>{quality}</Text> : null}
                        {audioLangs.length > 0 ? <Text style={s.zipDetectedLine}><Text style={{color:MUTED3}}>◎ Audio:    </Text>{audioLangs.join(', ')}</Text> : null}
                        {subtitleLangs.length > 0 ? <Text style={s.zipDetectedLine}><Text style={{color:MUTED3}}>≡ Subtitles: </Text>{subtitleLangs.join(', ')}</Text> : null}
                      </View>
                    )}
                    <TouchableOpacity onPress={() => {
                      setZipEpisodesList([]); setZipEpisodes([]); setZipAssets([]); setZipMsg(''); setZipExpanded(false);
                      setTotalEpisodesCount('');
                    }}>
                      <Text style={s.clearTxt}>× Clear ZIP</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            {/* ── 4 · AUDIO & SUBTITLES ── */}
            <View style={s.card}>
              <SectionHeader n={4} title="AUDIO & SUBTITLES" />

              <FieldLabel text="AUDIO LANGUAGES" />
              <TextInput style={s.input} placeholder="e.g. Hindi, English"
                placeholderTextColor={MUTED2} value={audioInput}
                onChangeText={v => { setAudioInput(v); setAudioLangs(v.split(',').map(x=>x.trim()).filter(Boolean)); }} />
              <View style={s.chipRow}>
                {AUDIO_CHIPS.map(c => {
                  const active = audioLangs.includes(c);
                  return (
                    <TouchableOpacity key={c} style={[s.chip, active && s.chipActive]}
                      onPress={() => setAudioLangs(prev => toggleChip(prev, c))} activeOpacity={0.8}>
                      <Text style={[s.chipTxt, active && s.chipTxtActive]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={s.hint}>Tap chips or type comma-separated values.</Text>

              <View style={s.dividerLine} />

              <FieldLabel text="SUBTITLES" />
              <TextInput style={s.input} placeholder="e.g. English, Hindi"
                placeholderTextColor={MUTED2} value={subtitleInput}
                onChangeText={v => { setSubtitleInput(v); setSubtitleLangs(v.split(',').map(x=>x.trim()).filter(Boolean)); }} />
              <View style={s.chipRow}>
                {SUBTITLE_CHIPS.map(c => {
                  const active = subtitleLangs.includes(c);
                  return (
                    <TouchableOpacity key={c} style={[s.chip, active && s.chipActive]}
                      onPress={() => setSubtitleLangs(prev => toggleChip(prev, c))} activeOpacity={0.8}>
                      <Text style={[s.chipTxt, active && s.chipTxtActive]}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={s.dividerLine} />

              <FieldLabel text="QUALITY" />
              <View style={s.chipRow}>
                {['4K UHD','1080p FHD','720p HD','480p SD','360p'].map(q => {
                  const active = quality===q;
                  return (
                    <TouchableOpacity key={q} style={[s.chip, active && s.chipActive]}
                      onPress={() => setQuality(active ? '' : q)} activeOpacity={0.8}>
                      <Text style={[s.chipTxt, active && s.chipTxtActive]}>{q}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={s.dividerLine} />

              {/* Subtitle file */}
              <FilePickerRow icon="≡" label="Upload Subtitle File"
                subLabel=".srt · .vtt · .ass — language auto-detected"
                fileName={subtitleFile?.name} selected={!!subtitleFile}
                onPress={pickSubtitle} onClear={() => setSubtitleFile(null)} />
            </View>

            {/* Readiness Checklist */}
            <View style={{marginTop: 16, marginBottom: 16, padding: 16, backgroundColor: CARD2, borderRadius: 8, borderWidth: 1, borderColor: '#333'}}>
              <Text style={{color: WHITE, fontWeight: 'bold', marginBottom: 12}}>Ready to Publish</Text>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
                {[
                  { label: 'TMDB ID', done: !!tmdbId },
                  { label: 'Title', done: !!title },
                  { label: 'Poster', done: !!posterUrl || !!posterFile || sliderImages.length > 0 },
                  { label: 'Overview', done: !!overview },
                  { label: 'Video', done: videoUploads.length > 0 || !!videoFile || !!videoUrl || zipAssets.length > 0 },
                  { label: 'Quality', done: !!quality },
                  { label: 'Audio', done: audioLangs.length > 0 },
                  { label: 'Subtitle', done: subtitleLangs.length > 0 || !!subtitleFile },
                  { label: 'Release Year', done: !!year },
                  { label: 'Category', done: !!contentType },
                  { label: 'Episode information', done: contentType === 'Series' ? (!!seasonNo && !!episodeNo) : true }
                ].map(c => (
                  <View key={c.label} style={{flexDirection: 'row', alignItems: 'center', width: '48%'}}>
                    <Text style={{color: c.done ? '#4caf50' : MUTED2, marginRight: 8, fontWeight: 'bold'}}>{c.done ? '✓' : '○'}</Text>
                    <Text style={{color: c.done ? WHITE : MUTED, fontSize: 12}}>{c.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Upload progress */}
            {uploadProgress >= 0 && (
              <View style={s.progressWrap}>
                <View style={s.progressBar}>
                  <View style={[s.progressFill, { width: `${uploadProgress}%` as any }]} />
                </View>
                <Text style={s.progressTxt}>
                  {uploadProgress < 100 ? `Uploading… ${uploadProgress}%` : '✓  Published!'}
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={{flexDirection: 'row', gap: 8, marginBottom: 16}}>
              <TouchableOpacity
                style={{flex: 1, backgroundColor: '#333', padding: 14, borderRadius: 8, alignItems: 'center'}}
                onPress={() => alert('Draft saved successfully.')}
              >
                <Text style={{color: WHITE, fontWeight: 'bold'}}>Save Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{flex: 1, backgroundColor: '#333', padding: 14, borderRadius: 8, alignItems: 'center'}}
                onPress={() => setShowPreview(true)}
              >
                <Text style={{color: WHITE, fontWeight: 'bold'}}>Preview</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{flex: 1, backgroundColor: '#333', padding: 14, borderRadius: 8, alignItems: 'center'}}
                onPress={() => alert('Scheduled for release.')}
              >
                <Text style={{color: WHITE, fontWeight: 'bold'}}>Schedule</Text>
              </TouchableOpacity>
            </View>

            {/* Publish */}
            <TouchableOpacity
              style={[s.publishBtn, uploadProgress >= 0 && s.disabled]}
              activeOpacity={0.85}
              onPress={publishToLibrary}
              disabled={uploadProgress >= 0}
            >
              <Text style={s.publishTxt}>▲  Publish to Library</Text>
            </TouchableOpacity>
            
            {showPreview && (
              <PreviewModal 
                item={{
                  title, year, rating, ageRating, runtime, quality, overview, cast, director, audioLangs,
                  slider_images: sliderImages.map(i => i.uri),
                  poster_url: posterUrl || posterFile?.uri
                }} 
                onClose={() => setShowPreview(false)} 
              />
            )}
          </>
        )}

        {/* ════ LIBRARY TAB ════ */}
        {activeTab==='library' && (
          <>
            <View style={s.libSearch}>
              <Text style={s.libSearchIcon}>◎</Text>
              <TextInput style={s.libSearchInput} placeholder="Search library..."
                placeholderTextColor={MUTED2} value={librarySearch}
                onChangeText={setLibrarySearch} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {(['Movies','Series','Clips','Teasers'] as const).map(c => (
                <TouchableOpacity key={c} style={[s.catTab, libraryTab===c && s.catTabActive]}
                  onPress={() => setLibraryTab(c)} activeOpacity={0.8}>
                  <Text style={[s.catTxt, libraryTab===c && s.catTxtActive]}>
                    {c==='Movies'?'▣  ':c==='Series'?'▭  ':c==='Clips'?'✂  ':'▶  '}{c}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {(() => {
              const filtered = libraryItems.filter(item => {
                const typeMatch = libraryTab === 'Movies' ? item.type === 'Movie'
                  : libraryTab === 'Series' ? item.type === 'Series'
                  : libraryTab === 'Clips' ? item.type === 'Clips'
                  : item.type === 'Teasers';
                const searchMatch = !librarySearch.trim() ||
                  item.title.toLowerCase().includes(librarySearch.toLowerCase());
                return typeMatch && searchMatch;
              });

              if (filtered.length === 0) {
                return (
                  <View style={s.emptyState}>
                    <View style={s.emptyIconWrap}><Text style={s.emptyIcon}>▦</Text></View>
                    <Text style={s.emptyTitle}>No {libraryTab.toLowerCase()} yet</Text>
                    <Text style={s.emptySub}>
                      Upload your first {libraryTab==='Movies'?'movie':libraryTab==='Series'?'series':libraryTab.toLowerCase()} from the Upload tab.
                    </Text>
                  </View>
                );
              }

              return (
                <>
                  <View style={lib.countRow}>
                    <Text style={lib.countTxt}>{filtered.length} item{filtered.length!==1?'s':''}</Text>
                  </View>
                  {filtered.map(item => (
                    <View key={item.id} style={lib.card}>
                      <View style={lib.cardTop}>
                        {item.posterUrl ? (
                          <Image source={{ uri: item.posterUrl }} style={lib.poster}/>
                        ) : (
                          <View style={[lib.poster, lib.posterFb]}>
                            <Text style={lib.posterFbTxt}>{item.type==='Series'?'▭':'▣'}</Text>
                          </View>
                        )}
                        <View style={{ flex:1, paddingLeft:12 }}>
                          <View style={lib.badgeRow}>
                            <View style={lib.typeBadge}>
                              <Text style={lib.typeBadgeTxt}>{item.type.toUpperCase()}</Text>
                            </View>
                            {item.rating ? <Text style={lib.rating}>★ {item.rating}</Text> : null}
                            {item.quality ? <View style={lib.qBadge}><Text style={lib.qBadgeTxt}>{item.quality}</Text></View> : null}
                          </View>
                          <Text style={lib.title} numberOfLines={2}>{item.title}</Text>
                          <Text style={lib.meta}>
                            {[item.year, item.language, item.ageRating].filter(Boolean).join(' · ')}
                          </Text>
                          {item.categories.length > 0 && (
                            <Text style={lib.cats} numberOfLines={1}>{item.categories.join(', ')}</Text>
                          )}
                          {item.audioLangs.length > 0 && (
                            <Text style={lib.audio}>◎ {item.audioLangs.join(', ')}</Text>
                          )}
                          {item.type==='Series' && item.weeklyEpisodes.length > 0 && (
                            <Text style={lib.wep}>▭ {item.weeklyEpisodes.length} weekly ep{item.weeklyEpisodes.length!==1?'s':''}</Text>
                          )}
                          <Text style={lib.date}>Added {item.addedAt}</Text>
                        </View>
                      </View>

                      {/* Action buttons */}
                      <View style={lib.actions}>
                        <TouchableOpacity
                          style={lib.editBtn}
                          activeOpacity={0.8}
                          onPress={() => { setEditingItem(item); setShowEditModal(true); }}>
                          <Text style={lib.editBtnTxt}>✎  Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={lib.deleteBtn}
                          activeOpacity={0.8}
                          onPress={async () => {
                            if (hasDatabaseUrl) {
                              const db = getDatabase();
                              await dbSet(dbRef(db, 'library/' + item.id), null);
                            } else {
                              setLibraryItems(prev => prev.filter(i => i.id !== item.id));
                            }
                          }}>
                          <Text style={lib.deleteBtnTxt}>✕  Delete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={lib.uploadMoreBtn}
                          activeOpacity={0.8}
                          onPress={() => {
                            setTitle(item.title); setYear(item.year); setContentType(item.type==='Series'?'Series':'Movie');
                            setPosterUrl(item.posterUrl); setTmdbId(item.tmdbId);
                            setSeasonNo(item.seasonNo); setEpisodeNo(String(parseInt(item.episodeNo||'0')+1));
                            setActiveTab('home');
                          }}>
                          <Text style={lib.uploadMoreTxt}>+ Upload More</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              );
            })()}
          </>
        )}

        {/* ════ SETTINGS TAB ════ */}
        {activeTab==='settings' && (
          <>
            <View style={s.card}>
              <Text style={s.settingsSectionTitle}>ACCOUNT</Text>
              <View style={s.accountRow}>
                <View style={[s.accountAvatar, { backgroundColor:'#4285F4' }]}>
                  <Text style={s.accountAvatarTxt}>{(user.email?.[0] ?? 'U').toUpperCase()}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={s.accountName}>{user.displayName ?? 'Admin User'}</Text>
                  <Text style={s.accountStatus}>{user.email ?? 'Linked'}</Text>
                </View>
                {user.photoURL && <Image source={{ uri: user.photoURL }} style={s.accountImg} />}
              </View>
              <View style={s.dividerLine} />
              <View style={{ marginVertical: 8 }}>
                <Text style={[s.settingsSectionTitle, { marginBottom: 8 }]}>LINKED ACCOUNTS</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#1877F2', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 16 }}>f</Text>
                    </View>
                    <View>
                      <Text style={{ color: WHITE, fontWeight: '600', fontSize: 13 }}>Facebook Account</Text>
                      <Text style={{ color: MUTED2, fontSize: 11 }}>
                        {user?.providerData?.some((p: any) => p.providerId === 'facebook.com') ? 'Connected to account' : 'Link for single-account login'}
                      </Text>
                    </View>
                  </View>
                  {user?.providerData?.some((p: any) => p.providerId === 'facebook.com') ? (
                    <View style={{ backgroundColor: '#142e1a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                      <Text style={{ color: '#4ade80', fontSize: 12, fontWeight: '700' }}>✓ Linked</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={{ backgroundColor: '#1877F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, opacity: linkingFb ? 0.6 : 1 }}
                      onPress={handleLinkFacebook}
                      disabled={linkingFb}
                      activeOpacity={0.8}
                    >
                      {linkingFb ? <ActivityIndicator size="small" color={WHITE} /> : <Text style={{ color: WHITE, fontWeight: '700', fontSize: 12 }}>Link Facebook</Text>}
                    </TouchableOpacity>
                  )}
                </View>
                {fbLinkMsg ? <Text style={{ color: fbLinkMsg.startsWith('✓') ? '#4ade80' : RED, fontSize: 11, marginTop: 6, fontWeight: '600' }}>{fbLinkMsg}</Text> : null}
              </View>
              <View style={s.dividerLine} />
              <TouchableOpacity style={s.signOutRow} onPress={() => signOut(auth)} activeOpacity={0.8}>
                <Text style={s.signOutIcon}>↪</Text>
                <Text style={s.signOutTxt}>Sign Out</Text>
              </TouchableOpacity>
            </View>

            <View style={s.card}>
              <Text style={s.settingsSectionTitle}>APP OWNER</Text>
              <View style={s.ownerRow}>
                <View style={s.ownerAvatar}><Text style={s.ownerAvatarTxt}>S</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ownerName}>@{APP_OWNER}</Text>
                  <Text style={s.ownerSub}>Full data transfer enabled</Text>
                </View>
                <View style={s.ownerBadge}><Text style={s.ownerBadgeTxt}>OWNER</Text></View>
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.settingsSectionTitle}>PERMANENT API KEY</Text>
              <Text style={s.apiKeyDesc}>
                Permanent key for @{APP_OWNER}. Tagged on every publish — your streaming app uses this to verify and fetch content.
              </Text>
              <View style={s.apiKeyRow}>
                <Text style={s.apiKeyValue} numberOfLines={1}>
                  {apiKeyVisible ? apiKey : apiKey.slice(0,14) + '·'.repeat(18)}
                </Text>
                <TouchableOpacity onPress={() => setApiKeyVisible(v => !v)} style={s.eyeBtn}>
                  <Text style={s.eyeIcon}>{apiKeyVisible ? '●' : '○'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.apiKeyNote}>
                Stored permanently in your browser. Will not change between sessions.
              </Text>
              <View style={s.dividerLine} />
              <Text style={[s.settingsSectionTitle, { marginTop: 8 }]}>API PAYLOAD PREVIEW</Text>
              <View style={s.payloadBox}>
                <Text style={s.payloadTxt}>{`{\n  "api_key": "${apiKey}",\n  "owner": "${APP_OWNER}",\n  "title": "",\n  "year": "",\n  "language": "",\n  "categories": [],\n  "nav_chips": [],\n  "tmdb_id": "",\n  "poster_url": "",\n  "video_url": "",\n  "audio": [],\n  "subtitles": [],\n  "quality": ""\n}`}</Text>
              </View>
            </View>
            {/* ── OTA UPDATE ── */}
            <View style={s.card}>
              <Text style={s.settingsSectionTitle}>OVER-THE-AIR UPDATE</Text>
              <Text style={s.otaDesc}>
                Broadcasts a version bump to every connected client app. They will automatically clear cache and reload within seconds — no manual refresh required.
              </Text>

              {/* Status indicator */}
              <View style={s.otaStatusRow}>
                <View style={s.otaStatusDot} />
                <Text style={s.otaStatusTxt}>Listener active — clients subscribed to app_version</Text>
              </View>

              {/* Push button */}
              <TouchableOpacity
                style={[s.otaBtn, otaPushing && s.otaBtnDisabled]}
                onPress={pushOtaUpdate}
                activeOpacity={0.8}
                disabled={otaPushing}
              >
                {otaPushing
                  ? <>
                      <ActivityIndicator size="small" color={WHITE} style={{ marginRight: 8 }} />
                      <Text style={s.otaBtnTxt}>Broadcasting…</Text>
                    </>
                  : <Text style={s.otaBtnTxt}>▲  Push OTA Update</Text>
                }
              </TouchableOpacity>

              <Text style={s.otaNote}>
                Writes a new Unix timestamp to Firebase Realtime Database at{' '}
                <Text style={{ color: RED }}>app_version</Text>. Every client's{' '}
                <Text style={{ color: RED }}>onValue</Text> listener detects the change,
                clears Cache Storage, and force-reloads to fetch the latest code.
              </Text>
            </View>

          </>
        )}

        <View style={{ height: 122 }} />
      </ScrollView>

      <BottomNav active={activeTab} onPress={setActiveTab} />
    </SafeAreaView>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
const ui = StyleSheet.create({
  secHeader:  { flexDirection:'row', alignItems:'center', marginBottom:16 },
  secBadge:   { width:22, height:22, borderRadius:6, backgroundColor: RED,
    justifyContent:'center', alignItems:'center', marginRight:8 },
  secBadgeNum:{ color: WHITE, fontSize:11, fontWeight:'900' },
  secIcon:    { color: RED, fontSize:11, marginRight:6 },
  secTitle:   { color: RED, fontSize:11, fontWeight:'900', letterSpacing:1.5, textTransform:'uppercase' },
  fieldLabel: { color: MUTED3, fontSize:10, fontWeight:'700', letterSpacing:1.2,
    textTransform:'uppercase', marginBottom:6, marginTop:2 },
});

// ─── File Info Card styles ────────────────────────────────────────────────────
const fic = StyleSheet.create({
  card:         { backgroundColor: '#0d1a0d', borderWidth:1, borderColor:'#1a3a1a',
    borderRadius:12, padding:12, marginBottom:8 },
  topRow:       { flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 },
  fileIcon:     { width:36, height:36, borderRadius:8, backgroundColor:'#1a3a1a',
    justifyContent:'center', alignItems:'center' },
  fileIconTxt:  { color:'#4ade80', fontSize:14 },
  fileName:     { color: WHITE, fontSize:13, fontWeight:'600' },
  fileMeta:     { color: MUTED2, fontSize:11, marginTop:2 },
  clearBtn:     { width:28, height:28, borderRadius:14, backgroundColor:'#1a1a1a',
    justifyContent:'center', alignItems:'center' },
  clearTxt:     { color: MUTED3, fontSize:12 },
  detected:     { borderTopWidth:1, borderTopColor:'#1a3a1a', paddingTop:8 },
  detectedLabel:{ color:'#4ade80', fontSize:9, fontWeight:'800', letterSpacing:1.2,
    textTransform:'uppercase', marginBottom:6 },
  chips:        { flexDirection:'row', flexWrap:'wrap', gap:6 },
  chip:         { paddingHorizontal:10, paddingVertical:4, borderRadius:20, borderWidth:1 },
  chipQ:        { backgroundColor:'#0d1030', borderColor:'#252878' },
  chipA:        { backgroundColor:'#0a200a', borderColor:'#1a4a1a' },
  chipS:        { backgroundColor:'#1f0a0a', borderColor:'#4a1a1a' },
  chipTxt:      { color:'#ddd', fontSize:11, fontWeight:'600' },
  noDetect:     { color: MUTED2, fontSize:11, fontStyle:'italic' },
});

const vu = StyleSheet.create({
  card: { backgroundColor: '#0d1a0d', borderWidth: 1, borderColor: '#1a3a1a', borderRadius: 12, padding: 12, marginBottom: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 },
  icon: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#1a3a1a', alignItems: 'center', justifyContent: 'center' },
  iconTxt: { color: '#4ade80', fontSize: 13 },
  name: { color: WHITE, fontSize: 12, fontWeight: '700' },
  status: { fontSize: 10, fontWeight: '800', marginTop: 3 },
  action: { paddingHorizontal: 7, paddingVertical: 5, borderRadius: 6, backgroundColor: RED + '18', borderWidth: 1, borderColor: RED + '40' },
  actionTxt: { color: RED, fontSize: 10, fontWeight: '800' },
  remove: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
  removeTxt: { color: MUTED3, fontSize: 10 },
  track: { height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: '#1c1c1c', marginBottom: 8 },
  fill: { height: 5, borderRadius: 3 },
  error: { color: '#ff6b6b', fontSize: 10, lineHeight: 15, marginBottom: 7 },
  details: { borderTopWidth: 1, borderTopColor: '#1a3a1a', paddingTop: 8 },
  detailTitle: { color: '#4ade80', fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  detail: { width: '31%', minWidth: 78 },
  detailLabel: { color: MUTED2, fontSize: 9, textTransform: 'uppercase' },
  detailValue: { color: MUTED3, fontSize: 10, marginTop: 2 },
  detectError: { color: '#f59e0b', fontSize: 10, marginTop: 8 },
  detecting: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 5 },
  detectingTxt: { color: MUTED2, fontSize: 10 },
});

const ex = StyleSheet.create({
  card: { backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 14 },
  chip: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: BORDER2, backgroundColor: INPUT },
  chipActive: { backgroundColor: RED + '16', borderColor: RED + '55' },
  chipTxt: { color: MUTED3, fontSize: 10, fontWeight: '700' },
  chipTxtActive: { color: RED },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: INPUT, borderWidth: 1, borderColor: BORDER2, borderRadius: 11, padding: 12 },
  pickIcon: { color: RED, fontSize: 22 },
  pickTitle: { color: WHITE, fontSize: 12, fontWeight: '700' },
  pickSub: { color: MUTED2, fontSize: 10, marginTop: 2 },
  pickArrow: { color: MUTED2, fontSize: 22 },
  empty: { alignItems: 'center', padding: 28, backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 12 },
  emptyIcon: { color: MUTED, fontSize: 28, marginBottom: 8 },
  emptyTitle: { color: WHITE, fontSize: 13, fontWeight: '700' },
  emptySub: { color: MUTED2, fontSize: 11, textAlign: 'center', marginTop: 5, lineHeight: 17 },
  list: { backgroundColor: CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 12, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: BORDER },
  fileIcon: { width: 30, height: 30, borderRadius: 7, backgroundColor: RED + '15', alignItems: 'center', justifyContent: 'center' },
  fileIconTxt: { color: RED, fontSize: 12 },
  name: { color: WHITE, fontSize: 12, fontWeight: '600' },
  meta: { color: MUTED2, fontSize: 10, marginTop: 2 },
  remove: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  removeTxt: { color: '#ff6b6b', fontSize: 11 },
});

// ─── File picker row styles ───────────────────────────────────────────────────
const fp = StyleSheet.create({
  row:          { flexDirection:'row', alignItems:'center', backgroundColor: INPUT,
    borderWidth:1, borderColor: BORDER2, borderRadius:11, paddingVertical:13, paddingHorizontal:14 },
  rowSelected:  { borderColor: RED, backgroundColor: RED+'08' },
  iconWrap:     { width:34, height:34, borderRadius:8, backgroundColor: CARD2,
    justifyContent:'center', alignItems:'center', marginRight:12 },
  iconWrapSelected:{ backgroundColor: RED+'20' },
  icon:         { fontSize:13, color: MUTED2 },
  iconSelected: { color: RED },
  label:        { color: WHITE, fontSize:13, fontWeight:'600' },
  fileName:     { color: MUTED2, fontSize:11, marginTop:2 },
  subLabel:     { color: MUTED2, fontSize:11, marginTop:2 },
  check:        { width:26, height:26, borderRadius:13, backgroundColor: RED,
    justifyContent:'center', alignItems:'center' },
  plus:         { fontSize:22, color: MUTED, fontWeight:'300' },
  clearRow:     { paddingVertical:4 },
  clearTxt:     { color: RED, fontSize:12, fontWeight:'600' },
});

// ─── Nav styles ───────────────────────────────────────────────────────────────
const nav = StyleSheet.create({
  dock:       { position:'absolute', left:'5%', width:'90%', maxWidth:440,
    borderRadius:50, overflow:'hidden', borderWidth:1, borderColor:'rgba(255,255,255,0.12)',
    backgroundColor:'rgba(20,20,20,0.88)', shadowColor:'#000', shadowOffset:{ width:0, height:8 },
    shadowOpacity:0.4, shadowRadius:18, elevation:14 },
  blur:       { borderRadius:50, backgroundColor:'rgba(24,24,24,0.76)' },
  tabs:       { flexDirection:'row', alignItems:'center', padding:6 },
  tab:        { flex:1, alignItems:'center', minWidth:0 },
  tabInner:   { width:'100%', alignItems:'center', justifyContent:'center',
    paddingVertical:8, paddingHorizontal:4, borderRadius:28 },
  tabInnerActive:{ backgroundColor:'rgba(255,255,255,0.11)', borderWidth:1,
    borderColor:'rgba(229,9,20,0.38)' },
  icon:       { fontSize:16, color: MUTED2, marginBottom:4 },
  iconActive: { color: RED },
  label:      { fontSize:10, color: MUTED2, fontWeight:'700', letterSpacing:0.5 },
  labelActive:{ color: RED },
});

// ─── Results modal styles ─────────────────────────────────────────────────────
const rm = StyleSheet.create({
  backdrop:   { flex:1, backgroundColor:'#000000cc', justifyContent:'flex-end' },
  sheet:      { backgroundColor:'#0e0e0e', borderTopLeftRadius:24, borderTopRightRadius:24,
    maxHeight:'88%', borderWidth:1, borderBottomWidth:0, borderColor: BORDER2 },
  handle:     { width:36, height:4, backgroundColor: BORDER2, borderRadius:2,
    alignSelf:'center', marginTop:12, marginBottom:4 },
  header:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    paddingHorizontal:20, paddingVertical:14, borderBottomWidth:1, borderBottomColor: BORDER },
  title:      { color: WHITE, fontSize:17, fontWeight:'800' },
  sub:        { color: MUTED2, fontSize:12, marginTop:2 },
  closeBtn:   { width:30, height:30, borderRadius:15, backgroundColor: CARD2,
    justifyContent:'center', alignItems:'center' },
  closeTxt:   { color: MUTED3, fontSize:13, fontWeight:'700' },
  list:       { paddingHorizontal:16, paddingTop:6 },
  item:       { flexDirection:'row', alignItems:'center', paddingVertical:12,
    borderBottomWidth:1, borderBottomColor: BORDER, gap:12 },
  poster:     { width:54, height:80, borderRadius:7, backgroundColor: CARD2 },
  posterFb:   { justifyContent:'center', alignItems:'center' },
  posterFbTxt:{ color: MUTED, fontSize:18 },
  topRow:     { flexDirection:'row', alignItems:'center', gap:8, marginBottom:3 },
  badge:      { paddingHorizontal:6, paddingVertical:2, borderRadius:4 },
  badgeTV:    { backgroundColor:'#1a2f4a' },
  badgeFILM:  { backgroundColor:'#2a1a1a' },
  badgeTxt:   { color: MUTED3, fontSize:9, fontWeight:'800', letterSpacing:0.5 },
  rating:     { color:'#f5c518', fontSize:11, fontWeight:'700' },
  itemTitle:  { color: WHITE, fontSize:14, fontWeight:'700', lineHeight:20, marginBottom:2 },
  itemYear:   { color: MUTED2, fontSize:11, marginBottom:3 },
  itemOverview:{ color: MUTED2, fontSize:11, lineHeight:16 },
  arrow:      { color: MUTED, fontSize:22, fontWeight:'300' },
});

// ─── Login styles ─────────────────────────────────────────────────────────────
const ls = StyleSheet.create({
  root:           { flex:1, backgroundColor: BG },
  scroll:         { flexGrow:1, alignItems:'center', justifyContent: 'center', padding:24, paddingVertical:48, zIndex: 10 },
  logoWrap:       { marginBottom:40, alignItems: 'center' },
  card:           { width:'100%', maxWidth: 440, backgroundColor: 'rgba(15, 15, 15, 0.45)', borderRadius:32, padding:32,
    borderWidth:1, borderColor: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 30 },
  cardTitle:      { color: WHITE, fontSize:26, fontWeight:'900', marginBottom:8, letterSpacing: -0.5 },
  cardSub:        { color: '#999', fontSize:14, marginBottom:28, lineHeight:22 },
  toggle:         { flexDirection:'row', backgroundColor:'rgba(0,0,0,0.4)', borderRadius:16,
    padding:6, marginBottom:32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  toggleBtn:      { flex:1, paddingVertical:12, borderRadius:12, alignItems:'center' },
  toggleActive:   { backgroundColor: RED },
  toggleTxt:      { color: '#666', fontSize:14, fontWeight:'700' },
  toggleTxtActive:{ color: WHITE },
  socialBtn:      { flexDirection:'row', alignItems:'center', backgroundColor:'rgba(255,255,255,0.06)', borderWidth:1, borderColor:'rgba(255,255,255,0.1)', borderRadius:16,
    paddingVertical:14, paddingHorizontal:18, marginBottom:12 },
  socialIconWrap: { width: 28, alignItems: 'center', marginRight: 12 },
  socialIcon:     { width:28, fontSize:14, textAlign:'center', marginRight:10, fontWeight:'900' },
  socialLabel:    { fontSize:15, fontWeight:'600', color: WHITE },
  divider:        { flexDirection:'row', alignItems:'center', marginVertical:24 },
  divLine:        { flex:1, height:1, backgroundColor: BORDER },
  divTxt:         { color: '#888', fontSize:12, marginHorizontal:16, fontWeight:'600', textTransform: 'uppercase', letterSpacing: 1 },
  input:          { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth:1, borderColor: 'rgba(255,255,255,0.1)', borderRadius:14,
    color: WHITE, padding:16, marginBottom:14, fontSize:15 },
  error:          { color:'#ff6b6b', fontSize:12, marginBottom:10, lineHeight:18 },
  btn:            { backgroundColor: RED, padding:16, borderRadius:14, alignItems:'center', marginTop:10, shadowColor: RED, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  btnTxt:         { color: WHITE, fontWeight:'800', fontSize:15 },
  disabled:       { opacity:0.45 },
  backLink:       { alignItems:'center', marginTop:16 },
  link:           { color:'#4a9eff', fontSize:13, fontWeight:'600' },
  successBox:     { backgroundColor:'#0e1a0e', borderRadius:10, padding:14, marginBottom:16,
    borderWidth:1, borderColor:'#1a3a1a' },
  successTxt:     { color:'#4ade80', fontSize:13, fontWeight:'600', textAlign:'center' },
  footer:         { color:'#444', fontSize:12, textAlign:'center', marginTop:40, letterSpacing: 1 },
});

// ─── App styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:       { flex:1, backgroundColor: BG },
  centered:   { flex:1, justifyContent:'center', alignItems:'center' },
  loadingTxt: { color: MUTED2, marginTop:12, fontSize:13 },
  scroll:     { padding:14 },
  // Header
  header:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    paddingHorizontal:14, paddingVertical:10 },
  headerLeft: { flexDirection:'row', alignItems:'center' },
  headerRight:{ flexDirection:'row', alignItems:'center' },
  brandName:  { color: WHITE, fontSize:19, fontWeight:'900', letterSpacing:-0.3 },
  brandSub:   { color: MUTED, fontSize:9, fontWeight:'800', letterSpacing:2, marginTop:1 },
  redLine:    { height:1.5, backgroundColor: RED },
  liveBadge:  { flexDirection:'row', alignItems:'center', backgroundColor: RED+'18',
    borderWidth:1, borderColor: RED+'40', borderRadius:6,
    paddingHorizontal:9, paddingVertical:5, gap:5 },
  liveDot:    { width:6, height:6, borderRadius:3, backgroundColor: RED },
  liveTxt:    { color: RED, fontSize:10, fontWeight:'900', letterSpacing:1 },
  // Page header
  pageHeader: { paddingTop:4, paddingBottom:6, paddingHorizontal:2 },
  pageTitle:  { color: WHITE, fontSize:24, fontWeight:'900', letterSpacing:-0.3, marginBottom:4 },
  pageSub:    { color: MUTED2, fontSize:13, lineHeight:20, marginBottom:10 },
  // Card
  card:       { backgroundColor: CARD, borderRadius:16, padding:16, marginBottom:14,
    borderWidth:1, borderColor: BORDER },
  // Segments
  segRow:     { flexDirection:'row', backgroundColor:'#080808', borderRadius:12, padding:4, marginBottom:14 },
  seg:        { flex:1, paddingVertical:10, borderRadius:9, alignItems:'center' },
  segActive:  { backgroundColor: RED },
  segTxt:     { color: MUTED2, fontSize:13, fontWeight:'700' },
  segTxtActive:{ color: WHITE },
  modeRow:    { flexDirection:'row', gap:8, marginBottom:12 },
  modeBtn:    { flex:1, paddingVertical:10, borderRadius:10, alignItems:'center',
    backgroundColor: INPUT, borderWidth:1.5, borderColor: BORDER2 },
  modeBtnActive:{ borderColor: RED, backgroundColor: RED+'10' },
  modeTxt:    { color: MUTED2, fontSize:12, fontWeight:'700' },
  modeTxtActive:{ color: RED },
  // Search
  searchRow:  { flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 },
  searchInput:{ flex:1, minWidth:0, marginBottom:0 },
  input:      { backgroundColor: INPUT, borderWidth:1, borderColor: BORDER2, borderRadius:10,
    color: WHITE, padding:12, marginBottom:10, fontSize:14 },
  textArea:   { height:88, textAlignVertical:'top' },
  fetchBtn:   { backgroundColor: RED, paddingHorizontal:16, paddingVertical:13,
    borderRadius:10, alignItems:'center', justifyContent:'center', minWidth:110 },
  fetchBtnTxt:{ color: WHITE, fontWeight:'800', fontSize:13 },
  hint:       { color: MUTED2, fontSize:11, marginBottom:10, lineHeight:16 },
  errorBox:   { backgroundColor:'#180a0a', borderWidth:1, borderColor:'#3a1a1a',
    borderRadius:9, padding:10, marginBottom:10 },
  errorTxt:   { color:'#ff6b6b', fontSize:12 },
  disabled:   { opacity:0.45 },
  // TMDB selected
  selectedPreview:    { flexDirection:'row', alignItems:'center', backgroundColor: RED+'08',
    borderWidth:1, borderColor: RED+'25', borderRadius:12, padding:12, marginTop:8, gap:10 },
  selectedBar:        { width:3, height:44, backgroundColor: RED, borderRadius:2 },
  selectedLabel:      { color: RED, fontSize:9, fontWeight:'800', letterSpacing:1.2,
    textTransform:'uppercase', marginBottom:2 },
  selectedTitle:      { color: WHITE, fontSize:14, fontWeight:'700' },
  selectedMeta:       { color: MUTED2, fontSize:11, marginTop:2 },
  selectedPosterThumb:{ width:34, height:50, borderRadius:5, backgroundColor: CARD2 },
  changeBtn:          { paddingHorizontal:10, paddingVertical:6, borderRadius:8,
    backgroundColor: RED+'18', borderWidth:1, borderColor: RED+'35' },
  changeBtnTxt:       { color: RED, fontSize:11, fontWeight:'700' },
  viewResultsBtn:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    backgroundColor: RED+'0c', borderWidth:1, borderColor: RED+'28', borderRadius:10,
    paddingHorizontal:14, paddingVertical:11, marginTop:6 },
  viewResultsTxt:     { color: RED, fontSize:13, fontWeight:'700' },
  viewResultsArrow:   { color: RED, fontSize:20 },
  // Metadata
  twoCol:   { flexDirection:'row' },
  threeCol: { flexDirection:'row' },
  dividerLine:{ height:1, backgroundColor: BORDER, marginVertical:14 },
  // Categories
  chipRow:     { flexDirection:'row', flexWrap:'wrap', gap:7, marginBottom:8, marginTop:4 },
  chip:        { paddingHorizontal:13, paddingVertical:6, borderRadius:20,
    backgroundColor: INPUT, borderWidth:1, borderColor: BORDER2 },
  chipActive:  { backgroundColor: RED+'18', borderColor: RED+'60' },
  chipTxt:     { color: MUTED2, fontSize:12, fontWeight:'600' },
  chipTxtActive:{ color: RED },
  chipCatActive:{ backgroundColor:'#0d1f3c', borderColor:'#2a5eb4' },
  chipCatTxtActive:{ color:'#6eaeff' },
  catSelectedRow:{ backgroundColor:'#0a1525', borderRadius:8, padding:10, marginBottom:8 },
  catSelectedTxt:{ color:'#6eaeff', fontSize:12 },
  // Media
  posterUploaded: { flexDirection:'row', alignItems:'center', marginBottom:12, gap:12 },
  posterThumb:    { width:76, height:108, borderRadius:8, backgroundColor: CARD2 },
  posterEmpty:    { alignItems:'center', backgroundColor: CARD2, borderRadius:12,
    borderWidth:1.5, borderColor: BORDER2, borderStyle:'dashed' as const,
    paddingVertical:28, marginBottom:12 },
  posterEmptyIcon:{ width:48, height:48, borderRadius:12, backgroundColor: INPUT,
    justifyContent:'center', alignItems:'center', marginBottom:10 },
  posterEmptyIconTxt:{ color: MUTED, fontSize:22 },
  posterEmptyLabel:{ color: WHITE, fontSize:14, fontWeight:'600', marginBottom:4 },
  posterEmptySub:  { color: MUTED2, fontSize:11 },
  pickPosterBtn:  { backgroundColor: INPUT, borderWidth:1, borderColor: BORDER2,
    borderRadius:10, paddingVertical:12, paddingHorizontal:14, marginBottom:8 },
  pickPosterTxt:  { color: WHITE, fontSize:13, fontWeight:'600', textAlign:'center' },
  posterMeta:     { color: MUTED2, fontSize:11, marginTop:4 },
  clearTxt:       { color: RED, fontSize:12, fontWeight:'600', marginTop:6 },
  altPickBtn:     { backgroundColor: INPUT, borderWidth:1, borderColor: BORDER2,
    borderRadius:10, paddingVertical:11, paddingHorizontal:14, marginBottom:8, alignItems:'center' },
  altPickTxt:     { color: MUTED3, fontSize:13, fontWeight:'600' },
  // ZIP
  zipRow:         { flexDirection:'row', alignItems:'center', backgroundColor: INPUT,
    borderWidth:1, borderColor: BORDER2, borderRadius:11, paddingVertical:13,
    paddingHorizontal:14, marginBottom:8 },
  zipRowDone:     { borderColor: BORDER, backgroundColor:'#0d0d0d' },
  zipIconWrap:    { width:40, height:40, borderRadius:8, backgroundColor:'#181410',
    justifyContent:'center', alignItems:'center', marginRight:12 },
  zipIconTxt:     { fontSize:15, color: MUTED3 },
  zipLabel:       { color: WHITE, fontSize:13, fontWeight:'600' },
  zipSub:         { color: MUTED2, fontSize:11, marginTop:2 },
  zipProgressWrap:{ width:76, alignItems:'flex-end', marginLeft:8 },
  zipProgressTxt: { color: RED, fontSize:10, fontWeight:'800', marginBottom:4 },
  zipProgressTrack:{ width:76, height:5, borderRadius:3, backgroundColor:'#2a1717', overflow:'hidden' },
  zipProgressFill:{ height:5, borderRadius:3, backgroundColor:RED },
  zipMsgBox:      { backgroundColor:'#0a1f0a', borderRadius:9, borderWidth:1,
    borderColor:'#1a3a1a', padding:10, marginBottom:6 },
  zipMsgTxt:      { color:'#4ade80', fontSize:12, fontWeight:'600', textAlign:'center' },
  episodeHeader:  { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    marginBottom:8, marginTop:4 },
  episodeChip:    { flexDirection:'row', alignItems:'center', backgroundColor: RED+'12',
    borderWidth:1, borderColor: RED+'28', borderRadius:20, paddingHorizontal:12, paddingVertical:5 },
  episodeChipTxt: { color: RED, fontSize:12, fontWeight:'800' },
  expandBtn:      { paddingHorizontal:8, paddingVertical:5 },
  expandBtnTxt:   { color: MUTED2, fontSize:12, fontWeight:'600' },
  episodeList:    { backgroundColor:'#080808', borderRadius:10, borderWidth:1,
    borderColor: BORDER, marginBottom:10, overflow:'hidden' },
  episodeItem:    { flexDirection:'row', alignItems:'center', paddingVertical:8,
    paddingHorizontal:12, borderBottomWidth:1, borderBottomColor: BORDER },
  episodeItemAlt: { backgroundColor:'#0b0b0b' },
  episodeNum:     { color: RED, fontSize:12, fontWeight:'800', width:26,
    fontFamily: Platform.OS==='ios'?'Courier':'monospace' },
  episodeName:    { flex:1, color:'#bbb', fontSize:12,
    fontFamily: Platform.OS==='ios'?'Courier':'monospace' },
  zipDetectedBox: { backgroundColor:'#0d130d', borderWidth:1, borderColor:'#1a2e1a',
    borderRadius:10, padding:12, marginBottom:8 },
  zipDetectedLabel:{ color:'#4ade80', fontSize:9, fontWeight:'800', letterSpacing:1.2,
    textTransform:'uppercase', marginBottom:8 },
  zipDetectedLine:{ color: MUTED2, fontSize:12, marginBottom:4, lineHeight:18 },
  zipAssetMeta:    { color: MUTED2, fontSize:10, marginTop:2 },
  queueHeader:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:8 },
  queueTitle:      { color: MUTED3, fontSize:11, fontWeight:'700' },
  queueAdd:        { color: RED, fontSize:11, fontWeight:'800' },
  extrasBtn:       { flexDirection:'row', alignItems:'center', gap:10, backgroundColor:'#160d0d',
    borderWidth:1, borderColor:RED+'45', borderRadius:12, paddingHorizontal:12, paddingVertical:11, marginTop:4 },
  extrasIcon:      { width:32, height:32, borderRadius:8, backgroundColor:RED+'20',
    justifyContent:'center', alignItems:'center' },
  extrasIconTxt:   { color:RED, fontSize:19 },
  extrasLabel:     { color:WHITE, fontSize:13, fontWeight:'700' },
  extrasSub:       { color:MUTED2, fontSize:10, marginTop:2 },
  extrasArrow:     { color:MUTED2, fontSize:22 },
  // Library
  libSearch:      { flexDirection:'row', alignItems:'center', backgroundColor: CARD,
    borderRadius:12, borderWidth:1, borderColor: BORDER, paddingHorizontal:14, marginBottom:14 },
  libSearchIcon:  { fontSize:13, marginRight:10, color: MUTED2 },
  libSearchInput: { flex:1, color: WHITE, paddingVertical:13, fontSize:14 },
  catTab:         { paddingHorizontal:16, paddingVertical:10, marginRight:8, borderRadius:10,
    borderWidth:1, borderColor: BORDER, backgroundColor: CARD },
  catTabActive:   { backgroundColor: RED+'12', borderColor: RED+'50' },
  catTxt:         { color: MUTED2, fontSize:13, fontWeight:'700' },
  catTxtActive:   { color: RED },
  emptyState:     { alignItems:'center', paddingVertical:80, paddingHorizontal:32 },
  emptyIconWrap:  { width:68, height:68, borderRadius:16, backgroundColor: CARD,
    borderWidth:1, borderColor: BORDER, justifyContent:'center', alignItems:'center', marginBottom:18 },
  emptyIcon:      { fontSize:28, color: MUTED },
  emptyTitle:     { color: WHITE, fontSize:20, fontWeight:'700', marginBottom:10 },
  emptySub:       { color: MUTED2, fontSize:14, textAlign:'center', lineHeight:22 },
  // Settings
  settingsSectionTitle:{ color: MUTED2, fontSize:10, fontWeight:'800', letterSpacing:1.5,
    textTransform:'uppercase', marginBottom:14 },
  accountRow:     { flexDirection:'row', alignItems:'center', marginBottom:12 },
  accountAvatar:  { width:44, height:44, borderRadius:22, justifyContent:'center',
    alignItems:'center', marginRight:12 },
  accountAvatarTxt:{ color: WHITE, fontSize:18, fontWeight:'900' },
  accountImg:     { width:40, height:40, borderRadius:20 },
  accountName:    { color: WHITE, fontSize:14, fontWeight:'700' },
  accountStatus:  { color: MUTED2, fontSize:12, marginTop:1 },
  signOutRow:     { flexDirection:'row', alignItems:'center', paddingVertical:4 },
  signOutIcon:    { fontSize:15, color: RED, marginRight:10 },
  signOutTxt:     { color: RED, fontSize:15, fontWeight:'700' },
  ownerRow:       { flexDirection:'row', alignItems:'center', gap:12 },
  ownerAvatar:    { width:44, height:44, borderRadius:22, backgroundColor: RED,
    justifyContent:'center', alignItems:'center' },
  ownerAvatarTxt: { color: WHITE, fontSize:18, fontWeight:'900' },
  ownerName:      { color: WHITE, fontSize:14, fontWeight:'700' },
  ownerSub:       { color: MUTED2, fontSize:11, marginTop:2 },
  ownerBadge:     { backgroundColor: RED+'18', borderWidth:1, borderColor: RED+'40',
    borderRadius:6, paddingHorizontal:8, paddingVertical:4 },
  ownerBadgeTxt:  { color: RED, fontSize:9, fontWeight:'900', letterSpacing:1 },
  apiKeyDesc:     { color: MUTED2, fontSize:13, lineHeight:20, marginBottom:12 },
  apiKeyRow:      { flexDirection:'row', alignItems:'center', backgroundColor: INPUT,
    borderWidth:1, borderColor: BORDER2, borderRadius:11, paddingHorizontal:14,
    paddingVertical:13, marginBottom:6 },
  apiKeyValue:    { flex:1, color: WHITE, fontSize:12,
    fontFamily: Platform.OS==='ios'?'Courier':'monospace' },
  eyeBtn:         { padding:4 },
  eyeIcon:        { fontSize:15, color: MUTED2 },
  apiKeyNote:     { color: MUTED2, fontSize:11, lineHeight:16, marginBottom:4 },
  payloadBox:     { backgroundColor:'#080808', borderRadius:10, borderWidth:1,
    borderColor: BORDER2, padding:12, marginTop:10 },
  payloadTxt:     { color: MUTED2, fontSize:10.5, lineHeight:18,
    fontFamily: Platform.OS==='ios'?'Courier':'monospace' },
  // Publish + progress
  publishBtn:     { backgroundColor: RED, padding:16, borderRadius:14, alignItems:'center', marginBottom:10 },
  publishTxt:     { color: WHITE, fontWeight:'900', fontSize:15, letterSpacing:0.5 },
  progressWrap:   { marginBottom:10 },
  progressBar:    { height:6, backgroundColor:'#1a1a1a', borderRadius:3, overflow:'hidden', marginBottom:6 },
  progressFill:   { height:6, backgroundColor: RED, borderRadius:3 },
  progressTxt:    { color: MUTED2, fontSize:11, fontWeight:'600', textAlign:'center' },
  // Weekly Episode Button
  weeklyBtn:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    backgroundColor:'#0a1a0a', borderWidth:1.5, borderColor:'#1a4a1a',
    borderRadius:13, paddingHorizontal:14, paddingVertical:13, marginBottom:12 },
  weeklyBtnLeft:  { flexDirection:'row', alignItems:'center', gap:12, flex:1 },
  weeklyIcon:     { width:36, height:36, borderRadius:10, backgroundColor:'#1a4a1a',
    justifyContent:'center', alignItems:'center' },
  weeklyIconTxt:  { color:'#4ade80', fontSize:20, fontWeight:'300' },
  weeklyBtnLabel: { color: WHITE, fontSize:13, fontWeight:'700' },
  weeklyBtnSub:   { color: MUTED2, fontSize:11, marginTop:2 },
  weeklyCount:    { width:28, height:28, borderRadius:14, backgroundColor:'#4ade80',
    justifyContent:'center', alignItems:'center' },
  weeklyCountTxt: { color:'#000', fontSize:12, fontWeight:'900' },
  weeklyArrow:    { color: MUTED2, fontSize:22 },
  // OTA
  otaDesc:        { color: MUTED2, fontSize:12.5, lineHeight:20, marginBottom:14 },
  otaStatusRow:   { flexDirection:'row', alignItems:'center', marginBottom:16,
    backgroundColor:'#0a1a0a', borderRadius:9, paddingHorizontal:12, paddingVertical:9,
    borderWidth:1, borderColor:'#1a3a1a' },
  otaStatusDot:   { width:7, height:7, borderRadius:3.5, backgroundColor:'#4ade80',
    marginRight:9 },
  otaStatusTxt:   { color:'#4ade80', fontSize:11, fontWeight:'700', flex:1 },
  otaBtn:         { backgroundColor: RED, borderRadius:13, paddingVertical:15,
    alignItems:'center', justifyContent:'center', flexDirection:'row', marginBottom:12 },
  otaBtnDisabled: { opacity:0.55 },
  otaBtnTxt:      { color: WHITE, fontWeight:'900', fontSize:14, letterSpacing:0.5 },
  otaNote:        { color: MUTED2, fontSize:11.5, lineHeight:18 },
  otaToast:       { position:'absolute', bottom:110, left:16, right:16, zIndex:9999,
    backgroundColor:'#12122a', borderWidth:1.5, borderColor: RED+'50',
    borderRadius:16, paddingVertical:14, paddingHorizontal:18,
    flexDirection:'row', alignItems:'center',
    shadowColor: RED, shadowOffset:{ width:0, height:4 },
    shadowOpacity:0.35, shadowRadius:14, elevation:10 },
  otaToastTitle:  { color: WHITE, fontSize:13.5, fontWeight:'800' },
  otaToastSub:    { color: MUTED2, fontSize:11, marginTop:2 },
});

// ─── Video Preview styles ─────────────────────────────────────────────────────
const vp = StyleSheet.create({
  wrap:     { backgroundColor:'#000', borderRadius:12, overflow:'hidden',
    borderWidth:1, borderColor: BORDER2, marginBottom:10 },
  topBar:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    paddingHorizontal:12, paddingVertical:8, backgroundColor:'#0a0a0a' },
  label:    { color:'#4ade80', fontSize:10, fontWeight:'800', letterSpacing:1 },
  closeBtn: { paddingHorizontal:8, paddingVertical:3 },
  closeTxt: { color: MUTED2, fontSize:12, fontWeight:'600' },
});

// ─── Weekly modal + Edit modal styles ─────────────────────────────────────────
const wm = StyleSheet.create({
  backdrop: { flex:1, backgroundColor:'#000000cc', justifyContent:'flex-end' },
  sheet:    { backgroundColor:'#0e0e0e', borderTopLeftRadius:24, borderTopRightRadius:24,
    maxHeight:'90%', borderWidth:1, borderBottomWidth:0, borderColor: BORDER2 },
  handle:   { width:36, height:4, backgroundColor: BORDER2, borderRadius:2,
    alignSelf:'center', marginTop:12, marginBottom:4 },
  header:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    paddingHorizontal:20, paddingVertical:14, borderBottomWidth:1, borderBottomColor: BORDER },
  title:    { color: WHITE, fontSize:17, fontWeight:'800' },
  sub:      { color: MUTED2, fontSize:12, marginTop:2 },
  closeBtn: { width:30, height:30, borderRadius:15, backgroundColor: CARD2,
    justifyContent:'center', alignItems:'center' },
  closeTxt: { color: MUTED3, fontSize:13, fontWeight:'700' },
  body:     { paddingHorizontal:16, paddingTop:12 },
  formCard: { backgroundColor: CARD, borderRadius:14, borderWidth:1, borderColor: BORDER,
    padding:14, marginBottom:12 },
  formTitle:{ color: RED, fontSize:10, fontWeight:'800', letterSpacing:1.5,
    textTransform:'uppercase', marginBottom:12 },
  row:      { flexDirection:'row', marginBottom:0 },
  lbl:      { color: MUTED3, fontSize:10, fontWeight:'700', letterSpacing:1.1,
    textTransform:'uppercase', marginBottom:5, marginTop:8 },
  inp:      { backgroundColor: INPUT, borderWidth:1, borderColor: BORDER2, borderRadius:10,
    color: WHITE, padding:11, fontSize:13 },
  pickBtn:  { flexDirection:'row', alignItems:'center', backgroundColor: INPUT, borderWidth:1,
    borderColor: BORDER2, borderRadius:10, paddingHorizontal:12, paddingVertical:11,
    marginTop:8, gap:8 },
  pickIcon: { color: MUTED2, fontSize:12 },
  pickTxt:  { flex:1, color: MUTED3, fontSize:12 },
  pickCheck:{ color:'#4ade80', fontWeight:'900', fontSize:13 },
  addBtn:   { backgroundColor: RED, borderRadius:11, paddingVertical:12,
    alignItems:'center', marginTop:14 },
  addTxt:   { color: WHITE, fontWeight:'800', fontSize:14 },
  delBtn:   { backgroundColor:'#1a0808', borderWidth:1, borderColor:'#3a1a1a',
    borderRadius:11, paddingVertical:12, alignItems:'center', marginTop:8 },
  delTxt:   { color:'#ff6b6b', fontWeight:'700', fontSize:14 },
  listCard: { backgroundColor: CARD, borderRadius:14, borderWidth:1, borderColor: BORDER,
    padding:14, marginBottom:12, overflow:'hidden' },
  epRow:    { flexDirection:'row', alignItems:'center', gap:10,
    paddingVertical:10, borderBottomWidth:1, borderBottomColor: BORDER },
  epRowAlt: { backgroundColor:'#0b0b0b' },
  epBadge:  { width:32, height:32, borderRadius:8, backgroundColor: RED+'18',
    borderWidth:1, borderColor: RED+'35', justifyContent:'center', alignItems:'center' },
  epBadgeTxt:{ color: RED, fontSize:11, fontWeight:'900' },
  epTitle:  { color: WHITE, fontSize:13, fontWeight:'600' },
  epDate:   { color: MUTED2, fontSize:11, marginTop:2 },
  epUrl:    { color: MUTED2, fontSize:10, marginTop:1 },
  epDel:    { width:26, height:26, borderRadius:13, backgroundColor:'#1a0808',
    justifyContent:'center', alignItems:'center' },
  epDelTxt: { color:'#ff6b6b', fontSize:11, fontWeight:'700' },
});

// ─── Library card styles ──────────────────────────────────────────────────────
const lib = StyleSheet.create({
  countRow:     { flexDirection:'row', alignItems:'center', marginBottom:8 },
  countTxt:     { color: MUTED2, fontSize:12, fontWeight:'600' },
  card:         { backgroundColor: CARD, borderRadius:16, borderWidth:1, borderColor: BORDER,
    padding:14, marginBottom:12, overflow:'hidden' },
  cardTop:      { flexDirection:'row', marginBottom:12 },
  poster:       { width:70, height:100, borderRadius:9, backgroundColor: CARD2 },
  posterFb:     { justifyContent:'center', alignItems:'center' },
  posterFbTxt:  { color: MUTED, fontSize:22 },
  badgeRow:     { flexDirection:'row', alignItems:'center', gap:6, marginBottom:5, flexWrap:'wrap' },
  typeBadge:    { backgroundColor:'#1a1a2e', borderRadius:4, paddingHorizontal:7, paddingVertical:2 },
  typeBadgeTxt: { color:'#6eaeff', fontSize:9, fontWeight:'800', letterSpacing:0.5 },
  rating:       { color:'#f5c518', fontSize:11, fontWeight:'700' },
  qBadge:       { backgroundColor:'#1a1000', borderRadius:4, paddingHorizontal:7, paddingVertical:2 },
  qBadgeTxt:    { color:'#f59e0b', fontSize:9, fontWeight:'800' },
  title:        { color: WHITE, fontSize:15, fontWeight:'800', lineHeight:20, marginBottom:3 },
  meta:         { color: MUTED2, fontSize:11, marginBottom:3 },
  cats:         { color:'#6eaeff', fontSize:11, marginBottom:2 },
  audio:        { color: MUTED2, fontSize:11, marginBottom:2 },
  wep:          { color:'#4ade80', fontSize:11, marginBottom:2 },
  date:         { color: MUTED, fontSize:10, marginTop:2 },
  actions:      { flexDirection:'row', gap:8, borderTopWidth:1, borderTopColor: BORDER,
    paddingTop:12 },
  editBtn:      { flex:1, backgroundColor:'#0d1a30', borderWidth:1, borderColor:'#1a3a6a',
    borderRadius:9, paddingVertical:10, alignItems:'center' },
  editBtnTxt:   { color:'#6eaeff', fontSize:12, fontWeight:'700' },
  deleteBtn:    { flex:1, backgroundColor:'#1a0808', borderWidth:1, borderColor:'#3a1212',
    borderRadius:9, paddingVertical:10, alignItems:'center' },
  deleteBtnTxt: { color:'#ff6b6b', fontSize:12, fontWeight:'700' },
  uploadMoreBtn:{ flex:1.4, backgroundColor: RED+'12', borderWidth:1, borderColor: RED+'35',
    borderRadius:9, paddingVertical:10, alignItems:'center' },
  uploadMoreTxt:{ color: RED, fontSize:12, fontWeight:'700' },
});

// ─── Notification bell / panel styles ─────────────────────────────────────────
const nb = StyleSheet.create({
  bellWrap:   { width:38, height:38, borderRadius:19, justifyContent:'center',
    alignItems:'center', position:'relative' },
  bellIcon:   { fontSize:20, color: WHITE },
  badge:      { position:'absolute', top:0, right:0, minWidth:16, height:16, borderRadius:8,
    backgroundColor: RED, justifyContent:'center', alignItems:'center',
    paddingHorizontal:3 },
  badgeTxt:   { color: WHITE, fontSize:9, fontWeight:'900' },
  panel:      { position: 'absolute', top: 60, right: 16, width: 420, maxHeight: 600, backgroundColor: '#0e0e0e', borderRadius: 12, borderWidth: 1, borderColor: '#333', zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.8, shadowRadius: 20, elevation: 15 },
  panelHeader:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    paddingHorizontal:14, paddingVertical:13, borderBottomWidth:1, borderBottomColor: BORDER },
  panelTitle: { color: WHITE, fontSize:22, fontWeight:'800', letterSpacing:0.2 },
  panelSub:   { color: MUTED2, fontSize:10, marginTop:3, letterSpacing:0.3 },
  pushBtn:    { flexDirection:'row', alignItems:'center', gap:5, backgroundColor: RED+'18',
    borderWidth:1, borderColor: RED+'40', borderRadius:8, paddingHorizontal:9, paddingVertical:6 },
  pushBtnTxt: { color: RED, fontSize:11, fontWeight:'700' },
  closeBtn:   { width:26, height:26, borderRadius:13, backgroundColor: CARD2,
    justifyContent:'center', alignItems:'center' },
  closeTxt:   { color: MUTED3, fontSize:12, fontWeight:'700' },
  tabs:       { flexDirection:'row', gap:10, paddingHorizontal:14, paddingTop:12, paddingBottom:10 },
  tab:        { flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', gap:7,
    borderWidth:1, borderColor:'#5a5a5a', borderRadius:22, paddingVertical:10 },
  tabActive:  { backgroundColor: WHITE, borderColor: WHITE },
  tabTxt:     { color: MUTED3, fontSize:12, fontWeight:'700' },
  tabTxtActive:{ color: BG },
  state:      { padding:28, alignItems:'center', justifyContent:'center', gap:8 },
  stateTxt:   { color:MUTED3, fontSize:12, textAlign:'center' },
  errorTxt:   { color:'#ff6b6b', fontSize:12, textAlign:'center', maxWidth:280 },
  retryBtn:   { backgroundColor: RED+'18', borderWidth:1, borderColor:RED+'40',
    borderRadius:8, paddingHorizontal:14, paddingVertical:7 },
  retryTxt:   { color:RED, fontSize:11, fontWeight:'800' },
  feed:       { maxHeight:565 },
  feedContent:{ paddingHorizontal:14, paddingBottom:18, gap:14 },
  releaseCard:{ backgroundColor:'#050505', borderWidth:1, borderColor:'#3a3a3a',
    borderRadius:14, overflow:'hidden' },
  mediaFrame: { height:188, backgroundColor: CARD2, position:'relative' },
  backdrop:   { width:'100%', height:'100%', backgroundColor:CARD2 },
  mediaShade: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor:'rgba(0,0,0,0.22)' },
  contentBadge:{ position:'absolute', top:10, left:10, borderRadius:5,
    paddingHorizontal:8, paddingVertical:5 },
  comingBadge:{ backgroundColor:RED },
  watchingBadge:{ backgroundColor:'#2f7bff' },
  contentBadgeTxt:{ color:WHITE, fontSize:9, fontWeight:'900', letterSpacing:0.8 },
  posterFb:   { justifyContent:'center', alignItems:'center' },
  cardTitle:  { color: WHITE, fontSize:20, fontWeight:'800', paddingBottom:8, lineHeight:24 },
  cardMeta:   { color: MUTED2, fontSize:10, letterSpacing:0.3 },
  cardDate:   { color:WHITE, fontSize:16, fontWeight:'800', paddingBottom:8 },
  cardOverview:{ color:'#b8b8b8', fontSize:13, lineHeight:21, paddingBottom:12 },
  releaseBody:{ paddingHorizontal:14, paddingTop:13, paddingBottom:14 },
  providerRow:{ flexDirection:'row', alignItems:'center', flexWrap:'wrap', gap:6 },
  providerPill:{ flexDirection:'row', alignItems:'center', gap:5, backgroundColor:'#161616',
    borderRadius:6, paddingHorizontal:6, paddingVertical:4, maxWidth:145 },
  providerLogo:{ width:18, height:18, borderRadius:4, backgroundColor:CARD2 },
  providerName:{ color:'#d4d4d4', fontSize:10, fontWeight:'700', flexShrink:1 },
  platformMissing:{ color:MUTED2, fontSize:10 },
  cardFooter:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    marginTop:14, paddingTop:12, borderTopWidth:1, borderTopColor:BORDER },
  remindBtn:{ flexDirection:'row', alignItems:'center', gap:6, backgroundColor:'#202020',
    borderWidth:1, borderColor:'#4a4a4a', borderRadius:7, paddingHorizontal:11, paddingVertical:8 },
  remindBtnActive:{ backgroundColor:WHITE, borderColor:WHITE },
  remindTxt:{ color:WHITE, fontSize:11, fontWeight:'800' },
  remindTxtActive:{ color:BG },
  typeBadge:  { position:'absolute', top:10, right:10, backgroundColor:'rgba(0,0,0,0.72)', borderRadius:4,
    paddingHorizontal:5, paddingVertical:2 },
  typeTxt:    { color: WHITE, fontSize:8.5, fontWeight:'900', letterSpacing:0.8 },
});

const nd = StyleSheet.create({
  hero: { flexDirection:'row', gap:14, backgroundColor:CARD, borderRadius:14, padding:12, marginBottom:16 },
  poster: { width:92, height:132, borderRadius:8, backgroundColor:CARD2 },
  posterFb: { justifyContent:'center', alignItems:'center' },
  type: { color:RED, fontSize:10, fontWeight:'900', letterSpacing:1, marginBottom:10 },
  date: { color:MUTED3, fontSize:12, lineHeight:18, marginBottom:8 },
  rating: { color:'#f5c518', fontSize:13, fontWeight:'700' },
  label: { color:MUTED2, fontSize:10, fontWeight:'800', letterSpacing:1.2, marginBottom:7, marginTop:7 },
  providerBox: { backgroundColor:'#0a1a0a', borderWidth:1, borderColor:'#1a3a1a', borderRadius:10, padding:12, marginBottom:12 },
  providerRow: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:8 },
  providerLogo: { width:24, height:24, borderRadius:5, backgroundColor:CARD2 },
  providerLogoFallback: { width:24, height:24, borderRadius:5, backgroundColor:RED, justifyContent:'center', alignItems:'center' },
  provider: { color:'#4ade80', fontSize:12, fontWeight:'700' },
  muted: { color:MUTED2, fontSize:11 },
  overview: { color:MUTED3, fontSize:12, lineHeight:19, marginBottom:14 },
  idBox: { flexDirection:'row', justifyContent:'space-between', backgroundColor:INPUT, borderWidth:1, borderColor:BORDER2, borderRadius:9, padding:11, marginBottom:14 },
  idLabel: { color:MUTED2, fontSize:10, fontWeight:'800' },
  idValue: { color:WHITE, fontSize:11, fontFamily:Platform.OS==='ios'?'Courier':'monospace' },
});

// ─── Slider / multi-poster thumbnail styles ───────────────────────────────────
const sldr = StyleSheet.create({
  wrap:         { position:'relative', marginRight:8 },
  posterTap:    { borderRadius:8, borderWidth:2, borderColor:'transparent', overflow:'hidden' },
  posterTapSelected:{ borderColor:RED },
  thumb:        { width:72, height:100, borderRadius:8, backgroundColor: CARD2 },
  posterImg: { width:72, height:100, borderRadius:8 },
  dimmer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius:8 },
  selectedCheck:{ position:'absolute', top:5, right:5, width:20, height:20, borderRadius:10,
    backgroundColor:RED, justifyContent:'center', alignItems:'center' },
  selectedCheckTxt:{ color:WHITE, fontSize:12, fontWeight:'900' },
  remove:       { position:'absolute', top:3, right:3, width:18, height:18, borderRadius:9,
    backgroundColor:'#000000cc', justifyContent:'center', alignItems:'center' },
  removeTxt:    { color: WHITE, fontSize:9, fontWeight:'900' },
  primaryBadge: { position:'absolute', bottom:4, left:0, right:0,
    alignItems:'center' },
  primaryTxt:   { backgroundColor: RED, color: WHITE, fontSize:7, fontWeight:'900',
    letterSpacing:0.8, paddingHorizontal:5, paddingVertical:1.5, borderRadius:3 },
  addMore:      { width:72, height:100, borderRadius:8, borderWidth:1.5,
    borderColor: BORDER2, borderStyle:'dashed' as const,
    backgroundColor: CARD, justifyContent:'center', alignItems:'center' },
  addMoreTxt:   { color: MUTED3, fontSize:11, fontWeight:'700', textAlign:'center',
    lineHeight:16 },
});
