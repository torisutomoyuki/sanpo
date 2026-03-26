"use client";

import { useState } from "react";
import type { Course, Spot } from "@/lib/types";
import CourseMap from "@/components/CourseMap";

export default function CourseDetailClient({
  course,
  spots,
}: {
  course: Course;
  spots: Spot[];
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: course.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenGoogleMaps = () => {
    if (spots.length === 0) return;
    const path = spots.map((s) => `${s.lat},${s.lng}`).join("/");
    const url = `https://www.google.com/maps/dir/${path}`;
    window.open(url, "_blank");
  };

  return (
    <div className="pb-8">
      {course.cover_image_url ? (
        <img
          src={course.cover_image_url}
          alt={course.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
          <span className="text-6xl">🚶</span>
        </div>
      )}

      <div className="px-4 -mt-4 relative">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-sm text-gray-600 mb-3">{course.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
            {course.total_distance != null && (
              <span>{(course.total_distance / 1000).toFixed(1)} km</span>
            )}
            {course.estimated_minutes != null && (
              <span>約 {course.estimated_minutes} 分</span>
            )}
            <span>{spots.length} スポット</span>
          </div>
          <button
            onClick={handleShare}
            className="w-full border border-orange-600 text-orange-600 text-sm py-2 rounded-lg font-medium"
          >
            {copied ? "URLをコピーしました!" : "コースをシェア"}
          </button>
        </div>

        {spots.length > 0 && (
          <CourseMap spots={spots} className="w-full h-64 rounded-xl overflow-hidden mb-4" />
        )}

        <div className="space-y-3">
          {spots.map((spot, i) => (
            <div
              key={spot.id}
              className="bg-white rounded-xl shadow-sm p-4 flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm">
                  {spot.title}
                </h3>
                {spot.comment && (
                  <p className="text-xs text-gray-500 mt-1">{spot.comment}</p>
                )}
                {spot.image_url && (
                  <img
                    src={spot.image_url}
                    alt={spot.title}
                    className="mt-2 rounded-lg w-full h-32 object-cover"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {spots.length >= 2 && (
          <button
            onClick={handleOpenGoogleMaps}
            className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-medium text-base flex items-center justify-center gap-2 shadow-md active:bg-blue-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742z"
                clipRule="evenodd"
              />
            </svg>
            Google Maps で歩く
          </button>
        )}
      </div>
    </div>
  );
}
