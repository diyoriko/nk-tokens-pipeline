// Deterministic colorimetric audit of Foundations v1 tokens.json (post-#11).
// Outputs: primitive ramp tables (hex, L*, WCAG-vs-white/black, OKLCH L/C/H, ΔE2000 + ΔL* between steps),
// semantic alias resolution, and ALL on-* contrast pairs with AA verdicts.
import fs from 'node:fs';

const TOKENS = JSON.parse(fs.readFileSync(new URL('../../tokens/tokens.json', import.meta.url)));

/* ---------- color math ---------- */
const srgbToLin = (c) => { c/=255; return c<=0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };
function hexToRgb(hex){ hex=hex.replace('#',''); if(hex.length===3) hex=hex.split('').map(x=>x+x).join(''); return [parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)]; }
function relLum([r,g,b]){ return 0.2126*srgbToLin(r)+0.7152*srgbToLin(g)+0.0722*srgbToLin(b); }
function contrast(hex1, hex2){ const L1=relLum(hexToRgb(hex1)), L2=relLum(hexToRgb(hex2)); const a=Math.max(L1,L2),b=Math.min(L1,L2); return (a+0.05)/(b+0.05); }
// sRGB -> XYZ (D65) -> CIE Lab
function rgbToXyz([r,g,b]){ const R=srgbToLin(r),G=srgbToLin(g),B=srgbToLin(b);
  return [ R*0.4124564+G*0.3575761+B*0.1804375, R*0.2126729+G*0.7151522+B*0.0721750, R*0.0193339+G*0.1191920+B*0.9503041 ]; }
function xyzToLab([X,Y,Z]){ const Xn=0.95047,Yn=1,Zn=1.08883; const f=t=>t>0.008856?Math.cbrt(t):(7.787*t+16/116);
  const fx=f(X/Xn),fy=f(Y/Yn),fz=f(Z/Zn); return [116*fy-16,500*(fx-fy),200*(fy-fz)]; }
const hexToLab = (hex)=>xyzToLab(rgbToXyz(hexToRgb(hex)));
const Lstar = (hex)=>hexToLab(hex)[0];
// ΔE2000
function deltaE2000(lab1,lab2){
  const [L1,a1,b1]=lab1,[L2,a2,b2]=lab2; const avgL=(L1+L2)/2;
  const C1=Math.hypot(a1,b1),C2=Math.hypot(a2,b2),avgC=(C1+C2)/2;
  const G=0.5*(1-Math.sqrt(Math.pow(avgC,7)/(Math.pow(avgC,7)+Math.pow(25,7))));
  const a1p=a1*(1+G),a2p=a2*(1+G); const C1p=Math.hypot(a1p,b1),C2p=Math.hypot(a2p,b2),avgCp=(C1p+C2p)/2;
  let h1p=Math.atan2(b1,a1p)*180/Math.PI; if(h1p<0)h1p+=360; let h2p=Math.atan2(b2,a2p)*180/Math.PI; if(h2p<0)h2p+=360;
  let dhp; if(Math.abs(h1p-h2p)<=180)dhp=h2p-h1p; else dhp=(h2p<=h1p)?h2p-h1p+360:h2p-h1p-360;
  const dLp=L2-L1,dCp=C2p-C1p,dHp=2*Math.sqrt(C1p*C2p)*Math.sin(dhp*Math.PI/360);
  let avghp; if(Math.abs(h1p-h2p)>180)avghp=(h1p+h2p+360)/2; else avghp=(h1p+h2p)/2;
  const T=1-0.17*Math.cos((avghp-30)*Math.PI/180)+0.24*Math.cos((2*avghp)*Math.PI/180)+0.32*Math.cos((3*avghp+6)*Math.PI/180)-0.20*Math.cos((4*avghp-63)*Math.PI/180);
  const Sl=1+(0.015*Math.pow(avgL-50,2))/Math.sqrt(20+Math.pow(avgL-50,2)),Sc=1+0.045*avgCp,Sh=1+0.015*avgCp*T;
  const dRo=30*Math.exp(-Math.pow((avghp-275)/25,2));const Rc=2*Math.sqrt(Math.pow(avgCp,7)/(Math.pow(avgCp,7)+Math.pow(25,7)));
  const Rt=-Rc*Math.sin(2*dRo*Math.PI/180);
  return Math.sqrt(Math.pow(dLp/Sl,2)+Math.pow(dCp/Sc,2)+Math.pow(dHp/Sh,2)+Rt*(dCp/Sc)*(dHp/Sh));
}
// sRGB -> OKLab -> OKLCH
function rgbToOklab([r,g,b]){ const R=srgbToLin(r),G=srgbToLin(g),B=srgbToLin(b);
  const l=Math.cbrt(0.4122214708*R+0.5363325363*G+0.0514459929*B);
  const m=Math.cbrt(0.2119034982*R+0.6806995451*G+0.1073969566*B);
  const s=Math.cbrt(0.0883024619*R+0.2817188376*G+0.6299787005*B);
  return [0.2104542553*l+0.7936177850*m-0.0040720468*s, 1.9779984951*l-2.4285922050*m+0.4505937099*s, 0.0259040371*l+0.7827717662*m-0.8086757660*s]; }
function hexToOklch(hex){ const [L,a,b]=rgbToOklab(hexToRgb(hex)); let h=Math.atan2(b,a)*180/Math.PI; if(h<0)h+=360; return {L,C:Math.hypot(a,b),h}; }

/* ---------- load primitives ---------- */
const cp = TOKENS['color-primitives'];
const prims = {}; // "hue.step" -> {hex, alpha?}
for(const hue of Object.keys(cp)){
  const node=cp[hue];
  if(node.$value){ prims[hue]={hex:node.$value}; continue; }
  for(const step of Object.keys(node)){ if(node[step].$value!==undefined) prims[`${hue}.${step}`]={hex:node[step].$value}; }
}

/* ---------- ramp evenness tables ---------- */
const SOLID_HUES=['violet','lemon','magenta','blue','green','orange','coral','grey'];
let out='# Foundations v1 — deterministic colorimetric audit\n\n';
out+='> Generated from tokens.json (post-#11). WCAG ratios sRGB. L*=CIE D65. ΔE=ΔE2000 adjacent steps. OKLCH C=chroma.\n\n';
for(const hue of SOLID_HUES){
  const steps=Object.keys(cp[hue]).sort((a,b)=>+a-+b);
  out+=`## ${hue}\n\n| step | hex | L* | ΔL*↓ | ΔE2000↓ | OKLCH-L | OKLCH-C | OKLCH-h | vs-white | vs-black |\n|---|---|--:|--:|--:|--:|--:|--:|--:|--:|\n`;
  let prevLab=null,prevL=null;
  for(const s of steps){
    const hex=cp[hue][s].$value; const lab=hexToLab(hex); const ok=hexToOklch(hex);
    const dL=prevL!==null?(prevL-lab[0]).toFixed(1):''; const dE=prevLab?deltaE2000(prevLab,lab).toFixed(1):'';
    out+=`| ${s} | ${hex} | ${lab[0].toFixed(1)} | ${dL} | ${dE} | ${ok.L.toFixed(3)} | ${ok.C.toFixed(3)} | ${ok.h.toFixed(0)} | ${contrast(hex,'#FFFFFF').toFixed(2)} | ${contrast(hex,'#000000').toFixed(2)} |\n`;
    prevLab=lab;prevL=lab[0];
  }
  out+='\n';
}

/* ---------- resolve semantic aliases ---------- */
function resolveRef(ref){
  // ref like {white.1000} or {grey.100} or {violet.600}
  const path=ref.replace(/[{}]/g,'');
  const parts=path.split('.');
  const hue=parts[0]; const step=parts[1];
  if(cp[hue]){ if(cp[hue].$value) return {hue,step:null,hex:cp[hue].$value}; if(step&&cp[hue][step]) return {hue,step,hex:cp[hue][step].$value}; }
  return {hue,step,hex:null};
}
function walk(node, path, acc){
  if(node && node.$value!==undefined && typeof node.$value==='string' && node.$value.startsWith('{')){
    const r=resolveRef(node.$value); acc.push({token:path.join('.'), ref:node.$value, prim:`${r.hue}${r.step?'.'+r.step:''}`, hex:r.hex});
    return;
  }
  if(node && typeof node==='object'){ for(const k of Object.keys(node)){ if(k.startsWith('$'))continue; walk(node[k],[...path,k],acc); } }
}
const sem=[]; walk(TOKENS['color'], ['color'], sem);
out+='## Semantic alias resolution (every color token → primitive → hex)\n\n| semantic token | → primitive | hex |\n|---|---|---|\n';
for(const s of sem){ out+=`| ${s.token} | ${s.prim} | ${s.hex||'??'} |\n`; }
out+='\n';

/* ---------- on-* contrast pairs ---------- */
// Build a lookup of resolved hexes by token path
const H={}; for(const s of sem) H[s.token]=s.hex;
function bg(p){return H[`color.background.${p}`];}
function txt(p){return H[`color.text.${p}`];}
function ico(p){return H[`color.icon.${p}`];}
const AA=(r)=>r>=4.5?'PASS':'**FAIL**'; const AALarge=(r)=>r>=3?'pass(lg)':'**FAIL**'; const UI=(r)=>r>=3?'pass':'**FAIL**';
out+='## on-* contrast pairs (foreground over its intended background)\n\n';
out+='### Brand fills — on-brand text/icon over *-primary fill\n\n| intent | fg (on-brand) | bg (primary) | ratio | AA-normal | AA-large |\n|---|---|---|--:|:--:|:--:|\n';
for(const intent of ['violet','magenta','coral','green','orange','blue','lemon']){
  const fg=txt(`brand.${intent}.on-primary`)||txt(`on-brand.${intent}.primary`)||H[`color.text.on-brand-${intent}.primary`];
  // try common shapes
  const candidatesFg=[`color.text.on-brand.${intent}.primary`,`color.text.brand.${intent}.on-primary`,`color.text.on-brand-${intent}.primary`];
  let f=null; for(const c of candidatesFg){ if(H[c]){f=H[c];break;} }
  const b=bg(`brand.${intent}.primary`);
  if(f&&b){ const r=contrast(f,b); out+=`| ${intent} | ${f} | ${b} | ${r.toFixed(2)} | ${AA(r)} | ${AALarge(r)} |\n`; }
}
out+='\n### Status fills — on-status text over *-primary fill\n\n| intent | fg | bg | ratio | AA-normal |\n|---|---|---|--:|:--:|\n';
for(const intent of ['success','warning','danger']){
  const candidatesFg=[`color.text.on-${intent}.primary`,`color.text.${intent}.on-primary`];
  let f=null; for(const c of candidatesFg){ if(H[c]){f=H[c];break;} }
  const b=bg(`${intent}.primary`);
  if(f&&b){ const r=contrast(f,b); out+=`| ${intent} | ${f} | ${b} | ${r.toFixed(2)} | ${AA(r)} |\n`; }
}
out+='\n### Status/brand TEXT over white & over their own secondary(tint) bg\n\n| token | fg | vs #fff | AA | vs secondary-bg | secondary hex | AA-on-tint |\n|---|---|--:|:--:|--:|---|:--:|\n';
for(const intent of ['success','warning','danger']){
  const f=txt(`${intent}.primary`); const tint=bg(`${intent}.secondary`);
  if(f){ const rw=contrast(f,'#FFFFFF'); const rt=tint?contrast(f,tint):null; out+=`| text.${intent}.primary | ${f} | ${rw.toFixed(2)} | ${AA(rw)} | ${rt?rt.toFixed(2):'-'} | ${tint||'-'} | ${rt?AA(rt):'-'} |\n`; }
}
for(const intent of ['violet','magenta','coral','green','orange','blue','lemon']){
  const f=H[`color.text.brand.${intent}.primary`]; const tint=bg(`brand.${intent}.secondary`);
  if(f){ const rw=contrast(f,'#FFFFFF'); const rt=tint?contrast(f,tint):null; out+=`| text.brand.${intent}.primary | ${f} | ${rw.toFixed(2)} | ${AA(rw)} | ${rt?rt.toFixed(2):'-'} | ${tint||'-'} | ${rt?AA(rt):'-'} |\n`; }
}
out+='\n### Default text on default/secondary/tertiary backgrounds\n\n| text | bg | ratio | AA-normal |\n|---|---|--:|:--:|\n';
const bgs=[['base.primary'],['base.secondary'],['base.tertiary']];
for(const t of ['default.primary','default.secondary','default.tertiary']){
  const f=txt(t); for(const [bp] of bgs){ const b=bg(bp); if(f&&b){ const r=contrast(f,b); out+=`| text.${t} | bg.${bp} (${b}) | ${r.toFixed(2)} | ${AA(r)} |\n`; } }
}
out+='\n### Borders / icons over white (UI 3:1)\n\n| token | hex | vs #fff | UI-3:1 |\n|---|---|--:|:--:|\n';
for(const s of sem){ if(/color\.(border|icon)\./.test(s.token) && s.hex && !/on-/.test(s.token)){ const r=contrast(s.hex,'#FFFFFF'); out+=`| ${s.token} | ${s.hex} | ${r.toFixed(2)} | ${UI(r)} |\n`; } }

/* ---------- anchor honouring ---------- */
out+='\n## Anchor honouring — real brand colours vs nearest generated step (ΔE2000)\n\n';
const realAnchors=[
  ['violet/600 BB Violet (anchor)','#6D46FC','violet'],
  ['violet/700 Daisy Bush Main (LDS primary purple)','#4221B8','violet'],
  ['violet/900 Persian Indigo','#210A74','violet'],
  ['violet/300 Melrose','#9694FF','violet'],
  ['violet/800 Daisy Bush Dark','#2E1781','violet'],
  ['lemon Main (accent anchor)','#FFE60A','lemon'],
  ['lemon Dark','#B3A107','lemon'],
  ['magenta Heliotrope Main','#C76EF2','magenta'],
  ['magenta Heliotrope Dark','#8B4DA9','magenta'],
  ['blue Periwinkle Main','#C6D2FF','blue'],
  ['blue Patterns Blue','#E1F3FE','blue'],
  ['green Main (Lime)','#79FD7F','green'],
  ['green Dark1 (Apple)','#31C838','green'],
  ['green Dark2 (Snake)','#19AA20','green'],
  ['orange Main','#FFA000','orange'],
  ['orange Dark','#B36007','orange'],
  ['coral Persimmon Main','#FF5A56','coral'],
  ['coral Persimmon Dark','#B33F3C','coral'],
  ['grey Black (TEXT_PRIMARY)','#2C2A33','grey'],
  ['grey Jumbo','#706F74','grey'],
  ['grey Outer Space','#484848','grey'],
];
out+='| real source colour | hex | nearest generated step | gen hex | ΔE2000 | L*(real→gen) |\n|---|---|---|---|--:|--:|\n';
for(const [name,hex,hue] of realAnchors){
  const lab=hexToLab(hex); let best=null;
  for(const s of Object.keys(cp[hue])){ if(!cp[hue][s].$value)continue; const ghex=cp[hue][s].$value; const d=deltaE2000(lab,hexToLab(ghex)); if(!best||d<best.d) best={s,ghex,d}; }
  out+=`| ${name} | ${hex} | ${hue}/${best.s} | ${best.ghex} | ${best.d.toFixed(1)} | ${lab[0].toFixed(1)}→${hexToLab(best.ghex)[0].toFixed(1)} |\n`;
}

fs.writeFileSync(new URL('./AUDIT-NUMBERS.md', import.meta.url), out);
console.log('wrote AUDIT-NUMBERS.md ('+out.length+' bytes)');
console.log('primitives:', Object.keys(prims).length, '| semantic color tokens:', sem.length);
