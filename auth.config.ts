import Credentials from "next-auth/providers/credentials";
import {getUserByEmail} from "./lib/userActions";
import type { NextAuthConfig } from "next-auth";
import bcrypt from "bcryptjs";
import { signInSchema } from "./lib/schemas";

function comparePasswords(pwHash: string, userPassword: string) {
  return bcrypt.compare(userPassword, pwHash);
}

export default {
  providers: [
    Credentials({ 
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials || !credentials.email || !credentials.password) {
          throw new Error("Missing credentials");
        }

        const { email, password } = await signInSchema.parseAsync(credentials);

        const user = await getUserByEmail(email as string);

        if (!user || !user.password) return null;

        const passwordsMatch = await comparePasswords(user.password, password);

        if (passwordsMatch) {
          return user;
        } else {
          throw new Error("Password does not match.");
        }
      }
    }),
  ],
} satisfies NextAuthConfig;
