/**
 * Author: Yzrel Jade B. Eborde
 *
 * Server-side 5-year projection (parity with FE financialProjection.ts).
 */
package ph.gov.dost.aisetup.financeprojection;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public final class FinancialProjectionEngine {

    static final int YEARS = 5;
    private static final double COST_STEP = 1.01;
    private static final double STATUTORY_RATE = 0.13;
    private static final double SOLE_8_GROSS_CAP = 3_000_000;
    private static final double SOLE_8_EXEMPTION = 250_000;
    private static final double CIT_REDUCED_NI_CAP = 5_000_000;
    private static final double CIT_REDUCED_RATE = 0.2;
    private static final double CIT_STANDARD_RATE = 0.25;
    private static final double IDENTITY_TOLERANCE = 1.0;

    private FinancialProjectionEngine() {}

    public static Map<String, Object> compute(Map<String, Object> inputs) {
        if (inputs == null) {
            inputs = Map.of();
        }
        double equipmentTotal = sumNamed(inputs.get("equipment"));
        double preoperatingTotal = sumNamed(inputs.get("preoperating"));
        double eqLife = weightedLife(inputs.get("equipment"), equipmentTotal);
        double preLife = weightedLife(inputs.get("preoperating"), preoperatingTotal);
        double depreciationAnnual = equipmentTotal > 0 ? round2(equipmentTotal / eqLife) : 0;
        double amortizationAnnual = preoperatingTotal > 0 ? round2(preoperatingTotal / preLife) : 0;

        double[] y1 = year1SalesAndCos(inputs.get("products"));
        double salesGrowth = num(inputs.get("salesGrowth"));
        double cosIncrease = num(inputs.get("cosIncrease"));
        double salaryIncrease = num(inputs.get("salaryIncrease"));
        double inflation = num(inputs.get("inflation"));

        double[] grossSales = zeros();
        double[] costOfSales = zeros();
        grossSales[0] = y1[0];
        costOfSales[0] = y1[1];
        for (int y = 1; y < YEARS; y++) {
            grossSales[y] = round2(grossSales[y - 1] * (1 + salesGrowth));
            costOfSales[y] = round2(costOfSales[y - 1] * (1 + cosIncrease));
        }
        double[] grossProfit = zeros();
        double[] gpPercent = zeros();
        for (int y = 0; y < YEARS; y++) {
            grossProfit[y] = round2(grossSales[y] - costOfSales[y]);
            gpPercent[y] = grossSales[y] > 0 ? grossProfit[y] / grossSales[y] : 0;
        }

        double[] marketing = growSeries(num(inputs.get("marketing")), inflation, false);
        double[] salaries = growSeries(num(inputs.get("salaries")), salaryIncrease, false);
        double[] logistics = growSeries(num(inputs.get("logistics")), inflation, false);
        double[] itSoftware = growSeries(num(inputs.get("itSoftware")), inflation, false);
        double[] transportation = growSeries(num(inputs.get("transportation")), inflation, false);
        double[] rental = growSeries(num(inputs.get("rental")), 0, true);
        double[] utilities = growSeries(num(inputs.get("utilities")), inflation, false);
        double[] communication = growSeries(num(inputs.get("communication")), inflation, false);
        double[] taxesLicenses = growSeries(num(inputs.get("taxesLicenses")), 0, true);
        double[] otherExpenses = growSeries(num(inputs.get("otherExpenses")), inflation, false);
        double[] statutory = zeros();
        double[] thirteenth = zeros();
        double[] depreciation = zeros();
        double[] amortization = zeros();
        double[] assetsNet = zeros();
        double[] preopNet = zeros();
        double[] totalOpex = zeros();
        double eqNbv = equipmentTotal;
        double preNbv = preoperatingTotal;
        for (int y = 0; y < YEARS; y++) {
            statutory[y] = round2(salaries[y] * STATUTORY_RATE);
            thirteenth[y] = round2(salaries[y] / 12.0);
            depreciation[y] = round2(Math.min(depreciationAnnual, Math.max(0, eqNbv)));
            amortization[y] = round2(Math.min(amortizationAnnual, Math.max(0, preNbv)));
            eqNbv = round2(Math.max(0, eqNbv - depreciation[y]));
            preNbv = round2(Math.max(0, preNbv - amortization[y]));
            assetsNet[y] = eqNbv;
            preopNet[y] = preNbv;
            totalOpex[y] = round2(
                    marketing[y] + salaries[y] + statutory[y] + thirteenth[y]
                            + logistics[y] + itSoftware[y] + transportation[y]
                            + rental[y] + utilities[y] + communication[y]
                            + taxesLicenses[y] + otherExpenses[y]
                            + depreciation[y] + amortization[y]);
        }

        double loanAmount = Math.max(0, num(inputs.get("loanAmount")));
        int term = Math.max(1, (int) Math.round(num(inputs.get("loanTermYears")) == 0 ? 5 : num(inputs.get("loanTermYears"))));
        double rate = Math.max(0, num(inputs.get("loanInterestRate")));
        double annualPrincipal = loanAmount > 0 ? round2(loanAmount / term) : 0;
        double[] interest = zeros();
        double[] principal = zeros();
        double remaining = loanAmount;
        for (int y = 0; y < YEARS; y++) {
            interest[y] = round2(remaining * rate);
            principal[y] = remaining > 0 ? Math.min(annualPrincipal, remaining) : 0;
            remaining = round2(Math.max(0, remaining - principal[y]));
        }

        double[] noi = zeros();
        double[] niBeforeTax = zeros();
        double[] incomeTax = zeros();
        double[] niAfterTax = zeros();
        double[] npm = zeros();
        String taxMethod = stringVal(inputs.get("taxMethod"), "sole8");
        for (int y = 0; y < YEARS; y++) {
            noi[y] = round2(grossProfit[y] - totalOpex[y]);
            niBeforeTax[y] = round2(noi[y] - interest[y]);
            incomeTax[y] = computeIncomeTax(taxMethod, grossSales[y], niBeforeTax[y]);
            niAfterTax[y] = round2(niBeforeTax[y] - incomeTax[y]);
            npm[y] = grossSales[y] > 0 ? niAfterTax[y] / grossSales[y] : 0;
        }
        double[] retainedEarnings = zeros();
        retainedEarnings[0] = niAfterTax[0];
        for (int y = 1; y < YEARS; y++) {
            retainedEarnings[y] = round2(retainedEarnings[y - 1] + niAfterTax[y]);
        }

        double[] refund = refundSeries(inputs.get("setupRefundByYear"));
        double setupTotal = 0;
        for (double r : refund) {
            setupTotal = round2(setupTotal + r);
        }
        double[] setupProceeds = zeros();
        setupProceeds[0] = setupTotal;
        double[] setupPayable = zeros();
        for (int y = 0; y < YEARS; y++) {
            double remain = 0;
            for (int i = y + 1; i < YEARS; i++) {
                remain += refund[i];
            }
            setupPayable[y] = round2(remain);
        }
        double equity = round2(num(inputs.get("equity")));
        double inventoryY1 = round2(num(inputs.get("inventoryYear1")));
        double[] inventoryOut = zeros();
        inventoryOut[0] = inventoryY1;
        double[] cashOpex = zeros();
        double[] loanProceeds = zeros();
        double[] equityIn = zeros();
        double[] capex = zeros();
        double[] preopOut = zeros();
        loanProceeds[0] = loanAmount;
        equityIn[0] = equity;
        capex[0] = equipmentTotal;
        preopOut[0] = preoperatingTotal;
        double[] net = zeros();
        for (int y = 0; y < YEARS; y++) {
            cashOpex[y] = round2(totalOpex[y] - depreciation[y] - amortization[y]);
            double inflow = grossSales[y] + loanProceeds[y] + equityIn[y] + setupProceeds[y];
            double outflow = costOfSales[y] + inventoryOut[y] + cashOpex[y] + capex[y]
                    + preopOut[y] + principal[y] + interest[y] + incomeTax[y] + refund[y];
            net[y] = round2(inflow - outflow);
        }

        double[] cash = zeros();
        cash[0] = net[0];
        for (int y = 1; y < YEARS; y++) {
            cash[y] = round2(cash[y - 1] + net[y]);
        }
        double[] inventory = zeros();
        for (int y = 0; y < YEARS; y++) {
            inventory[y] = inventoryY1;
        }
        double[] loansPayable = zeros();
        double loanBal = loanAmount;
        for (int y = 0; y < YEARS; y++) {
            loanBal = round2(Math.max(0, loanBal - principal[y]));
            loansPayable[y] = loanBal;
        }
        double[] capital = zeros();
        double[] totalAssets = zeros();
        double[] totalEquity = zeros();
        double[] totalLAndE = zeros();
        double[] identityDiff = zeros();
        boolean balanced = true;
        for (int y = 0; y < YEARS; y++) {
            capital[y] = equity;
            totalAssets[y] = round2(cash[y] + inventory[y] + assetsNet[y] + preopNet[y]);
            totalEquity[y] = round2(capital[y] + retainedEarnings[y]);
            totalLAndE[y] = round2(loansPayable[y] + setupPayable[y] + totalEquity[y]);
            identityDiff[y] = round2(totalAssets[y] - totalLAndE[y]);
            if (Math.abs(identityDiff[y]) > IDENTITY_TOLERANCE) {
                balanced = false;
            }
        }

        double investment = round2(equipmentTotal + preoperatingTotal);
        List<Map<String, Object>> ratios = new ArrayList<>();
        for (int y = 0; y < YEARS; y++) {
            double currentAssets = round2(cash[y] + inventory[y]);
            double currentLiabilities = round2(loansPayable[y] + setupPayable[y]);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("year", y + 1);
            row.put("currentAssets", currentAssets);
            row.put("inventory", inventory[y]);
            row.put("currentLiabilities", currentLiabilities);
            row.put("liquidity", currentLiabilities > 0 ? currentAssets / currentLiabilities : null);
            row.put("quick", currentLiabilities > 0 ? (currentAssets - inventory[y]) / currentLiabilities : null);
            row.put("netIncome", niAfterTax[y]);
            row.put("investment", investment);
            row.put("roi", investment > 0 ? niAfterTax[y] / investment : null);
            ratios.add(row);
        }

        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("years", List.of(1, 2, 3, 4, 5));
        snapshot.put("depreciationAnnual", depreciationAnnual);
        snapshot.put("amortizationAnnual", amortizationAnnual);
        snapshot.put("equipmentTotal", equipmentTotal);
        snapshot.put("preoperatingTotal", preoperatingTotal);
        snapshot.put("incomeStatement", isMap(
                grossSales, costOfSales, grossProfit, gpPercent,
                marketing, salaries, statutory, thirteenth, logistics, itSoftware,
                transportation, rental, utilities, communication, taxesLicenses, otherExpenses,
                depreciation, amortization, totalOpex, noi, interest, niBeforeTax, incomeTax,
                niAfterTax, npm, retainedEarnings));
        Map<String, Object> cf = new LinkedHashMap<>();
        cf.put("grossSales", list(grossSales));
        cf.put("loanProceeds", list(loanProceeds));
        cf.put("equity", list(equityIn));
        cf.put("setupProceeds", list(setupProceeds));
        cf.put("costOfSales", list(costOfSales));
        cf.put("inventory", list(inventoryOut));
        cf.put("cashOpex", list(cashOpex));
        cf.put("capex", list(capex));
        cf.put("preoperating", list(preopOut));
        cf.put("principal", list(principal));
        cf.put("interest", list(interest));
        cf.put("incomeTax", list(incomeTax));
        cf.put("setupRefund", list(refund));
        cf.put("net", list(net));
        snapshot.put("cashFlow", cf);
        Map<String, Object> bs = new LinkedHashMap<>();
        bs.put("cash", list(cash));
        bs.put("inventory", list(inventory));
        bs.put("assetsNet", list(assetsNet));
        bs.put("preopNet", list(preopNet));
        bs.put("totalAssets", list(totalAssets));
        bs.put("loansPayable", list(loansPayable));
        bs.put("setupPayable", list(setupPayable));
        bs.put("capital", list(capital));
        bs.put("retainedEarnings", list(retainedEarnings));
        bs.put("totalEquity", list(totalEquity));
        bs.put("totalLAndE", list(totalLAndE));
        bs.put("identityDiff", list(identityDiff));
        snapshot.put("balanceSheet", bs);
        snapshot.put("ratios", ratios);
        snapshot.put("npv", excelNpv(rate, net));
        snapshot.put("irr", irrNewton(net, rate > 0 ? rate : 0.1));
        snapshot.put("balanced", balanced);
        return snapshot;
    }

    static double computeIncomeTax(String method, double grossSales, double niBeforeTax) {
        if ("sole8".equals(method)) {
            if (grossSales <= 0) {
                return 0;
            }
            if (grossSales <= SOLE_8_GROSS_CAP) {
                return round2(Math.max(0, grossSales - SOLE_8_EXEMPTION) * 0.08);
            }
            return round2(graduatedPit(niBeforeTax));
        }
        if ("soleGraduated".equals(method)) {
            return round2(graduatedPit(niBeforeTax));
        }
        double citRate = niBeforeTax <= CIT_REDUCED_NI_CAP ? CIT_REDUCED_RATE : CIT_STANDARD_RATE;
        return round2(Math.max(0, niBeforeTax) * citRate);
    }

    static double graduatedPit(double taxable) {
        double t = Math.max(0, taxable);
        if (t <= 250_000) {
            return 0;
        }
        if (t <= 400_000) {
            return 0.15 * (t - 250_000);
        }
        if (t <= 800_000) {
            return 22_500 + 0.2 * (t - 400_000);
        }
        if (t <= 2_000_000) {
            return 102_500 + 0.25 * (t - 800_000);
        }
        if (t <= 8_000_000) {
            return 402_500 + 0.3 * (t - 2_000_000);
        }
        return 2_202_500 + 0.35 * (t - 8_000_000);
    }

    static Double excelNpv(double rate, double[] values) {
        double total = 0;
        for (int i = 0; i < values.length; i++) {
            total += values[i] / Math.pow(1 + rate, i + 1);
        }
        return Double.isFinite(total) ? round2(total) : null;
    }

    static boolean hasSignChange(double[] cashFlows) {
        boolean pos = false;
        boolean neg = false;
        for (double cf : cashFlows) {
            if (cf > 0) {
                pos = true;
            }
            if (cf < 0) {
                neg = true;
            }
            if (pos && neg) {
                return true;
            }
        }
        return false;
    }

    static Double irrNewtonOnce(double[] cashFlows, double guess) {
        double r = guess;
        double scale = 0;
        for (double cf : cashFlows) {
            scale += Math.abs(cf);
        }
        scale = Math.max(1.0, scale);
        for (int i = 0; i < 80; i++) {
            double npv = 0;
            double deriv = 0;
            for (int t = 0; t < cashFlows.length; t++) {
                double den = Math.pow(1 + r, t);
                if (!Double.isFinite(den) || den == 0) {
                    return null;
                }
                npv += cashFlows[t] / den;
                deriv -= (t * cashFlows[t]) / Math.pow(1 + r, t + 1);
            }
            if (!Double.isFinite(npv) || !Double.isFinite(deriv) || Math.abs(deriv) < 1e-12) {
                return null;
            }
            double next = r - npv / deriv;
            if (!Double.isFinite(next) || next <= -0.999 || next > 10) {
                return null;
            }
            if (Math.abs(next - r) < 1e-8) {
                return Math.abs(npv) < 1e-4 * scale ? next : null;
            }
            r = next;
        }
        return null;
    }

    static Double irrNewton(double[] cashFlows, double guess) {
        if (cashFlows.length < 2 || !hasSignChange(cashFlows)) {
            return null;
        }
        double[] guesses = {guess, 0.1, 0.0, -0.1, 0.5, -0.5, 1.0};
        for (double g : guesses) {
            Double found = irrNewtonOnce(cashFlows, g);
            if (found != null && Math.abs(found) <= 5) {
                return found;
            }
        }
        return null;
    }

    private static Map<String, Object> isMap(
            double[] grossSales, double[] costOfSales, double[] grossProfit, double[] gpPercent,
            double[] marketing, double[] salaries, double[] statutory, double[] thirteenth,
            double[] logistics, double[] itSoftware, double[] transportation, double[] rental,
            double[] utilities, double[] communication, double[] taxesLicenses, double[] otherExpenses,
            double[] depreciation, double[] amortization, double[] totalOpex, double[] noi,
            double[] interest, double[] niBeforeTax, double[] incomeTax, double[] niAfterTax,
            double[] npm, double[] retainedEarnings) {
        Map<String, Object> is = new LinkedHashMap<>();
        is.put("grossSales", list(grossSales));
        is.put("costOfSales", list(costOfSales));
        is.put("grossProfit", list(grossProfit));
        is.put("gpPercent", list(gpPercent));
        is.put("marketing", list(marketing));
        is.put("salaries", list(salaries));
        is.put("statutory", list(statutory));
        is.put("thirteenth", list(thirteenth));
        is.put("logistics", list(logistics));
        is.put("itSoftware", list(itSoftware));
        is.put("transportation", list(transportation));
        is.put("rental", list(rental));
        is.put("utilities", list(utilities));
        is.put("communication", list(communication));
        is.put("taxesLicenses", list(taxesLicenses));
        is.put("otherExpenses", list(otherExpenses));
        is.put("depreciation", list(depreciation));
        is.put("amortization", list(amortization));
        is.put("totalOpex", list(totalOpex));
        is.put("noi", list(noi));
        is.put("interest", list(interest));
        is.put("niBeforeTax", list(niBeforeTax));
        is.put("incomeTax", list(incomeTax));
        is.put("niAfterTax", list(niAfterTax));
        is.put("npm", list(npm));
        is.put("retainedEarnings", list(retainedEarnings));
        return is;
    }

    private static double[] growSeries(double year1, double rate, boolean fixed) {
        double[] out = zeros();
        out[0] = round2(year1);
        for (int y = 1; y < YEARS; y++) {
            out[y] = fixed ? out[0] : round2(out[y - 1] * (1 + rate));
        }
        return out;
    }

    private static double[] year1SalesAndCos(Object productsRaw) {
        double sales = 0;
        double cos = 0;
        if (productsRaw instanceof List<?> list) {
            for (Object item : list) {
                if (!(item instanceof Map<?, ?> m)) {
                    continue;
                }
                double costQ1 = num(m.get("costQ1"));
                double[] costs = {
                    costQ1,
                    costQ1 * COST_STEP,
                    costQ1 * COST_STEP * COST_STEP,
                    costQ1 * COST_STEP * COST_STEP * COST_STEP
                };
                double srp1 = num(m.get("srpQ1"));
                double[] srps = {
                    srp1,
                    num(m.get("srpQ2")) == 0 ? srp1 : num(m.get("srpQ2")),
                    num(m.get("srpQ3")) == 0 ? srp1 : num(m.get("srpQ3")),
                    num(m.get("srpQ4")) == 0 ? srp1 : num(m.get("srpQ4"))
                };
                double[] qtys = {
                    num(m.get("qtyQ1")), num(m.get("qtyQ2")), num(m.get("qtyQ3")), num(m.get("qtyQ4"))
                };
                for (int q = 0; q < 4; q++) {
                    sales += qtys[q] * srps[q];
                    cos += qtys[q] * costs[q];
                }
            }
        }
        return new double[] { round2(sales), round2(cos) };
    }

    private static double sumNamed(Object raw) {
        double total = 0;
        if (raw instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    total += Math.max(0, num(m.get("amount")));
                }
            }
        }
        return round2(total);
    }

    private static double weightedLife(Object raw, double total) {
        if (total <= 0) {
            return 5;
        }
        double weighted = 0;
        if (raw instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    double amt = Math.max(0, num(m.get("amount")));
                    double life = num(m.get("lifeYears"));
                    if (life < 1) {
                        life = 5;
                    }
                    weighted += amt * life;
                }
            }
        }
        return weighted / total;
    }

    private static double[] refundSeries(Object raw) {
        double[] out = zeros();
        if (raw instanceof List<?> list) {
            for (int i = 0; i < YEARS && i < list.size(); i++) {
                out[i] = round2(num(list.get(i)));
            }
        }
        return out;
    }

    private static double[] zeros() {
        return new double[YEARS];
    }

    private static List<Double> list(double[] arr) {
        List<Double> out = new ArrayList<>(arr.length);
        for (double v : arr) {
            out.add(v);
        }
        return out;
    }

    private static double num(Object value) {
        if (value instanceof Number n) {
            return n.doubleValue();
        }
        if (value == null) {
            return 0;
        }
        String s = String.valueOf(value).replaceAll("[^0-9.\\-]", "");
        if (s.isBlank() || "-".equals(s) || ".".equals(s)) {
            return 0;
        }
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException ex) {
            return 0;
        }
    }

    private static String stringVal(Object value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String s = String.valueOf(value).trim();
        return s.isEmpty() ? fallback : s;
    }

    static double round2(double n) {
        if (!Double.isFinite(n)) {
            return 0;
        }
        return Math.round(n * 100.0) / 100.0;
    }
}
