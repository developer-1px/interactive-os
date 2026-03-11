/** Mock for virtual:agent-activity — empty activity log for tests */
const agentActivity: Array<{
  ts: string;
  session: string;
  tool: string;
  detail: string;
}> = [];

export default agentActivity;
