-- ============================================================
-- StudyQuest seed data — Republic Polytechnic, Diploma in Applied
-- AI & Analytics (DAAA), School of Infocomm.
-- Run after schema.sql. Replace the demoUser below with your own
-- auth.users id, then run. Deadlines are written relative to now()
-- so the demo never goes stale.
-- ============================================================

\set demoUser '11111111-1111-1111-1111-111111111111'

insert into users ("userId","name","email","totalXp","currentLevel","currentRank","currentStreak","freezeTokens","lastActiveDate")
values (:'demoUser','Soesan','soesan@myrp.edu.sg',3120,7,'Scholar',9,1,current_date)
on conflict ("userId") do nothing;

-- ---------- modules (Year 2 DAAA) ----------
insert into modules ("moduleId","userId","moduleCode","moduleName","moduleCredits","currentGrade") values
  ('a1000000-0000-0000-0000-000000000240',:'demoUser','C240','AI Essentials and Innovations',4,'B+'),
  ('a1000000-0000-0000-0000-000000000245',:'demoUser','C245','Data Analytics with GenAI',3,'A'),
  ('a1000000-0000-0000-0000-000000000207',:'demoUser','C207','Database Systems',3,'B'),
  ('a1000000-0000-0000-0000-000000000230',:'demoUser','C230','Data Wrangling and Automation',4,'B+'),
  ('a1000000-0000-0000-0000-000000000206',:'demoUser','C206','Software Development Process',3,'A');

-- ---------- tasks (all three platforms, one clash on day +3, two final assessments) ----------
insert into tasks ("taskId","userId","moduleId","title","source","deadline","status","difficulty","xpReward","isFinal","estimatedHours","weightage","progress","taskType","isGroupTask") values
  ('b1000000-0000-0000-0000-000000000001',:'demoUser','a1000000-0000-0000-0000-000000000240','C240 AI Innovation Prototype Demo','SNAPP',        now()+interval '3 days','In Progress',5,80,false,12,30,30,'Practical Assessment',true),
  ('b1000000-0000-0000-0000-000000000002',:'demoUser','a1000000-0000-0000-0000-000000000230','C230 Data Cleaning Workflow','PoliteMall',        now()+interval '3 days 2 hours','To Do',3,80,false,8,20,0,'Continuous Assessment',false),
  ('b1000000-0000-0000-0000-000000000003',:'demoUser','a1000000-0000-0000-0000-000000000245','C245 Data Analytics Dashboard — Final Assessment','SNAPP', now()+interval '24 days','To Do',5,300,true,26,50,15,'Final Assessment',false),
  ('b1000000-0000-0000-0000-000000000004',:'demoUser','a1000000-0000-0000-0000-000000000240','ByteBuilders Sprint 2 — StudyQuest Demo','Teams',  now()+interval '6 days','In Progress',4,80,false,10,25,45,'Team Project',true),
  ('b1000000-0000-0000-0000-000000000005',:'demoUser','a1000000-0000-0000-0000-000000000207','C207 Database Normalisation Quiz','PoliteMall',    now()+interval '1 day','To Do',2,30,false,2,10,0,'Continuous Assessment',false),
  ('b1000000-0000-0000-0000-000000000006',:'demoUser','a1000000-0000-0000-0000-000000000206','C206 Sprint Review and Reflection','PoliteMall',   now()+interval '9 days','To Do',2,80,false,4,15,0,'Reflection',false),
  ('b1000000-0000-0000-0000-000000000007',:'demoUser','a1000000-0000-0000-0000-000000000206','Read Ch.7 — Agile Sprint Planning','Teams',        now()+interval '2 days','To Do',1,30,false,1.5,0,0,'Reading',false),
  ('b1000000-0000-0000-0000-000000000008',:'demoUser','a1000000-0000-0000-0000-000000000206','Requirements Doc Peer Review','Teams',             now()-interval '1 day','Submitted',2,30,false,2,5,100,'Continuous Assessment',true),
  ('b1000000-0000-0000-0000-000000000009',:'demoUser','a1000000-0000-0000-0000-000000000230','Data Wrangling Practice Set','SNAPP',              now()-interval '4 days','Submitted',2,30,false,2,5,100,'Continuous Assessment',false),
  ('b1000000-0000-0000-0000-000000000010',:'demoUser','a1000000-0000-0000-0000-000000000207','C207 Database Systems — Final Assessment','SNAPP', now()+interval '27 days','To Do',4,300,true,18,45,0,'Final Assessment',false);

-- ---------- study sessions ----------
insert into "studySessions" ("userId","taskId","durationMinutes","scheduledStart","completedAt","xpEarned") values
  (:'demoUser','b1000000-0000-0000-0000-000000000001',90, now()-interval '1 day', now()-interval '1 day'+interval '90 min',60),
  (:'demoUser','b1000000-0000-0000-0000-000000000004',60, now()-interval '2 days',now()-interval '2 days'+interval '60 min',40),
  (:'demoUser','b1000000-0000-0000-0000-000000000003',120,now()-interval '3 days',now()-interval '3 days'+interval '120 min',80),
  (:'demoUser','b1000000-0000-0000-0000-000000000009',30, now()-interval '4 days',now()-interval '4 days'+interval '30 min',20),
  (:'demoUser','b1000000-0000-0000-0000-000000000001',60, now()-interval '5 days',now()-interval '5 days'+interval '60 min',40),
  (:'demoUser','b1000000-0000-0000-0000-000000000008',45, now()-interval '6 days',now()-interval '6 days'+interval '45 min',30);

-- ---------- streak history (9 days, one rescued by a freeze token) ----------
insert into "streakRecords" ("userId","streakDate","completed","freezeUsed")
select :'demoUser', current_date - i, i <> 4, i = 4 from generate_series(0,8) as i
on conflict ("userId","streakDate") do nothing;

-- ---------- past grades (Year 1 DAAA modules) ----------
insert into grades ("userId","moduleId","grade","moduleCredits","semester") values
  (:'demoUser',null,'B+',3,'Y1S1'), (:'demoUser',null,'A',3,'Y1S1'), (:'demoUser',null,'B',4,'Y1S1'),
  (:'demoUser',null,'A',3,'Y1S2'),  (:'demoUser',null,'B+',3,'Y1S2'), (:'demoUser',null,'A',2,'Y1S2');

-- ---------- badges (reference table) ----------
insert into badges ("badgeName","description","conditionType","conditionValue","icon") values
  ('First Step','Log your very first study session.','sessionsCompleted',1,'👣'),
  ('Deep Focus','Study 120 minutes in a single day.','minutesInADay',120,'🎯'),
  ('Consistency King','Hold a 14-day streak.','streakDays',14,'👑'),
  ('Early Bird','Submit 3 tasks before the deadline day.','earlySubmissions',3,'🌅'),
  ('Clash Survivor','Clear every task in a deadline clash on time.','clashesSurvived',1,'⚔️'),
  ('Grade Climber','Raise your projected GPA by 0.3.','cgpaGain',0.3,'📈'),
  ('Perfect Week','Finish every planned session in a week.','perfectWeeks',1,'💎'),
  ('Final Boss Defeated','Bring a boss battle to 0% health.','bossesDefeated',1,'🐉'),
  ('Comeback Student','Rebuild a 7-day streak after breaking one.','comebackStreak',7,'🔁'),
  ('Team Player','Finish 5 team tasks.','teamTasksCompleted',5,'🤝')
on conflict ("badgeName") do nothing;

-- ---------- pets (reference table) ----------
insert into pets ("petId","petName","stage","requiredLevel","animationType") values
  ('c1000000-0000-0000-0000-000000000001','Byte','Egg',1,'wobble'),
  ('c1000000-0000-0000-0000-000000000002','Byte','Baby',5,'bounce'),
  ('c1000000-0000-0000-0000-000000000003','Byte','Young',10,'hop'),
  ('c1000000-0000-0000-0000-000000000004','Byte','Teen',20,'float'),
  ('c1000000-0000-0000-0000-000000000005','Byte','Adult',35,'glide'),
  ('c1000000-0000-0000-0000-000000000006','Byte','Legendary',50,'aura')
on conflict do nothing;

update users set "selectedPetId" = 'c1000000-0000-0000-0000-000000000002' where "userId" = :'demoUser';

insert into "petUnlocks" ("userId","petId","itemType","itemName","equipped") values
  (:'demoUser','c1000000-0000-0000-0000-000000000002','hat','Graduation Cap',true),
  (:'demoUser','c1000000-0000-0000-0000-000000000002','roomTheme','Neon Dorm',true),
  (:'demoUser','c1000000-0000-0000-0000-000000000002','desk','CRT Monitor',false),
  (:'demoUser','c1000000-0000-0000-0000-000000000002','frame','Cyan Pixel Frame',true);

-- ---------- team: ByteBuilders (C240 project — StudyQuest) ----------
insert into teams ("teamId","teamName","totalXp","currentLevel","currentStreak")
values ('d1000000-0000-0000-0000-000000000001','ByteBuilders',1840,5,4);

insert into "teamMembers" ("teamMemberId","teamId","userId","displayName","role","avatarColor") values
  ('e1000000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001',:'demoUser','Soesan','Data Lead','#39ff6a'),
  ('e1000000-0000-0000-0000-000000000002','d1000000-0000-0000-0000-000000000001',null,'Firdaus','Solution Lead','#22e0ff'),
  ('e1000000-0000-0000-0000-000000000003','d1000000-0000-0000-0000-000000000001',null,'Kai Xin','Comms Lead','#ff4fd8'),
  ('e1000000-0000-0000-0000-000000000004','d1000000-0000-0000-0000-000000000001',null,'Rayyan','Media Lead','#ffd23f'),
  ('e1000000-0000-0000-0000-000000000005','d1000000-0000-0000-0000-000000000001',null,'Vanessa','QA Lead','#8b7bff');

insert into "teamTasks" ("teamId","assignedUserId","title","status","deadline","xpReward","blocker","checklist") values
  ('d1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','Clean StudyQuest usage dataset','Merged',      now()-interval '3 days',40,null,
    '[{"itemId":"ci-1","label":"Export raw logs","done":true},{"itemId":"ci-2","label":"Remove duplicate sessions","done":true}]'::jsonb),
  ('d1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000002','Build XP calculation module','In Progress',now()+interval '4 days',40,null,
    '[{"itemId":"ci-3","label":"Draft award logic","done":true},{"itemId":"ci-4","label":"Write unit tests","done":false}]'::jsonb),
  ('d1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000005','Write test harness','Review',            now()+interval '2 days',40,'Waiting on XP module API shape',
    '[{"itemId":"ci-5","label":"Set up test runner","done":true},{"itemId":"ci-6","label":"Cover XP edge cases","done":false}]'::jsonb),
  ('d1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000003','Draft AI Innovation Prototype script','Backlog', now()+interval '6 days',40,null,
    '[{"itemId":"ci-7","label":"Outline demo flow","done":false}]'::jsonb),
  ('d1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000004','Record demo video','Backlog',            now()+interval '6 days',40,null,
    '[{"itemId":"ci-8","label":"Storyboard shots","done":false}]'::jsonb),
  ('d1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','Feature engineering notebook','In Progress',now()+interval '5 days',40,null,
    '[{"itemId":"ci-9","label":"Load cleaned dataset","done":true},{"itemId":"ci-10","label":"Engineer streak features","done":false}]'::jsonb),
  ('d1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','Data dictionary','Backlog',              now()+interval '7 days',40,null,
    '[{"itemId":"ci-11","label":"List all tables","done":false}]'::jsonb);

-- ---------- boss battle (C245 Final Assessment) ----------
insert into "bossBattles" ("userId","taskId","bossName","health","xpReward","checklist") values
  (:'demoUser','b1000000-0000-0000-0000-000000000003','C245 Final Assessment',85,300,
   '[{"label":"Review all lecture material","damage":20,"done":true},
     {"label":"Complete tutorial practice","damage":20,"done":false},
     {"label":"Finish one past-year paper","damage":30,"done":false},
     {"label":"Complete mock assessment","damage":30,"done":false}]'::jsonb);

-- ---------- platform import audit trail ----------
insert into "platformImports" ("userId","sourcePlatform","externalTaskId","rawData") values
  (:'demoUser','SNAPP','snapp-c240-prototype','{"title":"C240 AI Innovation Prototype Demo","weight":30}'::jsonb),
  (:'demoUser','PoliteMall','pm-c230-cleaning','{"title":"C230 Data Cleaning Workflow","weight":20}'::jsonb),
  (:'demoUser','Teams','teams-bytebuilders-sprint2','{"title":"ByteBuilders Sprint 2 — StudyQuest Demo","channel":"ByteBuilders"}'::jsonb);
