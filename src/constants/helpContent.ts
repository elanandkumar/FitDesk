export const HELP = {
  dashboard:
    'Shows today, the next 7 days of sessions, recent earnings, notifications, and backup reminders. Tap a session to open details. Use + to add a one-off session.',

  calendar:
    'Use week or month view to browse sessions by date. Dots mark scheduled class types. Tap a date to list sessions, tap a session for details, or use + to add a session on the selected date.',

  classSeriesList:
    'Manage recurring class schedules. Active shows current series; All includes ended or cancelled series. Search by title, tap a series to edit it, or use + to create a new recurring schedule.',

  classSessionDetail:
    'Review session date, time, location, people, and notes. Upcoming sessions can be edited, skipped, deleted if one-off, or marked complete. Completing organizer sessions creates payments; completing personal sessions updates package usage.',

  contactsOrganizers:
    'Organizers are people or organizations who arrange sessions. Add regular contacts with an optional default rate or lightweight one-time contacts, then open an organizer to review payments and history.',

  contactsTrainees:
    'Trainees are personal training clients. Search the list, add new trainees, and open a trainee to view contact details, packages, session history, and notes.',

  organizerDetail:
    'Shows organizer type, contact info, default rate, outstanding balance, and payment history. Use the edit button to update details. Removing an organizer archives them while keeping history and payments.',

  traineeDetail:
    'Packages shows monthly package usage and payment status. Sessions shows the trainee history with completed session numbering. Use the edit button to update details; removing a trainee archives them while keeping history.',

  paymentsOrganizers:
    'Organizer payments are created when organizer sessions are marked complete. Use Pending or All to filter, review totals, and open an organizer to mark individual sessions paid.',

  paymentsTrainees:
    'Trainee packages are grouped by trainee. Use Pending or All to filter, add packages with +, and mark packages paid after receiving payment. Usage increases when personal sessions are completed.',

  settings:
    'Configure class reminders, payment reminders, overdue alert thresholds, class types, centers, and backups. Export regularly because Solo Class HQ stores data locally on this device.',

  incomeSummary:
    'Shows earned and pending income by period. This Month and Last Month compare against the prior month; yearly and all-time views include a monthly chart when enough data exists. Organizer income comes from completed organizer sessions. Trainee income comes from created packages. Tap a month to see its detailed breakdown.',
} as const;
