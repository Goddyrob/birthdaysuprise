<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:F97316,100:111827&height=210&section=header&text=Amour&fontSize=78&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=A%20cinematic%20love%20experience%20built%20with%20React&descAlignY=62&descSize=18" alt="Amour banner" width="100%" />

<br />

<a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19" /></a>
<a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
<a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6" /></a>
<a href="https://motion.dev/"><img src="https://img.shields.io/badge/Motion-Animated-111111?style=for-the-badge&logo=framer&logoColor=white" alt="Motion" /></a>
<a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>

<br /><br />

<a href="https://github.com/Goddyrob"><img src="https://img.shields.io/badge/GitHub-@Goddyrob-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Goddyrob" /></a>
<a href="https://www.linkedin.com/in/godswill-robwet"><img src="https://img.shields.io/badge/LinkedIn-Godswill%20Robwet-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn Godswill Robwet" /></a>
<a href="https://godswillrobwet.netlify.app"><img src="https://img.shields.io/badge/Portfolio-Godswill%20Robwet-F97316?style=for-the-badge&logo=netlify&logoColor=white" alt="Godswill Robwet Portfolio" /></a>
<a href="mailto:godswillrobwet@gmail.com"><img src="https://img.shields.io/badge/Email-Let's%20Connect-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Email Godswill Robwet" /></a>

<br /><br />

<img src="https://readme-typing-svg.demolab.com?font=Playfair+Display&size=25&duration=3000&pause=900&color=F97316&center=true&vCenter=true&width=760&lines=Unlock+the+memory.;Light+the+moment.;Cut+the+cake.;Read+the+letter.;Float+through+your+memories." alt="Animated feature list" />

<h2>Welcome to Amour 💌</h2>

<p><strong>A private, cinematic and deeply personal digital experience created to turn meaningful memories into an interactive story.</strong></p>

</div>

---

## ✨ About Amour

**Amour** transforms a birthday or special message into an immersive digital journey.

Instead of opening a simple greeting card, the recipient unlocks a sequence of interactive scenes — soft transitions, a glowing lamp, a cake-cutting moment, a handwritten-style letter and a floating photo galaxy filled with personal memories.

<div align="center">

`unlock` → `illuminate` → `celebrate` → `read` → `remember`

</div>

The project combines **storytelling, animation, personalization and secure private content delivery** into one memorable experience.

---

## 🎬 The Experience

| Scene | Experience |
| --- | --- |
| 🔐 **Passcode Landing** | Unlock the experience using a private personal code and featured image. |
| 🌸 **Floral Transition** | Move between chapters through a soft animated transition. |
| 💡 **Lamp Scene** | Pull the cord and illuminate the next part of the story. |
| 🎂 **Birthday Cake** | Swipe across the cake to trigger the celebration moment. |
| 💌 **Love Letter** | Reveal a customizable personal letter in an intimate reading experience. |
| 🌌 **Photo Galaxy** | Explore uploaded memories in a cinematic floating gallery. |
| 🎵 **Music Experience** | Add a personal soundtrack to make the experience even more immersive. |
| ❤️ **Love Notes** | Include personal notes and meaningful reasons that make the experience unique. |

---

## 💖 Personalize the Entire Story

Amour is designed so that each experience can feel completely personal.

You can:

- Change the **recipient and sender names**
- Customize the **welcome message, cake message, letter and closing**
- Upload a **featured photo**
- Add multiple **gallery memories**
- Upload custom **background music**
- Set a music title
- Create personal **love notes**
- Add **reasons I love you**
- Customize polaroid captions and memory text
- Reset or update the experience when needed

The goal is simple: **the technology should disappear, and the memory should become the experience.**

---

## 🔐 Privacy & Security

Personal memories deserve more than a beautiful interface — they deserve thoughtful protection.

Amour uses a server-backed architecture where:

- Creator configuration is stored through the **Express API**
- Experience data is stored in **Supabase**
- Configuration is saved as structured **JSONB**
- Passcodes are stored only as **bcrypt hashes**
- Uploaded images and audio are kept in a **private Supabase Storage bucket**
- The browser never receives the **Supabase service-role key**
- Protected media is delivered through **short-lived signed URLs**
- Public metadata can be loaded before unlock without exposing private experience content
- The full protected configuration is returned only after successful passcode verification

> **Privacy by design:** the recipient receives only what is needed at each stage of the experience.

---

## 🏗️ Architecture

```text
                        ┌─────────────────────┐
                        │      Recipient      │
                        │   Browser / Mobile  │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │    React + Vite     │
                        │ Interactive Scenes  │
                        └──────────┬──────────┘
                                   │
                            /api/* │
                                   ▼
                        ┌─────────────────────┐
                        │    Express API      │
                        │ Auth + Validation   │
                        └──────────┬──────────┘
                                   │
                      ┌────────────┴────────────┐
                      ▼                         ▼
             ┌────────────────┐       ┌──────────────────┐
             │ Supabase DB    │       │ Supabase Storage │
             │ Config + Meta  │       │ Images + Audio   │
             └────────────────┘       └──────────────────┘
```

---

## 🧰 Built With

`React` · `TypeScript` · `Vite` · `Motion` · `Tailwind CSS` · `Lucide React` · `canvas-confetti` · `Express` · `Supabase` · `bcrypt`

---

## 🚀 Run Locally

### Requirements

- **Node.js 18+**
- A Supabase project for persistent creator experiences

### 1. Clone the project

```bash
git clone https://github.com/Goddyrob/<repository-name>.git
cd <repository-name>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Then configure the required server-side variables:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code.

### 4. Configure Supabase

1. Create a Supabase project.
2. Open the SQL Editor.
3. Run `supabase/schema.sql`.
4. Confirm the required database objects and private storage bucket have been created.

### 5. Start development

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## 🧪 Demo Flow

The default demo passcode is:

```text
1234
```

For creator-generated surprises, use the passcode configured when the experience was created.

After unlocking:

1. Pull the lamp cord
2. Continue into the celebration
3. Swipe across the cake
4. Read the personal letter
5. Explore the floating memory gallery

> Browsers may require a click or tap before audio can play because autoplay is commonly restricted.

---

## 📜 Available Commands

```bash
npm run dev      # Start Vite + Express development environment
npm run build    # Create the production frontend build
npm run preview  # Preview the production build locally
npm run lint     # Run project checks
```

---

## 🗂️ Project Structure

```text
src/
├── App.tsx                     # Scene routing and experience state
├── components/
│   ├── LandingScene.tsx        # Passcode entry and first impression
│   ├── LampScene.tsx           # Pull-cord interaction
│   ├── CakeScene.tsx           # Swipe-to-cut celebration
│   ├── LetterScene.tsx         # Animated personal letter
│   ├── SpaceGalleryScene.tsx   # Floating memory gallery
│   └── ...                     # Music, modals, hearts and transitions
├── data/
│   └── defaultData.ts          # Starter romantic content
├── types/
│   └── index.ts                # Shared TypeScript models
└── utils/
    └── audio.ts                # Music playback helpers

supabase/
└── schema.sql                  # Database setup

server/
└── ...                         # Express API and protected data access
```

---

## 🌍 Vercel Deployment

The Vercel deployment builds the Vite frontend from `npm run build` and serves it from `dist`. The serverless function in `api/[...path].js` exports the same Express API app used by the local server. `vercel.json` sends `/surprise/<uuid>` to the SPA while leaving `/api/*` to the API function.

In **Vercel → Project → Settings → Environment Variables**, configure:

| Name | Value source |
| --- | --- |
| `SUPABASE_URL` | Project URL from Supabase project settings. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side service role/secret key from Supabase API settings. Never use a `VITE_` prefix. |
| `SUPABASE_STORAGE_BUCKET` | The private storage bucket name; defaults to `surprise-media`. |

Apply the variables to the required Vercel environments, then redeploy so the deployment receives them. `PORT` is only used by the local Express server and is not required on Vercel.

Production share links use `/surprise/<uuid>`. API endpoints remain under `/api/`.

---

## 🔌 API Behaviour

### Public metadata

```http
GET /api/surprises/:id
```

Returns safe public metadata without exposing protected personal content.

### Unlock experience

```http
POST /api/surprises/:id/unlock
```

Verifies the submitted passcode and, when valid, returns the protected experience configuration together with temporary signed URLs for private media.

---

## 🎨 Design Philosophy

**Emotion before complexity.**  
Every animation should strengthen the story rather than distract from it.

**Privacy before convenience.**  
Personal memories should not be publicly exposed just because a link exists.

**Personalization before templates.**  
The recipient should feel that the experience was created specifically for them.

**Performance before decoration.**  
Transitions, media and interactions should remain smooth across modern mobile and desktop devices.

---

## 🛣️ Future Enhancements

- More cinematic scene themes
- Anniversary and graduation experience templates
- Creator dashboard improvements
- Scheduled surprise activation
- Expiring private share links
- Additional gallery layouts
- Optional video memories
- Custom theme presets
- Improved accessibility controls
- Downloadable keepsake mode
- Event-specific templates beyond birthdays

---

## 👨‍💻 Creator

<div align="center">

### **Godswill Robwet**

**Digital Solutions Consultant & Tech Educator**

*Turning ideas into digital impact.*

<br />

<a href="https://godswillrobwet.netlify.app">Portfolio</a>
&nbsp; • &nbsp;
<a href="https://github.com/Goddyrob">GitHub</a>
&nbsp; • &nbsp;
<a href="https://www.linkedin.com/in/godswill-robwet">LinkedIn</a>
&nbsp; • &nbsp;
<a href="mailto:godswillrobwet@gmail.com">Email</a>

<br /><br />

**Web & App Development · Branding · Data · Digital Solutions**

</div>

---

## 🤝 Contributing

Ideas, improvements and thoughtful contributions are welcome.

```bash
git checkout -b feature/your-feature
git commit -m "Add: your feature"
git push origin feature/your-feature
```

Then open a pull request describing the improvement.

---

## 📄 License

Add the appropriate license for how you want Amour to be reused or distributed.

For a private/personal project, you may choose to keep the source proprietary.  
For an open-source release, add a `LICENSE` file and state the selected license here.

---

<div align="center">

### Built with intention. Designed around memories. 💌

**Godswill Robwet — Turning ideas into digital impact.**

<br />

<a href="https://godswillrobwet.netlify.app"><strong>Explore my portfolio →</strong></a>

<br /><br />

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:111827,100:F97316&height=110&section=footer&animation=fadeIn" alt="Amour footer" width="100%" />

</div>
