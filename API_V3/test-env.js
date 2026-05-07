require('dotenv').config();

console.log('N8N_API_KEY:', process.env.N8N_API_KEY ? '(definida)' : 'NO DEFINIDA');
console.log('Valor real:', process.env.N8N_API_KEY || '(vacía)'); 