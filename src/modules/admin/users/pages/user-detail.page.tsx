import { UserDetailClient } from "@/modules/admin/users/components/user-detail.client";

interface UserDetailPageProps {
    userId: string;
}

export function UserDetailPage({ userId }: UserDetailPageProps) {
    return <UserDetailClient userId={userId} />;
}
