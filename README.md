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
│   │   ├── intake.js       # Patient self-registration
│   │   └── feedback.js     # מסך שליחת משובים - קריאה ל-Make
│   └── services/
│       ├── googleCalendar.js  # Google Calendar API
│       ├── greenApi.js        # WhatsApp via Green API
│       ├── scheduler.js       # node-cron daily reminders
│       ├── make.js            # קריאות ל-Make scenarios (משובים)
│       └── feedbackLogic.js   # לוגיקה טהורה של מסך המשובים (נבדקת ב-feedbackLogic.test.js)
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx      # לוח בקרה
│       │   ├── CalendarPage.jsx   # יומן שבועי
│       │   ├── AppointmentsPage.jsx
│       │   ├── PatientsPage.jsx
│       │   ├── TemplatesPage.jsx  # עריכת תבניות
│       │   ├── FeedbackPage.jsx   # שליחת משובים (MedReviews + ביקורות גוגל)
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

## שליחת משובים (`/feedback`)

מסך בסוף יום מרפאה: בוחרים תאריך, טוענים את רשימת המטופלות מהיומן (דרך תרחיש Make קיים), ומסמנים
לכל מטופלת אילו הודעות לשלוח (MedReviews / ביקורת גוגל חיפה / ביקורת גוגל תל אביב). כל הלוגיקה
(שליפת יומן, שליחת WhatsApp) חיה ב-Make; הדשבורד רק מציג, אוסף סימונים ומפעיל.

1. עדכנו `MAKE_API_TOKEN` ב-`.env` (הרשאות מינימליות, מוגבל לצוות 787831 אם אפשר)
2. כל עוד `FEEDBACK_SEND_SCENARIO_ID` ריק, כפתור "שלח" עובד מול mock מקומי (תרחיש השליחה טרם נבנה ב-Make)
3. **מצב בדיקה** פעיל כברירת מחדל - כל ההודעות נשלחות למספר בדיקה בלבד; כיבוי דורש אישור מפורש במסך
