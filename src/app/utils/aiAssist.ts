/**
 * Author: Yzrel Jade B. Eborde
 */

import { useCallback, useState } from "react";
import { api, ApiError } from "../api/client";
import type { AiFieldSuggestionResponse, AiSuggestModule } from "../api/types";
import { Applicant } from "../store/applicantStore";
import { aiAssistNotice } from "./demoMode";

export type AiSuggestResult = {
  value: string | string[];
  aiGenerated: boolean;
};

export function applicantAiContext(applicant: Applicant | null): Record<string, unknown> {
  if (!applicant) return {};
  const md = applicant.moduleData ?? {};
  return {
    applicationId: applicant.applicationId,
    enterpriseName: applicant.enterpriseName,
    applicantName: applicant.applicantName,
    designation: applicant.designation,
    emailAddress: applicant.emailAddress,
    contactNumber: applicant.contactNumber,
    address: applicant.address,
    province: md.province ?? "",
    msmeSize: applicant.msmeSize,
    businessType: applicant.businessType,
    businessSector: applicant.businessSector,
    businessNature: applicant.businessNature,
    yearsOfOperation: applicant.yearsOfOperation,
    assetSize: applicant.assetSize,
    productServices: md.productServices ?? md.coreProducts ?? "",
    coreProducts: md.coreProducts ?? "",
    projectDescription: md.projectDescription ?? "",
    expectedOutcome: md.expectedOutcome ?? "",
    budget: md.budget ?? "",
    companyDescription: md.companyDescription ?? "",
  };
}

export async function suggestAiField(
  module: AiSuggestModule,
  field: string,
  context: Record<string, unknown>,
  localFallback?: () => string | string[],
): Promise<AiSuggestResult> {
  try {
    const res: AiFieldSuggestionResponse = await api.suggestAiField({
      module,
      field,
      context,
    });
    if (res.bullets?.length) {
      return { value: res.bullets, aiGenerated: res.aiGenerated };
    }
    if (res.text?.trim()) {
      return { value: res.text.trim(), aiGenerated: res.aiGenerated };
    }
  } catch (err) {
    if (localFallback) {
      return { value: localFallback(), aiGenerated: false };
    }
    if (err instanceof ApiError && err.status < 500) {
      throw err;
    }
    throw new Error("Could not generate a suggestion for this field.");
  }

  if (localFallback) {
    return { value: localFallback(), aiGenerated: false };
  }
  throw new Error("Could not generate a suggestion for this field.");
}

export async function completeAiPrompt(
  prompt: string,
  maxTokens?: number,
): Promise<{ text: string; aiGenerated: boolean }> {
  const res = await api.completeAi({ prompt, maxTokens });
  return { text: res.text, aiGenerated: res.aiGenerated };
}

export function aiGenerateErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    try {
      const parsed = JSON.parse(err.message) as { message?: string };
      if (parsed.message) return parsed.message;
    } catch {
      /* use raw message */
    }
    if (err.message.trim()) return err.message;
  }
  return fallback;
}

export function useAiFieldSuggest(module: AiSuggestModule) {
  const [loadingField, setLoadingField] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const suggest = useCallback(
    async (
      field: string,
      context: Record<string, unknown>,
      apply: (value: string | string[]) => void,
      localFallback?: () => string | string[],
    ) => {
      setLoadingField(field);
      setNotice(null);
      try {
        const { value, aiGenerated } = await suggestAiField(
          module,
          field,
          context,
          localFallback,
        );
        apply(value);
        setNotice(aiAssistNotice(aiGenerated));
      } catch (err) {
        setNotice(aiGenerateErrorMessage(err, "Could not generate suggestion."));
      } finally {
        setLoadingField(null);
        setTimeout(() => setNotice(null), 6000);
      }
    },
    [module],
  );

  const bind = useCallback(
    (field: string, context: Record<string, unknown>, apply: (value: string | string[]) => void, localFallback?: () => string | string[]) => ({
      onAiSuggest: () => {
        if (loadingField) return;
        void suggest(field, context, apply, localFallback);
      },
      aiLoading: loadingField === field,
    }),
    [loadingField, suggest],
  );

  return { suggest, bind, loadingField, notice };
}
