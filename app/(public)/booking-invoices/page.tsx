"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Download, FileText, LoaderCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
type Booking = { _id: string; studioTitle?: string; date: string; startTime: string; endTime: string; totalAmount?: number; status: string };
type ApiResponse = { success: boolean; message?: string; data?: Booking[] };
export default function BookingInvoicesPage() {
  const router=useRouter();
  const {data:session,isPending:checkingSession}=authClient.useSession();
  const [bookings,setBookings]=useState<Booking[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [downloading,setDownloading]=useState<string|null>(null);
  const userId=session?.user?.id;
  useEffect(()=>{if(!checkingSession&&!userId)router.replace("/login");},[checkingSession,userId,router]);
  useEffect(()=>{
    if(checkingSession||!userId)return;
    const controller=new AbortController();
    fetch(`${API_URL}/api/bookings/my`,{credentials:"include",cache:"no-store",signal:controller.signal})
      .then(async r=>{if(r.status===401)throw new Error("UNAUTHORIZED");const j:ApiResponse=await r.json();if(!r.ok||!j.success||!Array.isArray(j.data))throw new Error(j.message||"Unable to load bookings.");return j.data;})
      .then(rows=>{if(!controller.signal.aborted){setBookings(rows.filter(b=>b.status==="confirmed"||b.status==="completed"));setError("");}})
      .catch((err:unknown)=>{if(controller.signal.aborted)return;if(err instanceof Error&&err.message==="UNAUTHORIZED"){router.replace("/login");return;}setError(err instanceof Error?err.message:"Unable to load bookings.");})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return()=>controller.abort();
  },[checkingSession,userId,router]);
  async function download(booking:Booking){
    if(downloading)return;setDownloading(booking._id);
    try{
      const r=await fetch(`${API_URL}/api/invoices/${booking._id}`,{credentials:"include",cache:"no-store"});
      if(!r.ok){const j=await r.json().catch(()=>({message:"Could not download PDF."}));throw new Error(j.message||"Could not download PDF.");}
      const blob=await r.blob();if(!blob.type.includes("pdf"))throw new Error("Unexpected file response.");
      const url=URL.createObjectURL(blob);const anchor=document.createElement("a");anchor.href=url;anchor.download=`studiospace-booking-${booking._id}.pdf`;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast.success("Booking PDF downloaded.");
    }catch(err){toast.error(err instanceof Error?err.message:"PDF download failed.");}finally{setDownloading(null);}
  }
  if(checkingSession||!userId)return <main className="flex min-h-[70vh] items-center justify-center gap-3"><LoaderCircle className="animate-spin text-violet-600"/> Checking your account...</main>;
  return <main className="min-h-[75vh] px-5 py-14" style={{background:"var(--ss-surface-alt)"}}><div className="mx-auto max-w-5xl"><Link href="/my-bookings" className="inline-flex items-center gap-2 text-sm font-semibold text-violet-600 dark:text-violet-300"><ArrowLeft size={16}/> My bookings</Link><div className="mt-7 flex items-center gap-4"><span className="rounded-xl bg-violet-500/10 p-4 text-violet-600 dark:text-violet-300"><FileText size={27}/></span><div><h1 className="text-3xl font-extrabold" style={{color:"var(--ss-ink)"}}>Booking PDFs</h1><p className="mt-1 text-sm" style={{color:"var(--ss-muted)"}}>Download confirmation documents for confirmed and completed reservations.</p></div></div><div className="mt-9 rounded-2xl border p-6" style={{borderColor:"var(--ss-border)",background:"var(--ss-surface)"}}>{loading?<p className="flex items-center gap-3" style={{color:"var(--ss-muted)"}}><LoaderCircle className="animate-spin"/> Loading eligible bookings...</p>:error?<p className="text-red-600">{error}</p>:bookings.length===0?<div className="py-14 text-center"><FileText className="mx-auto text-violet-400" size={42}/><h2 className="mt-4 text-lg font-bold" style={{color:"var(--ss-ink)"}}>No confirmed bookings yet</h2><Link href="/studios" className="mt-5 inline-flex items-center gap-2 text-violet-600">Explore studios <ArrowRight size={16}/></Link></div>:<div className="space-y-3">{bookings.map(b=><article key={b._id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4" style={{borderColor:"var(--ss-border)"}}><div><h2 className="font-bold" style={{color:"var(--ss-ink)"}}>{b.studioTitle||"Studio booking"}</h2><p className="mt-1 text-xs" style={{color:"var(--ss-muted)"}}>{b.date} · {b.startTime}–{b.endTime} · {b.status}</p><p className="mt-2 text-sm font-semibold text-violet-600">{new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(b.totalAmount||0)}</p></div><button type="button" disabled={!!downloading} onClick={()=>void download(b)} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{downloading===b._id?<LoaderCircle className="animate-spin" size={17}/>:<Download size={17}/>} Download PDF</button></article>)}</div>}</div><div className="mt-5 flex items-start gap-2 text-xs" style={{color:"var(--ss-muted)"}}><ShieldCheck size={17} className="shrink-0"/> These are booking confirmations, not proof of payment. Payment is not independently verified.</div></div></main>;
}
