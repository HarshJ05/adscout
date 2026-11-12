import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';

/** Chrome shared by the working pages: dashboard, leads, ads, history, report. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-root">
      <a href="#main" className="skip-link">Skip to content</a>
      <AppHeader />
      <main id="main" className="page">{children}</main>
      <AppFooter />
    </div>
  );
}
