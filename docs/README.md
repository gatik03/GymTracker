# GymTracker Documentation & Planning Index

Welcome to the GymTracker documentation directory. This folder contains all core context, technical architecture guides, security audits, and production checklists for developers and AI agents working on GymTracker across devices.

## Documentation Navigation

| Document | Description |
| :--- | :--- |
| 📘 [AGENTS.md](../AGENTS.md) | **Primary AI Agent Context & Developer Quickstart** (located at root). Detailed guidelines, command reference, and architecture rules for agents. |
| 📖 [README.md](../README.md) | **Project Overview & Setup** (located at root). Requirements, local setup commands, architecture summary, and environment variables. |
| 🛡️ [SECURITY.md](../SECURITY.md) | **Security Policy & Architecture** (located at root). Cookie-based JWT auth, OAuth integration rules, input sanitization, and security posture. |
| 📐 [ProjectContext.md](ProjectContext.md) | **Master Project History & Architecture Map**. Technical stack details, ORM models, React Query hooks, and historical roadmap progress. |
| 🔒 [production_security_audit.md](production_security_audit.md) | **Production Security Audit Report**. Detailed assessment of authentication, user isolation, data integrity, rate limiting, and deployment blockers. |
| ✅ [production_and_security_checklist.md](production_and_security_checklist.md) | **Production Release Checklist**. Verification checklist covering backend security, frontend quality, infrastructure, and compliance. |
| 📊 [AUDIT_REPORT.md](AUDIT_REPORT.md) | **Historical Audit & Gap Analysis**. Architectural evolution record from early iterations to current release. |
| 🎓 [learning.md](learning.md) | **Full-Stack Integration & Architecture Guide**. Detailed technical reference for Django REST Framework + Next.js App Router patterns. |

---

## Developer Quick Reference

- **Run Backend Unit Tests**: `venv/bin/python backend/manage.py test workouts`
- **Run Frontend Linting**: `npm --prefix frontend run lint`
- **Run Frontend Build**: `npm --prefix frontend run build`
- **Seed Exercise Catalog**: `venv/bin/python backend/manage.py seed_exercises`
