import type { Session, SessionUser } from "./auth";

export type { SessionUser, Session };

export type AppVariables = {
  requestId: string;
  user: SessionUser | null;
  session: Session | null;
};
