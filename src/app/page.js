import { supabase } from "../lib/supabase";

export const dynamic = "force-dynamic";

;const sections = [
  { icon: "🧠", title: "تعلّم واستكشف", text: "دروس ومعلومات ممتعة عن عالم الذكاء الاصطناعي.", badge: "ابدأ التعلّم" },
  { icon: "🏆", title: "التحديات والمسابقات", text: "شارك بأفكارك وأعمالك وأظهر إبداعك.", badge: "شاهد التحديات" },
  { icon: "✅", title: "الاختبارات", text: "اختبر معلوماتك بطريقة سهلة وممتعة.", badge: "ابدأ الاختبار" },
  { icon: "🎬", title: "الفيديوهات", text: "شاهد مقاطع قصيرة تساعدك على فهم الأفكار.", badge: "شاهد الآن" },
  { icon: "🚀", title: "أعمالي ومشاركاتي", text: "ارفع أعمالك وشارك مشاريعك المميزة.", badge: "أرسل عملك" },
  { icon: "⭐", title: "لوحة الشرف", text: "تعرّف على نجوم المنصة وأبرز الإنجازات.", badge: "شاهد المتميزين" },
];


export default async function Home() {
    const { data: quizzes } = await supabase
        .from("quizzes")
            .select("id,title,status")
                .eq("status", "published");

  return (
    <main dir="rtl" className="site">
      <header className="header">
        <div className="brand">
          <div className="logo">AI</div>
          <div>
            <h1>منصة الذكاء الاصطناعي</h1>
            <p>نتعلّم • نجرّب • نبدع</p>
          </div>
        </div>

        <nav className="nav">
          <a href="#home">الرئيسية</a>
          <a href="#explore">استكشف</a>
          <a href="#honor">لوحة الشرف</a>
        </nav>
      </header>

      <section id="home" className="hero">
        <div className="heroText">
          <span className="eyebrow">✨ أهلاً وسهلاً بك</span>
          <h2>
            اكتشف عالم
            <span> الذكاء الاصطناعي</span>
          </h2>
          <p>
            مكانك للتعلّم والتجربة والمنافسة وصناعة أفكار مبدعة بطريقة سهلة وممتعة.
          </p>

          <div className="heroActions">
            <a className="primaryBtn" href="#explore">ابدأ رحلتك 🚀</a>
            <a className="secondaryBtn" href="#honor">نجوم المنصة ⭐</a>
          </div>
        </div>

        <div className="heroVisual">
          <div className="orbit orbitOne">💡</div>
          <div className="orbit orbitTwo">🤖</div>
          <div className="aiCore">AI</div>
          <div className="orbit orbitThree">🎨</div>
          <div className="orbit orbitFour">🧠</div>
        </div>
      </section>

      <section className="quickStats">
        <div><strong>6</strong><span>أقسام ممتعة</span></div>
        <div><strong>∞</strong><span>أفكار وإبداعات</span></div>
        <div><strong>1</strong><span>رحلة نحو المستقبل</span></div>
      </section>

      <section id="explore" className="contentSection">
        <div className="sectionTitle">
          <span>ماذا تريد أن تفعل اليوم؟</span>
          <h3>اختر مغامرتك 🚀</h3>
          <p>كل قسم يأخذك إلى تجربة جديدة في عالم الذكاء الاصطناعي.</p>
        </div>

        <div className="cards">
          {sections.map((item) => (
            <article className="card" key={item.title}>
              <div className="cardIcon">{item.icon}</div>
              <h4>{item.title}</h4>
              <p>{item.text}</p>
              <button>{item.title === "تعلّم واستكشف" ? (
  <a href="/content" style={{ color: "inherit", textDecoration: "none" }}>
    {item.badge}
  </a>
) : (
  item.badge
)} ←</button>
            </article>
          ))}
        </div>
      </section>
      <section className="contentSection">
          <div className="sectionTitle">
              <span>✅ الاختبارات</span>
                  <h3>اختباراتك المتاحة</h3>
                      <p>اختر اختبارًا وابدأ التحدي.</p>
                        </div>

                          <div className="cards">
                              {quizzes?.map((quiz) => (
                                    <article className="card" key={quiz.id}>
                                            <div className="cardIcon">📝</div>
                                                    <h4>{quiz.title}</h4>
                                                            <p>اختبار متاح الآن</p>
                                                                    <button>ابدأ الاختبار ←</button>
                                                                          </article>
                                                                              ))}
                                                                                </div>
                                                                                </section>

      <section id="honor" className="highlight">
        <div>
          <span>⭐ لوحة الشرف</span>
          <h3>هل ستكون نجمنا القادم؟</h3>
          <p>
            شارك، أبدع، وتعلّم. الأعمال المميزة ستظهر هنا ليحتفل بها الجميع.
          </p>
        </div>
        <div className="trophy">🏆</div>
      </section>

      <footer>
        <div className="footerLogo">AI</div>
        <p>منصة تعليمية لصناعة جيل يتعلم التقنية بوعي وإبداع.</p>
        <small>جميع الحقوق محفوظة</small>
      </footer>
    </main>
  );
}
