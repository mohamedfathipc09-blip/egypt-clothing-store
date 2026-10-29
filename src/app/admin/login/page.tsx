import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const redirectTo = typeof searchParams.redirectTo === "string" 
    ? searchParams.redirectTo 
    : "/admin/dashboard";

  return (
    <div dir="rtl" className="min-h-screen bg-gray-950 flex flex-col justify-center items-center px-4 py-12 text-gray-100">
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}