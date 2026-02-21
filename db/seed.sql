insert into users (
  email,
  password_hash,
  name,
  timezone,
  phone_verified,
  consent_flags,
  preferences
)
values (
  'demo@goalcoach.app',
  'demo-password',
  'Demo User',
  'America/Los_Angeles',
  true,
  '{"calls_opt_in":true,"transcription_opt_in":true,"storage_opt_in":true}'::jsonb,
  '{"coaching_style":"mixed"}'::jsonb
)
on conflict (email) do nothing;
