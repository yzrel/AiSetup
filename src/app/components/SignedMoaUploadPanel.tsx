/**
 * Author: Yzrel Jade B. Eborde
 */

import { useEffect, useState } from "react";
import { Applicant } from "../store/applicantStore";
import {
  getSignedMoa,
  removeSignedMoa,
  saveSignedMoa,
  validateSignedMoaUpload,
} from "../utils/approvalLetter";
import { notifyMoaUploaded } from "../utils/notificationHelpers";
import { SignedDocumentUpload } from "./SignedDocumentUpload";

interface SignedMoaUploadPanelProps {
  applicant: Applicant;
  uploadedBy: string;
  staffOnly?: boolean;
  readOnly?: boolean;
  requireAcknowledged?: boolean;
  isAcknowledged?: boolean;
  onSaved?: () => void;
}

export function SignedMoaUploadPanel({
  applicant,
  uploadedBy,
  staffOnly = true,
  readOnly,
  requireAcknowledged = true,
  isAcknowledged = true,
  onSaved,
}: SignedMoaUploadPanelProps) {
  const signedMoa = getSignedMoa(applicant);
  const [moaSignedDate, setMoaSignedDate] = useState("");
  const [signingVenue, setSigningVenue] = useState("");
  const [moaNotes, setMoaNotes] = useState("");
  const [pendingFile, setPendingFile] = useState<{
    fileName: string;
    mimeType: string;
    dataUrl: string;
    uploadedAt: string;
    uploadedBy: string;
  } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (signedMoa) {
      setMoaSignedDate(signedMoa.moaSignedDate);
      setSigningVenue(signedMoa.signingVenue ?? "");
      setMoaNotes(signedMoa.notes ?? "");
    }
  }, [applicant.id, signedMoa?.uploadedAt]);

  if (readOnly) {
    if (!signedMoa) return null;
    return (
      <SignedDocumentUpload
        label="Signed MOA"
        document={signedMoa}
        signedDate={signedMoa.moaSignedDate}
        onSignedDateChange={() => {}}
        onUpload={() => {}}
        onRemove={() => {}}
        uploadedBy={signedMoa.uploadedBy}
        readOnly
        dateLabel="MOA signed date"
      />
    );
  }

  if (requireAcknowledged && !isAcknowledged) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        The applicant must acknowledge Form 003 conforme before staff can upload the
        signed MOA.
      </div>
    );
  }

  const handleSave = () => {
    const fileMeta = pendingFile ?? signedMoa;
    if (!fileMeta) {
      setErrors(["Select a signed MOA file (PDF or image) to upload."]);
      return;
    }
    const validationErrors = validateSignedMoaUpload(moaSignedDate, fileMeta.fileName);
    setErrors(validationErrors);
    if (validationErrors.length) return;

    saveSignedMoa(applicant.id, {
      ...fileMeta,
      moaSignedDate,
      signingVenue: signingVenue || undefined,
      notes: moaNotes || undefined,
    });
    setPendingFile(null);
    notifyMoaUploaded(applicant);
    setNotice("Signed MOA saved.");
    setTimeout(() => setNotice(""), 4000);
    onSaved?.();
  };

  return (
    <div className="space-y-3">
      <SignedDocumentUpload
        label="Signed MOA"
        document={pendingFile ?? signedMoa}
        signedDate={moaSignedDate}
        onSignedDateChange={setMoaSignedDate}
        venue={signingVenue}
        onVenueChange={setSigningVenue}
        notes={moaNotes}
        onNotesChange={setMoaNotes}
        onUpload={(doc) => {
          setPendingFile(doc);
          setErrors([]);
        }}
        onRemove={() => {
          if (signedMoa) removeSignedMoa(applicant.id);
          setPendingFile(null);
        }}
        uploadedBy={uploadedBy}
        dateLabel="MOA signed date"
        showVenue
        staffOnly={staffOnly}
      />
      <button
        type="button"
        onClick={handleSave}
        className="px-4 py-2 rounded-lg bg-[#0C2461] text-white text-sm font-semibold"
      >
        Save signed MOA
      </button>
      {notice && (
        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          {notice}
        </p>
      )}
      {errors.length > 0 && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 space-y-1">
          {errors.map((e) => (
            <p key={e}>• {e}</p>
          ))}
        </div>
      )}
    </div>
  );
}
