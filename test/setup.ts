process.env.NODE_ENV ??= "test";
process.env.FRONTEND_ORIGIN ??= "http://localhost:5173";
process.env.DATABASE_URL ??=
  "postgresql://postgres:postgres@localhost:5432/voyager_test";
process.env.BETTER_AUTH_SECRET ??=
  "test-better-auth-secret-32-chars-min!!";
