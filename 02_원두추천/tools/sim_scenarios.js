const fs = require("fs"), vm = require("vm"), path = require("path");
const dir = require("path").join(__dirname, "..");
const ctx = { module: { exports: {} }, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dir, "products.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(dir, "reviews.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(dir, "app.js"), "utf8"), ctx);
const app = ctx.module.exports, PRODUCTS = ctx.PRODUCTS, REVIEWS = ctx.REVIEWS;

function tasteTarget(a){ if(a.q1==="라떼")return a.q_latte==="온아바라"?"균형":"고소"; if(a.q2==="고소")return"고소";if(a.q2==="균형")return"균형"; if(a.q2==="산뜻")return"산뜻한산미"; if(a.q2==="모름"&&a.q5==="부드러움")return"균형"; if(a.q2==="모름"&&a.q5==="개성")return"과실감"; return"균형"; }
function sitTags(a){ const t=[]; if(a.q1)t.push(a.q1); t.push(tasteTarget(a)); if(a.q4==="디카페인")t.push("디카페인"); if(a.q_amount)t.push(a.q_amount); return t; }
function pickReview(p,a){ const rs=REVIEWS[p.id]||[]; if(!rs.length)return null; const st=sitTags(a); let best=null,bs=-1; for(const r of rs){ let s=0; for(const t of st) if(r.tags.includes(t)) s++; if(s>bs){best=r;bs=s;} } return {review:best,score:bs,total:rs.length,st}; }
function show(label,p,a,rec){
  console.log(`  [${label}] ${p.name} (${p.price}원, line=${p.line}, taste=${p.taste}, prio=${p.priority}, reviews=${(REVIEWS[p.id]||[]).length})`);
  const pr = pickReview(p,a);
  if(pr){ console.log(`     후기 ${pr.score>0?"[비슷한 분]":"[실제 구매자]"} 겹침=${pr.score}/${pr.st.length} 상황태그=${pr.st} 후기태그=${pr.review.tags} ★${pr.review.rating}`); console.log(`     "${pr.review.text.replace(/\n/g," / ").slice(0,160)}"`); }
  else console.log("     후기 없음 → 카드 생략");
}
const S = [
 ["A 선물+고소+없음+상관없음", {q1:"선물",q2:"고소",q3:"없음",q4:"상관없음"}],
 ["A2 선물+균형+없음+상관없음", {q1:"선물",q2:"균형",q3:"없음",q4:"상관없음"}],
 ["A3 선물+모름+개성+상관없음", {q1:"선물",q2:"모름",q5:"개성",q3:"없음",q4:"상관없음"}],
 ["A4 선물+산뜻+없음+디카페인", {q1:"선물",q2:"산뜻",q3:"없음",q4:"디카페인"}],
 ["B 핸드드립+100g+산뜻+없음+상관없음", {q1:"핸드드립",q_amount:"100",q2:"산뜻",q3:"없음",q4:"상관없음"}],
 ["B2 핸드드립+200g+산뜻+없음+상관없음", {q1:"핸드드립",q_amount:"200",q2:"산뜻",q3:"없음",q4:"상관없음"}],
 ["B3 핸드드립+500g+산뜻+없음+상관없음", {q1:"핸드드립",q_amount:"500",q2:"산뜻",q3:"없음",q4:"상관없음"}],
 ["B4 핸드드립+500g+고소+신맛회피+디카페인", {q1:"핸드드립",q_amount:"500",q2:"고소",q3:"신맛회피",q4:"디카페인"}],
 ["C 6절1행 아메리카노간편+고소+신맛회피+상관없음", {q1:"아메리카노간편",q2:"고소",q3:"신맛회피",q4:"상관없음"}],
 ["D 6절2행 핸드드립+200g+고소+없음+상관없음", {q1:"핸드드립",q_amount:"200",q2:"고소",q3:"없음",q4:"상관없음"}],
 ["E 아메리카노간편+모름+부드러움+쓴맛회피+디카페인", {q1:"아메리카노간편",q2:"모름",q5:"부드러움",q3:"쓴맛회피",q4:"디카페인"}],
 ["F 캡슐+산뜻+쓴맛회피+상관없음", {q1:"캡슐",q2:"산뜻",q3:"쓴맛회피",q4:"상관없음"}],
 ["G 콜드브루+고소+없음+상관없음", {q1:"콜드브루",q2:"고소",q3:"없음",q4:"상관없음"}],
 ["H 여행캠핑+균형+없음+상관없음", {q1:"여행캠핑",q2:"균형",q3:"없음",q4:"상관없음"}],
 ["I 여행캠핑+산뜻+없음+디카페인", {q1:"여행캠핑",q2:"산뜻",q3:"없음",q4:"디카페인"}],
 ["L1 라떼+우유+범표라떼+충전", {q1:"라떼",q_milk:"우유",q_latte:"범표라떼",q4:"상관없음"}],
 ["L2 라떼+두유(유당불내증)+충전", {q1:"라떼",q_milk:"두유",q4:"상관없음"}],
 ["L3 라떼+우유+온아바라+충전", {q1:"라떼",q_milk:"우유",q_latte:"온아바라",q4:"상관없음"}],
 ["L4 라떼+상관없음+시그니처+디카페인", {q1:"라떼",q_milk:"상관없음",q_latte:"시그니처",q4:"디카페인"}],
];
for(const [name,a] of S){
  const rec = app.recommend(a);
  console.log(`\n=== ${name} ${(rec.fallback?"(FALLBACK)":"")+(rec.relaxedQ1?"(RELAXED)":"")}`);
  show("오늘의 추천", rec.chosen, a, rec);
  console.log("     이유: " + app.buildMainReason(a, rec.chosen, rec.fallback, rec.relaxedQ1));
  show("새로운 경험", rec.newProduct, a, rec);
  console.log("     이유: " + app.buildNewReason(a, rec.newProduct, rec.chosen));
  if(rec.sampleProduct) console.log(`  [샘플] ${rec.sampleProduct.name} (${rec.sampleProduct.price}원)`);
}
