import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sidebarUser = {
    email: user.email ?? "",
    fullName: (user.user_metadata?.full_name as string) ?? "",
  };

  return (
    <SidebarProvider>
      <AppSidebar user={sidebarUser} />
      <SidebarInset>
        {children}
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
