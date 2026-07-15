/* app.js — simple client-side solver and UI */
const TARGET = 24;
const EPS = 1e-6;

function deq(a,b){return Math.abs(a-b)<EPS}

// 递归求解：nums 为数值数组，exprs 为对应的字符串表达式
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
      // +
      nextNums.push(a+b); nextExprs.push(`(${ea} + ${eb})`);
      solveAll(nextNums.slice(), nextExprs.slice(), results); nextNums.pop(); nextExprs.pop();
      // - a - b
      nextNums.push(a-b); nextExprs.push(`(${ea} - ${eb})`);
      solveAll(nextNums.slice(), nextExprs.slice(), results); nextNums.pop(); nextExprs.pop();
      // - b - a
      nextNums.push(b-a); nextExprs.push(`(${eb} - ${ea})`);
      solveAll(nextNums.slice(), nextExprs.slice(), results); nextNums.pop(); nextExprs.pop();
      // *
      nextNums.push(a*b); nextExprs.push(`(${ea} * ${eb})`);
      solveAll(nextNums.slice(), nextExprs.slice(), results); nextNums.pop(); nextExprs.pop();
      // /
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
  // Convert to array and sort by simple heuristic: shorter first
  const arr = Array.from(set);
  arr.sort((a,b)=>a.length-b.length || a.localeCompare(b));
  return arr;
}

function randomNums(){
  const arr = [];
  for(let i=0;i<4;i++) arr.push(Math.floor(Math.random()*13)+1);
  return arr;
}

async function generateSolvable(){
  for(let tries=0;tries<2000;tries++){
    const nums = randomNums();
    const sol = findSolutionsFor(nums);
    if(sol.length>0) return nums;
  }
  // fallback
  return [1,3,4,6];
}

// UI
const numbersEl = document.getElementById('numbers');
const btnNext = document.getElementById('btn-next');
const btnAns = document.getElementById('btn-ans');
const btnRandom = document.getElementById('btn-random');
const exprInput = document.getElementById('expr');
const btnCheck = document.getElementById('btn-check');
const feedback = document.getElementById('feedback');
const solSection = document.getElementById('solutions');
const solList = document.getElementById('sol-list');

let currentNums = [1,3,4,6];
let currentSols = [];

function renderNumbers(){
  numbersEl.innerHTML = '';
  currentNums.forEach(n=>{
    const d = document.createElement('div'); d.className='num'; d.textContent = n; numbersEl.appendChild(d);
  });
}

async function newQuestion(){
  feedback.textContent = '正在生成有解题目...';
  currentNums = await generateSolvable();
  currentSols = findSolutionsFor(currentNums);
  renderNumbers();
  feedback.textContent = '';
  solSection.hidden = true;
}

btnNext.addEventListener('click', newQuestion);
btnRandom.addEventListener('click', newQuestion);

btnAns.addEventListener('click', ()=>{
  solList.innerHTML = '';
  currentSols.slice(0,50).forEach(s=>{
    const li = document.createElement('li'); li.textContent = s + ' = 24'; solList.appendChild(li);
  });
  if(currentSols.length===0) solList.innerHTML = '<li>无解</li>';
  solSection.hidden = false;
});

function validateUsage(expr, nums){
  // only allow digits, spaces, parentheses and +-*/
  if(/[^0-9+\-*/()\s]/.test(expr)) return {ok:false,msg:'含有非法字符'};
  // extract integers
  const matches = expr.match(/\d+/g) || [];
  const used = matches.map(x=>parseInt(x,10));
  // we require that used numbers, when sorted, equal nums sorted
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
  // safe-eval: disallow identifiers by checking allowed chars again, then use Function
  try{
    // Replace integer tokens with themselves as numbers to avoid accidental leading zeros treated as octal (not in modern JS)
    const fn = new Function('return ('+expr+');');
    const val = fn();
    if(Math.abs(val - 24) < 1e-6){ feedback.textContent = '✓ 正确! ' + expr + ' = 24'; }
    else feedback.textContent = '✗ 结果为 ' + (Math.round(val*100)/100) + '，不是 24。';
  }catch(e){ feedback.textContent = '表达式无法计算（语法错误或除零）'; }
});

// init
newQuestion();
