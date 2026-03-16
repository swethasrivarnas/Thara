# THARA: AI Reading English

A warm, energetic AI companion that helps children (ages 2-7) learn to read through interactive rhymes, phonics, and visual storytelling.

## 🚀 Getting Started

### Prerequisites
- Node.js (v20 or higher)
- npm

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Setup
1. Create a `.env` file in the root directory based on `.env.example`.
2. Add your `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/app/apikey).
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

### Running Locally
Start the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

---

## 🧪 Reproducible Testing

To ensure the application is functioning correctly and consistently, follow these testing procedures:

### 1. Static Analysis (Linting)
Verify code quality and catch potential syntax or type errors:
```bash
npm run lint
```

### 2. Production Build Test
Ensure the application compiles correctly for production deployment:
```bash
npm run build
```
This step verifies that all assets are correctly bundled and that there are no build-time errors.

### 3. Functional Testing (Manual)
Since the app relies on real-time AI interactions, follow these steps to verify core functionality:

#### A. Voice Interaction Test
1. Start the app and click **"Start Talking"**.
2. Grant microphone permissions when prompted.
3. Say a simple word like *"Apple"* or *"Cat"*.
4. **Expected Result**: THARA should respond with a warm voice, acknowledge the word, and create a rhyme.

#### B. Visual Generation Test
1. While in a session, say: *"I see a blue dog in a yellow hat."*
2. **Expected Result**: The display area should show a "Making Magic..." loading state and then render a generated image matching your description.

#### C. Phonics & Spelling Test
1. Listen to THARA's response.
2. **Expected Result**: THARA should spell out the word (e.g., "C-A-T") and ask you to repeat a simple sentence.

### 4. Deployment Verification
If deploying to Google Cloud Run:
1. Ensure `_GEMINI_API_KEY` is set as a substitution variable in your Cloud Build trigger.
2. After deployment, visit the service URL and verify that the "Start Talking" button initiates a session without showing an API key error.

---

## 🛠️ Tech Stack
- **Frontend**: React, Tailwind CSS, Motion (Framer Motion)
- **AI**: Gemini 2.5 Flash (Live API), Gemini 2.5 Flash Image
- **Icons**: Lucide React
- **Deployment**: Docker, Google Cloud Run
