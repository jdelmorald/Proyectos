import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    isAdmin: boolean;
    canEditSuppliers: boolean;
    canDeleteSuppliers: boolean;
  }

  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      canEditSuppliers: boolean;
      canDeleteSuppliers: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin: boolean;
    canEditSuppliers: boolean;
    canDeleteSuppliers: boolean;
  }
}
