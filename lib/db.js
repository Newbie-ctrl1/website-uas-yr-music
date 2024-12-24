import { Pool } from 'pg';

let pool;

if (!pool) {
  const config = {
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };

  console.log('PostgreSQL Config:', {
    ...config,
    password: '********' // Hide password in logs
  });

  pool = new Pool(config);

  // Log successful connection
  pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
  });

  // Log errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
  });
}

// Fungsi helper untuk menjalankan query
export async function query(text, params) {
  const client = await pool.connect();
  try {
    console.log('Executing query:', text);
    console.log('Query parameters:', params);
    
    const result = await client.query(text, params);
    console.log('Query result rows:', result.rows.length);
    
    return result;
  } catch (err) {
    console.error('Error executing query', err.stack);
    throw err;
  } finally {
    client.release();
  }
}

export default pool; 