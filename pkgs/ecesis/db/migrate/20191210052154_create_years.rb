class CreateYears < ActiveRecord::Migration[6.0]
  def change
    create_table :years do |t|
      t.integer :number

      t.timestamps
    end
  end
end
