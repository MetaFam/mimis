class RmNotNullFromShareData < ActiveRecord::Migration[6.0]
  def change
    change_column_null :shares, :data_id, true
  end
end
