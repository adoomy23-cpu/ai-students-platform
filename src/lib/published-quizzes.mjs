// Reads only existing public quiz fields; no student records or RPCs.
export async function readPublishedQuizzes(client) {
  const { data, error } = await client.from("quizzes")
    .select("id,title,status").eq("status", "published").limit(24);
  if (error || !Array.isArray(data)) return { status: "error", quizzes: [] };
  const quizzes = data.filter((quiz) => quiz &&
    /^[1-9]\d*$/.test(String(quiz.id)) && Number.isSafeInteger(Number(quiz.id)) &&
    typeof quiz.title === "string" && quiz.title.trim() && quiz.status === "published");
  return { status: quizzes.length ? "ready" : "empty", quizzes };
}
