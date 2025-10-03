import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
    return (
        <div className="mx-auto max-w-xl py-16 px-6 text-center space-y-6">
            <h1 className="text-title-sm font-bold">支付成功</h1>
            <p className="text-muted-foreground">
                我们已收到您的支付，帐户权益将很快更新。如未看到更新，请稍候片刻或刷新页面。
            </p>
            <div className="flex gap-3 justify-center">
                <Link href="/dashboard">
                    <Button>返回仪表盘</Button>
                </Link>
                <Link href="/billing">
                    <Button variant="outline">继续购买</Button>
                </Link>
            </div>
        </div>
    );
}
