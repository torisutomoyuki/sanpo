"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Spot } from "@/lib/types";

type SpotEditorProps = {
  spot: Partial<Spot> & { lat: number; lng: number };
  courseId: string;
  orderIndex: number;
  onSaved: (spot: Spot) => void;
  onCancel: () => void;
};

export default function SpotEditor({
  spot,
  courseId,
  orderIndex,
  onSaved,
  onCancel,
}: SpotEditorProps) {
  const [title, setTitle] = useState(spot.title || "");
  const [comment, setComment] = useState(spot.comment || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    let image_url: string | null = spot.image_url || null;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `spots/${courseId}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("images")
        .upload(path, imageFile);
      if (!error) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("images").getPublicUrl(path);
        image_url = publicUrl;
      }
    }

    if (spot.id) {
      const { data, error } = await supabase
        .from("spots")
        .update({ title, comment, image_url })
        .eq("id", spot.id)
        .select()
        .single();
      if (!error && data) onSaved(data as Spot);
    } else {
      const { data, error } = await supabase
        .from("spots")
        .insert({
          course_id: courseId,
          title,
          comment,
          image_url,
          lat: spot.lat,
          lng: spot.lng,
          order_index: orderIndex,
        })
        .select()
        .single();
      if (!error && data) onSaved(data as Spot);
    }

    setSaving(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="text-xs text-gray-400 mb-1">
        📍 {spot.lat.toFixed(5)}, {spot.lng.toFixed(5)}
      </div>
      <input
        type="text"
        placeholder="スポット名"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
      <textarea
        placeholder="コメント（任意）"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
      <label className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-600 cursor-pointer active:bg-gray-50">
        📷 写真を追加
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        {imageFile && (
          <span className="text-orange-600 font-medium ml-auto truncate max-w-[140px]">
            {imageFile.name}
          </span>
        )}
      </label>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="flex-1 bg-orange-600 text-white text-base py-3 rounded-xl font-medium disabled:opacity-50 active:bg-orange-700"
        >
          {saving ? "保存中..." : "保存"}
        </button>
        <button
          onClick={onCancel}
          className="px-5 text-base text-gray-500 border border-gray-300 rounded-xl active:bg-gray-50"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
