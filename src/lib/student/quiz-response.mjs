// The student page consumes only these fields. Never forward a raw RPC result:
// it could contain answer keys, scoring internals or other students' attempts.
const record = value => value !== null && typeof value === "object" && !Array.isArray(value);
const positiveId = value => Number.isSafeInteger(value) && value > 0;
const optionalText = value => value === null || value === undefined || typeof value === "string";
export function studentQuizResponse(data, quizId) {
  if (!record(data) || !record(data.quiz) || data.quiz.id !== quizId || typeof data.quiz.title !== "string" || !optionalText(data.quiz.description) || !Array.isArray(data.questions) || data.questions.length > 500) return null;
  const questions = [];
  const questionIds = new Set();
  for (const question of data.questions) {
    if (!record(question) || !positiveId(question.id) || questionIds.has(question.id) || typeof question.question_text !== "string" || !optionalText(question.image_url) || !Array.isArray(question.options) || question.options.length > 100) return null;
    questionIds.add(question.id);
    const options = []; const optionIds = new Set();
    for (const option of question.options) {
      if (!record(option) || !positiveId(option.id) || optionIds.has(option.id) || typeof option.option_text !== "string") return null;
      optionIds.add(option.id);
      options.push({ id: option.id, option_text: option.option_text });
    }
    const points = question.points;
    if (points !== null && points !== undefined && (typeof points !== "number" || !Number.isFinite(points) || points < 0)) return null;
    questions.push({ id: question.id, question_text: question.question_text, points: points ?? null, image_url: question.image_url ?? null, options });
  }
  const minutes = data.quiz.time_limit_minutes;
  if (minutes !== null && minutes !== undefined && (!positiveId(minutes))) return null;
  return { quiz: { id: data.quiz.id, title: data.quiz.title, description: data.quiz.description ?? null, time_limit_minutes: minutes ?? null }, questions };
}
export function studentScoreResponse(data) {
  if (!record(data) || ![data.score, data.total_points].every(value => (typeof value === "number" || (typeof value === "string" && value.trim() !== "")) && Number.isFinite(Number(value)) && Number(value) >= 0)) return null;
  return { score: Number(data.score), total_points: Number(data.total_points) };
}
