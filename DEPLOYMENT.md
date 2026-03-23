# Deployment Guide

This guide covers how to deploy Polititrack to production.

## Local Development

### Prerequisites
- Node.js 18+ and npm
- Git

### Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` to view the app.

### Build
```bash
# Create production build
npm run build

# Start production server
npm start
```

## Environment Variables

### Required
- `NEXT_PUBLIC_SITE_URL` - The full URL of your deployed site (e.g., `https://polititrack.example.com`)
  - Used for generating absolute URLs in OpenGraph metadata
  - If not set, defaults to `http://localhost:3000` for development

### API Keys (for real data integration)
- `CONGRESS_API_KEY` - Congress.gov API v3 key
  - **Get your free key:** https://api.congress.gov/sign-up
  - Used for fetching bill data, member information, and voting records
  - Server-only (never exposed to client)
  
- `FEC_API_KEY` - OpenFEC (Federal Election Commission) API key
  - **Get your free key:** https://api.open.fec.gov/developers/
  - Used for fetching campaign finance data
  - Server-only (never exposed to client)

### Optional
- `NEXT_PUBLIC_BUILD_TIME` - Build timestamp (can be set during build process)

### Setting Environment Variables

**Local Development:**
1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your API keys:
   ```
   CONGRESS_API_KEY=your_congress_api_key_here
   FEC_API_KEY=your_fec_api_key_here
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Where to paste keys:**
   - Open `.env.local` in your project root (same directory as `package.json`)
   - Paste your Congress.gov API key after `CONGRESS_API_KEY=`
   - Paste your OpenFEC API key after `FEC_API_KEY=`
   - Save the file
   - Restart your dev server (`npm run dev`)

**Important:** Never commit `.env.local` to git. It's already in `.gitignore`.

**Production (Vercel):**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add `NEXT_PUBLIC_SITE_URL` with your production URL

## Recommended Hosting: Vercel

Vercel is the recommended hosting platform for Next.js applications.

### Deploy to Vercel

1. **Connect Repository:**
   - Push your code to GitHub/GitLab/Bitbucket
   - Import your repository in Vercel dashboard

2. **Configure Project:**
   - Framework Preset: Next.js (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)

3. **Set Environment Variables:**
   - Add `NEXT_PUBLIC_SITE_URL` with your production domain

4. **Deploy:**
   - Vercel will automatically deploy on every push to main branch
   - Preview deployments are created for pull requests

### Custom Domain
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## What to Verify After Deployment

### Core Functionality
- [ ] Home page loads correctly
- [ ] Politician pages display correctly (`/politician/1`)
- [ ] Bill pages display correctly (`/bill/1`)
- [ ] Compare page works (`/compare`)
- [ ] Methodology page loads (`/methodology`)
- [ ] Status page loads (`/status`)

### Search & Navigation
- [ ] Command palette opens (Cmd+K / Ctrl+K)
- [ ] Search finds politicians and bills
- [ ] Navigation links work correctly

### Receipts
- [ ] Receipt drawer opens when clicking "View receipts"
- [ ] Receipt drawer closes with Esc key
- [ ] Share modal works
- [ ] Copy link includes correct URL params
- [ ] Copy card text works

### Deep Links
- [ ] Topic Lens URL sync works (`?topic=Healthcare`)
- [ ] Receipt deep links work (`?receipt=summary`)
- [ ] Combined params work (`?topic=Healthcare&receipt=summary`)
- [ ] Clearing topic preserves receipt param

### OpenGraph & SEO
- [ ] OG image generates at `/og`
- [ ] Metadata appears in page source
- [ ] Social previews work (test with Twitter Card Validator or Facebook Sharing Debugger)

### Features
- [ ] Topic Lens filtering works
- [ ] Compare feature works (add 2 politicians)
- [ ] Follow/Saved feature persists (localStorage)
- [ ] Reading mode toggle works

## Known Limitations

### Mock Data
- **Current Status:** All data is mock/demo data by default
- **Impact:** Politicians, bills, votes, and statements are not real unless API keys are configured
- **Future:** Real data sources are now available via `lib/congress.ts` and `lib/fec.ts`
  - Configure API keys in `.env.local` to enable real data fetching
  - Server-side fetch utilities are ready for integration

### Data Sources
- Campaign finance data: Mock
- Voting records: Mock
- Public statements: Mock
- Bill information: Mock

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- No IE11 support

### Performance
- Optimized for modern devices
- Large datasets may require pagination in future versions

## Troubleshooting

### Build Errors
- Ensure Node.js version is 18+
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`

### Environment Variables Not Working
- Restart dev server after adding `.env.local`
- Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access
- Check Vercel environment variables are set correctly

### OG Image Not Generating
- Verify `/og` route is accessible
- Check Edge Runtime is supported by your hosting provider
- Test locally: `http://localhost:3000/og`

### Deep Links Not Working
- Verify URL params are preserved in navigation
- Check browser console for errors
- Ensure `useSearchParams` is wrapped in Suspense

## Support

For issues or questions:
1. Check this deployment guide
2. Review the Methodology page (`/methodology`)
3. Check Status page (`/status`) for version info

