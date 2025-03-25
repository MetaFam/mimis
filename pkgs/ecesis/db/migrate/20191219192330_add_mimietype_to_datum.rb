class AddMimietypeToDatum < ActiveRecord::Migration[6.0]
  def change
    add_column :data, :mimetype, :string
  end
end
