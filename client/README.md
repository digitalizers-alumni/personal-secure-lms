# LuminaSwiss Frontend

Frontend for the LuminaSwiss prototype — user interface and local anonymizer.

## Features

**Interface**
- Login and protected routes
- Dashboard navigation
- Documents, AI Prompt, Course creation and view
- Quiz and reward flow
- Admin user management
- Multi-language UI

**Local Anonymizer** -> runs entirely in the browser
- File selection and validation
- Text extraction
- PII detection, tokenization, and anonymization
- Local token table handling
- Upload of anonymized content to the backend

**End-to-end flows** -> require backend to be running and healthy
- Upload anonymized documents and poll indexing status
- Send AI prompt requests
- Generate courses from indexed documents
- Display quiz and reward logic
- Manage users through the admin page

## Supported file types

PDF, DOCX, TXT

## Installation and execution

```bash
npm install
```

If server is executed by user on http://localhost:8080 or any machine
```bash
npm run dev
```

If no server is executed and user want to use Lumina cloud infractructure
```bash
npm run dev:cloud
```

**For genAI Hackathon judges, contact us through discord or by email to get credentials if you want to use our Lumina cloud infrastructure**

### Frontend environements variables (`client/.env`)
- `VITE_API_URL`: Backend API endpoint (default: `http://localhost:8000`).

You don't have to change this variable if you execute locally the server and client


## Manual test flow

1. Start the backend
2. `npm run dev` or `npm run dev:cloud`
3. Log in
4. Open Documents → upload a PDF, DOCX, or TXT file
5. Verify PII is detected and anonymized locally before upload
6. Wait for document indexing
7. Open AI Prompt and ask a question
8. Open Create Course and generate a course
9. Complete the quiz and verify reward behavior

> This frontend follows a privacy-first approach: sensitive data is processed locally before upload.