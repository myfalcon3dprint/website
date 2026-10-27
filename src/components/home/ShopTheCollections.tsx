import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import SectionHeading from './SectionHeading';

export default function ShopTheCollections() {
  return (
    <section className="home-container home-section" aria-label="Explore collections">
      <SectionHeading eyebrow="Built for your world" title="Level up your space" />
      <div className="home-collections">
        <Link href="/catalog?category=Desk%20Accessories" className="home-collection home-collection-desk">
          <Image src="/products/hexagrid-desk-organizer.jpg" alt="Modular desk organizer styled with everyday essentials" fill sizes="(max-width: 640px) 100vw, 55vw" />
          <div className="home-collection-copy"><span className="home-eyebrow">Work smarter. Look sharper.</span><h3>DESK SETUP.<br />UPGRADED.</h3><span className="home-collection-link">Shop desk accessories <ArrowUpRight size={19} /></span></div>
        </Link>
        <Link href="/catalog?category=Miniatures%20%26%20Collectibles" className="home-collection home-collection-collectibles">
          <Image src="/products/cyber-gryphon-figure.jpg" alt="Detailed articulated gryphon collectible" fill sizes="(max-width: 640px) 100vw, 40vw" />
          <div className="home-collection-copy"><span className="home-eyebrow">Made to stand out.</span><h3>SMALL SCALE.<br />BIG CHARACTER.</h3><span className="home-collection-link">Shop collectibles <ArrowUpRight size={19} /></span></div>
        </Link>
      </div>
    </section>
  );
}
