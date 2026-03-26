"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CourseMap from "@/components/CourseMap";
import SpotEditor from "@/components/SpotEditor";
import type { Spot } from "@/lib/types";

type Mode = "manual" | "recording";
type PendingSpot = { lat: number; lng: number };

export default function NewCoursePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<Mode>("manual");
  const [spots, setSpots] = useState<Spot[]>([]);
  const [pendingSpot, setPendingSpot] = useState<PendingSpot | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"info" | "spots">("info");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Get user's current location on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // Silently fall back to default (Nagasaki)
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  // Create course in DB when moving to spots step
  const handleCreateCourse = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { data, error } = await supabase
      .from("courses")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        is_public: false,
        cover_image_url: null,
        total_distance: null,
        estimated_minutes: null,
      })
      .select()
      .single();

    if (!error && data) {
      setCourseId(data.id);
      setStep("spots");
    }
    setSaving(false);
  };

  // GPS recording
  const startRecording = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const handleAddCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPendingSpot({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => alert("位置情報を取得できませんでした: " + err.message),
      { enableHighAccuracy: true }
    );
  };

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (mode === "manual") {
        setPendingSpot({ lat, lng });
      }
    },
    [mode]
  );

  const handleSpotSaved = (spot: Spot) => {
    setSpots((prev) => [...prev, spot]);
    setPendingSpot(null);
  };

  // Auto-scroll to editor when pendingSpot is set
  useEffect(() => {
    if (pendingSpot && editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [pendingSpot]);

  // Publish course
  const handlePublish = async () => {
    if (!courseId) return;
    setSaving(true);

    let totalDistance = 0;
    for (let i = 1; i < spots.length; i++) {
      totalDistance += haversine(
        spots[i - 1].lat,
        spots[i - 1].lng,
        spots[i].lat,
        spots[i].lng
      );
    }

    const estimatedMinutes = Math.round(totalDistance / 80);

    await supabase
      .from("courses")
      .update({
        is_public: true,
        total_distance: Math.round(totalDistance),
        estimated_minutes: estimatedMinutes || null,
      })
      .eq("id", courseId);

    setSaving(false);
    router.push(`/courses/${courseId}`);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  if (step === "info") {
    return (
      <div className="px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          新しいコースを作成
        </h1>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              コース名
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 長崎坂道さんぽ"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="どんなまちあるきコース？"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作成モード
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode("recording")}
                className={`p-4 rounded-lg border text-left ${
                  mode === "recording"
                    ? "border-orange-600 bg-orange-50"
                    : "border-gray-200"
                }`}
              >
                <div className="font-bold mb-1 text-base">📍 記録モード</div>
                <div className="text-sm text-gray-500">
                  歩きながらスポットを追加
                </div>
              </button>
              <button
                onClick={() => setMode("manual")}
                className={`p-4 rounded-lg border text-left ${
                  mode === "manual"
                    ? "border-orange-600 bg-orange-50"
                    : "border-gray-200"
                }`}
              >
                <div className="font-bold mb-1 text-base">🗺️ 手動モード</div>
                <div className="text-sm text-gray-500">
                  地図をタップして追加
                </div>
              </button>
            </div>
          </div>
          <button
            onClick={handleCreateCourse}
            disabled={!title.trim() || saving}
            className="w-full bg-orange-600 text-white py-3.5 rounded-lg font-medium text-base disabled:opacity-50"
          >
            {saving ? "作成中..." : "次へ：スポットを追加"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)]">
      {/* Map area - takes up most of the screen */}
      <div className="relative flex-1 min-h-0">
        <CourseMap
          spots={spots}
          pendingSpot={pendingSpot}
          center={userLocation ?? undefined}
          className="w-full h-full"
          onMapClick={mode === "manual" ? handleMapClick : undefined}
          interactive
          showSearch
        />

        {/* Floating header overlay - below search bar */}
        <div className="absolute top-14 left-3 right-3 z-[5]">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
            <h1 className="text-sm font-bold text-gray-900 truncate">
              {title}
            </h1>
            <p className="text-xs text-gray-500">
              {mode === "manual"
                ? `地図をタップしてスポットを追加（${spots.length}件）`
                : `現在地を追加ボタンでスポットを記録（${spots.length}件）`}
            </p>
          </div>
        </div>

        {/* Recording mode: floating buttons */}
        {mode === "recording" && (
          <div className="absolute bottom-4 left-4 right-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-full bg-red-500 text-white py-3.5 rounded-xl font-medium text-base shadow-lg"
              >
                記録を開始
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleAddCurrentLocation}
                  className="flex-1 bg-orange-600 text-white py-3.5 rounded-xl font-medium text-base shadow-lg"
                >
                  📍 現在地を追加
                </button>
                <button
                  onClick={stopRecording}
                  className="px-5 bg-white text-gray-700 py-3.5 rounded-xl font-medium text-base shadow-lg"
                >
                  停止
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual mode: floating hint when no spots and no pending */}
        {mode === "manual" && spots.length === 0 && !pendingSpot && (
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <div className="bg-orange-600 text-white text-center py-3 rounded-xl text-sm font-medium shadow-lg animate-pulse">
              地図をタップしてスポットを追加しましょう
            </div>
          </div>
        )}
      </div>

      {/* Bottom panel - scrollable */}
      <div className="bg-white border-t border-gray-200 overflow-y-auto max-h-[45dvh]">
        <div className="px-4 py-3 space-y-3">
          {/* SpotEditor */}
          {pendingSpot && courseId && (
            <div ref={editorRef}>
              <SpotEditor
                spot={pendingSpot}
                courseId={courseId}
                orderIndex={spots.length}
                onSaved={handleSpotSaved}
                onCancel={() => setPendingSpot(null)}
              />
            </div>
          )}

          {/* Spot list */}
          {spots.length > 0 && !pendingSpot && (
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-gray-700">
                スポット ({spots.length})
              </h2>
              {spots.map((spot, i) => (
                <div
                  key={spot.id}
                  className="bg-gray-50 rounded-lg p-3 flex items-center gap-3"
                >
                  <span className="w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium truncate">
                    {spot.title}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Publish button */}
          {spots.length >= 2 && !pendingSpot && (
            <button
              onClick={handlePublish}
              disabled={saving}
              className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-medium text-base disabled:opacity-50"
            >
              {saving ? "公開中..." : "コースを公開する"}
            </button>
          )}

          {/* Empty state for bottom panel when no pending and no spots */}
          {spots.length === 0 && !pendingSpot && (
            <p className="text-center text-sm text-gray-400 py-2">
              まだスポットがありません
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Haversine formula for distance in meters
function haversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
