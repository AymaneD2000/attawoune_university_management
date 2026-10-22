# Academic-Year Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a guarded bulk workflow that moves newly created students from a mistaken academic year into the correct year, regenerates their matricules, and leaves no source-year enrollment or generated balance.

**Architecture:** A focused backend service owns eligibility checks and one-transaction-per-student corrections. A serializer-backed DRF action exposes batch results. The Students page reuses its existing selection model and opens a dedicated modal that gathers the two years and corrected date, submits the batch, and renders transferred and blocked students.

**Tech Stack:** Django 5 / Django REST Framework / SQLite or PostgreSQL transactions; React 19 / TypeScript / TanStack Query / Axios / Vitest / Testing Library.

## Global Constraints

- Only `ADMIN` and `SECRETARY` users may execute the correction.
- This workflow is for newly created students with exactly one enrollment; legitimate historical data is never moved.
- Any source-year payment, paid balance, debt, grade, course grade, attendance, report card, or promotion blocks that student.
- Each student is atomic; a blocked or failed student does not roll back other eligible students.
- The target matricule year segment comes from `target_year.start_date`, not from the correction date.
- Preserve the user account, student profile, photo, program, level, and contact data.
- Use test-first development and keep backend and frontend changes in separate thematic commits.

---

### Task 1: Student-year correction domain service

**Files:**
- Create: `backend/apps/students/services/year_correction.py`
- Create: `backend/apps/students/tests/test_year_correction_service.py`
- Modify: `backend/apps/students/models.py`

**Interfaces:**
- Produces: `Student.regenerate_student_id_for_year(academic_year) -> tuple[str, str]`.
- Produces: `correct_student_academic_year(*, student_id, source_year, target_year, enrollment_date) -> CorrectionResult`.
- `CorrectionResult` contains integer `student`, plus `name`, `old_student_id`, and `new_student_id`.
- Raises `CorrectionBlocked(reason: str)` for an ineligible student without changing persisted data.

- [ ] **Step 1: Write failing matricule-regeneration tests**

Add tests that create a student with a `2526` matricule and a target year beginning in 2026, call the wished-for method, and assert that the result contains `2627`, preserves the faculty/gender/initial prefix, allocates a fresh six-digit sequence, and does not collide with an existing `2627` matricule.

```python
def test_regenerate_student_id_uses_target_year_and_next_sequence(self):
    existing = self.make_student(student_id='FST2627MA000004', username='existing')
    old_id = self.student.student_id

    returned_old, returned_new = self.student.regenerate_student_id_for_year(self.target_year)

    self.student.refresh_from_db()
    self.assertEqual(returned_old, old_id)
    self.assertEqual(returned_new, 'FST2627MA000005')
    self.assertEqual(self.student.student_id, returned_new)
    self.assertNotEqual(existing.student_id, returned_new)
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd backend
venv/bin/python -m pytest apps/students/tests/test_year_correction_service.py -q
```

Expected: failure because `Student.regenerate_student_id_for_year` does not exist.

- [ ] **Step 3: Implement target-year matricule generation**

Refactor the current ID components into private model helpers and implement a method that uses `academic_year.start_date.year`, temporarily excludes the current student from the prefix query, updates `student_id`, and returns the old/new pair.

```python
def regenerate_student_id_for_year(self, academic_year):
    old_student_id = self.student_id
    prefix = self._student_id_prefix(academic_year.start_date.year)
    last_student = (
        Student.objects.select_for_update()
        .filter(student_id__startswith=prefix)
        .exclude(pk=self.pk)
        .order_by('-student_id')
        .first()
    )
    next_sequence = self._next_student_id_sequence(last_student)
    self.student_id = f"{prefix}{next_sequence:06d}"
    self.save(update_fields=['student_id', 'updated_at'])
    return old_student_id, self.student_id
```

Keep `generate_student_id()` behavior compatible by calling the same helpers with the enrollment date's year.

- [ ] **Step 4: Run the matricule tests and verify GREEN**

Run the focused test file and expect all current tests to pass.

- [ ] **Step 5: Write failing service tests for a successful correction**

Test a student with one source enrollment and an unpaid generated balance. Assert that the service:

- deletes the source enrollment and balance;
- creates the target enrollment using the same program and level;
- creates the target balance from an exact target-year `ProgramFee`;
- updates `Student.enrollment_date`;
- changes `2526` to `2627` in the matricule;
- preserves user/profile fields.

```python
result = correct_student_academic_year(
    student_id=self.student.pk,
    source_year=self.source_year,
    target_year=self.target_year,
    enrollment_date=date(2026, 10, 22),
)
self.assertFalse(Enrollment.objects.filter(student=self.student, academic_year=self.source_year).exists())
self.assertTrue(Enrollment.objects.filter(student=self.student, academic_year=self.target_year).exists())
self.assertFalse(StudentBalance.objects.filter(student=self.student, academic_year=self.source_year).exists())
self.assertEqual(
    StudentBalance.objects.get(student=self.student, academic_year=self.target_year).total_due,
    Decimal('123456.00'),
)
self.assertIn('2627', result.new_student_id)
```

- [ ] **Step 6: Write parameterized failing blocker tests**

Create one test case per blocker: no source enrollment, target enrollment exists, more than one historical enrollment, tuition payment, paid source balance, debt, exam grade, course grade, attendance, report card, and promotion. After each call assert `CorrectionBlocked` and verify the source enrollment, source balance, student ID, and enrollment date remain unchanged.

- [ ] **Step 7: Implement the correction service minimally**

Create `CorrectionBlocked`, a frozen `CorrectionResult` dataclass, a `_block_reason()` query function, and `correct_student_academic_year()`. Use `transaction.atomic()`, `Student.objects.select_for_update()`, and `Enrollment.objects.select_for_update()`. Delete only an unpaid source balance, delete the source enrollment, call `register_student_in_year()` for the target, update the corrected date, then regenerate the matricule.

Blocker queries must follow the actual relations:

```python
Grade.objects.filter(student=student, exam__semester__academic_year=source_year)
CourseGrade.objects.filter(student=student, semester__academic_year=source_year)
Attendance.objects.filter(
    student=student,
    course_session__schedule__semester__academic_year=source_year,
)
ReportCard.objects.filter(student=student, semester__academic_year=source_year)
StudentPromotion.objects.filter(student=student, academic_year=source_year)
TuitionPayment.objects.filter(student=student, academic_year=source_year)
StudentDebt.objects.filter(student=student, academic_year=source_year)
```

- [ ] **Step 8: Verify the service tests and relevant regressions**

Run:

```bash
cd backend
venv/bin/python -m pytest apps/students/tests/test_year_correction_service.py apps/students/tests/test_reinscription.py apps/academics/tests/test_student_progression_regressions.py -q
```

Expected: all tests pass.

- [ ] **Step 9: Commit the backend domain service**

```bash
git add backend/apps/students/models.py backend/apps/students/services/year_correction.py backend/apps/students/tests/test_year_correction_service.py
git commit -m "feat: add guarded academic year correction service"
```

---

### Task 2: Batch API endpoint and contract

**Files:**
- Modify: `backend/apps/students/serializers.py`
- Modify: `backend/apps/students/views.py`
- Create: `backend/apps/students/tests/test_year_correction_api.py`

**Interfaces:**
- Consumes: `correct_student_academic_year()` and `CorrectionBlocked` from Task 1.
- Produces: `POST /api/v1/students/correct-academic-year/` with the approved request and response shapes.

- [ ] **Step 1: Write failing request-validation tests**

Add API tests for an empty student list, duplicate IDs, missing years, identical years, missing date, invalid date, and nonexistent year IDs. Assert HTTP 400 and field-specific errors. Assert no enrollment, balance, profile date, or matricule changes.

- [ ] **Step 2: Write failing permission and mixed-result tests**

Assert teachers, accountants, deans, and students receive 403. Assert admin and secretary succeed. For a batch containing one eligible student and one student with a payment, assert HTTP 200, one `transferred` item, one `blocked` item, and unchanged data for the blocked student.

- [ ] **Step 3: Run API tests and verify RED**

```bash
cd backend
venv/bin/python -m pytest apps/students/tests/test_year_correction_api.py -q
```

Expected: 404 because the action does not exist.

- [ ] **Step 4: Add the request serializer**

Add a serializer with deduplicated IDs and cross-field year validation:

```python
class AcademicYearCorrectionRequestSerializer(serializers.Serializer):
    student_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
    )
    source_academic_year = serializers.PrimaryKeyRelatedField(
        queryset=AcademicYear.objects.all(),
    )
    target_academic_year = serializers.PrimaryKeyRelatedField(
        queryset=AcademicYear.objects.all(),
    )
    enrollment_date = serializers.DateField()

    def validate_student_ids(self, values):
        return list(dict.fromkeys(values))

    def validate(self, attrs):
        if attrs['source_academic_year'] == attrs['target_academic_year']:
            raise serializers.ValidationError({
                'target_academic_year': "L'année cible doit être différente de l'année source."
            })
        return attrs
```

- [ ] **Step 5: Implement the DRF action**

Add `correct_academic_year` to `StudentViewSet`, explicitly requiring `IsSecretaryOrAdmin`. Validate once, preserve submitted order, report nonexistent students as blocked, and call the domain service once per ID.

```python
@action(detail=False, methods=['post'], url_path='correct-academic-year')
def correct_academic_year(self, request):
    payload = AcademicYearCorrectionRequestSerializer(data=request.data)
    payload.is_valid(raise_exception=True)
    data = payload.validated_data
    transferred, blocked = [], []
    for student_id in data['student_ids']:
        try:
            result = correct_student_academic_year(
                student_id=student_id,
                source_year=data['source_academic_year'],
                target_year=data['target_academic_year'],
                enrollment_date=data['enrollment_date'],
            )
            transferred.append(asdict(result))
        except CorrectionBlocked as exc:
            blocked.append({'student': student_id, 'reason': exc.reason})
        except Exception:
            logger.exception('Academic-year correction failed for student %s', student_id)
            blocked.append({
                'student': student_id,
                'reason': "La correction a échoué; aucune donnée de cet étudiant n'a été modifiée.",
            })
    return Response({'transferred': transferred, 'blocked': blocked})
```

Ensure `get_permissions()` treats the action as a write action, and use schema annotations if strict schema generation cannot infer the request or response.

- [ ] **Step 6: Verify API tests, schema, and complete student tests**

```bash
cd backend
venv/bin/python -m pytest apps/students/tests -q
venv/bin/python manage.py spectacular --file /tmp/academic-year-correction-schema.yml --validate --fail-on-warn
```

Expected: all tests pass and schema validation emits no warnings.

- [ ] **Step 7: Commit the API contract**

```bash
git add backend/apps/students/serializers.py backend/apps/students/views.py backend/apps/students/tests/test_year_correction_api.py
git commit -m "feat: expose bulk academic year correction API"
```

---

### Task 3: Frontend correction modal and bulk action

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/services/studentService.ts`
- Create: `frontend/src/pages/students/AcademicYearCorrectionModal.tsx`
- Create: `frontend/src/pages/students/AcademicYearCorrectionModal.test.tsx`
- Modify: `frontend/src/pages/students/StudentsPage.tsx`
- Modify: `frontend/src/pages/students/StudentsPage.test.tsx`

**Interfaces:**
- Consumes: `universityService.getAcademicYears()` and the endpoint from Task 2.
- Produces: `studentService.correctAcademicYear(request) -> Promise<AcademicYearCorrectionResponse>`.
- Modal props: `open`, `studentIds`, `onClose`, `onCompleted`.

- [ ] **Step 1: Add failing service-contract and modal tests**

Define wished-for types in the test and assert the service posts exactly:

```typescript
{
  student_ids: [12, 19],
  source_academic_year: 4,
  target_academic_year: 5,
  enrollment_date: '2026-10-22',
}
```

Test that the modal loads academic years, defaults the target to `is_current`, prevents equal source/target years, shows the selected count, disables confirmation while pending, and renders both old/new matricules and blocker reasons from a mixed response.

- [ ] **Step 2: Run focused frontend tests and verify RED**

```bash
cd frontend
npm run test:run -- src/pages/students/AcademicYearCorrectionModal.test.tsx src/pages/students/StudentsPage.test.tsx
```

Expected: failure because the modal and service method do not exist.

- [ ] **Step 3: Add shared request/response types and service method**

```typescript
export interface AcademicYearCorrectionRequest {
  student_ids: number[];
  source_academic_year: number;
  target_academic_year: number;
  enrollment_date: string;
}

export interface AcademicYearCorrectionResponse {
  transferred: Array<{
    student: number;
    name: string;
    old_student_id: string;
    new_student_id: string;
  }>;
  blocked: Array<{
    student: number;
    student_id?: string;
    reason: string;
  }>;
}
```

```typescript
correctAcademicYear: async (data: AcademicYearCorrectionRequest) => {
  const response = await api.post<AcademicYearCorrectionResponse>(
    '/students/correct-academic-year/',
    data,
  );
  return response.data;
},
```

- [ ] **Step 4: Implement the modal**

Use `DialogShell`, `Button`, `normalizeApiError`, and a TanStack query for academic years. Store source year, target year, corrected date, busy state, validation feedback, and the returned result. Before submission require both years, require different IDs, and require the date. After submission retain the result in the dialog so the operator can review transferred and blocked students before closing.

- [ ] **Step 5: Wire the bulk action into StudentsPage**

Add a state flag and a secondary button beside bulk card download. Render the modal with `selectedIds`. On completion, clear the selection, refresh list and summary queries, and display a success or informational toast based on whether any students were blocked.

Only show the action when `user.role` is `ADMIN` or `SECRETARY`; retain the existing broader `canManage` behavior for other student-management actions.

- [ ] **Step 6: Verify focused frontend tests and typecheck**

```bash
cd frontend
npm run test:run -- src/pages/students/AcademicYearCorrectionModal.test.tsx src/pages/students/StudentsPage.test.tsx
npm run typecheck
```

Expected: focused tests and TypeScript validation pass.

- [ ] **Step 7: Commit the frontend workflow**

```bash
git add frontend/src/types/index.ts frontend/src/services/studentService.ts frontend/src/pages/students/AcademicYearCorrectionModal.tsx frontend/src/pages/students/AcademicYearCorrectionModal.test.tsx frontend/src/pages/students/StudentsPage.tsx frontend/src/pages/students/StudentsPage.test.tsx
git commit -m "feat: add bulk academic year correction interface"
```

---

### Task 4: Bilingual copy and end-to-end verification

**Files:**
- Modify: `frontend/src/locales/fr/translation.json`
- Modify: `frontend/src/locales/ar/translation.json`
- Modify: `backend/.env.example` only if deployment documentation needs no functional change; otherwise leave it untouched.

**Interfaces:**
- Consumes: translation keys referenced by Task 3.
- Produces: complete French and Arabic correction UI copy.

- [ ] **Step 1: Write a failing translation-key assertion**

Extend the modal test or add a compact locale assertion that checks both locale objects contain every `students.year_correction.*` key used by the component.

- [ ] **Step 2: Run the translation test and verify RED**

Run the focused Vitest file and expect missing-key assertions.

- [ ] **Step 3: Add French and Arabic translations**

Add keys for title, description, source year, target year, corrected date, warning, confirm, busy state, transferred heading, blocked heading, old matricule, new matricule, complete-success summary, partial-success summary, and validation errors. Keep API blocker reasons visible as returned by the server.

- [ ] **Step 4: Run all verification gates**

```bash
cd backend
venv/bin/python -m pytest -q
venv/bin/python manage.py check
venv/bin/python manage.py makemigrations --check --dry-run
venv/bin/python manage.py spectacular --file /tmp/academic-year-correction-final-schema.yml --validate --fail-on-warn

cd ../frontend
npm run test:run
npm run typecheck
npm run build
```

Expected: backend and frontend suites pass, Django reports no issues or migration drift, strict schema validation succeeds, and the Vite production build completes.

- [ ] **Step 5: Perform final data-safety review**

Review the diff and confirm:

- no user or student profile deletion path exists;
- source-year records are deleted only after all blocker checks pass;
- target balance uses target-year fees;
- old/new matricules are returned and displayed;
- every write action is permission-protected;
- mixed batches cannot partially mutate a single student;
- `git diff --check` passes and the worktree contains only intended changes.

- [ ] **Step 6: Commit translations and verification adjustments**

```bash
git add frontend/src/locales/fr/translation.json frontend/src/locales/ar/translation.json
git commit -m "feat: translate academic year correction workflow"
```

If verification required a narrowly scoped correction, include only its directly related file in this final commit and explain it in the commit body.
