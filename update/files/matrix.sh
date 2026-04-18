#!/bin/sh

# Get terminal width (fallback to 80)
cols=$(stty size 2>/dev/null | awk '{print $2}')
[ -z "$cols" ] && cols=48

# Hide cursor
printf "\033[?25l"

# Clear screen
clear

while true; do
    line=""
    i=0
    while [ $i -lt "$cols" ]; do
        # Random 0 or 1
        if [ $((RANDOM % 2)) -eq 0 ]; then
            line="$line 0"
        else
            line="$line 1"
        fi
        i=$((i + 1))
    done

    # Green text
    printf "\033[32m%s\033[0m\n" "$line"

    # Small delay
    sleep 0
done