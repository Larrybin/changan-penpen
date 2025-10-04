"use client";

import * as React from "react";

interface UsagePoint {
    date: string;
    amount: number;
}

interface UsageSparklineProps {
    data: UsagePoint[];
}

export function UsageSparkline({ data }: UsageSparklineProps) {
    const points = React.useMemo(() => {
        if (!data.length) {
            return "0,40 100,40";
        }
        const values = data.map((point) => point.amount);
        const max = Math.max(...values);
        const min = Math.min(...values);
        const range = max - min || 1;

        return data
            .map((point, index) => {
                const x = (index / Math.max(data.length - 1, 1)) * 100;
                const y = 40 - ((point.amount - min) / range) * 30;
                return `${x},${y}`;
            })
            .join(" ");
    }, [data]);

    return (
        <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            className="h-20 w-full text-primary"
        >
            <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={points}
            />
        </svg>
    );
}
