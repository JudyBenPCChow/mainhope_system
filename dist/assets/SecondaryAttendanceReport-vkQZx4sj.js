const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/jspdf.es.min-BT-051Kg.js","assets/index-DLh3It7x.js","assets/index-BNMLOV_0.css"])))=>i.map(i=>d[i]);
import{U as le,V as re,s as _,G as de,X as oe,F as ce,H as R,K as L,Y as ie,_ as F,Z as ue,r as v,i as E,a as H,j as e,g as me,S as Y,$ as U,b as q,R as pe,e as he,c as fe,D as xe,a0 as ge,T as Z,a1 as be,P as je}from"./index-DLh3It7x.js";const we=new Set(["現場","錄影回放","zoom實時網課","出席","網課","補課","線上","即時直播"]);function ye(s){const t=String(s??"").trim();return t?!!(we.has(t)||t.includes("網課")||t.includes("線上")&&!t.includes("假")):!1}function Ne(s){const t=String(s??"").trim();return t?!!(t==="no show"||t.includes("缺席")):!1}const D=["中一","中二","中三","中四","中五","中六"],ke=new Set(D),ve=new Set(["中一","中二","中三"]),_e=new Set(["中四","中五","中六"]),J=[{key:"juniorGroup",label:"初中小組",band:"junior",classKind:"group"},{key:"seniorGroup",label:"高中小組",band:"senior",classKind:"group"},{key:"juniorPrivate",label:"初中一對一",band:"junior",classKind:"private"},{key:"seniorPrivate",label:"高中一對一",band:"senior",classKind:"private"}];function $(s){return s==="private"?"一對一":"小組"}function Se(s){return ve.has(s)?"junior":_e.has(s)?"senior":null}function $e(s,t){return s==="junior"?t==="group"?"juniorGroup":"juniorPrivate":t==="group"?"seniorGroup":"seniorPrivate"}function Ce(s){for(const t of D)if(s.includes(t))return t;return null}function K(s){return s.notRolled?0:s.presentStudents.length}function z(s){return s.notRolled?0:s.absentStudents.length}function C(s){return s.lessons.reduce((t,n)=>t+K(n),0)}function T(s){return s.lessons.reduce((t,n)=>t+z(n),0)}function M(s){return s.classes.reduce((t,n)=>t+C(n),0)}function I(s){return s.classes.reduce((t,n)=>t+T(n),0)}function V(s){return s.classes.reduce((t,n)=>t+n.lessons.length,0)}function B(s){return s.grades.reduce((t,n)=>t+M(n),0)}function G(s){return s.grades.reduce((t,n)=>t+I(n),0)}function Q(s){return s.grades.reduce((t,n)=>t+V(n),0)}function ee(s){return s.grades.reduce((t,n)=>t+n.classes.length,0)}function Te(s){return{key:s.key,label:s.label,band:s.band,classKind:s.classKind,classCount:0,lessonCount:0,presentVisits:0,absentVisits:0,gradeIds:new Set}}function O(s){const t=new Map;for(const n of J)t.set(n.key,Te(n));for(const n of s.grades){const a=Se(n.gradeLabel);if(a)for(const r of n.classes){const l=$e(a,r.classKind),o=t.get(l);o.gradeIds.add(n.gradeLabel),o.classCount+=1,o.lessonCount+=r.lessons.length,o.presentVisits+=C(r),o.absentVisits+=T(r)}}return J.map(n=>t.get(n.key))}function se(s){const t=[];for(const n of s.grades)for(const a of["group","private"]){const r=n.classes.filter(l=>l.classKind===a);r.length!==0&&t.push({gradeLabel:n.gradeLabel,classKind:a,classCount:r.length,lessonCount:r.reduce((l,o)=>l+o.lessons.length,0),presentVisits:r.reduce((l,o)=>l+C(o),0),absentVisits:r.reduce((l,o)=>l+T(o),0)})}return t}function X(){const s=new Date,t=s.getFullYear(),n=String(s.getMonth()+1).padStart(2,"0");return`${t}-${n}`}function Ae(s){return s.includes("取消")}async function Pe(s){const t=new Map;if(!_||s.length===0)return t;const n=await R(s,L,async a=>{const{data:r,error:l}=await _.from("attendance_details").select("id, schedule_id, status, students ( full_name )").in("schedule_id",a);if(l)throw l;return r??[]});for(const a of n)for(const r of a){const l=r.schedule_id!=null?String(r.schedule_id):"";if(!l)continue;const o=r.students,m=(o==null?void 0:o.full_name)!=null&&String(o.full_name).trim()!==""?String(o.full_name).trim():"—",f=t.get(l)??[];f.push({scheduleId:l,status:String(r.status??""),studentName:m}),t.set(l,f)}return t}async function Ee(s){const t=new Map;if(!_||s.length===0)return t;const n=await R(s,L,async r=>{const{data:l,error:o}=await _.from("trial_sessions").select("schedule_id, status, students ( full_name )").in("schedule_id",r);if(o)throw o;return l??[]});for(const r of n)for(const l of r){const o=String(l.status??"");if(o.includes("取消")||o.includes("完成"))continue;const m=l.schedule_id!=null?String(l.schedule_id):"";if(!m)continue;const f=l.students,b=(f==null?void 0:f.full_name)!=null?String(f.full_name).trim():"";if(!b)continue;const k=t.get(m)??{trialNames:[],makeupNames:[]};k.trialNames.push(b),t.set(m,k)}const a=await R(s,L,async r=>{const{data:l,error:o}=await _.from("leave_makeup_records").select("makeup_schedule_id, students ( full_name )").in("makeup_schedule_id",r);if(o)throw o;return l??[]});for(const r of a)for(const l of r){const o=l.makeup_schedule_id!=null?String(l.makeup_schedule_id):"";if(!o)continue;const m=l.students,f=(m==null?void 0:m.full_name)!=null?String(m.full_name).trim():"";if(!f)continue;const b=t.get(o)??{trialNames:[],makeupNames:[]};b.makeupNames.push(f),t.set(o,b)}return t}function Re(s,t){if(!t)return;const n=new Set(s),a=[...new Set(t.trialNames.filter(o=>n.has(o)))],r=[...new Set(t.makeupNames.filter(o=>n.has(o)))],l=[];return a.length>0&&l.push(`含試堂：${a.join("、")}`),r.length>0&&l.push(`含補堂：${r.join("、")}`),l.length>0?l.join("；"):void 0}async function Le(s){const t=le(s),{start:n,end:a}=re(t);if(!_)return{yearMonth:t,fromYmd:n,toYmd:a,teachers:[]};const{data:r,error:l}=await _.from("schedules").select("id, scheduled_date, start_time, end_time, status, teacher_id, class_id, teachers!schedules_teacher_id_fkey ( id, full_name ), classes ( id, subject, class_kind, grade, course_code_full, courses ( course_name, grade_code ) )").gte("scheduled_date",n).lte("scheduled_date",a).not("teacher_id","is",null).order("scheduled_date",{ascending:!0}).order("start_time",{ascending:!0});if(l)throw l;const o=[];for(const d of r??[]){const h=String(d.status??"");if(Ae(h))continue;const i=d.teacher_id!=null?String(d.teacher_id):"";if(!i)continue;const x=d.classes;if(!x)continue;const j=x.courses,c=Array.isArray(x.grade)?x.grade:null,u=(j==null?void 0:j.grade_code)!=null?String(j.grade_code):null,w=de(c,u).filter(ne=>ke.has(ne)),g=Ce(w);if(!g)continue;const A=x.subject!=null?String(x.subject):"—",P=x.course_code_full!=null?String(x.course_code_full):null,te=(j==null?void 0:j.course_name)!=null?String(j.course_name):null,S=d.teachers,ae=(S==null?void 0:S.full_name)!=null&&String(S.full_name).trim()!==""?String(S.full_name).trim():"—";o.push({id:String(d.id),scheduledDate:String(d.scheduled_date??""),startTime:d.start_time!=null?String(d.start_time).slice(0,5):"",endTime:d.end_time!=null?String(d.end_time).slice(0,5):"",teacherId:i,teacherName:ae,classId:String(x.id??d.class_id??""),className:ce({subject:A,courseCode:P,courseName:te}),classKind:oe(x.class_kind!=null?String(x.class_kind):null,A),gradeLabel:g})}const m=o.map(d=>d.id),[f,b]=await Promise.all([Pe(m),Ee(m).catch(()=>new Map)]),k=new Map;for(const d of o){const h=`${d.teacherId}::${d.gradeLabel}::${d.classId}`;let i=k.get(h);i||(i={id:d.classId,name:d.className,classKind:d.classKind,gradeLabel:d.gradeLabel,teacherId:d.teacherId,teacherName:d.teacherName,lessons:[]},k.set(h,i));const x=f.get(d.id)??[],j=[],c=[];for(const g of x)ye(g.status)?j.push(g.studentName):Ne(g.status)&&c.push(g.studentName);const u=x.length===0,w=u?void 0:Re(j,b.get(d.id));i.lessons.push({id:d.id,date:d.scheduledDate,startTime:d.startTime||"—",endTime:d.endTime||"—",presentStudents:j,absentStudents:c,notRolled:u,makeupOrTrialNote:w})}const N=new Map;for(const d of k.values()){let h=N.get(d.teacherId);h||(h={id:d.teacherId,name:d.teacherName,grades:new Map},N.set(d.teacherId,h));const i=h.grades.get(d.gradeLabel)??[];i.push({id:d.id,name:d.name,classKind:d.classKind,lessons:d.lessons}),h.grades.set(d.gradeLabel,i)}const p=[...N.values()].map(d=>{const h=D.filter(i=>d.grades.has(i)).map(i=>({gradeLabel:i,classes:(d.grades.get(i)??[]).sort((x,j)=>x.name.localeCompare(j.name,"zh-Hant"))}));return{id:d.id,name:d.name,grades:h}}).sort((d,h)=>d.name.localeCompare(h.name,"zh-Hant"));return{yearMonth:t,fromYmd:n,toYmd:a,teachers:p}}function y(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function De(s,t,n){const a=s.map(l=>`<tr>
    <td class="left">${y(l.label)}</td>
    <td class="num">${l.gradeIds.size}</td>
    <td class="num">${l.classCount}</td>
    <td class="num">${l.lessonCount}</td>
    <td class="num strong">${l.presentVisits}</td>
    <td class="num">${l.absentVisits}</td>
  </tr>`).join(""),r=l=>s.reduce((o,m)=>o+l(m),0);return`${a}
  <tr class="total-row">
    <td class="left">合計</td>
    <td class="num">—</td>
    <td class="num">${r(l=>l.classCount)}</td>
    <td class="num">${r(l=>l.lessonCount)}</td>
    <td class="num strong">${t}</td>
    <td class="num">${n}</td>
  </tr>`}function Ke(s){const t=$(s.classKind),n=s.lessons.map(a=>{if(a.notRolled)return`<tr>
          <td class="left nowrap">${y(a.date)}</td>
          <td class="left nowrap">${y(a.startTime)}–${y(a.endTime)}</td>
          <td class="num">—</td>
          <td class="num">—</td>
          <td class="left"><span class="badge">未點名</span></td>
          <td class="left muted">尚無點名紀錄</td>
        </tr>`;const r=K(a),l=z(a),o=a.presentStudents.map(b=>y(b)).join("、")||"—",m=a.absentStudents.map(b=>y(b)).join("、")||"—",f=a.makeupOrTrialNote?`<div class="note">${y(a.makeupOrTrialNote)}</div>`:"";return`<tr>
        <td class="left nowrap">${y(a.date)}</td>
        <td class="left nowrap">${y(a.startTime)}–${y(a.endTime)}</td>
        <td class="num strong">${r}</td>
        <td class="num">${l}</td>
        <td class="left names">${o}${f}</td>
        <td class="left names">${m}</td>
      </tr>`}).join("");return`<table class="data class-table" cellspacing="0" cellpadding="0">
    <colgroup>
      <col style="width:12%" /><col style="width:12%" /><col style="width:8%" />
      <col style="width:8%" /><col style="width:30%" /><col style="width:30%" />
    </colgroup>
    <thead>
      <tr class="class-title">
        <th colspan="6" class="left">
          ${y(s.name)}
          <span class="sub">　${t} · 本班出席 ${C(s)} 人次 · 缺席 ${T(s)} 人次 · ${s.lessons.length} 堂</span>
        </th>
      </tr>
      <tr>
        <th class="left">日期</th>
        <th class="left">時段</th>
        <th class="num">出席</th>
        <th class="num">缺席</th>
        <th class="left">出席學生</th>
        <th class="left">缺席學生</th>
      </tr>
    </thead>
    <tbody>${n}</tbody>
  </table>`}const ze=`
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    font-family: "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", "Hiragino Sans GB", sans-serif;
    color: #111827;
    font-size: 11px;
    line-height: 1.4;
    -webkit-font-smoothing: antialiased;
  }
  .sheet, .pdf-page {
    width: 794px;
    padding: 32px 36px 28px;
    background: #fff;
  }
  .pdf-page { min-height: 1040px; }
  .measure-root { position: absolute; left: -10000px; top: 0; width: 794px; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; border-spacing: 0; }
  .title-block td { vertical-align: top; padding: 0; border: none; }
  .doc-title { font-size: 20px; font-weight: 700; letter-spacing: 0.02em; margin: 0; }
  .doc-sub { margin: 6px 0 0; color: #4b5563; font-size: 11px; }
  .rule { height: 2px; background: #111827; margin: 12px 0 14px; border: none; }
  .meta-table td { border: none; padding: 2px 0; font-size: 11px; color: #374151; }
  .meta-table .label { width: 72px; color: #6b7280; }
  .kpi-table { margin: 0 0 12px; }
  .kpi-table td {
    border: 1px solid #d1d5db; padding: 9px 6px; text-align: center;
    vertical-align: middle; background: #f9fafb;
  }
  .kpi-table .k-label { display: block; font-size: 9px; color: #6b7280; margin-bottom: 3px; }
  .kpi-table .k-value { display: block; font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .kpi-table .c-jg { background: #eff6ff; }
  .kpi-table .c-sg { background: #f0fdf4; }
  .kpi-table .c-jp { background: #fff7ed; }
  .kpi-table .c-sp { background: #faf5ff; }
  .section-label {
    margin: 14px 0 8px; font-size: 12px; font-weight: 700; color: #111827;
    border-left: 3px solid #111827; padding-left: 8px;
  }
  .keep-block { margin-bottom: 12px; }
  .data th, .data td {
    border: 1px solid #d1d5db; padding: 6px 7px; vertical-align: top;
    word-wrap: break-word; overflow-wrap: anywhere;
  }
  .data th { background: #f3f4f6; font-size: 10px; font-weight: 700; color: #374151; }
  .data .left { text-align: left; }
  .data .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .data .strong { font-weight: 700; }
  .data .muted { color: #6b7280; }
  .data .nowrap { white-space: nowrap; }
  .data .names { font-size: 10px; line-height: 1.45; }
  .data .total-row td { background: #f3f4f6; font-weight: 700; }
  .class-table .class-title th {
    background: #111827; color: #fff; font-size: 11px; font-weight: 700;
    text-align: left; padding: 8px 10px;
  }
  .class-table .class-title .sub { font-weight: 400; color: #d1d5db; font-size: 10px; }
  .section-head { margin-bottom: 6px; }
  .section-head td { border: none; padding: 2px 0; }
  .badge {
    display: inline-block; padding: 1px 6px; border: 1px solid #f59e0b;
    background: #fffbeb; color: #92400e; font-size: 10px; font-weight: 700;
  }
  .note { margin-top: 4px; color: #4b5563; font-size: 9px; }
  .footer {
    margin-top: 16px; padding-top: 8px; border-top: 1px solid #e5e7eb;
    color: #9ca3af; font-size: 9px;
  }
  .footnote { margin: 6px 0 0; color: #6b7280; font-size: 10px; }
  .page-foot { margin-top: auto; padding-top: 10px; color: #9ca3af; font-size: 9px; border-top: 1px solid #e5e7eb; }
`;function Me(s,t){const n=B(s),a=G(s),r=Q(s),l=ee(s),o=O(s),m=Object.fromEntries(o.map(p=>[p.key,p])),f=se(s),b=new Date().toLocaleString("zh-HK",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}),k=f.map(p=>`<tr>
      <td class="left">${y(p.gradeLabel)}</td>
      <td class="left">${y($(p.classKind))}</td>
      <td class="num">${p.classCount}</td>
      <td class="num">${p.lessonCount}</td>
      <td class="num strong">${p.presentVisits}</td>
      <td class="num">${p.absentVisits}</td>
    </tr>`).join(""),N=s.grades.map(p=>{const d=`<div class="keep-block">
        <table class="section-head" cellspacing="0" cellpadding="0">
          <tr>
            <td class="left"><strong>${y(p.gradeLabel)}</strong></td>
            <td style="text-align:right" class="muted">出席 ${M(p)} 人次 · 缺席 ${I(p)} 人次 · ${p.classes.length} 班 · ${V(p)} 堂</td>
          </tr>
        </table>
      </div>`,h=p.classes.map(i=>`<div class="keep-block">${Ke(i)}</div>`).join("");return d+h}).join("");return`<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<style>${ze}</style>
</head>
<body>
  <div class="measure-root" id="measure-root">
    <div class="keep-block" data-block="cover">
      <table class="title-block" cellspacing="0" cellpadding="0">
        <tr>
          <td class="left">
            <p class="doc-title">老師中學出席計算頁</p>
            <p class="doc-sub">明學管理系統 · 行政處理用</p>
          </td>
          <td style="width:42%;text-align:right">
            <table class="meta-table" cellspacing="0" cellpadding="0" style="margin-left:auto">
              <tr><td class="label">老師</td><td><strong>${y(s.name)}</strong></td></tr>
              <tr><td class="label">統計月份</td><td>${y(t)}</td></tr>
              <tr><td class="label">產生時間</td><td>${y(b)}</td></tr>
            </table>
          </td>
        </tr>
      </table>
      <div class="rule"></div>
      <div class="section-label">總覽（四類分計）</div>
      <table class="kpi-table" cellspacing="0" cellpadding="0">
        <colgroup>
          <col style="width:25%" /><col style="width:25%" /><col style="width:25%" /><col style="width:25%" />
        </colgroup>
        <tr>
          <td class="c-jg"><span class="k-label">初中小組出席</span><span class="k-value">${m.juniorGroup.presentVisits}</span></td>
          <td class="c-sg"><span class="k-label">高中小組出席</span><span class="k-value">${m.seniorGroup.presentVisits}</span></td>
          <td class="c-jp"><span class="k-label">初中一對一出席</span><span class="k-value">${m.juniorPrivate.presentVisits}</span></td>
          <td class="c-sp"><span class="k-label">高中一對一出席</span><span class="k-value">${m.seniorPrivate.presentVisits}</span></td>
        </tr>
        <tr>
          <td><span class="k-label">全月班數</span><span class="k-value">${l}</span></td>
          <td><span class="k-label">全月堂數</span><span class="k-value">${r}</span></td>
          <td><span class="k-label">全月出席人次</span><span class="k-value">${n}</span></td>
          <td><span class="k-label">全月缺席人次</span><span class="k-value">${a}</span></td>
        </tr>
      </table>
      <div class="section-label">四類分計表</div>
      <table class="data" cellspacing="0" cellpadding="0">
        <colgroup>
          <col style="width:24%" /><col style="width:12%" /><col style="width:12%" />
          <col style="width:12%" /><col style="width:20%" /><col style="width:20%" />
        </colgroup>
        <thead>
          <tr>
            <th class="left">類別</th>
            <th class="num">年級數</th>
            <th class="num">班數</th>
            <th class="num">堂數</th>
            <th class="num">出席人次</th>
            <th class="num">缺席人次</th>
          </tr>
        </thead>
        <tbody>${De(o,n,a)}</tbody>
      </table>
      <p class="footnote">人次＝每堂實際出席加總。初中＝中一至中三；高中＝中四至中六。小組／一對一分開計算。</p>
    </div>

    <div class="keep-block" data-block="grade-summary">
      <div class="section-label">各年級 × 類型小計</div>
      <table class="data" cellspacing="0" cellpadding="0">
        <colgroup>
          <col style="width:14%" /><col style="width:14%" /><col style="width:12%" />
          <col style="width:12%" /><col style="width:24%" /><col style="width:24%" />
        </colgroup>
        <thead>
          <tr>
            <th class="left">年級</th>
            <th class="left">類型</th>
            <th class="num">班數</th>
            <th class="num">堂數</th>
            <th class="num">出席人次</th>
            <th class="num">缺席人次</th>
          </tr>
        </thead>
        <tbody>${k}</tbody>
      </table>
    </div>

    <div class="keep-block" data-block="detail-label">
      <div class="section-label">堂次明細（含學生名單）</div>
    </div>
    ${N}
  </div>
  <div id="pages-root"></div>
</body>
</html>`}function Ie(s,t){const n=s.name.replace(/[\\/:*?"<>|]+/g,"_"),a=t.replace(/[^\d-]+/g,"");return`老師出席計算_${n}_${a}.pdf`}async function Ve(s,t){const[{default:n},{jsPDF:a}]=await Promise.all([F(()=>import("./html2canvas.esm-QH1iLAAe.js"),[]),F(()=>import("./jspdf.es.min-BT-051Kg.js").then(l=>l.j),__vite__mapDeps([0,1,2]))]),r=document.createElement("iframe");r.setAttribute("title","老師出席計算頁 PDF"),r.setAttribute("aria-hidden","true"),r.style.cssText="position:fixed;left:-10000px;top:0;width:794px;min-height:1200px;border:0;opacity:0;pointer-events:none",document.body.appendChild(r);try{const l=await new Promise((u,w)=>{r.onload=()=>{const g=r.contentDocument;g?u(g):w(new Error("無法讀取計算頁內容"))},r.onerror=()=>w(new Error("計算頁載入失敗")),r.srcdoc=s});await new Promise(u=>requestAnimationFrame(()=>u()));const o=l.getElementById("measure-root"),m=l.getElementById("pages-root");if(!o||!m)throw new Error("計算頁結構不完整");const f=Array.from(o.querySelectorAll(".keep-block")),b=980,k=8,N=[];let p=null,d=0;const h=()=>{const u=l.createElement("div");return u.className="pdf-page",m.appendChild(u),N.push(u),p=u,d=0,u};for(const u of f){const w=Math.ceil(u.getBoundingClientRect().height);p||h(),d>0&&d+k+w>b&&h(),p.appendChild(u.cloneNode(!0)),d+=(d>0?k:0)+w}o.remove(),N.forEach((u,w)=>{const g=l.createElement("div");g.className="page-foot",g.textContent=`${t} · 第 ${w+1} / ${N.length} 頁`,u.appendChild(g)}),await new Promise(u=>requestAnimationFrame(()=>u()));const i=new a({orientation:"portrait",unit:"mm",format:"a4"}),x=8,j=8,c=210-x*2;for(let u=0;u<N.length;u++){const w=N[u],g=await n(w,{scale:2.5,useCORS:!0,allowTaint:!0,backgroundColor:"#ffffff",logging:!1,width:794,windowWidth:794,windowHeight:Math.max(w.scrollHeight,1123)}),A=g.toDataURL("image/jpeg",.95),P=g.height*c/g.width;u>0&&i.addPage(),i.addImage(A,"JPEG",x,j,c,P)}return i.output("blob")}finally{r.remove()}}async function Be(s,t){const n=Me(s,t),a=`明學管理系統 · 老師中學出席計算頁 · ${s.name} · ${t}`,r=await Ve(n,a);ie(r,Ie(s,t))}function Ge({label:s,value:t,hint:n}){return e.jsxs("div",{className:"rounded-xl border border-border bg-card px-4 py-3 shadow-sm",children:[e.jsx("p",{className:"text-xs text-muted-foreground",children:s}),e.jsx("p",{className:"mt-1 text-2xl font-semibold tabular-nums tracking-tight",children:t}),n?e.jsx("p",{className:"mt-1 text-[11px] text-muted-foreground",children:n}):null]})}function W({label:s,names:t,empty:n}){return e.jsxs("div",{className:"min-w-0",children:[e.jsx("p",{className:"text-xs font-medium text-muted-foreground",children:s}),e.jsx("p",{className:"mt-0.5 break-words text-sm text-foreground",children:t.length>0?t.join("、"):n})]})}function Oe({lesson:s}){const t=K(s),n=z(s);return e.jsxs("div",{className:"rounded-lg border border-border bg-muted/20 px-3 py-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[e.jsxs("p",{className:"font-medium tabular-nums text-foreground",children:[s.date,e.jsxs("span",{className:"ml-2 font-normal text-muted-foreground",children:[s.startTime,"–",s.endTime]})]}),e.jsx("div",{className:"flex flex-wrap items-center gap-2 text-xs",children:s.notRolled?e.jsx(Z,{tone:"warning",children:"未點名"}):e.jsxs(e.Fragment,{children:[e.jsxs("span",{className:"tabular-nums text-foreground",children:["出席 ",t," 人次"]}),e.jsxs("span",{className:"tabular-nums text-muted-foreground",children:["缺席 ",n," 人次"]})]})})]}),s.makeupOrTrialNote?e.jsx("p",{className:"mt-1 text-xs text-muted-foreground",children:s.makeupOrTrialNote}):null,s.notRolled?e.jsx("p",{className:"mt-2 text-sm text-muted-foreground",children:"尚無點名紀錄"}):e.jsxs("div",{className:"mt-3 grid gap-3 sm:grid-cols-2",children:[e.jsx(W,{label:"出席學生",names:s.presentStudents,empty:"—"}),e.jsx(W,{label:"缺席學生",names:s.absentStudents,empty:"—"})]})]})}function Fe({block:s}){return e.jsxs("section",{className:"rounded-xl border border-border bg-card p-4 shadow-sm",children:[e.jsxs("div",{className:"flex flex-wrap items-start justify-between gap-2",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"text-sm font-semibold text-foreground",children:s.name}),e.jsxs("p",{className:"mt-0.5 text-xs text-muted-foreground",children:[$(s.classKind)," · ",s.lessons.length," 堂 · 出席"," ",C(s)," 人次 · 缺席 ",T(s)," 人次"]})]}),e.jsx(Z,{tone:s.classKind==="private"?"info":"default",children:$(s.classKind)})]}),e.jsx("div",{className:"mt-3 space-y-2",children:s.lessons.map(t=>e.jsx(Oe,{lesson:t},t.id))})]})}function He({teacher:s}){const t=O(s),n=se(s);return e.jsxs("div",{className:"space-y-5",children:[e.jsx("div",{className:"overflow-x-auto rounded-xl border border-border",children:e.jsxs("table",{className:"w-full table-fixed text-sm",children:[e.jsxs("colgroup",{children:[e.jsx("col",{className:"w-[24%]"}),e.jsx("col",{className:"w-[12%]"}),e.jsx("col",{className:"w-[12%]"}),e.jsx("col",{className:"w-[12%]"}),e.jsx("col",{className:"w-[20%]"}),e.jsx("col",{className:"w-[20%]"})]}),e.jsx("thead",{children:e.jsxs("tr",{className:"border-b border-border bg-muted/40 text-left text-xs text-muted-foreground",children:[e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"類別"}),e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"年級數"}),e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"班數"}),e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"堂數"}),e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"出席人次"}),e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"缺席人次"})]})}),e.jsxs("tbody",{children:[t.map(a=>e.jsxs("tr",{className:"border-b border-border",children:[e.jsx("td",{className:"px-3 py-2.5 font-medium",children:a.label}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums",children:a.gradeIds.size}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums",children:a.classCount}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums",children:a.lessonCount}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums font-semibold",children:a.presentVisits}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums text-muted-foreground",children:a.absentVisits})]},a.key)),e.jsxs("tr",{className:"border-b border-border bg-muted/20 last:border-0",children:[e.jsx("td",{className:"px-3 py-2.5 font-semibold",children:"合計"}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums text-muted-foreground",children:"—"}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums font-semibold",children:t.reduce((a,r)=>a+r.classCount,0)}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums font-semibold",children:t.reduce((a,r)=>a+r.lessonCount,0)}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums font-semibold",children:B(s)}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums font-semibold",children:G(s)})]})]})]})}),e.jsx("div",{className:"overflow-x-auto rounded-xl border border-border",children:e.jsxs("table",{className:"w-full table-fixed text-sm",children:[e.jsxs("colgroup",{children:[e.jsx("col",{className:"w-[14%]"}),e.jsx("col",{className:"w-[14%]"}),e.jsx("col",{className:"w-[12%]"}),e.jsx("col",{className:"w-[12%]"}),e.jsx("col",{className:"w-[24%]"}),e.jsx("col",{className:"w-[24%]"})]}),e.jsx("thead",{children:e.jsxs("tr",{className:"border-b border-border bg-muted/40 text-left text-xs text-muted-foreground",children:[e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"年級"}),e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"類型"}),e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"班數"}),e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"堂數"}),e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"出席人次"}),e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"缺席人次"})]})}),e.jsx("tbody",{children:n.map(a=>e.jsxs("tr",{className:"border-b border-border last:border-0",children:[e.jsx("td",{className:"px-3 py-2.5 font-medium",children:a.gradeLabel}),e.jsx("td",{className:"px-3 py-2.5 text-muted-foreground",children:$(a.classKind)}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums",children:a.classCount}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums",children:a.lessonCount}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums font-semibold",children:a.presentVisits}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums text-muted-foreground",children:a.absentVisits})]},`${a.gradeLabel}-${a.classKind}`))})]})}),s.grades.map(a=>e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2",children:[e.jsx("h2",{className:"text-base font-semibold text-foreground",children:a.gradeLabel}),e.jsxs("p",{className:"text-xs text-muted-foreground",children:["出席 ",M(a)," 人次 · 缺席 ",I(a)," 人次 · ",a.classes.length," ","班 · ",V(a)," 堂"]})]}),a.classes.map(r=>e.jsx(Fe,{block:r},`${a.gradeLabel}-${r.id}-${r.classKind}`))]},a.gradeLabel))]})}function Ye(s){const t=[];for(let n=-8;n<=2;n++)t.push(ge(s,n));return t.reverse()}function Ue(){const{pushBanner:s}=ue(),[t,n]=v.useState(X),[a,r]=v.useState([]),[l,o]=v.useState(""),[m,f]=v.useState(!0),[b,k]=v.useState(null),[N,p]=v.useState(!1),d=v.useMemo(()=>Ye(X()),[]),h=v.useCallback(async()=>{if(!E){r([]),f(!1);return}f(!0),k(null);try{const c=await Le(t);r(c.teachers),o(u=>{var w;return u&&c.teachers.some(g=>g.id===u)?u:((w=c.teachers[0])==null?void 0:w.id)??""})}catch(c){H(c,{source:"SecondaryAttendanceReportView.load",setErr:k}),r([])}finally{f(!1)}},[t]);v.useEffect(()=>{h()},[h]);const i=v.useMemo(()=>a.find(c=>c.id===l)??a[0]??null,[l,a]),x=v.useMemo(()=>a.map(c=>({id:c.id,name:c.name,grades:c.grades.length,classes:ee(c),lessons:Q(c),present:B(c),absent:G(c)})),[a]),j=async()=>{if(!(!i||N)){p(!0);try{await Be(i,t),s({tone:"success",title:"已下載 PDF",message:`${i.name} ${U(t)} 計算頁已下載。`})}catch(c){H(c,{source:"SecondaryAttendanceReportView.pdf",setErr:u=>s({tone:"error",title:"PDF 下載失敗",message:u??"未知錯誤"})})}finally{p(!1)}}};return e.jsxs("div",{className:"space-y-6 md:p-6",children:[e.jsxs("header",{className:"flex flex-wrap items-end justify-between gap-4",children:[e.jsxs("div",{children:[e.jsxs("h1",{className:"flex items-center gap-2 text-2xl font-semibold tracking-tight",children:[e.jsx(me,{className:"h-8 w-8 text-primary","aria-hidden":!0}),"老師中學出席統計"]}),e.jsx("p",{className:"mt-1 max-w-2xl text-sm text-muted-foreground",children:"以當日排程老師歸屬；中一至中六；人次＝每堂實際出席加總。四類分計：初中／高中 × 小組／一對一。可下載該老師計算頁 PDF。"})]}),e.jsxs("div",{className:"flex flex-wrap items-end gap-2",children:[e.jsxs("label",{className:"block min-w-[9rem]",children:[e.jsx("span",{className:"mb-1.5 block text-xs font-medium text-muted-foreground",children:"月份"}),e.jsx(Y,{value:t,onChange:c=>n(c.target.value),"aria-label":"統計月份",children:d.map(c=>e.jsx("option",{value:c,children:U(c)},c))})]}),e.jsxs(q,{type:"button",variant:"outline",size:"sm",onClick:()=>void h(),disabled:!E||m,children:[e.jsx(pe,{className:he("mr-1.5 h-4 w-4",m&&"animate-spin")}),"重新整理"]})]})]}),E?null:e.jsx("p",{className:"rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground",children:"尚未設定 Supabase，無法載入報表。"}),b?e.jsx("p",{className:"rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive",children:b}):null,m?e.jsx("p",{className:"text-sm text-muted-foreground",children:"載入中…"}):a.length===0?e.jsx("p",{className:"rounded-lg border border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground",children:"此月沒有中一至中六的非取消排程（或以當日老師計無資料）。"}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"overflow-x-auto rounded-xl border border-border",children:e.jsxs("table",{className:"w-full table-fixed text-sm",children:[e.jsxs("colgroup",{children:[e.jsx("col",{className:"w-[22%]"}),e.jsx("col",{className:"w-[12%]"}),e.jsx("col",{className:"w-[12%]"}),e.jsx("col",{className:"w-[12%]"}),e.jsx("col",{className:"w-[21%]"}),e.jsx("col",{className:"w-[21%]"})]}),e.jsx("thead",{children:e.jsxs("tr",{className:"border-b border-border bg-muted/40 text-left text-xs text-muted-foreground",children:[e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"老師"}),e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"年級數"}),e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"班數"}),e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"堂數"}),e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"出席人次"}),e.jsx("th",{className:"px-3 py-2.5 font-medium",children:"缺席人次"})]})}),e.jsx("tbody",{children:x.map(c=>e.jsxs("tr",{className:c.id===(i==null?void 0:i.id)?"border-b border-border bg-info/5 last:border-0":"border-b border-border last:border-0",children:[e.jsx("td",{className:"px-3 py-2.5 font-medium",children:c.name}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums",children:c.grades}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums",children:c.classes}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums",children:c.lessons}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums font-semibold",children:c.present}),e.jsx("td",{className:"px-3 py-2.5 tabular-nums text-muted-foreground",children:c.absent})]},c.id))})]})}),e.jsxs("div",{className:"flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4 shadow-sm",children:[e.jsxs("label",{className:"block min-w-[12rem] flex-1",children:[e.jsx("span",{className:"mb-1.5 block text-xs font-medium text-muted-foreground",children:"選擇老師"}),e.jsx(Y,{value:(i==null?void 0:i.id)??"",onChange:c=>o(c.target.value),"aria-label":"選擇老師",children:a.map(c=>e.jsx("option",{value:c.id,children:c.name},c.id))})]}),i?e.jsx("div",{className:"flex flex-wrap gap-3 pb-0.5 text-sm",children:O(i).map(c=>e.jsx(Ge,{label:`${c.label}出席`,value:c.presentVisits},c.key))}):null,e.jsxs(q,{type:"button",variant:"default",size:"sm",className:"ml-auto",disabled:!i||N,onClick:()=>void j(),children:[N?e.jsx(fe,{className:"mr-1.5 h-4 w-4 animate-spin"}):e.jsx(xe,{className:"mr-1.5 h-4 w-4"}),N?"產生 PDF…":"下載此老師計算頁 PDF"]})]}),i?e.jsxs("div",{className:"space-y-2",children:[e.jsxs("h2",{className:"text-lg font-semibold tracking-tight text-foreground",children:[i.name,"　明細"]}),e.jsx(He,{teacher:i})]}):null]})]})}function Je(){return be()?e.jsx(Ue,{}):e.jsx(je,{title:"僅限外星人",description:"老師中學出席統計僅開放外星人角色。請於登入頁切換為外星人後再試。"})}export{Je as default};
