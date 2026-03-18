import { useState } from 'react';
import useSEO from '../hooks/useSEO';

const FAQS = [
  { q: 'How do I download my purchase?', a: 'After payment is confirmed you will receive an email with a secure download link. You can also access all your downloads from your Account page under "My Orders".' },
  { q: 'How long are download links valid?', a: 'Download links are valid for 30 days from the date of purchase. If your link expires, contact support and we will reissue it at no charge.' },
  { q: 'What file format are the materials?', a: 'All materials are delivered as high-quality PDF files, compatible with any device — phone, tablet, or computer.' },
  { q: 'Can I print the materials?', a: 'Yes. All PDFs are print-enabled. We recommend printing on A4 or Letter paper for the best experience.' },
  { q: 'What is your refund policy?', a: 'We offer a 7-day money-back guarantee. If you are not satisfied, contact us within 7 days of purchase and we will issue a full refund.' },
  { q: 'Do you offer student discounts?', a: 'Yes! Subscribe to our newsletter to receive 15% off your first order. We also run seasonal promotions — follow us on social media to stay updated.' },
  { q: 'Are materials updated regularly?', a: 'Yes. All materials are reviewed and updated quarterly to reflect the latest NCLEX test plans and clinical guidelines.' },
  { q: 'Can I share the materials with classmates?', a: 'Materials are licensed for personal use only. Sharing or redistributing them is not permitted under our terms of service.' },
];

export default function FAQPage() {
  const [open, setOpen] = useState(null);

  useSEO({
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions about AceNursing study materials, downloads, refunds, and more.',
    canonical: 'https://acenursing.com/faq',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  });

  return (
    <div className="container" style={{ maxWidth: 720, padding: '72px 24px' }}>
      <h1 className="serif" style={{ color: 'var(--navy)', fontSize: 36, marginBottom: 8 }}>Frequently Asked Questions</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 48 }}>Can't find your answer? <a href="/contact" style={{ color: 'var(--primary)' }}>Contact us</a>.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FAQS.map((item, i) => (
          <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <button onClick={() => setOpen(open === i ? null : i)}
              style={{ width: '100%', textAlign: 'left', padding: '18px 22px', background: open === i ? 'var(--navy)' : '#fff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <span style={{ fontWeight: 600, fontSize: 15, color: open === i ? '#fff' : 'var(--navy)' }}>{item.q}</span>
              <span style={{ fontSize: 20, color: open === i ? '#C49A3C' : 'var(--muted)', flexShrink: 0 }}>{open === i ? '−' : '+'}</span>
            </button>
            {open === i && (
              <div style={{ padding: '16px 22px', background: 'var(--gray)', fontSize: 14, lineHeight: 1.75, color: 'var(--text)' }}>{item.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
