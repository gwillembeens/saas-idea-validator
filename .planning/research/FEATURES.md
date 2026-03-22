# Features Research: Social Layer

## Summary

Social layer features in SaaS tools typically center on visibility, reputation, and community engagement. Leaderboards are usually segmented by category/niche to improve discoverability and engagement (broad leaderboards overwhelm users). Idea versioning auto-detects similarity to encourage collaboration and reduce duplication. Public profiles serve as reputation anchors, displaying stats, badges, and contribution history. Challenge/comparison cards create low-friction CTAs to stimulate engagement without heavy gamification overhead.

---

## Leaderboard

### Table Stakes

- **Niche-based segmentation**: Global leaderboards are ineffective at scale. Best practice: create separate ranked lists per niche/category (e.g., Fintech, EdTech) rather than filtering a large leaderboard. This improves query performance (use bucketed Redis sorted sets, not WHERE clauses) and increases rank turnover, improving engagement for non-top performers.
- **Multiple sorting options**: Primary sort by weighted score (default). Secondary sorts: date (newest), trending (30-day improvement), creator rep (profile quality/history).
- **User context in rank**: Show absolute rank + percentile + points to next tier. Passive leaderboard viewing is low-engagement; context makes it actionable ("you're top 15%, need X more points to reach top 10%").
- **Real-time or near-real-time updates**: Users expect fresh rankings, but full real-time computation is expensive. Pattern: compute every 5–15 minutes or on-demand, cache aggressively.
- **Relative ranking for fairness**: Top 10 is visible, but most users see "percentile rank" instead of absolute number. Tools like Bugcrowd recognize top 1% rather than only the top 10, dramatically improving engagement for mid-tier players.

### Differentiators

- **Time-windowed leaderboards**: Daily/weekly/seasonal boards reset, allowing new creators to compete fairly. Keeps the leaderboard "fresh" and prevents dominance by early movers.
- **Trending/momentum boards**: Separate board showing biggest gainers this week (by score delta) rather than absolute scores. Users care about relative progress.
- **"Follow" a category to get digest**: Email/in-app digest of top ideas in a niche the user follows. Drives discovery and repeat visits.
- **Reverse leaderboard**: Lowest-scoring viable ideas (ideas that barely made sense but the founder was passionate). Tells a narrative of persistence and iteration.
- **Weighted scoring visibility**: Show the breakdown (Phase 1: 4/5 @ 30%, Phase 2: 3/5 @ 25%…). Transparency into how an idea placed.

### Anti-Features (avoid)

- **Global, unfiltered leaderboard**: Too noisy. Fintech and EdTech ideas are incomparable; grouping them creates meaningless rankings.
- **One-click sorting** (avoid excessive sorts): More than 3 sort options is clutter. Pick: score, date, trending.
- **Showing everyone's private validations**: If a validation is private, it should not appear on a leaderboard. Respect user intent.
- **Real-time leaderboard updates every second**: Causes "jitter"—rank constantly changes, which frustrates users and wastes bandwidth. Batch updates every 5–15 min.
- **Rank tiers that are too fine-grained**: 10 tiers instead of 3–5 is cognitive overload.

---

## Niche Auto-Detection

### Table Stakes

- **Secondary Claude call on validation**: After the main validation completes, make a lightweight follow-up call asking the model to classify the idea into one of 8 fixed categories (Fintech, Logistics, Creator Economy, PropTech, HealthTech, EdTech, Other, Not Clear). Store this as `niche: enum` in the database.
- **Consistent taxonomy**: Fixed set of categories (not free-text tags). This enables filtering/bucketing without exploding cardinality.
- **User can override**: Allow manual niche selection before submission if the auto-detection is wrong. Users know their space better than the model.
- **Store confidence score**: The model's confidence in the classification (if API provides it or you parse it from the response). Show low-confidence categories as suggestions, not hard facts.
- **Lazy computation**: Auto-detect only on new validations, not retroactively on old ones (unless explicitly triggered by user). Avoid batch-recomputing the entire history.

### Differentiators

- **Sub-niches**: If Fintech gets large, split into FinTech/Personal, FinTech/SMB, FinTech/Enterprise. Tag ideas with parent + child.
- **Niche emergence detection**: Track which `Other` ideas cluster together semantically. If 10+ `Other` ideas are about "AI code review," recommend creating a new niche category.
- **Niche-specific frameworks**: Future feature—customize the 30-step framework for each niche (e.g., regulatory hurdles unique to FinTech). Display niche-aware scoring.
- **Trending niche indicators**: Show which niches had the most validations this week. Founder psychology: "EdTech is hot right now."

### Anti-Features (avoid)

- **Too many categories**: More than 8–10 makes the taxonomy unmanageable and confuses users.
- **Forced niche selection at input time**: Users don't always know their category before validation. Detect after, show a confirmation dialog.
- **Niche mutations**: Once an idea is assigned a niche, don't change it without asking the user. Switching categories breaks leaderboard stability.
- **Niche field visible on the form**: Hidden from the creator until after validation; otherwise it becomes a checkbox that distracts from the idea itself.
- **Storing raw NLP classification scores**: Users don't care about the model's logits. Store only: category + (optional) confidence (high/medium/low).

---

## Idea Versioning

### Table Stakes

- **Similarity detection on input**: When a logged-in user submits a new idea, compute embedding-based similarity (or even simpler: substring + semantic check via Claude) against all previous validations by that user. If >70% similar, prompt: "You've validated a very similar idea before. Link this as a revision of [Previous Idea #123]?"
- **Revision chain storage**: Instead of separate idea records, store revisions as a tree/graph: idea → revision 1 → revision 2. Each revision has its own validation result, date, and score.
- **Per-phase score delta**: Display "+0.5 vs Phase 1 of v1" for each phase. Founders see if their revision addressed specific weaknesses.
- **Linked revisions appear on profile**: User profiles show the full chain, not just latest idea. "This idea has been through 3 iterations, currently at 4.2/5."
- **User can choose not to link**: The prompt is optional. If a user wants two separate ideas that happen to be similar, they can keep them unlinked.

### Differentiators

- **Automatic linking without user prompt**: For power users who trust the system, auto-link if similarity >85%. Show a retroactive notification: "We detected v2 of your earlier idea—it's now linked."
- **Similarity-to-others detection**: Show if this idea is similar to *someone else's* (public) validation. Prompt: "Similar idea by @founder_x scored 4.1/5 in the same niche. See how they differed?" Encourages exploration, not accusation.
- **Visual diff of idea text**: Side-by-side view of "v1 idea text" vs "v2 idea text" with word-level diff highlighting. Clarifies what changed between versions.
- **Score trajectory visualization**: Chart showing score trend across revisions (v1: 2.8, v2: 3.5, v3: 4.1). Motivates iterators.
- **Suggest revision focus**: After v1 validation scores Phase 3 at 2/5 but other phases at 4+, prompt on next submission: "Your last validation was weak on Phase 3 (Product & Agent Architecture). Have you refined this?"

### Anti-Features (avoid)

- **Auto-merging revisions silently**: Users should explicitly consent to linking. Surprise merges destroy trust.
- **Deleting old revisions**: Archive, never delete. Users want to see the journey, not be reminded of past bad ideas.
- **Too-aggressive similarity detection**: If >50% triggers a prompt, users get fatigued. Use a higher bar (70%+).
- **Forcing a linear chain**: Real iteration is sometimes non-linear (branch into 2 different directions). Allow DAG/tree structures, not just chains.
- **Showing revision links on public leaderboard**: Only show the *best scoring version* on the public board. Revision history is private/profile-only.

---

## User Profiles

### Table Stakes

- **Public profile page** (`/profile/:username`): Shows display name, avatar, bio, public validations, stats (ideas submitted, avg score, niche breakdown), and badges/achievements.
- **Validations list with filtering**: Show all public validations by that user, filterable by niche. Reverse-chronological, paginated (50 per page).
- **Stats card**: Total ideas, average score, highest-scoring idea, most-used niche, ideas in top 10 of any leaderboard.
- **Achievements/badges**: Visual badges for milestones (first validation, 5 validations, 4.5+ avg score, top 10 in a niche). Non-numeric, reachable by many.
- **Revision chains visible**: If a user has linked revisions, show the chain. Visitors see the full iteration story, not just the latest idea.
- **Can only see public validations**: Private ideas don't appear on the profile.

### Differentiators

- **"Influencer" badges**: High-quality validations get upvoted or shared. Track community signals (saves, replies) and award badges based on contribution quality, not just count.
- **Niche expertise badges**: If you have >3 validations in a niche and average >4.0 in that niche, get the "Fintech Expert" badge. Gives context to your rankings.
- **Leaderboard appearances**: Show which leaderboards (niches) the user appears in and their rank. "Top 5% in EdTech, Top 12% in Creator Economy."
- **Follower count and "Follow" button**: Users can follow creators they like, get email digests of their new validations.
- **Bio/linked social**: User edits profile to add short bio, Twitter handle, founder website. Small but humanizes the leaderboard.
- **Activity feed**: Recent validations, revisions, badge unlocks. Generates a narrative of progress.

### Anti-Features (avoid)

- **Showing email or private info**: Never expose contact details on public profiles.
- **Username permanence without warning**: If a user changes their username, old profile links break. Consider slugs or UUIDs in the URL, display the current username.
- **Fake achievements**: Badges without clear criteria feel cheap. Only award for measurable milestones.
- **Comparing users side-by-side**: Avoid "who is better?" comparisons. Leaderboards are enough; profile pages are about individuals.
- **Profile stats that are slow to compute**: If fetching a profile requires aggregating 1000 ideas, cache the stats. Update on idea submission, not on profile view.
- **Showing private stats**: Don't reveal "you are 83rd on the Fintech leaderboard" if leaderboards are public. Show only public rank.

---

## "Beat the Leaderboard" Challenge Cards

### Table Stakes

- **Challenge card component**: Displays "Top score in [Niche]: 4.8/5 by @founder_x" with a small thumbnail of their highest-scoring idea in that niche. CTA: "Can you beat this? Validate an idea →"
- **Niche-specific targeting**: Show challenges only in niches where the user has not yet submitted ideas. Encourages exploration into new niches.
- **Placed strategically**: On the home page (between hero and input) or in the "Explore" section. Not on every page (clutter).
- **Rotating challenges**: Show different challenge each visit (or daily). Variety drives repeat engagement.
- **Click through to leaderboard**: Clicking the card filters the leaderboard to that niche and scrolls to the top performer.

### Differentiators

- **Personalized challenges**: "Your personal best in Fintech is 3.2. Can you beat it?" Targets the user's own record, not just global leaderboards.
- **Social proof snippet**: "22 founders have validated ideas in EdTech this month. How do you rank?" FOMO + community feel.
- **Progressive difficulty**: Show the challenge that's 1 step above your current best in that niche. "You scored 4.1 in Creator Economy. Here's a 4.5 to beat."
- **Challenge streak**: "You've beaten the record 2 weeks in a row in EdTech 🔥" Reinforce behavior.
- **Time-limited challenges**: "This week's Fintech record is X. Next week it might change." Creates urgency.

### Anti-Features (avoid)

- **Showing the full challenge card when user already beaten it**: If user has a 4.9 in Fintech, don't show "Beat 4.8." They've succeeded. Show "You're #1 in Fintech 🏆" instead.
- **Too many challenges on screen**: 1–2 max. More than that is visual noise and dilutes the CTA.
- **Challenge tied to a specific founder**: "Beat @founder_x" creates a weird rivalry framing. Neutral framing: "Top score in Fintech" without naming.
- **Challenges that are impossible**: If the top score is 5.0, don't show "Beat this." Show "Top-tier idea in [Niche]—see what excellence looks like."
- **No feedback after beating a challenge**: If user beats a challenge, acknowledge it (badge, notification, leaderboard jump). Silence kills motivation.

---

## Dependencies on Existing Features

1. **Auth system** (existing): Required for user profiles, private/public validations, and tracking revision history.
2. **Streaming validation** (existing): Niche auto-detection adds a *second* streaming call after the main validation. Must not block the UI.
3. **PostgreSQL history** (existing): Leaderboard, profile, and versioning all query the ideas/validations table. Schema must support niche enum, revision linking, and public/private flags.
4. **Public share links** (existing): Profiles leverage shared idea URLs. Must ensure shared links respect public/private setting.

---

## Complexity & Implementation Order

### Phase 1 (Leaderboard + Niche Auto-Detection) — High-ROI, Medium Complexity
- Add `niche` enum and `is_public` boolean to the `validations` table
- Add secondary Claude call after main validation (small token cost, ~20 tokens)
- Create `/api/leaderboard?niche=Fintech&sort=score` endpoint
- Build leaderboard UI component with filtering
- **Timeline**: 1–2 weeks (endpoints + UI)

### Phase 2 (Idea Versioning + Similarity) — Medium-ROI, High Complexity
- Compute embeddings for all historical ideas (or use Claude embeddings API)
- Add revision linking in schema + UI
- Similarity detection on form submission
- **Timeline**: 2–3 weeks (embedding setup, detection logic, UI flow)

### Phase 3 (User Profiles) — High-ROI, Low-to-Medium Complexity
- Create profile table (display_name, avatar, bio)
- Build `/profile/:username` page
- Wire up stats queries
- **Timeline**: 1–1.5 weeks (schema + page + queries)

### Phase 4 (Challenge Cards + Badges) — Medium-ROI, Low Complexity
- Hardcode badge rules (or use a config file)
- Create challenge card component + logic
- **Timeline**: 1 week (UI + simple logic)

---

## Sources

- [Leaderboard Design Strategies](https://www.numberanalytics.com/blog/leaderboard-design-strategies)
- [Leaderboards Best Practices - Heroic Labs Documentation](https://heroiclabs.com/docs/nakama/concepts/leaderboards/best-practices/)
- [Best Gamification Examples In SaaS](https://userpilot.com/blog/gamification-example-saas/)
- [Gamification in Product Design in 2025 (UI/UX)](https://arounda.agency/blog/gamification-in-product-design-in-2024-ui-ux)
- [35 Best SaaS Profile Page Design Examples](https://arounda.agency/blog/profile-page-design)
- [20 Filter UI Examples for SaaS: Design Patterns & Best Practices](https://arounda.agency/blog/filter-ui-examples)
- [Semantic Similarity Detection and Analysis For Text Documents](https://ieeexplore.ieee.org/document/10493834/)
- [Top 10 Tools for Calculating Semantic Similarity](https://www.pingcap.com/article/top-10-tools-for-calculating-semantic-similarity/)
- [GitHub Achievements](https://githubachievements.com/)
- [31 Best Idea Management Tools For Stakeholders In 2026](https://cpoclub.com/tools/best-idea-management-software/)
- [Control Project Visibility - Lovable Documentation](https://docs.lovable.dev/features/project-visibility)
- [Filter UX Design: Best Practices for SaaS Product Success - Lollypop](https://lollypop.design/blog/2025/july/filter-ux-design/)
