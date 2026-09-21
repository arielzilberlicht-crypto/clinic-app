# Clinic Automation Hub - Make Data Contract

Agreed with Dr. Zilberlicht on 2026-09-21. This is the contract between the
Make scenarios (which write) and the Clinic Automation Hub dashboard at
`/hub` (which only reads). If anything here needs to change, update this
file and `backend/hub/sheetColumns.js` together in the same commit.

Spreadsheet: "Clinic Automation Hub - Dr Ariel Zilberlicht",
`1HJMCRnCbkyfkBfyBg6tKj0_TyX2_NOMKtsBKV7TNokI`.

## What the Hub currently reads (confirmed against the live sheet)

| Tab | Fields the Hub uses | Real header names |
|---|---|---|
| Appointments | patientId, phone, name, createdAt, appointmentStart, clinic, source, status, rawId, confirmedId, idVerification, engagement, calendarEventId | `Patient_ID`, `Phone`, `Patient_Name`, `Created_At`, `Appointment_DateTime`, `Location`, `Source`, `Status`, `Source_ID`, `Confirmed_ID`, `ID_Verification_Status`, `Engagement_Status`, `Calendar_Event_ID` |
| Communications | messageId, patientId, phone, time, direction, type, source, appointmentId, status | `Communication_ID`, `Patient_ID`, `Phone`, `Timestamp`, `Direction`, `Message_Type`, `Scenario_Source`, `Appointment_or_Surgery_ID`, `Delivery_Status` |
| Bot_State, Patients | mapped in `sheetColumns.js`, not yet consumed by any screen | see that file |

No `Insurer`/`HMO`/`Payer` column exists yet. No `Alerts` tab exists yet.

## Appointment lifecycle rule (agreed 2026-09-21)

One Appointments row represents one visit intention, keyed by
`Calendar_Event_ID`. The rule that avoids both double-counting reschedules
and an N-day guessing window:

- **While the row's `Appointment_DateTime` is still in the future**, any of
  the following update that SAME row in place, never insert a new one:
  - the time/date changes (reschedule, whether done manually by the
    secretary or via a new Shidurit message for the same patient) - only
    `Appointment_DateTime` and, if a new calendar event was created,
    `Calendar_Event_ID` change; `Status` is untouched.
  - an explicit cancellation ("ביטול תור" / "בוטל תור ל") - sets
    `Status = CANCELLED` on that row. No message is sent to the patient.
  - a "regret" (patient books again for that same still-future visit after
    having cancelled it) - flips `Status` back to `SCHEDULED` and updates
    `Calendar_Event_ID`/`Appointment_DateTime` if a new calendar event was
    created. No new row.
- **Once `Appointment_DateTime` has passed**, that row is a closed
  historical record. A new booking for the same patient after that point
  always creates a brand new row (same `Patient_ID`, new
  `Calendar_Event_ID`), never overwrites the old one.

This makes a same-day cancellation percentage exactly what the doctor
described: 10 women booked, 2 explicitly cancelled (`Status = CANCELLED`
on their row), 6 changed times but the row stayed `SCHEDULED` throughout,
2 attended at their original time - cancellation rate is 2/10, with no
special handling needed for the 6 reschedules.

**Open, unverified question:** when a patient reschedules through the
Maccabi/Clalit portal, does Shidurit send an explicit "ביטול" message for
the old slot, or only a new "קביעת תור" message with no cancellation
signal at all? This determines whether Make needs extra logic to find and
update the existing future-dated row instead of creating a duplicate.
Rescheduling is already on the doctor's own "not yet tested" list (handoff
doc, section 6) - worth testing this specific case before relying on it.

## Build tasks for Make (see chat message from 2026-09-21 for the version
worded for pasting into the Make-side Claude session)

1. On a successful cancellation (both Maccabi and Clalit routes in
   scenario 9833997), after the calendar event is deleted, update the
   Appointments row matched by `Calendar_Event_ID` to `Status = CANCELLED`.
   No other column, no message to the patient.
2. `Patient_ID` must always be derived from the phone number
   (`PAT-972<digits>`), the same way, in every flow that creates or looks
   up a patient (Shidurit Maccabi/Clalit, direct calendar entry 9834962,
   future MedReviews/website leads).
3. Direct calendar entry (9834962 / 9841879): write `Source = MANUAL_CALENDAR`,
   run the same ID checksum validation as Shidurit so `ID_Verification_Status`
   is never blank on an active row, `Location` is always exactly `חיפה` or
   `תל אביב` (identical spelling every time), and reschedules update the
   same row per the rule above rather than inserting a new one.

## Deferred to a future phase (noted here, not needed now)

- **Leads spreadsheet** (MedReviews + website): does not exist yet, future
  development. Nothing needed from Make right now; when it exists, send
  the Hub its URL the same way the main spreadsheet's URL was shared, so
  its real headers can be mapped.
- **Insurer/Payer field**: also future. Important nuance the doctor raised:
  the HMO a patient booked through is not always the actual payer for a
  given procedure (a patient may book via Maccabi's portal but pay
  privately for something not covered, or the reverse). When this field is
  designed, it should capture the actual payer, not just infer it from the
  booking channel.
- **End-of-clinic attendance marking** (who actually showed up that day,
  as distinct from who cancelled in advance): this is phase 1's
  end-of-clinic menu from the original build brief, not phase 0.
