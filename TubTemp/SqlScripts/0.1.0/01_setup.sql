create schema student;
create schema admin;
create schema lookup;

create table student.student(
	id serial primary key,
	first_name text not null,
  last_name text not null,
	key_id text not null,
  is_active boolean not null default true,
	date_created timestamp with time zone not null default CURRENT_TIMESTAMP,
	last_updated timestamp with time zone not null default CURRENT_TIMESTAMP
);

create table admin.user(
	id serial primary key,
	email text not null unique,
  first_name text not null,
  last_name text not null,
	password text not null,
  salt text not null,
  is_active boolean not null default true,
	date_created timestamp with time zone not null default CURRENT_TIMESTAMP,
	last_updated timestamp with time zone not null default CURRENT_TIMESTAMP,
  last_login timestamp with time zone
);
create table lookup.time_period (
  id serial primary key,
  period_name text not null,
  is_active boolean not null default true,
	date_created timestamp with time zone not null default CURRENT_TIMESTAMP,
	last_updated timestamp with time zone not null default CURRENT_TIMESTAMP
);

create table lookup.day_of_week(
	id int,
	short text not null primary key,
	long text not null
);

insert into lookup.day_of_week values
(0, 'Sun', 'Sunday'),
(1, 'Mon', 'Monday'),
(2, 'Tue', 'Tuesday'),
(3, 'Wed', 'Wednesday'),
(4, 'Thur', 'Thursday'),
(5, 'Fri', 'Friday'),
(6, 'Sat', 'Saturday');

create table admin.bell_schedule(
	id serial primary key,
  period_id int not null references lookup.time_period,
  day_of_week text not null references lookup.day_of_week,
	start_time time without time zone not null,
	end_time time without time zone not null,
	date_created timestamp with time zone not null default CURRENT_TIMESTAMP,
	last_updated timestamp with time zone not null default CURRENT_TIMESTAMP
);

create table student.student_time_period (
	student_id int references student.student not null,
	period_id int references lookup.time_period not null,
	date_created timestamp with time zone not null default CURRENT_TIMESTAMP,
	last_updated timestamp with time zone not null default CURRENT_TIMESTAMP
);


create table student.student_access(
	student_key text not null,
	student_id int references student.student,
	success boolean not null,
	date_created timestamp with time zone not null default CURRENT_TIMESTAMP,
	last_updated timestamp with time zone not null default CURRENT_TIMESTAMP
);




create schema Logging;

drop table if exists logging.winstonLogging cascade;
drop table if exists logging.level;

create table logging.level
(
  id smallint not null,
  level varchar(20) not null,
  nodeLevel varchar(10) not null,
  constraint pk_logging_level_id primary key(id),
  constraint uk_logging_level_level unique(nodeLevel)
);

create table logging.winstonLogging
(
  id serial not null,
  level smallint not null,
  message text not null,
  host text null,
  pid integer null,
  meta json not null,
  timestamp timestamp without time zone DEFAULT now() not null,
  constraint pk_logging_winston_logging_id primary key(id),
  constraint fk_logging_level foreign key (level) REFERENCES logging.level(id)
);

create index idx_logging_winstonLogging_level_message
on logging.winstonLogging(level, message);

create or replace function logging.addLog(nodeLevel varchar(10), message text, host text, pid integer, meta json)
returns integer as
$$
  insert into logging.winstonLogging(level, message, host, meta)
  select id, message, host, meta
  from logging.level l
  where l.nodeLevel = nodeLevel
  limit 1
  returning id;
$$
language sql volatile;
