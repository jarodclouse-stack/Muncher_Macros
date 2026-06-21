import React from 'react';
import ReactDOM from 'react-dom';
import { X, Shield } from 'lucide-react';

export const PrivacyPolicy: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'var(--theme-panel, #141420)', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'modalSlideUp 0.3s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--theme-border, rgba(255,255,255,0.1))' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--theme-text, #fff)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Shield size={20} /> Privacy Policy
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--theme-text-dim, #888)', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '24px', overflowY: 'auto', fontSize: '13px', lineHeight: 1.7, color: 'var(--theme-text-dim, #aaa)' }}>
          <p style={{ color: 'var(--theme-text, #fff)', fontWeight: 600, marginTop: 0 }}>Last updated: May 2025</p>

          <h3 style={h3Style}>What We Collect</h3>
          <p>When you create an account, we store your email address and the data you enter into the app: food logs, body measurements, custom foods, goals, and settings. Guest users' data is stored only on their device.</p>

          <h3 style={h3Style}>AI-Powered Features & Image Processing</h3>
          <p>Macro Munchers uses Anthropic's Claude AI to analyze photos of nutrition labels, barcodes, ingredients lists, and meal descriptions. When you use these features, your images and text are sent to Anthropic's API for processing. Anthropic's data usage policy applies to this processing. We do not store your images on our servers — they are sent directly to Anthropic for analysis and discarded after processing.</p>

          <h3 style={h3Style}>How We Use Your Data</h3>
          <ul style={ulStyle}>
            <li>To provide nutrition tracking and goal-setting features</li>
            <li>To sync your data across devices (for logged-in users)</li>
            <li>To analyze food photos and labels using AI</li>
          </ul>
          <p>We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>

          <h3 style={h3Style}>Data Storage & Security</h3>
          <p>Your data is stored in Supabase (hosted on AWS). Access is protected by row-level security policies tied to your authenticated account. All connections use HTTPS encryption.</p>

          <h3 style={h3Style}>Third-Party Services</h3>
          <ul style={ulStyle}>
            <li><strong>Supabase</strong> — Authentication and data storage</li>
            <li><strong>Anthropic (Claude AI)</strong> — Image and text analysis for nutrition features</li>
            <li><strong>Open Food Facts</strong> — Product database lookups</li>
          </ul>

          <h3 style={h3Style}>Your Rights</h3>
          <ul style={ulStyle}>
            <li><strong>Export</strong> — Download all your data as JSON from Settings</li>
            <li><strong>Delete</strong> — Permanently delete your account and all data from Settings</li>
            <li><strong>Access</strong> — All your data is visible within the app at all times</li>
          </ul>
          <p>If you are in the EU, you have additional rights under GDPR including data portability and the right to be forgotten, both of which are available through the app's Settings page.</p>

          <h3 style={h3Style}>Cookies & Local Storage</h3>
          <p>We use browser local storage to cache your data for offline access and fast loading. We do not use third-party tracking cookies or analytics.</p>

          <h3 style={h3Style}>Children's Privacy</h3>
          <p>Macro Munchers is not intended for children under 13. We do not knowingly collect data from children under 13.</p>

          <h3 style={h3Style}>Changes to This Policy</h3>
          <p>We may update this policy from time to time. Continued use of the app after changes constitutes acceptance of the updated policy.</p>

          <h3 style={h3Style}>Contact</h3>
          <p style={{ marginBottom: 0 }}>For privacy questions or data requests, contact us at the email address listed on our website.</p>
        </div>
      </div>
      <style>{`
        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
};

const h3Style: React.CSSProperties = { fontSize: '15px', fontWeight: 700, color: 'var(--theme-text, #fff)', marginTop: '20px', marginBottom: '8px' };
const ulStyle: React.CSSProperties = { paddingLeft: '20px', margin: '8px 0' };
