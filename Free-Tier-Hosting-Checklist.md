# 🚦 Free Tier Hosting Checklist

## 1. Backend (Railway)
- [ ] **Monitor RAM/CPU**: Check Railway dashboard for resource usage.
- [ ] **Database Storage**: Ensure PostgreSQL DB is <1GB (free tier limit).
- [ ] **Backups**:  
  - [ ] Export DB regularly (manual if on free tier).
  - [ ] Store backup files securely (e.g., local, cloud).
- [ ] **Environment Variables**:  
  - [ ] Store all secrets (API keys, DB URIs) in Railway's env settings.
- [ ] **Cold Start Awareness**:  
  - [ ] Expect 5–30s delay after inactivity.
- [ ] **Logs**:  
  - [ ] Review logs for errors, crashes, or quota warnings.

---

## 2. Storage (Pinata)
- [ ] **Monitor Usage**:  
  - [ ] Keep total pinned files <100 and storage <1GB.
- [ ] **Bandwidth**:  
  - [ ] Track monthly bandwidth (<1GB/month).
- [ ] **Critical Data**:  
  - [ ] For essential files, consider pinning to a secondary IPFS service (Web3.Storage, Filebase).
- [ ] **API Keys**:  
  - [ ] Store Pinata keys in backend env vars, not in code.

---

## 3. Frontend (Vercel)
- [ ] **Bandwidth**:  
  - [ ] Monitor usage (<100GB/month).
- [ ] **Build Cache**:  
  - [ ] Keep build artifacts <1GB.
- [ ] **Serverless Functions**:  
  - [ ] Stay within 12 executions/minute.
- [ ] **Environment Variables**:  
  - [ ] Set API endpoints and secrets in Vercel dashboard.
- [ ] **Optimize Assets**:  
  - [ ] Compress images, minify JS/CSS.

---

## 4. General Security & Compliance
- [ ] **No Secrets in Code**:  
  - [ ] Double-check for hardcoded API keys, JWTs, or DB URIs.
- [ ] **Data Privacy**:  
  - [ ] Encrypt sensitive data (biometrics, PII) at rest and in transit.
- [ ] **Regular Audits**:  
  - [ ] Review access logs and permissions monthly.

---

## 5. Scaling & Redundancy
- [ ] **Plan for Growth**:  
  - [ ] Set alerts for nearing quotas.
  - [ ] Document upgrade paths for each service.
- [ ] **Redundancy**:  
  - [ ] For critical data, use multiple storage providers or regular exports.

---

## 6. Documentation
- [ ] **Keep a README**:  
  - [ ] Document all environment variables, backup procedures, and quota limits.
- [ ] **Onboarding**:  
  - [ ] Write a quickstart for new devs (how to deploy, restore, monitor).

---

**Pro Tip:**  
Set calendar reminders to check quotas and perform backups weekly! 