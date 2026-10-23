import { ShoppingBag } from "lucide-react";
import "@/app/preview/[variant]/[[...slug]]/preview.css";

export default function StorefrontLoading({ products = false }: { products?: boolean }) {
  return <div className="preview-site" data-variant="2" dir="rtl" aria-busy="true" aria-label="جاري فتح القسم">
    <div className="preview-app-shell">
      <header className="preview-header">
        <div className="preview-mark"><ShoppingBag size={22} strokeWidth={1.5} /></div>
        <div className="preview-brand"><strong>مجمع خانم</strong><span>ملابس • كوزمتكس • أطفال</span></div>
      </header>
      <main className="preview-main">
        <div className="preview-section-title"><div className="preview-skeleton" style={{height:25,width:"48%"}} /></div>
        <div className="preview-skeleton-grid" style={{gridTemplateColumns:products ? "repeat(2,minmax(0,1fr))" : "1fr",gap:12}}>
          {Array.from({length:products ? 4 : 3},(_,i)=>
            <div className="preview-skeleton" key={i} style={{height:products ? 225 : 106}} />)}
        </div>
      </main>
    </div>
  </div>;
}
