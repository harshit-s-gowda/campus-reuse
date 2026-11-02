import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, Heart, MapPin, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Page, Toast } from '../components/Shell';
import { api, apiError } from '../services/api';
import type { Product } from '../types';
import { useAuth } from '../lib/auth';

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayOptions = { key: string; amount: number; currency: string; name: string; description: string; order_id: string; prefill: { name: string; email: string }; theme: { color: string }; handler: (response: RazorpayResponse) => void; modal?: { ondismiss?: () => void } };
type RazorpayConstructor = new (options: RazorpayOptions) => { open: () => void };
declare global { interface Window { Razorpay?: RazorpayConstructor } }

async function loadRazorpayCheckout() {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay-checkout]');
    if (existing) { existing.addEventListener('load', () => resolve(), { once: true }); existing.addEventListener('error', () => reject(new Error('Razorpay Checkout could not load')), { once: true }); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay Checkout could not load'));
    document.body.appendChild(script);
  });
  if (!window.Razorpay) throw new Error('Razorpay Checkout is unavailable');
}

export default function ProductDetails(){
  const {id}=useParams(); const {user}=useAuth(); const nav=useNavigate();
  const [product,setProduct]=useState<Product|null>(null); const [active,setActive]=useState(0); const [saved,setSaved]=useState(false); const [toast,setToast]=useState(''); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  useEffect(()=>{api.get(`/products/${id}`).then(r=>setProduct(r.data.product)).catch(e=>setError(apiError(e)))},[id]);
  if(error)return <Page><div className="not-found"><h2>{error}</h2><Link className="button" to="/marketplace">Back to marketplace</Link></div></Page>;
  if(!product)return <Page><div className="loading-page">Loading the listing…</div></Page>;
  const discount=Math.round((1-product.sellingPrice/product.originalPrice)*100);
  const openPayment=async()=>{
    if(!user){nav('/login',{state:{from:`/products/${product.id}`}});return;}
    setBusy(true); setToast('');
    try {
      const orderResponse=await api.post('/payments/create-order',{productId:product.id});
      await loadRazorpayCheckout();
      if(!window.Razorpay || !orderResponse.data.razorpayOrderId) throw new Error(orderResponse.data.message||'Razorpay checkout is unavailable');
      const checkout=new window.Razorpay({
        key:orderResponse.data.keyId,
        amount:orderResponse.data.amount,
        currency:'INR',
        name:'Campus Reuse',
        description:product.title,
        order_id:orderResponse.data.razorpayOrderId,
        prefill:{name:user.name,email:user.email},
        theme:{color:'#15543B'},
        handler:async(response)=>{
          try { await api.post('/payments/verify',{orderId:orderResponse.data.orderId,razorpayPaymentId:response.razorpay_payment_id,razorpayOrderId:response.razorpay_order_id,razorpaySignature:response.razorpay_signature}); setToast('Payment verified. Your purchase is confirmed.'); }
          catch (verifyError) { setToast(apiError(verifyError)); }
          finally { setBusy(false); }
        },
        modal:{ondismiss:()=>setBusy(false)},
      });
      checkout.open();
    } catch (paymentError) { setToast(apiError(paymentError)); setBusy(false); }
  };
  const action=async(kind:'exchange'|'rental')=>{if(!user){nav('/login',{state:{from:`/products/${product.id}`}});return}setBusy(true);try{if(kind==='exchange'){await api.post('/exchange',{requestedProductId:product.id});setToast('Exchange request sent to the seller.')}else{const start=new Date();const end=new Date(Date.now()+7*86400000);await api.post('/rental',{productId:product.id,startDate:start.toISOString().slice(0,10),endDate:end.toISOString().slice(0,10),rentalAmount:product.sellingPrice});setToast('Rental request sent for a 7-day handover.')}}catch(e){setToast(apiError(e))}finally{setBusy(false)}};
  return <Page><div className="detail-breadcrumb"><Link to="/marketplace"><ArrowLeft size={15}/> Back to marketplace</Link><span>{product.category}</span></div><section className="detail-layout"><div className="detail-gallery"><div className="detail-main-image"><img src={product.images[active]||'/assets/book-os.svg'} alt={product.title}/><span className="detail-type">{product.transactionType}</span></div><div className="thumbs">{product.images.map((image,i)=><button key={image} className={active===i?'active':''} onClick={()=>setActive(i)}><img src={image} alt=""/></button>)}</div></div><div className="detail-info"><div className="detail-kicker"><span className="eyebrow">{product.category}</span><span className="status-dot"><span/> Admin checked</span></div><h1>{product.title}</h1><p className="detail-description">{product.description}</p><div className="detail-price"><strong>₹{product.sellingPrice.toLocaleString('en-IN')}</strong><del>₹{product.originalPrice.toLocaleString('en-IN')}</del><span>{discount}% less</span></div><div className="detail-rule"/><div className="detail-facts"><div><span>Condition</span><b>{product.condition}</b></div><div><span>Author / brand</span><b>{product.authorOrBrand}</b></div><div><span>Course</span><b>{product.course}</b></div><div><span>Semester</span><b>{product.semester}</b></div><div><span>Department</span><b>{product.department}</b></div><div><span>Handover</span><b><MapPin size={14}/>{product.campusLocation}</b></div></div><div className="seller-card"><div className="avatar large">{(product.sellerName||'S').slice(0,1)}</div><div><span>Listed by</span><b>{product.sellerName||'Campus student'}</b><small>{product.department} · Verified campus account</small></div><ShieldCheck size={18}/></div><div className="detail-actions"><button className="button" onClick={()=>product.transactionType==='SALE'?openPayment():action(product.transactionType==='EXCHANGE'?'exchange':'rental')} disabled={busy}>{product.transactionType==='SALE'?<ShoppingBag size={17}/>:product.transactionType==='EXCHANGE'?<Sparkles size={17}/>:<CalendarDays size={17}/>} {product.transactionType==='SALE'?'Buy now':product.transactionType==='EXCHANGE'?'Request exchange':'Request rental'}</button><button className={`button button-outline ${saved?'is-saved':''}`} onClick={async()=>{if(!user){nav('/login');return}const r=await api.post(`/wishlist/${product.id}`);setSaved(r.data.saved)}}><Heart size={17} fill={saved?'currentColor':'none'}/> {saved?'Saved':'Save item'}</button></div><button className="report-link" onClick={async()=>{if(user){await api.post('/reports',{productId:product.id,reason:'Listing concern'});setToast('Thanks — the listing has been sent to campus support.')}}}>Report this listing</button></div></section>{toast&&<Toast message={toast} type={toast.includes('error')||toast.includes('unavailable')?'error':'success'}/>}</Page>
}
