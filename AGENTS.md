<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Database Environment Rules

- **Development/Local Database**: The local `.env` points to a cloud Supabase PostgreSQL database. Running local DB commands (`prisma db push` etc.) updates the Supabase dev instance.
- **Production/Live Database**: The production site runs on a Hetzner server (`23.88.37.81`) and uses a local PostgreSQL instance running inside a Docker container (`127.0.0.1:5432`).
- **Schema Migrations**: When schema changes are made to `prisma/schema.prisma`, you **MUST** run `npx prisma db push` BOTH locally (for Supabase dev) and remotely on the Hetzner server (for production) using the SSH helper `scratch/ssh_exec.js`.

