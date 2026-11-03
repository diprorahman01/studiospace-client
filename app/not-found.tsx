import Link from "next/link";
import { Aperture, ArrowRight, Compass, Home, MapPin } from "lucide-react";

export default function NotFoundPage(){
  return <main className="relative flex min-h-[76vh] items-center overflow-hidden px-5 py-16" style={{background:"var(--ss-surface-alt)"}}>
    <div aria-hidden className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl"/>
    <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-2">
      <section><span className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest text-violet-700 dark:text-violet-300" style={{borderColor:"var(--ss-border)"}}><Compass size={16}/> Lost in the studio?</span><p className="mt-7 text-7xl font-black tracking-tight text-violet-700 dark:text-violet-300 sm:text-8xl">404<span className="text-violet-400">.</span></p><h1 className="mt-4 text-3xl font-extrabold sm:text-4xl" style={{color:"var(--ss-ink)"}}>This stage isn't on the map.</h1><p className="mt-5 max-w-md text-base leading-8" style={{color:"var(--ss-muted)"}}>The studio page you're looking for may have moved, or the address may be mistyped. Let's find the perfect space for your next idea.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3.5 text-sm font-bold text-white hover:bg-violet-800"><Home size={17}/> Back to Home</Link><Link href="/studios" className="inline-flex items-center gap-2 rounded-xl border px-6 py-3.5 text-sm font-bold" style={{borderColor:"var(--ss-border)",color:"var(--ss-ink)"}}>Explore studios <ArrowRight size={16}/></Link></div></section>
      <section className="rounded-[32px] border p-5 shadow-xl sm:p-8" style={{background:"var(--ss-surface)",borderColor:"var(--ss-border)"}} aria-label="Illustration of a creative studio">
        <svg role="img" aria-label="A film set with studio lights, camera, and purple backdrop" viewBox="0 0 540 370" className="h-auto w-full">
          <defs><linearGradient id="stage" x1="0" x2="1"><stop offset="0" stopColor="#2b1748"/><stop offset="1" stopColor="#6941a8"/></linearGradient></defs>
          <rect width="540" height="370" rx="22" fill="#f4edff"/><rect x="44" y="45" width="450" height="270" rx="20" fill="url(#stage)"/><path d="M44 276L180 206h180l134 70v39H44z" fill="#3f285f"/>
          <path d="M192 80h154v165H192z" fill="#ae8be9"/><path d="M192 80h154v165H192z" fill="#9975d9" opacity=".5"/><path d="M192 80 Q270 117 346 80" stroke="#e5d8ff" strokeWidth="3" fill="none"/>
          <path d="M72 120l55 15-18 64-55-15z" fill="#fde68a"/><path d="M63 109l78 21-26 84-78-21z" stroke="#f8fafc" strokeWidth="7" fill="none"/><path d="M97 210l-22 95M97 210l27 95" stroke="#c4b5fd" strokeWidth="6"/><path d="M76 213l56 1" stroke="#c4b5fd" strokeWidth="5"/>
          <path d="M455 120l-55 15 18 64 55-15z" fill="#fde68a"/><path d="M464 109l-78 21 26 84 78-21z" stroke="#f8fafc" strokeWidth="7" fill="none"/><path d="M427 210l-22 95M427 210l27 95" stroke="#c4b5fd" strokeWidth="6"/><path d="M405 213l56 1" stroke="#c4b5fd" strokeWidth="5"/>
          <rect x="245" y="212" width="70" height="49" rx="12" fill="#171126"/><circle cx="279" cy="237" r="18" fill="#69528e" stroke="#cab8ed" strokeWidth="5"/><circle cx="279" cy="237" r="8" fill="#1c1231"/><rect x="255" y="202" width="28" height="12" rx="5" fill="#171126"/><path d="M274 261l-34 49M285 261l36 49M280 261v49" stroke="#d6c5ef" strokeWidth="5"/>
          <circle cx="452" cy="74" r="17" fill="#f8d9fc"/><circle cx="452" cy="74" r="8" fill="#8456c3"/><path d="M80 65h32" stroke="#e9d5ff" strokeWidth="8" strokeLinecap="round"/><path d="M96 49v32" stroke="#e9d5ff" strokeWidth="8" strokeLinecap="round"/>
        </svg>
        <div className="mt-5 flex items-center justify-between gap-3"><span className="inline-flex items-center gap-2 text-xs font-semibold text-violet-700 dark:text-violet-300"><Aperture size={16}/> StudioSpace</span><span className="inline-flex items-center gap-1 text-xs" style={{color:"var(--ss-muted)"}}><MapPin size={13}/> Location not found</span></div>
      </section>
    </div>
  </main>
}
