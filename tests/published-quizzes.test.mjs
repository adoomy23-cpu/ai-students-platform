import test from "node:test";
import assert from "node:assert/strict";
import { readPublishedQuizzes } from "../src/lib/published-quizzes.mjs";

function clientWith(result) {
  const calls = [];
  const query = {
    select(fields) { calls.push(["select", fields]); return this; },
    eq(field, value) { calls.push(["eq", field, value]); return this; },
    limit(value) { calls.push(["limit", value]); return Promise.resolve(result); },
  };
  return { calls, from(table) { calls.push(["from", table]); return query; } };
}

test("requests only bounded published quiz metadata, never student data", async () => {
  const client = clientWith({ data: [{ id: 7, title: "اختبار", status: "published" }], error: null });
  assert.equal((await readPublishedQuizzes(client)).status, "ready");
  assert.deepEqual(client.calls, [["from", "quizzes"], ["select", "id,title,status"], ["eq", "status", "published"], ["limit", 24]]);
});
test("distinguishes an empty list from a database failure", async () => {
  assert.deepEqual(await readPublishedQuizzes(clientWith({ data: [], error: null })), { status: "empty", quizzes: [] });
  assert.deepEqual(await readPublishedQuizzes(clientWith({ data: null, error: { message: "private diagnostic" } })), { status: "error", quizzes: [] });
});
test("does not expose server diagnostic messages", async () => {
  const result = await readPublishedQuizzes(clientWith({ data: [], error: { message: "sensitive" } }));
  assert.equal(JSON.stringify(result).includes("sensitive"), false);
});
test("rejects unsafe identifiers, drafts and malformed records", async () => {
  const data = [null, { id: "../admin", title: "bad", status: "published" }, { id: 0, title: "bad", status: "published" },
    { id: 2, title: "draft", status: "draft" }, { id: 3, title: "  ", status: "published" },
    { id: "9007199254740993", title: "bad", status: "published" }, { id: "12", title: "منشور", status: "published" }];
  assert.deepEqual((await readPublishedQuizzes(clientWith({ data, error: null }))).quizzes, [data.at(-1)]);
});
test("treats malformed query responses as errors", async () => {
  assert.equal((await readPublishedQuizzes(clientWith({ data: {}, error: null }))).status, "error");
});
test("connection exceptions reach the component error handler", async () => {
  await assert.rejects(readPublishedQuizzes({ from() { throw new Error("offline"); } }), /offline/);
});
