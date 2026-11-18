import { describe, expect, it } from "vitest";
import { renderOrderCreatedEmail } from "./template";

const storeUrl = "https://example.com";

describe("renderOrderCreatedEmail", () => {
  it("renders order confirmation copy", () => {
    const email = renderOrderCreatedEmail(
      {
        notificationType: "Message",
        id: "message-id",
        type: "OrderCreated",
        order: { id: "order-id", customerEmail: "customer@example.com", orderNumber: "ORD-1" },
      },
      storeUrl,
    );

    expect(email.subject).toBe("Zamówienie ORD-1 zostało potwierdzone");
    expect(email.html).toContain("Dziękujemy za zamówienie.");
    expect(email.html).toContain("Zobacz szczegóły zamówienia");
    expect(email.html).toContain("ORD-1");
    expect(email.text).toContain("ORD-1");
  });

  it("strips trailing slashes from the store URL when building links", () => {
    const email = renderOrderCreatedEmail(
      {
        notificationType: "Message",
        id: "message-id",
        type: "OrderCreated",
        order: { id: "order-id", customerEmail: "customer@example.com", orderNumber: "ORD-1" },
      },
      "https://example.com/",
    );

    expect(email.html).toContain("https://example.com/orders/order-id");
    expect(email.html).not.toContain("//orders/");
    expect(email.text).toContain("https://example.com/orders/order-id");
  });

  it("includes link to order details", () => {
    const email = renderOrderCreatedEmail(
      {
        notificationType: "Message",
        id: "message-id",
        type: "OrderCreated",
        order: { id: "order-id", customerEmail: "customer@example.com", orderNumber: "ORD-1" },
      },
      storeUrl,
    );

    expect(email.html).toContain("https://example.com/orders/order-id");
    expect(email.text).toContain("https://example.com/orders/order-id");
  });

  it("appends the guest access key to the order link when provided", () => {
    const email = renderOrderCreatedEmail(
      {
        notificationType: "Message",
        id: "message-id",
        type: "OrderCreated",
        order: { id: "order-id", customerEmail: "customer@example.com", orderNumber: "ORD-1" },
      },
      storeUrl,
      "abc123key",
    );

    expect(email.html).toContain("https://example.com/orders/order-id?key=abc123key");
    expect(email.text).toContain("https://example.com/orders/order-id?key=abc123key");
  });

  it("escapes order number in html", () => {
    const email = renderOrderCreatedEmail(
      {
        notificationType: "Message",
        id: "message-id",
        type: "OrderCreated",
        order: { id: "order-id", customerEmail: "customer@example.com", orderNumber: "<ORD>" },
      },
      storeUrl,
    );

    expect(email.html).toContain("&lt;ORD&gt;");
  });

  it("uses the Outlet brand, has no English copy, legal notice or delivery follow-up promise", () => {
    const email = renderOrderCreatedEmail(
      {
        notificationType: "Message",
        id: "message-id",
        type: "OrderCreated",
        order: { id: "order-id", customerEmail: "customer@example.com", orderNumber: "ORD-1" },
      },
      storeUrl,
    );

    expect(email.html).toContain(">Outlet<");
    expect(email.html).not.toContain("ShelfMarket");
    expect(email.html).not.toContain("legal-notice");
    for (const body of [email.html, email.text]) {
      expect(body).not.toMatch(/another email|ready for delivery|Thank you|Hi,|copy and paste/i);
      expect(body).not.toMatch(/gotowe|kolejn/i);
    }
  });

  it("escapes order id in link", () => {
    const email = renderOrderCreatedEmail(
      {
        notificationType: "Message",
        id: "message-id",
        type: "OrderCreated",
        order: { id: "<order-id>", customerEmail: "customer@example.com" },
      },
      storeUrl,
    );

    expect(email.html).toContain("https://example.com/orders/%3Corder-id%3E");
  });

  it("falls back to order id when orderNumber is missing", () => {
    const email = renderOrderCreatedEmail(
      {
        notificationType: "Message",
        id: "message-id",
        type: "OrderCreated",
        order: {
          id: "082ad4d9-bd3e-4244-86be-23b518d2ffb6",
          customerEmail: "customer@example.com",
        },
      },
      storeUrl,
    );

    expect(email.subject).toBe(
      "Zamówienie 082ad4d9-bd3e-4244-86be-23b518d2ffb6 zostało potwierdzone",
    );
    expect(email.html).toContain("082ad4d9-bd3e-4244-86be-23b518d2ffb6");
    expect(email.text).toContain("082ad4d9-bd3e-4244-86be-23b518d2ffb6");
  });
});
