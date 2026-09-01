/**
 * Author: Yzrel Jade B. Eborde
 *
 * Official DOST XII letterhead from regional DOST-LETTER-HEADING.docx
 * (header logos + rule; footer contact grid + ISO/PAB strip).
 */

export const DOST_LETTERHEAD_SOCCSKSARGEN =
  "/assets/letterhead/dost-soccsksargen.png";
export const DOST_LETTERHEAD_BAGONG_PILIPINAS =
  "/assets/letterhead/bagong-pilipinas-on-white.png";
export const DOST_LETTERHEAD_ISO_PAB = "/assets/letterhead/iso-pab.png";

export const DOST_LETTERHEAD_POSTAL_LINE1 =
  "DOST XII, PNHLSC, Brgy. Paraiso";
export const DOST_LETTERHEAD_POSTAL_LINE2 = "Koronadal City 9506";
export const DOST_LETTERHEAD_WEBSITE = "https://region12.dost.gov.ph/";
export const DOST_LETTERHEAD_EMAIL = "records@region12.dost.gov.ph";
export const DOST_LETTERHEAD_TEL = "083-826-0114";

interface DostOfficialLetterheadHeaderProps {
  /** Optional form title under the rule (e.g. Approval Letter) */
  formTitle?: string;
}

export function DostOfficialLetterheadHeader({
  formTitle,
}: DostOfficialLetterheadHeaderProps) {
  return (
    <div className="dost-lh-header mb-6">
      <div className="dost-lh-header-row flex items-start justify-between gap-3 sm:gap-4">
        <img
          src={DOST_LETTERHEAD_SOCCSKSARGEN}
          alt="DOST SOCCSKSARGEN"
          className="dost-lh-logo-left h-14 sm:h-16 w-auto max-w-[55%] object-contain object-left"
        />
        <img
          src={DOST_LETTERHEAD_BAGONG_PILIPINAS}
          alt="Bagong Pilipinas"
          className="dost-lh-logo-right h-12 sm:h-14 w-auto max-w-[35%] object-contain object-right"
        />
      </div>
      <div className="dost-lh-rule mt-2 border-t-[1.5px] border-black" />
      {formTitle ? (
        <p className="dost-lh-form-title text-center text-sm font-bold mt-3">
          {formTitle}
        </p>
      ) : null}
    </div>
  );
}

interface DostOfficialLetterheadFooterProps {
  applicationId?: string;
}

export function DostOfficialLetterheadFooter({
  applicationId,
}: DostOfficialLetterheadFooterProps) {
  return (
    <div className="dost-lh-footer mt-10 pt-2 text-[8px] sm:text-[9px] text-gray-800 leading-snug">
      <div className="dost-lh-rule border-t-[1.5px] border-black mb-2" />
      <div className="dost-lh-footer-row flex items-start justify-between gap-3">
        <div className="dost-lh-contact flex-1 min-w-0 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
          <span className="font-semibold whitespace-nowrap">Postal Address:</span>
          <span>
            {DOST_LETTERHEAD_POSTAL_LINE1}
            <br />
            {DOST_LETTERHEAD_POSTAL_LINE2}
          </span>
          <span className="font-semibold">Website:</span>
          <span>{DOST_LETTERHEAD_WEBSITE}</span>
          <span className="font-semibold">Email:</span>
          <span>{DOST_LETTERHEAD_EMAIL}</span>
          <span className="font-semibold">Tel:</span>
          <span>{DOST_LETTERHEAD_TEL}</span>
        </div>
        <img
          src={DOST_LETTERHEAD_ISO_PAB}
          alt="ISO 9001 / PAB"
          className="dost-lh-iso h-10 sm:h-12 w-auto shrink-0 object-contain"
        />
      </div>
      {applicationId ? (
        <p className="dost-lh-app-id mt-2 text-center text-gray-400">
          Application ID: {applicationId}
        </p>
      ) : null}
    </div>
  );
}

/** Print CSS shared by Approval / LBP Introduction / Untag letter print helpers */
export function getDostOfficialLetterheadPrintStyles(): string {
  return `
    .dost-lh-header { margin-bottom: 16px; }
    .dost-lh-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .dost-lh-logo-left { height: 64px; width: auto; max-width: 55%; object-fit: contain; object-position: left center; }
    .dost-lh-logo-right { height: 56px; width: auto; max-width: 35%; object-fit: contain; object-position: right center; }
    .dost-lh-rule { border-top: 1.5px solid #000; margin-top: 8px; }
    .dost-lh-form-title { text-align: center; font-weight: 700; font-size: 12px; margin-top: 10px; }
    .dost-lh-footer { margin-top: 28px; padding-top: 4px; font-size: 8px; color: #1f2937; line-height: 1.35; }
    .dost-lh-footer .dost-lh-rule { margin-bottom: 6px; margin-top: 0; }
    .dost-lh-footer-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .dost-lh-contact { flex: 1; display: grid; grid-template-columns: auto 1fr; gap: 1px 8px; }
    .dost-lh-iso { height: 48px; width: auto; flex-shrink: 0; object-fit: contain; }
    .dost-lh-app-id { margin-top: 6px; text-align: center; color: #9ca3af; font-size: 8px; }
  `;
}
