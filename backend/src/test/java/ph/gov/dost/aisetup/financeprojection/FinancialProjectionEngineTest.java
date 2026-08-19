/**
 * Author: Yzrel Jade B. Eborde
 */
package ph.gov.dost.aisetup.financeprojection;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class FinancialProjectionEngineTest {

    @Test
    void emptyInputsDoNotDivideByZeroAndBalance() {
        Map<String, Object> snap = FinancialProjectionEngine.compute(Map.of());
        assertEquals(Boolean.TRUE, snap.get("balanced"));
        @SuppressWarnings("unchecked")
        Map<String, Object> is = (Map<String, Object>) snap.get("incomeStatement");
        @SuppressWarnings("unchecked")
        List<Number> sales = (List<Number>) is.get("grossSales");
        assertEquals(0.0, sales.get(0).doubleValue(), 0.001);
    }

    @Test
    void straightLineDepreciationAndSetupRefundLine() {
        Map<String, Object> inputs = Map.ofEntries(
                Map.entry("equipment", List.of(Map.of("name", "Dryer", "amount", 500_000, "lifeYears", 5))),
                Map.entry("preoperating", List.of(Map.of("name", "Dev", "amount", 50_000, "lifeYears", 5))),
                Map.entry("products", List.of(Map.of(
                        "name", "Mango",
                        "srpQ1", 100, "srpQ2", 100, "srpQ3", 100, "srpQ4", 100,
                        "costQ1", 40,
                        "qtyQ1", 1000, "qtyQ2", 1000, "qtyQ3", 1000, "qtyQ4", 1000))),
                Map.entry("loanAmount", 200_000),
                Map.entry("loanTermYears", 5),
                Map.entry("loanInterestRate", 0.1),
                Map.entry("equity", 300_000),
                Map.entry("inventoryYear1", 20_000),
                Map.entry("salesGrowth", 0.1),
                Map.entry("salaries", 120_000),
                Map.entry("taxMethod", "sole8"),
                Map.entry("setupRefundByYear", List.of(0, 50_000, 50_000, 50_000, 50_000)));
        Map<String, Object> snap = FinancialProjectionEngine.compute(inputs);
        assertEquals(500_000.0, ((Number) snap.get("equipmentTotal")).doubleValue(), 0.01);
        assertEquals(100_000.0, ((Number) snap.get("depreciationAnnual")).doubleValue(), 0.01);
        @SuppressWarnings("unchecked")
        Map<String, Object> cf = (Map<String, Object>) snap.get("cashFlow");
        @SuppressWarnings("unchecked")
        List<Number> refund = (List<Number>) cf.get("setupRefund");
        assertEquals(0.0, refund.get(0).doubleValue(), 0.01);
        assertEquals(50_000.0, refund.get(1).doubleValue(), 0.01);
        assertEquals(Boolean.TRUE, snap.get("balanced"));
    }

    @Test
    void soleEightPercentOfGrossInExcessOfExemption() {
        assertEquals(0.0, FinancialProjectionEngine.computeIncomeTax("sole8", 200_000, 50_000), 0.01);
        assertEquals(12_000.0, FinancialProjectionEngine.computeIncomeTax("sole8", 400_000, 50_000), 0.01);
        assertEquals(220_000.0, FinancialProjectionEngine.computeIncomeTax("sole8", 3_000_000, 50_000), 0.01);
        assertEquals(
                42_500.0,
                FinancialProjectionEngine.computeIncomeTax("sole8", 3_000_000.01, 500_000),
                0.01);
    }

    @Test
    void shortAssetLifeStopsDepreciationAndStaysBalanced() {
        Map<String, Object> inputs = Map.ofEntries(
                Map.entry("equipment", List.of(Map.of("name", "Dryer", "amount", 300_000, "lifeYears", 3))),
                Map.entry("preoperating", List.of(Map.of("name", "Dev", "amount", 30_000, "lifeYears", 3))),
                Map.entry("products", List.of(Map.of(
                        "name", "Mango",
                        "srpQ1", 100, "srpQ2", 100, "srpQ3", 100, "srpQ4", 100,
                        "costQ1", 40,
                        "qtyQ1", 1000, "qtyQ2", 1000, "qtyQ3", 1000, "qtyQ4", 1000))),
                Map.entry("loanAmount", 200_000),
                Map.entry("loanTermYears", 5),
                Map.entry("loanInterestRate", 0.1),
                Map.entry("equity", 300_000),
                Map.entry("inventoryYear1", 20_000),
                Map.entry("taxMethod", "sole8"),
                Map.entry("setupRefundByYear", List.of(0, 50_000, 50_000, 50_000, 50_000)));
        Map<String, Object> snap = FinancialProjectionEngine.compute(inputs);
        assertEquals(100_000.0, ((Number) snap.get("depreciationAnnual")).doubleValue(), 0.01);
        @SuppressWarnings("unchecked")
        Map<String, Object> is = (Map<String, Object>) snap.get("incomeStatement");
        @SuppressWarnings("unchecked")
        List<Number> dep = (List<Number>) is.get("depreciation");
        assertEquals(100_000.0, dep.get(0).doubleValue(), 0.01);
        assertEquals(100_000.0, dep.get(2).doubleValue(), 0.01);
        assertEquals(0.0, dep.get(3).doubleValue(), 0.01);
        assertEquals(Boolean.TRUE, snap.get("balanced"));
    }

    @Test
    void irrMatchesExcelWhenSignChangesAndIsNullOtherwise() {
        assertEquals(0.1, FinancialProjectionEngine.irrNewton(new double[] {-100, 110}, 0.1), 1e-6);
        assertNull(FinancialProjectionEngine.irrNewton(new double[] {-1, -1, -1, -1, -1}, 0.1));
    }
}
