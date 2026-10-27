import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function SectionHeading({ eyebrow, title, description, href, linkText }: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="home-section-heading">
      <div>
        <span className="home-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && <Link className="home-text-link" href={href}>{linkText}<ArrowUpRight size={17} aria-hidden="true" /></Link>}
    </div>
  );
}
