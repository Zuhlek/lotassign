import NextAuth, { DefaultSession } from "next-auth";
import authConfig from "@/auth.config"; 
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/db";
import { UserRole } from "@prisma/client";
import { getUserById } from "./lib/userActions";
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  callbacks: {
    async signIn({user}){
      //if(user.id === undefined) return false;

      //const existingUser = await getUserById(user.id);

      //if(!existingUser || !existingUser.emailVerified){
      //  return false;
      //}

      return true;
    },
    async jwt({token}) {

      if (!token.sub ) return token;

      const user = await getUserById(token.sub);

      if (!user) return token;

      token.role = user.role;
      return token;
    },
    async session({session, token}) {
      if( token.sub && session.user){
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }
      return session;
    }
  },
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
});
