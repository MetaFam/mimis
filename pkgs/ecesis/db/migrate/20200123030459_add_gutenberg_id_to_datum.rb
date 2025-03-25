class AddGutenbergIdToDatum < ActiveRecord::Migration[6.0]
  def change
    add_column :data, :gutenberg_id, :string
  end
end
