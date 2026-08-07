export function BoardSkeleton({ count = 8 }) {
  return (
    <div className="board">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skel-card" key={i}>
          <div className="skel skel-title" />
          <div className="skel skel-text" />
        </div>
      ))}
    </div>
  );
}

export function DossierSkeleton() {
  return (
    <div className="dossier">
      <div className="dossier-head" style={{ minHeight: 130 }}>
        <div className="skel" style={{ height: 26, width: '70%', marginBottom: '1rem', background: 'rgba(242,239,228,0.1)' }} />
        <div className="skel" style={{ height: 13, width: '40%', background: 'rgba(242,239,228,0.1)' }} />
      </div>
      <div className="dossier-body">
        <div className="skel" style={{ height: 76, width: '100%', marginBottom: '1rem' }} />
        <div className="fact-grid">
          <div className="skel" style={{ height: 130 }} />
          <div className="skel" style={{ height: 130 }} />
        </div>
      </div>
    </div>
  );
}
