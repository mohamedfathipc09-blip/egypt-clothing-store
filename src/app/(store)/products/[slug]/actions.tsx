"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function submitReviewAction(formData: FormData) {
  const productId = formData.get("product_id") as string;
  const productSlug = formData.get("product_slug") as string;
  const name = formData.get("name") as string;
  const rating = Number(formData.get("rating"));
  const comment = formData.get("comment") as string;

  if (!productId || !name || !rating) return { error: "يرجى إدخال الاسم والتقييم" };

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("reviews").insert({
    product_id: productId,
    customer_name: name,
    rating,
    comment,
  });

  if (error) return { error: error.message };
  
  revalidatePath(`/products/${productSlug}`);
  return { success: true };
}