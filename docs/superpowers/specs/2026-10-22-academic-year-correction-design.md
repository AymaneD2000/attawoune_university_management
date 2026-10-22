# Academic-Year Correction Design

**Date:** 2026-10-22
**Status:** Approved design

## Goal

Provide administrators and secretaries with a safe bulk workflow for correcting students who were newly created under the wrong academic year. A corrected student must exist in the target year, must no longer exist in the mistaken source year, and must receive a new matricule whose year segment matches the target academic year.

This workflow is a correction, not re-inscription. Re-inscription intentionally preserves historical enrollment data and remains unchanged.

## User workflow

The Students page will expose a **Correct academic year** action when one or more students are selected. The action opens a confirmation dialog containing:

- the selected student count;
- a required source academic year;
- a required target academic year, defaulting to the active year;
- a required corrected enrollment date, defaulting to the current date;
- an explicit warning that matricules and empty source-year financial balances will change.

After confirmation, the dialog displays two result groups:

- transferred students, including their old and new matricules;
- blocked students, including a precise reason for manual review.

The page refreshes student queries after a successful or partially successful batch.

## API and service boundaries

The frontend will call:

```http
POST /api/v1/students/correct-academic-year/
```

with:

```json
{
  "student_ids": [12, 19],
  "source_academic_year": 4,
  "target_academic_year": 5,
  "enrollment_date": "2026-10-22"
}
```

The endpoint is restricted to `ADMIN` and `SECRETARY` users. It delegates domain work to a focused student-year correction service rather than placing transaction logic in the view.

The response reports each student independently:

```json
{
  "transferred": [
    {
      "student": 12,
      "name": "Example Student",
      "old_student_id": "FST2526ME000001",
      "new_student_id": "FST2627ME000001"
    }
  ],
  "blocked": [
    {
      "student": 19,
      "student_id": "FST2526AE000002",
      "reason": "Paiements trouvés pour 2025-2026."
    }
  ]
}
```

Malformed requests, identical source and target years, nonexistent years, invalid dates, and empty selections return a validation error without changing any student.

## Eligibility and safety rules

A student is eligible only when all of the following are true:

- the student has an enrollment in the selected source year;
- the student has no enrollment in the target year;
- the source enrollment is the student's only academic-year enrollment, because this correction is exclusively for newly added students without legitimate history;
- no tuition payment exists for the student in the source year;
- the source-year balance is absent or has `total_paid` equal to zero;
- no debt exists for the student in the source year;
- no exam grade or calculated course grade exists through a source-year semester;
- no attendance exists through a source-year course session;
- no report card exists through a source-year semester;
- no promotion or deliberation exists for the student in the source year.

An ineligible student is left unchanged and returned in the `blocked` list. One blocked student does not prevent eligible students in the same batch from being corrected.

## Atomic correction behavior

Each eligible student is corrected inside an independent database transaction with the relevant student and enrollment rows locked. Within that transaction the service will:

1. Preserve the account, profile, photo, program, level, and contact information.
2. Remove the empty generated balance for the source year, when present.
3. Delete the mistaken source-year enrollment.
4. Create the target-year enrollment using the same program and level with `ENROLLED` and `is_active=true`.
5. Create the target-year financial balance using the configured `ProgramFee` for the target year and level, falling back to the program tuition fee when no exact configuration exists.
6. Set the student profile's enrollment date to the supplied corrected date.
7. Regenerate the matricule using the target academic year's starting year, so 2026–2027 produces the `2627` segment regardless of the correction date.

Matricule generation retains the current faculty, gender, initial, and six-digit sequence format. The service locks matching student rows and chooses the next available sequence. The database unique constraint remains the final collision guard. The response records both old and new matricules.

If any step fails, that student's entire correction rolls back and the student is reported as blocked; other eligible students can still complete.

## Audit behavior

Existing audit signals will capture the student update, source enrollment deletion, target enrollment creation, source balance deletion, and target balance creation. The endpoint response supplies old and new matricules for the operator's immediate confirmation. No account or student profile is deleted.

## Interface behavior

The bulk action reuses the existing student-selection checkboxes and shared dialog, button, feedback, and toast components. The confirmation button remains disabled while the request is running. Destructive consequences are stated explicitly, but the visual treatment identifies this as a correction rather than student deletion.

The action is hidden from users who cannot manage students. Server-side permission checks remain authoritative.

French and Arabic translations will be added for labels, warnings, result summaries, and blocker messages surfaced by the client.

## Testing

Backend tests will cover:

- successful single and multi-student corrections;
- target enrollment and target balance creation;
- source enrollment and empty balance removal;
- `2526` to `2627` matricule regeneration and collision-free sequencing;
- corrected profile enrollment date;
- preservation of profile and account fields;
- permission enforcement;
- request validation;
- blocking for every academic and financial dependency;
- per-student rollback and mixed transferred/blocked results.

Frontend tests will cover:

- action visibility and selected-student count;
- request payload construction;
- confirmation and busy states;
- transferred and blocked result rendering;
- query invalidation after complete and partial success;
- French/Arabic translation-key availability where existing test conventions support it.

The complete backend suite, frontend test suite, TypeScript check, and production build must pass before completion.

## Out of scope

- Moving legitimate historical records between years.
- Automatically moving payments, grades, attendance, debts, report cards, or deliberations.
- Changing the existing re-inscription workflow.
- Deleting student accounts or profiles.
