import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
    return (
        <div className="mx-auto max-w-xl py-16 px-6 text-center space-y-6">
            <h1 className="text-title-sm font-bold">已取消支付</h1>
            <p className="text-muted-foreground">
                支付已取消，您可以稍后继续或选择其他套餐。
            </p>
            <div className="flex gap-3 justify-center">
                <Link href="/billing">
                    <Button>返回套餐页</Button>
                </Link>
                <Link href="/dashboard">
                    <Button variant="outline">回到仪表盘</Button>
                </Link>
            </div>
        </div>
    );
}
