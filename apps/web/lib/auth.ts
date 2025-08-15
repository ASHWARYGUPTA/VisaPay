import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@repo/db";
import jwt from "jsonwebtoken";
import { compare } from "bcrypt";
import { Adapter } from "next-auth/adapters";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "Enter your username",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password",
        },
      },
      async authorize(credentials) {
        try {
          // console.log("Credentials: ", credentials);
          if (!credentials) throw new Error("Credentials are required");
          if (!credentials.username || !credentials.password) {
            throw new Error("Username or Password is missing");
          }
          const usernameOrEmail = credentials.username;
          const password = credentials.password;
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                {
                  username: usernameOrEmail,
                },
                {
                  email: usernameOrEmail,
                },
              ],
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

          if (user.typeSignIn != "Credentials") {
            throw new Error(
              "User Signed In Using OAuth Try Signing In Using OAuth"
            );
          }
          if (!user.password)
            throw new Error("Password is not set, try using OAuth");
          const isValidPassword = await compare(
            password,
            user.password ? user.password : ""
          );

          const token = {
            id: user.id,
            token: usernameOrEmail, // Return the username or email
          };
          const returningSafeData = jwt.sign(
            token,
            process.env.JWT_SECRET ? process.env.JWT_SECRET : "dfgds"
          );
          if (!isValidPassword) throw new Error("Invalid Password");
          // console.log(user);
          return {
            id: user.id,
            email: user.email,
            token: returningSafeData,
          };
        } catch (error) {
          console.log(error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async session({ session, token, user }) {
      session.userId = user?.id || token?.id;
      session.token = user?.token || token?.token;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.token = user.token;
      }
      return token;
    },
  },
};

export default authOptions;
