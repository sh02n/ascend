export type AuthRole = "business" | "consumer";

export type SignupRequest = {
  email: string;
  name: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type UpdateRoleRequest = {
  role: AuthRole;
};

export type AuthTokenPayload = {
  sub: string;
  email: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: string | null;
  createdAt: string;
  updatedAt: string;
};

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthenticatedUser;
    }
  }
}

export {};
