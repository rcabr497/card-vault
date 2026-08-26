"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BinderType } from "@prisma/client";

export async function createBinder(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in.");

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");

  if (!name || !Object.values(BinderType).includes(type as BinderType)) {
    throw new Error("A binder name and type are required.");
  }

  const binder = await prisma.binder.create({
    data: { userId: session.user.id, name, type: type as BinderType },
  });

  revalidatePath("/binders");
  redirect(`/binders/${binder.id}`);
}

export async function deleteBinder(binderId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not signed in.");

  const binder = await prisma.binder.findFirst({ where: { id: binderId, userId: session.user.id } });
  if (!binder) throw new Error("Binder not found.");

  await prisma.binder.delete({ where: { id: binder.id } });

  revalidatePath("/binders");
  redirect("/binders");
}
