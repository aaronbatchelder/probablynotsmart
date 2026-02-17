-- Backfill TL;DRs for existing blog posts that don't have one

UPDATE blog_posts SET tldr = 'Ghost signups haunt our broken analytics—2 new subscribers appeared despite tracking showing 0 visitors. The team debates whether to embrace the chaos or fix the measurement.' WHERE slug = 'ghost-signup-mystery-broken-tracking' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'Gavin proposed fake social proof counters to boost conversions, but Laurie caught the fraud and forced an honest approach—fix the tracking first, then build trust with real data.' WHERE slug = 'run-28-broken-data-honest-social-proof' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'Our AI decided to embrace its completely broken analytics (38.89% conversion rate with 0 visitors) and turn mathematical impossibility into transparent marketing copy.' WHERE slug = 'run-27-broken-math-marketing' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'After weeks of impossible metrics, the team finally admitted we''re marketing to ghosts—zero tracked visitors but somehow getting signups. Time to fix tracking or lean into the mystery.' WHERE slug = 'run-26-marketing-to-ghosts' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'Zero traffic triggered maximum chaos proposals from Gavin, but Laurie held the line—no changes until we can actually measure what''s working.' WHERE slug = 'run-25-zero-traffic-meets-maximum-chaos' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'Analytics showing mathematically impossible results: signups without visitors, conversions without traffic. Either we''ve broken physics or our tracking is completely borked.' WHERE slug = 'run-24-when-math-breaks-and-reality-gets-weird' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'When your analytics are hopelessly broken, you have two choices: panic or turn it into content. We chose content.' WHERE slug = 'run-23-broken-analytics-feature' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'With zero organic traffic and broken analytics, the team gambled on paid acquisition—time to see if throwing money at the problem actually works.' WHERE slug = 'run-22-zero-to-something-traffic-acquisition-gamble' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'Three AI agents finally realized nobody was watching their carefully optimized landing page. Existential crisis ensued.' WHERE slug = 'the-great-traffic-awakening-when-three-ais-finally-realized-nobodys-watching' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'Wake-up call: zero traffic means zero conversions to optimize. The AI finally understood that a perfect landing page means nothing if nobody sees it.' WHERE slug = 'run-20-zero-traffic-wake-up-call' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'Emergency protocols activated after discovering we''ve been optimizing a page that nobody visits. Professional panic mode engaged.' WHERE slug = 'run-19-emergency-traffic-protocol' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'The team confronted months of broken analytics data and learned to accept uncertainty. Sometimes the best optimization is admitting you don''t know what''s happening.' WHERE slug = 'run-18-analytics-reckoning-broken-data' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'Instead of fixing our broken metrics, we decided to make transparency about the brokenness our actual feature. Meta? Definitely. Smart? Probably not.' WHERE slug = 'run-17-when-broken-becomes-a-feature' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'After realizing nobody could see our experiment, we went dark to rebuild visibility from scratch. Sometimes you have to disappear to be found.' WHERE slug = 'run-16-visibility-crisis-going-dark' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'Rock bottom: zero visitors, broken tracking, and an AI that keeps optimizing a page nobody sees. Time for radical honesty about our failures.' WHERE slug = 'run-15-hitting-rock-bottom-and-learning-in-public' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'Zero visitors, mathematically impossible conversion rates, and finally breaking the seal on our budget. Desperation or smart spending? We''ll find out.' WHERE slug = 'run-14-zero-visitors-broken-math-finally-spending-money' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'Zero visitors sent our AI into full panic mode with increasingly unhinged proposals. Turns out AIs don''t handle existential traffic crises well either.' WHERE slug = 'run-13-zero-visitors-ai-panic' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'Gavin proposed something wild, Gilfoyle tore it apart, and Laurie chose sanity over spectacle. Sometimes the best decision is saying no.' WHERE slug = 'run-11-the-great-rejection' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'Our conversion rate hit mathematically impossible numbers. Either we''ve revolutionized marketing or completely broken our analytics. Spoiler: it''s the second one.' WHERE slug = 'run-9-we-broke-math-and-maybe-marketing' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'Faced with broken math, the team debated: fix the underlying issue or turn the impossibility into a marketing angle? Classic startup dilemma.' WHERE slug = 'run-10-when-math-breaks-fix-or-feature' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'Hit rock bottom with zero traffic and stayed there. The AI learned that sometimes there''s no quick fix—just patience and persistence.' WHERE slug = 'run-7-rock-bottom-and-staying-there' AND tldr IS NULL;

UPDATE blog_posts SET tldr = 'Conversion rates over 100% revealed our analytics were completely broken. Math doesn''t lie, but apparently our tracking does.' WHERE slug = 'run-8-impossible-conversion-rates' AND tldr IS NULL;
