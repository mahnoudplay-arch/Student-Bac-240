import { Subject } from '../types';

export const INITIAL_CURRICULUM: Subject[] = [
  {
    id: 'math1',
    name: 'الرياضيات - الجزء الأول',
    nameEn: 'Mathematics Part 1',
    maxScore: 300,
    icon: 'Calculator',
    color: '#3B82F6',
    gradient: 'from-blue-600 to-indigo-700',
    units: [
      {
        id: 'math1_u1',
        unit_name: 'الوحدة الأولى: تذكرة بالمتتاليات، والإثبات بالتدريج',
        lessons: [
          { id: 'm1_u1_l1', name: 'عموميات عن المتتاليات', completed: false },
          { id: 'm1_u1_l2', name: 'البرهان بالتدريج أو بالاستقراء الرياضي', completed: false },
          { id: 'm1_u1_l3', name: 'تمرينات ومسائل', completed: false }
        ]
      },
      {
        id: 'math1_u2',
        unit_name: 'الوحدة الثانية: التوابع : النهايات والاستمرار',
        lessons: [
          { id: 'm1_u2_l1', name: 'نهاية تابع عند اللانهاية', completed: false },
          { id: 'm1_u2_l2', name: 'نهاية تابع عند عدد حقيقي', completed: false },
          { id: 'm1_u2_l3', name: 'العمليات على النهايات', completed: false },
          { id: 'm1_u2_l4', name: 'مبرهنات المقارنة', completed: false },
          { id: 'm1_u2_l5', name: 'نهاية تابع مركب', completed: false },
          { id: 'm1_u2_l6', name: 'المقارب المائل', completed: false },
          { id: 'm1_u2_l7', name: 'الاستمرار', completed: false },
          { id: 'm1_u2_l8', name: 'التوابع المستمرة وحل المعادلات', completed: false },
          { id: 'm1_u2_l9', name: 'أنشطة', completed: false },
          { id: 'm1_u2_l10', name: 'تمرينات ومسائل', completed: false }
        ]
      },
      {
        id: 'math1_u3',
        unit_name: 'الوحدة الثالثة: التوابع : الاشتقاق',
        lessons: [
          { id: 'm1_u3_l1', name: 'تعاريف (تذكرة)', completed: false },
          { id: 'm1_u3_l2', name: 'مشتقات بعض التوابع المألوفة (تذكرة)', completed: false },
          { id: 'm1_u3_l3', name: 'تطبيقات الاشتقاق', completed: false },
          { id: 'm1_u3_l4', name: 'اشتقاق تابع مركب', completed: false },
          { id: 'm1_u3_l5', name: 'المشتقات من مراتب عليا', completed: false },
          { id: 'm1_u3_l6', name: 'أنشطة', completed: false },
          { id: 'm1_u3_l7', name: 'تمرينات ومسائل', completed: false }
        ]
      },
      {
        id: 'math1_u4',
        unit_name: 'الوحدة الرابعة: نهاية متتالية',
        lessons: [
          { id: 'm1_u4_l1', name: 'نهاية متتالية : تذكرة', completed: false },
          { id: 'm1_u4_l2', name: 'مبرهنات تخص النهايات', completed: false },
          { id: 'm1_u4_l3', name: 'تقارب المتتاليات المطردة', completed: false },
          { id: 'm1_u4_l4', name: 'متتاليات متجاورة', completed: false },
          { id: 'm1_u4_l5', name: 'أنشطة', completed: false },
          { id: 'm1_u4_l6', name: 'تمرينات ومسائل', completed: false }
        ]
      },
      {
        id: 'math1_u5',
        unit_name: 'الوحدة الخامسة: التابع اللوغارتمي النيبري',
        lessons: [
          { id: 'm1_u5_l1', name: 'التابع اللوغاريتمي النيبري', completed: false },
          { id: 'm1_u5_l2', name: 'لوغاريتم جداء ضرب', completed: false },
          { id: 'm1_u5_l3', name: 'دراسة التابع اللوغاريتمي ln', completed: false },
          { id: 'm1_u5_l4', name: 'مشتق التابع المركب ln o u', completed: false },
          { id: 'm1_u5_l5', name: 'نهايات مهمة تتعلق بالتابع اللوغاريتمي', completed: false },
          { id: 'm1_u5_l6', name: 'أنشطة', completed: false },
          { id: 'm1_u5_l7', name: 'تمرينات ومسائل', completed: false }
        ]
      },
      {
        id: 'math1_u6',
        unit_name: 'الوحدة السادسة: التابع الأسي',
        lessons: [
          { id: 'm1_u6_l1', name: 'التابع الأسي النيبري', completed: false },
          { id: 'm1_u6_l2', name: 'خواص التابع الأسي', completed: false },
          { id: 'm1_u6_l3', name: 'دراسة التابع الأسي', completed: false },
          { id: 'm1_u6_l4', name: 'نهايات مهمة تتعلق بالتابع الأسي', completed: false },
          { id: 'm1_u6_l5', name: 'دراسة توابع من النمط (e^u)', completed: false },
          { id: 'm1_u6_l6', name: 'معادلات تفاضلية بسيطة', completed: false },
          { id: 'm1_u6_l7', name: 'أنشطة', completed: false },
          { id: 'm1_u6_l8', name: 'تمرينات ومسائل', completed: false }
        ]
      },
      {
        id: 'math1_u7',
        unit_name: 'الوحدة السابعة: التكامل والتوابع الأصلية',
        lessons: [
          { id: 'm1_u7_l1', name: 'التوابع الأصلية', completed: false },
          { id: 'm1_u7_l2', name: 'بعض قواعد حساب التوابع الأصلية', completed: false },
          { id: 'm1_u7_l3', name: 'التكامل المحدد وخواصه', completed: false },
          { id: 'm1_u7_l4', name: 'التكامل المحدد وحساب المساحة', completed: false },
          { id: 'm1_u7_l5', name: 'أنشطة', completed: false },
          { id: 'm1_u7_l6', name: 'تمرينات ومسائل', completed: false },
          { id: 'm1_u7_l7', name: 'مسرد المصطلحات العلمية', completed: false }
        ]
      }
    ]
  },
  {
    id: 'math2',
    name: 'الرياضيات - الجزء الثاني',
    nameEn: 'Mathematics Part 2',
    maxScore: 300,
    icon: 'Maximize2',
    color: '#6366F1',
    gradient: 'from-indigo-600 to-violet-700',
    units: [
      {
        id: 'math2_u1',
        unit_name: 'الوحدة الأولى: الأشعة في الفراغ',
        lessons: [
          { id: 'm2_u1_l1', name: 'عموميات', completed: false },
          { id: 'm2_u1_l2', name: 'الارتباط الخطي لثلاثة أشعة', completed: false },
          { id: 'm2_u1_l3', name: 'المعلم في الفراغ', completed: false },
          { id: 'm2_u1_l4', name: 'المسافة في الفراغ', completed: false },
          { id: 'm2_u1_l5', name: 'مركز الأبعاد المتناسبة في الفراغ', completed: false },
          { id: 'm2_u1_l6', name: 'أنشطة', completed: false },
          { id: 'm2_u1_l7', name: 'تمرينات ومسائل', completed: false }
        ]
      },
      {
        id: 'math2_u2',
        unit_name: 'الوحدة الثانية: الجداء السلمي في الفراغ',
        lessons: [
          { id: 'm2_u2_l1', name: 'الجداء السلمي في المستوي (تذكرة)', completed: false },
          { id: 'm2_u2_l2', name: 'الجداء السلمي في الفراغ', completed: false },
          { id: 'm2_u2_l3', name: 'التعامد في الفراغ', completed: false },
          { id: 'm2_u2_l4', name: 'المعادلة الديكارتية لمستو', completed: false },
          { id: 'm2_u2_l5', name: 'أنشطة', completed: false },
          { id: 'm2_u2_l6', name: 'تمرينات ومسائل', completed: false }
        ]
      },
      {
        id: 'math2_u3',
        unit_name: 'الوحدة الثالثة: المستقيمات والمستويات في الفراغ',
        lessons: [
          { id: 'm2_u3_l1', name: 'المستقيم والمستوي بصفتهما مراكز أبعاد متناسبة', completed: false },
          { id: 'm2_u3_l2', name: 'التمثيلات الوسيطية', completed: false },
          { id: 'm2_u3_l3', name: 'تقاطع مستقيمات ومستويات', completed: false },
          { id: 'm2_u3_l4', name: 'تقاطع ثلاثة مستويات', completed: false },
          { id: 'm2_u3_l5', name: 'أنشطة', completed: false },
          { id: 'm2_u3_l6', name: 'تمرينات ومسائل', completed: false }
        ]
      },
      {
        id: 'math2_u4',
        unit_name: 'الوحدة الرابعة: الأعداد العقدية',
        lessons: [
          { id: 'm2_u4_l1', name: 'مجموعة الأعداد العقدية', completed: false },
          { id: 'm2_u4_l2', name: 'مرافق عدد عقدي', completed: false },
          { id: 'm2_u4_l3', name: 'الشكل المثلثي لعدد عقدي', completed: false },
          { id: 'm2_u4_l4', name: 'طويلة عدد عقدي وزاويته', completed: false },
          { id: 'm2_u4_l5', name: 'الشكل الأسي لعدد عقدي', completed: false },
          { id: 'm2_u4_l6', name: 'المعادلات من الدرجة الثانية ذات الأمثال الحقيقية', completed: false },
          { id: 'm2_u4_l7', name: 'أنشطة', completed: false },
          { id: 'm2_u4_l8', name: 'تمرينات ومسائل', completed: false }
        ]
      },
      {
        id: 'math2_u5',
        unit_name: 'الوحدة الخامسة: تطبيقات الأعداد العقدية في الهندسة',
        lessons: [
          { id: 'm2_u5_l1', name: 'تمثيل الأشعة بأعداد عقدية', completed: false },
          { id: 'm2_u5_l2', name: 'استعمال العدد العقدي الممثل لشعاع', completed: false },
          { id: 'm2_u5_l3', name: 'الكتابة العقدية للتحويلات الهندسية', completed: false },
          { id: 'm2_u5_l4', name: 'أنشطة', completed: false },
          { id: 'm2_u5_l5', name: 'تمرينات ومسائل', completed: false }
        ]
      },
      {
        id: 'math2_u6',
        unit_name: 'الوحدة السادسة: التحليل التوافقي',
        lessons: [
          { id: 'm2_u6_l1', name: 'إنشاء قوائم من عناصر مجموعة', completed: false },
          { id: 'm2_u6_l2', name: 'التوافيق', completed: false },
          { id: 'm2_u6_l3', name: 'خواص عدد التوافيق C(n,p)، ومنشور ذي الحدين', completed: false },
          { id: 'm2_u6_l4', name: 'أنشطة', completed: false },
          { id: 'm2_u6_l5', name: 'تمرينات ومسائل', completed: false }
        ]
      },
      {
        id: 'math2_u7',
        unit_name: 'الوحدة السابعة: الاحتمالات',
        lessons: [
          { id: 'm2_u7_l1', name: 'الاحتمالات المشروطة', completed: false },
          { id: 'm2_u7_l2', name: 'المتحولات العشوائية', completed: false },
          { id: 'm2_u7_l3', name: 'الاستقلال الاحتمالي لمتحولين عشوائيين', completed: false },
          { id: 'm2_u7_l4', name: 'المتحولات العشوائية الحدانية', completed: false },
          { id: 'm2_u7_l5', name: 'أنشطة', completed: false },
          { id: 'm2_u7_l6', name: 'تمرينات ومسائل', completed: false },
          { id: 'm2_u7_l7', name: 'اختبارات عامة', completed: false },
          { id: 'm2_u7_l8', name: 'مسرد المصطلحات العلمية', completed: false }
        ]
      }
    ]
  },
  {
    id: 'physics',
    name: 'الفيزياء',
    nameEn: 'Physics',
    maxScore: 400,
    icon: 'Zap',
    color: '#F59E0B',
    gradient: 'from-amber-600 to-orange-700',
    units: [
      {
        id: 'phys_u1',
        unit_name: 'الوحدة الأولى : الحركة والتحريك',
        lessons: [
          { id: 'ph_u1_l1', name: 'الحركة التوافقية البسيطة', completed: false },
          { id: 'ph_u1_l2', name: 'الاهتزازات الجيبية الدورانية نواس الفتل غير المتخامد', completed: false },
          { id: 'ph_u1_l3', name: 'الاهتزازات غير التوافقية النواس الثقلي غير المتخامد', completed: false },
          { id: 'ph_u1_l4', name: 'ميكانيك الموائع', completed: false },
          { id: 'ph_u1_l5', name: 'النسبية الخاصة', completed: false }
        ]
      },
      {
        id: 'phys_u2',
        unit_name: 'الوحدة الثانية : الكهرباء والمغناطيسية',
        lessons: [
          { id: 'ph_u2_l1', name: 'المغناطيسية', completed: false },
          { id: 'ph_u2_l2', name: 'فعل الحقل المغناطيسي في التيار الكهربائي', completed: false },
          { id: 'ph_u2_l3', name: 'التحريض الكهرطيسي', completed: false },
          { id: 'ph_u2_l4', name: 'الدارات المهتزة والتيارات عالية التواتر', completed: false },
          { id: 'ph_u2_l5', name: 'التيار المتناوب الجيبي', completed: false },
          { id: 'ph_u2_l6', name: 'المحولات الكهربائية', completed: false }
        ]
      },
      {
        id: 'phys_u3',
        unit_name: 'الوحدة الثالثة : الأمواج المستقرة',
        lessons: [
          { id: 'ph_u3_l1', name: 'الأمواج المستقرة العرضية', completed: false },
          { id: 'ph_u3_l2', name: 'الأمواج المستقرة الطولية', completed: false }
        ]
      },
      {
        id: 'phys_u4',
        unit_name: 'الوحدة الرابعة : الإلكترونيات والجسم الصلب',
        lessons: [
          { id: 'ph_u4_l1', name: 'النماذج الذرية والطيوف', completed: false },
          { id: 'ph_u4_l2', name: 'انتزاع الإلكترونات وتسريعها', completed: false },
          { id: 'ph_u4_l3', name: 'الأشعة المهبطية', completed: false },
          { id: 'ph_u4_l4', name: 'الفعل الكهرحراري', completed: false },
          { id: 'ph_u4_l5', name: 'نظرية الكم والفعل الكهرضوئي', completed: false },
          { id: 'ph_u4_l6', name: 'الأشعة السينية - X Ray', completed: false },
          { id: 'ph_u4_l7', name: 'أشعة الليزر', completed: false }
        ]
      },
      {
        id: 'phys_u5',
        unit_name: 'الوحدة الخامسة : الفيزياء الفلكية',
        lessons: [
          { id: 'ph_u5_l1', name: 'الفيزياء الفلكية', completed: false }
        ]
      }
    ]
  },
  {
    id: 'chemistry',
    name: 'الكيمياء',
    nameEn: 'Chemistry',
    maxScore: 200,
    icon: 'FlaskConical',
    color: '#10B981',
    gradient: 'from-emerald-600 to-teal-700',
    units: [
      {
        id: 'chem_u1',
        unit_name: 'الوحدة الأولى : الكيمياء النووية',
        lessons: [
          { id: 'ch_u1_l1', name: 'الكيمياء النووية', completed: false }
        ]
      },
      {
        id: 'chem_u2',
        unit_name: 'الوحدة الثانية : الغازات',
        lessons: [
          { id: 'ch_u2_l1', name: 'الغازات', completed: false }
        ]
      },
      {
        id: 'chem_u3',
        unit_name: 'الوحدة الثالثة : حركية التفاعلات الكيميائية',
        lessons: [
          { id: 'ch_u3_l1', name: 'سرعة التفاعل الكيميائي', completed: false },
          { id: 'ch_u3_l2', name: 'التوازن الكيميائي', completed: false }
        ]
      },
      {
        id: 'chem_u4',
        unit_name: 'الوحدة الرابعة : الكيمياء التحليلية',
        lessons: [
          { id: 'ch_u4_l1', name: 'الحموض والأسس', completed: false },
          { id: 'ch_u4_l2', name: 'المحاليل المائية للأملاح', completed: false },
          { id: 'ch_u4_l3', name: 'المعايرة الحجمية', completed: false }
        ]
      },
      {
        id: 'chem_u5',
        unit_name: 'الوحدة الخامسة : الكيمياء العضوية',
        lessons: [
          { id: 'ch_u5_l1', name: 'الأغوال', completed: false },
          { id: 'ch_u5_l2', name: 'الألدهيدات والكيتونات', completed: false },
          { id: 'ch_u5_l3', name: 'الحموض العضوية (الكربوكسيلية)', completed: false },
          { id: 'ch_u5_l4', name: 'مشتقات الحموض الكربوكسيلية', completed: false },
          { id: 'ch_u5_l5', name: 'الأمينات', completed: false }
        ]
      }
    ]
  },
  {
    id: 'biology',
    name: 'علم الأحياء (العلوم)',
    nameEn: 'Biology',
    maxScore: 300,
    icon: 'Dna',
    color: '#F43F5E',
    gradient: 'from-rose-600 to-pink-700',
    units: [
      {
        id: 'bio_u1',
        unit_name: 'الفصل الأول',
        lessons: [
          { id: 'bio_f1_l1', name: 'الجهاز العصبي', completed: false },
          { id: 'bio_f1_l2', name: 'النسيج العصبي', completed: false },
          { id: 'bio_f1_l3', name: 'الجهاز العصبي المحيطي - خواص الأعصاب', completed: false },
          { id: 'bio_f1_l4', name: 'الظواهر الكهربائية في الخلايا الحية - النقل في الأعصاب', completed: false },
          { id: 'bio_f1_l5', name: 'تتمة النقل في الأعصاب - وظائف الجهاز العصبي (1، 2)', completed: false },
          { id: 'bio_f1_l6', name: 'وظائف الجهاز العصبي (3) - الفعل المنعكس', completed: false },
          { id: 'bio_f1_l7', name: 'بعض أمراض الجهاز العصبي - مفهوم المستقبلات الحسية - مستقبلات الجلد', completed: false },
          { id: 'bio_f1_l8', name: 'المستقبلات الكيميائية - المستقبلات الصوتية', completed: false },
          { id: 'bio_f1_l9', name: 'مستقبلات التوازن - المستقبلات الضوئية', completed: false },
          { id: 'bio_f1_l10', name: 'التنسيق الهرموني - الغدة النخامية - الغدة الدرقية', completed: false },
          { id: 'bio_f1_l11', name: 'آليات السيطرة على إفراز الغدد الصم - التنسيق الكيميائي في النبات', completed: false },
          { id: 'bio_f1_l12', name: 'تتمة التنسيق الكيميائي في النبات - أسئلة الوحدة الأولى - المشروع', completed: false },
          { id: 'bio_f1_l13', name: 'مراجعة الفصل الدراسي الأول', completed: false },
          { id: 'bio_f1_l14', name: 'امتحان الفصل الدراسي الأول', completed: false },
          { id: 'bio_f1_l15', name: 'العطلة الانتصافية', completed: false }
        ]
      },
      {
        id: 'bio_u2',
        unit_name: 'الفصل الثاني',
        lessons: [
          { id: 'bio_f2_l1', name: 'تكاثر الفيروسات - التكاثر عند الأحياء', completed: false },
          { id: 'bio_f2_l2', name: 'التقانات الحيوية - الخلايا الجذعية - تكاثر الجراثيم والفطريات', completed: false },
          { id: 'bio_f2_l3', name: 'التكاثر الجنسي لدى عاريات البذور', completed: false },
          { id: 'bio_f2_l4', name: 'التكاثر الجنسي لدى مغلفات البذور', completed: false },
          { id: 'bio_f2_l5', name: 'منشأ جهاز التكاثر لدى الانسان - جهاز التكاثر الذكري', completed: false },
          { id: 'bio_f2_l6', name: 'تشكل النطاف - الهرمونات الجنسية الذكرية', completed: false },
          { id: 'bio_f2_l7', name: 'جهاز التكاثر الأنثوي', completed: false },
          { id: 'bio_f2_l8', name: 'الدورة الجنسية - التنامي الجنيني (الإلقاح)', completed: false },
          { id: 'bio_f2_l9', name: 'التنامي الجنيني (التعشيش والحمل) - الولادة والإرضاع', completed: false },
          { id: 'bio_f2_l10', name: 'الصحة الإنجابية - أسئلة الوحدة الثانية', completed: false },
          { id: 'bio_f2_l11', name: 'مشروع الوحدة الثانية - تجارب مندل في الوراثة', completed: false },
          { id: 'bio_f2_l12', name: 'التهجين الاختباري - تأثر المورثات وتعديلات النسب المندلية في الهجونة', completed: false },
          { id: 'bio_f2_l13', name: 'المورثات المتتامة - الحجب الراجح - الارتباط والعبور', completed: false },
          { id: 'bio_f2_l14', name: 'تحديد الجنس لدى الأحياء - الوراثة والجنس', completed: false },
          { id: 'bio_f2_l15', name: 'الوراثة عند الإنسان - الطفرات', completed: false },
          { id: 'bio_f2_l16', name: 'الهندسة الوراثية - أسئلة الوحدة الثالثة - مشروع الوحدة الثالثة', completed: false },
          { id: 'bio_f2_l17', name: 'مراجعة الفصل الدراسي الثاني', completed: false }
        ]
      }
    ]
  },
  {
    id: 'arabic',
    name: 'اللغة العربية',
    nameEn: 'Arabic Language',
    maxScore: 400,
    icon: 'BookOpen',
    color: '#9333EA',
    gradient: 'from-purple-600 to-violet-800',
    units: [
      {
        id: 'ar_u1',
        unit_name: 'الوحدة الأولى : قضايا وطنية وقومية',
        lessons: [
          { id: 'ar_u1_l1', name: 'أدب القضايا الوطنية والقومية', completed: false },
          { id: 'ar_u1_l2', name: 'عرس المجد', completed: false },
          { id: 'ar_u1_l3', name: 'الجسر', completed: false }
        ]
      },
      {
        id: 'ar_u2',
        unit_name: 'الوحدة الثانية : الغربة والاغتراب في الأدب المهجري',
        lessons: [
          { id: 'ar_u2_l1', name: 'الأدب المهجري', completed: false },
          { id: 'ar_u2_l2', name: 'وطني', completed: false },
          { id: 'ar_u2_l3', name: 'المهاجر', completed: false },
          { id: 'ar_u2_l4', name: 'الغاب', completed: false },
          { id: 'ar_u2_l5', name: 'رسالة الشرق المتجدد', completed: false }
        ]
      },
      {
        id: 'ar_u3',
        unit_name: 'الوحدة الثالثة : فن الرواية',
        lessons: [
          { id: 'ar_u3_l1', name: 'فن الرواية', completed: false },
          { id: 'ar_u3_l2', name: '\"المصابيح الزرق\"', completed: false },
          { id: 'ar_u3_l3', name: 'دمشق يا بسمة الحزن', completed: false },
          { id: 'ar_u3_l4', name: 'عوامل تجديد الرواية العربية', completed: false }
        ]
      },
      {
        id: 'ar_u4',
        unit_name: 'الوحدة الرابعة : ظواهر وجدانية',
        lessons: [
          { id: 'ar_u4_l1', name: 'الشعر الوجداني', completed: false },
          { id: 'ar_u4_l2', name: 'الوطن', completed: false },
          { id: 'ar_u4_l3', name: 'لوعة الفراق', completed: false },
          { id: 'ar_u4_l4', name: 'الأمير الدمشقي', completed: false },
          { id: 'ar_u4_l5', name: 'مهمة الشعر', completed: false }
        ]
      },
      {
        id: 'ar_u5',
        unit_name: 'الوحدة الخامسة : أدب القضايا الاجتماعية',
        lessons: [
          { id: 'ar_u5_l1', name: 'الأدب الاجتماعي', completed: false },
          { id: 'ar_u5_l2', name: 'قوة العلم', completed: false },
          { id: 'ar_u5_l3', name: 'مروءة وسخاء', completed: false },
          { id: 'ar_u5_l4', name: 'رسالة حب', completed: false }
        ]
      },
      {
        id: 'ar_u6',
        unit_name: 'أقسام إضافية',
        lessons: [
          { id: 'ar_u6_l1', name: 'مشروعات مقترحة', completed: false },
          { id: 'ar_u6_l2', name: 'نصوص إثرائية', completed: false },
          { id: 'ar_u6_l3', name: 'قواعد اللغة', completed: false }
        ]
      }
    ]
  },
  {
    id: 'english',
    name: 'اللغة الإنكليزية',
    nameEn: 'English Language',
    maxScore: 300,
    icon: 'Languages',
    color: '#06B6D4',
    gradient: 'from-cyan-600 to-blue-800',
    units: [
      {
        id: 'en_u1',
        unit_name: 'Module 1: Learning for Life',
        lessons: [
          { id: 'en_m1_l1', name: 'Unit 1: Life Choices', completed: false },
          { id: 'en_m1_l2', name: 'Unit 2: Success', completed: false }
        ]
      },
      {
        id: 'en_u2',
        unit_name: 'Module 2: Sciences',
        lessons: [
          { id: 'en_m2_l1', name: 'Unit 3: Medicine', completed: false },
          { id: 'en_m2_l2', name: 'Unit 4: Engineering', completed: false }
        ]
      },
      {
        id: 'en_u3',
        unit_name: 'Module 3: Politics',
        lessons: [
          { id: 'en_m3_l1', name: 'Unit 5: Civil Rights', completed: false },
          { id: 'en_m3_l2', name: 'Unit 6: United Nations', completed: false }
        ]
      },
      {
        id: 'en_u4',
        unit_name: 'Module 4: Biology',
        lessons: [
          { id: 'en_m4_l1', name: 'Unit 7: Microorganism', completed: false },
          { id: 'en_m4_l2', name: 'Unit 8: Facts about Human Body', completed: false }
        ]
      },
      {
        id: 'en_u5',
        unit_name: 'Module 5: Culture',
        lessons: [
          { id: 'en_m5_l1', name: 'Unit 9: Citizenship', completed: false },
          { id: 'en_m5_l2', name: 'Unit 10: Culture Shock', completed: false }
        ]
      },
      {
        id: 'en_u6',
        unit_name: 'Module 6: Technology',
        lessons: [
          { id: 'en_m6_l1', name: 'Unit 11: Artificial Intelligence', completed: false },
          { id: 'en_m6_l2', name: 'Unit 12: Digital Literacy', completed: false }
        ]
      }
    ]
  },
  {
    id: 'french',
    name: 'اللغة الفرنسية',
    nameEn: 'French Language',
    maxScore: 300,
    icon: 'Globe',
    color: '#0EA5E9',
    gradient: 'from-sky-600 to-indigo-800',
    units: [
      {
        id: 'fr_u1',
        unit_name: 'Unité 1',
        lessons: [
          { id: 'fr_u1_l1', name: 'On fête ensemble ...', completed: false }
        ]
      },
      {
        id: 'fr_u2',
        unit_name: 'Unité 2',
        lessons: [
          { id: 'fr_u2_l1', name: 'Chacun pour tous', completed: false }
        ]
      },
      {
        id: 'fr_u3',
        unit_name: 'Unité 3',
        lessons: [
          { id: 'fr_u3_l1', name: 'Le salon, un espace culturel', completed: false }
        ]
      },
      {
        id: 'fr_u4',
        unit_name: 'Unité 4',
        lessons: [
          { id: 'fr_u4_l1', name: 'La femme dans la littérature', completed: false }
        ]
      },
      {
        id: 'fr_u5',
        unit_name: 'Unité 5',
        lessons: [
          { id: 'fr_u5_l1', name: 'L\'intelligence artificielle', completed: false }
        ]
      },
      {
        id: 'fr_u6',
        unit_name: 'Unité 6',
        lessons: [
          { id: 'fr_u6_l1', name: 'La conquête de l\'espace', completed: false }
        ]
      }
    ]
  },
  {
    id: 'islamic',
    name: 'التربية الإسلامية',
    nameEn: 'Islamic Education',
    maxScore: 200,
    icon: 'Compass',
    color: '#14B8A6',
    gradient: 'from-teal-600 to-emerald-800',
    units: [
      {
        id: 'is_u1',
        unit_name: 'الوحدة الأولى: وحدة القرآن الكريم (التلاوة)',
        lessons: [
          { id: 'is_u1_l1', name: 'نِعَمُ اللَّهِ تَعَالى مَدْعَاةٌ لِلتَّوحيدِ وَالشُّكْرِ', completed: false },
          { id: 'is_u1_l2', name: 'الله وحده هو الخالق المتصرّف', completed: false },
          { id: 'is_u1_l3', name: 'الله وحده القادِرُ المعبود', completed: false },
          { id: 'is_u1_l4', name: 'من مظاهر قدرة الله تعالى وعظيم فضله', completed: false },
          { id: 'is_u1_l5', name: 'دَلائِلُ عَظَمَةِ الخَالِقِ عَزَّ وَجَلَّ', completed: false },
          { id: 'is_u1_l6', name: 'مَبَادِئُ وقيم خالدة', completed: false },
          { id: 'is_u1_l7', name: 'أُسس الدعوة إلى الله تعالى', completed: false }
        ]
      },
      {
        id: 'is_u2',
        unit_name: 'الوحدة الثانية: وحدة القرآن الكريم (التفسير والاستحفاظ)',
        lessons: [
          { id: 'is_u2_l1', name: 'صيانة الحقوق وتوثيق العقود', completed: false },
          { id: 'is_u2_l2', name: 'إيمان ودعاء', completed: false },
          { id: 'is_u2_l3', name: 'القرآن الكريم وعظيم قدرة الله تعالى', completed: false },
          { id: 'is_u2_l4', name: 'سَعَةُ علم الله تعالى وكمال قدرته', completed: false }
        ]
      },
      {
        id: 'is_u3',
        unit_name: 'وحدة الحديث النبوي الشريف',
        lessons: [
          { id: 'is_u3_l1', name: 'بيعة صادقة', completed: false },
          { id: 'is_u3_l2', name: 'الإيمان قوَّة وعمل', completed: false },
          { id: 'is_u3_l3', name: 'حكم القاضي لا يُحلُّ الحَرامَ', completed: false },
          { id: 'is_u3_l4', name: 'مكانة الشهيد وعظيم أجره', completed: false },
          { id: 'is_u3_l5', name: 'عموم المسؤولية', completed: false },
          { id: 'is_u3_l6', name: 'توجيه نبوي حكيم', completed: false }
        ]
      },
      {
        id: 'is_u4',
        unit_name: 'الوحدة الثالثة: وحدة التربية الإنسانية',
        lessons: [
          { id: 'is_u4_l1', name: 'بناء الحضارة في الإسلام', completed: false },
          { id: 'is_u4_l2', name: 'مقومات الحضارة الإنسانية في الإسلام', completed: false },
          { id: 'is_u4_l3', name: 'مظاهر الحضارة الإسلامية', completed: false }
        ]
      },
      {
        id: 'is_u5',
        unit_name: 'الوحدة الرابعة: وحدة التربية الأسرية والاجتماعية',
        lessons: [
          { id: 'is_u5_l1', name: 'نظام الأسرة في الإسلام', completed: false },
          { id: 'is_u5_l2', name: 'المحرمات من النساء في الزواج', completed: false },
          { id: 'is_u5_l3', name: 'الخطبة والأسس الإسلامية للزواج', completed: false },
          { id: 'is_u5_l4', name: 'عقد الزواج', completed: false },
          { id: 'is_u5_l5', name: 'حقوق الزوجين', completed: false },
          { id: 'is_u5_l6', name: 'الطلاق', completed: false }
        ]
      },
      {
        id: 'is_u6',
        unit_name: 'الوحدة الخامسة: وحدة التربية الاقتصادية والمالية',
        lessons: [
          { id: 'is_u6_l1', name: 'نظام المال في الإسلام', completed: false },
          { id: 'is_u6_l2', name: 'قيود الملكية (الفردية - الجماعية)', completed: false }
        ]
      },
      {
        id: 'is_u7',
        unit_name: 'الوحدة السادسة: وحدة العلاقات الدولية',
        lessons: [
          { id: 'is_u7_l1', name: 'أسس العلاقات الدولية في الإسلام', completed: false },
          { id: 'is_u7_l2', name: 'الجهاد في الإسلام', completed: false },
          { id: 'is_u7_l3', name: 'من آداب الجهاد وأحكامه', completed: false }
        ]
      },
      {
        id: 'is_u8',
        unit_name: 'الوحدة السابعة: وحدة السيرة النبوية والأعلام',
        lessons: [
          { id: 'is_u8_l1', name: 'هدي النَّبيِّ ﷺ في القيادة', completed: false },
          { id: 'is_u8_l2', name: 'أُمُّ سُلَيْمٍ بِنْتُ مِلْحَانَ', completed: false },
          { id: 'is_u8_l3', name: 'الإمام جعفر الصادق', completed: false }
        ]
      }
    ]
  }
];
