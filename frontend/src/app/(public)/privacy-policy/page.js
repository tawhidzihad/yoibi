import { LegalLayout, LegalProse, Toc } from "@/shared/layout/LegalLayout";

export const metadata = {
  title: "Privacy Policy | YOIBI",
  description:
    "How we collect, use, and protect your data on YOIBI — the social platform for tweets, videos, and meet-ups.",
};

const lastUpdated = "September 2026";

const tocItems = [
  { id: "intro", label: "Introduction" },
  { id: "information-we-collect", label: "Information we collect" },
  { id: "how-we-use-your-information", label: "How we use your information" },
  { id: "information-sharing", label: "Information sharing and disclosure" },
  { id: "data-storage-security", label: "Data storage and security" },
  { id: "your-rights", label: "Your rights and choices" },
  { id: "cookies-and-tracking", label: "Cookies and tracking technologies" },
  { id: "children-privacy", label: "Children's privacy" },
  { id: "data-retention", label: "Data retention" },
  { id: "international-transfers", label: "International data transfers" },
  { id: "changes-to-this-policy", label: "Changes to this policy" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout>
      <article className="max-w-3xl">
        <div className="mb-6">
          <h1
            id="page-title"
            className="text-[28px] font-bold leading-[1.2] tracking-tight text-foreground"
          >
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        <Toc items={tocItems} />

        <div className="mt-8">
          <LegalProse>
            <h2 id="intro">Introduction</h2>
            <p>
              YOIBI (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a
              social media platform for tweets, videos, and
              meet-up rooms. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our platform
              at <a href="https://www.yoibi.com">www.yoibi.com</a>.
            </p>

            <h2 id="information-we-collect">Information we collect</h2>
            <p>
              You provide some information directly to us when you create an
              account, which includes:
            </p>
            <ul>
              <li>
                <strong>Account information:</strong> your name, email address,
                username (handle), and optional profile details such as bio,
                country, age, and phone number.
              </li>
              <li>
                <strong>Content you create:</strong> your tweets, replies,
                videos, and meet-up room details.
              </li>
              <li>
                <strong>Media you upload:</strong> images, video files, and
                thumbnails.
              </li>
            </ul>

            <p>We also collect information automatically when you use YOIBI:</p>
            <ul>
              <li>
                <strong>Usage data:</strong> how you interact with the platform,
                including the content you view, create, engage with, and share.
              </li>
              <li>
                <strong>Device and connection data:</strong> IP address, browser
                type, operating system, mobile carrier, and device identifiers.
              </li>
              <li>
                <strong>Log data:</strong> actions you take on the platform,
                error reports, and crash data.
              </li>
            </ul>

            <p>
              <strong>Information from third parties:</strong> When you sign in
              with Google, we receive your Google profile information (name,
              email, profile picture) as configured in our authentication
              provider.
            </p>

            <h2 id="how-we-use-your-information">
              How we use your information
            </h2>
            <p>We use the information we collect for various purposes:</p>
            <ul>
              <li>
                <strong>Account creation and management:</strong> to create and
                maintain your account, authenticate you, and provide
                personalized experiences.
              </li>
              <li>
                <strong>Content delivery:</strong> to store, display, and
                distribute the tweets, videos, and meet-up rooms you
                create.
              </li>
              <li>
                <strong>Communication:</strong> to send you important
                notifications, security alerts, and to contact you about updates
                to our service or this Privacy Policy.
              </li>
              <li>
                <strong>Moderation and safety:</strong> to enforce our Community
                Values, detect and remove prohibited content, and prevent spam
                or abuse.
              </li>
              <li>
                <strong>Analytics and improvement:</strong> to understand how
                the platform is used and to improve our services.
              </li>
              <li>
                <strong>Customer support:</strong> to respond to your questions
                and provide assistance.
              </li>
            </ul>

            <h2 id="information-sharing">Information sharing and disclosure</h2>
            <p>
              We do not sell your personal information. We share your
              information only in the following circumstances:
            </p>
            <ul>
              <li>
                <strong>With your consent:</strong> when you expressly authorize
                us to share it.
              </li>
              <li>
                <strong>To protect rights and property:</strong> in connection
                with efforts to protect the safety, security, or rights of
                YOIBI, our community, or others.
              </li>
              <li>
                <strong>Legal compliance:</strong> if required by law, subpoena,
                or court order, or to prevent fraud, harm, or criminal activity.
              </li>
            </ul>

            <p>
              <strong>Service providers:</strong> We use third-party service
              providers to help us operate YOIBI:
            </p>
            <ul>
              <li>
                <strong>Media hosting:</strong> We use Cloudinary to store and
                serve video files, images, and thumbnails. Your media files are
                stored on Cloudinary&apos;s secure servers.
              </li>
              <li>
                <strong>Email delivery:</strong> We use Resend to send you
                verification emails and important notifications.
              </li>
              <li>
                <strong>Realtime audio/video infrastructure:</strong> We use LiveKit
                for WebRTC-based meet-up rooms.
              </li>
              <li>
                <strong>Database storage:</strong> We use MongoDB Atlas for
                persistent data storage.
              </li>
            </ul>

            <h2 id="data-storage-security">Data storage and security</h2>
            <p>
              <strong>Your data location:</strong> Your information is stored on
              MongoDB Atlas, a managed cloud database service. The exact
              location of the database servers is determined by MongoDB&apos;s
              infrastructure.
            </p>
            <p>
              <strong>Security measures:</strong> We implement appropriate
              technical and organizational measures to protect your information,
              including:
            </p>
            <ul>
              <li>
                Secure server-side authentication using Better Auth with JWT
                verification against JSON Web Key Sets (JWKS).
              </li>
              <li>
                Rate limiting to prevent abuse and unauthorized access attempts.
              </li>
              <li>
                Encrypted transmission of data between your device and our
                servers.
              </li>
              <li>
                Server-side validation and sanitization of all user-submitted
                content.
              </li>
            </ul>

            <h2 id="your-rights">Your rights and choices</h2>
            <p>You have the following rights regarding your information:</p>
            <ul>
              <li>
                <strong>Access:</strong> You can request a copy of the personal
                data we hold about you.
              </li>
              <li>
                <strong>Correction:</strong> You can update your profile
                information at any time through your account settings.
              </li>
              <li>
                <strong>Deletion:</strong> You can request deletion of your
                account and associated personal data. Learn more in our Terms of
                Service under &quot;Account Termination&quot;.
              </li>
              <li>
                <strong>Objection:</strong> You can object to certain processing
                activities, such as marketing communications.
              </li>
            </ul>

            <h2 id="cookies-and-tracking">Cookies and tracking technologies</h2>
            <p>
              <strong>Rationale:</strong> We use essential cookies and similar
              tracking technologies to recognize your browser or device and to
              enhance your experience on YOIBI. These are strictly necessary for
              the platform to function.
            </p>
            <p>The technologies we use include:</p>
            <ul>
              <li>
                <strong>Cookies and similar technologies:</strong> We use
                cookies and comparable technologies (such as pixels, beacons,
                and local storage) to remember your preferences, keep you signed
                in, and recognize when you return to YOIBI.
              </li>
              <li>
                <strong>Analytics cookies:</strong> We use analytics to
                understand how the platform is used. This helps us improve our
                service.
              </li>
            </ul>
            <p>
              <strong>Your choices:</strong> You can manage your cookie
              preferences through your browser settings. Most browsers allow you
              to refuse cookies or alert you when they are being set. However,
              if you do this, some parts of YOIBI may not work properly.
            </p>

            <h2 id="children-privacy">Children&apos;s privacy</h2>
            <p>
              YOIBI is not intended for users under the age of 16. We do not
              knowingly collect personal information from children under 16. If
              we become aware that a child under 16 has provided us with
              personal information, we will take steps to delete such
              information in accordance with applicable law.
            </p>

            <h2 id="data-retention">Data retention</h2>
            <p>
              We retain your information for as long as necessary to provide our
              services and as required by law. Specifically:
            </p>
            <ul>
              <li>
                <strong>Account data:</strong> Retained while your account is
                active.
              </li>
              <li>
                <strong>Content:</strong> Tweets, videos, and other content you
                create are retained until you delete them or your account is
                deleted.
              </li>
              <li>
                <strong>Usage logs:</strong> Retained for a reasonable period to
                understand platform usage and troubleshoot issues.
              </li>
              <li>
                <strong>Backup copies:</strong> May be retained for disaster
                recovery purposes but are secured and access-controlled.
              </li>
            </ul>
            <p>
              When you delete your account, we purge your personal information
              in accordance with our data deletion procedures, though some
              residual data may remain in backup systems for a limited period.
            </p>

            <h2 id="international-transfers">International data transfers</h2>
            <p>
              Your information may be transferred to, stored, and processed in
              countries outside your own. We use Cloudinary, MongoDB&apos;s
              global infrastructure, and other third-party services that operate
              globally. We take appropriate safeguards to protect your
              information in accordance with applicable data protection laws,
              including standard contractual clauses approved by relevant
              authorities.
            </p>

            <h2 id="changes-to-this-policy">Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do,
              we will revise the &quot;Last updated&quot; date at the top of
              this page. For material changes, we will provide a more prominent
              notice (such as posting a notice on our website or sending a
              notice to the email address you have provided).
            </p>
            <p>
              We encourage you to review this Privacy Policy periodically to
              stay informed about how we collect, use, and share your
              information.
            </p>
          </LegalProse>
        </div>
      </article>
    </LegalLayout>
  );
}
