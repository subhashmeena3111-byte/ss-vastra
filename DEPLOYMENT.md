# SS VASTRA - 100% Free Deployment & Hosting Guide

Yeh project **Render**, **Railway**, **Vercel** ya kisi bhi free Node.js hosting platform par bina 1 rupaye kharch kiye live kiya ja sakta hai.

---

## Step 1: GitHub Par Repository Banayein Aur Code Push Karein

1. [GitHub.com](https://github.com) par login karein.
2. Top right corner me **`+`** icon par click karke **"New repository"** chunein.
3. Repository name dein: `ss-vastra` (ya koi bhi naam).
4. Isse **Public** ya **Private** chunein aur **"Create repository"** par click karein.
5. Apne terminal / computer me ye commands chalayein:

```bash
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ss-vastra.git
git branch -M main
git push -u origin main
```

---

## Step 2: Render.com Par 100% Free Host Karein (Recommended)

Render par backend (Express API) + frontend (Vite React) dono ek sath free me live ho jate hain:

1. [Render.com](https://render.com) par free account banayein (GitHub se Direct Login karein).
2. Dashboard me **"New +"** button par click karke **"Web Service"** chunein.
3. **"Build and deploy from a Git repository"** select karein aur apna `ss-vastra` repository choose karein.
4. Settings fill karein:
   - **Name**: `ss-vastra` (ya aapki marzi ka naam)
   - **Region**: Singapore / Frankfurt / Oregon (koi bhi)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` ($0/month)
5. **"Deploy Web Service"** par click karein.
6. 2-3 minute me aapki website live ho jayegi aur aapko free live link mil jayega (jaise `https://ss-vastra.onrender.com`).

---

## Step 3: Mobile App (PWA) - Play Store ke ₹2,000 bachayein

Yeh website ek **Progressive Web App (PWA)** hai.
- Jab koi customer aapki website mobile browser (Chrome/Safari) me kholega, to use **"Install App"** ya **"Add to Home Screen"** ka option aayega.
- Customer ke mobile par yeh bilkul Play Store app ki tarah download aur install ho jayegi icon ke sath.
- Iske liye **Play Console ki $25 (₹2,100) fee dene ki zaroorat nahi hai**.

---

## Summary of Environment Variables (Optional):
- `PORT`: 3000 (Render automatically sets this)
- `NODE_ENV`: `production`
- `ADMIN_JWT_SECRET`: (Koi bhi secret string, e.g. `ssvastra_jwt_secret_key_2026`)
