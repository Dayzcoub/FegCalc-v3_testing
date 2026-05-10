// Future ES module entrypoint.
// Runtime-compatible modules can also attach APIs to window.FEGModules for the legacy bridge.
// v3.6.x migrates features from legacy-app.js into these modules incrementally.
export * as FormatUtils from './FormatUtils.js';
export * as DomUtils from './DomUtils.js';
export * as AppBootstrap from './AppBootstrap.js';
export * as TrussBootstrap from './TrussBootstrap.js';
export * as TrussState from './TrussState.js';
export * as TrussProjectsUI from './TrussProjectsUI.js';
export * as StageGridState from './StageGridState.js';
export * as StageCalculator from './StageCalculator.js';
export * as TrussBlockConstructor from './TrussBlockConstructor.js';
export * as PdfGenerator from './PdfGenerator.js';
export * as TransportSettings from './TransportSettings.js';
export * as AppSettings from './AppSettings.js';
export * as SupabaseStorage from './SupabaseStorage.js';
export * as ProjectStorage from './ProjectStorage.js';
export * as ProjectManager from './ProjectManager.js';
export * as ClientsStorage from './ClientsStorage.js';
export * as ClientsManager from './ClientsManager.js';
export * as ClientsUI from './ClientsUI.js';
export * as PwaManager from './PwaManager.js';
export * as NavigationManager from './NavigationManager.js';
export * as ModalManager from './ModalManager.js';
export * as ToastManager from './ToastManager.js';
export * as CalibrationManager from './CalibrationManager.js';
export * as PriceWeightSettings from './PriceWeightSettings.js';
export * as LoadChecker from './LoadChecker.js';
