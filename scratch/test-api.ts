import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file
config({ path: resolve(__dirname, '../.env') });

import handler from '../api/payment/create';

// Mock request and response
const req = {
  method: 'POST',
  body: {
    amount: 500000,
    payerNumber: '623000000',
    description: 'Test commande meuble',
    merchantPaymentReference: 'TEST-1234',
    metadata: {
      nom: 'Test',
      prenom: 'User',
      telephone: '623000000',
      adresse: 'Conakry',
      produit: 'Meuble TV',
      prix: '500,000 GNF'
    }
  }
};

const res = {
  setHeader: function() { return this; },
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log(`Status: ${this.statusCode}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
  }
};

console.log("Testing Djomy API creation...");
handler(req, res).catch(console.error);
