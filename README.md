# FitDesk

**Your personal fitness class companion — built with love, for a freelance fitness instructor.**

<p align="center">
  <img src="screenshots/Screenshot_1779990293.png" width="220" alt="Welcome Screen" />
  &nbsp;&nbsp;
  <img src="screenshots/Screenshot_1779990474.png" width="220" alt="Dashboard" />
  &nbsp;&nbsp;
  <img src="screenshots/Screenshot_1779990510.png" width="220" alt="Payments" />
</p>

---

## The Story

My wife Khushi is a freelance Yoga, Zumba, and Dance Fitness instructor. She also runs personal training sessions at the gym. Over time I noticed her juggling multiple WhatsApp chats, notebooks, and her own memory just to track which manager assigned which class, when it was, and whether she'd been paid.

So I built FitDesk — a simple, local-first Android app that puts everything in one place: classes, clients, schedules, and payments. No account. No cloud. No subscription. Just her phone.

---

## What It Does

- **Dashboard** — today's sessions at a glance, upcoming week, trainee names on personal session cards
- **Calendar** — week view, session dots per day, trainee names shown inline for personal slots
- **Class Management** — recurring series (weekly, custom) or one-off adhoc sessions; class type picker works for both manager and personal sessions
- **Two class sources**: classes assigned by **managers** (Zumba centers, yoga studios) and **personal training** clients she manages herself
- **Trainee linkage** — link one or multiple trainees to a personal series; session cards show their names; sessions numbered "Session 3 / 12" based on active package
- **Session completion** — one-tap mark complete with trainee name + session count shown; auto-decrements package; no checkbox gymnastics
- **Centers / Venues** — add the gyms and studios you work at; attach them to series and sessions; see per-venue earnings in Reports
- **Contacts** — track managers (with per-class rate) and trainees (with monthly session packages); searchable pickers everywhere with inline add for class types and centers
- **Payments** — manager payments grouped by manager with drill-down per session; trainee packages tracked by month with sessions-used count; Reports accessible directly from the Payments screen
- **Notifications** — class reminders (15 min / 30 min / 1 hr before), payment reminders
- **Export / Import** — JSON backup so data is never lost

<p align="center">
  <img src="screenshots/Screenshot_1779990485.png" width="220" alt="Calendar" />
  &nbsp;&nbsp;
  <img src="screenshots/Screenshot_1779990505.png" width="220" alt="Session Detail" />
  &nbsp;&nbsp;
  <img src="screenshots/Screenshot_1779990521.png" width="220" alt="Settings" />
</p>

---

## Privacy First

> **Your data never leaves your device.**

No login. No analytics. No backend server. Everything is stored locally using SQLite on your phone. Export your data anytime from Settings → Export / Import.

<p align="center">
  <img src="screenshots/Screenshot_1779990300.png" width="220" alt="Your Data, Your Device" />
</p>

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Expo (managed) SDK 51+ |
| Language | TypeScript (strict) |
| UI | React Native Paper |
| Storage | expo-sqlite (local only) |
| Notifications | expo-notifications (local only) |
| Navigation | React Navigation v6 |
| Calendar | react-native-calendars |

---

## Who Is This For?

Freelance fitness instructors who:
- Teach classes for multiple managers / studios / centers
- Run their own personal training clients
- Want to track payments without a spreadsheet
- Want their data on their device, not someone else's server

---

## Getting Started

```bash
git clone https://github.com/[YOUR_USERNAME]/FitDesk.git
cd FitDesk
npm install
npx expo run:android
```

> Android only. iOS not supported in this release.

---

## Contributing

This was built for one person — but if it helps more freelance instructors, that's even better.

Pull requests welcome. If you're a fitness instructor with a feature request, open an issue — I'd love to hear what would make this more useful for you.

---

## License

MIT — free to use, modify, and share.

---

*Built by Anand Kumar for Khushi — because love languages sometimes look like React Native.*
