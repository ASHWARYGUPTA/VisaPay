// /types/next-auth.d.ts or /next-auth.d.ts

import { Jwt } from "jsonwebtoken";
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface User {
    id?: string;
    token: string;
  }

  interface Session {
    userId?: string; // Add your custom property
    token?: Jwt | string; // Add your custom property
    user: DefaultSession["user"] & {
      id?: string; // Add id to user object
    };
  }

  interface Token {
    id: string;
    token?: string;
  }

  interface AdapterUser {
    userId: string;
    token: string;
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and sent to the `session` callback. */
  interface JWT extends DefaultJWT {
    id?: string; // Corresponds to 'userId' in the session
    accessToken?: string; // Corresponds to 'token' in the session
    token?: string;
  }
}
