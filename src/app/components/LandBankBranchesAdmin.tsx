/**
 * Author: Yzrel Jade B. Eborde
 */

import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Save,
  Search,
  Ban,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { ApiError } from "../api/client";
import type {
  ApiCreateLandBankBranchRequest,
  ApiLandBankBranch,
  ApiUpdateLandBankBranchRequest,
} from "../api/types";
import { AuthUser } from "../store/authStore";
import { landbankBranchStore } from "../store/landbankBranchStore";
import { DOST_REGION_12_CONTACTS } from "../constants/setupBrochure";
import { FORM_GRID_2, MODULE_PAGE } from "./moduleTheme";
import { ResponsiveDataView } from "./ui/responsive-data-view";

interface LandBankBranchesAdminProps {
  user: AuthUser;
}

type StatusFilter = "all" | "active" | "inactive";

const PSTO_OFFICES = DOST_REGION_12_CONTACTS.filter((o) => o.id !== "regional");

const emptyForm = (): ApiCreateLandBankBranchRequest => ({
  name: "",
  address: "",
  cityProvince: "",
  managerName: "",
  managerTitle: "Branch Manager",
  officeId: "",
});

export function LandBankBranchesAdmin({ user }: LandBankBranchesAdminProps) {
  const [branches, setBranches] = useState<ApiLandBankBranch[]>(() =>
    landbankBranchStore.getAll(),
  );
  const [dbConnected, setDbConnected] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<ApiLandBankBranch | null>(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadBranches = useCallback(async () => {
    try {
      await landbankBranchStore.hydrateFromBackend(true);
      const list = landbankBranchStore.getAll();
      setBranches(list);
      setDbConnected(landbankBranchStore.isHydrated());
      setSelected((prev) =>
        prev ? list.find((b) => b.id === prev.id) ?? null : null,
      );
      if (landbankBranchStore.getLastError()) {
        setMessage({
          type: "error",
          text: `${landbankBranchStore.getLastError()} Start the backend with npm run backend and sign in again.`,
        });
      }
    } catch (err) {
      setDbConnected(false);
      setMessage({
        type: "error",
        text:
          err instanceof ApiError
            ? err.message
            : "Could not load LandBank branches from the database. Run npm run backend.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sync = () => setBranches(landbankBranchStore.getAll());
    const unsub = landbankBranchStore.subscribe(sync);
    return unsub;
  }, []);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  const filtered = branches.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.name.toLowerCase().includes(q) ||
      b.cityProvince.toLowerCase().includes(q) ||
      b.managerName.toLowerCase().includes(q) ||
      (b.officeId ?? "").toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "active" && b.active) ||
      (filter === "inactive" && !b.active);
    return matchSearch && matchFilter;
  });

  const openBranch = (branch: ApiLandBankBranch) => {
    setCreating(false);
    setSelected(branch);
    setEditForm({
      name: branch.name,
      address: branch.address,
      cityProvince: branch.cityProvince,
      managerName: branch.managerName,
      managerTitle: branch.managerTitle || "Branch Manager",
      officeId: branch.officeId ?? "",
    });
    setMessage(null);
  };

  const startCreate = () => {
    setSelected(null);
    setCreating(true);
    setCreateForm(emptyForm());
    setMessage(null);
  };

  const handleCreate = async () => {
    if (
      !createForm.name.trim() ||
      !createForm.address.trim() ||
      !createForm.cityProvince.trim() ||
      !createForm.managerName.trim()
    ) {
      setMessage({
        type: "error",
        text: "Name, address, city/province, and manager name are required.",
      });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const created = await landbankBranchStore.createBranch({
        ...createForm,
        name: createForm.name.trim(),
        address: createForm.address.trim(),
        cityProvince: createForm.cityProvince.trim(),
        managerName: createForm.managerName.trim(),
        managerTitle: createForm.managerTitle?.trim() || "Branch Manager",
        officeId: createForm.officeId?.trim() || undefined,
      });
      setDbConnected(true);
      setMessage({
        type: "success",
        text: "LandBank branch saved to the database.",
      });
      setCreating(false);
      await loadBranches();
      openBranch(created);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof ApiError
            ? err.message
            : "Could not save branch to the database. Run npm run backend.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload: ApiUpdateLandBankBranchRequest = {
        name: editForm.name.trim(),
        address: editForm.address.trim(),
        cityProvince: editForm.cityProvince.trim(),
        managerName: editForm.managerName.trim(),
        managerTitle: editForm.managerTitle?.trim() || "Branch Manager",
        officeId: editForm.officeId?.trim() ?? "",
      };
      const updated = await landbankBranchStore.updateBranch(
        selected.id,
        payload,
      );
      setDbConnected(true);
      setMessage({
        type: "success",
        text: "Branch changes saved to the database.",
      });
      await loadBranches();
      openBranch(updated);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof ApiError
            ? err.message
            : "Could not save changes to the database. Run npm run backend.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selected || !selected.active) return;
    if (
      !window.confirm(
        `Deactivate "${selected.name}"? Existing letters keep their saved branch details.`,
      )
    ) {
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const updated = await landbankBranchStore.deactivateBranch(selected.id);
      setMessage({
        type: "success",
        text: "Branch deactivated in the database.",
      });
      await loadBranches();
      openBranch(updated);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof ApiError
            ? err.message
            : "Could not deactivate branch.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async () => {
    if (!selected || selected.active) return;
    setSaving(true);
    setMessage(null);
    try {
      const updated = await landbankBranchStore.updateBranch(selected.id, {
        active: true,
      });
      setMessage({
        type: "success",
        text: "Branch reactivated in the database.",
      });
      await loadBranches();
      openBranch(updated);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof ApiError
            ? err.message
            : "Could not reactivate branch.",
      });
    } finally {
      setSaving(false);
    }
  };

  const officeLabel = (officeId?: string) =>
    PSTO_OFFICES.find((o) => o.id === officeId)?.name ?? "—";

  return (
    <div className={`${MODULE_PAGE} max-w-7xl mx-auto space-y-5`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#0C2461]" />
            LandBank Branches
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Branch directory stored in the database ({branches.length} record
            {branches.length === 1 ? "" : "s"}
            {dbConnected ? " · connected" : ""}) · {user.firstName}{" "}
            {user.lastName}
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0C2461] text-white text-sm font-bold hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          Add branch
        </button>
      </div>

      {message && (
        <div
          className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-100"
              : "bg-red-50 text-red-800 border border-red-100"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          {message.text}
        </div>
      )}

      {!loading && !dbConnected && (
        <div className="flex items-start gap-2 p-3 rounded-xl text-sm bg-amber-50 text-amber-900 border border-amber-100">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Not connected to the database</p>
            <p className="mt-1">
              Start the Spring Boot API (<code className="text-xs">npm run backend</code>
              ) and sign in on the staff portal. Branches are stored in the{" "}
              <code className="text-xs">landbank_branches</code> table (Flyway V11).
            </p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search branches…"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as StatusFilter)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500 p-4">Loading branches…</p>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-gray-200 rounded-xl">
              <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                No branches yet. Add LandBank branches used in Region XII SETUP
                cases.
              </p>
            </div>
          ) : (
            <ResponsiveDataView
              rows={filtered}
              getRowKey={(b) => b.id}
              emptyMessage="No matching branches"
              onRowClick={openBranch}
              columns={[
                {
                  key: "name",
                  header: "Branch",
                  mobileLabel: "Branch",
                  cell: (b) => (
                    <div>
                      <p className="font-semibold text-gray-800">{b.name}</p>
                      <p className="text-xs text-gray-500">{b.cityProvince}</p>
                    </div>
                  ),
                },
                {
                  key: "manager",
                  header: "Manager",
                  mobileLabel: "Manager",
                  cell: (b) => b.managerName,
                },
                {
                  key: "status",
                  header: "Status",
                  mobileLabel: "Status",
                  cell: (b) => (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        b.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {b.active ? "Active" : "Inactive"}
                    </span>
                  ),
                },
              ]}
              renderMobileCard={(b) => (
                <button
                  type="button"
                  onClick={() => openBranch(b)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors ${
                    selected?.id === b.id
                      ? "border-[#0C2461] bg-blue-50/50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-800">{b.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {b.managerName}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {b.cityProvince}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        b.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {b.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </button>
              )}
            />
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="border border-gray-200 rounded-xl bg-white p-4 sm:p-6 space-y-4">
            {creating ? (
              <>
                <h2 className="font-bold text-gray-800">New LandBank branch</h2>
                <BranchFormFields
                  form={createForm}
                  onChange={setCreateForm}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleCreate()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0C2461] text-white text-sm font-bold disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Save branch
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : selected ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-bold text-gray-800">{selected.name}</h2>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      selected.active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {selected.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  PSTO link: {officeLabel(selected.officeId)}
                </p>
                <BranchFormFields form={editForm} onChange={setEditForm} />
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0C2461] text-white text-sm font-bold disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Save changes
                  </button>
                  {selected.active ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleDeactivate()}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-amber-200 text-amber-800 text-sm font-semibold disabled:opacity-50"
                    >
                      <Ban className="w-4 h-4" />
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleReactivate()}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-green-200 text-green-800 text-sm font-semibold disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Reactivate
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-sm text-gray-500">
                Select a branch to edit, or add a new one.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BranchFormFields({
  form,
  onChange,
}: {
  form: ApiCreateLandBankBranchRequest;
  onChange: (next: ApiCreateLandBankBranchRequest) => void;
}) {
  const patch = (partial: Partial<ApiCreateLandBankBranchRequest>) =>
    onChange({ ...form, ...partial });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
          Branch name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Kidapawan Branch"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
          Street address
        </label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => patch({ address: e.target.value })}
          placeholder="Quezon Blvd., Kidapawan City"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div className={FORM_GRID_2}>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
            City / province
          </label>
          <input
            type="text"
            value={form.cityProvince}
            onChange={(e) => patch({ cityProvince: e.target.value })}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
            Linked PSTO office
          </label>
          <select
            value={form.officeId ?? ""}
            onChange={(e) => patch({ officeId: e.target.value })}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          >
            <option value="">— None —</option>
            {PSTO_OFFICES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={FORM_GRID_2}>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
            Branch manager
          </label>
          <input
            type="text"
            value={form.managerName}
            onChange={(e) => patch({ managerName: e.target.value })}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 mb-1">
            Manager title
          </label>
          <input
            type="text"
            value={form.managerTitle ?? "Branch Manager"}
            onChange={(e) => patch({ managerTitle: e.target.value })}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
      </div>
    </div>
  );
}
