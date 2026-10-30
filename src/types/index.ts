export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string;
  display_name: string;
  matric_number: string;
  avatar_url: string;
  role: UserRole;
  bio: string;
  department: string;
  cover_photo_url: string;
  status: string;
  created_at: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  image_url: string;
  category: string;
  author_id: string;
  published_at: string;
}

export interface LibraryResource {
  id: string;
  title: string;
  category: string;
  type: 'pdf' | 'document' | 'link' | 'video';
  url: string;
  description: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

export interface EventItem {
  id: string;
  title: string;
  event_date: string | null;
  event_time: string;
  venue: string;
  description: string;
  image_url: string;
  created_at: string;
}

export interface CalendarEntry {
  id: string;
  title: string;
  entry_date: string;
  type: 'event' | 'holiday' | 'exam' | 'deadline' | 'meeting';
  description: string;
}

export interface Opportunity {
  id: string;
  title: string;
  type: 'scholarship' | 'internship' | 'volunteer' | 'competition' | 'grant';
  deadline: string | null;
  description: string;
  link: string;
  created_at: string;
}

export interface SUGMember {
  id: string;
  name: string;
  position: string;
  photo_url: string;
  term: string;
  status: 'current' | 'past';
  created_at: string;
}

export interface AnonymousSubmission {
  id: string;
  category: string;
  message: string;
  reviewed: boolean;
  created_at: string;
  tracking_code: string;
  status: 'submitted' | 'under_review' | 'resolved' | 'closed';
  admin_response: string;
}

export interface Conversation {
  id: string;
  name: string;
  type: 'dm' | 'group' | 'broadcast';
  created_by: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'news' | 'event' | 'message' | 'opportunity' | 'system';
  read: boolean;
  link_screen: string;
  link_params: Record<string, unknown>;
  created_at: string;
}

export type MediaType = 'image' | 'video' | 'document' | 'audio';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  body: string;
  read: boolean;
  created_at: string;
  reply_to_id: string | null;
  forwarded_from_id: string | null;
  deleted_at: string | null;
  media_url: string | null;
  media_type: MediaType | null;
  file_name: string | null;
  file_size: number | null;
  deleted_for: string[];
  read_by: string[];
  edited_at?: string | null;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export type EngagementTarget = 'news' | 'event';

export interface Like {
  id: string;
  user_id: string;
  target_type: EngagementTarget;
  target_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  target_type: EngagementTarget;
  target_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  author_name?: string;
  author_role?: string;
  profile?: Profile;
  replies?: Comment[];
}

export interface Bookmark {
  id: string;
  user_id: string;
  target_type: EngagementTarget;
  target_id: string;
  created_at: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  is_active: boolean;
  created_at: string;
}

export interface StudySubject {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface StudyQuestion {
  id: string;
  subject_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface QuizAnswerDetail {
  question_id: string;
  question: string;
  options: string[];
  correct_index: number;
  selected_index: number | null;
  explanation: string;
}

export interface QuizResult {
  score: number;
  total: number;
  details: QuizAnswerDetail[];
}

export interface StudyAttempt {
  id: string;
  subject_id: string;
  score: number;
  total: number;
  created_at: string;
  study_subjects: { name: string } | null;
}

export type ScreenName =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'register'
  | 'forgot'
  | 'home'
  | 'news'
  | 'newsDetail'
  | 'study'
  | 'studyQuiz'
  | 'studyAdmin'
  | 'studyAdminSubject'
  | 'library'
  | 'libraryDetail'
  | 'events'
  | 'eventDetail'
  | 'opportunities'
  | 'opportunityDetail'
  | 'calendar'
  | 'sug'
  | 'anonymous'
  | 'connect'
  | 'chat'
  | 'publicProfile'
  | 'profile'
  | 'settings'
  | 'about'
  | 'search'
  | 'admin'
  | 'adminNews'
  | 'adminLibrary'
  | 'adminEvents'
  | 'adminCalendar'
  | 'adminOpportunities'
  | 'adminSug'
  | 'adminAnonymous'
  | 'adminChannels'
  | 'adminSplash'
  | 'notifications'
  | 'editProfile'
  | 'privacyPolicy'
  | 'adminQuotes';

export interface NavParams {
  [key: string]: unknown;
}
