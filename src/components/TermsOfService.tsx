import React from 'react';
import ReactDOM from 'react-dom';
import { X, FileText } from 'lucide-react';

export const TermsOfService: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'var(--theme-panel, #141420)', border: '1px solid var(--theme-border, rgba(255,255,255,0.1))', borderRadius: '20px', width: '100%', maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'modalSlideUp 0.3s ease-out' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--theme-border, rgba(255,255,255,0.1))' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--theme-text, #fff)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <FileText size={20} /> Terms of Service
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--theme-text-dim, #888)', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
        </div>
        <div style={{ padding: '24px', overflowY: 'auto', fontSize: '13px', lineHeight: 1.7, color: 'var(--theme-text-dim, #aaa)' }}>
          <p style={{ color: 'var(--theme-text, #fff)', fontWeight: 600, marginTop: 0 }}>Last updated: May 2025</p>

          <h3 style={h3Style}>Acceptance of Terms</h3>
          <p>By creating an account or using Macro Munchers, you agree to these Terms of Service. If you do not agree, do not use the app.</p>

          <h3 style={h3Style}>Description of Service</h3>
          <p>Macro Munchers is a nutrition tracking application that helps you log food intake, set dietary goals, and monitor your nutrition. The app uses AI-powered features to analyze food photos, nutrition labels, barcodes, and meal descriptions.</p>

          <h3 style={h3Style}>Not Medical Advice</h3>
          <p>Macro Munchers is an informational tool only. It is not a substitute for professional medical advice, diagnosis, or treatment. Nutritional data provided by the app (including AI-generated estimates) may contain inaccuracies. Always consult a qualified healthcare provider before making dietary changes, especially if you have medical conditions, allergies, or dietary restrictions.</p>

          <h3 style={h3Style}>AI-Generated Content</h3>
          <p>Nutritional estimates from AI features (photo analysis, meal descriptions, food search) are approximations and may not be perfectly accurate. You should verify nutritional information for foods critical to your health. The app is not responsible for decisions made based on AI-generated nutritional data.</p>

          <h3 style={h3Style}>Your Account</h3>
          <ul style={ulStyle}>
            <li>You are responsible for maintaining the security of your account credentials</li>
            <li>You must provide accurate information when creating an account</li>
            <li>You may not use the service for any illegal purpose</li>
            <li>You may delete your account and data at any time from Settings</li>
          </ul>

          <h3 style={h3Style}>Acceptable Use</h3>
          <p>You agree not to:</p>
          <ul style={ulStyle}>
            <li>Abuse, overload, or interfere with the service or its infrastructure</li>
            <li>Attempt to access other users' data</li>
            <li>Use automated tools to scrape or bulk-access the service</li>
            <li>Upload harmful, illegal, or inappropriate content</li>
          </ul>

          <h3 style={h3Style}>Intellectual Property</h3>
          <p>The app's design, code, and branding are the property of Macro Munchers. Your food logs and personal data remain yours — you can export or delete them at any time.</p>

          <h3 style={h3Style}>Service Availability</h3>
          <p>We strive to keep the service available but do not guarantee uninterrupted access. We may modify, suspend, or discontinue features at any time. We are not liable for any data loss, though we take reasonable precautions to protect your data.</p>

          <h3 style={h3Style}>Limitation of Liability</h3>
          <p>To the maximum extent permitted by law, Macro Munchers and its creators are not liable for any indirect, incidental, or consequential damages arising from your use of the service, including but not limited to health outcomes based on nutritional data provided by the app.</p>

          <h3 style={h3Style}>Changes to Terms</h3>
          <p>We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the updated terms.</p>

          <h3 style={h3Style}>Contact</h3>
          <p style={{ marginBottom: 0 }}>For questions about these terms, contact us at the email address listed on our website.</p>
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
