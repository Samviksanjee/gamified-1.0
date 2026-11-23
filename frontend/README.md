# GamifiED Frontend

A complete React-based learning platform frontend matching the GamifiED design system.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Topbar.jsx      # Header navigation
│   ├── Toast.jsx       # Toast notifications
│   ├── Badge.jsx       # Status badges
│   └── ProgressBar.jsx # Progress indicators
│
├── context/            # State management
│   └── AppContext.jsx  # Global app context & hooks
│
├── pages/              # Full page components
│   ├── StudentHome.jsx # Student dashboard hero
│   ├── MyLearning.jsx  # Learning progress page
│   ├── Resources.jsx   # Subject/chapter selector
│   ├── QuizPage.jsx    # Quiz game mode
│   ├── SequencingPage.jsx # Sequencing game mode
│   ├── TeacherDashboard.jsx # Teacher management
│   └── Login.jsx       # Authentication
│
├── styles/             # CSS stylesheets
│   ├── globals.css     # Design system & base styles
│   ├── topbar.css      # Header styles
│   ├── pages.css       # Page-specific styles
│   └── login.css       # Login page styles
│
├── api.js              # API integration layer
├── App.jsx             # Root app component
└── main.jsx            # React entry point
```

## Design System

The entire frontend uses CSS custom properties following the GamifiED design:

### Colors
- `--navy`: #153e67 (primary dark)
- `--teal`: #12a99f (primary accent)
- `--teal-dark`: #078b84 (teal dark)
- `--blue`: #36a9db (secondary)
- `--ink`: #23425e (text)
- `--muted`: #688097 (secondary text)
- `--paper`: #fffefa (background)
- `--bg`: #f3f8f8 (page background)

### Components

#### Buttons
- `.btn-primary` - Teal gradient primary buttons
- `.btn-yellow` - Yellow CTA buttons
- `.btn-soft` - Soft background buttons
- `.btn-outline` - Outlined buttons
- `.btn-text` - Text-only buttons

#### Cards
- `.card` - Standard card container
- `.card.feature` - Feature highlight cards
- `.card.stat` - Stat display cards

#### Status Indicators
- `.badge.green-bg` - Mastered
- `.badge.yellow-bg` - Practising
- `.badge.red-bg` - Try Again

#### Layout
- `.grid.three` - 3-column responsive grid
- `.grid.two` - 2-column responsive grid
- `.grid.four` - 4-column responsive grid

## Features

### Student Dashboard
- **Home Page**: Hero section with learning features and quick access
- **My Learning**: Progress tracking, learning path, mastery stats, calendar
- **Resources**: Subject/chapter browser with status indicators
- **Quiz Page**: 5-question quiz with instant feedback and hints
- **Sequencing Page**: Drag-and-drop activity ordering

### Teacher Dashboard
- **Topics Management**: Create, view, and manage learning topics
- **Activities**: Create and manage activities for topics
- **Progress Tracking**: View student performance and responses
- **Analytics**: Aggregate performance metrics

### Shared Features
- **Responsive Design**: Works on mobile (520px), tablet (800px), and desktop
- **Accessibility**: Focus states, semantic HTML, ARIA labels
- **Toast Notifications**: System-wide toast messages
- **State Management**: Global context API for app state

## Getting Started

### Installation
```bash
cd frontend
npm install
```

### Development
```bash
npm run dev
```

The dev server runs on `http://localhost:5173`

### Production Build
```bash
npm run build
```

Built files go to `dist/`

### Environment Variables
Create `.env.local`:
```
VITE_API_BASE_URL=http://localhost:8000/api
```

## API Integration

The frontend connects to the backend API via `src/api.js`:

### Student Endpoints
- `GET /student/activities` - List student's activities
- `GET /student/progress` - Get student progress
- `POST /student/attempts` - Start quiz attempt
- `POST /student/attempts/{id}/responses` - Submit answer
- `POST /student/attempts/{id}/hints` - Request hint
- `POST /student/attempts/{id}/complete` - Complete attempt

### Teacher Endpoints
- `GET /teacher/topics` - List topics
- `POST /teacher/topics` - Create topic
- `GET /teacher/topics/{id}` - Get topic details
- `POST /teacher/topics/{id}/generate` - Generate activities
- `GET /teacher/dashboard` - Teacher analytics
- `PUT /teacher/versions/{id}` - Edit activity version

## Context API

### useApp() Hook

```javascript
import { useApp } from './context/AppContext';

const {
  currentPage,           // Current page: 'home', 'learning', etc.
  navigateTo,           // Function to navigate pages
  selectedSubject,      // Currently selected subject
  setSelectedSubject,   // Set subject
  gameMode,             // Current game: 'quiz' or 'sequence'
  startGame,            // Start a game mode
  toast,                // Current toast message
  showToast,            // Show toast notification
} = useApp();
```

## Styling

### Custom Properties (CSS Variables)
All colors are CSS custom properties in `:root`. Update `src/styles/globals.css` to change the theme.

### Responsive Breakpoints
- **Desktop**: > 800px (full layout)
- **Tablet**: 520px - 800px (adjusted layout)
- **Mobile**: < 520px (single column)

### Animations
- Smooth transitions on buttons and cards
- Page fade-in with `useEffect`
- Toast slide-up animation

## Component Architecture

### Presentation Components
These are stateless UI components:
- `Topbar.jsx` - Navigation header
- `Badge.jsx` - Status badge
- `ProgressBar.jsx` - Progress indicator
- `Toast.jsx` - Toast display

### Page Components
Full-page components with state and logic:
- `StudentHome.jsx` - Student dashboard
- `MyLearning.jsx` - Learning progress
- `Resources.jsx` - Chapter selection
- `QuizPage.jsx` - Quiz game
- `SequencingPage.jsx` - Sequencing game
- `TeacherDashboard.jsx` - Teacher console

### Context
- `AppProvider` - Wraps app with global state
- `useApp()` - Hook to access app context

## Browser Support

- Chrome/Edge: Latest
- Firefox: Latest
- Safari: Latest
- Mobile browsers: iOS Safari, Chrome Mobile

## Performance

- CSS Grid for layout efficiency
- React hooks for minimal re-renders
- Vite for fast builds
- ~55KB gzipped JS + 4.2KB gzipped CSS

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Focus states with outlines
- Color contrast meets WCAG AA
- Keyboard navigation support

## Development Tips

1. **Global State**: Use `useApp()` for navigation and toasts
2. **Styling**: Always use CSS variables from globals.css
3. **Responsive**: Test at 520px, 800px, and 1440px
4. **Accessibility**: Check focus states and keyboard navigation
5. **Performance**: Use React DevTools Profiler to check renders

## Future Enhancements

- [ ] OAuth integration
- [ ] Offline mode with service workers
- [ ] Dark mode support
- [ ] Internationalization (i18n)
- [ ] Advanced filtering and search
- [ ] Real-time notifications
- [ ] Export progress reports
- [ ] Collaborative features
