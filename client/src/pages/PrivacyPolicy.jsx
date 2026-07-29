// FILE: src/pages/PrivacyPolicy.jsx
function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: "720px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ background: "white", padding: "40px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <h1 style={{ marginTop: 0 }}>Privacy Policy</h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Last updated: {new Date().toLocaleDateString("en-KE", { dateStyle: "long" })}</p>

        <h3>1. What We Collect</h3>
        <p>When you use VibePass, we collect: your name, email address, and phone number (provided at registration); event and ticket purchase history; and, if you're an organizer, event details and any photos or videos you upload.</p>

        <h3>2. How We Use Your Information</h3>
        <p>We use your information to: create and manage your account; process ticket purchases and payments; send you transactional emails and SMS (such as purchase confirmations and password resets); verify tickets at event entry; and moderate event listings for safety and quality.</p>

        <h3>3. Third-Party Services</h3>
        <p>We share limited data with trusted third-party services required to operate the platform:</p>
        <ul>
          <li><b>Safaricom M-Pesa</b> — to process payments. We do not see or store your M-Pesa PIN.</li>
          <li><b>Cloudinary</b> — to host photos and videos uploaded for event listings.</li>
          <li><b>Resend</b> — to deliver transactional emails (purchase confirmations, password resets).</li>
          <li><b>Africa's Talking</b> — to deliver SMS notifications.</li>
        </ul>
        <p>These providers only receive the information necessary to perform their specific function and are not permitted to use your data for their own purposes.</p>

        <h3>4. Data Storage</h3>
        <p>Your data is stored in a secure database hosted via our infrastructure providers. Passwords are never stored in plain text — they are cryptographically hashed. We apply reasonable technical safeguards, including rate limiting and access controls, to protect your information.</p>

        <h3>5. Your Rights</h3>
        <p>You may request access to, correction of, or deletion of your personal data by contacting us through the platform's support channels. Note that deleting your account will also remove your associated event listings (if you are an organizer) and ticket history.</p>

        <h3>6. Data Retention</h3>
        <p>We retain your information for as long as your account is active, or as needed to comply with legal obligations, resolve disputes, and enforce our agreements.</p>

        <h3>7. Children's Privacy</h3>
        <p>VibePass is not directed at children under 18. We do not knowingly collect personal information from children.</p>

        <h3>8. Changes to This Policy</h3>
        <p>We may update this Privacy Policy from time to time. Material changes will be reflected by an updated "Last updated" date above.</p>

        <h3>9. Contact</h3>
        <p>Questions about this Privacy Policy or your data can be directed to our support channels listed on the platform.</p>
      </div>
    </div>
  );
}

export default PrivacyPolicy;