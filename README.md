# OcuSense AI

A Django and React app for screen breaks, hydration tracking, camera-based blink monitoring, and medicine reminders.

The interface uses a consistent OcuSense identity and a compact dark theme. Focus and water controls lead the screen-health page; camera controls, preview, calibration, and readings share one workspace. The reminder page pairs a short form with saved schedules, and feedback keeps inline validation, draft recovery, and confirmation. The mobile menu, skip link, visible keyboard focus, and route scroll reset support navigation on narrow screens.

## Local setup

Use Python 3.12 or newer and Node.js 22. Run from the repository root:

```sh
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
npm --prefix frontend ci --include=dev
PUBLIC_URL=/static/frontend npm --prefix frontend run build
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py runserver
```

Open http://localhost:8000. For React development, also run `npm --prefix frontend start`; the development server proxies `/api` to Django on port 8000. Environment variables are described in `.env.example`; Django reads the process environment, so export the values before starting it.

## Reminders and privacy

Medicine reminders are saved in the database and isolated by an opaque server-side browser session. Every modifying request requires a CSRF token. Reminders survive reloads in the same browser; clearing its cookies or letting the session expire removes access. There are no user accounts or cross-device synchronization. Existing unowned reminder rows are only accessible through Django admin.

Enable alerts with the button on the medicine page. Due reminders produce in-app alerts and, when permitted, browser notifications and sound. Alerts continue across app pages **while the app is open**. Closed-browser delivery is not implemented; browser background throttling can delay alerts. Daily schedules use the browser's time zone, and marking a daily reminder taken advances it to its next occurrence.

Camera processing runs in the browser after permission is granted. FaceMesh runtime assets load from jsDelivr. Stop or leave the camera page to release the stream. Distance estimates require calibration against a measured distance and depend on camera placement and head angle. Screen-time risk labels and camera estimates are wellness indicators, not a validated diagnosis.

Contact submissions are stored privately in the database and viewed through Django admin (`python manage.py createsuperuser`). Submitted names, emails, and messages are not written to application logs. Local databases, contact logs, secrets, generated builds, and dependencies are ignored by Git.

The Contact and feedback page validates required fields, email format, and field lengths. Failed requests keep the user's draft; successful submissions display a persistent confirmation. Authorized staff can review feedback under **Contact messages** in `/admin/`. Automatic email responses are not implemented. The responsive menu runs in React and does not need an external Bootstrap script.

Previously committed database and contact-log files are removed from the current source tree by the fixes. Their older copies remain in Git history until a separately coordinated history rewrite is performed. Removing current files does not erase copies that were already downloaded.

## Render deployment

Use `render.yaml`. Supply `DATABASE_URL` for a persistent PostgreSQL database before the build runs; the blueprint does not create a database automatically. Render generates a private `SECRET_KEY`. Production runs with `DEBUG=False`, secure cookies, HTTPS redirects, and an explicit host allowlist. Add custom domains to `ALLOWED_HOSTS` and their full HTTPS origins to `CSRF_TRUSTED_ORIGINS` when needed.

`bash build.sh` installs both dependency sets, builds React with the asset prefix expected by Django, collects static files, and applies migrations. Gunicorn binds to Render's `PORT`, and `/health/` provides the health check. Keep database backups; the repository does not contain deployment data.

## Verification

```sh
CI=true npm --prefix frontend test -- --watchAll=false --runInBand
CI=true PUBLIC_URL=/static/frontend npm --prefix frontend run build
python manage.py makemigrations --check --dry-run
python manage.py collectstatic --noinput
python manage.py test eyeapp
```

GitHub Actions runs the same frontend, migration, and backend checks. Tests cover browser-session isolation, CSRF enforcement, reminder scheduling and alert claims, private feedback storage and admin access, form errors and retry, mobile navigation, API error handling, and camera cleanup.
