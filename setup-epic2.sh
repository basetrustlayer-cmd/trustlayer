#!/usr/bin/env bash
set -euo pipefail

mkdir -p apps/web/app
mkdir -p apps/dashboard/app
mkdir -p services/api-gateway/src
mkdir -p packages/shared-types/src

cat > apps/web/package.json <<'EOF'
{
  "name": "@trustlayer/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3000",
    "lint": "next lint || true",
    "typecheck": "tsc --noEmit",
    "test": "echo test web"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
EOF

cat > apps/web/app/page.tsx <<'EOF'
export default function HomePage() {
  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>TrustLayer</h1>
      <p>Compliance trust infrastructure for verified businesses.</p>
    </main>
  );
}
EOF

cat > apps/web/app/layout.tsx <<'EOF'
export const metadata = {
  title: "TrustLayer",
  description: "Compliance trust infrastructure"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

cat > apps/web/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "moduleResolution": "bundler"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

cat > apps/web/next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
EOF

cat > apps/dashboard/package.json <<'EOF'
{
  "name": "@trustlayer/dashboard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint || true",
    "typecheck": "tsc --noEmit",
    "test": "echo test dashboard"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0"
  }
}
EOF

cat > apps/dashboard/app/page.tsx <<'EOF'
export default function DashboardPage() {
  return (
    <main style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>TrustLayer Dashboard</h1>
      <p>Vendor verification, compliance status, and trust workflows.</p>
    </main>
  );
}
EOF

cat > apps/dashboard/app/layout.tsx <<'EOF'
export const metadata = {
  title: "TrustLayer Dashboard",
  description: "TrustLayer SaaS dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

cat > apps/dashboard/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "moduleResolution": "bundler"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

cat > apps/dashboard/next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />
EOF

cat > services/api-gateway/package.json <<'EOF'
{
  "name": "@trustlayer/api-gateway",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsc -w",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "echo lint api gateway",
    "typecheck": "tsc --noEmit",
    "test": "echo test api gateway"
  },
  "dependencies": {
    "@fastify/cors": "^10.0.0",
    "fastify": "^5.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {}
}
EOF

cat > services/api-gateway/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "noEmit": false,
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
EOF

cat > services/api-gateway/src/index.ts <<'EOF'
import Fastify from "fastify";
import cors from "@fastify/cors";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true
});

app.get("/health", async () => {
  return {
    status: "ok",
    service: "trustlayer-api-gateway"
  };
});

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
EOF

cat > packages/shared-types/package.json <<'EOF'
{
  "name": "@trustlayer/shared-types",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "lint": "echo lint shared types",
    "typecheck": "tsc --noEmit",
    "test": "echo test shared types",
    "build": "echo building shared types"
  }
}
EOF

cat > packages/shared-types/src/index.ts <<'EOF'
export type TrustLayerHealthStatus = {
  status: "ok";
  service: string;
};

export type Organization = {
  id: string;
  name: string;
  createdAt: string;
};
EOF

echo "Epic 2 scaffold complete."
