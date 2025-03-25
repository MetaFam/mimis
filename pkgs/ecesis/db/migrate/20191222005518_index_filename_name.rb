class IndexFilenameName < ActiveRecord::Migration[6.0]
  def change
    unless reverting?
      execute 'create extension if not exists pg_trgm'

      # https://dba.stackexchange.com/a/145604
      execute "update pg_opclass set opcdefault = true where opcname='gin_trgm_ops'"
    end

    add_index(:filenames, :name, using: :gin)
  end
end
