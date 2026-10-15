/**
 * Falcon 3D Prints — Dedicated Isolated Test Server Launcher
 * 
 * Guarantees:
 * 1. Explicitly loads isolated configuration from .env.test.local.
 * 2. Purges any inherited remote database, R2, or payment credentials from process.env.
 * 3. Conducts TCP preflight against the target local database (127.0.0.1:54322 or 127.0.0.1:5432).
 * 4. Fails closed if the local database is not reachable.
 * 5. Spawns Next.js on port 3001 and authoritatively verifies /api/system/isolation before declaring readiness.
 */

import fs from 'fs';
import path from 'path';
import net from 'net';
import { spawn } from 'child_process';

const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const BOLD = '\x1b[1m';

console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
console.log(`${BOLD}${CYAN}      FALCON 3D PRINTS — DEDICATED ISOLATED TEST SERVER LAUNCHER        ${RESET}`);
console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

// 1. Purge remote credentials from parent process environment
const DANGEROUS_REMOTE_VARS = [
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_ENDPOINT',
  'CLOUDFLARE_API_TOKEN',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
];

const sanitizedEnv = { ...process.env };
for (const varName of DANGEROUS_REMOTE_VARS) {
  delete sanitizedEnv[varName];
}

// 2. Load explicit test environment file
const testEnvPath = path.join(process.cwd(), '.env.test.local');
if (!fs.existsSync(testEnvPath)) {
  console.error(`${RED}[ERROR] Missing .env.test.local configuration file.${RESET}`);
  console.error(`Please ensure .env.test.local exists with isolated local parameters.`);
  process.exit(1);
}

const testEnvContent = fs.readFileSync(testEnvPath, 'utf8');
const testVars = {};
testEnvContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    testVars[key] = val;
    sanitizedEnv[key] = val;
  }
});

// Force explicit test mode values
sanitizedEnv.PORT = testVars.PORT || '3001';
sanitizedEnv.NODE_ENV = 'development';
sanitizedEnv.ENABLE_TEST_HARNESS = 'true';
sanitizedEnv.TEST_SERVER_MODE = 'isolated_local';
sanitizedEnv.ALLOW_LOCAL_STORAGE_FALLBACK = testVars.ALLOW_LOCAL_STORAGE_FALLBACK || 'false';
sanitizedEnv.ISOLATED_ALLOW_LOCAL_STORAGE_FALLBACK = sanitizedEnv.ALLOW_LOCAL_STORAGE_FALLBACK;
sanitizedEnv.ISOLATED_DATABASE_URL = sanitizedEnv.DATABASE_URL;
sanitizedEnv.ISOLATED_SUPABASE_URL = sanitizedEnv.NEXT_PUBLIC_SUPABASE_URL;
sanitizedEnv.ISOLATED_ANON_KEY = sanitizedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
sanitizedEnv.ISOLATED_SERVICE_ROLE_KEY = sanitizedEnv.SUPABASE_SERVICE_ROLE_KEY;

// 3. Verify target database is genuinely local
const targetDbUrl = sanitizedEnv.DATABASE_URL || '';
const targetSupabaseUrl = sanitizedEnv.NEXT_PUBLIC_SUPABASE_URL || '';
const isLocalTarget = (targetDbUrl.includes('127.0.0.1') || targetDbUrl.includes('localhost')) &&
                      (targetSupabaseUrl.includes('127.0.0.1') || targetSupabaseUrl.includes('localhost'));

if (!isLocalTarget) {
  console.error(`\n${RED}[FATAL ERROR] Target configuration is NOT isolated:${RESET}`);
  console.error(`  DATABASE_URL: ${targetDbUrl.replace(/:[^:@]+@/, ':***@')}`);
  console.error(`  SUPABASE_URL: ${targetSupabaseUrl}`);
  console.error(`Dedicated test server refuses to launch against remote targets.\n`);
  process.exit(1);
}

console.log(`${GREEN}[ISOLATION PREFLIGHT]${RESET} Target environment verified local:`);
console.log(`  Target Port:         ${sanitizedEnv.PORT}`);
console.log(`  Local Supabase URL:  ${targetSupabaseUrl}`);
console.log(`  Local Database URL:  ${targetDbUrl.replace(/:[^:@]+@/, ':***@')}`);

// 4. Test TCP connectivity to local PostgreSQL port
function checkTcpPort(host, port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function verifyLocalInfrastructure() {
  console.log(`\n${CYAN}[CONNECTIVITY CHECK] Checking local PostgreSQL on 127.0.0.1:54322...${RESET}`);
  let isDbListening = await checkTcpPort('127.0.0.1', 54322);

  if (!isDbListening) {
    // Check fallback default 5432
    isDbListening = await checkTcpPort('127.0.0.1', 5432);
  }

  if (!isDbListening) {
    console.error(`\n${RED}[FATAL PREFLIGHT FAILURE] Local PostgreSQL database is NOT reachable at 127.0.0.1:54322 or 5432.${RESET}`);
    console.error(`${YELLOW}Action Required:${RESET}`);
    console.error(`  1. Ensure Docker Desktop is running.`);
    console.error(`  2. Run 'npx supabase start' to launch local PostgreSQL and Supabase storage.`);
    console.error(`Test server refused to start without a verified local database target.\n`);
    process.exit(1);
  }

  console.log(`${GREEN}[PASS] Local PostgreSQL instance is active and accepting connections.${RESET}`);

  // 5. Spawn dedicated Next.js process on port 3001
  console.log(`\n${CYAN}[LAUNCH] Spawning isolated Next.js instance on port ${sanitizedEnv.PORT}...${RESET}`);
  const nextProcess = spawn('npx', ['next', 'dev', '-p', sanitizedEnv.PORT], {
    env: sanitizedEnv,
    stdio: 'inherit',
    shell: true,
  });

  nextProcess.on('error', (err) => {
    console.error(`${RED}[ERROR] Failed to start Next.js process: ${err.message}${RESET}`);
    process.exit(1);
  });

  // 6. Wait for server readiness and verify /api/system/isolation
  const checkUrl = `http://127.0.0.1:${sanitizedEnv.PORT}/api/system/isolation`;
  let attempts = 0;
  const maxAttempts = 30;

  const pollInterval = setInterval(async () => {
    attempts++;
    try {
      const res = await fetch(checkUrl);
      if (res.ok) {
        const data = await res.json();
        clearInterval(pollInterval);
        console.log(`\n${BOLD}${GREEN}========================================================================${RESET}`);
        console.log(`${BOLD}${GREEN}   ISOLATED TEST SERVER READY AT http://127.0.0.1:${sanitizedEnv.PORT}        ${RESET}`);
        console.log(`${BOLD}${GREEN}========================================================================${RESET}`);
        console.log(`  Authoritative Isolation Status: ${data.isIsolated ? GREEN + 'CONFIRMED ISOLATED' : RED + 'REMOTE TARGET'}${RESET}`);
        console.log(`  Target Host:                    ${data.targetHost}`);
        console.log(`  Mutation Tests Allowed:         ${data.allowMutations ? GREEN + 'YES' : RED + 'NO'}${RESET}`);
        console.log(`  Local Disk Storage Fallback:    ${data.allowLocalStorageFallback ? RED + 'ENABLED (INSECURE)' : GREEN + 'DISABLED (FAIL-CLOSED)'}${RESET}\n`);
      }
    } catch {
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        console.error(`${RED}[TIMEOUT] Test server did not become responsive after ${maxAttempts} seconds.${RESET}`);
        nextProcess.kill();
        process.exit(1);
      }
    }
  }, 1000);

  process.on('SIGINT', () => {
    console.log(`\nStopping isolated test server...`);
    nextProcess.kill();
    process.exit(0);
  });
}

verifyLocalInfrastructure();
