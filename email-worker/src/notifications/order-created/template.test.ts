import { describe, expect, it } from "vitest";
import { renderOrderCreatedEmail, type OrderCreatedNotification } from "./template";

const storeUrl = "https://example.com";

function notification(order: Partial<OrderCreatedNotification["order"]> = {}): OrderCreatedNotification {
  return {
    notificationType: "Message",
    id: "message-id",
    type: "OrderCreated",
    order: {
      id: "order-id",
      customerEmail: "customer@example.com",
      orderNumber: "ORD-1",
      totalPrice: { currencyCode: "EUR" },
      ...order,
    },
  };
}

describe("renderOrderCreatedEmail", () => {
  it("renders English for an EUR order", () => {
    const email = renderOrderCreatedEmail(notification(), storeUrl);

    expect(email.subject).toBe("Order ORD-1 confirmed");
    expect(email.html).toContain('<html lang="en">');
    expect(email.html).toContain("ORD-1");
    expect(email.text).toContain("ORD-1");
  });

  it("renders Polish for a PLN order", () => {
    const email = renderOrderCreatedEmail(notification({ totalPrice: { currencyCode: "PLN" } }), storeUrl);

    expect(email.subject).toBe("Zamówienie ORD-1 potwierdzone");
    expect(email.html).toContain('<html lang="pl">');
    expect(email.html).toContain("Dziękujemy za zamówienie.");
    expect(email.html).toContain("Zobacz szczegóły zamówienia");
    expect(email.html).not.toContain("Thank you");
    expect(email.text).toContain("Otrzymaliśmy Twoje zamówienie ORD-1.");
  });

  it("defaults to Polish when the order has no locale or currency", () => {
    const email = renderOrderCreatedEmail(notification({ totalPrice: undefined }), storeUrl);

    expect(email.subject).toBe("Zamówienie ORD-1 potwierdzone");
  });

  it("prefers the order locale over the currency", () => {
    const email = renderOrderCreatedEmail(notification({ locale: "pl-PL" }), storeUrl);

    expect(email.subject).toBe("Zamówienie ORD-1 potwierdzone");
  });

  it("brands the email as Outlet", () => {
    const email = renderOrderCreatedEmail(notification(), storeUrl);

    expect(email.html).toContain(">Outlet</a>");
    expect(email.html).not.toContain("ShelfMarket");
  });

  it("strips trailing slashes from the store URL when building links", () => {
    const email = renderOrderCreatedEmail(notification(), "https://example.com/");

    expect(email.html).toContain("https://example.com/orders/order-id");
    expect(email.html).not.toContain("//orders/");
    expect(email.text).toContain("https://example.com/orders/order-id");
  });

  it("appends the guest access key to the order link when provided", () => {
    const email = renderOrderCreatedEmail(notification(), storeUrl, "abc123key");

    expect(email.html).toContain("https://example.com/orders/order-id?key=abc123key");
    expect(email.text).toContain("https://example.com/orders/order-id?key=abc123key");
  });

  it("escapes order number in html", () => {
    const email = renderOrderCreatedEmail(notification({ orderNumber: "<ORD>" }), storeUrl);

    expect(email.html).toContain("&lt;ORD&gt;");
  });

  it("escapes order id in link", () => {
    const email = renderOrderCreatedEmail(notification({ id: "<order-id>" }), storeUrl);

    expect(email.html).toContain("https://example.com/orders/%3Corder-id%3E");
  });

  it("falls back to order id when orderNumber is missing", () => {
    const email = renderOrderCreatedEmail(
      notification({ id: "082ad4d9-bd3e-4244-86be-23b518d2ffb6", orderNumber: undefined }),
      storeUrl,
    );

    expect(email.subject).toBe("Order 082ad4d9-bd3e-4244-86be-23b518d2ffb6 confirmed");
    expect(email.text).toContain("082ad4d9-bd3e-4244-86be-23b518d2ffb6");
  });
});
