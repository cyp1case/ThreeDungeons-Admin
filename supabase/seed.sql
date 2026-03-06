-- Three Dungeons Residency - Seed Data
-- Program, Leader, Super Admin, Cohorts, Residents (Learners)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========== PROGRAM ==========
INSERT INTO programs (id, name)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Three Dungeons Residency'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ========== AUTH USERS (Leader + Super Admin) ==========
DO $$
DECLARE
  v_program_id UUID := 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
  v_leader_id UUID := 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e';
  v_super_id UUID := 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f';
  v_encrypted_pw TEXT := crypt('password', gen_salt('bf'));
BEGIN
  -- 1. Leader: Program.Director@ThreeDungeons.com
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_leader_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'Program.Director@ThreeDungeons.com',
    v_encrypted_pw,
    NOW(),
    '',
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET confirmation_token = COALESCE(auth.users.confirmation_token, '');

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    v_leader_id,
    v_leader_id,
    format('{"sub": "%s", "email": "Program.Director@ThreeDungeons.com"}', v_leader_id)::jsonb,
    'email',
    v_leader_id,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO profiles (id, email, role, program_id)
  VALUES (v_leader_id, 'Program.Director@ThreeDungeons.com', 'leader', v_program_id)
  ON CONFLICT (id) DO UPDATE SET role = 'leader', program_id = v_program_id;

  -- 2. Super Admin: Vivek.Medepalli@ThreeDungeons.com
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  )
  VALUES (
    v_super_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'Vivek.Medepalli@ThreeDungeons.com',
    v_encrypted_pw,
    NOW(),
    '',
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET confirmation_token = COALESCE(auth.users.confirmation_token, '');

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES (
    v_super_id,
    v_super_id,
    format('{"sub": "%s", "email": "Vivek.Medepalli@ThreeDungeons.com"}', v_super_id)::jsonb,
    'email',
    v_super_id,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO profiles (id, email, role, program_id)
  VALUES (v_super_id, 'Vivek.Medepalli@ThreeDungeons.com', 'super_admin', NULL)
  ON CONFLICT (id) DO UPDATE SET role = 'super_admin', program_id = NULL;
END $$;

-- ========== COHORTS ==========
INSERT INTO cohorts (id, program_id, name)
VALUES
  ('d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'PGY1'),
  ('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'PGY2'),
  ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'PGY3')
ON CONFLICT (id) DO NOTHING;

-- ========== RESIDENTS (9 learners: 3 per cohort) ==========
-- PGY1: Alex Chen, Maya Johnson, Jordan Kim
-- PGY2: Sam Rivera, Taylor Brooks, Casey Morgan
-- PGY3: Quinn Davis, Riley Lee, Avery Smith
-- Password for all: 'password'
INSERT INTO residents (id, program_id, email, password_hash, display_name, active)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Alex.Chen@ThreeDungeons.com', crypt('password', gen_salt('bf')), 'Alex Chen', true),
  ('22222222-2222-4222-8222-222222222222', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Maya.Johnson@ThreeDungeons.com', crypt('password', gen_salt('bf')), 'Maya Johnson', true),
  ('33333333-3333-4333-8333-333333333333', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Jordan.Kim@ThreeDungeons.com', crypt('password', gen_salt('bf')), 'Jordan Kim', true),
  ('44444444-4444-4444-8444-444444444444', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Sam.Rivera@ThreeDungeons.com', crypt('password', gen_salt('bf')), 'Sam Rivera', true),
  ('55555555-5555-4555-8555-555555555555', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Taylor.Brooks@ThreeDungeons.com', crypt('password', gen_salt('bf')), 'Taylor Brooks', true),
  ('66666666-6666-4666-8666-666666666666', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Casey.Morgan@ThreeDungeons.com', crypt('password', gen_salt('bf')), 'Casey Morgan', true),
  ('77777777-7777-4777-8777-777777777777', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Quinn.Davis@ThreeDungeons.com', crypt('password', gen_salt('bf')), 'Quinn Davis', true),
  ('88888888-8888-4888-8888-888888888888', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Riley.Lee@ThreeDungeons.com', crypt('password', gen_salt('bf')), 'Riley Lee', true),
  ('99999999-9999-4999-8999-999999999999', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Avery.Smith@ThreeDungeons.com', crypt('password', gen_salt('bf')), 'Avery Smith', true)
ON CONFLICT (program_id, email) DO NOTHING;

-- Link residents to cohorts
INSERT INTO resident_cohorts (resident_id, cohort_id)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a'),
  ('22222222-2222-4222-8222-222222222222', 'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a'),
  ('33333333-3333-4333-8333-333333333333', 'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a'),
  ('44444444-4444-4444-8444-444444444444', 'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b'),
  ('55555555-5555-4555-8555-555555555555', 'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b'),
  ('66666666-6666-4666-8666-666666666666', 'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b'),
  ('77777777-7777-4777-8777-777777777777', 'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c'),
  ('88888888-8888-4888-8888-888888888888', 'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c'),
  ('99999999-9999-4999-8999-999999999999', 'f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c')
ON CONFLICT (resident_id, cohort_id) DO NOTHING;
