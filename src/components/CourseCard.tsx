import Link from "next/link";
import type { Course } from "@/lib/types";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/courses/${course.id}`} className="block">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        {course.cover_image_url ? (
          <img
            src={course.cover_image_url}
            alt={course.title}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
            <span className="text-4xl">🚶</span>
          </div>
        )}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
            {course.title}
          </h3>
          {course.description && (
            <p className="text-sm text-gray-500 mb-2 line-clamp-2">
              {course.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {course.author_name && <span>{course.author_name}</span>}
            {course.spots_count != null && (
              <span>{course.spots_count} スポット</span>
            )}
            {course.total_distance != null && (
              <span>{(course.total_distance / 1000).toFixed(1)} km</span>
            )}
            {course.estimated_minutes != null && (
              <span>約 {course.estimated_minutes} 分</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
