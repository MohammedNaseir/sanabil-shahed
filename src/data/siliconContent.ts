/**
 * المحتوى الأصلي الكامل لدرس «السيليكون» - الكيمياء (الصف العاشر)
 * مختبر الأسئلة | صقور أ. شهد في منصة سنابل التعليمية
 * يُمنع منعاً باتاً تعديل أو حذف أي سؤال أو إجابة من هذا المحتوى الأصلي.
 */

// 1) بنك أسئلة سباق الصقور (عجلة الحظ)
export interface QuestionMCQ {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export const FALCON_QUESTIONS: QuestionMCQ[] = [
  {
    id: 1,
    question: "السيليكون من أكثر العناصر وفرة في القشرة الأرضية بعد:",
    options: ["الهيدروجين", "الحديد", "الأكسجين", "الكربون"],
    correctIndex: 2
  },
  {
    id: 2,
    question: "يوجد السيليكون في الصخور على شكل:",
    options: ["عنصر حر", "سيليكا SiO₂ (الكوارتز)", "كربونات", "كبريتيد"],
    correctIndex: 1
  },
  {
    id: 3,
    question: "موقع السيليكون في الجدول الدوري:",
    options: [
      "المجموعة IIIA، الدورة 3",
      "المجموعة VA، الدورة 3",
      "المجموعة IVA، الدورة 2",
      "المجموعة IVA، الدورة 3"
    ],
    correctIndex: 3
  },
  {
    id: 4,
    question: "التوزيع الإلكتروني لذرة السيليكون:",
    options: ["2,8,4", "2,4,8", "2,8,6", "2,8,2"],
    correctIndex: 0
  },
  {
    id: 5,
    question: "يُصنَّف السيليكون ضمن:",
    options: ["الفلزات", "أشباه الفلزات", "اللافلزات", "الغازات النبيلة"],
    correctIndex: 1
  },
  {
    id: 6,
    question: "من الخصائص الفيزيائية للسيليكون:",
    options: [
      "غاز عديم اللون",
      "سائل فضي",
      "لافلز أصفر هش",
      "صلب رمادي داكن له لمعان"
    ],
    correctIndex: 3
  },
  {
    id: 7,
    question: "تُصنَّف المواد حسب موصليتها للكهرباء إلى:",
    options: [
      "موصلات وأشباه موصلات وعوازل",
      "أحماض وقواعد",
      "فلزات ولافلزات",
      "مركبات وعناصر"
    ],
    correctIndex: 0
  },
  {
    id: 8,
    question: "يُصنَّف السيليكون من أشباه الموصلات لأنه:",
    options: [
      "موصل جيد كالنحاس",
      "توصيله بين الموصلات والعوازل",
      "عازل تمامًا",
      "يتفاعل مع الماء"
    ],
    correctIndex: 1
  },
  {
    id: 9,
    question: "تُستخدم خاصية وصل الدوائر وفصلها في صناعة:",
    options: [
      "الأسمدة",
      "الدهانات",
      "الترانزستورات والدارات المتكاملة",
      "الصابون"
    ],
    correctIndex: 2
  },
  {
    id: 10,
    question: "يُستخلص السيليكون بتسخين السيليكا مع:",
    options: ["الكربون", "الهيدروجين", "الأكسجين", "الماء"],
    correctIndex: 0
  },
  {
    id: 11,
    question: "أي المعادلات الآتية تمثل أحد تفاعلي استخلاص السيليكون؟",
    options: [
      "SiO₂ + 2C → Si + 2CO",
      "SiO₂ + H₂O → Si",
      "Si + C → SiO₂",
      "Si + 2CO₂ → SiO₂ + 2CO"
    ],
    correctIndex: 0
  },
  {
    id: 12,
    question: "نوع التفاعلين اللذين يُستخلص بهما السيليكون:",
    options: ["تعادل", "أكسدة واختزال", "تحلل", "إحلال"],
    correctIndex: 1
  }
];

// 2) بنك مصطلحات مختبر الاكتشاف (فك الشيفرة) - المحدثة بطلب أ. شهد
export interface CipherItem {
  id: number;
  clue: string;
  word: string;
}

export const CIPHER_ITEMS: CipherItem[] = [
  {
    id: 1,
    clue: "المركب الكيميائي SiO₂ الذي يُعد المكوّن الأساسي للرمل والكوارتز.",
    word: "السيليكا"
  },
  {
    id: 2,
    clue: "عنصر تقع خصائصه الفيزيائية والكيميائية بين خصائص الفلزات واللافلزات.",
    word: "شبه الفلز"
  },
  {
    id: 3,
    clue: "مادة تقع موصليتها الكهربائية بين الموصلات الجيدة والعوازل.",
    word: "شبه الموصل"
  },
  {
    id: 4,
    clue: "أداة إلكترونية تُصنع من أشباه الموصلات، وتُستخدم للتحكم في مرور التيار الكهربائي بوصله أو فصله.",
    word: "الترانزستور"
  },
  {
    id: 5,
    clue: "مركبات يدخل في تركيبها السيليكون والأكسجين، وتُستخدم في صناعة الإسمنت والزجاج والبورسلان.",
    word: "السيليكات"
  },
  {
    id: 6,
    clue: "عنصر شبه فلز عدده الذري 14، ويُعد أساس صناعة الرقاقات الحاسوبية والترانزستورات.",
    word: "السيليكون"
  }
];

// عبارات تحفيزية كيميائية خاصة بصقور أ. شهد
export const MOTIVATIONAL_CORRECT_PHRASES = [
  "تحليق كيميائي متألق! صقر أ. شهد يقتنص الإجابة بدقة 🦅✨",
  "تفاعل موزون ومثالي! ذراتك متناسقة وطاقتك عالية 🧪🔥",
  "إصابة دقيقة كبريق السيليكون النقي! أحسنت يا بطل 💎",
  "رائع يا صقر سنابل! رابطتك الكيميائية لا تنكسر 🦅⚡",
  "ما شاء الله! قوة الملاحظة الكيميائية في قمتها 🌟",
  "إجابة ذهبية! إلكترونات التكافؤ في مدارها الصحيح ⚛️"
];

export const MOTIVATIONAL_WRONG_PHRASES = [
  "حاول مجدداً يا صقر، حتى التفاعلات تحتاج إعادة موازنة! 🦅🔄",
  "لا بأس، الخطأ خطوة نحو اكتشاف كيميائي عظيم! 🧪💪",
  "استعد طاقتك الكيميائية وانطلق من جديد، أنت صقر لا يستسلم! ⚡",
  "أعد ترتيب الإلكترونات وركّز في التلميح القادم! 🔬",
  "تحدٍ بسيط لصقر كيميائي مثلك، القمة بانتظارك! 🦅✨",
  "تعلّم من التجربة، فالعالِم الناجح يُكرر المحاولة حتى يضيء المخبر! 💡"
];

export function getRandomCorrectPhrase(): string {
  return MOTIVATIONAL_CORRECT_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_CORRECT_PHRASES.length)];
}

export function getRandomWrongPhrase(): string {
  return MOTIVATIONAL_WRONG_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_WRONG_PHRASES.length)];
}

// 3) بنك تفسيرات الدوارق الغامضة (Flasks)
export interface FlaskItem {
  id: number;
  title: string;
  hint1: string;
  answerWithHighlight: string;
}

export const FLASK_ITEMS: FlaskItem[] = [
  {
    id: 1,
    title: "يُصنَّف السيليكون من أشباه الموصلات",
    hint1: "فكّر في مكانة توصيله للكهرباء بين الفلزات والعوازل، وفي ما يؤثر عليه.",
    answerWithHighlight:
      "لأن توصيله للكهرباء {أقل} من الفلزات و{أكبر} من العوازل، وتتغير موصليته بعوامل مثل {درجة الحرارة}."
  },
  {
    id: 2,
    title: "يُعد السيليكون أساسًا في الثورة التقنية والمعلوماتية",
    hint1: "تخيّل ما بداخل الحاسوب والهاتف من قطع إلكترونية صغيرة.",
    answerWithHighlight:
      "لأنه يدخل في صناعة {الدايودات} و{الترانزستورات} و{الرقاقات} الحاسوبية والدارات المتكاملة التي تقوم عليها الحواسيب والأجهزة الإلكترونية."
  },
  {
    id: 3,
    title: "لا يوجد السيليكون حرًّا في الطبيعة",
    hint1: "ماذا يفعل السيليكون مع العنصر الأكثر وفرة في القشرة الأرضية؟",
    answerWithHighlight:
      "لأنه يتحد مع {الأكسجين} ويوجد على شكل {سيليكا} (SiO₂) و{سيليكات}."
  },
  {
    id: 4,
    title: "لا يمكن تمييز أشباه الفلزات من توزيعها الإلكتروني وحده",
    hint1: "هل تقع أشباه الفلزات في مجموعة واحدة؟ وبماذا تُعرف إذن؟",
    answerWithHighlight:
      "لأنها تقع في مجموعات {مختلفة} وأعداد تكافؤ {مختلفة}، وتُعرف بخصائصها (مثل التوصيل {المتوسط}) وموقعها بين {الفلزات} واللافلزات."
  },
  {
    id: 5,
    title: "يُستخدم الكربون في استخلاص السيليكون",
    hint1: "ماذا ينتزع الكربون من ثاني أكسيد السيليكون؟",
    answerWithHighlight:
      "لأنه {يختزل} ثاني أكسيد السيليكون (SiO₂) فينتزع {الأكسجين} منه ويتكوّن {السيليكون}."
  },
  {
    id: 6,
    title: "تُصنع الرقاقات الحاسوبية من السيليكون",
    hint1: "فكّر في الدور الذي يؤديه الترانزستور في الدوائر.",
    answerWithHighlight:
      "لأنه {شبه موصل} يمكّن الترانزستور من {وصل} الدوائر و{فصلها}."
  }
];

// 4) معادلات وألغاز فرن الاستخلاص (Furnace)
export interface FurnaceMcq {
  prompt: string;
  equation: string;
  subPrompt: string;
  options: string[];
  correctIndex: number;
}

export const FURNACE_MCQ: FurnaceMcq[] = [
  {
    prompt: "🧪 المرحلة 1: أكمل المعادلة",
    equation: "SiO₂ + ▢ → Si + 2CO₂",
    subPrompt: "ما المادة الناقصة؟",
    options: ["2CO", "2C", "CO₂", "O₂"],
    correctIndex: 0
  },
  {
    prompt: "🧪 المرحلة 1: أكمل المعادلة",
    equation: "SiO₂ + 2C → ▢",
    subPrompt: "ما النواتج؟",
    options: ["Si + 2CO", "Si + CO₂", "SiC + O₂", "Si + 2H₂O"],
    correctIndex: 0
  }
];

export interface MoleculeCount {
  [atom: string]: number;
}

export const MOLECULE_ATOMS: Record<string, MoleculeCount> = {
  "SiO₂": { Si: 1, O: 2 },
  "CO": { C: 1, O: 1 },
  "CO₂": { C: 1, O: 2 },
  "Si": { Si: 1 },
  "C": { C: 1 }
};

export interface BalanceReaction {
  reactants: string[];
  products: string[];
  balancedCoeffs: number[]; // [r1, r2, p1, p2]
}

export const BALANCE_REACTIONS: BalanceReaction[] = [
  {
    reactants: ["SiO₂", "CO"],
    products: ["Si", "CO₂"],
    balancedCoeffs: [1, 2, 1, 2]
  },
  {
    reactants: ["SiO₂", "C"],
    products: ["Si", "CO"],
    balancedCoeffs: [1, 2, 1, 2]
  }
];

export interface MysteryElement {
  name: string;
  clues: string[];
}

export const MYSTERY_ELEMENTS: MysteryElement[] = [
  {
    name: "الكبريت",
    clues: [
      "أقع في الدورة الثالثة",
      "تصنيفي: لافلز",
      "أنا عازل للكهرباء",
      "توزيعي الإلكتروني 2,8,6"
    ]
  },
  {
    name: "السيليكون",
    clues: [
      "أقع في الدورة الثالثة",
      "مجموعتي هي IVA",
      "أنا شبه موصل للكهرباء",
      "توزيعي الإلكتروني 2,8,4"
    ]
  },
  {
    name: "الكالسيوم",
    clues: [
      "تصنيفي: فلز",
      "أنا موصل للكهرباء",
      "أقع في الدورة الرابعة",
      "توزيعي الإلكتروني 2,8,8,2"
    ]
  }
];

// 5) المحقق الكيميائي (Detective)
export interface DetectiveClue {
  id: number;
  title: string;
  details: string;
  fieldLabel: string;
  fieldValue: string;
}

export const DETECTIVE_CLUES: DetectiveClue[] = [
  {
    id: 1,
    title: "من الرمل",
    details:
      "عنصر من أكثر العناصر وفرة في القشرة الأرضية بعد الأكسجين، لكنه لا يوجد حرًّا في الطبيعة لأنه يتحد مع الأكسجين. تجده على شكل SiO₂ (الكوارتز، المكوّن الأساسي للرمل) وفي السيليكات داخل الصخور.",
    fieldLabel: "الموطن",
    fieldValue: "رمل وصخور (سيليكا)"
  },
  {
    id: 2,
    title: "بطاقة الهوية",
    details:
      "يقع في المجموعة IVA والدورة الثالثة، وتوزيعه الإلكتروني 2,8,4؛ أي أن مستواه الأخير يحمل أربعة إلكترونات. ويُصنَّف ضمن أشباه الفلزات لأن خصائصه تقع بين الفلزات واللافلزات.",
    fieldLabel: "الهوية",
    fieldValue: "IVA، الدورة 3، 2,8,4"
  },
  {
    id: 3,
    title: "المظهر",
    details:
      "بعد استخلاصه يظهر مادةً صلبة رمادية داكنة لها لمعان، فلا هو غاز عديم اللون ولا سائل فضي.",
    fieldLabel: "المظهر",
    fieldValue: "صلب رمادي داكن لامع"
  },
  {
    id: 4,
    title: "الشخصية الكهربائية",
    details:
      "تُصنَّف المواد حسب موصليتها إلى موصلات وأشباه موصلات وعوازل. وتوصيل هذا العنصر للكهرباء أقل من الفلزات وأكبر من العوازل، وتتغير موصليته بعوامل مثل درجة الحرارة، لذلك هو شبه موصل.",
    fieldLabel: "التوصيل",
    fieldValue: "شبه موصل"
  },
  {
    id: 5,
    title: "رحلة الاستخراج",
    details:
      "يُستخلص بتسخين السيليكا مع الكربون في تفاعلين: SiO₂ + 2C → Si + 2CO ثم SiO₂ + 2CO → Si + 2CO₂. هما تفاعلا أكسدة واختزال؛ فالكربون يختزل السيليكا وينتزع الأكسجين منها.",
    fieldLabel: "الاستخراج",
    fieldValue: "تسخين السيليكا مع الكربون"
  },
  {
    id: 6,
    title: "الوظيفة الأخيرة",
    details:
      "يدخل في صناعة الدايودات والترانزستورات والرقاقات الحاسوبية والدارات المتكاملة. والترانزستور شبه موصل يصل الدوائر ويفصلها، ولهذا يُعد هذا العنصر أساس الثورة التقنية والمعلوماتية.",
    fieldLabel: "المهنة",
    fieldValue: "ترانزستورات ورقاقات ودارات"
  }
];

// 6) أسئلة طوق النجاة (Rescue Buoy)
export const RESCUE_QUESTIONS: QuestionMCQ[] = [
  {
    id: 1,
    question: "ما الرمز الكيميائي للسيليكون؟",
    options: ["Si", "S", "Ca", "C"],
    correctIndex: 0
  },
  {
    id: 2,
    question: "ثاني أكثر العناصر وفرة في القشرة الأرضية هو…",
    options: ["الحديد", "السيليكون", "الكربون", "الهيدروجين"],
    correctIndex: 1
  },
  {
    id: 3,
    question: "كم إلكترونًا في المستوى الأخير لذرة السيليكون؟",
    options: ["2", "4", "6", "8"],
    correctIndex: 1
  },
  {
    id: 4,
    question: "من أي مادة تُصنع الدارات المتكاملة؟",
    options: ["السيليكون", "النحاس", "الكبريت", "الكالسيوم"],
    correctIndex: 0
  },
  {
    id: 5,
    question: "الكوارتز هو صورة من…",
    options: ["SiO₂", "CaO", "SO₂", "CO₂"],
    correctIndex: 0
  },
  {
    id: 6,
    question: "كم مستوى طاقة في ذرة السيليكون (2,8,4)؟",
    options: ["2", "3", "4", "5"],
    correctIndex: 1
  },
  {
    id: 7,
    question: "في SiO₂ + 2C → Si + 2CO العامل المختزل هو…",
    options: ["الكربون C", "السيليكا", "السيليكون", "CO"],
    correctIndex: 0
  },
  {
    id: 8,
    question: "العدد الكلي لإلكترونات ذرة السيليكون المتعادلة…",
    options: ["10", "12", "14", "16"],
    correctIndex: 2
  },
  {
    id: 9,
    question: "أيّ العناصر الآتية عازل للكهرباء؟",
    options: ["النحاس", "السيليكون", "الكبريت", "الكالسيوم"],
    correctIndex: 2
  },
  {
    id: 10,
    question: "في SiO₂ + 2CO → Si + ▢ كم CO₂ ينتج لتتوازن المعادلة؟",
    options: ["CO₂", "2CO₂", "3CO₂", "4CO₂"],
    correctIndex: 1
  }
];

// معلومات المحطات الست
export interface GameStationInfo {
  id: string;
  number: number;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  themeColor: string;
  accentBorder: string;
}

export const GAME_STATIONS: GameStationInfo[] = [
  {
    id: "falcon",
    number: 1,
    icon: "🦅",
    title: "سباق الصقور",
    subtitle: "عجلة الحظ الكيميائية والسرعة",
    description: "دوّر عجلة العناصر وأجب عن 12 سؤالاً دقيقاً قبل نفاد الثواني أو سقوط الصقر.",
    badge: "12 سؤالاً • مؤقت • سلسلة إجابات",
    themeColor: "from-amber-500/20 to-amber-950/40",
    accentBorder: "border-amber-500/50 hover:border-amber-400"
  },
  {
    id: "cipher",
    number: 2,
    icon: "🔐",
    title: "مختبر الاكتشاف",
    subtitle: "فك الشيفرة وتحديد المفاهيم الكيميائية",
    description: "استعن بالأدلة العلمية واكتشف حروف المصطلحات الستة بدقة قبل نفاد محاولاتك.",
    badge: "6 مفاهيم كيميائية • لوحة حروف • تلميحات",
    themeColor: "from-blue-600/20 to-slate-900/40",
    accentBorder: "border-blue-500/50 hover:border-blue-400"
  },
  {
    id: "flasks",
    number: 3,
    icon: "⚗️",
    title: "الدوارق الغامضة",
    subtitle: "تفسيرات علمية وتفكير نقدي",
    description: "افتح دوارق المختبر الزجاجية الستة لتفسير الظواهر وتدقيق إجابتك النموذجية.",
    badge: "6 دوارق • تلميحات تدريجية • تقييم ذاتي",
    themeColor: "from-emerald-600/20 to-teal-950/40",
    accentBorder: "border-emerald-500/50 hover:border-emerald-400"
  },
  {
    id: "furnace",
    number: 4,
    icon: "🔥",
    title: "فرن الاستخلاص",
    subtitle: "موازنة المعادلات وحزورة من أنا؟",
    description: "أشعل أفران الصهر بموازنة معادلات اختزال السيليكا، ثم حل حزورة العناصر الثلاثة.",
    badge: "مرحلتان • ميزان ذري حي • تخمين العناصر",
    themeColor: "from-orange-600/20 to-red-950/40",
    accentBorder: "border-orange-500/50 hover:border-orange-400"
  },
  {
    id: "detective",
    number: 5,
    icon: "🕵️",
    title: "المحقق الكيميائي",
    subtitle: "تتبع آثار العنصر الغامض",
    description: "ملف جنائي لعنصر ترك آثاره في 6 محطات. افتح الأدلة المتسلسلة لختم الملف باسمه.",
    badge: "6 أدلة جنائية • بطاقة هوية مشفرة",
    themeColor: "from-purple-600/20 to-indigo-950/40",
    accentBorder: "border-purple-500/50 hover:border-purple-400"
  },
  {
    id: "rescue",
    number: 6,
    icon: "🛟",
    title: "طوق النجاة",
    subtitle: "إنقاذ العالم تحت الماء",
    description: "أنقذ عالم الكيمياء قبل أن يغمره الماء! 10 أسئلة حاسمة مع 3 أطواق ومساعدات نجاة.",
    badge: "10 أسئلة • 3 مساعدات نجاة • خزان تفاعلي",
    themeColor: "from-cyan-600/20 to-sky-950/40",
    accentBorder: "border-cyan-500/50 hover:border-cyan-400"
  }
];
