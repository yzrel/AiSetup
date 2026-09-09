/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

/**
 * Task complexity tier used by {@link AiGateway} to pick a model.
 * SIMPLE/NORMAL/COMPLEX map to the Luna/Terra/Sol models in
 * {@code aisetup.ai.tiers}; routing is fixed per feature, not classified at runtime.
 */
public enum AiTaskTier {

    /** Short single-field drafting (AI Assist, public register description). */
    SIMPLE,

    /** Letter-length narrative and staff freeform completion. */
    NORMAL,

    /** Full multi-section documents and financial assessment. */
    COMPLEX
}
