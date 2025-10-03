import PricingGrid from "@/modules/creem/components/pricing-grid";
import Link from "next/link";

export default async function Page() {
    return (
        <div className="mx-auto max-w-[var(--container-max-w)] py-12 px-[var(--container-px)]">
            <div className="text-center mb-10">
                <h1 className="text-title-sm font-bold mb-3">套餐与购买</h1>
                <p className="text-muted-foreground">
                    请选择订阅或积分套餐进行结账。结账需要先登录，若未登录请先
                    <Link href="/login" className="underline ml-1">登录</Link>。
                </p>
            </div>
            <PricingGrid />
        </div>
    );
}

