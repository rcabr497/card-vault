import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    remember?: boolean;
    loginAt?: number;
  }

  interface User {
    remember?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    remember?: boolean;
    loginAt?: number;
  }
}
