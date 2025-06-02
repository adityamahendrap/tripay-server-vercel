const axios = require('axios');
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed. Only GET requests are accepted.' 
    });
  }

  try {
    // Get environment variables
    const apiKey = process.env.TRIPAY_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ 
        success: false,
        error: 'Server configuration error - TRIPAY_API_KEY not set' 
      });
    }

    // Get reference from query parameter
    const { reference } = req.query;
    
    if (!reference) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required parameter: reference' 
      });
    }

    // Get transaction detail from Tripay
    const tripayResponse = await axios.get(
      `https://tripay.co.id/api-sandbox/transaction/detail?reference=${reference}`,
      {
        headers: { 'Authorization': 'Bearer ' + apiKey },
        validateStatus: function (status) {
          return status < 999; // ignore http error
        }
      }
    );

    res.status(tripayResponse.status).json(tripayResponse.data);

  } catch (error) {
    console.error('Error checking transaction:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
};