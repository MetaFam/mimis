class AddFilenameToShare < ActiveRecord::Migration[6.0]
  def change
    add_reference :shares, :filename, null: false, foreign_key: true
  end
end
