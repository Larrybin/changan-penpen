"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    Form,
    FormInput,
    FormLabel,
    FormMessage,
    FormSubmit,
    useZodForm,
} from "@/components/form";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
    createSignUpSchema,
    type SignUpSchema,
} from "@/modules/auth/models/auth.model";
import dashboardRoutes from "@/modules/dashboard/dashboard.route";
import { signUp } from "../actions/auth.action";
import authRoutes from "../auth.route";
import { authClient } from "../utils/auth-client";

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const router = useRouter();
    const tSignup = useTranslations("AuthForms.Signup");
    const tShared = useTranslations("AuthForms.Shared");
    const tValidation = useTranslations("AuthForms.Validation");
    const tMessages = useTranslations("AuthForms.Messages");

    const { form, isSubmitting, handleSubmit, getFieldError } = useZodForm({
        schema: createSignUpSchema(tValidation),
        defaultValues: {
            username: "",
            email: "",
            password: "",
        },
        onSubmit: async (values: SignUpSchema) => {
            const { success, messageKey } = await signUp(values);

            if (success) {
                toast.success(tMessages(messageKey));
                router.push(dashboardRoutes.dashboard);
            } else {
                // 错误已经在 useZodForm 中处理了
                throw new Error(tMessages(messageKey));
            }
        },
    });

    const signInWithGoogle = async () => {
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: dashboardRoutes.dashboard,
            });
        } catch (_err) {
            toast.error(tMessages("socialSignInError"));
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">
                        <h2 className="text-xl font-semibold">
                            {tSignup("title")}
                        </h2>
                    </CardTitle>
                    <CardDescription>{tSignup("description")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid gap-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                                    onClick={signInWithGoogle}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                    {tSignup("googleCta")}
                                </Button>
                                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                                        {tShared("continueWith")}
                                    </span>
                                </div>
                                <div className="grid gap-6">
                                    <div className="flex flex-col gap-2">
                                        <FormLabel htmlFor="username">
                                            {tShared("fields.username.label")}
                                        </FormLabel>
                                        <FormInput
                                            id="username"
                                            name="username"
                                            placeholder={tShared(
                                                "fields.username.placeholder",
                                            )}
                                            error={!!getFieldError("username")}
                                        />
                                        <FormMessage field="username" />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <FormLabel htmlFor="email">
                                            {tShared("fields.email.label")}
                                        </FormLabel>
                                        <FormInput
                                            id="email"
                                            name="email"
                                            placeholder={tShared(
                                                "fields.email.placeholder",
                                            )}
                                            error={!!getFieldError("email")}
                                        />
                                        <FormMessage field="email" />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <FormLabel htmlFor="password">
                                            {tShared("fields.password.label")}
                                        </FormLabel>
                                        <FormInput
                                            id="password"
                                            name="password"
                                            type="password"
                                            placeholder={tShared(
                                                "fields.password.placeholder",
                                            )}
                                            error={!!getFieldError("password")}
                                        />
                                        <FormMessage field="password" />
                                    </div>

                                    <FormSubmit
                                        isSubmitting={isSubmitting}
                                        className="w-full"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin mr-2" />
                                                {tShared("loading")}
                                            </>
                                        ) : (
                                            tSignup("submit")
                                        )}
                                    </FormSubmit>
                                </div>
                                <div className="text-center text-sm">
                                    {tSignup("switchPrompt")}{" "}
                                    <Link
                                        href={authRoutes.login}
                                        className="text-primary underline underline-offset-4"
                                    >
                                        {tSignup("switchCta")}
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            <div className="text-muted-foreground text-center text-xs text-balance">
                {tShared("agreement.prefix")}{" "}
                <Link
                    href="/terms"
                    className="text-primary underline underline-offset-4 hover:text-primary"
                >
                    {tShared("agreement.terms")}
                </Link>{" "}
                {tShared("agreement.conjunction")}{" "}
                <Link
                    href="/privacy"
                    className="text-primary underline underline-offset-4 hover:text-primary"
                >
                    {tShared("agreement.privacy")}
                </Link>
                .
            </div>
        </div>
    );
}
