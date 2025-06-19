import { betterAuth } from "better-auth";
import { organization, apiKey, bearer } from "better-auth/plugins";
import { Pool } from "pg";
import { EmailTemplate } from "@daveyplate/better-auth-ui/server"
import { render } from '@react-email/components';
import nodemailer from 'nodemailer';
 
export const auth = betterAuth({
    database: new Pool({
        connectionString: process.env.AUTH_DATABASE_URL,
    }),
    emailAndPassword: {
        enabled: true,
    },
    emailVerification: {
        enabled: true,
        sendVerificationEmail: async ({ user, url, token }) => {
            const transport = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                },
            });
            const html = await render(
                EmailTemplate({
                    action: "Verify Email",
                    url,
                    baseUrl: process.env.BETTER_AUTH_URL,
                    heading: "Verify Email",
                    siteName: "AIChat",
                    content: "Please click the link below to verify your email address",
                })
            );
            await transport.sendMail({
                from: "AIChat <" + process.env.SMTP_ADDRESS + ">",
                to: user.email,
                subject: 'Verify your email address',
                html,
            });
        },
    },
    plugins: [organization({
        sendInvitationEmail: async (data) => {
            const transport = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                secure: false,
                auth: {
                    user: process.env.SMTP_ADDRESS,
                    pass: process.env.SMTP_PASSWORD,
                },
            });
            const html = await render(
                EmailTemplate({
                    action: "Accept",
                    imageUrl: process.env.BETTER_AUTH_URL + "/logo.png",
                    baseUrl: process.env.BETTER_AUTH_URL,
                    url: process.env.BETTER_AUTH_URL + "/auth/accept-invitation?invitationId=" + data.id,
                    heading: "Accept Organization Invitation",
                    siteName: "AIChat",
                    content: data.inviter.user.name + " invited you to join the organization " + data.organization.name + ". Please click the link below to accept your invitation",
                })
            );
            await transport.sendMail({
                from: "AIChat <" + process.env.SMTP_ADDRESS + ">",
                to: data.email,
                subject: 'You have been invited to join the organization ' + data.organization.name,
                html,
            });
        },
    }), apiKey(), bearer()],
})