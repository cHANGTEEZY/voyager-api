import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  TRUSTED_ORIGINS,
  env,
  getEmailVerificationCallbackUrl,
} from "./config/env";
import { db } from "./db";
import * as schema from "./db/schema";
import { expo } from "@better-auth/expo";
import { expoDefaultCallback } from "./plugins/expo-default-callback";

export const auth = betterAuth({
  appName: "Voyager API",

  plugins: [expo(), expoDefaultCallback()],

  baseURL: env.BETTER_AUTH_URL,

  secret: env.BETTER_AUTH_SECRET,

  trustedOrigins: TRUSTED_ORIGINS,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: env.NODE_ENV === "production",
  },

  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      // Email/password sign-ups in dev skip verification; allow Google to link anyway.
      requireLocalEmailVerified: env.NODE_ENV === "production",
    },
  },

  emailVerification: {
    sendOnSignUp: env.NODE_ENV === "production",
    autoSignInAfterVerification: true,
    callbackURL: getEmailVerificationCallbackUrl(),
  },

  advanced: {
    cookiePrefix: "voyager",
  },
});

export type SessionUser = typeof auth.$Infer.Session.user;
export type Session = typeof auth.$Infer.Session.session;
