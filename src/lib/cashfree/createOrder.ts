import {
  CashfreeConfig,
  CASHFREE_BASE_URL,
  getCashfreeHeaders,
} from "./client";

export interface CreateOrderRequest {
  orderId: string;
  orderAmount: number;
  orderCurrency?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderNote?: string;
  returnUrl: string;
  notifyUrl: string;
}

export interface CreateOrderResponse {
  order_id: string;
  order_status: string;
  payment_session_id: string;
  order_expiry_time: string;
  order_token: string;
  cf_order_id: string;
}

export async function createCashfreeOrder(
  config: CashfreeConfig,
  req: CreateOrderRequest
): Promise<CreateOrderResponse> {
  const url = `${CASHFREE_BASE_URL[config.env]}/orders`;

  const body = {
    order_id: req.orderId,
    order_amount: req.orderAmount,
    order_currency: req.orderCurrency ?? "INR",
    customer_details: {
      customer_id: req.orderId,
      customer_name: req.customerName,
      customer_phone: req.customerPhone,
      customer_email: req.customerEmail ?? "",
    },
    order_meta: {
      return_url: req.returnUrl,
      notify_url: req.notifyUrl,
    },
    order_note: req.orderNote ?? "",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: getCashfreeHeaders(config),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Cashfree order creation failed: ${error.message ?? response.statusText}`
    );
  }

  return response.json();
}
