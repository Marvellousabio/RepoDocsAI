# Quick MongoDB Setup Guide

## Option 1: MongoDB Atlas (Recommended)

1. **Go to [mongodb.com/atlas](https://mongodb.com/atlas)**
2. **Create free account → Build a Database**
3. **Choose:**
   - M0 Cluster (Free)
   - AWS/Google Cloud/Azure (any)
   - Region: Closest to you
4. **Create Database User:**
   - Username: `repodocsai`
   - Password: Choose a strong password
5. **Network Access:**
   - Add IP Address: `0.0.0.0/0` (allow from anywhere - restrict later)
6. **Connect:**
   - Choose "Connect your application"
   - Copy the connection string
7. **Update .env:**
   ```env
   MONGODB_URI=mongodb+srv://repodocsai:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/repodocsai?retryWrites=true&w=majority
   ```

## Option 2: Local MongoDB (Alternative)

1. **Download MongoDB Community Server:**
   - Go to [mongodb.com/try/download/community](https://mongodb.com/try/download/community)
   - Choose Windows version
   - Download MSI installer

2. **Install MongoDB:**
   - Run the installer
   - Choose "Complete" installation
   - Install MongoDB Compass if prompted

3. **Start MongoDB Service:**
   ```cmd
   net start MongoDB
   ```

4. **Verify Installation:**
   ```bash
   npx tsx test-connection.ts
   ```

## Testing Connection

Once you have MongoDB running, test with:

```bash
npx tsx test-connection.ts
```

You should see:
```
✅ MongoDB connected successfully
✅ Connection state: connected
✅ Database connected. Found X collections.
✅ Connection test completed successfully!
```

Then start your app:
```bash
npm run dev
```