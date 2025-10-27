"use client";

import { useCallback, useEffect, useRef } from "react";

declare global {
    interface Window {
        turnstile?: {
            render(
                element: HTMLElement,
                options: Record<string, unknown>,
            ): string;
            reset(id?: string): void;
            remove?(id: string): void;
        };
    }
}

const TURNSTILE_SCRIPT_SRC =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
    if (typeof window === "undefined") {
        return Promise.resolve();
    }
    if (loadPromise) {
        return loadPromise;
    }
    loadPromise = new Promise((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
            `script[src="${TURNSTILE_SCRIPT_SRC}"]`,
        );
        if (existing) {
            if (existing.dataset.loaded === "true") {
                resolve();
                return;
            }
            existing.addEventListener("load", () => {
                existing.dataset.loaded = "true";
                resolve();
            });
            existing.addEventListener("error", () => reject(new Error("Failed to load Turnstile script")));
            return;
        }

        const script = document.createElement("script");
        script.src = TURNSTILE_SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.addEventListener("load", () => {
            script.dataset.loaded = "true";
            resolve();
        });
        script.addEventListener("error", () => {
            reject(new Error("Failed to load Turnstile script"));
        });
        document.head.append(script);
    });
    return loadPromise;
}

export interface TurnstileWidgetProps {
    siteKey: string;
    className?: string;
    onVerify(token: string): void;
    onExpire?: () => void;
    onError?: (error: unknown) => void;
}

export function TurnstileWidget({
    siteKey,
    className,
    onVerify,
    onExpire,
    onError,
}: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    const renderWidget = useCallback(async () => {
        if (!containerRef.current || !siteKey) {
            return;
        }
        try {
            await loadTurnstileScript();
            if (!containerRef.current || !window.turnstile) {
                return;
            }
            if (widgetIdRef.current) {
                window.turnstile.reset(widgetIdRef.current);
            }
            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                callback: (token: string) => {
                    onVerify(token);
                },
                "expired-callback": () => {
                    onExpire?.();
                    if (widgetIdRef.current) {
                        window.turnstile?.reset(widgetIdRef.current);
                    }
                },
                "error-callback": (error: unknown) => {
                    onError?.(error);
                },
                appearance: "interaction-only",
            });
        } catch (error) {
            onError?.(error);
        }
    }, [onError, onExpire, onVerify, siteKey]);

    useEffect(() => {
        void renderWidget();
        return () => {
            if (widgetIdRef.current && window.turnstile?.remove) {
                window.turnstile.remove(widgetIdRef.current);
            }
            widgetIdRef.current = null;
        };
    }, [renderWidget]);

    return <div className={className} ref={containerRef} />;
}
