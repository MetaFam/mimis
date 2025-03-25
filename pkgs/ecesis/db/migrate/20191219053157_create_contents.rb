class CreateContents < ActiveRecord::Migration[6.0]
  def change
    create_table :contents do |t|
      t.references :book, null: false, foreign_key: true
      t.references :data, null: false, foreign_key: true

      t.timestamps
    end
  end
end
