import type { CodingGuide } from '../guided';

export const MLFLOW_GUIDES: Record<string, CodingGuide> = {
  "ml-first-run": {
    "steps": [
      {
        "title": "Import the notebook",
        "instruction": "Make the `mlflow` module available in your program. This first checkpoint only checks that tracking is ready and no run is open.",
        "code": "import mlflow",
        "check": "test(\"Import the notebook\", lambda: mlflow.active_run() is None, \"There is no open run yet.\")",
        "expected": "There is no open run yet.",
        "reassurance": "The notebook is ready; you have not recorded an attempt yet."
      },
      {
        "title": "Open one attempt",
        "instruction": "Create a tracking run named `baseline` and store its handle in `run`. Leave it active so the next steps can attach data to the same attempt.",
        "code": "run = mlflow.start_run(run_name=\"baseline\")",
        "check": "test(\"Open one attempt\", lambda: run.info.run_name == \"baseline\" and mlflow.active_run() is not None, \"One active run named baseline.\")",
        "expected": "One active run named baseline.",
        "reassurance": "That is the right notebook page. Next we will record its inputs."
      },
      {
        "title": "Record the chosen model",
        "instruction": "Record `model` as a parameter of the active baseline run, with the value `tiny`. A parameter describes a choice made before measuring the result.",
        "code": "mlflow.log_param(\"model\", \"tiny\")",
        "check": "test(\"Record the chosen model\", lambda: mlflow.get_run(run.info.run_id).data.params == {\"model\": \"tiny\"}, \"The model param is tiny.\")",
        "expected": "The model param is tiny.",
        "reassurance": "Your input is recorded. The measured result belongs in a separate metric."
      },
      {
        "title": "Record the measured accuracy",
        "instruction": "Record an `accuracy` metric of `0.72` on the active baseline run. Keep the model choice in parameters and the measured score in metrics.",
        "code": "mlflow.log_metric(\"accuracy\", 0.72)",
        "check": "test(\"Record the measured accuracy\", lambda: mlflow.get_run(run.info.run_id).data.metrics.get(\"accuracy\") == 0.72, \"The accuracy metric is 0.72.\")",
        "expected": "The accuracy metric is 0.72.",
        "reassurance": "The score is attached to baseline. We still need to close the run."
      },
      {
        "title": "Close the notebook page",
        "instruction": "Finish the active run. It should have status `FINISHED`, and no run should remain active; keep `run` available for later inspection.",
        "code": "mlflow.end_run()",
        "check": "test(\"Close the notebook page\", lambda: mlflow.active_run() is None and mlflow.get_run(run.info.run_id).info.status == \"FINISHED\", \"The run is FINISHED and no run is active.\")",
        "expected": "The run is FINISHED and no run is active.",
        "reassurance": "The attempt is safely closed. The last check will verify the whole record."
      },
      {
        "title": "Read it back",
        "instruction": "Display the run history so you can inspect the baseline name, model parameter and accuracy metric together. Then use the chapter verification to check the complete record.",
        "code": "print(mlflow.search_runs())",
        "check": "",
        "expected": "One baseline row with model tiny and accuracy 0.72.",
        "reassurance": "A single recorded attempt is enough for this chapter; the full checks confirm its details."
      }
    ]
  },
  "ml-track": {
    "setup": "import mlflow",
    "steps": [
      {
        "title": "Choose the experiment",
        "instruction": "Choose `prompt-tuning` as the experiment for these temperature trials. This checkpoint checks the grouping before any trials are recorded.",
        "code": "mlflow.set_experiment(\"prompt-tuning\")",
        "check": "test(\"Choose the experiment\", lambda: mlflow.get_experiment_by_name(\"prompt-tuning\").name == \"prompt-tuning\", \"The prompt-tuning experiment exists.\")",
        "expected": "The prompt-tuning experiment exists.",
        "reassurance": "You have chosen the folder. No scores are expected yet."
      },
      {
        "title": "Record one input",
        "instruction": "Define `record_temperature(temperature)`. It should open one run named `temp-` followed by the temperature, log the input as the `temperature` parameter, and close the run when done.",
        "code": "def record_temperature(temperature):\n    with mlflow.start_run(run_name=f\"temp-{temperature}\"):\n        mlflow.log_param(\"temperature\", temperature)",
        "check": "record_temperature(0.5)\nruns = mlflow.search_runs()\ntest(\"Record one input\", lambda: len(runs) == 1 and runs.iloc[0][\"tags.mlflow.runName\"] == \"temp-0.5\" and runs.iloc[0][\"params.temperature\"] == \"0.5\" and mlflow.active_run() is None, \"One closed run temp-0.5 with temperature 0.5.\")",
        "expected": "One closed run temp-0.5 with temperature 0.5.",
        "reassurance": "The input is recorded. The run still needs its measured score."
      },
      {
        "title": "Describe one trial",
        "instruction": "Update `record_temperature` so the same run also logs a `quality` metric: 0.95 minus 0.3 times the temperature.",
        "code": "def record_temperature(temperature):\n    with mlflow.start_run(run_name=f\"temp-{temperature}\"):\n        mlflow.log_param(\"temperature\", temperature)\n        mlflow.log_metric(\"quality\", 0.95 - 0.3 * temperature)",
        "check": "record_temperature(0.5)\nruns = mlflow.search_runs()\ntest(\"one temperature trial records both values\", lambda: len(runs) == 1 and runs.iloc[0][\"params.temperature\"] == \"0.5\" and abs(runs.iloc[0][\"metrics.quality\"] - 0.8) < 1e-12 and mlflow.active_run() is None, \"One closed run with temperature 0.5 and quality about 0.8.\")",
        "expected": "One finished trial contains temperature \"0.5\" and quality about 0.8.",
        "reassurance": "The check records one trial and verifies its values. Next you will repeat that tested behavior for three inputs.",
        "startFrom": [
          1
        ]
      },
      {
        "title": "Run the three trials",
        "instruction": "Use your recorder for the three temperatures `0.0`, `0.5` and `1.0`, with one separate run per input. The chapter verification will compare the stored parameters and scores.",
        "code": "for temperature in [0.0, 0.5, 1.0]:\n    record_temperature(temperature)",
        "check": "",
        "expected": "Three runs, with quality 0.95, 0.8 and about 0.65.",
        "reassurance": "The complete checks now verify the logged inputs and decreasing scores."
      }
    ]
  },
  "ml-sweep": {
    "setup": "import mlflow\n\ndef evaluate(lr, depth):\n    \"\"\"Pretend training. Peak accuracy at lr=0.1, depth=4.\"\"\"\n    return 1 - abs(lr - 0.1) * 2 - abs(depth - 4) * 0.03",
    "steps": [
      {
        "title": "Check the fake evaluator",
        "instruction": "The available `evaluate(lr, depth)` helper returns an accuracy score for a setting. Measure learning rate `0.1` and depth `4`, and store the score in `peak` to establish a known result before adding tracking.",
        "code": "peak = evaluate(0.1, 4)",
        "check": "test(\"Check the fake evaluator\", lambda: peak == 1.0, \"The peak accuracy is 1.0.\")",
        "expected": "The peak accuracy is 1.0.",
        "reassurance": "The evaluator works. Your remaining job is to record and compare its results."
      },
      {
        "title": "Score one combination",
        "instruction": "Define `record_setting(lr, depth)`. It should open one run and log an `accuracy` metric from the available evaluator for those inputs, finishing the run when done.",
        "code": "def record_setting(lr, depth):\n    with mlflow.start_run():\n        mlflow.log_metric(\"accuracy\", evaluate(lr, depth))",
        "check": "record_setting(0.1, 4)\nruns = mlflow.search_runs()\ntest(\"Score one combination\", lambda: len(runs) == 1 and runs.iloc[0][\"metrics.accuracy\"] == 1.0 and mlflow.active_run() is None, \"One closed run with accuracy 1.0.\")",
        "expected": "One closed run with accuracy 1.0.",
        "reassurance": "The score is stored, but nothing says which setting produced it yet."
      },
      {
        "title": "Record one combination",
        "instruction": "Update `record_setting` so the run also records `lr` and `depth` as parameters, both in one call with `mlflow.log_params`.",
        "code": "def record_setting(lr, depth):\n    with mlflow.start_run():\n        mlflow.log_params({\"lr\": lr, \"depth\": depth})\n        mlflow.log_metric(\"accuracy\", evaluate(lr, depth))",
        "check": "record_setting(0.1, 4)\nruns = mlflow.search_runs()\ntest(\"one setting is recorded\", lambda: len(runs) == 1 and runs.iloc[0][\"params.lr\"] == \"0.1\" and runs.iloc[0][\"params.depth\"] == \"4\" and runs.iloc[0][\"metrics.accuracy\"] == 1.0, \"One run with lr 0.1, depth 4 and accuracy 1.0.\")",
        "expected": "One finished run contains lr 0.1, depth 4 and accuracy 1.0.",
        "reassurance": "One combination has a clear recording recipe. The next helper supplies the combinations.",
        "startFrom": [
          1
        ]
      },
      {
        "title": "Visit one row of the grid",
        "instruction": "Define `record_row(lr, depths)` to call `record_setting` once for each depth in `depths`, all with the same learning rate.",
        "code": "def record_row(lr, depths):\n    for depth in depths:\n        record_setting(lr, depth)",
        "check": "record_row(0.1, [2, 4])\nruns = mlflow.search_runs()\ntest(\"Visit one row of the grid\", lambda: len(runs) == 2 and sorted(runs[\"params.depth\"]) == [\"2\", \"4\"] and set(runs[\"params.lr\"]) == {\"0.1\"}, \"Two runs, both lr 0.1, with depths 2 and 4.\")",
        "expected": "Two runs, both lr 0.1, with depths 2 and 4.",
        "reassurance": "One learning rate is covered. Repeating that for each learning rate gives the full grid."
      },
      {
        "title": "Visit the grid",
        "instruction": "Define `record_grid(lrs, depths)` to record every learning-rate/depth combination by using `record_row` for each learning rate. Two inputs in each list should produce four runs.",
        "code": "def record_grid(lrs, depths):\n    for lr in lrs:\n        record_row(lr, depths)",
        "check": "record_grid([0.01, 0.1], [2, 4])\ntest(\"two by two grid records four runs\", lambda: len(mlflow.search_runs()) == 4, \"Two learning rates times two depths gives four runs.\")",
        "expected": "A two-by-two check grid records four runs.",
        "reassurance": "The grid logic is ready. We will verify its nine runs before choosing a winner."
      },
      {
        "title": "Try the grid",
        "instruction": "Choose experiment `sweep` and use your grid helper for learning rates `0.01`, `0.1`, `0.5` and depths `2`, `4`, `8`. There should be nine recorded combinations.",
        "code": "mlflow.set_experiment(\"sweep\")\nrecord_grid([0.01, 0.1, 0.5], [2, 4, 8])",
        "check": "test(\"Try the grid\", lambda: len(mlflow.search_runs()) == 9, \"Exactly nine runs.\")",
        "expected": "Exactly nine runs.",
        "reassurance": "All nine combinations are present. Recording is checked; selection comes next."
      },
      {
        "title": "Read the best params",
        "instruction": "Define `best_params()` to find the run with the highest `accuracy` in the selected experiment. Return a dictionary with keys `lr` and `depth`, using the winning parameter values in their stored string form.",
        "code": "def best_params():\n    best = mlflow.search_runs(order_by=[\"metrics.accuracy DESC\"]).iloc[0]\n    return {\"lr\": best[\"params.lr\"], \"depth\": best[\"params.depth\"]}",
        "check": "test(\"Read the best params\", lambda: best_params() == {\"lr\": \"0.1\", \"depth\": \"4\"}, \"The best parameters are lr \\\"0.1\\\" and depth \\\"4\\\".\")",
        "expected": "The best parameters are lr \"0.1\" and depth \"4\".",
        "reassurance": "The table identifies the peak correctly. Now join the tested pieces into the requested function."
      },
      {
        "title": "Assemble the sweep",
        "instruction": "Define `sweep(lrs, depths)` to select experiment `sweep`, record all combinations of its arguments and return the winning parameter dictionary. Every call must add one run per pair, including on repeated calls.",
        "code": "def sweep(lrs, depths):\n    mlflow.set_experiment(\"sweep\")\n    record_grid(lrs, depths)\n    return best_params()",
        "check": "",
        "expected": "The full checks find the winner and count nine new runs per call.",
        "reassurance": "The complete check uses the public sweep function, so its run count is verified too."
      }
    ]
  },
  "ml-search": {
    "setup": "import mlflow\n\ndef log_candidate(name, model, accuracy, latency_ms, status=\"FINISHED\"):\n    mlflow.start_run(run_name=name)\n    mlflow.log_param(\"model\", model)\n    mlflow.log_metrics({\"accuracy\": accuracy, \"latency_ms\": latency_ms})\n    mlflow.end_run(status)\n\nmlflow.set_experiment(\"ticket-classifier\")\nlog_candidate(\"tiny\", \"tiny\", 0.81, 40)\nlog_candidate(\"small\", \"small\", 0.88, 95)\nlog_candidate(\"medium\", \"medium\", 0.88, 120)\nlog_candidate(\"large\", \"large\", 0.93, 310)\nlog_candidate(\"small-v2\", \"small\", 0.95, 80, status=\"FAILED\")   # crashed before evaluation finished",
    "steps": [
      {
        "title": "Filter finished runs",
        "instruction": "Define `eligible_runs(experiment, max_latency_ms)` to return a run table from the named experiment only. Include only `FINISHED` runs whose `latency_ms` is at most the budget. Order by highest `accuracy` first, with lower latency breaking ties. Do not record or alter runs.",
        "code": "def eligible_runs(experiment, max_latency_ms):\n    return mlflow.search_runs(experiment_names=[experiment], filter_string=f\"metrics.latency_ms <= {max_latency_ms} and attributes.status = 'FINISHED'\", order_by=[\"metrics.accuracy DESC\", \"metrics.latency_ms ASC\"])",
        "check": "test(\"Filter finished runs\", lambda: eligible_runs(\"ticket-classifier\", 150)[\"tags.mlflow.runName\"].tolist() == [\"small\", \"medium\", \"tiny\"], \"Eligible runs are small, medium, tiny, in that order.\")",
        "expected": "Eligible runs are small, medium, tiny, in that order.",
        "reassurance": "The crashed and over-budget runs are excluded. This verifies the search before unpacking a result."
      },
      {
        "title": "Unpack one result",
        "instruction": "Define `unpack_run(best)` for one row from that run table. Return a dictionary with keys `run_id`, `model`, `accuracy` and `latency_ms`. The model comes from the `model` parameter; the two metric values should be floats.",
        "code": "def unpack_run(best):\n    return {\"run_id\": best[\"run_id\"], \"model\": best[\"params.model\"], \"accuracy\": float(best[\"metrics.accuracy\"]), \"latency_ms\": float(best[\"metrics.latency_ms\"])}",
        "check": "test(\"Unpack one result\", lambda: unpack_run(eligible_runs(\"ticket-classifier\", 150).iloc[0])[\"latency_ms\"] == 95.0, \"The best qualifying row has latency 95.0 ms.\")",
        "expected": "The best qualifying row has latency 95.0 ms.",
        "reassurance": "The row is decoded correctly. Empty searches still need a safe result."
      },
      {
        "title": "Handle an empty search",
        "instruction": "Define `best_within_budget(experiment, max_latency_ms)` using your search and row helpers. Return the best qualifying run as that dictionary, or `None` when the search is empty. Respect the named experiment even when another experiment is active, and leave the history unchanged.",
        "code": "def best_within_budget(experiment, max_latency_ms):\n    runs = eligible_runs(experiment, max_latency_ms)\n    return None if runs.empty else unpack_run(runs.iloc[0])",
        "check": "",
        "expected": "Small wins at 150 ms; a 5 ms budget returns None.",
        "reassurance": "The final checks cover budget boundaries, ties, other experiments and read-only behavior."
      }
    ]
  },
  "ml-registry": {
    "steps": [
      {
        "title": "Import MLflow",
        "instruction": "Make the `mlflow` module available so you can define a Python model and manage its registry lifecycle.",
        "code": "import mlflow",
        "check": "test(\"Import MLflow\", lambda: mlflow.active_run() is None, \"No active run.\")",
        "expected": "No active run.",
        "reassurance": "You are ready to define the smallest possible model."
      },
      {
        "title": "Define the echo model",
        "instruction": "Define class `Echo` as an MLflow Python model. Its `predict(self, context, model_input, params=None)` method should return the input unchanged, including inputs other than the sample string.",
        "code": "class Echo(mlflow.pyfunc.PythonModel):\n    def predict(self, context, model_input, params=None):\n        return model_input",
        "check": "test(\"Define the echo model\", lambda: Echo().predict(None, \"hi\") == \"hi\", \"The model returns hi for hi.\")",
        "expected": "The model returns hi for hi.",
        "reassurance": "The prediction behavior is verified before it enters the registry."
      },
      {
        "title": "Log the artifact",
        "instruction": "Log an `Echo` instance as the model artifact named `echo` inside a tracking run. Keep the model information in `info`, including its model URI, and finish the run.",
        "code": "with mlflow.start_run():\n    info = mlflow.pyfunc.log_model(name=\"echo\", python_model=Echo())",
        "check": "test(\"Log the artifact\", lambda: bool(info.model_uri) and mlflow.active_run() is None, \"A model URI exists and its run is closed.\")",
        "expected": "A model URI exists and its run is closed.",
        "reassurance": "The artifact exists. Registering it is the next distinct operation."
      },
      {
        "title": "Create version one",
        "instruction": "Register the model URI from `info` under registry name `echo-bot`. Store the registered model version in `mv`; the first registration should create version `1`.",
        "code": "mv = mlflow.register_model(info.model_uri, \"echo-bot\")",
        "check": "test(\"Create version one\", lambda: mv.version == \"1\", \"echo-bot version \\\"1\\\".\")",
        "expected": "echo-bot version \"1\".",
        "reassurance": "The first version is registered. An alias will give consumers a stable name."
      },
      {
        "title": "Open a registry client",
        "instruction": "Create an `mlflow.MlflowClient` and store it in `client`. Registry changes such as aliases go through this client.",
        "code": "client = mlflow.MlflowClient()",
        "check": "test(\"Open a registry client\", lambda: hasattr(client, \"set_registered_model_alias\"), \"client can manage registry aliases.\")",
        "expected": "client can manage registry aliases.",
        "reassurance": "The client is ready. Next use it to name a version."
      },
      {
        "title": "Assign the champion alias",
        "instruction": "Use `client` to give the registered `echo-bot` version in `mv` the alias `champion`. The alias should identify that same version for consumers.",
        "code": "client.set_registered_model_alias(\"echo-bot\", \"champion\", mv.version)",
        "check": "test(\"Assign the champion alias\", lambda: mlflow.MlflowClient().get_model_version_by_alias(\"echo-bot\", \"champion\").version == \"1\", \"Champion points to version \\\"1\\\".\")",
        "expected": "Champion points to version \"1\".",
        "reassurance": "The alias points at the intended version. Next check the consumer-facing load."
      },
      {
        "title": "Load by alias",
        "instruction": "Load the `echo-bot` model through its `champion` alias and store the loaded model in `model`. Use the alias URI `models:/echo-bot@champion` so loading follows the registry alias.",
        "code": "model = mlflow.pyfunc.load_model(\"models:/echo-bot@champion\")",
        "check": "test(\"Load by alias\", lambda: model.predict(\"hi\") == \"hi\", \"The loaded model answers hi.\")",
        "expected": "The loaded model answers hi.",
        "reassurance": "Loading by alias preserves the model behavior. The final check verifies the whole lifecycle."
      },
      {
        "title": "Print its answer",
        "instruction": "Make a prediction with `model` for the input `hi` and display the answer. Use the final verification to check that the registered and loaded model still echoes its input.",
        "code": "print(model.predict(\"hi\"))",
        "check": "",
        "expected": "The output is hi.",
        "reassurance": "The complete checks confirm prediction, registration and alias together."
      }
    ]
  },
  "ml-artifacts": {
    "setup": "import mlflow",
    "steps": [
      {
        "title": "Reject empty score histories",
        "instruction": "Define `require_scores(scores)` to reject an empty score history with `ValueError` and accept a nonempty history without a return value. Validation must be available before any tracking run is created.",
        "code": "def require_scores(scores):\n    if not scores:\n        raise ValueError(\"a trial needs at least one score\")",
        "check": "test(\"Reject empty score histories\", lambda: require_scores([0.2]) is None, \"A non-empty score list is accepted.\")",
        "expected": "A non-empty score list is accepted.",
        "reassurance": "Valid input is accepted; the final check also verifies empty input creates no run."
      },
      {
        "title": "Build the summary",
        "instruction": "Define `trial_summary(scores)` for a nonempty history. Return a dictionary with `steps` for the number of scores, `best` for the highest score and `last` for the final score. The final score may be lower than the best.",
        "code": "def trial_summary(scores):\n    return {\"steps\": len(scores), \"best\": max(scores), \"last\": scores[-1]}",
        "check": "test(\"Build the summary\", lambda: trial_summary([0.2, 0.9, 0.4]) == {\"steps\": 3, \"best\": 0.9, \"last\": 0.4}, \"Three steps, best 0.9, last 0.4.\")",
        "expected": "Three steps, best 0.9, last 0.4.",
        "reassurance": "The summary preserves the distinction. The next helper records the curve itself."
      },
      {
        "title": "Log the curve",
        "instruction": "Define `log_scores(scores)` to record every score on the active run under metric name `quality`, preserving input order and zero-based step numbers. This helper should leave opening and closing the run to its caller.",
        "code": "def log_scores(scores):\n    for step, score in enumerate(scores):\n        mlflow.log_metric(\"quality\", score, step=step)",
        "check": "with mlflow.start_run() as practice:\n    log_scores([0.2, 0.9, 0.4])\ntest(\"scores keep their zero-based steps\", lambda: mlflow.get_run(practice.info.run_id).metrics[\"quality\"] == [(0, 0.2), (1, 0.9), (2, 0.4)], \"History is [(0, 0.2), (1, 0.9), (2, 0.4)].\")",
        "expected": "Quality history is [(0, 0.2), (1, 0.9), (2, 0.4)].",
        "reassurance": "The loop is ready. We will inspect a real recorded history next."
      },
      {
        "title": "Record the curve in a named run",
        "instruction": "Define `record_trial(name, params, scores)`. For now it opens one run named `name` and records the score history in it with `log_scores`. Ignore `params` until the next step.",
        "code": "def record_trial(name, params, scores):\n    with mlflow.start_run(run_name=name):\n        log_scores(scores)",
        "check": "record_trial(\"practice\", {}, [0.2, 0.9, 0.4])\nruns = mlflow.search_runs()\ntest(\"Record the curve in a named run\", lambda: len(runs) == 1 and runs.iloc[0][\"tags.mlflow.runName\"] == \"practice\" and mlflow.get_run(runs.iloc[0][\"run_id\"]).metrics[\"quality\"] == [(0, 0.2), (1, 0.9), (2, 0.4)], \"One run named practice with history [(0, 0.2), (1, 0.9), (2, 0.4)].\")",
        "expected": "One run named practice with history [(0, 0.2), (1, 0.9), (2, 0.4)].",
        "reassurance": "The curve is stored. Next validate first and file the run in its experiment."
      },
      {
        "title": "Validate and file the trial",
        "instruction": "Update `record_trial` so it first checks the scores with `require_scores`, then chooses experiment `trial-history`, and inside the run also logs `params` as parameters.",
        "code": "def record_trial(name, params, scores):\n    require_scores(scores)\n    mlflow.set_experiment(\"trial-history\")\n    with mlflow.start_run(run_name=name):\n        mlflow.log_params(params)\n        log_scores(scores)",
        "check": "def _rejects(fn):\n    try:\n        fn()\n    except ValueError:\n        return True\n    return False\nrecord_trial(\"practice\", {\"temperature\": 0.2}, [0.5])\nruns = mlflow.search_runs(experiment_names=[\"trial-history\"])\ntest(\"Validate and file the trial\", lambda: len(runs) == 1 and runs.iloc[0][\"params.temperature\"] == \"0.2\" and _rejects(lambda: record_trial(\"empty\", {}, [])) and len(mlflow.search_runs(search_all_experiments=True)) == 1, \"One trial-history run with temperature 0.2; empty scores raise ValueError and add no run.\")",
        "expected": "One trial-history run with temperature 0.2; empty scores raise ValueError and add no run.",
        "reassurance": "Bad input is stopped before any run exists.",
        "startFrom": [
          3
        ]
      },
      {
        "title": "Attach the summary",
        "instruction": "Update `record_trial` so the run also stores the `trial_summary` of the scores as an artifact named `summary.json`, using `mlflow.log_dict`.",
        "code": "def record_trial(name, params, scores):\n    require_scores(scores)\n    mlflow.set_experiment(\"trial-history\")\n    with mlflow.start_run(run_name=name):\n        mlflow.log_params(params)\n        log_scores(scores)\n        mlflow.log_dict(trial_summary(scores), \"summary.json\")",
        "check": "record_trial(\"practice\", {}, [0.2, 0.9, 0.4])\nruns = mlflow.search_runs()\ntest(\"Attach the summary\", lambda: mlflow.get_run(runs.iloc[0][\"run_id\"]).artifacts.get(\"summary.json\") == {\"steps\": 3, \"best\": 0.9, \"last\": 0.4}, \"summary.json holds steps 3, best 0.9, last 0.4.\")",
        "expected": "summary.json holds steps 3, best 0.9, last 0.4.",
        "reassurance": "The artifact keeps the best score even though the latest metric is lower.",
        "startFrom": [
          4
        ]
      },
      {
        "title": "Assemble one trial",
        "instruction": "Update `record_trial` so it keeps the run handle from the `with` statement in `run` and, after the run has closed, returns its run ID.",
        "code": "def record_trial(name, params, scores):\n    require_scores(scores)\n    mlflow.set_experiment(\"trial-history\")\n    with mlflow.start_run(run_name=name) as run:\n        mlflow.log_params(params)\n        log_scores(scores)\n        mlflow.log_dict(trial_summary(scores), \"summary.json\")\n    return run.info.run_id",
        "check": "test(\"Assemble one trial\", lambda: mlflow.get_run(record_trial(\"practice\", {}, [0.2, 0.9, 0.4])).metrics[\"quality\"] == [(0, 0.2), (1, 0.9), (2, 0.4)], \"The returned ID finds a run with history [(0, 0.2), (1, 0.9), (2, 0.4)].\")",
        "expected": "The returned ID finds a run with history [(0, 0.2), (1, 0.9), (2, 0.4)].",
        "reassurance": "Callers can now find the run they just recorded.",
        "startFrom": [
          5
        ]
      },
      {
        "title": "Fetch the sample run",
        "instruction": "Record a sample named `small-model` with temperature parameter `0.2` and scores `0.4`, `0.7`, `0.6`; keep its run ID in `run_id`. Then fetch that run's stored record with `mlflow.get_run` and keep it in `run`.",
        "code": "run_id = record_trial(\"small-model\", {\"temperature\": 0.2}, [0.4, 0.7, 0.6])\nrun = mlflow.get_run(run_id)",
        "check": "test(\"Fetch the sample run\", lambda: run.info.run_id == run_id and run.info.run_name == \"small-model\", \"run is the stored small-model run.\")",
        "expected": "run is the stored small-model run.",
        "reassurance": "The fetched record holds everything the run logged."
      },
      {
        "title": "Read the recorded metrics",
        "instruction": "Display the latest metric values stored in `run`'s data, and check how the latest quality differs from the best score in its summary artifact.",
        "code": "print(run.data.metrics)",
        "check": "",
        "expected": "The latest quality metric is 0.6; its artifact keeps best 0.7.",
        "reassurance": "The complete check verifies the public function and that caller data stays unchanged."
      }
    ]
  },
  "ml-dataset-digest": {
    "setup": "import hashlib\nimport json\nimport mlflow",
    "steps": [
      {
        "title": "Canonicalize each row",
        "instruction": "Define `canonical_rows(rows)` to return sorted JSON strings for the rows. Each row string must sort its keys and omit formatting spaces. Retain duplicate rows and leave the original rows unchanged so order alone cannot change the dataset identity.",
        "code": "def canonical_rows(rows):\n    return sorted(json.dumps(row, sort_keys=True, separators=(\",\", \":\")) for row in rows)",
        "check": "test(\"Canonicalize each row\", lambda: canonical_rows([{\"label\": \"x\", \"input\": \"a\"}]) == ['{\"input\":\"a\",\"label\":\"x\"}'], \"Canonical text is {\\\"input\\\":\\\"a\\\",\\\"label\\\":\\\"x\\\"}.\")",
        "expected": "Canonical text is {\"input\":\"a\",\"label\":\"x\"}.",
        "reassurance": "The row representation is stable. Sorting retains duplicate rows, as the score requires."
      },
      {
        "title": "Turn the rows into bytes",
        "instruction": "Define `dataset_bytes(rows)` to join the canonical row strings with newline characters and return that text encoded as UTF-8 bytes.",
        "code": "def dataset_bytes(rows):\n    return \"\\n\".join(canonical_rows(rows)).encode()",
        "check": "test(\"Turn the rows into bytes\", lambda: dataset_bytes([{\"input\": \"b\"}, {\"input\": \"a\"}]) == b'{\"input\":\"a\"}\\n{\"input\":\"b\"}', \"Two rows become sorted canonical lines as bytes.\")",
        "expected": "Two rows become sorted canonical lines as bytes.",
        "reassurance": "Hash functions work on bytes, not text, so this is what gets fingerprinted."
      },
      {
        "title": "Fingerprint the dataset",
        "instruction": "Define `dataset_digest(rows)` to hash `dataset_bytes(rows)` with SHA-256 from `hashlib` and return the first 12 characters of its hexadecimal form. Reordering rows or keys must keep the digest stable; changed values and duplicate counts must affect it.",
        "code": "def dataset_digest(rows):\n    return hashlib.sha256(dataset_bytes(rows)).hexdigest()[:12]",
        "check": "test(\"Fingerprint the dataset\", lambda: dataset_digest([{\"input\": \"a\", \"label\": \"x\"}, {\"input\": \"b\", \"label\": \"y\"}, {\"input\": \"c\", \"label\": \"z\"}, {\"input\": \"d\", \"label\": \"x\"}]) == \"2cc747407345\", \"The sample fingerprint is 2cc747407345.\")",
        "expected": "The sample fingerprint is 2cc747407345.",
        "reassurance": "The exact fingerprint matches. The final check will also change order, labels and duplicates."
      },
      {
        "title": "Measure accuracy",
        "instruction": "Define `eval_accuracy(predict, rows)`. Each row has `input` and `label`; return the fraction of rows whose predicted answer for `input` exactly matches `label`.",
        "code": "def eval_accuracy(predict, rows):\n    return sum(predict(row[\"input\"]) == row[\"label\"] for row in rows) / len(rows)",
        "check": "test(\"Measure accuracy\", lambda: eval_accuracy(lambda q: \"x\", [{\"input\": \"a\", \"label\": \"x\"}, {\"input\": \"b\", \"label\": \"y\"}]) == 0.5, \"One correct answer out of two gives 0.5.\")",
        "expected": "One correct answer out of two gives 0.5.",
        "reassurance": "An empty dataset would divide by zero here. Guard against it next."
      },
      {
        "title": "Measure accuracy safely",
        "instruction": "Update `eval_accuracy` so empty rows raise `ValueError` before any division.",
        "code": "def eval_accuracy(predict, rows):\n    if not rows:\n        raise ValueError(\"cannot evaluate on an empty dataset\")\n    return sum(predict(row[\"input\"]) == row[\"label\"] for row in rows) / len(rows)",
        "check": "def _rejects(fn):\n    try:\n        fn()\n    except ValueError:\n        return True\n    return False\ntest(\"Measure accuracy safely\", lambda: eval_accuracy(lambda q: q.upper(), [{\"input\": \"a\", \"label\": \"A\"}]) == 1.0 and _rejects(lambda: eval_accuracy(lambda q: q, [])), \"One correct answer out of one gives 1.0; empty rows raise ValueError.\")",
        "expected": "One correct answer out of one gives 1.0; empty rows raise ValueError.",
        "reassurance": "Scoring works independently of tracking. Next attach that score to a run.",
        "startFrom": [
          3
        ]
      },
      {
        "title": "Record the score in a run",
        "instruction": "Define `log_eval(run_name, predict, rows)`. For now it opens one run named `run_name`, keeping its handle as `run`, and logs the `eval_accuracy` of `predict` on `rows` as metric `accuracy`.",
        "code": "def log_eval(run_name, predict, rows):\n    with mlflow.start_run(run_name=run_name) as run:\n        mlflow.log_metric(\"accuracy\", eval_accuracy(predict, rows))",
        "check": "log_eval(\"practice\", lambda q: \"x\", [{\"input\": \"a\", \"label\": \"x\"}])\nruns = mlflow.search_runs()\ntest(\"Record the score in a run\", lambda: len(runs) == 1 and runs.iloc[0][\"tags.mlflow.runName\"] == \"practice\" and runs.iloc[0][\"metrics.accuracy\"] == 1.0, \"One run named practice with accuracy 1.0.\")",
        "expected": "One run named practice with accuracy 1.0.",
        "reassurance": "The score is tracked. Next make sure a bad dataset never opens a run."
      },
      {
        "title": "Measure before the run",
        "instruction": "Update `log_eval` so it measures accuracy into `accuracy` before anything else, then chooses experiment `eval`, and only then opens the run and logs that score.",
        "code": "def log_eval(run_name, predict, rows):\n    accuracy = eval_accuracy(predict, rows)\n    mlflow.set_experiment(\"eval\")\n    with mlflow.start_run(run_name=run_name) as run:\n        mlflow.log_metric(\"accuracy\", accuracy)",
        "check": "def _rejects(fn):\n    try:\n        fn()\n    except ValueError:\n        return True\n    return False\nlog_eval(\"practice\", lambda q: \"x\", [{\"input\": \"a\", \"label\": \"x\"}])\ntest(\"Measure before the run\", lambda: len(mlflow.search_runs(experiment_names=[\"eval\"])) == 1 and _rejects(lambda: log_eval(\"empty\", lambda q: q, [])) and len(mlflow.search_runs(search_all_experiments=True)) == 1 and mlflow.active_run() is None, \"One eval run; an empty dataset raises ValueError and adds no run.\")",
        "expected": "One eval run; an empty dataset raises ValueError and adds no run.",
        "reassurance": "Measuring first means a failure leaves no half-finished run behind.",
        "startFrom": [
          5
        ]
      },
      {
        "title": "Log one evaluation",
        "instruction": "Update `log_eval` so the run also stores the dataset fingerprint as tag `dataset_digest` and the row count as parameter `n_examples`. After the run closes, return its run ID. Preserve the dataset.",
        "code": "def log_eval(run_name, predict, rows):\n    accuracy = eval_accuracy(predict, rows)\n    mlflow.set_experiment(\"eval\")\n    with mlflow.start_run(run_name=run_name) as run:\n        mlflow.set_tag(\"dataset_digest\", dataset_digest(rows))\n        mlflow.log_param(\"n_examples\", len(rows))\n        mlflow.log_metric(\"accuracy\", accuracy)\n    return run.info.run_id",
        "check": "test(\"Log one evaluation\", lambda: mlflow.get_run(log_eval(\"practice\", lambda q: \"x\", [{\"input\": \"a\", \"label\": \"x\"}])).data.metrics[\"accuracy\"] == 1.0, \"A finished evaluation run with accuracy 1.0.\")",
        "expected": "A finished evaluation run with accuracy 1.0.",
        "reassurance": "The score is recorded. The next function filters comparisons to one exact dataset.",
        "startFrom": [
          6
        ]
      },
      {
        "title": "Find runs on the same data",
        "instruction": "Define `leaderboard(digest)`. Search experiment `eval` for `FINISHED` runs whose `dataset_digest` tag equals `digest`, and return a list of run-name/accuracy pairs, one per matching row, in any order. Do not log new runs.",
        "code": "def leaderboard(digest):\n    runs = mlflow.search_runs(experiment_names=[\"eval\"], filter_string=f\"tags.dataset_digest = '{digest}' and attributes.status = 'FINISHED'\")\n    return [(row[\"tags.mlflow.runName\"], row[\"metrics.accuracy\"]) for _, row in runs.iterrows()]",
        "check": "rows = [{\"input\": \"a\", \"label\": \"x\"}, {\"input\": \"b\", \"label\": \"y\"}]\nlog_eval(\"half\", lambda q: \"x\", rows)\nlog_eval(\"other-data\", lambda q: \"x\", rows[:1])\ntest(\"Find runs on the same data\", lambda: sorted(leaderboard(dataset_digest(rows))) == [(\"half\", 0.5)], \"Only the run on the same dataset appears: (half, 0.5).\")",
        "expected": "Only the run on the same dataset appears: (half, 0.5).",
        "reassurance": "The filter keeps comparisons fair. Last, rank the pairs."
      },
      {
        "title": "Build the matching leaderboard",
        "instruction": "Update `leaderboard` so it keeps the pairs in `board` and returns them sorted by decreasing accuracy, then alphabetically by run name for ties. No matches still give an empty list.",
        "code": "def leaderboard(digest):\n    runs = mlflow.search_runs(experiment_names=[\"eval\"], filter_string=f\"tags.dataset_digest = '{digest}' and attributes.status = 'FINISHED'\")\n    board = [(row[\"tags.mlflow.runName\"], row[\"metrics.accuracy\"]) for _, row in runs.iterrows()]\n    return sorted(board, key=lambda item: (-item[1], item[0]))",
        "check": "",
        "expected": "Only finished evaluations on the same digest appear; unknown digests give [].",
        "reassurance": "The full chapter checks dataset stability, matching leaderboards and rejection before logging.",
        "startFrom": [
          8
        ]
      }
    ]
  },
  "ml-promotion": {
    "setup": "import mlflow\n\nclass Echo(mlflow.pyfunc.PythonModel):\n    def predict(self, context, model_input, params=None):\n        return model_input\n\ndef register_candidate(name, quality):\n    with mlflow.start_run() as run:\n        mlflow.log_metric(\"quality\", quality)\n        info = mlflow.pyfunc.log_model(name=\"model\", python_model=Echo())\n    return mlflow.register_model(info.model_uri, name)",
    "steps": [
      {
        "title": "Prepare a champion",
        "instruction": "Use the available `register_candidate(name, quality)` helper to register a `demo-model` baseline with quality `0.8`, storing its version object in `champion`. Assign the `champion` alias on that model to this version.",
        "code": "champion = register_candidate(\"demo-model\", 0.8)\nmlflow.MlflowClient().set_registered_model_alias(\"demo-model\", \"champion\", champion.version)",
        "check": "test(\"Prepare a champion\", lambda: mlflow.MlflowClient().get_model_version_by_alias(\"demo-model\", \"champion\").version == champion.version, \"The champion has stored quality 0.8.\")",
        "expected": "The champion has stored quality 0.8.",
        "reassurance": "There is an existing champion to compare against. A later version alone will not justify promotion."
      },
      {
        "title": "Read stored quality",
        "instruction": "Define `quality_of(name, version)` to retrieve the `quality` metric from the tracking run behind a registered model version. Look the version up with the client, then use its recorded run ID rather than inferring quality from the version number.",
        "code": "def quality_of(name, version):\n    mv = mlflow.MlflowClient().get_model_version(name, version)\n    return mlflow.get_run(mv.run_id).data.metrics[\"quality\"]",
        "check": "test(\"Read stored quality\", lambda: quality_of(\"demo-model\", champion.version) == 0.8, \"The tracked quality is 0.8.\")",
        "expected": "The tracked quality is 0.8.",
        "reassurance": "The score comes from tracking data. The promotion rule can now compare measured values."
      },
      {
        "title": "Compare with the champion",
        "instruction": "Define `is_better(name, candidate_version)`. Look up the version that model's `champion` alias points to with the client, and return whether the candidate's stored quality is strictly higher than the champion's.",
        "code": "def is_better(name, candidate_version):\n    champion = mlflow.MlflowClient().get_model_version_by_alias(name, \"champion\")\n    return quality_of(name, candidate_version) > quality_of(name, champion.version)",
        "check": "test(\"Compare with the champion\", lambda: is_better(\"demo-model\", champion.version) is False and is_better(\"demo-model\", register_candidate(\"demo-model\", 0.85).version) is True, \"A tie is not better; quality 0.85 beats the 0.8 champion.\")",
        "expected": "A tie is not better; quality 0.85 beats the 0.8 champion.",
        "reassurance": "The decision is made from measured scores. Next act on it."
      },
      {
        "title": "Move the alias when better",
        "instruction": "Define `promote_if_better(name, candidate_version)`. When `is_better` says the candidate wins, point that model's `champion` alias at the candidate version; otherwise change nothing.",
        "code": "def promote_if_better(name, candidate_version):\n    if is_better(name, candidate_version):\n        mlflow.MlflowClient().set_registered_model_alias(name, \"champion\", candidate_version)",
        "check": "stronger = register_candidate(\"demo-model\", 0.85)\npromote_if_better(\"demo-model\", stronger.version)\ntest(\"Move the alias when better\", lambda: mlflow.MlflowClient().get_model_version_by_alias(\"demo-model\", \"champion\").version == stronger.version, \"The champion alias moved to the 0.85 candidate.\")",
        "expected": "The champion alias moved to the 0.85 candidate.",
        "reassurance": "The alias moves only on a strict win. Callers still cannot tell what happened."
      },
      {
        "title": "Apply a strict promotion rule",
        "instruction": "Update `promote_if_better` so it returns `True` after moving the alias and `False` when the candidate does not win. Let invalid model or version errors propagate.",
        "code": "def promote_if_better(name, candidate_version):\n    if is_better(name, candidate_version):\n        mlflow.MlflowClient().set_registered_model_alias(name, \"champion\", candidate_version)\n        return True\n    return False",
        "check": "test(\"Apply a strict promotion rule\", lambda: promote_if_better(\"demo-model\", champion.version) is False, \"Comparing the champion with itself returns False.\")",
        "expected": "Comparing the champion with itself returns False.",
        "reassurance": "Ties correctly keep the alias. The complete check also tests wins, losses and invalid versions.",
        "startFrom": [
          3
        ]
      },
      {
        "title": "Try a stronger candidate",
        "instruction": "Register a `demo-model` candidate with quality `0.9`, storing its version object in `candidate`. Try your promotion function for that version and display whether it was promoted. The chapter checks also compare ties and weaker candidates.",
        "code": "candidate = register_candidate(\"demo-model\", 0.9)\nprint(promote_if_better(\"demo-model\", candidate.version))",
        "check": "",
        "expected": "The sample promotion prints True.",
        "reassurance": "The final checks confirm score-based decisions and that other model aliases stay untouched."
      }
    ]
  },
  "ml-eval": {
    "setup": "import mlflow\n\nDATASET = [(\"2+2\", \"4\"), (\"capital of France\", \"Paris\"), (\"3*3\", \"9\"), (\"opposite of hot\", \"cold\")]\n\ndef v1(q): return {\"2+2\": \"4\", \"3*3\": \"9\"}.get(q, \"unknown\")\ndef v2(q): return {\"2+2\": \"4\", \"capital of France\": \"Paris\", \"3*3\": \"9\"}.get(q, \"unknown\")\ndef v3(q): return \"4\"",
    "steps": [
      {
        "title": "Validate evaluation data",
        "instruction": "Define `require_dataset(dataset)` to raise `ValueError` for an empty evaluation dataset and accept a nonempty one without a return value. This guard will be used before any evaluation runs are created.",
        "code": "def require_dataset(dataset):\n    if not dataset:\n        raise ValueError(\"evaluation needs a non-empty dataset\")",
        "check": "test(\"Validate evaluation data\", lambda: require_dataset(DATASET) is None, \"The four-example dataset is accepted.\")",
        "expected": "The four-example dataset is accepted.",
        "reassurance": "The sample data is usable. The final check will verify rejection happens before any run."
      },
      {
        "title": "Measure one candidate",
        "instruction": "Define `prompt_accuracy(fn, dataset)` for a nonempty sequence of question/expected-answer pairs. Measure the fraction where the candidate function's answer exactly matches the expected answer, using the data argument rather than the sample dataset.",
        "code": "def prompt_accuracy(fn, dataset):\n    return sum(fn(question) == expected for question, expected in dataset) / len(dataset)",
        "check": "test(\"Measure one candidate\", lambda: prompt_accuracy(v2, DATASET) == 0.75, \"v2 answers three of four examples correctly: 0.75.\")",
        "expected": "v2 answers three of four examples correctly: 0.75.",
        "reassurance": "The measurement is right. Now make that measurement reproducible with a run."
      },
      {
        "title": "Open a run per prompt",
        "instruction": "Define `record_prompt(name, fn, dataset)`. For now it opens one run named `name`, logs `name` as parameter `prompt_version`, and closes the run.",
        "code": "def record_prompt(name, fn, dataset):\n    with mlflow.start_run(run_name=name):\n        mlflow.log_param(\"prompt_version\", name)",
        "check": "record_prompt(\"practice\", v1, DATASET)\nruns = mlflow.search_runs()\ntest(\"Open a run per prompt\", lambda: len(runs) == 1 and runs.iloc[0][\"tags.mlflow.runName\"] == \"practice\" and runs.iloc[0][\"params.prompt_version\"] == \"practice\" and mlflow.active_run() is None, \"One closed run named practice with prompt_version practice.\")",
        "expected": "One closed run named practice with prompt_version practice.",
        "reassurance": "Each candidate gets its own labelled run. Next add the score."
      },
      {
        "title": "Record one prompt version",
        "instruction": "Update `record_prompt` so it measures the candidate with `prompt_accuracy` into `accuracy` before opening the run, logs it as metric `accuracy` inside the run, and returns it after the run closes.",
        "code": "def record_prompt(name, fn, dataset):\n    accuracy = prompt_accuracy(fn, dataset)\n    with mlflow.start_run(run_name=name):\n        mlflow.log_param(\"prompt_version\", name)\n        mlflow.log_metric(\"accuracy\", accuracy)\n    return accuracy",
        "check": "test(\"Record one prompt version\", lambda: record_prompt(\"practice\", v1, DATASET) == 0.5 and mlflow.active_run() is None, \"v1 scores 0.5 and its run is closed.\")",
        "expected": "v1 scores 0.5 and its run is closed.",
        "reassurance": "One candidate records correctly. Next compare all candidates while keeping the first winner when scores tie.",
        "startFrom": [
          2
        ]
      },
      {
        "title": "Pick the best candidate",
        "instruction": "Define `evaluate_prompts(candidates, dataset)` for a mapping of candidate names to functions. Record each candidate exactly once with `record_prompt` and return the name with the highest score, keeping the first one on ties and returning `None` when there are no candidates.",
        "code": "def evaluate_prompts(candidates, dataset):\n    return max(candidates, key=lambda name: record_prompt(name, candidates[name], dataset), default=None)",
        "check": "test(\"Pick the best candidate\", lambda: evaluate_prompts({\"v1\": v1, \"v2\": v2, \"v3\": v3}, DATASET) == \"v2\" and len(mlflow.search_runs()) == 3 and evaluate_prompts({}, DATASET) is None, \"v2 wins with one run per candidate; no candidates gives None.\")",
        "expected": "v2 wins with one run per candidate; no candidates gives None.",
        "reassurance": "The winner is picked from measured scores. Last, guard the dataset and group the runs."
      },
      {
        "title": "Choose the measured winner",
        "instruction": "Update `evaluate_prompts` so it validates the dataset with `require_dataset` first and then selects experiment `prompt-eval` before recording. Empty datasets must create no runs.",
        "code": "def evaluate_prompts(candidates, dataset):\n    require_dataset(dataset)\n    mlflow.set_experiment(\"prompt-eval\")\n    return max(candidates, key=lambda name: record_prompt(name, candidates[name], dataset), default=None)",
        "check": "",
        "expected": "v2 wins the sample; no candidates returns None.",
        "reassurance": "The full check changes names and data, checks first-wins ties, and counts the recorded metrics.",
        "startFrom": [
          4
        ]
      }
    ]
  }
}
