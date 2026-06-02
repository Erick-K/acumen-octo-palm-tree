# Public Website (Separate from Internal App)

This folder contains a standalone website for internet users to:

- Browse products
- See prices
- Contact your business
- Open the staff portal (internal app login)

## Files

- `index.html` - website page
- `styles.css` - website styling
- `app.js` - product loading and search
- `website.config.js` - your public portal URL + Supabase settings

## How it works

The website fetches product data from the same Supabase `app_state` used by the app and displays `data.products`.

## Deploy as separate site

1. Create a new Netlify site (or any static host).
2. Set publish directory to `website`.
3. Deploy.

Your internal app remains separate and unchanged.

