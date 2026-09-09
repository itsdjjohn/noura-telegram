export const metadata = {
  title: "Privacy Policy | NOURA",
  description: "Privacy Policy for NOURA",
};

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 80px", lineHeight: 1.65 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase", opacity: .6 }}>NOURA</div>
        <h1 style={{ fontSize: 40, margin: "8px 0 10px" }}>Privacy Policy</h1>
        <p style={{ opacity: .7 }}>Last updated: September 9, 2026</p>
      </div>

      <p>
        NOURA is a personal nutrition and performance application that may connect to third-party services such as WHOOP and Telegram. This Privacy Policy explains what information may be accessed, how it is used, and how it is protected.
      </p>

      <h2>Information we may process</h2>
      <p>
        Depending on the features you choose to use, NOURA may process information you enter directly, such as meals, water intake, nutrition goals, body measurements, and preferences. If you connect WHOOP, NOURA may access authorized WHOOP data such as recovery, sleep, strain, workouts, heart-rate-related metrics, profile information, and body measurements according to the permissions you approve.
      </p>

      <h2>How information is used</h2>
      <p>
        Information is used only to provide NOURA features, including nutrition tracking, performance summaries, personalized recommendations, and integrations you explicitly enable. NOURA does not sell personal information or health-related data.
      </p>

      <h2>WHOOP data</h2>
      <p>
        WHOOP data is accessed only after you authorize the connection through WHOOP OAuth. Access is limited to the scopes you approve. You may disconnect WHOOP from NOURA at any time.
      </p>

      <h2>Telegram</h2>
      <p>
        If you access NOURA through Telegram, basic Telegram account information made available to the Mini App may be used to personalize your experience and to enable bot interactions and notifications.
      </p>

      <h2>Storage and security</h2>
      <p>
        This beta version may store nutrition data locally on your device. Authentication credentials and integration secrets are handled server-side and are not intentionally exposed to the client. Reasonable technical measures are used to protect connected-service tokens and application data.
      </p>

      <h2>Data sharing</h2>
      <p>
        Personal information is not sold. Data may be transmitted to service providers that are necessary to operate the application, such as WHOOP, Telegram, and hosting infrastructure, only as needed to provide the requested features.
      </p>

      <h2>Data retention and deletion</h2>
      <p>
        You may disconnect connected services at any time. Locally stored beta data can be cleared from within the application or by clearing the application data on your device. Additional deletion controls may be introduced as the product evolves.
      </p>

      <h2>Your choices</h2>
      <p>
        You control whether to connect WHOOP and which permissions to approve. You may revoke access through WHOOP or disconnect the integration from NOURA.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        This Privacy Policy may be updated as NOURA changes. The latest version will remain available at this URL.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy questions regarding NOURA, contact the application owner through the official NOURA Telegram bot or project communication channel.
      </p>

      <p style={{ marginTop: 40, opacity: .6, fontSize: 14 }}>
        NOURA is an independent application and is not affiliated with or endorsed by WHOOP unless explicitly stated otherwise.
      </p>
    </main>
  );
}
