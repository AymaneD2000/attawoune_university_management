# University Management System Hardening Design

**Date:** 2026-10-19
**Status:** Approved design

## Objective

Resolve every priority finding from the October 2026 project reanalysis while preserving current product behavior, making production defaults safer, restoring comprehensive test coverage, modernizing the frontend toolchain, and converting the large working tree into reviewable thematic commits.

## Scope

This hardening pass covers seven outcomes:

1. Modernize stale backend tests for the current data model.
2. Make the default backend and CI test commands execute the complete maintained suite.
3. Make production configuration fail closed while retaining an explicit local-development workflow.
4. Remove actionable OpenAPI schema warnings and errors.
5. Eliminate repeated static-file warnings in tests and runtime checks.
6. Replace Create React App with Vite, align TypeScript and test tooling with React 19, and refresh browser compatibility data.
7. Organize all current repository work into coherent, separately verifiable commits.

The pass does not add unrelated product features, push commits, rewrite published history, or change user-visible business rules unless an existing regression test proves the current implementation violates them.

## Delivery Strategy

Use a risk-first incremental sequence. Establish reliable tests before changing runtime configuration or build tooling. Each change family must have its own verification evidence and must be independently reviewable.

The existing working tree will remain in place because it contains the implementation being hardened. Current staged and unstaged changes may be regrouped, but no source change will be discarded. Before each commit, its staged diff will be reviewed and its relevant checks rerun.

## Backend Test Modernization

### Current problem

Legacy academic tests instantiate `Program` with the removed `level` foreign key even though `Program.levels` is now a many-to-many relationship. Several Hypothesis tests also create fixed unique `Level` names across generated examples, producing uniqueness failures unrelated to the behavior under test. The current `pytest.ini` hides these suites by listing only five regression files.

### Design

- Replace obsolete `Program(level=...)` fixtures with creation followed by `program.levels.add(level)`.
- Give generated fixtures unique, deterministic identifiers or use `get_or_create` where identity is not under test.
- Ensure property-based Django tests use the correct transactional test base and do not leak database state between generated examples.
- Treat genuine assertion failures uncovered after fixture repair as implementation defects and fix them test-first.
- Remove the restrictive `testpaths` list so `pytest` discovers all maintained `test_*.py` modules.
- Keep intentionally external/manual scripts outside pytest discovery through naming or explicit markers, not accidental configuration.

### Acceptance

The complete backend test suite passes from the documented command, CI runs that same command, and no test is silently omitted because of a file-level allowlist.

## Production Security and Runtime Configuration

### Current problem

The settings module supplies development-friendly fallback values for security-critical settings. If production environment variables are absent, the application can start with a weak secret, permissive CORS, insecure cookies, disabled HTTPS redirection, and disabled HSTS.

### Design

- Introduce an explicit environment/profile distinction such as `DJANGO_ENV=development|test|production`.
- Permit convenient defaults only in development and test profiles.
- In production, require a strong `SECRET_KEY`, explicit hosts and CORS origins, HTTPS redirect, secure session and CSRF cookies, and a deliberate HSTS value.
- Validate production configuration during startup with actionable errors rather than silently accepting insecure defaults.
- Document every required environment variable in the example environment and deployment guides.
- Keep reverse-proxy HTTPS handling compatible with the current Coolify deployment.
- Create the expected static root or adjust checks so test execution has no missing-directory warning.

### Acceptance

Local development still starts with documented commands. A production-profile check succeeds with valid variables and fails clearly when critical variables are omitted. `manage.py check --deploy` has no unaccepted security warnings.

## OpenAPI Contract

### Current problem

Schema generation reports unresolved serializer method return types, enum naming collisions, a duplicate operation ID, an untyped path parameter, and four API views whose response serializers cannot be inferred.

### Design

- Add Python return annotations or `@extend_schema_field` to serializer method fields.
- Give APIView endpoints explicit request and response schemas through `@extend_schema` or a suitable generic view base.
- Annotate custom path parameters.
- Configure stable enum-name overrides for genuinely distinct choice sets.
- Rename or annotate colliding operations so generated client identifiers are stable.
- Generate and validate the complete schema as a CI gate.

### Acceptance

Schema generation exits successfully with no actionable drf-spectacular warnings or errors, and a regression check protects the contract.

## Frontend Toolchain Modernization

### Current problem

The frontend combines React 19 with Create React App 5, TypeScript 4.9, Jest configuration embedded in CRA, and stale browser compatibility metadata. The application currently builds, but the toolchain boundary is aging and constrains upgrades.

### Design

- Replace `react-scripts` with Vite and the official React plugin.
- Move the HTML entry point to Vite's root convention and use Vite-compatible environment variable access.
- Upgrade TypeScript and React type packages to compatible versions.
- Use Vitest with jsdom and Testing Library, preserving current assertions, setup behavior, accessibility checks, and coverage semantics.
- Update test mocks only where Vite/Vitest module semantics require it.
- Refresh Browserslist/caniuse data or replace CRA-specific browser configuration with Vite's supported target configuration.
- Update Docker, Windows, CI, and README commands.
- Preserve the deployed base path and API URL behavior.

### Acceptance

All existing frontend tests pass under Vitest, TypeScript checks without errors, Vite creates a production bundle, and container/deployment commands reference the new build output correctly.

## Commit Architecture

The final history will use small thematic commits. Exact boundaries may be refined after diff inspection, but the intended sequence is:

1. Design and planning documentation.
2. Deployment and repository hygiene already present in the working tree.
3. Backend academic and student domain changes.
4. Backend finance and audit changes.
5. Backend runtime and operational tooling.
6. Frontend UI foundation and accessibility.
7. Frontend student workflows.
8. Frontend academic, administration, finance, and structure workflows, split further if a staged diff is too large.
9. Backend test modernization and CI discovery.
10. Production security, static files, and deployment validation.
11. OpenAPI contract cleanup.
12. Vite, TypeScript, Vitest, and browser-target modernization.
13. Generated architecture-analysis refresh, only if those artifacts are tracked.

Every commit must be internally coherent and pass the checks relevant to its scope. The final commit sequence must pass the complete backend and frontend verification matrix.

## Verification Matrix

- Full backend pytest discovery.
- Django system check.
- Migration drift check.
- Production-profile deployment check.
- OpenAPI schema generation with warnings treated as failures where supported.
- Frontend unit and accessibility tests.
- TypeScript type check.
- Vite production build.
- Docker configuration validation and image builds when the local environment supports them.
- Windows command/script static validation and command parity review.
- Architecture graph integrity check and refreshed report.
- Final `git status`, staged-diff, and commit-history audit.

## Error Handling and Rollback

Each risk area is isolated in a separate commit so it can be reverted without undoing unrelated domain work. Configuration validation will emit precise missing-variable messages. Toolchain changes will preserve a single documented command for each test, type-check, build, and development-server operation.

If modernizing a stale test reveals a conflict between current product behavior and documented requirements, the failing test and requirement will be reconciled before changing production code. No assertion will be weakened merely to obtain a green suite.

## Non-Goals

- No database-engine migration.
- No visual redesign beyond changes required by the Vite migration.
- No API version change.
- No deployment or push to a remote environment.
- No force-push, history rewrite, or destructive removal of user work.
