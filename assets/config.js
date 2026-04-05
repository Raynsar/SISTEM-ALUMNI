/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║              ALUMNI PORTAL — config.js                  ║
 * ║   Isi file ini sebelum menjalankan aplikasi              ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * LANGKAH SETUP SUPABASE:
 * ─────────────────────────────────────────────────────────────
 * 1. Buka https://supabase.com → Login / Daftar gratis
 * 2. Buat project baru
 * 3. Pergi ke Settings → API
 * 4. Copy "Project URL"  → isi di SUPABASE_URL
 * 5. Copy "anon public"  → isi di SUPABASE_ANON_KEY
 *
 * LANGKAH SETUP SOSIAL MEDIA API (gratis):
 * ─────────────────────────────────────────────────────────────
 *
 * INSTAGRAM (Basic Display API — GRATIS):
 *   1. Buka https://developers.facebook.com
 *   2. Buat App → Add Product "Instagram Basic Display"
 *   3. Buat test user, generate Access Token
 *   4. Isi IG_ACCESS_TOKEN di bawah
 *   ⚠ Token berlaku 60 hari, perlu refresh berkala
 *
 * FACEBOOK (Graph API — GRATIS):
 *   1. Buka https://developers.facebook.com
 *   2. Buat App → gunakan "Graph API Explorer"
 *   3. Generate User Access Token
 *   4. Isi FB_ACCESS_TOKEN di bawah
 *   ⚠ Untuk page publik tidak perlu token
 *
 * TIKTOK (Display API — GRATIS):
 *   1. Buka https://developers.tiktok.com
 *   2. Daftar sebagai developer
 *   3. Buat App → aktifkan "Login Kit" + "Display API"
 *   4. Isi TIKTOK_CLIENT_KEY di bawah
 *
 * LINKEDIN (Limited API — GRATIS):
 *   1. Buka https://developer.linkedin.com
 *   2. Buat App → Products: "Share on LinkedIn" (gratis)
 *   3. LinkedIn tidak mengizinkan profile lookup publik,
 *      fitur preview menggunakan LinkedIn embed badge resmi
 *
 * ─────────────────────────────────────────────────────────────
 */

const CONFIG = {

  // ── SUPABASE ─────────────────────────────────────────────
  SUPABASE_URL:      'https://qgdjdetfiydgkpqyhteo.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnZGpkZXRmaXlkZ2twcXlodGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjUyNzksImV4cCI6MjA5MDk0MTI3OX0.93-yin8RJovYFzCisCeuPj40rrvZNZN-hlnObdvjKJc',

  // ── INSTAGRAM BASIC DISPLAY API ──────────────────────────
  // Gratis · https://developers.facebook.com/docs/instagram-basic-display-api
  IG_ACCESS_TOKEN: '',   // contoh: 'IGQVJXaW...'
  IG_API_BASE:     'https://graph.instagram.com',

  // ── FACEBOOK GRAPH API ────────────────────────────────────
  // Gratis tier · https://developers.facebook.com/docs/graph-api
  FB_ACCESS_TOKEN: '',   // contoh: 'EAABsbCS...'
  FB_API_BASE:     'https://graph.facebook.com/v19.0',

  // ── TIKTOK DISPLAY API ────────────────────────────────────
  // Gratis · https://developers.tiktok.com/doc/tiktok-api-v2-introduction
  TIKTOK_CLIENT_KEY: 'awn9xte7vhsdi9hx',  // contoh: 'aw1234...'

  // ── APP SETTINGS ─────────────────────────────────────────
  APP_NAME:     'Alumni Portal',
  VERSION:      '1.0.0',

  // Nama tabel di Supabase
  TABLE_ALUMNI:  'alumni',
  TABLE_PROFILE: 'alumni_profiles',
};