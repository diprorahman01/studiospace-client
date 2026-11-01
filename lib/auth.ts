
import "server-only";

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { nextCookies } from "better-auth/next-js";

import { authDB, mongoClient } from "@/lib/auth/mongodb";

export const auth = betterAuth({
  database: mongodbAdapter(authDB, {
    client: mongoClient,
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  plugins: [nextCookies()],

  logger: {
    level: "debug",
  },
});
