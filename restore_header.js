const fs = require('fs');
let content = fs.readFileSync('artifacts/smovie-admin/app/index.tsx', 'utf8');

const header = `import React, { useState, useEffect, useRef } from 'react';
import { Platform, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, ActivityIndicator, Image, Dimensions, Modal, Pressable } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, googleProvider, githubProvider, facebookProvider, popupSignIn, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged, User, getFirebaseInitError } from '../src/firebase';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';
const PROVIDER_BASE = 'https://image.tmdb.org/t/p/w92';
const API_KEY = 'ba0701a4c153282eb8fc8207cade9afa'; 
const TMDB_BASE = 'https://api.themoviedb.org/3';

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
  return "dev-key-" + Math.random().toString(36).slice(2);
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
  return <Image source={require('../assets/logo.png')} style={{ width: size, height: size, borderRadius }} resizeMode="contain" />;
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

// \n\n`;

content = header + content;
fs.writeFileSync('artifacts/smovie-admin/app/index.tsx', content);
