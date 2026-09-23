/**
 * Justin's time reconstruction, 2026-09-01 -> 2026-09-18. Built by ACcal. 36 events.
 * GENERATED from events.json - do not hand-edit, regenerate instead.
 *
 * SAFE TO RUN TWICE. It only creates - never modifies, never deletes - and it skips
 * any event it has already made (matched on title + start time).
 *
 * HOW TO RUN
 *   1. script.google.com -> New project
 *   2. Paste this whole file over the empty Code.gs
 *   3. Run. Approve the permission prompt once.
 *   4. Open the Execution log: one line per event, CREATED / SKIPPED / FAILED.
 *
 * TO UNDO EVERYTHING: set RUN_MODE to 'undo' and Run. It deletes only events carrying
 * the ACcal marker, so it cannot touch anything you wrote yourself.
 *
 * ONE KNOWN GAP: the 09-09 Sick Day is created as an ordinary event. CalendarApp cannot
 * set the Out-of-Office type. Flip it in the UI if you want it to match your other Sick Days.
 */

var CAL_ID   = 'justin@evryn.ai';
var RUN_MODE = 'create';              // 'create' | 'undo' | 'dryrun'
var MARKER   = '[ACcal-2026-09-23]';

// Every date below is built with an EXPLICIT UTC offset, so the times land correctly
// no matter what timezone this Apps Script project happens to be set to. A bare
// 'YYYY-MM-DDTHH:MM:SS' string is parsed in the SCRIPT's timezone, and if that is not
// Pacific every event silently shifts by hours - which looks completely normal on the
// calendar. All 36 events fall between 2026-09-01 and 2026-09-18, which is inside
// US Pacific Daylight Time (PDT, UTC-7); DST does not end until 2026-11-01.
var UTC_OFFSET = '-07:00';

var EVENTS = [
  ['2026-09-01','11:45','12:00','8','Orienting',
   'Opener 12:01 was short (224ch); prior AI turn 18h earlier, so no overnight report to work through.'],
  ['2026-09-01','12:00','13:00','8','ACP lane: retiring 37h3, sequencing successors',
   '12:56 - "AC0-37h3 hit compaction and I had to retire him." Sorting which downstream instance carries the lane.'],
  ['2026-09-01','15:00','19:30','8','ACP: #lock protocol, writing protocol, re-spin prep',
   'Session-doc currency rules, ballot-lettering conventions, gearing an instance down for re-spin at 78k tokens. The 135-min gap 12:56-15:11 lines up with the Cascade families meet-up already on the Personal calendar - deliberately not duplicated here.'],
  ['2026-09-01','22:00','22:15','8','Overnight batten-down: commit and push all repos',
   'Returned at 22:01 after a 163-min break - "I need to close up for the night, so I need you to commit and push everything so it is safe overnight."'],
  ['2026-09-02','11:30','11:45','8','Orienting',
   'Opener 11:46 began "Good morning!" - a clean start-of-day marker.'],
  ['2026-09-02','11:45','19:15','8','ACP: #lock, packout prep, protocol edits',
   'Full #lock protocol, handoff brief for the next instance, mailbox- and writing-protocol tweaks, LEARNINGS routing. Final commit 18:59; last typed message 19:08. One 71-min midday gap 13:30-14:41, unexplained by either calendar - most likely lunch.'],
  ['2026-09-03','12:40','12:55','8','Orienting',
   'Opener 12:56 was a 2,467ch spin brief for ACP-38; prior AI turn 17.8h earlier.'],
  ['2026-09-03','12:55','17:30','8','ACP-38: EliJ, protocol work, deploy prep',
   'Spun ACP-38 then ACP-39. THIS IS THE DAY EliJ WAS CREATED - 14:51: "I want to create something called EliJ." Also Railway variable checks ahead of the staging deploy. Gave notice at 17:04 ("in about 20 minutes, I need to step away") and left at 17:29.'],
  ['2026-09-03','18:15','21:30','9','Staging deploy + ACP-40 handoff',
   'Back at 18:18. 19:04 - "Deploy is building - I can see it on evryn-staging." Then the ACP-39 to ACP-40 handoff and a final commit-and-push across all repos; last commit 21:21. Coloured Product Design/Build rather than Ops because this is a deploy of the product itself.'],
  ['2026-09-04','09:30','09:45','8','Orienting',
   'First typed message 09:48 was short (404ch, "git pull all repos"), so little compose time ahead of it.'],
  ['2026-09-04','09:45','11:00','4','Prep for Megan - pulling team input',
   '09:56 - "I am meeting with Megan in a few minutes, what are my most important topics." Loaded Lucas and Marlowe for a 30-60 second scan each. Dark from 09:59.'],
  ['2026-09-04','11:00','12:00','11','Megan & Justin - REPLACEMENT',
   'Justin recalls the meeting was pushed. 11:52 - "I pulled you guys up before my NEXT meeting with Megan." 12:02 - "I had to go into the meeting... this is mostly what we talked about: NWFF education director quit suddenly." The original 10:00-11:00 block is left untouched; this is the parallel reading.'],
  ['2026-09-04','12:00','12:30','4','Post-Megan - NWFF fallout',
   'At 12:02 he relayed what the meeting covered: "this is mostly what we talked about: NWFF education director quit suddenly." Then dark until 14:35.'],
  ['2026-09-04','12:30','14:30','3','Break - thrashed after Megan',
   'Justin\'s own recall, 2026-09-23: "I think I remember being fairly thrashed after the megan thing. It is possible that I just took a break." The 153-min hole 12:02-14:35 is real - the laptop shows ZERO Claude activity on 9/4, so he was not working on the other machine. Category is his call, not inferred from evidence.'],
  ['2026-09-04','14:30','16:45','6','Mark and Lacey with Marlowe',
   '14:35 - Lacey ticket, Mark email notes, "I think I am going to offer to take Mark to lunch." 15:19 - Marlowe on the corpus as a cold-start asset for v0.3.'],
  ['2026-09-04','16:45','18:45','8','ACP-40 handoff + team consolidation',
   '17:14 spun ACP-40 against the 09-03 handoff. 18:25 Marlowe pronouns, EVR-97, standup protocol. Last typed 18:34; final commit 18:37.'],
  ['2026-09-08','13:20','18:45','10','Lucas: #standup + team current-state',
   'SECOND LANE, missing from your log. While the laptop ran ACT team-runtime work, the desktop was simultaneously running Lucas on the #standup, team current-state and hub pronouns, 13:20-18:46. This also explains the 106-min hole in the laptop lane at 14:15-16:01: you returned saying "I just came back from being in a BUNCH of other meetings" - those were sessions, not people. You were on this machine, in this lane.'],
  ['2026-09-09','07:00','19:00',null,'Sick Day',
   'Per Justin\'s instruction ("if it doesn\'t show up on the laptop, make it that"). Zero Claude Code activity on BOTH machines and zero git commits in any repo. The laptop scan was control-verified in the same pass (5,803 entries found on 9/8 and 2,334 on 9/10), so this zero is a real absence rather than a failed query. Caveat: this proves no computer work. It cannot distinguish illness from any other reason for a day away.'],
  ['2026-09-10','12:15','12:30','8','Orienting',
   'Opener 12:27 was ten characters ("Load Lucas"); prior AI turn 41.6h earlier, so nothing to read back.'],
  ['2026-09-10','12:30','19:15','10','Team consolidation round - Lucas & Nathan captains',
   'Consolidation briefs for Captain Lucas and Captain Nathan; discovery of the agent-to-agent comms channel ("this comms channel is new - that simplifies things SO much"). Signed off 18:58. Final commit 19:55.'],
  ['2026-09-10','14:00','18:45','8','ACT-18: agent-manual rubric pass',
   'SECOND LANE. Laptop active 14:01-18:41 on the ACT-17 to ACT-18 handoff and the writing-rubric pass across all four agent manuals. This is what accounts for the desktop-side quiet at 14:41-15:40 and 15:43-17:38 - not absences.'],
  ['2026-09-11','08:45','09:00','8','Orienting',
   'Laptop first typed message 09:03, which is also what accounts for commits starting 09:06.'],
  ['2026-09-11','09:00','17:30','8','ACT-19/20: agent manuals, contradictions pass, packout',
   'Laptop lane. Read and tweaked the dc, oc and qc manuals; spun ACT-20; ran the packout. 16:34 - "I have to close down for the weekend, but I want to make sure we can hit the ground running on Monday."'],
  ['2026-09-11','10:50','17:00','10','Team consolidation - all six agents',
   'Desktop lane, and the second-heaviest day in the window at 933 commits. Sessions across Marlowe, Mira, Emma, Soren, Dominic and Thea. 11:25 - "Lucas is up now, so I am stepping away." 15:51 - "I am nearly at my Anthropic limit, so I need to pause everyone."'],
  ['2026-09-14','08:45','09:00','8','Orienting',
   'Opener 09:04 was a 1,641ch spin brief for ACT-A; prior AI turn 64h earlier, so compose time only.'],
  ['2026-09-14','09:00','14:00','8','ACT-A: team agent autonomy + runtime scout',
   'Spun ACT-A as an alt branch off the main ACT line, plus a runtime scout and three parallel subagents. Two logged absences: 11:25 "I am stepping away now, I will be gone for about 20 minutes" (back 12:04) and 12:17 "They are launched. Stepping away" (back 13:05). Final commit 13:54.'],
  ['2026-09-15','08:00','08:15','8','Orienting',
   'Opener 08:17; prior AI turn 86.8h earlier (the previous Friday), so a genuine cold start.'],
  ['2026-09-15','08:15','09:45','10','Marlowe: memory consolidation across machines',
   'Loaded Marlowe with her previous memory snapshot while the rest of the team sat mid-consolidation on the desktop. 09:14 - "I am here for a second and then have to step away again."'],
  ['2026-09-15','12:15','14:15','10','Marlowe: growth strategy - volume, introductions, capital',
   'After a 163-min gap. 12:27 - "Where are we getting the VOLUME of people necessary to make these matches?" Plus hand-built introductions and capital-strategy ownership. Closed 14:06. Colour set to Protect the Helm at Justin\'s direction, 2026-09-23.'],
  ['2026-09-16','09:30','09:45','8','Orienting',
   'Opener 10:03 - "it has been several days since we were working on this, so I need you to read me into the room cold."'],
  ['2026-09-16','09:45','18:00','8','Team runtime consolidation + agent memory',
   'The heaviest day in the window: 1,014 commits and 53 typed messages. Resumed Marlowe in place, ran parallel subagents across all six agent workspaces, worked LEARNINGS.md and the compaction rules. One sustained 220-min stretch 12:06-15:45. Closed 17:45 - "I need to go to dinner now."'],
  ['2026-09-17','11:00','11:15','8','Orienting',
   'Standing 15-min startup block, placed ahead of the read-and-compose runway that follows it. Derived, not observed - see the 11:15-12:15 block for the reasoning behind this start time.'],
  ['2026-09-17','11:15','12:15','8','Reading overnight reports + composing ballot answers',
   'DERIVED, NOT OBSERVED. First typed message 12:12 ran 7,580ch and answered roughly fifteen ballot items against reports left at 18:02 the previous evening - estimated 60 min of reading and composing before he typed. First commit 12:16 fits.'],
  ['2026-09-17','12:15','19:30','8','AC manual + ACT-21 lane: protocols, Atlas, packout',
   'Both machines on the same kind of work. Desktop: ac.md edits, the legend/abbreviation rule, provenance-tag feedback, a full packout pass. Laptop: ACT-21, the 300-line index, lock-protocol, spinning ACT-R and QCs. Attended the virtual therapy appointment 14:00-15:00 - a 62-min desktop gap sits exactly there. Final commit 19:32.'],
  ['2026-09-18','10:15','19:15','8','ACT-22/23: session-doc cleanup, compaction-bug hunt, re-spins',
   'Laptop lane, and the bulk of the day. Your own words at 15:18: "I have been over on the laptop all day, working with ACT on getting the tracker solid - there are a BUNCH of old session docs, and so he is clearing them." Two deliberate in-place re-spins (ACT-22 at 09:04, ACT-23 at 15:41) and the Claude Code context-loss bug investigation at 17:22.'],
  ['2026-09-18','15:18','18:30','8','ACP: handoff review + shutdown',
   'Desktop lane, evening. Handoff state, fragment sweep, and a final git pull before shutting down.'],
];

function run() {
  var cal = CalendarApp.getCalendarById(CAL_ID);
  if (!cal) { Logger.log('ERROR: cannot open calendar ' + CAL_ID); return; }
  if (RUN_MODE === 'undo') { return undo(cal); }

  // Diagnostics. If these two disagree the events are still correct (see UTC_OFFSET),
  // but you want to know, because the calendar will RENDER them in its own timezone.
  Logger.log('script timezone:   ' + Session.getScriptTimeZone());
  Logger.log('calendar timezone: ' + cal.getTimeZone());
  Logger.log('writing with explicit offset ' + UTC_OFFSET + ' (US Pacific Daylight Time)');
  Logger.log('');

  var created = 0, skipped = 0, failed = 0;
  EVENTS.forEach(function (e) {
    var date = e[0], startS = e[1], endS = e[2], color = e[3], title = e[4], why = e[5];
    var start = new Date(date + 'T' + startS + ':00' + UTC_OFFSET);
    var end   = new Date(date + 'T' + endS   + ':00' + UTC_OFFSET);
    try {
      var sameDay = cal.getEvents(new Date(date + 'T00:00:00' + UTC_OFFSET),
                                  new Date(date + 'T23:59:59' + UTC_OFFSET));
      var dupe = sameDay.some(function (ev) {
        return ev.getTitle() === title && ev.getStartTime().getTime() === start.getTime();
      });
      if (dupe) { Logger.log('SKIPPED (already there)  ' + date + ' ' + startS + '  ' + title); skipped++; return; }
      if (RUN_MODE === 'dryrun') { Logger.log('WOULD CREATE  ' + date + ' ' + startS + '-' + endS + '  ' + title); return; }

      var ev = cal.createEvent(title, start, end, { description: why + '\n\n' + MARKER });
      if (color) ev.setColor(color);
      Logger.log('CREATED  ' + date + ' ' + startS + '-' + endS + '  c' + (color || 'default') + '  ' + title);
      created++;
    } catch (err) {
      Logger.log('FAILED   ' + date + ' ' + startS + '  ' + title + '  -> ' + err.message);
      failed++;
    }
  });
  Logger.log('\nDone. created=' + created + '  skipped=' + skipped + '  failed=' + failed + '  mode=' + RUN_MODE);
}

function undo(cal) {
  var n = 0;
  cal.getEvents(new Date('2026-08-30T00:00:00' + UTC_OFFSET),
                new Date('2026-09-24T00:00:00' + UTC_OFFSET)).forEach(function (ev) {
    if ((ev.getDescription() || '').indexOf(MARKER) !== -1) {
      Logger.log('DELETING  ' + ev.getTitle());
      ev.deleteEvent(); n++;
    }
  });
  Logger.log('\nUndo complete. Deleted ' + n + ' ACcal event(s). Nothing of yours was touched.');
}
