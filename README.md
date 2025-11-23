# RathausFeed

Built at **HackaTUM 2025** for the **City of Munich / IT-Referat** challenge.

**We translate City Hall's Amtsdeutsch into a digital participatory noticeboard for the average citizen.**

The Rathaus publishes numerous official announcements specifying regulatory proceedings, including:

- Rats­Informations­System (RIS), which includes meeting schedules, agendas, proposals, voting results, official council decisions, etc.
- Amtsblatt, the official gazette announcing new regulations, bylaws, statutes, etc.
- The “Rathaus Umschau”, a weekly bulletin with summaries of council decisions, press releases from departments, etc.
- Meeting transcripts and minutes from city council sessions.

❗️ But these documents are often written in **complex legalese** and PDFs buried in government sites. We sense there is an important lack of de facto transparency and participation in local governance, and we want to change that.

## Our Solution

We built a full-stack application that ingests official documents from the Rathaus, uses AI to translate them into plain language summaries, and presents them in a user-friendly interface where citizens can easily browse, search, and discuss local government activities.

- 🧾 **Summarised updates** on what the city is planning, deciding, or debating
- 🏷️ **Tags & filters** (e.g. “mobility”, “housing”, “climate”, “kids & youth”) to find what actually matters to them
- 💬 **Discussion threads** to voice opinions, ask questions, and engage with fellow citizens
- 📚  A **children’s view** for use in schools and educational settings
- 🗳️ To-do: pointers to **participation options** (petitions, consultations, surveys, events) whenever there’s a way to get involved  

<img src="https://i.imgur.com/pUt66Ax.png" alt="RathausFeed Screenshot" width="600"/>




## Set-up
Setup overview for the backend (Node/TypeScript), frontend (React), and AI helper (Python).

### Backend
- Requires npm/Node 22 (example with nvm on Ubuntu):
  ```sh
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  nvm install 22
  nvm use 22
  nvm alias default 22
  ```
- Install and run (from repo root):
  ```sh
  cd Backend
  npm install
  npm run dev
  ```

### Frontend
- Install and start:
  ```sh
  cd Frontend/rathaus-feed
  npm install
  npm start
  ```

### AI
- Prerequisites: not existing rn.
- Install requirements:
  ```sh
  cd ai_service
  pip install -e .
  ```
