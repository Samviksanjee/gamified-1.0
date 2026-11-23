# Toast Notification System

A simple, accessible toast notification system for displaying user feedback.

## Features

- ✅ Display notifications at top-right of screen
- ✅ 4 notification types: success (green), error (red), warning (yellow), info (blue)
- ✅ Auto-dismiss after 3 seconds (configurable)
- ✅ Dismiss button (X) for manual dismissal
- ✅ Multiple concurrent toasts supported
- ✅ Fully accessible with ARIA labels
- ✅ Smooth animations
- ✅ Responsive design

## Setup

The toast system is already integrated into the app. The `ToastProvider` wraps the entire app in `App.jsx`, and `ToastContainer` renders all notifications.

## Usage

### Basic Usage with Hook

```jsx
import { useToast } from '../hooks/useToast';

export default function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleClick = async () => {
    try {
      // Do something...
      showSuccess('Operation completed successfully!');
    } catch (error) {
      showError('Something went wrong: ' + error.message);
    }
  };

  return (
    <button onClick={handleClick}>
      Click me
    </button>
  );
}
```

### Available Methods

```jsx
const { showSuccess, showError, showWarning, showInfo } = useToast();

// Show success notification (green)
showSuccess('Item saved successfully');

// Show error notification (red)
showError('Failed to save item');

// Show warning notification (yellow)
showWarning('This action cannot be undone');

// Show info notification (blue)
showInfo('Processing your request...');
```

## Examples

### Form Submission

```jsx
import { useToast } from '../hooks/useToast';

export default function UserForm() {
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (formData) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        showSuccess('User created successfully');
      } else {
        showError('Failed to create user');
      }
    } catch (error) {
      showError('An error occurred: ' + error.message);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(new FormData(e.target));
    }}>
      {/* form fields */}
    </form>
  );
}
```

### API Calls

```jsx
import { useToast } from '../hooks/useToast';
import { superAdmin } from '../api';

export default function TeacherManagement() {
  const { showSuccess, showError } = useToast();

  const suspendTeacher = async (teacherId) => {
    try {
      await superAdmin.suspendTeacher(teacherId);
      showSuccess('Teacher suspended successfully');
      // Refresh list
    } catch (error) {
      showError('Failed to suspend teacher: ' + error.message);
    }
  };

  return (
    <button onClick={() => suspendTeacher(123)}>
      Suspend Teacher
    </button>
  );
}
```

### Multiple Toasts

```jsx
const { showInfo, showSuccess } = useToast();

// Show multiple notifications
showInfo('Uploading file...');
// ... after upload completes
showSuccess('File uploaded successfully');
```

## Styling

Toast notifications are styled via CSS in `src/styles/toast.css`. You can customize:

- **Colors**: Change background and text colors for each type
- **Position**: Modify `.toast-container` to change position (currently top-right)
- **Duration**: Animation speeds in keyframes
- **Responsive**: Mobile adjustments at 480px breakpoint

### Changing Position

To move toasts to a different position, edit `src/styles/toast.css`:

```css
.toast-container {
  /* top-right (default) */
  top: 20px;
  right: 20px;

  /* OR top-left */
  top: 20px;
  left: 20px;

  /* OR bottom-right */
  bottom: 20px;
  right: 20px;
}
```

## Accessibility

- Uses semantic `<button>` for close action
- Includes `aria-label` attributes
- Uses `role="alert"` for screen reader announcement
- Uses `role="region"` with `aria-live="polite"` for container
- Keyboard accessible dismiss button

## Context API

If needed, you can also access the context directly:

```jsx
import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';

export default function MyComponent() {
  const { addToast } = useContext(ToastContext);

  // Add toast with custom duration (ms)
  addToast('Custom message', 'info', 5000);
}
```

## Super Admin Pages Integration

The toast system is ready to use in all Super Admin pages:

- `SuperAdminDashboard.jsx` - Dashboard updates
- `SuperAdminTeachers.jsx` - Teacher management actions
- `SuperAdminInvitations.jsx` - Invitation actions
- `SuperAdminAuditLogs.jsx` - Audit log feedback

Example in Super Admin Teachers page:

```jsx
const { showSuccess, showError } = useToast();

// When suspending a teacher
await superAdmin.suspendTeacher(teacher.id);
showSuccess('Teacher suspended successfully');

// On error
catch (error) {
  showError('Failed to suspend teacher');
}
```

## Tips

- Keep messages concise and action-focused
- Use success for completed actions
- Use error for failures or validation errors
- Use warning for destructive or important actions
- Use info for general updates or progress
- Avoid showing too many toasts at once (max 2-3 is recommended)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers
- Graceful degradation for older browsers
