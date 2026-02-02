# Kalkulator Kalori

A TV-friendly calorie calculator for menu items, built with Vite + React + TypeScript.

## Tech stack

- Vite
- React + TypeScript
- Tailwind CSS
- shadcn-ui (Button + Sonner)
- Firebase Auth (Google sign-in)

## Local development

```sh
npm install
npm run dev
```

The dev script will free port 8888 and start the app there:

```
http://localhost:8888/
```

## Environment variables

Create a `.env` file with:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

## Deploy (Vercel)

1. Push to GitHub.
2. Import the repo in Vercel.
3. Add the same `VITE_FIREBASE_*` variables to Vercel.
4. Deploy.

## Firebase Auth settings

In Firebase Console → Authentication:

- Enable Google sign-in
- Add authorized domain: your Vercel domain (e.g. `kalori-kalkulator.vercel.app`)

## Notes

- Admin access is enforced in the client by email allow-list.
- Menu data is generated from `/public/menu/*` image filenames.
