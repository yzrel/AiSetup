/**
 * Author: Yzrel Jade B. Eborde
 */

import {
  getSetupFormRef,
  getSetupFormTitle,
  type SetupFormKey,
} from "../constants/setupForms";

interface ModuleFormHeaderProps {
  title?: string;
  subtitle?: string;
  formKey?: SetupFormKey;
  showFormRef?: boolean;
}

export function ModuleFormHeader({
  title,
  subtitle,
  formKey,
  showFormRef = true,
}: ModuleFormHeaderProps) {
  const displayTitle = title ?? (formKey ? getSetupFormTitle(formKey) : "");
  const formRef = formKey && showFormRef ? getSetupFormRef(formKey) : null;

  return (
    <div>
      <h1 className="text-xl font-black">{displayTitle}</h1>
      {formRef && (
        <p className="text-white/45 text-xs font-medium tracking-wide mt-0.5">{formRef}</p>
      )}
      {subtitle && <p className="text-white/60 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

interface FormRefProps {
  form: SetupFormKey;
  className?: string;
}

/** Muted inline form reference for body copy */
export function FormRef({ form, className = "text-gray-400 text-xs" }: FormRefProps) {
  return <span className={className}>{getSetupFormRef(form)}</span>;
}
