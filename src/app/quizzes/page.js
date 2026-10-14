import PublishedQuizzes from "../../components/home/PublishedQuizzes";
import SchoolIcon from "../../components/brand/SchoolIcon";
import { PageSurface } from "../../components/platform/PlatformUI";
import styles from "./quizzes.module.css";

export const metadata = { title: "الاختبارات | منصة الذكاء الاصطناعي" };

export default function QuizzesPage() {
  return (
    <PageSurface className={styles.page}>
      <div className={styles.container}>
        <header className={styles.heading}>
          <span className="school-icon-tile school-tone-gold"><SchoolIcon name="check" size={25} /></span>
          <div><h1>اختبر ما تعلّمته</h1><p>اختر اختبارًا منشورًا، وابدأ على مهل.</p></div>
        </header>
        <section aria-label="الاختبارات المنشورة"><PublishedQuizzes /></section>
      </div>
    </PageSurface>
  );
}
