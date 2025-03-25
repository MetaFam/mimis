class CreateBooks < ActiveRecord::Migration[6.0]
  def change
    create_table :books do |t|
      t.references :author, null: true, foreign_key: true
      t.references :title, null: false, foreign_key: true

      t.timestamps
    end
  end
end
