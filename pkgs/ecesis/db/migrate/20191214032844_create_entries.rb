class CreateEntries < ActiveRecord::Migration[6.0]
  def change
    create_table :entries do |t|
      t.references :source_string, null: true, foreign_key: true
      t.references :award, null: false, foreign_key: true
      t.references :category, null: false, foreign_key: true
      t.references :year, null: false, foreign_key: true
      t.boolean :won
      t.integer :nominee_id, null: true, foreign_key: true

      t.timestamps
    end
  end
end
