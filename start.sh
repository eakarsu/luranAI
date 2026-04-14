#!/bin/bash

echo "Starting Luran AI..."
echo "========================"

# Kill any processes on commonly used ports
echo "Cleaning up ports..."
for port in 3000 3001; do
  pids=$(lsof -ti:$port 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill -9 2>/dev/null
    echo "Port $port cleared"
  fi
done

# Create .env if not exists
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/luranai?schema=public"
OPENROUTER_API_KEY="your-openrouter-api-key-here"
JWT_SECRET="luranai-jwt-secret-key-2024"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF
  echo ".env created — update it with your real keys"
else
  echo ".env already exists"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Ensure PostgreSQL is running
echo "Starting PostgreSQL..."
brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || echo "Please start PostgreSQL manually"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
  if pg_isready -q 2>/dev/null; then
    echo "PostgreSQL is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "ERROR: PostgreSQL failed to start after 30 seconds"
    exit 1
  fi
  sleep 1
done

# Push database schema
echo "Pushing database schema..."
npx prisma db push --accept-data-loss

# Seed the database
echo "Seeding database..."
npx prisma db seed 2>/dev/null || echo "Seed may have already run"

# Start dev server with hot reloading (Turbopack)
echo ""
echo "========================"
echo "Dev server starting on http://localhost:3000"
echo "Hot reloading enabled — code changes apply automatically"
echo "Press Ctrl+C to stop"
echo "========================"
exec npm run dev
