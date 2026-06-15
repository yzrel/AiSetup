import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Eye,
  Edit2,
  ChevronRight,
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Save,
  X,
  Trash2,
  ChevronDown,
} from "lucide-react";
import {
  applicantStore,
  Applicant,
  ModuleStatus,
  MODULE_LABELS,
  MODULE_ORDER,
} from "../store/applicantStore";

// ── Status badge ──────────────────────────────────────────────────────────────

const moduleBadgeColors: Partial<Record<ModuleStatus, string>> =
  {
    prescreening: "bg-gray-100 text-gray-600",
    registration: "bg-blue-100 text-blue-700",
    "letter-of-intent": "bg-indigo-100 text-indigo-700",
    requirements: "bg-purple-100 text-purple-700",
    tna1: "bg-cyan-100 text-cyan-700",
    tna2: "bg-sky-100 text-sky-700",
    "project-proposal": "bg-teal-100 text-teal-700",
    "conduct-rtec": "bg-amber-100 text-amber-700",
    "approval-letter": "bg-green-100 text-green-700",
    "landbank-withdrawal": "bg-lime-100 text-lime-700",
    "procurement-liquidation": "bg-orange-100 text-orange-700",
    "refund-delinquent": "bg-red-100 text-red-700",
    completed: "bg-emerald-100 text-emerald-700",
  };

function ModuleBadge({ module }: { module: ModuleStatus }) {
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${moduleBadgeColors[module] || "bg-gray-100 text-gray-500"}`}
    >
      {MODULE_LABELS[module]}
    </span>
  );
}

// ── Field display helpers ─────────────────────────────────────────────────────

function InfoField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm font-medium text-gray-800">
        {value || "—"}
      </span>
    </div>
  );
}

function EditField({
  label,
  name,
  value,
  onChange,
  type = "text",
  options,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  type?: string;
  options?: string[];
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
        {label}
      </label>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2461]/20 focus:border-[#0C2461]/40 bg-white"
        >
          <option value="">Select...</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C2461]/20 focus:border-[#0C2461]/40"
        />
      )}
    </div>
  );
}

// ── Applicant Detail / Edit Panel ─────────────────────────────────────────────

function ApplicantDetail({
  applicant,
  onBack,
  currentModule,
}: {
  applicant: Applicant;
  onBack: () => void;
  currentModule: ModuleStatus;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...applicant });
  const [saved, setSaved] = useState(false);
  const [, forceUpdate] = useState(0);

  // subscribe to store
  useEffect(
    () =>
      applicantStore.subscribe(() => forceUpdate((n) => n + 1)),
    [],
  );

  const handleChange = (name: string, value: string) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSave = () => {
    applicantStore.update(applicant.id, form);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const nextModule = (): ModuleStatus | null => {
    const idx = MODULE_ORDER.indexOf(applicant.currentModule);
    return idx < MODULE_ORDER.length - 1
      ? MODULE_ORDER[idx + 1]
      : null;
  };

  const handleAdvance = () => {
    const next = nextModule();
    if (next) applicantStore.advanceModule(applicant.id, next);
  };

  const progress = Math.round(
    (MODULE_ORDER.indexOf(applicant.currentModule) /
      (MODULE_ORDER.length - 1)) *
      100,
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-[#0C2461] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-white font-bold text-sm leading-tight">
              {applicant.enterpriseName}
            </p>
            <p className="text-white/50 text-[11px]">
              {applicant.applicationId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-emerald-300 text-xs font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-white/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border border-white/20"
            >
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-gray-600">
            Application Progress
          </span>
          <ModuleBadge module={applicant.currentModule} />
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#0C2461] to-[#00AEEF] rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">
            Step 1
          </span>
          <span className="text-[10px] text-gray-400 font-medium">
            {progress}% complete
          </span>
          <span className="text-[10px] text-gray-400">
            Complete
          </span>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Applicant Information */}
        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Applicant
            Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {editing ? (
              <>
                <EditField
                  label="Applicant Name"
                  name="applicantName"
                  value={form.applicantName}
                  onChange={handleChange}
                />
                <EditField
                  label="Designation"
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                />
                <EditField
                  label="Contact Number"
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                />
                <EditField
                  label="Email Address"
                  name="emailAddress"
                  value={form.emailAddress}
                  onChange={handleChange}
                  type="email"
                />
                <EditField
                  label="Region"
                  name="region"
                  value={form.region}
                  onChange={handleChange}
                  options={[
                    "NCR",
                    "Region I",
                    "Region II",
                    "Region III",
                    "Region IV-A",
                    "Region IV-B",
                    "Region V",
                    "Region VI",
                    "Region VII",
                    "Region VIII",
                    "Region IX",
                    "Region X",
                    "Region XI",
                    "Region XII",
                    "Region XIII",
                    "BARMM",
                    "CAR",
                    "SOCCSKSARGEN",
                  ]}
                />
                <EditField
                  label="Address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                />
              </>
            ) : (
              <>
                <InfoField
                  label="Applicant Name"
                  value={applicant.applicantName}
                />
                <InfoField
                  label="Designation"
                  value={applicant.designation}
                />
                <InfoField
                  label="Contact Number"
                  value={applicant.contactNumber}
                />
                <InfoField
                  label="Email Address"
                  value={applicant.emailAddress}
                />
                <InfoField
                  label="Region"
                  value={applicant.region}
                />
                <InfoField
                  label="Address"
                  value={applicant.address}
                />
              </>
            )}
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Enterprise Information */}
        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" /> Enterprise
            Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {editing ? (
              <>
                <EditField
                  label="Enterprise Name"
                  name="enterpriseName"
                  value={form.enterpriseName}
                  onChange={handleChange}
                />
                <EditField
                  label="Business Type"
                  name="businessType"
                  value={form.businessType}
                  onChange={handleChange}
                  options={[
                    "Single Proprietorship",
                    "Partnership",
                    "Corporation",
                    "Cooperative",
                  ]}
                />
                <EditField
                  label="Business Nature"
                  name="businessNature"
                  value={form.businessNature}
                  onChange={handleChange}
                />
                <EditField
                  label="Business Sector"
                  name="businessSector"
                  value={form.businessSector}
                  onChange={handleChange}
                  options={[
                    "Agri-processing",
                    "Manufacturing",
                    "Services",
                    "ICT",
                    "Handicrafts",
                    "Food Processing",
                    "Textiles",
                    "Other",
                  ]}
                />
                <EditField
                  label="MSME Size"
                  name="msmeSize"
                  value={form.msmeSize}
                  onChange={handleChange}
                  options={["Micro", "Small", "Medium"]}
                />
                <EditField
                  label="Asset Size"
                  name="assetSize"
                  value={form.assetSize}
                  onChange={handleChange}
                />
                <EditField
                  label="Years of Operation"
                  name="yearsOfOperation"
                  value={form.yearsOfOperation}
                  onChange={handleChange}
                  type="number"
                />
                <EditField
                  label="Enterprise Type"
                  name="enterpriseType"
                  value={form.enterpriseType}
                  onChange={handleChange}
                  options={[
                    "Manufacturing",
                    "Services",
                    "Trading",
                    "Agriculture",
                  ]}
                />
              </>
            ) : (
              <>
                <InfoField
                  label="Enterprise Name"
                  value={applicant.enterpriseName}
                />
                <InfoField
                  label="Business Type"
                  value={applicant.businessType}
                />
                <InfoField
                  label="Business Nature"
                  value={applicant.businessNature}
                />
                <InfoField
                  label="Business Sector"
                  value={applicant.businessSector}
                />
                <InfoField
                  label="MSME Size"
                  value={applicant.msmeSize}
                />
                <InfoField
                  label="Asset Size"
                  value={applicant.assetSize}
                />
                <InfoField
                  label="Years of Operation"
                  value={
                    applicant.yearsOfOperation + " year(s)"
                  }
                />
                <InfoField
                  label="Enterprise Type"
                  value={applicant.enterpriseType}
                />
              </>
            )}
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Timeline */}
        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5" /> Module Timeline
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {MODULE_ORDER.filter((m) => m !== "completed").map(
              (m, i) => {
                const idx = MODULE_ORDER.indexOf(
                  applicant.currentModule,
                );
                const mIdx = MODULE_ORDER.indexOf(m);
                const done = mIdx < idx;
                const current = m === applicant.currentModule;
                return (
                  <div
                    key={m}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                      done
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : current
                          ? "bg-[#0C2461] border-[#0C2461] text-white"
                          : "bg-gray-50 border-gray-200 text-gray-400"
                    }`}
                  >
                    {done && (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    {current && <Clock className="w-3 h-3" />}
                    {MODULE_LABELS[m]}
                  </div>
                );
              },
            )}
          </div>
        </section>

        {/* Advance module */}
        {!editing && nextModule() && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-blue-800">
                Ready to advance?
              </p>
              <p className="text-xs text-blue-600">
                Move this applicant to:{" "}
                <strong>{MODULE_LABELS[nextModule()!]}</strong>
              </p>
            </div>
            <button
              onClick={handleAdvance}
              className="flex items-center gap-2 bg-[#0C2461] hover:bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Advance to Next Module{" "}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Applicant List View ───────────────────────────────────────────────────────

export function ApplicantListView({
  module,
  title,
  onNewApplicant,
}: {
  module?: ModuleStatus;
  title: string;
  onNewApplicant?: () => void;
}) {
  const [, forceUpdate] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    null,
  );
  const [filterModule, setFilterModule] = useState<
    "all" | ModuleStatus
  >("all");

  useEffect(
    () =>
      applicantStore.subscribe(() => forceUpdate((n) => n + 1)),
    [],
  );

  const allApplicants = applicantStore.getAll();
  const filtered = allApplicants.filter((a) => {
    const matchModule =
      filterModule === "all" ||
      a.currentModule === filterModule;
    const matchSearch =
      a.applicantName
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      a.enterpriseName
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      a.applicationId
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      a.region.toLowerCase().includes(search.toLowerCase());
    return matchModule && matchSearch;
  });

  const selectedApplicant = selectedId
    ? applicantStore.getById(selectedId)
    : null;

  if (selectedApplicant) {
    return (
      <ApplicantDetail
        applicant={selectedApplicant}
        onBack={() => setSelectedId(null)}
        currentModule={module}
      />
    );
  }

  // Module filter tabs
  const activeInModule = module
    ? allApplicants.filter((a) => a.currentModule === module)
        .length
    : allApplicants.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-[#0C2461] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-white font-bold text-sm">
            {title} — Applicant Registry
          </h2>
          <p className="text-white/50 text-[11px]">
            {module
              ? `${activeInModule} currently in this module · ${allApplicants.length} total applicants`
              : `${allApplicants.length} total applicants across all modules`}
          </p>
        </div>
        {onNewApplicant && (
          <button
            onClick={onNewApplicant}
            className="flex items-center gap-2 bg-[#00AEEF] hover:bg-sky-400 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Applicant
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 border border-gray-200 flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, enterprise, ID, region..."
            className="bg-transparent text-xs text-gray-600 outline-none w-full placeholder:text-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Module filter */}
        <select
          value={filterModule}
          onChange={(e) =>
            setFilterModule(
              e.target.value as typeof filterModule,
            )
          }
          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0C2461]/20 bg-white text-gray-600"
        >
          <option value="all">
            All Modules ({allApplicants.length})
          </option>
          {MODULE_ORDER.filter((m) => m !== "completed").map(
            (m) => {
              const count = allApplicants.filter(
                (a) => a.currentModule === m,
              ).length;
              return (
                <option key={m} value={m}>
                  {MODULE_LABELS[m]} ({count})
                </option>
              );
            },
          )}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-left">
              {[
                "Applicant / Enterprise",
                "Application ID",
                "MSME Size",
                "Region",
                "Current Module",
                "Last Updated",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-sm text-gray-400"
                >
                  {search
                    ? "No applicants match your search."
                    : "No applicants found for this module."}
                </td>
              </tr>
            )}
            {filtered.map((app) => (
              <tr
                key={app.id}
                className="border-t border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer"
                onClick={() => setSelectedId(app.id)}
              >
                {/* Name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-[#0C2461]/10 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-[#0C2461] font-black text-[11px]">
                        {app.applicantName
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800 leading-tight">
                        {app.applicantName}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {app.enterpriseName}
                      </p>
                    </div>
                  </div>
                </td>

                {/* App ID */}
                <td className="px-4 py-3">
                  <span className="text-[11px] font-mono font-semibold text-gray-600">
                    {app.applicationId}
                  </span>
                </td>

                {/* MSME Size */}
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      app.msmeSize === "Micro"
                        ? "bg-gray-100 text-gray-600"
                        : app.msmeSize === "Small"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {app.msmeSize}
                  </span>
                </td>

                {/* Region */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-[11px] text-gray-500">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {app.region}
                  </div>
                </td>

                {/* Module */}
                <td className="px-4 py-3">
                  <ModuleBadge module={app.currentModule} />
                </td>

                {/* Updated */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Calendar className="w-3 h-3 shrink-0" />
                    {app.lastUpdated}
                  </div>
                </td>

                {/* Actions */}
                <td
                  className="px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedId(app.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#0C2461] border border-[#0C2461]/20 bg-[#0C2461]/5 hover:bg-[#0C2461]/10 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>
                    <button
                      onClick={() => setSelectedId(app.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
        <p className="text-[11px] text-gray-400">
          Showing{" "}
          <span className="font-bold text-gray-600">
            {filtered.length}
          </span>{" "}
          of{" "}
          <span className="font-bold text-gray-600">
            {allApplicants.length}
          </span>{" "}
          total applicants
        </p>
      </div>
    </div>
  );
}