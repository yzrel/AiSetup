/**
 * Author: Yzrel Jade B. Eborde
 *
 * Plain-language hints for hard cooperator-facing fields (portal UI only).
 * Official print documents keep regional form labels unchanged.
 */

export const FIELD_GUIDANCE = {
  businessRecordTurnover:
    "Your annual sales or gross revenue from operations (in PHP)—not the value of your assets or capital.",
  essentialPeriod:
    "Answer Yes if your enterprise has been operating between 0 and 10 years (SETUP eligibility window).",
  exportClassification:
    "Choose Yes if you already sell abroad, No if you sell only locally, or Potential Export if you plan or can export.",
  assetSize:
    "Total value of business assets used in operations (equipment, inventory, property)—not your annual sales.",
  marketingPlan:
    "Describe how you sell and grow: who your customers are, where you sell, how you price, and how you reach buyers.",
  marketOutlets:
    "List your sales channels and how many (e.g. wet markets, sari-sari stores, online shops, institutional buyers).",
  promotionalStrategies:
    "How you advertise or promote (social media, flyers, trade fairs, word of mouth, partner stores).",
  marketCompetitors:
    "Who else sells similar products or services in your area, and how your enterprise differs from them.",
  processFlow:
    "List the steps from raw materials to finished product (e.g. receive → wash → process → pack → store). You may also upload a diagram.",
  productionPlan:
    "Describe planned production schedule, volumes, and capacity (who produces what, how often, and how much).",
  wasteManagement:
    "How you handle production waste or by-products (reuse, recycle, disposal, or treatment).",
  inventorySystem:
    "How you track stock of raw materials and finished goods (logbook, spreadsheet, software, or visual count).",
  maintenanceProgram:
    "How equipment is cleaned, repaired, and scheduled for upkeep (who does it and how often).",
  cgmpHaccp:
    "Food or product safety practices you follow (cleanliness, hygiene, hazard controls). Write N/A if not applicable.",
  purchasingSystem:
    "How you order and receive supplies and raw materials (suppliers, purchase orders, receiving checks).",
  plantLayout:
    "Upload a floor plan or drawing of work areas and equipment placement (required per TNA Form 01).",
  orgStructure:
    "Upload the enterprise organizational chart (owner/proprietor and reporting lines). Prefills from the Form 001 chart when already on file.",
  cashFlow:
    "Describe money coming in vs going out over time, or note if cash-flow / financial statements are attached elsewhere.",
  capitalSource:
    "Where startup or operating funds come from (own savings, loans, investors, cooperatives, grants).",
  accountingSystem:
    "How you keep financial records (manual ledger, Excel, bookkeeper, or accounting software).",
} as const;
