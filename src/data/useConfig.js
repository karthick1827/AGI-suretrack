// The runtime config (public/app-config.json) as React state, read through
// the data port's getConfig() (AD-7). Shared by the Login legal links
// (FR-20) and the Forgot Password Coach line (FR-43).
//
// Returns null until the config loads, and stays null if it fails to load
// (nothing is logged). `select(config)` picks and sanitises the part a
// caller needs; pass a module-level function so it stays the same.
import { useEffect, useState } from 'react';
import { getConfig } from './api.js';

export function useConfig(select) {
  const [value, setValue] = useState(null);
  useEffect(() => {
    let active = true;
    getConfig().then(
      (config) => {
        if (active) setValue(select(config));
      },
      () => {
        // Config failed to load: callers render their fallback; nothing is logged.
      },
    );
    return () => {
      active = false;
    };
  }, [select]); // callers pass a module-level `select`, so this runs once
  return value;
}
