// Run this ONCE to fix all existing tickets' QR codes
// node migrate-qr.js

const pool = require('./db');
const QRCode = require('qrcode');

async function migrateQRCodes() {
  console.log('Starting QR code migration...');
  
  const tickets = await pool.query(
    'SELECT id, ticket_code FROM tickets WHERE ticket_code IS NOT NULL'
  );
  
  console.log(`Found ${tickets.rows.length} tickets to migrate`);
  
  for (const ticket of tickets.rows) {
    // Regenerate QR to encode the ticket_code (CGO-XXXXX)
    const newQR = await QRCode.toDataURL(ticket.ticket_code);
    await pool.query(
      'UPDATE tickets SET qr_code = $1 WHERE id = $2',
      [newQR, ticket.id]
    );
    console.log(`✅ Fixed ticket #${ticket.id} → ${ticket.ticket_code}`);
  }
  
  console.log('Migration complete!');
  process.exit(0);
}

migrateQRCodes().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
