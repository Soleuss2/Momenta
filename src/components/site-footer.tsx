import { Heart } from "lucide-react";
import Link from "next/link";

type SiteFooterProps = {
  homeHref?: string;
};

export function SiteFooter({ homeHref = "/public" }: SiteFooterProps) {
  return (
    <footer className="site-footer">
      <div className="footer-brand-block">
        <Link href={homeHref} className="flex items-center gap-2 text-rose-950" aria-label="Momenta home">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-rose-500 text-white">
            <Heart size={15} fill="currentColor" />
          </span>
          <span className="font-title text-lg font-semibold">Momenta</span>
        </Link>
        <p>For the moments in between. A quiet place for the stories that make a life together.</p>
      </div>
      <div className="footer-column">
        <span className="footer-heading">Explore</span>
        <Link href="/public#why">Why it matters</Link>
        <Link href="/public#story">Our story</Link>
      </div>
      <div className="footer-column">
        <span className="footer-heading">Journal</span>
        <Link href="/public/auth">Create an account</Link>
        <Link href="/users">Open journal</Link>
      </div>
      <div className="footer-note">
        <span>Made for memories, not metrics.</span>
        <small>Design preview · 2026</small>
      </div>
    </footer>
  );
}
