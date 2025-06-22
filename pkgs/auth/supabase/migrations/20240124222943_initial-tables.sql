CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  title text NOT NULL,
  description text,
  url text NOT NULL,
  creator_id uuid DEFAULT auth.uid() NOT NULL,
  slug text,
  duration time NOT NULL,
  recorded_at timestamp with time zone,

  CONSTRAINT videos_creator_id_fkey FOREIGN KEY (creator_id)
    REFERENCES auth.users(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  image text NOT NULL,
  name text NOT NULL,
  description text,
  creator_id uuid DEFAULT auth.uid() NOT NULL,

  CONSTRAINT feedbacks_creator_id_fkey FOREIGN KEY (creator_id)
    REFERENCES auth.users(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  reactor_id uuid DEFAULT auth.uid() NOT NULL,
  video_id uuid NOT NULL,
  feedback_id uuid NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  initial_x int4 NOT NULL,
  initial_y int4 NOT NULL,

  CONSTRAINT reactions_reactor_id_fkey FOREIGN KEY (reactor_id)
    REFERENCES auth.users(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT reactions_video_id_fkey FOREIGN KEY (video_id)
    REFERENCES videos(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT reactions_feedback_id_fkey FOREIGN KEY (feedback_id)
    REFERENCES feedbacks(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  phrase text NOT NULL,
  weight double precision NOT NULL,
  feedback_id uuid NOT NULL,
  creator_id uuid DEFAULT auth.uid() NOT NULL,

  CONSTRAINT evaluations_feedback_id_fkey FOREIGN KEY (feedback_id)
    REFERENCES feedbacks(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT evaluations_creator_id_fkey FOREIGN KEY (creator_id)
    REFERENCES auth.users(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
);
