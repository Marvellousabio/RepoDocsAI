# Deploying to Render

Based on your setup, here's how to deploy to Render:

## 1. **Prepare for Deployment**

### Environment Variables
Your `.env` file should have production values:
```env
GEMINI_API_KEY=your_actual_gemini_key
APP_URL=https://your-render-app.onrender.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/repodocsai
```

### Build Configuration
Create `render.yaml` or configure in Render dashboard:
```yaml
services:
  - type: web
    name: repodocs-ai
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run dev
    envVars:
      - key: NODE_ENV
        value: production
      - key: GEMINI_API_KEY
        sync: false  # Set in Render dashboard
      - key: MONGODB_URI
        sync: false  # Set in Render dashboard
```

## 2. **Server Configuration for Production**

The server needs to handle production differently. Let me update it:

### Update server.ts for production:
```typescript
// Add this near the top
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;
```

### Production build script:
```json
{
  "scripts": {
    "start": "NODE_ENV=production tsx server.ts"
  }
}
```

## 3. **Common Deployment Issues**

### API Routes Not Working
In production, ensure the server handles `/api/*` routes before Vite middleware.

### MongoDB Connection
Make sure your Atlas cluster allows connections from `0.0.0.0/0` or your Render IP.

### Port Configuration
Render assigns a random port - use `process.env.PORT`.

Would you like me to prepare the app for Render deployment?