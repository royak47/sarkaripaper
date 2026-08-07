export function BoardSkeleton({ count = 8 }) {
  return (
    <div className="card-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i} />
      ))}
    </div>
  );
}

export function DossierSkeleton() {
  return (
    <div className="dossier">
      <div className="dossier-head" style={{ minHeight: 120 }}>
        <div className="skeleton-card" style={{ height: 28, width: '70%', marginBottom: 12 }} />
        <div className="skeleton-card" style={{ height: 14, width: '40%' }} />
      </div>
      <div className="dossier-body">
        <div className="fact-grid">
          <div className="skeleton-card" style={{ height: 72 }} />
          <div className="skeleton-card" style={{ height: 72 }} />
        </div>
        <div className="skeleton-card" style={{ height: 120, marginTop: 16 }} />
      </div>
    </div>
  );
}
