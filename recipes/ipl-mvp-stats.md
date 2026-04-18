# Recipe: Scrape IPL MVP Stats to CSV

Extract player-level MVP (Total Impact) data from every IPL 2025 match on ESPNcricinfo and export it as a CSV file.

## What you'll get

A CSV with one row per player per match, containing columns like Player Name, Team, Total Impact, Runs, Batting Impact, Wickets, Bowling Impact, etc.

## Prerequisites

- DataHarvest fully installed and running (see the [Setup Guide](../README.md#setup-guide-from-scratch) in the README)
- An OpenAI API key configured in Settings (GPT-4o-mini works well and is cheap)

## The challenge

The data lives across many pages:

1. The **schedule page** lists all IPL 2025 matches
2. Each match has its own **scorecard page**
3. Within each scorecard there is an **MVP / Total Impact** sub-page with the stats table

DataHarvest needs to reach that final MVP page for every match and pull out the table data.

## Approach: Two-step job

The most reliable way to do this is a **two-step approach** using two DataHarvest jobs. Here's why: the "Webpage with Links" source type is great at discovering all match links from the schedule page, and it then fetches each one individually -- but it fetches the match page itself, not a sub-link within it (like the MVP tab). So we use the first job to collect the MVP URLs, then feed those URLs into the second job for extraction.

> **Alternative (single job):** If the MVP page URLs follow a predictable pattern (e.g., every match scorecard URL has a `/total-impact` variant), you can skip straight to Step 2 using a link pattern regex that matches those URLs directly from the schedule page. Check a few match pages to see if this is the case -- it would save you a step.

---

## Step 1: Collect all MVP page URLs

### 1.1 Create a new job

- Open **http://localhost:3000**
- Click **New Job**

### 1.2 Configure the source

- **Source type:** Webpage with Links
- **Hub URL:** `https://www.espncricinfo.com/series/ipl-2025-1449924/match-schedule-fixtures-and-results`
- **Link pattern (regex):** `full-scorecard`

  This filters the hundreds of links on the schedule page down to just the match scorecard links. Adjust the pattern if the URL structure is different -- open the schedule page in your browser, right-click a match link, and copy the URL to see what it looks like.

### 1.3 Define columns

We only need one column for this step:

| Column Name | Description | Type | Required |
|---|---|---|---|
| mvp_link | The URL or href of the link labeled MVP or Total Impact on this page | text | Yes |

### 1.4 Run the job

- Choose **gpt-4o-mini** as the model (cost-effective for link extraction)
- Click **Run**
- Wait for it to process all matches

### 1.5 Export the results

- Click **CSV** to export
- Open the CSV -- you should have a list of MVP page URLs, one per match
- Clean up any bad rows (empty or duplicate URLs)

---

## Step 2: Extract MVP data from every match

### 2.1 Create a second job

- Click **New Job** again

### 2.2 Configure the source

- **Source type:** URL List
- Paste all the MVP page URLs from the CSV you exported in Step 1 (one URL per line)

### 2.3 Define columns

These are the actual data columns you want from each MVP page:

| Column Name | Description | Type | Required |
|---|---|---|---|
| player name | Full name of the player | text | Yes |
| team | Player's team name | text | Yes |
| TI | Total Impact score | text | Yes |
| Runs | Runs scored | text | No |
| I. Runs | Impact Runs | text | No |
| B. Impact | Batting Impact score | text | No |
| Bowl | Bowling figures or overs bowled | text | No |
| I. Wkts | Impact Wickets | text | No |
| Bo. Impact | Bowling Impact score | text | No |

> **Tip:** You can use the **Auto-suggest** feature -- paste one MVP page URL, let the AI analyze it, and it will propose columns based on what it sees on the page. Then adjust as needed.

### 2.4 Run the job

- Choose **gpt-4o-mini** as the model
- Click **Run**
- This will take longer since it needs to fetch and extract from every match page

### 2.5 Export to CSV

- Once complete, review the data in the **Preview** tab (you can search and sort)
- Click **CSV** to download your final dataset

---

## Alternative: Single-step with Prompt-Guided navigation

If you only need data from a **few specific matches** (not all of them), you can use the **Prompt-Guided** source type:

- **Source type:** Prompt-Guided
- **Start URL:** The URL of a specific match scorecard
- **Navigation prompt:** `Navigate to the MVP or Total Impact link and collect the data from the stats table`

This works well for one match at a time. The navigator will click through to the MVP page and extract from there. However, it processes only **one starting URL per job**, so it is not practical for scraping the entire season.

---

## Tips

- **Rate limits:** ESPNcricinfo may throttle or block rapid requests. If you see failures, lower the rate limit in Settings (e.g., 10 requests per minute) and retry failed sources.
- **Retries:** DataHarvest automatically retries failed sources up to 3 times. You can also resume a paused/failed job to retry only the remaining sources.
- **Cost estimate:** With ~70 matches and GPT-4o-mini, expect to spend roughly $0.10--$0.50 across both jobs.
- **Save your column schema:** After defining columns in Step 2, save them as a **template** (e.g., "IPL MVP Stats") so you can reuse the same schema next season.
