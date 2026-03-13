/**
 * Supabase Auth 샘플 사용자 시드
 * 실행: node scripts/seed-users.js
 * 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (또는 .env.local)
 */
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    content.split("\n").forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
    });
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 필요합니다.");
  console.error(".env.local에 설정하거나 환경변수로 전달하세요.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const USERS = [
  { email: "admin@futures.mntfree.local", password: "7788", username: "admin", role: "admin" },
  { email: "jin2ous@futures.mntfree.local", password: "7788", username: "jin2ous", role: "user" },
];

async function seed() {
  for (const u of USERS) {
    try {
      const { data: existing } = await supabase.auth.admin.listUsers();
      const found = existing?.users?.find((x) => x.email === u.email);
      if (found) {
        console.log(`이미 존재: ${u.email} (${u.username})`);
        continue;
      }
      const { data, error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { username: u.username, role: u.role },
      });
      if (error) {
        console.error(`실패 ${u.email}:`, error.message);
      } else {
        console.log(`생성: ${u.email} (${u.username}, ${u.role})`);
      }
    } catch (err) {
      console.error(`오류 ${u.email}:`, err.message);
    }
  }
}

seed();
