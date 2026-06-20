import { createMiddleware } from "hono/factory";
import { auth } from "../auth";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import type { AppVariables } from "../types";

export const sessionMiddleware = createMiddleware<{ Variables: AppVariables }>(
  async (c, next) => {
    try {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });

      if (!session) {
        c.set("user", null);
        c.set("session", null);
      } else {
        c.set("user", session.user);
        c.set("session", session.session);
      }
    } catch (error) {
      if (env.NODE_ENV !== "test") {
        logger.warn({ error }, "session lookup failed");
      }
      c.set("user", null);
      c.set("session", null);
    }

    await next();
  },
);
