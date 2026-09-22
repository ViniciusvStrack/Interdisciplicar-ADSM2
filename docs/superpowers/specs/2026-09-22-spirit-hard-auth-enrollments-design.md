# Spirit Hard Authentication and Enrollments Design

## Objective

Transform the current static Jiu Studio demonstration into the Spirit Hard academy system. Students must be able to create accounts, authenticate, enroll in available classes, and see their own persisted activity. Teachers must authenticate with seeded accounts and see only the classes they teach and the students enrolled in those classes.

## Scope

This delivery includes:

- Complete rebranding from Jiu Studio to Spirit Hard.
- Public student registration and secure login for students and seeded teachers.
- MySQL persistence for users, modalities, plans, classes, schedules, enrollments, subscriptions, and payments.
- Seed data based on the supplied Spirit Hard catalog and schedule images.
- A student dashboard backed by API data.
- A teacher dashboard restricted to the authenticated teacher's classes and enrollments.
- Authentication-required enrollment with duplicate and capacity protection.

Password recovery, online payment processing, attendance tracking, public teacher registration, and administrative CRUD screens are outside this delivery.

## Identity and Seed Data

The product name is **Spirit Hard**. The public address is:

> Rua Severino Monteiro de Jesus, 569 — Janga, Paulista–PE, 53437-440

Seeded modalities and pricing:

- Jiu-jítsu adulto, one schedule: R$ 100/month.
- Jiu-jítsu adulto, all schedules: R$ 150/month.
- Jiu-jítsu Kids, Monday/Wednesday/Friday: R$ 90/month.
- Jiu-jítsu Kids, Tuesday/Thursday: R$ 80/month.
- Boxe, Monday/Wednesday/Friday: R$ 80/month.
- Muay Thai, Monday/Wednesday/Friday: R$ 80/month.

Seeded Jiu-jítsu schedules:

- Adult, Monday/Wednesday/Friday: 08:30–10:00, 19:00–20:30, and 20:30–22:00.
- Adult, Tuesday/Thursday: 17:00–18:30.
- Kids, Monday/Wednesday/Friday: 18:00–19:00 (temporarily unavailable) and 19:00–20:00 (ages 10+).
- Kids, Tuesday/Thursday: 16:00–17:00.

Marcinho and Naninha are displayed as Jiu-jítsu instructors but do not receive system accounts. Seeded teacher accounts are:

- A. Ribeiro — Muay Thai.
- Vinícius Dantas — Boxe.
- João Paulo — Boxe noturno.

The application also seeds one clearly labeled demonstration student. Demo credentials are shown on the login screen only in the development/demo configuration. Seed passwords are encoded with BCrypt by application startup code and are never stored as plaintext SQL values.

## Authentication and Authorization

Spring Security provides form-style API authentication backed by server-side HTTP sessions. The browser receives an HTTP-only session cookie. The React application sends authenticated requests with `credentials: "include"`; it does not store passwords, session identifiers, or bearer tokens in local storage.

Public operations:

- View the public catalog, plans, and available schedules.
- Register a new student account.
- Log in.

Authenticated student operations:

- Read the current student's profile.
- Read the current student's subscriptions, payments, and enrollments.
- Create or cancel the current student's enrollment.

Authenticated teacher operations:

- Read the current teacher's profile.
- Read only classes assigned to the current teacher.
- Read only enrollments for those assigned classes.

Users cannot select their role during public registration. Every public registration creates a `STUDENT`. Teacher records are created only by seed/bootstrap code. Backend authorization is authoritative; hiding frontend controls is not considered access control.

## Data Model

### User

`users` stores authentication and shared profile fields:

- `id`
- `name`
- `email` (unique, normalized to lowercase)
- `phone`
- `password_hash`
- `role` (`STUDENT` or `TEACHER`)
- `active`
- `created_at`

### Modality and Plan

`modalities` stores Jiu-jítsu Adulto, Jiu-jítsu Kids, Boxe, and Muay Thai. `plans` stores a modality, name, description, price, duration in months, and active state.

### Class Offering

`class_offerings` represents an enrollable recurring schedule. It stores modality, optional plan, display name, instructor display name, optional teacher user, days of week, start/end time, capacity, minimum age, active state, and an availability note. A class can display Marcinho or Naninha without referencing a teacher account. Teacher visibility requires a `teacher_user_id` assignment.

### Enrollment

`enrollments` links one student user to one class offering. It stores status (`PENDING`, `CONFIRMED`, or `CANCELLED`) and timestamps. A unique constraint on student and class prevents duplicate active records; re-enrollment restores a cancelled enrollment rather than creating duplicates.

### Subscription and Payment

`subscriptions` links a student to a plan with start date, optional end date, and status. `payments` links to a subscription and stores amount, due date, optional payment date, and status. This adapts the supplied `clientes`, `planos`, `assinaturas`, and `pagamentos` schema while integrating authentication and class enrollment.

Foreign keys are represented as JPA relationships where appropriate. API responses use DTOs so password hashes and internal entity graphs are never serialized.

## API Design

Authentication endpoints:

- `POST /api/auth/register` — creates a student and starts an authenticated session.
- `POST /api/auth/login` — authenticates and starts a session.
- `POST /api/auth/logout` — invalidates the session.
- `GET /api/auth/me` — returns the authenticated user's safe profile.

Catalog endpoints:

- `GET /api/catalog/modalities`
- `GET /api/catalog/plans`
- `GET /api/catalog/classes`

Student endpoints:

- `GET /api/student/dashboard`
- `GET /api/student/enrollments`
- `POST /api/student/enrollments` with a class-offering identifier.
- `DELETE /api/student/enrollments/{id}`

Teacher endpoints:

- `GET /api/teacher/dashboard`
- `GET /api/teacher/classes`
- `GET /api/teacher/classes/{id}/enrollments`

All protected endpoints derive the user identity from the Spring Security principal. They never accept a student or teacher identifier as proof of ownership.

## Frontend Structure and Flows

The monolithic `App.tsx` is separated into focused areas:

- API client and typed contracts.
- Authentication context/session restoration.
- Public Spirit Hard landing/catalog page.
- Login and student registration views.
- Student dashboard and enrollment workflow.
- Teacher dashboard and class enrollment lists.
- Shared loading, empty, error, modal, and navigation components.

On initial load, the application calls `/api/auth/me`. A valid session restores the correct dashboard. An unauthenticated visitor remains on the public page. Clicking an enrollment action while logged out opens or redirects to authentication and retains the intended class; after successful authentication, the student can confirm that enrollment.

The student dashboard displays API-backed profile, plan/subscription, payments, available classes, and the student's enrollments. The teacher dashboard displays only assigned classes and enrolled students. Static sample arrays and the “any password works” behavior are removed.

## Validation and Error Handling

- Email is required, syntactically valid, normalized, and unique.
- Password is required with a minimum of eight characters.
- Name and phone are required for student registration.
- Disabled users cannot authenticate.
- Only students can enroll.
- The class must exist, be active, be available, and have remaining capacity.
- Duplicate enrollment returns a conflict response rather than creating a second record.
- Teachers requesting unassigned class data receive a forbidden or not-found response without leaking enrollment data.
- Validation failures return a consistent JSON error body with a human-readable message and optional field errors.
- The frontend maps authentication, conflict, validation, forbidden, and server failures to clear Portuguese messages.

## Database and Environment

The primary runtime database is MySQL 8.4 from the existing Docker Compose configuration. The database name is standardized as `academia`; application credentials continue to come from `DB_URL`, `DB_USER`, and `DB_PASSWORD`. The compose defaults are development-only.

Hibernate schema management is used only for local development and automated tests. A versioned SQL initialization/migration artifact documents the adapted schema and constraints. H2 remains available for isolated automated tests in MySQL compatibility mode.

Seed/bootstrap logic is idempotent: restarting the backend must not create duplicate users, plans, classes, subscriptions, payments, or enrollments.

## Testing Strategy

Backend integration tests cover:

- Student registration, password hashing, duplicate email rejection, and automatic login.
- Valid and invalid login, logout, session restoration, and disabled accounts.
- Student-only enrollment, duplicate prevention, unavailable/full classes, cancellation, and ownership.
- Teacher access to assigned classes and denial of access to other teachers' data.
- Safe response DTOs that never expose password hashes.
- Idempotent seed data.

Frontend tests cover authentication state restoration, guarded enrollment, registration/login errors, student enrollment visibility, and teacher-only enrollment lists. Production build and lint must succeed. An end-to-end smoke verification starts MySQL, backend, and frontend, then registers a new student, enrolls the student, verifies the student's dashboard, and verifies visibility from the assigned teacher account.

## Success Criteria

The feature is complete when:

1. A new visitor can register as a student and log in later with persisted MySQL data.
2. An unauthenticated visitor cannot create an enrollment.
3. A student's enrollment is visible after logout/login and only on that student's dashboard.
4. The assigned teacher sees that student under the correct class, while other teachers cannot.
5. Spirit Hard identity, address, modalities, schedules, instructors, and prices replace the fictional Jiu Studio content.
6. Automated tests, frontend build/lint, backend tests, and the end-to-end smoke flow pass.
