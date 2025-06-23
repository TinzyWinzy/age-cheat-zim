const db = require('./db');

const createAndSeed = async () => {
  const client = await db.pool.connect();
  try {
    console.log('Beginning database initialization as part of server startup...');
    await client.query('BEGIN');

    // Combined query to create all tables if they don't exist
    const createSchemaQuery = `
      CREATE TABLE IF NOT EXISTS schools (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        province VARCHAR(100),
        zimsec_code VARCHAR(50) UNIQUE
      );
      CREATE TABLE IF NOT EXISTS athletes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        dob DATE NOT NULL,
        gender VARCHAR(10),
        school_id INTEGER REFERENCES schools(id),
        sport VARCHAR(100),
        did VARCHAR(255) UNIQUE,
        ipfs_hash VARCHAR(255),
        private_key VARCHAR(255) NOT NULL,
        registered_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS vc_logs (
        id SERIAL PRIMARY KEY,
        action VARCHAR(255) NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        actor VARCHAR(255)
      );
    `;
    await client.query(createSchemaQuery);
    console.log('Schema validation complete.');

    // Check if schools are already seeded to prevent re-seeding
    const { rows } = await client.query('SELECT COUNT(*) FROM schools');
    if (rows[0].count === '0') {
      console.log('No schools found. Seeding database...');
      const insertSchoolsQuery = `
        INSERT INTO schools (name, province, zimsec_code) VALUES
        ('Prince Edward School', 'Harare', '6701'),
        ('St. George''s College', 'Harare', '6702'),
        ('Falcon College', 'Matabeleland South', '6801'),
        ('Peterhouse Boys'' School', 'Mashonaland East', '6901'),
        ('Churchill School', 'Harare', '6703');
      `;
      await client.query(insertSchoolsQuery);
      console.log('Schools seeded successfully.');
    } else {
      console.log('Schools table is already seeded.');
    }

    await client.query('COMMIT');
    console.log('Database initialization committed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database initialization failed during server startup:', err.stack);
    throw err; // Re-throw the error to be handled by the main app process
  } finally {
    client.release(); // Release the client back to the pool
  }
};

module.exports = { createAndSeed }; 