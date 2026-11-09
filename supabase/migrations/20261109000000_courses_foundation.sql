-- Talora Courses MVP foundation; additive only. Apply on staging first.
-- Existing internships.category is preserved during normalization.
CREATE TABLE public.categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 name_az text NOT NULL, name_en text NOT NULL,
 parent_id uuid REFERENCES public.categories(id) ON DELETE RESTRICT,
 is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (id IS DISTINCT FROM parent_id)
);
CREATE INDEX categories_parent_idx ON public.categories(parent_id);
INSERT INTO public.categories(slug,name_az,name_en) VALUES
('software-technology','Proqram təminatı və texnologiya','Software & Technology'),
('ai-data','Süni intellekt və verilənlər','AI & Data'),
('business-management','Biznes və idarəetmə','Business & Management'),
('marketing-communication','Marketinq və kommunikasiya','Marketing & Communication'),
('design-creativity','Dizayn və yaradıcılıq','Design & Creativity'),
('education-learning','Təhsil və öyrənmə','Education & Learning');
INSERT INTO public.categories(slug,name_az,name_en,parent_id)
SELECT v.slug,v.name_az,v.name_en,p.id
FROM (VALUES
('frontend','Frontend Development','Frontend Development','software-technology'),
('backend','Backend Development','Backend Development','software-technology'),
('devops','DevOps','DevOps','software-technology'),
('cybersecurity','Kibertəhlükəsizlik','Cybersecurity','software-technology'),
('mobile-development','Mobil tətbiqlər','Mobile Development','software-technology'),
('ai-engineering','AI Engineering','AI Engineering','ai-data'),
('data-science','Data Science','Data Science','ai-data'),
('data-analytics','Data analitikası','Data Analytics','ai-data'),
('automation','Avtomatlaşdırma','Automation','ai-data'),
('prompt-engineering','Prompt Engineering','Prompt Engineering','ai-data'),
('business-analysis','Biznes analitikası','Business Analysis','business-management'),
('digital-marketing','Rəqəmsal marketinq','Digital Marketing','marketing-communication'),
('ui-ux-design','UI/UX dizayn','UI/UX Design','design-creativity'),
('graphic-design','Qrafik dizayn','Graphic Design','design-creativity'),
('instructional-design','Tədris dizaynı','Instructional Design','education-learning')
) AS v(slug,name_az,name_en,parent_slug)
JOIN public.categories p ON p.slug=v.parent_slug;

ALTER TABLE public.internships ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
CREATE INDEX internships_category_id_idx ON public.internships(category_id);
UPDATE public.internships i SET category_id=c.id
FROM public.categories c
WHERE i.category_id IS NULL AND c.slug=CASE i.category
 WHEN 'AI' THEN 'ai-engineering'
 WHEN 'Automation' THEN 'automation'
 WHEN 'Backend' THEN 'backend'
 WHEN 'Cybersecurity' THEN 'cybersecurity'
 WHEN 'Data' THEN 'data-analytics'
 WHEN 'Frontend' THEN 'frontend'
 WHEN 'Mobile Development' THEN 'mobile-development'
 WHEN 'UI/UX Design' THEN 'ui-ux-design'
 ELSE NULL END;

CREATE TABLE public.courses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 title text NOT NULL CHECK (length(trim(title))>0),
 short_description text NOT NULL DEFAULT '',
 description text NOT NULL DEFAULT '',
 category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
 level text NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner','intermediate','advanced')),
 language_code text NOT NULL DEFAULT 'en' CHECK (language_code IN ('az','en')),
 duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes>0),
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
 created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX courses_status_created_idx ON public.courses(status,created_at DESC);
CREATE INDEX courses_category_idx ON public.courses(category_id);

CREATE TABLE public.course_modules (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
 title text NOT NULL CHECK (length(trim(title))>0),
 description text NOT NULL DEFAULT '',
 position integer NOT NULL CHECK (position>0),
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (course_id,position)
);
CREATE INDEX course_modules_course_idx ON public.course_modules(course_id);

CREATE TABLE public.course_lessons (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 module_id uuid NOT NULL REFERENCES public.course_modules(id) ON DELETE RESTRICT,
 title text NOT NULL CHECK (length(trim(title))>0),
 lesson_type text NOT NULL DEFAULT 'text' CHECK (lesson_type IN ('text','video','link')),
 content_md text NOT NULL DEFAULT '',
 resource_url text CHECK (resource_url IS NULL OR resource_url ~ '^https://'),
 position integer NOT NULL CHECK (position>0),
 is_required boolean NOT NULL DEFAULT true,
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (module_id,position)
);
CREATE INDEX course_lessons_module_idx ON public.course_lessons(module_id);

CREATE TABLE public.course_enrollments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
 student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
 status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
 enrolled_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (course_id,student_id)
);
CREATE INDEX course_enrollments_student_idx ON public.course_enrollments(student_id);

CREATE TABLE public.lesson_progress (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 enrollment_id uuid NOT NULL REFERENCES public.course_enrollments(id) ON DELETE RESTRICT,
 lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE RESTRICT,
 completed_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (enrollment_id,lesson_id)
);
CREATE INDEX lesson_progress_lesson_idx ON public.lesson_progress(lesson_id);

-- Existing public.handle_updated_at() is absent on the inspected live DB.
CREATE FUNCTION private.course_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN NEW.updated_at:=now(); RETURN NEW; END;
$$;
REVOKE ALL ON FUNCTION private.course_touch_updated_at() FROM PUBLIC;
CREATE TRIGGER categories_touch BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION private.course_touch_updated_at();
CREATE TRIGGER courses_touch BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION private.course_touch_updated_at();
CREATE TRIGGER modules_touch BEFORE UPDATE ON public.course_modules FOR EACH ROW EXECUTE FUNCTION private.course_touch_updated_at();
CREATE TRIGGER lessons_touch BEFORE UPDATE ON public.course_lessons FOR EACH ROW EXECUTE FUNCTION private.course_touch_updated_at();
CREATE TRIGGER enrollments_touch BEFORE UPDATE ON public.course_enrollments FOR EACH ROW EXECUTE FUNCTION private.course_touch_updated_at();

-- Enforce that progress.lesson_id belongs to progress.enrollment_id's course.
CREATE FUNCTION private.course_validate_progress() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM public.course_enrollments e
  JOIN public.course_modules m ON m.course_id=e.course_id
  JOIN public.course_lessons l ON l.module_id=m.id
  WHERE e.id=NEW.enrollment_id AND l.id=NEW.lesson_id
 ) THEN
  RAISE EXCEPTION 'Lesson does not belong to enrollment course' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.course_validate_progress() FROM PUBLIC;
CREATE TRIGGER lesson_progress_validate BEFORE INSERT OR UPDATE ON public.lesson_progress
 FOR EACH ROW EXECUTE FUNCTION private.course_validate_progress();

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.categories,public.courses,public.course_modules,public.course_lessons,public.course_enrollments,public.lesson_progress FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.categories,public.courses,public.course_modules TO anon,authenticated;
GRANT SELECT ON public.course_lessons,public.course_enrollments,public.lesson_progress TO authenticated;
GRANT INSERT,UPDATE,DELETE ON public.categories,public.courses,public.course_modules,public.course_lessons TO authenticated;
GRANT INSERT (course_id,student_id) ON public.course_enrollments TO authenticated;
GRANT UPDATE (status,completed_at) ON public.course_enrollments TO authenticated;
GRANT INSERT (enrollment_id,lesson_id) ON public.lesson_progress TO authenticated;

CREATE POLICY categories_anon_read ON public.categories FOR SELECT TO anon USING (is_active);
CREATE POLICY categories_auth_read ON public.categories FOR SELECT TO authenticated USING (is_active OR (SELECT private.is_admin()));
CREATE POLICY categories_admin_insert ON public.categories FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY categories_admin_update ON public.categories FOR UPDATE TO authenticated USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY categories_admin_delete ON public.categories FOR DELETE TO authenticated USING ((SELECT private.is_admin()));

CREATE POLICY courses_anon_read ON public.courses FOR SELECT TO anon USING (status='published');
CREATE POLICY courses_auth_read ON public.courses FOR SELECT TO authenticated USING (status='published' OR (SELECT private.is_admin()));
CREATE POLICY courses_admin_insert ON public.courses FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY courses_admin_update ON public.courses FOR UPDATE TO authenticated USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY courses_admin_delete ON public.courses FOR DELETE TO authenticated USING ((SELECT private.is_admin()));

CREATE POLICY modules_anon_read ON public.course_modules FOR SELECT TO anon USING (
 status='published' AND EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.status='published'));
CREATE POLICY modules_auth_read ON public.course_modules FOR SELECT TO authenticated USING (
 (SELECT private.is_admin()) OR (status='published' AND EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.status='published')));
CREATE POLICY modules_admin_insert ON public.course_modules FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY modules_admin_update ON public.course_modules FOR UPDATE TO authenticated USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY modules_admin_delete ON public.course_modules FOR DELETE TO authenticated USING ((SELECT private.is_admin()));

-- Lesson content is accessible only after enrollment; anonymous access is denied.
CREATE POLICY lessons_read ON public.course_lessons FOR SELECT TO authenticated USING (
 (SELECT private.is_admin()) OR (status='published' AND EXISTS(
  SELECT 1 FROM public.course_modules m
  JOIN public.courses c ON c.id=m.course_id
  JOIN public.course_enrollments e ON e.course_id=c.id
  JOIN public.profiles p ON p.id=e.student_id
  WHERE m.id=module_id AND m.status='published' AND c.status='published'
   AND e.status IN ('active','completed') AND p.user_id=(SELECT auth.uid())
 )));
CREATE POLICY lessons_admin_insert ON public.course_lessons FOR INSERT TO authenticated WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY lessons_admin_update ON public.course_lessons FOR UPDATE TO authenticated USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY lessons_admin_delete ON public.course_lessons FOR DELETE TO authenticated USING ((SELECT private.is_admin()));

CREATE POLICY course_enrollments_read ON public.course_enrollments FOR SELECT TO authenticated USING (
 (SELECT private.is_admin()) OR student_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id=(SELECT auth.uid())));
CREATE POLICY course_enrollments_student_insert ON public.course_enrollments FOR INSERT TO authenticated WITH CHECK (
 NOT (SELECT private.is_admin()) AND status='active' AND completed_at IS NULL
 AND student_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id=(SELECT auth.uid()))
 AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.status='published'));
CREATE POLICY course_enrollments_admin_update ON public.course_enrollments FOR UPDATE TO authenticated
 USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));

CREATE POLICY lesson_progress_read ON public.lesson_progress FOR SELECT TO authenticated USING (
 (SELECT private.is_admin()) OR EXISTS(
 SELECT 1 FROM public.course_enrollments e
 JOIN public.profiles p ON p.id=e.student_id
 WHERE e.id=enrollment_id AND p.user_id=(SELECT auth.uid())));
CREATE POLICY lesson_progress_student_insert ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK (
 EXISTS(SELECT 1 FROM public.course_enrollments e
 JOIN public.profiles p ON p.id=e.student_id
 JOIN public.course_modules m ON m.course_id=e.course_id
 JOIN public.course_lessons l ON l.module_id=m.id
 WHERE e.id=enrollment_id AND l.id=lesson_id AND p.user_id=(SELECT auth.uid())
 AND e.status='active' AND m.status='published' AND l.status='published'));

COMMENT ON COLUMN public.internships.category_id IS 'Optional normalization: legacy category text remains unchanged.';
COMMENT ON TABLE public.lesson_progress IS 'Learner-declared completion; no verified video watch tracking in MVP.';
