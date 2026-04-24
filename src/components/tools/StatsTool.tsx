import { useState, useMemo } from 'react';
import { mean, median, mode, std, variance, min, max } from 'mathjs';

const StatsTool = () => {
  const [input, setInput] = useState('2, 4, 4, 4, 5, 5, 7, 9');

  const stats = useMemo(() => {
    try {
      const nums = input.split(/[\s,]+/).filter(Boolean).map(Number).filter((n) => isFinite(n));
      if (nums.length === 0) return null;
      const sorted = [...nums].sort((x, y) => x - y);
      const sum = nums.reduce((a, b) => a + b, 0);
      const q = (p: number) => sorted[Math.floor(p * (sorted.length - 1))];
      return {
        n: nums.length,
        sum,
        mean: Number(mean(nums)),
        median: Number(median(nums)),
        mode: ([] as number[]).concat(mode(nums) as number | number[]),
        std: Number(std(nums, 'unbiased')),
        variance: Number(variance(nums, 'unbiased')),
        min: Number(min(nums)),
        max: Number(max(nums)),
        range: Number(max(nums)) - Number(min(nums)),
        q1: q(0.25),
        q3: q(0.75),
      };
    } catch {
      return null;
    }
  }, [input]);

  return (
    <div className="space-y-3">
      <label className="flex flex-col text-xs gap-1">
        <span className="text-muted-foreground">Numbers (comma or space separated)</span>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2}
          className="px-3 py-2 rounded-lg bg-muted text-sm font-mono outline-none focus:ring-1 focus:ring-primary" />
      </label>
      {stats && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          {([
            ['Count (n)', stats.n],
            ['Sum', stats.sum],
            ['Mean', stats.mean.toFixed(4)],
            ['Median', stats.median],
            ['Mode', stats.mode.join(', ')],
            ['Std dev (s)', stats.std.toFixed(4)],
            ['Variance', stats.variance.toFixed(4)],
            ['Min', stats.min],
            ['Max', stats.max],
            ['Range', stats.range],
            ['Q1', stats.q1],
            ['Q3', stats.q3],
          ] as [string, string | number][]).map(([k, v]) => (
            <div key={k} className="bg-muted rounded-lg p-2">
              <p className="text-muted-foreground">{k}</p>
              <p className="font-mono font-semibold text-sm">{v}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatsTool;
