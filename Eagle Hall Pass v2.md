# 🎓 **Hall Pass System — Architecture Spec (v2)**

> *Updated for Engineering Handoff — June 2025*
> *Developer Confidence: 100%+ — Ready for Production Build*

---

## 🏛️ **Core Purpose**

A system to manage, track, and log **student hallway passes**:
✅ **Digital-first**
✅ **Responsibility-aware**
✅ **Policy-aligned**
✅ **Highly usable by students, staff, admin**
✅ **Backed by immutable pass log**

---

## 🎁 **Core Objects**

| Object                     | Description                                         |
| -------------------------- | --------------------------------------------------- |
| Pass                       | A digital ticket for hallway movement               |
| Pass State                 | OPEN or CLOSED                                      |
| Student Status             | OUT (hallway) or IN (location)                      |
| Leg ID                     | Numeric counter for movements inside a pass         |
| Pass Log                   | Immutable record of pass lifecycle + actions        |
| Transfer of Responsibility | Defines who is responsible for student              |
| Destination ID             | Destination for the pass (room or shared area)      |
| Room ID                    | Static identifier for rooms/locations               |
| Descriptor ID              | Human-friendly name for a location                  |
| Groups                     | Separate sheet of dynamic groups for students/staff |

---

## ⚙️ **Core Logic**

1️⃣ **Default State**

* Student is in **scheduled class**
* Scheduled teacher is responsible
* No active pass → no tracking

2️⃣ **Pass Initiation**

* Starts from scheduled class, *unless override* by teacher/admin/support
* Pass always starts as **OPEN**
* Student status becomes **OUT**
* MVP: **instant passes only** (future: support scheduled)

3️⃣ **Pass Lifecycle**

* Movement logged as **Legs** of Pass ID
* Each Leg ID increment = new log event
* Pass closes when:
  * Student returns to class
  * Period auto-close
  * Admin/teacher manual close
  * Emergency override

4️⃣ **Responsibility Chain**

* OUT → no staff responsible (student self-responsible)
* IN → staff/location assumes responsibility
* Restroom → *always OUT* (no IN allowed, no location transfer)

5️⃣ **Emergency Handling**

* Emergency locks all new passes
* Freezes existing ones (emergency close)
* Surfaces students who are OUT and who is IN where

---

## 📄 **Data Sheets**

### 1️⃣ **Student Data Sheet**

| Field                | Notes                        |
| -------------------- | ---------------------------- |
| studentID            | Unique identifier            |
| studentEmail         | First.last\@domain           |
| firstName            | Derived from email           |
| lastName             | Derived from email           |
| gradeLevel           | Grade level                  |
| p1A - p4B (schedule) | Scheduled classes            |
| groups               | Group keys (comma-separated) |

---

### 2️⃣ **Teacher Data Sheet**

| Field                                 | Notes                        |
| ------------------------------------- | ---------------------------- |
| staffID                               | Unique staff identifier      |
| staffEmail                            | First.last\@domain           |
| firstName                             | Derived from email           |
| lastName                              | Derived from email           |
| department                            | e.g. Math, Science           |
| primaryRoom (roomID)                  | Room they are located        |
| autonomy_studentRequestsAllowed       | Toggle                       |
| autonomy_teacherRequestsAllowed       | Toggle                       |
| autonomy_destinationRequestsAllowed   | Toggle                       |
| groups                                | Group keys (comma-separated) |

---

### 3️⃣ **Support Data Sheet** (mirrors Teacher)

Same fields as **Teacher**, plus:

| Field          | Notes                                    |
| -------------- | ---------------------------------------- |
| periodOverride | TRUE/FALSE - keeps passes open during period changes |

Used for:
* Guidance
* Media Center
* Front Office
* Nurse
* etc.

---

### 4️⃣ **Admin Data Sheet**

| Field                | Notes                               |
| -------------------- | ----------------------------------- |
| staffID              | Unique                              |
| staffEmail           | First.last\@domain                  |
| firstName            | Derived                             |
| lastName             | Derived                             |
| department           | e.g. Principal, Assistant Principal |
| primaryRoom (roomID) | Office/desk location                |

---

### 5️⃣ **Location Data Sheet**

| Field         | Notes                              |
| ------------- | ---------------------------------- |
| roomID        | Fixed location ID                  |
| descriptorID  | Friendly name (Band Room, Library) |
| capacityLimit | Optional — max students            |

---

### 6️⃣ **Groups Data Sheet**

| Field             | Notes                                              |
| ----------------- | -------------------------------------------------- |
| groupID           | Unique group key                                   |
| groupName         | Human-friendly name                                |
| groupOwnerStaffID | Which staff owns the group (admin/teacher/support) |
| groupType         | e.g. Athletics, Band, Club, Admin use              |
| studentIDs        | Comma-separated studentIDs in group                |

---

### 7️⃣ **Bell Schedule Data Sheet**

| Field     | Notes                    |
| --------- | ------------------------ |
| period    | p1A, p1B, p2A, etc.      |
| startTime | HH:MM format             |
| endTime   | HH:MM format             |
| dayType   | A or B (block schedule)  |

---

### 8️⃣ **Settings Data Sheet**

| Field        | Notes                           |
| ------------ | ------------------------------- |
| settingKey   | Unique setting identifier       |
| settingValue | Current value                   |
| description  | Human-readable description      |

**Key Settings:**
- emergencyMode (TRUE/FALSE)
- dayType (A/B)
- devMode (TRUE/FALSE)
- devUserEmail (developer override)
- longDurationThreshold (minutes)
- autoRefreshInterval (seconds)
- systemTimezone (America/New_York)

---

## 🗂️ **Pass Log Fields**

| Field         | Notes                                          |
| ------------- | ---------------------------------------------- |
| timestamp     | ISO8601 timestamp                              |
| passID        | Unique identifier for pass                     |
| legID         | Incrementing leg counter                       |
| studentID     | Student identifier                             |
| state         | OPEN / CLOSED                                  |
| status        | OUT / IN                                       |
| staffID       | Staff responsible at this moment               |
| destinationID | Destination descriptorID (restroom = OUT loop) |
| flag          | e.g. LD, autoClose, emergencyClose            |
| notes         | Optional                                       |

---

## 📋 **Permanent Record Log Fields**

| Field            | Notes                                    |
| ---------------- | ---------------------------------------- |
| passID           | Unique pass identifier                   |
| studentID        | Student identifier                       |
| startTime        | Pass creation timestamp                  |
| endTime          | Pass closure timestamp                   |
| totalDuration    | Minutes from start to end                |
| originStaffID    | Staff who initiated pass                 |
| finalDestination | Last destination before closure          |
| legCount         | Total number of legs in pass             |
| flags            | Comma-separated flags (LD, autoClose)    |
| summary          | Human-readable pass summary              |

---

## 🚦 **Behavior & Rules**

| Scenario                     | Behavior                                             |
| ---------------------------- | ---------------------------------------------------- |
| Student goes to restroom     | Pass is OUT, no IN, must return to origin            |
| Teacher/admin initiates pass | Origin state becomes that staff, not scheduled class |
| Student requests pass        | Subject to teacher autonomy settings                 |
| Emergency lock               | Freezes pass activity system-wide                    |
| Period ends                  | Auto-close passes based on staff type               |
| Long duration (LD)           | Flag pass when OUT exceeds threshold (configurable)  |
| Multiple passes              | **IMPOSSIBLE** - only one pass per student at a time |
| Pass state changes           | Student cannot change destinations mid-pass          |

---

## 🔄 **Pass State Logic (CONFIRMED)**

**Default State:** Student in scheduled class → Teacher responsible

**Pass Creation:** 
- Default: Scheduled class → OUT to DestinationID (Leg 1)
- Override: Teacher/Admin/Support can initiate from their location

**Pass Flow:**
1. **OUT to Destination** (student responsible, destID staff notified)
2. **IN to Destination OR Scheduled Class**
   - If Scheduled Class → Pass CLOSED
   - If Destination → Pass remains OPEN, Leg increments
3. **Restroom Exception:** If destIN = Restroom → only option is return to previous destIN
4. **No Mid-Pass Changes:** Student cannot change destinations while OUT

**Pass Closure:**
- Return to scheduled class
- Period auto-close (based on staff type)
- Manual close by staff
- Emergency close

---

## 🔍 **Responsibility Resolution**

| State         | Responsible                                                              |
| ------------- | ------------------------------------------------------------------------ |
| OUT           | Student self-responsible                                                 |
| IN (location) | Staff or staff group owning the location                                 |
| Restroom      | Student remains self-responsible (OUT)                                   |
| Emergency     | Staff who pulls student into location marks responsibility via interface |

---

## 🔑 **Authentication**

* **Google OAuth**
* Single Sign On using Google Workspace accounts
* Determines role based on which sheet (Student, Teacher, Support, Admin) user appears in

---

## 🏗️ **Technical Architecture (CONFIRMED)**

### **Platform:** Google Apps Script + Google Sheets
- **Web App:** doGet/doPost architecture
- **Database:** Google Sheets (single file, multiple tabs)
- **Auth:** Google OAuth via Apps Script
- **Notifications:** Gmail API (HTML formatted)
- **Caching:** PropertiesService for performance
- **Timezone:** US Eastern (EDT/EST)

### **Performance Strategy:**
- **Data Caching:** Student/Teacher/Support sheets cached, refreshed on triggers
- **Dashboard Refresh:** 3-minute intervals for teacher dashboards
- **API Optimization:** Batch operations, minimal sheet reads
- **Concurrent Users:** Optimized for 150 staff + 2,500 students (300-900 daily passes)

### **Error Handling:**
- Comprehensive logging at critical functions
- Graceful degradation when Sheets API unavailable
- Fallback to physical passes during system downtime

---

## 🎛️ **System Management**

### **Admin Menu Functions:**
- 🚀 Setup System (one-time initialization)
- 🔧 Developer Mode (ON/OFF)
- 🚨 Emergency Mode (Admin + Dev only)
- 📊 Test Pass Creation
- 🧹 Clear Pass Logs
- 📋 System Status
- 💾 Backup Data
- 🔄 Reset System

### **Emergency Procedures:**
- **Trigger:** Admin UI button only
- **Behavior:** Freeze all pass creation, notify all staff + students with active passes
- **UI:** Show all OUT students to all teachers for emergency accountability

### **Period Management:**
- **Auto-Detection:** Current period based on bell schedule + system time
- **Auto-Close Logic:**
  - All OUT passes → CLOSED
  - Teacher/Admin IN passes → CLOSED
  - Support IN passes → Based on periodOverride setting

---

## 📱 **User Experience**

### **Mobile-First Design:**
- 90% usage expected on phone screens
- Responsive web app interface
- Intuitive wait states with clear user feedback
- Immediate screen transitions (no "pass created" refresh delays)

### **Dashboard Requirements:**
- **Students:** Current status only, immediate screen changes
- **Teachers:** All their students' current status (OUT/IN/en route)
- **Support/Admin:** Enhanced visibility based on role

### **Notification Preferences:**
- **All ON/All OFF** toggle per staff member
- **HTML Email** notifications for pass actions
- **Emergency Notifications** to all staff + active pass holders

---

## 🔧 **Developer Features**

### **DEV Mode:**
- Role override capability
- Enhanced logging and testing
- Access to all UI interfaces
- System debugging tools

### **Data Management:**
- **Pass Log:** Immutable, append-only
- **Permanent Record:** Generated after pass closure
- **Backup/Archive:** Manual admin functions
- **Data Export:** JSON format for future Firebase migration

---

## 📈 **Scaling Roadmap**

### **Phase 1:** Google Apps Script (Current - 6 months)
- Single school pilot (High School)
- Rapid iteration and requirements refinement
- Zero infrastructure costs

### **Phase 2:** Firebase Migration (6+ months)
- Multi-school support (ES/MS/HS)
- Real-time capabilities
- Enhanced reporting

### **Phase 3:** Enterprise Platform
- Statewide/Regional/National scale
- SIS integrations
- Advanced analytics

---

## ❓ **Resolved Questions**

✅ **Concurrent Users:** 150 staff dashboards + 300-900 daily passes  
✅ **Pass Logic:** Single pass per student, leg-based movement, no mid-pass destination changes  
✅ **Google Sheets:** Single file, multiple tabs, trigger-based caching  
✅ **Emergency Mode:** Admin-only trigger, freeze system, notify all  
✅ **Schedule Integration:** Bell schedule sheet, auto-detect current period  
✅ **Substitute Teachers:** Responsibility stays with original teacher (MVP)  
✅ **Period Override:** Column in Support sheet for keeping passes open  
✅ **Notifications:** Gmail API, HTML format, all-on/all-off per user  
✅ **Developer Access:** DEV mode with role override and enhanced tools  

---

## 🔑 **Key Engineering Notes**

✅ **Google Apps Script as primary platform**  
✅ **Single Google Sheet file with 10 tabs**  
✅ **Pass Log is immutable — append-only**  
✅ **Leg ID drives true history of pass**  
✅ **Autonomy toggles fully enforced**  
✅ **Restroom OUT-only loop strictly enforced**  
✅ **Emergency handling pauses all activity and notifies**  
✅ **Mobile-first responsive design**  
✅ **3-minute dashboard refresh for performance**  
✅ **PropertiesService caching for data sheets**  
✅ **Comprehensive error logging and testing**  
✅ **Admin menu for system management**  
✅ **DEV mode for developer access and testing**  

---

# ✅ **Ready for Build — 100% Confidence**

### **Confirmed Development Flow:**

1️⃣ ✅ **Google Sheets structure setup** (COMPLETE)  
2️⃣ **Build core pass state engine**  
3️⃣ **Implement pass lifecycle & pass log**  
4️⃣ **Build web app framework (doGet/doPost)**  
5️⃣ **Implement Google OAuth auth & role resolution**  
6️⃣ **Build UIs (Student, Teacher, Support, Admin)**  
7️⃣ **Emergency handling & notifications**  
8️⃣ **Dashboard refresh & caching optimization**  
9️⃣ **Testing & QA with comprehensive logging**  

---

**Summary:**
This system is a **lean, mean, reporting machine** that:
✅ Supports *real-world school workflows*  
✅ Provides *transparent and immutable data*  
✅ *Aligns with staff responsibility model*  
✅ Respects *teacher autonomy and admin override*  
✅ Handles *Google Sheets performance limitations*  
✅
