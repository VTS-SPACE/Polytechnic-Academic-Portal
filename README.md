# Polytechnic Academic Portal

## Summer Training 2026

A practical web project created by a **2nd Year Information Technology Polytechnic student** during Summer Training 2026 under the guidance of:

**VTS SPACE**  
Rasulabad, Kanpur Dehat - 209306

---

## Project Overview

The **Polytechnic Sessional, Practical & Attendance Management System** is a browser-based academic record application for managing student internal assessment details.

It helps a department maintain:

- Student identity and enrollment information
- Theory marks out of 50
- Practical or sessional marks out of 50
- Lecture attendance records
- Overall percentage and division
- Backlog and short-attendance warnings
- Printable student marksheets

The project is designed to be simple enough for daily college use while demonstrating practical front-end development skills.

## Main Features

### Student Records

- Add student full name
- Store unique enrollment or roll number
- Select branch:
  - Computer Science
  - IT
  - Electrical
  - Mechanical
  - Civil
- Select semester:
  - 3rd Sem
  - 4th Sem
  - 5th Sem
  - 6th Sem

### Dynamic Subject Entry

- Starts with three subject rows
- Add more subjects when required
- Remove unwanted subject rows
- Enter subject name
- Enter theory marks out of 50
- Enter practical or sessional marks out of 50
- Record attendance as lectures attended and lectures held
- Display maximum marks separately from obtained marks in a BTEUP-style layout

### Automatic Calculations

For every saved student, the application calculates:

```text
Subject Total = Theory Marks + Practical Marks
Total Maximum Marks = Number of Subjects x 100
Percentage = (Total Marks / Total Maximum Marks) x 100
Attendance = (Total Lectures Attended / Total Lectures Held) x 100
```

The result is calculated using these rules:

| Percentage / Condition | Result |
| --- | --- |
| 60% or above | 1st Division |
| 45% to 59.9% | 2nd Division |
| 33% to 44.9% | 3rd Division |
| Below 33% | Backlog / Fail |
| Any subject total below 33 | Backlog / Fail |
| Overall attendance below 75% | Short Attendance warning |

### Record Management

- Save records in browser LocalStorage
- Storage key: `polytechnic_records`
- Load saved records automatically after refresh
- Prevent duplicate enrollment numbers
- Search instantly by student name or roll number
- Delete records with confirmation
- Show summary cards for total students, average percentage, attendance clearance, and backlog cases

### Printable Marksheet

Each saved record includes a **View Marksheet** action with:

- Polytechnic department heading
- Student details
- Subject-wise theory and practical marks
- Theory and practical maximum marks
- Obtained marks and subject total
- Overall percentage
- Attendance percentage
- Final result
- Signature spaces for class teacher and head of department
- Print / Save as PDF support using the browser print dialog

## Technology Used

- HTML5
- CSS3
- Vanilla JavaScript ES6+
- LocalStorage API
- Browser Print API

No external framework, library, CDN, or backend server is required.

## Project Structure

```text
Polytechnic-Academic-Portal/
|
|-- index.html       Semantic page structure and form controls
|-- style.css        Responsive layout, themes, components, and print styles
|-- script.js        Validation, calculations, LocalStorage, search, CRUD, and marksheet logic
|-- icon.png         Website icon / favicon
|-- README.md        Project documentation
```

## How to Run

1. Download or clone this project folder.
2. Open the folder in VS Code or another code editor.
3. Open `index.html` in a modern web browser.
4. Add student information and subject details.
5. Save the record.
6. Use the record table to search, view, print, or delete records.

A local server is optional because the project uses only front-end files. Opening `index.html` directly is sufficient for normal use.

## Validation Included

The form checks that:

- Required student fields are completed
- Full name has a meaningful length
- Enrollment number uses valid characters
- Enrollment number is unique
- Subject names are not empty
- Theory marks stay between 0 and 50
- Practical marks stay between 0 and 50
- Lectures attended are not negative
- Lectures held are greater than zero
- Lectures attended do not exceed lectures held

## Learning Outcomes

This project demonstrates practical understanding of:

- Semantic HTML structure
- Responsive CSS Grid and Flexbox layouts
- Vanilla JavaScript event handling
- Dynamic form row creation and removal
- Client-side validation
- JavaScript array and object processing
- LocalStorage JSON serialization
- Search and CRUD operations
- Calculated academic results
- Browser print styling
- Accessible labels, buttons, dialogs, and live feedback

## Limitations

This is a front-end academic project intended for local use and demonstration. It does not include:

- User login or role management
- Shared multi-user database
- Server-side validation
- Cloud backup
- Network-based synchronization

These features could be added later with a backend API and database.

## Project Context

**Project:** Polytechnic Sessional, Practical & Attendance Management System  
**Course:** Diploma in Information Technology  
**Year:** 2nd Year  
**Training:** Summer Training 2026  
**Guided by:** VTS SPACE, Rasulabad, Kanpur Dehat - 209306

---

> Built as an academic learning project with a focus on practical college record management, clean interface design, and core web development fundamentals.
#
