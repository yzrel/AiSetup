package ph.gov.dost.aisetup.common;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class GadLanguagePolicyTest {

    @Test
    void writingRulesMentionGenderFairLanguage() {
        assertTrue(GadLanguagePolicy.WRITING_RULES.toLowerCase().contains("gender-fair"));
        assertTrue(GadLanguagePolicy.WRITING_RULES.toLowerCase().contains("non-sexist"));
        assertTrue(GadLanguagePolicy.WRITING_RULES.contains("manpower"));
    }

    @Test
    void involvementTemplateUsesProvidedCounts() {
        String text = GadLanguagePolicy.involvementTemplate("Demo Co", "12", "9");
        assertTrue(text.contains("Demo Co"));
        assertTrue(text.contains("12 male"));
        assertTrue(text.contains("9 female"));
        assertTrue(text.contains("Gender and Development"));
    }
}
