export interface Student {
  id: string;
  fullName: string;
  chemicalId: string; // الهوية الكيميائية الخاصة بالطالب
  createdAt: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  falconTitle: string;
  affiliation: string;
  /** نتائج ألعاب السيليكون الست فقط. */
  scores: Record<string, number>;
  completedGames: string[];
  /** مهام مختبر الذرة المعتمدة على الخادم. */
  atomicTasks?: string[];
  siliconPoints?: number;
  atomicPoints?: number;
  totalPoints: number;
  /** يزيد عند تصفير المعلمة للنقاط. */
  scoreEpoch?: number;
  lastActive: number;
  isOnline?: boolean;
  /** هوية تدريب محلية أُنشئت دون اتصال بالخادم، وليست معتمدة لدى المعلمة. */
  isLocal?: boolean;
}

export interface DeductionRecord {
  id: string;
  title: string;
  text: string;
  date: string;
}

export interface LabSession {
  isOpen: boolean;
  announcement: string;
  lessonName: string;
  teacherName: string;
  organization: string;
}
