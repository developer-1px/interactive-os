// Recovery Axis - Focus restoration when target becomes invalid
export { executeRecovery } from "./recoveryHandler";
export {
    DEFAULT_RECOVERY_POLICY,
    type RecoveryPolicy,
    type SiblingPolicy,
    type FallbackPolicy,
    type RecoveryContext,
    type RecoveryResult,
} from "./recoveryTypes";
