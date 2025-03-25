class CreateLinks < ActiveRecord::Migration[6.0]
  def change
    create_table :links do |t|
      t.references :book, null: false, foreign_key: true
      t.references :filename, null: false, foreign_key: true

      t.timestamps
    end
  end
end
