import { createAuthMiddleware } from "@better-auth/core/api";
import type { BetterAuthPlugin } from "better-auth";

/** When Expo omits callbackURL, OAuth falls back to baseURL (ngrok) and the app never reopens. */
export function expoDefaultCallback(): BetterAuthPlugin {
  return {
    id: "expo-default-callback",
    hooks: {
      before: [
        {
          matcher(context) {
            return context.path === "/sign-in/social";
          },
          handler: createAuthMiddleware(async (ctx) => {
            if (ctx.body?.callbackURL) return;

            const expoOrigin = ctx.request?.headers.get("expo-origin");
            if (!expoOrigin) return;

            ctx.body.callbackURL = expoOrigin;
          }),
        },
      ],
    },
  };
}
