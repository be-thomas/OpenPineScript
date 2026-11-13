/**
 * Pine Script v6 runtime.
 *
 * Like every version runtime before it, this is a re-export. v6 changes more
 * run-time BEHAVIOUR than any previous version — bools cannot be `na`,
 * `timeframe.period` always carries a multiplier, negative collection indices
 * count from the end, and two of the broker's rules change — but none of that
 * is a second implementation. Each is carried the way v3's `securityLookahead`
 * already is:
 *
 *   - as a FLAG on the v6 LanguageProfile, read at the one place that cares
 *     (transpiler/common/profiles/index.ts names the consumer for each)
 *   - or, for the two broker rules, as `V6Broker extends V5Broker` —
 *     runtime/v1/broker/index.ts
 *
 * Both keep one implementation serving every version, which is the standing
 * design here: dev-docs/00-architecture-assessment.md §5.6, and the note at
 * the top of ../v5/index.ts.
 *
 * A v6-only run-time behaviour with no earlier counterpart would be added
 * HERE. There is not one yet.
 */
export * from "../v5/index";
