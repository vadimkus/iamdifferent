# Prisma Database Setup

## ✅ Setup Complete

The booking system is now using Prisma with PostgreSQL database.

## Database Configuration

- **Database**: PostgreSQL (Prisma Cloud)
- **Connection**: Prisma Accelerate (optimized connection pooling)
- **Schema**: Bookings table created and synced

## Environment Variables

The following environment variables are configured in `.env` and `.env.local`:

```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
POSTGRES_URL="postgres://74eb9f063bfd18d77bc6aa21cbfa79ae79646f00e6d92074fcd448cf297b6007:sk_9APdJloG5OLv8vm6_2W9G@db.prisma.io:5432/postgres?sslmode=require"
```

## Database Schema

The `Booking` model includes:
- `id` (String, CUID)
- `name` (String)
- `email` (String)
- `phone` (String)
- `date` (String, format: YYYY-MM-DD)
- `timeSlot` (String, format: HH:mm-HH:mm)
- `notes` (String, optional)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

Index on `[date, timeSlot]` for fast availability queries.

## API Routes Updated

- ✅ `GET /api/bookings` - Now uses Prisma to fetch all bookings
- ✅ `POST /api/bookings` - Now uses Prisma to create bookings with conflict checking

## Prisma Client

The Prisma client is configured in `src/lib/prisma.ts` with:
- Singleton pattern for Next.js
- Development logging enabled
- Production optimizations

## Migration Status

Database schema has been pushed to the database using `prisma db push`.

## Usage

The booking system now:
1. Stores all bookings in PostgreSQL database
2. Checks availability using database queries
3. Prevents double bookings at database level
4. Maintains data persistence across deployments

## Next Steps

To view/manage bookings in the database:
```bash
npx prisma studio
```

This opens a visual database browser at http://localhost:5555

## Troubleshooting

If you encounter connection issues:
1. Verify environment variables are set correctly
2. Check database connection: `npx prisma db pull`
3. Regenerate Prisma client: `npx prisma generate`

