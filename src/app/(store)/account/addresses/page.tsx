import React from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AddressManagerClient from "./AddressManagerClient";

export const dynamic = "force-dynamic";

export default async function AccountAddressesPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: addresses } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("user_id", user?.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return <AddressManagerClient initialAddresses={addresses || []} />;
}