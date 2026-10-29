"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function saveAddressAction(formData: FormData) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح" };

  const id = formData.get("id") as string;
  const label = formData.get("label") as string;
  const full_name = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;
  const governorate = formData.get("governorate") as string;
  const city = formData.get("city") as string;
  const street_address = formData.get("street_address") as string;
  const landmark = formData.get("landmark") as string;
  const is_default = formData.get("is_default") === "on";

  if (!full_name || !phone || !governorate || !city || !street_address) {
    return { error: "يرجى ملء جميع الحقول المطلوبة" };
  }

  // إذا كان هذا العنوان افتراضي، نلغي الافتراضي عن العناوين الأخرى
  if (is_default) {
    await supabase
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  const payload = {
    user_id: user.id,
    label: label || "المنزل",
    full_name,
    phone,
    governorate,
    city,
    street_address,
    landmark: landmark || null,
    is_default,
  };

  let res;
  if (id) {
    res = await supabase.from("customer_addresses").update(payload).eq("id", id).eq("user_id", user.id);
  } else {
    res = await supabase.from("customer_addresses").insert(payload);
  }

  if (res.error) return { error: res.error.message };

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}

export async function deleteAddressAction(id: string) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "غير مصرح" };

  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  return { success: true };
}