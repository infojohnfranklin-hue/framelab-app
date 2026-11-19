import { getAuth } from "@clerk/nextjs/server";
import {
  FREE_CREDIT_LIMIT,
  getCreditSnapshot,
} from "../../lib/credits";
import { getEffectiveUserPlan, isPremivateOwner, supabase } from "../../lib/pro";
import { isCreditLedgerEnabled, readCreditBalance } from "../../lib/credit-balance";
import { isTopupSalesEnabled } from "../../lib/credit-topup";
import { assertAccountNotDeleting } from "../../lib/account-deletion";
import { hasAnyActivatedPrepaymentMarket } from "../../lib/prepayment-eligibility";

function isTopupSalesAvailable(env = process.env) {
  return hasAnyActivatedPrepaymentMarket() && isTopupSalesEnabled(env);
}

export default async function handler(req, res) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(200).json({
        used: 0,
        reserved: 0,
        remaining: FREE_CREDIT_LIMIT,
      });
    }

    await assertAccountNotDeleting(supabase, userId, process.env);

    if (isPremivateOwner(userId)) {
      return res.status(200).json({
        used: 0,
        reserved: 0,
        remaining: null,
        plan: "pro",
        unlimited: true,
        ownerUnlimited: true,
        ledgerEnabled: isCreditLedgerEnabled(process.env),
        topupSalesEnabled: isTopupSalesAvailable(process.env),
      });
    }

    if (isCreditLedgerEnabled(process.env)) {
      const plan = await getEffectiveUserPlan(userId);
      try {
        let balance;
        try {
          balance = await readCreditBalance(supabase, userId);
        } catch (error) {
          const accountMissing =
            error?.code === "P0002" ||
            (typeof error?.message === "string" &&
              error.message.includes("CREDIT_ACCOUNT_NOT_FOUND"));
          if (plan === "pro" || !accountMissing) throw error;
          balance = {
            purchasedAvailable: 0,
            purchasedHeld: 0,
            creditAccessBlocked: false,
          };
        }
        if (plan === "pro") {
          return res.status(200).json({
            ...balance,
            plan: "pro",
            ledgerEnabled: true,
            topupSalesEnabled: isTopupSalesAvailable(process.env),
          });
        }
        const snapshot = await getCreditSnapshot(userId);
        return res.status(200).json({
          ...snapshot,
          purchasedAvailable: balance.purchasedAvailable,
          purchasedHeld: balance.purchasedHeld,
          creditAccessBlocked: balance.creditAccessBlocked,
          plan,
          ledgerEnabled: true,
          topupSalesEnabled: false,
        });
      } catch (error) {
        console.error("credit ledger balance error:", error);
        return res.status(503).json({ error: "Credit balance unavailable" });
      }
    }

    const snapshot = await getCreditSnapshot(userId);
    return res.status(200).json({
      ...snapshot,
      ledgerEnabled: false,
      topupSalesEnabled: false,
    });
  } catch (error) {
    if (error?.safeCode === "ACCOUNT_DELETION_IN_PROGRESS") {
      return res.status(410).json({ error: error.safeCode });
    }
    if (typeof error?.safeCode === "string" && error.safeCode.startsWith("ACCOUNT_DELETION_")) {
      return res.status(503).json({ error: error.safeCode });
    }
    console.error("credits error:", error?.safeCode || error?.code || "UNKNOWN");

    return res.status(500).json({
      error: "Failed to load credits",
    });
  }
}
