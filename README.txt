BUS TICKET SYSTEM — QUICK START

Files:
- public/index.html, style.css, script.js: conductor site
- public/admin.html, admin.css, admin.js: admin site
- server.js: backend API and static hosting
- package.json: dependency setup

Run in Termux:
1. Extract this ZIP into a folder.
2. cd into the extracted bus_ticket_system folder.
3. npm install
4. npm start
5. Open http://127.0.0.1:3000 for the conductor site.
6. Open http://127.0.0.1:3000/admin.html for the admin site.

Demo accounts:
Admin: admin / admin123
Conductor: conductor / bus123

Important:
This is a local prototype. It stores data in data.json and uses simple demo credentials.
Change demo passwords and add proper sessions/password hashing, access controls, backups,
and deployment security before using it with real money or real passenger data.
A ticket is created as UNPAID. The conductor physically receives cash, then taps
"Mark cash paid". The dashboard counts only PAID tickets as recorded cash.
