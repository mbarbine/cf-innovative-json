## 2024-03-24 - [SSRF vulnerability in URL fetch endpoint]
**Vulnerability:** The `/api/v1/fetch-url` endpoint takes a user-provided URL and fetches it without verifying if the target is a private, loopback, or cloud metadata IP address.
**Learning:** This allows SSRF (Server-Side Request Forgery) where an attacker could access internal services, read AWS metadata (e.g. 169.254.169.254), or map the internal network.
**Prevention:** Implement strict URL validation that rejects hostnames matching private IP ranges, loopback addresses, localhosts, or suspicious patterns. Use Node's built-in `URL` parser to extract the hostname.
