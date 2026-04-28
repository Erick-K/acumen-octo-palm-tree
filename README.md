<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1nc8EIpgnHmS_Q4l-QR7NE9S33AO2-_9z

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Install server dependencies (for Excel import/export):
   `cd server && npm install`
3. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
4. Run the app:
   - **Frontend + Backend (Excel API):** `npm run dev:all` — runs both Vite and the Excel API server
   - **Frontend only:** `npm run dev`
   - **Backend only:** `npm run server` (Excel API on port 3001)

### Excel Import/Export

- **Products:** Import CSV/Excel, Export CSV or Excel (backend)
- **Clients:** Import CSV/Excel, Export Excel (backend)
- **Orders:** Export CSV or Excel (backend)

Excel files require the backend server running. Vite proxies `/api` to `http://localhost:3001`.
