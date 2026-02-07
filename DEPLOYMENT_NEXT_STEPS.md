# Deployment Next Steps - Quick Action Items

Your codebase is now ready for production deployment. All configuration files have been created and pushed to GitHub. Follow the steps below to complete the deployment.

**GitHub Repository**: https://github.com/mobenjamins/maersk-remote-work-portal

---

## Step 1: Deploy Backend to Railway (5-10 minutes)

### 1.1 Navigate to Railway
1. Go to https://railway.app
2. Sign in with your GitHub account (mobenjamins)
3. Click "New Project"

### 1.2 Connect GitHub Repository
1. Select "Deploy from GitHub repo"
2. Search for `maersk-remote-work-portal`
3. Click to deploy
4. Railway will ask to install the GitHub App — approve it

### 1.3 Configure Root Path
Railway needs to know the backend is in the `Backend/` directory:
1. After selecting the repo, Railway shows deployment options
2. Set **root directory** to `Backend/`
3. Continue with deployment

### 1.4 Add PostgreSQL Database
1. In Railway dashboard, click "+ Add Service"
2. Select "PostgreSQL"
3. Railway auto-creates the database and populates connection details

### 1.5 Configure Environment Variables
In the Railway dashboard, go to the service's **Variables** tab and add:

```
DJANGO_SECRET_KEY=<copy-paste-the-value-below>
DJANGO_SETTINGS_MODULE=config.settings.production
DEBUG=False
ALLOWED_HOSTS=<railway-url>
CORS_ALLOWED_ORIGINS=https://mobenjamins.github.io/maersk-remote-work-portal,https://mobenjamins.github.io/maersk-remote-work-portal/employer
GEMINI_API_KEY=AIzaSyDB86lDqFs_mdX_XFTd_TasAyBv3mhtweE
```

**Generate a strong DJANGO_SECRET_KEY**:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 1.6 Wait for Deployment
1. Railway deploys automatically (takes 2-5 minutes)
2. Status shows "Online" when ready
3. Go to **Settings → Networking** to get the public domain
4. Note the URL: `https://<railway-id>.railway.app`

### 1.7 Verify Backend is Running
```bash
curl https://<railway-url>/api/docs/
```
Should show Swagger API documentation.

---

## Step 2: Update Frontend Environment Files (2 minutes)

After Railway backend is deployed, update the production environment files with the actual Railway URL:

### 2.1 Employee Frontend
Edit `Frontend/.env.production`:
```
VITE_API_BASE_URL=https://<railway-url>/api
GEMINI_API_KEY=AIzaSyDB86lDqFs_mdX_XFTd_TasAyBv3mhtweE
```

### 2.2 Admin Frontend
Edit `Admin_frontend/admin-app/.env.production`:
```
VITE_API_BASE_URL=https://<railway-url>/api
GEMINI_API_KEY=AIzaSyDB86lDqFs_mdX_XFTd_TasAyBv3mhtweE
```

### 2.3 Commit and Push
```bash
git add Frontend/.env.production Admin_frontend/admin-app/.env.production
git commit -m "Update production API URLs with Railway backend"
git push
```

---

## Step 3: Enable GitHub Pages (3-5 minutes)

### 3.1 Configure Repository Settings
1. Go to https://github.com/mobenjamins/maersk-remote-work-portal/settings/pages
2. Under "Build and deployment":
   - **Source**: "Deploy from a branch"
   - **Branch**: `main`
   - **Directory**: `/` (root)
3. Click "Save"

### 3.2 Add GitHub Secrets for Deployment
The GitHub Actions workflow needs secrets to access your Railway backend:

1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add:
   - **Name**: `VITE_API_BASE_URL` → **Value**: `https://<railway-url>/api`
   - **Name**: `GEMINI_API_KEY` → **Value**: `AIzaSyDB86lDqFs_mdX_XFTd_TasAyBv3mhtweE`
4. Save

### 3.3 Trigger First Deployment
The GitHub Actions workflow automatically triggers when you push to `main`. Since you just pushed, it may already be running:

1. Go to https://github.com/mobenjamins/maersk-remote-work-portal/actions
2. Look for the workflow "Deploy Frontends to GitHub Pages"
3. Wait for it to complete (shows ✅ when done)
4. It will build both frontends and deploy to GitHub Pages

### 3.4 Verify Frontend Deployment
Wait 2-3 minutes, then visit:

- **Employee Frontend**: https://mobenjamins.github.io/maersk-remote-work-portal/
- **Admin Frontend**: https://mobenjamins.github.io/maersk-remote-work-portal/employer/

Both should load without errors and connect to the Railway backend.

---

## Step 4: Test Live URLs (5 minutes)

### 4.1 Test Employee Frontend
1. Visit https://mobenjamins.github.io/maersk-remote-work-portal/
2. Click "Login"
3. Enter any email ending with `@maersk.com` (e.g., `test@maersk.com`)
4. You should receive an OTP code (check browser console or use any 6 digits in MVP mode)
5. Enter the OTP to log in
6. You should see the dashboard and be able to submit a remote work request

### 4.2 Test Admin Frontend
1. Visit https://mobenjamins.github.io/maersk-remote-work-portal/employer/
2. Login with `admin@maersk.com` (requires `is_admin=True` in database)
3. You should see the admin dashboard with request management

### 4.3 Test Backend API Directly
```bash
# Check API docs
curl https://<railway-url>/api/docs/

# Try login (MVP accepts any @maersk.com email)
curl -X POST https://<railway-url>/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "test@maersk.com"}'
```

---

## Troubleshooting

### Railway Deployment Failed
**Problem**: Deployment shows error, app is "Crashed" or "Offline"

**Solutions**:
1. Check Railway logs: Dashboard → Service → Logs tab
2. Verify `Backend/Dockerfile` exists and is valid
3. Ensure `DJANGO_SETTINGS_MODULE=config.settings.production` is set
4. Ensure PostgreSQL is running (added via "Add Service")
5. Check that all required environment variables are set

### GitHub Pages Shows Old Version
**Problem**: Changes pushed but old site still showing

**Solutions**:
1. Wait 2-3 minutes (GitHub Pages rebuilds asynchronously)
2. Check workflow status: Actions tab → "Deploy Frontends to GitHub Pages"
3. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
4. Verify secrets are set: Settings → Secrets and variables → Actions

### CORS Errors in Browser Console
**Problem**: Frontend can't communicate with backend

**Solutions**:
1. Verify Railway URL in browser console network tab
2. Check `CORS_ALLOWED_ORIGINS` in Railway includes:
   - `https://mobenjamins.github.io/maersk-remote-work-portal`
   - `https://mobenjamins.github.io/maersk-remote-work-portal/employer`
3. Ensure Railway URL is in production `.env.production` files
4. Commit and push changes if you updated URLs

### Admin Frontend Routes Broken
**Problem**: Admin app loads but clicking buttons shows 404

**Solutions**:
1. Verify `Admin_frontend/admin-app/vite.config.ts` has `base: '/employer/'`
2. Check GitHub Actions workflow built to `dist/employer/` path
3. Verify `dist/employer/index.html` exists (should auto-redirect)
4. Check browser console for 404 errors (look at network tab)

---

## Summary: Your Deployment URLs

Once all steps are complete, share these URLs with colleagues:

| Component | URL |
|-----------|-----|
| **Employee App** | https://mobenjamins.github.io/maersk-remote-work-portal/ |
| **Admin Dashboard** | https://mobenjamins.github.io/maersk-remote-work-portal/employer/ |
| **API Docs** | https://`<railway-url>`/api/docs/ |
| **GitHub Repo** | https://github.com/mobenjamins/maersk-remote-work-portal |

**Test Credentials** (MVP mode accepts any `@maersk.com` email):
- Employee: `test@maersk.com` + any 6-digit OTP
- Admin: `admin@maersk.com` + any 6-digit OTP (requires `is_admin=True`)

---

## Important: Manual Steps Required

These steps **cannot be automated** and require your manual action in the browser:

1. ✅ **Railway**: Create project and add PostgreSQL
   - Takes 5-10 minutes
   - Save the Railway URL for later

2. ✅ **GitHub Pages**: Enable in repository settings
   - Takes 2 minutes
   - Automatic after that

3. ✅ **GitHub Secrets**: Add `VITE_API_BASE_URL` and `GEMINI_API_KEY`
   - Takes 2 minutes
   - Critical for frontends to work

4. ✅ **Frontend URLs**: Update `.env.production` with Railway URL
   - Takes 2 minutes
   - Must be done before frontends will connect

---

## Estimated Total Time

- Railway backend setup: **10-15 minutes**
- Update frontend URLs: **2-5 minutes**
- GitHub Pages setup: **5-10 minutes**
- **Total: 20-30 minutes**

Once these steps are complete, the entire application will be live and accessible online!

---

## Next Steps (After Deployment Works)

1. **Real OTP Service**: Replace mock OTP with Twilio or AWS SNS
2. **Admin User Management**: Create proper user roles and permissions
3. **Error Monitoring**: Add Sentry for production error tracking
4. **Analytics**: Track user behaviour with Google Analytics
5. **Custom Domain**: Map a custom domain to GitHub Pages (optional)

---

**Need help?** Check `DEPLOYMENT.md` in the repo for detailed troubleshooting and architecture information.
