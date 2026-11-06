// Every user-visible UI string that is not data (AD-16). Pure module, UTF-8.
//
// Strings are copied verbatim from PRD §4 / the brief addendum copy deck,
// including U+00B7 "·", U+2019 "’" and the design's own wording. JSX must not
// contain literal user-visible text: it reads from here or from the data JSON.
// Runtime slots such as {time} or {coachPhone} are filled ONLY by `fill()` and
// the helpers below.
//
// Note (PRD FR-47 note): the reset confirmation keeps the straight apostrophe
// in "we've" exactly as SCRUM-29 / the PRD write it, while the modal intro uses
// the typographic "’" from Figma.

const deepFreeze = (object) => {
  for (const value of Object.values(object)) {
    if (value && typeof value === 'object') deepFreeze(value);
  }
  return Object.freeze(object);
};

export const copy = deepFreeze({
  brand: {
    logoAlt: 'AGI SureTrack Farm',
  },

  login: {
    title: 'Login',
    usernameLabel: 'Username',
    passwordLabel: 'Password',
    submit: 'Login',
    forgotLink: 'Forgot Password or Username?',
    legalLead: 'By clicking login, you hereby agree to our ',
    privacyPolicy: 'Privacy Policy',
    legalSeparator: ' | ',
    termsOfService: 'Terms of Service',
    errors: {
      usernameRequired: 'Username is required',
      passwordRequired: 'Password is required',
      wrongCredentials: 'Username or password is incorrect',
      accountLockedUntil: 'Your account is locked. Try again after {time}. Contact SureTrack Coach {coachPhone}.',
      accountLocked: 'Your account is locked. Contact SureTrack Coach {coachPhone}.',
      accountInactive: 'Your account is inactive. Contact SureTrack Coach.',
      passwordExpired: 'Your password has expired',
      resetPasswordLink: 'Reset your password',
      tooManyAttempts: 'Too many sign-in attempts. You can try again at {time}.',
      offline: 'You appear to be offline. Check your connection and try again.',
      timeout: 'The server did not respond in time. Please try again.',
      sessionExpired: 'Your session has expired. Please sign in again.',
    },
  },

  forgotPassword: {
    title: 'Forgot Your Password or Username?',
    intro: 'Forgot your password or username? Enter your email address, and we’ll send you a link to reset your password.',
    emailLabel: 'Email ',
    emailAccessibleLabel: 'Email',
    requiredMark: '*',
    emailPlaceholder: 'Eg. example@mail.com',
    helpIconLabel: 'Email help',
    helpTooltip: 'Use the email address linked to your SureTrack account.',
    helpLead: 'Need additional help?',
    coachLine: 'SureTrack Coach {coachPhone}',
    cancel: 'Cancel',
    submit: 'Submit',
    close: 'Close',
    invalidEmail: 'Enter a valid email address',
    confirmation: "If an account exists for this email, we've sent a reset link. Check your inbox and spam folder.",
  },

  shell: {
    tabs: {
      dashboard: 'Dashboard',
      equipment: 'Equipment',
      alerts: 'Alerts',
    },
    pageTitles: {
      dashboard: 'Dashboard',
      equipment: 'Equipment',
      alerts: 'Alerts',
    },
    bellLabel: 'Notifications',
    avatarLabel: 'Account menu',
    profileMenuTitle: 'My Profile',
    logout: 'Logout',
  },

  placeholder: {
    comingSoon: 'Coming soon',
  },

  dashboard: {
    sectionError: 'Couldn’t load this section.',
    retry: 'Retry',
    segmentTooltip: '{name} · {amountLabel} · {share}% of capacity',
    runtimeValue: '{hours}h',
    equipmentRowLabel: '{type}, {count}: {caption}',
  },

  notifications: {
    closeLabel: 'Close notifications',
    unreadItemLabel: 'Unread: {message}',
  },
});

/**
 * Fill `{name}` slots in a copy template. Throws if a slot has no value, so a
 * missing runtime value can never leak a raw "{slot}" onto the screen.
 */
export function fill(template, values) {
  values = values ?? {};
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (!Object.hasOwn(values, key) || values[key] === undefined || values[key] === null) {
      throw new Error(`copy: missing value for {${key}}`);
    }
    return String(values[key]);
  });
}

/** FR-72 accessible name: `<type>, <count>: <caption with " · " → ", ">`. */
export function equipmentRowLabel({ type, count, caption }) {
  return fill(copy.dashboard.equipmentRowLabel, {
    type,
    count,
    caption: typeof caption === 'string' ? caption.split(' · ').join(', ') : caption,
  });
}

/** FR-81 value label: `<hours>h`. A null/undefined value hits fill's missing-slot error. */
export function runtimeValueLabel(hours) {
  return fill(copy.dashboard.runtimeValue, { hours });
}
