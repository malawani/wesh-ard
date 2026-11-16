import Link from "next/link";

export const metadata = { title: "عن وش أرد؟" };

export default function AboutPage() {
  return (
    <main className="shell site-main">
      <article className="info-page">
        <Link href="/" className="secondary-button">العودة للرئيسية</Link>
        <h1>عن «وش أرد؟»</h1>
        <p>«وش أرد؟» موقع عربي يساعدك تختار الكلام المناسب للمواقف العاطفية والاجتماعية.</p>
        <h2>كيف يعمل؟</h2>
        <p>اختر الموقف، وحدد مرحلة العلاقة ونبرة الكلام، ثم اختر من مجموعة ردود جاهزة وسهلة النسخ.</p>
        <h2>فلسفتنا</h2>
        <p>نؤمن بأن أفضل كلام هو الكلام الصادق اللي يناسب شخصيتك وظروفك ويحترم الطرف الآخر.</p>
        <p>العبارات تساعدك في التعبير عن مشاعرك. اختر منها اللي يعبّر عنك ويحترم حدود الطرف الآخر.</p>
      </article>
    </main>
  );
}
