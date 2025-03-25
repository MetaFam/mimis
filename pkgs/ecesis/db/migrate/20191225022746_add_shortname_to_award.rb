class AddShortnameToAward < ActiveRecord::Migration[6.0]
  def change
    add_column :awards, :shortname, :string
  end
end
