class CreateFilenames < ActiveRecord::Migration[6.0]
  def change
    create_table :filenames do |t|
      t.string :name

      t.timestamps
    end
  end
end
