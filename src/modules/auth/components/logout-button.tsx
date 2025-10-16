"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { signOut } from "@/modules/auth/actions/auth.action";
import authRoutes from "../auth.route";

export default function LogoutButton() {
    const router = useRouter();
    const tMessages = useTranslations("AuthForms.Messages");
    const tAuth = useTranslations("Auth");

    const handleLogout = async () => {
        try {
            const result = await signOut();
            if (result.success) {
                toast.success(tMessages(result.messageKey));
                router.push(authRoutes.login);
                router.refresh(); // Refresh to clear any cached data
            } else {
                toast.error(tMessages(result.messageKey));
            }
        } catch (_error) {
            toast.error(tMessages("unknownError"));
        }
    };

    return (
        <Button variant="ghost" onClick={handleLogout}>
            {tAuth("logout")} <LogOut className="size-4" />
        </Button>
    );
}
