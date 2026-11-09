// Figma node-ID constants for `data-fid` Fidelity hooks (AD-15).
//
// Every element mapped in a PRD consequence carries data-fid="<figma-node-id>".
// Values come from PRD §4 and the brief addendum (Part A §2–§5, Part B §2,
// §13) and are the Figma node IDs verbatim (colon kept, instance paths with
// "I…;…" kept). Never type a node ID inline in a component: import it here.
//
// Figma file: js9ue0LTQDFIxAsxEuM8Wx, page "🎨 Demo".

const deepFreeze = (object) => {
  for (const value of Object.values(object)) {
    if (value && typeof value === 'object') deepFreeze(value);
  }
  return Object.freeze(object);
};

export const FID = deepFreeze({
  frames: {
    login: '6026:60111',
    forgotPassword: '6026:62907',
    dashboardFull: '6215:58878',
    dashboardSmall: '6864:4514',
    dashboardAllgood: '6879:15603',
    notifications: '8270:44312',
    profileMenu: '6026:52937',
  },

  login: {
    photoRight: '6026:60116',
    photoLeft: '6026:60117',
    rightOverlay: '6026:60119',
    panelGroup: '6026:60121',
    greenPanel: '6026:60122',
    formColumn: '6026:60124',
    innerStack: '6026:60125',
    logoStack: '6026:60126',
    logo: '6026:60127',
    formWrapper: '6026:60133',
    formStack: '6026:60134',
    title: '6026:60138',
    usernameGroup: '6026:60140',
    usernameLabel: '6026:60141',
    usernameInput: '6026:60142',
    passwordGroup: '6026:60143',
    passwordLabel: '6026:60144',
    passwordInput: '6026:60145',
    forgotLinkBox: '6026:60146',
    forgotLink: '6026:60147',
    loginButton: '6026:60153',
    loginButtonLabel: 'I6026:60153;23:2941',
    legalText: '6026:60155',
  },

  forgotPassword: {
    header: '6026:62908',
    title: '6026:62909',
    closeButton: '6026:62910',
    closeGlyph: '6026:62911',
    headerDivider: '6026:62912',
    body: '6026:62913',
    intro: '6026:62914',
    emailInput: '6026:62915',
    emailLabelRow: 'I6026:62915;4324:43401',
    emailLabel: 'I6026:62915;215:1978',
    emailField: 'I6026:62915;215:1979',
    emailPlaceholder: 'I6026:62915;215:1981',
    helpIconSlot: 'I6026:62915;4324:43402',
    helpIcon: 'I6026:62915;4324:43402;5759:52232',
    helpText: '6026:62916',
    footerDivider: '6026:62918',
    footer: '6026:62919',
    cancel: '6026:62920',
    submit: '6026:62921',
  },

  shell: {
    header: '6227:63670',
    headerMasterDashboard: '6194:35398',
    headerVariantEquipment: '6229:37003',
    headerVariantAlerts: '6223:34415',
    logo: 'I6227:63670;6194:35224',
    headerDivider: 'I6227:63670;6194:35226',
    navIconDashboard: 'I6227:63670;6194:35372',
    navIconEquipment: 'I6227:63670;6194:35376',
    navIconAlerts: '3062:32562',
    bell: 'I6227:63670;6194:35257',
    avatar: 'I6227:63670;6194:35269',
    pageTitle: '6215:59009',
    content: '6227:66459',
    // Story 2.1 — from get_design_context on 6227:63670 (Header instance).
    leftBlock: 'I6227:63670;6194:35218',
    navTabs: 'I6227:63670;6194:35370',
    navTabDashboard: 'I6227:63670;6194:35371',
    navLabelDashboard: 'I6227:63670;6194:35373',
    navTabEquipment: 'I6227:63670;6194:35375',
    navLabelEquipment: 'I6227:63670;6194:35377',
    navTabAlerts: 'I6227:63670;6194:35379',
    navLabelAlerts: 'I6227:63670;6194:35384',
    iconActions: 'I6227:63670;6194:35256',
    avatarHolder: 'I6227:63670;6194:35259',
    avatarButton: 'I6227:63670;6194:35267',
    badge: 'I6227:63670;6194:35281',
    badgeText: 'I6227:63670;6194:35282',
  },

  // Story 2.1 — profile panel 6026:52937 (AD-14: only the title and Logout).
  profileMenu: {
    titleRow: '6026:52938',
    title: '6026:52939',
    logout: '6026:52992',
    logoutIcon: '6026:52993',
    logoutLabel: '6026:52994',
  },

  kpi: {
    strip: '6337:55041',
    iconAttention: '6337:55047',
    iconEquipment: '6337:55059',
    iconOnline: '6337:55100',
    iconOffline: '6337:55110',
    iconFans: '6337:55121',
    iconAllGood: '6882:59666',
    // Story 2.3 — All-good: Online / Offline / Fans wrapped in a 766 px group (Part B §3).
    statusGroupAllGood: '6916:11719',
  },

  equipmentCard: {
    viewAllChevron: '6337:54574',
    rowChevron: '6337:54591',
  },

  recentAlerts: {
    criticalGlyph: '6337:54670',
    warningGlyph: '6337:54715',
    actionArrow: '6337:54689',
    empty: '6882:4705',
  },

  grain: {
    cornLegendItem: '6337:54860',
  },

  liquid: {
    summary: '6337:54903',
    fillLabel: '6337:54904',
    emptyHeader: '6882:59794',
    empty: '6882:59806',
  },

  notifications: {
    close: '8270:44316',
    toggle: 'I8270:44317;617:5109',
  },
});
