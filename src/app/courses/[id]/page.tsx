import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Course, Spot } from "@/lib/types";
import CourseDetailClient from "./CourseDetailClient";

type Props = { params: Promise<{ id: string }> };

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (!course) notFound();

  const { data: spots } = await supabase
    .from("spots")
    .select("*")
    .eq("course_id", id)
    .order("order_index", { ascending: true });

  return (
    <CourseDetailClient
      course={course as Course}
      spots={(spots as Spot[]) || []}
    />
  );
}
