export function MonitorIcon() {
  return (
    <svg className="service-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 20h8M12 16v4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function WrenchIcon() {
  return (
    <svg className="service-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.7 6.3a4.2 4.2 0 0 0-5.4 5.4L4 17a1.6 1.6 0 0 0 2.3 2.3l5.3-5.3a4.2 4.2 0 0 0 5.4-5.4L15 10.6 13.4 9l1.3-2.7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ServiceIcon({ slug }: { slug: string }) {
  if (slug === "website-and-application-development") return <MonitorIcon />;
  if (slug === "legacy-frontend-modernisation") return <WrenchIcon />;
  return null;
}
