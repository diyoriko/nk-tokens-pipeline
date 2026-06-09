// Regenerate solid ramps: pin load-bearing REAL brand anchors at their L*-nearest step,
// smooth-interpolate the gaps in OKLCH, gamut-clamp. Lemon is left untouched (decision #12).
import fs from 'node:fs';

/* ---- color math ---- */
const srgbToLin=c=>{c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4)};
const linToSrgb=c=>{const v=c<=0.0031308?12.92*c:1.055*Math.pow(c,1/2.4)-0.055;return Math.round(Math.min(1,Math.max(0,v))*255)};
const hexToRgb=h=>{h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]};
const rgbToHex=([r,g,b])=>'#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
function rgbToXyz([r,g,b]){const R=srgbToLin(r),G=srgbToLin(g),B=srgbToLin(b);return[R*0.4124564+G*0.3575761+B*0.1804375,R*0.2126729+G*0.7151522+B*0.0721750,R*0.0193339+G*0.1191920+B*0.9503041]}
function xyzToLab([X,Y,Z]){const f=t=>t>0.008856?Math.cbrt(t):7.787*t+16/116;const fx=f(X/0.95047),fy=f(Y/1),fz=f(Z/1.08883);return[116*fy-16,500*(fx-fy),200*(fy-fz)]}
const Lstar=h=>xyzToLab(rgbToXyz(hexToRgb(h)))[0];
const contrast=(a,b)=>{const f=h=>{const[r,g,bl]=hexToRgb(h);return 0.2126*srgbToLin(r)+0.7152*srgbToLin(g)+0.0722*srgbToLin(bl)};const l1=f(a),l2=f(b),hi=Math.max(l1,l2),lo=Math.min(l1,l2);return(hi+0.05)/(lo+0.05)};
// OKLab/OKLCH
function rgbToOklab([r,g,b]){const R=srgbToLin(r),G=srgbToLin(g),B=srgbToLin(b);const l=Math.cbrt(0.4122214708*R+0.5363325363*G+0.0514459929*B),m=Math.cbrt(0.2119034982*R+0.6806995451*G+0.1073969566*B),s=Math.cbrt(0.0883024619*R+0.2817188376*G+0.6299787005*B);return[0.2104542553*l+0.7936177850*m-0.0040720468*s,1.9779984951*l-2.4285922050*m+0.4505937099*s,0.0259040371*l+0.7827717662*m-0.8086757660*s]}
function oklabToRgb([L,a,b]){const l=(L+0.3963377774*a+0.2158037573*b)**3,m=(L-0.1055613458*a-0.0638541728*b)**3,s=(L-0.0894841775*a-1.2914855480*b)**3;const R=4.0767416621*l-3.3077115913*m+0.2309699292*s,G=-1.2684380046*l+2.6097574011*m-0.3413193965*s,B=-0.0041960863*l-0.7034186147*m+1.7076147010*s;return[linToSrgb(R),linToSrgb(G),linToSrgb(B)]}
const hexToOklch=h=>{const[L,a,b]=rgbToOklab(hexToRgb(h));let H=Math.atan2(b,a)*180/Math.PI;if(H<0)H+=360;return{L,C:Math.hypot(a,b),h:H}};
function oklchToHex({L,C,h}){let c=C;for(let i=0;i<24;i++){const a=c*Math.cos(h*Math.PI/180),b=c*Math.sin(h*Math.PI/180);const[r,g,bl]=oklabToRgb([L,a,b]);const back=rgbToOklab([r,g,bl]);// in-gamut if round-trips close
    const rr=oklabToRgb([L,a,b]);const lin=rr.map(srgbToLin);// check clip: oklabToRgb already clamped; detect clip by re-encoding
    const hex=rgbToHex(rr);const rt=hexToOklch(hex);if(Math.abs(rt.L-L)<0.02&&Math.abs(rt.C-c)<0.02)return hex;c*=0.93;}
  const a=c*Math.cos(h*Math.PI/180),b=c*Math.sin(h*Math.PI/180);return rgbToHex(oklabToRgb([L,a,b]));}

/* ---- explicit load-bearing REAL pins per hue: stepIndex(0=100..9=1000) -> hex ----
   Chosen by semantic role + L*-nearest step; monotonic by construction. Gaps generated smooth. */
const PINS={
  // violet: Melrose(tint) + brand anchor + Daisy Bush primary/hover + Persian Indigo dark
  violet:{2:'#9694FF',5:'#6D46FC',6:'#4221B8',8:'#210A74'},
  // magenta: Heliotrope Main + Dark
  magenta:{3:'#C76EF2',5:'#8B4DA9'},
  // blue: Patterns Blue + Periwinkle Main + brand-approved AA dark
  blue:{0:'#E1F3FE',1:'#C6D2FF',5:'#1C6FB0'},
  // green: Lime + Apple + Snake + AA-dark
  green:{1:'#79FD7F',3:'#31C838',4:'#19AA20',6:'#0E7A1E'},
  // orange: Orange Main + Dark
  orange:{3:'#FFA000',5:'#B36007'},
  // coral: Persimmon Main + Dark
  coral:{4:'#FF5A56',6:'#B33F3C'},
  // grey: real greyscale (Alabaster, Mischka, Silver, Jumbo, Outer Space, Black/TEXT_PRIMARY)
  grey:{0:'#FAFAFA',1:'#E2E1E7',2:'#C6C6C6',5:'#706F74',7:'#484848',8:'#2C2A33'},
};
const STEPS=[100,200,300,400,500,600,700,800,900,1000];
const TARGET_L=[96,89,81,72,62,52,43,33,22,13];

function genRamp(hue){
  const pins=PINS[hue];
  const ctrl=Object.keys(pins).map(Number).sort((a,b)=>a-b);
  const out=[];
  for(let i=0;i<10;i++){
    if(pins[i]!==undefined){ out.push({step:STEPS[i],hex:pins[i],pin:true}); continue; }
    let lo=null,hi=null; for(const c of ctrl){ if(c<i)lo=c; if(c>i&&hi===null)hi=c; }
    let oh;
    if(lo!==null&&hi!==null){ const t=(i-lo)/(hi-lo); const A=hexToOklch(pins[lo]),B=hexToOklch(pins[hi]);
      let dh=B.h-A.h; if(dh>180)dh-=360; if(dh<-180)dh+=360;
      oh={L:A.L+(B.L-A.L)*t, C:A.C+(B.C-A.C)*t, h:A.h+dh*t}; }
    else if(lo!==null){ // extrapolate darker than the last pin toward TARGET_L
      const A=hexToOklch(pins[lo]); const ratio=TARGET_L[i]/TARGET_L[lo];
      oh={L:A.L*ratio, C:A.C*Math.max(0.55,ratio), h:A.h}; }
    else { // extrapolate lighter than the first pin toward TARGET_L
      const B=hexToOklch(pins[hi]); const tl=TARGET_L[i]/100; // push L up toward target, fade C
      oh={L:B.L+(1-B.L)*((TARGET_L[i]-TARGET_L[hi])/(100-TARGET_L[hi])), C:B.C*(1-0.45*((TARGET_L[i]-TARGET_L[hi])/(100-TARGET_L[hi]))), h:B.h}; }
    out.push({step:STEPS[i],hex:oklchToHex(oh),pin:false});
  }
  return out;
}

let report='# Regenerated ramps (pin real anchors + smooth gaps)\n\n';
const result={};
for(const hue of Object.keys(PINS)){
  const ramp=genRamp(hue); result[hue]=ramp;
  report+=`## ${hue}\n\n| step | hex | pin? | L* | ΔL*↓ | vs-white |\n|---|---|:--:|--:|--:|--:|\n`;
  let pl=null;
  for(const s of ramp){ const Ls=Lstar(s.hex); const dl=pl!==null?(pl-Ls).toFixed(1):''; report+=`| ${s.step} | ${s.hex} | ${s.pin?'**REAL**':'gen'} | ${Ls.toFixed(1)} | ${dl} | ${contrast(s.hex,'#FFFFFF').toFixed(2)} |\n`; pl=Ls; }
  report+='\n';
  // monotonic check
  const Ls=ramp.map(s=>Lstar(s.hex)); const mono=Ls.every((v,i)=>i===0||v<Ls[i-1]);
  report+=`monotonic L*: ${mono?'YES':'**NO**'}\n\n`;
}
fs.writeFileSync(new URL('./REGEN-RAMPS.md',import.meta.url),report);
fs.writeFileSync(new URL('./regen-ramps.json',import.meta.url),JSON.stringify(result,null,0));
console.log('wrote REGEN-RAMPS.md + regen-ramps.json');
// quick monotonic summary
for(const hue of Object.keys(result)){ const Ls=result[hue].map(s=>Lstar(s.hex)); const mono=Ls.every((v,i)=>i===0||v<Ls[i-1]); const pins=result[hue].filter(s=>s.pin).length; console.log(hue.padEnd(8),'mono:',mono?'Y':'N','pins:',pins,'/10'); }
