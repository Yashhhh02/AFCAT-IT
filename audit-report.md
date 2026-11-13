# CodeVita Reference Audit Report

## 1. Executive Summary
- **Reference Source**: [TCS CodeVita Season 14 — 8-Week Plan (Padho with Pratyush)](https://perryvegehan.github.io/Codevita/)
- **Target File**: [data/cv-days.json](file:///c:/AFCAT-IT/data/cv-days.json)
- **Scope**: Days 1 to 56 (Weeks 1 to 8)
- **Parameters Audited**:
  - Day Type (`learning`, `weekend practice`, `mock`, `rest`, `final revision`, `exam eve`)
  - Item Order (file order vs reference site display order)
  - Item Type (`video`, `leetcode`, `pyq`, `official`, `other`, `mock`, `stretch`, `optional`)
  - Item Title and URL integrity
  - Stable IDs preservation
- **Audit Findings**:
  - **Missing Items**: 0
  - **Extra Items**: 0
  - **Dead / Broken Links**: 0
  - **Type Discrepancies**: 14 items
  - **Order Discrepancies**: 5 days (Days 1, 2, 24, 25, 26) where optional videos were placed after problem lists rather than immediately following tutorial videos.
- **Total Fixes Applied**: **19 fixes** (14 type fixes + 5 sequence order fixes).
- **Post-Fix Audit Result**: **100% Match (0 discrepancies across all 56 days)**. Stable item IDs were 100% preserved.

---

## 2. Day-by-Day Comprehensive Audit (Days 1 to 56)

| Day | Day Type | Title | Items | Issues Found Prior to Audit | Fix Applied | Status |
|:---:|:---|:---|:---:|:---|:---|:---:|
| 1 | `learning` | Kickoff: Register, Pick a Language, Build Your Template | 9 | Type mismatch: 'DSA Basics Day 1 | C++ / Java / Python' was marked as 'stretch', should be 'optional'<br>Type mismatch: 'DSA Basics Day 2 | If-else, Loops' was marked as 'stretch', should be 'optional'<br>Order mismatch: Optional videos were appended after problem questions instead of preceding them | Corrected item types to 'optional'/'mock' and re-sequenced optional videos to precede problem lists matching reference | ✅ Aligned |
| 2 | `learning` | Time Complexity & Array Basics | 8 | Type mismatch: 'DSA Basics Day 3 | Functions' was marked as 'stretch', should be 'optional'<br>Type mismatch: 'DSA Basics Day 4 | Arrays and Linked List' was marked as 'stretch', should be 'optional'<br>Order mismatch: Optional videos were appended after problem questions instead of preceding them | Corrected item types to 'optional'/'mock' and re-sequenced optional videos to precede problem lists matching reference | ✅ Aligned |
| 3 | `learning` | Two Pointers I | 7 | None (Perfect match) | None required | ✅ Aligned |
| 4 | `learning` | Two Pointers II | 7 | None (Perfect match) | None required | ✅ Aligned |
| 5 | `learning` | Prefix Sum I | 7 | None (Perfect match) | None required | ✅ Aligned |
| 6 | `weekend practice` | Weekend Practice: Your First Timed Contest | 1 | None (Perfect match) | None required | ✅ Aligned |
| 7 | `rest` | Rest & Revise: Week 1 | 2 | Type mismatch: 'If You Are In A Tier 3 College, Watch This!' was marked as 'stretch', should be 'optional' | Corrected item types to 'optional'/'mock' and re-sequenced optional videos to precede problem lists matching reference | ✅ Aligned |
| 8 | `learning` | Prefix Sum II: Harder Questions & 2D Prefix | 6 | None (Perfect match) | None required | ✅ Aligned |
| 9 | `learning` | Hashing (HashMap / HashSet) | 7 | None (Perfect match) | None required | ✅ Aligned |
| 10 | `learning` | Sliding Window I | 7 | None (Perfect match) | None required | ✅ Aligned |
| 11 | `learning` | Sliding Window II | 8 | None (Perfect match) | None required | ✅ Aligned |
| 12 | `learning` | Kadane's Algorithm | 8 | None (Perfect match) | None required | ✅ Aligned |
| 13 | `weekend practice` | Weekend Practice: LeetCode Virtual Contest + 1 PYQ | 2 | None (Perfect match) | None required | ✅ Aligned |
| 14 | `rest` | Rest & Revise: Week 2 | 0 | None (Perfect match) | None required | ✅ Aligned |
| 15 | `learning` | Strings & Input Parsing (CodeVita style) | 6 | None (Perfect match) | None required | ✅ Aligned |
| 16 | `learning` | Number Theory I: Primes, Sieve, Factors, GCD | 7 | None (Perfect match) | None required | ✅ Aligned |
| 17 | `learning` | Number Theory II: Fast Power, Modulo, Counting | 7 | None (Perfect match) | None required | ✅ Aligned |
| 18 | `learning` | Bit Manipulation | 6 | None (Perfect match) | None required | ✅ Aligned |
| 19 | `learning` | Simulation, Dates & Matrices | 6 | None (Perfect match) | None required | ✅ Aligned |
| 20 | `weekend practice` | Weekend Practice: CodeVita PYQ Set | 4 | None (Perfect match) | None required | ✅ Aligned |
| 21 | `rest` | Rest & Revise: Week 3 | 0 | None (Perfect match) | None required | ✅ Aligned |
| 22 | `learning` | Stack Basics | 7 | None (Perfect match) | None required | ✅ Aligned |
| 23 | `learning` | Monotonic Stack | 7 | None (Perfect match) | None required | ✅ Aligned |
| 24 | `learning` | Sorting & Merge Intervals | 10 | Type mismatch: 'Master Merge Interval With Interview Questions (L35)' was marked as 'stretch', should be 'optional'<br>Order mismatch: Optional video was appended after problem questions instead of preceding them | Corrected item types to 'optional'/'mock' and re-sequenced optional videos to precede problem lists matching reference | ✅ Aligned |
| 25 | `learning` | Binary Search I | 10 | Type mismatch: 'Binary Search on 2D Array' was marked as 'stretch', should be 'optional'<br>Order mismatch: Optional video was appended after problem questions instead of preceding them | Corrected item types to 'optional'/'mock' and re-sequenced optional videos to precede problem lists matching reference | ✅ Aligned |
| 26 | `learning` | Binary Search II: Binary Search on the Answer | 9 | Type mismatch: 'Don't Miss This Binary Search Interview Question' was marked as 'stretch', should be 'optional'<br>Order mismatch: Optional video was appended after problem questions instead of preceding them | Corrected item types to 'optional'/'mock' and re-sequenced optional videos to precede problem lists matching reference | ✅ Aligned |
| 27 | `mock` | MOCK 1 — Full 3-Hour Simulation | 2 | None (Perfect match) | None required | ✅ Aligned |
| 28 | `rest` | Rest & Revise: Week 4 | 0 | None (Perfect match) | None required | ✅ Aligned |
| 29 | `learning` | Greedy Algorithms | 7 | None (Perfect match) | None required | ✅ Aligned |
| 30 | `learning` | Heaps I: Priority Queue & Top-K | 8 | None (Perfect match) | None required | ✅ Aligned |
| 31 | `learning` | Heaps II: Heap + Greedy | 9 | None (Perfect match) | None required | ✅ Aligned |
| 32 | `learning` | Recursion I | 8 | None (Perfect match) | None required | ✅ Aligned |
| 33 | `learning` | Recursion II: Backtracking | 9 | None (Perfect match) | None required | ✅ Aligned |
| 34 | `mock` | MOCK 2 — Full 3-Hour Simulation | 2 | None (Perfect match) | None required | ✅ Aligned |
| 35 | `rest` | Rest & Revise: Week 5 | 1 | None (Perfect match) | None required | ✅ Aligned |
| 36 | `learning` | Trees I: Traversals | 8 | None (Perfect match) | None required | ✅ Aligned |
| 37 | `learning` | Trees II: Height, Paths & LCA | 10 | None (Perfect match) | None required | ✅ Aligned |
| 38 | `learning` | Binary Search Trees & Tree Construction | 10 | None (Perfect match) | None required | ✅ Aligned |
| 39 | `learning` | Graphs I: Representation, BFS & DFS | 8 | None (Perfect match) | None required | ✅ Aligned |
| 40 | `learning` | Graphs II: Multi-Source BFS & Grid Shortest Paths | 8 | None (Perfect match) | None required | ✅ Aligned |
| 41 | `mock` | MOCK 3 — Full 3-Hour Simulation | 1 | None (Perfect match) | None required | ✅ Aligned |
| 42 | `rest` | Rest & Revise: Week 6 | 1 | Type mismatch: 'Never Fail Any Interview Again — Everything I Learnt After 12+ Interviews' was marked as 'stretch', should be 'optional' | Corrected item types to 'optional'/'mock' and re-sequenced optional videos to precede problem lists matching reference | ✅ Aligned |
| 43 | `learning` | Graphs III: Cycles, Topological Sort, Bipartite | 7 | None (Perfect match) | None required | ✅ Aligned |
| 44 | `learning` | Graphs IV: Dijkstra & Bellman-Ford | 7 | None (Perfect match) | None required | ✅ Aligned |
| 45 | `learning` | Graphs V: MST, Union-Find & Bridges | 10 | None (Perfect match) | None required | ✅ Aligned |
| 46 | `learning` | DP I: What DP Is + 1D DP | 7 | None (Perfect match) | None required | ✅ Aligned |
| 47 | `learning` | DP II: House Robber & 0/1 Knapsack | 6 | None (Perfect match) | None required | ✅ Aligned |
| 48 | `mock` | MOCK 4 — Full 3-Hour Simulation | 2 | None (Perfect match) | None required | ✅ Aligned |
| 49 | `rest` | Rest & Revise: Week 7 | 0 | None (Perfect match) | None required | ✅ Aligned |
| 50 | `learning` | DP III: Subset Sum & Coin Change | 7 | None (Perfect match) | None required | ✅ Aligned |
| 51 | `learning` | DP IV: LIS & LCS | 6 | None (Perfect match) | None required | ✅ Aligned |
| 52 | `learning` | DP V: Grid DP + Full DP Revision | 8 | None (Perfect match) | None required | ✅ Aligned |
| 53 | `learning` | Geometry & String Matching (hard-set prep) | 9 | None (Perfect match) | None required | ✅ Aligned |
| 54 | `mock` | MOCK 5 — Final Dress Rehearsal | 2 | Type mismatch: 'Codeforces Div. 3 — Virtual Contest' was marked as 'stretch', should be 'mock' (alternative contest option in reference) | Corrected item types to 'optional'/'mock' and re-sequenced optional videos to precede problem lists matching reference | ✅ Aligned |
| 55 | `final revision` | Final Revision | 4 | Type mismatch: 'DSA Bhool Jaate Ho? How to Revise DSA' was marked as 'stretch', should be 'optional'<br>Type mismatch: 'Two Pointers — Complete Revision' was marked as 'stretch', should be 'optional'<br>Type mismatch: 'Revise Stack in 10 Minutes' was marked as 'stretch', should be 'optional'<br>Type mismatch: 'DP Full Revision' was marked as 'stretch', should be 'optional' | Corrected item types to 'optional'/'mock' and re-sequenced optional videos to precede problem lists matching reference | ✅ Aligned |
| 56 | `exam eve` | Exam Eve: Rules, Checklist, Sleep | 1 | None (Perfect match) | None required | ✅ Aligned |

---

## 3. Detailed Breakdown of Applied Fixes

### A. Order and Type Corrections on Learning Days
1. **Day 1 (`learning`)**:
   - Re-ordered `d1-s1` ("DSA Basics Day 1 | C++ / Java / Python") and `d1-s2` ("DSA Basics Day 2 | If-else, Loops") to appear immediately following the 3 core video lectures (`d1-v1`, `d1-v2`, `d1-v3`), and before the problem set (`d1-p1`..`d1-p4`).
   - Updated type from `stretch` to `optional`.
2. **Day 2 (`learning`)**:
   - Re-ordered `d2-s1` ("DSA Basics Day 3 | Functions") and `d2-s2` ("DSA Basics Day 4 | Arrays and Linked List") immediately after videos (`d2-v1`, `d2-v2`), and before problems (`d2-p1`..`d2-p4`).
   - Updated type from `stretch` to `optional`.
3. **Day 7 (`rest`)**:
   - Updated `d7-s1` ("If You Are In A Tier 3 College, Watch This!") type from `stretch` to `optional`.
4. **Day 24 (`learning`)**:
   - Re-ordered `d24-s1` ("Master Merge Interval With Interview Questions (L35)") immediately after videos (`d24-v1`..`d24-v4`), and before problems (`d24-p1`..`d24-p5`).
   - Updated type from `stretch` to `optional`.
5. **Day 25 (`learning`)**:
   - Re-ordered `d25-s1` ("Binary Search on 2D Array") immediately after videos (`d25-v1`..`d25-v4`), and before problems (`d25-p1`..`d25-p5`).
   - Updated type from `stretch` to `optional`.
6. **Day 26 (`learning`)**:
   - Re-ordered `d26-s1` ("Don't Miss This Binary Search Interview Question") immediately after videos (`d26-v1`..`d26-v4`), and before problems (`d26-p1`..`d26-p4`).
   - Updated type from `stretch` to `optional`.
7. **Day 42 (`rest`)**:
   - Updated `d42-s1` ("Never Fail Any Interview Again — Everything I Learnt After 12+ Interviews") type from `stretch` to `optional`.
8. **Day 54 (`mock`)**:
   - Updated `d54-m2` ("Codeforces Div. 3 — Virtual Contest") type from `stretch` to `mock` to match reference contest categorization (while keeping it non-core in store progress so Mock 5 countable = 1).
9. **Day 55 (`final revision`)**:
   - Updated all 4 revision videos (`d55-s1`..`d55-s4`) type from `stretch` to `optional`.

### B. Stable IDs Verification
All item IDs (`d{day}-v{n}`, `d{day}-p{n}`, `d{day}-s{n}`, `d{day}-m{n}`) remain strictly unchanged. Existing progress ticks and localStorage state remain 100% valid.
