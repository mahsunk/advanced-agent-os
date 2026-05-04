export function getRuntimeConfig() {
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    apiPort: Number(process.env.API_PORT ?? 3000),
    openAiApiKeyConfigured: Boolean(process.env.OPENAI_API_KEY),
    openAiBaseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    defaultModel: process.env.DEFAULT_MODEL ?? 'gpt-4o-mini',
    allowRealCommands: process.env.ALLOW_REAL_COMMANDS === 'true',
    commandSandboxMode: process.env.COMMAND_SANDBOX_MODE ?? 'dry-run',
    browserAutomationMode: process.env.BROWSER_AUTOMATION_MODE ?? 'dry-run',
    memoryMode: process.env.MEMORY_MODE ?? 'in-memory'
  };
}
