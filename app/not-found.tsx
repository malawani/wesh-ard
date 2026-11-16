import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell site-main">
      <div className="info-page">
        <h1>الصفحة غير موجودة</h1>
        <p>يمكنك الرجوع للرئيسية واختيار موقف.</p>
        <Link href="/" className="secondary-button">العودة للرئيسية</Link>
      </div>
    </main>
  );
}
