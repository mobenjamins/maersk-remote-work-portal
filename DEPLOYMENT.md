# Deployment Guide: Maersk Remote Work Portal

This document describes how to deploy the Maersk Remote Work Portal to production using Railway (backend) and GitHub Pages (frontends).

---

## Architecture Overview

The application consists of three components:

1. **Backend (Django REST API)** → Deployed on Railway with PostgreSQL
2. **Employee Frontend (React)** → Deployed on GitHub Pages at `/`
3. **Admin Frontend (React)** → Deployed on GitHub Pages at `/employer/`

All components are in the same GitHub monorepo: `mobenjamins/maersk-remote-work-portal`

---

## Quick Start: Local Development

### Backend Setup
```bash
cd Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with database credentials (PostgreSQL or SQLite for dev)

# Run migrations and start server
python3 manage.py migrate
python3 manage.py createsuperuser  # Optional: for /admin/
python3 manage.py runserver
```

Backend runs on `http://localhost:8000/api`

### Frontend Setup (Employee)
```bash
cd Frontend
npm install

# Create .env.local (development)
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env.local
echo "GEMINI_API_KEY=<your-key>" >> .env.local

npm run dev
```

Frontend runs on `http://localhost:3000`

### Admin Frontend Setup
```bash
cd Admin_frontend/admin-app
npm install

# Create .env.local (development)
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env.local
echo "GEMINI_API_KEY=<your-key>" >> .env.local

npm run dev
```

Admin frontend runs on `http://localhost:3001` (note: base path is `/employer/`, visible only in production GitHub Pages)

---

## Production Deployment

### Phase 1: Backend on Railway

#### Step 1: Connect to Railway
1. Go to `https://railway.app`
2. Sign in with GitHub account
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose `mobenjamins/maersk-remote-work-portal`
6. Configure Railway to deploy from `Backend/` directory

#### Step 2: Configure Environment Variables (Railway Dashboard)

Add these variables in Railway's **Variables** tab:

```
DJANGO_SECRET_KEY=<generate-strong-key>
DJANGO_SETTINGS_MODULE=config.settings.production
DEBUG=False
ALLOWED_HOSTS=<railway-domain>.railway.app
CORS_ALLOWED_ORIGINS=https://mobenjamins.github.io/maersk-remote-work-portal,https://mobenjamins.github.io/maersk-remote-work-portal/employer
GEMINI_API_KEY=<your-gemini-key>
```

#### Step 3: Add PostgreSQL Plugin
1. In Railway dashboard, click "Add Service"
2. Select "PostgreSQL"
3. Railway auto-populates `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`
4. Add these variables:
   - `DB_NAME` (auto-set to `railway`)
   - `DB_USER` (auto-set)
   - `DB_PASSWORD` (auto-set)
   - `DB_HOST` (auto-set to internal IP)
   - `DB_PORT=5432`

#### Step 4: Deploy
1. Railway auto-deploys when you push to `main` branch
2. Check deployment status in Railway dashboard
3. Once "Online", note the public domain URL
4. Test with: `curl https://<railway-domain>/api/docs/`

**Example Railway Domain**: `maersk-production-abc123.railway.app`

#### Step 5: Update Frontend Environment Files
After Railway backend is deployed, update both frontend `.env.production` files with the Railway URL:

```bash
# Frontend/.env.production
VITE_API_BASE_URL=https://<railway-domain>/api
GEMINI_API_KEY=<your-key>

# Admin_frontend/admin-app/.env.production
VITE_API_BASE_URL=https://<railway-domain>/api
GEMINI_API_KEY=<your-key>
```

Commit and push:
```bash
git add Frontend/.env.production Admin_frontend/admin-app/.env.production
git commit -m "Update production API URLs with Railway backend"
git push
```

### Phase 2: Frontends on GitHub Pages

GitHub Pages deployment is automatic via `.github/workflows/deploy-frontend.yml`:

1. **Enable GitHub Pages** in repository settings:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` → Directory: `/` (root)

2. **Add GitHub Secrets** for the GitHub Actions workflow:
   - Go to Settings → Secrets and variables → Actions
   - Add `VITE_API_BASE_URL`: `https://<railway-domain>/api`
   - Add `GEMINI_API_KEY`: Your Gemini API key

3. **Trigger Deployment**:
   - Push changes to `main` branch
   - GitHub Actions automatically builds both frontends
   - Deployment takes 1-2 minutes

4. **Verify Deployment**:
   - Employee Frontend: `https://mobenjamins.github.io/maersk-remote-work-portal/`
   - Admin Frontend: `https://mobenjamins.github.io/maersk-remote-work-portal/employer/`

---

## Troubleshooting

### Backend Won't Deploy on Railway

**Symptom**: Deployment fails, Railway shows build error

**Solutions**:
- Check Dockerfile syntax: `docker build -f Backend/Dockerfile -t test .`
- Verify `requirements.txt` is valid: `pip install -r Backend/requirements.txt`
- Check Railway logs: Dashboard → Logs tab
- Ensure Python 3.11 is available (specified in `runtime.txt`)

### API Calls Failing (CORS Errors)

**Symptom**: Frontend console shows "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solutions**:
- Verify `CORS_ALLOWED_ORIGINS` in Railway variables includes your frontend URLs
- Check exact format: `https://mobenjamins.github.io/maersk-remote-work-portal`
- Ensure backend is responding: `curl -I https://<railway-domain>/api/docs/`

### GitHub Pages Not Updating

**Symptom**: Changes pushed but old version still showing

**Solutions**:
- Wait 1-2 minutes (GitHub Pages rebuilds asynchronously)
- Check GitHub Actions tab: Settings → Actions
- Verify workflow completed without errors
- Clear browser cache: Hard refresh (Cmd+Shift+R on Mac)
- Check workflow secrets are set (VITE_API_BASE_URL, GEMINI_API_KEY)

### Admin Frontend Routing Broken

**Symptom**: Admin app shows but links are broken at `/employer/`

**Solutions**:
- Ensure `Admin_frontend/admin-app/vite.config.ts` has `base: '/employer/'`
- Verify build created `dist/employer/` with correct `index.html`
- Check GitHub Actions workflow copies files to correct path

---

## Environment Variables Reference

### Backend (.env)

| Variable | Dev | Production | Notes |
|----------|-----|------------|-------|
| DJANGO_SECRET_KEY | test-key | Strong random string | Generate: `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| DJANGO_SETTINGS_MODULE | config.settings.local | config.settings.production | Switches database, security settings |
| DEBUG | True | False | Disables debug pages in production |
| ALLOWED_HOSTS | localhost,127.0.0.1 | <railway-domain> | Prevents HTTP Host header attacks |
| CORS_ALLOWED_ORIGINS | http://localhost:3000,http://localhost:3001 | https://github-pages-url | Comma-separated; no trailing slashes |
| DB_NAME | maersk | railway | PostgreSQL database name |
| DB_USER | postgres | <auto> | PostgreSQL user |
| DB_PASSWORD | postgres | <auto> | PostgreSQL password |
| DB_HOST | localhost | <auto> | PostgreSQL host (Railway provides internal IP) |
| DB_PORT | 5432 | 5432 | PostgreSQL port |
| GEMINI_API_KEY | <key> | <key> | Google Gemini API key (free tier available) |

### Frontend (.env)

| Variable | Dev | Production | Notes |
|----------|-----|------------|-------|
| VITE_API_BASE_URL | http://localhost:8000/api | https://<railway-domain>/api | Backend API endpoint |
| GEMINI_API_KEY | <key> | <key> | Google Gemini API key |

---

## Monitoring & Maintenance

### Check Backend Health
```bash
curl https://<railway-domain>/api/docs/  # Should return Swagger UI
curl https://<railway-domain>/api/users/me/  # Should require auth (401)
```

### View Railway Logs
1. Go to Railway dashboard
2. Select the Maersk project
3. Click "Logs" tab
4. Filter by error level if needed

### Database Backups
Railway provides automatic backups. For critical data:
1. Go to PostgreSQL service in Railway
2. Check backup schedule (typically daily)
3. For manual backups: `pg_dump` from local CLI with connection string

### Scaling
- **Increase replicas**: Railway dashboard → service → edit replicas
- **Increase resources**: Change instance type (Railway charges per resource hour)
- **Monitor usage**: Railway dashboard shows CPU, memory, disk usage

---

## Security Checklist

- [ ] DJANGO_SECRET_KEY is strong and secret
- [ ] DEBUG=False in production
- [ ] ALLOWED_HOSTS includes only your domain
- [ ] CORS_ALLOWED_ORIGINS is restrictive (not `*`)
- [ ] GEMINI_API_KEY is stored in Railway variables, not in code
- [ ] PostgreSQL password is auto-generated and secure
- [ ] HTTPS enabled (Railway auto-provides SSL)
- [ ] Rate limiting configured (optional, can add django-ratelimit)
- [ ] CSRF protection enabled (Django default)

---

## Rollback Procedure

If a deployment breaks production:

1. **Identify broken commit**:
   ```bash
   git log --oneline
   ```

2. **Revert commit**:
   ```bash
   git revert <commit-hash>
   git push
   ```

3. **Railway auto-redeploys** (takes 2-5 minutes)

4. **Verify rollback**:
   ```bash
   curl https://<railway-domain>/api/docs/
   ```

---

## Support & Resources

- **Railway Docs**: https://docs.railway.app
- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **Django Deployment**: https://docs.djangoproject.com/en/stable/howto/deployment/
- **Google Gemini API**: https://ai.google.dev/

---

## Next Steps (Post-Deployment)

1. **Enable Authentication**: Replace mock OTP with real SMS/email service (Twilio, AWS SNS)
2. **Set up Monitoring**: Add error tracking (Sentry, LogRocket)
3. **Configure CDN**: Add Cloudflare for faster global access
4. **User Testing**: Share URLs with team for feedback
5. **Analytics**: Add Google Analytics or Mixpanel

---

**Last Updated**: 7 February 2026
