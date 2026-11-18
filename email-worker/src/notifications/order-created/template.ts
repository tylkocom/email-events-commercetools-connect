import {
  ctaButton,
  escapeHtml,
  linkFallback,
  normalizeStoreUrl,
  paragraph,
  renderShelfMarketHtml,
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
  };
};

export function renderOrderCreatedEmail(
  notification: OrderCreatedNotification,
  storeUrl: string,
  /** Guest access key; lets the recipient view the order without logging in. */
  orderAccessKey?: string,
): RenderedEmail {
  const orderNumber = notification.order.orderNumber || notification.order.id;
  const subject = `Zamówienie ${orderNumber} zostało potwierdzone`;
  const keySuffix = orderAccessKey ? `?key=${encodeURIComponent(orderAccessKey)}` : "";
  const orderDetailsUrl = `${normalizeStoreUrl(storeUrl)}/orders/${encodeURIComponent(notification.order.id)}${keySuffix}`;

  const bodyHtml = [
    paragraph("Dzień dobry,"),
    paragraph(
      `Otrzymaliśmy Twoje zamówienie <strong style="color: #1a1818;">${escapeHtml(orderNumber)}</strong>. Szczegóły i status zamówienia sprawdzisz poniżej:`,
    ),
    ctaButton("Zobacz szczegóły zamówienia", orderDetailsUrl),
    linkFallback(orderDetailsUrl, "Lub skopiuj ten link do przeglądarki:"),
    paragraph("Pozdrawiamy,<br>Zespół Tylko Outlet"),
  ].join("\n");

  return {
    subject,
    html: renderShelfMarketHtml(
      {
        title: "Dziękujemy za zamówienie.",
        bodyHtml,
        footerNote: `Ta wiadomość została wysłana na adres ${notification.order.customerEmail}.`,
      },
      storeUrl,
    ),
    text: `Dziękujemy za zamówienie\n\nDzień dobry,\n\nOtrzymaliśmy Twoje zamówienie ${orderNumber}.\n\nSzczegóły zamówienia:\n${orderDetailsUrl}\n\nPozdrawiamy,\nZespół Tylko Outlet`,
  };
}
