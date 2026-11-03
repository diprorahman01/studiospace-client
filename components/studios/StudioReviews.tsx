"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { LoaderCircle, MessageSquare, Star, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
const API_URL=process.env.NEXT_PUBLIC_API_URL||"http://localhost:5000";
type Review={_id:string;userName?:string;rating:number;comment:string;createdAt?:string};
type Booking={_id:string;studioId:string;status:string};
export default function StudioReviews({studioId}:{studioId:string}){
  const {data:session}=authClient.useSession();
  const [reviews,setReviews]=useState<Review[]>([]);
  const [bookingId,setBookingId]=useState("");
  const [eligible,setEligible]=useState<Booking[]>([]);
  const [rating,setRating]=useState(5);
  const [comment,setComment]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [key,setKey]=useState(0);
  useEffect(()=>{
    const c=new AbortController();
    fetch(`${API_URL}/api/reviews/studio/${studioId}`,{cache:"no-store",signal:c.signal})
    .then(async r=>{const data=await r.json();if(!r.ok||!data.success||!Array.isArray(data.data))throw new Error(data.message||"Unable to load reviews.");return data.data;})
    .then(data=>{if(!c.signal.aborted){setReviews(data);setError("");}})
    .catch(err=>{if(!c.signal.aborted)setError(err instanceof Error?err.message:"Unable to load reviews.");})
    .finally(()=>{if(!c.signal.aborted)setLoading(false);});
    return()=>c.abort();
  },[studioId,key]);
  useEffect(()=>{
    if(!session?.user?.id)return;
    const c=new AbortController();
    fetch(`${API_URL}/api/bookings/my`,{credentials:"include",cache:"no-store",signal:c.signal})
    .then(async r=>{const data=await r.json();return r.ok&&data.success&&Array.isArray(data.data)?data.data:[];})
    .then((data:Booking[])=>{if(!c.signal.aborted)setEligible(data.filter(b=>String(b.studioId)===studioId&&b.status==="completed"));})
    .catch(()=>undefined);
    return()=>c.abort();
  },[session?.user?.id,studioId,key]);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(saving)return;if(!bookingId){toast.error("Choose a completed booking.");return;}if(comment.trim().length<15){toast.error("Write at least 15 characters.");return;}setSaving(true);
    try{const r=await fetch(`${API_URL}/api/reviews`,{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({bookingId,rating,comment})});const data=await r.json();if(!r.ok||!data.success)throw new Error(data.message||"Unable to publish review.");toast.success("Review published.");setBookingId("");setComment("");setKey(v=>v+1);}catch(e){toast.error(e instanceof Error?e.message:"Unable to publish review.");}finally{setSaving(false);}
  }
  const average=reviews.length?reviews.reduce((n,r)=>n+r.rating,0)/reviews.length:0;
  return <section className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-extrabold" style={{color:"var(--ss-ink)"}}>Verified studio reviews</h2><p className="mt-1 text-sm" style={{color:"var(--ss-muted)"}}>Reviews are submitted after completed bookings.</p></div><span className="inline-flex items-center gap-2 rounded-xl bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-600"><Star size={18} fill="currentColor"/>{reviews.length?average.toFixed(1):"New"} · {reviews.length} reviews</span></div>
  {loading?<p className="flex items-center gap-2"><LoaderCircle className="animate-spin"/> Loading...</p>:error?<p className="text-sm text-red-600">{error}</p>:reviews.length===0?<div className="rounded-2xl border p-8 text-center" style={{borderColor:"var(--ss-border)"}}><MessageSquare className="mx-auto text-violet-400" size={32}/><p className="mt-3 text-sm" style={{color:"var(--ss-muted)"}}>No verified reviews yet.</p></div>:<div className="space-y-3">{reviews.map(r=><article key={r._id} className="rounded-xl border p-5" style={{borderColor:"var(--ss-border)",background:"var(--ss-surface-alt)"}}><div className="flex flex-wrap items-center justify-between gap-2"><strong style={{color:"var(--ss-ink)"}}>{r.userName||"Verified customer"}</strong><span className="flex gap-0.5 text-amber-500">{Array.from({length:5},(_,i)=><Star key={i} size={15} fill={i<r.rating?"currentColor":"none"}/>)}</span></div><p className="mt-3 text-sm leading-7" style={{color:"var(--ss-muted)"}}>{r.comment}</p><p className="mt-2 text-xs" style={{color:"var(--ss-muted)"}}>{r.createdAt?new Date(r.createdAt).toLocaleDateString("en-US"):""}</p></article>)}</div>}
  {session?.user?.id?eligible.length?<form onSubmit={submit} className="space-y-4 rounded-2xl border p-5" style={{borderColor:"var(--ss-border)"}}><h3 className="font-bold" style={{color:"var(--ss-ink)"}}>Review a completed session</h3><div><label htmlFor="review-booking" className="block text-xs font-semibold" style={{color:"var(--ss-muted)"}}>Completed booking</label><select id="review-booking" value={bookingId} onChange={e=>setBookingId(e.target.value)} className="mt-2 w-full rounded-xl border p-3 text-sm" style={{background:"var(--ss-surface-alt)",borderColor:"var(--ss-border)",color:"var(--ss-ink)"}}><option value="">Choose booking</option>{eligible.map(b=><option value={b._id} key={b._id}>{b._id}</option>)}</select></div><div><label htmlFor="review-rating" className="block text-xs font-semibold" style={{color:"var(--ss-muted)"}}>Rating</label><select id="review-rating" value={rating} onChange={e=>setRating(Number(e.target.value))} className="mt-2 w-full rounded-xl border p-3 text-sm" style={{background:"var(--ss-surface-alt)",borderColor:"var(--ss-border)",color:"var(--ss-ink)"}}>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} stars</option>)}</select></div><div><label htmlFor="review-message" className="block text-xs font-semibold" style={{color:"var(--ss-muted)"}}>Your review (15–1000 characters)</label><textarea id="review-message" value={comment} onChange={e=>setComment(e.target.value)} minLength={15} maxLength={1000} required rows={4} className="mt-2 w-full rounded-xl border p-3 text-sm" style={{background:"var(--ss-surface-alt)",borderColor:"var(--ss-border)",color:"var(--ss-ink)"}}/></div><button type="submit" disabled={saving} className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{saving?"Publishing...":"Publish review"}</button></form>:<p className="flex items-center gap-2 text-xs" style={{color:"var(--ss-muted)"}}><ShieldCheck size={16}/> Complete a booking at this studio to leave a verified review.</p>:<p className="text-sm" style={{color:"var(--ss-muted)"}}><Link href="/login" className="font-semibold text-violet-600">Sign in</Link> to review a completed booking.</p>}
  </section>;
}
