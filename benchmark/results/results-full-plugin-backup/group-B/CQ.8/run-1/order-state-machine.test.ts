import {
  OrderStateMachine,
  OrderState,
  OrderEvent,
  OrderItem,
  Order,
  TransitionError,
  AuditEntry,
  TransitionContext,
} from "./order-state-machine";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SAMPLE_ITEMS: OrderItem[] = [
  { sku: "WIDGET-1", name: "Widget", quantity: 2, unitPrice: 15.5 },
  { sku: "GADGET-3", name: "Gadget", quantity: 1, unitPrice: 29.0 },
];

function actor(name = "test-user"): TransitionContext {
  return { actor: name };
}

function buildMachine(): OrderStateMachine {
  return new OrderStateMachine();
}

/** Advance an order through the happy path up to a target state. */
function advanceTo(sm: OrderStateMachine, target: OrderState): Order {
  let order = sm.createOrder("ORD-1", "alice@example.com", SAMPLE_ITEMS);

  const steps: Array<[OrderState, OrderEvent, Partial<TransitionContext>]> = [
    [OrderState.DRAFT, OrderEvent.SUBMIT, {}],
    [OrderState.SUBMITTED, OrderEvent.REQUEST_PAYMENT, { payment: { method: "credit_card" } }],
    [
      OrderState.PAYMENT_PENDING,
      OrderEvent.CONFIRM_PAYMENT,
      { payment: { method: "credit_card", transactionId: "txn_123", amount: 60.0 } },
    ],
    [OrderState.PAID, OrderEvent.BEGIN_PROCESSING, {}],
    [
      OrderState.PROCESSING,
      OrderEvent.SHIP,
      {
        shipping: {
          carrier: "FedEx",
          trackingNumber: "FX123456",
          estimatedDelivery: new Date("2025-06-01"),
        },
      },
    ],
    [OrderState.SHIPPED, OrderEvent.DELIVER, {}],
  ];

  for (const [fromState, event, ctxPatch] of steps) {
    if (order.state === target) break;
    if (order.state !== fromState) continue;
    order = sm.send(order, event, { ...actor(), ...ctxPatch });
  }

  if (order.state !== target) {
    throw new Error(`Could not advance to ${target}; stuck at ${order.state}`);
  }
  return order;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("OrderStateMachine", () => {
  // ── Creation ──────────────────────────────────────────────────────────────

  describe("createOrder", () => {
    it("creates a DRAFT order with correct total", () => {
      const sm = buildMachine();
      const order = sm.createOrder("ORD-1", "alice@example.com", SAMPLE_ITEMS);

      expect(order.state).toBe(OrderState.DRAFT);
      expect(order.id).toBe("ORD-1");
      expect(order.customerEmail).toBe("alice@example.com");
      expect(order.totalAmount).toBe(60.0); // 2*15.50 + 1*29.00
      expect(order.items).toHaveLength(2);
      expect(order.auditLog).toHaveLength(0);
    });

    it("rounds total to two decimal places", () => {
      const sm = buildMachine();
      const order = sm.createOrder("ORD-2", "bob@example.com", [
        { sku: "A", name: "A", quantity: 3, unitPrice: 1.333 },
      ]);
      // 3 * 1.333 = 3.999 → rounded to 4.00
      expect(order.totalAmount).toBe(4.0);
    });
  });

  // ── Happy Path ────────────────────────────────────────────────────────────

  describe("happy path: DRAFT → DELIVERED", () => {
    it("transitions through all states correctly", () => {
      const sm = buildMachine();
      const order = advanceTo(sm, OrderState.DELIVERED);

      expect(order.state).toBe(OrderState.DELIVERED);
      expect(order.submittedAt).toBeInstanceOf(Date);
      expect(order.paidAt).toBeInstanceOf(Date);
      expect(order.shippedAt).toBeInstanceOf(Date);
      expect(order.deliveredAt).toBeInstanceOf(Date);
      expect(order.payment?.transactionId).toBe("txn_123");
      expect(order.shipping?.carrier).toBe("FedEx");
      expect(order.auditLog).toHaveLength(6);
    });
  });

  // ── SUBMIT guards ────────────────────────────────────────────────────────

  describe("SUBMIT", () => {
    it("rejects order with no items", () => {
      const sm = buildMachine();
      const order = sm.createOrder("ORD-X", "a@b.com", []);

      expect(() => sm.send(order, OrderEvent.SUBMIT, actor())).toThrow(TransitionError);
      expect(() => sm.send(order, OrderEvent.SUBMIT, actor())).toThrow("no items");
    });

    it("rejects order with zero total", () => {
      const sm = buildMachine();
      const order = sm.createOrder("ORD-X", "a@b.com", [
        { sku: "FREE", name: "Free", quantity: 1, unitPrice: 0 },
      ]);

      expect(() => sm.send(order, OrderEvent.SUBMIT, actor())).toThrow("total must be positive");
    });

    it("rejects order with no email", () => {
      const sm = buildMachine();
      const order = sm.createOrder("ORD-X", "", SAMPLE_ITEMS);

      expect(() => sm.send(order, OrderEvent.SUBMIT, actor())).toThrow("email");
    });
  });

  // ── REQUEST_PAYMENT guards ───────────────────────────────────────────────

  describe("REQUEST_PAYMENT", () => {
    it("rejects without payment info", () => {
      const sm = buildMachine();
      const order = advanceTo(sm, OrderState.SUBMITTED);

      expect(() => sm.send(order, OrderEvent.REQUEST_PAYMENT, actor())).toThrow(
        "Payment info is required",
      );
    });

    it("stores payment method on success", () => {
      const sm = buildMachine();
      const order = advanceTo(sm, OrderState.SUBMITTED);
      const next = sm.send(order, OrderEvent.REQUEST_PAYMENT, {
        ...actor(),
        payment: { method: "paypal" },
      });

      expect(next.state).toBe(OrderState.PAYMENT_PENDING);
      expect(next.payment?.method).toBe("paypal");
    });
  });

  // ── CONFIRM_PAYMENT guards ───────────────────────────────────────────────

  describe("CONFIRM_PAYMENT", () => {
    it("rejects without transaction ID", () => {
      const sm = buildMachine();
      const order = advanceTo(sm, OrderState.PAYMENT_PENDING);

      expect(() =>
        sm.send(order, OrderEvent.CONFIRM_PAYMENT, {
          ...actor(),
          payment: { method: "credit_card" },
        }),
      ).toThrow("Transaction ID");
    });

    it("rejects mismatched amount", () => {
      const sm = buildMachine();
      const order = advanceTo(sm, OrderState.PAYMENT_PENDING);

      expect(() =>
        sm.send(order, OrderEvent.CONFIRM_PAYMENT, {
          ...actor(),
          payment: { method: "credit_card", transactionId: "txn_1", amount: 999.99 },
        }),
      ).toThrow("does not match");
    });
  });

  // ── SHIP guards ───────────────────────────────────────────────────────────

  describe("SHIP", () => {
    it("rejects without shipping info", () => {
      const sm = buildMachine();
      const order = advanceTo(sm, OrderState.PROCESSING);

      expect(() => sm.send(order, OrderEvent.SHIP, actor())).toThrow("Shipping info is required");
    });

    it("rejects without tracking number", () => {
      const sm = buildMachine();
      const order = advanceTo(sm, OrderState.PROCESSING);

      expect(() =>
        sm.send(order, OrderEvent.SHIP, {
          ...actor(),
          shipping: { carrier: "UPS", trackingNumber: "" },
        }),
      ).toThrow("Tracking number");
    });
  });

  // ── CANCEL ────────────────────────────────────────────────────────────────

  describe("CANCEL", () => {
    const cancellableStates: OrderState[] = [
      OrderState.DRAFT,
      OrderState.SUBMITTED,
      OrderState.PAYMENT_PENDING,
      OrderState.PAID,
      OrderState.PROCESSING,
    ];

    it.each(cancellableStates)("can cancel from %s", (state) => {
      const sm = buildMachine();
      const order = advanceTo(sm, state);
      const next = sm.send(order, OrderEvent.CANCEL, {
        ...actor(),
        reason: "Changed mind",
      });

      expect(next.state).toBe(OrderState.CANCELLED);
      expect(next.cancellationReason).toBe("Changed mind");
      expect(next.cancelledAt).toBeInstanceOf(Date);
    });

    it("rejects cancellation without reason", () => {
      const sm = buildMachine();
      const order = advanceTo(sm, OrderState.SUBMITTED);

      expect(() => sm.send(order, OrderEvent.CANCEL, actor())).toThrow("reason is required");
    });

    const nonCancellableStates: OrderState[] = [
      OrderState.SHIPPED,
      OrderState.DELIVERED,
      OrderState.CANCELLED,
      OrderState.REFUNDED,
    ];

    it.each(nonCancellableStates)("cannot cancel from %s", (state) => {
      const sm = buildMachine();
      let order: Order;

      if (state === OrderState.CANCELLED) {
        order = advanceTo(sm, OrderState.SUBMITTED);
        order = sm.send(order, OrderEvent.CANCEL, { ...actor(), reason: "initial cancel" });
      } else if (state === OrderState.REFUNDED) {
        order = advanceTo(sm, OrderState.PAID);
        order = sm.send(order, OrderEvent.REFUND, { ...actor(), reason: "initial refund" });
      } else {
        order = advanceTo(sm, state);
      }

      expect(() =>
        sm.send(order, OrderEvent.CANCEL, { ...actor(), reason: "Too late" }),
      ).toThrow(TransitionError);
    });
  });

  // ── REFUND ────────────────────────────────────────────────────────────────

  describe("REFUND", () => {
    const refundableStates: OrderState[] = [
      OrderState.PAID,
      OrderState.PROCESSING,
      OrderState.SHIPPED,
      OrderState.DELIVERED,
    ];

    it.each(refundableStates)("can refund from %s", (state) => {
      const sm = buildMachine();
      const order = advanceTo(sm, state);
      const next = sm.send(order, OrderEvent.REFUND, {
        ...actor(),
        reason: "Defective product",
      });

      expect(next.state).toBe(OrderState.REFUNDED);
      expect(next.refundReason).toBe("Defective product");
      expect(next.refundedAt).toBeInstanceOf(Date);
    });

    it("rejects refund without reason", () => {
      const sm = buildMachine();
      const order = advanceTo(sm, OrderState.PAID);

      expect(() => sm.send(order, OrderEvent.REFUND, actor())).toThrow("reason is required");
    });

    const nonRefundableStates: OrderState[] = [
      OrderState.DRAFT,
      OrderState.SUBMITTED,
      OrderState.PAYMENT_PENDING,
      OrderState.CANCELLED,
      OrderState.REFUNDED,
    ];

    it.each(nonRefundableStates)("cannot refund from %s", (state) => {
      const sm = buildMachine();
      // For states before PAID we can't use advanceTo + refund directly
      // because advanceTo won't have payment info for DRAFT/SUBMITTED/PAYMENT_PENDING
      let order: Order;
      try {
        order = advanceTo(sm, state);
      } catch {
        // CANCELLED and REFUNDED might need special setup
        if (state === OrderState.CANCELLED) {
          order = advanceTo(sm, OrderState.SUBMITTED);
          order = sm.send(order, OrderEvent.CANCEL, { ...actor(), reason: "test" });
        } else if (state === OrderState.REFUNDED) {
          order = advanceTo(sm, OrderState.PAID);
          order = sm.send(order, OrderEvent.REFUND, { ...actor(), reason: "test" });
        } else {
          throw new Error(`Cannot set up state ${state}`);
        }
      }

      expect(() =>
        sm.send(order, OrderEvent.REFUND, { ...actor(), reason: "attempt" }),
      ).toThrow(TransitionError);
    });
  });

  // ── Illegal transitions ───────────────────────────────────────────────────

  describe("illegal transitions", () => {
    it("cannot go from DRAFT to PAID directly", () => {
      const sm = buildMachine();
      const order = sm.createOrder("ORD-1", "a@b.com", SAMPLE_ITEMS);

      expect(() =>
        sm.send(order, OrderEvent.CONFIRM_PAYMENT, {
          ...actor(),
          payment: { method: "credit_card", transactionId: "txn_1" },
        }),
      ).toThrow(TransitionError);
    });

    it("cannot ship a DRAFT order", () => {
      const sm = buildMachine();
      const order = sm.createOrder("ORD-1", "a@b.com", SAMPLE_ITEMS);

      expect(() =>
        sm.send(order, OrderEvent.SHIP, {
          ...actor(),
          shipping: { carrier: "UPS", trackingNumber: "UPS123" },
        }),
      ).toThrow(TransitionError);
    });

    it("cannot deliver a PAID order (must ship first)", () => {
      const sm = buildMachine();
      const order = advanceTo(sm, OrderState.PAID);

      expect(() => sm.send(order, OrderEvent.DELIVER, actor())).toThrow(TransitionError);
    });
  });

  // ── Audit log ─────────────────────────────────────────────────────────────

  describe("audit log", () => {
    it("records actor and metadata for each transition", () => {
      const sm = buildMachine();
      let order = sm.createOrder("ORD-1", "alice@example.com", SAMPLE_ITEMS);
      order = sm.send(order, OrderEvent.SUBMIT, {
        actor: "alice",
        metadata: { ip: "1.2.3.4" },
      });

      expect(order.auditLog).toHaveLength(1);
      const entry = order.auditLog[0];
      expect(entry.fromState).toBe(OrderState.DRAFT);
      expect(entry.toState).toBe(OrderState.SUBMITTED);
      expect(entry.event).toBe(OrderEvent.SUBMIT);
      expect(entry.actor).toBe("alice");
      expect(entry.metadata).toEqual({ ip: "1.2.3.4" });
      expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it("accumulates entries across multiple transitions", () => {
      const sm = buildMachine();
      const order = advanceTo(sm, OrderState.PROCESSING);

      expect(order.auditLog).toHaveLength(4); // SUBMIT, REQUEST_PAYMENT, CONFIRM_PAYMENT, BEGIN_PROCESSING
      expect(order.auditLog.map((e) => e.toState)).toEqual([
        OrderState.SUBMITTED,
        OrderState.PAYMENT_PENDING,
        OrderState.PAID,
        OrderState.PROCESSING,
      ]);
    });
  });

  // ── Immutability ──────────────────────────────────────────────────────────

  describe("immutability", () => {
    it("does not mutate the original order", () => {
      const sm = buildMachine();
      const draft = sm.createOrder("ORD-1", "alice@example.com", SAMPLE_ITEMS);
      const submitted = sm.send(draft, OrderEvent.SUBMIT, actor());

      expect(draft.state).toBe(OrderState.DRAFT);
      expect(submitted.state).toBe(OrderState.SUBMITTED);
      expect(draft.auditLog).toHaveLength(0);
      expect(submitted.auditLog).toHaveLength(1);
    });
  });

  // ── availableEvents & canSend ─────────────────────────────────────────────

  describe("availableEvents", () => {
    it("returns SUBMIT and CANCEL for DRAFT", () => {
      const sm = buildMachine();
      const order = sm.createOrder("ORD-1", "a@b.com", SAMPLE_ITEMS);

      const events = sm.availableEvents(order);
      expect(events).toContain(OrderEvent.SUBMIT);
      expect(events).toContain(OrderEvent.CANCEL);
      expect(events).not.toContain(OrderEvent.SHIP);
    });

    it("returns nothing for terminal states", () => {
      const sm = buildMachine();
      let order = advanceTo(sm, OrderState.SUBMITTED);
      order = sm.send(order, OrderEvent.CANCEL, { ...actor(), reason: "done" });

      expect(sm.availableEvents(order)).toHaveLength(0);
    });
  });

  describe("canSend", () => {
    it("returns true for valid transition with valid context", () => {
      const sm = buildMachine();
      const order = sm.createOrder("ORD-1", "a@b.com", SAMPLE_ITEMS);

      expect(sm.canSend(order, OrderEvent.SUBMIT, actor())).toBe(true);
    });

    it("returns false when guard fails", () => {
      const sm = buildMachine();
      const order = sm.createOrder("ORD-1", "a@b.com", []);

      expect(sm.canSend(order, OrderEvent.SUBMIT, actor())).toBe(false);
    });

    it("returns false for undefined transition", () => {
      const sm = buildMachine();
      const order = sm.createOrder("ORD-1", "a@b.com", SAMPLE_ITEMS);

      expect(sm.canSend(order, OrderEvent.DELIVER, actor())).toBe(false);
    });
  });

  // ── Listener ──────────────────────────────────────────────────────────────

  describe("onTransition listener", () => {
    it("fires on every transition", () => {
      const sm = buildMachine();
      const entries: AuditEntry[] = [];
      sm.onTransition((e) => entries.push(e));

      advanceTo(sm, OrderState.DELIVERED);

      expect(entries).toHaveLength(6);
      expect(entries[0].event).toBe(OrderEvent.SUBMIT);
      expect(entries[5].event).toBe(OrderEvent.DELIVER);
    });

    it("can be unsubscribed", () => {
      const sm = buildMachine();
      const entries: AuditEntry[] = [];
      const unsub = sm.onTransition((e) => entries.push(e));

      let order = sm.createOrder("ORD-1", "a@b.com", SAMPLE_ITEMS);
      order = sm.send(order, OrderEvent.SUBMIT, actor());
      unsub();
      sm.send(order, OrderEvent.REQUEST_PAYMENT, {
        ...actor(),
        payment: { method: "credit_card" },
      });

      expect(entries).toHaveLength(1); // only the first transition
    });
  });
});
