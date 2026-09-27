import { defineConfig } from "drizzle-kit";
import { config as loadEnvFiles } from "dotenv";

// Migrations must hit the same database file the app uses, so read the same
// env files the app reads (npm scripts run with cwd = server/).
loadEnvFiles({ path: [".env", "../.env"], quiet: true });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DB_FILE ?? "./data/alfarouq.sqlite",
  },
  strict: true,
  verbose: true,
});