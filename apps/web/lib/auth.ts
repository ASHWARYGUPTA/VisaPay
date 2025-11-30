import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@repo/db";
import jwt from "jsonwebtoken";
import { compare } from "bcrypt";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "Enter your username or email",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      async authorize(credentials) {
        try {
          if (!credentials) throw new Error("Credentials are required");
          if (!credentials.username || !credentials.password) {
            throw new Error("Username or Password is missing");
          }
          const usernameOrEmail = credentials.username;
          const password = credentials.password;

          const user = await prisma.user.findFirst({
            where: {
              OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
            },
            select: {
              id: true,
              email: true,
              password: true,
              name: true,
              typeSignIn: true,
              username: true,
            },
          });

          if (!user) throw new Error("User not found");

          if (user.typeSignIn !== "Credentials") {
            throw new Error(
              "User Signed In Using OAuth. Try Signing In Using OAuth"
            );
          }

          if (!user.password) {
            throw new Error("Password is not set, try using OAuth");
          }

          const isValidPassword = await compare(password, user.password);

          if (!isValidPassword) throw new Error("Invalid Password");

          const token = {
            id: user.id,
            email: user.email,
          };

          const returningSafeData = jwt.sign(
            token,
            process.env.JWT_SECRET || "fallback-secret-change-in-production"
          );

          return {
            id: user.id,
            email: user.email || "",
            name: user.name,
            token: returningSafeData,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email || "" },
          });

          if (existingUser && existingUser.typeSignIn !== "Google") {
            return false;
          }

          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email || "",
                name: user.name || "",
                username: user.email?.split("@")[0] || "",
                typeSignIn: "Google",
              },
            });
          }
        } catch (error) {
          console.error("Sign in error:", error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (token) {
        session.userId = token.id as string;
        session.token = token.token as string;
        session.user = {
          ...session.user,
          id: token.id as string, // Add id to user object
          name: token.name,
          email: token.email,
        };
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.token = user.token;
        token.email = user.email;
        token.name = user.name;
      }

      if (account?.provider === "google" && user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email || "" },
        });
        if (dbUser) {
          token.id = dbUser.id;
          const jwtToken = jwt.sign(
            { id: dbUser.id, email: dbUser.email },
            process.env.JWT_SECRET || "fallback-secret-change-in-production"
          );
          token.token = jwtToken;
        }
      }

      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
