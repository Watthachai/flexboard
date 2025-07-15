/**
 * Accessibility Features for Dashboard
 * Screen reader support, keyboard navigation, and WCAG compliance
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Type,
  Contrast,
  Navigation,
  Keyboard,
  Accessibility,
  Check,
  AlertCircle,
} from "lucide-react";

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNav: boolean;
  focusVisible: boolean;
  announcements: boolean;
  colorBlindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia";
}

interface AccessibilityFeature {
  id: keyof AccessibilitySettings;
  name: string;
  description: string;
  icon: any;
  shortcut?: string;
}

const ACCESSIBILITY_FEATURES: AccessibilityFeature[] = [
  {
    id: "highContrast",
    name: "High Contrast",
    description: "Increase color contrast for better visibility",
    icon: Contrast,
    shortcut: "Alt+H",
  },
  {
    id: "largeText",
    name: "Large Text",
    description: "Increase font size for better readability",
    icon: Type,
    shortcut: "Alt+T",
  },
  {
    id: "reduceMotion",
    name: "Reduce Motion",
    description: "Minimize animations and transitions",
    icon: Eye,
    shortcut: "Alt+M",
  },
  {
    id: "screenReader",
    name: "Screen Reader",
    description: "Enable enhanced screen reader support",
    icon: Volume2,
    shortcut: "Alt+S",
  },
  {
    id: "keyboardNav",
    name: "Keyboard Navigation",
    description: "Enhanced keyboard navigation support",
    icon: Keyboard,
    shortcut: "Alt+K",
  },
  {
    id: "focusVisible",
    name: "Visible Focus",
    description: "Enhanced focus indicators",
    icon: Navigation,
    shortcut: "Alt+F",
  },
  {
    id: "announcements",
    name: "Announcements",
    description: "Audio announcements for important changes",
    icon: Volume2,
    shortcut: "Alt+A",
  },
];

export default function AccessibilityPanel() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    screenReader: false,
    keyboardNav: true,
    focusVisible: true,
    announcements: false,
    colorBlindMode: "none",
  });

  const [announcement, setAnnouncement] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const announcementRef = useRef<HTMLDivElement>(null);

  // Load accessibility preferences from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("accessibility-settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      setSettings((prev) => ({ ...prev, reduceMotion: true }));
    }

    // Check for prefers-contrast
    const prefersHighContrast = window.matchMedia(
      "(prefers-contrast: high)"
    ).matches;
    if (prefersHighContrast) {
      setSettings((prev) => ({ ...prev, highContrast: true }));
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("accessibility-settings", JSON.stringify(settings));
    applyAccessibilitySettings(settings);
  }, [settings]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case "h":
            e.preventDefault();
            toggleSetting("highContrast");
            break;
          case "t":
            e.preventDefault();
            toggleSetting("largeText");
            break;
          case "m":
            e.preventDefault();
            toggleSetting("reduceMotion");
            break;
          case "s":
            e.preventDefault();
            toggleSetting("screenReader");
            break;
          case "k":
            e.preventDefault();
            toggleSetting("keyboardNav");
            break;
          case "f":
            e.preventDefault();
            toggleSetting("focusVisible");
            break;
          case "a":
            e.preventDefault();
            toggleSetting("announcements");
            break;
          case "0":
            e.preventDefault();
            setPanelOpen(!panelOpen);
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [panelOpen]);

  const toggleSetting = (setting: keyof AccessibilitySettings) => {
    setSettings((prev) => {
      const newValue = !prev[setting];
      const featureName = ACCESSIBILITY_FEATURES.find(
        (f) => f.id === setting
      )?.name;

      if (settings.announcements) {
        announce(`${featureName} ${newValue ? "enabled" : "disabled"}`);
      }

      return { ...prev, [setting]: newValue };
    });
  };

  const applyAccessibilitySettings = (settings: AccessibilitySettings) => {
    const root = document.documentElement;

    // High contrast
    if (settings.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Large text
    if (settings.largeText) {
      root.classList.add("large-text");
    } else {
      root.classList.remove("large-text");
    }

    // Reduced motion
    if (settings.reduceMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    // Focus visible
    if (settings.focusVisible) {
      root.classList.add("focus-visible");
    } else {
      root.classList.remove("focus-visible");
    }

    // Color blind mode
    root.classList.remove("protanopia", "deuteranopia", "tritanopia");
    if (settings.colorBlindMode !== "none") {
      root.classList.add(settings.colorBlindMode);
    }
  };

  const announce = (message: string) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(""), 3000);
  };

  const resetSettings = () => {
    const defaultSettings: AccessibilitySettings = {
      highContrast: false,
      largeText: false,
      reduceMotion: false,
      screenReader: false,
      keyboardNav: true,
      focusVisible: true,
      announcements: false,
      colorBlindMode: "none",
    };
    setSettings(defaultSettings);
    announce("Accessibility settings reset to defaults");
  };

  return (
    <>
      {/* Accessibility Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPanelOpen(!panelOpen)}
        className="fixed bottom-4 right-4 z-50 bg-white shadow-lg"
        aria-label="Open accessibility options"
        title="Accessibility Options (Alt+0)"
      >
        <Accessibility className="w-4 h-4" />
      </Button>

      {/* Accessibility Panel */}
      {panelOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-5/6 overflow-y-auto m-4">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Accessibility Options
                  </h2>
                  <p className="text-gray-600">
                    Customize your dashboard experience
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Close accessibility panel"
                >
                  ✕
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSetting("highContrast")}
                    className={
                      settings.highContrast ? "bg-blue-50 border-blue-300" : ""
                    }
                  >
                    <Contrast className="w-4 h-4 mr-1" />
                    High Contrast
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSetting("largeText")}
                    className={
                      settings.largeText ? "bg-blue-50 border-blue-300" : ""
                    }
                  >
                    <Type className="w-4 h-4 mr-1" />
                    Large Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSetting("reduceMotion")}
                    className={
                      settings.reduceMotion ? "bg-blue-50 border-blue-300" : ""
                    }
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Reduce Motion
                  </Button>
                </div>
              </div>

              {/* Detailed Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Detailed Settings</h3>

                {ACCESSIBILITY_FEATURES.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <feature.icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium">{feature.name}</div>
                        <div className="text-sm text-gray-600">
                          {feature.description}
                        </div>
                        {feature.shortcut && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {feature.shortcut}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant={settings[feature.id] ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleSetting(feature.id)}
                      aria-pressed={Boolean(settings[feature.id])}
                    >
                      {settings[feature.id] ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        "Enable"
                      )}
                    </Button>
                  </div>
                ))}

                {/* Color Blind Support */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <Eye className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium">Color Blind Support</div>
                      <div className="text-sm text-gray-600">
                        Adjust colors for different types of color blindness
                      </div>
                    </div>
                  </div>
                  <select
                    value={settings.colorBlindMode}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        colorBlindMode: e.target.value as any,
                      }))
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                    aria-label="Color blind mode"
                  >
                    <option value="none">None</option>
                    <option value="protanopia">Protanopia (Red-blind)</option>
                    <option value="deuteranopia">
                      Deuteranopia (Green-blind)
                    </option>
                    <option value="tritanopia">Tritanopia (Blue-blind)</option>
                  </select>
                </div>
              </div>

              {/* Keyboard Shortcuts Help */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Keyboard Shortcuts</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Alt + 0: Toggle accessibility panel</div>
                  <div>Alt + H: Toggle high contrast</div>
                  <div>Alt + T: Toggle large text</div>
                  <div>Alt + M: Toggle reduced motion</div>
                  <div>Tab / Shift+Tab: Navigate between elements</div>
                  <div>Enter / Space: Activate buttons and controls</div>
                  <div>Escape: Close modals and dropdowns</div>
                </div>
              </div>

              {/* Reset Button */}
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={resetSettings}>
                  Reset to Defaults
                </Button>
                <Button onClick={() => setPanelOpen(false)}>
                  Apply Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Screen Reader Announcements */}
      <div
        ref={announcementRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Skip Links */}
      <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50">
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            const main =
              document.querySelector("main") ||
              document.querySelector('[role="main"]');
            if (main) {
              (main as HTMLElement).focus();
            }
          }}
        >
          Skip to main content
        </Button>
      </div>

      {/* CSS for accessibility features */}
      <style jsx global>{`
        /* High Contrast Mode */
        .high-contrast {
          --bg-primary: #000000;
          --bg-secondary: #ffffff;
          --text-primary: #ffffff;
          --text-secondary: #000000;
          --border-primary: #ffffff;
          --accent-primary: #ffff00;
        }

        .high-contrast * {
          background-color: var(--bg-primary) !important;
          color: var(--text-primary) !important;
          border-color: var(--border-primary) !important;
        }

        .high-contrast button,
        .high-contrast input,
        .high-contrast select {
          background-color: var(--bg-secondary) !important;
          color: var(--text-secondary) !important;
        }

        /* Large Text Mode */
        .large-text {
          font-size: 125% !important;
        }

        .large-text * {
          font-size: inherit !important;
        }

        /* Reduced Motion */
        .reduce-motion *,
        .reduce-motion *::before,
        .reduce-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }

        /* Enhanced Focus Indicators */
        .focus-visible *:focus {
          outline: 3px solid #0066cc !important;
          outline-offset: 2px !important;
        }

        /* Color Blind Filters */
        .protanopia {
          filter: url("#protanopia-filter");
        }

        .deuteranopia {
          filter: url("#deuteranopia-filter");
        }

        .tritanopia {
          filter: url("#tritanopia-filter");
        }

        /* Screen reader only content */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .sr-only.focus:not(.sr-only) {
          position: static;
          width: auto;
          height: auto;
          padding: inherit;
          margin: inherit;
          overflow: visible;
          clip: auto;
          white-space: normal;
        }
      `}</style>

      {/* SVG Filters for Color Blind Support */}
      <svg style={{ display: "none" }}>
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix
              values="0.567, 0.433, 0,     0, 0
                                  0.558, 0.442, 0,     0, 0
                                  0,     0.242, 0.758, 0, 0
                                  0,     0,     0,     1, 0"
            />
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix
              values="0.625, 0.375, 0,   0, 0
                                  0.7,   0.3,   0,   0, 0
                                  0,     0.3,   0.7, 0, 0
                                  0,     0,     0,   1, 0"
            />
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix
              values="0.95, 0.05,  0,     0, 0
                                  0,    0.433, 0.567, 0, 0
                                  0,    0.475, 0.525, 0, 0
                                  0,    0,     0,     1, 0"
            />
          </filter>
        </defs>
      </svg>
    </>
  );
}
