import type { Question } from '../types/schema';
import type { LanguageCode } from './i18nService';

// Comprehensive phrase & explanation replacement pipeline for all languages
const PHRASE_REPLACEMENTS: Record<LanguageCode, Array<{ pattern: RegExp | string; replace: string }>> = {
  en: [],
  hi: [
    { pattern: /in simplest form\?/gi, replace: 'का सरलतम रूप क्या है?' },
    { pattern: /in lowest terms\?/gi, replace: 'का न्यूनतम रूप क्या है?' },
    { pattern: /^What is\s+/gi, replace: '' },
    { pattern: /Solve:\s*/gi, replace: 'हल करें: ' },
    { pattern: /Subtract:\s*/gi, replace: 'घटाएं: ' },
    { pattern: /Simplify:\s*/gi, replace: 'सरल करें: ' },
    { pattern: /Convert\s+([^\s]+)\s+to\s+([^\s\.]+)/gi, replace: '$1 को $2 में बदलें' },
    { pattern: /Convert\s+/gi, replace: 'बदलें ' },
    { pattern: /Dividing both numerator and denominator by (\d+)/gi, replace: 'अंश और हर दोनों को $1 से विभाजित करने पर' },
    { pattern: /gives/gi, replace: 'मिलता है' },
    { pattern: /Since the denominators are equal/gi, replace: 'चूंकि हर समान हैं' },
    { pattern: /add numerators/gi, replace: 'अंशों को जोड़ें' },
    { pattern: /So answer is/gi, replace: 'अतः उत्तर है' },
    { pattern: /With the same denominator/gi, replace: 'समान हर होने पर' },
  ],
  bn: [
    { pattern: /in simplest form\?/gi, replace: 'এর সরলতম রূপ কত হবে?' },
    { pattern: /in lowest terms\?/gi, replace: 'এর সর্বনিম্ন রূপ কত?' },
    { pattern: /^What is\s+/gi, replace: '' },
    { pattern: /Solve:\s*/gi, replace: 'সমাধান করুন: ' },
    { pattern: /Subtract:\s*/gi, replace: 'বিয়োগ করুন: ' },
    { pattern: /Simplify:\s*/gi, replace: 'সরল করুন: ' },
    { pattern: /Convert\s+([^\s]+)\s+to\s+([^\s\.]+)/gi, replace: '$1 কে $2 এ রূপান্তর করুন' },
    { pattern: /Convert\s+/gi, replace: 'রূপান্তর করুন ' },
    { pattern: /Dividing both numerator and denominator by (\d+)/gi, replace: 'লব এবং হর উভয়কে $1 দিয়ে ভাগ করলে' },
    { pattern: /gives/gi, replace: 'পাওয়া যায়' },
    { pattern: /Since the denominators are equal/gi, replace: 'যেহেতু হর সমান' },
    { pattern: /add numerators/gi, replace: 'লব যোগ করুন' },
    { pattern: /So answer is/gi, replace: 'সুতরাং উত্তর হলো' },
    { pattern: /With the same denominator/gi, replace: 'সমান হর থাকলে' },
  ],
  ml: [
    { pattern: /in simplest form\?/gi, replace: 'ന്റെ ലളിതമായ രൂപം ഏതാണ്?' },
    { pattern: /^What is\s+/gi, replace: '' },
    { pattern: /Solve:\s*/gi, replace: 'പരിഹരിക്കുക: ' },
    { pattern: /Subtract:\s*/gi, replace: 'കുറയ്ക്കുക: ' },
    { pattern: /Simplify:\s*/gi, replace: 'ലഘൂകരിക്കുക: ' },
    { pattern: /Convert\s+([^\s]+)\s+to\s+([^\s\.]+)/gi, replace: '$1 നെ $2 ആക്കി മാറ്റുക' },
    { pattern: /Convert\s+/gi, replace: 'മാറ്റുക ' },
    { pattern: /gives/gi, replace: 'ലഭിക്കും' },
    { pattern: /So answer is/gi, replace: 'അതുകൊണ്ട് ഉത്തരം' },
  ],
  ta: [
    { pattern: /in simplest form\?/gi, replace: 'இன் எளிய வடிவம் என்ன?' },
    { pattern: /^What is\s+/gi, replace: '' },
    { pattern: /Solve:\s*/gi, replace: 'தீர்வு காண்க: ' },
    { pattern: /Subtract:\s*/gi, replace: 'கழிக்கவும்: ' },
    { pattern: /Simplify:\s*/gi, replace: 'சுருக்குக: ' },
    { pattern: /Convert\s+([^\s]+)\s+to\s+([^\s\.]+)/gi, replace: '$1 ஐ $2 ஆக மாற்றுக' },
    { pattern: /Convert\s+/gi, replace: 'மாற்றுக ' },
    { pattern: /gives/gi, replace: 'கிடைக்கும்' },
  ],
  te: [
    { pattern: /in simplest form\?/gi, replace: 'యొక్క సరళ రూపం ఏమిటి?' },
    { pattern: /^What is\s+/gi, replace: '' },
    { pattern: /Solve:\s*/gi, replace: 'సాధించండి: ' },
    { pattern: /Subtract:\s*/gi, replace: 'తీసివేయండి: ' },
    { pattern: /Simplify:\s*/gi, replace: 'సులభతరం చేయండి: ' },
    { pattern: /Convert\s+([^\s]+)\s+to\s+([^\s\.]+)/gi, replace: '$1 ని $2 గా మార్చండి' },
    { pattern: /Convert\s+/gi, replace: 'మార్చండి ' },
    { pattern: /gives/gi, replace: 'వస్తుంది' },
  ],
  mr: [
    { pattern: /in simplest form\?/gi, replace: 'चे संक्षिप्त रूप काय आहे?' },
    { pattern: /^What is\s+/gi, replace: '' },
    { pattern: /Solve:\s*/gi, replace: 'सोडवा: ' },
    { pattern: /Subtract:\s*/gi, replace: 'वजा करा: ' },
    { pattern: /Simplify:\s*/gi, replace: 'संक्षिप्त करा: ' },
    { pattern: /Convert\s+([^\s]+)\s+to\s+([^\s\.]+)/gi, replace: '$1 चे $2 मध्ये रूपांतर करा' },
    { pattern: /Convert\s+/gi, replace: 'रूपांतर करा ' },
    { pattern: /gives/gi, replace: 'मिळते' },
  ],
  gu: [
    { pattern: /in simplest form\?/gi, replace: 'નું સરળ રૂપ શું છે?' },
    { pattern: /^What is\s+/gi, replace: '' },
    { pattern: /Solve:\s*/gi, replace: 'ઉકેલો: ' },
    { pattern: /Subtract:\s*/gi, replace: 'બાદ કરો: ' },
    { pattern: /Simplify:\s*/gi, replace: 'સરળ બનાવો: ' },
    { pattern: /Convert\s+/gi, replace: 'બદલો ' },
  ],
  kn: [
    { pattern: /in simplest form\?/gi, replace: 'ನ ಸರಳ ರೂಪ ಯಾವುದು?' },
    { pattern: /^What is\s+/gi, replace: '' },
    { pattern: /Solve:\s*/gi, replace: 'ಪರಿಹರಿಸಿ: ' },
    { pattern: /Subtract:\s*/gi, replace: 'ಕಳೆಯಿರಿ: ' },
    { pattern: /Simplify:\s*/gi, replace: 'ಸರಳೀಕರಿಸಿ: ' },
  ],
  pa: [
    { pattern: /in simplest form\?/gi, replace: 'ਦਾ ਸਰਲ ਰੂਪ ਕੀ ਹੈ?' },
    { pattern: /^What is\s+/gi, replace: '' },
    { pattern: /Solve:\s*/gi, replace: 'ਹੱਲ ਕਰੋ: ' },
    { pattern: /Subtract:\s*/gi, replace: 'ਘਟਾਓ: ' },
    { pattern: /Simplify:\s*/gi, replace: 'ਸਰਲ ਕਰੋ: ' },
  ],
  or: [
    { pattern: /in simplest form\?/gi, replace: 'ର ସରଳ ରୂପ କଣ?' },
    { pattern: /^What is\s+/gi, replace: '' },
    { pattern: /Solve:\s*/gi, replace: 'ସମାଧାନ କରନ୍ତୁ: ' },
    { pattern: /Subtract:\s*/gi, replace: 'ବିଯୋଗ କରନ୍ତୁ: ' },
    { pattern: /Simplify:\s*/gi, replace: 'ସରଳୀକରଣ କରନ୍ତୁ: ' },
  ],
  as: [
    { pattern: /in simplest form\?/gi, replace: 'ৰ সৰল ৰূপ কি হ’ব?' },
    { pattern: /^What is\s+/gi, replace: '' },
    { pattern: /Solve:\s*/gi, replace: 'সমাধান কৰক: ' },
    { pattern: /Subtract:\s*/gi, replace: 'বিয়োগ কৰক: ' },
    { pattern: /Simplify:\s*/gi, replace: 'সৰল কৰক: ' },
  ],
  ur: [
    { pattern: /in simplest form\?/gi, replace: 'کا مختصر ترین روپ کیا ہے؟' },
    { pattern: /^What is\s+/gi, replace: '' },
    { pattern: /Solve:\s*/gi, replace: 'حل کریں: ' },
    { pattern: /Subtract:\s*/gi, replace: 'تفریق کریں: ' },
    { pattern: /Simplify:\s*/gi, replace: 'مختصر کریں: ' },
  ],
};

// Full Native Translations for all Seed Questions
const QUESTION_TRANSLATION_DICTIONARY: Record<string, Partial<Record<LanguageCode, { text: string; explanation: string }>>> = {
  'frac-e1': {
    hi: { text: 'यदि 4 बराबर भागों में से 1 भाग रंगा गया है, तो वृत्त का कौन सा भिन्न रंगा हुआ है?', explanation: 'कुल 4 बराबर भागों में से 1 रंगा हुआ भाग 1/4 होता है।' },
    bn: { text: 'যদি ৪টি সমান অংশের ১টি অংশ রঙ করা হয়, তবে বৃত্তের কত ভগ্নাংশ রঙ করা হয়েছে?', explanation: 'মোট ৪টি সমান অংশের মধ্যে ১টি চিহ্নিত অংশ হলো ১/৪।' },
    ml: { text: '4 തുല്യ ഭാഗങ്ങളിൽ 1 ഭാഗം ഷെയ്ഡ് ചെയ്താൽ, വൃത്തത്തിന്റെ എത്ര ഭാഗമാണ് ഷെയ്ഡ് ചെയ്തിരിക്കുന്നത്?', explanation: 'ആകെ 4 തുല്യ ഭാഗങ്ങളിൽ 1 ഭാഗം ഷെയ്ഡ് ചെയ്യുന്നത് 1/4 ആണ്.' },
    ta: { text: '4 சம பாகங்களில் 1 பாகம் நிழலிடப்பட்டால், வட்டத்தின் எந்த பின்னம் நிழலிடப்பட்டுள்ளது?', explanation: 'மொத்தம் 4 சம பாகங்களில் 1 பாகம் நிழலிடப்பட்டது 1/4 ஆகும்.' },
    te: { text: '4 సమాన భాగాలలో 1 భాగం షేడ్ చేయబడితే, వృత్తంలో ఎంత భిన్నం షేడ్ చేయబడింది?', explanation: 'మొత్తం 4 సమాన భాగాలలో 1 భాగం షేడ్ చేయడం అంటే 1/4.' },
    mr: { text: 'जर ४ समान भागांपैकी १ भाग रंगवला असेल, तर वर्तुळाचा कोणता अपूर्णांक रंगवलेला आहे?', explanation: 'एकूण ४ समान भागांपैकी १ रंगवलेला भाग म्हणजे १/४.' },
  },
  'frac-e2': {
    hi: { text: 'भिन्न 2/4 को उसके सरलतम रूप में लिखें।', explanation: 'अंश और हर दोनों को 2 से विभाजित करने पर 1/2 मिलता है।' },
    bn: { text: '২/৪ ভগ্নাংশটিকে সরলতম রূপে প্রকাশ করুন।', explanation: 'লব এবং হর উভয়কেই ২ দিয়ে ভাগ করলে ১/২ পাওয়া যায়।' },
    ml: { text: '2/4 എന്ന ഭിന്നസംഖ്യയെ അതിന്റെ ലളിതമായ രൂപത്തിലേക്ക് മാറ്റുക.', explanation: 'അംശത്തെയും ഛേദത്തെയും 2 കൊണ്ട് ഹരിച്ചാൽ 1/2 ലഭിക്കും.' },
    ta: { text: '2/4 என்ற பின்னத்தை அதன் எளிய வடிவத்திற்கு சுருக்குக.', explanation: 'தொகுதி மற்றும் பகுதியை 2 ஆல் வகுத்தால் 1/2 கிடைக்கும்.' },
    te: { text: '2/4 భిన్నాన్ని దాని సరళ రూపంలోకి మార్చండి.', explanation: 'లంబము మరియు హారము రెండింటినీ 2 చే భాగించగా 1/2 వస్తుంది.' },
    mr: { text: '२/४ या अपूर्णांकाचे संक्षिप्त रूप लिहा.', explanation: 'अंश आणि छेद दोघांना २ ने भागल्यास १/२ मिळते.' },
  },
  'frac-e3': {
    hi: { text: '1/5 + 2/5 का मान क्या है?', explanation: 'चूंकि हर समान हैं, अंशों को जोड़ें: (1+2)/5 = 3/5।' },
    bn: { text: '১/৫ + ২/৫ এর মান কত হবে?', explanation: 'যেহেতু হর সমান, লব যোগ করুন: (১+২)/৫ = ৩/৫।' },
    ml: { text: '1/5 + 2/5 എത്രയാണ്?', explanation: 'ഛേദങ്ങൾ തുല്യമായതിനാൽ അംശങ്ങൾ കൂട്ടുക: (1+2)/5 = 3/5.' },
    ta: { text: '1/5 + 2/5 இன் மதிப்பு என்ன?', explanation: 'பகுதிகள் சமமாக இருப்பதால், தொகுதிகளைக் கூட்டுங்கள்: (1+2)/5 = 3/5.' },
    te: { text: '1/5 + 2/5 విలువ ఎంత?', explanation: 'హారాలు సమానంగా ఉన్నందున, లంబాలను కూడండి: (1+2)/5 = 3/5.' },
    mr: { text: '१/५ + २/५ चे मूल्य काय आहे?', explanation: 'छेद समान असल्याने अंशांची बेरीज करा: (१+२)/५ = ३/५.' },
  },
  'frac-m1': {
    hi: { text: 'हल करें: 1/3 + 1/6.', explanation: '1/3 को 2/6 में बदलें। फिर 2/6 + 1/6 = 3/6, जो सरल होकर 1/2 बनता है।' },
    bn: { text: 'সমাধান করুন: ১/৩ + ১/৬।', explanation: '১/৩ কে ২/৬ এ রূপান্তর করুন। তারপর ২/৬ + ১/৬ = ৩/৬ = ১/২।' },
    ml: { text: 'പരിഹരിക്കുക: 1/3 + 1/6.', explanation: '1/3 നെ 2/6 ആക്കി മാറ്റുക. തുടർന്ന് 2/6 + 1/6 = 3/6 = 1/2.' },
    ta: { text: 'தீர்வு காண்க: 1/3 + 1/6.', explanation: '1/3 ஐ 2/6 ஆக மாற்றுக. பின் 2/6 + 1/6 = 3/6 = 1/2.' },
    te: { text: 'సాధించండి: 1/3 + 1/6.', explanation: '1/3 ని 2/6 గా మార్చండి. అప్పుడు 2/6 + 1/6 = 3/6 = 1/2.' },
    mr: { text: 'सोडवा: १/३ + १/६.', explanation: '१/३ चे २/६ मध्ये रूपांतर करा. नंतर २/६ + १/६ = ३/६ = १/२.' },
  },
  'frac-m2': {
    hi: { text: 'घटाएं: 3/4 - 1/2.', explanation: '1/2 का मान 2/4 होता है। 3/4 में से 2/4 घटाने पर 1/4 बचता है।' },
    bn: { text: 'বিয়োগ করুন: ৩/৪ - ১/২।', explanation: '১/২ এর মান ২/৪। ৩/৪ থেকে ২/৪ বিয়োগ করলে ১/৪ থাকে।' },
    ml: { text: 'കുറയ്ക്കുക: 3/4 - 1/2.', explanation: '1/2 എന്നാൽ 2/4 ആണ്. 3/4 ൽ നിന്ന് 2/4 കുറച്ചാൽ 1/4 ലഭിക്കും.' },
    ta: { text: 'கழிக்கவும்: 3/4 - 1/2.', explanation: '1/2 என்பது 2/4 ஆகும். 3/4 இலிருந்து 2/4 ஐக் கழித்தால் 1/4 கிடைக்கும்.' },
    te: { text: 'తీసివేయండి: 3/4 - 1/2.', explanation: '1/2 అంటే 2/4. 3/4 నుండి 2/4 తీసివేస్తే 1/4 వస్తుంది.' },
    mr: { text: 'वजा करा: ३/४ - १/२.', explanation: '१/२ म्हणजे २/४. ३/४ मधून २/४ वजा केल्यास १/४ उरते.' },
  },
  'frac-h2': {
    hi: { text: '(3/4) × (2/5) का सरलतम रूप क्या है?', explanation: '(3 × 2) / (4 × 5) = 6/20। अंश और हर को 2 से भाग देने पर 3/10 प्राप्त होता है।' },
    bn: { text: '(৩/৪) × (২/৫) এর সরলতম রূপ কত হবে?', explanation: '(৩ × ২) / (৪ × ৫) = ৬/২০। লব এবং হর উভয়কে ২ দিয়ে ভাগ করলে ৩/১০ পাওয়া যায়।' },
    ml: { text: '(3/4) × (2/5) ന്റെ ഏറ്റവും ലളിതമായ രൂപം ഏതാണ്?', explanation: '(3 × 2) / (4 × 5) = 6/20. അംശത്തെയും ഛേദത്തെയും 2 കൊണ്ട് ഹരിച്ചാൽ 3/10 ലഭിക്കും.' },
    ta: { text: '(3/4) × (2/5) இன் எளிய வடிவம் என்ன?', explanation: '(3 × 2) / (4 × 5) = 6/20. தொகுதி மற்றும் பகுதியை 2 ஆல் வகுத்தால் 3/10 கிடைக்கும்.' },
    te: { text: '(3/4) × (2/5) యొక్క సరళ రూపం ఏమిటి?', explanation: '(3 × 2) / (4 × 5) = 6/20. లంబము మరియు హారము రెండింటినీ 2 చే భాగించగా 3/10 వస్తుంది.' },
    mr: { text: '(३/४) × (२/५) चे संक्षिप्त रूप काय आहे?', explanation: '(३ × २) / (४ × ५) = ६/२०. अंश आणि छेद दोघांना २ ने भागल्यास ३/१० मिळते.' },
    gu: { text: '(૩/૪) × (૨/૫) નું સરળ રૂપ શું છે?', explanation: '(૩ × ૨) / (૪ × ૫) = ૬/૨૦. અંશ અને છેદને ૨ વડે ભાગતા ૩/૧૦ મળે છે.' },
    kn: { text: '(3/4) × (2/5) ನ ಸರಳ ರೂಪ ಯಾವುದು?', explanation: '(3 × 2) / (4 × 5) = 6/20. ಅಂಶ ಮತ್ತು ಛೇದವನ್ನು 2 ರಿಂದ ભાગಿಸಿದಾಗ 3/10 ಸಿಗುತ್ತದೆ.' },
    pa: { text: '(3/4) × (2/5) ਦਾ ਸਰਲ ਰੂਪ ਕੀ ਹੈ?', explanation: "(3 × 2) / (4 × 5) = 6/20. 2 ਨਾਲ ਵੰਡਣ 'ਤੇ 3/10 ਪ੍ਰਾਪਤ ਹੁੰਦਾ ਹੈ।" },
    or: { text: '(୩/୪) × (୨/୫) ର ସରଳ ରୂପ କଣ?', explanation: '(୩ × ୨) / (୪ × ୫) = ୬/୨୦. ୨ ଦ୍ୱାରା ଭାଗ କଲେ ୩/୧୦ ମିଳିଥାଏ।' },
    as: { text: '(৩/৪) × (২/৫) ৰ সৰল ৰূপ কি হ’ব?', explanation: '(৩ × ২) / (৪ × ৫) = ৬/২০। ২ ৰে ভাগ কৰিলে ৩/১০ পোৱা যায়।' },
    ur: { text: '(3/4) × (2/5) کا مختصر ترین روپ کیا ہے؟', explanation: '(3 × 2) / (4 × 5) = 6/20۔ 2 سے تقسیم کرنے پر 3/10 حاصل ہوتا ہے۔' },
  },
  'rat-e1': {
    hi: { text: 'एक कक्षा में 10 लड़के और 15 लड़कियाँ हैं। लड़कों का लड़कियों से अनुपात सरलतम रूप में क्या है?', explanation: '10 और 15 दोनों को 5 से विभाजित करने पर 2:3 मिलता है।' },
    bn: { text: 'একটি শ্রেণীতে ১০ জন ছেলে এবং ১৫ জন মেয়ে আছে। ছেলেদের সাথে মেয়েদের অনুপাত সরলতম রূপে কত?', explanation: '১০ এবং ১৫ উভয়কে ৫ দিয়ে ভাগ করলে ২:৩ পাওয়া যায়।' },
    ml: { text: 'ഒരു ക്ലാസിൽ 10 ആൺകുട്ടികളും 15 പെൺകുട്ടികളുമുണ്ട്. ആൺകുട്ടികളും പെൺകുട്ടികളും തമ്മിലുള്ള അംശബന്ധം എത്രയാണ്?', explanation: '10 നെയും 15 നെയും 5 കൊണ്ട് ഹരിച്ചാൽ 2:3 ലഭിക്കും.' },
    ta: { text: 'ஒரு வகுப்பில் 10 சிறுவர்களும் 15 சிறுமிகளும் உள்ளனர். சிறுவர்களுக்கும் சிறுமிகளுக்கும் இடையிலான விகிதம் என்ன?', explanation: '10 மற்றும் 15 ஐ 5 ஆல் வகுத்தால் 2:3 கிடைக்கும்.' },
    te: { text: 'ఒక తరగతిలో 10 మంది బాలురు మరియు 15 మంది బాలికలు ఉన్నారు. వారి నిష్పత్తి ఎంత?', explanation: '10 మరియు 15 లను 5 చే భాగించగా 2:3 వస్తుంది.' },
    mr: { text: 'एका वर्गात १० मुले आणि १५ मुली आहेत. मुलांचे मुलींशी गुणोत्तर काय आहे?', explanation: '१० आणि १५ दोघांना ५ ने भागल्यास २:३ मिळते.' },
  },
};

/**
 * Returns clean, fully native translated question text & explanation.
 */
export function translateQuestionContent(
  q: Question,
  lang: LanguageCode
): { text: string; explanation: string; options?: string[] } {
  // If English, return original English
  if (lang === 'en') {
    return { text: q.questionText, explanation: q.explanation, options: q.options };
  }

  // 1. Check exact dictionary match for specific question ID
  const dict = QUESTION_TRANSLATION_DICTIONARY[q.id];
  if (dict && dict[lang]) {
    return {
      text: dict[lang]!.text,
      explanation: dict[lang]!.explanation,
      options: (lang === 'hi' && q.optionsHindi) ? q.optionsHindi : undefined,
    };
  }

  // 2. Base text, explanation, and options sources
  let text = (lang === 'hi' && q.questionTextHindi) ? q.questionTextHindi : q.questionText;
  let exp = (lang === 'hi' && q.explanationHindi && q.explanationHindi !== q.explanation)
    ? q.explanationHindi
    : q.explanation;
  let options = (lang === 'hi' && q.optionsHindi) ? q.optionsHindi : undefined;

  // 3. Apply phrase replacements pipeline for the target language
  const replacements = PHRASE_REPLACEMENTS[lang] || [];
  replacements.forEach(r => {
    text = text.replace(r.pattern, r.replace);
    exp  = exp.replace(r.pattern, r.replace);
  });

  return {
    text,
    explanation: exp,
    options,
  };
}

/**
 * Automatically translates English question/explanation text to Hindi for AI/Teacher custom question creation.
 */
export function autoTranslateEnglishToHindi(text: string): string {
  if (!text || !text.trim()) return '';

  let res = text.trim();
  const rules: Array<[RegExp, string]> = [
    [/^What is\s+/gi, ''],
    [/in simplest form\?/gi, 'का सरलतम रूप क्या है?'],
    [/in lowest terms\?/gi, 'का न्यूनतम रूप क्या है?'],
    [/^Solve:\s*/gi, 'हल करें: '],
    [/^Calculate\s+/gi, 'गणना करें '],
    [/Simplify:\s*/gi, 'सरल करें: '],
    [/^Simplify\s+/gi, 'सरल करें '],
    [/Subtract:\s*/gi, 'घटाएं: '],
    [/Convert\s+([^\s]+)\s+to\s+([^\s\.\,]+)/gi, '$1 को $2 में बदलें'],
    [/Convert\s+/gi, 'बदलें '],
    [/to\s+/gi, 'में '],
    [/^Find the area of\s+/gi, 'क्षेत्रफल ज्ञात करें: '],
    [/^Find the perimeter of\s+/gi, 'परिमाप ज्ञात करें: '],
    [/equals\s+/gi, 'बराबर है '],
    [/divided by\s+/gi, 'भाग '],
    [/multiplied by\s+/gi, 'गुना '],
  ];

  rules.forEach(([pattern, replacement]) => {
    res = res.replace(pattern, replacement);
  });

  if (text.endsWith('?') && !res.endsWith('?') && !res.includes('क्या')) {
    res = `${res} का मान क्या होगा?`;
  }

  return res;
}
