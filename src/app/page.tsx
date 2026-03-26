import { createClient } from "@/lib/supabase/server";
import CourseCard from "@/components/CourseCard";
import type { Course } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        みんなのまちあるき
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        公開されたコースを歩いてみよう
      </p>

      {courses && courses.length > 0 ? (
        <div className="space-y-4">
          {(courses as Course[]).map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🗺️</p>
          <p className="text-gray-500 mb-2">まだコースがありません</p>
          <p className="text-sm text-gray-400">
            最初のまちあるきコースを作ってみましょう
          </p>
        </div>
      )}
    </div>
  );
}
