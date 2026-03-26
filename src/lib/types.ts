export type Course = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_public: boolean;
  total_distance: number | null;
  estimated_minutes: number | null;
  created_at: string;
  author_name?: string;
  spots_count?: number;
};

export type Spot = {
  id: string;
  course_id: string;
  title: string;
  comment: string | null;
  image_url: string | null;
  lat: number;
  lng: number;
  order_index: number;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      courses: {
        Row: Course;
        Insert: Omit<Course, "id" | "created_at" | "author_name" | "spots_count">;
        Update: Partial<Omit<Course, "id" | "created_at">>;
      };
      spots: {
        Row: Spot;
        Insert: Omit<Spot, "id" | "created_at">;
        Update: Partial<Omit<Spot, "id" | "created_at">>;
      };
    };
  };
};
