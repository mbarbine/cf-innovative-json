## 2026-04-04 - [SSRF Protection]
**Vulnerability:** The `/api/v1/fetch-url` endpoint was vulnerable to Server-Side Request Forgery (SSRF) because it fetched URLs without checking if the hostname belonged to a private or loopback IP range.
**Learning:** This could allow attackers to access internal network resources or perform port scanning via the server. Node.js `URL` object normalizes IPv4 addresses, which makes string-based hostname checks mostly sufficient for loopback IPs but still misses DNS rebinding.
**Prevention:** Implementing a blocklist for localhost, loopback addresses, and private IP ranges (like `10.0.0.0/8`) within the `fetch-url` endpoint mitigates the most common SSRF risks.
