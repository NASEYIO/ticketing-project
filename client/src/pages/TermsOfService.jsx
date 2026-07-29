// FILE: src/pages/TermsOfService.jsx
function TermsOfService() {
  return (
    <div style={{ maxWidth: "720px", margin: "40px auto", padding: "0 20px" }}>
      <div style={{ background: "white", padding: "40px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
        <h1 style={{ marginTop: 0 }}>Terms of Service</h1>
        <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Last updated: {new Date().toLocaleDateString("en-KE", { dateStyle: "long" })}</p>

        <h3>1. Overview</h3>
        <p>VibePass ("we", "us", "the platform") is a ticketing marketplace that connects event organizers with buyers across East Africa. By creating an account or using VibePass, you agree to these Terms of Service.</p>

        <h3>2. Accounts</h3>
        <p>You must provide accurate information when registering, including a valid email and phone number. You are responsible for keeping your login credentials secure and for any activity that happens under your account.</p>

        <h3>3. Buyers</h3>
        <p>When you purchase a ticket through VibePass, you receive a digital ticket tied to your account, verifiable via a unique code and QR code. Tickets are only guaranteed genuine when purchased directly through VibePass. We are not responsible for tickets purchased through unofficial third parties, social media resellers, or any channel outside the platform.</p>

        <h3>4. Organizers</h3>
        <p>Organizers are solely responsible for the accuracy of their event listings, the legality of their events, and fulfilling the event as described. VibePass moderates event listings before publication but does not guarantee the quality, safety, or occurrence of any event. Organizers are responsible for honoring valid tickets at the point of entry.</p>

        <h3>5. Payments</h3>
        <p>Payments are processed via M-Pesa. VibePass is not a bank and does not store your M-Pesa PIN or full payment credentials. Ticket prices are set by organizers; VibePass may apply a service fee, disclosed at checkout where applicable.</p>

        <h3>6. Refunds</h3>
        <p>Refund eligibility is determined by the event organizer's stated policy for that event, unless an event is cancelled or materially misrepresented, in which case VibePass will work with the organizer to facilitate a resolution. Refund requests should be directed to the organizer in the first instance.</p>

        <h3>7. Ticket Transfers</h3>
        <p>VibePass allows ticket holders to transfer a ticket to another person's account via the platform's official transfer feature. Transfers made outside the platform (e.g. sharing entry codes directly) are done at the sender's own risk and are not protected by VibePass.</p>

        <h3>8. Prohibited Conduct</h3>
        <p>You agree not to: create fraudulent events or tickets; attempt to resell tickets outside the platform in a misleading manner; interfere with the platform's security or infrastructure; or use the platform for any unlawful purpose.</p>

        <h3>9. Limitation of Liability</h3>
        <p>VibePass provides the platform "as is." To the fullest extent permitted by law, VibePass is not liable for indirect, incidental, or consequential damages arising from your use of the platform, including losses related to event cancellations, organizer conduct, or third-party fraud outside the platform.</p>

        <h3>10. Changes to These Terms</h3>
        <p>We may update these Terms from time to time. Continued use of VibePass after changes take effect constitutes acceptance of the revised Terms.</p>

        <h3>11. Governing Law</h3>
        <p>These Terms are governed by the laws of Kenya.</p>

        <h3>12. Contact</h3>
        <p>Questions about these Terms can be directed to our support channels listed on the platform.</p>
      </div>
    </div>
  );
}

export default TermsOfService;