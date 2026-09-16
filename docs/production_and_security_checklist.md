# Audit status

Every numbered checklist area has been assessed as COMPLETE, PARTIAL, MISSING, or NOT APPLICABLE in [production_security_audit.md](production_security_audit.md). The original checklist is preserved below so individual checks can be rerun against deployed infrastructure. Unchecked boxes must not be interpreted as verified.

🚀 Full-Stack Production Checklist

Legend:

☐ = needs checking
✅ = verified
❌ = problem found
1. 🧭 Navigation & Routing
Frontend
☐ Every navbar link works
☐ Every footer link works
☐ Logo is clickable
☐ Back buttons work correctly
☐ Browser back/forward navigation works
☐ No dead-end pages
☐ No links pointing to # unless intentional
☐ No links pointing to localhost
☐ No hardcoded development URLs
☐ Protected routes are actually protected
☐ Unauthorized users are redirected appropriately
☐ Authenticated users aren't unnecessarily shown login pages
☐ Refreshing a page doesn't unexpectedly log the user out
☐ Deep links work after refreshing the browser
Routing
☐ 404 page exists
☐ 403/unauthorized page exists where appropriate
☐ Server errors have a useful error page
☐ Invalid routes don't crash the application
2. 📱 Responsive Design

Test at minimum:

☐ 320px
☐ 375px
☐ 390px
☐ 414px
☐ 768px
☐ 1024px
☐ 1280px
☐ 1440px+

Check:

☐ No horizontal scrolling
☐ No elements overflowing the viewport
☐ Mobile navbar works
☐ Dropdowns work on mobile
☐ Modals fit on mobile
☐ Tables work on mobile
☐ Forms work on mobile
☐ Buttons are large enough to tap
☐ Text isn't cut off
☐ Images resize correctly
☐ Cards don't overflow
☐ Sidebars collapse appropriately
☐ Touch interactions work
☐ No functionality depends exclusively on hover
3. 🎨 UI / UX Polish
☐ Consistent spacing
☐ Consistent typography
☐ Consistent button styles
☐ Consistent border radius
☐ Consistent icons
☐ Consistent colors
☐ Loading states exist
☐ Empty states exist
☐ Error states exist
☐ Success states exist
☐ Confirmation dialogs exist for destructive actions
☐ Buttons visibly respond to interaction
☐ Disabled buttons look disabled
☐ Forms clearly show validation errors
☐ No placeholder content
☐ No lorem ipsum
☐ No fake user data accidentally left in production
☐ No "Coming Soon" sections unless intentional
☐ No unused navigation items
4. 🔘 Buttons & Interactions

Test every button.

For each button ask:

"What exactly happens when I click this?"

☐ Submit buttons work
☐ Save buttons work
☐ Delete buttons work
☐ Edit buttons work
☐ Cancel buttons work
☐ Close buttons work
☐ Dropdowns work
☐ Search works
☐ Filters work
☐ Pagination works
☐ Tabs work
☐ Copy buttons work
☐ Share buttons work
☐ Logout works
☐ Login works
☐ Register works
☐ Password reset works
☐ No buttons that silently do nothing
5. 📝 Forms

For every form:

☐ Required fields are validated
☐ Email validation
☐ Password validation
☐ Minimum/maximum lengths
☐ Numeric validation
☐ Date validation
☐ File type validation
☐ File size validation
☐ Invalid input gets useful feedback
☐ Successful submission gives feedback
☐ Server errors are displayed
☐ Form doesn't submit twice accidentally
☐ Submit button shows loading state
☐ Form state survives appropriate failures
☐ Inputs have proper labels
☐ Keyboard navigation works
☐ Autofill works where appropriate
6. ⚡ Loading & Performance
☐ Compress images
☐ Use WebP/AVIF where appropriate
☐ Resize oversized images
☐ Lazy-load non-critical images
☐ Don't load unnecessary fonts
☐ Don't load unnecessary JavaScript
☐ Code splitting where appropriate
☐ Lazy-load large components
☐ Avoid unnecessary API requests
☐ Avoid duplicate API requests
☐ Cache appropriate data
☐ Optimize database queries
☐ Add pagination for large datasets
☐ Avoid loading thousands of records at once
☐ Avoid N+1 database queries
☐ Test slow network conditions
☐ Test on a lower-end device
7. 🔍 SEO

For public-facing websites:

☐ Correct page title
☐ Meta description
☐ Favicon
☐ Open Graph metadata
☐ Social sharing preview
☐ Canonical URLs where needed
☐ Semantic HTML
☐ Proper heading hierarchy
☐ Descriptive image alt text
☐ robots.txt
☐ Sitemap
☐ Clean URLs
☐ No accidental noindex
☐ Production domain configured correctly

For private dashboards, SEO generally isn't important.

8. ♿ Accessibility

This is commonly forgotten.

☐ Every important image has appropriate alt text
☐ Decorative images aren't unnecessarily announced
☐ Inputs have labels
☐ Keyboard navigation works
☐ Visible focus states exist
☐ Buttons are actual <button> elements
☐ Links are actual <a> elements
☐ Don't use <div> as a fake button
☐ Sufficient color contrast
☐ Don't communicate information using color alone
☐ Modals are keyboard accessible
☐ Escape closes appropriate modals
☐ Screen readers can understand important content
☐ Form errors are accessible
☐ Text can be resized reasonably
9. 🔐 Authentication

This is where you need to be much more serious.

☐ Passwords are never stored in plaintext
☐ Passwords are hashed using a strong password-hashing algorithm
☐ Password requirements are reasonable
☐ Login rate limiting exists
☐ Brute-force protection exists
☐ Account enumeration is minimized
☐ Session expiration is configured
☐ Logout invalidates the session appropriately
☐ Password reset tokens expire
☐ Password reset tokens are single-use
☐ Email verification tokens expire
☐ Email verification tokens are single-use
☐ Sessions can be revoked
☐ "Remember me" is implemented securely
☐ MFA can be considered for sensitive applications
☐ OAuth callbacks are validated properly
☐ Authentication state isn't trusted solely because the frontend says you're logged in
Very important:

Never do this:

if (user.isAdmin) {
    showAdminPanel();
}

and assume that means the user is an admin.

The backend must enforce authorization.

10. 🛡️ Authorization

Authentication asks:

"Who are you?"

Authorization asks:

"Are you allowed to do this?"

For every API endpoint ask:

Who can access this?
What can they read?
What can they modify?
What can they delete?

Check:

☐ Users can only access their own resources
☐ Admin endpoints require admin privileges
☐ Regular users cannot call admin APIs
☐ Users cannot modify another user's data
☐ Ownership is checked server-side
☐ Role permissions are enforced server-side
☐ Hidden frontend buttons aren't treated as security
☐ Object IDs aren't enough to grant access

For example:

GET /api/users/123/orders

should not automatically mean:

"If you're logged in, you can see user 123's orders."

The backend needs to verify that the requesting user is actually allowed to access them.

11. 🚨 API Security

Every API endpoint should be reviewed.

☐ Authentication required where necessary
☐ Authorization required where necessary
☐ Input validation
☐ Output validation where appropriate
☐ Request body size limits
☐ File upload limits
☐ Rate limiting
☐ Pagination
☐ Query parameter validation
☐ Proper HTTP status codes
☐ Generic error responses
☐ No stack traces exposed to users
☐ No database errors exposed to users
☐ No internal paths exposed
☐ No secrets returned by APIs
☐ Sensitive fields aren't accidentally serialized

Bad:

{
  "user": {
    "passwordHash": "...",
    "resetToken": "...",
    "email": "..."
  }
}

Only return what the client actually needs.

12. 💉 Injection Protection

Your application should defend against injection attacks.

SQL Injection

Never construct queries like:

query(
  `SELECT * FROM users WHERE id = '${userId}'`
)

Use:

parameterized queries
prepared statements
safe ORM/query-builder mechanisms
NoSQL Injection

Validate and sanitize query inputs.

Command Injection

Never blindly pass user input into:

shell commands
system()
exec()
subprocess
LDAP/XML/etc.

If your application uses these systems, use their appropriate safe APIs and validation mechanisms.

13. 🕷️ XSS Protection

Be extremely careful when displaying user-generated content.

Potentially dangerous:

innerHTML = userInput

or framework equivalents that intentionally bypass escaping.

Check:

☐ User input is escaped
☐ HTML isn't rendered unless explicitly required
☐ Rich text is sanitized
☐ URLs are validated
☐ JavaScript URLs are rejected
☐ CSP is considered
☐ Third-party scripts are minimized
14. 🔄 CSRF Protection

If your authentication uses cookies, think about CSRF.

Check:

☐ Appropriate SameSite cookie settings
☐ CSRF protection for state-changing requests where needed
☐ Origin/Referer validation where appropriate
☐ Don't change data through GET requests

Bad:

GET /delete-account

A GET request should not perform destructive actions.

Better:

DELETE /account

with appropriate authentication and CSRF protections.

15. 🍪 Cookie & Session Security

For authentication cookies:

☐ Secure
☐ HttpOnly
☐ Appropriate SameSite
☐ Reasonable expiration
☐ Session IDs aren't exposed in URLs
☐ Session IDs aren't stored in logs
☐ Session invalidation works
☐ Session rotation is considered after authentication/privilege changes

Especially:

HttpOnly

helps prevent JavaScript from directly reading authentication cookies.

16. 🔑 Secrets & Environment Variables

This is critical for GitHub projects.

Never commit:

.env
API keys
database passwords
JWT secrets
private keys
OAuth secrets
cloud credentials

Check:

☐ .env is in .gitignore
☐ .env.example exists
☐ Production secrets are stored securely
☐ No secrets in frontend source code
☐ No secrets in Git history
☐ API keys have minimal permissions
☐ Secrets can be rotated
☐ Different credentials are used for development/production

And remember:

Anything shipped to the browser is not secret.

This is NOT safe:

const API_KEY = "my-secret-key";

in frontend code.

17. 🧱 Security Headers

For production web applications, consider appropriate security headers such as:

Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
Permissions-Policy

Depending on your application and deployment setup, also configure framing protections appropriately.

Don't blindly copy a giant security-header configuration from the internet. Some headers can break legitimate functionality if configured incorrectly.

18. 🔒 HTTPS

Production applications should use HTTPS.

Check:

☐ HTTPS enabled
☐ HTTP redirects to HTTPS
☐ TLS certificate valid
☐ Secure cookies
☐ No mixed HTTP/HTTPS content
☐ API uses HTTPS
☐ Third-party resources use HTTPS

Never send passwords or session credentials over plain HTTP.

19. 📁 File Upload Security

If your application accepts files:

☐ Validate file size
☐ Validate file type
☐ Don't trust the filename
☐ Don't trust the MIME type supplied by the client
☐ Generate safe filenames
☐ Store uploads outside executable directories where appropriate
☐ Restrict executable file types
☐ Scan uploads where appropriate
☐ Restrict upload permissions
☐ Prevent path traversal
☐ Don't expose private uploads publicly by default

Especially watch for:

../../something

and malicious files disguised with innocent extensions.

20. 🚫 Rate Limiting

Rate-limit endpoints that can be abused.

Especially:

/login
/register
/password-reset
/verify-email
/search
/contact
/file-upload
/expensive-api

For example, don't allow someone to send:

10,000 login attempts / second
21. 🧹 Input Validation

Never assume frontend validation is enough.

You need:

Frontend validation
        +
Backend validation

The frontend is for UX.

The backend is for security.

Validate:

☐ Types
☐ Length
☐ Format
☐ Range
☐ Required fields
☐ Allowed values
☐ IDs
☐ Dates
☐ Files
☐ JSON structure
22. 🗄️ Database Security
☐ Database isn't publicly exposed unnecessarily
☐ Strong database credentials
☐ Least-privilege database user
☐ Production DB credentials aren't committed
☐ Backups exist
☐ Backups are tested
☐ Database migrations are version-controlled
☐ Foreign keys/constraints where appropriate
☐ Unique constraints where needed
☐ Indexes exist for important queries
☐ Sensitive data isn't unnecessarily stored
☐ Deleted data behavior is intentional
23. 🔐 Sensitive Data

Ask:

"Do I actually need to store this?"

Don't store sensitive information simply because you might need it later.

Check:

☐ Passwords aren't stored
☐ Tokens aren't unnecessarily stored
☐ Sensitive data is encrypted where appropriate
☐ Personal data exposure is minimized
☐ API responses don't leak sensitive fields
☐ Logs don't contain sensitive information
☐ Error messages don't contain sensitive information
24. 📝 Logging

You need logs, but secure logs.

Good:

User authentication failed
Request ID: abc123

Bad:

Login failed:
password=SuperSecret123
token=eyJhbG...

Check:

☐ Errors are logged
☐ Important security events are logged
☐ Logs have timestamps
☐ Logs have request/user identifiers where appropriate
☐ Passwords aren't logged
☐ Tokens aren't logged
☐ API keys aren't logged
☐ Sensitive personal data isn't unnecessarily logged
25. 🧯 Error Handling

Production users shouldn't see:

TypeError: Cannot read properties of undefined
    at /home/user/project/src/...

Instead:

Something went wrong.
Please try again.

Meanwhile the detailed error goes into your server-side logging system.

Check:

☐ Global frontend error handling
☐ Global backend error handling
☐ 404 handling
☐ 400 handling
☐ 401 handling
☐ 403 handling
☐ 404 handling
☐ 409 handling
☐ 429 handling
☐ 500 handling
☐ User-friendly messages
☐ Detailed server-side logs
26. 🧪 Testing
Unit tests
☐ Important functions tested
☐ Business logic tested
☐ Edge cases tested
Integration tests
☐ API endpoints tested
☐ Database interactions tested
☐ Authentication tested
End-to-end

Test actual user journeys:

Register
 ↓
Login
 ↓
Create something
 ↓
Edit it
 ↓
Delete it
 ↓
Logout

Also test:

Invalid login
Expired session
Unauthorized request
Invalid input
Server failure
Empty database
27. 🔥 Edge Cases

Don't only test:

normal user
normal input
normal network
normal database

Test:

☐ Empty input
☐ Very long input
☐ Duplicate input
☐ Negative numbers
☐ Zero
☐ Extremely large numbers
☐ Invalid IDs
☐ Missing IDs
☐ Deleted resources
☐ Expired sessions
☐ Slow network
☐ Offline mode
☐ API timeout
☐ Database failure
☐ Two users editing simultaneously

This is where a lot of bugs hide.

28. 📊 Database & Backend Performance

Check your backend with realistic data.

For example:

10 users
100 users
10,000 users
1,000,000 records

Ask:

"Will this still work when the database gets large?"

Check:

☐ Indexes
☐ Pagination
☐ Query optimization
☐ Connection pooling
☐ Caching where appropriate
☐ Background jobs for expensive operations
☐ No unnecessary repeated queries
29. 🌐 API Design
☐ Consistent endpoint naming
☐ Correct HTTP methods
☐ Correct status codes
☐ Consistent error format
☐ Consistent response format
☐ API versioning strategy if needed
☐ Pagination
☐ Filtering
☐ Sorting
☐ Search
☐ Validation
☐ Authentication
☐ Authorization
☐ Rate limiting
☐ API documentation
30. 🧑‍💻 Admin Panel

If your application has an admin system:

☐ Admin authentication
☐ Admin authorization
☐ Role-based permissions
☐ Audit logs
☐ Dangerous actions require confirmation
☐ Admin APIs protected independently
☐ User impersonation, if present, is tightly controlled
☐ Sensitive admin actions are logged
☐ Admin routes aren't merely hidden from regular users
31. 📧 Email System

If your application sends emails:

☐ Email verification
☐ Password reset
☐ Correct sender
☐ Correct reply-to
☐ Failed emails handled
☐ Rate limits
☐ Reset links expire
☐ Tokens are single-use
☐ Don't expose whether an account exists unnecessarily
32. 🖼️ Images & Assets
☐ Images compressed
☐ Correct dimensions
☐ Appropriate formats
☐ Alt text
☐ Lazy loading
☐ No unnecessary duplicate images
☐ Fonts optimized
☐ Icons optimized
☐ No unused assets
33. 📱 PWA / Mobile Features — If Applicable

If you're building something that behaves like an app:

☐ Installability
☐ Manifest
☐ App icon
☐ Offline behavior
☐ Network failure handling
☐ Mobile navigation
☐ Touch interactions
☐ Appropriate viewport configuration
34. 🏗️ Code Quality

Before shipping:

☐ Remove dead code
☐ Remove unused imports
☐ Remove debug console.log
☐ Remove test accounts
☐ Remove temporary components
☐ Remove commented-out junk
☐ Consistent naming
☐ Functions aren't unnecessarily huge
☐ Components aren't unnecessarily huge
☐ No duplicated business logic
☐ Environment configuration is clean
☐ Dependencies are actually needed
35. 📦 Dependencies

Check:

☐ Dependencies are necessary
☐ Versions are controlled
☐ Vulnerable dependencies are addressed
☐ Lockfile is committed
☐ Unused packages removed
☐ Packages aren't unnecessarily duplicated
☐ Dependency update strategy exists

Run your ecosystem's dependency/security audit before deployment.

36. 🐳 Deployment

Production configuration:

☐ Production environment variables
☐ Production database
☐ HTTPS
☐ Domain
☐ DNS
☐ CORS configuration
☐ Error logging
☐ Database migrations
☐ Build process
☐ Health checks
☐ Restart behavior
☐ Resource limits
☐ Backups
37. 🔀 CORS

Don't blindly deploy:

Access-Control-Allow-Origin: *

especially when credentials are involved.

Define exactly which origins should be able to communicate with your API.

For example:

Production frontend
        ↓
Production API

rather than:

ANY WEBSITE
        ↓
YOUR API
38. 💾 Backups & Disaster Recovery

A production project isn't finished if losing the database means losing everything.

☐ Automated backups
☐ Backup retention policy
☐ Backups stored separately
☐ Restore process tested
☐ Database recovery procedure documented
☐ Important files backed up
☐ Recovery plan exists

The important part isn't:

"We have backups."

It's:

"We have successfully restored from a backup."

39. 📈 Monitoring

After deployment, you need to know when things break.

Monitor things like:

Server uptime
API errors
Database errors
Response times
CPU
Memory
Disk
Traffic
Failed authentication

Set alerts for serious failures.

40. 🩺 Health Checks

Have something like:

GET /health

which verifies that the application is alive.

For larger systems, you may also have separate readiness/dependency checks.

Useful for:

deployment systems
containers
load balancers
monitoring
uptime systems
41. 🔍 Security Audit

Before deployment, manually ask:

Authentication
Can I bypass login?
Can I access another user's account?
Can I reuse an expired token?
Can I brute-force login?
Authorization
Can user A access user B's data?
Can a normal user call admin endpoints?
Can I modify another user's resource by changing an ID?
API
What happens if I send unexpected JSON?
What happens if I omit required fields?
What happens if I send huge input?
Files
Can I upload an unsafe file?
Can I access another user's upload?
Can I manipulate the filename?
Frontend
Are secrets exposed?
Are internal API endpoints exposed unnecessarily?
Can I modify client-side state and gain privileges?
42. 🧨 Test IDOR/BOLA

This deserves its own checklist item because it's an extremely important web-app authorization problem.

Imagine:

GET /api/orders/100

You own order 100.

Now change it to:

GET /api/orders/101

If 101 belongs to another user and you can see it:

🚨 Security vulnerability.

The backend must check ownership/authorization.

Don't rely on:

"Nobody will guess the ID."

Security must not depend on IDs being difficult to guess.

43. 🔐 Password & Account Security

Consider:

☐ Password reset
☐ Email verification
☐ Session revocation
☐ Password change
☐ Re-authentication for sensitive operations
☐ MFA for sensitive applications
☐ Login notifications where appropriate
☐ Rate limiting
☐ Brute-force protection

For particularly sensitive operations:

Change email
Change password
Delete account
Change payment information
Generate API keys

consider requiring recent authentication.

44. 💳 Payments — If Applicable

If your project handles payments:

☐ Never store raw card numbers unless you have a very specific compliant architecture
☐ Use a reputable payment provider
☐ Verify payment webhooks server-side
☐ Don't trust the frontend payment result
☐ Verify transaction amounts
☐ Verify transaction IDs
☐ Handle duplicate webhooks
☐ Handle failed payments
☐ Handle refunds
☐ Log payment events safely
☐ Don't expose payment secrets
45. 🧹 Production Cleanup

Before saying:

PROJECT COMPLETE

search your entire project for:

TODO
FIXME
console.log
debugger
localhost
127.0.0.1
password
secret
api_key
token
test@example.com
Lorem ipsum
Coming soon
placeholder

Not every match is automatically a vulnerability, but every match deserves inspection.

46. 📄 Legal / Product Pages

Depending on the project:

☐ Privacy Policy
☐ Terms of Service
☐ Cookie information where applicable
☐ Contact information
☐ Refund policy
☐ Data deletion process
☐ Account deletion
☐ Appropriate consent mechanisms

The exact requirements depend on your users, country, and type of data you process.

47. 🧪 Final User Journey Test

Pretend you've never seen the application before.

Start from:

Website
   ↓
Register
   ↓
Verify
   ↓
Login
   ↓
Dashboard
   ↓
Create something
   ↓
Edit something
   ↓
Delete something
   ↓
Search
   ↓
Logout
   ↓
Login again
   ↓
Reset password

Do the entire journey on:

Desktop
Mobile
Slow internet
Fresh account
Existing account
Invalid input
48. 🚀 Final Production Checklist

Before deployment:

☐ No horizontal scroll
☐ No broken links
☐ Mobile navigation
☐ Favicon
☐ Page titles
☐ Meta descriptions
☐ Working footer
☐ 404 page
☐ Dynamic copyright
☐ Optimized images
☐ Working buttons
☐ Success messages
☐ Error messages
☐ No placeholders
☐ No unused navigation
☐ Mobile optimized

☐ Authentication secure
☐ Authorization enforced
☐ API validation
☐ Rate limiting
☐ CSRF protection where needed
☐ XSS protection
☐ SQL/NoSQL injection protection
☐ Secure cookies
☐ HTTPS
☐ Security headers
☐ Secrets protected
☐ File uploads secured
☐ CORS configured
☐ IDOR/BOLA checked
☐ Sensitive data protected
☐ Logs sanitized

☐ Database backups
☐ Database indexes
☐ Database migrations
☐ Error monitoring
☐ Health checks
☐ Performance tested
☐ Unit tests
☐ Integration tests
☐ E2E tests
☐ Dependency audit

☐ Production environment configured
☐ Domain configured
☐ DNS configured
☐ CI/CD working
☐ Rollback strategy
☐ Documentation
☐ README updated
☐ Deployment instructions
☐ Recovery instructions
The checklist I would use for YOUR projects

Since you're building SDE/full-stack projects, don't treat all 48 sections equally.

I'd divide them into three levels:

🔴 MUST PASS

These are non-negotiable:

Authentication
Authorization
Input validation
Secrets
SQL injection
XSS
CSRF where applicable
IDOR/BOLA
Rate limiting
HTTPS
Secure cookies
File upload security
Database security
Error handling
Backups
Broken links
Mobile responsiveness
🟡 SHOULD PASS
Performance
Accessibility
SEO
Testing
Monitoring
Logging
API documentation
Dependency auditing
Health checks
Database optimization
🟢 POLISH
Animations
Micro-interactions
Advanced caching
PWA
Social previews
Advanced analytics
Extra UI polish

That distinction is important.

Don't spend three hours making a button animation while your API lets User A request User B's data.q