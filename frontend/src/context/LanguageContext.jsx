import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, speakNarration, stopNarration } from "../translations";

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("telecare_lang") || "en";
  });
  const [isSpeaking, setIsSpeaking] = useState(false);

  const setLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem("telecare_lang", newLang);
    stopNarration();
    setIsSpeaking(false);
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations["en"]?.[key] || key;
  };

  const readAloud = (text) => {
    if (isSpeaking) {
      stopNarration();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const success = speakNarration(text, lang, () => {
        setIsSpeaking(false);
      });
      if (!success) setIsSpeaking(false);
    }
  };

  // Stop narration on unmount or navigation
  useEffect(() => {
    return () => stopNarration();
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t, readAloud, isSpeaking }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

