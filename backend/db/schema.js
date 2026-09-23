const db = require('./database');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      first_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      id_number TEXT,
      hmo TEXT,
      email TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER,
      full_name TEXT NOT NULL,
      first_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      start_datetime TEXT NOT NULL,
      end_datetime TEXT,
      calendar_event_id TEXT UNIQUE,
      status TEXT DEFAULT 'active',
      confirmation_sent INTEGER DEFAULT 0,
      reminder_4days_sent INTEGER DEFAULT 0,
      reminder_2days_sent INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS message_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feedback_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      selected_date TEXT NOT NULL,
      medreviews_count INTEGER NOT NULL DEFAULT 0,
      google_haifa_count INTEGER NOT NULL DEFAULT 0,
      google_tlv_count INTEGER NOT NULL DEFAULT 0,
      test_mode INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
    CREATE INDEX IF NOT EXISTS idx_appointments_calendar_id ON appointments(calendar_event_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
  `);

  // Test mode defaults to ON; turning it off is a deliberate, explicit action from the UI.
  db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('feedback_test_mode', 'true')`).run();

  // Seed default message templates
  const templates = [
    {
      name: 'confirmation',
      content: `{{שם פרטי}},\nנקבע לך תור לתאריך: {{תאריך הפגישה}}\nבמרפאתו של ד"ר אריאל זילברליכט,\nמומחה ברפואת נשים, כירורגיה גינקולוגית, אורוגינקולוגיה.`
    },
    {
      name: 'reminder_4days',
      content: `👋 {{שם פרטי}} שלום,\nזוהי תזכורת לתור שנקבע עבורך במרפאתו של ד"ר אריאל זילברליכט, \nמומחה ברפואת נשים, כירורגיה גינקולוגית, אורוגינקולוגיה.\n📅 הפגישה תתקיים בתאריך: {{תאריך הפגישה}}\n🕒 בשעה: {{שעת הפגישה}}\n📍 המרפאה ממוקמת בגרנד קניון בחיפה בקומה מינוס 4.\n⚠️ בכל מקרה של שינוי / ביטול - נא ליידע את צוות המרפאה בטלפון 048221148\n🌿 בברכת בריאות איתה,\nד"ר אריאל`
    },
    {
      name: 'reminder_2days',
      content: `👋 שלום {{שם פרטי}},\nכאן ד"ר אריאל זילברליכט, מומחה ברפואת נשים, כירורגיה גינקולוגית, אורוגינקולוגיה.\n📅 רציתי להזכיר לך כי אנו נפגשים ({{תאריך הפגישה}}) לפגישת ייעוץ במרפאתי.\n📞 אנו ניצור עימך קשר לווידוא הגעה וקבלת הנחיות הגעה למרפאה.\n🌿 בברכת בריאות איתה,\nד"ר אריאל`
    },
    {
      name: 'cancellation_doctor',
      content: `התראה: נמחק אירוע מהיומן\nנא לוודא שהאירוע הועבר לסטטוס cancelled במערכת.`
    }
  ];

  const insertTemplate = db.prepare(`
    INSERT OR IGNORE INTO message_templates (name, content) VALUES (?, ?)
  `);

  for (const t of templates) {
    insertTemplate.run(t.name, t.content);
  }
}

module.exports = { initSchema };
