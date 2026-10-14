import SchoolIcon from "../brand/SchoolIcon";
import { Card, PageSurface } from "../platform/PlatformUI";
import styles from "./accounts.module.css";
export default function AccountPage({ title, description, icon = "users", children }) {
  return <PageSurface className={styles.page}>
    <div className={styles.layout}>
      <aside className={styles.introduction}>
        <span className="school-icon-tile school-tone-gold"><SchoolIcon name="book" size={28} /></span>
        <p className={styles.eyebrow}>مدارس الفكر التربوي</p>
        <h2>حسابك، بداية رحلتك.</h2>
        <p>تعلّم وشارك باسمك، وتابع أنشطة صفك في مكان واحد.</p>
        <div className={styles.privacy}><SchoolIcon name="shield" size={19} /><span>بياناتك للمدرسة، ولا تظهر في قائمة عامة.</span></div>
      </aside>
      <Card className={styles.card}>
        <div className={styles.heading}><span className="school-icon-tile school-tone-copper"><SchoolIcon name={icon} size={25} /></span><div><h1>{title}</h1><p>{description}</p></div></div>
        {children}
      </Card>
    </div>
  </PageSurface>;
}
