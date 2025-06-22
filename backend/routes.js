const express = require('express');
const multer = require('multer');
const router = express.Router();
const db = require('./db');
const { uploadToIPFS } = require('./ipfs');
const { generateAthleteIdentity, createAthleteVC } = require('./identity');

const upload = multer({ storage: multer.memoryStorage() });

// POST /register-athlete
// Now handles file uploads for birth certificate and selfie
router.post(
  '/register-athlete',
  upload.fields([
    { name: 'birthCertificate', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  async (req, res) => {
    const { name, dob, gender, school_id, sport } = req.body;
    const files = req.files;

    if (!name || !dob || !school_id || !sport || !files.birthCertificate || !files.selfie) {
      return res.status(400).json({ message: 'Missing required fields or files' });
    }

    try {
      // 1. Upload files to IPFS and get a hash
      const ipfsHash = await uploadToIPFS(files);

      // 2. Generate a new DID and private key for the athlete
      const { did, privateKey } = generateAthleteIdentity();

      // 3. Create the payload for the Verifiable Credential
      const vcPayload = {
        name,
        dob,
        gender,
        sport,
        school_id,
        ipfsHash, // Include the IPFS hash as a claim
      };
      
      // 4. Create the signed VC JWT (for now, we just log it)
      const vcJwt = await createAthleteVC(vcPayload, did);
      console.log('--- VC JWT ---');
      console.log(vcJwt);
      console.log('----------------');

      // 5. Save athlete to the database with the new DID and private key
      const result = await db.query(
        'INSERT INTO athletes (name, dob, gender, school_id, sport, did, ipfs_hash, private_key) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [name, dob, gender, school_id, sport, did, ipfsHash, privateKey]
      );
      
      // 6. Log the registration event
      await db.query(
        'INSERT INTO vc_logs (action, actor) VALUES ($1, $2)',
        [`Registered athlete ${name} with DID ${did}`, 'registration-api']
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err.stack);
      res.status(500).json({ message: 'Error registering athlete' });
    }
  }
);

// GET /verify/:did
router.get('/verify/:did', async (req, res) => {
  const { did } = req.params;

  try {
    const result = await db.query('SELECT * FROM athletes WHERE did = $1', [did]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No athlete found with that DID.' });
    }

    const athlete = result.rows[0];
    
    // Log the verification event
    await db.query(
        'INSERT INTO vc_logs (action, actor) VALUES ($1, $2)',
        [`Verified DID ${did} for athlete ${athlete.name}`, 'verification-api']
      );

    res.json(athlete);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Error verifying athlete' });
  }
});

// GET /schools
router.get('/schools', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM schools ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err.stack);
    res.status(500).json({ message: 'Error fetching schools' });
  }
});

module.exports = router;
