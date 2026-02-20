// ─── Types ────────────────────────────────────────────────────────────────────

export enum OrderState {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  PAID = "PAID",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum OrderEvent {
  SUBMIT = "SUBMIT",
  REQUEST_PAYMENT = "REQUEST_PAYMENT",
  CONFIRM_PAYMENT = "CONFIRM_PAYMENT",
  BEGIN_PROCESSING = "BEGIN_PROCESSING",
  SHIP = "SHIP",
  DELIVER = "DELIVER",
  CANCEL = "CANCEL",
  REFUND = "REFUND",
}

export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface PaymentInfo {
  method: "credit_card" | "paypal" | "bank_transfer";
  transactionId?: string;
  amount?: number;
}

export interface ShippingInfo {
  carrier: string;
  trackingNumber: string;
  estimatedDelivery?: Date;
}

export interface AuditEntry {
  timestamp: Date;
  fromState: OrderState;
  toState: OrderState;
  event: OrderEvent;
  actor: string;
  metadata: Record<string, unknown>;
}

export interface Order {
  id: string;
  items: OrderItem[];
  state: OrderState;
  customerEmail: string;
  payment?: PaymentInfo;
  shipping?: ShippingInfo;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  refundedAt?: Date;
  submittedAt?: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancellationReason?: string;
  refundReason?: string;
  totalAmount: number;
  auditLog: AuditEntry[];
}

export interface TransitionContext {
  actor: string;
  reason?: string;
  payment?: PaymentInfo;
  shipping?: ShippingInfo;
  metadata?: Record<string, unknown>;
}

export class TransitionError extends Error {
  constructor(
    public readonly from: OrderState,
    public readonly event: OrderEvent,
    message: string,
  ) {
    super(`Cannot ${event} from ${from}: ${message}`);
    this.name = "TransitionError";
  }
}

// ─── Transition Table ─────────────────────────────────────────────────────────

type TransitionHandler = (order: Order, ctx: TransitionContext) => Order;

interface TransitionDef {
  target: OrderState;
  guard: (order: Order, ctx: TransitionContext) => string | null; // null = pass, string = error
  effect: TransitionHandler;
}

const TRANSITIONS: Record<string, TransitionDef> = {
  // DRAFT → SUBMITTED
  [`${OrderState.DRAFT}:${OrderEvent.SUBMIT}`]: {
    target: OrderState.SUBMITTED,
    guard(order) {
      if (order.items.length === 0) return "Order has no items";
      if (order.totalAmount <= 0) return "Order total must be positive";
      if (!order.customerEmail) return "Customer email is required";
      return null;
    },
    effect(order) {
      return { ...order, submittedAt: new Date() };
    },
  },

  // SUBMITTED → PAYMENT_PENDING
  [`${OrderState.SUBMITTED}:${OrderEvent.REQUEST_PAYMENT}`]: {
    target: OrderState.PAYMENT_PENDING,
    guard(order, ctx) {
      if (!ctx.payment) return "Payment info is required";
      if (!ctx.payment.method) return "Payment method is required";
      return null;
    },
    effect(order, ctx) {
      return { ...order, payment: { ...ctx.payment! } };
    },
  },

  // PAYMENT_PENDING → PAID
  [`${OrderState.PAYMENT_PENDING}:${OrderEvent.CONFIRM_PAYMENT}`]: {
    target: OrderState.PAID,
    guard(order, ctx) {
      if (!ctx.payment?.transactionId) return "Transaction ID is required to confirm payment";
      const expectedAmount = ctx.payment.amount ?? 0;
      if (expectedAmount > 0 && Math.abs(expectedAmount - order.totalAmount) > 0.01) {
        return `Payment amount ${expectedAmount} does not match order total ${order.totalAmount}`;
      }
      return null;
    },
    effect(order, ctx) {
      return {
        ...order,
        paidAt: new Date(),
        payment: {
          ...order.payment!,
          transactionId: ctx.payment!.transactionId,
          amount: order.totalAmount,
        },
      };
    },
  },

  // PAID → PROCESSING
  [`${OrderState.PAID}:${OrderEvent.BEGIN_PROCESSING}`]: {
    target: OrderState.PROCESSING,
    guard(order) {
      if (!order.paidAt) return "Order must be paid before processing";
      return null;
    },
    effect(order) {
      return { ...order };
    },
  },

  // PROCESSING → SHIPPED
  [`${OrderState.PROCESSING}:${OrderEvent.SHIP}`]: {
    target: OrderState.SHIPPED,
    guard(_order, ctx) {
      if (!ctx.shipping) return "Shipping info is required";
      if (!ctx.shipping.carrier) return "Carrier is required";
      if (!ctx.shipping.trackingNumber) return "Tracking number is required";
      return null;
    },
    effect(order, ctx) {
      return {
        ...order,
        shippedAt: new Date(),
        shipping: { ...ctx.shipping! },
      };
    },
  },

  // SHIPPED → DELIVERED
  [`${OrderState.SHIPPED}:${OrderEvent.DELIVER}`]: {
    target: OrderState.DELIVERED,
    guard(order) {
      if (!order.shippedAt) return "Order must be shipped before delivery";
      return null;
    },
    effect(order) {
      return { ...order, deliveredAt: new Date() };
    },
  },

  // Cancellations — allowed from DRAFT, SUBMITTED, PAYMENT_PENDING, PAID, PROCESSING
  ...Object.fromEntries(
    [
      OrderState.DRAFT,
      OrderState.SUBMITTED,
      OrderState.PAYMENT_PENDING,
      OrderState.PAID,
      OrderState.PROCESSING,
    ].map((src) => [
      `${src}:${OrderEvent.CANCEL}`,
      {
        target: OrderState.CANCELLED,
        guard(_order: Order, ctx: TransitionContext) {
          if (!ctx.reason) return "Cancellation reason is required";
          return null;
        },
        effect(order: Order, ctx: TransitionContext) {
          return {
            ...order,
            cancelledAt: new Date(),
            cancellationReason: ctx.reason,
          };
        },
      } satisfies TransitionDef,
    ]),
  ),

  // Refunds — allowed from PAID, PROCESSING, SHIPPED, DELIVERED
  ...Object.fromEntries(
    [
      OrderState.PAID,
      OrderState.PROCESSING,
      OrderState.SHIPPED,
      OrderState.DELIVERED,
    ].map((src) => [
      `${src}:${OrderEvent.REFUND}`,
      {
        target: OrderState.REFUNDED,
        guard(order: Order, ctx: TransitionContext) {
          if (!ctx.reason) return "Refund reason is required";
          if (!order.payment?.transactionId)
            return "Cannot refund an order without a completed payment";
          return null;
        },
        effect(order: Order, ctx: TransitionContext) {
          return {
            ...order,
            refundedAt: new Date(),
            refundReason: ctx.reason,
          };
        },
      } satisfies TransitionDef,
    ]),
  ),
};

// ─── State Machine ────────────────────────────────────────────────────────────

export class OrderStateMachine {
  private listeners: Array<(entry: AuditEntry) => void> = [];

  /** Subscribe to transition events. Returns an unsubscribe function. */
  onTransition(fn: (entry: AuditEntry) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  /** Create a new draft order. */
  createOrder(id: string, customerEmail: string, items: OrderItem[]): Order {
    const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    return {
      id,
      items: [...items],
      state: OrderState.DRAFT,
      customerEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
      totalAmount: Math.round(totalAmount * 100) / 100,
      auditLog: [],
    };
  }

  /** Send an event to transition the order. Returns a new order (immutable). */
  send(order: Order, event: OrderEvent, ctx: TransitionContext): Order {
    const key = `${order.state}:${event}`;
    const def = TRANSITIONS[key];

    if (!def) {
      throw new TransitionError(
        order.state,
        event,
        `No transition defined for event ${event} in state ${order.state}`,
      );
    }

    const guardError = def.guard(order, ctx);
    if (guardError) {
      throw new TransitionError(order.state, event, guardError);
    }

    const fromState = order.state;
    let next = def.effect(order, ctx);
    next = {
      ...next,
      state: def.target,
      updatedAt: new Date(),
    };

    const entry: AuditEntry = {
      timestamp: new Date(),
      fromState,
      toState: def.target,
      event,
      actor: ctx.actor,
      metadata: ctx.metadata ?? {},
    };

    next = { ...next, auditLog: [...next.auditLog, entry] };

    for (const fn of this.listeners) {
      fn(entry);
    }

    return next;
  }

  /** Return all events valid from the current state. */
  availableEvents(order: Order): OrderEvent[] {
    return Object.values(OrderEvent).filter(
      (evt) => TRANSITIONS[`${order.state}:${evt}`] !== undefined,
    );
  }

  /** Check whether a specific transition is valid (without applying it). */
  canSend(order: Order, event: OrderEvent, ctx: TransitionContext): boolean {
    const key = `${order.state}:${event}`;
    const def = TRANSITIONS[key];
    if (!def) return false;
    return def.guard(order, ctx) === null;
  }
}
