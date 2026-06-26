# PRE_LAUNCH_BUG_TRACKER.md — Aishwaryam Bug Tracker

> Track all issues discovered during UAT here. Assign severity and status before final release.  
> Link to `LOCAL_UAT_CHECKLIST.md` test case IDs where applicable.

---

## Severity Legend

| Symbol | Severity | Definition |
|:---|:---|:---|
| 🔴 | CRITICAL | App crash, data loss, financial error |
| 🟠 | HIGH | Major UX break, flow blocked |
| 🟡 | MEDIUM | Minor functional issue, workaround exists |
| 🟢 | LOW | Visual/aesthetic issue |
| ✅ | RESOLVED | Fixed and verified |

---

## Bug Log

| ID | Checklist Ref | Severity | Area | Description | Screen/File | Steps to Reproduce | Status | Fix Summary |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| BUG-001 | — | — | — | (Add bugs here during UAT) | — | — | 🔘 Open | — |

---

## Pre-Launch Must-Fix List (Resolved Before AAB Generation)

> Copy all 🔴 CRITICAL and 🟠 HIGH bugs into this section once identified. All must show ✅ RESOLVED before generating the release `.aab`.

| Bug ID | Description | Resolved By | Verification Date |
|:---|:---|:---|:---|
| (none yet — add after UAT run) | | | |

---

## UAT Sign-Off

| Tester | Role | Date | Overall Verdict | Comments |
|:---|:---|:---|:---|:---|
| | Developer | | ☐ PASS / ☐ FAIL | |
| | Business Owner | | ☐ PASS / ☐ FAIL | |

---

> **Final Release Gating Rule:**  
> The `.aab` for Play Store submission may only be generated when:
> 1. ALL 🔴 CRITICAL bugs = ✅ RESOLVED  
> 2. ALL 🟠 HIGH bugs = ✅ RESOLVED or deferred with written justification  
> 3. UAT Sign-Off table fully completed by both Developer and Business Owner
