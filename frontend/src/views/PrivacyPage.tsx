/**
 * Privacy Policy Page
 */
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">
          Last updated: {new Date().toLocaleDateString('en-US')}
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              ShipHours values the privacy of its users. This Privacy Policy explains how we
              collect, use, store, and protect your personal information when you use our
              time tracking service for software engineers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect the following types of information:
            </p>

            <h3 className="text-lg font-medium mt-4 mb-2">2.1 Account Information</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Name and email address (when you create an account)</li>
              <li>Profile photo (if provided via social login)</li>
              <li>Account preferences and settings</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">2.2 Work Session Data</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Logged work sessions (date, task, project, duration)</li>
              <li>Weekly goals you have set</li>
              <li>Activity history and progress</li>
            </ul>

            <h3 className="text-lg font-medium mt-4 mb-2">2.3 Technical Data</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>IP address and browser type</li>
              <li>Operating system and device type</li>
              <li>Pages visited and usage time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>Provide and maintain the ShipHours service</li>
              <li>Personalize your experience and display your progress</li>
              <li>Generate statistics and work session dashboards</li>
              <li>Send notifications about your goals (if enabled)</li>
              <li>Improve our service and develop new features</li>
              <li>Communicate important service updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Storage and Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored on secure servers. We implement technical and organizational
              security measures to protect your information against unauthorized access,
              alteration, disclosure, or destruction. This includes:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>Data encryption in transit (HTTPS)</li>
              <li>Passwords stored with secure hashing</li>
              <li>Restricted access to user data</li>
              <li>Regular data backups</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell, rent, or share your personal information with third parties
              for marketing purposes. We may share data only in the following situations:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and security</li>
              <li>With service providers who assist us (hosting, analytics)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the following rights regarding your data:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Export your data in a readable format</li>
              <li><strong>Restriction:</strong> Limit the processing of your data</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              To exercise these rights, visit your account settings or contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Cookies and Similar Technologies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-muted-foreground">
              <li>Keep you signed in to your account</li>
              <li>Remember your preferences (theme, settings)</li>
              <li>Understand how you use the service</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              You can configure your browser to refuse cookies, but this may affect
              the functionality of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data while your account is active or as needed to provide
              the service. If you delete your account, we will remove your personal data
              within 30 days, except where retention is required for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Minors</h2>
            <p className="text-muted-foreground leading-relaxed">
              ShipHours is not directed at children under 13 years of age. We do not
              intentionally collect information from children. If you are a parent or
              guardian and believe your child has provided us with information, please
              contact us so we can remove that data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy periodically. We will notify you of
              significant changes through the application or by email. We recommend
              reviewing this page regularly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy or how we handle your data,
              please contact us through the application settings.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link
            to="/terms"
            className="text-primary hover:underline"
          >
            View Terms of Use
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;
