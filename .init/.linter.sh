#!/bin/bash
cd /home/kavia/workspace/code-generation/modern-notes-hub-39292-39301/notes_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

