import { betterAuth } from "better-auth";
import { organization, apiKey, bearer } from "better-auth/plugins";
import { Pool } from "pg";
 
export const auth = betterAuth({
    database: new Pool({
        connectionString: process.env.AUTH_DATABASE_URL,
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [organization(), apiKey(), bearer()],
})