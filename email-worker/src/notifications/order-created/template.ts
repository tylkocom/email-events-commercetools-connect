import {
  ctaButton,
  escapeHtml,
  linkFallback,
  normalizeStoreUrl,
  paragraph,
  renderShelfMarketHtml,
  type EmailLocale,
  type RenderedEmail,
} from "../../templates/layout";

export type { RenderedEmail };

export type OrderCreatedNotification = {
  notificationType: "Message";
  id: string;
  type: "OrderCreated";
  order: {
    id: string;
    customerEmail: string;
    orderNumber?: string;
    /** commercetools order locale, e.g. "pl" or "en-GB". */
    locale?: string;
    totalPrice?: { currencyCode?: string };
  };
};

/**
 * Storefront language for the order email. The order locale wins; otherwise
 * the currency decides (EUR is the English storefront, everything else is
 * Polish), mirroring the storefront's language/currency pairing. Polish is
 * the default, as on the storefront.
 */
export function orderEmailLocale(order: OrderCreatedNotification["order"]): EmailLocale {
  const language = order.locale?.toLowerCase().split(/[-_]/)[0];
  if (language === "pl" || language === "en") return language;
  if (order.totalPrice?.currencyCode?.toUpperCase() === "EUR") return "en";
  return "pl";
}

const COPY = {
  en: {
    subject: (n: string) => `Order ${n} confirmed`,
    greeting: "Hi,",
    received: (n: string) =>
      `We have received your order <strong style="color: #1a1818;">${n}</strong>. You can view its details and track its status below:`,
    cta: "View order details",
    next: "We will send you another email when your order is ready for delivery.",
    eyebrow: "Orders",
    title: "Thank you for your order.",
    footer: (email: string) => `This email was sent to ${email}.`,
    textTitle: "Thank you for your order",
    textReceived: (n: string) => `We have received your order ${n}.`,
    textView: "View your order details:",
  },
  pl: {
    subject: (n: string) => `Zamówienie ${n} potwierdzone`,
    greeting: "Dzień dobry,",
    received: (n: string) =>
      `Otrzymaliśmy Twoje zamówienie <strong style="color: #1a1818;">${n}</strong>. Jego szczegóły i status sprawdzisz poniżej:`,
    cta: "Zobacz szczegóły zamówienia",
    next: "Wyślemy Ci kolejny e-mail, gdy zamówienie będzie gotowe do dostawy.",
    eyebrow: "Zamówienia",
    title: "Dziękujemy za zamówienie.",
    footer: (email: string) => `Ta wiadomość została wysłana na adres ${email}.`,
    textTitle: "Dziękujemy za zamówienie",
    textReceived: (n: string) => `Otrzymaliśmy Twoje zamówienie ${n}.`,
    textView: "Zobacz szczegóły zamówienia:",
  },
} as const;

export function renderOrderCreatedEmail(
  notification: OrderCreatedNotification,
  storeUrl: string,
  /** Guest access key; lets the recipient view the order without logging in. */
  orderAccessKey?: string,
): RenderedEmail {
  const locale = orderEmailLocale(notification.order);
  const copy = COPY[locale];
  const orderNumber = notification.order.orderNumber || notification.order.id;
  const keySuffix = orderAccessKey ? `?key=${encodeURIComponent(orderAccessKey)}` : "";
  const orderDetailsUrl = `${normalizeStoreUrl(storeUrl)}/orders/${encodeURIComponent(notification.order.id)}${keySuffix}`;

  const bodyHtml = [
    paragraph(copy.greeting),
    paragraph(copy.received(escapeHtml(orderNumber))),
    ctaButton(copy.cta, orderDetailsUrl),
    linkFallback(orderDetailsUrl, locale),
    paragraph(copy.next),
  ].join("\n");

  return {
    subject: copy.subject(orderNumber),
    html: renderShelfMarketHtml(
      {
        eyebrow: copy.eyebrow,
        title: copy.title,
        bodyHtml,
        footerNote: copy.footer(notification.order.customerEmail),
        locale,
      },
      storeUrl,
    ),
    text: `${copy.textTitle}\n\n${copy.greeting}\n\n${copy.textReceived(orderNumber)}\n\n${copy.textView}\n${orderDetailsUrl}\n\n${copy.next}`,
  };
}
