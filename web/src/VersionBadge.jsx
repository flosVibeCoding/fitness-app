import versionInfo from './version-info.json';
import { getEnvironment } from './environment';

export default function VersionBadge() {
  const env = getEnvironment();
  const deployedDate = new Date(versionInfo.deployedAt).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: 'var(--muted)',
        letterSpacing: '0.04em',
      }}
    >
      <span>v{versionInfo.version}</span>
      <span style={{ opacity: 0.5 }}>·</span>
      <span
        style={{
          color: env === 'DEV' ? 'var(--iron)' : 'var(--ok)',
          fontWeight: 600,
        }}
      >
        {env}
      </span>
      <span style={{ opacity: 0.5 }}>·</span>
      <span>{deployedDate}</span>
    </div>
  );
}
