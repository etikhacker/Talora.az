-- Synthetic PostgreSQL 17 fixture for curriculum seed regression.
-- No production data, no Auth credentials, no storage access.
CREATE TYPE public.task_difficulty AS ENUM ('beginner','intermediate','advanced');
CREATE TYPE public.internship_status AS ENUM ('draft','published','closed','archived');
CREATE TYPE public.task_status AS ENUM ('draft','published','archived');
CREATE TYPE public.submission_type AS ENUM ('text','link','github','file','multiple');
CREATE TABLE public.internships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 title text NOT NULL,
 slug text NOT NULL UNIQUE,
 short_description text,
 description text,
 category text,
 duration_weeks integer CHECK (duration_weeks IS NULL OR duration_weeks>0),
 difficulty public.task_difficulty,
 skills text[] NOT NULL DEFAULT '{}',
 requirements text[] NOT NULL DEFAULT '{}',
 responsibilities text[] NOT NULL DEFAULT '{}',
 benefits text[] NOT NULL DEFAULT '{}',
 max_students integer CHECK (max_students IS NULL OR max_students>0),
 status public.internship_status NOT NULL DEFAULT 'draft',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.internship_tasks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 internship_id uuid NOT NULL REFERENCES public.internships(id) ON DELETE CASCADE,
 title text NOT NULL,
 description text,
 instructions text,
 week_number integer NOT NULL CHECK (week_number>0),
 task_number integer NOT NULL CHECK (task_number>0),
 difficulty public.task_difficulty NOT NULL DEFAULT 'beginner',
 submission_type public.submission_type NOT NULL DEFAULT 'text',
 deadline timestamptz,
 is_required boolean NOT NULL DEFAULT true,
 status public.task_status NOT NULL DEFAULT 'draft',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (internship_id,week_number,task_number)
);
