# Security Specification: Zero-Trust Blueprint Backend

This specification outlines the data invariants, unauthorized states ("Dirty Dozen" payloads), and rules for protecting user-specific logs and profiles.

## 1. Core Data Invariants

1. **Owner-Isolation**: A user can only read, create, update, or delete their own user profile document `/users/{userId}` and their sub-collection `/users/{userId}/logs/{logId}`.
2. **Strict Structure**:
   - Every LogEntry document must contain valid string IDs representing the mood, energy, resistance, fear, and activity.
   - User names, titles, and note contents must not exceed standard length bounds to avoid Denial of Wallet (DoW) attacks.
3. **No Claim-Based Impersonation**: Users cannot assume other identities or overwrite other users' logs.

---

## 2. The "Dirty Dozen" Exploit Payloads

Here are 12 malicious payloads and query attempts designed to break database integrity, and how the rules block them:

| ID | Attack Vector | Document Path | Malicious Payload / Operation | Expected Response | Remediation check |
|----|---------------|---------------|------------------------------|-------------------|-------------------|
| 01 | Identity Theft: Profile Spoofing | `/users/victim_id` | Set name to "Hacker" by anonymous client | `PERMISSION_DENIED` | Auth check and `request.auth.uid == userId` |
| 02 | Denial of Wallet: Gigantic ID | `/users/my_id/logs/super_long_junk_id...` | Attempt to write log with 2KB character ID | `PERMISSION_DENIED` | `isValidId()` enforcing document size <= 128 |
| 03 | Escalation: Shadow Profile Fields | `/users/my_id` | `{ "name": "Alex", "title": "...", "isAdminSecretField": true }` | `PERMISSION_DENIED` | `affectedKeys().hasOnly(['name', 'title', 'avatarUrl', 'remindersEnabled', 'reminderIntervalHours'])` during update |
| 04 | Spoofing: False Author | `/users/my_id/logs/log_12` | `{ "userId": "victim_uid", "mood": "happy" }` | `PERMISSION_DENIED` | Ensure logs are anchored in `/users/{userId}/...` |
| 05 | Schema Injection: Bad Types | `/users/my_id` | `{ "remindersEnabled": "YES_PLEASE" }` (String instead of Boolean) | `PERMISSION_DENIED` | `isValidUser()` check |
| 06 | Blanket Read Query Scraping | `/users/some_owner/logs` | Execute `db.collectionGroup("logs").get()` without where clause | `PERMISSION_DENIED` | `allow list` checks `resource.data` or owner path context |
| 07 | Immortal Field Violation | `/users/my_id` | Attempt to modify `email` or `createdAt` after creation | `PERMISSION_DENIED` | `incoming().email == existing().email` |
| 08 | Resource Poisoning: Huge Note | `/users/my_id/logs/log_12` | `{ "note": "A".repeat(50000) }` (50KB string note) | `PERMISSION_DENIED` | Note length strictly bounded to `size() <= 1000` |
| 09 | Missing Mandatory Fields | `/users/my_id/logs/log_12` | `{ "mood": "happy" }` (No fear, activity, energy or resistance) | `PERMISSION_DENIED` | `hasAll(['id', 'createdAt', 'mood', 'energy', 'resistance', 'fear', 'activity'])` |
| 10 | Non-existent Field Modification | `/users/my_id/logs/log_12` | Update `mystery_field: "value"` during update | `PERMISSION_DENIED` | `affectedKeys().hasOnly()` check on update |
| 11 | Malicious Custom Characters ID | `/users/my_id/logs/malicious%20id` | Document ID poisoned with path-traversal/escaped characters | `PERMISSION_DENIED` | ID matches regex verification |
| 12 | Unverified Email Operations | `/users/my_id` | Write state when auth metadata has `email_verified == false` | `PERMISSION_DENIED` | Mandatory `email_verified == true` gate checking (when standard auth is used) |

---

## 3. Test Runner Design

```typescript
// firestore.rules.test.ts Mock Specification
import { assertFails, assertSucceeds } from "@firebase/rules-unit-testing";

// This file would represent automated unit testing of clean resource maps.
// It ensures that all requests failing to establish isOwner(userId) return PERMISSION_DENIED.
```

---

## 4. Red Team Audit Checklist

1. **Identity Spoofing**: Blocked. Matching uid to doc path variable makes fake-client identity spoofing impossible.
2. **State Shortcutting**: Checked. No status flags are subject to state leaps or sequence jumps.
3. **Resource Poisoning**: Prevented. String sizes for annotations and user names are strictly capped.
