const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createHash, randomUUID } = require("node:crypto");

const confirmationPath = path.join(__dirname, "../lib/contract-confirmation.js");
const terms = {
  en: { terms: { version: "terms-v1", title: "PREMIVATE Terms", sections: [
    { heading: "Service", paragraphs: ["PREMIVATE paid service terms."] },
  ] } },
  de: { terms: { version: "terms-v1", title: "PREMIVATE AGB", sections: [
    { heading: "Dienst", paragraphs: ["PREMIVATE-Dienstleistungsbedingungen."] },
  ] } },
  fr: { terms: { version: "terms-v1", title: "Conditions PREMIVATE", sections: [
    { heading: "Service", paragraphs: ["Conditions de service PREMIVATE."] },
  ] } },
};
const earlyStartCopy = {
  en: { proRequest: "Separate Pro early-start request.", topupRequest: "Separate Top-up early-start request." },
  de: { proRequest: "Gesonderter Pro-Antrag.", topupRequest: "Gesonderter Top-up-Antrag." },
  fr: { proRequest: "Demande Pro distincte.", topupRequest: "Demande Top-up distincte." },
};

function loadConfirmationModule(grantPurchasedCredits = async () => ({ status: "granted" })) {
  let source = fs.readFileSync(confirmationPath, "utf8")
    .replace(/^import\s+[\s\S]*?\s+from\s+["'][^"']+["'];\s*/gm, "")
    .replace(/^export\s+/gm, "");
  source += "\n({ CONTRACT_CONFIRMATION_VERSION, createContractConfirmationDraft, attachContractConfirmationSession, recordPaidContractConfirmation, createOrReadConfirmationPdf, recordPdfTransfer, isContractConfirmationServiceEligible, finalizeDueTopupConfirmation });";

  class FakeJsPDF {
    constructor() {
      this.lines = [];
      this.internal = { pageSize: { getWidth: () => 595, getHeight: () => 842 } };
    }
    setFont() {}
    setFontSize() {}
    splitTextToSize(value) { return [String(value)]; }
    text(lines) { this.lines.push(...(Array.isArray(lines) ? lines : [lines])); }
    addPage() {}
    output() {
      const value = Buffer.from(`%PDF-1.4\n${this.lines.join("\n")}\n%%EOF`);
      return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
    }
  }

  return vm.runInNewContext(source, {
    createHash,
    randomUUID: () => "11111111-1111-4111-8111-111111111111",
    jsPDF: FakeJsPDF,
    EU_EARLY_START_COPY: earlyStartCopy,
    LEGAL_DOCUMENTS: terms,
    grantPurchasedCredits,
    getCheckoutMarketData: (session) => ({
      billingCountry: session.customer_details?.address?.country || "CH",
      buyerType: session.metadata?.buyerType || "consumer",
      taxIdProvided: false,
    }),
    Buffer,
    Date,
  }, { timeout: 1000 });
}

function loadEarlyStartCopy() {
  const copyPath = path.join(__dirname, "../data/contract-confirmation-copy.js");
  const source = fs.readFileSync(copyPath, "utf8")
    .replace(/^export\s+/gm, "") + "\nEU_EARLY_START_COPY;";
  return vm.runInNewContext(source, {}, { timeout: 1000 });
}

function makeSupabase() {
  const state = { row: null, updates: [] };
  const supabase = {
    from(table) {
      assert.equal(table, "premivate_contract_confirmations");
      const query = {
        action: "select",
        filters: [],
        selection: "*",
        values: null,
        select(fields = "*") { this.selection = fields; return this; },
        insert(values) { this.action = "insert"; this.values = values; return this; },
        update(values) { this.action = "update"; this.values = values; return this; },
        eq(field, value) { this.filters.push((row) => row[field] === value); return this; },
        neq(field, value) { this.filters.push((row) => row[field] !== value); return this; },
        is(field, value) {
          this.filters.push((row) => value === null ? row[field] == null : row[field] === value);
          return this;
        },
        in(field, values) { this.filters.push((row) => values.includes(row[field])); return this; },
        not(field, operator, value) {
          if (operator === "is" && value === null) this.filters.push((row) => row[field] !== null);
          return this;
        },
        lte(field, value) { this.filters.push((row) => Date.parse(row[field]) <= Date.parse(value)); return this; },
        order() { return this; },
        limit() { return this; },
        async maybeSingle() {
          const result = await this.execute();
          return { data: Array.isArray(result.data) ? result.data[0] || null : result.data, error: null };
        },
        async execute() {
          if (this.action === "insert") {
            if (state.row) return { data: null, error: new Error("duplicate") };
            state.row = structuredClone(this.values);
            return { data: { id: state.row.id }, error: null };
          }
          if (!state.row || !this.filters.every((filter) => filter(state.row))) {
            return { data: this.action === "select" ? [] : null, error: null };
          }
          if (this.action === "update") {
            state.row = { ...state.row, ...structuredClone(this.values) };
            state.updates.push(structuredClone(this.values));
          }
          const projected = this.selection === "*"
            ? structuredClone(state.row)
            : Object.fromEntries(this.selection.split(",").map((field) => [field, state.row[field]]));
          return { data: [projected], error: null };
        },
        then(resolve, reject) { return this.execute().then(resolve, reject); },
      };
      return query;
    },
  };
  return { supabase, state };
}

async function makePaidConfirmation({ serviceType = "pro", country = "CH", state = "", locale = "en", customerName = "Test Buyer", earlyStartRequested = false, buyerType = "consumer", grant } = {}) {
  const api = loadConfirmationModule(grant);
  const db = makeSupabase();
  const userId = "user-test-1";
  const acceptedAt = "2026-11-16T10:00:00.000Z";
  const draft = await api.createContractConfirmationDraft(db.supabase, {
    userId,
    serviceType,
    locale,
    termsConsent: {
      accepted: true,
      locale,
      version: "terms-v1",
      acceptedAt,
      precontractDisclosure: {
        marketCountryScope: country === "CA" ? "CA" : "OTHER",
        marketRegion: country === "CA" ? state : "",
        frenchVersionPresented: country === "CA" && state === "QC",
        alternativeLanguageChoice: false,
        copy: {
          seller: "Seller information.", proDescription: "Pro offer.", topupDescription: "Top-up offer.",
          proPayment: "Monthly payment.", topupPayment: "One-time payment.",
          performance: "Service timing.", cancellation: "Cancellation information.",
        },
      },
    },
    earlyStartRequested,
  });
  const sessionId = "cs_test_contract_1";
  await api.attachContractConfirmationSession(db.supabase, { confirmationId: draft.id, userId, sessionId });
  const session = {
    id: sessionId,
    client_reference_id: userId,
    customer: "cus_test_1",
    payment_intent: serviceType === "credit_topup" ? "pi_test_1" : null,
    amount_total: serviceType === "credit_topup" ? 690 : 2400,
    currency: "chf",
    livemode: false,
    created: Math.floor(Date.parse(acceptedAt) / 1000),
    customer_details: {
      name: customerName,
      email: "buyer@example.test",
      address: { line1: "Teststrasse 1", postal_code: "8000", city: "Zürich", state, country },
    },
    metadata: {
      clerkUserId: userId,
      premivateContractConfirmationId: draft.id,
      premivateEarlyStartVersion: api.CONTRACT_CONFIRMATION_VERSION,
      premivateEarlyStartRequested: String(earlyStartRequested),
      ...(draft.earlyStartRequestedAt ? { premivateEarlyStartRequestedAt: draft.earlyStartRequestedAt } : {}),
      premivateTermsVersion: "terms-v1",
      premivateTermsLocale: locale,
      premivateTermsAcceptedAt: acceptedAt,
      premivatePrecontractMarketScope: country === "CA" ? "CA" : "OTHER",
      premivatePrecontractRegion: country === "CA" ? state : "",
      premivateFrenchTermsPresented: String(country === "CA" && state === "QC"),
      premivateAlternativeLanguageChoice: "false",
      ...(serviceType === "credit_topup" ? { credits: "25" } : {}),
      buyerType,
    },
  };
  await api.recordPaidContractConfirmation(db.supabase, {
    session,
    userId,
    expectedServiceType: serviceType,
    paidAt: acceptedAt,
    paymentIntentId: serviceType === "credit_topup" ? "pi_test_1" : null,
    subscriptionId: serviceType === "pro" ? "sub_test_1" : null,
  });
  return { api, db, userId, draft, session, acceptedAt };
}

test("separate early-start request is recorded with its timestamp and attached to the exact service", async () => {
  const h = await makePaidConfirmation({ serviceType: "pro", country: "DE", earlyStartRequested: true });
  assert.equal(h.db.state.row.early_start_requested, true);
  assert.ok(h.db.state.row.early_start_requested_at);
  assert.equal(h.db.state.row.terms_snapshot.earlyStartRequestByService.pro, earlyStartCopy.en.proRequest);
  assert.equal(h.db.state.row.terms_snapshot.earlyStartRequestByService.credit_topup, null);
  assert.equal(Date.parse(h.db.state.row.service_start_at), Date.parse(h.acceptedAt));
  assert.equal(h.db.state.row.state, "paid_pending_transfer");
});

test("EU withdrawal copy limits renewal periods and Top-up completion to statutory delivery", () => {
  const copy = loadEarlyStartCopy();
  const enTerms = copy.en.termsParagraphs.join(" ");
  const deTerms = copy.de.termsParagraphs.join(" ");
  assert.match(enTerms, /ordinary renewal under the clearly disclosed subscription terms does not by itself start a new statutory 14-day withdrawal period/i);
  assert.match(deTerms, /gewöhnliche Verlängerung nach den klar offengelegten Abonnementbedingungen beginnt für sich allein keine neue gesetzliche 14-tägige Widerrufsfrist/i);
  assert.match(enTerms, /fully performed when all credits purchased in that package have been successfully credited to your account and enabled for eligible use/i);
  assert.match(deTerms, /vollständig erbracht, wenn alle Credits dieses Kaufs deinem Konto erfolgreich gutgeschrieben und für berechtigte Nutzungen freigeschaltet wurden/i);
  assert.doesNotMatch(enTerms, /all purchased Top-up units have been used/i);
  assert.doesNotMatch(deTerms, /alle gekauften Top-up-Einheiten für erfolgreich zugestellte Generierungen verwendet wurden/i);
  assert.match(copy.en.proRequest, /during the 14-day withdrawal period.*may still withdraw.*before the paid month is fully provided.*proportionate amount required by law.*right ends early only once the month is fully provided/i);
  assert.match(copy.de.proRequest, /innerhalb der 14-tägigen Widerrufsfrist.*Bis zur vollständigen Erbringung des bezahlten Monats kann ich widerrufen.*gesetzlich zulässigen anteiligen Betrag.*Widerrufsrecht vorzeitig nur endet.*Monat vollständig erbracht ist/i);
  assert.match(copy.en.topupRequest, /during the 14-day withdrawal period.*crediting and enabling all purchased credits.*may still withdraw before delivery is complete.*proportionate amount.*right ends early only once every credit is enabled for eligible use.*Later use is not required/i);
  assert.match(copy.de.topupRequest, /innerhalb der 14-tägigen Widerrufsfrist.*alle Credits gutgeschrieben und für berechtigte Nutzung freigeschaltet.*Bis zur vollständigen Lieferung kann ich widerrufen.*gesetzlich zulässigen anteiligen Betrag.*Widerrufsrecht vorzeitig nur endet.*alle gekauften Credits gutgeschrieben und freigeschaltet sind.*spätere Nutzung ist nicht erforderlich/i);
  assert.ok(copy.en.proRequest.length < 300);
  assert.ok(copy.en.topupRequest.length < 420);
  assert.ok(copy.de.proRequest.length < 380);
  assert.ok(copy.de.topupRequest.length < 540);
});

test("French contract confirmation preserves the required name and province in the immutable PDF", async () => {
  const h = await makePaidConfirmation({ serviceType: "credit_topup", country: "CA", state: "QC", locale: "fr" });
  const { bytes } = await h.api.createOrReadConfirmationPdf(h.db.supabase, h.draft.id, h.userId);
  const pdf = bytes.toString("utf8");
  assert.match(pdf, /Confirmation du contrat/);
  assert.match(pdf, /Conditions de service/);
  assert.match(pdf, /Test Buyer/);
  assert.match(pdf, /QC/);
  assert.match(pdf, /Déclaration précontractuelle de région de facturation/);
});

test("confirmation PDF fails closed when Stripe did not collect a customer name", async () => {
  const h = await makePaidConfirmation({ customerName: "  " });
  await assert.rejects(
    h.api.createOrReadConfirmationPdf(h.db.supabase, h.draft.id, h.userId),
    (error) => error.safeCode === "CONTRACT_CONFIRMATION_NOT_PAID_OR_INCOMPLETE",
  );
});

test("EU B2B purchase categories do not receive the consumer-only statutory service hold", async () => {
  for (const buyerType of ["business_registered", "business_unregistered", "business_unknown"]) {
    const h = await makePaidConfirmation({
      serviceType: "credit_topup",
      country: "DE",
      buyerType,
      earlyStartRequested: false,
    });
    assert.equal(Date.parse(h.db.state.row.service_start_at), Date.parse(h.acceptedAt));
  }
});

test("paid Pro stays locked until the complete stored PDF is transferred, then unlocks server-side", async () => {
  const h = await makePaidConfirmation({ serviceType: "pro" });
  assert.equal(h.db.state.row.state, "paid_pending_transfer");
  assert.equal(await h.api.isContractConfirmationServiceEligible(h.db.supabase, h.draft.id), false);

  const pdf = await h.api.createOrReadConfirmationPdf(h.db.supabase, h.draft.id, h.userId);
  assert.equal(pdf.bytes.subarray(0, 5).toString(), "%PDF-");
  const digest = createHash("sha256").update(pdf.bytes).digest("hex");
  assert.equal(pdf.row.pdf_sha256, digest);
  assert.equal(pdf.row.pdf_byte_length, pdf.bytes.length);

  const transfer = await h.api.recordPdfTransfer(h.db.supabase, {
    confirmationId: h.draft.id,
    userId: h.userId,
    sha256: digest,
    byteLength: pdf.bytes.length,
  });
  assert.equal(transfer.state, "service_eligible");
  assert.equal(await h.api.isContractConfirmationServiceEligible(h.db.supabase, h.draft.id), true);
});

test("Top-up grants no purchased credits on payment alone and grants only after PDF transfer", async () => {
  const grants = [];
  const grant = async (_supabase, input) => { grants.push(input); return { status: "granted" }; };
  const h = await makePaidConfirmation({ serviceType: "credit_topup", grant });
  assert.equal(h.db.state.row.state, "paid_pending_transfer");
  assert.equal(grants.length, 0);

  const pdf = await h.api.createOrReadConfirmationPdf(h.db.supabase, h.draft.id, h.userId);
  const digest = createHash("sha256").update(pdf.bytes).digest("hex");
  const transfer = await h.api.recordPdfTransfer(h.db.supabase, {
    confirmationId: h.draft.id,
    userId: h.userId,
    sha256: digest,
    byteLength: pdf.bytes.length,
  });
  assert.equal(transfer.state, "service_eligible");
  assert.equal(grants.length, 1);
  assert.equal(grants[0].credits, 25);
});

test("EU consumer without early-start request remains locked until the 14-day period clears", async () => {
  const grants = [];
  const h = await makePaidConfirmation({
    serviceType: "credit_topup",
    country: "DE",
    grant: async (_supabase, input) => { grants.push(input); return { status: "granted" }; },
  });
  const pdf = await h.api.createOrReadConfirmationPdf(h.db.supabase, h.draft.id, h.userId);
  const digest = createHash("sha256").update(pdf.bytes).digest("hex");
  const transfer = await h.api.recordPdfTransfer(h.db.supabase, {
    confirmationId: h.draft.id,
    userId: h.userId,
    sha256: digest,
    byteLength: pdf.bytes.length,
  });
  assert.equal(transfer.status, "transfer_reported_waiting_for_service_start");
  assert.equal(grants.length, 0);

  h.db.state.row.service_start_at = new Date(Date.now() - 1000).toISOString();
  const result = await h.api.finalizeDueTopupConfirmation(h.db.supabase, h.db.state.row);
  assert.equal(result.status, "granted");
  assert.equal(grants.length, 1);
});

test("refund-review state cannot be unlocked by the Pro transfer path", async () => {
  const h = await makePaidConfirmation({ serviceType: "pro" });
  h.db.state.row.state = "refund_review";
  assert.equal(await h.api.isContractConfirmationServiceEligible(h.db.supabase, h.draft.id), false);
  const pdf = await h.api.createOrReadConfirmationPdf(h.db.supabase, h.draft.id, h.userId);
  const digest = createHash("sha256").update(pdf.bytes).digest("hex");
  const transfer = await h.api.recordPdfTransfer(h.db.supabase, {
    confirmationId: h.draft.id,
    userId: h.userId,
    sha256: digest,
    byteLength: pdf.bytes.length,
  });
  assert.equal(transfer.state, "refund_review");
  assert.equal(await h.api.isContractConfirmationServiceEligible(h.db.supabase, h.draft.id), false);
});
