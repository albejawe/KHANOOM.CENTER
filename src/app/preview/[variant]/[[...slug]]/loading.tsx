import "./preview.css";

export default function Loading() {
  return <div className="preview-wait" dir="rtl" aria-label="جاري فتح القسم" role="status">
    <div className="preview-inner">
      <div className="preview-skeleton preview-skeleton-heading" />
      <div className="preview-skeleton-grid">
        {[1,2,3,4].map((n) => <div key={n} className="preview-skeleton preview-skeleton-card" />)}
      </div>
    </div>
  </div>;
}
