CREATE TABLE IF NOT EXISTS feedback_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  title text NOT NULL,
  description text,
  creator_id uuid DEFAULT auth.uid() NOT NULL,

  CONSTRAINT feedback_groups_creator_id_fkey FOREIGN KEY (creator_id)
    REFERENCES auth.users(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedbacks_groups (
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  creator_id uuid DEFAULT auth.uid() NOT NULL,
  group_id uuid NOT NULL,
  feedback_id uuid NOT NULL,

  CONSTRAINT feedbacks_groups_creator_id_fkey FOREIGN KEY (creator_id)
    REFERENCES auth.users(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT feedbacks_groups_group_id_fkey FOREIGN KEY (group_id)
    REFERENCES feedback_groups(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT feedbacks_groups_feedback_id_fkey FOREIGN KEY (feedback_id)
    REFERENCES feedbacks(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  PRIMARY KEY(group_id, feedback_id)
);

CREATE TABLE IF NOT EXISTS feedback_groups_videos (
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  creator_id uuid DEFAULT auth.uid() NOT NULL,
  group_id uuid NOT NULL,
  video_id uuid NOT NULL,

  CONSTRAINT feedback_groups_videos_creator_id_fkey FOREIGN KEY (creator_id)
    REFERENCES auth.users(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT feedback_groups_videos_group_id_fkey FOREIGN KEY (group_id)
    REFERENCES feedback_groups(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT feedback_groups_videos_video_id_fkey FOREIGN KEY (video_id)
    REFERENCES videos(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  PRIMARY KEY(group_id, video_id)
);
