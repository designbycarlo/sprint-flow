# <picture><source media="(prefers-color-scheme: dark)" srcset="./public/sprint-flow-logo-dark.svg"/><img alt="Sprint Flow" src="./public/sprint-flow-logo-light.svg" width="220"/></picture>

> **Drag. Drop. Done.** — A Kanban board that keeps your sprint on track.

## ⚡ Tech Stack

| Layer | What We're Using |
|-------|-----------------|
| **Framework** | Next.js 16 (App Router, Server Components) |
| **Language** | TypeScript — strict, no `any` shortcuts |
| **Database & Auth** | Supabase (PostgreSQL + Row Level Security) |
| **Drag & Drop** | @dnd-kit — smooth, accessible |
| **Styling** | CSS Modules + Tailwind, with full dark mode |

## 🎯 Features

- **🔄 Drag-and-drop Kanban** — Cards glide between "To Do", "In Progress", and "Done" like butter
- **🔐 Authentication** — Email/password login powered by Supabase Auth. No Google OAuth bloat.
- **🌙 Dark mode** — Toggle at the click of a button. Light and dark themes that are easy on the eyes.
- **🗄️ Persistent data** — Every card and column lives in PostgreSQL with RLS keeping things secure.
- **⚡ Real-time ready** — Built on Supabase's real-time infrastructure, ready to go live when you are.

## 🚀 Getting Started

```bash
npm install
cp .env.local.example .env.local   # Drop in your Supabase creds
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll land on the login page. Sign up, log in, and start dragging.

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

## 🌐 Deployment

Deployed on [Vercel](https://vercel.com). Push to `main` → auto-deploys. That's it.

---

*Built with ☕ by [Carlo](https://github.com/designbycarlo)*

