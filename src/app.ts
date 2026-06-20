import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import type { Context } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { secureHeaders } from "hono/secure-headers";
import { auth } from "./auth";
import {
  corsCredentialsEnabled,
  env,
  trustedFrontendOrigins,
} from "./config/env";
import { mergeCorsIntoAuthResponse } from "./lib/cors-merge";
import { logger } from "./lib/logger";
import { requestLoggerMiddleware } from "./middlewares/request-logger";
import { requestIdMiddleware } from "./middlewares/request-id";
import { sessionMiddleware } from "./middlewares/session";
import healthRouter from "./routes/health";
import type { AppVariables } from "./types";
import { apiV1Router } from "./routes/v1";

export const app = new Hono<{ Variables: AppVariables }>();

function resolveAllowedOrigin(origin: string | undefined): string | null {
  if (!origin) return null;

  const normalizedOrigin = origin.replace(/\/$/, "");
  if (env.CORS_ORIGIN.trim() === "*") {
    return normalizedOrigin;
  }

  return trustedFrontendOrigins.includes(normalizedOrigin)
    ? normalizedOrigin
    : null;
}

const corsOptions = {
  origin: (origin: string) => resolveAllowedOrigin(origin) ?? "",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: corsCredentialsEnabled,
};

app.use("*", requestIdMiddleware);
app.use("*", requestLoggerMiddleware);
app.use("*", compress());
app.use("*", secureHeaders());
app.use("/api/auth/*", cors(corsOptions));
app.use("*", cors(corsOptions));
app.use("*", sessionMiddleware);

app.on(["POST", "GET"], "/api/auth/*", async (c) => {
  const response = await auth.handler(c.req.raw);
  return mergeCorsIntoAuthResponse(c.req.raw, response);
});

app.route("/health", healthRouter);
app.route("/api/v1", apiV1Router);

app.get(
  "/docs",
  Scalar({
    url: "/openapi.json",
    pageTitle: "Voyager API",
  }),
);

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
      },
      requestId: c.get("requestId"),
    },
    404,
  );
});

function applyCorsHeadersOnError(c: Context<{ Variables: AppVariables }>) {
  const origin = c.req.header("origin");
  const allowedOrigin = resolveAllowedOrigin(origin);
  if (!allowedOrigin) return;

  c.header("Access-Control-Allow-Origin", allowedOrigin);
  c.header("Vary", "Origin");
  if (corsCredentialsEnabled) {
    c.header("Access-Control-Allow-Credentials", "true");
  }
}

app.onError((err, c) => {
  const requestIdValue = c.get("requestId");
  applyCorsHeadersOnError(c);

  logger.error(
    {
      requestId: requestIdValue,
      method: c.req.method,
      path: new URL(c.req.url).pathname,
      err,
    },
    "request failed",
  );

  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: {
          code: "HTTP_EXCEPTION",
          message: err.message,
        },
        requestId: requestIdValue,
      },
      err.status,
    );
  }

  return c.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          env.NODE_ENV === "production"
            ? "Something went wrong"
            : err instanceof Error
              ? err.message
              : "Unknown error",
      },
      requestId: requestIdValue,
    },
    500,
  );
});
