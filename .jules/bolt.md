
## 2025-03-09 - [Optimizing String Counting]
**Learning:** `string.split('\n').length` creates a new array allocating memory for every line, which is costly (O(N) time and memory) and can cause stuttering and trigger garbage collection frequently in text editors that run on every keystroke. Using `indexOf('\n', pos)` with a while loop is extremely fast and allocates zero additional memory.
**Action:** Use `indexOf` for finding occurrences of substrings and counting newlines in large strings/text editors instead of `split().length` or regex `.match()`, and wrap it in `useMemo` when applicable.
