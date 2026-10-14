"use client";

import SchoolIcon from "../../../components/brand/SchoolIcon";
import { EmptyState, Button, Card, Feedback, Input, PageSurface, Textarea } from "../../../components/platform/PlatformUI";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccess } from "../../../components/platform/AuthProvider";
import StudentIdentity from "../../../components/student/StudentIdentity";
import { requestStudent, uploadStudentFile } from "../../../lib/student/browser-client";

async function requestPage(challengeId) {
  return { challengeResult: await requestStudent("challenge.load", { id: challengeId }) };
}

export default function ChallengeDetailsPage() {
  const access = useAccess();
  const studentId = access.student?.profile?.id;
  const params = useParams();
  const challengeId = Number(params?.id);

  const [challenge, setChallenge] = useState(null);
  const [loadedChallengeId, setLoadedChallengeId] = useState(null);
  const [submissionText, setSubmissionText] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [fileFile, setFileFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!Number.isSafeInteger(challengeId) || challengeId <= 0) return;
    let active = true;

    requestPage(challengeId)
      .then(({ challengeResult }) => {
      if (!active) return;
      setLoadedChallengeId(challengeId);
      setMessage("");
      if (challengeResult.error) {
        setChallenge(null);
        setMessage("تعذر تحميل التحدي.");
      } else {
        setChallenge(challengeResult.data);
      }

      setLoading(false);
      })
      .catch(() => {
      if (!active) return;
      setLoadedChallengeId(challengeId);
      setChallenge(null);
      setMessage("تعذر تحميل التحدي. حاول مرة أخرى لاحقًا.");
      setLoading(false);
      });
    return () => { active = false; };
  }, [challengeId]);

  async function submitChallenge(e) {
    e.preventDefault();

    if (sending) return;
    if (!studentId) {
      setMessage("تعذر التحقق من هوية حسابك. أعد تسجيل الدخول.");
      return;
    }

    const hasContent =
      submissionText.trim() ||
      imageFile ||
      fileFile;

    if (!hasContent) {
      setMessage("أضف مشاركة واحدة على الأقل قبل الإرسال.");
      return;
    }

    setSending(true);
    setMessage("");

    let uploadedImagePath = null;
    let uploadedFilePath = null;

    try {
      if (challenge?.allow_image && imageFile) {
        const upload = await uploadStudentFile(challengeId, "image", imageFile);
        if (upload.error || !upload.data?.path) throw new Error("upload");
        uploadedImagePath = upload.data.path;
      }
      if (challenge?.allow_file && fileFile) {
        const upload = await uploadStudentFile(challengeId, "file", fileFile);
        if (upload.error || !upload.data?.path) throw new Error("upload");
        uploadedFilePath = upload.data.path;
      }
    } catch {
      setMessage("تعذر رفع الملف. تحقق من نوعه وحجمه (حتى 10 ميجابايت) ثم حاول مجددًا.");
      setSending(false);
      return;
    }
    const { error } = await requestStudent("challenge.submit", {
      id: challengeId,
      text: challenge?.allow_text && submissionText.trim() ? submissionText.trim() : null,
      imagePath: uploadedImagePath,
      filePath: uploadedFilePath,
    });

    if (error) {
      setMessage("تعذر إرسال المشاركة. تحقق من حالة حسابك ثم حاول مجددًا.");
    } else {
      setMessage("تم إرسال مشاركتك بنجاح");
      setSubmissionText("");
      setImageFile(null);
      setFileFile(null);
    }

    setSending(false);
  }

  if (!Number.isSafeInteger(challengeId) || challengeId <= 0) {
    return <PageSurface dir="rtl" style={styles.center}><Feedback tone="error">معرّف التحدي غير صالح.</Feedback></PageSurface>;
  }

  if (loading || loadedChallengeId !== challengeId) {
    return (
      <PageSurface dir="rtl" style={styles.center}>
        <EmptyState loading>جاري تحميل التحدي...</EmptyState>
      </PageSurface>
    );
  }

  if (!challenge) {
    return (
      <PageSurface dir="rtl" style={styles.center}>
        <Feedback tone="error"><h2>التحدي غير متاح</h2><p>{message || "حاول مرة أخرى لاحقًا."}</p></Feedback>
      </PageSurface>
    );
  }

  return (
    <PageSurface dir="rtl" style={styles.page}>
      <div style={styles.container}>


        <section className="platform-hero" style={styles.hero}>
          <div style={styles.heroIcon}><SchoolIcon name="trophy" size={32} /></div>

          <div>
            <div style={styles.badge}>
              تحدي الذكاء الاصطناعي
            </div>

            <h1 style={styles.title}>
              {challenge.title}
            </h1>

            {challenge.description && (
              <p style={styles.description}>
                {challenge.description}
              </p>
            )}

            <div style={styles.meta}>
              <span>
                <SchoolIcon name="compass" size={22} /> {challenge.max_score} درجة
              </span>

              {challenge.allow_text && <span><SchoolIcon name="pencil" size={22} /> نص</span>}
              {challenge.allow_image && <span><SchoolIcon name="image" size={22} /> صورة</span>}
              {challenge.allow_file && <span><SchoolIcon name="paperclip" size={22} /> ملف</span>}
            </div>
          </div>
        </section>

        {challenge.instructions && (
          <Card as="section" style={styles.card}>
            <h2 style={styles.cardTitle}>
              <SchoolIcon name="spark" size={22} /> تعليمات المشاركة
            </h2>

            <p style={styles.instructions}>
              {challenge.instructions}
            </p>
          </Card>
        )}

        {message && (
          <Feedback style={styles.message}>
            {message}
          </Feedback>
        )}

        <form
          onSubmit={submitChallenge}
          style={styles.card}
        >
          <h2 style={styles.cardTitle}>المشاركة باسم حسابك</h2>
          <StudentIdentity />

          <h2 style={styles.participationTitle}>
            <SchoolIcon name="rocket" size={22} /> أرسل مشاركتك
          </h2>

          {challenge.allow_text && (
            <div>
              <label htmlFor="field-challengesid-4" style={styles.label}>
                <SchoolIcon name="pencil" size={22} /> المشاركة النصية
              </label>

              <Textarea id="field-challengesid-4"
                value={submissionText}
                onChange={(e) =>
                  setSubmissionText(e.target.value)
                }
                style={styles.textarea}
                placeholder="اكتب مشاركتك هنا..."
              />
            </div>
          )}

          {challenge.allow_image && (
            <div>
              <label htmlFor="field-challengesid-5" style={styles.label}>
                <SchoolIcon name="image" size={22} /> اختر صورة من جهازك
              </label>

              <Input id="field-challengesid-5"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) =>
                  setImageFile(e.target.files?.[0] || null)
                }
                style={styles.input}
              />
            </div>
          )}

          <p className="student-upload-note">الحد الأقصى لكل ملف 10 ميجابايت. الصور: JPG وPNG وWEBP وGIF. الملفات: PDF والنصوص ومستندات Office وZIP وScratch.</p>

          {challenge.allow_file && (
            <div>
              <label htmlFor="field-challengesid-6" style={styles.label}>
                <SchoolIcon name="paperclip" size={22} /> اختر ملفًا من جهازك
              </label>

              <Input id="field-challengesid-6"
                type="file" accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xlsx,.zip,.sb3"
                onChange={(e) =>
                  setFileFile(e.target.files?.[0] || null)
                }
                style={styles.input}
              />
            </div>
          )}

          <Button variant="primary" icon="check"
            type="submit"
            disabled={sending}
            style={styles.button}
          >
            {sending
              ? "جارٍ إرسال المشاركة..."
              : "إرسال المشاركة"}
          </Button>
        </form>
      </div>
    </PageSurface>
  );
}

const styles = {
  page: {
    minHeight: "360px",
    background: "var(--surface-soft)",
    padding: "24px 14px 60px",
    fontFamily: "var(--font-body)",
    color: "var(--ink)",
  },

  center: {
    minHeight: "360px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "var(--font-body)",
  },

  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },

  back: {
    display: "inline-block",
    marginBottom: "18px",
    padding: "10px 15px",
    borderRadius: "11px",
    background: "var(--surface)",
    color: "var(--copper-ink)",
    textDecoration: "none",
  },

  hero: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    background:
      "var(--gold-soft)",
    color: "var(--ink)",
    padding: "30px",
    borderRadius: "24px",
    marginBottom: "20px",
  },

  heroIcon: {
    fontSize: "55px",
  },

  badge: {
    fontSize: "12px",
    opacity: 0.8,
    marginBottom: "7px",
  },

  title: {
    margin: 0,
    fontSize: "clamp(25px,5vw,38px)",
  },

  description: {
    lineHeight: 1.8,
    opacity: 0.9,
  },

  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "14px",
    fontSize: "13px",
  },

  card: {
    background: "var(--surface)",
    borderRadius: "20px",
    padding: "24px",
    marginBottom: "18px",
    boxShadow: "var(--shadow-sm)",
  },

  cardTitle: {
    marginTop: 0,
  },

  instructions: {
    lineHeight: 1.9,
    color: "var(--muted)",
    whiteSpace: "pre-line",
  },

  message: {
    background: "var(--surface-soft)",
    border: "1px solid var(--line)",
    padding: "13px",
    borderRadius: "12px",
    marginBottom: "16px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(min(100%, 180px),1fr))",
    gap: "14px",
  },

  label: {
    display: "block",
    fontWeight: "700",
    marginTop: "15px",
    marginBottom: "7px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid var(--line)",
    borderRadius: "11px",
    padding: "12px",
    background: "var(--surface)",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: "130px",
    border: "1px solid var(--line)",
    borderRadius: "11px",
    padding: "12px",
    resize: "vertical",
  },

  participationTitle: {
    marginTop: "30px",
    borderTop: "1px solid var(--line)",
    paddingTop: "22px",
  },

  button: {
    width: "100%",
    border: 0,
    borderRadius: "13px",
    padding: "14px",
    marginTop: "24px",
    background:
      "var(--gold-soft)",
    color: "var(--ink)",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  },
};
