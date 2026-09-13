type LoadingVariant = "app" | "journal" | "settings" | "auth";

type LoadingStateProps = {
  variant?: LoadingVariant;
};

export function LoadingState({ variant = "app" }: LoadingStateProps) {
  return (
    <main className={`loading-page loading-${variant}`} aria-busy="true" aria-live="polite">
      <div className="loading-orbit" aria-hidden="true"><span /><span /><span /></div>
      <div className="loading-content">
        <div className="loading-brand"><span className="loading-heart" aria-hidden="true">&hearts;</span><span>Momenta</span></div>
        {variant === "journal" ? <JournalSkeleton /> : null}
        {variant === "settings" ? <SettingsSkeleton /> : null}
        {variant === "auth" ? <AuthSkeleton /> : null}
        {variant === "app" ? <p className="loading-label">Opening your little corner...</p> : null}
      </div>
    </main>
  );
}

function JournalSkeleton() {
  return <div className="loading-skeleton loading-journal-skeleton"><div className="skeleton-hero" /><div className="skeleton-grid"><span /><span /><span /><span /></div></div>;
}

function SettingsSkeleton() {
  return <div className="loading-skeleton loading-settings-skeleton"><span /><span /><span /></div>;
}

function AuthSkeleton() {
  return <div className="loading-skeleton loading-auth-skeleton"><span /><span /><span /><span /></div>;
}
