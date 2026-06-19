/**
 * Author: Yzrel Jade B. Eborde
 */

import { X, Shield, FileText, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface DataPrivacyModalProps {
  onAgree: () => void;
  onDecline: () => void;
}

export function DataPrivacyModal({ onAgree, onDecline }: DataPrivacyModalProps) {
  const [scrolled, setScrolled] = useState(false);
  const [checked, setChecked] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolled(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-[#0C2461] text-white px-6 py-4 rounded-t-2xl flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-base">Data Privacy Agreement</h2>
            <p className="text-white/60 text-xs">Republic Act No. 10173 — Data Privacy Act of 2012</p>
          </div>
        </div>

        {/* Scroll indicator */}
        {!scrolled && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 flex items-center gap-2 text-xs text-amber-700 shrink-0">
            <ChevronDown className="w-3.5 h-3.5 animate-bounce shrink-0" />
            Please scroll down to read the entire agreement before proceeding.
          </div>
        )}

        {/* Content */}
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4 text-sm text-gray-700 space-y-4 leading-relaxed"
        >
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-[#0C2461] shrink-0" />
            <p className="font-bold text-[#0C2461]">DOST aiSETUP — Privacy Notice and Consent Form</p>
          </div>

          <p>
            The <strong>Department of Science and Technology (DOST)</strong> is committed to protecting
            your personal information in accordance with <strong>Republic Act No. 10173</strong>, otherwise
            known as the Data Privacy Act of 2012, and its Implementing Rules and Regulations.
          </p>

          <section>
            <h3 className="font-bold text-gray-800 mb-1">1. Purpose of Data Collection</h3>
            <p>
              We collect your personal and enterprise information solely for the purpose of processing
              your application under the <strong>Small Enterprise Technology Upgrading Program (SETUP)</strong>.
              This includes evaluating your eligibility, conducting technology needs assessments, processing
              financial assistance, and monitoring program compliance.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-1">2. Types of Personal Data Collected</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Full name, birthday, gender, civil status</li>
              <li>Government IDs and PWD status (if applicable)</li>
              <li>Contact details: email address and mobile number</li>
              <li>Biometric data: selfie/facial image for identity verification</li>
              <li>Enterprise information: company name, address, TIN, DTI/SEC/CDA registration</li>
              <li>Financial records related to the SETUP application</li>
              <li>Documents uploaded during the application process</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-1">3. Facial Recognition Consent</h3>
            <p className="text-red-700 font-medium">
              By proceeding, you expressly consent to the collection and processing of your biometric data
              (facial image) for identity verification purposes only. This data will be securely stored
              and will not be shared with third parties without your consent, except as required by law.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-1">4. Data Sharing</h3>
            <p>
              Your data may be shared with authorized DOST regional and provincial offices, partner
              government agencies (DTI, BIR, LandBank of the Philippines), and accredited technology
              providers solely for program implementation purposes. We do not sell or trade your personal
              information to third parties.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-1">5. Data Retention</h3>
            <p>
              Personal data collected through this system will be retained for a period of <strong>10 years</strong>
              from the completion or termination of your SETUP application, in compliance with government
              records management policies, after which it will be securely disposed of.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-1">6. Your Rights as a Data Subject</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li><strong>Right to be informed</strong> — about how your data is used</li>
              <li><strong>Right to access</strong> — your personal data held by DOST</li>
              <li><strong>Right to rectification</strong> — to correct inaccurate data</li>
              <li><strong>Right to erasure</strong> — subject to legal limitations</li>
              <li><strong>Right to object</strong> — to processing of your data</li>
              <li><strong>Right to data portability</strong> — to obtain your data in a readable format</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-1">7. Security Measures</h3>
            <p>
              DOST implements appropriate organizational, physical, and technical security measures to
              protect your personal data against unauthorized access, disclosure, alteration, or
              destruction. All data transmissions are encrypted using industry-standard protocols.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-gray-800 mb-1">8. Contact Information</h3>
            <p>
              For concerns regarding your personal data, you may contact our Data Protection Officer at:
              <br /><strong>dpo@dost.gov.ph</strong> or call <strong>(02) 8837-2071 to 82</strong>.
              <br />You may also file a complaint with the <strong>National Privacy Commission (NPC)</strong> at
              complaints@privacy.gov.ph.
            </p>
          </section>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2">
            <p className="text-xs text-blue-700">
              By clicking <strong>"I Agree"</strong> below, you confirm that you have read, understood,
              and voluntarily consent to the collection, use, and processing of your personal and
              biometric data by the Department of Science and Technology for SETUP program purposes,
              in accordance with RA 10173.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl shrink-0 space-y-3">
          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              disabled={!scrolled}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#0C2461] cursor-pointer disabled:opacity-40"
            />
            <span className="text-xs text-gray-600">
              I have read and understood the Data Privacy Agreement. I voluntarily consent to the
              collection and processing of my personal and biometric data by DOST for SETUP program purposes.
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onDecline}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              I Decline
            </button>
            <button
              onClick={onAgree}
              disabled={!scrolled || !checked}
              className="flex-1 py-2.5 rounded-xl bg-[#0C2461] text-white text-sm font-bold hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              I Agree & Continue
            </button>
          </div>

          {!scrolled && (
            <p className="text-center text-[10px] text-gray-400">
              You must scroll through the entire agreement to enable the checkbox.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
