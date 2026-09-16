# Security

## Supported architecture

GymTracker uses Django as the trusted authentication and authorization boundary. Next.js renders the product UI and proxies browser API traffic through the same origin.

### Password and email flow

- Django stores password hashes through the built-in authentication framework.
- Registration runs Django password validators and creates an inactive user.
- Email verification uses a six-digit code, a secret-keyed SHA-256 digest in the database, a 24-hour default expiry, and single-use consumption.
- Password reset uses the same hashed-code design with a 15-minute default expiry.
- Password-reset request responses are generic to reduce account enumeration.
- A successful reset blacklists all outstanding refresh tokens for the account.
- Email and username login return a generic credential error.

### JWT and cookies

- Access lifetime defaults to 10 minutes.
- Refresh lifetime defaults to 7 days.
- Refresh tokens rotate and the old token is blacklisted.
- Access and refresh tokens are HttpOnly and scoped to `/api/`.
- Production requires Secure cookies and HTTPS.
- Unsafe cookie-authenticated requests enforce Django CSRF validation.
- Bearer authentication remains available for a future trusted native client and does not use browser cookie CSRF semantics.
- Logout blacklists the current refresh token and deletes authentication cookies.
- A separate HttpOnly marker cookie contains only `1` and supports an optimistic Next.js page redirect. It is not trusted for API authorization. Django session bootstrap remains authoritative.

The Axios interceptor queues concurrent failures, refreshes once, retries each original request once, and returns to login after refresh failure. It excludes login, refresh, and CSRF endpoints from recursive refresh.

### OAuth

Google and GitHub use backend-owned authorization-code flows:

1. The browser sends a CSRF-protected start request.
2. Django generates signed, expiring state and sets the same state in a provider-specific HttpOnly cookie.
3. The provider redirects to the Django callback.
4. Django compares the query state with the cookie using constant-time comparison and verifies signature, age, provider, and allowlisted destination.
5. Django exchanges the code and fetches a verified email over TLS.
6. Provider tokens are discarded after profile retrieval.
7. Django creates or resolves the local account and issues normal GymTracker cookies.

No access token, refresh token, provider token, or OAuth code is placed in the frontend redirect URL.

Account-linking rules:

- An existing provider subject logs into its linked account.
- A signed-in user can explicitly connect a provider from Profile.
- A provider identity cannot be connected to two users.
- A user can have at most one identity per provider.
- An anonymous OAuth attempt that matches an existing email is rejected. The user must password-authenticate first and explicitly link.
- A provider-created user has an unusable local password until password recovery establishes one.

### Authorization and private data

All product APIs require authentication by default. Workouts, sets, bodyweight, custom exercises, favorites, analytics, and journal records are scoped through `request.user`. Cross-user object requests resolve as 404. Relation validation prevents attaching a set to another user workout or using another user custom exercise.

Journal responses omit the owner field. Journal content is not emitted in custom logs, analytics events, or error messages.

### Input and response security

- Django ORM is used for application queries.
- Set number, weight, reps, RPE, RIR, and bodyweight have serializer limits and database check constraints.
- A user can have only one active workout draft; completion state must match its timestamp, and set numbers are unique per workout exercise. Draft sets are excluded from analytics.
- Request bodies default to a 2 MiB limit.
- Exercise catalog page size is capped.
- OAuth provider responses are capped at 1 MiB.
- React escapes journal and user text; there is no unsafe HTML rendering.
- API 500 responses are generic while server logs receive method, path, and user ID.
- Next and Django add framing, content sniffing, referrer, permissions, HSTS, and CSP-related controls as appropriate.

## Production configuration

Production startup fails when any of these conditions apply:

- Missing or short Django secret.
- Empty allowed-host list.
- SQLite selected instead of PostgreSQL.
- Insecure JWT cookies.
- Non-HTTPS frontend URL.
- Console email backend.
- Missing Google or GitHub OAuth configuration.

CORS and CSRF origins are environment-controlled. Wildcard credentialed CORS is not enabled.

## Rate limits

DRF applies global anonymous/authenticated throttles and scoped limits to login, refresh, registration, email verification, password reset, OAuth, and search. The default Django cache is suitable only for a single development process. A production multi-instance deployment must configure a shared cache such as Redis before the rate-limit control is considered complete.

## Logging

Custom application logging records action type and internal user ID, never passwords, JWTs, OAuth tokens, reset codes, verification codes, or journal content. Production still needs a managed log sink, request correlation, retention rules, redaction validation, and alerting.

## Known limitations

These items currently block a production-ready declaration:

- Real Google/GitHub credentials and callback behavior have not been exercised in deployed infrastructure.
- SMTP delivery, bounce handling, and retry strategy have not been validated with a production provider.
- Rate limiting is not distributed until a shared cache is configured.
- No MFA, account deletion, account-wide session-management UI, recent-auth challenge, or OAuth unlink flow.
- No browser E2E suite, device matrix, accessibility automation, or load test.
- CSP permits inline script/style required by the current Next build; nonce-based tightening remains an opportunity.
- Managed HTTPS, backups, restore drills, monitoring, alerts, CI/CD, rollback, and disaster recovery are outside the current local repository state.
- Privacy policy, terms, consent, retention, and data-deletion documentation are not complete.
- Git history has not been scanned with a dedicated secret-scanning tool.

## Reporting a vulnerability

Do not open a public issue containing credentials, private journal content, tokens, or reproduction data from another user. Until a dedicated security address is configured, contact the repository owner privately with a minimal reproduction and affected version.
