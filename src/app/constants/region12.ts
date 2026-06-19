/**
 * Author: Yzrel Jade B. Eborde
 */

/** DOST SETUP aiSETUP — Region XII (SOCCSKSARGEN) deployment scope */

export const REGION_12_LABEL = "Region XII (SOCCSKSARGEN)";
export const REGION_12_SHORT = "Region XII";
export const REGION_12_NAME = "SOCCSKSARGEN";

export const DOST_REGION_12_OFFICE = "DOST Regional Office No. XII";
export const DOST_REGION_12_ADDRESS =
  "PNHLSG Bldg., Brgy. Paraiso, Koronadal City, South Cotabato";
export const DOST_REGION_12_PHONE = "(083) 826-0114";
export const DOST_REGION_12_EMAIL = "records@region12.dost.gov.ph";
export const DOST_REGION_12_WEBSITE = "https://www.region12.dost.gov.ph";
export const DOST_REGION_12_FACEBOOK = "https://facebook.com/dostregion12";
export const DOST_REGION_12_DIRECTOR = "Engr. Sammy P. Malawan, Regional Director";

/** Provinces and component city under Region XII */
export const REGION_12_PROVINCES = [
  "South Cotabato",
  "Cotabato",
  "Sultan Kudarat",
  "Sarangani",
  "General Santos City",
] as const;

export type Region12Province = (typeof REGION_12_PROVINCES)[number];

/** Common cities and municipalities in Region XII */
export const REGION_12_LOCALITIES = [
  "Koronadal City",
  "General Santos City",
  "Kidapawan City",
  "Tacurong City",
  "Polomolok",
  "Surallah",
  "Tupi",
  "Banga",
  "Norala",
  "Sto. Niño",
  "Malungon",
  "Alabel",
  "Maasim",
  "Glan",
  "Malapatan",
  "Isulan",
  "Lambayong",
  "President Quirino",
  "Kabacan",
  "Midsayap",
  "M'lang",
] as const;

export const REGION_12_ADDRESS_PLACEHOLDER =
  "Street, Barangay, City/Municipality, Province (Region XII)";
