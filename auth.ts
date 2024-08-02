import NextAuth from "next-auth";
import { authConfig } from "@app/../auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { User } from "./app/lib/definitions";
import bcrypt from 'bcrypt';

async function getUser(email: string) {
    try {
        const user = await sql<User>`SELECT * FROM users WHERE email = ${email}`;
        return user.rows[0];
    } catch(e) {
        console.error("An error occured while reading user details,", e);
        throw new Error("Failed to fetch user details");
    }
}

export const {auth, signIn, signOut} = NextAuth({ 
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z.object({
                    email: z.string().email(),
                    password: z.string().min(6)
                }).safeParse(credentials);

                if (parsedCredentials.success) {
                    // get user details
                    const {email, password} = parsedCredentials.data;
                    const user = await getUser(email);
                    if (!user) return null;
                    // if user is present, match the password
                    const passwordMatch = await bcrypt.compare(password, user.password);
                    if (passwordMatch) return user;
                }
                return null;
            }
        })
    ]
});