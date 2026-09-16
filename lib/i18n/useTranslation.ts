"use client";

import { useCallback, useEffect, useState } from "react";
import en from "@/messages/en.json";
import rw from "@/messages/rw.json";

export type Locale = "en" | "rw";

type Messages = typeof en;
type DotPath<T, Prefix extends string = ""> = {
  [K in keyof T]: T[K] extends Record<string, unknown>
    ? DotPath<T[K], `${Prefix}${K & string}.`>
    : `${Prefix}${K & string}`;
}[keyof T];

export type MessageKey = DotPath<Messages>;

const DICTIONARIES: Record<Locale, Record<string, unknown>> = { en, rw };
const COOKIE_KEY = "runda_locale";

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((r) => r.startsWith(`${name}=`))
    ?.split("=")[1];
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=${60 * 60 * 24 * 365}`;
}

// Resolve a dot-path key like "dashboard.continue_learning" from a nested object
function resolve(obj: Record<string, unknown>, key: string): string {
  const parts = key.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return key;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : key;
}

// Simple template interpolation: replace {key} with values
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`
  );
}

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = getCookie(COOKIE_KEY) as Locale | undefined;
    if (saved === "en" || saved === "rw") setLocaleState(saved);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setCookie(COOKIE_KEY, next);
  }, []);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>): string => {
      const dict = DICTIONARIES[locale] as Record<string, unknown>;
      const raw = resolve(dict, key);
      return interpolate(raw, vars);
    },
    [locale]
  );

  return { t, locale, setLocale };
}
