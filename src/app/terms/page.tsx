import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — Pearl",
};

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "system-ui, sans-serif", color: "#1a1a2e" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Terms & Conditions</h1>
      <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: "2rem" }}>Last updated: May 17, 2026</p>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.5rem" }}>1. Acceptance</h2>
      <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444" }}>By using Pearl, you agree to these terms. If you do not agree, please do not use the app.</p>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.5rem" }}>2. Service Description</h2>
      <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444" }}>Pearl is a period and cycle tracking app that predicts menstrual phases, provides daily recommendations, and optionally notifies your partner about phase changes. Pearl is available as a Progressive Web App and as a native Android app.</p>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.5rem" }}>3. Not Medical Advice</h2>
      <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444" }}>Pearl is a wellness tool, not a medical device. Cycle predictions are estimates based on your logged data. Do not use Pearl as a substitute for professional medical advice, diagnosis, or treatment. Do not rely on Pearl for contraception or fertility planning without consulting a healthcare provider.</p>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.5rem" }}>4. User Accounts</h2>
      <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444" }}>You must sign in with a Google account to use Pearl. You are responsible for maintaining the security of your account. You may delete your account and all associated data at any time from the app settings.</p>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.5rem" }}>5. Partner Notifications</h2>
      <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444" }}>If you enable partner notifications, Pearl will send emails to the address you provide when you enter a new cycle phase. You are responsible for obtaining consent from the person whose email you enter. You can disable this feature at any time.</p>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.5rem" }}>6. Privacy</h2>
      <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444" }}>Your use of Pearl is also governed by our <a href="/privacy" style={{ color: "#D4A0A0" }}>Privacy Policy</a>. We do not sell or share your health data with third parties.</p>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.5rem" }}>7. Limitation of Liability</h2>
      <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444" }}>Pearl is provided "as is" without warranties of any kind. We are not liable for any damages arising from the use of the app, including but not limited to inaccurate predictions or data loss.</p>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.5rem" }}>8. Changes</h2>
      <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444" }}>We may update these terms from time to time. Continued use of Pearl after changes constitutes acceptance of the updated terms.</p>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.5rem" }}>9. Contact</h2>
      <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444" }}>For questions, contact: <a href="mailto:francisco.cucullu@gmail.com" style={{ color: "#D4A0A0" }}>francisco.cucullu@gmail.com</a></p>
    </div>
  );
}
