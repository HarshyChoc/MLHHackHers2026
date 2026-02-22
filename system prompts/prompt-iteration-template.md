# Prompt Iteration Template

Use this file to track prompt changes in a diff-friendly way before editing live configs.

- Chatbot source prompt currently lives in `apps/api/src/llm.ts`
- ElevenLabs call agent prompt currently lives in `agent_configs/Jeeyan.json`

---

## A) Chatbot (API Chat Coach)

### Current (copy from code)

Source: `apps/api/src/llm.ts`

```text
PASTE CURRENT CHAT SYSTEM PROMPT HERE
```

### Proposed (edit here first)

```text
PASTE PROPOSED CHAT SYSTEM PROMPT HERE
```

### Change Summary

- Goal:
- What changed:
- Why:
- Risks:

### Expected Behavior Changes

- Should improve:
- Might regress:
- What to test:

### Test Prompts (Chat)

1. Habit completion recall:
   - "Did I complete any habits today?"
2. Scheduling request:
   - "Set up weekday call check-ins at 6:30 PM"
3. Manual trigger:
   - "Call me now"
4. Habit action extraction:
   - "I finished my deep work block today"

### Results (after deploy)

- Date tested:
- Model:
- Pass / fail notes:

---

## B) ElevenLabs Agent (Jeeyan)

### Current First Message

Source: `agent_configs/Jeeyan.json`

```text
PASTE CURRENT FIRST MESSAGE HERE
```

### Proposed First Message

```text
PASTE PROPOSED FIRST MESSAGE HERE
```

### Current Main Prompt

Source: `agent_configs/Jeeyan.json`

```text
PASTE CURRENT JEIYAN PROMPT HERE
```

### Proposed Main Prompt

```text
PASTE PROPOSED JEIYAN PROMPT HERE
```

### Voice/Runtime Settings (optional tracking)

- Voice ID:
- LLM:
- Temperature:
- ASR provider:
- Audio format:
- Turn eagerness:
- Soft timeout ack:

### Change Summary

- Goal:
- What changed:
- Why:
- Risks:

### Call Test Script (manual)

1. Greeting feels natural / no dead air
2. Reads today habit status correctly (`get_today_plan`)
3. Logs habit completion correctly (`log_habit`)
4. Creates habit during call (`create_habit`)
5. Deletes/deactivates habit during call (`delete_habit`)
6. Handles unclear audio with clarification (not guessing)

### Results (after live call)

- Date tested:
- Phone route:
- Pass / fail notes:

---

## C) Final Decision

- Adopted: `yes/no`
- Files to update:
  - `apps/api/src/llm.ts`
  - `agent_configs/Jeeyan.json`
  - `tool_configs/*.json` (if tool instructions/headers changed)
- Deployment steps completed:
  - `api`
  - `worker` (if needed)
  - `elevenlabs tools push`
  - `elevenlabs agents push`
