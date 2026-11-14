const BUYER_FIELD_KEY = "buyertype";
const BUYER_TYPE_BY_STRIPE_VALUE = new Map([
  ["consumer", "consumer"],
  ["businessregistered", "business_registered"],
  ["businessunregistered", "business_unregistered"],
  ["businessunknown", "business_unknown"],
]);

export const CHECKOUT_MARKET_DATA_PARAMETERS = Object.freeze({
  billing_address_collection: "required",
  customer_update: { address: "auto", name: "auto" },
  name_collection: { business: { enabled: true, optional: true } },
  tax_id_collection: { enabled: true, required: "never" },
  custom_fields: [{
    key: BUYER_FIELD_KEY,
    label: { type: "custom", custom: "Purchase type / Art der Nutzung" },
    type: "dropdown",
    optional: false,
    dropdown: {
      options: [
        { label: "Personal / privat", value: "consumer" },
        { label: "Business, tax-registered / Geschäftlich, steuerregistriert", value: "businessregistered" },
        { label: "Business, not tax-registered / Geschäftlich, nicht steuerregistriert", value: "businessunregistered" },
        { label: "Business, status unclear / Geschäftlich, Status unklar", value: "businessunknown" },
      ],
    },
  }],
});

function stripeObjectId(value) {
  if (typeof value === "string" && value) return value;
  return typeof value?.id === "string" && value.id ? value.id : null;
}

export function getCheckoutMarketData(session) {
  const field = Array.isArray(session?.custom_fields)
    ? session.custom_fields.find((item) => item?.key === BUYER_FIELD_KEY)
    : null;
  const buyerType = typeof field?.dropdown?.value === "string"
    ? BUYER_TYPE_BY_STRIPE_VALUE.get(field.dropdown.value)
    : null;
  const country = session?.customer_details?.address?.country;
  if (typeof country !== "string" || !/^[A-Za-z]{2}$/.test(country) ||
      !buyerType) {
    return null;
  }

  return {
    buyerType,
    billingCountry: country.toUpperCase(),
    taxIdProvided: Array.isArray(session?.customer_details?.tax_ids) &&
      session.customer_details.tax_ids.length > 0,
  };
}

export async function persistCheckoutMarketData({
  session,
  stripe,
  subscriptionId = null,
  invoiceId = null,
  paymentIntentId = null,
}) {
  const marketData = getCheckoutMarketData(session);
  if (!marketData) return { status: "not_collected" };

  const customerId = stripeObjectId(session.customer);
  if (!customerId) return { status: "not_collected" };

  const metadata = {
    premivateBuyerType: marketData.buyerType,
    premivateBillingCountry: marketData.billingCountry,
    premivateTaxIdProvided: marketData.taxIdProvided ? "true" : "false",
  };

  const updates = [stripe.customers.update(customerId, { metadata })];
  if (subscriptionId) updates.push(stripe.subscriptions.update(subscriptionId, { metadata }));
  if (invoiceId) updates.push(stripe.invoices.update(invoiceId, { metadata }));
  if (paymentIntentId) updates.push(stripe.paymentIntents.update(paymentIntentId, { metadata }));
  await Promise.all(updates);

  return { status: "recorded", marketData };
}
