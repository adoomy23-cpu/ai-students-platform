import Link from "next/link";
import { learningPaths } from "../config/platform.mjs";
import SchoolIcon from "../components/brand/SchoolIcon";
import RobotIllustration from "../components/home/RobotIllustration";
import { PageSurface } from "../components/platform/PlatformUI";
import styles from "./landing.module.css";

export default function Home() {
  return (
    <PageSurface className={styles.landing}>
      <div className={styles.frame}>
        <section className={styles.hero} aria-labelledby="welcome-title">
          <div className={styles.copy}>
            <span className={styles.eyebrow}>أهلًا بك في عالم الذكاء الاصطناعي</span>
            <h1 id="welcome-title" className={styles.title}>فكرة صغيرة.<br /><span>اكتشاف كبير.</span></h1>
            <p className={styles.description}>تعلّم، تحدَّ، واكتشف قدراتك.</p>
            <Link href="#explore" className={`school-button school-button-gold ${styles.exploreButton}`}>
              ابدأ الاستكشاف<SchoolIcon name="arrow" size={19} />
            </Link>
          </div>
          <div className={styles.robot} aria-hidden="true"><RobotIllustration /></div>
        </section>

        <section id="explore" className={styles.explore} aria-labelledby="explore-title" tabIndex={-1}>
          <div className={styles.sectionHeading}>
            <h2 id="explore-title">ماذا تختار اليوم؟</h2>
            <span>خطوتك التالية تبدأ هنا</span>
          </div>
          <div className={styles.paths}>
            {learningPaths.map((path) => (
              <Link key={path.href} href={path.href} className={styles.path}>
                <span className={`school-icon-tile school-tone-${path.tone} ${styles.pathIcon}`}><SchoolIcon name={path.icon} size={23} /></span>
                <span className={styles.pathCopy}><strong>{path.title}</strong><span>{path.text}</span></span>
                <SchoolIcon name="arrow" size={18} className={styles.pathArrow} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageSurface>
  );
}
