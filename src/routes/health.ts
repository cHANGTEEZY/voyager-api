import { Hono } from "hono";

const healthRouter = new Hono();

healthRouter.get("/", (c) => c.json({ status: "ok" }));

export default healthRouter;
