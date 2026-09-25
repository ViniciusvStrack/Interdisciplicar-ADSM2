# Spirit Hard Authentication and Enrollments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static Jiu Studio demo with a working Spirit Hard application where students register and enroll using persisted accounts and teachers see only their own classes and enrolled students.

**Architecture:** Spring Boot owns authentication, authorization, business rules, seed data, and MySQL persistence. React restores an HTTP-only session through `/api/auth/me`, consumes typed JSON APIs, and renders separate public, student, and teacher experiences. Backend integration tests use H2 in MySQL compatibility mode while the local runtime uses MySQL 8.4 through Docker Compose.

**Tech Stack:** Java 25, Spring Boot 4, Spring Security, Spring Data JPA, Bean Validation, MySQL 8.4, H2, JUnit/MockMvc, React 19, TypeScript 6, Vite 8, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-22-spirit-hard-auth-enrollments-design.md`

## Global Constraints

- Public registration always creates `STUDENT`; teachers are bootstrap-only accounts.
- Passwords use BCrypt and password hashes never appear in API responses or SQL seed files.
- Authentication uses an HTTP-only server session; the frontend sends `credentials: "include"` and stores no auth token.
- Protected operations derive identity and role from Spring Security, never from client-supplied user IDs.
- Teachers may read only classes assigned to their own user ID and enrollments belonging to those classes.
- Spirit Hard identity, address, modalities, schedules, instructors, and prices must replace all fictional Jiu Studio data.
- H2 is test-only; MySQL 8.4 is the primary local runtime database named `academia`.
- Preserve unrelated user changes already present in the dirty worktree.

## Review Focus

- Concurrent attempts to take the final class vacancy: exactly one enrollment succeeds and capacity is never exceeded; Task 4 adds the integration test.
- Email case/whitespace variants: ` Aluno@Email.com ` and `aluno@email.com` resolve to one normalized account; Task 2 adds the test.
- Session fixation and stale sessions: successful login rotates/uses the framework session and logout makes `/api/auth/me` unauthorized; Task 2 adds the test.
- Cross-teacher object access: a teacher cannot infer another teacher's class enrollment data by guessing an ID; Task 5 adds the test.
- Seed restart safety with partially existing data: bootstrap fills missing records without duplicating existing records; Task 3 adds the test.

---

### Task 1: Domain model, schema, and runtime configuration

**Files:**
- Modify: `backend/pom.xml`
- Modify: `compose.yaml`
- Modify: `backend/src/main/resources/application.properties`
- Modify: `backend/src/test/resources/application.properties`
- Create: `backend/src/main/resources/db/migration/V1__spirit_hard_schema.sql`
- Create: `backend/src/main/java/com/projetointer/backend/user/User.java`
- Create: `backend/src/main/java/com/projetointer/backend/user/UserRole.java`
- Create: `backend/src/main/java/com/projetointer/backend/user/UserRepository.java`
- Create: `backend/src/main/java/com/projetointer/backend/catalog/Modality.java`
- Create: `backend/src/main/java/com/projetointer/backend/catalog/Plan.java`
- Create: `backend/src/main/java/com/projetointer/backend/catalog/ClassOffering.java`
- Create: `backend/src/main/java/com/projetointer/backend/catalog/ModalityRepository.java`
- Create: `backend/src/main/java/com/projetointer/backend/catalog/PlanRepository.java`
- Create: `backend/src/main/java/com/projetointer/backend/catalog/ClassOfferingRepository.java`
- Create: `backend/src/main/java/com/projetointer/backend/enrollment/Enrollment.java`
- Create: `backend/src/main/java/com/projetointer/backend/enrollment/EnrollmentStatus.java`
- Create: `backend/src/main/java/com/projetointer/backend/enrollment/EnrollmentRepository.java`
- Create: `backend/src/main/java/com/projetointer/backend/billing/Subscription.java`
- Create: `backend/src/main/java/com/projetointer/backend/billing/Payment.java`
- Create: `backend/src/main/java/com/projetointer/backend/billing/SubscriptionRepository.java`
- Create: `backend/src/main/java/com/projetointer/backend/billing/PaymentRepository.java`
- Test: `backend/src/test/java/com/projetointer/backend/domain/DomainPersistenceTest.java`

**Interfaces:**
- Consumes: Existing Spring Boot/JPA configuration and the approved schema in the design spec.
- Produces: `UserRepository.findByEmailIgnoreCase(String)`, `ClassOfferingRepository.findAllByActiveTrueOrderByDisplayNameAsc()`, `ClassOfferingRepository.findAllByTeacherIdAndActiveTrue(Long)`, `EnrollmentRepository.findAllByStudentId(Long)`, `EnrollmentRepository.findAllByClassOfferingId(Long)`, and `EnrollmentRepository.findByStudentIdAndClassOfferingId(Long, Long)`.

- [ ] **Step 1: Write the failing persistence test**

Create `DomainPersistenceTest` with `@DataJpaTest` tests that persist a teacher, modality, plan, class offering, student, enrollment, subscription, and payment; assert repository lookups and the unique student/class enrollment constraint. Include assertions that `UserRepository.findByEmailIgnoreCase("TEACHER@SPIRITHARD.COM")` finds a lowercase record.

- [ ] **Step 2: Run the persistence test and verify failure**

Run:

```powershell
cd backend
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
.\mvnw.cmd -Dtest=DomainPersistenceTest test
```

Expected: test compilation fails because the new domain types and repositories do not exist.

- [ ] **Step 3: Add dependencies and database configuration**

Add `spring-boot-starter-security`, `flyway-core`, and `flyway-mysql` to `pom.xml`. Configure runtime defaults for `jdbc:mysql://localhost:3306/academia`, `projeto`, and `projeto123`; configure `ddl-auto=validate`, Flyway enabled, open-in-view disabled, and H2 console disabled. Keep the test profile on H2 with `MODE=MySQL`, `ddl-auto=create-drop`, and Flyway disabled.

Change Compose to `MYSQL_DATABASE: academia` and keep the existing development credentials and health check.

- [ ] **Step 4: Implement the domain and migration**

Implement JPA entities with explicit table/column names matching the migration. Required enums and associations:

```java
public enum UserRole { STUDENT, TEACHER }
public enum EnrollmentStatus { PENDING, CONFIRMED, CANCELLED }

// Enrollment uniqueness
@Table(name = "enrollments", uniqueConstraints =
    @UniqueConstraint(name = "uk_enrollment_student_class", columnNames = {"student_id", "class_offering_id"}))
```

Use `@Version` on `ClassOffering` and a repository method with `@Lock(PESSIMISTIC_WRITE)` named `findByIdForEnrollment(Long id)` to serialize capacity checks. Migration `V1` must create `users`, `modalities`, `plans`, `class_offerings`, `enrollments`, `subscriptions`, and `payments` with foreign keys and unique constraints.

- [ ] **Step 5: Run persistence tests**

Run `./mvnw.cmd -Dtest=DomainPersistenceTest test` with Java 25. Expected: all `DomainPersistenceTest` tests pass.

- [ ] **Step 6: Commit the task**

```powershell
git add backend/pom.xml compose.yaml backend/src/main/resources backend/src/test/resources backend/src/main/java/com/projetointer/backend/user backend/src/main/java/com/projetointer/backend/catalog backend/src/main/java/com/projetointer/backend/enrollment backend/src/main/java/com/projetointer/backend/billing backend/src/test/java/com/projetointer/backend/domain
git commit -m "feat: add Spirit Hard domain model"
```

### Task 2: Session authentication and safe account APIs

**Files:**
- Create: `backend/src/main/java/com/projetointer/backend/config/SecurityConfig.java`
- Modify: `backend/src/main/java/com/projetointer/backend/config/WebConfig.java`
- Create: `backend/src/main/java/com/projetointer/backend/auth/AuthController.java`
- Create: `backend/src/main/java/com/projetointer/backend/auth/AuthService.java`
- Create: `backend/src/main/java/com/projetointer/backend/auth/AuthenticatedUser.java`
- Create: `backend/src/main/java/com/projetointer/backend/auth/AuthDtos.java`
- Create: `backend/src/main/java/com/projetointer/backend/common/ApiError.java`
- Create: `backend/src/main/java/com/projetointer/backend/common/ApiExceptionHandler.java`
- Test: `backend/src/test/java/com/projetointer/backend/auth/AuthIntegrationTest.java`

**Interfaces:**
- Consumes: `User`, `UserRole`, and `UserRepository` from Task 1.
- Produces: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, and `AuthenticatedUser.current()` returning the authenticated `User`.

- [ ] **Step 1: Write failing authentication integration tests**

Use `@SpringBootTest` and `@AutoConfigureMockMvc`. Cover registration auto-login, BCrypt hash storage, normalized email, case/whitespace duplicate rejection, invalid password, disabled account, authenticated `/me`, password omission from JSON, logout invalidation, and unauthorized access after logout. Use `MockHttpSession` to carry the session between requests.

- [ ] **Step 2: Run tests and verify failure**

Run `./mvnw.cmd -Dtest=AuthIntegrationTest test`. Expected: 404 responses or missing auth classes.

- [ ] **Step 3: Implement security configuration**

Define a `SecurityFilterChain` that permits `GET /api/catalog/**` and `/api/auth/register`, `/api/auth/login`; requires authentication elsewhere; uses JSON 401/403 responses; disables CSRF only for this same-site educational JSON API; configures CORS for `http://localhost:5173` with credentials; and sets the session cookie to HTTP-only and same-site lax through properties.

Expose `PasswordEncoder passwordEncoder()` returning `new BCryptPasswordEncoder()` and a `UserDetailsService` backed by normalized email.

- [ ] **Step 4: Implement authentication DTOs and service**

Use these request/response shapes:

```java
public record RegisterRequest(String name, String email, String phone, String password) {}
public record LoginRequest(String email, String password) {}
public record UserResponse(Long id, String name, String email, String phone, UserRole role) {}
```

Normalize email with `email.trim().toLowerCase(Locale.ROOT)`. `register` always sets `STUDENT`; `login` calls `AuthenticationManager`, explicitly saves the `SecurityContext` to the HTTP session, and returns `UserResponse`. Throw structured conflict/validation exceptions handled as `{ "status": 409, "message": "...", "fieldErrors": {} }`.

- [ ] **Step 5: Run authentication tests**

Run `./mvnw.cmd -Dtest=AuthIntegrationTest test`. Expected: all tests pass, including logout making `/api/auth/me` return 401.

- [ ] **Step 6: Commit the task**

```powershell
git add backend/src/main/java/com/projetointer/backend/config backend/src/main/java/com/projetointer/backend/auth backend/src/main/java/com/projetointer/backend/common backend/src/test/java/com/projetointer/backend/auth backend/src/main/resources/application.properties
git commit -m "feat: add secure session authentication"
```

### Task 3: Spirit Hard catalog and idempotent seed data

**Files:**
- Create: `backend/src/main/java/com/projetointer/backend/bootstrap/SpiritHardDataInitializer.java`
- Create: `backend/src/main/java/com/projetointer/backend/catalog/CatalogController.java`
- Create: `backend/src/main/java/com/projetointer/backend/catalog/CatalogDtos.java`
- Test: `backend/src/test/java/com/projetointer/backend/bootstrap/SpiritHardDataInitializerTest.java`
- Test: `backend/src/test/java/com/projetointer/backend/catalog/CatalogIntegrationTest.java`

**Interfaces:**
- Consumes: repositories and BCrypt encoder from Tasks 1–2.
- Produces: the seeded teacher/demo accounts plus `GET /api/catalog/modalities`, `GET /api/catalog/plans`, and `GET /api/catalog/classes` returning safe catalog DTOs.

- [ ] **Step 1: Write failing seed and catalog tests**

Assert exact seed counts and values for four modalities, six plans, all listed Jiu-jítsu schedules, unavailable Kids 18:00 class, and classes for Boxe/Muay Thai. Assert the teacher mappings A. Ribeiro→Muay Thai, Vinícius Dantas→Boxe, João Paulo→Boxe noturno; Marcinho/Naninha have display names but no user ID. Run the initializer twice and assert counts are unchanged. Add a partial-data test that inserts one modality first and verifies the initializer fills the rest without duplication. Assert public catalog endpoints return 200 without a session.

- [ ] **Step 2: Run tests and verify failure**

Run `./mvnw.cmd -Dtest=SpiritHardDataInitializerTest,CatalogIntegrationTest test`. Expected: initializer/controller classes are missing.

- [ ] **Step 3: Implement idempotent bootstrap data**

Use stable unique keys (normalized email for users, slug for modality/plan/class) and `findBy...().orElseGet(...)` for every seed record. Seed development accounts with values controlled by environment properties:

```properties
app.demo.student-email=aluno@spirithard.com
app.demo.student-password=Aluno@123
app.demo.teacher-password=Professor@123
```

Teacher emails are `aribeiro@spirithard.com`, `vinicius.dantas@spirithard.com`, and `joao.paulo@spirithard.com`. Store only BCrypt hashes.

- [ ] **Step 4: Implement public catalog DTOs and controller**

Return modality/plan/class records with IDs, names, prices, days, times, capacity, current enrollment count, availability, instructor display name, and optional availability note. Never return teacher user IDs or entity objects.

- [ ] **Step 5: Run seed and catalog tests**

Run `./mvnw.cmd -Dtest=SpiritHardDataInitializerTest,CatalogIntegrationTest test`. Expected: all tests pass.

- [ ] **Step 6: Commit the task**

```powershell
git add backend/src/main/java/com/projetointer/backend/bootstrap backend/src/main/java/com/projetointer/backend/catalog backend/src/test/java/com/projetointer/backend/bootstrap backend/src/test/java/com/projetointer/backend/catalog backend/src/main/resources/application.properties
git commit -m "feat: seed Spirit Hard catalog"
```

### Task 4: Student dashboard and enrollment rules

**Files:**
- Create: `backend/src/main/java/com/projetointer/backend/student/StudentController.java`
- Create: `backend/src/main/java/com/projetointer/backend/student/StudentService.java`
- Create: `backend/src/main/java/com/projetointer/backend/student/StudentDtos.java`
- Test: `backend/src/test/java/com/projetointer/backend/student/StudentEnrollmentIntegrationTest.java`

**Interfaces:**
- Consumes: `AuthenticatedUser.current()`, catalog, enrollment, subscription, and payment repositories.
- Produces: `GET /api/student/dashboard`, `GET /api/student/enrollments`, `POST /api/student/enrollments` accepting `EnrollRequest(Long classOfferingId)`, and `DELETE /api/student/enrollments/{id}`.

- [ ] **Step 1: Write failing student enrollment tests**

Cover unauthenticated rejection, teacher rejection, successful student enrollment, ownership derived from session, duplicate conflict, cancelled enrollment restoration, unavailable class rejection, full capacity rejection, another student's cancellation rejection, and the final-vacancy concurrency case using two transactions/threads and asserting only one active enrollment is added.

- [ ] **Step 2: Run tests and verify failure**

Run `./mvnw.cmd -Dtest=StudentEnrollmentIntegrationTest test`. Expected: student endpoints are missing.

- [ ] **Step 3: Implement transactional enrollment service**

Use `@Transactional` and `ClassOfferingRepository.findByIdForEnrollment(id)`. Count non-cancelled enrollments under the lock; reject when count reaches capacity. Restore a cancelled record by setting status to `PENDING`; reject an existing active record with HTTP 409. Cancellation must query by enrollment ID and current student ID.

- [ ] **Step 4: Implement dashboard DTOs and controller**

Return one composite `StudentDashboardResponse` containing the safe profile, subscription/plan if present, payments, current enrollments with class details, and available classes. Apply `@PreAuthorize("hasRole('STUDENT')")` to student APIs.

- [ ] **Step 5: Run student tests**

Run `./mvnw.cmd -Dtest=StudentEnrollmentIntegrationTest test`. Expected: all tests pass, including exactly one winner for the final vacancy.

- [ ] **Step 6: Commit the task**

```powershell
git add backend/src/main/java/com/projetointer/backend/student backend/src/main/java/com/projetointer/backend/enrollment backend/src/main/java/com/projetointer/backend/catalog backend/src/test/java/com/projetointer/backend/student
git commit -m "feat: add student enrollment workflow"
```

### Task 5: Teacher-scoped dashboard

**Files:**
- Create: `backend/src/main/java/com/projetointer/backend/teacher/TeacherController.java`
- Create: `backend/src/main/java/com/projetointer/backend/teacher/TeacherService.java`
- Create: `backend/src/main/java/com/projetointer/backend/teacher/TeacherDtos.java`
- Test: `backend/src/test/java/com/projetointer/backend/teacher/TeacherAccessIntegrationTest.java`

**Interfaces:**
- Consumes: `AuthenticatedUser.current()`, `ClassOfferingRepository.findAllByTeacherIdAndActiveTrue(Long)`, and enrollment data from prior tasks.
- Produces: `GET /api/teacher/dashboard`, `GET /api/teacher/classes`, and `GET /api/teacher/classes/{id}/enrollments`.

- [ ] **Step 1: Write failing teacher authorization tests**

Create two teachers, separate classes, and enrolled students. Assert each teacher sees only assigned classes and students. Assert a student receives 403, an unauthenticated request receives 401, and a teacher guessing another teacher's class ID receives 404 without student data in the body.

- [ ] **Step 2: Run tests and verify failure**

Run `./mvnw.cmd -Dtest=TeacherAccessIntegrationTest test`. Expected: teacher endpoints are missing.

- [ ] **Step 3: Implement teacher queries and DTOs**

Query class ownership with both class ID and current teacher ID. Return `TeacherDashboardResponse` containing safe teacher profile, assigned class summaries, active enrollment counts, and per-class student rows with name, email, phone, enrollment status, and registration timestamp.

- [ ] **Step 4: Secure teacher endpoints**

Apply `@PreAuthorize("hasRole('TEACHER')")`. Map an unowned class to the same 404 response as a nonexistent class to avoid disclosing class ownership.

- [ ] **Step 5: Run teacher tests and full backend suite**

Run:

```powershell
.\mvnw.cmd test
```

Expected: all backend tests pass with zero failures and zero errors.

- [ ] **Step 6: Commit the task**

```powershell
git add backend/src/main/java/com/projetointer/backend/teacher backend/src/test/java/com/projetointer/backend/teacher
git commit -m "feat: add teacher scoped dashboard"
```

### Task 6: Typed frontend API and authentication shell

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Create: `frontend/src/api/types.ts`
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/auth/AuthContext.tsx`
- Create: `frontend/src/auth/LoginPage.tsx`
- Create: `frontend/src/auth/RegisterPage.tsx`
- Create: `frontend/src/auth/AuthContext.test.tsx`
- Create: `frontend/src/auth/AuthPages.test.tsx`
- Modify: `frontend/src/main.tsx`

**Interfaces:**
- Consumes: Task 2 authentication endpoints and their DTO shapes.
- Produces: `apiRequest<T>(path, options)`, `AuthProvider`, and `useAuth()` returning `{ user, loading, login, register, logout, refresh }`.

- [ ] **Step 1: Add frontend test dependencies**

Add Vitest, jsdom, `@testing-library/react`, `@testing-library/user-event`, and `@testing-library/jest-dom`. Add scripts `test: "vitest run"` and `test:watch: "vitest"`, plus Vite test configuration using jsdom.

- [ ] **Step 2: Write failing auth frontend tests**

Mock `fetch` and assert initial `/api/auth/me` restoration, 401 becoming anonymous without an error page, login request with credentials included, registration field errors, role-based user state, and logout clearing the user. Assert no auth data is written to `localStorage`.

- [ ] **Step 3: Run tests and verify failure**

Run `npm test -- --runInBand`. Expected: missing API/auth modules.

- [ ] **Step 4: Implement API client and authentication context**

`apiRequest<T>` uses `${import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'}${path}`, JSON headers, and `credentials: 'include'`. It parses the structured `ApiError` and throws a typed `ApiClientError` with status/message/field errors.

Implement login/register views with Portuguese labels, clear error states, seeded demo credentials, and no role selector. Redirect/render dashboards by `user.role` after authentication.

- [ ] **Step 5: Run auth tests, typecheck, and lint**

Run `npm test`, `npm run build`, and `npm run lint`. Expected: all commands exit 0.

- [ ] **Step 6: Commit the task**

```powershell
git add frontend/package.json frontend/package-lock.json frontend/src/api frontend/src/auth frontend/src/main.tsx frontend/vite.config.ts
git commit -m "feat: add frontend session authentication"
```

### Task 7: Spirit Hard public site and guarded enrollment UI

**Files:**
- Create: `frontend/src/catalog/CatalogPage.tsx`
- Create: `frontend/src/catalog/ClassCard.tsx`
- Create: `frontend/src/catalog/CatalogPage.test.tsx`
- Create: `frontend/src/shared/Brand.tsx`
- Create: `frontend/src/shared/Feedback.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/App.css`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: catalog API from Task 3 and auth state from Task 6.
- Produces: the Spirit Hard public experience and `pendingClassId` flow that routes anonymous enrollment attempts through login.

- [ ] **Step 1: Write failing public catalog tests**

Assert Spirit Hard name/address, API-backed modalities/prices/schedules, full/unavailable label, login guard for anonymous enrollment, retained class intent after login, and no remaining `Jiu Studio`, Rafael Lima, Marcos Silva, or static member-array text.

- [ ] **Step 2: Run tests and verify failure**

Run `npm test -- CatalogPage.test.tsx`. Expected: missing catalog components or old identity assertions fail.

- [ ] **Step 3: Implement Spirit Hard catalog and branding**

Replace fictional content with the approved Spirit Hard identity. Fetch catalog data rather than defining `classes`, `events`, or `members` constants. Show the supplied address and class schedules/prices, but do not reuse WhatsApp UI chrome or claim unsupported contact details.

- [ ] **Step 4: Implement guarded enrollment navigation**

When anonymous, store the intended class ID only in React state, show login/registration, then offer confirmation after authentication. When authenticated as teacher, do not show student enrollment actions.

- [ ] **Step 5: Run catalog tests and frontend checks**

Run `npm test`, `npm run build`, and `npm run lint`. Expected: all commands exit 0.

- [ ] **Step 6: Commit the task**

```powershell
git add frontend/src/catalog frontend/src/shared frontend/src/App.tsx frontend/src/App.css frontend/src/index.css
git commit -m "feat: rebrand public site as Spirit Hard"
```

### Task 8: Student and teacher dashboards

**Files:**
- Create: `frontend/src/student/StudentDashboard.tsx`
- Create: `frontend/src/student/StudentDashboard.test.tsx`
- Create: `frontend/src/teacher/TeacherDashboard.tsx`
- Create: `frontend/src/teacher/TeacherDashboard.test.tsx`
- Create: `frontend/src/shared/DashboardShell.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/App.css`

**Interfaces:**
- Consumes: Task 4 student APIs, Task 5 teacher APIs, and Task 6 auth state.
- Produces: API-backed role dashboards with enrollment creation/cancellation and teacher-scoped student lists.

- [ ] **Step 1: Write failing dashboard tests**

Student tests assert profile name, plan/payment states, empty state, successful enrollment refresh, duplicate/full error messages, cancellation, and persistence represented by a refetched API response. Teacher tests assert assigned classes only, enrolled student rows, empty class state, and no student enrollment controls.

- [ ] **Step 2: Run dashboard tests and verify failure**

Run `npm test -- StudentDashboard.test.tsx TeacherDashboard.test.tsx`. Expected: dashboard modules are missing.

- [ ] **Step 3: Implement student dashboard**

Fetch `/student/dashboard`, render real profile/subscription/payment/enrollment data, post `{ classOfferingId }`, delete owned enrollment, refresh after mutations, and show loading/empty/error states in Portuguese.

- [ ] **Step 4: Implement teacher dashboard**

Fetch `/teacher/dashboard`; render only returned assigned classes. Load `/teacher/classes/{id}/enrollments` when a class is selected and render student name, email, phone, status, and registration date.

- [ ] **Step 5: Run frontend suite and build**

Run `npm test`, `npm run build`, and `npm run lint`. Expected: all commands exit 0.

- [ ] **Step 6: Commit the task**

```powershell
git add frontend/src/student frontend/src/teacher frontend/src/shared/DashboardShell.tsx frontend/src/App.tsx frontend/src/App.css
git commit -m "feat: add role based Spirit Hard dashboards"
```

### Task 9: Documentation and full-stack verification

**Files:**
- Modify: `README.md`
- Modify: `frontend/.env.example`
- Create: `backend/src/test/java/com/projetointer/backend/SpiritHardJourneyIntegrationTest.java`

**Interfaces:**
- Consumes: all APIs and frontend flows from Tasks 1–8.
- Produces: reproducible startup instructions, demo credentials, environment documentation, and final verification evidence.

- [ ] **Step 1: Write the failing backend journey test**

Create one integration test that registers a fresh student, reads the session, enrolls in a teacher-assigned class, logs out, logs back in, verifies the student dashboard enrollment, logs in as the assigned teacher, and verifies the student appears in that teacher's class list but not in another teacher's results.

- [ ] **Step 2: Run the journey test**

Run `./mvnw.cmd -Dtest=SpiritHardJourneyIntegrationTest test`. Expected before final fixes: any contract mismatches fail explicitly; after correction the test passes.

- [ ] **Step 3: Update documentation**

Document Java 25, Node 20+, Docker, `docker compose up -d`, MySQL database `academia`, backend/frontend startup, `VITE_API_URL`, demo emails/passwords, and the fact that demo credentials are development-only.

- [ ] **Step 4: Run complete verification**

Run:

```powershell
cd backend
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
.\mvnw.cmd clean test

cd ..\frontend
npm test
npm run lint
npm run build
```

Expected: Maven reports zero failures/errors; Vitest reports all tests passing; lint exits 0; Vite production build exits 0.

- [ ] **Step 5: Verify MySQL runtime and HTTP smoke flow**

Start MySQL, backend, and frontend. Verify `GET /api/catalog/classes` and the frontend return 200. Register a unique student, enroll through the API/UI, log out/in, and verify the assigned teacher sees the student. Record commands and status codes in the final handoff.

- [ ] **Step 6: Commit documentation and journey test**

```powershell
git add README.md frontend/.env.example backend/src/test/java/com/projetointer/backend/SpiritHardJourneyIntegrationTest.java
git commit -m "docs: add Spirit Hard setup and journey verification"
```
