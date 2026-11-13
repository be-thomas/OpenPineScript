/**
 * mock_run/v2/run.ts - CLI Runner for OpenPineScript v2 (the `openpinescript` bin).
 *
 * Usage:
 *   npm run opsv2 -- <script.pine> --data <data.csv> [flags]
 *
 * The flags, the output and everything else are documented in cli_main.ts, which holds the code.
 */

import { main, onFatal } from "./cli_main";

main().catch(onFatal);
