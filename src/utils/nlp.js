const levenshtein = (a,b)=>{
  const m=a.length,n=b.length;const dp=Array.from({length:m+1},()=>Array(n+1).fill(0));
  for(let i=0;i<=m;i++)dp[i][0]=i;for(let j=0;j<=n;j++)dp[0][j]=j;
  for(let i=1;i<=m;i++){for(let j=1;j<=n;j++){
    const c=a[i-1]===b[j-1]?0:1;
    dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+c);
  }}return dp[m][n];
};
const norm = s => s.toLowerCase().replace(/\s+/g," ").trim();
export const bestMatch = (input, candidates, maxDistance=2)=>{
  const x=norm(input); let best=null,score=1e9;
  for(const c of candidates){ const y=norm(c); if(x.includes(y)) return c;
    const d=levenshtein(x,y); if(d<score){score=d;best=c;}
  }
  return score<=maxDistance?best:null;
};
