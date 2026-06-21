-- Add custom email template columns to system_settings
ALTER TABLE "public"."system_settings"
ADD COLUMN IF NOT EXISTS "ticket_creation_email_subject" TEXT,
ADD COLUMN IF NOT EXISTS "ticket_creation_email_body_html" TEXT;
