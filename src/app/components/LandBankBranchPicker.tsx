/**
 * Author: Yzrel Jade B. Eborde
 */

import { useEffect, useState, type ReactNode } from "react";
import { landbankBranchStore } from "../store/landbankBranchStore";
import {
  resolveLbpBranchById,
  resolveLbpBranchByBranchName,
} from "../utils/lbpIntroductionLetter";

export interface LandBankBranchPickerFields {
  branchId?: string;
  landbankBranch: string;
  branchAddress?: string;
  branchCityProvince: string;
  branchManagerName: string;
  branchManagerTitle: string;
}

interface LandBankBranchPickerProps<T extends LandBankBranchPickerFields> {
  form: T;
  onChange: (form: T) => void;
  readOnly?: boolean;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
      {children}
    </label>
  );
}

export function LandBankBranchPicker<T extends LandBankBranchPickerFields>({
  form,
  onChange,
  readOnly,
}: LandBankBranchPickerProps<T>) {
  const [, setTick] = useState(0);

  useEffect(() => landbankBranchStore.subscribe(() => setTick((n) => n + 1)), []);

  const activeBranches = landbankBranchStore.getActive();
  const selectValue = form.branchId || "";

  const applyDefaults = (
    defaults: ReturnType<typeof resolveLbpBranchById>,
    landbankBranch: string,
    branchId?: string,
  ) => {
    const next = {
      ...form,
      branchId: branchId || defaults?.branchId || undefined,
      landbankBranch: defaults?.landbankBranch || landbankBranch,
      branchAddress: defaults?.branchAddress || form.branchAddress,
      branchCityProvince: defaults?.branchCityProvince || form.branchCityProvince,
      branchManagerName: defaults?.branchManagerName || form.branchManagerName,
      branchManagerTitle:
        defaults?.branchManagerTitle || form.branchManagerTitle || "Branch Manager",
    } as T;
    onChange(next);
  };

  const handleSelect = (value: string) => {
    if (!value) {
      onChange({ ...form, branchId: undefined } as T);
      return;
    }
    if (value === "__custom__") {
      onChange({ ...form, branchId: undefined } as T);
      return;
    }
    const defaults = resolveLbpBranchById(value);
    applyDefaults(defaults, defaults?.landbankBranch || "", value);
  };

  const handleBranchNameChange = (landbankBranch: string) => {
    const defaults = resolveLbpBranchByBranchName(landbankBranch);
    if (defaults) {
      applyDefaults(defaults, landbankBranch, defaults.branchId);
      return;
    }
    onChange({ ...form, landbankBranch, branchId: undefined } as T);
  };

  return (
    <div className="space-y-4">
      {activeBranches.length > 0 && (
        <div>
          <FieldLabel>Select from directory</FieldLabel>
          <select
            value={selectValue || (form.landbankBranch && !selectValue ? "__custom__" : "")}
            onChange={(e) => handleSelect(e.target.value)}
            disabled={readOnly}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50"
          >
            <option value="">— Choose a branch —</option>
            {activeBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
                {b.cityProvince ? ` — ${b.cityProvince}` : ""}
              </option>
            ))}
            <option value="__custom__">Other / manual entry</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Branches are maintained under Administration → LandBank Branches.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>LandBank branch</FieldLabel>
          <input
            type="text"
            value={form.landbankBranch}
            onChange={(e) => handleBranchNameChange(e.target.value)}
            placeholder="Kidapawan Branch"
            readOnly={readOnly}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 read-only:bg-gray-50"
          />
        </div>
        <div>
          <FieldLabel>Branch city / province</FieldLabel>
          <input
            type="text"
            value={form.branchCityProvince}
            onChange={(e) =>
              onChange({ ...form, branchCityProvince: e.target.value } as T)
            }
            placeholder="Kidapawan City, North Cotabato"
            readOnly={readOnly}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 read-only:bg-gray-50"
          />
        </div>
      </div>

      <div>
        <FieldLabel>Branch street address</FieldLabel>
        <input
          type="text"
          value={form.branchAddress ?? ""}
          onChange={(e) =>
            onChange({ ...form, branchAddress: e.target.value } as T)
          }
          placeholder="Quezon Blvd., Kidapawan City"
          readOnly={readOnly}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 read-only:bg-gray-50"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <FieldLabel>Branch manager</FieldLabel>
          <input
            type="text"
            value={form.branchManagerName}
            onChange={(e) =>
              onChange({ ...form, branchManagerName: e.target.value } as T)
            }
            readOnly={readOnly}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 read-only:bg-gray-50"
          />
        </div>
        <div>
          <FieldLabel>Manager title</FieldLabel>
          <input
            type="text"
            value={form.branchManagerTitle}
            onChange={(e) =>
              onChange({ ...form, branchManagerTitle: e.target.value } as T)
            }
            readOnly={readOnly}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 read-only:bg-gray-50"
          />
        </div>
      </div>
    </div>
  );
}
