'use client'

import { useState, useEffect } from "react";

const T = {
  bg:"#FFFFFF", soft:"#F5F5F7", ink:"#1A1C20", sub:"#787E88", faint:"#A8ADB6",
  hair:"rgba(20,22,28,.10)", hairS:"rgba(20,22,28,.16)",
  black:"#1A1C22", purple:"#6C5FE0", purpleSoft:"#F0EEFB", purpleBar:"#CFC9F4",
  green:"#1E8F5C", greenSoft:"#E4F4EB", red:"#D6443C", redSoft:"#FBE6E4",
  yellow:"#BC8410", yellowSoft:"#F9EFD2", blue:"#4C8DD6", blueLt:"#A9CBEC",
};
const serif='"Georgia","Times New Roman",serif';
const sans='"Inter","SF Pro Text",-apple-system,system-ui,sans-serif';
const BD=`1px solid ${T.hairS}`;
const HD=`1px solid ${T.hair}`;

const HEALTH={green:{label:"On track",c:T.green,soft:T.greenSoft},yellow:{label:"Watch",c:T.yellow,soft:T.yellowSoft},red:{label:"Action needed",c:T.red,soft:T.redSoft}};
const SEV={low:{l:"Low",c:T.green,s:T.greenSoft},medium:{l:"Watch",c:T.yellow,s:T.yellowSoft},high:{l:"Critical",c:T.red,s:T.redSoft}};
const VERDICT={us:{label:"We're exposed",c:T.red,s:T.redSoft},them:{label:"They're at fault",c:T.green,s:T.greenSoft},shared:{label:"Shared fault",c:T.yellow,s:T.yellowSoft},neither:{label:"No fault",c:T.sub,s:"#F0F1F3"},unclear:{label:"Unclear",c:T.sub,s:"#F0F1F3"}};
const OBL_STATUS={met:{c:T.green,t:"Met"},missed:{c:T.red,t:"Missed"},at_risk:{c:T.yellow,t:"At risk"},unclear:{c:T.sub,t:"Unclear"}};

const COST_TYPES=[
  {id:"hourly",label:"Hourly",fields:["rate","hours"],calc:f=>(+f.rate||0)*(+f.hours||0)},
  {id:"flat",label:"Flat fee",fields:["amount"],calc:f=>(+f.amount||0)},
  {id:"revshare",label:"Rev share",fields:["pct","base"],calc:f=>(+f.pct||0)/100*(+f.base||0)},
  {id:"passthru",label:"Pass-through",fields:["amount"],calc:f=>(+f.amount||0)},
  {id:"time",label:"My time",fields:["rate","hours"],calc:f=>(+f.rate||0)*(+f.hours||0)},
  {id:"infra",label:"Infra/Stripe",fields:["amount"],calc:f=>(+f.amount||0)},
  {id:"other",label:"Other",fields:["amount"],calc:f=>(+f.amount||0)},
];
const FIELD_DEFS={rate:{l:"Rate ($/hr)",t:"number"},hours:{l:"Hours",t:"number"},amount:{l:"Amount ($)",t:"number"},pct:{l:"Percentage (%)",t:"number"},base:{l:"Base ($)",t:"number"}};
const PRODUCTS=["Primary ticketing","Box Office / POS","Sponsor Portal","Moments (collectibles)","Secondary marketplace","Agent-1 fan CRM","Community","White-label"];
const SPONSOR_MODES=["No sponsor","We brought the sponsor","They brought the sponsor","Partner brought the sponsor"];
const EVENT_TYPES=["Paid event","Free event","Hybrid"];
const MILESTONE_TYPES={
  event_date:{label:"Event date",icon:"📅",color:T.blue},
  renewal:{label:"Renewal",icon:"🔄",color:T.purple},
  deadline:{label:"Deadline",icon:"⏱",color:T.yellow},
  payment:{label:"Payment",icon:"💳",color:T.green},
  upsell:{label:"Upsell",icon:"📈",color:T.purple},
  risk:{label:"Risk trigger",icon:"⚠",color:T.red},
  review:{label:"Review",icon:"👥",color:T.sub},
  contract_end:{label:"Contract end",icon:"🏁",color:T.black},
};
// Cycles are account-specific and tied to renewals/events — no fixed template.
// Each cycle: { id, label, start, end, products[], events[], note, active }
const CHARGEBACK_STATUS=["Open","Resolved — won","Resolved — lost","Disputed"];
const FEATURE_STATUS=["Scoped","In progress","Shipped","On hold","Out of scope"];

const fmt=n=>"$"+Math.round(n||0).toLocaleString();
const fmtK=n=>Math.abs(n||0)>=1000?"$"+((n||0)/1000).toFixed(Math.abs(n||0)%1000?1:0)+"K":"$"+Math.round(n||0);
const pct=(a,b)=>b?Math.min(100,Math.round(100*a/b)):0;
const uid=()=>Math.random().toString(36).slice(2,9);
const sumCosts=a=>(a.costs||[]).reduce((n,c)=>n+(c.computed||0),0);
const daysDiff=(d)=>Math.round((new Date(d)-new Date())/(1000*60*60*24));

// ── SEED ──
const SEED_ORG={id:"3tree",name:"3 Tree Labs",sub:"Ticket Tree"};
const SEED_ACCTS=[
  {
    id:"sail4th",orgId:"3tree",account:"Sail4th 250",short:"S4",logo:"#2E6BD6",
    health:"yellow",owner:"Carter",value:"~$1.0M GMV · ~$70K fees",
    products:["Primary ticketing","Sponsor Portal"],eventType:"Paid event",sponsorMode:"They brought the sponsor",
    contractCycle:1,
    cycles:[
      { id:"cy1", label:"Sail4th 250 — inaugural event", start:"May 2026", end:"Jul 2026",
        products:["Primary ticketing","Sponsor Portal"], events:["Sail4th 250 · Jul 3, 2026"],
        note:"First contract. Paid anchorage ticketing + free boat tour time-select.", active:true },
    ],
    chargebacks:[
      { id:"cb1", amount:0, reason:"Misbooking — incorrect pier allocation from client CSV", status:"Open", date:"2026-06-10", disputedBy:"Lisa Vitanza", note:"Client allocation error. Informal refund promise made in text. Resolve before Jul 3." },
    ],
    features:[
      { id:"f1", name:"Paid anchorage ticketing — 8 piers", status:"Shipped", scope:"contract", note:"Live since May 2026" },
      { id:"f2", name:"Free boat tour time-select registration", status:"Shipped", scope:"contract", note:"Live since May 2026" },
      { id:"f3", name:"Sponsor allocation CSV import", status:"Shipped", scope:"contract", note:"Gwen sends CSV, we import to allocation system" },
      { id:"f4", name:"Per-pier GMV report for sponsors", status:"In progress", scope:"out-of-scope", note:"Gwen requested Jun 15. NOT in the signed scope — this is a reporting add-on. Log as a scope change request or charge for it." },
      { id:"f5", name:"Vitanza refund handling", status:"In progress", scope:"out-of-scope", note:"NOT in contract. Informal promise created this obligation. Resolve before Jul 3." },
      { id:"f6", name:"Sponsor/guest allocation CSV management", status:"Shipped", scope:"out-of-scope", note:"Client sends allocation CSVs for us to import. Not explicitly in scope per Sec 2.1 — they own allocation management. We absorbed this work. Flag for contract cycle 2." },
      { id:"f6", name:"Moments digital collectibles", status:"Scoped", scope:"future", note:"Target for Cycle 2 renewal conversation." },
    ],
    contract:{start:"May 2026",end:"Jul 2026",renewal:"TBD post-event",paymentTerms:"Net 30",
      platformFeePct:7,kickbackPct:0,kickbackTo:"",netTakePct:7,processingPassThru:true,processingRate:2.9,
      gmvProjected:1000000,gmvActual:200000,liabilityCap:200000,slaTarget:99.9,exclusive:false,
      dataRights:"Fan profiles retained by Ticket Tree post-event",autoRenew:false,terminationNotice:"30 days",
      auditRights:false,ipOwnership:"Ticket Tree owns Moments IP",revenueShareOnUpsells:false,whiteLabel:false,
      notes:"Scope: paid anchorage ticketing (~$1M GMV, ~$70K fees) + free boat tour time-select. Unresolved: uncapped data breach liability, enterprise insurance requirements, SLA scope undefined, MOR language."},
    costs:[
      {id:"c1",type:"flat",label:"Hunter build cost",fields:{amount:0},computed:0,note:"Event infra — TBD",when:"Ongoing"},
      {id:"c2",type:"time",label:"Carter account mgmt",fields:{rate:150,hours:0},computed:0,note:"Not yet logged",when:"Ongoing"},
    ],
    kpis:{daysSinceContact:2,slaActual:99.9,refundRate:1,sentiment:"Watch",chargebacks:1},
    milestones:[
      {id:"m1",type:"event_date",date:"2026-07-03",title:"Sail4th 250 — event day",note:"Primary revenue date. All piers live.",done:false},
      {id:"m2",type:"deadline",date:"2026-06-25",title:"Vitanza chargeback response due",note:"Must send written scope clarification before this date.",done:false},
      {id:"m3",type:"payment",date:"2026-07-31",title:"Net 30 invoice — post-event",note:"Invoice triggers 30 days after event close.",done:false},
      {id:"m4",type:"renewal",date:"2026-08-15",title:"Renewal conversation",note:"Opportunity to introduce Moments + Agent-1 for Cycle 2.",done:false},
      {id:"m5",type:"upsell",date:"2026-08-15",title:"Cycle 2 upsell: Moments + Agent-1",note:"Current: Tickets + Sponsor Portal. Next: add Moments and fan CRM.",done:false},
      {id:"m6",type:"risk",date:"2026-06-14",title:"Out-of-scope refund promise",note:"The 'make them whole' text. Written obligation outside fee schedule.",done:false},
    ],
    comms:"[2026-05-01] ME: Confirmed deal scope with Courtney\n[2026-05-10] THEM: Allocation CSV sent\n[2026-05-28] ME: 8 pier locations live\n[2026-06-10] ME: Chargeback from Lisa Vitanza\n[2026-06-14] ME: don't worry, we'll make the buyer whole on this one\n[2026-06-14] THEM: thanks, seating error was on our allocation sheet\n[2026-06-15] THEM (Gwen): Can you send a pier report for sponsor allocations?",
    summary:"Anchorage ticketing live across 8 piers. Contact: Gwen Hafner (ghafner@sail4th.org). One active chargeback (Lisa Vitanza). Informal refund promise outside the signed fee schedule.",
    signal:'On June 14, we told the buyer we\'d "make them whole" on the Vitanza misbooking — no fee-schedule reference.',
    shift:"Exposure moved from Contained → Watch after the refund language went out.",
    impact:{pct:"-15%",dir:"neg",label:"Fee exposure if the informal refund promise holds without a written scope clarification.",withAction:"A written clarification tying any refund to the fee schedule caps the exposure."},
    fault:{verdict:"shared",reasoning:"The misbooking came from the client's allocation CSV. However our text promise created a written obligation the contract doesn't back.",against_us:"We created a written refund obligation without referencing the fee schedule.",against_them:"Their allocation file contained the seating error that caused the misbooking."},
    obligations:[
      {party:"us",obligation:"Paid anchorage ticketing platform",source:"Sec 2.1 Scope",status:"met"},
      {party:"us",obligation:"Free boat tour time-select",source:"Sec 2.1 Scope",status:"met"},
      {party:"us",obligation:"99.9% uptime SLA",source:"Sec 5.3",status:"at_risk"},
      {party:"us",obligation:"Data breach liability — uncapped",source:"Contract issue",status:"at_risk"},
      {party:"them",obligation:"Allocation lists on schedule",source:"Sec 3.2",status:"met"},
      {party:"them",obligation:"Payment within Net 30",source:"Sec 4.1",status:"unclear"},
    ],
    risks:[
      {risk:"Informal refund promise outside fee schedule",severity:"high",action:"Send written clarification tying any Vitanza refund to the fee schedule before settling."},
      {risk:"Uncapped data breach liability",severity:"high",action:"Push for a liability cap in a side letter before the event closes."},
      {risk:"SLA scope undefined",severity:"medium",action:"Define what 99.9% uptime covers and the measurement window in a side letter."},
      {risk:"GMV tracking at 20% of projection",severity:"medium",action:"$200K realized vs $1M projected. Revisit the GMV model or flag to Gwen."},
      {risk:"Merchant of record unconfirmed",severity:"medium",action:"Confirm whether Ticket Tree or Sail4th is MOR before final payouts."},
    ],
    signals_pending:[
      {id:"sp1",kind:"Out-of-scope promise",text:'"make them whole" in June 14 text — no fee-schedule reference. Creates an obligation the contract does not back.',sev:"high"},
      {id:"sp2",kind:"Unresolved contract term",text:"Data breach liability is uncapped. $200K aggregate cap and enterprise insurance flagged in negotiation but not closed.",sev:"high"},
    ],
    flags:["Verbal refund commitment in writing, outside the fee schedule","MOR not confirmed — could shift tax/payout responsibility"],
  },
  {
    id:"grass",orgId:"3tree",account:"Grass League",short:"GL",logo:"#2E9E6B",
    health:"red",owner:"Carter",value:"Pre-contract · target <$25K",
    products:["Primary ticketing"],eventType:"Paid event",sponsorMode:"We brought the sponsor",
    contractCycle:0,contract:null,costs:[],kpis:{daysSinceContact:21,sentiment:"Cold"},
    cycles:[],chargebacks:[],
    features:[
      { id:"f1", name:"Primary ticketing setup", status:"Scoped", scope:"future", note:"Pending contract." },
    ],
    milestones:[
      {id:"g1",type:"event_date",date:"2026-04-24",title:"First event",note:"Already passed. Deal stalled before onboarding.",done:true},
      {id:"g2",type:"deadline",date:"2026-07-01",title:"Re-engagement deadline",note:"If no response by Q3, mark as lost.",done:false},
      {id:"g3",type:"upsell",date:"2026-07-15",title:"Second event opportunity",note:"Cycle 1: Tickets only. Cycle 2 target: add Sponsor Portal.",done:false},
    ],
    comms:"[2026-04-01] ME: Reached out to Jimmy Hoselton\n[2026-04-10] THEM: Interested in bundling sponsorship\n[2026-04-15] ME: Sent bundle proposal\n[2026-06-02] THEM: let me take this to the team\n[2026-06-10] ME: following up — happy to adjust\n[2026-06-18] ME: circling back, open to fee-split",
    summary:"Par-3 golf prospect. Contact: Jimmy Hoselton. Stalled after bundle quote. First event Apr 24–25 passed. No contract — risk is pipeline.",
    signal:'Jimmy replied "let me take this to the team" on June 2 and has not responded to two follow-ups.',
    shift:"Deal momentum moved from Active → Cold over three weeks of silence.",
    impact:{pct:"Cold",dir:"neg",label:"If nothing changes, the deal closes lost.",withAction:"A tighter ROI one-pager with a fee-split under $25K reopens it."},
    fault:{verdict:"neither",reasoning:"Pre-contract stall. No party is in breach.",against_us:"Bundle pricing may have topped their sub-$25K budget without a clear ROI story.",against_them:"Standard buyer silence; no bad faith shown."},
    obligations:[{party:"us",obligation:"No signed contract yet",source:"Pre-contract",status:"unclear"}],
    risks:[
      {risk:"Deal goes cold against incumbent vendor",severity:"high",action:"Re-engage with a tighter ROI one-pager and a fee-split under $25K."},
      {risk:"No ROI proof point sent with bundle",severity:"medium",action:"Attach Cage Titans (22% revenue lift) or WWE NXT Plymouth ($92K gross) as comparable."},
    ],
    signals_pending:[],flags:[],
  },
];

// ── Storage ──
async function sget(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch{return null;}}
async function sset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
async function slist(p){try{const ks=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&key.startsWith(p))ks.push(key);}return ks;}catch{return[];}}
async function sdel(k){try{localStorage.removeItem(k);}catch{}}

// ── Atoms ──
const Tag=({label,c,s})=><span style={{fontSize:11,fontWeight:600,padding:"4px 9px",borderRadius:6,background:s,color:c}}>{label}</span>;
const Pill=({children,c,s})=><span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,padding:"6px 11px",borderRadius:999,background:s,color:c}}>{children}</span>;
const Sec=({children,right})=><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"24px 2px 10px"}}><span style={{fontSize:11,fontWeight:600,letterSpacing:.7,textTransform:"uppercase",color:T.faint}}>{children}</span>{right}</div>;
const icbtn={width:40,height:40,borderRadius:8,background:T.bg,border:BD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:T.ink,cursor:"pointer"};
function EconOut({k,v,color}){return <div style={{background:T.bg,border:HD,borderRadius:8,padding:"12px 14px",marginTop:9,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,color:T.sub}}>{k}</span><span style={{fontSize:18,fontWeight:600,letterSpacing:-.3,color:color||T.ink}}>{v}</span></div>;}
const Kpi=({k,v,flag})=><div><div style={{fontSize:11.5,color:T.sub}}>{k}</div><div style={{fontSize:18,fontWeight:600,marginTop:3,color:flag?T.red:T.ink}}>{v}{flag&&<span style={{fontSize:10,marginLeft:5,color:T.red}}>▲</span>}</div></div>;


// ── DESKTOP APP SHELL ──
// Sidebar nav (240px fixed) + main content area + slide-in detail panel (420px)
// Shares all components, constants, seed data with mobile version.

// ── STRIPE-STYLE DESKTOP SHELL ──
// Sidebar: white bg, gray active highlight, purple left border, normal-weight nav text
// Account detail: full main content area (not a side panel) with Stripe two-column layout
// Nav style mirrors Stripe: section labels, icon+text items, subdued until active

const SIDEBAR_W = 220;

const NAV_ITEMS = [
  { id:"dashboard", label:"Home",         icon:"⌂",  section:null },
  { id:"accounts",  label:"Accounts",     icon:"◫",  section:null },
  { id:"timeline",  label:"Timeline",     icon:"◷",  section:null },
  { id:"digest",    label:"Digest",       icon:"✦",  section:null },
  { id:"disputes",  label:"Disputes",     icon:"⚑",  section:"Shortcuts" },
  { id:"costs",     label:"Cost ledger",  icon:"$",  section:"Shortcuts" },
];

// Stripe sidebar colors
const S = {
  bg:"#FFFFFF", activeBg:"#F6F6F9", activeText:"#1A1C20",
  inactiveText:"#6B7280", labelText:"#9CA3AF", border:"#E5E7EB",
  activeBorder:"#6C5FE0",
};

export default function AppDesktop(){
  const [orgs,setOrgs]=useState([]);
  const [accts,setAccts]=useState([]);
  const [orgId,setOrgId]=useState(null);
  const [nav,setNav]=useState("dashboard");
  const [selected,setSelected]=useState(null);
  const [detailTab,setDetailTab]=useState("overview");
  const [editMode,setEditMode]=useState(false);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{ (async()=>{
    await sset(`org:${SEED_ORG.id}`,SEED_ORG);
    for(const a of SEED_ACCTS) await sset(`acct:${a.orgId}:${a.id}`,a);
    const oks=await slist("org:"); const os=[]; for(const k of oks){const o=await sget(k);if(o)os.push(o);}
    const aks=await slist("acct:"); const as=[]; for(const k of aks){const a=await sget(k);if(a)as.push(a);}
    setOrgs(os); setAccts(as); setOrgId(SEED_ORG.id); setLoaded(true);
  })(); },[]);

  const org=orgs.find(o=>o.id===orgId);
  const orgAccts=accts.filter(a=>a.orgId===orgId);
  const selectedAcct=selected?orgAccts.find(a=>a.id===selected):null;

  async function saveAcct(a){ await sset(`acct:${a.orgId}:${a.id}`,a); setAccts(p=>{const i=p.findIndex(x=>x.id===a.id&&x.orgId===a.orgId);if(i>=0){const c=[...p];c[i]=a;return c;}return[...p,a];}); }
  async function saveOrg(o){ await sset(`org:${o.id}`,o); setOrgs(p=>[...p,o]); setOrgId(o.id); }
  async function delAcct(a){ await sdel(`acct:${a.orgId}:${a.id}`); setAccts(p=>p.filter(x=>!(x.id===a.id&&x.orgId===a.orgId))); setSelected(null); }

  if(!loaded) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:sans,color:T.sub,fontSize:14}}>Loading…</div>;

  // Computed metrics
  const allC=orgAccts.filter(a=>a.contract);
  const gmvActual=allC.reduce((n,a)=>n+(a.contract.gmvActual||0),0);
  const gmvProj=allC.reduce((n,a)=>n+(a.contract.gmvProjected||0),0);
  const feesEarned=allC.reduce((n,a)=>n+(a.contract.gmvActual||0)*(a.contract.netTakePct||0)/100,0);
  const totalCosts=orgAccts.reduce((n,a)=>n+((a.costs||[]).reduce((s,c)=>s+(c.computed||0),0)),0);
  const netRev=feesEarned-totalCosts;
  const pipelinePct=gmvProj>0?Math.round(100*gmvActual/gmvProj):0;
  const coverage=gmvProj>0?(gmvActual/gmvProj).toFixed(1)+"x":"—";
  const coverageHealthy=gmvActual/gmvProj>=0.3;
  const forecast=gmvProj*(allC[0]?.contract?.netTakePct||7)/100;
  const confidence=pipelinePct>=60?"High":pipelinePct>=35?"Medium":"Low";
  const actions=orgAccts.flatMap(a=>(a.risks||[]).map(r=>({...r,acct:a.account,aid:a.id}))).sort((x,y)=>({high:0,medium:1,low:2}[x.severity]-{high:0,medium:1,low:2}[y.severity]));
  const allMilestones=orgAccts.flatMap(a=>(a.milestones||[]).filter(m=>!m.done&&daysDiff(m.date)>=0&&daysDiff(m.date)<=14).map(m=>({...m,acct:a.account,aid:a.id}))).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const velocity=orgAccts.length>0?Math.round(orgAccts.reduce((n,a)=>{const ms=(a.milestones||[]).filter(m=>m.done);return n+(ms.length>0?14:21);},0)/orgAccts.length):0;

  // Which nav to show — if an account is selected, we show the account detail view
  const showDetail = selectedAcct && (nav==="accounts");

  return (
    <div style={{display:"flex",height:"100vh",background:"#FAFAFA",fontFamily:sans,color:T.ink,letterSpacing:-.1,overflow:"hidden"}}>

      {/* ── STRIPE-STYLE SIDEBAR ── */}
      <div style={{width:SIDEBAR_W,flexShrink:0,background:S.bg,borderRight:`1px solid ${S.border}`,display:"flex",flexDirection:"column",overflow:"auto"}}>
        {/* Brand — Stripe puts org name + dropdown at top */}
        <div style={{padding:"16px 16px 8px"}}>
          <button onClick={()=>{}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,border:`1px solid ${S.border}`,background:S.bg,cursor:"pointer",fontFamily:sans,textAlign:"left"}}>
            <div style={{width:28,height:28,borderRadius:6,background:T.black,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{color:"#fff",fontSize:12,fontWeight:700}}>TT</span>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{org?.name||"Ticket Tree"}</div>
            </div>
            <span style={{fontSize:12,color:T.sub}}>▾</span>
          </button>
        </div>

        {/* Nav — Stripe style: no background on items, just left border + gray bg on active */}
        <div style={{padding:"8px 0",flex:1}}>
          {(()=>{
            let lastSection=undefined;
            return NAV_ITEMS.map(n=>{
              const showSectionLabel = n.section && n.section!==lastSection;
              lastSection=n.section;
              const isActive=(nav===n.id)&&!showDetail;
              return <div key={n.id}>
                {showSectionLabel&&<div style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,padding:"16px 20px 6px"}}>{n.section}</div>}
                <button onClick={()=>{setNav(n.id);if(n.id!=="accounts")setSelected(null);}} style={{
                  width:"100%",display:"flex",alignItems:"center",gap:10,
                  padding:"7px 16px",border:"none",cursor:"pointer",fontFamily:sans,
                  fontSize:13,fontWeight:isActive?600:400,
                  background:isActive?S.activeBg:"transparent",
                  color:isActive?S.activeText:S.inactiveText,
                  textAlign:"left",
                  borderLeft:isActive?`2px solid ${S.activeBorder}`:"2px solid transparent",
                  transition:"background .1s",
                }}>
                  <span style={{fontSize:14,width:18,textAlign:"center",opacity:.7}}>{n.icon}</span>
                  {n.label}
                </button>
              </div>;
            });
          })()}
        </div>

        {/* Org switcher at bottom — like Stripe's account switcher */}
        <div style={{padding:"12px 16px",borderTop:`1px solid ${S.border}`}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,marginBottom:6}}>Organization</div>
          {orgs.map(o=>(
            <button key={o.id} onClick={()=>setOrgId(o.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"6px 8px",borderRadius:6,border:"none",background:o.id===orgId?"#F0EEFB":"transparent",color:o.id===orgId?T.purple:S.inactiveText,fontFamily:sans,fontSize:13,fontWeight:o.id===orgId?600:400,cursor:"pointer",textAlign:"left",marginBottom:2}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:o.id===orgId?T.purple:"transparent",border:`1px solid ${o.id===orgId?T.purple:S.labelText}`,flexShrink:0}}/>
              {o.name}
            </button>
          ))}
          <button onClick={()=>saveOrg({id:uid(),name:"New Org",sub:""})} style={{width:"100%",padding:"5px 8px",borderRadius:6,border:"none",background:"transparent",color:S.labelText,fontFamily:sans,fontSize:12,cursor:"pointer",textAlign:"left",marginTop:2}}>+ Add org</button>
        </div>

        {/* Agent status */}
        <div style={{padding:"12px 16px",borderTop:`1px solid ${S.border}`}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,marginBottom:6}}>Agent</div>
          <div style={{fontSize:12,color:T.ink,fontWeight:500}}>Weekly pull ready</div>
          <div style={{fontSize:11,color:S.inactiveText,marginTop:1,marginBottom:8}}>Last run: not yet</div>
          <button style={{width:"100%",padding:"7px",borderRadius:6,border:`1px solid ${T.purple}`,background:T.purple,color:"#fff",fontFamily:sans,fontSize:12,fontWeight:600,cursor:"pointer"}}>Run pull ⚡</button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{flex:1,overflow:"auto",background:"#FFFFFF",minWidth:0}}>

        {/* ── ACCOUNT DETAIL — full main area, Stripe transaction layout ── */}
        {showDetail&&<StripeDetail
          a={selectedAcct}
          tab={detailTab}
          onTabChange={setDetailTab}
          onBack={()=>setSelected(null)}
          onEdit={()=>setEditMode(true)}
          onDelete={async()=>{await delAcct(selectedAcct);}}
          onSave={saveAcct}
        />}

        {/* ── DASHBOARD ── */}
        {!showDetail&&nav==="dashboard"&&<div style={{padding:"32px 40px"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28}}>
            <div>
              <div style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,marginBottom:6}}>
                <span style={{color:T.purple,cursor:"pointer"}}>Accounts</span> → Dashboard
              </div>
              <h1 style={{fontSize:24,fontWeight:700,letterSpacing:-.4,margin:"0 0 4px",color:T.ink}}>{org?.name}</h1>
              <p style={{fontSize:13,color:S.inactiveText,margin:0}}>Real-time revenue, pipeline, and contract health</p>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{setNav("accounts");setEditMode(true);}} style={{padding:"8px 16px",borderRadius:6,border:`1px solid ${S.border}`,background:"#fff",color:T.ink,fontFamily:sans,fontSize:13,fontWeight:500,cursor:"pointer"}}>+ New account</button>
              <div style={{width:34,height:34,borderRadius:"50%",background:"#D8C2AE"}}/>
            </div>
          </div>

          {/* 4-col KPI strip */}
          <div style={{display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr 1fr",gap:12,marginBottom:28}}>
            <div style={{background:T.black,borderRadius:12,padding:"16px 20px",display:"flex",flexDirection:"column",minHeight:136,color:"#fff"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"auto"}}>
                <span style={{fontSize:10.5,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:"#9CA0AB"}}>AI Forecast</span>
                <span style={{fontSize:13,color:"#9CA0AB"}}>✦</span>
              </div>
              <div style={{fontSize:32,fontWeight:800,letterSpacing:-1.2,lineHeight:1,margin:"10px 0 8px"}}>{fmtK(forecast)}</div>
              <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11.5,fontWeight:600,padding:"5px 12px",borderRadius:999,background:"#fff",color:T.black,width:"fit-content"}}>↑ {confidence} Confidence</span>
            </div>
            {[
              {label:"Active GMV",    value:fmtK(gmvActual),  sub:`${pipelinePct}% of plan`},
              {label:"Pipeline",      value:coverage,          sub:coverageHealthy?"Healthy":"Watch"},
              {label:"Net Revenue",   value:(netRev<0?"-":"")+fmtK(Math.abs(netRev)), sub:netRev>=0?"Positive":"Underwater", col:netRev<0?T.red:undefined},
            ].map((t,i)=>(
              <div key={i} style={{background:"#fff",border:`1px solid ${S.border}`,borderRadius:12,padding:"16px 20px",display:"flex",flexDirection:"column",minHeight:136,justifyContent:"space-between"}}>
                <span style={{fontSize:10.5,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText}}>{t.label}</span>
                <div>
                  <div style={{fontSize:28,fontWeight:700,letterSpacing:-1,lineHeight:1,marginBottom:6,color:t.col||T.ink}}>{t.value}</div>
                  <span style={{display:"inline-flex",alignItems:"center",fontSize:11.5,fontWeight:600,padding:"4px 10px",borderRadius:999,background:T.black,color:"#fff"}}>{t.sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Two-column: actions + milestones */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:28}}>
            <div style={{border:`1px solid ${S.border}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"16px 20px",borderBottom:`1px solid ${S.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:10.5,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:2}}>AI Powered</div><div style={{fontSize:15,fontWeight:600,color:T.ink}}>Priority Actions</div></div>
                <span style={{width:24,height:24,borderRadius:"50%",background:T.black,color:"#fff",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{actions.length}</span>
              </div>
              {actions.slice(0,4).map((r,i)=>(
                <button key={i} onClick={()=>{setSelected(r.aid);setNav("accounts");setDetailTab("overview");}} style={{width:"100%",display:"flex",alignItems:"flex-start",gap:12,padding:"14px 20px",border:"none",borderTop:i?`1px solid ${S.border}`:"none",background:"#fff",cursor:"pointer",fontFamily:sans,textAlign:"left"}}>
                  <Tag label={SEV[r.severity].l} c={SEV[r.severity].c} s={SEV[r.severity].s}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:T.ink,marginBottom:2}}>{r.risk}</div>
                    <div style={{fontSize:12,color:S.inactiveText,lineHeight:1.4}}>{r.action}</div>
                  </div>
                  <span style={{fontSize:12,color:S.labelText,flexShrink:0,marginTop:2}}>{r.acct}</span>
                </button>
              ))}
              {actions.length===0&&<div style={{padding:"24px 20px",fontSize:13,color:S.inactiveText}}>No open actions.</div>}
            </div>

            <div style={{border:`1px solid ${S.border}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"16px 20px",borderBottom:`1px solid ${S.border}`}}>
                <div style={{fontSize:10.5,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:2}}>Timeline</div>
                <div style={{fontSize:15,fontWeight:600,color:T.ink}}>Next 14 days</div>
              </div>
              {allMilestones.slice(0,5).map((m,i)=>{
                const mt=MILESTONE_TYPES[m.type]||MILESTONE_TYPES.review;
                const d=daysDiff(m.date);
                return <button key={m.id} onClick={()=>{setSelected(m.aid);setNav("accounts");setDetailTab("timeline");}} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 20px",border:"none",borderTop:i?`1px solid ${S.border}`:"none",background:"#fff",cursor:"pointer",fontFamily:sans,textAlign:"left"}}>
                  <span style={{fontSize:16,flexShrink:0}}>{mt.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title}</div>
                    <div style={{fontSize:11.5,color:S.inactiveText,marginTop:1}}>{m.acct}</div>
                  </div>
                  <span style={{fontSize:12,fontWeight:600,color:d<=3?T.red:d<=7?T.yellow:S.inactiveText,flexShrink:0}}>{d===0?"Today":d===1?"Tomorrow":`${d}d`}</span>
                </button>;
              })}
              {allMilestones.length===0&&<div style={{padding:"24px 20px",fontSize:13,color:S.inactiveText}}>No upcoming milestones in the next 14 days.</div>}
            </div>
          </div>

          <WeeklyDigest accounts={orgAccts}/>
        </div>}

        {/* ── ACCOUNTS LIST ── */}
        {!showDetail&&nav==="accounts"&&<div style={{padding:"32px 40px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div>
              <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-.3,margin:"0 0 4px",color:T.ink}}>Accounts</h1>
              <p style={{fontSize:13,color:S.inactiveText,margin:0}}>{orgAccts.length} account{orgAccts.length!==1?"s":""} · {orgAccts.filter(a=>a.health==="red").length} need action</p>
            </div>
            <button onClick={()=>setEditMode(true)} style={{padding:"8px 16px",borderRadius:6,border:`1px solid ${S.border}`,background:"#fff",color:T.ink,fontFamily:sans,fontSize:13,fontWeight:500,cursor:"pointer"}}>+ New account</button>
          </div>

          {/* Stripe-style table */}
          <div style={{border:`1px solid ${S.border}`,borderRadius:10,overflow:"hidden",background:"#fff"}}>
            <div style={{display:"grid",gridTemplateColumns:"2.2fr 1fr 1fr 1fr 1fr 100px",padding:"10px 20px",background:"#FAFAFA",borderBottom:`1px solid ${S.border}`}}>
              {["Account","Health","GMV realized","Fees earned","Net revenue",""].map((h,i)=>(
                <div key={i} style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,textAlign:i>=2&&i<5?"right":"left"}}>{h}</div>
              ))}
            </div>
            {orgAccts.length===0&&<div style={{padding:"40px",textAlign:"center",fontSize:14,color:S.inactiveText}}>No accounts yet. Add one to get started.</div>}
            {orgAccts.map((a,i)=>{
              const c=a.contract, tc=sumCosts(a);
              const fees=c?(c.gmvActual||0)*(c.netTakePct||0)/100:0;
              const net=fees-tc;
              return <button key={a.id} onClick={()=>{setSelected(a.id);setDetailTab("overview");}} style={{display:"grid",gridTemplateColumns:"2.2fr 1fr 1fr 1fr 1fr 100px",padding:"13px 20px",width:"100%",background:"#fff",border:"none",borderTop:i?`1px solid ${S.border}`:"none",cursor:"pointer",fontFamily:sans,color:T.ink,textAlign:"left",transition:"background .1s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#FAFAFA"}
                onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:30,height:30,borderRadius:6,background:a.logo||"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{a.short||a.account.slice(0,2).toUpperCase()}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:T.ink}}>{a.account}</div>
                    <div style={{fontSize:11.5,color:S.inactiveText,marginTop:1}}>{a.owner} · {a.eventType}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center"}}><Tag label={HEALTH[a.health].label} c={HEALTH[a.health].c} s={HEALTH[a.health].soft}/></div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",fontSize:13}}>{c?fmtK(c.gmvActual):"—"}</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",fontSize:13}}>{c?fmtK(fees):"—"}</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",fontSize:13,color:net<0?T.red:T.ink}}>{c?(net<0?"-":"")+fmtK(Math.abs(net)):"—"}</div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",fontSize:12,color:T.purple,fontWeight:500}}>View →</div>
              </button>;
            })}
          </div>
        </div>}

        {/* ── TIMELINE ── */}
        {!showDetail&&nav==="timeline"&&<div style={{padding:"32px 40px"}}>
          <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-.3,margin:"0 0 24px",color:T.ink}}>Timeline — all accounts</h1>
          {orgAccts.map(a=>(
            <div key={a.id} style={{marginBottom:32}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${S.border}`}}>
                <div style={{width:26,height:26,borderRadius:6,background:a.logo,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>{a.short}</div>
                <span style={{fontSize:14,fontWeight:600,color:T.ink}}>{a.account}</span>
                <Tag label={HEALTH[a.health].label} c={HEALTH[a.health].c} s={HEALTH[a.health].soft}/>
                <button onClick={()=>{setSelected(a.id);setNav("accounts");setDetailTab("timeline");}} style={{marginLeft:"auto",fontSize:12,color:T.purple,background:"none",border:"none",cursor:"pointer",fontWeight:500}}>Open account →</button>
              </div>
              <div style={{paddingLeft:16,borderLeft:`2px solid ${S.border}`}}>
                {(a.milestones||[]).sort((x,y)=>new Date(x.date)-new Date(y.date)).map(m=>{
                  const mt=MILESTONE_TYPES[m.type]||MILESTONE_TYPES.review;
                  const d=daysDiff(m.date);
                  return <div key={m.id} style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:14,opacity:m.done?.45:1}}>
                    <div style={{width:26,height:26,borderRadius:"50%",background:m.done?"#F3F4F6":mt.color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,marginLeft:-28,border:`1.5px solid ${m.done?S.border:mt.color}`}}>{m.done?"✓":mt.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <span style={{fontSize:13,fontWeight:500,color:T.ink}}>{m.title}</span>
                        <span style={{fontSize:11,fontWeight:500,padding:"2px 7px",borderRadius:4,background:mt.color+"12",color:mt.color}}>{mt.label}</span>
                        {!m.done&&d<=3&&<span style={{fontSize:11,fontWeight:600,color:T.red}}>{d===0?"Today":d===1?"Tomorrow":`${d}d`}</span>}
                      </div>
                      {m.note&&<div style={{fontSize:12,color:S.inactiveText,marginTop:2}}>{m.note}</div>}
                    </div>
                    <div style={{fontSize:12,color:S.labelText,flexShrink:0}}>{new Date(m.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
                  </div>;
                })}
                {(a.milestones||[]).length===0&&<div style={{fontSize:13,color:S.inactiveText,paddingBottom:8}}>No milestones added.</div>}
              </div>
            </div>
          ))}
        </div>}

        {/* ── DIGEST ── */}
        {!showDetail&&nav==="digest"&&<div style={{padding:"32px 40px",maxWidth:840}}>
          <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-.3,margin:"0 0 20px",color:T.ink}}>Pipeline digest</h1>
          <WeeklyDigest accounts={orgAccts}/>
        </div>}

        {/* ── DISPUTES shortcut ── */}
        {!showDetail&&nav==="disputes"&&<div style={{padding:"32px 40px"}}>
          <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-.3,margin:"0 0 20px",color:T.ink}}>Disputes</h1>
          {orgAccts.flatMap(a=>(a.chargebacks||[]).map(cb=>({...cb,acct:a.account,aid:a.id}))).length===0
            ?<div style={{fontSize:14,color:S.inactiveText}}>No chargebacks or disputes logged.</div>
            :<div style={{border:`1px solid ${S.border}`,borderRadius:10,overflow:"hidden",background:"#fff"}}>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 120px",padding:"10px 20px",background:"#FAFAFA",borderBottom:`1px solid ${S.border}`}}>
                {["Account / disputed by","Amount","Date","Status",""].map((h,i)=>(
                  <div key={i} style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText}}>{h}</div>
                ))}
              </div>
              {orgAccts.flatMap(a=>(a.chargebacks||[]).map(cb=>({...cb,acct:a.account,aid:a.id}))).map((cb,i)=>{
                const col=cb.status==="Open"?T.red:cb.status.includes("won")?T.green:S.inactiveText;
                return <div key={cb.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 120px",padding:"13px 20px",borderTop:i?`1px solid ${S.border}`:"none",background:"#fff"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:500,color:T.ink}}>{cb.disputedBy||"Unknown"}</div>
                    <div style={{fontSize:11.5,color:S.inactiveText,marginTop:1}}>{cb.acct}</div>
                  </div>
                  <div style={{fontSize:13,color:T.ink,display:"flex",alignItems:"center"}}>{cb.amount>0?fmt(cb.amount):"—"}</div>
                  <div style={{fontSize:13,color:S.inactiveText,display:"flex",alignItems:"center"}}>{cb.date}</div>
                  <div style={{display:"flex",alignItems:"center"}}><span style={{fontSize:12,fontWeight:600,padding:"3px 9px",borderRadius:4,background:col+"14",color:col}}>{cb.status}</span></div>
                  <button onClick={()=>{setSelected(cb.aid);setNav("accounts");setDetailTab("timeline");}} style={{fontSize:12,color:T.purple,background:"none",border:"none",cursor:"pointer",fontWeight:500,textAlign:"left"}}>View account →</button>
                </div>;
              })}
            </div>
          }
        </div>}

        {/* ── COST LEDGER shortcut ── */}
        {!showDetail&&nav==="costs"&&<div style={{padding:"32px 40px"}}>
          <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-.3,margin:"0 0 20px",color:T.ink}}>Cost ledger</h1>
          {(()=>{
            const allCosts=orgAccts.flatMap(a=>(a.costs||[]).filter(c=>c.computed>0).map(c=>({...c,acct:a.account,aid:a.id})));
            const total=allCosts.reduce((n,c)=>n+c.computed,0);
            return <>
              <div style={{fontSize:13,color:S.inactiveText,marginBottom:16}}>Total logged: <b style={{color:T.ink}}>{fmt(total)}</b></div>
              {allCosts.length===0
                ?<div style={{fontSize:14,color:S.inactiveText}}>No costs logged yet. Open an account → Economics to add costs.</div>
                :<div style={{border:`1px solid ${S.border}`,borderRadius:10,overflow:"hidden",background:"#fff"}}>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:"10px 20px",background:"#FAFAFA",borderBottom:`1px solid ${S.border}`}}>
                    {["Account / label","Type","When","Amount"].map((h,i)=>(
                      <div key={i} style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,textAlign:i===3?"right":"left"}}>{h}</div>
                    ))}
                  </div>
                  {allCosts.map((c,i)=>(
                    <div key={c.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:"12px 20px",borderTop:i?`1px solid ${S.border}`:"none"}}>
                      <div><div style={{fontSize:13,color:T.ink,fontWeight:500}}>{c.label}</div><div style={{fontSize:11.5,color:S.inactiveText,marginTop:1}}>{c.acct}</div></div>
                      <div style={{fontSize:13,color:S.inactiveText,display:"flex",alignItems:"center",textTransform:"capitalize"}}>{c.type}</div>
                      <div style={{fontSize:13,color:S.inactiveText,display:"flex",alignItems:"center"}}>{c.when||"—"}</div>
                      <div style={{fontSize:13,fontWeight:600,color:T.ink,display:"flex",alignItems:"center",justifyContent:"flex-end"}}>{fmt(c.computed)}</div>
                    </div>
                  ))}
                </div>
              }
            </>;
          })()}
        </div>}

      </div>

      {/* ── NEW / EDIT ACCOUNT MODAL ── */}
      {editMode&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}} onClick={()=>setEditMode(false)}>
          <div style={{width:600,maxHeight:"90vh",overflow:"auto",background:"#fff",borderRadius:12,padding:"28px",boxShadow:"0 20px 60px rgba(0,0,0,.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h2 style={{margin:0,fontSize:18,fontWeight:700,color:T.ink}}>{selectedAcct&&editMode?"Edit account":"New account"}</h2>
              <button onClick={()=>setEditMode(false)} style={{width:28,height:28,borderRadius:"50%",border:`1px solid ${S.border}`,background:"none",cursor:"pointer",fontSize:16,color:T.sub,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <AccountForm
              orgId={orgId}
              existing={selectedAcct&&editMode?selectedAcct:undefined}
              onCancel={()=>setEditMode(false)}
              onSave={async a=>{await saveAcct(a);setSelected(a.id);setNav("accounts");setEditMode(false);}}
            />
          </div>
        </div>
      )}

    </div>
  );
}

// ── STRIPE-STYLE ACCOUNT DETAIL ──
// Full main area. Left: main content + tabs. Right: meta sidebar.
// Mirrors Stripe's transaction detail layout exactly.
function StripeDetail({a, tab, onTabChange, onBack, onEdit, onDelete, onSave}){
  const [costs,setCosts]=useState(a.costs||[]);
  const [milestones,setMilestones]=useState(a.milestones||[]);
  const [eco,setEco]=useState(a.contract||{});
  const [addingCost,setAddingCost]=useState(false);
  const [cycles,setCycles]=useState(a.cycles||[]);
  const [chargebacks,setChargebacks]=useState(a.chargebacks||[]);
  const [features,setFeatures]=useState(a.features||[]);
  const [toast,setToast]=useState(null);
  const [cycle,setCycle]=useState(a.contractCycle||1);

  function save(patch={}){ onSave({...a,contract:eco,costs,milestones,contractCycle:cycle,cycles,chargebacks,features,...patch}); }
  function saveEco(k,v){const n={...eco,[k]:v};setEco(n);save({contract:n});}
  function addCost(c2){const n=[...costs,c2];setCosts(n);save({costs:n});}
  function delCost(id){const n=costs.filter(x=>x.id!==id);setCosts(n);save({costs:n});}
  function addMilestone(m){const n=[...milestones,m];setMilestones(n);save({milestones:n});}
  function toggleMilestone(id){const n=milestones.map(m=>m.id===id?{...m,done:!m.done}:m);setMilestones(n);save({milestones:n});}
  function delMilestone(id){const n=milestones.filter(m=>m.id!==id);setMilestones(n);save({milestones:n});}
  function addContractCycle(cy){const n=[...cycles,cy];setCycles(n);save({cycles:n});}
  function updateContractCycle(id,patch){const n=cycles.map(c=>c.id===id?{...c,...patch}:c);setCycles(n);save({cycles:n});}
  function delContractCycle(id){const n=cycles.filter(c=>c.id!==id);setCycles(n);save({cycles:n});}
  function addChargeback(cb){const n=[...chargebacks,cb];setChargebacks(n);save({chargebacks:n});}
  function updateChargeback(id,patch){const n=chargebacks.map(c=>c.id===id?{...c,...patch}:c);setChargebacks(n);save({chargebacks:n});}
  function delChargeback(id){const n=chargebacks.filter(c=>c.id!==id);setChargebacks(n);save({chargebacks:n});}
  function addFeature(f2){const n=[...features,f2];setFeatures(n);save({features:n});}
  function updateFeature(id,patch){const n=features.map(f=>f.id===id?{...f,...patch}:f);setFeatures(n);save({features:n});}
  function delFeature(id){const n=features.filter(f=>f.id!==id);setFeatures(n);save({features:n});}
  function resolveSignal(s,keep){
    const pend=(a.signals_pending||[]).filter(x=>x.id!==s.id);
    const risks=keep?[...(a.risks||[]),{risk:s.kind,severity:s.sev,action:s.text}]:(a.risks||[]);
    const dismissed=keep?(a.dismissed_signals||[]):[...(a.dismissed_signals||[]),{...s,dismissedAt:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}];
    setToast(keep?"Added to risks ✓":"Dismissed");
    setTimeout(()=>setToast(null),2000);
    save({signals_pending:pend,risks,dismissed_signals:dismissed});
  }

  const h=HEALTH[a.health];
  const c=a.contract;
  const tc=costs.reduce((n,x)=>n+(x.computed||0),0);
  const fees=c?(eco.gmvActual||0)*(eco.netTakePct||0)/100:0;
  const net=fees-tc;
  const fa=a.fault||{};
  const v=VERDICT[fa.verdict]||VERDICT.unclear;

  const TABS=["overview","timeline","economics","contract"];

  return (
    <div style={{display:"flex",height:"100%",background:"#fff"}}>
      {/* ── LEFT: main content ── */}
      <div style={{flex:1,overflow:"auto",padding:"0",minWidth:0}}>
        {/* Breadcrumb + title — Stripe style */}
        <div style={{padding:"20px 32px 0",borderBottom:`1px solid ${S.border}`,background:"#fff",position:"sticky",top:0,zIndex:10}}>
          <div style={{fontSize:12,color:T.purple,marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
            <button onClick={onBack} style={{background:"none",border:"none",color:T.purple,cursor:"pointer",fontFamily:sans,fontSize:12,fontWeight:500,padding:0}}>← Accounts</button>
          </div>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
                <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-.3,margin:0,color:T.ink}}>{a.account}</h1>
                <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:4,background:h.soft,color:h.c}}>● {h.label}</span>
              </div>
              <div style={{fontSize:13,color:S.inactiveText}}>
                OWNER: <b style={{color:T.ink,fontWeight:500}}>{a.owner}</b> · {a.eventType} · {a.sponsorMode}
                {c&&<> · <b style={{color:T.ink,fontWeight:500}}>{c.start} – {c.end}</b></>}
              </div>
              <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                {(a.products||[]).map(p=><span key={p} style={{fontSize:11.5,fontWeight:500,padding:"3px 9px",borderRadius:4,background:"#F0EEFB",color:T.purple}}>{p}</span>)}
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button onClick={onEdit} style={{padding:"7px 14px",borderRadius:6,border:`1px solid ${S.border}`,background:"#fff",color:T.ink,fontFamily:sans,fontSize:12,fontWeight:500,cursor:"pointer"}}>Edit</button>
              <button onClick={onDelete} style={{padding:"7px 14px",borderRadius:6,border:`1px solid ${T.redSoft}`,background:T.redSoft,color:T.red,fontFamily:sans,fontSize:12,fontWeight:500,cursor:"pointer"}}>Delete</button>
            </div>
          </div>
          {/* Tab bar — Stripe style: bottom border, no background */}
          <div style={{display:"flex",gap:0,marginBottom:-1}}>
            {TABS.map(t=>(
              <button key={t} onClick={()=>onTabChange(t)} style={{padding:"8px 16px",border:"none",borderBottom:`2px solid ${tab===t?T.purple:"transparent"}`,background:"transparent",color:tab===t?T.purple:S.inactiveText,fontFamily:sans,fontSize:13,fontWeight:tab===t?600:400,cursor:"pointer",textTransform:"capitalize",transition:"color .15s"}}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{padding:"24px 32px 48px"}}>

          {/* OVERVIEW */}
          {tab==="overview"&&<>
            {/* Pending signals */}
            {(a.signals_pending||[]).length>0&&<div style={{marginBottom:24}}>
              <div style={{fontSize:12,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,marginBottom:10}}>Signals to review</div>
              {a.signals_pending.map(s=>(
                <div key={s.id} style={{border:`1px solid ${T.redSoft}`,borderRadius:8,padding:"14px 16px",marginBottom:8,background:"#fff"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:12,fontWeight:600,color:T.red}}>⚑ {s.kind}</span>
                      <Tag label={SEV[s.sev].l} c={SEV[s.sev].c} s={SEV[s.sev].s}/>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>resolveSignal(s,true)} style={{padding:"5px 12px",borderRadius:5,border:"none",background:T.ink,color:"#fff",fontFamily:sans,fontSize:12,fontWeight:600,cursor:"pointer"}}>Add as risk</button>
                      <button onClick={()=>resolveSignal(s,false)} style={{padding:"5px 12px",borderRadius:5,border:`1px solid ${S.border}`,background:"#fff",color:S.inactiveText,fontFamily:sans,fontSize:12,cursor:"pointer"}}>Dismiss</button>
                    </div>
                  </div>
                  <div style={{fontSize:13,color:T.ink,lineHeight:1.5}}>{s.text}</div>
                </div>
              ))}
            </div>}

            {/* What changed */}
            {(a.signal||a.shift)&&<div style={{marginBottom:24}}>
              <div style={{fontSize:12,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,marginBottom:10}}>Recent activity</div>
              <div style={{border:`1px solid ${S.border}`,borderRadius:8,overflow:"hidden"}}>
                {a.signal&&<div style={{padding:"14px 16px",borderBottom:a.shift?`1px solid ${S.border}`:"none"}}>
                  <div style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,marginBottom:6}}>✉ Signal detected</div>
                  <div style={{fontSize:13,color:T.ink,lineHeight:1.5}}>{a.signal}</div>
                </div>}
                {a.shift&&<div style={{padding:"14px 16px"}}>
                  <div style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,marginBottom:6}}>↗ Exposure shift</div>
                  <div style={{fontSize:13,color:T.ink,lineHeight:1.5}}>{a.shift}</div>
                </div>}
              </div>
            </div>}

            {/* Fault assessment */}
            {fa.verdict&&<div style={{marginBottom:24}}>
              <div style={{fontSize:12,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,marginBottom:10}}>Fault assessment</div>
              <div style={{border:`1px solid ${S.border}`,borderLeft:`3px solid ${v.c}`,borderRadius:8,padding:"16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <span style={{fontSize:12,fontWeight:600,padding:"4px 10px",borderRadius:4,background:v.s,color:v.c}}>{v.label}</span>
                </div>
                <p style={{fontSize:13,lineHeight:1.55,margin:"0 0 12px",color:T.ink}}>{fa.reasoning}</p>
                <div style={{fontSize:13,lineHeight:1.7,color:S.inactiveText}}>
                  <div><b style={{color:T.red}}>Against us:</b> {fa.against_us}</div>
                  <div><b style={{color:T.green}}>Against them:</b> {fa.against_them}</div>
                </div>
              </div>
            </div>}

            {/* Risks */}
            {a.risks?.length>0&&<div style={{marginBottom:24}}>
              <div style={{fontSize:12,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,marginBottom:10}}>Risks & exposure</div>
              <div style={{border:`1px solid ${S.border}`,borderRadius:8,overflow:"hidden"}}>
                {a.risks.map((r,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:14,padding:"14px 16px",borderTop:i?`1px solid ${S.border}`:"none",background:"#fff"}}>
                    <Tag label={SEV[r.severity].l} c={SEV[r.severity].c} s={SEV[r.severity].s}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600,color:T.ink,marginBottom:3}}>{r.risk}</div>
                      <div style={{fontSize:12,color:S.inactiveText,lineHeight:1.45}}>→ {r.action}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>}

            {/* Obligations */}
            {a.obligations?.length>0&&<div style={{marginBottom:24}}>
              <div style={{fontSize:12,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,marginBottom:10}}>Obligations vs. contract</div>
              <div style={{border:`1px solid ${S.border}`,borderRadius:8,overflow:"hidden"}}>
                {a.obligations.map((o,i)=>{const s=OBL_STATUS[o.status]||OBL_STATUS.unclear; return(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"60px 1fr 80px",gap:16,padding:"12px 16px",borderTop:i?`1px solid ${S.border}`:"none",background:"#fff",alignItems:"start"}}>
                    <span style={{fontSize:11,fontWeight:600,textTransform:"uppercase",color:o.party==="us"?T.purple:S.inactiveText,paddingTop:2}}>{o.party}</span>
                    <div><div style={{fontSize:13,fontWeight:500,color:T.ink}}>{o.obligation}</div><div style={{fontSize:11.5,color:S.inactiveText,marginTop:2}}>{o.source}</div></div>
                    <span style={{fontSize:12,fontWeight:600,color:s.c,textAlign:"right",paddingTop:2}}>{s.t}</span>
                  </div>
                );})}
              </div>
            </div>}

            {/* Overextension */}
            {a.flags?.length>0&&<div>
              <div style={{fontSize:12,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,marginBottom:10}}>Overextension</div>
              <div style={{border:`1px solid ${T.redSoft}`,borderRadius:8,padding:"14px 16px"}}>
                {a.flags.map((f,i)=><div key={i} style={{fontSize:13,color:T.ink,lineHeight:1.5,padding:"4px 0",borderTop:i?`1px solid ${S.border}`:"none",display:"flex",gap:8}}><span style={{color:T.red,fontSize:9,marginTop:5}}>▲</span>{f}</div>)}
              </div>
            </div>}
          </>}

          {/* TIMELINE */}
          {tab==="timeline"&&<>
            <AccountTimeline milestones={milestones} onAdd={addMilestone} onToggle={toggleMilestone} onDelete={delMilestone}/>
            <div style={{marginTop:32}}>
              <div style={{fontSize:12,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,marginBottom:12}}>Contract cycles</div>
              <ContractCycles cycles={cycles} currentProducts={a.products||[]} onAdd={addContractCycle} onUpdate={updateContractCycle} onDelete={delContractCycle}/>
            </div>
            <div style={{marginTop:28}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:12,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText}}>Chargebacks {chargebacks.some(c=>c.status==="Open")&&<span style={{color:T.red,marginLeft:6}}>{chargebacks.filter(c=>c.status==="Open").length} open</span>}</div>
                <button onClick={()=>addChargeback({id:uid(),amount:0,reason:"",status:"Open",date:new Date().toISOString().slice(0,10),disputedBy:"",note:""})} style={{fontSize:12,color:T.purple,background:"none",border:"none",cursor:"pointer",fontWeight:500}}>+ Add</button>
              </div>
              {chargebacks.length===0?<div style={{fontSize:13,color:S.inactiveText}}>No chargebacks logged.</div>
                :chargebacks.map(cb=><ChargebackRow key={cb.id} cb={cb} onUpdate={p=>updateChargeback(cb.id,p)} onDelete={()=>delChargeback(cb.id)}/>)}
            </div>
            <div style={{marginTop:28}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:12,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText}}>Feature tracker</div>
                <button onClick={()=>addFeature({id:uid(),name:"",status:"Scoped",scope:"contract",note:""})} style={{fontSize:12,color:T.purple,background:"none",border:"none",cursor:"pointer",fontWeight:500}}>+ Add</button>
              </div>
              <FeatureTracker features={features} onUpdate={updateFeature} onDelete={delFeature}/>
            </div>
          </>}

          {/* ECONOMICS */}
          {tab==="economics"&&c&&<>
            <ContractHealthRing eco={eco} costs={costs} obligations={a.obligations||[]} chargebacks={chargebacks} kpis={a.kpis||{}} risks={a.risks||[]}/>
            <div style={{marginTop:28}}>
              <div style={{fontSize:12,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,marginBottom:14}}>Revenue structure</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
                {[
                  {k:"Platform fee",v:(eco.platformFeePct||0)+"%"},
                  {k:"Kickback",v:(eco.kickbackPct||0)+"% → "+(eco.kickbackTo||"—")},
                  {k:"Net take",v:(eco.netTakePct||0)+"%"},
                  {k:"GMV realized",v:fmtK(eco.gmvActual||0)},
                  {k:"GMV projected",v:fmtK(eco.gmvProjected||0)},
                  {k:"Coverage",v:eco.gmvProjected>0?Math.round(100*(eco.gmvActual||0)/eco.gmvProjected)+"%":"—"},
                ].map((item,i)=>(
                  <div key={i} style={{border:`1px solid ${S.border}`,borderRadius:8,padding:"12px 14px"}}>
                    <div style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.3,marginBottom:4}}>{item.k}</div>
                    <div style={{fontSize:16,fontWeight:600,color:T.ink}}>{item.v}</div>
                  </div>
                ))}
              </div>
              <div style={{border:`1px solid ${S.border}`,borderRadius:8,overflow:"hidden",marginBottom:20}}>
                {[
                  {k:"Platform fees earned",v:fmt((eco.gmvActual||0)*(eco.platformFeePct||0)/100)},
                  {k:`Kickback (${eco.kickbackPct||0}% → ${eco.kickbackTo||"partner"})`,v:"−"+fmt((eco.gmvActual||0)*(eco.kickbackPct||0)/100)},
                  {k:"Net revenue",v:fmt(fees),bold:true},
                  {k:"Running costs",v:fmt(tc)},
                  {k:"Net so far",v:(net<0?"-":"")+fmt(Math.abs(net)),bold:true,color:net<0?T.red:T.green},
                ].map((row,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"12px 16px",borderTop:i?`1px solid ${S.border}`:"none",background:"#fff"}}>
                    <span style={{fontSize:13,color:row.bold?T.ink:S.inactiveText,fontWeight:row.bold?600:400}}>{row.k}</span>
                    <span style={{fontSize:13,fontWeight:row.bold?700:500,color:row.color||T.ink}}>{row.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:12,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText}}>Running costs</div>
                <button onClick={()=>setAddingCost(v=>!v)} style={{fontSize:12,color:T.purple,background:"none",border:"none",cursor:"pointer",fontWeight:500}}>{addingCost?"Cancel":"+ Add cost"}</button>
              </div>
              {addingCost&&<CostAddStripe onAdd={c2=>{addCost(c2);setAddingCost(false);}}/>}
              <div style={{border:`1px solid ${S.border}`,borderRadius:8,overflow:"hidden"}}>
                {costs.length===0&&<div style={{padding:"20px 16px",fontSize:13,color:S.inactiveText}}>No costs logged. Add dev, support, or time as they accrue.</div>}
                {costs.map((x,i)=>(
                  <div key={x.id} style={{display:"flex",alignItems:"center",padding:"12px 16px",borderTop:i?`1px solid ${S.border}`:"none",background:"#fff"}}>
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:T.ink}}>{x.label||x.type}</div><div style={{fontSize:11.5,color:S.inactiveText,marginTop:1}}>{x.note}{x.when?` · ${x.when}`:""}</div></div>
                    <span style={{fontSize:13,fontWeight:600,color:T.ink,marginRight:12}}>{x.computed>0?fmt(x.computed):"$0"}</span>
                    <button onClick={()=>delCost(x.id)} style={{background:"none",border:"none",color:S.labelText,cursor:"pointer",fontSize:16}}>×</button>
                  </div>
                ))}
              </div>
              <CostAddStripe onAdd={c2=>{addCost(c2);}} />
            </div>
          </>}
          {tab==="economics"&&!c&&<div style={{fontSize:14,color:S.inactiveText,padding:"40px 0",textAlign:"center"}}>No signed contract. Edit the account to add contract terms.</div>}

          {/* CONTRACT */}
          {tab==="contract"&&<>
            <ContractImport onImport={parsed=>{const n={...eco,...parsed};setEco(n);save({contract:n});setToast("Imported ✓");setTimeout(()=>setToast(null),2000);}}/>
            <div style={{border:`1px solid ${S.border}`,borderRadius:8,overflow:"hidden",marginTop:16}}>
              {c?[
                ["Start → End",`${eco.start||"—"} → ${eco.end||"—"}`],
                ["Renewal",eco.renewal||"—"],
                ["Payment terms",eco.paymentTerms||"—"],
                ["Liability cap",eco.liabilityCap?fmt(eco.liabilityCap):"⚠ Uncapped"],
                ["SLA target",eco.slaTarget?eco.slaTarget+"%":"—"],
                ["Data rights",eco.dataRights||"—"],
                ["IP ownership",eco.ipOwnership||"—"],
                ["Termination notice",eco.terminationNotice||"—"],
                ["Auto-renew",eco.autoRenew?"Yes":"No"],
                ["Exclusivity",eco.exclusive?"Yes":"No"],
                ["Audit rights",eco.auditRights?"Yes":"No"],
              ].map(([k,v2],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"12px 16px",borderTop:i?`1px solid ${S.border}`:"none",background:"#fff"}}>
                  <span style={{fontSize:13,color:S.inactiveText}}>{k}</span>
                  <span style={{fontSize:13,fontWeight:500,color:String(v2).startsWith("⚠")?T.red:T.ink}}>{v2}</span>
                </div>
              )):
              <div style={{padding:"24px 16px",fontSize:13,color:S.inactiveText}}>No signed contract on file. Edit the account to add contract terms.</div>}
            </div>
            {(a.dismissed_signals||[]).length>0&&<div style={{marginTop:24}}>
              <div style={{fontSize:12,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,marginBottom:10}}>Dismissed signals</div>
              <div style={{border:`1px solid ${S.border}`,borderRadius:8,overflow:"hidden"}}>
                {a.dismissed_signals.map((s,i)=>(
                  <div key={s.id} style={{padding:"12px 16px",borderTop:i?`1px solid ${S.border}`:"none"}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:500,color:S.inactiveText}}>{s.kind}</span><span style={{fontSize:11.5,color:S.labelText}}>{s.dismissedAt}</span></div>
                    <div style={{fontSize:12,color:S.labelText,marginTop:2,lineHeight:1.45}}>{s.text}</div>
                  </div>
                ))}
              </div>
            </div>}
          </>}

        </div>
      </div>

      {/* ── RIGHT: meta sidebar — Stripe "Details" panel ── */}
      <div style={{width:280,flexShrink:0,borderLeft:`1px solid ${S.border}`,overflow:"auto",background:"#fff",padding:"24px 20px"}}>
        <h2 style={{fontSize:14,fontWeight:700,color:T.ink,margin:"0 0 16px"}}>Details</h2>
        {[
          ["Deal value", a.value||"—"],
          ["Owner", a.owner||"—"],
          ["Event type", a.eventType||"—"],
          ["Sponsor", a.sponsorMode||"—"],
          c&&["Take rate", (eco.netTakePct||0)+"%"],
          c&&["GMV realized", fmtK(eco.gmvActual||0)],
          c&&["GMV projected", fmtK(eco.gmvProjected||0)],
          c&&["Fees earned", fmt(fees)],
          c&&["Running costs", fmt(tc)],
          c&&["Net so far", (net<0?"-":"")+fmt(Math.abs(net))],
          c&&["Renewal", eco.renewal||"TBD"],
          c&&["Liability cap", eco.liabilityCap?fmt(eco.liabilityCap):"⚠ Uncapped"],
        ].filter(Boolean).map(([k,v2],i)=>(
          <div key={i} style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:.3,textTransform:"uppercase",color:S.labelText,marginBottom:3}}>{k}</div>
            <div style={{fontSize:13,color:String(v2).startsWith("⚠")?T.red:T.ink,fontWeight:500}}>{v2}</div>
          </div>
        ))}
        {a.kpis&&<>
          <div style={{borderTop:`1px solid ${S.border}`,margin:"16px 0"}}/>
          <h2 style={{fontSize:14,fontWeight:700,color:T.ink,margin:"0 0 14px"}}>Performance</h2>
          {[
            ["Days since contact", a.kpis.daysSinceContact??"—", (a.kpis.daysSinceContact||0)>14],
            ["SLA actual", a.kpis.slaActual?a.kpis.slaActual+"%":"—", a.kpis.slaActual&&a.kpis.slaActual<99.9],
            ["Chargebacks open", a.kpis.chargebacks??"—", (a.kpis.chargebacks||0)>0],
            ["Sentiment", a.kpis.sentiment||"—", ["Cold","Watch"].includes(a.kpis.sentiment)],
          ].map(([k,v2,flag],i)=>(
            <div key={i} style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:600,letterSpacing:.3,textTransform:"uppercase",color:S.labelText,marginBottom:3}}>{k}</div>
              <div style={{fontSize:13,fontWeight:600,color:flag?T.red:T.ink}}>{v2}{flag&&<span style={{fontSize:10,marginLeft:4}}>▲</span>}</div>
            </div>
          ))}
        </>}
        <div style={{borderTop:`1px solid ${S.border}`,margin:"16px 0"}}/>
        <p style={{fontSize:11,color:S.labelText,lineHeight:1.6,margin:0}}>Internal gut-check, not legal advice. Hand disputes to counsel.</p>
      </div>

      {/* Toast */}
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:T.ink,color:"#fff",padding:"9px 18px",borderRadius:999,fontSize:13,fontWeight:600,zIndex:999,boxShadow:"0 4px 20px rgba(0,0,0,.18)"}}>{toast}</div>}
    </div>
  );
}

// Inline cost add for Stripe detail page
function CostAddStripe({onAdd}){
  const [open,setOpen]=useState(false);
  const [type,setType]=useState("flat");
  const [label,setLabel]=useState("");
  const [fields,setFields]=useState({amount:0,rate:150,hours:0,pct:0,base:0});
  const [note,setNote]=useState("");
  const ct=COST_TYPES.find(c=>c.id===type);
  const computed=ct.calc(fields);
  if(!open) return <button onClick={()=>setOpen(true)} style={{marginTop:10,width:"100%",padding:"10px",borderRadius:7,border:`1px dashed ${S.border}`,background:"#fff",color:T.purple,fontFamily:sans,fontSize:13,fontWeight:500,cursor:"pointer"}}>+ Log a cost</button>;
  return <div style={{border:`1px solid ${S.border}`,borderRadius:8,padding:"16px",marginTop:10,background:"#fff"}}>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
      {COST_TYPES.map(c=><button key={c.id} onClick={()=>setType(c.id)} style={{padding:"5px 10px",borderRadius:5,fontFamily:sans,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${type===c.id?T.purple:S.border}`,background:type===c.id?"#F0EEFB":"#fff",color:type===c.id?T.purple:S.inactiveText}}>{c.label}</button>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
      <div style={{border:`1px solid ${S.border}`,borderRadius:6,padding:"8px 10px"}}><label style={{fontSize:11,color:S.labelText,display:"block",fontWeight:600,textTransform:"uppercase",letterSpacing:.3}}>Label</label><input value={label} onChange={e=>setLabel(e.target.value)} style={{border:"none",outline:"none",fontSize:13,fontWeight:500,width:"100%",marginTop:2,fontFamily:sans}}/></div>
      {ct.fields.map(f=><div key={f} style={{border:`1px solid ${S.border}`,borderRadius:6,padding:"8px 10px"}}><label style={{fontSize:11,color:S.labelText,display:"block",fontWeight:600,textTransform:"uppercase",letterSpacing:.3}}>{FIELD_DEFS[f].l}</label><input type="number" value={fields[f]} onChange={e=>setFields(p=>({...p,[f]:+e.target.value||0}))} style={{border:"none",outline:"none",fontSize:13,fontWeight:500,width:"100%",marginTop:2,fontFamily:sans}}/></div>)}
    </div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:"#F0EEFB",borderRadius:6,marginBottom:10}}>
      <span style={{fontSize:12,color:T.purple,fontWeight:600}}>Computed</span>
      <span style={{fontSize:16,fontWeight:700,color:T.purple}}>{fmt(computed)}</span>
    </div>
    <div style={{display:"flex",gap:8}}>
      <button disabled={!computed&&!label} onClick={()=>{onAdd({id:uid(),type,label:label||ct.label,fields,computed,note,when:new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}),detail:ct.fields.map(f=>`${FIELD_DEFS[f].l}: ${fields[f]}`).join(" · ")});setOpen(false);setLabel("");setFields({amount:0,rate:150,hours:0,pct:0,base:0});}} style={{flex:1,padding:"8px",borderRadius:6,border:"none",background:(computed||label)?T.ink:"#E5E7EB",color:"#fff",fontFamily:sans,fontWeight:600,fontSize:13,cursor:"pointer"}}>Add cost</button>
      <button onClick={()=>setOpen(false)} style={{padding:"8px 14px",borderRadius:6,border:`1px solid ${S.border}`,background:"#fff",color:S.inactiveText,fontFamily:sans,fontSize:13,cursor:"pointer"}}>Cancel</button>
    </div>
  </div>;
}

function CompanyCard({a,onClick}){
  const c=a.contract,tc=sumCosts(a);
  const nextMilestone=(a.milestones||[]).filter(m=>!m.done&&daysDiff(m.date)>=0).sort((a,b)=>new Date(a.date)-new Date(b.date))[0];
  const mt=nextMilestone?MILESTONE_TYPES[nextMilestone.type]:null;
  const head=<div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 15px 12px"}}>
    <div style={{width:42,height:42,borderRadius:8,background:a.logo||"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0}}>{a.short||a.account.slice(0,2).toUpperCase()}</div>
    <div style={{flex:1}}>
      <div style={{fontSize:16,fontWeight:600,letterSpacing:-.2}}>{a.account}</div>
      <div style={{fontSize:12.5,color:T.sub,marginTop:1}}>{(a.products||[]).slice(0,2).join(" · ")}{c?` · C${a.contractCycle||1}`:""}</div>
    </div>
    <Tag label={HEALTH[a.health].label} c={HEALTH[a.health].c} s={HEALTH[a.health].soft}/>
  </div>;
  const base={background:T.bg,border:BD,borderRadius:8,marginTop:11,overflow:"hidden",cursor:"pointer",width:"100%",textAlign:"left",font:"inherit",color:"inherit",display:"block",fontFamily:sans};
  if(!c)return <button onClick={onClick} style={base}>{head}
    <div style={{padding:"0 15px 14px"}}>
      <div style={{fontSize:13,color:T.sub,lineHeight:1.45,marginBottom:nextMilestone?8:0}}>{a.summary}</div>
      {nextMilestone&&<div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:mt.color,fontWeight:600}}><span>{mt.icon}</span>{nextMilestone.title} · {daysDiff(nextMilestone.date)===0?"Today":daysDiff(nextMilestone.date)+"d"}</div>}
    </div>
  </button>;
  const fees=c.gmvActual*c.netTakePct/100,net=fees-tc,p2=pct(c.gmvActual,c.gmvProjected);
  return <button onClick={onClick} style={base}>{head}
    <div style={{padding:"0 15px 12px"}}>
      <div style={{height:6,borderRadius:3,background:"#E9EAEE",overflow:"hidden"}}><div style={{height:"100%",width:p2+"%",background:T.blue,borderRadius:3}}/></div>
      <div style={{display:"flex",gap:6,marginTop:8,fontSize:12,color:T.sub}}>
        <span><b style={{color:T.ink}}>{fmtK(c.gmvActual)}</b> of {fmtK(c.gmvProjected)} GMV</span>
        <span>·</span>
        <span><b style={{color:T.ink}}>{c.netTakePct}%</b> net take</span>
      </div>
      {nextMilestone&&<div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:mt.color,fontWeight:600,marginTop:7}}><span>{mt.icon}</span>{nextMilestone.title} · {daysDiff(nextMilestone.date)===0?"Today":daysDiff(nextMilestone.date)+"d"}</div>}
    </div>
    <div style={{display:"flex",borderTop:HD,padding:"11px 15px",gap:16}}>
      <CoStat k="Net revenue" v={fmtK(fees)}/>
      <CoStat k="Costs" v={fmtK(tc)}/>
      <CoStat k="Net" v={(net<0?"-":"")+fmtK(Math.abs(net))} color={net<0?T.red:T.green}/>
    </div>
  </button>;
}
const CoStat=({k,v,color})=><div style={{display:"flex",flexDirection:"column"}}><span style={{fontSize:11.5,color:T.sub}}>{k}</span><span style={{fontSize:14,fontWeight:600,marginTop:2,color:color||T.ink}}>{v}</span></div>;

// ── DETAIL with tabs ──
function Detail({a,onBack,onEdit,onDelete,onSave}){
  const [tab,setTab]=useState("timeline"); // default to timeline so it's immediately visible
  const [costs,setCosts]=useState(a.costs||[]);
  const [milestones,setMilestones]=useState(a.milestones||[]);
  const [eco,setEco]=useState(a.contract||{});
  const [addingCost,setAddingCost]=useState(false);
  const [cycle,setCycle]=useState(a.contractCycle||1);
  const [cycles,setCycles]=useState(a.cycles||[]);
  const [chargebacks,setChargebacks]=useState(a.chargebacks||[]);
  const [features,setFeatures]=useState(a.features||[]);
  const [toast,setToast]=useState(null);

  function save(patch={}){
    onSave({...a,contract:eco,costs,milestones,contractCycle:cycle,cycles,chargebacks,features,...patch});
  }

  const fa=a.fault||{},v=VERDICT[fa.verdict]||VERDICT.unclear,im=a.impact||{},h=HEALTH[a.health],c=a.contract;
  const tc=costs.reduce((n,x)=>n+(x.computed||0),0);
  const fees=c?(eco.gmvActual||0)*(eco.netTakePct||0)/100:0,net=fees-tc;

  function saveEco(key,val){const n={...eco,[key]:val};setEco(n);save({contract:n});}
  function addCost(cost){const n=[...costs,cost];setCosts(n);save({costs:n});}
  function delCost(id){const n=costs.filter(x=>x.id!==id);setCosts(n);save({costs:n});}
  function addMilestone(m){const n=[...milestones,m];setMilestones(n);save({milestones:n});}
  function toggleMilestone(id){const n=milestones.map(m=>m.id===id?{...m,done:!m.done}:m);setMilestones(n);save({milestones:n});}
  function delMilestone(id){const n=milestones.filter(m=>m.id!==id);setMilestones(n);save({milestones:n});}
  function saveCycle(c2){setCycle(c2);save({contractCycle:c2});}
  function addContractCycle(cy){const n=[...cycles,cy];setCycles(n);save({cycles:n});}
  function updateContractCycle(id,patch){const n=cycles.map(c=>c.id===id?{...c,...patch}:c);setCycles(n);save({cycles:n});}
  function delContractCycle(id){const n=cycles.filter(c=>c.id!==id);setCycles(n);save({cycles:n});}
  function addChargeback(cb){const n=[...chargebacks,cb];setChargebacks(n);save({chargebacks:n});}
  function updateChargeback(id,patch){const n=chargebacks.map(c=>c.id===id?{...c,...patch}:c);setChargebacks(n);save({chargebacks:n});}
  function delChargeback(id){const n=chargebacks.filter(c=>c.id!==id);setChargebacks(n);save({chargebacks:n});}
  function addFeature(f2){const n=[...features,f2];setFeatures(n);save({features:n});}
  function updateFeature(id,patch){const n=features.map(f=>f.id===id?{...f,...patch}:f);setFeatures(n);save({features:n});}
  function delFeature(id){const n=features.filter(f=>f.id!==id);setFeatures(n);save({features:n});}
  function resolveSignal(s,keep){
    const pend=(a.signals_pending||[]).filter(x=>x.id!==s.id);
    const risks=keep?[...(a.risks||[]),{risk:s.kind,severity:s.sev,action:s.text}]:(a.risks||[]);
    const dismissed=keep?(a.dismissed_signals||[]):[...(a.dismissed_signals||[]),{...s,dismissedAt:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}];
    setToast(keep?"Added to risks ✓":"Dismissed — visible in contract log");
    setTimeout(()=>setToast(null),2500);
    save({signals_pending:pend,risks,dismissed_signals:dismissed});
  }

  const panel={background:T.soft,border:HD,borderRadius:8,padding:16,marginTop:12};
  const panelW={...panel,background:T.bg,border:BD};
  const sb={background:T.bg,border:HD,borderRadius:8,padding:13,marginTop:10};
  const TABS=["overview","timeline","economics","contract"];

  return <>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0 6px"}}>
      <button style={icbtn} onClick={onBack}>‹</button>
      <div style={{display:"flex",gap:9,alignItems:"center"}}>
        <span style={{display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600,color:h.c}}><span style={{width:7,height:7,borderRadius:"50%",background:h.c}}/>{h.label}</span>
        <button style={icbtn} onClick={onEdit}>✎</button>
      </div>
    </div>
    <h1 style={{fontFamily:serif,fontSize:28,fontWeight:600,letterSpacing:-.4,margin:"12px 0 0"}}>{a.account}</h1>
    <div style={{fontSize:12.5,color:T.sub,marginTop:4}}>OWNER: <b style={{color:T.ink}}>{a.owner}</b> · {a.eventType} · {a.sponsorMode}</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:8}}>
      {(a.products||[]).map(p=><span key={p} style={{fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:5,background:T.purpleSoft,color:T.purple}}>{p}</span>)}
    </div>

    {/* Tabs */}
    <div style={{display:"flex",gap:0,marginTop:16,borderRadius:8,overflow:"hidden",border:HD}}>
      {TABS.map((t,i)=><button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"10px 4px",fontFamily:sans,fontSize:12,fontWeight:600,cursor:"pointer",border:"none",borderRight:i<TABS.length-1?HD:"none",background:tab===t?T.ink:T.bg,color:tab===t?"#fff":T.sub,textTransform:"capitalize"}}>{t}</button>)}
    </div>

    {/* Toast */}
    {toast&&<div style={{position:"fixed",bottom:32,left:"50%",transform:"translateX(-50%)",background:T.ink,color:"#fff",padding:"10px 18px",borderRadius:999,fontSize:13,fontWeight:600,zIndex:999,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,.18)"}}>{toast}</div>}

    {/* ── OVERVIEW TAB ── */}
    {tab==="overview"&&<>
      {(a.signals_pending||[]).length>0&&<><Sec>Signals to review</Sec>
        {a.signals_pending.map(s=><div key={s.id} style={{...panelW,marginTop:0,marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><strong style={{fontSize:14,fontWeight:600}}>{s.kind}</strong><Tag label={SEV[s.sev].l} c={SEV[s.sev].c} s={SEV[s.sev].s}/></div>
          <div style={{fontSize:13,color:T.sub,margin:"8px 0 12px",lineHeight:1.45}}>{s.text}</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>resolveSignal(s,true)} style={{flex:1,padding:9,borderRadius:8,border:"none",background:T.ink,color:"#fff",fontFamily:sans,fontWeight:600,fontSize:13,cursor:"pointer"}}>Add as risk</button>
            <button onClick={()=>resolveSignal(s,false)} style={{padding:"9px 14px",borderRadius:8,border:BD,background:T.bg,color:T.sub,fontFamily:sans,fontWeight:600,fontSize:13,cursor:"pointer"}}>Dismiss</button>
          </div>
        </div>)}
      </>}
      {(a.signal||a.shift)&&<div style={panel}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}><div style={{fontFamily:serif,fontSize:18,fontWeight:600}}>What changed</div><Pill c="#fff" s={T.black}>{a.updates||1} update{(a.updates||1)>1?"s":""}</Pill></div>
        {a.signal&&<div style={sb}><div style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:T.sub,marginBottom:7}}>✉ Signal detected</div><div style={{fontSize:14,lineHeight:1.5}}>{a.signal}</div></div>}
        {a.shift&&<div style={sb}><div style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:T.sub,marginBottom:7}}>↗ Exposure shift</div><div style={{fontSize:14,lineHeight:1.5}}>{a.shift}</div></div>}
      </div>}
      {fa.verdict&&<div style={{...panelW,borderLeft:`3px solid ${v.c}`,marginTop:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}><span style={{fontSize:10.5,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:T.faint}}>Fault Assessment</span><Tag label={v.label} c={v.c} s={v.s}/></div>
        <p style={{fontSize:14,lineHeight:1.55,margin:"12px 0"}}>{fa.reasoning}</p>
        <div style={{fontSize:13.5,lineHeight:1.75}}><div><b style={{color:T.red}}>Against us:</b> {fa.against_us}</div><div><b style={{color:T.green}}>Against them:</b> {fa.against_them}</div></div>
      </div>}
      {a.obligations?.length>0&&<><Sec>Obligations</Sec><div style={panelW}>{a.obligations.map((o,i)=>{const s=OBL_STATUS[o.status]||OBL_STATUS.unclear;return(
        <div key={i} style={{padding:"12px 0",display:"grid",gridTemplateColumns:"auto 1fr auto",gap:12,alignItems:"start",borderTop:i?HD:"none"}}>
          <span style={{fontSize:11,fontWeight:600,textTransform:"uppercase",color:o.party==="us"?T.purple:T.sub,paddingTop:2}}>{o.party}</span>
          <div><div style={{fontSize:14,fontWeight:600}}>{o.obligation}</div><div style={{fontSize:12,color:T.sub,marginTop:2}}>{o.source}</div></div>
          <span style={{fontSize:12.5,fontWeight:600,color:s.c,whiteSpace:"nowrap",paddingTop:2}}>{s.t}</span>
        </div>);})}</div></>}
      {a.risks?.length>0&&<><Sec>Risks</Sec>{a.risks.map((r,i)=>(
        <div key={i} style={{background:T.bg,border:BD,borderRadius:8,padding:13,marginTop:10}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"}}><strong style={{fontSize:14,fontWeight:600}}>{r.risk}</strong><Tag label={SEV[r.severity].l} c={SEV[r.severity].c} s={SEV[r.severity].s}/></div>
          <div style={{fontSize:13,color:T.sub,marginTop:9,lineHeight:1.45}}>→ {r.action}</div>
        </div>))}
      </>}
      {a.flags?.length>0&&<><Sec>Overextension</Sec><div style={panelW}>{a.flags.map((f,i)=>(
        <div key={i} style={{fontSize:14,lineHeight:1.5,padding:"11px 0",borderTop:i?HD:"none",display:"flex",gap:9}}><span style={{color:T.red,fontSize:8,marginTop:5}}>▲</span>{f}</div>))}</div>
      </>}
    </>}

    {/* ── TIMELINE TAB ── */}
    {tab==="timeline"&&<>
      <Sec>Account lifecycle</Sec>
      <AccountTimeline milestones={milestones} onAdd={addMilestone} onToggle={toggleMilestone} onDelete={delMilestone}/>

      <Sec>Contract cycles</Sec>
      <div style={{fontSize:13,color:T.sub,lineHeight:1.5,margin:"-8px 2px 12px"}}>Each cycle is a contract period — a renewal, a new event, or an expanded scope. Cycles tell the maturity story over time.</div>
      <ContractCycles cycles={cycles} currentProducts={a.products||[]} onAdd={addContractCycle} onUpdate={updateContractCycle} onDelete={delContractCycle}/>

      <Sec right={<button onClick={()=>{const cb={id:uid(),amount:0,reason:"",status:"Open",date:new Date().toISOString().slice(0,10),disputedBy:"",note:""};addChargeback(cb);}} style={{fontFamily:sans,fontSize:12,fontWeight:600,color:T.purple,background:"none",border:"none",cursor:"pointer"}}>+ Add</button>}>
        Chargebacks {chargebacks.length>0&&<span style={{fontSize:11,fontWeight:600,padding:"2px 7px",borderRadius:5,background:chargebacks.some(c=>c.status==="Open")?T.redSoft:T.greenSoft,color:chargebacks.some(c=>c.status==="Open")?T.red:T.green,marginLeft:6}}>{chargebacks.filter(c=>c.status==="Open").length} open</span>}
      </Sec>
      {chargebacks.length===0&&<div style={{fontSize:13,color:T.sub,padding:"8px 2px"}}>No chargebacks logged. Add one manually or the agent will flag them from comms.</div>}
      {chargebacks.map((cb,i)=><ChargebackRow key={cb.id} cb={cb} onUpdate={p=>updateChargeback(cb.id,p)} onDelete={()=>delChargeback(cb.id)}/>)}

      <Sec right={<button onClick={()=>addFeature({id:uid(),name:"",status:"Scoped",scope:"contract",note:""})} style={{fontFamily:sans,fontSize:12,fontWeight:600,color:T.purple,background:"none",border:"none",cursor:"pointer"}}>+ Add</button>}>Feature tracker</Sec>
      <div style={{fontSize:13,color:T.sub,lineHeight:1.5,margin:"-8px 2px 12px"}}>What was scoped, what's built, what slipped, what was added out of scope.</div>
      {features.length===0&&<div style={{fontSize:13,color:T.sub,padding:"8px 2px"}}>No features tracked yet.</div>}
      <FeatureTracker features={features} onUpdate={updateFeature} onDelete={delFeature}/>
    </>}

    {/* ── ECONOMICS TAB ── */}
    {tab==="economics"&&c&&<>
      <ContractHealthRing eco={eco} costs={costs} obligations={a.obligations||[]} chargebacks={chargebacks} kpis={a.kpis||{}} risks={a.risks||[]}/>
      <Sec>Revenue structure</Sec>
      <div style={panel}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
          <EF label="Platform fee %" type="number" value={eco.platformFeePct} onChange={v=>{const n={...eco,platformFeePct:+v,netTakePct:+(+v-(eco.kickbackPct||0)).toFixed(2)};setEco(n);save({contract:n});}}/>
          <EF label="Kickback %" type="number" value={eco.kickbackPct||0} onChange={v=>{const n={...eco,kickbackPct:+v,netTakePct:+((eco.platformFeePct||0)-+v).toFixed(2)};setEco(n);save({contract:n});}}/>
          <EF label="Kickback to" type="text" value={eco.kickbackTo||""} onChange={v=>saveEco("kickbackTo",v)}/>
          <EF label="Net take %" type="number" value={eco.netTakePct} onChange={v=>saveEco("netTakePct",+v)}/>
          <EF label="Processing rate %" type="number" value={eco.processingRate||2.9} onChange={v=>saveEco("processingRate",+v)}/>
          <EF label="GMV realized" type="number" value={eco.gmvActual} onChange={v=>saveEco("gmvActual",+v)}/>
          <EF label="GMV projected" type="number" value={eco.gmvProjected} onChange={v=>saveEco("gmvProjected",+v)}/>
        </div>
        <div style={{height:7,borderRadius:4,background:"#E9EAEE",overflow:"hidden",marginTop:14}}><div style={{height:"100%",width:pct(eco.gmvActual,eco.gmvProjected)+"%",background:T.blue,borderRadius:4}}/></div>
        <div style={{fontSize:12,color:T.sub,marginTop:6,marginBottom:4}}>{pct(eco.gmvActual,eco.gmvProjected)}% of projected GMV</div>
        <EconOut k="Platform fees" v={fmt((eco.gmvActual||0)*(eco.platformFeePct||0)/100)}/>
        <EconOut k={`Kickback → ${eco.kickbackTo||"partner"}`} v={"−"+fmt((eco.gmvActual||0)*(eco.kickbackPct||0)/100)}/>
        <EconOut k="Net revenue" v={fmt(fees)}/>
        <EconOut k="Running costs" v={fmt(tc)}/>
        <EconOut k="Net so far" v={(net<0?"-":"")+fmt(Math.abs(net))} color={net<0?T.red:T.green}/>
        <div style={{fontSize:12,color:T.sub,marginTop:10,lineHeight:1.45}}>Modeled at {fmtK(eco.gmvProjected)} GMV → {fmt(eco.gmvProjected*(eco.netTakePct||0)/100)} net revenue. At {pct(eco.gmvActual,eco.gmvProjected)}% of plan.</div>
      </div>
      <Sec right={<button onClick={()=>setAddingCost(true)} style={{fontFamily:sans,fontSize:12,fontWeight:600,color:T.purple,background:"none",border:"none",cursor:"pointer"}}>+ Add cost</button>}>Running costs</Sec>
      <div style={panelW}>
        {costs.length===0&&<div style={{fontSize:13,color:T.sub}}>No costs logged yet.</div>}
        {costs.map((x,i)=><div key={x.id} style={{display:"flex",alignItems:"center",padding:"11px 0",borderTop:i?HD:"none"}}>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{x.label||x.type}</div><div style={{fontSize:12,color:T.sub,marginTop:2}}>{x.note}{x.when?` · ${x.when}`:""}{x.detail?` · ${x.detail}`:""}</div></div>
          <span style={{fontSize:14,fontWeight:600,minWidth:60,textAlign:"right"}}>{x.computed>0?fmt(x.computed):"$0"}</span>
          <button onClick={()=>delCost(x.id)} style={{marginLeft:10,background:"none",border:"none",color:T.faint,cursor:"pointer",fontSize:16}}>×</button>
        </div>)}
        {addingCost&&<CostAdd onAdd={c2=>{addCost(c2);setAddingCost(false);}} onCancel={()=>setAddingCost(false)}/>}
      </div>
      <Sec>Performance signals</Sec>
      <div style={panelW}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Kpi k="Days since contact" v={a.kpis?.daysSinceContact??"—"} flag={(a.kpis?.daysSinceContact||0)>14}/>
          <Kpi k="SLA actual" v={a.kpis?.slaActual?(a.kpis.slaActual+"%"):"—"} flag={a.kpis?.slaActual&&a.kpis.slaActual<(eco.slaTarget||99.9)}/>
          <Kpi k="Chargebacks" v={a.kpis?.chargebacks??"—"} flag={(a.kpis?.chargebacks||0)>0}/>
          <Kpi k="Sentiment" v={a.kpis?.sentiment||"—"} flag={["Cold","Watch","Negative"].includes(a.kpis?.sentiment)}/>
        </div>
      </div>
    </>}
    {tab==="economics"&&!c&&<div style={{fontSize:14,color:T.sub,padding:"30px 2px",textAlign:"center"}}>No signed contract yet.<br/>Edit the account to add contract terms.</div>}

    {/* ── CONTRACT TAB ── */}
    {tab==="contract"&&c&&<>
      {/* Contract import */}
      <ContractImport onImport={parsed=>{
        const n={...eco,...parsed};setEco(n);
        save({contract:n});
        setToast("Contract terms imported ✓");setTimeout(()=>setToast(null),2500);
      }}/>
      <Sec>Contract terms</Sec>
      <div style={panelW}>
        {[
          ["Start → End",`${eco.start||"—"} → ${eco.end||"—"}`],["Renewal",eco.renewal||"—"],
          ["Payment terms",eco.paymentTerms||"—"],["Liability cap",eco.liabilityCap?fmt(eco.liabilityCap):"⚠ Uncapped"],
          ["SLA target",eco.slaTarget?eco.slaTarget+"%":"—"],["Data rights",eco.dataRights||"—"],
          ["Termination notice",eco.terminationNotice||"—"],["IP ownership",eco.ipOwnership||"—"],
          ["Auto-renew",eco.autoRenew?"Yes":"No"],["Exclusivity",eco.exclusive?"Yes":"No"],
          ["Audit rights",eco.auditRights?"Yes":"No"],["Rev share on upsells",eco.revenueShareOnUpsells?"Yes":"No"],
          ["White-label",eco.whiteLabel?"Yes":"No"],["Processing pass-through",eco.processingPassThru?"Yes":"No"],
        ].map(([k,v2],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderTop:i?HD:"none",gap:12}}>
          <span style={{fontSize:13,color:T.sub,flexShrink:0}}>{k}</span>
          <span style={{fontSize:13,fontWeight:600,textAlign:"right",color:String(v2).startsWith("⚠")?T.red:T.ink}}>{v2}</span>
        </div>)}
        {eco.notes&&<div style={{fontSize:12,color:T.sub,marginTop:10,paddingTop:10,borderTop:HD,lineHeight:1.5}}>{eco.notes}</div>}
      </div>
      {/* Dismissed signals log */}
      {(a.dismissed_signals||[]).length>0&&<><Sec>Dismissed signals</Sec>
        <div style={panelW}>
          <div style={{fontSize:12,color:T.sub,marginBottom:10,lineHeight:1.5}}>Signals you reviewed and dismissed. Kept here for reference in case context changes.</div>
          {(a.dismissed_signals||[]).map((s,i)=><div key={s.id} style={{padding:"10px 0",borderTop:i?HD:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}>
              <span style={{fontSize:13,fontWeight:600,color:T.sub}}>{s.kind}</span>
              <span style={{fontSize:11,color:T.faint}}>{s.dismissedAt}</span>
            </div>
            <div style={{fontSize:12,color:T.faint,marginTop:3,lineHeight:1.45}}>{s.text}</div>
          </div>)}
        </div>
      </>}
    </>}
    {tab==="contract"&&!c&&<>
      <ContractImport onImport={()=>{}} disabled/>
      <div style={{fontSize:14,color:T.sub,padding:"20px 2px",textAlign:"center",marginTop:8}}>No signed contract yet.<br/>Edit the account to add contract terms.</div>
    </>}

    <div style={{display:"flex",gap:10,marginTop:24}}>
      <button onClick={onEdit} style={{flex:1,padding:12,borderRadius:8,border:BD,background:T.bg,color:T.ink,fontFamily:sans,fontWeight:600,fontSize:14,cursor:"pointer"}}>Edit account</button>
      <button onClick={onDelete} style={{padding:"12px 16px",borderRadius:8,border:`1px solid ${T.redSoft}`,background:T.redSoft,color:T.red,fontFamily:sans,fontWeight:600,fontSize:14,cursor:"pointer"}}>Delete</button>
    </div>
    <p style={{fontSize:12,color:T.faint,margin:"24px 2px 0",lineHeight:1.6}}>Internal gut-check, not legal advice. Hand disputes to counsel.</p>
  </>;
}

function EF({label,type="text",value,onChange,placeholder=""}){
  const [local,setLocal]=useState(String(value??""));
  useEffect(()=>setLocal(String(value??"")),[value]);
  function handleChange(raw){
    setLocal(raw);
    if(type==="number"){
      if(raw===""||raw==="-") return; // allow mid-typing empty/minus
      const n=parseFloat(raw);
      if(!isNaN(n)) onChange(n);
    } else { onChange(raw); }
  }
  return <div style={{background:T.bg,border:HD,borderRadius:8,padding:"10px 12px"}}>
    <label style={{fontSize:11,color:T.sub,fontWeight:500,display:"block"}}>{label}</label>
    <input type="text" inputMode={type==="number"?"decimal":"text"} value={local}
      placeholder={placeholder}
      onChange={e=>handleChange(e.target.value)}
      onBlur={()=>{ if(type==="number"&&(local===""||isNaN(parseFloat(local)))){ setLocal("0"); onChange(0); } }}
      style={{border:"none",outline:"none",font:"inherit",fontSize:15,fontWeight:600,color:T.ink,width:"100%",marginTop:3,background:"none",fontFamily:sans}}/>
  </div>;
}

function AccountTimeline({milestones=[],onAdd,onToggle,onDelete}){
  const [adding,setAdding]=useState(false);
  const today=new Date();today.setHours(0,0,0,0);
  const sorted=[...milestones].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const upcoming=sorted.filter(m=>!m.done&&new Date(m.date)>=today);
  const past=sorted.filter(m=>m.done||new Date(m.date)<today);
  return <div>
    {upcoming.length>0&&<>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:.7,textTransform:"uppercase",color:T.faint,margin:"14px 2px 8px"}}>Upcoming</div>
      {upcoming.map(m=><MilestoneRow key={m.id} m={m} onToggle={onToggle} onDelete={onDelete}/>)}
    </>}
    {past.length>0&&<>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:.7,textTransform:"uppercase",color:T.faint,margin:"18px 2px 8px"}}>Past</div>
      {past.map(m=><MilestoneRow key={m.id} m={m} onToggle={onToggle} onDelete={onDelete} past/>)}
    </>}
    {adding?<MilestoneAdd onAdd={m=>{onAdd(m);setAdding(false);}} onCancel={()=>setAdding(false)}/>
      :<button onClick={()=>setAdding(true)} style={{width:"100%",marginTop:10,padding:11,borderRadius:8,border:`1px dashed ${T.hairS}`,background:"none",color:T.sub,fontFamily:sans,fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Add milestone</button>}
  </div>;
}

function MilestoneRow({m,onToggle,onDelete,past}){
  const mt=MILESTONE_TYPES[m.type]||MILESTONE_TYPES.review;
  const d=daysDiff(m.date);
  const urg=d<=3&&!m.done?"crit":d<=7&&!m.done?"soon":"ok";
  return <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 0",borderTop:HD}}>
    <button onClick={()=>onToggle(m.id)} style={{width:22,height:22,borderRadius:6,border:`1.5px solid ${m.done?T.green:urg==="crit"?T.red:urg==="soon"?T.yellow:"rgba(20,22,28,.2)"}`,background:m.done?T.green:"transparent",color:"#fff",fontSize:11,cursor:"pointer",flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center"}}>{m.done?"✓":""}</button>
    <div style={{flex:1,opacity:past&&m.done?.5:1}}>
      <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
        <span style={{fontSize:13,fontWeight:700}}>{m.title}</span>
        <span style={{fontSize:11,fontWeight:600,padding:"2px 7px",borderRadius:5,background:mt.color+"18",color:mt.color}}>{mt.icon} {mt.label}</span>
        {!m.done&&urg==="crit"&&<span style={{fontSize:11,fontWeight:700,color:T.red}}>{d<=0?"Today":d===1?"Tomorrow":`${d}d`}</span>}
        {!m.done&&urg==="soon"&&<span style={{fontSize:11,color:T.yellow,fontWeight:600}}>{d}d</span>}
      </div>
      <div style={{fontSize:12,color:T.sub,marginTop:3}}>{new Date(m.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}{m.note?` · ${m.note}`:""}</div>
    </div>
    <button onClick={()=>onDelete(m.id)} style={{background:"none",border:"none",color:T.faint,cursor:"pointer",fontSize:15}}>×</button>
  </div>;
}

function MilestoneAdd({onAdd,onCancel}){
  const [type,setType]=useState("event_date");const [title,setTitle]=useState("");const [date,setDate]=useState("");const [note,setNote]=useState("");
  return <div style={{background:T.soft,border:HD,borderRadius:8,padding:14,marginTop:10}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:9}}>
      {Object.entries(MILESTONE_TYPES).map(([k,v])=><button key={k} onClick={()=>setType(k)} style={{padding:"7px 6px",borderRadius:7,fontFamily:sans,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${type===k?v.color:"rgba(20,22,28,.12)"}`,background:type===k?v.color+"18":"#fff",color:type===k?v.color:T.sub,textAlign:"left"}}>{v.icon} {v.label}</button>)}
    </div>
    <div style={{display:"grid",gap:8}}>
      <EF label="Title" value={title} onChange={setTitle}/>
      <EF label="Date" type="date" value={date} onChange={setDate}/>
      <EF label="Note (optional)" value={note} onChange={setNote}/>
    </div>
    <div style={{display:"flex",gap:8,marginTop:10}}>
      <button disabled={!title||!date} onClick={()=>onAdd({id:uid(),type,title,date,note,done:false})} style={{flex:1,padding:10,borderRadius:8,border:"none",background:(title&&date)?T.ink:T.hairS,color:"#fff",fontFamily:sans,fontWeight:600,fontSize:13,cursor:"pointer"}}>Add</button>
      <button onClick={onCancel} style={{padding:"10px 14px",borderRadius:8,border:BD,background:T.bg,color:T.sub,fontFamily:sans,fontWeight:600,fontSize:13,cursor:"pointer"}}>Cancel</button>
    </div>
  </div>;
}

// ── CONTRACT CYCLES (renewal-based, org-specific) ──
function ContractCycles({cycles=[],currentProducts=[],onAdd,onUpdate,onDelete}){
  const [adding,setAdding]=useState(false);
  const sorted=[...cycles].sort((a,b)=>new Date(a.start||0)-new Date(b.start||0));
  return <div>
    {sorted.length===0&&<div style={{fontSize:13,color:T.sub,padding:"8px 2px",marginBottom:8}}>No cycles yet. Add the first contract period to start tracking renewal history.</div>}
    {sorted.map((cy,i)=><CycleCard key={cy.id} cy={cy} index={i} total={sorted.length} onUpdate={p=>onUpdate(cy.id,p)} onDelete={()=>onDelete(cy.id)}/>)}
    {adding
      ? <NewCycleForm products={currentProducts} onSave={cy=>{onAdd(cy);setAdding(false);}} onCancel={()=>setAdding(false)}/>
      : <button onClick={()=>setAdding(true)} style={{width:"100%",marginTop:10,padding:11,borderRadius:8,border:`1px dashed ${T.hairS}`,background:"none",color:T.sub,fontFamily:sans,fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Add contract cycle / renewal</button>
    }
  </div>;
}
function CycleCard({cy,index,total,onUpdate,onDelete}){
  const [open,setOpen]=useState(cy.active||false);
  const isActive=cy.active;
  return <div style={{background:T.bg,border:`1px solid ${isActive?T.purple:T.hairS}`,borderRadius:8,marginBottom:10,overflow:"hidden"}}>
    <div onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",cursor:"pointer"}}>
      <div style={{width:28,height:28,borderRadius:6,background:isActive?T.purple:T.soft,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:isActive?"#fff":T.sub,flexShrink:0}}>C{index+1}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:600,color:T.ink}}>{cy.label||`Cycle ${index+1}`}</div>
        <div style={{fontSize:12,color:T.sub,marginTop:2}}>{cy.start||"—"}{cy.end?` → ${cy.end}`:""}</div>
      </div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        {isActive&&<span style={{fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:5,background:T.purpleSoft,color:T.purple}}>Active</span>}
        <span style={{fontSize:14,color:T.faint}}>{open?"▲":"▼"}</span>
      </div>
    </div>
    {open&&<div style={{padding:"0 14px 14px",borderTop:HD}}>
      <div style={{display:"grid",gap:8,marginTop:12}}>
        <EF label="Cycle label" value={cy.label||""} onChange={v=>onUpdate({label:v})}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <EF label="Start" value={cy.start||""} onChange={v=>onUpdate({start:v})} placeholder="May 2026"/>
          <EF label="End" value={cy.end||""} onChange={v=>onUpdate({end:v})} placeholder="Jul 2026"/>
        </div>
        <EF label="Events (comma separated)" value={(cy.events||[]).join(", ")} onChange={v=>onUpdate({events:v.split(",").map(s=>s.trim()).filter(Boolean)})} placeholder="Sail4th 250 · Jul 3, 2026"/>
        <EF label="Notes" value={cy.note||""} onChange={v=>onUpdate({note:v})}/>
      </div>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:T.faint,margin:"14px 2px 8px"}}>Products in scope</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
        {PRODUCTS.map(p=>{const has=(cy.products||[]).includes(p); return <button key={p} onClick={()=>onUpdate({products:has?(cy.products||[]).filter(x=>x!==p):[...(cy.products||[]),p]})} style={{fontSize:12,fontWeight:600,padding:"4px 9px",borderRadius:6,cursor:"pointer",border:`1px solid ${has?T.green:T.hairS}`,background:has?T.greenSoft:T.bg,color:has?T.green:T.sub,fontFamily:sans}}>{has?"✓ ":""}{p}</button>;})}
      </div>
      <div style={{display:"flex",gap:8}}>
        <div onClick={()=>onUpdate({active:!isActive})} style={{display:"flex",alignItems:"center",gap:8,flex:1,padding:"10px 12px",borderRadius:8,border:HD,cursor:"pointer",background:T.bg}}>
          <div style={{width:38,height:21,borderRadius:11,background:isActive?T.purple:"#D0D3D9",padding:2,display:"flex",alignItems:"center",transition:"background .2s"}}><div style={{width:17,height:17,borderRadius:"50%",background:"#fff",transform:isActive?"translateX(17px)":"translateX(0)",transition:"transform .2s"}}/></div>
          <span style={{fontSize:13,fontWeight:500}}>Active cycle</span>
        </div>
        <button onClick={onDelete} style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${T.redSoft}`,background:T.redSoft,color:T.red,fontFamily:sans,fontWeight:600,fontSize:13,cursor:"pointer"}}>Delete</button>
      </div>
    </div>}
  </div>;
}
function NewCycleForm({products,onSave,onCancel}){
  const [label,setLabel]=useState("");const [start,setStart]=useState("");const [end,setEnd]=useState("");
  const [prods,setProds]=useState([...products]);const [note,setNote]=useState("");
  return <div style={{background:T.soft,border:HD,borderRadius:8,padding:14,marginTop:10}}>
    <div style={{fontSize:13,fontWeight:600,color:T.ink,marginBottom:10}}>New contract cycle</div>
    <div style={{display:"grid",gap:8}}>
      <EF label="Cycle label" value={label} onChange={setLabel} placeholder="Sail4th 250 — Year 2"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <EF label="Start" value={start} onChange={setStart} placeholder="May 2027"/>
        <EF label="End" value={end} onChange={setEnd} placeholder="Jul 2027"/>
      </div>
      <EF label="Notes" value={note} onChange={setNote}/>
    </div>
    <div style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:T.faint,margin:"12px 2px 8px"}}>Products in scope</div>
    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
      {PRODUCTS.map(p=>{const has=prods.includes(p); return <button key={p} onClick={()=>setProds(has?prods.filter(x=>x!==p):[...prods,p])} style={{fontSize:12,fontWeight:600,padding:"4px 9px",borderRadius:6,cursor:"pointer",border:`1px solid ${has?T.green:T.hairS}`,background:has?T.greenSoft:T.bg,color:has?T.green:T.sub,fontFamily:sans}}>{has?"✓ ":""}{p}</button>;})}
    </div>
    <div style={{display:"flex",gap:8}}>
      <button disabled={!label} onClick={()=>onSave({id:uid(),label,start,end,products:prods,events:[],note,active:true})} style={{flex:1,padding:10,borderRadius:8,border:"none",background:label?T.ink:T.hairS,color:"#fff",fontFamily:sans,fontWeight:600,fontSize:13,cursor:"pointer"}}>Create cycle</button>
      <button onClick={onCancel} style={{padding:"10px 14px",borderRadius:8,border:BD,background:T.bg,color:T.sub,fontFamily:sans,fontWeight:600,fontSize:13,cursor:"pointer"}}>Cancel</button>
    </div>
  </div>;
}
// ── CHARGEBACK ROW ──
const CHARGEBACK_COLORS={"Open":T.red,"Resolved — won":T.green,"Resolved — lost":T.sub,"Disputed":T.yellow};
function ChargebackRow({cb,onUpdate,onDelete}){
  const [open,setOpen]=useState(false);
  const col=CHARGEBACK_COLORS[cb.status]||T.sub;
  return <div style={{background:T.bg,border:`1px solid ${cb.status==="Open"?T.redSoft:T.hairS}`,borderRadius:8,marginBottom:8,overflow:"hidden"}}>
    <div onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",cursor:"pointer"}}>
      <div style={{flex:1}}>
        <div style={{fontSize:14,fontWeight:600}}>{cb.disputedBy||"Unnamed"}{cb.amount>0?<span style={{fontWeight:400,color:T.sub}}> · {fmt(cb.amount)}</span>:""}</div>
        <div style={{fontSize:12,color:T.sub,marginTop:2}}>{cb.date} · {cb.reason||"No reason logged"}</div>
      </div>
      <span style={{fontSize:11,fontWeight:700,padding:"3px 8px",borderRadius:5,background:col+"18",color:col}}>{cb.status}</span>
    </div>
    {open&&<div style={{padding:"0 14px 14px",borderTop:HD}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>
        <EF label="Disputed by" value={cb.disputedBy||""} onChange={v=>onUpdate({disputedBy:v})}/>
        <EF label="Amount ($)" type="number" value={cb.amount||0} onChange={v=>onUpdate({amount:+v})}/>
        <EF label="Date" value={cb.date||""} onChange={v=>onUpdate({date:v})}/>
      </div>
      <div style={{marginTop:8}}>
        <div style={{background:T.bg,border:HD,borderRadius:8,padding:"10px 12px",marginBottom:8}}><label style={{fontSize:11,color:T.sub,fontWeight:500,display:"block"}}>Reason</label><textarea value={cb.reason||""} onChange={e=>onUpdate({reason:e.target.value})} style={{display:"block",width:"100%",border:"none",outline:"none",font:"inherit",fontSize:14,color:T.ink,marginTop:3,background:"none",fontFamily:sans,resize:"none",minHeight:40}}/></div>
        <div style={{background:T.bg,border:HD,borderRadius:8,padding:"10px 12px"}}><label style={{fontSize:11,color:T.sub,fontWeight:500,display:"block"}}>Notes</label><textarea value={cb.note||""} onChange={e=>onUpdate({note:e.target.value})} style={{display:"block",width:"100%",border:"none",outline:"none",font:"inherit",fontSize:14,color:T.ink,marginTop:3,background:"none",fontFamily:sans,resize:"none",minHeight:40}}/></div>
      </div>
      <div style={{display:"flex",gap:6,marginTop:10,flexWrap:"wrap"}}>
        {CHARGEBACK_STATUS.map(s=>{const c2=CHARGEBACK_COLORS[s]||T.sub; return <button key={s} onClick={()=>onUpdate({status:s})} style={{flex:1,padding:"7px 4px",borderRadius:6,fontFamily:sans,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${cb.status===s?c2:T.hairS}`,background:cb.status===s?c2+"18":T.bg,color:cb.status===s?c2:T.sub,minWidth:0}}>{s}</button>;})}
      </div>
      <button onClick={onDelete} style={{width:"100%",marginTop:8,padding:"9px",borderRadius:8,border:`1px solid ${T.redSoft}`,background:T.redSoft,color:T.red,fontFamily:sans,fontWeight:600,fontSize:13,cursor:"pointer"}}>Delete</button>
    </div>}
  </div>;
}
// ── FEATURE TRACKER ──
const FEATURE_SCOPE_C={contract:{c:T.blue,l:"Contract"},future:{c:T.purple,l:"Future cycle"},"out-of-scope":{c:T.red,l:"Out of scope"}};
function FeatureTracker({features=[],onUpdate,onDelete}){
  const groups={"contract":[],"future":[],"out-of-scope":[]};
  features.forEach(f=>{ const k=f.scope==="oos"?"out-of-scope":(f.scope||"contract"); (groups[k]=groups[k]||[]).push(f); });
  return <div>{Object.entries(groups).filter(([,fs])=>fs.length>0).map(([scope,fs])=>{
    const sc=FEATURE_SCOPE_C[scope]||FEATURE_SCOPE_C.contract;
    return <div key={scope} style={{marginBottom:6}}>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:.4,textTransform:"uppercase",color:sc.c,margin:"14px 2px 8px"}}>{sc.l} ({fs.length})</div>
      {fs.map(f=><FeatureRow key={f.id} f={f} onUpdate={p=>onUpdate(f.id,p)} onDelete={()=>onDelete(f.id)}/>)}
    </div>;})}
  </div>;
}
function FeatureRow({f,onUpdate,onDelete}){
  const [open,setOpen]=useState(!f.name);
  const stIdx=FEATURE_STATUS.indexOf(f.status);
  const stCol=stIdx===0?T.sub:stIdx===1?T.blue:stIdx===2?T.green:stIdx===3?T.yellow:T.red;
  const isOos=f.scope==="out-of-scope"||f.scope==="oos";
  return <div style={{background:T.bg,border:`1px solid ${isOos?T.redSoft:T.hairS}`,borderRadius:8,marginBottom:7,overflow:"hidden"}}>
    <div onClick={()=>setOpen(!open)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",cursor:"pointer"}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:isOos?T.red:stCol,flexShrink:0}}/>
      <div style={{flex:1,fontSize:14,fontWeight:500,color:f.name?T.ink:T.faint}}>{f.name||"New feature — tap to edit"}</div>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        {isOos&&<span style={{fontSize:10,fontWeight:700,color:T.red}}>OOS</span>}
        <span style={{fontSize:11,fontWeight:600,padding:"2px 7px",borderRadius:5,background:stCol+"18",color:stCol,whiteSpace:"nowrap"}}>{f.status||"Scoped"}</span>
      </div>
    </div>
    {open&&<div style={{padding:"0 14px 13px",borderTop:HD}}>
      {isOos&&<div style={{background:T.redSoft,borderRadius:7,padding:"10px 12px",marginTop:12,fontSize:12,color:T.red,lineHeight:1.5}}>
        <b>Out of scope.</b> This work is not covered by the signed contract. Either raise a formal scope change request, add it to the next contract cycle, or document why we absorbed it.
      </div>}
      <div style={{display:"grid",gap:8,marginTop:10}}>
        <EF label="Feature name" value={f.name||""} onChange={v=>onUpdate({name:v})} placeholder="e.g. Per-pier GMV report"/>
        <div style={{background:T.bg,border:HD,borderRadius:8,padding:"10px 12px"}}>
          <label style={{fontSize:11,color:T.sub,fontWeight:500,display:"block"}}>Notes / scope context</label>
          <textarea value={f.note||""} onChange={e=>onUpdate({note:e.target.value})} style={{display:"block",width:"100%",border:"none",outline:"none",font:"inherit",fontSize:14,color:T.ink,marginTop:3,background:"none",fontFamily:sans,resize:"none",minHeight:40}}/>
        </div>
        {isOos&&<div style={{background:T.bg,border:HD,borderRadius:8,padding:"10px 12px"}}>
          <label style={{fontSize:11,color:T.sub,fontWeight:500,display:"block"}}>Scope change resolution</label>
          <select value={f.scopeResolution||""} onChange={e=>onUpdate({scopeResolution:e.target.value})} style={{display:"block",width:"100%",border:"none",outline:"none",font:"inherit",fontSize:14,fontWeight:600,color:T.ink,marginTop:3,background:"none",fontFamily:sans,WebkitAppearance:"none"}}>
            <option value="">— Select resolution —</option>
            <option value="absorb">We absorbed it — no charge</option>
            <option value="charge">Bill client for this work</option>
            <option value="add_to_contract">Add to next contract cycle</option>
            <option value="scope_change">Raise formal scope change request</option>
            <option value="remove">We're stopping this work</option>
          </select>
        </div>}
      </div>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:T.faint,margin:"10px 2px 7px"}}>Status</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:9}}>
        {FEATURE_STATUS.map(s=>{const i2=FEATURE_STATUS.indexOf(s);const c2=i2===0?T.sub:i2===1?T.blue:i2===2?T.green:i2===3?T.yellow:T.red;return <button key={s} onClick={()=>onUpdate({status:s})} style={{padding:"6px 9px",borderRadius:6,fontFamily:sans,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${f.status===s?c2:T.hairS}`,background:f.status===s?c2+"18":T.bg,color:f.status===s?c2:T.sub}}>{s}</button>;})}
      </div>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:T.faint,margin:"6px 2px 7px"}}>Scope</div>
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        {[["contract","Contract"],["future","Future cycle"],["out-of-scope","Out of scope"]].map(([s,l])=>{const sc2=FEATURE_SCOPE_C[s]||FEATURE_SCOPE_C.contract;const isAct=f.scope===s||(s==="out-of-scope"&&f.scope==="oos"); return <button key={s} onClick={()=>onUpdate({scope:s})} style={{flex:1,padding:"7px 4px",borderRadius:6,fontFamily:sans,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${isAct?sc2.c:T.hairS}`,background:isAct?sc2.c+"18":T.bg,color:isAct?sc2.c:T.sub}}>{l}</button>;})}
      </div>
      <button onClick={onDelete} style={{width:"100%",padding:"9px",borderRadius:8,border:`1px solid ${T.redSoft}`,background:T.redSoft,color:T.red,fontFamily:sans,fontWeight:600,fontSize:12,cursor:"pointer"}}>Remove</button>
    </div>}
  </div>;
}

function ContractImport({onImport,disabled}){
  const [open,setOpen]=useState(false);
  const [text,setText]=useState("");
  const [parsing,setParsing]=useState(false);

  function parse(){
    setParsing(true);
    setTimeout(()=>{
      // Extract key terms from pasted contract text using pattern matching
      const t=text.toLowerCase();
      const parsed={};
      // Dates
      const dateM=text.match(/(?:effective|start(?:ing)?|commenc(?:ing|es?))\s+(?:date[:\s]+)?([A-Z][a-z]+ \d{1,2},?\s*\d{4})/i);
      if(dateM) parsed.start=dateM[1];
      const endM=text.match(/(?:expir(?:es?|ation)|end(?:ing)?|terminat(?:es?|ion))\s+(?:date[:\s]+)?([A-Z][a-z]+ \d{1,2},?\s*\d{4})/i);
      if(endM) parsed.end=endM[1];
      // Liability cap
      const capM=text.match(/aggregate\s+(?:liability\s+)?cap[:\s]+\$?([\d,]+)/i)||text.match(/liability[^.]*(?:shall not exceed|capped at)[^.]*\$?([\d,]+)/i);
      if(capM) parsed.liabilityCap=parseInt(capM[1].replace(/,/g,""));
      // SLA
      const slaM=text.match(/(\d+\.?\d*)\s*%\s*(?:uptime|availability|service level)/i);
      if(slaM) parsed.slaTarget=parseFloat(slaM[1]);
      // Payment terms
      if(t.includes("net 30")) parsed.paymentTerms="Net 30";
      else if(t.includes("net 15")) parsed.paymentTerms="Net 15";
      else if(t.includes("net 60")) parsed.paymentTerms="Net 60";
      else if(t.includes("upon receipt")) parsed.paymentTerms="Upon receipt";
      // Auto-renew
      if(t.includes("automatically renew")||t.includes("auto-renew")) parsed.autoRenew=true;
      // Exclusivity
      if(t.includes("exclusive")) parsed.exclusive=true;
      // Take rate / platform fee
      const feeM=text.match(/(?:platform fee|service fee|take rate)[^.]*?(\d+\.?\d*)\s*%/i);
      if(feeM){ parsed.platformFeePct=parseFloat(feeM[1]); parsed.netTakePct=parseFloat(feeM[1]); }
      // Data rights
      if(t.includes("fan data")||t.includes("customer data")||t.includes("user data")){
        parsed.dataRights=t.includes("retain")||t.includes("ownership")||t.includes("proprietary")
          ?"Fan profiles retained by Ticket Tree post-event"
          :"Data rights: see contract — review recommended";
      }
      // Termination notice
      const termM=text.match(/(\d+)\s*(?:calendar\s+)?days['\s]*(?:written\s+)?notice/i);
      if(termM) parsed.terminationNotice=`${termM[1]} days`;
      // Audit rights
      if(t.includes("audit right")||t.includes("right to audit")) parsed.auditRights=true;
      // Add raw notes
      parsed.notes=(parsed.notes||"")+(Object.keys(parsed).length>0
        ?"Auto-extracted from imported contract text. Review and confirm each field."
        :"No terms auto-detected. Paste more of the contract or enter fields manually.");
      setParsing(false);
      onImport(parsed);
      setOpen(false);
      setText("");
    },800);
  }

  if(disabled) return null;
  return <div style={{marginBottom:4}}>
    <Sec right={<button onClick={()=>setOpen(!open)} style={{fontFamily:sans,fontSize:12,fontWeight:600,color:T.purple,background:"none",border:"none",cursor:"pointer"}}>{open?"Cancel":"↑ Import contract"}</button>}>Contract</Sec>
    {open&&<div style={{background:T.soft,border:HD,borderRadius:8,padding:14,marginBottom:12}}>
      <div style={{fontSize:13,color:T.sub,lineHeight:1.5,marginBottom:10}}>Paste contract text below. The importer will extract start/end dates, liability cap, SLA, payment terms, take rate, and other key terms automatically. You can edit anything it gets wrong.</div>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Paste contract text here — the more complete, the better the extraction…" style={{width:"100%",minHeight:120,padding:"11px 13px",borderRadius:8,border:BD,fontFamily:sans,fontSize:13,color:T.ink,outline:"none",resize:"vertical",background:T.bg,lineHeight:1.5}}/>
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <button disabled={!text||parsing} onClick={parse} style={{flex:1,padding:10,borderRadius:8,border:"none",background:(text&&!parsing)?T.ink:T.hairS,color:"#fff",fontFamily:sans,fontWeight:600,fontSize:13,cursor:"pointer"}}>{parsing?"Extracting…":"Extract & fill fields"}</button>
        <button onClick={()=>{setOpen(false);setText("");}} style={{padding:"10px 14px",borderRadius:8,border:BD,background:T.bg,color:T.sub,fontFamily:sans,fontWeight:600,fontSize:13,cursor:"pointer"}}>Cancel</button>
      </div>
      <div style={{fontSize:11,color:T.faint,marginTop:8,lineHeight:1.5}}>In the live build this connects to the Claude engine to read a full PDF. Here it pattern-matches the pasted text and pre-fills what it finds.</div>
    </div>}
  </div>;
}

// ── CONTRACT HEALTH RING ──
// Segmented donut: 5 dimensions, hard butt caps, tap to expand + show metric in center.
// Matches the reference exactly: no rounded caps, hard edges between segments, shadow layer.
// ── CONTRACT HEALTH RING — Apple Watch concentric ring style ──
// One ring per metric. Each ring fills clockwise based on score 0-100.
// Tap a ring or its legend row to highlight it. No clipping, no expansion issues.
function ContractHealthRing({eco={},costs=[],obligations=[],chargebacks=[],kpis={},risks=[]}){
  const [active,setActive]=useState(null);

  const gmvScore  = eco.gmvProjected>0?Math.min(100,Math.round(100*(eco.gmvActual||0)/eco.gmvProjected)):0;
  const fees      = (eco.gmvActual||0)*(eco.netTakePct||0)/100;
  const tc        = costs.reduce((n,c)=>n+(c.computed||0),0);
  const roiScore  = tc>0?Math.min(100,Math.round(100*fees/tc)):fees>0?100:50;
  const oblMet    = obligations.filter(o=>o.status==="met").length;
  const oblScore  = obligations.length?Math.round(100*oblMet/obligations.length):0;
  const openCbs   = chargebacks.filter(c=>c.status==="Open").length;
  const cbScore   = Math.max(0,100-openCbs*40);
  const sentMap   = {Active:100,Contained:85,Watch:50,Cold:10,Negative:20};
  const sentScore = sentMap[kpis.sentiment]||60;
  const overall   = Math.round((gmvScore+roiScore+oblScore+cbScore+sentScore)/5);
  const overallC  = overall>=70?T.green:overall>=40?T.yellow:T.red;

  // Outermost ring first (index 0 = largest radius)
  const RINGS=[
    {key:"gmv",  label:"GMV",         score:gmvScore,  color:"#6C5FE0", detail:`${gmvScore}%`,    sub:`${fmtK(eco.gmvActual||0)} of ${fmtK(eco.gmvProjected||0)}`},
    {key:"roi",  label:"ROI",         score:roiScore,  color:"#4C8DD6", detail:`${roiScore}%`,    sub:`${fmt(fees)} rev · ${fmt(tc)} cost`},
    {key:"obl",  label:"Obligations", score:oblScore,  color:"#1E8F5C", detail:`${oblScore}%`,    sub:`${oblMet} of ${obligations.length} met`},
    {key:"cb",   label:"Chargebacks", score:cbScore,   color:cbScore>=70?"#1E8F5C":"#D6443C", detail:`${cbScore}%`, sub:cbScore===100?"None open":`${openCbs} open`},
    {key:"sent", label:"Sentiment",   score:sentScore, color:sentScore>=70?"#1E8F5C":sentScore>=40?"#BC8410":"#D6443C", detail:`${sentScore}%`, sub:kpis.sentiment||"Unknown"},
  ];

  // Concentric ring geometry — viewBox 260x260, center 130,130
  // SW=10, RGAP=8 → rings at R=108,90,72,54,36 → 31px center clear
  const CX=130, CY=130, SW=10, RGAP=8;
  const OUTER_R=108;

  function toRad(deg){ return (deg-90)*Math.PI/180; }
  function pt(deg,r){ const a=toRad(deg); return [CX+r*Math.cos(a), CY+r*Math.sin(a)]; }
  function ring(score, r, color, isActive){
    const deg = score/100*359.99;
    if(deg<0.5) return null;
    const[x1,y1]=pt(0,r),[x2,y2]=pt(deg,r);
    const large=deg>180?1:0;
    // No radius expansion — glow only, so rings never overlap
    const sw=isActive?SW+2:SW;
    return { path:`M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)}`, sw, color };
  }

  const activeD=active?RINGS.find(r=>r.key===active):null;

  return <div style={{background:T.bg,border:BD,borderRadius:8,padding:"20px 16px 18px",marginTop:14}}>
    <div style={{fontSize:10.5,fontWeight:700,letterSpacing:.6,textTransform:"uppercase",color:T.faint,marginBottom:4}}>AI Assessed</div>
    <div style={{fontFamily:serif,fontSize:20,fontWeight:600,letterSpacing:-.3,marginBottom:8}}>Contract Health</div>

    <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
      <svg viewBox="0 0 260 260" width={240} height={240}>
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        {RINGS.map((d,i)=>{
          const r=OUTER_R-i*(SW+RGAP);
          const isAct=active===d.key;
          const hasActive=active!==null;
          const[tx1,ty1]=pt(0,r),[tx2,ty2]=pt(359.99,r);
          const filled=ring(d.score,r,d.color,isAct);
          return <g key={d.key} onClick={()=>setActive(active===d.key?null:d.key)}
            style={{cursor:"pointer",opacity:hasActive&&!isAct?.12:1,transition:"opacity .2s"}}>
            <path d={`M${tx1.toFixed(2)},${ty1.toFixed(2)} A${r},${r} 0 1,1 ${tx2.toFixed(2)},${ty2.toFixed(2)}`}
              fill="none" stroke="#1C1E24" strokeWidth={SW} strokeLinecap="round"/>
            {filled&&<path d={filled.path} fill="none" stroke={d.color} strokeWidth={filled.sw}
              strokeLinecap="round" filter={isAct?"url(#glow)":undefined}/>}
          </g>;
        })}

        {/* Center: overall or active detail */}
        {activeD?(
          <>
            <text x={CX} y={CY-8} textAnchor="middle" fontSize="28" fontWeight="700" fontFamily={sans} fill={activeD.color}>{activeD.score}</text>
            <text x={CX} y={CY+11} textAnchor="middle" fontSize="11" fontWeight="600" fontFamily={sans} fill={T.sub}>{activeD.label}</text>
            <text x={CX} y={CY+25} textAnchor="middle" fontSize="10" fontFamily={sans} fill={T.faint}>{activeD.sub}</text>
          </>
        ):(
          <>
            <text x={CX} y={CY+10} textAnchor="middle" fontSize="36" fontWeight="700" fontFamily={sans} fill={overallC}>{overall}</text>
            <text x={CX} y={CY+27} textAnchor="middle" fontSize="11" fontWeight="500" fontFamily={sans} fill={T.sub}>overall health</text>
          </>
        )}
      </svg>

      <div style={{display:"flex",alignItems:"center",gap:10,marginTop:-6,fontSize:13,color:T.sub,fontWeight:500}}>
        Contract health score
        <span style={{background:overallC,color:"#fff",fontSize:13,fontWeight:700,padding:"5px 14px",borderRadius:999}}>
          {overall>=70?"Strong":overall>=40?"Watch":"At risk"}
        </span>
      </div>
    </div>

    {/* Legend — full-width rows, no grid misalignment */}
    <div style={{marginTop:16,border:HD,borderRadius:8,overflow:"hidden"}}>
      {RINGS.map((d,i)=>{
        const on=active===d.key;
        const r=OUTER_R-i*(SW+RGAP);
        return <button key={d.key} onClick={()=>setActive(on?null:d.key)}
          style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",width:"100%",
            background:on?d.color+"0E":T.bg,border:"none",borderTop:i?HD:"none",
            cursor:"pointer",font:"inherit",textAlign:"left",fontFamily:sans,
            borderLeft:on?`3px solid ${d.color}`:"3px solid transparent"}}>
          {/* Mini ring preview */}
          <svg width={22} height={22} viewBox="0 0 22 22" style={{flexShrink:0}}>
            <circle cx={11} cy={11} r={8} fill="none" stroke="#1C1E24" strokeWidth={4} strokeLinecap="round"/>
            {d.score>0&&(()=>{
              const deg=d.score/100*359.99;
              const[x1,y1]=[11,3],[x2x,x2y]=[11+8*Math.cos((deg-90)*Math.PI/180),11+8*Math.sin((deg-90)*Math.PI/180)];
              return <path d={`M${x1},${y1} A8,8 0 ${deg>180?1:0},1 ${x2x.toFixed(2)},${x2y.toFixed(2)}`}
                fill="none" stroke={d.color} strokeWidth={4} strokeLinecap="round"/>;
            })()}
          </svg>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:on?d.color:T.ink}}>{d.label}</div>
            <div style={{fontSize:11.5,color:T.sub,marginTop:1}}>{d.sub}</div>
          </div>
          {/* Score bar */}
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:48,height:5,background:"#EBEBED",borderRadius:3,overflow:"hidden"}}>
              <div style={{height:"100%",width:d.score+"%",background:d.color,borderRadius:3,transition:"width .3s"}}/>
            </div>
            <span style={{fontSize:13,fontWeight:700,color:d.color,minWidth:28,textAlign:"right"}}>{d.score}</span>
          </div>
        </button>;
      })}
    </div>
    <div style={{fontSize:11,color:T.faint,marginTop:10,lineHeight:1.5,textAlign:"center"}}>Tap a ring or row to focus. Scores from live contract data.</div>
  </div>;
}

function WeeklyDigest({accounts=[]}){
  const [state,setState]=useState("idle");
  const today=new Date();
  const reds=accounts.filter(a=>a.health==="red");
  const yellows=accounts.filter(a=>a.health==="yellow");
  const signals=accounts.flatMap(a=>(a.signals_pending||[]).map(s=>({...s,account:a.account})));
  const upcoming=accounts.flatMap(a=>(a.milestones||[]).filter(m=>!m.done&&daysDiff(m.date)>=0&&daysDiff(m.date)<=14).map(m=>({...m,account:a.account}))).sort((a,b)=>new Date(a.date)-new Date(b.date));

  return <div style={{background:T.bg,border:BD,borderRadius:8,padding:16}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div><div style={{fontSize:10.5,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:T.faint}}>Agent · Weekly pull</div><div style={{fontFamily:serif,fontSize:18,fontWeight:600,marginTop:3}}>Pipeline digest</div></div>
      <button onClick={()=>{setState("scanning");setTimeout(()=>setState("done"),1400);}} disabled={state==="scanning"} style={{padding:"9px 14px",borderRadius:8,border:"none",background:state==="scanning"?T.purpleSoft:T.purple,color:state==="scanning"?T.purple:"#fff",fontFamily:sans,fontWeight:600,fontSize:13,cursor:"pointer"}}>
        {state==="scanning"?"Scanning…":state==="done"?"Re-run ↺":"Run pull ⚡"}
      </button>
    </div>
    {state==="idle"&&<div style={{fontSize:13,color:T.faint,marginTop:12,lineHeight:1.5}}>Scans all account comms since the last pull and surfaces a team-ready digest. Run at end-of-week or before all-hands.</div>}
    {state==="scanning"&&<div style={{marginTop:14}}>{["Scanning iMessage threads…","Checking email threads…","Reviewing contract obligations…","Flagging new signals…","Building digest…"].map((s,i)=><div key={i} style={{fontSize:13,color:T.purple,padding:"5px 0",display:"flex",gap:8,alignItems:"center"}}><span style={{width:6,height:6,borderRadius:"50%",background:T.purple,opacity:.7}}/>{s}</div>)}</div>}
    {state==="done"&&<>
      <div style={{height:1,background:T.hair,margin:"14px 0"}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
        {[{k:"Action needed",v:reds.length,c:T.red,s:T.redSoft},{k:"Watch",v:yellows.length,c:T.yellow,s:T.yellowSoft},{k:"New signals",v:signals.length,c:T.purple,s:T.purpleSoft}].map((s,i)=><div key={i} style={{background:s.s,borderRadius:7,padding:"10px"}}>
          <div style={{fontSize:24,fontWeight:700,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:s.c,fontWeight:600,marginTop:2}}>{s.k}</div>
        </div>)}
      </div>
      {[...reds,...yellows].map(a=><div key={a.id} style={{padding:"10px 0",borderTop:HD}}>
        <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:14,fontWeight:600}}>{a.account}</span><Tag label={HEALTH[a.health].label} c={HEALTH[a.health].c} s={HEALTH[a.health].soft}/></div>
        <div style={{fontSize:13,color:T.sub,marginTop:3,lineHeight:1.4}}>{(a.risks||[])[0]?.action||a.summary}</div>
      </div>)}
      {upcoming.length>0&&<><div style={{fontSize:11,fontWeight:700,letterSpacing:.5,textTransform:"uppercase",color:T.faint,margin:"14px 0 8px"}}>Next 14 days</div>
        {upcoming.slice(0,4).map((m,i)=>{const mt=MILESTONE_TYPES[m.type]||MILESTONE_TYPES.review;const d=daysDiff(m.date);
          return <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderTop:HD}}>
            <span style={{fontSize:16}}>{mt.icon}</span>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{m.title}</div><div style={{fontSize:12,color:T.sub}}>{m.account}</div></div>
            <span style={{fontSize:11,fontWeight:700,color:d<=3?T.red:d<=7?T.yellow:T.sub}}>{d===0?"Today":d===1?"Tomorrow":`${d}d`}</span>
          </div>;})}
      </>}
      <div style={{marginTop:14,padding:"12px 14px",background:T.soft,borderRadius:8,fontSize:12,color:T.sub,lineHeight:1.6}}>
        <b style={{color:T.ink}}>Agent note:</b> In the live build, the agent scans iMessage, Gmail, and docs since the last pull, updates account health scores, and flags new signals before the team reviews. Suggested cadence: Friday EOD or before Monday all-hands.
      </div>
    </>}
  </div>;
}

function CostAdd({onAdd,onCancel}){
  const [type,setType]=useState("hourly");const [label,setLabel]=useState("");const [fields,setFields]=useState({rate:150,hours:0,amount:0,pct:0,base:0});const [note,setNote]=useState("");
  const ct=COST_TYPES.find(c=>c.id===type);const computed=ct.calc(fields);
  return <div style={{marginTop:12,paddingTop:12,borderTop:HD}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:9}}>
      {COST_TYPES.map(c=><button key={c.id} onClick={()=>setType(c.id)} style={{padding:"7px 5px",borderRadius:7,fontFamily:sans,fontSize:11,fontWeight:600,cursor:"pointer",border:`1px solid ${type===c.id?T.purple:T.hairS}`,background:type===c.id?T.purpleSoft:T.bg,color:type===c.id?T.purple:T.sub}}>{c.label}</button>)}
    </div>
    <div style={{display:"grid",gap:8}}>
      <EF label="Label" type="text" value={label} onChange={setLabel}/>
      {ct.fields.map(f=><EF key={f} label={FIELD_DEFS[f].l} type={FIELD_DEFS[f].t} value={fields[f]} onChange={v=>setFields(p=>({...p,[f]:+v||0}))}/>)}
      <EF label="Note" type="text" value={note} onChange={setNote}/>
    </div>
    <div style={{background:T.purpleSoft,borderRadius:8,padding:"12px 14px",marginTop:10,display:"flex",justifyContent:"space-between"}}>
      <span style={{fontSize:13,color:T.purple,fontWeight:600}}>Computed total</span>
      <span style={{fontSize:18,fontWeight:700,color:T.purple}}>{fmt(computed)}</span>
    </div>
    <div style={{display:"flex",gap:8,marginTop:10}}>
      <button disabled={!computed&&!label} onClick={()=>onAdd({id:uid(),type,label:label||ct.label,fields,computed,note,when:new Date().toLocaleDateString("en-US",{month:"short",year:"numeric"}),detail:ct.fields.map(f=>`${FIELD_DEFS[f].l}: ${fields[f]}`).join(" · ")})} style={{flex:1,padding:10,borderRadius:8,border:"none",background:(computed||label)?T.ink:T.hairS,color:"#fff",fontFamily:sans,fontWeight:600,fontSize:13,cursor:"pointer"}}>Add</button>
      <button onClick={onCancel} style={{padding:"10px 14px",borderRadius:8,border:BD,background:T.bg,color:T.sub,fontFamily:sans,fontWeight:600,fontSize:13,cursor:"pointer"}}>Cancel</button>
    </div>
  </div>;
}

function NewOrg({onCancel,onSave}){
  const [name,setName]=useState("");const [sub,setSub]=useState("");
  return <><div style={{padding:"18px 0 6px"}}><button style={icbtn} onClick={onCancel}>‹</button></div>
    <h1 style={{fontFamily:serif,fontSize:26,fontWeight:600,letterSpacing:-.4,margin:"14px 0 16px"}}>New organization</h1>
    <div style={{display:"grid",gap:10}}><EF label="Organization name" value={name} onChange={setName}/><EF label="Product / brand" value={sub} onChange={setSub}/></div>
    <button disabled={!name} onClick={()=>onSave({id:uid(),name,sub})} style={{width:"100%",marginTop:18,padding:14,borderRadius:8,border:"none",background:name?T.ink:T.hairS,color:"#fff",fontFamily:sans,fontWeight:600,fontSize:15,cursor:name?"pointer":"default"}}>Create</button>
  </>;
}

function AccountForm({orgId,existing,onCancel,onSave}){
  const blank={id:uid(),orgId,account:"",short:"",logo:"#6C5FE0",health:"green",owner:"Carter",products:[],eventType:EVENT_TYPES[0],sponsorMode:SPONSOR_MODES[0],value:"",costs:[],kpis:{},contractCycle:1,milestones:[],comms:"",summary:"",signal:"",shift:"",impact:{pct:"",dir:"neg",label:"",withAction:""},fault:{verdict:"unclear",reasoning:"",against_us:"",against_them:""},obligations:[],risks:[],signals_pending:[],flags:[],contract:{start:"",end:"",renewal:"",paymentTerms:"Net 30",platformFeePct:8,kickbackPct:0,kickbackTo:"",netTakePct:8,processingPassThru:true,processingRate:2.9,gmvProjected:0,gmvActual:0,liabilityCap:0,slaTarget:99.9,exclusive:false,dataRights:"",autoRenew:false,terminationNotice:"30 days",auditRights:false,ipOwnership:"",revenueShareOnUpsells:false,whiteLabel:false,notes:""}};
  const [f,setF]=useState(existing||blank);const [hasContract,setHasContract]=useState(!!existing?.contract);const [scanning,setScanning]=useState(false);
  const up=(k,v)=>setF(p=>({...p,[k]:v}));const upC=(k,v)=>setF(p=>({...p,contract:{...p.contract,[k]:v}}));
  const toggleProduct=p=>{const cur=f.products||[];up("products",cur.includes(p)?cur.filter(x=>x!==p):[...cur,p]);};
  function runScan(){setScanning(true);setTimeout(()=>{const lines=(f.comms||"").split("\n").filter(Boolean);up("summary",f.summary||`Auto-draft from ${lines.length} messages.`);up("signal",f.signal||(lines.length?`Most recent: "${lines[lines.length-1].replace(/^\[.*?\]\s*(ME|THEM):\s*/,"")}"`:"No comms yet."));setScanning(false);},900);}
  const ls={fontSize:11,color:T.sub,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,margin:"18px 2px 8px"};
  const ta={width:"100%",border:BD,borderRadius:8,padding:"11px 13px",font:"inherit",fontSize:14,fontFamily:sans,color:T.ink,outline:"none",resize:"vertical",minHeight:80,background:T.bg};
  return <><div style={{padding:"18px 0 6px"}}><button style={icbtn} onClick={onCancel}>‹</button></div>
    <h1 style={{fontFamily:serif,fontSize:26,fontWeight:600,letterSpacing:-.4,margin:"14px 0 4px"}}>{existing?"Edit account":"New account"}</h1>
    <div style={ls}>Basics</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
      <EF label="Account name" value={f.account} onChange={v=>{up("account",v);up("short",v.slice(0,2).toUpperCase());}} placeholder="Sail4th 250"/>
      <EF label="Owner" value={f.owner} onChange={v=>up("owner",v)}/>
      <EF label="Deal value" value={f.value} onChange={v=>up("value",v)} placeholder="~$1.0M GMV"/>
    </div>
    <div style={{display:"flex",gap:8,marginTop:9}}>{Object.keys(HEALTH).map(k=><button key={k} onClick={()=>up("health",k)} style={{flex:1,padding:"9px",borderRadius:8,fontFamily:sans,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${f.health===k?HEALTH[k].c:T.hairS}`,background:f.health===k?HEALTH[k].soft:T.bg,color:f.health===k?HEALTH[k].c:T.sub}}>{HEALTH[k].label}</button>)}</div>
    <div style={ls}>Products sold</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{PRODUCTS.map(p=><button key={p} onClick={()=>toggleProduct(p)} style={{padding:"9px 8px",borderRadius:8,fontFamily:sans,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${(f.products||[]).includes(p)?T.purple:T.hairS}`,background:(f.products||[]).includes(p)?T.purpleSoft:T.bg,color:(f.products||[]).includes(p)?T.purple:T.sub,textAlign:"left"}}>{p}</button>)}</div>
    <div style={ls}>Event type & sponsor</div>
    <div style={{display:"grid",gap:9}}>
      {[["Event type",f.eventType,EVENT_TYPES,"eventType"],["Sponsor",f.sponsorMode,SPONSOR_MODES,"sponsorMode"]].map(([l,v,opts,k])=><div key={k} style={{background:T.bg,border:HD,borderRadius:8,padding:"10px 12px"}}><label style={{fontSize:11,color:T.sub,fontWeight:500,display:"block"}}>{l}</label><select value={v} onChange={e=>up(k,e.target.value)} style={{border:"none",outline:"none",font:"inherit",fontSize:15,fontWeight:600,color:T.ink,width:"100%",marginTop:3,background:"none",fontFamily:sans,WebkitAppearance:"none"}}>{opts.map(o=><option key={o}>{o}</option>)}</select></div>)}
    </div>
    <div style={ls}>Comms</div>
    <textarea style={ta} value={f.comms} onChange={e=>up("comms",e.target.value)} placeholder={"[2026-06-14] ME: ...\n[2026-06-14] THEM: ..."}/>
    <button onClick={runScan} disabled={scanning} style={{width:"100%",marginTop:9,padding:12,borderRadius:8,border:`1px solid ${T.purple}`,background:T.purpleSoft,color:T.purple,fontFamily:sans,fontWeight:600,fontSize:14,cursor:"pointer"}}>{scanning?"Scanning…":"⚡ Run audit scan"}</button>
    <div style={ls}>Summary & signal</div>
    <div style={{display:"grid",gap:9}}>
      {[["Summary",f.summary,"summary","One-line status"],["Signal",f.signal,"signal","What changed"]].map(([l,v,k,ph])=><div key={k} style={{background:T.bg,border:HD,borderRadius:8,padding:"10px 12px"}}><label style={{fontSize:11,color:T.sub,fontWeight:500}}>{l}</label><textarea value={v} onChange={e=>up(k,e.target.value)} placeholder={ph} style={{display:"block",width:"100%",border:"none",outline:"none",font:"inherit",fontSize:14,color:T.ink,marginTop:3,background:"none",fontFamily:sans,resize:"none",minHeight:45}}/></div>)}
    </div>
    <div style={{display:"flex",alignItems:"center",gap:9,margin:"20px 2px 0",cursor:"pointer"}} onClick={()=>setHasContract(!hasContract)}>
      <div style={{width:20,height:20,borderRadius:5,border:BD,background:hasContract?T.ink:T.bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13}}>{hasContract?"✓":""}</div>
      <span style={{fontSize:14,fontWeight:600}}>This account has a signed contract</span>
    </div>
    {hasContract&&<>
      <div style={ls}>Revenue structure</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        <EF label="Platform fee %" type="number" value={f.contract.platformFeePct} onChange={v=>{upC("platformFeePct",+v);upC("netTakePct",+(+v-(f.contract.kickbackPct||0)).toFixed(2));}}/>
        <EF label="Kickback %" type="number" value={f.contract.kickbackPct||0} onChange={v=>{upC("kickbackPct",+v);upC("netTakePct",+((f.contract.platformFeePct||0)-+v).toFixed(2));}}/>
        <EF label="Kickback to" value={f.contract.kickbackTo||""} onChange={v=>upC("kickbackTo",v)} placeholder="Mojo, partner…"/>
        <EF label="Net take %" type="number" value={f.contract.netTakePct} onChange={v=>upC("netTakePct",+v)}/>
        <EF label="Processing %" type="number" value={f.contract.processingRate||2.9} onChange={v=>upC("processingRate",+v)}/>
        <EF label="GMV projected" type="number" value={f.contract.gmvProjected} onChange={v=>upC("gmvProjected",+v)}/>
      </div>
      <div style={ls}>Contract terms</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        <EF label="Start" value={f.contract.start} onChange={v=>upC("start",v)} placeholder="May 2026"/>
        <EF label="End" value={f.contract.end} onChange={v=>upC("end",v)} placeholder="Jul 2026"/>
        <EF label="Renewal date" value={f.contract.renewal} onChange={v=>upC("renewal",v)}/>
        <EF label="Payment terms" value={f.contract.paymentTerms} onChange={v=>upC("paymentTerms",v)}/>
        <EF label="Liability cap ($)" type="number" value={f.contract.liabilityCap} onChange={v=>upC("liabilityCap",+v)}/>
        <EF label="SLA target (%)" type="number" value={f.contract.slaTarget} onChange={v=>upC("slaTarget",+v)}/>
        <EF label="Termination notice" value={f.contract.terminationNotice} onChange={v=>upC("terminationNotice",v)}/>
        <EF label="Data rights" value={f.contract.dataRights} onChange={v=>upC("dataRights",v)}/>
        <EF label="IP ownership" value={f.contract.ipOwnership} onChange={v=>upC("ipOwnership",v)}/>
      </div>
      <div style={{display:"grid",gap:8,marginTop:9}}>
        {[["Auto-renew",f.contract.autoRenew,"autoRenew"],["Exclusivity",f.contract.exclusive,"exclusive"],["Audit rights",f.contract.auditRights,"auditRights"],["Rev share on upsells",f.contract.revenueShareOnUpsells,"revenueShareOnUpsells"],["White-label",f.contract.whiteLabel,"whiteLabel"],["Processing pass-through",f.contract.processingPassThru,"processingPassThru"]].map(([l,v,k])=><div key={k} onClick={()=>upC(k,!v)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:T.bg,border:HD,borderRadius:8,padding:"12px 14px",cursor:"pointer"}}>
          <span style={{fontSize:14,fontWeight:500}}>{l}</span>
          <div style={{width:40,height:22,borderRadius:11,background:v?T.purple:"#D0D3D9",padding:2,display:"flex",alignItems:"center",transition:"background .2s"}}><div style={{width:18,height:18,borderRadius:"50%",background:"#fff",transform:v?"translateX(18px)":"translateX(0)",transition:"transform .2s"}}/></div>
        </div>)}
      </div>
      <div style={{marginTop:9}}><div style={{background:T.bg,border:HD,borderRadius:8,padding:"10px 12px"}}><label style={{fontSize:11,color:T.sub,fontWeight:500}}>Notes</label><textarea value={f.contract.notes||""} onChange={e=>upC("notes",e.target.value)} style={{display:"block",width:"100%",border:"none",outline:"none",font:"inherit",fontSize:14,color:T.ink,marginTop:3,background:"none",fontFamily:sans,resize:"none",minHeight:60}}/></div></div>
      <div style={{fontSize:11.5,color:T.faint,marginTop:8,lineHeight:1.5}}>Running costs are logged on the account after creation as they accrue.</div>
    </>}
    <button disabled={!f.account} onClick={()=>onSave({...f,contract:hasContract?f.contract:null})} style={{width:"100%",marginTop:22,padding:14,borderRadius:8,border:"none",background:f.account?T.ink:T.hairS,color:"#fff",fontFamily:sans,fontWeight:600,fontSize:15,cursor:f.account?"pointer":"default"}}>{existing?"Save changes":"Create account"}</button>
    <div style={{height:20}}/>
  </>;
}
