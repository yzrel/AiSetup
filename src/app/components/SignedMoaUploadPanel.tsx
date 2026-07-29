/**
 * Author: Yzrel Jade B. Eborde
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { Applicant } from "../store/applicantStore";
import type { AuthUser } from "../store/authStore";
import {
  getSignedMoa,
  removeSignedMoa,
  saveSignedMoa,
  saveSignedMoaDraft,
  validateSignedMoaUpload,
} from "../utils/approvalLetter";
import { sendSignedMoaReceiptsToDost } from "../utils/documentDelivery";
import { notifyMoaUploaded } from "../utils/notificationHelpers";
import { formatFormMention } from "../constants/setupForms";
import { SignedDocumentUpload } from "./SignedDocumentUpload";
import { ACTION_ROW } from "./moduleTheme";

export interface SignedMoaUploadPanelHandle {
  /** Flush current MOA fields into approvalLetter.signedMoa (partial draft OK). */
  saveDraft: () => void;
}

interface SignedMoaUploadPanelProps {
  applicant: Applicant;
  uploadedBy: string;
  user?: AuthUser | null;
  staffOnly?: boolean;
  readOnly?: boolean;
  requireAcknowledged?: boolean;
  isAcknowledged?: boolean;
  onSaved?: () => void;
}

export const SignedMoaUploadPanel = forwardRef<
  SignedMoaUploadPanelHandle,
  SignedMoaUploadPanelProps
>(function SignedMoaUploadPanel(
  {
    applicant,
    uploadedBy,
    user = null,
    staffOnly = true,
    readOnly,
    requireAcknowledged = true,
    isAcknowledged = true,
    onSaved,
  },
  ref,
) {
  const signedMoa = getSignedMoa(applicant);
  const [moaSignedDate, setMoaSignedDate] = useState("");
  const [signingVenue, setSigningVenue] = useState("");
  const [moaNotes, setMoaNotes] = useState("");
  const [pendingFile, setPendingFile] = useState<{
    fileName: string;
    mimeType: string;
    dataUrl?: string;
    uploadedAt: string;
    uploadedBy: string;
    fileId?: string;
    hasFileContent?: boolean;
  } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (signedMoa) {
      setMoaSignedDate(signedMoa.moaSignedDate ?? "");
      setSigningVenue(signedMoa.signingVenue ?? "");
      setMoaNotes(signedMoa.notes ?? "");
    } else {
      setMoaSignedDate("");
      setSigningVenue("");
      setMoaNotes("");
      setPendingFile(null);
    }
  }, [
    applicant.id,
    signedMoa?.uploadedAt,
    signedMoa?.moaSignedDate,
    signedMoa?.signingVenue,
    signedMoa?.notes,
    signedMoa?.fileName,
  ]);

  useImperativeHandle(ref, () => ({
    saveDraft: () => {
      const fileMeta = pendingFile ?? signedMoa;
      const hasAnyField =
        Boolean(moaSignedDate?.trim()) ||
        Boolean(signingVenue?.trim()) ||
        Boolean(moaNotes?.trim()) ||
        Boolean(fileMeta?.fileName);
      if (!hasAnyField) return;

      saveSignedMoaDraft(applicant.id, {
        fileName: fileMeta?.fileName ?? "",
        mimeType: fileMeta?.mimeType ?? "",
        dataUrl: fileMeta?.dataUrl,
        uploadedAt: fileMeta?.uploadedAt ?? new Date().toISOString(),
        uploadedBy: fileMeta?.uploadedBy ?? uploadedBy,
        fileId: fileMeta?.fileId,
        hasFileContent: fileMeta?.hasFileContent,
        moaSignedDate: moaSignedDate.trim(),
        signingVenue: signingVenue.trim() || undefined,
        notes: moaNotes.trim() || undefined,
      });
    },
  }));

  if (readOnly) {
    if (!signedMoa) return null;
    return (
      <SignedDocumentUpload
        label="Signed MOA"
        document={signedMoa.fileName ? signedMoa : null}
        signedDate={signedMoa.moaSignedDate}
        onSignedDateChange={() => {}}
        venue={signedMoa.signingVenue ?? ""}
        onVenueChange={() => {}}
        notes={signedMoa.notes ?? ""}
        onNotesChange={() => {}}
        onUpload={() => {}}
        onRemove={() => {}}
        uploadedBy={signedMoa.uploadedBy}
        readOnly
        dateLabel="MOA signed date"
        showVenue
      />
    );
  }

  const ackBlocked = requireAcknowledged && !isAcknowledged;

  if (ackBlocked) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        The applicant must acknowledge {formatFormMention("003")} conforme before staff can upload the
        signed MOA.
      </div>
    );
  }

  const handleSave = () => {
    const fileMeta = pendingFile ?? signedMoa;
    if (!fileMeta?.fileName) {
      setErrors(["Select a signed MOA file (PDF or image) to upload."]);
      return;
    }
    const validationErrors = validateSignedMoaUpload(moaSignedDate, fileMeta.fileName);
    setErrors(validationErrors);
    if (validationErrors.length) return;

    const document = {
      ...fileMeta,
      moaSignedDate,
      signingVenue: signingVenue || undefined,
      notes: moaNotes || undefined,
    };
    saveSignedMoa(applicant.id, document);
    setPendingFile(null);
    sendSignedMoaReceiptsToDost({
      applicant,
      user,
      document: {
        ...document,
        signedDate: moaSignedDate,
        notes: moaNotes || undefined,
      },
    });
    notifyMoaUploaded(applicant);
    setNotice("Signed MOA saved and emailed to DOST.");
    setTimeout(() => setNotice(""), 4000);
    onSaved?.();
  };

  return (
    <div className="space-y-3">
      {ackBlocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
          The applicant must acknowledge {formatFormMention("003")} conforme before staff can upload the
          signed MOA. Demo mode allows upload for presentation purposes.
        </div>
      )}
      <SignedDocumentUpload
        label="Signed MOA"
        document={pendingFile ?? (signedMoa?.fileName ? signedMoa : null)}
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
        applicantId={applicant.id}
        moduleKey="signedMoa"
      />
      <div className={ACTION_ROW}>
        <button
          type="button"
          onClick={handleSave}
          className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-[#0C2461] text-white text-sm font-semibold"
        >
          Save signed MOA &amp; email DOST
        </button>
      </div>
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
});
