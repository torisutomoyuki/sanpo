-- =============================================
-- Saruku MVP: テーブル作成 + RLSポリシー
-- Supabase SQL Editorで実行してください
-- =============================================

-- coursesテーブル
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  cover_image_url text,
  is_public boolean DEFAULT false NOT NULL,
  total_distance numeric,
  estimated_minutes integer,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- spotsテーブル
CREATE TABLE IF NOT EXISTS public.spots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  comment text,
  image_url text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON public.courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_public ON public.courses(is_public);
CREATE INDEX IF NOT EXISTS idx_spots_course_id ON public.spots(course_id);

-- RLS有効化
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;

-- =============================================
-- courses RLSポリシー
-- =============================================

-- 公開コースは誰でも閲覧可
CREATE POLICY "Public courses are viewable by everyone"
  ON public.courses FOR SELECT
  USING (is_public = true);

-- 自分のコースは非公開でも閲覧可
CREATE POLICY "Users can view own courses"
  ON public.courses FOR SELECT
  USING (auth.uid() = user_id);

-- 認証ユーザーはコース作成可
CREATE POLICY "Authenticated users can create courses"
  ON public.courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のコースのみ更新可
CREATE POLICY "Users can update own courses"
  ON public.courses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 自分のコースのみ削除可
CREATE POLICY "Users can delete own courses"
  ON public.courses FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- spots RLSポリシー
-- =============================================

-- 公開コースのスポットは誰でも閲覧可
CREATE POLICY "Spots of public courses are viewable"
  ON public.spots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = spots.course_id
      AND (courses.is_public = true OR courses.user_id = auth.uid())
    )
  );

-- コース作成者はスポット追加可
CREATE POLICY "Course owners can insert spots"
  ON public.spots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = spots.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- コース作成者はスポット更新可
CREATE POLICY "Course owners can update spots"
  ON public.spots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = spots.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- コース作成者はスポット削除可
CREATE POLICY "Course owners can delete spots"
  ON public.spots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE courses.id = spots.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- =============================================
-- Storage: images バケット
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 認証ユーザーはアップロード可
CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');

-- 画像は誰でも閲覧可
CREATE POLICY "Images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');
