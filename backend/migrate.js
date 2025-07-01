const db = require('./db');

async function addColumnIfNotExists(table, column, type) {
  const client = await db.pool.connect();
  try {
    // Check if column exists
    const { rows } = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name=$2`, [table, column]);
    if (rows.length === 0) {
      await client.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      console.log(`Added column ${column} to ${table}`);
    } else {
      console.log(`Column ${column} already exists in ${table}`);
    }
  } finally {
    client.release();
  }
}

async function migrate() {
  try {
    // athletes: status (VARCHAR), biometric_hash (VARCHAR)
    await addColumnIfNotExists('athletes', 'status', "VARCHAR(20) DEFAULT 'Active'");
    await addColumnIfNotExists('athletes', 'biometric_hash', 'VARCHAR(255)');

    // Change private_key and ipfs_hash to TEXT for long values
    await db.query("ALTER TABLE athletes ALTER COLUMN private_key TYPE TEXT");
    await db.query("ALTER TABLE athletes ALTER COLUMN ipfs_hash TYPE TEXT");

    // vc_logs: reason (TEXT), evidence_url (TEXT), actor_id (VARCHAR)
    await addColumnIfNotExists('vc_logs', 'reason', 'TEXT');
    await addColumnIfNotExists('vc_logs', 'evidence_url', 'TEXT');
    await addColumnIfNotExists('vc_logs', 'actor_id', 'VARCHAR(255)');
    await addColumnIfNotExists('vc_logs', 'ipfs_cid', 'TEXT');

    await addColumnIfNotExists('athletes', 'nft_token_id', 'TEXT');
    await addColumnIfNotExists('athletes', 'nft_metadata_uri', 'TEXT');

    console.log('Migration complete.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
} 