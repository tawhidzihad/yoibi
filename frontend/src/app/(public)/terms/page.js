import { LegalLayout, LegalProse, Toc } from "@/shared/layout/LegalLayout";

export const metadata = {
  title: "Terms of Service | YOIBI",
  description:
    "Terms and conditions for using YOIBI — the social platform for tweets, videos, streams, and meet-ups.",
};

const lastUpdated = "September 2026";

const tocItems = [
  { id: "acceptance", label: "Acceptance of Terms" },
  { id: "eligibility", label: "Account Eligibility" },
  { id: "use-of-service", label: "Use of the Service" },
  { id: "your-content", label: "Your Content and License" },
  { id: "intellectual-property", label: "Intellectual Property Rights" },
  { id: "moderation", label: "Content Moderation" },
  {
    id: "disclaimer-limitation",
    label: "Disclaimers and Limitation of Liability",
  },
  { id: "termination", label: "Account Termination" },
  { id: "changes", label: "Changes to Terms" },
];

export default function TermsOfServicePage() {
  return (
    <LegalLayout>
      <article className="max-w-3xl">
        <div className="mb-6">
          <h1
            id="page-title"
            className="text-[28px] font-bold leading-[1.2] tracking-tight text-foreground"
          >
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        </div>

        <Toc items={tocItems} />

        <div className="mt-8">
          <LegalProse>
            <h2 id="acceptance">Acceptance of Terms</h2>
            <p>
              By accessing or using YOIBI (the &quot;Platform&quot;), you agree
              to be bound by these Terms of Service (&quot;Terms&quot;). These
              Terms constitute a legal agreement between you and YOIBI governing
              your use of the service. If you do not agree to these Terms, you
              may not access or use the Platform.
            </p>
            <p>
              By continuing to use the Platform after any changes to these
              Terms, you accept the revised Terms. No separate notice will be
              provided for each modification. The &quot;Last updated&quot; date
              at the top of this page indicates when these Terms were last
              revised.
            </p>

            <h2 id="eligibility">Account Eligibility</h2>
            <p>
              You must be at least 16 years old to create an account or use
              YOIBI. By creating an account or using the Platform, you represent
              and warrant that you are 16 years of age or older. If you are
              under 16, you must not create an account or attempt to access the
              Platform.
            </p>
            <p>
              If we discover that a user is under the age of 16, we will delete
              that account and any data associated with it in accordance with
              our privacy practices and applicable law.
            </p>

            <h2 id="use-of-service">Use of the Service</h2>
            <p>
              You agree to use YOIBI only for lawful purposes and in accordance
              with our Community Values. You agree not to:
            </p>
            <ul>
              <li>Harass, threaten, impersonate, or intimidate other users.</li>
              <li>
                Post or share content that is illegal, fraudulent, or infringing
                on third-party rights.
              </li>
              <li>
                Post hate speech, death threats, or content targeting victims of
                serious crimes.
              </li>
              <li>
                Share deepfakes or other synthetic media created to deceive or
                harm.
              </li>
              <li>
                Spread fake news or demonstrably false information that could
                cause real-world harm.
              </li>
              <li>
                Bully or mock victims of incest, sexual assault, pedophilia, or
                other criminal acts.
              </li>
              <li>Distribute malware, spam, or other harmful objects.</li>
              <li>
                Interfere with or disrupt the security or functionality of the
                Platform.
              </li>
              <li>
                Use any automated system (such as bots) to access the Platform
                without prior written permission.
              </li>
              <li>
                Attempt to gain unauthorized access to any portion of the
                Platform or the accounts of others.
              </li>
            </ul>
            <p>
              Our moderation system actively reviews content submitted by users.
              We reserve the right to remove any content that violates these
              Terms or our Community Values, and we may suspend or terminate
              accounts that engage in prohibited conduct.
            </p>

            <h2 id="your-content">Your Content and License</h2>
            <p>
              <strong>Ownership:</strong> You retain all ownership rights in the
              content you create and post on YOIBI (&quot;Your Content&quot;).
              This includes tweets, videos, live streams, comments, profile
              information, and any other material you submit.
            </p>
            <p>
              <strong>License to YOIBI:</strong> By posting Your Content, you
              grant YOIBI a worldwide, royalty-free, perpetual, irrevocable,
              non-exclusive license to use, reproduce, modify, adapt, publish,
              translate, create derivative works from, distribute, perform, and
              display Your Content (in whole or in part) worldwide and/or to
              incorporate it in other works in any media, format, or technology
              now known or later developed.
            </p>
            <p>
              <strong>Content removal:</strong> You may delete Your Content at
              any time through your account settings. Upon deletion, our license
              to use that specific content ceases, except where necessary for
              backup or archival purposes.
            </p>

            <h2 id="intellectual-property">Intellectual Property Rights</h2>
            <p>
              The YOIBI brand, logo, name, and the Platform&apos;s design, user
              interface, and underlying software code are owned by YOIBI and
              protected by copyright, trademark, and other intellectual property
              laws.
            </p>
            <p>
              All content, features, and functionality on YOIBI, including but
              not limited to software, text, graphics, logos, images, audio
              clips, digital downloads, data compilations, and code, are owned
              by YOIBI or its licensors and protected by intellectual property
              rights.
            </p>
            <p>
              Your use of YOIBI does not grant you any right, title, or interest
              in any intellectual property owned by YOIBI or its licensors.
            </p>

            <h2 id="moderation">Content Moderation</h2>
            <p>
              YOIBI employs automated and human moderation systems to review
              content posted by users. We may:
            </p>
            <ul>
              <li>
                Remove content that violates these Terms or our Community Values
                without prior notice.
              </li>
              <li>
                Suspend or delete accounts that repeatedly violate these Terms.
              </li>
              <li>
                Restrict visibility of certain content to protect other users.
              </li>
            </ul>
            <p>
              We strive to provide clear explanations when we take moderation
              action, but we may not always be able to do so. Our decisions
              regarding content moderation are final and we reserve the right to
              update our moderation policies at any time.
            </p>

            <h2 id="disclaimer-limitation">
              Disclaimers and Limitation of Liability
            </h2>
            <p>
              <strong>AS IS:</strong> THE PLATFORM IS PROVIDED &quot;AS IS&quot;
              AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING
              WITHOUT LIMITATION ANY IMPLIED WARRANTY OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>
            <p>
              <strong>NO GUARANTEES:</strong> WE DO NOT GUARANTEE THAT THE
              PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, THAT
              DEFECTS WILL BE CORRECTED, OR THAT THE PLATFORM WILL BE FREE FROM
              VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>
            <p>
              <strong>LIMITATION OF LIABILITY:</strong> TO THE FULLEST EXTENT
              PERMITTED BY LAW, YOIBI SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY
              LOSS OF DATA, PROFITS, REVENUE, OR BUSINESS INTERRUPTION, ARISING
              OUT OF OR IN CONNECTION WITH YOUR ACCESS TO OR USE OF THE
              PLATFORM, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p>
              In any event, our total liability to you for all claims arising
              out of or related to these Terms or your use of the Platform shall
              exceed the greater of the amount you have paid us in the twelve
              months preceding the claim, or one hundred dollars ($100).
            </p>

            <h2 id="termination">Account Termination</h2>
            <p>
              <strong>By you:</strong> You may delete your account at any time
              through your account settings. Upon account deletion, your profile
              will become inaccessible and we will remove your personal
              information in accordance with our privacy policy. Some aggregated
              or anonymized data may be retained for analytical purposes.
            </p>
            <p>
              <strong>By us:</strong> We may suspend or terminate your account,
              or restrict access to the Platform, at any time, with or without
              cause, with or without notice, and with or without prejudice to
              our rights under the Terms. Reasonable grounds for termination
              include, but are not limited to, violations of these Terms, our
              Community Values, or applicable law.
            </p>
            <p>
              If we terminate your account, you will lose access to all your
              content and account information, and we will not be obligated to
              restore any data.
            </p>

            <h2 id="changes">Changes to Terms</h2>
            <p>
              We may revise these Terms at any time. When we do, we will update
              the &quot;Last updated&quot; date at the top of this page. For
              material changes, we may provide additional notice through the
              Platform or via email if you provide one.
            </p>
            <p>
              Your continued use of the Platform after any changes to the Terms
              constitutes your acceptance of the revised Terms. If you do not
              agree to the revised Terms, you must stop using the Platform.
            </p>
          </LegalProse>
        </div>
      </article>
    </LegalLayout>
  );
}
