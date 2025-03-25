class CreatePaths < ActiveRecord::Migration[6.0]
  def change
    create_table :paths do |t|
      t.string :elements, array: true, default: []
      t.string :serialization

      t.timestamps
    end
  end
end
