import Link from "next/link";
import { Aperture, ArrowRight, AudioLines, Camera, Film, HeartHandshake, ShieldCheck, Sparkles, Users } from "lucide-react";

const audiences = [
  { title: "Photographers", description: "Find inspiring light-filled studios and portrait spaces.", icon: Camera },
  { title: "Filmmakers", description: "Book sets and production-ready creative locations.", icon: Film },
  { title: "Podcasters & musicians", description: "Discover recording rooms designed for your sound.", icon: AudioLines },
  { title: "Studio hosts", description: "Share your workspace with a community of ambitious creators.", icon: Users },
];

export default function AboutUsPage() {
  return <main className="min-h-screen" style={{ background: "var(--ss-surface-alt)" }}>
    <section className="relative overflow-hidden bg-[#1e1334] px-5 py-24 text-white">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-40 h-[500px] w-[500px] rounded-full bg-violet-500/25 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-violet-100"><Aperture size={17}/> About StudioSpace</span>
        <h1 className="mt-7 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl">Space for every <span className="text-violet-300">creative vision.</span></h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-violet-100">StudioSpace connects creative professionals with the spaces, equipment and environments they need to do their best work.</p>
        <Link href="/studios" className="mt-9 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-4 text-sm font-bold text-white transition hover:bg-violet-500">Explore studios <ArrowRight size={18}/></Link>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 py-20">
      <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-widest text-violet-700 dark:text-violet-300">Our mission</p><h2 className="mt-4 text-3xl font-extrabold sm:text-4xl" style={{color:"var(--ss-ink)"}}>Making professional spaces easier to discover and book</h2><p className="mt-5 text-base leading-8" style={{color:"var(--ss-muted)"}}>Independent creators should be able to find suitable workspaces without spending days contacting different studios. StudioSpace brings listings, amenities, hourly rates, availability and reservation requests into one clear experience. Hosts can manage their own listings and booking requests.</p></div>
      <div className="mt-12 grid gap-5 sm:grid-cols-2">{audiences.map(({title,description,icon:Icon})=><article key={title} className="rounded-2xl border p-7 transition hover:-translate-y-1 hover:shadow-xl" style={{borderColor:"var(--ss-border)",background:"var(--ss-surface)"}}><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300"><Icon size={24}/></span><h3 className="mt-5 text-xl font-bold" style={{color:"var(--ss-ink)"}}>{title}</h3><p className="mt-3 text-sm leading-7" style={{color:"var(--ss-muted)"}}>{description}</p></article>)}</div>
    </section>
    <section className="border-y px-5 py-16" style={{borderColor:"var(--ss-border)",background:"var(--ss-surface)"}}><div className="mx-auto grid max-w-6xl gap-9 md:grid-cols-3">{[{icon:ShieldCheck,title:"Clarity",body:"Studio details and hourly prices are visible before you request a booking."},{icon:HeartHandshake,title:"Connection",body:"Creators can discover spaces, and hosts can make them available to the community."},{icon:Sparkles,title:"Creativity",body:"Photography, film, music and podcast production all belong here."}].map(({icon:Icon,title,body})=><article key={title}><Icon className="text-violet-600 dark:text-violet-300" size={28}/><h3 className="mt-4 text-lg font-bold" style={{color:"var(--ss-ink)"}}>{title}</h3><p className="mt-2 text-sm leading-7" style={{color:"var(--ss-muted)"}}>{body}</p></article>)}</div></section>
    <section className="mx-auto max-w-6xl px-5 py-20 text-center"><h2 className="text-3xl font-extrabold" style={{color:"var(--ss-ink)"}}>Ready to create something?</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-7" style={{color:"var(--ss-muted)"}}>Find a space for your next project or offer your own studio to fellow creators.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/studios" className="rounded-xl bg-violet-700 px-6 py-3 font-bold text-white">Find a studio</Link><Link href="/add-studio" className="rounded-xl border px-6 py-3 font-bold" style={{borderColor:"var(--ss-border)",color:"var(--ss-ink)"}}>Become a host</Link></div></section>
  </main>;
}
