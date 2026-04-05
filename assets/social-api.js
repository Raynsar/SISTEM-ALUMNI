/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║         ALUMNI PORTAL — social-api.js                   ║
 * ║   Integrasi API gratis: LinkedIn, Instagram,            ║
 * ║   Facebook, TikTok                                      ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * RINGKASAN API YANG DIGUNAKAN:
 * ──────────────────────────────────────────────────────────
 * LinkedIn  → oEmbed API (resmi, GRATIS, tidak perlu token)
 *             + LinkedIn Profile Badge embed resmi
 *
 * Instagram → Instagram Basic Display API (GRATIS)
 *             + oEmbed API (tidak perlu token, untuk preview post)
 *
 * Facebook  → Graph API (GRATIS, perlu token untuk data privat)
 *             + oEmbed untuk preview post publik
 *
 * TikTok    → oEmbed API (GRATIS, tidak perlu token)
 *             + profil link langsung
 */

/* ────────────────────────────────────────────────────────────
   LINKEDIN
   • Tidak ada API publik gratis untuk lookup profil personal
   • Yang tersedia: LinkedIn Profile Badge (embed resmi gratis)
   • Dokumentasi: https://www.linkedin.com/help/linkedin/answer/a522483
──────────────────────────────────────────────────────────── */

/**
 * Render LinkedIn preview sebagai badge embed resmi LinkedIn
 * Menggunakan linkedin.com/in/[username] sebagai link
 */
function renderLinkedInPreview(username, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!username) {
    container.classList.remove('open');
    container.innerHTML = '';
    return;
  }

  container.classList.add('open');
  container.innerHTML = `
    <div class="preview-card">
      <div class="preview-avatar" style="background: linear-gradient(135deg, #0a66c2, #004182);">
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.1rem;font-weight:700;">
          in
        </div>
      </div>
      <div class="preview-info">
        <div class="preview-name">@${escHtml(username)}</div>
        <div class="preview-sub">LinkedIn Profile</div>
        <a href="https://www.linkedin.com/in/${encodeURIComponent(username)}"
           target="_blank" rel="noopener" class="preview-link">
          <i data-lucide="external-link"></i>
          Buka di LinkedIn
        </a>
      </div>
    </div>
  `;
  lucide.createIcons();
}


/* ────────────────────────────────────────────────────────────
   INSTAGRAM
   • Basic Display API: gratis, butuh akses token user sendiri
   • oEmbed API: gratis, tidak perlu token, untuk URL post publik
   • Docs: https://developers.facebook.com/docs/instagram-basic-display-api
──────────────────────────────────────────────────────────── */

/**
 * Fetch profil Instagram milik user yang sedang login
 * (Basic Display API – butuh IG_ACCESS_TOKEN di config.js)
 */
async function fetchInstagramProfile() {
  if (!CONFIG.IG_ACCESS_TOKEN) return null;

  try {
    const res = await fetch(
      `${CONFIG.IG_API_BASE}/me?fields=id,username,name,profile_picture_url,followers_count,media_count&access_token=${CONFIG.IG_ACCESS_TOKEN}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Render Instagram preview
 * Jika ada IG_ACCESS_TOKEN → fetch data nyata
 * Jika tidak → tampilkan link profil saja
 */
async function renderInstagramPreview(username, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!username) {
    container.classList.remove('open');
    container.innerHTML = '';
    return;
  }

  container.classList.add('open');
  container.innerHTML = `
    <div class="preview-loading">
      <div class="mini-spin"></div> Memuat preview...
    </div>`;

  // Coba fetch profil nyata jika token tersedia
  const profile = await fetchInstagramProfile();

  if (profile && profile.username) {
    container.innerHTML = `
      <div class="preview-card">
        <div class="preview-avatar" style="background:linear-gradient(135deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%);">
          ${profile.profile_picture_url
            ? `<img src="${escHtml(profile.profile_picture_url)}" alt="IG Photo" loading="lazy">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.2rem;">📷</div>`
          }
        </div>
        <div class="preview-info">
          <div class="preview-name">@${escHtml(profile.username)}</div>
          <div class="preview-sub">
            ${profile.followers_count ? `${numberFormat(profile.followers_count)} followers` : 'Instagram'}
            ${profile.media_count    ? ` · ${numberFormat(profile.media_count)} posts` : ''}
          </div>
          <a href="https://instagram.com/${encodeURIComponent(username)}"
             target="_blank" rel="noopener" class="preview-link">
            <i data-lucide="external-link"></i>
            Buka di Instagram
          </a>
        </div>
      </div>`;
  } else {
    // Fallback: link saja
    container.innerHTML = `
      <div class="preview-card">
        <div class="preview-avatar" style="background:linear-gradient(135deg,#f09433,#bc1888);">
          <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.2rem;">📷</div>
        </div>
        <div class="preview-info">
          <div class="preview-name">@${escHtml(username)}</div>
          <div class="preview-sub">Instagram · <span style="font-size:.72rem;color:var(--muted-2)">Tambahkan IG_ACCESS_TOKEN untuk data lengkap</span></div>
          <a href="https://instagram.com/${encodeURIComponent(username)}"
             target="_blank" rel="noopener" class="preview-link">
            <i data-lucide="external-link"></i>
            Buka di Instagram
          </a>
        </div>
      </div>`;
  }
  lucide.createIcons();
}


/* ────────────────────────────────────────────────────────────
   FACEBOOK
   • Graph API: gratis, butuh access token untuk data privat
   • Profil publik bisa diakses tanpa token via link
   • oEmbed: gratis untuk preview post/page publik
   • Docs: https://developers.facebook.com/docs/graph-api
──────────────────────────────────────────────────────────── */

/**
 * Fetch data Facebook Page publik (tidak butuh token untuk halaman publik)
 */
async function fetchFacebookPage(identifier) {
  if (!CONFIG.FB_ACCESS_TOKEN) return null;
  try {
    const res = await fetch(
      `${CONFIG.FB_API_BASE}/${encodeURIComponent(identifier)}?fields=name,username,picture,fan_count,about&access_token=${CONFIG.FB_ACCESS_TOKEN}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Render Facebook preview
 */
async function renderFacebookPreview(username, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!username) {
    container.classList.remove('open');
    container.innerHTML = '';
    return;
  }

  container.classList.add('open');
  container.innerHTML = `
    <div class="preview-loading">
      <div class="mini-spin"></div> Memuat preview...
    </div>`;

  const page = await fetchFacebookPage(username);

  if (page && page.name) {
    const picUrl = page.picture?.data?.url || '';
    container.innerHTML = `
      <div class="preview-card">
        <div class="preview-avatar" style="background:#1877f2;">
          ${picUrl
            ? `<img src="${escHtml(picUrl)}" alt="FB Photo" loading="lazy">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:1.1rem;">f</div>`
          }
        </div>
        <div class="preview-info">
          <div class="preview-name">${escHtml(page.name)}</div>
          <div class="preview-sub">
            Facebook
            ${page.fan_count ? ` · ${numberFormat(page.fan_count)} likes` : ''}
          </div>
          <a href="https://facebook.com/${encodeURIComponent(username)}"
             target="_blank" rel="noopener" class="preview-link">
            <i data-lucide="external-link"></i>
            Buka di Facebook
          </a>
        </div>
      </div>`;
  } else {
    container.innerHTML = `
      <div class="preview-card">
        <div class="preview-avatar" style="background:#1877f2;">
          <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:1.1rem;">f</div>
        </div>
        <div class="preview-info">
          <div class="preview-name">${escHtml(username)}</div>
          <div class="preview-sub">Facebook · <span style="font-size:.72rem;color:var(--muted-2)">Tambahkan FB_ACCESS_TOKEN untuk data lengkap</span></div>
          <a href="https://facebook.com/${encodeURIComponent(username)}"
             target="_blank" rel="noopener" class="preview-link">
            <i data-lucide="external-link"></i>
            Buka di Facebook
          </a>
        </div>
      </div>`;
  }
  lucide.createIcons();
}


/* ────────────────────────────────────────────────────────────
   TIKTOK
   • oEmbed API: GRATIS, tidak perlu token, untuk URL profil publik
   • Display API: perlu client key, untuk data lebih lengkap
   • Docs: https://developers.tiktok.com/doc/embed-videos
──────────────────────────────────────────────────────────── */

/**
 * TikTok oEmbed — gratis, tidak perlu token
 * Bisa fetch data untuk URL video publik
 */
async function fetchTikTokOembed(username) {
  try {
    // oEmbed endpoint untuk profil (versi terbatas)
    const profileUrl = `https://www.tiktok.com/@${username}`;
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(profileUrl)}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Render TikTok preview
 */
async function renderTikTokPreview(username, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!username) {
    container.classList.remove('open');
    container.innerHTML = '';
    return;
  }

  container.classList.add('open');
  container.innerHTML = `
    <div class="preview-loading">
      <div class="mini-spin"></div> Memuat preview...
    </div>`;

  const oembed = await fetchTikTokOembed(username);

  if (oembed && oembed.author_name) {
    container.innerHTML = `
      <div class="preview-card">
        <div class="preview-avatar" style="background:#010101;">
          ${oembed.thumbnail_url
            ? `<img src="${escHtml(oembed.thumbnail_url)}" alt="TikTok" loading="lazy">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fe2c55;font-size:1.2rem;">♪</div>`
          }
        </div>
        <div class="preview-info">
          <div class="preview-name">@${escHtml(oembed.author_name || username)}</div>
          <div class="preview-sub">TikTok</div>
          <a href="https://tiktok.com/@${encodeURIComponent(username)}"
             target="_blank" rel="noopener" class="preview-link">
            <i data-lucide="external-link"></i>
            Buka di TikTok
          </a>
        </div>
      </div>`;
  } else {
    container.innerHTML = `
      <div class="preview-card">
        <div class="preview-avatar" style="background:#010101;">
          <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fe2c55;font-size:1.3rem;">♪</div>
        </div>
        <div class="preview-info">
          <div class="preview-name">@${escHtml(username)}</div>
          <div class="preview-sub">TikTok</div>
          <a href="https://tiktok.com/@${encodeURIComponent(username)}"
             target="_blank" rel="noopener" class="preview-link">
            <i data-lucide="external-link"></i>
            Buka di TikTok
          </a>
        </div>
      </div>`;
  }
  lucide.createIcons();
}


/* ────────────────────────────────────────────────────────────
   HELPERS
──────────────────────────────────────────────────────────── */

/** Escape HTML untuk mencegah XSS */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Format angka: 142000 → "142K" */
function numberFormat(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

/**
 * Router: dispatch ke renderer yang sesuai
 * @param {string} platform  'linkedin'|'instagram'|'facebook'|'tiktok'
 * @param {string} username
 * @param {string} containerId
 */
async function renderSocialPreview(platform, username, containerId) {
  switch (platform) {
    case 'linkedin':  renderLinkedInPreview(username, containerId);           break;
    case 'instagram': await renderInstagramPreview(username, containerId);    break;
    case 'facebook':  await renderFacebookPreview(username, containerId);     break;
    case 'tiktok':    await renderTikTokPreview(username, containerId);       break;
  }
}