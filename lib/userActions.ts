"use server";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
  });
};

export const getUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
  });
};

type CreateUserInput = Omit<Prisma.UserCreateInput, 'id' | 'createdAt' | 'updatedAt'>;

export const createUser = async (user: CreateUserInput) => {
  return await prisma.user.create({
    data: user,
  });
};

type UpdateUserInput = Omit<Prisma.UserUpdateInput, 'createdAt' | 'updatedAt'> & { id: string };

export const updateUser = async (user: UpdateUserInput) => {
  const { id, ...data } = user;
  return await prisma.user.update({
    where: { id },
    data: data as Prisma.UserUpdateInput,
  });
};

export const deleteUser = async (id: string | undefined) => {
  await prisma.user.delete({
    where: { id },
  });
};

