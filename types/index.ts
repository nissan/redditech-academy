export type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type LessonContentType =
  | "text"
  | "code"
  | "diagram"
  | "interactive"
  | "video";

export interface LessonContent {
  type: LessonContentType;
  title?: string;
  content?: string;
  code?: string;
  language?: string;
  caption?: string;
}
