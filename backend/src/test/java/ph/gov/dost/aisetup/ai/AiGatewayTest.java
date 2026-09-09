/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.ai;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiGatewayTest {

    private final OpenAiClient openAi = mock(OpenAiClient.class);
    private final AnthropicClient anthropic = mock(AnthropicClient.class);
    private final AiProperties properties = new AiProperties();

    private AiGateway gateway() {
        return new AiGateway(openAi, anthropic, properties);
    }

    private void openAiConfigured() {
        when(openAi.isConfigured()).thenReturn(true);
        when(openAi.modelFor(AiTaskTier.SIMPLE)).thenReturn("gpt-5.6-luna");
        when(openAi.modelFor(AiTaskTier.NORMAL)).thenReturn("gpt-5.6-luna");
        when(openAi.modelFor(AiTaskTier.COMPLEX)).thenReturn("gpt-5.6-terra");
    }

    private void anthropicConfigured() {
        when(anthropic.isConfigured()).thenReturn(true);
        when(anthropic.modelFor(AiTaskTier.SIMPLE)).thenReturn("claude-sonnet-4-20250514");
        when(anthropic.modelFor(AiTaskTier.NORMAL)).thenReturn("claude-sonnet-4-20250514");
        when(anthropic.modelFor(AiTaskTier.COMPLEX)).thenReturn("claude-sonnet-4-20250514");
    }

    @Test
    void openAiServesRequestAndAnthropicStaysUnused() {
        openAiConfigured();
        anthropicConfigured();
        when(openAi.generateText(eq("gpt-5.6-luna"), anyString(), anyInt())).thenReturn("openai draft");

        String text = gateway().generateText(AiTaskTier.NORMAL, "draft the LOI body");

        assertEquals("openai draft", text);
        verify(anthropic, never()).generateText(anyString(), anyString(), anyInt());
    }

    @Test
    void tierSelectsTheConfiguredOpenAiModel() {
        openAiConfigured();
        when(openAi.generateText(eq("gpt-5.6-luna"), anyString(), anyInt())).thenReturn("simple draft");
        when(openAi.generateText(eq("gpt-5.6-terra"), anyString(), anyInt())).thenReturn("complex draft");

        AiGateway gateway = gateway();

        assertEquals("simple draft", gateway.generateText(AiTaskTier.SIMPLE, "field assist"));
        assertEquals("complex draft", gateway.generateText(AiTaskTier.COMPLEX, "full proposal"));
    }

    @Test
    void anthropicTakesOverWhenOpenAiFails() {
        openAiConfigured();
        anthropicConfigured();
        when(openAi.generateText(anyString(), anyString(), anyInt()))
                .thenThrow(new IllegalStateException("OpenAI API request failed"));
        when(anthropic.generateText(eq("claude-sonnet-4-20250514"), anyString(), anyInt()))
                .thenReturn("anthropic draft");

        assertEquals("anthropic draft", gateway().generateText(AiTaskTier.NORMAL, "draft the LOI body"));
    }

    @Test
    void anthropicTakesOverWhenOpenAiHasNoKey() {
        anthropicConfigured();
        when(anthropic.generateText(anyString(), anyString(), anyInt())).thenReturn("anthropic draft");

        assertEquals("anthropic draft", gateway().generateText(AiTaskTier.SIMPLE, "field assist"));
        verify(openAi, never()).generateText(anyString(), anyString(), anyInt());
    }

    @Test
    void bothProvidersFailingThrowsSoCallersUseTemplates() {
        openAiConfigured();
        anthropicConfigured();
        when(openAi.generateJsonObject(anyString(), anyString(), anyInt()))
                .thenThrow(new IllegalStateException("openai down"));
        when(anthropic.generateJsonObject(anyString(), anyString(), anyInt()))
                .thenThrow(new IllegalStateException("anthropic down"));

        IllegalStateException failure = assertThrows(
                IllegalStateException.class,
                () -> gateway().generateJsonObject(AiTaskTier.COMPLEX, "full proposal"));

        assertEquals("anthropic down", failure.getMessage());
        assertEquals(1, failure.getSuppressed().length, "OpenAI failure should be kept for diagnostics");
    }

    @Test
    void noProviderConfiguredThrows() {
        IllegalStateException failure = assertThrows(
                IllegalStateException.class,
                () -> gateway().generateBodyParagraphs(AiTaskTier.NORMAL, "draft the LOI body"));

        assertTrue(failure.getMessage().contains("OPENAI_API_KEY"), failure.getMessage());
    }

    @Test
    void defaultTierModelsKeepSolOptIn() {
        AiProperties.Tiers defaults = new AiProperties().getTiers();

        assertEquals("gpt-5.6-luna", defaults.modelFor(AiTaskTier.SIMPLE));
        assertEquals("gpt-5.6-luna", defaults.modelFor(AiTaskTier.NORMAL));
        assertEquals("gpt-5.6-terra", defaults.modelFor(AiTaskTier.COMPLEX));
    }

    @Test
    void isConfiguredReflectsEitherProvider() {
        assertFalse(gateway().isConfigured());

        when(anthropic.isConfigured()).thenReturn(true);
        assertTrue(gateway().isConfigured());

        when(anthropic.isConfigured()).thenReturn(false);
        when(openAi.isConfigured()).thenReturn(true);
        assertTrue(gateway().isConfigured());
    }
}
