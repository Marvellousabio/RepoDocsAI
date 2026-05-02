<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/61fba44b-e19e-43b3-92c7-e5facb5fe2f0

## Run Locally

**Prerequisites:** Node.js, MongoDB

### MongoDB Setup

Choose one of the following options:

#### Option 1: Local MongoDB
1. Install MongoDB locally:
   - **Windows:** Download from [mongodb.com](https://www.mongodb.com/try/download/community)
   - **macOS:** `brew install mongodb/brew/mongodb-community`
   - **Linux:** Follow [official documentation](https://docs.mongodb.com/manual/installation/)

2. Start MongoDB service:
   ```bash
   # Windows (as Administrator)
   net start MongoDB

   # macOS/Linux
   brew services start mongodb/brew/mongodb-community
   ```

#### Option 2: MongoDB Atlas (Cloud)
1. Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string from Atlas dashboard

### Application Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Set `GEMINI_API_KEY` to your Gemini API key
   - Set `MONGODB_URI` to your MongoDB connection string:
     - Local: `mongodb://localhost:27017/repodocsai`
     - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/repodocsai?retryWrites=true&w=majority`

3. Run the app:
   ```bash
   npm run dev
   ```

### Database Management

- **Create backup:** `npm run backup-create`
- **List backups:** `npm run backup-list`
- **Restore backup:** `npm run backup-restore <backup-name>`

### Production Deployment

For production, consider:
- Using MongoDB Atlas for managed database
- Setting up replica sets for high availability
- Enabling authentication and SSL
- Regular backups and monitoring
