package ph.gov.dost.aisetup.common;

/**
 * DOST Gender and Development (GAD) writing rules for AI-assisted content.
 * Aligns with DOST / CSC non-sexist language practice and Magna Carta of Women.
 */
public final class GadLanguagePolicy {

    private GadLanguagePolicy() {}

    /**
     * Bullet lines for inclusion under "Writing standards" / prompt instructions.
     * Prefixed with "- " so they drop into existing prompt lists.
     */
    public static final String WRITING_RULES = """
            - Use gender-fair, non-sexist language consistent with DOST GAD guidelines (CSC non-sexist language; Magna Carta of Women)
            - Do not use generic masculine forms (he/him/his as default, "manpower", "chairman", "businessman"); prefer gender-neutral terms (workforce, chairperson, business owner) or plural ("they")
            - When employment or participation data include male and female counts, acknowledge both women and men equitably; do not erase or minimize either
            - Do not invent gender composition, roles, or ratios not present in the provided data
            - Prefer inclusive job titles and avoid stereotypes about who performs which work""".stripIndent().trim();

    /** Single-line reminder for compact prompts. */
    public static final String SHORT_RULE =
            "Use gender-fair, non-sexist language (DOST GAD); do not invent gender facts; acknowledge women and men when M/F counts are provided.";

    /** Deterministic GAD involvement paragraph from sex-disaggregated headcounts. */
    public static String involvementTemplate(String enterprise, String maleCount, String femaleCount) {
        String ent = (enterprise == null || enterprise.isBlank()) ? "The enterprise" : enterprise.trim();
        String male = (maleCount == null || maleCount.isBlank()) ? "0" : maleCount.trim();
        String female = (femaleCount == null || femaleCount.isBlank()) ? "0" : femaleCount.trim();
        return """
                %s employs %s male and %s female workers in its operations. Women and men participate in production and related functions, and the SETUP intervention is intended to benefit the workforce equitably through skills upgrading and improved working conditions, consistent with DOST Gender and Development (GAD) principles. The enterprise affirms equal opportunity regardless of sex or gender in hiring, training, and advancement."""
                .formatted(ent, male, female);
    }
}
