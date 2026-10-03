---
id: py-prompt-strings
track: python
order: 1
title: Prompts Are Assembled Strings
tagline: Under every chatbot there's a function gluing text together. Write a good one.
kind: run
xp: 25
minutes: 4
---
@@body
# AI apps are mostly string assembly

An AI application **builds a string** (the prompt) and **sends it to a model**. This chapter covers the building; LangChain automates it later.

The workhorse is the **f-string**: with `f` before the quotes, anything inside `{curly braces}` is filled in from your variables.

```python
name = "Ada"
f"Hello {name}!"               # 'Hello Ada!'
f"2 + 2 = {2 + 2}"             # even expressions work: '2 + 2 = 4'

prompt = f"""You are a {role}.
Question: {question}"""         # triple quotes keep the line breaks
```

Use a function, not copy-pasted strings: one template, many fillings, one place to change the wording.

> **Mission:** finish `build_prompt(role, question)`. It returns exactly two lines:
>
> ```
> You are a helpful <role>.
> Question: <question>
> ```
>
> Strip surrounding whitespace from both inputs first, so `"  SQL tutor "` still produces a clean prompt.
@@starter
def build_prompt(role, question):
    """Two lines: who the model should be, then the user's question."""
    # TODO: fill the template with the two (stripped) values
    return "You are a helpful {role}.\nQuestion: {question}"

print(build_prompt("data engineer", "What is a partition?"))
@@solution
def build_prompt(role, question):
    """Two lines: who the model should be, then the user's question."""
    return f"You are a helpful {role.strip()}.\nQuestion: {question.strip()}"

print(build_prompt("data engineer", "What is a partition?"))
@@check
out = build_prompt("data engineer", "What is a partition?")
test("the template is filled, not returned literally", lambda: out == "You are a helpful data engineer.\nQuestion: What is a partition?", "with an f-string, {role} becomes the variable's value")
test("it is exactly two lines", lambda: len(out.split("\n")) == 2)
test("different inputs fill the same template", lambda: build_prompt("poet", "Why is the sky blue?") == "You are a helpful poet.\nQuestion: Why is the sky blue?")
test("stray spaces around the inputs are cleaned", lambda: build_prompt("  SQL tutor ", " Explain JOINs.  ") == "You are a helpful SQL tutor.\nQuestion: Explain JOINs.")
test("the demo prompt is printed", lambda: "You are a helpful data engineer." in __stdout__)
@@hint
Add `f` before the opening quote; then `{role}` inside the string means "insert the variable `role` here". Without the `f`, the braces are just text.
@@hint
`return f"You are a helpful {role.strip()}.\nQuestion: {question.strip()}"` — `.strip()` removes spaces and newlines from both ends of a string.
@@q
What does the f in f"Hello {name}" change?
@@a
The braces become live: {name} is replaced by the variable's value instead of staying literal text.
@@q
Why build prompts in one function instead of writing the string wherever it's needed?
@@a
One template, many fillings: every call stays consistent, and a wording change happens in one place.
@@real
LangChain's `ChatPromptTemplate` is this function with placeholders checked and messages attached. Production code also strips and length-limits user input before it goes into a prompt.
