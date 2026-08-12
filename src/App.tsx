import React, { useState } from 'react';
import { ClinicalPathwayId, DeterministicRuleOutput, PatientAnswers } from './types/clinical';
import { PatientAccessContext } from './types/access';
import { SupportedLocale } from './types/i18n';
import { DisclaimerBanner } from './components/common/DisclaimerBanner';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { LanguageSelector } from './components/common/LanguageSelector';
import { LandingPage } from './components/patient/LandingPage';
import { IntakeFlow } from './components/patient/IntakeFlow';
import { AccessLocationStep } from './components/patient/AccessLocationStep';
import { RecommendationScreen } from './components/patient/RecommendationScreen';
import { TeachBackModal } from './components/patient/TeachBackModal';
import { PatientFeedbackForm } from './components/patient/PatientFeedbackForm';
import { StaffDashboard } from './components/staff/StaffDashboard';
import { AuditTrailView } from './components/staff/AuditTrailView';
import { DemoRunner } from './components/demo/DemoRunner';
import { AuditService } from './services/auditService';

export function App() {
  const [activeTab, setActiveTab] = useState<'patient' | 'demo' | 'staff' | 'audit'>('patient');

  // i18n & Accessibility State
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>('en');
  const [isPlainLanguageMode, setIsPlainLanguageMode] = useState<boolean>(false);
  const [interpreterRequested, setInterpreterRequested] = useState<boolean>(false);

  // Patient Intake State Machine
  const [patientStep, setPatientStep] = useState<'landing' | 'intake' | 'access_location' | 'recommendation' | 'teach_back' | 'feedback'>('landing');
  const [selectedPathway, setSelectedPathway] = useState<ClinicalPathwayId>('nail_puncture');
  const [sessionId, setSessionId] = useState<string>(`session-${Date.now()}`);
  const [patientAnswers, setPatientAnswers] = useState<PatientAnswers>({});
  const [ruleOutput, setRuleOutput] = useState<DeterministicRuleOutput | null>(null);
  const [accessContext, setAccessContext] = useState<PatientAccessContext | undefined>(undefined);

  const resetPatientFlow = () => {
    setPatientStep('landing');
    setPatientAnswers({});
    setRuleOutput(null);
    setAccessContext(undefined);
    setSessionId(`session-${Date.now()}`);
  };

  const handleSelectLocale = (locale: SupportedLocale) => {
    setCurrentLocale(locale);
    AuditService.logEvent(sessionId, 'LANGUAGE_SELECTED', { locale });
  };

  const handleSelectInterpreter = (needed: boolean, langName?: string) => {
    setInterpreterRequested(needed);
    AuditService.logEvent(sessionId, 'COMMUNICATION_SUPPORT_SELECTED', { needed, langName });
  };

  const handleSelectPathway = (pathway: ClinicalPathwayId) => {
    setSelectedPathway(pathway);
    setSessionId(`session-${Date.now()}`);
    setPatientAnswers({});
    setRuleOutput(null);
    setAccessContext(undefined);
    setPatientStep('intake');
  };

  const handleCompleteIntake = (answers: PatientAnswers, output: DeterministicRuleOutput) => {
    setPatientAnswers(answers);
    setRuleOutput(output);
    // Display recommended course of action FIRST before access & navigation engine
    setPatientStep('recommendation');
  };

  const handleCompleteAccessContext = (ctx: PatientAccessContext) => {
    setAccessContext(ctx);
    setPatientStep('recommendation');
  };

  const handleLoadDemoCase = (
    scenario: ClinicalPathwayId,
    answers: Record<string, any>,
    output: DeterministicRuleOutput,
    demoAccessCtx?: PatientAccessContext,
    demoLocale?: SupportedLocale
  ) => {
    setSelectedPathway(scenario);
    setPatientAnswers(answers);
    setRuleOutput(output);
    setAccessContext(demoAccessCtx);
    if (demoLocale) setCurrentLocale(demoLocale);
    setSessionId(`demo-session-${Date.now()}`);
    setActiveTab('patient');
    setPatientStep('recommendation');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Academic Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Language & Communication Accessibility Selector Bar */}
      <LanguageSelector
        currentLocale={currentLocale}
        onSelectLocale={handleSelectLocale}
        isPlainLanguageMode={isPlainLanguageMode}
        onTogglePlainLanguage={setIsPlainLanguageMode}
        onSelectInterpreter={handleSelectInterpreter}
      />

      {/* Primary Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        resetPatientFlow={resetPatientFlow}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'patient' && (
          <>
            {patientStep === 'landing' && (
              <LandingPage onSelectPathway={handleSelectPathway} />
            )}

            {patientStep === 'intake' && (
              <IntakeFlow
                scenario={selectedPathway}
                sessionId={sessionId}
                onCompleteIntake={handleCompleteIntake}
                onBackToLanding={resetPatientFlow}
              />
            )}

            {patientStep === 'access_location' && (
              <AccessLocationStep
                sessionId={sessionId}
                onCompleteAccessContext={handleCompleteAccessContext}
                onSkipAccessContext={() => setPatientStep('recommendation')}
              />
            )}

            {patientStep === 'recommendation' && ruleOutput && (
              <RecommendationScreen
                scenario={selectedPathway}
                answers={patientAnswers}
                ruleOutput={ruleOutput}
                accessContext={accessContext}
                locale={currentLocale}
                isPlainLanguageMode={isPlainLanguageMode}
                onProceedToAccessNavigation={() => setPatientStep('access_location')}
                onProceedToTeachBack={() => setPatientStep('teach_back')}
              />
            )}

            {patientStep === 'teach_back' && ruleOutput && (
              <TeachBackModal
                recommendedDisposition={ruleOutput.disposition}
                locale={currentLocale}
                onProceedToFeedback={() => setPatientStep('feedback')}
              />
            )}

            {patientStep === 'feedback' && ruleOutput && (
              <PatientFeedbackForm
                sessionId={sessionId}
                scenario={selectedPathway}
                disposition={ruleOutput.disposition}
                ruleId={ruleOutput.ruleId}
                ruleVersion={ruleOutput.ruleVersion}
                onFeedbackSubmitted={resetPatientFlow}
              />
            )}
          </>
        )}

        {activeTab === 'demo' && (
          <DemoRunner onLoadDemoCase={handleLoadDemoCase} />
        )}

        {activeTab === 'staff' && (
          <StaffDashboard />
        )}

        {activeTab === 'audit' && (
          <AuditTrailView />
        )}
      </main>

      {/* Academic Footer */}
      <Footer />
    </div>
  );
}

export default App;
