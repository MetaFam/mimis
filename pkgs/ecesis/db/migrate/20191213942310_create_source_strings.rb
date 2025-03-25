class CreateSourceStrings < ActiveRecord::Migration[6.0]
  def change
    create_table :source_strings do |t|
      t.text :text

      t.timestamps
    end
  end
end
