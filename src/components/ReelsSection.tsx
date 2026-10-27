'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Play, VideoOff, X } from 'lucide-react';
import type { ProductVideo } from '@/lib/types';
import { useProducts } from '@/lib/store';
import SectionHeading from './home/SectionHeading';

export default function ReelsSection() {
  const [videos, setVideos] = useState<ProductVideo[]>([]);
  const [active, setActive] = useState<ProductVideo | null>(null);
  const [failed, setFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const { products } = useProducts();

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/videos', { signal: controller.signal })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data?.videos)) setVideos((data.videos as ProductVideo[]).filter(video => video.isActive).sort((a, b) => a.displayOrder - b.displayOrder).slice(0, 4));
      }).catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!active) return;
    const element = dialog.current;
    element?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = previous; };
  }, [active]);

  if (!videos.length) return null;
  const linkedProduct = active && products.find(product => active.linkedProductIds.includes(product.id) && product.isPublished !== false && !product.archivedAt);

  return (
    <section className="home-container home-section home-reels-section" aria-label="Studio videos">
      <SectionHeading eyebrow="See the process" title="Made layer by layer" description="Get closer to the prints. Watch the details come together." />
      <div className="home-reels">
        {videos.map(video => <button type="button" key={video.id} className="home-reel" onClick={() => { setFailed(false); setActive(video); }} aria-label={`Watch ${video.title}`}>
          <span className="home-reel-image"><Image src={video.thumbnailUrl || '/products/hexagrid-desk-organizer.jpg'} alt="" fill sizes="(max-width: 640px) 45vw, 23vw" /><span className="home-reel-play"><Play size={19} fill="currentColor" aria-hidden="true" /></span>{video.durationSeconds && <span className="home-reel-duration">{video.durationSeconds}s</span>}</span>
          <span className="home-reel-title">{video.title}<ArrowUpRight size={15} aria-hidden="true" /></span>
        </button>)}
      </div>
      <dialog ref={dialog} className="home-reel-dialog" aria-labelledby="home-video-title" onClose={() => setActive(null)} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.current?.close(); } }}>
        {active && <>
          <div className="home-video-header"><h3 id="home-video-title">{active.title}</h3><button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label="Close studio video"><X size={21} /></button></div>
          {failed ? <div className="home-video-unavailable" role="status"><VideoOff size={32} aria-hidden="true" /><h4>This studio film is unavailable right now.</h4><p>You can still explore the collection or ask us for a closer look.</p><Link href="/contact" className="home-button home-button-outline" onClick={() => dialog.current?.close()}>Contact the studio <ArrowUpRight size={17} /></Link></div> :
            <video key={active.id} src={active.videoUrl} poster={active.thumbnailUrl} controls autoPlay muted playsInline preload="metadata" onError={() => setFailed(true)} />}
          <div className="home-video-caption"><p>{active.caption}</p>{linkedProduct && <Link href={`/catalog/${linkedProduct.slug}`} className="home-text-link" onClick={() => dialog.current?.close()}>Explore this print <ArrowUpRight size={16} /></Link>}</div>
        </>}
      </dialog>
    </section>
  );
}
