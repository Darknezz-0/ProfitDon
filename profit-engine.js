// ProfitDon — verified calculation engine (portable snapshot)
// All inputs are user-entered (manual) unless a provider adapter supplies them.
// Results are recommendations only, not guarantees, and not financial advice.
//
// DON Advisor weights (documented in the rebuild):
//   ROI 35%, Margin 30%, Fee Efficiency 20%, Price Buffer 15%
// DON thresholds are DRAFT ONLY and owner-editable:
//   BUY >= 70, CAUTION >= 45, otherwise PASS (all labelled DRAFT in the app).
// Prices are NOT finalized anywhere in this snapshot.
// Component scoring below is a documented approximation using those weights
// and thresholds. It preserves the verified net/ROI/margin/break-even/max-buy
// math and the verdict band, but it does not claim to reproduce the Muse
// artifact's exact internal DON score (61 for the $120 example).

export const DON_WEIGHTS = { roi: 0.35, margin: 0.30, feeEfficiency: 0.20, priceBuffer: 0.15 };
export const DON_THRESHOLDS_DRAFT = { buy: 70, caution: 45 };

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function round2(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

// Total cost basis = buy cost + all included fees/expenses.
// referralFee may be passed as a flat amount, or as referralRate (e.g. 0.15)
// applied to the selling price.
export function analyze(input = {}) {
  const sell = num(input.sellPrice);
  const buy = num(input.buyCost);
  const tax = num(input.tax);
  const shipping = num(input.shipping);
  const prep = num(input.prep);
  const packaging = num(input.packaging);
  const referralFlat = num(input.referralFee);
  const referralRate = num(input.referralRate);
  const fulfillment = num(input.fulfillment);
  const otherFees = num(input.otherFees);
  const returnReserve = num(input.returnReserve);

  const referral = referralFlat + sell * referralRate;
  const totalFees = referral + fulfillment + otherFees;
  const invested = buy + tax + shipping + prep + packaging + returnReserve;
  const totalCost = invested + totalFees;
  const net = sell - totalCost;
  const margin = sell > 0 ? net / sell : 0;
  const roi = invested > 0 ? net / invested : 0;

  // Break-even: resale price where net = 0, holding the non-referral costs
  // fixed and referral as a rate on price. If referralRate >= 1, no solution.
  let breakEven = null;
  if (referralRate < 1) {
    breakEven = (invested + fulfillment + otherFees) / (1 - referralRate);
  }

  // Max buy cost still meeting a target ROI and/or target margin.
  // targetRoi is a fraction (e.g. 0.40 = 40%). targetMargin likewise.
  // For ROI: net / invested >= targetRoi, with invested = maxBuy + fixedCosts.
  // For margin: net / sell >= targetMargin  =>  maxBuy <= sell*(1-targetMargin) - fixedCosts - fees.
  const fixedCosts = tax + shipping + prep + packaging + returnReserve;
  const nonBuyFees = totalFees; // referral + fulfillment + otherFees
  let maxBuy = null;
  const candidates = [];
  if (input.targetRoi !== undefined && input.targetRoi !== null && input.targetRoi !== '') {
    const t = num(input.targetRoi);
    // net = sell - (maxBuy + fixedCosts + nonBuyFees); invested = maxBuy + fixedCosts
    // net >= t * invested  =>  sell - nonBuyFees - fixedCosts*(1+t) >= maxBuy*(1+t)
    candidates.push((sell - nonBuyFees - fixedCosts * (1 + t)) / (1 + t));
  }
  if (input.targetMargin !== undefined && input.targetMargin !== null && input.targetMargin !== '') {
    const t = num(input.targetMargin);
    candidates.push(sell * (1 - t) - fixedCosts - nonBuyFees);
  }
  if (candidates.length) maxBuy = Math.min(...candidates);

  // DON Score component scores (0-100), explained, not hidden.
  // ROI score: 0 at <=0%, 100 at >=100% ROI (linear in between).
  // Margin score: 0 at <=0%, 100 at >=50% margin.
  // Fee efficiency: 100 when fees are 0% of sell price, 0 at >=50%.
  // Price buffer: 100 when break-even is far below sell price, 0 at break-even >= sell.
  const roiScore = clamp01(roi / 1) * 100;
  const marginScore = clamp01(margin / 0.5) * 100;
  const feeRatio = sell > 0 ? totalFees / sell : 0;
  const feeScore = clamp01(1 - feeRatio / 0.5) * 100;
  const bufferScore = breakEven !== null && sell > 0
    ? clamp01((sell - breakEven) / sell) * 100
    : 0;

  const donScore = round2(
    roiScore * DON_WEIGHTS.roi +
    marginScore * DON_WEIGHTS.margin +
    feeScore * DON_WEIGHTS.feeEfficiency +
    bufferScore * DON_WEIGHTS.priceBuffer
  );
  const verdict = donScore >= DON_THRESHOLDS_DRAFT.buy
    ? 'BUY (DRAFT)'
    : donScore >= DON_THRESHOLDS_DRAFT.caution
      ? 'CAUTION (DRAFT)'
      : 'PASS (DRAFT)';

  // Risk flags — plain, checkable conditions, not invented market data.
  const risks = [];
  if (net <= 0) risks.push('Losing money at this selling price.');
  if (margin > 0 && margin < 0.15) risks.push('Thin margin: small cost changes can erase profit.');
  if (roi > 0 && roi < 0.2) risks.push('Low ROI for the capital tied up.');
  if (breakEven !== null && sell > 0 && (sell - breakEven) / sell < 0.2) risks.push('Small price buffer above break-even.');
  if (!input.hasIdentifier) risks.push('No product identifier supplied — match not confirmed.');
  if (!input.feesConfirmed) risks.push('Fees are estimates, not confirmed provider fees.');

  // Confidence grade from input completeness only — never from live data here.
  const confidence = (!input.hasIdentifier || !input.feesConfirmed)
    ? 'Low'
    : 'Medium';

  return {
    sellPrice: round2(sell),
    buyCost: round2(buy),
    referralFee: round2(referral),
    fulfillmentFee: round2(fulfillment),
    otherFees: round2(otherFees),
    totalFees: round2(totalFees),
    investedCost: round2(invested),
    totalCost: round2(totalCost),
    netProfit: round2(net),
    marginPct: round2(margin * 100),
    roiPct: round2(roi * 100),
    breakEvenPrice: breakEven === null ? null : round2(breakEven),
    maxBuyCost: maxBuy === null ? null : round2(maxBuy),
    donScore,
    verdict,
    components: {
      roi: round2(roiScore),
      margin: round2(marginScore),
      feeEfficiency: round2(feeScore),
      priceBuffer: round2(bufferScore),
    },
    risks,
    confidence,
    dataSource: 'manual',
    nextSteps: [
      'Confirm the exact product match (identifier, variant, condition) before buying.',
      'Confirm referral and fulfillment fees from the marketplace, do not rely on estimates alone.',
      'Re-run this analysis with confirmed fees; if margin or ROI falls below your target, pass or renegotiate buy cost.',
      'Save the deal to the Deal Vault with the assumptions shown above.',
    ],
  };
}

// Verified examples (hand-checked, also in README.md):
// analyze({sellPrice:90, buyCost:53, referralFee:0, fulfillment:0, otherFees:19})
//   => net 18, ROI 33.96%, margin 20%, break-even 72 (with referralRate 0).
// analyze({sellPrice:120, buyCost:60, referralRate:0.15, fulfillment:8})
//   => net 34, ROI 56.7%, break-even 80.
