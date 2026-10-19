# Project Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for production behavior changes. The driver uses native parallel agents only for disjoint file ownership and performs independent integration verification.

**Goal:** Resolve every priority finding from the October 2026 project reanalysis and leave the complete working tree in reviewable, independently verified commits.

**Architecture:** Four disjoint implementation leaves repair backend test discovery, production configuration, OpenAPI contracts, and the frontend build system. A driver-owned integration phase reconciles shared documentation, Docker/Windows commands, complete verification, graph refresh, and thematic commit boundaries.

**Tech Stack:** Python 3.14 local / Python 3.12 CI, Django 5.x, Django REST Framework, drf-spectacular, pytest-django, Hypothesis, React 19, TypeScript, Vite, Vitest, Testing Library, Docker Compose, GitHub Actions.

## Global Constraints

- Preserve current user-visible business rules unless a repaired regression test proves the implementation violates them.
- Do not discard, reset, overwrite, or rewrite existing user changes or published commits.
- Do not push or deploy.
- Production must fail closed; development and test must remain explicit, documented profiles.
- The default backend test command must discover the complete maintained suite.
- Frontend behavior, accessibility checks, localization, base-path behavior, and API URL behavior must survive the Vite migration.
- Every final commit must be thematic, reviewable, and independently coherent.
- Use test-first changes for new behavior; fixture-only compatibility repairs must first reproduce the current failure.

---

## File Responsibility Map

- `backend/apps/**/tests/`, `backend/pytest.ini`, `.github/workflows/ci.yml`: complete backend discovery and current-model fixtures.
- `backend/core/settings.py`, `backend/core/tests/test_runtime_regressions.py`, `backend/.env.example`, `backend/staticfiles/.gitkeep`: environment profiles, fail-closed production validation, static-root hygiene.
- `backend/apps/*/serializers.py`, selected API views, `backend/core/settings.py`, `backend/core/tests/test_schema.py`: explicit OpenAPI contracts. The security leaf owns `settings.py` first; the schema leaf starts only after security is verified.
- `frontend/package*.json`, Vite/Vitest configuration, frontend entry/environment files, `frontend/Dockerfile`, `frontend/nginx.conf`: frontend toolchain migration.
- `README.md`, `WINDOWS_DEPLOY.md`, `setup_win.bat`, `run_win.bat`, `docker-compose.yml`, graph outputs, and Git staging/history: driver-owned integration.

### Task 1: Modernize Backend Tests and CI Discovery

**Files:**
- Modify: `backend/apps/**/tests/test_*.py`
- Modify: `backend/pytest.ini`
- Modify: `.github/workflows/ci.yml`
- Delete: `backend/apps/finance/tests/test_serializers_properties.py.bak`

**Interfaces:**
- Consumes: `Program.levels: ManyToManyField[Level]`
- Produces: `pytest -q` as the canonical complete backend test command.

- [ ] **Step 1: Reproduce obsolete fixture failures**

Run:

```bash
cd backend
venv/bin/python -m pytest -q apps/academics/tests/test_serializers_properties.py --maxfail=1
```

Expected: failure containing `Program() got unexpected keyword arguments: 'level'`.

- [ ] **Step 2: Repair every obsolete Program fixture mechanically**

For each test fixture, change:

```python
program = Program.objects.create(
    name="Test Program",
    code=program_code,
    department=department,
    level=level,
)
```

to:

```python
program = Program.objects.create(
    name="Test Program",
    code=program_code,
    department=department,
)
program.levels.add(level)
```

Do not change `Enrollment.level`, `Course.level`, `ProgramFee.level`, or `Student.current_level`; those fields remain valid.

- [ ] **Step 3: Make generated unique fixtures independent**

Replace fixed unique rows inside Hypothesis examples such as:

```python
level = Level.objects.create(name="L1", order=1)
```

with example-scoped identifiers already derived by the test:

```python
test_id = str(uuid.uuid4())[:8]
level = Level.objects.create(name=f"L1-{test_id}", order=1)
```

Where identity is not under test, use:

```python
level, _ = Level.objects.get_or_create(name="L1", defaults={"order": 1})
```

Keep Hypothesis tests on `hypothesis.extra.django.TestCase` when they use `@given`; do not suppress uniqueness errors.

- [ ] **Step 4: Run repaired suites and fix genuine assertions test-first**

Run each app suite separately:

```bash
cd backend
venv/bin/python -m pytest -q apps/academics/tests
venv/bin/python -m pytest -q apps/accounts/tests apps/core/tests
venv/bin/python -m pytest -q apps/finance/tests
venv/bin/python -m pytest -q apps/students/tests apps/teachers/tests apps/scheduling/tests apps/university/tests
```

Expected: every command exits 0. If a behavioral assertion fails after fixture repair, preserve the failing test, identify its root cause, and change production code only when the current model/API contract requires it.

- [ ] **Step 5: Remove the file allowlist**

Set `backend/pytest.ini` to:

```ini
[pytest]
DJANGO_SETTINGS_MODULE = core.settings
python_files = test_*.py
addopts = --strict-markers
```

Remove the `.bak` test copy so it cannot drift or confuse maintenance.

- [ ] **Step 6: Prove discovery and update CI**

Run:

```bash
cd backend
venv/bin/python -m pytest --collect-only -q
venv/bin/python -m pytest -q
```

Expected: collection includes all `test_*.py` modules and the full run exits 0.

In `.github/workflows/ci.yml`, keep `pytest` as the backend command, add `python manage.py check`, and add `python manage.py spectacular --file /tmp/schema.yml --validate --fail-on-warn` after the schema task lands.

- [ ] **Step 7: Commit**

```bash
git add backend/apps/*/tests backend/pytest.ini .github/workflows/ci.yml
git commit -m "test: restore complete backend suite"
```

### Task 2: Fail-Closed Production Settings and Static Hygiene

**Files:**
- Modify: `backend/core/settings.py`
- Modify: `backend/apps/core/tests/test_runtime_regressions.py`
- Create: `backend/apps/core/tests/test_production_settings.py`
- Create: `backend/.env.example`
- Create: `backend/staticfiles/.gitkeep`
- Modify: `backend/.gitignore`

**Interfaces:**
- Produces: `DJANGO_ENV` with values `development`, `test`, or `production`.
- Produces: startup validation through Django's `ImproperlyConfigured`.
- Consumes: existing `DATABASE_URL`, proxy, CORS, CSRF, and host configuration.

- [ ] **Step 1: Write subprocess tests for profile behavior**

Test settings in fresh Python processes so module caching cannot hide environment behavior:

```python
def run_settings(env: dict[str, str]) -> subprocess.CompletedProcess[str]:
    merged = os.environ.copy()
    merged.update(env)
    return subprocess.run(
        [sys.executable, "-c", "import core.settings"],
        cwd=BACKEND_ROOT,
        env=merged,
        text=True,
        capture_output=True,
        check=False,
    )


def test_production_rejects_missing_secret_key():
    result = run_settings({"DJANGO_ENV": "production", "SECRET_KEY": ""})
    assert result.returncode != 0
    assert "SECRET_KEY" in result.stderr


def test_development_profile_keeps_local_defaults():
    result = run_settings({"DJANGO_ENV": "development"})
    assert result.returncode == 0
```

Verify the production test fails before implementation.

- [ ] **Step 2: Implement explicit environment validation**

In `settings.py`, define:

```python
from django.core.exceptions import ImproperlyConfigured

DJANGO_ENV = config("DJANGO_ENV", default="development").strip().lower()
if DJANGO_ENV not in {"development", "test", "production"}:
    raise ImproperlyConfigured(
        "DJANGO_ENV must be one of: development, test, production"
    )

IS_PRODUCTION = DJANGO_ENV == "production"


def required_setting(name: str) -> str:
    value = config(name, default="").strip()
    if not value:
        raise ImproperlyConfigured(f"{name} is required when DJANGO_ENV=production")
    return value
```

Use `required_setting` for `SECRET_KEY`, `ALLOWED_HOSTS`, and `CORS_ALLOWED_ORIGINS` in production. Reject the Django insecure prefix and secrets shorter than 50 characters. Development/test retain explicit local defaults.

Set production defaults to secure values:

```python
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=IS_PRODUCTION, cast=bool)
SESSION_COOKIE_SECURE = config("SESSION_COOKIE_SECURE", default=IS_PRODUCTION, cast=bool)
CSRF_COOKIE_SECURE = config("CSRF_COOKIE_SECURE", default=IS_PRODUCTION, cast=bool)
SECURE_HSTS_SECONDS = config(
    "SECURE_HSTS_SECONDS", default=31536000 if IS_PRODUCTION else 0, cast=int
)
CORS_ALLOW_ALL_ORIGINS = config(
    "CORS_ALLOW_ALL_ORIGINS", default=not IS_PRODUCTION, cast=bool
)
```

In production, raise `ImproperlyConfigured` if any secure flag is explicitly disabled or if `CORS_ALLOW_ALL_ORIGINS` is true. Keep HSTS subdomains/preload configurable and document that they require ownership of every subdomain.

- [ ] **Step 3: Track an empty static root without tracking generated assets**

Add `backend/staticfiles/.gitkeep` and set `backend/.gitignore` to ignore `staticfiles/*` except `.gitkeep`:

```gitignore
staticfiles/*
!staticfiles/.gitkeep
```

- [ ] **Step 4: Document the environment contract**

Create `backend/.env.example` with non-secret examples for all required variables and production-safe booleans. Do not include a usable production secret.

- [ ] **Step 5: Verify both profiles**

Run:

```bash
cd backend
venv/bin/python -m pytest -q apps/core/tests/test_production_settings.py apps/core/tests/test_runtime_regressions.py
DJANGO_ENV=development venv/bin/python manage.py check
DJANGO_ENV=production \
SECRET_KEY='replace-with-a-random-secret-of-at-least-fifty-characters-12345' \
ALLOWED_HOSTS='example.edu' \
CORS_ALLOWED_ORIGINS='https://app.example.edu' \
CSRF_TRUSTED_ORIGINS='https://app.example.edu' \
CORS_ALLOW_ALL_ORIGINS=false \
SECURE_SSL_REDIRECT=true SESSION_COOKIE_SECURE=true CSRF_COOKIE_SECURE=true \
SECURE_HSTS_SECONDS=31536000 \
venv/bin/python manage.py check --deploy
```

Expected: tests pass, development check passes, and deployment check contains no mandatory security warning.

- [ ] **Step 6: Commit**

```bash
git add backend/core/settings.py backend/apps/core/tests backend/.env.example backend/.gitignore backend/staticfiles/.gitkeep
git commit -m "security: fail closed in production settings"
```

### Task 3: Make the OpenAPI Contract Warning-Free

**Files:**
- Modify: `backend/apps/academics/serializers.py`
- Modify: `backend/apps/accounts/serializers.py`
- Modify: `backend/apps/finance/serializers.py`
- Modify: `backend/apps/scheduling/serializers.py`
- Modify: `backend/apps/students/serializers.py`
- Modify: `backend/apps/teachers/serializers.py`
- Modify: `backend/apps/university/serializers.py`
- Modify: `backend/apps/academics/views.py`
- Modify: `backend/apps/accounts/views.py`
- Modify: `backend/apps/finance/views.py`
- Modify: `backend/apps/university/dashboard.py`
- Modify: `backend/core/settings.py`
- Create: `backend/apps/core/tests/test_schema.py`

**Interfaces:**
- Consumes: security task's finalized `SPECTACULAR_SETTINGS` location.
- Produces: deterministic schema generation with zero drf-spectacular warnings.

- [ ] **Step 1: Add a failing schema regression test**

```python
from io import StringIO

from django.core.management import call_command
from django.test import SimpleTestCase


class OpenApiSchemaTests(SimpleTestCase):
    def test_schema_generates_without_warnings(self):
        stdout = StringIO()
        stderr = StringIO()
        call_command(
            "spectacular",
            file="/tmp/university-openapi-test.yml",
            validate=True,
            fail_on_warn=True,
            stdout=stdout,
            stderr=stderr,
        )
        assert "Warning" not in stderr.getvalue()
        assert "Error" not in stderr.getvalue()
```

Run it and verify it fails on current schema warnings.

- [ ] **Step 2: Type every serializer method field**

Use precise Python return types when drf-spectacular can infer them:

```python
def get_students_count(self, obj: Program) -> int:
    return obj.students.count()

def get_levels_display(self, obj: Program) -> str:
    return ", ".join(level.get_name_display() for level in obj.levels.all())
```

For structured data, annotate explicitly:

```python
from drf_spectacular.utils import extend_schema_field

@extend_schema_field(serializers.ListField(child=serializers.DictField()))
def get_courses(self, obj: ReportCard) -> list[dict[str, object]]:
    ...
```

Apply this to every warning reported by the regression command; do not annotate unrelated validation methods.

- [ ] **Step 3: Annotate APIViews and custom actions**

Use `@extend_schema` with actual serializers, inline serializers, or primitive response schemas. Example:

```python
@extend_schema(
    responses={200: UserSerializer},
    methods=["GET"],
)
class CurrentUserView(APIView):
    ...
```

For path arguments such as `payment_id`, use `OpenApiParameter` with `OpenApiTypes.INT` and `location=OpenApiParameter.PATH`.

Give the two enrollment retrieve routes unique `operation_id` values through action-level `@extend_schema` annotations.

- [ ] **Step 4: Stabilize enum names**

Add `ENUM_NAME_OVERRIDES` entries to `SPECTACULAR_SETTINGS`, mapping distinct model choice classes to descriptive names such as `TuitionPaymentStatus`, `SalaryStatus`, `DebtStatus`, and `PaymentMethod`. Point each override at the actual choices object or import path; do not map semantically different enums to one name.

- [ ] **Step 5: Iterate on the strict schema command**

Run:

```bash
cd backend
venv/bin/python manage.py spectacular --file /tmp/schema.yml --validate --fail-on-warn
venv/bin/python -m pytest -q apps/core/tests/test_schema.py
```

Expected: both commands exit 0 with no schema warning or error.

- [ ] **Step 6: Commit**

```bash
git add backend/apps/*/serializers.py backend/apps/academics/views.py backend/apps/accounts/views.py backend/apps/finance/views.py backend/apps/university/dashboard.py backend/core/settings.py backend/apps/core/tests/test_schema.py
git commit -m "docs: make OpenAPI schema deterministic"
```

### Task 4: Migrate the Frontend from CRA to Vite

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/index.html`
- Create: `frontend/src/vite-env.d.ts`
- Modify: `frontend/tsconfig.json`
- Modify: `frontend/src/index.tsx`
- Modify: `frontend/src/setupTests.ts`
- Modify: `frontend/src/services/api.ts`
- Delete: `frontend/src/react-app-env.d.ts`
- Delete: `frontend/src/reportWebVitals.ts`
- Delete: `frontend/public/index.html`
- Modify: `frontend/Dockerfile`

**Interfaces:**
- Produces commands: `npm run dev`, `npm test -- --run`, `npm run typecheck`, `npm run build`.
- Consumes API settings: `VITE_API_URL` then `VITE_API_BASE_URL`, with `/api/v1` development fallback.
- Produces build output: `frontend/dist`.

- [ ] **Step 1: Record the green CRA baseline**

```bash
cd frontend
CI=true npm test -- --watchAll=false --runInBand
npm run build
```

Expected: 14 suites and 124 tests pass; build exits 0.

- [ ] **Step 2: Replace toolchain dependencies and scripts**

Set scripts to:

```json
{
  "dev": "vite",
  "start": "vite",
  "build": "tsc -b && vite build",
  "typecheck": "tsc -b --pretty false",
  "test": "vitest",
  "test:run": "vitest run"
}
```

Remove `react-scripts`, `@types/jest`, and `web-vitals`. Add these exact development dependency versions: `vite@8.3.4`, `@vitejs/plugin-react@6.1.2`, `vitest@5.0.5`, `jsdom@30.1.3`, `typescript@7.0.2`, and `@types/node@24.19.2`. Upgrade `@testing-library/react` to `16.3.3` and `@testing-library/jest-dom` to `7.0.1`. Keep React at `19.2.4`.

Run `npm install` to update the lockfile.

- [ ] **Step 3: Add Vite and Vitest configuration**

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    css: true,
    clearMocks: true,
  },
});
```

Add `vitest/globals` and `vite/client` to TypeScript types. Configure `tsconfig.node.json` for the Vite config.

- [ ] **Step 4: Move the HTML and application entry**

Create root `frontend/index.html` with `<div id="root"></div>` and `<script type="module" src="/src/index.tsx"></script>`. Preserve language, metadata, icons, manifest, and title from the current public template.

Remove `reportWebVitals` from `src/index.tsx`, delete its module, and replace `react-app-env.d.ts` with `vite-env.d.ts`.

- [ ] **Step 5: Convert environment access and tests**

In `src/services/api.ts`, use:

```typescript
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '/api/v1';
```

Replace Jest-only imports or APIs with Vitest equivalents:

```typescript
import { vi } from 'vitest';
```

Use `vi.mock`, `vi.fn`, `vi.spyOn`, and `vi.clearAllMocks`. Preserve assertions and test semantics; do not delete or skip failing tests.

- [ ] **Step 6: Update container output and ignore rules**

Have `frontend/Dockerfile` copy `/app/dist` into nginx. Replace the `build/` entry in `frontend/.gitignore` with `dist/`, and remove every Docker or deployment reference that treats `frontend/build` as the production artifact.

- [ ] **Step 7: Verify the Vite toolchain**

```bash
cd frontend
npm run test:run
npm run typecheck
npm run build
```

Expected: 124 tests pass, TypeScript exits 0, and `dist/index.html` exists. The output must not emit the stale Browserslist warning.

- [ ] **Step 8: Commit**

```bash
git add frontend
git commit -m "build: migrate frontend from CRA to Vite"
```

### Task 5: Integrate Deployment Documentation and Commands

**Files:**
- Modify: `README.md`
- Modify: `WINDOWS_DEPLOY.md`
- Modify: `setup_win.bat`
- Modify: `run_win.bat`
- Modify: `docker-compose.yml`
- Modify: `.github/workflows/ci.yml`
- Modify: `frontend/.env.example`
- Modify: `frontend/.env.development`
- Modify: `frontend/.env.production`

**Interfaces:**
- Consumes: `DJANGO_ENV`, Vite commands, `VITE_API_URL`, `frontend/dist`.
- Produces: matching local, Windows, Docker, and CI instructions.

- [ ] **Step 1: Update environment and command names**

Replace `REACT_APP_API_URL`/`REACT_APP_API_BASE_URL` with `VITE_API_URL`/`VITE_API_BASE_URL`. Replace CRA startup/test syntax with `npm run dev` and `npm run test:run`. Set local backend commands to `DJANGO_ENV=development`; production examples use `DJANGO_ENV=production` and enumerate required secrets and origins. Upgrade CI and the frontend build container to Node.js 24 so Vite 8 runs on one supported runtime everywhere.

- [ ] **Step 2: Update Docker and Windows paths**

Ensure Docker uses the Vite `dist` output and development Compose still launches the Vite server or the intended nginx image consistently. Ensure `.bat` scripts invoke existing package scripts and set Windows-compatible environment variables.

- [ ] **Step 3: Extend CI gates**

Backend job:

```yaml
- run: python manage.py check
- run: pytest -q
- run: python manage.py spectacular --file /tmp/schema.yml --validate --fail-on-warn
```

Frontend job:

```yaml
- run: npm run test:run
- run: npm run typecheck
- run: npm run build
```

- [ ] **Step 4: Validate configurations**

```bash
docker compose config
cd frontend && npm run test:run && npm run typecheck && npm run build
cd ../backend && venv/bin/python manage.py check && venv/bin/python -m pytest -q
```

Expected: every available command exits 0. If Docker is unavailable, retain the gate as an explicit handoff rather than claiming it passed.

- [ ] **Step 5: Commit**

```bash
git add README.md WINDOWS_DEPLOY.md setup_win.bat run_win.bat docker-compose.yml .github/workflows/ci.yml frontend/.env.example frontend/.env.development frontend/.env.production
git commit -m "docs: align deployment workflows with hardened stack"
```

### Task 6: Reorganize Existing Work into Thematic Commits

**Files:** all remaining tracked and untracked product files present in the approved working tree.

**Interfaces:**
- Produces: a reviewable commit sequence without dropping content.

- [ ] **Step 1: Snapshot and inventory**

Record `git status --short`, `git diff --stat`, `git diff --cached --stat`, and the current commit ID. Use `git diff --no-index /dev/null <untracked-file>` when reviewing new files. Do not use reset, checkout, clean, or restore.

- [ ] **Step 2: Commit disjoint existing change families**

Stage and commit only coherent groups, reviewing `git diff --cached --check` and `git diff --cached --stat` before each commit:

1. Repository hygiene and deployment scaffolding.
2. Backend academic/student domain behavior.
3. Backend finance/audit behavior.
4. Backend operational commands and generated assets required at runtime.
5. Frontend UI foundation/accessibility.
6. Frontend student workflows.
7. Frontend academic/admin/finance/structure workflows, split if the diff remains too large.

Use descriptive conventional commit messages. Never combine a known failing intermediate state with an unrelated domain merely to make it pass.

- [ ] **Step 3: Verify commit contents**

For every new commit, run:

```bash
git show --stat --oneline --decorate HEAD
git show --check HEAD
```

Expected: no whitespace error and only the intended domain files.

### Task 7: Final Verification and Architecture Refresh

**Files:**
- Refresh tracked `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`, and `graphify-out/graph.html` if tracked.

- [ ] **Step 1: Run aggregate backend gates**

```bash
cd backend
venv/bin/python -m pytest -q
venv/bin/python manage.py check
venv/bin/python manage.py makemigrations --check --dry-run
venv/bin/python manage.py spectacular --file /tmp/schema.yml --validate --fail-on-warn
```

- [ ] **Step 2: Run aggregate frontend gates**

```bash
cd frontend
npm run test:run
npm run typecheck
npm run build
```

- [ ] **Step 3: Run production and deployment gates**

Run the documented production-profile `check --deploy`, `docker compose config`, and static validation of the Windows scripts. Capture any unavailable external tool as a visible non-successful handoff.

- [ ] **Step 4: Refresh and validate the knowledge graph**

Run Graphify incremental update, regenerate labels/report/HTML, and verify no dangling endpoints, missing endpoints, collapsed edges, or self-loops.

- [ ] **Step 5: Audit final history and working tree**

```bash
git log --oneline --decorate -20
git status --short --branch
```

Expected: all approved source changes are committed in thematic commits; only documented ignored runtime artifacts may remain.
