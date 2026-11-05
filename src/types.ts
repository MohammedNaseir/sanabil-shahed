export interface LabPoints {
  at: number;
  ca: number;
  su: number;
  si: number;
}

export interface ProgressSummary {
  /** بوابات الذرة المكتملة (من 6). */
  atomGates: number;
  /** أنجز التحقيق النهائي لمختبر الذرة. */
  atomFinal: boolean;
  /** محطات العناصر المكتملة (من 21). */
  elementStations: number;
  /** عدد المهام التي حاولها. */
  attempted: number;
}

export interface Student {
  id: string;
  fullName: string;
  /** رقم الطالب في المختبر (يولّده الخادم). */
  chemicalId: string;
  createdAt: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  falconTitle: string;
  affiliation: string;
  /** نقاط كل مهمة كما سجّلها الخادم. */
  tasks?: Record<string, number>;
  labPoints?: LabPoints;
  totalPoints: number;
  summary?: ProgressSummary;
  /** يزيد عند تصفير المعلمة للنقاط. */
  scoreEpoch?: number;
  lastActive: number;
  isOnline?: boolean;
  /** هوية تدريب محلية أُنشئت دون اتصال بالخادم، وليست معتمدة لدى المعلمة. */
  isLocal?: boolean;
}

export interface LabSession {
  isOpen: boolean;
  announcement: string;
  lessonName: string;
  teacherName: string;
  organization: string;
  /** فتحت المعلمة مختبر العناصر للجميع. */
  elementsUnlocked?: boolean;
}
