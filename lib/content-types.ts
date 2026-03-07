/**
 * TypeScript type definitions for MDX-based content
 */

export interface LessonFrontmatter {
  title: string;
  description: string;
  slug: string;
  duration: number; // in minutes
  order: number;
  keyTakeaways: string[];
  prerequisites?: string[];
}

export interface ModuleMetadata {
  id: string;
  slug: string;
  order: number;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "expert" | "advanced";
  estimatedHours: number;
  badge: {
    name: string;
    icon: string;
    description: string;
  };
  learningObjectives: string[];
  prerequisiteModules: string[];
  requiresPassword?: boolean;
  password?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizMetadata {
  passingScore: number;
  questions: QuizQuestion[];
}

export interface Lesson {
  slug: string;
  moduleSlug: string;
  frontmatter: LessonFrontmatter;
  content: string;
  Component?: React.ComponentType;
}

export interface Module {
  metadata: ModuleMetadata;
  lessons: Lesson[];
  quiz: QuizMetadata;
}

export interface CourseStructure {
  modules: Module[];
  totalLessons: number;
  totalHours: number;
}

export interface CourseMetadata {
  id: string;
  slug: string;
  title: string;
  description: string;
  tagline: string;
  icon: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  tags: string[];
  badge: {
    name: string;
    icon: string;
    description: string;
  };
  author: string;
  version: string;
  free: boolean;
  comingSoon?: boolean;
}
