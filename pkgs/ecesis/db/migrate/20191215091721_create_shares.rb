class CreateShares < ActiveRecord::Migration[6.0]
  def change
    create_table :shares do |t|
      t.references :server, null: false, foreign_key: true
      t.references :directory, null: false, foreign_key: true
      t.references :data, null: false, foreign_key: true
      t.string :size

      t.timestamps
    end
  end
end
