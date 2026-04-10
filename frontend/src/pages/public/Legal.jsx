import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Legal = () => {
  const { hash } = useLocation();

  useEffect(() => {
    // If the URL has a hash like #privacy or #terms, scroll to it automatically
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <div className="bg-background min-h-screen py-24 px-6 relative">
      <div className="max-w-4xl mx-auto space-y-16 animate-in slide-in-from-bottom-8 duration-700">
        
        {/* Privacy Policy Section */}
        <section id="privacy" className="bg-surface p-10 rounded-3xl border border-border/50 shadow-xl">
          <h2 className="text-3xl font-bold text-textPrimary border-b border-border/50 pb-4 mb-6">Privacy Policy</h2>
          <div className="space-y-4 text-textSecondary leading-relaxed text-justify">
            <p>
              At Smart Campus OS, protecting your personal data is a foundational principle of our operational architecture. We collect, process, and securely store student, faculty, and administrative information purely to facilitate academic tracking, admission workflows, and proactive institutional management. 
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Data Collection:</strong> We uniquely process your academic credentials, portal login metadata, and system usage metrics.</li>
              <li><strong>Encryption Standard:</strong> All transactional payloads and database at-rest storages are natively encrypted using modern cryptographic standards.</li>
              <li><strong>Third-Party Sharing:</strong> We strictly do not sell or lease institutional records to unauthorized commercial entities.</li>
            </ul>
          </div>
        </section>

        {/* Terms of Service Section */}
        <section id="terms" className="bg-surface p-10 rounded-3xl border border-border/50 shadow-xl">
          <h2 className="text-3xl font-bold text-textPrimary border-b border-border/50 pb-4 mb-6">Terms of Service</h2>
          <div className="space-y-4 text-textSecondary leading-relaxed text-justify">
            <p>
              By accessing the Smart Campus OS platform, you agree to be bound by our institutional digital guidelines. This system is provisioned exclusively for authorized university operations, admission processing, and syllabus administration.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Authorized Use:</strong> Access credentials must never be shared; programmatic scraping or manual injection attacks are strictly forbidden.</li>
              <li><strong>Content Integrity:</strong> Users are fully responsible for the factual accuracy of any admission documents or assignments uploaded to the backend.</li>
              <li><strong>Service Availability:</strong> While we guarantee high-availability clustered hosting, scheduled maintenance windows may occasionally limit portal access.</li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Legal;
