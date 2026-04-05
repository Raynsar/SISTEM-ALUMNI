/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║              ALUMNI PORTAL — app.js                     ║
 * ║   Controller utama: login, dashboard, form, preview     ║
 * ╚══════════════════════════════════════════════════════════╝
 */

/* ────────────────────────────────────────────────────────────
   STATE
──────────────────────────────────────────────────────────── */
const State = {
  alumni:   null,   // data alumni dari tabel alumni (read-only)
  profile:  {},     // data profil yang bisa diedit
  isDirty:  false,  // ada perubahan belum disimpan?
};

/* ────────────────────────────────────────────────────────────
   DOM HELPERS
──────────────────────────────────────────────────────────── */
const $  = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

function showPage(pageId) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $(pageId).classList.add('active');
  // Re-init lucide icons setiap kali page berubah
  lucide.createIcons();
}

function setLoading(btnEl, loading) {
  btnEl.classList.toggle('loading', loading);
}

function showError(msgEl, boxEl, message) {
  $('login-error-msg').textContent = message;
  boxEl.classList.add('show');
}

function hideError(boxEl) {
  boxEl.classList.remove('show');
}

/* ────────────────────────────────────────────────────────────
   INIT
──────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  // Cek konfigurasi supabase
  if (!isSupabaseConfigured()) {
    $('supabase-notice').classList.add('show');
  }

  bindLoginEvents();
  bindDashboardEvents();
});

/* ────────────────────────────────────────────────────────────
   LOGIN
──────────────────────────────────────────────────────────── */
function bindLoginEvents() {
  const btnLogin  = $('btn-login');
  const inputNama = $('input-nama');
  const inputNim  = $('input-nim');
  const errorBox  = $('login-error');

  // Enter key
  [inputNama, inputNim].forEach(el => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
    el.addEventListener('input', () => hideError(errorBox));
  });

  btnLogin.addEventListener('click', handleLogin);
}

async function handleLogin() {
  const btnLogin  = $('btn-login');
  const inputNama = $('input-nama');
  const inputNim  = $('input-nim');
  const errorBox  = $('login-error');

  const nama = inputNama.value.trim();
  const nim  = inputNim.value.trim();

  // Validasi input
  if (!nama || !nim) {
    showError(null, errorBox, 'Nama dan NIM harus diisi.');
    return;
  }

  setLoading(btnLogin, true);
  hideError(errorBox);

  // Mode demo jika Supabase belum dikonfigurasi
  if (!isSupabaseConfigured()) {
    await sleep(600);
    setLoading(btnLogin, false);

    // Demo login
    const demoAlumni = {
      nama_lulusan:  nama,
      nim:           nim,
      tahun_masuk:   2018,
      tanggal_lulus: '1 Agustus 2022',
      fakultas:      'Demo Mode',
      program_studi: 'Konfigurasi Supabase di config.js',
    };

    enterDashboard(demoAlumni);
    return;
  }

  // Login ke Supabase
  const { data, error } = await dbLogin(nama, nim);

  setLoading(btnLogin, false);

  if (error) {
    showError(null, errorBox, error);
    shakeInputs([inputNama, inputNim]);
    return;
  }

  enterDashboard(data);
}

function shakeInputs(inputs) {
  inputs.forEach(el => {
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = '';
    el.parentElement.style.animation = 'shake .35s ease';
    setTimeout(() => el.parentElement.style.animation = '', 400);
  });
}

/* ────────────────────────────────────────────────────────────
   ENTER DASHBOARD
──────────────────────────────────────────────────────────── */
async function enterDashboard(alumniData) {
  State.alumni = alumniData;

  // Update UI profil hero
  updateProfileHero(alumniData);

  // Load profil tersimpan (data yang bisa diedit)
  if (isSupabaseConfigured()) {
    const { data } = await dbGetProfile(alumniData.nim);
    if (data) {
      State.profile = data;
      populateForm(data);
    }
  }

  updateCompletion();
  showPage('page-dashboard');
}

/* ────────────────────────────────────────────────────────────
   PROFILE HERO
──────────────────────────────────────────────────────────── */
function updateProfileHero(alumni) {
  const initial = (alumni.nama_lulusan || 'A')[0].toUpperCase();

  // Avatar initial
  $('nav-avatar-initial').textContent   = initial;
  $('hero-avatar-initial').textContent  = initial;

  // Teks
  $('nav-avatar-name').textContent  = alumni.nama_lulusan;
  $('nav-welcome').textContent      = `Selamat datang, ${alumni.nama_lulusan}`;
  $('hero-name').textContent        = alumni.nama_lulusan;
  $('hero-nim-val').textContent     = alumni.nim;
  $('hero-fak-val').textContent     = alumni.fakultas    || '-';
  $('hero-prodi-val').textContent   = alumni.program_studi || '-';
  $('hero-lulus-val').textContent   = alumni.tanggal_lulus || '-';
}

/* ────────────────────────────────────────────────────────────
   POPULATE FORM (mengisi form dari data tersimpan)
──────────────────────────────────────────────────────────── */
function populateForm(profile) {
  // Input & textarea biasa
  $$('[data-field]').forEach(el => {
    const field = el.dataset.field;
    if (!field || !(field in profile)) return;
    const val = profile[field] ?? '';

    if (el.type === 'radio') {
      if (el.value === val) el.checked = true;
    } else {
      el.value = val;
    }
  });
}

/* ────────────────────────────────────────────────────────────
   COLLECT FORM DATA
──────────────────────────────────────────────────────────── */
function collectForm() {
  const data = {};

  $$('[data-field]').forEach(el => {
    const field = el.dataset.field;
    if (!field) return;

    if (el.type === 'radio') {
      if (el.checked) data[field] = el.value;
    } else {
      data[field] = el.value.trim();
    }
  });

  return data;
}

/* ────────────────────────────────────────────────────────────
   COMPLETION RING (hitung kelengkapan profil)
──────────────────────────────────────────────────────────── */
const PROFILE_FIELDS = [
  'email', 'phone',
  'linkedin_username', 'instagram_username', 'facebook_username', 'tiktok_username',
  'workplace_name', 'position', 'workplace_address', 'job_status',
  'company_linkedin', 'company_instagram',
];

function updateCompletion() {
  const current = collectForm();
  const filled  = PROFILE_FIELDS.filter(f => current[f] && current[f] !== '').length;
  const pct     = Math.round((filled / PROFILE_FIELDS.length) * 100);

  $('completion-pct').textContent = pct + '%';

  // SVG ring: circumference = 2π × 33 ≈ 207.3
  const circumference = 207.3;
  const offset = circumference - (pct / 100) * circumference;
  $('ring-fill').style.strokeDashoffset = offset;
}

/* ────────────────────────────────────────────────────────────
   SAVE PROFILE
──────────────────────────────────────────────────────────── */
async function handleSave() {
  const btnSave = $('btn-save');
  setLoading(btnSave, true);
  hideSaveStatus();

  const profileData = collectForm();

  if (!isSupabaseConfigured()) {
    // Demo mode: simpan ke localStorage saja
    localStorage.setItem(`alumni_profile_${State.alumni.nim}`, JSON.stringify(profileData));
    await sleep(600);
    setLoading(btnSave, false);
    State.profile = profileData;
    State.isDirty = false;
    showSaveStatus('success', '✓ Profil berhasil disimpan (Mode Demo — data tersimpan lokal)');
    updateLastSaved();
    updateCompletion();
    return;
  }

  const { data, error } = await dbSaveProfile(State.alumni.nim, profileData);

  setLoading(btnSave, false);

  if (error) {
    showSaveStatus('error', '✗ Gagal menyimpan: ' + error);
    return;
  }

  State.profile = data;
  State.isDirty = false;
  showSaveStatus('success', '✓ Profil berhasil disimpan.');
  updateLastSaved();
  updateCompletion();
}

function showSaveStatus(type, message) {
  const el = $('save-status');
  el.className = `save-status ${type}`;
  el.innerHTML = `<i data-lucide="${type === 'success' ? 'check-circle' : 'x-circle'}"></i> ${message}`;
  lucide.createIcons();
  setTimeout(hideSaveStatus, 5000);
}

function hideSaveStatus() {
  const el = $('save-status');
  el.className = 'save-status';
  el.innerHTML = '';
}

function updateLastSaved() {
  const now = new Date();
  $('last-saved').textContent = `Terakhir disimpan ${now.toLocaleTimeString('id-ID')}`;
}

/* ────────────────────────────────────────────────────────────
   RESET FORM
──────────────────────────────────────────────────────────── */
function handleReset() {
  if (!confirm('Batalkan semua perubahan yang belum disimpan?')) return;
  populateForm(State.profile);
  updateCompletion();
  State.isDirty = false;

  // Tutup semua preview
  $$('.social-preview-panel').forEach(p => {
    p.classList.remove('open');
    p.innerHTML = '';
  });
}

/* ────────────────────────────────────────────────────────────
   LOGOUT
──────────────────────────────────────────────────────────── */
function handleLogout() {
  if (State.isDirty) {
    if (!confirm('Ada perubahan belum disimpan. Yakin keluar?')) return;
  }

  State.alumni  = null;
  State.profile = {};
  State.isDirty = false;

  $('input-nama').value = '';
  $('input-nim').value  = '';

  showPage('page-login');
}

/* ────────────────────────────────────────────────────────────
   SOCIAL PREVIEW TOGGLE
──────────────────────────────────────────────────────────── */
const previewToggleState = {};

function setupSocialPreviewBtn(platform, inputId, previewBtnId, panelId) {
  const btn   = $(previewBtnId);
  const input = $(inputId);
  if (!btn || !input) return;

  previewToggleState[platform] = false;

  btn.addEventListener('click', async () => {
    const username = input.value.trim();
    if (!username) {
      showSaveStatus('error', `Isi username ${platform} terlebih dahulu.`);
      return;
    }

    previewToggleState[platform] = !previewToggleState[platform];

    if (previewToggleState[platform]) {
      await renderSocialPreview(platform, username, panelId);
    } else {
      const panel = $(panelId);
      panel.classList.remove('open');
      setTimeout(() => panel.innerHTML = '', 400);
    }
  });
}

/* ────────────────────────────────────────────────────────────
   DASHBOARD EVENTS
──────────────────────────────────────────────────────────── */
function bindDashboardEvents() {
  // Logout
  $('btn-logout').addEventListener('click', handleLogout);

  // Save
  $('btn-save').addEventListener('click', handleSave);

  // Reset
  $('btn-reset').addEventListener('click', handleReset);

  // Track dirty state on any input change
  $$('[data-field]').forEach(el => {
    el.addEventListener('input',  () => { State.isDirty = true; updateCompletion(); });
    el.addEventListener('change', () => { State.isDirty = true; updateCompletion(); });
  });

  // Social preview buttons
  setupSocialPreviewBtn('linkedin',  'social-linkedin',  'preview-linkedin-btn',  'preview-linkedin');
  setupSocialPreviewBtn('instagram', 'social-instagram', 'preview-instagram-btn', 'preview-instagram');
  setupSocialPreviewBtn('facebook',  'social-facebook',  'preview-facebook-btn',  'preview-facebook');
  setupSocialPreviewBtn('tiktok',    'social-tiktok',    'preview-tiktok-btn',    'preview-tiktok');

  // Warn before leaving if dirty
  window.addEventListener('beforeunload', (e) => {
    if (State.isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

/* ────────────────────────────────────────────────────────────
   UTILS
──────────────────────────────────────────────────────────── */
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}