-- Fix: GoTrue expects non-null strings for token columns. NULL causes
-- "converting NULL to string is unsupported" during login.
-- https://supabase.com/docs/guides/troubleshooting/scan-error-on-column-confirmation_token-converting-null-to-string-is-unsupported-during-auth-login-a0c686

UPDATE auth.users SET confirmation_token = '' WHERE confirmation_token IS NULL;
