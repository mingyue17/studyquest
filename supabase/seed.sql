-- ============================================================
-- StudyQuest seed data. Run after schema.sql.
-- Replace the userId below with your own auth.users id, then run.
-- Deadlines are written relative to now() so the demo never goes stale.
-- ============================================================

\set demoUser '11111111-1111-1111-1111-111111111111'

insert into users ("userId","name","email","totalXp","currentLevel","currentRank","currentStreak","freezeTokens","lastActiveDate")
values (:'demoUser','Ming','ming@myrp.edu.sg',3120,7,'Scholar',9,1,current_date)
on conflict ("userId") do nothing;

-- ---------- modules ----------
insert into modules ("moduleId","userId","moduleCode","moduleName","academicUnits","currentGrade") values
  ('a1000000-0000-0000-0000-000000002001',:'demoUser','SC2001','Algorithms & Data Structures',4,'B+'),
  ('a1000000-0000-0000-0000-000000002005',:'demoUser','SC2005','Operating Systems',3,'A-'),
  ('a1000000-0000-0000-0000-000000002006',:'demoUser','SC2006','Software Engineering',3,'A'),
  ('a1000000-0000-0000-0000-000000002008',:'demoUser','SC2008','Computer Networks',3,'B'),
  ('a1000000-0000-0000-0000-000000000007',:'demoUser','CC0007','Science & Technology for Humanity',2,'A-');

-- ---------- tasks (all three platforms, one clash on day +3, two finals) ----------
insert into tasks ("taskId","userId","moduleId","title","source","deadline","status","difficulty","xpReward","isFinal","estimatedHours","weightage","progress","taskType","isGroupTask") values
  ('b1000000-0000-0000-0000-000000000001',:'demoUser','a1000000-0000-0000-0000-000000002001','Dijkstra & MST Programming Assignment','SNAPP',      now()+interval '3 days','In Progress',5,80,false,12,25,30,'Assignment',false),
  ('b1000000-0000-0000-0000-000000000002',:'demoUser','a1000000-0000-0000-0000-000000002008','Network Layer Lab Report','PoliteMall',              now()+interval '3 days 2 hours','To Do',3,80,false,8,20,0,'Lab',false),
  ('b1000000-0000-0000-0000-000000000003',:'demoUser','a1000000-0000-0000-0000-000000002001','SC2001 Final Exam','SNAPP',                          now()+interval '24 days','To Do',5,300,true,30,50,15,'Exam',false),
  ('b1000000-0000-0000-0000-000000000004',:'demoUser','a1000000-0000-0000-0000-000000002006','Team5_ECG Sprint 2 Deliverable','Teams',             now()+interval '6 days','In Progress',4,80,false,10,30,45,'Project',true),
  ('b1000000-0000-0000-0000-000000000005',:'demoUser','a1000000-0000-0000-0000-000000002005','Process Scheduling Quiz','PoliteMall',               now()+interval '1 day','To Do',2,30,false,2,10,0,'Quiz',false),
  ('b1000000-0000-0000-0000-000000000006',:'demoUser','a1000000-0000-0000-0000-000000000007','Ethics Reflection Essay','PoliteMall',               now()+interval '9 days','To Do',2,80,false,4,15,0,'Assignment',false),
  ('b1000000-0000-0000-0000-000000000007',:'demoUser','a1000000-0000-0000-0000-000000002005','Read Ch.7 — Deadlocks','Teams',                      now()+interval '2 days','To Do',1,30,false,1.5,0,0,'Reading',false),
  ('b1000000-0000-0000-0000-000000000008',:'demoUser','a1000000-0000-0000-0000-000000002006','Requirements Doc Peer Review','Teams',               now()-interval '1 day','Submitted',2,30,false,2,5,100,'Assignment',true),
  ('b1000000-0000-0000-0000-000000000009',:'demoUser','a1000000-0000-0000-0000-000000002008','Subnetting Practice Set','SNAPP',                    now()-interval '4 days','Submitted',2,30,false,2,5,100,'Quiz',false),
  ('b1000000-0000-0000-0000-000000000010',:'demoUser','a1000000-0000-0000-0000-000000002005','SC2005 Final Exam','SNAPP',                          now()+interval '27 days','To Do',4,300,true,20,45,0,'Exam',false);

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

-- ---------- past grades ----------
insert into grades ("userId","moduleId","grade","academicUnits","semester") values
  (:'demoUser',null,'A-',3,'Y1S1'), (:'demoUser',null,'B+',3,'Y1S1'), (:'demoUser',null,'B',4,'Y1S1'),
  (:'demoUser',null,'A',3,'Y1S2'),  (:'demoUser',null,'B+',3,'Y1S2'), (:'demoUser',null,'A-',2,'Y1S2');

-- ---------- badges (reference table) ----------
insert into badges ("badgeName","description","conditionType","conditionValue","icon") values
  ('First Step','Log your very first study session.','sessionsCompleted',1,'👣'),
  ('Deep Focus','Study 120 minutes in a single day.','minutesInADay',120,'🎯'),
  ('Consistency King','Hold a 14-day streak.','streakDays',14,'👑'),
  ('Early Bird','Submit 3 tasks before the deadline day.','earlySubmissions',3,'🌅'),
  ('Clash Survivor','Clear every task in a deadline clash on time.','clashesSurvived',1,'⚔️'),
  ('Grade Climber','Raise your projected CGPA by 0.3.','cgpaGain',0.3,'📈'),
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

-- ---------- team ----------
insert into teams ("teamId","teamName","totalXp","currentLevel","currentStreak")
values ('d1000000-0000-0000-0000-000000000001','Team5_ECG',1840,5,4);

insert into "teamMembers" ("teamMemberId","teamId","userId","displayName","role") values
  ('e1000000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001',:'demoUser','Ming','Data Lead'),
  ('e1000000-0000-0000-0000-000000000002','d1000000-0000-0000-0000-000000000001',null,'Wei Jie','Solution Lead'),
  ('e1000000-0000-0000-0000-000000000003','d1000000-0000-0000-0000-000000000001',null,'Nadia','Comms'),
  ('e1000000-0000-0000-0000-000000000004','d1000000-0000-0000-0000-000000000001',null,'Arjun','Media'),
  ('e1000000-0000-0000-0000-000000000005','d1000000-0000-0000-0000-000000000001',null,'Shermaine','QA');

insert into "teamTasks" ("teamId","assignedUserId","title","status","deadline","xpReward","blocker") values
  ('d1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','Clean ECG signal dataset','Merged',      now()-interval '3 days',40,null),
  ('d1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000002','Build peak detection module','In Progress',now()+interval '4 days',40,null),
  ('d1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000005','Write test harness','Review',            now()+interval '2 days',40,'Waiting on peak detection API shape'),
  ('d1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000003','Draft sprint 2 report','Backlog',        now()+interval '6 days',40,null),
  ('d1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000004','Record demo video','Backlog',            now()+interval '6 days',40,null),
  ('d1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','Feature engineering notebook','In Progress',now()+interval '5 days',40,null),
  ('d1000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','Data dictionary','Backlog',              now()+interval '7 days',40,null);

-- ---------- boss battle ----------
insert into "bossBattles" ("userId","taskId","bossName","health","xpReward","checklist") values
  (:'demoUser','b1000000-0000-0000-0000-000000000003','SC2001 Final Exam',85,300,
   '[{"label":"Review all lectures","damage":20,"done":true},
     {"label":"Complete tutorial practice","damage":20,"done":false},
     {"label":"Finish one past-year paper","damage":30,"done":false},
     {"label":"Complete mock test","damage":30,"done":false}]'::jsonb);

-- ---------- platform import audit trail ----------
insert into "platformImports" ("userId","sourcePlatform","externalTaskId","rawData") values
  (:'demoUser','SNAPP','snapp-sc2001-a2','{"title":"Dijkstra & MST Programming Assignment","weight":25}'::jsonb),
  (:'demoUser','PoliteMall','pm-sc2008-lab4','{"title":"Network Layer Lab Report","weight":20}'::jsonb),
  (:'demoUser','Teams','teams-ecg-sprint2','{"title":"Team5_ECG Sprint 2 Deliverable","channel":"Team5_ECG"}'::jsonb);
