# מרפאת ד"ר אריאל זילברליכט - מערכת ניהול

מערכת ניהול מטופלות למרפאה פרטית בגינקולוגיה ואורוגינקולוגיה, חיפה.

## הפעלה מהירה

### 1. התקנת תלויות
```bash
npm run install:all
```

### 2. הגדרת משתני סביבה
```bash
cp backend/.env.example backend/.env
# ערוך את הקובץ עם הפרטים שלך
```

### 3. הרצה בפיתוח
```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## מבנה הפרויקט

```
clinic-app/
├── backend/
│   ├── server.js           # Express server
│   ├── db/
│   │   ├── database.js     # SQLite connection
│   │   ├── schema.js       # DB schema & seed
│   │   └── queries.js      # Prepared statements
│   ├── routes/
│   │   ├── appointments.js # CRUD + WhatsApp
│   │   ├── patients.js     # Patient management
│   │   ├── calendar.js     # Google Calendar OAuth + sync
│   │   ├── templates.js    # Message templates
│   │   └── intake.js       # Patient self-registration
│   └── services/
│       ├── googleCalendar.js  # Google Calendar API
│       ├── greenApi.js        # WhatsApp via Green API
│       └── scheduler.js       # node-cron daily reminders
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx      # לוח בקרה
│       │   ├── CalendarPage.jsx   # יומן שבועי
│       │   ├── AppointmentsPage.jsx
│       │   ├── PatientsPage.jsx
│       │   ├── TemplatesPage.jsx  # עריכת תבניות
│       │   └── IntakePage.jsx     # טופס מטופלת (/intake)
│       └── components/
│           ├── AppointmentForm.jsx  # הוספת תור
│           └── AppointmentPanel.jsx # פאנל פרטי תור
└── data/
    └── clinic.db           # SQLite database (created automatically)
```

## חיבור Google Calendar

1. צור פרויקט ב-[Google Cloud Console](https://console.cloud.google.com)
2. הפעל Google Calendar API
3. צור OAuth 2.0 credentials (Web application)
4. הוסף `http://localhost:3000/api/calendar/oauth/callback` כ-Authorized redirect URI
5. עדכן `.env` עם `GOOGLE_CLIENT_ID` ו-`GOOGLE_CLIENT_SECRET`
6. לחץ על "Google Calendar" בסרגל הצד להתחברות

## Green API (WhatsApp)

1. הירשם ב-[green-api.com](https://green-api.com)
2. צור instance
3. עדכן `.env` עם `GREEN_API_INSTANCE_ID` ו-`GREEN_API_TOKEN`

## טופס מטופלת עצמאי

נגיש בכתובת: `http://your-domain/intake`

## תזכורות אוטומטיות

מופעלות כל בוקר בשעה 08:00 (שעון ישראל):
- תזכורת 4 ימים לפני
- תזכורת יומיים לפני
