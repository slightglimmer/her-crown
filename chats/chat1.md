# Black women hairstylist platform

_Started 2026-09-05 13:34 UTC_

---

## User

Hey I would like to make a website for people to find and rate hairstylist specifically for black women, the goal is to be able to rate these stylist and reccommend stuff for them.

## Assistant



## Assistant

_[tool: ask_user]_

Waiting on your answers to the form — mainly which screen to start with, how ratings should work, and what "recommend stuff" should mean.

## User

Answered — Asked for follow-up questions; scope: Write-a-review flow; who: Client finding a stylist; filters: Service (locs, braids, silk press, natural cuts, color), Location / travels to you; rating: Single 5-star score, Written reviews with photos, Verified-visit badge; recommend: I meant reccommending them stylist based on their area and what they filter the search for; platform: Both; tone: Playful; trust: We need the platform to have real reviews with real peoplewho have been to the stylist and focus on constructive critisism

## Assistant



## Assistant

_[tool: ask_user]_

Round two is up — verification method, flow steps, and how to keep reviews constructive.

## User

Answered — verify_how: Upload a receipt or payment screenshot; steps: Pick the stylist, Verify the visit, Star rating, What service you got, Photos of the result, Written review; constructive: Guided prompts that ask for specifics instead of a rant; recs_placement: Only on the search page; brand: Her Crown?

## Assistant

_[tool: list_files]_

_[tool: read_file]_

_[tool: grep]_

_[tool: dc_write]_

_[tool: ready_for_verification]_

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: dc_write]_

_[tool: ready_for_verification]_

## User

okay how do I export this to claude code?

## Assistant

_[tool: read_skill_prompt]_

_[tool: write_file]_

_[tool: copy_files]_

_[tool: str_replace_edit]_

_[tool: present_fs_item_for_download]_

Download the zip, unpack it into your repo, and point Claude Code at `README.md` — it specs both screens (layout, exact type/color values, filter and gate logic, state) plus the design system's stylesheet and guide.

Want screenshots of the two screens added to the bundle?

## User

Okay so can you create a prompt for me to send this to claude code

## Assistant

_[tool: write_file]_

_[tool: show_to_user]_

Prompt is in `design_handoff_her_crown/CLAUDE_CODE_PROMPT.md` — copy it into Claude Code after unzipping the package at your repo root. It points Claude Code at the spec, sets the binding rules (verbatim copy, design tokens as source of truth, real buttons), and flags the three fake bits that need a backend.

Re-download the folder if you want the prompt included in the zip.

