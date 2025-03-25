class RmNotNullFromEntrySource < ActiveRecord::Migration[6.0]
  def change
    change_column_null :entries, :source_string_id, true
  end
end
