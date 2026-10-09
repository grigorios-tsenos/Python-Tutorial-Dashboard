import type { CodingGuide } from '../guided'

export const LANGGRAPH_GUIDES: Record<string, CodingGuide> = {
  "lg-state": {
    "steps": [
      {
        "title": "Merge without mutation",
        "instruction": "Define `merge` with parameters `state` and `update`, in that order. It should produce a new dictionary containing all state fields with update fields taking precedence where keys overlap. Neither input may be modified.",
        "code": "def merge(state, update):\n    return {**state, **update}",
        "check": "test(\"Merge without mutation\", lambda: merge({\"a\":1, \"b\":2}, {\"b\":9}) == {\"a\":1, \"b\":9}, \"The update wins for b while a is retained.\")",
        "expected": "The update wins for b while a is retained.",
        "reassurance": "This merge keeps earlier fields available to the next step."
      },
      {
        "title": "Start the state",
        "instruction": "Create a dictionary named `state` with one key, `question`, whose text is “What is a vector store?”. The setup `research` helper accepts a state and produces a `facts` update; `draft` accepts an enriched state and produces a `draft` update.",
        "code": "state = {\"question\": \"What is a vector store?\"}",
        "check": "test(\"Start the state\", lambda: state == {\"question\":\"What is a vector store?\"}, \"state contains only the original question.\")",
        "expected": "state contains only the original question.",
        "reassurance": "This small dictionary is enough to begin."
      },
      {
        "title": "Run research and keep its facts",
        "instruction": "Use `research` to obtain an update from `state`, then combine that update with the original state using `merge`. Store the enriched dictionary in `final`, keeping `state` unchanged.",
        "code": "final = merge(state, research(state))",
        "check": "test(\"Run research and keep its facts\", lambda: final[\"facts\"] == \"3 docs about: What is a vector store?\" and state == {\"question\":\"What is a vector store?\"}, \"final has the question and facts; state is unchanged.\")",
        "expected": "final has the question and facts; state is unchanged.",
        "reassurance": "Research added information without damaging the original state."
      },
      {
        "title": "Draft from the enriched state",
        "instruction": "Let `draft` read the enriched `final` state, then merge its update back into `final`. Preserve both the original question and the research facts while adding the draft.",
        "code": "final = merge(final, draft(final))",
        "check": "test(\"Draft from the enriched state\", lambda: final[\"draft\"] == \"Answer using 3 docs about: What is a vector store?\" and \"facts\" in final, \"The draft includes the facts from research.\")",
        "expected": "The draft includes the facts from research.",
        "reassurance": "The second step can see the work from the first."
      },
      {
        "title": "Print the final state",
        "instruction": "Display `final`, then check the chapter. Follow how the question, research facts, and draft accumulated through separate updates.",
        "code": "print(final)",
        "check": "",
        "expected": "The dictionary contains question, facts, and draft.",
        "reassurance": "You have built the state-update sequence that a graph will automate."
      }
    ],
    "setup": "def research(state):\n    return {\"facts\": f\"3 docs about: {state['question']}\"}\n\ndef draft(state):\n    return {\"draft\": f\"Answer using {state['facts']}\"}"
  },
  "lg-first": {
    "steps": [
      {
        "title": "Create the graph",
        "instruction": "Create an empty `StateGraph` named `graph` using the setup `State` schema. The setup provides `write_draft`, which reads `question` and produces `draft`, and `polish`, which reads `draft` and produces `final`. You will register them before connecting their execution order.",
        "code": "graph = StateGraph(State)",
        "check": "test(\"Create the graph\", lambda: graph.nodes == {} and graph.edges == [], \"The graph has no nodes or edges yet.\")",
        "expected": "The graph has no nodes or edges yet.",
        "reassurance": "An empty graph is expected here; we will connect it before compiling."
      },
      {
        "title": "Register the drafting node",
        "instruction": "Register the provided `write_draft` function on `graph` under the node name `write_draft`. A graph’s `add_node` method associates a node name with the function that computes its state update.",
        "code": "graph.add_node(\"write_draft\", write_draft)",
        "check": "test(\"Register the drafting node\", lambda: graph.nodes[\"write_draft\"]({\"question\":\"Q\"}) == {\"draft\":\"Answer to 'Q': it depends.\"}, \"write_draft produces a draft update.\")",
        "expected": "write_draft produces a draft update.",
        "reassurance": "The graph now knows what the drafting node does."
      },
      {
        "title": "Register the polishing node",
        "instruction": "Register the provided `polish` function on `graph` under the node name `polish`. This function makes the draft uppercase and supplies the final answer.",
        "code": "graph.add_node(\"polish\", polish)",
        "check": "test(\"Register the polishing node\", lambda: graph.nodes[\"polish\"]({\"draft\":\"hello\"}) == {\"final\":\"HELLO\"}, \"polish produces the uppercase final field.\")",
        "expected": "polish produces the uppercase final field.",
        "reassurance": "Both functions are registered and verified independently."
      },
      {
        "title": "Enter at write_draft",
        "instruction": "Make `write_draft` the first node by adding a directed edge from `START` to it. A graph’s `add_edge` method takes the source first and destination second.",
        "code": "graph.add_edge(START, \"write_draft\")",
        "check": "test(\"Enter at write_draft\", lambda: (START, \"write_draft\") in graph.edges, \"START points to write_draft.\")",
        "expected": "START points to write_draft.",
        "reassurance": "The graph has its entry point."
      },
      {
        "title": "Continue to polish",
        "instruction": "Connect `write_draft` to `polish` so polishing receives the state after drafting has added its update.",
        "code": "graph.add_edge(\"write_draft\", \"polish\")",
        "check": "test(\"Continue to polish\", lambda: (\"write_draft\", \"polish\") in graph.edges, \"write_draft points to polish.\")",
        "expected": "write_draft points to polish.",
        "reassurance": "The sequence now preserves the intended node order."
      },
      {
        "title": "Finish after polish",
        "instruction": "Connect `polish` to `END` so the graph stops after the final answer is ready.",
        "code": "graph.add_edge(\"polish\", END)",
        "check": "test(\"Finish after polish\", lambda: (\"polish\", END) in graph.edges, \"polish points to END.\")",
        "expected": "polish points to END.",
        "reassurance": "There is now a complete path from entry to exit."
      },
      {
        "title": "Compile the connected graph",
        "instruction": "Compile `graph` and save the runnable result as `app`. Compilation prepares the connected graph for invocation without submitting a question yet.",
        "code": "app = graph.compile()",
        "check": "test(\"Compile the connected graph\", lambda: callable(app.invoke), \"app can invoke the connected graph.\")",
        "expected": "app can invoke the connected graph.",
        "reassurance": "Compilation succeeded; the graph is ready for input."
      },
      {
        "title": "Run one question",
        "instruction": "Invoke `app` with a `question` field containing “Should I use LangGraph?”. Save the returned state in `result` so you can inspect both the draft and final answer.",
        "code": "result = app.invoke({\"question\": \"Should I use LangGraph?\"})",
        "check": "test(\"Run one question\", lambda: result[\"final\"] == \"ANSWER TO 'SHOULD I USE LANGGRAPH?': IT DEPENDS.\", \"The final field contains the polished uppercase answer.\")",
        "expected": "The final field contains the polished uppercase answer.",
        "reassurance": "Both nodes ran and their updates reached the result."
      },
      {
        "title": "Inspect and verify the result",
        "instruction": "Display the `final` field from `result`, then check the chapter. Confirm that the draft remains in the result even after the polishing node adds its answer.",
        "code": "print(result[\"final\"])",
        "check": "",
        "expected": "The uppercase answer is printed and the full chapter checks pass.",
        "reassurance": "You have verified the graph output as well as its wiring."
      }
    ],
    "setup": "from typing import TypedDict\nfrom langgraph.graph import StateGraph, START, END\n\nclass State(TypedDict):\n    question: str\n    draft: str\n    final: str\n\ndef write_draft(state):\n    return {\"draft\": f\"Answer to '{state['question']}': it depends.\"}\n\ndef polish(state):\n    return {\"final\": state[\"draft\"].upper()}"
  },
  "lg-loop": {
    "steps": [
      {
        "title": "Stop after approval",
        "instruction": "Define `route` with one parameter, `state`. Approved drafts select `END`. Unapproved drafts select the node name `write`, unless `attempts` has reached 5: then give up and select `END` so the loop can never run forever. The setup writer increments `attempts`; the reviewer approves the third attempt and later.",
        "code": "def route(state):\n    if state[\"approved\"] or state[\"attempts\"] >= 5:\n        return END\n    return \"write\"",
        "check": "test(\"Stop after approval\", lambda: route({\"approved\": True, \"attempts\": 1}) == END and route({\"approved\": False, \"attempts\": 2}) == \"write\" and route({\"approved\": False, \"attempts\": 5}) == END, \"Approved routes to END; unapproved routes back to write until the fifth attempt, which also ends.\")",
        "expected": "Approved routes to END; unapproved routes back to write until the fifth attempt, which also ends.",
        "reassurance": "The stop condition is verified before running any loop."
      },
      {
        "title": "Create the graph",
        "instruction": "Create an empty `StateGraph` named `g` with the setup `State` schema, which carries `attempts`, `draft`, and `approved`.",
        "code": "g = StateGraph(State)",
        "check": "test(\"Create the graph\", lambda: g.nodes == {}, \"The revision graph starts empty.\")",
        "expected": "The revision graph starts empty.",
        "reassurance": "We can now add its two jobs."
      },
      {
        "title": "Add the writer",
        "instruction": "Register the setup `write` function on `g` as the node named `write`. It creates the next draft and advances the attempt count.",
        "code": "g.add_node(\"write\", write)",
        "check": "test(\"Add the writer\", lambda: g.nodes[\"write\"]({\"attempts\":0})[\"draft\"] == \"draft v1\", \"The first writer call creates draft v1.\")",
        "expected": "The first writer call creates draft v1.",
        "reassurance": "Writing advances the attempt count."
      },
      {
        "title": "Add the reviewer",
        "instruction": "Register the setup `review` function on `g` as the node named `review`. It updates the approval flag using the attempt count.",
        "code": "g.add_node(\"review\", review)",
        "check": "test(\"Add the reviewer\", lambda: g.nodes[\"review\"]({\"attempts\":3}) == {\"approved\":True}, \"The reviewer approves attempt 3.\")",
        "expected": "The reviewer approves attempt 3.",
        "reassurance": "The writer and reviewer now agree on when a draft can finish."
      },
      {
        "title": "Enter the writer",
        "instruction": "Add a directed edge from `START` to `write` so each run begins by producing a draft.",
        "code": "g.add_edge(START, \"write\")",
        "check": "test(\"Enter the writer\", lambda: (START,\"write\") in g.edges, \"START points to write.\")",
        "expected": "START points to write.",
        "reassurance": "Every run begins by making a draft."
      },
      {
        "title": "Review each draft",
        "instruction": "Connect `write` to `review` so every new draft is reviewed before deciding whether to continue.",
        "code": "g.add_edge(\"write\", \"review\")",
        "check": "test(\"Review each draft\", lambda: (\"write\",\"review\") in g.edges, \"write points to review.\")",
        "expected": "write points to review.",
        "reassurance": "Each new draft will be reviewed before routing."
      },
      {
        "title": "Attach the conditional route",
        "instruction": "Attach `route` as the conditional router after `review`. Use the graph’s `add_conditional_edges` method to associate the source, router, and destination mapping. The router’s `write` result should lead to the `write` node, and its `END` result should finish the run.",
        "code": "g.add_conditional_edges(\"review\", route, {\"write\": \"write\", END: END})",
        "check": "test(\"Attach the conditional route\", lambda: len(g.conditional) == 1 and g.conditional[0][1]({\"approved\":True}) == END, \"The review router knows the write and END destinations.\")",
        "expected": "The review router knows the write and END destinations.",
        "reassurance": "The loop can repeat or finish according to state."
      },
      {
        "title": "Compile the loop",
        "instruction": "Compile `g` and keep the runnable as `app`. You now have a repeating path with a state-based exit.",
        "code": "app = g.compile()",
        "check": "test(\"Compile the loop\", lambda: callable(app.invoke), \"app exposes invoke.\")",
        "expected": "app exposes invoke.",
        "reassurance": "The graph is valid and ready for its initial state."
      },
      {
        "title": "Run until approved",
        "instruction": "Run `app` from an initial state with 0 `attempts`, an empty `draft`, and `approved` set to false. Save the completed state as `final` and inspect whether the reviewer eventually stops the loop.",
        "code": "final = app.invoke({\"attempts\": 0, \"draft\": \"\", \"approved\": False})",
        "check": "test(\"Run until approved\", lambda: final == {\"attempts\":3, \"draft\":\"draft v3\", \"approved\":True}, \"The loop finishes on approved draft v3 after 3 attempts.\")",
        "expected": "The loop finishes on approved draft v3 after 3 attempts.",
        "reassurance": "The router exits at the intended point instead of reaching the recursion limit."
      },
      {
        "title": "Print and verify the stopped loop",
        "instruction": "Display `final`, then check the chapter. Compare its attempt count, draft version, and approval flag to confirm the loop stopped at the intended review.",
        "code": "print(final)",
        "check": "",
        "expected": "attempts is 3, draft is draft v3, and approved is True.",
        "reassurance": "The completed run confirms the stop condition in practice."
      }
    ],
    "setup": "from typing import TypedDict\nfrom langgraph.graph import StateGraph, START, END\n\nclass State(TypedDict):\n    attempts: int\n    draft: str\n    approved: bool\n\ndef write(state):\n    n = state[\"attempts\"] + 1\n    return {\"attempts\": n, \"draft\": f\"draft v{n}\"}\n\ndef review(state):\n    # picky reviewer: approves only from the third draft on\n    return {\"approved\": state[\"attempts\"] >= 3}"
  },
  "lg-hitl": {
    "steps": [
      {
        "title": "Create the pauseable graph",
        "instruction": "Create a `StateGraph` named `g` with the setup `State` schema. The provided `plan` function describes a task and the `act` function produces a text result from that plan. You will arrange a pause before `act`; these practice functions do not perform filesystem actions.",
        "code": "g = StateGraph(State)",
        "check": "test(\"Create the pauseable graph\", lambda: g.nodes == {}, \"The graph starts with no registered jobs.\")",
        "expected": "The graph starts with no registered jobs.",
        "reassurance": "This exercise simulates an action; the pause will happen before its node runs."
      },
      {
        "title": "Register planning",
        "instruction": "Register the setup `plan` function on `g` under the node name `plan`. It reads the `task` field and contributes a reviewable `plan` field.",
        "code": "g.add_node(\"plan\", plan)",
        "check": "test(\"Register planning\", lambda: g.nodes[\"plan\"]({\"task\":\"cleanup\"})[\"plan\"] == \"delete temp files for: cleanup\", \"Planning describes the cleanup task.\")",
        "expected": "Planning describes the cleanup task.",
        "reassurance": "Planning produces a reviewable value first."
      },
      {
        "title": "Register acting",
        "instruction": "Register the setup `act` function on `g` under the node name `act`. It reads the plan and contributes the `result` field.",
        "code": "g.add_node(\"act\", act)",
        "check": "test(\"Register acting\", lambda: g.nodes[\"act\"]({\"plan\":\"sample\"}) == {\"result\":\"DONE -> sample\"}, \"act produces a result from the plan.\")",
        "expected": "act produces a result from the plan.",
        "reassurance": "The action function is ready, and the graph pause will control when it runs."
      },
      {
        "title": "Enter planning",
        "instruction": "Make planning the entry point by connecting `START` to `plan`.",
        "code": "g.add_edge(START, \"plan\")",
        "check": "test(\"Enter planning\", lambda: (START,\"plan\") in g.edges, \"START points to plan.\")",
        "expected": "START points to plan.",
        "reassurance": "The plan is always made first."
      },
      {
        "title": "Place acting after planning",
        "instruction": "Connect `plan` to `act` so the action can use the prepared plan when the run resumes.",
        "code": "g.add_edge(\"plan\", \"act\")",
        "check": "test(\"Place acting after planning\", lambda: (\"plan\",\"act\") in g.edges, \"plan points to act.\")",
        "expected": "plan points to act.",
        "reassurance": "The pause will sit between these two jobs."
      },
      {
        "title": "Finish after acting",
        "instruction": "Connect `act` to `END` so the resumed task finishes after producing its result.",
        "code": "g.add_edge(\"act\", END)",
        "check": "test(\"Finish after acting\", lambda: (\"act\",END) in g.edges, \"act points to END.\")",
        "expected": "act points to END.",
        "reassurance": "The resumed path has a clear finish."
      },
      {
        "title": "Compile with a checkpoint and pause",
        "instruction": "Compile `g` into `app` with a new `MemorySaver` as its `checkpointer`. Set `interrupt_before` to a list containing the node name `act`, so execution saves its state and pauses before that node.",
        "code": "app = g.compile(checkpointer=MemorySaver(), interrupt_before=[\"act\"])",
        "check": "test(\"Compile with a checkpoint and pause\", lambda: app.checkpointer is not None and app.interrupt_before == [\"act\"], \"The graph has saved-state memory and pauses before act.\")",
        "expected": "The graph has saved-state memory and pauses before act.",
        "reassurance": "The pause is configured before any task is submitted."
      },
      {
        "title": "Name the saved thread",
        "instruction": "Create a configuration dictionary named `config`. Inside its `configurable` field, set `thread_id` to “ticket-42”. Keep this same configuration for submission, inspection, and resume so all three operations identify the saved task.",
        "code": "config = {\"configurable\": {\"thread_id\": \"ticket-42\"}}",
        "check": "test(\"Name the saved thread\", lambda: config[\"configurable\"][\"thread_id\"] == \"ticket-42\", \"The thread ID is ticket-42.\")",
        "expected": "The thread ID is ticket-42.",
        "reassurance": "The same configuration will identify both the pause and the resume."
      },
      {
        "title": "Run to the pause",
        "instruction": "Submit a task with text “cleanup” to `app`, using `config` as the invocation configuration. The `get_state` method accepts that configuration and returns a snapshot with `next` and `values` fields; use the check to confirm the pending node has not acted yet.",
        "code": "app.invoke({\"task\": \"cleanup\"}, config)",
        "check": "test(\"Run to the pause\", lambda: app.get_state(config).next == (\"act\",) and \"result\" not in app.get_state(config).values, \"act is waiting and no result has been produced.\")",
        "expected": "act is waiting and no result has been produced.",
        "reassurance": "The checkpoint stopped at the intended boundary."
      },
      {
        "title": "Show the waiting node",
        "instruction": "Display the pending-node tuple from the saved snapshot for `config`, prefixed with the label “paused before:”. Keep a space between the label and tuple so the output can verify the pause.",
        "code": "print(\"paused before:\", app.get_state(config).next)",
        "check": "test(\"Show the waiting node\", lambda: \"paused before: ('act',)\" in __stdout__, \"The output says paused before: ('act',).\")",
        "expected": "The output says paused before: ('act',).",
        "reassurance": "You can inspect the pause before choosing to resume."
      },
      {
        "title": "Resume the saved task",
        "instruction": "Resume `app` using `None` as the input and the same `config`. Store the returned state in `final`. Resuming should continue the saved plan rather than submit another cleanup task.",
        "code": "final = app.invoke(None, config)",
        "check": "test(\"Resume the saved task\", lambda: final[\"result\"] == \"DONE -> delete temp files for: cleanup\" and app.get_state(config).next == (), \"The saved plan completes, and no nodes are waiting.\")",
        "expected": "The saved plan completes, and no nodes are waiting.",
        "reassurance": "The same task resumed successfully instead of starting again."
      },
      {
        "title": "Print and verify the resumed state",
        "instruction": "Display `final`, then check the chapter. Confirm the result was produced after the earlier pause and the saved snapshot has no pending nodes.",
        "code": "print(final)",
        "check": "",
        "expected": "The final result is DONE -> delete temp files for: cleanup.",
        "reassurance": "The full checks confirm both the earlier pause and the completed resume."
      }
    ],
    "setup": "from typing import TypedDict\nfrom langgraph.graph import StateGraph, START, END\nfrom langgraph.checkpoint.memory import MemorySaver\n\nclass State(TypedDict):\n    task: str\n    plan: str\n    result: str\n\ndef plan(state):\n    return {\"plan\": f\"delete temp files for: {state['task']}\"}\n\ndef act(state):\n    return {\"result\": f\"DONE -> {state['plan']}\"}"
  },
  "lg-routing": {
    "steps": [
      {
        "title": "Choose a priority threshold",
        "instruction": "Create a variable named `threshold` with the value 3. The setup provides a `Ticket` schema, an `urgent` function that produces an urgent reply, and a `standard` function that produces a queued reply. Priorities at or above the threshold should take the urgent path.",
        "code": "threshold = 3",
        "check": "test(\"Choose a priority threshold\", lambda: threshold == 3, \"Tickets at priority 3 or above should be urgent.\")",
        "expected": "Tickets at priority 3 or above should be urgent.",
        "reassurance": "We will check the boundary as well as a lower priority."
      },
      {
        "title": "Create the ticket graph",
        "instruction": "Create an empty `StateGraph` named `graph` with the setup `Ticket` schema. Its state carries the incoming `question` and `priority` alongside the eventual `reply`.",
        "code": "graph = StateGraph(Ticket)",
        "check": "test(\"Create the ticket graph\", lambda: graph.nodes == {}, \"The ticket graph starts empty.\")",
        "expected": "The ticket graph starts empty.",
        "reassurance": "The reply branches are ready to register."
      },
      {
        "title": "Register urgent replies",
        "instruction": "Register the setup `urgent` function on `graph` under the node name `urgent`.",
        "code": "graph.add_node(\"urgent\", urgent)",
        "check": "test(\"Register urgent replies\", lambda: graph.nodes[\"urgent\"]({\"question\":\"Help\"}) == {\"reply\":\"URGENT: Help\"}, \"The urgent branch prefixes the question with URGENT:.\")",
        "expected": "The urgent branch prefixes the question with URGENT:.",
        "reassurance": "The urgent behavior is verified by itself."
      },
      {
        "title": "Register standard replies",
        "instruction": "Register the setup `standard` function on `graph` under the node name `standard`.",
        "code": "graph.add_node(\"standard\", standard)",
        "check": "test(\"Register standard replies\", lambda: graph.nodes[\"standard\"]({\"question\":\"Help\"}) == {\"reply\":\"QUEUED: Help\"}, \"The standard branch prefixes the question with QUEUED:.\")",
        "expected": "The standard branch prefixes the question with QUEUED:.",
        "reassurance": "Both branch functions now work independently."
      },
      {
        "title": "Route at entry",
        "instruction": "Add a conditional route at `START` that compares the incoming `priority` with `threshold`. Select `urgent` when the priority meets or exceeds the threshold, otherwise select `standard`. Map each router result to the same-named node so only one reply branch runs.",
        "code": "graph.add_conditional_edges(START, lambda state: \"urgent\" if state[\"priority\"] >= threshold else \"standard\", {\"urgent\": \"urgent\", \"standard\": \"standard\"})",
        "check": "test(\"Route at entry\", lambda: graph.conditional[0][1]({\"priority\":3}) == \"urgent\" and graph.conditional[0][1]({\"priority\":2}) == \"standard\", \"Priority 3 selects urgent; priority 2 selects standard.\")",
        "expected": "Priority 3 selects urgent; priority 2 selects standard.",
        "reassurance": "The equality boundary goes to the urgent path as intended."
      },
      {
        "title": "Finish the urgent path",
        "instruction": "Connect the `urgent` node to `END` so an urgent ticket finishes after its reply.",
        "code": "graph.add_edge(\"urgent\", END)",
        "check": "test(\"Finish the urgent path\", lambda: (\"urgent\",END) in graph.edges, \"urgent points to END.\")",
        "expected": "urgent points to END.",
        "reassurance": "Urgent tickets have a complete exit path."
      },
      {
        "title": "Finish the standard path",
        "instruction": "Connect the `standard` node to `END` so a standard ticket also has a complete finish path.",
        "code": "graph.add_edge(\"standard\", END)",
        "check": "test(\"Finish the standard path\", lambda: (\"standard\",END) in graph.edges, \"standard points to END.\")",
        "expected": "standard points to END.",
        "reassurance": "Both paths finish independently."
      },
      {
        "title": "Keep the shared branch wiring reusable",
        "instruction": "Define `ticket_graph` with no parameters. It should create and return a new, uncompiled `StateGraph` using `Ticket`, register the supplied `urgent` and `standard` functions under those node names, and connect each branch to `END`. Leave the threshold-dependent entry route for the next helper.",
        "code": "def ticket_graph():\n    graph = StateGraph(Ticket)\n    graph.add_node(\"urgent\", urgent)\n    graph.add_node(\"standard\", standard)\n    graph.add_edge(\"urgent\", END)\n    graph.add_edge(\"standard\", END)\n    return graph",
        "check": "test(\"Keep the shared branch wiring reusable\", lambda: set(ticket_graph().nodes) == {\"urgent\",\"standard\"} and (\"urgent\",END) in ticket_graph().edges, \"The helper returns both branches with their exit edges.\")",
        "expected": "The helper returns both branches with their exit edges.",
        "reassurance": "The already verified branch wiring can be reused for different thresholds."
      },
      {
        "title": "Make the threshold reusable",
        "instruction": "Define `build_router` with one parameter, `threshold`. Obtain a fresh graph from `ticket_graph`, attach the conditional entry route using this parameter’s value, and return the compiled runnable. The entry rule and branch mapping should match the practice graph; different builder calls must be able to use different thresholds.",
        "code": "def build_router(threshold):\n    graph = ticket_graph()\n    graph.add_conditional_edges(START, lambda state: \"urgent\" if state[\"priority\"] >= threshold else \"standard\", {\"urgent\": \"urgent\", \"standard\": \"standard\"})\n    return graph.compile()",
        "check": "test(\"Make the threshold reusable\", lambda: build_router(5).invoke({\"question\":\"Help\", \"priority\":4})[\"reply\"] == \"QUEUED: Help\", \"With threshold 5, priority 4 takes the standard branch.\")",
        "expected": "With threshold 5, priority 4 takes the standard branch.",
        "reassurance": "Each graph uses the threshold supplied to its own builder."
      },
      {
        "title": "Build the demonstration router",
        "instruction": "Create `app` using `build_router` with a threshold of 3. Keep the runnable ready for a ticket input.",
        "code": "app = build_router(3)",
        "check": "test(\"Build the demonstration router\", lambda: callable(app.invoke), \"The demonstration app is ready with threshold 3.\")",
        "expected": "The demonstration app is ready with threshold 3.",
        "reassurance": "We can now run the boundary example through the entire graph."
      },
      {
        "title": "Print and verify the selected path",
        "instruction": "Run `app` with question “Pipeline failed” and priority 3, then display its `reply` field. Check the chapter, including the threshold boundary and graphs built with other thresholds.",
        "code": "print(app.invoke({\"question\": \"Pipeline failed\", \"priority\": 3})[\"reply\"])",
        "check": "",
        "expected": "The output is URGENT: Pipeline failed. The chapter checks both branches and configurable thresholds.",
        "reassurance": "Your graph now chooses the correct path for each ticket."
      }
    ],
    "setup": "from typing import TypedDict\nfrom langgraph.graph import StateGraph, START, END\n\nclass Ticket(TypedDict):\n    question: str\n    priority: int\n    reply: str\n\ndef urgent(state):\n    return {\"reply\": \"URGENT: \" + state[\"question\"]}\n\ndef standard(state):\n    return {\"reply\": \"QUEUED: \" + state[\"question\"]}"
  },
  "lg-fanout": {
    "steps": [
      {
        "title": "Detect email addresses",
        "instruction": "Define `check_pii` with one parameter, `state`. Find email addresses in its `draft` text using the setup `re` module, and return a `findings` update containing one “pii: ” prefix plus each matched address in text order. An address has a non-empty user name, an @ sign, and a domain with at least one dot; support dots, plus signs, and hyphens in user names. If there are no addresses, the findings list should be empty. The setup `Review` schema merges finding lists from separate nodes.",
        "code": "def check_pii(state):\n    emails = re.findall(r\"[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+\", state[\"draft\"])\n    return {\"findings\": [f\"pii: {email}\" for email in emails]}",
        "check": "test(\"Detect email addresses\", lambda: check_pii({\"draft\":\"Ask ana@example.com\"}) == {\"findings\":[\"pii: ana@example.com\"]}, \"The email produces one pii finding.\")",
        "expected": "The email produces one pii finding.",
        "reassurance": "This node returns only its own findings; merging happens in the graph."
      },
      {
        "title": "Flag long drafts",
        "instruction": "Define `check_length` with one parameter, `state`. Count whitespace-separated words in `draft`. Return a `findings` update with one item only when the count exceeds 40. Finding format: “length: ” followed by the count and “ words”. Drafts of 40 words or fewer should have an empty findings list.",
        "code": "def check_length(state):\n    words = len(state[\"draft\"].split())\n    return {\"findings\": [f\"length: {words} words\"] if words > 40 else []}",
        "check": "test(\"Flag long drafts\", lambda: check_length({\"draft\":\"short draft\"}) == {\"findings\":[]} and check_length({\"draft\":\" \".join([\"word\"] * 41)}) == {\"findings\":[\"length: 41 words\"]}, \"A short draft has no finding; 41 words triggers the length check.\")",
        "expected": "A short draft has no finding; 41 words triggers the length check.",
        "reassurance": "The word-count boundary is verified."
      },
      {
        "title": "Flag dismissive words",
        "instruction": "Define `check_tone` with one parameter, `state`. Match the whole words “obviously”, “stupid”, and “whatever” in `draft` without regard to case or adjacent punctuation. Return a `findings` update containing each matched word once, alphabetically sorted, with the prefix “tone: ”. Substrings inside other words should not trigger findings.",
        "code": "def check_tone(state):\n    words = set(re.findall(r\"[a-z']+\", state[\"draft\"].lower()))\n    return {\"findings\": [f\"tone: {w}\" for w in sorted(words & {\"obviously\", \"stupid\", \"whatever\"})]}",
        "check": "test(\"Flag dismissive words\", lambda: check_tone({\"draft\":\"Obviously, whatever.\"}) == {\"findings\":[\"tone: obviously\", \"tone: whatever\"]}, \"The two dismissive words produce two sorted findings.\")",
        "expected": "The two dismissive words produce two sorted findings.",
        "reassurance": "Whole-word matching avoids flagging unrelated substrings."
      },
      {
        "title": "Decide after all checks",
        "instruction": "Define `decide` with one parameter, `state`. Read the merged `findings` list and return `verdict` and `summary` fields. The verdict is “revise” when findings exist and “send” otherwise. The summary combines alphabetically sorted findings with a semicolon and space between them, or is empty when there are none.",
        "code": "def decide(state):\n    findings = sorted(state[\"findings\"])\n    return {\"verdict\": \"revise\" if findings else \"send\", \"summary\": \"; \".join(findings)}",
        "check": "test(\"Decide after all checks\", lambda: decide({\"findings\":[]}) == {\"verdict\":\"send\", \"summary\":\"\"} and decide({\"findings\":[\"b\",\"a\"]}) == {\"verdict\":\"revise\", \"summary\":\"a; b\"}, \"No findings means send; findings mean revise with a sorted summary.\")",
        "expected": "No findings means send; findings mean revise with a sorted summary.",
        "reassurance": "The final decision works independently from parallel execution."
      },
      {
        "title": "Create the review graph",
        "instruction": "Create an empty `StateGraph` named `graph` with the setup `Review` schema. The schema’s reducer will combine the three separate findings lists before the decision reads them.",
        "code": "graph = StateGraph(Review)",
        "check": "test(\"Create the review graph\", lambda: graph.nodes == {}, \"The review graph starts empty.\")",
        "expected": "The review graph starts empty.",
        "reassurance": "The reducer is already part of the supplied state schema."
      },
      {
        "title": "Register the PII node",
        "instruction": "Register `check_pii` on `graph` under the node name `pii`.",
        "code": "graph.add_node(\"pii\", check_pii)",
        "check": "test(\"Register the PII node\", lambda: graph.nodes[\"pii\"] is check_pii, \"pii points to check_pii.\")",
        "expected": "pii points to check_pii.",
        "reassurance": "The first parallel job is registered."
      },
      {
        "title": "Register the length node",
        "instruction": "Register `check_length` on `graph` under the node name `length`.",
        "code": "graph.add_node(\"length\", check_length)",
        "check": "test(\"Register the length node\", lambda: graph.nodes[\"length\"] is check_length, \"length points to check_length.\")",
        "expected": "length points to check_length.",
        "reassurance": "The second job is registered."
      },
      {
        "title": "Register the tone node",
        "instruction": "Register `check_tone` on `graph` under the node name `tone`.",
        "code": "graph.add_node(\"tone\", check_tone)",
        "check": "test(\"Register the tone node\", lambda: graph.nodes[\"tone\"] is check_tone, \"tone points to check_tone.\")",
        "expected": "tone points to check_tone.",
        "reassurance": "All three checks are registered."
      },
      {
        "title": "Register the decision node",
        "instruction": "Register `decide` on `graph` under the node name `decide`. This node should see the merged findings after all three checks.",
        "code": "graph.add_node(\"decide\", decide)",
        "check": "test(\"Register the decision node\", lambda: graph.nodes[\"decide\"] is decide, \"decide points to the decision function.\")",
        "expected": "decide points to the decision function.",
        "reassurance": "We can now connect the parallel checks to the final decision."
      },
      {
        "title": "Start PII alongside the other checks",
        "instruction": "Connect `START` to `pii` to give the email check access to the initial draft.",
        "code": "graph.add_edge(START, \"pii\")",
        "check": "test(\"Start PII alongside the other checks\", lambda: (START,\"pii\") in graph.edges, \"START points to pii.\")",
        "expected": "START points to pii.",
        "reassurance": "One parallel entry is wired."
      },
      {
        "title": "Start the length check",
        "instruction": "Add another entry edge from `START` to `length`. Independent outgoing entry edges let the checks work from the same initial draft.",
        "code": "graph.add_edge(START, \"length\")",
        "check": "test(\"Start the length check\", lambda: (START,\"length\") in graph.edges, \"START also points to length.\")",
        "expected": "START also points to length.",
        "reassurance": "Multiple START edges form the fan-out."
      },
      {
        "title": "Start the tone check",
        "instruction": "Add an entry edge from `START` to `tone` so all three checks participate in the fan-out.",
        "code": "graph.add_edge(START, \"tone\")",
        "check": "test(\"Start the tone check\", lambda: (START,\"tone\") in graph.edges, \"START also points to tone.\")",
        "expected": "START also points to tone.",
        "reassurance": "All three checks now share the same starting state."
      },
      {
        "title": "Merge PII into the decision",
        "instruction": "Connect `pii` to `decide` so the email findings join the final decision.",
        "code": "graph.add_edge(\"pii\", \"decide\")",
        "check": "test(\"Merge PII into the decision\", lambda: (\"pii\",\"decide\") in graph.edges, \"pii points to decide.\")",
        "expected": "pii points to decide.",
        "reassurance": "The PII update will join the other findings."
      },
      {
        "title": "Merge length into the decision",
        "instruction": "Connect `length` to `decide` so the word-count findings join the same decision.",
        "code": "graph.add_edge(\"length\", \"decide\")",
        "check": "test(\"Merge length into the decision\", lambda: (\"length\",\"decide\") in graph.edges, \"length points to decide.\")",
        "expected": "length points to decide.",
        "reassurance": "The decision has another incoming check."
      },
      {
        "title": "Merge tone into the decision",
        "instruction": "Connect `tone` to `decide` so every check converges on the decision node.",
        "code": "graph.add_edge(\"tone\", \"decide\")",
        "check": "test(\"Merge tone into the decision\", lambda: (\"tone\",\"decide\") in graph.edges, \"tone points to decide.\")",
        "expected": "tone points to decide.",
        "reassurance": "All checks converge on one decision node."
      },
      {
        "title": "Finish after deciding",
        "instruction": "Connect `decide` to `END` so the review stops once its verdict and summary are ready.",
        "code": "graph.add_edge(\"decide\", END)",
        "check": "test(\"Finish after deciding\", lambda: (\"decide\",END) in graph.edges, \"decide points to END.\")",
        "expected": "decide points to END.",
        "reassurance": "The review has a complete finish path."
      },
      {
        "title": "Create independent review apps",
        "instruction": "Define `build_review` with no parameters. Return a newly compiled runnable from the verified `graph`. Each invocation should begin with fresh findings and run the decision once after all three checks.",
        "code": "def build_review():\n    return graph.compile()",
        "check": "test(\"Create independent review apps\", lambda: build_review().invoke({\"draft\":\"Thanks!\"})[\"verdict\"] == \"send\", \"A fresh review accepts a clean short draft.\")",
        "expected": "A fresh review accepts a clean short draft.",
        "reassurance": "The graph merges empty finding lists and reaches its decision correctly."
      },
      {
        "title": "Build the demonstration app",
        "instruction": "Create a runnable named `app` using `build_review`. Keep it ready to receive a state with a `draft` field.",
        "code": "app = build_review()",
        "check": "test(\"Build the demonstration app\", lambda: callable(app.invoke), \"app is ready for a draft.\")",
        "expected": "app is ready for a draft.",
        "reassurance": "The next check will verify the complete parallel flow."
      },
      {
        "title": "Print and verify the combined findings",
        "instruction": "Run `app` with draft text “Obviously you should email ana@example.com for a refund.” Display the returned state and check the chapter. Compare the email and tone findings with the verdict and sorted summary.",
        "code": "print(app.invoke({\"draft\": \"Obviously you should email ana@example.com for a refund.\"}))",
        "check": "",
        "expected": "The result needs revision and includes both the email and tone findings. The full checks verify all three checks and one final decision.",
        "reassurance": "All parallel findings can be inspected together in the resulting state."
      }
    ],
    "setup": "import operator\nimport re\nfrom typing import Annotated, TypedDict\nfrom langgraph.graph import StateGraph, START, END\n\nclass Review(TypedDict):\n    draft: str\n    findings: Annotated[list, operator.add]\n    verdict: str\n    summary: str"
  },
  "lg-memory": {
    "steps": [
      {
        "title": "Reply using human turns",
        "instruction": "Define `reply` with one parameter, `state`. Read its `messages` list, count only messages whose `type` is `human`, and use the latest human message’s content in uppercase. Return a `messages` update containing just one new `AIMessage`. Reply format: “turn ”, the human-message count, “: ”, and that uppercase content. Preserve the input history; the `MessagesState` reducer will append the new message.",
        "code": "def reply(state):\n    humans = [message for message in state[\"messages\"] if message.type == \"human\"]\n    return {\"messages\": [AIMessage(f\"turn {len(humans)}: {humans[-1].content.upper()}\")]}",
        "check": "test(\"Reply using human turns\", lambda: reply({\"messages\":[HumanMessage(\"hi\"), AIMessage(\"old\"), HumanMessage(\"again\")]})[\"messages\"][0].content == \"turn 2: AGAIN\", \"Two human messages produce turn 2: AGAIN, even with an AI reply between them.\")",
        "expected": "Two human messages produce turn 2: AGAIN, even with an AI reply between them.",
        "reassurance": "The counter measures turns rather than total messages."
      },
      {
        "title": "Create the conversation graph",
        "instruction": "Create an empty `StateGraph` named `graph` using `MessagesState`. Its message reducer appends updates instead of replacing the conversation.",
        "code": "graph = StateGraph(MessagesState)",
        "check": "test(\"Create the conversation graph\", lambda: graph.nodes == {}, \"The conversation graph starts empty.\")",
        "expected": "The conversation graph starts empty.",
        "reassurance": "MessagesState supplies the reducer that keeps earlier messages."
      },
      {
        "title": "Register the reply node",
        "instruction": "Register your `reply` function on `graph` under the node name `reply`.",
        "code": "graph.add_node(\"reply\", reply)",
        "check": "test(\"Register the reply node\", lambda: graph.nodes[\"reply\"] is reply, \"reply points to your function.\")",
        "expected": "reply points to your function.",
        "reassurance": "The conversation job is registered."
      },
      {
        "title": "Enter the reply node",
        "instruction": "Connect `START` to `reply` so each incoming turn reaches the response function.",
        "code": "graph.add_edge(START, \"reply\")",
        "check": "test(\"Enter the reply node\", lambda: (START,\"reply\") in graph.edges, \"START points to reply.\")",
        "expected": "START points to reply.",
        "reassurance": "Each new turn will produce one response."
      },
      {
        "title": "Finish each invocation",
        "instruction": "Connect `reply` to `END` so each invocation produces one response and finishes.",
        "code": "graph.add_edge(\"reply\", END)",
        "check": "test(\"Finish each invocation\", lambda: (\"reply\",END) in graph.edges, \"reply points to END.\")",
        "expected": "reply points to END.",
        "reassurance": "Each invoke finishes while the checkpoint preserves the history."
      },
      {
        "title": "Give each chat its own memory",
        "instruction": "Define `make_chat` with no parameters. Return a compiled runnable from `graph` with a new `MemorySaver` as its `checkpointer`. Create that memory store inside the helper so separately built chats have independent saved histories.",
        "code": "def make_chat():\n    return graph.compile(checkpointer=MemorySaver())",
        "check": "test(\"Give each chat its own memory\", lambda: make_chat().checkpointer is not make_chat().checkpointer, \"Two newly built chats have different checkpoint stores.\")",
        "expected": "Two newly built chats have different checkpoint stores.",
        "reassurance": "Independent apps will not leak conversation history into each other."
      },
      {
        "title": "Create a chat",
        "instruction": "Create a runnable named `chat` using `make_chat`. This instance will keep the demonstration conversation between calls.",
        "code": "chat = make_chat()",
        "check": "test(\"Create a chat\", lambda: chat.checkpointer is not None, \"chat has checkpoint storage.\")",
        "expected": "chat has checkpoint storage.",
        "reassurance": "The graph can now remember messages between calls."
      },
      {
        "title": "Name this conversation",
        "instruction": "Create a dictionary named `config` with a `configurable` field containing `thread_id` set to “demo”. Use this same configuration to identify each turn of the demonstration conversation.",
        "code": "config = {\"configurable\": {\"thread_id\": \"demo\"}}",
        "check": "test(\"Name this conversation\", lambda: config[\"configurable\"][\"thread_id\"] == \"demo\", \"The conversation is identified by demo.\")",
        "expected": "The conversation is identified by demo.",
        "reassurance": "Reuse this same ID to continue the saved conversation."
      },
      {
        "title": "Send only the newest message",
        "instruction": "Send `chat` a state containing a `messages` list with one user message whose text is “hello”, using `config` as the invocation configuration. LangGraph accepts a pair of role and text for a message. Submit only the new user message; the checkpoint restores earlier history.",
        "code": "chat.invoke({\"messages\": [(\"user\", \"hello\")]}, config)",
        "check": "test(\"Send only the newest message\", lambda: chat.get_state(config).values[\"messages\"][-1].content == \"turn 1: HELLO\", \"The stored reply is turn 1: HELLO.\")",
        "expected": "The stored reply is turn 1: HELLO.",
        "reassurance": "One human message and one reply have been saved."
      },
      {
        "title": "Continue and verify thread isolation",
        "instruction": "Continue `chat` with one new user message, “again”, using the same `config`. Display the latest message’s content from the returned conversation, then check the chapter for turn counts, append order, and separate histories.",
        "code": "print(chat.invoke({\"messages\": [(\"user\", \"again\")]}, config)[\"messages\"][-1].content)",
        "check": "",
        "expected": "The output is turn 2: AGAIN. The full checks confirm append order and separate thread histories.",
        "reassurance": "The chat continues from saved history while other conversations stay independent."
      }
    ],
    "setup": "from langchain_core.messages import AIMessage, HumanMessage\nfrom langgraph.graph import StateGraph, MessagesState, START, END\nfrom langgraph.checkpoint.memory import MemorySaver"
  },
  "lg-self-correct": {
    "steps": [
      {
        "title": "Validate a successful reply",
        "instruction": "Use the setup `parse_order` helper to parse JSON order data with `sku` text “ KB-01 ” and integer `quantity` 2. Save the normalized dictionary as `valid_order`. The helper accepts JSON text, trims SKU whitespace, and raises `ValueError` for invalid JSON, blank SKUs, or quantities outside the integer range 1 to 99.",
        "code": "valid_order = parse_order('{\"sku\":\" KB-01 \",\"quantity\":2}')",
        "check": "test(\"Validate a successful reply\", lambda: valid_order == {\"sku\":\"KB-01\", \"quantity\":2}, \"The SKU is stripped and quantity remains the integer 2.\")",
        "expected": "The SKU is stripped and quantity remains the integer 2.",
        "reassurance": "The supplied validator gives the loop a clear success condition."
      },
      {
        "title": "Write the generation update",
        "instruction": "Define `generate` with parameters `state` and `model`, in that order. The model is a callable accepting the request `message` followed by validation `feedback`. Give it the state’s message and previous error, using `None` when no error exists. Return a `raw` update with the model’s reply and an `attempts` update that adds one to the prior count, treating a missing count as zero.",
        "code": "def generate(state, model):\n    return {\"raw\": model(state[\"message\"], state.get(\"error\")), \"attempts\": state.get(\"attempts\", 0) + 1}",
        "check": "test(\"Write the generation update\", lambda: generate({\"message\":\"order\", \"error\":\"fix it\", \"attempts\":2}, lambda message, feedback: feedback) == {\"raw\":\"fix it\", \"attempts\":3}, \"The model receives fix it and the counter advances from 2 to 3.\")",
        "expected": "The model receives fix it and the counter advances from 2 to 3.",
        "reassurance": "Feedback and attempt counting are verified without consuming the demonstration model."
      },
      {
        "title": "Turn validation into state updates",
        "instruction": "Define `validate` with one parameter, `state`. Validate its `raw` reply with `parse_order`. On success, produce `order`, `status` set to “ok”, and `error` cleared to `None`. Catch `ValueError` on failure and produce only an `error` update containing the exception text, so the graph can retry without losing the reason for failure.",
        "code": "def validate(state):\n    try:\n        return {\"order\": parse_order(state[\"raw\"]), \"status\": \"ok\", \"error\": None}\n    except ValueError as error:\n        return {\"error\": str(error)}",
        "check": "test(\"Turn validation into state updates\", lambda: validate({\"raw\":\"not json\"}) == {\"error\":\"reply must be valid JSON\"} and validate({\"raw\":'{\"sku\":\"A\",\"quantity\":1}'})[\"status\"] == \"ok\", \"Invalid JSON becomes an error update; a valid order sets status to ok.\")",
        "expected": "Invalid JSON becomes an error update; a valid order sets status to ok.",
        "reassurance": "The loop can now distinguish a correct answer from a fixable failure."
      },
      {
        "title": "Define the safe fallback",
        "instruction": "Define `fallback` with one parameter, `state`. Its update should clear `order` to `None` and set `status` to “needs_human”, while preserving the last validation error already in graph state.",
        "code": "def fallback(state):\n    return {\"order\": None, \"status\": \"needs_human\"}",
        "check": "test(\"Define the safe fallback\", lambda: fallback({}) == {\"order\":None, \"status\":\"needs_human\"}, \"The fallback returns no order and needs_human status.\")",
        "expected": "The fallback returns no order and needs_human status.",
        "reassurance": "There is a clear stopping path for persistent validation failures."
      },
      {
        "title": "Route with an explicit budget",
        "instruction": "Define `route` with parameters `state` and `max_attempts`, in that order. A status of “ok” should select `END` regardless of attempt count. Otherwise, select `generate` while the attempt count is below the budget and `fallback` once the budget is exhausted.",
        "code": "def route(state, max_attempts):\n    if state.get(\"status\") == \"ok\":\n        return END\n    return \"generate\" if state[\"attempts\"] < max_attempts else \"fallback\"",
        "check": "test(\"Route with an explicit budget\", lambda: route({\"status\":\"ok\", \"attempts\":1}, 3) == END and route({\"attempts\":1}, 3) == \"generate\" and route({\"attempts\":3}, 3) == \"fallback\", \"Success ends; attempt 1 of 3 retries; attempt 3 of 3 falls back.\")",
        "expected": "Success ends; attempt 1 of 3 retries; attempt 3 of 3 falls back.",
        "reassurance": "All three routing outcomes are checked before the graph loops."
      },
      {
        "title": "Create a practice graph",
        "instruction": "Create an empty `StateGraph` named `graph` using the setup `Extraction` schema. It carries the original `message`, model `raw` reply, accepted `order`, validation `error`, `attempts`, and `status`.",
        "code": "graph = StateGraph(Extraction)",
        "check": "test(\"Create a practice graph\", lambda: graph.nodes == {}, \"The extraction graph starts empty.\")",
        "expected": "The extraction graph starts empty.",
        "reassurance": "We will attach generation, validation, and fallback next."
      },
      {
        "title": "Attach generation",
        "instruction": "Register a node named `generate` on `graph` that adapts your `generate` helper to a state-only graph node. For this practice wiring, supply a model callable with `message` and `feedback` parameters that always gives valid JSON data: SKU “A”, quantity 1. The reusable builder will accept other models later.",
        "code": "graph.add_node(\"generate\", lambda state: generate(state, lambda message, feedback: '{\"sku\":\"A\",\"quantity\":1}'))",
        "check": "test(\"Attach generation\", lambda: \"generate\" in graph.nodes, \"The graph contains the generate node.\")",
        "expected": "The graph contains the generate node.",
        "reassurance": "The real model will be supplied to the reusable builder."
      },
      {
        "title": "Attach validation",
        "instruction": "Register your `validate` function on `graph` under the node name `validate`.",
        "code": "graph.add_node(\"validate\", validate)",
        "check": "test(\"Attach validation\", lambda: graph.nodes[\"validate\"] is validate, \"validate points to your validator node.\")",
        "expected": "validate points to your validator node.",
        "reassurance": "The second stage is registered."
      },
      {
        "title": "Attach fallback",
        "instruction": "Register your `fallback` function on `graph` under the node name `fallback`.",
        "code": "graph.add_node(\"fallback\", fallback)",
        "check": "test(\"Attach fallback\", lambda: graph.nodes[\"fallback\"] is fallback, \"fallback points to the safe exit function.\")",
        "expected": "fallback points to the safe exit function.",
        "reassurance": "The failure path is available."
      },
      {
        "title": "Start generation",
        "instruction": "Connect `START` to `generate` so every extraction begins with a model attempt.",
        "code": "graph.add_edge(START, \"generate\")",
        "check": "test(\"Start generation\", lambda: (START,\"generate\") in graph.edges, \"START points to generate.\")",
        "expected": "START points to generate.",
        "reassurance": "Each request starts with a model attempt."
      },
      {
        "title": "Validate every reply",
        "instruction": "Connect `generate` to `validate` so every model reply is checked before routing.",
        "code": "graph.add_edge(\"generate\", \"validate\")",
        "check": "test(\"Validate every reply\", lambda: (\"generate\",\"validate\") in graph.edges, \"generate points to validate.\")",
        "expected": "generate points to validate.",
        "reassurance": "No generated reply bypasses validation."
      },
      {
        "title": "Connect retry and fallback choices",
        "instruction": "Attach a conditional route after `validate` that uses your `route` helper with a budget of 3 attempts. Map its `generate` and `fallback` results to those same-named nodes, and its `END` result to the graph finish.",
        "code": "graph.add_conditional_edges(\"validate\", lambda state: route(state, 3), {\"generate\": \"generate\", \"fallback\": \"fallback\", END: END})",
        "check": "test(\"Connect retry and fallback choices\", lambda: graph.conditional[0][1]({\"attempts\":3}) == \"fallback\", \"The graph routes an exhausted budget to fallback.\")",
        "expected": "The graph routes an exhausted budget to fallback.",
        "reassurance": "The loop has both a success exit and a failure exit."
      },
      {
        "title": "Finish after fallback",
        "instruction": "Connect `fallback` to `END` so an exhausted extraction stops after requesting human help.",
        "code": "graph.add_edge(\"fallback\", END)",
        "check": "test(\"Finish after fallback\", lambda: (\"fallback\",END) in graph.edges, \"fallback points to END.\")",
        "expected": "fallback points to END.",
        "reassurance": "A failed extraction will stop gracefully."
      },
      {
        "title": "Reuse the generation and validation path",
        "instruction": "Define `extraction_graph` with one parameter, `model`. Return a new, uncompiled `StateGraph` using `Extraction`, with nodes named `generate`, `validate`, and `fallback`. Adapt the generation node to use this helper’s model; use your existing validation and fallback functions. Include the fixed path from `START` through `generate` to `validate`, leaving retry routing and the fallback finish for the builder.",
        "code": "def extraction_graph(model):\n    graph = StateGraph(Extraction)\n    graph.add_node(\"generate\", lambda state: generate(state, model))\n    graph.add_node(\"validate\", validate)\n    graph.add_node(\"fallback\", fallback)\n    graph.add_edge(START, \"generate\")\n    graph.add_edge(\"generate\", \"validate\")\n    return graph",
        "check": "test(\"Reuse the generation and validation path\", lambda: set(extraction_graph(lambda message, feedback: \"ok\").nodes) == {\"generate\",\"validate\",\"fallback\"}, \"The helper returns all three nodes and the generation-to-validation path.\")",
        "expected": "The helper returns all three nodes and the generation-to-validation path.",
        "reassurance": "The reusable wiring keeps the chosen model inside the generation node."
      },
      {
        "title": "Build with a validated attempt budget",
        "instruction": "Define `build_extractor` with parameters `model` and `max_attempts`, defaulting `max_attempts` to 3. Reject budgets below 1 with `ValueError`; error text: “max_attempts must be at least 1”. Obtain a fresh graph from `extraction_graph`, attach the validation route using this budget, connect fallback to `END`, and return the compiled runnable. Each new invocation should begin its own attempt count.",
        "code": "def build_extractor(model, max_attempts=3):\n    if max_attempts < 1:\n        raise ValueError(\"max_attempts must be at least 1\")\n    graph = extraction_graph(model)\n    graph.add_conditional_edges(\"validate\", lambda state: route(state, max_attempts), {\"generate\": \"generate\", \"fallback\": \"fallback\", END: END})\n    graph.add_edge(\"fallback\", END)\n    return graph.compile()",
        "check": "test(\"Build with a validated attempt budget\", lambda: build_extractor(scripted('{\"sku\":\"A\",\"quantity\":1}')).invoke({\"message\":\"one item\"})[\"attempts\"] == 1, \"A valid first reply finishes after exactly one attempt.\")",
        "expected": "A valid first reply finishes after exactly one attempt.",
        "reassurance": "The builder now combines the verified nodes, routing budget, and fallback exit."
      },
      {
        "title": "Script a reply that needs correction",
        "instruction": "Create `model` with the setup `scripted` helper. It accepts reply strings in their delivery order, returns a model callable, and records received validation feedback in `model.feedback`. Give it two JSON replies: first SKU “KB-01” with quantity text “two”, then SKU “KB-01” with integer quantity 2. Leave both replies unused until the next step.",
        "code": "model = scripted('{\"sku\": \"KB-01\", \"quantity\": \"two\"}', '{\"sku\": \"KB-01\", \"quantity\": 2}')",
        "check": "test(\"Script a reply that needs correction\", lambda: model.feedback == [], \"The scripted model has not been called yet.\")",
        "expected": "The scripted model has not been called yet.",
        "reassurance": "The next run will reveal exactly what feedback the correction received."
      },
      {
        "title": "Run the correction loop",
        "instruction": "Build an extractor for `model` with the default attempt budget and invoke it with a `message` field containing “Two keyboards please (KB-01)”. Save the completed state in `result`. Inspect whether the second reply corrected the validation failure and received its specific error as feedback.",
        "code": "result = build_extractor(model).invoke({\"message\": \"Two keyboards please (KB-01)\"})",
        "check": "test(\"Run the correction loop\", lambda: result[\"status\"] == \"ok\" and result[\"attempts\"] == 2 and model.feedback == [None, \"quantity must be an integer from 1 to 99\"], \"The second attempt succeeds and receives the first validation error as feedback.\")",
        "expected": "The second attempt succeeds and receives the first validation error as feedback.",
        "reassurance": "The loop corrected the specific invalid quantity within its budget."
      },
      {
        "title": "Inspect and verify retry safety",
        "instruction": "Display the `status`, `order`, and `attempts` from `result`, and display the feedback recorded in `model.feedback`. Check the chapter to verify success, correction, and the fallback when retries are exhausted.",
        "code": "print(result.get(\"status\"), result.get(\"order\"), result.get(\"attempts\"))\nprint(\"feedback the model saw:\", model.feedback)",
        "check": "",
        "expected": "The result is ok with quantity 2 after 2 attempts. Full checks cover success, repeated errors, fallback, and invalid budgets.",
        "reassurance": "You can inspect both the accepted result and the reason the model retried."
      }
    ],
    "setup": "import json\nfrom typing import TypedDict\nfrom langgraph.graph import StateGraph, START, END\n\nclass Extraction(TypedDict):\n    message: str\n    raw: str\n    order: dict\n    error: str\n    attempts: int\n    status: str\n\ndef parse_order(raw):\n    \"\"\"Return {\"sku\", \"quantity\"} or raise ValueError explaining what is wrong.\"\"\"\n    try:\n        data = json.loads(raw)\n    except json.JSONDecodeError:\n        raise ValueError(\"reply must be valid JSON\") from None\n    if not isinstance(data, dict):\n        raise ValueError(\"reply must be a JSON object\")\n    sku, quantity = data.get(\"sku\"), data.get(\"quantity\")\n    if not isinstance(sku, str) or not sku.strip():\n        raise ValueError(\"sku must be a non-empty string\")\n    if type(quantity) is not int or not 1 <= quantity <= 99:\n        raise ValueError(\"quantity must be an integer from 1 to 99\")\n    return {\"sku\": sku.strip(), \"quantity\": quantity}\n\ndef scripted(*replies):\n    \"\"\"A fake model that returns replies in order and records the feedback it was given.\"\"\"\n    queue = list(replies)\n    def model(message, feedback):\n        model.feedback.append(feedback)\n        return queue.pop(0)\n    model.feedback = []\n    return model"
  },
  "lg-react": {
    "steps": [
      {
        "title": "Call the model with the conversation",
        "instruction": "Define `agent` with one parameter, `state`, annotated as `MessagesState`. Give the setup `model` the full `messages` history through its `invoke` method, then return a `messages` update containing only the new AI reply. Leave the input history unchanged. The setup model has two scripted replies; defining the function must not consume them.",
        "code": "def agent(state: MessagesState):\n    return {\"messages\": [model.invoke(state[\"messages\"])]}",
        "check": "from langchain_core.messages import HumanMessage\ndef verify_agent_node():\n    global model\n    original = model\n    history = [HumanMessage(\"probe question\")]\n    before = list(history)\n    reply = AIMessage(\"probe answer\")\n    model = GenericFakeChatModel(messages=iter([reply]))\n    try:\n        update = agent({\"messages\": history})\n        return update == {\"messages\": [reply]} and model.calls == [before] and history == before\n    finally:\n        model = original\ntest(\"agent forwards history and returns only the new message\", verify_agent_node, \"Return {messages: [model.invoke(state[messages])]} without changing the input history.\")\ntest(\"the demonstration replies remain unused\", lambda: model.calls == [], \"The probe must use an independent model.\")",
        "expected": "A fresh probe receives the unchanged conversation, and agent returns only its new AI message. The demonstration replies remain unused.",
        "reassurance": "Your agent forwards the conversation and returns the expected message update. The graph demonstration still has both scripted replies available."
      },
      {
        "title": "Run every requested tool",
        "instruction": "Define `tools` with one parameter, `state`, annotated as `MessagesState`. Read every tool call from the latest message, look up its `name` in the setup `TOOLS` registry, and invoke that tool with its `args`. For each output, create a `ToolMessage` with string `content` and the matching call `id` as `tool_call_id`. Return these messages as a `messages` update in request order; no calls should give an empty list. Preserve the existing history.",
        "code": "def tools(state: MessagesState):\n    results = []\n    for call in state[\"messages\"][-1].tool_calls:\n        output = TOOLS[call[\"name\"]].invoke(call[\"args\"])\n        results.append(ToolMessage(content=str(output), tool_call_id=call[\"id\"]))\n    return {\"messages\": results}",
        "check": "test(\"Run every requested tool\", lambda: [(m.content, m.tool_call_id) for m in tools({\"messages\":[AIMessage(\"\", tool_calls=[{\"name\":\"multiply\", \"args\":{\"a\":2,\"b\":3}, \"id\":\"probe\"}]) ]})[\"messages\"]] == [(\"6\",\"probe\")], \"The probe tool result is text \\\"6\\\" with call ID probe.\")",
        "expected": "The probe tool result is text \"6\" with call ID probe.",
        "reassurance": "Tool execution and ID preservation work without calling the model."
      },
      {
        "title": "Stop when no tools are requested",
        "instruction": "Define `should_continue` with one parameter, `state`, annotated as `MessagesState`. Inspect only the latest message’s `tool_calls`. Select the node name `tools` when calls are present, otherwise select `END`. This rule should work for repeated tool rounds as well as a direct answer.",
        "code": "def should_continue(state: MessagesState):\n    return \"tools\" if state[\"messages\"][-1].tool_calls else END",
        "check": "test(\"Stop when no tools are requested\", lambda: should_continue({\"messages\":[AIMessage(\"done\")]}) == END and should_continue({\"messages\":[AIMessage(\"\", tool_calls=[{\"name\":\"multiply\",\"args\":{\"a\":2,\"b\":3},\"id\":\"p\"}])]}) == \"tools\", \"A plain reply ends; a tool request goes to tools.\")",
        "expected": "A plain reply ends; a tool request goes to tools.",
        "reassurance": "Both routing choices are verified before the agent runs."
      },
      {
        "title": "Create the agent graph",
        "instruction": "Create an empty `StateGraph` named `graph` using `MessagesState`. Its reducer appends user, model, and tool messages in conversation order.",
        "code": "graph = StateGraph(MessagesState)",
        "check": "test(\"Create the agent graph\", lambda: graph.nodes == {}, \"The graph starts empty.\")",
        "expected": "The graph starts empty.",
        "reassurance": "The conversation reducer is already defined by MessagesState."
      },
      {
        "title": "Register the agent node",
        "instruction": "Register your `agent` function on `graph` under the node name `agent`. Registration should leave the scripted model replies unused.",
        "code": "graph.add_node(\"agent\", agent)",
        "check": "test(\"Register the agent node\", lambda: graph.nodes[\"agent\"] is agent and model.calls == [], \"agent is registered and no model calls have happened.\")",
        "expected": "agent is registered and no model calls have happened.",
        "reassurance": "The scripted replies are still untouched."
      },
      {
        "title": "Register the tools node",
        "instruction": "Register your `tools` function on `graph` under the node name `tools`.",
        "code": "graph.add_node(\"tools\", tools)",
        "check": "test(\"Register the tools node\", lambda: graph.nodes[\"tools\"] is tools, \"tools is registered.\")",
        "expected": "tools is registered.",
        "reassurance": "Both parts of the ReAct cycle are now available."
      },
      {
        "title": "Start with the agent",
        "instruction": "Connect `START` to `agent` so the model first reads the user’s question.",
        "code": "graph.add_edge(START, \"agent\")",
        "check": "test(\"Start with the agent\", lambda: (START,\"agent\") in graph.edges, \"START points to agent.\")",
        "expected": "START points to agent.",
        "reassurance": "The model gets the user question before any tool runs."
      },
      {
        "title": "Choose tools or finish",
        "instruction": "Attach `should_continue` as the conditional router after `agent`. Map the `tools` result to the `tools` node and the `END` result to the graph finish.",
        "code": "graph.add_conditional_edges(\"agent\", should_continue, {\"tools\": \"tools\", END: END})",
        "check": "test(\"Choose tools or finish\", lambda: graph.conditional[0][1]({\"messages\":[AIMessage(\"done\")]}) == END, \"A final text answer follows the END route.\")",
        "expected": "A final text answer follows the END route.",
        "reassurance": "The graph has an explicit stop condition."
      },
      {
        "title": "Return tool results to the agent",
        "instruction": "Connect `tools` back to `agent` so the model can read the tool results before choosing another tool round or its final answer.",
        "code": "graph.add_edge(\"tools\", \"agent\")",
        "check": "test(\"Return tool results to the agent\", lambda: (\"tools\",\"agent\") in graph.edges, \"tools points back to agent.\")",
        "expected": "tools points back to agent.",
        "reassurance": "The model can now read tool outputs and decide what to do next."
      },
      {
        "title": "Compile the agent",
        "instruction": "Compile `graph` and keep its runnable as `app`. Do not invoke it yet; both scripted replies are needed for the complete demonstration.",
        "code": "app = graph.compile()",
        "check": "test(\"Compile the agent\", lambda: callable(app.invoke) and model.calls == [], \"app is callable and both scripted replies remain unused.\")",
        "expected": "app is callable and both scripted replies remain unused.",
        "reassurance": "The graph is ready for its first complete run."
      },
      {
        "title": "Run the tool cycle",
        "instruction": "Invoke `app` with a `messages` list containing one user message, “What is 17 * 3?”. A role-and-text pair is an accepted message input. Save the returned conversation state in `out`, then check its message order and the tool result.",
        "code": "out = app.invoke({\"messages\": [(\"user\", \"What is 17 * 3?\")]})",
        "check": "test(\"Run the tool cycle\", lambda: [m.type for m in out[\"messages\"]] == [\"human\",\"ai\",\"tool\",\"ai\"] and out[\"messages\"][2].content == \"51\", \"The conversation is human \\u2192 model request \\u2192 tool result 51 \\u2192 final model answer.\")",
        "expected": "The conversation is human → model request → tool result 51 → final model answer.",
        "reassurance": "The model asked, the tool ran, and the result returned to the model."
      },
      {
        "title": "Print and verify the agent",
        "instruction": "Display the content of the last message in `out`, then check the chapter. Trace how the user question led to a model tool request, a tool result, and the final model answer; the checks also exercise multiple tools and repeated rounds.",
        "code": "print(out[\"messages\"][-1].content)",
        "check": "",
        "expected": "The output is 17 * 3 = 51. The full checks also verify call IDs, repeated rounds, and answers needing no tools.",
        "reassurance": "The complete ReAct cycle is visible in both the answer and the graph trace."
      }
    ],
    "setup": "from langchain_core.tools import tool\nfrom langchain_core.messages import AIMessage, ToolMessage\nfrom langchain_core.language_models import GenericFakeChatModel\nfrom langgraph.graph import StateGraph, MessagesState, START, END\n\n@tool\ndef multiply(a: int, b: int) -> int:\n    \"\"\"Multiply two integers.\"\"\"\n    return a * b\n\nTOOLS = {\"multiply\": multiply}\n\nmodel = GenericFakeChatModel(messages=iter([\n    AIMessage(\"\", tool_calls=[{\"name\": \"multiply\", \"args\": {\"a\": 17, \"b\": 3}, \"id\": \"call_1\"}]),\n    AIMessage(\"17 * 3 = 51\"),\n]))"
  }
}
