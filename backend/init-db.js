const db = require('./db');

const createTables = async () => {
  const schoolTableQuery = `
    CREATE TABLE IF NOT EXISTS schools (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      province VARCHAR(100),
      zimsec_code VARCHAR(50) UNIQUE
    );
  `;

  const athleteTableQuery = `
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
  `;

  const vcLogsTableQuery = `
    CREATE TABLE IF NOT EXISTS vc_logs (
      id SERIAL PRIMARY KEY,
      action VARCHAR(255) NOT NULL,
      timestamp TIMESTAMPTZ DEFAULT NOW(),
      actor VARCHAR(255)
    );
  `;

  try {
    console.log('Dropping existing tables...');
    await db.query('DROP TABLE IF EXISTS vc_logs, athletes, schools CASCADE;');
    console.log('Tables dropped.');

    console.log('Creating tables...');
    await db.query(schoolTableQuery);
    await db.query(athleteTableQuery);
    await db.query(vcLogsTableQuery);
    console.log('Tables created successfully.');

    await seedSchools();
  } catch (err) {
    console.error('Error creating tables', err.stack);
  } finally {
    // In a real app you might want to close the pool, but for a script it's ok
  }
};

const seedSchools = async () => {
  const insertSchoolsQuery = `
    INSERT INTO schools (name, province, zimsec_code) VALUES
    ('Prince Edward School', 'Harare', '6701'),
    ('St. George''s College', 'Harare', '6702'),
    ('Falcon College', 'Matabeleland South', '6801'),
    ('Peterhouse Boys'' School', 'Mashonaland East', '6901'),
    ('Churchill School', 'Harare', '6703');
  `;
  try {
    console.log('Seeding schools...');
    await db.query(insertSchoolsQuery);
    console.log('Schools seeded successfully.');
  } catch (err) {
    console.error('Error seeding schools', err.stack);
  }
};

createTables(); 