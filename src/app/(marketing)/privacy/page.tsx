export default function PrivacyPage() {
  return (
    <div className="prose prose-sm max-w-none py-8">
      <h1>Privacy Policy</h1>
      <p><strong>Last updated:</strong> July 2026</p>

      <h2>1. Controller</h2>
      <p>PocketCoach EU is operated by Tiago Camargo Lima, Casimiro de Abreu, RJ, Brazil. Contact: pocketcoach.eu@gmail.com</p>

      <h2>2. Data We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> email address (for authentication via magic link)</li>
        <li><strong>Usage data:</strong> habits created, completion timestamps, streaks, XP, reflections, guild memberships</li>
        <li><strong>Payment data:</strong> processed by Lemon Squeezy (Merchant of Record) — we do NOT store credit card numbers</li>
      </ul>

      <h2>3. Purpose & Legal Basis</h2>
      <ul>
        <li>Providing the habit tracking service (GDPR Art. 6(1)(b) — contract performance)</li>
        <li>Analytics via Umami (GDPR Art. 6(1)(f) — legitimate interest; no cookies, no personal data)</li>
      </ul>

      <h2>4. Data Recipients</h2>
      <ul>
        <li><strong>Supabase Inc.</strong> (database hosting, EU region eu-west-1)</li>
        <li><strong>Lemon Squeezy / Lemonsqueezy Inc.</strong> (payment processing, Merchant of Record)</li>
        <li><strong>Vercel Inc.</strong> (hosting, CDN)</li>
      </ul>

      <h2>5. Data Retention</h2>
      <p>We retain your data for as long as your account is active. You can delete your account and all data at any time via Settings &gt; Delete Account.</p>

      <h2>6. Your Rights (GDPR)</h2>
      <ul>
        <li><strong>Access (Art. 15):</strong> View your data in the app or export via Settings</li>
        <li><strong>Portability (Art. 20):</strong> Export all your data as JSON via Settings &gt; Export Data</li>
        <li><strong>Erasure (Art. 17):</strong> Delete your account and all data via Settings &gt; Delete Account</li>
        <li><strong>Rectification (Art. 16):</strong> Edit your profile data at any time</li>
        <li><strong>Object (Art. 21):</strong> Contact us to object to processing</li>
      </ul>

      <h2>7. Cookies</h2>
      <p>We use only <strong>essential cookies</strong> for authentication (Supabase session). Our analytics tool (Umami) does NOT use cookies. No consent banner is required.</p>

      <h2>8. Children</h2>
      <p>PocketCoach EU is intended for users aged 16 and older (GDPR Art. 8). We do not knowingly collect data from children under 16.</p>

      <h2>9. Data Hosting</h2>
      <p>All user data is stored in the European Union (AWS eu-west-1 via Supabase). No data transfers outside the EU/EEA for primary processing.</p>

      <h2>10. Contact & Supervisory Authority</h2>
      <p>For privacy inquiries: pocketcoach.eu@gmail.com</p>
      <p>You have the right to lodge a complaint with your local data protection authority.</p>
    </div>
  )
}
