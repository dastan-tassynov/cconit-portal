/** Контракты API бэкенда (см. dto-пакет в web-portal-back). */

export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_SUPERADMIN';
export type ContentLanguage = 'RU' | 'KZ';

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string>;
}

export interface MessageResponse {
  message: string;
}

// ---------- auth ----------

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  iin: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  fullName: string;
  roles: UserRole[];
}

export interface PortalUser {
  id: number;
  username: string;
  fullName: string;
  phoneNumber?: string;
  roles: UserRole[];
}

// ---------- courses ----------

/** Выданный сертификат (страница «Сертификаты»). */
export interface MyCertificate {
  subjectId: number;
  courseTitle: string;
  certificateNumber: string;
  issuedAt: string;
  hours?: number | null;
  score?: number | null;
  inRegistry: boolean;
}

export interface CourseCard {
  id: number;
  title: string;
  description?: string;
  programCode?: string;
  hours?: number;
  price?: number;
  free: boolean;
  hasAccess: boolean;
  isCompleted: boolean;
  attemptsCount: number;
  lastScore?: number | null;
}

export interface CourseGroup {
  programCode: string;
  groupTitle: string;
  courses: CourseCard[];
}

export interface PublicCourse {
  id: number;
  title: string;
  description?: string;
  programCode?: string;
  directionId?: number;
  directionTitle?: string;
  /** Группа каталога: предмет из Өрлеу («S42») или OTHER — код курса не из справочника Өрлеу. */
  groupKey?: string;
  groupTitle?: string;
  hours?: number;
  price?: number;
  free: boolean;
}

export interface Lesson {
  id: number;
  stepOrder: number;
  title: string;
  textMaterial?: string;
  /** Относительный путь с подписанным токеном. */
  videoUrl?: string;
}

export interface CourseLessons {
  subjectId: number;
  subjectTitle: string;
  subjectDescription?: string;
  lessons: Lesson[];
}

export interface CourseProgress {
  currentStepOrder: number;
  isCompleted: boolean;
  lastScore: number;
  attemptsCount: number;
  attemptsLeft: number;
  /** Попытки теста закончились — откроет администратор. */
  quizLocked: boolean;
}

// ---------- quiz ----------

export interface QuizAnswerOption {
  id: number;
  answerText: string;
}

export interface QuizQuestion {
  id: number;
  questionText: string;
  answers: QuizAnswerOption[];
}

export interface QuizAttempt {
  attemptId: number;
  subjectId: number;
  passingScorePercent: number;
  questions: QuizQuestion[];
}

export interface QuizResult {
  completed: boolean;
  passed: boolean;
  lastScore: number;
  correctCount: number;
  totalQuestions: number;
  attemptsCount: number;
  /** Сколько попыток осталось; 0 при несданном курсе — тест заблокирован. */
  attemptsLeft: number;
  maxAttempts: number;
  passingScorePercent: number;
}

// ---------- payments ----------

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface Order {
  id: number;
  kind: 'COURSE' | 'CONTEST';
  subjectId?: number;
  nominationId?: number;
  /** Название курса или «Конкурс — номинация». */
  subjectTitle: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  paymentSystem: 'KASPI' | 'HALYK';
  invoiceNumber: string;
  createdAt: string;
  paidAt?: string;
  stubPaymentAvailable: boolean;
  /** Можно оплатить картой через Halyk ePay. */
  halykAvailable: boolean;
}

/** Параметры для halyk.pay(...) из payment-api.js банка. */
export interface HalykPayment {
  scriptUrl: string;
  payment: Record<string, unknown>;
  alreadyPaid: boolean;
}

/** Что покупаем в диалоге оплаты. */
export interface PurchaseItem {
  kind: 'COURSE' | 'CONTEST';
  /** subjectId для курса, nominationId для конкурса. */
  id: number;
  title: string;
}

// ---------- contests ----------

export interface ContestNomination {
  id: number;
  title: string;
  joined: boolean;
}

export interface Contest {
  id: number;
  title: string;
  description?: string;
  price: number;
  materialsEmail?: string;
  active: boolean;
  nominations: ContestNomination[];
}

export interface MyContestEntry {
  id: number;
  contestId: number;
  contestTitle: string;
  nominationTitle: string;
  participantNumber: string;
  materialsEmail?: string;
  createdAt: string;
}

export interface AdminContestNomination {
  id?: number;
  titleRu: string;
  titleKz: string;
  entriesCount?: number;
}

export interface AdminContest {
  id: number;
  titleRu: string;
  titleKz: string;
  descriptionRu?: string;
  descriptionKz?: string;
  price: number;
  materialsEmail?: string;
  active: boolean;
  entriesCount: number;
  nominations: AdminContestNomination[];
}

export type ContestRequest = Omit<AdminContest, 'id' | 'entriesCount'>;

export interface ContestEntryAdmin {
  id: number;
  nominationTitle: string;
  participantNumber: string;
  fullName: string;
  email: string;
  phone?: string;
  createdAt: string;
}

// ---------- survey ----------

export interface SurveyQuestion {
  key: string;
  text: string;
  choice: boolean;
  allowOther: boolean;
  options: { key: string; label: string }[];
}

export interface Survey {
  completed: boolean;
  agreementUrl: string;
  questions: SurveyQuestion[];
  answers: Record<string, string>;
}

// ---------- Өрлеу (LMS) ----------

export type OrleuSyncStatus = 'PENDING' | 'SENT' | 'RETRY' | 'FAILED' | 'SKIPPED';

export interface OrleuCertificate {
  id: number;
  certificateNumber: string;
  issuedAt: string;
  userId: number;
  fullName: string;
  iin: string;
  subjectTitle: string;
  programCode?: string;
  status: OrleuSyncStatus;
  error?: string;
  attempts?: number;
  sentAt?: string;
}

export interface OrleuOverview {
  enabled: boolean;
  baseUrl?: string;
  bin?: string;
  courseQualTypeId: number;
  sentCount: number;
  pendingCount: number;
  retryCount: number;
  failedCount: number;
  problems: OrleuCertificate[];
}

export interface OrleuProgram {
  code: string;
  name: string;
  subject: string;
  enabled: boolean;
}

// ---------- support (admin) ----------

export interface StudentAdmin {
  id: number;
  email: string;
  fullName?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  iin: string;
  phoneNumber?: string;
  staff: boolean;
  surveyCompleted: boolean;
  courses: {
    subjectId: number;
    title: string;
    completed: boolean;
    attemptsUsed: number;
    attemptsLeft: number;
    quizLocked: boolean;
  }[];
}

export interface QuizLocked {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  subjectId: number;
  subjectTitle: string;
  attemptsUsed: number;
  lastScore?: number;
  lastAttemptDate?: string;
}

export interface UpdateStudentRequest {
  lastName: string;
  firstName: string;
  middleName?: string;
  iin: string;
  phoneNumber?: string;
}

export interface NameChange {
  id: number;
  userId: number;
  email: string;
  iin: string;
  oldFullName?: string;
  newFullName: string;
  status: ApplicationStatus;
  createdAt: string;
}

// ---------- certificates ----------

export interface CertificateVerification {
  status: 'VALID';
  certificateNumber: string;
  studentName: string;
  subjectTitle: string;
  issuedAt: string;
}

// ---------- admin ----------

export interface Advertisement {
  id: number;
  title?: string;
  description?: string;
  linkUrl?: string;
  imageUrl?: string;
  active: boolean;
  createdAt: string;
}

export interface ConstructorSubject {
  id: number;
  programCode: string;
  language: ContentLanguage;
  title: string;
  description?: string;
  hours?: number;
  price?: number;
  hasRu: boolean;
  hasKz: boolean;
  /** Скрыт из каталога. */
  hidden?: boolean;
}

export interface AdminLesson {
  id: number;
  stepOrder: number;
  title: string;
  hasVideo: boolean;
}

export interface CreateSubjectRequest {
  programCode: string;
  language: ContentLanguage;
  title: string;
  description?: string;
  hours?: number | null;
  price?: number | null;
}

export interface TranslationRequest {
  language: ContentLanguage;
  title: string;
  description?: string;
  objectives?: string;
}

export interface LessonTranslationRequest {
  language: ContentLanguage;
  title: string;
  textMaterial?: string;
}

export interface QuizQuestionRequest {
  language?: ContentLanguage;
  questionText: string;
  answers: { answerText: string; isCorrect: boolean }[];
}

// ---------- публичный сайт ----------

export interface PublicStats {
  courses: number;
  students: number;
  completedCourses: number;
}

export interface ContactRequest {
  id?: number;
  name: string;
  phone?: string;
  email?: string;
  message?: string;
  /** Поле-ловушка для ботов, всегда пустое. */
  website?: string;
  createdAt?: string;
  processed?: boolean;
}

// ---------- кабинет ----------

export interface EducationDocument {
  id: number;
  name: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface Profile {
  email: string;
  iin: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  fullName?: string;
  phoneNumber?: string;
  region?: string;
  position?: string;
  workplace?: string;
  documents: EducationDocument[];
  completeness: number;
  /** ФИО меняется только через заявку администратору (уже есть сертификаты). */
  nameChangeNeedsApproval: boolean;
  /** ФИО из заявки, ожидающей решения. */
  pendingFullName?: string;
}

export interface UpdateProfileRequest {
  lastName: string;
  firstName: string;
  middleName?: string;
  phoneNumber?: string;
  region?: string;
  position?: string;
  workplace?: string;
}

export interface DashboardSummary {
  today: string;
  streakDays: number;
  completedCount: number;
  inProgressCount: number;
  week: { date: string; active: boolean }[];
  courses: { id: number; title: string; progressPercent: number; isCompleted: boolean; lastScore?: number }[];
  profileCompleteness: number;
  regionMissing: boolean;
  /** Анкета студента пройдена. */
  surveyCompleted: boolean;
}

export type NotificationType =
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'CERTIFICATE_ISSUED'
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED'
  | 'CONTEST_REGISTERED'
  | 'NAME_CHANGE_APPROVED'
  | 'NAME_CHANGE_REJECTED'
  | 'QUIZ_LOCKED'
  | 'QUIZ_UNLOCKED'
  | 'ANNOUNCEMENT';

export interface AppNotification {
  id: number;
  type: NotificationType;
  param?: string;
  link?: string;
  createdAt: string;
  read: boolean;
}

// ---------- каталог ----------

export interface Direction {
  id: number;
  title: string;
  icon?: string;
  courseCount: number;
}

export interface CourseDetail {
  id: number;
  title: string;
  description?: string;
  objectives: string[];
  programCode?: string;
  directionId?: number;
  directionTitle?: string;
  /** Группа каталога: предмет из Өрлеу («S42») или OTHER — код курса не из справочника Өрлеу. */
  groupKey?: string;
  groupTitle?: string;
  hours?: number;
  price?: number;
  free: boolean;
  lessonCount: number;
  hasPlan: boolean;
  authors: { fullName: string; position?: string }[];
  viewer?: { hasAccess: boolean; enrolled: boolean; isCompleted: boolean; progressPercent: number };
}

// ---------- новости и FAQ ----------

export interface NewsItem {
  id: number;
  title: string;
  body?: string;
  imageUrl?: string;
  publishedAt: string;
  views: number;
}

export interface NewsPage {
  items: NewsItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export interface AdminNews {
  id?: number;
  titleRu: string;
  titleKz?: string;
  bodyRu?: string;
  bodyKz?: string;
  imageUrl?: string;
  publishedAt?: string;
  published: boolean;
  views?: number;
}

export interface AdminFaq {
  id?: number;
  questionRu: string;
  questionKz?: string;
  answerRu: string;
  answerKz?: string;
  sortOrder: number;
}

// ---------- заявки ----------

export type ApplicationType = 'WORKGROUP' | 'LECTURER';
export type ApplicationStatus = 'NEW' | 'APPROVED' | 'REJECTED';

export interface Application {
  id: number;
  type: ApplicationType;
  topic: string;
  message?: string;
  status: ApplicationStatus;
  adminComment?: string;
  createdAt: string;
  decidedAt?: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userPosition?: string;
  userWorkplace?: string;
}

export interface SiteSettings {
  workgroupsOpen: boolean;
  lecturerOpen: boolean;
}

// ---------- админка каталога ----------

export interface AdminDirection {
  id?: number;
  titleRu: string;
  titleKz: string;
  icon?: string;
  sortOrder: number;
  courseCount?: number;
}

export interface SubjectDetails {
  id?: number;
  directionId?: number | null;
  /** Код программы Өрлеу (programmUniqueCode из /op). */
  programCode?: string;
  hours?: number | null;
  objectives?: string;
  authors: { fullName: string; position?: string }[];
  hasPlan?: boolean;
}
