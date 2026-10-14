// Imported only by the authenticated server handler, never by client pages.
const practiceQuestions = [
  {
    question: "ما المقصود بالذكاء الاصطناعي؟",
    options: [
      "تقنية تجعل الأجهزة تنفذ مهامًا تحتاج إلى ذكاء",
      "نوع من أنواع الإنترنت",
      "برنامج للرسم فقط",
      "جهاز لتخزين الملفات",
    ],
    correct: 0,
  },
  {
    question: "هل يستطيع الذكاء الاصطناعي التعلم من البيانات؟",
    options: ["نعم", "لا"],
    correct: 0,
  },
  {
    question: "هل يمكن للذكاء الاصطناعي أن يخطئ؟",
    options: ["نعم، قد يخطئ", "لا، لا يخطئ أبدًا"],
    correct: 0,
  },
];

export function practiceQuizQuestions() {
  return practiceQuestions.map(({ question, options }) => ({ question, options: [...options] }));
}
export function validPracticeAnswers(answers) {
  return Array.isArray(answers) && answers.length === practiceQuestions.length && answers.every((answer, index) => Number.isSafeInteger(answer) && answer >= 0 && answer < practiceQuestions[index].options.length);
}
export function gradePracticeQuiz(answers) {
  if (!validPracticeAnswers(answers)) return null;
  return { score: answers.reduce((sum, answer, index) => sum + Number(answer === practiceQuestions[index].correct), 0), total_points: practiceQuestions.length };
}
