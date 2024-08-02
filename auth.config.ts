import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login'
    },
    callbacks: {
        authorized({ auth, request: { nextUrl }}) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false;
            } else if (isLoggedIn) return Response.redirect("/dashboard"); // redirect to dashboard if user is logged in
            return true;
        }
    },
    providers: [],
} satisfies NextAuthConfig;