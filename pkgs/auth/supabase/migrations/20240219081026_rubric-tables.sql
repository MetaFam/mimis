CREATE TABLE IF NOT EXISTS rubrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  name text NOT NULL,
  default_weight float8 DEFAULT 0 NOT NULL,
  creator_id uuid DEFAULT auth.uid() NOT NULL,

  CONSTRAINT rubrics_creator_id_fkey FOREIGN KEY (creator_id)
    REFERENCES auth.users(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedbacks_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  weight float8 DEFAULT 0 NOT NULL,
  feedback_id uuid NOT NULL,
  rubric_id uuid NOT NULL,

  CONSTRAINT feedbacks_weights_feedback_id_fkey FOREIGN KEY (feedback_id)
    REFERENCES feedbacks(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT feedbacks_weights_rubric_id_fkey FOREIGN KEY (rubric_id)
    REFERENCES rubrics(id) MATCH SIMPLE
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  UNIQUE (feedback_id, rubric_id)
);