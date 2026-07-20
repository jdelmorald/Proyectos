import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "DIRECTOR" | "COLABORADOR";
    companyId: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: "DIRECTOR" | "COLABORADOR";
      companyId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "DIRECTOR" | "COLABORADOR";
    companyId: string | null;
  }
}
