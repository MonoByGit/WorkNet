This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Geist, a modern font family.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Railway

WorkNet is configured for easy deployment on Railway with PostgreSQL database.

### Deployment Steps

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Railway deployment"
   git push origin main
   ```

2. **Create new project in Railway**
   - Go to [Railway](https://railway.app)
   - Click "New Project" and select "Deploy from GitHub repo"

3. **Add PostgreSQL database**
   - In your Railway project, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically provide `DATABASE_URL` environment variable

4. **Configure environment variables** in Railway dashboard:
   ```
   NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
   NEXTAUTH_URL=https://your-app-name.railway.app
   ```
   Note: `DATABASE_URL` is automatically provided by Railway

5. **Deploy from main branch**
   - Railway will automatically build and deploy your app
   - Monitor the build logs for any errors

6. **Initialize database** (one-time setup):
   - Open Railway project shell
   - Run migrations: `npx prisma migrate deploy`
   - Seed database: `npm run seed`

7. **Access your app**
   - Default admin credentials:
     - Email: `admin@worknet.com`
     - Password: `WorkNet2026!Secure`
   - **IMPORTANT**: Change the admin password after first login!

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string (auto-provided by Railway) | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js session encryption | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Public URL of your application | `https://worknet.railway.app` |

For more details on Next.js deployment, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
