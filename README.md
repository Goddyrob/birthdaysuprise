<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:ff758c,100:ffb199&height=190&section=header&text=Amour&fontSize=76&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=A%20cinematic%20love%20experience%20made%20with%20React&descAlignY=62&descSize=18" alt="Amour banner" width="100%" />

<br />

<a href="https://github.com/"><img src="https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" /></a>
<a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6" /></a>
<a href="https://motion.dev/"><img src="https://img.shields.io/badge/Motion-animated-111111?style=for-the-badge&logo=framer&logoColor=white" alt="Motion" /></a>
<a href="https://www.instagram.com/hack.n.code/"><img src="https://img.shields.io/badge/Instagram-@hack.n.code-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Instagram hack.n.code" /></a>

<br /><br />

<img src="https://readme-typing-svg.demolab.com?font=Playfair+Display&size=25&duration=3000&pause=900&color=E75480&center=true&vCenter=true&width=650&lines=Unlock+the+memory.;Light+the+moment.;Cut+the+cake.;Read+the+letter.;Float+through+your+memories." alt="Animated feature list" />

<h2>Hi, welcome to Amour 💌</h2>

</div>

## A little universe, made for one person

**Amour** turns a birthday message into an interactive story. A private passcode opens a sequence of soft transitions, a glowing lamp, a cake-cutting moment, a handwritten-style letter, and a floating photo galaxy where memories drift through space.

<div align="center">

`unlock`  →  `illuminate`  →  `celebrate`  →  `read`  →  `remember`

</div>

### ✨ The experience

| Scene | What happens |
| --- | --- |
| **Passcode landing** | Unlock the experience with a personal code and a featured photo. |
| **Floral transition** | Move between chapters through a blooming animated transition. |
| **Lamp scene** | Pull the cord and bring the next moment to life. |
| **Birthday cake** | Swipe to cut the cake and trigger the celebration. |
| **Love letter** | Reveal a customizable letter, one line at a time. |
| **Photo galaxy** | Explore uploaded memories in a cinematic 3D-style space gallery. |

### 💌 Personalize everything

- Change the recipient and sender names.
- Rewrite the greeting, letter, closing, cake message, and polaroid text.
- Upload a main photo and as many gallery memories as you like.
- Add your own music and set its title.
- Open love notes and the “reasons I love you” experience.
- Reset the experience or clear gallery photos whenever you need.

Creator configuration is saved through the Express API into Supabase. The experience configuration is stored as JSONB, passcodes are stored only as bcrypt hashes, and uploaded images or audio are stored in a private Supabase Storage bucket. The recipient receives only safe metadata until the server verifies the passcode.

## Run it locally

**Requirements:** Node.js 18+

### 1. Install and start

```bash
npm install
npm run dev
```

### 2. Open the website

Visit [http://localhost:3000](http://localhost:3000) in a modern browser. The development command starts Vite and the Express API together.

### 3. Try the demo

The default demo passcode is `1234`. A created surprise requires the passcode configured by its creator. After unlocking, follow the experience in order: pull the lamp cord, swipe across the cake to cut it, read the letter, and explore the floating photo gallery.

> Audio playback may require one click or tap because browsers block autoplay until the user interacts with the page.

### Available commands

```bash
npm run dev      # Start the Vite development server
npm run build    # Create a production build
npm run preview  # Preview the production build locally
npm run lint     # Run the TypeScript check
```

## Supabase setup

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor.
3. Copy [`.env.example`](.env.example) to `.env` for local development.
4. Set `SUPABASE_URL` and the server-only `SUPABASE_SERVICE_ROLE_KEY`.
5. Deploy the built frontend and Express server together, or configure a host that supports both a Vite build and a long-running Node process.

The browser never receives the service-role key and never queries Supabase directly. `GET /api/surprises/:id` returns metadata only; `POST /api/surprises/:id/unlock` verifies the submitted passcode and returns the protected configuration with short-lived signed media URLs.

Production share links use `/surprise/<uuid>`. The host must route that path to `dist/index.html` and route `/api/*` to the Express server. Do not use a static-only deployment unless its API functions are separately configured to provide the same endpoints.

## Project map

```text
src/
├── App.tsx                    # Scene router and saved configuration
├── components/
│   ├── LandingScene.tsx       # Passcode entry and first impression
│   ├── LampScene.tsx          # Pull-cord interaction
│   ├── CakeScene.tsx          # Swipe-to-cut celebration
│   ├── LetterScene.tsx         # Animated love letter
│   ├── SpaceGalleryScene.tsx  # Floating memory gallery
│   └── ...                    # Music, modals, hearts, transitions
├── data/defaultData.ts        # Starter romantic content
├── types/index.ts             # Shared TypeScript models
└── utils/audio.ts             # Music playback helpers
```

## Make it yours

The quickest starting point is [`src/data/defaultData.ts`](src/data/defaultData.ts). For a deeper customization flow, launch the app and use the settings button in the experience itself. Replace the sample Unsplash photos with your own memories before sharing the final link.

## Built with

`React` · `TypeScript` · `Vite` · `Motion` · `Tailwind CSS` · `Lucide React` · `canvas-confetti`

<div align="center">

<br />

<a href="https://www.instagram.com/hack.n.code/"><strong>Follow more builds at @hack.n.code on Instagram →</strong></a>

<br /><br />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:ffb199,100:ff758c&height=100&section=footer&animation=fadeIn" alt="Amour footer" width="100%" />

</div>
