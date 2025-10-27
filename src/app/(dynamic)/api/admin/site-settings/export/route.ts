import { type NextRequest, NextResponse } from "next/server";

import { type AppLocale, supportedLocales } from "@/i18n/config";
import handleApiError from "@/lib/api-error";
import { ApiError } from "@/lib/http-error";
import { ensureAbsoluteUrl, resolveAppUrl } from "@/lib/seo";
import {
    createStaticConfigBundleFromMessages,
    type MarketingSection,
    type MarketingSectionFile,
    type StaticSiteConfig,
} from "@/lib/static-config";
import { getSiteSettingsPayload } from "@/modules/admin/services/site-settings.service";

const AUTH_HEADER = "authorization";

type MessagesModule = {
    Marketing: Record<string, unknown>;
    StaticPages: Record<string, unknown>;
    Common: Record<string, unknown>;
    Metadata: {
        openGraph?: {
            siteName?: string;
        };
    };
};

type RemotePayload = StaticSiteConfig & {
    marketingSections: Record<MarketingSection, MarketingSectionFile>;
};

function readBearerToken(request: NextRequest): string | null {
    const header = request.headers.get(AUTH_HEADER);
    if (header) {
        const [scheme, value] = header.split(" ");
        if (scheme?.toLowerCase() === "bearer" && value?.trim().length) {
            return value.trim();
        }
    }
    const queryToken = request.nextUrl.searchParams.get("token");
    if (queryToken?.trim().length) {
        return queryToken.trim();
    }
    return null;
}

function readStaticExportSecret(): string {
    const token = process.env.STATIC_EXPORT_TOKEN;
    if (!token?.trim().length) {
        throw new ApiError("Static export token is not configured", {
            status: 500,
            code: "CONFIGURATION_ERROR",
            severity: "high",
            details: {
                environmentVariable: "STATIC_EXPORT_TOKEN",
            },
        });
    }
    return token.trim();
}

function resolveOgImage(
    locale: AppLocale,
    appUrl: string,
    settings: Awaited<ReturnType<typeof getSiteSettingsPayload>>,
): string {
    const localized = settings.seoOgImageLocalized?.[locale]?.trim();
    const base = settings.seoOgImage?.trim();
    const source = localized?.length
        ? localized
        : base?.length
          ? base
          : "/og-image.svg";
    return ensureAbsoluteUrl(source, appUrl);
}

function resolveExportVersion(): string {
    const candidates = [
        process.env.STATIC_EXPORT_VERSION,
        process.env.GITHUB_SHA,
        process.env.VERCEL_GIT_COMMIT_SHA,
        process.env.COMMIT_SHA,
    ];
    for (const candidate of candidates) {
        if (candidate?.trim().length) {
            return candidate.trim();
        }
    }
    return "";
}

function resolveExportUpdatedAt(): string {
    const candidate = process.env.STATIC_EXPORT_UPDATED_AT ?? "";
    const normalized = candidate.trim();
    if (normalized.length && !Number.isNaN(Date.parse(normalized))) {
        return new Date(normalized).toISOString();
    }
    return new Date().toISOString();
}

export async function GET(request: NextRequest) {
    try {
        const secret = readStaticExportSecret();

        const providedToken = readBearerToken(request);
        if (!providedToken || providedToken !== secret) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const settings = await getSiteSettingsPayload();
        const envAppUrl = process.env.NEXT_PUBLIC_APP_URL;
        const appUrl = resolveAppUrl(settings, { envAppUrl });
        const version = resolveExportVersion();
        const updatedAt = resolveExportUpdatedAt();

        const configs: Record<AppLocale, RemotePayload> = {} as Record<
            AppLocale,
            RemotePayload
        >;

        for (const locale of supportedLocales) {
            const messagesModule = (await import(
                `@/i18n/messages/${locale}.json`
            )) as MessagesModule;
            const metadataMessages = messagesModule.Metadata ?? { openGraph: {} };
            const openGraphSiteName = metadataMessages.openGraph?.siteName ?? "";
            const resolvedSiteName = settings.siteName?.trim().length
                ? settings.siteName.trim()
                : openGraphSiteName;
            const ogImage = resolveOgImage(locale, appUrl, settings);

            const bundle = createStaticConfigBundleFromMessages(
                locale,
                messagesModule,
                {
                    baseUrl: appUrl,
                    version,
                    updatedAt,
                    siteName: resolvedSiteName,
                    ogImage,
                },
            );

            configs[locale] = {
                ...bundle.config,
                metadata: {
                    ...bundle.config.metadata,
                    baseUrl: appUrl,
                    siteName: resolvedSiteName,
                    ogImage,
                },
                marketingSections: bundle.sections,
            } satisfies RemotePayload;
        }

        return NextResponse.json(configs);
    } catch (error) {
        return handleApiError(error);
    }
}
