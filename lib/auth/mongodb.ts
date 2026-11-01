
import "server-only";

import dns from "node:dns";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "studiospace";

if (!uri) {
  throw new Error("MONGODB_URI is missing in .env.local");
}

// Local DNS workaround from our earlier MongoDB setup
if (process.env.NODE_ENV !== "production") {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

const globalForMongo = globalThis as typeof globalThis & {
  _authMongoClient?: MongoClient;
};

export const mongoClient =
  globalForMongo._authMongoClient ?? new MongoClient(uri);

if (process.env.NODE_ENV !== "production") {
  globalForMongo._authMongoClient = mongoClient;
}

export const authDB = mongoClient.db(dbName);
