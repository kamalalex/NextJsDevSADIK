// types/next-auth.d.ts
import NextAuth from "next-auth";
import { AuthUser } from "@/lib/auth";

declare module "next-auth" {
  interface User extends AuthUser {
    id: string;
  }

  interface Session {
    user: AuthUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends AuthUser {
    userId: string;
  }
}