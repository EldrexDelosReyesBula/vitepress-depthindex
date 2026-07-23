# Banners, Modals & Bottom Sheets

## Overview
DepthIndex includes a complete banner, modal, and bottom sheet engine for announcements, exit-intent offers, upgrade calls-to-action, and custom user notifications.

## Banner Types

### Banner
Top or bottom notification strip. Ideal for announcements and welcome messages.

### Modal
Centered overlay dialog with backdrop blur. Ideal for special offers, upgrade prompts, and exit intent notifications.

### Bottom Sheet
Slide-up panel attached to the bottom of the screen. Ideal for mobile views and quick actions.

### Fullscreen
Full-viewport overlay for critical alerts or onboarding steps.

### Toast
Transient notification toast popup.

## Triggers

### After Searches
Display banner after user completes X search queries:
```typescript
trigger: { afterSearches: 3 }
```

### Exit Intent
Display modal when user moves mouse to leave the page:
```typescript
trigger: { onExitIntent: true }
```

### Page Specific
Restrict banner display to specific pages or URL segments:
```typescript
trigger: { onPages: ['/pricing', '/guide'] }
```

### Time Based
Display banner after X seconds on site:
```typescript
trigger: { afterSeconds: 10 }
```

## Customization

```typescript
DepthIndex({
  banners: [
    {
      id: 'welcome-offer',
      type: 'modal',
      position: 'center',
      title: '🎉 Upgrade to DepthIndex Pro',
      content: 'Get 20% off when you upgrade today!',
      primaryAction: {
        text: 'Claim Discount',
        url: '/pricing?coupon=OFF20',
        style: 'primary',
      },
      dismissible: true,
      showOnceEver: true,
      overlay: true,
      trigger: {
        afterSearches: 2,
      },
    },
  ],
})
```
