const { getPool } = require('../lib/db');

async function up() {
  const pool = await getPool();
  try {
    await pool.query(`
      ALTER TABLE notifications 
      ADD COLUMN IF NOT EXISTS ticket_codes TEXT[];
    `);
    console.log('Successfully added ticket_codes column to notifications table');
  } catch (error) {
    console.error('Error adding ticket_codes column:', error);
    throw error;
  }
}

async function down() {
  const pool = await getPool();
  try {
    await pool.query(`
      ALTER TABLE notifications 
      DROP COLUMN IF EXISTS ticket_codes;
    `);
    console.log('Successfully removed ticket_codes column from notifications table');
  } catch (error) {
    console.error('Error removing ticket_codes column:', error);
    throw error;
  }
}

module.exports = {
  up,
  down
}; 