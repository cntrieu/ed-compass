import React, { useState } from 'react';
import { SupportedLocale } from '../../types/i18n';
import { Languages, HelpCircle, Phone, Volume2, Check } from 'lucide-react';

interface LanguageSelectorProps {
  currentLocale: SupportedLocale;
  onSelectLocale: (locale: SupportedLocale) => void;
  isPlainLanguageMode: boolean;
  onTogglePlainLanguage: (enabled: boolean) => void;
  onSelectInterpreter: (needed: boolean, languageName?: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLocale,
  onSelectLocale,
  isPlainLanguageMode,
  onTogglePlainLanguage,
  onSelectInterpreter
}) => {
  const [showOtherModal, setShowOtherModal] = useState(false);
  const [otherLangInput, setOtherLangInput] = useState('');
  const [showCommModal, setShowCommModal] = useState(false);

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white text-xs px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Language Selection Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold mr-1">
            <Languages className="w-4 h-4 text-sky-400" />
            <span>Language:</span>
          </div>

          <button
            onClick={() => onSelectLocale('en')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              currentLocale === 'en'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            English
          </button>

          <button
            onClick={() => onSelectLocale('fr')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              currentLocale === 'fr'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Français
          </button>

          <button
            onClick={() => setShowOtherModal(true)}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              currentLocale === 'other'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Other language...
          </button>

          <button
            onClick={() => setShowCommModal(true)}
            className="px-2.5 py-1 rounded-md font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Communication Support</span>
          </button>
        </div>

        {/* Plain Language Mode Toggle */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-md border border-slate-700 text-xs text-slate-200">
            <input
              type="checkbox"
              checked={isPlainLanguageMode}
              onChange={e => onTogglePlainLanguage(e.target.checked)}
              className="rounded border-slate-600 text-sky-500 focus:ring-sky-400 w-3.5 h-3.5"
            />
            <span className="font-semibold">Use simpler words</span>
          </label>
        </div>
      </div>

      {/* Other Language Modal */}
      {showOtherModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold flex items-center gap-2 border-b border-slate-800 pb-2">
              <Languages className="w-5 h-5 text-purple-400" />
              <span>Other Language Navigation Support</span>
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              ED Compass does not yet have a clinically validated translation for this language. <strong>HealthLink BC 8-1-1 offers translation support in more than 130 languages.</strong>
            </p>

            <div className="space-y-1">
              <label className="block text-[11px] text-slate-400">Preferred Language Name (for navigator note):</label>
              <input
                type="text"
                value={otherLangInput}
                onChange={e => setOtherLangInput(e.target.value)}
                placeholder="e.g. Punjabi, Mandarin, Arabic, Spanish..."
                className="w-full text-xs p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div className="bg-amber-950/60 border border-amber-500/40 p-3 rounded-lg text-[11px] text-amber-200 flex items-center justify-between">
              <span>Call 8-1-1 for 24/7 interpreter assistance</span>
              <a
                href="tel:811"
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-3 py-1 rounded flex items-center gap-1 shrink-0"
              >
                <Phone className="w-3.5 h-3.5" /> Call 8-1-1
              </a>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  onSelectLocale('other');
                  onSelectInterpreter(true, otherLangInput);
                  setShowOtherModal(false);
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
              >
                Continue in English with 8-1-1 Translation Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Communication Support Modal */}
      {showCommModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="text-base font-bold flex items-center gap-2 border-b border-slate-800 pb-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <span>Communication & Accessibility Support</span>
            </h3>

            <p className="text-xs text-slate-300">
              Would an interpreter, TTY, or communication support help you access care?
            </p>

            <div className="space-y-2">
              {[
                'Spoken-language interpreter',
                'Sign-language / Deaf support (TTY 7-1-1)',
                'Written information / Plain language',
                'Trusted helper accompanying me'
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectInterpreter(true, item);
                    setShowCommModal(false);
                  }}
                  className="w-full text-left p-3 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold hover:border-amber-400 transition-colors flex items-center justify-between"
                >
                  <span>{item}</span>
                  <Check className="w-4 h-4 text-amber-400" />
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowCommModal(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
