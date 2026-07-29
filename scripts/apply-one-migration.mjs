#!/usr/bin/env node
/**
 * Apply a single supabase/migrations/*.sql to the linked remote project.
 * Avoids full `db push` when remote/local migration history diverged.
 *
 * Usage:
 *   npm run db:apply -- supabase/migrations/YYYYMMDDHHMMSS_name.sql
 *   npm run db:apply -- YYYYMMDDHHMMSS
 *   npm run db:apply -- --check YYYYMMDDHHMMSS
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "supabase", "migrations");

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function findSupabaseBin() {
  const candidates = [
    "supabase",
    join(process.env.HOME ?? "", ".local/bin/supabase"),
    "/tmp/supabase-cli/supabase",
  ];
  for (const bin of candidates) {
    const r = spawnSync(bin, ["--version"], { encoding: "utf8" });
    if (r.status === 0) return bin;
  }
  return null;
}

function run(bin, args, { inherit = true } = {}) {
  const r = spawnSync(bin, args, {
    cwd: root,
    encoding: "utf8",
    stdio: inherit ? "inherit" : "pipe",
    env: process.env,
  });
  return r;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let checkOnly = false;
  const positional = [];
  for (const a of args) {
    if (a === "--check") checkOnly = true;
    else if (a.startsWith("-")) die(`Unknown flag: ${a}`);
    else positional.push(a);
  }
  if (positional.length !== 1) {
    die(
      "Usage: npm run db:apply -- <migration.sql|version>\n" +
        "       npm run db:apply -- --check <migration.sql|version>",
    );
  }
  return { target: positional[0], checkOnly };
}

function resolveMigrationFile(target) {
  const asPath = resolve(root, target);
  if (existsSync(asPath) && asPath.endsWith(".sql")) {
    return asPath;
  }
  const versionMatch = basename(target).match(/^(\d{14})/);
  const version = versionMatch?.[1];
  if (!version) {
    die(`Cannot resolve migration from: ${target}`);
  }
  const hits = readdirSync(migrationsDir).filter((f) => f.startsWith(version) && f.endsWith(".sql"));
  if (hits.length === 0) die(`No local migration file for version ${version}`);
  if (hits.length > 1) die(`Ambiguous version ${version}: ${hits.join(", ")}`);
  return join(migrationsDir, hits[0]);
}

function versionFromFile(filePath) {
  const m = basename(filePath).match(/^(\d{14})/);
  if (!m) die(`Filename must start with 14-digit version: ${basename(filePath)}`);
  return m[1];
}

function listMigrations(bin) {
  const r = run(bin, ["migration", "list", "--linked", "--output-format", "json"], {
    inherit: false,
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    die("Failed to list migrations. Need supabase login / SUPABASE_ACCESS_TOKEN and linked project.");
  }
  const text = (r.stdout || "").trim();
  // CLI may print progress lines before JSON
  const jsonStart = text.indexOf("{");
  if (jsonStart < 0) die(`Unexpected migration list output:\n${text.slice(-800)}`);
  let data;
  try {
    data = JSON.parse(text.slice(jsonStart));
  } catch (e) {
    die(`Failed to parse migration list JSON: ${e}\n${text.slice(-800)}`);
  }
  return data.migrations ?? [];
}

function remoteStatus(rows, version) {
  const row = rows.find((x) => x.local === version || x.remote === version);
  if (!row) return { local: false, remote: false };
  return {
    local: Boolean(row.local),
    remote: Boolean(row.remote),
  };
}

const { target, checkOnly } = parseArgs(process.argv);
const filePath = resolveMigrationFile(target);
const version = versionFromFile(filePath);
const rel = filePath.startsWith(root) ? filePath.slice(root.length + 1) : filePath;

const bin = findSupabaseBin();
if (!bin) die("supabase CLI not found. Install or put it on PATH (~/.local/bin/supabase).");

console.log(`Migration: ${rel}`);
console.log(`Version:   ${version}`);
console.log(`CLI:       ${bin}`);

const rows = listMigrations(bin);
const st = remoteStatus(rows, version);

if (st.remote) {
  console.log(`Already applied on remote (version ${version}). Nothing to do.`);
  process.exit(0);
}

if (!st.local) {
  console.warn(
    `Warning: version ${version} not listed as local in migration list (file exists). Continuing.`,
  );
}

if (checkOnly) {
  console.log(`Pending on remote. Would apply: ${rel}`);
  process.exit(0);
}

console.log("Applying SQL via db query --linked …");
const q = run(bin, ["db", "query", "--linked", "-f", filePath]);
if (q.status !== 0) die("db query failed; SQL not marked applied.");

console.log(`Marking applied: migration repair --status applied ${version} --linked`);
const repair = run(bin, ["migration", "repair", "--status", "applied", version, "--linked"]);
if (repair.status !== 0) {
  die(
    "SQL may have run but repair failed. Re-check with: supabase migration list --linked\n" +
      `Then manually: supabase migration repair --status applied ${version} --linked`,
  );
}

const after = remoteStatus(listMigrations(bin), version);
if (!after.remote) {
  die("Repair finished but version still not remote. Inspect migration list.");
}

console.log(`OK: ${version} applied on linked remote.`);
