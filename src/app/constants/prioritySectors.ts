/**
 * Author: Yzrel Jade B. Eborde
 *
 * Canonical SETUP 4.0 priority sectors (official Form 001 / regional guidelines).
 * Single source of truth for registration, landing page, and Form 001 print layout.
 */

export interface PrioritySectorEntry {
  id: string;
  label: string;
  description: string;
}

/** Document order (a–t) per SETUP Guidelines priority industries. */
export const SETUP_PRIORITY_SECTOR_CATALOG: readonly PrioritySectorEntry[] = [
  {
    id: "crop-animal",
    label: "Crop and animal production, hunting, and related service activities",
    description:
      "Production of food and non-food crops; livestock and poultry production and animal products; hunting and trapping of animals and related support activities.",
  },
  {
    id: "forestry-logging",
    label: "Forestry and logging",
    description:
      "Production of timber and forestry activity products that undergo little processing (e.g., firewood, charcoal, wood chips, unprocessed round wood).",
  },
  {
    id: "fishing-aquaculture",
    label: "Fishing and aquaculture",
    description:
      "Fishery and aquaculture activities in marine, brackish, or freshwater environments for capturing or gathering fish, crustaceans, mollusks, and other marine organisms.",
  },
  {
    id: "food-processing",
    label: "Food processing",
    description:
      "Processing products from agriculture, forestry, and fishing into human or animal food.",
  },
  {
    id: "beverage-manufacturing",
    label: "Beverage manufacturing",
    description:
      "Production of non-alcoholic beverages, mineral water, and alcoholic beverages (like beer and wine) mainly through fermentation.",
  },
  {
    id: "textile-manufacturing",
    label: "Textile manufacturing",
    description:
      "Preparation and spinning of textile fibers; weaving and finishing of textiles; manufacture of made-up textile articles except apparel (e.g., household linen, blankets, rugs, cordage).",
  },
  {
    id: "wearing-apparel",
    label: "Wearing apparel manufacturing",
    description:
      "All tailoring (ready-to-wear or made-to-measure) for all items of clothing and accessories in all materials.",
  },
  {
    id: "leather-products",
    label: "Leather and related products manufacturing",
    description:
      "Transformation of hides into leather by tanning or curing and fabricating the leather into products for final consumption.",
  },
  {
    id: "wood-cork",
    label: "Wood and products of wood and cork manufacturing",
    description:
      "Wood products mostly used for construction, including sawing, shaping and assembling of wood products, and assembling into finished products such as wood containers.",
  },
  {
    id: "paper-products",
    label: "Paper and paper products manufacturing",
    description: "Manufacture of pulp, paper, and converted paper products.",
  },
  {
    id: "chemicals",
    label: "Chemicals and chemical products manufacturing",
    description:
      "Manufacture of soap and detergents, cleaning and polishing preparations, perfumes, cosmetics, and toilet preparations.",
  },
  {
    id: "pharmaceuticals",
    label:
      "Basic pharmaceutical products and pharmaceutical preparations manufacturing",
    description:
      "Manufacture of basic pharmaceutical products and pharmaceutical preparations.",
  },
  {
    id: "rubber-plastic",
    label: "Rubber and plastic products manufacturing",
    description: "Manufacture of rubber and plastic products.",
  },
  {
    id: "non-metallic-mineral",
    label: "Non-metallic mineral products manufacturing",
    description:
      "Manufacture of glass and glass products, ceramic products, tiles, baked clay products, and cement and plaster, from raw materials to finished articles.",
  },
  {
    id: "fabricated-metal",
    label: "Fabricated metal products manufacturing",
    description:
      "Manufacture of pure metal products, such as parts, containers, and structures, usually with a static, immovable function. Excludes manufacturing of machinery and equipment.",
  },
  {
    id: "machinery-nec",
    label:
      "Machinery and equipment, NEC (Not Elsewhere Classified) manufacturing",
    description:
      "Manufacture of machinery and equipment that act independently on materials either mechanically or thermally or perform operation on materials.",
  },
  {
    id: "transport-equipment",
    label: "Other transport equipment manufacturing",
    description:
      "Manufacture of transportation equipment such as shipbuilding, boat manufacturing, manufacturing jeepneys, tricycles, bicycles, etc.",
  },
  {
    id: "furniture",
    label: "Furniture manufacturing",
    description:
      "Manufacture of furniture and related products of any material except stone, concrete, and ceramic.",
  },
  {
    id: "information-communication",
    label: "Information and Communication",
    description:
      "Providing expertise in the field of information technologies: writing, modifying, testing, and supporting software; planning and designing computer systems that integrate computer hardware, software and communication technologies; and on-site management and operation of cooperators' computer systems.",
  },
  {
    id: "rdc-other",
    label:
      "Other regional priority industries approved by the Regional Development Council",
    description:
      "Industries approved by the Regional Development Council as regional priority sectors not listed above.",
  },
] as const;

export type SetupPrioritySector = (typeof SETUP_PRIORITY_SECTOR_CATALOG)[number]["label"];

export const SETUP_PRIORITY_SECTORS: readonly SetupPrioritySector[] =
  SETUP_PRIORITY_SECTOR_CATALOG.map((entry) => entry.label);

export const SETUP_PRIORITY_SECTOR_DESCRIPTIONS: Record<
  SetupPrioritySector,
  string
> = Object.fromEntries(
  SETUP_PRIORITY_SECTOR_CATALOG.map((entry) => [entry.label, entry.description]),
) as Record<SetupPrioritySector, string>;

/** Form 001 RDC checkbox label includes "please specify:" for print layout. */
export const PP_RDC_SECTOR_PRINT_LABEL =
  "Other regional priority industries approved by the Regional Development Council, please specify:";

/** Form 001 business-activity checkbox grid: left column then right column per row. */
export const PP_BUSINESS_ACTIVITY_PAIRS: readonly [string, string][] = [
  [
    SETUP_PRIORITY_SECTOR_CATALOG[0].label,
    SETUP_PRIORITY_SECTOR_CATALOG[10].label,
  ],
  [
    SETUP_PRIORITY_SECTOR_CATALOG[1].label,
    SETUP_PRIORITY_SECTOR_CATALOG[11].label,
  ],
  [
    SETUP_PRIORITY_SECTOR_CATALOG[2].label,
    SETUP_PRIORITY_SECTOR_CATALOG[12].label,
  ],
  [
    SETUP_PRIORITY_SECTOR_CATALOG[3].label,
    SETUP_PRIORITY_SECTOR_CATALOG[13].label,
  ],
  [
    SETUP_PRIORITY_SECTOR_CATALOG[4].label,
    SETUP_PRIORITY_SECTOR_CATALOG[14].label,
  ],
  [
    SETUP_PRIORITY_SECTOR_CATALOG[5].label,
    SETUP_PRIORITY_SECTOR_CATALOG[15].label,
  ],
  [
    SETUP_PRIORITY_SECTOR_CATALOG[6].label,
    SETUP_PRIORITY_SECTOR_CATALOG[16].label,
  ],
  [
    SETUP_PRIORITY_SECTOR_CATALOG[7].label,
    SETUP_PRIORITY_SECTOR_CATALOG[17].label,
  ],
  [
    SETUP_PRIORITY_SECTOR_CATALOG[8].label,
    SETUP_PRIORITY_SECTOR_CATALOG[18].label,
  ],
  [
    SETUP_PRIORITY_SECTOR_CATALOG[9].label,
    PP_RDC_SECTOR_PRINT_LABEL,
  ],
];

/** Legacy 9-sector labels stored on older applicant records → canonical label. */
export const LEGACY_PRIORITY_SECTOR_ALIASES: Record<string, SetupPrioritySector> =
  {
    "Agriculture, Forestry, Livestock":
      "Crop and animal production, hunting, and related service activities",
    "Food Processing": "Food processing",
    "Tool and Die": "Fabricated metal products manufacturing",
    "Furniture, Jewelry, GHD and Creatives": "Furniture manufacturing",
    "Marine and Aquaculture": "Fishing and aquaculture",
    "Marine Transport": "Other transport equipment manufacturing",
    "Health and Wellness (Biotech, Medical Services, Pharmaceuticals, Food Supplements)":
      "Basic pharmaceutical products and pharmaceutical preparations manufacturing",
    "Electronics and ICT Services": "Information and Communication",
    "Agrimachinery / Farm Implements / Food Processing Equipment":
      "Machinery and equipment, NEC (Not Elsewhere Classified) manufacturing",
  };

export function normalizePrioritySector(sector: string): string {
  const trimmed = sector.trim();
  if (!trimmed) return trimmed;
  if (SETUP_PRIORITY_SECTORS.includes(trimmed as SetupPrioritySector)) {
    return trimmed;
  }
  return LEGACY_PRIORITY_SECTOR_ALIASES[trimmed] ?? trimmed;
}

export function isSetupPrioritySector(sector: string): boolean {
  const trimmed = sector.trim();
  if (!trimmed) return false;
  if (SETUP_PRIORITY_SECTORS.includes(trimmed as SetupPrioritySector)) {
    return true;
  }
  return trimmed in LEGACY_PRIORITY_SECTOR_ALIASES;
}
