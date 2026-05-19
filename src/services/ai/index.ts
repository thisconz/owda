/**
 * OWDA AI Service Central Hub
 * 
 * Single source of truth for the AI Engine. Exposes orchestration pipelines,
 * runtime routing, capabilities, and unified error models to the presentation layer.
 */

// 1. Export Public Orchestration Pipelines
export { orchestrateChemistryAnalysis } from "./orchestration/explainReaction";

// 2. Export Capabilities & Smart Routers
export { 
  selectChemistryModel 
} from "./models/router";
export { 
  modelHasCapability, 
  findModelsByCapabilities, 
  selectBestModelByCapability,
  type ModelCapabilityTag 
} from "./models/capabilities";

// 3. Export Unified Core Errors for UI Catching Blocks
export { 
  AIError, 
  AIParseError, 
  AITimeoutError, 
  AIRateLimitError, 
  AIHTTPError 
} from "./core/errors";

// 4. Export Re-mapped Core Structures & Capabilities Schema
export { 
  AI_MODELS,
  type AIModelCapabilities,
  type AIModelId,
  type AIModelDefinition
} from "./models/registry";