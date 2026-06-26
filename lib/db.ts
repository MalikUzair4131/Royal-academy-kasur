import fs from 'fs';
import path from 'path';
import dns from 'dns';
import mongoose from 'mongoose';

function loadLocalEnv() {
  if (process.env.MONGODB_URI) return;

  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;

  const envContents = fs.readFileSync(envPath, 'utf8');
  envContents.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    if (!key || rest.length === 0) return;
    const value = rest.join('=').trim();
    if (process.env[key.trim()] === undefined) {
      process.env[key.trim()] = value;
    }
  });
}

loadLocalEnv();

if (!process.env.MONGODB_URI) {
  throw new Error('Missing MONGODB_URI environment variable');
}

// Force a known working DNS resolver for SRV lookups if the default resolver fails.
if (!process.env.NODE_DNS_SERVERS) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (error) {
    // Ignore if DNS servers cannot be set in this environment.
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.set('strictQuery', false);

const mongooseOptions = {
  autoIndex: false,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
};

let cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = {
  conn: null,
  promise: null,
};

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, mongooseOptions).then(mongoose => mongoose);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
