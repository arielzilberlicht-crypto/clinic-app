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

## Clinic Automation Hub (שלב 0 - תצוגת מנהל)

בנוסף למערכת ניהול המטופלות שמתוארת למעלה, הריפו כולל גם את ה-Clinic Automation
Hub: לוח בקרה נפרד בכתובת `/hub`, המיועד לד"ר זילברליכט ולמזכירות. הלוח **לא**
משנה שום התנהגות קלינית או אוטומטית - בשלב 0 הוא רק קורא ומציג נתונים
שהאוטומציות ב-Make כבר כותבות לגיליון Google Sheets "Clinic Automation Hub -
Dr Ariel Zilberlicht" (וכן לגיליון הלידים הנפרד). הוא לא שולח הודעות וואטסאפ,
לא עורך רשומות מטופלות ולא יוצר או מוחק תיקיות ב-Drive.

מסכי שלב 0: סקירה כללית (הזמנות, ביטולים, אחוז ביטולים, עם סינון לפי חודש /
קופת חולים / מרפאה / מקור), דורש טיפול (במקום חלק מהתראות הוואטסאפ שהרופא
מקבל היום), היום (תורים לפי מרפאה), לידים (עם התאמה לפי טלפון לתורים שנקבעו),
וכרטיס מטופלת לקריאה בלבד עם הסתרת תעודת זהות (מוצגות רק 3 הספרות האחרונות,
וחשיפה מלאה זמינה לרופא בלבד ותמיד נרשמת ביומן ביקורת).

### הגדרת הסביבה

כל הערכים הבאים נשמרים במשתני סביבה בלבד (`backend/.env`, `frontend/.env`) -
אף מפתח, סוד או כתובת אימייל לא נשמרים בקוד או ב-git.

**1. חשבון שירות של Google (Service Account) לקריאה בלבד**

1. ב-[Google Cloud Console](https://console.cloud.google.com) פתחו פרויקט
   (ניתן להשתמש באותו פרויקט של Google Calendar אם קיים), והפעילו את
   Google Sheets API.
2. צרו Service Account חדש (IAM & Admin → Service Accounts), וצרו לו מפתח
   JSON (Keys → Add Key → JSON).
3. מתוך קובץ ה-JSON קחו את `client_email` ואת `private_key` והציבו אותם ב-
   `HUB_GOOGLE_SERVICE_ACCOUNT_EMAIL` וב-`HUB_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
   (את מפני השורות `\n` בתוך המפתח אין צורך להחליף ידנית, הקוד עושה זאת
   אוטומטית).
4. בגיליון עצמו (Clinic Automation Hub, וגם בגיליון הלידים אם הוא נפרד) לחצו
   "שתף" והוסיפו את כתובת האימייל של ה-Service Account כ-**צופה (Viewer)**
   בלבד. אין לתת לחשבון השירות הרשאת עריכה, ואין לתת לו הרשאת Drive רחבה -
   רק שיתוף ישיר של הגיליון/ות הרלוונטיים.
5. מלאו את `HUB_SPREADSHEET_ID` (מזהה הגיליון הראשי, מהכתובת שלו ב-דפדפן)
   ואת `HUB_LEADS_SPREADSHEET_ID` (אם גיליון הלידים נפרד).

**2. כניסה עם Google (Google Sign-In)**

1. באותו פרויקט ב-Google Cloud Console, תחת APIs & Services → Credentials,
   צרו OAuth 2.0 Client ID מסוג "Web application".
2. הוסיפו את הכתובות שמהן ייעשה שימוש בלוח הבקרה תחת Authorized JavaScript
   origins (לדוגמה `http://localhost:5173` לפיתוח, וכתובת ה-HTTPS הציבורית
   בפרודקשן). אין צורך ב-redirect URI, שיטת ההתחברות מבוססת token מהצד של
   הדפדפן שמאומת מול השרת.
3. את ה-Client ID הציבו גם ב-`backend/.env` (`HUB_GOOGLE_OAUTH_CLIENT_ID`)
   וגם ב-`frontend/.env` (`VITE_HUB_GOOGLE_OAUTH_CLIENT_ID`) - זהו אותו ערך
   בשני הקבצים. אין שימוש ב-Client Secret בזרימה הזו.

**3. רשימת המורשים (Allow-list) ותפקידים**

ב-`HUB_ALLOWED_USERS` (ב-`backend/.env`) יש להגדיר מערך JSON, לדוגמה:

```
HUB_ALLOWED_USERS=[{"email":"doctor.zilberlicht@gmail.com","role":"DOCTOR"},{"email":"secretary@example.com","role":"SECRETARY"}]
```

רק כתובות אימייל שמופיעות ברשימה יכולות להתחבר. תפקיד `DOCTOR` רואה הכל
כולל חשיפת תעודות זהות; תפקיד `SECRETARY` רואה תורים, לידים וכרטיס מטופלת
מוגבל (ללא כפתור חשיפת תעודת זהות).

**4. סוד החתימה על session**

```
HUB_SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
```

**5. שמות הלשוניות**

ברירת המחדל תואמת למסמך המסירה (`Appointments`, `Bot_State`, `Communications`,
`Patients`, `Alerts`, וללשונית הלידים `קליטת ליד`). ניתן לשנות דרך משתני
`HUB_TAB_*` אם שם לשונית משתנה בפועל, בלי לגעת בקוד.

**חשוב:** שמות העמודות בגיליונות אינם מיוצגים בקוד לפי מיקום עמודה, אלא לפי
שם הכותרת בפועל (ראו `backend/hub/sheetColumns.js`). אם שמות הכותרות
בגיליון האמיתי שונים מהמפורט שם, יש לעדכן את קובץ ה-aliases הזה בלבד - לא
לשנות את מבנה הגיליון עצמו בלי לתאם עם הרופא (ראו "הסכם עבודה" למטה).

### רוטציית פרטי גישה (credential rotation)

- **מפתח Service Account**: ב-Google Cloud Console צרו מפתח JSON חדש לאותו
  Service Account, עדכנו את `HUB_GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` בסביבת
  הייצור, ורק אחרי שהשרת עלה בהצלחה עם המפתח החדש - מחקו את המפתח הישן
  מהקונסולה.
- **OAuth Client ID**: אם יש חשד לדליפה, אפשר ליצור Client ID חדש ולעדכן את
  שני משתני הסביבה (backend ו-frontend) יחד. שינוי כזה מחייב גם עדכון
  Authorized JavaScript origins ב-Client החדש.
- **HUB_SESSION_SECRET**: החלפה מנתקת מיידית את כל המשתמשים המחוברים (כל
  קוקי session קיים הופך לא תקף). מומלץ להחליף בכל חשד לדליפה, ובכל מקרה
  מעת לעת כחלק ממדיניות אבטחה.
- **HUB_ALLOWED_USERS**: הסרת אימייל מהרשימה חוסמת כניסה חדשה מיידית, אך אינה
  מנתקת session פעיל קיים לפני שפג תוקפו (עד 12 שעות) - לניתוק מיידי יש
  להחליף גם את `HUB_SESSION_SECRET`.

### יומן ביקורת (Audit log) וגיבויים

כל כניסה, כל כניסה שנדחתה, כל התנתקות וכל חשיפת תעודת זהות נרשמים בטבלה
`hub_audit_log` באותו קובץ SQLite המקומי (`data/clinic.db`) שמשמש את שאר
המערכת. מקור האמת לנתונים הקליניים עצמם הוא גיליון ה-Google Sheets (ל-Google
Sheets יש היסטוריית גרסאות מובנית משלו דרך "היסטוריית גרסאות" בתפריט הקובץ),
והלוח עצמו רק שומר עותק זמני בזיכרון לכמה דקות (`HUB_CACHE_TTL_SECONDS`).
מכיוון שמדובר במידע רפואי, יש לוודא ש-`data/clinic.db` (כולל טבלת יומן
הביקורת) נכלל בתהליך הגיבוי השוטף שהמרפאה כבר מפעילה למחשב/לשרת, ושתקופת
השמירה של יומן הביקורת תואמת להנחיה שתתקבל מיועץ משפטי/רגולטורי של המרפאה
לגבי משך שמירת רשומות גישה למידע רפואי לפי הדין הישראלי - מסמך זה אינו קובע
משך שמירה ספציפי מיוזמתו.

### הצעת מבנה ללשונית Alerts (טרם אושרה, טרם קיימת)

לפי הסכם העבודה (Make לא משנה מבנה גיליון בלי אישור מראש בכתב מהרופא), לוח
הבקרה **לא יוצר ולא מניח קיום** של לשונית `Alerts` - מסך "דורש טיפול" מציג
כרגע רק את ההתראה שניתן לחשב ישירות מלשונית Appointments (המתנה לתעודת זהות
מעל 3 שעות), ומזהה אוטומטית אם לשונית Alerts כבר קיימת. שאר סוגי ההתראות
(ביטול שלא נמצא, הודעת שידורית לא מזוהה, כשל בהרצת Make) דורשים שהלשונית הזו
תיכתב על ידי Make. זו הצעת מבנה בלבד להעברה לרופא לאישור לפני שמתחילים לכתוב
אליה:

| עמודה | ערכים אפשריים |
|---|---|
| timestamp | זמן ISO של יצירת ההתראה |
| type | `ID_MISSING_3H`, `CANCEL_NOT_FOUND`, `UNRECOGNIZED_SHIDURIT`, `EXECUTION_FAILED`, `LEAD_NEW` |
| patient id or phone | מזהה מטופלת או מספר טלפון |
| text | תיאור חופשי של ההתראה |
| status | `OPEN`, `HANDLED` |
| handled by | מי טיפל (שלב 1 - סימון "טופל" עדיין לא קיים בשלב 0) |
| handled at | מתי טופל |

### הרשאות ותפקידים

- **DOCTOR**: גישה מלאה לכל מסכי הלוח, כולל חשיפת תעודת זהות בכרטיס מטופלת.
- **SECRETARY**: תורים, לידים וכרטיס מטופלת מוגבל (ללא חשיפת תעודת זהות).

הכניסה מוגבלת אך ורק לכתובות אימייל שמופיעות ב-`HUB_ALLOWED_USERS`; כל ניסיון
כניסה עם אימייל שלא ברשימה נרשם ביומן הביקורת ונחסם.
