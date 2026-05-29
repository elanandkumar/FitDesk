export const HELP = {
  dashboard:
    'Sessions for the next 7 days. Tap a session to mark complete or skip. Use + to add a one-off session. Personal sessions show linked trainee names.',

  calendar:
    'Swipe left/right to change week/month. Tap a date to see sessions. Coloured dots show class types. Personal sessions show linked trainee names. Use the calendar icon to toggle week/month view.',

  classSeriesList:
    'A series defines a recurring class schedule. Sessions are auto-generated 90 days ahead. Personal series can have trainees linked — their names appear on each session card. Tap + to create a new one.',

  classSessionDetail:
    'Mark Complete to record attendance. For personal sessions, linked trainee names and session count (e.g. Session 3 / 12) are shown. Skip marks this session as skipped without affecting the series. Notes are saved separately.',

  contactsManagers:
    'Add managers who assign you classes. Outstanding balance (in orange) shows total unpaid sessions. Tap a manager to see their payment history.',

  contactsTrainees:
    'Add your personal training clients. Tap a trainee to view their session packages and full session history with session numbering.',

  managerDetail:
    'Shows payment history per class. Mark individual sessions paid after receiving payment from this manager.',

  traineeDetail:
    'Packages tab shows monthly packages and payment status. Sessions tab shows all sessions with "Session N / M" numbering for completed ones.',

  paymentsManagers:
    'Manager payments are grouped by manager. Tap "View →" to see individual sessions and mark them paid. Payments are auto-created when sessions are marked complete.',

  paymentsTrainees:
    'Monthly packages per trainee. Session count increments automatically when a personal session is marked complete. Mark the package paid after receiving payment.',

  settings:
    'Configure notification reminders, manage class types, centers, and export/import your data. Export regularly to keep a backup — data is stored locally only.',

  incomeSummary:
    'Shows total earned vs pending per month. Breakdown covers manager classes, trainee packages, and centers/venues. Only completed sessions and existing packages are counted.',
} as const;
