# ThreeDungeons - Residency RPG Telemetry & Authentication System

## Overview

This document outlines the implementation plan for integrating authentication and progress-tracking into the RPG Maker MV educational game "The Resuscitation Accord: Rise of the Syndicate." The system serves medical residency programs, gamifying the curriculum while giving Program Leaders secure, actionable data on learner performance and clinical decision-making.

**Architecture:** Game (RPG Maker MV + custom plugin) → BaaS (Supabase) → Leader Dashboard (React, separate repo).

### Status Legend

- ⬜ Pending
- 🟡 In Progress
- 🔵 Testing / Review
- 🟢 Completed

### Definition of Done

- All sections marked 🟢
- End-to-end flow verified: resident logs in → plays → telemetry appears in dashboard
- Leader can create program, invite leaders, bulk-add residents, view cohort analytics
- Multi-program data isolation verified (Program A cannot see Program B)
- Game and dashboard deployed to GitHub Pages
- No regressions in existing gameplay

### Related Code Locations

| Pattern/Feature | Location | Notes |
|-----------------|----------|-------|
| RPG Maker title flow | `js/rpg_scenes.js` | Scene_Title, commandNewGame, commandContinue |
| Plugin command chain | `js/rpg_objects.js` | Game_Interpreter.prototype.pluginCommand |
| Common events | `data/CommonEvents.json` | Clinical decision events |
| Supabase migrations | `supabase/migrations/` | Schema, RLS, auth trigger |
| Design guidelines | `Admin/design-guidelines.md` | Flowbite/Tailwind for dashboard |

### Background Documents

| Document | Purpose |
|----------|---------|
| `Admin/proposal.md` | Original conceptual proposal |
| `Admin/design-guidelines.md` | Dashboard visual language (Flowbite, Tailwind) |

### Scope & Context

**In Scope:**

- BaaS (Supabase): schema, auth, RLS, multi-program isolation
- Auth plugin: login overlay for New Game and Continue, session until tab close
- Telemetry plugin: ReportData command, offline queue + retry
- Curriculum mapping: existing content (Flash Pulm Edema, Sentinel/Arbiter/Paragon, traps) + pattern for future content
- Leader Dashboard: React + Tailwind + Flowbite, separate repo
- Super-admin: create Programs, generate single-use Leader invite codes
- Resident management: CSV bulk upload, manual password distribution, Leader reset, deactivate
- Cohorts: Leaders define tags, assign residents to multiple cohorts
- Hosting: GitHub Pages for game and dashboard

**Out of Scope:**

- Email-based flows (password reset, invites, notifications)
- Anonymization (codename/ID mapping) — designed for, implementation deferred
- Content beyond current game demo

**Key Constraints:**

- Low budget: BaaS free tier, free hosting
- Simple UX/UI, low-code friendly
- Contractor-ready: plan must be explicit and followable

### For the Implementer

**Implementation order:** Follow this sequence (not the document order). Section 6 provides the auth and telemetry endpoints that Sections 2 and 3 need.

1. Section 1 (BaaS Infrastructure) — done
2. Section 6 (Resident Auth & API) — Edge Functions for login and telemetry insert
3. Section 2 (Auth Plugin)
4. Section 3 (Telemetry Plugin)
5. Section 4 (Curriculum Mapping)
6. Section 5 (Leader Dashboard) — can run in parallel with 2–4 after owner tasks
7. Section 7 (Deployment)

**Before starting each section, check if the owner must complete setup tasks.** The "Owner Setup Tasks" section below lists everything the project owner (non-technical) must do outside the codebase. Direct the owner to those instructions and confirm they are done before you depend on them. Do not assume the owner has completed a task—verify or walk them through it.

---

## Owner Setup Tasks (Non-Technical)

These are tasks **you** (the project owner) must do yourself. They happen outside the code. Follow the steps in order. When a step says "give this to your developer," copy the values and share them securely (e.g., in a password manager or private message).

**Note:** Website layouts change over time. If a button or menu mentioned here is in a different place, ask your developer for updated instructions.

---

### Task 1: Create a Supabase Account and Project

**What this is:** Supabase is the cloud service that stores resident data, leader accounts, and game telemetry. It has a free tier.

**When to do this:** Before Section 1 (BaaS Infrastructure) starts.

**Steps:**

1. Go to [supabase.com](https://supabase.com) and click "Start your project."
2. Sign up with GitHub or email. (GitHub is easier if you already use it.)
3. After signing in, click "New Project."
4. Choose your organization (or create one if prompted).
5. Fill in:
   - **Name:** Something like "Residency Game" or "ThreeDungeons."
   - **Database Password:** Create a strong password and **save it somewhere safe.** You will need it if you ever reset the database.
   - **Region:** Pick the one closest to your users (e.g., US East if most are in the US).
6. Click "Create new project." Wait a few minutes for it to finish.
7. When it's ready, go to **Project Settings** (gear icon in the left sidebar) → **API**.
8. You will see:
   - **Project URL** — a long web address like `https://xxxxx.supabase.co`
   - **anon public** key — a long string of letters and numbers
9. **Give both of these to your developer.** They need them to connect the game and dashboard to your data.

---

### Task 2: Add Your Email as Super-Admin

**What this is:** The super-admin is the person who can create programs and invite leaders. That should be you.

**When to do this:** Before Section 5 (Leader Dashboard) is finished. The developer will tell you where to put this.

**Steps:**

1. Decide which email address you will use as super-admin (e.g., your work email).
2. **Give this email to your developer.** They will add it to the dashboard configuration so that when you log in with that email, you see the admin options (create programs, generate invite codes).

---

### Task 3: Allow the Game and Dashboard to Talk to Supabase (CORS)

**What this is:** For security, Supabase may need to know which websites are allowed to send data to it. You add the web addresses where your game and dashboard will live.

**When to do this:** Before Section 7 (Deployment). Do this once you know where the game and dashboard will be hosted.

**Steps:**

1. In Supabase, go to **Project Settings** (gear icon in the left sidebar) → **API**.
2. Look for **CORS**, **Allowed Origins**, or **Redirect URLs**. (The exact label depends on the current Supabase layout.)
3. If you find a field for allowed websites, add your URLs (replace with your actual URLs once you know them):
   - Your game URL, e.g. `https://yourusername.github.io` or `https://yourusername.github.io/ThreeDungeons`
   - Your dashboard URL, e.g. `https://yourusername.github.io/residency-dashboard` or whatever the dashboard repo is named
4. If you use a custom domain later, add that too.
5. Save. **Tell your developer when this is done.**
6. **If you cannot find any CORS or Allowed Origins setting:** Tell your developer. Supabase sometimes changes where this lives, or your setup may not need it—they can confirm.

---

### Task 4: Create a GitHub Repository for the Dashboard

**What this is:** The Leader Dashboard is a separate website from the game. It needs its own place in GitHub.

**When to do this:** Before Section 5 (Leader Dashboard) starts, or when the developer asks for it.

**Steps:**

1. Log into [github.com](https://github.com).
2. Click the **+** in the top right → **New repository**.
3. Name it something like `residency-leader-dashboard` or `ThreeDungeons-Admin`.
4. Choose **Public**.
5. Do **not** add a README, .gitignore, or license (the developer will add those).
6. Click **Create repository**.
7. **Give your developer access** to this repo (they may need to be added as a collaborator, or you can give them your GitHub login if you prefer—though collaborator access is safer).

---

### Task 5: Turn On GitHub Pages for the Game and Dashboard

**What this is:** GitHub Pages lets you host websites for free. You need it for both the game and the dashboard.

**When to do this:** Before Section 7 (Deployment).

**Steps for the game:**

1. Go to your game's repository on GitHub (e.g., `ThreeDungeons`).
2. Click **Settings** → **Pages** (in the left sidebar).
3. Under "Source," choose **Deploy from a branch**.
4. Select the branch (usually `main` or `gh-pages`) and folder (often `/` or `/(root)`).
5. Click **Save**. The game will be at `https://yourusername.github.io/ThreeDungeons` (or similar).

**Steps for the dashboard:**

1. Go to the dashboard repository you created in Task 4.
2. Click **Settings** → **Pages**.
3. Same as above: **Deploy from a branch**, choose branch and folder.
4. Click **Save**.

**Give both URLs to your developer** so they can configure the game, dashboard, and CORS correctly.

---

### Task 6: Create Your First Program and Invite Code (After Dashboard Is Live)

**What this is:** Once the dashboard is built, you will use it to create your first program and invite your first leader.

**When to do this:** After Section 5 and 7 are done. The developer will walk you through the first login.

**Steps:**

1. Log into the dashboard with your super-admin email.
2. Go to the admin area (e.g., "Programs" or "Admin").
3. Create a program (e.g., "General Surgery Residency").
4. Generate an invite code for a leader.
5. Share that code with the person who will be the first Program Leader. They will use it to sign up.

---

### Quick Reference: What You Need to Give Your Developer

| Item | Where to Find It | When |
|------|-----------------|------|
| Supabase Project URL | Supabase → Project Settings → API | Before Section 1 |
| Supabase anon key | Supabase → Project Settings → API | Before Section 1 |
| Your super-admin email | Your choice | Before Section 5 |
| Game GitHub Pages URL | GitHub repo → Settings → Pages | Before Section 7 |
| Dashboard GitHub Pages URL | GitHub repo → Settings → Pages | Before Section 7 |
| Dashboard repo access | GitHub collaborator or repo link | Before Section 5 |

---

## Context

### Why Supabase

The proposal considered Supabase and Firebase. Supabase is recommended because: (1) relational schema fits Program → Leaders → Learners → Attempts; (2) Row Level Security (RLS) enforces multi-program isolation; (3) built-in Auth for email/password; (4) free tier sufficient for residency program scale.

### Why Auth on Both New Game and Continue

All play must be tied to a resident for telemetry to be meaningful. If Continue worked without login, anonymous saves would bypass tracking. Requiring login for both ensures every play session is attributed.

### Why Session Until Tab Close

Minimal implementation: use `sessionStorage` for the token. No expiry logic, refresh tokens, or inactivity timers. Closing the tab ends the session; reopening requires login.

### Why Offline Telemetry Queue

Residents may play in low-connectivity settings (hospital Wi-Fi). Queue failed telemetry in localStorage and retry when back online. Prevents data loss without requiring a service worker.

### Game Content State

The game is a demo/phase 1. Only part of the content exists. Curriculum mapping covers existing content and defines the pattern for future content. Map files (`Map001.json`–`Map006.json`) are not in the repo; mapping is based on common events and the established pattern.

---

## Implementation Sections

### 1. BaaS Infrastructure (Supabase) - 🟢 Completed

#### Overview

Provision Supabase project, define schema, configure Auth, and set up Row Level Security for multi-program data isolation.

#### Owner Prerequisites

**Before you start:** Owner must complete **Owner Setup Task 1** (Create Supabase account and project). Confirm the owner has the Project URL and anon key before proceeding.

#### Dependencies

- None (first section)

#### Acceptance Criteria

- [x] Supabase project created, URL and anon key available
- [x] Schema created: programs, profiles, invite_codes, residents, cohorts, resident_cohorts, attempts (auth.users is Supabase-managed)
- [x] RLS policies enforce: Program A cannot see Program B data
- [x] Auth configured for email/password
- [x] Super-admin email configurable (env or config table)
- [x] CORS allows game origin (e.g. `*.github.io`) and dashboard origin

#### Technical Specification

| Aspect | Details |
|--------|---------|
| **Service** | Supabase (Postgres + Auth) |
| **Schema** | See Schema section below |
| **RLS** | All tables scoped by program_id where applicable |

#### Schema

```sql
-- Programs (created by super-admin)
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Supabase Auth users; profiles extend with role + program
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'leader', 'resident')),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(email)
);

-- Single-use invite codes for Leaders (created by super-admin)
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Residents (Learners) - created by Leaders via CSV bulk upload
CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, email)
);

-- Cohort tags (defined by Leaders)
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, name)
);

-- Resident ↔ Cohort (many-to-many)
CREATE TABLE resident_cohorts (
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  PRIMARY KEY (resident_id, cohort_id)
);

-- Telemetry (Attempts)
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  action TEXT NOT NULL,
  outcome TEXT NOT NULL,
  score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attempts_resident ON attempts(resident_id);
CREATE INDEX idx_attempts_program ON attempts(program_id);
CREATE INDEX idx_attempts_created ON attempts(created_at);
```

#### RLS Policies (Summary)

- `programs`: super_admin can CRUD; leaders can read their program
- `profiles`: users can read own; super_admin can read all
- `invite_codes`: super_admin can CRUD; leaders cannot access
- `residents`: leaders can CRUD for their program_id only
- `cohorts`: leaders can CRUD for their program_id only
- `resident_cohorts`: leaders can CRUD for residents/cohorts in their program
- `attempts`: residents can INSERT (via service role or dedicated API); leaders can SELECT for their program only

#### Implementation Notes

- Residents authenticate via custom logic (Supabase Auth or custom table). If using Supabase Auth for residents, create users on CSV upload and store program_id in profiles.
- Super-admin: store email in `SUPABASE_SUPER_ADMIN_EMAIL` env or a config table. First user can be bootstraped via SQL.
- Game and dashboard need different auth flows: residents use email+password against residents table (or Auth); leaders use Supabase Auth with profiles.leader.

**Implemented:** `supabase/migrations/` contains schema, RLS policies, and auth trigger. See `supabase/README.md` for setup and super-admin bootstrap.

#### Self-Verification

1. Can Program A leader query Program B residents? (Must be no)
2. Can resident insert attempt for their own program only?
3. Are invite codes single-use and tied to a program?

---

### 2. Auth Plugin (Game) - ⬜ Pending

#### Overview

Custom RPG Maker MV plugin that intercepts New Game and Continue, shows a login overlay, authenticates against a Supabase Edge Function, stores session data in sessionStorage, and gates both flows.

#### Dependencies

- Section 1 (BaaS) — schema and RLS in place (done)
- **Section 6 (Resident Auth & API)** — the Edge Function endpoint must exist for login to work end-to-end. Section 2 can be built and tested structurally without it (overlay appears, form submits, error handling works), but live auth requires Section 6. **Recommended implementation order: build Section 6 first (or in parallel), then Section 2.**

#### Owner Prerequisites

- None for Section 2 itself. Owner Setup Task 1 (Supabase project) must already be done (it is — Section 1 complete).

#### Acceptance Criteria

- [ ] Plugin file `js/plugins/ResidencyAuth.js` created
- [ ] Plugin registered in `js/plugins.js` (loads after MadeWithMv, before or after YEP_MessageCore)
- [ ] Clicking "New Game" shows login overlay instead of starting game (when no session)
- [ ] Clicking "Continue" shows same login overlay before load screen (when no session)
- [ ] If session already exists in sessionStorage, New Game and Continue proceed normally (no overlay)
- [ ] Valid credentials → session stored in sessionStorage → original handler fires → game starts/loads
- [ ] Invalid credentials → error message shown in overlay, overlay stays open, no crash
- [ ] Session lasts until tab close (sessionStorage clears automatically)
- [ ] No logout UI in phase 1 (session = tab lifetime)

#### Auth Approach Decision

**Custom auth via Supabase Edge Function** (not Supabase Auth for residents).

Rationale:
- The schema already has `residents` table with `password_hash` — no schema changes needed.
- The game has no bundler (all `<script>` tags in `index.html`); using custom `fetch` avoids adding the ~100KB supabase-js library.
- Edge Function validates credentials server-side, returns a JWT with `resident_id` and `program_id` — the telemetry plugin uses this JWT directly.
- Service role in Edge Functions bypasses RLS, cleanly solving the attempt INSERT problem (Section 3 / Section 6).
- No mapping headache between `auth.uid` and `residents.id`.

**Phase 1 constraint:** `residents` has `UNIQUE(program_id, email)`, meaning the same email can exist in different programs. The Edge Function must handle this: if the email matches exactly one active resident, proceed; if multiple matches, return an error instructing the user to contact their program leader. A program selector can be added later if needed.

#### Technical Specification

| Aspect | Details |
|--------|---------|
| **Files to Create** | `js/plugins/ResidencyAuth.js` |
| **Files to Edit** | `js/plugins.js` — add ResidencyAuth entry (see exact entry below) |
| **Plugin Parameters** | `baasUrl` (Supabase project URL, e.g. `https://xxxxx.supabase.co`), `loginPath` (Edge Function path, default: `/functions/v1/resident-login`) |
| **sessionStorage Keys** | `residency_token`, `residency_resident_id`, `residency_program_id` |
| **Overrides** | `Scene_Title.prototype.commandNewGame` (line 509 of `rpg_scenes.js`), `Scene_Title.prototype.commandContinue` (line 516) |
| **No dependency on** | supabase-js, any external library. Plain `fetch` only. |

#### plugins.js Entry

Add this entry as the **last item** in the `$plugins` array in `js/plugins.js`. Current active plugins: Community_Basic, MadeWithMv, YEP_MessageCore. ResidencyAuth must be last so it overrides `Scene_Title` methods after all other plugins have had their turn.

```json
{"name":"ResidencyAuth","status":true,"description":"Resident login overlay for New Game and Continue.","parameters":{"baasUrl":"","loginPath":"/functions/v1/resident-login"}}
```

`baasUrl` is left empty — the owner provides the Supabase project URL at configuration time.

#### Override Pattern

The original handlers in `rpg_scenes.js`:

```javascript
// rpg_scenes.js lines 509-518
Scene_Title.prototype.commandNewGame = function() {
    DataManager.setupNewGame();
    this._commandWindow.close();
    this.fadeOutAll();
    SceneManager.goto(Scene_Map);
};

Scene_Title.prototype.commandContinue = function() {
    this._commandWindow.close();
    SceneManager.push(Scene_Load);
};
```

Plugin override pseudo-code:

```javascript
(function() {
  var params = PluginManager.parameters('ResidencyAuth');
  var BAAS_URL = String(params['baasUrl'] || '');
  var LOGIN_PATH = String(params['loginPath'] || '/functions/v1/resident-login');

  // --- Session helpers ---

  function hasSession() {
    return !!sessionStorage.getItem('residency_token');
  }

  function storeSession(token, residentId, programId) {
    sessionStorage.setItem('residency_token', token);
    sessionStorage.setItem('residency_resident_id', residentId);
    sessionStorage.setItem('residency_program_id', programId);
  }

  // --- Override commandNewGame ---

  var _orig_commandNewGame = Scene_Title.prototype.commandNewGame;
  Scene_Title.prototype.commandNewGame = function() {
    if (hasSession()) {
      _orig_commandNewGame.call(this);
      return;
    }
    // Pass scene reference so the async callback can call the original
    showLoginOverlay('newGame', this);
  };

  // --- Override commandContinue ---

  var _orig_commandContinue = Scene_Title.prototype.commandContinue;
  Scene_Title.prototype.commandContinue = function() {
    if (hasSession()) {
      _orig_commandContinue.call(this);
      return;
    }
    showLoginOverlay('continue', this);
  };

  // --- Overlay + auth ---

  function showLoginOverlay(mode, sceneRef) {
    // Create and show HTML overlay (see Overlay section below)
    // On submit: call authenticate(email, password, mode, sceneRef)
  }

  function authenticate(email, password, mode, sceneRef) {
    // Show loading state in overlay
    fetch(BAAS_URL + LOGIN_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    })
    .then(function(res) { return res.json().then(function(data) { return { ok: res.ok, data: data }; }); })
    .then(function(result) {
      if (!result.ok) {
        // Show result.data.error in overlay error div
        return;
      }
      storeSession(result.data.token, result.data.residentId, result.data.programId);
      removeOverlay();
      if (mode === 'newGame') {
        _orig_commandNewGame.call(sceneRef);
      } else {
        _orig_commandContinue.call(sceneRef);
      }
    })
    .catch(function() {
      // Show "Network error. Please try again." in overlay error div
    });
  }
})();
```

**Key detail:** The `sceneRef` parameter preserves the `Scene_Title` instance across the async auth call. The scene stays alive because `commandNewGame`/`commandContinue` returned early without transitioning scenes.

#### Overlay Specification

**Structure:** Single HTML div injected into `document.body`, positioned over the game canvas.

```html
<div id="residency-auth-overlay">
  <div id="residency-auth-box">
    <h2>Resident Login</h2>
    <input type="email" id="residency-email" placeholder="Email" autocomplete="email" />
    <input type="password" id="residency-password" placeholder="Password" autocomplete="current-password" />
    <button id="residency-submit">Sign In</button>
    <div id="residency-error" style="display:none"></div>
  </div>
</div>
```

**Styling rules:**
- `#residency-auth-overlay`: `position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center;`
- `#residency-auth-box`: dark background (`#1a1a2e` or similar), border (`1px solid #444`), rounded corners, padding, max-width 360px. Use CSS `font-family: GameFont, sans-serif` to match the game's font.
- Inputs: dark background, light text, border on focus.
- Submit button: styled to feel like a game UI element (not default browser button).
- Error div: red text, shown when auth fails, hidden on next submit attempt.
- On `removeOverlay()`: remove the `#residency-auth-overlay` div from DOM entirely.

**Interaction:**
- Email input gets `focus()` when overlay appears.
- Enter key on password field submits the form.
- While fetch is in-flight: disable Submit button, show "Signing in..." text. Re-enable on error.
- Clicking outside the auth box does nothing (overlay stays).

**Do not:**
- Use RPG Maker's Window system for the overlay (HTML is simpler, supports native keyboard input, and avoids conflicts with the game's input handling).
- Add `<script>` tags to `index.html` for this plugin (PluginManager loads it from `js/plugins/`).
- Block the RPG Maker update loop. The overlay sits on top of the canvas; the game loop continues running underneath (title screen animation keeps playing).
- Modify `rpg_scenes.js`, `rpg_windows.js`, or any core file. All overrides happen inside the plugin IIFE.

#### Edge Function Contract (Section 6 Must Provide)

**Request:**
```
POST {baasUrl}/functions/v1/resident-login
Content-Type: application/json

{ "email": "resident@example.com", "password": "tempPass123" }
```

**Success response (200):**
```json
{ "token": "<JWT>", "residentId": "<uuid>", "programId": "<uuid>" }
```

The JWT payload must include `resident_id` and `program_id` so the telemetry plugin (Section 3) can send them with each attempt.

**Error responses:**
- 401: `{ "error": "Invalid email or password" }`
- 403: `{ "error": "Account is deactivated. Contact your program leader." }` (when `residents.active = false`)
- 409: `{ "error": "Multiple accounts found. Contact your program leader." }` (when email matches multiple programs)
- 500: `{ "error": "Server error. Please try again." }`

#### Self-Verification

1. Does overlay appear when clicking New Game with no session? With an existing session, does the game start directly?
2. Does overlay appear when clicking Continue with no session? With an existing session, does Scene_Load appear directly?
3. Does sessionStorage clear when the tab is closed and reopened?
4. Does an invalid login show the error message without crashing?
5. Does a valid login store all three sessionStorage keys and proceed to the correct scene?
6. Does the title screen animation continue playing behind the overlay?
7. Does the plugin load without errors when `baasUrl` is empty (structural test before Section 6)?

---

### 3. Telemetry Plugin (Game) - ⬜ Pending

#### Overview

Plugin that registers a `ReportData` plugin command. When invoked from a game event, it sends telemetry (module_id, action, outcome, score) to the BaaS with the current session token. Includes offline queue: on failure, store in localStorage and retry when online.

#### Dependencies

- Section 1 (BaaS) — attempts table and insert endpoint
- Section 2 (Auth) — session token available

#### Acceptance Criteria

- [ ] Plugin command `ReportData moduleId action outcome [score]` works from events
- [ ] Payload includes: resident_id (from token), program_id, module_id, action, outcome, score, timestamp
- [ ] On network failure: queue in localStorage (max 500 items)
- [ ] On next ReportData call or window online event: retry queued items
- [ ] Telemetry does not block or interrupt gameplay
- [ ] Plugin chains with existing pluginCommand overrides (YEP_*, etc.)

#### Technical Specification

| Aspect | Details |
|--------|---------|
| **Files to Create** | `js/plugins/ResidencyTelemetry.js` |
| **Plugin Command** | `ReportData CE_Q1_FlashPulmEdema AdministerBiPAP correct` |
| **Storage** | sessionStorage (token), localStorage (queue) |

#### Implementation Notes

- Chain: `var _pluginCommand = Game_Interpreter.prototype.pluginCommand; Game_Interpreter.prototype.pluginCommand = function(cmd, args) { if (cmd === 'ReportData') { ... } else { _pluginCommand.call(this, cmd, args); } };`
- Parse args: `args[0]` = moduleId, `args[1]` = action, `args[2]` = outcome, `args[3]` = optional score.
- Send: `fetch(BAAS_URL + '/functions/v1/report-telemetry', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ module_id, action, outcome, score }) })`. Plugin uses same `baasUrl` as ResidencyAuth; endpoint is Section 6 Edge Function.
- Queue: key `residency_telemetry_queue`, value JSON array. On 4xx/5xx or network error, push to queue. Cap at 500.
- Retry: on next ReportData or `window.addEventListener('online', flushQueue)`, process queue FIFO.
- Fire-and-forget: do not await or block game loop.

#### Self-Verification

1. Does ReportData work when online?
2. Does queue persist across page refresh?
3. Does retry send queued items when back online?

---

### 4. Curriculum Mapping - ⬜ Pending

#### Overview

Map existing game content to telemetry. Add ReportData plugin commands at each clinical decision point. Document the pattern for future content.

#### Dependencies

- Section 3 (Telemetry Plugin) — ReportData command available

#### Acceptance Criteria

- [ ] CE_Q1_FlashPulmEdema: ReportData added in each choice branch (correct + 3 incorrect)
- [ ] Sentinel/Arbiter/Paragon: ReportData for correct advance and correct finish
- [ ] Trap_WrongAnswer, Trap_Correct: ReportData added
- [ ] Pattern document: how to add telemetry for new quizzes, bosses, traps

#### Technical Specification

| Aspect | Details |
|--------|---------|
| **Files to Modify** | `data/CommonEvents.json` (via RPG Maker editor) |
| **Format** | Plugin Command: `ReportData <moduleId> <action> <outcome> [score]` |

#### Curriculum Mapping Checklist

**CE_Q1_FlashPulmEdema (Common Event 1)**

| Branch | After | Plugin Command |
|--------|-------|----------------|
| Administer BiPAP (correct) | Show "Correct" | `ReportData CE_Q1_FlashPulmEdema AdministerBiPAP correct` |
| 1L normal saline bolus | Show "Incorrect" | `ReportData CE_Q1_FlashPulmEdema NormalSalineBolus incorrect` |
| 50mcg Fentanyl | Show "Incorrect" | `ReportData CE_Q1_FlashPulmEdema Fentanyl incorrect` |
| STEMI activation | Show "Incorrect" | `ReportData CE_Q1_FlashPulmEdema STEMIActivation incorrect` |

**Sentinel (Common Events 4, 5)**

| Event | After | Plugin Command |
|-------|-------|----------------|
| Sentinel_CorrectAdvance | Variable 10 increment | `ReportData Sentinel advance correct` |
| Sentinel_CorrectFinish | Variable 10 set to 4 | `ReportData Sentinel finish correct` |

**Arbiter (Common Events 6, 7)**

| Event | After | Plugin Command |
|-------|-------|----------------|
| Arbiter_CorrectAdvance | Variable 11 increment | `ReportData Arbiter advance correct` |
| Arbiter_CorrectFinish | Variable 11 set | `ReportData Arbiter finish correct` |

**Paragon (Common Events 8, 9)**

| Event | After | Plugin Command |
|-------|-------|----------------|
| Paragon_CorrectAdvance | Variable 12 increment | `ReportData Paragon advance correct` |
| Paragon_CorrectFinish | Variable 12 set | `ReportData Paragon finish correct` |

**Trap (Common Events 11, 12)**

| Event | After | Plugin Command |
|-------|-------|----------------|
| Trap_WrongAnswer | Show "Incorrect" | `ReportData Trap wrong incorrect` (action may vary by trap; use trap ID if available) |
| Trap_Correct | Show "Trap disabled" | `ReportData Trap correct correct` |

**Pattern for Future Content**

1. Identify the event (common event or map event) where a clinical decision occurs.
2. In each branch (correct/incorrect), add a Plugin Command immediately after the outcome is shown.
3. Format: `ReportData <moduleId> <action> <outcome> [score]`
   - moduleId: short identifier (e.g. CE_Q2_NextQuiz, Map3_Boss2)
   - action: choice made or milestone (e.g. OrderLabs, DefeatBoss)
   - outcome: `correct` or `incorrect`
   - score: optional numeric (e.g. 100, 0)
4. Use consistent moduleIds across related events for filtering in dashboard.

#### Implementation Notes

- Editing CommonEvents.json directly can work but RPG Maker editor is preferred to avoid corruption.
- If map events contain decisions, add ReportData there following the same pattern. Map files are not in repo; contractor will need access or will add when available.

#### Self-Verification

1. Does each listed event have the plugin command?
2. Is the pattern document clear for future content?

---

### 5. Leader Dashboard - ⬜ Pending

#### Overview

Separate React app (separate repo) for Program Leaders. Uses Tailwind + Flowbite per design guidelines. Super-admin can create Programs and invite Leaders. Leaders can manage residents, cohorts, and view analytics.

#### Owner Prerequisites

**Before you start:** Owner must complete **Owner Setup Tasks 1, 2, and 4** (Supabase project, super-admin email, dashboard repo). Confirm the owner has provided the super-admin email and given you access to the dashboard repo.

#### Dependencies

- Section 1 (BaaS) — schema, RLS, auth
- Admin/design-guidelines.md — visual language

#### Acceptance Criteria

- [ ] React + Vite (or Next.js static export) for GitHub Pages
- [ ] Tailwind + Flowbite, design guidelines applied
- [ ] Auth: Leader login (email/password via Supabase Auth)
- [ ] Super-admin: create Program, generate single-use invite code
- [ ] Leader signup: enter invite code → create account → linked to Program
- [ ] Leader: bulk upload residents (CSV), assign temp passwords, export for manual distribution
- [ ] Leader: create cohorts, assign residents to cohorts
- [ ] Leader: reset resident password, deactivate resident
- [ ] Leader: cohort matrix view (completion rates by cohort)
- [ ] Leader: drill-down view (individual resident playthrough log)
- [ ] Multi-program: Leader sees only their program's data

#### Technical Specification

| Aspect | Details |
|--------|---------|
| **Stack** | React, Vite, Tailwind, Flowbite |
| **Auth** | Supabase Auth (Leaders), profiles.role + program_id |
| **Deploy** | GitHub Pages (static export) |
| **Repo** | Separate from game repo |

#### Dashboard Pages

| Route | Access | Purpose |
|-------|--------|---------|
| `/login` | Public | Leader login |
| `/signup` | Public | Leader signup with invite code |
| `/` | Leader | Dashboard home (cohort matrix) |
| `/residents` | Leader | Roster, bulk upload, reset password, deactivate |
| `/cohorts` | Leader | Create cohorts, assign residents |
| `/residents/:id` | Leader | Drill-down: resident's attempt log |
| `/admin/programs` | Super-admin | Create programs |
| `/admin/invites` | Super-admin | Generate invite codes for Leaders |

#### Implementation Notes

- Super-admin check: `profile.role === 'super_admin'` or `profile.email === process.env.VITE_SUPER_ADMIN_EMAIL`
- CSV format: email, (optional) display_name, (optional) cohort_names. Password generated server-side or client-side, shown in UI for manual copy.
- Design: follow Admin/design-guidelines.md — primary blue, gray neutrals, status colors for triage only, rounded-lg, shadow-sm cards, sidebar layout.

#### Self-Verification

1. Can super-admin create program and invite code?
2. Can Leader sign up with code and see only their program?
3. Can Leader bulk-add residents and see them in roster?
4. Does cohort matrix show completion by cohort?
5. Does drill-down show individual attempt log?

---

### 6. Resident Auth & API (BaaS) - 🟢 Completed

#### Overview

Two Supabase Edge Functions: one for resident login (validates email+password against `residents` table, returns JWT), one for telemetry insert (validates JWT, inserts into `attempts` table using service role). Residents do not use Supabase Auth; they authenticate via the custom `residents` table.

#### Dependencies

- Section 1 (BaaS) — schema in place (done)
- **Sections 2 and 3 depend on this.** The Edge Function contracts are defined below. This section should be implemented before or in parallel with Sections 2 and 3.

#### Owner Prerequisites

- None. Owner Setup Task 1 (Supabase project) is already done. The developer deploys Edge Functions via Supabase CLI; no owner action required.

#### Acceptance Criteria

- [x] Edge Function `resident-login`: POST with `{ email, password }` → validates against `residents` table → returns `{ token, residentId, programId }` (JWT)
- [x] Edge Function `resident-login`: returns 401 on bad credentials, 403 on deactivated account, 409 on ambiguous email (multiple programs)
- [x] JWT payload includes `resident_id`, `program_id`, `exp` (expiry — e.g. 24h)
- [x] Edge Function `report-telemetry`: POST with JWT in Authorization header + attempt payload → validates JWT → inserts into `attempts` using service role (bypasses RLS)
- [x] `residents.password_hash` uses bcrypt
- [x] Leaders create residents via dashboard (Section 5); password is hashed with bcrypt on creation

#### Technical Specification

| Aspect | Details |
|--------|---------|
| **Approach** | Custom auth via Supabase Edge Functions (Deno). **Not** Supabase Auth for residents. |
| **Files to Create** | `supabase/functions/resident-login/index.ts`, `supabase/functions/report-telemetry/index.ts` |
| **Edge Functions** | `resident-login`, `report-telemetry` (hyphenated names per Supabase convention) |
| **Password hashing** | bcrypt — import from `https://deno.land/x/bcrypt@v0.4.1/mod.ts`; use `compare(password, hash)` (async) |
| **Token** | JWT signed with HS256. Secret: set via `npx supabase secrets set JWT_SECRET <value>`. Use the JWT secret from Supabase Project Settings → API → JWT Settings, or a dedicated secret. Payload: `{ resident_id, program_id, exp }`. |
| **Service role** | Edge Functions use `SUPABASE_SERVICE_ROLE_KEY` (auto-injected) to insert into `attempts` (bypasses RLS) |
| **CORS** | Both functions must return CORS headers for browser invocation. Use `corsHeaders` from `@supabase/supabase-js/cors` (v2.95.0+), or hardcode `Access-Control-Allow-Origin`, `Access-Control-Allow-Headers`. Handle OPTIONS preflight with 200 + headers. |

#### Edge Function: resident-login

**Path:** `supabase/functions/resident-login/index.ts`  
**URL:** `{baasUrl}/functions/v1/resident-login`

**Request:**
```
POST /functions/v1/resident-login
Content-Type: application/json

{ "email": "resident@example.com", "password": "tempPass123" }
```

**Success response (200):**
```json
{ "token": "<JWT>", "residentId": "<uuid>", "programId": "<uuid>" }
```

**Error responses:**
| Status | Body |
|--------|------|
| 401 | `{ "error": "Invalid email or password" }` |
| 403 | `{ "error": "Account is deactivated. Contact your program leader." }` |
| 409 | `{ "error": "Multiple accounts found. Contact your program leader." }` |
| 500 | `{ "error": "Server error. Please try again." }` |

**Login flow (pseudo-code):**
1. If `req.method === 'OPTIONS'`, return 200 with CORS headers.
2. Parse JSON body; validate `email` and `password` are non-empty strings.
3. Query: `SELECT id, program_id, password_hash, active FROM residents WHERE email = $1`. Use Supabase client with service role.
4. If 0 rows → 401.
5. If `active = false` for any row → 403.
6. If row count > 1 → 409.
7. If 1 row: `await bcrypt.compare(password, row.password_hash)`. If false → 401. If true: sign JWT with `{ resident_id: row.id, program_id: row.program_id, exp: now + 24h }`, return 200 with `{ token, residentId, programId }`.
8. All responses: include CORS headers and `Content-Type: application/json`.

#### Edge Function: report-telemetry

**Path:** `supabase/functions/report-telemetry/index.ts`  
**URL:** `{baasUrl}/functions/v1/report-telemetry`  
**Note:** Section 3 (Telemetry Plugin) must call this URL, not `/attempts`. The plugin will use `baasUrl + '/functions/v1/report-telemetry'` (or a `telemetryPath` param).

**Request:**
```
POST /functions/v1/report-telemetry
Authorization: Bearer <JWT>
Content-Type: application/json

{ "module_id": "CE_Q1_FlashPulmEdema", "action": "AdministerBiPAP", "outcome": "correct", "score": 100 }
```

**Body fields:** `module_id` (required), `action` (required), `outcome` (required), `score` (optional number).

**Success response (200 or 201):**
```json
{ "id": "<uuid>" }
```
Or empty body with 200/201.

**Error responses:**
| Status | Body |
|--------|------|
| 401 | `{ "error": "Invalid or expired token" }` |
| 400 | `{ "error": "Missing module_id, action, or outcome" }` |
| 500 | `{ "error": "Server error. Please try again." }` |

**Telemetry flow (pseudo-code):**
1. If `req.method === 'OPTIONS'`, return 200 with CORS headers.
2. Extract `Authorization: Bearer <token>`. If missing → 401.
3. Verify JWT with `JWT_SECRET`; extract `resident_id`, `program_id`. If invalid or expired → 401.
4. Parse JSON body. Validate `module_id`, `action`, `outcome` are non-empty strings; `score` optional number.
5. Insert: `INSERT INTO attempts (resident_id, program_id, module_id, action, outcome, score) VALUES ($1, $2, $3, $4, $5, $6)` using Supabase client with service role. `created_at` defaults via schema.
6. Return 200/201 with CORS headers.

#### Implementation Notes

- **JWT library:** Use `jose` (Deno-compatible) or `https://deno.land/x/djwt`. Import `create` for signing, `verify` for validation.
- **Database access:** Use `@supabase/supabase-js` with `createClient(url, service_role_key)` for both query and insert. Service role bypasses RLS.
- **Deploy:** `npx supabase functions deploy resident-login` and `npx supabase functions deploy report-telemetry`. Requires `npx supabase link` first.
- **Secrets:** Run `npx supabase secrets set JWT_SECRET <your-secret>` before deploy. Get the secret from Supabase Dashboard → Project Settings → API → JWT Secret (or generate a new one).
- **Do not:** Expose `SUPABASE_SERVICE_ROLE_KEY` to the client. Use it only inside Edge Functions. Do not use Supabase Auth for residents — this is custom auth.

#### Self-Verification

1. Can resident log in from game plugin with valid credentials?
2. Does login fail with clear error on bad password, deactivated account, ambiguous email?
3. Can telemetry be inserted with the JWT from login?
4. Does the JWT expire correctly?

---

### 7. Deployment - ⬜ Pending

#### Overview

Deploy game and dashboard to GitHub Pages. Configure BaaS CORS for both origins.

#### Owner Prerequisites

**Before you start:** Owner must complete **Owner Setup Tasks 3 and 5** (CORS configuration, GitHub Pages enabled for game and dashboard). Confirm the owner has enabled Pages and added the URLs to Supabase CORS. Owner must provide the final game and dashboard URLs.

#### Dependencies

- Sections 1–6 complete

#### Acceptance Criteria

- [ ] Game deploys to GitHub Pages (e.g. username.github.io/ThreeDungeons or project page)
- [ ] Dashboard deploys to GitHub Pages (separate repo or subpath)
- [ ] Supabase CORS allows both origins
- [ ] Plugin BaaS URL points to production Supabase
- [ ] Dashboard env has production Supabase URL and anon key

#### Technical Specification

| Aspect | Details |
|--------|---------|
| **Game** | Static export; push to gh-pages or use GitHub Actions |
| **Dashboard** | `npm run build` → deploy `dist/` to gh-pages |
| **CORS** | Add game origin and dashboard origin in Supabase dashboard |

#### Implementation Notes

- Game: ensure index.html and js/ load correctly from subpath if not at root.
- Dashboard: Vite base path may need `base: '/dashboard/'` if not at root.

#### Self-Verification

1. Can resident play from GitHub Pages and log in?
2. Can Leader access dashboard from GitHub Pages?
3. Does telemetry reach Supabase from deployed game?

---

## Development Notes

### Change Log

| Date | Section | Type | Description | Impact |
|------|---------|------|-------------|--------|
| 2025-03-05 | — | Initial | Document created from interview | — |
| 2025-03-05 | 1 | Implementation | Added supabase/migrations/ (schema, RLS, auth trigger), supabase/README.md | Owner runs migrations after Task 1 |
| 2025-03-05 | 1 | Completed | Migrations applied, super-admin bootstrapped | Section 1 done |
| 2025-03-05 | 2 | Plan Review | Resolved auth approach (custom Edge Function), added override pseudo-code, overlay spec, Edge Function contract, plugins.js entry, phase 1 multi-program constraint | Section 2 implementation-ready |
| 2025-03-05 | — | Implementation Order | Added recommended sequence under For the Implementer: 1 → 6 → 2 → 3 → 4 → 5 → 7 | Clarifies Section 6 before Section 2 |
| 2025-03-05 | 6 | Plan Review | Added file paths, full telemetry contract, CORS, bcrypt/JWT specifics, pseudo-code for both flows, owner prerequisites | Section 6 implementation-ready |
| 2025-03-05 | 6 | Implementation | Added supabase/functions/resident-login, report-telemetry; deployed both | Section 6 done |
| 2025-03-05 | 3 | Correction | Fixed telemetry endpoint: use `/functions/v1/report-telemetry` (Section 6 Edge Function), not `/attempts` | Aligns with Section 6 |

### Open Questions

- [x] Resident auth: Supabase Auth vs custom? **Decision: Custom auth via Supabase Edge Function.** Schema already has `residents.password_hash`; avoids adding supabase-js to the game; Edge Function issues JWT with resident_id and program_id. See Section 2 "Auth Approach Decision" for full rationale.
- [ ] Save file linking: link RPG Maker save to resident_id for Continue? (Optional for phase 1)

### Blockers

- None
