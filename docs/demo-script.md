# Demo script: Benefits Navigator

**Length:** about 20 minutes of demo, then discussion.
**Audience:** Edwin and potential partners.
**Goal:** show that one tool gets a veteran from "where do I start?" to a prepared meeting with a free accredited representative, and agree on next steps for a pilot.

---

## The night before

- [ ] Pull the latest `main` and run `make setup`.
- [ ] Put the Anthropic API key in `services/chat/.env`, then run `make check-key`.
- [ ] Check the VA sandbox keys in `services/va-mcp/.env` with `make test-va-live`. Two read-only tests should pass; the upload test is skipped.
- [ ] Run `make dev`, open http://localhost:5173 in **Chrome**, and do one full run-through of this script.
- [ ] Ask the Navigator one question so you know the key works and roughly how fast replies come back. Then ask "Where's the nearest VA benefits office to Annapolis?" and check it shows "Looking up VA locations" and lists offices.
- [ ] Run the live session once with your real camera, and allow camera access for `localhost` permanently so the prompt doesn't appear mid-demo.

## 15 minutes before

- [ ] Run `make dev` (or `make stop` first if a port is busy), then `make health`. It should report `"configured":true`.
- [ ] In Chrome, open **one window with two tabs**:
  - Tab 1: http://localhost:5173 (the veteran)
  - Tab 2: http://localhost:5173/signin/officer (the service officer)
- [ ] In tab 1, if there's leftover data from a rehearsal, go to My timeline and click **Clear my data**, then return to the landing page.
- [ ] Zoom Chrome to about 110% so the room can read it. The chat panel sits beside the timeline only when the window is at least 1280px wide after zoom; above roughly 110% on a typical laptop it moves behind an **Ask the Navigator** button at the bottom right, which also works. Turn on Do Not Disturb. Close other tabs, email and anything personal.
- [ ] Have this script on a second screen or printed.

---

## Run of show

| # | Section | Time | Screen |
|---|---------|------|--------|
| 1 | The problem | 1 min | Landing page |
| 2 | Landing page tour | 2 min | Landing page |
| 3 | Intake | 1 min | `/start` |
| 4 | Personal timeline | 3 min | My timeline |
| 5 | Documents | 2 min | My documents |
| 6 | Preparing forms | 3 min | Forms |
| 7 | Ask the Navigator, including a live VA lookup | 4 min | Chat panel |
| 8 | Getting free, accredited help | 4 min | Get help + officer console |
| 9 | Privacy | 1 min | Clear my data |
| 10 | Path to production | 2 min | Talking points |
| 11 | The ask | open | Discussion |

---

## 1. The problem (1 min)

**Screen:** landing page, top of the hero.

> "More than 200,000 people leave the military every year. The benefits they've earned depend on doing things in the right order, often months before their last day. A disability claim has a window that closes 90 days before separation. Retirees make a survivor benefit decision that's hard to undo. Transition help is designed to start more than a year out, and most people start later than that, usually while still doing a full-time job. A clear plan makes that head start easier.
>
> We built Benefits Navigator to answer one question for each person: what do I need to do, by when, and with what paperwork?"

## 2. Landing page tour (2 min)

**Do:** scroll slowly from top to bottom.

Point out:
- **Hero:** "Your military transition, in the right order." The timeline card is a sample of what each person gets.
- **Why it matters, "A head start makes a big difference":** three cards, each linked to its source.
  - **200,000+** service members make the move to civilian life each year (DAV).
  - **1 year:** transition help is designed to start more than a year before leaving (GAO).
  - **~70%** started later than that (GAO).
  > "People are focused on their mission right up to the end. A clear plan makes that head start easier, and that's what we're adding alongside the transition programs already in place."
- **What's covered:** disability, health coverage, Survivor Benefit Plan, life insurance, GI Bill, DD-214, state benefits.
- **Free, accredited help:**
  > "This matters to us: filing a VA claim is free. We never charge, and we never file for anyone. We connect people to free accredited representatives, and we warn them about claim sharks."
- **Header:** **Build my timeline** is the main way in, with no account. **Sign in** is for people coming back, and **For service officers** is the separate door for advocates.
  > "No account is needed to get value. We offer one only after you've seen your timeline."
- **Privacy**, **For organizations** (it has a **Service officer sign in** button), the **FAQ** ("Is this the VA?" No, said plainly), and the **Veterans Crisis Line** in the footer.

> "No stock photos, no VA logos or military seals. We're not affiliated and we don't pretend to be."

## 3. Intake (1 min)

**Do:** click **Build my timeline**.

> "Seven questions, about a minute, no account. We never ask for a name, Social Security number or service records."

Enter the sample person, or click **Fill in the demo example**:
- Army
- Retirement, about 8 months from today
- Married
- Dependent children: Yes
- Service-connected condition: Not sure
- Maryland

Click **Build my timeline**.

## 4. Personal timeline (3 min)

**Screen:** My timeline.

> "This is built from those seven answers. Eight steps, in the order to start them. The ones that need attention now are open; the rest are folded to their title and dates, so it doesn't feel overwhelming."

Two cards start open: **Transition Assistance Program** (Overdue) and **GI Bill** (Due soon). The other six start closed.

Walk through:
- **Transition Assistance Program, open, Overdue.** "Retirees should start about 24 months out. This person is 8 months out. Seeing it now gives them time to catch up, with their transition office and a representative."
  - On this card, point out the plain-language explanation, **Documents for this step**, and **Learn more on VA.gov**.
  - The documents use short names, each with its status on the same line ("DD-214 · Not started"). Click one to jump to it on My documents.
    > "The timeline stays scannable. The full name, why you need it and where to get it are one click away."
- **GI Bill, open, Due soon.** "A transfer to family has to be approved while still serving."
- **VA disability claim (BDD), closed.** Click its title to open it. "They answered 'not sure' about a condition, so this appears. The window is 180 to 90 days before separation. Miss it and the decision comes later."
- **Survivor Benefit Plan, closed:** "This one only appears for retirees." No need to open it.
- Click **Expand all** to show everything, then **Collapse all**.
  > "Closed, the whole plan fits on one screen: what's next, and when."

Point out the line under the progress bar, **"Saved in this browser. Save to a free account to use it on any device."**
> "Now that they've seen something useful, we offer a free account, quietly: ID.me or an email link. These are demo screens; nothing is saved."

Optionally click **Save to a free account**. The sign-up page also mentions connecting a VA.gov account later for claim status. Click **Continue with ID.me**, then **Continue (demo)** to come back.

**Do:** open the **Transition Assistance Program** card again if you collapsed it, and tick **Mark as done**. The progress bar moves, the dot turns green and the chip changes to **Done**.

> "Progress is saved in this browser only."

## 5. Documents (2 min)

**Do:** click **My documents**.

> "Same answers, now a checklist of the documents this person needs, grouped by step, each with its full name, why it's needed and where to get the official copy."

- Point out the yellow warning: *"Demo only: use the sample documents."*
- Click **Load sample documents**. It goes to **4 of 7 ready**.
- On the **DD-214**, click **Preview**. "Clearly fake, stamped SAMPLE."
- Point out what's still missing: **service treatment records**.
- Point out the **Social Security numbers** and **direct deposit** (bank details) items:
  > "These are reminders only. They're never uploaded, typed or stored."

> "The Navigator organizes. It never submits anything. The veteran uploads to VA.gov or hands documents to their representative."

## 6. Preparing forms (3 min)

Best on a wide screen (1440px or more). If the chat crowds the page, click **Hide chat**: the chat folds into a narrow "Ask the Navigator" tab on the right edge.

**Do:** click **Forms**.

> "Veterans tell us the paperwork is the hard part. So for the forms people need most, we walk through each question in plain words. We start with the disability claim, VA Form 21-526EZ, and also have the Intent to File, the health care application and the mental health statement."

**Do:** click **Start** on **VA Form 21-526EZ**.
- Point out the top note: the Navigator never fills in or submits the form, the chat never sees the answers, and the SSN, date of birth and bank details are never typed here.
- Point out **Saved automatically in this browser**:
  > "Nothing's lost if you close the tab. You come back and pick up where you left off."

**Do:** in **Step 5 · Your conditions**, click into the first box. The official page on the right jumps to **page 11** and highlights **Item 16**.

> "This is the real VA form, January 2026 version. As you move through the questions, it shows exactly where each answer goes, so there are no surprises at the end. We never write on the official form."

**Do:** type `SAMPLE: Hearing loss · noise from heavy equipment · July 2019`. Then click **Ask the Navigator about this**.

> "The chat explains what the question is looking for. It gets the question, never your answer."

**Do:** click a dropdown in **Step 7 · Service pay**. The preview moves to **page 12**.

**Do:** scroll to **My prep sheet** and click **Print my prep sheet**. Cancel the print dialog.

> "The veteran prints this and copies it into VA.gov, or goes over it with a free accredited representative. That's the hand-off: the representative still owns the claim."

**Optional:** type `123-45-6789` into any box. It's removed with a warning.

## 7. Ask the Navigator (4 min)

**Do:** in the chat panel, click **"Which documents am I still missing?"**

> "The assistant already knows this person's answers, timeline and checklist, so the answer is about them, not generic."

Expect it to name the **service treatment records** and point to the official source. The exact wording changes each time.

**Do:** ask **"When should I file for disability?"** Point to the **Sources** list under the answer.

> "It doesn't answer from memory. Every answer comes from short notes we wrote from the official VA, TRICARE and Defense pages, and it links the pages it used. If those pages don't cover a question, it says it isn't sure and points you to the official source."

**Do:** click **"Where's the nearest VA benefits office?"** or type **"Where's the nearest VA benefits office to Annapolis?"** You'll see "Looking up VA locations" while it works.

> "This one isn't from our notes. The Navigator just asked the VA's own facilities system. It's the VA's test system for now, which is open to any developer."

Expect three offices with distance, address and phone: the pre-discharge sites at the Naval Academy and Fort Meade, and the Baltimore VA Regional Benefit Office. It reminds people to call ahead and links VA.gov.
- The test data lists the two pre-discharge sites as **closed**, and the answer says so. If anyone asks: "That's the VA's test data. Production uses the live system."
- It may also mention the Maryland Department of Veterans and Military Families in Annapolis. That comes from our official-source notes, not the VA lookup.

> "Production uses the same connection with the VA's approval. It only looks things up. The Navigator can't upload or file anything with the VA."

**Optional, pick one:**
- On the sample DD-214, click **Explain this document**. "In production this could check a real DD-214 against the person's answers. In the demo, only fake sample text is ever sent."
- Type `My SSN is 000-00-0000` and press Enter. The message is blocked before it's sent.
  > "It won't even send something that looks like a Social Security or account number."

## 8. Getting free, accredited help (4 min)

> "Here's what we think matters most for organizations like yours: getting someone to a free accredited representative, prepared."

Both tabs must be in the **same Chrome window** at `localhost:5173`. In this demo, shares live in that browser only.

**Veteran side (tab 1):**
1. Click **Get help**.
2. Choose **Sample County Veterans Service Office**. All three organizations are fictional for the demo.
3. Point out the two lists, **Shared (read-only)** and **Never shared**:
   > "Files, Social Security numbers and bank details are never shared. Access ends after 14 days, and they can stop sharing at any time. Sharing doesn't appoint anyone or file anything."
4. Tick the agreement box. Under **How would you like to meet?** pick **In person**, under **When?** pick **Now: I'm at the office**, and click **Share my plan**.
5. The page jumps to the new share with a large **code** (for example BN-M3HT):
   > "The veteran tells the officer this code. That's the whole handoff: no names, no email."

**Service officer side (tab 2, `/signin/officer`):**
1. Click **Fill in the demo officer**, then **Continue**. On the accreditation step:
   > "Only accredited officers get in. In production we check their accreditation number against the VA's list, and their organization approves them."

   Click **Verify and sign in**, then **Open the service officer console**. The header shows **Sample County Veterans Service Office (demo)**.
2. Type the veteran's code into **Open a case by code** and click **Open**. The case opens.
3. Show the **suggested first-meeting agenda**: the overdue step, the claim window, the missing documents, and appointing the organization on VA Form 21-22.
   > "Instead of spending the first half hour rebuilding someone's situation, the officer starts here."
4. The case says **Meeting in person: review this plan together. No video needed.**

**Back in tab 1:** click **Show my plan**. This is a large, read-only view for the veteran to turn toward the officer across the desk.
> "In the same room, nobody needs video. The veteran shows their plan, or the officer opens it with the code."

**Optional, the "only who they chose" moment:** in tab 2, switch the organization at the top to **Lakeside Veterans Help Center (demo)** and type the same code. It says the plan was shared with Sample County, not Lakeside.
> "The veteran decides which office sees their plan."

**Optional, phone for people who can't come in:** in tab 1, share again with Sample County, **Phone** and **Now**. Read out the new code. In tab 2, open it by code: the case says **Phone call: keep this plan open while you talk.** In tab 1, click **Show my plan**. The page reads "Phone call" and shows the same plan the officer sees.
> "Plenty of people will just call. They both look at the same plan while they talk, without a video app or a link to click."

**Optional, video for remote help:** share again with **Video** and **Now**. Click **Join video session** in both tabs. They connect with live video; both mics start muted to avoid echo. In tab 1, untick **Show my plan during this session** and tab 2 shows "Hidden by the veteran." Click **End session**.

If asked about HIPAA, see the questions section below.

## 9. Privacy (1 min)

**Do:** in tab 1, go to My timeline and click **Clear my data**, then confirm.

> "Everything is gone: answers, progress, form prep answers and documents. In this preview, nothing lives on our servers. No accounts, no tracking, no cookies."

## 10. Path to production (2 min)

Talking points (details in `docs/architecture.md`):
- Built to move to AWS without a rewrite: the website behind CloudFront and a web firewall, the chat on API Gateway and Lambda, and Claude through Amazon Bedrock so data stays in our AWS account.
- Answers grounded in official VA content that's re-checked on a schedule.
- Real accounts for veterans and for accredited staff, with access only while a share is active, and every view logged.
- Real document uploads go to encrypted storage and are scanned for malware before use. Real medical records require a HIPAA Business Associate Agreement and HIPAA-eligible services only.
- Video moves to Amazon Chime SDK, which is covered by the AWS BAA.
- VA lookups move from the VA's test system to production once the VA approves us. That takes a production access request and a demo to the VA, and the VA currently warns of long delays for benefits APIs, so we'd apply early. On AWS the same connection runs through Bedrock AgentCore, with the VA keys in Secrets Manager.
- Every deadline and document rule is marked for review against VA.gov before launch.

## 11. The ask (discussion)

Pick the questions that fit the room:
1. Would your service officers use a shared plan and agenda like this? What's missing for them?
2. Would you pilot it with a small group, say 10 to 20 transitioning service members and one or two officers?
3. Which organizations should we talk to next: county offices, VSOs, transition offices, churches, nonprofits?
4. Who can review our deadline and document rules for accuracy?
5. Do your officers prefer video in the Navigator, or their own tools (phone, Zoom, in person)?
7. Which forms should the form prep cover next, and would your representatives use a veteran's prep sheet? Should an attorney or a VSO partner review it before a pilot?
6. Do the short document names on the timeline make sense to you: "DD-214", "Service treatment records", "Birth or adoption certificates", "Social Security numbers", "Direct deposit details"? What would you call them? (Ask Edwin directly; the names live in `packages/shared/documents.ts` as `shortName`.)

---

## Likely questions

**"Is this the VA?"**
No. We're not affiliated with the VA or the Department of Defense. We point people to VA.gov and other official sources.

**"Does it file claims?"**
No, never. Accredited representatives file through the VA's own systems once the veteran appoints them. We get people to them prepared.

**"Doesn't it fill out forms?"**
No. It explains each question in plain words, shows where it is on the official form, and saves the veteran's own notes in their browser. The veteran copies them into VA.gov or goes over them with a free accredited representative. Federal law limits who may help prepare and present VA claims, so we keep the representative in charge and plan a legal review before any pilot.

**"Is it HIPAA compliant?"**
"There's no such thing as 'HIPAA approved'; the government doesn't certify products. HIPAA applies to health care providers, health plans, and the companies that handle health records for them under a Business Associate Agreement. Most service organizations aren't covered, but we're building to that standard anyway. In production, anything touching medical records runs on HIPAA-eligible AWS services under a BAA, and video uses Chime SDK under the same agreement."

**"Where does the data go?"**
In this preview it stays in the browser. The chat sends the question plus a summary of the answers and checklist to generate a reply. It never sends files, and the server doesn't log messages.

**"Is the VA location data real?"**
It comes from the VA's own facilities system, but the demo uses the VA's test version, which can be out of date. That's why it says to call ahead and links VA.gov. Production would use the live system after the VA approves our access.

**"Does it connect to the VA for claims?"**
No. It only looks up locations. We tested the VA's document upload system with fake sample files for developers, but the Navigator itself can't upload or file anything.

**"How accurate are the dates?"**
They come from general rules that we've marked for review against VA.gov before launch. Every step links to the official source, and the timeline tells people to confirm with their representative.

**"What does it cost?"**
Free for veterans, always. For organizations, we're here to learn what would help; there's no pricing yet.

**"Why AI?"**
People have questions at 10 p.m. that don't need a meeting. The assistant answers in plain language using their situation, says "I'm not sure" rather than guessing, and points to official sources and free representatives for anything that needs a person.

---

## If something goes wrong

| Problem | What to do |
|---|---|
| Chat says the API key is missing | Check `services/chat/.env`, restart `make dev`, and run `make health`. Meanwhile keep going; the rest of the app works without it. |
| VA lookup gives no offices, or just links VA.gov | The VA test system may be down or the key missing. The chat falls back to the VA.gov locator on its own, so keep going: "When the VA's system doesn't answer, it sends people to VA.gov instead of guessing." Afterwards, run `make test-va-live`. |
| A step's details or **Mark as done** aren't showing | The card is closed. Click its title, or **Expand all**. |
| Different cards are open than the script says | Cards open based on today's date and the answers. Click **Clear my data**, then **Fill in the demo example** again. |
| Chat is slow | Keep talking about the timeline. Replies stream in as they arrive. |
| No internet | Everything except the chat works offline. Skip section 6 and describe it. |
| Console says "No active shared plan has the code…" | The officer tab must be in the same Chrome window at `localhost:5173` (not `127.0.0.1`), and the data must not have been cleared since sharing. Share again and use the new code. |
| Console says the code "was shared with" another office | Switch the organization at the top of the console to that office, or share again with Sample County. |
| Live session stuck on "Waiting…" | Both tabs must be in the **same Chrome window**. Reload the officer tab, then click Join again in the veteran tab. |
| Camera prompt or no video | Click Allow. If the camera still fails, the session connects anyway and the plan still syncs, so show the plan panel and screen share. |
| Echo or feedback | Keep both mics muted. They start muted. |
| Port in use when starting | Run `make stop`, then `make dev`. |
| Timeline or shares from a rehearsal still showing | Click **Clear my data**. Shares are cleared too. |
