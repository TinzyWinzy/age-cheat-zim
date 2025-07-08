const express = require('express');
const multer = require('multer');
const router = express.Router();
const db = require('./db');
const { uploadToIPFS, uploadTeamCardMetadataToIPFS } = require('./ipfs');
const { generateAthleteIdentity, createAthleteVC } = require('./identity');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getValidPolygonAddressFromDID } = require('./utils');
const { ethers } = require('ethers');

const upload = multer({ storage: multer.memoryStorage() });

// Hardhat local node config
const TEAM_CARD_NFT_ADDRESS = process.env.TEAM_CARD_NFT_ADDRESS || '0xYourDeployedContractAddress';
if (!ethers.utils.isAddress(TEAM_CARD_NFT_ADDRESS)) {
  throw new Error('TEAM_CARD_NFT_ADDRESS is not set to a valid address! Please set it in your Railway environment variables.');
}
const ATHLETE_CREDENTIAL_ABI = require('./contracts/AthleteCredential.json').abi; // Updated to correct ABI file
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Use a local Hardhat account private key for signing transactions
const LOCAL_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Account #0 from Hardhat node
const wallet = new ethers.Wallet(LOCAL_PRIVATE_KEY, provider);
console.log('Using TeamCardNFT contract address:', TEAM_CARD_NFT_ADDRESS);
const athleteCredential = new ethers.Contract(TEAM_CARD_NFT_ADDRESS, ATHLETE_CREDENTIAL_ABI, wallet); // Update address var name if needed

// Helper to get face embedding from Python service
async function getFaceEmbedding(imageBuffer) {
  const formData = new FormData();
  formData.append('image', imageBuffer, { filename: 'selfie.jpg' });
  const response = await fetch(process.env.FACE_SERVICE_URL || 'http://localhost:5001/extract-embedding', {
    method: 'POST',
    body: formData,
    headers: formData.getHeaders(),
  });
  if (!response.ok) throw new Error('Face service error');
  const data = await response.json();
  if (!data.embedding) throw new Error(data.error || 'No embedding returned');
  return data.embedding;
}

// Helper to compare embeddings
async function compareEmbeddings(newEmbedding, existingEmbeddings) {
  const response = await fetch(process.env.FACE_SERVICE_URL_COMPARE || 'http://localhost:5001/compare-embedding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      new_embedding: newEmbedding,
      existing_embeddings: existingEmbeddings,
      threshold: 10.0,
    }),
  });
  if (!response.ok) throw new Error('Face service error');
  return await response.json();
}

// Helper to hash and pin log to IPFS
async function hashAndPinLog(logObj) {
  const logString = JSON.stringify(logObj);
  const hash = crypto.createHash('sha256').update(logString).digest('hex');
  let ipfs_cid = null;
  try {
    ipfs_cid = await uploadTeamCardMetadataToIPFS({ ...logObj, hash });
  } catch (err) {
    console.error('IPFS log pin error:', err);
  }
  return { hash, ipfs_cid };
}

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
      // 1. Upload files to IPFS and get hashes
      let ipfsHashes;
      try {
        ipfsHashes = await uploadToIPFS(files);
      } catch (ipfsErr) {
        console.error('IPFS upload error:', ipfsErr);
        return res.status(500).json({ message: 'Failed to upload files to IPFS', detail: process.env.NODE_ENV === 'development' ? ipfsErr.message : undefined });
      }

      // 2. Extract face embedding from selfie
      let embedding;
      try {
        embedding = await getFaceEmbedding(files.selfie[0].buffer);
      } catch (err) {
        console.error('Biometric service error:', err);
        return res.status(500).json({ message: 'Biometric service error', detail: err.message });
      }

      // 3. Fetch all existing embeddings from DB
      let existingAthletes = [];
      let existingEmbeddings = [];
      try {
        const { rows } = await db.query('SELECT id, name, biometric_hash FROM athletes WHERE biometric_hash IS NOT NULL');
        existingAthletes = rows;
        existingEmbeddings = rows.map(a => {
          try {
            return JSON.parse(a.biometric_hash);
          } catch {
            return null;
          }
        }).filter(e => Array.isArray(e));
      } catch (dbErr) {
        console.error('DB fetch error:', dbErr);
        return res.status(500).json({ message: 'Failed to fetch existing biometric hashes', detail: dbErr.message });
      }

      // 4. Compare new embedding to existing
      if (existingEmbeddings.length > 0) {
        let compareResult;
        try {
          compareResult = await compareEmbeddings(embedding, existingEmbeddings);
        } catch (err) {
          console.error('Biometric compare error:', err);
          return res.status(500).json({ message: 'Biometric compare error', detail: err.message });
        }
        if (compareResult.match) {
          const matchedAthlete = existingAthletes[compareResult.best_idx];
          return res.status(409).json({
            message: 'Duplicate biometric detected. This face is already registered.',
            match_score: compareResult.best_score,
            matched_athlete: { id: matchedAthlete.id, name: matchedAthlete.name }
          });
        }
      }

      // 5. Generate a new DID and private key for the athlete
      let did, privateKey;
      try {
        const identity = generateAthleteIdentity();
        did = identity.did;
        privateKey = identity.privateKey;
      } catch (idErr) {
        console.error('DID generation error:', idErr);
        return res.status(500).json({ message: 'Failed to generate athlete identity', detail: process.env.NODE_ENV === 'development' ? idErr.message : undefined });
      }

      // 6. Create the payload for the Verifiable Credential
      const vcPayload = {
        name,
        dob,
        gender,
        sport,
        school_id,
        ipfsHash: ipfsHashes.metadataHash, // Include the metadata hash as a claim
      };
      
      // 7. Create the signed VC JWT (for now, we just log it)
      let vcJwt;
      try {
        vcJwt = await createAthleteVC(vcPayload, did);
      } catch (vcErr) {
        console.error('VC creation error:', vcErr);
        return res.status(500).json({ message: 'Failed to create verifiable credential', detail: process.env.NODE_ENV === 'development' ? vcErr.message : undefined });
      }
      console.log('--- VC JWT ---');
      console.log(vcJwt);
      console.log('----------------');

      // 8. Save athlete to the database with the new DID, private key, and biometric hash
      let result;
      try {
        result = await db.query(
          'INSERT INTO athletes (name, dob, gender, school_id, sport, did, ipfs_hash, selfie_ipfs_hash, private_key, biometric_hash) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
          [name, dob, gender, school_id, sport, did, ipfsHashes.metadataHash, ipfsHashes.selfieHash, privateKey, JSON.stringify(embedding)]
        );
      } catch (dbErr) {
        console.error('DB insert error:', dbErr);
        return res.status(500).json({ message: 'Failed to save athlete to database', detail: process.env.NODE_ENV === 'development' ? dbErr.message : undefined });
      }
      
      // 9. Log the registration event
      const regLog = {
        action: `Registered athlete ${name} with DID ${did}`,
        actor: 'registration-api',
        timestamp: new Date().toISOString(),
      };
      const regPin = await hashAndPinLog(regLog);
      await db.query(
        'INSERT INTO vc_logs (action, actor, timestamp, ipfs_cid) VALUES ($1, $2, $3, $4)',
        [regLog.action, regLog.actor, regLog.timestamp, regPin.ipfs_cid]
      );
      // 10. Log consent given
      const consentLog = {
        action: `consent_given for DID ${did}`,
        actor: 'user',
        did,
        timestamp: new Date().toISOString(),
      };
      const consentPin = await hashAndPinLog(consentLog);
      await db.query(
        'INSERT INTO vc_logs (action, actor, timestamp, ipfs_cid) VALUES ($1, $2, $3, $4)',
        [consentLog.action, consentLog.actor, consentLog.timestamp, consentPin.ipfs_cid]
      );

      // 11. Generate Team Card NFT metadata
      const teamCardMetadata = {
        athlete_did: did,
        name,
        team: school_id, // You may want to fetch the school name
        season: new Date().getFullYear().toString(),
        sport,
        vc_ipfs_hash: ipfsHashes.metadataHash,
        photo_url: ipfsHashes.selfieHash ? `ipfs://${ipfsHashes.selfieHash}` : '',
        status: 'Active',
        issued_at: new Date().toISOString()
      };
      // 12. Upload metadata to IPFS
      let nftMetadataHash;
      try {
        nftMetadataHash = await uploadTeamCardMetadataToIPFS(teamCardMetadata);
      } catch (err) {
        console.error('NFT metadata IPFS upload error:', err);
        // Continue, but log error
      }
      // 13. Mint NFT to athlete's DID wallet address
      let nftTokenId = null;
      if (nftMetadataHash) {
        try {
          const athleteWalletAddress = getValidPolygonAddressFromDID(did);
          if (!ethers.utils.isAddress(athleteWalletAddress)) {
            throw new Error('Invalid athlete wallet address: ' + athleteWalletAddress);
          }
          console.log('Minting NFT to athlete address:', athleteWalletAddress);
          // Use the real DID and VC IPFS hash
          const tx = await athleteCredential.mintCredential(
            athleteWalletAddress,
            did,
            ipfsHashes.metadataHash,
            ethers.utils.formatBytes32String('biohash'), // TODO: replace with real biometric hash if available
            `ipfs://${nftMetadataHash}`
          );
          const receipt = await tx.wait();
          nftTokenId = receipt && receipt.events && receipt.events[0] ? receipt.events[0].args.tokenId.toString() : null;
          // Optionally, store tokenId and URI in DB
          await db.query('UPDATE athletes SET nft_token_id = $1, nft_metadata_uri = $2 WHERE did = $3', [nftTokenId, `ipfs://${nftMetadataHash}`, did]);
        } catch (err) {
          console.error('NFT minting error:', err);
          // Continue, but log error
        }
      }

      res.status(201).json({
        ...result.rows[0],
        vc_jwt: vcJwt
      });
    } catch (err) {
      console.error(err.stack);
      res.status(500).json({ message: 'Error registering athlete', detail: process.env.NODE_ENV === 'development' ? err.message : undefined });
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

    // Calculate age
    const dob = new Date(athlete.dob);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    // Determine eligibility
    let eligibility = 'Eligible';
    let revocationReason = null;
    if (athlete.status && athlete.status.toLowerCase() === 'revoked') {
      eligibility = 'Revoked';
      // Fetch latest revocation reason from vc_logs
      const logResult = await db.query(
        "SELECT reason FROM vc_logs WHERE action LIKE $1 AND reason IS NOT NULL ORDER BY timestamp DESC LIMIT 1",
        [`Revoked athlete with DID ${did}`]
      );
      if (logResult.rows.length > 0) {
        revocationReason = logResult.rows[0].reason;
      }
    } else if (age < 10 || age > 18) {
      eligibility = 'Ineligible';
    }

    // Log the verification event
    const verLog = {
      action: `Verified DID ${did} for athlete ${athlete.name}`,
      actor: 'verification-api',
      timestamp: new Date().toISOString(),
    };
    const verPin = await hashAndPinLog(verLog);
    await db.query(
      'INSERT INTO vc_logs (action, actor, timestamp, ipfs_cid) VALUES ($1, $2, $3, $4)',
      [verLog.action, verLog.actor, verLog.timestamp, verPin.ipfs_cid]
    );
    // Log consent given for verification
    const consentLog = {
      action: `consent_given for DID ${did}`,
      actor: 'user',
      did,
      timestamp: new Date().toISOString(),
    };
    const consentPin = await hashAndPinLog(consentLog);
    await db.query(
      'INSERT INTO vc_logs (action, actor, timestamp, ipfs_cid) VALUES ($1, $2, $3, $4)',
      [consentLog.action, consentLog.actor, consentLog.timestamp, consentPin.ipfs_cid]
    );

    // Respond with athlete info, age, and eligibility
    res.json({
      ...athlete,
      age,
      eligibility,
      revocationReason,
      status: athlete.status
    });
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

// GET /dashboard-stats
router.get('/dashboard-stats', async (req, res) => {
    try {
        const athletesCountQuery = db.query('SELECT COUNT(*) FROM athletes');
        const schoolsCountQuery = db.query('SELECT COUNT(*) FROM schools');
        const logsCountQuery = db.query('SELECT COUNT(*) FROM vc_logs WHERE action LIKE \'Verified DID%\'');

        const [athletesCount, schoolsCount, logsCount] = await Promise.all([
            athletesCountQuery,
            schoolsCountQuery,
            logsCountQuery,
        ]);

        res.json({
            totalAthletes: parseInt(athletesCount.rows[0].count, 10),
            totalSchools: parseInt(schoolsCount.rows[0].count, 10),
            totalVerifications: parseInt(logsCount.rows[0].count, 10),
        });
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
});

// GET /activity-log
router.get('/activity-log', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM vc_logs ORDER BY timestamp DESC LIMIT 10');
        res.json(result.rows);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Error fetching activity log' });
    }
});

// POST /flag-athlete/:did
router.post('/flag-athlete/:did', async (req, res) => {
  const { did } = req.params;
  const { reason, evidence_url, actor_id } = req.body;
  if (!reason || !actor_id) {
    return res.status(400).json({ message: 'Reason and actor_id are required.' });
  }
  try {
    // Update athlete status to Revoked
    const updateResult = await db.query(
      "UPDATE athletes SET status = 'Revoked' WHERE did = $1 RETURNING *",
      [did]
    );
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: 'Athlete not found.' });
    }
    // Log the revocation
    const revLog = {
      action: `Revoked athlete with DID ${did}`,
      reason,
      evidence_url,
      actor_id,
      timestamp: new Date().toISOString(),
    };
    const revPin = await hashAndPinLog(revLog);
    await db.query(
      'INSERT INTO vc_logs (action, reason, evidence_url, actor_id, timestamp, ipfs_cid) VALUES ($1, $2, $3, $4, $5, $6)',
      [revLog.action, revLog.reason, revLog.evidence_url, revLog.actor_id, revLog.timestamp, revPin.ipfs_cid]
    );
    res.json({ message: 'Athlete credential revoked.', athlete: updateResult.rows[0] });
  } catch (err) {
    console.error('Error flagging athlete:', err);
    res.status(500).json({ message: 'Failed to revoke athlete.', detail: err.message });
  }
});

// GET /revoked-athletes
router.get('/revoked-athletes', async (req, res) => {
  try {
    // Get all revoked athletes
    const { rows: athletes } = await db.query("SELECT * FROM athletes WHERE status = 'Revoked'");
    if (athletes.length === 0) return res.json([]);
    // For each athlete, get the latest revocation log
    const results = await Promise.all(athletes.map(async (athlete) => {
      const logResult = await db.query(
        "SELECT reason, evidence_url, actor_id, timestamp FROM vc_logs WHERE action LIKE $1 AND reason IS NOT NULL ORDER BY timestamp DESC LIMIT 1",
        [`Revoked athlete with DID ${athlete.did}`]
      );
      const log = logResult.rows[0] || {};
      return {
        name: athlete.name,
        did: athlete.did,
        reason: log.reason || null,
        evidence_url: log.evidence_url || null,
        actor_id: log.actor_id || null,
        timestamp: log.timestamp || null,
      };
    }));
    res.json(results);
  } catch (err) {
    console.error('Error fetching revoked athletes:', err);
    res.status(500).json({ message: 'Failed to fetch revoked athletes.', detail: err.message });
  }
});

// GET /athletes - List all athletes with NFT info for dashboard
router.get('/athletes', async (req, res) => {
  try {
    const result = await db.query('SELECT name, did, nft_token_id, nft_metadata_uri, status, sport, school_id, ipfs_hash, registered_at FROM athletes ORDER BY registered_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching athletes:', err);
    res.status(500).json({ message: 'Failed to fetch athletes.' });
  }
});

// GET /athlete/:did - Get full details for a single athlete (for Team Card page)
router.get('/athlete/:did', async (req, res) => {
  try {
    const { did } = req.params;
    const result = await db.query('SELECT * FROM athletes WHERE did = $1', [did]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Athlete not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching athlete:', err);
    res.status(500).json({ message: 'Failed to fetch athlete.' });
  }
});

// GET /logs/:did
router.get('/logs/:did', async (req, res) => {
  const { did } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM vc_logs WHERE action LIKE $1 ORDER BY timestamp DESC',
      [`%${did}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch logs for DID.' });
  }
});

module.exports = router;
