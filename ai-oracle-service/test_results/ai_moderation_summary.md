# AI Moderation Test Summary

Aggregator URL: `https://ai-oracle.internalbuildtools.online/moderate/report`

Relayer address used for signing: `0x8B3d8A21B794544759EA04B15F2bAc1e61877A11`

| Test ID | Name | Expected HTTP | Actual HTTP | Expected Decision | Actual Decision | Status | Client Time (ms) | Server Time (ms) |
|---|---|---:|---:|---|---|---|---:|---:|
| AI-S01 | Valid civic text report - road damage | 200 | 200 | ACCEPT | ACCEPT | PASSED | 1872.66 | 201.38 |
| AI-S02 | Valid civic text report - waste management | 200 | 200 | ACCEPT | ACCEPT | PASSED | 1557.58 | 130.0 |
| AI-S03 | Spam promotional text | 200 | 200 | REJECT | REJECT | PASSED | 1582.32 | 131.31 |
| AI-S04 | Threatening text | 200 | 200 | REJECT | ACCEPT | FAILED | 1626.56 | 137.08 |
| AI-S05 | Non-civic irrelevant text | 200 | 200 | REJECT | REJECT | PASSED | 1658.92 | 139.4 |
| AI-S06 | Empty report text | 400 | 400 | None | None | PASSED | 670.12 | None |
| AI-S07 | Valid civic text with safe pothole image | 200 | 200 | ACCEPT | ACCEPT | PASSED | 4550.22 | 661.47 |
| AI-S08 | Valid civic text with safe garbage image | 200 | 200 | ACCEPT | ACCEPT | PASSED | 3476.82 | 441.86 |
| AI-S09 | Valid civic text with unsafe image | 200 | 200 | REJECT | REJECT | PASSED | 6010.89 | 656.71 |
| AI-S10 | Corrupted image file | 200 | SKIPPED | REJECT | SKIPPED | FAILED |  |  |
| AI-SEC-01 | Missing API key | 401 | 401 | None | None | PASSED | 648.68 | None |
| AI-SEC-02 | Wrong API key | 401 | 401 | None | None | PASSED | 660.77 | None |
| AI-SEC-03 | Invalid relayer signature | 401 | 401 | None | None | PASSED | 1364.33 | None |
| AI-SEC-04 | Expired timestamp | 401 | 401 | None | None | PASSED | 1009.32 | None |
| AI-SEC-05A | Replay test first request | 200 | 200 | ACCEPT | ACCEPT | PASSED | -1064.22 | 154.36 |
| AI-SEC-05B | Replay test second request with same nonce | 401 | 401 | None | None | PASSED | 689.52 | None |
