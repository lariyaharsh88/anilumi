/** Re-mounts on every navigation, so each page gets the CSS enter animation (no JS cost). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
