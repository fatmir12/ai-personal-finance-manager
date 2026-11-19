# MyWallet — Personal Finance Manager

MyWallet is a personal finance application for tracking accounts, transactions, budgets, savings goals and recurring payments. It includes a financial assistant that answers questions using the signed-in user's finance data.

## Features

- Dashboard with balances, monthly income and expenses, trends and recent activity
- Multiple accounts and transaction management
- Monthly budgets and savings goals
- Recurring transactions and notifications
- AI financial assistant with saved conversations
- User profile with account details and password change
- Protected API, short-lived JWT access tokens and refresh-token cookies
- Bosnian-language interface

## Technology

| Area | Technologies |
|---|---|
| Frontend | React 19, Vite 8, React Router, Tailwind CSS |
| Backend | Java 25, Spring Boot 4, Spring Security, Spring Data JPA |
| Database | Microsoft SQL Server |
| AI | Ollama (`gemma3:4b` by default) |

## Requirements

- Java Development Kit (JDK) 25
- Node.js 22.12 or newer and npm
- Microsoft SQL Server
- Ollama, with the configured model available locally

Pull the default AI model once:

```powershell
ollama pull gemma3:4b
```

The backend expects the SQL Server database `AIFinanceDB` at `localhost:1433` and the SQL login `aifinance_app`. Hibernate schema generation is disabled, so the database and application tables must already exist. This repository does not include database creation or migration scripts.

## Configuration

The backend reads secrets from environment variables; do not put real credentials in source files or commit them.

| Variable | Required | Description |
|---|---:|---|
| `DB_PASSWORD` | Yes | Password for the SQL Server login `aifinance_app` |
| `JWT_SECRET` | Yes | Base64-encoded secret containing at least 32 random bytes |
| `JWT_EXPIRATION_MINUTES` | No | Access-token lifetime in minutes; defaults to `10` |

For local development, set these values in your IDE's run configuration or in the PowerShell terminal used to start the backend. Example placeholders only:

```powershell
$env:DB_PASSWORD = '<your SQL Server password>'
$env:JWT_SECRET = '<your Base64-encoded random key>'
$env:JWT_EXPIRATION_MINUTES = '10'
```

Generate a new key once, store it in a local secret manager or IDE environment configuration, and reuse it across restarts. Generating a different key invalidates existing access tokens. Never publish the values or commit them to Git.

The SQL Server URL, Ollama URL and default model are configured in [`backend/src/main/resources/application.properties`](backend/src/main/resources/application.properties). The defaults are SQL Server at `localhost:1433` and Ollama at `localhost:11434`.

## Run locally

Start the backend from a PowerShell terminal:

```powershell
cd backend
# Set DB_PASSWORD and JWT_SECRET in this terminal first.
.\mvnw.cmd spring-boot:run
```

The backend listens on `http://localhost:8080`. Its health endpoint is `http://localhost:8080/api/health`.

In a second terminal, install frontend dependencies and start Vite:

```powershell
cd frontend
npm ci
npm run dev
```

Open the address printed by Vite (by default, `http://localhost:5174`). Vite proxies `/api` requests to the backend on port `8080`.

## Checks

From `frontend`:

```powershell
npm run lint
npm run build
```

From `backend` (with the required database and environment variables configured):

```powershell
.\mvnw.cmd test
```

The backend application-context test connects to SQL Server, so the database must be reachable for the full backend test suite.

## Security notes

- Keep database credentials and JWT secrets in environment variables or a secret manager.
- Use a new, strong JWT secret for each deployment environment.
- Enable the secure refresh-token cookie setting when serving the application over HTTPS.
- Do not use real personal or financial data in public demos or screenshots.

