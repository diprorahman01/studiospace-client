
import "server-only";

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { nextCookies } from "better-auth/next-js";

import {
  authDB,
  mongoClient,
} from "@/lib/auth/mongodb";

const baseURL =
  process.env.BETTER_AUTH_URL ||
  "http://localhost:3000";

const googleClientId =
  process.env.GOOGLE_CLIENT_ID;

const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  baseURL,

  trustedOrigins: [baseURL],

  database: mongodbAdapter(authDB, {
    client: mongoClient,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {},

  plugins: [nextCookies()],

  logger: {
    level:
      process.env.NODE_ENV === "production"
        ? "error"
        : "warn",
  },
});
