import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthResponse } from "@/modules/auth/models/auth.model";
import { signIn, signOut, signUp } from "../auth.action";

const signInEmailMock = vi.fn();
const signUpEmailMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("@/modules/auth/utils/auth-utils", () => ({
    getAuthInstance: vi.fn(async () => ({
        api: {
            signInEmail: signInEmailMock,
            signUpEmail: signUpEmailMock,
            signOut: signOutMock,
            getSession: vi.fn().mockResolvedValue({
                user: { id: "user-1", email: "user@example.com" },
            }),
        },
    })),
}));

const headersMock = vi.fn(() => new Headers({ Authorization: "Bearer token" }));

vi.mock("next/headers", () => ({
    headers: headersMock,
}));

describe("auth server actions", () => {
    beforeEach(() => {
        signInEmailMock.mockReset();
        signUpEmailMock.mockReset();
        signOutMock.mockReset();
        headersMock.mockClear();
    });

    describe("signIn", () => {
        it("returns success payload when API call succeeds", async () => {
            signInEmailMock.mockResolvedValueOnce(undefined);

            const result = await signIn({
                email: "user@example.com",
                password: "hunter2",
            });

            expect(signInEmailMock).toHaveBeenCalledWith({
                body: { email: "user@example.com", password: "hunter2" },
            });
            const expected: AuthResponse = {
                success: true,
                code: "SIGNED_IN",
                messageKey: "signInSuccess",
            };
            expect(result).toEqual(expected);
        });

        it("normalizes thrown errors into AuthResponse", async () => {
            signInEmailMock.mockRejectedValueOnce(
                new Error("invalid credentials"),
            );

            const result = await signIn({
                email: "user@example.com",
                password: "wrong",
            });

            expect(result).toEqual({
                success: false,
                code: "ERROR",
                messageKey: "unknownError",
                message: "invalid credentials",
            });
        });
    });

    describe("signUp", () => {
        it("passes through request payload and returns success", async () => {
            signUpEmailMock.mockResolvedValueOnce(undefined);

            const result = await signUp({
                email: "new@example.com",
                password: "hunter2",
                username: "new-user",
            });

            expect(signUpEmailMock).toHaveBeenCalledWith({
                body: {
                    email: "new@example.com",
                    password: "hunter2",
                    name: "new-user",
                },
            });
            expect(result).toEqual({
                success: true,
                code: "SIGNED_UP",
                messageKey: "signUpSuccess",
            });
        });

        it("returns error payload when upstream fails", async () => {
            signUpEmailMock.mockRejectedValueOnce(new Error("email in use"));

            const result = await signUp({
                email: "new@example.com",
                password: "hunter2",
                username: "new-user",
            });

            expect(result).toEqual({
                success: false,
                code: "ERROR",
                messageKey: "unknownError",
                message: "email in use",
            });
        });
    });

    describe("signOut", () => {
        it("forwards request headers to auth client and reports success", async () => {
            signOutMock.mockResolvedValueOnce(undefined);

            const result = await signOut();

            expect(signOutMock).toHaveBeenCalledTimes(1);
            const callArgs = signOutMock.mock.calls[0]?.[0];
            expect(callArgs?.headers).toBeInstanceOf(Headers);
            expect(headersMock).toHaveBeenCalledTimes(1);
            expect(result).toEqual({
                success: true,
                code: "SIGNED_OUT",
                messageKey: "signOutSuccess",
            });
        });

        it("maps thrown errors into structured response", async () => {
            signOutMock.mockRejectedValueOnce(new Error("network down"));

            const result = await signOut();

            expect(result).toEqual({
                success: false,
                code: "ERROR",
                messageKey: "unknownError",
                message: "network down",
            });
        });
    });
});
