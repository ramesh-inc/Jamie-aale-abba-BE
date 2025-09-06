export interface StoryAttachment {
  id: number;
  file_name: string;
  file_url: string;
  file_type: 'image' | 'video' | 'document';
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface StoryComment {
  id: number;
  comment_text: string;
  user_name: string;
  user_type: 'teacher' | 'parent' | 'admin';
  parent_comment?: number;
  replies: StoryComment[];
  can_edit: boolean;
  can_delete: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoryLike {
  id: number;
  user_name: string;
  created_at: string;
}

export interface Story {
  id: number;
  title: string;
  content: string;
  story_type: 'photo' | 'video' | 'file' | 'journal';
  teacher_name: string;
  attachments: StoryAttachment[];
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
  target_classes_names: string[];
  can_edit: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoryDetail extends Story {
  likes: StoryLike[];
  comments: StoryComment[];
}

export interface StoryCreateData {
  title: string;
  content: string;
  story_type: 'photo' | 'video' | 'file' | 'journal';
  target_class_ids?: number[];
  attachments?: File[];
}

export interface StoryUpdateData {
  title?: string;
  content?: string;
  target_class_ids?: number[];
}

export interface CommentCreateData {
  comment_text: string;
  parent_comment?: number;
}

export interface CommentUpdateData {
  comment_text: string;
}

export interface TeacherClass {
  id: number;
  class_name: string;
  class_code: string;
  age_group: string;
  capacity: number;
  room_number: string;
  academic_year: string;
}

export interface LikeResponse {
  message: string;
  liked: boolean;
  likes_count: number;
}

// File validation types
export interface FileValidation {
  maxSize: number; // in bytes
  allowedTypes: string[];
  maxFiles: number;
}

export const FILE_VALIDATION: Record<string, FileValidation> = {
  photo: {
    maxSize: 3 * 1024 * 1024, // 3MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFiles: 5,
  },
  video: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['video/mp4', 'video/avi', 'video/mov', 'video/webm'],
    maxFiles: 5,
  },
  file: {
    maxSize: 3 * 1024 * 1024, // 3MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/rtf',
      'image/jpeg',
      'image/png',
      'image/gif',
    ],
    maxFiles: 5,
  },
};

export interface FileValidationError {
  file: string;
  errors: string[];
}

// Pagination types
export interface PaginationInfo {
  count: number;
  next: string | null;
  previous: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}