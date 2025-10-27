import { UserDetailClient } from "@/modules/users-admin/components/user-detail.client";

interface UserDetailPageProps {
    userId: string;
}

export function UserDetailPage({ userId }: UserDetailPageProps) {
    return <UserDetailClient userId={userId} />;
}
