const sharp = require('sharp');
const path = require('path');

const OUT = path.join(__dirname, '../../frontend/public/og-image.jpg');

// 1200x630 branded OG image — navy bg, gold stethoscope, AceNursing wordmark + tagline
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#071020"/>
      <stop offset="55%" style="stop-color:#0C1B33"/>
      <stop offset="100%" style="stop-color:#152540"/>
    </linearGradient>
    <radialGradient id="glow1" cx="15%" cy="50%" r="55%">
      <stop offset="0%" style="stop-color:#C49A3C;stop-opacity:0.09"/>
      <stop offset="100%" style="stop-color:#C49A3C;stop-opacity:0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="85%" cy="20%" r="50%">
      <stop offset="0%" style="stop-color:#1A7A6E;stop-opacity:0.12"/>
      <stop offset="100%" style="stop-color:#1A7A6E;stop-opacity:0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow1)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>

  <!-- Subtle dot grid top-right -->
  <rect x="700" y="0" width="500" height="630" fill="none" opacity="0.03"
    style="background-image:repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%);background-size:18px 18px"/>

  <!-- Decorative circles -->
  <circle cx="980" cy="315" r="260" fill="none" stroke="#C49A3C" stroke-width="1" opacity="0.07"/>
  <circle cx="980" cy="315" r="200" fill="none" stroke="#C49A3C" stroke-width="1" opacity="0.05"/>
  <circle cx="980" cy="315" r="140" fill="none" stroke="#C49A3C" stroke-width="1" opacity="0.04"/>

  <!-- Logo icon box -->
  <rect x="80" y="200" width="90" height="90" rx="20" fill="url(#iconGrad)"/>
  <defs>
    <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563EB"/>
      <stop offset="100%" style="stop-color:#1D4ED8"/>
    </linearGradient>
  </defs>

  <!-- Stethoscope icon (scaled up, centered in box) -->
  <g transform="translate(125, 245) scale(2.6)">
    <circle cx="0" cy="-14" r="6" fill="none" stroke="#C49A3C" stroke-width="2.2"/>
    <path d="M-6 -14 Q-12 -14 -12 -7 Q-12 4 0 4 Q12 4 12 -7 Q12 -14 6 -14"
      fill="none" stroke="#C49A3C" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="12" cy="4" r="3.5" fill="#C49A3C"/>
    <line x1="12" y1="0.5" x2="12" y2="-5" stroke="#C49A3C" stroke-width="2.2" stroke-linecap="round"/>
  </g>

  <!-- AceNursing wordmark -->
  <text x="192" y="262" font-family="Georgia, serif" font-size="72" font-weight="700"
    fill="#ffffff" letter-spacing="-1">Ace<tspan fill="#C49A3C">Nursing</tspan></text>

  <!-- Tagline -->
  <text x="82" y="318" font-family="Arial, sans-serif" font-size="26" font-weight="400"
    fill="rgba(255,255,255,0.6)" letter-spacing="0.3">
    Premium Nursing Study Materials &amp; NCLEX Prep
  </text>

  <!-- Divider line -->
  <line x1="82" y1="348" x2="580" y2="348" stroke="#C49A3C" stroke-width="1.5" opacity="0.4"/>

  <!-- Stats row -->
  <g font-family="Arial, sans-serif" fill="#ffffff">
    <text x="82" y="395" font-size="30" font-weight="700" fill="#C49A3C">25K+</text>
    <text x="82" y="420" font-size="16" fill="rgba(255,255,255,0.5)">Students</text>

    <text x="220" y="395" font-size="30" font-weight="700" fill="#C49A3C">500+</text>
    <text x="220" y="420" font-size="16" fill="rgba(255,255,255,0.5)">Materials</text>

    <text x="360" y="395" font-size="30" font-weight="700" fill="#C49A3C">4.9★</text>
    <text x="360" y="420" font-size="16" fill="rgba(255,255,255,0.5)">Avg Rating</text>

    <text x="500" y="395" font-size="30" font-weight="700" fill="#C49A3C">98%</text>
    <text x="500" y="420" font-size="16" fill="rgba(255,255,255,0.5)">Pass Rate</text>
  </g>

  <!-- CTA pill -->
  <rect x="82" y="450" width="240" height="48" rx="24" fill="#C49A3C"/>
  <text x="202" y="481" font-family="Arial, sans-serif" font-size="18" font-weight="700"
    fill="#ffffff" text-anchor="middle">Browse Materials →</text>

  <!-- Domain -->
  <text x="82" y="570" font-family="Arial, sans-serif" font-size="20"
    fill="rgba(255,255,255,0.35)">acenursing.com</text>
</svg>`;

sharp(Buffer.from(svg))
  .resize(1200, 630)
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile(OUT)
  .then(() => console.log('✅ og-image.jpg created at', OUT))
  .catch(err => { console.error('❌ Failed:', err.message); process.exit(1); });
