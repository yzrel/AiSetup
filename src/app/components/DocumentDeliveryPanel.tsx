/**
 * Author: Yzrel Jade B. Eborde
 *
 * Shared per-module panel for document delivery:
 * 1. "Send to DOST" — emails the module printable to the PSTO / regional
 *    records office (simulated via the in-app outbox).
 * 2. Signed-document upload — staff or client uploads the signed copy; the
 *    system emails a receipt / proof of delivery to the client and DOST.
 */

import { useEffect, useState } from "react";
import { CheckCircle, Mail, Send } from "lucide-react";
import { AuthUser } from "../store/authStore";
import { Applicant, applicantStore } from "../store/applicantStore";
import {
  getSignedDocument,
  removeSignedDocument,
  saveSignedDocumentWithReceipts,
  sendPrintableToClient,
  sendPrintableToDost,
  SignedDocumentRecord,
} from "../utils/documentDelivery";
import {
  SignedDocumentUpload,
  SignedDocumentValue,
} from "./SignedDocumentUpload";

export function SendToDostButton({
  applicant,
  user,
  moduleKey,
  documentTitle,
  className,
  sendTarget = "dost",
  onSent,
}: {
  applicant: Applicant | null;
  user?: AuthUser | null;
  moduleKey: string;
  documentTitle: string;
  className?: string;
  /** "client" emails the printable to the applicant for signing */
  sendTarget?: "dost" | "client";
  onSent?: () => void;
}) {
  const [sentAt, setSentAt] = useState<string | null>(null);

  if (!applicant) return null;

  const handleSend = () => {
    if (sendTarget === "client") {
      sendPrintableToClient({
        applicant,
        user: user ?? null,
        moduleKey,
        documentTitle,
      });
    } else {
      sendPrintableToDost({
        applicant,
        user: user ?? null,
        moduleKey,
        documentTitle,
      });
    }
    setSentAt(new Date().toISOString());
    onSent?.();
  };

  const buttonLabel =
    sendTarget === "client" ? "Send to client by email" : "Send to DOST by email";
  const successLabel =
    sendTarget === "client"
      ? "Sent to the client for signature — see Sent Emails."
      : "Sent to your PSTO and DOST Region XII records — see Sent Emails.";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleSend}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0C2461] hover:opacity-90 transition-all"
      >
        <Send className="w-4 h-4" />
        {buttonLabel}
      </button>
      {sentAt && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-green-700">
          <CheckCircle className="w-3.5 h-3.5" />
          {successLabel}
        </p>
      )}
    </div>
  );
}

export function DocumentDeliveryPanel({
  applicant,
  user,
  moduleKey,
  documentTitle,
  hideSendButton,
  sendTarget = "dost",
  onSent,
  onSignedUpload,
  onSignedRemove,
}: {
  applicant: Applicant | null;
  user?: AuthUser | null;
  moduleKey: string;
  documentTitle: string;
  /** Hide the Send-to-DOST button (e.g. when rendered next to a custom one) */
  hideSendButton?: boolean;
  sendTarget?: "dost" | "client";
  onSent?: () => void;
  /** Extra hook after signed copy is stored (e.g. sync into module form) */
  onSignedUpload?: (doc: SignedDocumentRecord) => void;
  onSignedRemove?: () => void;
}) {
  const [signedDoc, setSignedDoc] = useState<SignedDocumentRecord | null>(
    getSignedDocument(applicant, moduleKey),
  );
  const [signedDate, setSignedDate] = useState(
    getSignedDocument(applicant, moduleKey)?.signedDate ?? "",
  );

  useEffect(() => {
    if (!applicant) return;
    const reload = () => {
      const app = applicantStore.getById(applicant.id);
      const doc = getSignedDocument(app ?? null, moduleKey);
      setSignedDoc(doc);
      if (doc?.signedDate) setSignedDate(doc.signedDate);
    };
    reload();
    return applicantStore.subscribe(reload);
  }, [applicant?.id, moduleKey]);

  if (!applicant) return null;

  const handleUpload = (doc: SignedDocumentValue) => {
    const record: SignedDocumentRecord = { ...doc, signedDate };
    saveSignedDocumentWithReceipts({
      applicant,
      user: user ?? null,
      moduleKey,
      documentTitle,
      document: record,
    });
    setSignedDoc(record);
    onSignedUpload?.(record);
  };

  const handleRemove = () => {
    removeSignedDocument(applicant, moduleKey);
    setSignedDoc(null);
    onSignedRemove?.();
  };

  const deliveryHint =
    sendTarget === "client"
      ? "Email the generated letter to the client for signature, then upload the signed copy. Receipts are emailed automatically."
      : "Send the generated document to DOST admin/staff, and upload the signed copy once available. Receipts are emailed to the client and DOST staff automatically.";

  return (
    <div className="border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-4 bg-white print:hidden">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Mail className="w-4.5 h-4.5 text-[#0C2461]" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-800">
            Document delivery — {documentTitle}
          </p>
          <p className="text-xs text-gray-500">{deliveryHint}</p>
        </div>
      </div>

      {!hideSendButton && (
        <SendToDostButton
          applicant={applicant}
          user={user}
          moduleKey={moduleKey}
          documentTitle={documentTitle}
          sendTarget={sendTarget}
          onSent={onSent}
        />
      )}

      <SignedDocumentUpload
        label={`Signed ${documentTitle}`}
        document={signedDoc}
        signedDate={signedDate}
        onSignedDateChange={setSignedDate}
        onUpload={handleUpload}
        onRemove={handleRemove}
        uploadedBy={user?.email ?? applicant.emailAddress}
      />
      {signedDoc && (
        <p className="flex items-center gap-1.5 text-xs text-green-700">
          <CheckCircle className="w-3.5 h-3.5" />
          Signed copy on file — receipt emailed to the client and DOST staff.
        </p>
      )}
    </div>
  );
}
