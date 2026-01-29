/* eslint-disable */
// Skip check in Docker or CI environments
if (process.env.SKIP_PNPM_CHECK === 'true') {
    process.exit(0);
}

const ua = process.env.npm_config_user_agent || '';

if (!ua.includes('pnpm')) {
    console.error(`
\x1b[31m##########################################################\x1b[0m
\x1b[31m#                                                        #\x1b[0m
\x1b[31m#  🚫 THIS PROJECT USES PNPM ONLY                        #\x1b[0m
\x1b[31m#                                                        #\x1b[0m
\x1b[31m#  👉 Please run:                                        #\x1b[0m
\x1b[31m#     pnpm install                                       #\x1b[0m
\x1b[31m#                                                        #\x1b[0m
\x1b[31m#  If pnpm is not available:                             #\x1b[0m
\x1b[31m#     corepack enable (Run in Admin terminal)            #\x1b[0m
\x1b[31m#     Or: npm install -g pnpm                            #\x1b[0m
\x1b[31m#                                                        #\x1b[0m
\x1b[31m##########################################################\x1b[0m
`);
    process.exit(1);
}
