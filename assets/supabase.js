/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║           ALUMNI PORTAL — supabase.js                   ║
 * ║   Semua operasi database: auth, read, write             ║
 * ╚══════════════════════════════════════════════════════════╝
 */

/**
 * Lazy-load Supabase JS SDK dari CDN.
 * Dipanggil sekali saat pertama kali butuh koneksi.
 */
async function loadSupabaseSDK() {
  return new Promise((resolve, reject) => {
    if (window.__supabase) return resolve(window.__supabase);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.onload = () => {
      const { createClient } = window.supabase;
      window.__supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      resolve(window.__supabase);
    };
    script.onerror = () => reject(new Error('Gagal memuat Supabase SDK'));
    document.head.appendChild(script);
  });
}

/** Periksa apakah config sudah diisi */
function isSupabaseConfigured() {
  return (
    CONFIG.SUPABASE_URL &&
    CONFIG.SUPABASE_URL !== 'GANTI_DENGAN_URL_SUPABASE_ANDA' &&
    CONFIG.SUPABASE_ANON_KEY &&
    CONFIG.SUPABASE_ANON_KEY !== 'GANTI_DENGAN_ANON_KEY_SUPABASE_ANDA'
  );
}

/**
 * Login: cocokkan nama + NIM di tabel alumni
 * @returns {{ data: object|null, error: string|null }}
 */
async function dbLogin(nama, nim) {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Supabase belum dikonfigurasi. Isi config.js terlebih dahulu.' };
  }

  let client;
  try {
    client = await loadSupabaseSDK();
  } catch (e) {
    return { data: null, error: 'Gagal terhubung ke database.' };
  }

  const namaBersih = nama.trim().toLowerCase();
  const nimBersih  = nim.trim();

  const { data, error } = await client
    .from(CONFIG.TABLE_ALUMNI)
    .select('*')
    .ilike('nama_lulusan', namaBersih)
    .eq('nim', nimBersih)
    .single();

  if (error || !data) {
    return { data: null, error: 'Nama atau NIM tidak ditemukan. Pastikan sesuai data ijazah.' };
  }

  return { data, error: null };
}

/**
 * Ambil profil alumni (data yang bisa diedit)
 * Jika belum ada, kembalikan objek kosong
 */
async function dbGetProfile(nim) {
  const client = await loadSupabaseSDK();

  const { data, error } = await client
    .from(CONFIG.TABLE_PROFILE)
    .select('*')
    .eq('nim', nim)
    .maybeSingle();

  if (error) {
    console.error('[DB] getProfile error:', error);
    return { data: null, error: error.message };
  }

  return { data: data || {}, error: null };
}

/**
 * Simpan / update profil alumni (upsert)
 */
async function dbSaveProfile(nim, profileData) {
  const client = await loadSupabaseSDK();

  const payload = {
    nim,
    ...profileData,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from(CONFIG.TABLE_PROFILE)
    .upsert(payload, { onConflict: 'nim' })
    .select()
    .single();

  if (error) {
    console.error('[DB] saveProfile error:', error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}