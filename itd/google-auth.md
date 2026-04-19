Google OAuth is already configured for the default deployment. Follow these steps only if setting up your own Supabase project.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project named `keyone-v2`.
2. APIs & Services -> Library -> search `Google Identity` -> Enable.
3. OAuth consent screen -> External -> fill app name/email -> Save.
4. Credentials -> Create OAuth client ID -> Web application.
5. Authorized redirect URI: `https://pzbtypairgvuskfpjwcg.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret.
7. Supabase -> Authentication -> Providers -> Google -> enable and paste credentials.
8. After Vercel deploy, add your Vercel URL to Google OAuth authorized origins.
