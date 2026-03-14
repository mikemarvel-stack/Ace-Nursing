const axios = require('axios');

const PAYPAL_BASE =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

/**
 * Get a PayPal OAuth2 access token
 */
async function getPayPalAccessToken() {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await axios.post(
    `${PAYPAL_BASE}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data.access_token;
}

/**
 * Create a PayPal order
 */
async function createPayPalOrder({ amount, currency = 'USD', orderId, items }) {
  const token = await getPayPalAccessToken();

  const payload = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: orderId,
        description: 'AceNursing Study Materials',
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
          },
        },
        items: items.map(item => ({
          name: item.title.substring(0, 127),
          unit_amount: {
            currency_code: currency,
            value: item.price.toFixed(2),
          },
          quantity: item.quantity.toString(),
          category: 'DIGITAL_GOODS',
        })),
      },
    ],
    application_context: {
      brand_name: 'AceNursing',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      shipping_preference: 'NO_SHIPPING',
    },
  };

  const response = await axios.post(`${PAYPAL_BASE}/v2/checkout/orders`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}

/**
 * Capture a PayPal order after buyer approval
 */
async function capturePayPalOrder(paypalOrderId) {
  const token = await getPayPalAccessToken();

  const response = await axios.post(
    `${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

module.exports = { createPayPalOrder, capturePayPalOrder, PAYPAL_BASE };
