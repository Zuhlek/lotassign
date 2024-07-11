"use server"
import { signInSchema } from "@/lib/schemas";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { AuthError } from "next-auth";
import { signIn } from "next-auth/react";
import { z } from "zod";

export async function doCredentialsLogin(formData: FormData) {
  try {
    const response = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    return response;
  } catch (error) {
    throw new Error("Error");
  }
}

export const login = async (credentials: z.infer<typeof signInSchema>) => {
  const validatedFields = signInSchema.safeParse(credentials);

  if (!validatedFields.success) {
    return validatedFields.error.errors;
  }

  const { email, password } = validatedFields.data;

  try {
    await signIn("credentials", { email, password, redirectTo: DEFAULT_LOGIN_REDIRECT });
    console.log("Logged in");
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        default:
          return { error: "An error occurred" };
      }
    }
    throw error;
  }

};