import Link from "next/link";
import { learningPaths } from "../config/platform.mjs";
import SchoolIcon from "../components/brand/SchoolIcon";
import RobotIllustration from "../components/home/RobotIllustration";
import TeacherPanel from "../components/home/TeacherPanel";
import PublishedQuizzes from "../components/home/PublishedQuizzes";

function SectionTitle({ eyebrow, title, text, id }) {
  return (
    <div className="school-section-title">
      <span className="school-eyebrow">{eyebrow}</span>
      <h2 id={id}>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

export default function Home() {
  return (
    <div className="platform-home-content">
      <main id="main-content">
        <section id="home" className="school-hero school-container" aria-labelledby="hero-title">
          <div className="school-hero-copy">
            <span className="school-pill"><span className="school-live-dot" />جيل يتعلّم بفضول، ويبتكر بثقة</span>
            <h1 id="hero-title">فكرة اليوم.<br /><span>إبداع الغد.</span></h1>
            <p className="school-hero-description">عالم الذكاء الاصطناعي أقرب مما تتخيّل. اكتشف، جرّب، وحوّل أسئلتك الصغيرة إلى أفكار تستحق أن تُروى.</p>
            <div className="school-hero-actions">
              <Link href="#explore" className="school-button school-button-gold">ابدأ رحلة التعلّم<SchoolIcon name="arrow" size={20} /></Link>
              <Link href="/challenges" className="school-button school-button-outline"><SchoolIcon name="rocket" size={20} />استكشف التحديات</Link>
            </div>
            <div className="school-hero-meta">
              <span><SchoolIcon name="teacher" size={18} />للصفوف الأول إلى السادس</span>
              <span><SchoolIcon name="shield" size={18} />نتعلّم التقنية بوعي</span>
            </div>
          </div>

          <div className="school-hero-stage">
            <div className="school-stage-heading"><span><SchoolIcon name="spark" size={18} />مختبر الأفكار</span><span className="school-stage-marker" aria-hidden="true">AI / 01</span></div>
            <RobotIllustration />
            <div className="school-stage-stamp" aria-hidden="true"><SchoolIcon name="spark" size={20} /><span>اسأل.<br />جرّب.<br />ابتكر.</span></div>
            <div className="school-stage-caption"><span className="school-caption-line" /><span>كل تجربة تبدأ بسؤال</span><SchoolIcon name="compass" size={18} /></div>
          </div>
        </section>

        <section className="school-principles school-container" aria-label="خطوات رحلتك">
          <div><SchoolIcon name="book" /><span><strong>تعلّم ببساطة</strong><small>أفكار واضحة، وخطوات صغيرة</small></span></div>
          <div><SchoolIcon name="rocket" /><span><strong>جرّب بشجاعة</strong><small>مساحة لأفكارك وتجاربك</small></span></div>
          <div><SchoolIcon name="trophy" /><span><strong>احتفل بتقدّمك</strong><small>كل محاولة خطوة إلى الأمام</small></span></div>
        </section>

        <section id="explore" className="school-section school-container" aria-labelledby="explore-title">
          <div className="school-section-heading-row">
            <SectionTitle eyebrow="رحلتك، بطريقتك" title="ماذا ستكتشف اليوم؟" text="ثلاث بدايات مختلفة. وفضول واحد يقودك إلى الأمام." id="explore-title" />
            <span className="school-section-note"><span />اختر ما يثير فضولك</span>
          </div>
          <div className="school-path-grid">
            {learningPaths.map((item, index) => (
              <article className={"school-path-card school-path-" + item.tone} key={item.title}>
                <div className="school-card-top"><span className={"school-icon-tile school-tone-" + item.tone}><SchoolIcon name={item.icon} size={27} /></span><span className="school-card-number" aria-hidden="true">{["٠١", "٠٢", "٠٣"][index]}</span></div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <Link href={item.href} className="school-card-link"><span>{item.label}</span><span className="school-arrow-circle"><SchoolIcon name="arrow" size={18} /></span></Link>
              </article>
            ))}
          </div>
          <Link href="/content" className="school-video-strip"><span className="school-video-icon"><SchoolIcon name="play" size={22} /></span><span><strong>فكرة جديدة، في فيديو قصير</strong><small>استكشف الفيديوهات والمحتوى التعليمي</small></span><SchoolIcon name="arrow" size={19} /></Link>
        </section>

        <section id="quizzes" className="school-quizzes-section" aria-labelledby="quizzes-title">
          <div className="school-container">
            <div className="school-section-heading-row"><SectionTitle eyebrow="من الفهم إلى التجربة" title="جاهز لتحدّي معلوماتك؟" text="اختباراتك المنشورة، في مكان واحد." id="quizzes-title" /><span className="school-section-emblem" aria-hidden="true"><SchoolIcon name="check" size={26} /></span></div>
            <PublishedQuizzes />
          </div>
        </section>

        <section className="school-section school-container school-community" aria-label="أعمال الطلاب ولوحة الشرف">
          <article id="student-work" className="school-work-card">
            <span className="school-eyebrow">أفكار تستحق المشاركة</span>
            <h2>اترك بصمتك.</h2>
            <p>رسم، قصة، أو فكرة مختلفة. شارك إبداعك من داخل التحديات المتاحة.</p>
            <Link href="/challenges" className="school-text-link">شارك في تحدٍّ<SchoolIcon name="arrow" size={18} /></Link>
            <div className="school-work-art" aria-hidden="true"><span /><SchoolIcon name="pencil" size={68} /><SchoolIcon name="spark" size={25} /></div>
          </article>
          <article id="honor" className="school-honor-card">
            <span className="school-eyebrow">نحتفي بالمحاولة والإبداع</span>
            <h2>هنا، يلمع كل مجتهد.</h2>
            <p>قريبًا، مساحة نحتفي فيها بأعمال الطلاب المميزة بعد اعتمادها.</p>
            <span className="school-coming-soon"><span />لوحة الشرف قريبًا</span>
            <div className="school-honor-art" aria-hidden="true"><SchoolIcon name="trophy" size={82} /><span /></div>
          </article>
        </section>

        <TeacherPanel />
      </main>


    </div>
  );
}

