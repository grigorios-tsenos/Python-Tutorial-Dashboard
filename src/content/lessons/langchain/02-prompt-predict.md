---
id: lc-prompts
track: langchain
order: 2
title: What Does the Prompt Become?
tagline: Templates are tiny compilers for chat messages.
kind: predict
xp: 25
minutes: 3
answer: 0
---
@@body
# Predict the output

`ChatPromptTemplate.from_messages` takes a list of `(role, template)` pairs. Calling `.invoke()` fills in the variables and returns a **prompt value** holding real message objects.

How many messages come out, and what does the second one say?
@@starter
from langchain_core.prompts import ChatPromptTemplate

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are terse."),
    ("human", "Define {term}."),
])
messages = prompt.invoke({"term": "RAG"}).to_messages()
print(len(messages), messages[1].content)
@@choice
2 Define RAG.
@@choice
1 Define RAG.
@@choice
2 Define {term}.
@@choice
3 Define RAG.
@@explain
Two `(role, template)` pairs produce **two messages**, a `SystemMessage` and a `HumanMessage`. `{term}` is filled with `"RAG"`, so the second message's content is `"Define RAG."`.
@@hint
Count the tuples in the list. Each one becomes one message.
@@hint
`invoke` substitutes the variable: nothing is left in curly braces.
@@q
What does `prompt.invoke({...})` return?
@@a
A prompt value; call `.to_messages()` to get the message objects.
@@q
What error do you get if you forget a template variable?
@@a
A KeyError saying the input is missing variables.
