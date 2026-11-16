import type { ToneId, StageId, Intensity } from "../schemas";
type Entry = { text: string; tones: ToneId[]; stages?: StageId[]; intensity?: Intensity };
// Two individually authored additions per legacy situation. Never counted as legacy text.
export const ADDITIONS: Record<string, [Entry, Entry]> = {
  miss: [
    { text: "الوقت معك يمر خفيف، حتى لو ما سوّينا شي غير إننا نسولف.", tones: ["deep", "romantic"], intensity: 2 },
    { text: "شكلك سبقتيني برسالة الشوق هالمرة!", tones: ["playful"] }
  ],
  photo: [
    { text: "تنسيق الألوان بالصورة لفتني، ذوقك جميل.", tones: ["mature", "casual"] },
    { text: "في هالصورة ابتسامة كأنها ضيّ شمس داخل من الشباك.", tones: ["poetic"], intensity: 2 }
  ],
  crush: [
    { text: "إيه، يلفتني فيك إنك تسمعين للرأي حتى لو اختلفتي معه.", tones: ["confident", "clear"] },
    { text: "يمكن طولت السالفة معك أكثر من عادتي، ولك تفهمينها على راحتك.", tones: ["subtle"] }
  ],
  love: [
    { text: "قبل أجاوبك، أبي أكون صادق: أحتاج وقت أفهم شعوري وما أوعدك بشي مو متأكد منه.", tones: ["mature", "clear"], stages: ["first_contact", "getting_to_know", "friendship_possible", "one_sided", "mutual_crush", "serious_dating"] },
    { text: "أحب إن حبنا يبان في التفاصيل: نسمع لبعض، ونختلف باحترام، ونوقف مع بعض في الأيام الثقيلة. وأحب إن لنا مساحة نكون فيها على طبيعتنا، نقول اللي يريحنا واللي يضايقنا، ونختار كل يوم كيف نعتني بعلاقتنا بأفعال نقدر عليها.", tones: ["deep", "romantic"], stages: ["love", "engaged", "married"], intensity: 2 }
  ],
  why: [
    { text: "لأنك تقولين رأيك بصدق، ومعك ما أحس إني لازم أمثّل.", tones: ["deep", "mature"] },
    { text: "أعجبني فيك إنك تنتبهين للتفاصيل اللي غيرك يمرّ عليها.", tones: ["confident"] }
  ],
  voice: [
    { text: "سمعت التسجيل، وأعجبني كيف وصفتي الموقف؛ حسّيت إني حاضر معكم.", tones: ["mature", "casual"] },
    { text: "حتى السالفة العادية بصوتك يصير لها طعم ثاني.", tones: ["bold_respectful", "tender"], intensity: 2 }
  ],
  bored: [
    { text: "لعبة سريعة؟ اختاري: رحلة بلا تخطيط، ولا يوم كامل بجدول؟", tones: ["playful", "casual"] },
    { text: "وش نشاط بسيط ودك تسوينه الحين؟ نختار شي يناسب طاقتك.", tones: ["mature", "clear"] }
  ],
  cold: [
    { text: "يمكن الوقت مو مناسب للسوالف، نوقف هنا ونكمل وقت أريح.", tones: ["mature", "casual"] },
    { text: "ما أبي أفسّر اختصارك من عندي؛ تبين نأجل الكلام؟", tones: ["clear"] }
  ],
  upset: [
    { text: "بسمعك للآخر قبل أرد؛ وش التصرف اللي ضايقك؟", tones: ["supportive", "clear"] },
    { text: "زعلك يستاهل وقفة، خلّيني أفهم الموقف وأراجع اللي بدر مني.", tones: ["mature"] }
  ],
  night: [
    { text: "نوقف السوالف هنا عشان ترتاحين، نوم هني.", tones: ["mature", "casual"] },
    { text: "يهدأ الليل وتبقى سوالفك أحلى أثر من هاليوم.", tones: ["poetic", "tender"], intensity: 2 }
  ],
  morning: [
    { text: "صباح النور، وش أول شي متحمسة له اليوم؟", tones: ["casual", "playful"] },
    { text: "صباحك نافذة مفتوحة على شي يسعدك، وخطوة تقرّبك للي تتمنينه.", tones: ["poetic", "supportive"] }
  ],
  chat: [
    { text: "وش شي بسيط جرّبتيه مؤخرًا وطلع أحلى من توقعك؟", tones: ["casual"] },
    { text: "اختاري لنا موضوع: سفرة ودك فيها، ولا أكلة مستحيل تملّين منها؟", tones: ["playful"] }
  ],
  flirt: [
    { text: "جاذبيتك في إنك عارفة نفسك، وهذا أكثر شي يلفتني فيك.", tones: ["bold_respectful", "confident"], intensity: 3 },
    { text: "ضحكتك مثل نور يلقى له مكان حتى في أثقل يوم.", tones: ["poetic", "romantic"], intensity: 2 }
  ],
  hint: [
    { text: "فيه سوالف تمرّ، وفيه سوالف أنتظر وقتها.. وسوالفك من الثانية.", tones: ["subtle", "poetic"] },
    { text: "ودي أعزمك على قهوة لأن معرفتك تهمني، وإذا ما ناسبك عادي.", tones: ["confident", "clear"] }
  ],
  confess: [
    { text: "أبي أقول اللي عندي بدون ما أحمّلك ردًا معيّنًا: أنا معجب فيك، وأحترم شعورك لو اختلف.", tones: ["clear", "mature"] },
    { text: "قربك صار له معنى عندي، وأفضّل أوضح لك بدل ما أتركك تخمّنين.", tones: ["deep", "confident"], intensity: 2 }
  ],
  missing: [
    { text: "مرّيت بمكان سولفنا عنه، وتمنيت أشاركك تفاصيله.", tones: ["subtle", "casual"] },
    { text: "للشوق عندي صوت يشبه ضحكتك، يمرّ في بالي ويخلّيني أبتسم.", tones: ["poetic", "romantic"], intensity: 2 }
  ],
  meet: [
    { text: "يناسبك لقاء قصير بمكان تختارينه وترتاحين له؟ وإذا لا، أحترم رغبتك.", tones: ["mature", "clear"] },
    { text: "عندي اقتراح: قهوة وسالفة ما يقطعها إشعار، إذا ودك.", tones: ["playful", "confident"] }
  ],
  support: [
    { text: "مو لازم تشرحين كل شي الحين؛ قولي لي بس وش نوع المساعدة اللي يريحك.", tones: ["supportive", "mature"] },
    { text: "أقدر أساعدك في مهمة محددة اليوم؟ إذا عندك شي يناسب، قولي لي ونشوف اللي أقدر عليه.", tones: ["clear", "supportive"] }
  ],
  thanks: [
    { text: "وقتك اللي خصصتيه لي أمس فرق معي، شكرًا إنك سمعتي بدون أحكام.", tones: ["deep", "mature"] },
    { text: "من ذوقك إنك تذكرتي هالتفصيل، وأنا منتبه ومقدّر.", tones: ["confident", "casual"] }
  ],
  sorry: [
    { text: "قاطعتك وأنا أتكلم، وهذا خطئي. المرة الجاية بسمع كلامك كامل قبل أرد.", tones: ["mature", "clear"] },
    { text: "أعتذر عن تأخري بدون ما أخبرك؛ كان المفروض أحترم وقتك وأبلغك من بدري.", tones: ["clear", "casual"] }
  ],
  misunderstand: [
    { text: "خلّينا نرجع للكلمة اللي سببت اللبس، وش فهمتي منها؟ بعدها أوضح قصدي.", tones: ["clear", "mature"] },
    { text: "حتى لو قصدي مختلف، يهمني أثر الكلام عليك وأبي أسمعه.", tones: ["supportive", "mature"] }
  ],
  space: [
    { text: "ما يحتاج تبررين حاجتك للمساحة؛ بحترمها وبوقف الرسائل.", tones: ["mature", "clear"] },
    { text: "فهمت طلبك، وما راح أطلب منك موعدًا للرد أو تفسيرًا إضافيًا.", tones: ["clear", "casual"] }
  ],
  fading: [
    { text: "وش شكل التواصل اللي يناسبك هالفترة؟ أبي نفهم احتياج بعض بدون افتراضات.", tones: ["clear", "mature"] },
    { text: "تغيّر وتيرة الكلام خلاني أتساءل، وأفضّل أسألك بدل ما أفسّر لحالي.", tones: ["mature", "casual"] }
  ],
  jealous: [
    { text: "غيرتي شعور أحتاج أفهمه، مو سبب أفتّش جوالك أو أحدد لك مع مين تتكلمين.", tones: ["mature", "clear"] },
    { text: "خلّينا نتكلم عن اللي يريحنا الاثنين، بدون ما نفرض على بعض قيودًا من طرف واحد.", tones: ["clear", "supportive"] }
  ],
  stress: [
    { text: "ما عندي كلام يحل كل شي، بس عندي وقت أسمعك إذا ودك.", tones: ["supportive", "casual"] },
    { text: "نترك الحلول الحين إذا ما تبينها؛ احكي لي على مهلك.", tones: ["mature", "supportive"] }
  ],
  reject: [
    { text: "ما يحتاج تبررين اختلاف شعورك، أحترم جوابك وما راح أحاول أغيّره.", tones: ["mature", "clear"] },
    { text: "شكرًا لصراحتك؛ باخذ مسافة أرتّب فيها مشاعري بدون ما أضغط عليك.", tones: ["clear", "casual"] }
  ],
  first: [
    { text: "المكان مريح لك؟ نقدر نغيّره إذا ودك.", tones: ["mature", "clear"] },
    { text: "بعترف لك: فكرت ببداية سالفة طول المشوار، والحين نسيتها!", tones: ["playful", "casual"] }
  ],
  busy: [
    { text: "ما يحتاج تردين وأنتِ وسط الشغل؛ خلّينا نخلي السوالف لوقت أوسع.", tones: ["supportive", "casual"] },
    { text: "ودي نتفق على وتيرة تواصل واقعية تناسب ضغطك واحتياجي للكلام.", tones: ["mature", "clear"] }
  ],
  bounds: [
    { text: "أفضل ما نشارك صورنا أو رسائلنا مع أحد بدون موافقة واضحة من صاحبها.", tones: ["clear", "mature"] },
    { text: "إذا ارتفع الصوت بوقف النقاش وأرجع له وقت نكون أهدأ، عشان أقدر أتكلم باحترام.", tones: ["mature", "clear"] }
  ],
  again: [
    { text: "هلا، مرّ علي موضوع ذكّرني بسوالفنا. إذا يناسبك التواصل، يسعدني أسمع أخبارك.", tones: ["mature", "casual"] },
    { text: "حبيت أسلّم مرة وحدة، وما يحتاج تردين إذا ما ودك نرجع نتواصل.", tones: ["clear", "casual"] }
  ]
};
