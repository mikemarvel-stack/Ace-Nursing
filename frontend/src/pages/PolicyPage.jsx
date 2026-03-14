import { useParams, Link } from 'react-router-dom';

const PAGES = {
  'refund-policy': {
    title: 'Refund Policy',
    content: [
      { h: '7-Day Money-Back Guarantee', p: 'We stand behind the quality of our materials. If you are not completely satisfied with your purchase, contact us within 7 days of the order date and we will issue a full refund — no questions asked.' },
      { h: 'How to Request a Refund', p: 'Email support@acenursing.com with your order number and reason for the refund. Refunds are processed within 3–5 business days back to your original payment method.' },
      { h: 'Non-Refundable Items', p: 'Bundle purchases that have had more than 50% of the included items downloaded are not eligible for a full refund but may qualify for a partial refund at our discretion.' },
      { h: 'Duplicate Purchases', p: 'If you accidentally purchase the same product twice, contact us immediately and we will refund the duplicate charge in full.' },
    ],
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    content: [
      { h: 'Information We Collect', p: 'We collect your name, email address, and payment information (processed securely by PayPal — we never store card details) when you create an account or make a purchase.' },
      { h: 'How We Use Your Information', p: 'Your information is used to process orders, send download links, provide customer support, and (with your consent) send promotional emails. We never sell your data to third parties.' },
      { h: 'Data Storage & Security', p: 'All data is stored on encrypted servers. Passwords are hashed using bcrypt. Download links are signed and expire after 30 days.' },
      { h: 'Cookies', p: 'We use essential cookies for authentication and session management only. No third-party tracking cookies are used.' },
      { h: 'Your Rights', p: 'You may request deletion of your account and all associated data at any time by emailing support@acenursing.com.' },
    ],
  },
  'terms-of-service': {
    title: 'Terms of Service',
    content: [
      { h: 'License', p: 'Upon purchase, you are granted a non-exclusive, non-transferable personal license to use the downloaded materials for your own study purposes only.' },
      { h: 'Prohibited Use', p: 'You may not redistribute, resell, share, upload, or reproduce any materials in whole or in part without written permission from AceNursing.' },
      { h: 'Intellectual Property', p: 'All content, designs, and materials are the intellectual property of AceNursing and are protected by copyright law.' },
      { h: 'Limitation of Liability', p: 'AceNursing materials are study aids and do not constitute medical or professional advice. We are not liable for exam outcomes or clinical decisions made based on our content.' },
      { h: 'Changes to Terms', p: 'We reserve the right to update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.' },
    ],
  },
  'about': {
    title: 'About AceNursing',
    content: [
      { h: 'Our Mission', p: 'AceNursing was founded by a team of registered nurses and nurse educators with a single mission: to make high-quality nursing study materials accessible and affordable for every student.' },
      { h: 'Who We Are', p: 'Our content team includes experienced RNs, NPs, and nursing faculty with decades of combined clinical and teaching experience across Kenya, the UK, and the US.' },
      { h: 'What We Offer', p: 'From NCLEX prep guides and pharmacology references to clinical checklists and anatomy atlases — all materials are meticulously researched, peer-reviewed, and updated quarterly.' },
      { h: 'Our Impact', p: 'Over 25,000 nursing students have used AceNursing materials, with a reported 98% first-attempt pass rate among our NCLEX prep users.' },
      { h: 'Get in Touch', p: 'We love hearing from our community. Reach us at support@acenursing.com or follow us on social media.' },
    ],
  },
  'blog': {
    title: 'Blog & Study Tips',
    content: [
      { h: '🧠 How to Study for NCLEX in 30 Days', p: 'A structured 30-day study plan covering all 8 client needs categories, with daily goals, practice question targets, and review strategies used by first-time passers.' },
      { h: '💊 Top 50 Drugs Every Nursing Student Must Know', p: 'Master the most commonly tested medications on NCLEX — mechanism of action, nursing considerations, and high-yield mnemonics to make them stick.' },
      { h: '📋 Clinical Skills Checklist: Are You Ready for Practicum?', p: 'A self-assessment guide covering the 20 core clinical competencies nursing students are expected to demonstrate before entering clinical placement.' },
      { h: '⚡ Active Recall vs. Passive Review: What the Research Says', p: 'Why flashcards and practice questions outperform re-reading notes — and how to build an active recall routine that fits your schedule.' },
      { h: '🫀 Understanding Hemodynamic Monitoring for ICU Nurses', p: 'A beginner-friendly breakdown of CVP, PCWP, cardiac output, and how to interpret hemodynamic values at the bedside.' },
    ],
  },
  'careers': {
    title: 'Careers at AceNursing',
    content: [
      { h: 'Join Our Team', p: 'We are a small, passionate team building the best nursing education platform in Africa and beyond. We hire remotely and value expertise, curiosity, and a genuine love for nursing education.' },
      { h: 'Open Roles', p: 'We are currently looking for: Clinical Content Writers (RN/NP required), Frontend Developer (React), and a Customer Support Specialist. All roles are remote-friendly.' },
      { h: 'How to Apply', p: 'Send your CV and a short cover letter to careers@acenursing.com. Tell us which role you are applying for and why you are passionate about nursing education.' },
      { h: 'Our Culture', p: 'We believe in flexible work, continuous learning, and making a real difference in healthcare outcomes. Every team member gets access to all AceNursing materials for free.' },
    ],
  },
  'download-help': {
    title: 'Download Help',
    content: [
      { h: 'Where Are My Downloads?', p: 'After a successful payment, you will receive a confirmation email with secure download links. You can also find all your purchases in your Account page under "My Orders".' },
      { h: 'Link Not Working?', p: 'Download links expire after 30 days. If your link has expired or is not working, email support@acenursing.com with your order number and we will reissue it immediately.' },
      { h: 'File Won\'t Open?', p: 'All files are PDF format. Download a free PDF reader such as Adobe Acrobat Reader or use your browser\'s built-in PDF viewer.' },
      { h: 'Download on Mobile', p: 'On iOS, tap the link and choose "Open in Files" or "Open in Books". On Android, the file will save to your Downloads folder automatically.' },
      { h: 'Still Having Issues?', p: 'Contact us at support@acenursing.com and include your order number, device type, and a description of the problem. We respond within 24 hours.' },
    ],
  },
  'track-order': {
    title: 'Track Your Order',
    content: [
      { h: 'Check Your Order Status', p: 'Log in to your AceNursing account and visit the "My Orders" section to see the status of all your purchases and access your download links.' },
      { h: 'Order Confirmation Email', p: 'A confirmation email is sent to your registered email address immediately after payment. Check your spam/junk folder if you don\'t see it within a few minutes.' },
      { h: 'Payment Pending?', p: 'If your payment shows as pending, it may take up to 15 minutes to process. Do not attempt to pay again. If it remains pending after 30 minutes, contact us.' },
      { h: 'Missing Order?', p: 'If you completed payment but your order does not appear in your account, email support@acenursing.com with your PayPal transaction ID and we will resolve it within 2 hours.' },
    ],
  },
};

export default function PolicyPage() {
  const { slug } = useParams();
  const page = PAGES[slug];

  if (!page) {
    return (
      <div className="container" style={{ padding: '72px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
        <h2 style={{ color: 'var(--navy)', marginBottom: 12 }}>Page Not Found</h2>
        <Link to="/" className="btn btn-gold">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 720, padding: '72px 24px' }}>
      <h1 className="serif" style={{ color: 'var(--navy)', fontSize: 36, marginBottom: 48 }}>{page.title}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {page.content.map((section, i) => (
          <div key={i}>
            <h3 style={{ color: 'var(--navy)', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{section.h}</h3>
            <p style={{ color: 'var(--text)', lineHeight: 1.8, fontSize: 15 }}>{section.p}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Questions? <a href="/contact" style={{ color: 'var(--primary)' }}>Contact our support team</a>.</p>
      </div>
    </div>
  );
}
