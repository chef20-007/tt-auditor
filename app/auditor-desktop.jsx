"use client";
"use client";
"use client";
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

const HEALTH={green:{label:"On track",c:T.green,soft:T.greenSoft},yellow:{label:"Watch",c:T.yellow,soft:T.yellowSoft},red:{label:"Action needed",c:T.red,soft:T.redSoft},archived:{label:"Archived",c:T.sub,soft:"#F3F4F6"}};
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
const PAYMENT_TERMS=["Net 7","Net 14","Net 30","Net 45","Net 60","Weekly","Bi-weekly","Monthly","Upon completion","50% upfront / 50% on delivery","Custom"];
const PRODUCTS=["Primary ticketing","Box Office / POS","Sponsor Portal","Moments (collectibles)","Secondary marketplace","Agent-1 fan CRM","Community","White-label"];
const SPONSOR_MODES=["No sponsor","We brought the sponsor","They brought the sponsor","Partner brought the sponsor"];
const EVENT_TYPES=["Paid event","Free event","Hybrid"];
const MILESTONE_TYPES={
  event_date:{label:"Event date",icon:"",color:T.blue},
  renewal:{label:"Renewal",icon:"",color:T.purple},
  deadline:{label:"Deadline",icon:"",color:T.yellow},
  payment:{label:"Payment",icon:"",color:T.green},
  upsell:{label:"Upsell",icon:"",color:T.purple},
  risk:{label:"Risk trigger",icon:"",color:T.red},
  review:{label:"Review",icon:"",color:T.sub},
  contract_end:{label:"Contract end",icon:"",color:T.black},
};
// Cycles are account-specific and tied to renewals/events — no fixed template.
// Each cycle: { id, label, start, end, products[], events[], note, active }
const CHARGEBACK_STATUS=["Open","Resolved — won","Resolved — lost","Disputed"];
const FEATURE_STATUS=["Scoped","In progress","Shipped","On hold","Out of scope"];

const fmt=n=>"$"+Math.round(n||0).toLocaleString();
const fmtK=n=>{const v=Math.abs(n||0);if(v>=1000000)return"$"+(((n||0)/1000000).toFixed(v%1000000?1:0))+"M";if(v>=1000)return"$"+((n||0)/1000).toFixed(v%1000?1:0)+"K";return"$"+Math.round(n||0);};
const pct=(a,b)=>b?Math.min(100,Math.round(100*a/b)):0;
const uid=()=>Math.random().toString(36).slice(2,9);
const sumCosts=a=>(a.costs||[]).reduce((n,c)=>n+(c.computed||0),0);
const daysDiff=(d)=>Math.round((new Date(d)-new Date())/(1000*60*60*24));

// ── SEED ──
const SEED_ORG={id:"3tree",name:"3 Tree Labs",sub:"Ticket Tree"};
// ── CRM TIERS ──
// active: contracted, event upcoming or recent (< 60 days)
// watch: 30-60 days no contact, renewal risk
// cold: 60-90 days no contact, needs re-engagement
// archived: explicitly parked
const CRM_TIERS={
  active:  {label:"Active",   c:T.green,  s:T.greenSoft,  order:0},
  watch:   {label:"Watch",    c:T.yellow, s:T.yellowSoft,  order:1},
  cold:    {label:"Cold",     c:T.sub,    s:"#F3F4F6",     order:2},
  archived:{label:"Archived", c:T.faint,  s:"#F9FAFB",     order:3},
};

const SEED_ACCTS=[
  // ── ACTIVE ──
  {
    id:"sail4th",orgId:"3tree",account:"Sail4th 250",short:"S4",logo:"#2E6BD6",
    tier:"active",health:"yellow",owner:"Carter",
    value:"$257,501 GMV · 29 events",
    products:["Primary ticketing","Sponsor Portal"],eventType:"Paid event",sponsorMode:"They brought the sponsor",
    contractCycle:1,
    cycles:[{id:"cy1",label:"Sail4th 250 — inaugural event",start:"May 2026",end:"Jul 2026",products:["Primary ticketing","Sponsor Portal"],events:["Sail4th 250 · Jul 3, 2026"],note:"First contract. Paid anchorage ticketing + free boat tour time-select.",active:true,gmvProjected:1000000,gmvActual:257501,netTakePct:8.5,platformFeePct:8.5,kickbackPct:0,paymentTerms:"Net 30",liabilityCap:200000,slaTarget:99.9,dataRights:"Fan profiles retained by Ticket Tree",terminationNotice:"30 days"}],
    chargebacks:[{id:"cb1",amount:0,reason:"Misbooking — incorrect pier allocation from client CSV",status:"Open",date:"2026-06-10",disputedBy:"Lisa Vitanza",note:"Client allocation error. Informal refund promise made in text. Resolve before Jul 3."}],
    features:[
      {id:"f1",name:"Paid anchorage ticketing — 8 piers",status:"Shipped",scope:"contract",note:"Live since May 2026"},
      {id:"f2",name:"Free boat tour time-select registration",status:"Shipped",scope:"contract",note:"Live since May 2026"},
      {id:"f3",name:"Sponsor allocation CSV import",status:"Shipped",scope:"contract",note:"Gwen sends CSV, we import"},
      {id:"f4",name:"Per-pier GMV report for sponsors",status:"In progress",scope:"out-of-scope",note:"Gwen requested Jun 15. NOT in signed scope."},
      {id:"f5",name:"Vitanza refund handling",status:"In progress",scope:"out-of-scope",note:"NOT in contract. Informal promise."},
    ],
    contract:{start:"May 2026",end:"Jul 2026",renewal:"TBD post-event",paymentTerms:"Net 30",platformFeePct:8.5,kickbackPct:0,kickbackTo:"",netTakePct:8.5,gmvProjected:1000000,gmvActual:257501,liabilityCap:200000,slaTarget:99.9,dataRights:"Fan profiles retained by Ticket Tree",autoRenew:false,terminationNotice:"30 days"},
    costs:[{id:"c1",type:"time",label:"Carter account mgmt",fields:{rate:150,hours:20},computed:3000,note:"Jun 2026",when:"Jun 2026"}],
    kpis:{daysSinceContact:2,slaActual:99.9,sentiment:"Watch",chargebacks:1},
    milestones:[
      {id:"m1",type:"event_date",date:"2026-07-03",title:"Sail4th 250 — event day",note:"Primary revenue date. All piers live.",done:false},
      {id:"m2",type:"deadline",date:"2026-06-25",title:"Vitanza chargeback response due",note:"Send written scope clarification.",done:false},
      {id:"m3",type:"payment",date:"2026-07-31",title:"Net 30 invoice — post-event",done:false},
      {id:"m4",type:"renewal",date:"2026-08-15",title:"Renewal conversation",note:"Introduce Moments + Agent-1 for Cycle 2.",done:false},
      {id:"m5",type:"risk",date:"2026-06-14",title:"Out-of-scope refund promise",note:"'Make them whole' text. Outside fee schedule.",done:false},
    ],
    signal:'On June 14, we told the buyer we\'d "make them whole" on the Vitanza misbooking — no fee-schedule reference.',
    shift:"Exposure moved from Contained → Watch after the refund language went out.",
    fault:{verdict:"shared",reasoning:"Misbooking came from client CSV. Our text promise created an obligation the contract doesn't back.",against_us:"Written refund obligation without fee-schedule reference.",against_them:"Their allocation file contained the seating error."},
    obligations:[
      {party:"us",obligation:"Paid anchorage ticketing platform",source:"Sec 2.1",status:"met"},
      {party:"us",obligation:"Free boat tour time-select",source:"Sec 2.1",status:"met"},
      {party:"us",obligation:"99.9% uptime SLA",source:"Sec 5.3",status:"at_risk"},
      {party:"them",obligation:"Payment within Net 30",source:"Sec 4.1",status:"unclear"},
    ],
    risks:[
      {risk:"Informal refund promise outside fee schedule",severity:"high",action:"Send written clarification tying any Vitanza refund to the fee schedule."},
      {risk:"Uncapped data breach liability",severity:"high",action:"Push for a liability cap before the event closes."},
      {risk:"Merchant of record unconfirmed",severity:"medium",action:"Confirm MOR before final payouts."},
    ],
    signals_pending:[
      {id:"sp1",kind:"Out-of-scope promise",text:'"make them whole" in June 14 text — no fee-schedule reference.',sev:"high"},
      {id:"sp2",kind:"Unresolved contract term",text:"Data breach liability is uncapped.",sev:"high"},
    ],
    flags:["Verbal refund commitment in writing, outside fee schedule"],
    comms:"",summary:"Anchorage ticketing live across 8 piers. Contact: Gwen Hafner (ghafner@sail4th.org). One active chargeback.",
  },
  {
    id:"cagetitans",orgId:"3tree",account:"Cage Titans",short:"CT",logo:"#D64040",
    tier:"active",health:"green",owner:"Carter",
    value:"$422,116 GMV · 13 events",
    products:["Primary ticketing","Sponsor Portal","Moments (collectibles)"],eventType:"Combat sports",sponsorMode:"They brought the sponsor",
    contractCycle:2,
    cycles:[
      {id:"cy1",label:"Cage Titans — Year 1",start:"Jan 2025",end:"Dec 2025",products:["Primary ticketing"],events:["CT 59","CT 60","CT 61","CT 62","CT 63"],note:"Initial contract. Ticketing only.",active:false,gmvActual:180000,gmvProjected:150000,netTakePct:7,paymentTerms:"Net 30"},
      {id:"cy2",label:"Cage Titans — Year 2",start:"Jan 2026",end:"Dec 2026",products:["Primary ticketing","Sponsor Portal","Moments (collectibles)"],events:["CT 64 onward"],note:"Expanded.",active:true,gmvActual:422116,gmvProjected:450000,netTakePct:7,paymentTerms:"Net 30"},
    ],
    chargebacks:[],features:[
      {id:"f1",name:"Primary ticketing",status:"Shipped",scope:"contract",note:"All CT events"},
      {id:"f2",name:"Sponsor Portal",status:"Shipped",scope:"contract",note:"Live Year 2"},
      {id:"f3",name:"Moments digital collectibles",status:"Shipped",scope:"contract",note:"Live Year 2. 22% revenue lift attributed."},
      {id:"f4",name:"Agent-1 fan CRM",status:"Scoped",scope:"future",note:"Target for Year 3 renewal."},
    ],
    contract:{start:"Jan 2026",end:"Dec 2026",renewal:"Jan 2027",paymentTerms:"Net 30",platformFeePct:7,kickbackPct:0,kickbackTo:"",netTakePct:7,gmvProjected:450000,gmvActual:422116,liabilityCap:500000,slaTarget:99.5,dataRights:"Fan profiles retained by Ticket Tree",autoRenew:true,terminationNotice:"60 days"},
    costs:[{id:"c1",type:"flat",label:"Moments integration build",fields:{amount:8000},computed:8000,note:"One-time build cost Year 2",when:"Jan 2026"}],
    kpis:{daysSinceContact:5,slaActual:99.8,sentiment:"Active",chargebacks:0},
    milestones:[
      {id:"m1",type:"renewal",date:"2026-11-01",title:"Year 3 renewal conversation",note:"Target: add Agent-1 fan CRM.",done:false},
      {id:"m2",type:"upsell",date:"2026-09-01",title:"Agent-1 CRM upsell pitch",note:"82% fan retention data is the proof point.",done:false},
    ],
    risks:[
      {risk:"Concentration risk — Cage Titans is 36% of platform GMV",severity:"medium",action:"Diversify pipeline so no single host exceeds 25% of GMV."},
    ],
    signals_pending:[],flags:[],
    summary:"Largest account. 13 events. 22% revenue lift from Moments. 82% fan retention. Contact: Anthony DiCarlo.",
    signal:"CT 64 sold out in 48 hours — highest single-event GMV to date.",
    fault:{verdict:"neither",reasoning:"No active disputes.",against_us:"",against_them:""},
    obligations:[{party:"us",obligation:"Primary ticketing platform",source:"Contract",status:"met"},{party:"us",obligation:"Sponsor Portal",source:"Contract",status:"met"}],
    comms:"",
  },
  {
    id:"nxtwwe",orgId:"3tree",account:"NXT from WWE",short:"NX",logo:"#1A1C22",
    tier:"active",health:"green",owner:"Elijah",
    value:"$92,753 GMV · 1 event",
    products:["Primary ticketing"],eventType:"Professional wrestling",sponsorMode:"No sponsor",
    contractCycle:1,cycles:[{id:"cy1",label:"WWE NXT Plymouth",start:"Nov 2025",end:"Dec 2025",products:["Primary ticketing"],events:["WWE NXT Plymouth"],note:"$92K gross, 123% sell-through.",active:false,gmvActual:92753,gmvProjected:75000,netTakePct:6,paymentTerms:"Net 14"}],
    chargebacks:[],features:[{id:"f1",name:"Primary ticketing",status:"Shipped",scope:"contract",note:"123% sell-through achieved."}],
    contract:{start:"Nov 2025",end:"Dec 2025",renewal:"TBD",paymentTerms:"Net 14",platformFeePct:6,kickbackPct:0,kickbackTo:"",netTakePct:6,gmvProjected:75000,gmvActual:92753,liabilityCap:100000,slaTarget:99.9,dataRights:"Fan profiles retained by Ticket Tree",autoRenew:false,terminationNotice:"30 days"},
    costs:[],
    kpis:{daysSinceContact:45,slaActual:99.9,sentiment:"Contained",chargebacks:0},
    milestones:[
      {id:"m1",type:"renewal",date:"2026-09-01",title:"WWE NXT renewal outreach",note:"Proof point: 123% sell-through, 1,431 profiles. Pitch Year 2.",done:false},
    ],
    risks:[{risk:"No Year 2 contract signed yet",severity:"medium",action:"Initiate renewal conversation with 123% sell-through as lead proof point."}],
    signals_pending:[],flags:[],
    summary:"WWE NXT Plymouth. $92K gross, 123% sell-through, 1,431 fan profiles built. Contact: WWE partnerships team.",
    signal:"",fault:{verdict:"neither",reasoning:"",against_us:"",against_them:""},obligations:[],comms:"",
  },

  // ── WATCH ──
  // ── MOJO (combined: Happy Valley + Amherst + Boston small events) ──
  {
    id:"mojo",orgId:"3tree",account:"Mojo",short:"MO",logo:"#7C3AED",
    tier:"watch",health:"yellow",owner:"Carter",
    value:"$222,279 GMV · 8 events",
    products:["Primary ticketing"],eventType:"Music & entertainment",sponsorMode:"No sponsor",
    contractCycle:3,
    cycles:[
      {
        id:"cy1",label:"Mojofest Happy Valley",start:"Mar 2026",end:"May 2026",
        products:["Primary ticketing"],
        events:["Mojofest Happy Valley — Spring 2026"],
        note:"$90,228 GMV. 2 events.",
        active:false,gmvActual:90228,gmvProjected:85000,netTakePct:7,paymentTerms:"Weekly",
      },
      {
        id:"cy2",label:"Mojofest Amherst",start:"Mar 2026",end:"May 2026",
        products:["Primary ticketing"],
        events:["Mojofest Amherst — Spring 2026"],
        note:"$85,937 GMV. 2 events.",
        active:false,gmvActual:85937,gmvProjected:80000,netTakePct:7,paymentTerms:"Weekly",
      },
      {
        id:"cy3",label:"Boston small events — ongoing",start:"Nov 2025",end:"Mar 2026",
        products:["Primary ticketing"],
        events:["Various Boston shows"],
        note:"$46,114 GMV across 4 smaller events.",
        active:false,gmvActual:46114,gmvProjected:40000,netTakePct:7,paymentTerms:"Weekly",
      },
    ],
    chargebacks:[],
    features:[
      {id:"f1",name:"Primary ticketing",status:"Shipped",scope:"contract",note:"All events across all three cycles."},
      {id:"f2",name:"Sponsor Portal",status:"Scoped",scope:"future",note:"Festival format is a natural fit — pitch for next cycle."},
      {id:"f3",name:"Moments digital collectibles",status:"Scoped",scope:"future",note:"Festival audience is high-engagement. Target for Year 2."},
    ],
    contract:{
      start:"Nov 2025",end:"May 2026",renewal:"TBD",paymentTerms:"Weekly",
      platformFeePct:7,kickbackPct:0,kickbackTo:"",netTakePct:7,
      gmvProjected:250000,gmvActual:222279,
      liabilityCap:250000,slaTarget:99.5,
      dataRights:"Fan profiles retained by Ticket Tree",autoRenew:false,terminationNotice:"30 days",
      notes:"Three distinct event lines under one org relationship. Happy Valley + Amherst festivals + Boston small events.",
    },
    costs:[],
    kpis:{daysSinceContact:38,slaActual:99.5,sentiment:"Contained",chargebacks:0},
    milestones:[
      {id:"m1",type:"renewal",date:"2026-08-01",title:"Year 2 renewal conversation",note:"$222K GMV across 8 events — strong proof point. Pitch Sponsor Portal + Moments.",done:false},
      {id:"m2",type:"upsell",date:"2026-09-01",title:"Sponsor Portal upsell pitch",note:"Festival format with sponsor inventory — natural fit.",done:false},
    ],
    risks:[
      {risk:"No contact in 38 days post-event cycle",severity:"medium",action:"Re-engage with fan data report and Year 2 pitch across all three event lines."},
      {risk:"No Sponsor Portal or Moments upsell yet",severity:"low",action:"$222K GMV with 8 events and festival audience — strong candidate for expansion."},
    ],
    signals_pending:[],flags:[],
    summary:"Combined Mojo account: Mojofest Happy Valley, Mojofest Amherst, and ongoing Boston small events. $222K total GMV across 8 events. Contact: Mojo management team.",
    signal:"",
    fault:{verdict:"neither",reasoning:"",against_us:"",against_them:""},
    obligations:[
      {party:"us",obligation:"Primary ticketing across all event lines",source:"Contract",status:"met"},
    ],
    comms:"",
  },
  {
    id:"cesboxing",orgId:"3tree",account:"CES Boxing",short:"CB",logo:"#DC2626",
    tier:"cold",health:"red",owner:"Elijah",
    value:"$44,550 GMV · 1 event",
    products:["Primary ticketing"],eventType:"Combat sports",sponsorMode:"No sponsor",
    contractCycle:1,cycles:[{id:"cy1",label:"CES Boxing — Oct 2025",start:"Oct 2025",end:"Nov 2025",products:["Primary ticketing"],active:false,gmvActual:44550,gmvProjected:40000,netTakePct:7,paymentTerms:"Net 14"}],chargebacks:[],features:[],
    contract:{start:"Oct 2025",end:"Nov 2025",renewal:"TBD",paymentTerms:"Net 14",platformFeePct:7,kickbackPct:0,kickbackTo:"",netTakePct:7,gmvProjected:40000,gmvActual:44550,liabilityCap:50000,slaTarget:99.5,dataRights:"Fan profiles retained by Ticket Tree",autoRenew:false,terminationNotice:"30 days"},
    costs:[],kpis:{daysSinceContact:90,slaActual:99.8,sentiment:"Cold",chargebacks:0},
    milestones:[{id:"m1",type:"renewal",date:"2026-07-01",title:"CES Boxing Year 2 outreach",done:false}],
    risks:[{risk:"90 days no contact — strong first event went unreinforced",severity:"high",action:"Reach out with 111% sell-through data and a Year 2 pitch."}],
    signals_pending:[],flags:[],
    summary:"1 event. $44.5K GMV. 90 days no contact. Strong sell-through — should be a renewal target.",
    signal:"",fault:{verdict:"neither",reasoning:"",against_us:"",against_them:""},obligations:[],comms:"",
  },
  {
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
    tier:"cold",health:"red",owner:"Carter",value:"Pre-contract · target <$25K",
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
  {
    id:"easy991",orgId:"3tree",account:"Easy 99.1",short:"E9",logo:"#0EA5E9",
    tier:"watch",health:"yellow",owner:"Carter",value:"$51,890 GMV · 4 events",
    products:["Primary ticketing"],eventType:"Radio/media events",sponsorMode:"They brought the sponsor",
    contractCycle:1,cycles:[{id:"cy1",label:"Easy 99.1 — 2026 season",start:"Jan 2026",end:"Jun 2026",products:["Primary ticketing"],active:false,gmvActual:51890,gmvProjected:60000,netTakePct:7,paymentTerms:"Net 30"}],chargebacks:[],
    features:[{id:"f1",name:"Primary ticketing",status:"Shipped",scope:"contract",note:"4 events completed."}],
    contract:{start:"Jan 2026",end:"Jun 2026",renewal:"TBD",paymentTerms:"Net 30",platformFeePct:7,kickbackPct:0,kickbackTo:"",netTakePct:7,gmvProjected:60000,gmvActual:51890,liabilityCap:75000,slaTarget:99.5,dataRights:"Fan profiles retained by Ticket Tree",autoRenew:false,terminationNotice:"30 days"},
    costs:[],kpis:{daysSinceContact:38,slaActual:99.6,sentiment:"Contained",chargebacks:0},
    milestones:[{id:"m1",type:"renewal",date:"2026-09-01",title:"Fall season renewal",note:"Pitch Sponsor Portal for fall events.",done:false}],
    risks:[{risk:"No Sponsor Portal upsell yet",severity:"low",action:"Radio station has natural sponsor inventory — pitch for fall."}],
    signals_pending:[],flags:[],summary:"Radio station events, 4 completed.",signal:"",fault:{verdict:"neither",reasoning:"",against_us:"",against_them:""},obligations:[],comms:"",
  },
  {
    id:"havoc",orgId:"3tree",account:"Havoc Fighting Championship",short:"HF",logo:"#6B7280",
    tier:"archived",health:"archived",owner:"Carter",value:"$22,455 GMV · 1 event",
    products:["Primary ticketing"],eventType:"Combat sports",sponsorMode:"No sponsor",
    contractCycle:1,cycles:[],chargebacks:[],features:[],
    contract:{start:"Sep 2025",end:"Oct 2025",renewal:"N/A",paymentTerms:"Net 14",platformFeePct:7,kickbackPct:0,kickbackTo:"",netTakePct:7,gmvProjected:20000,gmvActual:22455,liabilityCap:25000,slaTarget:99.5,dataRights:"Fan profiles retained by Ticket Tree",autoRenew:false,terminationNotice:"30 days"},
    costs:[],kpis:{daysSinceContact:180,slaActual:99.9,sentiment:"Cold",chargebacks:0},
    milestones:[],risks:[],signals_pending:[],flags:[],
    summary:"1 event. Archived — no future events planned.",signal:"",fault:{verdict:"neither",reasoning:"",against_us:"",against_them:""},obligations:[],comms:"",
  },
  {
    id:"graystone",orgId:"3tree",account:"Graystone Promotions",short:"GP",logo:"#6B7280",
    tier:"archived",health:"archived",owner:"Elijah",value:"$16,354 GMV · 1 event",
    products:["Primary ticketing"],eventType:"Boxing promotion",sponsorMode:"No sponsor",
    contractCycle:1,cycles:[],chargebacks:[],features:[],
    contract:{start:"Aug 2025",end:"Sep 2025",renewal:"N/A",paymentTerms:"Net 14",platformFeePct:7,kickbackPct:0,kickbackTo:"",netTakePct:7,gmvProjected:15000,gmvActual:16354,liabilityCap:20000,slaTarget:99.5,dataRights:"Fan profiles retained by Ticket Tree",autoRenew:false,terminationNotice:"30 days"},
    costs:[],kpis:{daysSinceContact:200,slaActual:99.9,sentiment:"Cold",chargebacks:0},
    milestones:[],risks:[],signals_pending:[],flags:[],
    summary:"1 event. Archived — no future events planned.",signal:"",fault:{verdict:"neither",reasoning:"",against_us:"",against_them:""},obligations:[],comms:"",
  },
];
async function sget(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch{return null;}}
async function sset(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch{}}
async function slist(p){try{return Object.keys(localStorage).filter(k=>k.startsWith(p));}catch{return[];}}
async function sdel(k){try{localStorage.removeItem(k);}catch{}}

// ── Atoms ──
// Vercel-style tag: compact, text-only, tight padding, 4px radius, no emoji
const Tag=({label,c,s})=><span style={{
  display:"inline-flex",alignItems:"center",
  fontSize:11.5,fontWeight:500,
  padding:"2px 7px",
  borderRadius:4,
  background:s,color:c,
  letterSpacing:-.1,
  whiteSpace:"nowrap",
  lineHeight:"18px",
}}>{label}</span>;

// Vercel-style collapsible section with smooth CSS transition
function CollapsibleSection({title,badge,badgeColor,badgeBg,defaultOpen=true,onAdd,addLabel="+ Add",children}){
  const [open,setOpen]=useState(defaultOpen);
  return <div style={{marginBottom:28}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:open?14:0,cursor:"pointer",userSelect:"none"}} onClick={()=>setOpen(!open)}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {/* Vercel chevron — rotates on open */}
        <span style={{fontSize:12,color:S.inactiveText,display:"inline-block",transform:open?"rotate(90deg)":"rotate(0deg)",transition:"transform .18s ease",lineHeight:1}}>›</span>
        <span style={{fontSize:12,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText}}>{title}</span>
        {badge!=null&&badge!==""&&<span style={{fontSize:11,fontWeight:600,padding:"1px 6px",borderRadius:4,background:badgeBg||"#F3F4F6",color:badgeColor||S.inactiveText}}>{badge}</span>}
      </div>
      {open&&onAdd&&<button onClick={e=>{e.stopPropagation();onAdd();}} style={{fontSize:12,color:T.purple,background:"none",border:"none",cursor:"pointer",fontWeight:500,padding:0,fontFamily:sans}}>{addLabel}</button>}
    </div>
    {/* Smooth expand/collapse */}
    <div style={{
      overflow:"hidden",
      maxHeight:open?"2000px":"0px",
      opacity:open?1:0,
      transition:"max-height .22s ease, opacity .18s ease",
    }}>
      {children}
    </div>
  </div>;
}
const Pill=({children,c,s})=><span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,padding:"6px 11px",borderRadius:6,background:s,color:c}}>{children}</span>;
const Sec=({children,right})=><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"24px 2px 10px"}}><span style={{fontSize:11,fontWeight:600,letterSpacing:.7,textTransform:"uppercase",color:T.faint}}>{children}</span>{right}</div>;
const icbtn={width:40,height:40,borderRadius:8,background:T.bg,border:BD,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:T.ink,cursor:"pointer"};

// ── Vercel sidebar colors ──
const S={bg:"#FFFFFF",activeBg:"#F3F4F6",activeText:"#111111",inactiveText:"#6B7280",labelText:"#9CA3AF",border:"#E5E7EB",activeBorder:"transparent",hoverBg:"#F3F4F6"};
const SIDEBAR_W=220;
const NAV_ITEMS=[
  {id:"dashboard",label:"Home",       section:null},
  {id:"accounts", label:"Accounts",   section:null},
  {id:"timeline", label:"Timeline",   section:null},
  {id:"finance",  label:"Finances",   section:null},
  {id:"digest",   label:"Agent",      section:null},
  {id:"disputes", label:"Disputes",   section:"Shortcuts"},
  {id:"renewals", label:"Renewals due",section:"Shortcuts"},
  {id:"oos",      label:"Out of scope",section:"Shortcuts"},
  {id:"risks",    label:"Risk flags",  section:"Shortcuts"},
  {id:"costs",    label:"Cost ledger", section:"Shortcuts"},
];
const VBtn={
  primary:  {padding:"7px 14px",borderRadius:6,border:"none",background:T.black,color:"#fff",fontFamily:sans,fontSize:13,fontWeight:500,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,letterSpacing:-.1},
  secondary:{padding:"7px 14px",borderRadius:6,border:"1px solid #D1D5DB",background:"#fff",color:T.ink,fontFamily:sans,fontSize:13,fontWeight:500,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6,letterSpacing:-.1},
  ghost:    {padding:"7px 14px",borderRadius:6,border:"none",background:"transparent",color:T.sub,fontFamily:sans,fontSize:13,fontWeight:400,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6},
  danger:   {padding:"7px 14px",borderRadius:6,border:"none",background:T.red,color:"#fff",fontFamily:sans,fontSize:13,fontWeight:500,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6},
  small:    {padding:"5px 10px",borderRadius:5,border:"1px solid #D1D5DB",background:"#fff",color:T.ink,fontFamily:sans,fontSize:12,fontWeight:500,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5},
};


export default function AppDesktop(){
  const [orgs,setOrgs]=useState([]);
  const [accts,setAccts]=useState([]);
  const [orgId,setOrgId]=useState(null);
  const [isMobile,setIsMobile]=useState(()=>typeof window!=='undefined'&&window.innerWidth<768);
  useEffect(()=>{const fn=()=>setIsMobile(window.innerWidth<768);window.addEventListener('resize',fn);return()=>window.removeEventListener('resize',fn);},[]);
  const [nav,setNav]=useState(()=>{try{return sessionStorage.getItem('tt_nav')||'dashboard';}catch{return'dashboard';}});
  const [selected,setSelected]=useState(()=>{try{return sessionStorage.getItem('tt_selected')||null;}catch{return null;}});
  const [detailTab,setDetailTab]=useState(()=>{try{return sessionStorage.getItem('tt_tab')||'overview';}catch{return'overview';}});
  const [editMode,setEditMode]=useState(false);
  const [loaded,setLoaded]=useState(false);
  const [wizardOpen,setWizardOpen]=useState(false);
  const [archiveTarget,setArchiveTarget]=useState(null);

  useEffect(()=>{
    // Always boot from SEED_ACCTS directly — localStorage only used for user edits
    // Check if user has saved edits for any account
    const savedAccts=SEED_ACCTS.map(a=>{
      try{const saved=localStorage.getItem(`acct:${a.orgId}:${a.id}`);return saved?JSON.parse(saved):a;}
      catch{return a;}
    });
    setOrgs([SEED_ORG]);
    setAccts(savedAccts);
    setOrgId(SEED_ORG.id);
    setLoaded(true);
  },[]);

  const org=orgs.find(o=>o.id===orgId);
  const orgAccts=accts.filter(a=>a.orgId===orgId);
  const selectedAcct=selected?orgAccts.find(a=>a.id===selected):null;

  async function saveAcct(a){
    try{localStorage.setItem(`acct:${a.orgId}:${a.id}`,JSON.stringify(a));}catch{}
    setAccts(p=>{const i=p.findIndex(x=>x.id===a.id&&x.orgId===a.orgId);if(i>=0){const c=[...p];c[i]=a;return c;}return[...p,a];});
  }
  async function saveOrg(o){await sset(`org:${o.id}`,o);setOrgs(p=>[...p,o]);setOrgId(o.id);}
  async function delAcct(a){await sdel(`acct:${a.orgId}:${a.id}`);setAccts(p=>p.filter(x=>!(x.id===a.id&&x.orgId===a.orgId)));selectAcct(null);}

  if(!loaded)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",fontFamily:sans,color:T.sub,fontSize:14}}>Loading…</div>;

  const activeAccts=orgAccts.filter(a=>a.tier!=="archived"&&a.health!=="archived");
  const archivedAccts=orgAccts.filter(a=>a.tier==="archived"||a.health==="archived");
  const acctsByTier={
    active:activeAccts.filter(a=>a.tier==="active"),
    watch: activeAccts.filter(a=>a.tier==="watch"),
    cold:  activeAccts.filter(a=>a.tier==="cold"||a.health==="red"),
  };
  const staleAccts=activeAccts.filter(a=>(a.kpis?.daysSinceContact||0)>=90);
  function archiveAcct(id){const a=orgAccts.find(x=>x.id===id);if(a)saveAcct({...a,tier:"archived",health:"archived"});}
  function unarchiveAcct(id){const a=orgAccts.find(x=>x.id===id);if(a)saveAcct({...a,tier:"active",health:"green"});}

  const allC=activeAccts.filter(a=>a.contract);
  // GMV from active contracts — use gmvActual for what's realized
  const gmvActual=allC.reduce((n,a)=>n+(a.contract.gmvActual||0),0);
  const gmvProj=allC.reduce((n,a)=>n+(a.contract.gmvProjected||0),0);
  // Fees realized = gmvActual * each account's actual take rate
  const feesEarned=allC.reduce((n,a)=>n+(a.contract.gmvActual||0)*(a.contract.netTakePct||10)/100,0);
  // Fees contracted = what we expect to earn when fully realized
  const feesContracted=allC.reduce((n,a)=>n+(a.contract.gmvProjected||0)*(a.contract.netTakePct||10)/100,0);
  // Fees missed = contracted minus earned (opportunity gap)
  const feesMissed=feesContracted-feesEarned;
  const totalCosts=activeAccts.reduce((n,a)=>n+sumCosts(a),0);
  const netRev=feesEarned-totalCosts;
  const netRevContracted=feesContracted-totalCosts;
  const pipelinePct=gmvProj>0?Math.round(100*gmvActual/gmvProj):0;
  const coverage=gmvProj>0?(gmvActual/gmvProj).toFixed(1)+"x":"—";
  const coverageHealthy=gmvActual/gmvProj>=0.3;
  // Forecast = fees we expect to earn total across all active contracts
  const forecast=feesContracted;
  const confidence=pipelinePct>=70?"High":pipelinePct>=40?"Medium":"Low";
  // Historical from completed cycles
  const allHistorical=orgAccts.flatMap(a=>(a.cycles||[]).filter(c=>!c.active&&(c.gmvActual||0)>0).map(c=>({...c,acct:a.account,aid:a.id,take:c.netTakePct||a.contract?.netTakePct||10})));
  const historicalGmv=allHistorical.reduce((n,c)=>n+(c.gmvActual||0),0);
  const historicalFees=allHistorical.reduce((n,c)=>n+(c.gmvActual||0)*(c.netTakePct||c.take||10)/100,0);
  const actions=activeAccts.flatMap(a=>(a.risks||[]).map(r=>({...r,acct:a.account,aid:a.id}))).sort((x,y)=>({high:0,medium:1,low:2}[x.severity]-{high:0,medium:1,low:2}[y.severity]));
  const allMilestones=activeAccts.flatMap(a=>(a.milestones||[]).filter(m=>!m.done&&daysDiff(m.date)>=0&&daysDiff(m.date)<=14).map(m=>({...m,acct:a.account,aid:a.id}))).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const velocity=activeAccts.length>0?Math.round(activeAccts.reduce((n,a)=>{const ms=(a.milestones||[]).filter(m=>m.done);return n+(ms.length>0?14:21);},0)/activeAccts.length):0;
  const showDetail=selectedAcct&&(nav==="accounts");
  function navigate(page){try{sessionStorage.setItem('tt_nav',page);}catch{}setNav(page);}
  function selectAcct(id,tab){const t=tab||'overview';try{sessionStorage.setItem('tt_selected',id||'');sessionStorage.setItem('tt_tab',t);}catch{}setSelected(id);setDetailTab(t);}

  return(
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",height:"100vh",background:"#FAFAFA",fontFamily:sans,color:T.ink,letterSpacing:-.1,overflow:"hidden"}}>

      {/* SIDEBAR — desktop: left rail | mobile: bottom tab bar */}
      {isMobile&&<div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:S.bg,borderTop:`1px solid ${S.border}`,display:"flex",alignItems:"stretch",height:56}}>
        {NAV_ITEMS.filter(n=>!n.section).map(n=>{const isActive=(nav===n.id)&&(n.id==="accounts"||!showDetail);return<button key={n.id} onClick={()=>{navigate(n.id);selectAcct(null);}} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",border:"none",background:"transparent",cursor:"pointer",fontFamily:sans,fontSize:10.5,fontWeight:isActive?700:400,color:isActive?T.ink:S.inactiveText,gap:2,padding:"6px 0"}}>
          <span style={{fontSize:16}}>{n.id==="dashboard"?"⊞":n.id==="accounts"?"≡":n.id==="timeline"?"◷":"⚡"}</span>
          {n.label}
        </button>;})}
      </div>}
      {!isMobile&&<div style={{width:SIDEBAR_W,flexShrink:0,background:S.bg,borderRight:`1px solid ${S.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"16px 16px 12px",borderBottom:`1px solid ${S.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:30,height:30,borderRadius:7,background:T.black,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{color:"#fff",fontSize:12,fontWeight:700,letterSpacing:-.3}}>TT</span></div>
            <div><div style={{fontSize:13,fontWeight:600,color:T.ink}}>3 Tree Labs</div><div style={{fontSize:11,color:S.inactiveText,marginTop:1}}>Account Intelligence</div></div>
          </div>
        </div>
        <div style={{padding:"8px 0",flex:1,overflowY:"auto"}}>
          {(()=>{let lastSection=undefined;return NAV_ITEMS.map(n=>{const showLabel=n.section&&n.section!==lastSection;lastSection=n.section;const isActive=(nav===n.id)&&(n.id==="accounts"||!showDetail);return<div key={n.id}>{showLabel&&<div style={{fontSize:10.5,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,padding:"16px 20px 5px"}}>{n.section}</div>}<button
  onClick={()=>{navigate(n.id);selectAcct(null);}}
  onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background=S.hoverBg;e.currentTarget.style.color=T.ink;}}
  onMouseLeave={e=>{e.currentTarget.style.background=isActive?S.activeBg:"transparent";e.currentTarget.style.color=isActive?S.activeText:S.inactiveText;}}
  style={{width:"100%",display:"flex",alignItems:"center",padding:"6px 16px",border:"none",borderRadius:6,margin:"1px 8px",width:"calc(100% - 16px)",cursor:"pointer",fontFamily:sans,fontSize:13,fontWeight:isActive?600:400,background:isActive?S.activeBg:"transparent",color:isActive?S.activeText:S.inactiveText,textAlign:"left",transition:"background .1s,color .1s"}}>{n.label}</button></div>;});})()}
        </div>
        <div style={{padding:"12px 16px 16px",borderTop:`1px solid ${S.border}`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText}}>Agent</div>
            <div style={{width:7,height:7,borderRadius:"50%",background:T.green}}/>
          </div>
          <div style={{fontSize:12,color:T.ink,fontWeight:500,marginBottom:1}}>Weekly pull ready</div>
          <div style={{fontSize:11,color:S.inactiveText,marginBottom:10}}>Last run: not yet</div>
          <button onClick={()=>navigate("digest")} style={{...VBtn.primary,width:"100%",justifyContent:"center",fontSize:12}}>Run pull</button>
        </div>
      </div>}

      {/* MAIN CONTENT */}
      <div style={{flex:1,overflow:"auto",background:"#FFFFFF",minWidth:0,paddingBottom:isMobile?56:0}}>

        {showDetail&&<StripeDetail a={selectedAcct} tab={detailTab} onTabChange={t=>{try{sessionStorage.setItem('tt_tab',t);}catch{}setDetailTab(t);}} onBack={()=>selectAcct(null)} onEdit={()=>setEditMode(true)} onNewContract={()=>setWizardOpen(true)} onDelete={async()=>{await delAcct(selectedAcct);}} onSave={saveAcct}/>}

        {/* DASHBOARD */}
        {!showDetail&&nav==="dashboard"&&<div style={{padding:isMobile?"16px 16px 72px":"32px 40px"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28}}>
            <div>
              <div style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,marginBottom:6}}><span style={{color:T.purple,cursor:"pointer"}}>Accounts</span> → Dashboard</div>
              <h1 style={{fontSize:24,fontWeight:700,letterSpacing:-.4,margin:"0 0 4px",color:T.ink}}>3 Tree Labs</h1>
              <p style={{fontSize:13,color:S.inactiveText,margin:0}}>Real-time revenue, pipeline, and contract health</p>
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>{navigate("accounts");setEditMode(true);}} style={{...VBtn.secondary,fontSize:13}}>+ New account</button>
            </div>
          </div>

          {staleAccts.length>0&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div><div style={{fontSize:13,fontWeight:600,color:"#92400E"}}>{staleAccts.length} account{staleAccts.length!==1?"s":""} with no contact in 90+ days</div>
              <div style={{fontSize:12,color:"#B45309",marginTop:1}}>{staleAccts.map(a=>a.account).join(", ")} — consider archiving</div></div>
            </div>
            <button onClick={()=>navigate("accounts")} style={{...VBtn.small,borderColor:"#FDE68A",color:"#92400E"}}>Review →</button>
          </div>}

          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"1.4fr 1fr 1fr 1fr",gap:12,marginBottom:28}}>
            <div style={{background:T.black,borderRadius:12,padding:"16px 20px",display:"flex",flexDirection:"column",minHeight:136,color:"#fff"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"auto"}}><span style={{fontSize:10.5,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:"#9CA0AB"}}>AI Forecast</span><span style={{fontSize:13,color:"#9CA0AB"}}>✦</span></div>
              <div style={{fontSize:32,fontWeight:800,letterSpacing:-1.2,lineHeight:1,margin:"10px 0 8px"}}>{fmtK(forecast)}</div>
              <span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11.5,fontWeight:600,padding:"5px 12px",borderRadius:6,background:"#fff",color:T.black,width:"fit-content"}}>↑ {confidence} Confidence</span>
            </div>
            {[
              {label:"GMV realized",value:fmtK(gmvActual),sub:`${pipelinePct}% of ${fmtK(gmvProj)} contracted`},
              {label:"Pipeline",value:coverage,sub:coverageHealthy?"Healthy":"Watch"},
              {label:"Net realized",value:(netRev<0?"-":"")+fmtK(Math.abs(netRev)),sub:netRev>=0?`${fmt(feesEarned)} fees earned`:"Underwater",col:netRev<0?T.red:undefined},
            ].map((t,i)=>(
              <div key={i} style={{background:"#fff",border:`1px solid ${S.border}`,borderRadius:12,padding:"16px 20px",display:"flex",flexDirection:"column",minHeight:136,justifyContent:"space-between"}}>
                <span style={{fontSize:10.5,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText}}>{t.label}</span>
                <div>
                  <div style={{fontSize:28,fontWeight:700,letterSpacing:-1,lineHeight:1,marginBottom:6,color:t.col||T.ink}}>{t.value}</div>
                  <span style={{display:"inline-flex",alignItems:"center",fontSize:11.5,fontWeight:600,padding:"4px 10px",borderRadius:6,background:T.black,color:"#fff"}}>{t.sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:28}}>
            <div style={{border:`1px solid ${S.border}`,borderRadius:12,overflow:"hidden"}}>
              <div style={{padding:"16px 20px",borderBottom:`1px solid ${S.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:10.5,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:2}}>AI Powered</div><div style={{fontSize:15,fontWeight:600,color:T.ink}}>Priority Actions</div></div>
                <span style={{width:24,height:24,borderRadius:"50%",background:T.black,color:"#fff",fontSize:12,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{actions.length}</span>
              </div>
              {actions.slice(0,4).map((r,i)=>(
                <button key={i} onClick={()=>{setSelected(r.aid);navigate("accounts");setDetailTab("overview");}} style={{width:"100%",display:"flex",alignItems:"flex-start",gap:12,padding:"14px 20px",border:"none",borderTop:i?`1px solid ${S.border}`:"none",background:"#fff",cursor:"pointer",fontFamily:sans,textAlign:"left"}}>
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
              {allMilestones.slice(0,5).map((m,i)=>{const mt=MILESTONE_TYPES[m.type]||MILESTONE_TYPES.review;const d=daysDiff(m.date);return(
                <button key={m.id} onClick={()=>{setSelected(m.aid);navigate("accounts");setDetailTab("timeline");}} style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 20px",border:"none",borderTop:i?`1px solid ${S.border}`:"none",background:"#fff",cursor:"pointer",fontFamily:sans,textAlign:"left"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500,color:T.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title}</div>
                    <div style={{fontSize:11.5,color:S.inactiveText,marginTop:1}}>{m.acct}</div>
                  </div>
                  <span style={{fontSize:12,fontWeight:600,color:d<=3?T.red:d<=7?T.yellow:S.inactiveText,flexShrink:0}}>{d===0?"Today":d===1?"Tomorrow":`${d}d`}</span>
                </button>
              );})}
              {allMilestones.length===0&&<div style={{padding:"24px 20px",fontSize:13,color:S.inactiveText}}>No upcoming milestones in the next 14 days.</div>}
            </div>
          </div>
        </div>}

        {/* ACCOUNTS */}
        {!showDetail&&nav==="accounts"&&<div style={{padding:isMobile?"16px 16px 72px":"32px 40px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div>
              <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-.3,margin:"0 0 4px",color:T.ink}}>Accounts</h1>
              <p style={{fontSize:13,color:S.inactiveText,margin:0}}>{acctsByTier.active.length} active · {acctsByTier.watch.length} watch · {acctsByTier.cold.length} cold · {archivedAccts.length} archived</p>
            </div>
            <button onClick={()=>setEditMode(true)} style={{...VBtn.primary}}>+ New account</button>
          </div>
          {(()=>{
            const allRows=[...acctsByTier.active,...acctsByTier.watch,...acctsByTier.cold];
            if(allRows.length===0)return<div style={{padding:"40px",textAlign:"center",fontSize:14,color:S.inactiveText,border:`1px solid ${S.border}`,borderRadius:8}}>No accounts yet.</div>;
            return<>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr auto":"2.2fr .8fr 1fr 1fr 1fr 120px",padding:isMobile?"8px 14px":"8px 20px",background:"#FAFAFA",border:`1px solid ${S.border}`,borderRadius:"8px 8px 0 0"}}>
                {["Account","Tier","GMV realized","Fees earned","Net revenue",""].map((h,i)=>(
                  <div key={i} style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,textAlign:i>=2&&i<5?"right":"left"}}>{h}</div>
                ))}
              </div>
              <div style={{border:`1px solid ${S.border}`,borderTop:"none",borderRadius:"0 0 8px 8px",overflow:"hidden",background:"#fff"}}>
                {allRows.map((a,i)=>{
                  const c=a.contract,tc=sumCosts(a);
                  const fees=c?(c.gmvActual||0)*(c.netTakePct||0)/100:0;
                  const net=fees-tc;
                  const tier=CRM_TIERS[a.tier]||CRM_TIERS.active;
                  const prevTier=i>0?(allRows[i-1].tier||"active"):null;
                  const showTierHeader=a.tier!==prevTier;
                  return<div key={a.id}>
                    {showTierHeader&&i>0&&<div style={{padding:"8px 20px 5px",background:"#F9FAFB",borderTop:`1px solid ${S.border}`}}>
                      <span style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:tier.c}}>{tier.label}</span>
                    </div>}
                    <button onClick={()=>{selectAcct(a.id,"overview");}} style={{display:"grid",gridTemplateColumns:isMobile?"1fr auto":"2.2fr .8fr 1fr 1fr 1fr 120px",padding:isMobile?"10px 14px":"12px 20px",width:"100%",background:"#fff",border:"none",borderTop:`1px solid ${S.border}`,cursor:"pointer",fontFamily:sans,color:T.ink,textAlign:"left"}}
                      onMouseEnter={e=>e.currentTarget.style.background="#FAFAFA"}
                      onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:30,height:30,borderRadius:6,background:a.logo||"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{a.short||a.account.slice(0,2).toUpperCase()}</div>
                        <div><div style={{fontSize:13,fontWeight:600,color:T.ink}}>{a.account}</div><div style={{fontSize:11.5,color:S.inactiveText,marginTop:1}}>{a.owner} · {a.value}</div></div>
                      </div>
                      <div style={{display:"flex",alignItems:"center"}}><Tag label={tier.label} c={tier.c} s={tier.s}/></div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",fontSize:13}}>{c?fmtK(c.gmvActual):"—"}</div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",fontSize:13}}>{c?fmtK(fees):"—"}</div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",fontSize:13,color:net<0?T.red:T.ink}}>{c?(net<0?"-":"")+fmtK(Math.abs(net)):"—"}</div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:10}}>
                        <button onClick={e=>{e.stopPropagation();setArchiveTarget(a);}} style={{fontSize:11,color:S.labelText,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:sans}}>Archive</button>
                        <span style={{fontSize:12,color:T.purple,fontWeight:500}}>View →</span>
                      </div>
                    </button>
                  </div>;
                })}
              </div>
              {archivedAccts.length>0&&<div style={{marginTop:28}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <h2 style={{fontSize:13,fontWeight:600,color:S.inactiveText,margin:0}}>Archived ({archivedAccts.length})</h2>
                  <span style={{fontSize:12,color:S.labelText}}>Hidden from dashboard, actions, and timeline</span>
                </div>
                <div style={{border:`1px solid ${S.border}`,borderRadius:8,overflow:"hidden",background:"#fff",opacity:.7}}>
                  {archivedAccts.map((a,i)=>(
                    <div key={a.id} style={{display:"grid",gridTemplateColumns:"2.2fr .8fr 1fr 1fr 1fr 120px",padding:"11px 20px",borderTop:i?`1px solid ${S.border}`:"none",alignItems:"center"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:28,height:28,borderRadius:6,background:"#D1D5DB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff"}}>{a.short}</div>
                        <div><div style={{fontSize:13,color:S.inactiveText}}>{a.account}</div><div style={{fontSize:11.5,color:S.labelText,marginTop:1}}>{a.owner}</div></div>
                      </div>
                      <div><Tag label="Archived" c={S.inactiveText} s="#F3F4F6"/></div>
                      <div style={{fontSize:13,color:S.labelText,textAlign:"right"}}>{a.contract?fmtK(a.contract.gmvActual):"—"}</div>
                      <div style={{fontSize:13,color:S.labelText,textAlign:"right"}}>—</div>
                      <div style={{fontSize:13,color:S.labelText,textAlign:"right"}}>—</div>
                      <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
                        <button onClick={()=>unarchiveAcct(a.id)} style={{fontSize:12,color:T.purple,background:"none",border:"none",cursor:"pointer",fontFamily:sans,fontWeight:500}}>Restore</button>
                        <button onClick={()=>{selectAcct(a.id,"overview");}} style={{fontSize:12,color:S.labelText,background:"none",border:"none",cursor:"pointer",fontFamily:sans}}>View →</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>}
            </>;
          })()}
        </div>}

        {/* TIMELINE */}
        {!showDetail&&nav==="timeline"&&<div style={{padding:isMobile?"16px 16px 72px":"32px 40px"}}>
          <div style={{marginBottom:28}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:5}}>Timeline</div>
            <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-.3,margin:"0 0 4px",color:T.ink}}>All accounts</h1>
            <p style={{fontSize:13,color:S.inactiveText,margin:0}}>Milestones, deadlines, and renewal windows across active accounts.</p>
          </div>
          {activeAccts.filter(a=>(a.milestones||[]).length>0).map(a=>{
            const tier=CRM_TIERS[a.tier]||CRM_TIERS.active;
            const sorted=(a.milestones||[]).slice().sort((x,y)=>new Date(x.date)-new Date(y.date));
            const upcoming=sorted.filter(m=>!m.done);
            const past=sorted.filter(m=>m.done);
            return(
              <div key={a.id} style={{marginBottom:32,border:`1px solid ${S.border}`,borderRadius:10,overflow:"hidden",background:"#fff"}}>
                {/* Account header row */}
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"14px 20px",background:"#FAFAFA",borderBottom:`1px solid ${S.border}`}}>
                  <div style={{width:28,height:28,borderRadius:6,background:a.logo||"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{a.short}</div>
                  <div style={{flex:1}}>
                    <span style={{fontSize:14,fontWeight:600,color:T.ink}}>{a.account}</span>
                  </div>
                  <Tag label={tier.label} c={tier.c} s={tier.s}/>
                  <button onClick={()=>{selectAcct(a.id,"timeline");}} style={{fontSize:12,color:T.purple,background:"none",border:"none",cursor:"pointer",fontWeight:500,fontFamily:sans}}>Open →</button>
                </div>
                {/* Upcoming milestones */}
                {upcoming.length>0&&<>
                  <div style={{padding:"8px 20px 4px",fontSize:10.5,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText}}>Upcoming</div>
                  {upcoming.map((m,i)=>{
                    const mt=MILESTONE_TYPES[m.type]||MILESTONE_TYPES.review;
                    const d=daysDiff(m.date);
                    const urgent=d<=3&&!m.done;
                    const soon=d<=7&&!m.done&&!urgent;
                    return(
                      <div key={m.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 20px",borderTop:`1px solid ${S.border}`}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:urgent?T.red:soon?T.yellow:mt.color,flexShrink:0}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontSize:13,fontWeight:500,color:T.ink}}>{m.title}</span>
                            <Tag label={mt.label} c={mt.color} s={mt.color+"18"}/>
                          </div>
                          {m.note&&<div style={{fontSize:12,color:S.inactiveText,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.note}</div>}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                          {urgent&&<span style={{fontSize:12,fontWeight:700,color:T.red}}>{d<=0?"Today":d===1?"Tomorrow":`${d}d`}</span>}
                          {soon&&<span style={{fontSize:12,fontWeight:600,color:T.yellow}}>{d}d</span>}
                          <span style={{fontSize:12,color:S.labelText}}>{new Date(m.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
                        </div>
                      </div>
                    );
                  })}
                </>}
                {/* Past milestones — collapsed by default */}
                {past.length>0&&<div style={{padding:"8px 20px",borderTop:`1px solid ${S.border}`,background:"#FAFAFA"}}>
                  <span style={{fontSize:11,color:S.labelText}}>{past.length} completed milestone{past.length!==1?"s":""}</span>
                </div>}
                {upcoming.length===0&&past.length===0&&<div style={{padding:"16px 20px",fontSize:13,color:S.inactiveText}}>No milestones.</div>}
              </div>
            );
          })}
          {activeAccts.filter(a=>(a.milestones||[]).length>0).length===0&&(
            <div style={{padding:"40px",textAlign:"center",border:`1px dashed ${S.border}`,borderRadius:10,color:S.inactiveText,fontSize:13}}>No milestones across active accounts.</div>
          )}
        </div>}

        {/* AGENT */}
        {!showDetail&&nav==="digest"&&<AgentPage accounts={activeAccts}/>}

        {/* DISPUTES */}
        {!showDetail&&nav==="disputes"&&<div style={{padding:isMobile?"16px 16px 72px":"32px 40px"}}>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:5}}>Shortcuts</div>
            <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-.3,margin:"0 0 4px",color:T.ink}}>Disputes</h1>
            <p style={{fontSize:13,color:S.inactiveText,margin:0}}>All chargebacks and open disputes across accounts. Hand anything contested to Zachary at Polsinelli.</p>
          </div>
          {(()=>{const all=orgAccts.flatMap(a=>(a.chargebacks||[]).map(cb=>({...cb,acct:a.account,aid:a.id})));
            if(all.length===0)return<div style={{fontSize:14,color:S.inactiveText}}>No chargebacks logged.</div>;
            return<div style={{border:`1px solid ${S.border}`,borderRadius:10,overflow:"hidden",background:"#fff"}}>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 120px",padding:"10px 20px",background:"#FAFAFA",borderBottom:`1px solid ${S.border}`}}>
                {["Account / disputed by","Amount","Date","Status",""].map((h,i)=><div key={i} style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText}}>{h}</div>)}
              </div>
              {all.map((cb,i)=>{const col=cb.status==="Open"?T.red:cb.status.includes("won")?T.green:S.inactiveText;return(
                <div key={cb.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 120px",padding:"13px 20px",borderTop:i?`1px solid ${S.border}`:"none"}}>
                  <div><div style={{fontSize:13,fontWeight:500}}>{cb.disputedBy||"Unknown"}</div><div style={{fontSize:11.5,color:S.inactiveText,marginTop:1}}>{cb.acct}</div></div>
                  <div style={{fontSize:13,display:"flex",alignItems:"center"}}>{cb.amount>0?fmt(cb.amount):"—"}</div>
                  <div style={{fontSize:13,color:S.inactiveText,display:"flex",alignItems:"center"}}>{cb.date}</div>
                  <div style={{display:"flex",alignItems:"center"}}><Tag label={cb.status} c={col} s={col+"14"}/></div>
                  <button onClick={()=>{setSelected(cb.aid);navigate("accounts");setDetailTab("timeline");}} style={{fontSize:12,color:T.purple,background:"none",border:"none",cursor:"pointer",fontFamily:sans,fontWeight:500,textAlign:"left"}}>View →</button>
                </div>
              );})}
            </div>;
          })()}
        </div>}

        {/* FINANCE */}
        {!showDetail&&nav==="finance"&&<FinancePage
          activeAccts={activeAccts}
          orgAccts={orgAccts}
          gmvActual={gmvActual}
          gmvProj={gmvProj}
          feesEarned={feesEarned}
          feesContracted={feesContracted}
          feesMissed={feesMissed}
          totalCosts={totalCosts}
          netRev={netRev}
          netRevContracted={netRevContracted}
          historicalGmv={historicalGmv}
          historicalFees={historicalFees}
          allHistorical={allHistorical}
          pipelinePct={pipelinePct}
        />}

        {/* RENEWALS DUE */}
        {!showDetail&&nav==="renewals"&&<div style={{padding:isMobile?"16px 16px 72px":"32px 40px"}}>
          <div style={{marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:5}}>Shortcuts</div>
            <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-.3,margin:"0 0 4px",color:T.ink}}>Renewals due</h1>
            <p style={{fontSize:13,color:S.inactiveText,margin:0}}>Active accounts with renewal milestones in the next 90 days.</p>
          </div>
          {(()=>{
            const renewals=activeAccts.flatMap(a=>(a.milestones||[]).filter(m=>!m.done&&m.type==="renewal"&&daysDiff(m.date)>=0&&daysDiff(m.date)<=90).map(m=>({...m,acct:a.account,aid:a.id,logo:a.logo,short:a.short}))).sort((a,b)=>new Date(a.date)-new Date(b.date));
            if(renewals.length===0)return<div style={{padding:"40px",textAlign:"center",border:`1px dashed ${S.border}`,borderRadius:10,fontSize:13,color:S.inactiveText}}>No renewals due in the next 90 days.</div>;
            return<div style={{border:`1px solid ${S.border}`,borderRadius:10,overflow:"hidden",background:"#fff"}}>
              {renewals.map((m,i)=>{const d=daysDiff(m.date);return(
                <button key={m.id} onClick={()=>{selectAcct(m.aid,"timeline");navigate("accounts");}} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 20px",width:"100%",background:"#fff",border:"none",borderTop:i?`1px solid ${S.border}`:"none",cursor:"pointer",fontFamily:sans,textAlign:"left"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#FAFAFA"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                  <div style={{width:30,height:30,borderRadius:6,background:m.logo||"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{m.short}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,color:T.ink}}>{m.title}</div>
                    <div style={{fontSize:12,color:S.inactiveText,marginTop:1}}>{m.acct}{m.note?` · ${m.note}`:""}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:d<=14?T.red:d<=30?T.yellow:T.green}}>{d===0?"Today":d===1?"Tomorrow":`${d}d`}</div>
                    <div style={{fontSize:11,color:S.labelText}}>{new Date(m.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})} </div>
                  </div>
                </button>
              );})}
            </div>;
          })()}
        </div>}

        {/* OUT OF SCOPE */}
        {!showDetail&&nav==="oos"&&<div style={{padding:isMobile?"16px 16px 72px":"32px 40px"}}>
          <div style={{marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:5}}>Shortcuts</div>
            <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-.3,margin:"0 0 4px",color:T.ink}}>Out of scope</h1>
            <p style={{fontSize:13,color:S.inactiveText,margin:0}}>Features flagged as outside contract scope across all accounts. Each one is a billing or risk conversation.</p>
          </div>
          {(()=>{
            const oos=activeAccts.flatMap(a=>(a.features||[]).filter(f=>f.scope==="out-of-scope"||f.scope==="oos").map(f=>({...f,acct:a.account,aid:a.id,logo:a.logo,short:a.short})));
            if(oos.length===0)return<div style={{padding:"40px",textAlign:"center",border:`1px dashed ${S.border}`,borderRadius:10,fontSize:13,color:S.inactiveText}}>No out-of-scope features flagged.</div>;
            return<div style={{border:`1px solid ${S.border}`,borderRadius:10,overflow:"hidden",background:"#fff"}}>
              <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",padding:"9px 20px",background:"#FAFAFA",borderBottom:`1px solid ${S.border}`}}>
                {["Feature","Account","Status"].map((h,i)=><div key={i} style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText}}>{h}</div>)}
              </div>
              {oos.map((f,i)=>(
                <button key={f.id} onClick={()=>{selectAcct(f.aid,"timeline");navigate("accounts");}} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr",padding:"13px 20px",width:"100%",background:"#fff",border:"none",borderTop:i?`1px solid ${S.border}`:"none",cursor:"pointer",fontFamily:sans,textAlign:"left"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#FAFAFA"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                  <div>
                    <div style={{fontSize:13,fontWeight:500,color:T.ink}}>{f.name}</div>
                    {f.note&&<div style={{fontSize:12,color:S.inactiveText,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.note}</div>}
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:22,height:22,borderRadius:5,background:f.logo||"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff"}}>{f.short}</div>
                    <span style={{fontSize:12,color:S.inactiveText}}>{f.acct}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center"}}><Tag label={f.status||"Scoped"} c={T.red} s={T.redSoft}/></div>
                </button>
              ))}
              <div style={{padding:"10px 20px",background:"#FFFBEB",borderTop:`1px solid ${S.border}`,fontSize:12,color:"#92400E"}}>
                {oos.length} out-of-scope item{oos.length!==1?"s":""} — each needs a scope change request, billing conversation, or documented absorption decision.
              </div>
            </div>;
          })()}
        </div>}

        {/* RISK FLAGS */}
        {!showDetail&&nav==="risks"&&<div style={{padding:isMobile?"16px 16px 72px":"32px 40px"}}>
          <div style={{marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:5}}>Shortcuts</div>
            <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-.3,margin:"0 0 4px",color:T.ink}}>Risk flags</h1>
            <p style={{fontSize:13,color:S.inactiveText,margin:0}}>All high and medium severity risks across active accounts.</p>
          </div>
          {(()=>{
            const risks=activeAccts.flatMap(a=>(a.risks||[]).map(r=>({...r,acct:a.account,aid:a.id,logo:a.logo,short:a.short}))).sort((a,b)=>({high:0,medium:1,low:2}[a.severity]-{high:0,medium:1,low:2}[b.severity]));
            if(risks.length===0)return<div style={{padding:"40px",textAlign:"center",border:`1px dashed ${S.border}`,borderRadius:10,fontSize:13,color:S.inactiveText}}>No risk flags across active accounts.</div>;
            return<div style={{border:`1px solid ${S.border}`,borderRadius:10,overflow:"hidden",background:"#fff"}}>
              {risks.map((r,i)=>(
                <button key={i} onClick={()=>{selectAcct(r.aid,"overview");navigate("accounts");}} style={{display:"flex",alignItems:"flex-start",gap:14,padding:"14px 20px",width:"100%",background:"#fff",border:"none",borderTop:i?`1px solid ${S.border}`:"none",cursor:"pointer",fontFamily:sans,textAlign:"left"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#FAFAFA"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                  <Tag label={r.severity==="high"?"Critical":r.severity==="medium"?"Watch":"Low"} c={SEV[r.severity]?.c||T.sub} s={SEV[r.severity]?.s||"#F3F4F6"}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,color:T.ink,marginBottom:2}}>{r.risk}</div>
                    <div style={{fontSize:12,color:S.inactiveText}}>→ {r.action}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    <div style={{width:22,height:22,borderRadius:5,background:r.logo||"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff"}}>{r.short}</div>
                    <span style={{fontSize:12,color:S.inactiveText}}>{r.acct}</span>
                  </div>
                </button>
              ))}
            </div>;
          })()}
        </div>}

        {/* COST LEDGER */}
        {!showDetail&&nav==="costs"&&<div style={{padding:isMobile?"16px 16px 72px":"32px 40px"}}>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:5}}>Shortcuts</div>
            <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-.3,margin:"0 0 4px",color:T.ink}}>Cost ledger</h1>
            <p style={{fontSize:13,color:S.inactiveText,margin:0}}>Running costs logged across all accounts. Feeds directly into net revenue calculations.</p>
          </div>
          {(()=>{const all=orgAccts.flatMap(a=>(a.costs||[]).filter(c=>c.computed>0).map(c=>({...c,acct:a.account,aid:a.id})));const total=all.reduce((n,c)=>n+c.computed,0);
            return<>
              <div style={{fontSize:13,color:S.inactiveText,marginBottom:16}}>Total logged: <b style={{color:T.ink}}>{fmt(total)}</b></div>
              {all.length===0?<div style={{fontSize:14,color:S.inactiveText}}>No costs logged yet. Open an account → Economics to add costs.</div>
                :<div style={{border:`1px solid ${S.border}`,borderRadius:10,overflow:"hidden",background:"#fff"}}>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:"10px 20px",background:"#FAFAFA",borderBottom:`1px solid ${S.border}`}}>
                    {["Account / label","Type","When","Amount"].map((h,i)=><div key={i} style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,textAlign:i===3?"right":"left"}}>{h}</div>)}
                  </div>
                  {all.map((c,i)=>(
                    <div key={c.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",padding:"12px 20px",borderTop:i?`1px solid ${S.border}`:"none"}}>
                      <div><div style={{fontSize:13,color:T.ink,fontWeight:500}}>{c.label}</div><div style={{fontSize:11.5,color:S.inactiveText,marginTop:1}}>{c.acct}</div></div>
                      <div style={{fontSize:13,color:S.inactiveText,display:"flex",alignItems:"center",textTransform:"capitalize"}}>{c.type}</div>
                      <div style={{fontSize:13,color:S.inactiveText,display:"flex",alignItems:"center"}}>{c.when||"—"}</div>
                      <div style={{fontSize:13,fontWeight:600,color:T.ink,display:"flex",alignItems:"center",justifyContent:"flex-end"}}>{fmt(c.computed)}</div>
                    </div>
                  ))}
                </div>}
            </>;
          })()}
        </div>}
      </div>

      {/* ARCHIVE CONFIRMATION MODAL */}
      {archiveTarget&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}} onClick={()=>setArchiveTarget(null)}>
          <div style={{width:440,background:"#fff",borderRadius:10,boxShadow:"0 8px 40px rgba(0,0,0,.18)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"20px 24px 0",display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:T.ink,marginBottom:4}}>Archive account</div>
                <div style={{fontSize:13,color:S.inactiveText,lineHeight:1.5}}><b style={{color:T.ink}}>{archiveTarget.account}</b> will be removed from your active pipeline, priority actions, and timeline. You can restore it anytime.</div>
              </div>
              <button onClick={()=>setArchiveTarget(null)} style={{background:"none",border:`1px solid ${S.border}`,borderRadius:6,width:28,height:28,cursor:"pointer",fontSize:16,color:S.inactiveText,display:"flex",alignItems:"center",justifyContent:"center",marginLeft:16,flexShrink:0}}>×</button>
            </div>
            <div style={{margin:"16px 24px",padding:"12px 14px",background:"#F9FAFB",border:`1px solid ${S.border}`,borderRadius:7,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:28,height:28,borderRadius:6,background:archiveTarget.logo||"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{archiveTarget.short}</div>
              <div><div style={{fontSize:13,fontWeight:600,color:T.ink}}>{archiveTarget.account}</div><div style={{fontSize:11.5,color:S.inactiveText,marginTop:1}}>{archiveTarget.value}</div></div>
            </div>
            <div style={{padding:"0 24px 20px",display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setArchiveTarget(null)} style={{...VBtn.secondary,fontSize:13}}>Cancel</button>
              <button onClick={()=>{archiveAcct(archiveTarget.id);setArchiveTarget(null);if(selected===archiveTarget.id)selectAcct(null);}} style={{...VBtn.primary,fontSize:13}}>Archive account</button>
            </div>
          </div>
        </div>
      )}

      {/* CONTRACT WIZARD */}
      {wizardOpen&&selectedAcct&&<ContractWizard
        a={selectedAcct}
        lastCycle={(selectedAcct.cycles||[]).find(c=>c.active)||null}
        onSave={async updated=>{await saveAcct(updated);}}
        onCancel={()=>setWizardOpen(false)}
      />}

      {/* EDIT / NEW ACCOUNT MODAL */}
      {editMode&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}} onClick={()=>setEditMode(false)}>
          <div style={{width:600,maxHeight:"90vh",overflow:"auto",background:"#fff",borderRadius:12,padding:"28px",boxShadow:"0 20px 60px rgba(0,0,0,.15)"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h2 style={{margin:0,fontSize:18,fontWeight:700,color:T.ink}}>{selectedAcct&&editMode?"Edit account":"New account"}</h2>
              <button onClick={()=>setEditMode(false)} style={{width:28,height:28,borderRadius:"50%",border:`1px solid ${S.border}`,background:"none",cursor:"pointer",fontSize:16,color:T.sub,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
            <AccountForm orgId={orgId} existing={selectedAcct&&editMode?selectedAcct:undefined} onCancel={()=>setEditMode(false)} onSave={async a=>{await saveAcct(a);setSelected(a.id);navigate("accounts");setEditMode(false);}}/>
          </div>
        </div>
      )}
    </div>
  );
}
// Full main area. Left: main content + tabs. Right: meta sidebar.
// Mirrors Stripe's transaction detail layout exactly.
const EF=({label,value,onChange,type="text",placeholder=""})=><div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:4}}>{label}</label><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/></div>;

function MilestoneAdd({onAdd,onCancel}){
  const [type,setType]=useState("event_date");
  const [title,setTitle]=useState("");
  const [date,setDate]=useState("");
  const [note,setNote]=useState("");
  return <div style={{background:"#F9FAFB",border:`1px solid ${S.border}`,borderRadius:8,padding:"16px",marginTop:8}}>
    <div style={{fontSize:12,fontWeight:600,color:T.ink,marginBottom:10}}>Add milestone</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:12}}>
      {Object.entries(MILESTONE_TYPES).map(([k,v])=><button key={k} onClick={()=>setType(k)} style={{padding:"6px 4px",borderRadius:5,fontFamily:sans,fontSize:11,fontWeight:type===k?600:400,cursor:"pointer",border:`1px solid ${type===k?v.color:S.border}`,background:type===k?v.color+"12":"#fff",color:type===k?v.color:S.inactiveText,textAlign:"center"}}>{v.label}</button>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
      <div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:4}}>Title</label><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Event day" style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/></div>
      <div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:4}}>Date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/></div>
    </div>
    <div style={{marginBottom:12}}><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:4}}>Note (optional)</label><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Add context" style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/></div>
    <div style={{display:"flex",gap:8}}>
      <button disabled={!title||!date} onClick={()=>{onAdd({id:uid(),type,title,date,note,done:false});onCancel();}} style={{...VBtn.primary,fontSize:12,opacity:(!title||!date)?.5:1}}>Add</button>
      <button onClick={onCancel} style={{...VBtn.secondary,fontSize:12}}>Cancel</button>
    </div>
  </div>;
}

function MilestoneRow({m,onToggle,onDelete}){
  const mt=MILESTONE_TYPES[m.type]||MILESTONE_TYPES.review;
  const d=daysDiff(m.date);
  const urgent=d<=3&&!m.done;
  const soon=d<=7&&!m.done&&!urgent;
  return <div style={{display:"flex",alignItems:"center",gap:12,padding:"11px 0",borderTop:`1px solid ${S.border}`,opacity:m.done?.45:1}}>
    <button onClick={()=>onToggle(m.id)} style={{width:18,height:18,borderRadius:4,border:`1.5px solid ${m.done?T.green:"#D1D5DB"}`,background:m.done?T.green:"transparent",color:"#fff",fontSize:10,cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>{m.done?"✓":""}</button>
    <div style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:13,fontWeight:500,color:T.ink}}>{m.title}</span>
        <Tag label={mt.label} c={mt.color} s={mt.color+"18"}/>
      </div>
      <div style={{fontSize:12,color:S.inactiveText,marginTop:1}}>{new Date(m.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}{m.note?` · ${m.note}`:""}</div>
    </div>
    {urgent&&<span style={{fontSize:12,fontWeight:700,color:T.red,flexShrink:0}}>{d<=0?"Today":d===1?"Tomorrow":`${d}d`}</span>}
    {soon&&<span style={{fontSize:12,fontWeight:600,color:T.yellow,flexShrink:0}}>{d}d</span>}
    <button onClick={()=>onDelete(m.id)} style={{background:"none",border:"none",color:"#D1D5DB",cursor:"pointer",fontSize:16,padding:"0 4px",lineHeight:1}}>×</button>
  </div>;
}

function AccountTimeline({milestones=[],onAdd,onToggle,onDelete}){
  const [adding,setAdding]=useState(false);
  const sorted=[...milestones].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const upcoming=sorted.filter(m=>!m.done);
  const past=sorted.filter(m=>m.done);
  return <div>
    {upcoming.map(m=><MilestoneRow key={m.id} m={m} onToggle={onToggle} onDelete={onDelete}/>)}
    {past.length>0&&<div style={{marginTop:8,padding:"8px 0",borderTop:`1px solid ${S.border}`}}>
      <div style={{fontSize:11,color:S.labelText,marginBottom:8}}>{past.length} completed</div>
      {past.map(m=><MilestoneRow key={m.id} m={m} onToggle={onToggle} onDelete={onDelete}/>)}
    </div>}
    {sorted.length===0&&<div style={{fontSize:13,color:S.inactiveText,padding:"8px 0"}}>No milestones yet.</div>}
    {adding
      ?<MilestoneAdd onAdd={onAdd} onCancel={()=>setAdding(false)}/>
      :<button onClick={()=>setAdding(true)} style={{...VBtn.secondary,marginTop:10,fontSize:12}}>+ Add milestone</button>}
  </div>;
}

function CycleContractCard({cy,isActive,defaultTake,onUpdate,onDelete}){
  const [open,setOpen]=useState(isActive||false);
  const [editMode,setEditMode]=useState(false);
  const gmvActual=cy.gmvActual||0;
  const gmvProj=cy.gmvProjected||0;
  const take=cy.netTakePct||defaultTake||10;
  const cyFees=gmvActual*take/100;
  const pct=gmvProj>0?Math.round(100*gmvActual/gmvProj):0;
  return <div style={{border:`1px solid ${isActive?T.purple:S.border}`,borderRadius:8,marginBottom:10,overflow:"hidden",background:"#fff"}}>
    {/* Header row — always visible, click to expand */}
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer",background:isActive?"#FAFAFF":"#fff"}} onClick={()=>setOpen(!open)}>
      <span style={{fontSize:11,color:S.inactiveText,transform:open?"rotate(90deg)":"none",transition:"transform .15s",display:"inline-block"}}>›</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:13,fontWeight:600,color:T.ink}}>{cy.label||"Contract"}</span>
          {isActive&&<Tag label="Active" c={T.purple} s={T.purpleSoft}/>}
          {!isActive&&<Tag label="Completed" c={S.inactiveText} s="#F3F4F6"/>}
          {cy.type==="renewal"&&<Tag label="Renewal" c={T.green} s={T.greenSoft}/>}
          {cy.type==="amendment"&&<Tag label="Amendment" c={T.yellow} s={T.yellowSoft}/>}
        </div>
        <div style={{fontSize:12,color:S.inactiveText,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {cy.start||"—"}{cy.end?` → ${cy.end}`:""} · {fmt(gmvActual)} realized · {fmt(cyFees)} fees
        </div>
      </div>
      {gmvProj>0&&<span style={{fontSize:12,fontWeight:600,color:pct>=80?T.green:pct>=50?T.yellow:T.red,flexShrink:0}}>{pct}% of plan</span>}
    </div>

    {/* Expanded panel */}
    {open&&<div style={{borderTop:`1px solid ${S.border}`}}>
      {/* Quick GMV edit row */}
      {editMode
        ?<div style={{padding:"14px 16px",background:"#F9FAFB",borderBottom:`1px solid ${S.border}`}}>
          <div style={{fontSize:11,fontWeight:600,color:T.ink,marginBottom:10,textTransform:"uppercase",letterSpacing:.4}}>Quick edit</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
            {[["GMV realized ($)","gmvActual","number",gmvActual],["GMV projected ($)","gmvProjected","number",gmvProj],["Net take %","netTakePct","number",take]].map(([l,k,t2,v])=>(
              <div key={k}>
                <label style={{fontSize:10.5,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.3,display:"block",marginBottom:4}}>{l}</label>
                <input type={t2} value={v} onChange={e=>onUpdate({[k]:+e.target.value})} style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",boxSizing:"border-box",background:"#fff"}}/>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            {[["Label","label","text",cy.label||""],["Start","start","text",cy.start||""],["End","end","text",cy.end||""],["Payment","paymentTerms","text",cy.paymentTerms||""]].map(([l,k,t2,v])=>(
              <div key={k}>
                <label style={{fontSize:10.5,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.3,display:"block",marginBottom:4}}>{l}</label>
                <input type={t2} value={v} onChange={e=>onUpdate({[k]:e.target.value})} style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",boxSizing:"border-box",background:"#fff"}}/>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button onClick={()=>setEditMode(false)} style={{...VBtn.secondary,fontSize:12}}>Done</button>
          </div>
        </div>
        :<div style={{padding:"12px 16px",background:"#F9FAFB",borderBottom:`1px solid ${S.border}`,display:"flex",gap:10}}>
          <div style={{fontSize:13,color:S.inactiveText,flex:1}}>
            Fees: <b style={{color:T.ink}}>{fmt(cyFees)}</b>
            {gmvProj>0&&<span> · {pct}% of {fmtK(gmvProj)} plan</span>}
            {take!==defaultTake&&<span style={{color:T.purple}}> · {take}% take</span>}
          </div>
          <button onClick={e=>{e.stopPropagation();setEditMode(true);}} style={{...VBtn.small,fontSize:11}}>Quick edit</button>
          <button onClick={e=>{e.stopPropagation();onDelete();}} style={{...VBtn.small,fontSize:11,color:T.red,borderColor:T.redSoft}}>Delete</button>
        </div>
      }

      {/* Contract terms table */}
      <div style={{background:"#fff"}}>
        {[
          ["Period",`${cy.start||"—"}${cy.end?` → ${cy.end}`:""}`],
          ["GMV realized",fmtK(gmvActual)],
          ["GMV projected",gmvProj?fmtK(gmvProj):"—"],
          ["Net take",take+"%"],
          ["Projected fees",fmt(gmvProj*take/100)],
          ["Payment terms",cy.paymentTerms||"—"],
          ["Liability cap",cy.liabilityCapNA?"Not required":cy.liabilityCap?fmt(cy.liabilityCap):"⚠ Uncapped"],
          ["SLA target",cy.slaNA?"Not required":cy.slaTarget?cy.slaTarget+"%":"—"],
          ["Data rights",cy.dataRights||"—"],
          ["Termination",cy.terminationNotice||"—"],
          ["Auto-renew",cy.autoRenew?"Yes":"No"],
          cy.notes&&["Notes",cy.notes],
        ].filter(Boolean).map(([k,v2],i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:`1px solid ${S.border}`}}>
            <span style={{fontSize:13,color:S.inactiveText}}>{k}</span>
            <span style={{fontSize:13,fontWeight:500,color:String(v2).startsWith("⚠")?T.red:T.ink,maxWidth:"60%",textAlign:"right"}}>{v2}</span>
          </div>
        ))}
        {cy.products?.length>0&&<div style={{padding:"10px 16px",borderTop:`1px solid ${S.border}`,display:"flex",gap:6,flexWrap:"wrap"}}>
          {cy.products.map(p=><Tag key={p} label={p} c={T.purple} s={T.purpleSoft}/>)}
        </div>}
      </div>
    </div>}
  </div>;
}

function StripeDetail({a, tab, onTabChange, onBack, onEdit, onNewContract, onDelete, onSave}){
  const [mobile,setMobile]=useState(()=>typeof window!=='undefined'&&window.innerWidth<768);
  useEffect(()=>{const fn=()=>setMobile(window.innerWidth<768);window.addEventListener('resize',fn);return()=>window.removeEventListener('resize',fn);},[]);
  const [costs,setCosts]=useState(a.costs||[]);
  const [milestones,setMilestones]=useState(a.milestones||[]);
  const [eco,setEco]=useState(a.contract||{});
  const [addingCost,setAddingCost]=useState(false);
  const [cycles,setCycles]=useState(a.cycles||[]);
  // Sync cycles when parent account updates (e.g. after wizard creates new cycle)
  useEffect(()=>{ setCycles(a.cycles||[]); },[a.cycles]);
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
            <button onClick={onBack} style={{background:"none",border:"none",color:T.purple,cursor:"pointer",fontFamily:sans,fontSize:13,fontWeight:500,padding:0,display:"flex",alignItems:"center",gap:4}}>← Accounts</button>
          </div>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
                <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-.3,margin:0,color:T.ink}}>{a.account}</h1>
                <Tag label={h.label} c={h.c} s={h.soft}/>
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
              <button onClick={onNewContract} style={{...VBtn.primary,fontSize:12}}>+ Contract</button>
        <button onClick={onEdit} style={{...VBtn.secondary,fontSize:12}}>Edit</button>
              <button onClick={onDelete} style={{...VBtn.danger,fontSize:12}}>Delete</button>
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
            <CollapsibleSection title="Account lifecycle" defaultOpen={true}
              onAdd={()=>addMilestone({id:uid(),type:"review",date:new Date().toISOString().slice(0,10),title:"",note:"",done:false})}
              addLabel="+ Add milestone">
              <AccountTimeline milestones={milestones} onAdd={addMilestone} onToggle={toggleMilestone} onDelete={delMilestone}/>
            </CollapsibleSection>

            <CollapsibleSection title="Contract cycles" defaultOpen={true}
              badge={cycles.length||null}
              onAdd={()=>addContractCycle({id:uid(),label:"New cycle "+new Date().getFullYear(),start:"",end:"",products:a.products||[],events:[],note:"",active:true,gmvActual:0,gmvProjected:0,netTakePct:eco.netTakePct||10})}
              addLabel="+ New cycle" onHeaderClick={onNewContract}>
              <ContractCycles cycles={cycles} currentProducts={a.products||[]} onAdd={addContractCycle} onUpdate={updateContractCycle} onDelete={delContractCycle}/>
              <button onClick={()=>onTabChange("contract")} style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:8,fontSize:12,color:T.purple,background:"none",border:`1px solid ${T.purpleBar}`,borderRadius:6,padding:"5px 12px",cursor:"pointer",fontFamily:sans,fontWeight:500}}>↑ Import contract terms →</button>
            </CollapsibleSection>

            <CollapsibleSection title="Chargebacks" defaultOpen={true}
              badge={chargebacks.filter(c=>c.status==="Open").length||null}
              badgeColor={T.red} badgeBg={T.redSoft}
              onAdd={()=>addChargeback({id:uid(),amount:0,reason:"",status:"Open",date:new Date().toISOString().slice(0,10),disputedBy:"",note:""})}
              addLabel="+ Add">
              {chargebacks.length===0
                ?<div style={{fontSize:13,color:S.inactiveText,padding:"4px 0 8px"}}>No chargebacks logged.</div>
                :chargebacks.map(cb=><ChargebackRow key={cb.id} cb={cb} onUpdate={p=>updateChargeback(cb.id,p)} onDelete={()=>delChargeback(cb.id)}/>)}
            </CollapsibleSection>

            <CollapsibleSection title="Feature tracker" defaultOpen={true}
              badge={features.filter(f=>f.scope==="out-of-scope"||f.scope==="oos").length?`${features.filter(f=>f.scope==="out-of-scope"||f.scope==="oos").length} OOS`:null}
              badgeColor={T.red} badgeBg={T.redSoft}
              onAdd={()=>addFeature({id:uid(),name:"",status:"Scoped",scope:"contract",note:""})}
              addLabel="+ Add">
              <FeatureTracker features={features} onUpdate={updateFeature} onDelete={delFeature}/>
            </CollapsibleSection>
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
            {/* Header row */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:3}}>Contracts</div>
                <div style={{fontSize:13,color:S.inactiveText}}>{cycles.length} cycle{cycles.length!==1?"s":""} · {cycles.filter(c=>c.active).length} active</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={onNewContract} style={{...VBtn.primary,fontSize:13}}>+ New contract</button>
              </div>
            </div>

            {/* Contract cycle cards — newest first, same design as before but with delete + terms */}
            {cycles.length===0&&<div style={{padding:"32px",textAlign:"center",border:`1px dashed ${S.border}`,borderRadius:8,color:S.inactiveText,marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:500,color:T.ink,marginBottom:6}}>No contracts yet</div>
              <div style={{fontSize:13,marginBottom:16}}>Add your first contract to start tracking GMV, fees, and compliance.</div>
              <button onClick={onNewContract} style={{...VBtn.secondary,fontSize:13}}>+ Add first contract →</button>
            </div>}

            {[...cycles].sort((x,y)=>new Date(y.start||0)-new Date(x.start||0)).map((cy)=>{
              const isActive=cy.active;
              return <CycleContractCard key={cy.id} cy={cy} isActive={isActive}
                defaultTake={eco.netTakePct||10}
                onUpdate={p=>{const updated=cycles.map(x=>x.id===cy.id?{...x,...p}:x);setCycles(updated);save({cycles:updated});}}
                onDelete={()=>{
                  if(!window.confirm(`Delete "${cy.label||"this contract"}"? This cannot be undone.`))return;
                  const updated=cycles.filter(x=>x.id!==cy.id);
                  setCycles(updated);
                  save({cycles:updated});
                }}
              />;
            })}

            {/* Import from contract doc */}
            <div style={{marginTop:16}}>
              <CollapsibleSection title="Import contract terms" defaultOpen={false}>
                <div style={{marginTop:8}}>
                  <ContractImport onImport={parsed=>{const n={...eco,...parsed};setEco(n);save({contract:n});setToast("Imported ✓");setTimeout(()=>setToast(null),2000);}}/>
                </div>
              </CollapsibleSection>
            </div>

            {(a.dismissed_signals||[]).length>0&&<div style={{marginTop:12}}>
              <CollapsibleSection title="Dismissed signals" defaultOpen={false}>
                <div style={{border:`1px solid ${S.border}`,borderRadius:8,overflow:"hidden",marginTop:8}}>
                  {a.dismissed_signals.map((s,i)=>(
                    <div key={s.id} style={{padding:"12px 16px",borderTop:i?`1px solid ${S.border}`:"none"}}>
                      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:500,color:S.inactiveText}}>{s.kind}</span><span style={{fontSize:11.5,color:S.labelText}}>{s.dismissedAt}</span></div>
                      <div style={{fontSize:12,color:S.labelText,marginTop:2,lineHeight:1.45}}>{s.text}</div>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            </div>}
          </>}

        </div>
      </div>

      {/* RIGHT SIDEBAR — hidden on mobile, shown inline below tabs */}
      {!mobile&&<div style={{width:280,flexShrink:0,borderLeft:`1px solid ${S.border}`,overflow:"auto",background:"#fff",padding:"24px 20px"}}>
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
            <div style={{fontSize:11,fontWeight:500,color:S.labelText,marginBottom:3,textTransform:"uppercase",letterSpacing:.4}}>{k}</div>
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
              <div style={{fontSize:11,fontWeight:500,color:S.labelText,marginBottom:3,textTransform:"uppercase",letterSpacing:.4}}>{k}</div>
              <div style={{fontSize:13,fontWeight:600,color:flag?T.red:T.ink}}>{v2}{flag&&<span style={{fontSize:10,marginLeft:4}}>▲</span>}</div>
            </div>
          ))}
        </>}
        <div style={{borderTop:`1px solid ${S.border}`,margin:"16px 0"}}/>
        <p style={{fontSize:11,color:S.labelText,lineHeight:1.6,margin:0}}>Internal gut-check, not legal advice. Hand disputes to counsel.</p>
        <div style={{borderTop:`1px solid ${S.border}`,margin:"16px 0"}}/>
        <button onClick={()=>{onSave({...a,health:a.health==="archived"?"green":"archived"});onBack();}} style={{...VBtn.small,width:"100%",justifyContent:"center",color:a.health==="archived"?T.green:S.inactiveText,borderColor:S.border}}>
          {a.health==="archived"?"↩ Restore to active":"Archive this account"}
        </button>
        {(a.kpis?.daysSinceContact||0)>=90&&a.health!=="archived"&&<div style={{fontSize:11,color:"#B45309",marginTop:8,lineHeight:1.5,textAlign:"center"}}>⏱ {a.kpis.daysSinceContact} days since last contact — consider archiving</div>}
      </div>}

      {/* Toast */}
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:T.ink,color:"#fff",padding:"9px 18px",borderRadius:6,fontSize:13,fontWeight:600,zIndex:999,boxShadow:"0 4px 20px rgba(0,0,0,.18)"}}>{toast}</div>}
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

function ContractCycles({cycles=[],currentProducts=[],onAdd,onUpdate,onDelete}){
  const [adding,setAdding]=useState(false);
  const sorted=[...cycles].sort((a,b)=>new Date(a.start||0)-new Date(b.start||0));
  return <div>
    {sorted.length===0&&<div style={{fontSize:13,color:S.inactiveText,padding:"8px 0 4px"}}>No cycles yet.</div>}
    {sorted.map((cy,i)=><CycleCard key={cy.id} cy={cy} index={i} onUpdate={p=>onUpdate(cy.id,p)} onDelete={()=>onDelete(cy.id)}/>)}
    {adding
      ?<NewCycleForm products={currentProducts} onSave={cy=>{onAdd(cy);setAdding(false);}} onCancel={()=>setAdding(false)}/>
      :<button onClick={()=>setAdding(true)} style={{...VBtn.secondary,marginTop:8,fontSize:12}}>+ Add cycle / renewal</button>}
  </div>;
}
function CycleCard({cy,index,onUpdate,onDelete}){
  const [open,setOpen]=useState(false);
  return <div style={{borderTop:`1px solid ${S.border}`,padding:"12px 0"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setOpen(!open)}>
      <span style={{fontSize:11,color:S.inactiveText,transform:open?"rotate(90deg)":"none",transition:"transform .15s",display:"inline-block"}}>›</span>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:13,fontWeight:500,color:T.ink}}>{cy.label||`Cycle ${index+1}`}</span>
          {cy.active&&<Tag label="Active" c={T.purple} s={T.purpleSoft}/>}
        </div>
        <div style={{fontSize:12,color:S.inactiveText,marginTop:1}}>{cy.start||"—"}{cy.end?` → ${cy.end}`:""}{cy.products?.length?` · ${cy.products.join(", ")}`:""}</div>
      </div>
      <button onClick={e=>{e.stopPropagation();onDelete();}} style={{background:"none",border:"none",color:"#D1D5DB",cursor:"pointer",fontSize:16,padding:"0 4px"}}>×</button>
    </div>
    {open&&<div style={{marginTop:10,padding:"14px",background:"#F9FAFB",border:`1px solid ${S.border}`,borderRadius:8}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        <div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:4}}>Label</label><input value={cy.label||""} onChange={e=>onUpdate({label:e.target.value})} style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/></div>
        <div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:4}}>Start → End</label><div style={{display:"flex",gap:6}}><input value={cy.start||""} onChange={e=>onUpdate({start:e.target.value})} placeholder="May 2026" style={{flex:1,padding:"7px 8px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:12,fontFamily:sans,outline:"none"}}/><input value={cy.end||""} onChange={e=>onUpdate({end:e.target.value})} placeholder="Jul 2026" style={{flex:1,padding:"7px 8px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:12,fontFamily:sans,outline:"none"}}/></div></div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <label style={{fontSize:12,color:T.ink,display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}><input type="checkbox" checked={!!cy.active} onChange={e=>onUpdate({active:e.target.checked})} style={{cursor:"pointer"}}/>Active cycle</label>
        <button onClick={onDelete} style={{...VBtn.secondary,fontSize:12,color:T.red,borderColor:T.redSoft,marginLeft:"auto"}}>Delete</button>
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
// ── CHARGEBACK ROW — scan row first, expand to edit ──
function ChargebackRow({cb,onUpdate,onDelete}){
  const [open,setOpen]=useState(false);
  const SC={"Open":{c:T.red,s:T.redSoft},"Resolved — won":{c:T.green,s:T.greenSoft},"Resolved — lost":{c:S.inactiveText,s:"#F3F4F6"},"Disputed":{c:T.yellow,s:T.yellowSoft}};
  const sc=SC[cb.status]||SC["Open"];
  return <div style={{borderTop:HD,padding:"12px 0"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setOpen(!open)}>
      <span style={{fontSize:11,color:S.inactiveText,transform:open?"rotate(90deg)":"none",transition:"transform .15s",display:"inline-block",lineHeight:1}}>›</span>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:13,fontWeight:500,color:T.ink}}>{cb.disputedBy||"Unnamed"}</span>
          <Tag label={cb.status} c={sc.c} s={sc.s}/>
          {cb.amount>0&&<span style={{fontSize:12,color:S.inactiveText}}>{fmt(cb.amount)}</span>}
        </div>
        <div style={{fontSize:12,color:S.inactiveText,marginTop:1}}>{cb.date}{cb.reason?` · ${cb.reason}`:""}</div>
      </div>
      <button onClick={e=>{e.stopPropagation();onDelete();}} style={{background:"none",border:"none",color:"#D1D5DB",cursor:"pointer",fontSize:16,padding:"0 4px",lineHeight:1}}>x</button>
    </div>
    {open&&<div style={{marginTop:10,padding:"14px",background:"#F9FAFB",border:`1px solid ${S.border}`,borderRadius:8}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
        {[["Disputed by","text",cb.disputedBy||"","disputedBy"],["Amount ($)","number",cb.amount||0,"amount"],["Date","text",cb.date||"","date"]].map(([lbl,tp,val,key])=>(
          <div key={key}><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:4}}>{lbl}</label>
          <input type={tp} value={val} onChange={e=>onUpdate({[key]:tp==="number"?+e.target.value:e.target.value})} style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/></div>
        ))}
      </div>
      <div style={{marginBottom:10}}><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:4}}>Reason</label>
        <input value={cb.reason||""} onChange={e=>onUpdate({reason:e.target.value})} style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/></div>
      <div style={{marginBottom:12}}><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:4}}>Notes</label>
        <textarea value={cb.note||""} onChange={e=>onUpdate({note:e.target.value})} style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",resize:"none",minHeight:48,boxSizing:"border-box"}}/></div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {CHARGEBACK_STATUS.map(s=>{const sc2=SC[s]||SC["Open"]; return <button key={s} onClick={()=>onUpdate({status:s})} style={{...VBtn.small,border:`1px solid ${cb.status===s?sc2.c:S.border}`,background:cb.status===s?sc2.s:"#fff",color:cb.status===s?sc2.c:S.inactiveText,fontSize:11}}>{s}</button>;})}
      </div>
    </div>}
  </div>;
}

// ── FEATURE TRACKER — scan-first rows, expand to edit ──
const FEATURE_SCOPE_C={contract:{c:T.blue,l:"Contract"},future:{c:T.purple,l:"Future cycle"},"out-of-scope":{c:T.red,l:"Out of scope"}};
function FeatureTracker({features=[],onUpdate,onDelete}){
  const groups={"contract":[],"future":[],"out-of-scope":[]};
  features.forEach(f=>{const k=f.scope==="oos"?"out-of-scope":(f.scope||"contract");(groups[k]=groups[k]||[]).push(f);});
  return <div>{Object.entries(groups).filter(([,fs])=>fs.length>0).map(([scope,fs])=>{
    const sc=FEATURE_SCOPE_C[scope]||FEATURE_SCOPE_C.contract;
    return <div key={scope} style={{marginBottom:4}}>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:sc.c,padding:"8px 0 4px"}}>{sc.l} ({fs.length})</div>
      {fs.map(f=><FeatureRow key={f.id} f={f} onUpdate={p=>onUpdate(f.id,p)} onDelete={()=>onDelete(f.id)}/>)}
    </div>;})}
  </div>;
}
function FeatureRow({f,onUpdate,onDelete}){
  const [open,setOpen]=useState(!f.name);
  const stIdx=FEATURE_STATUS.indexOf(f.status);
  const stCol=stIdx===0?T.sub:stIdx===1?T.blue:stIdx===2?T.green:stIdx===3?T.yellow:T.red;
  const isOos=f.scope==="out-of-scope"||f.scope==="oos";
  const SCOPES=[["contract","Contract"],["future","Future cycle"],["out-of-scope","Out of scope"]];
  return <div style={{borderTop:HD,padding:"10px 0"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setOpen(!open)}>
      <span style={{fontSize:11,color:S.inactiveText,transform:open?"rotate(90deg)":"none",transition:"transform .15s",display:"inline-block",lineHeight:1}}>›</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:13,fontWeight:500,color:f.name?T.ink:S.inactiveText,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name||"Unnamed feature"}</span>
          <Tag label={f.status||"Scoped"} c={stCol} s={stCol+"14"}/>
          {isOos&&<Tag label="OOS" c={T.red} s={T.redSoft}/>}
        </div>
        {f.note&&<div style={{fontSize:12,color:S.inactiveText,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.note}</div>}
      </div>
      <button onClick={e=>{e.stopPropagation();onDelete();}} style={{background:"none",border:"none",color:"#D1D5DB",cursor:"pointer",fontSize:16,padding:"0 4px",lineHeight:1}}>x</button>
    </div>
    {open&&<div style={{marginTop:10,padding:"14px",background:"#F9FAFB",border:`1px solid ${isOos?T.redSoft:S.border}`,borderRadius:8}}>
      {isOos&&<div style={{fontSize:12,color:T.red,marginBottom:10,lineHeight:1.5}}>Out of scope — not covered by the signed contract. Resolve before next cycle.</div>}
      <div style={{marginBottom:10}}><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:4}}>Feature name</label>
        <input value={f.name||""} onChange={e=>onUpdate({name:e.target.value})} placeholder="e.g. Per-pier GMV report" style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/></div>
      <div style={{marginBottom:12}}><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:4}}>Notes</label>
        <textarea value={f.note||""} onChange={e=>onUpdate({note:e.target.value})} style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",resize:"none",minHeight:48,boxSizing:"border-box"}}/></div>
      {isOos&&<div style={{marginBottom:12}}><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:4}}>Resolution</label>
        <select value={f.scopeResolution||""} onChange={e=>onUpdate({scopeResolution:e.target.value})} style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",background:"#fff"}}>
          <option value="">Select resolution</option>
          <option value="absorb">We absorbed it</option>
          <option value="charge">Bill the client</option>
          <option value="add_to_contract">Add to next cycle</option>
          <option value="scope_change">Raise scope change request</option>
          <option value="remove">Stop this work</option>
        </select></div>}
      <div style={{marginBottom:10}}>
        <label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:6}}>Status</label>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{FEATURE_STATUS.map(s=>{const i2=FEATURE_STATUS.indexOf(s);const c2=i2===0?T.sub:i2===1?T.blue:i2===2?T.green:i2===3?T.yellow:T.red; return <button key={s} onClick={()=>onUpdate({status:s})} style={{...VBtn.small,border:`1px solid ${f.status===s?c2:S.border}`,background:f.status===s?c2+"14":"#fff",color:f.status===s?c2:S.inactiveText,fontSize:11}}>{s}</button>;})}
        </div>
      </div>
      <div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:6}}>Scope</label>
        <div style={{display:"flex",gap:5}}>{SCOPES.map(([s,l])=>{const sc2=FEATURE_SCOPE_C[s]||FEATURE_SCOPE_C.contract;const on=f.scope===s||(s==="out-of-scope"&&f.scope==="oos"); return <button key={s} onClick={()=>onUpdate({scope:s})} style={{...VBtn.small,border:`1px solid ${on?sc2.c:S.border}`,background:on?sc2.c+"14":"#fff",color:on?sc2.c:S.inactiveText,fontSize:11}}>{l}</button>;})}
        </div>
      </div>
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

function ContractHealthRing({eco={},costs=[],obligations=[],chargebacks=[],kpis={},risks=[]}){
  const gmvScore=eco.gmvProjected>0?Math.min(100,Math.round(100*(eco.gmvActual||0)/eco.gmvProjected)):0;
  const fees=(eco.gmvActual||0)*(eco.netTakePct||0)/100;
  const tc=costs.reduce((n,c)=>n+(c.computed||0),0);
  const roiScore=tc>0?Math.min(100,Math.round(100*fees/tc)):fees>0?100:50;
  const oblScore=obligations.length?Math.round(100*obligations.filter(o=>o.status==="met").length/obligations.length):0;
  const openCbs=chargebacks.filter(c=>c.status==="Open").length;
  const cbScore=Math.max(0,100-openCbs*40);
  const sentMap={Active:100,Contained:85,Watch:50,Cold:10,Negative:20};
  const sentScore=sentMap[kpis.sentiment]||60;
  const overall=Math.round((gmvScore+roiScore+oblScore+cbScore+sentScore)/5);
  const overallC=overall>=70?T.green:overall>=40?T.yellow:T.red;
  const dims=[
    {label:"GMV progress",score:gmvScore,c:"#6C5FE0",sub:`${fmt(eco.gmvActual||0)} of ${fmt(eco.gmvProjected||0)}`},
    {label:"ROI efficiency",score:roiScore,c:"#4C8DD6",sub:`${fmt(fees)} rev · ${fmt(tc)} cost`},
    {label:"Obligations",score:oblScore,c:T.green,sub:`${obligations.filter(o=>o.status==="met").length} of ${obligations.length} met`},
    {label:"Chargebacks",score:cbScore,c:cbScore>=70?T.green:T.red,sub:openCbs===0?"None open":`${openCbs} open`},
    {label:"Sentiment",score:sentScore,c:sentScore>=70?T.green:sentScore>=40?T.yellow:T.red,sub:kpis.sentiment||"Unknown"},
  ];
  return <div style={{border:`1px solid ${S.border}`,borderRadius:8,padding:"20px",marginBottom:24}}>
    <div style={{fontSize:10.5,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:4}}>AI Assessed</div>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
      <span style={{fontSize:28,fontWeight:700,color:overallC,letterSpacing:-1}}>{overall}</span>
      <div><div style={{fontSize:15,fontWeight:600,color:T.ink}}>Contract Health</div><div style={{fontSize:12,color:S.inactiveText}}>{overall>=70?"Strong":overall>=40?"Watch":"At risk"}</div></div>
    </div>
    <div style={{display:"grid",gap:1,border:`1px solid ${S.border}`,borderRadius:6,overflow:"hidden"}}>
      {dims.map((d,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:16,padding:"10px 14px",background:i%2?"#FAFAFA":"#fff"}}>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:T.ink}}>{d.label}</div><div style={{fontSize:11.5,color:S.inactiveText,marginTop:1}}>{d.sub}</div></div>
          <div style={{width:80,height:4,background:"#EBEBED",borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:d.score+"%",background:d.c,borderRadius:2}}/></div>
          <span style={{fontSize:13,fontWeight:700,color:d.c,minWidth:28,textAlign:"right"}}>{d.score}</span>
        </div>
      ))}
    </div>
  </div>;
}

// ── AGENT PAGE ──
// Two states: (1) integration hub when nothing connected, (2) digest output after pull
// Connectors: Gmail, iMessage, Instantly, Expandi, Capsule CRM
const CONNECTORS = [
  {
    id:"gmail", label:"Gmail", icon:"✉", category:"Email",
    description:"Scans client email threads for signals, scope changes, and sentiment shifts.",
    what:"Email threads, reply sentiment, attachment mentions",
    status:"disconnected",
    color:"#EA4335",
  },
  {
    id:"imessage", label:"iMessage", icon:"💬", category:"Messages",
    description:"Reads your iMessage threads with clients. Requires Full Disk Access on Mac.",
    what:"Text threads, informal promises, out-of-scope requests",
    status:"disconnected",
    color:"#34C759",
  },
  {
    id:"instantly", label:"Instantly", icon:"⚡", category:"Outbound",
    description:"Ingests sequence replies and open rates from your outbound campaigns.",
    what:"Reply rates, interested signals, bounce/unsubscribe data",
    status:"disconnected",
    color:"#F59E0B",
  },
  {
    id:"expandi", label:"Expandi", icon:"🔗", category:"Outbound",
    description:"Pulls LinkedIn outreach replies and connection signals into account context.",
    what:"LinkedIn replies, connection acceptance, profile views",
    status:"disconnected",
    color:"#0077B5",
  },
  {
    id:"capsule", label:"Capsule CRM", icon:"◎", category:"CRM",
    description:"Syncs deal stage, contact notes, and pipeline value from your Capsule account.",
    what:"Deal stage, contact activity, opportunity value",
    status:"disconnected",
    color:"#6C5FE0",
  },
  {
    id:"discord", label:"Discord", icon:"◈", category:"Internal",
    description:"Monitors your team Discord server for account mentions, deal updates, and internal signals.",
    what:"Channel mentions, deal discussions, team updates",
    status:"coming_soon",
    color:"#5865F2",
  },
];

// ── FINANCE PAGE ──
const CHART_BLUE="#0070F3";
const CHART_BLUE_SOFT="rgba(0,112,243,0.08)";

// Simple SVG area chart — Vercel analytics style
function AreaChart({data=[],height=120,color=CHART_BLUE}){
  if(!data.length) return null;
  const max=Math.max(...data.map(d=>d.v),1);
  const W=500,H=height;
  const pts=data.map((d,i)=>({x:(i/(data.length-1||1))*W,y:H-(d.v/max)*(H-8)}));
  const pathD=pts.map((p,i)=>i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`).join(" ");
  const fillD=pathD+` L${W},${H} L0,${H} Z`;
  return <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height,display:"block"}}>
    <defs>
      <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={0.18}/>
        <stop offset="100%" stopColor={color} stopOpacity={0}/>
      </linearGradient>
    </defs>
    <path d={fillD} fill="url(#fg)"/>
    <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    {pts.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="3" fill={color} opacity="0"/>)}
  </svg>;
}

function MiniBar({value,max,color}){
  const pct=max>0?Math.min(100,Math.round(100*value/max)):0;
  return <div style={{width:"100%",height:3,background:"#F3F4F6",borderRadius:2,overflow:"hidden",marginTop:6}}>
    <div style={{height:"100%",width:pct+"%",background:color||CHART_BLUE,borderRadius:2}}/>
  </div>;
}

function ChangeTag({value,isPositiveGood=true}){
  if(!value&&value!==0) return null;
  const pos=value>=0;
  const good=isPositiveGood?pos:!pos;
  return <span style={{fontSize:11,fontWeight:600,padding:"2px 6px",borderRadius:4,background:good?"#DCFCE7":T.redSoft,color:good?T.green:T.red}}>{pos?"+":""}{value.toFixed(1)}%</span>;
}

function FinancePage({activeAccts,orgAccts,gmvActual,gmvProj,feesEarned,feesContracted,feesMissed,totalCosts,netRev,netRevContracted,historicalGmv,historicalFees,allHistorical,pipelinePct}){
  const [isMobile,setIsMobile]=useState(()=>typeof window!=='undefined'&&window.innerWidth<768);
  useEffect(()=>{const fn=()=>setIsMobile(window.innerWidth<768);window.addEventListener('resize',fn);return()=>window.removeEventListener('resize',fn);},[]);
  const [view,setView]=useState("overview");

  // Scenario builder state — one entry per account + potential new clients
  const TIER_CONFIDENCE={active:90,watch:60,cold:15,prospect:10};
  const [scenarios,setScenarios]=useState(()=>
    activeAccts.filter(a=>a.contract?.gmvProjected>0).map(a=>({
      id:a.id, name:a.account, short:a.short, logo:a.logo,
      gmv:a.contract?.gmvProjected||0,
      take:a.contract?.netTakePct||10,
      confidence:TIER_CONFIDENCE[a.tier]||60,
      status:"renewing", // renewing | churning | expanding
      tier:a.tier,
    }))
  );
  const [newClients,setNewClients]=useState([]);
  const [newClientForm,setNewClientForm]=useState(false);
  const [nc,setNc]=useState({name:"",gmv:0,take:10,confidence:50});

  function addNewClient(){
    if(!nc.name||!nc.gmv) return;
    setNewClients(p=>[...p,{id:"nc_"+uid(),name:nc.name,short:nc.name.slice(0,2).toUpperCase(),logo:"#888",gmv:nc.gmv,take:nc.take,confidence:nc.confidence,status:"renewing",tier:"prospect"}]);
    setNc({name:"",gmv:0,take:10,confidence:50});
    setNewClientForm(false);
  }

  const allScenarios=[...scenarios,...newClients];
  const scenarioRevenue=allScenarios.filter(s=>s.status!=="churning").reduce((n,s)=>n+(s.gmv*(s.take/100)*(s.confidence/100)),0);
  const scenarioGmv=allScenarios.filter(s=>s.status!=="churning").reduce((n,s)=>n+(s.gmv*(s.confidence/100)),0);
  const scenarioFees=scenarioRevenue;
  const scenarioNet=scenarioFees-totalCosts;

  // ── CHART TIME RANGE ENGINE ──
  const TIME_RANGES=[
    {id:"1d",   label:"Daily",         days:1},
    {id:"7d",   label:"Weekly",        days:7},
    {id:"4w",   label:"Last 4 weeks",  days:28},
    {id:"mtd",  label:"Month to date", days:null,mode:"mtd"},
    {id:"1m",   label:"Monthly",       days:30},
    {id:"qtd",  label:"Quarter to date",days:null,mode:"qtd"},
    {id:"6m",   label:"Last 6 months", days:180},
    {id:"ytd",  label:"Year to date",  days:null,mode:"ytd"},
    {id:"all",  label:"All time",      days:null,mode:"all"},
  ];
  const [chartRange,setChartRange]=useState("all");
  const [chartMetric,setChartMetric]=useState("fees"); // fees | gmv

  // Build all cycle data points — distribute GMV linearly across each cycle period
  const allCycleData=(()=>{
    const allCycles=[
      ...orgAccts.flatMap(a=>[
        ...(a.cycles||[]).map(c=>({...c,acct:a.account,take:c.netTakePct||a.contract?.netTakePct||10})),
        // Also treat the master contract as a data point if no cycles
        ...((a.cycles||[]).length===0&&a.contract?[{
          id:"master_"+a.id,label:a.account,
          start:a.contract.start,end:a.contract.end||new Date().toISOString().slice(0,7),
          gmvActual:a.contract.gmvActual||0,gmvProjected:a.contract.gmvProjected||0,
          take:a.contract.netTakePct||10,acct:a.account,active:true,
        }]:[])
      ])
    ].filter(c=>(c.gmvActual||c.gmvProjected||0)>0&&c.start);

    // Parse YYYY-MM string to Date
    // Parse both "YYYY-MM" and "Jan 2026" / "May 2026" formats
    const MONTHS={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
    function parseMonth(s){
      if(!s) return null;
      s=s.trim();
      // YYYY-MM format
      if(/^\d{4}-\d{2}$/.test(s)){const[y,m]=s.split("-");return new Date(+y,+m-1,1);}
      // "Jan 2026" or "January 2026" format
      const parts=s.split(/\s+/);
      if(parts.length===2){
        const mIdx=MONTHS[parts[0].slice(0,3).toLowerCase()];
        const yr=+parts[1];
        if(mIdx!==undefined&&yr>2000) return new Date(yr,mIdx,1);
      }
      // Try Date parse as fallback
      const d=new Date(s);
      return isNaN(d)?null:d;
    }

    // Generate monthly data points from each cycle
    const pts=[];
    allCycles.forEach(c=>{
      const start=parseMonth(c.start);
      const endRaw=c.end?parseMonth(c.end):new Date();
      if(!start||!endRaw) return;
      const months=Math.max(1,Math.round((endRaw-start)/(1000*60*60*24*30)));
      const gmvPerMonth=(c.gmvActual||c.gmvProjected||0)/months;
      const feesPerMonth=gmvPerMonth*(c.take/100);
      for(let i=0;i<months;i++){
        const d=new Date(start);
        d.setMonth(d.getMonth()+i);
        pts.push({
          date:d,
          year:d.getFullYear(),
          month:d.getMonth(),
          key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`,
          label:d.toLocaleDateString("en-US",{month:"short",year:"2-digit"}),
          gmv:gmvPerMonth,
          fees:feesPerMonth,
          acct:c.acct,
          active:c.active,
        });
      }
    });
    return pts.sort((a,b)=>a.date-b.date);
  })();

  // Filter and aggregate by time range
  const chartData=(()=>{
    const now=new Date();
    const range=TIME_RANGES.find(r=>r.id===chartRange)||TIME_RANGES[TIME_RANGES.length-1];
    let filtered=allCycleData;

    if(range.mode==="mtd"){
      filtered=allCycleData.filter(p=>p.year===now.getFullYear()&&p.month===now.getMonth());
    } else if(range.mode==="qtd"){
      const q=Math.floor(now.getMonth()/3);
      filtered=allCycleData.filter(p=>p.year===now.getFullYear()&&Math.floor(p.month/3)===q);
    } else if(range.mode==="ytd"){
      filtered=allCycleData.filter(p=>p.year===now.getFullYear());
    } else if(range.mode==="all"){
      filtered=allCycleData;
    } else if(range.days){
      const cutoff=new Date(now-range.days*24*60*60*1000);
      filtered=allCycleData.filter(p=>p.date>=cutoff);
    }

    // Aggregate by month key
    const byKey={};
    filtered.forEach(p=>{
      if(!byKey[p.key]) byKey[p.key]={label:p.label,gmv:0,fees:0};
      byKey[p.key].gmv+=p.gmv;
      byKey[p.key].fees+=p.fees;
    });
    const agg=Object.values(byKey).map(d=>({
      label:d.label,
      v:chartMetric==="fees"?d.fees:d.gmv,
    }));
    // For very short ranges with no data, show all time
    return agg.length>0?agg:allCycleData.slice(-1).map(d=>({label:d.label,v:chartMetric==="fees"?d.fees:d.gmv}));
  })();

  const chartTotal=chartData.reduce((n,d)=>n+d.v,0);
  const prevChartTotal=(()=>{
    // Compare to same-length prior period
    if(chartData.length===0) return 0;
    const range=TIME_RANGES.find(r=>r.id===chartRange);
    if(!range?.days) return historicalFees; // for MTD/QTD/YTD compare to all historical
    const now=new Date();
    const cutoff=new Date(now-range.days*24*60*60*1000);
    const prevCutoff=new Date(now-range.days*2*24*60*60*1000);
    return allCycleData.filter(p=>p.date>=prevCutoff&&p.date<cutoff).reduce((n,p)=>n+(chartMetric==="fees"?p.fees:p.gmv),0);
  })();
  const chartChange=prevChartTotal>0?+(100*(chartTotal-prevChartTotal)/prevChartTotal).toFixed(1):null;

  const avgTake=activeAccts.filter(a=>a.contract).length>0
    ?activeAccts.filter(a=>a.contract).reduce((n,a)=>n+(a.contract?.netTakePct||10),0)/activeAccts.filter(a=>a.contract).length
    :10;

  return <div style={{padding:isMobile?"16px 16px 72px":"32px 40px",maxWidth:1100}}>

    {/* Header */}
    <div style={{marginBottom:24}}>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:5}}>Finances</div>
      <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-.3,margin:"0 0 4px",color:T.ink}}>Revenue & contract performance</h1>
      <p style={{fontSize:13,color:S.inactiveText,margin:0}}>Contracted revenue, realized fees, gap analysis, and scenario modeling.</p>
    </div>

    {/* KPI strip */}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",borderRadius:10,border:`1px solid ${S.border}`,overflow:"hidden",background:S.border,gap:1,marginBottom:28}}>
      {[
        {label:"Contracted revenue",value:fmtK(feesContracted),change:null,sub:`from ${fmtK(gmvProj)} GMV`},
        {label:"Fees realized",value:fmtK(feesEarned),change:feesContracted>0?+(100*feesEarned/feesContracted-100).toFixed(1):null,sub:`${pipelinePct}% of contracted`},
        {label:"Net revenue",value:(netRev<0?"-":"")+fmtK(Math.abs(netRev)),change:null,sub:`after ${fmt(totalCosts)} costs`},
        {label:"Avg take rate",value:avgTake.toFixed(1)+"%",change:null,sub:`across ${activeAccts.filter(a=>a.contract).length} contracts`},
      ].map((t,i)=>(
        <div key={i} style={{padding:"20px 24px",background:"#fff"}}>
          <div style={{fontSize:11,fontWeight:500,color:S.labelText,marginBottom:8}}>{t.label}</div>
          <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
            <span style={{fontSize:26,fontWeight:700,letterSpacing:-1,color:T.ink}}>{t.value}</span>
            {t.change!==null&&<ChangeTag value={t.change}/>}
          </div>
          <div style={{fontSize:12,color:S.labelText}}>{t.sub}</div>
        </div>
      ))}
    </div>

    {/* View tabs */}
    <div style={{display:"flex",gap:0,borderBottom:`1px solid ${S.border}`,marginBottom:24,overflowX:"auto"}}>
      {[["overview","Overview"],["accounts","By account"],["history","History"],["scenario","Scenario builder"]].map(([id,lbl])=>(
        <button key={id} onClick={()=>setView(id)} style={{padding:"8px 16px",border:"none",borderBottom:`2px solid ${view===id?CHART_BLUE:"transparent"}`,background:"transparent",color:view===id?CHART_BLUE:S.inactiveText,fontFamily:sans,fontSize:13,fontWeight:view===id?600:400,cursor:"pointer",whiteSpace:"nowrap"}}>
          {lbl}
        </button>
      ))}
    </div>

    {/* OVERVIEW */}
    {view==="overview"&&<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"2fr 1fr",gap:20}}>

      {/* Chart with full time range selector */}
      <div style={{border:`1px solid ${S.border}`,borderRadius:10,padding:"20px 24px",background:"#fff"}}>
        {/* Chart header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
              <div style={{fontSize:28,fontWeight:700,color:T.ink,letterSpacing:-1}}>{fmtK(chartTotal)}</div>
              {chartChange!==null&&<ChangeTag value={chartChange}/>}
            </div>
            <div style={{fontSize:12,color:S.labelText}}>
              {chartMetric==="fees"?"Fee earnings":"GMV"} · {TIME_RANGES.find(r=>r.id===chartRange)?.label}
            </div>
          </div>
          {/* Metric toggle */}
          <div style={{display:"flex",gap:1,background:"#F3F4F6",borderRadius:6,padding:2}}>
            {[["fees","Fees"],["gmv","GMV"]].map(([id,lbl])=>(
              <button key={id} onClick={()=>setChartMetric(id)} style={{padding:"4px 10px",borderRadius:5,border:"none",background:chartMetric===id?"#fff":"transparent",color:chartMetric===id?T.ink:S.inactiveText,fontSize:12,fontWeight:chartMetric===id?600:400,cursor:"pointer",fontFamily:sans,boxShadow:chartMetric===id?"0 1px 2px rgba(0,0,0,.08)":"none"}}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{marginBottom:12}}>
          <AreaChart data={chartData} height={140} color={CHART_BLUE}/>
        </div>

        {/* X-axis labels */}
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16,fontSize:11,color:S.labelText}}>
          <span>{chartData[0]?.label||"—"}</span>
          {chartData.length>2&&<span>{chartData[Math.floor(chartData.length/2)]?.label}</span>}
          <span>{chartData[chartData.length-1]?.label||"Now"}</span>
        </div>

        {/* Time range selector — all 9 options */}
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {TIME_RANGES.map(r=>(
            <button key={r.id} onClick={()=>setChartRange(r.id)} style={{
              padding:"4px 10px",borderRadius:5,border:`1px solid ${chartRange===r.id?CHART_BLUE:S.border}`,
              background:chartRange===r.id?CHART_BLUE_SOFT:"transparent",
              color:chartRange===r.id?CHART_BLUE:S.inactiveText,
              fontSize:11.5,fontWeight:chartRange===r.id?600:400,cursor:"pointer",fontFamily:sans,
            }}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue waterfall */}
      <div style={{border:`1px solid ${S.border}`,borderRadius:10,padding:"20px 24px",background:"#fff"}}>
        <div style={{fontSize:12,fontWeight:600,color:T.ink,marginBottom:20}}>Revenue waterfall</div>
        {[
          {label:"GMV contracted",value:gmvProj,color:"#E5E7EB",fill:CHART_BLUE,pct:100},
          {label:"GMV realized",value:gmvActual,color:"#E5E7EB",fill:T.green,pct:gmvProj?Math.round(100*gmvActual/gmvProj):0},
          {label:"Fees contracted",value:feesContracted,color:"#E5E7EB",fill:CHART_BLUE,pct:gmvProj?+(feesContracted/gmvProj*100).toFixed(1):0,indent:true},
          {label:"Fees realized",value:feesEarned,color:"#E5E7EB",fill:T.green,pct:feesContracted?Math.round(100*feesEarned/feesContracted):0,indent:true},
          {label:"Costs",value:totalCosts,fill:T.red,negative:true,nobar:true},
          {label:"Net",value:Math.abs(netRev),fill:netRev>=0?T.green:T.red,negative:netRev<0,bold:true,nobar:true},
        ].map((r,i)=>(
          <div key={i} style={{marginBottom:10,paddingLeft:r.indent?12:0,borderLeft:r.indent?`2px solid ${S.border}`:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:r.nobar?0:4}}>
              <span style={{fontSize:12,color:r.bold?T.ink:S.inactiveText,fontWeight:r.bold?700:400}}>{r.label}</span>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {r.pct!==undefined&&!r.nobar&&<span style={{fontSize:11,color:S.labelText}}>{r.pct}%</span>}
                <span style={{fontSize:13,fontWeight:600,color:T.ink}}>{r.negative&&r.value>0?"-":""}{fmtK(r.value)}</span>
              </div>
            </div>
            {!r.nobar&&<MiniBar value={r.value} max={gmvProj} color={r.fill}/>}
          </div>
        ))}
      </div>

      {/* Active contracts summary */}
      <div style={{border:`1px solid ${S.border}`,borderRadius:10,background:"#fff",overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${S.border}`}}>
          <div style={{fontSize:12,fontWeight:600,color:T.ink}}>Active contract performance</div>
        </div>
        {activeAccts.filter(a=>a.contract?.gmvProjected>0).sort((a,b)=>(b.contract?.gmvActual||0)-(a.contract?.gmvActual||0)).map((a,i)=>{
          const proj=a.contract?.gmvProjected||0;
          const real=a.contract?.gmvActual||0;
          const take=a.contract?.netTakePct||10;
          const fees=real*take/100;
          const pct=proj>0?Math.round(100*real/proj):0;
          return <div key={a.id} style={{padding:"12px 20px",borderTop:i?`1px solid ${S.border}`:"none"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:24,height:24,borderRadius:5,background:a.logo||"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff"}}>{a.short}</div>
                <span style={{fontSize:13,fontWeight:500,color:T.ink}}>{a.account}</span>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:13,fontWeight:700,color:T.ink}}>{fmtK(fees)}</div>
                <div style={{fontSize:11,color:S.labelText}}>{pct}% of {fmtK(proj)}</div>
              </div>
            </div>
            <MiniBar value={real} max={proj} color={pct>=80?T.green:pct>=40?CHART_BLUE:T.yellow}/>
          </div>;
        })}
      </div>

      {/* Key stats */}
      <div style={{border:`1px solid ${S.border}`,borderRadius:10,padding:"20px 24px",background:"#fff"}}>
        <div style={{fontSize:12,fontWeight:600,color:T.ink,marginBottom:16}}>Key metrics</div>
        {[
          {l:"Contracted revenue",v:fmtK(feesContracted),s:"Total if all realize"},
          {l:"Revenue gap",v:fmtK(feesMissed),s:"Still to be earned",c:feesMissed>5000?T.yellow:T.green},
          {l:"Upside remaining",v:fmtK(Math.max(0,netRevContracted-netRev)),s:"Net upside to capture"},
          {l:"Historical GMV",v:fmtK(historicalGmv),s:`${allHistorical.length} completed cycles`},
          {l:"Historical fees",v:fmtK(historicalFees),s:historicalGmv>0?+(historicalFees/historicalGmv*100).toFixed(1)+"% blended take":"—"},
          {l:"Open disputes",v:activeAccts.reduce((n,a)=>n+(a.chargebacks||[]).filter(c=>c.status==="Open").length,0),s:"Across all accounts",c:activeAccts.reduce((n,a)=>n+(a.chargebacks||[]).filter(c=>c.status==="Open").length,0)>0?T.red:T.green},
        ].map((r,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderTop:i?`1px solid #F3F4F6`:"none"}}>
            <span style={{fontSize:12,color:S.inactiveText}}>{r.l}</span>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:14,fontWeight:700,color:r.c||T.ink}}>{r.v}</div>
              {r.s&&<div style={{fontSize:11,color:S.labelText}}>{r.s}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>}

    {/* BY ACCOUNT */}
    {view==="accounts"&&<div style={{border:`1px solid ${S.border}`,borderRadius:10,overflow:"hidden",background:"#fff"}}>
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr",padding:"10px 20px",background:"#FAFAFA",borderBottom:`1px solid ${S.border}`}}>
        {["Account","GMV projected","GMV realized","% realized","Fees earned","Net"].map((h,i)=>(
          <div key={i} style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,textAlign:i>0?"right":"left"}}>{h}</div>
        ))}
      </div>
      {activeAccts.filter(a=>a.contract).sort((a,b)=>(b.contract?.gmvActual||0)-(a.contract?.gmvActual||0)).map((a,i)=>{
        const proj=a.contract?.gmvProjected||0;
        const real=a.contract?.gmvActual||0;
        const take=a.contract?.netTakePct||10;
        const fees=real*take/100;
        const costs=sumCosts(a);
        const net=fees-costs;
        const pct=proj>0?Math.round(100*real/proj):0;
        return <div key={a.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr",padding:"13px 20px",borderTop:i?`1px solid ${S.border}`:"none",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:26,height:26,borderRadius:6,background:a.logo||"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#fff",flexShrink:0}}>{a.short}</div>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:T.ink}}>{a.account}</div>
              <div style={{fontSize:11,color:S.labelText}}>{take}% · {a.contract?.paymentTerms||"—"}</div>
            </div>
          </div>
          <div style={{fontSize:13,textAlign:"right",color:S.inactiveText}}>{fmtK(proj)}</div>
          <div style={{fontSize:13,textAlign:"right",fontWeight:600,color:T.ink}}>{fmtK(real)}</div>
          <div style={{textAlign:"right"}}>
            <span style={{fontSize:12,fontWeight:700,color:T.ink}}>{pct}%</span>
            <ChangeTag value={pct-100}/>
          </div>
          <div style={{fontSize:13,textAlign:"right",fontWeight:700,color:T.ink}}>{fmtK(fees)}</div>
          <div style={{fontSize:13,textAlign:"right",fontWeight:700,color:T.ink}}>{net<0?"-":""}{fmtK(Math.abs(net))}</div>
        </div>;
      })}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr 1fr",padding:"13px 20px",borderTop:`2px solid ${S.border}`,background:"#FAFAFA"}}>
        <div style={{fontSize:13,fontWeight:700,color:T.ink}}>Total</div>
        <div style={{fontSize:13,textAlign:"right",fontWeight:700,color:T.ink}}>{fmtK(gmvProj)}</div>
        <div style={{fontSize:13,textAlign:"right",fontWeight:700,color:T.ink}}>{fmtK(gmvActual)}</div>
        <div style={{textAlign:"right"}}><span style={{fontSize:12,fontWeight:700,color:T.ink}}>{pipelinePct}%</span></div>
        <div style={{fontSize:13,textAlign:"right",fontWeight:700,color:T.ink}}>{fmtK(feesEarned)}</div>
        <div style={{fontSize:13,textAlign:"right",fontWeight:700,color:netRev>=0?T.ink:T.red}}>{netRev<0?"-":""}{fmtK(Math.abs(netRev))}</div>
      </div>
    </div>}

    {/* HISTORY */}
    {view==="history"&&<>
      {allHistorical.length===0
        ?<div style={{padding:"40px",textAlign:"center",border:`1px dashed ${S.border}`,borderRadius:10,color:S.inactiveText}}>
          <div style={{fontSize:14,fontWeight:500,color:T.ink,marginBottom:6}}>No completed cycles yet</div>
          <div style={{fontSize:13}}>Historical data appears here once a contract cycle is completed and replaced by a renewal.</div>
        </div>
        :<>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(3,1fr)",gap:1,border:`1px solid ${S.border}`,borderRadius:10,overflow:"hidden",background:S.border,marginBottom:20}}>
            {[
              {label:"Historical GMV",value:fmtK(historicalGmv),sub:`${allHistorical.length} completed cycle${allHistorical.length!==1?"s":""}`},
              {label:"Historical fees",value:fmtK(historicalFees),sub:historicalGmv>0?+(historicalFees/historicalGmv*100).toFixed(1)+"% blended take":"—"},
              {label:"Avg cycle GMV",value:fmtK(Math.round(historicalGmv/Math.max(allHistorical.length,1))),sub:"Per completed cycle"},
            ].map((t,i)=>(
              <div key={i} style={{padding:"18px 20px",background:"#fff"}}>
                <div style={{fontSize:11,fontWeight:500,color:S.labelText,marginBottom:6}}>{t.label}</div>
                <div style={{fontSize:22,fontWeight:700,color:T.ink,letterSpacing:-.5}}>{t.value}</div>
                <div style={{fontSize:12,color:S.labelText,marginTop:2}}>{t.sub}</div>
              </div>
            ))}
          </div>
          <div style={{border:`1px solid ${S.border}`,borderRadius:10,overflow:"hidden",background:"#fff"}}>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",padding:"10px 20px",background:"#FAFAFA",borderBottom:`1px solid ${S.border}`}}>
              {["Cycle","Account","GMV realized","Take rate","Fees earned"].map((h,i)=>(
                <div key={i} style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText,textAlign:i>1?"right":"left"}}>{h}</div>
              ))}
            </div>
            {[...allHistorical].sort((a,b)=>new Date(b.start||0)-new Date(a.start||0)).map((c,i)=>{
              const fees=(c.gmvActual||0)*(c.netTakePct||c.take||10)/100;
              return <div key={c.id||i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",padding:"13px 20px",borderTop:i?`1px solid ${S.border}`:"none",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:500,color:T.ink}}>{c.label||"Unnamed cycle"}</div>
                  <div style={{fontSize:11,color:S.labelText}}>{c.start||"—"}{c.end?` → ${c.end}`:""}</div>
                </div>
                <div style={{fontSize:13,color:S.inactiveText}}>{c.acct}</div>
                <div style={{fontSize:13,textAlign:"right",fontWeight:600,color:T.ink}}>{fmtK(c.gmvActual||0)}</div>
                <div style={{fontSize:13,textAlign:"right",color:S.inactiveText}}>{c.netTakePct||c.take||10}%</div>
                <div style={{fontSize:13,textAlign:"right",fontWeight:700,color:T.ink}}>{fmtK(fees)}</div>
              </div>;
            })}
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",padding:"13px 20px",borderTop:`2px solid ${S.border}`,background:"#FAFAFA"}}>
              <div style={{fontSize:13,fontWeight:700}}>Total</div>
              <div/>
              <div style={{fontSize:13,textAlign:"right",fontWeight:700}}>{fmtK(historicalGmv)}</div>
              <div style={{fontSize:12,textAlign:"right",color:S.labelText}}>{historicalGmv>0?+(historicalFees/historicalGmv*100).toFixed(1)+"% avg":""}</div>
              <div style={{fontSize:13,textAlign:"right",fontWeight:700,color:T.ink}}>{fmtK(historicalFees)}</div>
            </div>
          </div>
        </>
      }
    </>}

    {/* SCENARIO BUILDER */}
    {view==="scenario"&&<>
      {/* Scenario output */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(3,1fr)",gap:1,border:`1px solid ${S.border}`,borderRadius:10,overflow:"hidden",background:S.border,marginBottom:24}}>
        {[
          {label:"Projected GMV",value:fmtK(scenarioGmv),sub:"Confidence-weighted"},
          {label:"Projected fees",value:fmtK(scenarioFees),sub:"From scenario"},
          {label:"Projected net",value:(scenarioNet<0?"-":"")+fmtK(Math.abs(scenarioNet)),sub:`After ${fmt(totalCosts)} costs`,c:scenarioNet>=0?T.green:T.red},
        ].map((t,i)=>(
          <div key={i} style={{padding:"20px 24px",background:"#fff"}}>
            <div style={{fontSize:11,fontWeight:500,color:S.labelText,marginBottom:6}}>{t.label}</div>
            <div style={{fontSize:24,fontWeight:700,color:t.c||T.ink,letterSpacing:-.5}}>{t.value}</div>
            <div style={{fontSize:12,color:S.labelText,marginTop:2}}>{t.sub}</div>
          </div>
        ))}
      </div>

      <div style={{fontSize:12,color:S.inactiveText,marginBottom:14,lineHeight:1.6}}>
        Adjust each account's status, GMV projection, and confidence to model different futures. Add potential new clients to see the impact.
        Confidence % = probability-weighted contribution to projected revenue.
      </div>

      {/* Account scenario rows */}
      <div style={{border:`1px solid ${S.border}`,borderRadius:10,overflow:"hidden",background:"#fff",marginBottom:16}}>
        <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 80px 100px 120px",padding:"9px 16px",background:"#FAFAFA",borderBottom:`1px solid ${S.border}`}}>
          {["Account","GMV","Take %","Confidence","Status"].map((h,i)=>(
            <div key={i} style={{fontSize:11,fontWeight:600,letterSpacing:.4,textTransform:"uppercase",color:S.labelText}}>{h}</div>
          ))}
        </div>
        {allScenarios.map((s,i)=>(
          <div key={s.id} style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 80px 100px 120px",padding:"10px 16px",borderTop:i?`1px solid ${S.border}`:"none",alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:24,height:24,borderRadius:5,background:s.logo||"#888",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0}}>{s.short}</div>
              <div>
                <div style={{fontSize:12,fontWeight:500,color:T.ink}}>{s.name}</div>
                <div style={{fontSize:10.5,color:S.labelText}}>{s.tier}</div>
              </div>
            </div>
            <input type="number" value={s.gmv} onChange={e=>{const v=+e.target.value;setScenarios(p=>p.map(x=>x.id===s.id?{...x,gmv:v}:x));setNewClients(p=>p.map(x=>x.id===s.id?{...x,gmv:v}:x));}} style={{padding:"5px 8px",border:`1px solid ${S.border}`,borderRadius:5,fontSize:12,fontFamily:sans,outline:"none",width:"90%"}}/>
            <input type="number" value={s.take} onChange={e=>{const v=+e.target.value;setScenarios(p=>p.map(x=>x.id===s.id?{...x,take:v}:x));setNewClients(p=>p.map(x=>x.id===s.id?{...x,take:v}:x));}} style={{padding:"5px 8px",border:`1px solid ${S.border}`,borderRadius:5,fontSize:12,fontFamily:sans,outline:"none",width:"55px"}}/>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <input type="range" min="0" max="100" value={s.confidence} onChange={e=>{const v=+e.target.value;setScenarios(p=>p.map(x=>x.id===s.id?{...x,confidence:v}:x));setNewClients(p=>p.map(x=>x.id===s.id?{...x,confidence:v}:x));}} style={{width:50,accentColor:CHART_BLUE}}/>
              <span style={{fontSize:11,fontWeight:600,color:T.ink,minWidth:28}}>{s.confidence}%</span>
            </div>
            <select value={s.status} onChange={e=>{const v=e.target.value;setScenarios(p=>p.map(x=>x.id===s.id?{...x,status:v}:x));setNewClients(p=>p.map(x=>x.id===s.id?{...x,status:v}:x));}} style={{padding:"5px 8px",border:`1px solid ${s.status==="churning"?T.red:s.status==="expanding"?T.green:S.border}`,borderRadius:5,fontSize:12,fontFamily:sans,outline:"none",background:"#fff",color:s.status==="churning"?T.red:s.status==="expanding"?T.green:T.ink,fontWeight:500}}>
              <option value="renewing">Renewing</option>
              <option value="expanding">Expanding</option>
              <option value="churning">Churning</option>
            </select>
          </div>
        ))}
      </div>

      {/* Add new client */}
      {newClientForm
        ?<div style={{border:`1px solid ${S.border}`,borderRadius:8,padding:"16px",background:"#F9FAFB",marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:600,color:T.ink,marginBottom:12}}>Add potential client</div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:10,marginBottom:12}}>
            <div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.3,display:"block",marginBottom:4}}>Name</label><input value={nc.name} onChange={e=>setNc(p=>({...p,name:e.target.value}))} placeholder="e.g. Boston Glory" style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/></div>
            <div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.3,display:"block",marginBottom:4}}>GMV ($)</label><input type="number" value={nc.gmv||""} onChange={e=>setNc(p=>({...p,gmv:+e.target.value}))} style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/></div>
            <div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.3,display:"block",marginBottom:4}}>Take %</label><input type="number" value={nc.take} onChange={e=>setNc(p=>({...p,take:+e.target.value}))} style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/></div>
            <div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.3,display:"block",marginBottom:4}}>Confidence %</label><input type="number" min="0" max="100" value={nc.confidence} onChange={e=>setNc(p=>({...p,confidence:+e.target.value}))} style={{width:"100%",padding:"7px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button disabled={!nc.name||!nc.gmv} onClick={addNewClient} style={{...VBtn.primary,fontSize:12,opacity:nc.name&&nc.gmv?1:.4}}>Add to scenario</button>
            <button onClick={()=>setNewClientForm(false)} style={{...VBtn.secondary,fontSize:12}}>Cancel</button>
          </div>
        </div>
        :<button onClick={()=>setNewClientForm(true)} style={{...VBtn.secondary,fontSize:13,marginBottom:16}}>+ Add potential client</button>
      }

      {/* Confidence guide */}
      <div style={{padding:"12px 16px",background:"#F9FAFB",border:`1px solid ${S.border}`,borderRadius:8,fontSize:12}}>
        <div style={{fontWeight:600,color:T.ink,marginBottom:6}}>Confidence guide</div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap",color:S.inactiveText}}>
          {[["Active contract","90%","High certainty — contract signed"],["Watch","60%","At risk — renewal not confirmed"],["Cold","15%","Re-engagement needed"],["Prospect / new","10-50%","Uncontracted — set manually"]].map(([s,c,d])=>(
            <div key={s} style={{minWidth:140}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}><b style={{color:T.ink}}>{s}</b><span style={{fontSize:11,fontWeight:600,color:CHART_BLUE}}>{c}</span></div>
              <div style={{fontSize:11}}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </>}
  </div>;
}

function AgentPage({accounts=[]}){
  const [isMobile,setIsMobile]=useState(()=>typeof window!=='undefined'&&window.innerWidth<768);
  useEffect(()=>{const fn=()=>setIsMobile(window.innerWidth<768);window.addEventListener('resize',fn);return()=>window.removeEventListener('resize',fn);},[]);
  const [connections,setConnections]=useState(()=>{try{return JSON.parse(localStorage.getItem("tt_connections")||"{}");}catch{return{};}});
  const [pullState,setPullState]=useState("idle");
  const [digest,setDigest]=useState(null);
  const [tab,setTab]=useState("integrations");
  const connectedCount=Object.values(connections).filter(v=>v==="connected").length;
  const CONNECTORS=[
    {id:"gmail",label:"Gmail",category:"Email",desc:"Scans client email threads for signals and sentiment.",what:"Email threads, reply sentiment",color:"#EA4335"},
    {id:"imessage",label:"iMessage",category:"Messages",desc:"Reads iMessage threads with clients. Requires Full Disk Access on Mac.",what:"Text threads, informal promises, OOS requests",color:"#34C759"},
    {id:"instantly",label:"Instantly",category:"Outbound",desc:"Ingests sequence replies and open rates from outbound campaigns.",what:"Reply rates, interested signals",color:"#F59E0B"},
    {id:"expandi",label:"Expandi",category:"Outbound",desc:"Pulls LinkedIn outreach replies and connection signals.",what:"LinkedIn replies, connection acceptance",color:"#0077B5"},
    {id:"capsule",label:"Capsule CRM",category:"CRM",desc:"Syncs deal stage, contact notes, and pipeline value.",what:"Deal stage, contact activity, opportunity value",color:"#6C5FE0"},
    {id:"discord",label:"Discord",category:"Internal",desc:"Monitors team Discord for account mentions and deal updates.",what:"Channel mentions, deal discussions",color:"#5865F2",soon:true},
  ];
  const STEPS=["Scanning iMessage threads…","Reading Gmail threads…","Checking Instantly replies…","Pulling Capsule deal stages…","Surfacing signals…","Building digest…"];
  const [scanStep,setScanStep]=useState(0);
  useEffect(()=>{if(pullState!=="scanning")return;const iv=setInterval(()=>setScanStep(s=>(s+1)%STEPS.length),700);return()=>clearInterval(iv);},[pullState]);
  function toggle(id){if(CONNECTORS.find(c=>c.id===id)?.soon)return;setConnections(p=>{const n={...p,[id]:p[id]==="connected"?"disconnected":"connected"};localStorage.setItem("tt_connections",JSON.stringify(n));return n;});}
  function runPull(){setPullState("scanning");setTimeout(()=>{setDigest({pulledAt:new Date().toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}),accounts:accounts.map(a=>({name:a.account,tier:a.tier,topRisk:(a.risks||[])[0]||null,nextMs:(a.milestones||[]).filter(m=>!m.done).sort((x,y)=>new Date(x.date)-new Date(y.date))[0]||null,daysSince:a.kpis?.daysSinceContact||0})),actions:accounts.flatMap(a=>(a.risks||[]).filter(r=>r.severity==="high").map(r=>({...r,acct:a.account})))});setPullState("done");setTab("digest");},(STEPS.length+1)*700);}
  return <div style={{padding:isMobile?"16px 16px 72px":"32px 40px",maxWidth:860}}>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24}}>
      <div>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:5}}>Agent</div>
        <h1 style={{fontSize:22,fontWeight:700,letterSpacing:-.3,margin:"0 0 4px"}}>Pipeline Agent</h1>
        <p style={{fontSize:13,color:S.inactiveText,margin:0}}>Connects to your comms and CRMs, scans for signals, surfaces a team-ready digest. Run Friday EOD or before all-hands.</p>
      </div>
      <button onClick={runPull} disabled={pullState==="scanning"} style={{...VBtn.primary,opacity:pullState==="scanning"?.6:1}}>
        {pullState==="scanning"?"Scanning…":"Run pull"}
      </button>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:16,padding:"10px 16px",background:"#F9FAFB",border:`1px solid ${S.border}`,borderRadius:8,marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:connectedCount>0?T.green:"#D1D5DB"}}/><span style={{fontSize:13,fontWeight:500}}>{connectedCount} of {CONNECTORS.filter(c=>!c.soon).length} sources connected</span></div>
      <div style={{width:1,height:16,background:S.border}}/>
      <span style={{fontSize:13,color:S.inactiveText}}>Last pull: {digest?digest.pulledAt:"never"}</span>
    </div>
    {pullState==="scanning"&&<div style={{border:`1px solid ${T.purple}20`,background:T.purpleSoft,borderRadius:8,padding:"16px",marginBottom:20}}>
      {STEPS.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"3px 0",opacity:i<=scanStep?1:.3}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:i<scanStep?T.green:i===scanStep?T.purple:"#D1D5DB",flexShrink:0}}/>
        <span style={{fontSize:13,color:i<scanStep?T.green:i===scanStep?T.purple:S.inactiveText}}>{s}</span>
      </div>)}
    </div>}
    <div style={{display:"flex",gap:0,borderBottom:`1px solid ${S.border}`,marginBottom:20}}>
      {[["integrations","Integrations"],["digest","Digest"+(digest?"":" (run pull first)")]].map(([id,lbl])=>(
        <button key={id} onClick={()=>id==="digest"&&!digest?null:setTab(id)} style={{padding:"8px 16px",border:"none",borderBottom:`2px solid ${tab===id?T.purple:"transparent"}`,background:"transparent",color:tab===id?T.purple:id==="digest"&&!digest?S.labelText:S.inactiveText,fontFamily:sans,fontSize:13,fontWeight:tab===id?600:400,cursor:id==="digest"&&!digest?"default":"pointer"}}>{lbl}</button>
      ))}
    </div>
    {tab==="integrations"&&<>
      {["Email","Messages","Outbound","CRM","Internal"].map(cat=>{
        const cats=CONNECTORS.filter(c=>c.category===cat);
        return <div key={cat} style={{marginBottom:24}}>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:10}}>{cat}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {cats.map(c=>{const on=connections[c.id]==="connected";return(
              <div key={c.id} style={{border:`1px solid ${on?T.green:S.border}`,borderRadius:8,padding:"14px",background:on?"#F0FDF4":"#fff",opacity:c.soon?.6:1}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,color:T.ink}}>{c.label}</div>
                    <div style={{fontSize:11,color:on?T.green:S.labelText,marginTop:1}}>{c.soon?"Coming soon":on?"Connected":"Not connected"}</div>
                  </div>
                  {!c.soon&&<button onClick={()=>toggle(c.id)} style={{...on?VBtn.secondary:VBtn.primary,fontSize:12,padding:"5px 12px"}}>{on?"Disconnect":"Connect"}</button>}
                  {c.soon&&<span style={{fontSize:11,padding:"4px 8px",borderRadius:4,background:"#F3F4F6",color:S.inactiveText}}>Soon</span>}
                </div>
                <div style={{fontSize:12,color:S.inactiveText,lineHeight:1.5,marginBottom:4}}>{c.desc}</div>
                <div style={{fontSize:11,color:S.labelText}}><b style={{color:T.ink}}>Ingests:</b> {c.what}</div>
              </div>
            );})}
          </div>
        </div>;
      })}
    </>}
    {tab==="digest"&&digest&&<>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
        {[{label:"Action needed",n:digest.accounts.filter(a=>a.tier==="cold"||a.tier==="watch").length,c:T.red,s:T.redSoft},{label:"Watch",n:digest.accounts.filter(a=>a.tier==="watch").length,c:T.yellow,s:T.yellowSoft},{label:"Critical actions",n:digest.actions.length,c:T.purple,s:T.purpleSoft}].map((t,i)=>(
          <div key={i} style={{border:`1px solid ${S.border}`,borderRadius:8,padding:"14px",background:"#fff"}}>
            <div style={{fontSize:26,fontWeight:700,color:t.c}}>{t.n}</div>
            <div style={{fontSize:12,color:S.inactiveText,marginTop:2}}>{t.label}</div>
          </div>
        ))}
      </div>
      {digest.accounts.map((a,i)=>(
        <div key={i} style={{border:`1px solid ${S.border}`,borderRadius:8,marginBottom:10,background:"#fff",overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:a.topRisk||a.nextMs?`1px solid ${S.border}`:"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13,fontWeight:600}}>{a.name}</span><Tag label={(CRM_TIERS[a.tier]||CRM_TIERS.active).label} c={(CRM_TIERS[a.tier]||CRM_TIERS.active).c} s={(CRM_TIERS[a.tier]||CRM_TIERS.active).s}/></div>
            <span style={{fontSize:12,color:a.daysSince>14?T.red:S.labelText}}>{a.daysSince}d since contact</span>
          </div>
          {(a.topRisk||a.nextMs)&&<div style={{padding:"10px 16px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            {a.topRisk&&<div><div style={{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,color:S.labelText,marginBottom:3}}>Top risk</div><div style={{fontSize:12,color:T.ink}}>{a.topRisk.risk}</div></div>}
            {a.nextMs&&<div><div style={{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,color:S.labelText,marginBottom:3}}>Next milestone</div><div style={{fontSize:12,color:T.ink}}>{a.nextMs.title} · {a.nextMs.date}</div></div>}
          </div>}
        </div>
      ))}
    </>}
    {tab==="digest"&&!digest&&<div style={{padding:"40px",textAlign:"center",border:`1px dashed ${S.border}`,borderRadius:8,color:S.inactiveText}}>
      <div style={{fontSize:15,fontWeight:600,color:T.ink,marginBottom:6}}>No digest yet</div>
      <div style={{fontSize:13,marginBottom:16}}>Connect a source and run a pull to generate your first digest.</div>
      <button onClick={()=>setTab("integrations")} style={{...VBtn.secondary}}>Set up integrations →</button>
    </div>}
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

// ── CONTRACT WIZARD ──
// Step 0: Event type  Step 1: Select source cycle  Step 2: Economics  Step 3: Terms  Step 4: Review
// For renewals/amendments the user picks which cycle to build from before anything pre-fills

function ContractWizard({a, onSave, onCancel}){
  const cycles = a.cycles||[];
  const activeCycle = cycles.find(c=>c.active)||null;
  const allCycles = [...cycles].sort((x,y)=>new Date(y.start||0)-new Date(x.start||0));

  const [eventType, setEventType] = useState("new"); // new | renewal | amendment
  const [sourceCycle, setSourceCycle] = useState(null); // which cycle we're building from
  const [step, setStep] = useState(0);

  // Steps vary by event type
  // new: Event → Economics → Terms → Review (no cycle selector)
  // renewal/amendment: Event → Select cycle → Economics → Terms → Review
  const needsCycleSelect = eventType !== "new" && cycles.length > 0;
  const STEPS = needsCycleSelect
    ? ["Event","Source cycle","Economics","Terms","Review"]
    : ["Event","Economics","Terms","Review"];

  const today = new Date().toISOString().slice(0,7);

  // When source cycle is set, pre-fill econ and terms from it
  function buildDefaults(src){
    const prevGmv = src?.gmvActual||src?.gmvProjected||a.contract?.gmvProjected||0;
    // For renewals bump GMV 10% as a starting estimate
    const bumpedGmv = eventType==="renewal"&&src ? Math.round(prevGmv*1.10/1000)*1000 : prevGmv;
    return {
      econ:{
        gmvProjected:    bumpedGmv,
        platformFeePct:  src?.platformFeePct  || a.contract?.platformFeePct  || 10,
        kickbackPct:     src?.kickbackPct      || a.contract?.kickbackPct      || 0,
        kickbackTo:      src?.kickbackTo       || a.contract?.kickbackTo       || "",
        netTakePct:      src?.netTakePct       || a.contract?.netTakePct       || 10,
        processingRate:  src?.processingRate   || a.contract?.processingRate   || 2.9,
      },
      terms:{
        label:             eventType==="renewal" && src
          ? src.label.replace(/Year (\d+)/i, (_,n)=>`Year ${+n+1}`).replace(/Cycle (\d+)/i, (_,n)=>`Cycle ${+n+1}`) || `${a.account} — Renewal`
          : eventType==="amendment" && src
          ? `${src.label} (Amendment)`
          : `${a.account} — Contract ${(a.contractCycle||0)+1}`,
        start:             today,
        end:               "",
        paymentTerms:      src?.paymentTerms   || a.contract?.paymentTerms   || "Net 30",
        liabilityCap:      src?.liabilityCap   || a.contract?.liabilityCap   || 0,
        slaTarget:         src?.slaTarget       || a.contract?.slaTarget       || 99.9,
        dataRights:        src?.dataRights      || a.contract?.dataRights      || "Fan profiles retained by Ticket Tree",
        terminationNotice: src?.terminationNotice || a.contract?.terminationNotice || "30 days",
        autoRenew:         false,
        exclusive:         src?.exclusive       || false,
        products:          src?.products        || [...(a.products||[])],
        notes:             eventType==="renewal"&&src ? `Renewal of: ${src.label}.` : eventType==="amendment"&&src ? `Amendment to: ${src.label}.` : "",
      }
    };
  }

  const initDefaults = buildDefaults(activeCycle||allCycles[0]||null);
  const [econ, setEcon] = useState(initDefaults.econ);
  const [terms, setTerms] = useState(initDefaults.terms);
  const upE = (k,v)=>setEcon(p=>({...p,[k]:v}));
  const upT = (k,v)=>setTerms(p=>({...p,[k]:v}));

  // When user picks a source cycle, rebuild defaults from it
  function selectSource(cy){
    setSourceCycle(cy);
    const d = buildDefaults(cy);
    setEcon(d.econ);
    setTerms(d.terms);
  }

  const fees = (econ.gmvProjected||0)*(econ.netTakePct||10)/100;
  const deviations = [];
  if((econ.netTakePct||10)<10) deviations.push(`Take rate ${econ.netTakePct}% is below your 10% standard`);
  if(!(terms.liabilityCap) && !terms.liabilityCapNA) deviations.push("No liability cap — uncapped exposure");
  if(!terms.end) deviations.push("No end date set");

  // What step index is "Economics" given current STEPS array?
  const econStep  = STEPS.indexOf("Economics");
  const termsStep = STEPS.indexOf("Terms");
  const reviewStep= STEPS.indexOf("Review");
  const cycleStep = STEPS.indexOf("Source cycle");

  // canNext[i] = true means step i is COMPLETE (you can leave it)
  const canNext = STEPS.map((_,i)=>{
    if(i===0) return true; // event type always selected
    if(needsCycleSelect && i===1) return !!sourceCycle; // must pick a cycle
    if(i===econStep) return (econ.gmvProjected||0)>0 && (econ.netTakePct||0)>0;
    if(i===termsStep) return !!terms.start && !!terms.label;
    return true;
  });
  const currentStepComplete = canNext[step];

  function handleConfirm(){
    const newCycle = {
      id:uid(), ...econ, ...terms,
      gmvActual:0, type:eventType, active:eventType!=="amendment",
    };

    // Auto-generate milestones
    const newMs = [...(a.milestones||[])];
    if(terms.end){
      newMs.push({id:uid(),type:"event_date",date:terms.end,title:`${terms.label} — ends`,note:"Contract period ends.",done:false});
      const payDue=new Date(terms.end); payDue.setMonth(payDue.getMonth()+1);
      newMs.push({id:uid(),type:"payment",date:payDue.toISOString().slice(0,10),title:`Payment due — ${terms.label}`,note:terms.paymentTerms,done:false});
      const renWin=new Date(terms.end); renWin.setMonth(renWin.getMonth()-2);
      newMs.push({id:uid(),type:"renewal",date:renWin.toISOString().slice(0,10),title:`Renewal window opens — ${terms.label}`,note:"Start renewal outreach 2 months before end.",done:false});
    }

    // Archive current active cycles if this is a full renewal (not amendment)
    const updatedCycles = eventType==="amendment"
      ? [...cycles, newCycle]
      : [...cycles.map(c=>({...c,active:false})), newCycle];

    onSave({
      ...a,
      tier:"active", health:"green",
      contractCycle:(a.contractCycle||0)+(eventType==="amendment"?0:1),
      cycles:updatedCycles,
      milestones:newMs,
      contract:{...a.contract,...econ,...terms,gmvActual:0,gmvProjected:econ.gmvProjected,start:terms.start,end:terms.end},
    });
    onCancel();
  }

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300}} onClick={onCancel}>
      <div style={{width:580,maxHeight:"90vh",overflow:"auto",background:"#fff",borderRadius:12,boxShadow:"0 20px 60px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{padding:"20px 24px",borderBottom:`1px solid ${S.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:3}}>Contract wizard · {a.account}</div>
            <div style={{fontSize:16,fontWeight:700,color:T.ink}}>{STEPS[step]}</div>
          </div>
          <button onClick={onCancel} style={{background:"none",border:`1px solid ${S.border}`,borderRadius:6,width:28,height:28,cursor:"pointer",fontSize:16,color:S.inactiveText,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>

        {/* Progress bar */}
        <div style={{display:"flex",padding:"0 24px",borderBottom:`1px solid ${S.border}`}}>
          {STEPS.map((s,i)=>(
            <div key={i} onClick={()=>i<step&&setStep(i)} style={{flex:1,padding:"9px 0",fontSize:11,fontWeight:i===step?600:400,color:i===step?T.purple:i<step?T.green:S.labelText,borderBottom:`2px solid ${i===step?T.purple:i<step?T.green:"transparent"}`,textAlign:"center",cursor:i<step?"pointer":"default"}}>
              {i<step?"✓ ":""}{s}
            </div>
          ))}
        </div>

        <div style={{padding:"24px"}}>

          {/* STEP 0 — Event type */}
          {step===0&&<>
            <div style={{fontSize:13,color:S.inactiveText,marginBottom:20,lineHeight:1.6}}>What kind of contract event is this?</div>
            {[
              {id:"new",label:"New contract",desc:"First engagement or a completely new deal. Starts from your account defaults.",icon:"✦"},
              {id:"renewal",label:"Renewal",desc:"Same client, new cycle. You'll pick which previous contract to build from — terms and economics pre-fill.",icon:"↻"},
              {id:"amendment",label:"Amendment",desc:"Mid-cycle scope or terms change to an existing contract. Adds to the active cycle without closing it.",icon:"✎"},
            ].map(opt=>(
              <div key={opt.id} onClick={()=>{setEventType(opt.id);setSourceCycle(null);setStep(0);}} style={{border:`1px solid ${eventType===opt.id?T.purple:S.border}`,borderRadius:8,padding:"14px 16px",marginBottom:10,cursor:"pointer",background:eventType===opt.id?T.purpleSoft:"#fff",display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{width:32,height:32,borderRadius:7,background:eventType===opt.id?T.purple:S.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:eventType===opt.id?"#fff":S.inactiveText,flexShrink:0}}>{opt.icon}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:eventType===opt.id?T.purple:T.ink,marginBottom:3}}>{opt.label}</div>
                  <div style={{fontSize:12,color:S.inactiveText,lineHeight:1.45}}>{opt.desc}</div>
                </div>
              </div>
            ))}
            {cycles.length===0&&eventType!=="new"&&<div style={{marginTop:8,padding:"10px 14px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:7,fontSize:12,color:"#92400E"}}>
              ⚠ No previous contracts on file for {a.account}. Switch to "New contract" or add a first contract first.
            </div>}
          </>}

          {/* STEP cycle select — only for renewal/amendment */}
          {step===cycleStep&&cycleStep>0&&<>
            <div style={{fontSize:13,color:S.inactiveText,marginBottom:20,lineHeight:1.6}}>
              {eventType==="renewal"
                ? "Pick the contract you're renewing. Economics and terms will pre-fill from it — you can adjust anything in the next steps."
                : "Pick the active contract you're amending. The amendment will be added alongside it."}
            </div>
            {(eventType==="amendment"?cycles.filter(c=>c.active):allCycles).map(cy=>{
              const isSelected = sourceCycle?.id===cy.id;
              const pct = cy.gmvProjected>0?Math.round(100*(cy.gmvActual||0)/cy.gmvProjected):null;
              return(
                <div key={cy.id} onClick={()=>selectSource(cy)} style={{border:`1px solid ${isSelected?T.purple:S.border}`,borderRadius:8,padding:"14px 16px",marginBottom:10,cursor:"pointer",background:isSelected?T.purpleSoft:"#fff"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                    <span style={{fontSize:13,fontWeight:600,color:isSelected?T.purple:T.ink,flex:1}}>{cy.label||"Unnamed cycle"}</span>
                    {cy.active&&<Tag label="Active" c={T.purple} s={T.purpleSoft}/>}
                    {isSelected&&<Tag label="Selected ✓" c={T.green} s={T.greenSoft}/>}
                  </div>
                  <div style={{display:"flex",gap:20,fontSize:12,color:S.inactiveText}}>
                    <span>{cy.start||"—"}{cy.end?` → ${cy.end}`:""}</span>
                    <span>{cy.netTakePct||10}% net take</span>
                    {cy.gmvProjected>0&&<span>{fmtK(cy.gmvActual||0)} / {fmtK(cy.gmvProjected)} GMV{pct!==null?` (${pct}%)`:""}</span>}
                    {cy.products?.length>0&&<span>{cy.products.join(", ")}</span>}
                  </div>
                  {cy.notes&&<div style={{fontSize:11.5,color:S.labelText,marginTop:4,fontStyle:"italic"}}>{cy.notes}</div>}
                </div>
              );
            })}
            {eventType==="amendment"&&cycles.filter(c=>c.active).length===0&&(
              <div style={{padding:"16px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,fontSize:12,color:"#92400E"}}>
                ⚠ No active contracts to amend. Start a new contract or renewal first.
              </div>
            )}
          </>}

          {/* STEP Economics */}
          {step===econStep&&<>
            <div style={{fontSize:13,color:S.inactiveText,marginBottom:4,lineHeight:1.6}}>Set the financial terms for this cycle.</div>
            {sourceCycle&&<div style={{fontSize:12,color:S.labelText,marginBottom:16}}>Pre-filled from: <b style={{color:T.ink}}>{sourceCycle.label}</b>{eventType==="renewal"?" — GMV bumped 10% as a starting estimate":""}</div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <div style={{gridColumn:"1/-1"}}>
                <label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>GMV projected ($)</label>
                <input type="number" value={econ.gmvProjected||""} onChange={e=>upE("gmvProjected",+e.target.value)} style={{width:"100%",padding:"9px 12px",border:`1px solid ${S.border}`,borderRadius:7,fontSize:15,fontFamily:sans,outline:"none",boxSizing:"border-box",fontWeight:600}}/>
              </div>
              <div>
                <label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>Platform fee %</label>
                <input type="number" value={econ.platformFeePct||""} onChange={e=>{upE("platformFeePct",+e.target.value);upE("netTakePct",+((+e.target.value)-(econ.kickbackPct||0)).toFixed(2));}} style={{width:"100%",padding:"9px 12px",border:`1px solid ${S.border}`,borderRadius:7,fontSize:14,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>Net take % <span style={{color:T.purple,fontWeight:700}}>(auto)</span></label>
                <input type="number" value={econ.netTakePct||""} onChange={e=>upE("netTakePct",+e.target.value)} style={{width:"100%",padding:"9px 12px",border:`2px solid ${T.purple}`,borderRadius:7,fontSize:14,fontFamily:sans,outline:"none",boxSizing:"border-box",fontWeight:600}}/>
              </div>
              <div>
                <label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>Kickback % (if any)</label>
                <input type="number" value={econ.kickbackPct||""} onChange={e=>{upE("kickbackPct",+e.target.value);upE("netTakePct",+((econ.platformFeePct||0)-(+e.target.value)).toFixed(2));}} placeholder="0" style={{width:"100%",padding:"9px 12px",border:`1px solid ${S.border}`,borderRadius:7,fontSize:14,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div>
                <label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>Kickback to</label>
                <input value={econ.kickbackTo||""} onChange={e=>upE("kickbackTo",e.target.value)} placeholder="Partner name" style={{width:"100%",padding:"9px 12px",border:`1px solid ${S.border}`,borderRadius:7,fontSize:14,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/>
              </div>
            </div>
            {econ.gmvProjected>0&&<div style={{padding:"14px 16px",background:"#F9FAFB",border:`1px solid ${S.border}`,borderRadius:8,marginBottom:12}}>
              <div style={{fontSize:12,color:S.inactiveText,marginBottom:4}}>Projected fees at {econ.netTakePct}% net take</div>
              <div style={{fontSize:26,fontWeight:700,color:T.ink,letterSpacing:-1}}>{fmt(fees)}</div>
              {sourceCycle&&sourceCycle.gmvProjected>0&&<div style={{fontSize:12,color:S.inactiveText,marginTop:4}}>
                vs. {fmtK(sourceCycle.gmvProjected)} projected in {sourceCycle.label} ({econ.gmvProjected>sourceCycle.gmvProjected?"↑":"↓"}{Math.round(Math.abs(100*(econ.gmvProjected-sourceCycle.gmvProjected)/sourceCycle.gmvProjected))}%)
              </div>}
            </div>}
            {deviations.filter(d=>d.includes("rate")||d.includes("Take")).length>0&&<div style={{padding:"10px 14px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:7,fontSize:12,color:"#92400E"}}>
              {deviations.filter(d=>d.includes("rate")||d.includes("Take")).map((d,i)=><div key={i}>⚠ {d}</div>)}
            </div>}
          </>}

          {/* STEP Terms */}
          {step===termsStep&&<>
            <div style={{fontSize:13,color:S.inactiveText,marginBottom:16,lineHeight:1.6}}>Set contract terms. Fields pre-filled from {sourceCycle?sourceCycle.label:"account defaults"} — adjust what changed.</div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>Cycle label</label>
              <input value={terms.label} onChange={e=>upT("label",e.target.value)} style={{width:"100%",padding:"9px 12px",border:`1px solid ${S.border}`,borderRadius:7,fontSize:14,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>Start</label><input type="month" value={terms.start} onChange={e=>upT("start",e.target.value)} style={{width:"100%",padding:"9px 12px",border:`1px solid ${S.border}`,borderRadius:7,fontSize:14,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/></div>
              <div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>End</label><input type="month" value={terms.end} onChange={e=>upT("end",e.target.value)} style={{width:"100%",padding:"9px 12px",border:`1px solid ${S.border}`,borderRadius:7,fontSize:14,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/></div>
              <div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>Payment terms</label>
                <select value={PAYMENT_TERMS.includes(terms.paymentTerms)?terms.paymentTerms:"Custom"} onChange={e=>{if(e.target.value!=="Custom")upT("paymentTerms",e.target.value);}} style={{width:"100%",padding:"9px 12px",border:`1px solid ${S.border}`,borderRadius:7,fontSize:14,fontFamily:sans,outline:"none",background:"#fff",marginBottom:PAYMENT_TERMS.includes(terms.paymentTerms)?0:6}}>
                  {PAYMENT_TERMS.map(o=><option key={o}>{o}</option>)}
                </select>
                {(!PAYMENT_TERMS.includes(terms.paymentTerms)||terms.paymentTerms==="Custom")&&<input value={terms.paymentTerms==="Custom"?"":terms.paymentTerms} onChange={e=>upT("paymentTerms",e.target.value)} placeholder="Describe custom terms" style={{width:"100%",padding:"8px 12px",border:`1px solid ${S.border}`,borderRadius:7,fontSize:13,fontFamily:sans,outline:"none",boxSizing:"border-box",marginTop:6}}/>}
              </div>
              <div>
                <label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>Liability cap ($)</label>
                {!terms.liabilityCapNA&&<input type="number" value={terms.liabilityCap||""} onChange={e=>upT("liabilityCap",+e.target.value)} placeholder="e.g. 200000" style={{width:"100%",padding:"9px 12px",border:`1px solid ${!terms.liabilityCap&&!terms.liabilityCapNA?T.red:S.border}`,borderRadius:7,fontSize:14,fontFamily:sans,outline:"none",boxSizing:"border-box",marginBottom:6}}/>}
                <div onClick={()=>{upT("liabilityCapNA",!terms.liabilityCapNA);if(!terms.liabilityCapNA)upT("liabilityCap",0);}} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                  <div style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${terms.liabilityCapNA?T.purple:S.border}`,background:terms.liabilityCapNA?T.purple:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>{terms.liabilityCapNA&&<span style={{color:"#fff",fontSize:10,lineHeight:1}}>✓</span>}</div>
                  <span style={{fontSize:12,color:terms.liabilityCapNA?T.purple:S.inactiveText}}>Not required in this contract</span>
                </div>
              </div>
              <div>
                <label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>SLA target %</label>
                {!terms.slaNA&&<input type="number" value={terms.slaTarget||""} onChange={e=>upT("slaTarget",+e.target.value)} placeholder="e.g. 99.9" style={{width:"100%",padding:"9px 12px",border:`1px solid ${S.border}`,borderRadius:7,fontSize:14,fontFamily:sans,outline:"none",boxSizing:"border-box",marginBottom:6}}/>}
                <div onClick={()=>{upT("slaNA",!terms.slaNA);if(!terms.slaNA)upT("slaTarget",0);}} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                  <div style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${terms.slaNA?T.purple:S.border}`,background:terms.slaNA?T.purple:"#fff",display:"flex",alignItems:"center",justifyContent:"center"}}>{terms.slaNA&&<span style={{color:"#fff",fontSize:10,lineHeight:1}}>✓</span>}</div>
                  <span style={{fontSize:12,color:terms.slaNA?T.purple:S.inactiveText}}>Not required in this contract</span>
                </div>
              </div>
              <div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>Termination notice</label><input value={terms.terminationNotice} onChange={e=>upT("terminationNotice",e.target.value)} style={{width:"100%",padding:"9px 12px",border:`1px solid ${S.border}`,borderRadius:7,fontSize:14,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/></div>
            </div>
            <div style={{marginBottom:12}}><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>Data rights</label><input value={terms.dataRights} onChange={e=>upT("dataRights",e.target.value)} style={{width:"100%",padding:"9px 12px",border:`1px solid ${S.border}`,borderRadius:7,fontSize:14,fontFamily:sans,outline:"none",boxSizing:"border-box"}}/></div>
            <div style={{display:"flex",gap:10,marginBottom:12}}>
              {[["Auto-renew","autoRenew"],["Exclusivity","exclusive"]].map(([l,k])=>(
                <div key={k} onClick={()=>upT(k,!terms[k])} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between",border:`1px solid ${terms[k]?T.purple:S.border}`,borderRadius:7,padding:"10px 14px",cursor:"pointer",background:terms[k]?T.purpleSoft:"#fff"}}>
                  <span style={{fontSize:13,fontWeight:500,color:terms[k]?T.purple:T.ink}}>{l}</span>
                  <div style={{width:36,height:20,borderRadius:10,background:terms[k]?T.purple:"#D1D5DB",padding:2,display:"flex",alignItems:"center",transition:"background .2s"}}><div style={{width:16,height:16,borderRadius:"50%",background:"#fff",transform:terms[k]?"translateX(16px)":"translateX(0)",transition:"transform .2s"}}/></div>
                </div>
              ))}
            </div>
            <div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>Notes</label><textarea value={terms.notes} onChange={e=>upT("notes",e.target.value)} style={{width:"100%",padding:"9px 12px",border:`1px solid ${S.border}`,borderRadius:7,fontSize:13,fontFamily:sans,outline:"none",resize:"none",minHeight:56,boxSizing:"border-box"}}/></div>
            {deviations.length>0&&<div style={{marginTop:12,padding:"10px 14px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:7}}>
              <div style={{fontSize:12,fontWeight:600,color:"#92400E",marginBottom:4}}>Non-standard terms</div>
              {deviations.map((d,i)=><div key={i} style={{fontSize:12,color:"#92400E"}}>⚠ {d}</div>)}
            </div>}
          </>}

          {/* STEP Review */}
          {step===reviewStep&&<>
            <div style={{fontSize:13,color:S.inactiveText,marginBottom:16,lineHeight:1.6}}>Review before creating. {eventType==="amendment"?"This amendment will be added alongside the active cycle.":eventType==="renewal"?"Current active cycle will be archived and replaced by this renewal.":"This will create the first contract cycle for this account."}</div>
            {sourceCycle&&<div style={{padding:"10px 14px",background:"#F9FAFB",border:`1px solid ${S.border}`,borderRadius:7,marginBottom:12,fontSize:12,color:S.inactiveText}}>Building from: <b style={{color:T.ink}}>{sourceCycle.label}</b></div>}
            <div style={{border:`1px solid ${S.border}`,borderRadius:8,overflow:"hidden",marginBottom:14}}>
              {[
                ["Label",terms.label],
                ["Type",eventType==="new"?"New contract":eventType==="renewal"?"Renewal":"Amendment"],
                ["Period",`${terms.start||"—"} → ${terms.end||"—"}`],
                ["GMV projected",fmtK(econ.gmvProjected)],
                ["Net take",econ.netTakePct+"%"],
                ["Projected fees",fmt(fees)],
                ["Payment",terms.paymentTerms],
                ["Liability cap",terms.liabilityCapNA?"Not required":terms.liabilityCap?fmt(terms.liabilityCap):"⚠ Uncapped"],
              ].map(([k,v],i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 16px",borderTop:i?`1px solid ${S.border}`:"none"}}>
                  <span style={{fontSize:13,color:S.inactiveText}}>{k}</span>
                  <span style={{fontSize:13,fontWeight:500,color:String(v).startsWith("⚠")?T.red:T.ink}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{padding:"12px 14px",background:"#F0FDF4",border:`1px solid ${T.green}`,borderRadius:7,marginBottom:12}}>
              <div style={{fontSize:12,fontWeight:600,color:T.green,marginBottom:3}}>Milestones to be created</div>
              {terms.end
                ?<div style={{fontSize:12,color:T.green,lineHeight:1.6}}>· Contract end ({terms.end})<br/>· Payment due (30d after end)<br/>· Renewal window opens (2mo before end)</div>
                :<div style={{fontSize:12,color:"#B45309"}}>⚠ Set an end date to auto-generate payment and renewal milestones</div>}
            </div>
            {deviations.length>0&&<div style={{padding:"10px 14px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:7}}>
              <div style={{fontSize:12,fontWeight:600,color:"#92400E",marginBottom:3}}>Flagged</div>
              {deviations.map((d,i)=><div key={i} style={{fontSize:12,color:"#92400E"}}>⚠ {d}</div>)}
            </div>}
          </>}
        </div>

        {/* Footer */}
        <div style={{padding:"16px 24px",borderTop:`1px solid ${S.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <button onClick={()=>step>0?setStep(step-1):onCancel()} style={{...VBtn.secondary,fontSize:13}}>{step===0?"Cancel":"← Back"}</button>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {STEPS.map((_,i)=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:i===step?T.purple:i<step?T.green:"#D1D5DB"}}/>)}
          </div>
          {step<STEPS.length-1
            ?<button disabled={!currentStepComplete} onClick={()=>setStep(step+1)} style={{...VBtn.primary,fontSize:13,opacity:currentStepComplete?1:.4}}>Next →</button>
            :<button onClick={handleConfirm} style={{...VBtn.primary,fontSize:13,background:T.green}}>Create ✓</button>
          }
        </div>
      </div>
    </div>
  );
}

function AccountForm({orgId,existing,onCancel,onSave}){
  const blank={id:uid(),orgId,account:"",short:"",logo:"#6C5FE0",tier:"active",health:"green",owner:"Carter",products:[],eventType:EVENT_TYPES[0],sponsorMode:SPONSOR_MODES[0],value:"",costs:[],kpis:{},contractCycle:0,milestones:[],cycles:[],chargebacks:[],features:[],comms:"",summary:"",signal:"",fault:{verdict:"neither",reasoning:"",against_us:"",against_them:""},obligations:[],risks:[],signals_pending:[],flags:[],contract:null};
  const [f,setF]=useState(existing||blank);
  const up=(k,v)=>setF(p=>({...p,[k]:v}));
  const toggleProduct=p=>{const cur=f.products||[];up("products",cur.includes(p)?cur.filter(x=>x!==p):[...cur,p]);};
  return <>
    <div style={{marginBottom:18}}>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:8}}>Basics</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
        <div style={{gridColumn:"1/-1"}}><EF label="Account name" value={f.account} onChange={v=>{up("account",v);up("short",v.slice(0,2).toUpperCase());}} placeholder="e.g. Cage Titans"/></div>
        <EF label="Owner" value={f.owner} onChange={v=>up("owner",v)}/>
        <EF label="Deal value" value={f.value} onChange={v=>up("value",v)} placeholder="~$422K GMV"/>
      </div>
    </div>
    <div style={{marginBottom:18}}>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:8}}>CRM tier</div>
      <div style={{display:"flex",gap:8}}>
        {Object.entries(CRM_TIERS).filter(([k])=>k!=="archived").map(([k,v])=>(
          <button key={k} onClick={()=>up("tier",k)} style={{flex:1,padding:"7px",borderRadius:6,fontFamily:sans,fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${f.tier===k?v.c:S.border}`,background:f.tier===k?v.s:"#fff",color:f.tier===k?v.c:S.inactiveText}}>{v.label}</button>
        ))}
      </div>
    </div>
    <div style={{marginBottom:18}}>
      <div style={{fontSize:11,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",color:S.labelText,marginBottom:8}}>Products</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
        {PRODUCTS.map(p=><button key={p} onClick={()=>toggleProduct(p)} style={{padding:"8px 10px",borderRadius:6,fontFamily:sans,fontSize:12,fontWeight:500,cursor:"pointer",border:`1px solid ${(f.products||[]).includes(p)?T.purple:S.border}`,background:(f.products||[]).includes(p)?T.purpleSoft:"#fff",color:(f.products||[]).includes(p)?T.purple:S.inactiveText,textAlign:"left"}}>{p}</button>)}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:18}}>
      <div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>Event type</label><select value={f.eventType} onChange={e=>up("eventType",e.target.value)} style={{width:"100%",padding:"8px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",background:"#fff"}}>{EVENT_TYPES.map(o=><option key={o}>{o}</option>)}</select></div>
      <div><label style={{fontSize:11,color:S.labelText,fontWeight:600,textTransform:"uppercase",letterSpacing:.4,display:"block",marginBottom:5}}>Sponsor</label><select value={f.sponsorMode} onChange={e=>up("sponsorMode",e.target.value)} style={{width:"100%",padding:"8px 10px",border:`1px solid ${S.border}`,borderRadius:6,fontSize:13,fontFamily:sans,outline:"none",background:"#fff"}}>{SPONSOR_MODES.map(o=><option key={o}>{o}</option>)}</select></div>
    </div>
    {existing&&<div style={{padding:"12px",background:"#F9FAFB",border:`1px solid ${S.border}`,borderRadius:7,marginBottom:16,fontSize:12,color:S.inactiveText}}>
      Add or renew contracts via the <b style={{color:T.purple}}>+ Contract</b> button in the account header.
    </div>}
    <button disabled={!f.account} onClick={()=>onSave({...f})} style={{...VBtn.primary,width:"100%",justifyContent:"center",fontSize:14,padding:"11px",opacity:f.account?1:.4}}>{existing?"Save changes":"Create account"}</button>
  </>;
}
