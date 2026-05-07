import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Pearl",
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "system-ui, sans-serif", color: "#1a1a2e" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Privacy Policy</h1>
      <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: "2rem" }}>Last updated: May 7, 2026</p>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.5rem" }}>1. What We Collect</h2>
      <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444" }}>Pearl collects the following data to provide the period tracking service:</p>
      <ul style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444", paddingLeft: "1.5rem" }}>
        <li>Email address (via Google sign-in)</li>
        <li>Period start and end dates</li>
        <li>Daily symptoms (mood, energy, pain, other symptoms)</li>
        <li>Partner email (if you choose to enable partner notifications)</li>
        <li>Push notification tokens (for reminders)</li>
      </ul>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.5rem" }}>2. How We Use Your Data</h2>
      <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444" }}>Your data is used exclusively to:</p>
      <ul style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444", paddingLeft: "1.5rem" }}>
        <li>Predict your cycle phases and provide personalized insights</li>
        <li>Send you push notifications about upcoming or late periods</li>
        <li>Send phase change emails to your partner (only if you enable this)</li>
        <li>Display your cycle statistics and history</li>
      </ul>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.5rem" }}>3. Data Sharing</h2>
      <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444" }}>We do not sell, rent, or share your personal or health data with any third parties. Your partner only receives phase information if you explicitly enable partner notifications.</p>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.5rem" }}>4. Data Storage & Security</h2>
      <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444" }}>Your data is stored securely on Supabase (hosted in the EU). All data is encrypted in transit via HTTPS. Access is restricted to your authenticated account only.</p>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.5rem" }}>5. Data Deletion</h2>
      <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444" }}>You can delete your account and all associated data at any time from the app settings. You can also contact us at francisco.cucullu@gmail.com to request data deletion. Data is permanently removed within 30 days of a deletion request.</p>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.5rem" }}>6. Not Medical Advice</h2>
      <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444" }}>Pearl is a wellness tool, not a medical device. Cycle predictions and insights are estimates based on your logged data and should not be used as medical advice or for contraception.</p>

      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.5rem" }}>7. Contact</h2>
      <p style={{ lineHeight: 1.7, fontSize: "0.95rem", color: "#444" }}>For questions about this privacy policy or your data, contact: <a href="mailto:francisco.cucullu@gmail.com" style={{ color: "#D4A0A0" }}>francisco.cucullu@gmail.com</a></p>
    </div>
  );
}
