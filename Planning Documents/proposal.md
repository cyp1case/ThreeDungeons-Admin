Here is a comprehensive conceptual proposal formatted as a Markdown (`.md`) document. You can copy and paste this directly into any text editor and save it as `Residency_RPG_Tracking_Proposal.md`.

---

# Project Proposal: Residency RPG Telemetry & Authentication System

## 1. Executive Summary

This document outlines the architecture and implementation strategy for integrating an authentication and progress-tracking system into an existing RPG Maker MV educational game (currently hosted via GitHub Pages). The system is designed to serve a medical residency program, gamifying the curriculum while providing Program Leaders with actionable, secure data on Learner performance and clinical decision-making within the simulation.

---

## 2. System Architecture

Because the game is hosted on GitHub Pages (a static hosting environment), it cannot natively process secure logins or store dynamic data. The solution relies on a three-pillar architecture:

* **The Client (RPG Maker MV Game):** The front-end interface where residents interact with the educational modules. It will be augmented with a custom, "silent" JavaScript plugin.
* **The Backend-as-a-Service (BaaS):** A cloud-based database and authentication provider (e.g., Supabase or Firebase). This acts as the secure "brain" of the operation, receiving and organizing data without requiring you to build and manage a dedicated server.
* **The Leader Dashboard:** A separate, secure web portal independent of the game engine, designed exclusively for Program Leaders to review analytics, cohorts, and individual learner metrics.

---

## 3. User Roles & Hierarchy

The database will be structured to support a strict hierarchy, ensuring data privacy and organized reporting.

* **Level 1: Program:** The overarching organization (e.g., "General Surgery Residency").
* **Level 2: Program Leaders / Faculty:** Users with administrative privileges. They can view aggregate data, drill down into individual resident metrics, and manage the roster.
* **Level 3: Learners (Residents):** The players. They are organized via "Cohort Tags" (e.g., PGY-1, PGY-2, Class of 2026, or specific rotation blocks) to allow leaders to filter data effectively.

---

## 4. The Plugin Concept

A custom plugin will be injected into the RPG Maker MV project to handle two primary responsibilities:

### A. The Gatekeeper (Authentication)

* The plugin overrides the standard "New Game" title screen, replacing it with a secure HTML overlay prompting for an Email and Password.
* Credentials are sent to the BaaS. Upon verification, the BaaS issues a temporary "Session Token."
* This token is stored locally in the resident's browser and acts as their digital ID badge for the duration of their play session, ensuring all subsequent game data is linked to the correct user.

### B. The Reporter (Telemetry & Tracking)

* The plugin establishes custom "Plugin Commands" that the game developer can place inside standard RPG Maker events.
* When a resident makes a key clinical decision (e.g., ordering a specific lab, administering a drug, or completing a module), the event triggers the tracking command.
* The plugin silently bundles this Key Performance Indicator (KPI) into a data packet (JSON) alongside the Session Token and timestamp, transmitting it to the BaaS in the background without interrupting gameplay.

---

## 5. Data & Reporting Strategy

The BaaS will capture granular gameplay data, which the Leader Dashboard will query and visualize.

**Tracked Metrics (The "Attempts Table"):**

* **User ID:** Who made the decision.
* **Module/Quest ID:** Which simulation they are playing.
* **Action/Event:** What specific choice was made.
* **Score/Outcome:** Pass, fail, or numerical grade.
* **Timestamp:** When the action occurred.

**Dashboard Features:**

* **Cohort Matrix:** High-level view of completion rates across specific PGY levels.
* **Drill-Down View:** Step-by-step logs of an individual resident's playthrough to identify exactly where their clinical reasoning diverged from the standard of care.

---

## 6. Security & Privacy Considerations

While this system does not track patient data (HIPAA), it does track learner performance data, which requires a baseline of privacy.

* **Closed Roster:** Residents do not create their own accounts. Program Leaders bulk-upload resident emails and assign temporary passwords. Only authorized individuals can access the portal.
* **Data Decoupling (Optional but Recommended):** To maximize privacy, the game database can use "Codenames" or randomized IDs rather than real names. The master key linking names to IDs remains securely on a local hospital network, keeping the cloud database technically anonymized.
* **Role-Based Access Control (RBAC):** Strict rules enforced by the BaaS ensuring that Learners can only ever write data (submit scores), while only Leaders can read data (view the dashboard).

---

## 7. Implementation Roadmap

1. **Infrastructure Setup:** Provision a cloud database (Supabase/Firebase) and define the schema (Users, Programs, Telemetry).
2. **Plugin Prototyping (Auth):** Develop the login overlay for RPG Maker and successfully issue a Session Token.
3. **Plugin Prototyping (Telemetry):** Develop the "Report Data" command and verify data is appearing in the cloud database.
4. **Curriculum Mapping:** Map specific RPG Maker variables and switches to the desired educational KPIs.
5. **Dashboard Development:** Build the separate HTML/JS portal for faculty to view the database tables.

---

Would you like me to outline the specific database tables (the "schema") you would need to set up in a service like Supabase to make this data hierarchy work?