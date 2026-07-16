/* app.js — simple client-side solver and UI */
const TARGET = 24;
const EPS = 1e-6;
const SAMPLE_NUMS = [1, 1, 1, 8];
const SAMPLE_EXPR = '8*(1+(1+1))';

function deq(a,b){return Math.abs(a-b)<EPS;}

function arraysEqual(a,b){
  if(a.length!==b.length) return false;
  for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return false;
  return true;
}

function solveAll(nums, exprs, results){
  const n = nums.length;
  if(n===1){
    if(deq(nums[0], TARGET)) results.add(exprs[0]);
    return;
  }
  for(let i=0;i<n;i++){
    for(let j=i+1;j<n;j++){
      const a = nums[i], b = nums[j];
      const ea = exprs[i], eb = exprs[j];
      const nextNums = [];
      const nextExprs = [];
      for(let k=0;k<n;k++) if(k!==i && k!==j){ nextNums.push(nums[k]); nextExprs.push(exprs[k]); }
      nextNums.push(a+b); nextExprs.push(`(${ea} + ${eb})`);
      solveAll(nextNums.slice(), nextExprs.slice(), results); nextNums.pop(); nextExprs.pop();
      nextNums.push(a-b); nextExprs.push(`(${ea} - ${eb})`);
      solveAll(nextNums.slice(), nextExprs.slice(), results); nextNums.pop(); nextExprs.pop();
      nextNums.push(b-a); nextExprs.push(`(${eb} - ${ea})`);
      solveAll(nextNums.slice(), nextExprs.slice(), results); nextNums.pop(); nextExprs.pop();
      nextNums.push(a*b); nextExprs.push(`(${ea} * ${eb})`);
      solveAll(nextNums.slice(), nextExprs.slice(), results); nextNums.pop(); nextExprs.pop();
      if(Math.abs(b) > EPS){ nextNums.push(a/b); nextExprs.push(`(${ea} / ${eb})`);
        solveAll(nextNums.slice(), nextExprs.slice(), results); nextNums.pop(); nextExprs.pop(); }
      if(Math.abs(a) > EPS){ nextNums.push(b/a); nextExprs.push(`(${eb} / ${ea})`);
        solveAll(nextNums.slice(), nextExprs.slice(), results); nextNums.pop(); nextExprs.pop(); }
    }
  }
}

function findSolutionsFor(nums){
  const exprs = nums.map(x=>String(x));
  const set = new Set();
  solveAll(nums.slice(), exprs.slice(), set);
  const arr = Array.from(set);
  arr.sort((a,b)=>a.length-b.length || a.localeCompare(b));
  return arr;
}

function randomNums(){
  const arr = [];
  for(let i=0;i<4;i++) arr.push(Math.floor(Math.random()*13)+1);
  return arr;
}

function generateSolvable(){
  for(let tries=0;tries<2000;tries++){
    const nums = randomNums();
    if(arraysEqual(nums.slice().sort((a,b)=>a-b), SAMPLE_NUMS.slice().sort((a,b)=>a-b))) continue;
    const sol = findSolutionsFor(nums);
    if(sol.length>0) return nums;
  }
  return [2,3,3,4];
}

const numbersEl = document.getElementById('numbers');
const btnNext = document.getElementById('btn-next');
const btnAns = document.getElementById('btn-ans');
const btnRandom = document.getElementById('btn-random');
const btnPrefill = document.getElementById('btn-prefill');
const exprInput = document.getElementById('expr');
const btnCheck = document.getElementById('btn-check');
const feedback = document.getElementById('feedback');
const solSection = document.getElementById('solutions');
const solList = document.getElementById('sol-list');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const exampleText = document.getElementById('example-text');

let currentNums = [1,3,4,6];
let currentSols = [];
let score = 0;
let streak = 0;

function updateScore(){
  scoreEl.textContent = score;
  streakEl.textContent = streak;
}

function renderNumbers(){
  numbersEl.innerHTML = '';
  currentNums.forEach(n=>{
    const d = document.createElement('div');
    d.className = 'num';
    d.textContent = n;
    numbersEl.appendChild(d);
  });
}

function newQuestion(){
  feedback.textContent = '正在生成新的有解题目...';
  let nums = generateSolvable();
  while(arraysEqual(nums.slice().sort((a,b)=>a-b), SAMPLE_NUMS.slice().sort((a,b)=>a-b))) {
    nums = generateSolvable();
  }
  currentNums = nums;
  currentSols = findSolutionsFor(currentNums);
  renderNumbers();
  feedback.textContent = '';
  solSection.hidden = true;
}

btnNext.addEventListener('click', newQuestion);
btnRandom.addEventListener('click', newQuestion);
btnPrefill.addEventListener('click', ()=>{
  exprInput.value = SAMPLE_EXPR;
  exprInput.focus();
});

btnAns.addEventListener('click', ()=>{
  solList.innerHTML = '';
  currentSols.slice(0,50).forEach(s=>{
    const li = document.createElement('li');
    li.textContent = s + ' = 24';
    solList.appendChild(li);
  });
  if(currentSols.length===0) solList.innerHTML = '<li>无解</li>';
  solSection.hidden = false;
});

function validateUsage(expr, nums){
  if(/[^0-9+\-*/()\s]/.test(expr)) return {ok:false,msg:'含有非法字符'};
  const matches = expr.match(/\d+/g) || [];
  const used = matches.map(x=>parseInt(x,10));
  const sortedUsed = used.slice().sort((a,b)=>a-b);
  const sortedNums = nums.slice().sort((a,b)=>a-b);
  if(sortedUsed.length !== 4) return {ok:false,msg:'请输入恰好使用 4 个数字'};
  for(let i=0;i<4;i++) if(sortedUsed[i]!==sortedNums[i]) return {ok:false,msg:'必须恰好使用给定的4个数字各一次'};
  return {ok:true};
}

btnCheck.addEventListener('click', ()=>{
  const expr = exprInput.value.trim();
  if(!expr) return;
  const v = validateUsage(expr, currentNums);
  if(!v.ok){ feedback.textContent = '错误：' + v.msg; return; }
  try{
    const fn = new Function('return ('+expr+');');
    const val = fn();
    if(!Number.isFinite(val)) throw new Error('invalid');
    if(Math.abs(val - TARGET) < EPS){
      streak += 1;
      const bonus = 10 + (streak - 1) * 2;
      score += bonus;
      updateScore();
      feedback.textContent = `✓ 正确! ${expr} = 24。得分 +${bonus}，当前得分 ${score}。连对 ${streak}。`;
    } else {
      streak = 0;
      score = Math.max(0, score - 5);
      updateScore();
      feedback.textContent = `✗ 结果为 ${Math.round(val*100)/100}，不是 24。扣除 5 分，当前得分 ${score}。连对已清零。`;
    }
  }catch(e){
    feedback.textContent = '表达式无法计算（语法错误或除零）。请参考示例格式。';
  }
});

exampleText.textContent = SAMPLE_EXPR;
updateScore();
newQuestion();
