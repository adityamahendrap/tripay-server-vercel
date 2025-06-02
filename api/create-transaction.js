const axios = require('axios');
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.TRIPAY_API_KEY;
    const privateKey = process.env.TRIPAY_PRIVATE_KEY;
    const merchantCode = process.env.TRIPAY_MERCHANT_CODE;

    if (!apiKey || !privateKey || !merchantCode) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { 
      merchant_ref, 
      amount, 
      customer_name, 
      customer_email, 
      customer_phone, 
      order_items,
      method = 'QRIS2' 
    } = req.body;

    if (!merchant_ref || !amount || !customer_name || !customer_email || !customer_phone || !order_items) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Calculate expiry (24 hours from now)
    const expiry = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

    // Generate signature
    const signature = crypto.createHmac('sha256', privateKey)
      .update(merchantCode + merchant_ref + amount)
      .digest('hex');

    const payload = {
      method: method,
      merchant_ref,
      amount,
      customer_name,
      customer_email,
      customer_phone,
      order_items,
      expired_time: expiry,
      signature
    };

    // Create transaction
    const tripayResponse = await axios.post(
      'https://tripay.co.id/api-sandbox/transaction/create',
      payload,
      {
        headers: { 'Authorization': 'Bearer ' + apiKey },
        validateStatus: function (status) {
          return status < 999; // ignore http error
        }
      }
    );

    res.status(tripayResponse.status).json(tripayResponse.data);

  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};